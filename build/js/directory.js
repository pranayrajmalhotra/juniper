// /directory.html — fetch venues, render bento grid, with filter pills + search.
(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const escHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
  const firstPerk = v => Array.isArray(v.perks) && v.perks.length ? v.perks[0] : "Member benefit";

  let allVenues = [];
  let currentCat = "";       // "" = All, otherwise a category slug
  let currentQuery = "";     // search query

  function applyFilters() {
    const q = currentQuery.trim().toLowerCase();
    return allVenues.filter(v => {
      if (currentCat && v.category !== currentCat) return false;
      if (q) {
        const hay = `${v.name} ${v.area} ${v.city} ${v.category} ${v.description || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderGrid(rows) {
    const grid = $("#venue-grid");
    if (!grid) return;
    grid.removeAttribute("data-static-fallback");

    if (!rows.length) {
      grid.innerHTML = `
        <div class="md:col-span-12 text-center py-20">
          <span class="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">search_off</span>
          <h3 class="font-headline text-2xl text-on-surface-variant">No venues match.</h3>
          <p class="text-on-surface-variant text-sm mt-2">Try a different category or clear the search.</p>
        </div>`;
      return;
    }

    const sorted = [...rows].sort((a, b) =>
      (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (b.display_order ?? 0) - (a.display_order ?? 0)
    );
    const [hero, second, ...rest] = sorted;

    const heroHtml = hero ? `
      <div class="md:col-span-8 group cursor-pointer">
        <div class="relative aspect-[16/10] overflow-hidden rounded-lg mb-4">
          <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
               alt="${escHtml(hero.name)}" src="${escHtml(hero.image_url || 'assets/logo.png')}"/>
          ${hero.is_featured ? `<div class="absolute top-4 right-4 bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full font-label text-[10px] font-bold uppercase tracking-tighter" aria-label="Featured venue">Featured</div>` : ""}
        </div>
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-headline text-3xl text-primary mb-1">${escHtml(hero.name)}</h3>
            <p class="font-label text-xs uppercase tracking-widest text-secondary mb-4">${escHtml(hero.area)}, ${escHtml(hero.city)} · ${escHtml(hero.category)}</p>
            <p class="text-on-surface-variant text-sm max-w-md">${escHtml((hero.description || '').slice(0, 240))}</p>
          </div>
          <span class="material-symbols-outlined text-primary text-3xl">arrow_outward</span>
        </div>
      </div>` : "";

    const secondHtml = second ? `
      <div class="md:col-span-4 group cursor-pointer flex flex-col">
        <div class="relative flex-grow overflow-hidden rounded-lg mb-4 aspect-[4/5] md:aspect-auto">
          <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
               alt="${escHtml(second.name)}" src="${escHtml(second.image_url || 'assets/logo.png')}"/>
          <div class="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
          <div class="absolute bottom-6 left-6 text-white">
            <h3 class="font-headline text-2xl mb-1">${escHtml(second.name)}</h3>
            <p class="font-label text-[10px] uppercase tracking-widest opacity-80">${escHtml(second.area)} · ${escHtml(second.category)}</p>
          </div>
        </div>
        <div class="bg-surface-container-lowest p-6 rounded-lg border border-outline-variant/10 editorial-shadow">
          <p class="font-label text-[10px] uppercase tracking-widest text-on-tertiary-container font-bold mb-2">Member Perk</p>
          <p class="text-on-surface font-medium leading-relaxed">${escHtml(firstPerk(second))}</p>
        </div>
      </div>` : "";

    const restHtml = rest.map(v => `
      <div class="md:col-span-4 group cursor-pointer">
        <div class="relative aspect-square overflow-hidden rounded-lg mb-4">
          <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
               alt="${escHtml(v.name)}" src="${escHtml(v.image_url || 'assets/logo.png')}"/>
        </div>
        <h3 class="font-headline text-xl text-primary mb-1">${escHtml(v.name)}</h3>
        <p class="font-label text-[10px] uppercase tracking-widest text-secondary mb-3">${escHtml(v.area)} · ${escHtml(v.category)}</p>
        <div class="inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-sm">
          <span class="material-symbols-outlined text-sm">confirmation_number</span>
          <span class="font-label text-[10px] font-bold">${escHtml(firstPerk(v))}</span>
        </div>
      </div>`).join("");

    grid.innerHTML = heroHtml + secondHtml + restHtml;
  }

  function rerender() { renderGrid(applyFilters()); }

  function wirePills() {
    $$(".jc-cat-pill").forEach(btn => btn.addEventListener("click", () => {
      currentCat = btn.dataset.cat || "";
      $$(".jc-cat-pill").forEach(b => {
        const active = b === btn;
        b.classList.toggle("bg-primary",                 active);
        b.classList.toggle("text-on-primary",            active);
        b.classList.toggle("bg-surface-container-low",   !active);
        b.classList.toggle("text-on-surface-variant",    !active);
        b.classList.toggle("border",                     !active);
        b.classList.toggle("border-outline-variant/15",  !active);
      });
      rerender();
    }));
  }

  function wireSearch() {
    const trigger = $("#search-trigger");
    const wrap    = $("#search-wrap");
    const input   = $("#search-input");
    const clear   = $("#search-clear");
    if (!trigger || !wrap || !input) return;

    trigger.addEventListener("click", () => {
      wrap.classList.toggle("hidden");
      if (!wrap.classList.contains("hidden")) input.focus();
      else { input.value = ""; currentQuery = ""; rerender(); }
    });
    let t;
    input.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(() => { currentQuery = input.value; rerender(); }, 150);
    });
    clear?.addEventListener("click", () => {
      input.value = ""; currentQuery = ""; input.focus(); rerender();
    });
  }

  async function init() {
    wirePills();
    wireSearch();

    if (!window.SB) return; // leave static fallback
    try {
      const { data, error } = await window.SB
        .from("venues")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: false })
        .limit(100);
      if (error) throw error;
      if (!data?.length) return;
      allVenues = data;
      rerender();
    } catch (e) {
      console.warn("[JC] venues fetch:", e?.message || e);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
