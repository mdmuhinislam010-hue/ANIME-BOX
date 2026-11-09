/* AnimeBox Supabase adapter: legacy database-style API backed by one Supabase project. */
(function(){
  const SUPABASE_URL='https://mkvlazekxmbkfmkylnov.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY='sb_publishable_7ALLh1SO0L-OUmZhCUNihg_110YoImg';
  const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  window.animeBoxSupabase=client;
  const TABLE='animebox_state';
  let rootCache={};
  let realtimeChannel=null;
  const listeners=new Set();
  let refreshPromise=null;
  // Serialize writes in each page so rapid Admin actions cannot overwrite one another.
  let writeQueue=Promise.resolve();
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  function parts(path){return String(path||'').split('/').filter(Boolean)}
  function getAt(root,path){let v=root;for(const k of parts(path)){if(v==null)return null;v=v[k]}return v==null?null:v}
  function setAt(root,path,value){const p=parts(path);if(!p.length)return clone(value);let cur=root;for(let i=0;i<p.length-1;i++){if(!cur[p[i]]||typeof cur[p[i]]!=='object'||Array.isArray(cur[p[i]]))cur[p[i]]={};cur=cur[p[i]]}if(value===null)delete cur[p[p.length-1]];else cur[p[p.length-1]]=clone(value);return root}
  async function loadRoot(){const {data,error}=await client.from(TABLE).select('data').eq('id',1).maybeSingle();if(error)throw error;rootCache=data?.data&&typeof data.data==='object'?data.data:{};return rootCache}
  async function saveRoot(next){const {error}=await client.from(TABLE).upsert({id:1,data:next,updated_at:new Date().toISOString()},{onConflict:'id'});if(error)throw error;rootCache=next;notify();return next}
  // Use a database-side atomic JSON path update. This prevents a User tab from
  // replacing unrelated Admin changes with an older copy of the whole document.
  async function savePath(path,value,remove=false){
    const cleanPath=parts(path);
    const {data,error}=await client.rpc('animebox_set_path',{p_path:cleanPath,p_value:remove?null:value,p_delete:!!remove});
    if(error)throw error;
    if(data&&typeof data==='object')rootCache=data;
    else await loadRoot();
    notify();
    return getAt(rootCache,cleanPath.join('/'));
  }
  function notify(){for(const l of [...listeners]){if(!l.active)continue;try{l.cb(new Snapshot(new Ref(l.path,l.query)._value()))}catch(e){console.error(e)}}}
  function refresh(){if(refreshPromise)return refreshPromise;refreshPromise=loadRoot().then(()=>notify()).catch(e=>{console.error('Supabase data refresh failed:',e);for(const l of listeners){if(l.active&&l.err)l.err(e)}}).finally(()=>refreshPromise=null);return refreshPromise}
  function ensureRealtime(){if(realtimeChannel)return;realtimeChannel=client.channel('animebox-state-live').on('postgres_changes',{event:'*',schema:'public',table:TABLE},()=>refresh()).subscribe();}
  class Snapshot{constructor(v){this.value=clone(v)}val(){return clone(this.value)}exists(){return this.value!==null&&this.value!==undefined}forEach(fn){const v=this.value||{};for(const [key,value] of Object.entries(v)){if(fn({key,val:()=>clone(value)})===true)return true}return false}}
  class Ref{
    constructor(path='',query={}){this.path=parts(path).join('/');this.query=query;this.key=parts(path).slice(-1)[0]||null}
    child(p){return new Ref([this.path,p].filter(Boolean).join('/'),this.query)}
    push(){const key='ab_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);return new Ref([this.path,key].filter(Boolean).join('/'))}
    orderByChild(child){return new Ref(this.path,{...this.query,orderChild:child})}
    equalTo(value){return new Ref(this.path,{...this.query,equalTo:value})}
    limitToLast(n){return new Ref(this.path,{...this.query,limitLast:n})}
    _value(){let v=getAt(rootCache,this.path);if(v&&typeof v==='object'&&!Array.isArray(v)){let entries=Object.entries(v);if(this.query.orderChild){entries=entries.filter(([,x])=>x&&x[this.query.orderChild]===this.query.equalTo)}if(this.query.limitLast)entries=entries.slice(-this.query.limitLast);v=Object.fromEntries(entries)}return v}
    async once(event){await loadRoot();return new Snapshot(this._value())}
    on(event,cb,err){const l={path:this.path,query:this.query,cb,err,active:true};listeners.add(l);ensureRealtime();loadRoot().then(()=>{if(l.active)cb(new Snapshot(this._value()))}).catch(e=>err&&err(e));return cb}
    off(event,cb){for(const l of [...listeners])if(l.path===this.path&&(!cb||l.cb===cb)){l.active=false;listeners.delete(l)}}
    _enqueueWrite(work){const job=writeQueue.then(work);writeQueue=job.catch(()=>{});return job}
    async set(value){return this._enqueueWrite(async()=>{await loadRoot();await savePath(this.path,value,value===null);return new Snapshot(getAt(rootCache,this.path))})}
    async update(values){return this._enqueueWrite(async()=>{await loadRoot();for(const [k,v] of Object.entries(values||{})){const childPath=[this.path,k].filter(Boolean).join('/');await savePath(childPath,v,v===null)}return new Snapshot(getAt(rootCache,this.path))})}
    async remove(){return this.set(null)}
    async transaction(updater){return this._enqueueWrite(async()=>{await loadRoot();const current=clone(getAt(rootCache,this.path));const proposed=updater(current);if(proposed===undefined)return {committed:false,snapshot:new Snapshot(current)};await savePath(this.path,proposed,proposed===null);return {committed:true,snapshot:new Snapshot(getAt(rootCache,this.path))}})}
  }
  window.db={ref:path=>new Ref(path||'')};
  // Supabase Storage adapter compatible with the Admin uploader.
  window.storage={ref:()=>({child:path=>({put(file){const bucket='animebox-media';let callback=null;const task={on(event,progress,error,complete){callback={progress,error,complete};(async()=>{try{callback?.progress?.({bytesTransferred:0,totalBytes:file.size});const {error:upErr}=await client.storage.from(bucket).upload(path,file,{upsert:true,contentType:file.type||'application/octet-stream'});if(upErr)throw upErr;callback?.progress?.({bytesTransferred:file.size,totalBytes:file.size});callback?.complete?.()}catch(e){callback?.error?.(e)}})();return task;}};return task},getDownloadURL:async()=>{const {data}=client.storage.from('animebox-media').getPublicUrl(path);return data.publicUrl}})})};
  // Auth compatibility facade powered by Supabase Auth.
  function asUser(u){if(!u)return null;const meta=u.user_metadata||{};return {uid:u.id,email:u.email||'',displayName:meta.display_name||meta.full_name||meta.name||'',photoURL:meta.avatar_url||'',metadata:{creationTime:u.created_at||''},_raw:u,async updateProfile(patch={}){const update={};if(patch.displayName!==undefined)update.data={...(client.auth.getUser?((await client.auth.getUser()).data.user?.user_metadata||{}):{}),full_name:String(patch.displayName),display_name:String(patch.displayName)};if(patch.photoURL!==undefined)update.data={...(update.data||{}),avatar_url:patch.photoURL};const {data,error}=await client.auth.updateUser(update);if(error)throw authError(error);window.__abSessionUser=data.user;return asUser(data.user)}}}
  const auth={get currentUser(){return asUser(window.__abSessionUser)},onAuthStateChanged(cb){let active=true;client.auth.getSession().then(({data,error})=>{if(error)console.warn('Supabase session restore failed:',error);window.__abSessionUser=data?.session?.user||null;if(active)cb(asUser(window.__abSessionUser))});const {data:{subscription}}=client.auth.onAuthStateChange((event,s)=>{window.__abSessionUser=s?.user||null;if(active)cb(asUser(window.__abSessionUser),event)});return ()=>{active=false;subscription.unsubscribe()}},async createUserWithEmailAndPassword(email,password,displayName=''){const fallback=String(email).split('@')[0];const name=String(displayName||fallback);const {data,error}=await client.auth.signUp({email,password,options:{data:{full_name:name,display_name:name}}});if(error)throw authError(error);window.__abSessionUser=data.session?.user||null;return {user:asUser(data.user),session:data.session,confirmationRequired:!data.session}},async signInWithEmailAndPassword(email,password){const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw authError(error);window.__abSessionUser=data.session?.user||data.user||null;return {user:asUser(data.user),session:data.session}},async sendPasswordResetEmail(email,redirectTo){const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw authError(error)},async updatePassword(password){const {data,error}=await client.auth.updateUser({password});if(error)throw authError(error);window.__abSessionUser=data.user;return asUser(data.user)},async signOut(){const {error}=await client.auth.signOut();if(error)throw authError(error);window.__abSessionUser=null}};
  function authError(e){const map={'invalid_credentials':'auth/invalid-credential','email_not_confirmed':'auth/email-not-confirmed','user_already_exists':'auth/email-already-in-use','weak_password':'auth/weak-password','invalid_email':'auth/invalid-email','over_email_send_rate_limit':'auth/too-many-requests','email_address_invalid':'auth/invalid-email','signup_disabled':'auth/operation-not-allowed','user_banned':'auth/user-disabled'};e.code=map[e.code]||e.code||'auth/provider-error';return e}
  window.animeBoxAuth=auth;
  loadRoot().catch(e=>console.error('Supabase setup required:',e));
})();
