(function(){
'use strict';
const el=id=>document.getElementById(id),KEY='UP_MEETINGS_CLOUD_META_V1';
let remote=null,ready=false,busy=false,baseline=null,timer=null,dirty=false,editVersion=0;
function status(message){el('meetingCloudStatus').textContent=message}
function buttons(){el('meetingCloudSave').disabled=busy||!remote;el('meetingCloudLoad').disabled=busy||!remote?.backup;el('meetingCloudCheck').disabled=busy}
function adapter(){try{const api=window.unionParent.upMeetingsCloud;if(api)return api}catch{}throw Error('Bitte die aktuelle Vereinsverwaltung öffnen und dort anmelden.');}
function friendly(error){if(error.code==='resource-exhausted')return 'Lokalspeicher-Kontingent erreicht. Automatische Versuche sind pausiert. Bitte zuerst eine lokale Sicherung exportieren und nach Rücksetzung Verbindung prüfen.';if(error.name==='QuotaExceededError')return 'Der lokale Browserspeicher ist voll. Bitte Daten exportieren und keine Browserdaten löschen.';if(error.code==='permission-denied')return 'Lokalspeicher verweigert den Zugriff. Bitte die Firestore-Regeln für Versammlungen freigeben (Anleitung im Paket). Deine Browserdaten bleiben erhalten.';if(error.code==='unavailable'||error.code==='meeting/offline')return 'Offline oder Lokalspeicher nicht erreichbar. Änderungen bleiben im Browser. Bei bestehender Verbindung erneut speichern.';return error.message||String(error)}
function remember(){try{localStorage.setItem(KEY,JSON.stringify({revision:remote.revision,savedAt:remote.savedAt}))}catch{}}
function snapshotText(backup){return JSON.stringify(backup)}
async function capture(flush){return window.upMeetingBackupTools.capture(flush)}
async function check(manual=true){
 if(busy||window.upArchiveMutationPending)return;busy=true;ready=false;buttons();status('Lokalspeicher-Verbindung und gespeicherte Daten werden geprüft …');
 try{
  remote=await adapter().read({retry:manual===true});
  if(remote.backup)window.UPMeetingImportTest.normalize(remote.backup);
  const local=await capture(false);baseline=remote.backup?snapshotText(remote.backup):null;
  if(!remote.backup){status('Verbindung erfolgreich. Noch kein Lokalspeicher-Stand vorhanden. „Jetzt in Lokalspeicher speichern“ übernimmt deine Browserdaten.');}
  else if(snapshotText(local)===baseline){ready=true;dirty=false;remember();status('Mit Lokalspeicher abgeglichen. Letzte Speicherung: '+new Date(remote.savedAt).toLocaleString('de-DE')+'. Automatische Speicherung aktiv.');}
  else{status('Verbindung erfolgreich. Browser und Lokalspeicher enthalten unterschiedliche Stände. „Lokalspeicher-Stand laden“ oder „Jetzt in Lokalspeicher speichern“ wählen. Bis dahin wird nichts überschrieben.');}
 }catch(e){remote=null;status(friendly(e));}finally{busy=false;buttons()}
}
async function saveLocal(automatic=false,mutation=false){
 if(window.upArchiveMutationPending&&!mutation)return false;
 if(busy||!remote||automatic&&!ready)return false;
 if(!automatic&&remote.backup&&!ready&&!confirm('Den aktuellen Browserstand als neuen gemeinsamen Lokalspeicher-Stand übernehmen? Ein vorhandener Lokalspeicher-Stand wird ersetzt. Lade ihn bei Bedarf vorher zur Prüfung.'))return;
 const active=document.activeElement;
 if(automatic&&dirty&&active&&['INPUT','TEXTAREA'].includes(active.tagName)&&active.onchange&&!active.oninput){status('Eingabe läuft. Nach Verlassen des Feldes wird in Lokalspeicher gespeichert.');return}
 const started=editVersion;
 busy=true;buttons();status('Wird in Lokalspeicher gespeichert …');
 try{
  const backup=await capture(!automatic),text=snapshotText(backup);
  if(automatic&&text===baseline){dirty=false;status('Alle gespeicherten Änderungen sind mit Lokalspeicher abgeglichen.');return true}
  const saved=await adapter().save(backup,remote.revision);
  remote={...saved,backup};baseline=text;ready=true;dirty=editVersion!==started;remember();
  status('In Lokalspeicher gespeichert: '+new Date(saved.savedAt).toLocaleString('de-DE')+'. Automatische Speicherung aktiv.');return true;
 }catch(e){dirty=true;ready=false;status('Nicht in Lokalspeicher bestätigt: '+friendly(e));return false;}
 finally{busy=false;buttons()}
}
async function loadRemote(){
 if(busy||window.upArchiveMutationPending||!remote?.backup)return;
 if(!confirm('Lokalspeicher-Stand in diesen Browser übernehmen? Vorher wird dein aktueller Browserstand vollständig als Sicherungsdatei heruntergeladen.'))return;
 busy=true;ready=false;buttons();status('Lokalspeicher-Stand wird erneut geprüft und Browserstand gesichert …');
 try{
  const latest=await adapter().read();if(!latest.backup)throw Error('Kein Lokalspeicher-Stand mehr vorhanden.');window.UPMeetingImportTest.normalize(latest.backup);
  if(!await window.upExportBackup())throw Error('Die Sicherung des Browserstands ist fehlgeschlagen. Es wurde nichts ersetzt.');
  remote=latest;remember();await window.upMeetingRestoreCloud(latest.backup);
 }catch(e){status('Laden fehlgeschlagen: '+friendly(e));busy=false;buttons()}
}
function changed(event){
 if(el('meetingCloudPanel').contains(event.target))return;
 dirty=true;editVersion++;if(ready)status('Änderungen im Browser vorhanden. Lokalspeicher-Speicherung folgt …');
 clearTimeout(timer);timer=setTimeout(()=>saveLocal(true),1800);
}
document.addEventListener('input',changed);document.addEventListener('change',changed);document.addEventListener('click',event=>{if(!el('meetingCloudPanel').contains(event.target)){clearTimeout(timer);timer=setTimeout(()=>saveLocal(true),1800)}});
window.addEventListener('online',()=>{status('Verbindung wieder vorhanden. Lokalspeicher-Stand wird erneut geprüft …');check(false)});
window.addEventListener('offline',()=>{ready=false;status('Offline. Deine Daten werden weiterhin im Browser gespeichert. Nach Wiederverbindung bitte Lokalspeicher abgleichen.');});
window.addEventListener('beforeunload',event=>{if(dirty||busy||window.upArchiveMutationPending){event.preventDefault();event.returnValue='';}});
// Poll local stores as well: asynchronous archive/file writes need no visible input event.
setInterval(()=>{if(ready&&!busy)saveLocal(true)},15000);
async function prepareLeave(){
 if(busy||window.upArchiveMutationPending){status('Bitte den laufenden Speichervorgang abwarten.');return false}
 await capture(true);
 if(ready)await saveLocal(true);
 if(!ready||dirty){if(!confirm('Der aktuelle Stand ist im Browser gespeichert, aber nicht vollständig in Lokalspeicher bestätigt. Trotzdem zurück zur Verwaltung?'))return false;}
 dirty=false;return true;
}
window.upMeetingCloud={canWrite:()=>ready&&!busy,saveMutation:()=>saveLocal(true,true),check,saveLocal,loadRemote,hasPending:()=>dirty||busy,prepareLeave,allowReload(){ready=false;dirty=false;busy=false;clearTimeout(timer)}};
buttons();check(false);
})();
