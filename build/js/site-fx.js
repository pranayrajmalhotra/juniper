/* Juniper Club — site-wide visual effects (cursor, reveals, page fade, marquee fill). */
(() => {
  const docReady = (fn) =>
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", fn)
      : fn();

  /* ── Page enter ────────────────────────────────────────────── */
  function pageEnter() {
    document.body.classList.add("jc-page-enter");
  }

  /* ── Scroll reveal (IntersectionObserver) ─────────────────── */
  function scrollReveal() {
    const targets = document.querySelectorAll(".jc-reveal");
    if (!("IntersectionObserver" in window) || targets.length === 0) {
      targets.forEach((t) => t.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    targets.forEach((t) => io.observe(t));
  }

  /* ── Marquee fill: duplicate items INSIDE the track so transform: translateX(-50%) loops seamlessly. ─── */
  function fillTrack(track) {
    if (!track) return;
    // Strip any prior clones
    track.querySelectorAll('[data-jc-clone="1"]').forEach((n) => n.remove());
    const originals = Array.from(track.children);
    originals.forEach((node) => {
      const clone = node.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.dataset.jcClone = "1";
      track.appendChild(clone);
    });
    track.dataset.cloned = "1";
  }
  function marqueeFill() {
    document.querySelectorAll(".jc-masthead-track, .jc-ribbon-track").forEach(fillTrack);
  }
  // Expose for CMS hydration
  window.JCFx = window.JCFx || {};
  window.JCFx.fillTrack = fillTrack;
  window.JCFx.refreshMarquees = marqueeFill;

  /* ── Custom cursor (desktop fine-pointer only) ────────────── */
  function customCursor() {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;
    const dot = document.createElement("div");
    dot.className = "jc-cursor-dot";
    const ring = document.createElement("div");
    ring.className = "jc-cursor-ring";
    document.body.append(dot, ring);
    document.body.classList.add("jc-has-cursor");

    let mx = 0, my = 0, rx = 0, ry = 0;
    const lerp = (a, b, t) => a + (b - a) * t;

    window.addEventListener(
      "pointermove",
      (e) => {
        mx = e.clientX; my = e.clientY;
        dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      },
      { passive: true }
    );

    function tick() {
      rx = lerp(rx, mx, 0.18);
      ry = lerp(ry, my, 0.18);
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%) ${ring.classList.contains("is-hover") ? "scale(1.6)" : "scale(1)"}`;
      requestAnimationFrame(tick);
    }
    tick();

    const HOVER_SEL = 'a, button, [role="button"], [data-drawer-open], label, input, textarea, select, summary';
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest(HOVER_SEL)) ring.classList.add("is-hover");
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest(HOVER_SEL)) ring.classList.remove("is-hover");
    });
    window.addEventListener("pointerdown", () => ring.classList.add("is-hover"));
    window.addEventListener("pointerup", () => {
      if (!document.querySelector(`${HOVER_SEL}:hover`)) ring.classList.remove("is-hover");
    });
    window.addEventListener("blur",  () => { dot.style.opacity = "0"; ring.style.opacity = "0"; });
    window.addEventListener("focus", () => { dot.style.opacity = "1"; ring.style.opacity = "1"; });
  }

  /* ── Year stamps for masthead ─────────────────────────────── */
  function yearStamps() {
    const y = new Date().getFullYear();
    document.querySelectorAll("[data-jc-year]").forEach((el) => { el.textContent = y; });
  }

  pageEnter();
  docReady(() => {
    marqueeFill();
    scrollReveal();
    customCursor();
    yearStamps();
  });
})();
