# The Soya Productions factory

Soya Productions is a small software factory. On a schedule, a run reads what is happening in AI and software, turns the most useful concept into a small web app (a "film"), and opens a pull request. Ran reviews and merges. Nothing reaches `main` without that.

This file is the playbook. A run follows it from top to bottom.

## What a run produces

One pull request containing:

1. **A trend brief** — `factory/trends/YYYY-MM-DD.md`.
2. **An updated backlog** — `factory/backlog.md`.
3. **One new film** — `films/YYYY-MM-DD-slug/`, plus its entry at the top of `films.js`.

If three or more factory pull requests are already open and unmerged, the run does steps 1–4 only (brief and backlog, no film) and says so in the pull request. The factory must not outrun its reviewer.

## The steps

1. **Read first.** This file, `CLAUDE.md`, `factory/backlog.md`, the three most recent briefs, and `films.js`. Know what already exists.
2. **Research.** Search the web for what is new in AI and software, and for what day-to-day people struggle with that a small app could help. Five to eight searches. Prefer primary sources (vendor documentation, standards pages, release notes) over round-ups. Note the date of every source.
3. **Write the brief.** Use the format below. Separate what has shipped from what is forecast. Say plainly when a source is a vendor talking about itself.
4. **Update the backlog.** Add new candidate concepts, re-score old ones if something changed, and move the chosen one to "Built".
5. **Pick one.** Take the three highest-scoring concepts that are not already built. If the `decide` tool from the decision maker is available and `decider_status` says the model answers, ask it to choose between them: pass the three backlog rows and the brief's "What this means for small apps" as context, the five scoring questions as criteria, and `samples: 3`. Build its choice, and record the full answer in the brief under "The decision". If you believe its choice breaks a rule in this file, build the highest-scoring concept instead and say why in the pull request. If the tool is not available or makes no decision, pick the highest total score; on a tie, the one that needs the least explaining to a non-technical person. Say in the brief which way the choice was made.
6. **Build it** in `films/YYYY-MM-DD-slug/`, following "What makes a good film".
7. **Check it.** Open it in a browser at phone width, in English and Hebrew. Walk the whole flow. Reload it offline if it has a service worker. Look at a screenshot before calling it done.
8. **List it.** Add the entry at the top of `films.js` with `folder: 'YYYY-MM-DD-slug'`.
9. **Scan.** No secrets, no keys, no real customer or bank names, no real people's personal details.
10. **Open the pull request** from branch `factory/YYYY-MM-DD-slug` to `main`. Title: `Film N: Name`. Say what trend it came from, what was checked, and what was not. Do not merge it.

## What makes a good film

A film is for a day-to-day adult who is not technical, on a phone.

- **One job.** A person can say what it does in one sentence, and finish the job in under five minutes.
- **Shows one concept from the brief.** The film exists to try a current idea in a small, honest form.
- **Works with nothing set up.** No account, no key, no install. If it can use an AI model, it also has a clearly labelled sample path that works without one.
- **Private.** No backend, no cookies, no analytics, no ads, no tracking. Anything stored stays in the browser. If a model is used, prefer one that runs on the person's own device, then the person's own model server. Never a key of ours.
- **Honest.** Made-up content is labelled as made up. Nothing is presented as real demand, real people, or professional advice.
- **Plain.** No jargon in the interface. English and Hebrew, with Hebrew right-to-left.
- **Calm.** One filled button per screen, tap targets at least 48px, no looping motion, no nagging.
- **Static.** HTML, CSS and JavaScript. No framework, no build step, no `package.json`.
- **Self-contained.** Everything it needs is inside its own folder, with relative links.
- **Does not collide.** All films share one web address, so each uses its own prefix: storage keys `soya-<slug>-…`, service worker cache `<slug>-YYYYMMDDHHMMSS`, service worker scope its own folder.
- **Looks like a Soya film.** Same colour tokens, fonts and footer credit ("A Soya Productions film") as the front page.

## What the factory does not build

- A copy of an existing product, brand, character or game.
- Anything that gives medical, legal or financial advice as if from a professional.
- Anything that collects personal details about real people, or sends a person's text to a server of ours.
- Anything that needs a paid service or a key from us to work.
- Anything that cannot be finished and checked in one run. Make it smaller instead.

## Scoring a concept

Each from 1 (poor) to 5 (strong). Add them up.

| Score | Question |
|---|---|
| Person | Would a non-technical adult understand why they want it? |
| Trend | Does it try a concept from a recent brief in a real way? |
| Size | Can it be built and checked in one run? |
| Fresh | Is it different from the films already made? |
| Private | Does it work with nothing leaving the device? |

## Brief format

```
# Trend brief — YYYY-MM-DD

## In one paragraph
## What has shipped
## What is forecast or claimed
## What this means for small apps
## Concepts worth a film
## The decision
## Sources
```

Every claim in the brief has a source with a link and a date. If the search found nothing recent on a topic, say so.

## The decision maker

`factory/decision-maker/` is a small MCP server that asks Ran's own self-hosted model to choose between options. It is a second voice, not the boss: it sees only what it is given, and a small model can be confidently wrong. Use it for choices between a few clear options (which concept, which of two names, which of two layouts). Do not use it for facts, for anything involving a person's private details, or to overrule a rule in this file. See its `README.md`.

## Changing the factory

Ran changes these rules. A run may propose a change to this file in its pull request description, but does not edit the rules itself.
