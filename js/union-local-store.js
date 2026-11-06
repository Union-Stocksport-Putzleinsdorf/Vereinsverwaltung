/* Local-only document store and test login. No Firebase SDK / network. */
(function(){
 const KEY='union_documents',AUTH='union_local_admin';let watchers=new Set(),authWatchers=new Set();
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
 const copy=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
 const write=x=>{localStorage.setItem(KEY,JSON.stringify(x));for(const w of watchers)queueMicrotask(w)};
 const profile={uid:'union-admin',email:'admin@union.local',name:'Administrator',role:'admin',admin:true,whiteboard:false};
 let all=read();if(!all['users/union-admin']){all['users/union-admin']=profile;write(all)}
 class Timestamp{constructor(seconds=0,nanoseconds=0){this.seconds=seconds;this.nanoseconds=nanoseconds}toDate(){return new Date(this.seconds*1000)}static now(){return Timestamp.fromDate(new Date())}static fromDate(d){return new Timestamp(Math.floor(d.getTime()/1000))}static fromMillis(v){return Timestamp.fromDate(new Date(v))}}
 function snap(path,value){return {id:path.split('/').pop(),ref:new Ref(path),exists:value!==undefined,data:()=>copy(value),get:k=>copy(value?.[k]),metadata:{fromCache:false,hasPendingWrites:false}}}
 class Ref{
  constructor(path='',kind='doc',filters=[]){this.path=path;this.id=path.split('/').pop();this.kind=kind;this.filters=filters;this.parent=path.includes('/')?{path:path.split('/').slice(0,-1).join('/')}:null}
  collection(n){return new Ref(this.path?this.path+'/'+n:n,'collection')}
  doc(n){return new Ref(this.path+'/'+(n||crypto.randomUUID()))}
  where(...args){return new Ref(this.path,this.kind,[...this.filters,['where',...args]])}
  orderBy(...args){return new Ref(this.path,this.kind,[...this.filters,['order',...args]])}
  limit(n){return new Ref(this.path,this.kind,[...this.filters,['limit',n]])}
  async get(){const all=read();if(this.kind==='doc')return snap(this.path,all[this.path]);let docs=Object.entries(all).filter(([p])=>p.startsWith(this.path+'/')&&p.slice(this.path.length+1).indexOf('/')<0).map(([p,v])=>snap(p,v));for(const [op,k,cmp,val] of this.filters){if(op==='where')docs=docs.filter(d=>{const v=d.data()?.[k];return cmp==='=='?v===val:cmp==='!='?v!==val:cmp==='in'?val.includes(v):cmp==='array-contains'?Array.isArray(v)&&v.includes(val):cmp==='>'?v>val:cmp==='>='?v>=val:cmp==='<'?v<val:cmp==='<='?v<=val:false});if(op==='order')docs.sort((a,b)=>String(a.data()?.[k]??'').localeCompare(String(b.data()?.[k]??''))*(cmp==='desc'?-1:1));if(op==='limit')docs=docs.slice(0,k)}return {docs,size:docs.length,empty:!docs.length,forEach:fn=>docs.forEach(fn),docChanges:()=>docs.map(doc=>({type:'added',doc})),metadata:{fromCache:false,hasPendingWrites:false}}}
  async set(value,opts){const all=read();all[this.path]=opts?.merge?{...(all[this.path]||{}),...copy(value)}:copy(value);write(all)}
  update(v){return this.set(v,{merge:true})}
  async delete(){const all=read();delete all[this.path];write(all)}
  async add(v){const r=this.doc();await r.set(v);return r}
  onSnapshot(...args){const fn=args.find(x=>typeof x==='function');const emit=()=>this.get().then(fn);watchers.add(emit);emit();return()=>watchers.delete(emit)}
 }
 const db={collection:n=>new Ref(n,'collection'),doc:p=>new Ref(p),settings(){},enablePersistence:async()=>{},batch:()=>batch(),runTransaction:fn=>fn(transaction())};
 function batch(){let jobs=[];const b={set:(r,v,o)=>(jobs.push(()=>r.set(v,o)),b),update:(r,v)=>(jobs.push(()=>r.update(v)),b),delete:r=>(jobs.push(()=>r.delete()),b),commit:async()=>{for(const job of jobs)await job()}};return b}
 function transaction(){return {get:r=>r.get(),set:(r,v,o)=>r.set(v,o),update:(r,v)=>r.update(v),delete:r=>r.delete()}}
 function user(){return {...profile,displayName:'Administrator',getIdToken:async()=>{throw Error('Keine Cloud-Anmeldung in lokaler Ausgabe')},updatePassword:async p=>{localStorage.setItem('union_admin_password',p)},reauthenticateWithCredential:async c=>{if(c.password!==(localStorage.getItem('union_admin_password')||'1234'))throw Error('Kennwort falsch')}}}
 const auth={currentUser:sessionStorage.getItem(AUTH)?user():null,setPersistence:async()=>{},async signInWithEmailAndPassword(email,password){if(!['admin','admin@union.local'].includes(String(email).toLowerCase())||password!==(localStorage.getItem('union_admin_password')||'1234'))throw Error('Benutzer oder Kennwort falsch');sessionStorage.setItem(AUTH,'1');this.currentUser=user();for(const fn of authWatchers)queueMicrotask(()=>fn(this.currentUser));return {user:this.currentUser}},async signOut(){sessionStorage.removeItem(AUTH);this.currentUser=null;for(const fn of authWatchers)queueMicrotask(()=>fn(null))},onAuthStateChanged(fn){authWatchers.add(fn);queueMicrotask(()=>fn(this.currentUser));return()=>authWatchers.delete(fn)}};
 const firestore=()=>db;firestore.FieldValue={serverTimestamp:()=>new Date().toISOString(),delete:()=>null,arrayUnion:(...v)=>v,increment:n=>n};firestore.Timestamp=Timestamp;
 const authFn=()=>auth;authFn.Auth={Persistence:{LOCAL:'local',SESSION:'session',NONE:'none'}};authFn.EmailAuthProvider={credential:(email,password)=>({email,password})};
 auth.sendPasswordResetEmail=async()=>{throw Error('Lokale Ausgabe: kein E-Mail-Versand. Kennwort nach Anmeldung aendern.')};
 const apps=[];function initializeApp(config={},name='[DEFAULT]'){const found=apps.find(a=>a.name===name);if(found)return found;const app={name,options:{projectId:'union-local-only'},firestore,auth:authFn,delete:async()=>{}};apps.push(app);return app}
 window.firebase={apps,initializeApp,app:n=>initializeApp({},n),firestore,auth:authFn,SDK_VERSION:'local-only'};
 window.UnionLocal={db,auth,initializeApp,Timestamp,batch,Ref};
 window.addEventListener('storage',e=>{if(e.key===KEY)for(const fn of watchers)fn()});
})();
