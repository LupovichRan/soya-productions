// Run with: node --test apps/2026-11-20-idea-room/room.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('./room.js');
const DAY = 86400000;
const mk = (extra) => Object.assign(R.makeIdea('Lineless', 'Waiting rooms', 'See the wait', 'fox', 'i1', 0).idea, extra || {});

test('an idea needs a name, a problem and a promise; limits apply; bad mascot becomes fox', () => {
  assert.deepEqual(R.makeIdea('', 'p', 'q', 'cat', 'x'), { ok: false, why: 'name' });
  assert.deepEqual(R.makeIdea('n', ' ', 'q', 'cat', 'x'), { ok: false, why: 'problem' });
  assert.deepEqual(R.makeIdea('n', 'p', '', 'cat', 'x'), { ok: false, why: 'promise' });
  const i = R.makeIdea('n'.repeat(200), 'p'.repeat(900), 'q'.repeat(900), 'dragon', 'x', 5).idea;
  assert.ok(i.name.length <= 60 && i.problem.length <= 300 && i.promise.length <= 200);
  assert.equal(i.mascot, 'fox');
  assert.equal(i.startedAt, 5);
  assert.equal(R.makeIdea('n', 'p', 'q', 'owl', 'x').idea.mascot, 'owl');
});

test('a new idea starts with nothing: no score, no voice, no invented demand', () => {
  const i = mk();
  assert.equal(R.score(i), 0);
  assert.equal(R.voice(i), 0);
  assert.deepEqual(R.verdict(i, 0), { state: 'testing', day: 1, score: 0, needed: 20 });
});

test('signals: each kind once, weighted, and can be taken back', () => {
  let i = R.toggleSignal(mk(), 'follow');
  i = R.toggleSignal(i, 'pledge');
  assert.equal(R.score(i), 1 + 4);
  i = R.toggleSignal(i, 'follow');
  assert.equal(R.score(i), 4);
  assert.equal(R.score(R.toggleSignal(R.toggleSignal(mk(), 'want'), 'want')), 0);
  assert.equal(R.toggleSignal(mk(), 'nonsense').mine.nonsense, undefined);
  assert.deepEqual(R.counts(mk({ others: { want: 3 } })).find((c) => c.kind === 'want'), { kind: 'want', n: 3, weight: 2, subtotal: 6 });
  assert.equal(R.score(mk({ others: { follow: 4, call: 2 } })), 4 + 10);
});

test('the day runs 1 to 14 and a demo offset can move it', () => {
  assert.equal(R.day(mk(), 0), 1);
  assert.equal(R.day(mk(), 3 * DAY + 5), 4);
  assert.equal(R.day(mk(), 99 * DAY), 14);
  assert.equal(R.day(mk({ dayOffset: 13 }), 0), 14);
  assert.equal(R.day(mk(), -5 * DAY), 1);
});

test('verdict: testing until day 14, then continue, change or stop from the score', () => {
  assert.equal(R.verdict(mk({ others: { call: 9 } }), 5 * DAY).state, 'testing');
  const end = 20 * DAY;
  assert.equal(R.verdict(mk({ others: { call: 4 } }), end).state, 'continue');
  assert.equal(R.verdict(mk({ others: { call: 2 } }), end).state, 'change');
  assert.equal(R.verdict(mk({ others: { call: 1 } }), end).state, 'stop');
  assert.equal(R.verdict(mk(), end).state, 'stop');
});

test('voice: none without a seat, one with a seat, one more per three trust points, at most four', () => {
  let i = mk();
  assert.equal(R.voice(i), 0);
  i = Object.assign({}, i, { seat: true });
  assert.equal(R.voice(i), 1);
  const trust = (n) => Object.assign({}, i, { trust: [{ id: 'g', itemId: 'a', points: n, why: '' }] });
  assert.equal(R.voice(trust(2)), 1);
  assert.equal(R.voice(trust(3)), 2);
  assert.equal(R.voice(trust(5)), 2);
  assert.equal(R.voice(Object.assign({}, i, { trust: [1, 2, 3, 4, 5].map((n) => ({ id: 'g' + n, itemId: 'a' + n, points: 5, why: '' })) })), 4);
  // Trust without a seat gives no voice.
  assert.equal(R.voice(Object.assign({}, mk(), { trust: [{ id: 'g', itemId: 'a', points: 5, why: '' }] })), 0);
  assert.equal(R.trustTotal(trust(4)), 4);
  assert.equal(R.trustTotal(mk()), 0);
});

test('trust: only the owner gives it, for your accepted suggestion or accepted work, 1 to 5, at most 5 per item', () => {
  let i = R.addItem(mk({ seat: true }), 'Draw the first screen', 'a').idea;
  assert.deepEqual(R.awardTrust(i, 'a', 3, 'x', 'g1'), { ok: false, why: 'item' }, 'not accepted yet');
  i = R.moveItem(i, 'a', 'accept');
  assert.deepEqual(R.awardTrust(i, 'a', 0, 'x', 'g1'), { ok: false, why: 'points' });
  assert.deepEqual(R.awardTrust(i, 'a', 6, 'x', 'g1'), { ok: false, why: 'points' });
  assert.deepEqual(R.awardTrust(i, 'zzz', 2, 'x', 'g1'), { ok: false, why: 'item' });
  let r = R.awardTrust(i, 'a', 3, 'Good first screen', 'g1');
  assert.equal(r.ok, true);
  i = r.idea;
  assert.equal(R.trustTotal(i), 3);
  assert.equal(R.voice(i), 2);
  assert.deepEqual(R.awardTrust(i, 'a', 3, 'x', 'g2'), { ok: false, why: 'limit' });
  assert.equal(R.awardTrust(i, 'a', 2, 'x', 'g2').ok, true);
  // Work somebody else did cannot earn you trust.
  const other = Object.assign(mk(), { items: [{ id: 'o', text: 't', by: 'other', status: 'done', claimedBy: '', reply: '' }] });
  assert.deepEqual(R.awardTrust(other, 'o', 2, 'x', 'g'), { ok: false, why: 'item' });
  // Work you did counts once it is done.
  let w = Object.assign(mk(), { items: [{ id: 'w', text: 't', by: 'other', status: 'claimed', claimedBy: 'you', reply: '' }] });
  assert.equal(R.awardTrust(w, 'w', 2, 'x', 'g').ok, false);
  w = R.moveItem(w, 'w', 'done');
  assert.equal(R.awardTrust(w, 'w', 2, 'x', 'g').ok, true);
});

test('every suggestion gets an answer: accept or decline with a reason; the count shows who is still waiting', () => {
  let i = R.addItem(R.addItem(mk(), 'One', 'a').idea, 'Two', 'b').idea;
  assert.deepEqual(R.heard(i), { answered: 0, total: 2 });
  i = R.moveItem(i, 'a', 'decline', '  Not for the first version  ');
  assert.equal(i.items[0].status, 'declined');
  assert.equal(i.items[0].reply, 'Not for the first version');
  assert.deepEqual(R.heard(i), { answered: 1, total: 2 });
  assert.equal(R.moveItem(i, 'a', 'accept'), i, 'a declined suggestion stays declined');
  assert.equal(R.moveItem(i, 'b', 'decline', 'x' .repeat(500)).items[1].reply.length <= 120, true);
  assert.deepEqual(R.heard(R.moveItem(i, 'b', 'accept')), { answered: 2, total: 2 });
  assert.deepEqual(R.heard(mk()), { answered: 0, total: 0 });
});

test('roadmap moves in order only: proposed, accepted, claimed, done', () => {
  let i = R.addItem(mk(), '  Book a test clinic ', 'a').idea;
  assert.equal(i.items[0].text, 'Book a test clinic');
  assert.equal(i.items[0].status, 'proposed');
  assert.deepEqual(R.addItem(mk(), '   ', 'x'), { ok: false, why: 'empty' });
  assert.equal(R.moveItem(i, 'a', 'claim'), i, 'cannot claim before it is accepted');
  assert.equal(R.moveItem(i, 'a', 'done'), i, 'cannot finish before it is claimed');
  i = R.moveItem(i, 'a', 'accept');
  i = R.moveItem(i, 'a', 'claim');
  assert.equal(i.items[0].claimedBy, 'you');
  i = R.moveItem(i, 'a', 'done');
  assert.equal(i.items[0].status, 'done');
  assert.equal(R.acceptedWork(i), 1);
  assert.equal(R.moveItem(i, 'a', 'accept'), i, 'cannot go backwards');
  const full = Object.assign(mk(), { items: Array.from({ length: 20 }, (_, k) => ({ id: 'z' + k, text: 't', by: 'you', status: 'proposed', claimedBy: '' })) });
  assert.deepEqual(R.addItem(full, 'one more', 'q'), { ok: false, why: 'full' });
});

test('survey: needs a question and two to four options; votes count at your voice; no seat, no vote', () => {
  assert.deepEqual(R.setSurvey(mk(), '', 'a\nb'), { ok: false, why: 'question' });
  assert.deepEqual(R.setSurvey(mk(), 'Which first?', 'only one'), { ok: false, why: 'options' });
  let i = R.setSurvey(mk(), 'Which first?', 'Family\n\nChildren\nDental\nFive\nSix').idea;
  assert.deepEqual(i.options, ['Family', 'Children', 'Dental', 'Five']);
  assert.deepEqual(R.tally(i), [0, 0, 0, 0]);
  assert.equal(R.vote(i, 1), i, 'no seat, no vote');
  i = Object.assign({}, i, { seat: true });
  i = R.vote(i, 1);
  assert.deepEqual(R.tally(i), [0, 1, 0, 0]);
  i = R.vote(i, 2);
  assert.deepEqual(R.tally(i), [0, 0, 1, 0], 'voting again replaces the vote');
  assert.equal(R.vote(i, 9), i);
  i = Object.assign({}, i, { votes: [3, 0, 2, 0] });
  assert.deepEqual(R.tally(i), [3, 0, 3, 0]);
});

test('stored data is cleaned: junk is dropped, limits and enums re-applied', () => {
  assert.deepEqual(R.clean(null), []);
  assert.deepEqual(R.clean('x'), []);
  const out = R.clean([
    null, 5, { id: 'a' }, { id: '', name: 'n', problem: 'p', promise: 'q' },
    { id: 'ok', name: 'N'.repeat(200), problem: 'p', promise: 'q', mascot: 'dragon', startedAt: 'x', dayOffset: 99, seat: 'yes',
      mine: { follow: true, bogus: true, want: 1 }, others: { want: 5000, share: -2 },
      items: [{ id: 'i', text: 't', status: 'weird' }, { id: 'j', text: 't', status: 'done', claimedBy: 'you', by: 'you' }],
      options: ['a', 'b'], votes: [1, 'x'], myVote: 5, decision: 'maybe' },
    { id: 's', sample: 'lineless', name: '', problem: '', promise: '' }
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].name.length, 60);
  assert.equal(out[0].mascot, 'fox');
  assert.equal(out[0].dayOffset, 14);
  assert.equal(out[0].seat, false);
  assert.deepEqual(out[0].mine, { follow: true });
  assert.deepEqual(out[0].others, { want: 1000 });
  assert.equal(out[0].items.length, 1);
  assert.deepEqual(out[0].votes, [1, 0]);
  assert.equal(out[0].myVote, -1);
  assert.equal(out[0].decision, '');
  assert.ok(out[0].startedAt > 0);
  assert.equal(out[1].sample, 'lineless');
  const withTrust = R.clean([{ id: 't', name: 'n', problem: 'p', promise: 'q', items: [{ id: 'i1', text: 'x', status: 'done', claimedBy: 'you' }],
    trust: [{ id: 'g1', itemId: 'i1', points: 3, why: 'ok' }, { id: 'g2', itemId: 'nope', points: 3 }, { id: 'g3', itemId: 'i1', points: 9 }, { id: 'g4', itemId: 'i1', points: 2.5 }, null] }]);
  assert.deepEqual(withTrust[0].trust, [{ id: 'g1', itemId: 'i1', points: 3, why: 'ok' }]);
  assert.equal(R.clean(Array.from({ length: 30 }, (_, k) => ({ id: 'x' + k, name: 'n', problem: 'p', promise: 'q' }))).length, 12);
});

test('direction follows the first letter, not an empty box', () => {
  assert.equal(R.dirFor('שלום'), 'rtl');
  assert.equal(R.dirFor('Hello'), 'ltr');
  assert.equal(R.dirFor('  123 שלום'), 'rtl');
  assert.equal(R.dirFor(''), '');
  assert.equal(R.dirFor('123'), '');
});
