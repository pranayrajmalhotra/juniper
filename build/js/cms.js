// Generic CMS access for client_logos & member_favourites tables.
window.JCCms = (() => {
  const requireSB = () => { if (!window.SB) throw new Error("Supabase not configured"); return window.SB; };

  // ---- client_logos ----
  async function listLogosPublic() {
    if (!window.SB) return { data: [], error: { message: "Supabase not configured" } };
    return window.SB.from("client_logos").select("*").eq("is_published", true).order("display_order", { ascending: false });
  }
  async function listLogosAll() {
    return requireSB().from("client_logos").select("*").order("display_order", { ascending: false });
  }
  async function createLogo(row) {
    return requireSB().from("client_logos").insert(row).select().single();
  }
  async function updateLogo(id, patch) {
    return requireSB().from("client_logos").update(patch).eq("id", id).select().single();
  }
  async function removeLogo(id) {
    return requireSB().from("client_logos").delete().eq("id", id);
  }

  // ---- member_favourites ----
  async function listFavouritesPublic() {
    if (!window.SB) return { data: [], error: { message: "Supabase not configured" } };
    return window.SB.from("member_favourites").select("*").eq("is_published", true).order("display_order", { ascending: false });
  }
  async function listFavouritesAll() {
    return requireSB().from("member_favourites").select("*").order("display_order", { ascending: false });
  }
  async function createFavourite(row) {
    return requireSB().from("member_favourites").insert(row).select().single();
  }
  async function updateFavourite(id, patch) {
    return requireSB().from("member_favourites").update(patch).eq("id", id).select().single();
  }
  async function removeFavourite(id) {
    return requireSB().from("member_favourites").delete().eq("id", id);
  }

  // ---- drift_djs ----
  async function listDjsPublic() {
    if (!window.SB) return { data: [], error: { message: "Supabase not configured" } };
    return window.SB.from("drift_djs").select("*").eq("is_published", true).order("display_order", { ascending: false });
  }
  async function listDjsAll() {
    return requireSB().from("drift_djs").select("*").order("display_order", { ascending: false });
  }
  async function createDj(row)         { return requireSB().from("drift_djs").insert(row).select().single(); }
  async function updateDj(id, patch)   { return requireSB().from("drift_djs").update(patch).eq("id", id).select().single(); }
  async function removeDj(id)          { return requireSB().from("drift_djs").delete().eq("id", id); }

  // ---- drift_events ----
  async function listEventsPublic() {
    if (!window.SB) return { data: [], error: { message: "Supabase not configured" } };
    return window.SB.from("drift_events").select("*").eq("is_published", true).order("event_date", { ascending: false });
  }
  async function listEventsAll() {
    return requireSB().from("drift_events").select("*").order("event_date", { ascending: false, nullsFirst: false });
  }
  async function createEvent(row)       { return requireSB().from("drift_events").insert(row).select().single(); }
  async function updateEvent(id, patch) { return requireSB().from("drift_events").update(patch).eq("id", id).select().single(); }
  async function removeEvent(id)        { return requireSB().from("drift_events").delete().eq("id", id); }

  // ---- drift storage upload ----
  async function uploadDriftImage(file, prefix = "uploads") {
    const SB = requireSB();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await SB.storage.from("drift").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
    if (upErr) return { data: null, error: upErr };
    const { data } = SB.storage.from("drift").getPublicUrl(path);
    return { data: { path, publicUrl: data.publicUrl }, error: null };
  }

  // ---- logos storage upload ----
  async function uploadLogoImage(file, prefix = "uploads") {
    const SB = requireSB();
    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await SB.storage.from("logos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
    if (upErr) return { data: null, error: upErr };
    const { data } = SB.storage.from("logos").getPublicUrl(path);
    return { data: { path, publicUrl: data.publicUrl }, error: null };
  }

  // ---- site_content (generic per-section editable copy) ----
  async function listSiteContentAll() {
    return requireSB().from("site_content").select("*")
      .order("page", { ascending: true })
      .order("display_order", { ascending: true })
      .order("section", { ascending: true });
  }
  async function updateSiteContent(id, patch) {
    return requireSB().from("site_content").update(patch).eq("id", id).select().single();
  }

  return {
    siteContent: { listAll: listSiteContentAll, update: updateSiteContent },
    logos:       { listPublic: listLogosPublic, listAll: listLogosAll, create: createLogo, update: updateLogo, remove: removeLogo },
    favourites:  { listPublic: listFavouritesPublic, listAll: listFavouritesAll, create: createFavourite, update: updateFavourite, remove: removeFavourite },
    driftDjs:    { listPublic: listDjsPublic,    listAll: listDjsAll,    create: createDj,    update: updateDj,    remove: removeDj    },
    driftEvents: { listPublic: listEventsPublic, listAll: listEventsAll, create: createEvent, update: updateEvent, remove: removeEvent },
    uploadDriftImage,
    uploadLogoImage,
  };
})();
