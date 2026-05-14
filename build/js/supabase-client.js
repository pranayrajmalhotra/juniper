// Initializes the Supabase JS client and exposes window.SB.
// Loads after https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2 is on the page.
(() => {
  const cfg = window.JC_CONFIG || {};
  const ok =
    cfg.SUPABASE_URL && cfg.SUPABASE_URL.startsWith("https://") &&
    !cfg.SUPABASE_URL.includes("REPLACE_WITH") &&
    cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.includes("REPLACE_WITH");

  if (!ok) {
    window.SB = null;
    console.warn("[JC] Supabase config missing — auth & venue features disabled. Edit js/config.js and reload.");
    return;
  }

  if (typeof supabase === "undefined" || !supabase.createClient) {
    window.SB = null;
    console.error("[JC] Supabase JS library failed to load. Check that the CDN <script> is present and not blocked.");
    return;
  }

  window.SB = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
})();
