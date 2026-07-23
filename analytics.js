/**
 * Tracking estilo Enlead — 1 linha por lead, colunas = respostas por pergunta
 * Supabase: quiz_leads (upsert) + analytics_events (log)
 */
(function () {
  var cfg = window.MAPA_CONFIG || {};
  var base = "";
  var headers = {};
  var enabled = false;
  var leadId = null;
  var startedAt = null;
  var pendingPatch = null;
  var patchTimer = null;
  var geoDone = false;

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "L-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function getLeadId() {
    var key = "mapa_lead_id";
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

  function cookie(name) {
    try {
      var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) {
      return null;
    }
  }

  function qs(name) {
    try {
      return new URLSearchParams(location.search).get(name);
    } catch (e) {
      return null;
    }
  }

  function parseUA() {
    var ua = navigator.userAgent || "";
    var os = "Outro";
    if (/Windows/i.test(ua)) os = "Windows";
    else if (/Mac OS X/i.test(ua)) os = "macOS";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    var browser = "Outro";
    if (/Edg\//i.test(ua)) browser = "Edge";
    else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
    else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";
    else if (/Firefox\//i.test(ua)) browser = "Firefox";

    var device = "desktop";
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) device = /iPad|Tablet/i.test(ua) ? "tablet" : "mobile";

    return { os: os, browser: browser, device_type: device, user_agent: ua.slice(0, 500) };
  }

  function init() {
    var url = (cfg.supabaseUrl || "").replace(/\/$/, "");
    var key = cfg.supabaseAnonKey || "";
    if (!url || !key) {
      enabled = false;
      return;
    }
    base = url + "/rest/v1";
    headers = {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: "Bearer " + key,
      Prefer: "return=minimal",
    };
    enabled = true;
    leadId = getLeadId();
  }

  init();

  function durationSec() {
    if (!startedAt) return null;
    return Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  }

  function post(table, row, prefer) {
    if (!enabled) return Promise.resolve();
    var h = Object.assign({}, headers);
    if (prefer) h.Prefer = prefer;
    return fetch(base + "/" + table, {
      method: "POST",
      headers: h,
      body: JSON.stringify(row),
      keepalive: true,
      mode: "cors",
    }).catch(function () {});
  }

  function patchLead(fields) {
    if (!enabled || !leadId) return Promise.resolve();
    fields.last_seen_at = new Date().toISOString();
    if (startedAt) fields.duration_seconds = durationSec();
    return fetch(base + "/quiz_leads?lead_id=eq." + encodeURIComponent(leadId), {
      method: "PATCH",
      headers: headers,
      body: JSON.stringify(fields),
      keepalive: true,
      mode: "cors",
    }).catch(function () {});
  }

  function queuePatch(fields) {
    pendingPatch = Object.assign(pendingPatch || {}, fields);
    clearTimeout(patchTimer);
    patchTimer = setTimeout(function () {
      var f = pendingPatch;
      pendingPatch = null;
      if (f) patchLead(f);
    }, 120);
  }

  function logEvent(type, payload) {
    payload = payload || {};
    post("analytics_events", {
      lead_id: leadId,
      session_id: getSessionId(),
      event_type: type,
      question_id: payload.questionId || null,
      option_ids: payload.optionIds || [],
      option_labels: payload.optionLabels || [],
      step_index: typeof payload.stepIndex === "number" ? payload.stepIndex : null,
      pattern_id: payload.patternId || null,
      meta: payload.meta || {},
    });
  }

  function ensureLead(extra) {
    if (!enabled) return Promise.resolve();
    if (!startedAt) startedAt = Date.now();
    var ua = parseUA();
    var row = {
      lead_id: leadId,
      session_id: getSessionId(),
      started_at: new Date(startedAt).toISOString(),
      last_seen_at: new Date().toISOString(),
      status: "started",
      current_step: 0,
      max_step_reached: 0,
      device_type: ua.device_type,
      os: ua.os,
      browser: ua.browser,
      language: navigator.language || null,
      user_agent: ua.user_agent,
      referrer: document.referrer || null,
      landing_url: location.href.slice(0, 1000),
      utm_source: qs("utm_source"),
      utm_medium: qs("utm_medium"),
      utm_campaign: qs("utm_campaign"),
      utm_content: qs("utm_content"),
      utm_term: qs("utm_term"),
      fbclid: qs("fbclid"),
      gclid: qs("gclid"),
      ttclid: qs("ttclid"),
      fbc: cookie("_fbc"),
      fbp: cookie("_fbp"),
      steps: { landing: true },
      answers: {},
      meta: {},
    };
    Object.assign(row, extra || {});
    return post("quiz_leads", row, "resolution=merge-duplicates,return=minimal").then(function () {
      enrichGeo();
    });
  }

  function enrichGeo() {
    if (geoDone || !enabled) return;
    geoDone = true;
    // IP + cidade (best-effort; se falhar, segue sem geo)
    fetch("https://get.geojs.io/v1/ip/geo.json")
      .then(function (r) {
        return r.json();
      })
      .then(function (g) {
        if (!g) return;
        patchLead({
          ip: g.ip || null,
          country: g.country || g.country_code || null,
          region: g.region || null,
          city: g.city || null,
        });
      })
      .catch(function () {});
  }

  function mergeSteps(stepKey) {
    // steps é jsonb — atualiza via read-modify no client? melhor enviar objeto completo incrementalmente
    // usamos RPC-less: patch with steps using raw JSON merge not available in REST easily
    // Estratégia: guardar steps em memória
    if (!mergeSteps._map) mergeSteps._map = { landing: true };
    mergeSteps._map[stepKey] = true;
    return Object.assign({}, mergeSteps._map);
  }

  function mergeAnswers(qid, data) {
    if (!mergeAnswers._map) mergeAnswers._map = {};
    mergeAnswers._map[qid] = data;
    return Object.assign({}, mergeAnswers._map);
  }

  window.MapaAnalytics = {
    leadId: function () {
      return leadId;
    },
    enabled: function () {
      return enabled;
    },
    flush: function () {
      if (pendingPatch) {
        var f = pendingPatch;
        pendingPatch = null;
        patchLead(f);
      }
    },

    landing: function () {
      ensureLead({ steps: mergeSteps("landing"), status: "started" });
      logEvent("landing", { meta: { path: location.pathname || "/" } });
    },

    start: function () {
      ensureLead({
        steps: mergeSteps("start"),
        status: "started",
      }).then(function () {
        queuePatch({ steps: mergeSteps("start"), status: "started" });
      });
      logEvent("start");
    },

    profile: function (opts) {
      opts = opts || {};
      var steps = mergeSteps("profile");
      queuePatch({
        steps: steps,
        status: "profile",
        name: opts.hasName ? opts.name || null : null,
        sign: opts.sign || null,
        meta: {
          hasName: !!opts.hasName,
          hasSign: !!opts.hasSign,
          skipped: !!opts.skipped,
        },
      });
      // name from input not always in opts
      logEvent("profile", {
        meta: {
          hasName: !!opts.hasName,
          hasSign: !!opts.hasSign,
          skipped: !!opts.skipped,
          sign: opts.sign || null,
        },
      });
    },

    questionView: function (q, index) {
      if (!q) return;
      var step = (index || 0) + 1;
      var steps = mergeSteps(q.id);
      mergeSteps._max = Math.max(step, mergeSteps._max || 0);
      queuePatch({
        steps: steps,
        status: "in_quiz",
        current_step: step,
        max_step_reached: mergeSteps._max,
      });
      logEvent("question_view", {
        questionId: q.id,
        stepIndex: index,
        meta: { axis: q.axis || "", text: q.text || "" },
      });
    },

    questionAnswer: function (q, index, optionIndexes, labels) {
      if (!q) return;
      var step = (index || 0) + 1;
      var answers = mergeAnswers(q.id, {
        labels: labels || [],
        indices: optionIndexes || [],
        at: new Date().toISOString(),
      });
      var steps = mergeSteps(q.id);
      mergeSteps._max = Math.max(step, mergeSteps._max || 0);
      queuePatch({
        answers: answers,
        steps: steps,
        status: "in_quiz",
        current_step: step,
        max_step_reached: mergeSteps._max,
      });
      logEvent("question_answer", {
        questionId: q.id,
        stepIndex: index,
        optionIds: optionIndexes || [],
        optionLabels: labels || [],
      });
    },

    questionNext: function (q, index) {
      logEvent("question_next", {
        questionId: q && q.id,
        stepIndex: index,
      });
    },

    result: function (patternId, meta) {
      meta = meta || {};
      var steps = mergeSteps("result");
      queuePatch({
        steps: steps,
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_seconds: durationSec(),
        pattern_id: patternId || null,
        pattern_name: meta.patternName || null,
        name: meta.name || null,
        sign: meta.sign || null,
        max_step_reached: Math.max(12, mergeSteps._max || 0),
        current_step: 13,
      });
      logEvent("result", {
        patternId: patternId,
        meta: meta,
      });
    },

    checkout: function () {
      var steps = mergeSteps("checkout");
      queuePatch({
        steps: steps,
        status: "checkout",
        checkout_clicked_at: new Date().toISOString(),
        duration_seconds: durationSec(),
        current_step: 14,
      });
      logEvent("checkout", { meta: { value: 9.97, currency: "BRL" } });
    },

    restart: function () {
      logEvent("restart");
      try {
        localStorage.removeItem("mapa_lead_id");
      } catch (e) {}
      leadId = getLeadId();
      startedAt = null;
      mergeSteps._map = {};
      mergeSteps._max = 0;
      mergeAnswers._map = {};
      geoDone = false;
    },
  };

  window.addEventListener("pagehide", function () {
    window.MapaAnalytics.flush();
  });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") window.MapaAnalytics.flush();
  });
})();
