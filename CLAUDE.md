# Soycatory — rules for working in this repository

This repository is Soycatory, the Soya Software Factory, and its front page. The product is the factory, not a studio: it makes small apps, and it is never described as a film or movie company. The front page lists the apps (small web apps) for day-to-day people who are not technical. The factory makes new ones.

- **Factory runs follow `factory/FACTORY.md` exactly.** Read it first. A run opens a pull request and never merges it.
- `factory/decision-maker/` is a Node tool, not an app: no dependencies, no `package.json`. Check it with `node --test factory/decision-maker/server.test.mjs`.
- Apps made here live in `apps/YYYY-MM-DD-slug/`, each self-contained, with its own storage-key and cache-name prefix.

- Vanilla HTML, CSS and JavaScript. No framework, no build step, no backend, no cookies, no analytics, no ads, no tracking.
- **One narrow exception, asked for by Ran on 2026-11-20:** `videos.html` may count how far each video is watched (play, each quarter, finish, pause, where the viewer leaves) and take comments tied to a moment in the video. It sends only if `waitlist.js` has a receiver address; it uses no cookies and stores nothing in the browser (a random number made for one visit lives in memory only); it sends nothing to anyone whose browser sends Do Not Track or Global Privacy Control; and the page tells viewers what is counted. Nothing else on the site is measured.
- The waiting-list and request forms on a one-pager send only what the person types, only with the receiver address set, and a waiting-list email needs a ticked consent box.
- The list of apps is `apps.js`, newest first. Adding an app is one entry there, with English and Hebrew text.
- Interface strings live in `I18N` in `app.js`, in English and Hebrew. Hebrew is right-to-left.
- Only the language choice is stored: `localStorage` key `soycatory-lang`.
- One filled button on the page (open the newest app). Tap targets at least 48px. No looping motion. Plain words, no jargon.
- Same colour tokens as the apps; see `styles.css`.
- Before every push: scan for secrets and for real customer or bank names.
- Merge to `main` only through an approved pull request. Do not force-push. Only Ran creates tags and releases.
