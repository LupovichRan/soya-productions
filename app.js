/* Soycatory front page: says what the factory is and lists the apps it has made, from apps.js,
   newest first. No framework, no build step, no tracking. Only the language choice is kept,
   in this browser. */
(function () {
  'use strict';

  var LANG_KEY = 'soycatory-lang';
  var COLORS = { cat: '#1F2937', fox: '#B9571E', owl: '#6B5540', bear: '#7A4B2E', rabbit: '#8C95A3', frog: '#2F7D55' };
  var EARS = {
    cat: '<path d="M20 38 L24 6 L48 26Z"/><path d="M80 38 L76 6 L52 26Z"/>',
    fox: '<path d="M16 40 L18 2 L46 26Z"/><path d="M84 40 L82 2 L54 26Z"/>',
    owl: '<path d="M22 30 L22 10 L40 22Z"/><path d="M78 30 L78 10 L60 22Z"/>',
    bear: '<circle cx="24" cy="24" r="13"/><circle cx="76" cy="24" r="13"/>',
    rabbit: '<ellipse cx="34" cy="14" rx="9" ry="24"/><ellipse cx="66" cy="14" rx="9" ry="24"/>',
    frog: '<circle cx="30" cy="26" r="14"/><circle cx="70" cy="26" r="14"/>'
  };
  var I18N = {
    en: {
      otherLang: 'עברית',
      tagline: 'The Soya Software Factory. Small, calm apps, built one at a time.',
      latest: 'Latest app',
      earlier: 'Earlier apps',
      app: 'App',
      open: 'Open',
      none: 'No apps yet. Come back soon.',
      roadTitle: 'Road map for each app', onePage: 'One page', videosTitle: 'Soya explains', videosLine: 'Short videos where Soya the cat explains AI and software.', newsTitle: "Soya's AI week", newsLine: 'What happened in AI this week, in plain words, with sources.',
      howTitle: 'How the factory works',
      how: ['It reads what is new in AI and software.', 'It picks the idea that would help an everyday person most.', 'It builds a small app, checks it, and asks Ran to look before anything goes live.'],
      promise: 'No accounts, no ads, no tracking.'
    },
    he: {
      otherLang: 'English',
      tagline: 'מפעל התוכנה של Soya. אפליקציות קטנות ורגועות, אחת בכל פעם.',
      latest: 'האפליקציה האחרונה',
      earlier: 'אפליקציות קודמות',
      app: 'אפליקציה',
      open: 'פתיחה',
      none: 'אין עדיין אפליקציות. חזרו בקרוב.',
      roadTitle: 'מפת דרכים לכל אפליקציה', onePage: 'עמוד אחד', videosTitle: 'סויה מסביר', videosLine: 'סרטונים קצרים שבהם סויה החתול מסביר בינה מלאכותית ותוכנה.', newsTitle: 'השבוע של סויה בבינה מלאכותית', newsLine: 'מה קרה השבוע בבינה מלאכותית, במילים פשוטות, עם מקורות.',
      howTitle: 'איך המפעל עובד',
      how: ['הוא קורא מה חדש בבינה מלאכותית ובתוכנה.', 'הוא בוחר את הרעיון שהכי יעזור לאדם רגיל.', 'הוא בונה אפליקציה קטנה, בודק אותה, ומבקש מרן להסתכל לפני שמשהו עולה לאוויר.'],
      promise: 'בלי חשבון, בלי פרסומות, בלי מעקב.'
    }
  };

  var lang = loadLang();

  function loadLang() {
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* blocked */ }
    if (saved === 'en' || saved === 'he') return saved;
    return /^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en';
  }
  function t(key) { return I18N[lang][key]; }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function mascot(animal, size) {
    if (!EARS[animal]) animal = 'cat';
    var eyeY = animal === 'frog' ? 28 : 54, eyeX = animal === 'frog' ? 20 : 15;
    return '<svg class="mark" width="' + size + '" height="' + size + '" viewBox="2 -14 96 108" aria-hidden="true"><g fill="' + COLORS[animal] + '">' +
      EARS[animal] + '<ellipse cx="50" cy="56" rx="40" ry="34"/></g>' +
      '<circle cx="' + (50 - eyeX) + '" cy="' + eyeY + '" r="3.8" fill="#fff"/><circle cx="' + (50 + eyeX) + '" cy="' + eyeY + '" r="3.8" fill="#fff"/></svg>';
  }
  function day(iso) {
    var d = new Date(iso + 'T12:00:00');
    if (isNaN(d)) return iso;
    try { return d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return iso; }
  }
  /** An app is a folder in this repository (folder), a sister site on the same host (path), or elsewhere (url). */
  function href(item) {
    if (item.url) return item.url;
    if (item.folder) return 'apps/' + encodeURIComponent(item.folder) + '/';
    return '../' + encodeURIComponent(item.path) + '/';
  }
  function words(item) { return item[lang] || item.en || {}; }
  /** "App 2 · 20 November 2026". The date is wrapped so its digits and month stay in order in Hebrew. */
  function meta(item) { return esc(t('app')) + ' ' + esc(item.number) + ' · <bdi>' + esc(day(item.date)) + '</bdi>'; }

  function render() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    var toggle = document.getElementById('lang-toggle');
    toggle.textContent = t('otherLang');
    toggle.setAttribute('lang', lang === 'he' ? 'en' : 'he');
    document.getElementById('tagline').textContent = t('tagline');
    document.getElementById('promise').textContent = t('promise');

    var list = (window.SOYA_APPS || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : b.number - a.number; });
    var app = document.getElementById('app');
    var html = '';
    if (!list.length) html += '<h2>' + esc(t('latest')) + '</h2><p class="mute">' + esc(t('none')) + '</p>';
    else {
      var first = list[0], w = words(first);
      html += '<h2>' + esc(t('latest')) + '</h2><article class="card"><div class="app-head">' + mascot(first.mascot, 56) +
        '<div><h3>' + esc(w.title) + '</h3><p class="meta">' + meta(first) + '</p></div></div>' +
        '<p class="line">' + esc(w.line) + '</p>' +
        '<a class="button" href="' + esc(href(first)) + '">' + esc(t('open')) + ' <bdi style="margin-inline-start:.3em">' + esc(w.title) + '</bdi></a></article>';
      if (list.length > 1) {
        html += '<h2>' + esc(t('earlier')) + '</h2>' + list.slice(1).map(function (f) {
          var x = words(f);
          return '<a class="row" href="' + esc(href(f)) + '">' + mascot(f.mascot, 40) + '<span><b>' + esc(x.title) + '</b><small>' + meta(f) + '</small></span></a>';
        }).join('');
      }
    }
    html += '<h2>' + esc(t('videosTitle')) + '</h2><a class="row" href="videos.html">' + mascot('cat', 40) + '<span><b>' + esc(t('videosTitle')) + '</b><small>' + esc(t('videosLine')) + '</small></span></a>';
    html += '<a class="row" href="newsletter.html">' + mascot('owl', 40) + '<span><b>' + esc(t('newsTitle')) + '</b><small>' + esc(t('newsLine')) + '</small></span></a>';
    if (list.length) {
      html += '<h2>' + esc(t('roadTitle')) + '</h2>' + list.map(function (f) {
        var key = f.folder || 'roundtable', x = words(f);
        return '<a class="row" href="one-pager.html?app=' + encodeURIComponent(key) + '">' + mascot(f.mascot, 40) + '<span><b>' + esc(x.title) + '</b><small>' + esc(t('onePage')) + '</small></span></a>';
      }).join('');
    }
    html += '<h2>' + esc(t('howTitle')) + '</h2><section class="card"><ol class="steps">' + t('how').map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></section>';
    app.innerHTML = html;
  }

  document.getElementById('lang-toggle').addEventListener('click', function () {
    lang = lang === 'he' ? 'en' : 'he';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* blocked */ }
    render();
  });

  render();
})();
