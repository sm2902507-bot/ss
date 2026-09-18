/* ============================================================
   cursor.js  –  Gender-aware cursor bloom effects
   Female  → blooming flowers 🌸🌺🌼🌷🌻
   Male    → rockets, stars, lightning bolts 🚀⭐💥
   Teen    → hearts, music notes, emoji sparks 💖🎵✨
   Child   → balloons, rainbows, lollipops 🎈🌈🍭
   Senior  → soft leaves, gentle sparkles 🍃✨
   Other   → butterflies, crystal gems, comets 🦋💎☄️
   ============================================================ */

const Cursor = (() => {

  /* ── Profile state ────────────────────────────────────────*/
  let gender   = 'other';
  let ageGroup = 'adult';
  let active   = false;

  /* ── Throttle: max one bloom per N ms ────────────────────*/
  let lastTime = 0;
  const THROTTLE = 40; // ms — smooth but not overwhelming

  /* ── Bloom sets per profile ──────────────────────────────*/
  const sets = {
    female: {
      items: ['🌸','🌺','🌼','🌷','🌻','💮','🌹','🏵️','🌸','🌼'],
      sizes: [18, 22, 16, 20, 24],
      colors: null, // emoji only
      shape: 'emoji',
      trail: true,
      trailColor: ['#f9d4e8','#fce4f0','#f4c8e0','#ffe8f4','#f8d0e8'],
    },
    male_student: {
      items: ['🚀','⭐','💫','🌠','🎯','⚡','🔥','💡','🏆','🎮'],
      sizes: [18, 20, 22, 16],
      shape: 'emoji',
      trail: true,
      trailColor: ['#d6e8f7','#b8d8f4','#c8e4ff','#a8d0f0'],
    },
    male_worker: {
      items: ['⚙️','🔧','💪','⭐','🔩','🏗️','💡','🔨','🌟','🔑'],
      sizes: [16, 20, 18],
      shape: 'emoji',
      trail: true,
      trailColor: ['#fdf6e8','#f8ecd0','#faeeda'],
    },
    male_staff: {
      items: ['📊','💼','✨','📈','🎯','💡','📋','🌟','💎','🏅'],
      sizes: [16, 18, 20],
      shape: 'emoji',
      trail: true,
      trailColor: ['#e0f4f0','#d6f0ea','#c8ece4'],
    },
    male_other: {
      items: ['⭐','💫','🌟','✨','🌠','💥','🔵','🟢','⚡','🎯'],
      sizes: [14, 18, 22],
      shape: 'emoji',
      trail: true,
      trailColor: ['#edf8ff','#e0f4ff','#d6f0ff'],
    },
    child: {
      items: ['🎈','🌈','🍭','⭐','🎉','🎊','🍬','🎀','🌟','🎠'],
      sizes: [22, 26, 20, 24],
      shape: 'emoji',
      trail: true,
      trailColor: ['#fff0f8','#fce8ff','#f8fff0','#fff8e0'],
    },
    teen: {
      items: ['💖','🎵','✨','🎶','💫','🎸','🌟','💝','🎤','🌈'],
      sizes: [18, 20, 16, 22],
      shape: 'emoji',
      trail: true,
      trailColor: ['#ffe8f4','#f0e8ff','#e8f4ff'],
    },
    senior: {
      items: ['🍃','✨','🌿','💚','🍀','🌾','🕊️','☀️','🌱','🍂'],
      sizes: [16, 18, 14],
      shape: 'emoji',
      trail: true,
      trailColor: ['#e8f8f0','#f0f8e8','#eaf5e8'],
    },
    other: {
      items: ['🦋','💎','☄️','🌀','💜','🔮','🌌','⚡','🦄','🌈'],
      sizes: [18, 20, 22],
      shape: 'emoji',
      trail: true,
      trailColor: ['#f4f0ff','#e8f0ff','#f0e8ff'],
    },
  };

  /* ── Pick the right set for current profile ─────────────*/
  function getSet() {
    if (ageGroup === 'child')  return sets.child;
    if (ageGroup === 'teen')   return sets.teen;
    if (ageGroup === 'senior') return sets.senior;
    if (gender === 'female')   return sets.female;
    if (gender === 'male') {
      const role = _role || 'other';
      return sets[`male_${role}`] || sets.male_other;
    }
    return sets.other;
  }

  let _role = 'other';

  /* ── Spawn a single bloom element ───────────────────────*/
  function spawnBloom(x, y) {
    const set  = getSet();
    const item = set.items[Math.floor(Math.random() * set.items.length)];
    const size = set.sizes[Math.floor(Math.random() * set.sizes.length)];

    const el = document.createElement('div');
    el.className = 'cursor-bloom';
    el.textContent = item;

    // Random spread
    const angle  = Math.random() * Math.PI * 2;
    const dist   = 18 + Math.random() * 38;
    const tx     = Math.cos(angle) * dist;
    const ty     = Math.sin(angle) * dist - 20; // slight upward bias

    el.style.cssText = `
      left: ${x}px;
      top:  ${y}px;
      font-size: ${size}px;
      --tx: ${tx}px;
      --ty: ${ty}px;
      --rot: ${(Math.random() - 0.5) * 80}deg;
      animation-duration: ${0.7 + Math.random() * 0.5}s;
    `;

    document.body.appendChild(el);

    // Self-clean after animation
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  /* ── Trail dot (subtle colour smear behind cursor) ───────*/
  function spawnTrail(x, y) {
    const set   = getSet();
    if (!set.trail) return;
    const color = set.trailColor[Math.floor(Math.random() * set.trailColor.length)];

    const dot = document.createElement('div');
    dot.className = 'cursor-trail';
    dot.style.cssText = `
      left: ${x}px;
      top:  ${y}px;
      background: ${color};
    `;
    document.body.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove(), { once: true });
  }

  /* ── Mouse / touch move handler ─────────────────────────*/
  function onMove(e) {
    if (!active) return;
    const now = Date.now();
    if (now - lastTime < THROTTLE) return;
    lastTime = now;

    const x = e.clientX ?? e.touches?.[0]?.clientX;
    const y = e.clientY ?? e.touches?.[0]?.clientY;
    if (x == null || y == null) return;

    spawnTrail(x, y);

    // Bloom on every 2nd tick to keep it light
    if (Math.random() > 0.45) spawnBloom(x, y);
  }

  /* ── Burst on click / tap ────────────────────────────────*/
  function onClick(e) {
    if (!active) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX;
    const y = e.clientY ?? e.touches?.[0]?.clientY;
    if (x == null || y == null) return;
    // Spawn 5–7 blooms in a burst
    const count = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) spawnBloom(x, y);
  }

  /* ── Public API ──────────────────────────────────────────*/
  function setProfile(g, r, ag) {
    gender   = g  || 'other';
    _role    = r  || 'other';
    ageGroup = ag || 'adult';
  }

  function start() {
    if (active) return;
    active = true;
    window.addEventListener('mousemove',  onMove,   { passive: true });
    window.addEventListener('touchmove',  onMove,   { passive: true });
    window.addEventListener('click',      onClick);
    window.addEventListener('touchstart', onClick,  { passive: true });
  }

  function stop() {
    active = false;
    window.removeEventListener('mousemove',  onMove);
    window.removeEventListener('touchmove',  onMove);
    window.removeEventListener('click',      onClick);
    window.removeEventListener('touchstart', onClick);
  }

  return { setProfile, start, stop };
})();
