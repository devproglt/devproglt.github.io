# Procédure de Déploiement du backend Google Apps Script

Ce fichier contient les instructions pas-à-pas pour déployer le point d'entrée de synchronisation Google Apps Script relié à votre classeur Google Sheets.

## 1. Création du Google Sheet
1. Rendez-vous sur [Google Sheets](https://sheets.google.com) et créez un nouveau classeur.
2. Nommez le classeur `Prise de Présences - Base de données`.

## 2. Déploiement du script Google Apps Script
1. Dans le classeur Google Sheet, ouvrez le menu **Extensions > Apps Script**.
2. Remplacez le contenu du fichier `Code.gs` par le code contenu dans `apps-script/Code.gs`.
3. Cliquez sur l'icône de disquette **Enregistrer** (Ctrl+S).
4. Cliquez sur le bouton bleu **Déployer > Nouveau déploiement**.
5. Cliquez sur le pignon de sélection des types et choisissez **Application Web**.
6. Renseignez les paramètres suivants :
   - **Description** : `Point d'entrée v1.0`
   - **Exécuter en tant que** : `Moi (votre_adresse@gmail.com)`
   - **Qui a accès** : `Tout le monde` (Anyone)
7. Cliquez sur **Déployer**, validez les autorisations d'accès si demandé.
8. Copiez l'**URL de l'application Web** générée (elle se termine généralement par `/exec`).

## 3. Configuration du jeton de sécurité
1. Revenez sur le classeur Google Sheet. Les onglets `students`, `attendances`, `config` et `log` ont été créés automatiquement lors du premier appel ou peuvent être créés à la main.
2. Dans l'onglet `config`, modifiez la valeur de la clé `token` pour saisir votre propre phrase secrète d'au moins 32 caractères (ex: `a8f9d0c2e3b4f5a6b7c8d9e0f1a2b3c4`).

## 4. Saisie dans les Paramètres de l'Application PWA
1. Sur votre smartphone Android ou navigateur, ouvrez l'application PWA dans l'onglet **Paramètres**.
2. Collez l'**URL de l'application Web** et votre **Jeton de sécurité (Token)**.
3. Appuyez sur **Enregistrer**, puis sur **Synchroniser maintenant**.
