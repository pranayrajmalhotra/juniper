// /offers.html — flatten every venue's perks into individual offer cards.
// One card per (venue, perk) pair. Filter by category, free-text search.
(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const escHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));

  const CATEGORY_LABELS = {
    cocktail:  "Cocktail",
    speakeasy: "Speakeasy",
    lounge:    "Lounge",
    wine:      "Wine",
    gastropub: "Gastropub",
    cafe:      "Café",
    wellness:  "Wellness",
  };
  const titleCase = s => CATEGORY_LABELS[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

  // Pick a Material Symbols icon based on the perk text or venue category.
  function iconFor(perkText, category) {
    const t = (perkText || "").toLowerCase();
    if (/(complimentary|free|on the house|welcome)/.test(t)) return "redeem";
    if (/(% off|discount|half[- ]off|tab credit)/.test(t)) return "percent";
    if (/(priority|reserved|table|booking|seat)/.test(t)) return "event_seat";
    if (/(guest|pass|entry|access)/.test(t)) return "key";
    if (/(flight|tasting|sommelier|wine)/.test(t)) return "wine_bar";
    if (/(cocktail|bartender|whisky|gin)/.test(t)) return "local_bar";
    if (/(menu|dessert|kitchen|banchan)/.test(t)) return "restaurant";
    if (category === "wellness") return "spa";
    return "confirmation_number";
  }

  let allOffers = [];
  let allCats   = [];
  let currentCat   = "";
  let currentQuery = "";

  function flatten(venues) {
    const out = [];
    for (const v of venues) {
      const perks = Array.isArray(v.perks) ? v.perks : [];
      for (let i = 0; i < perks.length; i++) {
        const text = String(perks[i] || "").trim();
        if (!text) continue;
        out.push({
          id:       `${v.id || v.slug || v.name}-${i}`,
          perk:     text,
          venue:    v.name,
          area:     v.area,
          city:     v.city,
          category: v.category,
          image:    v.image_url,
          featured: !!v.is_featured,
        });
      }
    }
    return out;
  }

  function applyFilters() {
    const q = currentQuery.trim().toLowerCase();
    return allOffers.filter(o => {
      if (currentCat && o.category !== currentCat) return false;
      if (q) {
        const hay = `${o.perk} ${o.venue} ${o.area} ${o.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderCats(cats) {
    const wrap = $("#offers-cats");
    if (!wrap) return;
    const pillBase = "jc-cat-pill px-5 py-2 rounded-full font-label text-[10px] font-extrabold uppercase tracking-[0.18rem] whitespace-nowrap transition-colors";
    const active   = "bg-primary text-on-primary";
    const idle     = "bg-surface-container-low text-on-surface-variant border border-outline-variant/15 hover:bg-surface-container";
    const items = [{ slug: "", label: "All" }, ...cats.map(c => ({ slug: c, label: titleCase(c) }))];
    wrap.innerHTML = items.map(it => {
      const klass = it.slug === currentCat ? `${pillBase} ${active}` : `${pillBase} ${idle}`;
      return `<button class="${klass}" data-cat="${escHtml(it.slug)}">${escHtml(it.label)}</button>`;
    }).join("");
    $$(".jc-cat-pill", wrap).forEach(btn => btn.addEventListener("click", () => {
      currentCat = btn.dataset.cat || "";
      renderCats(cats);
      rerender();
    }));
  }

  function cardHtml(o) {
    const img = o.image || "assets/logo.png";
    const cat = titleCase(o.category);
    const icon = iconFor(o.perk, o.category);
    return `
      <article class="group bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow border border-outline-variant/10 hover:-translate-y-1 transition-transform duration-300">
        <div class="relative aspect-[16/10] overflow-hidden">
          <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="${escHtml(img)}" alt="${escHtml(o.venue)}" loading="lazy"/>
          <div class="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"></div>
          <div class="absolute top-4 left-4 flex gap-2">
            ${cat ? `<span class="bg-tertiary-fixed text-on-tertiary-fixed font-label text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">${escHtml(cat)}</span>` : ""}
            ${o.featured ? `<span class="bg-primary text-on-primary font-label text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Featured</span>` : ""}
          </div>
        </div>
        <div class="p-6 flex flex-col gap-4">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-primary text-2xl shrink-0 mt-0.5">${icon}</span>
            <h3 class="font-headline text-xl text-primary leading-tight">${escHtml(o.perk)}</h3>
          </div>
          <div class="mt-2 pt-4 border-t border-outline-variant/10 flex items-center justify-between">
            <div class="min-w-0">
              <p class="font-medium text-sm text-on-surface truncate">${escHtml(o.venue)}</p>
              <p class="font-label text-[10px] uppercase tracking-widest text-secondary mt-0.5 truncate">${escHtml(o.area || "")}${o.city ? ` · ${escHtml(o.city)}` : ""}</p>
            </div>
            <span class="material-symbols-outlined text-primary shrink-0 group-hover:translate-x-1 transition-transform">arrow_outward</span>
          </div>
        </div>
      </article>`;
  }

  function emptyHtml(reason, detail) {
    const map = {
      "no-match":   { icon: "search_off",          title: "No offers match.",     body: "Try a different category or clear the search." },
      "no-data":    { icon: "confirmation_number", title: "No offers yet.",       body: "Check back soon — partners are joining each week." },
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
      ? `${total} offer${total === 1 ? "" : "s"} active.`
      : `Showing ${shown} of ${total} offer${total === 1 ? "" : "s"}.`;
  }

  function rerender() {
    const grid = $("#offers-grid");
    if (!grid) return;
    const filtered = applyFilters();
    setCount(filtered.length, allOffers.length);
    if (!allOffers.length) { grid.innerHTML = emptyHtml("no-data"); return; }
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
      if (grid) grid.innerHTML = emptyHtml("no-config");
      return;
    }
    try {
      const { data, error } = await window.SB
        .from("venues")
        .select("id,slug,name,area,city,category,image_url,perks,is_featured,is_published,display_order")
        .eq("is_published", true)
        .order("is_featured",   { ascending: false })
        .order("display_order", { ascending: false })
        .order("name",          { ascending: true })
        .limit(200);
      if (error) throw error;

      allOffers = flatten(data || []);
      allCats   = [...new Set(allOffers.map(o => o.category).filter(Boolean))].sort();
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
