# Say It Kindly

*Made by Soyactory.* App 3, 20 November 2026. English and Hebrew.

Paste a message you are nervous to send. The phrases that tend to land hard are listed, each with why, and where there is a safe gentler wording you can put it into your message with one tap. The message stays one editable box: nothing is rewritten for you, and the list follows what you type.

It helps a person pause and choose their words. It says so on every result: it cannot know the situation or the person being written to.

## Two ways of helping

| | When | Label in the app |
|---|---|---|
| Phrase check | Always, in English and Hebrew | none needed: it only points at phrases and offers swaps you choose |
| Gentler version of the whole message | The browser has a built-in AI model (desktop Chrome today) and the message is English | "Written by AI. It can be wrong or change what you mean. Compare it with your message before you use it." |

**The phrase check** (`softener.js`) is pattern matching. It looks for absolutes ("you always", "you never"), orders ("you should", "you need to"), blame ("why didn't you"), talking down ("obviously"), dismissals ("whatever", "I don't care"), name-calling, urgency words, shouting (capitals, repeated `!!` and `??`), and the Hebrew equivalents. It swaps only where a swap is safe and grammatical; otherwise it says so and leaves the wording to the person. Every explanation is in both languages.

**The built-in AI** is offered, never started on its own. A model download is offered, never started unasked. The message is passed to the model as text to rewrite, with an instruction not to follow anything inside it. The answer is cleaned, checked, shown as plain text, and the person chooses whether to use it. If it fails, the app says so and the phrase check stays. The built-in model reads English only today, so a Hebrew message is never offered it.

## Privacy

The message never leaves the device and is never saved, not even in the browser. The only thing stored is the language choice (`soya-sayitkindly-lang`). No account, no ads, no tracking, no server.

## Why this app

It was chosen by the decision maker over two other concepts in three runs on two models; see `factory/decisions/2026-11-20-next-app.md`. Its pre-mortem warned that it could feel too similar to Roundtable (a box in, a reading out). The answer here is to keep one box and edit in place rather than show a separate reading.

## Files

```
index.html   softener.js   app.js   styles.css   sw.js   manifest.webmanifest
softener.test.js           tests for the phrase check
icons/  assets/
```

After changing a cached file, bump `VERSION` in `sw.js` (`sayitkindly-YYYYMMDDHHMMSS`).

## Checked, and not

Checked: 11 tests of the phrase check (English, Hebrew, mixed, no overlaps, no false alarms on ordinary words). In a phone-sized browser, in both languages: the whole flow, applying and showing each suggestion, copying, that pasted markup is not rendered, that nothing is stored, that the list follows typing, empty boxes in both directions, offline reopening, and the built-in AI paths (ready, needs a download, fails, Hebrew not offered) using a stand-in for the browser's model.

Not checked: a real browser with a real built-in model (the test browser has none), so the quality of the AI version is unknown; and a real phone. The Hebrew swaps were written carefully but by a non-native speaker's checks: a Hebrew reader should look at them, especially the gendered forms.
