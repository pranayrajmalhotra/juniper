// /offers.html — one card per venue, each highlighting that venue's headline offer.
// Cards link through to venue.html?slug=<slug>. Filter by category, free-text search.
(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const escHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));

  const CATEGORY_LABELS = {
    cocktail:  "Cocktail Bar",
    speakeasy: "Speakeasy",
    lounge:    "Lounge",
    wine:      "Wine Bar",
    gastropub: "Gastropub",
    cafe:      "Café",
    wellness:  "Wellness",
  };
  const titleCase = s => CATEGORY_LABELS[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

  // Pick a Material Symbols icon for the headline perk.
  function iconFor(perkText, category) {
    const t = (perkText || "").toLowerCase();
    if (/(complimentary|free|on the house|welcome|amuse|champagne)/.test(t)) return "redeem";
    if (/(% off|discount|half[- ]off|credit|waived)/.test(t)) return "percent";
    if (/(priority|reserved|table|booking|seat|terrace)/.test(t)) return "event_seat";
    if (/(guest|pass|entry|access|member-only|member only)/.test(t)) return "key";
    if (/(flight|tasting|sommelier|wine|pairing)/.test(t)) return "wine_bar";
    if (/(cocktail|bartender|whisky|gin|negroni|cigar)/.test(t)) return "local_bar";
    if (/(menu|dessert|kitchen|tapas|food)/.test(t)) return "restaurant";
    if (/(tour|garden|music|band)/.test(t)) return "interests";
    if (category === "wellness") return "spa";
    return "confirmation_number";
  }

  const perksOf = v => (Array.isArray(v.perks) ? v.perks : [])
    .map(p => String(p || "").trim()).filter(Boolean);

  let allVenues   = [];
  let allCats     = [];
  let currentCat   = "";
  let currentQuery = "";

  function applyFilters() {
    const q = currentQuery.trim().toLowerCase();
    return allVenues.filter(v => {
      if (currentCat && v.category !== currentCat) return false;
      if (q) {
        const hay = `${v.name} ${v.area} ${v.city} ${v.category} ${perksOf(v).join(" ")} ${v.description || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function sortVenues(rows) {
    return [...rows].sort((a, b) =>
      (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) ||
      (b.display_order ?? 0) - (a.display_order ?? 0) ||
      String(a.name).localeCompare(String(b.name))
    );
  }

  function renderCats(cats) {
    const wrap = $("#offers-cats");
    if (!wrap) return;
    const base   = "jc-cat-pill px-5 py-2 rounded-full font-label text-[10px] font-extrabold uppercase tracking-[0.18rem] whitespace-nowrap transition-colors";
    const active = "bg-primary text-on-primary";
    const idle   = "bg-surface-container-low text-on-surface-variant border border-outline-variant/15 hover:bg-surface-container";
    const items  = [{ slug: "", label: "All" }, ...cats.map(c => ({ slug: c, label: titleCase(c) }))];
    wrap.innerHTML = items.map(it => {
      const klass = it.slug === currentCat ? `${base} ${active}` : `${base} ${idle}`;
      return `<button class="${klass}" data-cat="${escHtml(it.slug)}">${escHtml(it.label)}</button>`;
    }).join("");
    $$(".jc-cat-pill", wrap).forEach(btn => btn.addEventListener("click", () => {
      currentCat = btn.dataset.cat || "";
      renderCats(cats);
      rerender();
    }));
  }

  function cardHtml(v) {
    const perks    = perksOf(v);
    const headline = perks[0] || "Member access";
    const more     = Math.max(0, perks.length - 1);
    const moreText = more > 0 ? `+ ${more} more benefit${more > 1 ? "s" : ""}` : "Member venue";
    const cat      = titleCase(v.category);
    const img      = v.image_url || "assets/logo.png";
    const href     = v.slug ? `venue.html?slug=${encodeURIComponent(v.slug)}` : "venue.html";
    const loc      = [v.area, v.city].filter(Boolean).join(" · ");
    const ring     = v.is_featured ? " ring-1 ring-tertiary-fixed/40" : "";
    return `
      <a href="${href}" class="jc-offer-card group bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow border border-outline-variant/10 hover:-translate-y-1 transition-transform duration-300 flex flex-col${ring}">
        <div class="relative aspect-[16/10] overflow-hidden">
          <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="${escHtml(img)}" alt="${escHtml(v.name)}" loading="lazy"/>
          <div class="absolute inset-0 bg-gradient-to-t from-primary/75 via-primary/10 to-transparent"></div>
          <div class="absolute top-4 left-4 flex gap-2">
            ${cat ? `<span class="bg-bone text-primary jc-caption px-3 py-1">${escHtml(cat)}</span>` : ""}
            ${v.is_featured ? `<span class="bg-tertiary-fixed text-on-tertiary-fixed jc-caption px-3 py-1">Featured</span>` : ""}
          </div>
          <div class="absolute bottom-4 left-5 right-5 text-bone">
            <h3 class="font-display tracking-tight leading-tight" style="font-size: clamp(1.5rem, 2.4vw, 1.8rem);">${escHtml(v.name)}</h3>
            <p class="jc-caption text-bone/75 mt-1">${escHtml(loc)}</p>
          </div>
        </div>
        <div class="p-6 flex flex-col grow">
          <p class="jc-caption text-secondary mb-3">Headline Offer</p>
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-tertiary-fixed-dim shrink-0 mt-0.5">${iconFor(headline, v.category)}</span>
            <p class="font-display-sm text-primary text-lg leading-snug">${escHtml(headline)}</p>
          </div>
          <div class="mt-auto pt-5 flex items-center justify-between">
            <span class="jc-caption text-primary/50">${escHtml(moreText)}</span>
            <span class="font-label text-[10px] uppercase tracking-[0.2em] font-bold text-primary inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">View venue <span class="material-symbols-outlined !text-sm">arrow_outward</span></span>
          </div>
        </div>
      </a>`;
  }

  function emptyHtml(reason, detail) {
    const map = {
      "no-match":   { icon: "search_off",          title: "No venues match.",        body: "Try a different category or clear the search." },
      "no-data":    { icon: "confirmation_number", title: "No offers yet.",          body: "Check back soon — partners are joining each week." },
      "no-config":  { icon: "settings",            title: "Backend not configured.", body: "js/config.js is missing the Supabase URL or key." },
      "fetch-fail": { icon: "cloud_off",           title: "Couldn't load offers.",   body: detail || "Check your connection and reload." },
    };
    const m = map[reason] || map["no-data"];
    return `
      <div class="col-span-full text-center py-20 text-on-surface-variant">
        <span class="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">${m.icon}</span>
        <h3 class="font-headline text-2xl">${escHtml(m.title)}</h3>
        <p class="text-sm mt-2 font-light">${escHtml(m.body)}</p>
      </div>`;
  }

  function setCount(shown, total) {
    const el = $("#offers-count");
    if (!el) return;
    if (!total) { el.textContent = ""; return; }
    el.textContent = shown === total
      ? `${total} venue${total === 1 ? "" : "s"} · the full list.`
      : `Showing ${shown} of ${total} venue${total === 1 ? "" : "s"}.`;
  }

  function rerender() {
    const grid = $("#offers-grid");
    if (!grid) return;
    const filtered = sortVenues(applyFilters());
    setCount(filtered.length, allVenues.length);
    if (!allVenues.length) { grid.innerHTML = emptyHtml("no-data"); return; }
    if (!filtered.length)  { grid.innerHTML = emptyHtml("no-match"); return; }
    grid.innerHTML = filtered.map(cardHtml).join("");
  }

  function wireSearch() {
    const input = $("#offers-search");
    if (!input) return;
    let t;
    input.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => { currentQuery = input.value; rerender(); }, 120);
    });
  }

  async function init() {
    wireSearch();
    const grid = $("#offers-grid");
    if (!window.SB) {
      console.warn("[JC offers] window.SB is null — Supabase client not initialized.");
      return; // leave the static fallback cards in place
    }
    try {
      const { data, error } = await window.SB
        .from("venues")
        .select("id,slug,name,area,city,category,description,image_url,perks,is_featured,is_published,display_order")
        .eq("is_published", true)
        .order("is_featured",   { ascending: false })
        .order("display_order", { ascending: false })
        .order("name",          { ascending: true })
        .limit(200);
      if (error) throw error;
      if (!data || !data.length) { if (grid) grid.innerHTML = emptyHtml("no-data"); return; }

      allVenues = data;
      allCats   = [...new Set(allVenues.map(v => v.category).filter(Boolean))].sort();
      renderCats(allCats);
      rerender();
    } catch (e) {
      const msg = e?.message || String(e);
      console.warn("[JC offers] fetch:", msg);
      if (grid) grid.innerHTML = emptyHtml("fetch-fail", msg);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
