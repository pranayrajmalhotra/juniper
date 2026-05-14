// /index.html — populate hero, bento and favourites from the live `venues` table.
// Static markup in index.html is kept as a fallback; if the fetch fails or returns nothing,
// the visitor still sees a well-formed page.
(() => {
  const $ = (s, r=document) => r.querySelector(s);

  const escHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
  const firstPerk = v => Array.isArray(v.perks) && v.perks.length ? v.perks[0] : "Member benefit";
  const truncate  = (s, n) => { s = String(s || ""); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };
  const placeholder = "assets/logo.png";

  // Split a venue name on its middle space and join with <br> so the hero
  // keeps its two-line rhythm. Escapes both halves.
  function nameWithBreak(raw) {
    const parts = String(raw || "").trim().split(/\s+/);
    if (parts.length < 2) return escHtml(parts[0] || "");
    const mid = Math.ceil(parts.length / 2);
    return escHtml(parts.slice(0, mid).join(" ")) + "<br/>" + escHtml(parts.slice(mid).join(" "));
  }

  /* ---------- Hero (Tie-up of the Month) ---------- */
  function paintHero(v) {
    if (!v) return;
    const bg = $("[data-home-bg]");
    if (bg) bg.src = v.image_url || placeholder;
    const name = $("[data-home-name]");
    if (name) name.innerHTML = nameWithBreak(v.name);
    const desc = $("[data-home-desc]");
    if (desc) desc.textContent = truncate(v.description || "", 160);
    const perk = $("[data-home-perk]");
    if (perk) perk.textContent = firstPerk(v);
  }

  /* ---------- Bento grid (Curated Additions, 1 large + 2 small) ---------- */
  function bentoHtml([a, b, c]) {
    const small = v => `
      <div class="h-1/2 group relative overflow-hidden rounded-xl bg-surface-container-lowest">
        <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
             src="${escHtml(v.image_url || placeholder)}" alt="${escHtml(v.name)}"/>
        <div class="absolute inset-0 bg-primary/40 group-hover:bg-primary/20 transition-colors"></div>
        <div class="absolute inset-0 p-6 flex flex-col justify-end text-white">
          <h5 class="font-headline text-xl mb-1">${escHtml(v.name)}</h5>
          <p class="font-label text-[10px] uppercase tracking-widest font-bold text-tertiary-fixed">${escHtml(firstPerk(v))}</p>
        </div>
      </div>`;

    return `
      <div class="md:col-span-8 group relative overflow-hidden rounded-xl bg-surface-container-lowest">
        <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
             src="${escHtml(a.image_url || placeholder)}" alt="${escHtml(a.name)}"/>
        <div class="absolute inset-0 bg-gradient-to-t from-primary-container/80 to-transparent"></div>
        <div class="absolute bottom-0 left-0 p-8 text-white">
          <span class="inline-block bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest mb-4">${a.is_featured ? "Featured" : "New Partner"}</span>
          <h5 class="font-headline text-3xl mb-2">${escHtml(a.name)}</h5>
          <p class="text-white/70 text-sm max-w-sm mb-6">${escHtml(truncate(a.description || "", 140))}</p>
          <p class="font-label text-xs uppercase tracking-widest font-bold">Offer: ${escHtml(firstPerk(a))}</p>
        </div>
      </div>
      <div class="md:col-span-4 flex flex-col gap-6">
        ${[b, c].filter(Boolean).map(small).join("")}
      </div>`;
  }

  /* ---------- Member Favourites (editorial list, alternating bg) ---------- */
  function favouritesHtml(rows) {
    return rows.map((v, i) => `
      <div class="flex flex-col md:flex-row items-center gap-8 p-6 ${i % 2 === 0 ? "bg-surface-container" : "bg-surface-container-low"} hover:bg-surface-container-high transition-colors group">
        <div class="w-full md:w-32 h-24 overflow-hidden rounded-lg">
          <img class="w-full h-full object-cover" src="${escHtml(v.image_url || placeholder)}" alt="${escHtml(v.name)}"/>
        </div>
        <div class="flex-grow">
          <h5 class="font-headline text-2xl text-on-surface">${escHtml(v.name)}</h5>
          <p class="text-on-surface-variant text-sm font-body mt-1">${escHtml(truncate(v.description || "", 120))}</p>
        </div>
        <div class="w-full md:w-auto text-left md:text-right">
          <p class="font-label text-[10px] text-primary uppercase tracking-[0.1rem] font-bold">Active Benefit</p>
          <p class="font-headline text-lg text-secondary mt-1">${escHtml(firstPerk(v))}</p>
        </div>
      </div>`).join("");
  }

  async function init() {
    if (!window.SB) return;
    try {
      const { data, error } = await window.SB
        .from("venues")
        .select("*")
        .eq("is_published", true)
        .order("is_featured",   { ascending: false })
        .order("display_order", { ascending: false })
        .order("created_at",    { ascending: false })
        .limit(20);
      if (error) throw error;
      if (!data?.length) return;

      // 1 hero + up to 3 bento + up to 3 favourites = first 7
      paintHero(data[0]);

      const bento = data.slice(1, 4);
      const bentoEl = $("#home-bento");
      if (bentoEl && bento.length === 3) bentoEl.innerHTML = bentoHtml(bento);

      const favs = data.slice(4, 7);
      const favsEl = $("#home-favorites");
      if (favsEl && favs.length === 3) favsEl.innerHTML = favouritesHtml(favs);
    } catch (e) {
      console.warn("[JC home] venues fetch:", e?.message || e);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
