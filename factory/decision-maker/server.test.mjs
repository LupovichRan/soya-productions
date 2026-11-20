// Run with: node --test factory/decision-maker/
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { checkArgs, checkDecision, decide, extractJson, handle, status } from './server.mjs';

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
const ask = { question: 'Which first?', options: ['Alpha', 'Beta', 'Gamma'] };

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
