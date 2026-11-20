// Run with: node --test apps/2026-11-20-say-it-kindly/softener.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { check, apply, dirFor } = require('./softener.js');

const ids = (text) => check(text).map(f => f.id);
/** Apply findings one at a time, re-checking after each, as the app does. */
function applyAll(text) {
  for (let guard = 0; guard < 20; guard++) {
    const f = check(text).find(x => x.to != null);
    if (!f) return text;
    text = apply(text, f);
  }
  return text;
}

test('English: the phrases that land hard are found, in reading order', () => {
  const t = "You ALWAYS do this!! Obviously, you never listen. Why didn't you call me? You should have asked, whatever.";
  assert.deepEqual(ids(t), ['always', 'bangs', 'obviously', 'never', 'why-didnt', 'should', 'whatever']);
});

test('English: swaps read as sentences, with capitals kept', () => {
  assert.equal(applyAll("You always forget the keys."), 'It often feels like you forget the keys.');
  assert.equal(applyAll("I think you never listen."), 'I think it feels like you rarely listen.');
  assert.equal(applyAll("Hi. You should call me."), 'Hi. It might help to call me.');
  assert.equal(applyAll("Why didn't you reply?"), "Can you help me understand why you didn't reply?");
  assert.equal(applyAll("You need to send it today."), 'I would appreciate it if you could send it today.');
  assert.equal(applyAll('Stop it!!!'), 'Stop it!');
  assert.equal(applyAll('Are you serious???'), 'Are you serious?');
  assert.equal(applyAll('This is TERRIBLE news'), 'This is terrible news');
});

test('English: removing "Obviously," keeps the next sentence capitalised', () => {
  assert.equal(applyAll('Obviously, the deadline is Friday.'), 'The deadline is Friday.');
  assert.equal(applyAll('Thanks. Obviously, I am late.'), 'Thanks. I am late.');
});

test('English: phrases with no safe swap are flagged but not rewritten', () => {
  for (const t of ['whatever you say', "I don't care", 'You are so stupid', 'Send it ASAP']) {
    const f = check(t);
    assert.equal(f.length, 1, t);
    assert.equal(f[0].to, null, t);
    assert.equal(applyAll(t), t);
  }
});

test('English: ordinary words and acronyms are left alone', () => {
  for (const t of ['Thanks for dinner, see you soon.', 'Please send the PDF to HR, OK?', 'I always enjoy our chats.', 'We never met, but I know your work.', 'Could you please check the AI report?']) {
    assert.deepEqual(check(t), [], t);
  }
});

test('Hebrew: the phrases that land hard are found and swapped, with the verb left alone', () => {
  assert.equal(applyAll('אתה תמיד מאחר'), 'נדמה לי שאתה לעיתים קרובות מאחר');
  assert.equal(applyAll('את תמיד שוכחת'), 'נדמה לי שאת לעיתים קרובות שוכחת');
  assert.equal(applyAll('אתה אף פעם לא מקשיב'), 'נדמה לי שאתה לא תמיד מקשיב');
  assert.equal(applyAll('אתה חייב להגיע'), 'אשמח אם תוכל להגיע');
  assert.equal(applyAll('את חייבת להגיע'), 'אשמח אם תוכלי להגיע');
  assert.equal(applyAll('אתם חייבים להגיע'), 'אשמח אם תוכלו להגיע');
  assert.equal(applyAll('באמת!!'), 'באמת!');
});

test('Hebrew: phrases with no safe swap are flagged, and ordinary words are left alone', () => {
  assert.deepEqual(ids('ברור שאתה טועה'), ['he-obviously']);
  assert.deepEqual(ids('לא אכפת לי'), ['he-dont-care']);
  assert.deepEqual(ids('אתה אידיוט'), ['he-insult']);
  assert.deepEqual(ids('תשלח את זה מיד'), ['he-urgent']);
  assert.deepEqual(check('תודה על הארוחה, נתראה בקרוב.'), []);
  assert.deepEqual(check('המידע נשלח. אני תמיד שמח לעזור.'), []);       // "מיד" inside a longer word is not flagged
  assert.deepEqual(check('את אתה'), []);
});

test('a mixed-language message is checked in both languages', () => {
  assert.deepEqual(ids('You always say that. אתה תמיד מאחר'), ['always', 'he-always']);
});

test('findings never overlap, and every finding points at the text it names', () => {
  const t = "You always... WHATEVER!! why didn't you call, you never listen";
  const f = check(t);
  for (let i = 0; i < f.length; i++) {
    assert.equal(t.slice(f[i].start, f[i].end), f[i].text);
    if (i) assert.ok(f[i].start >= f[i - 1].end);
  }
});

test('an empty message has nothing to flag, and every finding explains itself in both languages', () => {
  assert.deepEqual(check(''), []);
  assert.deepEqual(check(null), []);
  for (const t of ["You always do this!! You should know. Whatever. stupid", 'אתה תמיד מאחר. לא אכפת לי. מיד']) {
    for (const f of check(t)) assert.ok(f.why.en && f.why.he, `${f.id} needs an explanation in both languages`);
  }
});

test('a text box takes its direction from its first letter', () => {
  assert.equal(dirFor(''), '');
  assert.equal(dirFor('  12 !?'), '');
  assert.equal(dirFor('שלום'), 'rtl');
  assert.equal(dirFor('12 שלום'), 'rtl');
  assert.equal(dirFor('Hello שלום'), 'ltr');
});
