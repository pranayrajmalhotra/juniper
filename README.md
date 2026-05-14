# Juniper Club

A modern concierge for the city's most considered tables, bars and ateliers — built for a small membership that prefers the door held open, not announced.

**Live:** https://wheat-donkey-510412.hostingersite.com

## What's in here

A static editorial site (HTML/CSS/JS) backed by Supabase. Pages are assembled at build time from per-page fragments plus a shared shell (masthead, topbar, drawer, bottom-nav). Tailwind 4 generates the utility CSS. Supabase handles auth, row-level-security'd tables, and storage for images uploaded from the admin console.

| Page | Purpose |
|---|---|
| `/` | Editorial home — featured partner, marquee of partner logos, "member favourites" list |
| `/directory.html` | Partner directory, live-rendered from the `venues` table |
| `/offers.html` | Member offers (static, Phase 2 will wire to data) |
| `/events.html` | Private events — bookable takeovers and tasting tables |
| `/drift.html` | DRIFT — after-hours DJ residency (dark-themed sub-brand) |
| `/profile.html` | Member account |
| `/support.html` | Help & concierge contact |
| `/signup.html` · `/login.html` · `/verify.html` | Auth flow |
| `/admin.html` | **Admin only** — members, venues, partner logos, member favourites, DRIFT events + DJs (with image upload) |

## Stack

- **Frontend:** Plain HTML, vanilla JS, Tailwind CSS 4 (custom design tokens in `src/tailwind.css`)
- **Build:** Node scripts — `build-site.mjs` (shell + fragments → `build/*.html`) and `wire-buttons.mjs` (rewires dead `href="#"` and CTA `<button>`s to real pages)
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Hosting:** Hostinger static — deploy is a zip upload via the Hostinger MCP tool

## Project layout

```
.
├── build/                      # generated output — what gets deployed
│   ├── *.html                  # built pages
│   ├── admin.html              # admin console (built by hand, not from a fragment)
│   ├── css/tailwind.css        # compiled by `npm run build:css`
│   ├── js/                     # frontend modules
│   │   ├── auth.js             # JCAuth — sign-in, gates
│   │   ├── supabase-client.js  # window.SB
│   │   ├── cms.js              # logos/favourites/drift CRUD + storage upload
│   │   ├── cms-render.js       # hydrates [data-bind-logos] + [data-bind-favourites]
│   │   ├── drift.js            # hydrates the DRIFT page from drift_events + drift_djs
│   │   ├── venues.js           # venues CRUD
│   │   └── ...
│   ├── db/                     # SQL migrations — run in order in Supabase SQL Editor
│   │   ├── 001_schema.sql
│   │   ├── 002_seed_venues.sql
│   │   ├── 003_avatars.sql
│   │   ├── 004_lock_profile_self_update.sql
│   │   ├── 005_cms.sql
│   │   └── 006_drift.sql       # DRIFT tables + storage bucket
│   └── SETUP.md                # one-time Supabase setup steps
├── pages/                      # per-page <main> fragments rendered into the shell
│   ├── index.main.html
│   ├── directory.main.html
│   ├── events.main.html
│   ├── drift.main.html
│   └── ...
├── src/
│   └── tailwind.css            # Tailwind 4 source (@theme tokens + @layer components)
├── stitch_juniper_club/        # Stitch design source — read by build-site.mjs for some fragments
├── build-site.mjs              # shell + fragment renderer
├── wire-buttons.mjs            # post-build link/button rewiring
├── dev-server.mjs              # local preview server (no build dep)
└── package.json
```

## Local development

```sh
# install once
npm install

# build everything (CSS + HTML) then serve on http://localhost:8899
npm run dev

# just rebuild after editing a fragment / Tailwind source
npm run build

# just start the preview server (uses last build)
npm run serve

# watch Tailwind in a separate terminal while editing
npm run watch:css
```

Pages available at `http://localhost:8899/` — `/drift`, `/admin`, `/directory`, `/events`, `/offers`, `/profile`, `/support`. The dev server resolves `/drift` to `/drift.html` automatically.

## Editing content

| What | Where |
|---|---|
| A page's content | `pages/<page>.main.html` — then `npm run build` |
| Shell (topbar, drawer, masthead, bottom-nav) | `build-site.mjs` |
| Design tokens, fonts, components | `src/tailwind.css` |
| CTA wiring (which `#` button goes where) | `wire-buttons.mjs` |
| Database schema | new file in `build/db/00X_*.sql` — run in Supabase SQL Editor |
| Live data (venues, logos, favourites, DRIFT events + DJs) | `/admin.html` after signing in as an admin |

## First-time Supabase setup

See `build/SETUP.md` for the full walk-through. Short version:

1. Create a Supabase project.
2. Run `db/001_schema.sql` → `db/002_seed_venues.sql` → `db/003_avatars.sql` → `db/004_lock_profile_self_update.sql` → `db/005_cms.sql` → `db/006_drift.sql` in the SQL Editor.
3. Set the **Site URL** and **Redirect URLs** in Authentication → URL Configuration.
4. Put your Project URL and **publishable** anon key in `build/js/config.js`. Never commit the `service_role` key.
5. Sign up via `/signup.html`, then in the SQL Editor:
   ```sql
   update public.profiles
     set is_admin = true, subscription_tier = 'platinum', subscription_status = 'active'
     where email = 'you@example.com';
   ```
6. Sign in — `/admin.html` is now yours.

## Deploy

The site is deployed as a static zip to Hostinger.

```sh
# 1. Build everything
npm run build

# 2. Zip the build/ directory (Windows PowerShell)
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
Compress-Archive -Path build/* -DestinationPath "build_$ts.zip" -CompressionLevel Optimal
```

Then upload the zip via Hostinger's hPanel (or via the Hostinger MCP tool's `hosting_deployStaticWebsite` if you're driving it from Claude Code).

## License

Private project. All rights reserved.
