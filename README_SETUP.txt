ANIMEBOX BACKGROUND PUSH — RENDER SETUP
=======================================
User Website now adds "Enable Background Notifications" inside its existing notification bell panel.
Existing in-site notifications, Admin writer, login, OTP and Firebase Authentication code are retained.

PROJECTS
- Notifications / content RTDB: ttttt-9bee0
- User Authentication: vpnyt-ffb68
- VAPID public key already added to User Website.
- Never put VAPID private key or Service Account JSON in client files, GitHub or this ZIP.

RENDER BACKEND
1. Upload the render-push-backend folder to a GitHub repository.
2. Create a new Render Web Service for that repository.
3. Root Directory: render-push-backend
4. Build Command: npm install
5. Start Command: npm start
6. Add Environment Variables:
   MAIN_DATABASE_URL = https://ttttt-9bee0-default-rtdb.firebaseio.com
   AUTH_PROJECT_ID = vpnyt-ffb68
   ALLOWED_ORIGIN = https://animebox1.onrender.com
   MAIN_FIREBASE_SERVICE_ACCOUNT_JSON = complete service account JSON from Firebase project ttttt-9bee0
   AUTH_FIREBASE_SERVICE_ACCOUNT_JSON = complete service account JSON from Firebase project vpnyt-ffb68
7. Deploy. Open the Render service root URL; it should return a small JSON status response.
8. Replace the placeholder in script.js:
   https://YOUR-RENDER-PUSH-SERVICE.onrender.com
   with the actual Render URL, then deploy the User Website files.

SERVICE ACCOUNTS
- Generate one service-account JSON from each Firebase project listed above.
- Paste the entire JSON object into the matching Render environment variable.
- Keep both JSON values private in Render only. Never send them in chat.

HOW IT WORKS
- Admin continues writing notifications/{id} exactly as before.
- Render listens to that same RTDB path and sends FCM push to enabled devices.
- User clicks the button, grants browser permission, receives an FCM token.
- Render verifies the signed-in user's ID token against vpnyt-ffb68 before storing the token in ttttt-9bee0.
- Manual Admin notices and existing auto Movie / Anime / Series notifications use the same path and therefore trigger push.
- If permission is denied, the existing in-site notification system still works normally.

NOTES
- Push requires HTTPS, a supported browser, and user login.
- Render Free can sleep; push may be delayed. The worker considers notifications from the last 24 hours after it reconnects.
- Old notifications older than 24 hours are not sent retroactively.
- Keep pushTokens and pushDeliveries inaccessible to browser clients. Render Admin SDK handles those paths.
- Review RTDB rules. Do not leave the whole database publicly writable.
- This is a separate Render service; do not overwrite the existing OTP backend.
