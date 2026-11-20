/* Soya's Games: the rules of three small games for young children. Pure functions with no page, storage or network,
   so they can be tested alone. Nothing is scored against the child and nothing is kept. */
(function (root) {
  'use strict';

  var ANIMALS = ['cat', 'fox', 'owl', 'bear', 'rabbit', 'frog'];
  var LEVELS = { easy: 3, medium: 4, hard: 6 };
  var COUNT_MAX = 9;

  /** A fresh shuffle (Fisher-Yates). rng is a function that gives a number from 0 up to but not including 1. */
  function shuffle(list, rng) {
    rng = rng || Math.random;
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* Match the pairs. A game is { cards, open, pending, tries, done }. */
  function newPairs(level, rng) {
    var n = LEVELS[level] || LEVELS.easy;
    var animals = shuffle(ANIMALS, rng).slice(0, n);
    var deck = shuffle(animals.concat(animals), rng).map(function (animal, i) { return { id: i, animal: animal, up: false, matched: false }; });
    return { level: LEVELS[level] ? level : 'easy', cards: deck, open: [], pending: false, tries: 0, done: false };
  }

  /** If two different cards are showing, turn them back over. */
  function settle(game) {
    if (!game.pending) return game;
    var cards = game.cards.map(function (c) { return game.open.indexOf(c.id) >= 0 && !c.matched ? Object.assign({}, c, { up: false }) : c; });
    return Object.assign({}, game, { cards: cards, open: [], pending: false });
  }

  /** Turn a card over. Tapping a card while a wrong pair is showing turns that pair back first. */
  function flip(game, id) {
    if (game.done) return game;
    var g = settle(game);
    var card = g.cards[id];
    if (!card || card.up || card.matched) return g;
    var cards = g.cards.map(function (c) { return c.id === id ? Object.assign({}, c, { up: true }) : c; });
    var open = g.open.concat([id]);
    if (open.length < 2) return Object.assign({}, g, { cards: cards, open: open });
    var same = cards[open[0]].animal === cards[open[1]].animal;
    var tries = g.tries + 1;
    if (same) {
      cards = cards.map(function (c) { return open.indexOf(c.id) >= 0 ? Object.assign({}, c, { matched: true }) : c; });
      return { level: g.level, cards: cards, open: [], pending: false, tries: tries, done: cards.every(function (c) { return c.matched; }) };
    }
    return { level: g.level, cards: cards, open: open, pending: true, tries: tries, done: false };
  }

  /* Count the fish. A round is { n, options }: how many fish, and three different numbers to choose from. */
  function countRound(rng, max) {
    rng = rng || Math.random; max = Math.max(3, Math.min(COUNT_MAX, max || COUNT_MAX));
    var n = 1 + Math.floor(rng() * max);
    var pool = [];
    for (var k = 1; k <= max + 1; k++) if (k !== n) pool.push(k);
    var near = pool.filter(function (k) { return Math.abs(k - n) <= 2; });
    var others = shuffle(near.length >= 2 ? near : pool, rng).slice(0, 2);
    return { n: n, options: shuffle([n].concat(others), rng) };
  }
  function countCheck(round, choice) { return round.n === choice; }

  /* The odd one out. A round is { cells, odd, same, other }: four animals, three alike and one different. */
  function oddRound(rng) {
    rng = rng || Math.random;
    var two = shuffle(ANIMALS, rng).slice(0, 2);
    var odd = Math.floor(rng() * 4), cells = [];
    for (var i = 0; i < 4; i++) cells.push(i === odd ? two[1] : two[0]);
    return { cells: cells, odd: odd, same: two[0], other: two[1] };
  }
  function oddCheck(round, index) { return round.odd === index; }

  var api = { ANIMALS: ANIMALS, LEVELS: LEVELS, COUNT_MAX: COUNT_MAX, shuffle: shuffle, newPairs: newPairs, flip: flip, settle: settle, countRound: countRound, countCheck: countCheck, oddRound: oddRound, oddCheck: oddCheck };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SoyaGames = api;
})(typeof window !== 'undefined' ? window : globalThis);
