const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const SMTP_HOST=defineSecret('SMTP_HOST'), SMTP_PORT=defineSecret('SMTP_PORT'), SMTP_USER=defineSecret('SMTP_USER'), SMTP_PASS=defineSecret('SMTP_PASS'), MAIL_FROM=defineSecret('MAIL_FROM'), OTP_PEPPER=defineSecret('OTP_PEPPER');
const REGION='asia-southeast1', DATABASE_URL='https://vpnyt-ffb68-default-rtdb.firebaseio.com';
initializeApp({databaseURL:DATABASE_URL});
const db=getDatabase(), auth=getAuth(), OTP_TTL_MS=600000, COOLDOWN_MS=60000, HOUR_MS=3600000;
const hash=v=>crypto.createHmac('sha256',OTP_PEPPER.value()).update(String(v)).digest('hex');
const key=v=>crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');
const json=(res,status,body)=>res.status(status).set('Content-Type','application/json').send(body);
function cors(req,res){const origin=req.get('origin');res.set('Vary','Origin');if(origin&&/^https:\/\//i.test(origin))res.set('Access-Control-Allow-Origin',origin);res.set('Access-Control-Allow-Methods','POST, OPTIONS');res.set('Access-Control-Allow-Headers','Content-Type');if(req.method==='OPTIONS'){res.status(204).send('');return true;}if(req.method!=='POST'){json(res,405,{message:'Method not allowed'});return true;}return false;}
const mailer=()=>nodemailer.createTransport({host:SMTP_HOST.value(),port:Number(SMTP_PORT.value()||587),secure:Number(SMTP_PORT.value())===465,auth:{user:SMTP_USER.value(),pass:SMTP_PASS.value()}});
async function rateLimit(ref,now,cooldown,maxPerHour){let blocked=false;await ref.transaction(old=>{const x=old||{times:[]};const times=(Array.isArray(x.times)?x.times:[]).filter(t=>now-t<HOUR_MS);if((x.lastAt&&now-x.lastAt<cooldown)||times.length>=maxPerHour){blocked=true;return;}times.push(now);return {lastAt:now,times};});return blocked;}
exports.sendPasswordResetOtp=onRequest({region:REGION,cors:false,secrets:[SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASS,MAIL_FROM,OTP_PEPPER],maxInstances:5},async(req,res)=>{
 if(cors(req,res))return;const email=String(req.body?.email||'').trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email))return json(res,400,{message:'সঠিক ইমেইল ঠিকানা লিখো।'});
 const now=Date.now(),emailKey=key(email),ipKey=key(req.get('x-forwarded-for')||req.ip||'unknown');
 try{const eb=await rateLimit(db.ref(`passwordResetRate/email/${emailKey}`),now,COOLDOWN_MS,5);const ib=await rateLimit(db.ref(`passwordResetRate/ip/${ipKey}`),now,COOLDOWN_MS,10);if(eb||ib)return json(res,429,{message:'অনেকবার OTP চাওয়া হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করো।'});
 let user=null;try{user=await auth.getUserByEmail(email);}catch(e){if(e.code!=='auth/user-not-found')throw e;}if(!user)return json(res,200,{ok:true,message:'If the account exists, an OTP has been sent.'});
 const otp=String(crypto.randomInt(0,1000000)).padStart(6,'0');await db.ref(`passwordResetOtps/${emailKey}`).set({uid:user.uid,otpHash:hash(`${emailKey}:${otp}`),createdAt:now,expiresAt:now+OTP_TTL_MS,attempts:0});
 try{await mailer().sendMail({from:MAIL_FROM.value(),to:email,subject:'AnimeBox Password Reset OTP',text:`Your AnimeBox password reset code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,html:`<div style="font-family:Arial,sans-serif;background:#101010;color:#fff;padding:28px;border-radius:14px"><h2>AnimeBox Password Reset</h2><p>Your 6-digit verification code:</p><div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#168cff">${otp}</div><p>This code expires in 10 minutes. Do not share it with anyone.</p></div>`});}catch(e){await db.ref(`passwordResetOtps/${emailKey}`).remove();throw e;}
 return json(res,200,{ok:true,message:'If the account exists, an OTP has been sent.'});}catch(e){console.error('sendPasswordResetOtp failed',e);return json(res,500,{message:'OTP পাঠানো যায়নি। পরে আবার চেষ্টা করো।'});}
});
exports.verifyPasswordResetOtp=onRequest({region:REGION,cors:false,secrets:[OTP_PEPPER],maxInstances:5},async(req,res)=>{
 if(cors(req,res))return;const email=String(req.body?.email||'').trim().toLowerCase(),otp=String(req.body?.otp||'').trim(),password=String(req.body?.password||'');if(!/^\S+@\S+\.\S+$/.test(email)||!/^[0-9]{6}$/.test(otp)||password.length<6||password.length>128)return json(res,400,{message:'ইমেইল, ৬ সংখ্যার OTP এবং কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দাও।'});
 const emailKey=key(email),ref=db.ref(`passwordResetOtps/${emailKey}`);try{const snap=await ref.get(),record=snap.val();if(!record||record.expiresAt<Date.now())return json(res,400,{message:'OTP ভুল অথবা মেয়াদ শেষ। নতুন OTP নাও।'});if(record.attempts>=5){await ref.remove();return json(res,429,{message:'অনেকবার ভুল OTP দেওয়া হয়েছে। নতুন OTP নাও।'});}
 const a=Buffer.from(record.otpHash,'hex'),b=Buffer.from(hash(`${emailKey}:${otp}`),'hex');if(a.length!==b.length||!crypto.timingSafeEqual(a,b)){const tx=await ref.child('attempts').transaction(n=>(Number(n)||0)+1);if(Number(tx.snapshot.val())>=5)await ref.remove();return json(res,400,{message:'OTP সঠিক নয়। আবার চেষ্টা করো।'});}
 const consumed=await ref.transaction(cur=>cur&&cur.otpHash===record.otpHash&&cur.expiresAt>Date.now()?null:undefined);if(!consumed.committed)return json(res,400,{message:'OTP ইতিমধ্যে ব্যবহার হয়েছে অথবা মেয়াদ শেষ। নতুন OTP নাও।'});
 await auth.updateUser(record.uid,{password});return json(res,200,{ok:true,message:'Password updated successfully.'});}catch(e){console.error('verifyPasswordResetOtp failed',e);return json(res,500,{message:'পাসওয়ার্ড পরিবর্তন করা যায়নি। পরে আবার চেষ্টা করো।'});}
});
