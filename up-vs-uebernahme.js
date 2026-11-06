(function(){
'use strict';
const prefixes=['up_versammlungen','up_mannschaft','up_work','up_gv','up_board','up_secretary','up_year','up_team'];
const allowed=key=>prefixes.some(p=>key.startsWith(p));
const clone=x=>JSON.parse(JSON.stringify(x));
function normalize(input){
 if(!input||input.format!=='up-versammlungen-backup'||input.schemaVersion!==1||!input.localStorage||typeof input.localStorage!=='object')throw Error('Bitte eine JSON-Sicherung aus der Versammlungsfunktion V3.3 auswählen.');
 const values={};for(const [key,value] of Object.entries(input.localStorage)){if(!allowed(key))continue;if(typeof value!=='string')throw Error('Ungültiger Speicherwert: '+key);values[key]=value}
 if(!Object.keys(values).length)throw Error('Die Datei enthält keine Versammlungsdaten.');
 let years;if(values.up_years_v1){years=JSON.parse(values.up_years_v1);if(!years||!years.years||!years.years[years.active])throw Error('Ungültige Jahresauswahl in der Sicherung.');for(const [year,d] of Object.entries(years.years)){if(!/^20\d\d$/.test(year)||!Array.isArray(d.board)||d.board.length!==7||!Array.isArray(d.secretary)||d.secretary.length!==4||!Array.isArray(d.docs))throw Error('Unvollständiger Jahresstand: '+year)}
 const active=years.years[years.active];values.up_board_structured_v27=JSON.stringify(active.board);values.up_secretary_structured_v1=JSON.stringify(active.secretary);values.up_gv15_docs=JSON.stringify(active.docs);
 }
 for(const key of ['up_versammlungen_demo_v1','up_mannschaft_v18'])if(values[key]){const d=JSON.parse(values[key]);if(!d||!Array.isArray(d.items)||!Array.isArray(d.board))throw Error('Ungültige Sitzung: '+key)}
 if(values.up_work_v1){const d=JSON.parse(values.up_work_v1);if(!Array.isArray(d.events))throw Error('Ungültige Arbeitseinsätze.')}
 const databases=input.indexedDB||[];if(!Array.isArray(databases))throw Error('Ungültige Dateisicherung.');for(const db of databases){if(db.name!=='up_year_files_v1')throw Error('Unbekannte Dateidatenbank.');for(const [store,rows] of Object.entries(db.stores||{})){if(!['files','archives'].includes(store)||!Array.isArray(rows))throw Error('Ungültiger Dateibereich.');for(const row of rows)if(row.key===undefined||!Object.hasOwn(row,'value'))throw Error('Unvollständiger Dateieintrag.')}}
 return {values,databases:clone(databases),years:years?Object.keys(years.years):[],active:years?.active};
}
function localSnapshot(){const entries={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(allowed(key))entries[key]=localStorage.getItem(key)}return entries}
function replaceLocal(values){const previous=localSnapshot();try{Object.keys(previous).forEach(k=>localStorage.removeItem(k));for(const [k,v] of Object.entries(values))localStorage.setItem(k,v)}catch(e){for(const k of Object.keys(localSnapshot()))localStorage.removeItem(k);for(const [k,v] of Object.entries(previous))localStorage.setItem(k,v);throw e}return previous}
function restoreLocal(values){for(const key of Object.keys(localSnapshot()))localStorage.removeItem(key);for(const [key,value] of Object.entries(values))localStorage.setItem(key,value)}
function decode(value){if(value&&value.__upType==='Blob'){const binary=atob(value.base64);if(binary.length!==value.size)throw Error('Dateigröße in der Sicherung stimmt nicht.');const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));return value.name?new File([bytes],value.name,{type:value.mimeType,lastModified:value.lastModified||0}):new Blob([bytes],{type:value.mimeType})}if(Array.isArray(value))return value.map(decode);if(value&&typeof value==='object'){const out={};for(const [k,v] of Object.entries(value))out[k]=decode(v);return out}return value}
async function restoreFiles(databases){const source=databases.find(x=>x.name==='up_year_files_v1'),stores=source?.stores||{};const records={files:(stores.files||[]).map(r=>({key:r.key,value:decode(r.value)})),archives:(stores.archives||[]).map(r=>({key:r.key,value:decode(r.value)}))};
 await new Promise((resolve,reject)=>{const request=indexedDB.open('up_year_files_v1',1);request.onupgradeneeded=()=>{const d=request.result;if(!d.objectStoreNames.contains('files'))d.createObjectStore('files');if(!d.objectStoreNames.contains('archives'))d.createObjectStore('archives',{keyPath:'id'})};request.onerror=()=>reject(request.error);request.onsuccess=()=>{const d=request.result;try{const tx=d.transaction(['files','archives'],'readwrite');for(const name of ['files','archives']){const store=tx.objectStore(name);store.clear();for(const r of records[name])store.keyPath===null?store.put(r.value,r.key):store.put(r.value)}tx.oncomplete=()=>{d.close();resolve()};tx.onabort=()=>{d.close();reject(tx.error||Error('Dateiübernahme abgebrochen.'))};tx.onerror=()=>{}}catch(e){d.close();reject(e)}}})}
function message(text){window.UP_MEETING_TRANSFER_MESSAGE=text;const target=document.getElementById('backupStatus');if(target)target.textContent=text}
function downloadRollback(){const values=localSnapshot(),backup={format:'up-versammlungen-backup',schemaVersion:1,applicationVersion:'Integration',exportedAt:new Date().toISOString(),localStorage:values,indexedDB:[]};const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='UP_Vor_Import_'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)}
async function applyBackup(input){const prepared=normalize(input);const records=prepared.databases.reduce((n,d)=>n+Object.values(d.stores||{}).reduce((a,r)=>a+r.length,0),0);if(!confirm('Sicherung übernehmen?\nJahre: '+(prepared.years.join(', ')||'Sitzungsdaten')+'\nGespeicherte Datenbereiche: '+Object.keys(prepared.values).length+'\nDatei-/Archiveinträge: '+records+'\n\nNur die Versammlungsdaten werden ersetzt. Vorher wird der Zielstand als Sicherung heruntergeladen.'))return;
 if(typeof upExportBackup==='function'){const saved=await upExportBackup();if(saved===false)throw Error('Die Sicherung des Zielstands ist fehlgeschlagen. Es wurden keine Daten importiert.')}else downloadRollback();
 const previous=replaceLocal(prepared.values);try{await restoreFiles(prepared.databases)}catch(e){restoreLocal(previous);throw e}
 // Avoid old in-memory controllers re-saving their state during reload.
 if(window.yearApi)window.yearApi.capture=function(){};
 // Registered last: retain imported values after the legacy unload autosaves run.
 window.addEventListener('beforeunload',()=>replaceLocal(prepared.values),{once:true});
 window.upMeetingCloud?.allowReload();
 window.location.reload();
}
window.upMeetingImportFile=async input=>{const file=input.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text());await applyBackup(parsed)}catch(e){alert('Import fehlgeschlagen: '+e.message)}finally{input.value=''}};
window.upMeetingShowTransferStatus=()=>message(window.UP_MEETING_TRANSFER_MESSAGE||'Vorhandene lokale Versammlungsdaten werden verwendet. Für Daten aus einer anderen Datei bitte Sicherungsdatei importieren.');
// No private seed data is shipped with the public program.
message('Vorhandene Browserdaten bleiben erhalten. Gespeicherte Daten über Lokalspeicher-Stand laden oder Sicherungsdatei importieren.');
let parentPermit=false,parentPermitAt=0;
window.addEventListener('message',event=>{if(event.source!==window.unionParent||event.data?.type!=='UP_MEETING_ACCESS_RESPONSE')return;parentPermit=event.data.allowed===true;parentPermitAt=Date.now()});
function access(){let ok=false;try{ok=window.unionParent!==window&&window.unionParent.upCanUseVersammlungen?.()===true}catch{}if(!ok&&parentPermit&&Date.now()-parentPermitAt<6000)ok=true;if(window.unionParent!==window)window.unionParent.postMessage({type:'UP_MEETING_ACCESS_REQUEST'},'*');let lock=document.getElementById('meetingAccessLock');if(!ok&&!lock&&document.body){lock=document.createElement('div');lock.id='meetingAccessLock';lock.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#16080b;color:white;display:grid;place-items:center;padding:30px;font:20px Arial';lock.textContent='Bitte Versammlungen und Arbeitseinsätze über die angemeldete Vereinsverwaltung öffnen.';document.body.appendChild(lock)}if(ok&&lock)lock.remove();document.documentElement.style.overflow=ok?'':'hidden'}
document.addEventListener('DOMContentLoaded',access);setInterval(access,1500);
window.upMeetingRestoreCloud=async function(input){
 const prepared=normalize(input);
 // Full local rollback, including files, is kept until both stores are restored.
 const rollback=await window.upMeetingBackupTools.capture();
 const previous=localSnapshot();
 try{await restoreFiles(prepared.databases);replaceLocal(prepared.values)}
 catch(e){restoreLocal(previous);await restoreFiles(rollback.indexedDB);throw e}
 if(window.yearApi)window.yearApi.capture=function(){};
 window.addEventListener('beforeunload',()=>replaceLocal(prepared.values),{once:true});
 window.upMeetingCloud?.allowReload();
 window.location.reload();
};
window.upMeetingApplyLive=async function(input,guard){
 const prepared=normalize(input),rollback=await window.upMeetingBackupTools.capture(false),previous=localSnapshot();
 if(guard&&!guard()){const e=Error('Eingabe läuft.');e.code='meeting/defer';throw e}
 const wasInert=document.body.inert;document.body.inert=true;
 try{
  if(JSON.stringify(input.indexedDB)!==JSON.stringify(rollback.indexedDB))await restoreFiles(prepared.databases);
  if(guard&&!guard()){const e=Error('Eingabe läuft.');e.code='meeting/defer';throw e}
  replaceLocal(prepared.values);
  const read=k=>prepared.values[k]?JSON.parse(prepared.values[k]):null;
  if(read('up_versammlungen_demo_v1'))window.upBoardHydrate(read('up_versammlungen_demo_v1'));
  if(read('up_mannschaft_v18'))window.msApi.hydrate(read('up_mannschaft_v18'));
  if(read('up_work_v1'))window.workApi.hydrate(read('up_work_v1'));
  if(read('up_years_v1'))window.yearApi.hydrate(read('up_years_v1'));
  else {if(read('up_board_structured_v27'))window.boardApi.setSections(read('up_board_structured_v27'));if(read('up_secretary_structured_v1'))window.secretaryApi.setSections(read('up_secretary_structured_v1'));}
  window.upArchiveManager?.render('gv');
 }catch(e){restoreLocal(previous);await restoreFiles(rollback.indexedDB);throw e}finally{document.body.inert=wasInert}
};
window.UPMeetingImportTest={normalize};
})();
