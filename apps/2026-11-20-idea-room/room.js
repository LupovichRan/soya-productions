/* Idea Room: the logic. Pure functions with no page, storage or network, so they can be tested alone.
   An idea has a two-week test. People add signals (small, real acts), take a seat, and earn a louder
   voice by doing work the owner accepts. Nothing here invents demand: only signals that were recorded count. */
(function (root) {
  'use strict';

  var LIMITS = { name: 60, problem: 300, promise: 200, item: 120, question: 100, option: 40, ideas: 12, items: 20, options: 4 };
  var DAYS = 14;
  var NEEDED = 20;
  var DAY_MS = 86400000;
  var MAX_VOICE = 4;
  /* The small acts a person can record, and how much each counts toward the test. */
  var KINDS = ['follow', 'want', 'share', 'pledge', 'call'];
  var WEIGHTS = { follow: 1, want: 2, share: 3, pledge: 4, call: 5 };
  var MASCOTS = ['cat', 'fox', 'owl', 'bear', 'rabbit', 'frog'];

  function clip(s, n) { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; }

  /** A new idea of your own, or the reason it cannot be made. */
  function makeIdea(name, problem, promise, mascot, id, now) {
    name = clip(name, LIMITS.name); problem = clip(problem, LIMITS.problem); promise = clip(promise, LIMITS.promise);
    if (!name) return { ok: false, why: 'name' };
    if (!problem) return { ok: false, why: 'problem' };
    if (!promise) return { ok: false, why: 'promise' };
    return { ok: true, idea: { id: id, sample: '', name: name, problem: problem, promise: promise, mascot: MASCOTS.indexOf(mascot) < 0 ? 'fox' : mascot,
      startedAt: now == null ? Date.now() : now, dayOffset: 0, mine: {}, others: {}, seat: false, items: [], question: '', options: [], votes: [], myVote: -1, myVoteWeight: 0, decision: '' } };
  }

  /** Which day of the test it is, from 1 to 14. A pretend offset can move it for demonstrations. */
  function day(idea, now) {
    var d = Math.floor(((now == null ? Date.now() : now) - idea.startedAt) / DAY_MS) + 1 + (idea.dayOffset || 0);
    return Math.max(1, Math.min(DAYS, d));
  }

  /** The score so far: what other people recorded (examples only) plus what this device recorded, each kind weighted. */
  function score(idea) {
    var total = 0;
    KINDS.forEach(function (k) {
      var n = Math.max(0, Math.floor(Number(idea.others && idea.others[k]) || 0)) + (idea.mine && idea.mine[k] ? 1 : 0);
      total += n * WEIGHTS[k];
    });
    return total;
  }

  function counts(idea) {
    return KINDS.map(function (k) {
      var n = Math.max(0, Math.floor(Number(idea.others && idea.others[k]) || 0)) + (idea.mine && idea.mine[k] ? 1 : 0);
      return { kind: k, n: n, weight: WEIGHTS[k], subtotal: n * WEIGHTS[k] };
    });
  }

  /** Record or take back one of your own signals. Each kind once per device. */
  function toggleSignal(idea, kind) {
    if (KINDS.indexOf(kind) < 0) return idea;
    var mine = Object.assign({}, idea.mine);
    if (mine[kind]) delete mine[kind]; else mine[kind] = true;
    return Object.assign({}, idea, { mine: mine });
  }

  /** What the numbers suggest. Only a suggestion: the owner decides. Before day 14 it only says it is still being tested. */
  function verdict(idea, now) {
    var d = day(idea, now), s = score(idea);
    if (d < DAYS) return { state: 'testing', day: d, score: s, needed: NEEDED };
    if (s >= NEEDED) return { state: 'continue', day: d, score: s, needed: NEEDED };
    if (s >= NEEDED / 2) return { state: 'change', day: d, score: s, needed: NEEDED };
    return { state: 'stop', day: d, score: s, needed: NEEDED };
  }

  /** Number of roadmap items you did that the owner accepted as finished. */
  function acceptedWork(idea) { return (idea.items || []).filter(function (i) { return i.status === 'done' && i.claimedBy === 'you'; }).length; }

  /** Your voice: none without a seat; one with a seat; one more for each piece of accepted work, up to four in all. */
  function voice(idea) {
    if (!idea.seat) return 0;
    return Math.min(MAX_VOICE, 1 + acceptedWork(idea));
  }

  /* Roadmap: proposed → accepted (owner) → claimed (a person takes it) → done (owner accepts the work). */
  function addItem(idea, text, id) {
    text = clip(text, LIMITS.item);
    if (!text) return { ok: false, why: 'empty' };
    if ((idea.items || []).length >= LIMITS.items) return { ok: false, why: 'full' };
    return { ok: true, idea: Object.assign({}, idea, { items: (idea.items || []).concat([{ id: id, text: text, by: 'you', status: 'proposed', claimedBy: '' }]) }) };
  }
  var NEXT = { accept: ['proposed', 'accepted'], claim: ['accepted', 'claimed'], done: ['claimed', 'done'] };
  /** Move an item along. Returns the idea unchanged if the move is not allowed. */
  function moveItem(idea, itemId, action) {
    var step = NEXT[action];
    if (!step) return idea;
    var changed = false;
    var items = (idea.items || []).map(function (i) {
      if (i.id !== itemId || i.status !== step[0]) return i;
      changed = true;
      return Object.assign({}, i, { status: step[1], claimedBy: action === 'claim' ? 'you' : i.claimedBy });
    });
    return changed ? Object.assign({}, idea, { items: items }) : idea;
  }

  /** The survey: a question with two to four options, one per line. */
  function setSurvey(idea, question, optionsText) {
    question = clip(question, LIMITS.question);
    var options = String(optionsText == null ? '' : optionsText).split(/\r?\n/).map(function (l) { return clip(l, LIMITS.option); }).filter(Boolean).slice(0, LIMITS.options);
    if (!question) return { ok: false, why: 'question' };
    if (options.length < 2) return { ok: false, why: 'options' };
    return { ok: true, idea: Object.assign({}, idea, { question: question, options: options, votes: options.map(function () { return 0; }), myVote: -1, myVoteWeight: 0 }) };
  }

  /** Cast your vote, counted at your voice. No seat, no vote. One vote; voting again replaces it. */
  function vote(idea, index) {
    var w = voice(idea);
    if (!w || index < 0 || index >= (idea.options || []).length) return idea;
    return Object.assign({}, idea, { myVote: index, myVoteWeight: w });
  }

  /** Weighted totals for each option: other people's example votes plus yours. */
  function tally(idea) {
    return (idea.options || []).map(function (o, i) {
      var base = Math.max(0, Math.floor(Number(idea.votes && idea.votes[i]) || 0));
      return base + (idea.myVote === i ? idea.myVoteWeight : 0);
    });
  }

  /** Stored data is untrusted when read back: keep only what is well formed, and apply the limits again. */
  function clean(raw) {
    if (!Array.isArray(raw)) return [];
    var out = [];
    raw.forEach(function (r) {
      if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !r.id || out.length >= LIMITS.ideas) return;
      var sample = typeof r.sample === 'string' ? r.sample.slice(0, 20) : '';
      var name = clip(r.name, LIMITS.name), problem = clip(r.problem, LIMITS.problem), promise = clip(r.promise, LIMITS.promise);
      if (!sample && (!name || !problem || !promise)) return;
      var mine = {}; KINDS.forEach(function (k) { if (r.mine && r.mine[k] === true) mine[k] = true; });
      var others = {}; KINDS.forEach(function (k) { var n = Math.floor(Number(r.others && r.others[k])); if (n > 0) others[k] = Math.min(n, 1000); });
      var items = (Array.isArray(r.items) ? r.items : []).filter(function (i) { return i && typeof i.id === 'string' && ['proposed', 'accepted', 'claimed', 'done'].indexOf(i.status) >= 0; }).slice(0, LIMITS.items).map(function (i) {
        var tk = Number.isInteger(i.tk) && i.tk >= 0 && i.tk < 20 ? i.tk : -1;
        return { id: i.id.slice(0, 40), text: clip(i.text, LIMITS.item), tk: tk, by: i.by === 'you' ? 'you' : 'other', status: i.status, claimedBy: i.claimedBy === 'you' ? 'you' : '' };
      }).filter(function (i) { return i.text || i.tk >= 0; });
      var options = (Array.isArray(r.options) ? r.options : []).map(function (o) { return clip(o, LIMITS.option); }).filter(Boolean).slice(0, LIMITS.options);
      var votes = options.map(function (o, i) { var n = Math.floor(Number(r.votes && r.votes[i])); return n > 0 ? Math.min(n, 1000) : 0; });
      var myVote = Number.isInteger(r.myVote) && r.myVote >= 0 && r.myVote < options.length ? r.myVote : -1;
      var startedAt = Number(r.startedAt); if (!isFinite(startedAt) || startedAt <= 0) startedAt = Date.now();
      var offset = Math.max(0, Math.min(DAYS, Math.floor(Number(r.dayOffset) || 0)));
      out.push({ id: r.id.slice(0, 40), sample: sample, name: name, problem: problem, promise: promise, mascot: MASCOTS.indexOf(r.mascot) < 0 ? 'fox' : r.mascot,
        startedAt: startedAt, dayOffset: offset, mine: mine, others: others, seat: r.seat === true, items: items,
        question: clip(r.question, LIMITS.question), options: options, votes: votes, myVote: myVote, myVoteWeight: myVote >= 0 ? Math.max(1, Math.min(MAX_VOICE, Math.floor(Number(r.myVoteWeight) || 1))) : 0,
        decision: ['continue', 'change', 'stop'].indexOf(r.decision) >= 0 ? r.decision : '' });
    });
    return out;
  }

  /** 'rtl' or 'ltr' from the first strong letter; '' when there is no letter yet (the caller picks the page direction). */
  function dirFor(text) {
    var m = String(text || '').match(/[A-Za-z֐-׿]/);
    if (!m) return '';
    return /[֐-׿]/.test(m[0]) ? 'rtl' : 'ltr';
  }

  var api = { LIMITS: LIMITS, DAYS: DAYS, NEEDED: NEEDED, KINDS: KINDS, WEIGHTS: WEIGHTS, MASCOTS: MASCOTS, MAX_VOICE: MAX_VOICE,
    makeIdea: makeIdea, day: day, score: score, counts: counts, toggleSignal: toggleSignal, verdict: verdict, acceptedWork: acceptedWork,
    voice: voice, addItem: addItem, moveItem: moveItem, setSurvey: setSurvey, vote: vote, tally: tally, clean: clean, dirFor: dirFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SoyaRoom = api;
})(typeof window !== 'undefined' ? window : globalThis);
