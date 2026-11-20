# Idea Room

*Made by Soycatory.* App 5, 20 November 2026. English and Hebrew. **Alpha proof of concept.**

Bring an idea and test it for two weeks. People show whether they want it with small real acts, not likes. Backing earns a seat in surveys, and work the owner accepts earns a louder voice. At day 14 the numbers suggest carry on, change direction or stop, and the owner decides. It is the open-idea-factory concept in `factory/concepts/open-idea-factory.md`, cut down to what a static app can honestly do.

## What the alpha does

| Part | What it does |
|---|---|
| **Ideas** | A list of ideas with the day of the test and the score so far. Two labelled examples, plus your own (up to 12). |
| **Idea** | The problem, the promise, the day, and a score against 20. |
| **Join in** | Five acts to record, each once, each with a weight (follow 1, want 2, tell someone 3, give an hour 4, take a short call 5). A free seat. A survey, counted at your voice (1 with a seat, up to 4). |
| **Roadmap** | Anyone suggests, the owner accepts, someone takes it, the owner accepts the finished work. Accepted work raises your voice. |
| **Verdict** | The score by act, what the numbers suggest, and the owner's decision. Demo buttons skip days. |

The "Viewing as Owner / Visitor" switch stands in for two different people on one device.

## What it does not do, on purpose

- **No invented demand.** A new idea starts at 0. Only what this device recorded counts. Examples carry made-up numbers and say **Example**.
- **No server, so no crowd yet.** One device is one person, so this shows how it works; it cannot measure real demand. That needs sign-in and shared storage, which is a decision for Ran (see the concept note).
- **No money and no ownership.** Backing is a pledge of time. Voice is not equity, and nothing here promises a share of an idea.

## What is kept, and where

Ideas are kept in this browser (`localStorage`, key `soya-idearoom-ideas`, up to 12 ideas) and the language in `soya-idearoom-lang`. Nothing leaves the device. No account, no ads, no tracking. Stored data is treated as untrusted when read back: malformed entries are dropped and limits applied again. If the browser will not store, the app says so and still works until the page closes.

## Files

`index.html`, `styles.css`, `room.js` (logic, tested), `app.js` (screens and text in English and Hebrew), `sw.js` (offline; cache `idearoom-…`), `manifest.webmanifest`, `icons/`, `assets/`. Check with `node --test apps/2026-11-20-idea-room/room.test.js`.
