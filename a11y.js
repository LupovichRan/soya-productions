/* Soycatory accessibility menu (תפריט נגישות), shared by the site's pages.
   A small button opens a panel: theme (where the page has both), bigger text, high contrast, readable font, underlined
   links, stop movement, more spacing, and a link to the accessibility statement. Also adds a "skip to content" link.
   Choices are stored on this device only (localStorage "soya-a11y"); nothing is sent.
   A page says it supports a light and a dark theme with <html data-themes="light dark">. */
(function () {
  'use strict';
  var KEY = 'soya-a11y', root = document.documentElement;
  var base = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/a11y\.js(\?.*)?$/, '') : '/';
  var T = {
    en: { open: 'Accessibility', title: 'Accessibility', theme: 'Theme', auto: 'Auto', light: 'Light', dark: 'Dark', text: 'Text size', contrast: 'High contrast', font: 'Readable font', links: 'Underline links', still: 'Stop movement', space: 'More spacing', reset: 'Reset', close: 'Close', statement: 'Accessibility statement', skip: 'Skip to content', on: 'On', off: 'Off' },
    he: { open: 'נגישות', title: 'תפריט נגישות', theme: 'ערכת צבעים', auto: 'אוטומטי', light: 'בהיר', dark: 'כהה', text: 'גודל טקסט', contrast: 'ניגודיות גבוהה', font: 'גופן קריא', links: 'קו תחתון לקישורים', still: 'עצירת תנועה', space: 'ריווח גדול', reset: 'איפוס', close: 'סגירה', statement: 'הצהרת נגישות', skip: 'דילוג לתוכן', on: 'מופעל', off: 'כבוי' },
    fr: { open: 'Accessibilité', title: 'Accessibilité', theme: 'Thème', auto: 'Auto', light: 'Clair', dark: 'Sombre', text: 'Taille du texte', contrast: 'Contraste élevé', font: 'Police lisible', links: 'Souligner les liens', still: 'Arrêter le mouvement', space: 'Plus d\'espace', reset: 'Réinitialiser', close: 'Fermer', statement: 'Déclaration d\'accessibilité', skip: 'Aller au contenu', on: 'Activé', off: 'Désactivé' }
  };
  function lang() { var l = (root.lang || 'en').slice(0, 2); return T[l] ? l : 'en'; }
  function t(k) { return T[lang()][k]; }
  var S = { theme: 'auto', text: 0, contrast: false, font: false, links: false, still: false, space: false };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || '{}'); for (var k in saved) if (k in S) S[k] = saved[k]; } catch (e) { /* defaults */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* fine */ } }
  function themes() { return (root.getAttribute('data-themes') || '').split(/\s+/).filter(Boolean); }

  var fontLoaded = false;
  function apply() {
    var th = themes();
    if (th.length > 1) { if (S.theme === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', S.theme); }
    root.classList.remove('a11y-text-1', 'a11y-text-2', 'a11y-text-3');
    if (S.text > 0) root.classList.add('a11y-text-' + S.text);
    root.classList.toggle('a11y-contrast', !!S.contrast);
    root.classList.toggle('a11y-font', !!S.font);
    root.classList.toggle('a11y-links', !!S.links);
    root.classList.toggle('a11y-still', !!S.still);
    root.classList.toggle('a11y-space', !!S.space);
    if (S.font && !fontLoaded) { fontLoaded = true; var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap'; document.head.appendChild(l); }
    document.dispatchEvent(new CustomEvent('soya-a11y', { detail: { still: !!S.still } }));
  }
  apply();

  function css() {
    var st = document.createElement('style'); st.id = 'a11y-style';
    st.textContent =
      '.a11y-skip{position:absolute;inset-inline-start:8px;top:-60px;z-index:100;background:#FFC94D;color:#1B2032;padding:12px 16px;border-radius:10px;font-weight:700;text-decoration:none}' +
      '.a11y-skip:focus{top:8px}' +
      'button.a11y-btn.a11y-btn{position:fixed;z-index:40;inset-inline-start:0;top:30%;width:48px;height:52px;min-height:0;border-radius:0 14px 14px 0;border:2px solid #fff;border-inline-start:0;background:#2B5FD9;color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.35);padding:0;margin:0}' +
      '[dir=rtl] button.a11y-btn.a11y-btn{border-radius:14px 0 0 14px}' +
      '.a11y-btn:focus-visible,.a11y-panel button:focus-visible,.a11y-panel a:focus-visible{outline:3px solid #FFC94D;outline-offset:2px}' +
      '.a11y-panel.a11y-panel{border:0;border-radius:18px;padding:16px;width:min(92vw,380px);background:#fff;color:#111827;font:16px/1.5 system-ui,-apple-system,"Segoe UI",Arial,sans-serif;zoom:1}' +
      '.a11y-panel::backdrop{background:rgba(5,8,18,.6)}' +
      '.a11y-panel.a11y-panel h2{margin:0 0 10px;font-size:20px;color:#111827;font-weight:700}' +
      '.a11y-panel ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}' +
      '.a11y-panel li{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}' +
      '.a11y-panel .grp{display:flex;gap:6px;flex-wrap:wrap}' +
      '.a11y-panel.a11y-panel button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;min-width:48px;padding:6px 12px;margin:0;border-radius:12px;border:2px solid #9CA3AF;background:#F3F4F6;color:#111827;font:inherit;font-weight:600;cursor:pointer;box-shadow:none}' +
      '.a11y-panel.a11y-panel button[aria-pressed=true]{background:#1D4ED8;border-color:#1D4ED8;color:#fff}' +
      '.a11y-panel .row-end{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:12px;flex-wrap:wrap}' +
      '.a11y-panel.a11y-panel a{color:#1D4ED8;font-weight:600;display:inline-flex;align-items:center;min-height:48px}' +
      '.a11y-panel.a11y-panel span{color:#111827}' +
      /* effects */
      'html.a11y-text-1 body{zoom:1.12}html.a11y-text-2 body{zoom:1.25}html.a11y-text-3 body{zoom:1.4}' +
      'html.a11y-contrast{--mute:var(--ink)!important;--line:currentColor!important}html.a11y-contrast body{filter:contrast(1.15)}' +
      'html.a11y-contrast img,html.a11y-contrast svg,html.a11y-contrast video,html.a11y-contrast canvas{filter:none}' +
      'html.a11y-font body,html.a11y-font body *{font-family:"Atkinson Hyperlegible",Arial,"Heebo",sans-serif!important}' +
      'html.a11y-links a{text-decoration:underline!important;text-underline-offset:3px}' +
      'html.a11y-still *,html.a11y-still *::before,html.a11y-still *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}' +
      'html.a11y-space p,html.a11y-space li,html.a11y-space dd{line-height:1.95!important;letter-spacing:.03em;word-spacing:.12em}' +
      '@media print{.a11y-btn,.a11y-skip{display:none!important}}';
    document.head.appendChild(st);
  }

  var btn, dlg;
  function seg(key, values, labels) {
    return '<div class="grp" role="group">' + values.map(function (v, i) { return '<button type="button" data-k="' + key + '" data-v="' + v + '" aria-pressed="' + (String(S[key]) === String(v)) + '">' + labels[i] + '</button>'; }).join('') + '</div>';
  }
  function toggle(key) { return '<button type="button" data-k="' + key + '" data-v="toggle" aria-pressed="' + !!S[key] + '">' + (S[key] ? t('on') : t('off')) + '</button>'; }
  function panelHtml() {
    var th = themes(), rows = [];
    if (th.length > 1) rows.push('<li><span>' + t('theme') + '</span>' + seg('theme', ['auto', 'light', 'dark'], [t('auto'), t('light'), t('dark')]) + '</li>');
    rows.push('<li><span>' + t('text') + '</span>' + seg('text', [0, 1, 2, 3], ['A', 'A+', 'A++', 'A+++']) + '</li>');
    ['contrast', 'font', 'links', 'still', 'space'].forEach(function (k) { rows.push('<li><span>' + t(k) + '</span>' + toggle(k) + '</li>'); });
    return '<h2 id="a11y-h">' + t('title') + '</h2><ol>' + rows.join('') + '</ol><div class="row-end"><a href="' + base + 'accessibility.html">' + t('statement') + '</a><span class="grp"><button type="button" id="a11y-reset">' + t('reset') + '</button><button type="button" id="a11y-close">' + t('close') + '</button></span></div>';
  }
  function draw() {
    dlg.setAttribute('dir', root.dir || 'ltr'); dlg.setAttribute('lang', lang()); dlg.innerHTML = panelHtml();
    dlg.querySelectorAll('[data-k]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-k'), v = b.getAttribute('data-v');
        if (v === 'toggle') S[k] = !S[k]; else S[k] = k === 'text' ? +v : v;
        save(); apply(); draw(); var again = dlg.querySelector('[data-k="' + k + '"][data-v="' + v + '"]'); if (again) again.focus();
      });
    });
    dlg.querySelector('#a11y-reset').addEventListener('click', function () { S = { theme: 'auto', text: 0, contrast: false, font: false, links: false, still: false, space: false }; save(); apply(); draw(); });
    dlg.querySelector('#a11y-close').addEventListener('click', function () { dlg.close(); btn.focus(); });
  }
  function relabel() { if (btn) { btn.setAttribute('aria-label', t('open')); btn.title = t('open'); } var sk = document.querySelector('.a11y-skip'); if (sk) sk.textContent = t('skip'); }

  function build() {
    css();
    var main = document.querySelector('main') || document.getElementById('app');
    if (main) { if (!main.id) main.id = 'main'; if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1'); var sk = document.createElement('a'); sk.className = 'a11y-skip'; sk.href = '#' + main.id; document.body.insertBefore(sk, document.body.firstChild); }
    btn = document.createElement('button'); btn.type = 'button'; btn.className = 'a11y-btn';
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" fill="currentColor"><circle cx="12" cy="4" r="2.2"/><path d="M4 7.6c2.6.8 5.2 1.2 8 1.2s5.4-.4 8-1.2l.6 1.9c-2.1.7-4.2 1.1-6.4 1.3V13l2.2 7.6-1.9.6L12.3 15h-.6l-2.2 6.2-1.9-.6L9.8 13v-2.2c-2.2-.2-4.3-.6-6.4-1.3z"/></svg>';
    dlg = document.createElement('dialog'); dlg.className = 'a11y-panel'; dlg.setAttribute('aria-labelledby', 'a11y-h');
    document.body.appendChild(btn); document.body.appendChild(dlg);
    btn.addEventListener('click', function () { draw(); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); var f = dlg.querySelector('button'); if (f) f.focus(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    relabel();
    new MutationObserver(relabel).observe(root, { attributes: true, attributeFilter: ['lang'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
  window.SoyaA11y = { still: function () { return !!S.still; } };
})();
