(function () {
  const D = window.MAPA_DATA;
  const M = window.MapaMotion || {
    prefersReduced: () => false,
    transitionTo: (fn) => fn(),
    staggerIn: () => {},
    ripple: () => {},
    countUp: (el, n) => {
      if (el) el.textContent = String(n);
    },
    fillBar: (el, p) => {
      if (el) el.style.width = p + "%";
    },
    pulseOnce: () => {},
    nudge: () => {},
  };
  const Px = window.MapaPixel || {
    viewContent: function () {},
    startQuiz: function () {},
    quizBegin: function () {},
    quizProgress: function () {},
    optionSelect: function () {},
    quizComplete: function () {},
    viewResult: function () {},
    initiateCheckout: function () {},
    restart: function () {},
    viewPay: function () {},
  };

  if (!D) return;

  /** Checkout real — R$ 9,97 (Lastlink) */
  const CHECKOUT_URL = "https://lastlink.com/p/C53821E2C/checkout-payment/";

  function openCheckout() {
    Px.initiateCheckout();
    window.open(CHECKOUT_URL, "_blank", "noopener,noreferrer");
  }

  const state = {
    index: 0,
    answers: [],
    scores: { anxious: 0, savior: 0, intensity: 0, silence: 0, familiar: 0 },
    patternId: null,
    multiSelected: new Set(),
    matchStrength: 0,
    name: "",
    sign: "",
  };

  const pages = {
    home: document.getElementById("page-home"),
    profile: document.getElementById("page-profile"),
    quiz: document.getElementById("page-quiz"),
    loading: document.getElementById("page-loading"),
    partial: document.getElementById("page-partial"),
    pay: document.getElementById("page-pay"),
    full: document.getElementById("page-full"),
  };

  const elImg = document.getElementById("quiz-image");
  const elImgWrap = document.getElementById("quiz-image-wrap");
  const elAxis = document.getElementById("quiz-axis");
  const elQuestion = document.getElementById("quiz-question");
  const elHelp = document.getElementById("quiz-help");
  const elOptions = document.getElementById("quiz-options");
  const elFill = document.getElementById("quiz-progress-fill");
  const elMultiBar = document.getElementById("quiz-multi-bar");
  const elMultiNext = document.getElementById("btn-multi-next");
  const elMultiHint = document.getElementById("quiz-multi-hint");
  const elQuizInner = document.getElementById("quiz-inner");
  const elCtaBar = document.getElementById("offer-cta-bar");
  const elName = document.getElementById("input-name");
  const elSignGrid = document.getElementById("sign-grid");

  function show(name) {
    Object.keys(pages).forEach((key) => {
      const el = pages[key];
      if (!el) return;
      const on = key === name;
      el.classList.toggle("is-hidden", !on);
      if (on) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    });
    window.scrollTo(0, 0);

    if (name === "home") {
      requestAnimationFrame(() => {
        const wrap = document.querySelector(".landing") || document.querySelector(".home-wrap");
        if (wrap) M.staggerIn(wrap, "[data-stagger]");
      });
    }
    if (name === "profile") {
      renderSigns();
      if (elName) {
        window.setTimeout(() => elName.focus({ preventScroll: true }), 280);
      }
    }
    if (name === "partial") {
      requestAnimationFrame(() => {
        const wrap = document.querySelector(".offer-wrap");
        if (wrap) M.staggerIn(wrap, "[data-stagger]");
        if (elCtaBar) {
          window.setTimeout(() => elCtaBar.classList.add("is-visible"), 400);
        }
        window.setTimeout(() => {
          M.pulseOnce(document.getElementById("btn-unlock"));
        }, 1200);
      });
    } else if (elCtaBar) {
      elCtaBar.classList.remove("is-visible");
    }
    if (name === "pay") {
      Px.viewPay();
    }
    if (name === "full") {
      requestAnimationFrame(() => {
        const wrap = document.querySelector(".full-wrap");
        if (wrap) M.staggerIn(wrap, "[data-stagger]");
      });
    }
  }

  function go(name, direction) {
    M.transitionTo(() => show(name), direction);
  }

  function resetScores() {
    state.scores = { anxious: 0, savior: 0, intensity: 0, silence: 0, familiar: 0 };
    state.answers = [];
    state.index = 0;
    state.patternId = null;
    state.multiSelected = new Set();
    state.matchStrength = 0;
  }

  function applyScores(scores, direction) {
    const dir = direction || 1;
    Object.keys(scores || {}).forEach((k) => {
      state.scores[k] = Math.max(0, (state.scores[k] || 0) + dir * scores[k]);
    });
  }

  function unapplyAnswer(q, answer) {
    if (answer == null || !q) return;
    if (Array.isArray(answer)) {
      answer.forEach((i) => {
        if (q.options[i]) applyScores(q.options[i].scores, -1);
      });
    }
  }

  function rebuildScoresUntil(exclusiveEnd) {
    state.scores = { anxious: 0, savior: 0, intensity: 0, silence: 0, familiar: 0 };
    for (let i = 0; i < exclusiveEnd; i++) {
      const q = D.questions[i];
      const a = state.answers[i];
      if (!Array.isArray(a)) continue;
      a.forEach((idx) => applyScores(q.options[idx].scores, 1));
    }
  }

  function renderSigns() {
    if (!elSignGrid) return;
    elSignGrid.innerHTML = "";
    (D.signs || []).forEach((s) => {
      const name = typeof s === "string" ? s : s.name;
      const symbol = typeof s === "string" ? "" : s.symbol || "";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sign-chip" + (state.sign === name ? " is-selected" : "");
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", state.sign === name ? "true" : "false");
      btn.setAttribute("aria-label", name);
      btn.innerHTML =
        '<span class="sign-symbol" aria-hidden="true"></span>' +
        '<span class="sign-name"></span>';
      btn.querySelector(".sign-symbol").textContent = symbol;
      btn.querySelector(".sign-name").textContent = name;
      btn.addEventListener("click", () => {
        if (state.sign === name) {
          state.sign = "";
        } else {
          state.sign = name;
        }
        renderSigns();
      });
      elSignGrid.appendChild(btn);
    });
  }

  function saveProfile() {
    state.name = (elName && elName.value ? elName.value : "").trim();
  }

  function displayName() {
    return state.name || "";
  }

  function renderQuestion() {
    const q = D.questions[state.index];
    const total = D.questions.length;

    elQuizInner.classList.remove("is-swap");
    void elQuizInner.offsetWidth;
    elQuizInner.classList.add("is-swap");

    elAxis.textContent = q.axis;
    elQuestion.textContent = q.text;
    elHelp.textContent = q.help || "Marque o que combina · pode ser mais de um";
    elFill.style.width = Math.round((state.index / total) * 100) + "%";
    Px.quizProgress(state.index, total, q.axis);

    if (q.image) {
      elImgWrap.hidden = false;
      elImgWrap.classList.remove("is-ready");
      elImg.onload = () => elImgWrap.classList.add("is-ready");
      elImg.src = q.image;
      elImg.alt = q.imageAlt || "";
      if (elImg.complete) elImgWrap.classList.add("is-ready");
    } else {
      elImgWrap.hidden = true;
    }

    state.multiSelected = new Set();
    if (Array.isArray(state.answers[state.index])) {
      state.answers[state.index].forEach((i) => state.multiSelected.add(i));
    }

    elOptions.innerHTML = "";
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "opt opt-check";
      btn.style.setProperty("--i", String(i));
      btn.setAttribute("role", "checkbox");
      const selected = state.multiSelected.has(i);
      btn.classList.toggle("is-selected", selected);
      btn.setAttribute("aria-checked", selected ? "true" : "false");
      btn.innerHTML =
        '<span class="check-box" aria-hidden="true"></span><span class="opt-label"></span>';
      btn.querySelector(".opt-label").textContent = opt.label;
      btn.addEventListener("click", (e) => {
        M.ripple(e, btn);
        toggleMulti(i, btn);
      });
      elOptions.appendChild(btn);
    });

    elMultiBar.hidden = false;
    elMultiHint.textContent =
      q.minSelect === 0 || q.allowEmpty
        ? "Marque o que quiser · pode continuar sem marcar"
        : "Marque pelo menos uma opção · pode marcar várias";
    updateMultiNext();
  }

  function scrollToContinue() {
    if (!elMultiBar) return;
    // Espera o layout do botão habilitado/atualizar antes de rolar
    requestAnimationFrame(() => {
      elMultiBar.scrollIntoView({
        behavior: M.prefersReduced() ? "auto" : "smooth",
        block: "end",
      });
    });
  }

  function toggleMulti(i, btn) {
    const wasOn = state.multiSelected.has(i);
    if (wasOn) state.multiSelected.delete(i);
    else state.multiSelected.add(i);
    const on = state.multiSelected.has(i);
    btn.classList.toggle("is-selected", on);
    btn.setAttribute("aria-checked", on ? "true" : "false");
    updateMultiNext();
    if (on) {
      Px.optionSelect({ index: state.index, count: state.multiSelected.size });
      scrollToContinue();
    }
  }

  function updateMultiNext() {
    const q = D.questions[state.index];
    const min = q.minSelect != null ? q.minSelect : 1;
    const n = state.multiSelected.size;
    const ok = n >= min || q.allowEmpty;
    elMultiNext.disabled = !ok;
    const label = elMultiNext.querySelector(".btn-label") || elMultiNext;
    if (n === 0 && q.allowEmpty) label.textContent = "Continuar";
    else if (n === 0) label.textContent = "Continuar";
    else label.textContent = "Continuar · " + n + " marcada" + (n === 1 ? "" : "s");
  }

  function confirmMulti() {
    const q = D.questions[state.index];
    const min = q.minSelect != null ? q.minSelect : 1;
    if (state.multiSelected.size < min && !q.allowEmpty) {
      M.nudge(elMultiBar);
      return;
    }

    unapplyAnswer(q, state.answers[state.index]);
    const idxs = Array.from(state.multiSelected).sort((a, b) => a - b);
    state.answers[state.index] = idxs;
    idxs.forEach((i) => applyScores(q.options[i].scores, 1));
    advance();
  }

  function advance() {
    if (state.index < D.questions.length - 1) {
      state.index += 1;
      renderQuestion();
      window.scrollTo({ top: 0, behavior: M.prefersReduced() ? "auto" : "smooth" });
    } else {
      finishQuiz();
    }
  }

  function winningPattern() {
    let best = "anxious";
    let max = -1;
    let total = 0;
    Object.keys(state.scores).forEach((k) => {
      total += state.scores[k];
      if (state.scores[k] > max) {
        max = state.scores[k];
        best = k;
      }
    });
    const ratio = total > 0 ? max / total : 0.5;
    state.matchStrength = Math.round(62 + ratio * 33);
    return best;
  }

  function finishQuiz() {
    Px.quizComplete();
    go("loading");
    const steps = [
      "Lendo o que você marcou…",
      "Cruzando gatilhos e repetições…",
      "Identificando o padrão dominante…",
      "Montando o esboço do seu mapa…",
    ];
    const ticks = document.querySelectorAll("#loading-ticks [data-tick]");
    ticks.forEach((t) => t.classList.remove("is-done"));

    let i = 0;
    const sub = document.getElementById("loading-sub");
    sub.textContent = steps[0];

    const t = window.setInterval(() => {
      if (i < ticks.length) ticks[i].classList.add("is-done");
      i += 1;
      if (i < steps.length) sub.textContent = steps[i];
    }, 620);

    window.setTimeout(() => {
      window.clearInterval(t);
      ticks.forEach((x) => x.classList.add("is-done"));
      state.patternId = winningPattern();
      renderPartial();
      go("partial");
    }, 3400);
  }

  function pattern() {
    return D.patterns[state.patternId] || D.patterns.anxious;
  }

  function renderPartial() {
    const p = pattern();
    const n = displayName();
    const signBit = state.sign ? " · " + state.sign : "";

    document.getElementById("partial-name").textContent = p.name;
    document.getElementById("partial-summary").textContent = p.partialSummary;

    let personal = p.offerPersonal || "Suas respostas formam um desenho claro.";
    if (n) {
      personal = n + signBit + " — " + personal;
    } else if (state.sign) {
      personal = state.sign + " — " + personal;
    }
    document.getElementById("offer-personal").textContent = personal;
    document.getElementById("offer-hook").textContent =
      p.offerHook ||
      "Você já nomeou o ciclo. O mapa completo mostra como interrompê-lo antes da próxima escolha.";

    const ul = document.getElementById("partial-bullets");
    ul.innerHTML = "";
    p.partialBullets.forEach((t, i) => {
      const li = document.createElement("li");
      li.textContent = t;
      li.style.setProperty("--i", String(i));
      ul.appendChild(li);
    });

    // Bloco principal sob "Seu mapa completo contém"
    const snapPattern = document.getElementById("snapshot-pattern");
    const snapLead = document.getElementById("snapshot-lead");
    const snapBullets = document.getElementById("snapshot-bullets");
    if (snapPattern) snapPattern.textContent = p.name;
    if (snapLead) {
      if (n) {
        snapLead.textContent =
          n +
          (state.sign ? " (" + state.sign + ")" : "") +
          ": este é o núcleo do que suas marcações revelaram — o ponto de partida do mapa.";
      } else {
        snapLead.textContent =
          "Este é o núcleo do que suas marcações revelaram — o ponto de partida do mapa.";
      }
    }
    if (snapBullets) {
      snapBullets.innerHTML = "";
      p.partialBullets.forEach((t) => {
        const li = document.createElement("li");
        li.textContent = t;
        snapBullets.appendChild(li);
      });
    }

    const peekTitle = document.getElementById("peek-pattern-title");
    const peekText = document.getElementById("peek-pattern-text");
    if (peekTitle) peekTitle.textContent = p.name;
    if (peekText) {
      peekText.textContent = "Ciclo ativo nas suas respostas — a base do mapa.";
    }

    const chapters = p.chapters || [];
    const list = document.getElementById("chapter-list");
    list.innerHTML = "";
    chapters.forEach((ch, i) => {
      const li = document.createElement("li");
      li.className = "chapter-item " + (ch.free ? "is-free" : "is-locked");
      li.style.setProperty("--i", String(i));
      li.innerHTML =
        '<span class="chapter-icon" aria-hidden="true">' +
        (ch.free ? "✓" : "·") +
        "</span>" +
        '<div class="chapter-body"><h4></h4><p></p></div>' +
        '<span class="chapter-tag"></span>';
      li.querySelector("h4").textContent = ch.title;
      li.querySelector("p").textContent = ch.teaser || "";
      li.querySelector(".chapter-tag").textContent = ch.free ? "Livre" : "Bloqueado";
      list.appendChild(li);
    });

    const pct = state.matchStrength || 78;
    M.countUp(document.getElementById("match-pct"), pct, 1000);
    M.fillBar(document.getElementById("match-fill"), pct, 1.1);

    const mapPct = 28 + Math.round((pct - 60) * 0.25);
    const mapShown = Math.min(38, Math.max(28, mapPct));
    M.countUp(document.getElementById("map-pct"), mapShown, 1100);
    M.fillBar(document.getElementById("map-fill"), mapShown, 1.2);

    document.getElementById("match-note").textContent =
      pct >= 80
        ? "Padrão forte e repetido nas suas marcações."
        : "Padrão identificável; o mapa completo aprofunda onde ele se instala.";

    Px.viewResult({ pattern: p.name, match: pct });
  }

  function fillList(id, items) {
    const el = document.getElementById(id);
    el.innerHTML = "";
    items.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      el.appendChild(li);
    });
  }

  function renderFull() {
    const p = pattern();
    const n = displayName();
    document.getElementById("full-name").textContent =
      (n ? n + " · " : "") + p.name + (state.sign ? " · " + state.sign : "");
    document.getElementById("full-mirror").textContent = p.mirror;
    document.getElementById("full-what").textContent = p.what;
    document.getElementById("full-how").textContent = p.how;
    fillList("full-triggers", p.triggers);
    fillList("full-beliefs", p.beliefs);
    fillList("full-signals", p.signals);
    fillList("full-criteria", p.criteria);

    const tech = document.getElementById("full-techniques");
    tech.innerHTML = "";
    p.techniques.forEach((item) => {
      const div = document.createElement("div");
      div.className = "tech";
      div.innerHTML =
        "<h4>" + escapeHtml(item.title) + "</h4><p>" + escapeHtml(item.body) + "</p>";
      tech.appendChild(div);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-ripple");
    if (btn && !btn.disabled) M.ripple(e, btn);
  });

  document.getElementById("btn-start").addEventListener("click", () => {
    Px.startQuiz();
    go("profile");
  });

  document.getElementById("btn-profile-back").addEventListener("click", () => {
    go("home", "back");
  });

  document.getElementById("btn-profile-next").addEventListener("click", () => {
    saveProfile();
    resetScores();
    Px.quizBegin({
      hasName: !!state.name,
      hasSign: !!state.sign,
      skipped: false,
    });
    go("quiz");
    window.setTimeout(() => renderQuestion(), M.prefersReduced() ? 0 : 180);
  });

  document.getElementById("btn-profile-skip").addEventListener("click", () => {
    state.name = "";
    state.sign = "";
    if (elName) elName.value = "";
    resetScores();
    Px.quizBegin({ hasName: false, hasSign: false, skipped: true });
    go("quiz");
    window.setTimeout(() => renderQuestion(), M.prefersReduced() ? 0 : 180);
  });

  document.getElementById("btn-quiz-back").addEventListener("click", () => {
    if (state.index === 0) {
      go("profile", "back");
      return;
    }
    const cur = D.questions[state.index];
    unapplyAnswer(cur, state.answers[state.index]);
    state.answers[state.index] = undefined;
    const prev = state.index - 1;
    rebuildScoresUntil(prev);
    state.index = prev;
    renderQuestion();
  });

  elMultiNext.addEventListener("click", confirmMulti);

  // CTAs de pagamento Lastlink + pixel no clique
  document.addEventListener("click", (e) => {
    const pay = e.target.closest("#btn-unlock, #btn-pay-demo, a[href*='lastlink.com']");
    if (pay) {
      Px.initiateCheckout();
    }
  });

  document.getElementById("btn-pay-back").addEventListener("click", () => {
    go("partial", "back");
  });

  document.getElementById("btn-restart").addEventListener("click", () => {
    Px.restart();
    resetScores();
    state.name = "";
    state.sign = "";
    if (elName) elName.value = "";
    go("home", "back");
  });

  show("home");
  requestAnimationFrame(() => {
    const wrap = document.querySelector(".landing") || document.querySelector(".home-wrap");
    if (wrap) M.staggerIn(wrap, "[data-stagger]");
  });
})();
