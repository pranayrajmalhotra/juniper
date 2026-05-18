// Juniper Club — build script
// Renders the full shell (head + topbar + drawer + bottom nav + scripts) around each page's
// <main> content. Stitch-sourced pages have their <main> extracted from the source after
// link/image hygiene; events/support read from pages/<name>.main.html fragments.
//
// Run: node build-site.mjs

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";

const SRC  = "C:/Users/Public/juniper/stitch_juniper_club";
const FRAG = "C:/Users/Public/juniper/pages";
const OUT  = "C:/Users/Public/juniper/build";

mkdirSync(`${OUT}/assets`, { recursive: true });
copyFileSync(`${SRC}/juniper_club_logo_final.png/screen.png`, `${OUT}/assets/logo.png`);
copyFileSync(`${SRC}/evergreen_reserve/DESIGN.md`,            `${OUT}/design-system.md`);

// ─── topbar widget slots ─────────────────────────────────────────────────────
const SEARCH_TRIGGER = `<button id="search-trigger" class="material-symbols-outlined text-emerald-900 dark:text-emerald-50 hover:opacity-80 transition-opacity bg-transparent border-0 p-0 cursor-pointer" aria-label="Search venues">search</button>`;

// ─── page config ─────────────────────────────────────────────────────────────
const PAGES = [
  {
    id: "home", out: "index.html",
    title: "Juniper Club — A Modern Concierge",
    description: "Juniper Club is a private concierge for the city's most refined venues — exclusive offers, curated partners and bespoke private events.",
    mainFrag: "index.main.html",
    scripts: ["js/topnav.js", "js/home.js"],
  },
  {
    id: "directory", out: "directory.html",
    title: "Partner Directory · Juniper Club",
    description: "Explore the Juniper Club partner directory — restaurants, bars, lounges, cafés and wellness venues curated for our members.",
    mainFrag: "directory.main.html",
    scripts: ["js/topnav.js", "js/directory.js"],
  },
  {
    id: "offers", out: "offers.html",
    title: "Member Offers · Juniper Club",
    description: "Every benefit available to Juniper Club members across our partner venues — complimentary tastings, priority access, member-only menus.",
    mainFrag: "offers.main.html",
    scripts: ["js/topnav.js", "js/offers.js"],
  },
  {
    id: "venue", out: "venue.html",
    title: "Partner Venue · Juniper Club",
    description: "A Juniper Club partner venue — member benefits, location and how to redeem your offer.",
    mainFrag: "venue.main.html",
    scripts: ["js/topnav.js", "js/venue.js"],
  },
  {
    id: "profile", out: "profile.html",
    title: "Member Profile · Juniper Club",
    description: "Manage your Juniper Club membership — subscription, partner benefits, private events and concierge support.",
    mainFrag: "profile.main.html",
    scripts: ["js/auth.js", "js/topnav.js", "js/profile.js"],
    includeAuthHandler: true,
  },
  {
    id: "events", out: "events.html",
    title: "Private Events · Juniper Club",
    description: "Juniper Club members may take over partner venues for private gatherings, with a dedicated concierge planning every detail.",
    mainFrag: "events.main.html",
    scripts: ["js/topnav.js"],
  },
  {
    id: "drift", out: "drift.html",
    title: "DRIFT · After-hours sound · Juniper Club",
    description: "DRIFT is Juniper Club's after-hours residency — a small, selectively-booked rotation of DJs across our partner rooms.",
    mainFrag: "drift.main.html",
    scripts: ["js/topnav.js", "js/drift.js"],
    bodyClass: "drift-page",
  },
  {
    id: "support", out: "support.html",
    title: "Concierge & Support · Juniper Club",
    description: "Help, account assistance and direct concierge contact for Juniper Club members.",
    mainFrag: "support.main.html",
    scripts: ["js/topnav.js"],
    extraStyles: `details summary::-webkit-details-marker { display: none; }
  details summary::after { content: "+"; margin-left: auto; font-size: 24px; line-height: 1; transition: transform 200ms; }
  details[open] summary::after { content: "−"; }`,
  },
];

const escAttr = s => String(s).replace(/"/g, "&quot;");

// ─── head ────────────────────────────────────────────────────────────────────
// Tailwind is built from src/tailwind.css → build/css/tailwind.css via
// `npm run build:css` (or `npm run build`). Project utilities (editorial-shadow,
// material-symbols-outlined, etc.) live in that file under @layer components.
function renderHead(page) {
  const extra = page.extraStyles ? `<style>\n  ${page.extraStyles}\n</style>` : "";
  return `<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>
<title>${page.title}</title>
<meta name="description" content="${escAttr(page.description)}"/>
<link rel="icon" type="image/png" href="assets/logo.png"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..900,30..100,0..1;1,9..144,300..900,30..100,0..1&amp;family=Manrope:wght@300;400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="css/tailwind.css"/>
${extra}
</head>`;
}

// ─── masthead (live editorial strip above the topbar) ────────────────────────
function renderMasthead() {
  // site-fx.js doubles the track contents at runtime for seamless looping.
  const phrase = `<span>Juniper Club <em>·</em> Volume XII <em>·</em> Members Only <em>·</em> Reservations after dusk <em>·</em> Established <span data-jc-year>2025</span></span>`;
  return `<div class="jc-masthead" aria-hidden="true"><div class="jc-masthead-track">${phrase}</div></div>`;
}

// ─── topbar ──────────────────────────────────────────────────────────────────
function topbarLink(href, label, isActive) {
  const base = "jc-navlink font-label uppercase tracking-[0.22em] text-[10px] font-semibold transition-colors";
  const cls = isActive
    ? `${base} text-primary`
    : `${base} text-primary/55 hover:text-primary`;
  const aria = isActive ? ` aria-current="page"` : "";
  return `<a class="${cls}"${aria} href="${href}">${label}</a>`;
}

function renderTopbar(page) {
  const desktopNav = [
    ["index.html",     "Home",      "home"],
    ["directory.html", "Directory", "directory"],
    ["offers.html",    "Offers",    "offers"],
    ["events.html",    "Events",    "events"],
    ["drift.html",     "Drift",     "drift"],
  ].map(([href, label, id]) => topbarLink(href, label, page.id === id)).join("\n");

  const extras = page.topbarExtras ? `\n${page.topbarExtras}` : "";

  return `<!-- TopAppBar -->
<header class="jc-topbar fixed left-0 right-0 z-50 bg-surface/85 backdrop-blur-xl flex justify-between items-center px-6 md:px-10 h-16 border-b border-primary/10" style="top: 28px;">
<div class="flex items-center gap-5">
<button class="md:hidden material-symbols-outlined text-primary hover:opacity-80 transition-opacity bg-transparent border-0 p-0 cursor-pointer" data-drawer-open aria-label="Open menu" aria-controls="jc-drawer" aria-expanded="false">menu</button>
<a href="index.html" aria-label="Juniper Club home" class="flex items-center">
<img src="assets/logo.png" alt="Juniper Club" class="h-10 w-10 rounded-full bg-primary/5"/>
</a>
</div>
<div class="flex items-center gap-8">
<nav class="hidden md:flex gap-10 items-center" aria-label="Primary">
${desktopNav}
</nav>${extras}
<div class="hidden md:flex items-center gap-5 pl-6 ml-2 border-l border-primary/15">
<a id="nav-signin" class="jc-navlink font-label uppercase tracking-[0.22em] text-[10px] font-semibold text-primary/55 hover:text-primary transition-colors" href="login.html">Sign in</a>
<a id="nav-apply" class="jc-btn jc-btn--ghost text-primary !py-2 !px-4 !text-[9px]" href="signup.html"><span>Apply</span></a>
<a id="nav-account" hidden class="jc-navlink font-label uppercase tracking-[0.22em] text-[10px] font-semibold text-primary hover:text-primary/70 transition-colors" href="profile.html"><span id="nav-account-name">Account</span></a>
<a id="nav-signout" hidden href="#" class="jc-navlink font-label uppercase tracking-[0.22em] text-[10px] font-semibold text-primary/55 hover:text-primary transition-colors">Sign out</a>
</div>
<a id="nav-avatar" href="profile.html" aria-label="View member profile" hidden class="w-10 h-10 rounded-full overflow-hidden bg-surface-container ring-1 ring-primary/15 hover:ring-primary/40 transition-all block">
<img class="jc-topbar-avatar w-full h-full object-cover" alt="Member avatar" src="assets/logo.png"/>
</a>
</div>
</header>`;
}

// ─── drawer ──────────────────────────────────────────────────────────────────
const DRAWER_ITEMS = [
  { id: "home",      label: "Home",            icon: "style",               href: "index.html"     },
  { id: "directory", label: "Partner Portals", icon: "corporate_fare",      href: "directory.html" },
  { id: "offers",    label: "Member Offers",   icon: "confirmation_number", href: "offers.html"    },
  { id: "profile",   label: "Member Account",  icon: "card_membership",     href: "profile.html"   },
  { id: "events",    label: "Private Events",  icon: "event_seat",          href: "events.html"    },
  { id: "drift",     label: "Drift · After Dark", icon: "graphic_eq",       href: "drift.html"     },
  { id: "support",   label: "Support",         icon: "help_outline",        href: "support.html"   },
];

function renderDrawer(page) {
  const items = DRAWER_ITEMS.map(it => {
    const active = it.id === page.id;
    const cls = active
      ? "flex items-center gap-4 p-4 rounded-xl bg-emerald-100 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-50 font-semibold transition-all"
      : "flex items-center gap-4 p-4 rounded-xl text-emerald-700 dark:text-emerald-300 hover:bg-white/50 dark:hover:bg-emerald-800/50 transition-all";
    const aria = active ? ` aria-current="page"` : "";
    return `      <a class="${cls}"${aria} href="${it.href}">
        <span class="material-symbols-outlined">${it.icon}</span>
        <span class="font-sans text-sm tracking-wide">${it.label}</span>
      </a>`;
  }).join("\n");

  return `<!-- Drawer overlay -->
<div class="jc-drawer-overlay fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300"></div>
<!-- Drawer -->
<aside id="jc-drawer" class="jc-drawer fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-emerald-50 dark:bg-emerald-950 shadow-2xl z-[60] -translate-x-full transition-transform duration-300 ease-out">
  <div class="flex flex-col h-full p-6">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-3">
        <img src="assets/logo.png" alt="Juniper Club" class="h-8 w-8 rounded-full bg-emerald-100"/>
        <span class="font-serif italic font-bold text-emerald-900 dark:text-emerald-100 tracking-tighter text-lg">JUNIPER CLUB</span>
      </div>
      <button class="jc-drawer-close p-2 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors" aria-label="Close menu">
        <span class="material-symbols-outlined text-emerald-900 dark:text-emerald-100">close</span>
      </button>
    </div>
    <nav class="space-y-2" aria-label="Drawer">
${items}
    </nav>
    <div class="mt-auto pt-6 text-[10px] uppercase tracking-[0.18em] text-emerald-800/40 dark:text-emerald-200/40 font-medium">
      © Juniper Club
    </div>
  </div>
</aside>`;
}

// ─── bottom nav ──────────────────────────────────────────────────────────────
const BOTTOM_ITEMS = [
  { id: "home",      label: "Home",      icon: "style",               iconActive: "style",               href: "index.html"     },
  { id: "directory", label: "Directory", icon: "explore",             iconActive: "explore",             href: "directory.html" },
  { id: "offers",    label: "Offers",    icon: "confirmation_number", iconActive: "confirmation_number", href: "offers.html"    },
  { id: "profile",   label: "Profile",   icon: "account_circle",      iconActive: "account_circle",      href: "profile.html"   },
];

function renderBottomNav(page) {
  const items = BOTTOM_ITEMS.map(it => {
    const active = it.id === page.id;
    const aria = active ? ` aria-current="page"` : "";
    return `  <a${aria} href="${it.href}">
    <span class="material-symbols-outlined">${it.icon}</span>
    <span>${it.label}</span>
  </a>`;
  }).join("\n");

  return `<!-- BottomNavBar (floating pill, mobile-only) -->
<nav class="jc-bottomnav md:hidden" aria-label="Bottom navigation">
${items}
</nav>`;
}

// ─── scripts ─────────────────────────────────────────────────────────────────
const AUTH_HANDLER = `<script>
/* jc-auth-handler */
(() => {
  const btn = document.getElementById("profile-signout");
  if (btn) btn.addEventListener("click", async () => {
    if (!confirm("Sign out of Juniper Club?")) return;
    try { await window.JCAuth?.signOut(); } catch {}
    location.href = "login.html";
  });
})();
</script>`;

function renderScripts(page) {
  const pageScripts = page.scripts.map(s => `<script src="${s}"></script>`).join("\n");
  return `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/config.js"></script>
<script src="js/supabase-client.js"></script>
${pageScripts}
<script src="js/shell-drawer.js"></script>
<script src="js/site-fx.js"></script>
<script src="js/cms-render.js"></script>
${page.includeAuthHandler ? AUTH_HANDLER : ""}`;
}

// ─── shell ───────────────────────────────────────────────────────────────────
function renderShell({ page, main }) {
  const bodyCls = page.bodyClass
    ? `bg-surface text-on-surface font-body ${page.bodyClass}`
    : "bg-surface text-on-surface font-body";
  return `<!DOCTYPE html>
<html lang="en" data-page="${page.id}">
${renderHead(page)}
<body class="${bodyCls}">
<div class="jc-grain" aria-hidden="true"></div>
${renderMasthead()}
${renderTopbar(page)}
${main}
${renderDrawer(page)}
${renderBottomNav(page)}
${renderScripts(page)}
</body>
</html>
`;
}

// ─── badge a11y: add aria-label to visual status pills ───────────────────────
const BADGE_LABELS = [
  { text: "Platinum Offer",  label: "Tier: Platinum offer"   },
  { text: "Platinum Member", label: "Member tier: Platinum"  },
  { text: "Gold Member",     label: "Member tier: Gold"      },
  { text: "Silver Member",   label: "Member tier: Silver"    },
];

function applyBadgeA11y(html) {
  for (const { text, label } of BADGE_LABELS) {
    const re = new RegExp(`(<(?:div|span|p)\\b)([^>]*?)(>)\\s*${text}\\s*(</(?:div|span|p)>)`, "g");
    html = html.replace(re, (m, openStart, attrs, gt, close) => {
      if (/\baria-label=/.test(attrs)) return m;
      return `${openStart}${attrs} aria-label="${label}"${gt}${text}${close}`;
    });
  }
  return html;
}

// ─── Stitch <main> extraction with link/image hygiene ────────────────────────
function stitchMain(stitchPath) {
  let html = readFileSync(stitchPath, "utf8");

  // Strip Stitch empty styles
  html = html.replace(/\s+style=""/g, "");
  html = html.replace(/\s+style="\s*"/g, "");

  // data-alt → alt (avoid duplicate alt)
  html = html.replace(/<img\b([^>]*)>/g, (m, attrs) => {
    if (/\balt=/.test(attrs)) {
      return "<img" + attrs.replace(/\s+data-alt="[^"]*"/g, "") + ">";
    }
    return "<img" + attrs.replace(/\bdata-alt=/, "alt=") + ">";
  });

  // Rewire href="#" by visible text label
  function rewireLink(html, labels, target) {
    return html.replace(
      /<a\b([^>]*)\bhref="#"([^>]*)>([\s\S]*?)<\/a>/g,
      (full, before, after, inner) => {
        const text = inner.replace(/<[^>]+>/g, "").trim();
        if (labels.some(l => text === l || text.toLowerCase() === l.toLowerCase())) {
          return `<a${before}href="${target}"${after}>${inner}</a>`;
        }
        return full;
      }
    );
  }
  html = rewireLink(html, ["Home"],                                                          "index.html");
  html = rewireLink(html, ["Directory", "Partner Portals", "Explore Directory"],              "directory.html");
  html = rewireLink(html, ["Offers", "Member Offers"],                                        "offers.html");
  html = rewireLink(html, ["Profile", "Member Account", "Member Benefits", "Subscription"],   "profile.html");
  html = rewireLink(html, ["Events", "Private Events"],                                       "events.html");
  html = rewireLink(html, ["Support", "Help Center"],                                         "support.html");

  // Back arrow (offers) → index.html
  html = html.replace(
    /<button\b([^>]*)>\s*<span\b[^>]*>arrow_back<\/span>\s*<\/button>/g,
    `<a href="index.html" aria-label="Back to home"$1>\n<span class="material-symbols-outlined">arrow_back</span>\n</a>`
  );

  // Extract <main>...</main>
  const m = html.match(/<main\b[\s\S]*?<\/main>/i);
  if (!m) throw new Error(`No <main> in ${stitchPath}`);
  return applyBadgeA11y(m[0]);
}

// ─── build ───────────────────────────────────────────────────────────────────
for (const p of PAGES) {
  const main = p.src
    ? stitchMain(`${SRC}/${p.src}`)
    : applyBadgeA11y(readFileSync(`${FRAG}/${p.mainFrag}`, "utf8").trim());
  const html = renderShell({ page: p, main });
  writeFileSync(`${OUT}/${p.out}`, html);
  console.log(`✓ ${p.out}  (${html.length} bytes)`);
}

console.log(`\nBuild done → ${OUT}`);
