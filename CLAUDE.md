# Soycatory — rules for working in this repository

This repository is Soycatory, the Soya Software Factory, and its front page. The product is the factory, not a studio: it makes small apps, and it is never described as a film or movie company. The front page lists the apps (small web apps) for day-to-day people who are not technical. The factory makes new ones.

1. **Factory runs follow `factory/FACTORY.md` exactly.** Read it first. A run opens a pull request and never merges it.
2. `factory/decision-maker/` is a Node tool, not an app: no dependencies, no `package.json`. Check it with `node --test factory/decision-maker/server.test.mjs`.
3. Apps made here live in `apps/YYYY-MM-DD-slug/`, each self-contained, with its own storage-key and cache-name prefix.

4. Vanilla HTML, CSS and JavaScript. No framework, no build step, no backend, no cookies, no analytics, no ads, no tracking.
5. **One narrow exception, asked for by Ran on 2026-11-20:** `videos.html` may count how far each video is watched (play, each quarter, finish, pause, where the viewer leaves) and take comments tied to a moment in the video. It sends only if `waitlist.js` has a receiver address; it uses no cookies and stores nothing in the browser (a random number made for one visit lives in memory only); it sends nothing to anyone whose browser sends Do Not Track or Global Privacy Control; and the page tells viewers what is counted. **Extended by Ran on 2026-11-21:** `newsletter.html` may count, under exactly the same rules, which items are opened with "Read more", which sources are opened, Yes/No answers, and how far down the page a reader gets, and take topic requests. Nothing else on the site is measured.
6. The waiting-list and request forms on a one-pager send only what the person types, only with the receiver address set, and a waiting-list email needs a ticked consent box.
7. Soya News (`apps/2026-11-21-soya-news/`) counts nothing in the background. Its topic box, paw ratings and bug reports send only what the reader chooses, with no name or email, and only with the receiver address set.
8. The list of apps is `apps.js`, newest first. Adding an app is one entry there, with English and Hebrew text.
9. Interface strings live in `I18N` in `app.js`, in English and Hebrew. Hebrew is right-to-left.
10. Only the language choice is stored: `localStorage` key `soycatory-lang`.
11. One filled button on the page (open the newest app). Tap targets at least 48px. No looping motion, with one exception Ran asked for on 2026-11-21: live Soya in Soya News (`soya-live.js`, and the three.js stage in `soya-3d.js` with its library stored in `vendor/`) may walk, blink, wag, smile, orbit, throw confetti and move his mouth while reading aloud; he sits still for anyone whose device asks for reduced motion, and readers can switch him to Calm. Plain words, no jargon.
12. **Writing rule from Ran (2026-11-21), for every bot and run:** never use bullet points, in emails, reports, pull requests, posts, docs or app text. Use numbered lists (1. 2. 3.) or plain sentences. In HTML use `<ol>`, never `<ul>`.
13. Same colour tokens as the apps; see `styles.css`.
14. Before every push: scan for secrets and for real customer or bank names.
15. Merge to `main` only through an approved pull request. Do not force-push. Only Ran creates tags and releases.
