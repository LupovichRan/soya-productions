#!/usr/bin/env node
// Soya POC #2 — Decision Maker.
// An MCP server that asks a self-hosted, open-weight model to choose between options.
// It talks to any server that speaks the OpenAI-style chat endpoint (Ollama, llama.cpp,
// LM Studio, vLLM). No paid API, no dependencies: Node 18 or newer is all it needs.
//
// Settings (environment variables):
//   LLM_BASE_URL   where the model server listens, e.g. http://localhost:11434/v1
//   LLM_MODEL      the model name on that server, e.g. qwen3:4b
//   LLM_API_KEY    optional; only for a gateway in front of your own server
//   DECISION_LOG   optional; a file to append every decision to, one JSON object per line
//   LLM_TIMEOUT_MS optional; how long to wait for one answer (default 120000)
//
// Run it:
//   node server.mjs                 speaks MCP over stdin/stdout (Claude Code, Claude Desktop)
//   node server.mjs --http          speaks MCP over HTTP on 127.0.0.1:8787/mcp
//     MCP_PORT, MCP_HOST            where to listen
//     MCP_TOKEN                     required to listen on anything but 127.0.0.1
import { createServer } from 'node:http';
import { createInterface } from 'node:readline';
import { appendFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const SERVER = { name: 'soya-decision-maker', version: '0.1.0' };
const PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

export function settings(env = process.env) {
  return {
    baseUrl: String(env.LLM_BASE_URL || '').trim().replace(/\/+$/, ''),
    model: String(env.LLM_MODEL || '').trim(),
    apiKey: String(env.LLM_API_KEY || ''),
    log: String(env.DECISION_LOG || '').trim(),
    timeoutMs: Math.max(1000, Number(env.LLM_TIMEOUT_MS) || 120000),
  };
}

export const TOOLS = [
  {
    name: 'decide',
    title: 'Decide',
    description: 'Ask the self-hosted model to choose exactly one of the given options. Returns the choice, how sure it is, its reasons, the main risk, and what would change its mind. With samples > 1 it asks several times and reports the vote. The model sees only what you pass here, so put everything it needs in "context". If no model is connected or its answer is unusable, the call fails; it never makes a decision up.',
    inputSchema: {
      type: 'object', additionalProperties: false, required: ['question', 'options'],
      properties: {
        question: { type: 'string', description: 'The decision to make, as one plain question.' },
        options: { type: 'array', minItems: 2, maxItems: 8, items: { type: 'string' }, description: 'The 2 to 8 options to choose between.' },
        context: { type: 'string', description: 'Facts the model needs: background, constraints, what has been tried.' },
        criteria: { type: 'array', maxItems: 8, items: { type: 'string' }, description: 'What matters most, most important first.' },
        samples: { type: 'integer', minimum: 1, maximum: 5, description: 'How many times to ask (default 1). Use 3 or 5 for a vote on a close call.' },
      },
    },
  },
  {
    name: 'decider_status',
    title: 'Decision maker status',
    description: 'Say whether a self-hosted model is connected, which one, and whether it answers right now.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {} },
  },
];

const SYSTEM = `You are a careful decision maker. You are given a question, a numbered list of options, and sometimes context and criteria. Choose exactly one option.

Base the choice only on what you are given. Do not invent facts. If the information is thin, still choose the best available option and say so with a low confidence. Prefer the option that is easiest to undo when the options are otherwise close.

Answer with one JSON object and nothing else:
{
  "choice": 1,
  "confidence": 0.0,
  "reasons": ["string"],
  "risk": "string",
  "wouldChangeIf": "string"
}
"choice" is the number of the chosen option. "confidence" is between 0 and 1. "reasons" has one to three short reasons. "risk" is the main risk of this choice. "wouldChangeIf" is the one fact that would make you choose differently.`;

export function userMessage(a) {
  return `Question: ${a.question}\n\nOptions:\n${a.options.map((o, i) => `${i + 1}. ${o}`).join('\n')}` +
    (a.criteria.length ? `\n\nWhat matters most, in order:\n${a.criteria.map(c => `- ${c}`).join('\n')}` : '') +
    (a.context ? `\n\nContext:\n${a.context}` : '');
}

/** Check and tidy what the caller sent. */
export function checkArgs(raw) {
  const a = raw && typeof raw === 'object' ? raw : {};
  if (typeof a.question !== 'string' || !a.question.trim()) return { ok: false, why: '"question" is required.' };
  if (!Array.isArray(a.options)) return { ok: false, why: '"options" must be a list of 2 to 8 strings.' };
  const options = a.options.map(o => (typeof o === 'string' ? o.trim() : '')).filter(Boolean);
  if (options.length !== a.options.length || options.length < 2 || options.length > 8) return { ok: false, why: '"options" must be a list of 2 to 8 non-empty strings.' };
  if (new Set(options.map(o => o.toLowerCase())).size !== options.length) return { ok: false, why: 'The options must be different from each other.' };
  const text = a.question + options.join('') + (a.context || '');
  if (text.length > 24000) return { ok: false, why: 'Question, options and context together must stay under 24,000 characters.' };
  const criteria = Array.isArray(a.criteria) ? a.criteria.filter(c => typeof c === 'string' && c.trim()).slice(0, 8).map(c => c.trim()) : [];
  const samples = Math.max(1, Math.min(5, Math.round(Number(a.samples) || 1)));
  return { ok: true, args: { question: a.question.trim(), options, context: typeof a.context === 'string' ? a.context.trim() : '', criteria, samples } };
}

/** Pull the JSON object out of an answer that may be wrapped in a code fence or in reasoning text. */
export function extractJson(answer) {
  const cleaned = String(answer || '').replace(/<think>[\s\S]*?<\/think>/g, '');
  const start = cleaned.indexOf('{'), end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('no JSON object in the answer');
  return JSON.parse(cleaned.slice(start, end + 1));
}

/** Check the model's answer against the options it was given. */
export function checkDecision(raw, options) {
  if (!raw || typeof raw !== 'object') return { ok: false, why: 'the answer is not a JSON object' };
  let index = -1;
  if (typeof raw.choice === 'number' || /^\s*\d+\s*$/.test(String(raw.choice))) index = Number(raw.choice) - 1;
  else if (typeof raw.choice === 'string') index = options.findIndex(o => o.toLowerCase() === raw.choice.trim().toLowerCase());
  if (!Number.isInteger(index) || index < 0 || index >= options.length) return { ok: false, why: `"choice" must be the number of one option, 1 to ${options.length}` };
  const confidence = Number(raw.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) return { ok: false, why: '"confidence" must be a number between 0 and 1' };
  const reasons = (Array.isArray(raw.reasons) ? raw.reasons : [raw.reasons]).filter(r => typeof r === 'string' && r.trim()).map(r => r.trim()).slice(0, 3);
  if (!reasons.length) return { ok: false, why: '"reasons" must have at least one reason' };
  return { ok: true, decision: { index, choice: options[index], confidence, reasons, risk: typeof raw.risk === 'string' ? raw.risk.trim() : '', wouldChangeIf: typeof raw.wouldChangeIf === 'string' ? raw.wouldChangeIf.trim() : '' } };
}

async function chat(s, messages, temperature, fetcher, state) {
  const ask = () => fetcher(s.baseUrl + '/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(s.apiKey ? { authorization: `Bearer ${s.apiKey}` } : {}) },
    body: JSON.stringify({ model: s.model, messages, temperature, max_tokens: 900, stream: false, ...(state.format ? { response_format: { type: 'json_object' } } : {}) }),
    signal: AbortSignal.timeout(s.timeoutMs),
  });
  let res = await ask();
  // Some model servers refuse the JSON setting; ask again without it.
  if (!res.ok && state.format && [400, 422, 500, 501].includes(res.status)) { state.format = false; res = await ask(); }
  if (!res.ok) throw new Error(`the model server returned an error (${res.status})`);
  const data = await res.json().catch(() => null);
  return data?.choices?.[0]?.message?.content ?? '';
}

/** One decision: two attempts, the second one told why the first was unusable. */
async function decideOnce(s, args, temperature, fetcher, state) {
  const messages = [{ role: 'system', content: SYSTEM }, { role: 'user', content: userMessage(args) }];
  let why = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const answer = await chat(s, messages, temperature, fetcher, state);
    let result;
    try { result = checkDecision(extractJson(answer), args.options); } catch (err) { result = { ok: false, why: err.message || 'unreadable answer' }; }
    if (result.ok) return result.decision;
    why = result.why;
    messages.push({ role: 'assistant', content: String(answer).slice(0, 4000) }, { role: 'user', content: `That answer was not usable: ${why}. Send the complete JSON object again, corrected.` });
  }
  throw new Error(`the model's answer was not usable (${why})`);
}

export async function decide(raw, s = settings(), fetcher = fetch) {
  const checked = checkArgs(raw);
  if (!checked.ok) return fail(checked.why);
  if (!s.baseUrl || !s.model) return fail('No model is connected. Set LLM_BASE_URL and LLM_MODEL for this server. No decision was made.');
  const { args } = checked;
  const state = { format: true };
  const runs = [], errors = [];
  for (let i = 0; i < args.samples; i++) {
    try { runs.push(await decideOnce(s, args, args.samples > 1 ? 0.7 : 0.2, fetcher, state)); }
    catch (err) { errors.push(reason(err)); }
  }
  if (!runs.length) return fail(`Could not get a decision: ${errors[0]}. No decision was made.`);

  const votes = args.options.map((option, i) => ({ option, votes: runs.filter(r => r.index === i).length }));
  const top = Math.max(...votes.map(v => v.votes));
  const leaders = votes.filter(v => v.votes === top);
  const mean = (i) => { const rs = runs.filter(r => r.index === i); return rs.reduce((n, r) => n + r.confidence, 0) / rs.length; };
  // On a tied vote, the side that was surer of itself wins, and the tie is reported.
  const winner = leaders.map(v => args.options.indexOf(v.option)).sort((a, b) => mean(b) - mean(a))[0];
  const best = runs.filter(r => r.index === winner).sort((a, b) => b.confidence - a.confidence)[0];
  const out = {
    choice: best.choice,
    confidence: Math.round(mean(winner) * 100) / 100,
    reasons: best.reasons,
    risk: best.risk,
    wouldChangeIf: best.wouldChangeIf,
    model: s.model,
    asked: args.samples,
    answered: runs.length,
    ...(args.samples > 1 ? { votes, tied: leaders.length > 1 } : {}),
  };
  if (s.log) await appendFile(s.log, JSON.stringify({ at: new Date().toISOString(), question: args.question, options: args.options, ...out }) + '\n').catch(() => {});
  return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }], structuredContent: out };
}

export async function status(s = settings(), fetcher = fetch) {
  const out = { connected: Boolean(s.baseUrl && s.model), model: s.model || null, answers: false, note: '' };
  if (!out.connected) out.note = 'Set LLM_BASE_URL and LLM_MODEL for this server.';
  else {
    try {
      const res = await fetcher(s.baseUrl + '/models', { headers: s.apiKey ? { authorization: `Bearer ${s.apiKey}` } : {}, signal: AbortSignal.timeout(Math.min(s.timeoutMs, 10000)) });
      out.answers = res.ok;
      if (!res.ok) out.note = `The model server returned an error (${res.status}).`;
    } catch (err) { out.note = `Could not reach the model server: ${reason(err)}.`; }
  }
  return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }], structuredContent: out };
}

function reason(err) { return err?.name === 'TimeoutError' ? 'the model server did not answer in time' : err?.cause?.code || err?.message || 'unknown error'; }
function fail(message) { return { content: [{ type: 'text', text: message }], isError: true }; }

/** Handle one MCP message. Returns the reply, or null for a notification. */
export async function handle(msg, deps = {}) {
  if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') return { jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32600, message: 'Invalid request' } };
  if (msg.id === undefined || msg.id === null) return null;
  const reply = (result) => ({ jsonrpc: '2.0', id: msg.id, result });
  switch (msg.method) {
    case 'initialize': {
      const asked = msg.params?.protocolVersion;
      return reply({ protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0], capabilities: { tools: {} }, serverInfo: SERVER,
        instructions: 'Use "decide" to have a self-hosted model choose between options. Pass everything it needs in "context". Treat the answer as advice from a small model: check its reasons before acting on it.' });
    }
    case 'ping': return reply({});
    case 'tools/list': return reply({ tools: TOOLS });
    case 'tools/call': {
      const name = msg.params?.name, args = msg.params?.arguments;
      if (name === 'decide') return reply(await decide(args, deps.settings, deps.fetcher));
      if (name === 'decider_status') return reply(await status(deps.settings, deps.fetcher));
      return { jsonrpc: '2.0', id: msg.id, error: { code: -32602, message: `Unknown tool: ${name}` } };
    }
    default: return { jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: `Method not found: ${msg.method}` } };
  }
}

function serveStdio() {
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on('line', async (line) => {
    if (!line.trim()) return;
    let msg;
    try { msg = JSON.parse(line); } catch { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n'); return; }
    const out = await handle(msg).catch((err) => ({ jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32603, message: err.message || 'Internal error' } }));
    if (out) process.stdout.write(JSON.stringify(out) + '\n');
  });
}

function serveHttp() {
  const host = process.env.MCP_HOST || '127.0.0.1', port = Number(process.env.MCP_PORT) || 8787, token = process.env.MCP_TOKEN || '';
  if (!token && !['127.0.0.1', 'localhost', '::1'].includes(host)) {
    console.error('Refusing to listen on ' + host + ' without MCP_TOKEN. Anyone who could reach it could use your model.');
    process.exit(1);
  }
  createServer(async (req, res) => {
    const send = (code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(body === undefined ? '' : JSON.stringify(body)); };
    if (new URL(req.url, 'http://x').pathname !== '/mcp') return send(404, { error: 'not found' });
    if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); return res.end(); }
    if (token && req.headers.authorization !== `Bearer ${token}`) return send(401, { error: 'unauthorized' });
    let body = '';
    for await (const chunk of req) { body += chunk; if (body.length > 200000) return send(413, { error: 'too large' }); }
    let msg;
    try { msg = JSON.parse(body); } catch { return send(400, { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
    if (Array.isArray(msg)) return send(400, { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Send one message at a time' } });
    const out = await handle(msg).catch((err) => ({ jsonrpc: '2.0', id: msg?.id ?? null, error: { code: -32603, message: err.message || 'Internal error' } }));
    if (!out) { res.writeHead(202); return res.end(); }
    send(200, out);
  }).listen(port, host, () => console.error(`${SERVER.name} listening on http://${host}:${port}/mcp`));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--http')) serveHttp(); else serveStdio();
}
