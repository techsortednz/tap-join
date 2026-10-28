/**
 * Tap agreements → Google Drive backup (Google Apps Script web app, runs as Shaun).
 *
 * The tap-join Worker POSTs each signed agreement PDF here. It is saved into the
 * "Signed Agreements" folder (Tap by techsorted), in a subfolder per year, e.g.
 *   Signed Agreements / 2026 / 2026-10-28 Joe Bloggs Cafe – TAP-20261028-HTS4.pdf
 * Saving the same agreement again (Save to Drive on the hub) replaces nothing: if a file with
 * that name is already there, it returns the existing one.
 *
 * Script properties (Project Settings → Script properties):
 *   BACKUP_SECRET  random letters/numbers (32+), also set in the Worker as DRIVE_BACKUP_SECRET
 *   FOLDER_ID      the Signed Agreements folder's ID (the part after /folders/ in its Drive link)
 */

function doPost(e) {
  const reply = (obj) => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const props = PropertiesService.getScriptProperties();
    const secret = props.getProperty('BACKUP_SECRET');
    if (!secret || body.secret !== secret) return reply({ ok: false, error: 'Not allowed' });

    const folderId = (props.getProperty('FOLDER_ID') || '').trim();
    if (!folderId) return reply({ ok: false, error: 'FOLDER_ID not set' });
    const root = DriveApp.getFolderById(folderId);

    const year = /^\d{4}$/.test(body.year) ? body.year : String(new Date().getFullYear());
    const yearFolder = root.getFoldersByName(year).hasNext() ? root.getFoldersByName(year).next() : root.createFolder(year);

    const name = String(body.filename || 'agreement.pdf').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 150);
    const existing = yearFolder.getFilesByName(name);
    if (existing.hasNext()) {
      const f = existing.next();
      return reply({ ok: true, id: f.getId(), url: f.getUrl(), existed: true });
    }

    const bytes = Utilities.base64Decode(String(body.pdf || ''));
    if (bytes.length < 1000) return reply({ ok: false, error: 'Empty PDF' });
    const file = yearFolder.createFile(Utilities.newBlob(bytes, 'application/pdf', name));
    if (body.description) file.setDescription(String(body.description).slice(0, 500));
    return reply({ ok: true, id: file.getId(), url: file.getUrl() });
  } catch (err) {
    return reply({ ok: false, error: String(err && err.message || err).slice(0, 200) });
  }
}

/** Run once by hand from the editor: checks the folder and permissions, and logs where files will go. */
function test() {
  const props = PropertiesService.getScriptProperties();
  const folder = DriveApp.getFolderById(props.getProperty('FOLDER_ID'));
  if (!props.getProperty('BACKUP_SECRET')) throw new Error('Set BACKUP_SECRET first');
  Logger.log('OK. Signed agreements will be saved in: ' + folder.getName() + ' → ' + folder.getUrl());
}
