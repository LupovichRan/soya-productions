// Run with: node --test apps/2026-11-20-plain-steps/routines.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('./routines.js');

test('steps are one per line; bullets, numbers and tick marks are dropped; blanks vanish', () => {
  assert.deepEqual(R.parseSteps('Keys\n- Phone\n* Wallet\n1. Lights\n2) Door\n\n   \n✓ Windows\n• Stove'), ['Keys', 'Phone', 'Wallet', 'Lights', 'Door', 'Windows', 'Stove']);
  assert.deepEqual(R.parseSteps('א. מפתחות\n- טלפון\r\nארנק'), ['מפתחות', 'טלפון', 'ארנק']);
  assert.deepEqual(R.parseSteps(''), []);
  assert.deepEqual(R.parseSteps(null), []);
});

test('limits: 30 steps, 120 characters each, 60 for the name', () => {
  assert.equal(R.parseSteps(Array.from({ length: 50 }, (_, i) => 'Step ' + i).join('\n')).length, 30);
  assert.ok(R.parseSteps('x'.repeat(500))[0].length <= 120);
  assert.ok(R.make('n'.repeat(200), 'a').routine.name.length <= 60);
});

test('a routine needs a name and at least one step', () => {
  assert.deepEqual(R.make('', 'a'), { ok: false, why: 'name' });
  assert.deepEqual(R.make('  ', 'a'), { ok: false, why: 'name' });
  assert.deepEqual(R.make('Morning', '\n\n'), { ok: false, why: 'steps' });
  const r = R.make('Morning', 'Water\nDress', 'r1', 5).routine;
  assert.deepEqual(r, { id: 'r1', name: 'Morning', steps: [{ text: 'Water', done: false }, { text: 'Dress', done: false }], at: 5 });
});

test('ticking, starting again and progress', () => {
  let r = R.make('Morning', 'Water\nDress\nEat', 'r1').routine;
  assert.deepEqual(R.progress(r), { done: 0, total: 3, complete: false });
  r = R.toggle(R.toggle(r, 0), 2);
  assert.deepEqual(R.progress(r), { done: 2, total: 3, complete: false });
  assert.deepEqual(r.steps.map(s => s.done), [true, false, true]);
  r = R.toggle(r, 0);                                                   // ticking again unticks
  assert.deepEqual(r.steps.map(s => s.done), [false, false, true]);
  assert.equal(R.progress(R.toggle(R.toggle(R.toggle(R.reset(r), 0), 1), 2)).complete, true);
  assert.deepEqual(R.reset(r).steps.map(s => s.done), [false, false, false]);
});

test('the functions do not change what they are given', () => {
  const r = R.make('A', 'one\ntwo', 'r1').routine; const copy = JSON.stringify(r);
  R.toggle(r, 0); R.reset(r); R.edit(r, 'B', 'x');
  assert.equal(JSON.stringify(r), copy);
});

test('editing keeps the ticks on steps whose words did not change', () => {
  let r = R.toggle(R.make('A', 'one\ntwo\nthree', 'r1', 9).routine, 1);   // "two" is ticked
  const e = R.edit(r, 'A2', 'one\ntwo\nfour').routine;
  assert.equal(e.name, 'A2'); assert.equal(e.id, 'r1'); assert.equal(e.at, 9);
  assert.deepEqual(e.steps.map(s => [s.text, s.done]), [['one', false], ['two', true], ['four', false]]);
  assert.equal(R.edit(r, '', 'x').ok, false);
});

test('stored data is made safe before use', () => {
  const dirty = [
    { id: 'a', name: 'Good', steps: [{ text: 'one', done: true }, { text: '   ' }, { text: 7 }, null, { text: 'two', done: 'yes' }], at: 3 },
    { name: 'No steps', steps: [] }, { name: 5, steps: [{ text: 'x' }] }, null, 'junk', { id: 'b', name: 'Also good', steps: [{ text: 'z' }] },
  ];
  const out = R.sanitize(dirty);
  assert.deepEqual(out.map(r => r.name), ['Good', 'Also good']);
  assert.deepEqual(out[0].steps, [{ text: 'one', done: true }, { text: 'two', done: false }]);   // only a real true counts as done
  assert.deepEqual(R.sanitize('nope'), []);
  assert.equal(R.sanitize(Array.from({ length: 50 }, (_, i) => ({ id: i, name: 'r' + i, steps: [{ text: 's' }] }))).length, 20);
});

test('the examples are short, plain, and the same in both languages', () => {
  assert.equal(R.TEMPLATES.en.length, R.TEMPLATES.he.length);
  for (const lang of ['en', 'he']) for (const t of R.TEMPLATES[lang]) {
    assert.ok(t.name && t.steps.length >= 4 && t.steps.length <= 8, t.name);
    assert.ok(t.steps.every(s => s.length <= 60), t.name);
    assert.equal(R.make(t.name, t.steps.join('\n')).ok, true);
  }
  R.TEMPLATES.en.forEach((t, i) => assert.equal(t.steps.length, R.TEMPLATES.he[i].steps.length));
});

test('a text box takes its direction from its first letter', () => {
  assert.equal(R.dirFor(''), ''); assert.equal(R.dirFor('12 !'), '');
  assert.equal(R.dirFor('שלום'), 'rtl'); assert.equal(R.dirFor('Hello שלום'), 'ltr'); assert.equal(R.dirFor('3 מפתחות'), 'rtl');
});
