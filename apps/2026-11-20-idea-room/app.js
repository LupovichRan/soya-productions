/* Idea Room, a Soycatory app (alpha proof of concept).
   Bring an idea, test it for two weeks, and see whether people want it. Backing earns a seat, work the owner
   accepts earns a louder voice. Everything is kept in this browser only: there is no server yet, so the only
   people counted are the ones this device recorded. The examples carry made-up numbers and are labelled. */
(function () {
  'use strict';

  var LANG_KEY = 'soya-idearoom-lang';
  var DATA_KEY = 'soya-idearoom-ideas';
  var R = window.SoyaRoom;
  var Remote = window.SoyaRemote || { enabled: false };

  var COLORS = { cat: '#1F2937', fox: '#B9571E', owl: '#6B5540', bear: '#7A4B2E', rabbit: '#8C95A3', frog: '#2F7D55' };
  var EARS = {
    cat: '<path d="M20 38 L24 6 L48 26Z"/><path d="M80 38 L76 6 L52 26Z"/>',
    fox: '<path d="M16 40 L18 2 L46 26Z"/><path d="M84 40 L82 2 L54 26Z"/>',
    owl: '<path d="M22 30 L22 10 L40 22Z"/><path d="M78 30 L78 10 L60 22Z"/>',
    bear: '<circle cx="24" cy="24" r="13"/><circle cx="76" cy="24" r="13"/>',
    rabbit: '<ellipse cx="34" cy="14" rx="9" ry="24"/><ellipse cx="66" cy="14" rx="9" ry="24"/>',
    frog: '<circle cx="30" cy="26" r="14"/><circle cx="70" cy="26" r="14"/>'
  };

  /* Two examples that show how it works. Their text is kept here, so it follows the language; their numbers are made up. */
  var SAMPLES = {
    lineless: {
      mascot: 'fox', dayOffset: 5, others: { follow: 5, want: 3, share: 2 }, votes: [4, 2, 1], itemState: [['accepted', ''], ['proposed', ''], ['claimed', '']],
      en: { name: 'Lineless', problem: 'People wait in clinic waiting rooms with no idea how long the wait really is.', promise: 'See the real wait time before you leave home.',
        items: ['Ask one clinic if they would share waiting times', 'Draw the first screen on paper', 'Try the idea with five neighbours'],
        question: 'Which clinics should we start with?', options: ['Family clinics', 'Children\'s clinics', 'Dental clinics'] },
      he: { name: 'בלי תור', problem: 'אנשים מחכים בחדרי המתנה במרפאות ולא יודעים כמה זמן ההמתנה באמת.', promise: 'רואים את זמן ההמתנה האמיתי לפני שיוצאים מהבית.',
        items: ['לשאול מרפאה אחת אם תשתף זמני המתנה', 'לצייר את המסך הראשון על נייר', 'לנסות את הרעיון עם חמישה שכנים'],
        question: 'באילו מרפאות נתחיל?', options: ['מרפאות משפחה', 'מרפאות ילדים', 'מרפאות שיניים'] }
    },
    shelfie: {
      mascot: 'owl', dayOffset: 13, others: { follow: 4, want: 2, share: 1, pledge: 1 }, votes: [3, 1, 2], itemState: [['accepted', '']],
      en: { name: 'Shelfie', problem: 'Books sit on shelves at home, and neighbours would happily read them.', promise: 'Swap books with the people in your building.',
        items: ['List ten books you would swap'], question: 'Where should swaps happen?', options: ['The building lobby', 'A café', 'The library'] },
      he: { name: 'מדף משותף', problem: 'ספרים עומדים על מדפים בבית, ושכנים היו שמחים לקרוא אותם.', promise: 'מחליפים ספרים עם האנשים בבניין.',
        items: ['לרשום עשרה ספרים שהייתם מחליפים'], question: 'איפה כדאי להחליף?', options: ['לובי הבניין', 'בית קפה', 'הספרייה'] }
    }
  };

  var I18N = {
    en: {
      title: 'Idea Room', otherLang: 'עברית', credit: 'Made by Soycatory',
      alpha: 'Alpha test. Ideas you keep on this device stay on it. Ideas you choose to share are public to everyone using this alpha, so never put private details in them. A device is a browser, not a verified person. Numbers marked Example are made up to show how it works.',
      shared: 'Shared', sharedMine: 'Shared · yours', remoteFailed: 'Could not reach the shared service just now. Shared ideas may be out of date; your own device still works.', shareIt: 'Share it with everyone in this alpha', shareHelp: 'Shared ideas are public. Do not put private or confidential details in them.', deviceOnly: 'Keep it on this device only', whereTitle: 'Where should it live?', liveNumbers: 'Live numbers',
      listTitle: 'Ideas', listLead: 'Bring an idea. For two weeks people show whether they want it, with small real acts, not likes. Then the owner decides.',
      newIdea: 'New idea', resetExamples: 'Reset the examples', sure: 'Tap again to reset', example: 'Example', yours: 'Yours',
      dayOf: function (d) { return 'Day ' + d + ' of 14'; }, scoreOf: function (s, n) { return s + ' of ' + n; },
      back: 'All ideas', save: 'Save idea', cancel: 'Cancel',
      name: 'Name of the idea', nameHelp: 'Short and plain.', problem: 'What problem is it for?', promise: 'What does it promise?', mascot: 'Pick a mascot',
      errName: 'Give the idea a name.', errProblem: 'Say what problem it is for.', errPromise: 'Say what it promises.',
      mascots: { cat: 'Cat', fox: 'Fox', owl: 'Owl', bear: 'Bear', rabbit: 'Rabbit', frog: 'Frog' },
      viewing: 'Viewing as', owner: 'Owner', visitor: 'Visitor',
      tabs: { idea: 'Idea', join: 'Join in', roadmap: 'Roadmap', verdict: 'Verdict' },
      theProblem: 'The problem', thePromise: 'The promise', theTest: 'The two-week test', needed: 'Needed to go on',
      testNote: 'Each person can record each act once. Bigger acts count for more.',
      actsTitle: 'What you can do', acts: { follow: 'Follow this idea', want: 'I want this', share: 'I will tell someone', pledge: 'I will give an hour', call: 'I will take a short call' },
      weight: function (w) { return w === 1 ? 'counts 1' : 'counts ' + w; },
      seatTitle: 'A seat', seatText: 'A seat gives you a voice in surveys. It is free: you promise a little of your time, never money.', takeSeat: 'Take a seat',
      haveSeat: function (v, m) { return 'You have a seat. Your voice counts ' + v + ' of ' + m + '.'; },
      voiceNote: 'Trust points make your voice louder. Only the owner gives them, for good suggestions and work they accept. They cannot be claimed or bought.',
      trustTitle: 'Trust points', trustLine: function (n, v, m) { return n + ' trust points. Your voice counts ' + v + ' of ' + m + '.'; }, noTrust: 'None yet. Suggest something useful, or take on some work.', trustFor: function (p, why) { return '+' + p + (why ? ' · ' + why : ''); },
      surveyTitle: 'Survey', noSurvey: 'No survey yet.', needSeat: 'Take a seat to vote.', yourVote: 'Your vote', votes: 'weighted votes',
      setSurvey: 'Set the survey', question: 'Question', options: 'Options (two to four, one on each line)', saveSurvey: 'Save survey',
      errQuestion: 'Write a question.', errOptions: 'Give two to four options, one on each line.', surveyOwnerOnly: 'Only the owner sets the survey. Switch to Owner above.',
      roadTitle: 'Roadmap', roadLead: 'Every suggestion gets an answer. The owner accepts it or says why not now. Someone takes accepted work. The owner accepts the finished work and can give trust points.',
      heard: function (a, n) { return a + ' of ' + n + ' suggestions answered'; }, decline: 'Not now', declineWhy: 'Why not now? A short reason helps.', sendDecline: 'Send the answer', cancelDecline: 'Cancel', ownerAnswer: 'Owner says', giveTrust: 'Give trust points', trustSent: function (n) { return n + ' given'; }, trustLimit: 'Most trust points for this one.',
      suggest: 'Suggest something', suggestLabel: 'A suggestion', noItems: 'Nothing suggested yet.',
      status: { proposed: 'Suggested', accepted: 'Accepted', claimed: 'Being done', declined: 'Not now', done: 'Done' },
      accept: 'Accept', claim: 'I will do this', doneBtn: 'Accept the work', ownerOnly: 'The owner decides.', yourWork: 'your work',
      verdictTitle: 'Verdict', act: 'Act', times: 'Times', counts: 'Counts', total: 'Total',
      v: { testing: function (d) { return 'Still testing. Day ' + d + ' of 14.'; }, continue: 'The numbers say: carry on.', change: 'The numbers say: change direction.', stop: 'The numbers say: stop here.' },
      suggestion: 'This is only a suggestion. The owner decides.', decide: 'The owner decides', continue: 'Carry on', change: 'Change direction', stop: 'Stop',
      decided: { continue: 'Decided: carry on.', change: 'Decided: change direction.', stop: 'Decided: stop.' }, waitDay: 'The owner can decide on day 14.',
      demo: 'Demo controls', skipDay: 'Skip one day', skipEnd: 'Skip to day 14',
      cantSave: 'This browser would not save. The idea room works until you close the page.'
    },
    he: {
      title: 'חדר רעיונות', otherLang: 'English', credit: 'נוצר על ידי Soycatory',
      alpha: 'בדיקת אלפא. רעיונות שנשארים במכשיר הזה נשארים בו. רעיונות שבוחרים לשתף גלויים לכל מי שמשתמש באלפא, ולכן אין לכתוב בהם פרטים פרטיים. מכשיר הוא דפדפן, לא אדם מאומת. מספרים שמסומנים דוגמה הם מומצאים, כדי להראות איך זה עובד.',
      shared: 'משותף', sharedMine: 'משותף · שלך', remoteFailed: 'לא הצלחנו להגיע לשירות המשותף כרגע. רעיונות משותפים עשויים להיות לא מעודכנים; המכשיר שלך ממשיך לעבוד.', shareIt: 'משתפים עם כולם באלפא הזו', shareHelp: 'רעיונות משותפים גלויים לכולם. אין לכתוב בהם פרטים פרטיים או סודיים.', deviceOnly: 'משאירים רק במכשיר הזה', whereTitle: 'איפה הרעיון יגור?', liveNumbers: 'מספרים בשידור חי',
      listTitle: 'רעיונות', listLead: 'מביאים רעיון. במשך שבועיים אנשים מראים אם הם רוצים אותו, במעשים קטנים ואמיתיים, לא בלייקים. אחר כך הבעלים מחליט.',
      newIdea: 'רעיון חדש', resetExamples: 'איפוס הדוגמאות', sure: 'לוחצים שוב כדי לאפס', example: 'דוגמה', yours: 'שלך',
      dayOf: function (d) { return 'יום ' + d + ' מתוך 14'; }, scoreOf: function (s, n) { return s + ' מתוך ' + n; },
      back: 'כל הרעיונות', save: 'שמירת הרעיון', cancel: 'ביטול',
      name: 'שם הרעיון', nameHelp: 'קצר ופשוט.', problem: 'לאיזו בעיה זה מיועד?', promise: 'מה זה מבטיח?', mascot: 'בוחרים קמע',
      errName: 'צריך לתת לרעיון שם.', errProblem: 'צריך לכתוב לאיזו בעיה זה מיועד.', errPromise: 'צריך לכתוב מה זה מבטיח.',
      mascots: { cat: 'חתול', fox: 'שועל', owl: 'ינשוף', bear: 'דוב', rabbit: 'ארנב', frog: 'צפרדע' },
      viewing: 'צופים בתור', owner: 'בעלים', visitor: 'מבקר',
      tabs: { idea: 'הרעיון', join: 'מצטרפים', roadmap: 'מפת דרכים', verdict: 'פסק דין' },
      theProblem: 'הבעיה', thePromise: 'ההבטחה', theTest: 'מבחן של שבועיים', needed: 'נדרש כדי להמשיך',
      testNote: 'כל אחד יכול לרשום כל מעשה פעם אחת. מעשים גדולים שווים יותר.',
      actsTitle: 'מה אפשר לעשות', acts: { follow: 'לעקוב אחרי הרעיון', want: 'אני רוצה את זה', share: 'אספר למישהו', pledge: 'אתן שעה', call: 'אקח שיחה קצרה' },
      weight: function (w) { return 'שווה ' + w; },
      seatTitle: 'מקום ליד השולחן', seatText: 'מקום נותן לך קול בסקרים. זה בחינם: מתחייבים לקצת מהזמן, אף פעם לא לכסף.', takeSeat: 'תופסים מקום',
      haveSeat: function (v, m) { return 'יש לך מקום. הקול שלך שווה ' + v + ' מתוך ' + m + '.'; },
      voiceNote: 'נקודות אמון מחזקות את הקול שלך. רק הבעלים נותן אותן, על הצעות טובות ועל עבודה שהוא מקבל. אי אפשר לדרוש אותן או לקנות אותן.',
      trustTitle: 'נקודות אמון', trustLine: function (n, v, m) { return n + ' נקודות אמון. הקול שלך שווה ' + v + ' מתוך ' + m + '.'; }, noTrust: 'עדיין אין. מציעים משהו מועיל, או לוקחים על עצמנו עבודה.', trustFor: function (p, why) { return '+' + p + (why ? ' · ' + why : ''); },
      surveyTitle: 'סקר', noSurvey: 'אין עדיין סקר.', needSeat: 'תופסים מקום כדי להצביע.', yourVote: 'ההצבעה שלך', votes: 'קולות משוקללים',
      setSurvey: 'קובעים את הסקר', question: 'שאלה', options: 'אפשרויות (שתיים עד ארבע, אחת בכל שורה)', saveSurvey: 'שמירת הסקר',
      errQuestion: 'צריך לכתוב שאלה.', errOptions: 'צריך שתיים עד ארבע אפשרויות, אחת בכל שורה.', surveyOwnerOnly: 'רק הבעלים קובע את הסקר. עוברים לבעלים למעלה.',
      roadTitle: 'מפת דרכים', roadLead: 'כל הצעה מקבלת תשובה. הבעלים מאשר אותה או אומר למה לא עכשיו. מישהו לוקח עבודה שאושרה. הבעלים מקבל את העבודה שהסתיימה ויכול לתת נקודות אמון.',
      heard: function (a, n) { return 'ענו על ' + a + ' מתוך ' + n + ' הצעות'; }, decline: 'לא עכשיו', declineWhy: 'למה לא עכשיו? סיבה קצרה עוזרת.', sendDecline: 'שולחים את התשובה', cancelDecline: 'ביטול', ownerAnswer: 'הבעלים אומר', giveTrust: 'נותנים נקודות אמון', trustSent: function (n) { return 'ניתנו ' + n; }, trustLimit: 'המקסימום לנקודות אמון על זה.',
      suggest: 'מציעים', suggestLabel: 'הצעה', noItems: 'עדיין אין הצעות.',
      status: { proposed: 'הוצע', accepted: 'אושר', claimed: 'בעבודה', declined: 'לא עכשיו', done: 'הושלם' },
      accept: 'מאשרים', claim: 'אני אעשה את זה', doneBtn: 'מקבלים את העבודה', ownerOnly: 'הבעלים מחליט.', yourWork: 'העבודה שלך',
      verdictTitle: 'פסק דין', act: 'מעשה', times: 'פעמים', counts: 'שווה', total: 'סך הכול',
      v: { testing: function (d) { return 'עדיין בבדיקה. יום ' + d + ' מתוך 14.'; }, continue: 'המספרים אומרים: ממשיכים.', change: 'המספרים אומרים: משנים כיוון.', stop: 'המספרים אומרים: עוצרים כאן.' },
      suggestion: 'זו רק המלצה. הבעלים מחליט.', decide: 'הבעלים מחליט', continue: 'ממשיכים', change: 'משנים כיוון', stop: 'עוצרים',
      decided: { continue: 'הוחלט: ממשיכים.', change: 'הוחלט: משנים כיוון.', stop: 'הוחלט: עוצרים.' }, waitDay: 'הבעלים יכול להחליט ביום 14.',
      demo: 'כפתורי הדגמה', skipDay: 'מדלגים יום', skipEnd: 'מדלגים ליום 14',
      cantSave: 'הדפדפן לא שמר. חדר הרעיונות עובד עד שסוגרים את הדף.'
    }
  };

  var state = { lang: loadLang(), ideas: [], screen: 'list', currentId: '', tab: 'idea', role: 'owner', draft: null, error: '', survey: { q: '', o: '' }, suggest: '', declining: '', declineText: '', error2: '', saveFailed: false, resetAsk: false, remote: [], remoteMsg: '' };
  var app = document.getElementById('app');

  function loadLang() {
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* blocked */ }
    if (saved === 'en' || saved === 'he') return saved;
    return /^(he|iw)\b/i.test(navigator.language || '') ? 'he' : 'en';
  }
  function t(key) { return I18N[state.lang][key]; }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function pageDir() { return document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'; }
  /* Never a bare dir="auto": an empty box on a Hebrew page must still start on the right. */
  function boxDir(value) { return R.dirFor(value) || pageDir(); }
  function newId() { return 'i' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36); }
  function mascot(animal, size) {
    if (!EARS[animal]) animal = 'fox';
    var eyeY = animal === 'frog' ? 28 : 54, eyeX = animal === 'frog' ? 20 : 15;
    return '<svg class="mark" width="' + size + '" height="' + size + '" viewBox="2 -14 96 108" aria-hidden="true"><g fill="' + COLORS[animal] + '">' + EARS[animal] +
      '<ellipse cx="50" cy="56" rx="40" ry="34"/></g><circle cx="' + (50 - eyeX) + '" cy="' + eyeY + '" r="3.8" fill="#fff"/><circle cx="' + (50 + eyeX) + '" cy="' + eyeY + '" r="3.8" fill="#fff"/></svg>';
  }

  /* Storage */
  function seedSamples() {
    var now = Date.now();
    return Object.keys(SAMPLES).map(function (key) {
      var s = SAMPLES[key];
      var base = R.makeIdea('x', 'x', 'x', s.mascot, 'sample-' + key, now).idea;
      base.sample = key; base.others = Object.assign({}, s.others); base.dayOffset = s.dayOffset;
      base.options = s.en.options.map(function (o, i) { return String(i + 1); });
      base.votes = s.votes.slice();
      base.question = 'x';
      base.items = s.itemState.map(function (st, i) { return { id: 'sample-' + key + '-' + i, text: '', tk: i, by: 'other', status: st[0], claimedBy: st[1] }; });
      return base;
    });
  }
  function load() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(DATA_KEY)); } catch (e) { raw = null; }
    var cleaned = R.clean(raw);
    state.ideas = cleaned.length || Array.isArray(raw) ? cleaned : seedSamples();
  }
  function save() {
    try { localStorage.setItem(DATA_KEY, JSON.stringify(state.ideas)); state.saveFailed = false; }
    catch (e) { state.saveFailed = true; }
  }
  function all() { return state.ideas.concat(state.remote); }
  function current() { return all().filter(function (i) { return i.id === state.currentId; })[0] || null; }
  function update(next) { state.ideas = state.ideas.map(function (i) { return i.id === next.id ? next : i; }); save(); }

  /* What to show for an idea: examples take their words from the language in use. */
  function words(idea) {
    if (!idea.sample || !SAMPLES[idea.sample]) return idea;
    var w = SAMPLES[idea.sample][state.lang];
    return Object.assign({}, idea, { name: w.name, problem: w.problem, promise: w.promise, question: w.question, options: w.options });
  }
  function itemText(idea, item) {
    if (item.text) return item.text;
    var s = idea.sample && SAMPLES[idea.sample];
    return s && item.tk >= 0 && s[state.lang].items[item.tk] ? s[state.lang].items[item.tk] : '';
  }
  function tag(idea) { return '<span class="pill ' + (idea.sample ? '' : 'live') + '">' + esc(idea.sample ? t('example') : idea.remote ? t(idea.owner ? 'sharedMine' : 'shared') : t('yours')) + '</span>'; }
  function alpha() { return '<p class="banner" role="note">' + esc(t('alpha')) + '</p>'; }
  function saveNote() { return (state.saveFailed ? '<p class="banner" role="status">' + esc(t('cantSave')) + '</p>' : '') + (state.remoteMsg ? '<p class="banner" role="status">' + esc(t(state.remoteMsg)) + '</p>' : ''); }

  /* Screens */
  function viewList() {
    var rows = all().map(function (raw) {
      var i = words(raw), v = R.verdict(raw);
      return '<button type="button" class="row" data-open="' + esc(i.id) + '">' + mascot(i.mascot, 40) + '<span><b dir="' + boxDir(i.name) + '"><bdi>' + esc(i.name) + '</bdi></b>' +
        '<small>' + esc(t('dayOf')(v.day)) + ' · ' + esc(t('scoreOf')(v.score, v.needed)) + '</small></span>' + tag(raw) + '</button>';
    }).join('');
    return '<h1>' + esc(t('listTitle')) + '</h1><p class="lead">' + esc(t('listLead')) + '</p>' + alpha() + saveNote() +
      '<div class="rows">' + rows + '</div>' +
      '<div class="actions"><button type="button" class="wide" data-act="new">' + esc(t('newIdea')) + '</button>' +
      '<button type="button" class="ghost wide" data-act="reset">' + esc(state.resetAsk ? t('sure') : t('resetExamples')) + '</button>' +
      (Remote.enabled ? '<a class="button wide" href="dashboard.html">' + esc(t('liveNumbers')) + '</a>' : '') + '</div>';
  }

  function viewNew() {
    var d = state.draft;
    var picks = R.MASCOTS.map(function (m) {
      return '<button type="button" class="pick ghost" data-mascot="' + m + '" aria-pressed="' + (d.mascot === m) + '" aria-label="' + esc(t('mascots')[m]) + '">' + mascot(m, 36) + '<small>' + esc(t('mascots')[m]) + '</small></button>';
    }).join('');
    return '<h1>' + esc(t('newIdea')) + '</h1>' +
      '<form id="new-form" novalidate class="card">' +
      '<div class="field"><label for="f-name">' + esc(t('name')) + '</label><input type="text" id="f-name" maxlength="' + R.LIMITS.name + '" dir="' + boxDir(d.name) + '" value="' + esc(d.name) + '" autocomplete="off"><div class="help"><span>' + esc(t('nameHelp')) + '</span></div></div>' +
      '<div class="field"><label for="f-problem">' + esc(t('problem')) + '</label><textarea id="f-problem" maxlength="' + R.LIMITS.problem + '" dir="' + boxDir(d.problem) + '" autocomplete="off">' + esc(d.problem) + '</textarea></div>' +
      '<div class="field"><label for="f-promise">' + esc(t('promise')) + '</label><textarea id="f-promise" maxlength="' + R.LIMITS.promise + '" dir="' + boxDir(d.promise) + '" autocomplete="off">' + esc(d.promise) + '</textarea></div>' +
      '<div class="field"><span class="label">' + esc(t('mascot')) + '</span><div class="picks">' + picks + '</div></div>' +
      (Remote.enabled ? '<div class="field"><span class="label">' + esc(t('whereTitle')) + '</span><div class="row-actions"><button type="button" class="ghost" data-where="device" aria-pressed="' + (!d.shared) + '">' + esc(t('deviceOnly')) + '</button><button type="button" class="ghost" data-where="shared" aria-pressed="' + (!!d.shared) + '">' + esc(t('shareIt')) + '</button></div><p class="small mute">' + esc(t('shareHelp')) + '</p></div>' : '') +
      (state.error ? '<p class="banner" role="alert">' + esc(t(state.error)) + '</p>' : '') +
      '<div class="actions"><button type="submit" class="wide">' + esc(t('save')) + '</button><button type="button" class="ghost wide" data-act="cancel">' + esc(t('cancel')) + '</button></div></form>';
  }

  function tabBar() {
    return '<div class="tabs" role="tablist">' + ['idea', 'join', 'roadmap', 'verdict'].map(function (k) {
      return '<button type="button" role="tab" class="tab" data-tab="' + k + '" aria-selected="' + (state.tab === k) + '">' + esc(t('tabs')[k]) + '</button>';
    }).join('') + '</div>';
  }

  function viewRoom() {
    var raw = current();
    if (!raw) return viewList();
    var i = words(raw);
    if (raw.remote) state.role = raw.owner ? 'owner' : 'visitor';
    var head = '<div class="room-head">' + mascot(i.mascot, 56) + '<div><h1 dir="' + boxDir(i.name) + '"><bdi>' + esc(i.name) + '</bdi></h1>' + tag(raw) + '</div></div>' +
      (raw.remote ? '' : '<div class="role"><span>' + esc(t('viewing')) + '</span><button type="button" class="ghost" data-role="owner" aria-pressed="' + (state.role === 'owner') + '">' + esc(t('owner')) + '</button>' +
      '<button type="button" class="ghost" data-role="visitor" aria-pressed="' + (state.role === 'visitor') + '">' + esc(t('visitor')) + '</button></div>');
    var body = state.tab === 'join' ? tabJoin(raw, i) : state.tab === 'roadmap' ? tabRoad(raw, i) : state.tab === 'verdict' ? tabVerdict(raw) : tabIdea(raw, i);
    return head + tabBar() + alpha() + saveNote() + body + '<div class="actions"><button type="button" class="ghost wide" data-act="back">' + esc(t('back')) + '</button></div>';
  }

  function tabIdea(raw, i) {
    var v = R.verdict(raw);
    var pct = Math.min(100, Math.round(v.score / v.needed * 100));
    return '<section class="card"><h2>' + esc(t('theProblem')) + '</h2><p dir="' + boxDir(i.problem) + '">' + esc(i.problem) + '</p></section>' +
      '<section class="card"><h2>' + esc(t('thePromise')) + '</h2><p dir="' + boxDir(i.promise) + '">' + esc(i.promise) + '</p></section>' +
      '<section class="card"><h2>' + esc(t('theTest')) + '</h2><p><b>' + esc(t('dayOf')(v.day)) + '</b></p>' +
      '<div class="meter" role="img" aria-label="' + esc(t('scoreOf')(v.score, v.needed)) + '"><span style="width:' + pct + '%"></span></div>' +
      '<p class="small mute">' + esc(t('scoreOf')(v.score, v.needed)) + ' · ' + esc(t('needed')) + '</p><p class="small mute">' + esc(t('testNote')) + '</p></section>';
  }

  function tabJoin(raw, i) {
    var acts = R.KINDS.map(function (k) {
      return '<button type="button" class="ghost act" data-signal="' + k + '" aria-pressed="' + (raw.mine[k] === true) + '"><span>' + esc(t('acts')[k]) + '</span><small>' + esc(t('weight')(R.WEIGHTS[k])) + '</small></button>';
    }).join('');
    var v = R.voice(raw);
    var seat = raw.seat
      ? '<p class="banner ok">' + esc(t('haveSeat')(v, R.MAX_VOICE)) + '</p>'
      : '<p>' + esc(t('seatText')) + '</p><button type="button" class="wide" data-act="seat">' + esc(t('takeSeat')) + '</button>';
    var survey = '';
    if (raw.question && raw.options.length >= 2) {
      var tally = R.tally(raw), max = Math.max.apply(null, tally.concat([1]));
      survey = '<p><b dir="' + boxDir(i.question) + '">' + esc(i.question) + '</b></p><div class="opts">' + i.options.map(function (o, n) {
        return '<button type="button" class="ghost opt" data-vote="' + n + '" aria-pressed="' + (raw.myVote === n) + '"' + (raw.seat ? '' : ' disabled') + '>' +
          '<span class="optname" dir="' + boxDir(o) + '"><bdi>' + esc(o) + '</bdi></span><span class="bar"><i style="width:' + Math.round(tally[n] / max * 100) + '%"></i></span><span class="n">' + tally[n] + '</span></button>';
      }).join('') + '</div><p class="small mute">' + esc(raw.seat ? t('votes') : t('needSeat')) + '</p>';
    } else survey = '<p class="mute">' + esc(t('noSurvey')) + '</p>';
    var setter = '';
    if (!raw.sample) {
      setter = state.role === 'owner'
        ? '<details><summary>' + esc(t('setSurvey')) + '</summary><div class="field"><label for="s-q">' + esc(t('question')) + '</label><input type="text" id="s-q" maxlength="' + R.LIMITS.question + '" dir="' + boxDir(state.survey.q) + '" value="' + esc(state.survey.q) + '" autocomplete="off"></div>' +
          '<div class="field"><label for="s-o">' + esc(t('options')) + '</label><textarea id="s-o" dir="' + boxDir(state.survey.o) + '" autocomplete="off">' + esc(state.survey.o) + '</textarea></div>' +
          (state.error2 ? '<p class="banner" role="alert">' + esc(t(state.error2)) + '</p>' : '') + '<button type="button" class="ghost wide" data-act="survey">' + esc(t('saveSurvey')) + '</button></details>'
        : '<p class="small mute">' + esc(t('surveyOwnerOnly')) + '</p>';
    }
    var tr = R.trustTotal(raw);
    var trustList = (raw.trust || []).map(function (g) { return '<li>' + esc(t('trustFor')(g.points, g.why)) + '</li>'; }).join('');
    var trustCard = '<section class="card"><h2>' + esc(t('trustTitle')) + '</h2>' +
      (tr ? '<p><b>' + esc(t('trustLine')(tr, v, R.MAX_VOICE)) + '</b></p><ul class="plain">' + trustList + '</ul>' : '<p class="mute">' + esc(t('noTrust')) + '</p>') + '</section>';
    return '<section class="card"><h2>' + esc(t('actsTitle')) + '</h2><div class="acts">' + acts + '</div></section>' + trustCard +
      '<section class="card"><h2>' + esc(t('seatTitle')) + '</h2>' + seat + '<p class="small mute">' + esc(t('voiceNote')) + '</p></section>' +
      '<section class="card"><h2>' + esc(t('surveyTitle')) + '</h2>' + survey + setter + '</section>';
  }

  function tabRoad(raw, i) {
    var owner = state.role === 'owner';
    var h = R.heard(raw);
    var list = raw.items.map(function (it) {
      var id = esc(it.id), btn = '', extra = '';
      if (it.status === 'proposed' && owner) {
        if (state.declining === it.id) {
          extra = '<div class="field"><label for="f-decline">' + esc(t('declineWhy')) + '</label><input type="text" id="f-decline" maxlength="' + R.LIMITS.reply + '" dir="' + boxDir(state.declineText) + '" value="' + esc(state.declineText) + '" autocomplete="off"></div>' +
            '<div class="row-actions"><button type="button" class="ghost" data-act="declinesend" data-item="' + id + '">' + esc(t('sendDecline')) + '</button><button type="button" class="ghost" data-act="declinecancel">' + esc(t('cancelDecline')) + '</button></div>';
        } else btn = '<div class="row-actions"><button type="button" class="ghost" data-item="' + id + '" data-move="accept">' + esc(t('accept')) + '</button><button type="button" class="ghost" data-item="' + id + '" data-decline="' + id + '">' + esc(t('decline')) + '</button></div>';
      } else if (it.status === 'accepted' && !owner) btn = '<button type="button" class="ghost" data-item="' + id + '" data-move="claim">' + esc(t('claim')) + '</button>';
      else if (it.status === 'claimed' && owner) btn = '<button type="button" class="ghost" data-item="' + id + '" data-move="done">' + esc(t('doneBtn')) + '</button>';
      /* Trust goes to someone else's accepted suggestion or finished work. On this device alone, "you" stands in for that person. */
      var yours = raw.remote ? (it.status === 'done' || (it.by === 'other' && (it.status === 'accepted' || it.status === 'claimed')))
        : (it.by === 'you' && (it.status === 'accepted' || it.status === 'claimed' || it.status === 'done')) || (it.claimedBy === 'you' && it.status === 'done');
      if (owner && yours) {
        var given = raw.remote ? (it.given || 0) : (raw.trust || []).filter(function (g) { return g.itemId === it.id; }).reduce(function (n, g) { return n + g.points; }, 0);
        var left = R.MAX_TRUST_ITEM - given;
        extra += '<div class="trustrow"><span class="small mute">' + esc(t('giveTrust')) + (given ? ' · ' + esc(t('trustSent')(given)) : '') + '</span>' +
          (left > 0 ? '<span class="row-actions">' + [1, 3, 5].filter(function (n) { return n <= left; }).map(function (n) { return '<button type="button" class="ghost" data-item="' + id + '" data-trust="' + n + '">+' + n + '</button>'; }).join('') + '</span>' : '<span class="small mute">' + esc(t('trustLimit')) + '</span>') + '</div>';
      }
      var mineWork = it.claimedBy === 'you' && (it.status === 'claimed' || it.status === 'done');
      var reply = it.status === 'declined' && it.reply ? '<p class="small reply"><b>' + esc(t('ownerAnswer')) + ':</b> <bdi dir="' + boxDir(it.reply) + '">' + esc(it.reply) + '</bdi></p>' : '';
      return '<li class="item"><div><span class="chip ' + it.status + '">' + esc(t('status')[it.status]) + '</span>' + (mineWork ? ' <span class="chip you">' + esc(t('yourWork')) + '</span>' : '') +
        '<p dir="' + boxDir(itemText(raw, it)) + '"><bdi>' + esc(itemText(raw, it)) + '</bdi></p>' + reply + '</div>' + btn + extra + '</li>';
    }).join('');
    return '<section class="card"><h2>' + esc(t('roadTitle')) + '</h2><p class="small mute">' + esc(t('roadLead')) + '</p>' +
      (h.total ? '<p class="small"><b>' + esc(t('heard')(h.answered, h.total)) + '</b></p>' : '') +
      '<ul class="items">' + (list || '<li class="mute">' + esc(t('noItems')) + '</li>') + '</ul></section>' +
      '<form id="suggest-form" class="card" novalidate><label for="f-suggest">' + esc(t('suggestLabel')) + '</label><input type="text" id="f-suggest" maxlength="' + R.LIMITS.item + '" dir="' + boxDir(state.suggest) + '" value="' + esc(state.suggest) + '" autocomplete="off">' +
      '<div class="actions"><button type="submit" class="wide">' + esc(t('suggest')) + '</button></div></form>';
  }

  function tabVerdict(raw) {
    var v = R.verdict(raw), c = R.counts(raw);
    var rows = c.map(function (x) { return '<tr><td>' + esc(t('acts')[x.kind]) + '</td><td class="num">' + x.n + '</td><td class="num">' + x.weight + '</td><td class="num">' + x.subtotal + '</td></tr>'; }).join('');
    var msg = v.state === 'testing' ? t('v').testing(v.day) : t('v')[v.state];
    var decide = '';
    if (v.state !== 'testing') {
      decide = raw.decision ? '<p class="banner ok">' + esc(t('decided')[raw.decision]) + '</p>'
        : (state.role === 'owner' ? '<h3>' + esc(t('decide')) + '</h3><div class="row-actions"><button type="button" class="ghost" data-decide="continue">' + esc(t('continue')) + '</button><button type="button" class="ghost" data-decide="change">' + esc(t('change')) + '</button><button type="button" class="ghost" data-decide="stop">' + esc(t('stop')) + '</button></div>'
          : '<p class="mute">' + esc(t('ownerOnly')) + '</p>');
    } else decide = '<p class="small mute">' + esc(t('waitDay')) + '</p>';
    return '<section class="card"><h2>' + esc(t('verdictTitle')) + '</h2><table><thead><tr><th>' + esc(t('act')) + '</th><th class="num">' + esc(t('times')) + '</th><th class="num">' + esc(t('counts')) + '</th><th class="num">=</th></tr></thead><tbody>' + rows +
      '</tbody><tfoot><tr><td colspan="3">' + esc(t('total')) + '</td><td class="num">' + v.score + ' / ' + v.needed + '</td></tr></tfoot></table>' +
      '<p><b>' + esc(msg) + '</b></p><p class="small mute">' + esc(t('suggestion')) + '</p>' + decide + '</section>' +
      (raw.remote ? '' : '<section class="card demo"><h2>' + esc(t('demo')) + '</h2><div class="row-actions"><button type="button" class="ghost" data-act="skipday">' + esc(t('skipDay')) + '</button><button type="button" class="ghost" data-act="skipend">' + esc(t('skipEnd')) + '</button></div></section>');
  }

  /* The shared service: ask for everything this device may see, and re-draw only if something changed. */
  var lastRemote = '', lastMsg = '';
  function refreshRemote() {
    if (!Remote.enabled) return Promise.resolve(false);
    return Remote.list().then(function (list) {
      var j = JSON.stringify(list), changed = j !== lastRemote || lastMsg !== '';
      lastRemote = j; lastMsg = ''; state.remoteMsg = ''; state.remote = list; return changed;
    }).catch(function () {
      var changed = lastMsg !== 'remoteFailed'; lastMsg = 'remoteFailed'; state.remoteMsg = 'remoteFailed'; return changed;
    });
  }
  /** Do something on the shared service, then show what it now says. A refusal shows the same plain message. */
  function remoteDo(promise) {
    return promise.then(function () { return refreshRemote(); }, function () { state.remoteMsg = 'remoteFailed'; lastMsg = 'remoteFailed'; return refreshRemote().then(function () { state.remoteMsg = 'remoteFailed'; lastMsg = 'remoteFailed'; }); }).then(function () { render(); });
  }
  function typing() { var a = document.activeElement; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); }

  function render() {
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'he' ? 'rtl' : 'ltr';
    document.title = t('title') + ' — Soycatory';
    var toggle = document.getElementById('lang-toggle');
    toggle.textContent = t('otherLang'); toggle.setAttribute('lang', state.lang === 'he' ? 'en' : 'he');
    document.getElementById('brand-title').textContent = t('title');
    document.getElementById('credit').textContent = t('credit');
    app.innerHTML = state.screen === 'new' ? viewNew() : state.screen === 'room' ? viewRoom() : viewList();
    var h = app.querySelector('h1'); if (h) { h.setAttribute('tabindex', '-1'); }
  }
  function go(screen) { state.screen = screen; state.error = ''; state.error2 = ''; state.resetAsk = false; render(); window.scrollTo(0, 0); }
  function openRoom(id) { state.currentId = id; var cr = current(); if (cr && cr.remote) state.role = cr.owner ? 'owner' : 'visitor'; state.tab = 'idea'; state.role = (cr && cr.remote && !cr.owner) ? 'visitor' : 'owner'; state.survey = { q: '', o: '' }; state.suggest = ''; state.declining = ''; state.declineText = ''; go('room'); }

  /* Typing keeps drafts, and each box keeps its own direction. */
  app.addEventListener('input', function (e) {
    var el = e.target, id = el.id;
    if (!id) return;
    if (id === 'f-name') state.draft.name = el.value;
    else if (id === 'f-problem') state.draft.problem = el.value;
    else if (id === 'f-promise') state.draft.promise = el.value;
    else if (id === 's-q') state.survey.q = el.value;
    else if (id === 's-o') state.survey.o = el.value;
    else if (id === 'f-suggest') state.suggest = el.value;
    else if (id === 'f-decline') state.declineText = el.value;
    el.dir = boxDir(el.value);
  });

  app.addEventListener('submit', function (e) {
    e.preventDefault();
    if (e.target.id === 'new-form') {
      var d = state.draft, r = R.makeIdea(d.name, d.problem, d.promise, d.mascot, newId());
      if (!r.ok) { state.error = r.why === 'name' ? 'errName' : r.why === 'problem' ? 'errProblem' : 'errPromise'; render(); return; }
      if (d.shared && Remote.enabled) {
        Remote.newIdea(r.idea).then(function (id) { return refreshRemote().then(function () { openRoom(String(id)); }); }, function () { state.remoteMsg = 'remoteFailed'; render(); });
        return;
      }
      state.ideas = state.ideas.concat([r.idea]).slice(-R.LIMITS.ideas); save(); openRoom(r.idea.id);
    } else if (e.target.id === 'suggest-form') {
      var raw = current(); if (!raw) return;
      var a = R.addItem(raw, state.suggest, newId());
      if (a.ok) { var text = state.suggest; state.suggest = ''; if (raw.remote) remoteDo(Remote.addItem(raw.id, text)); else { update(a.idea); render(); } }
    }
  });

  app.addEventListener('click', function (e) {
    var el = e.target.closest('button'); if (!el) return;
    var raw = current();
    if (el.dataset.open) return openRoom(el.dataset.open);
    if (el.dataset.tab) { state.tab = el.dataset.tab; return render(); }
    if (el.dataset.role) { state.role = el.dataset.role; return render(); }
    if (el.dataset.mascot) { state.draft.mascot = el.dataset.mascot; return render(); }
    if (el.dataset.where) { state.draft.shared = el.dataset.where === 'shared'; return render(); }
    if (el.dataset.signal && raw) { if (raw.remote) return remoteDo(Remote.signal(raw.id, el.dataset.signal)); update(R.toggleSignal(raw, el.dataset.signal)); return render(); }
    if (el.dataset.vote && raw) { if (raw.remote) return remoteDo(Remote.vote(raw.id, Number(el.dataset.vote))); update(R.vote(raw, Number(el.dataset.vote))); return render(); }
    if (el.dataset.decline) { state.declining = el.dataset.decline; state.declineText = ''; return render(); }
    if (el.dataset.trust && raw && state.role === 'owner') {
      if (raw.remote) { var it0 = raw.items.filter(function (x) { return x.id === el.dataset.item; })[0]; return remoteDo(Remote.trust(el.dataset.item, Number(el.dataset.trust), it0 ? it0.text.slice(0, R.LIMITS.why) : '')); }
      var g = R.awardTrust(raw, el.dataset.item, Number(el.dataset.trust), '', newId()); if (g.ok) { var item = raw.items.filter(function (x) { return x.id === el.dataset.item; })[0]; g.idea.trust[g.idea.trust.length - 1].why = item ? (itemText(raw, item) || '').slice(0, R.LIMITS.why) : ''; update(g.idea); } return render(); }
    if (el.dataset.move && raw) { if (raw.remote) return remoteDo(Remote.move(el.dataset.item, el.dataset.move)); update(R.moveItem(raw, el.dataset.item, el.dataset.move)); return render(); }
    if (el.dataset.decide && raw && state.role === 'owner') { if (raw.remote) return remoteDo(Remote.decide(raw.id, el.dataset.decide)); update(Object.assign({}, raw, { decision: el.dataset.decide })); return render(); }
    switch (el.dataset.act) {
      case 'new': state.draft = { name: '', problem: '', promise: '', mascot: 'fox', shared: false }; return go('new');
      case 'cancel': case 'back': return go('list');
      case 'declinecancel': state.declining = ''; return render();
      case 'declinesend': if (raw) { var why = state.declineText; state.declining = ''; state.declineText = ''; if (raw.remote) return remoteDo(Remote.move(el.dataset.item, 'decline', why)); update(R.moveItem(raw, el.dataset.item, 'decline', why)); render(); } return;
      case 'reset':
        if (!state.resetAsk) { state.resetAsk = true; return render(); }
        state.ideas = seedSamples().concat(state.ideas.filter(function (i) { return !i.sample; })).slice(0, R.LIMITS.ideas); save(); state.resetAsk = false; return render();
      case 'seat': if (raw) { if (raw.remote) return remoteDo(Remote.seat(raw.id)); update(Object.assign({}, raw, { seat: true })); render(); } return;
      case 'survey':
        if (!raw) return;
        var s = R.setSurvey(raw, state.survey.q, state.survey.o);
        if (!s.ok) { state.error2 = s.why === 'question' ? 'errQuestion' : 'errOptions'; return render(); }
        state.error2 = ''; if (raw.remote) return remoteDo(Remote.survey(raw.id, s.idea.question, s.idea.options)); update(s.idea); return render();
      case 'skipday': if (raw) { update(Object.assign({}, raw, { dayOffset: Math.min(R.DAYS, (raw.dayOffset || 0) + 1) })); render(); } return;
      case 'skipend': if (raw) { update(Object.assign({}, raw, { dayOffset: R.DAYS })); render(); } return;
    }
  });

  document.getElementById('lang-toggle').addEventListener('click', function () {
    state.lang = state.lang === 'he' ? 'en' : 'he';
    try { localStorage.setItem(LANG_KEY, state.lang); } catch (e) { /* blocked */ }
    render();
  });
  document.getElementById('brand').addEventListener('click', function () { go('list'); });

  load();
  render();
  if (Remote.enabled) {
    refreshRemote().then(function (changed) { if (changed) render(); });
    setInterval(function () {
      if (document.visibilityState !== 'visible' || typing()) return;
      refreshRemote().then(function (changed) { if (changed && !typing()) render(); });
    }, 15000);
  }
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(function () { /* optional */ });
})();
