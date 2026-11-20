/* Soya explains: lists the videos from videos.js. Each has captions in both languages, the words as text, and a plain note
   that the voice is synthetic. Nothing is stored except the language choice, shared with the rest of the site. */
(function () {
  'use strict';

  var LANG_KEY = 'soycatory-lang';
  var I18N = {
    en: {
      otherLang: 'עברית', promise: 'No accounts, no ads, no tracking.', title: 'Soya explains',
      lead: 'Short videos where Soya the cat explains AI and software in plain words. Captions in English and Hebrew.',
      read: 'Read the words', back: 'All apps', minutes: function (s) { return Math.round(s) + ' seconds'; },
      note: 'Soya is a cartoon cat. The voice is synthetic (made by a computer), and the words are written by the Soycatory team.',
      credit: 'Voice: Piper text-to-speech, voice "joe" (public domain, CC0). Picture and drawing: Soycatory.',
      captions: 'Turn on captions in the player; English and Hebrew are both there.',
      next: 'Coming ideas', nextNote: 'Not made yet. Each one needs facts we can point to first.'
    },
    he: {
      otherLang: 'English', promise: 'בלי חשבון, בלי פרסומות, בלי מעקב.', title: 'סויה מסבירה',
      lead: 'סרטונים קצרים שבהם סויה החתולה מסבירה בינה מלאכותית ותוכנה במילים פשוטות. כתוביות באנגלית ובעברית.',
      read: 'קוראים את המילים', back: 'כל האפליקציות', minutes: function (s) { return Math.round(s) + ' שניות'; },
      note: 'סויה היא חתול מצויר. הקול סינתטי (נוצר על ידי מחשב), והמילים נכתבו על ידי צוות Soycatory.',
      credit: 'קול: Piper להמרת טקסט לדיבור, הקול "joe" (נחלת הכלל, CC0). תמונה ואיור: Soycatory.',
      captions: 'מפעילים כתוביות בנגן; יש גם באנגלית וגם בעברית.',
      next: 'רעיונות לבאות', nextNote: 'עוד לא נעשו. לכל אחד צריך קודם עובדות שאפשר להצביע עליהן.'
    }
  };
  var lang = (function () {
    var s = null; try { s = localStorage.getItem(LANG_KEY); } catch (e) { /* blocked */ }
    if (s === 'en' || s === 'he') return s;
    return /^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en';
  })();
  function t(k) { return I18N[lang][k]; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function render() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.title = t('title') + ' — Soycatory';
    var tg = document.getElementById('lang-toggle'); tg.textContent = t('otherLang'); tg.setAttribute('lang', lang === 'he' ? 'en' : 'he');
    document.getElementById('promise').textContent = t('promise');
    var vids = (window.SOYA_VIDEOS || []), ideas = (window.SOYA_VIDEO_IDEAS || {})[lang] || [];
    var html = '<h1>' + esc(t('title')) + '</h1><p class="lead">' + esc(t('lead')) + '</p>';
    html += vids.map(function (v) {
      var base = 'assets/videos/' + encodeURIComponent(v.slug);
      var tracks = ['en', 'he'].map(function (l) {
        return '<track kind="subtitles" src="' + base + '.' + l + '.vtt" srclang="' + l + '" label="' + (l === 'he' ? 'עברית' : 'English') + '"' + (l === lang ? ' default' : '') + '>';
      }).join('');
      var words = (v.transcript[lang] || v.transcript.en).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
      return '<article class="card video"><h2>' + esc(v.title[lang] || v.title.en) + '</h2><p class="meta">' + esc(t('minutes')(v.seconds)) + '</p>' +
        '<video controls preload="metadata" playsinline poster="' + base + '.jpg"><source src="' + base + '.mp4" type="video/mp4">' + tracks + '</video>' +
        '<p>' + esc(v.description[lang] || v.description.en) + '</p><p class="small mute">' + esc(t('captions')) + '</p>' +
        '<details><summary>' + esc(t('read')) + '</summary><div class="words">' + words + '</div></details>' +
        '<p class="small mute">' + esc(t('note')) + ' ' + esc(t('credit')) + '</p></article>';
    }).join('');
    if (ideas.length) html += '<h2>' + esc(t('next')) + '</h2><section class="card"><ul class="plain">' + ideas.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p class="small mute">' + esc(t('nextNote')) + '</p></section>';
    html += '<div class="actions"><a class="button wide" href="./">' + esc(t('back')) + '</a></div>';
    document.getElementById('app').innerHTML = html;
  }
  document.getElementById('lang-toggle').addEventListener('click', function () {
    lang = lang === 'he' ? 'en' : 'he';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* blocked */ }
    render();
  });
  render();
})();
