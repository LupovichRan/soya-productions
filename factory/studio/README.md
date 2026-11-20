# Studio

One short **brief** in, everything an app needs to go out the door. It is how the factory makes the video, the branding, the one-pager road map and the post the same way every day, so adding an app costs one file, not one afternoon.

```
python3 factory/studio/studio.py build factory/studio/briefs/<slug>.json --list --fonts <fonts folder>
python3 factory/studio/studio.py check        # what is missing, app by app
python3 factory/studio/studio.py post factory/studio/briefs/<slug>.json
```

| Output | Where | When |
|---|---|---|
| LinkedIn post | `factory/posts/<post_date>-<slug>.md` | always |
| One-pager road map | `roadmaps.js` (the app's entry) | always |
| Front-page list entry | `apps.js` | with `--list`, if the app is not listed |
| 7-second intro video | `assets/intros/<slug>.mp4` | with `--fonts` (skip with `--no-intro`) |
| Share card, 1200 by 630 | `assets/brand/<slug>.png` | with `--fonts` |
| Explainer video with captions | `assets/videos/<slug>.*` | if the brief names a script, with `--voice`, `--piper`, `--fonts` |

`studio.html` on the site is a phone-friendly form that checks a brief against the same rules, shows the post, and downloads `brief.json`. Nothing on that page is sent or saved.

## What a brief must say

The app's name and what it is in English and Hebrew; the day of "one app a day"; **one honest limit** (what it cannot do yet); the road map in both languages (two to four lines of what works today, at least two for next, at least one for later) and **one question** for people. See `brief.example.json`.

## Rules it enforces (so a rushed day cannot break them)

- The post **starts with** `ONE APP A DAY UNTIL SOMETHING WILL CATCH ...` and stays under 1,300 characters.
- Never "film" or "movie": Soycatory is a software factory.
- No hype words ("proven demand", "viral", "guarantee"…): say only what was measured or tried.
- No email address, key or token anywhere in the text.
- The line is at most 220 characters; the app folder must exist.

Tests: `python3 -m unittest discover -s factory/studio` (also run by CI).

## A day, with the Studio

1. Build the app (see `factory/FACTORY.md`).
2. Write its brief in `factory/studio/briefs/`.
3. `studio.py build … --list --fonts …`, then `studio.py check` must say `0 app(s) with gaps`.
4. Look at the one-pager and the card, open the pull request. The post goes out on its `post_date`.
