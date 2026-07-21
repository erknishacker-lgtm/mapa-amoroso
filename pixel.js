/**
 * Meta Pixel helpers — Mapa do Padrão Amoroso
 * ID: 4427665624163520
 */
(function () {
  var PIXEL_ID = "4427665624163520";
  var PRICE = 9.97;
  var CURRENCY = "BRL";
  var fired = {};

  function ready(fn) {
    if (typeof window.fbq === "function") {
      fn();
      return;
    }
    var n = 0;
    var t = setInterval(function () {
      n += 1;
      if (typeof window.fbq === "function") {
        clearInterval(t);
        fn();
      } else if (n > 40) {
        clearInterval(t);
      }
    }, 100);
  }

  function once(key, fn) {
    if (fired[key]) return;
    fired[key] = true;
    fn();
  }

  function track(event, params) {
    ready(function () {
      try {
        if (params) window.fbq("track", event, params);
        else window.fbq("track", event);
      } catch (e) {
        /* silencioso */
      }
    });
  }

  function trackCustom(event, params) {
    ready(function () {
      try {
        if (params) window.fbq("trackCustom", event, params);
        else window.fbq("trackCustom", event);
      } catch (e) {
        /* silencioso */
      }
    });
  }

  window.MapaPixel = {
    id: PIXEL_ID,
    price: PRICE,
    currency: CURRENCY,

    /** Landing / conteúdo principal */
    viewContent: function (opts) {
      track("ViewContent", {
        content_name: (opts && opts.name) || "Mapa do Padrão Amoroso",
        content_category: (opts && opts.category) || "landing",
        content_ids: ["mapa-amoroso"],
        content_type: "product",
        value: PRICE,
        currency: CURRENCY,
      });
    },

    /** Clicou em começar o mapa */
    startQuiz: function () {
      once("startQuiz", function () {
        track("Lead", {
          content_name: "Início do mapa",
          content_category: "quiz_start",
          value: PRICE,
          currency: CURRENCY,
        });
        trackCustom("StartQuiz", { step: "cta_landing" });
      });
    },

    /** Preencheu ou pulou nome/signo e entrou no quiz */
    quizBegin: function (opts) {
      once("quizBegin", function () {
        track("CompleteRegistration", {
          content_name: "Perfil do mapa",
          status: true,
          value: PRICE,
          currency: CURRENCY,
        });
        trackCustom("QuizBegin", {
          has_name: !!(opts && opts.hasName),
          has_sign: !!(opts && opts.hasSign),
          skipped: !!(opts && opts.skipped),
        });
      });
    },

    /** Progresso no quiz (a cada pergunta avançada) */
    quizProgress: function (index, total, axis) {
      var step = index + 1;
      trackCustom("QuizProgress", {
        question_index: step,
        question_total: total,
        axis: axis || "",
        percent: Math.round((step / total) * 100),
      });
      // Marcos padrão Meta
      if (step === 1) {
        once("q1", function () {
          trackCustom("QuizQuestion1");
        });
      }
      if (step === Math.ceil(total / 2)) {
        once("qmid", function () {
          trackCustom("QuizMidpoint", { question: step });
        });
      }
      if (step === total) {
        once("qlast", function () {
          trackCustom("QuizLastQuestion", { question: step });
        });
      }
    },

    /** Marcou opção */
    optionSelect: function (opts) {
      trackCustom("QuizOptionSelect", {
        question_index: (opts && opts.index) + 1 || 0,
        selected_count: (opts && opts.count) || 1,
      });
    },

    /** Quiz concluído / gerando resultado */
    quizComplete: function () {
      once("quizComplete", function () {
        trackCustom("QuizComplete");
        track("SubmitApplication", {
          content_name: "Quiz mapa concluído",
        });
      });
    },

    /** Resultado / oferta (pré-compra) */
    viewResult: function (opts) {
      once("viewResult", function () {
        track("ViewContent", {
          content_name: (opts && opts.pattern) || "Resultado do padrão",
          content_category: "result_offer",
          content_ids: ["mapa-completo"],
          content_type: "product",
          value: PRICE,
          currency: CURRENCY,
        });
        trackCustom("ViewResult", {
          pattern: (opts && opts.pattern) || "",
          match: (opts && opts.match) || 0,
        });
      });
    },

    /** Clicou para pagar / desbloquear */
    initiateCheckout: function () {
      track("InitiateCheckout", {
        content_name: "Mapa completo",
        content_ids: ["mapa-completo"],
        content_type: "product",
        num_items: 1,
        value: PRICE,
        currency: CURRENCY,
      });
      track("AddToCart", {
        content_name: "Mapa completo",
        content_ids: ["mapa-completo"],
        content_type: "product",
        value: PRICE,
        currency: CURRENCY,
      });
      // Clique no checkout = intenção de compra (Lastlink conclui fora)
      track("Purchase", {
        content_name: "Mapa completo",
        content_ids: ["mapa-completo"],
        content_type: "product",
        num_items: 1,
        value: PRICE,
        currency: CURRENCY,
      });
      trackCustom("ClickCheckout", {
        url: "https://lastlink.com/p/C53821E2C/checkout-payment/",
        value: PRICE,
        currency: CURRENCY,
      });
    },

    /** Reiniciou o fluxo */
    restart: function () {
      trackCustom("QuizRestart");
    },

    /** Página de pagamento interna */
    viewPay: function () {
      trackCustom("ViewPayPage");
    },
  };

  // Landing ViewContent (além do PageView do snippet)
  ready(function () {
    window.MapaPixel.viewContent({ name: "Landing Mapa Amoroso", category: "landing" });
  });
})();
