(() => {
  const drawer = document.querySelector(".jc-drawer");
  const overlay = document.querySelector(".jc-drawer-overlay");
  if (!drawer || !overlay) return;

  const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
  let lastTrigger = null;
  let isOpen = false;

  function focusables() {
    return Array.from(drawer.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null);
  }

  function setExpanded(state) {
    document.querySelectorAll("[data-drawer-open]").forEach(el => {
      el.setAttribute("aria-expanded", state ? "true" : "false");
    });
  }

  function open(e) {
    if (isOpen) return;
    isOpen = true;
    lastTrigger = (e && e.currentTarget) || document.activeElement;
    drawer.classList.remove("-translate-x-full");
    overlay.classList.remove("opacity-0", "pointer-events-none");
    overlay.classList.add("opacity-100");
    document.body.style.overflow = "hidden";
    setExpanded(true);
    const first = focusables()[0];
    if (first) first.focus();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    drawer.classList.add("-translate-x-full");
    overlay.classList.add("opacity-0", "pointer-events-none");
    overlay.classList.remove("opacity-100");
    document.body.style.overflow = "";
    setExpanded(false);
    if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
    lastTrigger = null;
  }

  function trapTab(e) {
    if (!isOpen || e.key !== "Tab") return;
    const items = focusables();
    if (items.length === 0) { e.preventDefault(); return; }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  document.querySelectorAll("[data-drawer-open]").forEach(el => el.addEventListener("click", open));
  overlay.addEventListener("click", close);
  drawer.querySelector(".jc-drawer-close")?.addEventListener("click", close);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && isOpen) { e.preventDefault(); close(); }
    else trapTab(e);
  });
})();
