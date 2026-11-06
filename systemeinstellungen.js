/* Union Putzleinsdorf – Systemeinstellungen V2.5.2. Kein Einfluss auf bestehende Daten ohne ausdrückliches Speichern. */
(function(){
'use strict';
const DOC='vereinsKonfiguration';
const THEMES={
  neutral:{label:'Neutral · Anthrazit/Blau',primary:'#476581',background:'#26313c',surface:'#1c2530',text:'#ffffff'},
  carbon:{label:'Carbon Rot · Union Putzleinsdorf',primary:'#b30000',background:'#5b0000',surface:'#211317',text:'#ffffff'},
  blue:{label:'Blau/Silber',primary:'#245fa4',background:'#142b47',surface:'#172333',text:'#ffffff'},
  green:{label:'Grün/Dunkel',primary:'#32835c',background:'#142d24',surface:'#15251f',text:'#ffffff'},
  silver:{label:'Silber Hell',primary:'#606e7d',background:'#a7afb7',surface:'#e5e7eb',text:'#1c2630'},
  blacksilver:{label:'Schwarz/Silber Original',primary:'#7c858e',background:'#202125',surface:'#33343a',text:'#ffffff'}
};
const PRESETS={
  none:{label:'Kein Vorlagenbild · bisheriger Hintergrund',file:''},
  'carbon-rot-mit-logo':{label:'Carbon Rot – mit Union Putzleinsdorf Logo',file:'assets/union-logo.svg',theme:'carbon'},
  'carbon-rot-ohne-logo':{label:'Carbon Rot Modern – ohne Logo',file:'assets/union-hintergrund.svg',theme:'carbon'},
  'blau-silber-mit-logo':{label:'Blau Silber – mit Union Putzleinsdorf Logo',file:'assets/union-logo.svg',theme:'blue'},
  'blau-silber-ohne-logo':{label:'Blau Silber – ohne Logo',file:'assets/union-logo.svg',theme:'blue'},
  'silber-hell-mit-logo':{label:'Silber Hell – mit Union Putzleinsdorf Logo',file:'assets/union-logo.svg',theme:'silver'},
  'silber-hell-ohne-logo':{label:'Silber Hell – ohne Logo',file:'assets/union-logo.svg',theme:'silver'},
  'schwarz-silber-original-mit-logo':{label:'Schwarz Silber – bisherige verkleinerte Vorlage',file:'assets/union-logo.svg',theme:'blacksilver'},
  'schwarz-carbon-original-mit-logo':{label:'Carbon Rot Modern – Standardhintergrund',file:'assets/union-hintergrund.svg',theme:'carbon'}
};
function presetUrl(key){
  const file=PRESETS[key]?.file||'';
  if(!file)return '';
  const stem=file.split('/').pop().replace(/\.(png|jpg|jpeg)$/i,'');
  return window.UP_DESIGN_ASSETS?.[stem] || file;
}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base=()=>({name:'Union Putzleinsdorf',shortName:'UP',email:'',address:'',contact:'',theme:'carbon',primary:'#b30000',background:'#5b0000',logo:'',backgroundImage:'',backgroundPreset:'none'});
let loaded=null, draft=null, docExists=false, busy=false, previewingStart=false;
const admin=()=>typeof appPermissions!=='undefined'&&appPermissions.admin===true&&typeof firebaseAuthUser!=='undefined'&&!!firebaseAuthUser;
const db=()=>typeof firestoreDb!=='undefined'?firestoreDb:null;
const el=id=>document.getElementById(id);
function safeImage(v){return typeof v==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)&&v.length<450000?v:''}
function clean(v){
  const d=base(), x=v||{};
  for(const k of ['name','shortName','email','address','contact'])d[k]=String(x[k]??d[k]).slice(0,250);
  d.theme=Object.hasOwn(THEMES,x.theme)?x.theme:'carbon';
  for(const k of ['primary','background'])d[k]=/^#[0-9a-fA-F]{6}$/.test(x[k]||'')?x[k]:THEMES[d.theme][k];
  d.logo=safeImage(x.logo);d.backgroundImage=safeImage(x.backgroundImage);
  d.backgroundPreset=Object.hasOwn(PRESETS,x.backgroundPreset)?x.backgroundPreset:'none';
  return d;
}
function apply(v){
  if(!v)return;
  const d=clean(v),style=el('up-config-style')||document.createElement('style');
  style.id='up-config-style';
  // Theme is applied only after explicit save to Lokalspeicher. Legacy installations stay untouched.
  const bg=d.backgroundImage||presetUrl(d.backgroundPreset);
  // Die Startseite besitzt mit #shArt eine eigene Hintergrundebene.
  // Nur body zu gestalten war bisher nicht sichtbar; !important setzt sich
  // auch gegen das von shRender() vergebene Inline-Hintergrundbild durch.
  const startBackground=bg
    ? '#shArt{background-image:url("'+bg+'") !important;background-position:center !important;background-size:cover !important;}'
    : '';
  style.textContent='body{background-color:'+d.background+' !important;'
    +(bg?'background-image:url("'+bg+'") !important;':'')
    +'background-position:center !important;background-size:cover !important;}'
    +'#shStage{background-color:'+d.background+' !important;}'
    +startBackground
    +'button.primary{background:'+d.primary+' !important;}';
  if(!style.parentNode)document.head.appendChild(style);
  document.documentElement.dataset.upTheme=d.theme;
}
async function load(){
  if(!db()||!admin())return;
  try{
    const snap=await db().collection('appSettings').doc(DOC).get();
    docExists=snap.exists;
    loaded=snap.exists?clean(snap.data()):null;
    if(loaded)apply(loaded);
  }catch(e){console.warn('Systemkonfiguration konnte nicht geladen werden:',e);}
}
function preview(){
  const p=el('upConfigPreview');if(!p||!draft)return;
  const bg=draft.backgroundImage||presetUrl(draft.backgroundPreset);
  p.style.background=bg?'url("'+bg+'") center/cover':draft.background;
  p.style.color='#fff';
  p.innerHTML='<div style="display:flex;align-items:center;gap:16px">'+(draft.logo?'<img alt="Vereinslogo" style="width:78px;height:78px;object-fit:contain" src="'+draft.logo+'">':'<div style="border:1px dashed #aaa;border-radius:12px;padding:20px">LOGO</div>')+'<div><strong style="font-size:22px">'+esc(draft.name||'Vereinsname')+'</strong><div>Vereinsverwaltung · Vorschau</div></div></div><div style="margin-top:22px;display:flex;gap:10px;flex-wrap:wrap"><span style="background:'+draft.primary+';padding:12px 16px;border-radius:9px">Turnierverwaltung</span><span style="background:'+draft.primary+';padding:12px 16px;border-radius:9px">Mitgliederverwaltung</span></div>';
}
function change(){
  for(const [key,id] of [['name','upCfgName'],['shortName','upCfgShort'],['email','upCfgEmail'],['address','upCfgAddress'],['contact','upCfgContact'],['primary','upCfgPrimary'],['background','upCfgBackground']])draft[key]=el(id).value;
  preview();
}
function setTheme(){
  const t=el('upCfgTheme').value;
  draft.theme=t;draft.primary=THEMES[t].primary;draft.background=THEMES[t].background;
  draft.backgroundPreset='none';draft.backgroundImage='';el('upCfgPreset').value='none';
  el('upCfgPrimary').value=draft.primary;el('upCfgBackground').value=draft.background;
  preview();
}
function selectPreset(){
  const key=el('upCfgPreset').value;draft.backgroundPreset=key;draft.backgroundImage='';
  if(PRESETS[key]?.theme){draft.theme=PRESETS[key].theme;draft.primary=THEMES[draft.theme].primary;draft.background=THEMES[draft.theme].background;el('upCfgTheme').value=draft.theme;el('upCfgPrimary').value=draft.primary;el('upCfgBackground').value=draft.background;}
  preview();msg('Ausgewählt: '+PRESETS[key].label+' – noch nicht gespeichert.');
}
function msg(text,isError=false){const e=el('upCfgStatus');if(e){e.textContent=text;e.style.color=isError?'#ff9999':'#a5f2c2';}}
async function upload(file,key){
  if(!file)return;
  if(!file.type.startsWith('image/')){msg('Bitte eine Bilddatei auswählen.',true);return;}
  try{
    const image=await createImageBitmap(file);
    const max=key==='logo'?700:1600,scale=Math.min(1,max/Math.max(image.width,image.height));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
    canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close?.();
    let data=canvas.toDataURL('image/webp',0.68);
    if(!data.startsWith('data:image/webp'))data=canvas.toDataURL('image/jpeg',0.65);
    if(!safeImage(data)){msg('Bild zu groß. Bitte eine kleinere Datei wählen (maximal ca. 330 KB nach Komprimierung).',true);return;}
    draft[key]=data;if(key==='backgroundImage'){draft.backgroundPreset='none';el('upCfgPreset').value='none'}preview();msg('Bild für die Vorschau übernommen. Noch nicht gespeichert.');
  }catch(e){msg('Bild konnte nicht verarbeitet werden: '+e.message,true)}
}
async function save(){
  if(!admin()||busy){msg('Nur Administratoren dürfen diese Einstellungen speichern.',true);return;}
  change();draft=clean(draft);
  if(!draft.name.trim()){msg('Bitte einen Vereinsnamen eingeben.',true);return;}
  if(!db()){msg('Lokalspeicher ist nicht verbunden.',true);return;}
  busy=true;msg('Speichere in Lokalspeicher …');
  const saveButton=el('upCfgSave');if(saveButton)saveButton.disabled=true;
  try{
    await db().collection('appSettings').doc(DOC).set({...draft,updatedAt:new Date().toISOString(),updatedBy:firebaseAuthUser.uid});
    // Verify that the server actually persisted the selection before claiming success.
    const check=await db().collection('appSettings').doc(DOC).get({source:'server'});
    if(!check.exists)throw new Error('Nach dem Speichern kein Konfigurationsdokument gefunden.');
    loaded=clean(check.data());docExists=true;draft=clean(loaded);apply(loaded);
    el('upCfgTheme').value=draft.theme;
    el('upCfgPreset').value=draft.backgroundPreset;
    el('upCfgPrimary').value=draft.primary;
    el('upCfgBackground').value=draft.background;
    msg('Erfolgreich in Lokalspeicher gespeichert: '+(PRESETS[loaded.backgroundPreset]?.label||THEMES[loaded.theme].label)+'. Die Startseite übernimmt das gespeicherte Design.');
  }catch(e){console.error('UP Design speichern:',e);msg('NICHT gespeichert – '+(e.code||'Fehler')+': '+(e.message||e),true)}finally{busy=false;if(saveButton)saveButton.disabled=false;}
}
function startseiteVorschau(){
  if(!admin()||!draft)return;
  previewingStart=true;
  apply(draft);
  if(typeof showView==='function')showView('startseite');
  let b=el('upBackFromPreview');
  if(!b){
    b=document.createElement('button');b.id='upBackFromPreview';b.type='button';
    b.textContent='← Zurück zu den Systemeinstellungen (Vorschau)';
    b.style.cssText='position:fixed;top:12px;right:12px;z-index:2147483647;background:#20242c;color:white;padding:13px 20px;border:2px solid #fff;border-radius:10px;cursor:pointer;box-shadow:0 2px 12px #000';
    document.body.appendChild(b);
  }
  b.hidden=false;
  b.onclick=()=>{
    b.hidden=true;
    previewingStart=false;
    if(loaded)apply(loaded);
    else {el('up-config-style')?.remove();delete document.documentElement.dataset.upTheme;}
    if(typeof showView==='function')showView('admin');
    if(typeof adminSection==='function')adminSection('sysconfig');
  };
}
async function open(){
  if(!admin())return;
  const a=el('adminMain');if(!a)return;
  a.innerHTML='<h2>⚙ Systemeinstellungen <span class="small">V2.5.2 · Designvorlagen</span></h2><div class="card" style="margin-bottom:12px"><b>Vereinsprofil und Design</b><p class="small">Änderungen werden erst mit „Einstellungen speichern“ in Lokalspeicher übernommen. Das bestehende Union Putzleinsdorf-Design bleibt ohne Speichern unverändert. Neue Vereinsinstallationen können die neutrale Vorlage wählen.</p><div class="row"><div><label>Vereinsname</label><input id="upCfgName" type="text" maxlength="120"></div><div><label>Vereinskürzel</label><input id="upCfgShort" type="text" maxlength="25"></div></div><div class="row"><div><label>E-Mail</label><input id="upCfgEmail" type="text"></div><div><label>Kontakt</label><input id="upCfgContact" type="text"></div></div><label>Anschrift</label><input id="upCfgAddress" type="text"><label>Designvorlage</label><select id="upCfgTheme">'+Object.entries(THEMES).map(([id,t])=>'<option value="'+id+'">'+esc(t.label)+'</option>').join('')+'</select><label>Hintergrundvorlage (mit oder ohne Logo)</label><select id="upCfgPreset">'+Object.entries(PRESETS).map(([id,t])=>'<option value="'+id+'">'+esc(t.label)+'</option>').join('')+'</select><div class="row"><div><label>Akzentfarbe</label><input id="upCfgPrimary" type="color" style="height:44px;width:100%"></div><div><label>Hintergrundfarbe</label><input id="upCfgBackground" type="color" style="height:44px;width:100%"></div></div><div class="row"><div><label>Vereinslogo (PNG/JPG/WebP)</label><input id="upCfgLogo" type="file" accept="image/png,image/jpeg,image/webp"><button type="button" id="upCfgRemoveLogo">Logo entfernen</button></div><div><label>Hintergrundbild (PNG/JPG/WebP)</label><input id="upCfgBg" type="file" accept="image/png,image/jpeg,image/webp"><button type="button" id="upCfgRemoveBg">Bild entfernen</button></div></div><p class="small">Bilder werden vor dem Speichern verkleinert. Große Originalbilder und die Hintergründe einzelner Module werden in einer späteren Ausbaustufe zentral verwaltet.</p></div><div class="card"><h3>Designvorschau</h3><div id="upConfigPreview" style="padding:24px;min-height:190px;border-radius:12px"></div><div class="row" style="margin-top:16px"><button class="primary" id="upCfgSave">Einstellungen speichern</button><button id="upCfgStartPreview" type="button">Auf der Startseite ansehen</button><button id="upCfgCancel">Änderungen verwerfen</button><button id="upCfgCarbon">Union Putzleinsdorf Carbon Rot laden</button><button id="upCfgNeutral">Neutralen Entwurf laden</button></div><div id="upCfgStatus" role="status" style="margin-top:12px"></div></div><div class="card" style="margin-top:12px"><b>Weitere Bereiche (folgen)</b><p class="small">Modulverwaltung mit sicheren Zugriffssperren · zentrale Modulversionen · Vereins-Installationsassistent · gemeinsame Designübernahme in alle Einzelprogramme.</p></div>';
  msg('Lade aktuelle Einstellungen …');
  try{const snap=await db().collection('appSettings').doc(DOC).get();docExists=snap.exists;loaded=snap.exists?clean(snap.data()):null;}catch(e){msg('Lokalspeicher-Laden fehlgeschlagen: '+e.message,true);return;}
  draft=clean(loaded||base());
  for(const [key,id] of [['name','upCfgName'],['shortName','upCfgShort'],['email','upCfgEmail'],['address','upCfgAddress'],['contact','upCfgContact'],['primary','upCfgPrimary'],['background','upCfgBackground']])el(id).value=draft[key];
  el('upCfgTheme').value=draft.theme;
  el('upCfgPreset').value=draft.backgroundPreset;
  ['upCfgName','upCfgShort','upCfgEmail','upCfgAddress','upCfgContact','upCfgPrimary','upCfgBackground'].forEach(id=>el(id).addEventListener('input',change));
  el('upCfgTheme').addEventListener('change',setTheme);
  el('upCfgPreset').addEventListener('change',selectPreset);
  el('upCfgLogo').addEventListener('change',e=>upload(e.target.files[0],'logo'));
  el('upCfgBg').addEventListener('change',e=>upload(e.target.files[0],'backgroundImage'));
  el('upCfgRemoveLogo').onclick=()=>{draft.logo='';preview()};
  el('upCfgRemoveBg').onclick=()=>{draft.backgroundImage='';draft.backgroundPreset='none';el('upCfgPreset').value='none';preview()};
  el('upCfgSave').onclick=save;
  // Versionsübersicht ausschließlich lesend aus der zentralen version.json.
  const versionBox=document.createElement('div');
  versionBox.className='card';
  versionBox.style.marginTop='14px';
  versionBox.innerHTML='<h3>Programmversionen und Änderungen</h3><p id="upVersionDetails">Versionsübersicht wird geladen …</p>';
  a.appendChild(versionBox);
  fetch('version.json?v='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}).then(v=>{
    const list=Object.entries(v.module||{}).map(([name,info])=>name.replaceAll('-',' ')+' — '+(info.datei||'')).join('\\n');
    const box=el('upVersionDetails');
    if(box){box.textContent='Gesamtversion: '+v.version+'\\nModule:\\n'+list+'\\nÄnderungen:\\n'+(v.changes||[]).join('\\n');box.style.whiteSpace='pre-line';}
  }).catch(e=>{const box=el('upVersionDetails');if(box)box.textContent='Versionsdatei nicht erreichbar: '+e.message;});

  el('upCfgStartPreview').onclick=startseiteVorschau;
  el('upCfgCancel').onclick=()=>open();
  el('upCfgCarbon').onclick=()=>{draft={...draft,theme:'carbon',primary:THEMES.carbon.primary,background:THEMES.carbon.background,backgroundPreset:'none',backgroundImage:'',logo:''};el('upCfgPreset').value='none';el('upCfgTheme').value='carbon';el('upCfgPrimary').value=draft.primary;el('upCfgBackground').value=draft.background;preview();msg('Union Putzleinsdorf Carbon Rot als Entwurf geladen. Noch nicht gespeichert.');};
  el('upCfgNeutral').onclick=()=>{draft={...draft,...THEMES.neutral,theme:'neutral',logo:'',backgroundImage:'',backgroundPreset:'none'};el('upCfgPreset').value='none';el('upCfgTheme').value='neutral';el('upCfgPrimary').value=draft.primary;el('upCfgBackground').value=draft.background;preview();msg('Neutraler Entwurf geladen. Noch nicht gespeichert.')};
  preview();msg(docExists?'Aus Lokalspeicher geladen: '+(PRESETS[draft.backgroundPreset]?.label||THEMES[draft.theme].label):'Noch keine Konfiguration gespeichert – bestehendes Design bleibt unverändert.');
}
// Existing installations have no config document: do not change their appearance.
// Loading is initiated by the parent after user permissions are fully available.
// Do not rely on a timer racing the asynchronous Lokalspeicher profile load.
window.UPConfig={open,load};
})();
