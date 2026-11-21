/**
 * Soycatory waiting list and requests: receives the forms on each app's one-pager and appends a row to a Google Sheet.
 * One tab per app and kind: "<app> waitlist" and "<app> requests". It runs as you, writes only to that one Sheet,
 * and holds no key. Setup is in infra/waitlist/README.md.
 */
var APPS = ['soycatory', 'roundtable', 'read-it-simply', 'say-it-kindly', 'plain-steps', 'idea-room', 'cat-factory', 'soya-games', 'kafka-check', 'soya-news'];
var MAX_ROWS = 5000, MAX_METRIC_ROWS = 100000;
var METRIC_EVENTS = ['play', 'q25', 'q50', 'q75', 'q100', 'pause', 'seek', 'leave'];
var READ_EVENTS = ['view', 'seen', 'more', 'source', 'useful-yes', 'useful-no', 'end', 'leave'];
function slug_(v) { return /^[a-z0-9-]{3,60}$/.test(String(v || '')) ? String(v) : ''; }

function doGet() { return text_({ ok: true, name: 'Soycatory waiting list' }); }

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.website) return text_({ ok: true });                       // a robot filled the hidden field: say nothing
  var app = String(p.app || ''), kind = String(p.kind || ''), lang = p.lang === 'he' ? 'he' : p.lang === 'fr' ? 'fr' : 'en';
  if (kind === 'metric' || kind === 'comment') return video_(p, kind, lang);   // video watch counts and comments
  if (kind === 'read' || kind === 'suggest') return news_(p, kind, lang);      // newsletter reading counts and topic requests
  if ((kind === 'rate' || kind === 'bug') && app === 'soya-news') return soyaNews_(p, kind, lang);   // paws ratings and bug reports
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

/** Video watch counts (no cookies, no ids: only a random number made for one visit) and timestamped comments. */
function video_(p, kind, lang) {
  var video = slug_(p.video); if (!video) return text_({ ok: false });
  var pos = Math.max(0, Math.min(86400, Math.floor(Number(p.position) || 0)));
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID')), when = new Date().toISOString();
    if (kind === 'metric') {
      if (p.website || METRIC_EVENTS.indexOf(String(p.event)) < 0) return text_({ ok: true });
      var m = tab_(ss, 'video metrics', ['When (UTC)', 'Video', 'View', 'Event', 'Position (s)', 'Duration (s)', 'Language']);
      if (m.getLastRow() >= MAX_METRIC_ROWS) return text_({ ok: false });
      m.appendRow([when, video, String(p.view || '').replace(/[^a-z0-9]/gi, '').slice(0, 12), String(p.event), pos, Math.max(0, Math.min(86400, Math.floor(Number(p.duration) || 0))), lang]);
    } else {
      if (p.website) return text_({ ok: true });
      var body = String(p.text || '').trim().slice(0, 300), mail = String(p.email || '').trim().toLowerCase();
      if (body.length < 3 || (mail && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail) || mail.length > 254))) return text_({ ok: false });
      var c = tab_(ss, 'video comments', ['When (UTC)', 'Video', 'At (s)', 'Comment', 'Email (optional)', 'Language']);
      if (c.getLastRow() >= MAX_ROWS) return text_({ ok: false });
      c.appendRow([when, video, pos, safe_(body), safe_(mail), lang]);
    }
    return text_({ ok: true });
  } finally { lock.releaseLock(); }
}

/** Newsletter reading counts (which items get "Read more", which sources get opened, Yes/No, how far people read) and topic requests. */
function news_(p, kind, lang) {
  var issue = /^\d{4}-\d{2}-\d{2}$/.test(String(p.issue || '')) ? String(p.issue) : ''; if (!issue) return text_({ ok: false });
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID')), when = new Date().toISOString();
    if (kind === 'read') {
      if (p.website || READ_EVENTS.indexOf(String(p.event)) < 0) return text_({ ok: true });
      var item = p.item ? slug_(p.item) : '', pos = p.position === '' || p.position == null ? '' : Math.max(0, Math.min(100, Math.floor(Number(p.position) || 0)));
      var r = tab_(ss, 'newsletter reads', ['When (UTC)', 'Issue', 'View', 'Event', 'Item', 'Position', 'Language']);
      if (r.getLastRow() >= MAX_METRIC_ROWS) return text_({ ok: false });
      r.appendRow([when, issue, String(p.view || '').replace(/[^a-z0-9]/gi, '').slice(0, 12), String(p.event), item, pos, lang]);
    } else {
      if (p.website) return text_({ ok: true });
      var body = String(p.text || '').trim().slice(0, 300), mail = String(p.email || '').trim().toLowerCase();
      if (body.length < 3 || (mail && (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail) || mail.length > 254))) return text_({ ok: false });
      var q = tab_(ss, 'newsletter requests', ['When (UTC)', 'Issue', 'What should Soya look into?', 'Email (optional)', 'Language']);
      if (q.getLastRow() >= MAX_ROWS) return text_({ ok: false });
      q.appendRow([when, issue, safe_(body), safe_(mail), lang]);
    }
    return text_({ ok: true });
  } finally { lock.releaseLock(); }
}

/** Soya News: "how clear was this?" paws (1 to 5) per story, and bug reports. Only what the reader chose to send. */
function soyaNews_(p, kind, lang) {
  if (p.website) return text_({ ok: true });
  var level = ['cub', 'explorer', 'teen', 'grown', 'owner'].indexOf(String(p.level)) >= 0 ? String(p.level) : '';
  var issue = /^\d{4}-\d{2}-\d{2}$/.test(String(p.issue || '')) ? String(p.issue) : '';
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID')), when = new Date().toISOString();
    if (kind === 'rate') {
      var paws = Math.floor(Number(p.paws)); if (!(paws >= 1 && paws <= 5) || !slug_(p.story)) return text_({ ok: false });
      var r = tab_(ss, 'soya-news ratings', ['When (UTC)', 'Issue', 'Story', 'Paws (1-5)', 'Age level', 'First rating?', 'Language']);
      if (r.getLastRow() >= MAX_METRIC_ROWS) return text_({ ok: false });
      r.appendRow([when, issue, slug_(p.story), paws, level, p.first === 'yes' ? 'yes' : 'no', lang]);
    } else {
      var body = String(p.text || '').trim().slice(0, 500); if (body.length < 3) return text_({ ok: false });
      var b = tab_(ss, 'soya-news bugs', ['When (UTC)', 'What happened', 'App version', 'Issue', 'Age level', 'Language']);
      if (b.getLastRow() >= MAX_ROWS) return text_({ ok: false });
      b.appendRow([when, safe_(body), String(p.version || '').replace(/[^0-9a-z.\-]/gi, '').slice(0, 20), issue, level, lang]);
    }
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
