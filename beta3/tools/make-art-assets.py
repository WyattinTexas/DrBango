#!/usr/bin/env python3
"""Cut the Midjourney winners into game-ready assets for STARSPELL ?art=1."""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np, os

DL  = os.environ.get("MJ_DIR", "/Users/admin/Downloads")
OUT = "/Users/admin/DrBango/beta3/art"
os.makedirs(OUT, exist_ok=True)

BTN_SRC  = DL + "/u9877896886_fantasy_word-game_UI_button_wide_rounded_rectangl_fb0dbbe1-24ae-4f62-93f5-efe0d93b1a30_1.png"
TILE_SRC = DL + "/u9877896886_set_of_fantasy_game_UI_buttons_in_matching_style__b9c62610-6f9a-4f68-81d7-7b95546b9494_0.png"

# palette the existing UI actually uses, for grading targets
GOLD_UI = np.array([0xd7, 0xb4, 0x5c], float)   # #d7b45c, the shipped gold


# ---------------------------------------------------------------- BUTTON
def build_button():
    im = Image.open(BTN_SRC).convert("RGB")
    L, T, R, B = 452, 193, 1079, 537
    btn = im.crop((L, T, R, B))          # 627 x 344, gold frame flush to the edges
    W, H = btn.size
    RAD = 96

    # supersampled rounded-rect mask so the edge is clean at any scale
    SS = 4
    m = Image.new("L", (W * SS, H * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, W * SS - 1, H * SS - 1], RAD * SS, fill=255)
    m = m.resize((W, H), Image.LANCZOS)
    # pull the mask in by a hair so no canvas-grey fringe survives on the bevel
    m = Image.fromarray(np.clip((np.asarray(m).astype(float) - 26) * 1.35, 0, 255).astype(np.uint8))

    out = btn.convert("RGBA")
    out.putalpha(m)
    out.save(OUT + "/btn.png")

    # btndark: same frame, cooled and dimmed so the hierarchy still reads
    a = np.asarray(btn).astype(float)
    lum = (0.2126 * a[:, :, 0] + 0.7152 * a[:, :, 1] + 0.0722 * a[:, :, 2])
    cool = np.dstack([lum * 0.62, lum * 0.70, lum * 0.92])           # silver-blue
    goldness = np.clip((a[:, :, 0] - a[:, :, 2] - 30) / 90.0, 0, 1)[:, :, None]
    dark = a * (1 - goldness) * 0.72 + cool * goldness
    dk = Image.fromarray(np.clip(dark, 0, 255).astype(np.uint8)).convert("RGBA")
    dk.putalpha(m)
    dk.save(OUT + "/btndark.png")
    print("btn.png / btndark.png  %dx%d  radius %d" % (W, H, RAD))


# ---------------------------------------------------------------- TILES
def build_tiles(CALM=0.75):
    sheet = Image.open(TILE_SRC).convert("RGB")
    # r0c1 — the cleanest pale tile; squared off (source is 287x301)
    tile = sheet.crop((531, 88, 818, 389)).resize((300, 300), Image.LANCZOS)
    a = np.asarray(tile).astype(float)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]

    # --- kill the baked sparkle: it lands exactly on the tile's point value ---
    # the sparkle is a bright ADD-like blob low-right; damp it toward the local face
    yy, xx = np.mgrid[0:300, 0:300]
    lum0 = 0.2126 * r + 0.7152 * g + 0.0722 * b
    spark = np.exp(-(((xx - 212) / 62.0) ** 2 + ((yy - 217) / 62.0) ** 2))
    bright = np.clip(lum0 - 205, 0, 255) / 26.0      # regional median is 196
    kill = np.clip(spark * bright, 0, 1)[:, :, None]
    # inpaint from a heavily blurred copy so the local gradient continues through,
    # rather than a flat fill which leaves a visible patch
    soft = np.asarray(Image.fromarray(a.astype(np.uint8))
                      .filter(ImageFilter.GaussianBlur(26))).astype(float)
    a = a * (1 - kill) + soft * kill

    # --- separate the untinted overlay (gold rim + specular) from the tintable face ---
    # NB the face itself is warm pink (r-b ~= 17), so the hue threshold has to clear that;
    # r > b+22 is the value proven in the tint test. The rim proper is only ~11 px thick.
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    goldness = ((r > b + 22) & (r > 120)).astype(float)
    edge = np.minimum.reduce([xx, yy, 299 - xx, 299 - yy]).astype(float)
    ring = np.clip((11 - edge) / 8.0, 0, 1)
    # Keep ONLY the rim and the broad top sheen untinted. The warm cloud band sits mid-tile and
    # also passes the hue test — leaving it in the overlay makes it immune to both the tier
    # colour and the calm pass, which is what made it read as a repeated streak on the board.
    topmask = np.clip((78 - yy) / 40.0, 0, 1)
    over_a = np.clip(np.maximum(goldness * topmask, ring), 0, 1)
    over_a = np.asarray(Image.fromarray((over_a * 255).astype(np.uint8))
                        .filter(ImageFilter.GaussianBlur(1.6))).astype(float) / 255.0

    # round the outer corners of both layers to the tile's own radius
    SS, RAD = 4, 46
    m = Image.new("L", (300 * SS, 300 * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, 300 * SS - 1, 300 * SS - 1], RAD * SS, fill=255)
    m = np.asarray(m.resize((300, 300), Image.LANCZOS)).astype(float) / 255.0

    over = np.dstack([a, over_a * 255 * m]).astype(np.uint8)
    Image.fromarray(over, "RGBA").save(OUT + "/tile_over.png")

    # face = the glass body as raw luminance; the engine multiplies a tier colour through it,
    # so it must NOT be contrast-lifted or every tint blows out to white
    lum = np.clip(0.2126 * r + 0.7152 * g + 0.0722 * b, 0, 255)

    # CALM PASS — 16 identical tiles sit on the board at once, so any horizontal streak in the
    # painting (the cloud band, the top-right blob) reads as a repeated asset rather than glass.
    # A vertical-only blur flattens horizontal detail while leaving the top-to-bottom gradient
    # and the broad corner sheen intact.
    li = Image.fromarray(lum.astype(np.uint8))
    vblur = np.asarray(li.filter(ImageFilter.GaussianBlur(0)).transpose(Image.ROTATE_90)
                       .filter(ImageFilter.GaussianBlur(16))
                       .transpose(Image.ROTATE_270)).astype(float)
    lum = lum * (1 - CALM) + vblur * CALM

    face = np.dstack([lum, lum, lum, m * 255]).astype(np.uint8)
    Image.fromarray(face, "RGBA").save(OUT + "/tile_face.png")
    print("tile_face.png / tile_over.png  300x300  radius %d  (sparkle removed)" % RAD)


build_button()
build_tiles(CALM=float(__import__("os").environ.get("CALM","0.75")))
for f in sorted(os.listdir(OUT)):
    print("   %-16s %6.1f KB" % (f, os.path.getsize(OUT + "/" + f) / 1024))
