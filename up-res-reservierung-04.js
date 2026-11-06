
/* The local and GitHub-hosted reservation modules share the parent origin. */
(function(){
 if(window.self===window.top)return;
 try{
  const host=window.unionParent.document;
  if(host.getElementById('upReservationMobileLayout'))return;
  const style=host.createElement('style');style.id='upReservationMobileLayout';
  style.textContent=`@media(max-width:768px){
   #externalPage.up-reservation-embed.active{height:100vh!important;height:100dvh!important;min-height:0!important;overflow:hidden!important;padding:0!important;display:flex!important;flex-direction:column!important}
   #externalPage.up-reservation-embed .external-toolbar,#externalPage.up-reservation-embed .external-note,#externalPage.up-reservation-embed .menu-return,#externalPage.up-reservation-embed .external-bottom-space{display:none!important}
   #externalPage.up-reservation-embed #upExternalHomeBar{position:static!important;display:flex!important;flex:0 0 auto!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;padding:6px!important;margin:0!important;border-radius:0!important;gap:8px!important}
   #externalPage.up-reservation-embed #upExternalHomeBar strong{display:none!important}
   #externalPage.up-reservation-embed #externalFrame{display:block!important;flex:1 1 0!important;height:0!important;min-height:0!important;width:100%!important}
   #upReservationAdminFrame{height:75vh!important;height:75dvh!important;min-height:480px!important}
  }`;
  host.head.appendChild(style);
 }catch(e){/* Cross-origin hosts retain their own layout. */}
})();
