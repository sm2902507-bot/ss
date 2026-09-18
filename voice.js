/* ============================================================
   voice.js  –  Voice Input (Speech-to-Text) +
                Voice Output (Text-to-Speech)
   Uses Web Speech API  – works in Chrome, Edge, Safari 16+
   Language follows I18n.voiceLang() automatically
   ============================================================ */

const Voice = (() => {

  // ── Feature detection ─────────────────────────────────────
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const synth = window.speechSynthesis || null;

  let recognition  = null;
  let isListening  = false;
  let isSpeaking   = false;
  let micBtn       = null;
  let speakerBtn   = null;
  let onResultCb   = null;   // called with final transcript string
  let lastBotText  = '';     // stores last bot message for re-read

  // ── Build SpeechRecognition instance ─────────────────────
  function buildRecognition() {
    if (!SpeechRecognition) return null;
    const r = new SpeechRecognition();
    r.continuous      = false;
    r.interimResults  = true;
    r.maxAlternatives = 1;
    r.lang            = I18n.voiceLang();

    r.onstart = () => {
      isListening = true;
      updateMicBtn(true);
      App.showToast(I18n.get('voiceListen'), 4000);
    };

    r.onresult = (e) => {
      let interim = '';
      let final   = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      // Show interim text live in the textarea
      const input = document.getElementById('userInput');
      if (input && (interim || final)) {
        input.value = final || interim;
        // trigger auto-resize
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      }
      if (final && onResultCb) onResultCb(final.trim());
    };

    r.onerror = (e) => {
      isListening = false;
      updateMicBtn(false);
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        App.showToast('🎤 ' + e.error, 3000);
      }
    };

    r.onend = () => {
      isListening = false;
      updateMicBtn(false);
    };

    return r;
  }

  // ── Mic button visual state ───────────────────────────────
  function updateMicBtn(active) {
    if (!micBtn) return;
    micBtn.classList.toggle('voice-active', active);
    micBtn.setAttribute('aria-label', active
      ? I18n.get('voiceStop')
      : I18n.get('voiceStart'));
    micBtn.title = active ? I18n.get('voiceStop') : I18n.get('voiceStart');
  }

  function updateSpeakerBtn(active) {
    if (!speakerBtn) return;
    speakerBtn.classList.toggle('voice-active', active);
  }

  // ── Start listening ───────────────────────────────────────
  function startListening(callback) {
    if (!SpeechRecognition) {
      App.showToast(I18n.get('voiceError'), 3500);
      return;
    }
    if (isListening) { stopListening(); return; }

    onResultCb = callback || null;
    recognition = buildRecognition();
    if (!recognition) return;

    // Clear textarea before new voice input
    const input = document.getElementById('userInput');
    if (input) input.value = '';

    try { recognition.start(); }
    catch (e) { console.warn('Voice start error:', e); }
  }

  // ── Stop listening ────────────────────────────────────────
  function stopListening() {
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
    isListening = false;
    updateMicBtn(false);
  }

  // ── Speak text (TTS) ──────────────────────────────────────
  function speak(text, onEnd) {
    if (!synth) return;
    // Strip markdown bold/italic for cleaner speech
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/<br\s*\/?>/gi, '. ')
      .replace(/<[^>]+>/g, '')
      .replace(/•/g, '')
      .trim();

    synth.cancel();
    const utter     = new SpeechSynthesisUtterance(clean);
    utter.lang      = I18n.voiceLang();
    utter.rate      = 0.92;
    utter.pitch     = 1.05;
    utter.volume    = 1;

    // Pick the best available voice for the language
    const voices = synth.getVoices();
    const langCode = I18n.voiceLang().split('-')[0];
    const match = voices.find(v => v.lang.startsWith(I18n.voiceLang()))
               || voices.find(v => v.lang.startsWith(langCode));
    if (match) utter.voice = match;

    utter.onstart = () => {
      isSpeaking = true;
      updateSpeakerBtn(true);
      App.showToast(I18n.get('speakResponse'), 1500);
    };
    utter.onend = () => {
      isSpeaking = false;
      updateSpeakerBtn(false);
      if (onEnd) onEnd();
    };
    utter.onerror = () => {
      isSpeaking = false;
      updateSpeakerBtn(false);
    };

    lastBotText = clean;
    synth.speak(utter);
  }

  // ── Stop speaking ─────────────────────────────────────────
  function stopSpeaking() {
    if (synth) synth.cancel();
    isSpeaking = false;
    updateSpeakerBtn(false);
  }

  // ── Toggle speaker (re-read last bot message) ─────────────
  function toggleSpeaker() {
    if (isSpeaking) { stopSpeaking(); return; }
    if (lastBotText) speak(lastBotText);
  }

  // ── Update language when user switches ────────────────────
  function updateLang() {
    stopListening();
    stopSpeaking();
    // Next recognition instance will pick new lang via buildRecognition()
  }

  // ── Store last bot message for re-read ────────────────────
  function setLastBotText(text) {
    lastBotText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/<br\s*\/?>/gi, '. ')
      .replace(/<[^>]+>/g, '');
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    micBtn     = document.getElementById('micBtn');
    speakerBtn = document.getElementById('speakerBtn');

    if (micBtn) {
      micBtn.title = I18n.get('voiceStart');
      micBtn.setAttribute('aria-label', I18n.get('voiceStart'));

      if (!SpeechRecognition) {
        micBtn.disabled = true;
        micBtn.title    = I18n.get('voiceError');
        micBtn.style.opacity = '0.4';
      } else {
        micBtn.addEventListener('click', () => {
          startListening((transcript) => {
            // Auto-send after final result
            setTimeout(() => {
              const form = document.getElementById('chatForm');
              if (form && transcript) form.dispatchEvent(new Event('submit'));
            }, 400);
          });
        });
      }
    }

    if (speakerBtn) {
      speakerBtn.addEventListener('click', toggleSpeaker);
      if (!synth) {
        speakerBtn.disabled = true;
        speakerBtn.style.opacity = '0.4';
      }
    }
  }

  return {
    init,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    updateLang,
    setLastBotText,
    isSupported: () => !!SpeechRecognition,
    ttsSupported: () => !!synth,
  };
})();
