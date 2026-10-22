# Reservierungssystem Union Stocksport Putzleinsdorf

Web-App (`public/index.html`) mit Firebase Firestore (Collection `appData`), gehostet auf Firebase Hosting.

## Deploy
Ohne lokale Installation: Jeder Push auf `main` (oder "Run workflow" im Actions-Tab) deployt Hosting und Firestore-Regeln automatisch.
Voraussetzung: GitHub-Secret `FIREBASE_SERVICE_ACCOUNT` (Inhalt der Dienstkonto-JSON von Firebase).
