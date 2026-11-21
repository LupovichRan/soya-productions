/* Soya's AI week: shows the issues in newsletter.js. Counts which items people read more of, which sources they open,
   what they find useful and how far down they get. Counting follows the same rules as the videos page: only with a
   receiver address, no cookies, nothing stored, a random number for one visit held in memory, and nothing at all for
   anyone whose browser sends Do Not Track or Global Privacy Control. The page says what is counted. */
(function () {
  'use strict';

  var LANG_KEY = 'soycatory-lang';
  var I18N = {
    en: {
      otherLang: 'עברית', promise: 'No accounts, no ads. Plain words.', title: "Soya's AI week",
      lead: 'What happened in AI this week, in plain words, with a link to where each item came from.',
      tldr: 'In short', more: 'Read more', less: 'Show less', source: function (s) { return 'Open the source: ' + s; },
      confirmed: 'Confirmed', reported: 'Reported',
      statusNote: 'Confirmed means a primary source or two independent reports. Reported means one report or a roundup; check the source.',
      useful: 'Was this useful?', yes: 'Yes', no: 'No', thanks: 'Thanks, noted.',
      topics: { money: 'Money', chips: 'Chips', rules: 'Rules', agents: 'Agents', models: 'Models', open: 'Open models' },
      ask: 'What should Soya look into next week?', askLabel: 'A topic or a question', askEmail: 'Your email (optional, only so we can write back)', askSend: 'Send',
      askThanks: 'Thank you. We read every one.', askShort: 'Write at least a few words.', badEmail: 'That email does not look right.', failed: 'Could not send that just now. Please try again later.',
      askKeep: 'We keep what you write and the email only if you give it. Nothing is shown on the site.',
      older: 'Earlier issues', back: 'All apps',
      countNote: 'We count which items get opened with "Read more", which sources get opened, the Yes and No answers, and how far down the page people get. No cookies, no ID, nothing that says who you are. If your browser sends Do Not Track, we count nothing.',
      advice: 'Not investment advice. Soycatory is built with Claude, made by Anthropic.'
    },
    he: {
      otherLang: 'English', promise: 'בלי חשבון, בלי פרסומות. מילים פשוטות.', title: 'השבוע של סויה בבינה מלאכותית',
      lead: 'מה קרה השבוע בבינה מלאכותית, במילים פשוטות, עם קישור למקור של כל פריט.',
      tldr: 'בקצרה', more: 'עוד', less: 'פחות', source: function (s) { return 'פותחים את המקור: ' + s; },
      confirmed: 'מאומת', reported: 'דיווח',
      statusNote: 'מאומת: מקור ראשוני או שני דיווחים בלתי תלויים. דיווח: דיווח אחד או סיכום; כדאי לבדוק את המקור.',
      useful: 'זה עזר?', yes: 'כן', no: 'לא', thanks: 'תודה, רשמנו.',
      topics: { money: 'כסף', chips: 'שבבים', rules: 'כללים', agents: 'סוכנים', models: 'מודלים', open: 'מודלים פתוחים' },
      ask: 'על מה סויה יבדוק בשבוע הבא?', askLabel: 'נושא או שאלה', askEmail: 'המייל שלכם (לא חובה, רק כדי שנוכל לכתוב בחזרה)', askSend: 'שולחים',
      askThanks: 'תודה. אנחנו קוראים כל אחד.', askShort: 'צריך לכתוב לפחות כמה מילים.', badEmail: 'המייל הזה לא נראה תקין.', failed: 'לא הצלחנו לשלוח כרגע. נסו שוב מאוחר יותר.',
      askKeep: 'אנחנו שומרים את מה שכתבתם, ואת המייל רק אם נתתם אותו. שום דבר לא מוצג באתר.',
      older: 'גיליונות קודמים', back: 'כל האפליקציות',
      countNote: 'אנחנו סופרים אילו פריטים נפתחים ב"עוד", אילו מקורות נפתחים, את תשובות הכן והלא, ועד כמה רחוק בעמוד אנשים מגיעים. בלי עוגיות, בלי מזהה, שום דבר שאומר מי אתם. אם הדפדפן שלכם שולח "אל תעקוב", לא נספור כלום.',
      advice: 'זה לא ייעוץ השקעות. Soycatory נבנית עם Claude, ש־Anthropic מייצרת.'
    }
  };
  var lang = (function () {
    var s = null; try { s = localStorage.getItem(LANG_KEY); } catch (e) { /* blocked */ }
    if (s === 'en' || s === 'he') return s;
    return /^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en';
  })();
  function t(k) { return I18N[lang][k]; }
  function L(o) { return (o && (o[lang] || o.en)) || ''; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function boxDir() { return lang === 'he' ? 'rtl' : 'ltr'; }

  function canSend() { return !!(window.SOYA_WAITLIST && window.SOYA_WAITLIST.url); }
  function counting() { return canSend() && navigator.doNotTrack !== '1' && window.doNotTrack !== '1' && navigator.globalPrivacyControl !== true; }
  var visit = Math.random().toString(36).slice(2, 10);   // memory only; forgotten when the page closes
  function post(fields, beacon) {
    var body = new URLSearchParams(); Object.keys(fields).forEach(function (k) { body.set(k, fields[k]); });
    var url = window.SOYA_WAITLIST.url;
    if (beacon && navigator.sendBeacon) { try { if (navigator.sendBeacon(url, body)) return Promise.resolve(); } catch (e) { /* fall through */ } }
    return fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  }
  var sent = {};
  function count(issue, event, item, pos, beacon) {
    if (!counting()) return;
    post({ kind: 'read', issue: issue, event: event, item: item || '', position: pos == null ? '' : pos, view: visit, lang: lang }, beacon);
  }
  function countOnce(issue, event, item, pos) { var k = issue + '|' + event + '|' + (item || ''); if (sent[k]) return; sent[k] = true; count(issue, event, item, pos); }

  var open = {};   // which items are expanded, so a language switch keeps them open
  var params = new URLSearchParams(location.search);
  var issues = window.SOYA_NEWSLETTER || [];
  var current = issues.filter(function (x) { return x.issue === params.get('issue'); })[0] || issues[0];

  function item(it, i, issue) {
    var isOpen = !!open[it.id];
    return '<article class="card news-item" data-item="' + esc(it.id) + '" data-pos="' + (i + 1) + '">' +
      '<p class="meta"><span class="tag">' + esc(t('topics')[it.topic] || it.topic) + '</span> <span class="status ' + esc(it.status) + '">' + esc(t(it.status)) + '</span></p>' +
      '<h2>' + esc(L(it.title)) + '</h2><p>' + esc(L(it.line)) + '</p>' +
      '<div class="more"' + (isOpen ? '' : ' hidden') + '><p>' + esc(L(it.more)) + '</p>' +
        '<p><a href="' + esc(it.url) + '" target="_blank" rel="noopener" data-source="' + esc(it.id) + '">' + esc(t('source')(it.source)) + '</a></p>' +
        '<div class="useful" role="group" aria-label="' + esc(t('useful')) + '"><span class="small">' + esc(t('useful')) + '</span> ' +
          '<button type="button" class="ghost" data-useful="yes">' + esc(t('yes')) + '</button> <button type="button" class="ghost" data-useful="no">' + esc(t('no')) + '</button>' +
          '<span class="small mute" role="status"></span></div></div>' +
      '<button type="button" class="ghost wide" data-more="' + esc(it.id) + '" aria-expanded="' + isOpen + '">' + esc(isOpen ? t('less') : t('more')) + '</button></article>';
  }

  function askForm() {
    if (!canSend()) return '';
    return '<form class="card comment-form" id="ask" novalidate><h2>' + esc(t('ask')) + '</h2>' +
      '<label for="ask-text">' + esc(t('askLabel')) + '</label><textarea id="ask-text" maxlength="300" autocomplete="off" dir="' + boxDir() + '"></textarea>' +
      '<label for="ask-email">' + esc(t('askEmail')) + '</label><input type="email" id="ask-email" maxlength="254" autocomplete="email" dir="ltr">' +
      '<div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div><p class="banner soft" role="status" hidden></p>' +
      '<button type="submit" class="ghost wide">' + esc(t('askSend')) + '</button><p class="small mute">' + esc(t('askKeep')) + '</p></form>';
  }

  function render() {
    document.documentElement.lang = lang; document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.title = t('title') + ' — Soycatory';
    var tg = document.getElementById('lang-toggle'); tg.textContent = t('otherLang'); tg.setAttribute('lang', lang === 'he' ? 'en' : 'he');
    document.getElementById('promise').textContent = t('promise');
    var app = document.getElementById('app');
    if (!current) { app.innerHTML = '<h1>' + esc(t('title')) + '</h1>'; return; }
    var html = '<h1>' + esc(t('title')) + '</h1><p class="meta">' + esc(L(current.week)) + '</p><p class="lead">' + esc(t('lead')) + '</p>' +
      '<section class="card"><h2>' + esc(t('tldr')) + '</h2><ul class="plain">' + (current.tldr[lang] || current.tldr.en).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>' +
      current.items.map(function (it, i) { return item(it, i, current.issue); }).join('') +
      '<p class="small mute" id="news-end">' + esc(t('statusNote')) + ' ' + esc(t('advice')) + '</p>' + askForm();
    var older = issues.filter(function (x) { return x !== current; });
    if (older.length) html += '<h2>' + esc(t('older')) + '</h2><section class="card"><ul class="plain">' + older.map(function (x) { return '<li><a href="?issue=' + encodeURIComponent(x.issue) + '">' + esc(L(x.week)) + '</a></li>'; }).join('') + '</ul></section>';
    html += '<div class="actions"><a class="button wide" href="./">' + esc(t('back')) + '</a></div>';
    if (counting()) html += '<p class="small mute">' + esc(t('countNote')) + '</p>';
    app.innerHTML = html;
    wire();
  }

  var deepest = 0, observer = null;
  function wire() {
    var issue = current.issue, app = document.getElementById('app');
    countOnce(issue, 'view');
    app.querySelectorAll('[data-more]').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = b.closest('.news-item'), box = card.querySelector('.more'), id = b.getAttribute('data-more'), pos = card.getAttribute('data-pos');
        open[id] = box.hidden; box.hidden = !box.hidden;
        b.setAttribute('aria-expanded', String(!box.hidden)); b.textContent = box.hidden ? t('more') : t('less');
        if (!box.hidden) countOnce(issue, 'more', id, pos);
      });
    });
    app.querySelectorAll('[data-source]').forEach(function (a) {
      a.addEventListener('click', function () { var card = a.closest('.news-item'); count(issue, 'source', a.getAttribute('data-source'), card.getAttribute('data-pos'), true); });
    });
    app.querySelectorAll('[data-useful]').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = b.closest('.news-item'), id = card.getAttribute('data-item'), k = issue + '|useful|' + id;
        if (!sent[k]) { sent[k] = true; count(issue, 'useful-' + b.getAttribute('data-useful'), id, card.getAttribute('data-pos')); }
        card.querySelectorAll('[data-useful]').forEach(function (x) { x.disabled = true; });
        card.querySelector('.useful [role=status]').textContent = ' ' + t('thanks');
      });
    });
    // How far down people read: each item counts once when half of it has been on screen.
    if (observer) observer.disconnect();
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          if (el.id === 'news-end') { countOnce(issue, 'end'); return; }
          var pos = Number(el.getAttribute('data-pos')); deepest = Math.max(deepest, pos);
          countOnce(issue, 'seen', el.getAttribute('data-item'), pos);
        });
      }, { threshold: 0.5 });
      app.querySelectorAll('.news-item, #news-end').forEach(function (el) { observer.observe(el); });
    }
    var form = document.getElementById('ask');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var trap = form.querySelector('input[name=website]'), msg = form.querySelector('.banner'), box = form.querySelector('textarea'), text = box.value.trim(), mail = form.querySelector('input[type=email]').value.trim();
      if (trap && trap.value) return;
      function say(m) { msg.hidden = false; msg.textContent = m; }
      if (text.length < 3) return say(t('askShort'));
      if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return say(t('badEmail'));
      post({ kind: 'suggest', issue: issue, text: text.slice(0, 300), email: mail, lang: lang, website: '' }).then(function () { box.value = ''; say(t('askThanks')); }, function () { say(t('failed')); });
    });
  }
  var left = false;
  function leave() { if (left || !current) return; left = true; count(current.issue, 'leave', '', deepest, true); }
  window.addEventListener('pagehide', leave);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') leave(); });

  document.getElementById('lang-toggle').addEventListener('click', function () {
    lang = lang === 'he' ? 'en' : 'he';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* blocked */ }
    render();
  });
  render();
})();
