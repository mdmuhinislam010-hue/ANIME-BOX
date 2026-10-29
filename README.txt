ANIMEBOX WEB PACKAGE
====================

Files:
- index.html: main page, including Movie, Trending, Anime, Series, and TV Show sections
- style.css: all page styling
- script.js: application logic, Firebase connection, type rendering, and clean URL router
- 404.html: GitHub Pages fallback for direct-route refreshes
- _redirects: rewrite rule for Netlify-compatible static hosting
- firebase.json: Firebase Hosting rewrite configuration

DEPLOYMENT NOTES
1) Keep all files together in the published root folder.
2) The built-in content types are Movie, Trending, Anime, Series, and TV Show. Items must have a matching type/category in Firebase to appear in each section.
3) GitHub Pages does not support true SPA rewrites. The included 404.html can help render direct routes, but GitHub Pages may still return HTTP 404. For reliable clean-route refresh, use Firebase Hosting or Netlify with the included rewrite configuration.
4) This project uses root-relative paths (for example /home and /tv-show). GitHub project pages under /repository-name/ may need a base-path adaptation; a username.github.io repository or custom domain is simpler.
5) Firebase configuration is retained from the supplied HTML. Database rules and data are not included in this ZIP.

PROFILE SOCIAL BUTTON UPDATE
- User Profile social buttons read their configuration from Firebase settings/profileButtons.
- Admin button fields iconType and color are rendered on the User Website. Supported icon types include Telegram, YouTube, TikTok, Instagram, Facebook, Discord, WhatsApp, Twitch, X, Pinterest, LinkedIn, and Website/Other Link.
- The User Website expects each button to contain a name, http(s) URL, enabled flag, iconType, and optional hex color (#RRGGBB). If color is blank/invalid, the platform brand color is used.
- Configure/add/edit these buttons in the Admin Panel; this ZIP contains only the User Website, not the Admin Panel.
