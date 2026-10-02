// Storage helper for Planner 2027
const STORAGE_KEY = 'planner_2027_data';
const SETTINGS_KEY = 'planner_2027_settings';

const Storage = {
  // Get entire dataset
  getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('Error reading storage:', e);
      return {};
    }
  },

  // Save entire dataset
  saveAll(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (typeof FirebaseSync !== 'undefined' && FirebaseSync.currentUser) {
        FirebaseSync.syncLocalToCloud();
      }
      return true;
    } catch (e) {
      console.error('Error saving storage:', e);
      return false;
    }
  },

  // Get data for a specific date (YYYY-MM-DD)
  getDayData(dateStr) {
    const all = this.getAll();
    return all[dateStr] || {
      tasks: [],
      schedule: [],
      note: "",
      water: 0
    };
  },

  // Save data for a specific date
  saveDayData(dateStr, dayData) {
    const all = this.getAll();
    // Check if day is effectively empty to avoid bloating storage
    const hasTasks = dayData.tasks && dayData.tasks.length > 0;
    const hasSchedule = dayData.schedule && dayData.schedule.length > 0;
    const hasNote = dayData.note && dayData.note.trim().length > 0;
    const hasWater = dayData.water && dayData.water > 0;

    if (!hasTasks && !hasSchedule && !hasNote && !hasWater) {
      delete all[dateStr];
    } else {
      all[dateStr] = dayData;
    }
    return this.saveAll(all);
  },

  // Get list of date keys that have any notes or tasks
  getDatesWithData() {
    const all = this.getAll();
    const result = {};
    for (const dateStr in all) {
      const d = all[dateStr];
      const taskCount = (d.tasks || []).length;
      const doneCount = (d.tasks || []).filter(t => t.completed).length;
      const hasSchedule = (d.schedule || []).length > 0;
      const hasNote = !!(d.note && d.note.trim().length > 0);

      if (taskCount > 0 || hasSchedule || hasNote) {
        result[dateStr] = {
          taskCount,
          doneCount,
          hasSchedule,
          hasNote
        };
      }
    }
    return result;
  },

  // Search across all notes and tasks
  search(keyword) {
    if (!keyword || !keyword.trim()) return [];
    const query = keyword.toLowerCase().trim();
    const all = this.getAll();
    const matches = [];

    for (const [dateStr, dayData] of Object.entries(all)) {
      let matchedItems = [];

      // Check tasks
      (dayData.tasks || []).forEach(t => {
        if (t.text && t.text.toLowerCase().includes(query)) {
          matchedItems.push({ type: 'task', text: t.text, completed: t.completed });
        }
      });

      // Check schedule
      (dayData.schedule || []).forEach(s => {
        if ((s.title && s.title.toLowerCase().includes(query)) || (s.note && s.note.toLowerCase().includes(query))) {
          matchedItems.push({ type: 'schedule', text: `${s.time || ''} ${s.title || ''}`.trim() });
        }
      });

      // Check note
      if (dayData.note && dayData.note.toLowerCase().includes(query)) {
        matchedItems.push({ type: 'note', text: dayData.note.slice(0, 100) });
      }

      if (matchedItems.length > 0) {
        matches.push({
          dateStr,
          items: matchedItems
        });
      }
    }

    // Sort by date ascending
    matches.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    return matches;
  },

  // Export JSON backup
  exportBackup() {
    const data = this.getAll();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planner_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Import JSON backup
  importBackup(fileContent) {
    try {
      const parsed = JSON.parse(fileContent);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid JSON format');
      }
      this.saveAll(parsed);
      return { success: true, count: Object.keys(parsed).length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Get sync data for QR export
  getSyncData(mode = 'recent') {
    const all = this.getAll();
    if (mode === 'all') {
      return { v: 1, type: 'all', data: all };
    }
    // 'recent': 30 days before and 60 days after today
    const filtered = {};
    const now = new Date();
    const minDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    const maxDate = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().slice(0, 10);

    for (const [dateStr, dayData] of Object.entries(all)) {
      if (dateStr >= minDate && dateStr <= maxDate) {
        filtered[dateStr] = dayData;
      }
    }
    return { v: 1, type: 'recent', data: filtered, range: `${minDate} ถึง ${maxDate}` };
  },

  // Apply sync data
  applySyncData(syncPayload, merge = true) {
    if (!syncPayload || !syncPayload.data || typeof syncPayload.data !== 'object') {
      return { success: false, error: 'ข้อมูลไม่ถูกต้อง' };
    }
    const current = merge ? this.getAll() : {};
    let updatedCount = 0;
    for (const [dateStr, dayData] of Object.entries(syncPayload.data)) {
      current[dateStr] = dayData;
      updatedCount++;
    }
    this.saveAll(current);
    return { success: true, count: updatedCount };
  },

  // Settings
  getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : { theme: 'light', fontScale: 'large' };
    } catch (e) {
      return { theme: 'light', fontScale: 'large' };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {}
  }
};
