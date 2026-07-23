/**
 * Quiz Intelligence — Mapa do Ciclo Amoroso
 * Funil: abertura → 9 perguntas (nome após Q3) → resultado → checkout
 * Ciclos: A Abandono · B Autoabandono · C Indisponível · D Distância
 */
(function () {
  var PASS_KEY = "mapa_admin_pass";
  var Q_ORDER = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9"];
  var PATTERN_NAMES = {
    A: "Alerta de Abandono",
    B: "Autoabandono Afetivo",
    C: "Atração pelo Indisponível",
    D: "Proteção pela Distância",
  };
  var PATTERN_COLORS = {
    A: "#c45c4a",
    B: "#7c5cff",
    C: "#38bdf8",
    D: "#34d399",
  };

  var charts = {};
  var lastData = null;
  var filteredLeads = [];

  var $ = function (id) {
    return document.getElementById(id);
  };

  function cfg() {
    return window.MAPA_CONFIG || {};
  }

  function ymd(d) {
    var x = new Date(d);
    return (
      x.getFullYear() +
      "-" +
      String(x.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(x.getDate()).padStart(2, "0")
    );
  }

  function setDates(days) {
    var to = new Date();
    var from = new Date();
    from.setDate(from.getDate() - (days - 1));
    if ($("date-to")) $("date-to").value = ymd(to);
    if ($("date-from")) $("date-from").value = ymd(from);
  }

  function getPass() {
    try {
      return sessionStorage.getItem(PASS_KEY) || "";
    } catch (e) {
      return "";
    }
  }
  function setPass(p) {
    try {
      sessionStorage.setItem(PASS_KEY, p);
    } catch (e) {}
  }
  function clearPass() {
    try {
      sessionStorage.removeItem(PASS_KEY);
    } catch (e) {}
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function questions() {
    return (window.MAPA_DATA && window.MAPA_DATA.questions) || [];
  }

  function qTitle(id) {
    var qs = questions();
    for (var i = 0; i < qs.length; i++) {
      if (qs[i].id === id) {
        return i + 1 + ". " + (qs[i].text || id).slice(0, 64);
      }
    }
    var idx = Q_ORDER.indexOf(id);
    return (idx >= 0 ? idx + 1 + ". " : "") + id;
  }

  function optionLabel(qid, key) {
    if (!key) return "";
    var k = String(key).trim();
    // Já veio texto longo (legado)
    if (k.length > 2) return k;
    var qs = questions();
    for (var i = 0; i < qs.length; i++) {
      if (qs[i].id !== qid) continue;
      var opts = qs[i].options || [];
      for (var j = 0; j < opts.length; j++) {
        if (opts[j].key === k) return k + " — " + opts[j].label;
      }
    }
    return k;
  }

  function patternLabel(id, name) {
    if (name && String(name).length > 2) return name;
    if (id && PATTERN_NAMES[id]) return PATTERN_NAMES[id];
    return name || id || "—";
  }

  function secondaryFromMeta(meta) {
    if (!meta) return null;
    if (typeof meta === "string") {
      try {
        meta = JSON.parse(meta);
      } catch (e) {
        return null;
      }
    }
    return meta.secondary || null;
  }

  async function fetchAnalytics(password) {
    var c = cfg();
    var url = (c.supabaseUrl || "").replace(/\/$/, "");
    var key = c.supabaseAnonKey || "";
    if (!url || !key) throw new Error("Config Supabase ausente.");
    var pass = password || getPass();
    if (!pass) throw new Error("Senha não informada.");

    var from = ($("date-from") && $("date-from").value) || "2020-01-01";
    var to = ($("date-to") && $("date-to").value) || ymd(new Date());

    var res = await fetch(url + "/rest/v1/rpc/admin_analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: "Bearer " + key,
      },
      body: JSON.stringify({
        p_password: pass,
        p_from: from + "T00:00:00-03:00",
        p_to: to + "T23:59:59.999-03:00",
      }),
    });
    var text = await res.text();
    if (!res.ok) {
      if (/UNAUTHORIZED|42501/i.test(text))
        throw new Error("Senha incorreta. Rode supabase/fix_admin.sql se ainda não rodou.");
      if (/PGRST202|function/i.test(text))
        throw new Error("Função admin_analytics ausente. Rode fix_admin.sql no Supabase.");
      if (/quiz_leads|PGRST205/i.test(text))
        throw new Error("Tabela quiz_leads ausente. Rode schema.sql + fix_admin.sql.");
      throw new Error("HTTP " + res.status + ": " + text.slice(0, 160));
    }
    return JSON.parse(text);
  }

  function destroy(id) {
    if (charts[id]) {
      charts[id].destroy();
      delete charts[id];
    }
  }

  function chartOpts(legend) {
    return {
      responsive: true,
      maintainAspectRatio: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: !!legend,
          position: "bottom",
          labels: {
            color: "#a1a8b8",
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            pointStyle: "circle",
            padding: 16,
            font: { family: "DM Sans", size: 11, weight: "500" },
          },
        },
        tooltip: {
          backgroundColor: "rgba(15,18,25,0.95)",
          titleColor: "#f7f8fc",
          bodyColor: "#a1a8b8",
          borderColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          titleFont: { family: "DM Sans", weight: "600" },
          bodyFont: { family: "DM Sans" },
        },
      },
      scales: {
        x: {
          ticks: { color: "#6b7289", maxRotation: 0, font: { size: 10, family: "DM Sans" } },
          grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#6b7289", precision: 0, font: { size: 10, family: "DM Sans" } },
          grid: { color: "rgba(255,255,255,0.04)", drawBorder: false },
          border: { display: false },
        },
      },
    };
  }

  /* ---------- KPIs ---------- */
  function renderKpis(data) {
    var t = data.totals || {};
    var leads = t.leads || 0;
    var started = t.started || 0;
    var completed = t.completed || 0;
    var checkouts = t.checkouts || 0;
    var purchases = t.purchases || 0;
    var cRate = started ? Math.round((completed / started) * 1000) / 10 : 0;
    var pRate = completed ? Math.round((checkouts / completed) * 1000) / 10 : 0;
    var avg = t.avg_duration_sec;
    var avgL = avg != null ? Math.round(avg / 60) + " min" : "—";

    $("kpis").innerHTML =
      kpi("Visitantes", leads) +
      kpi("Inícios do quiz", started) +
      kpi("Resultado grátis", completed, cRate + "% dos inícios") +
      kpi("Checkout PerfectPay", checkouts, pRate + "% do resultado", true) +
      kpi("Compras", purchases) +
      kpi("Tempo médio", avgL);
  }

  function kpi(label, value, note, hot) {
    return (
      '<div class="kpi' +
      (hot ? " hot" : "") +
      '"><span>' +
      esc(label) +
      "</span><strong>" +
      esc(String(value)) +
      "</strong>" +
      (note ? "<em>" + esc(note) + "</em>" : "") +
      "</div>"
    );
  }

  /* ---------- Funil ---------- */
  function renderFunnel(data) {
    var steps = data.step_funnel || [];
    // Garante ordem e labels amigáveis se a função SQL ainda for antiga
    if (!steps.length || steps.some(function (s) { return s.step_key === "q12" || s.step_key === "q4m"; })) {
      steps = rebuildFunnelFromLeads(data);
    }

    var total = (data.totals && data.totals.leads) || 0;
    var html = "";
    var worstDrop = -1;
    var worstKey = null;
    var prevReached = null;

    steps.forEach(function (s, i) {
      if (i === 0) {
        prevReached = Number(s.reached || 0);
        return;
      }
      var r = Number(s.reached || 0);
      var drop = prevReached > 0 ? ((prevReached - r) / prevReached) * 100 : 0;
      if (drop > worstDrop) {
        worstDrop = drop;
        worstKey = s.step_key;
      }
      prevReached = r;
    });

    steps.forEach(function (s, i) {
      var reached = Number(s.reached || 0);
      var rate =
        s.pass_rate != null
          ? Number(s.pass_rate)
          : total > 0
            ? Math.round((reached / total) * 1000) / 10
            : 0;
      var prev = i > 0 ? Number(steps[i - 1].reached || 0) : total;
      var stepConv = prev > 0 ? Math.round((reached / prev) * 1000) / 10 : 0;
      var isDrop = s.step_key === worstKey && worstDrop >= 8;
      var isLast = i === steps.length - 1;

      html +=
        '<div class="funnel-step' +
        (isDrop ? " is-drop" : "") +
        '">' +
        '<div class="funnel-axis"><span class="funnel-dot"></span>' +
        (isLast ? "" : '<span class="funnel-line"></span>') +
        "</div>" +
        '<div class="funnel-body">' +
        "<div><div class=\"funnel-name\">" +
        esc(s.label) +
        '</div><div class="funnel-meta">Conv. etapa: ' +
        stepConv +
        "% · do total: " +
        rate +
        "%</div>" +
        '<div class="funnel-bar-track" style="margin-top:8px"><div class="funnel-bar-fill" style="width:' +
        Math.min(100, rate) +
        '%"></div></div></div>' +
        "<div></div>" +
        '<div class="funnel-nums"><strong>' +
        reached +
        "</strong><span>" +
        rate +
        "% acumulado</span></div>" +
        "</div></div>";
    });

    $("funnel-rail").innerHTML = html || '<p class="top-sub">Sem dados no período.</p>';

    var insights = [];
    if (worstKey && worstDrop >= 5) {
      var w = steps.find(function (s) {
        return s.step_key === worstKey;
      });
      insights.push(
        "Maior abandono em <strong>" +
          esc(w ? w.label : worstKey) +
          "</strong> (−" +
          Math.round(worstDrop) +
          "% vs etapa anterior)."
      );
    }
    var t = data.totals || {};
    if (t.started && t.completed != null) {
      insights.push(
        "Taxa de conclusão (9 perguntas → resultado): <strong>" +
          (t.started ? Math.round((t.completed / t.started) * 1000) / 10 : 0) +
          "%</strong>."
      );
    }
    if (t.completed && t.checkouts != null) {
      insights.push(
        "Do resultado grátis ao checkout: <strong>" +
          (t.completed ? Math.round((t.checkouts / t.completed) * 1000) / 10 : 0) +
          "%</strong>."
      );
    }
    var topPat = (data.patterns || [])[0];
    if (topPat) {
      insights.push(
        "Ciclo mais comum: <strong>" +
          esc(patternLabel(topPat.pattern_id, topPat.pattern_name)) +
          "</strong> (" +
          (topPat.sessions || 0) +
          ")."
      );
    }
    if (!insights.length) insights.push("Aguardando mais tráfego para calcular gargalos.");
    $("insight-list").innerHTML = insights
      .map(function (x) {
        return "<li>" + x + "</li>";
      })
      .join("");
  }

  /** Fallback se SQL antigo ainda estiver no Supabase */
  function rebuildFunnelFromLeads(data) {
    var leads = data.leads || [];
    var total = leads.length;
    var defs = [
      { step_key: "landing", label: "Abertura", test: function () { return true; } },
      {
        step_key: "start",
        label: "Começou o quiz",
        test: function (L) {
          return (L.steps && L.steps.start) || (L.max_step_reached || 0) >= 1 || (L.answers && Object.keys(L.answers).length);
        },
      },
    ];
    Q_ORDER.forEach(function (qid, i) {
      if (i === 3) {
        defs.push({
          step_key: "name",
          label: "Nome (opcional)",
          test: function (L) {
            return (
              (L.steps && L.steps.name) ||
              (L.name && String(L.name).trim()) ||
              (L.answers && L.answers.q4) ||
              (L.max_step_reached || 0) >= 4
            );
          },
        });
      }
      defs.push({
        step_key: qid,
        label: "Pergunta " + (i + 1) + (i === 4 ? " (~50%)" : ""),
        test: function (L) {
          return (L.answers && L.answers[qid]) || (L.steps && L.steps[qid]) || (L.max_step_reached || 0) >= i + 1;
        },
      });
    });
    defs.push({
      step_key: "result",
      label: "Resultado grátis",
      test: function (L) {
        return (
          L.completed_at ||
          L.pattern_id ||
          (L.status && /completed|checkout|purchased/.test(L.status)) ||
          (L.steps && L.steps.result)
        );
      },
    });
    defs.push({
      step_key: "checkout",
      label: "Clique no checkout",
      test: function (L) {
        return L.checkout || (L.status && /checkout|purchased/.test(L.status));
      },
    });

    return defs.map(function (d, idx) {
      var reached = leads.filter(d.test).length;
      return {
        step_key: d.step_key,
        step_index: idx,
        label: d.label,
        reached: reached,
        total_leads: total,
        pass_rate: total ? Math.round((reached / total) * 1000) / 10 : 0,
      };
    });
  }

  function renderCharts(data) {
    if (typeof Chart === "undefined") return;
    var days = data.by_day || [];
    destroy("day");
    if ($("chart-day")) {
      charts.day = new Chart($("chart-day"), {
        type: "bar",
        data: {
          labels: days.map(function (d) {
            return d.day;
          }),
          datasets: [
            { label: "Leads", data: days.map(function (d) { return d.leads || 0; }), backgroundColor: "rgba(196,92,74,0.55)", borderRadius: 6 },
            { label: "Inícios", data: days.map(function (d) { return d.starts || 0; }), backgroundColor: "rgba(124,92,255,0.5)", borderRadius: 6 },
            { label: "Resultado", data: days.map(function (d) { return d.results || 0; }), backgroundColor: "rgba(52,211,153,0.55)", borderRadius: 6 },
            { label: "Checkout", data: days.map(function (d) { return d.checkouts || 0; }), backgroundColor: "rgba(92,36,52,0.7)", borderRadius: 6 },
          ],
        },
        options: chartOpts(true),
      });
    }

    var map = {};
    for (var h = 0; h < 24; h++) map[h] = { leads: 0, starts: 0, results: 0, checkouts: 0 };
    (data.by_hour || []).forEach(function (r) {
      var hour = Number(r.hour);
      if (map[hour])
        map[hour] = {
          leads: r.leads || 0,
          starts: r.starts || 0,
          results: r.results || 0,
          checkouts: r.checkouts || 0,
        };
    });
    var labels = [],
      L = [],
      S = [],
      R = [],
      C = [];
    for (var i = 0; i < 24; i++) {
      labels.push(String(i).padStart(2, "0") + "h");
      L.push(map[i].leads);
      S.push(map[i].starts);
      R.push(map[i].results);
      C.push(map[i].checkouts);
    }
    destroy("hour");
    if ($("chart-hour")) {
      charts.hour = new Chart($("chart-hour"), {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            { label: "Leads", data: L, borderColor: "#c45c4a", tension: 0.35, fill: false },
            { label: "Inícios", data: S, borderColor: "#7c5cff", tension: 0.35, fill: false },
            { label: "Resultado", data: R, borderColor: "#34d399", tension: 0.35, fill: false },
            { label: "Checkout", data: C, borderColor: "#5c2434", tension: 0.35, fill: false },
          ],
        },
        options: chartOpts(true),
      });
    }
  }

  /** Extrai texto da resposta (key A–D ou labels legadas) */
  function cellAns(answers, qid) {
    if (!answers || !answers[qid]) return "";
    var a = answers[qid];
    if (a.key) return optionLabel(qid, a.key);
    if (a.labels && a.labels.length) return a.labels.join(" · ");
    if (typeof a === "string") return optionLabel(qid, a);
    return "";
  }

  function applyLeadFilters() {
    var leads = (lastData && lastData.leads) || [];
    var q = (($("table-search") && $("table-search").value) || "").toLowerCase();
    var device = ($("filter-device") && $("filter-device").value) || "";
    var status = ($("filter-status") && $("filter-status").value) || "";
    var co = ($("filter-checkout") && $("filter-checkout").value) || "";
    var pat = ($("filter-pattern") && $("filter-pattern").value) || "";

    filteredLeads = leads.filter(function (L) {
      if (device && (L.device_type || "") !== device) return false;
      if (status && (L.status || "") !== status) return false;
      if (co === "yes" && !L.checkout) return false;
      if (co === "no" && L.checkout) return false;
      if (pat && (L.pattern_id || "") !== pat) return false;
      if (q) {
        var blob = [
          L.lead_id,
          L.utm_source,
          L.utm_campaign,
          L.pattern_name,
          L.pattern_id,
          patternLabel(L.pattern_id, L.pattern_name),
          L.city,
          L.name,
          JSON.stringify(L.answers || {}),
        ]
          .join(" ")
          .toLowerCase();
        if (blob.indexOf(q) === -1) return false;
      }
      return true;
    });
    paintSheet(filteredLeads);
  }

  function paintSheet(leads) {
    var head =
      '<tr><th class="sticky">Lead</th><th>Início</th><th>Status</th><th>Nome</th><th>Device</th><th>Local</th><th>UTM</th>' +
      Q_ORDER.map(function (id, i) {
        return '<th title="' + esc(qTitle(id)) + '">P' + (i + 1) + "</th>";
      }).join("") +
      "<th>Ciclo</th><th>2º</th><th>Checkout</th><th>Tempo</th></tr>";
    var thead = $("leads-sheet") && $("leads-sheet").querySelector("thead");
    var tbody = $("leads-sheet") && $("leads-sheet").querySelector("tbody");
    if (!thead || !tbody) return;
    thead.innerHTML = head;
    if (!leads.length) {
      tbody.innerHTML =
        '<tr><td colspan="20" style="color:#8b95a8;padding:24px">Nenhum lead neste filtro. Teste o quiz e atualize.</td></tr>';
      return;
    }
    tbody.innerHTML = leads
      .map(function (L, idx) {
        var short = (L.lead_id || "").slice(0, 8);
        var when = L.started_at
          ? new Date(L.started_at).toLocaleString("pt-BR", { hour12: false })
          : "—";
        var st = L.status || "—";
        var pill =
          st === "checkout" || st === "purchased"
            ? "pill-ok"
            : st === "completed"
              ? "pill-mid"
              : "pill-out";
        var loc = [L.city, L.region, L.country].filter(Boolean).join(", ") || "—";
        var utm = [L.utm_source, L.utm_campaign].filter(Boolean).join(" / ") || "—";
        var device = [L.device_type, L.os].filter(Boolean).join(" · ") || "—";
        var answers = L.answers || {};
        var qCells = Q_ORDER.map(function (id) {
          var v = cellAns(answers, id);
          return v
            ? '<td title="' + esc(v) + '">' + esc(v.length > 32 ? v.slice(0, 32) + "…" : v) + "</td>"
            : '<td class="empty">—</td>';
        }).join("");
        var sec = secondaryFromMeta(L.meta);
        var dur =
          L.duration_seconds != null
            ? Math.floor(L.duration_seconds / 60) + "m" + (L.duration_seconds % 60) + "s"
            : "—";
        return (
          '<tr data-idx="' +
          idx +
          '"><td class="sticky">' +
          esc(short) +
          "</td><td>" +
          esc(when) +
          '</td><td><span class="pill ' +
          pill +
          '">' +
          esc(st) +
          "</span></td><td>" +
          esc(L.name || "—") +
          "</td><td>" +
          esc(device) +
          "</td><td>" +
          esc(loc) +
          "</td><td>" +
          esc(utm) +
          "</td>" +
          qCells +
          "<td>" +
          esc(patternLabel(L.pattern_id, L.pattern_name)) +
          "</td><td>" +
          esc(sec ? patternLabel(sec, null) : "—") +
          "</td><td>" +
          (L.checkout ? "✓" : "—") +
          "</td><td>" +
          esc(dur) +
          "</td></tr>"
        );
      })
      .join("");

    tbody.querySelectorAll("tr[data-idx]").forEach(function (tr) {
      tr.addEventListener("click", function () {
        openDrawer(leads[Number(tr.getAttribute("data-idx"))]);
      });
    });
  }

  function openDrawer(L) {
    if (!L) return;
    $("drawer-title").textContent = (L.lead_id || "").slice(0, 14) + "…";
    var answers = L.answers || {};
    var timeline = Q_ORDER.map(function (id, i) {
      var a = answers[id];
      if (!a) return "";
      var text = cellAns(answers, id);
      return (
        '<div class="item"><strong>P' +
        (i + 1) +
        " · " +
        esc((qTitle(id).split(". ")[1] || id).slice(0, 48)) +
        "</strong>" +
        esc(text) +
        (a.at
          ? '<span style="display:block;margin-top:4px">' +
            esc(new Date(a.at).toLocaleString("pt-BR")) +
            "</span>"
          : "") +
        "</div>"
      );
    }).join("");

    var sec = secondaryFromMeta(L.meta);

    $("drawer-body").innerHTML =
      '<div class="drawer-section"><h4>Sessão</h4><dl class="kv">' +
      kv("Status", L.status) +
      kv("Início", L.started_at ? new Date(L.started_at).toLocaleString("pt-BR") : "—") +
      kv("Conclusão", L.completed_at ? new Date(L.completed_at).toLocaleString("pt-BR") : "—") +
      kv("Tempo", L.duration_seconds != null ? L.duration_seconds + "s" : "—") +
      kv("Passo máx. (0–9)", String(L.max_step_reached || 0)) +
      kv("Checkout", L.checkout ? "Sim" : "Não") +
      "</dl></div>" +
      '<div class="drawer-section"><h4>Ciclo amoroso</h4><dl class="kv">' +
      kv("Nome", L.name) +
      kv("Ciclo predominante", patternLabel(L.pattern_id, L.pattern_name)) +
      kv("Padrão secundário", sec ? patternLabel(sec, null) : "—") +
      "</dl></div>" +
      '<div class="drawer-section"><h4>Dispositivo & local</h4><dl class="kv">' +
      kv("Device", L.device_type) +
      kv("SO", L.os) +
      kv("Navegador", L.browser) +
      kv("País", L.country) +
      kv("Estado", L.region) +
      kv("Cidade", L.city) +
      "</dl></div>" +
      '<div class="drawer-section"><h4>Origem / UTM</h4><dl class="kv">' +
      kv("Source", L.utm_source) +
      kv("Medium", L.utm_medium) +
      kv("Campaign", L.utm_campaign) +
      kv("Content", L.utm_content) +
      "</dl></div>" +
      '<div class="drawer-section"><h4>Respostas (A–D)</h4><div class="answer-timeline">' +
      (timeline || '<p class="top-sub">Nenhuma resposta gravada.</p>') +
      "</div></div>";

    $("drawer").hidden = false;
    $("drawer-bg").hidden = false;
  }

  function kv(k, v) {
    return "<dt>" + esc(k) + "</dt><dd>" + esc(v || "—") + "</dd>";
  }

  function closeDrawer() {
    $("drawer").hidden = true;
    $("drawer-bg").hidden = true;
  }

  /** Enriquece answers da API: key A → texto da opção */
  function enrichAnswers(data) {
    var rows = data.answers || [];
    // Se vazio, monta a partir dos leads
    if (!rows.length && data.leads && data.leads.length) {
      var tally = {};
      data.leads.forEach(function (L) {
        var ans = L.answers || {};
        Q_ORDER.forEach(function (qid) {
          var a = ans[qid];
          if (!a) return;
          var key = a.key || (a.labels && a.labels[0]) || "";
          if (!key) return;
          var k = qid + "||" + key;
          tally[k] = (tally[k] || 0) + 1;
        });
      });
      rows = Object.keys(tally).map(function (k) {
        var p = k.split("||");
        return { question_id: p[0], option_label: p[1], times: tally[k] };
      });
      data.answers = rows;
    }

    rows.forEach(function (a) {
      if (a.option_label && a.option_label.length <= 2) {
        a.option_label = optionLabel(a.question_id, a.option_label);
      }
    });
    return data;
  }

  function renderAnswers(data, filter) {
    data = enrichAnswers(data);
    var rows = data.answers || [];
    var ids = {};
    rows.forEach(function (a) {
      if (a.question_id) ids[a.question_id] = true;
    });
    var order = Q_ORDER.filter(function (id) {
      return ids[id];
    });
    if ($("answer-q-filters")) {
      $("answer-q-filters").innerHTML =
        '<button type="button" class="chip' +
        (!filter || filter === "*" ? " is-active" : "") +
        '" data-aq="*">Todas</button>' +
        order
          .map(function (id) {
            return (
              '<button type="button" class="chip' +
              (filter === id ? " is-active" : "") +
              '" data-aq="' +
              esc(id) +
              '">P' +
              (Q_ORDER.indexOf(id) + 1) +
              "</button>"
            );
          })
          .join("");

      $("answer-q-filters").querySelectorAll("[data-aq]").forEach(function (btn) {
        btn.onclick = function () {
          renderAnswers(lastData, btn.getAttribute("data-aq"));
        };
      });
    }

    if (filter && filter !== "*") {
      rows = rows.filter(function (a) {
        return a.question_id === filter;
      });
    }
    if (!rows.length) {
      if ($("answers-list"))
        $("answers-list").innerHTML = '<p class="top-sub">Sem respostas no período. Faça o quiz e atualize.</p>';
      return;
    }

    if (!filter || filter === "*") {
      var byQ = {};
      rows.forEach(function (a) {
        if (!byQ[a.question_id]) byQ[a.question_id] = [];
        byQ[a.question_id].push(a);
      });
      $("answers-list").innerHTML = Q_ORDER.filter(function (id) {
        return byQ[id];
      })
        .map(function (id) {
          var list = byQ[id].sort(function (a, b) {
            return (b.times || 0) - (a.times || 0);
          });
          var max = list[0] ? list[0].times : 1;
          return (
            '<div class="answer-block"><h4>' +
            esc(qTitle(id)) +
            "</h4>" +
            list
              .map(function (a) {
                var w = max ? Math.round((a.times / max) * 100) : 0;
                return (
                  '<div class="answer-row"><div>' +
                  esc(a.option_label || "—") +
                  '<div class="abar"><i style="width:' +
                  w +
                  '%"></i></div></div><strong>' +
                  a.times +
                  "</strong></div>"
                );
              })
              .join("") +
            "</div>"
          );
        })
        .join("");
      return;
    }

    var list = rows.sort(function (a, b) {
      return (b.times || 0) - (a.times || 0);
    });
    var maxT = list[0] ? list[0].times : 1;
    $("answers-list").innerHTML =
      '<div class="answer-block"><h4>' +
      esc(qTitle(filter)) +
      "</h4>" +
      list
        .map(function (a) {
          var w = maxT ? Math.round((a.times / maxT) * 100) : 0;
          return (
            '<div class="answer-row"><div>' +
            esc(a.option_label || "—") +
            '<div class="abar"><i style="width:' +
            w +
            '%"></i></div></div><strong>' +
            a.times +
            "</strong></div>"
          );
        })
        .join("") +
      "</div>";
  }

  function renderPerf(data) {
    var t = data.totals || {};
    var started = t.started || 0;
    var completed = t.completed || 0;
    var checkouts = t.checkouts || 0;
    var purchases = t.purchases || 0;
    if ($("perf-kpis")) {
      $("perf-kpis").innerHTML =
        kpi("Conclusão quiz", (started ? Math.round((completed / started) * 1000) / 10 : 0) + "%") +
        kpi(
          "Checkout / resultado",
          (completed ? Math.round((checkouts / completed) * 1000) / 10 : 0) + "%",
          null,
          true
        ) +
        kpi("Compras", purchases) +
        kpi(
          "Tempo médio",
          t.avg_duration_sec != null ? Math.round(t.avg_duration_sec / 60) + " min" : "—"
        );
    }

    var rows = (data.patterns || []).map(function (r) {
      return {
        pattern_id: r.pattern_id,
        pattern_name: patternLabel(r.pattern_id, r.pattern_name),
        sessions: r.sessions || 0,
      };
    });
    // Completa A–D com zero se faltar
    ["A", "B", "C", "D"].forEach(function (id) {
      if (!rows.some(function (r) { return r.pattern_id === id; })) {
        rows.push({ pattern_id: id, pattern_name: PATTERN_NAMES[id], sessions: 0 });
      }
    });
    rows.sort(function (a, b) {
      return b.sessions - a.sessions;
    });

    destroy("patterns");
    if (typeof Chart !== "undefined" && $("chart-patterns") && rows.some(function (r) { return r.sessions > 0; })) {
      charts.patterns = new Chart($("chart-patterns"), {
        type: "doughnut",
        data: {
          labels: rows.map(function (r) {
            return r.pattern_name;
          }),
          datasets: [
            {
              data: rows.map(function (r) {
                return r.sessions;
              }),
              backgroundColor: rows.map(function (r) {
                return PATTERN_COLORS[r.pattern_id] || "#6b7289";
              }),
              borderWidth: 0,
            },
          ],
        },
        options: {
          plugins: {
            legend: { position: "bottom", labels: { color: "#8b95a8", font: { family: "DM Sans", size: 11 } } },
          },
        },
      });
    }
    if ($("patterns-list")) {
      $("patterns-list").innerHTML =
        rows
          .map(function (r) {
            return (
              '<div class="row-line"><span>' +
              esc(r.pattern_name) +
              ' <em style="opacity:.6;font-size:11px">(' +
              esc(r.pattern_id) +
              ")</em></span><strong>" +
              r.sessions +
              "</strong></div>"
            );
          })
          .join("") || '<p class="top-sub">Sem ciclos ainda.</p>';
    }

    var leads = data.leads || [];
    var byDev = {};
    var byUtm = {};
    leads.forEach(function (L) {
      var d = L.device_type || "unknown";
      byDev[d] = byDev[d] || { n: 0, co: 0, done: 0 };
      byDev[d].n++;
      if (L.checkout) byDev[d].co++;
      if (L.pattern_id) byDev[d].done++;
      var u = L.utm_source || "(direct)";
      byUtm[u] = byUtm[u] || { n: 0, co: 0 };
      byUtm[u].n++;
      if (L.checkout) byUtm[u].co++;
    });
    var html =
      '<h4 style="margin:0 0 8px;color:#8b95a8;font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase">Dispositivo</h4>';
    Object.keys(byDev).forEach(function (k) {
      var x = byDev[k];
      html +=
        '<div class="row-line"><span>' +
        esc(k) +
        " (" +
        x.n +
        ")</span><strong>" +
        (x.n ? Math.round((x.co / x.n) * 1000) / 10 : 0) +
        "% co</strong></div>";
    });
    html +=
      '<h4 style="margin:16px 0 8px;color:#8b95a8;font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase">UTM Source</h4>';
    Object.keys(byUtm)
      .slice(0, 12)
      .forEach(function (k) {
        var x = byUtm[k];
        html +=
          '<div class="row-line"><span>' +
          esc(k) +
          " (" +
          x.n +
          ")</span><strong>" +
          (x.n ? Math.round((x.co / x.n) * 1000) / 10 : 0) +
          "% co</strong></div>";
      });
    if ($("perf-breakdown"))
      $("perf-breakdown").innerHTML = html || '<p class="top-sub">Sem dados.</p>';
  }

  function exportCsv() {
    var leads = filteredLeads.length ? filteredLeads : (lastData && lastData.leads) || [];
    if (!leads.length) {
      alert("Nenhum lead para exportar.");
      return;
    }
    var headers = [
      "lead_id",
      "started_at",
      "completed_at",
      "status",
      "duration_seconds",
      "name",
      "device",
      "os",
      "browser",
      "country",
      "region",
      "city",
      "utm_source",
      "utm_medium",
      "utm_campaign",
    ]
      .concat(
        Q_ORDER.map(function (id, i) {
          return "P" + (i + 1) + "_key";
        })
      )
      .concat(["ciclo", "secundario", "checkout"]);

    var lines = [headers.join(",")];
    leads.forEach(function (L) {
      var row = [
        L.lead_id,
        L.started_at,
        L.completed_at,
        L.status,
        L.duration_seconds,
        L.name,
        L.device_type,
        L.os,
        L.browser,
        L.country,
        L.region,
        L.city,
        L.utm_source,
        L.utm_medium,
        L.utm_campaign,
      ];
      Q_ORDER.forEach(function (id) {
        var a = (L.answers || {})[id];
        row.push(a && a.key ? a.key : cellAns(L.answers, id));
      });
      var sec = secondaryFromMeta(L.meta);
      row.push(patternLabel(L.pattern_id, L.pattern_name));
      row.push(sec ? patternLabel(sec, null) : "");
      row.push(L.checkout ? "yes" : "no");
      lines.push(
        row
          .map(function (c) {
            var s = c == null ? "" : String(c);
            if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
            return s;
          })
          .join(",")
      );
    });
    var blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mapa-ciclo-leads-" + ymd(new Date()) + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function applyAll(data) {
    lastData = enrichAnswers(data);
    renderKpis(lastData);
    renderFunnel(lastData);
    renderCharts(lastData);
    applyLeadFilters();
    renderAnswers(lastData, "*");
    renderPerf(lastData);
    if ($("status-line")) {
      $("status-line").textContent =
        ($("date-from") && $("date-from").value) +
        " → " +
        ($("date-to") && $("date-to").value) +
        " · " +
        ((lastData.leads && lastData.leads.length) || 0) +
        " leads · Ciclo Amoroso · " +
        new Date().toLocaleTimeString("pt-BR");
    }
  }

  async function load() {
    if ($("status-line")) $("status-line").textContent = "Carregando…";
    try {
      var data = await fetchAnalytics();
      applyAll(data);
    } catch (e) {
      if ($("status-line")) $("status-line").textContent = "Erro: " + (e.message || e);
    }
  }

  function setView(name) {
    document.querySelectorAll(".view").forEach(function (v) {
      v.classList.toggle("is-active", v.id === "view-" + name);
    });
    document.querySelectorAll(".nav-item").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-view") === name);
    });
    var titles = {
      funnel: "Funil do Ciclo Amoroso",
      table: "Esteira de leads (9 perguntas)",
      answers: "Respostas A–D",
      perf: "Ciclos & performance",
    };
    if ($("view-title")) $("view-title").textContent = titles[name] || "Painel";
  }

  function applyAllSafe(data) {
    try {
      applyAll(data);
    } catch (e) {
      console.error("applyAll", e);
      if ($("status-line")) {
        $("status-line").textContent = "Dados carregados com aviso: " + (e.message || e);
      }
    }
  }

  window.__adminRender = applyAllSafe;
  window.__adminLoad = load;

  if ($("btn-refresh")) $("btn-refresh").onclick = load;
  if ($("btn-logout")) {
    $("btn-logout").onclick = function () {
      clearPass();
      var login = $("login-screen");
      var app = $("app");
      if (login) {
        login.hidden = false;
        login.style.display = "";
      }
      if (app) {
        app.hidden = true;
        app.style.display = "none";
      }
    };
  }
  if ($("btn-export")) $("btn-export").onclick = exportCsv;
  if ($("drawer-close")) $("drawer-close").onclick = closeDrawer;
  if ($("drawer-bg")) $("drawer-bg").onclick = closeDrawer;

  document.querySelectorAll(".nav-item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setView(btn.getAttribute("data-view"));
    });
  });
  document.querySelectorAll("[data-range]").forEach(function (btn) {
    btn.onclick = function () {
      document.querySelectorAll("[data-range]").forEach(function (b) {
        b.classList.remove("is-active");
      });
      btn.classList.add("is-active");
      var r = btn.getAttribute("data-range");
      setDates(r === "today" ? 1 : Number(r) || 7);
      if (getPass()) load();
    };
  });

  ["table-search", "filter-device", "filter-status", "filter-checkout", "filter-pattern"].forEach(
    function (id) {
      var node = $(id);
      if (!node) return;
      node.addEventListener("input", applyLeadFilters);
      node.addEventListener("change", applyLeadFilters);
    }
  );

  try {
    setDates(7);
  } catch (e) {
    console.warn(e);
  }
})();
