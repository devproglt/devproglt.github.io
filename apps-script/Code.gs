/**
 * Google Apps Script — Backend de synchronisation pour l'application Prise de Présences.
 * Déploiement : Web App (Exécuté en tant que Moi, Accès Tout le monde).
 */

function doGet(e) {
  return jsonResponse({
    ok: true,
    status: 'online',
    message: 'Backend Google Apps Script opérationnel pour l\'application Prise de Présences.',
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    const postData = e.postData.contents;
    const request = JSON.parse(postData);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = getOrCreateSheet(ss, 'config');
    const config = getConfigMap(configSheet);

    // 1. Vérification du jeton de sécurité
    if (!request.token || request.token !== config.token) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }

    const action = request.action;

    if (action === 'push') {
      return handlePush(ss, request, configSheet);
    } else if (action === 'pull') {
      return handlePull(ss, request);
    } else {
      return jsonResponse({ ok: false, error: 'bad_request' });
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: 'server_error', details: String(err) });
  }
}

function handlePush(ss, request, configSheet) {
  const lock = LockService.getScriptLock();
  // Attente de 10 secondes max pour obtenir le verrou
  if (!lock.tryLock(10000)) {
    return jsonResponse({ ok: false, error: 'lock_timeout' });
  }

  try {
    const studentsSheet = getOrCreateSheet(ss, 'students');
    const attendancesSheet = getOrCreateSheet(ss, 'attendances');
    const logSheet = getOrCreateSheet(ss, 'log');

    let nextSeq = parseInt(getConfigValue(configSheet, 'nextSeq') || '1', 10);

    const accepted = [];
    const rejected = [];

    // --- Processus PUSH pour les élèves ---
    if (request.students && request.students.length > 0) {
      const maps = buildStudentMaps(studentsSheet);
      for (let i = 0; i < request.students.length; i++) {
        const incoming = request.students[i];
        let rowIdx = maps.idMap[incoming.id];
        
        // Si non trouvé par ID, chercher par Nom + Prénom + Classe pour éviter tout doublon
        const nameKey = normalizeStr(incoming.lastName) + '_' + normalizeStr(incoming.firstName) + '_' + normalizeStr(incoming.year);
        if (!rowIdx && maps.nameMap[nameKey]) {
          rowIdx = maps.nameMap[nameKey].rowIdx;
        }

        if (rowIdx) {
          const currentUpdatedAt = parseInt(studentsSheet.getRange(rowIdx, 9).getValue() || 0, 10);
          if (incoming.updatedAt >= currentUpdatedAt) {
            updateStudentRow(studentsSheet, rowIdx, incoming, nextSeq++);
            accepted.push(incoming.id);
          } else {
            rejected.push(incoming.id);
          }
        } else {
          appendStudentRow(studentsSheet, incoming, nextSeq++);
          const lastRow = studentsSheet.getLastRow();
          maps.idMap[incoming.id] = lastRow;
          maps.nameMap[nameKey] = { rowIdx: lastRow, id: incoming.id };
          accepted.push(incoming.id);
        }
      }
    }

    // --- Processus PUSH pour les pointages ---
    if (request.attendances && request.attendances.length > 0) {
      const attendanceIndex = buildAttendanceKeyMap(attendancesSheet);
      for (let i = 0; i < request.attendances.length; i++) {
        const incoming = request.attendances[i];
        const cleanDate = normalizeDateVal(incoming.date);
        const cleanType = incoming.type === 'course' ? 'course' : 'presence';
        const key = incoming.studentId + '_' + cleanDate + '_' + cleanType;
        
        let rowIdx = attendanceIndex[incoming.id] || attendanceIndex[key];

        incoming.date = cleanDate;
        incoming.type = cleanType;
        incoming.id = key;

        if (rowIdx) {
          const currentUpdatedAt = parseInt(attendancesSheet.getRange(rowIdx, 8).getValue() || 0, 10);
          if (incoming.updatedAt >= currentUpdatedAt) {
            updateAttendanceRow(attendancesSheet, rowIdx, incoming, nextSeq++);
            accepted.push(incoming.id);
          } else {
            rejected.push(incoming.id);
          }
        } else {
          appendAttendanceRow(attendancesSheet, incoming, nextSeq++);
          const lastRow = attendancesSheet.getLastRow();
          attendanceIndex[incoming.id] = lastRow;
          attendanceIndex[key] = lastRow;
          accepted.push(incoming.id);
        }
      }
    }

    // Mise à jour de la séquence courante
    setConfigValue(configSheet, 'nextSeq', nextSeq);

    // Enregistrement dans le journal
    const totalLines = (request.students ? request.students.length : 0) + (request.attendances ? request.attendances.length : 0);
    logSheet.appendRow([new Date().toISOString(), request.deviceId || 'inconnu', 'push', totalLines]);

    return jsonResponse({ ok: true, accepted: accepted, rejected: rejected });
  } finally {
    lock.releaseLock();
  }
}

function handlePull(ss, request) {
  const studentsSheet = getOrCreateSheet(ss, 'students');
  const attendancesSheet = getOrCreateSheet(ss, 'attendances');
  const configSheet = getOrCreateSheet(ss, 'config');

  const since = parseInt(request.since || 0, 10);
  const currentNextSeq = parseInt(getConfigValue(configSheet, 'nextSeq') || '1', 10);

  const pulledStudentsMap = {};
  const studentValues = studentsSheet.getDataRange().getValues();
  // Ligne 1 = en-têtes
  for (let i = 1; i < studentValues.length; i++) {
    const row = studentValues[i];
    if (!row[0] && !row[1] && !row[2]) continue; // Ligne vide

    let seq = parseInt(row[10], 10);
    if (isNaN(seq)) {
      seq = i; // Fallback pour les lignes ajoutées manuellement
    }

    if (since === 0 || seq > since) {
      let activeVal = row[5];
      let active = true;
      if (activeVal === false || String(activeVal).trim().toLowerCase() === 'false' || String(activeVal).trim().toLowerCase() === 'faux' || String(activeVal).trim() === '0') {
        active = false;
      }

      let id = String(row[0] || '').trim();
      if (!id) {
        id = Utilities.getUuid();
      }

      let updatedAt = parseInt(row[8], 10);
      if (isNaN(updatedAt) || updatedAt <= 0) {
        updatedAt = Date.now();
      }

      const lastName = String(row[1] || '').trim();
      const firstName = String(row[2] || '').trim();
      const year = String(row[4] || '').trim();

      const nameKey = normalizeStr(lastName) + '_' + normalizeStr(firstName) + '_' + normalizeStr(year);
      const existingStudent = pulledStudentsMap[nameKey];

      if (!existingStudent || updatedAt >= existingStudent.updatedAt) {
        pulledStudentsMap[nameKey] = {
          id: id,
          lastName: lastName,
          firstName: firstName,
          gender: String(row[3] || 'F').toUpperCase().startsWith('M') ? 'M' : 'F',
          year: year,
          active: active,
          notes: String(row[6] || ''),
          createdAt: String(row[7] || new Date().toISOString()),
          updatedAt: updatedAt,
          isInternal: Boolean(row[9]),
        };
      }
    }
  }

  const pulledAttendancesMap = {};
  const attendanceValues = attendancesSheet.getDataRange().getValues();
  for (let i = 1; i < attendanceValues.length; i++) {
    const row = attendanceValues[i];
    if (!row[0] && !row[1]) continue;

    let seq = parseInt(row[8], 10);
    if (isNaN(seq)) {
      seq = i;
    }

    if (since === 0 || seq > since) {
      let updatedAt = parseInt(row[7], 10);
      if (isNaN(updatedAt) || updatedAt <= 0) {
        updatedAt = Date.now();
      }

      const studentId = String(row[1] || '').trim();
      const cleanDate = normalizeDateVal(row[2]);
      const cleanType = String(row[3] || 'presence').trim().toLowerCase() === 'course' ? 'course' : 'presence';
      const attKey = studentId + '_' + cleanDate + '_' + cleanType;

      let presentVal = row[4];
      let present = true;
      if (presentVal === false || String(presentVal).trim().toLowerCase() === 'false' || String(presentVal).trim().toLowerCase() === 'faux' || String(presentVal).trim() === '0') {
        present = false;
      }

      const existingAtt = pulledAttendancesMap[attKey];
      if (!existingAtt || updatedAt >= existingAtt.updatedAt) {
        pulledAttendancesMap[attKey] = {
          id: attKey,
          studentId: studentId,
          date: cleanDate,
          type: cleanType,
          present: present,
          markedAt: parseInt(row[5] || 0, 10),
          deviceId: String(row[6] || ''),
          updatedAt: updatedAt,
        };
      }
    }
  }

  const pulledStudents = Object.keys(pulledStudentsMap).map(function(k) { return pulledStudentsMap[k]; });
  const pulledAttendances = Object.keys(pulledAttendancesMap).map(function(k) { return pulledAttendancesMap[k]; });

  return jsonResponse({
    ok: true,
    students: pulledStudents,
    attendances: pulledAttendances,
    cursor: currentNextSeq,
  });
}

function normalizeDateVal(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Europe/Brussels', 'yyyy-MM-dd');
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  if (str.indexOf('T') !== -1) {
    return str.substring(0, 10);
  }
  if (str.indexOf('/') !== -1) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const d = parts[0].length === 1 ? '0' + parts[0] : parts[0];
      const m = parts[1].length === 1 ? '0' + parts[1] : parts[1];
      const y = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      return y + '-' + m + '-' + d;
    }
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return Utilities.formatDate(d, 'Europe/Brussels', 'yyyy-MM-dd');
    }
  } catch (e) {}
  return str;
}

function buildAttendanceKeyMap(sheet) {
  const map = {};
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const id = String(values[i][0] || '').trim();
    const studentId = String(values[i][1] || '').trim();
    const date = normalizeDateVal(values[i][2]);
    const type = String(values[i][3] || 'presence').trim().toLowerCase() === 'course' ? 'course' : 'presence';
    if (id) {
      map[id] = i + 1;
    }
    if (studentId && date) {
      map[studentId + '_' + date + '_' + type] = i + 1;
    }
  }
  return map;
}

function normalizeStr(s) {
  if (!s) return '';
  return String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function buildStudentMaps(sheet) {
  const idMap = {};
  const nameMap = {};
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const id = String(values[i][0] || '').trim();
    const lastName = normalizeStr(values[i][1]);
    const firstName = normalizeStr(values[i][2]);
    const year = normalizeStr(values[i][4]);
    if (id) {
      idMap[id] = i + 1; // 1-based row index
    }
    if (lastName && firstName) {
      const nameKey = lastName + '_' + firstName + '_' + year;
      if (!nameMap[nameKey]) {
        nameMap[nameKey] = { rowIdx: i + 1, id: id };
      }
    }
  }
  return { idMap: idMap, nameMap: nameMap };
}

// Utilitaires de feuilles et index
function buildIdMap(sheet) {
  const map = {};
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const id = String(values[i][0]);
    if (id) {
      map[id] = i + 1; // 1-based row index
    }
  }
  return map;
}

function appendStudentRow(sheet, s, seq) {
  sheet.appendRow([s.id, s.lastName, s.firstName, s.gender, s.year, s.active, s.notes || '', s.createdAt, s.updatedAt, s.isInternal ? true : false, seq]);
}

function updateStudentRow(sheet, rowIdx, s, seq) {
  sheet.getRange(rowIdx, 1, 1, 11).setValues([[s.id, s.lastName, s.firstName, s.gender, s.year, s.active, s.notes || '', s.createdAt, s.updatedAt, s.isInternal ? true : false, seq]]);
}

function appendAttendanceRow(sheet, a, seq) {
  sheet.appendRow([a.id, a.studentId, a.date, a.type, a.present, a.markedAt, a.deviceId, a.updatedAt, seq]);
}

function updateAttendanceRow(sheet, rowIdx, a, seq) {
  sheet.getRange(rowIdx, 1, 1, 9).setValues([[a.id, a.studentId, a.date, a.type, a.present, a.markedAt, a.deviceId, a.updatedAt, seq]]);
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === 'students') {
      sheet.appendRow(['id', 'lastName', 'firstName', 'gender', 'year', 'active', 'notes', 'createdAt', 'updatedAt', 'isInternal', 'seq']);
    } else if (name === 'attendances') {
      sheet.appendRow(['id', 'studentId', 'date', 'type', 'present', 'markedAt', 'deviceId', 'updatedAt', 'seq']);
    } else if (name === 'config') {
      sheet.appendRow(['key', 'value']);
      sheet.appendRow(['token', 'VOTRE_JETON_SECRET_D_AU_MOINS_32_CARACTERES']);
      sheet.appendRow(['nextSeq', 1]);
    } else if (name === 'log') {
      sheet.appendRow(['horodatage', 'deviceId', 'action', 'nombre_lignes']);
    }
  }
  return sheet;
}

function getConfigMap(configSheet) {
  const map = {};
  const values = configSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    map[values[i][0]] = values[i][1];
  }
  return map;
}

function getConfigValue(configSheet, key) {
  const map = getConfigMap(configSheet);
  return map[key];
}

function setConfigValue(configSheet, key, value) {
  const values = configSheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === key) {
      configSheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  configSheet.appendRow([key, value]);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Menu interactif dans Google Sheets pour nettoyer et dédoublonner les feuilles directement.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Présences')
    .addItem('🧹 Nettoyer et dédoublonner les feuilles', 'nettoyerDoublonsSheet')
    .addToUi();
}

/**
 * Fonction de nettoyage complet du Google Sheet :
 * - Garantit strictement 1 ligne max par élève/date/type dans la feuille attendances
 * - Harmonise les dates au format YYYY-MM-DD
 * - Déduplique les élèves de même Nom + Prénom + Classe
 */
function nettoyerDoublonsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const attendancesSheet = ss.getSheetByName('attendances');
  const studentsSheet = ss.getSheetByName('students');

  let attRemoved = 0;
  let studRemoved = 0;

  if (attendancesSheet) {
    const values = attendancesSheet.getDataRange().getValues();
    if (values.length > 1) {
      const seen = {};
      const rowsToKeep = [values[0]]; // En-têtes

      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row[1] && !row[2]) continue;

        const studentId = String(row[1] || '').trim();
        const cleanDate = normalizeDateVal(row[2]);
        const cleanType = String(row[3] || 'presence').trim().toLowerCase() === 'course' ? 'course' : 'presence';
        const key = studentId + '_' + cleanDate + '_' + cleanType;

        row[0] = key;
        row[2] = cleanDate;
        row[3] = cleanType;

        if (seen[key]) {
          const prevIdx = seen[key];
          const prevUpdatedAt = parseInt(rowsToKeep[prevIdx][7] || 0, 10);
          const curUpdatedAt = parseInt(row[7] || 0, 10);
          if (curUpdatedAt >= prevUpdatedAt) {
            rowsToKeep[prevIdx] = row;
          }
          attRemoved++;
        } else {
          seen[key] = rowsToKeep.length;
          rowsToKeep.push(row);
        }
      }

      attendancesSheet.clearContents();
      if (rowsToKeep.length > 0) {
        attendancesSheet.getRange(1, 1, rowsToKeep.length, rowsToKeep[0].length).setValues(rowsToKeep);
      }
    }
  }

  if (studentsSheet) {
    const values = studentsSheet.getDataRange().getValues();
    if (values.length > 1) {
      const seen = {};
      const rowsToKeep = [values[0]]; // En-têtes

      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row[1] && !row[2]) continue;

        const lastName = normalizeStr(row[1]);
        const firstName = normalizeStr(row[2]);
        const year = normalizeStr(row[4]);
        const key = lastName + '_' + firstName + '_' + year;

        if (seen[key]) {
          const prevIdx = seen[key];
          const prevUpdatedAt = parseInt(rowsToKeep[prevIdx][8] || 0, 10);
          const curUpdatedAt = parseInt(row[8] || 0, 10);
          if (curUpdatedAt >= prevUpdatedAt) {
            rowsToKeep[prevIdx] = row;
          }
          studRemoved++;
        } else {
          seen[key] = rowsToKeep.length;
          rowsToKeep.push(row);
        }
      }

      studentsSheet.clearContents();
      if (rowsToKeep.length > 0) {
        studentsSheet.getRange(1, 1, rowsToKeep.length, rowsToKeep[0].length).setValues(rowsToKeep);
      }
    }
  }

  try {
    SpreadsheetApp.getUi().alert('Nettoyage terminé !\n- Pointages : ' + attRemoved + ' doublon(s) purgé(s)\n- Élèves : ' + studRemoved + ' doublon(s) purgé(s)');
  } catch (e) {
    Logger.log('Nettoyage terminé : ' + attRemoved + ' pointages, ' + studRemoved + ' élèves.');
  }
}

