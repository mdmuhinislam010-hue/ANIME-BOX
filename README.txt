ANIMEBOX WEB PACKAGE
====================

Files:
- index.html: main page, including Movie, Trending, Anime, Series, and TV Show sections
- style.css: all page styling
- script.js: application logic, Supabase connection, type rendering, clean URL router,
  and Home-card relative update-time tracking (including separate season/episode data)
- 404.html: GitHub Pages fallback for direct-route refreshes
- _redirects: rewrite rule for Netlify-compatible static hosting

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


HOME CARD RELATIVE UPDATE TIME (rewritten 2026-11-11, v3)
- The Admin Panel (use the supplied Admin index.html) now stamps content/<cardId>/updatedAt
  every time a Card, Season, Episode, Dub or Download link is saved. New cards also get createdAt.
  Drag/drop ordering, enabled/trending toggles, malId, cast, counters and deletes do NOT change the time.
- The User Website shows the newest of: content.updatedAt/createdAt, newest updatedAt or ab_<time>_ id
  inside seasons/{id} and episodes/{id}. Old cards without updatedAt fall back to their ab_ id time.
- The per-browser guessing (localStorage hash + Date.now()) was removed: it made different devices show
  different times and made cards flip to "Just now". Every device now shows the same time.
- Cards with no known time show no badge. Future timestamps (wrong admin clock) are clamped to "Just now".
- Type list pages: Newest/Oldest sort uses this time first, then release year (no more localStorage work per compare).
- New badge: clock icon + glass pill, colour by freshness
  (green pulsing < 1 hour, blue < 24 hours, violet < 7 days, grey older). Tooltip shows the exact date/time.
- Labels: Just now / N mins ago / N hours ago / Yesterday / N days / weeks / months / years ago.
  They refresh every 30 seconds and when the tab becomes visible again.
- IMPORTANT: deploy BOTH the new Admin index.html and this User package. Time updates start from the
  next save done in the new Admin.


HOME CARD SEASON/EPISODE BADGE + MOTION (2026-11-11, v4)
- New badge next to the update-time pill: "S2 · EP 12". Season = highest enabled season that has episodes,
  EP = highest episode number in it, read from seasons/{id} and episodes/{id} (same data the Admin already saves).
- If a season record has totalEpisodes / episodeCount and EP reaches it, the badge turns green with an animated check.
- Fallback: season/episode/totalEpisodes fields on the content card itself. No data = no badge.
- Extra motion: badges fade up, light sweep on badges, hover lift + poster zoom, press feedback.
  All of it is disabled under prefers-reduced-motion.
