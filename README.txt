ANIMEBOX WEB PACKAGE
====================

Files:
- index.html: main page, including Movie, Trending, Anime, Series, and TV Show sections
- style.css: all page styling
- script.js: application logic, Supabase connection, type rendering, clean URL router,
  and Home-card relative update-time tracking (including separate season/episode data)
- 404.html: GitHub Pages fallback for direct-route refreshes
- _redirects: rewrite rule for Netlify-compatible static hosting
- supabase-adapter.js: database/auth/storage layer (loads only the data each page needs)
- AnimeBox_Supabase_Setup.sql: Supabase tables, policies and the atomic-save function

DEPLOYMENT NOTES
1) Keep all files together in the published root folder.
2) The built-in content types are Movie, Trending, Anime, Series, and TV Show. Items must have a matching type/category in Supabase to appear in each section.
3) GitHub Pages does not support true SPA rewrites. The included 404.html can help render direct routes, but GitHub Pages may still return HTTP 404. For reliable clean-route refresh, use Netlify and add a redirect rule: /* /index.html 200.
4) This project uses root-relative paths (for example /home and /tv-show). GitHub project pages under /repository-name/ may need a base-path adaptation; a username.github.io repository or custom domain is simpler.
5) Supabase project URL and publishable key are retained from the supplied configuration. Your existing database data is not included in this ZIP.
6) This version writes individual JSON paths atomically through the animebox_set_path SQL function, reducing the chance that simultaneous Admin/User updates overwrite unrelated records.

PROFILE SOCIAL BUTTON UPDATE
- User Profile social buttons read their configuration from Supabase settings/profileButtons.
- Admin button fields iconType and color are rendered on the User Website. Supported icon types include Telegram, YouTube, TikTok, Instagram, Facebook, Discord, WhatsApp, Twitch, X, Pinterest, LinkedIn, and Website/Other Link.
- The User Website expects each button to contain a name, http(s) URL, enabled flag, iconType, and optional hex color (#RRGGBB). If color is blank/invalid, the platform brand color is used.
- Configure/add/edit these buttons in the Admin Panel; this ZIP contains only the User Website, not the Admin Panel.


SUPABASE SETUP:
1) Run the UPDATED AnimeBox_Supabase_Setup.sql in Supabase Dashboard > SQL Editor. If the old setup was already run, run this updated file again; it adds the atomic-save function and keeps the existing state row/data.
2) Upload supabase-adapter.js beside index.html and script.js (same hosting root).
3) Use the same Supabase project for the Admin HTML and User Website.

AUTHENTICATION CHECKLIST
- In Supabase Dashboard > Authentication > Sign In / Providers, enable Email.
- In Authentication > URL Configuration, set Site URL to your deployed website origin and add that origin to Redirect URLs. Password reset links return to the website root.
- If Confirm email is enabled, new users must click the confirmation link before signing in.
- This package uses Supabase Auth for signup, login, logout, profile-name updates, and password reset. It no longer calls the old Firebase OTP Cloud Function.
- The SQL file currently grants public app access to the shared JSON state table to preserve the legacy public website/Admin behavior. This is permissive: do not store secrets or private user data in that table. For production security, Admin writes should be moved behind authenticated server-side authorization and narrower RLS policies.


HOME CARD RELATIVE UPDATE TIME (fixed 2026-11-11)
- Card time is the newest of: updatedAt/createdAt-type fields on the content record,
  the creation time encoded in Admin ids (ab_<time>_<rand>), the newest timestamp or
  id time inside seasons/{contentId} and episodes/{contentId}, and a per-browser
  change detector (hash based) for edits that carry no timestamp.
- Cards with no known time now show no label (before, they all showed "Just now").
- The seasons and episodes listeners no longer wait for each other, so one failing
  listener cannot stop the time from updating.
- localStorage now stores short hashes (keys ab-card-update-v2 / ab-external-content-update-v2)
  instead of full season/episode JSON, which could exceed the storage quota.
- Type list pages: Newest/Oldest sort now uses the update time first, then release year.
- Labels refresh every 30 seconds and when the tab becomes visible again.
- For identical times on every device, the Admin Panel should also write updatedAt (ISO).


CLEANUP AND SPEED UPDATE (2026-11-11)
Cleanup
- Removed unused CSS (old loading screen, old OTP card, old account info box, old detail
  skeleton rules and their keyframes). CSS used by generated HTML (for example rank-1/2/3)
  was kept. No JS function or variable was unused; only the dead splash/app-shell calls
  (window.__hideSplashNow / __showAppShellNow, never defined) were removed.
- Static inline style="" attributes moved into style.css (the two display:none boxes and
  the fixed-size loading placeholders). Values that change per item (poster background,
  social colors, placeholder widths) must stay inline.
- Inline onerror/onclick attributes replaced by one delegated handler in script.js
  (data-fail / data-ab-open-notifications attributes).
- 404.html now uses the same page shell as index.html (it was missing TV Show, the notice
  line and the notification bell that script.js expects).
Faster data loading
- The website no longer downloads the whole shared JSON document. The first request fetches
  only content, heroSlides, types and the home notice. Notifications and the season/episode
  time tracking load after the Home page is on screen. The details page loads only the
  seasons/episodes of the opened title. Users and leaderboard load only on the Profile page.
- Realtime events update the local copy directly (no extra download), and a listener is
  called only when its own data actually changed, so unrelated changes no longer re-render Home.
- Scripts use defer, the Supabase CDN file has a pinned version, and the browser preconnects
  to Supabase and the CDN.
- Run the updated AnimeBox_Supabase_Setup.sql once more. The save function now returns a tiny
  marker instead of the whole document, which makes every save much faster. The website works
  with the old function too, only slower.
- If a partial load ever fails, the adapter falls back to loading the full document.
