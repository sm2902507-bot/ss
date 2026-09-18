/* ============================================================
   breathing.js  –  Guided breathing exercise engine
   ============================================================ */

const Breathing = (() => {

  // ── Techniques ────────────────────────────────────────────
  const techniques = {
    '478': {
      name: '4-7-8 Breathing',
      steps: [
        { label: 'Inhale',  duration: 4, phase: 'inhale'  },
        { label: 'Hold',    duration: 7, phase: 'hold'    },
        { label: 'Exhale',  duration: 8, phase: 'exhale'  }
      ],
      info: '<strong>4-7-8 Technique:</strong> Inhale 4s → Hold 7s → Exhale 8s. Activates your parasympathetic nervous system to reduce anxiety fast.'
    },
    'box': {
      name: 'Box Breathing',
      steps: [
        { label: 'Inhale',     duration: 4, phase: 'inhale'  },
        { label: 'Hold',       duration: 4, phase: 'hold'    },
        { label: 'Exhale',     duration: 4, phase: 'exhale'  },
        { label: 'Hold',       duration: 4, phase: 'hold'    }
      ],
      info: '<strong>Box Breathing:</strong> Used by Navy SEALs to stay calm under pressure. 4s in → 4s hold → 4s out → 4s hold. Excellent for focus and stress.'
    },
    'simple': {
      name: 'Simple 4-4 Breathing',
      steps: [
        { label: 'Inhale',  duration: 4, phase: 'inhale' },
        { label: 'Exhale',  duration: 4, phase: 'exhale' }
      ],
      info: '<strong>Simple 4-4 Breathing:</strong> A quick, easy technique for immediate calm. Breathe in for 4 seconds, out for 4. Perfect when you need a fast reset.'
    }
  };

  // ── State ─────────────────────────────────────────────────
  let timer        = null;
  let currentStep  = 0;
  let countdown    = 0;
  let cycleCount   = 0;
  let running      = false;
  let technique    = null;

  // ── DOM refs (resolved lazily) ────────────────────────────
  let circleEl, labelEl, countEl, startBtn, stopBtn, selectEl, infoEl;

  function resolveEls() {
    circleEl  = document.getElementById('breathingCircle');
    labelEl   = document.getElementById('breathLabel');
    countEl   = document.getElementById('breathCount');
    startBtn  = document.getElementById('startBreathing');
    stopBtn   = document.getElementById('stopBreathing');
    selectEl  = document.getElementById('techniqueSelect');
    infoEl    = document.getElementById('breathingInfo');
  }

  // ── Update the technique info panel ──────────────────────
  function updateInfo() {
    if (!infoEl || !selectEl) return;
    const t = techniques[selectEl.value];
    if (t) infoEl.innerHTML = `<p>${t.info}</p>`;
  }

  // ── Tick every second ────────────────────────────────────
  function tick() {
    if (!running) return;

    // Display current countdown
    countEl.textContent = countdown;

    countdown--;

    if (countdown < 0) {
      // Advance to next step
      currentStep = (currentStep + 1) % technique.steps.length;
      if (currentStep === 0) {
        cycleCount++;
        // Auto-stop after 5 cycles
        if (cycleCount >= 5) { stop(); return; }
      }
      const nextStep = technique.steps[currentStep];
      labelEl.textContent = nextStep.label;
      countdown = nextStep.duration - 1; // will display nextStep.duration next tick
      countEl.textContent = nextStep.duration; // show immediately
      circleEl.className = 'breathing-circle ' + nextStep.phase;
    }

    timer = setTimeout(tick, 1000);
  }

  // ── Start ─────────────────────────────────────────────────
  function start() {
    resolveEls();
    if (running) return;

    const key = selectEl ? selectEl.value : '478';
    technique    = techniques[key] || techniques['478'];
    currentStep  = 0;
    cycleCount   = 0;
    running      = true;

    const firstStep = technique.steps[0];
    labelEl.textContent = firstStep.label;
    countdown = firstStep.duration;
    circleEl.className  = 'breathing-circle ' + firstStep.phase;
    countEl.textContent = countdown;

    startBtn.disabled = true;
    stopBtn.disabled  = false;
    selectEl.disabled = true;

    timer = setTimeout(tick, 1000);
  }

  // ── Stop ──────────────────────────────────────────────────
  function stop() {
    clearTimeout(timer);
    running = false;

    if (labelEl)  labelEl.textContent  = 'Press Start';
    if (countEl)  countEl.textContent  = '';
    if (circleEl) circleEl.className   = 'breathing-circle';

    if (startBtn) startBtn.disabled = false;
    if (stopBtn)  stopBtn.disabled  = true;
    if (selectEl) selectEl.disabled = false;
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    resolveEls();
    if (!startBtn) return;

    startBtn.addEventListener('click', start);
    stopBtn.addEventListener('click', stop);
    selectEl.addEventListener('change', () => {
      updateInfo();
      if (running) stop();
    });

    updateInfo();
  }

  return { init, start, stop };
})();
