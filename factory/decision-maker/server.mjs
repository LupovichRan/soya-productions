#!/usr/bin/env node
// Soya POC #2 — Decision Maker.
// An MCP server that asks a self-hosted, open-weight model to choose between options.
// It talks to any server that speaks the OpenAI-style chat endpoint (Ollama, llama.cpp,
// LM Studio, vLLM). No paid API, no dependencies: Node 18 or newer is all it needs.
//
// Settings (environment variables):
//   LLM_BASE_URL   where the model server listens, e.g. http://localhost:11434/v1
//   LLM_MODEL      the model name on that server, e.g. qwen3:4b
//   LLM_BASE_URL_QUICK / LLM_BASE_URL_DEEP  optional; where the quick or deep model is served, if not on LLM_BASE_URL
//   LLM_MODEL_QUICK  optional; a smaller, faster model for quick decisions (easy to undo, low stakes)
//   LLM_MODEL_DEEP   optional; a larger, more careful model for deep decisions (hard to undo, high stakes)
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

export const SERVER = { name: 'soya-decision-maker', version: '0.2.0' };
const PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

export function settings(env = process.env) {
  return {
    baseUrl: String(env.LLM_BASE_URL || '').trim().replace(/\/+$/, ''),
    model: String(env.LLM_MODEL || '').trim(),
    baseUrlQuick: String(env.LLM_BASE_URL_QUICK || '').trim().replace(/\/+$/, ''),
    baseUrlDeep: String(env.LLM_BASE_URL_DEEP || '').trim().replace(/\/+$/, ''),
    modelQuick: String(env.LLM_MODEL_QUICK || '').trim(),
    modelDeep: String(env.LLM_MODEL_DEEP || '').trim(),
    apiKey: String(env.LLM_API_KEY || ''),
    log: String(env.DECISION_LOG || '').trim(),
    timeoutMs: Math.max(1000, Number(env.LLM_TIMEOUT_MS) || 120000),
  };
}

export const TOOLS = [
  {
    name: 'decide',
    title: 'Decide',
    description: 'Ask the self-hosted model to choose exactly one of the given options, using a structured method. Quick: one answer with reasons (for small choices that are easy to undo). Standard: criteria are weighted before any option is scored, the options are compared on one criterion at a time, the totals are added up in code, then the leader gets a pre-mortem, a bias check and a "what else" check. Deep: the same, with every option scored three times and the middle score kept (for choices that are hard to undo or high stakes). Depth is picked from "reversible" and "stakes" unless you set it. A standard decision that comes out as a close call (less than five points apart, or tied) is asked again automatically with the deep method on the deep model, if one is set; set escalate to false to stop that. Returns the choice, the full table, and a decision record with a review date. The model sees only what you pass here, so put everything it needs in "context". If no model is connected or an answer is unusable, the call fails; it never makes a decision up.',
    inputSchema: {
      type: 'object', additionalProperties: false, required: ['question', 'options'],
      properties: {
        question: { type: 'string', description: 'The decision to make, as one plain question.' },
        options: { type: 'array', minItems: 2, maxItems: 8, items: { type: 'string' }, description: 'The 2 to 8 options to choose between.' },
        context: { type: 'string', description: 'Facts the model needs: background, constraints, what has been tried.' },
        criteria: { type: 'array', maxItems: 8, items: { type: 'string' }, description: 'What matters. Word each one so that more of it is better ("Low price", not "Price"; "Takes little time", not "Time"), or the scores cannot be read. If left out, the model proposes 3 to 5 criteria before it sees the options.' },
        weights: { type: 'array', maxItems: 8, items: { type: 'integer', minimum: 1, maximum: 5 }, description: 'Optional weight 1 to 5 for each criterion, in the same order. If left out, the model sets them before any option is scored.' },
        reversible: { type: 'boolean', description: 'Can this be undone cheaply? Easy-to-undo choices get a lighter method and a one-week review; hard-to-undo ones get the deep method and a 30-day review.' },
        stakes: { type: 'string', enum: ['low', 'medium', 'high'], description: 'How much money, time, reputation or trust is at risk.' },
        escalateBelow: { type: 'number', minimum: 0, maximum: 100, description: 'Default 5. A standard decision whose top two options are fewer than this many points apart (out of 100) is re-asked the deep way. Raise it to be more careful.' },
        escalate: { type: 'boolean', description: 'Default true. Re-ask a close standard call with the deep method on the deep model. Ignored when depth is set.' },
        depth: { type: 'string', enum: ['quick', 'standard', 'deep'], description: 'Override the method. Default: quick when reversible and low stakes, deep when not reversible or high stakes, otherwise standard.' },
        samples: { type: 'integer', minimum: 1, maximum: 5, description: 'Quick method only: how many times to ask (default 1). Use 3 or 5 for a vote.' },
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

/** Where each depth is served. Falls back to the main address. */
export function baseUrlFor(depth, s) {
  if (depth === 'quick') return s.baseUrlQuick || s.baseUrl;
  if (depth === 'deep') return s.baseUrlDeep || s.baseUrl;
  return s.baseUrl;
}

/** Which model answers at each depth. Falls back to the main model when no other is set. */
export function modelFor(depth, s) {
  if (depth === 'quick') return s.modelQuick || s.model;
  if (depth === 'deep') return s.modelDeep || s.model;
  return s.model;
}

/** Match the effort to the decision: light for what is easy to undo, heavy for what is not. */
export function pickDepth(reversible, stakes) {
  if (reversible === false || stakes === 'high') return 'deep';
  if (reversible === true && stakes === 'low') return 'quick';
  return 'standard';
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
  let weights = null;
  if (a.weights !== undefined) {
    if (!Array.isArray(a.weights) || a.weights.length !== criteria.length || !criteria.length || a.weights.some(w => !Number.isInteger(w) || w < 1 || w > 5)) return { ok: false, why: '"weights" must be one whole number from 1 to 5 for each criterion, in the same order.' };
    weights = a.weights;
  }
  const reversible = typeof a.reversible === 'boolean' ? a.reversible : null;
  const stakes = ['low', 'medium', 'high'].includes(a.stakes) ? a.stakes : null;
  const depth = ['quick', 'standard', 'deep'].includes(a.depth) ? a.depth : pickDepth(reversible, stakes);
  return { ok: true, args: { question: a.question.trim(), options, context: typeof a.context === 'string' ? a.context.trim() : '', criteria, weights, reversible, stakes, depth, samples } };
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
    body: JSON.stringify({ model: s.model, messages, temperature, max_tokens: 1200, stream: false, ...(state.format ? { response_format: { type: 'json_object' } } : {}) }),
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

/**
 * Decide, and when the first pass is a close call, ask again the careful way.
 * A standard decision that comes out less than five points apart (or tied) is re-run with the deep method on the
 * deep model, if one is set. The deep answer is the one returned; the first pass is kept alongside it.
 * Not done when the caller chose a depth, or set escalate: false.
 */
export async function decide(raw, s = settings(), fetcher = fetch) {
  const first = await decideAt(raw, s, fetcher);
  const asked = raw && typeof raw === 'object' ? raw : {};
  const out = first.structuredContent;
  // "Close" means less than escalateBelow points apart (default 5), or tied.
  const below = Number.isFinite(asked.escalateBelow) ? Math.max(0, Math.min(100, asked.escalateBelow)) : 5;
  if (first.isError || !out || out.method !== 'standard' || !(out.closeCall || (out.margin != null && out.margin < below)) || asked.depth !== undefined || asked.escalate === false || !s.modelDeep) return first;
  const deep = await decideAt({ ...asked, depth: 'deep' }, s, fetcher);
  if (deep.isError) {
    out.cautions.push(`A deeper second look was tried because this was a close call, but it failed: ${deep.content[0].text}`);
    first.content = [{ type: 'text', text: JSON.stringify(out, null, 2) }];
    return first;
  }
  const d = deep.structuredContent;
  d.escalatedFrom = { model: out.model, method: out.method, choice: out.choice, margin: out.margin, totals: out.table.map(t => ({ option: t.option, total: t.total })) };
  d.cautions.unshift(`The first pass (${out.model}, standard) ${out.closeCall ? 'was a close call' : `had a margin under ${below} points`}, ${out.choice ? `choosing "${out.choice}" by ${out.margin} points` : 'an exact tie'}, so it was asked again with the deep method on ${d.model}.${out.choice && d.choice !== out.choice ? ` The deep method chose differently: "${d.choice}".` : ''}`);
  deep.content = [{ type: 'text', text: JSON.stringify(d, null, 2) }];
  return deep;
}

async function decideAt(raw, s, fetcher) {
  const checked = checkArgs(raw);
  if (!checked.ok) return fail(checked.why);
  if (!s.baseUrl || !s.model) return fail('No model is connected. Set LLM_BASE_URL and LLM_MODEL for this server. No decision was made.');
  const { args } = checked;
  // The right model for the job: a small one for small choices, the careful one for what is hard to undo.
  s = { ...s, model: modelFor(args.depth, s), baseUrl: baseUrlFor(args.depth, s) };
  const state = { format: true };
  if (args.depth !== 'quick') {
    let out;
    try { out = await structured(s, args, fetcher, state); }
    catch (err) { return fail(`Could not get a decision: ${reason(err)}. No decision was made.`); }
    await record(s, args, out);
    return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }], structuredContent: out };
  }
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
    method: 'quick',
    asked: args.samples,
    answered: runs.length,
    ...(args.samples > 1 ? { votes, tied: leaders.length > 1 } : {}),
    record: makeRecord(args, best.choice, Math.round(mean(winner) * 100) / 100, best.wouldChangeIf, ''),
  };
  await record(s, args, out);
  return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }], structuredContent: out };
}

/* ---------- The structured method ----------
   Built from Ran's own decision research (his decision-coach project and his decision-models notes):
   - match the effort to how reversible the choice is and how much is at stake
   - agree the criteria and their weights before scoring, so the result cannot lean toward a favourite
   - judge one criterion at a time across the options, and only then add up (this keeps one strong
     impression from colouring the rest, and reduces noise)
   - add the totals up in code; a model's arithmetic is not trusted
   - run a pre-mortem on the leader, with an early warning sign for each way it could fail
   - ask "what else?" and name the one bias most likely to matter
   - if the leader feels wrong, say which criterion is missing instead of overriding it silently
   - finish with a decision record and a review date; a decision nobody reviews teaches nothing */

const BIASES = ['anchoring', 'recency', 'confirmation', 'sunk cost', 'loudest opinion', 'none'];

const WEIGH_SYSTEM = `You help set up a decision before any option is judged. You are given a question and its context, but not the options. Say what should matter, and how much.

Answer with one JSON object and nothing else.`;

// One criterion at a time, across all the options: judging each quality separately before any
// overall view is formed keeps one strong impression from colouring everything else, and seeing the
// options side by side is what makes a score such as "low price" mean something.
// The reason is asked for before the number, and no example number is shown: a small model that
// sees "score": 3 in the instructions tends to answer 3 to everything.
const SCORE_SYSTEM = `You compare the options for a decision on ONE criterion only. Ignore everything else about the options, however good or bad they are in other ways. Base your answer only on what you are given, and do not invent facts.

For each option, first say what specifically helps or hurts it on this one criterion, then give it a score: 1 very poor, 2 poor, 3 mixed, 4 good, 5 very good. Compare the options with each other: if one is clearly better on this criterion it must get a higher score, and equal scores are only for options that are truly equal on it.

Answer with one JSON object and nothing else, keyed by option number, with "why" before "score". The request ends with the exact shape to fill in. Do not repeat the criterion as the reason.

If what you are given says nothing at all about an option on this criterion, answer "score": null for that option and say in "why" what is missing. Do not guess a number for an option you know nothing about.`;

const REVIEW_SYSTEM = `You stress-test a decision that is about to be made. You are given the question, the options with their scores, and the current leader. Be a sceptical friend, not a cheerleader.

Answer with one JSON object and nothing else:
{
  "preMortem": [{ "reason": "string", "earlyWarning": "string" }],
  "bias": "none",
  "biasWhy": "string",
  "whatElse": "string",
  "leaderFeelsRight": true,
  "missingCriterion": "string",
  "wouldChangeIf": "string",
  "ifThen": "string",
  "doubtfulReasons": ["string"],
  "confidence": 0.0
}
"preMortem": imagine it is some months later and choosing the leader failed. Give the one to three most likely reasons, each with an early warning sign that could be noticed in time.
"bias": the one most likely to be distorting this decision: anchoring, recency, confirmation, sunk cost, loudest opinion, or none. "biasWhy": one sentence.
"whatElse": one option that is not on the list and deserves a look, or an empty string.
"leaderFeelsRight": false only if the leader seems wrong despite the scores; then "missingCriterion" names what the criteria failed to capture. Otherwise an empty string.
"wouldChangeIf": the one fact that would change the decision.
"ifThen": the next step as an if-then plan, such as "If it is Monday morning, then I will ...".
"doubtfulReasons": any reason given for a score that contradicts the context or states something the context does not support, quoted briefly with what is wrong. An empty list if none.
"confidence": between 0 and 1.`;

/** Ask for JSON and check it; one retry with the reason. */
async function askJson(s, system, user, check, temperature, fetcher, state) {
  const messages = [{ role: 'system', content: system }, { role: 'user', content: user }];
  let why = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    const answer = await chat(s, messages, temperature, fetcher, state);
    let result;
    try { result = check(extractJson(answer)); } catch (err) { result = { ok: false, why: err.message || 'unreadable answer' }; }
    if (result.ok) return result.value;
    why = result.why;
    messages.push({ role: 'assistant', content: String(answer).slice(0, 4000) }, { role: 'user', content: `That answer was not usable: ${why}. Send the complete JSON object again, corrected.` });
  }
  throw new Error(`the model's answer was not usable (${why})`);
}

const strings = (v, max) => (Array.isArray(v) ? v : []).filter(x => typeof x === 'string' && x.trim()).map(x => x.trim()).slice(0, max);
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const whole15 = (n) => Number.isInteger(Number(n)) && Number(n) >= 1 && Number(n) <= 5;
export const median = (ns) => { const a = [...ns].sort((x, y) => x - y); return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2; };

export function checkWeights(raw, criteria) {
  if (!raw || typeof raw !== 'object') return { ok: false, why: 'the answer is not a JSON object' };
  if (criteria.length) {
    if (!Array.isArray(raw.weights) || raw.weights.length !== criteria.length || !raw.weights.every(whole15)) return { ok: false, why: `"weights" must have ${criteria.length} whole numbers from 1 to 5` };
    return { ok: true, value: criteria.map((name, i) => ({ name, weight: Number(raw.weights[i]) })) };
  }
  const list = (Array.isArray(raw.criteria) ? raw.criteria : []).filter(c => c && str(c.name) && whole15(c.weight)).map(c => ({ name: str(c.name), weight: Number(c.weight) }));
  if (list.length < 2 || list.length > 6 || list.length !== (raw.criteria || []).length) return { ok: false, why: '"criteria" must have 2 to 6 entries, each with a "name" and a whole-number "weight" from 1 to 5' };
  return { ok: true, value: list };
}

/** One criterion's answer: an entry per option, keyed by option number. */
export function checkScores(raw, count) {
  if (!raw || typeof raw !== 'object') return { ok: false, why: 'the answer is not a JSON object' };
  const out = [];
  for (let i = 1; i <= count; i++) {
    const e = raw[String(i)];
    if (!e || typeof e !== 'object') return { ok: false, why: `option ${i} is missing; there must be one entry for each of the ${count} options, keyed "1" to "${count}"` };
    if (!str(e.why)) return { ok: false, why: `option ${i}: "why" must be one short sentence` };
    // A model that says it has nothing to go on is telling the truth. Count that as a neutral 3 and say so,
    // rather than throwing away the whole decision.
    if (e.score == null || /^(n\/?a|null|unknown|none|not applicable|\?)$/i.test(String(e.score).trim())) { out.push({ score: 3, why: str(e.why), unknown: true }); continue; }
    if (!whole15(e.score)) return { ok: false, why: `option ${i}: "score" must be a whole number from 1 to 5, or null if you have nothing to go on` };
    out.push({ score: Number(e.score), why: str(e.why) });
  }
  return { ok: true, value: out };
}

export function checkReview(raw) {
  if (!raw || typeof raw !== 'object') return { ok: false, why: 'the answer is not a JSON object' };
  const preMortem = (Array.isArray(raw.preMortem) ? raw.preMortem : []).filter(p => p && str(p.reason)).map(p => ({ reason: str(p.reason), earlyWarning: str(p.earlyWarning) })).slice(0, 3);
  if (!preMortem.length) return { ok: false, why: '"preMortem" must have at least one reason the choice could fail' };
  const confidence = Number(raw.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) return { ok: false, why: '"confidence" must be a number between 0 and 1' };
  const bias = BIASES.includes(str(raw.bias).toLowerCase()) ? str(raw.bias).toLowerCase() : 'none';
  return { ok: true, value: { preMortem, bias, biasWhy: str(raw.biasWhy), whatElse: str(raw.whatElse), leaderFeelsRight: raw.leaderFeelsRight !== false, missingCriterion: str(raw.missingCriterion), wouldChangeIf: str(raw.wouldChangeIf), ifThen: str(raw.ifThen), doubtfulReasons: strings(raw.doubtfulReasons, 4), confidence } };
}

function makeRecord(args, decision, confidence, wouldChangeIf, ifThen) {
  const days = args.reversible === false || args.stakes === 'high' ? 30 : 7;
  const today = new Date();
  return {
    decision,
    madeOn: today.toISOString().slice(0, 10),
    confidence: confidence >= 0.75 ? 'high' : confidence >= 0.5 ? 'medium' : 'low',
    wouldChangeIf,
    nextStep: ifThen,
    reviewOn: new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10),
    atReview: 'Did it work? What was learned? Keep, change or reverse.',
  };
}

async function record(s, args, out) {
  if (s.log) await appendFile(s.log, JSON.stringify({ at: new Date().toISOString(), question: args.question, options: args.options, ...out }) + '\n').catch(() => {});
}

async function structured(s, args, fetcher, state) {
  let weightNote = '';
  const about = `Question: ${args.question}` + (args.context ? `\n\nContext:\n${args.context}` : '');

  // 1. Criteria and weights first. The model is not shown the options here.
  let criteria;
  if (args.weights) criteria = args.criteria.map((name, i) => ({ name, weight: args.weights[i] }));
  else {
    const ask = args.criteria.length
      ? `${about}\n\nCriteria:\n${args.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nGive each criterion a weight from 1 (matters a little) to 5 (matters most): {"weights": [3]}, one number per criterion, in order.`
      : `${about}\n\nName the 3 to 5 things that should matter most for this decision, each worded so that more of it is better (for example "Low cost", not "Cost"), and each with a weight from 1 (matters a little) to 5 (matters most): {"criteria": [{"name": "string", "weight": 3}]}`;
    try { criteria = await askJson(s, WEIGH_SYSTEM, ask, (raw) => checkWeights(raw, args.criteria), 0.2, fetcher, state); }
    catch (err) {
      // The caller named the criteria, so a model that cannot weigh them should not sink the decision.
      // Equal weights are a fair default, and the answer says so. Criteria the model was to propose cannot be invented here.
      if (!args.criteria.length) throw err;
      criteria = args.criteria.map(name => ({ name, weight: 3 }));
      weightNote = `The model could not set the weights (${reason(err)}), so every criterion counts equally.`;
    }
  }
  // 2. One criterion at a time, across all the options. Deep: three rounds, each with the options
  //    in a different order so that position cannot favour one, and the middle score is kept.
  const rounds = args.depth === 'deep' ? 3 : 1;
  const n = args.options.length;
  const table = args.options.map(option => ({ option, scores: [], reasons: [], unknown: [], spread: 0 }));
  for (const c of criteria) {
    const runs = [];   // runs[round][optionIndex] = { score, why }
    for (let round = 0; round < rounds; round++) {
      const order = args.options.map((_, i) => (i + round) % n);
      const shape = `{${order.map((_, k) => `"${k + 1}": {"why": "...", "score": N}`).join(', ')}}`;
      const got = await askJson(s, SCORE_SYSTEM,
        `${about}\n\nThe one criterion to judge: ${c.name}\n\nThe options:\n${order.map((oi, k) => `${k + 1}. ${args.options[oi]}`).join('\n')}\n\nFill in exactly this shape, where each N is your whole-number score from 1 to 5 for that option on this criterion:\n${shape}`,
        (raw) => checkScores(raw, n), rounds > 1 ? 0.7 : 0.2, fetcher, state);
      const byOption = [];
      order.forEach((oi, k) => { byOption[oi] = got[k]; });
      runs.push(byOption);
    }
    table.forEach((row, oi) => {
      const mine = runs.map(r => r[oi]);
      const mid = median(mine.map(r => r.score));
      row.scores.push(mid);
      // Unknown when most rounds had nothing to go on.
      if (mine.filter(r => r.unknown).length * 2 > mine.length) row.unknown.push(c.name);
      // Keep the reason that goes with the middle score.
      row.reasons.push(mine.slice().sort((x, y) => Math.abs(x.score - mid) - Math.abs(y.score - mid))[0].why);
      row.spread = Math.max(row.spread, Math.max(...mine.map(r => r.score)) - Math.min(...mine.map(r => r.score)));
    });
  }
  for (const row of table) {
    // Reasons behind high scores are the case for; reasons behind low scores are the case against.
    const pick = (test) => criteria.map((c, i) => ({ i, weight: c.weight })).filter(x => test(row.scores[x.i])).sort((x, y) => y.weight - x.weight).slice(0, 3).map(x => row.reasons[x.i]);
    row.pros = pick(v => v >= 4);
    row.cons = pick(v => v <= 2);
    if (rounds === 1) delete row.spread;
    if (!row.unknown.length) delete row.unknown;
  }

  // 3. Totals are added up here, not by the model.
  const max = criteria.reduce((n, c) => n + c.weight * 5, 0);
  for (const row of table) row.total = Math.round(row.scores.reduce((n, sc, c) => n + sc * criteria[c].weight, 0) / max * 1000) / 10;
  const ranked = [...table].sort((a, b) => b.total - a.total);
  const leader = ranked[0], margin = Math.round((leader.total - ranked[1].total) * 10) / 10;
  const closeCall = margin < 5;
  // An exact tie at the top is not a decision. Say so rather than hand back whichever option was listed first.
  const tied = margin === 0;
  const all = table.flatMap(r => r.scores);
  const flat = Math.max(...all) - Math.min(...all) <= 1;

  // 4. Stress-test the leader.
  const scoreboard = ranked.map(r => `- ${r.option}: ${r.total} out of 100.\n${criteria.map((c, i) => `    ${c.name}: ${r.scores[i]} of 5, because: ${r.reasons[i]}`).join('\n')}`).join('\n');
  let review = null, reviewNote = '';
  try {
    review = await askJson(s, REVIEW_SYSTEM, `${about}\n\nCriteria and weights:\n${criteria.map(c => `- ${c.name} (weight ${c.weight})`).join('\n')}\n\nOptions, best score first:\n${scoreboard}\n\nCurrent leader: ${leader.option}`, checkReview, 0.3, fetcher, state);
  } catch (err) { reviewNote = `The stress-test could not be run: ${reason(err)}. The choice rests on the scores alone.`; }

  // The scores decide. Doubts are reported, never used to swap the winner quietly.
  let confidence = review ? review.confidence : 0.5;
  if (closeCall) confidence = Math.min(confidence, 0.6);
  if (tied) confidence = 0;
  if (review && !review.leaderFeelsRight) confidence = Math.min(confidence, 0.5);
  if (review && review.doubtfulReasons.length) confidence = Math.min(confidence, 0.5);
  if (table.some(r => r.unknown)) confidence = Math.min(confidence, 0.5);
  if (weightNote) confidence = Math.min(confidence, 0.6);
  confidence = Math.round(confidence * 100) / 100;
  const cautions = [
    ...table.flatMap(r => (r.unknown || []).map(c => `The model had nothing to go on for "${r.option}" on "${c}", so that score is a neutral 3. Give it more context and decide again.`)),
    flat ? 'The model gave nearly the same score to everything, so the totals say little. It is probably too small for this decision; try a larger model.' : '',
    tied ? `Exact tie between ${ranked.filter(r => r.total === leader.total).map(r => `"${r.option}"`).join(' and ')}. The model could not separate them. No decision was made.` : closeCall ? `Close call: only ${margin} points separate "${leader.option}" from "${ranked[1].option}".` : '',
    review && !review.leaderFeelsRight ? `The model doubts the leader despite the scores${review.missingCriterion ? `; it says the criteria miss: ${review.missingCriterion}` : ''}. Consider adding that criterion and deciding again.` : '',
    review && review.bias !== 'none' ? `Watch for ${review.bias} bias: ${review.biasWhy}` : '',
    review && review.whatElse ? `An option that was not on the list: ${review.whatElse}` : '',
    ...(review ? review.doubtfulReasons.map(d => `A reason behind a score looks wrong: ${d}`) : []),
    rounds > 1 && table.some(r => r.spread >= 3) ? 'The model scored the same option very differently between rounds; treat the totals as rough.' : '',
    weightNote,
    reviewNote,
  ].filter(Boolean);

  return {
    choice: tied ? null : leader.option,
    decided: !tied,
    confidence,
    method: args.depth,
    reasons: leader.pros,
    risk: review?.preMortem[0]?.reason || leader.cons[0] || '',
    wouldChangeIf: review?.wouldChangeIf || '',
    criteria,
    table: ranked,
    margin,
    closeCall,
    preMortem: review?.preMortem || [],
    cautions,
    record: tied ? null : makeRecord(args, leader.option, confidence, review?.wouldChangeIf || '', review?.ifThen || ''),
    model: s.model,
  };
}

export async function status(s = settings(), fetcher = fetch) {
  const out = { connected: Boolean(s.baseUrl && s.model), model: s.model || null, models: { quick: modelFor('quick', s) || null, standard: s.model || null, deep: modelFor('deep', s) || null }, answers: false, note: '' };
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
        instructions: 'Use "decide" to have a self-hosted model choose between options with a structured method (weights first, options compared one criterion at a time, totals added in code, then a pre-mortem and bias check). Say whether the choice is reversible and how high the stakes are. Pass everything the model needs in "context". Read the cautions and the table before acting, and keep the decision record so the choice can be reviewed on its review date.' });
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
