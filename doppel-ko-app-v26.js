(()=>{'use strict';
const __health=document.getElementById('dko-js-health');
function __report(err){
  const msg=(err&&err.stack)||String(err||'Unbekannter Fehler');
  if(__health){__health.style.background='#751b2c';__health.style.color='#fff';__health.textContent='✕ JavaScript-Fehler: '+msg.slice(0,850);}
  console.error('DKO V2.6 Initialisierung:',err);
}
if(__health){__health.style.background='#725019';__health.textContent='◌ V2.6: JavaScript geladen – Initialisierung läuft …';}
try {
const __memoryStore=new Map();
let __storageAvailable=true;
const safeStorage={
 getItem(k){try{return window.localStorage.getItem(k)}catch(e){__storageAvailable=false;return __memoryStore.get(k)??null}},
 setItem(k,v){try{window.localStorage.setItem(k,v)}catch(e){__storageAvailable=false;__memoryStore.set(k,String(v))}},
 removeItem(k){try{window.localStorage.removeItem(k)}catch(e){__storageAvailable=false;__memoryStore.delete(k)}}
};
try{safeStorage.setItem('__up_probe__','1');safeStorage.removeItem('__up_probe__')}catch(e){__storageAvailable=false}

const $=id=>document.getElementById(id);const STORE='up_doppel_ko_prototyp_v01';
let state={size:16,name:'Union Putzleinsdorf – Doppel KO',date:'',players:[],results:{},fastMode:false,withdrawn:[],venue:'Stocksporthalle Union Putzleinsdorf',organizer:'Union Putzleinsdorf',director:'Union Putzleinsdorf',turns:{first:6,later:8,final:10},autoSheets:true,sheetPrompts:[]};let graph=null;let activeTab='winner';let editId=null;let correctionMode=false;let turnPlan=null;
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const seedOrder=n=>{if(n===2)return[1,2];return seedOrder(n/2).flatMap(x=>[x,n+1-x])};
// Der bewusst gewählte Turniermodus bestimmt die Feldgröße; fehlende Plätze sind Freilose.
const effectiveSize=()=>state.size;
const source=(kind,id)=>({kind,id});const slot=i=>({kind:'seed',id:i});
function buildGraph(){let all=[],win=[],lose=[];const add=(id,section,round,a,b)=>{let m={id,section,round,sources:[a,b],a:null,b:null,winner:null,loser:null,ready:false,done:false,auto:false,void:false,score:null};all.push(m);return m};
 let seeds=seedOrder(effectiveSize()).map(s=>slot(s-1));let inputs=seeds;
 for(let r=1;r<=Math.log2(effectiveSize());r++){let matches=[];for(let j=0;j<inputs.length;j+=2)matches.push(add(`W${r}-${j/2+1}`,'winner',r,inputs[j],inputs[j+1]));win.push(matches);inputs=matches.map(m=>source('winner',m.id))}
 let prev=[];const k=Math.log2(effectiveSize());
 for(let w=2;w<=k;w++){
  if(w===2){let r=[];for(let j=0;j<win[0].length;j+=2)r.push(add(`L1-${j/2+1}`,'loser',1,source('loser',win[0][j].id),source('loser',win[0][j+1].id)));lose.push(r);prev=r}
  let r=2*(w-1),even=[];for(let j=0;j<prev.length;j++){let swap=prev.length>1?j^1:j;even.push(add(`L${r}-${j+1}`,'loser',r,source('winner',prev[j].id),source('loser',win[w-1][swap].id)))}lose.push(even);prev=even;
  if(w<k){let odd=[];for(let j=0;j<prev.length;j+=2)odd.push(add(`L${r+1}-${j/2+1}`,'loser',r+1,source('winner',prev[j].id),source('winner',prev[j+1].id)));lose.push(odd);prev=odd}
 }
 let gf=add('GF','final',1,source('winner',win[k-1][0].id),source('winner',prev[0].id));let reset=add('RESET','final',2,source('winner',gf.id),source('loser',gf.id));
 let byId=Object.fromEntries(all.map(m=>[m.id,m]));return{all,win,lose,gf,reset,byId};
}
function calculate(){graph=buildGraph();let changed=false;
 for(const m of graph.all){
  if(m.id==='RESET'&&!graph.gf.done){m.void=true;continue}
  if(m.id==='RESET'&&graph.gf.winner!==graph.gf.b){m.void=true;continue}
  let resolved=m.sources.map(s=>{
   if(s.kind==='seed')return {ready:true,value:state.players[s.id]||null};
   let prev=graph.byId[s.id];return {ready:prev.done,value:prev[s.kind]};
  });
  // Ein bereits feststehender Spieler wird sofort in seinem nächsten Feld angezeigt,
  // auch wenn die zweite Paarung dieser Runde noch gespielt werden muss.
  m.a=resolved[0].ready?resolved[0].value:null;
  m.b=resolved[1].ready?resolved[1].value:null;
  const historical=state.results[m.id];
  if((state.withdrawn||[]).length&&historical&&state.players.includes(historical.a)&&state.players.includes(historical.b)&&Number.isInteger(historical.sa)&&Number.isInteger(historical.sb)&&historical.sa!==historical.sb){
   m.a=historical.a;m.b=historical.b;m.ready=true;m.done=true;
   m.score=[historical.sa,historical.sb];m.winner=historical.sa>historical.sb?m.a:m.b;
   m.loser=historical.sa>historical.sb?m.b:m.a;continue;
  }
  if(!resolved.every(x=>x.ready))continue;
  m.ready=true;
  // Gespielte Begegnungen bleiben historisch unverändert. Abgemeldete Spieler
  // verlieren nur noch offene Begegnungen kampflos, ohne den Turnierbaum neu zu setzen.
  const saved=state.results[m.id];
  if(saved&&saved.a===m.a&&saved.b===m.b&&Number.isInteger(saved.sa)&&Number.isInteger(saved.sb)&&saved.sa!==saved.sb){
    m.score=[saved.sa,saved.sb];m.winner=saved.sa>saved.sb?m.a:m.b;
    m.loser=saved.sa>saved.sb?m.b:m.a;m.done=true;continue;
  }
  const removed=new Set((state.withdrawn||[]).map(i=>state.players[i]));
  if(m.a&&removed.has(m.a))m.a=null;
  if(m.b&&removed.has(m.b))m.b=null;
  if(!m.a&&!m.b){m.done=true;m.void=true;continue}
  // Ein echtes Freilos gilt sofort als gewonnen: ohne Ergebniseingabe,
  // unabhängig davon, ob andere Spiele der aktuellen Runde noch laufen.
  if(!m.a||!m.b){m.done=true;m.auto=true;m.winner=m.a||m.b;continue}
  let oldSaved=state.results[m.id];
  if(oldSaved){if(oldSaved.a!==m.a||oldSaved.b!==m.b||!Number.isInteger(oldSaved.sa)||!Number.isInteger(oldSaved.sb)||oldSaved.sa===oldSaved.sb){delete state.results[m.id];changed=true}
  else{m.score=[oldSaved.sa,oldSaved.sb];m.winner=oldSaved.sa>oldSaved.sb?m.a:m.b;m.loser=oldSaved.sa>oldSaved.sb?m.b:m.a;m.done=true}}
 }
 if(changed)persist();return graph;
}
function persist(){safeStorage.setItem(STORE,JSON.stringify(state));scheduleCloudSave(false)}
// Turnierleitung: Sieger- und Verliererrunden bewusst abwechselnd spielen.
// Innerhalb einer Runde sind alle Begegnungen gleichzeitig zur Eingabe freigegeben.
function stageDefinitions(){
 // Jede Runde bildet eine eigene, parallel spielbare Gruppe. Erst wenn alle
 // Begegnungen entschieden (oder als Freilos automatisch beendet) sind,
 // wird die nächste Runde freigeschaltet. Sieger- und Verliererbaum wechseln.
 const k=Math.log2(effectiveSize()),stages=[{name:'Siegerbaum · Runde 1',ids:graph.win[0].map(m=>m.id)}];
 for(let w=2;w<=k;w++){
  const odd=graph.lose[2*w-4]||[];
  stages.push({name:`Verliererbaum · Runde ${2*w-3}`,ids:odd.map(m=>m.id)});
  stages.push({name:`Siegerbaum · Runde ${w}`,ids:graph.win[w-1].map(m=>m.id)});
  const even=graph.lose[2*w-3]||[];
  stages.push({name:`Verliererbaum · Runde ${2*w-2}`,ids:even.map(m=>m.id)});
 }
 stages.push({name:'Großes Finale',ids:['GF']});
 stages.push({name:'Entscheidungsfinale (falls erforderlich)',ids:['RESET']});
 return stages;
}
function planCurrent(){
 const stages=stageDefinitions();let current=null,activeIds=[],remaining=0;
 if(state.fastMode){
  // Vier-Bahnen-Modus: alle noch offenen, bereits besetzten Paarungen in der
  // üblichen abwechselnden Sieger-/Verliererrunden-Reihenfolge betrachten.
  // Eine Runde muss hier NICHT komplett beendet sein: eine folgende Paarung
  // darf starten, sobald beide Teilnehmer tatsächlich feststehen.
  const reserved=new Set();
  const pending=stages.flatMap(st=>st.ids.map(id=>graph.byId[id])).filter(m=>m&&!m.done&&!m.void);
  for(const m of pending){
   if(activeIds.length>=4)break;
   if(!m.ready||!m.a||!m.b||m.auto)continue;
   // Kein Spieler darf gleichzeitig für zwei Bahnen freigegeben werden.
   if(reserved.has(m.a)||reserved.has(m.b))continue;
   activeIds.push(m.id);reserved.add(m.a);reserved.add(m.b);
  }
  remaining=pending.length;
  const first=pending[0];
  if(first){
   const idx=stages.findIndex(st=>st.ids.includes(first.id)),st=stages[idx];
   const pendingInStage=st.ids.map(id=>graph.byId[id]).filter(m=>m&&!m.done&&!m.void);
   current={...st,index:idx,total:st.ids.length,finished:st.ids.length-pendingInStage.length,remaining:pendingInStage.length};
  }
 }else{
  // Klassischer Modus: die ganze Runde muss abgeschlossen sein, bevor die
  // nächste Runde freigegeben wird. Innerhalb der Runde parallel spielbar.
  for(let i=0;i<stages.length;i++){
   const st=stages[i],pending=st.ids.map(id=>graph.byId[id]).filter(m=>m&&!m.done&&!m.void);
   if(pending.length){
    current={...st,index:i,total:st.ids.length,finished:st.ids.length-pending.length,remaining:pending.length};
    activeIds=pending.filter(m=>m.ready&&m.a&&m.b&&!m.auto).map(m=>m.id);
    remaining=pending.length;break;
   }
  }
 }
 turnPlan={stages,current,activeIds,activeId:activeIds[0]||null,remaining};
 return turnPlan;
}
function matchAccess(m){
 if(m.auto||m.void)return 'automatic';
 if(m.score)return correctionMode?'editable':'finished';
 return turnPlan?.activeIds?.includes(m.id)?'active':'locked';
}
function matchClass(m){const mode=matchAccess(m);return mode==='active'?'turn-active':mode==='locked'?'turn-locked':mode==='finished'?'turn-finished':''}
function readyGames(){return graph.all.filter(m=>m.ready&&!m.done&&m.a&&m.b)}
function metrics(){
 let played=graph.all.filter(m=>m.score).length;let n=state.players.length-(state.withdrawn||[]).length;
 $('sumPlayers').textContent=n;$('sumField').textContent=effectiveSize();
 $('sumGames').textContent=played+' / '+(n>1?(2*n-2+(graph.gf.score&&graph.gf.winner===graph.gf.b?1:0)):0);
 $('sumNext').textContent=state.fastMode?(turnPlan?.activeIds?.length?turnPlan.activeIds.join(' · '):(turnPlan?.current?.name||'Fertig')):(turnPlan?.current?.name|| (graph.gf.done&&(graph.reset.done||graph.reset.void)?'Fertig':'–'));
 $('status').textContent=!n?'Turnier vorbereiten':turnPlan?.current?(state.fastMode?`⚡ 4-Bahnen-Modus · ${turnPlan.activeIds.length} Begegnungen frei`:`${turnPlan.current.name} · nächstes Spiel ${turnPlan.activeId||'wartet'}`):'🏆 Turnier abgeschlossen';
 $('turnBanner').innerHTML=!n?'Teilnehmer eingeben, um die Spielreihenfolge zu starten.':turnPlan?.current?
 (state.fastMode?`<span class="turn-stage">⚡ SCHNELLES SPIEL</span><strong>4 Bahnen · laufende Freigabe</strong><span class="turn-game">JETZT: ${turnPlan.activeIds.length} von 4 möglichen Spielen · ${turnPlan.remaining} noch offen</span>`:
 `<span class="turn-stage">ABSCHNITT ${turnPlan.current.index+1} / ${turnPlan.stages.length}</span><strong>${safe(turnPlan.current.name)}</strong><span class="turn-game">JETZT: ${turnPlan.activeIds.length} Spiele freigegeben · ${turnPlan.current.finished} / ${turnPlan.current.total} erledigt</span>`):
 '<strong>🏆 Turnier abgeschlossen</strong>';
 $('wbCorrection').textContent=correctionMode?'✓ Korrektur beenden':'✎ Korrektur';$('correction').textContent=correctionMode?'✓ Korrekturmodus beenden':'✎ Ergebnisse korrigieren';
 $('correction').classList.toggle('active-correction',correctionMode);$('fastMode').checked=!!state.fastMode;
}
function inlineScore(m,idx,whiteboard=false){
 const access=matchAccess(m);
 if(access==='active'||access==='editable'){
  const value=m.score?m.score[idx]:0;
  return `<span class="touch-score" data-score-input="${safe(m.id)}" data-side="${idx}"><button type="button" class="score-step" data-score-step="${safe(m.id)}" data-side="${idx}" data-delta="-1" aria-label="Punkt abziehen bei ${safe(idx===0?m.a:m.b)}">−</button><output class="score-value" data-score-value>${value}</output><button type="button" class="score-step" data-score-step="${safe(m.id)}" data-side="${idx}" data-delta="1" aria-label="Punkt hinzufügen bei ${safe(idx===0?m.a:m.b)}">+</button></span>`;
 }
 return `<b class="score">${m.score?m.score[idx]:''}</b>`;
}
function scoreActions(m){
 const access=matchAccess(m);
 if(access!=='active'&&access!=='editable')return '';
 return `<span class="score-actions"><button type="button" class="score-action save" data-score-save="${safe(m.id)}" title="Ergebnis speichern" aria-label="Ergebnis ${safe(m.id)} speichern">✓</button>${m.score?`<button type="button" class="score-action clear" data-score-remove="${safe(m.id)}" title="Ergebnis löschen" aria-label="Ergebnis ${safe(m.id)} löschen">↺</button>`:''}</span>`;
}
function finalConfirmButton(m,whiteboard=false){
 // Additional, prominently visible touch target for the decisive final.
 // The original checkmark in the match header is preserved as well.
 if(m.id!=='RESET'||!['active','editable'].includes(matchAccess(m)))return '';
 return `<div class="decider-confirm"><button type="button" class="decider-confirm-btn" data-score-save="RESET" aria-label="Entscheidungsfinale Ergebnis bestätigen">✓ ${whiteboard?'Bestätigen':'Ergebnis bestätigen'}</button></div>`;
}
function matchHtml(m){
 let label=m.section==='winner'?'Siegerbaum':m.section==='loser'?'Verliererbaum':'Finale';
 let status=m.void?'entfällt':m.auto?'FREILOS → weiter':m.score?'gespielt':matchAccess(m)==='active'?'BAHN FREI':'gesperrt';
 let a=m.a||(m.ready&&m.b?'FREILOS':'—'),b=m.b||(m.ready&&m.a?'FREILOS':'—');
 return `<article class="match ${m.score?'done':m.ready&&!m.done?'ready':''} ${matchClass(m)}" data-match-id="${safe(m.id)}"><div class="match-head"><span>${safe(m.id)} · ${label} · ${status}</span>${scoreActions(m)}</div><div class="team ${m.winner&&m.a===m.winner?'winner':''} ${!m.a&&!m.auto?'empty':''} ${!m.a&&m.auto?'bye-team':''}"><span title="${safe(a)}">${safe(a)}</span>${inlineScore(m,0)}</div><div class="team ${m.winner&&m.b===m.winner?'winner':''} ${!m.b&&!m.auto?'empty':''} ${!m.b&&m.auto?'bye-team':''}"><span title="${safe(b)}">${safe(b)}</span>${inlineScore(m,1)}</div>${finalConfirmButton(m)}</article>`;
}
function bracketHtml(rounds,title){return `<div class="scroll"><div class="bracket">${rounds.map((arr,i)=>`<div class="round"><div class="round-head">${title} · Runde ${i+1}<small>${arr.length} ${arr.length===1?'Spiel':'Spiele'}</small></div>${arr.map(matchHtml).join('')}</div>`).join('')}</div></div>`}
function rankings(){let eliminated=[];for(let i=0;i<graph.lose.length;i++){let out=graph.lose[i].filter(m=>m.loser).map(m=>m.loser);if(out.length)eliminated.push({round:i+1,names:out})}
 let rows=[];let n=state.players.length;
 if(graph.gf.done&&(graph.reset.done||graph.reset.void)){let final=graph.reset.done&&!graph.reset.void?graph.reset:graph.gf;rows.push({pos:'1.',name:final.winner,info:'Turniersieger'});rows.push({pos:'2.',name:final.loser,info:'Finale'})}
 else {rows.push({pos:'1.',name:'Noch offen',info:'Finale ausstehend'});rows.push({pos:'2.',name:'Noch offen',info:'Finale ausstehend'})}
 let active=n-eliminated.reduce((a,g)=>a+g.names.length,0);for(let i=eliminated.length-1;i>=0;i--){let g=eliminated[i];let place=n-eliminated.slice(0,i+1).reduce((a,v)=>a+v.names.length,0)+1;for(const name of g.names)rows.push({pos:place+'.',name,info:`Verliererbaum · Runde ${g.round}`})}
 return `<div class="ranking"><h2>Aktuelle Platzierungen</h2><p class="hint">Gleiche Platzierung für Teilnehmer, die in derselben Ausscheidungsrunde ausgeschieden sind. Endgültige Plätze 1 und 2 nach dem Finale.</p>${rows.map(r=>`<div class="rank-row"><div class="pos">${r.pos}</div><strong>${safe(r.name)}</strong><div class="detail">${r.info}</div></div>`).join('')}</div>`}
function render(){calculate();planCurrent();metrics();$('tournamentName').value=state.name;$('tournamentDate').value=state.date;$('fieldSize').value=state.size;$('venue').value=state.venue||'Stocksporthalle Union Putzleinsdorf';$('organizer').value=state.organizer||'Union Putzleinsdorf';$('director').value=state.director||'Union Putzleinsdorf';state.turns=normalizeTurns(state.turns);$('turnsFirst').value=state.turns.first;$('turnsLater').value=state.turns.later;$('turnsFinal').value=state.turns.final;$('autoSheets').checked=state.autoSheets!==false;document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===activeTab));let html='';if(!state.players.length)html='<div class="empty-state"><strong>Turnier anlegen</strong>Teilnehmer eingeben und Turnier erstellen.</div>';else if(activeTab==='winner')html='<h2>Siegerbaum</h2><p class="match-note">Von links nach rechts: Gewinner werden automatisch in die nächste Runde gesetzt; Verlierer wechseln in den Verliererbaum.</p>'+bracketHtml(graph.win,'S');else if(activeTab==='loser')html='<h2>Verliererbaum</h2><p class="match-note">Nach der zweiten Niederlage scheidet ein Teilnehmer aus. Freilose werden sofort ohne Ergebnis übernommen und der Spieler direkt in die nächste Runde geschrieben.</p>'+bracketHtml(graph.lose,'V');else if(activeTab==='final')html='<h2 style="text-align:center">Großes Finale</h2><p class="info">Der Sieger des Siegerbaums trifft auf den Sieger des Verliererbaums. Gewinnt der bisher ungeschlagene Teilnehmer, steht der Sieger fest. Gewinnt der Teilnehmer aus dem Verliererbaum, gibt es ein zweites entscheidendes Finale.</p><div class="grand"><div><h3>Finale 1</h3>'+matchHtml(graph.gf)+'</div><div><h3>Entscheidungsfinale (falls nötig)</h3>'+matchHtml(graph.reset)+'</div></div>';else html=rankings();$('content').innerHTML=html;}
function openMatch(id){let m=graph.byId[id];if(!m||!m.ready||!['active','editable'].includes(matchAccess(m)))return;editId=id;$('modalTitle').textContent=id==='GF'?'Finale 1':id==='RESET'?'Entscheidungsfinale':'Ergebnis '+id;$('modalSub').textContent=state.name;$('leftName').textContent=m.a;$('rightName').textContent=m.b;$('scoreA').value=m.score?.[0]??'';$('scoreB').value=m.score?.[1]??'';$('removeScore').disabled=!m.score;$('modal').classList.remove('hidden');$('scoreA').focus()}
function closeModal(){$('modal').classList.add('hidden');editId=null}
function updateScore(remove=false){if(!editId)return;let m=graph.byId[editId];if(!['active','editable'].includes(matchAccess(m)))return;if(remove){delete state.results[editId]}else{let sa=Number($('scoreA').value),sb=Number($('scoreB').value);if($('scoreA').value===''||$('scoreB').value===''||!Number.isInteger(sa)||!Number.isInteger(sb)||sa<0||sb<0||sa>999||sb>999){alert('Bitte zwei gültige ganze Ergebnisse zwischen 0 und 999 eingeben.');return}if(sa===sb){alert('Im Doppel-KO muss es einen Sieger geben. Bitte ein entscheidendes Ergebnis eintragen.');return}state.results[editId]={a:m.a,b:m.b,sa,sb}}
 persist();closeModal();render();syncReleasedSheets(true);scheduleCloudSave(true)}

// Stammliste ist aus der bestehenden Turnierauslosung übernommen (Stand der Testversion).
// Keine direkte Lokalspeicher- oder Mitgliederverwaltungs-Abfrage in dieser lokalen Testdatei.
const UP_ROSTER=[];
const rosterChecked=new Set();
const playerKey=s=>String(s||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('de-DE');
const inputNames=()=> $('players').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
function showRosterMessage(msg,error=false){const el=$('rosterFeedback');el.textContent=msg;el.classList.toggle('error',error)}
let lastRosterCount=null;
function updateModeChoices(){
 const n=inputNames().length,sel=$('fieldSize'),eligible=[8,16,32].filter(size=>n>=2&&n<=size);
 const countChanged=lastRosterCount!==null&&lastRosterCount!==n;
 for(const opt of sel.options)opt.disabled=!eligible.includes(Number(opt.value));
 sel.disabled=eligible.length===0;
 if(eligible.length&&(countChanged||!eligible.includes(Number(sel.value))))sel.value=String(eligible[0]);
 $('create').disabled=eligible.length===0;
 $('modeHint').textContent=n<2?'Bitte zuerst mindestens 2 Spieler hinzufügen.':n>32?'Maximal 32 Spieler möglich. Bitte Teilnehmerliste kürzen.':`${n} Spieler ausgewählt · verfügbare Felder: ${eligible.map(x=>x+'er').join(', ')}. Vorschlag: ${eligible[0]}er-Feld.`;
 lastRosterCount=n;
}
function updateRosterSlots(){const n=inputNames().length;$('rosterSlots').textContent=`${n} / 32 Spieler`;$('rosterSlots').style.color=n>32?'#ff9a9a':'#f3cb72';updateModeChoices();}
function renderRoster(){
 const current=new Set(inputNames().map(playerKey)),query=playerKey($('rosterSearch').value);
 const visible=UP_ROSTER.filter(name=>playerKey(name).includes(query));
 $('rosterGrid').innerHTML=visible.map(name=>{
  const added=current.has(playerKey(name)),checked=rosterChecked.has(name);
  return `<label class="roster-option ${added?'in-list':''}" title="${safe(name)}"><input type="checkbox" data-roster-name="${safe(name)}" ${checked?'checked':''} ${added?'disabled':''}><span>${safe(name)}${added?' ✓':''}</span></label>`;
 }).join('')||'<div style="padding:15px;color:#e5b8c0">Keine passenden Spieler gefunden.</div>';
 $('rosterCount').textContent=`${rosterChecked.size} angehakt · ${visible.length} Vorschläge sichtbar · ${UP_ROSTER.length} insgesamt`;
 updateRosterSlots();renderPlayerManager();
}
function renderPlayerManager(){
 const current=inputNames(),withdrawn=new Set(state.withdrawn||[]);
 $('playerManager').innerHTML=current.map((name,i)=>`<div class="player-manager-row"><span title="${safe(name)}">${safe(name)}</span><button class="player-remove" type="button" data-remove-player="${safe(name)}" aria-label="${safe(name)} entfernen" title="Spieler entfernen">✕</button></div>`).join('');
 $('withdrawnNote').textContent=withdrawn.size?`${withdrawn.size} Spieler während des laufenden Turniers abgemeldet (frühere Ergebnisse bleiben erhalten): ${[...withdrawn].map(i=>state.players[i]).join(', ')}`:'';
}
function removePlayer(name){
 const names=inputNames(),i=names.findIndex(n=>playerKey(n)===playerKey(name));if(i<0)return;
 const started=Object.keys(state.results).length>0;
 if(!confirm(started?`${name} vom laufenden Turnier abmelden? Bereits gespielte Ergebnisse bleiben erhalten. Offene Spiele mit diesem Spieler werden kampflos gewertet.`:`${name} aus der Teilnehmerliste entfernen?`))return;
 if(started){
  const seed=state.players.findIndex((n,j)=>playerKey(n)===playerKey(name)&&!(state.withdrawn||[]).includes(j));
  if(seed<0){alert('Dieser Spieler ist nicht als aktiver Teilnehmer im Turnier vorhanden.');return;}
  state.withdrawn=[...new Set([...(state.withdrawn||[]),seed])];
 }else{
  // Noch keine Ergebnisse: das bestehende Turnierfeld direkt neu setzen.
  if(state.players.length){state.players=state.players.filter(n=>playerKey(n)!==playerKey(name));state.withdrawn=[];}
 }
 names.splice(i,1);$('players').value=names.join('\n');
 if(!started&&state.players.length<2){state.players=[];state.results={};}
 persist();render();renderRoster();
}
$('playerManager').addEventListener('click',e=>{const b=e.target.closest('[data-remove-player]');if(b)removePlayer(b.dataset.removePlayer)});
function addParticipants(names){
 const size=32,current=inputNames(),existing=new Set(current.map(playerKey));
 let added=0,duplicates=0,full=0;
 for(const raw of names){const name=String(raw).trim().replace(/\s+/g,' ');if(!name)continue;
  const key=playerKey(name);if(existing.has(key)){duplicates++;continue}
  if(current.length>=size){full++;continue}
  current.push(name);existing.add(key);added++;
 }
 $('players').value=current.join('\n');renderRoster();
 showRosterMessage(`${added} Spieler hinzugefügt.${duplicates?' '+duplicates+' bereits vorhanden.':''}${full?' '+full+' wegen voller Teilnehmerliste nicht übernommen.':''}`,full>0||added===0);
 return added;
}
$('rosterToggle').onclick=()=>{const body=$('rosterBody'),open=body.classList.toggle('hidden')===false;$('rosterToggle').setAttribute('aria-expanded',String(open));$('rosterChevron').textContent=open?'⌃':'⌄'};
$('rosterSearch').addEventListener('input',renderRoster);
$('players').addEventListener('input',renderRoster);
$('fieldSize').addEventListener('change',renderRoster);
$('rosterGrid').addEventListener('change',e=>{const cb=e.target.closest('input[data-roster-name]');if(!cb)return;const name=cb.dataset.rosterName;if(cb.checked)rosterChecked.add(name);else rosterChecked.delete(name);renderRoster()});
$('rosterAll').onclick=()=>{const query=playerKey($('rosterSearch').value),existing=new Set(inputNames().map(playerKey));UP_ROSTER.filter(n=>playerKey(n).includes(query)&&!existing.has(playerKey(n))).forEach(n=>rosterChecked.add(n));renderRoster()};
$('rosterNone').onclick=()=>{rosterChecked.clear();renderRoster()};
$('rosterAdd').onclick=()=>{addParticipants(UP_ROSTER.filter(n=>rosterChecked.has(n)));rosterChecked.clear();renderRoster()};
function addGuest(){const input=$('guestName'),name=input.value.trim();if(!name){showRosterMessage('Bitte zuerst einen Namen eingeben.',true);input.focus();return}if(addParticipants([name]))input.value=''}
$('guestAdd').onclick=addGuest;
$('guestName').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addGuest()}});

function makeTournament(){let size=Number($('fieldSize').value),name=$('tournamentName').value.trim()||'Doppel KO',date=$('tournamentDate').value;let names=$('players').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(![8,16,32].includes(size)||names.length<2||names.length>size){alert('Bitte zuerst mindestens 2 Spieler auswählen und danach ein ausreichend großes Turnierfeld wählen.');return}if(new Set(names.map(s=>s.toLocaleLowerCase('de'))).size!==names.length){alert('Teilnehmernamen müssen eindeutig sein.');return}if(Object.keys(state.results).length&&!confirm('Alle bisherigen Ergebnisse zurücksetzen und Turnier neu erstellen?'))return;if(soloPrintCurrent)finishSoloPrint(false);soloPrintQueue.length=0;soloQueueStatus();state={size,name,date,players:names,results:{},fastMode:$('fastMode').checked,withdrawn:[],venue:$('venue').value.trim(),organizer:$('organizer').value.trim(),director:$('director').value.trim(),turns:normalizeTurns({first:$('turnsFirst').value,later:$('turnsLater').value,final:$('turnsFinal').value}),autoSheets:$('autoSheets').checked,sheetPrompts:[]};correctionMode=false;cloudEnsureId();persist();activeTab='winner';renderRoster();render();syncReleasedSheets(true);scheduleCloudSave(true);}
$('create').onclick=makeTournament;$('example').onclick=()=>{const count=9;$('players').value=Array.from({length:count},(_,i)=>'Spieler '+(i+1)).join('\n');$('tournamentName').value='Union Putzleinsdorf – Testturnier';renderRoster()};$('clear').onclick=()=>{if(!confirm('Turnier und alle lokalen Ergebnisse löschen?'))return;if(soloPrintCurrent)finishSoloPrint(false);soloPrintQueue.length=0;soloQueueStatus();state={size:16,name:'Union Putzleinsdorf – Doppel KO',date:'',players:[],results:{},fastMode:false,withdrawn:[],venue:'Stocksporthalle Union Putzleinsdorf',organizer:'Union Putzleinsdorf',director:'Union Putzleinsdorf',turns:{first:6,later:8,final:10},autoSheets:true,sheetPrompts:[]};correctionMode=false;cloudResetSelection();persist();$('players').value='';rosterChecked.clear();renderRoster();render()};$('fastMode').onchange=()=>{if(!state.players.length)return;const selected=$('fieldSize').value,enteredName=$('tournamentName').value,enteredDate=$('tournamentDate').value,enteredVenue=$('venue').value,enteredOrg=$('organizer').value,enteredDirector=$('director').value;state.fastMode=$('fastMode').checked;persist();render();$('fieldSize').value=selected;$('tournamentName').value=enteredName;$('tournamentDate').value=enteredDate;$('venue').value=enteredVenue;$('organizer').value=enteredOrg;$('director').value=enteredDirector;if(!$('wbView').classList.contains('hidden'))renderWhiteboard()};$('toggleSetup').onclick=()=>{let field=$('players').parentElement;field.classList.toggle('hidden');$('toggleSetup').textContent=field.classList.contains('hidden')?'Teilnehmer anzeigen':'Teilnehmer ausblenden'};
// Ergebnis direkt in der jeweiligen Spielkarte speichern – auch im Whiteboard.
function commitInline(id,container,remove=false){
 const m=graph.byId[id];if(!m||!m.ready||!m.a||!m.b||m.auto||m.void)return;
 const access=matchAccess(m);if(access!=='active'&&access!=='editable')return;
 const scores=[...container.querySelectorAll('[data-score-input]')].filter(el=>el.dataset.scoreInput===id);
 if(!remove){
  const a=scores.find(el=>el.dataset.side==='0'),b=scores.find(el=>el.dataset.side==='1');if(!a||!b)return;
  const sa=Number(a.querySelector('[data-score-value]')?.textContent),sb=Number(b.querySelector('[data-score-value]')?.textContent);
  if(!Number.isInteger(sa)||!Number.isInteger(sb)||sa<0||sb<0||sa>999||sb>999){alert('Bitte ein gültiges Ergebnis zwischen 0 und 999 einstellen.');return}
  if(sa===sb){alert('Es muss einen Sieger geben. Bitte mit + oder − ein eindeutiges Ergebnis einstellen.');return}
  if(m.score&&m.score[0]===sa&&m.score[1]===sb)return;
  if(m.score&&!confirm('Ergebnis ändern? Abhängige Folgeergebnisse können dadurch zurückgesetzt werden.'))return;
  state.results[id]={a:m.a,b:m.b,sa,sb};
 }else{
  if(!m.score||!confirm('Ergebnis wirklich löschen? Abhängige Folgeergebnisse können ebenfalls zurückgesetzt werden.'))return;
  delete state.results[id];
 }
 const wbVisible=!$('wbView').classList.contains('hidden');
 const positions={};if(wbVisible){for(const k of ['wbLoser','wbWinner']){const el=$(k);positions[k]=[el.scrollLeft,el.scrollTop]}}else{const el=$('content').querySelector('.scroll');if(el)positions.main=[el.scrollLeft,el.scrollTop]}
 persist();calculate();planCurrent();if(!wbVisible&&!correctionMode&&turnPlan.activeId){activeTab=graph.byId[turnPlan.activeId].section;}render();
 if(wbVisible){renderWhiteboard();}
 else if(positions.main){const el=$('content').querySelector('.scroll');if(el){el.scrollLeft=positions.main[0];el.scrollTop=positions.main[1]}}
 syncReleasedSheets(true);scheduleCloudSave(true);
}
document.addEventListener('click',e=>{
 const step=e.target.closest('[data-score-step]');
 if(step){const card=step.closest('.match,.wb-match,.wb-final-game');if(!card)return;
  const id=step.dataset.scoreStep,m=graph.byId[id];if(!m||!['active','editable'].includes(matchAccess(m)))return;
  const parent=step.closest('[data-score-input]'),output=parent?.querySelector('[data-score-value]');if(!output)return;
  const value=Math.max(0,Math.min(999,Number(output.textContent)+Number(step.dataset.delta)));
  output.textContent=String(value);return;
 }
 const save=e.target.closest('[data-score-save]'),remove=e.target.closest('[data-score-remove]');
 if(!save&&!remove)return;
 const button=save||remove,card=button.closest('.match,.wb-match,.wb-final-game');if(card)commitInline(save?save.dataset.scoreSave:remove.dataset.scoreRemove,card,!!remove);
});
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{activeTab=t.dataset.tab;render()});$('cancel').onclick=closeModal;$('modal').onclick=e=>{if(e.target===$('modal'))closeModal()};$('saveScore').onclick=()=>updateScore();$('removeScore').onclick=()=>{if(confirm('Ergebnis löschen? Nachfolgende Spiele können dadurch ebenfalls ungültig werden.'))updateScore(true)};document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('wbView').classList.contains('hidden')?closeModal():exitWhiteboard()}});

// A4-Ergebnisliste nach der vom Verein bereitgestellten Herbstturnier-Vorlage.
const UP_PRINT_BANNER='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTM2IiBoZWlnaHQ9Ijg2NCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiIj48c3RvcCBzdG9wLWNvbG9yPSIjMTExODI3Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjMzA0NjVjIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZmlsbD0idXJsKCNiKSIgZD0iTTAgMGgxNTM2djg2NEgweiIvPjx0ZXh0IHg9Ijc2OCIgeT0iNDQwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjcyIj5VbmlvbiBQdXR6bGVpbnNkb3JmPC90ZXh0Pjwvc3ZnPg==';
// V2.1 Wertungsblätter: eine A4-Querformat-Seite pro freigegebener Begegnung.
const turnsDefaults={first:6,later:8,final:10};
function normalizeTurns(t){const out={};for(const k of ['first','later','final']){const n=Number(t?.[k]);out[k]=Number.isInteger(n)&&n>=1&&n<=20?n:turnsDefaults[k]}return out;}
function readSheetSettings(){state.turns=normalizeTurns({first:$('turnsFirst').value,later:$('turnsLater').value,final:$('turnsFinal').value});state.autoSheets=$('autoSheets').checked;persist();}
function turnsForMatch(m){const t=normalizeTurns(state.turns);return m.section==='final'?t.final:(m.round===1?t.first:t.later);}
function sheetKey(m){return [m.id,m.a,m.b].join('|');}
function stageLabel(m){if(m.section==='winner')return 'Siegerbaum · Runde '+m.round;if(m.section==='loser')return 'Verliererbaum · Runde '+m.round;return m.id==='RESET'?'Entscheidungsfinale':'Großes Finale';}
function laneForMatch(m){if(!state.fastMode)return '—';const idx=turnPlan?.activeIds?.indexOf(m.id)??-1;return idx>=0?String(idx+1):'—';}
function printSheetHtml(matches,auto,embedded=false){
 // Vorlage "Solo Spiegel 1x.pdf": Schwarz-weiß, gleiche Aufteilung,
 // Beschriftungen und Unterschriften. Nur Kehrenspaltenzahl wird angepasst.
 const tournament=safe(state.name||'Doppel KO');
 const date=state.date?new Date(state.date+'T12:00:00').toLocaleDateString('de-DE'):'____________';
 const sheets=matches.map(m=>{
  const turns=turnsForMatch(m),lane=laneForMatch(m);
  const columns=Array.from({length:turns},()=>'<span class="turn-cell"></span>').join('');
  const stage=m.section==='winner'?'Vorrunde '+m.round:(m.section==='loser'?'Verliererrunde '+m.round:(m.id==='RESET'?'Entscheidungsfinale':'Finale'));
  return `<article class="solo-sheet" data-match="${safe(m.id)}" data-turns="${turns}">
    <div class="solo-top"><div>Spiel Nr.</div><div class="value">${safe(m.id)}</div><div class="stage">${safe(stage)}</div><div>Bahn</div><div class="value">${lane}</div><div class="top-blank"></div></div>
    <div class="solo-players"><div><b>Spieler 1 -</b><strong>${safe(m.a)}</strong></div><div><b>Spieler 2 -</b><strong>${safe(m.b)}</strong></div></div>
    <div class="solo-scores" style="--turns:${turns}">
      <div class="solo-half solo-left"><div class="solo-heading"><span>Anschuss</span><span>Eigene Stockpunkte</span><span>Stock-<br>punkte</span><span>Punkte</span></div><div class="solo-entry"><div class="anschuss">Spieler 1</div><div class="turn-grid">${columns}</div><div class="stock-col"></div><div class="points-col"></div></div></div>
      <div class="solo-half solo-right"><div class="solo-heading"><span>Fremde Stockpunkte</span><span>Stock-<br>punkte</span><span>Punkte</span></div><div class="solo-entry"><div class="turn-grid">${columns}</div><div class="stock-col"></div><div class="points-col"></div></div></div>
    </div>
    <div class="solo-bottom"><div class="sig"><b>Unterschrift für Spieler 2</b><span></span></div><div class="sig date"><b>Datum</b><span>${date}</span></div><div class="sig"><b>Unterschrift für Spieler 1</b><span></span></div></div>
   </article>`;
 }).join('');
 const style=`
 @page{size:A4 landscape;margin:7mm}
 *{box-sizing:border-box}html,body{margin:0}body{background:#dedede;font-family:Arial,Helvetica,sans-serif;color:#050505}
 .print-toolbar{position:sticky;top:0;z-index:10;background:#24191b;color:white;display:flex;align-items:center;justify-content:center;gap:10px;padding:11px;font-size:14px}
 .print-toolbar button{background:#a21e33;color:white;border:0;border-radius:5px;padding:9px 13px;font-weight:bold;cursor:pointer}
 .solo-sheet{background:white;width:283mm;height:133mm;margin:25px auto 22px;display:flex;flex-direction:column;border:2.5px solid black;overflow:hidden}
 .solo-top{display:grid;grid-template-columns:21mm 13mm minmax(0,1fr) 19mm 12mm 77mm;height:20mm;border-bottom:2.5px solid black;flex:none}
 .solo-top>div{border-right:1.5px solid black;display:flex;align-items:center;justify-content:center;font-size:12pt;white-space:nowrap}
 .solo-top>div:last-child{border-right:0}.solo-top .stage{font-size:21pt;font-weight:800}.solo-top .value{font-size:11pt;font-weight:700}
 .solo-players{display:grid;grid-template-columns:1fr 1fr;height:27mm;border-bottom:2px solid black;flex:none}
 .solo-players>div{display:flex;gap:7mm;align-items:center;min-width:0;padding:0 4mm;font-size:15pt}
 .solo-players>div:first-child{border-right:3px solid black}.solo-players b{font-style:italic;font-size:14pt;white-space:nowrap}.solo-players strong{font-size:17pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .solo-scores{display:grid;grid-template-columns:1fr 1fr;flex:1;min-height:0;border-bottom:2.5px solid black}
 .solo-half{min-width:0;display:flex;flex-direction:column}.solo-left{border-right:3px solid black}
 .solo-heading{height:13mm;display:grid;border-bottom:1.5px solid black;flex:none}
 .solo-left .solo-heading,.solo-left .solo-entry{grid-template-columns:14mm minmax(0,1fr) 14mm 14mm}
 .solo-right .solo-heading,.solo-right .solo-entry{grid-template-columns:minmax(0,1fr) 14mm 14mm}
 .solo-heading>span{font-size:10pt;text-align:center;display:flex;align-items:center;justify-content:center;border-right:1.5px solid black;font-weight:bold}
 .solo-heading>span:last-child{border-right:0}
 .solo-entry{display:grid;flex:1;min-height:0}
 .solo-entry>.anschuss{display:flex;align-items:center;justify-content:center;font-size:9pt;font-weight:bold;border-right:1.5px solid black}
 .turn-grid{display:grid;grid-template-columns:repeat(var(--turns),minmax(0,1fr));min-width:0}
 .turn-cell{border-right:1.2px solid black}.turn-cell:last-child{border-right:0}
 .stock-col{border-left:3px solid black;border-right:3px solid black}.points-col{border-right:0}
 .solo-bottom{display:grid;grid-template-columns:1fr 33mm 1fr;gap:9mm;align-items:stretch;height:31mm;flex:none;padding:3mm 3mm 2mm}
 .sig{display:flex;flex-direction:column;justify-content:space-between;font-size:11pt;font-style:italic}
 .sig span{display:block;border-bottom:2px solid black;min-height:9mm;font-size:10pt;font-style:normal;text-align:center;padding-top:5mm}
 .sig.date{text-align:center}.sig.date span{min-height:10mm}
 @media print{body{background:white}.print-toolbar{display:none!important}.solo-sheet{width:100%;height:133mm;margin:31mm 0 0;border:2.5px solid black;page-break-after:auto;break-after:auto;page-break-inside:avoid;break-inside:avoid}}
 `;
 // Für den Direktdruck liegt die Druckvorlage in einem unsichtbaren iframe.
 // Es wird KEINE zusätzliche sichtbare Vorschauseite geöffnet.
 if(embedded)return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Wertungsblatt</title><style>${style}</style></head><body>${sheets}</body></html>`;
 // Einmaliger automatischer Aufruf pro Blatt: doppelte afterprint-Ereignisse,
 // wiederholte Browser-Events oder schnelle Klicks dürfen keinen zweiten Auftrag erzeugen.
 const script=`<scr${'ipt'}>
 (function(){
  const jobs=Array.from(document.querySelectorAll('.solo-sheet'));
  const status=document.getElementById('job-status');
  const btn=document.getElementById('print-next');
  const skip=document.getElementById('skip-next');
  const automatically=${auto?'true':'false'};
  const autoStarted=new Set();
  let index=0, activePrint=null, pendingAdvance=null, advanceSerial=0;
  function show(){
   jobs.forEach((el,i)=>el.style.display=i===index?'flex':'none');
   status.textContent='Wertungsblatt '+(index+1)+' von '+jobs.length+' · Spiel '+jobs[index].dataset.match+' · 1 A4-Seite';
   btn.textContent=autoStarted.has(index)?'Bei Bedarf nachdrucken':'Drucken: Spiel '+jobs[index].dataset.match;
   btn.disabled=activePrint!==null;
   skip.disabled=activePrint!==null || index===jobs.length-1;
  }
  function printOne(isAutomatic){
   if(activePrint!==null)return;
   if(isAutomatic && autoStarted.has(index))return;
   if(isAutomatic)autoStarted.add(index);
   if(pendingAdvance!==null){clearTimeout(pendingAdvance);pendingAdvance=null;}
   activePrint=index;
   show();
   window.focus();
   window.print();
  }
  function advance(){
   if(activePrint!==null || index>=jobs.length-1)return;
   advanceSerial++;
   if(pendingAdvance!==null){clearTimeout(pendingAdvance);pendingAdvance=null;}
   index++;show();
   if(automatically && !autoStarted.has(index)){
    const serial=advanceSerial;
    pendingAdvance=setTimeout(()=>{pendingAdvance=null;if(serial===advanceSerial && activePrint===null)printOne(true);},900);
   }
  }
  window.addEventListener('afterprint',()=>{
   if(activePrint===null)return; // zweites afterprint ignorieren
   const finished=activePrint;
   activePrint=null;
   show();
   if(automatically && finished===index && index<jobs.length-1){
    const serial=++advanceSerial;
    if(pendingAdvance!==null)clearTimeout(pendingAdvance);
    pendingAdvance=setTimeout(()=>{pendingAdvance=null;if(serial===advanceSerial && activePrint===null)advance();},850);
   }
  });
  btn.onclick=()=>printOne(false);
  skip.onclick=advance;
  show();
  if(automatically)setTimeout(()=>printOne(true),500);
 })();<\/scr${'ipt'}>`;
 return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Union Putzleinsdorf · Solo-Spiegel Wertungsblätter</title><style>${style}</style></head><body><div class="print-toolbar"><span id="job-status"></span><button id="print-next">Drucken</button><button id="skip-next">Nächstes Blatt</button><button onclick="window.close()">Schließen</button></div>${sheets}${script}</body></html>`;
}
// V2.1: Pro NEU freigegebener Spielpaarung ein EIGENER Druckdialog.
// "1x" gilt PRO PAARUNG, nicht einmalig pro Turnier. Der Browser darf
// wiederholte Dialoge blockieren: daher bleibt ein direkter Touch-Druckbutton sichtbar.
const soloPrintQueue=[];
let soloPrintCurrent=null,soloPrintFrame=null,soloPrintNextTimer=null;
let soloPrintStarted=false,soloPrintFrameReady=false,soloPrintGeneration=0;
function soloQueueStatus(){
 let el=document.getElementById('solo-queue-status');
 if(!el){el=document.createElement('div');el.id='solo-queue-status';
  el.style.cssText='position:fixed;bottom:16px;right:16px;z-index:99999;background:#24191b;color:#fff;border:1px solid #e45a6c;border-radius:10px;padding:12px 14px;box-shadow:0 6px 30px #0009;font:14px Arial;max-width:440px';
  el.innerHTML='<span id="solo-queue-text"></span> <button id="solo-queue-next" type="button" style="background:#a21e33;color:white;border:0;padding:9px 11px;border-radius:6px;cursor:pointer;margin-left:8px;font-weight:bold">Wertungsblatt drucken</button>';
  document.body.appendChild(el);
  document.getElementById('solo-queue-next').onclick=()=>{
   // Direkter Benutzerklick ist zuverlässiger als ein automatischer Folgedialog.
   if(soloPrintCurrent){
    if(soloPrintStarted){finishSoloPrint(false);runSoloPrint(true);}
    else if(soloPrintFrameReady){launchSoloPrint(true);}
   }else runSoloPrint(true);
  };
 }
 const remaining=soloPrintQueue.length;
 el.style.display=(soloPrintCurrent||remaining)?'block':'none';
 if(soloPrintCurrent||remaining){
  document.getElementById('solo-queue-text').textContent=soloPrintCurrent?
   'Spiel '+soloPrintCurrent.match.id+' · '+(remaining?remaining+' weitere Blätter warten':'1 Wertungsblatt'):
   remaining+' Wertungsblatt'+(remaining===1?'':'blätter')+' bereit';
  document.getElementById('solo-queue-next').textContent=soloPrintCurrent&&soloPrintStarted?'Nächstes Wertungsblatt':'Wertungsblatt drucken';
 }
}
function finishSoloPrint(autoContinue=true){
 if(!soloPrintCurrent)return;
 const frame=soloPrintFrame;
 soloPrintCurrent=null;soloPrintFrame=null;soloPrintStarted=false;soloPrintFrameReady=false;
 soloPrintGeneration++;
 if(frame)frame.remove();
 if(soloPrintNextTimer){clearTimeout(soloPrintNextTimer);soloPrintNextTimer=null;}
 soloQueueStatus();
 if(autoContinue&&soloPrintQueue.length){
  soloPrintNextTimer=setTimeout(()=>{soloPrintNextTimer=null;runSoloPrint();},700);
 }
}
function launchSoloPrint(userGesture=false){
 if(!soloPrintCurrent||!soloPrintFrameReady||soloPrintStarted||!soloPrintFrame)return;
 const job=soloPrintCurrent,frame=soloPrintFrame;
 soloPrintStarted=true;
 soloQueueStatus();
 try{frame.contentWindow.focus();frame.contentWindow.print();}
 catch(e){console.error('Druckdialog konnte nicht geöffnet werden',e);
  soloPrintStarted=false;soloQueueStatus();}
}
function runSoloPrint(userGesture=false){
 if(soloPrintCurrent||!soloPrintQueue.length)return;
 if(soloPrintNextTimer){clearTimeout(soloPrintNextTimer);soloPrintNextTimer=null;}
 const job=soloPrintQueue.shift();soloPrintCurrent=job;
 soloPrintStarted=false;soloPrintFrameReady=false;
 const generation=++soloPrintGeneration;
 const frame=document.createElement('iframe');soloPrintFrame=frame;
 frame.setAttribute('title','Wertungsblatt '+job.match.id);
 frame.setAttribute('aria-hidden','true');
 frame.style.cssText='position:fixed;left:-200vw;top:0;width:1123px;height:794px;border:0;opacity:0;pointer-events:none';
 frame.onload=()=>{
  if(soloPrintCurrent!==job||soloPrintGeneration!==generation)return;
  soloPrintFrameReady=true;
  try{
   frame.contentWindow.addEventListener('afterprint',()=>{
    if(soloPrintCurrent===job&&soloPrintGeneration===generation)finishSoloPrint();
   });
   // Falls der Browser "afterprint" nur am Hauptfenster meldet,
   // bleibt der manuelle Folgedruck-Button als sichere Alternative.
   setTimeout(()=>{
    if(soloPrintCurrent===job&&soloPrintGeneration===generation)launchSoloPrint(userGesture);
   },120);
  }catch(e){console.error('Druckvorlage konnte nicht geladen werden',e);soloPrintStarted=false;soloQueueStatus();}
 };
 document.body.appendChild(frame);
 frame.srcdoc=printSheetHtml([job.match],false,true);
 soloQueueStatus();
}
function openSheets(matches,auto=false){
 if(!matches.length){if(!auto)alert('Keine freigegebenen Paarungen vorhanden.');return false;}
 let added=0;
 for(const m of matches){
  const key=sheetKey(m);
  // Doppelte Automatik-Ereignisse pro Paarung abfangen, NICHT weitere Paarungen sperren.
  if(auto&&(soloPrintCurrent?.key===key||soloPrintQueue.some(j=>j.key===key)))continue;
  soloPrintQueue.push({match:m,key});added++;
 }
 soloQueueStatus();
 if(!soloPrintCurrent){runSoloPrint();}
 return added>0;
}
function syncReleasedSheets(automatic){if(!state.players.length)return;
 const prompted=new Set(state.sheetPrompts||[]);
 const fresh=(turnPlan?.activeIds||[]).map(id=>graph.byId[id]).filter(m=>m&&m.ready&&!m.done&&m.a&&m.b&&!prompted.has(sheetKey(m)));
 if(!fresh.length)return;
 if(automatic&&state.autoSheets){
  // Wird bereits die NÄCHSTE Begegnung gespielt, ist der vorherige Druckdialog
  // definitiv nicht mehr im Vordergrund. Bei fehlendem afterprint die Warteschlange lösen.
  if(soloPrintCurrent&&soloPrintStarted)finishSoloPrint(false);
  if(openSheets(fresh,true)){
   state.sheetPrompts=[...prompted,...fresh.map(sheetKey)];persist();
  }
 }
}
function printActiveSheets(){calculate();planCurrent();
 const matches=(turnPlan?.activeIds||[]).map(id=>graph.byId[id]).filter(m=>m&&m.ready&&!m.done&&m.a&&m.b);
 if(openSheets(matches,false)){
  const keys=new Set(state.sheetPrompts||[]);matches.forEach(m=>keys.add(sheetKey(m)));
  state.sheetPrompts=[...keys];persist();
 }
}
$('printSheets').onclick=printActiveSheets;$('wbPrintSheets').onclick=printActiveSheets;
$('autoSheets').addEventListener('change',readSheetSettings);
for(const id of ['turnsFirst','turnsLater','turnsFinal'])$(id).addEventListener('change',readSheetSettings);
function printResultSheet(){
 calculate();planCurrent();
 if(!state.players.length){alert('Bitte zuerst ein Turnier anlegen.');return;}
 const finished=graph.gf.done&&(graph.reset.done||graph.reset.void);
 if(!finished&&!confirm('Das Turnier ist noch nicht abgeschlossen. Eine vorläufige Ergebnisliste als Zwischenstand öffnen?'))return;
 const inputDate=$('tournamentDate').value||state.date;
 const date=inputDate?new Date(inputDate+'T12:00:00').toLocaleDateString('de-DE',{weekday:'long',day:'2-digit',month:'2-digit',year:'numeric'}):'–';
 const eliminated=[];
 for(let i=0;i<graph.lose.length;i++){
  const names=graph.lose[i].filter(m=>m.loser).map(m=>m.loser);
  if(names.length)eliminated.push({round:i+1,names});
 }
 const withdrawn=new Set((state.withdrawn||[]).map(i=>state.players[i]));
 let places=[];
 if(finished){
  const f=graph.reset.done&&!graph.reset.void?graph.reset:graph.gf;
  places.push({rank:1,name:f.winner},{rank:2,name:f.loser});
 }
 const originalN=state.players.length;
 for(let i=eliminated.length-1;i>=0;i--){
  const rank=originalN-eliminated.slice(0,i+1).reduce((a,g)=>a+g.names.length,0)+1;
  eliminated[i].names.forEach(name=>places.push({rank,name}));
 }
 // Abgemeldete Spieler separat kennzeichnen; nicht fälschlich als reguläre Sieger ausweisen.
 for(const name of withdrawn)if(!places.some(p=>p.name===name))places.push({rank:'–',name,status:'Abgemeldet'});
 const remaining=state.players.filter(n=>!withdrawn.has(n)&&!places.some(p=>p.name===n));
 if(!finished)remaining.forEach(name=>places.push({rank:'–',name,status:'Platzierung offen'}));
 const sheetTitle=($('tournamentName').value.trim()||state.name);
 const venue=$('venue').value.trim()||state.venue||'–';
 const organizer=$('organizer').value.trim()||state.organizer||'–';
 const director=$('director').value.trim()||state.director||'–';
 // Druckdaten für die lokale Testversion aktualisieren, ohne Ergebnisse zu verändern.
 state.name=sheetTitle;state.date=$('tournamentDate').value;state.venue=venue;state.organizer=organizer;state.director=director;persist();
 const printClass=places.length>16?'compact-32':places.length>8?'compact-16':'compact-8';
 const rows=places.map((p,i)=>`<tr><td>${safe(p.rank==='–'?'–':p.rank+'.')}</td><td><strong>${safe(p.name)}</strong>${p.status&&printClass==='compact-8'?`<small>${safe(p.status)}</small>`:p.status==='Abgemeldet'?'<small> (Abgemeldet)</small>':''}</td></tr>`).join('');
 const html=`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${safe(sheetTitle)} – Ergebnisliste</title><style>
 @page{size:A4;margin:13mm 15mm 15mm}*{box-sizing:border-box}body{font:12pt Arial,Helvetica,sans-serif;color:#161616;margin:0;background:#eee}
 .sheet{width:210mm;min-height:297mm;margin:10mm auto;background:white;padding:13mm 15mm 15mm;box-shadow:0 8px 35px #0002}
 .banner{width:100%;height:29mm;object-fit:cover;display:block}.title{font-size:28pt;font-weight:900;line-height:1.05;margin:7mm 0 6mm;overflow-wrap:anywhere}
 .meta{display:grid;grid-template-columns:1fr 1fr;gap:2.5mm 6mm;font-size:10pt;margin-bottom:7mm}.meta div{display:flex;gap:5px}.meta label{color:#444;min-width:29mm}.meta strong{font-weight:750}
 .line{border-top:1px solid #555;margin-top:4mm}.result-title{text-align:center;font-size:17pt;font-weight:900;letter-spacing:6px;margin:6mm 0 13mm}
 table{width:100%;border-collapse:collapse;font-size:12pt}th{text-align:left;border-bottom:2px solid #555;padding:3mm 3mm}td{padding:3.3mm 3mm;vertical-align:top}th:first-child,td:first-child{width:20mm;text-align:center}tbody tr:nth-child(even){background:#f0f0f0}tr{break-inside:avoid}td small{display:block;color:#666;font-size:9pt;margin-top:1mm}
 .notice{text-align:center;color:#9d2737;font-weight:800;font-size:11pt;margin:-8mm 0 8mm}.print-actions{margin:15px auto;display:flex;gap:10px;justify-content:center}.print-actions button{background:#8f2131;border:0;color:white;padding:12px 18px;border-radius:8px;cursor:pointer;font-size:15px}
 /* V1.6: die vollständige Rangliste passt auch mit 32 Spielern auf genau ein A4-Blatt. */
 .sheet{min-height:0}
 .compact-16 .banner{height:24mm}.compact-16 .title{font-size:24pt;margin:5mm 0 4mm}
 .compact-16 .meta{font-size:9pt;margin-bottom:4mm}.compact-16 .result-title{font-size:15pt;margin:4mm 0 7mm}
 .compact-16 table{font-size:10.5pt}.compact-16 th{padding:2mm}.compact-16 td{padding:2mm 2.5mm;line-height:1.13}
 .compact-32 .banner{height:18mm}.compact-32 .title{font-size:20pt;line-height:1.02;margin:3.5mm 0 3mm}
 .compact-32 .meta{font-size:8.5pt;gap:1mm 4mm;margin-bottom:3mm;line-height:1.15}
 .compact-32 .meta label{min-width:23mm}.compact-32 .line{margin-top:2mm}
 .compact-32 .result-title{font-size:14pt;letter-spacing:4px;margin:3mm 0 5mm}
 .compact-32 table{font-size:9.5pt;line-height:1.08;table-layout:fixed}
 .compact-32 th{padding:1.3mm 2mm}.compact-32 td{padding:1.3mm 2mm;line-height:1.08}
 .compact-32 th:first-child,.compact-32 td:first-child{width:15mm}
 .compact-32 td small{display:inline;font-size:7pt;margin-top:0;line-height:1.0}
 .compact-32 .notice{font-size:9pt;margin:-2mm 0 2mm}
 @media print{
  @page{size:A4 portrait;margin:8mm 11mm}
  html,body{width:100%;margin:0;padding:0;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .sheet{width:100%;min-height:0;height:auto;margin:0;padding:0;box-shadow:none;break-inside:avoid;page-break-inside:avoid}
  .print-actions{display:none!important}
  .sheet .banner{max-width:100%}
  .sheet table{break-inside:auto;page-break-inside:auto}
  .sheet tr{break-inside:avoid;page-break-inside:avoid}
 }

 </style></head><body><div class="print-actions"><button onclick="window.print()">Drucken / Als PDF speichern</button><button onclick="window.close()">Schließen</button></div>
 <div class="sheet ${printClass}"><img class="banner" src="${UP_PRINT_BANNER}"><div class="title">${safe(sheetTitle)}</div><div class="meta"><div><label>Austragungsort:</label><strong>${safe(venue)}</strong></div><div><label>Datum:</label><strong>${safe(date)}</strong></div><div><label>Veranstalter:</label><strong>${safe(organizer)}</strong></div><div><label>Durchführer:</label><strong>${safe(director)}</strong></div></div><div class="line"></div><div class="result-title">ERGEBNIS</div>${finished?'':'<div class="notice">ZWISCHENSTAND – Platzierungen noch nicht endgültig</div>'}<table><thead><tr><th>Rang</th><th>Spieler</th></tr></thead><tbody>${rows}</tbody></table></div></body></html>`;
 const w=window.open('','_blank');
 if(!w){alert('Der Browser hat das Druckfenster blockiert. Bitte Pop-ups erlauben.');return;}
 w.document.open();w.document.write(html);w.document.close();
}
$('printResults').onclick=printResultSheet;

$('export').onclick=()=>{let blob=new Blob([JSON.stringify({app:'UP_DOPPEL_KO',version:1,...state},null,2)],{type:'application/json'});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`UP_Doppel_KO_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};$('import').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let x=JSON.parse(await f.text());if(x.app!=='UP_DOPPEL_KO'||![8,16,32].includes(x.size)||!Array.isArray(x.players)||x.players.length<2||x.players.length>x.size||!x.results||typeof x.results!=='object')throw Error('Keine gültige Doppel-KO-Sicherung');if(!confirm('Vorhandenes Turnier durch die Sicherung ersetzen?'))return;state={size:x.size,name:String(x.name||'Doppel KO'),date:String(x.date||''),players:x.players.map(String),results:x.results,fastMode:!!x.fastMode,withdrawn:Array.isArray(x.withdrawn)?x.withdrawn:[],venue:x.venue||'Stocksporthalle Union Putzleinsdorf',organizer:x.organizer||'Union Putzleinsdorf',director:x.director||'Union Putzleinsdorf',turns:normalizeTurns(x.turns),autoSheets:x.autoSheets!==false,sheetPrompts:Array.isArray(x.sheetPrompts)?x.sheetPrompts:[]};correctionMode=false;persist();$('players').value=state.players.filter((_,i)=>!(state.withdrawn||[]).includes(i)).join('\n');lastRosterCount=inputNames().length;render();renderRoster()}catch(err){alert('Import fehlgeschlagen: '+err.message)}finally{e.target.value=''}};

function whiteboardMatch(m){
 const done=m.score?'done':m.ready&&!m.done?'ready':m.auto?'auto':'';
 const line=(name,idx)=>{
  const bye=m.auto&&!name&&m.ready,display=bye?'FREILOS':(name||'–');
  return `<div class="wb-team ${m.winner&&name===m.winner?'win':''} ${!name&&!bye?'missing':''} ${bye?'bye-team':''}"><strong title="${safe(display)}">${safe(display)}</strong>${bye?'<span class="bye-indicator">F</span>':inlineScore(m,idx,true)}</div>`;
 };
 return `<div class="wb-match ${done} ${matchClass(m)}" data-match-id="${safe(m.id)}" title="${safe(m.id)}"><div class="wb-match-top"><span>${safe(m.id)} ${m.auto?'· FREILOS → WEITER':''}</span>${scoreActions(m)}</div>${line(m.a,0)}${line(m.b,1)}</div>`;
}
function whiteboardRounds(rounds,mirror){
 const displayed=mirror?[...rounds].reverse():rounds;
 return `<div class="wb-rounds" style="grid-template-columns:repeat(${displayed.length},minmax(0,1fr))">${displayed.map(arr=>`<div class="wb-round"><div class="wb-round-label">R${arr[0]?.round??'–'}</div><div class="wb-round-games">${arr.map(whiteboardMatch).join('')}</div></div>`).join('')}</div>`;
}
function whiteboardFinal(){
 const gf=graph.gf,reset=graph.reset,finished=gf.done&&(reset.done||reset.void),champ=finished?(reset.done&&!reset.void?reset.winner:gf.winner):null;
 const finalCard=(m,label)=>`<div class="wb-final-game ${matchClass(m)}" data-match-id="${safe(m.id)}"><div class="wb-final-title"><span>${label}</span>${scoreActions(m)}</div>${[m.a,m.b].map((name,idx)=>`<div class="wb-final-team ${m.winner&&name===m.winner?'win':''}"><strong title="${safe(name||'Noch offen')}">${safe(name||'–')}</strong>${inlineScore(m,idx,true)}</div>`).join('')}${finalConfirmButton(m,true)}</div>`;
 return `<div class="wb-center-label">🏆 FINALE</div>${finalCard(gf,'Finale 1')}${!reset.void?finalCard(reset,'Entscheidungsfinale'):''}<div class="wb-champion"><div class="wb-center-small">${finished?'TURNIERSIEGER':'Turnier läuft'}</div><div class="wb-center-name" style="color:#f6cf76">${safe(champ||'Noch offen')}</div></div>`;
}

function fitWhiteboardNames(){
 const view=$('wbView');if(view.classList.contains('hidden'))return;
 const minFont=view.classList.contains('wb-32')?8:9;
 view.querySelectorAll('.wb-team strong,.wb-final-team strong').forEach(el=>{
  el.style.fontSize='';
  const base=parseFloat(getComputedStyle(el).fontSize)||12;
  let font=base;
  // scrollWidth misst den ungekürzten Namen, clientWidth den freien Platz.
  while(font>minFont&&el.scrollWidth>el.clientWidth+1){
   font=Math.max(minFont,font-.5);el.style.fontSize=font+'px';
  }
 });
}
function renderWhiteboard(){
 calculate();planCurrent();
 $('wbSubtitle').textContent=`${state.name}${state.date?' · '+state.date:''} · ${state.players.length} Teilnehmer · ${effectiveSize()}er-Feld`;
 if(!state.players.length){$('wbLoser').innerHTML='<div class="wb-empty">Noch kein Turnier</div>';$('wbWinner').innerHTML='<div class="wb-empty">Noch kein Turnier</div>';}
 else{$('wbLoser').innerHTML=whiteboardRounds(graph.lose,true);$('wbWinner').innerHTML=whiteboardRounds(graph.win,false);}
 $('wbFinal').innerHTML=state.players.length?whiteboardFinal():'<div class="wb-center-label">FINALE</div>';
 for(const size of [8,16,32])$('wbView').classList.toggle('wb-'+size,effectiveSize()===size);
 $('wbProgress').textContent=turnPlan?.current?(state.fastMode?`⚡ Schnelles Spiel · ${turnPlan.activeIds.length}/4 Bahnen freigegeben · ${turnPlan.remaining} Spiele offen`:`${turnPlan.current.name} · JETZT: ${turnPlan.activeIds.length} Spiele freigegeben · ${turnPlan.current.finished}/${turnPlan.current.total} erledigt`):'🏆 Turnier abgeschlossen';$('wbModeLabel').innerHTML=state.fastMode?'<strong>WHITEBOARD</strong> · ⚡ 4-Bahnen-Modus · + / − und ✓ · Lokalspeicher':'<strong>WHITEBOARD</strong> · Rundenmodus · + / − und ✓ · nur lokal';
 // Der gesamte Turnierbaum bleibt ohne Scrollen auf einer Whiteboard-Seite.
 fitWhiteboardNames();
}
function enterWhiteboard(){
 closeModal();
 $('wbView').classList.remove('hidden');
 document.body.style.overflow='hidden';
 // Muss synchron zum Klick erfolgen: Browser verlangen Benutzeraktivierung.
 let parentHandled=false;
 try{if(window.unionParent!==window&&typeof window.unionParent.UP_DKO_ENTER_WHITEBOARD==='function'){
  parentHandled=window.unionParent.UP_DKO_ENTER_WHITEBOARD()===true;
 }}catch(e){}
 if(!parentHandled&&document.fullscreenElement!==document.documentElement&&document.documentElement.requestFullscreen){
  try{const p=document.documentElement.requestFullscreen({navigationUI:'hide'});if(p&&p.catch)p.catch(()=>{});}catch(e){}
 }
 renderWhiteboard();
 requestAnimationFrame(()=>fitWhiteboardNames());
}
function exitWhiteboard(fromHost=false){
 $('wbView').classList.add('hidden');
 document.body.style.overflow='';
 if(!fromHost){
  try{if(window.unionParent!==window&&typeof window.unionParent.UP_DKO_EXIT_WHITEBOARD==='function')window.unionParent.UP_DKO_EXIT_WHITEBOARD();}catch(e){}
  if(document.fullscreenElement===document.documentElement&&document.exitFullscreen){
   try{const p=document.exitFullscreen();if(p&&p.catch)p.catch(()=>{});}catch(e){}
  }
 }
 render();
}
window.UP_DKO_EXIT_FROM_HOST=()=>exitWhiteboard(true);
// Nach einem Browser-Druckdialog im Whiteboard bleiben und Namen erneut anpassen.
window.UP_DKO_FIT_AFTER_PRINT=()=>{if(!$('wbView').classList.contains('hidden'))requestAnimationFrame(fitWhiteboardNames);};

$('correction').onclick=()=>{correctionMode=!correctionMode;render();if(!$('wbView').classList.contains('hidden'))renderWhiteboard()};$('whiteboardMode').onclick=enterWhiteboard;$('wbExit').onclick=()=>exitWhiteboard();$('wbCorrection').onclick=()=>{$('correction').click()};$('wbRefresh').onclick=renderWhiteboard;

window.addEventListener('resize',()=>{if(!$('wbView').classList.contains('hidden'))fitWhiteboardNames()});
document.addEventListener('fullscreenchange',()=>{if(!$('wbView').classList.contains('hidden'))requestAnimationFrame(fitWhiteboardNames)});
$('fullscreen').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};$('back').onclick=()=>{try{if(window.unionParent!==window && typeof window.unionParent.showHome==='function'){window.unionParent.showHome();return}}catch(e){} if(history.length>1)history.back();else location.href='turnierauswertung.html'};

// V2.2: Lokalspeicher-Turnierarchiv. Daten werden nicht beim bloßen Rendern oder Laden gedruckt.
let cloudId=null,cloudRevision=0,cloudReady=false,cloudLoading=false,cloudTimer=null;
let cloudSaving=false,cloudQueued=false,cloudDirty=false,cloudSavePromise=Promise.resolve();
let cloudWatchStop=null,cloudList=[];
const cloudAPI=()=>{try{return window.unionParent!==window?window.unionParent.UP_DKO_API:null}catch(e){return null}};
function cloudStatus(message,kind=''){const el=$('cloudStatus');if(el){el.textContent=message;el.className=kind}}
function cloudEnsureId(){if(!cloudId){cloudId='dko_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);cloudRevision=0;safeStorage.setItem(STORE+'_id',cloudId)}return cloudId}
function cloudResetSelection(){if(cloudTimer)clearTimeout(cloudTimer);cloudId=null;cloudRevision=0;cloudDirty=false;cloudQueued=false;safeStorage.removeItem(STORE+'_id');$('cloudSelect').value=''}
function cloudSnapshot(){return {name:String(state.name||'Doppel KO'),date:String(state.date||''),archived:!!state.archived,state:JSON.parse(JSON.stringify(state))}}
function scheduleCloudSave(immediate=false){
 if(cloudLoading||!cloudReady||!state.players.length)return;
 cloudEnsureId();cloudDirty=true;
 cloudStatus('● Ungespeicherte Änderungen · Lokalspeicher …');
 if(cloudTimer)clearTimeout(cloudTimer);
 if(immediate)void cloudFlush();else cloudTimer=setTimeout(()=>void cloudFlush(),350);
}
async function cloudFlush(){
 if(cloudTimer){clearTimeout(cloudTimer);cloudTimer=null}
 if(!cloudReady||cloudLoading||!cloudDirty||!state.players.length)return;
 if(cloudSaving){cloudQueued=true;return cloudSavePromise}
 const api=cloudAPI();if(!api||!api.ready()){cloudStatus('Nur lokal · Lokalspeicher-Anmeldung erforderlich','error');return}
 cloudSaving=true;cloudDirty=false;cloudQueued=false;
 const snapshot=cloudSnapshot(),id=cloudEnsureId(),rev=cloudRevision;
 cloudStatus('☁ Speichern …');
 cloudSavePromise=(async()=>{
  try{
   const next=await api.save(id,snapshot,rev);
   cloudRevision=next;
   cloudStatus('✓ Lokalspeicher gespeichert · Version '+next,'ok');
   await cloudRefreshList(false);
  }catch(err){cloudDirty=true;cloudStatus('✗ Lokalspeicher: '+(err.message||err),'error');console.error('Doppel KO speichern',err)}
  finally{cloudSaving=false;if(cloudQueued&&!String($('cloudStatus').textContent).includes('KONFLIKT')){cloudQueued=false;void cloudFlush()}}
 })();return cloudSavePromise;
}
async function cloudRefreshList(selectCurrent=true){
 const api=cloudAPI();if(!api||!api.ready())return;
 const items=await api.list();cloudList=items;
 const sel=$('cloudSelect'),old=selectCurrent?(cloudId||sel.value):sel.value;
 sel.innerHTML='<option value="">– Gespeichertes Turnier auswählen –</option>';
 for(const t of items){const opt=document.createElement('option');opt.value=t.id;opt.textContent=(t.archived?'✓ Archiv · ':'')+(t.name||'Doppel KO')+' · '+(t.date||'ohne Datum')+' · '+(t.playerCount||'')+' Spieler';sel.appendChild(opt)}
 if(old&&items.some(x=>x.id===old))sel.value=old;
}
function cloudApply(data){
 if(!data?.state||!Array.isArray(data.state.players)||![8,16,32].includes(data.state.size)||!data.state.results)throw Error('Ungültige gespeicherte Turnierdaten');
 cloudLoading=true;
 try{
  if(soloPrintCurrent)finishSoloPrint(false);
  soloPrintQueue.length=0;soloQueueStatus();
  state={...data.state,turns:normalizeTurns(data.state.turns),sheetPrompts:Array.isArray(data.state.sheetPrompts)?data.state.sheetPrompts:[],autoSheets:data.state.autoSheets!==false};
  cloudId=data.id;cloudRevision=Number(data.revision||0);cloudDirty=false;
  safeStorage.setItem(STORE,JSON.stringify(state));safeStorage.setItem(STORE+'_id',cloudId);
  $('players').value=state.players.filter((_,i)=>!(state.withdrawn||[]).includes(i)).join('\n');
  $('fastMode').checked=!!state.fastMode;rosterChecked.clear();lastRosterCount=inputNames().length;
  correctionMode=false;activeTab='winner';render();renderRoster();
  if(!$('wbView').classList.contains('hidden'))renderWhiteboard();
  $('cloudSelect').value=cloudId;
  cloudStatus('✓ Turnier geladen · Lokalspeicher Version '+cloudRevision,'ok');
 }finally{cloudLoading=false}
}
async function cloudOpenSelected(){
 const id=$('cloudSelect').value;if(!id)return;
 if(cloudDirty&&!confirm('Ungespeicherte Änderungen verwerfen und anderes Turnier laden?'))return;
 const api=cloudAPI();if(!api||!api.ready()){cloudStatus('Lokalspeicher-Anmeldung erforderlich','error');return}
 try{cloudStatus('☁ Turnier wird geladen …');const data=await api.get(id);if(!data)throw Error('Turnier nicht gefunden');cloudApply(data)}catch(e){cloudStatus('✗ Laden fehlgeschlagen: '+e.message,'error')}
}
async function initCloud(){
 const api=cloudAPI();if(!api){cloudStatus('Nur lokale Datei · Lokalspeicher über Turnierauswertung verfügbar','error');return}
 // Das Modul kann vor Abschluss der Lokalspeicher-Anmeldung geladen werden.
 for(let i=0;i<24&&!api.ready();i++)await new Promise(r=>setTimeout(r,250));
 if(!api.ready()){cloudStatus('Nur lokal · Am Whiteboard für Lokalspeicher anmelden','error');$('cloudLogin').style.display='';return}
 $('cloudLogin').style.display='none';
 try{
  cloudLoading=true;await cloudRefreshList(false);
  const savedId=safeStorage.getItem(STORE+'_id');
  if(savedId&&cloudList.some(x=>x.id===savedId)){
   const d=await api.get(savedId);if(d)cloudApply(d);
  }
  cloudReady=true;
  if(!cloudId)cloudStatus('✓ Lokalspeicher bereit · Turnier auswählen oder neu anlegen','ok');
 }catch(e){cloudStatus('✗ Lokalspeicher: '+e.message,'error')}
 finally{cloudLoading=false}
}
$('cloudOpen').onclick=cloudOpenSelected;
$('cloudLogin').onclick=()=>{$('cloudLoginForm').classList.remove('hidden')};
$('cloudLoginCancel').onclick=()=>{$('cloudLoginForm').classList.add('hidden')};
$('cloudLoginSubmit').onclick=async()=>{const api=cloudAPI();if(!api?.login)return cloudStatus('Anmeldung nicht verfügbar','error');try{cloudStatus('Lokalspeicher-Anmeldung wird geprüft …');await api.login($('cloudEmail').value,$('cloudPassword').value);$('cloudPassword').value='';$('cloudLoginForm').classList.add('hidden');cloudStatus('✓ Angemeldet','ok');await initCloud()}catch(e){cloudStatus('✗ Anmeldung: '+e.message,'error')}};
$('cloudNew').onclick=()=>{if(cloudDirty&&!confirm('Es gibt noch nicht in Lokalspeicher gespeicherte Änderungen. Trotzdem ein neues Turnier beginnen?'))return;$('clear').click();cloudStatus('Neues Turnier · Teilnehmer auswählen')};
$('cloudSave').onclick=()=>{if(!state.players.length){alert('Bitte zuerst ein Turnier erstellen.');return}cloudDirty=true;scheduleCloudSave(true)};
$('cloudArchive').onclick=()=>{if(!cloudId||!state.players.length)return alert('Bitte zuerst ein Turnier auswählen.');state.archived=!state.archived;persist();scheduleCloudSave(true)};
$('cloudDelete').onclick=async()=>{
 const api=cloudAPI();if(!api?.ready()||!cloudId)return alert('Bitte zuerst ein gespeichertes Turnier öffnen.');
 if(!confirm('Dieses Turnier endgültig aus Lokalspeicher löschen?'))return;
 try{await api.remove(cloudId);cloudResetSelection();$('clear').click();await cloudRefreshList();cloudStatus('✓ Turnier aus Lokalspeicher gelöscht','ok')}catch(e){cloudStatus('✗ Löschen fehlgeschlagen: '+e.message,'error')}
};
try{let s=JSON.parse(safeStorage.getItem(STORE));if(s&&[8,16,32].includes(s.size)&&Array.isArray(s.players)&&s.results)state={...s,fastMode:!!s.fastMode,withdrawn:Array.isArray(s.withdrawn)?s.withdrawn:[],venue:s.venue||'Stocksporthalle Union Putzleinsdorf',organizer:s.organizer||'Union Putzleinsdorf',director:s.director||'Union Putzleinsdorf',turns:normalizeTurns(s.turns),autoSheets:s.autoSheets!==false,sheetPrompts:Array.isArray(s.sheetPrompts)?s.sheetPrompts:[]}}catch(e){}$('players').value=state.players.filter((_,i)=>!(state.withdrawn||[]).includes(i)).join('\n');lastRosterCount=inputNames().length;render();renderRoster();initCloud();

if(__health){__health.style.background=__storageAvailable?'#143a2b':'#725019';__health.textContent='✓ V2.6: 69 Spielervorschläge geladen · Gastspieler und Turniererstellung bereit'+(__storageAvailable?'':' · Hinweis: Lokale Browserspeicherung blockiert (Lokalspeicher separat prüfen)');}
} catch(__dkoError) { __report(__dkoError); }
})();
