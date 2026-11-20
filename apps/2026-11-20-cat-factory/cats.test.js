// Run with: node --test apps/2026-11-20-cat-factory/cats.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('./cats.js');

test('no job, no report; the job is trimmed and limited to 60 characters', () => {
  assert.equal(C.generate('', 1, 'en'), null);
  assert.equal(C.generate('   ', 1, 'en'), null);
  assert.equal(C.generate(null, 1, 'en'), null);
  assert.ok(C.generate('x'.repeat(300), 1, 'en').job.length <= 60);
  assert.equal(C.generate('  a   to-do   app ', 1, 'en').job, 'a to-do app');
});

test('the same job and shift always give the same report; another shift gives another', () => {
  const a = C.generate('A to-do app', 1, 'en'), b = C.generate('A to-do app', 1, 'en');
  assert.deepEqual(a, b);
  assert.deepEqual(C.generate('a TO-DO app', 1, 'en').roles.map((r) => r.did), a.roles.map((r) => r.did).map((d) => d.split('A to-do app').join('a TO-DO app')), 'case in the job does not change the choices');
  const shifts = new Set([1, 2, 3, 4, 5, 6].map((n) => JSON.stringify(C.generate('A to-do app', n, 'en').commits)));
  assert.ok(shifts.size >= 4, 'different shifts give different logs');
  assert.notEqual(JSON.stringify(C.generate('Another job', 1, 'en').roles), JSON.stringify(a.roles));
});

test('six cats, six distinct log lines, sensible numbers, nothing left blank', () => {
  for (const lang of ['en', 'he']) {
    for (let n = 1; n <= 40; n++) {
      const r = C.generate('Job ' + n, n, lang);
      assert.equal(r.roles.length, 6);
      assert.deepEqual(r.roles.map((x) => x.id), C.ROLES);
      assert.equal(new Set(r.commits).size, 6);
      assert.ok(r.stats.chaos >= 55 && r.stats.chaos <= 99 && r.stats.naps >= 3 && r.stats.naps <= 11 && r.stats.cups >= 1 && r.stats.cups <= 7 && r.stats.jjj >= 1000 && r.stats.jjj < 10000);
      const all = JSON.stringify(r);
      assert.ok(!/undefined|NaN|\{job\}|null/.test(all), all.slice(0, 120));
      r.roles.forEach((x) => { assert.ok(x.name && x.title && x.did && x.blocker); });
    }
  }
});

test('the job is put into the lines, and Hebrew reports are in Hebrew', () => {
  const en = C.generate('Moon Map', 3, 'en');
  assert.ok(en.roles.some((r) => r.did.includes('Moon Map')));
  const he = C.generate('מפת ירח', 3, 'he');
  assert.ok(he.roles.some((r) => r.did.includes('מפת ירח')));
  assert.ok(/[א-ת]/.test(he.verdict) && /[א-ת]/.test(he.version));
  assert.ok(!/[A-Za-z]/.test(he.verdict));
  assert.equal(C.generate('x', 1, 'fr').lang, 'en');
});

test('the shift number is kept in range', () => {
  assert.equal(C.generate('x', 0, 'en').shift, 1);
  assert.equal(C.generate('x', -4, 'en').shift, 1);
  assert.equal(C.generate('x', 'abc', 'en').shift, 1);
  assert.equal(C.generate('x', 5000, 'en').shift, 999);
  assert.equal(C.generate('x', 2.9, 'en').shift, 2);
});

test('the text report holds the job, the verdict, every cat and the parody label', () => {
  const r = C.generate('Tea timer', 2, 'en');
  const t = C.toText(r);
  assert.ok(t.includes('Tea timer') && t.includes(r.verdict) && t.includes(r.version) && t.includes('Parody'));
  r.roles.forEach((x) => assert.ok(t.includes(x.name)));
  const th = C.toText(C.generate('טיימר תה', 2, 'he'));
  assert.ok(th.includes('פרודיה') && th.includes('טיימר תה'));
});

test('direction follows the first letter, not an empty box', () => {
  assert.equal(C.dirFor('שלום'), 'rtl');
  assert.equal(C.dirFor('Hello'), 'ltr');
  assert.equal(C.dirFor(''), '');
  assert.equal(C.dirFor('123'), '');
});
