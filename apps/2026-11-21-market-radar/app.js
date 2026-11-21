/* Soya Market Radar. Three parts:
   1. Radar: research notes from Ran's weekday scan, read (never written) from the published list in config.js.
   2. Check a tip: paste a message from Telegram, X, Discord or WhatsApp; Soya looks for the usual warning signs on
      this device only (nothing is sent) and gives links to check the official filings yourself.
   3. Watch list: your own tickers with quick links, kept on this device only.
   Not investment advice. Stored on the device: language, watch list, and the last copy of the notes for offline use. */
(function () {
  'use strict';

  var K = { lang: 'soya-radar-lang', watch: 'soya-radar-watch', cache: 'soya-radar-cache', tab: 'soya-radar-tab' };
  var I18N = {
    en: {
      name: 'Soya Market Radar', other: 'עברית', credit: 'Made by Soycatory',
      warn: 'Research notes, not investment advice. Soya does not tell anyone to buy or sell, and nothing here is a price target. Small stocks can fall as fast as they rise. Check the official filings yourself.',
      tabs: { radar: 'Radar', tip: 'Check a tip', watch: 'My watch list', how: 'How Soya picks' },
      heroTitle: "Soya's research desk", heroLine: 'Every weekday after the Tel Aviv close, Soya reads company reports, exchange filings and the news, uses posts from X, Telegram and Discord only as leads, and keeps the few ideas that survive every check.',
      loading: 'Soya is reading the notes…', none: 'No notes yet. The first scan runs on the next weekday evening, Israel time. Nothing gets in without an official source.',
      offline: 'You are offline. This is the copy saved on {d}.', failed: 'Could not load the notes right now. Try again later.',
      found: 'Found', priceThen: 'Price then', priceNow: 'Latest checked', what: 'What happened', why: 'Why it might be overlooked', risk: 'Main risk', wrong: 'What would prove this wrong', evidence: 'Evidence', sources: 'Sources', tuna: 'tuna', result: 'Result',
      kinds: { fact: 'fact', inference: 'inference', assumption: 'assumption' }, status: { watching: 'followed for 90 days', closed: 'closed', dropped: 'dropped' },
      tipTitle: 'Got a hot tip?', tipLine: 'Paste the message here. Soya checks it for the usual warning signs, right on this phone. Nothing is sent anywhere.',
      tipLabel: 'The message', tipPh: 'Paste a message from Telegram, X, Discord or WhatsApp…', tipGo: 'Check this tip', tipEmpty: 'Paste a message first.',
      tipFlags: 'Warning signs Soya found', tipClean: 'Soya found none of the usual warning signs. That does not make it true: check the filings below.',
      tipTickers: 'Check these tickers yourself', tipNoTicker: 'No ticker found. Write it with a $ sign (for example $NVDA) to get links.',
      tipAsk: 'Questions to ask before you believe it',
      asks: ['Is there a filing from the company itself, on TASE Maya or SEC EDGAR, that says the same thing?', 'Who gains if you buy? People who already own it, or who are paid to promote it, gain from your buying.', 'Can you sell easily? Look at how many shares trade on a normal day.', 'Would you still want it if nobody was in a hurry?'],
      flagsText: {
        guarantee: 'Promises a sure thing ("guaranteed", "can\'t lose"). Real investing is never sure.',
        urgency: 'Rushes you ("now", "last chance"). Pressure is a classic sign of a pump.',
        percent: 'Promises a huge gain (big % or "10x"). Nobody can promise that.',
        hype: 'Hype words or rockets ("to the moon", "next Tesla", 🚀).',
        secret: 'Claims secret or insider information. Trading on real inside information is illegal; fake "insider" tips are common bait.',
        pay: 'Asks for money, a deposit, a crypto wallet or a paid group.',
        link: 'Pushes you into a private group or chat link.',
        nosource: 'Gives no link to a source.',
        shout: 'Lots of capitals or exclamation marks.'
      },
      watchTitle: 'My watch list', watchLine: 'Tickers you want to follow. Kept only on this device.', watchPh: 'Ticker, for example NVDA or TEVA', watchAdd: 'Add to my list', watchEmpty: 'Your list is empty. Add a ticker above.', remove: 'Remove', us: 'US', tase: 'Tel Aviv',
      lFilings: 'Filings', lQuote: 'Quote', lNews: 'News',
      howTitle: 'How a lead becomes a note',
      how: ['A lead can come from anywhere: news, an analyst note, a post on X or Reddit, or a Telegram or Discord message.', 'It is kept only if an official source backs it: the company\'s own report, an exchange filing (TASE Maya or SEC EDGAR), or two independent newsrooms.', 'The numbers come from the latest financial report: revenue growth, cash and debt, cash burn, margins and new shares.', 'Signs the market may be slow to see: a new large contract, insiders buying with their own money, a turn to profit, a big holder buying more, little analyst coverage, a low price against the company\'s own numbers.', 'Warning signs are checked every time: a sudden wave of posts or paid promotion, very low trading, new shares, going-concern language, a new auditor, a story with no filing. Any one can drop the idea.', 'Every note says what would prove it wrong, and is followed for 90 days so misses stay on the page as well as hits.'],
      howKey: 'Colours: green is a fact in a source, amber is an inference reasoned from facts, coral is an assumption. Tuna fish rate how much a source can be trusted, from 1 to 5.',
      howMade: 'Written with Claude, which Anthropic makes. Soya never trades, never posts and never joins a group.'
    },
    he: {
      name: 'הרדאר של סויה', other: 'English', credit: 'נוצר ב־Soycatory',
      warn: 'אלה הערות מחקר, לא ייעוץ השקעות. סויה לא אומר לאף אחד לקנות או למכור, ואין כאן מחיר יעד. מניות קטנות יכולות לרדת מהר כמו שעלו. בודקים בעצמכם את הדיווחים הרשמיים.',
      tabs: { radar: 'רדאר', tip: 'בודקים טיפ', watch: 'הרשימה שלי', how: 'איך סויה בוחר' },
      heroTitle: 'שולחן המחקר של סויה', heroLine: 'בכל יום חול אחרי סגירת הבורסה בתל אביב, סויה קורא דוחות של חברות, דיווחים לבורסה וחדשות, משתמש בפוסטים מ־X, טלגרם ודיסקורד רק כרמזים לבדיקה, ושומר רק את הרעיונות המעטים שעוברים כל בדיקה.',
      loading: 'סויה קורא את ההערות…', none: 'עוד אין הערות. הסריקה הראשונה רצה בערב של יום החול הבא, לפי שעון ישראל. שום דבר לא נכנס בלי מקור רשמי.',
      offline: 'אין חיבור. זה העותק שנשמר ב־{d}.', failed: 'לא הצלחנו לטעון את ההערות כרגע. נסו שוב מאוחר יותר.',
      found: 'נמצא', priceThen: 'מחיר אז', priceNow: 'נבדק לאחרונה', what: 'מה קרה', why: 'למה אולי מפספסים את זה', risk: 'הסיכון העיקרי', wrong: 'מה יוכיח שזה לא נכון', evidence: 'ראיות', sources: 'מקורות', tuna: 'טונה', result: 'תוצאה',
      kinds: { fact: 'עובדה', inference: 'הסקה', assumption: 'הנחה' }, status: { watching: 'במעקב 90 יום', closed: 'נסגר', dropped: 'ירד מהרשימה' },
      tipTitle: 'קיבלתם טיפ חם?', tipLine: 'מדביקים כאן את ההודעה. סויה בודק את סימני האזהרה המוכרים, כאן בטלפון. שום דבר לא נשלח לשום מקום.',
      tipLabel: 'ההודעה', tipPh: 'מדביקים הודעה מטלגרם, X, דיסקורד או וואטסאפ…', tipGo: 'בודקים את הטיפ', tipEmpty: 'קודם מדביקים הודעה.',
      tipFlags: 'סימני אזהרה שסויה מצא', tipClean: 'סויה לא מצא את סימני האזהרה המוכרים. זה עדיין לא אומר שזה נכון: בודקים את הדיווחים בקישורים למטה.',
      tipTickers: 'בודקים את הסימולים האלה בעצמכם', tipNoTicker: 'לא נמצא סימול. כותבים אותו עם סימן $ (למשל ‎$TEVA) כדי לקבל קישורים.',
      tipAsk: 'שאלות לפני שמאמינים',
      asks: ['יש דיווח של החברה עצמה, במאיה או ב־SEC EDGAR, שאומר את אותו הדבר?', 'מי מרוויח אם תקנו? מי שכבר מחזיק במניה, או מי שמשלמים לו לקדם אותה, מרוויח מהקנייה שלכם.', 'אפשר למכור בקלות? בודקים כמה מניות נסחרות ביום רגיל.', 'הייתם רוצים את זה גם אם אף אחד לא היה ממהר?'],
      flagsText: {
        guarantee: 'מבטיח דבר בטוח ("מובטח", "אי אפשר להפסיד"). השקעה אמיתית אף פעם לא בטוחה.',
        urgency: 'לוחץ עליכם למהר ("עכשיו", "הזדמנות אחרונה"). לחץ הוא סימן מוכר לניפוח מניה.',
        percent: 'מבטיח רווח ענק (אחוזים גבוהים או "פי 10"). אף אחד לא יכול להבטיח את זה.',
        hype: 'מילות התלהבות או טילים ("לירח", "הטסלה הבאה", 🚀).',
        secret: 'טוען למידע סודי או פנימי. מסחר על מידע פנים אמיתי אסור בחוק; טיפים "פנימיים" מזויפים הם פיתיון נפוץ.',
        pay: 'מבקש כסף, הפקדה, ארנק קריפטו או קבוצה בתשלום.',
        link: 'דוחף אתכם לקבוצה סגורה או לקישור לצ\'אט.',
        nosource: 'אין קישור למקור.',
        shout: 'הרבה אותיות גדולות או סימני קריאה.'
      },
      watchTitle: 'הרשימה שלי', watchLine: 'סימולים שאתם רוצים לעקוב אחריהם. נשמרים רק במכשיר הזה.', watchPh: 'סימול, למשל NVDA או TEVA', watchAdd: 'מוסיפים לרשימה', watchEmpty: 'הרשימה ריקה. מוסיפים סימול למעלה.', remove: 'מוחקים', us: 'ארה"ב', tase: 'תל אביב',
      lFilings: 'דיווחים', lQuote: 'שער', lNews: 'חדשות',
      howTitle: 'איך רמז הופך להערה',
      how: ['רמז יכול להגיע מכל מקום: חדשות, הערת אנליסט, פוסט ב־X או ברדיט, או הודעה בטלגרם או בדיסקורד.', 'הוא נשאר רק אם מקור רשמי תומך בו: דוח של החברה, דיווח לבורסה (מאיה או SEC EDGAR), או שני כלי תקשורת נפרדים.', 'המספרים מגיעים מהדוח הכספי האחרון: צמיחה בהכנסות, מזומן וחוב, קצב שריפת מזומן, שולי רווח והנפקות חדשות.', 'סימנים שהשוק אולי מפספס: חוזה גדול חדש, בעלי עניין שקונים בכסף שלהם, מעבר לרווח, בעל מניות גדול שמגדיל, מעט סיקור של אנליסטים, מחיר נמוך ביחס למספרים של החברה עצמה.', 'סימני אזהרה נבדקים בכל פעם: גל פתאומי של פוסטים או קידום בתשלום, מסחר דל מאוד, מניות חדשות, אזהרת "עסק חי", החלפת רואה חשבון, סיפור בלי דיווח. כל אחד מהם יכול להוריד את הרעיון.', 'כל הערה אומרת מה יוכיח שהיא לא נכונה, ונשארת במעקב 90 יום, כך שגם הפספוסים נשארים בעמוד ולא רק ההצלחות.'],
      howKey: 'צבעים: ירוק הוא עובדה ממקור, ענבר הוא הסקה מעובדות, אלמוגי הוא הנחה. דגי טונה מדרגים כמה אפשר לסמוך על מקור, מ־1 עד 5.',
      howMade: 'נכתב בעזרת Claude, שאנתרופיק מפתחת. סויה אף פעם לא סוחר, לא מפרסם ולא מצטרף לקבוצות.'
    }
  };

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* fine */ } }
  var lang = get(K.lang); if (!I18N[lang]) lang = /^(he|iw)/i.test(navigator.language || '') ? 'he' : 'en';
  var tab = get(K.tab); if (['radar', 'tip', 'watch', 'how'].indexOf(tab) < 0) tab = 'radar';
  var notes = null, notesState = 'loading', notesSaved = '', tipText = '', tipResult = null;
  function t(k) { return I18N[lang][k]; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pick(o, f) { return (lang === 'he' && o[f + '_he']) || o[f] || ''; }
  function dateText(d) { try { return new Date(d).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return d; } }
  function boxDir() { return lang === 'he' ? 'rtl' : 'ltr'; }
  function safeUrl(u) { return /^https:\/\//.test(u || '') ? u : ''; }

  /* Links to check a ticker in official places. */
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

  /* ---------- Radar notes ---------- */
  function loadNotes() {
    var C = window.SOYA_RADAR_CONFIG || {};
    if (!C.url || !C.key) { notesState = 'none'; notes = []; render(); return; }
    fetch(C.url + '/rest/v1/mr_items?select=*&published=eq.true&order=found_on.desc,id.desc&limit=60', { headers: { apikey: C.key, Authorization: 'Bearer ' + C.key } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rows) { notes = Array.isArray(rows) ? rows : []; notesState = 'ok'; put(K.cache, JSON.stringify({ at: new Date().toISOString(), rows: notes })); render(); })
      .catch(function () {
        var c = null; try { c = JSON.parse(get(K.cache) || 'null'); } catch (e) { c = null; }
        if (c && c.rows) { notes = c.rows; notesSaved = c.at; notesState = 'offline'; } else { notes = []; notesState = 'failed'; }
        render();
      });
  }
  function noteCard(n) {
    var ch = (n.price_then && n.price_now) ? ((n.price_now / n.price_then - 1) * 100) : null;
    var ev = (n.evidence || []).map(function (e) { var k = I18N.en.kinds[e.k] ? e.k : 'assumption'; return '<li><span class="chip k-' + k + '">' + esc(t('kinds')[k]) + '</span> <span dir="auto">' + esc((lang === 'he' && e.t_he) || e.t) + '</span></li>'; }).join('');
    var src = (n.sources || []).filter(function (s) { return safeUrl(s.url); }).map(function (s) { var f = Math.max(1, Math.min(5, s.tuna | 0)); return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title || s.url) + '</a> <span class="mute small" aria-label="' + f + ' ' + esc(t('tuna')) + '">' + '🐟'.repeat(f) + '</span></li>'; }).join('');
    return '<article class="card">' +
      '<div class="row"><span class="tick">' + esc(n.ticker) + ' · ' + esc(n.exchange) + '</span><span class="chip">' + esc(t('status')[n.status] || n.status) + '</span></div>' +
      '<h3 dir="auto">' + esc(pick(n, 'name')) + '</h3>' +
      '<dl><dt>' + esc(t('found')) + '</dt><dd>' + esc(dateText(n.found_on)) + '</dd>' +
      (n.price_then != null ? '<dt>' + esc(t('priceThen')) + '</dt><dd><bdi>' + esc(n.price_then) + ' ' + esc(n.currency || '') + '</bdi>' + (n.market_value ? ' <span class="mute small">(' + esc(n.market_value) + ')</span>' : '') + '</dd>' : '') +
      (n.price_now != null ? '<dt>' + esc(t('priceNow')) + '</dt><dd><bdi>' + esc(n.price_now) + ' ' + esc(n.currency || '') + '</bdi>' + (ch != null ? ' <span class="' + (ch >= 0 ? 'up' : 'down') + '"><bdi>' + (ch >= 0 ? '+' : '') + ch.toFixed(1) + '%</bdi></span>' : '') + (n.checked_on ? ' <span class="mute small">' + esc(dateText(n.checked_on)) + '</span>' : '') + '</dd>' : '') +
      '</dl>' +
      '<p><span class="label">' + esc(t('what')) + '</span><br><span dir="auto">' + esc(pick(n, 'what')) + '</span></p>' +
      '<p><span class="label">' + esc(t('why')) + '</span><br><span dir="auto">' + esc(pick(n, 'why')) + '</span></p>' +
      '<p><span class="label">' + esc(t('risk')) + '</span><br><span dir="auto">' + esc(pick(n, 'risk')) + '</span></p>' +
      '<p><span class="label">' + esc(t('wrong')) + '</span><br><span dir="auto">' + esc(pick(n, 'wrong_if')) + '</span></p>' +
      (n.result ? '<p><span class="label">' + esc(t('result')) + '</span><br><span dir="auto">' + esc(pick(n, 'result')) + '</span></p>' : '') +
      (ev ? '<details><summary>' + esc(t('evidence')) + '</summary><ol class="ev">' + ev + '</ol></details>' : '') +
      (src ? '<details><summary>' + esc(t('sources')) + '</summary><ol>' + src + '</ol></details>' : '') +
      linkRow(links(n.ticker, n.exchange === 'TASE' ? 'TASE' : 'US')) +
      '</article>';
  }
  function viewRadar() {
    var h = '<section class="card hero"><img src="assets/soya-glasses.svg" alt="" width="92" height="101"><div><h1>' + esc(t('heroTitle')) + '</h1><p class="mute">' + esc(t('heroLine')) + '</p></div></section>';
    if (notesState === 'loading') return h + '<p class="mute">' + esc(t('loading')) + '</p>';
    if (notesState === 'failed') return h + '<p class="card empty">' + esc(t('failed')) + '</p>';
    if (notesState === 'offline') h += '<p class="mute small">' + esc(t('offline').replace('{d}', dateText(notesSaved))) + '</p>';
    if (!notes.length) return h + '<p class="card empty">' + esc(t('none')) + '</p>';
    return h + notes.map(noteCard).join('');
  }

  /* ---------- Tip checker (runs on this device only) ---------- */
  var RX = {
    guarantee: /guarantee|risk[- ]?free|can'?t lose|sure thing|100% safe|no risk|מובטח|בטוח ב-?100|ללא סיכון|בלי סיכון|אי אפשר להפסיד/i,
    urgency: /\bnow\b|today only|last chance|hurry|before it'?s too late|don'?t miss|act fast|right now|עכשיו|מהר|הזדמנות אחרונה|רק היום|לפני שיהיה מאוחר|אל תפספס/i,
    percent: /\b\d{3,5}\s?%|\b[1-9]\d\s?%\s*(in|ב)|\b\d{1,3}x\b|\bx\d{1,3}\b|פי\s?\d{1,3}/i,
    hype: /moon|🚀|rocket|next (tesla|nvidia|amazon)|gem\b|explode|skyrocket|לירח|טיל|הטסלה הבאה|תתפוצץ|יזנק/i,
    secret: /insider|secret|confidential|leak|vip|private (group|signal)|signal group|מידע פנים|סודי|מודלף|קבוצה סגורה|vip/i,
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
      '<label class="label" for="tip-box">' + esc(t('tipLabel')) + '</label><textarea id="tip-box" dir="' + boxDir() + '" maxlength="4000" placeholder="' + esc(t('tipPh')) + '">' + esc(tipText) + '</textarea>' +
      '<div><button type="button" class="primary" id="tip-go">' + esc(t('tipGo')) + '</button></div></section>';
    if (tipResult === 'empty') h += '<p class="mute">' + esc(t('tipEmpty')) + '</p>';
    else if (tipResult) {
      var r = tipResult;
      h += '<section class="card"><h2>' + esc(t('tipFlags')) + '</h2>' + (r.flags.length ? '<ol class="flags">' + r.flags.map(function (f) { return '<li>' + esc(t('flagsText')[f]) + '</li>'; }).join('') + '</ol>' : '<p class="ok">' + esc(t('tipClean')) + '</p>') + '</section>';
      h += '<section class="card"><h2>' + esc(t('tipTickers')) + '</h2>' + (r.tickers.length ? r.tickers.map(function (x) { return '<div class="watch-item"><span class="tick">' + esc(x.s) + ' · ' + esc(x.ex === 'TASE' ? t('tase') : t('us')) + '</span>' + linkRow(links(x.s, x.ex)) + '</div>'; }).join('') : '<p class="mute">' + esc(t('tipNoTicker')) + '</p>') + '</section>';
      h += '<section class="card"><h2>' + esc(t('tipAsk')) + '</h2><ol>' + t('asks').map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ol></section>';
    }
    return h;
  }

  /* ---------- Watch list (this device only) ---------- */
  function watchList() { try { var w = JSON.parse(get(K.watch) || '[]'); return Array.isArray(w) ? w.filter(function (x) { return x && /^[A-Z0-9.]{1,12}$/.test(x.s); }) : []; } catch (e) { return []; } }
  function viewWatch() {
    var w = watchList();
    var h = '<section class="card"><h1>' + esc(t('watchTitle')) + '</h1><p class="mute">' + esc(t('watchLine')) + '</p>' +
      '<form class="watch-add" id="watch-form"><label class="label" for="watch-sym" style="grid-column:1/-1">' + esc(t('watchPh')) + '</label><input id="watch-sym" dir="ltr" autocomplete="off" maxlength="12" placeholder="' + esc(t('watchPh')) + '">' +
      '<select id="watch-ex" aria-label="Exchange"><option value="US">' + esc(t('us')) + '</option><option value="TASE">' + esc(t('tase')) + '</option></select>' +
      '<button type="submit" class="ghost">' + esc(t('watchAdd')) + '</button></form></section>';
    if (!w.length) return h + '<p class="card empty">' + esc(t('watchEmpty')) + '</p>';
    return h + w.map(function (x, i) {
      return '<section class="card watch-item"><div class="row"><span class="tick">' + esc(x.s) + ' · ' + esc(x.ex === 'TASE' ? t('tase') : t('us')) + '</span><button type="button" class="ghost" data-rm="' + i + '">' + esc(t('remove')) + '</button></div>' + linkRow(links(x.s, x.ex)) + '</section>';
    }).join('');
  }

  function viewHow() {
    return '<section class="card"><h1>' + esc(t('howTitle')) + '</h1><ol>' + t('how').map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' +
      '<p class="row"><span class="chip k-fact">' + esc(t('kinds').fact) + '</span><span class="chip k-inference">' + esc(t('kinds').inference) + '</span><span class="chip k-assumption">' + esc(t('kinds').assumption) + '</span><span class="chip">🐟 1–5</span></p>' +
      '<p class="mute">' + esc(t('howKey')) + '</p><p class="mute small">' + esc(t('howMade')) + '</p></section>';
  }

  function render() {
    var doc = document.documentElement; doc.lang = lang; doc.dir = lang === 'he' ? 'rtl' : 'ltr'; document.title = t('name');
    document.getElementById('brand-title').textContent = t('name');
    document.getElementById('credit').textContent = t('credit');
    document.getElementById('warn').textContent = t('warn');
    var tg = document.getElementById('lang-toggle'); tg.textContent = t('other'); tg.setAttribute('lang', lang === 'he' ? 'en' : 'he');
    document.getElementById('tabs').innerHTML = ['radar', 'tip', 'watch', 'how'].map(function (k) { return '<button type="button" data-tab="' + k + '"' + (k === tab ? ' aria-current="page"' : '') + '>' + esc(t('tabs')[k]) + '</button>'; }).join('');
    var app = document.getElementById('app');
    app.innerHTML = tab === 'tip' ? viewTip() : tab === 'watch' ? viewWatch() : tab === 'how' ? viewHow() : viewRadar();
  }

  document.getElementById('lang-toggle').addEventListener('click', function () { lang = lang === 'he' ? 'en' : 'he'; put(K.lang, lang); render(); });
  document.getElementById('tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (!b) return; tab = b.getAttribute('data-tab'); put(K.tab, tab); render(); });
  document.getElementById('app').addEventListener('click', function (e) {
    if (e.target.id === 'tip-go') {
      tipText = document.getElementById('tip-box').value;
      tipResult = tipText.trim() ? checkTip(tipText) : 'empty'; render();
      var f = document.querySelector('.flags, .ok'); if (f) f.closest('section').scrollIntoView({ block: 'start' });
    }
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
