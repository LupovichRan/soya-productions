/* Soycatory's visit counter, for GROWN-UP pages only (Ran chose this on 2026-11-21). Never load it in the kids'
   apps (Soya News, Animal Facts, Soya's Games): they count nothing.
   What is counted: a page view, a tap that opens an app, an install, and a page error (its message only). Each
   record holds the page, the app, the language, the version, the screen width group, and a random visit number
   made for this one visit that lives in memory only. No cookies, nothing stored in the browser, no name, no
   device ID, no address. Nothing at all is sent if the browser asks not to be tracked (Do Not Track or Global
   Privacy Control). Records go to Supabase sc_events (after-demo-day); the key below can only ADD rows.
   The page shows a one-line notice saying this, placed in its footer.

   Use: <script src="(path)/shared/soya-metrics.js" data-app="kafka-check" data-ver="1.2"></script> */
(function () {
  'use strict';
  if (window.SoyaMetrics) return;
  var URL0 = 'https://futpofsbwfnbnkhyflwk.supabase.co';
  var KEY = 'sb_publishable_4sg56BrqgVt7U4I39spuYw_0GRj8LQd'; // gitleaks:allow (publishable key, public by design; insert-only here)
  var me = document.currentScript || {}, attr = function (k) { return me.getAttribute ? me.getAttribute(k) : null; };
  var APP = attr('data-app') || (location.pathname.match(/apps\/\d{4}-\d\d-\d\d-([a-z0-9-]+)/) || [])[1] || null;
  var VER = attr('data-ver') || null;
  var off = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  var KIDS = /soya-news|animal-facts|soya-games/;
  if (APP && KIDS.test(APP)) off = true;   /* a safety net: kids' apps never count, even if someone adds the script */
  var visit = (function () { var a = 'abcdefghijklmnopqrstuvwxyz0123456789', s = '', b = new Uint8Array(10); try { crypto.getRandomValues(b); } catch (e) { for (var i = 0; i < 10; i++) b[i] = Math.random() * 256; } for (var j = 0; j < 10; j++) s += a[b[j] % a.length]; return s; })();
  function env() { if (navigator.webdriver) return 'qa'; return /(^|\.)github\.io$/.test(location.hostname) ? 'prod' : 'dev'; }
  function lang() { var l = (document.documentElement.lang || '').slice(0, 2); return /^(en|he|fr)$/.test(l) ? l : null; }
  function width() { var w = innerWidth; return w < 480 ? 'phone' : w < 1024 ? 'tablet' : 'desktop'; }
  var sent = 0;
  function track(event, data) {
    if (off || sent >= 40) return;
    sent++;
    var body = { env: env(), page: (location.pathname || '/').slice(-120), app: APP, event: event, data: Object.assign({ w: width() }, data || {}), lang: lang(), ver: VER, visit: visit };
    try {
      fetch(URL0 + '/rest/v1/sc_events', { method: 'POST', keepalive: true, credentials: 'omit', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(body) }).catch(function () {});
    } catch (e) { /* fine */ }
  }
  var NOTE = {
    en: 'This page counts visits, app opens, installs and errors, with no cookies and no ID. Nothing is counted if your browser asks not to be tracked.',
    he: 'העמוד הזה סופר ביקורים, פתיחות של אפליקציות, התקנות ותקלות, בלי עוגיות ובלי מזהה. אם הדפדפן מבקש לא לעקוב, לא נספר כלום.',
    fr: "Cette page compte les visites, les ouvertures d'applis, les installations et les erreurs, sans cookies ni identifiant. Rien n'est compté si ton navigateur demande de ne pas être suivi."
  };
  function notice() {
    var p = document.getElementById('soya-count-note');
    if (!p) { p = document.createElement('p'); p.id = 'soya-count-note'; p.style.cssText = 'font-size:12px;opacity:.75;margin:8px auto;max-width:640px;padding:0 16px;text-align:center'; (document.querySelector('footer') || document.body).appendChild(p); }
    p.textContent = NOTE[lang() || 'en'];
  }
  function init() {
    notice();
    new MutationObserver(notice).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    track('view', { ref: document.referrer ? (function () { try { return new URL(document.referrer).hostname.slice(0, 60); } catch (e) { return null; } })() : null });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
      var m = (a.getAttribute('href') || '').match(/apps\/\d{4}-\d\d-\d\d-([a-z0-9-]+)/);
      if (m) track('open', { to: m[1] });
    }, true);
    window.addEventListener('appinstalled', function () { track('install', {}); });
    window.addEventListener('error', function (e) { track('error', { msg: String(e.message || 'error').slice(0, 160), src: String(e.filename || '').replace(/^.*\//, '').slice(0, 60), line: e.lineno || 0 }); });
    window.addEventListener('unhandledrejection', function (e) { track('error', { msg: String((e.reason && e.reason.message) || e.reason || 'promise').slice(0, 160), src: 'promise' }); });
  }
  window.SoyaMetrics = { track: track, off: off };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
