/* Isolierte lokale Ausgabe. Keine Cloud-Verbindung. */
(function(){
 if(window.UNION_LOCAL_MODE)return;window.UNION_LOCAL_MODE=true;
 Object.defineProperty(window,'unionParent',{get(){try{return window.parent.UNION_LOCAL_MODE?window.parent:window}catch{return window}}});
 const prefix='union_putzleinsdorf_v1:';
 for(const name of ['localStorage','sessionStorage']){
  const raw=window[name];const keys=()=>Array.from({length:raw.length},(_,i)=>raw.key(i)).filter(k=>k&&k.startsWith(prefix));
  const adapter=new Proxy(raw,{get(t,k){if(k==='getItem')return key=>raw.getItem(prefix+key);if(k==='setItem')return(key,v)=>raw.setItem(prefix+key,String(v));if(k==='removeItem')return key=>raw.removeItem(prefix+key);if(k==='clear')return()=>keys().forEach(k=>raw.removeItem(k));if(k==='key')return i=>keys()[i]?.slice(prefix.length)||null;if(k==='length')return keys().length;if(typeof k==='string')return raw.getItem(prefix+k);},set(t,k,v){raw.setItem(prefix+k,String(v));return true},deleteProperty(t,k){raw.removeItem(prefix+k);return true},ownKeys:()=>keys().map(k=>k.slice(prefix.length)),getOwnPropertyDescriptor:()=>({enumerable:true,configurable:true})});
  Object.defineProperty(window,name,{get:()=>adapter});
 }
 if(window.indexedDB){const open=indexedDB.open.bind(indexedDB),del=indexedDB.deleteDatabase.bind(indexedDB);indexedDB.open=(n,...args)=>open(prefix+n,...args);indexedDB.deleteDatabase=n=>del(prefix+n);}
 const listen=window.addEventListener.bind(window);window.addEventListener=function(type,fn,...rest){if(type!=='storage')return listen(type,fn,...rest);return listen(type,e=>{if(e.key&&!e.key.startsWith(prefix))return;fn(new StorageEvent('storage',{key:e.key?e.key.slice(prefix.length):null,newValue:e.newValue,oldValue:e.oldValue,url:e.url}));},...rest)};
 document.addEventListener('DOMContentLoaded',()=>{
  const note=document.createElement('div');note.textContent='Union Putzleinsdorf · Lokale Ausgabe · Cloud getrennt';note.style.cssText='position:fixed;left:4px;bottom:2px;z-index:100;pointer-events:none;font:10px Arial;color:#ccc;background:#111b;padding:3px;border-radius:3px';document.body.appendChild(note);
 });
})();
