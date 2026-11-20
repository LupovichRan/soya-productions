#!/usr/bin/env python3
"""Soya explains: a narrated 16:9 video made from a script file, with captions in English and Hebrew.

  python3 factory/videos/make_video.py --script factory/videos/scripts/software-factory.json \
      --voice /path/en_US-joe-medium.onnx --piper "/path/to/venv/bin/python -m piper" \
      --fonts /path/to/fonts --out assets/videos

What it does, in order: speaks every scene with Piper (an open text-to-speech engine, run on this computer) a little
faster than normal and warms the voice; writes an ORIGINAL music bed with code (no samples, no licence to worry about:
a chilled four-chord loop with a soft kick, clap, hats, bass, pad and a plucked arpeggio) that ducks under the voice;
draws each scene over a retro dusk scene (a striped sun, a slow neon grid, stars) while Soya the cat bobs to the beat,
blinks, and his eyes glow with the voice; burns large captions in, because most people watch with the sound off;
writes English and Hebrew caption files (WebVTT); and encodes an MP4.
The voice is synthetic and the page that shows the video says so. Use only a voice whose licence allows public use
(en_US-joe-medium is CC0). Needs: Python 3 with numpy and Pillow, ffmpeg, Piper, assets/soycatory-cat.jpg, and a fonts
folder with Jura-Light.ttf, Jura-Medium.ttf and GeistMono-Regular.ttf.
Scene kinds: title, chains, pipeline, loop, list, big, outro (see factory/videos/scripts/software-factory.json)."""
import argparse, json, math, os, re, shlex, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1280, 720, 24
LEAD, PAD = 0.3, 0.35          # seconds of quiet before a scene's voice, and after it
BPM = 92; BEAT = 60.0 / BPM; SR = 44100
HORIZON = 520
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INK, SOFT, EMBER, DIM = (250, 242, 248, 255), (230, 214, 232, 240), (255, 178, 120, 250), (160, 140, 190, 210)
NEON_PINK, NEON_CYAN = (255, 70, 190), (80, 220, 255)
AX0, AX1 = 570, 1240


def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3
def blur(a, r): return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255
def font(path, size): return ImageFont.truetype(path, size)


# ---------------------------------------------------------------- the scene behind everything
def make_scene():
    rng = np.random.default_rng(11)
    y = np.arange(H, dtype=np.float32)[:, None] / HORIZON
    stops = [(0, (6, 4, 26)), (.5, (38, 12, 84)), (.82, (140, 34, 120)), (1.0, (255, 110, 110))]
    sky = np.zeros((H, W, 3), np.float32)
    for c in range(3): sky[..., c] = np.interp(np.clip(y, 0, 1), [s[0] for s in stops], [s[1][c] for s in stops])
    sky[HORIZON:] = np.array([20, 8, 44], np.float32)                     # the ground under the grid
    stars = np.zeros((H, W), np.float32)
    for _ in range(140):
        sx, sy = int(rng.integers(0, W)), int(rng.integers(0, HORIZON - 60)); stars[sy:sy + 2, sx:sx + 2] = rng.uniform(.3, 1.0)
    sky += stars[..., None] * np.array([180, 170, 220], np.float32) * (1 - np.clip(np.arange(H)[:, None] / HORIZON, 0, 1))[..., None]
    # the sun: a disc with stripes that get thicker towards the bottom, sitting on the horizon behind the cat
    cx, cy, R = 300, 400, 200
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); d = np.hypot(xx - cx, yy - cy)
    disc = np.clip((R - d) / 2.0, 0, 1) * (yy < HORIZON)
    stripes = np.ones_like(yy)
    for i in range(8):
        y0 = cy + 30 + i * 22; th = 3 + i * 2.4
        stripes *= np.clip(np.abs(yy - y0) - th / 2, 0, 1)
    disc *= np.where(yy > cy + 20, stripes, 1)
    t = np.clip((yy - (cy - R)) / (2 * R), 0, 1); sun = np.zeros((H, W, 3), np.float32)
    sun[..., 0] = 255; sun[..., 1] = 205 - 150 * t; sun[..., 2] = 120 + 10 * t
    halo = np.exp(-np.clip(d - R, 0, None) / 190)[..., None] * np.array([255, 70, 160], np.float32) * .22 * (yy < HORIZON)[..., None]
    return sky + halo, disc.astype(np.float32), sun


def grid_layer(t):
    """Neon grid on the ground. Lines come slowly towards the viewer; the whole grid brightens on each kick."""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    kick = kick_env(t); a = int(120 + 90 * kick); vx = W / 2
    d.line([(0, HORIZON), (W, HORIZON)], fill=NEON_PINK + (255,), width=3)
    for k in range(-14, 15):                                              # lines that run away to the horizon
        d.line([(vx + k * 38, HORIZON), (vx + k * 360, H)], fill=NEON_PINK + (a,), width=2)
    drift = (t * 0.45) % 1.0
    for i in range(9):                                                    # lines across, closer together near the horizon
        f = ((i + drift) / 9.0) ** 2.2; yy = HORIZON + f * (H - HORIZON)
        d.line([(0, yy), (W, yy)], fill=NEON_CYAN + (int(a * (0.35 + f)),), width=2)
    arr = np.asarray(im).astype(np.float32); return arr[..., :3] * (arr[..., 3:4] / 255)


def kick_env(t):
    n = int(t / BEAT); ph = (t - n * BEAT) / BEAT; strength = 1.0 if n % 2 == 0 else 0.45
    return strength * math.exp(-ph * 5.5)


def cat_layers():
    src = Image.open(os.path.join(ROOT, 'assets', 'soycatory-cat.jpg')).convert('RGB')
    a = np.asarray(src).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = .3 * r + .59 * g + .11 * b
    m = Image.fromarray((((lum < 118) & (r >= b - 8)).astype(np.uint8)) * 255).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MedianFilter(9))
    eye = ((g > r + 35) & (g > b + 15)).astype(np.uint8) * 255
    box = (70, 10, 538, 476); S = 1.12
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
        ed.ellipse([cx - rr, cy - rr * 1.02, cx + rr, cy + rr * 1.02], fill=255); ed.ellipse([cx - rr * .2, cy - rr * .82, cx + rr * .2, cy + rr * .82], fill=90)
    eyes = np.asarray(ey.filter(ImageFilter.GaussianBlur(1.4))).astype(np.float32) / 255
    full = np.zeros((H, W), np.float32); fe = np.zeros((H, W), np.float32)
    px, py = 70, H - ch + 40
    wd, hd = min(cw, W - px), min(ch, H - py)
    full[py:py + hd, px:px + wd] = mk[:hd, :wd]; fe[py:py + hd, px:px + wd] = eyes[:hd, :wd]
    return full, fe


# ---------------------------------------------------------------- text, scene by scene
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


def glowed(im, color=NEON_PINK, radius=12, strength=0.9):
    """The text layer with a soft neon glow under it."""
    a = np.asarray(im)[..., 3].astype(np.float32) / 255; g = blur(a, radius) * strength
    out = np.zeros((H, W, 4), np.uint8); out[..., 0], out[..., 1], out[..., 2] = color; out[..., 3] = (np.clip(g, 0, 1) * 255).astype(np.uint8)
    return Image.fromarray(out)


def box(d, xy, fill, outline=None, r=18, width=2): d.rounded_rectangle(xy, r, fill=fill, outline=outline, width=width)
def arrow(d, x1, y, x2, col): d.line([(x1, y), (x2 - 10, y)], fill=col, width=4); d.polygon([(x2, y), (x2 - 16, y - 9), (x2 - 16, y + 9)], fill=col)
def centered(d, text, f, cx, y, fill): d.text((cx - d.textlength(text, font=f) / 2, y), text, font=f, fill=fill)


def scene_elements(show, F):
    """A list of (layer, seconds after the scene starts when it pops in, with glow?)."""
    t = show['type']; MONO = F['mono']; els = []; cx = (AX0 + AX1) // 2
    P = lambda n: font(F['mp'], n); L = lambda n: font(F['lp'], n)
    if t == 'title':
        els.append((layer(lambda d: d.text((AX0, 150), show['kicker'], font=MONO, fill=EMBER)), 0.2, False))
        def big(d):
            y = 200
            for line in wrap(d, show['title'], L(78), AX1 - AX0 + 30): d.text((AX0, y), line, font=L(78), fill=INK); y += 98
        els.append((layer(big), 0.45, True))
    elif t == 'chains':
        for i, (label, row) in enumerate(zip(show['labels'], show['rows'])):
            y0 = 150 + i * 190
            els.append((layer(lambda d, label=label, y0=y0: d.text((AX0, y0), label.upper(), font=MONO, fill=EMBER)), 0.2 + i * 2.6, False))
            for j, word in enumerate(row):
                def cell(d, j=j, word=word, y0=y0):
                    x = AX0 + j * 172; box(d, (x, y0 + 40, x + 132, y0 + 108), (50, 26, 92, 245), (210, 120, 230, 255), 16, 3)
                    centered(d, word, P(26), x + 66, y0 + 62, INK)
                    if j < len(row) - 1: arrow(d, x + 136, y0 + 74, x + 170, DIM)
                els.append((layer(cell), 0.5 + i * 2.6 + j * 0.34, False))
    elif t == 'pipeline':
        names = ['READ', 'PICK', 'BUILD', 'CHECK', 'ASK']; subs = ['what is new', 'the best idea', 'one tiny app', 'tests + a scan', 'a human looks']
        def frame(d, lit):
            for k, (n, s) in enumerate(zip(names, subs)):
                y = 110 + k * 94; on = k in lit
                box(d, (AX0, y, AX1 - 30, y + 80), (66, 36, 120, 255) if on else (30, 16, 58, 190), (255, 120, 210, 255) if on else (84, 62, 124, 255), 16, 3 if on else 2)
                d.text((AX0 + 22, y + 12), '%d' % (k + 1), font=P(34), fill=EMBER if on else DIM)
                d.text((AX0 + 78, y + 8), n, font=P(36), fill=INK if on else DIM); d.text((AX0 + 78, y + 48), s, font=P(22), fill=SOFT if on else DIM)
        els.append((layer(lambda d: frame(d, [])), 0.0, False))
        if show.get('done'): els.append((layer(lambda d: frame(d, show['done'])), 0.0, False))
        els.append((layer(lambda d: frame(d, show['done'] + show['now'])), 0.5, True))
    elif t == 'loop':
        pts = [(cx, 160), (cx + 200, 390), (cx - 200, 390)]
        els.append((layer(lambda d: centered(d, show['center'].upper(), MONO, cx, 285, EMBER)), 0.3, False))
        for k, n in enumerate(show['nodes']):
            def node(d, k=k, n=n):
                x, y = pts[k]; box(d, (x - 108, y - 38, x + 108, y + 38), (66, 36, 120, 255), (255, 120, 210, 255), 16, 3); centered(d, n, P(30), x, y - 18, INK)
            els.append((layer(node), 0.9 + k * 1.0, True))
        def arrows(d):
            for a, b in ((0, 1), (1, 2), (2, 0)):
                (x1, y1), (x2, y2) = pts[a], pts[b]; mx, my = (x1 + x2) / 2, (y1 + y2) / 2; dx, dy = x2 - x1, y2 - y1; n = math.hypot(dx, dy); ux, uy = dx / n, dy / n
                sx, sy, ex, ey = mx - ux * 40, my - uy * 40, mx + ux * 40, my + uy * 40
                d.line([(sx, sy), (ex, ey)], fill=NEON_CYAN + (255,), width=4)
                d.polygon([(ex + ux * 8, ey + uy * 8), (ex - uy * 9 - ux * 8, ey + ux * 9 - uy * 8), (ex + uy * 9 - ux * 8, ey - ux * 9 - uy * 8)], fill=NEON_CYAN + (255,))
        els.append((layer(arrows), 3.8, False))
    elif t == 'list':
        def head(d):
            y = 120
            for line in wrap(d, show['head'], P(40), AX1 - AX0): d.text((AX0, y), line, font=P(40), fill=INK); y += 52
        els.append((layer(head), 0.3, True))
        for k, item in enumerate(show['items']):
            def row(d, k=k, item=item):
                y = 260 + k * 86; box(d, (AX0, y, AX1 - 40, y + 66), (30, 16, 58, 235), (150, 100, 190, 255), 14)
                d.ellipse((AX0 + 18, y + 15, AX0 + 54, y + 51), outline=(255, 110, 110, 255), width=4); d.line([(AX0 + 24, y + 45), (AX0 + 48, y + 21)], fill=(255, 110, 110, 255), width=4)
                d.text((AX0 + 76, y + 13), 'Never: ' + item.lower(), font=P(30), fill=INK)
            els.append((layer(row), 1.3 + k * 0.9, False))
        els.append((layer(lambda d: d.text((AX0, 535), show['foot'], font=P(36), fill=EMBER)), 4.2, True))
    elif t == 'big':
        els.append((layer(lambda d: d.text((AX0, 200), show['line1'], font=L(84), fill=INK)), 0.3, True))
        els.append((layer(lambda d: d.text((AX0, 320), show['line2'], font=P(44), fill=SOFT)), 1.1, False))
    elif t == 'outro':
        els.append((layer(lambda d: d.text((AX0, 170), show['line1'], font=L(74), fill=INK)), 0.2, True))
        els.append((layer(lambda d: d.text((AX0, 270), show['line2'], font=P(40), fill=SOFT)), 0.8, False))
        els.append((layer(lambda d: d.text((AX0, 370), show['url'], font=MONO, fill=EMBER)), 1.5, False))
    return [(im, at, glowed(im) if g else None) for im, at, g in els]


# ---------------------------------------------------------------- voice and music
def speak(text, voice, piper, wav):
    p = subprocess.run(shlex.split(piper) + ['-m', voice, '--length-scale', '0.9', '-f', wav], input=text.encode(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if p.returncode != 0 or not os.path.exists(wav): sys.exit('piper failed: ' + p.stderr.decode()[-400:])


def read_wav(path):
    w = wave.open(path); sr, n = w.getframerate(), w.getnframes(); data = np.frombuffer(w.readframes(n), dtype='<i2'); w.close(); return sr, data


def warm_voice(raw_wav, out_wav):
    """A little low-end warmth, a gentle squeeze and a short room, so the computer voice sounds close and relaxed."""
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw_wav, '-af',
                    'highpass=f=70,equalizer=f=150:t=o:w=1.2:g=3.5,equalizer=f=3200:t=o:w=1:g=1.5,acompressor=threshold=-20dB:ratio=3:attack=5:release=90,aecho=0.85:0.4:55|110:0.16|0.08',
                    '-ar', str(SR), '-ac', '1', out_wav], check=True)


def hz(m): return 440.0 * 2 ** ((m - 69) / 12.0)


def synth_music(total):
    """An original chilled loop, A minor 7, F major 7, C major 7, G, about 92 beats a minute. Made from sine waves and noise."""
    n = int((total + 2.5) * SR); out = np.zeros(n, np.float32); rng = np.random.default_rng(5)
    chords = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 66]]; roots = [45, 41, 36, 43]
    def add(sig, t0, gain=1.0):
        i = int(t0 * SR)
        if i >= n: return
        j = min(n, i + len(sig)); out[i:j] += sig[:j - i] * gain
    def tone(f, dur, attack, release, harm=(1.0, .5, .25, .12)):
        t = np.arange(int(dur * SR)) / SR; sig = sum(h * np.sin(2 * np.pi * f * (k + 1) * t) for k, h in enumerate(harm))
        env = np.minimum(1, t / attack) * np.minimum(1, (dur - t) / release); return (sig * env).astype(np.float32)
    nbars = int((total + 2.5) / (4 * BEAT)) + 1
    for bar in range(nbars):
        t0 = bar * 4 * BEAT; chord = chords[bar % 4]; root = roots[bar % 4]
        for note in chord:                                                    # soft pad, three slightly different tunings per note
            for det in (-0.06, 0.0, 0.06): add(tone(hz(note + det), 4 * BEAT + .3, .35, .6), t0, 0.050)
        for s in range(8):                                                    # bass on eighth notes
            m = root + (12 if s in (3, 6) else 0); add(tone(hz(m), BEAT * .48, .01, .12, (1.0, .45, .2)), t0 + s * BEAT / 2, 0.62)
        for beat in (0, 2):                                                   # kick on 1 and 3
            td = np.arange(int(.28 * SR)) / SR; f = 45 + 95 * np.exp(-td * 28); ph = 2 * np.pi * np.cumsum(f) / SR
            add((np.sin(ph) * np.exp(-td * 9)).astype(np.float32), t0 + beat * BEAT, 1.5)
        for beat in (1, 3):                                                   # soft clap on 2 and 4
            td = np.arange(int(.16 * SR)) / SR; nz = rng.standard_normal(len(td)).astype(np.float32); nz = np.diff(nz, prepend=0)
            add(nz * np.exp(-td * 26), t0 + beat * BEAT, 0.20)
        for s in range(8):                                                    # hats on eighths
            td = np.arange(int(.05 * SR)) / SR; nz = rng.standard_normal(len(td)).astype(np.float32); nz = np.diff(np.diff(nz, prepend=0), prepend=0)
            add(nz * np.exp(-td * 90), t0 + s * BEAT / 2, 0.09 if s % 2 else 0.14)
        pattern = [0, 2, 1, 3, 2, 1, 3, 2, 0, 2, 3, 1, 2, 3, 1, 2]
        for s, k in enumerate(pattern):                                       # plucked arpeggio on sixteenths
            add(tone(hz(chord[k] + 12), .30, .004, .25, (1.0, .3, .1)), t0 + s * BEAT / 4, 0.11)
    for delay, g in ((BEAT * .75, .30), (BEAT * 1.5, .16)):                  # a soft echo
        d = int(delay * SR); echo = np.zeros_like(out); echo[d:] = out[:-d] * g; out += echo
    out = out[:int((total + 1.5) * SR)]; out *= np.minimum(1, np.arange(len(out)) / (SR * 1.2)) * np.minimum(1, (len(out) - np.arange(len(out))) / (SR * 2.0))
    return out / max(1e-6, float(np.abs(out).max()))


def duck_curve(voice, sr):
    """0 when the voice is quiet, up to 1 when it is speaking: the music dips by that much."""
    win = int(sr * 0.02); n = len(voice) // win; rms = np.sqrt(np.add.reduceat(voice[:n * win].astype(np.float32) ** 2, np.arange(0, n * win, win)) / win)
    rms = rms / max(1e-6, float(rms.max())); env = np.zeros(n, np.float32); cur = 0.0
    for i, x in enumerate(rms):
        target = 1.0 if x > 0.06 else 0.0; k = 0.5 if target > cur else 0.06; cur += (target - cur) * k; env[i] = cur
    return np.interp(np.arange(len(voice)) / win, np.arange(n), env).astype(np.float32)


def vtt_time(s): h, r = divmod(s, 3600); m, r = divmod(r, 60); return '%02d:%02d:%06.3f' % (h, m, r)
def sentences(text): return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if s.strip()]


def caption_layer(text, F):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im); f = font(F['mp'], 30)
    lines = wrap(d, text, f, 640); lh = 40; ht = lh * len(lines) + 22; y0 = 676 - ht; wd = max(d.textlength(l, font=f) for l in lines) + 36
    x0 = (AX0 + AX1) / 2 - wd / 2 + 10
    d.rounded_rectangle((x0, y0, x0 + wd, y0 + ht), 16, fill=(10, 4, 28, 215), outline=(255, 120, 210, 255), width=2)
    for i, l in enumerate(lines): d.text((x0 + 18, y0 + 11 + i * lh), l, font=f, fill=(255, 255, 255, 255))
    return im


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--script', required=True); ap.add_argument('--voice', required=True); ap.add_argument('--piper', required=True)
    ap.add_argument('--fonts', required=True); ap.add_argument('--out', required=True); ap.add_argument('--work', default='/tmp/soya-video')
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True); os.makedirs(a.work, exist_ok=True)
    sc = json.load(open(a.script)); slug = sc['slug']
    F = {'lp': os.path.join(a.fonts, 'Jura-Light.ttf'), 'mp': os.path.join(a.fonts, 'Jura-Medium.ttf'), 'mono': font(os.path.join(a.fonts, 'GeistMono-Regular.ttf'), 26)}
    # 1. speak every scene and time it
    chunks = []; t = 0.0
    for i, s in enumerate(sc['scenes']):
        raw = os.path.join(a.work, '%s-%02d.raw.wav' % (slug, i)); wav = os.path.join(a.work, '%s-%02d.wav' % (slug, i))
        speak(s['en'], a.voice, a.piper, raw); warm_voice(raw, wav); sr, data = read_wav(wav); dur = len(data) / sr
        chunks += [np.zeros(int(LEAD * sr), '<i2'), data, np.zeros(int(PAD * sr), '<i2')]
        s['_start'] = t; s['_voice_at'] = t + LEAD; s['_dur'] = LEAD + dur + PAD; s['_say'] = dur; t += s['_dur']
    voice = np.concatenate(chunks).astype(np.float32) / 32768.0; total = len(voice) / SR
    voice = voice / max(1e-6, float(np.abs(voice).max())) * 0.9
    # 2. music, ducked under the voice, then mixed and levelled
    music = synth_music(total)[:len(voice)]; duck = duck_curve(voice, SR)
    mix = voice + music * 0.40 * (1.0 - 0.62 * duck)
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mixwav = os.path.join(a.work, slug + '.mix.wav')
    w = wave.open(mixwav, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes()); w.close()
    env = np.zeros(int(math.ceil(total * FPS)), np.float32)
    for k in range(len(env)):
        seg = voice[int(k / FPS * SR):int((k + 1) / FPS * SR)]; env[k] = math.sqrt(float((seg ** 2).mean())) if len(seg) else 0
    env = np.convolve(env / max(env.max(), 1e-6), np.ones(4) / 4, 'same')
    # 3. captions (files and the burned-in cues)
    cues_en = []
    for lang in ('en', 'he'):
        cues = []
        for s in sc['scenes']:
            sents = sentences(s[lang]); weights = [len(x) for x in sents]; acc = s['_voice_at']
            for x, wt in zip(sents, weights): dd = s['_say'] * wt / sum(weights); cues.append((acc, acc + dd, x)); acc += dd
        with open(os.path.join(a.out, '%s.%s.vtt' % (slug, lang)), 'w', encoding='utf-8') as f:
            f.write('WEBVTT\n\n'); [f.write('%s --> %s\n%s\n\n' % (vtt_time(x), vtt_time(y), z)) for x, y, z in cues]
        if lang == 'en': cues_en = cues
    cap_layers = [(x, y, caption_layer(z, F)) for x, y, z in cues_en]
    # 4. draw
    sky, sun_mask, sun_col = make_scene(); full, fe = cat_layers()
    rim = np.clip(full - blur(full, 8), 0, 1) * .8; rim = blur(np.clip(rim * 4, 0, 1), 1.2)
    body = np.array([8, 6, 14], np.float32) + rim[..., None] * np.array([255, 90, 140], np.float32) * .35
    bloom = blur(fe, 20)
    vig = np.hypot((np.arange(W)[None, :] - W / 2) / (W * .70), (np.arange(H)[:, None] - H * .5) / (H * .70)); vig = np.clip(1.06 - .5 * vig ** 2.2, .4, 1)[..., None].astype(np.float32)
    for s in sc['scenes']: s['_els'] = scene_elements(s['show'], F)
    rng = np.random.default_rng(3); nf = len(env); out = os.path.join(a.out, slug + '.mp4')
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (W, H), '-r', str(FPS), '-i', '-', '-i', mixwav,
                          '-c:v', 'libx264', '-crf', '24', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=9', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-shortest', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    for k in range(nf):
        ts = k / FPS; kick = kick_env(ts)
        s = next((x for x in sc['scenes'] if x['_start'] <= ts < x['_start'] + x['_dur']), sc['scenes'][-1]); local = ts - s['_start']
        out_k = min(1.0, (s['_dur'] - local) / 0.25) if s is not sc['scenes'][-1] else 1.0
        img = sky.copy()
        img += (sun_mask * (1.0 + 0.10 * kick))[..., None] * sun_col * 0.95
        img += grid_layer(ts) * 0.9
        dy = int(round(7 * kick)); fl = np.roll(full, dy, axis=0); fle = np.roll(fe, dy, axis=0); bl = np.roll(bloom, dy, axis=0)
        blink = 0.0 if (ts % 3.4) > 0.14 or ts < 1.4 else 1.0
        glow = (0.35 + 0.65 * float(env[k])) * (1 - blink)
        img = img * (1 - fl[..., None]) + body * fl[..., None]
        img += bl[..., None] * np.array([30, 255, 90], np.float32) * (.12 + .5 * glow)
        e = fle[..., None] * (0.30 + 0.62 * glow) * (1 - blink); img = img * (1 - e) + np.array([140, 255, 150], np.float32) * e
        for im, at, gl in s['_els']:
            kk = min(1.0, ease((local - at) / 0.35)) * max(0.0, out_k)
            if kk <= 0: continue
            off = int(26 * (1 - ease((local - at) / 0.45)))
            for lay, gain in ((gl, 0.55), (im, 1.0)):
                if lay is None: continue
                arr = np.asarray(lay).astype(np.float32)
                if off: arr = np.roll(arr, off, axis=0)
                al = arr[..., 3:4] / 255 * kk * gain; img = img * (1 - al) + arr[..., :3] * al
        for c0, c1, cl in cap_layers:
            if c0 - 0.05 <= ts < c1 + 0.12:
                kk = min(1.0, (ts - c0 + 0.05) / 0.12, (c1 + 0.12 - ts) / 0.12)
                arr = np.asarray(cl).astype(np.float32); al = arr[..., 3:4] / 255 * max(0.0, kk); img = img * (1 - al) + arr[..., :3] * al; break
        img *= vig * min(1.0, ts / 0.5)
        img += rng.normal(0, 2.2, (H, W, 1)).astype(np.float32)
        p.stdin.write(np.clip(img, 0, 255).astype(np.uint8).tobytes())
    p.stdin.close(); p.wait()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1.3', '-i', out, '-frames:v', '1', '-q:v', '3', os.path.join(a.out, slug + '.jpg')])
    print(out, round(total, 1), 'seconds')


if __name__ == '__main__':
    main()
