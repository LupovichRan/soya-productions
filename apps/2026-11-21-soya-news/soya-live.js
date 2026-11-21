/* Live Soya: the cat from annabelle-games walks along the bottom of the page, sits, blinks, looks around, smiles,
   reacts to what the reader does, and reads stories aloud with his mouth moving (the browser's own voice).
   Ran asked for this on 2026-11-21. It stays still for anyone whose device asks for reduced motion, and the reader
   can switch it to "Calm" in settings. Nothing is stored except that choice (by app.js), and nothing is sent. */
(function () {
  'use strict';

  var HEAD = { sit: 'translate(100 92)', stand: 'translate(152 104) scale(.92)' };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var el, catBtn, svg, bubble, head, enabled = true, x = 0.82, facing = 1, timers = {}, speaking = false, mouthTimer = null, busy = false;

  function $(sel) { return svg ? svg.querySelectorAll(sel) : []; }
  function cls(add, remove) { if (!svg) return; (remove || []).forEach(function (c) { svg.classList.remove(c); }); (add || []).forEach(function (c) { svg.classList.add(c); }); }
  function later(name, fn, ms) { clearTimeout(timers[name]); timers[name] = setTimeout(fn, ms); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function moving() { return enabled && !reduced; }

  function setPose(p) {
    cls(['p-' + p], ['p-sit', 'p-stand', 'walking']);
    if (head) head.setAttribute('transform', HEAD[p] || HEAD.sit);
  }
  function face(dir) { facing = dir; if (svg) svg.style.transform = dir < 0 ? 'scaleX(-1)' : ''; }
  function place(f, ms) {
    if (!el) return;
    var w = window.innerWidth, size = el.offsetWidth || 88, left = f > 1 ? w + 10 : Math.max(8, Math.min(w - size - 8, f * (w - size)));
    el.style.transitionDuration = (ms || 0) + 'ms'; el.style.left = left + 'px';
    el.classList.toggle('side-r', f > 0.5); el.classList.toggle('side-l', f <= 0.5);
  }

  /* Walk to a spot (0 = left edge, 1 = right edge), then sit. */
  function walkTo(f, then) {
    if (!moving()) { x = f; place(f, 0); if (then) then(); return; }
    var dist = Math.abs(f - x), ms = Math.max(500, dist * 3200);
    face(f < x ? -1 : 1); setPose('stand'); cls(['walking']);
    place(f, ms); x = f;
    later('walk', function () { setPose('sit'); face(f > 0.5 ? -1 : 1); if (then) then(); }, ms);
  }

  function blink() {
    if (!svg) return;
    if (!speaking) { cls(['blink']); setTimeout(function () { cls([], ['blink']); }, 150); }
    later('blink', blink, moving() ? rand(2200, 6000) : rand(5000, 9000));
  }
  function look() {
    var dx = [-3.5, 3.5, 0][Math.floor(Math.random() * 3)];
    Array.prototype.forEach.call($('.pupil'), function (p) { p.style.transform = 'translate(' + dx + 'px,0)'; });
    setTimeout(function () { Array.prototype.forEach.call($('.pupil'), function (p) { p.style.transform = ''; }); }, 1400);
  }
  function smile(ms) { cls(['e-happy'], ['e-wide', 'm-open']); later('face', function () { cls([], ['e-happy']); }, ms || 1800); }
  function wow(ms) { cls(['e-wide', 'm-open'], ['e-happy']); later('face', function () { cls([], ['e-wide', 'm-open']); }, ms || 1400); }
  function hop() { if (!moving()) return; el.classList.remove('hop'); void el.offsetWidth; el.classList.add('hop'); }

  function say(text, ms) {
    if (!bubble) return;
    bubble.textContent = text; bubble.hidden = false;
    later('say', function () { if (!speaking) bubble.hidden = true; }, ms || Math.min(7000, 1800 + text.length * 45));
  }

  /* Now and then Soya does something on his own. */
  function idle() {
    if (moving() && !speaking && !busy && document.visibilityState === 'visible') {
      var r = Math.random();
      if (r < 0.45) walkTo(x > 0.5 ? rand(0.04, 0.3) : rand(0.7, 0.96));
      else if (r < 0.75) look();
      else smile(1400);
    }
    later('idle', idle, rand(9000, 17000));
  }

  /* Reading aloud: the browser's voice for the language, a little higher and slower, like a friendly cat. */
  function pickVoice(code) {
    var vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [], base = code.slice(0, 2);
    var same = vs.filter(function (v) { return (v.lang || '').toLowerCase().indexOf(base) === 0; });
    var male = same.filter(function (v) { return /male|david|daniel|thomas|asaf|alex|fred|guy|paul|henri|nicolas/i.test(v.name) && !/female/i.test(v.name); });
    return male[0] || same[0] || null;
  }
  function canSpeak() { return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window; }
  function stopSpeak() {
    if (canSpeak()) speechSynthesis.cancel();
    speaking = false; clearInterval(mouthTimer); cls([], ['m-open']); if (bubble) bubble.hidden = true;
    document.dispatchEvent(new CustomEvent('soya-speak', { detail: { speaking: false } }));
  }
  function speak(text, code, label) {
    if (!canSpeak()) return false;
    stopSpeak();
    var R = window.SoyaReader, u = new SpeechSynthesisUtterance(text), v = R ? R.pickVoice(code) : pickVoice(code);
    u.lang = code; if (v) u.voice = v; u.rate = R ? R.prefs().rate : 0.95; u.pitch = R ? R.prefs().pitch : 1.15;   /* the site's voice settings (../../soya-reader.js) */
    speaking = true; setPose('sit'); face(x > 0.5 ? -1 : 1);
    if (label) { bubble.textContent = label; bubble.hidden = false; }
    var open = false;
    mouthTimer = setInterval(function () { open = !open; cls(open ? ['m-open'] : [], open ? [] : ['m-open']); }, 170);
    u.onend = u.onerror = function () { stopSpeak(); smile(1500); };
    speechSynthesis.speak(u);
    document.dispatchEvent(new CustomEvent('soya-speak', { detail: { speaking: true } }));
    return true;
  }

  function init(opts) {
    if (el) return Promise.resolve();
    el = document.createElement('div'); el.className = 'buddy' + (moving() ? '' : ' calm'); el.setAttribute('aria-live', 'polite');
    bubble = document.createElement('p'); bubble.className = 'buddy-say'; bubble.hidden = true;
    catBtn = document.createElement('button'); catBtn.type = 'button'; catBtn.className = 'buddy-cat'; catBtn.setAttribute('aria-label', opts.label || 'Soya');
    el.appendChild(bubble); el.appendChild(catBtn); document.body.appendChild(el);
    catBtn.addEventListener('click', function () { if (speaking) { stopSpeak(); return; } hop(); smile(1600); if (opts.onTap) opts.onTap(); });
    window.addEventListener('resize', function () { place(x, 0); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') stopSpeak(); });
    return fetch('assets/soya-sit.svg').then(function (r) { return r.text(); }).then(function (txt) {
      catBtn.innerHTML = txt; svg = catBtn.querySelector('svg'); head = svg.querySelector('#HEAD');
      svg.removeAttribute('id'); svg.setAttribute('aria-hidden', 'true');
      x = moving() ? 1.2 : 0.86; place(x, 0); void el.offsetWidth;
      walkTo(0.86, function () { if (opts.hello) say(opts.hello, 5000); });
      later('blink', blink, 1500); later('idle', idle, 12000);
    }).catch(function () { el.hidden = true; });
  }

  function setEnabled(on) {
    enabled = !!on;
    if (el) el.classList.toggle('calm', !moving());
    if (!moving()) { clearTimeout(timers.walk); setPose('sit'); place(x, 0); }
  }

  /* "Arranging": on first load the story cards settle into place one after another, as if Soya put them there. */
  function arrange(nodes) {
    if (!moving()) return;
    Array.prototype.forEach.call(nodes, function (n, i) { n.style.animationDelay = (i * 120) + 'ms'; n.classList.add('arrive'); });
  }

  window.SoyaLive = {
    init: init, say: say, smile: smile, wow: wow, hop: hop, walkTo: walkTo, speak: speak, stop: stopSpeak,
    canSpeak: canSpeak, isSpeaking: function () { return speaking; }, setEnabled: setEnabled, arrange: arrange,
    busy: function (b) { busy = !!b; }, reduced: function () { return reduced; }
  };
})();
