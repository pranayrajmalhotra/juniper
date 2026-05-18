/* Frontend hydration for editable content sections.
 *   [data-bind-logos]       — partner-logo marquee (client_logos table)
 *   [data-bind-favourites]  — member favourites list (member_favourites table)
 * Static markup remains as a graceful fallback; we only swap in dynamic
 * content when the fetch succeeds with at least one published row. */
(() => {
  const escHtml = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])
    );

  // ────────── client_logos → marquee ───────────────────────────────────
  function renderLogo(row) {
    const mark = row.mark ? `<span class="jc-mark mx-1">${escHtml(row.mark)}</span>` : "";
    const sub  = row.variant === "minimal" && row.subline
      ? `<span class="jc-sub">${escHtml(row.subline)}</span>`
      : "";
    return `<span class="jc-logo jc-logo--${escHtml(row.variant)}">${mark}${escHtml(row.label)}${sub}</span>`;
  }

  async function hydrateLogos() {
    const tracks = document.querySelectorAll("[data-bind-logos]");
    if (!tracks.length || !window.SB) return;
    const { data, error } = await window.SB
      .from("client_logos")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: false });
    if (error || !data?.length) return;             // keep static fallback
    const html = data.map(renderLogo).join("");
    tracks.forEach((track) => {
      track.innerHTML = html;
      // re-clone for seamless loop
      window.JCFx?.fillTrack?.(track);
    });
  }

  // ────────── member_favourites → list ─────────────────────────────────
  const ROMAN = ["i.", "ii.", "iii.", "iv.", "v.", "vi.", "vii.", "viii.", "ix.", "x."];

  function renderFavourite(row, i) {
    const num = ROMAN[i] || `${i + 1}.`;
    const desc = row.description
      ? `<p class="hidden md:block md:col-span-5 text-on-surface-variant text-base font-light">${escHtml(row.description)}</p>`
      : `<p class="hidden md:block md:col-span-5"></p>`;
    return `
      <li class="jc-reveal">
        <a href="directory.html" class="group grid grid-cols-12 gap-4 md:gap-8 items-center py-6 md:py-8 border-b border-primary/15 transition-colors hover:bg-bone-soft">
          <span class="col-span-1 md:col-span-1 font-display italic text-primary/30 text-xl md:text-3xl" style="font-variation-settings: 'opsz' 36, 'slnt' -10;">${num}</span>
          <div class="col-span-11 md:col-span-3">
            <p class="jc-caption text-primary/60 mb-1">${escHtml(row.category)}</p>
            <h3 class="font-display text-primary text-2xl md:text-4xl leading-tight tracking-tight">${escHtml(row.name)}</h3>
          </div>
          ${desc}
          <p class="col-span-12 md:col-span-3 md:text-right">
            <span class="jc-caption text-primary/50 block">Active Benefit</span>
            <span class="font-display italic text-secondary text-lg md:text-xl" style="font-variation-settings: 'opsz' 24, 'slnt' -10;">${escHtml(row.benefit)}</span>
          </p>
        </a>
      </li>`;
  }

  async function hydrateFavourites() {
    const lists = document.querySelectorAll("[data-bind-favourites]");
    if (!lists.length || !window.SB) return;
    const { data, error } = await window.SB
      .from("member_favourites")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: false });
    if (error || !data?.length) return;
    const html = data.map(renderFavourite).join("");
    lists.forEach((list) => {
      list.innerHTML = html;
      // Re-trigger reveal observer on freshly-inserted nodes
      list.querySelectorAll(".jc-reveal").forEach((el) => el.classList.add("is-visible"));
    });
  }

  // ────────── site_content → [data-cms] bindings ───────────────────────
  // Generic per-section copy. Elements opt in with one of:
  //   data-cms="page.section.key"       → element.textContent
  //   data-cms-html="page.section.key"  → element.innerHTML  (inline markup)
  //   data-cms-src="page.section.key"   → <img> src
  //   data-cms-href="page.section.key"  → <a> href
  // A blank/missing value leaves the static markup untouched (graceful fallback).
  async function hydrateSiteContent() {
    const els = document.querySelectorAll("[data-cms],[data-cms-html],[data-cms-src],[data-cms-href]");
    if (!els.length || !window.SB) return;
    const { data, error } = await window.SB
      .from("site_content")
      .select("page,section,item_key,value");
    if (error || !data?.length) return;

    const map = new Map();
    for (const r of data) map.set(`${r.page}.${r.section}.${r.item_key}`, r.value);

    const lookup = (el, attr) => {
      const k = el.getAttribute(attr);
      const v = k ? map.get(k) : undefined;
      return (v == null || v === "") ? undefined : v;
    };

    els.forEach((el) => {
      let v;
      if (el.hasAttribute("data-cms"))      { v = lookup(el, "data-cms");      if (v !== undefined) el.textContent = v; }
      if (el.hasAttribute("data-cms-html")) { v = lookup(el, "data-cms-html"); if (v !== undefined) el.innerHTML  = v; }
      if (el.hasAttribute("data-cms-src"))  { v = lookup(el, "data-cms-src");  if (v !== undefined) el.setAttribute("src", v); }
      if (el.hasAttribute("data-cms-href")) { v = lookup(el, "data-cms-href"); if (v !== undefined) el.setAttribute("href", v); }
    });
  }

  function init() {
    hydrateSiteContent().catch(() => {});
    hydrateLogos().catch(() => {});
    hydrateFavourites().catch(() => {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
