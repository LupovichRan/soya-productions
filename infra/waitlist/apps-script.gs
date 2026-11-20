/**
 * Soycatory waiting list and requests: receives the forms on each app's one-pager and appends a row to a Google Sheet.
 * One tab per app and kind: "<app> waitlist" and "<app> requests". It runs as you, writes only to that one Sheet,
 * and holds no key. Setup is in infra/waitlist/README.md.
 */
var APPS = ['soycatory', 'roundtable', 'read-it-simply', 'say-it-kindly', 'plain-steps', 'idea-room', 'cat-factory', 'soya-games'];
var MAX_ROWS = 5000;

function doGet() { return text_({ ok: true, name: 'Soycatory waiting list' }); }

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.website) return text_({ ok: true });                       // a robot filled the hidden field: say nothing
  var app = String(p.app || ''), kind = String(p.kind || ''), lang = p.lang === 'he' ? 'he' : 'en';
  if (APPS.indexOf(app) < 0) return text_({ ok: false });
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
    var when = new Date().toISOString();
    if (kind === 'waitlist') {
      var email = String(p.email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254 || p.consent !== 'yes') return text_({ ok: false });
      var sh = tab_(ss, app + ' waitlist', ['When (UTC)', 'Email', 'Language', 'Consent given']);
      if (sh.getLastRow() >= MAX_ROWS) return text_({ ok: false });
      var emails = sh.getLastRow() > 1 ? sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues() : [];
      for (var i = 0; i < emails.length; i++) if (String(emails[i][0]).toLowerCase() === email) return text_({ ok: true });   // already there; say the same thing
      sh.appendRow([when, safe_(email), lang, 'yes']);
    } else if (kind === 'request') {
      var body = String(p.text || '').trim().slice(0, 300), mail = String(p.email || '').trim().toLowerCase();
      if (body.length < 3 || (mail && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail) || mail.length > 254))) return text_({ ok: false });
      var rq = tab_(ss, app + ' requests', ['When (UTC)', 'What would you add?', 'Email (optional)', 'Language']);
      if (rq.getLastRow() >= MAX_ROWS) return text_({ ok: false });
      rq.appendRow([when, safe_(body), safe_(mail), lang]);
    } else return text_({ ok: false });
    return text_({ ok: true });
  } finally { lock.releaseLock(); }
}

function tab_(ss, name, header) {
  var sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(header); sh.setFrozenRows(1); sh.getRange(1, 1, 1, header.length).setFontWeight('bold'); }
  return sh;
}
/** A cell that starts with = + - or @ could run as a formula; a leading apostrophe makes it plain text. */
function safe_(v) { v = String(v); return /^[=+\-@]/.test(v) ? "'" + v : v; }
function text_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
