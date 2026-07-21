/**
 * Motion leve — feedback e transição sem poluir.
 * Respeita prefers-reduced-motion.
 */
(function () {
  const reduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.MapaMotion = {
    reduced,

    prefersReduced() {
      return (
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    },

    /** Troca de página com fade/slide */
    transitionTo(showFn, direction) {
      const app = document.getElementById("app");
      if (!app || this.prefersReduced()) {
        showFn();
        return;
      }
      const dir = direction === "back" ? "out-back" : "out-fwd";
      app.classList.remove("page-in", "page-out-fwd", "page-out-back");
      app.classList.add("page-" + dir);
      window.setTimeout(() => {
        showFn();
        app.classList.remove("page-out-fwd", "page-out-back");
        app.classList.add("page-in");
        window.setTimeout(() => app.classList.remove("page-in"), 320);
      }, 160);
    },

    /** Stagger em filhos com data-stagger */
    staggerIn(container, itemSelector) {
      if (!container || this.prefersReduced()) return;
      const items = container.querySelectorAll(itemSelector || "[data-stagger]");
      items.forEach((el, i) => {
        el.classList.remove("is-in");
        el.style.setProperty("--i", String(i));
        // force reflow
        void el.offsetWidth;
        requestAnimationFrame(() => el.classList.add("is-in"));
      });
    },

    /** Ripple no clique */
    ripple(e, el) {
      if (this.prefersReduced() || !el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX || rect.left + rect.width / 2) - rect.left;
      const y = (e.clientY || rect.top + rect.height / 2) - rect.top;
      const ink = document.createElement("span");
      ink.className = "ripple-ink";
      ink.style.left = x + "px";
      ink.style.top = y + "px";
      el.appendChild(ink);
      window.setTimeout(() => ink.remove(), 550);
    },

    /** Contador animado 0 → n */
    countUp(el, to, duration) {
      if (!el) return;
      const end = Number(to) || 0;
      if (this.prefersReduced()) {
        el.textContent = String(end);
        return;
      }
      const ms = duration || 900;
      const start = performance.now();
      const from = 0;
      function frame(now) {
        const t = Math.min(1, (now - start) / ms);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = String(Math.round(from + (end - from) * eased));
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    },

    /** Preenche barra de % do mapa */
    fillBar(el, pct, duration) {
      if (!el) return;
      const p = Math.max(0, Math.min(100, pct));
      if (this.prefersReduced()) {
        el.style.width = p + "%";
        return;
      }
      el.style.width = "0%";
      requestAnimationFrame(() => {
        el.style.transition = "width " + (duration || 1.1) + "s cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.width = p + "%";
      });
    },

    /** Pulse suave no CTA */
    pulseOnce(el) {
      if (!el || this.prefersReduced()) return;
      el.classList.remove("cta-pulse");
      void el.offsetWidth;
      el.classList.add("cta-pulse");
    },

    /** Shake suave se multi vazio */
    nudge(el) {
      if (!el) return;
      el.classList.remove("nudge");
      void el.offsetWidth;
      el.classList.add("nudge");
      window.setTimeout(() => el.classList.remove("nudge"), 450);
    },
  };
})();
