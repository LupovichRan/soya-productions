# Plain Steps

*Made by Soyactory.* App 4, 20 November 2026. English and Hebrew.

Make a short routine for something you do again and again, and tick it off one small step at a time. Leaving the house, a morning, closing down the kitchen, the weekly shop. Big tick boxes, one calm progress line, no streaks, no points, no nagging.

## How a routine gets made

| | When | Label in the app |
|---|---|---|
| **Start from an example** | Always. Four examples in each language, each editable | none needed: they are the person's to change |
| **Write the steps yourself** | Always. One step on each line; bullets and numbers are ignored | none |
| **Ask the browser's AI to suggest steps** | The browser has a built-in AI model (desktop Chrome today) and the name is in English | "Written by AI. It can be wrong or miss something that matters to you. Read it before you use it." |

The concept that chose this app was "describe a chore and get a short routine". Without an AI model that part is not automatic: the app gives examples and a box to write your own, and says so. With a model, it suggests the steps. A suggestion is only ever put in the steps box when the person asks, and they can edit it before saving.

The AI is offered, never started on its own. A model download is offered, never started unasked. The routine name is passed to the model as a title with an instruction not to follow anything inside it; the answer is cleaned and checked (2 to 10 steps) and shown as plain text. A Hebrew name is never sent to the English-only model. If it fails, the app says so and the editor stays.

## What is kept, and where

Routines and their ticks are kept in this browser (`localStorage`, key `soya-plainsteps-routines`, up to 20 routines of up to 30 steps) so that a routine is still there tomorrow. Nothing leaves the device. The language choice is the only other thing stored (`soya-plainsteps-lang`). No account, no ads, no tracking, no server.

Stored data is treated as untrusted when it is read back: anything that is not a well-formed routine is dropped, and limits are re-applied. If the browser refuses to store anything, the app says so and still works until the page is closed. Deleting a routine asks twice.

## Why this app

It was chosen by the decision maker: six runs on two models (Phi-3.5 mini and Qwen2.5 7B, three each) all put it first; see `factory/decisions/2026-11-20-small-choices.md`. Of the three apps made so far it is the only one that keeps something for the person between visits.

## Files

```
index.html   routines.js   app.js   styles.css   sw.js   manifest.webmanifest
routines.test.js           tests for the routine logic
icons/  assets/
```

After changing a cached file, bump `VERSION` in `sw.js` (`plainsteps-YYYYMMDDHHMMSS`).

## Checked, and not

Checked: 9 tests of the routine logic (parsing, limits, ticking, editing keeps ticks, no mutation, damaged storage, the examples in both languages). In a phone-sized browser, in both languages: 39 checks covering the whole flow, saving across a reload, completion, starting again, editing and deleting, validation, pasted markup not rendered, damaged and blocked storage, empty boxes in both directions, no sideways scroll, offline reopening, and the built-in AI paths (ready, needs a download, fails, Hebrew name, asks for a name first) using a stand-in for the browser's model.

Not checked: a real browser with a real built-in model, so the quality of suggested steps is unknown; a real phone; and the Hebrew examples by a Hebrew reader.
