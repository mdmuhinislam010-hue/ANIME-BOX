/* AnimeBox Firebase Cloud Messaging background service worker.
   Contains public web config only; never put private service credentials here. */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "AIzaSyCivW6E7Nk2OE794_8vggiYFLn7x4ElrIQ",
  authDomain: "ttttt-9bee0.firebaseapp.com",
  databaseURL: "https://ttttt-9bee0-default-rtdb.firebaseio.com",
  projectId: "ttttt-9bee0",
  storageBucket: "ttttt-9bee0.firebasestorage.app",
  messagingSenderId: "416509818110",
  appId: "1:416509818110:web:cbefe7284695e8ea9261af"
});
const messaging=firebase.messaging();
messaging.onBackgroundMessage(payload=>{
  const data=payload&&payload.data?payload.data:{};
  const note=payload&&payload.notification?payload.notification:{};
  const title=note.title||data.title||'AnimeBox Update';
  return self.registration.showNotification(title,{
    body:note.body||data.message||'A new update is available on AnimeBox.',
    icon:data.icon||'/favicon.ico',
    badge:data.badge||'/favicon.ico',
    data:{url:data.link||'/home'},
    tag:data.notificationId||'animebox-update',
    renotify:false
  });
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const raw=event.notification?.data?.url||'/home';
  const target=new URL(raw,self.location.origin).href;
  event.waitUntil((async()=>{
    const wins=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of wins){
      if(client.url.startsWith(self.location.origin)&&'focus'in client){
        await client.focus();
        if('navigate'in client)await client.navigate(target);
        return;
      }
    }
    if(clients.openWindow)return clients.openWindow(target);
  })());
});
