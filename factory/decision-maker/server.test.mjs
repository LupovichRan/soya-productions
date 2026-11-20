// Run with: node --test factory/decision-maker/
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { calibrate, CASES } from './calibrate.mjs';
import { modelFor, checkArgs, checkDecision, checkReview, checkScores, checkWeights, decide, extractJson, handle, median, pickDepth, status } from './server.mjs';

const S = { baseUrl: 'http://model.test/v1', model: 'm1', apiKey: '', log: '', timeoutMs: 5000 };
const good = (o = {}) => JSON.stringify({ choice: 2, confidence: 0.8, reasons: ['cheaper'], risk: 'slower', wouldChangeIf: 'a deadline', ...o });
/** A stand-in model server: answers with each queued reply in turn. */
function model(replies, calls = []) {
  return async (url, init) => {
    calls.push({ url, body: init.body ? JSON.parse(init.body) : null, auth: init.headers?.authorization });
    const r = replies.length > 1 ? replies.shift() : replies[0];
    if (r instanceof Error) throw r;
    if (typeof r === 'number') return new Response('{}', { status: r });
    return new Response(JSON.stringify({ choices: [{ message: { content: r } }] }), { status: 200 });
  };
}
const ask = { question: 'Which first?', options: ['Alpha', 'Beta', 'Gamma'], depth: 'quick' };
const full = { question: 'Which first?', options: ['Alpha', 'Beta', 'Gamma'] };

/** A stand-in model for the structured method: answers by which step is asking.
 *  `score(option, criterion, round)` gives one option's answer; the stand-in assembles the reply
 *  for whatever order the options were listed in. */
function steps({ weights, score, review }, calls = []) {
  return async (url, init) => {
    const body = JSON.parse(init.body), system = body.messages[0].content, user = body.messages[1].content;
    const step = system.startsWith('You help set up') ? 'weigh' : system.startsWith('You compare the options') ? 'score' : 'review';
    const criterion = (/The one criterion to judge: (.*)/.exec(user) || [])[1];
    const listed = step === 'score' ? user.split('The options:\n')[1].split('\n\n')[0].split('\n').map(l => l.replace(/^\d+\. /, '')) : [];
    calls.push({ step, criterion, listed, user, body });
    const round = calls.filter(c => c.step === 'score' && c.criterion === criterion).length;
    let r;
    if (step === 'weigh') r = weights(user);
    else if (step === 'review') r = review(user);
    else {
      const each = listed.map(o => score(o, criterion, round));
      r = each.some(e => typeof e === 'string') ? each.find(e => typeof e === 'string') : Object.fromEntries(each.map((e, k) => [k + 1, e]));
    }
    if (r instanceof Error) throw r;
    return new Response(JSON.stringify({ choices: [{ message: { content: typeof r === 'string' ? r : JSON.stringify(r) } }] }), { status: 200 });
  };
}
const okReview = { preMortem: [{ reason: 'nobody uses it', earlyWarning: 'no visits in week one' }], bias: 'confirmation', biasWhy: 'it was the first idea', whatElse: 'Delta', leaderFeelsRight: true, missingCriterion: '', wouldChangeIf: 'a deadline', ifThen: 'If it is Monday, then I start', confidence: 0.9 };
/** Scores per option, listed in the order the criteria were given. */
const byOption = (map, names = ['Cost', 'Speed']) => (option, criterion) => ({ score: map[option][Math.max(0, names.indexOf(criterion))], why: `${option} on ${criterion}` });

test('arguments are checked', () => {
  assert.equal(checkArgs({}).ok, false);
  assert.equal(checkArgs({ question: 'q', options: ['a'] }).ok, false);
  assert.equal(checkArgs({ question: 'q', options: ['a', 'A'] }).ok, false);
  assert.equal(checkArgs({ question: 'q', options: ['a', 'b'], samples: 99 }).args.samples, 5);
});

test('answers are read out of fences and reasoning text', () => {
  assert.deepEqual(extractJson('<think>{no}</think>```json\n{"a":1}\n```'), { a: 1 });
  assert.throws(() => extractJson('sorry'));
});

test('a decision must name a real option', () => {
  const o = ['Alpha', 'Beta'];
  assert.equal(checkDecision({ choice: 2, confidence: 0.5, reasons: ['r'] }, o).decision.choice, 'Beta');
  assert.equal(checkDecision({ choice: 'alpha', confidence: 0.5, reasons: ['r'] }, o).decision.choice, 'Alpha');
  assert.equal(checkDecision({ choice: 3, confidence: 0.5, reasons: ['r'] }, o).ok, false);
  assert.equal(checkDecision({ choice: 1, confidence: 5, reasons: ['r'] }, o).ok, false);
  assert.equal(checkDecision({ choice: 1, confidence: 0.5, reasons: [] }, o).ok, false);
});

test('decide returns the choice and sends the right request', async () => {
  const calls = [];
  const r = await decide({ ...ask, context: 'ctx', criteria: ['cost'] }, { ...S, apiKey: 'k' }, model([good()], calls));
  assert.equal(r.isError, undefined);
  assert.equal(r.structuredContent.choice, 'Beta');
  assert.equal(r.structuredContent.model, 'm1');
  assert.equal(calls[0].url, 'http://model.test/v1/chat/completions');
  assert.equal(calls[0].auth, 'Bearer k');
  assert.equal(calls[0].body.response_format.type, 'json_object');
  assert.match(calls[0].body.messages[1].content, /2\. Beta[\s\S]*- cost[\s\S]*ctx/);
});

test('an unusable answer is retried once with the reason', async () => {
  const calls = [];
  const r = await decide(ask, S, model(['nope', good()], calls));
  assert.equal(r.structuredContent.choice, 'Beta');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].body.messages.length, 4);
});

test('a server that refuses the JSON setting is asked again without it', async () => {
  const calls = [];
  const r = await decide(ask, S, model([400, good()], calls));
  assert.equal(r.structuredContent.choice, 'Beta');
  assert.equal(calls[1].body.response_format, undefined);
});

test('no model, an unreachable model, or two bad answers make no decision', async () => {
  for (const r of [
    await decide(ask, { ...S, baseUrl: '' }, model([good()])),
    await decide(ask, S, model([new Error('ECONNREFUSED')])),
    await decide(ask, S, model(['nope'])),
    await decide(ask, S, model([good({ choice: 9 })])),
  ]) { assert.equal(r.isError, true); assert.match(r.content[0].text, /No decision was made/); assert.equal(r.structuredContent, undefined); }
});

test('several samples are counted as a vote', async () => {
  const r = await decide({ ...ask, samples: 3 }, S, model([good({ choice: 1 }), good({ choice: 2 }), good({ choice: 2 })]));
  const out = r.structuredContent;
  assert.equal(out.choice, 'Beta');
  assert.deepEqual(out.votes.map(v => v.votes), [1, 2, 0]);
  assert.equal(out.tied, false);
  assert.equal(out.answered, 3);
});

test('a tied vote is reported and goes to the surer side', async () => {
  const r = await decide({ ...ask, samples: 2 }, S, model([good({ choice: 1, confidence: 0.9 }), good({ choice: 2, confidence: 0.4 })]));
  assert.equal(r.structuredContent.choice, 'Alpha');
  assert.equal(r.structuredContent.tied, true);
});

test('status says whether the model answers', async () => {
  assert.equal((await status({ ...S, model: '' })).structuredContent.connected, false);
  assert.equal((await status(S, model([good()]))).structuredContent.answers, true);
  assert.equal((await status(S, model([new Error('x')]))).structuredContent.answers, false);
});

test('the MCP messages work', async () => {
  const init = await handle({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } });
  assert.equal(init.result.protocolVersion, '2025-06-18');
  assert.equal(await handle({ jsonrpc: '2.0', method: 'notifications/initialized' }), null);
  const list = await handle({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  assert.deepEqual(list.result.tools.map(t => t.name), ['decide', 'decider_status']);
  const call = await handle({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'decide', arguments: ask } }, { settings: S, fetcher: model([good()]) });
  assert.equal(call.result.structuredContent.method, 'quick');
  assert.equal(call.result.structuredContent.choice, 'Beta');
  assert.equal((await handle({ jsonrpc: '2.0', id: 4, method: 'nope' })).error.code, -32601);
  assert.equal((await handle({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'x' } })).error.code, -32602);
});

test('end to end: the real process over stdin/stdout against a model server', async () => {
  const llm = createServer((req, res) => { req.resume(); req.on('end', () => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ choices: [{ message: { content: good() } }] })); }); });
  await new Promise(r => llm.listen(0, '127.0.0.1', r));
  const child = spawn(process.execPath, [fileURLToPath(new URL('./server.mjs', import.meta.url))], { env: { ...process.env, LLM_BASE_URL: `http://127.0.0.1:${llm.address().port}/v1`, LLM_MODEL: 'm1' } });
  let buf = '';
  const lines = [];
  child.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { lines.push(JSON.parse(buf.slice(0, i))); buf = buf.slice(i + 1); } });
  const send = (m) => child.stdin.write(JSON.stringify(m) + '\n');
  send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '0' } } });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'decide', arguments: ask } });
  for (let i = 0; i < 100 && lines.length < 2; i++) await new Promise(r => setTimeout(r, 50));
  child.kill(); llm.close();
  assert.equal(lines.length, 2);
  assert.equal(lines[0].result.serverInfo.name, 'soya-decision-maker');
  assert.equal(lines[1].result.structuredContent.choice, 'Beta');
});

test('effort matches the decision', () => {
  assert.equal(pickDepth(true, 'low'), 'quick');
  assert.equal(pickDepth(false, 'low'), 'deep');
  assert.equal(pickDepth(true, 'high'), 'deep');
  assert.equal(pickDepth(null, null), 'standard');
  assert.equal(checkArgs({ ...full, reversible: false }).args.depth, 'deep');
  assert.equal(checkArgs({ ...full, reversible: false, depth: 'quick' }).args.depth, 'quick');
  assert.equal(checkArgs({ ...full, criteria: ['a'], weights: [9] }).ok, false);
  assert.equal(checkArgs({ ...full, weights: [3] }).ok, false);
});

test('each step of the structured method checks its answer', () => {
  assert.equal(checkWeights({ weights: [5, 1] }, ['a', 'b']).value[0].weight, 5);
  assert.equal(checkWeights({ weights: [5] }, ['a', 'b']).ok, false);
  assert.equal(checkWeights({ criteria: [{ name: 'a', weight: 2 }, { name: 'b', weight: 9 }] }, []).ok, false);
  assert.deepEqual(checkScores({ 1: { why: 'a', score: 4 }, 2: { why: 'b', score: '2' } }, 2).value.map(v => v.score), [4, 2]);
  assert.equal(checkScores({ 1: { why: 'a', score: 4 } }, 2).ok, false);
  assert.equal(checkScores({ 1: { why: 'a', score: 0 }, 2: { why: 'b', score: 2 } }, 2).ok, false);
  assert.equal(checkScores({ 1: { score: 3 }, 2: { why: 'b', score: 2 } }, 2).ok, false);
  assert.equal(checkReview({ preMortem: [], confidence: 0.5 }).ok, false);
  assert.equal(checkReview({ ...okReview, bias: 'made-up' }).value.bias, 'none');
  assert.equal(median([5, 1, 3]), 3);
});

test('standard: weights before options, one criterion at a time, totals added in code', async () => {
  const calls = [];
  const r = await decide({ ...full, criteria: ['Cost', 'Speed'], context: 'ctx' }, S, steps({
    weights: () => ({ weights: [5, 1] }),
    score: byOption({ Alpha: [2, 5], Beta: [5, 1], Gamma: [3, 3] }),
    review: () => okReview,
  }, calls));
  const out = r.structuredContent;
  assert.equal(out.method, 'standard');
  assert.equal(out.choice, 'Beta');                       // 5*5+1*1=26 of 30 beats Alpha 15 and Gamma 18
  assert.deepEqual(out.table.map(t => [t.option, t.total]), [['Beta', 86.7], ['Gamma', 60], ['Alpha', 50]]);
  assert.equal(out.closeCall, false);
  assert.deepEqual(calls.map(c => c.step), ['weigh', 'score', 'score', 'review']);
  assert.deepEqual(calls.filter(c => c.step === 'score').map(c => c.criterion), ['Cost', 'Speed']);
  assert.deepEqual(out.table[0].pros, ['Beta on Cost']);            // the reason behind its high score
  assert.deepEqual(out.table[0].cons, ['Beta on Speed']);           // the reason behind its low score
  assert.doesNotMatch(calls[0].user, /Alpha|Beta|Gamma/);  // weights are set without seeing the options
  assert.doesNotMatch(calls[1].user, /Speed/);             // one criterion at a time: the other is not mentioned
  assert.equal(out.preMortem[0].earlyWarning, 'no visits in week one');
  assert.ok(out.cautions.some(c => /confirmation bias/.test(c)));
  assert.ok(out.cautions.some(c => /Delta/.test(c)));
  assert.equal(out.record.decision, 'Beta');
  assert.equal(out.record.confidence, 'high');
  assert.equal(out.record.nextStep, 'If it is Monday, then I start');
  assert.equal((new Date(out.record.reviewOn) - new Date(out.record.madeOn)) / 86400000, 7);
});

test('weights given by the caller skip the weighting step; with no criteria the model proposes them', async () => {
  let calls = [];
  await decide({ ...full, criteria: ['Cost'], weights: [4] }, S, steps({ score: byOption({ Alpha: [1], Beta: [5], Gamma: [2] }), review: () => okReview }, calls));
  assert.equal(calls[0].step, 'score');
  calls = [];
  const r = await decide(full, S, steps({ weights: () => ({ criteria: [{ name: 'Cost', weight: 3 }, { name: 'Speed', weight: 2 }] }), score: byOption({ Alpha: [5, 5], Beta: [1, 1], Gamma: [2, 2] }), review: () => okReview }, calls));
  assert.doesNotMatch(calls[0].user, /Alpha|Beta|Gamma/);
  assert.deepEqual(r.structuredContent.criteria.map(c => c.name), ['Cost', 'Speed']);
  assert.equal(r.structuredContent.choice, 'Alpha');
});

test('a close call or a doubted leader lowers confidence and is said out loud, but the scores still decide', async () => {
  const r = await decide({ ...full, criteria: ['Cost', 'Speed'], weights: [5, 1] }, S, steps({
    score: byOption({ Alpha: [4, 5], Beta: [4, 4], Gamma: [1, 1] }),
    review: () => ({ ...okReview, leaderFeelsRight: false, missingCriterion: 'trust' }),
  }));
  const out = r.structuredContent;
  assert.equal(out.closeCall, true);
  assert.equal(out.confidence, 0.5);
  assert.equal(out.choice, 'Alpha');
  assert.ok(out.cautions.some(c => /Close call/.test(c)));
  assert.ok(out.cautions.some(c => /trust/.test(c)));
  assert.equal(out.record.confidence, 'medium');
});

test('deep: every option is scored three times and the middle score is kept; review in 30 days', async () => {
  const calls = [];
  const r = await decide({ ...full, criteria: ['Cost'], weights: [1], reversible: false }, S, steps({
    score: (option, criterion, n) => ({ score: option === 'Alpha' ? [5, 1, 4][n - 1] : 2, why: 'round ' + n }),
    review: () => okReview,
  }, calls));
  const out = r.structuredContent;
  assert.equal(out.method, 'deep');
  const scoring = calls.filter(c => c.step === 'score');
  assert.equal(scoring.length, 3);
  assert.deepEqual(scoring.map(c => c.listed[0]), ['Alpha', 'Beta', 'Gamma']);   // the order rotates between rounds
  assert.equal(out.table[0].option, 'Alpha');
  assert.deepEqual(out.table[0].scores, [4]);
  assert.deepEqual(out.table[0].reasons, ['round 3']);              // the reason that goes with the middle score
  assert.equal(out.table[0].spread, 4);
  assert.ok(out.cautions.some(c => /very differently/.test(c)));
  assert.equal((new Date(out.record.reviewOn) - new Date(out.record.madeOn)) / 86400000, 30);
});

test('a failed scoring step makes no decision; a failed stress-test is reported, not hidden', async () => {
  const bad = await decide({ ...full, criteria: ['Cost'], weights: [1] }, S, steps({ score: () => 'nope', review: () => okReview }));
  assert.equal(bad.isError, true);
  assert.match(bad.content[0].text, /No decision was made/);
  const r = await decide({ ...full, criteria: ['Cost'], weights: [1] }, S, steps({ score: byOption({ Alpha: [5], Beta: [1], Gamma: [1] }), review: () => 'nope' }));
  assert.equal(r.structuredContent.choice, 'Alpha');
  assert.equal(r.structuredContent.confidence, 0.5);
  assert.ok(r.structuredContent.cautions.some(c => /stress-test could not be run/.test(c)));
});

test('an exact tie at the top is not a decision', async () => {
  const r = await decide({ ...full, criteria: ['Cost'], weights: [5] }, S, steps({ score: byOption({ Alpha: [3], Beta: [3], Gamma: [3] }), review: () => okReview }));
  const out = r.structuredContent;
  assert.equal(out.choice, null);
  assert.equal(out.decided, false);
  assert.equal(out.record, null);
  assert.equal(out.confidence, 0);
  assert.ok(out.cautions.some(c => /Exact tie[\s\S]*No decision was made/.test(c)));
  assert.ok(out.cautions.some(c => /nearly the same score to everything/.test(c)));
});

test('each depth is sent to the model chosen for it', async () => {
  const s = { ...S, modelQuick: 'small', modelDeep: 'big' };
  assert.equal(modelFor('quick', S), 'm1');
  let calls = [];
  const q = await decide(ask, s, model([good()], calls));
  assert.equal(calls[0].body.model, 'small');
  assert.equal(q.structuredContent.model, 'small');
  calls = [];
  const d = await decide({ ...full, criteria: ['Cost'], weights: [1], depth: 'deep' }, s, steps({ score: byOption({ Alpha: [5], Beta: [1], Gamma: [1] }, ['Cost']), review: () => okReview }, calls));
  assert.ok(calls.every(c => c.body.model === 'big'));
  assert.equal(d.structuredContent.model, 'big');
  calls = [];
  await decide({ ...full, criteria: ['Cost'], weights: [1] }, s, steps({ score: byOption({ Alpha: [5], Beta: [1], Gamma: [1] }, ['Cost']), review: () => okReview }, calls));
  assert.ok(calls.every(c => c.body.model === 'm1'));
  assert.deepEqual((await status(s, model([good()]))).structuredContent.models, { quick: 'small', standard: 'm1', deep: 'big' });
});

test('calibration: a model that judges well passes, one that scores everything the same does not', async () => {
  // A stand-in that scores the expected option high and the others low.
  // The two travel cases share options, so there the stand-in judges each criterion on its merits.
  const wise = steps({ score: (option, criterion) => {
    const train = /express train/.test(option), travel = train || /The bus/.test(option);
    if (travel) return { score: (criterion === 'Arrives quickly') === train ? 5 : 1, why: 'w' };
    return { score: CASES.some(c => c.options[c.expect] === option) ? 5 : 1, why: 'w' };
  }, review: () => okReview });
  const a = await calibrate(S, { fetcher: wise });
  assert.equal(a.summary.right, CASES.length);
  assert.equal(a.summary.verdict, 'good enough to decide with');
  const dull = steps({ score: () => ({ score: 3, why: 'w' }), review: () => okReview });
  const b = await calibrate(S, { fetcher: dull });
  assert.equal(b.summary.right, 0);
  assert.equal(b.summary.verdict, 'not good enough');
});

test('a reason that contradicts the context is called out and lowers confidence', async () => {
  const calls = [];
  const r = await decide({ ...full, criteria: ['Cost'], weights: [5] }, S, steps({
    score: byOption({ Alpha: [5], Beta: [1], Gamma: [1] }, ['Cost']),
    review: () => ({ ...okReview, doubtfulReasons: ['"Beta sends data away" but the context says it stays on the device'] }),
  }, calls));
  const out = r.structuredContent;
  assert.ok(out.cautions.some(c => /looks wrong[\s\S]*stays on the device/.test(c)));
  assert.equal(out.confidence, 0.5);
  assert.match(calls.at(-1).user, /Cost: 5 of 5, because: Alpha on Cost/);   // the stress-test sees every reason
});

test('a model with nothing to go on gets a neutral 3, said out loud, and the decision still completes', async () => {
  const r = await decide({ ...full, criteria: ['Cost'], weights: [5] }, S, steps({
    score: (option) => option === 'Gamma' ? { score: null, why: 'Gamma is not mentioned in the context' } : { score: option === 'Alpha' ? 5 : 2, why: 'w' },
    review: () => okReview,
  }));
  const out = r.structuredContent;
  assert.equal(out.choice, 'Alpha');
  assert.deepEqual(out.table.find(t => t.option === 'Gamma').scores, [3]);
  assert.deepEqual(out.table.find(t => t.option === 'Gamma').unknown, ['Cost']);
  assert.equal(out.table.find(t => t.option === 'Alpha').unknown, undefined);
  assert.ok(out.cautions.some(c => /nothing to go on for "Gamma" on "Cost"[\s\S]*neutral 3/.test(c)));
  assert.equal(out.confidence, 0.5);
  assert.equal(checkScores({ 1: { why: 'a', score: 'N/A' } }, 1).value[0].unknown, true);
  assert.equal(checkScores({ 1: { score: null } }, 1).ok, false);                      // still needs a reason
  assert.equal(checkScores({ 1: { why: 'a', score: 4.5 } }, 1).ok, false);             // a made-up number is not accepted
});
