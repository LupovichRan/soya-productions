#!/usr/bin/env python3
"""Soycatory intro videos: a silent 7-second square clip per app (and one for the series), in the dusk look of the
teaser poster, with Soya's silhouette and green eyes. Text fades in once; nothing loops.

  python3 factory/intro/make_intro.py --fonts /path/to/fonts --out assets/intros [--only plain-steps]

Needs: Python 3 with numpy and Pillow, ffmpeg, the cat photo assets/soycatory-cat.jpg, and a folder holding
Jura-Light.ttf, Jura-Medium.ttf and GeistMono-Regular.ttf (all open-licence fonts). Titles are Latin text only;
Hebrew needs a layout library this script does not use, so Hebrew intros are not made here.
Add an app: add one line to APPS below."""
import argparse, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

APPS = [  # (short name, title, one line, app number or None)
    ('soycatory', 'Soycatory', 'One app a day until something catches.', None),
    ('roundtable', 'Roundtable', 'A panel of invented people reacts to your idea.', 1),
    ('read-it-simply', 'Read It Simply', 'Paste a confusing letter. See what it asks you to do.', 2),
    ('say-it-kindly', 'Say It Kindly', 'Pause before you press send.', 3),
    ('plain-steps', 'Plain Steps', 'A routine, one small step at a time.', 4),
    ('idea-room', 'Idea Room', 'Test an idea for two weeks. Every voice counts.', 5),
    ('cat-factory', 'Cat Factory', 'A parody. Six cats run a shift.', 6),
    ('soya-games', "Soya's Games", 'Three small games for little hands.', 7),
]
W = H = 1080
FPS, SECONDS = 30, 7
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def ease(t):  # slow at the end
    t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3


def ramp(t, a, b):  # 0 before a, 1 after b, smooth between
    return ease((t - a) / (b - a))


def gradient():
    y = np.arange(H, dtype=np.float32)[:, None] / H
    stops = [(0, (6, 5, 28)), (.35, (34, 12, 78)), (.62, (120, 28, 110)), (.82, (226, 64, 96)), (1, (255, 138, 74))]
    img = np.zeros((H, W, 3), np.float32)
    for c in range(3):
        img[..., c] = np.interp(y, [s[0] for s in stops], [s[1][c] for s in stops])
    # a low sun behind the cat
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.hypot(xx - W * .5, yy - H * .70)
    mask = np.clip((300 - d) / 2.5, 0, 1)
    sun = np.zeros_like(img); t = np.clip((yy - 400) / 600, 0, 1)
    sun[..., 0] = 255; sun[..., 1] = 206 - 140 * t; sun[..., 2] = 110 + 20 * t
    img = img * (1 - mask[..., None]) + sun * mask[..., None]
    img += (np.exp(-np.clip(d - 300, 0, None) / 220) * .30)[..., None] * np.array([255, 80, 90], np.float32)
    return img


def cat_layer():
    src = Image.open(os.path.join(ROOT, 'assets', 'soycatory-cat.jpg')).convert('RGB')
    a = np.asarray(src).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = .3 * r + .59 * g + .11 * b
    m = Image.fromarray((((lum < 118) & (r >= b - 8)).astype(np.uint8)) * 255).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MedianFilter(9))
    eye = ((g > r + 35) & (g > b + 15)).astype(np.uint8) * 255
    box = (70, 10, 538, 476); S = 1.25
    cw, ch = int((box[2] - box[0]) * S), int((box[3] - box[1]) * S)
    mk = np.asarray(m.crop(box).resize((cw, ch), Image.LANCZOS).filter(ImageFilter.GaussianBlur(7))).astype(np.float32) / 255
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
    eyes = np.asarray(ey.filter(ImageFilter.GaussianBlur(1.6))).astype(np.float32) / 255
    full = np.zeros((H, W), np.float32); fe = np.zeros((H, W), np.float32)
    px, py = max(0, int(W * .5 - cw * .45)), H - ch + 30
    wd, hd = min(cw, W - px), min(ch, H - py)
    full[py:py + hd, px:px + wd] = mk[:hd, :wd]; fe[py:py + hd, px:px + wd] = eyes[:hd, :wd]
    return full, fe


def compose_base():
    img = gradient(); full, fe = cat_layer()
    blur = np.asarray(Image.fromarray((full * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(10))).astype(np.float32) / 255
    rim = np.clip(full - blur, 0, 1) * .8
    rim = np.asarray(Image.fromarray((np.clip(rim * 4, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32) / 255
    body = np.array([8, 6, 14], np.float32) + rim[..., None] * np.array([255, 90, 120], np.float32) * .32
    img = img * (1 - full[..., None]) + body * full[..., None]
    bloom = np.asarray(Image.fromarray((np.clip(fe, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(26))).astype(np.float32) / 255
    img += bloom[..., None] * np.array([30, 255, 90], np.float32) * .5
    img = img * (1 - fe[..., None] * .9) + np.array([140, 255, 150], np.float32) * fe[..., None] * .9
    v = np.hypot((np.arange(W)[None, :] - W / 2) / (W * .62), (np.arange(H)[:, None] - H * .5) / (H * .62))
    img *= np.clip(1.08 - .45 * v ** 2.2, .35, 1)[..., None]
    return np.clip(img, 0, 255).astype(np.uint8)


def text_layer(draw_fn):
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); draw_fn(ImageDraw.Draw(im)); return im


def tracked(dr, text, font, cx, y, track, fill):
    ws = [dr.textlength(c, font=font) for c in text]; tot = sum(ws) + track * (len(text) - 1); x = cx - tot / 2
    for c, w in zip(text, ws): dr.text((x, y), c, font=font, fill=fill); x += w + track


def fit(dr, text, path, size, maxw, track=0):
    while size > 24:
        f = ImageFont.truetype(path, size); w = sum(dr.textlength(c, font=f) for c in text) + track * (len(text) - 1)
        if w <= maxw: return f
        size -= 4
    return ImageFont.truetype(path, 24)


def frame(base, layers, t):
    out = base.astype(np.float32)
    # fade in from black over the first 0.7 s
    out *= ramp(t, 0, .7)
    for im, a, b, rise in layers:
        k = ramp(t, a, b)
        if k <= 0: continue
        shifted = im if rise == 0 else Image.new('RGBA', (W, H), (0, 0, 0, 0))
        if rise: shifted.paste(im, (0, int(rise * (1 - k))))
        arr = np.asarray(shifted).astype(np.float32); al = arr[..., 3:4] / 255 * k
        out = out * (1 - al) + arr[..., :3] * al
    return np.clip(out, 0, 255).astype(np.uint8)


def render(slug, title, line, number, fonts, outdir, base):
    jura_l, jura_m, mono = (os.path.join(fonts, n) for n in ('Jura-Light.ttf', 'Jura-Medium.ttf', 'GeistMono-Regular.ttf'))
    tmp = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    present = text_layer(lambda d: tracked(d, 'SOYCATORY PRESENTS', ImageFont.truetype(jura_m, 30), W / 2, 80, 12, (240, 224, 236, 235)))
    ft = fit(tmp, title.upper() if slug == 'soycatory' else title, jura_l, 130, 900, 10 if slug == 'soycatory' else 0)
    ttl = text_layer(lambda d: (tracked(d, title.upper(), ft, W / 2, 140, 22, (247, 238, 242, 255)) if slug == 'soycatory'
                                else d.text((W / 2 - sum(d.textlength(c, font=ft) for c in title) / 2, 140), title, font=ft, fill=(247, 238, 242, 255))))
    fl = fit(tmp, line, jura_m, 40, 900)
    sub = text_layer(lambda d: d.text((W / 2 - sum(d.textlength(c, font=fl) for c in line) / 2, 320), line, font=fl, fill=(240, 224, 236, 235)))
    tag = 'ONE APP A DAY' + ('' if number is None else '   ·   APP %d' % number)
    foot = text_layer(lambda d: tracked(d, tag, ImageFont.truetype(mono, 26), W / 2, 410, 10, (255, 170, 130, 240)))
    layers = [(present, .5, 1.3, 0), (ttl, 1.2, 2.4, 24), (sub, 2.8, 3.9, 12), (foot, 4.6, 5.6, 0)]
    path = os.path.join(outdir, slug + '.mp4')
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '%dx%d' % (W, H), '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-crf', '23', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', path], stdin=subprocess.PIPE)
    for i in range(FPS * SECONDS):
        p.stdin.write(frame(base, layers, i / FPS).tobytes())
    p.stdin.close(); p.wait()
    return path


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--fonts', required=True); ap.add_argument('--out', default=os.path.join(ROOT, 'assets', 'intros')); ap.add_argument('--only')
    ap.add_argument('--brief', help='a studio brief (factory/studio/brief.example.json): make just that app\'s intro')
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True); base = compose_base()
    todo = APPS
    if a.brief:
        import json
        br = json.load(open(a.brief)); todo = [(br['slug'], br['title']['en'], br['line']['en'].split('. ')[0].rstrip('.') + '.', br.get('number'))]
    for slug, title, line, number in todo:
        if a.only and a.only != slug: continue
        print(render(slug, title, line, number, a.fonts, a.out, base)); sys.stdout.flush()
