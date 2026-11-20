# Soya Productions front page — rules for working in this repository

This page lists the Soya Productions films (daily POCs) for day-to-day people who are not technical.

- Vanilla HTML, CSS and JavaScript. No framework, no build step, no backend, no cookies, no analytics, no ads, no tracking.
- The list of films is `films.js`, newest first. Adding a film is one entry there, with English and Hebrew text.
- Interface strings live in `I18N` in `app.js`, in English and Hebrew. Hebrew is right-to-left.
- Only the language choice is stored: `localStorage` key `soya-productions-lang`.
- One filled button on the page (open the newest film). Tap targets at least 48px. No looping motion. Plain words, no jargon.
- Same colour tokens as the films; see `styles.css`.
- Before every push: scan for secrets and for real customer or bank names.
- Merge to `main` only through an approved pull request. Do not force-push. Only Ran creates tags and releases.
