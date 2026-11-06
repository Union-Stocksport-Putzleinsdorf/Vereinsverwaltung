(function(){
 const root=document.documentElement;
 root.classList.remove('up-reservation-admin-entry');
 if(window.self===window.top)return;
 root.classList.add('up-in-iframe');
 try{
  const host=window.unionParent;
  // The external viewer already supplies its own back button, including Whiteboard.
  const external=host.document.getElementById('externalFrame');
  if(external&&external.contentWindow===window)return;
  const admin=host.document.getElementById('upReservationAdminFrame');
  if(!admin||admin.contentWindow!==window)return;
  if(typeof host.isWhiteboardUser==='function'&&host.isWhiteboardUser())return;
  if(typeof host.isPublicWhiteboardMode==='function'&&host.isPublicWhiteboardMode())return;
  root.classList.add('up-reservation-admin-entry');
 }catch(e){/* Standalone/foreign hosts do not need an additional back button. */}
})();