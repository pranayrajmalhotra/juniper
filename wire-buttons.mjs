// One-shot fix-up: wire all dead href="#" links to real pages,
// turn dead <button> CTAs into <a>s where appropriate.

import { readFileSync, writeFileSync } from "node:fs";

const SRC = "C:/Users/Public/juniper/build";

// Map text labels to destinations.
const TEXT_TARGETS = [
  // Order matters — most specific first
  { labels: ["View Offer"],          href: "offers.html"   },
  { labels: ["Book Table"],          href: "events.html"   },
  { labels: ["Inquire Now"],         href: "events.html"   },
  { labels: ["Request Invite"],      href: "events.html"   },
  { labels: ["View Benefits"],       href: "directory.html"},
  { labels: ["Renew Now"],           href: "support.html"  },
  { labels: ["Help Center"],         href: "support.html"  },
  { labels: ["Chat with Julian", "Chat with Concierge"], href: "support.html" },

  // Bottom-nav / drawer labels (still active on some pages)
  { labels: ["Home"],                href: "index.html"     },
  { labels: ["Directory"],           href: "directory.html" },
  { labels: ["Offers"],              href: "offers.html"    },
  { labels: ["Profile"],             href: "profile.html"   },
  { labels: ["Member Benefits"],     href: "directory.html" },
  { labels: ["Partner Portals"],     href: "directory.html" },
  { labels: ["Member Offers"],       href: "offers.html"    },
  { labels: ["Member Account"],      href: "profile.html"   },
  { labels: ["Subscription"],        href: "profile.html"   },
  { labels: ["Private Events"],      href: "events.html"    },
  { labels: ["Support"],             href: "support.html"   },
];

// Extract the visible "label" text from an anchor's inner HTML, ignoring
// material-symbols icon spans (their text is the icon name, not the label).
function extractLabel(inner) {
  const cleaned = inner.replace(
    /<span[^>]*class="[^"]*material-symbols-outlined[^"]*"[^>]*>[\s\S]*?<\/span>/g, ""
  );
  return cleaned.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function rewireAnchorsByText(html) {
  return html.replace(
    /<a\b([^>]*)\bhref="#"([^>]*)>([\s\S]*?)<\/a>/g,
    (full, before, after, inner) => {
      const text = extractLabel(inner);
      for (const t of TEXT_TARGETS) {
        if (t.labels.some(l => text === l || text.toLowerCase() === l.toLowerCase())) {
          return `<a${before}href="${t.href}"${after}>${inner}</a>`;
        }
      }
      return full;
    }
  );
}

// Convert specific <button> CTAs to <a href=…> for navigation.
function rewireButtonsByText(html) {
  return html.replace(
    /<button\b([^>]*)>((?:(?!<button)[\s\S])*?)<\/button>/g,
    (full, attrs, inner) => {
      // Don't touch buttons that already have id, type=submit/reset, or class hooks
      if (/\bid=/.test(attrs)) return full;
      if (/\btype=/.test(attrs)) return full;
      if (/jc-drawer-close|tab-btn|toggle-admin|v-toggle|v-delete/.test(attrs)) return full;

      const text = inner.replace(/<[^>]+>/g, "").trim();
      for (const t of TEXT_TARGETS) {
        if (t.labels.some(l => text === l || text.toLowerCase() === l.toLowerCase())) {
          // Strip class duplicates like active:scale-95 etc — keep all
          return `<a href="${t.href}"${attrs} role="button">${inner}</a>`;
        }
      }
      return full;
    }
  );
}

// Tight non-nested button match — refuses to cross into a sibling <button>.
const BTN_RE = (label) =>
  new RegExp(`<button\\b([^>]*)>((?:(?!<button)[\\s\\S])*?${label}(?:(?!<button)[\\s\\S])*?)<\\/button>`, "g");

// Add Google Maps link to "Open in Maps" button on offer pages
function wireMapsLink(html, query) {
  return html.replace(BTN_RE("Open in Maps"), (full, attrs, inner) => {
    if (/\bhref=/.test(attrs)) return full; // already an anchor-style or pre-wired
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    return `<a href="${url}" target="_blank" rel="noopener"${attrs} role="button">${inner}</a>`;
  });
}

// "Redeem Offer" — turn into a button with onclick that flashes a member pass alert.
function wireRedeem(html) {
  return html.replace(BTN_RE("Redeem Offer"), (full, attrs, inner) => {
    if (/\bonclick=/.test(attrs)) return full; // already wired
    const onclick = `onclick="alert('Show this screen to the venue host.\\n\\nMember: Julian Walters\\nValid until: 31 Dec 2025\\nOffer: Active');"`;
    return `<button${attrs} ${onclick}>${inner}</button>`;
  });
}

// Sign Out on profile.html: hook to JCAuth.signOut()
function wireSignOut(html) {
  return html.replace(
    /<button\b([^>]*)>((?:(?!<button)[\s\S])*?<span[^>]*>logout<\/span>(?:(?!<button)[\s\S])*?)<\/button>/g,
    (full, attrs, inner) => {
      if (/\bid=/.test(attrs)) return full;
      return `<button${attrs} id="profile-signout" type="button">${inner}</button>`;
    }
  );
}

// Inject auth wiring + signout handler at end of body if not present
function injectAuthHandler(html) {
  if (html.includes("/* jc-auth-handler */")) return html;
  const block = `
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/config.js"></script>
<script src="js/supabase-client.js"></script>
<script src="js/auth.js"></script>
<script>
/* jc-auth-handler */
(() => {
  const btn = document.getElementById("profile-signout");
  if (btn) btn.addEventListener("click", async () => {
    if (!confirm("Sign out of Juniper Club?")) return;
    try { await window.JCAuth?.signOut(); } catch {}
    location.href = "login.html";
  });
})();
</script>
`;
  return html.replace(/<\/body>/i, block + "\n</body>");
}

const PAGES = ["index.html", "directory.html", "offers.html", "profile.html", "events.html", "drift.html", "support.html"];

for (const f of PAGES) {
  const path = `${SRC}/${f}`;
  let html = readFileSync(path, "utf8");
  const before = html;

  html = rewireAnchorsByText(html);
  html = rewireButtonsByText(html);

  if (f === "offers.html") {
    html = wireMapsLink(html, "Level 42, The Pinnacle Building, 12 Bishopsgate, London EC2N 4AJ");
    html = wireRedeem(html);
  }
  if (f === "profile.html") {
    html = wireSignOut(html);
    html = injectAuthHandler(html);
  }

  if (html !== before) {
    writeFileSync(path, html);
    console.log(`✓ wired ${f}`);
  } else {
    console.log(`- ${f} unchanged`);
  }
}
