/* Soya's mouse: the "tell us" button in every Soycatory app (the same mouse and choices as annabelle-games).
   Tap the mouse on the edge of the screen, pick "Something is broken", "I have an idea" or "Please fix this",
   write a few words and send. The reader gets a report number. Without internet the report waits on the device
   and is sent later.
   What is sent: the kind, the words typed, the app and page, the app version, the language, the screen size and
   the browser name. Never a name, an email, a picture or a recording, and nothing is sent unless the person
   presses Send. Reports go to Ran's Soycatory inbox (Supabase table sc_requests): the key below can only ADD
   a report; it cannot read, change or delete any. A daily task emails new reports to Ran.

   Use: <script src="(path)/shared/soya-mouse.js" data-app="kafka-check" data-ver="1.2"></script>
   Add data-button="off" when the app draws its own mouse and calls window.SoyaMouse.send({...}) itself. */
(function () {
  'use strict';
  if (window.SoyaMouse) return;

  var URL0 = 'https://futpofsbwfnbnkhyflwk.supabase.co';
  var KEY = 'sb_publishable_4sg56BrqgVt7U4I39spuYw_0GRj8LQd'; // gitleaks:allow (publishable key, public by design; insert-only here)
  var QKEY = 'soya-mouse-queue';
  var me = document.currentScript || {}, attr = function (k) { return me.getAttribute ? me.getAttribute(k) : null; };
  var APP = attr('data-app') || (location.pathname.match(/apps\/\d{4}-\d\d-\d\d-([a-z0-9-]+)/) || [])[1] || (location.pathname.replace(/^.*\//, '').replace(/\.html$/, '') || 'front-page');
  var VER = attr('data-ver') || '';

  var T = {
    en: { btn: 'Report a problem or an idea', title: 'Tell us!', bug: 'Something is broken', idea: 'I have an idea', fix: 'Please fix this', kind: 'Kind of message',
      ph: 'What happened? Write here…', send: 'Send', cancel: 'Cancel', close: 'Close', need: 'Write a few words first.', sending: 'Sending…',
      thanks: 'Thank you! Ran will read it.', id: 'Report number', queued: 'No internet right now. The message is saved and will be sent later.', fail: 'Sending did not work. You can try again.',
      what: 'Sent with it: the app, the page, the version, your language, the screen size and the browser. No name, no email, no picture.' },
    he: { btn: 'דיווח על תקלה או רעיון', title: 'ספרו לנו!', bug: 'משהו לא עובד', idea: 'יש לי רעיון', fix: 'צריך לתקן', kind: 'סוג ההודעה',
      ph: 'מה קרה? אפשר לכתוב כאן…', send: 'שליחה', cancel: 'ביטול', close: 'סגירה', need: 'קודם כותבים כמה מילים.', sending: 'שולח…',
      thanks: 'תודה רבה! רן יקרא את זה.', id: 'מספר הדיווח', queued: 'אין אינטרנט כרגע. ההודעה נשמרה ותישלח אחר כך.', fail: 'השליחה לא הצליחה. אפשר לנסות שוב.',
      what: 'נשלחים איתה: האפליקציה, העמוד, הגרסה, השפה, גודל המסך והדפדפן. בלי שם, בלי מייל ובלי תמונה.' },
    fr: { btn: 'Signaler un bug ou une idée', title: 'Dis-nous tout !', bug: 'Ça ne marche pas', idea: "J'ai une idée", fix: 'À corriger', kind: 'Type de message',
      ph: "Que s'est-il passé ? Écris ici…", send: 'Envoyer', cancel: 'Annuler', close: 'Fermer', need: "Écris d'abord quelques mots.", sending: 'Envoi…',
      thanks: 'Merci ! Ran va le lire.', id: 'Numéro du message', queued: "Pas d'internet pour l'instant. Le message est gardé et partira plus tard.", fail: "L'envoi n'a pas marché. Tu peux réessayer.",
      what: "Envoyé avec : l'appli, la page, la version, ta langue, la taille de l'écran et le navigateur. Ni nom, ni e-mail, ni image." }
  };
  function lang() { var l = (document.documentElement.lang || 'en').slice(0, 2); return T[l] ? l : 'en'; }
  function t(k) { return T[lang()][k]; }
  function rnd(n) { var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '', b = new Uint8Array(n); try { crypto.getRandomValues(b); } catch (e) { for (var i = 0; i < n; i++) b[i] = Math.random() * 256; } for (var j = 0; j < n; j++) s += a[b[j] % a.length]; return s; }
  function env() { if (navigator.webdriver) return 'qa'; return /(^|\.)github\.io$/.test(location.hostname) ? 'prod' : 'dev'; }
  function browser() { var u = navigator.userAgent || ''; var m = u.match(/(Edg|OPR|SamsungBrowser|Firefox|CriOS|FxiOS|Chrome|Version)\/[\d.]+/); var os = /iPhone|iPad/.test(u) ? 'iOS' : /Android/.test(u) ? 'Android' : /Mac/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : /Linux/.test(u) ? 'Linux' : ''; return ((m ? m[0].replace('Version', 'Safari') : 'browser') + ' ' + os).slice(0, 60); }

  /* The inbox takes two kinds: broken things and fixes are "cat issues", ideas are feature requests. */
  function row(o) {
    var text = String(o.text || '').trim().slice(0, 1900), first = text.split(/\n/)[0];
    var label = { bug: 'Broken', fix: 'Fix', idea: 'Idea' }[o.kind] || 'Bug';
    var title = (label + ': ' + first).slice(0, 120); if (title.length < 3) title = label;
    return {
      env: env(), kind: o.kind === 'idea' ? 'rfe' : 'cat_issue', app: String(o.app || APP).slice(0, 60), title: title,
      details: text + '\n\n[report ' + o.rid + ' · ' + (o.kind || 'bug') + ' · ' + (innerWidth + 'x' + innerHeight) + ' · ' + browser() + (o.queued ? ' · sent after being offline' : '') + ']',
      lang: lang(), page: (location.pathname || '/').slice(-120), ver: String(o.ver || VER || '').slice(0, 60) || null
    };
  }
  function post(r) {
    return fetch(URL0 + '/rest/v1/sc_requests', { method: 'POST', credentials: 'omit', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(r) })
      .then(function (res) { return { ok: res.ok, status: res.status }; }, function () { return { net: true }; });
  }
  function queue() { try { var q = JSON.parse(localStorage.getItem(QKEY) || '[]'); return Array.isArray(q) ? q : []; } catch (e) { return []; } }
  function saveQueue(q) { try { localStorage.setItem(QKEY, JSON.stringify(q.slice(-20))); } catch (e) { /* fine */ } }
  function flush() {
    var q = queue(); if (!q.length || navigator.onLine === false) return;
    var left = []; q.reduce(function (p, item) { return p.then(function () { item.queued = true; return post(row(item)).then(function (r) { if (r.net) left.push(item); }); }); }, Promise.resolve())
      .then(function () { saveQueue(left); });
  }
  /* send({kind: 'bug'|'idea'|'fix', text, app?, ver?}) -> Promise<{rid} | {rid, queued} | {fail}> */
  function send(o) {
    var item = { kind: o.kind || 'bug', text: o.text, app: o.app, ver: o.ver, rid: rnd(6), at: new Date().toISOString() };
    function later() { var q = queue(); q.push(item); saveQueue(q); return { rid: item.rid, queued: true }; }
    if (navigator.onLine === false) return Promise.resolve(later());
    return post(row(item)).then(function (r) { return r.ok ? { rid: item.rid } : r.net ? later() : { fail: true }; });
  }

  /* ---------- the button and the window ---------- */
  var MOUSE = '<svg viewBox="0 0 120 70" width="40" height="24" aria-hidden="true"><path d="M100,48 Q125,40 115,20" stroke="#ff7aa8" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="60" cy="45" rx="42" ry="22" fill="#9aa3ad" stroke="#5b636c" stroke-width="3"/><circle cx="30" cy="26" r="12" fill="#c3cad1" stroke="#5b636c" stroke-width="3"/><circle cx="30" cy="26" r="6" fill="#ffb3c8"/><circle cx="22" cy="44" r="4" fill="#222"/><circle cx="18" cy="52" r="5" fill="#ff7aa8"/><path d="M50,30 l6,10 l6,-10 l6,10" stroke="#5fd38d" stroke-width="3" fill="none"/></svg>';
  var CSS = '' +
    '.sm-btn.sm-btn{all:unset;box-sizing:border-box;position:fixed;z-index:9990;top:46%;inset-inline-end:0;width:52px;height:48px;display:flex;align-items:center;justify-content:center;cursor:pointer;' +
    'background:#1A2135;border:2px solid #323C5C;border-inline-end:0;border-radius:14px 0 0 14px;opacity:.9;box-shadow:0 4px 12px rgba(0,0,0,.25)}' +
    '[dir=rtl] .sm-btn.sm-btn{border-radius:0 14px 14px 0}[dir=rtl] .sm-btn svg{transform:scaleX(-1)}' +
    '.sm-btn.sm-btn:hover,.sm-btn.sm-btn:focus-visible{opacity:1}.sm-btn.sm-btn:focus-visible{outline:3px solid #FFC94D;outline-offset:2px}' +
    '.sm-dlg.sm-dlg{box-sizing:border-box;border:0;padding:18px;border-radius:18px;background:#1A2135;color:#F2F4FA;width:min(92vw,440px);max-height:90vh;overflow:auto;font:16px/1.5 system-ui,"Heebo",sans-serif}' +
    '.sm-dlg::backdrop{background:rgba(8,12,24,.6)}' +
    '.sm-dlg *{box-sizing:border-box}.sm-dlg h2{margin:0;font-size:22px}.sm-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}' +
    '.sm-kinds{display:flex;gap:6px;margin-bottom:10px}.sm-kinds button{all:unset;box-sizing:border-box;flex:1;min-height:64px;padding:6px 4px;border-radius:14px;background:#222B44;border:2px solid transparent;text-align:center;font-size:14px;line-height:1.2;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}' +
    '.sm-kinds button span{font-size:22px}.sm-kinds button[aria-pressed=true]{border-color:#FF8FB1;background:rgba(255,143,177,.16)}.sm-kinds button:focus-visible{outline:3px solid #FFC94D}' +
    '.sm-dlg textarea{width:100%;min-height:110px;font:inherit;color:inherit;background:#0F1424;border:2px solid #323C5C;border-radius:12px;padding:10px}' +
    '.sm-dlg .sm-what{color:#A9B2C8;font-size:13px;margin:8px 0}.sm-dlg .sm-note{min-height:1.5em;margin:6px 0;font-weight:600}' +
    '.sm-row{display:flex;gap:8px;flex-wrap:wrap}.sm-row button{all:unset;box-sizing:border-box;min-height:48px;padding:0 20px;border-radius:999px;cursor:pointer;font-weight:600;display:inline-flex;align-items:center}' +
    '.sm-send{background:#FFC94D;color:#1B2032}.sm-soft{border:2px solid #323C5C;color:#F2F4FA}.sm-row button:focus-visible{outline:3px solid #FFC94D;outline-offset:2px}' +
    '.sm-hp{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}';

  var btn, dlg, kind = 'bug';
  function el(tag, a, html) { var e = document.createElement(tag); Object.keys(a || {}).forEach(function (k) { e.setAttribute(k, a[k]); }); if (html != null) e.innerHTML = html; return e; }
  function build() {
    var st = el('style'); st.textContent = CSS; document.head.appendChild(st);
    btn = el('button', { type: 'button', 'class': 'sm-btn' }, MOUSE); label();
    btn.addEventListener('click', openDlg); document.body.appendChild(btn);
    document.addEventListener('keydown', function (e) { if (e.key === 'F8') { e.preventDefault(); openDlg(); } });
  }
  function label() { if (btn) { btn.setAttribute('aria-label', t('btn')); btn.title = t('btn') + ' (F8)'; } }
  function openDlg() {
    if (dlg) dlg.remove();
    dlg = el('dialog', { 'class': 'sm-dlg', 'aria-labelledby': 'sm-title', dir: document.documentElement.dir || 'ltr', lang: lang() });
    dlg.innerHTML = '<div class="sm-head">' + MOUSE.replace('width="40" height="24"', 'width="64" height="38"') + '<h2 id="sm-title"></h2></div>' +
      '<div class="sm-kinds" role="group"></div><label for="sm-text" class="sm-hp"></label><textarea id="sm-text" maxlength="1900" autocomplete="off"></textarea>' +
      '<p class="sm-what"></p><div class="sm-hp" aria-hidden="true"><input type="text" name="website" tabindex="-1" autocomplete="off"></div><p class="sm-note" role="status"></p>' +
      '<div class="sm-row"><button type="button" class="sm-send"></button><button type="button" class="sm-soft sm-cancel"></button></div>';
    dlg.querySelector('#sm-title').textContent = t('title');
    var kinds = dlg.querySelector('.sm-kinds'); kinds.setAttribute('aria-label', t('kind'));
    [['bug', '🐞'], ['idea', '💡'], ['fix', '🔧']].forEach(function (k) {
      var b = el('button', { type: 'button', 'data-kind': k[0], 'aria-pressed': String(k[0] === kind) }, '<span aria-hidden="true">' + k[1] + '</span>');
      b.appendChild(document.createTextNode(t(k[0])));
      b.addEventListener('click', function () { kind = k[0]; kinds.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); });
      kinds.appendChild(b);
    });
    var ta = dlg.querySelector('textarea'); ta.placeholder = t('ph'); ta.setAttribute('dir', document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr');
    dlg.querySelector('label[for=sm-text]').textContent = t('ph');
    dlg.querySelector('.sm-what').textContent = t('what');
    var sendB = dlg.querySelector('.sm-send'), cancel = dlg.querySelector('.sm-cancel'), note = dlg.querySelector('.sm-note');
    sendB.textContent = t('send'); cancel.textContent = t('cancel');
    cancel.addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener('close', function () { if (btn) btn.focus(); });
    sendB.addEventListener('click', function () {
      if (dlg.querySelector('input[name=website]').value) return;
      var text = ta.value.trim(); if (text.length < 2) { note.textContent = t('need'); ta.focus(); return; }
      sendB.disabled = true; note.textContent = t('sending');
      send({ kind: kind, text: text }).then(function (r) {
        if (r.fail) { sendB.disabled = false; note.textContent = t('fail'); return; }
        ta.value = ''; note.textContent = (r.queued ? t('queued') : t('thanks')) + ' ' + t('id') + ': ' + r.rid;
        sendB.hidden = true; cancel.textContent = t('close'); cancel.focus();
      });
    });
    document.body.appendChild(dlg);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    ta.focus();
  }
  function close() { if (dlg) { if (dlg.close) dlg.close(); dlg.remove(); dlg = null; } }

  window.SoyaMouse = { send: send, open: function () { openDlg(); }, flush: flush };
  window.addEventListener('online', flush);
  function init() {
    if (attr('data-button') !== 'off') build();
    new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    setTimeout(flush, 3000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
