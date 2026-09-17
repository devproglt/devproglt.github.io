# Application PWA de Prise de Présences Hors Ligne

Application Web Progressive (PWA) installable sur Android, développée en TypeScript natif (sans framework d'interface lourd), avec stockage local IndexedDB (Dexie.js) et synchronisation automatique vers Google Sheets via Google Apps Script (GAS).

---

## 🌟 Fonctionnalités Principales

- **Pointage Instantané (< 100 ms)** : Recherche rapide par prénom/nom, filtre par année (puces), filtre par initiale du prénom (A-Z).
- **Deux types de pointage** : « Présence » et « Course », saisis séparément avec thèmes de couleurs d'accent distincts.
- **Fonctionnement 100% Hors Ligne** : Mise en cache complète par Service Worker (Workbox).
- **Synchronisation Google Sheets** : Protocole push/pull sécurisé par jeton avec résolution automatique des conflits par dernière modification gagnante (`updatedAt` LWW).
- **Import / Export Excel (.xlsx)** : Import d'élèves avec correspondance automatique des colonnes et gestion des doublons via SheetJS (chargé à la demande).
- **Statistiques & Historique** : Synthèse quotidienne par genre (Filles/Garçons) et par année, fiche élève individuelle et historique général triable.
- **Interface Ergonomique Mobile** : Conçue pour une utilisation à une main (cibles tactiles $\ge 48\text{ px}$, actions principales en bas d'écran, thèmes sombre et clair automatiques).

---

## 🚀 Démarrage Rapide (Développement Local)

### Prérequis
- Node.js v18+ et NPM v9+

### Installation des Dépendances
```bash
npm install
```

### Lancement du Serveur de Développement
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:5173`.

### Exécution des Tests Unitaires (Vitest)
```bash
npm test
```

### Build de Production
```bash
npm run build
```
Le bundle optimisé est généré dans le dossier `dist/`.

---

## 📱 Guide Utilisateur (Android PWA)

1. **Installation sur Smartphone** :
   - Ouvrez l'URL hébergée dans **Chrome sur Android**.
   - Appuyez sur le menu (les 3 points en haut à droite) puis sélectionnez **« Installer l'application »** ou **« Ajouter à l'écran d'accueil »**.
   - L'application apparaît sous forme d'icône native et s'ouvre en plein écran hors ligne.

2. **Premier Pointage** :
   - Rendez-vous dans l'onglet **Paramètres** et appuyez sur **« Générer un jeu de démonstration »** pour tester immédiatement avec 200 élèves.
   - Sur l'écran **Pointage**, tapez le prénom d'un élève ou touchez une initiale dans la barre **A-Z**.
   - Un appui sur une carte élève bascule instantanément son statut présent/absent avec un retour haptique (vibration).

3. **Synchronisation vers Google Sheets** :
   - Suivez la procédure figurant dans [`apps-script/README.md`](file:///c:/Users/GLT_1/.gemini/antigravity/scratch/Presence/apps-script/README.md).
   - Saisissez l'URL Google Apps Script et le jeton dans **Paramètres**, puis appuyez sur **Enregistrer** et **Synchroniser maintenant**.
