// /venue.html?slug=<slug> — fetch a single venue and render its detail page.
// Falls back to the static (Sidecar) markup when Supabase is unconfigured or no slug is given.
(() => {
  const $ = (s, r = document) => r.querySelector(s);

  const escHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
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
  const catLabel = c => CATEGORY_LABELS[c] || (c ? c.charAt(0).toUpperCase() + c.slice(1) : "Partner Venue");

  const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];

  // Pick a Material Symbols icon for a perk line.
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

  const params = new URLSearchParams(location.search);
  const slug = params.get("slug");
  const id   = params.get("id");

  function setText(sel, val) {
    const el = $(sel);
    if (el && val != null) el.textContent = val;
  }

  function render(v) {
    const label = catLabel(v.category);
    const loc   = [v.area, v.city].filter(Boolean).join(", ");

    document.title = `${v.name} · Juniper Club`;
    setText("#v-name", v.name);
    setText("#v-eyebrow", `${label} · ${loc}`);
    setText("#v-hero-loc", loc);

    const img = $("#v-hero-img");
    if (img) {
      img.src = v.image_url || "assets/logo.png";
      img.alt = v.name || "Partner venue";
    }

    const badge = $("#v-hero-badge");
    if (badge) {
      if (v.is_featured) {
        badge.textContent = "Featured Partner";
        badge.classList.remove("bg-bone", "text-primary");
        badge.classList.add("bg-tertiary-fixed", "text-on-tertiary-fixed");
      } else {
        badge.textContent = "Member Venue";
      }
    }

    const mark = $("#v-mark");
    if (mark) mark.textContent = (v.name || "·").trim().charAt(0).toUpperCase() || "·";

    setText("#v-description", v.description || "An invitation extended to Juniper Club members.");

    // Member benefits — one block per perk
    const perks = (Array.isArray(v.perks) ? v.perks : [])
      .map(p => String(p || "").trim()).filter(Boolean);
    const wrap = $("#v-benefits");
    if (wrap) {
      if (perks.length) {
        wrap.innerHTML = perks.map((p, i) => `
          <div class="flex gap-4">
            <span class="material-symbols-outlined text-tertiary-fixed-dim mt-0.5">${iconFor(p, v.category)}</span>
            <div>
              <p class="jc-caption text-primary/45 mb-1.5">Benefit ${ROMAN[i] || i + 1}</p>
              <p class="font-display-sm text-primary text-lg leading-snug">${escHtml(p)}</p>
            </div>
          </div>`).join("");
      } else {
        wrap.innerHTML = `
          <div class="flex gap-4">
            <span class="material-symbols-outlined text-tertiary-fixed-dim mt-0.5">confirmation_number</span>
            <div>
              <p class="jc-caption text-primary/45 mb-1.5">Benefit i</p>
              <p class="font-display-sm text-primary text-lg leading-snug">Member access — details with the concierge.</p>
            </div>
          </div>`;
      }
    }

    // Location
    const addr = $("#v-address");
    if (addr) addr.innerHTML = `${escHtml(v.area || "")}<br/>${escHtml(v.city || "")}`;
    setText("#v-area-display", v.area || "");
    setText("#v-city-display", v.city || "");

    const maps = $("#v-maps");
    if (maps) {
      const q = [v.name, v.area, v.city].filter(Boolean).join(" ");
      maps.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
    }
  }

  function notFound() {
    document.title = "Venue not found · Juniper Club";
    const main = document.querySelector("main");
    if (!main) return;
    main.innerHTML = `
      <section class="px-6 md:px-12 max-w-[1400px] mx-auto pt-16 md:pt-28 pb-24 text-center">
        <p class="jc-caption text-secondary mb-5">No. 404 — Off the list</p>
        <h1 class="font-display text-primary tracking-tight leading-[0.95]" style="font-size: clamp(2.5rem, 7vw, 5.5rem);">
          This door isn't <span class="italic" style="font-variation-settings: 'opsz' 144, 'slnt' -10;">ours.</span>
        </h1>
        <p class="mt-6 text-on-surface-variant font-light text-lg max-w-md mx-auto">
          The venue you're after may have left the directory, or the link wandered.
        </p>
        <div class="mt-10">
          <a href="directory.html" class="jc-btn"><span>Browse the directory</span><span class="material-symbols-outlined !text-sm">arrow_outward</span></a>
        </div>
      </section>`;
  }

  async function init() {
    // No identifier — leave the static fallback markup in place as a preview.
    if (!slug && !id) return;
    if (!window.SB) return; // Supabase not configured — keep fallback

    try {
      let q = window.SB.from("venues").select("*").eq("is_published", true);
      q = slug ? q.eq("slug", slug) : q.eq("id", id);
      const { data, error } = await q.limit(1);
      if (error) throw error;
      const v = data && data[0];
      if (!v) { notFound(); return; }
      render(v);
    } catch (e) {
      console.warn("[JC venue] fetch:", e?.message || e);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
