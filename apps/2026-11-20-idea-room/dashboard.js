/* Idea Room live numbers. Reads one function from the shared service every ten seconds while the page is open
   and visible. No device ids are ever shown: the service only returns totals. */
(function () {
  'use strict';

  var LANG_KEY = 'soya-idearoom-lang';
  var Remote = window.SoyaRemote;
  var app = document.getElementById('app');

  var I18N = {
    en: {
      title: 'Live numbers', otherLang: 'עברית', credit: 'Made by Soycatory', back: 'Back to Idea Room',
      note: 'Alpha test. A device is a browser, not a verified person, so these numbers show activity, not proven demand. Shared ideas are public to everyone using the alpha.',
      off: 'The shared service is not set up in this copy of the app.', failed: 'Could not reach the shared service. Showing the last numbers we had.', loading: 'Loading…',
      updated: function (s) { return 'Updated ' + s + ' · refreshes every 10 seconds'; },
      tiles: { ideas: 'Ideas', devices: 'Devices', acts: 'Acts recorded', seats: 'Seats', votes: 'Votes', answered: 'Suggestions answered', trust: 'Trust points given' },
      boardTitle: 'Ideas by score', noIdeas: 'No shared ideas yet.', day: function (d) { return 'Day ' + d + ' of 14'; }, score: function (s) { return 'Score ' + s + ' of 20'; },
      seatsOf: function (n) { return n + (n === 1 ? ' seat' : ' seats'); }, answeredOf: function (a, n) { return a + ' of ' + n + ' answered'; },
      recentTitle: 'Latest activity', noRecent: 'Nothing yet.',
      what: { idea: 'New idea', seat: 'Took a seat', suggestion: 'New suggestion', trust: 'Trust points given', 'signal:follow': 'Followed', 'signal:want': 'Said "I want this"', 'signal:share': 'Will tell someone', 'signal:pledge': 'Pledged an hour', 'signal:call': 'Will take a call' },
      ago: function (s) { if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago'; return Math.floor(s / 86400) + ' d ago'; }
    },
    he: {
      title: 'מספרים בשידור חי', otherLang: 'English', credit: 'נוצר על ידי Soycatory', back: 'חזרה לחדר רעיונות',
      note: 'בדיקת אלפא. מכשיר הוא דפדפן, לא אדם מאומת, ולכן המספרים מראים פעילות ולא ביקוש שהוכח. רעיונות משותפים גלויים לכל מי שמשתמש באלפא.',
      off: 'השירות המשותף לא מוגדר בעותק הזה של האפליקציה.', failed: 'לא הצלחנו להגיע לשירות המשותף. מוצגים המספרים האחרונים שהיו לנו.', loading: 'טוען…',
      updated: function (s) { return 'עודכן ' + s + ' · מתרענן כל 10 שניות'; },
      tiles: { ideas: 'רעיונות', devices: 'מכשירים', acts: 'מעשים שנרשמו', seats: 'מקומות', votes: 'הצבעות', answered: 'הצעות שנענו', trust: 'נקודות אמון שניתנו' },
      boardTitle: 'רעיונות לפי ציון', noIdeas: 'אין עדיין רעיונות משותפים.', day: function (d) { return 'יום ' + d + ' מתוך 14'; }, score: function (s) { return 'ציון ' + s + ' מתוך 20'; },
      seatsOf: function (n) { return n === 1 ? 'מקום אחד' : n + ' מקומות'; }, answeredOf: function (a, n) { return 'נענו ' + a + ' מתוך ' + n; },
      recentTitle: 'פעילות אחרונה', noRecent: 'עדיין כלום.',
      what: { idea: 'רעיון חדש', seat: 'תפס מקום', suggestion: 'הצעה חדשה', trust: 'ניתנו נקודות אמון', 'signal:follow': 'עוקב', 'signal:want': 'אמר "אני רוצה את זה"', 'signal:share': 'יספר למישהו', 'signal:pledge': 'התחייב לשעה', 'signal:call': 'יקח שיחה' },
      ago: function (s) { if (s < 60) return 'ממש עכשיו'; if (s < 3600) return 'לפני ' + Math.floor(s / 60) + ' דק׳'; if (s < 86400) return 'לפני ' + Math.floor(s / 3600) + ' שע׳'; return 'לפני ' + Math.floor(s / 86400) + ' ימים'; }
    }
  };

  var lang = 'en';
  try { var saved = localStorage.getItem(LANG_KEY); lang = saved === 'he' || saved === 'en' ? saved : (/^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en'); } catch (e) { lang = /^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en'; }
  var data = null, failed = false, at = null;

  function t(k) { return I18N[lang][k]; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function n(x) { x = Number(x); return isFinite(x) ? Math.max(0, Math.floor(x)) : 0; }
  function sum(o) { return Object.keys(o || {}).reduce(function (a, k) { return a + n(o[k]); }, 0); }

  function render() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.title = t('title') + ' — Idea Room — Soycatory';
    var tg = document.getElementById('lang-toggle'); tg.textContent = t('otherLang'); tg.setAttribute('lang', lang === 'he' ? 'en' : 'he');
    document.getElementById('brand-title').textContent = t('title'); document.getElementById('credit').textContent = t('credit');
    var html = '<h1>' + esc(t('title')) + '</h1><p class="banner" role="note">' + esc(t('note')) + '</p>';
    if (!Remote || !Remote.enabled) html += '<p class="banner soft">' + esc(t('off')) + '</p>';
    else if (!data) html += '<p class="mute">' + esc(t('loading')) + (failed ? '</p><p class="banner">' + esc(t('failed')) : '') + '</p>';
    else {
      if (failed) html += '<p class="banner" role="status">' + esc(t('failed')) + '</p>';
      var items = data.items || {}, suggestions = sum(items);
      var tiles = [['ideas', n(data.ideas)], ['devices', n(data.devices)], ['acts', sum(data.signals)], ['seats', n(data.seats)], ['votes', n(data.votes)], ['answered', n(data.answered) + ' / ' + suggestions], ['trust', n(data.trust_points)]];
      html += '<div class="tiles">' + tiles.map(function (x) { return '<div class="tile"><b>' + esc(x[1]) + '</b><span>' + esc(t('tiles')[x[0]]) + '</span></div>'; }).join('') + '</div>';
      html += '<section class="card"><h2>' + esc(t('boardTitle')) + '</h2>' + ((data.board || []).length ? '<ul class="board">' + data.board.map(function (b) {
        return '<li><b dir="auto"><bdi>' + esc(b.name) + '</bdi></b><span class="small mute">' + esc(t('day')(n(b.day))) + ' · ' + esc(t('score')(n(b.score))) + ' · ' + esc(t('seatsOf')(n(b.seats))) + ' · ' + esc(t('answeredOf')(n(b.answered), n(b.suggestions))) + '</span></li>';
      }).join('') + '</ul>' : '<p class="mute">' + esc(t('noIdeas')) + '</p>') + '</section>';
      var now = Date.now();
      html += '<section class="card"><h2>' + esc(t('recentTitle')) + '</h2>' + ((data.recent || []).length ? '<ul class="board">' + data.recent.map(function (r) {
        var secs = Math.max(0, Math.floor((now - Date.parse(r.at)) / 1000)) || 0;
        return '<li><span>' + esc(t('what')[r.what] || r.what) + ' · <bdi dir="auto">' + esc(r.idea) + '</bdi></span><span class="small mute">' + esc(t('ago')(secs)) + '</span></li>';
      }).join('') + '</ul>' : '<p class="mute">' + esc(t('noRecent')) + '</p>') + '</section>';
      if (at) html += '<p class="small mute">' + esc(t('updated')(at.toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-GB'))) + '</p>';
    }
    html += '<div class="actions"><a class="button ghost wide" href="./">' + esc(t('back')) + '</a></div>';
    app.innerHTML = html;
  }

  function refresh() {
    if (!Remote || !Remote.enabled) return render();
    Remote.dashboard().then(function (d) { data = d; failed = false; at = new Date(); render(); }).catch(function () { failed = true; render(); });
  }

  document.getElementById('lang-toggle').addEventListener('click', function () {
    lang = lang === 'he' ? 'en' : 'he';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* blocked */ }
    render();
  });
  render(); refresh();
  setInterval(function () { if (document.visibilityState === 'visible') refresh(); }, 10000);
})();
