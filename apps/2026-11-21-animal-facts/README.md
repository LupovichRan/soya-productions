# Soya's Animal Facts

A new true fact about an animal every day, told by Soya the cat, in English, Hebrew and French.

1. **Fact of the day.** It starts with the tiger on launch day (21 November 2026) and goes through the list in order, one a day, changing at local midnight, the same for everyone on the same date. "Tell me more" adds the detail; "Another fact" shows a random one; "All the facts so far" lists them.
2. **Sources.** Every fact links to where it came from, with a tuna rating for how far we trust that source (Wikipedia: 3 of 5 tuna, a good start; check its sources).
3. **True or false?** Common animal myths (goldfish memory, blind bats, ostriches in sand) with the real answer and its source.
4. **Checked.** On 2026-11-21 the claims were checked against their Wikipedia pages; the koala fingerprint fact was removed (not on the page), and the hummingbird, tardigrade, dolphin, axolotl and wombat wording was adjusted to say exactly what the page says.
5. **Privacy.** Stored on the device: the language only (`soya-animals-lang`). Nothing is counted or sent.

## Adding facts

Add an entry to `facts` (or `myths`) in `facts.json` with `id`, `emoji`, `url`, `src`, and the text in `en`, `he` and `fr`. Only add a fact after reading it on the source page, and say no more than the page says. Then bump `VERSION` in `sw.js`.
