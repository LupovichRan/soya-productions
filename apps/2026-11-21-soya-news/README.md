# Soya News

A weekly AI newspaper for curious kids. Soya the cat reporter tells each story at the reader's age, from 6 to 26, in English, Hebrew or French. Each story has a word of the week, a short quiz and a link to its source.

- **Ages.** A slider from 6 to 26 picks one of four levels: Kitten (6–8), Explorer (9–12), Teen (13–17), Big kid (18–26). The facts are the same at every level; only how they are told changes.
- **Soya's mood.** Curious, Silly or Calm changes how Soya greets you and reacts to each story. It never changes the facts.
- **Dark theme only**, cartoon drawings made from simple shapes, one filled button (the alert button), tap targets at least 48px, no looping motion.

## Adding an issue

Put a new issue at the top of `issues.json` (same shape as the existing one: `id` is the date, `week`, `headline`, and five `stories`, each with `title`, four `levels`, a `word`, a `quiz` and a `source`). Write all three languages; Soya is male in Hebrew (סויה הוא, מסביר) and in French (il). Mark anything that has only one secondary source as reported. Then bump `VERSION` in `sw.js`.

## What it stores and sends

Stored on the device only (`localStorage`, prefix `soya-news-`): language, age, mood, nickname, the last issue seen, quiz answers. Nothing is counted.

The only thing that can leave the device is a topic idea a reader types and chooses to send: no name, no email, and the form says not to write a name, school or where you live. It goes to the Soycatory receiver (`../../waitlist.js`, tab `soya-news requests`) and only when that address is set. Until then the form says the idea box opens soon.

## New-issue alerts

Soycatory runs no server, so there is no real push yet. Where the browser supports periodic background sync (an installed app on Chrome or Edge), the service worker checks `issues.json` about once a day and shows a notification when the newest issue changes. Everywhere else, the app shows "A new issue is out!" when it is opened. The service worker already handles `push` events, so real push needs only a sending service and its keys later; the keys must never go in this repository.
