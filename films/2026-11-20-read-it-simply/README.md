# Read It Simply

*A Soya Productions film.* Film 2, 20 November 2026.

Paste a confusing letter or official message. See what it asks you to do, the dates in it, the amounts of money, and who to contact. English and Hebrew.

It is a reading aid, not advice, and it says so on every result.

## Two readings

| | When | Label in the app |
|---|---|---|
| Simple reading | Always available, and always used for Hebrew | "Simple reading — no AI used" |
| Fuller reading | The browser has a built-in AI model (desktop Chrome today, English only) | "Read on your device by your browser's built-in AI" |

The simple reading is pattern matching (`reader.js`). Everything it shows is quoted word for word from the letter.

With the built-in model, a short plain-language summary and a list of what is asked are added, plus anything the letter leaves vague. Those parts are marked "Written by AI. It can be wrong". Dates, amounts and contacts still come word for word from the letter, never from the model. If the model would need a download first, the app offers it and never starts it unasked. If the model fails, the app says so and shows the simple reading.

## Privacy

The letter never leaves the device and is never saved, not even in the browser. The only thing stored is the language choice (`soya-readsimply-lang`). No account, no ads, no tracking, no server.

## Files

```
index.html   reader.js   app.js   styles.css   sw.js   manifest.webmanifest
reader.test.js           tests for the simple reading
icons/  assets/
```

After changing a cached file, bump `VERSION` in `sw.js` (`readsimply-YYYYMMDDHHMMSS`).

## Checked, and not

Checked in a phone-sized browser: the whole flow in English and Hebrew, that pasted markup is not rendered, that nothing is stored, offline reopening, and the built-in AI paths (ready, needs a download, fails) using a stand-in for the browser's model.

Not checked: a real browser with a real built-in model. The automated browser used for testing does not have one, so the quality of the fuller reading is unknown.
