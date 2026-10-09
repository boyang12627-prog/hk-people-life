"""Composite an era news picture into a Q scene's TV glass (offline art tool, not run at build time).
usage: python3 scripts/tv-composite.py SCENE.webp PICTURE.jpg OUT.webp x0,y0,x1,y1,x2,y2,x3,y3 [cropcx]
Quad corners are source pixels TL,TR,BR,BL of the glass. The picture is cropped to the glass aspect
around cropcx (fraction of width), rounded like a CRT, softened, scanlined, vignetted, perspective-warped
into the glass, and the original glass highlight is screened back over it.

Measured glass quads (1280x720 sources, boy = girl):
  tv   1018,314,1100,310,1100,444,1018,434   (1986 -> tv1986-*.webp, picture centred at 0.52)
  bag  1069,171,1171,173,1170,313,1071,306
  rest 1052,154,1191,151,1192,291,1052,293   (rest-girl redraw; boy same spot)
  draw 860,82,1049,82,1049,220,860,218
  play 633,155,776,151,774,255,635,257
  home1996 363,219,518,219,520,337,362,337   (redrawn 1996 home, TV on the LEFT; boy+girl same spot; picture = countdown with digits painted out)
Made with: tv1984/tv1985/tvoff on the tv quad grown 1.5px (1016.5,312.5,1101.5,308.5,1101.5,445.5,1016.5,435.5) so no lit rim shows; tv1984/tv1985 HL=0.2 cx 0.5; tvoff = a dark glass gradient with a soft diagonal reflection,
HL=0.12 BLUR=0.5; rest1988 HL=0 cx 0.42; home1996 HL=0 cx 0.48 (countdown board digits painted out first).
"""
import os
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

scene_p, pic_p, out_p, q = sys.argv[1:5]
cx = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
BLUR = float(os.environ.get("BLUR", "1.6"))  # env HL scales the original glass highlight (0 = none)
Q = [tuple(map(float, q.split(",")[i:i + 2])) for i in range(0, 8, 2)]
scene = Image.open(scene_p).convert("RGB")
pic = Image.open(pic_p).convert("RGB")
W, H = scene.size
d = lambda a, b: np.hypot(a[0] - b[0], a[1] - b[1])
gw = (d(Q[0], Q[1]) + d(Q[3], Q[2])) / 2
gh = (d(Q[0], Q[3]) + d(Q[1], Q[2])) / 2
# crop to the glass aspect around the focal point
ph = pic.height; pw = round(ph * gw / gh)
if pw > pic.width: pw = pic.width; ph = round(pw * gh / gw)
left = min(max(0, round(cx * pic.width - pw / 2)), pic.width - pw)
tex = pic.crop((left, (pic.height - ph) // 2, left + pw, (pic.height - ph) // 2 + ph))
TW, TH = 600, round(600 * gh / gw)
tex = tex.resize((TW, TH), Image.LANCZOS).filter(ImageFilter.GaussianBlur(BLUR))
a = np.asarray(tex).astype(float) / 255
# CRT: slight bloom, faint scanlines, vignette, a little cool tint
a = a * 0.9 + np.asarray(tex.filter(ImageFilter.GaussianBlur(8))).astype(float) / 255 * 0.15
yy, xx = np.mgrid[0:TH, 0:TW]
a *= (1 - 0.1 * (np.sin(yy / TH * TH / 9 * 2 * np.pi) > 0.3))[..., None]
r = np.hypot((xx - TW / 2) / (TW / 2), (yy - TH / 2) / (TH / 2))
a *= np.clip(1.08 - 0.42 * r ** 2.2, 0.35, 1)[..., None]
a = a * [0.96, 0.98, 1.02]
tex = Image.fromarray((np.clip(a, 0, 1) * 255).astype("uint8"))
mask = Image.new("L", (TW * 4, TH * 4), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, TW * 4 - 1, TH * 4 - 1), radius=round(TW * 4 * 0.11), fill=255)
mask = mask.resize((TW, TH), Image.LANCZOS)

def coeffs(src, dst):  # PIL wants output->input: maps dst (scene) points to src (texture) points
    A, B = [], []
    for (x, y), (u, v) in zip(dst, src):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]; B += [u, v]
    return np.linalg.solve(np.array(A), np.array(B)).tolist()

c = coeffs([(0, 0), (TW, 0), (TW, TH), (0, TH)], Q)
S = 3  # supersample the warp
big = [(x * S, y * S) for x, y in Q]
cb = coeffs([(0, 0), (TW, 0), (TW, TH), (0, TH)], big)
wt = tex.transform((W * S, H * S), Image.PERSPECTIVE, cb, Image.BICUBIC).resize((W, H), Image.LANCZOS)
wm = mask.transform((W * S, H * S), Image.PERSPECTIVE, cb, Image.BICUBIC).resize((W, H), Image.LANCZOS)
o = np.asarray(scene).astype(float) / 255
t = np.asarray(wt).astype(float) / 255
m = np.asarray(wm).astype(float)[..., None] / 255
# glass highlight from the original painting: its brightness above the glass's median, screened on
lum = o.mean(2)
inside = m[..., 0] > 0.5
hl = np.clip((lum - np.median(lum[inside])) * 1.6, 0, 1)[..., None] * float(os.environ.get("HL", "0.55"))
t = 1 - (1 - t) * (1 - hl)
res = o * (1 - m * 0.97) + t * m * 0.97
Image.fromarray((np.clip(res, 0, 1) * 255).astype("uint8")).save(out_p, "WEBP", quality=80, method=6)
