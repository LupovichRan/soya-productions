# Soya Market Radar

App 11 of Soycatory, asked for by Ran on 21 November 2026: stock and bourse research that reads the news, X, Telegram, Discord, official and unofficial sites and financial reports, finds hidden gems and tells him about them.

## What it does

1. **Radar.** Research notes from Ran's weekday scan, newest first. Each note gives the ticker, the price on the day it was found, what happened, why it might be overlooked, the main risk, what would prove it wrong, the evidence marked fact, inference or assumption, and sources with tuna ratings. Notes are followed for 90 days, so misses stay visible as well as hits.
2. **Check a tip.** Paste a message from Telegram, X, Discord or WhatsApp. The app looks for the usual warning signs of a pump (promises, rushing, huge gains, "insider" claims, requests for money, private group links, no source, shouting) on the device only, then gives links to the filings, the quote and the news for each `$TICKER`, and four questions to ask. Nothing is sent.
3. **My watch list.** Tickers with quick links, kept only on the device.
4. **How Soya picks.** The rules every note must pass.

## Data and privacy

1. Notes live in the Supabase table `mr_items` (project after-demo-day). The publishable key in `config.js` can only read rows marked `published`; it cannot add, change or delete anything. The scan writes them with the owner's access, outside the app.
2. Stored on the device: `soya-radar-lang`, `soya-radar-tab`, `soya-radar-watch` and `soya-radar-cache` (the last copy of the notes, for offline use). The app counts nothing and sends nothing.
3. Research notes, not investment advice. No buy or sell calls and no price targets. Written with Claude, which Anthropic makes.

## Files

`index.html`, `styles.css`, `app.js`, `config.js`, `sw.js` (bump `VERSION`, prefix `soyaradar-`, whenever a cached file changes), `manifest.webmanifest`, `icons/`, `assets/`.
