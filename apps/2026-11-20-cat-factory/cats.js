/* Cat Factory: the parody. Pure functions with no page, storage or network, so they can be tested alone.
   The same job and shift number always give the same report, so a report can be shared and checked.
   Nothing here is real software advice; it is a joke about software teams, told by cats. */
(function (root) {
  'use strict';

  var LIMIT = 60;
  var ROLES = ['pm', 'dev', 'qa', 'ops', 'design', 'intern'];

  var TEXT = {
    en: {
      names: { pm: 'Admiral Whiskers', dev: 'Pixel', qa: 'Mochi', ops: 'Noodle', design: 'Biscuit', intern: 'Soya' },
      titles: { pm: 'Product Manager', dev: 'Developer', qa: 'Quality Check', ops: 'Operations', design: 'Designer', intern: 'Intern' },
      did: {
        pm: ['Stared at the wall and called it a roadmap for {job}.', 'Booked a meeting about {job}, then fell asleep in it.', 'Declared {job} a top priority. It is always the top priority.', 'Moved the deadline. Also the sofa.'],
        dev: ['Sat on the keyboard and wrote 4,017 lines of "jjjjjjj" for {job}.', 'Fixed the biggest bug in {job} by knocking it off the table.', 'Refused to start {job} until a box arrived.', 'Deleted the tests for {job}. They looked at it funny.'],
        qa: ['Pushed a cup off the table. Test failed successfully.', 'Found 12 bugs in {job}. Eleven were the cup.', 'Approved {job} because it was warm.', 'Will not sign off on {job} until someone opens the tuna.'],
        ops: ['Napped on the server. The server is warm and happy.', 'Restarted {job} by stepping on the power strip.', 'Watched {job} very closely. It was the red dot.', 'Uptime: 99.9 percent. The other 0.1 was a nap.'],
        design: ['Pushed every button in {job} to the edge of the screen.', 'Chose the colour of {job} to match the cat. Black.', 'Made the logo bigger. Then bigger. Then a paw.', 'Called {job} finished when it fit in a box.'],
        intern: ['Chased the mouse cursor all through {job}.', 'Brought a real bug to the demo. A real one.', 'Got lost in the spreadsheet and napped there.', 'Asked "is it lunch yet?" at the big meeting.']
      },
      blockers: ['the box is too small', 'the sun moved', 'someone closed the door', 'the red dot is gone', 'the bowl is three quarters empty (a crisis)', 'a vacuum cleaner exists', 'the good chair is taken', 'it is raining on the window again'],
      commits: ['fix: sat on keyboard', 'feat: added jjjjjjjjjjjj', 'chore: knocked package off desk', 'refactor: moved everything to the edge', 'revert: revert the revert of the revert (paw on trackpad)', 'docs: wrote "meow" in the readme', 'perf: fewer steps to the food bowl', 'test: removed the failing test (it was the cup)', 'style: now with more fur', 'fix: remove hair from keyboard (it returns)', 'feat: nap mode', 'wip: wip wip wip'],
      verdicts: ['Ship it, after a nap.', 'Do not ship: a cat is sitting on the release button.', 'Shipped by accident when a paw hit Enter.', 'Postponed until the box arrives.', 'Ready, pending tuna.', 'Cancelled: the cat lost interest.'],
      shift: 'Shift', version: function (a, b) { return 'v0.' + a + '.' + b + '-nine-lives'; },
      textHead: function (job, n) { return 'Cat Factory report for "' + job + '" (shift ' + n + ')'; },
      verdictLabel: 'Ships?', commitsLabel: 'Commit log', statsLabel: 'Shift numbers', blockerLabel: 'Blocked by',
      stats: { chaos: 'Cat chaos', naps: 'Naps', cups: 'Cups on the floor', jjj: 'Lines of "jjjj"' },
      parody: 'Parody. Not real software advice. No real cats were consulted, and several were asleep.'
    },
    he: {
      names: { pm: 'האדמירל', dev: 'פיקסל', qa: 'מוצ׳י', ops: 'אטריה', design: 'ביסקוויט', intern: 'סויה' },
      titles: { pm: 'מנהל מוצר', dev: 'מפתח', qa: 'בדיקת איכות', ops: 'תפעול', design: 'מעצב', intern: 'מתמחה' },
      did: {
        pm: ['בהה בקיר וקרא לזה מפת דרכים עבור {job}.', 'קבע פגישה על {job}, ואז נרדם בתוכה.', 'הכריז ש{job} בעדיפות עליונה. זה תמיד בעדיפות עליונה.', 'דחה את המועד. וגם את הספה.'],
        dev: ['ישב על המקלדת וכתב 4,017 שורות של "ססססס" עבור {job}.', 'תיקן את הבאג הכי גדול ב{job} בכך שהפיל אותו מהשולחן.', 'סירב להתחיל את {job} עד שתגיע קופסה.', 'מחק את הבדיקות של {job}. הן הסתכלו עליו עקום.'],
        qa: ['דחף כוס מהשולחן. הבדיקה נכשלה בהצלחה.', 'מצא 12 באגים ב{job}. אחד עשר מהם היו הכוס.', 'אישר את {job} כי היה חם.', 'לא יחתום על {job} עד שמישהו יפתח את הטונה.'],
        ops: ['ישן על השרת. השרת חם ומרוצה.', 'הפעיל מחדש את {job} בכך שדרך על הרב־תקע.', 'עקב מקרוב אחרי {job}. זו הייתה הנקודה האדומה.', 'זמינות: 99.9 אחוז. 0.1 האחוזים האחרים היו שנת צהריים.'],
        design: ['דחף כל כפתור ב{job} לקצה המסך.', 'בחר את הצבע של {job} שיתאים לחתול. שחור.', 'הגדיל את הלוגו. ואז עוד. ואז כפה.', 'קבע ש{job} גמור כשהוא נכנס לקופסה.'],
        intern: ['רדף אחרי סמן העכבר בכל {job}.', 'הביא לדמו חרק אמיתי. ממש אמיתי.', 'הלך לאיבוד בגיליון האלקטרוני ונרדם שם.', 'שאל "כבר ארוחת צהריים?" בישיבה הגדולה.']
      },
      blockers: ['הקופסה קטנה מדי', 'השמש זזה', 'מישהו סגר את הדלת', 'הנקודה האדומה נעלמה', 'הקערה ריקה ברובה (משבר)', 'יש שואב אבק', 'הכיסא הטוב תפוס', 'שוב יורד גשם על החלון'],
      commits: ['תיקון: ישבתי על המקלדת', 'חדש: נוספו ססססססססס', 'תחזוקה: הפלתי חבילה מהשולחן', 'שיפוץ: הזזתי הכול לקצה', 'ביטול: ביטול של הביטול של הביטול (כפה על משטח המגע)', 'תיעוד: כתבתי "מיאו" בקובץ הקריאה', 'ביצועים: פחות צעדים אל קערת האוכל', 'בדיקה: הסרתי את הבדיקה שנכשלה (זו הייתה הכוס)', 'עיצוב: עכשיו עם יותר פרווה', 'תיקון: הסרת שערות מהמקלדת (הן חוזרות)', 'חדש: מצב תנומה', 'בעבודה: בעבודה בעבודה בעבודה'],
      verdicts: ['לשחרר, אחרי תנומה.', 'לא לשחרר: חתול יושב על כפתור השחרור.', 'שוחרר בטעות כשכפה לחצה על אנטר.', 'נדחה עד שהקופסה תגיע.', 'מוכן, בהמתנה לטונה.', 'בוטל: החתול איבד עניין.'],
      shift: 'משמרת', version: function (a, b) { return 'גרסה 0.' + a + '.' + b + ' שבע נשמות'; },
      textHead: function (job, n) { return 'דוח מפעל החתולים עבור "' + job + '" (משמרת ' + n + ')'; },
      verdictLabel: 'משחררים?', commitsLabel: 'יומן שינויים', statsLabel: 'מספרי המשמרת', blockerLabel: 'תקוע בגלל',
      stats: { chaos: 'כאוס חתולי', naps: 'תנומות', cups: 'כוסות על הרצפה', jjj: 'שורות של "ססס"' },
      parody: 'פרודיה. לא עצה אמיתית לתוכנה. לא התייעצנו עם חתולים אמיתיים, וכמה מהם ישנו.'
    }
  };

  function clip(s, n) { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; }

  /** A small, steady hash (FNV-1a) so a job always gives the same report. */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  /** A stream of steady numbers from one seed (mulberry32). */
  function stream(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(next, arr) { return arr[Math.floor(next() * arr.length)]; }
  /** n different items from a list, in a steady order. */
  function pickMany(next, arr, n) {
    var pool = arr.slice(), out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(next() * pool.length), 1)[0]);
    return out;
  }

  /** The report for a job. lang is 'en' or 'he'. shift is 1, 2, 3 … and changes the report. Returns null if there is no job. */
  function generate(job, shift, lang) {
    job = clip(job, LIMIT);
    if (!job) return null;
    lang = lang === 'he' ? 'he' : 'en';
    shift = Math.max(1, Math.min(999, Math.floor(Number(shift)) || 1));
    var T = TEXT[lang];
    var next = stream(hash(job.toLowerCase() + '|' + shift));
    var roles = ROLES.map(function (id) {
      return { id: id, name: T.names[id], title: T.titles[id], did: pick(next, T.did[id]).split('{job}').join(job), blocker: pick(next, T.blockers) };
    });
    var commits = pickMany(next, T.commits, 6);
    var stats = { chaos: 55 + Math.floor(next() * 45), naps: 3 + Math.floor(next() * 9), cups: 1 + Math.floor(next() * 7), jjj: 1000 + Math.floor(next() * 9000) };
    return { job: job, shift: shift, lang: lang, version: T.version(1 + Math.floor(next() * 9), 1 + Math.floor(next() * 9)), verdict: pick(next, T.verdicts), roles: roles, commits: commits, stats: stats };
  }

  /** The report as plain text, for copying. */
  function toText(r) {
    var T = TEXT[r.lang];
    var lines = [T.textHead(r.job, r.shift), r.version, T.verdictLabel + ' ' + r.verdict, ''];
    r.roles.forEach(function (x) { lines.push(x.name + ' (' + x.title + '): ' + x.did + ' ' + T.blockerLabel + ': ' + x.blocker + '.'); });
    lines.push('', T.commitsLabel + ':');
    r.commits.forEach(function (c) { lines.push('- ' + c); });
    lines.push('', T.statsLabel + ': ' + T.stats.chaos + ' ' + r.stats.chaos + '%, ' + T.stats.naps + ' ' + r.stats.naps + ', ' + T.stats.cups + ' ' + r.stats.cups + ', ' + T.stats.jjj + ' ' + r.stats.jjj, '', T.parody);
    return lines.join('\n');
  }

  /** 'rtl' or 'ltr' from the first strong letter; '' when there is no letter yet (the caller picks the page direction). */
  function dirFor(text) {
    var m = String(text || '').match(/[A-Za-z֐-׿]/);
    if (!m) return '';
    return /[֐-׿]/.test(m[0]) ? 'rtl' : 'ltr';
  }

  var api = { LIMIT: LIMIT, ROLES: ROLES, TEXT: TEXT, generate: generate, toText: toText, hash: hash, dirFor: dirFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SoyaCats = api;
})(typeof window !== 'undefined' ? window : globalThis);
