/**
 * Analytics Supabase — 1 lead por visitante, progresso e funil.
 * Nome pode ir ao backend (personalização interna).
 * Meta Pixel NÃO recebe nome/respostas/padrões.
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

  function storedUtm(k) {
    try {
      return qs(k) || sessionStorage.getItem("mapa_" + k) || localStorage.getItem("mapa_" + k);
    } catch (e) {
      return qs(k);
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
      utm_source: storedUtm("utm_source"),
      utm_medium: storedUtm("utm_medium"),
      utm_campaign: storedUtm("utm_campaign"),
      utm_content: storedUtm("utm_content"),
      utm_term: storedUtm("utm_term"),
      fbclid: storedUtm("fbclid") || qs("fbclid"),
      gclid: storedUtm("gclid") || qs("gclid"),
      ttclid: qs("ttclid"),
      fbc: cookie("_fbc"),
      fbp: cookie("_fbp"),
      steps: { landing: true },
      answers: {},
      meta: {
        creative: cfg.creativeId || "",
        campaign: cfg.campaignId || "",
        adset: cfg.adsetId || "",
        headline: cfg.headlineVariant || "A",
        price: cfg.price || 29.9,
      },
    };
    Object.assign(row, extra || {});
    return post("quiz_leads", row, "resolution=merge-duplicates,return=minimal").then(function () {
      enrichGeo();
    });
  }

  function enrichGeo() {
    if (geoDone || !enabled) return;
    geoDone = true;
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

    /** Nome opcional após Q3 — não vai ao Meta */
    name: function (firstName) {
      var steps = mergeSteps("name");
      var n = (firstName || "").trim().slice(0, 40) || null;
      queuePatch({
        steps: steps,
        status: "in_quiz",
        name: n,
        meta: { hasName: !!n },
      });
      logEvent("name", { meta: { hasName: !!n } });
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
      });
    },

    questionAnswer: function (q, index, key) {
      if (!q) return;
      var step = (index || 0) + 1;
      var answers = mergeAnswers(q.id, {
        key: key || "",
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
        optionIds: [key || ""],
        optionLabels: [],
      });
    },

    result: function (patternId, secondaryId, meta) {
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
        max_step_reached: Math.max(9, mergeSteps._max || 0),
        current_step: 10,
        meta: {
          secondary: secondaryId || null,
          scores: meta.scores || null,
        },
      });
      logEvent("result", {
        patternId: patternId,
        meta: { secondary: secondaryId || null },
      });
    },

    checkout: function () {
      var price = (cfg && cfg.price) || 29.9;
      var steps = mergeSteps("checkout");
      queuePatch({
        steps: steps,
        status: "checkout",
        checkout_clicked_at: new Date().toISOString(),
        duration_seconds: durationSec(),
        current_step: 11,
      });
      logEvent("checkout", { meta: { value: price, currency: "BRL" } });
    },

    purchase: function (value) {
      var price = typeof value === "number" ? value : (cfg && cfg.price) || 29.9;
      queuePatch({
        steps: mergeSteps("purchase"),
        status: "purchased",
        purchased_at: new Date().toISOString(),
        revenue: price,
      });
      logEvent("purchase", { meta: { value: price, currency: "BRL" } });
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
