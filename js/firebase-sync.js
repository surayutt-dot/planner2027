// Firebase Realtime Sync Module for Planner
// รองรับการล็อกอินด้วย Google และซิงก์ข้อมูลแบบเรียลไทม์ข้ามเครื่อง (PC ↔ Mobile)

const FirebaseSync = {
  auth: null,
  db: null,
  currentUser: null,
  unsubscribeSnapshot: null,
  isSyncing: false,
  lastLocalSaveTime: 0,

  // Default Firebase configuration (รหัสเชื่อมต่อสำหรับโปรเจกต์ Planner)
  defaultConfig: {
    apiKey: "AIzaSyAqbJ85Saz6io6AMvCtmXcnS9MqlZDGJCw",
    authDomain: "planner-2dff6.firebaseapp.com",
    projectId: "planner-2dff6",
    storageBucket: "planner-2dff6.firebasestorage.app",
    messagingSenderId: "487442851356",
    appId: "1:487442851356:web:26bfc29db066c2f3ba21d9"
  },

  getConfig() {
    if (this.defaultConfig && this.defaultConfig.apiKey) {
      return this.defaultConfig;
    }
    try {
      const saved = localStorage.getItem('planner_firebase_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return this.defaultConfig;
  },

  saveConfig(config) {
    try {
      localStorage.setItem('planner_firebase_config', JSON.stringify(config));
      return true;
    } catch (e) {
      return false;
    }
  },

  hasValidConfig() {
    const cfg = this.getConfig();
    return !!(cfg && cfg.apiKey && cfg.projectId);
  },

  init() {
    if (!this.hasValidConfig()) {
      this.updateUI();
      return;
    }

    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK not loaded yet.');
      return;
    }

    try {
      const config = this.getConfig();
      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }
      this.auth = firebase.auth();
      this.db = firebase.firestore();

      // Enable offline persistence in Firestore
      try {
        this.db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open');
          } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence not supported in this browser');
          }
        });
      } catch (e) {}

      // Listen for auth state changes
      this.auth.onAuthStateChanged(async (user) => {
        this.currentUser = user;
        this.updateUI();
        if (user) {
          console.log('Firebase user signed in:', user.displayName || user.email);

          // Initial sync: fetch cloud data first and merge safely
          try {
            const uid = user.uid;
            const docRef = this.db.collection('users').doc(uid).collection('data').doc('planner');
            const doc = await docRef.get();
            if (doc.exists) {
              const cloudData = doc.data();
              if (cloudData && cloudData.payload && typeof cloudData.payload === 'object') {
                const localData = Storage.getAll();
                // Local data takes precedence on initial conflict
                const merged = { ...cloudData.payload, ...localData };
                localStorage.setItem('planner_2027_data', JSON.stringify(merged));
                if (typeof App !== 'undefined' && App.currentView === 'day') {
                  App.renderDayView();
                }
              }
            } else {
              // Cloud is empty: upload existing local data to cloud
              await this.executeCloudSync();
            }
          } catch (err) {
            console.error('Initial sync error:', err);
          }

          // Start realtime listener after initial merge
          this.startRealtimeListener();
        } else {
          console.log('Firebase user signed out');
          this.stopRealtimeListener();
        }
      });
    } catch (err) {
      console.error('Firebase init error:', err);
    }
  },

  // Sign in with Google Popup
  async signInWithGoogle() {
    if (!this.hasValidConfig()) {
      alert('กรุณากรอกข้อมูล Firebase Config ในหน้าตั้งค่าก่อนเริ่มใช้งานครับ');
      this.openConfigModal();
      return;
    }

    if (!this.auth) {
      this.init();
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await this.auth.signInWithPopup(provider);
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-blocked') {
        this.auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
      } else {
        alert('เข้าสู่ระบบไม่สำเร็จ: ' + (err.message || err.code));
      }
    }
  },

  // Sign Out
  async signOut() {
    if (this.auth) {
      await this.auth.signOut();
      this.currentUser = null;
      this.stopRealtimeListener();
      this.updateUI();
      alert('ออกจากระบบเรียบร้อยแล้ว (ข้อมูลยังคงถูกเก็บไว้ในเครื่องนี้ตามปกติครับ)');
    }
  },

  // Start Realtime Firestore Listener
  startRealtimeListener() {
    if (!this.db || !this.currentUser) return;
    this.stopRealtimeListener();

    const uid = this.currentUser.uid;
    const docRef = this.db.collection('users').doc(uid).collection('data').doc('planner');

    this.unsubscribeSnapshot = docRef.onSnapshot({ includeMetadataChanges: true }, (doc) => {
      if (!doc.exists) return;

      // CRITICAL: Ignore local echo (writes originating from this browser/device)
      if (doc.metadata && doc.metadata.hasPendingWrites) {
        return;
      }

      // If this device is currently writing or made an edit very recently (< 1500ms),
      // ignore snapshot so our local change (such as deleting items) takes precedence
      if (this.isSyncing || (Date.now() - (this.lastLocalSaveTime || 0) < 1500)) {
        return;
      }

      const cloudData = doc.data();
      if (!cloudData || !cloudData.payload || typeof cloudData.payload !== 'object') return;

      const localData = Storage.getAll();
      const cloudPayload = cloudData.payload;

      // Only apply if cloud data is genuinely different
      if (JSON.stringify(localData) === JSON.stringify(cloudPayload)) {
        return;
      }

      const notesArea = document.getElementById('daily-notes-textarea');
      const isTypingNotes = (document.activeElement === notesArea);
      const currentActiveDate = (typeof App !== 'undefined' && App.currentDate) ? App.formatDateKey(App.currentDate) : null;

      // Cloud payload is the source of truth for remote changes (including deletions)
      const dataToSave = { ...cloudPayload };

      // Protect what user is actively typing right now on this screen
      if (isTypingNotes && currentActiveDate && notesArea) {
        if (!dataToSave[currentActiveDate]) {
          dataToSave[currentActiveDate] = { tasks: [], schedule: [], note: notesArea.value, water: 0 };
        } else {
          dataToSave[currentActiveDate].note = notesArea.value;
        }
      }

      // Update LocalStorage directly (DO NOT call Storage.saveAll to avoid infinite sync loop)
      localStorage.setItem('planner_2027_data', JSON.stringify(dataToSave));

      // Re-render UI safely without stealing user focus
      if (typeof App !== 'undefined') {
        if (App.currentView === 'day') {
          if (isTypingNotes) {
            const todayKey = App.formatDateKey(App.currentDate);
            const dayData = Storage.getDayData(todayKey);
            App.renderTaskList(dayData.tasks || []);
            App.renderScheduleList(dayData.schedule || []);
          } else {
            App.renderDayView();
          }
        } else if (App.currentView === 'month') {
          App.renderMonthView();
        } else if (App.currentView === 'year') {
          App.renderYearView();
        }
      }

      console.log('Realtime sync applied from cloud');
    }, (error) => {
      console.error('Realtime listener error:', error);
    });
  },

  stopRealtimeListener() {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
    }
  },

  // Debounced cloud sync: batch rapid local edits (like typing notes or adding tasks)
  syncTimer: null,
  syncLocalToCloud() {
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.executeCloudSync();
    }, 500);
  },

  // Upload local changes to cloud
  async executeCloudSync() {
    if (!this.db || !this.currentUser || this.isSyncing) return;
    this.isSyncing = true;
    this.lastLocalSaveTime = Date.now();

    try {
      const uid = this.currentUser.uid;
      const localData = Storage.getAll();
      const docRef = this.db.collection('users').doc(uid).collection('data').doc('planner');

      await docRef.set({
        payload: localData,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        userEmail: this.currentUser.email || ''
      });

      console.log('Local data pushed to Firebase Cloud successfully');
    } catch (err) {
      console.error('Error syncing to cloud:', err);
    } finally {
      this.isSyncing = false;
    }
  },

  // Update UI Elements in the App
  updateUI() {
    const loginSection = document.getElementById('firebase-login-card');
    const userSection = document.getElementById('firebase-user-card');
    const userAvatar = document.getElementById('firebase-user-avatar');
    const userName = document.getElementById('firebase-user-name');
    const userEmail = document.getElementById('firebase-user-email');
    const headerStatus = document.getElementById('firebase-header-dot');

    if (this.currentUser) {
      if (loginSection) loginSection.style.display = 'none';
      if (userSection) userSection.style.display = 'block';
      if (userAvatar) userAvatar.src = this.currentUser.photoURL || './icons/icon.svg';
      if (userName) userName.textContent = this.currentUser.displayName || 'ผู้ใช้งาน';
      if (userEmail) userEmail.textContent = this.currentUser.email || '';
      if (headerStatus) {
        headerStatus.style.display = 'inline-block';
        headerStatus.title = `ซิงก์เรียลไทม์: ${this.currentUser.email}`;
      }
    } else {
      if (loginSection) loginSection.style.display = 'block';
      if (userSection) userSection.style.display = 'none';
      if (headerStatus) headerStatus.style.display = 'none';
    }
  },

  openConfigModal() {
    const modal = document.getElementById('firebase-config-modal');
    if (modal) {
      const cfg = this.getConfig();
      const input = document.getElementById('firebase-config-json');
      if (input) {
        input.value = JSON.stringify(cfg, null, 2);
      }
      modal.classList.add('open');
    }
  },

  closeConfigModal() {
    const modal = document.getElementById('firebase-config-modal');
    if (modal) modal.classList.remove('open');
  },

  saveConfigFromInput() {
    const input = document.getElementById('firebase-config-json');
    if (!input) return;
    try {
      const parsed = JSON.parse(input.value.trim());
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('ต้องมี apiKey และ projectId เป็นอย่างน้อย');
      }
      this.saveConfig(parsed);
      alert('✓ บันทึกการตั้งค่า Firebase เรียบร้อยแล้ว!');
      this.closeConfigModal();
      this.init();
    } catch (e) {
      alert('รูปแบบ JSON ไม่ถูกต้อง: ' + e.message);
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  // Check if Firebase SDK is ready, then initialize
  if (typeof firebase !== 'undefined') {
    FirebaseSync.init();
  } else {
    // Retry shortly if scripts load asynchronously
    setTimeout(() => {
      if (typeof firebase !== 'undefined') FirebaseSync.init();
    }, 500);
  }
});
