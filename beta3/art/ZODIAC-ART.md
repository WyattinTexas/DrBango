# STARSPELL — ZODIAC SIGN ART · prompt formula & spec · v1 · 2026-08-25
Status: SHIPPED v0.58.0 2026-08-31 (task 47) — all 12 cut into art/zod_<id>.webp by
tools/zod-export.mjs from the default picks in ~/starspell-jumpr/ref/zodiac-mj/PICKS.md;
review sheet skypilot82.github.io/starspell-zodiac-review. Sagittarius still the reroll
candidate. Previously: ANCHOR LOCKED 2026-08-25 — style B (flat-vector constellation), frame B2 =
cdn.midjourney.com/7ad41d09-9759-4ade-a9d1-fcf641eb8983/0_1.webp (Skylar's pick).
FROZEN FORMULA (only [SUBJECT]+[TINT] swap): "flat vector illustration, [SUBJECT] formed of
glowing [TINT] constellation stars [ACTION] across a twilight sky, layered indigo violet plum
rose gradient dusk, silhouetted meadow hills and fireflies below, clean simple shapes, dreamy
storybook night, full body visible --ar 2:3 --s 100 --style raw --v 6.1 --sref <B2 url>"
Tints: fire=golden ember · earth=golden-green · air=pale silver-blue · water=aquamarine teal.
Remaining 11 fired 8/25 with this formula — ALL 11 RENDERED, verified on /organize (no phantoms),
full-res in scratchpad as zod_<sign><0-3>.webp. Job UUIDs (sign → uuid):
taurus 3c32fa10-7371-451a-82d4-8f9ca2c3a308 · gemini a81c3e0d-1bbf-4262-bc58-791cddfdd82f ·
cancer e872a6ea-f473-4f65-b37d-b2d4b35a530f · leo a1f96c0a-2804-48dc-a9b5-d225f541c701 ·
virgo 7963eebe-c0d3-4d9f-b5c7-3f23aa2f7d5c · libra c690610e-be0c-40cd-bb7f-7252da4790f3 ·
scorpio 7b92fdb0-9998-4a22-962b-6569128ffb04 · sagittarius b593707c-8bb1-4154-8d77-bc50fc1e7b83 ·
capricorn bb5ea51e-f4f4-456c-92d8-8143192cb7a1 · aquarius 2f5a1fb9-e742-4cd7-82e3-3fa477ae2cf7 ·
pisces e75cd48b-d953-49e9-ad7f-dc659c6180b4 · (aries = the anchor job 7ad41d09, frame 0_1)
Set notes 8/25: coherence excellent (same dusk palette/hills/fireflies throughout). Element
tints mostly did NOT take — nearly everything renders warm gold (scorpio/cancer pick up some
violet). Fine for coherence; element color can come from the in-game glyph tint instead.
Weak spots: SAGITTARIUS reads as horse+rider more than centaur-archer (bow only clear in one
frame) — likeliest reroll; AQUARIUS frame 2 lost the figure (jar alone, arguably elegant).

## Where these live
12 images, one per SS_ZODIAC sign (data.js). Surfaces: the sign-pick sheet before a
campaign (primary), possibly the campaign door + STAR-CROSSED moments later.
Constellation asterisms are KEPT — the art sits behind/beside them, never replaces them.

## The mood law (from SKY-DESIGN.md)
Dreamy, not techy. Wishes, not lasers. Warmth over void. The sign is a celestial being
of starlight over the game's own twilight gradient (indigo #10142e → violet #3a3068 →
plum #6b4585 → rose #c96a8e → horizon gold #ffc98a). Gold UI frames (btn.webp) are the
chrome it must sit inside.

## Element tints (SS_ELEMENTS — the per-sign color lever)
- fire  #ffa94d — warm amber/ember glow      (Aries, Leo, Sagittarius)
- earth #a8d883 — soft spring green           (Taurus, Virgo, Capricorn)
- air   #9fc4ff — pale sky blue               (Gemini, Libra, Aquarius)
- water #6fe0d0 — teal glass                  (Cancer, Scorpio, Pisces)

## The formula (template — [SUBJECT] and [ELEMENT GLOW] swap per sign)
> [STYLE ANCHOR], a great celestial [SUBJECT] formed of [ELEMENT GLOW] starlight and
> constellation lines, over a twilight sky gradient of indigo violet plum and rose,
> tiny stars, above a darkened meadow horizon, dreamy gentle wonder, storybook magic,
> full body visible, --ar 2:3 [PARAMS]

Human-shaped signs (Gemini twins, Virgo, Aquarius, Sagittarius): faceless glowing
star-figures / silhouettes — never rendered faces (MJ face mush + spiritkin
"not a human not a child" lesson, softened to "faceless luminous figure").

## Subjects per sign
aries RAM (fire) · taurus BULL (earth) · gemini TWIN STAR-FIGURES (air) ·
cancer CRAB (water) · leo LION (fire) · virgo MAIDEN, faceless (earth) ·
libra SCALES (air) · scorpio SCORPION (water) · sagittarius ARCHER-CENTAUR
silhouette (fire) · capricorn SEA-GOAT (earth) · aquarius WATER-BEARER, faceless
(air) · pisces TWIN FISH circling (water)

## Anchor round (Aries ×4 style directions, fired 2026-08-25)
A watercolor  — loose watercolor illustration (proven Boo! formula) --v 6.1 --s 150
B flat-vector — matches meadow.png's layered flat shapes, --style raw --s 100
C star-spirit — body IS night sky, gold constellation outline, painterly --v 6.1
D gilded-card — tarot/storybook emblem, gold on midnight, matches UI frames --v 6.1 --s 150

## Anchor round RESULTS (2026-08-25, all 4 rendered, full-res pulled to scratchpad)
Job UUIDs (for --sref once one is picked; sref URL = cdn.midjourney.com/<uuid>/0_<n>.webp):
- A watercolor   42062fd1-7a48-4805-9d94-a10c063da11e — charming, but literal sheep; painterly
  texture fights the flat meadow; every frame added its own moon
- B flat-vector  7ad41d09-9759-4ade-a9d1-fcf641eb8983 — ★ RECOMMENDED: ram IS a constellation
  (stars+edges made flesh) over flat layered dusk hills + fireflies = matches meadow.png and the
  game fiction exactly; silhouette reads tiny; most repeatable across 12
- C star-spirit  28530d3d-3d91-4235-847b-9bc4df8dc836 — most spectacular; star-fur body + gold
  asterism overlay; realistic render may sit apart from the flat UI; runner-up
- D gilded-card  5fb499b8-bdcb-4b74-b322-d8288a1adf4c — engraved gold-on-midnight tarot; departs
  from twilight palette, frame doubles the UI's own gold frames; parked

## Pipeline laws once anchor is locked (feedback_mj-asset-cutting)
1 lock anchor → --sref <anchor url> for the other 11, frozen formula text
2 author masks, measure hues, cut baked lighting the engine animates
3 judge ALL 12 at true device size on the real pick sheet (review page on
  skypilot82.github.io) before wiring
4 export webp to art/zod_<id>.webp, load like existing art/*.webp?v=BUILD
