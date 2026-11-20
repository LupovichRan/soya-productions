/* Cat Factory, a Soycatory app (a parody).
   Give the cats a job. They run a shift and hand you a silly report: what each cat did, the commit log, a version and
   whether it ships. The same job gives the same report, so a report can be shared. Nothing is stored except the
   language, and nothing leaves the device. */
(function () {
  'use strict';

  var LANG_KEY = 'soya-catfactory-lang';
  var C = window.SoyaCats;

  var CAT = {
    ears: '<path d="M20 38 L24 6 L48 26Z"/><path d="M80 38 L76 6 L52 26Z"/>',
    tints: { pm: '#1F2937', dev: '#374151', qa: '#111827', ops: '#2B2F3A', design: '#1A2230', intern: '#0F172A' }
  };

  var I18N = {
    en: {
      title: 'Cat Factory', otherLang: 'עברית', credit: 'Made by Soycatory',
      parody: 'Parody. Not real software advice. No real cats were consulted, and several were asleep.',
      lead: 'Tell the cats what to build. They will run a shift and hand you a report.',
      jobLabel: 'The job', jobHelp: 'For example: a to-do app.', examples: 'Or try one',
      exampleJobs: ['A to-do app', 'An app that tells the time', 'A recipe box'],
      start: 'Start the shift', another: 'Another shift', copy: 'Copy the report', copied: 'Copied', cantCopy: 'Could not copy. Select the text and copy it yourself.',
      newJob: 'A new job', errJob: 'Give the cats a job first.',
      shift: function (n) { return 'Shift ' + n; }, ships: 'Ships?', crew: 'The crew', blocked: 'Blocked by', commits: 'Commit log', numbers: 'Shift numbers',
      stats: { chaos: 'Cat chaos', naps: 'Naps', cups: 'Cups on the floor', jjj: 'Lines of "jjjj"' }
    },
    he: {
      title: 'מפעל החתולים', otherLang: 'English', credit: 'נוצר על ידי Soycatory',
      parody: 'פרודיה. לא עצה אמיתית לתוכנה. לא התייעצנו עם חתולים אמיתיים, וכמה מהם ישנו.',
      lead: 'אומרים לחתולים מה לבנות. הם יעבדו משמרת ויגישו לכם דוח.',
      jobLabel: 'המשימה', jobHelp: 'למשל: אפליקציית רשימת משימות.', examples: 'או לנסות אחת',
      exampleJobs: ['אפליקציית רשימת משימות', 'אפליקציה שאומרת מה השעה', 'קופסת מתכונים'],
      start: 'מתחילים משמרת', another: 'משמרת נוספת', copy: 'מעתיקים את הדוח', copied: 'הועתק', cantCopy: 'לא הצלחנו להעתיק. סמנו את הטקסט והעתיקו בעצמכם.',
      newJob: 'משימה חדשה', errJob: 'קודם צריך לתת לחתולים משימה.',
      shift: function (n) { return 'משמרת ' + n; }, ships: 'משחררים?', crew: 'הצוות', blocked: 'תקוע בגלל', commits: 'יומן שינויים', numbers: 'מספרי המשמרת',
      stats: { chaos: 'כאוס חתולי', naps: 'תנומות', cups: 'כוסות על הרצפה', jjj: 'שורות של "ססס"' }
    }
  };

  var state = { lang: loadLang(), screen: 'start', job: '', shift: 1, error: false, note: '' };
  var app = document.getElementById('app');

  function loadLang() {
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* blocked */ }
    if (saved === 'en' || saved === 'he') return saved;
    return /^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en';
  }
  function t(key) { return I18N[state.lang][key]; }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function pageDir() { return document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'; }
  /* Never a bare dir="auto": an empty box on a Hebrew page must still start on the right. */
  function boxDir(value) { return C.dirFor(value) || pageDir(); }
  function cat(tint, size) {
    return '<svg class="mark" width="' + size + '" height="' + size + '" viewBox="2 -14 96 108" aria-hidden="true"><g fill="' + tint + '">' + CAT.ears + '<ellipse cx="50" cy="56" rx="40" ry="34"/></g>' +
      '<circle cx="35" cy="54" r="5" fill="#7CE08A"/><circle cx="65" cy="54" r="5" fill="#7CE08A"/><circle cx="35" cy="54" r="1.8" fill="#0F172A"/><circle cx="65" cy="54" r="1.8" fill="#0F172A"/></svg>';
  }
  function parody() { return '<p class="banner" role="note">' + esc(t('parody')) + '</p>'; }

  function viewStart() {
    var ex = t('exampleJobs').map(function (x, i) { return '<button type="button" class="ghost" data-example="' + i + '"><bdi dir="auto">' + esc(x) + '</bdi></button>'; }).join('');
    return '<div class="hero-cat">' + cat('#1F2937', 84) + '</div><h1>' + esc(t('title')) + '</h1><p class="lead">' + esc(t('lead')) + '</p>' + parody() +
      '<form id="job-form" class="card" novalidate>' +
      '<label for="f-job">' + esc(t('jobLabel')) + '</label>' +
      '<input type="text" id="f-job" maxlength="' + C.LIMIT + '" dir="' + boxDir(state.job) + '" value="' + esc(state.job) + '" autocomplete="off">' +
      '<div class="help"><span>' + esc(t('jobHelp')) + '</span></div>' +
      (state.error ? '<p class="banner" role="alert">' + esc(t('errJob')) + '</p>' : '') +
      '<div class="actions"><button type="submit" class="wide">' + esc(t('start')) + '</button></div></form>' +
      '<section class="card"><h2>' + esc(t('examples')) + '</h2><div class="examples">' + ex + '</div></section>';
  }

  function viewReport() {
    var r = C.generate(state.job, state.shift, state.lang);
    if (!r) { state.screen = 'start'; return viewStart(); }
    var crew = r.roles.map(function (x) {
      return '<li class="cat-card">' + cat(CAT.tints[x.id], 44) + '<div><p class="who"><b>' + esc(x.name) + '</b> <span class="chip">' + esc(x.title) + '</span></p>' +
        '<p dir="' + boxDir(x.did) + '"><bdi>' + esc(x.did) + '</bdi></p><p class="small mute">' + esc(t('blocked')) + ': ' + esc(x.blocker) + '.</p></div></li>';
    }).join('');
    var commits = r.commits.map(function (c) { return '<li><code dir="' + boxDir(c) + '">' + esc(c) + '</code></li>'; }).join('');
    var s = r.stats;
    var tiles = [['chaos', s.chaos + '%'], ['naps', s.naps], ['cups', s.cups], ['jjj', s.jjj]].map(function (x) { return '<div class="tile"><b>' + esc(x[1]) + '</b><span>' + esc(t('stats')[x[0]]) + '</span></div>'; }).join('');
    return '<p class="small mute">' + esc(t('shift')(r.shift)) + '</p><h1 dir="' + boxDir(r.job) + '"><bdi>' + esc(r.job) + '</bdi></h1>' +
      '<p class="version">' + esc(r.version) + '</p>' + parody() +
      '<section class="card verdict"><p class="small mute">' + esc(t('ships')) + '</p><p class="big">' + esc(r.verdict) + '</p></section>' +
      '<section class="card"><h2>' + esc(t('crew')) + '</h2><ul class="crew">' + crew + '</ul></section>' +
      '<section class="card"><h2>' + esc(t('commits')) + '</h2><ul class="log">' + commits + '</ul></section>' +
      '<section class="card"><h2>' + esc(t('numbers')) + '</h2><div class="tiles">' + tiles + '</div></section>' +
      (state.note ? '<p class="banner soft" role="status">' + esc(state.note) + '</p>' : '') +
      '<div class="actions"><button type="button" class="wide" data-act="another">' + esc(t('another')) + '</button>' +
      '<button type="button" class="ghost wide" data-act="copy">' + esc(t('copy')) + '</button>' +
      '<button type="button" class="ghost wide" data-act="new">' + esc(t('newJob')) + '</button></div>';
  }

  function render() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'he' ? 'rtl' : 'ltr';
    document.title = t('title') + ' — Soycatory';
    var toggle = document.getElementById('lang-toggle');
    toggle.textContent = t('otherLang'); toggle.setAttribute('lang', state.lang === 'he' ? 'en' : 'he');
    document.getElementById('brand-title').textContent = t('title');
    document.getElementById('credit').textContent = t('credit');
    app.innerHTML = state.screen === 'report' ? viewReport() : viewStart();
  }
  function go(screen) { state.screen = screen; state.error = false; state.note = ''; render(); window.scrollTo(0, 0); }
  function begin(job) {
    if (!C.generate(job, 1, state.lang)) { state.error = true; render(); return; }
    state.job = job; state.shift = 1; go('report');
  }

  app.addEventListener('input', function (e) {
    if (e.target.id !== 'f-job') return;
    state.job = e.target.value; e.target.dir = boxDir(e.target.value);
  });
  app.addEventListener('submit', function (e) { e.preventDefault(); begin(state.job); });
  app.addEventListener('click', function (e) {
    var el = e.target.closest('button'); if (!el) return;
    if (el.dataset.example != null) { begin(t('exampleJobs')[Number(el.dataset.example)]); return; }
    switch (el.dataset.act) {
      case 'another': state.shift = Math.min(999, state.shift + 1); state.note = ''; render(); window.scrollTo(0, 0); return;
      case 'new': state.job = ''; go('start'); return;
      case 'copy': copyReport(); return;
    }
  });
  function copyReport() {
    var r = C.generate(state.job, state.shift, state.lang); if (!r) return;
    var text = C.toText(r);
    function done(ok) { state.note = ok ? t('copied') : t('cantCopy'); render(); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    else done(false);
  }
  document.getElementById('lang-toggle').addEventListener('click', function () {
    state.lang = state.lang === 'he' ? 'en' : 'he';
    try { localStorage.setItem(LANG_KEY, state.lang); } catch (e) { /* blocked */ }
    render();
  });
  document.getElementById('brand').addEventListener('click', function () { state.job = ''; go('start'); });

  render();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(function () { /* optional */ });
})();
