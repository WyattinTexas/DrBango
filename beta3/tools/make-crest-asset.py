#!/usr/bin/env python3
"""Cut THE PROFILE CREST (v0.123.0, the home corners) from the home door's
own painting into beta3/art/crest.webp — the small round gold medallion that
replaced the meadow's top-right name pill (Skylar 10/23: "the profile button
in the top right doesn't fit either"). The game draws the player's initial
on its face; the art carries no letter.

Source: beta3/art/hbtn.webp (814x270, the B3 Gold Face v3 door — Skylar's
10/20 pick), so the crest is the door's gold, not a new drawing:
- THE RIM is TRANSPLANTED, not drawn: the gold slab's outline around the
  door's LEFT END (the straight top edge, the rounded end, the straight
  bottom edge) is traced off the painting and parametrised by arc length;
  every crest pixel within RIM source px of the circle's edge samples the
  painting at the same depth along the slab edge's inward normal. So the
  crest wears the door end's exact bevel and lighting — the cream highlight
  where the slab faces up, the amber shoulder at the end, the dark brown
  underside — bent round a circle. The right half is the left half
  mirrored (the door's ends are mirror twins), so the seam at the top and
  bottom lands on a straight edge and never shows.
- THE FACE is the plain middle of the slab (swirl-free, x 300..514), mapped
  1:1 onto the disc: the painting's own top-lit gradient and gold dust. A
  FEATHER blends the rim's inner edge into it.
- THE FRAME is the door's plum surround and gold hairline: the painting's
  radial profile above the slab's top edge (column x 407), swept round.
- A GLINT (the four-point spark perched on the door frame's corners) is lifted
  off the painting's bottom-left corner and set on the hairline, top right.

TRUE SIZE: the crest shows at 46 design units; the largest consumer is an
iPad at 2x (46 * 820/420 * 2 ~= 180 device px) and a 440-wide phone at 3x
(~145 px) — so 256 square ships. Rendered at 3x and downsampled (premultiplied)
for a clean antialiased edge.

Run:  python3 tools/make-crest-asset.py   (prints the geometry it traced)
"""
import math
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'art', 'hbtn.webp')
OUT = os.path.join(HERE, '..', 'art', 'crest.webp')
N = 256          # shipped square
SS = 3           # supersample
RIM = 24.0       # source px of slab edge transplanted onto the crest's rim
FEATHER = 14.0   # source px over which the rim melts into the face
FRAME = 15.0     # source px of plum surround + hairline outside the slab

src = np.asarray(Image.open(SRC).convert('RGBA')).astype(np.float64)
SH, SW = src.shape[:2]
R, G, B, A = (src[..., i] for i in range(4))


def sample(xs, ys):
    """Bilinear RGBA sample of the painting at float coords (clamped)."""
    xs = np.clip(xs, 0, SW - 1.001)
    ys = np.clip(ys, 0, SH - 1.001)
    x0 = np.floor(xs).astype(int)
    y0 = np.floor(ys).astype(int)
    fx = (xs - x0)[..., None]
    fy = (ys - y0)[..., None]
    p = src
    return (p[y0, x0] * (1 - fx) * (1 - fy) + p[y0, x0 + 1] * fx * (1 - fy)
            + p[y0 + 1, x0] * (1 - fx) * fy + p[y0 + 1, x0 + 1] * fx * fy)


# ---- the slab's outline around the left end ---------------------------------
# gold slab: warm and opaque — the cream highlight on the top edge counts,
# the white core of a spark does not (it is barely warmer than it is blue)
slab = (A > 200) & (R > 70) & (R - B > 45)
# the frame's gold hairline is slab-coloured too: thin runs are not the slab
best, run = (0, 0), None
for y in range(SH + 1):
    on = y < SH and slab[y, SW // 2]
    if on and run is None:
        run = y
    elif not on and run is not None:
        if y - run > best[1] - best[0]:
            best = (run, y)
        run = None
TOP, BOT = best[0], best[1] - 1                              # 32, 245
CY = (TOP + BOT) / 2.0
RHO = (BOT - TOP) / 2.0                                      # slab half-height = the crest's slab radius
CX = 118.0   # a point inside the left end; the straight edges have begun here
phis = np.radians(np.linspace(90, 270, 721))
radii = []
for ph in phis:
    dx, dy = math.cos(ph), -math.sin(ph)
    r = 0.0
    while True:   # march out until the slab ends (a convex end: the first exit)
        x, y = CX + dx * (r + 0.25), CY + dy * (r + 0.25)
        if not (0 <= x < SW and 0 <= y < SH) or not slab[int(round(y)), int(round(x))]:
            break
        r += 0.25
    radii.append(r)
radii = np.array(radii)
# a spark that touches the slab can spike a ray: median, then a soft mean
k = 9
pad = np.pad(radii, k, mode='edge')
radii = np.array([np.median(pad[i:i + 2 * k + 1]) for i in range(len(radii))])
pad = np.pad(radii, 4, mode='edge')
radii = np.convolve(pad, np.ones(9) / 9, mode='valid')
px = CX + radii * np.cos(phis)
py = CY - radii * np.sin(phis)
seg = np.hypot(np.diff(px), np.diff(py))
arc = np.concatenate([[0], np.cumsum(seg)])
arc /= arc[-1]
tx = np.gradient(px)
ty = np.gradient(py)
tl = np.hypot(tx, ty)
nx, ny = -ty / tl, tx / tl                                   # a normal…
flip = (nx * (CX - px) + ny * (CY - py)) < 0                 # …turned inward
nx[flip] *= -1
ny[flip] *= -1
print('slab top %d bottom %d  rho %.1f  left-end outline x %.1f..%.1f' % (TOP, BOT, RHO, px.min(), px.max()))

# ---- the crest --------------------------------------------------------------
M = N * SS
c = (M - 1) / 2.0
k_out = (M / 2.0 - 2 * SS) / (RHO + FRAME)                  # output px per source px
v, u = np.mgrid[0:M, 0:M].astype(np.float64)
dx = u - c
dy = v - c
rs = np.hypot(dx, dy) / k_out                                # radius in source px
th = np.degrees(np.arctan2(-dy, dx)) % 360                   # 0 = right, 90 = up
th = np.where(th > 270, th - 360, th)                        # (-90, 270]
thl = np.where(dx > 0, 180 - th, th)                         # mirror the right half onto the left
t = np.clip((thl - 90) / 180.0, 0, 1)
ti = np.interp(t, arc, np.arange(len(arc)))
i0 = np.clip(np.floor(ti).astype(int), 0, len(arc) - 2)
f = ti - i0


def lerp_arr(a):
    return a[i0] * (1 - f) + a[i0 + 1] * f


Px, Py, Nx, Ny = lerp_arr(px), lerp_arr(py), lerp_arr(nx), lerp_arr(ny)
d_in = RHO - rs
# the rim, transplanted along the edge normal
rim = sample(Px + Nx * np.clip(d_in, 0, RIM), Py + Ny * np.clip(d_in, 0, RIM))
# the face, the plain middle of the slab mapped 1:1
face = sample(SW / 2.0 + dx / k_out, CY + dy / k_out)
w = np.clip((d_in - (RIM - FEATHER)) / FEATHER, 0, 1)[..., None]
w = w * w * (3 - 2 * w)                                      # smoothstep
gold = rim * (1 - w) + face * w
# the frame: the painting's own profile above the top edge, swept round
d_out = np.clip(rs - RHO, 0, FRAME + 2)
frame = sample(np.full_like(d_out, SW / 2.0), TOP - d_out)
out = np.where((d_in >= 0)[..., None], gold, frame)
out[..., 3] = np.where(d_in >= 0, 255, out[..., 3])
out[..., 3] = np.where(rs > RHO + FRAME + 1.5, 0, out[..., 3])

img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGBA')

# ---- the glint ----------------------------------------------------------------
# the four-point spark on the door frame's bottom-left corner, lifted by its
# own light (alpha = how far a pixel stands above the plum it sits on)
gx0, gy0, gs = 30, 222, 40
patch = src[gy0:gy0 + gs, gx0:gx0 + gs]
lum = patch[..., 0] * 0.299 + patch[..., 1] * 0.587 + patch[..., 2] * 0.114
ga = np.clip((lum - 150) / 90.0, 0, 1) * (patch[..., 3] / 255.0)
gl = np.dstack([patch[..., :3], ga * 255]).astype(np.uint8)
glint = Image.fromarray(gl, 'RGBA')
gsz = int(round(gs * k_out * 0.8))
glint = glint.resize((gsz, gsz), Image.LANCZOS)
gang = math.radians(48)
gr = (RHO + FRAME - 1) * k_out
gcx, gcy = c + gr * math.cos(gang), c - gr * math.sin(gang)
img.alpha_composite(glint, (int(round(gcx - gsz / 2)), int(round(gcy - gsz / 2))))

img = img.convert('RGBa').resize((N, N), Image.LANCZOS).convert('RGBA')
img.save(OUT, 'WEBP', quality=92, method=6)
print('wrote %s  %dx%d  %d bytes' % (os.path.relpath(OUT), N, N, os.path.getsize(OUT)))
