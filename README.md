# Soycatory

*The Soya Software Factory.*

A small software factory, and the front page for what it makes. On a schedule, a run reads current trends in AI and software, turns the most useful concept into a small, calm web app (a "app"), and opens a pull request for Ran to review. This page lists the apps, newest first.

- [factory/FACTORY.md](factory/FACTORY.md) — how a run works and what makes a good app.
- [factory/trends/](factory/trends/) — one trend brief per run.
- [factory/backlog.md](factory/backlog.md) — scored concepts waiting to be built.
- [apps/](apps/) — the apps the factory has made.
- [docs/HOSTING.md](docs/HOSTING.md) — where things run, build-or-borrow decisions, checks on every change, security.
- [factory/decision-maker/](factory/decision-maker/) — POC 2: lets Claude ask your own self-hosted model to make a choice.

No accounts, no ads, no tracking. English and Hebrew.

## Add an app

Open `apps.js`, copy an entry, put it at the top, and fill it in:

```js
{
  number: 2,
  date: '2026-11-21',
  folder: '2026-11-21-slug',           // the folder under apps/
  mascot: 'owl',                       // cat, fox, owl, bear, rabbit or frog
  en: { title: 'Name', line: 'One plain sentence about what it does.' },
  he: { title: 'שם', line: 'משפט פשוט אחד על מה שזה עושה.' }
}
```

The newest app becomes "Now showing"; the rest move to "Earlier apps". Use `path: 'repository-name'` instead for an app in its own repository published next to this site (as Roundtable is), or `url` for an app hosted somewhere else.

## Run it

No build step:

```
python3 -m http.server 8080
```

## For each new app

All the sites share one address (`lupovichran.github.io`), so they also share browser storage and offline caches. Give every app its own prefix for storage keys and for its service worker cache name (Roundtable uses `soya-roundtable-` and `roundtable-`), and keep its service worker scope to its own folder.

## License

MIT. See `LICENSE`.
