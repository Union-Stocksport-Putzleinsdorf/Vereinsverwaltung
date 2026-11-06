
const firebaseConfig = {projectId:"union-local-only"};
let firebaseReady=false, firestoreDb=null, firebaseAuth=null, firebaseAuthUser=null;
let loginPurpose='admin';
let appPermissions={};

// V2.5.2: Öffentlicher Whiteboard-Anzeigemodus ohne Lokalspeicher-Anmeldung.
// Nur Lesen. Schreib-/Adminfunktionen bleiben weiterhin authentifiziert.
const UP_PUBLIC_WHITEBOARD=!(new URLSearchParams(location.search).has('login')||new URLSearchParams(location.search).has('admin'));
function isPublicWhiteboardMode(){return UP_PUBLIC_WHITEBOARD===true&&!firebaseAuthUser;}
const APP_PERMISSIONS={vs:'Versammlungen und Arbeitseinsätze bearbeiten',tp:'Turnierplaner bearbeiten',tv:'Turnierverwaltung bearbeiten',jm:'Ziel Jahresmeisterschaft – Mobil eingeben',tw:'Turnierwirtschaftlichkeit bearbeiten',t:'Turniereinladungen bearbeiten',o:'Eigene Turniere bearbeiten',n:'Vereinsnachrichten bearbeiten',p:'Fotos Verein bearbeiten',sp:'Sponsoren bearbeiten',mv:'Mitgliederverwaltung',m:'Mannschaften bearbeiten',lk:'Links bearbeiten',sh:'Startseite bearbeiten',shView:'Startseite ansehen',tpView:'Turnierplaner ansehen',tView:'Turniereinladungen ansehen',oView:'Eigene Turniere ansehen',nView:'Vereinsnachrichten ansehen',pView:'Fotos Verein ansehen',spView:'Sponsoren ansehen',mView:'Mannschaften ansehen',lkView:'Links ansehen',mvView:'Mitglieder und Geburtstage ansehen'};
const PRESENTATION_PERMISSIONS=['sh','tp','t','o','n','p','sp','m','lk','mv'];
window.appPermissions=appPermissions;
try{
  firebase.initializeApp(firebaseConfig);
  firestoreDb=firebase.firestore(); window.firestoreDb=firestoreDb;
  firebaseReady=true;
  firebaseAuth=firebase.auth(); window.firebaseAuth=firebaseAuth;
  // V2.5.2: Dauerhafte Anmeldung initialisieren und beim Start abwarten.
  window.__upPersistenceReady=firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(()=>true)
    .catch(e=>{console.warn('Lokalspeicher Persistenz:',e);return false;});
  window.__upAuthInitialResolved=false;
  window.__upAuthInitialUser=null;
}catch(e){console.error("Lokalspeicher Initialisierung:",e);}
