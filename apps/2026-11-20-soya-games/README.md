# Soya's Games

*Made by Soycatory.* App 7, 20 November 2026. English and Hebrew. For young children to play with a grown-up beside them.

Three small games with the six Soycatory animals:

| Game | What the child does |
|---|---|
| **Match the pairs** | Turns over two cards at a time and looks for animals that match. Three levels: 3, 4 or 6 pairs. A wrong pair turns back over after a moment, or at the next tap. |
| **Count the fish** | Counts the fish (1 to 9) and taps the right number out of three. A wrong answer says "Not quite. Try again." and nothing is taken away. |
| **Find the odd one** | Four animals, three alike. Taps the one that is different. |

## Kept for children, on purpose

- **No timers, no scores against the child, no streaks, no stars to lose, no sound.** A wrong tap is just "try again".
- **Nothing is saved except the language choice** (`soya-games-lang`). Nothing leaves the device. **No account, no ads, no tracking, no analytics, no telemetry.** There is no place in this app that records what a child does.
- **Big tap targets** (at least 48 px; the cards and numbers are much bigger), one filled button on a screen, no looping motion. Card flips use no animation beyond a short colour change, and none at all if the device asks for less motion.
- **Hebrew is right to left.** The games rely on pictures and numbers, so a child who cannot read yet can still play; the text is for the grown-up.
- A game can be won with luck, and that is fine: the point is playing together, not winning.

## Files

`index.html`, `styles.css`, `games.js` (the rules, tested), `app.js` (screens and text in both languages), `sw.js` (offline; cache `soyagames-…`), `manifest.webmanifest`, `icons/`, `assets/`. Check with `node --test apps/2026-11-20-soya-games/games.test.js`.
