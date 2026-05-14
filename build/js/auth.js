// Auth helpers around Supabase.  Exposes window.JCAuth.
window.JCAuth = (() => {
  const requireSB = () => {
    if (!window.SB) throw new Error("Supabase not configured. Edit js/config.js with your project URL + anon key.");
    return window.SB;
  };

  async function signUp({ email, password, fullName }) {
    const SB = requireSB();
    return SB.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.JC_CONFIG.SITE_URL}/login.html`,
        data: { full_name: fullName || null },
      },
    });
  }

  async function signIn({ email, password }) {
    const SB = requireSB();
    return SB.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    const SB = requireSB();
    return SB.auth.signOut();
  }

  async function resetPassword(email) {
    const SB = requireSB();
    return SB.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.JC_CONFIG.SITE_URL}/login.html`,
    });
  }

  async function getUser() {
    if (!window.SB) return null;
    const { data } = await window.SB.auth.getUser();
    return data?.user ?? null;
  }

  async function getProfile() {
    const u = await getUser();
    if (!u) return null;
    const { data, error } = await window.SB
      .from("profiles")
      .select("*")
      .eq("user_id", u.id)
      .single();
    if (error) {
      console.warn("[JC] getProfile:", error.message);
      return null;
    }
    return data;
  }

  // Page guards
  async function requireAuth(redirectTo = "login.html") {
    const u = await getUser();
    if (!u) {
      const target = encodeURIComponent(location.pathname + location.search);
      location.replace(`${redirectTo}?next=${target}`);
      return null;
    }
    return u;
  }

  async function requireAdmin(redirectTo = "login.html") {
    const u = await requireAuth(redirectTo);
    if (!u) return null;
    const p = await getProfile();
    if (!p?.is_admin) {
      alert("Admin access required.");
      location.replace("index.html");
      return null;
    }
    return p;
  }

  // Subscribe to auth state for live UI updates
  function onAuthChange(handler) {
    if (!window.SB) return () => {};
    const { data: sub } = window.SB.auth.onAuthStateChange((_event, session) => handler(session?.user ?? null));
    return () => sub?.subscription?.unsubscribe?.();
  }

  return {
    signUp, signIn, signOut, resetPassword,
    getUser, getProfile,
    requireAuth, requireAdmin, onAuthChange,
  };
})();
