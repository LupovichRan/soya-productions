/* Say It Kindly: finds the phrases in a message that tend to land hard, and offers a gentler way to say each one.
   Plain pattern matching in English and Hebrew. No AI and no network. It never rewrites the message by itself: it points at
   phrases and the person decides. It only ever changes text when the person applies a suggestion. */
(function (root) {
  'use strict';

  var NOT_HE_BEFORE = '(?<![א-ת])';
  var NOT_HE_AFTER = '(?![א-ת])';

  // Capital-letter words that are normal in a message.
  var ACRONYMS = /^(AI|API|CEO|CFO|CTO|CV|FAQ|FYI|GPS|HR|ID|IT|OK|PDF|PM|SMS|URL|USA|USB|VAT|VIP|WIFI|ZIP)$/;

  /* Each rule: a pattern, why it can land hard (in both languages), and the gentler wording to offer, or null when
     there is no safe swap and the person should choose their own words. "$1" in a replacement is the matched group. */
  var RULES = [
    { id: 'always', re: /\byou always\b/gi, to: { en: 'it often feels like you' },
      why: { en: '"Always" sounds like an accusation, and it is rarely exactly true.', he: '"תמיד" נשמע כמו האשמה, וכמעט אף פעם לא מדויק.' } },
    { id: 'never', re: /\byou never\b/gi, to: { en: 'it feels like you rarely' },
      why: { en: '"Never" sounds like an accusation, and it is rarely exactly true.', he: '"אף פעם" נשמע כמו האשמה, וכמעט אף פעם לא מדויק.' } },
    { id: 'should', re: /\byou should\b/gi, to: { en: 'it might help to' },
      why: { en: '"You should" sounds like an order.', he: '"אתה צריך" נשמע כמו פקודה.' } },
    { id: 'must', re: /\byou (?:need to|have to|must)\b/gi, to: { en: 'I would appreciate it if you could' },
      why: { en: 'Telling someone what they must do puts them on the defensive. Asking gets a better answer.', he: 'להגיד למישהו מה הוא חייב לעשות מעמיד אותו במגננה. בקשה מקבלת תשובה טובה יותר.' } },
    { id: 'why-didnt', re: /\bwhy (?:didn't|did not) you\b/gi, to: { en: "can you help me understand why you didn't" },
      why: { en: '"Why didn\'t you" sounds like blame. A question about what happened gets a calmer answer.', he: '"למה לא" נשמע כמו האשמה. שאלה על מה שקרה מקבלת תשובה רגועה יותר.' } },
    { id: 'obviously', re: /\bobviously,?\s*/gi, to: { en: '' },
      why: { en: '"Obviously" can sound like you are talking down to the reader.', he: '"ברור ש" יכול להישמע כאילו מדברים מגבוה.' } },
    { id: 'as-said', re: /\bas I (?:already )?(?:said|told you|mentioned)\b/gi, to: { en: 'to repeat' },
      why: { en: '"As I already said" sounds impatient.', he: '"כמו שכבר אמרתי" נשמע חסר סבלנות.' } },
    { id: 'whatever', re: /\bwhatever\b/gi, to: null,
      why: { en: '"Whatever" sounds like you have stopped listening. Say what you mean instead.', he: 'המילה הזאת נשמעת כאילו מישהו הפסיק להקשיב. כדאי להגיד מה באמת מתכוונים.' } },
    { id: 'dont-care', re: /\bI (?:don't|do not|couldn't|could not) care\b/gi, to: null,
      why: { en: '"I don\'t care" tends to end the conversation. Say what you actually feel or want.', he: '"I don\'t care" נוטה לסיים את השיחה. כדאי להגיד מה באמת מרגישים או רוצים.' } },
    { id: 'insult', re: /\b(?:stupid|idiot(?:ic)?|dumb|ridiculous|pathetic|useless|moron(?:ic)?)\b/gi, to: null,
      why: { en: 'Name-calling is the part the other person will remember. Describe what happened instead.', he: 'קללות הן החלק שהאדם השני יזכור. עדיף לתאר מה קרה.' } },
    { id: 'urgent', re: /\b(?:ASAP|immediately|right now|at once)\b/g, to: null,
      why: { en: 'This sounds like an order. Say when you actually need it, and why.', he: 'זה נשמע כמו פקודה. כדאי להגיד מתי באמת צריך את זה, ולמה.' } },
    { id: 'bangs', re: /!{2,}/g, to: { en: '!', he: '!' },
      why: { en: 'Several exclamation marks read as shouting.', he: 'כמה סימני קריאה ברצף נקראים כמו צעקה.' } },
    { id: 'questions', re: /\?{2,}/g, to: { en: '?', he: '?' },
      why: { en: 'Several question marks read as anger.', he: 'כמה סימני שאלה ברצף נקראים ככעס.' } },

    // Hebrew. The verb that follows keeps its form, so the swaps only change the opening words.
    { id: 'he-always', re: new RegExp(NOT_HE_BEFORE + '(אתה|את|אתם|אתן) תמיד' + NOT_HE_AFTER, 'g'), to: { he: 'נדמה לי ש$1 לעיתים קרובות' },
      why: { en: '"Always" sounds like an accusation, and it is rarely exactly true.', he: '"תמיד" נשמע כמו האשמה, וכמעט אף פעם לא מדויק.' } },
    { id: 'he-never', re: new RegExp(NOT_HE_BEFORE + '(אתה|את|אתם|אתן) אף פעם לא' + NOT_HE_AFTER, 'g'), to: { he: 'נדמה לי ש$1 לא תמיד' },
      why: { en: '"Never" sounds like an accusation, and it is rarely exactly true.', he: '"אף פעם" נשמע כמו האשמה, וכמעט אף פעם לא מדויק.' } },
    { id: 'he-must-m', re: new RegExp(NOT_HE_BEFORE + 'אתה חייב' + NOT_HE_AFTER, 'g'), to: { he: 'אשמח אם תוכל' },
      why: { en: 'Telling someone what they must do puts them on the defensive.', he: 'להגיד למישהו מה הוא חייב לעשות מעמיד אותו במגננה. בקשה מקבלת תשובה טובה יותר.' } },
    { id: 'he-must-f', re: new RegExp(NOT_HE_BEFORE + 'את חייבת' + NOT_HE_AFTER, 'g'), to: { he: 'אשמח אם תוכלי' },
      why: { en: 'Telling someone what they must do puts them on the defensive.', he: 'להגיד למישהי מה היא חייבת לעשות מעמיד אותה במגננה. בקשה מקבלת תשובה טובה יותר.' } },
    { id: 'he-must-p', re: new RegExp(NOT_HE_BEFORE + '(?:אתם חייבים|אתן חייבות)' + NOT_HE_AFTER, 'g'), to: { he: 'אשמח אם תוכלו' },
      why: { en: 'Telling people what they must do puts them on the defensive.', he: 'להגיד לאנשים מה הם חייבים לעשות מעמיד אותם במגננה. בקשה מקבלת תשובה טובה יותר.' } },
    { id: 'he-obviously', re: new RegExp(NOT_HE_BEFORE + 'ברור ש', 'g'), to: null,
      why: { en: '"Obviously" can sound like you are talking down to the reader.', he: '"ברור ש" יכול להישמע כאילו מדברים מגבוה. אפשר פשוט להגיד מה שחושבים.' } },
    { id: 'he-dont-care', re: /לא אכפת לי/g, to: null,
      why: { en: '"I don\'t care" tends to end the conversation.', he: '"לא אכפת לי" נוטה לסיים את השיחה. כדאי להגיד מה באמת מרגישים או רוצים.' } },
    { id: 'he-insult', re: new RegExp(NOT_HE_BEFORE + '(?:מטומטם|מטומטמת|אידיוט|אידיוטית|טיפש|טיפשה|מגוחך|מגוחכת|פתטי|פתטית)' + NOT_HE_AFTER, 'g'), to: null,
      why: { en: 'Name-calling is the part the other person will remember.', he: 'קללות הן החלק שהאדם השני יזכור. עדיף לתאר מה קרה.' } },
    { id: 'he-urgent', re: new RegExp(NOT_HE_BEFORE + '(?:מיד|דחוף|ברגע זה)' + NOT_HE_AFTER, 'g'), to: null,
      why: { en: 'This sounds like an order. Say when you actually need it, and why.', he: 'זה נשמע כמו פקודה. כדאי להגיד מתי באמת צריך את זה, ולמה.' } }
  ];

  function hasHebrew(text) { return /[א-ת]/.test(text); }

  function upperFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /** Find every phrase worth a second look. Findings do not overlap and come in reading order. */
  function check(text) {
    text = String(text || '');
    var found = [];

    RULES.forEach(function (rule) {
      var re = new RegExp(rule.re.source, rule.re.flags.replace('g', '') + 'g');
      var m;
      while ((m = re.exec(text))) {
        if (m[0] === '') { re.lastIndex++; continue; }
        var lang = hasHebrew(m[0]) ? 'he' : 'en';
        var to = null;
        if (rule.to && rule.to[lang] != null) {
          to = m[0].replace(new RegExp(rule.re.source, rule.re.flags.replace('g', '')), rule.to[lang]);
          // Keep the capital letter when the phrase opened a sentence.
          if (/^[A-Z]/.test(m[0]) && lang === 'en') to = upperFirst(to);
        }
        found.push({ id: rule.id, start: m.index, end: m.index + m[0].length, text: m[0], to: to, why: rule.why });
      }
    });

    // Words in capitals read as shouting. A single short capitalised word or a known acronym does not.
    var caps = /\b[A-Z]{3,}\b/g, c;
    while ((c = caps.exec(text))) {
      if (ACRONYMS.test(c[0]) || /^(ASAP)$/.test(c[0])) continue;
      found.push({ id: 'caps', start: c.index, end: c.index + c[0].length, text: c[0], to: c[0].toLowerCase(),
        why: { en: 'Words in capitals read as shouting.', he: 'מילים באותיות גדולות נקראות כמו צעקה.' } });
    }

    // Drop a finding that sits inside another one, then sort.
    found.sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    var kept = [], lastEnd = -1;
    found.forEach(function (f) { if (f.start >= lastEnd) { kept.push(f); lastEnd = f.end; } });
    return kept;
  }

  /** Replace one finding in the text with its gentler wording. A sentence that starts with the new wording, or with
   *  what follows a removed phrase, keeps its capital letter. */
  function apply(text, finding) {
    if (finding.to == null) return text;
    var before = text.slice(0, finding.start), after = text.slice(finding.end);
    var sentenceStart = /(^|[.!?]\s+|\n\s*)$/.test(before);
    var to = finding.to;
    if (sentenceStart && /^[a-z]/.test(to)) to = upperFirst(to);
    if (sentenceStart && to === '' && /^[a-z]/.test(after)) after = upperFirst(after);
    return before + to + after;
  }

  /** The direction a piece of text reads in, by its first letter: 'rtl', 'ltr', or '' when it has no letters yet. */
  function dirFor(text) {
    var m = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]|[A-Za-z\u00C0-\u024F]/.exec(String(text || ''));
    if (!m) return '';
    return /[A-Za-z\u00C0-\u024F]/.test(m[0]) ? 'ltr' : 'rtl';
  }

  var api = { check: check, apply: apply, hasHebrew: hasHebrew, dirFor: dirFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SoyaSoftener = api;
})(typeof window !== 'undefined' ? window : globalThis);
