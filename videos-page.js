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
      next: 'Coming ideas', nextNote: 'Not made yet. Each one needs facts we can point to first.',
      countNote: 'We count how far each video gets watched: whether you start it, reach each quarter, finish, or where you stop. No cookies, no ID, nothing that says who you are. If your browser sends Do Not Track, we count nothing.',
      commentTitle: 'Comment on this moment', commentLabel: 'Your comment', commentEmail: 'Your email (optional, only so we can write back)', commentSend: 'Send comment',
      commentAt: function (s) { return 'It will be attached to ' + s + ' in the video.'; }, commentThanks: 'Thank you. We read every comment.', commentShort: 'Write at least a few words.', badEmail: 'That email does not look right.', failed: 'Could not send that just now. Please try again later.',
      commentKeep: 'Comments are not shown on the site. We keep the comment, the moment, and the email only if you give it.'
    },
    he: {
      otherLang: 'English', promise: 'בלי חשבון, בלי פרסומות, בלי מעקב.', title: 'סויה מסביר',
      lead: 'סרטונים קצרים שבהם סויה החתול מסביר בינה מלאכותית ותוכנה במילים פשוטות. כתוביות באנגלית ובעברית.',
      read: 'קוראים את המילים', back: 'כל האפליקציות', minutes: function (s) { return Math.round(s) + ' שניות'; },
      note: 'סויה הוא חתול מצויר. הקול סינתטי (נוצר על ידי מחשב), והמילים נכתבו על ידי צוות Soycatory.',
      credit: 'קול: Piper להמרת טקסט לדיבור, הקול "joe" (נחלת הכלל, CC0). תמונה ואיור: Soycatory.',
      captions: 'מפעילים כתוביות בנגן; יש גם באנגלית וגם בעברית.',
      next: 'רעיונות לבאות', nextNote: 'עוד לא נעשו. לכל אחד צריך קודם עובדות שאפשר להצביע עליהן.',
      countNote: 'אנחנו סופרים עד איפה כל סרטון נצפה: אם התחלתם אותו, הגעתם לכל רבע, סיימתם, או איפה עצרתם. בלי עוגיות, בלי מזהה, שום דבר שאומר מי אתם. אם הדפדפן שלכם שולח "אל תעקוב", לא נספור כלום.',
      commentTitle: 'מגיבים על הרגע הזה', commentLabel: 'התגובה שלכם', commentEmail: 'המייל שלכם (לא חובה, רק כדי שנוכל לכתוב בחזרה)', commentSend: 'שולחים תגובה',
      commentAt: function (s) { return 'היא תצורף ל־' + s + ' בסרטון.'; }, commentThanks: 'תודה. אנחנו קוראים כל תגובה.', commentShort: 'צריך לכתוב לפחות כמה מילים.', badEmail: 'המייל הזה לא נראה תקין.', failed: 'לא הצלחנו לשלוח כרגע. נסו שוב מאוחר יותר.',
      commentKeep: 'התגובות לא מוצגות באתר. אנחנו שומרים את התגובה, את הרגע, ואת המייל רק אם נתתם אותו.'
    }
  };
  var lang = (function () {
    var s = null; try { s = localStorage.getItem(LANG_KEY); } catch (e) { /* blocked */ }
    if (s === 'en' || s === 'he') return s;
    return /^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en';
  })();
  function t(k) { return I18N[lang][k]; }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* Counting is off unless a receiver address is set, and off for anyone who sends Do Not Track or Global Privacy Control. */
  function counting() {
    return !!(window.SOYA_WAITLIST && window.SOYA_WAITLIST.url) && navigator.doNotTrack !== '1' && window.doNotTrack !== '1' && navigator.globalPrivacyControl !== true;
  }
  function canSend() { return !!(window.SOYA_WAITLIST && window.SOYA_WAITLIST.url); }
  function comment(v) {
    if (!canSend()) return '';
    return '<form class="comment-form" data-video="' + esc(v.slug) + '" novalidate><h3>' + esc(t('commentTitle')) + '</h3><p class="small mute at"></p>' +
      '<label for="c-' + esc(v.slug) + '">' + esc(t('commentLabel')) + '</label><textarea id="c-' + esc(v.slug) + '" maxlength="300" autocomplete="off"></textarea>' +
      '<label for="e-' + esc(v.slug) + '">' + esc(t('commentEmail')) + '</label><input type="email" id="e-' + esc(v.slug) + '" maxlength="254" autocomplete="email" dir="ltr">' +
      '<div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div><p class="banner soft" role="status" hidden></p>' +
      '<button type="submit" class="ghost wide">' + esc(t('commentSend')) + '</button><p class="small mute">' + esc(t('commentKeep')) + '</p></form>';
  }
  function post(fields) {
    var body = new URLSearchParams(); Object.keys(fields).forEach(function (k) { body.set(k, fields[k]); });
    var url = window.SOYA_WAITLIST.url;
    if (fields.kind === 'metric' && navigator.sendBeacon && fields.event === 'leave') { try { if (navigator.sendBeacon(url, body)) return Promise.resolve(); } catch (e) { /* fall through */ } }
    return fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  }
  function clock(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  /* Watch counting for one video element. A random id made for this visit only, held in memory and never stored, ties a few
     events together; closing the page forgets it. */
  function watch(el, slug) {
    var id = Math.random().toString(36).slice(2, 10), sent = {}, started = false, finished = false;
    function send(event, extra) {
      if (!counting()) return;
      var d = isFinite(el.duration) ? Math.round(el.duration) : 0;
      post(Object.assign({ kind: 'metric', video: slug, view: id, event: event, position: Math.round(el.currentTime), duration: d, lang: lang }, extra || {}));
    }
    function once(event) { if (!sent[event]) { sent[event] = true; send(event); } }
    el.addEventListener('play', function () { if (!started) { started = true; once('play'); } });
    el.addEventListener('timeupdate', function () {
      if (!el.duration) return; var f = el.currentTime / el.duration;
      if (f >= .25) once('q25'); if (f >= .5) once('q50'); if (f >= .75) once('q75');
    });
    el.addEventListener('ended', function () { finished = true; once('q100'); });
    el.addEventListener('pause', function () { if (started && !finished && !el.ended) send('pause'); });
    el.addEventListener('seeked', function () { if (started) send('seek'); });
    function leave() { if (started && !finished && !sent.leave) { sent.leave = true; send('leave'); } }
    window.addEventListener('pagehide', leave);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') leave(); });
    // The comment form for this video notes where the viewer was when they began writing.
    var form = el.closest('.video') && el.closest('.video').querySelector('.comment-form');
    if (form) {
      var at = 0, note = form.querySelector('.at'), box = form.querySelector('textarea');
      function mark() { at = Math.round(el.currentTime); note.textContent = t('commentAt')(clock(at)); }
      mark(); el.addEventListener('timeupdate', function () { if (document.activeElement !== box && !box.value) mark(); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var trap = form.querySelector('input[name=website]'), msg = form.querySelector('.banner'), text = box.value.trim(), mail = form.querySelector('input[type=email]').value.trim();
        if (trap && trap.value) return;
        function say(m) { msg.hidden = false; msg.textContent = m; }
        if (text.length < 3) return say(t('commentShort'));
        if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return say(t('badEmail'));
        post({ kind: 'comment', video: slug, position: at, text: text.slice(0, 300), email: mail, lang: lang, website: '' }).then(function () { box.value = ''; say(t('commentThanks')); }, function () { say(t('failed')); });
      });
    }
  }

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
        comment(v) +
        '<details><summary>' + esc(t('read')) + '</summary><div class="words">' + words + '</div></details>' +
        '<p class="small mute">' + esc(t('note')) + ' ' + esc(t('credit')) + '</p></article>';
    }).join('');
    if (ideas.length) html += '<h2>' + esc(t('next')) + '</h2><section class="card"><ul class="plain">' + ideas.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><p class="small mute">' + esc(t('nextNote')) + '</p></section>';
    html += '<div class="actions"><a class="button wide" href="./">' + esc(t('back')) + '</a></div>';
    if (counting()) html += '<p class="small mute">' + esc(t('countNote')) + '</p>';
    document.getElementById('app').innerHTML = html;
    vids.forEach(function (v, i) { var el = document.querySelectorAll('#app video')[i]; if (el) watch(el, v.slug); });
  }
  document.getElementById('lang-toggle').addEventListener('click', function () {
    lang = lang === 'he' ? 'en' : 'he';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* blocked */ }
    render();
  });
  render();
})();
