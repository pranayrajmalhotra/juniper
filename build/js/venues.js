// Venue data access — reads/writes venues table via Supabase.
window.JCVenues = (() => {
  const requireSB = () => {
    if (!window.SB) throw new Error("Supabase not configured");
    return window.SB;
  };

  async function listPublic({ limit = 50 } = {}) {
    if (!window.SB) return { data: [], error: { message: "Supabase not configured" } };
    return window.SB
      .from("venues")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: false })
      .limit(limit);
  }

  async function listAll() {
    const SB = requireSB();
    return SB.from("venues").select("*").order("display_order", { ascending: false });
  }

  async function get(id) {
    const SB = requireSB();
    return SB.from("venues").select("*").eq("id", id).single();
  }

  async function create(venue) {
    const SB = requireSB();
    return SB.from("venues").insert(venue).select().single();
  }

  async function update(id, patch) {
    const SB = requireSB();
    return SB.from("venues").update(patch).eq("id", id).select().single();
  }

  async function remove(id) {
    const SB = requireSB();
    return SB.from("venues").delete().eq("id", id);
  }

  function slugify(s) {
    return String(s).toLowerCase()
      .replace(/['"`’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  return { listPublic, listAll, get, create, update, remove, slugify };
})();
