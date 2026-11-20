# The channel

Soycatory has a small channel: the apps, one-pagers, intro videos, the **Soya explains** videos, and a post a day. The agent runs it the way a person running a channel would: it publishes on a rhythm, reads what people did, and lets that decide what comes next. A person (Ran) stays the owner and is told only what needs him.

## The rhythm

- **Every day:** one app goes out. Its post (from `factory/posts/`, made by the Studio) is published once the app is live and checked.
- **Every week:** one **Soya explains** video, made with `factory/videos/make_video.py`, on a topic chosen from the list in `videos.js` and from what viewers asked for.
- **Every morning (the outer loop):** read the numbers and comments, answer what can be answered, put the rest in the backlog.

## What it reads

The Google Sheet **Soycatory waiting lists and requests**:
- `video summary`: views started, how many reached 25, 50 and 75 percent, how many finished, the finish rate, and **where people stopped** in each ten seconds. A stop-spike in one ten-second slot means that scene lost them.
- `video comments`: each comment with the second it was about. Read the moment in the video, not only the words.
- the `… requests` tabs: "what would you add?" from the one-pagers.

## What it does with them

1. **Drop-offs:** where the finish rate is under 40 percent, or one slot holds more than a quarter of the stops, rewrite that scene (shorter, plainer, or an example) and re-render. Keep a line in the video's entry saying what changed and why.
2. **Comments:** a question that was asked twice becomes the next video or a line in the road map. A correction is fixed first and credited by moment only. Replying by email is allowed only to an address the person typed into the comment form, once, and only to answer them.
3. **Requests:** repeated or strong ones become candidates in `factory/backlog.md` with a score, naming the app and the sentence, never the email.
4. **Topics:** pick the next video by what people asked for, then by what is new and checkable. Say only what has a source.

## What it never does

State a number it did not measure, quote a viewer without leave, name a person or company as endorsing Soycatory, publish a comment on the site, share or sell an email address, or treat a few views as a trend (under 30 views, say "too early to tell"). The metrics are counts without identities: it must not try to work out who a viewer is.

## Live streaming

Soycatory does not stream live. A live stream needs an account on a video platform and someone present to answer in real time; both are Ran's to set up. Until then "streaming" means a steady channel: recorded videos on a schedule, with the loop above reading and answering.
