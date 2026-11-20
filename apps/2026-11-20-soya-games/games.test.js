// Run with: node --test apps/2026-11-20-soya-games/games.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('./games.js');

// A steady stand-in for chance, so the tests are the same every time.
const seeded = (seed) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

test('shuffle keeps every item once and does not change the original', () => {
  const src = [1, 2, 3, 4, 5, 6, 7];
  const out = G.shuffle(src, seeded(3));
  assert.deepEqual(src, [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(out.slice().sort(), src);
  assert.notDeepEqual(G.shuffle(src, seeded(1)), G.shuffle(src, seeded(2)));
});

test('pairs: each level deals twice as many cards as pairs, two of each animal, all face down', () => {
  for (const [level, pairs] of [['easy', 3], ['medium', 4], ['hard', 6]]) {
    for (let s = 1; s <= 20; s++) {
      const g = G.newPairs(level, seeded(s));
      assert.equal(g.cards.length, pairs * 2);
      const counts = {}; g.cards.forEach((c) => { counts[c.animal] = (counts[c.animal] || 0) + 1; assert.equal(c.up, false); assert.equal(c.matched, false); });
      assert.equal(Object.keys(counts).length, pairs);
      Object.values(counts).forEach((n) => assert.equal(n, 2));
      assert.deepEqual(g.cards.map((c) => c.id), g.cards.map((_, i) => i));
    }
  }
  assert.equal(G.newPairs('nonsense', seeded(1)).cards.length, 6);
});

// Find two cards that match, and two that do not.
const pairIds = (g) => { const a = g.cards[0]; return [a.id, g.cards.find((c) => c.id !== a.id && c.animal === a.animal).id]; };
const missIds = (g) => { const a = g.cards[0]; return [a.id, g.cards.find((c) => c.animal !== a.animal).id]; };

test('pairs: a match stays up; a miss waits to be turned back; tries count each pair of flips', () => {
  let g = G.newPairs('easy', seeded(5));
  const [a, b] = pairIds(g);
  g = G.flip(g, a); assert.equal(g.tries, 0); assert.equal(g.cards[a].up, true);
  g = G.flip(g, b); assert.equal(g.tries, 1); assert.equal(g.cards[a].matched && g.cards[b].matched, true); assert.equal(g.pending, false);
  const [c, d] = missIds(G.newPairs('easy', seeded(5)));
  let h = G.newPairs('easy', seeded(5));
  h = G.flip(h, c); h = G.flip(h, d);
  assert.equal(h.pending, true); assert.equal(h.tries, 1); assert.equal(h.cards[c].up && h.cards[d].up, true);
  h = G.settle(h);
  assert.equal(h.pending, false); assert.equal(h.cards[c].up || h.cards[d].up, false); assert.deepEqual(h.open, []);
  assert.equal(G.settle(g), g, 'settling with nothing to do changes nothing');
});

test('pairs: tapping while a wrong pair shows turns it back and then opens the new card', () => {
  let g = G.newPairs('medium', seeded(9));
  const [c, d] = missIds(g);
  g = G.flip(G.flip(g, c), d);
  const other = g.cards.find((x) => x.id !== c && x.id !== d).id;
  g = G.flip(g, other);
  assert.equal(g.cards[c].up, false); assert.equal(g.cards[d].up, false); assert.equal(g.cards[other].up, true); assert.deepEqual(g.open, [other]);
});

test('pairs: tapping the same card twice, a matched card, or a card that is not there does nothing', () => {
  let g = G.newPairs('easy', seeded(2));
  g = G.flip(g, 0); const again = G.flip(g, 0);
  assert.deepEqual(again.open, [0]); assert.equal(again.tries, 0);
  assert.equal(G.flip(g, 99).tries, 0); assert.equal(G.flip(g, -1).open.length, 1);
  const m = G.newPairs('easy', seeded(2)); const [a, b] = pairIds(m);
  let done = G.flip(G.flip(m, a), b);
  assert.equal(G.flip(done, a), done.cards[a].matched ? G.flip(done, a) : null);
  assert.equal(G.flip(done, a).open.length, 0);
});

test('pairs: a whole game can be won, and the game ends when every card is matched', () => {
  for (const level of ['easy', 'medium', 'hard']) {
    let g = G.newPairs(level, seeded(11));
    const seen = {};
    for (const c of g.cards) { if (seen[c.animal] != null) { g = G.flip(G.flip(g, seen[c.animal]), c.id); } else seen[c.animal] = c.id; }
    assert.equal(g.done, true); assert.equal(g.tries, G.LEVELS[level]);
    assert.equal(G.flip(g, 0), g, 'a finished game does not change');
  }
});

test('count: the answer is in range, there are three different choices, and the right one is among them', () => {
  for (let s = 1; s <= 200; s++) {
    const r = G.countRound(seeded(s));
    assert.ok(r.n >= 1 && r.n <= 9);
    assert.equal(r.options.length, 3); assert.equal(new Set(r.options).size, 3); assert.ok(r.options.includes(r.n));
    r.options.forEach((o) => assert.ok(o >= 1 && o <= 10));
    assert.equal(G.countCheck(r, r.n), true);
    assert.equal(G.countCheck(r, r.options.find((o) => o !== r.n)), false);
  }
  assert.ok(G.countRound(seeded(1), 3).n <= 3);
  assert.ok(G.countRound(seeded(1), 99).n <= 9);
});

test('odd one out: four animals, three alike and one different, and the odd one is found', () => {
  const seen = new Set();
  for (let s = 1; s <= 200; s++) {
    const r = G.oddRound(seeded(s));
    assert.equal(r.cells.length, 4); assert.notEqual(r.same, r.other);
    r.cells.forEach((a, i) => assert.equal(a, i === r.odd ? r.other : r.same));
    assert.equal(G.oddCheck(r, r.odd), true);
    assert.equal(G.oddCheck(r, (r.odd + 1) % 4), false);
    seen.add(r.odd);
  }
  assert.equal(seen.size, 4, 'the odd one is not always in the same place');
});
