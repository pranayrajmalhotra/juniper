/* DRIFT page hydration — pulls drift_djs + drift_events from Supabase
 * and swaps the static fallback markup with live data. */
(() => {
  const escHtml = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])
    );

  const MON_SHORT = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const DAY_SHORT = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

  function splitDate(d) {
    if (!d) return null;
    const dt = new Date(d);
    if (Number.isNaN(+dt)) return null;
    return {
      day: DAY_SHORT[dt.getDay()],
      num: String(dt.getDate()).padStart(2, "0"),
      mon: MON_SHORT[dt.getMonth()],
      yr:  dt.getFullYear(),
      iso: dt.toISOString(),
      time: dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      friendly: dt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
    };
  }

  function pillHTML(label, gold) {
    return `<span class="jc-pill${gold ? " jc-pill--gold" : ""}">${escHtml(label)}</span>`;
  }

  function renderUpcoming(row, i) {
    const d = splitDate(row.event_date);
    const subtitle = row.subtitle || (d ? `From ${d.time}` : "Date to be announced");
    const cover = row.cover_image_url
      ? `<img class="w-full h-full object-cover" alt="${escHtml(row.title)}" src="${escHtml(row.cover_image_url)}"/>`
      : `<div class="w-full h-full flex items-center justify-center bg-ink/40 text-bone/40"><span class="material-symbols-outlined !text-5xl">graphic_eq</span></div>`;
    const dateBlock = d
      ? `<div class="jc-drift-date">
           <span class="jc-drift-day">${d.day}</span>
           <span class="jc-drift-num">${d.num}</span>
           <span class="jc-drift-mon">${d.mon}</span>
         </div>`
      : "";
    const lineup = (row.lineup || []).map((n, idx) => pillHTML(n, idx === (row.lineup.length - 1) && row.lineup.length > 1)).join("");
    const reserve = row.ticket_url
      ? `<a href="${escHtml(row.ticket_url)}" target="_blank" rel="noopener" class="jc-btn jc-btn--bone"><span>Reserve a Spot</span></a>`
      : `<a href="mailto:concierge@juniper.club?subject=DRIFT%20%E2%80%94%20${encodeURIComponent(row.title)}" class="jc-btn jc-btn--bone"><span>Reserve a Spot</span></a>`;
    return `
      <li class="jc-reveal">
        <article class="jc-drift-card group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-10 items-stretch">
          <div class="md:col-span-5 jc-card-img aspect-[4/3] md:aspect-auto overflow-hidden relative">
            ${cover}
            ${row.subtitle ? `<span class="absolute top-5 left-5 bg-gold-400 text-ink jc-caption px-3 py-1">${escHtml(row.subtitle)}</span>` : ""}
          </div>
          <div class="md:col-span-7 flex flex-col justify-between py-2">
            <div>
              <div class="flex items-center gap-6 mb-4">
                ${dateBlock}
                <div class="${dateBlock ? "border-l border-gold-400/30 pl-6" : ""}">
                  <p class="jc-caption text-gold-400/85">${escHtml(subtitle)}</p>
                  <p class="jc-caption-serif text-bone/70 mt-1">${escHtml(row.venue_name)}${row.venue_area ? ` · ${escHtml(row.venue_area)}` : ""}</p>
                </div>
              </div>
              <h3 class="font-display text-bone leading-tight tracking-tight mt-6" style="font-size: clamp(2rem, 4vw, 3.25rem);">
                ${escHtml(row.title)}
              </h3>
              ${row.description ? `<p class="text-bone/65 text-base font-light leading-relaxed mt-4 max-w-xl">${escHtml(row.description)}</p>` : ""}
              ${lineup ? `<div class="flex flex-wrap gap-2 mt-5">${lineup}</div>` : ""}
            </div>
            <div class="flex flex-wrap gap-3 mt-8 pt-5 border-t border-bone/10">
              ${reserve}
              ${row.ticket_url ? "" : `<a href="mailto:concierge@juniper.club?subject=DRIFT%20%E2%80%94%20${encodeURIComponent(row.title)}%20%E2%80%94%20add%20to%20calendar" class="jc-btn jc-btn--ghost text-bone"><span>Add to Calendar</span></a>`}
            </div>
          </div>
        </article>
      </li>`;
  }

  const ROMAN = ["i.", "ii.", "iii.", "iv.", "v.", "vi.", "vii.", "viii.", "ix.", "x.", "xi.", "xii."];

  function renderPast(row, i) {
    const d = splitDate(row.event_date);
    const num = ROMAN[i] || `${i + 1}.`;
    const lineup = (row.lineup || []).join(" · ");
    return `
      <li class="jc-reveal">
        <article class="grid grid-cols-12 gap-4 md:gap-8 items-center py-6 md:py-7 border-b border-bone/10 group">
          <span class="col-span-3 md:col-span-1 font-display italic text-gold-400/60 text-xl md:text-3xl" style="font-variation-settings: 'opsz' 36, 'slnt' -10;">${num}</span>
          <div class="col-span-9 md:col-span-3">
            <p class="jc-caption text-gold-400/85 mb-1">${escHtml(d ? d.friendly : "Archived")}</p>
            <p class="font-display text-bone text-xl md:text-2xl leading-tight">${escHtml(row.title)}</p>
          </div>
          <p class="col-span-12 md:col-span-4 text-bone/65 text-sm font-light">${escHtml(row.venue_name)}${row.venue_area ? `, ${escHtml(row.venue_area)}` : ""}${row.description ? ` — ${escHtml(row.description)}` : ""}</p>
          <p class="col-span-12 md:col-span-4 md:text-right">
            <span class="jc-caption text-bone/50 block">Selectors</span>
            <span class="font-display italic text-bone text-base md:text-lg" style="font-variation-settings: 'opsz' 24, 'slnt' -10;">${escHtml(lineup) || "—"}</span>
          </p>
        </article>
      </li>`;
  }

  function renderDj(row, i) {
    const idx = ROMAN[i] || `${i + 1}.`;
    const portrait = row.image_url
      ? `<img class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Portrait of ${escHtml(row.name)}" src="${escHtml(row.image_url)}"/>`
      : `<div class="w-full h-full flex items-center justify-center bg-ink/40 text-bone/40"><span class="material-symbols-outlined !text-6xl">person</span></div>`;
    const genres = (row.genres || []).map(g => pillHTML(g)).join("");
    const links = [];
    if (row.instagram_url) {
      links.push(`<a href="${escHtml(row.instagram_url)}" target="_blank" rel="noopener" aria-label="Instagram" class="hover:text-gold-400 transition-colors"><span class="material-symbols-outlined !text-base align-middle">photo_camera</span><span class="jc-caption ml-1 align-middle">IG</span></a>`);
    }
    if (row.soundcloud_url) {
      links.push(`<a href="${escHtml(row.soundcloud_url)}" target="_blank" rel="noopener" aria-label="SoundCloud" class="hover:text-gold-400 transition-colors"><span class="material-symbols-outlined !text-base align-middle">graphic_eq</span><span class="jc-caption ml-1 align-middle">Mixes</span></a>`);
    }
    return `
      <article class="jc-dj-card jc-reveal group">
        <figure class="jc-card-img aspect-[3/4] overflow-hidden relative">
          ${portrait}
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink to-transparent h-2/5"></div>
          <span class="absolute bottom-5 left-5 jc-caption text-gold-400">Resident · ${idx.toUpperCase().replace(".", "")}</span>
        </figure>
        <div class="mt-5">
          ${row.tagline ? `<p class="jc-caption text-bone/55">${escHtml(row.tagline)}</p>` : ""}
          <h3 class="font-display text-bone mt-2 leading-tight tracking-tight text-3xl md:text-4xl">${escHtml(row.name)}</h3>
          ${row.alias ? `<p class="jc-caption-serif text-gold-400 mt-1 italic">— under the alias ${escHtml(row.alias)}</p>` : ""}
          ${row.credentials ? `<p class="text-bone/70 text-sm font-light leading-relaxed mt-4">${escHtml(row.credentials)}</p>` : ""}
          ${row.bio ? `<p class="text-bone/55 text-sm font-light leading-relaxed mt-2">${escHtml(row.bio)}</p>` : ""}
          ${genres ? `<div class="flex flex-wrap gap-2 mt-5">${genres}</div>` : ""}
          ${links.length ? `<div class="mt-6 flex items-center gap-4 text-bone/55">${links.join("")}</div>` : ""}
        </div>
      </article>`;
  }

  async function hydrateEvents() {
    if (!window.SB) return;
    const upcomingHost = document.querySelector("[data-bind-drift-upcoming]");
    const pastHost     = document.querySelector("[data-bind-drift-past]");
    if (!upcomingHost && !pastHost) return;

    const { data, error } = await window.SB
      .from("drift_events")
      .select("*")
      .eq("is_published", true)
      .order("event_date", { ascending: false, nullsFirst: false });
    if (error || !data) return;

    const now = Date.now();
    const upcoming = data
      .filter(r => !r.event_date || +new Date(r.event_date) >= now)
      .sort((a, b) => {
        const ad = a.event_date ? +new Date(a.event_date) : Infinity;
        const bd = b.event_date ? +new Date(b.event_date) : Infinity;
        return ad - bd;
      });
    const past = data
      .filter(r => r.event_date && +new Date(r.event_date) < now)
      .sort((a, b) => +new Date(b.event_date) - +new Date(a.event_date));

    if (upcomingHost) {
      if (upcoming.length) {
        upcomingHost.innerHTML = upcoming.map(renderUpcoming).join("");
        upcomingHost.querySelectorAll(".jc-reveal").forEach(el => el.classList.add("is-visible"));
      } else {
        upcomingHost.innerHTML = `<li class="text-bone/55 font-light text-center py-16 jc-reveal is-visible">No nights on the calendar yet. <a href="mailto:concierge@juniper.club" class="underline decoration-gold-400/60 underline-offset-4 hover:text-bone">Ask the concierge</a> when the next one drops.</li>`;
      }
    }
    if (pastHost) {
      if (past.length) {
        pastHost.innerHTML = past.map(renderPast).join("");
        pastHost.querySelectorAll(".jc-reveal").forEach(el => el.classList.add("is-visible"));
      } else {
        pastHost.innerHTML = `<li class="text-bone/55 font-light text-center py-12 jc-reveal is-visible">The archive is still warming up.</li>`;
      }
    }
  }

  async function hydrateDjs() {
    if (!window.SB) return;
    const host = document.querySelector("[data-bind-drift-djs]");
    if (!host) return;
    const { data, error } = await window.SB
      .from("drift_djs")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: false });
    if (error || !data?.length) return;
    host.innerHTML = data.map(renderDj).join("");
    host.querySelectorAll(".jc-reveal").forEach(el => el.classList.add("is-visible"));
  }

  function init() {
    hydrateEvents().catch(err => console.warn("[drift] events:", err?.message || err));
    hydrateDjs().catch(err => console.warn("[drift] djs:", err?.message || err));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
