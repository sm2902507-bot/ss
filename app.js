/* ============================================================
   app.js  –  Main application controller
   Wires: Auth · I18n · Voice · ChatBot · Breathing ·
          Affirmations · Mood · Background themes
   ============================================================ */

const App = (() => {

  /* ── Toast ──────────────────────────────────────────────── */
  let toastEl = null, toastTimer = null;

  function showToast(msg, duration = 2800) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
  }

  /* ── View navigation ────────────────────────────────────── */
  function switchView(id) {
    // Sync desktop sidebar nav
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const sideBtn = document.querySelector(`.nav-btn[data-view="${id}"]`);
    if (sideBtn) sideBtn.classList.add('active');

    // Sync mobile bottom nav
    document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
    const mobBtn = document.querySelector(`.mobile-nav-btn[data-view="${id}"]`);
    if (mobBtn) mobBtn.classList.add('active');

    // Show the correct view
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const v = document.getElementById(`view-${id}`);
    if (v) v.classList.add('active');
  }

  /* ══════════════════════════════════════════════════════════
     BACKGROUND THEME
     Applies body classes:
       theme-{gender}-{role}   → particle colours + body gradient
       age-{ageGroup}          → particle speed / opacity
       gender-{gender}         → UI colour overrides
  ═══════════════════════════════════════════════════════════ */
  function applyTheme(user) {
    const { gender = 'other', role = 'other', ageGroup = 'adult' } = user;
    const body = document.body;

    // Remove any old theme classes first
    body.classList.forEach(cls => {
      if (cls.startsWith('theme-') ||
          cls.startsWith('age-')   ||
          cls.startsWith('gender-')) {
        body.classList.remove(cls);
      }
    });

    // Apply new classes
    body.classList.add(`theme-${gender}-${role}`);  // particle colours
    body.classList.add(`age-${ageGroup}`);           // animation speed
    body.classList.add(`gender-${gender}`);          // UI colour overrides
    body.classList.add('themed');                    // activates gradient bg
  }

  /* ── Language picker ────────────────────────────────────── */
  const _togglesBound = new WeakSet();

  function bindToggle(btnEl, dropdownEl) {
    if (!btnEl || !dropdownEl || _togglesBound.has(btnEl)) return;
    _togglesBound.add(btnEl);
    btnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdownEl.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) {
        dropdownEl.classList.add('open');
        btnEl.setAttribute('aria-expanded', 'true');
      }
    });
  }

  function buildLangDropdown(dropdownEl, btnEl, flagEl, nameEl) {
    if (!dropdownEl) return;
    bindToggle(btnEl, dropdownEl);
    dropdownEl.innerHTML = '';
    I18n.getAllLangs().forEach(({ code, flag, name }) => {
      const li  = document.createElement('li');
      const btn = document.createElement('button');
      btn.type      = 'button';
      btn.className = 'lang-option' + (code === I18n.currentCode() ? ' active' : '');
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(code === I18n.currentCode()));
      btn.innerHTML = `<span class="lang-flag">${flag}</span><span class="lang-name">${name}</span>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        I18n.setLang(code);
        closeAllDropdowns();
        applyLanguage();
      });
      li.appendChild(btn);
      dropdownEl.appendChild(li);
    });
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.lang-dropdown').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.lang-picker-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  function updateLangBtnDisplay(flagEl, nameEl) {
    const meta = I18n.getLangMeta(I18n.currentCode());
    if (flagEl) flagEl.textContent = meta.flag;
    if (nameEl) nameEl.textContent = meta.name;
  }

  function applyLanguage() {
    buildLangDropdown(
      document.getElementById('authLangDropdown'),
      document.getElementById('authLangBtn'),
      document.getElementById('authLangFlag'),
      document.getElementById('authLangName')
    );
    buildLangDropdown(
      document.getElementById('appLangDropdown'),
      document.getElementById('appLangBtn'),
      document.getElementById('appLangFlag'),
      document.getElementById('appLangName')
    );
    updateLangBtnDisplay(
      document.getElementById('authLangFlag'),
      document.getElementById('authLangName')
    );
    updateLangBtnDisplay(
      document.getElementById('appLangFlag'),
      document.getElementById('appLangName')
    );
    I18n.applyToDOM();
    renderChips();
    Voice.updateLang();
  }

  /* ── Quick-reply chips ──────────────────────────────────── */
  function renderChips() {
    const container = document.getElementById('quickReplies');
    if (!container) return;
    const keys = ['anxious','overwhelmed','frustrated','cantSleep','breathing2','justTalk'];
    container.innerHTML = '';
    keys.forEach(k => {
      const btn = document.createElement('button');
      btn.className   = 'chip';
      btn.textContent = I18n.get(k);
      btn.addEventListener('click', () => sendMessage(btn.textContent.trim()));
      container.appendChild(btn);
    });
  }

  /* ══════════════════════════════════════════════════════════
     AUTH SCREEN
  ═══════════════════════════════════════════════════════════ */
  function initAuth() {
    const authScreen = document.getElementById('authScreen');
    if (Auth.currentUser()) { showApp(Auth.currentUser()); return; }
    authScreen.removeAttribute('hidden');

    /* Tab switching */
    const tabLogin    = document.getElementById('tabLogin');
    const tabSignup   = document.getElementById('tabSignup');
    const panelLogin  = document.getElementById('panelLogin');
    const panelSignup = document.getElementById('panelSignup');

    function showPanel(panel) {
      [panelLogin, panelSignup].forEach(p => p.classList.remove('active'));
      [tabLogin,   tabSignup  ].forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panel.classList.add('active');
      const tab = panel === panelLogin ? tabLogin : tabSignup;
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
    }

    tabLogin .addEventListener('click', () => showPanel(panelLogin));
    tabSignup.addEventListener('click', () => showPanel(panelSignup));
    document.getElementById('goToSignup').addEventListener('click', () => showPanel(panelSignup));
    document.getElementById('goToLogin') .addEventListener('click', () => showPanel(panelLogin));

    /* Show/hide password */
    function bindTogglePw(btnId, inputId) {
      const btn = document.getElementById(btnId);
      const inp = document.getElementById(inputId);
      if (!btn || !inp) return;
      btn.addEventListener('click', () => {
        inp.type = inp.type === 'password' ? 'text' : 'password';
        btn.textContent = inp.type === 'password' ? '👁' : '🙈';
      });
    }
    bindTogglePw('toggleLoginPw',  'loginPassword');
    bindTogglePw('toggleSignupPw', 'signupPassword');

    /* Password strength meter */
    const pwInput = document.getElementById('signupPassword');
    const pwBar   = document.getElementById('pwBar');
    const pwText  = document.getElementById('pwStrengthText');
    if (pwInput) {
      pwInput.addEventListener('input', () => {
        const pw = pwInput.value;
        let score = 0;
        if (pw.length >= 6)           score++;
        if (pw.length >= 10)          score++;
        if (/[A-Z]/.test(pw))         score++;
        if (/[0-9]/.test(pw))         score++;
        if (/[^a-zA-Z0-9]/.test(pw))  score++;
        const colors = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#27ae60'];
        const labels = ['Weak','Fair','Good','Strong','Very Strong'];
        if (pwBar)  { pwBar.style.width = (score/5*100)+'%'; pwBar.style.background = colors[score-1]||'#e74c3c'; }
        if (pwText) { pwText.textContent = pw.length ? (labels[score-1]||'') : ''; pwText.style.color = colors[score-1]||''; }
      });
    }

    /* Profile chip pickers (gender + role) */
    function initChipGroup(containerId, hiddenId) {
      const container = document.getElementById(containerId);
      const hidden    = document.getElementById(hiddenId);
      if (!container || !hidden) return;
      container.querySelectorAll('.profile-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          container.querySelectorAll('.profile-chip').forEach(c => c.classList.remove('selected'));
          chip.classList.add('selected');
          hidden.value = chip.dataset.value;
        });
      });
    }
    initChipGroup('genderPicker', 'signupGender');
    initChipGroup('rolePicker',   'signupRole');

    /* ── Login form ── */
    const loginForm  = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginBtn   = document.getElementById('loginBtn');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('loginUsername').value;
        const pass = document.getElementById('loginPassword').value;
        if (!user || !pass) { loginError.textContent = 'Please fill in all fields 😊'; return; }
        setLoading(loginBtn, true);
        loginError.textContent = '';
        const res = await Auth.login(user, pass);
        setLoading(loginBtn, false);
        if (res.ok) {
          fadeOutAuth(() => showApp(Auth.currentUser()));
        } else {
          loginError.textContent = res.message;
          shake(loginForm);
        }
      });
    }

    /* ── Signup form ── */
    const signupForm  = document.getElementById('signupForm');
    const signupError = document.getElementById('signupError');
    const signupBtn   = document.getElementById('signupBtn');
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user    = document.getElementById('signupUsername').value;
        const pass    = document.getElementById('signupPassword').value;
        const confirm = document.getElementById('signupConfirm').value;
        const age     = document.getElementById('signupAge').value;
        const gender  = document.getElementById('signupGender').value;
        const role    = document.getElementById('signupRole').value;
        signupError.textContent = '';
        if (!user || !pass || !confirm) { signupError.textContent = 'Please fill in all fields 😊'; return; }
        if (pass !== confirm)           { signupError.textContent = 'Those passwords don\'t match — give it another go 🔒'; shake(signupForm); return; }
        setLoading(signupBtn, true);
        const res = await Auth.register(user, pass, gender, role, age);
        setLoading(signupBtn, false);
        if (res.ok) {
          fadeOutAuth(() => showApp(Auth.currentUser()));
        } else {
          signupError.textContent = res.message;
          shake(signupForm);
        }
      });
    }
  }

  function fadeOutAuth(callback) {
    const authScreen = document.getElementById('authScreen');
    authScreen.style.transition = 'opacity .4s ease';
    authScreen.style.opacity    = '0';
    setTimeout(() => {
      authScreen.setAttribute('hidden', '');
      authScreen.style.opacity = '';
      callback();
    }, 420);
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    const t = btn.querySelector('.btn-text');
    const s = btn.querySelector('.btn-spinner');
    if (t) t.style.opacity = loading ? '0.4' : '1';
    if (s) s.hidden        = !loading;
  }

  function shake(el) {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'shake .4s ease';
    setTimeout(() => { el.style.animation = ''; }, 500);
  }

  /* ══════════════════════════════════════════════════════════
     SHOW MAIN APP  — called after successful login/signup
  ═══════════════════════════════════════════════════════════ */
  function showApp(user) {
    /* Show app shell */
    document.getElementById('appWrapper') .removeAttribute('hidden');
    document.getElementById('bgParticles').removeAttribute('hidden');

    /* Apply background theme immediately */
    applyTheme(user);

    /* Pass full profile to chatbot */
    ChatBot.setProfile({
      name:     user.username,
      gender:   user.gender,
      role:     user.role,
      ageGroup: user.ageGroup,
    });

    /* Sidebar user display */
    const nameEl  = document.getElementById('userName');
    const greetEl = document.querySelector('.user-greeting');
    if (nameEl)  nameEl.textContent  = user.username;
    if (greetEl) greetEl.textContent = I18n.get('hello');

    /* Update avatar emoji per gender */
    const avatarEl = document.querySelector('.sidebar-user .user-avatar');
    if (avatarEl) {
      avatarEl.textContent =
        user.gender === 'female' ? '👩' :
        user.gender === 'male'   ? '👨' : '🧑';
    }

    /* ── Start cursor bloom engine ── */
    Cursor.setProfile(user.gender, user.role, user.ageGroup);
    const savedBloom = loadSetting('cursorBloom', true);
    if (savedBloom) {
      document.body.classList.add('bloom-active');
      spawnCursorDot();
      Cursor.start();
    }

    /* Init all modules */
    initNav();
    initChat(user);
    Breathing.init();
    Affirmations.init();
    Mood.init();
    Voice.init();
    initSettings(user);
    applyLanguage();

    /* Logout */
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        Auth.logout();
        Voice.stopListening();
        Voice.stopSpeaking();
        location.reload();
      });
    }
  }

  /* ── Navigation ─────────────────────────────────────────── */
  function initNav() {
    // Desktop sidebar nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchView(btn.dataset.view);
        closeSidebar(); // close drawer on mobile after nav
      });
    });

    // Mobile bottom nav buttons
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Mobile hamburger
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (menuBtn) menuBtn.addEventListener('click', openSidebar);

    // Sidebar close button (✕)
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) sidebarToggle.addEventListener('click', closeSidebar);

    // Overlay tap to close
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Close dropdowns on outside click
    document.addEventListener('click', () => closeAllDropdowns());
  }

  function openSidebar() {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.add('active');
    document.body.classList.add('sidebar-open');
  }

  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('active');
    document.body.classList.remove('sidebar-open');
  }

  /* ══════════════════════════════════════════════════════════
     CHAT
  ═══════════════════════════════════════════════════════════ */
  const HISTORY_KEY = 'serenitybot_chat';
  let chatHistory   = [];

  function loadHistory() {
    try { chatHistory = JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch { chatHistory = []; }
  }

  function saveHistory() {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(chatHistory.slice(-60))); }
    catch {}
  }

  function appendMessage(text, role, timestamp) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const bubble = ChatBot.createBubble(text, role, timestamp ? new Date(timestamp) : new Date());
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  }

  function addToHistory(text, role) {
    chatHistory.push({ text, role, timestamp: Date.now() });
    saveHistory();
  }

  function sendMessage(text) {
    if (!text.trim()) return;
    appendMessage(text, 'user');
    addToHistory(text, 'user');

    const container = document.getElementById('chatMessages');
    const typing    = ChatBot.createTyping();
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;

    const delay = 700 + Math.random() * 700;
    setTimeout(() => {
      const indicator = document.getElementById('typingIndicator');
      if (indicator) indicator.remove();

      const response = ChatBot.getResponse(text);
      appendMessage(response, 'bot');
      addToHistory(response, 'bot');
      Voice.setLastBotText(response);

      if (Voice.isSupported && document.getElementById('micBtn')?.classList.contains('voice-active')) {
        Voice.speak(response);
      }
    }, delay);
  }

  function clearChat(user) {
    chatHistory = [];
    saveHistory();
    const container = document.getElementById('chatMessages');
    if (container) container.innerHTML = '';
    showWelcome(user);
  }

  /* ── Personalised welcome messages ─────────────────────── */
  function showWelcome(user) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const { username, gender, ageGroup } = user;

    /* Choose greeting set based on gender + ageGroup */
    let msgs;

    if (ageGroup === 'child') {
      msgs = [
        `Hi ${username}! 🌈🎉 I'm SerenityBot and I'm SO happy you're here! You can tell me anything — I'm a really good listener! 🐻`,
        `This is a super safe and cosy place just for you, ${username}. Nobody can hear us — it's just us! 💛`,
        `I can help you when you're feeling worried, sad, or just want to talk. Ready? Let's go! 🚀`,
        `So tell me ${username} — how are you feeling today? 🌟`,
      ];
    } else if (ageGroup === 'teen') {
      msgs = [
        `Hey ${username}! 👋 I'm SerenityBot — no judgement, no lectures, just real support. 💙`,
        `This is your space, completely private and safe. Say whatever's on your mind.`,
        `I can listen, guide you through breathing, share positive thoughts, and just be here when things get heavy. ✨`,
        `So ${username} — what's going on today? 💙`,
      ];
    } else if (gender === 'female') {
      msgs = [
        `Hello ${username}! 🌸 I'm SerenityBot — your warm, caring companion. I'm so glad you're here.`,
        `This is your safe space, ${username}. Completely private, completely gentle. You can say anything here — I'm listening with my whole heart. 💜`,
        `I'm here to listen, to breathe with you, to share kind words, and to remind you how truly wonderful you are. 🌷`,
        `So, ${username} — how is your heart today? 🌸`,
      ];
    } else {
      msgs = [
        I18n.get('welcome1', username),
        I18n.get('welcome2'),
        I18n.get('welcome3'),
        I18n.get('welcome4'),
      ];
    }

    msgs.forEach((msg, i) => {
      setTimeout(() => {
        appendMessage(msg, 'bot');
        if (i === msgs.length - 1) Voice.setLastBotText(msg);
      }, i * 700);
    });
  }

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  function initChat(user) {
    const form     = document.getElementById('chatForm');
    const input    = document.getElementById('userInput');
    const clearBtn = document.getElementById('clearChat');
    if (!form || !input) return;

    loadHistory();
    if (chatHistory.length > 0) {
      chatHistory.forEach(m => appendMessage(m.text, m.role, m.timestamp));
    } else {
      showWelcome(user);
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      autoResize(input);
      sendMessage(text);
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
      }
    });

    input.addEventListener('input', () => autoResize(input));

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm(I18n.get('clearConfirm'))) clearChat(user);
      });
    }
  }

  /* ══════════════════════════════════════════════════════════
     SETTINGS  — persist to localStorage, wire all toggles
  ═══════════════════════════════════════════════════════════ */
  const SETTINGS_KEY = 'serenitybot_settings';

  function loadSetting(key, defaultVal) {
    try {
      const all = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      return key in all ? all[key] : defaultVal;
    } catch { return defaultVal; }
  }

  function saveSetting(key, val) {
    try {
      const all = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
      all[key] = val;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(all));
    } catch {}
  }

  function initSettings(user) {
    /* ── Profile card ── */
    const card = document.getElementById('settingsProfileCard');
    if (card) {
      const avatar =
        user.gender === 'female' ? '👩' :
        user.gender === 'male'   ? '👨' : '🧑';
      const roleLabel = { student:'🎒 Student', staff:'🏫 Staff', worker:'💼 Worker', other:'🌿 Other' };
      const ageLabel  = { child:'🧒 Child', teen:'🧑 Teen', young:'✨ Young Adult', adult:'💼 Adult', senior:'🌿 Senior' };
      card.innerHTML = `
        <div class="spc-avatar">${avatar}</div>
        <div class="spc-info">
          <span class="spc-name">${user.username}</span>
          <div class="spc-tags">
            <span class="spc-tag">${roleLabel[user.role] || user.role}</span>
            <span class="spc-tag">${ageLabel[user.ageGroup] || user.ageGroup}</span>
            <span class="spc-tag">${user.gender === 'female' ? '👧 Female' : user.gender === 'male' ? '👦 Male' : '🧑 Other'}</span>
            <span class="spc-tag">Age ${user.age || '–'}</span>
          </div>
        </div>`;
    }

    /* ── Toggle helpers ── */
    function bindToggle(id, settingKey, defaultVal, onChange) {
      const el = document.getElementById(id);
      if (!el) return;
      el.checked = loadSetting(settingKey, defaultVal);
      el.addEventListener('change', () => {
        saveSetting(settingKey, el.checked);
        onChange(el.checked);
      });
    }

    /* Cursor bloom */
    bindToggle('settingCursorBloom', 'cursorBloom', true, (on) => {
      if (on) {
        document.body.classList.add('bloom-active');
        spawnCursorDot();
        Cursor.start();
      } else {
        document.body.classList.remove('bloom-active');
        removeCursorDot();
        Cursor.stop();
      }
    });

    /* Click bloom — no separate toggle needed in cursor.js; we disable via CSS */
    bindToggle('settingClickBloom', 'clickBloom', true, (on) => {
      document.body.classList.toggle('no-click-bloom', !on);
    });

    /* Background particles */
    bindToggle('settingParticles', 'particles', true, (on) => {
      const p = document.getElementById('bgParticles');
      if (p) p.style.display = on ? '' : 'none';
    });
    // Apply on load
    if (!loadSetting('particles', true)) {
      const p = document.getElementById('bgParticles');
      if (p) p.style.display = 'none';
    }

    /* Reduced motion */
    bindToggle('settingReducedMotion', 'reducedMotion', false, (on) => {
      document.body.classList.toggle('reduced-motion', on);
    });
    if (loadSetting('reducedMotion', false)) document.body.classList.add('reduced-motion');

    /* Auto-speak */
    bindToggle('settingAutoSpeak', 'autoSpeak', false, () => {});

    /* ── Data danger buttons ── */
    const btnClearChat = document.getElementById('settingClearChat');
    if (btnClearChat) {
      btnClearChat.addEventListener('click', () => {
        if (confirm('Clear all chat messages? This cannot be undone.')) {
          localStorage.removeItem('serenitybot_chat');
          const container = document.getElementById('chatMessages');
          if (container) container.innerHTML = '';
          showWelcome(user);
          showToast('Chat cleared 🌿');
          switchView('chat');
        }
      });
    }

    const btnClearMood = document.getElementById('settingClearMood');
    if (btnClearMood) {
      btnClearMood.addEventListener('click', () => {
        if (confirm('Clear all mood entries? This cannot be undone.')) {
          localStorage.removeItem('serenitybot_moods');
          document.getElementById('moodList')?.replaceChildren();
          const emptyEl = document.getElementById('moodEmpty');
          if (emptyEl) emptyEl.style.display = 'block';
          showToast('Mood log cleared 🌿');
        }
      });
    }

    const btnDelete = document.getElementById('settingDeleteAccount');
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        if (confirm('Delete your account and ALL data permanently? This cannot be undone.')) {
          Auth.logout();
          localStorage.clear();
          sessionStorage.clear();
          showToast('Account deleted. Goodbye 💜');
          setTimeout(() => location.reload(), 1200);
        }
      });
    }

    /* ── Help search ── */
    const searchEl = document.getElementById('helpSearch');
    if (searchEl) {
      searchEl.addEventListener('input', () => {
        const q = searchEl.value.trim().toLowerCase();
        document.querySelectorAll('.faq-item').forEach(item => {
          const text = item.textContent.toLowerCase();
          item.classList.toggle('faq-hidden', q.length > 0 && !text.includes(q));
        });
      });
    }
  }

  /* ══════════════════════════════════════════════════════════
     CURSOR DOT  —  custom pointer that follows the mouse
  ═══════════════════════════════════════════════════════════ */
  let _cursorDot = null;

  function spawnCursorDot() {
    if (_cursorDot) return;
    _cursorDot = document.createElement('div');
    _cursorDot.className = 'cursor-dot';
    document.body.appendChild(_cursorDot);
    window.addEventListener('mousemove', moveCursorDot, { passive: true });
  }

  function moveCursorDot(e) {
    if (!_cursorDot) return;
    _cursorDot.style.left = e.clientX + 'px';
    _cursorDot.style.top  = e.clientY + 'px';
  }

  function removeCursorDot() {
    if (_cursorDot) { _cursorDot.remove(); _cursorDot = null; }
    window.removeEventListener('mousemove', moveCursorDot);
  }

  /* ── Bootstrap ──────────────────────────────────────────── */
  function init() {
    I18n.setLang(I18n.currentCode());
    I18n.applyToDOM();

    buildLangDropdown(
      document.getElementById('authLangDropdown'),
      document.getElementById('authLangBtn'),
      document.getElementById('authLangFlag'),
      document.getElementById('authLangName')
    );
    buildLangDropdown(
      document.getElementById('appLangDropdown'),
      document.getElementById('appLangBtn'),
      document.getElementById('appLangFlag'),
      document.getElementById('appLangName')
    );
    updateLangBtnDisplay(
      document.getElementById('authLangFlag'),
      document.getElementById('authLangName')
    );
    updateLangBtnDisplay(
      document.getElementById('appLangFlag'),
      document.getElementById('appLangName')
    );

    initAuth();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { showToast, switchView, sendMessage };
})();
