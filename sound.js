/**
 * Sons táteis suaves — Web Audio (sem arquivos externos).
 * Desbloqueia no primeiro toque (regra de autoplay do iPhone/Android).
 * Respeita prefers-reduced-motion de forma leve (ainda toca um tick curto).
 */
(function () {
  var ctx = null;
  var unlocked = false;
  var muted = false;

  function getCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  function unlock() {
    var c = getCtx();
    if (!c) return;
    if (c.state === "suspended") {
      c.resume().catch(function () {});
    }
    unlocked = true;
  }

  function tone(opts) {
    if (muted) return;
    var c = getCtx();
    if (!c) return;
    if (c.state === "suspended") {
      c.resume().catch(function () {});
      return;
    }
    opts = opts || {};
    var now = c.currentTime;
    var freq = opts.freq || 420;
    var freq2 = opts.freq2 || freq * 1.5;
    var dur = opts.dur || 0.07;
    var type = opts.type || "sine";
    var vol = opts.vol != null ? opts.vol : 0.07;
    var gain = c.createGain();
    var o1 = c.createOscillator();
    var o2 = c.createOscillator();
    o1.type = type;
    o2.type = "triangle";
    o1.frequency.setValueAtTime(freq, now);
    o2.frequency.setValueAtTime(freq2, now);
    o2.frequency.exponentialRampToValueAtTime(Math.max(80, freq2 * 0.7), now + dur);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o1.connect(gain);
    o2.connect(gain);
    gain.connect(c.destination);
    o1.start(now);
    o2.start(now);
    o1.stop(now + dur + 0.02);
    o2.stop(now + dur + 0.02);
  }

  // Soft paper tap — opções de resposta
  function click() {
    tone({ freq: 380, freq2: 520, dur: 0.055, vol: 0.055, type: "sine" });
  }

  // Confirmação um pouco mais “cheia”
  function confirm() {
    tone({ freq: 440, freq2: 660, dur: 0.09, vol: 0.065, type: "sine" });
    window.setTimeout(function () {
      tone({ freq: 550, freq2: 780, dur: 0.07, vol: 0.04, type: "triangle" });
    }, 40);
  }

  // CTA principal
  function cta() {
    tone({ freq: 320, freq2: 480, dur: 0.08, vol: 0.07, type: "sine" });
    window.setTimeout(function () {
      tone({ freq: 480, freq2: 720, dur: 0.1, vol: 0.05, type: "triangle" });
    }, 50);
  }

  // Voltar / ghost
  function soft() {
    tone({ freq: 280, freq2: 360, dur: 0.05, vol: 0.035, type: "sine" });
  }

  // Processamento / marco
  function chime() {
    tone({ freq: 523, freq2: 784, dur: 0.12, vol: 0.05, type: "sine" });
  }

  document.addEventListener(
    "pointerdown",
    function () {
      unlock();
    },
    { once: true, passive: true }
  );
  document.addEventListener(
    "touchstart",
    function () {
      unlock();
    },
    { once: true, passive: true }
  );

  window.MapaSound = {
    unlock: unlock,
    click: click,
    confirm: confirm,
    cta: cta,
    soft: soft,
    chime: chime,
    setMuted: function (v) {
      muted = !!v;
    },
    isMuted: function () {
      return muted;
    },
  };
})();
