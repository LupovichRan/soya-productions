/* Soya Market Radar. Kept calm on purpose: few things on each screen, more revealed only when asked for or over time.
   1. Radar: research notes from Ran's weekday scan, read (never written) from the published list in config.js,
      ranked on Soya's snack ladder (fish bone to golden tuna) with how crowded the idea already is.
   2. Check a tip: paste a message; Soya looks for the usual warning signs on this device only (nothing is sent).
   3. My list (appears after the first visit, a checked tip or an opened note): your own tickers, on this device only.
   Not investment advice; the full terms are one tap away on every screen and must be accepted once.
   Stored on the device only: language, terms accepted, visits, unlocked parts, watch list, last copy of the notes. */
(function () {
  'use strict';

  var K = { lang: 'soya-radar-lang', ok: 'soya-radar-terms-1', visits: 'soya-radar-visits', unlock: 'soya-radar-unlock', hint: 'soya-radar-hint', watch: 'soya-radar-watch', cache: 'soya-radar-cache' };
  var SNACK = {
    1: '<svg viewBox="0 0 40 24" aria-hidden="true"><path d="M6 12h26M12 6v12M18 7v10M24 7v10" stroke="#C8D2E0" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M32 12l6-5v10z" fill="#C8D2E0"/><circle cx="5" cy="12" r="3" fill="#C8D2E0"/></svg>',
    2: '<svg viewBox="0 0 40 24" aria-hidden="true"><rect x="4" y="7" width="32" height="10" rx="5" fill="#F0A95B" stroke="#B8732C" stroke-width="2"/><path d="M10 10l2 2M17 9l2 3M25 10l2 2" stroke="#B8732C" stroke-width="1.6" stroke-linecap="round"/></svg>',
    3: '<svg viewBox="0 0 40 24" aria-hidden="true"><rect x="3" y="4" width="34" height="16" rx="4" fill="#9FB3C8" stroke="#5E7389" stroke-width="2"/><path d="M8 12q6-5 12 0q-6 5-12 0zM20 12l4-3v6zM22 12q6-4 11 0q-5 4-11 0z" fill="#E6EEF6"/></svg>',
    4: '<svg viewBox="0 0 40 24" aria-hidden="true"><ellipse cx="20" cy="18" rx="15" ry="4" fill="#7E8CA5"/><rect x="5" y="7" width="30" height="11" fill="#B9C4D8"/><rect x="5" y="10" width="30" height="5" fill="#3FB8D8"/><ellipse cx="20" cy="7" rx="15" ry="4" fill="#DCE3EF"/></svg>',
    5: '<svg viewBox="0 0 40 24" aria-hidden="true"><ellipse cx="20" cy="18" rx="15" ry="4" fill="#B8860B"/><rect x="5" y="7" width="30" height="11" fill="#E8B923"/><rect x="5" y="10" width="30" height="5" fill="#FFD54A"/><ellipse cx="20" cy="7" rx="15" ry="4" fill="#FFE58A"/><path d="M20 1.5l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z" fill="#fff"/></svg>'
  };
  var I18N = {
    en: {
      name: 'Soya Market Radar', other: 'עברית', credit: 'Made by Soycatory',
      warn: 'Research notes, not advice. No guarantees.', terms: 'Terms',
      tabs: { radar: 'Radar', tip: 'Check a tip', watch: 'My list' },
      gateTitle: 'Before you look', gateOk: 'I understand',
      gate: ['This is research, not advice. Soya never says buy or sell.', 'Nothing is guaranteed. Notes can be wrong or late.', 'You have no head start: funds and fast traders read the same public filings in seconds, often before you.', 'You can lose money. Decide for yourself, or ask a licensed adviser.'],
      gateMore: 'Read the full terms',
      intro: 'Ideas that passed every check, ranked on Soya\'s snack ladder.',
      loading: 'Soya is reading the notes…', none: 'No notes yet. The first scan runs on the next weekday evening, Israel time.',
      offline: 'Offline. Saved copy from {d}.', failed: 'Could not load the notes right now. Try again later.',
      more: 'More', less: 'Less', past: 'Past notes ({n})',
      found: 'Found', priceThen: 'Price then', priceNow: 'Latest', what: 'What happened', why: 'Why it might be overlooked', risk: 'Main risk', wrong: 'What would prove this wrong', rankWhy: 'Why this rank', evidence: 'Evidence', sources: 'Sources', tuna: 'tuna', result: 'Result',
      kinds: { fact: 'fact', inference: 'inference', assumption: 'assumption' },
      snack: { 1: 'Fish bone', 2: 'Fish stick', 3: 'Sardines', 4: 'Tuna can', 5: 'Golden tuna' },
      crowd: { quiet: 'Few people talk about it yet', some: 'Some people already talk about it', crowded: 'Many already know, so the rank is capped' },
      tipTitle: 'Got a hot tip?', tipLine: 'Paste it. Soya checks it for warning signs on this phone. Nothing is sent.', tipLabel: 'The message',
      tipPh: 'Paste a message from Telegram, X, Discord or WhatsApp…', tipGo: 'Check this tip', tipEmpty: 'Paste a message first.',
      tipFlags: 'Warning signs', tipClean: 'No usual warning signs. That still does not make it true.',
      tipTickers: 'Check it yourself', tipNoTicker: 'Write the ticker with a $ sign (for example $NVDA) to get links.',
      tipAsk: 'Ask yourself',
      asks: ['Did the company itself file this, on TASE Maya or SEC EDGAR?', 'Who gains if you buy?', 'If so many people got this tip, what is left for you?', 'Would you still want it if nobody was in a hurry?'],
      flagsText: {
        guarantee: 'Promises a sure thing. Real investing is never sure.',
        urgency: 'Rushes you. Pressure is a classic sign of a pump.',
        percent: 'Promises a huge gain. Nobody can promise that.',
        hype: 'Hype words or rockets.',
        secret: 'Claims inside information. Real inside trading is illegal; fake "insider" tips are bait.',
        pay: 'Asks for money, a deposit or a crypto wallet.',
        link: 'Pushes you into a private group.',
        nosource: 'No link to a source.',
        shout: 'Shouting: capitals or many exclamation marks.'
      },
      watchTitle: 'My list', watchLine: 'Tickers you follow. Only on this device.', watchPh: 'Ticker, for example NVDA', watchAdd: 'Add', watchEmpty: 'Add your first ticker above.', remove: 'Remove', us: 'US', tase: 'Tel Aviv', exLabel: 'Exchange',
      lFilings: 'Filings', lQuote: 'Quote', lNews: 'News',
      hint: 'New: My list, to keep the tickers you follow.',
      howLink: 'How Soya ranks', legalLink: 'Terms and disclaimers', back: 'Back',
      howTitle: 'How Soya ranks',
      how: ['A lead can come from anywhere: news, an analyst, X, Reddit, Telegram or Discord.', 'It stays only if the company\'s own filing (TASE Maya or SEC EDGAR) or two independent newsrooms back it.', 'Soya reads the latest financial report and checks warning signs every time: a wave of posts, paid promotion, very low trading, new shares, a new auditor. Any one can drop it.', 'The rank is how well it passed, never how much it will rise. If many people already know, it cannot rank above Fish stick.', 'Each note says what would prove it wrong and stays 90 days, so misses stay visible too.'],
      ladder: 'The snack ladder', srcKey: 'Sources get 1 to 5 tuna fish for how much they can be trusted. Colours: green is a fact, amber is reasoning, coral is a guess.',
      legalTitle: 'Terms and disclaimers', legalDate: 'Last updated 21 November 2026.',
      legal: [
        'General information only. Nothing here is investment advice, a recommendation, or an offer to buy or sell any security, and nothing is tailored to your situation.',
        'Ran Lupovich and Soycatory are not licensed investment advisers, investment marketers or portfolio managers under Israel\'s Regulation of Investment Advice, Investment Marketing and Portfolio Management Law, 1995, and are not registered with the US Securities and Exchange Commission or any other regulator.',
        'No guarantees. Notes can be wrong, incomplete or out of date. Prices may be delayed. Notes are written with the help of AI (Claude, made by Anthropic), which can make mistakes.',
        'No head start. Everything comes from public sources that others see at the same time or earlier. By the time you read a note, the price may already reflect it, and many other people may be reading the same thing.',
        'Ranks (fish bone to golden tuna) describe how well an idea passed Soya\'s checks, not its chance or size of gain. Past results do not predict future results.',
        'Investing carries risk, including losing all of your money. Small and thinly traded stocks are especially risky. Consider a licensed adviser before you invest.',
        'Conflicts: Soycatory takes no payment from any company mentioned. Ran may own, buy or sell shares of companies mentioned at any time.',
        'You alone are responsible for your decisions. Soycatory and Ran are not liable for any loss from using this app.',
        'The tip checker is a simple pattern check. Finding no warning signs does not make a tip safe or true.',
        'Privacy: the app sends nothing about you. Your language, list and settings stay on this device.'
      ]
    },
    he: {
      name: 'הרדאר של סויה', other: 'English', credit: 'נוצר ב־Soycatory',
      warn: 'הערות מחקר, לא ייעוץ. בלי התחייבות.', terms: 'תנאים',
      tabs: { radar: 'רדאר', tip: 'בודקים טיפ', watch: 'הרשימה שלי' },
      gateTitle: 'לפני שמסתכלים', gateOk: 'הבנתי',
      gate: ['זה מחקר, לא ייעוץ. סויה אף פעם לא אומר לקנות או למכור.', 'שום דבר לא מובטח. הערות יכולות לטעות או לאחר.', 'אין לכם יתרון של זמן: קרנות וסוחרים מהירים קוראים את אותם דיווחים ציבוריים תוך שניות, לפעמים לפניכם.', 'אפשר להפסיד כסף. מחליטים בעצמכם, או שואלים יועץ השקעות מורשה.'],
      gateMore: 'לתנאים המלאים',
      intro: 'רעיונות שעברו כל בדיקה, מדורגים בסולם החטיפים של סויה.',
      loading: 'סויה קורא את ההערות…', none: 'עוד אין הערות. הסריקה הראשונה רצה בערב של יום החול הבא, לפי שעון ישראל.',
      offline: 'אין חיבור. עותק שנשמר ב־{d}.', failed: 'לא הצלחנו לטעון את ההערות כרגע. נסו שוב מאוחר יותר.',
      more: 'עוד', less: 'פחות', past: 'הערות קודמות ({n})',
      found: 'נמצא', priceThen: 'מחיר אז', priceNow: 'אחרון', what: 'מה קרה', why: 'למה אולי מפספסים את זה', risk: 'הסיכון העיקרי', wrong: 'מה יוכיח שזה לא נכון', rankWhy: 'למה הדירוג הזה', evidence: 'ראיות', sources: 'מקורות', tuna: 'טונה', result: 'תוצאה',
      kinds: { fact: 'עובדה', inference: 'הסקה', assumption: 'הנחה' },
      snack: { 1: 'עצם של דג', 2: 'אצבע דג', 3: 'סרדינים', 4: 'קופסת טונה', 5: 'טונה זהב' },
      crowd: { quiet: 'עוד מעט מדברים על זה', some: 'כבר מדברים על זה קצת', crowded: 'הרבה כבר יודעים, לכן הדירוג מוגבל' },
      tipTitle: 'קיבלתם טיפ חם?', tipLine: 'מדביקים אותו. סויה בודק סימני אזהרה כאן בטלפון. שום דבר לא נשלח.', tipLabel: 'ההודעה',
      tipPh: 'מדביקים הודעה מטלגרם, X, דיסקורד או וואטסאפ…', tipGo: 'בודקים את הטיפ', tipEmpty: 'קודם מדביקים הודעה.',
      tipFlags: 'סימני אזהרה', tipClean: 'אין סימני אזהרה מוכרים. זה עדיין לא אומר שזה נכון.',
      tipTickers: 'בודקים בעצמכם', tipNoTicker: 'כותבים את הסימול עם $ (למשל ‎$TEVA) כדי לקבל קישורים.',
      tipAsk: 'שואלים את עצמכם',
      asks: ['החברה עצמה דיווחה על זה, במאיה או ב־SEC EDGAR?', 'מי מרוויח אם תקנו?', 'אם כל כך הרבה אנשים קיבלו את הטיפ, מה נשאר לכם?', 'הייתם רוצים את זה גם אם אף אחד לא היה ממהר?'],
      flagsText: {
        guarantee: 'מבטיח דבר בטוח. השקעה אמיתית אף פעם לא בטוחה.',
        urgency: 'לוחץ למהר. לחץ הוא סימן מוכר לניפוח מניה.',
        percent: 'מבטיח רווח ענק. אף אחד לא יכול להבטיח את זה.',
        hype: 'מילות התלהבות או טילים.',
        secret: 'טוען למידע פנים. מסחר על מידע פנים אמיתי אסור; טיפים "פנימיים" מזויפים הם פיתיון.',
        pay: 'מבקש כסף, הפקדה או ארנק קריפטו.',
        link: 'דוחף לקבוצה סגורה.',
        nosource: 'אין קישור למקור.',
        shout: 'צעקות: אותיות גדולות או הרבה סימני קריאה.'
      },
      watchTitle: 'הרשימה שלי', watchLine: 'סימולים שאתם עוקבים אחריהם. רק במכשיר הזה.', watchPh: 'סימול, למשל TEVA', watchAdd: 'מוסיפים', watchEmpty: 'מוסיפים סימול ראשון למעלה.', remove: 'מוחקים', us: 'ארה"ב', tase: 'תל אביב', exLabel: 'בורסה',
      lFilings: 'דיווחים', lQuote: 'שער', lNews: 'חדשות',
      hint: 'חדש: הרשימה שלי, לשמור את הסימולים שאתם עוקבים אחריהם.',
      howLink: 'איך סויה מדרג', legalLink: 'תנאים והבהרות', back: 'חזרה',
      howTitle: 'איך סויה מדרג',
      how: ['רמז יכול להגיע מכל מקום: חדשות, אנליסט, X, רדיט, טלגרם או דיסקורד.', 'הוא נשאר רק אם דיווח של החברה עצמה (מאיה או SEC EDGAR) או שני כלי תקשורת נפרדים תומכים בו.', 'סויה קורא את הדוח הכספי האחרון ובודק סימני אזהרה בכל פעם: גל של פוסטים, קידום בתשלום, מסחר דל מאוד, מניות חדשות, החלפת רואה חשבון. כל אחד מהם יכול להוריד את הרעיון.', 'הדירוג הוא כמה טוב הרעיון עבר את הבדיקות, אף פעם לא כמה המניה תעלה. אם הרבה כבר יודעים, הדירוג לא עולה מעל אצבע דג.', 'כל הערה אומרת מה יוכיח שהיא לא נכונה ונשארת 90 יום, כך שגם הפספוסים נשארים גלויים.'],
      ladder: 'סולם החטיפים', srcKey: 'מקורות מקבלים 1 עד 5 דגי טונה לפי כמה אפשר לסמוך עליהם. צבעים: ירוק עובדה, ענבר הסקה, אלמוגי הנחה.',
      legalTitle: 'תנאים והבהרות', legalDate: 'עודכן לאחרונה ב־21 בנובמבר 2026.',
      legal: [
        'מידע כללי בלבד. שום דבר כאן אינו ייעוץ השקעות, המלצה, או הצעה לקנות או למכור נייר ערך כלשהו, ושום דבר אינו מותאם לצרכים שלכם.',
        'רן לופוביץ\' ו־Soycatory אינם בעלי רישיון ייעוץ השקעות, שיווק השקעות או ניהול תיקים לפי חוק הסדרת העיסוק בייעוץ השקעות, בשיווק השקעות ובניהול תיקי השקעות, התשנ"ה–1995, ואינם רשומים ברשות ניירות ערך האמריקאית (SEC) או אצל רגולטור אחר.',
        'בלי התחייבות. הערות יכולות להיות שגויות, חלקיות או לא מעודכנות. מחירים עשויים להתעכב. ההערות נכתבות בעזרת בינה מלאכותית (Claude, של אנתרופיק), שיכולה לטעות.',
        'אין יתרון של זמן. הכול מגיע ממקורות ציבוריים שאחרים רואים באותו זמן או לפני. עד שאתם קוראים הערה, ייתכן שהמחיר כבר מגלם אותה, והרבה אנשים אחרים קוראים את אותו הדבר.',
        'הדירוג (מעצם של דג ועד טונה זהב) מתאר כמה טוב רעיון עבר את הבדיקות של סויה, לא את הסיכוי או את גודל הרווח. תוצאות עבר אינן מנבאות תוצאות עתידיות.',
        'השקעה כרוכה בסיכון, כולל הפסד של כל הכסף. מניות קטנות ודלות מסחר מסוכנות במיוחד. שקלו לפנות ליועץ השקעות מורשה לפני שאתם משקיעים.',
        'ניגוד עניינים: Soycatory לא מקבלת תשלום מאף חברה שמוזכרת. רן עשוי להחזיק, לקנות או למכור מניות של חברות שמוזכרות, בכל זמן.',
        'האחריות להחלטות שלכם היא שלכם בלבד. Soycatory ורן אינם אחראים לשום הפסד שנובע משימוש באפליקציה.',
        'בודק הטיפים הוא בדיקת דפוסים פשוטה. אם לא נמצאו סימני אזהרה, זה לא אומר שהטיפ בטוח או נכון.',
        'פרטיות: האפליקציה לא שולחת שום דבר עליכם. השפה, הרשימה וההגדרות נשארות במכשיר הזה.'
      ]
    }
  };

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* fine */ } }
  var lang = get(K.lang); if (!I18N[lang]) lang = /^(he|iw)/i.test(navigator.language || '') ? 'he' : 'en';
  var visits = (+get(K.visits) || 0) + 1; put(K.visits, String(visits));
  var view = 'radar', open = {}, notes = null, notesState = 'loading', notesSaved = '', tipText = '', tipResult = null;
  function t(k) { return I18N[lang][k]; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pick(o, f) { return (lang === 'he' && o[f + '_he']) || o[f] || ''; }
  function dateText(d) { try { return new Date(d).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return d; } }
  function safeUrl(u) { return /^https:\/\//.test(u || '') ? u : ''; }
  function accepted() { return get(K.ok) === '1'; }
  /* "Reveal more over time": My list appears from the second visit, or after a checked tip or an opened note. */
  function unlocked() { return get(K.unlock) === '1' || visits >= 2; }
  function unlock() { if (get(K.unlock) !== '1') { put(K.unlock, '1'); } }

  function links(sym, ex) {
    var s = encodeURIComponent(sym.toUpperCase());
    if (ex === 'TASE') return [
      { l: t('lFilings'), u: 'https://maya.tase.co.il/' },
      { l: t('lQuote'), u: 'https://finance.yahoo.com/quote/' + s + '.TA' },
      { l: t('lNews'), u: 'https://news.google.com/search?q=' + s + '%20' + encodeURIComponent('בורסה') + '&hl=he&gl=IL' }
    ];
    return [
      { l: t('lFilings'), u: 'https://www.sec.gov/edgar/search/#/q=' + s },
      { l: t('lQuote'), u: 'https://finance.yahoo.com/quote/' + s },
      { l: t('lNews'), u: 'https://news.google.com/search?q=' + s + '%20stock' }
    ];
  }
  function linkRow(arr) { return '<div class="links">' + arr.map(function (x) { return '<a href="' + esc(x.u) + '" target="_blank" rel="noopener">' + esc(x.l) + '</a>'; }).join('') + '</div>'; }
  function snack(r) { r = Math.max(1, Math.min(5, r | 0 || 2)); return '<span class="snack r' + r + '">' + SNACK[r] + '<b>' + esc(t('snack')[r]) + '</b></span>'; }

  /* ---------- Radar ---------- */
  function loadNotes() {
    var C = window.SOYA_RADAR_CONFIG || {};
    if (!C.url || !C.key) { notesState = 'ok'; notes = []; render(); return; }
    fetch(C.url + '/rest/v1/mr_items?select=*&published=eq.true&order=found_on.desc,id.desc&limit=60', { headers: { apikey: C.key, Authorization: 'Bearer ' + C.key } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rows) { notes = Array.isArray(rows) ? rows : []; notesState = 'ok'; put(K.cache, JSON.stringify({ at: new Date().toISOString(), rows: notes })); render(); })
      .catch(function () {
        var c = null; try { c = JSON.parse(get(K.cache) || 'null'); } catch (e) { c = null; }
        if (c && c.rows) { notes = c.rows; notesSaved = c.at; notesState = 'offline'; } else { notes = []; notesState = 'failed'; }
        render();
      });
  }
  function para(label, text) { return text ? '<p><span class="label">' + esc(label) + '</span><br><span dir="auto">' + esc(text) + '</span></p>' : ''; }
  function noteCard(n) {
    var isOpen = !!open[n.id];
    var ch = (n.price_then && n.price_now) ? ((n.price_now / n.price_then - 1) * 100) : null;
    var h = '<article class="card note">' +
      '<div class="row between">' + snack(n.rank) + '<span class="tick">' + esc(n.ticker) + ' · ' + esc(n.exchange) + '</span></div>' +
      '<h3 dir="auto">' + esc(pick(n, 'name')) + '</h3>' +
      '<p dir="auto">' + esc(pick(n, 'what')) + '</p>' +
      '<p class="mute small">' + esc(t('crowd')[n.crowd] || '') + (ch != null ? ' · <bdi class="' + (ch >= 0 ? 'up' : 'down') + '">' + (ch >= 0 ? '+' : '') + ch.toFixed(1) + '%</bdi>' : '') + '</p>' +
      '<button type="button" class="ghost more" data-open="' + esc(n.id) + '" aria-expanded="' + isOpen + '">' + esc(isOpen ? t('less') : t('more')) + '</button>';
    if (isOpen) {
      var ev = (n.evidence || []).map(function (e) { var k = I18N.en.kinds[e.k] ? e.k : 'assumption'; return '<li><span class="chip k-' + k + '">' + esc(t('kinds')[k]) + '</span> <span dir="auto">' + esc((lang === 'he' && e.t_he) || e.t) + '</span></li>'; }).join('');
      var src = (n.sources || []).filter(function (s) { return safeUrl(s.url); }).map(function (s) { var f = Math.max(1, Math.min(5, s.tuna | 0)); return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener" dir="auto">' + esc(s.title || s.url) + '</a> <span class="mute small" aria-label="' + f + ' ' + esc(t('tuna')) + '">' + '🐟'.repeat(f) + '</span></li>'; }).join('');
      h += '<div class="detail">' +
        '<dl><dt>' + esc(t('found')) + '</dt><dd>' + esc(dateText(n.found_on)) + '</dd>' +
        (n.price_then != null ? '<dt>' + esc(t('priceThen')) + '</dt><dd><bdi>' + esc(n.price_then) + ' ' + esc(n.currency || '') + '</bdi>' + (n.market_value ? ' <span class="mute small">(' + esc(n.market_value) + ')</span>' : '') + '</dd>' : '') +
        (n.price_now != null ? '<dt>' + esc(t('priceNow')) + '</dt><dd><bdi>' + esc(n.price_now) + ' ' + esc(n.currency || '') + '</bdi>' + (n.checked_on ? ' <span class="mute small">' + esc(dateText(n.checked_on)) + '</span>' : '') + '</dd>' : '') +
        '</dl>' +
        para(t('rankWhy'), pick(n, 'rank_why')) + para(t('why'), pick(n, 'why')) + para(t('risk'), pick(n, 'risk')) + para(t('wrong'), pick(n, 'wrong_if')) + para(t('result'), pick(n, 'result')) +
        (ev ? '<p class="label">' + esc(t('evidence')) + '</p><ol class="ev">' + ev + '</ol>' : '') +
        (src ? '<p class="label">' + esc(t('sources')) + '</p><ol>' + src + '</ol>' : '') +
        linkRow(links(n.ticker, n.exchange === 'TASE' ? 'TASE' : 'US')) + '</div>';
    }
    return h + '</article>';
  }
  function viewRadar() {
    var h = '<div class="intro"><img src="assets/soya-glasses.svg" alt="" width="56" height="62"><p class="mute">' + esc(t('intro')) + '</p></div>';
    if (notesState === 'loading') return h + '<p class="mute">' + esc(t('loading')) + '</p>';
    if (notesState === 'failed') return h + '<p class="card empty">' + esc(t('failed')) + '</p>';
    if (notesState === 'offline') h += '<p class="mute small">' + esc(t('offline').replace('{d}', dateText(notesSaved))) + '</p>';
    var live = notes.filter(function (n) { return n.status === 'watching'; }).sort(function (a, b) { return (b.rank - a.rank) || (a.found_on < b.found_on ? 1 : -1); });
    var past = notes.filter(function (n) { return n.status !== 'watching'; });
    if (!live.length && !past.length) return h + '<p class="card empty">' + esc(t('none')) + '</p>';
    h += live.length ? live.map(noteCard).join('') : '<p class="card empty">' + esc(t('none')) + '</p>';
    if (past.length) h += '<details class="past"><summary>' + esc(t('past').replace('{n}', past.length)) + '</summary>' + past.map(noteCard).join('') + '</details>';
    return h;
  }

  /* ---------- Tip checker (this device only) ---------- */
  var RX = {
    guarantee: /guarantee|risk[- ]?free|can'?t lose|sure thing|100% safe|no risk|מובטח|בטוח ב-?100|ללא סיכון|בלי סיכון|אי אפשר להפסיד/i,
    urgency: /\bnow\b|today only|last chance|hurry|before it'?s too late|don'?t miss|act fast|עכשיו|מהר|הזדמנות אחרונה|רק היום|לפני שיהיה מאוחר|אל תפספס/i,
    percent: /\b\d{3,5}\s?%|\b[1-9]\d\s?%\s*(in|ב)|\b\d{1,3}x\b|\bx\d{1,3}\b|פי\s?\d{1,3}/i,
    hype: /moon|🚀|rocket|next (tesla|nvidia|amazon)|gem\b|explode|skyrocket|לירח|טיל|הטסלה הבאה|תתפוצץ|יזנק/i,
    secret: /insider|secret|confidential|leak|vip|private (group|signal)|signal group|מידע פנים|סודי|מודלף|קבוצה סגורה/i,
    pay: /deposit|wallet|usdt|bitcoin|btc|send (money|funds)|subscription|pay (now|to join)|premium group|הפקד|ארנק|תשלום|העבר(ה|ו)|מנוי/i,
    link: /t\.me\/|wa\.me\/|chat\.whatsapp\.com|discord\.gg\/|join (my|our) (group|channel)|הצטרפו לקבוצה|לינק לקבוצה/i
  };
  function checkTip(text) {
    var flags = [];
    Object.keys(RX).forEach(function (k) { if (RX[k].test(text)) flags.push(k); });
    if (!/https?:\/\//i.test(text)) flags.push('nosource');
    var letters = text.replace(/[^A-Za-z]/g, ''), caps = text.replace(/[^A-Z]/g, '');
    if ((letters.length > 20 && caps.length / letters.length > 0.5) || (text.match(/!/g) || []).length >= 3) flags.push('shout');
    var seen = {}, tickers = [];
    (text.match(/\$[A-Za-z]{1,6}(\.[A-Za-z]{1,2})?\b/g) || []).forEach(function (m) {
      var s = m.slice(1).toUpperCase(), ex = /\.TA$/.test(s) ? 'TASE' : 'US'; s = s.replace(/\.TA$/, '');
      if (!seen[s]) { seen[s] = 1; tickers.push({ s: s, ex: ex }); }
    });
    return { flags: flags, tickers: tickers.slice(0, 6) };
  }
  function viewTip() {
    var h = '<section class="card"><h1>' + esc(t('tipTitle')) + '</h1><p class="mute">' + esc(t('tipLine')) + '</p>' +
      '<label class="label" for="tip-box">' + esc(t('tipLabel')) + '</label><textarea id="tip-box" dir="' + (lang === 'he' ? 'rtl' : 'ltr') + '" maxlength="4000" placeholder="' + esc(t('tipPh')) + '">' + esc(tipText) + '</textarea>' +
      '<div><button type="button" class="primary" id="tip-go">' + esc(t('tipGo')) + '</button></div></section>';
    if (tipResult === 'empty') return h + '<p class="mute">' + esc(t('tipEmpty')) + '</p>';
    if (!tipResult) return h;
    var r = tipResult;
    h += '<section class="card" id="tip-out"><h2>' + esc(t('tipFlags')) + (r.flags.length ? ' <span class="count">' + r.flags.length + '</span>' : '') + '</h2>' + (r.flags.length ? '<ol class="flags">' + r.flags.map(function (f) { return '<li>' + esc(t('flagsText')[f]) + '</li>'; }).join('') + '</ol>' : '<p class="ok">' + esc(t('tipClean')) + '</p>') + '</section>';
    h += '<section class="card"><h2>' + esc(t('tipTickers')) + '</h2>' + (r.tickers.length ? r.tickers.map(function (x) { return '<div class="watch-item"><span class="tick">' + esc(x.s) + ' · ' + esc(x.ex === 'TASE' ? t('tase') : t('us')) + '</span>' + linkRow(links(x.s, x.ex)) + '</div>'; }).join('') : '<p class="mute">' + esc(t('tipNoTicker')) + '</p>') +
      '<p class="label">' + esc(t('tipAsk')) + '</p><ol>' + t('asks').map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ol></section>';
    return h;
  }

  /* ---------- My list (this device only) ---------- */
  function watchList() { try { var w = JSON.parse(get(K.watch) || '[]'); return Array.isArray(w) ? w.filter(function (x) { return x && /^[A-Z0-9.]{1,12}$/.test(x.s); }) : []; } catch (e) { return []; } }
  function viewWatch() {
    var w = watchList();
    var h = '<section class="card"><h1>' + esc(t('watchTitle')) + '</h1><p class="mute">' + esc(t('watchLine')) + '</p>' +
      '<form class="watch-add" id="watch-form"><label class="label" for="watch-sym">' + esc(t('watchPh')) + '</label><input id="watch-sym" dir="ltr" autocomplete="off" maxlength="12">' +
      '<label class="label" for="watch-ex">' + esc(t('exLabel')) + '</label><select id="watch-ex"><option value="US">' + esc(t('us')) + '</option><option value="TASE">' + esc(t('tase')) + '</option></select>' +
      '<button type="submit" class="ghost">' + esc(t('watchAdd')) + '</button></form></section>';
    if (!w.length) return h + '<p class="card empty">' + esc(t('watchEmpty')) + '</p>';
    return h + w.map(function (x, i) {
      return '<section class="card watch-item"><div class="row between"><span class="tick">' + esc(x.s) + ' · ' + esc(x.ex === 'TASE' ? t('tase') : t('us')) + '</span><button type="button" class="ghost" data-rm="' + i + '">' + esc(t('remove')) + '</button></div>' + linkRow(links(x.s, x.ex)) + '</section>';
    }).join('');
  }

  function backBtn() { return '<button type="button" class="ghost" data-go="radar">' + esc(t('back')) + '</button>'; }
  function viewHow() {
    return '<section class="card"><h1>' + esc(t('howTitle')) + '</h1><ol>' + t('how').map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
      '<h2>' + esc(t('ladder')) + '</h2><ol class="ladder">' + [1, 2, 3, 4, 5].map(function (r) { return '<li>' + snack(r) + '</li>'; }).join('') + '</ol>' +
      '<p class="mute small">' + esc(t('srcKey')) + '</p></section>' + backBtn();
  }
  function viewLegal() {
    return '<section class="card"><h1>' + esc(t('legalTitle')) + '</h1><ol>' + t('legal').map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><p class="mute small">' + esc(t('legalDate')) + '</p></section>' + backBtn();
  }
  function viewGate() {
    return '<section class="card gate"><img src="assets/soya-glasses.svg" alt="" width="72" height="79"><h1>' + esc(t('gateTitle')) + '</h1><ol>' + t('gate').map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
      '<div class="row"><button type="button" class="primary" id="gate-ok">' + esc(t('gateOk')) + '</button><button type="button" class="linkish" data-go="legal">' + esc(t('gateMore')) + '</button></div></section>';
  }

  function render() {
    var doc = document.documentElement; doc.lang = lang; doc.dir = lang === 'he' ? 'rtl' : 'ltr'; document.title = t('name');
    document.getElementById('brand-title').textContent = t('name');
    document.getElementById('credit').textContent = t('credit');
    document.getElementById('warn').innerHTML = esc(t('warn')) + ' <button type="button" class="linkish" data-go="legal">' + esc(t('terms')) + '</button>';
    var tg = document.getElementById('lang-toggle'); tg.textContent = t('other'); tg.setAttribute('lang', lang === 'he' ? 'en' : 'he');
    var gate = !accepted() && view !== 'legal';
    var tabs = gate ? [] : ['radar', 'tip'].concat(unlocked() ? ['watch'] : []);
    var showHint = !gate && unlocked() && get(K.hint) !== '1';
    document.getElementById('tabs').innerHTML = (showHint ? '<p class="hint">' + esc(t('hint')) + '</p>' : '') + tabs.map(function (k) { return '<button type="button" data-go="' + k + '"' + (k === view ? ' aria-current="page"' : '') + '>' + esc(t('tabs')[k]) + '</button>'; }).join('');
    if (showHint) put(K.hint, '1');
    document.getElementById('foot-links').innerHTML = gate ? '' : '<button type="button" class="linkish" data-go="how">' + esc(t('howLink')) + '</button><button type="button" class="linkish" data-go="legal">' + esc(t('legalLink')) + '</button>';
    var app = document.getElementById('app');
    app.innerHTML = gate ? viewGate() : view === 'tip' ? viewTip() : view === 'watch' ? viewWatch() : view === 'how' ? viewHow() : view === 'legal' ? viewLegal() : viewRadar();
  }

  function go(v) { view = v; render(); window.scrollTo(0, 0); }
  document.getElementById('lang-toggle').addEventListener('click', function () { lang = lang === 'he' ? 'en' : 'he'; put(K.lang, lang); render(); });
  document.body.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]'); if (g) { go(g.getAttribute('data-go')); return; }
    if (e.target.id === 'gate-ok') { put(K.ok, '1'); go('radar'); return; }
    if (e.target.id === 'tip-go') {
      tipText = document.getElementById('tip-box').value;
      tipResult = tipText.trim() ? checkTip(tipText) : 'empty';
      if (tipResult !== 'empty') unlock();
      render(); var o = document.getElementById('tip-out'); if (o) o.scrollIntoView({ block: 'start' }); return;
    }
    var op = e.target.closest('[data-open]');
    if (op) { var id = op.getAttribute('data-open'); open[id] = !open[id]; unlock(); render(); var b = document.querySelector('[data-open="' + id + '"]'); if (b) b.focus(); return; }
    var rm = e.target.closest('[data-rm]');
    if (rm) { var w = watchList(); w.splice(+rm.getAttribute('data-rm'), 1); put(K.watch, JSON.stringify(w)); render(); }
  });
  document.getElementById('app').addEventListener('input', function (e) { if (e.target.id === 'tip-box') tipText = e.target.value; });
  document.getElementById('app').addEventListener('submit', function (e) {
    if (e.target.id !== 'watch-form') return; e.preventDefault();
    var s = (document.getElementById('watch-sym').value || '').trim().toUpperCase().replace(/^\$/, ''), ex = document.getElementById('watch-ex').value;
    if (!/^[A-Z0-9.]{1,12}$/.test(s)) return;
    var w = watchList(); if (!w.some(function (x) { return x.s === s && x.ex === ex; })) w.unshift({ s: s, ex: ex }); put(K.watch, JSON.stringify(w.slice(0, 40))); render();
  });

  render(); loadNotes();
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  window.SoyaRadarCheck = checkTip;   /* for the tests */
})();
