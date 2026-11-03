ANIME BOX USER WEBSITE + EMAIL OTP BACKEND
=========================================

এই ZIP-এ শুধু User Website এবং OTP backend আছে।

ফোল্ডার:
- user-site/ : User website-এর HTML/CSS/JS এবং hosting files
- functions/ : নিরাপদ server-side OTP email ও password update API
- firebase.json, .firebaserc : Firebase deploy config

সেটআপ:
1) Node.js 20 ও Firebase CLI install করো।
2) এই ZIP extract করে folder-এ terminal খুলে চালাও:
   npm install -g firebase-tools
   firebase login
   cd functions
   npm install
   cd ..
   firebase use vpnyt-ffb68
3) SMTP provider থেকে verified sender তথ্য নিয়ে secret set করো:
   firebase functions:secrets:set SMTP_HOST
   firebase functions:secrets:set SMTP_PORT
   firebase functions:secrets:set SMTP_USER
   firebase functions:secrets:set SMTP_PASS
   firebase functions:secrets:set MAIL_FROM
   firebase functions:secrets:set OTP_PEPPER
4) Backend deploy:
   firebase deploy --only functions
5) user-site/ এর সব ফাইল তোমার Firebase Hosting site-এ deploy/upload করো।
6) Firebase Authentication-এ Email/Password sign-in enabled রাখো।

গুরুত্বপূর্ণ:
- শুধু website upload করলে OTP ইমেইল যাবে না; Functions deploy ও SMTP setup আবশ্যক।
- Cloud Functions deploy করতে Blaze billing plan লাগতে পারে।
- SMTP password/API key কখনো frontend HTML/JS-এ রাখবে না।
- passwordResetOtps এবং passwordResetRate RTDB paths-এ public read/write deny করবে।
- OTP ৬ digit, ১০ মিনিটে expire, single-use; rate limits backend-এ আছে।
