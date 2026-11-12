# GitHub Pages + Supabase

Build: `node scripts/build-pages.mjs`. Publish `main:/docs` through GitHub Pages.

The site is `/`; the editor is `/admin.html` (also `/admin/`). The Node version remains available separately.

The existing Supabase project is used without replacing its schema or changing existing accounts. Public `site_content` row `workshop-v2` stores the current site as JSON. Existing `site_admins` membership and RLS policies restrict all changes to the owner. Uploaded JPG/PNG/WebP files (up to 5 MB) go to the existing `site-images` bucket. Bundled photos stay on GitHub Pages.

Sign in with the existing Supabase owner account. The local Node admin password is a separate credential. On the first login, review the imported site and click Save: this creates `workshop-v2`. Until that first save, the public site displays `docs/content.json`, containing the latest imported content. Subsequent saves are read from Supabase on every page load. The editor reports failed saves and detects simultaneous edits using `updated_at`.

Only the public publishable key is included. Never commit passwords, service-role keys, or Supabase management access tokens. Database setup is already present in the existing project; do not execute the older schema or seed scripts again.

Visitor forms are disabled in this deployment; booking uses the Telegram bot and workshop contacts. The editor does not collect booking requests or enable the unsupported Node request API.

The existing deployment and its data are preserved. If Supabase is unavailable, visitors see the bundled snapshot; the editor refuses to load/save rather than silently editing stale data.
