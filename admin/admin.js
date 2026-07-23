(function () {
  var PASS_KEY = "mapa_admin_pass";
  var charts = {};
  var lastData = null;
  var Q_ORDER = ["q1", "q2", "q3", "q4m", "q5", "q6", "q7", "q8m", "q9", "q10", "q11m", "q12"];

  var el = {
    login: document.getElementById("login-screen"),
    dash: document.getElementById("dash"),
    pass: document.getElementById("admin-password"),
    loginBtn: document.getElementById("btn-login"),
    loginErr: document.getElementById("login-error"),
    from: document.getElementById("date-from"),
    to: document.getElementById("date-to"),
    refresh: document.getElementById("btn-refresh"),
    logout: document.getElementById("btn-logout"),
    status: document.getElementById("status-line"),
    kpis: document.getElementById("kpis"),
    stepGrid: document.getElementById("step-grid"),
    answers: document.getElementById("answers-list"),
    answerFilters: document.getElementById("answer-q-filters"),
    sheetHead: document.querySelector("#leads-sheet thead"),
    sheetBody: document.querySelector("#leads-sheet tbody"),
    patterns: document.getElementById("patterns-list"),
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

  function setDefaultDates(days) {
    var to = new Date();
    var from = new Date();
    from.setDate(from.getDate() - (days - 1));
    el.to.value = ymd(to);
    el.from.value = ymd(from);
  }

  function getPassword() {
    return sessionStorage.getItem(PASS_KEY) || "";
  }
  function setPassword(p) {
    sessionStorage.setItem(PASS_KEY, p);
  }
  function clearPassword() {
    sessionStorage.removeItem(PASS_KEY);
  }

  function qMeta(id) {
    var qs = (window.MAPA_DATA && window.MAPA_DATA.questions) || [];
    for (var i = 0; i < qs.length; i++) {
      if (qs[i].id === id) return { index: i, text: qs[i].text, axis: qs[i].axis };
    }
    return { index: Q_ORDER.indexOf(id), text: id, axis: "" };
  }

  function qTitle(id) {
    var m = qMeta(id);
    var n = m.index >= 0 ? m.index + 1 : "?";
    var t = (m.text || id || "").slice(0, 48);
    return n + ". " + t;
  }

  async function fetchAnalytics() {
    var c = cfg();
    var url = (c.supabaseUrl || "").replace(/\/$/, "");
    var key = c.supabaseAnonKey || "";
    if (!url || !key) throw new Error("Configure config.js (URL + chave Supabase).");
    var password = getPassword();
    if (!password) throw new Error("Senha não informada.");

    var res = await fetch(url + "/rest/v1/rpc/admin_analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: "Bearer " + key,
      },
      body: JSON.stringify({
        p_password: password,
        p_from: el.from.value + "T00:00:00-03:00",
        p_to: el.to.value + "T23:59:59.999-03:00",
      }),
    });

    if (!res.ok) {
      var t = await res.text();
      if (res.status === 401 || /UNAUTHORIZED|42501/i.test(t)) {
        throw new Error("Senha incorreta ou função admin_analytics desatualizada.");
      }
      if (/Could not find the function|PGRST202/i.test(t)) {
        throw new Error("Rode o schema.sql novo no Supabase (função admin_analytics).");
      }
      if (/quiz_leads|PGRST205/i.test(t)) {
        throw new Error("Tabela quiz_leads não existe. Rode supabase/schema.sql no SQL Editor.");
      }
      throw new Error("Erro " + res.status + ": " + t.slice(0, 200));
    }
    return res.json();
  }

  function destroy(id) {
    if (charts[id]) {
      charts[id].destroy();
      delete charts[id];
    }
  }

  function chartBase(legend) {
    return {
      responsive: true,
      plugins: {
        legend: {
          display: !!legend,
          labels: { color: "#5c564f", boxWidth: 12 },
        },
      },
      scales: {
        x: {
          ticks: { color: "#5c564f", maxRotation: 0 },
          grid: { color: "rgba(232,223,212,0.8)" },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#5c564f", precision: 0 },
          grid: { color: "rgba(232,223,212,0.8)" },
        },
      },
    };
  }

  function renderKpis(data) {
    var t = data.totals || {};
    var leads = t.leads || 0;
    var started = t.started || 0;
    var completed = t.completed || 0;
    var checkouts = t.checkouts || 0;
    var cRate = started ? Math.round((completed / started) * 1000) / 10 : 0;
    var pRate = completed ? Math.round((checkouts / completed) * 1000) / 10 : 0;
    var avg = t.avg_duration_sec;
    var avgLabel = avg != null ? Math.round(avg / 60) + " min" : "—";

    el.kpis.innerHTML =
      kpi("Leads", leads) +
      kpi("Começaram", started) +
      kpi("Terminaram", completed, cRate + "% dos que começaram", cRate < 40) +
      kpi("Checkout", checkouts, pRate + "% dos que terminaram", true) +
      kpi("Tempo médio", avgLabel);
  }

  function kpi(label, value, note, hot) {
    return (
      '<div class="kpi' +
      (hot ? " is-hot" : "") +
      '"><span>' +
      esc(label) +
      "</span><strong>" +
      esc(String(value)) +
      "</strong>" +
      (note ? "<em>" + esc(note) + "</em>" : "") +
      "</div>"
    );
  }

  function renderSteps(data) {
    var steps = data.step_funnel || [];
    var html = "";
    var prevRate = null;
    var worstDrop = -1;
    var worstKey = null;

    steps.forEach(function (s, i) {
      if (i === 0) return;
      var prev = steps[i - 1];
      var drop = Number(prev.pass_rate || 0) - Number(s.pass_rate || 0);
      if (drop > worstDrop) {
        worstDrop = drop;
        worstKey = s.step_key;
      }
    });

    steps.forEach(function (s) {
      var rate = Number(s.pass_rate || 0);
      var isDrop = s.step_key === worstKey && worstDrop >= 8;
      html +=
        '<div class="step-card' +
        (isDrop ? " is-drop" : "") +
        '"><div class="step-label">' +
        esc(s.label) +
        '</div><div class="step-pct">' +
        rate +
        '%</div><div class="step-n">' +
        esc(String(s.reached || 0)) +
        " pessoas</div></div>";
      prevRate = rate;
    });
    el.stepGrid.innerHTML = html || '<p class="muted">Sem dados ainda.</p>';

    destroy("funnel");
    if (typeof Chart !== "undefined" && steps.length) {
      charts.funnel = new Chart(document.getElementById("chart-funnel"), {
        type: "bar",
        data: {
          labels: steps.map(function (s) {
            return s.label;
          }),
          datasets: [
            {
              label: "% do total de leads",
              data: steps.map(function (s) {
                return Number(s.pass_rate || 0);
              }),
              backgroundColor: steps.map(function (s) {
                return s.step_key === worstKey ? "rgba(192,57,43,0.9)" : "rgba(192,57,43,0.55)";
              }),
              borderRadius: 8,
            },
          ],
        },
        options: chartBase(false),
      });
    }
  }

  function renderDayHour(data) {
    var days = data.by_day || [];
    destroy("day");
    if (typeof Chart !== "undefined") {
      charts.day = new Chart(document.getElementById("chart-day"), {
        type: "bar",
        data: {
          labels: days.map(function (d) {
            return d.day;
          }),
          datasets: [
            {
              label: "Leads",
              data: days.map(function (d) {
                return d.leads || 0;
              }),
              backgroundColor: "rgba(29,78,216,0.55)",
              borderRadius: 4,
            },
            {
              label: "Inícios",
              data: days.map(function (d) {
                return d.starts || 0;
              }),
              backgroundColor: "rgba(21,128,61,0.55)",
              borderRadius: 4,
            },
            {
              label: "Resultados",
              data: days.map(function (d) {
                return d.results || 0;
              }),
              backgroundColor: "rgba(180,83,9,0.55)",
              borderRadius: 4,
            },
            {
              label: "Checkout",
              data: days.map(function (d) {
                return d.checkouts || 0;
              }),
              backgroundColor: "rgba(192,57,43,0.75)",
              borderRadius: 4,
            },
          ],
        },
        options: chartBase(true),
      });
    }

    var map = {};
    for (var h = 0; h < 24; h++) map[h] = { leads: 0, starts: 0, results: 0, checkouts: 0 };
    (data.by_hour || []).forEach(function (r) {
      var hour = Number(r.hour);
      if (map[hour]) {
        map[hour] = {
          leads: r.leads || 0,
          starts: r.starts || 0,
          results: r.results || 0,
          checkouts: r.checkouts || 0,
        };
      }
    });
    var labels = [];
    var leads = [],
      starts = [],
      results = [],
      checkouts = [];
    for (var i = 0; i < 24; i++) {
      labels.push(String(i).padStart(2, "0") + "h");
      leads.push(map[i].leads);
      starts.push(map[i].starts);
      results.push(map[i].results);
      checkouts.push(map[i].checkouts);
    }

    destroy("hour");
    if (typeof Chart !== "undefined") {
      charts.hour = new Chart(document.getElementById("chart-hour"), {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Leads",
              data: leads,
              borderColor: "#1d4ed8",
              tension: 0.3,
              fill: false,
            },
            {
              label: "Inícios",
              data: starts,
              borderColor: "#15803d",
              tension: 0.3,
              fill: false,
            },
            {
              label: "Resultados",
              data: results,
              borderColor: "#b45309",
              tension: 0.3,
              fill: false,
            },
            {
              label: "Checkout",
              data: checkouts,
              borderColor: "#c0392b",
              tension: 0.3,
              fill: false,
            },
          ],
        },
        options: chartBase(true),
      });
    }
  }

  function renderAnswerFilters(data) {
    var ids = {};
    (data.answers || []).forEach(function (a) {
      if (a.question_id) ids[a.question_id] = true;
    });
    var order = Q_ORDER.filter(function (id) {
      return ids[id];
    });
    var html =
      '<button type="button" class="chip is-active" data-aq="*">Todas</button>';
    order.forEach(function (id) {
      html +=
        '<button type="button" class="chip" data-aq="' +
        esc(id) +
        '">P' +
        (Q_ORDER.indexOf(id) + 1) +
        "</button>";
    });
    el.answerFilters.innerHTML = html;
    el.answerFilters.querySelectorAll("[data-aq]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        el.answerFilters.querySelectorAll(".chip").forEach(function (c) {
          c.classList.remove("is-active");
        });
        btn.classList.add("is-active");
        renderAnswers(lastData, btn.getAttribute("data-aq"));
      });
    });
  }

  function renderAnswers(data, filter) {
    var rows = data.answers || [];
    if (filter && filter !== "*") {
      rows = rows.filter(function (a) {
        return a.question_id === filter;
      });
    }
    if (!rows.length) {
      el.answers.innerHTML = '<p class="muted">Nenhuma resposta no período.</p>';
      return;
    }

    if (!filter || filter === "*") {
      var flat = rows.slice().sort(function (a, b) {
        return (b.times || 0) - (a.times || 0);
      });
      var max = flat[0] ? flat[0].times : 1;
      var html = '<div class="answer-block"><h3>Top marcações (todas as perguntas)</h3>';
      flat.slice(0, 20).forEach(function (a) {
        var w = max ? Math.round((a.times / max) * 100) : 0;
        html +=
          '<div class="answer-row"><div><strong>' +
          esc(a.option_label || "—") +
          '</strong><div class="muted" style="font-size:0.78rem">' +
          esc(qTitle(a.question_id)) +
          '</div><div class="answer-bar"><i style="width:' +
          w +
          '%"></i></div></div><strong>' +
          a.times +
          "</strong></div>";
      });
      html += "</div>";
      el.answers.innerHTML = html;
      return;
    }

    var list = rows.sort(function (a, b) {
      return (b.times || 0) - (a.times || 0);
    });
    var maxT = list[0] ? list[0].times : 1;
    var block = '<div class="answer-block"><h3>' + esc(qTitle(filter)) + "</h3>";
    list.forEach(function (a) {
      var w = maxT ? Math.round((a.times / maxT) * 100) : 0;
      block +=
        '<div class="answer-row"><div>' +
        esc(a.option_label || "—") +
        '<div class="answer-bar"><i style="width:' +
        w +
        '%"></i></div></div><strong>' +
        a.times +
        "</strong></div>";
    });
    block += "</div>";
    el.answers.innerHTML = block;
  }

  function cellAnswer(answers, qid) {
    if (!answers || !answers[qid]) return "";
    var a = answers[qid];
    if (a.labels && a.labels.length) return a.labels.join(" · ");
    return "";
  }

  function renderSheet(data) {
    var leads = data.leads || [];
    var head =
      "<tr>" +
      '<th class="sticky-col">Lead</th>' +
      "<th>Início</th>" +
      "<th>Status</th>" +
      "<th>Dispositivo</th>" +
      "<th>Local</th>" +
      "<th>UTM</th>" +
      Q_ORDER.map(function (id, i) {
        return "<th>P" + (i + 1) + "</th>";
      }).join("") +
      "<th>Padrão</th>" +
      "<th>Checkout</th>" +
      "<th>Tempo</th>" +
      "</tr>";
    el.sheetHead.innerHTML = head;

    if (!leads.length) {
      el.sheetBody.innerHTML =
        '<tr><td colspan="20" class="muted">Nenhum lead no período. Faça um teste no quiz após rodar o schema novo.</td></tr>';
      return;
    }

    el.sheetBody.innerHTML = leads
      .map(function (L) {
        var shortId = (L.lead_id || "").slice(0, 8);
        var when = L.started_at
          ? new Date(L.started_at).toLocaleString("pt-BR", { hour12: false })
          : "—";
        var status = L.status || "—";
        var badge =
          status === "checkout"
            ? "badge-ok"
            : status === "completed"
              ? "badge-mid"
              : "badge-out";
        var loc = [L.city, L.region, L.country].filter(Boolean).join(", ") || "—";
        var utm = [L.utm_source, L.utm_campaign].filter(Boolean).join(" / ") || "—";
        var device = [L.device_type, L.os, L.browser].filter(Boolean).join(" · ") || "—";
        var answers = L.answers || {};
        var qCells = Q_ORDER.map(function (id) {
          var v = cellAnswer(answers, id);
          return v
            ? "<td title=\"" + esc(v) + "\">" + esc(v.slice(0, 40)) + (v.length > 40 ? "…" : "") + "</td>"
            : '<td class="empty">—</td>';
        }).join("");
        var dur =
          L.duration_seconds != null
            ? Math.round(L.duration_seconds / 60) + "m " + (L.duration_seconds % 60) + "s"
            : "—";
        return (
          "<tr>" +
          '<td class="sticky-col" title="' +
          esc(L.lead_id || "") +
          '">' +
          esc(shortId) +
          "</td>" +
          "<td>" +
          esc(when) +
          '</td><td><span class="badge ' +
          badge +
          '">' +
          esc(status) +
          "</span></td>" +
          "<td>" +
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
  }

  function renderPatterns(data) {
    var rows = data.patterns || [];
    destroy("patterns");
    if (!rows.length) {
      el.patterns.innerHTML = '<p class="muted">Sem padrões ainda.</p>';
      return;
    }
    if (typeof Chart !== "undefined") {
      charts.patterns = new Chart(document.getElementById("chart-patterns"), {
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
              backgroundColor: ["#c0392b", "#e67e22", "#2980b9", "#8e44ad", "#27ae60"],
            },
          ],
        },
        options: {
          plugins: {
            legend: { position: "bottom", labels: { color: "#5c564f" } },
          },
        },
      });
    }
    el.patterns.innerHTML = rows
      .map(function (r) {
        return (
          '<div class="pattern-row"><span>' +
          esc(r.pattern_name || r.pattern_id) +
          "</span><strong>" +
          r.sessions +
          "</strong></div>"
        );
      })
      .join("");
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function load() {
    el.status.textContent = "Carregando…";
    try {
      var data = await fetchAnalytics();
      lastData = data;
      renderKpis(data);
      renderSteps(data);
      renderDayHour(data);
      renderAnswerFilters(data);
      renderAnswers(data, "*");
      renderSheet(data);
      renderPatterns(data);
      el.status.textContent =
        "Período " +
        el.from.value +
        " → " +
        el.to.value +
        " · " +
        ((data.leads && data.leads.length) || 0) +
        " leads na tabela · atualizado " +
        new Date().toLocaleString("pt-BR");
    } catch (e) {
      el.status.textContent = "Erro: " + (e.message || e);
      if (/Senha incorreta|UNAUTHORIZED/i.test(String(e.message || e))) {
        clearPassword();
        showLogin("Senha incorreta.");
      }
    }
  }

  function showLogin(msg) {
    el.login.hidden = false;
    el.dash.hidden = true;
    el.loginErr.hidden = !msg;
    el.loginErr.textContent = msg || "";
  }

  function showDash() {
    el.login.hidden = true;
    el.dash.hidden = false;
    load();
  }

  el.loginBtn.addEventListener("click", async function () {
    var p = (el.pass.value || "").trim();
    if (!p) return showLogin("Digite a senha.");
    el.loginErr.hidden = true;
    el.loginBtn.disabled = true;
    el.loginBtn.textContent = "Entrando…";
    setPassword(p);
    // valida senha ANTES de trocar de tela
    try {
      await fetchAnalytics();
      showDash();
    } catch (e) {
      clearPassword();
      showLogin(e.message || "Não foi possível entrar.");
    } finally {
      el.loginBtn.disabled = false;
      el.loginBtn.textContent = "Abrir painel";
    }
  });
  el.pass.addEventListener("keydown", function (e) {
    if (e.key === "Enter") el.loginBtn.click();
  });
  el.refresh.addEventListener("click", load);
  el.logout.addEventListener("click", function () {
    clearPassword();
    showLogin();
  });

  document.querySelectorAll("[data-range]").forEach(function (chip) {
    chip.addEventListener("click", function () {
      document.querySelectorAll("[data-range]").forEach(function (c) {
        c.classList.remove("is-active");
      });
      chip.classList.add("is-active");
      var r = chip.getAttribute("data-range");
      setDefaultDates(r === "today" ? 1 : Number(r) || 7);
      if (getPassword()) load();
    });
  });

  setDefaultDates(7);
  if (getPassword()) showDash();
  else showLogin();
})();
