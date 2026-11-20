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
2. **Each option alone.** Every option is judged in its own separate request, with pros, cons and a score per criterion. It is not shown the other options. Judging separately before comparing reduces noise.
3. **Totals in code.** The weighted totals are added up by the server, not by the model.
4. **Stress-test the leader.** A pre-mortem (it is months later and this choice failed: why, and what early sign would have warned us?), the one bias most likely at work, and "what else?" — an option that was not on the list.
5. **A record.** The decision, confidence, what would change it, an if-then next step, and a review date: one week for choices that are easy to undo, 30 days otherwise.

The scores decide. If the model doubts the leader, or the top two are within five points, the answer says so under `cautions` and the confidence is lowered. The winner is never swapped quietly.

### How strong is the evidence for this method

From the research notes, which mostly rest on secondary sources:

| Step | Evidence |
|---|---|
| Pre-mortem | Medium. Reported to help people find about 30% more reasons for an outcome. |
| Judging separately before comparing | Medium. Reduces noise between judgments. |
| Weights before scores | A standard practice of weighted decision tables; no outcome study was found. |
| If-then plans | Strong for following through on an intention. |
| Lighter process for reversible choices | An idea from business practice, with no outcome research. |

None of this was tested with a small self-hosted model. Whether such a model scores sensibly is the open question this POC exists to answer.

## Set-up

Three settings, as environment variables:

| Variable | Meaning | Example |
|---|---|---|
| `LLM_BASE_URL` | Where your model server listens | `http://localhost:11434/v1` |
| `LLM_MODEL` | The model's name on that server | `qwen3:4b` |
| `LLM_API_KEY` | Optional. Only if a gateway sits in front of your server | |

Optional: `DECISION_LOG` (a file that gets one line per decision) and `LLM_TIMEOUT_MS` (default 120000).

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
