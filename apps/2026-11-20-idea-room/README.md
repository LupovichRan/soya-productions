# Idea Room

*Made by Soycatory.* App 5, 20 November 2026. English and Hebrew. **Alpha proof of concept.**

Bring an idea and test it for two weeks. People show whether they want it with small real acts, not likes. Backing earns a seat in surveys, and work the owner accepts earns a louder voice. At day 14 the numbers suggest carry on, change direction or stop, and the owner decides. It is the open-idea-factory concept in `factory/concepts/open-idea-factory.md`, cut down to what a static app can honestly do.

## What the alpha does

| Part | What it does |
|---|---|
| **Ideas** | A list of ideas with the day of the test and the score so far. Two labelled examples, plus your own (up to 12). |
| **Idea** | The problem, the promise, the day, and a score against 20. |
| **Join in** | Five acts to record, each once, each with a weight (follow 1, want 2, tell someone 3, give an hour 4, take a short call 5). A free seat. **Trust points** (given only by the owner). A survey, counted at your voice (1 with a seat, plus 1 for every 3 trust points, up to 4). |
| **Roadmap** | Every suggestion gets an answer: the owner accepts it, or says **Not now** with a short reason. Someone takes accepted work and the owner accepts it as finished. The page shows how many suggestions have been answered. For a suggestion or work they accepted, the owner can give 1 to 5 trust points (at most 5 for any one item). |
| **Verdict** | The score by act, what the numbers suggest, and the owner's decision. Demo buttons skip days. |

The "Viewing as Owner / Visitor" switch stands in for two different people on one device.

## Trust points, in plain words
Trust is how an owner says "you made this idea better". Only the owner gives it, only for something of yours they accepted, never for turning up, and never in exchange for money. Three trust points add one to your voice, up to four. It is not equity and nothing here promises a share of an idea.

## Shared ideas and the live numbers

When you make an idea you choose where it lives: **on this device only** (the default) or **shared with everyone in this alpha**. Shared ideas, acts, seats, suggestions, answers, votes and trust points are kept in a small Supabase database (`infra/supabase/idea-room.sql`), so two people on two phones see each other's changes. `dashboard.html` shows the totals live and refreshes every ten seconds.

How it stays safe, in plain words: the address and key in `config.js` are a publishable key, meant to be public. With it, the app can only call ten functions; it cannot read or change any table. Each function checks who is asking (a random device id kept in the browser) and what is allowed: only the owner can accept, decline, give trust, accept work or decide; only someone with a seat can vote; the survey is set once; a decision waits for day 14; there are caps on ideas, suggestions and sizes. A device is a browser, not a verified person, so someone determined can make many; the numbers show activity, not proven demand. Shared ideas are public: do not put private details in them.

## What it does not do, on purpose

- **No invented demand.** A new idea starts at 0. Only what this device recorded counts. Examples carry made-up numbers and say **Example**.
- **No proof of people yet.** Ideas kept on this device are one person. Shared ideas count browsers, not verified people, and there is no sign-in, moderation or report button. Real demand needs real sign-in, which is a decision for Ran (see the concept note).
- **No money and no ownership.** Backing is a pledge of time. Voice is not equity, and nothing here promises a share of an idea.

## What is kept, and where

Ideas are kept in this browser (`localStorage`, key `soya-idearoom-ideas`, up to 12 ideas) and the language in `soya-idearoom-lang`. Ideas kept on the device never leave it. Only ideas you choose to share are sent to the shared service, with a random device id. No account, no ads, no tracking. Stored data is treated as untrusted when read back: malformed entries are dropped and limits applied again. If the browser will not store, the app says so and still works until the page closes.

## Files

`index.html`, `styles.css`, `room.js` (logic, tested), `remote.js` and `config.js` (the shared service), `dashboard.html` and `dashboard.js` (live numbers), `app.js` (screens and text in English and Hebrew), `sw.js` (offline; cache `idearoom-…`), `manifest.webmanifest`, `icons/`, `assets/`. Check with `node --test apps/2026-11-20-idea-room/room.test.js`.
