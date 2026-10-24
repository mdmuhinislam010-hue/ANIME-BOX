ANIMEBOX WEB PACKAGE
====================

Files:
- index.html: main page
- style.css: all page styling
- script.js: application logic and clean URL router
- 404.html: GitHub Pages fallback for refreshing direct routes
- _redirects: Netlify/compatible static host SPA rewrite
- firebase.json: Firebase Hosting rewrite configuration

IMPORTANT DEPLOYMENT NOTES
1) Keep all files together in the same published root folder.
2) For GitHub Pages, upload all files to the ROOT of a repository named exactly your GitHub username.github.io (or use a custom domain). The current app uses root paths such as /home and /details/...; GitHub project pages under /repository-name/ need a base-path adaptation.
3) GitHub Pages does not support true rewrite rules. 404.html lets the app render when a clean route is refreshed, but GitHub may still return HTTP status 404 for that request. For proper rewrites, use Firebase Hosting (firebase.json) or Netlify/Render with the included _redirects rule.
4) Firebase Realtime Database configuration is kept from the supplied HTML. Database rules and data are not included in this ZIP.
5) Legacy routes like /home/detail/slug and /home/details/slug are also recognized, alongside /details/slug/id.
