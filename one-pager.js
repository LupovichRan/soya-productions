/* One page for one app: opened as one-pager.html?app=<key>. It shows what the app is, what works today, the road map,
   and two small forms: "what would you add?" and the waiting list. Nothing is stored here. The forms send only what
   the person typed, to the address in waitlist.js, and are switched off while that address is empty. */
(function () {
  'use strict';

  var LANG_KEY = 'soycatory-lang';
  var COLORS = { cat: '#1F2937', fox: '#B9571E', owl: '#6B5540', bear: '#7A4B2E', rabbit: '#8C95A3', frog: '#2F7D55' };
  var EARS = {
    cat: '<path d="M20 38 L24 6 L48 26Z"/><path d="M80 38 L76 6 L52 26Z"/>', fox: '<path d="M16 40 L18 2 L46 26Z"/><path d="M84 40 L82 2 L54 26Z"/>',
    owl: '<path d="M22 30 L22 10 L40 22Z"/><path d="M78 30 L78 10 L60 22Z"/>', bear: '<circle cx="24" cy="24" r="13"/><circle cx="76" cy="24" r="13"/>',
    rabbit: '<ellipse cx="34" cy="14" rx="9" ry="24"/><ellipse cx="66" cy="14" rx="9" ry="24"/>', frog: '<circle cx="30" cy="26" r="14"/><circle cx="70" cy="26" r="14"/>'
  };
  var I18N = {
    en: {
      otherLang: 'עברית', promise: 'No accounts, no ads, no tracking.', missing: 'We could not find that app.', all: 'All apps',
      series: 'One app a day until something catches.', app: function (n) { return 'App ' + n; },
      try: 'Try it', watch: 'Watch the 10-second intro', works: 'What works today', next: 'Next', later: 'Later', roadNote: 'Next and Later are plans, not promises.',
      askTitle: 'What would you add?', askLabel: 'Your idea, in a sentence or two', askEmail: 'Your email (optional, only so we can write back)', askSend: 'Send my idea',
      askThanks: 'Thank you. We read every one.', askShort: 'Write at least a few words.',
      waitTitle: 'Tell me when it is ready', waitLead: 'One email when this app grows into the next version, and nothing else.', waitEmail: 'Your email', waitSend: 'Add me to the waiting list',
      consent: 'I agree to get that one email. I can ask to be removed at any time.', waitThanks: 'You are on the list. Thank you.', badEmail: 'That email does not look right.', needConsent: 'Please tick the box so we know you agree.',
      off: 'The forms open soon.', failed: 'Could not send that just now. Please try again later.',
      privacy: 'We keep only what you type here and the name of the app, in a private Google Sheet. We do not share it or use it for anything else.'
    },
    he: {
      otherLang: 'English', promise: 'בלי חשבון, בלי פרסומות, בלי מעקב.', missing: 'לא מצאנו את האפליקציה הזאת.', all: 'כל האפליקציות',
      series: 'אפליקציה ביום עד שמשהו יתפוס.', app: function (n) { return 'אפליקציה ' + n; },
      try: 'לנסות', watch: 'לצפות בהקדמה של 10 שניות', works: 'מה עובד היום', next: 'הבא', later: 'אחר כך', roadNote: 'הבא ואחר כך הם תוכניות, לא הבטחות.',
      askTitle: 'מה הייתם מוסיפים?', askLabel: 'הרעיון שלכם, במשפט או שניים', askEmail: 'המייל שלכם (לא חובה, רק כדי שנוכל לכתוב בחזרה)', askSend: 'שולחים את הרעיון שלי',
      askThanks: 'תודה. אנחנו קוראים כל אחד.', askShort: 'צריך לכתוב לפחות כמה מילים.',
      waitTitle: 'ספרו לי כשזה מוכן', waitLead: 'מייל אחד כשהאפליקציה הזאת תגדל לגרסה הבאה, ושום דבר אחר.', waitEmail: 'המייל שלכם', waitSend: 'מצרפים אותי לרשימת ההמתנה',
      consent: 'אני מסכים או מסכימה לקבל את המייל האחד הזה. אפשר לבקש להסיר אותי בכל זמן.', waitThanks: 'אתם ברשימה. תודה.', badEmail: 'המייל הזה לא נראה תקין.', needConsent: 'צריך לסמן את התיבה כדי שנדע שאתם מסכימים.',
      off: 'הטפסים ייפתחו בקרוב.', failed: 'לא הצלחנו לשלוח כרגע. נסו שוב מאוחר יותר.',
      privacy: 'אנחנו שומרים רק את מה שאתם כותבים כאן ואת שם האפליקציה, בגיליון גוגל פרטי. לא משתפים ולא משתמשים בזה לשום דבר אחר.'
    }
  };

  var key = new URLSearchParams(location.search).get('app') || '';
  var lang = (function () {
    var s = null; try { s = localStorage.getItem(LANG_KEY); } catch (e) { /* blocked */ }
    if (s === 'en' || s === 'he') return s;
    return /^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en';
  })();
  var note = { ask: '', wait: '' };

  function t(k) { return I18N[lang][k]; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pageDir() { return document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'; }
  function dirFor(text) { var m = String(text || '').match(/[A-Za-z֐-׿]/); return m ? (/[֐-׿]/.test(m[0]) ? 'rtl' : 'ltr') : ''; }
  function boxDir(v) { return dirFor(v) || pageDir(); }
  function mascot(animal, size) {
    if (!EARS[animal]) animal = 'cat';
    return '<svg class="mark" width="' + size + '" height="' + size + '" viewBox="2 -14 96 108" aria-hidden="true"><g fill="' + COLORS[animal] + '">' + EARS[animal] + '<ellipse cx="50" cy="56" rx="40" ry="34"/></g><circle cx="35" cy="54" r="3.8" fill="#fff"/><circle cx="65" cy="54" r="3.8" fill="#fff"/></svg>';
  }
  function find() {
    var list = window.SOYA_APPS || [];
    for (var i = 0; i < list.length; i++) { if (list[i].folder === key || (list[i].path && list[i].path.indexOf(key) >= 0) || (key === 'roundtable' && list[i].path)) { if (key === 'roundtable' && !list[i].path) continue; return list[i]; } }
    return null;
  }
  function list(items) { return '<ul class="plain">' + items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; }
  function enabled() { return !!(window.SOYA_WAITLIST && window.SOYA_WAITLIST.url); }

  function render() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    var tg = document.getElementById('lang-toggle'); tg.textContent = t('otherLang'); tg.setAttribute('lang', lang === 'he' ? 'en' : 'he');
    document.getElementById('promise').textContent = t('promise');
    var app = document.getElementById('app'), item = find(), road = (window.SOYA_ROADMAPS || {})[key === 'roundtable' ? 'roundtable' : key];
    if (!item || !road) { document.title = 'Soycatory'; app.innerHTML = '<p class="mute">' + esc(t('missing')) + '</p><a class="button" href="./">' + esc(t('all')) + '</a>'; return; }
    var w = item[lang] || item.en, r = road[lang] || road.en;
    document.title = w.title + ' — Soycatory';
    var href = road.open || ('apps/' + encodeURIComponent(item.folder) + '/');
    var video = road.slug ? 'assets/intros/' + road.slug + '.mp4' : '';
    var off = !enabled();
    var forms = '<section class="card"><h2>' + esc(t('askTitle')) + '</h2><p class="mute">' + esc(r.ask) + '</p>' +
      '<form id="ask-form" novalidate><label for="a-text">' + esc(t('askLabel')) + '</label><textarea id="a-text" maxlength="300" dir="' + boxDir('') + '" autocomplete="off"' + (off ? ' disabled' : '') + '></textarea>' +
      '<label for="a-email">' + esc(t('askEmail')) + '</label><input type="email" id="a-email" maxlength="254" autocomplete="email" dir="ltr"' + (off ? ' disabled' : '') + '>' +
      hp() + (note.ask ? '<p class="banner ' + (note.askOk ? 'ok' : 'soft') + '" role="status">' + esc(note.ask) + '</p>' : '') +
      '<button type="submit" class="ghost wide"' + (off ? ' disabled' : '') + '>' + esc(t('askSend')) + '</button></form></section>' +
      '<section class="card"><h2>' + esc(t('waitTitle')) + '</h2><p class="mute">' + esc(t('waitLead')) + '</p>' +
      '<form id="wait-form" novalidate><label for="w-email">' + esc(t('waitEmail')) + '</label><input type="email" id="w-email" maxlength="254" autocomplete="email" dir="ltr"' + (off ? ' disabled' : '') + '>' +
      '<label class="check"><input type="checkbox" id="w-consent"' + (off ? ' disabled' : '') + '><span>' + esc(t('consent')) + '</span></label>' + hp() +
      (note.wait ? '<p class="banner ' + (note.waitOk ? 'ok' : 'soft') + '" role="status">' + esc(note.wait) + '</p>' : '') +
      '<button type="submit" class="wide"' + (off ? ' disabled' : '') + '>' + esc(t('waitSend')) + '</button></form>' +
      (off ? '<p class="banner soft">' + esc(t('off')) + '</p>' : '') + '<p class="small mute">' + esc(t('privacy')) + '</p></section>';
    app.innerHTML = '<p class="small mute"><a href="./">' + esc(t('all')) + '</a> · ' + esc(t('app')(item.number)) + '</p>' +
      '<div class="app-head">' + mascot(item.mascot, 64) + '<div><h1 dir="' + boxDir(w.title) + '"><bdi>' + esc(w.title) + '</bdi></h1><p class="meta">' + esc(t('series')) + '</p></div></div>' +
      '<p class="line">' + esc(w.line) + '</p>' +
      '<a class="button wide" href="' + esc(href) + '">' + esc(t('try')) + '</a>' +
      (video ? '<details class="intro"><summary>' + esc(t('watch')) + '</summary><video controls preload="none" playsinline width="480" poster="assets/soycatory-teaser-poster.jpg"><source src="' + esc(video) + '" type="video/mp4"></video></details>' : '') +
      '<section class="card"><h2>' + esc(t('works')) + '</h2>' + list(r.works) + '</section>' +
      '<section class="card"><h2>' + esc(t('next')) + '</h2>' + list(r.next) + '<h2 class="gap">' + esc(t('later')) + '</h2>' + list(r.later) + '<p class="small mute">' + esc(t('roadNote')) + '</p></section>' + forms;
  }
  function hp() { return '<div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>'; }

  function send(kind, fields) {
    var body = new URLSearchParams(); body.set('app', (find() && (((window.SOYA_ROADMAPS || {})[key] || {}).slug)) || key); body.set('kind', kind); body.set('lang', lang);
    Object.keys(fields).forEach(function (k) { body.set(k, fields[k]); });
    return fetch(window.SOYA_WAITLIST.url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  }
  function emailOk(v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 254; }

  document.getElementById('app').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!enabled()) return;
    var f = e.target, trap = f.querySelector('input[name=website]');
    if (trap && trap.value) { note.ask = note.wait = ''; return; }   /* a robot filled the hidden field: send nothing */
    if (f.id === 'ask-form') {
      var text = f.querySelector('#a-text').value.trim(), mail = f.querySelector('#a-email').value.trim();
      note.askOk = false;
      if (text.length < 3) note.ask = t('askShort');
      else if (mail && !emailOk(mail)) note.ask = t('badEmail');
      else {
        send('request', { text: text.slice(0, 300), email: mail, website: trap ? trap.value : '' }).then(function () { note.ask = t('askThanks'); note.askOk = true; render(); }, function () { note.ask = t('failed'); render(); });
        return;
      }
      render();
    } else if (f.id === 'wait-form') {
      var em = f.querySelector('#w-email').value.trim(), ok = f.querySelector('#w-consent').checked;
      note.waitOk = false;
      if (!emailOk(em)) note.wait = t('badEmail');
      else if (!ok) note.wait = t('needConsent');
      else {
        send('waitlist', { email: em, consent: 'yes', website: trap ? trap.value : '' }).then(function () { note.wait = t('waitThanks'); note.waitOk = true; render(); }, function () { note.wait = t('failed'); render(); });
        return;
      }
      render();
    }
  });
  document.getElementById('lang-toggle').addEventListener('click', function () {
    lang = lang === 'he' ? 'en' : 'he';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* blocked */ }
    render();
  });
  render();
})();
