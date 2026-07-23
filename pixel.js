/**
 * Meta Pixel — eventos genéricos apenas.
 * Nunca envia: nome, respostas, padrões emocionais, texto digitado.
 */
(function () {
  var cfg = window.MAPA_CONFIG || {};
  var PIXEL_ID = cfg.metaPixelId || "4427665624163520";
  var PRICE = typeof cfg.price === "number" ? cfg.price : 29.9;
  var CURRENCY = cfg.currency || "BRL";
  var PRODUCT_ID = "mapa-ciclo-amoroso";
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
      } catch (e) {}
    });
  }

  function trackCustom(event, params) {
    ready(function () {
      try {
        if (params) window.fbq("trackCustom", event, params);
        else window.fbq("trackCustom", event);
      } catch (e) {}
    });
  }

  function eventId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 10)
    );
  }

  window.MapaPixel = {
    id: PIXEL_ID,
    price: PRICE,
    currency: CURRENCY,

    /** PageView já dispara no snippet; reforço opcional */
    pageView: function () {
      once("pageView", function () {
        track("PageView");
      });
    },

    /** Clique no primeiro botão (DESCOBRIR MEU CICLO) */
    quizStart: function () {
      once("quizStart", function () {
        trackCustom("QuizStart", { content_ids: [PRODUCT_ID] });
      });
    },

    /** Chegada à pergunta 5 (50% aproximado) */
    quizProgress50: function () {
      once("quizProgress50", function () {
        trackCustom("QuizProgress50", { content_ids: [PRODUCT_ID] });
      });
    },

    /** Conclusão da pergunta 9 */
    quizComplete: function () {
      once("quizComplete", function () {
        trackCustom("QuizComplete", { content_ids: [PRODUCT_ID] });
      });
    },

    /** Visualização do resultado gratuito */
    viewContent: function () {
      once("viewContent", function () {
        track("ViewContent", {
          content_ids: [PRODUCT_ID],
          content_type: "product",
          content_name: "Resultado gratuito",
          value: PRICE,
          currency: CURRENCY,
        });
      });
    },

    /** Clique no botão da oferta */
    initiateCheckout: function () {
      var eid = eventId("ic");
      track("InitiateCheckout", {
        content_ids: [PRODUCT_ID],
        content_type: "product",
        content_name: "Mapa Completo",
        num_items: 1,
        value: PRICE,
        currency: CURRENCY,
        eventID: eid,
      });
      return eid;
    },

    /**
     * Purchase — só quando pagamento confirmado (página de obrigado / webhook).
     * Nunca no clique do checkout.
     */
    purchase: function (opts) {
      opts = opts || {};
      var value = typeof opts.value === "number" ? opts.value : PRICE;
      var eid = opts.eventId || eventId("pur");
      once("purchase_" + eid, function () {
        track("Purchase", {
          content_ids: [opts.productId || PRODUCT_ID],
          content_type: "product",
          content_name: "Mapa Completo",
          num_items: 1,
          value: value,
          currency: CURRENCY,
          eventID: eid,
        });
      });
      return eid;
    },
  };
})();
