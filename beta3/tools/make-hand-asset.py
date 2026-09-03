#!/usr/bin/env python3
"""Cut the FTUE tutorial hand (v0.75.0) from Skylar's attachment into
beta3/art/hand.webp — the friendly finger that walks a brand-new player
through their first word (see the first-open flow in game.js).

Source: ~/jumpr/attachments/ss-0902-hand.png (2134x1615 RGBA — a white
cartoon glove pointing left-and-down). Kept OUT of the repo like every MJ
source (the Pages size budget).

The MJ-asset-cutting law, applied:
- ALPHA: the source arrives with an authored alpha already (background
  fully transparent, ~12k mid-alpha pixels = a 1-2px antialiased sticker
  edge, measured 2026-09-02) — so no colour key is needed; the mask is
  verified, not assumed: the script refuses a source whose corners are
  opaque.
- BAKED LIGHTING: none to cut — the black outline is the design, and there
  is no drop shadow (the engine fades/moves the sprite; a baked shadow
  would peel).
- TRUE SIZE: displayed ~92 design units wide; the largest consumer is an
  iPad at 2x (92 * 820/420 * 2 ~= 359 device px) and a 440-wide phone at
  3x (~289 px), so the cut ships 512 wide.
- THE TIP: the game anchors the sprite by the FINGERTIP (setOrigin), so a
  point() call lands the tip exactly on its target. The tip is the
  leftmost opaque pixel of the content; its normalized coords are printed
  and pinned in game.js as SS_FTUE_TIP.

Run:  python3 tools/make-hand-asset.py
"""
import os
import sys
from PIL import Image

SRC = os.path.expanduser('~/jumpr/attachments/ss-0902-hand.png')
OUT = os.path.join(os.path.dirname(__file__), '..', 'art', 'hand.webp')
W_OUT = 512
PAD = 10  # content margin (source px) so the antialiased edge never kisses the frame

im = Image.open(SRC).convert('RGBA')
a = im.split()[3]

# the law: verify the mask instead of assuming it
corners = [im.getpixel((x, y))[3] for x, y in
           [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]]
if max(corners) > 8:
    sys.exit('source corners are opaque — this cut expects an authored alpha; key it first')

bbox = a.getbbox()
x0 = max(0, bbox[0] - PAD); y0 = max(0, bbox[1] - PAD)
x1 = min(im.width, bbox[2] + PAD); y1 = min(im.height, bbox[3] + PAD)
cut = im.crop((x0, y0, x1, y1))

# fingertip = leftmost opaque pixel of the content (the finger points left);
# scan columns from the left, take the mid-point of the first column's run
ca = cut.split()[3]
px = ca.load()
tip = None
for x in range(cut.width):
    ys = [y for y in range(cut.height) if px[x, y] > 128]
    if ys:
        tip = (x, (min(ys) + max(ys)) / 2)
        break
if tip is None:
    sys.exit('no opaque content found')

h_out = round(cut.height * W_OUT / cut.width)
out = cut.resize((W_OUT, h_out), Image.LANCZOS)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
out.save(OUT, 'WEBP', quality=82, method=6)

tx, ty = tip[0] / cut.width, tip[1] / cut.height
print(f'cut {cut.width}x{cut.height} -> {W_OUT}x{h_out}  {os.path.getsize(OUT)} bytes')
print(f'fingertip origin (normalized): ({tx:.4f}, {ty:.4f})  <- pin as SS_FTUE_TIP in game.js')
