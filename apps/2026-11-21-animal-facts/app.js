/* Soya's Animal Facts: a new true fact about an animal every day, told by Soya the cat, in English, Hebrew and French.
   Each fact links to where it comes from, with a tuna rating for how far we trust that source. "True or false?" busts
   common animal myths. Stored on this device only: the language. Nothing is counted and nothing is sent. */
(function () {
  'use strict';

  var KEY = 'soya-animals-lang', LANGS = ['en', 'he', 'fr'];
  var I18N = {
    en: { name: "Soya's Animal Facts", tagline: 'A new true animal fact every day', today: function (d) { return 'Fact of the day, ' + d; },
      more: 'Tell me more', less: 'Show less', read: 'Soya, read it to me', another: 'Another fact', source: 'Where this came from', tuna: function (n) { return n + ' of 5 tuna'; },
      tunaKey: 'Tuna = how much we trust a source. 5 tuna: the official source or a careful scientist. 3 tuna: a good start; check its sources.',
      quizTitle: 'True or false?', yes: 'True', no: 'False', right: 'You got it!', wrong: 'Not quite!', nextQ: 'Next one', all: 'All the facts so far',
      hi: ['Hi! I am Soya. Here is something amazing.', 'Meow! I checked this one twice.', 'Ready? This one surprised me too.'],
      note: 'Soya is a cartoon cat. Every fact was checked against its source; tap the source to see it yourself.', privacy: 'No ads. Nothing is counted. Your language choice stays on this device.',
      home: 'All apps', credit: 'Made by Soycatory', other: { en: 'English', he: 'עברית', fr: 'Français' } },
    he: { name: 'העובדות של סויה על חיות', tagline: 'עובדה אמיתית חדשה על חיות בכל יום', today: function (d) { return 'העובדה של היום, ' + d; },
      more: 'ספרו לי עוד', less: 'פחות', read: 'סויה, תקריא לי', another: 'עוד עובדה', source: 'מאיפה זה הגיע', tuna: function (n) { return n + ' מתוך 5 טונות'; },
      tunaKey: 'טונה = כמה אנחנו סומכים על מקור. 5 טונות: המקור הרשמי או מדען זהיר. 3 טונות: התחלה טובה; כדאי לבדוק את המקורות שלו.',
      quizTitle: 'נכון או לא נכון?', yes: 'נכון', no: 'לא נכון', right: 'צדקתם!', wrong: 'כמעט!', nextQ: 'עוד אחת', all: 'כל העובדות עד עכשיו',
      hi: ['היי! אני סויה. הנה משהו מדהים.', 'מיאו! את זה בדקתי פעמיים.', 'מוכנים? גם אותי זה הפתיע.'],
      note: 'סויה הוא חתול מצויר. כל עובדה נבדקה מול המקור שלה; לחצו על המקור כדי לראות בעצמכם.', privacy: 'בלי פרסומות. שום דבר לא נספר. בחירת השפה נשארת במכשיר.',
      home: 'כל האפליקציות', credit: 'נוצר על ידי Soycatory', other: { en: 'English', he: 'עברית', fr: 'Français' } },
    fr: { name: 'Les animaux de Soya', tagline: 'Un vrai fait sur les animaux, chaque jour', today: function (d) { return 'Le fait du jour, ' + d; },
      more: 'Raconte-moi plus', less: 'Moins', read: 'Soya, lis-moi ça', another: 'Un autre fait', source: "D'où ça vient", tuna: function (n) { return n + ' thons sur 5'; },
      tunaKey: 'Thon = notre confiance dans une source. 5 thons : la source officielle ou un scientifique rigoureux. 3 thons : un bon début ; vérifie ses sources.',
      quizTitle: 'Vrai ou faux ?', yes: 'Vrai', no: 'Faux', right: 'Bravo !', wrong: 'Presque !', nextQ: 'Suivant', all: 'Tous les faits',
      hi: ['Salut ! Je suis Soya. Voici quelque chose d\'incroyable.', 'Miaou ! J\'ai vérifié celui-ci deux fois.', 'Prêt ? Celui-ci m\'a surpris aussi.'],
      note: 'Soya est un chat de dessin animé. Chaque fait a été vérifié dans sa source ; touche la source pour la voir toi-même.', privacy: "Pas de pub. Rien n'est compté. Ta langue reste sur cet appareil.",
      home: 'Toutes les applis', credit: 'Fait par Soycatory', other: { en: 'English', he: 'עברית', fr: 'Français' } }
  };
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function put(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* fine */ } }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var lang = get(); if (LANGS.indexOf(lang) < 0) { var nl = (navigator.language || '').toLowerCase(); lang = /^(he|iw)/.test(nl) ? 'he' : /^fr/.test(nl) ? 'fr' : 'en'; }
  function t(k) { return I18N[lang][k]; }
  function L(o) { return (o && (o[lang] || o.en)) || ''; }

  var data = null, shown = -1, openMore = false, mythAt = 0, answered = null, pose = 'happy';
  /* The fact of the day changes at local midnight, the same for everyone on the same date. */
  /* The list starts on launch day (21 November 2026) with the tiger, then goes in order, one fact a day, and starts again. */
  var START = Date.UTC(2026, 10, 21) / 86400000;
  function dayIndex(n) { var d = new Date(); var days = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) - START; return ((days % n) + n) % n; }
  function dateText() { try { return new Date().toLocaleDateString(lang === 'he' ? 'he-IL' : lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long' }); } catch (e) { return ''; } }
  function cat(p, size) { return '<img class="cat" src="assets/soya-' + p + '.svg" width="' + size + '" height="' + Math.round(size * 1.1) + '" alt="">'; }
  function tunaRow(n) {
    var fish = '<path d="M3 12c3-5 9-6 14-3l4-3v12l-4-3c-5 3-11 2-14-3z"/><circle cx="7.5" cy="11" r="1.1" fill="#0F1424"/>', out = '';
    for (var i = 1; i <= 5; i++) out += '<svg class="fish' + (i <= n ? ' on' : '') + '" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">' + fish + '</svg>';
    return '<span class="tuna" role="img" aria-label="' + esc(t('tuna')(n)) + '">' + out + '</span>';
  }

  function render() {
    var doc = document.documentElement; doc.lang = lang; doc.dir = lang === 'he' ? 'rtl' : 'ltr'; document.title = t('name');
    document.getElementById('brand-title').textContent = t('name'); document.getElementById('credit').textContent = t('credit');
    var next = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length], tg = document.getElementById('lang-toggle'); tg.textContent = t('other')[next]; tg.setAttribute('lang', next);
    var app = document.getElementById('app');
    if (!data) { app.innerHTML = '<div class="hero">' + cat('sit', 110) + '</div>'; return; }
    var facts = data.facts, f = facts[shown], src = data.sources[f.src] || { tuna: 3, why: {} }, isToday = shown === dayIndex(facts.length);
    var hi = t('hi')[shown % t('hi').length];
    var html = '<section class="hero">' + cat(pose, 110) + '<div class="bubble"><p>' + esc(hi) + '</p></div></section>' +
      '<p class="tagline">' + esc(t('tagline')) + '</p>' +
      '<article class="fact"><p class="label">' + esc(isToday ? t('today')(dateText()) : L(f.animal)) + '</p>' +
      '<div class="fact-head"><span class="emoji" aria-hidden="true">' + f.emoji + '</span><h1>' + esc(L(f.animal)) + '</h1></div>' +
      '<p class="big">' + esc(L(f.fact)) + '</p>' +
      (openMore ? '<p class="more">' + esc(L(f.more)) + '</p>' : '') +
      '<div class="two"><button type="button" class="ghost" id="more" aria-expanded="' + openMore + '">' + esc(openMore ? t('less') : t('more')) + '</button>' + (window.SoyaReader ? '<button type="button" class="ghost" id="read">' + esc(t('read')) + '</button>' : '') + '</div>' +
      '<div class="src"><a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(t('source')) + ': Wikipedia</a> ' + tunaRow(src.tuna) + '<small class="mute">' + esc(L(src.why)) + '</small></div>' +
      '<button type="button" class="primary" id="another">' + esc(t('another')) + '</button></article>';
    var m = data.myths[mythAt % data.myths.length];
    html += '<section class="panel quiz"><h2>' + esc(t('quizTitle')) + '</h2><p class="myth"><span aria-hidden="true">' + m.emoji + '</span> ' + esc(L(m.claim)) + '</p>';
    if (answered == null) html += '<div class="tf"><button type="button" class="ghost" data-tf="1">' + esc(t('yes')) + '</button><button type="button" class="ghost" data-tf="0">' + esc(t('no')) + '</button></div>';
    else html += '<p class="verdict ' + (answered === m.true ? 'ok' : 'no') + '" role="status">' + esc(answered === m.true ? t('right') : t('wrong')) + ' ' + esc(L(m.answer)) + '</p>' +
      '<p class="src"><a href="' + esc(m.url) + '" target="_blank" rel="noopener">' + esc(t('source')) + ': Wikipedia</a> ' + tunaRow((data.sources[m.src] || {}).tuna || 3) + '</p>' +
      '<button type="button" class="ghost" id="next-q">' + esc(t('nextQ')) + '</button>';
    html += '</section>';
    html += '<details class="panel"><summary>' + esc(t('all')) + '</summary><ol class="all">' + facts.map(function (x, i) {
      return '<li><button type="button" class="link" data-show="' + i + '"><span aria-hidden="true">' + x.emoji + '</span> <b>' + esc(L(x.animal)) + ':</b> ' + esc(L(x.fact)) + '</button></li>';
    }).join('') + '</ol></details>';
    html += '<p class="mute small">' + esc(t('tunaKey')) + '</p><p class="mute small">' + esc(t('note')) + ' ' + esc(t('privacy')) + '</p><p><a class="home" href="../../">' + esc(t('home')) + '</a></p>';
    app.innerHTML = html; wire();
  }

  function wire() {
    var rd = document.getElementById('read'); if (rd) rd.addEventListener('click', function () { var f = data.facts[shown]; pose = 'wow'; window.SoyaReader.readText(L(f.animal) + '. ' + L(f.fact) + ' ' + L(f.more)); });
    document.getElementById('more').addEventListener('click', function () { openMore = !openMore; render(); document.getElementById('more').focus(); });
    document.getElementById('another').addEventListener('click', function () {
      var n = data.facts.length, i; do { i = Math.floor(Math.random() * n); } while (n > 1 && i === shown);
      shown = i; openMore = false; pose = ['happy', 'wow', 'party', 'glasses'][Math.floor(Math.random() * 4)]; render();
      var a = document.getElementById('another'); if (a) a.focus({ preventScroll: true }); window.scrollTo({ top: 0 });
    });
    document.querySelectorAll('[data-tf]').forEach(function (b) { b.addEventListener('click', function () { answered = b.getAttribute('data-tf') === '1'; var m = data.myths[mythAt % data.myths.length]; pose = answered === m.true ? 'party' : 'wow'; render(); }); });
    var nq = document.getElementById('next-q'); if (nq) nq.addEventListener('click', function () { mythAt++; answered = null; pose = 'happy'; render(); });
    document.querySelectorAll('[data-show]').forEach(function (b) { b.addEventListener('click', function () { shown = +b.getAttribute('data-show'); openMore = false; pose = 'happy'; render(); window.scrollTo({ top: 0 }); }); });
  }

  document.getElementById('lang-toggle').addEventListener('click', function () { lang = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]; put(lang); render(); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () { /* works without it */ });
  render();
  fetch('facts.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) {
    data = d; shown = dayIndex(d.facts.length); mythAt = dayIndex(d.myths.length); render();
  }).catch(function () { render(); });
})();
