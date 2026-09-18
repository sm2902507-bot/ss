/* ============================================================
   auth.js  –  Secure login / signup
   Stores: username · SHA-256+salt password · gender · role
   Plain-text passwords are NEVER stored.
   ============================================================ */

const Auth = (() => {

  const USERS_KEY   = 'serenitybot_users';
  const SESSION_KEY = 'serenitybot_session';

  // ── Crypto helpers ────────────────────────────────────────
  function bufToHex(buf) {
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function generateSalt() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return bufToHex(arr.buffer);
  }

  async function hashPassword(password, salt) {
    const data = new TextEncoder().encode(salt + password);
    const buf  = await crypto.subtle.digest('SHA-256', data);
    return bufToHex(buf);
  }

  // ── Storage ───────────────────────────────────────────────
  function loadUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
    catch { return {}; }
  }
  function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

  // ── Session ───────────────────────────────────────────────
  /** Returns the current session object { username, gender, role, age, ageGroup } or null */
  function currentUser() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function logout() { sessionStorage.removeItem(SESSION_KEY); }

  /**
   * Maps numeric age to a named group
   * child (5–12) · teen (13–17) · young (18–25) · adult (26–45) · senior (46+)
   */
  function ageGroup(age) {
    const n = parseInt(age, 10);
    if (isNaN(n) || n < 5)  return 'adult';
    if (n <= 12)             return 'child';
    if (n <= 17)             return 'teen';
    if (n <= 25)             return 'young';
    if (n <= 45)             return 'adult';
    return 'senior';
  }

  // ── Register ──────────────────────────────────────────────
  /**
   * @param {string} username
   * @param {string} password
   * @param {string} gender   – 'male' | 'female' | 'other'
   * @param {string} role     – 'student' | 'staff' | 'worker' | 'other'
   * @param {number|string} age
   */
  async function register(username, password, gender, role, age) {
    const name = username.trim();

    if (!name || name.length < 3)
      return { ok: false, message: 'Please use at least 3 characters for your name 😊' };
    if (!/^[a-zA-Z0-9_ ]+$/.test(name))
      return { ok: false, message: 'Only letters, numbers, spaces and underscores please 😊' };
    if (!password || password.length < 6)
      return { ok: false, message: 'Your password needs at least 6 characters 🔒' };
    if (!gender)
      return { ok: false, message: 'Please let us know your gender so we can personalise your experience 😊' };
    if (!role)
      return { ok: false, message: 'Please tell us your role so we can support you better 💙' };
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 120)
      return { ok: false, message: 'Please enter a valid age between 5 and 120 😊' };

    const users = loadUsers();
    const key   = name.toLowerCase();
    if (users[key])
      return { ok: false, message: `The name "${name}" is already taken — try another one 😊` };

    const salt = generateSalt();
    const hash = await hashPassword(password, salt);

    users[key] = {
      username,
      salt,
      hash,
      gender:   gender  || 'other',
      role:     role    || 'other',
      age:      ageNum,
      ageGroup: ageGroup(ageNum),
      createdAt: Date.now()
    };
    saveUsers(users);

    const session = {
      username: name,
      gender:   users[key].gender,
      role:     users[key].role,
      age:      users[key].age,
      ageGroup: users[key].ageGroup
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true };
  }

  // ── Login ─────────────────────────────────────────────────
  async function login(username, password) {
    const name  = username.trim();
    const users = loadUsers();
    const key   = name.toLowerCase();
    const user  = users[key];

    if (!user)
      return { ok: false, message: "Hmm, we couldn't find that name. Are you new here? 😊" };

    const hash = await hashPassword(password, user.salt);
    if (hash !== user.hash)
      return { ok: false, message: "That password doesn't seem right. Please try again 🔒" };

    const session = {
      username: user.username,
      gender:   user.gender   || 'other',
      role:     user.role     || 'other',
      age:      user.age      || 20,
      ageGroup: user.ageGroup || ageGroup(user.age || 20)
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { ok: true };
  }

  return { register, login, logout, currentUser };
})();
