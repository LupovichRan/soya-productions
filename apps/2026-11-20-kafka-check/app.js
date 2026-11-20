/* Kafka Check, a Soycatory app.
   Paste a Kafka producer, consumer, broker, topic or Connect config. It points at settings that can lose, repeat or reorder
   messages, each with why, what to do, and a link to Kafka's own docs. It runs in this browser: what you paste is never sent
   anywhere and is not kept. Values that look like secrets are hidden before anything is checked. Only the language choice is stored. */
(function () {
  'use strict';

  var LANG_KEY = 'soya-kafkacheck-lang';
  var K = window.SoyaKafka;

  var I18N = {
    en: {
      title: 'Kafka Check', otherLang: 'עברית', credit: 'Made by Soycatory',
      lead: 'Paste a Kafka config. See where messages could be lost, repeated or reordered, with a link to the Kafka docs for each point.',
      notProof: 'A config cannot prove a system is reliable. It cannot show your code, how long your processing takes, or what happens when a broker fails. This reads only what you paste, and the checks are written from the Kafka docs.',
      privacy: 'It runs in your browser. What you paste is not sent anywhere and is not saved. Values that look like secrets are hidden first.',
      pasteLabel: 'Your Kafka config (key=value lines)', pasteHelp: 'Producer, consumer, broker, topic or Connect settings. You can paste several kinds together.',
      examples: 'Or try an example', ex: { risky: 'Risky producer', consumer: 'Consumer that skips', broker: 'Broker that loses data', connect: 'Connector that drops' },
      versionLabel: 'Which Kafka are the clients on?', versions: { 4: 'Kafka 4.x', 3: 'Kafka 3.x', 2: '2.x or older' },
      versionHelp: 'It changes the defaults: before 3.0 the producer did not wait for all replicas and idempotence was off.',
      check: 'Check my config', empty: 'Paste a config first.', clear: 'Clear',
      read: function (n, roles) { return 'Read ' + n + (n === 1 ? ' setting' : ' settings') + (roles.length ? ' (' + roles.join(', ') + ')' : '') + '.'; },
      roleNames: { producer: 'producer', consumer: 'consumer', broker: 'broker', topic: 'topic', connect: 'connect' },
      hidden: function (n) { return n + (n === 1 ? ' value that looks like a secret was hidden.' : ' values that look like secrets were hidden.'); },
      none: 'Nothing found', noneBody: 'No risks, warnings or tips in what you pasted. That is not proof: see the questions below.',
      noRole: 'I could not tell what kind of config this is. Paste settings such as acks, group.id, min.insync.replicas or errors.tolerance.',
      counts: function (r, w, t) { return r + ' risk · ' + w + ' worth a look · ' + t + ' tip'; },
      level: { risk: 'Risk', warn: 'Worth a look', tip: 'Tip' }, why: 'Why', fix: 'What to do', docs: 'Kafka docs',
      listTitle: 'What a config cannot show', listLead: 'Ask yourself these. They are not checked; no config can answer them.'
    },
    he: {
      title: 'בדיקת קפקא', otherLang: 'English', credit: 'נוצר על ידי Soycatory',
      lead: 'מדביקים הגדרות של קפקא. רואים איפה הודעות עלולות ללכת לאיבוד, לחזור או להתערבב בסדר, עם קישור לתיעוד של קפקא לכל נקודה.',
      notProof: 'הגדרות לא יכולות להוכיח שמערכת אמינה. הן לא מראות את הקוד שלכם, כמה זמן העיבוד לוקח, או מה קורה כשברוקר נופל. זה קורא רק את מה שהדבקתם, והבדיקות נכתבו לפי התיעוד של קפקא.',
      privacy: 'זה רץ בדפדפן שלכם. מה שמדביקים לא נשלח לשום מקום ולא נשמר. ערכים שנראים כמו סודות מוסתרים קודם.',
      pasteLabel: 'ההגדרות שלכם בקפקא (שורות key=value)', pasteHelp: 'הגדרות של יצרן, צרכן, ברוקר, נושא או Connect. אפשר להדביק כמה סוגים יחד.',
      examples: 'או לנסות דוגמה', ex: { risky: 'יצרן מסוכן', consumer: 'צרכן שמדלג', broker: 'ברוקר שמאבד נתונים', connect: 'מחבר שזורק' },
      versionLabel: 'באיזו גרסה של קפקא הלקוחות?', versions: { 4: 'קפקא 4.x', 3: 'קפקא 3.x', 2: '2.x ומטה' },
      versionHelp: 'זה משנה את ברירות המחדל: לפני 3.0 היצרן לא חיכה לכל ההעתקים ואידמפוטנטיות הייתה כבויה.',
      check: 'בודקים את ההגדרות', empty: 'קודם צריך להדביק הגדרות.', clear: 'ניקוי',
      read: function (n, roles) { return 'נקראו ' + n + (n === 1 ? ' הגדרה' : ' הגדרות') + (roles.length ? ' (' + roles.join(', ') + ')' : '') + '.'; },
      roleNames: { producer: 'יצרן', consumer: 'צרכן', broker: 'ברוקר', topic: 'נושא', connect: 'Connect' },
      hidden: function (n) { return n === 1 ? 'ערך אחד שנראה כמו סוד הוסתר.' : n + ' ערכים שנראים כמו סודות הוסתרו.'; },
      none: 'לא נמצא כלום', noneBody: 'אין סיכונים, אזהרות או טיפים במה שהדבקתם. זו לא הוכחה: ראו את השאלות למטה.',
      noRole: 'לא הצלחתי להבין איזה סוג הגדרות זה. מדביקים הגדרות כמו acks, group.id, min.insync.replicas או errors.tolerance.',
      counts: function (r, w, t) { return r + ' סיכון · ' + w + ' שווה מבט · ' + t + ' טיפ'; },
      level: { risk: 'סיכון', warn: 'שווה מבט', tip: 'טיפ' }, why: 'למה', fix: 'מה עושים', docs: 'תיעוד קפקא',
      listTitle: 'מה הגדרות לא יכולות להראות', listLead: 'כדאי לשאול את עצמכם. אלה לא נבדקות; שום הגדרה לא יכולה לענות עליהן.'
    }
  };

  var state = { lang: loadLang(), text: '', version: 4, result: null, msg: '' };
  var app = document.getElementById('app');

  function loadLang() {
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* blocked */ }
    if (saved === 'en' || saved === 'he') return saved;
    return /^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en';
  }
  function t(key) { return I18N[state.lang][key]; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function finding(f) {
    var l = f[state.lang];
    var keys = f.keys.map(function (k) { return '<code><bdi dir="ltr">' + esc(k.key + '=' + k.value) + '</bdi></code>'; }).join(' ');
    return '<article class="card finding ' + f.level + '"><p><span class="pill ' + f.level + '">' + esc(t('level')[f.level]) + '</span></p><h3>' + esc(l.title) + '</h3>' + (keys ? '<p class="keys">' + keys + '</p>' : '') +
      '<p><b>' + esc(t('why')) + '.</b> ' + esc(l.why) + '</p><p><b>' + esc(t('fix')) + '.</b> ' + esc(l.fix) + '</p>' +
      '<p class="small"><a href="' + esc(f.docs) + '" target="_blank" rel="noopener noreferrer">' + esc(t('docs')) + '</a></p></article>';
  }

  function results() {
    var r = state.result; if (!r) return state.msg ? '<p class="banner soft" role="alert">' + esc(state.msg) + '</p>' : '';
    var roles = r.roles.map(function (x) { return t('roleNames')[x]; });
    var head = '<h2>' + esc(r.findings.length ? t('counts')(r.counts.risk, r.counts.warn, r.counts.tip) : t('none')) + '</h2><p class="small mute">' + esc(t('read')(r.settings, roles)) + (r.hidden ? ' ' + esc(t('hidden')(r.hidden)) : '') + '</p>';
    if (!r.roles.length) return head + '<p class="banner soft" role="status">' + esc(t('noRole')) + '</p>';
    if (!r.findings.length) return head + '<p class="banner ok" role="status">' + esc(t('noneBody')) + '</p>';
    return head + r.findings.map(finding).join('');
  }

  function render() {
    document.documentElement.lang = state.lang; document.documentElement.dir = state.lang === 'he' ? 'rtl' : 'ltr';
    document.title = t('title') + ' — Soycatory';
    var toggle = document.getElementById('lang-toggle'); toggle.textContent = t('otherLang'); toggle.setAttribute('lang', state.lang === 'he' ? 'en' : 'he');
    document.getElementById('brand-title').textContent = t('title'); document.getElementById('credit').textContent = t('credit');
    var focus = document.activeElement && document.activeElement.id === 'f-config';
    var ex = Object.keys(K.EXAMPLES).map(function (k) { return '<button type="button" class="ghost" data-example="' + k + '">' + esc(t('ex')[k]) + '</button>'; }).join('');
    var vs = [4, 3, 2].map(function (v) { return '<button type="button" class="ghost" data-version="' + v + '" aria-pressed="' + (state.version === v) + '">' + esc(t('versions')[v]) + '</button>'; }).join('');
    var list = K.CHECKLIST.map(function (q, i) { return '<li><label class="check"><input type="checkbox" id="q' + i + '"><span>' + esc(q[state.lang]) + '</span></label></li>'; }).join('');
    app.innerHTML = '<h1>' + esc(t('title')) + '</h1><p class="lead">' + esc(t('lead')) + '</p>' +
      '<p class="banner" role="note">' + esc(t('notProof')) + '</p>' +
      '<form id="form" class="card" novalidate><label for="f-config">' + esc(t('pasteLabel')) + '</label>' +
      '<textarea id="f-config" dir="ltr" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="acks=1&#10;retries=0">' + esc(state.text) + '</textarea>' +
      '<p class="small mute">' + esc(t('pasteHelp')) + '</p><p class="small mute">' + esc(t('privacy')) + '</p>' +
      '<h2>' + esc(t('examples')) + '</h2><div class="examples">' + ex + '</div>' +
      '<h2>' + esc(t('versionLabel')) + '</h2><div class="versions">' + vs + '</div><p class="small mute">' + esc(t('versionHelp')) + '</p>' +
      '<div class="actions"><button type="submit" class="wide">' + esc(t('check')) + '</button><button type="button" class="ghost wide" data-act="clear">' + esc(t('clear')) + '</button></div></form>' +
      '<section id="results" aria-live="polite">' + results() + '</section>' +
      '<section class="card"><h2>' + esc(t('listTitle')) + '</h2><p class="small mute">' + esc(t('listLead')) + '</p><ul class="checks">' + list + '</ul></section>';
    if (focus) { var el = document.getElementById('f-config'); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }

  function check() {
    state.msg = '';
    if (!state.text.trim()) { state.result = null; state.msg = t('empty'); return render(); }
    state.result = K.analyze(state.text, { version: state.version }); render();
    var r = document.getElementById('results'); if (r && r.scrollIntoView) r.scrollIntoView({ block: 'start' });
  }

  app.addEventListener('input', function (e) { if (e.target.id === 'f-config') state.text = e.target.value; });
  app.addEventListener('submit', function (e) { e.preventDefault(); check(); });
  app.addEventListener('click', function (e) {
    var el = e.target.closest('button'); if (!el) return;
    if (el.dataset.example) { state.text = K.EXAMPLES[el.dataset.example]; return check(); }
    if (el.dataset.version) { state.version = Number(el.dataset.version); if (state.result) return check(); return render(); }
    if (el.dataset.act === 'clear') { state.text = ''; state.result = null; state.msg = ''; render(); }
  });
  document.getElementById('lang-toggle').addEventListener('click', function () {
    state.lang = state.lang === 'he' ? 'en' : 'he';
    try { localStorage.setItem(LANG_KEY, state.lang); } catch (e) { /* blocked */ }
    render();
  });
  document.getElementById('brand').addEventListener('click', function () { window.scrollTo(0, 0); });

  render();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(function () { /* optional */ });
})();
