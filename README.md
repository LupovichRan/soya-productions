# Soya Productions

The front page for the Soya Productions films: small, calm web apps built one at a time as daily POCs. Each film lives in its own repository (`soya-poc-YYYY-MM-DD-slug`) and is published on its own GitHub Pages address. This page lists them, newest first.

No accounts, no ads, no tracking. English and Hebrew.

## Add a film

Open `films.js`, copy an entry, put it at the top, and fill it in:

```js
{
  number: 2,
  date: '2026-11-21',
  path: 'soya-poc-2026-11-21-slug',   // the repository name
  mascot: 'owl',                       // cat, fox, owl, bear, rabbit or frog
  en: { title: 'Name', line: 'One plain sentence about what it does.' },
  he: { title: 'שם', line: 'משפט פשוט אחד על מה שזה עושה.' }
}
```

The newest film becomes "Now showing"; the rest move to "Earlier films". The link is `../{path}/`, which works because every film is published next to this page on the same host. Use `url` instead of `path` for a film hosted somewhere else.

## Run it

No build step:

```
python3 -m http.server 8080
```

## For each new film

All the sites share one address (`lupovichran.github.io`), so they also share browser storage and offline caches. Give every film its own prefix for storage keys and for its service worker cache name (Roundtable uses `soya-roundtable-` and `roundtable-`), and keep its service worker scope to its own folder.

## License

MIT. See `LICENSE`.
