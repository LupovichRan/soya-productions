#!/usr/bin/env python3
"""Soya explains: a narrated 16:9 video made from a script file, with captions in English and Hebrew.

  python3 factory/videos/make_video.py --script factory/videos/scripts/software-factory.json \
      --voice /path/en_US-joe-medium.onnx --piper "/path/to/venv/bin/python -m piper" \
      --fonts /path/to/fonts --out assets/videos

What it does, in order: speaks every scene with Piper (an open text-to-speech engine, run on this computer), measures
each scene's audio, draws the scene over a calm dusk background with Soya's silhouette (her eyes glow a little more
while the voice is loud), joins the audio, writes English and Hebrew caption files (WebVTT), and encodes an MP4.
The voice is synthetic and the page that shows the video says so. Use only a voice whose licence allows public use
(en_US-joe-medium is CC0). Needs: Python 3 with numpy and Pillow, ffmpeg, Piper, the cat photo
assets/soycatory-cat.jpg, and a fonts folder with Jura-Light.ttf, Jura-Medium.ttf and GeistMono-Regular.ttf.
Scene kinds: title, chains, pipeline, loop, list, big, outro (see factory/videos/scripts/software-factory.json)."""
import argparse, json, math, os, re, shlex, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1280, 720, 24
LEAD, PAD = 0.5, 0.8      # seconds of quiet before a scene's voice, and after it
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INK, SOFT, EMBER, DIM = (247, 238, 242, 255), (226, 208, 226, 235), (255, 170, 130, 245), (150, 130, 170, 200)
GREEN = (140, 255, 150, 255)


def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3


def background():
    y = np.arange(H, dtype=np.float32)[:, None] / H
    stops = [(0, (8, 6, 32)), (.45, (30, 12, 70)), (.8, (88, 24, 100)), (1, (150, 44, 90))]
    img = np.zeros((H, W, 3), np.float32)
    for c in range(3): img[..., c] = np.interp(y, [s[0] for s in stops], [s[1][c] for s in stops])
    return img


def cat_layers():
    """The cat silhouette (without eyes) and the eyes alone, as arrays the size of the frame."""
    src = Image.open(os.path.join(ROOT, 'assets', 'soycatory-cat.jpg')).convert('RGB')
    a = np.asarray(src).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = .3 * r + .59 * g + .11 * b
    m = Image.fromarray((((lum < 118) & (r >= b - 8)).astype(np.uint8)) * 255).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MedianFilter(9))
    eye = ((g > r + 35) & (g > b + 15)).astype(np.uint8) * 255
    box = (70, 10, 538, 476); S = 1.15
    cw, ch = int((box[2] - box[0]) * S), int((box[3] - box[1]) * S)
    mk = np.asarray(m.crop(box).resize((cw, ch), Image.LANCZOS).filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255
    mk = np.clip((mk - .5) * 9 + .5, 0, 1)
    em = np.asarray(Image.fromarray(eye).crop(box)) > 0
    ey = Image.new('L', (cw, ch), 0); ed = ImageDraw.Draw(ey)
    ys, xs = np.nonzero(em); mid = int((xs.min() + xs.max()) / 2)
    for lo, hi in ((0, mid), (mid, em.shape[1])):
        yy, xx = np.nonzero(em[:, lo:hi])
        if len(xx) == 0: continue
        cx, cy = (xx.mean() + lo) * S, yy.mean() * S; rr = (xx.max() - xx.min()) / 2 * S + 3
        ed.ellipse([cx - rr, cy - rr * 1.02, cx + rr, cy + rr * 1.02], fill=255)
        ed.ellipse([cx - rr * .2, cy - rr * .82, cx + rr * .2, cy + rr * .82], fill=90)
    eyes = np.asarray(ey.filter(ImageFilter.GaussianBlur(1.4))).astype(np.float32) / 255
    full = np.zeros((H, W), np.float32); fe = np.zeros((H, W), np.float32)
    px, py = 30, H - ch + 24
    wd, hd = min(cw, W - px), min(ch, H - py)
    full[py:py + hd, px:px + wd] = mk[:hd, :wd]; fe[py:py + hd, px:px + wd] = eyes[:hd, :wd]
    return full, fe


def blur(a, r): return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


def make_base():
    img = background(); full, fe = cat_layers()
    rim = np.clip(full - blur(full, 8), 0, 1) * .8; rim = blur(np.clip(rim * 4, 0, 1), 1.2)
    body = np.array([8, 6, 14], np.float32) + rim[..., None] * np.array([255, 90, 120], np.float32) * .30
    img = img * (1 - full[..., None]) + body * full[..., None]
    v = np.hypot((np.arange(W)[None, :] - W / 2) / (W * .66), (np.arange(H)[:, None] - H * .5) / (H * .66))
    img *= np.clip(1.08 - .45 * v ** 2.2, .4, 1)[..., None]
    return img, fe, blur(fe, 22)


def font(path, size): return ImageFont.truetype(path, size)


def wrap(dr, text, f, maxw):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if dr.textlength(t, font=f) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines


def layer(fn):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); fn(ImageDraw.Draw(im)); return im


def box(d, xy, fill, outline=None, r=18, width=2): d.rounded_rectangle(xy, r, fill=fill, outline=outline, width=width)


def arrow(d, x1, y, x2, col):
    d.line([(x1, y), (x2 - 10, y)], fill=col, width=4); d.polygon([(x2, y), (x2 - 16, y - 9), (x2 - 16, y + 9)], fill=col)


def centered(d, text, f, cx, y, fill):
    d.text((cx - d.textlength(text, font=f) / 2, y), text, font=f, fill=fill)


AX0, AX1 = 540, 1240      # the area right of the cat


def scene_elements(show, F):
    """A list of (layer, seconds after the scene starts when it fades in). Persistent text is drawn once, in order."""
    t = show['type']; L, M, MONO = F['l'], F['m'], F['mono']; els = []
    cx = (AX0 + AX1) // 2
    if t == 'title':
        els.append((layer(lambda d: d.text((AX0, 200), show['kicker'], font=MONO, fill=EMBER)), 0.4))
        def big(d):
            y = 250
            for line in wrap(d, show['title'], font(F['lp'], 72), AX1 - AX0 + 40):
                d.text((AX0, y), line, font=font(F['lp'], 72), fill=INK); y += 92
        els.append((layer(big), 0.9))
    elif t == 'chains':
        for i, (label, row) in enumerate(zip(show['labels'], show['rows'])):
            y0 = 200 + i * 190
            els.append((layer(lambda d, label=label, y0=y0: d.text((AX0, y0), label.upper(), font=MONO, fill=EMBER)), 0.5 + i * 3.0))
            for j, word in enumerate(row):
                def cell(d, j=j, word=word, y0=y0):
                    x = AX0 + j * 175
                    box(d, (x, y0 + 40, x + 135, y0 + 110), (46, 28, 86, 240), (140, 110, 190, 255))
                    centered(d, word, M and font(F['mp'], 26), x + 67, y0 + 62, INK)
                    if j < len(row) - 1: arrow(d, x + 140, y0 + 75, x + 172, DIM)
                els.append((layer(cell), 0.9 + i * 3.0 + j * 0.45))
    elif t == 'pipeline':
        names = ['READ', 'PICK', 'BUILD', 'CHECK', 'ASK']; subs = ['what is new', 'the best idea', 'one small app', 'tests + a scan', 'a person looks']
        def frame(d, lit):
            for k, (n, s) in enumerate(zip(names, subs)):
                y = 150 + k * 100
                on = k in lit
                box(d, (AX0, y, AX1 - 40, y + 82), (60, 40, 110, 255) if on else (30, 18, 58, 200), (200, 160, 240, 255) if on else (80, 60, 120, 255), 16, 3 if on else 2)
                d.text((AX0 + 22, y + 12), '%d' % (k + 1), font=font(F['mp'], 34), fill=EMBER if on else DIM)
                d.text((AX0 + 78, y + 8), n, font=font(F['mp'], 36), fill=INK if on else DIM)
                d.text((AX0 + 78, y + 50), s, font=font(F['mp'], 22), fill=SOFT if on else DIM)
        els.append((layer(lambda d: frame(d, [])), 0.0))
        if show.get('done'): els.append((layer(lambda d: frame(d, show['done'])), 0.0))
        els.append((layer(lambda d: frame(d, show['done'] + show['now'])), 0.8))
    elif t == 'loop':
        pts = [(cx, 190), (cx + 210, 440), (cx - 210, 440)]
        els.append((layer(lambda d: centered(d, show['center'].upper(), MONO, cx, 330, EMBER)), 0.5))
        for k, n in enumerate(show['nodes']):
            def node(d, k=k, n=n):
                x, y = pts[k]; box(d, (x - 105, y - 38, x + 105, y + 38), (60, 40, 110, 255), (200, 160, 240, 255), 16, 3)
                centered(d, n, font(F['mp'], 30), x, y - 18, INK)
            els.append((layer(node), 1.0 + k * 1.2))
        def arrows(d):
            for a, b in ((0, 1), (1, 2), (2, 0)):
                (x1, y1), (x2, y2) = pts[a], pts[b]; mx, my = (x1 + x2) / 2, (y1 + y2) / 2
                dx, dy = x2 - x1, y2 - y1; n = math.hypot(dx, dy); ux, uy = dx / n, dy / n
                sx, sy, ex, ey = mx - ux * 40, my - uy * 40, mx + ux * 40, my + uy * 40
                d.line([(sx, sy), (ex, ey)], fill=DIM, width=4)
                d.polygon([(ex + ux * 8, ey + uy * 8), (ex - uy * 9 - ux * 8, ey + ux * 9 - uy * 8), (ex + uy * 9 - ux * 8, ey - ux * 9 - uy * 8)], fill=DIM)
        els.append((layer(arrows), 4.6))
    elif t == 'list':
        def head(d):
            y = 170
            for line in wrap(d, show['head'], font(F['mp'], 40), AX1 - AX0): d.text((AX0, y), line, font=font(F['mp'], 40), fill=INK); y += 52
        els.append((layer(head), 0.4))
        for k, item in enumerate(show['items']):
            def row(d, k=k, item=item):
                y = 300 + k * 90; box(d, (AX0, y, AX1 - 60, y + 68), (30, 18, 58, 230), (110, 80, 150, 255), 14)
                d.ellipse((AX0 + 18, y + 16, AX0 + 54, y + 52), outline=(255, 120, 120, 255), width=4); d.line([(AX0 + 24, y + 46), (AX0 + 48, y + 22)], fill=(255, 120, 120, 255), width=4)
                d.text((AX0 + 76, y + 14), 'Never: ' + item.lower(), font=font(F['mp'], 30), fill=INK)
            els.append((layer(row), 1.6 + k * 1.1))
        els.append((layer(lambda d: d.text((AX0, 585), show['foot'], font=font(F['mp'], 34), fill=EMBER)), 5.4))
    elif t == 'big':
        els.append((layer(lambda d: d.text((AX0, 230), show['line1'], font=font(F['lp'], 84), fill=INK)), 0.5))
        els.append((layer(lambda d: d.text((AX0, 350), show['line2'], font=font(F['mp'], 44), fill=SOFT)), 1.6))
    elif t == 'outro':
        els.append((layer(lambda d: d.text((AX0, 210), show['line1'], font=font(F['lp'], 70), fill=INK)), 0.4))
        els.append((layer(lambda d: d.text((AX0, 310), show['line2'], font=font(F['mp'], 40), fill=SOFT)), 1.2))
        els.append((layer(lambda d: d.text((AX0, 430), show['url'], font=MONO, fill=EMBER)), 2.2))
    return els


def speak(text, voice, piper, wav):
    p = subprocess.run(shlex.split(piper) + ['-m', voice, '-f', wav], input=text.encode(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if p.returncode != 0 or not os.path.exists(wav): sys.exit('piper failed: ' + p.stderr.decode()[-400:])


def read_wav(path):
    w = wave.open(path); sr, n = w.getframerate(), w.getnframes(); data = np.frombuffer(w.readframes(n), dtype='<i2'); w.close(); return sr, data


def vtt_time(s): h, r = divmod(s, 3600); m, r = divmod(r, 60); return '%02d:%02d:%06.3f' % (h, m, r)


def sentences(text): return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--script', required=True); ap.add_argument('--voice', required=True); ap.add_argument('--piper', required=True)
    ap.add_argument('--fonts', required=True); ap.add_argument('--out', required=True); ap.add_argument('--work', default='/tmp/soya-video')
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True); os.makedirs(a.work, exist_ok=True)
    sc = json.load(open(a.script)); slug = sc['slug']
    F = {'lp': os.path.join(a.fonts, 'Jura-Light.ttf'), 'mp': os.path.join(a.fonts, 'Jura-Medium.ttf')}
    F['l'] = font(F['lp'], 40); F['m'] = font(F['mp'], 36); F['mono'] = font(os.path.join(a.fonts, 'GeistMono-Regular.ttf'), 26)
    # 1. speak every scene, 2. time it
    sr = None; chunks = []; starts = []; t = 0.0
    for i, s in enumerate(sc['scenes']):
        wav = os.path.join(a.work, '%s-%02d.wav' % (slug, i)); speak(s['en'], a.voice, a.piper, wav)
        sr, data = read_wav(wav); dur = len(data) / sr
        lead, pad = np.zeros(int(LEAD * sr), '<i2'), np.zeros(int(PAD * sr), '<i2')
        chunks += [lead, data, pad]; s['_start'] = t; s['_voice_at'] = t + LEAD; s['_dur'] = LEAD + dur + PAD; s['_say'] = dur; t += s['_dur']
    audio = np.concatenate(chunks); total = len(audio) / sr
    full = os.path.join(a.work, slug + '.wav')
    w = wave.open(full, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(audio.tobytes()); w.close()
    # loudness per frame, smoothed, for the eyes
    nf = int(math.ceil(total * FPS)); env = np.zeros(nf, np.float32)
    for k in range(nf):
        seg = audio[int(k / FPS * sr):int((k + 1) / FPS * sr)].astype(np.float32)
        env[k] = math.sqrt(float((seg ** 2).mean())) if len(seg) else 0
    env = np.convolve(env / max(env.max(), 1), np.ones(5) / 5, 'same')
    # 3. captions
    for lang in ('en', 'he'):
        cues = []
        for s in sc['scenes']:
            sents = sentences(s[lang]); weights = [len(x) for x in sents]; acc = s['_voice_at']
            for x, wt in zip(sents, weights):
                d = s['_say'] * wt / sum(weights); cues.append((acc, acc + d, x)); acc += d
        with open(os.path.join(a.out, '%s.%s.vtt' % (slug, lang)), 'w', encoding='utf-8') as f:
            f.write('WEBVTT\n\n'); [f.write('%s --> %s\n%s\n\n' % (vtt_time(x), vtt_time(y), z)) for x, y, z in cues]
    # 4. draw
    base, fe, bloom = make_base()
    out = os.path.join(a.out, slug + '.mp4')
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (W, H), '-r', str(FPS), '-i', '-', '-i', full,
                          '-c:v', 'libx264', '-crf', '26', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-ar', '44100', '-shortest', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    for s in sc['scenes']: s['_els'] = scene_elements(s['show'], F)
    for k in range(nf):
        ts = k / FPS; s = next((x for x in sc['scenes'] if x['_start'] <= ts < x['_start'] + x['_dur']), sc['scenes'][-1])
        local = ts - s['_start']; fade_out = min(1.0, (s['_dur'] - local) / 0.4) if s is not sc['scenes'][-1] else 1.0
        glow = 0.35 + 0.65 * float(env[k])
        img = base.copy()
        img += bloom[..., None] * np.array([30, 255, 90], np.float32) * (.15 + .5 * glow)
        e = fe[..., None] * (0.35 + 0.55 * glow)
        img = img * (1 - e) + np.array([140, 255, 150], np.float32) * e
        img *= min(1.0, ts / 0.6)
        for im, at in s['_els']:
            kk = ease((local - at) / 0.5) * max(0.0, fade_out)
            if kk <= 0: continue
            arr = np.asarray(im).astype(np.float32); al = arr[..., 3:4] / 255 * kk
            img = img * (1 - al) + arr[..., :3] * al
        p.stdin.write(np.clip(img, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close(); p.wait()
    # a poster frame from the title scene
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1.6', '-i', out, '-frames:v', '1', '-q:v', '3', os.path.join(a.out, slug + '.jpg')])
    print(out, round(total, 1), 'seconds')


if __name__ == '__main__':
    main()
