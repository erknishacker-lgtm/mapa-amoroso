/**
 * Quiz Intelligence — dashboard Enlead-style
 */
(function () {
  var PASS_KEY = "mapa_admin_pass";
  var Q_ORDER = ["q1", "q2", "q3", "q4m", "q5", "q6", "q7", "q8m", "q9", "q10", "q11m", "q12"];
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
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  }

  function setDates(days) {
    var to = new Date();
    var from = new Date();
    from.setDate(from.getDate() - (days - 1));
    $("date-to").value = ymd(to);
    $("date-from").value = ymd(from);
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

  function qTitle(id) {
    var qs = (window.MAPA_DATA && window.MAPA_DATA.questions) || [];
    for (var i = 0; i < qs.length; i++) {
      if (qs[i].id === id) return i + 1 + ". " + (qs[i].text || id).slice(0, 56);
    }
    var idx = Q_ORDER.indexOf(id);
    return (idx >= 0 ? idx + 1 + ". " : "") + id;
  }

  async function fetchAnalytics(password) {
    var c = cfg();
    var url = (c.supabaseUrl || "").replace(/\/$/, "");
    var key = c.supabaseAnonKey || "";
    if (!url || !key) throw new Error("Config Supabase ausente.");
    var pass = password || getPass();
    if (!pass) throw new Error("Senha não informada.");

    var from = $("date-from").value || "2020-01-01";
    var to = $("date-to").value || ymd(new Date());

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
      if (/UNAUTHORIZED|42501/i.test(text)) throw new Error("Senha incorreta. Rode supabase/fix_admin.sql se ainda não rodou.");
      if (/PGRST202|function/i.test(text)) throw new Error("Função admin_analytics ausente. Rode fix_admin.sql no Supabase.");
      if (/quiz_leads|PGRST205/i.test(text)) throw new Error("Tabela quiz_leads ausente. Rode schema.sql + fix_admin.sql.");
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

  /* ---------- RENDER ---------- */
  function renderKpis(data) {
    var t = data.totals || {};
    var leads = t.leads || 0;
    var started = t.started || 0;
    var completed = t.completed || 0;
    var checkouts = t.checkouts || 0;
    var cRate = started ? Math.round((completed / started) * 1000) / 10 : 0;
    var pRate = completed ? Math.round((checkouts / completed) * 1000) / 10 : 0;
    var avg = t.avg_duration_sec;
    var avgL = avg != null ? Math.round(avg / 60) + " min" : "—";

    $("kpis").innerHTML =
      kpi("Visitantes / leads", leads) +
      kpi("Iniciaram quiz", started) +
      kpi("Chegaram ao resultado", completed, cRate + "% dos inícios") +
      kpi("Checkout", checkouts, pRate + "% do resultado", true) +
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

  function renderFunnel(data) {
    var steps = data.step_funnel || [];
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
      var rate = Number(s.pass_rate || 0);
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

    // insights
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
        "Taxa de conclusão do quiz: <strong>" +
          (t.started ? Math.round((t.completed / t.started) * 1000) / 10 : 0) +
          "%</strong>."
      );
    }
    if (t.completed && t.checkouts != null) {
      insights.push(
        "Do resultado ao checkout: <strong>" +
          (t.completed ? Math.round((t.checkouts / t.completed) * 1000) / 10 : 0) +
          "%</strong>."
      );
    }
    if (!insights.length) insights.push("Aguardando mais tráfego para calcular gargalos.");
    $("insight-list").innerHTML = insights.map(function (x) {
      return "<li>" + x + "</li>";
    }).join("");
  }

  function renderCharts(data) {
    if (typeof Chart === "undefined") return;
    var days = data.by_day || [];
    destroy("day");
    charts.day = new Chart($("chart-day"), {
      type: "bar",
      data: {
        labels: days.map(function (d) {
          return d.day;
        }),
        datasets: [
          { label: "Leads", data: days.map(function (d) { return d.leads || 0; }), backgroundColor: "rgba(124,92,255,0.65)", borderRadius: 6 },
          { label: "Inícios", data: days.map(function (d) { return d.starts || 0; }), backgroundColor: "rgba(56,189,248,0.55)", borderRadius: 6 },
          { label: "Resultado", data: days.map(function (d) { return d.results || 0; }), backgroundColor: "rgba(52,211,153,0.55)", borderRadius: 6 },
          { label: "Checkout", data: days.map(function (d) { return d.checkouts || 0; }), backgroundColor: "rgba(255,77,109,0.7)", borderRadius: 6 },
        ],
      },
      options: chartOpts(true),
    });

    var map = {};
    for (var h = 0; h < 24; h++) map[h] = { leads: 0, starts: 0, results: 0, checkouts: 0 };
    (data.by_hour || []).forEach(function (r) {
      var hour = Number(r.hour);
      if (map[hour]) map[hour] = { leads: r.leads || 0, starts: r.starts || 0, results: r.results || 0, checkouts: r.checkouts || 0 };
    });
    var labels = [], L = [], S = [], R = [], C = [];
    for (var i = 0; i < 24; i++) {
      labels.push(String(i).padStart(2, "0") + "h");
      L.push(map[i].leads);
      S.push(map[i].starts);
      R.push(map[i].results);
      C.push(map[i].checkouts);
    }
    destroy("hour");
    charts.hour = new Chart($("chart-hour"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          { label: "Leads", data: L, borderColor: "#7c5cff", tension: 0.35, fill: false },
          { label: "Inícios", data: S, borderColor: "#38bdf8", tension: 0.35, fill: false },
          { label: "Resultado", data: R, borderColor: "#34d399", tension: 0.35, fill: false },
          { label: "Checkout", data: C, borderColor: "#ff4d6d", tension: 0.35, fill: false },
        ],
      },
      options: chartOpts(true),
    });
  }

  function cellAns(answers, qid) {
    if (!answers || !answers[qid]) return "";
    var a = answers[qid];
    if (a.labels && a.labels.length) return a.labels.join(" · ");
    return "";
  }

  function applyLeadFilters() {
    var leads = (lastData && lastData.leads) || [];
    var q = (($("table-search") && $("table-search").value) || "").toLowerCase();
    var device = ($("filter-device") && $("filter-device").value) || "";
    var status = ($("filter-status") && $("filter-status").value) || "";
    var co = ($("filter-checkout") && $("filter-checkout").value) || "";

    filteredLeads = leads.filter(function (L) {
      if (device && (L.device_type || "") !== device) return false;
      if (status && (L.status || "") !== status) return false;
      if (co === "yes" && !L.checkout) return false;
      if (co === "no" && L.checkout) return false;
      if (q) {
        var blob = [
          L.lead_id,
          L.utm_source,
          L.utm_campaign,
          L.pattern_name,
          L.pattern_id,
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
      "<tr><th class=\"sticky\">Lead</th><th>Início</th><th>Status</th><th>Device</th><th>Local</th><th>UTM</th>" +
      Q_ORDER.map(function (id, i) {
        return "<th title=\"" + esc(qTitle(id)) + "\">P" + (i + 1) + "</th>";
      }).join("") +
      "<th>Padrão</th><th>Checkout</th><th>Tempo</th></tr>";
    $("leads-sheet").querySelector("thead").innerHTML = head;
    var tbody = $("leads-sheet").querySelector("tbody");
    if (!leads.length) {
      tbody.innerHTML = '<tr><td colspan="22" style="color:#8b95a8;padding:24px">Nenhum lead neste filtro. Teste o quiz e atualize.</td></tr>';
      return;
    }
    tbody.innerHTML = leads
      .map(function (L, idx) {
        var short = (L.lead_id || "").slice(0, 8);
        var when = L.started_at ? new Date(L.started_at).toLocaleString("pt-BR", { hour12: false }) : "—";
        var st = L.status || "—";
        var pill =
          st === "checkout" ? "pill-ok" : st === "completed" ? "pill-mid" : "pill-out";
        var loc = [L.city, L.region, L.country].filter(Boolean).join(", ") || "—";
        var utm = [L.utm_source, L.utm_campaign].filter(Boolean).join(" / ") || "—";
        var device = [L.device_type, L.os].filter(Boolean).join(" · ") || "—";
        var answers = L.answers || {};
        var qCells = Q_ORDER.map(function (id) {
          var v = cellAns(answers, id);
          return v
            ? "<td title=\"" + esc(v) + "\">" + esc(v.length > 36 ? v.slice(0, 36) + "…" : v) + "</td>"
            : '<td class="empty">—</td>';
        }).join("");
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
          esc(device) +
          "</td><td>" +
          esc(loc) +
          "</td><td>" +
          esc(utm) +
          "</td>" +
          qCells +
          "<td>" +
          esc(L.pattern_name || L.pattern_id || "—") +
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
      return (
        '<div class="item"><strong>P' +
        (i + 1) +
        " · " +
        esc((qTitle(id).split(". ")[1] || id).slice(0, 40)) +
        "</strong>" +
        esc((a.labels || []).join(" · ")) +
        (a.at
          ? '<span style="display:block;margin-top:4px">' +
            esc(new Date(a.at).toLocaleString("pt-BR")) +
            "</span>"
          : "") +
        "</div>"
      );
    }).join("");

    $("drawer-body").innerHTML =
      '<div class="drawer-section"><h4>Sessão</h4><dl class="kv">' +
      kv("Status", L.status) +
      kv("Início", L.started_at ? new Date(L.started_at).toLocaleString("pt-BR") : "—") +
      kv("Conclusão", L.completed_at ? new Date(L.completed_at).toLocaleString("pt-BR") : "—") +
      kv("Tempo", L.duration_seconds != null ? L.duration_seconds + "s" : "—") +
      kv("Passo máx.", String(L.max_step_reached || 0)) +
      kv("Checkout", L.checkout ? "Sim" : "Não") +
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
      kv("Nome", L.name) +
      kv("Signo", L.sign) +
      kv("Padrão", L.pattern_name || L.pattern_id) +
      "</dl></div>" +
      '<div class="drawer-section"><h4>Respostas na esteira</h4><div class="answer-timeline">' +
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

  function renderAnswers(data, filter) {
    var rows = data.answers || [];
    var ids = {};
    rows.forEach(function (a) {
      if (a.question_id) ids[a.question_id] = true;
    });
    var order = Q_ORDER.filter(function (id) {
      return ids[id];
    });
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

    if (filter && filter !== "*") {
      rows = rows.filter(function (a) {
        return a.question_id === filter;
      });
    }
    if (!rows.length) {
      $("answers-list").innerHTML = '<p class="top-sub">Sem respostas no período.</p>';
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
    $("perf-kpis").innerHTML =
      kpi("Taxa de conclusão", (started ? Math.round((completed / started) * 1000) / 10 : 0) + "%") +
      kpi("Taxa checkout", (completed ? Math.round((checkouts / completed) * 1000) / 10 : 0) + "%", null, true) +
      kpi("Tempo médio", t.avg_duration_sec != null ? Math.round(t.avg_duration_sec / 60) + " min" : "—");

    var rows = data.patterns || [];
    destroy("patterns");
    if (typeof Chart !== "undefined" && rows.length) {
      charts.patterns = new Chart($("chart-patterns"), {
        type: "doughnut",
        data: {
          labels: rows.map(function (r) {
            return r.pattern_name || r.pattern_id;
          }),
          datasets: [
            {
              data: rows.map(function (r) {
                return r.sessions || 0;
              }),
              backgroundColor: ["#ff4d6d", "#7c5cff", "#38bdf8", "#34d399", "#fbbf24"],
              borderWidth: 0,
            },
          ],
        },
        options: {
          plugins: { legend: { position: "bottom", labels: { color: "#8b95a8" } } },
        },
      });
    }
    $("patterns-list").innerHTML = rows
      .map(function (r) {
        return (
          '<div class="row-line"><span>' +
          esc(r.pattern_name || r.pattern_id) +
          "</span><strong>" +
          r.sessions +
          "</strong></div>"
        );
      })
      .join("") || '<p class="top-sub">Sem padrões.</p>';

    // breakdown device / utm from leads
    var leads = data.leads || [];
    var byDev = {};
    var byUtm = {};
    leads.forEach(function (L) {
      var d = L.device_type || "unknown";
      byDev[d] = byDev[d] || { n: 0, co: 0 };
      byDev[d].n++;
      if (L.checkout) byDev[d].co++;
      var u = L.utm_source || "(direct)";
      byUtm[u] = byUtm[u] || { n: 0, co: 0 };
      byUtm[u].n++;
      if (L.checkout) byUtm[u].co++;
    });
    var html = "<h4 style=\"margin:0 0 8px;color:#8b95a8;font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase\">Dispositivo</h4>";
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
    html += "<h4 style=\"margin:16px 0 8px;color:#8b95a8;font-size:0.75rem;letter-spacing:0.08em;text-transform:uppercase\">UTM Source</h4>";
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
      "sign",
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
          return "P" + (i + 1);
        })
      )
      .concat(["pattern", "checkout"]);

    var lines = [headers.join(",")];
    leads.forEach(function (L) {
      var row = [
        L.lead_id,
        L.started_at,
        L.completed_at,
        L.status,
        L.duration_seconds,
        L.name,
        L.sign,
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
        row.push(cellAns(L.answers, id));
      });
      row.push(L.pattern_name || L.pattern_id || "");
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
    a.download = "mapa-leads-" + ymd(new Date()) + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function applyAll(data) {
    lastData = data;
    renderKpis(data);
    renderFunnel(data);
    renderCharts(data);
    applyLeadFilters();
    renderAnswers(data, "*");
    renderPerf(data);
    $("status-line").textContent =
      $("date-from").value +
      " → " +
      $("date-to").value +
      " · " +
      ((data.leads && data.leads.length) || 0) +
      " leads · atualizado " +
      new Date().toLocaleTimeString("pt-BR");
  }

  async function load() {
    $("status-line").textContent = "Carregando…";
    try {
      var data = await fetchAnalytics();
      applyAll(data);
    } catch (e) {
      $("status-line").textContent = "Erro: " + (e.message || e);
    }
  }

  function showApp() {
    $("login-screen").hidden = true;
    $("app").hidden = false;
  }
  function showLogin(msg) {
    $("login-screen").hidden = false;
    $("app").hidden = true;
    var err = $("login-error");
    if (msg) {
      err.hidden = false;
      err.textContent = msg;
    } else {
      err.hidden = true;
    }
  }

  function setView(name) {
    document.querySelectorAll(".view").forEach(function (v) {
      v.classList.toggle("is-active", v.id === "view-" + name);
    });
    document.querySelectorAll(".nav-item, .mobile-nav .nav-item").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-view") === name);
    });
    var titles = {
      funnel: "Funil do quiz",
      table: "Esteira de leads",
      answers: "Respostas",
      perf: "Performance",
    };
    if ($("view-title")) $("view-title").textContent = titles[name] || "Painel";
  }

  // Login é feito no HTML (form). Aqui só render + toolbar.
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

  ["table-search", "filter-device", "filter-status", "filter-checkout"].forEach(function (id) {
    var node = $(id);
    if (!node) return;
    node.addEventListener("input", applyLeadFilters);
    node.addEventListener("change", applyLeadFilters);
  });

  try {
    setDates(7);
  } catch (e) {
    console.warn(e);
  }
})();
