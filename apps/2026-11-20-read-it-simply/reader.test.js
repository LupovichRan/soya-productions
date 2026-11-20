// Run with: node --test apps/2026-11-20-read-it-simply/reader.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { read, sentences } = require('./reader.js');

const EN = `Dear Mr. Cohen,

Our records show that your account no. 48213 has an outstanding balance of $245.60 for the period ending 31 October 2026. You must pay this amount by December 5, 2026 to avoid a late fee of $25. If you have already paid, please ignore this notice.

Please return the signed form within 14 days. Failure to do so may result in suspension of your service. Your new plan costs 39.90 USD per month from 1/1/2027.

Questions? Call us on 1-800-555-0199 or email billing@example-utility.com, or visit www.example-utility.com/pay.`;

const HE = `שלום רב,

נמצאה יתרת חוב בסך 1,250 ש"ח בגין ארנונה. עליך לשלם את החוב עד ליום 15.12.2026. אי תשלום במועד יגרור ריבית.

יש להגיש בקשה להנחה תוך 30 ימים ממועד קבלת מכתב זה. ניתן לפנות למוקד בטלפון 03-555-0123 או *3456, או בדוא"ל arnona@example.muni.il.`;

test('sentences are not split inside titles, numbers or dates', () => {
  const s = sentences(EN);
  assert.ok(s.some(x => x.includes('account no. 48213') && x.includes('$245.60') && x.endsWith('2026.')));
  assert.ok(s.some(x => x.startsWith('Dear Mr. Cohen')));
});

test('an English letter: asks, dates, amounts and contacts are found word for word', () => {
  const r = read(EN);
  assert.equal(r.lang, 'en');
  assert.ok(r.asks.includes('You must pay this amount by December 5, 2026 to avoid a late fee of $25.'));
  assert.ok(r.asks.includes('Please return the signed form within 14 days.'));
  assert.ok(!r.asks.some(a => a.startsWith('Our records show')));
  assert.deepEqual(r.deadlines.map(d => d.when), ['31 October 2026', 'December 5, 2026', 'within 14 days', '1/1/2027']);
  assert.deepEqual(r.amounts.map(a => a.amount), ['$245.60', '$25', '39.90 USD']);
  assert.deepEqual(r.contacts, ['billing@example-utility.com', 'www.example-utility.com/pay', '1-800-555-0199']);
  for (const a of r.asks) assert.ok(EN.replace(/\s+/g, ' ').includes(a), 'every ask is text from the letter');
});

test('a Hebrew letter is read the same way', () => {
  const r = read(HE);
  assert.equal(r.lang, 'he');
  assert.deepEqual(r.asks, ['עליך לשלם את החוב עד ליום 15.12.2026.', 'יש להגיש בקשה להנחה תוך 30 ימים ממועד קבלת מכתב זה.']);
  assert.deepEqual(r.deadlines.map(d => d.when), ['15.12.2026', 'תוך 30 ימים']);
  assert.deepEqual(r.amounts.map(a => a.amount), ['1,250 ש"ח']);
  assert.deepEqual(r.contacts, ['arnona@example.muni.il', '03-555-0123', '*3456']);
});

test('a friendly note asks nothing, and empty text is safe', () => {
  const r = read('Hi! Just saying thanks for dinner. See you soon.');
  assert.deepEqual([r.asks, r.deadlines, r.amounts, r.contacts], [[], [], [], []]);
  assert.equal(read('').sentences, 0);
  assert.equal(read(null).opening, '');
});

test('long lists are capped and repeats are dropped', () => {
  const many = Array.from({ length: 20 }, (_, i) => `You must send form ${i} by 1/2/2027.`).join(' ');
  const r = read(many);
  assert.equal(r.asks.length, 6);
  assert.equal(r.deadlines.length, 1);
});

test('a text box takes its direction from its first letter', () => {
  const { dirFor } = require('./reader.js');
  assert.equal(dirFor(''), '');
  assert.equal(dirFor('   123 !?'), '');
  assert.equal(dirFor('שלום'), 'rtl');
  assert.equal(dirFor('12/3 שלום'), 'rtl');          // digits do not decide
  assert.equal(dirFor('Hello שלום'), 'ltr');
  assert.equal(dirFor('"שלום" hello'), 'rtl');       // nor do quotes
  assert.equal(dirFor('مرحبا'), 'rtl');
});

test('a mixed-language letter gives each opening sentence on its own', () => {
  const r = read('שלום רב. Please call us on 03-555-0123. עליך לשלם עד 15.12.2026.');
  assert.deepEqual(r.openingSentences, ['שלום רב.', 'Please call us on 03-555-0123.']);
});
