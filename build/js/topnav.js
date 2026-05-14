// Auth-aware top nav swap.
// When signed in: hides #nav-signin / #nav-apply, shows #nav-account, paints `.jc-topbar-avatar`.
// When signed out: opposite, resets avatar to the logo placeholder.
(() => {
  function show(el) { el && el.removeAttribute("hidden"); }
  function hide(el) { el && el.setAttribute("hidden", ""); }
  function bust(url) { if (!url) return url; return url + (url.includes("?") ? "&" : "?") + "t=" + Date.now(); }
  function paintAvatar(url) {
    const src = url || "assets/logo.png";
    document.querySelectorAll(".jc-topbar-avatar").forEach(img => { img.src = src; });
  }

  async function refresh() {
    if (!window.SB) return;            // config missing, leave defaults
    const signin  = document.getElementById("nav-signin");
    const apply   = document.getElementById("nav-apply");
    const account = document.getElementById("nav-account");
    const acctEl  = document.getElementById("nav-account-name");
    const signout = document.getElementById("nav-signout");
    const avatar  = document.getElementById("nav-avatar");

    let user = null;
    try { user = (await window.SB.auth.getUser()).data?.user ?? null; } catch {}

    if (user) {
      hide(signin); hide(apply);
      show(account); show(signout); show(avatar);
      try {
        const { data } = await window.SB.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).single();
        if (acctEl) {
          const first = (data?.full_name || user.email.split("@")[0]).trim().split(/\s+/)[0];
          acctEl.textContent = first;
        }
        paintAvatar(data?.avatar_url ? bust(data.avatar_url) : null);
      } catch {
        if (acctEl) acctEl.textContent = user.email.split("@")[0];
        paintAvatar(null);
      }
    } else {
      show(signin); show(apply);
      hide(account); hide(signout); hide(avatar);
      paintAvatar(null);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh);
  } else {
    refresh();
  }

  // Listen for sign-in/out events from elsewhere
  if (window.SB?.auth?.onAuthStateChange) {
    window.SB.auth.onAuthStateChange(refresh);
  }

  // Wire #nav-signout if present
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("#nav-signout");
    if (!btn) return;
    e.preventDefault();
    if (!confirm("Sign out of Juniper Club?")) return;
    try { await window.SB?.auth?.signOut(); } catch {}
    location.href = "index.html";
  });
})();
