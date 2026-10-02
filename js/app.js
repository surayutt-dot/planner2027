// ==========================================================================
// Planner - Main Application Logic (Multi-Year)
// ==========================================================================

const App = {
  year: new Date().getFullYear(),
  currentView: 'day', // 'day' | 'month' | 'year'
  currentDate: new Date(), // Real-world today (e.g. October 2026, 2027, etc.)
  currentMonth: new Date().getMonth(), // 0 - 11
  settings: {
    theme: 'light',
    fontScale: 'normal',
    showWanPhra: true
  },
  autoSaveTimer: null,
  deferredPrompt: null,

  init() {
    this.loadSettings();
    this.bindEvents();
    this.registerServiceWorker();
    this.checkPWAInstall();
    this.updateNotificationButtonState();
    this.startReminderTicker();
    this.checkUrlSync();
    window.addEventListener('hashchange', () => this.checkUrlSync());

    // Initial render
    this.switchView('day');
  },

  // --------------------------------------------------------------------------
  // Settings & Preferences
  // --------------------------------------------------------------------------
  loadSettings() {
    const saved = Storage.getSettings();
    this.settings = { ...this.settings, ...saved };
    this.applyTheme(this.settings.theme);
    this.applyFontScale(this.settings.fontScale);
    this.applyWanPhra(this.settings.showWanPhra !== false);
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }
  },

  toggleTheme() {
    this.settings.theme = this.settings.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(this.settings.theme);
    Storage.saveSettings(this.settings);
  },

  applyFontScale(scale) {
    document.documentElement.setAttribute('data-font-size', scale);
    const fontBtn = document.getElementById('font-scale-btn');
    if (fontBtn) {
      fontBtn.innerHTML = scale === 'extra' ? '🔍 ปกติ' : '🔍 ตัวใหญ่พิเศษ';
    }
  },

  toggleFontScale() {
    this.settings.fontScale = this.settings.fontScale === 'extra' ? 'normal' : 'extra';
    this.applyFontScale(this.settings.fontScale);
    Storage.saveSettings(this.settings);
  },

  applyWanPhra(show) {
    const btn = document.getElementById('wan-phra-toggle-btn');
    if (btn) {
      btn.innerHTML = show ? '🪷 แสดงวันพระ: เปิด' : '🪷 แสดงวันพระ: ปิด';
    }
  },

  toggleWanPhra() {
    this.settings.showWanPhra = this.settings.showWanPhra === false ? true : false;
    this.applyWanPhra(this.settings.showWanPhra);
    Storage.saveSettings(this.settings);
    this.switchView(this.currentView);
  },

  // --------------------------------------------------------------------------
  // View Switcher
  // --------------------------------------------------------------------------
  switchView(viewName) {
    this.currentView = viewName;

    // Update bottom nav buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update top tabs
    document.querySelectorAll('.view-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update view panels
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`view-${viewName}`);
    if (targetSec) {
      targetSec.classList.add('active');
    }

    // Render corresponding view
    if (viewName === 'day') {
      this.renderDayView();
    } else if (viewName === 'month') {
      this.renderMonthView();
    } else if (viewName === 'year') {
      this.renderYearView();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // --------------------------------------------------------------------------
  // 1. DAY VIEW LOGIC
  // --------------------------------------------------------------------------
  formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  renderDayView() {
    const date = this.currentDate;
    const dateKey = this.formatDateKey(date);
    const dayData = Storage.getDayData(dateKey);

    const dayOfWeek = THAI_DAY_NAMES[date.getDay()];
    const dayNum = date.getDate();
    const monthName = THAI_MONTH_NAMES[date.getMonth()];
    const thaiYear = date.getFullYear() + 543;

    // Set Header
    document.getElementById('day-header-num').textContent = dayNum;
    document.getElementById('day-header-name').textContent = dayOfWeek;
    document.getElementById('day-header-my').textContent = `${monthName} พ.ศ. ${thaiYear} (${date.getFullYear()})`;
    const topSub = document.getElementById('top-sub-year');
    if (topSub) topSub.textContent = `พ.ศ. ${thaiYear} (${date.getFullYear()})`;

    // Check Holiday
    const holiday = getThaiHoliday(dateKey);
    const holidayBanner = document.getElementById('day-holiday-banner');
    if (holiday) {
      holidayBanner.style.display = 'inline-flex';
      holidayBanner.innerHTML = `<span>🚩</span> <span>${holiday.name}</span>`;
    } else {
      holidayBanner.style.display = 'none';
    }

    // Check Wan Phra (วันพระ)
    const wanPhra = (this.settings.showWanPhra !== false && typeof getWanPhra === 'function') ? getWanPhra(dateKey) : null;
    const wanPhraBanner = document.getElementById('day-wan-phra-banner');
    if (wanPhraBanner) {
      if (wanPhra) {
        wanPhraBanner.style.display = 'inline-flex';
        wanPhraBanner.innerHTML = `<span>🪷</span> <span>วันพระ (${wanPhra})</span>`;
      } else {
        wanPhraBanner.style.display = 'none';
      }
    }

    // Render Tasks
    this.renderTaskList(dayData.tasks || []);

    // Render Schedules
    this.renderScheduleList(dayData.schedule || []);

    // Render Daily Notes
    const notesArea = document.getElementById('daily-notes-textarea');
    if (notesArea) {
      if (document.activeElement !== notesArea) {
        notesArea.value = dayData.note || '';
      }
    }

    // Render Daily Mascot (การ์ตูนน่ารักประจำวัน)
    this.renderMascot();
  },

  renderTaskList(tasks) {
    const listEl = document.getElementById('task-list-container');
    const badgeEl = document.getElementById('task-badge');
    const completedCount = tasks.filter(t => t.completed).length;

    badgeEl.textContent = `${completedCount}/${tasks.length}`;

    if (tasks.length === 0) {
      listEl.innerHTML = `<div class="empty-state">ยังไม่มีสิ่งที่ต้องทำวันนี้ เพิ่มรายการด้านบนได้เลยครับ</div>`;
      return;
    }

    listEl.innerHTML = tasks.map((task, idx) => `
      <div class="task-item ${task.completed ? 'completed' : ''}" data-idx="${idx}">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="App.toggleTask(${idx})">
        <span class="task-text" onclick="App.toggleTask(${idx})">${this.escapeHtml(task.text)}</span>
        <button type="button" class="delete-task-btn" onclick="event.stopPropagation(); App.deleteTask(${idx})" title="ลบรายการ">✕</button>
      </div>
    `).join('');
  },

  addTask() {
    const input = document.getElementById('new-task-input');
    const text = input.value.trim();
    if (!text) return;

    const dateKey = this.formatDateKey(this.currentDate);
    const dayData = Storage.getDayData(dateKey);
    if (!dayData.tasks) dayData.tasks = [];

    dayData.tasks.push({
      id: Date.now(),
      text: text,
      completed: false
    });

    Storage.saveDayData(dateKey, dayData);
    if (typeof FirebaseSync !== 'undefined' && FirebaseSync.currentUser) {
      FirebaseSync.executeCloudSync();
    }
    input.value = '';
    this.renderDayView();
  },

  toggleTask(idx) {
    const dateKey = this.formatDateKey(this.currentDate);
    const dayData = Storage.getDayData(dateKey);
    if (dayData.tasks && dayData.tasks[idx]) {
      dayData.tasks[idx].completed = !dayData.tasks[idx].completed;
      Storage.saveDayData(dateKey, dayData);
      if (typeof FirebaseSync !== 'undefined' && FirebaseSync.currentUser) {
        FirebaseSync.executeCloudSync();
      }
      this.renderDayView();
    }
  },

  deleteTask(idx) {
    const dateKey = this.formatDateKey(this.currentDate);
    const dayData = Storage.getDayData(dateKey);
    if (dayData.tasks && idx >= 0 && idx < dayData.tasks.length) {
      dayData.tasks.splice(idx, 1);
      Storage.saveDayData(dateKey, dayData);
      if (typeof FirebaseSync !== 'undefined' && FirebaseSync.currentUser) {
        FirebaseSync.executeCloudSync();
      }
      this.renderDayView();
    }
  },

  renderScheduleList(schedules) {
    const listEl = document.getElementById('schedule-list-container');
    const badgeEl = document.getElementById('schedule-badge');
    badgeEl.textContent = `${schedules.length} นัดหมาย`;

    if (schedules.length === 0) {
      listEl.innerHTML = `<div class="empty-state">ยังไม่มีเวลานัดหมายในวันนี้</div>`;
      return;
    }

    // Sort by time
    schedules.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    listEl.innerHTML = schedules.map((item, idx) => {
      let reminderBadge = '';
      const rem = item.reminder !== undefined ? parseInt(item.reminder) : 5;
      if (rem > 0) {
        reminderBadge = `<span class="schedule-reminder-badge">🔔 เตือนก่อน ${rem} นาที</span>`;
      } else if (rem === 0) {
        reminderBadge = `<span class="schedule-reminder-badge">🔔 เตือนตรงเวลา</span>`;
      } else {
        reminderBadge = `<span class="schedule-reminder-badge" style="color:var(--text-muted);">🔕 ไม่เตือน</span>`;
      }

      return `
        <div class="schedule-item">
          <span class="schedule-time">${item.time}</span>
          <div class="schedule-content">
            <span class="schedule-title-text">${this.escapeHtml(item.title)}</span>
            ${reminderBadge}
          </div>
          <button type="button" class="delete-task-btn" onclick="event.stopPropagation(); App.deleteSchedule(${idx})" title="ลบ">✕</button>
        </div>
      `;
    }).join('');
  },

  addSchedule() {
    const timeSelect = document.getElementById('schedule-time-select');
    const reminderSelect = document.getElementById('schedule-reminder-select');
    const input = document.getElementById('schedule-title-input');
    const time = (timeSelect && timeSelect.value) ? timeSelect.value : '09:00';
    const reminder = reminderSelect ? parseInt(reminderSelect.value) : 5;
    const title = input ? input.value.trim() : '';
    if (!title) {
      if (input) input.focus();
      return;
    }

    const dateKey = this.formatDateKey(this.currentDate);
    const dayData = Storage.getDayData(dateKey);
    if (!dayData.schedule) dayData.schedule = [];

    dayData.schedule.push({
      id: Date.now(),
      time: time,
      title: title,
      reminder: reminder,
      notified: false
    });

    Storage.saveDayData(dateKey, dayData);
    if (typeof FirebaseSync !== 'undefined' && FirebaseSync.currentUser) {
      FirebaseSync.executeCloudSync();
    }
    if (input) input.value = '';
    this.renderDayView();
  },

  deleteSchedule(idx) {
    const dateKey = this.formatDateKey(this.currentDate);
    const dayData = Storage.getDayData(dateKey);
    if (dayData.schedule && idx >= 0 && idx < dayData.schedule.length) {
      dayData.schedule.splice(idx, 1);
      Storage.saveDayData(dateKey, dayData);
      if (typeof FirebaseSync !== 'undefined' && FirebaseSync.currentUser) {
        FirebaseSync.executeCloudSync();
      }
      this.renderDayView();
    }
  },

  onNotesInput(val) {
    const dateKey = this.formatDateKey(this.currentDate);
    const indicator = document.getElementById('notes-save-indicator');

    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = setTimeout(() => {
      const dayData = Storage.getDayData(dateKey);
      dayData.note = val;
      Storage.saveDayData(dateKey, dayData);

      if (indicator) {
        indicator.innerHTML = '<span>✓</span> บันทึกเรียบร้อยแล้ว';
        indicator.classList.add('show');
        setTimeout(() => indicator.classList.remove('show'), 2000);
      }
    }, 400);
  },

  saveNotesNow() {
    clearTimeout(this.autoSaveTimer);
    const notesArea = document.getElementById('daily-notes-textarea');
    if (!notesArea) return;
    const val = notesArea.value;
    const dateKey = this.formatDateKey(this.currentDate);
    const dayData = Storage.getDayData(dateKey);
    dayData.note = val;
    Storage.saveDayData(dateKey, dayData);

    // Immediately trigger cloud sync without debounce delay
    if (typeof FirebaseSync !== 'undefined' && FirebaseSync.currentUser) {
      FirebaseSync.executeCloudSync();
    }

    const indicator = document.getElementById('notes-save-indicator');
    if (indicator) {
      indicator.innerHTML = '<span>✓</span> บันทึกโน้ตเรียบร้อยแล้ว!';
      indicator.classList.add('show');
      setTimeout(() => indicator.classList.remove('show'), 2500);
    }
  },

  insertNoteTimestamp() {
    const notesArea = document.getElementById('daily-notes-textarea');
    if (!notesArea) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} น.`;
    const currentVal = notesArea.value;
    const prefix = (currentVal.trim().length > 0 && !currentVal.endsWith('\n')) ? '\n\n' : '';
    notesArea.value = currentVal + prefix + `📝 [${timeStr}] `;
    notesArea.focus();
    notesArea.setSelectionRange(notesArea.value.length, notesArea.value.length);
    this.saveNotesNow();
  },

  renderMascot() {
    const mascot = typeof getMascotForDate === 'function' ? getMascotForDate(this.currentDate) : null;
    if (!mascot) return;

    const avatarEl = document.getElementById('mascot-avatar');
    const nameEl = document.getElementById('mascot-name');
    const quoteEl = document.getElementById('mascot-quote');

    if (avatarEl) {
      avatarEl.innerHTML = mascot.svg;
      avatarEl.style.backgroundColor = mascot.color;
    }
    if (nameEl) nameEl.textContent = mascot.name;
    if (quoteEl) quoteEl.textContent = `"${mascot.quote}"`;
  },

  petMascot() {
    const avatarEl = document.getElementById('mascot-avatar');
    const heartBubble = document.getElementById('mascot-heart-bubble');
    const quoteEl = document.getElementById('mascot-quote');

    if (avatarEl) {
      avatarEl.classList.remove('pet');
      void avatarEl.offsetWidth; // trigger reflow
      avatarEl.classList.add('pet');
    }

    if (heartBubble) {
      heartBubble.classList.remove('animate');
      void heartBubble.offsetWidth;
      heartBubble.classList.add('animate');
    }

    const reactions = [
      'งึมๆ สบายจังเลย~ ขอบคุณที่แวะมาทักทายนะ! 💖',
      'เย้! ขอส่งพลังบวกให้คุณเต็มร้อยเลย สู้ๆ นะ! ✨',
      'วันนี้ขอให้พบเจอแต่รอยยิ้มและเรื่องดีๆ ทั้งวันเลยนะ! 🌸',
      'คุณเก่งมากแล้ว พักผ่อนและยิ้มเยอะๆ น้า! 🥰',
      'ฮึบๆ! ไม่ว่าเป้าหมายคืออะไร เธอทำได้แน่นอน! 🌟'
    ];
    const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
    if (quoteEl) {
      quoteEl.textContent = `"${randomReaction}"`;
    }
  },

  changeDay(offset) {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + offset);
    this.currentDate = newDate;
    this.year = newDate.getFullYear();
    this.currentMonth = newDate.getMonth();
    this.renderDayView();
  },

  goToDate(dateStr) {
    const parts = dateStr.split('-');
    this.currentDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    this.year = this.currentDate.getFullYear();
    this.currentMonth = this.currentDate.getMonth();
    this.switchView('day');
  },

  goToToday() {
    this.currentDate = new Date();
    this.year = this.currentDate.getFullYear();
    this.currentMonth = this.currentDate.getMonth();
    this.renderDayView();
  },

  goToTodayOrStart() {
    this.goToToday();
  },

  // --------------------------------------------------------------------------
  // 2. MONTH VIEW LOGIC
  // --------------------------------------------------------------------------
  renderMonthView() {
    const m = this.currentMonth;
    const year = this.year;
    const thaiYear = year + 543;

    // Header Text
    document.getElementById('month-view-title').textContent = THAI_MONTH_NAMES[m];
    document.getElementById('month-view-sub').textContent = `พ.ศ. ${thaiYear} (ค.ศ. ${year})`;

    // Render Month Selector Pills
    const pillsContainer = document.getElementById('month-pills-container');
    pillsContainer.innerHTML = THAI_MONTH_SHORT.map((shortName, idx) => `
      <button class="month-pill ${idx === m ? 'active' : ''}" onclick="App.selectMonth(${idx})">
        ${shortName}
      </button>
    `).join('');

    // Scroll active pill into view
    setTimeout(() => {
      const activePill = pillsContainer.querySelector('.month-pill.active');
      if (activePill) {
        activePill.scrollIntoView({ inline: 'center', behavior: 'smooth' });
      }
    }, 50);

    // Render Days Grid
    const gridEl = document.getElementById('month-days-grid');
    gridEl.innerHTML = '';

    const firstDayIndex = new Date(year, m, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, m + 1, 0).getDate();
    const prevMonthDays = new Date(year, m, 0).getDate();

    const datesWithData = Storage.getDatesWithData();
    const selectedDateKey = this.formatDateKey(this.currentDate);

    // Padding cells from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      gridEl.innerHTML += `
        <div class="calendar-cell other-month">
          <span class="cell-date-num">${dayNum}</span>
        </div>
      `;
    }

    // Days of current month
    for (let d = 1; d <= totalDays; d++) {
      const dateKey = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const holiday = getThaiHoliday(dateKey);
      const wanPhra = (this.settings.showWanPhra !== false && typeof getWanPhra === 'function') ? getWanPhra(dateKey) : null;
      const dataInfo = datesWithData[dateKey];
      const isSelected = selectedDateKey === dateKey;

      let indicatorsHtml = '';
      if (dataInfo) {
        if (dataInfo.taskCount > 0) indicatorsHtml += `<span class="dot-indicator dot-task" title="งาน"></span>`;
        if (dataInfo.hasSchedule) indicatorsHtml += `<span class="dot-indicator dot-task" style="background:#8B5CF6;" title="นัดหมาย"></span>`;
        if (dataInfo.hasNote) indicatorsHtml += `<span class="dot-indicator dot-note" title="บันทึก"></span>`;
      }
      if (wanPhra) {
        indicatorsHtml += `<span class="dot-indicator dot-wan-phra" title="วันพระ"></span>`;
      }
      if (holiday) {
        indicatorsHtml += `<span class="dot-indicator dot-holiday" title="วันหยุด"></span>`;
      }

      const holidayText = holiday ? `<span class="cell-holiday-text">${holiday.name}</span>` : '';
      const wanPhraIcon = wanPhra ? `<span class="cell-wan-phra-icon" title="วันพระ (${wanPhra})">🪷</span>` : '';

      gridEl.innerHTML += `
        <div class="calendar-cell ${isSelected ? 'is-selected' : ''} ${holiday ? 'is-holiday' : ''}" onclick="App.onMonthCellClick('${dateKey}')">
          <span class="cell-date-num">${d}</span>
          ${wanPhraIcon}
          <div class="cell-indicators">${indicatorsHtml}</div>
          ${holidayText}
        </div>
      `;
    }

    // Update bottom preview for currently selected date
    this.updateMonthPreview(selectedDateKey);
  },

  selectMonth(m) {
    this.currentMonth = m;
    // Set selected date to 1st of that month
    this.currentDate = new Date(this.year, m, 1);
    this.renderMonthView();
  },

  changeMonth(offset) {
    let newM = this.currentMonth + offset;
    let newY = this.year;
    if (newM < 0) {
      newM = 11;
      newY -= 1;
    } else if (newM > 11) {
      newM = 0;
      newY += 1;
    }
    this.year = newY;
    this.currentMonth = newM;
    this.currentDate = new Date(this.year, newM, 1);
    this.renderMonthView();
  },

  onMonthCellClick(dateKey) {
    this.goToDate(dateKey);
  },

  updateMonthPreview(dateKey) {
    const previewContainer = document.getElementById('month-day-preview');
    const dayData = Storage.getDayData(dateKey);
    const parts = dateKey.split('-');
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

    const dayName = THAI_DAY_NAMES[dateObj.getDay()];
    const dayNum = dateObj.getDate();
    const monthName = THAI_MONTH_NAMES[dateObj.getMonth()];
    const holiday = getThaiHoliday(dateKey);
    const wanPhra = (this.settings.showWanPhra !== false && typeof getWanPhra === 'function') ? getWanPhra(dateKey) : null;

    const taskCount = (dayData.tasks || []).length;
    const doneCount = (dayData.tasks || []).filter(t => t.completed).length;
    const scheduleCount = (dayData.schedule || []).length;
    const hasNote = dayData.note && dayData.note.trim().length > 0;

    let summaryText = '';
    if (taskCount === 0 && scheduleCount === 0 && !hasNote) {
      summaryText = '<span style="color:var(--text-muted);">ยังไม่มีรายการบันทึกสำหรับวันนี้</span>';
    } else {
      const items = [];
      if (taskCount > 0) items.push(`📋 สิ่งที่ต้องทำ: ${doneCount}/${taskCount}`);
      if (scheduleCount > 0) items.push(`⏰ นัดหมาย: ${scheduleCount} รายการ`);
      if (hasNote) items.push(`📝 มีโน้ตบันทึก`);
      summaryText = items.join(' &nbsp;•&nbsp; ');
    }

    let holidayLabel = holiday ? `<span style="color:var(--accent-holiday); font-weight:700;">🚩 ${holiday.name}</span><br/>` : '';
    let wanPhraLabel = wanPhra ? `<span style="color:#D97706; font-weight:700;">🪷 วันพระ (${wanPhra})</span><br/>` : '';

    previewContainer.innerHTML = `
      <div class="preview-header">
        <div>
          <div class="preview-title">${dayName}ที่ ${dayNum} ${monthName}</div>
          ${holidayLabel}
          ${wanPhraLabel}
        </div>
        <button class="open-day-btn" onclick="App.goToDate('${dateKey}')">เปิดดูบันทึก ➔</button>
      </div>
      <div style="font-size:var(--text-sm); margin-top:4px;">${summaryText}</div>
    `;
  },

  // --------------------------------------------------------------------------
  // 3. YEAR VIEW LOGIC
  // --------------------------------------------------------------------------
  changeYear(offset) {
    this.year += offset;
    this.renderYearView();
  },

  renderYearView() {
    const year = this.year;
    const thaiYear = year + 543;
    const titleEl = document.getElementById('year-view-title');
    const subEl = document.getElementById('year-view-sub');
    if (titleEl) titleEl.textContent = `ปี ${year}`;
    if (subEl) subEl.textContent = `พุทธศักราช ${thaiYear} • ปฏิทิน 12 เดือน`;

    const container = document.getElementById('year-cards-container');
    container.innerHTML = '';

    const datesWithData = Storage.getDatesWithData();
    const weekdaysShort = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(year, m, 1).getDay();
      const totalDays = new Date(year, m + 1, 0).getDate();
      
      let miniGridHtml = '';
      // Fill empty slots
      for (let i = 0; i < firstDay; i++) {
        miniGridHtml += `<span class="mini-cell"></span>`;
      }
      // Fill days
      for (let d = 1; d <= totalDays; d++) {
        const dateKey = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const holiday = getThaiHoliday(dateKey);
        const hasData = datesWithData[dateKey];

        miniGridHtml += `
          <span class="mini-cell ${holiday ? 'is-holiday' : ''} ${hasData ? 'has-note' : ''}" onclick="event.stopPropagation(); App.goToDate('${dateKey}')">
            ${d}
          </span>
        `;
      }

      container.innerHTML += `
        <div class="mini-month-card" onclick="App.jumpToMonthFromYear(${m})">
          <div class="mini-month-header">
            <span class="mini-month-name">${THAI_MONTH_NAMES[m]}</span>
            <span class="mini-month-badge">${m + 1}</span>
          </div>
          <div class="mini-days-row">
            ${weekdaysShort.map(w => `<span>${w}</span>`).join('')}
          </div>
          <div class="mini-grid">
            ${miniGridHtml}
          </div>
        </div>
      `;
    }
  },

  jumpToMonthFromYear(monthIdx) {
    this.currentMonth = monthIdx;
    this.currentDate = new Date(this.year, monthIdx, 1);
    this.switchView('month');
  },

  // --------------------------------------------------------------------------
  // Search
  // --------------------------------------------------------------------------
  openSearchModal() {
    const modal = document.getElementById('search-modal');
    modal.classList.add('open');
    const input = document.getElementById('search-query-input');
    input.value = '';
    document.getElementById('search-results-list').innerHTML = '';
    setTimeout(() => input.focus(), 150);
  },

  closeSearchModal() {
    document.getElementById('search-modal').classList.remove('open');
  },

  onSearchInput(query) {
    const listEl = document.getElementById('search-results-list');
    if (!query || !query.trim()) {
      listEl.innerHTML = '<div class="empty-state">พิมพ์คำค้นหาเพื่อค้นหาโน้ตหรือสิ่งที่ต้องทำ</div>';
      return;
    }

    const results = Storage.search(query);
    if (results.length === 0) {
      listEl.innerHTML = `<div class="empty-state">ไม่พบข้อมูลที่ตรงกับ "${this.escapeHtml(query)}"</div>`;
      return;
    }

    listEl.innerHTML = results.map(res => {
      const parts = res.dateStr.split('-');
      const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const thaiY = dObj.getFullYear() + 543;
      const dateLabel = `${THAI_DAY_NAMES[dObj.getDay()]}ที่ ${dObj.getDate()} ${THAI_MONTH_NAMES[dObj.getMonth()]} ${thaiY} (${dObj.getFullYear()})`;

      const itemsHtml = res.items.map(item => `
        <div style="font-size:var(--text-sm); margin-top:2px;">
          ${item.type === 'task' ? '📋' : item.type === 'schedule' ? '⏰' : '📝'} ${this.escapeHtml(item.text)}
        </div>
      `).join('');

      return `
        <div class="search-result-item" onclick="App.goToDateFromSearch('${res.dateStr}')">
          <div class="search-result-date">${dateLabel}</div>
          ${itemsHtml}
        </div>
      `;
    }).join('');
  },

  goToDateFromSearch(dateStr) {
    this.closeSearchModal();
    this.goToDate(dateStr);
  },

  // --------------------------------------------------------------------------
  // Settings & Backup Modal
  // --------------------------------------------------------------------------
  openSettingsModal() {
    document.getElementById('settings-modal').classList.add('open');
  },

  closeSettingsModal() {
    document.getElementById('settings-modal').classList.remove('open');
  },

  exportData() {
    Storage.exportBackup();
  },

  importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = Storage.importBackup(e.target.result);
      if (result.success) {
        alert(`กู้คืนข้อมูลสำเร็จ! นำเข้าแล้ว ${result.count} วัน`);
        this.renderDayView();
        this.closeSettingsModal();
      } else {
        alert(`เกิดข้อผิดพลาดในการนำเข้าไฟล์: ${result.error}`);
      }
    };
    reader.readAsText(file);
  },

  clearAllData() {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลบันทึกทั้งหมด? (ไม่สามารถกู้คืนได้หากไม่ได้สำรองข้อมูลไว้)')) {
      Storage.saveAll({});
      alert('ล้างข้อมูลเรียบร้อยแล้ว');
      this.renderDayView();
      this.closeSettingsModal();
    }
  },

  // --------------------------------------------------------------------------
  // Event Binding
  // --------------------------------------------------------------------------
  bindEvents() {
    // Top Theme & Font toggles
    document.getElementById('theme-toggle-btn').addEventListener('click', () => this.toggleTheme());
    document.getElementById('font-scale-btn').addEventListener('click', () => this.toggleFontScale());

    // Enter key for new task
    document.getElementById('new-task-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addTask();
    });

    // Enter key for schedule
    document.getElementById('schedule-title-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addSchedule();
    });

    // Populate Time Select (06:00 - 23:00)
    const timeSelect = document.getElementById('schedule-time-select');
    timeSelect.innerHTML = '';
    for (let h = 6; h <= 23; h++) {
      const hourStr = String(h).padStart(2, '0') + ':00';
      const halfStr = String(h).padStart(2, '0') + ':30';
      timeSelect.innerHTML += `<option value="${hourStr}">${hourStr}</option>`;
      timeSelect.innerHTML += `<option value="${halfStr}">${halfStr}</option>`;
    }

    // Modal close when clicking backdrop
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('open');
        }
      });
    });
  },

  // --------------------------------------------------------------------------
  // PWA Support
  // --------------------------------------------------------------------------
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(() => console.log('Service Worker Registered'))
          .catch(err => console.warn('SW registration failed:', err));
      });
    }
  },

  checkPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const banner = document.getElementById('install-banner');
      if (banner) banner.classList.add('show');
    });
  },

  installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then(() => {
        this.deferredPrompt = null;
        const banner = document.getElementById('install-banner');
        if (banner) banner.classList.remove('show');
      });
    }
  },

  // --------------------------------------------------------------------------
  // Reminder & Alarm Notifications
  // --------------------------------------------------------------------------
  playReminderChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      // Melodic chime: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.6);
      });
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  },

  triggerReminder(title, timeStr, dateLabel, reminderMinutes) {
    // 1. Play sound chime
    this.playReminderChime();

    // 2. Vibrate phone
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([300, 150, 300, 150, 400]);
      } catch (e) {}
    }

    // 3. Show System Notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const leadText = reminderMinutes > 0 ? `(อีก ${reminderMinutes} นาทีจะถึงเวลา)` : '(ถึงเวลาแล้ว)';
        new Notification(`⏰ นัดหมาย: ${title}`, {
          body: `เวลา ${timeStr} ${leadText}`,
          icon: './icons/icon.svg',
          badge: './icons/icon.svg'
        });
      } catch (e) {}
    }

    // 4. Show In-App Modal Dialog
    const modal = document.getElementById('reminder-modal');
    const titleEl = document.getElementById('reminder-modal-title');
    const timeEl = document.getElementById('reminder-modal-time');
    if (modal && titleEl && timeEl) {
      titleEl.textContent = title;
      const leadText = reminderMinutes > 0 ? `(เตือนก่อนเวลา ${reminderMinutes} นาที)` : '';
      timeEl.textContent = `เวลานัดหมาย ${timeStr} น. ${leadText}`;
      modal.classList.add('open');
    }
  },

  dismissReminderModal() {
    const modal = document.getElementById('reminder-modal');
    if (modal) modal.classList.remove('open');
  },

  testReminderAlert() {
    this.triggerReminder('นัดประชุมทีม / งานสำคัญ', '14:00', 'วันนี้', 5);
  },

  requestNotificationPermission() {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        this.updateNotificationButtonState();
        if (permission === 'granted') {
          alert('เปิดใช้งานระบบแจ้งเตือนสำเร็จแล้ว!');
        } else {
          alert('คุณยังไม่ได้อนุญาตการแจ้งเตือน หากต้องการเปิด สามารถตั้งค่าในเบราว์เซอร์ได้ครับ');
        }
      });
    } else {
      alert('เบราว์เซอร์ของคุณยังไม่รองรับระบบ Web Notification แต่ระบบยังคงส่งเสียงกริ่งและหน้าต่างเตือนในแอปได้ตามปกติครับ');
    }
  },

  updateNotificationButtonState() {
    const btn = document.getElementById('noti-permission-btn');
    if (!btn) return;
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        btn.innerHTML = '✅ เปิดการแจ้งเตือนแล้ว';
        btn.style.color = 'var(--accent-success)';
      } else if (Notification.permission === 'denied') {
        btn.innerHTML = '🚫 การแจ้งเตือนถูกปิดไว้ในเบราว์เซอร์';
      } else {
        btn.innerHTML = '🔔 เปิดการแจ้งเตือนของเครื่อง';
      }
    } else {
      btn.innerHTML = '🔔 เสียงกริ่งและแจ้งเตือนในแอป (พร้อมใช้งาน)';
    }
  },

  startReminderTicker() {
    // Check every 15 seconds
    setInterval(() => {
      this.checkUpcomingReminders();
    }, 15000);
    // Initial check
    this.checkUpcomingReminders();
  },

  checkUpcomingReminders() {
    const now = new Date();
    const todayKey = this.formatDateKey(now);
    const dayData = Storage.getDayData(todayKey);
    if (!dayData || !dayData.schedule || dayData.schedule.length === 0) return;

    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    let hasChanges = false;
    dayData.schedule.forEach(item => {
      const rem = item.reminder !== undefined ? parseInt(item.reminder) : 5;
      if (rem === -1 || item.notified) return;

      const [h, m] = item.time.split(':').map(Number);
      const scheduleTotalMinutes = h * 60 + m;
      const targetMinute = scheduleTotalMinutes - rem;

      // Trigger if current total minutes is within trigger window
      if (currentTotalMinutes >= targetMinute && currentTotalMinutes <= targetMinute + 2) {
        item.notified = true;
        hasChanges = true;
        this.triggerReminder(item.title, item.time, todayKey, rem);
      }
    });

    if (hasChanges) {
      Storage.saveDayData(todayKey, dayData);
    }
  },

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // --------------------------------------------------------------------------
  // QR Code Sync (ซิงก์ข้อมูลข้ามเครื่องด้วย QR Code)
  // --------------------------------------------------------------------------
  currentSyncRange: 'recent',
  currentSyncUrl: '',
  pendingSyncPayload: null,
  qrScannerStream: null,
  qrScanAnimId: null,

  openSyncModal() {
    this.closeSettingsModal();
    const modal = document.getElementById('sync-modal');
    if (modal) {
      modal.classList.add('open');
      this.switchSyncTab('send');
      this.renderSyncQr();
    }
  },

  closeSyncModal() {
    const modal = document.getElementById('sync-modal');
    if (modal) modal.classList.remove('open');
    this.stopQrScanner();
  },

  switchSyncTab(tab) {
    const sendBtn = document.getElementById('sync-tab-send');
    const recvBtn = document.getElementById('sync-tab-recv');
    const sendPane = document.getElementById('sync-pane-send');
    const recvPane = document.getElementById('sync-pane-recv');

    if (tab === 'send') {
      if (sendBtn) sendBtn.classList.add('active');
      if (recvBtn) recvBtn.classList.remove('active');
      if (sendPane) sendPane.classList.add('active');
      if (recvPane) recvPane.classList.remove('active');
      this.stopQrScanner();
      this.renderSyncQr();
    } else {
      if (recvBtn) recvBtn.classList.add('active');
      if (sendBtn) sendBtn.classList.remove('active');
      if (recvPane) recvPane.classList.add('active');
      if (sendPane) sendPane.classList.remove('active');
    }
  },

  changeSyncRange(range) {
    this.currentSyncRange = range;
    const rRecent = document.getElementById('sync-range-recent');
    const rAll = document.getElementById('sync-range-all');
    if (rRecent) rRecent.classList.toggle('active', range === 'recent');
    if (rAll) rAll.classList.toggle('active', range === 'all');
    this.renderSyncQr();
  },

  renderSyncQr() {
    const canvas = document.getElementById('sync-qr-canvas');
    const badge = document.getElementById('sync-stat-badge');
    if (!canvas || typeof QRious === 'undefined' || typeof LZString === 'undefined') return;

    try {
      const payload = Storage.getSyncData(this.currentSyncRange);
      const jsonStr = JSON.stringify(payload);
      const compressed = LZString.compressToEncodedURIComponent(jsonStr);
      
      const baseUrl = window.location.href.split('#')[0];
      const syncUrl = `${baseUrl}#sync=${compressed}`;
      this.currentSyncUrl = syncUrl;

      new QRious({
        element: canvas,
        value: syncUrl,
        size: 240,
        level: 'L'
      });

      const dayCount = Object.keys(payload.data || {}).length;
      if (badge) {
        badge.textContent = `✓ รหัสพร้อมสแกน: ข้อมูล ${dayCount} วัน • ปลอดภัย 100%`;
      }
    } catch (e) {
      console.error('Error rendering sync QR:', e);
      if (badge) badge.textContent = '❌ ข้อมูลยาวเกินไป แนะนำเลือกโหมด "เดือนนี้และใกล้เคียง"';
    }
  },

  copySyncLink() {
    if (!this.currentSyncUrl) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(this.currentSyncUrl).then(() => {
        alert('✓ คัดลอกลิงก์ซิงก์เรียบร้อยแล้ว! สามารถนำไปเปิดบนเบราว์เซอร์ของอีกเครื่องได้เลยครับ');
      }).catch(() => {
        prompt('คัดลอกลิงก์ด้านล่างนี้ได้เลยครับ:', this.currentSyncUrl);
      });
    } else {
      prompt('คัดลอกลิงก์ด้านล่างนี้ได้เลยครับ:', this.currentSyncUrl);
    }
  },

  async startQrScanner() {
    const video = document.getElementById('qr-video');
    const previewWrap = document.getElementById('cam-preview-wrap');
    const startBtn = document.getElementById('start-cam-btn');
    const stopBtn = document.getElementById('stop-cam-btn');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('เบราว์เซอร์นี้ไม่รองรับการเปิดกล้องโดยตรง กรุณาใช้กล้องถ่ายรูปของมือถือสแกนแทน หรือเลือกรูปภาพจากเครื่องครับ');
      return;
    }

    try {
      this.qrScannerStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      video.srcObject = this.qrScannerStream;
      video.setAttribute('playsinline', true);
      await video.play();

      if (previewWrap) previewWrap.style.display = 'block';
      if (startBtn) startBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = 'flex';

      this.scanQrFrame();
    } catch (err) {
      console.error('Cannot access camera:', err);
      alert('ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตให้เข้าถึงกล้อง หรือใช้แอปกล้องถ่ายรูปของมือถือสแกนแทนครับ');
    }
  },

  stopQrScanner() {
    if (this.qrScanAnimId) {
      cancelAnimationFrame(this.qrScanAnimId);
      this.qrScanAnimId = null;
    }
    if (this.qrScannerStream) {
      this.qrScannerStream.getTracks().forEach(track => track.stop());
      this.qrScannerStream = null;
    }
    const previewWrap = document.getElementById('cam-preview-wrap');
    const startBtn = document.getElementById('start-cam-btn');
    const stopBtn = document.getElementById('stop-cam-btn');
    if (previewWrap) previewWrap.style.display = 'none';
    if (startBtn) startBtn.style.display = 'flex';
    if (stopBtn) stopBtn.style.display = 'none';
  },

  scanQrFrame() {
    const video = document.getElementById('qr-video');
    const hiddenCanvas = document.getElementById('qr-hidden-canvas');
    if (!video || !hiddenCanvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      this.qrScanAnimId = requestAnimationFrame(() => this.scanQrFrame());
      return;
    }

    const ctx = hiddenCanvas.getContext('2d');
    hiddenCanvas.width = video.videoWidth;
    hiddenCanvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, hiddenCanvas.width, hiddenCanvas.height);

    const imageData = ctx.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height);
    if (typeof jsQR !== 'undefined') {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });
      if (code && code.data) {
        this.stopQrScanner();
        this.handleScannedUrl(code.data);
        return;
      }
    }

    this.qrScanAnimId = requestAnimationFrame(() => this.scanQrFrame());
  },

  handleQrImageFile(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.getElementById('qr-hidden-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        if (typeof jsQR !== 'undefined') {
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            this.handleScannedUrl(code.data);
          } else {
            alert('ไม่พบ QR Code ในภาพ กรุณาเลือกภาพที่คมชัดและเห็น QR ชัดเจนครับ');
          }
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    input.value = '';
  },

  handleScannedUrl(raw) {
    this.closeSyncModal();
    let hashPart = '';
    if (raw.includes('#sync=')) {
      hashPart = raw.split('#sync=')[1];
    } else if (raw.startsWith('#sync=')) {
      hashPart = raw.slice(6);
    } else {
      hashPart = raw;
    }

    if (typeof LZString === 'undefined') {
      setTimeout(() => this.handleScannedUrl(raw), 300);
      return;
    }

    try {
      const jsonStr = LZString.decompressFromEncodedURIComponent(hashPart);
      if (!jsonStr) throw new Error('Decompression returned empty');
      const payload = JSON.parse(jsonStr);
      this.showIncomingSyncModal(payload);
    } catch (e) {
      console.error('Failed to parse sync data:', e);
      alert('ข้อมูล QR Code ไม่ถูกต้องหรือเสียหาย กรุณาลองสแกนใหม่อีกครั้งครับ');
    }
  },

  checkUrlSync() {
    if (window.location.hash && window.location.hash.startsWith('#sync=')) {
      const hashData = window.location.hash.slice(6);
      if (hashData) {
        setTimeout(() => {
          this.handleScannedUrl(window.location.hash);
        }, 300);
      }
    }
  },

  showIncomingSyncModal(payload) {
    if (!payload || !payload.data) return;
    this.pendingSyncPayload = payload;

    const detailsEl = document.getElementById('incoming-sync-details');
    const modal = document.getElementById('incoming-sync-modal');
    if (!detailsEl || !modal) return;

    let dayCount = 0;
    let taskCount = 0;
    let scheduleCount = 0;
    let noteCount = 0;

    for (const [dateStr, dayData] of Object.entries(payload.data)) {
      dayCount++;
      if (dayData.tasks) taskCount += dayData.tasks.length;
      if (dayData.schedule) scheduleCount += dayData.schedule.length;
      if (dayData.note && dayData.note.trim()) noteCount++;
    }

    const typeDesc = payload.type === 'recent' ? '📅 ช่วงเดือนนี้และใกล้เคียง' : '📦 ข้อมูลทั้งหมด';

    detailsEl.innerHTML = `
      <div style="font-weight:700; color:var(--primary); margin-bottom:8px;">${typeDesc}</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:var(--text-xs); color:var(--text-secondary);">
        <div>🗓️ วันที่บันทึก: <strong>${dayCount} วัน</strong></div>
        <div>📋 งาน: <strong>${taskCount} รายการ</strong></div>
        <div>⏰ นัดหมาย: <strong>${scheduleCount} รายการ</strong></div>
        <div>📝 โน้ตบันทึก: <strong>${noteCount} วัน</strong></div>
      </div>
    `;

    modal.classList.add('open');
    this.playChimeSound();
  },

  confirmIncomingSync() {
    if (!this.pendingSyncPayload) return;
    const mergeMode = document.querySelector('input[name="incoming-sync-action"]:checked').value === 'merge';
    const result = Storage.applySyncData(this.pendingSyncPayload, mergeMode);

    if (result.success) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, null, window.location.pathname);
      }
      this.cancelIncomingSync();

      // Re-render current view
      if (this.currentView === 'day') this.renderDayView();
      else if (this.currentView === 'month') this.renderMonthView();
      else if (this.currentView === 'year') this.renderYearView();

      this.playChimeSound();
      alert(`🎉 อัปเดตข้อมูลเรียบร้อยแล้ว!\nนำเข้าข้อมูลทั้งหมด ${result.count} วัน ข้อมูลในเครื่องของคุณตรงกันแล้วครับ`);
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + result.error);
    }
  },

  cancelIncomingSync() {
    this.pendingSyncPayload = null;
    const modal = document.getElementById('incoming-sync-modal');
    if (modal) modal.classList.remove('open');
    if (window.history && window.history.replaceState && window.location.hash.startsWith('#sync=')) {
      window.history.replaceState(null, null, window.location.pathname);
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
