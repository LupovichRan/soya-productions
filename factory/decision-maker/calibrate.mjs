#!/usr/bin/env node
// Is this model good enough to decide with?
// Runs decisions that have a defensible right answer through the decision maker and reports
// how many the model gets right, how well it tells options apart, and how long it takes.
// Use it before trusting a model, and to pick the smallest model that passes.
//
//   LLM_BASE_URL=http://localhost:11434/v1 LLM_MODEL=qwen2.5:7b node factory/decision-maker/calibrate.mjs
//   add --json for machine-readable output, --depth deep to test the deep method, --hard for the harder set
import { pathToFileURL } from 'node:url';
import { decide, settings } from './server.mjs';

/** Each case has one answer a careful person would not argue with. */
export const CASES = [
  {
    name: 'cheaper, otherwise identical',
    question: 'Where should I buy the kettle?',
    options: ['Shop A, which sells it for 20 dollars', 'Shop B, which sells the same kettle for 45 dollars'],
    criteria: ['Low price'], weights: [5],
    context: 'Both shops are on the same street, have it in stock, and offer the same guarantee.',
    expect: 0,
  },
  {
    name: 'safety before speed',
    question: 'How should I upgrade the family computer?',
    options: ['Upgrade right now without a backup', 'Back up the photos first, then upgrade'],
    criteria: ['The family photos stay safe', 'Takes little time'], weights: [5, 1],
    context: 'The backup takes twenty minutes. The photos exist only on this computer. Upgrades occasionally wipe the disk.',
    expect: 1,
  },
  {
    name: 'a hard limit rules options out',
    question: 'Which bicycle should I buy?',
    options: ['The Sparrow, 90 dollars, basic but sound', 'The Falcon, 160 dollars, better gears', 'The Eagle, 320 dollars, the best of the three'],
    criteria: ['Costs no more than the 100 dollars I have', 'Quality of the bicycle'], weights: [5, 2],
    context: 'I have exactly 100 dollars and cannot borrow.',
    expect: 0,
  },
  {
    name: 'follows the weights: speed matters most',
    question: 'How should I travel to the meeting?',
    options: ['The express train: 40 minutes, 30 dollars', 'The bus: 2 hours, 6 dollars'],
    criteria: ['Arrives quickly', 'Low cost'], weights: [5, 1],
    context: 'Both leave now and both are reliable.',
    expect: 0,
  },
  {
    name: 'follows the weights: cost matters most',
    question: 'How should I travel to the meeting?',
    options: ['The express train: 40 minutes, 30 dollars', 'The bus: 2 hours, 6 dollars'],
    criteria: ['Arrives quickly', 'Low cost'], weights: [1, 5],
    context: 'Both leave now and both are reliable.',
    expect: 1,
  },
  {
    name: 'is not swayed by a fancy name',
    question: 'Which note-taking method should our small team use?',
    options: ['HyperQuantum AI NoteVerse Pro, which nobody on the team has tried and which needs a week of training', 'The shared document the whole team already uses every day and is happy with'],
    criteria: ['The team can use it from tomorrow', 'People already know how it works'], weights: [5, 4],
    context: 'There are four of us. We need notes for a project that starts tomorrow.',
    expect: 1,
  },
  {
    name: 'keeps a secret safe',
    question: 'How should I give my colleague the password to the shared account?',
    options: ['Post it in the company-wide group chat', 'Share it through the password manager we both use', 'Write it on a note stuck to the office door'],
    criteria: ['Only my colleague can see it'], weights: [5],
    context: 'The group chat has 200 people. The office door faces a public corridor.',
    expect: 1,
  },
  {
    name: 'the middle option is right',
    question: 'How much paint should I buy for the room?',
    options: ['One litre, which covers a quarter of the walls', 'Five litres, which covers all the walls with a little spare', 'Fifty litres, which would cover the whole building'],
    criteria: ['Enough to finish the room', 'Little waste'], weights: [5, 3],
    context: 'The shop is closed tomorrow and the room must be painted tomorrow.',
    expect: 1,
  },
];

/** Harder cases, each still with one defensible answer: a unit or arithmetic trap, a flashy distractor, a negated
 *  criterion, an unknown against a proven option, a weighted trade-off, irreversibility, and a hard requirement.
 *  A model that passes the easy set can still fail these. Use them to decide when a second look is worth its cost. */
export const HARD_CASES = [
  {
    name: 'arithmetic: "one month free" is not the sticker price',
    question: 'Which phone plan is cheaper over the whole contract?',
    options: ['Plan A: 100 dollars a month for 3 months, and the first month is free', 'Plan B: 270 dollars in one payment for the 3 months'],
    criteria: ['Low total cost'], weights: [5],
    context: 'Both plans are for the same 3 months and give exactly the same service.',
    expect: 0,
  },
  {
    name: 'a hard requirement beats a long feature list',
    question: 'Which note-taking app should I use on the train?',
    options: ['CloudNotes: works only with an internet connection, but has voice notes, drawing, sharing, templates and AI summaries', 'PlainNotes: works fully offline, only plain text'],
    criteria: ['Works without internet', 'Has many features'], weights: [5, 1],
    context: 'The train has no signal for the whole 90-minute ride, and notes must be taken during the ride.',
    expect: 1,
  },
  {
    name: 'a negated criterion: fewer interruptions is better',
    question: 'Which reminder app should I install?',
    options: ['App One sends about 10 notifications every day', 'App Two sends about 1 notification every week'],
    criteria: ['Few interruptions'], weights: [5],
    context: 'Both apps remind you of the same things and are equally easy to use.',
    expect: 1,
  },
  {
    name: 'a proven option against an unknown one',
    question: 'Which backup service should I trust with my photos?',
    options: ['Service X: has run for 12 years with no reported data loss', 'Service Y: launched last month, nothing is known about its reliability yet'],
    criteria: ['Proven to be reliable'], weights: [5],
    context: 'Both cost the same and have the same features.',
    expect: 0,
  },
  {
    name: 'the single heavy criterion decides, not the count of wins',
    question: 'Which flat should I rent?',
    options: ['Flat A: 5 minutes from work, but the rent is 40 percent above what I can pay', 'Flat B: 35 minutes from work, rent within what I can pay, quieter street'],
    criteria: ['Rent is within what I can pay', 'Short trip to work', 'Quiet street'], weights: [5, 1, 1],
    context: 'I cannot borrow money and cannot pay more than my limit.',
    expect: 1,
  },
  {
    name: 'reversibility: the choice that can be undone',
    question: 'What should I do with the old project files?',
    options: ['Delete them permanently right now', 'Move them to an archive folder and delete them in 30 days if nobody asks'],
    criteria: ['The choice can still be undone'], weights: [5],
    context: 'I am fairly sure nobody needs them, but I am not completely certain.',
    expect: 1,
  },
  {
    name: 'units: 90 minutes is shorter than 2 hours',
    question: 'Which route should I take to the airport?',
    options: ['Route One: 2 hours', 'Route Two: 90 minutes'],
    criteria: ['Takes less time'], weights: [5],
    context: 'Both routes cost the same and are equally comfortable.',
    expect: 1,
  },
];

export async function calibrate(s = settings(), { depth = 'standard', fetcher = fetch, onCase = () => {}, cases = CASES } = {}) {
  const rows = [];
  for (const c of cases) {
    const started = Date.now();
    const r = await decide({ question: c.question, options: c.options, criteria: c.criteria, weights: c.weights, context: c.context, depth }, s, fetcher);
    const out = r.structuredContent;
    const row = {
      name: c.name,
      expected: c.options[c.expect],
      got: r.isError ? null : out.choice,
      right: !r.isError && out.choice === c.options[c.expect],
      failed: Boolean(r.isError),
      note: r.isError ? r.content[0].text : '',
      margin: r.isError ? null : out.margin ?? null,
      flat: !r.isError && (out.cautions || []).some(x => /nearly the same score/.test(x)),
      seconds: Math.round((Date.now() - started) / 1000),
    };
    rows.push(row);
    onCase(row);
  }
  const right = rows.filter(r => r.right).length;
  const summary = {
    model: s.model, depth, cases: rows.length, right,
    failed: rows.filter(r => r.failed).length,
    flat: rows.filter(r => r.flat).length,
    averageSeconds: Math.round(rows.reduce((n, r) => n + r.seconds, 0) / rows.length),
  };
  // A model must get all but one right, never fail to answer, and tell options apart most of the time.
  summary.verdict = right >= rows.length - 1 && summary.failed === 0 && summary.flat <= 1 ? 'good enough to decide with'
    : right >= Math.ceil(rows.length * 0.6) ? 'usable for small, easy-to-undo choices only'
    : 'not good enough';
  return { summary, rows };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const s = settings();
  if (!s.baseUrl || !s.model) { console.error('Set LLM_BASE_URL and LLM_MODEL first.'); process.exit(2); }
  const json = process.argv.includes('--json');
  const depth = process.argv.includes('--depth') ? process.argv[process.argv.indexOf('--depth') + 1] : 'standard';
  const { summary, rows } = await calibrate(s, { depth, cases: process.argv.includes('--hard') ? HARD_CASES : CASES, onCase: (r) => { if (!json) console.log(`${r.right ? 'right' : r.failed ? 'FAILED' : 'WRONG'}  ${String(r.seconds).padStart(4)}s  ${r.name}${r.flat ? '  (flat scores)' : ''}${r.right ? '' : `\n         expected: ${r.expected}\n         got:      ${r.got ?? r.note}`}`); } });
  if (json) console.log(JSON.stringify({ summary, rows }, null, 2));
  else console.log(`\n${summary.model}: ${summary.right} of ${summary.cases} right, ${summary.failed} failed, ${summary.flat} flat, about ${summary.averageSeconds}s per decision.\nVerdict: ${summary.verdict}.`);
  process.exit(summary.verdict === 'not good enough' ? 1 : 0);
}
