/* Soya's Games, a Soycatory app for young children and the grown-ups beside them.
   Three small games: match the pairs, count the fish, find the odd one out. No timers, no scores against the child,
   no sound, no ads, no tracking. Nothing is saved; only the language choice is kept, in this browser. */
(function () {
  'use strict';

  var LANG_KEY = 'soya-games-lang';
  var G = window.SoyaGames;

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
      title: "Soya's Games", otherLang: 'עברית', credit: 'Made by Soycatory',
      lead: 'Three small games to play together. No timers, no scores, nothing saved.',
      grownups: 'For grown-ups: no accounts, no ads, no tracking, no sound. Nothing about your child leaves this device.',
      games: { pairs: 'Match the pairs', count: 'Count the fish', odd: 'Find the odd one' },
      hints: { pairs: 'Turn over two cards. Find the ones that match.', count: 'How many fish are there?', odd: 'Three are the same. Tap the one that is different.' },
      home: 'All games', again: 'Play again', next: 'Next one',
      levels: { easy: 'Easy', medium: 'Medium', hard: 'Harder' },
      tries: function (n) { return n === 1 ? '1 try' : n + ' tries'; },
      won: 'You found them all!', wonTries: function (n) { return 'You found them all in ' + n + (n === 1 ? ' try.' : ' tries.'); },
      yes: 'Yes! Well done.', no: 'Not quite. Try again.', yesCount: function (n) { return 'Yes! ' + n + (n === 1 ? ' fish.' : ' fish.'); },
      card: function (i, state) { return 'Card ' + (i + 1) + ', ' + state; }, down: 'face down', matched: 'matched',
      fishCount: function (n) { return n + (n === 1 ? ' fish' : ' fish'); },
      animals: { cat: 'cat', fox: 'fox', owl: 'owl', bear: 'bear', rabbit: 'rabbit', frog: 'frog' },
      cell: function (i, name) { return 'Picture ' + (i + 1) + ', ' + name; }
    },
    he: {
      title: 'המשחקים של סויה', otherLang: 'English', credit: 'נוצר על ידי Soycatory',
      lead: 'שלושה משחקים קטנים לשחק ביחד. בלי שעון, בלי ציונים, שום דבר לא נשמר.',
      grownups: 'להורים: בלי חשבון, בלי פרסומות, בלי מעקב ובלי צלילים. שום דבר על הילד או הילדה לא יוצא מהמכשיר.',
      games: { pairs: 'מוצאים זוגות', count: 'סופרים דגים', odd: 'מי שונה?' },
      hints: { pairs: 'הופכים שני קלפים. מחפשים קלפים זהים.', count: 'כמה דגים יש?', odd: 'שלושה זהים. לוחצים על זה ששונה.' },
      home: 'כל המשחקים', again: 'משחקים שוב', next: 'עוד אחד',
      levels: { easy: 'קל', medium: 'בינוני', hard: 'קשה יותר' },
      tries: function (n) { return n === 1 ? 'ניסיון אחד' : n + ' ניסיונות'; },
      won: 'מצאתם את כולם!', wonTries: function (n) { return n === 1 ? 'מצאתם את כולם בניסיון אחד.' : 'מצאתם את כולם ב־' + n + ' ניסיונות.'; },
      yes: 'כן! כל הכבוד.', no: 'כמעט. מנסים שוב.', yesCount: function (n) { return 'כן! ' + (n === 1 ? 'דג אחד.' : n + ' דגים.'); },
      card: function (i, state) { return 'קלף ' + (i + 1) + ', ' + state; }, down: 'הפוך', matched: 'נמצא זוג',
      fishCount: function (n) { return n === 1 ? 'דג אחד' : n + ' דגים'; },
      animals: { cat: 'חתול', fox: 'שועל', owl: 'ינשוף', bear: 'דוב', rabbit: 'ארנב', frog: 'צפרדע' },
      cell: function (i, name) { return 'תמונה ' + (i + 1) + ', ' + name; }
    }
  };

  var state = { lang: loadLang(), game: '', pairs: null, level: 'easy', count: null, odd: null, msg: '', msgOk: false, picked: -1 };
  var app = document.getElementById('app');
  var settleTimer = 0;

  function loadLang() {
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* blocked */ }
    if (saved === 'en' || saved === 'he') return saved;
    return /^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en';
  }
  function t(key) { return I18N[state.lang][key]; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function animal(name, size) {
    return '<svg class="mark" width="' + size + '" height="' + size + '" viewBox="2 -14 96 108" aria-hidden="true"><g fill="' + COLORS[name] + '">' + EARS[name] +
      '<ellipse cx="50" cy="56" rx="40" ry="34"/></g><circle cx="35" cy="54" r="4.6" fill="#fff"/><circle cx="65" cy="54" r="4.6" fill="#fff"/><circle cx="35" cy="54" r="2" fill="#0F172A"/><circle cx="65" cy="54" r="2" fill="#0F172A"/></svg>';
  }
  function paw(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-hidden="true" fill="#9AA9C7"><ellipse cx="50" cy="66" rx="22" ry="18"/><ellipse cx="24" cy="42" rx="9" ry="12"/><ellipse cx="42" cy="28" rx="9" ry="12"/><ellipse cx="60" cy="28" rx="9" ry="12"/><ellipse cx="78" cy="42" rx="9" ry="12"/></svg>';
  }
  function fish(color) {
    return '<svg class="fish" width="64" height="40" viewBox="0 0 64 40" aria-hidden="true"><ellipse cx="26" cy="20" rx="22" ry="14" fill="' + color + '"/><path d="M44 20 L62 6 L62 34Z" fill="' + color + '"/><circle cx="14" cy="16" r="3.2" fill="#fff"/><circle cx="14" cy="16" r="1.5" fill="#0F172A"/></svg>';
  }
  var FISH = ['#E8743B', '#3B82C4', '#E0B13A', '#4FA37A'];

  function homeBtn() { return '<button type="button" class="ghost wide" data-act="home">' + esc(t('home')) + '</button>'; }
  function feedback() { return state.msg ? '<p class="banner ' + (state.msgOk ? 'ok' : 'soft') + ' big" role="status">' + esc(state.msg) + '</p>' : ''; }

  function viewHome() {
    var rows = [['pairs', 'bear'], ['count', 'frog'], ['odd', 'owl']].map(function (g) {
      return '<button type="button" class="row" data-game="' + g[0] + '">' + animal(g[1], 52) + '<span><b>' + esc(t('games')[g[0]]) + '</b><small>' + esc(t('hints')[g[0]]) + '</small></span></button>';
    }).join('');
    return '<h1>' + esc(t('title')) + '</h1><p class="lead">' + esc(t('lead')) + '</p><div class="rows">' + rows + '</div><p class="small mute">' + esc(t('grownups')) + '</p>';
  }

  function viewPairs() {
    var g = state.pairs;
    var levels = Object.keys(G.LEVELS).map(function (k) { return '<button type="button" class="ghost" data-level="' + k + '" aria-pressed="' + (state.level === k) + '">' + esc(t('levels')[k]) + '</button>'; }).join('');
    var cols = g.cards.length <= 6 ? 3 : 4;
    var cards = g.cards.map(function (c, i) {
      var shown = c.up || c.matched;
      var label = t('card')(i, shown ? t('animals')[c.animal] : t('down')) + (c.matched ? ', ' + t('matched') : '');
      return '<button type="button" class="card-tile' + (shown ? ' up' : '') + (c.matched ? ' matched' : '') + '" data-card="' + c.id + '" aria-label="' + esc(label) + '"' + (c.matched || g.done ? ' disabled' : '') + '>' + (shown ? animal(c.animal, 56) : paw(44)) + '</button>';
    }).join('');
    return '<h1>' + esc(t('games').pairs) + '</h1><p class="lead">' + esc(t('hints').pairs) + '</p>' +
      '<div class="levels">' + levels + '</div><p class="small mute" aria-live="polite">' + esc(t('tries')(g.tries)) + '</p>' +
      '<div class="grid" style="--cols:' + cols + '">' + cards + '</div>' +
      (g.done ? '<p class="banner ok big" role="status">' + esc(t('wonTries')(g.tries)) + '</p><div class="actions"><button type="button" class="wide" data-act="pairs-again">' + esc(t('again')) + '</button>' + homeBtn() + '</div>' : '<div class="actions">' + homeBtn() + '</div>');
  }

  function viewCount() {
    var r = state.count, fishes = '';
    for (var i = 0; i < r.n; i++) fishes += fish(FISH[i % FISH.length]);
    var opts = r.options.map(function (o) { return '<button type="button" class="ghost num" data-num="' + o + '" aria-pressed="' + (state.picked === o) + '">' + o + '</button>'; }).join('');
    var solved = state.msgOk;
    return '<h1>' + esc(t('games').count) + '</h1><p class="lead">' + esc(t('hints').count) + '</p>' +
      '<div class="pond" role="img" aria-label="' + esc(t('fishCount')(r.n)) + '">' + fishes + '</div>' +
      '<div class="nums">' + opts + '</div>' + feedback() +
      '<div class="actions">' + (solved ? '<button type="button" class="wide" data-act="count-next">' + esc(t('next')) + '</button>' : '') + homeBtn() + '</div>';
  }

  function viewOdd() {
    var r = state.odd;
    var cells = r.cells.map(function (a, i) {
      return '<button type="button" class="card-tile up' + (state.picked === i ? (state.msgOk ? ' matched' : '') : '') + '" data-cell="' + i + '" aria-label="' + esc(t('cell')(i, t('animals')[a])) + '">' + animal(a, 64) + '</button>';
    }).join('');
    var solved = state.msgOk;
    return '<h1>' + esc(t('games').odd) + '</h1><p class="lead">' + esc(t('hints').odd) + '</p>' +
      '<div class="grid" style="--cols:2">' + cells + '</div>' + feedback() +
      '<div class="actions">' + (solved ? '<button type="button" class="wide" data-act="odd-next">' + esc(t('next')) + '</button>' : '') + homeBtn() + '</div>';
  }

  function render() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'he' ? 'rtl' : 'ltr';
    document.title = t('title') + ' — Soycatory';
    var toggle = document.getElementById('lang-toggle');
    toggle.textContent = t('otherLang'); toggle.setAttribute('lang', state.lang === 'he' ? 'en' : 'he');
    document.getElementById('brand-title').textContent = t('title');
    document.getElementById('credit').textContent = t('credit');
    app.innerHTML = state.game === 'pairs' ? viewPairs() : state.game === 'count' ? viewCount() : state.game === 'odd' ? viewOdd() : viewHome();
  }
  function clearTimer() { if (settleTimer) { clearTimeout(settleTimer); settleTimer = 0; } }
  function start(game) {
    clearTimer(); state.game = game; state.msg = ''; state.msgOk = false; state.picked = -1;
    if (game === 'pairs') state.pairs = G.newPairs(state.level);
    if (game === 'count') state.count = G.countRound();
    if (game === 'odd') state.odd = G.oddRound();
    render(); window.scrollTo(0, 0);
  }

  app.addEventListener('click', function (e) {
    var el = e.target.closest('button'); if (!el) return;
    if (el.dataset.game) return start(el.dataset.game);
    if (el.dataset.level) { state.level = el.dataset.level; return start('pairs'); }
    if (el.dataset.card != null) {
      clearTimer();
      state.pairs = G.flip(state.pairs, Number(el.dataset.card));
      render();
      /* A wrong pair is turned back over after a moment, or at the next tap. No sound, no penalty. */
      if (state.pairs.pending) settleTimer = setTimeout(function () { state.pairs = G.settle(state.pairs); render(); settleTimer = 0; }, 1100);
      return;
    }
    if (el.dataset.num) {
      var pick = Number(el.dataset.num); state.picked = pick;
      if (G.countCheck(state.count, pick)) { state.msg = t('yesCount')(pick); state.msgOk = true; } else { state.msg = t('no'); state.msgOk = false; }
      return render();
    }
    if (el.dataset.cell != null) {
      var idx = Number(el.dataset.cell); state.picked = idx;
      if (G.oddCheck(state.odd, idx)) { state.msg = t('yes'); state.msgOk = true; } else { state.msg = t('no'); state.msgOk = false; }
      return render();
    }
    switch (el.dataset.act) {
      case 'home': clearTimer(); state.game = ''; state.msg = ''; render(); window.scrollTo(0, 0); return;
      case 'pairs-again': return start('pairs');
      case 'count-next': return start('count');
      case 'odd-next': return start('odd');
    }
  });
  document.getElementById('lang-toggle').addEventListener('click', function () {
    state.lang = state.lang === 'he' ? 'en' : 'he';
    try { localStorage.setItem(LANG_KEY, state.lang); } catch (e) { /* blocked */ }
    render();
  });
  document.getElementById('brand').addEventListener('click', function () { clearTimer(); state.game = ''; state.msg = ''; render(); });

  render();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(function () { /* optional */ });
})();
