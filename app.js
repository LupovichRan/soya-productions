/* Soya Productions front page: lists the films from films.js, newest first.
   No framework, no build step, no tracking. Only the language choice is kept, in this browser. */
(function () {
  'use strict';

  var LANG_KEY = 'soya-productions-lang';
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
      tagline: 'Small, calm web apps, one at a time.',
      nowShowing: 'Now showing',
      earlier: 'Earlier films',
      film: 'Film',
      open: 'Open',
      none: 'No films yet. Come back soon.',
      promise: 'No accounts, no ads, no tracking.'
    },
    he: {
      otherLang: 'English',
      tagline: 'אפליקציות קטנות ורגועות, אחת בכל פעם.',
      nowShowing: 'מוקרן עכשיו',
      earlier: 'סרטים קודמים',
      film: 'סרט',
      open: 'פתיחה',
      none: 'אין עדיין סרטים. חזרו בקרוב.',
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
  /** A film is a folder in this repository (folder), a sister site on the same host (path), or elsewhere (url). */
  function href(film) {
    if (film.url) return film.url;
    if (film.folder) return 'films/' + encodeURIComponent(film.folder) + '/';
    return '../' + encodeURIComponent(film.path) + '/';
  }
  function words(film) { return film[lang] || film.en || {}; }
  function meta(film) { return t('film') + ' ' + film.number + ' · ' + day(film.date); }

  function render() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    var toggle = document.getElementById('lang-toggle');
    toggle.textContent = t('otherLang');
    toggle.setAttribute('lang', lang === 'he' ? 'en' : 'he');
    document.getElementById('tagline').textContent = t('tagline');
    document.getElementById('promise').textContent = t('promise');

    var films = (window.SOYA_FILMS || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : b.number - a.number; });
    var app = document.getElementById('app');
    if (!films.length) { app.innerHTML = '<h1>' + esc(t('nowShowing')) + '</h1><p class="mute">' + esc(t('none')) + '</p>'; return; }

    var first = films[0], w = words(first);
    var html = '<h1>' + esc(t('nowShowing')) + '</h1><article class="card"><div class="film-head">' + mascot(first.mascot, 56) +
      '<div><h2>' + esc(w.title) + '</h2><p class="meta">' + esc(meta(first)) + '</p></div></div>' +
      '<p class="line">' + esc(w.line) + '</p>' +
      '<a class="button" href="' + esc(href(first)) + '">' + esc(t('open')) + ' ' + esc(w.title) + '</a></article>';
    if (films.length > 1) {
      html += '<h1>' + esc(t('earlier')) + '</h1>' + films.slice(1).map(function (f) {
        var x = words(f);
        return '<a class="row" href="' + esc(href(f)) + '">' + mascot(f.mascot, 40) + '<span><b>' + esc(x.title) + '</b><small>' + esc(meta(f)) + '</small></span></a>';
      }).join('');
    }
    app.innerHTML = html;
  }

  document.getElementById('lang-toggle').addEventListener('click', function () {
    lang = lang === 'he' ? 'en' : 'he';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* blocked */ }
    render();
  });

  render();
})();
