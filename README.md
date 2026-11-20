# Soya Productions

A small software factory, and the front page for what it makes. On a schedule, a run reads current trends in AI and software, turns the most useful concept into a small, calm web app (a "film"), and opens a pull request for Ran to review. This page lists the films, newest first.

- [factory/FACTORY.md](factory/FACTORY.md) — how a run works and what makes a good film.
- [factory/trends/](factory/trends/) — one trend brief per run.
- [factory/backlog.md](factory/backlog.md) — scored concepts waiting to be built.
- [films/](films/) — the films the factory has made.

No accounts, no ads, no tracking. English and Hebrew.

## Add a film

Open `films.js`, copy an entry, put it at the top, and fill it in:

```js
{
  number: 2,
  date: '2026-11-21',
  folder: '2026-11-21-slug',           // the folder under films/
  mascot: 'owl',                       // cat, fox, owl, bear, rabbit or frog
  en: { title: 'Name', line: 'One plain sentence about what it does.' },
  he: { title: 'שם', line: 'משפט פשוט אחד על מה שזה עושה.' }
}
```

The newest film becomes "Now showing"; the rest move to "Earlier films". Use `path: 'repository-name'` instead for a film in its own repository published next to this site (as Roundtable is), or `url` for a film hosted somewhere else.

## Run it

No build step:

```
python3 -m http.server 8080
```

## For each new film

All the sites share one address (`lupovichran.github.io`), so they also share browser storage and offline caches. Give every film its own prefix for storage keys and for its service worker cache name (Roundtable uses `soya-roundtable-` and `roundtable-`), and keep its service worker scope to its own folder.

## License

MIT. See `LICENSE`.
