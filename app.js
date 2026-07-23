/**
 * Mapa do Ciclo Amoroso — fluxo do quiz
 * Abertura → 9 perguntas (nome após Q3, mid após Q6) → processamento → resultado → oferta
 */
(function () {
  var D = window.MAPA_DATA;
  var C = window.MAPA_CONFIG || {};
  var M = window.MapaMotion || {
    prefersReduced: function () {
      return false;
    },
    transitionTo: function (fn) {
      fn();
    },
    staggerIn: function () {},
    ripple: function () {},
  };
  var Snd = window.MapaSound || {
    click: function () {},
    confirm: function () {},
    cta: function () {},
    soft: function () {},
    chime: function () {},
    unlock: function () {},
  };

  function playSound(kind) {
    try {
      if (Snd.unlock) Snd.unlock();
      if (kind === "cta" && Snd.cta) Snd.cta();
      else if (kind === "confirm" && Snd.confirm) Snd.confirm();
      else if (kind === "soft" && Snd.soft) Snd.soft();
      else if (kind === "chime" && Snd.chime) Snd.chime();
      else if (Snd.click) Snd.click();
    } catch (e) {}
  }
  var Px = window.MapaPixel || {
    quizStart: function () {},
    quizProgress50: function () {},
    quizComplete: function () {},
    viewContent: function () {},
    initiateCheckout: function () {},
  };
  var Ax = window.MapaAnalytics || {
    landing: function () {},
    start: function () {},
    name: function () {},
    questionView: function () {},
    questionAnswer: function () {},
    result: function () {},
    checkout: function () {},
    flush: function () {},
  };

  if (!D) return;

  var STORAGE_KEY = "mapa_ciclo_progress_v1";
  var TOTAL_Q = D.questions.length; // 9

  var state = {
    screen: "open", // open | quiz | name | mid | process | result | offer
    qIndex: 0, // 0..8
    answers: {}, // q1..q9 -> A|B|C|D
    scores: { A: 0, B: 0, C: 0, D: 0 },
    name: "",
    primary: null,
    secondary: null,
    advancing: false,
  };

  var pages = {
    open: document.getElementById("page-open"),
    quiz: document.getElementById("page-quiz"),
    name: document.getElementById("page-name"),
    mid: document.getElementById("page-mid"),
    process: document.getElementById("page-process"),
    result: document.getElementById("page-result"),
    offer: document.getElementById("page-offer"),
  };

  var el = {
    progress: document.getElementById("quiz-progress"),
    progressFill: document.getElementById("quiz-progress-fill"),
    progressLabel: document.getElementById("quiz-progress-label"),
    question: document.getElementById("quiz-question"),
    options: document.getElementById("quiz-options"),
    btnBack: document.getElementById("btn-back"),
    nameInput: document.getElementById("input-name"),
    processMsg: document.getElementById("process-msg"),
    processDims: document.getElementById("process-dims"),
    processDone: document.getElementById("process-done"),
    cookieBanner: document.getElementById("cookie-banner"),
  };

  /* ─── helpers ─── */

  function money(n) {
    return (
      "R$ " +
      Number(n)
        .toFixed(2)
        .replace(".", ",")
    );
  }

  function saveProgress() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          screen: state.screen,
          qIndex: state.qIndex,
          answers: state.answers,
          scores: state.scores,
          name: state.name,
          primary: state.primary,
          secondary: state.secondary,
          ts: Date.now(),
        })
      );
    } catch (e) {}
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.ts) return null;
      // expira em 7 dias
      if (Date.now() - data.ts > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function clearProgress() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function showPage(name, direction) {
    function apply() {
      Object.keys(pages).forEach(function (key) {
        var p = pages[key];
        if (!p) return;
        var on = key === name;
        p.classList.toggle("is-hidden", !on);
        if (on) p.removeAttribute("hidden");
        else p.setAttribute("hidden", "");
      });
      // barra de progresso só no quiz
      if (el.progress) {
        var showBar = name === "quiz";
        el.progress.classList.toggle("is-hidden", !showBar);
        el.progress.hidden = !showBar;
      }
      window.scrollTo(0, 0);
      state.screen = name;
      saveProgress();
    }
    if (M.transitionTo) M.transitionTo(apply, direction);
    else apply();
  }

  /* ─── scoring ─── */

  function recomputeScores() {
    var s = { A: 0, B: 0, C: 0, D: 0 };
    D.questions.forEach(function (q) {
      var k = state.answers[q.id];
      if (k && s[k] !== undefined) s[k] += 2;
    });
    state.scores = s;
  }

  function resolvePatterns() {
    recomputeScores();
    var keys = ["A", "B", "C", "D"];
    var sorted = keys.slice().sort(function (a, b) {
      return state.scores[b] - state.scores[a];
    });

    var top = sorted[0];
    var tied = keys.filter(function (k) {
      return state.scores[k] === state.scores[top];
    });

    if (tied.length > 1) {
      // tiebreak: Q6 → Q8 → Q1
      var order = ["q6", "q8", "q1"];
      for (var i = 0; i < order.length; i++) {
        var ans = state.answers[order[i]];
        if (ans && tied.indexOf(ans) !== -1) {
          top = ans;
          break;
        }
      }
    }

    var secondary = null;
    var maxSec = -1;
    keys.forEach(function (k) {
      if (k === top) return;
      if (state.scores[k] > maxSec) {
        maxSec = state.scores[k];
        secondary = k;
      }
    });

    state.primary = top;
    state.secondary = secondary;
    return { primary: top, secondary: secondary };
  }

  /* ─── open ─── */

  function renderOpen() {
    var variant = C.headlineVariant === "B" ? "B" : "A";
    var open = D.open[variant] || D.open.A;
    var titleEl = document.getElementById("open-title");
    var subEl = document.getElementById("open-subtitle");
    var supportEl = document.getElementById("open-support");
    var bulletsEl = document.getElementById("open-bullets");
    var ctaEl = document.getElementById("btn-start");

    if (titleEl) titleEl.textContent = open.title;
    if (subEl) subEl.textContent = open.subtitle;
    if (supportEl) {
      supportEl.innerHTML =
        "<p class=\"open-support-lead\">Responda a nove perguntas e descubra:</p><ul>" +
        D.open.support
          .map(function (t) {
            return "<li>" + t + "</li>";
          })
          .join("") +
        "</ul>";
    }
    if (bulletsEl) {
      bulletsEl.innerHTML = D.open.bullets
        .map(function (b) {
          return (
            '<span class="chip"><span class="chip-dot" aria-hidden="true"></span>' +
            b +
            "</span>"
          );
        })
        .join("");
    }
    if (ctaEl) ctaEl.textContent = D.open.cta;
    showPage("open");
    requestAnimationFrame(function () {
      var wrap = document.querySelector(".page-open .wrap");
      if (wrap && M.staggerIn) M.staggerIn(wrap, "[data-stagger]");
    });
  }

  function startQuiz() {
    playSound("cta");
    Px.quizStart();
    Ax.start();
    state.qIndex = 0;
    state.answers = {};
    state.scores = { A: 0, B: 0, C: 0, D: 0 };
    state.primary = null;
    state.secondary = null;
    state.name = "";
    renderQuestion();
  }

  /* ─── quiz ─── */

  function progressPercent() {
    // 0 after start, 100 after Q9 answered
    var answered = Object.keys(state.answers).length;
    return Math.min(100, Math.round((answered / TOTAL_Q) * 100));
  }

  function updateProgressBar() {
    var pct = Math.max(progressPercent(), Math.round(((state.qIndex + 0.15) / TOTAL_Q) * 100));
    pct = Math.min(100, pct);
    if (el.progressFill) el.progressFill.style.width = pct + "%";
    if (el.progressLabel) {
      el.progressLabel.textContent = "Pergunta " + (state.qIndex + 1) + " de " + TOTAL_Q;
    }
  }

  function renderQuestion() {
    var q = D.questions[state.qIndex];
    if (!q) return;

    showPage("quiz");
    updateProgressBar();

    if (el.question) el.question.textContent = q.text;
    if (el.options) {
      el.options.innerHTML = "";
      q.options.forEach(function (opt) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "opt-btn";
        btn.setAttribute("data-key", opt.key);
        btn.innerHTML = '<span class="opt-text">' + opt.label + "</span>";
        if (state.answers[q.id] === opt.key) btn.classList.add("is-selected");
        btn.addEventListener("click", function (e) {
          onSelectOption(opt.key, btn, e);
        });
        el.options.appendChild(btn);
      });
      if (M.staggerIn) M.staggerIn(el.options, ".opt-btn");
    }

    if (el.btnBack) {
      el.btnBack.hidden = state.qIndex === 0 && !state.answers.q1;
      // permitir voltar se não for a primeira ou se veio de name/mid
      el.btnBack.hidden = false;
      if (state.qIndex === 0) {
        // na Q1, voltar vai para abertura
        el.btnBack.hidden = false;
      }
    }

    Ax.questionView(q, state.qIndex);

    // milestones
    if (state.qIndex === 4) Px.quizProgress50(); // Q5 (index 4)
  }

  function onSelectOption(key, btn, e) {
    if (state.advancing) return;
    state.advancing = true;
    playSound("confirm");

    var q = D.questions[state.qIndex];
    state.answers[q.id] = key;
    recomputeScores();
    Ax.questionAnswer(q, state.qIndex, key);
    saveProgress();

    if (e && M.ripple) M.ripple(e, btn);
    var all = el.options ? el.options.querySelectorAll(".opt-btn") : [];
    all.forEach(function (b) {
      b.classList.remove("is-selected");
      b.disabled = true;
    });
    if (btn) btn.classList.add("is-selected", "is-confirm");

    var delay = M.prefersReduced && M.prefersReduced() ? 80 : 380;
    window.setTimeout(function () {
      state.advancing = false;
      advanceFromQuestion();
    }, delay);
  }

  function advanceFromQuestion() {
    var idx = state.qIndex;

    // após Q3 (index 2) → nome
    if (idx === 2) {
      renderNameGate();
      return;
    }
    // após Q6 (index 5) → mid
    if (idx === 5) {
      renderMid();
      return;
    }
    // após Q9 (index 8) → process
    if (idx === 8) {
      Px.quizComplete();
      startProcessing();
      return;
    }

    state.qIndex = idx + 1;
    renderQuestion();
  }

  function goBack() {
    if (state.advancing) return;
    playSound("soft");
    var scr = state.screen;

    if (scr === "name") {
      state.qIndex = 2;
      renderQuestion();
      return;
    }
    if (scr === "mid") {
      state.qIndex = 5;
      renderQuestion();
      return;
    }
    if (scr === "quiz") {
      if (state.qIndex === 0) {
        renderOpen();
        return;
      }
      // se está em Q4 (index 3), voltar pode ir pro name
      if (state.qIndex === 3) {
        renderNameGate();
        return;
      }
      // se está em Q7 (index 6), voltar para mid
      if (state.qIndex === 6) {
        renderMid();
        return;
      }
      state.qIndex = state.qIndex - 1;
      renderQuestion();
      return;
    }
    if (scr === "offer") {
      renderResult();
      return;
    }
    if (scr === "result") {
      // não volta ao process; reinicia opcionalmente
      return;
    }
  }

  /* ─── name gate ─── */

  function renderNameGate() {
    showPage("name");
    var title = document.getElementById("name-title");
    var ask = document.getElementById("name-ask");
    var help = document.getElementById("name-help");
    var cta = document.getElementById("btn-name-continue");
    if (title) title.textContent = D.nameGate.title;
    if (ask) ask.textContent = D.nameGate.ask;
    if (help) help.textContent = D.nameGate.help;
    if (cta) cta.textContent = D.nameGate.cta;
    if (el.nameInput) {
      el.nameInput.value = state.name || "";
      window.setTimeout(function () {
        try {
          el.nameInput.focus({ preventScroll: true });
        } catch (e) {}
      }, 280);
    }
  }

  function continueFromName() {
    playSound("cta");
    var raw = el.nameInput ? el.nameInput.value : "";
    state.name = (raw || "").trim().slice(0, 40);
    // Analytics interno pode guardar nome; Meta NÃO
    Ax.name(state.name);
    saveProgress();
    state.qIndex = 3; // Q4
    renderQuestion();
  }

  /* ─── mid ─── */

  function renderMid() {
    showPage("mid");
    var title = document.getElementById("mid-title");
    var body = document.getElementById("mid-body");
    var cta = document.getElementById("btn-mid-continue");
    if (title) title.textContent = D.mid.title;
    if (body) {
      body.innerHTML =
        D.mid.lines.map(function (l) {
          return "<p>" + l + "</p>";
        }).join("") +
        "<ul>" +
        D.mid.bullets
          .map(function (b) {
            return "<li>" + b + "</li>";
          })
          .join("") +
        "</ul>" +
        '<p class="mid-footer">' +
        D.mid.footer +
        "</p>";
    }
    if (cta) cta.textContent = D.mid.cta;
  }

  function continueFromMid() {
    playSound("cta");
    state.qIndex = 6; // Q7
    renderQuestion();
  }

  /* ─── processing ─── */

  function startProcessing() {
    playSound("chime");
    showPage("process");
    if (el.processDone) el.processDone.hidden = true;
    if (el.processMsg) el.processMsg.textContent = D.processing[0];

    if (el.processDims) {
      el.processDims.innerHTML = D.dimensions
        .map(function (d, i) {
          return (
            '<div class="dim-row" data-i="' +
            i +
            '"><span class="dim-label">' +
            d +
            '</span><div class="dim-bar"><div class="dim-fill" style="width:0%"></div></div></div>'
          );
        })
        .join("");
    }

    var msgs = D.processing;
    var step = 0;
    var totalMs = 4000;
    var interval = totalMs / msgs.length;

    function tick() {
      if (step < msgs.length) {
        if (el.processMsg) el.processMsg.textContent = msgs[step];
        // anima barras progressivamente
        if (el.processDims) {
          var fills = el.processDims.querySelectorAll(".dim-fill");
          fills.forEach(function (f, i) {
            if (i <= step) {
              var target = 40 + ((i * 17 + step * 11) % 50);
              f.style.width = target + "%";
            }
          });
        }
        step += 1;
        window.setTimeout(tick, interval);
      } else {
        if (el.processDone) {
          el.processDone.hidden = false;
          el.processDone.textContent = "Seu resultado está pronto.";
          playSound("chime");
        }
        window.setTimeout(function () {
          finishAndShowResult();
        }, 500);
      }
    }
    tick();
  }

  function finishAndShowResult() {
    var r = resolvePatterns();
    var pat = D.patterns[r.primary];
    Ax.result(r.primary, r.secondary, {
      patternName: pat ? pat.name : "",
      name: state.name || null,
      scores: state.scores,
    });
    Px.viewContent();
    renderResult();
  }

  /* ─── result ─── */

  function greetName() {
    if (state.name) return state.name.split(/\s+/)[0];
    return "";
  }

  function renderResult() {
    var r = resolvePatterns();
    var pat = D.patterns[r.primary];
    var sec = r.secondary ? D.patterns[r.secondary] : null;
    if (!pat) return;

    showPage("result");

    var root = document.getElementById("result-content");
    if (!root) return;

    var name = greetName();
    var hello = name
      ? "<p class=\"result-hello\">" + name + ", este é o seu ciclo predominante.</p>"
      : "";

    var reactions = pat.reactions
      .map(function (x) {
        return "<li>" + x + "</li>";
      })
      .join("");

    var secHtml = sec
      ? '<div class="result-sec card-soft"><p class="result-sec-label">Também aparece com força:</p><p class="result-sec-name">' +
        sec.name +
        '</p><p class="result-sec-note">A análise completa mostra como os dois padrões se combinam no seu dia a dia.</p></div>'
      : "";

    // gráfico visual simples das 4 dimensões
    var dims = pat.dims || {};
    var dimMap = [
      { k: "choice", label: "Escolha e atração" },
      { k: "distance", label: "Resposta à distância" },
      { k: "limits", label: "Limites e reciprocidade" },
      { k: "protection", label: "Proteção emocional" },
    ];
    var chart = dimMap
      .map(function (d) {
        var v = dims[d.k] || 50;
        return (
          '<div class="chart-row"><span class="chart-label">' +
          d.label +
          '</span><div class="chart-bar"><div class="chart-fill" style="width:' +
          v +
          '%"></div></div></div>'
        );
      })
      .join("");

    root.innerHTML =
      '<div class="hyperframe" style="margin-bottom:16px;text-align:center">' +
      '<span class="hf-corner hf-tl" aria-hidden="true"></span>' +
      '<span class="hf-corner hf-tr" aria-hidden="true"></span>' +
      '<span class="hf-corner hf-bl" aria-hidden="true"></span>' +
      '<span class="hf-corner hf-br" aria-hidden="true"></span>' +
      hello +
      "<h1 class=\"result-title\">" +
      pat.title +
      "</h1>" +
      '<p class="result-desc" style="margin-bottom:0">' +
      pat.description +
      "</p></div>" +
      '<div class="result-block"><h2>Como geralmente começa</h2><p>' +
      pat.starts +
      "</p></div>" +
      '<div class="result-block"><h2>Reação automática</h2><ul>' +
      reactions +
      "</ul></div>" +
      '<div class="result-block result-blind"><h2>Ponto que pode passar despercebido</h2><p>' +
      pat.blind +
      "</p></div>" +
      '<div class="result-block result-ex"><h2>' +
      pat.exerciseTitle +
      "</h2><p>" +
      pat.exercise +
      "</p></div>" +
      '<div class="result-block"><h2>Suas quatro dimensões</h2><div class="chart">' +
      chart +
      "</div></div>" +
      secHtml +
      '<div class="result-cta-wrap">' +
      '<p class="result-bridge">' +
      D.offer.bridge +
      "</p>" +
      '<button type="button" class="btn btn-primary btn-block btn-glow" id="btn-to-offer">VER MEU MAPA COMPLETO</button>' +
      "</div>";

    var btn = document.getElementById("btn-to-offer");
    if (btn) {
      btn.addEventListener("click", function () {
        playSound("cta");
        renderOffer();
      });
    }

    // anima barras
    window.requestAnimationFrame(function () {
      var fills = root.querySelectorAll(".chart-fill");
      fills.forEach(function (f) {
        var w = f.style.width;
        f.style.width = "0%";
        requestAnimationFrame(function () {
          f.style.width = w;
        });
      });
    });

    saveProgress();
  }

  /* ─── offer ─── */

  function buildCheckoutUrl() {
    var url = C.checkoutUrl || "https://checkout.perfectpay.com.br/pay/PPU38CQEJJH";
    try {
      var u = new URL(url);
      // preserva UTMs
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"].forEach(
        function (k) {
          var v = null;
          try {
            v =
              sessionStorage.getItem("mapa_" + k) ||
              localStorage.getItem("mapa_" + k) ||
              new URLSearchParams(location.search).get(k);
          } catch (e) {}
          if (v && !u.searchParams.get(k)) u.searchParams.set(k, v);
        }
      );
      return u.toString();
    } catch (e) {
      return url;
    }
  }

  function renderOffer() {
    showPage("offer");
    var root = document.getElementById("offer-content");
    if (!root) return;

    var pat = D.patterns[state.primary] || D.patterns.A;
    var sec = state.secondary ? D.patterns[state.secondary] : null;
    var price = typeof C.price === "number" ? C.price : 29.9;
    var anchor = C.priceAnchor;
    var showAnchor = C.showPriceAnchor && anchor && anchor > price;

    var locked = D.offer.features
      .map(function (f, i) {
        var lockedClass = i > 1 ? "is-locked" : "";
        return (
          '<li class="offer-feat ' +
          lockedClass +
          '"><span class="feat-icon" aria-hidden="true">' +
          (i > 1 ? "🔒" : "✓") +
          "</span><span>" +
          f +
          "</span></li>"
        );
      })
      .join("");

    var priceHtml = showAnchor
      ? '<p class="price-anchor">De <s>' +
        money(anchor) +
        '</s></p><p class="price-main">por <strong>' +
        money(price) +
        "</strong></p>"
      : '<p class="price-main">Acesso completo por <strong>' + money(price) + "</strong></p>";

    var name = greetName();
    var previewTitle = name ? name + ", seu mapa completo" : "Seu mapa completo";

    var bonuses = D.offer.bonuses;
    var bonusHtml = "";
    if (bonuses && bonuses.items && bonuses.items.length) {
      var bonusCards = bonuses.items
        .map(function (b) {
          return (
            '<article class="bonus-card">' +
            '<div class="bonus-card-top">' +
            '<span class="bonus-num">Bônus ' +
            b.num +
            "</span>" +
            '<span class="bonus-value">valor percebido ' +
            b.value +
            "</span>" +
            "</div>" +
            "<h3 class=\"bonus-name\">" +
            b.name +
            "</h3>" +
            (b.alt ? '<p class="bonus-alt">' + b.alt + "</p>" : "") +
            '<p class="bonus-desc">' +
            b.desc +
            "</p>" +
            '<span class="bonus-included">Incluso no seu acesso</span>' +
            "</article>"
          );
        })
        .join("");
      bonusHtml =
        '<section class="bonus-section" aria-label="Bônus inclusos">' +
        "<h2 class=\"bonus-section-title\">" +
        bonuses.title +
        "</h2>" +
        '<p class="bonus-section-sub">' +
        bonuses.subtitle +
        "</p>" +
        '<div class="bonus-list">' +
        bonusCards +
        "</div>" +
        '<div class="bonus-total">' +
        "<span>" +
        bonuses.totalLabel +
        '</span><strong>' +
        bonuses.totalValue +
        "</strong>" +
        "</div>" +
        '<p class="bonus-note">' +
        bonuses.note +
        "</p>" +
        "</section>";
    }

    root.innerHTML =
      '<p class="offer-bridge">' +
      D.offer.bridge +
      "</p>" +
      '<div class="map-preview card hyperframe">' +
      '<span class="hf-corner hf-tl" aria-hidden="true"></span>' +
      '<span class="hf-corner hf-tr" aria-hidden="true"></span>' +
      '<span class="hf-corner hf-bl" aria-hidden="true"></span>' +
      '<span class="hf-corner hf-br" aria-hidden="true"></span>' +
      '<p class="map-preview-kicker">' +
      previewTitle +
      "</p>" +
      '<div class="map-preview-row"><span>Ciclo predominante</span><strong>' +
      pat.name +
      "</strong></div>" +
      (sec
        ? '<div class="map-preview-row"><span>Padrão secundário</span><strong>' +
          sec.name +
          "</strong></div>"
        : "") +
      '<div class="map-preview-blur" aria-hidden="true">' +
      "<p>Gatilhos emocionais · Comportamentos automáticos · Crenças · Plano 28 dias</p>" +
      '<span class="lock-badge">Conteúdo completo no mapa</span>' +
      "</div>" +
      "</div>" +
      bonusHtml +
      "<h1 class=\"offer-title\">" +
      D.offer.title +
      "</h1>" +
      '<p class="offer-body">' +
      D.offer.body +
      "</p>" +
      '<ul class="offer-list">' +
      locked +
      "</ul>" +
      '<div class="price-box card">' +
      priceHtml +
      '<ul class="price-perks">' +
      "<li>Pagamento único</li>" +
      "<li>Acesso imediato</li>" +
      "<li>Garantia de " +
      (C.guaranteeDays || 7) +
      " dias conforme os termos da compra</li>" +
      "<li>Checkout seguro · Pix e cartão</li>" +
      "</ul>" +
      '<button type="button" class="btn btn-primary btn-block btn-glow" id="btn-checkout">' +
      D.offer.cta +
      "</button>" +
      "</div>" +
      '<p class="disclaimer">' +
      D.offer.disclaimer +
      "</p>";

    var btn = document.getElementById("btn-checkout");
    if (btn) {
      btn.addEventListener("click", function () {
        playSound("cta");
        goCheckout();
      });
    }
    saveProgress();
  }

  function goCheckout() {
    Px.initiateCheckout();
    Ax.checkout();
    Ax.flush();
    var url = buildCheckoutUrl();
    window.location.href = url;
  }

  /* ─── cookies ─── */

  function setupCookies() {
    if (!el.cookieBanner) return;
    try {
      if (localStorage.getItem("mapa_cookie_ok") === "1") {
        el.cookieBanner.hidden = true;
        return;
      }
    } catch (e) {}
    el.cookieBanner.hidden = false;
    var ok = document.getElementById("btn-cookie-ok");
    if (ok) {
      ok.addEventListener("click", function () {
        try {
          localStorage.setItem("mapa_cookie_ok", "1");
        } catch (e) {}
        el.cookieBanner.hidden = true;
      });
    }
  }

  /* ─── bind ─── */

  function bind() {
    var start = document.getElementById("btn-start");
    if (start) start.addEventListener("click", startQuiz);

    var nameCta = document.getElementById("btn-name-continue");
    if (nameCta) nameCta.addEventListener("click", continueFromName);
    if (el.nameInput) {
      el.nameInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          continueFromName();
        }
      });
    }

    var midCta = document.getElementById("btn-mid-continue");
    if (midCta) midCta.addEventListener("click", continueFromMid);

    if (el.btnBack) el.btnBack.addEventListener("click", goBack);

    // skip name link
    var skip = document.getElementById("btn-name-skip");
    if (skip) {
      skip.addEventListener("click", function () {
        playSound("soft");
        if (el.nameInput) el.nameInput.value = "";
        continueFromName();
      });
    }

    var cookieOk = document.getElementById("btn-cookie-ok");
    if (cookieOk) {
      cookieOk.addEventListener("click", function () {
        playSound("click");
      });
    }

    // Delegação: qualquer [data-sound] que não tenha handler próprio
    document.addEventListener(
      "click",
      function (e) {
        var t = e.target && e.target.closest ? e.target.closest("[data-sound]") : null;
        if (!t) return;
        // CTAs principais já tocam no handler; evita double-fire em botões com id de fluxo
        var id = t.id || "";
        if (
          id === "btn-start" ||
          id === "btn-name-continue" ||
          id === "btn-name-skip" ||
          id === "btn-mid-continue" ||
          id === "btn-back" ||
          id === "btn-checkout" ||
          id === "btn-to-offer"
        ) {
          return;
        }
        playSound(t.getAttribute("data-sound") || "click");
      },
      true
    );
  }

  /* ─── boot ─── */

  function boot() {
    bind();
    setupCookies();
    Ax.landing();

    // resume?
    var saved = loadProgress();
    var params = new URLSearchParams(location.search);
    if (params.get("reset") === "1") {
      clearProgress();
      saved = null;
    }

    if (saved && saved.answers && Object.keys(saved.answers).length > 0) {
      state.qIndex = saved.qIndex || 0;
      state.answers = saved.answers || {};
      state.scores = saved.scores || { A: 0, B: 0, C: 0, D: 0 };
      state.name = saved.name || "";
      state.primary = saved.primary || null;
      state.secondary = saved.secondary || null;
      recomputeScores();

      if (saved.screen === "result" && state.primary) {
        renderResult();
        return;
      }
      if (saved.screen === "offer" && state.primary) {
        renderOffer();
        return;
      }
      if (saved.screen === "name") {
        renderNameGate();
        return;
      }
      if (saved.screen === "mid") {
        renderMid();
        return;
      }
      if (saved.screen === "quiz") {
        renderQuestion();
        return;
      }
    }

    renderOpen();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
