# Lessons from annabelle-games: metrics, bug reports and dashboards

Source: Ran's repository LupovichRan/annabelle-games (`telemetry.js`, `feedback.js`, `playtime.js`, `docs/TELEMETRY.md`, `docs/CALM-UI.md`), read on 2026-11-21, and its Supabase project `kids-games-telemetry`, read-only (table and view definitions, access rules and row counts; no rows about any child were read).

## How annabelle-games does it

1. **One small database that the site can only write to.** Three tables (`events`, `audit`, `reports`) in a Supabase project. The site uses the public publishable key, and row-level security allows INSERT only. Nobody on the web can read anything back; Ran reads it in the Supabase dashboard. Nothing has to be deployed by hand, unlike our Google Apps Script receiver, which is still not deployed.
2. **Three kinds of rows, each with a clear job.** Events are usage (page view, game start, level, game end, error, time on page). Audit is "who did what" in the parent panel. Reports are bug, idea and fix requests from the 🐞 button.
3. **A fixed list of columns on every event.** Anonymous child id, device id, session id, type, page, game, age, gender, language, app version (the service-worker cache name) and environment, plus a small `data` object. Questions are answered with SQL over these columns.
4. **Privacy rules written down and enforced in code.** The child's name never leaves the device and is scrubbed from error texts and screenshots. No typed text except in the report box, no room codes, no URL secrets. A parent can switch all of it off in the parent panel, with a PIN.
5. **Real players separated from tests.** Every row carries `env`: `prod`, `qa` (an automated browser, or a phone switched with `?qa=1`) or `dev` (localhost). Views `events_real`, `reports_real` and `audit_real` keep only `prod` rows from devices not listed in `test_devices`.
6. **Ready-made views for the dashboard.** `stats_daily` (children, sessions, game starts and ends, errors per day), `stats_games` (starts, children, average seconds, errors, last seen), `stats_kids` (per anonymous child), `stats_learning` (answers, percent correct and average time per skill).
7. **Bug reports that can be reproduced.** The report carries the last 80 actions before the dialog opened (page, tap, key, reward, error, network step), the page's own state, the app version, an optional screenshot (with the name blanked) and an optional voice note of up to 20 seconds. Each report gets a short number the child sees, and a status column (`new`, `seen`, `planned`, `done`, `rejected`) with a note for the owner.
8. **Sent in batches and never lost.** Events go about every 10 seconds and when the page is left, at most 120 per page view; offline rows wait in the browser (at most 200), and a report stays saved until the server confirms it.
9. **Diagnostics for the hard parts.** Online two-player games log every connection stage with fixed words and small numbers only, so a failed match shows where it stopped, without any room code or address.
10. **The calm interface rules.** At most five main choices per screen, one filled button, one accent colour, and a calm mode where nothing moves. The 🐞 button is small, half transparent and can be dragged anywhere.

## What we found while reading (for Ran)

1. **The dashboards count mostly test traffic.** The four `stats_*` views read the raw `events` table, not `events_real`. Of 3,614 event rows so far, 2,806 are `qa` (668 test devices) and 808 are real (`prod`, 15 devices). So `stats_daily` and the others show about 4.5 times the real activity. The fix is to point the four views at `events_real`. Not changed: it is Ran's other project, and he did not ask for a change there.
2. **Access is safe.** The tables have row-level security with INSERT-only rules for the public key. The `stats_*` views are visible to the public key but run with the caller's rights, so the public key sees no rows through them.

## What Soycatory takes

1. **Write-only collection with no hand deployment.** Use the same pattern (a few insert-only tables with the publishable key) instead of waiting for the Apps Script receiver. This needs Ran's yes first: he declined a Supabase waitlist on 2026-11-20, and Soya News is for children, so nothing is turned on without his explicit go-ahead.
2. **`env` on every row, and `_real` views,** so the factory's own Playwright tests never count as readers.
3. **The app version on every row** (the service-worker cache name, which we already bump on every change), so a bug report says which version it came from.
4. **A report number the reader sees,** and a status and owner note on each report, so Ran can answer "it is fixed in version X".
5. **A short reproduction trail in bug reports** (the last few taps and pages, never typed text), for the mouse button in Soya News.
6. **Ready-made views as the dashboard:** per day (readers, sessions, stories opened, quiz answers, errors), per story (opened, read aloud, quiz right rate, paw rating), and per week's issue.
7. **A switch to turn it off,** placed with the other grown-up settings, plus the browser's Do Not Track and Global Privacy Control as today.

## What Soycatory keeps different

1. **No age, gender or child id in Soya News.** The reader's age level (five bands) is enough to know which level helps. No device id is stored; a random number for one visit stays in memory only, as the site rules already say.
2. **No screenshots or voice notes** in the first version: a child's screen can show more than we need.
3. **Nothing in the background without a visible note,** as today: each page that counts says what it counts.
