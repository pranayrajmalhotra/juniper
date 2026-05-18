# Juniper Club — Phase 1 Setup

Phase 1 stack: a static frontend (already deployed) + **Supabase** for auth, database and email verification.
Once you complete the steps below, sign-up, login, the admin panel and the venue directory all go live.

---

## 1. Create a Supabase project (2 minutes)

1. Go to **https://supabase.com** → **Start your project** → sign in with GitHub or email.
2. Click **New project**.
   - **Name**: `juniper-club`
   - **Region**: pick the one closest to your users (e.g. **Asia South 1 — Mumbai** or **Singapore**).
   - **Database password**: generate a strong one, **save it somewhere** (you may need it later).
3. Wait ~1 minute for the project to provision.

## 2. Run the SQL migrations

1. In the Supabase dashboard, open the project → left sidebar → **SQL Editor**.
2. Click **New query** and paste the entire contents of `db/001_schema.sql` from this build, then **Run**.
3. Repeat with a **New query** for each remaining migration, **in order**:
   `db/002_seed_venues.sql` → `db/003_avatars.sql` → `db/004_lock_profile_self_update.sql` → `db/005_cms.sql` → `db/006_drift.sql`.

You should now have these tables: `profiles`, `venues` (10 rows), `client_logos`,
`member_favourites`, `drift_djs` and `drift_events`. Verify in the **Table Editor** sidebar.
Every migration is idempotent — safe to re-run if you are unsure whether it applied.

## 3. Configure auth settings

1. Sidebar → **Authentication** → **URL Configuration**:
   - **Site URL**: `https://wheat-donkey-510412.hostingersite.com`
   - **Redirect URLs** (add both): `https://wheat-donkey-510412.hostingersite.com/login.html` and `https://wheat-donkey-510412.hostingersite.com/verify.html`
2. Sidebar → **Authentication** → **Providers** → confirm **Email** is enabled with **Confirm email = ON**.
   *(Default Supabase SMTP works, but it's rate-limited to 4 emails/hour on the free tier. For a real launch we'd plug in a transactional email provider — that's a Phase 2 item.)*

## 4. Send me your project keys

Sidebar → **Settings** (gear icon) → **API** → copy the two values:

- **Project URL** (looks like `https://abcdwxyz.supabase.co`)
- **Project API keys** → **anon** **public** key (a long JWT-style string)

Reply with both. I'll paste them into `js/config.js` and redeploy in one step.

> ⚠️ **Do NOT send the `service_role` key.** It bypasses Row-Level Security and must never live in browser code.

## 5. After I redeploy — first sign-up + admin promotion

1. Go to `https://wheat-donkey-510412.hostingersite.com/signup.html`, sign up with your real email.
2. Click the verification link in your inbox (check spam if needed).
3. Sign in at `/login.html`.
4. **Promote your account to admin.** Open Supabase **SQL Editor** and run:
   ```sql
   update public.profiles
     set is_admin = true,
         subscription_status = 'active',
         subscription_tier = 'platinum'
     where email = 'YOUR_EMAIL@example.com';
   ```
5. Sign in again — you'll be routed to `/admin.html` automatically.

You can now: review members, toggle subscription status/tier, and add/edit/feature/publish/delete venues.

---

## What's deployed

| Page | Purpose |
|---|---|
| `/` | Marketing home (existing design) |
| `/directory.html` | Partner directory — pulls live venues from Supabase |
| `/offers.html`, `/profile.html` | Existing design pages (will be wired to live data in Phase 2) |
| `/signup.html` | Member signup — sends email verification |
| `/login.html` | Member sign-in |
| `/verify.html` | Landing after the email verification click |
| `/admin.html` | **Admin only** — members management + venues CRUD |

## Phase 2 candidates (not in this build)

- Custom transactional email (Resend / SendGrid / Mailgun) instead of Supabase default
- Real billing (Stripe / Razorpay) tied to `subscription_status`
- File-upload for venue images via Supabase Storage (instead of pasting an image URL)
- Custom domain (e.g. `juniper.club`)
- Phase out the Stitch CDN images on the home/profile/offers pages

> **Migrations:** run `db/001_schema.sql` → `db/002_seed_venues.sql` → `db/003_avatars.sql` → `db/004_lock_profile_self_update.sql` → `db/005_cms.sql` → `db/006_drift.sql`. The 004 migration is required — without it a signed-in member can self-promote their subscription tier/status via the public API. 005 and 006 add the editable content tables (partner logos, member favourites, DRIFT DJs and events); without them the admin console's Logos / Favourites / Drift tabs fail with "Could not find the table … in the schema cache".
