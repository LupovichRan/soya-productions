/* Ran's adaptive CV: the reader says who they are (recruiter, tech leader, client, or a small cat) and the page tells
   the same true story their way. A focus switch highlights GenAI, data and Kafka, or cloud. English and Hebrew.
   Stored on this device only: the language (shared with the site) and the last reader type. Nothing is sent. */
(function () {
  'use strict';
  var CV = window.RAN_CV, LK = 'soycatory-lang', RK = 'soya-cv-reader';
  var I18N = {
    en: {
      other: 'עברית', who: 'Who is reading?', readers: { recruiter: 'Recruiter', leader: 'Tech leader', client: 'Client', kid: 'Small cat' },
      readerNote: { recruiter: 'The short version: roles, skills, availability.', leader: 'The depth: what I built, how and why.', client: 'What I can do for you.', kid: 'Soya explains it in plain words.' },
      focus: 'Highlight', focuses: { all: 'Everything', g: 'GenAI', d: 'Data & Kafka', c: 'Cloud' },
      soya: function (r) { return { recruiter: 'Hi, I\'m Soya, Ran\'s cat and manager. Here is the short version, I timed it.', leader: 'Hi, I\'m Soya. You want the details? He has many. Get comfy.', client: 'Hi, I\'m Soya. Ran fixes things that must not break. I supervise.', kid: 'Hi! I\'m Soya. Let me tell you what my human does all day.' }[r]; },
      summary: 'In short', skills: 'What he does', work: 'Experience', services: 'How I can help', kidFacts: 'Soya explains', side: 'Things he builds for fun', edu: 'Education', certs: 'Certificates', langs: 'Languages', more: 'Other tools',
      contact: 'Contact Ran', copy: 'Copy email', copied: 'Email copied.', linkedin: 'LinkedIn', github: 'GitHub', print: 'Save as PDF',
      full: 'Tap to see the full photo', close: 'Close', alt: 'Ran Lupovich', home: 'Soycatory home', grownups: 'For grown-ups',
      note: 'Clients and past employers in banking are described rather than named. Ask Ran for references.'
    },
    he: {
      other: 'English', who: 'מי קורא?', readers: { recruiter: 'מגייס/ת', leader: 'מוביל/ה טכנולוגי/ת', client: 'לקוח/ה', kid: 'חתול קטן' },
      readerNote: { recruiter: 'הגרסה הקצרה: תפקידים, כישורים, זמינות.', leader: 'העומק: מה בניתי, איך ולמה.', client: 'מה אני יכול לעשות בשבילכם.', kid: 'סויה מסביר במילים פשוטות.' },
      focus: 'להדגיש', focuses: { all: 'הכול', g: 'GenAI', d: 'דאטה וקפקא', c: 'ענן' },
      soya: function (r) { return { recruiter: 'היי, אני סויה, החתול והמנהל של רן. הנה הגרסה הקצרה, מדדתי זמן.', leader: 'היי, אני סויה. רוצים פרטים? יש לו הרבה. תתרווחו.', client: 'היי, אני סויה. רן מתקן דברים שאסור להם להישבר. אני מפקח.', kid: 'היי! אני סויה. בואו אספר לכם מה הבן אדם שלי עושה כל היום.' }[r]; },
      summary: 'בקצרה', skills: 'מה הוא עושה', work: 'ניסיון', services: 'איך אני יכול לעזור', kidFacts: 'סויה מסביר', side: 'דברים שהוא בונה בשביל הכיף', edu: 'השכלה', certs: 'הסמכות', langs: 'שפות', more: 'כלים נוספים',
      contact: 'יוצרים קשר עם רן', copy: 'מעתיקים את המייל', copied: 'המייל הועתק.', linkedin: 'לינקדאין', github: 'GitHub', print: 'שמירה כ־PDF',
      full: 'לוחצים כדי לראות את התמונה המלאה', close: 'סוגרים', alt: 'רן לופוביץ\'', home: 'הבית של Soycatory', grownups: 'למבוגרים',
      note: 'לקוחות ומעסיקים קודמים בבנקאות מתוארים ולא נקראים בשמם. אפשר לבקש מרן ממליצים.'
    }
  };
  var READERS = ['recruiter', 'leader', 'client', 'kid'], FOCUS = ['all', 'g', 'd', 'c'];
  var POSE = { recruiter: 'glasses', leader: 'wow', client: 'happy', kid: 'party' };
  var A = '../apps/2026-11-21-soya-news/assets/';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* fine */ } }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var lang = get(LK) === 'he' ? 'he' : get(LK) === 'en' ? 'en' : (/^(he|iw)/i.test(navigator.language || '') ? 'he' : 'en');
  var q = new URLSearchParams(location.search);
  var reader = READERS.indexOf(q.get('for')) >= 0 ? q.get('for') : (READERS.indexOf(get(RK)) >= 0 ? get(RK) : 'recruiter');
  var focus = 'all';
  function t(k) { return I18N[lang][k]; }
  function L(o) { return (o && (o[lang] || o.en)) || ''; }
  function dim(tag) { return focus !== 'all' && tag && tag !== focus ? ' dim' : (focus !== 'all' && tag === focus ? ' hit' : ''); }
  function list(items, fn) { return '<ol class="plain">' + items.map(fn).join('') + '</ol>'; }

  function sec(title, body, cls) { return '<section class="card' + (cls ? ' ' + cls : '') + '"><h2>' + esc(title) + '</h2>' + body + '</section>'; }
  function jobs(detail) {
    return '<ol class="jobs">' + CV.jobs.map(function (j) {
      var lines = detail ? '<ol class="lines">' + j.lines.map(function (l) { return '<li class="' + dim(l.tag).trim() + '">' + esc(L(l)) + '</li>'; }).join('') + '</ol>' : '';
      return '<li class="job"><p class="role">' + esc(L(j.role)) + '</p><p class="org">' + esc(L(j.org)) + ' · <span>' + esc(L(j.when)) + '</span></p>' + lines + '</li>';
    }).join('') + '</ol>';
  }
  function skills() { return '<ol class="skills">' + CV.skills.map(function (s) { return '<li class="' + dim(s.tag).trim() + '"><b>' + esc(L(s)) + '</b><span>' + esc(L(s.items)) + '</span></li>'; }).join('') + '</ol>'; }
  function contact() {
    var l = CV.links;
    return '<section class="card contact" id="contact"><h2>' + esc(t('contact')) + '</h2>' + (reader === 'kid' ? '<p class="label">' + esc(t('grownups')) + '</p>' : '') +
      '<a class="primary" href="mailto:' + l.email + '?subject=' + encodeURIComponent('Hello Ran') + '">' + esc(t('contact')) + '</a>' +
      '<ol class="links"><li><span>Email</span><a href="mailto:' + l.email + '" dir="ltr">' + l.email + '</a> <button type="button" class="ghost small-btn" id="copy">' + esc(t('copy')) + '</button></li>' +
      '<li><span>' + esc(t('linkedin')) + '</span><a href="' + l.linkedin + '" target="_blank" rel="noopener" dir="ltr">linkedin.com/in/ranlupovich</a></li>' +
      '<li><span>' + esc(t('github')) + '</span><a href="' + l.github + '" target="_blank" rel="noopener" dir="ltr">github.com/LupovichRan</a></li></ol>' +
      '<p class="note" id="copy-note" role="status" hidden></p><button type="button" class="ghost" id="print">' + esc(t('print')) + '</button></section>';
  }

  function render() {
    var d = document.documentElement; d.lang = lang; d.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.title = L(CV.name) + ' · CV';
    document.querySelector('.brand b').textContent = L(CV.name);
    var tg = document.getElementById('lang-toggle'); tg.textContent = t('other'); tg.setAttribute('lang', lang === 'he' ? 'en' : 'he');
    var html = '<header class="hero"><button type="button" class="photo" id="photo" aria-label="' + esc(t('full')) + '"><img src="' + A + 'ran.jpg" width="132" height="132" alt="' + esc(t('alt')) + '"></button>' +
      '<div><h1>' + esc(L(CV.name)) + '</h1><p class="title">' + esc(L(CV.title)) + '</p><p class="mute">' + esc(L(CV.where)) + '</p></div></header>' +
      '<div class="soya-says"><img class="cat" src="' + A + 'soya-' + POSE[reader] + '.svg" width="64" height="70" alt=""><p class="bubble">' + esc(t('soya')(reader)) + '</p></div>' +
      '<section class="card controls"><p class="label">' + esc(t('who')) + '</p><div class="seg" role="group" aria-label="' + esc(t('who')) + '">' +
      READERS.map(function (r) { return '<button type="button" data-reader="' + r + '" aria-pressed="' + (r === reader) + '"' + (r === reader ? ' class="on"' : '') + '>' + esc(t('readers')[r]) + '</button>'; }).join('') +
      '</div><p class="mute small">' + esc(t('readerNote')[reader]) + '</p>' +
      (reader === 'kid' ? '' : '<p class="label">' + esc(t('focus')) + '</p><div class="seg" role="group" aria-label="' + esc(t('focus')) + '">' +
      FOCUS.map(function (f) { return '<button type="button" data-focus="' + f + '" aria-pressed="' + (f === focus) + '"' + (f === focus ? ' class="on"' : '') + '>' + esc(t('focuses')[f]) + '</button>'; }).join('') + '</div>') + '</section>';
    html += sec(t('summary'), '<p class="lead">' + esc(L(CV.summary[reader])) + '</p>');
    if (reader === 'recruiter') html += sec(t('skills'), skills()) + sec(t('work'), jobs(true)) + sec(t('edu'), list(CV.education, function (e) { return '<li>' + esc(L(e)) + '</li>'; })) + sec(t('certs'), list(CV.certs, function (e) { return '<li>' + esc(L(e)) + '</li>'; })) + sec(t('langs'), '<p>' + esc(L(CV.languages)) + '</p>');
    else if (reader === 'leader') html += sec(t('work'), jobs(true)) + sec(t('skills'), skills() + '<p class="mute small">' + esc(L(CV.more)) + '</p>') + sec(t('side'), list(CV.side, function (s) { return '<li><a href="' + s.url + '" target="_blank" rel="noopener">' + esc(L(s)) + '</a></li>'; })) + sec(t('certs'), list(CV.certs, function (e) { return '<li>' + esc(L(e)) + '</li>'; }));
    else if (reader === 'client') html += sec(t('services'), list(CV.services, function (s) { return '<li class="' + dim(s.tag).trim() + '">' + esc(L(s)) + '</li>'; })) + sec(t('work'), jobs(false)) + sec(t('side'), list(CV.side, function (s) { return '<li><a href="' + s.url + '" target="_blank" rel="noopener">' + esc(L(s)) + '</a></li>'; }));
    else html += sec(t('kidFacts'), list(CV.kidFacts, function (f) { return '<li>' + esc(L(f)) + '</li>'; }), 'kid') + sec(t('work'), jobs(false));
    html += contact() + '<p class="mute small">' + esc(t('note')) + '</p><p><a class="home" href="../">' + esc(t('home')) + '</a></p>' +
      '<dialog class="photo-box" id="photo-dlg"><img src="' + A + 'ran-full.jpg" width="669" height="1024" alt="' + esc(t('alt')) + '"><div class="photo-actions"><a href="' + CV.links.linkedin + '" target="_blank" rel="noopener">' + esc(t('linkedin')) + '</a><button type="button" class="ghost" id="photo-close">' + esc(t('close')) + '</button></div></dialog>';
    document.getElementById('app').innerHTML = html; wire();
  }

  function wire() {
    document.querySelectorAll('[data-reader]').forEach(function (b) { b.addEventListener('click', function () { reader = b.getAttribute('data-reader'); put(RK, reader); focus = 'all'; render(); var x = document.querySelector('[data-reader="' + reader + '"]'); if (x) x.focus(); }); });
    document.querySelectorAll('[data-focus]').forEach(function (b) { b.addEventListener('click', function () { focus = b.getAttribute('data-focus'); var y = window.scrollY; render(); window.scrollTo(0, y); var x = document.querySelector('[data-focus="' + focus + '"]'); if (x) x.focus({ preventScroll: true }); }); });
    var dlg = document.getElementById('photo-dlg'), ph = document.getElementById('photo');
    ph.addEventListener('click', function () { if (dlg.showModal) dlg.showModal(); else window.open(A + 'ran-full.jpg', '_blank'); });
    document.getElementById('photo-close').addEventListener('click', function () { dlg.close(); ph.focus(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    document.getElementById('print').addEventListener('click', function () { window.print(); });
    document.getElementById('copy').addEventListener('click', function () {
      var n = document.getElementById('copy-note'); function say(s) { n.hidden = false; n.textContent = s; }
      if (navigator.clipboard) navigator.clipboard.writeText(CV.links.email).then(function () { say(t('copied')); }, function () { say(CV.links.email); }); else say(CV.links.email);
    });
  }
  document.getElementById('lang-toggle').addEventListener('click', function () { lang = lang === 'he' ? 'en' : 'he'; put(LK, lang); render(); });
  render();
})();
