/* Union Putzleinsdorf V2.5.2 – nicht-blockierende Anzeige fehlender Programmdateien. */
(function(){
  window.addEventListener('error',function(ev){
    const node=ev.target;
    if(!node||!['SCRIPT','LINK'].includes(node.tagName))return;
    const url=node.src||node.href||'';
    if(!url)return;
    console.error('UP: Programmdatei konnte nicht geladen werden:',url);
    if(!/\/js\/|\/css\/|systemeinstellungen|designvorlagen-daten/.test(url))return;
    const show=function(){
      if(document.getElementById('upLadefehler'))return;
      const el=document.createElement('div');
      el.id='upLadefehler';
      el.setAttribute('role','alert');
      el.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:#7c1111;color:white;padding:12px 20px;font:16px Arial,sans-serif';
      el.textContent='Eine Programmdatei konnte nicht geladen werden. Bitte alle Dateien des Pakets hochladen und die Seite mit Strg+Umschalt+R neu laden.';
      document.body.appendChild(el);
    };
    if(document.body)show();else document.addEventListener('DOMContentLoaded',show,{once:true});
  },true);
})();
