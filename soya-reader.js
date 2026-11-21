/* "Soya reads it to you": a site-wide reader. Soya's face sits at the bottom with his mouth moving while the browser's
   own voice reads the page, paragraph by paragraph (the one being read is highlighted), or only the text you selected.
   Pause, stop, and settings: voice, speed and pitch. Started from the accessibility menu (a11y.js) or by a page.
   Settings are stored on this device only (localStorage "soya-voice"); nothing is sent. */
(function () {
  'use strict';
  var KEY = 'soya-voice', root = document.documentElement;
  var T = {
    en: { reading: 'Soya is reading', paused: 'Paused', pause: 'Pause', resume: 'Go on', stop: 'Stop', settings: 'Voice settings', voice: 'Voice', auto: 'Best for this language', speed: 'Speed', pitch: 'Pitch', test: 'Try it', sample: 'Hi, I am Soya. This is how I sound.', none: 'This browser cannot read aloud.', close: 'Close', page: 'Soya, read this page', selection: 'Soya, read what I selected' },
    he: { reading: 'סויה מקריא', paused: 'בהפסקה', pause: 'הפסקה', resume: 'ממשיכים', stop: 'עצירה', settings: 'הגדרות קול', voice: 'קול', auto: 'הכי טוב לשפה הזאת', speed: 'מהירות', pitch: 'גובה', test: 'לנסות', sample: 'היי, אני סויה. ככה אני נשמע.', none: 'הדפדפן הזה לא יודע להקריא.', close: 'סגירה', page: 'סויה, תקריא את העמוד', selection: 'סויה, תקריא את מה שסימנתי' },
    fr: { reading: 'Soya lit', paused: 'En pause', pause: 'Pause', resume: 'Continuer', stop: 'Arrêter', settings: 'Réglages de la voix', voice: 'Voix', auto: 'La meilleure pour cette langue', speed: 'Vitesse', pitch: 'Hauteur', test: 'Essayer', sample: 'Salut, je suis Soya. Voilà ma voix.', none: 'Ce navigateur ne sait pas lire à voix haute.', close: 'Fermer', page: 'Soya, lis cette page', selection: 'Soya, lis ce que j\'ai sélectionné' }
  };
  var CODE = { en: 'en-US', he: 'he-IL', fr: 'fr-FR' };
  function lang() { var l = (root.lang || 'en').slice(0, 2); return T[l] ? l : 'en'; }
  function t(k) { return T[lang()][k]; }
  var P = { voice: '', rate: 0.95, pitch: 1.15 };
  try { var s = JSON.parse(localStorage.getItem(KEY) || '{}'); if (typeof s.voice === 'string') P.voice = s.voice; if (s.rate > 0) P.rate = +s.rate; if (s.pitch > 0) P.pitch = +s.pitch; } catch (e) { /* defaults */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* fine */ } }
  function can() { return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window; }
  function voicesFor(code) { var base = code.slice(0, 2); return ((can() && speechSynthesis.getVoices()) || []).filter(function (v) { return (v.lang || '').toLowerCase().indexOf(base) === 0; }); }
  function pickVoice(code) {
    var vs = voicesFor(code);
    var chosen = vs.filter(function (v) { return v.name === P.voice; })[0]; if (chosen) return chosen;
    var male = vs.filter(function (v) { return /male|david|daniel|thomas|asaf|alex|fred|guy|paul|henri|nicolas/i.test(v.name) && !/female/i.test(v.name); });
    return male[0] || vs[0] || null;
  }

  /* Soya's face, drawn simply so the mouth can open and close. */
  var FACE = '<svg viewBox="0 0 100 100" width="64" height="64" aria-hidden="true"><path d="M18 42 L22 8 L44 28 Z M82 42 L78 8 L56 28 Z" fill="#19151c" stroke="#5b5064" stroke-width="2"/><path d="M24 34 L25 16 L38 28 Z M76 34 L75 16 L62 28 Z" fill="#ff9fbf"/><ellipse cx="50" cy="56" rx="38" ry="34" fill="#19151c" stroke="#5b5064" stroke-width="2"/>' +
    '<g class="sr-eyes"><ellipse cx="36" cy="50" rx="9" ry="10" fill="#b9e84a"/><ellipse cx="64" cy="50" rx="9" ry="10" fill="#b9e84a"/><ellipse cx="36" cy="51" rx="3.5" ry="7.5" fill="#07060a"/><ellipse cx="64" cy="51" rx="3.5" ry="7.5" fill="#07060a"/><circle cx="39" cy="46" r="2.4" fill="#fff"/><circle cx="67" cy="46" r="2.4" fill="#fff"/></g>' +
    '<path d="M46 64 L54 64 L50 69 Z" fill="#2e2129" stroke="#8d6f7d" stroke-width="1"/><path class="sr-shut" d="M42 73 Q46 77 50 72 Q54 77 58 73" stroke="#a89cb4" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse class="sr-open" cx="50" cy="76" rx="6" ry="7" fill="#ff7aa0" stroke="#a89cb4" stroke-width="1.5"/>' +
    '<path d="M20 62 L2 58 M20 67 L3 70 M80 62 L98 58 M80 67 L97 70" stroke="#f6f6f6" stroke-width="1.6" stroke-linecap="round"/></svg>';

  var bar, faceEl, label, pauseBtn, queue = [], idx = 0, speaking = false, paused = false, mouth = null, current = null, styleDone = false;
  function style() {
    if (styleDone) return; styleDone = true;
    var st = document.createElement('style');
    st.textContent = '.sr-bar{position:fixed;z-index:45;left:50%;transform:translateX(-50%);bottom:calc(10px + env(safe-area-inset-bottom,0px));width:min(94vw,460px);display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:20px;background:#FFF3D1;color:#1B2032;box-shadow:0 8px 26px rgba(0,0,0,.4);font:500 16px/1.3 system-ui,-apple-system,"Segoe UI",Arial,sans-serif}' +
      '.sr-bar[hidden]{display:none}.sr-face{flex:none;line-height:0}.sr-face .sr-open{display:none}.sr-face.talk .sr-open{display:inline}.sr-face.talk .sr-shut{display:none}.sr-face.blink .sr-eyes{transform:scaleY(.1);transform-origin:50% 50%;transform-box:fill-box}' +
      '.sr-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}' +
      '.sr-bar button{flex:none;min-height:48px;min-width:48px;padding:6px 10px;border-radius:14px;border:2px solid #1B2032;background:transparent;color:#1B2032;font:inherit;font-weight:700;cursor:pointer}' +
      '.sr-bar button:focus-visible,.sr-set button:focus-visible,.sr-set select:focus-visible,.sr-set input:focus-visible{outline:3px solid #2B5FD9;outline-offset:2px}' +
      '.soya-reading{outline:3px solid #FFC94D!important;outline-offset:4px;border-radius:6px;background:rgba(255,201,77,.12)!important}' +
      '.sr-set{border:0;border-radius:18px;padding:16px;width:min(92vw,380px);background:#fff;color:#111827;font:16px/1.5 system-ui,-apple-system,"Segoe UI",Arial,sans-serif}' +
      '.sr-set::backdrop{background:rgba(5,8,18,.6)}.sr-set h2{margin:0 0 10px;font-size:20px;color:#111827}.sr-set label{display:block;font-weight:600;margin-top:10px}' +
      '.sr-set select,.sr-set input[type=range]{width:100%;min-height:48px;font:inherit}.sr-set select{border:2px solid #9CA3AF;border-radius:12px;padding:6px 8px;background:#fff;color:#111827}' +
      '.sr-set .row{display:flex;gap:8px;justify-content:space-between;margin-top:14px}.sr-set button{min-height:48px;padding:6px 14px;border-radius:12px;border:2px solid #9CA3AF;background:#F3F4F6;color:#111827;font:inherit;font-weight:600;cursor:pointer}' +
      '@media (prefers-reduced-motion:reduce){.sr-face.blink .sr-eyes{transform:none}}@media print{.sr-bar{display:none!important}}';
    document.head.appendChild(st);
  }
  function ensureBar() {
    if (bar) { label.textContent = t('reading'); return; }
    style();
    bar = document.createElement('div'); bar.className = 'sr-bar'; bar.hidden = true; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', t('reading'));
    bar.innerHTML = '<span class="sr-face">' + FACE + '</span><span class="sr-label" aria-live="polite"></span><button type="button" class="sr-pause"></button><button type="button" class="sr-gear" aria-label="' + t('settings') + '" title="' + t('settings') + '">⚙</button><button type="button" class="sr-stop">' + t('stop') + '</button>';
    document.body.appendChild(bar);
    faceEl = bar.querySelector('.sr-face'); label = bar.querySelector('.sr-label'); pauseBtn = bar.querySelector('.sr-pause');
    pauseBtn.addEventListener('click', function () { if (paused) resume(); else pause(); });
    bar.querySelector('.sr-stop').addEventListener('click', stop);
    bar.querySelector('.sr-gear').addEventListener('click', openSettings);
    label.textContent = t('reading');
  }
  function talk(on) {
    clearInterval(mouth); if (!faceEl) return;
    if (!on) { faceEl.classList.remove('talk'); return; }
    var open = false; mouth = setInterval(function () { open = !open; faceEl.classList.toggle('talk', open); }, 170);
  }
  var blinkT = null;
  function blink() { if (faceEl && !matchMedia('(prefers-reduced-motion: reduce)').matches) { faceEl.classList.add('blink'); setTimeout(function () { if (faceEl) faceEl.classList.remove('blink'); }, 140); } blinkT = setTimeout(blink, 2500 + Math.random() * 3500); }

  function mark(el) { if (current) current.classList.remove('soya-reading'); current = el || null; if (current) { current.classList.add('soya-reading'); try { current.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); } catch (e) { /* fine */ } } }
  function next() {
    if (idx >= queue.length) { stop(); return; }
    var item = queue[idx++], u = new SpeechSynthesisUtterance(item.text), code = CODE[lang()], v = pickVoice(code);
    u.lang = code; if (v) u.voice = v; u.rate = P.rate; u.pitch = P.pitch;
    u.onstart = function () { talk(true); };
    u.onend = function () { talk(false); if (speaking && !paused) next(); };
    u.onerror = function (e) { talk(false); if (e && e.error === 'interrupted') return; if (speaking) next(); };
    mark(item.el); label.textContent = t('reading'); label.title = item.text.slice(0, 120);
    speechSynthesis.speak(u);
  }
  function start(items) {
    ensureBar();
    if (!can()) { bar.hidden = false; label.textContent = t('none'); pauseBtn.hidden = true; return false; }
    stop(true); queue = items.filter(function (x) { return x.text && x.text.trim(); }); idx = 0; if (!queue.length) return false;
    speaking = true; paused = false; pauseBtn.hidden = false; pauseBtn.textContent = t('pause'); bar.hidden = false;
    clearTimeout(blinkT); blink(); next(); return true;
  }
  function pause() { if (!speaking) return; paused = true; speechSynthesis.pause(); talk(false); pauseBtn.textContent = t('resume'); label.textContent = t('paused'); }
  function resume() { if (!speaking) return; paused = false; speechSynthesis.resume(); pauseBtn.textContent = t('pause'); label.textContent = t('reading'); if (!speechSynthesis.speaking) next(); }
  function stop(keep) {
    speaking = false; paused = false; if (can()) speechSynthesis.cancel(); talk(false); mark(null); clearTimeout(blinkT);
    if (bar && keep !== true) bar.hidden = true;
  }

  /* What to read on a page: headings, paragraphs and list items inside <main>, in order, skipping hidden parts. */
  function pageItems() {
    var main = document.querySelector('main') || document.body, out = [];
    main.querySelectorAll('h1,h2,h3,p,li,blockquote,figcaption,.bubble,.big,.body,.more').forEach(function (el) {
      if (el.closest('dialog,.sr-bar,.a11y-panel,[hidden],[aria-hidden=true],nav,button,.hp')) return;
      if (el.querySelector('p,li,h1,h2,h3')) return;   // read the inner blocks instead
      var r = el.getBoundingClientRect(); if (!r.width && !r.height) return;
      var text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim(); if (text.length < 2) return;
      out.push({ el: el, text: text });
    });
    return out;
  }
  function readPage() { return start(pageItems()); }
  function readSelection() { var s = String(window.getSelection ? window.getSelection() : '').trim(); return s ? start([{ el: null, text: s }]) : readPage(); }
  function readText(text) { return start([{ el: null, text: text }]); }

  var dlg;
  function openSettings() {
    style();
    if (!dlg) { dlg = document.createElement('dialog'); dlg.className = 'sr-set'; document.body.appendChild(dlg); dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); }); }
    var code = CODE[lang()], vs = voicesFor(code);
    dlg.setAttribute('dir', root.dir || 'ltr');
    dlg.innerHTML = '<h2>' + t('settings') + '</h2><label for="sr-voice">' + t('voice') + '</label><select id="sr-voice"><option value="">' + t('auto') + '</option>' +
      vs.map(function (v) { return '<option' + (v.name === P.voice ? ' selected' : '') + '>' + v.name.replace(/[<>&]/g, '') + '</option>'; }).join('') + '</select>' +
      '<label for="sr-rate">' + t('speed') + ' <output id="sr-rate-o">' + P.rate.toFixed(2) + '</output></label><input type="range" id="sr-rate" min="0.6" max="1.4" step="0.05" value="' + P.rate + '">' +
      '<label for="sr-pitch">' + t('pitch') + ' <output id="sr-pitch-o">' + P.pitch.toFixed(2) + '</output></label><input type="range" id="sr-pitch" min="0.7" max="1.6" step="0.05" value="' + P.pitch + '">' +
      '<div class="row"><button type="button" id="sr-test">' + t('test') + '</button><button type="button" id="sr-close">' + t('close') + '</button></div>';
    dlg.querySelector('#sr-voice').addEventListener('change', function (e) { P.voice = e.target.value; save(); });
    ['rate', 'pitch'].forEach(function (k) { var inp = dlg.querySelector('#sr-' + k); inp.addEventListener('input', function () { P[k] = +inp.value; dlg.querySelector('#sr-' + k + '-o').textContent = P[k].toFixed(2); save(); }); });
    dlg.querySelector('#sr-test').addEventListener('click', function () { readText(t('sample')); });
    dlg.querySelector('#sr-close').addEventListener('click', function () { dlg.close(); });
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  if (can() && speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = function () { /* voices load late on some browsers */ };
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') stop(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && speaking) stop(); });

  window.SoyaReader = { can: can, readPage: readPage, readSelection: readSelection, readText: readText, stop: stop, settings: openSettings, prefs: function () { return P; }, pickVoice: pickVoice, label: function (k) { return t(k); } };
})();
