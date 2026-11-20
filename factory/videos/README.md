# Soya explains: the videos

Short videos where Soya the cat explains AI and software in plain words. He is a cartoon; the voice is a computer voice and the pages say so. They are published at `videos.html`, listed in `videos.js`, and linked from the front page and the daily post.

## Make one

1. Write `factory/videos/scripts/<slug>.json`: a title and description in English and Hebrew, and nine or so scenes. Each scene has the English words Soya says, the Hebrew for the captions, and what to draw (`title`, `chains`, `pipeline`, `loop`, `list`, `big`, `outro`). Copy `software-factory.json`.
2. Render:
   ```
   python3 factory/videos/make_video.py --script factory/videos/scripts/<slug>.json \
     --voice <path>/en_US-joe-medium.onnx --piper "<venv>/bin/python -m piper" \
     --fonts <fonts folder> --out assets/videos
   ```
   It speaks each scene with Piper, measures the audio, draws the scenes, joins the sound, writes `<slug>.en.vtt` and `<slug>.he.vtt` captions and a poster, and encodes `<slug>.mp4` (about 25 MB per 10 minutes at this size).
3. Level the sound so it does not clip: `ffmpeg -i in.mp4 -c:v copy -af loudnorm=I=-18:TP=-2:LRA=7 -c:a aac -b:a 96k out.mp4`.
4. Add an entry at the top of `videos.js`, check the page in English and Hebrew at phone width, and open a pull request.

## The voice

Piper is an open text-to-speech engine that runs on a computer, no network at render time. The voice is `en_US-joe-medium`, whose data is **CC0 (public domain)**. Do not use a voice whose licence says non-commercial or share-alike (several popular ones do, for example `ryan`); check the model card on the Piper voices page first. The voice is not a person and the videos never pretend it is.

## Facts, not fashion

A video about a trend says only what we can point to. Before writing one about something that changed lately, read the source, and keep a link to it in the video's description. Say "some people call this…" for names that are not settled. Never invent numbers, quotes or who said what. Do not name a person or a company as if they endorse Soycatory.

## Episodes

| # | Slug | Status |
|---|---|---|
| 1 | `software-factory` | Made, 20 November 2026 |
| 2 | `ai-agent` | Idea: what an AI agent is, and what it is not |
| 3 | `outer-loop` | Idea: the agent above the tools that decides, checks and follows up |
| 4 | `small-and-big-models` | Idea: when a small model is enough, from our own measurements |
| 5 | `open-source` | Idea: what open source means, and what it does not |

## Counting and comments

`videos.html` counts how far each video is watched and takes comments tied to a moment, only when a receiver address is set in `waitlist.js`, with no cookies, nothing stored in the browser, a random number for one visit only, and nothing sent for anyone who sends Do Not Track. The Sheet tab `video summary` shows views, how far people get and where they stop. To add a video, copy its row in `video summary` and change the name in column A. How the channel uses the numbers: `factory/CHANNEL.md`.
