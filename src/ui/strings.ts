/**
 * Libellés et messages de l'interface utilisateur centralisés en français.
 */
export const STRINGS = {
  appName: 'Présences',
  appSubtitle: 'Application PWA hors ligne',
  
  // Navigation
  nav: {
    pointage: 'Présences',
    jour: 'Aujourd\'hui',
    eleves: 'Élèves',
    historique: 'Historique',
    parametres: 'Paramètres',
  },

  // Types de présence
  types: {
    presence: 'Entraînement',
    course: 'Course',
  },

  // En-tête & Filtres
  header: {
    dateWarning: 'Attention : pointage sur une date passée !',
    resetFilters: 'Réinitialiser',
    searchPlaceholder: 'Rechercher par prénom ou nom...',
    allYears: 'Toutes',
    allLetters: 'Toutes',
    activeOnly: 'Actifs uniquement',
    includeInactive: 'Inclure inactifs',
  },

  // Actions
  actions: {
    add: 'Ajouter',
    addStudent: 'Ajouter un élève',
    edit: 'Modifier',
    delete: 'Désactiver',
    save: 'Enregistrer',
    cancel: 'Annuler',
    close: 'Fermer',
    confirm: 'Confirmer',
    syncNow: 'Synchroniser maintenant',
    exportExcel: 'Exporter (.xlsx)',
    importExcel: 'Importer (.xlsx, .csv)',
    downloadTemplate: 'Gabarit d\'import',
    backupJson: 'Sauvegarder (.json)',
    restoreJson: 'Restaurer (.json)',
    copySummary: 'Copier le résumé',
    copiedSuccess: 'Résumé copié dans le presse-papier !',
    updateApp: 'Mettre à jour l\'application',
    downloadLog: 'Journal des événements',
  },

  // Fiche élève
  student: {
    lastName: 'Nom',
    firstName: 'Prénom',
    gender: 'Sexe',
    female: 'Fille (F)',
    male: 'Garçon (M)',
    year: 'Année scolaire / Classe',
    activeStatus: 'Statut',
    active: 'Actif',
    inactive: 'Inactif',
    notes: 'Remarques / Notes',
    presencesCount: 'Entraînements',
    coursesCount: 'Courses',
    totalCount: 'Total participations',
    lastSeen: 'Dernière venue',
    never: 'Aucune',
    duplicateWarning: 'Attention : un élève similaire existe déjà (même nom, prénom et année).',
  },

  // Synthèse du jour / Historique
  stats: {
    total: 'Total',
    girls: 'Filles',
    boys: 'Garçons',
    breakdownByYear: 'Répartition par année',
    noAttendanceToday: 'Aucun pointage pour cette journée.',
    longPressHint: 'Appui long pour annuler un pointage.',
    tabByStudent: 'Par élève',
    tabByDate: 'Par date',
    periodAll: 'Tout',
    periodMonth: 'Ce mois',
    periodSchoolYear: 'Cette année scolaire',
  },

  // Synchronisation & Hors ligne
  sync: {
    synced: 'Synchronisé',
    pending: 'Modif. en att. ({count})',
    offline: 'Hors ligne',
    lastSync: 'Dernière synchronisation :',
    syncUrl: 'URL Google Apps Script',
    syncToken: 'Jeton de sécurité (Token)',
    deviceName: 'Nom de l\'appareil',
    syncSuccess: 'Synchronisation réussie !',
    syncError: 'Échec de la synchronisation.',
    configureFirst: 'Veuillez configurer l\'URL et le jeton dans les Paramètres.',
  },

  // Import
  import: {
    title: 'Import d\'élèves depuis Excel / CSV',
    step1: '1. Sélection du fichier',
    step2: '2. Correspondance des colonnes',
    step3: '3. Aperçu et gestion des doublons',
    step4: '4. Confirmation et rapport',
    dropZone: 'Glissez un fichier .xlsx, .xls ou .csv ici, ou cliquez pour parcourir',
    strategyIgnore: 'Ignorer les doublons',
    strategyUpdate: 'Mettre à jour l\'année et le sexe',
    createdCount: 'Élèves créés :',
    updatedCount: 'Élèves mis à jour :',
    skippedCount: 'Lignes ignorées :',
    errorCount: 'Lignes en erreur :',
  },

  // Textiles & Dotations
  textiles: {
    title: 'Textiles & Équipements',
    tabEleves: 'Liste élèves',
    tabTextiles: 'Dotations Textiles',
    noTextilesConfigured: 'Aucun type de textile configuré.',
    createTextile: 'Créer un textile',
    manageTextiles: 'Gérer les textiles',
    batchDistribution: 'Distribution groupée',
    batchDistributeAction: 'Attribuer aux élèves sélectionnés',
    received: 'Reçu',
    notReceived: 'Non reçu',
    receivedOn: 'Reçu le',
    textileName: 'Nom du textile (ex: T-shirt, Veste, Short)',
    confirmDeleteTextile: 'Supprimer ce textile supprimera également toutes les attributions associées. Confirmer ?',
    distributeSuccess: 'Distribution enregistrée avec succès !',
  },

  // Notifications PWA
  pwa: {
    updateAvailable: 'Une nouvelle version de l\'application est disponible.',
    offlineReady: 'L\'application est prête à fonctionner hors ligne.',
  },
};
