# Decision Maker — Soya POC #2

A small server that lets Claude ask **your own self-hosted model** to make a choice. It speaks MCP, so Claude sees it as two tools:

| Tool | What it does |
|---|---|
| `decide` | Give it a question and 2 to 8 options. It works through a structured method and returns one choice, the full scoring table, a pre-mortem, cautions, and a decision record with a review date. |
| `decider_status` | Says whether a model is connected, which one, and whether it answers right now. |

It talks to any model server with an OpenAI-style chat endpoint: Ollama, llama.cpp, LM Studio, vLLM. No paid API. No dependencies; it needs Node 18 or newer and nothing else.

This is a tool for the factory, not an app: it has no screen and is not listed on the front page.

## Why

The factory makes choices on every run, such as which concept to build. This gives those choices a second, independent voice that runs on hardware you control, and a record of what it said.

## Honest by design

- **It never makes a decision up.** No model connected, model unreachable, or an answer that does not name a real option: the call fails and says "No decision was made."
- **One retry.** An unusable answer is sent back to the model once with the reason.
- **The model sees only what it is given.** Everything it needs must be in `context`.
- **It is advice.** A small model can be confidently wrong. Whoever calls it should read the reasons, and say so when they disagree.

## How it decides

The method comes from Ran's own decision research (his decision-coach project and his decision-models notes). The effort is matched to the decision:

| Method | When | What happens |
|---|---|---|
| Quick | Easy to undo and low stakes | One answer with reasons. `samples` (up to 5) turns it into a vote. |
| Standard | Everything in between | The five steps below. |
| Deep | Hard to undo, or high stakes | The five steps, with every option scored three times and the middle score kept. |

Say `reversible` and `stakes` and the method is picked for you; `depth` overrides it.

The five steps:

1. **Weights first.** What matters, and how much, is settled before any option is scored. The model is not shown the options at this step, so the weights cannot lean toward a favourite. You can pass your own `criteria` and `weights` instead.
2. **One criterion at a time.** For each criterion, one small request compares all the options on that criterion alone: a reason first, then a score from 1 to 5. Judging one quality at a time, before any overall view is formed, keeps one strong impression from colouring everything else. Seeing the options side by side is what makes a score such as "low price" mean something. The reasons behind high scores become the case for; the reasons behind low scores become the case against. In the deep method each criterion is asked three times with the options in a different order each time.
3. **Totals in code.** The weighted totals are added up by the server, not by the model.
4. **Stress-test the leader.** A pre-mortem (it is months later and this choice failed: why, and what early sign would have warned us?), the one bias most likely at work, and "what else?" — an option that was not on the list.
5. **A record.** The decision, confidence, what would change it, an if-then next step, and a review date: one week for choices that are easy to undo, 30 days otherwise.

The scores decide. If the model doubts the leader, or the top two are less than five points apart, the answer says so under `cautions` and the confidence is lowered. The winner is never swapped quietly. An exact tie at the top is reported as no decision (`decided: false`, `choice: null`). If the model gives nearly the same score to everything, the answer says the model is probably too small for the job.

### How strong is the evidence for this method

From the research notes, which mostly rest on secondary sources:

| Step | Evidence |
|---|---|
| Pre-mortem | Medium. Reported to help people find about 30% more reasons for an outcome. |
| Judging one criterion at a time before forming an overall view | Medium. Reduces noise and the pull of one strong impression. |
| Weights before scores | A standard practice of weighted decision tables; no outcome study was found. |
| If-then plans | Strong for following through on an intention. |
| Lighter process for reversible choices | An idea from business practice, with no outcome research. |

## What real models have shown so far

First runs, 20 November 2026, on llama.cpp's server with four CPU cores, asking which of three concepts the factory should build next (five criteria, standard method).

| Model | Time | What happened |
|---|---|---|
| Qwen2.5 1.5B Instruct, 4-bit | about 2 minutes | The method ran end to end, but the model could not tell the options apart: nearly every score was 5, and its reasons mostly repeated the criteria. The tool reported a close call and low confidence. **Not good enough to decide with.** |

| Qwen2.5 7B Instruct, 4-bit | about 6 minutes | Told the options apart and gave real reasons. One reason was factually wrong (it said pasting text sends it off the device), and that error decided the result. **Useful, but its reasons must be read.** |

What these runs changed in the method:

1. Scores are asked for one criterion at a time. Asked for five at once, the small model left blanks.
2. The reason is asked for before the number, and no example number is shown. Shown a 3, it answered 3 to everything.
3. An exact tie is reported as no decision. It used to return whichever option was listed first.
4. The stress-test now looks for reasons that contradict the context, after the 7B model's false reason.
5. Options are compared side by side on each criterion. In the first design each option was scored without seeing the others, and all three models then failed the simplest calibration case: asked alone whether 20 dollars is a "low price" for a kettle, a model cannot know. Scored the first way, the 1.5B model got 3 of 8 calibration cases right and Phi-3.5-mini got 6 of 8.
6. Criteria must be worded so that more is better ("Low price", not "Price").
7. A model that says it has nothing to go on for an option (a `null` score) is counted as a neutral 3 and flagged, and the confidence is capped at 0.5, instead of the whole decision failing. This came from the first real decision with Phi-3.5 mini, where an option had been left out of the background text by mistake.
8. A model that cannot set the weights (it miscounted them twice in real runs) no longer sinks the decision when the caller named the criteria: every criterion then counts equally, the answer says so, and confidence is capped at 0.6. When the model was meant to propose the criteria itself, there is nothing to fall back on and the call fails.

## Calibration results

Eight calibration decisions, standard method, llama.cpp on four CPU cores, 20 November 2026. Each model was measured twice: first with the original method (each option scored without seeing the others), then with the current one (options compared side by side on one criterion at a time).

| Model | Licence | Original method | Current method | Time per decision | Verdict now |
|---|---|---|---|---|---|
| Qwen2.5 1.5B Instruct, 4-bit | Apache-2.0 | 3 of 8 | 6 of 8 | about 1 minute | Quick, easy-to-undo choices only |
| Phi-3.5 mini Instruct, 4-bit | MIT | 6 of 8 | **8 of 8** | about 2 minutes | **Good enough to decide with** |
| Qwen2.5 7B Instruct, 4-bit | Apache-2.0 | not measured | **8 of 8** | about 2 minutes | **Good enough to decide with** |

What this says:

1. **The method mattered as much as the model.** Changing how the question is put took the smallest model from 3 to 6 right and the middle one from 6 to 8.
2. **Phi-3.5 mini is the smallest model that passes.** It is the default for standard decisions. Its file is about 2.4 GB, so it fits a 4 to 8 GB server.
3. **Qwen2.5 7B matches it on these eight easy cases but is no faster**, so on the easy cases it has no advantage. On the harder set below it did worse, not better.
4. **The 1.5B model is for quick choices only.** It still failed one case where the weights decide, and one where the middle option is right.

**Run-to-run noise is real.** Phi-3.5 mini was asked the same real question twice, at a low temperature, and Second Look scored 89.5 the first time and 70.5 the second, while Say It Kindly stayed on top (90.5, then 96.8). The winner was stable; the margin was not. So a margin of a few points is within noise, which is exactly why a close call is asked again with the deep method rather than trusted.

### A harder calibration set

`node factory/decision-maker/calibrate.mjs --hard` runs seven cases that are still clear-cut but easier to get wrong: an arithmetic trap ("first month free"), a long feature list against a hard requirement, a negated criterion ("few interruptions"), a proven option against an unknown one, one heavy criterion against several light ones, reversibility, and units (90 minutes against 2 hours). Standard method, one run per case.

| Model | Hard set | Wrong on |
|---|---|---|
| Phi-3.5 mini | **7 of 7** (one case with flat scores) | none |
| Qwen2.5 7B | **5 of 7** | the arithmetic trap; the reversible choice |

**The larger model was not the better one.** This contradicts the assumption the set-up was first built on, that a bigger model is the careful one. With one run per case and seven cases, a single lucky or unlucky answer moves a model by 14 points, so this is a warning and not a ranking.

### Stability on an ambiguous choice

The same real question (which of three concepts to build, five equal-weight criteria) was asked three times on each model, standard method:

| Model | Choices | Margins | Plain Steps total in each run | Time per run |
|---|---|---|---|---|
| Phi-3.5 mini | Plain Steps, Plain Steps, Plain Steps | 20, 12, 4 (spread 6.5) | 84, 80, 80 | about 4.7 minutes |
| Qwen2.5 7B | Plain Steps, Plain Steps, Plain Steps | 28, 24, 32 (spread 3.3) | 100, 100, 100 | about 5.4 minutes |

All six runs agree on the order: Plain Steps, then Second Look, then Five-Minute Teacher. The 7B model was steadier from run to run; Phi's margin ranged from 4 to 20.

### What the disagreement rule would have done on the hard set

From the real standard runs above (not a run through the escalation path itself): Phi and Qwen2.5 7B gave the same answer on 5 of the 7 hard cases, and both were right. On the other 2 (the arithmetic trap and the reversible choice) Phi was right and Qwen was wrong.

| Policy | Right | Wrong | No decision |
|---|---|---|---|
| Phi alone | 7 | 0 | 0 |
| Qwen alone | 5 | 2 | 0 |
| The deep model's answer replaces the first (the first design) | 5 | 2 | 0 |
| **Agree or no decision (now)** | **5** | **0** | **2** |

The first design would have thrown away two correct answers. The rule now used trades two decisions it could not make for no wrong ones. **Then measured through the full path** (`calibrate.mjs --hard` with `escalateBelow: 100`, so every case gets the second look; Phi-3.5 mini first, Qwen2.5 7B deep second, servers swapped one at a time):

| Case | Phi first | Second look | Result |
|---|---|---|---|
| Arithmetic trap | right | disagreed | **no decision** |
| Hard requirement | right | agreed | right |
| Negated criterion | right | agreed | right |
| Proven against unknown | right | agreed | right |
| One heavy criterion | right | agreed | right |
| Reversibility | right | agreed | right |
| Units | right | agreed | right |

**6 right, 0 wrong, 1 no decision.** Average 307 seconds per decision, against about 115 for Phi alone.

How to read it, without flattering the feature:

1. **It never produced a wrong answer** on this set, and it caught the one disagreement instead of adopting the 7B's wrong arithmetic.
2. **But here it did not rescue anything.** Phi alone was right on all seven, so the second look only added time, and turned one correct answer into "no decision". Its benefit would show where the first model errs, and Phi did not err on this set.
3. **The deep method helped the 7B.** On the reversibility case the 7B, run standard, was wrong; run deep inside the second look, it agreed with Phi and was right. One run, so this may be luck.

### A cheap model first, a better one second

The hard-set run above never showed the second look correcting anything, because Phi made no errors. A first model that does err is needed to test that, so the easy set was run through the full path with Qwen2.5 1.5B first and Phi-3.5 mini second (`escalateBelow: 100`, so every case got the second look).

| Policy | Right | Wrong | No decision | Time per decision |
|---|---|---|---|---|
| 1.5B alone | 6 | 2 | 0 | about 1 minute |
| 1.5B first, second look, disagreement means no decision (the default) | 6 | **0** | 2 | 265 seconds |
| 1.5B first, second look, **trust the second** (`onDisagreement: deep`) | **8** | **0** | 0 | 265 seconds |
| Phi alone | 8 | 0 | 0 | about 110 seconds |

**This is the first real case of a second look correcting a wrong answer.** The 1.5B was wrong on "cheaper, otherwise identical" and on "cost matters most"; Phi was right on both. By default the tool caught both and made no decision; with `onDisagreement: deep`, set because Phi had measured better than the 1.5B, it corrected both.

Three things that keep this from being a recommendation:

1. **The 1.5B's mistakes were confident.** Run again three times on its two wrong cases, its margins were 40, 40 and 40 (one run wrong, two right) and 23, 23 and 20 (all wrong): never under the default threshold of 5. So the default "second look only on a close call" rule **would not have caught either error**. Here the second look only worked because it was forced on every case, which is what costs the time. A small model's margin is not a reliable sign of its confidence.
2. **It is not cheaper.** Cheap-first with a forced second look took 265 seconds per decision, against about 110 for Phi alone, which was right on all eight. On this machine, with models swapped to fit in memory, the cheap-first path loses on both time and accuracy to simply using Phi.
3. **One run per case, eight easy cases.** Two corrections are two corrections, not a rate. In the first case the 1.5B was wrong in one run of three and right in the other two with the same margin, so even its errors are partly noise.

What this supports: `onDisagreement: deep` is correct *only* when the second model has measured better than the first (check with `calibrate.mjs`), and the second look is worth forcing (`escalateBelow` high) only when the first model is known to make confident mistakes. For standard decisions on this hardware, use the smallest model that passes calibration, here Phi-3.5 mini, on its own.

### Which model for the second look

Neither model dominates: Phi was right more often on the hard clear-cut cases, and the 7B was steadier on the ambiguous choice. So the second look is not "ask the stronger model". Its value is **independence**: two different models that agree are better evidence than one model asked twice, and two that disagree is exactly when a person should look. The default pairing (Phi first, Qwen2.5 7B second) is kept for that reason, and the cautions say when they differ. On the hard set the second look never corrected a wrong answer, because the first model made none; it cost time and one decision that Phi alone would have got right (see the full-path table above). So use it where a close call really matters, and not by default on everything.

### Escalation, verified on real models

The second look was first tested only against stand-ins. It has since been run for real, on Phi-3.5 mini and Qwen2.5 7B, one server at a time because both do not fit in this machine's memory together.

| Question (all reversible, medium stakes) | Phi-3.5 mini, standard: top two, margin | Second look? |
|---|---|---|
| Which concept is the fourth app (three options) | Second Look 75 over Plain Steps 70, margin 5 | No: 5 is not less than 5 |
| Which English name for the app (three options) | Say It Kindly 91.4 over Say It Gently 71.4, margin 20 | No |
| Plain Steps against Second Look, equal weights | Plain Steps 96 over Second Look 64, margin 32 | No |
| Which mascot (three options) | Rabbit 85 over Bear 70, margin 15 | No |
| Which button label (three options) | Copy message 100 over Copy my message 86.7, margin 13.3 | Not by default |
| The same button-label question with `escalateBelow: 100` | as above | **Yes: Qwen2.5 7B, deep method, 672 seconds in all. Same choice, "Copy message", 86.7 over 66.7; the first pass was kept under `escalatedFrom`.** |

What this shows and does not show:

1. **The whole path works for real:** the first pass on one model, the swap to the other, the deep method with three rounds per criterion and rotated option order, and the first pass reported alongside the answer.
2. **A natural close call is rarer than expected.** Across the real runs on this page, Phi's margins were 1, 26, 5, 20, 32, 15 and 13 points, so by the default rule only the very first run (1 point, before the second look existed) would have been re-asked. That is the rule working as designed, but it means the second look will seldom fire at a margin of 5. Raise `escalateBelow` (for example to 15) for decisions that matter.
3. **Agreement is common.** On the two questions where both models answered, they chose the same option each time.
4. **The forced run proves the plumbing, not the value.** The second look has not yet been seen to change a wrong answer into a right one, because no real run has disagreed.

Also seen in these runs: Phi-3.5 mini twice failed to set the weights for four criteria. The decision now carries on with equal weights and says so.

Limits of this evidence: eight cases is a small sample, the cases are ones with a clear answer, and each model was run once per case. A model that passes calibration can still be wrong on a hard, ambiguous decision. Re-run `calibrate.mjs` whenever a model is changed.

Suggested set-up:

| Variable | Model |
|---|---|
| `LLM_MODEL_QUICK` | Qwen2.5 1.5B Instruct |
| `LLM_MODEL` | Phi-3.5 mini Instruct |
| `LLM_MODEL_DEEP` | Qwen2.5 7B Instruct (see "Which model for the second look": chosen for independence from the first, not because it is stronger) |

All three can be served by one llama.cpp server with several models, or by separate small servers; the hosting guide uses one model (Phi-3.5 mini) to stay inside the free allowance.


## Choosing the right model

Two things decide which model answers.

**Is the model good enough at all?** Check before trusting it:

```
LLM_BASE_URL=http://localhost:11434/v1 LLM_MODEL=your-model node factory/decision-maker/calibrate.mjs
```

It runs eight decisions that each have one defensible answer (the cheaper of two identical kettles; back up before upgrading; the bicycle that fits the budget; the same journey with the weights swapped; a fancy name against what already works; where not to post a password; the right amount of paint). It reports how many the model got right, whether it told the options apart, and the time per decision, and gives a verdict: good enough to decide with, usable for small easy-to-undo choices only, or not good enough. Use the smallest model that passes.

**Which model for which decision?** Set up to three, and each decision goes to the one chosen for its depth:

| Variable | Used for | Pick |
|---|---|---|
| `LLM_MODEL_QUICK` | Quick decisions: easy to undo, low stakes | A small, fast model |
| `LLM_MODEL` | Standard decisions, and anything the other two are not set for | The smallest model that passes calibration |
| `LLM_MODEL_DEEP` | Deep decisions: hard to undo or high stakes, and the second look at a close call | A different model from `LLM_MODEL`, so its mistakes are independent. Not simply the largest: on the hard set the larger model did worse |

Every answer says which model made it. `decider_status` lists the three.

**Close calls get a second look automatically.** If a standard decision comes out less than five points apart, or tied, and a deep model is set, the decision is asked again with the deep method on the second model. The first pass is kept under `escalatedFrom` (its model, choice, margin and totals).

- **The two agree:** the deep answer is returned with `agreed: true`, and the first caution says so.
- **The two disagree:** **no decision is made.** `choice` is `null`, `decided` is `false`, confidence is 0, there is no record, and `disagreement` names what each model chose. Both tables are there to read. The caller (a person, or the factory falling back on its backlog scores) decides. Neither model is trusted over the other, because on the hard calibration set the larger model was wrong where the smaller one was right.
- **No second look** when the caller sets a depth, sets `escalate: false`, or no second model is set. If the second look fails, the first answer stands and says so.

If the models live on different servers, set `LLM_BASE_URL_QUICK` and `LLM_BASE_URL_DEEP`; each falls back to `LLM_BASE_URL`.

## Set-up

Three settings, as environment variables:

| Variable | Meaning | Example |
|---|---|---|
| `LLM_BASE_URL` | Where your model server listens | `http://localhost:11434/v1` |
| `LLM_MODEL` | The model's name on that server | `qwen3:4b` |
| `LLM_API_KEY` | Optional. Only if a gateway sits in front of your server | |

Optional: `LLM_MODEL_QUICK` and `LLM_MODEL_DEEP` (see "Choosing the right model"), `DECISION_LOG` (a file that gets one line per decision) and `LLM_TIMEOUT_MS` (default 120000).

Never put a real key in this repository.

### On the computer that runs the model

Claude Code picks the server up from `.mcp.json` at the root of this repository. Set the variables before starting Claude Code:

```
export LLM_BASE_URL=http://localhost:11434/v1
export LLM_MODEL=qwen3:4b
claude
```

### From a cloud session

A cloud session cannot reach `localhost` on your computer. The model server has to be reachable at a public `https` address that you protect with a key. Then, in the cloud environment's settings: allow that host, set `LLM_BASE_URL` and `LLM_MODEL`, and save the key as a network secret for that host. The key is then added to requests on the way out and never appears in the session.

### Over HTTP

For clients that connect to an MCP server by address:

```
MCP_TOKEN=choose-a-long-random-value node factory/decision-maker/server.mjs --http
```

It listens on `http://127.0.0.1:8787/mcp` (`MCP_HOST`, `MCP_PORT` to change). It refuses to listen on any other address without `MCP_TOKEN`, because anyone who could reach it could use your model. It answers each request with plain JSON and keeps no session.

## Example

Asked:

```json
{
  "question": "Which concept should the factory build next?",
  "options": ["Say It Kindly", "Read It To Me Simply", "Plain Steps"],
  "criteria": ["A non-technical adult understands why they want it", "Can be built and checked in one run"],
  "context": "…the backlog rows and the latest brief…",
  "reversible": true,
  "stakes": "medium"
}
```

Answered (shortened):

```json
{
  "choice": "Say It Kindly",
  "confidence": 0.6,
  "method": "standard",
  "criteria": [{ "name": "A non-technical adult understands why they want it", "weight": 5 }, { "name": "Can be built and checked in one run", "weight": 3 }],
  "table": [
    { "option": "Say It Kindly", "scores": [5, 3], "total": 85, "pros": ["…"], "cons": ["…"] },
    { "option": "Read It To Me Simply", "scores": [5, 3], "total": 85, "pros": ["…"], "cons": ["…"] },
    { "option": "Plain Steps", "scores": [3, 5], "total": 75, "pros": ["…"], "cons": ["…"] }
  ],
  "margin": 0,
  "closeCall": true,
  "preMortem": [{ "reason": "…", "earlyWarning": "…" }],
  "cautions": ["Close call: only 0 points separate …", "An option that was not on the list: …"],
  "record": {
    "decision": "Say It Kindly",
    "madeOn": "2026-11-20",
    "confidence": "medium",
    "wouldChangeIf": "…",
    "nextStep": "If …, then …",
    "reviewOn": "2026-11-27",
    "atReview": "Did it work? What was learned? Keep, change or reverse."
  },
  "model": "qwen3:4b"
}
```

The numbers above are illustrative, not from a real model.

## Checking it

```
node --test factory/decision-maker/server.test.mjs
```

The tests use a stand-in model server. They cover the request it sends, the retry, the fallback when a server refuses the JSON setting, every way a call can fail, voting and ties, the structured method (weights set without seeing the options, each option judged alone, totals, close calls, a doubted leader, three-round scoring, review dates), the MCP messages, and one run of the real process over stdin and stdout.
