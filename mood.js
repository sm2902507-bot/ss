/* ============================================================
   mood.js  –  Mood tracker module
   ============================================================ */

const Mood = (() => {

  const STORAGE_KEY = 'serenitybot_moods';
  const EMOJIS      = { 5:'😄', 4:'🙂', 3:'😐', 2:'😔', 1:'😰' };
  const LABELS      = { 5:'Great', 4:'Good', 3:'Okay', 2:'Low', 1:'Stressed' };

  let selectedMood = null;
  let listEl, emptyEl, noteEl, logBtn;

  // ── Storage helpers ───────────────────────────────────────
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function save(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch { /* storage full */ }
  }

  // ── Render the history list ───────────────────────────────
  function renderList() {
    if (!listEl) return;
    const entries = load().slice().reverse(); // newest first

    listEl.innerHTML = '';
    emptyEl.style.display = entries.length ? 'none' : 'block';

    entries.slice(0, 10).forEach(entry => {
      const li = document.createElement('li');
      li.className = 'mood-entry';

      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'mood-entry-emoji';
      emojiSpan.textContent = EMOJIS[entry.mood] || '😐';

      const info = document.createElement('div');
      info.className = 'mood-entry-info';

      const label = document.createElement('div');
      label.className = 'mood-entry-label';
      label.textContent = LABELS[entry.mood] || 'Unknown';

      const note = document.createElement('div');
      note.className = 'mood-entry-note';
      note.textContent = entry.note || '';

      info.appendChild(label);
      if (entry.note) info.appendChild(note);

      const time = document.createElement('span');
      time.className = 'mood-entry-time';
      time.textContent = new Date(entry.timestamp).toLocaleString([], {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      li.appendChild(emojiSpan);
      li.appendChild(info);
      li.appendChild(time);
      listEl.appendChild(li);
    });
  }

  // ── Log a new entry ───────────────────────────────────────
  function logEntry() {
    if (!selectedMood) {
      App.showToast('Please select how you feel first 😊');
      return;
    }
    const entries = load();
    entries.push({
      mood:      selectedMood,
      note:      noteEl ? noteEl.value.trim() : '',
      timestamp: Date.now()
    });
    save(entries);

    // Reset UI
    selectedMood = null;
    document.querySelectorAll('.mood-emoji').forEach(b => b.classList.remove('selected'));
    if (noteEl) noteEl.value = '';

    App.showToast(`Mood logged: ${EMOJIS[entries[entries.length-1].mood]} ${LABELS[entries[entries.length-1].mood]}`);
    renderList();
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    listEl  = document.getElementById('moodList');
    emptyEl = document.getElementById('moodEmpty');
    noteEl  = document.getElementById('moodNote');
    logBtn  = document.getElementById('logMood');

    // Emoji selector
    document.querySelectorAll('.mood-emoji').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedMood = parseInt(btn.dataset.mood, 10);
        document.querySelectorAll('.mood-emoji').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    if (logBtn) logBtn.addEventListener('click', logEntry);

    renderList();
  }

  return { init };
})();
