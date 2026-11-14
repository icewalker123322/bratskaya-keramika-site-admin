# GitHub Pages + Supabase

Install build dependencies with `npm ci`, then build with `npm run build:pages`. Publish `main:/docs` through GitHub Pages.

The site is `/`; the editor is `/admin.html` (also `/admin/`). The Node version remains available separately.

The existing Supabase project is used without replacing its schema or changing existing accounts. Public `site_content` row `workshop-v2` stores the current site as JSON. Existing `site_admins` membership and RLS policies restrict all changes to the owner. Uploaded JPG/PNG/WebP files (up to 5 MB) go to the existing `site-images` bucket. Bundled photos stay on GitHub Pages.

Sign in with the existing Supabase owner account. The local Node admin password is a separate credential. On the first login, review the imported site and click Save: this creates `workshop-v2`. Until that first save, the public site displays `docs/content.json`, containing the latest imported content. Subsequent saves are read from Supabase on every page load. The editor reports failed saves and detects simultaneous edits using `updated_at`.

Only the public publishable key is included. Never commit passwords, service-role keys, or Supabase management access tokens. Database setup is already present in the existing project; do not execute the older schema or seed scripts again.

Visitor forms are disabled in this deployment; booking uses the Telegram bot and workshop contacts. The editor does not collect booking requests or enable the unsupported Node request API.

Visitors first see their last cached public content or the bundled snapshot. Supabase is checked in the background on each page load and fresh content updates the current section. If Supabase is unavailable, the site stays usable. The editor always reads the live database and refuses to load/save stale data.

The Pages build generates WebP photos at 160, 640 and up to 1200 pixels, a smaller transparent logo, and responsive image metadata. Originals are preserved. Gallery thumbnails use small images; larger views select appropriate sizes automatically. Newly uploaded admin photos are resized to at most 1600 pixels and encoded as WebP when supported before Storage upload. UUID image names allow long browser caching without overwriting another image.
