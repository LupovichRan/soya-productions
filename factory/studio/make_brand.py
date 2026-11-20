#!/usr/bin/env python3
"""Soycatory share card: a 1200x630 picture for a post or a link preview, in the dusk look, with Soya's silhouette.

  python3 factory/studio/make_brand.py --brief brief.json --fonts /path/to/fonts --out assets/brand

Needs Python 3 with numpy and Pillow, the cat photo assets/soycatory-cat.jpg, and a fonts folder holding
Jura-Light.ttf, Jura-Medium.ttf and GeistMono-Regular.ttf. Text is Latin only; the Hebrew card is not made here."""
import argparse, json, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def blur(a, r): return np.asarray(Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) / 255


def card(title, line, tag, fonts):
    y = np.arange(H, dtype=np.float32)[:, None] / H
    stops = [(0, (6, 5, 28)), (.4, (34, 12, 78)), (.72, (120, 28, 110)), (1, (240, 110, 80))]
    img = np.zeros((H, W, 3), np.float32)
    for c in range(3): img[..., c] = np.interp(y, [s[0] for s in stops], [s[1][c] for s in stops])
    src = Image.open(os.path.join(ROOT, 'assets', 'soycatory-cat.jpg')).convert('RGB')
    a = np.asarray(src).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = .3 * r + .59 * g + .11 * b
    m = Image.fromarray((((lum < 118) & (r >= b - 8)).astype(np.uint8)) * 255).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MedianFilter(9))
    eye = ((g > r + 35) & (g > b + 15)).astype(np.uint8) * 255
    box = (70, 10, 538, 476); S = 1.12
    cw, ch = int((box[2] - box[0]) * S), int((box[3] - box[1]) * S)
    mk = np.clip((np.asarray(m.crop(box).resize((cw, ch), Image.LANCZOS).filter(ImageFilter.GaussianBlur(5))).astype(np.float32) / 255 - .5) * 9 + .5, 0, 1)
    em = np.asarray(Image.fromarray(eye).crop(box)) > 0
    ey = Image.new('L', (cw, ch), 0); ed = ImageDraw.Draw(ey); ys, xs = np.nonzero(em); mid = int((xs.min() + xs.max()) / 2)
    for lo, hi in ((0, mid), (mid, em.shape[1])):
        yy, xx = np.nonzero(em[:, lo:hi])
        if len(xx):
            cx, cy = (xx.mean() + lo) * S, yy.mean() * S; rr = (xx.max() - xx.min()) / 2 * S + 3
            ed.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=255); ed.ellipse([cx - rr * .2, cy - rr * .82, cx + rr * .2, cy + rr * .82], fill=90)
    eyes = np.asarray(ey.filter(ImageFilter.GaussianBlur(1.3))).astype(np.float32) / 255
    full = np.zeros((H, W), np.float32); fe = np.zeros((H, W), np.float32)
    px, py = W - cw - 40, H - ch + 20
    wd, hd = min(cw, W - px), min(ch, H - py); full[py:py + hd, px:px + wd] = mk[:hd, :wd]; fe[py:py + hd, px:px + wd] = eyes[:hd, :wd]
    rim = blur(np.clip((full - blur(full, 8)) * .8 * 4, 0, 1), 1.2)
    body = np.array([8, 6, 14], np.float32) + rim[..., None] * np.array([255, 90, 120], np.float32) * .3
    img = img * (1 - full[..., None]) + body * full[..., None]
    img += blur(fe, 20)[..., None] * np.array([30, 255, 90], np.float32) * .5
    img = img * (1 - fe[..., None] * .9) + np.array([140, 255, 150], np.float32) * fe[..., None] * .9
    v = np.hypot((np.arange(W)[None, :] - W / 2) / (W * .66), (np.arange(H)[:, None] - H * .5) / (H * .66)); img *= np.clip(1.08 - .45 * v ** 2.2, .4, 1)[..., None]
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(im)
    jl, jm, mono = (os.path.join(fonts, n) for n in ('Jura-Light.ttf', 'Jura-Medium.ttf', 'GeistMono-Regular.ttf'))
    d.text((70, 70), 'SOYCATORY PRESENTS', font=ImageFont.truetype(mono, 24), fill=(255, 170, 130))
    size = 96
    while size > 40 and d.textlength(title, font=ImageFont.truetype(jl, size)) > 700: size -= 4
    ft = ImageFont.truetype(jl, size); d.text((70, 120), title, font=ft, fill=(247, 238, 242))
    fl = ImageFont.truetype(jm, 32); words, lines, cur = line.split(), [], ''
    for w_ in words:
        t = (cur + ' ' + w_).strip()
        if d.textlength(t, font=fl) <= 640: cur = t
        else: lines.append(cur); cur = w_
    if cur: lines.append(cur)
    yy = 120 + size + 28
    for ln in lines[:3]: d.text((70, yy), ln, font=fl, fill=(240, 224, 236)); yy += 44
    d.text((70, H - 70), tag, font=ImageFont.truetype(mono, 24), fill=(255, 170, 130))
    return im


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--brief', required=True); ap.add_argument('--fonts', required=True); ap.add_argument('--out', default=os.path.join(ROOT, 'assets', 'brand'))
    a = ap.parse_args(); br = json.load(open(a.brief)); os.makedirs(a.out, exist_ok=True)
    tag = 'ONE APP A DAY  ·  ' + ('APP %d' % br['number'] if br.get('number') else 'SOYCATORY')
    path = os.path.join(a.out, br['slug'] + '.png'); card(br['title']['en'], br['line']['en'].split('. ')[0].rstrip('.') + '.', tag, a.fonts).save(path, optimize=True); print(path)
