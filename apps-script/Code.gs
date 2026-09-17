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
      const studentIndex = buildIdMap(studentsSheet);
      for (let i = 0; i < request.students.length; i++) {
        const incoming = request.students[i];
        const rowIdx = studentIndex[incoming.id];
        
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
          accepted.push(incoming.id);
        }
      }
    }

    // --- Processus PUSH pour les pointages ---
    if (request.attendances && request.attendances.length > 0) {
      const attendanceIndex = buildIdMap(attendancesSheet);
      for (let i = 0; i < request.attendances.length; i++) {
        const incoming = request.attendances[i];
        const rowIdx = attendanceIndex[incoming.id];

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

  const pulledStudents = [];
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

      pulledStudents.push({
        id: id,
        lastName: String(row[1] || ''),
        firstName: String(row[2] || ''),
        gender: String(row[3] || 'F').toUpperCase().startsWith('M') ? 'M' : 'F',
        year: String(row[4] || ''),
        active: active,
        notes: String(row[6] || ''),
        createdAt: String(row[7] || new Date().toISOString()),
        updatedAt: updatedAt,
        isInternal: Boolean(row[9]),
      });
    }
  }

  const pulledAttendances = [];
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

      pulledAttendances.push({
        id: String(row[0]),
        studentId: String(row[1]),
        date: String(row[2]),
        type: String(row[3] || 'presence'),
        present: Boolean(row[4]),
        markedAt: parseInt(row[5] || 0, 10),
        deviceId: String(row[6] || ''),
        updatedAt: updatedAt,
      });
    }
  }

  return jsonResponse({
    ok: true,
    students: pulledStudents,
    attendances: pulledAttendances,
    cursor: currentNextSeq,
  });
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
