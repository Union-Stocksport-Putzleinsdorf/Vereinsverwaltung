
        import { initializeApp } from "./js/union-local-sdk.mjs";
        import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from "./js/union-local-sdk.mjs";

        const firebaseConfig = {projectId:"union-local-only"};

        try {
            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);
            window.db = db;
            window.collection = collection;
            window.getDocs = getDocs;
            window.setDoc = setDoc;
            window.doc = doc;
            window.deleteDoc = deleteDoc;
            window.firebaseReady = true;
        } catch(e) {
            console.warn("Lokalspeicher konnte nicht initialisiert werden:", e);
            window.firebaseReady = false;
        }
    