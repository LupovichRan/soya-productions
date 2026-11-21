# Soya Market Radar

App 11 of Soycatory, asked for by Ran on 21 November 2026: stock and bourse research that reads the news, X, Telegram, Discord, official and unofficial sites and financial reports, finds hidden gems and tells him about them.

## What it does

1. **Radar.** Research notes from Ran's weekday scan, newest first. Each note gives the ticker, the price on the day it was found, what happened, why it might be overlooked, the main risk, what would prove it wrong, the evidence marked fact, inference or assumption, and sources with tuna ratings. Notes are followed for 90 days, so misses stay visible as well as hits.
2. **Check a tip.** Paste a message from Telegram, X, Discord or WhatsApp. The app looks for the usual warning signs of a pump (promises, rushing, huge gains, "insider" claims, requests for money, private group links, no source, shouting) on the device only, then gives links to the filings, the quote and the news for each `$TICKER`, and four questions to ask. Nothing is sent.
3. **My watch list.** Tickers with quick links, kept only on the device.
4. **How Soya picks.** The rules every note must pass.

## Ranks, crowding and honesty about speed

1. Every note gets a place on Soya's snack ladder: 1 fish bone, 2 fish stick, 3 sardines, 4 tuna can, 5 golden tuna. It says how well the idea passed the checks, never how much it might rise. Source trust stays separate (1 to 5 tuna fish).
2. `crowd` says how many people already talk about it (quiet, some, crowded). A crowded idea can never rank above fish stick; the database enforces this.
3. The app says plainly that readers have no head start: funds and fast traders read the same public filings first.

## Calm by design

1. A four-line terms screen must be accepted once (`soya-radar-terms-1`), and the full terms and disclaimers (Israeli investment advice law, no SEC registration, no guarantees, AI may err, no edge, risk, conflicts, no liability) are one tap away on every screen.
2. Two tabs at first. My list appears from the second visit, or after a checked tip or an opened note, with a one-time hint.
3. Notes show only rank, name, one line and crowding; the rest opens with "More". Closed notes fold under "Past notes". The terms are not legal advice; a lawyer should review them before wide promotion.

## Data and privacy

1. Notes live in the Supabase table `mr_items` (project after-demo-day). The publishable key in `config.js` can only read rows marked `published`; it cannot add, change or delete anything. The scan writes them with the owner's access, outside the app.
2. Stored on the device: `soya-radar-lang`, `soya-radar-terms-1`, `soya-radar-visits`, `soya-radar-unlock`, `soya-radar-hint`, `soya-radar-watch` and `soya-radar-cache` (the last copy of the notes, for offline use). The app counts nothing and sends nothing.
3. Research notes, not investment advice. No buy or sell calls and no price targets. Written with Claude, which Anthropic makes.

## Files

`index.html`, `styles.css`, `app.js`, `config.js`, `sw.js` (bump `VERSION`, prefix `soyaradar-`, whenever a cached file changes), `manifest.webmanifest`, `icons/`, `assets/`.
