# Cat Factory

*Made by Soycatory.* App 6, 20 November 2026. English and Hebrew. **A parody.**

Give the cats a job. They run a shift and hand you a silly report: what each of six cats did, what the other five were blocked by, a commit log, a version number, whether it ships, and four shift numbers (cat chaos, naps, cups on the floor, lines of "jjjj"). It makes fun of software teams, told by cats. Every screen with a report says it is a parody.

- **Same job, same report.** The report is made from the job and the shift number with a fixed recipe, not from chance, so a report can be shared and checked. "Another shift" changes the shift number and so the report.
- **No AI, no server, no jokes written on the fly.** The lines are written in advance, in English and in Hebrew, and mixed by a small, steady recipe (`cats.js`).
- **Nothing is stored** except the language choice (`soya-catfactory-lang`). Nothing leaves the device. No account, no ads, no tracking.
- **Copy the report** puts the whole report on the clipboard as plain text.

## Files

`index.html`, `styles.css`, `cats.js` (the recipe, tested), `app.js` (screens and text in both languages), `sw.js` (offline; cache `catfactory-…`), `manifest.webmanifest`, `icons/`, `assets/`. Check with `node --test apps/2026-11-20-cat-factory/cats.test.js`.
