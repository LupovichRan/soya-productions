# Soya News

Soya the cat explains the world to kids, truthfully and in plain words, and to their grown-ups too. Each story is told at the reader's level, from 6 to 66, in English, Hebrew or French, with a word of the week, a short quiz, a paw rating and a link to its source. Made by Ran Lupovich, proud father of a smart 9-year-old.

- **Ages.** A slider from 6 to 66 picks one of five levels, each with its own Soya pose: Kitten 6–8 (bell), Curious cat 9–12 (wide eyes), Cool cat 13–17 (glasses), Top cat 18–25 (crown), Cat owner 26–66. The facts are the same at every level; only how they are told changes. At Cat owner level each story adds a question to ask your kid.
- **Soya's drawing** comes from Ran's annabelle-games (`soya.html`): the same fluffy black cat with green eyes, saved as still SVG poses in `assets/soya-*.svg` with the tail wag turned off (no looping motion).
- **Soya's mood.** Curious, Silly or Calm changes how Soya greets you and reacts to each story. It never changes the facts.
- **Dark theme only**, cartoon drawings made from simple shapes, one filled button (the alert button), tap targets at least 48px, no looping motion.

## Adding an issue

Put a new issue at the top of `issues.json` (same shape as the existing one: `id` is the date, `week`, `headline`, and five `stories`, each with `title`, five `levels` (`cub`, `explorer`, `teen`, `grown`, `owner`), a `talk` question for parents, a `word`, a `quiz` and a `source`). Write all three languages; Soya is male in Hebrew (סויה הוא, מסביר) and in French (il). Mark anything that has only one secondary source as reported. Then bump `VERSION` in `sw.js`.

## What it stores and sends

Stored on the device only (`localStorage`, prefix `soya-news-`): language, age, mood, nickname, the last issue seen, quiz answers, paw ratings. Nothing is counted in the background.

Only what a reader chooses to send leaves the device, and only when the Soycatory receiver address is set (`../../waitlist.js`):
- a topic idea (tab `soya-news requests`), no name or email;
- a paw rating, 1 to 5, with the story, the issue and the age level (tab `soya-news ratings`);
- a bug report (tab `soya-news bugs`) with the app version, language and age level, which the form says it adds.
The forms say not to write a name, school or where you live. Grown-ups can also report problems on GitHub.

## New-issue alerts

Soycatory runs no server, so there is no real push yet. Where the browser supports periodic background sync (an installed app on Chrome or Edge), the service worker checks `issues.json` about once a day and shows a notification when the newest issue changes. Everywhere else, the app shows "A new issue is out!" when it is opened. The service worker already handles `push` events, so real push needs only a sending service and its keys later; the keys must never go in this repository.
