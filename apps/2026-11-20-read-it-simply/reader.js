/* Read It Simply — the simple reading.
   Finds, word for word, what a letter asks of you, the dates, the amounts and who to contact.
   No AI and no network: plain pattern matching, in English and Hebrew. It only ever shows
   text that is in the letter; it does not explain, judge or advise. */
(function (root) {
  'use strict';

  var MONTHS_EN = '(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)';
  var MONTHS_HE = '(?:ינואר|פברואר|מרץ|מרס|אפריל|מאי|יוני|יולי|אוגוסט|ספטמבר|אוקטובר|נובמבר|דצמבר)';

  var DATE_PATTERNS = [
    /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g,
    new RegExp('\\b\\d{1,2}(?:st|nd|rd|th)?(?:\\s+of)?\\s+' + MONTHS_EN + '\\.?(?:,?\\s+\\d{4})?\\b', 'gi'),
    new RegExp('\\b' + MONTHS_EN + '\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?\\b', 'gi'),
    new RegExp('\\d{1,2}\\s+ב?' + MONTHS_HE + '(?:\\s+\\d{4})?', 'g'),
    /\bwithin\s+(?:\d+|one|two|three|seven|ten|fourteen|thirty)\s+(?:business\s+|working\s+|calendar\s+)?(?:days?|weeks?|months?)\b/gi,
    /\b(?:in|after)\s+\d+\s+(?:business\s+|working\s+)?(?:days?|weeks?)\b/gi,
    /(?:תוך|בתוך)\s+\d+\s+(?:ימי עסקים|ימים|יום|שבועות|חודשים)/g
  ];

  var AMOUNT = /(?:[$€£₪]\s?\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s?(?:₪|ש"ח|ש״ח|שקלים חדשים|שקלים|שקל|NIS|ILS|USD|EUR|GBP|dollars?|euros?|pounds?))/gi;

  // Words that mark a sentence as asking the reader to do, or not do, something.
  var STRONG_EN = /\b(?:must|required|requires?|need(?:s)? to|have to|has to|please|kindly|you should|you are (?:asked|requested|required|obliged)|make sure|ensure that|do not|don't|failure to|no later than|deadline|overdue|final notice)\b/i;
  var ACTION_EN = /\b(?:pay|submit|send|return|reply|respond|contact|call|sign|complete|fill (?:in|out)|provide|attach|bring|register|renew|confirm|appear|attend|update|cancel)\b/i;
  var STRONG_HE = /(?:יש ל|עליך|עלייך|עליכם|נדרש|נדרשת|נדרשים|חובה|נא |אנא|מתבקש|מתבקשת|מתבקשים|אין ל|לא יאוחר|מועד אחרון|התראה אחרונה|באיחור)/;
  var ACTION_HE = /(?:לשלם|להגיש|לשלוח|לחתום|להחזיר|ליצור קשר|להתקשר|למלא|לצרף|להסדיר|להתייצב|לאשר|לעדכן|לבטל|להמציא|לפנות)/;

  var EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  var LINK = /\b(?:https?:\/\/|www\.)[^\s<>"')]+/gi;
  var PHONE = /(?:\+\d[\d\s-]{8,}\d|\b0\d{1,2}[\s-]?\d{3}[\s-]?\d{4}\b|\b1[-\s]?[78]00[-\s]?\d{3}[-\s]?\d{3,4}\b|\*\d{3,5})/g;

  function hasHebrew(text) { return /[\u0590-\u05FF]/.test(text); }

  /** The direction a piece of text reads in, by its first letter: 'rtl', 'ltr', or '' when it has no letters yet.
   *  Digits and punctuation do not decide. A text box uses this so that an empty box follows the page and a box
   *  with Hebrew in it is right-to-left even when the page is English (and the other way round). */
  function dirFor(text) {
    var m = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]|[A-Za-z\u00C0-\u024F]/.exec(String(text || ''));
    if (!m) return '';
    return /[A-Za-z\u00C0-\u024F]/.test(m[0]) ? 'ltr' : 'rtl';
  }
  function tidy(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  function clip(s, max) { s = tidy(s); return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s; }

  /** Split into sentences: on line breaks, and after sentence-ending punctuation. */
  function sentences(text) {
    return String(text).split(/\n+/).reduce(function (all, line) {
      // Do not split after short abbreviations or inside numbers such as 12.5 or 20.11.2026.
      var parts = line.replace(/([.!?])\s+(?=[A-Z\u0590-\u05FF"'(\d])/g, function (m, p, i, whole) {
        var before = whole.slice(Math.max(0, i - 4), i);
        return /\b(?:Mr|Mrs|Ms|Dr|No|St|vs|etc|e\.g|i\.e)$/i.test(before) || /\d$/.test(before) && /^\s+\d/.test(whole.slice(i + 1)) ? m : p + '\u0000';
      }).split('\u0000');
      return all.concat(parts);
    }, []).map(tidy).filter(function (s) { return s.length > 2; });
  }

  function matches(text, patterns) {
    var found = [];
    patterns.forEach(function (re) {
      re.lastIndex = 0;
      var m;
      while ((m = re.exec(text))) found.push({ text: tidy(m[0]), at: m.index, end: m.index + m[0].length });
    });
    // Drop a match that sits inside a longer one (for example "5 March" inside "5 March 2027").
    return found.sort(function (a, b) { return a.at - b.at || b.end - a.end; }).filter(function (m, i, list) {
      return !list.some(function (o, j) { return j !== i && o.at <= m.at && o.end >= m.end && (o.end - o.at) > (m.end - m.at); });
    });
  }

  function unique(list, key) {
    var seen = {};
    return list.filter(function (x) { var k = key(x).toLowerCase(); if (seen[k]) return false; seen[k] = true; return true; });
  }

  function read(text) {
    text = String(text || '');
    var list = sentences(text);
    var lang = hasHebrew(text) ? 'he' : 'en';

    var asks = list.map(function (s, i) {
      var strong = STRONG_EN.test(s) || STRONG_HE.test(s);
      var action = ACTION_EN.test(s) || ACTION_HE.test(s);
      var dated = matches(s, DATE_PATTERNS).length > 0;
      // A sentence asks something if it uses a "must"-type word, or names an action together with a date.
      var score = (strong ? 2 : 0) + (action ? 1 : 0) + (dated ? 1 : 0);
      return { s: s, i: i, score: strong || (action && dated) ? score : 0 };
    }).filter(function (x) { return x.score > 0 && x.s.length < 400; })
      .sort(function (a, b) { return b.score - a.score || a.i - b.i; })
      .slice(0, 6)
      .sort(function (a, b) { return a.i - b.i; })
      .map(function (x) { return x.s; });

    var deadlines = [], amounts = [];
    list.forEach(function (s) {
      matches(s, DATE_PATTERNS).forEach(function (m) { deadlines.push({ when: m.text, context: clip(s, 220) }); });
      matches(s, [AMOUNT]).forEach(function (m) { amounts.push({ amount: m.text, context: clip(s, 220) }); });
    });

    var contacts = unique(
      matches(text, [EMAIL, LINK]).concat(matches(text.replace(EMAIL, ' ').replace(LINK, ' '), [PHONE]).filter(function (m) {
        return m.text.replace(/\D/g, '').length >= 4;
      })).map(function (m) { return m.text.replace(/[.,;:]+$/, ''); }),
      function (x) { return x; }
    ).slice(0, 8);

    return {
      lang: lang,
      sentences: list.length,
      opening: clip(list.slice(0, 2).join(' '), 320),
      // The same, one sentence each: a letter can mix languages, and each sentence must take its own direction.
      openingSentences: list.slice(0, 2).map(function (x) { return clip(x, 240); }),
      asks: asks,
      deadlines: unique(deadlines, function (d) { return d.when; }).slice(0, 8),
      amounts: unique(amounts, function (a) { return a.amount; }).slice(0, 8),
      contacts: contacts
    };
  }

  var api = { read: read, sentences: sentences, hasHebrew: hasHebrew, dirFor: dirFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SoyaReader = api;
})(typeof window !== 'undefined' ? window : globalThis);
