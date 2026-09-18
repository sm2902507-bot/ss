/* ============================================================
   affirmations.js  –  Daily affirmations module
   ============================================================ */

const Affirmations = (() => {

  const list = [
    "I am enough, exactly as I am right now.",
    "I choose peace over worry in this moment.",
    "I release what I cannot control and embrace what I can.",
    "My feelings are valid, and I have the strength to process them.",
    "I am worthy of rest, kindness, and care.",
    "Every breath I take fills me with calm and clarity.",
    "I am resilient. I have overcome challenges before and I will again.",
    "I give myself permission to slow down and just be.",
    "My mind is growing calmer with every passing moment.",
    "I am not my stress. I am the awareness behind it.",
    "I deserve gentleness — especially from myself.",
    "This too shall pass. I am stronger than this moment.",
    "I am learning and growing at my own perfect pace.",
    "My worth is not measured by my productivity.",
    "I trust myself to handle whatever comes my way.",
    "I breathe in calm. I breathe out tension.",
    "I am surrounded by more support than I sometimes realise.",
    "Small steps forward are still progress worth celebrating.",
    "I choose to be kind to my mind and body today.",
    "I am at peace with things I cannot change.",
    "My thoughts do not define me; I can choose what I focus on.",
    "I have the courage to ask for help when I need it.",
    "Rest is not laziness — it is a necessity I honour.",
    "I am doing my best, and my best is always enough.",
    "Today, I choose compassion — for others and for myself.",
    "I release anxiety and welcome tranquility into my heart.",
    "My challenges are making me wiser and more compassionate.",
    "I am present. This moment is where my power lives.",
    "I nourish my soul with kindness, patience, and love.",
    "I radiate calm, confidence, and resilience."
  ];

  const icons = ['🌸','🌿','✨','💜','💙','🌤️','🌊','🌻','🍃','⭐','🌙','🦋'];

  let currentIndex = Math.floor(Math.random() * list.length);

  // ── DOM refs ──────────────────────────────────────────────
  let textEl, iconEl, gridEl, nextBtn, shareBtn;

  function resolveEls() {
    textEl   = document.getElementById('affirmationText');
    iconEl   = document.querySelector('#affirmationCard .affirmation-icon');
    gridEl   = document.getElementById('affirmationGrid');
    nextBtn  = document.getElementById('nextAffirmation');
    shareBtn = document.getElementById('shareAffirmation');
  }

  // ── Show a specific affirmation ───────────────────────────
  function show(index) {
    if (!textEl) return;
    currentIndex = ((index % list.length) + list.length) % list.length;
    textEl.textContent = `"${list[currentIndex]}"`;
    if (iconEl) iconEl.textContent = icons[currentIndex % icons.length];

    // Animate card
    const card = document.getElementById('affirmationCard');
    if (card) {
      card.style.animation = 'none';
      card.offsetHeight; // reflow
      card.style.animation = 'fadeIn .5s ease';
    }
  }

  // ── Build grid of extra affirmations ─────────────────────
  function buildGrid() {
    if (!gridEl) return;
    gridEl.innerHTML = '';
    // Pick 6 random ones (excluding current)
    const picks = [];
    const pool  = list.map((_, i) => i).filter(i => i !== currentIndex);
    while (picks.length < 6 && pool.length > 0) {
      const ri = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(ri, 1)[0]);
    }
    picks.forEach(i => {
      const tile = document.createElement('div');
      tile.className = 'affirmation-tile';
      tile.textContent = `${icons[i % icons.length]} ${list[i]}`;
      tile.title = 'Click to feature this affirmation';
      tile.style.cursor = 'pointer';
      tile.addEventListener('click', () => { show(i); buildGrid(); });
      gridEl.appendChild(tile);
    });
  }

  // ── Copy to clipboard ────────────────────────────────────
  function copy() {
    const text = list[currentIndex];
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(`"${text}"`).then(() => App.showToast('Copied! ✨'));
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = `"${text}"`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      App.showToast('Copied! ✨');
    }
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    resolveEls();
    if (!nextBtn) return;

    show(currentIndex);
    buildGrid();

    nextBtn.addEventListener('click', () => {
      show(currentIndex + 1);
      buildGrid();
    });

    shareBtn.addEventListener('click', copy);
  }

  return { init };
})();
