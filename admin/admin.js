(function () {
  var PASS_KEY = "mapa_admin_pass";
  var charts = {};
  var lastData = null;
  var questionMeta = {};

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
    funnelTable: document.getElementById("funnel-table"),
    qBody: document.querySelector("#table-questions tbody"),
    answers: document.getElementById("answers-list"),
    answersSub: document.getElementById("answers-sub"),
    patterns: document.getElementById("patterns-list"),
  };

  function cfg() {
    return window.MAPA_CONFIG || {};
  }

  function ymd(d) {
    var x = new Date(d);
    var m = String(x.getMonth() + 1).padStart(2, "0");
    var day = String(x.getDate()).padStart(2, "0");
    return x.getFullYear() + "-" + m + "-" + day;
  }

  function startOfDayISO(dateStr) {
    return dateStr + "T00:00:00-03:00";
  }

  function endOfDayISO(dateStr) {
    return dateStr + "T23:59:59.999-03:00";
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

  async function fetchAnalytics() {
    var c = cfg();
    var url = (c.supabaseUrl || "").replace(/\/$/, "");
    var key = c.supabaseAnonKey || "";
    if (!url || !key) {
      throw new Error("Configure config.js com supabaseUrl e supabaseAnonKey.");
    }
    var password = getPassword();
    if (!password) throw new Error("Senha não informada.");

    var body = {
      p_password: password,
      p_from: startOfDayISO(el.from.value),
      p_to: endOfDayISO(el.to.value),
    };

    var res = await fetch(url + "/rest/v1/rpc/admin_analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: "Bearer " + key,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      var t = await res.text();
      if (res.status === 401 || /UNAUTHORIZED|42501/i.test(t)) {
        throw new Error("Senha incorreta ou sem permissão no Supabase.");
      }
      throw new Error("Erro " + res.status + ": " + t.slice(0, 180));
    }
    return res.json();
  }

  function destroyChart(id) {
    if (charts[id]) {
      charts[id].destroy();
      delete charts[id];
    }
  }

  function renderKpis(data) {
    var t = data.totals || {};
    var f = data.funnel || {};
    var start = t.started || f.start || 0;
    var result = t.completed || f.result || 0;
    var checkout = t.checkouts || f.checkout || 0;
    var startToResult = start ? Math.round((result / start) * 1000) / 10 : 0;
    var resultToPay = result ? Math.round((checkout / result) * 1000) / 10 : 0;

    el.kpis.innerHTML =
      kpi("Sessões", t.sessions || 0) +
      kpi("Inícios quiz", start) +
      kpi("Resultados", result, startToResult + "% dos inícios") +
      kpi("Checkout", checkout, resultToPay + "% dos resultados") +
      kpi("Eventos", t.events || 0);
  }

  function kpi(label, value, note) {
    return (
      '<div class="kpi"><span>' +
      escapeHtml(label) +
      "</span><strong>" +
      escapeHtml(String(value)) +
      "</strong>" +
      (note ? "<em>" + escapeHtml(note) + "</em>" : "") +
      "</div>"
    );
  }

  function renderFunnel(data) {
    var f = data.funnel || {};
    var steps = [
      { key: "landing", label: "Landing" },
      { key: "start", label: "Começou" },
      { key: "profile", label: "Perfil" },
      { key: "any_question", label: "Alguma pergunta" },
      { key: "result", label: "Resultado" },
      { key: "checkout", label: "Checkout" },
    ];
    var max = 1;
    steps.forEach(function (s) {
      max = Math.max(max, Number(f[s.key] || 0));
    });

    var labels = steps.map(function (s) {
      return s.label;
    });
    var values = steps.map(function (s) {
      return Number(f[s.key] || 0);
    });

    destroyChart("funnel");
    charts.funnel = new Chart(document.getElementById("chart-funnel"), {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Sessões",
            data: values,
            backgroundColor: "rgba(225, 29, 72, 0.75)",
            borderRadius: 6,
          },
        ],
      },
      options: chartOpts(false),
    });

    var html = "";
    var prev = null;
    steps.forEach(function (s, i) {
      var v = Number(f[s.key] || 0);
      var pct = max ? Math.round((v / max) * 100) : 0;
      var drop = "";
      if (prev != null && prev > 0) {
        var d = Math.round(((prev - v) / prev) * 1000) / 10;
        drop = (d > 0 ? "−" : "") + Math.abs(d) + "%";
      }
      html +=
        '<div class="funnel-row"><span>' +
        escapeHtml(s.label) +
        '</span><div class="funnel-bar"><i style="width:' +
        pct +
        '%"></i></div><strong>' +
        v +
        "</strong><span class=\"muted\">" +
        escapeHtml(drop) +
        "</span></div>";
      prev = v;
    });
    el.funnelTable.innerHTML = html;
  }

  function chartOpts(legend) {
    return {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: !!legend, labels: { color: "#9aa3b2" } },
      },
      scales: {
        x: {
          ticks: { color: "#9aa3b2", maxRotation: 0 },
          grid: { color: "rgba(42,47,58,0.6)" },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#9aa3b2", precision: 0 },
          grid: { color: "rgba(42,47,58,0.6)" },
        },
      },
    };
  }

  function renderDayHour(data) {
    var days = data.by_day || [];
    destroyChart("day");
    charts.day = new Chart(document.getElementById("chart-day"), {
      type: "bar",
      data: {
        labels: days.map(function (d) {
          return d.day;
        }),
        datasets: [
          {
            label: "Inícios",
            data: days.map(function (d) {
              return d.starts || 0;
            }),
            backgroundColor: "rgba(56, 189, 248, 0.7)",
            borderRadius: 4,
          },
          {
            label: "Resultados",
            data: days.map(function (d) {
              return d.results || 0;
            }),
            backgroundColor: "rgba(34, 197, 94, 0.65)",
            borderRadius: 4,
          },
          {
            label: "Checkout",
            data: days.map(function (d) {
              return d.checkouts || 0;
            }),
            backgroundColor: "rgba(225, 29, 72, 0.7)",
            borderRadius: 4,
          },
        ],
      },
      options: chartOpts(true),
    });

    var hoursMap = {};
    for (var h = 0; h < 24; h++) hoursMap[h] = { starts: 0, results: 0, checkouts: 0 };
    (data.by_hour || []).forEach(function (row) {
      var hour = Number(row.hour);
      if (hoursMap[hour]) {
        hoursMap[hour] = {
          starts: row.starts || 0,
          results: row.results || 0,
          checkouts: row.checkouts || 0,
        };
      }
    });
    var labels = [];
    var starts = [];
    var results = [];
    var checkouts = [];
    for (var i = 0; i < 24; i++) {
      labels.push(String(i).padStart(2, "0") + "h");
      starts.push(hoursMap[i].starts);
      results.push(hoursMap[i].results);
      checkouts.push(hoursMap[i].checkouts);
    }

    destroyChart("hour");
    charts.hour = new Chart(document.getElementById("chart-hour"), {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Inícios",
            data: starts,
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56,189,248,0.15)",
            tension: 0.3,
            fill: true,
          },
          {
            label: "Resultados",
            data: results,
            borderColor: "#22c55e",
            tension: 0.3,
            fill: false,
          },
          {
            label: "Checkout",
            data: checkouts,
            borderColor: "#e11d48",
            tension: 0.3,
            fill: false,
          },
        ],
      },
      options: chartOpts(true),
    });
  }

  function loadQuestionMeta() {
    // tenta usar data.js se carregado; senão usa ids crus
    try {
      var s = document.createElement("script");
      s.src = "../data.js";
      s.onload = function () {
        var qs = (window.MAPA_DATA && window.MAPA_DATA.questions) || [];
        qs.forEach(function (q, i) {
          questionMeta[q.id] = { text: q.text, axis: q.axis, index: i, options: q.options || [] };
        });
        if (lastData) renderQuestions(lastData);
      };
      document.head.appendChild(s);
    } catch (e) {}
  }

  function qLabel(id) {
    var m = questionMeta[id];
    if (!m) return id || "—";
    var short = (m.text || id).slice(0, 64);
    return (m.index != null ? m.index + 1 + ". " : "") + short;
  }

  function renderQuestions(data) {
    var rows = data.questions || [];
    var maxDrop = -1;
    var bottleneckId = null;
    rows.forEach(function (r) {
      var d = Number(r.drop_rate || 0);
      if (d > maxDrop && Number(r.views || 0) >= 3) {
        maxDrop = d;
        bottleneckId = r.question_id;
      }
    });

    el.qBody.innerHTML = "";
    if (!rows.length) {
      el.qBody.innerHTML = '<tr><td colspan="7" class="muted">Sem dados de perguntas no período.</td></tr>';
      return;
    }

    rows.forEach(function (r) {
      var tr = document.createElement("tr");
      if (r.question_id === bottleneckId) tr.className = "is-bottleneck";
      var pass = Number(r.pass_rate || 0);
      var drop = Number(r.drop_rate || 0);
      tr.innerHTML =
        "<td>" +
        escapeHtml(String(r.step_index != null ? r.step_index + 1 : "—")) +
        "</td><td>" +
        escapeHtml(qLabel(r.question_id)) +
        "</td><td>" +
        escapeHtml(String(r.views || 0)) +
        "</td><td>" +
        escapeHtml(String(r.nexts || 0)) +
        '</td><td class="' +
        (pass >= 70 ? "pass-ok" : "") +
        '">' +
        pass +
        '%</td><td class="' +
        (drop >= 25 ? "drop-high" : "") +
        '">' +
        drop +
        '%</td><td><button type="button" class="btn-link" data-qid="' +
        escapeHtml(r.question_id) +
        '">Ver respostas</button></td>';
      el.qBody.appendChild(tr);
    });

    el.qBody.querySelectorAll("[data-qid]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        renderAnswers(lastData, btn.getAttribute("data-qid"));
      });
    });
  }

  function renderAnswers(data, filterQid) {
    var rows = data.answers || [];
    if (filterQid) {
      rows = rows.filter(function (a) {
        return a.question_id === filterQid;
      });
      el.answersSub.textContent = "Respostas de: " + qLabel(filterQid);
    } else {
      el.answersSub.textContent = "Top opções no período (todas as perguntas). Clique em “Ver respostas” para filtrar.";
    }

    // agrupa por question
    var byQ = {};
    rows.forEach(function (a) {
      var id = a.question_id || "unknown";
      if (!byQ[id]) byQ[id] = [];
      byQ[id].push(a);
    });

    var ids = Object.keys(byQ);
    if (!ids.length) {
      el.answers.innerHTML = '<p class="muted">Nenhuma resposta registrada no período.</p>';
      return;
    }

    // se geral, pega top 12 opções flat
    if (!filterQid) {
      var flat = rows.slice().sort(function (a, b) {
        return (b.times || 0) - (a.times || 0);
      });
      var max = flat[0] ? flat[0].times : 1;
      var html = '<div class="answer-block"><h3>Top marcações</h3>';
      flat.slice(0, 15).forEach(function (a) {
        var w = max ? Math.round((a.times / max) * 100) : 0;
        html +=
          '<div class="answer-row"><div><div>' +
          escapeHtml(a.option_label || "opção " + a.option_index) +
          '</div><div class="muted" style="font-size:0.75rem">' +
          escapeHtml(qLabel(a.question_id)) +
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

    var list = byQ[filterQid].sort(function (a, b) {
      return (b.times || 0) - (a.times || 0);
    });
    var maxT = list[0] ? list[0].times : 1;
    var block =
      '<div class="answer-block"><h3>' + escapeHtml(qLabel(filterQid)) + "</h3>";
    list.forEach(function (a) {
      var w = maxT ? Math.round((a.times / maxT) * 100) : 0;
      block +=
        '<div class="answer-row"><div>' +
        escapeHtml(a.option_label || "opção " + a.option_index) +
        '<div class="answer-bar"><i style="width:' +
        w +
        '%"></i></div></div><strong>' +
        a.times +
        "</strong></div>";
    });
    block += "</div>";
    el.answers.innerHTML = block;
  }

  function renderPatterns(data) {
    var rows = data.patterns || [];
    var names = {
      anxious: "Apego ansioso",
      savior: "Salvadora",
      intensity: "Intensidade",
      silence: "Auto-silenciamento",
      familiar: "Dor familiar",
    };
    destroyChart("patterns");
    if (!rows.length) {
      el.patterns.innerHTML = '<p class="muted">Sem resultados no período.</p>';
      return;
    }
    charts.patterns = new Chart(document.getElementById("chart-patterns"), {
      type: "doughnut",
      data: {
        labels: rows.map(function (r) {
          return names[r.pattern_id] || r.pattern_id;
        }),
        datasets: [
          {
            data: rows.map(function (r) {
              return r.sessions || 0;
            }),
            backgroundColor: ["#e11d48", "#f59e0b", "#38bdf8", "#a78bfa", "#22c55e"],
          },
        ],
      },
      options: {
        plugins: { legend: { position: "bottom", labels: { color: "#9aa3b2" } } },
      },
    });

    el.patterns.innerHTML = rows
      .map(function (r) {
        return (
          '<div class="answer-row"><span>' +
          escapeHtml(names[r.pattern_id] || r.pattern_id) +
          "</span><strong>" +
          r.sessions +
          "</strong></div>"
        );
      })
      .join("");
  }

  function escapeHtml(s) {
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
      renderFunnel(data);
      renderDayHour(data);
      renderQuestions(data);
      renderAnswers(data, null);
      renderPatterns(data);
      el.status.textContent =
        "Período " +
        el.from.value +
        " → " +
        el.to.value +
        " · atualizado " +
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
    if (msg) {
      el.loginErr.hidden = false;
      el.loginErr.textContent = msg;
    } else {
      el.loginErr.hidden = true;
    }
  }

  function showDash() {
    el.login.hidden = true;
    el.dash.hidden = false;
    load();
  }

  el.loginBtn.addEventListener("click", function () {
    var p = (el.pass.value || "").trim();
    if (!p) {
      showLogin("Digite a senha.");
      return;
    }
    setPassword(p);
    showDash();
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
      if (r === "today") setDefaultDates(1);
      else setDefaultDates(Number(r) || 7);
      if (getPassword()) load();
    });
  });

  setDefaultDates(7);
  loadQuestionMeta();
  if (getPassword()) showDash();
  else showLogin();
})();
