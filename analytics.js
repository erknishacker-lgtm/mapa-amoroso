/**
 * Tracking do funil → Supabase (analytics_events)
 * Não quebra o quiz se config estiver vazia ou rede falhar.
 */
(function () {
  var cfg = window.MAPA_CONFIG || {};
  var endpoint = "";
  var headers = {};
  var enabled = false;
  var queue = [];
  var flushing = false;

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "s-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function getSessionId() {
    var key = "mapa_sid";
    try {
      var s = localStorage.getItem(key);
      if (s) return s;
      s = uuid();
      localStorage.setItem(key, s);
      return s;
    } catch (e) {
      return uuid();
    }
  }

  var sessionId = getSessionId();

  function init() {
    var url = (cfg.supabaseUrl || "").replace(/\/$/, "");
    var key = cfg.supabaseAnonKey || "";
    if (!url || !key || url.indexOf("SEU_PROJETO") !== -1 || key.indexOf("SUA_ANON") !== -1) {
      enabled = false;
      return;
    }
    endpoint = url + "/rest/v1/analytics_events";
    headers = {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: "Bearer " + key,
      Prefer: "return=minimal",
    };
    enabled = true;
  }

  init();

  function buildRow(eventType, payload) {
    payload = payload || {};
    return {
      session_id: sessionId,
      event_type: eventType,
      question_id: payload.questionId || null,
      option_ids: payload.optionIds || [],
      option_labels: payload.optionLabels || [],
      step_index: typeof payload.stepIndex === "number" ? payload.stepIndex : null,
      pattern_id: payload.patternId || null,
      meta: payload.meta || {},
    };
  }

  function flush() {
    if (!enabled || flushing || queue.length === 0) return;
    flushing = true;
    var batch = queue.splice(0, 25);
    var body = JSON.stringify(batch.length === 1 ? batch[0] : batch);

    function done() {
      flushing = false;
      if (queue.length) flush();
    }

    try {
      if (navigator.sendBeacon && batch.length === 1) {
        // sendBeacon com header custom é limitado; usa fetch keepalive
      }
      fetch(endpoint, {
        method: "POST",
        headers: headers,
        body: body,
        keepalive: true,
        mode: "cors",
      })
        .then(function () {
          done();
        })
        .catch(function () {
          // re-enfileira em falha leve
          queue = batch.concat(queue);
          flushing = false;
        });
    } catch (e) {
      queue = batch.concat(queue);
      flushing = false;
    }
  }

  function track(eventType, payload) {
    if (!enabled) return;
    queue.push(buildRow(eventType, payload));
    // agrupa micro-rajadas
    clearTimeout(track._t);
    track._t = setTimeout(flush, 80);
  }

  window.MapaAnalytics = {
    sessionId: sessionId,
    enabled: function () {
      return enabled;
    },
    track: track,
    flush: flush,

    landing: function () {
      track("landing", { meta: { path: location.pathname || "/" } });
    },
    start: function () {
      track("start");
    },
    profile: function (opts) {
      track("profile", {
        meta: {
          hasName: !!(opts && opts.hasName),
          hasSign: !!(opts && opts.hasSign),
          skipped: !!(opts && opts.skipped),
          sign: (opts && opts.sign) || null,
        },
      });
    },
    questionView: function (q, index) {
      track("question_view", {
        questionId: q && q.id,
        stepIndex: index,
        meta: { axis: (q && q.axis) || "", text: (q && q.text) || "" },
      });
    },
    questionAnswer: function (q, index, optionIndexes, labels) {
      track("question_answer", {
        questionId: q && q.id,
        stepIndex: index,
        optionIds: optionIndexes || [],
        optionLabels: labels || [],
      });
    },
    questionNext: function (q, index) {
      track("question_next", {
        questionId: q && q.id,
        stepIndex: index,
      });
    },
    result: function (patternId, meta) {
      track("result", {
        patternId: patternId || null,
        meta: meta || {},
      });
    },
    checkout: function () {
      track("checkout", { meta: { value: 9.97, currency: "BRL" } });
    },
    restart: function () {
      track("restart");
    },
  };

  // flush ao sair
  window.addEventListener("pagehide", function () {
    flush();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
  });
})();
