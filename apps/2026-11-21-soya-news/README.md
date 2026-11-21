# Soya News

Soya the cat explains the world to kids, truthfully and in plain words, and to their grown-ups too. Each story is told at the reader's level, from 6 to 66, in English, Hebrew or French, with a word of the week, a short quiz, a paw rating and a link to its source. Made by Ran Lupovich, proud father of a smart 9-year-old.

1. **Ages.** A slider from 6 to 66 picks one of five levels, each with its own Soya pose: Kitten 6–8 (bell), Curious cat 9–12 (wide eyes), Cool cat 13–17 (glasses), Top cat 18–25 (crown), Cat owner 26–66. The facts are the same at every level; only how they are told changes. At Cat owner level each story adds a question to ask your kid.
2. **Soya's drawing** comes from Ran's annabelle-games (`soya.html`): the same fluffy black cat with green eyes, saved as still SVG poses in `assets/soya-*.svg` with the tail wag turned off (no looping motion).
3. **What's fact?** Each story has a button that shows every claim coloured by kind: Fact (mint, a tick in a circle: it is in a source you can open), Soya thinks (blue, an arrow in a diamond: worked out from the facts), A guess (orange, a question mark in a square: might be wrong). Colour and shape both carry the meaning, so it also works without colour. Each source is rated from 1 to 5 tuna fish for how far we trust it, with one line on why.
4. **חתול / חתולה.** The reader chooses Boy cat, Girl cat or Just a cat. Hebrew and French titles and the age question follow it (חתולה סקרנית, בת כמה את?; Minette curieuse). Soya himself stays male.
5. **Soya's mood.** Curious, Silly or Calm changes how Soya greets you and reacts to each story. It never changes the facts.
6. **Dark theme only**, cartoon drawings made from simple shapes, one filled button (the alert button), tap targets at least 48px, no looping motion.

## Live Soya

`soya-live.js` puts Soya at the bottom of the page. He walks in, sits, blinks every few seconds, looks around, smiles, and now and then walks to the other side. When a story comes into view he walks over and says his reaction; a right quiz answer gets a smile and a hop, a wrong one wide eyes. "Soya, read it to me" reads the story aloud in the reader's language with the browser's own voice (pitched a little higher and slower), with his mouth moving; tapping him while he reads stops it. On first load the story cards settle into place one by one, as if he arranged them. Ran asked for the motion on 2026-11-21: it is off for anyone whose device asks for reduced motion, and Settings has "Soya moves around: Yes / Calm". Taps go through the empty space around him.

"Big things, explained for small cats": the reader is the small cat. The reader chooses חתול or חתולה (a boy cat, a girl cat, or just a cat) for the Hebrew and French titles; Soya himself is always a male cat.

## The 3D stage

`soya-3d.js` (three.js 0.170, MIT licence, stored in `vendor/` so nothing is loaded from another site and it works offline) draws Soya's night-sky newsroom at the top: Soya sits on a round rug under twinkling stars while cartoon 3D objects for the week's stories orbit him (a chart with a coin, a chip, a globe with a ring, a phone with a paw, a picture with a name tag). He blinks, and the camera follows the finger a little. Tapping an object makes it jump and spin, Soya says wow, and the page goes to that story. A right quiz answer throws 3D confetti. It only draws while the stage is on screen and the tab is visible; for reduced motion or Calm it draws one still picture and no confetti; without WebGL the flat picture of Soya stays.

## Adding an issue

Put a new issue at the top of `issues.json` (same shape as the existing one: `id` is the date, `week`, `headline`, and five `stories`, each with `title`, five `levels` (`cub`, `explorer`, `teen`, `grown`, `owner`), a `talk` question for parents, a `word`, a `quiz`, `sources` (name, url, `tuna` 1 to 5, `why`) and `facts` (each with `kind` fact, inference or assumption, `text`, and `src`, the indexes of its sources)). Write all three languages; Soya is male in Hebrew (סויה הוא, מסביר) and in French (il). Mark anything that has only one secondary source as reported. Then bump `VERSION` in `sw.js`.

## What it stores and sends

Stored on the device only (`localStorage`, prefix `soya-news-`): language, age, mood, nickname, the last issue seen, quiz answers, paw ratings. Nothing is counted in the background.

Only what a reader chooses to send leaves the device, and only when the Soycatory receiver address is set (`../../waitlist.js`):
1. a topic idea (tab `soya-news requests`), no name or email;
2. a paw rating, 1 to 5, with the story, the issue and the age level (tab `soya-news ratings`);
3. a bug report (tab `soya-news bugs`) with the app version, language and age level, which the form says it adds.
The forms say not to write a name, school or where you live. Grown-ups can also report problems on GitHub.

## New-issue alerts

Soycatory runs no server, so there is no real push yet. Where the browser supports periodic background sync (an installed app on Chrome or Edge), the service worker checks `issues.json` about once a day and shows a notification when the newest issue changes. Everywhere else, the app shows "A new issue is out!" when it is opened. The service worker already handles `push` events, so real push needs only a sending service and its keys later; the keys must never go in this repository.
