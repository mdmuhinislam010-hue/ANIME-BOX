const express=require('express');
const crypto=require('crypto');
const {initializeApp,cert,getApps}=require('firebase-admin/app');
const {getDatabase}=require('firebase-admin/database');
const {getAuth}=require('firebase-admin/auth');
const {getMessaging}=require('firebase-admin/messaging');
const PORT=Number(process.env.PORT||10000);
const MAIN_DB_URL=process.env.MAIN_DATABASE_URL||'https://ttttt-9bee0-default-rtdb.firebaseio.com';
const AUTH_PROJECT_ID=process.env.AUTH_PROJECT_ID||'vpnyt-ffb68';
const ALLOWED_ORIGIN=process.env.ALLOWED_ORIGIN||'https://animebox1.onrender.com';
function serviceAccount(name){if(!process.env[name])throw new Error('Missing Render env: '+name);return JSON.parse(process.env[name]);}
const mainApp=getApps().find(a=>a.name==='animebox-main')||initializeApp({credential:cert(serviceAccount('MAIN_FIREBASE_SERVICE_ACCOUNT_JSON')),databaseURL:MAIN_DB_URL},'animebox-main');
const authApp=getApps().find(a=>a.name==='animebox-auth')||initializeApp({credential:cert(serviceAccount('AUTH_FIREBASE_SERVICE_ACCOUNT_JSON')),projectId:AUTH_PROJECT_ID},'animebox-auth');
const db=getDatabase(mainApp),auth=getAuth(authApp),messaging=getMessaging(mainApp);
const app=express();app.use(express.json({limit:'32kb'}));
app.use((req,res,next)=>{const origin=req.get('origin');if(origin===ALLOWED_ORIGIN){res.set('Access-Control-Allow-Origin',origin);res.set('Vary','Origin');}res.set('Access-Control-Allow-Headers','Content-Type, Authorization');res.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');if(req.method==='OPTIONS')return res.status(204).end();next();});
app.get('/',(_req,res)=>res.json({ok:true,service:'AnimeBox FCM Push',status:'running'}));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
async function requireUser(req,res,next){try{const m=String(req.get('authorization')||'').match(/^Bearer\s+(.+)$/i);if(!m)return res.status(401).json({ok:false,message:'Login required.'});req.user=await auth.verifyIdToken(m[1]);next();}catch(_){return res.status(401).json({ok:false,message:'Login session invalid. Please sign in again.'});}}
app.post('/register-token',requireUser,async(req,res)=>{try{const token=String(req.body?.token||'').trim();if(token.length<40||token.length>5000)return res.status(400).json({ok:false,message:'Invalid FCM token.'});const uid=req.user.uid,key=hash(token),now=Date.now();await db.ref(`pushTokens/${uid}/${key}`).set({token,enabled:true,createdAt:now,updatedAt:now,userAgent:String(req.body?.userAgent||'').slice(0,220)});res.json({ok:true});}catch(e){console.error('register-token:',e);res.status(500).json({ok:false,message:'Could not register this device.'});}});
const sentThisRun=new Set(),MAX_AGE=24*60*60*1000;
async function getTokens(){const snap=await db.ref('pushTokens').once('value'),out=[];function walk(node,uid){if(!node||typeof node!=='object')return;for(const [key,val] of Object.entries(node)){if(val&&typeof val==='object'&&typeof val.token==='string'){if(val.enabled!==false)out.push({uid,key,token:val.token});}else if(val&&typeof val==='object')walk(val,uid||key);}}walk(snap.val(),'');return out;}
async function sendPush(id,item){
 if(!id||!item||item.active===false||sentThisRun.has(id))return;
 const created=Number(item.createdAt)||0;if(!created||Date.now()-created>MAX_AGE)return;
 const marker=db.ref(`pushDeliveries/${id}`),prev=await marker.once('value');if(prev.val()?.status==='sent'){sentThisRun.add(id);return;}
 const tokens=await getTokens();if(!tokens.length){console.log('No push tokens for',id);return;}
 const title=String(item.title||'AnimeBox Update').slice(0,90),message=String(item.message||'').slice(0,300),link=String(item.link||'/home').slice(0,1000),image=String(item.image||'').slice(0,1500);
 let ok=0,failed=0;const invalid=[];
 for(let i=0;i<tokens.length;i+=500){const batch=tokens.slice(i,i+500);const result=await messaging.sendEachForMulticast({tokens:batch.map(x=>x.token),notification:{title,body:message,...(image?{imageUrl:image}:{})},data:{notificationId:String(id),title,message,type:String(item.type||'Announcement'),link,image},webpush:{headers:{Urgency:'high'},fcmOptions:{link:link.startsWith('http')?link:`https://animebox1.onrender.com${link.startsWith('/')?link:'/home'}`}}});ok+=result.successCount;failed+=result.failureCount;result.responses.forEach((r,j)=>{if(!r.success&&['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(r.error?.code))invalid.push(batch[j]);});}
 await Promise.all(invalid.map(x=>db.ref(`pushTokens/${x.uid}/${x.key}`).remove().catch(()=>{})));
 await marker.set({status:'sent',sentAt:Date.now(),successCount:ok,failureCount:failed});sentThisRun.add(id);console.log(`Push ${id}: ${ok} delivered, ${failed} failed`);
}
db.ref('notifications').on('child_added',snap=>sendPush(snap.key,snap.val()).catch(e=>console.error('FCM send failed',snap.key,e)),e=>console.error('RTDB listener failed',e));
app.listen(PORT,()=>console.log('AnimeBox FCM Push listening on',PORT));
