/* Soya and the mouse, live, in a box on the page (shared by grown-up pages such as support.html).
   The cat is the Soya from annabelle-games (the same drawing Soya News uses): he blinks, looks around, smiles,
   wags his tail, flaps up when tapped, opens his mouth while he talks or reads aloud, and puts on a party hat when
   someone buys him a treat. The mouse peeks out and is the way to send an idea or a "cat issue".
   Motion stops for anyone whose device asks for reduced motion, or who chose "Stop movement" in the accessibility
   menu. Nothing is stored and nothing is sent.

   Use: SoyaBuddy.mount(element, { svg: 'path/to/soya-sit.svg', lines: [...], hello: '...', thanks: '...',
          mouseLabel: '...', mouseSay: '...', mouseHref: 'mailto:...', readLabel: '...', stopLabel: '...',
          readTarget: element, lang: 'he-IL' }) */
(function () {
  'use strict';

  var MOUSE = '<svg viewBox="0 0 120 70" width="56" height="33" aria-hidden="true"><path d="M100,48 Q125,40 115,20" stroke="#ff7aa8" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="60" cy="45" rx="42" ry="22" fill="#9aa3ad" stroke="#5b636c" stroke-width="3"/><circle cx="30" cy="26" r="12" fill="#c3cad1" stroke="#5b636c" stroke-width="3"/><circle cx="30" cy="26" r="6" fill="#ffb3c8"/><circle class="m-eye" cx="22" cy="44" r="4" fill="#222"/><circle cx="18" cy="52" r="5" fill="#ff7aa8"/><path d="M50,30 l6,10 l6,-10 l6,10" stroke="#5fd38d" stroke-width="3" fill="none"/></svg>';

  var CSS = '' +
    '.sb{position:relative;display:flex;align-items:flex-end;gap:6px;min-height:150px;padding:30px 12px 8px;border-radius:18px;background:var(--accent-soft);overflow:hidden}' +
    '.sb button.sb-cat{flex:none;box-shadow:none;color:inherit;width:118px;height:130px;padding:0;border:0;background:none;cursor:pointer;border-radius:14px;min-height:48px}' +
    '.sb-cat svg{width:100%;height:100%;overflow:visible;filter:drop-shadow(0 4px 8px rgba(0,0,0,.25))}' +
    '.sb-cat:focus-visible,.sb-mouse:focus-visible{outline:3px solid var(--accent);outline-offset:2px}' +
    '.sb .soyaSvg .tailG{animation:wag 2.6s ease-in-out infinite}' +
    '.sb.flap .sb-cat{animation:sbflap .55s ease-out 1}' +
    '@keyframes sbflap{0%,100%{transform:none}35%{transform:translateY(-26px) rotate(-4deg)}65%{transform:translateY(-8px) rotate(3deg)}}' +
    '.sb-mouse{flex:none;align-self:flex-end;width:64px;height:48px;padding:0;border:0;background:none;cursor:pointer;border-radius:12px;transform:translateX(0)}' +
    '[dir=rtl] .sb-mouse svg{transform:scaleX(-1)}' +
    '.sb.peek .sb-mouse{animation:sbpeek .7s ease-out 1}' +
    '@keyframes sbpeek{0%{transform:translateX(30px);opacity:0}60%{transform:translateX(-4px);opacity:1}100%{transform:none}}' +
    '.sb-side{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;align-self:stretch;justify-content:space-between}' +
    '.sb-say{margin:0;background:#FFF3D1;color:#1B2032;font-weight:500;font-size:16px;line-height:1.4;padding:10px 14px;border-radius:16px;box-shadow:0 4px 12px rgba(0,0,0,.18);min-height:3em}' +
    '.sb button.sb-read{align-self:flex-start;min-height:48px;padding:0 14px;border-radius:999px;border:1px solid var(--line-strong);background:var(--card);color:var(--ink);font:inherit;font-weight:600;cursor:pointer}' +
    '.sb.calm .soyaSvg .tailG,.sb.calm .sb-cat,.sb.calm .sb-mouse{animation:none!important}' +
    '@media (prefers-reduced-motion:reduce){.sb .soyaSvg .tailG,.sb.flap .sb-cat,.sb.peek .sb-mouse{animation:none}}';

  function injectCss() {
    if (document.getElementById('soya-buddy-css')) return;
    var s = document.createElement('style'); s.id = 'soya-buddy-css'; s.textContent = CSS; document.head.appendChild(s);
  }
  var reducedMq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function still() { return reducedMq.matches || (window.SoyaA11y && window.SoyaA11y.still && window.SoyaA11y.still()); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  var svgCache = {};
  function getSvg(url) { if (!svgCache[url]) svgCache[url] = fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }); return svgCache[url]; }

  function mount(host, o) {
    injectCss();
    o = o || {};
    var box = document.createElement('div'); box.className = 'sb' + (still() ? ' calm' : '');
    var cat = document.createElement('button'); cat.type = 'button'; cat.className = 'sb-cat'; cat.setAttribute('aria-label', o.catLabel || 'Soya');
    var side = document.createElement('div'); side.className = 'sb-side';
    var say = document.createElement('p'); say.className = 'sb-say'; say.setAttribute('aria-live', 'polite');
    side.appendChild(say);
    var readBtn = null;
    if (o.readTarget && window.SoyaReader && window.speechSynthesis) {
      readBtn = document.createElement('button'); readBtn.type = 'button'; readBtn.className = 'sb-read'; readBtn.textContent = o.readLabel || 'Read it to me';
      side.appendChild(readBtn);
    }
    var mouse = document.createElement('a'); mouse.className = 'sb-mouse'; mouse.href = o.mouseHref || '#'; mouse.innerHTML = MOUSE;
    mouse.setAttribute('aria-label', o.mouseLabel || 'Send an idea or a cat issue'); mouse.title = o.mouseLabel || '';
    box.appendChild(cat); box.appendChild(side); box.appendChild(mouse);
    host.appendChild(box);

    var svg = null, timers = {}, talking = null, lineIx = 0;
    function later(k, fn, ms) { clearTimeout(timers[k]); timers[k] = setTimeout(fn, ms); }
    function cls(add, rem) { if (!svg) return; (rem || []).forEach(function (c) { svg.classList.remove(c); }); (add || []).forEach(function (c) { svg.classList.add(c); }); }
    function mouth(on) {
      clearInterval(talking); talking = null; cls([], ['m-open']);
      if (!on) return;
      var open = false; talking = setInterval(function () { open = !open; cls(open ? ['m-open'] : [], open ? [] : ['m-open']); }, 170);
    }
    function speak(text, ms) {
      say.textContent = text;
      mouth(true); later('mouth', function () { mouth(false); }, ms || Math.min(3200, 500 + text.length * 40));
    }
    function blink() {
      if (svg && !talking) { cls(['blink']); setTimeout(function () { cls([], ['blink']); }, 150); }
      later('blink', blink, rand(2200, 6000));
    }
    function look(dx) {
      if (!svg) return;
      Array.prototype.forEach.call(svg.querySelectorAll('.pupil'), function (p) { p.style.transform = dx ? 'translate(' + dx + 'px,0)' : ''; });
    }
    function smile(ms) { cls(['e-happy'], ['e-wide']); later('face', function () { cls([], ['e-happy']); }, ms || 1800); }
    function wow(ms) { cls(['e-wide', 'm-open'], ['e-happy']); later('face', function () { cls([], ['e-wide', 'm-open']); }, ms || 1300); }
    function flap() { if (still()) return; box.classList.remove('flap'); void box.offsetWidth; box.classList.add('flap'); }
    function peek() { if (still()) return; box.classList.remove('peek'); void box.offsetWidth; box.classList.add('peek'); }
    function idle() {
      if (svg && !talking && document.visibilityState === 'visible') {
        var r = Math.random();
        if (r < 0.4) { var dir = (document.documentElement.dir === 'rtl' ? -1 : 1) * 3.5; look(dir); setTimeout(function () { look(0); }, 1300); } /* glances at the mouse */
        else if (r < 0.7) smile(1300);
        else { peek(); look(document.documentElement.dir === 'rtl' ? -3.5 : 3.5); setTimeout(function () { look(0); }, 1200); }
      }
      later('idle', idle, rand(7000, 13000));
    }

    cat.addEventListener('click', function () {
      flap(); smile(1600);
      var lines = o.lines || [];
      if (lines.length) { speak(lines[lineIx % lines.length]); lineIx++; }
    });
    mouse.addEventListener('mouseenter', function () { wow(); look(document.documentElement.dir === 'rtl' ? -3.5 : 3.5); setTimeout(function () { look(0); }, 1200); });
    mouse.addEventListener('focus', function () { if (o.mouseSay) speak(o.mouseSay); });
    if (readBtn) {
      readBtn.addEventListener('click', function () {
        if (speechSynthesis.speaking) { window.SoyaReader.stop(); mouth(false); readBtn.textContent = o.readLabel || 'Read it to me'; return; }
        var text = Array.prototype.filter.call(o.readTarget.querySelectorAll('h1,h2,p,li'), function (n) { return !n.closest('.sb'); }).map(function (n) { return n.innerText.trim(); }).join('. ');
        window.SoyaReader.readText(text, o.lang);   /* 'he' or 'en' */
        readBtn.textContent = o.stopLabel || 'Stop';
        mouth(true);
        var poll = setInterval(function () {
          if (!speechSynthesis.speaking) { clearInterval(poll); mouth(false); smile(1400); readBtn.textContent = o.readLabel || 'Read it to me'; }
        }, 300);
      });
    }
    document.addEventListener('soya-a11y', function () { box.classList.toggle('calm', !!still()); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') mouth(false); });

    getSvg(o.svg || 'assets/soya-sit.svg').then(function (txt) {
      cat.innerHTML = txt; svg = cat.querySelector('svg');
      svg.removeAttribute('id'); svg.setAttribute('aria-hidden', 'true');
      if (o.hello) speak(o.hello, 2600);
      later('blink', blink, 1200); later('idle', idle, 5000); later('peek', peek, 900);
    }).catch(function () { box.hidden = true; });

    return {
      say: speak, smile: smile, wow: wow, flap: flap,
      party: function (text) { cls(['w-party', 'e-happy']); flap(); if (text) speak(text, 3000); later('party', function () { cls([], ['w-party', 'e-happy']); }, 9000); }
    };
  }

  window.SoyaBuddy = { mount: mount };
})();
