# Decision Maker — Soya POC #2

A small server that lets Claude ask **your own self-hosted model** to make a choice. It speaks MCP, so Claude sees it as two tools:

| Tool | What it does |
|---|---|
| `decide` | Give it a question and 2 to 8 options. It works through a structured method and returns one choice, the full scoring table, a pre-mortem, cautions, and a decision record with a review date. |
| `decider_status` | Says whether a model is connected, which one, and whether it answers right now. |

It talks to any model server with an OpenAI-style chat endpoint: Ollama, llama.cpp, LM Studio, vLLM. No paid API. No dependencies; it needs Node 18 or newer and nothing else.

This is a tool for the factory, not a film: it has no screen and is not listed on the front page.

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

The scores decide. If the model doubts the leader, or the top two are within five points, the answer says so under `cautions` and the confidence is lowered. The winner is never swapped quietly. An exact tie at the top is reported as no decision (`decided: false`, `choice: null`). If the model gives nearly the same score to everything, the answer says the model is probably too small for the job.

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

Calibration results for the current method are being measured and will be added here.


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
| `LLM_MODEL_DEEP` | Deep decisions: hard to undo or high stakes | The most careful model you can run |

Every answer says which model made it. `decider_status` lists the three.

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
