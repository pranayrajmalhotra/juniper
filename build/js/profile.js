// /profile.html — gate behind auth, render real profile data, allow edits.
(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const setText = (sel, val) => { const el = $(sel); if (el && val != null) el.textContent = val; };

  function fmtJoined(iso) { if (!iso) return "Member"; try { return "Since " + new Date(iso).getFullYear(); } catch { return ""; } }
  function fmtRenewal(joinedIso) {
    if (!joinedIso) return "—";
    try { const d = new Date(joinedIso); d.setFullYear(d.getFullYear() + 1); return d.toLocaleDateString(undefined, { month: "long", year: "numeric" }); }
    catch { return "—"; }
  }
  function tierLabel(t) { if (!t) return "Member"; return t.charAt(0).toUpperCase() + t.slice(1) + " Member"; }
  function statusBadge(s) {
    const map = {
      active:   { label: "Subscription Active",   color: "#436559", chipBg: "rgba(67,101,89,0.12)",  icon: "check_circle" },
      expired:  { label: "Subscription Expired",  color: "#ba1a1a", chipBg: "rgba(186,26,26,0.10)",  icon: "error" },
      inactive: { label: "Subscription Inactive", color: "#717974", chipBg: "rgba(113,121,116,0.12)", icon: "pause_circle" },
    };
    return map[s] || { label: s || "—", color: "#717974", chipBg: "rgba(113,121,116,0.12)", icon: "help" };
  }
  function daysUntil(iso) {
    if (!iso) return null;
    const d = new Date(iso); d.setFullYear(d.getFullYear() + 1);
    return Math.ceil((d - new Date()) / 86400000);
  }
  function bust(url) { if (!url) return url; return url + (url.includes("?") ? "&" : "?") + "t=" + Date.now(); }

  let currentProfile = null;

  function paint(profile) {
    setText("[data-bind='full_name']",  profile.full_name || "Member");
    setText("[data-bind='tier_label']", tierLabel(profile.subscription_tier));
    setText("[data-bind='joined']",     fmtJoined(profile.joined_at));

    const sb = statusBadge(profile.subscription_status);
    const sbEl = $("[data-bind='status_label']");
    if (sbEl) { sbEl.textContent = sb.label; sbEl.style.color = sb.color; }
    const chipEl = $("[data-bind='status_chip']");
    if (chipEl) { chipEl.classList.remove("bg-secondary-container/30"); chipEl.style.backgroundColor = sb.chipBg; }
    const iconEl = $("[data-bind='status_icon']");
    if (iconEl) { iconEl.textContent = sb.icon; iconEl.style.color = sb.color; }
    setText("[data-bind='status_until']", "Active until " + fmtRenewal(profile.joined_at) + ".");
    setText("[data-bind='renewal']", fmtRenewal(profile.joined_at));
    setText("[data-bind='email']", profile.email);

    const renewCard = $("[data-bind='renewal_card']");
    const days = daysUntil(profile.joined_at);
    if (renewCard) {
      if (days != null && days <= 60 && days > 0) {
        renewCard.removeAttribute("hidden");
        const daysEl = $("[data-bind='renewal_days']");
        if (daysEl) daysEl.textContent = String(days);
      } else {
        renewCard.setAttribute("hidden", "");
      }
    }

    // Avatar — both the hero image on this page and any topbar avatar
    if (profile.avatar_url) {
      const heroImg = $("[data-bind='avatar_hero']");
      if (heroImg) heroImg.src = profile.avatar_url;
      $$(".jc-topbar-avatar").forEach(img => { img.src = profile.avatar_url; });
    }
  }

  /* ---------- Edit-profile flow ---------- */
  function openEditor() {
    const panel = $("#edit-panel");
    if (!panel) return;
    $("#edit-name").value = currentProfile?.full_name || "";
    const preview = $("#edit-avatar-preview");
    if (preview && currentProfile?.avatar_url) preview.src = currentProfile.avatar_url;
    panel.removeAttribute("hidden");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
    $("#edit-name").focus();
  }
  function closeEditor() { $("#edit-panel")?.setAttribute("hidden", ""); }

  function showStatus(msg, kind) {
    const el = $("#edit-status");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden", "text-error", "text-secondary");
    el.classList.add(kind === "ok" ? "text-secondary" : "text-error");
  }

  async function uploadAvatarIfPicked(userId) {
    const fileInput = $("#edit-avatar");
    const file = fileInput?.files?.[0];
    if (!file) return null;

    if (!file.type.startsWith("image/")) throw new Error("Please pick an image file.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB.");

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/avatar.${ext}`;

    const { error } = await window.SB.storage.from("avatars").upload(path, file, {
      upsert: true, cacheControl: "3600", contentType: file.type,
    });
    if (error) {
      if (error.statusCode === "404" || /bucket/i.test(error.message)) {
        throw new Error("Avatars storage isn't set up yet. Ask your admin to run the storage SQL block.");
      }
      throw error;
    }

    const { data: pub } = window.SB.storage.from("avatars").getPublicUrl(path);
    return bust(pub.publicUrl);
  }

  async function save(e) {
    e.preventDefault();
    const btn = $("#edit-save");
    btn.disabled = true; btn.textContent = "Saving…";
    showStatus("", "ok");

    try {
      const user = await window.JCAuth.getUser();
      if (!user) throw new Error("Session expired. Please sign in again.");

      const newName = $("#edit-name").value.trim();
      const patch = { full_name: newName || null };

      const newAvatar = await uploadAvatarIfPicked(user.id);
      if (newAvatar) patch.avatar_url = newAvatar;

      const { data, error } = await window.SB
        .from("profiles")
        .update(patch)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (error) throw error;

      currentProfile = data;
      paint(data);
      showStatus("Saved.", "ok");
      setTimeout(closeEditor, 600);
    } catch (err) {
      showStatus(err.message || "Could not save changes.", "err");
    } finally {
      btn.disabled = false; btn.textContent = "Save";
    }
  }

  function previewAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { $("#edit-avatar-preview").src = reader.result; };
    reader.readAsDataURL(file);
  }

  /* ---------- Init ---------- */
  async function init() {
    if (!window.SB || !window.JCAuth) return;
    const user = await window.JCAuth.requireAuth("login.html");
    if (!user) return;

    currentProfile = await window.JCAuth.getProfile();
    if (!currentProfile) return;
    paint(currentProfile);

    $("#open-editor")?.addEventListener("click", openEditor);
    $$("#edit-cancel, #edit-cancel-2").forEach(b => b.addEventListener("click", closeEditor));
    $("#edit-form")?.addEventListener("submit", save);
    $("#edit-avatar")?.addEventListener("change", previewAvatar);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
