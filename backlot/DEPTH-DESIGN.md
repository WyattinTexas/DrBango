# BACKLOT — THE DEPTH WAVE
### far real · near meaningful · shapes hard — capability expansion v2 · 2026-08-11

**The brief (Wyatt, 8/11):** grow the environment creator toward the ASCENT look
(drbango.com/beta3/ascent.html — SKY-DESIGN.md is its law), but 3D. His diagnosis, verbatim:
*"outside of a short area you can look around, the far-away stuff feels a little fake, and the
close things just don't feel meaningful enough. We have to hit the shapes hard and precise."*
This wave upgrades the ENGINE (every pack benefits), proves it with a new Ascent-register pack,
and retrofits two existing packs. BACKLOT-DESIGN.md remains the base law; this doc extends it.

## 0 · Diagnosis (from the judge shots — eyes, not vibes)

Three failures, all engine-level, confirmed in `judge-*-kart45-s7.png`:

1. **FAR IS A PAINTING.** Real terrain ends at the 600 m tile; everything beyond is
   silhouettes painted on the sky dome at r 2600. Zero parallax — the moment the kart moves,
   the horizon rides with you like wallpaper. That is the "fake". Painted rows also wobble
   (sine-sum ridgelines) and the dome's equirect bands curve down at frame edges (bowl feel).
2. **NEAR IS A DEAD PLANE.** Inside the basin the floor is ONE flat hex for 130 m
   (`basinC`, `d<basin.r-4`). The bottom 40–55 % of every kart frame is empty colour.
   Props keep out by law, and nothing else was allowed in. Nothing near you means anything.
3. **SHAPES ARE NOISE.** Mid-ring scatter reads as confetti (random rects on aerial-mushed
   faces); ridgelines are summed sines; far value ramp is a smooth `mix()` — no authored
   silhouettes, no hard value steps. The Ascent mock is the opposite: ONE clean hill arc,
   crisp crescent, quantized value ladder.

## 1 · THE LADDER LAW (the one rule everything else serves)

Depth = a **monotonic, quantized value ladder** from the viewer to the sky: basin floor →
rim terrain → far shells (2–3 rungs) → sky horizon band. Every medium that renders distance
(terrain aerial mix, far props, shells, any remaining painted rows) takes its colour FROM the
ladder and never zig-zags value against it. `EL.depthLadder(nearHex, skyHex, n, gamma)` mints
the rungs; packs may break the ladder only ON PURPOSE (one dark accent silhouette max).
Hard steps between rungs, not smooth ramps — the 2D-layer look IS the quantization.

## 2 · FAR LAW — silhouette shells (kills the painting)

- **`Built.far`** — a third object beside `group`/`sky`: 2–3 concentric **ridge-silhouette
  ribbons** of REAL geometry at r ≈ 430 / 720 / 1180 m, each ONE flat unlit colour (a ladder
  rung), top edge = an authored `EL.ridgeline` profile, bottom skirt to y −30 (no void seam:
  from kart eye the tile edge at 300 m always has a shell wall behind it).
- Real geometry ⇒ real **parallax**: rings slide over each other as the kart moves. That one
  property is what "not fake" means.
- Shell materials: `MeshBasicMaterial{fog:false}` — their hexes already ARE the aerial ladder;
  scene fog must never re-wash them. DoubleSide for safety. ~2 k tris for all rings.
- Pack hook (data, not meshes): `farfield(params, rnd, pal) -> {floor, rings:[{r, crest,
  base?, hex, style, opts?, teeth?, segs?}]}`. No hook ⇒ no shells ⇒ pack byte-identical.
- New dial: **FAR LAYERS** (`farRings`, cyc 0/2/3, default 3, group WORLD). 0 = legacy dome-only.
- Dome demotion: packs that adopt shells keep at most ONE painted row (the farthest,
  beyond-parallax layer) and the sky itself; the dome stops pretending to be terrain.
- GLB: `far` is EXCLUDED by default (mirrors sky — engines own their distance), new header
  toggle "far in GLB"; recipe JSON regenerates shells exactly either way.

## 3 · SHAPE LAW — authored silhouettes (hit the shapes hard)

- **`EL.ridgeline(style, seed, opts) -> f(t∈[0,1) wraps)`** — the silhouette grammar. FEW,
  LARGE, DELIBERATE features placed on the circle (jittered even spacing, seam-safe by
  construction), composed by MAX (clean overlaps, like stacked paper). Styles:
  - `rolling` — raised-cosine arcs (the Ascent hill; meadow/poster registers)
  - `peaks` — skewed linear summits, sharp tips (alpine)
  - `mesa` — trapezoid slabs: flat top + straight ramps (HB register)
  - `dunes` — skewed sine crests
  plus `teeth` (conifer fringe overlay on shells, seeded per-tooth height).
- The same grammar drives shells AND any painted rows, so far shapes carry a pack's register
  instead of generic wobble. Noise octaves are for TERRAIN; silhouettes are AUTHORED.
- Props: silhouette-first stays law (§6 base doc); near-field props below get the same care —
  every new prop family is built from explicit profiles (lathe/cone/extrude), no noise blobs.

## 4 · NEAR LAW — the meaningful close field

Three layers, all inside or at the basin (BASIN LAW intact — nothing blocks a future track):

1. **Ground articulation** (terrain face colours, zero new tris):
   - `basinMottle:{scale, hexB, thresh}` — seeded 2-tone hard-edged patches on the basin
     floor (mown-meadow / sand-drift scale, 25–60 m). Amplitude whisper-quiet (ΔL ≤ 0.03):
     texture without stealing sprite readability.
   - `verge:{w, c}` — a designed colour band on the last `w` metres inside the rim; the
     basin edge reads as a drawn line, not a fade.
2. **Near-detail scatter class** — table flag `near:true` + dial **NEAR DETAIL**
   (`nearDetail`, 0–2, default 1, group PROPS). Near tables are allowed
   `insideBasinOK` on the OUTER basin annulus only (r ≥ 0.5·basinR), max height ~0.5 m,
   drivable-cosmetic: grass tufts, wildflowers, pebble triads. They scale with their own
   dial, not density (density stays the mid/far knob).
3. **Vignettes** — near/rim tables `make()` composed GROUPS (anchor + supports: stone + tufts
   + flowers), odd counts, left-heavy — deliberate arrangements you drive past, not sprinkle.
   Pattern, not engine change.

## 5 · SKY ADDITIONS (night register jewellery — engine helpers, any pack may use)

- `EL.sky.gradient(ctx,{stops, top, hor, dither, seed})` — multi-stop vertical gradient with
  per-scanline ±1.5 RGB dither. `EL.sky.grain(ctx,{alpha, seed})` — seeded noise tile over
  the whole canvas. (SKY-DESIGN banding law: smooth dark gradients band on OLED; grain is
  what makes it look expensive.) Mandatory for night-register packs.
- `EL.sky.starfield(ctx,{y0, y1, n, ramp, colors, seed})` — tiered stars with a density ramp
  (sparse at horizon → dense at zenith — the thickening sky sells the height), coloured
  (#cfd8ff base, warm #ffe9c9, rare pink #ffd1dc / mint #c9fff2), size/alpha tiers, plus
  `heroN` four-ray diffraction stars (the ones you'd wish on).
- `EL.sky.moon(ctx,{x, y, r, tilt, color, bg, earthshine, halo})` — fat crescent with a TILT
  (bite offset rotated, not axis-locked), faint earthshine disc, soft halo.

## 6 · Engine deltas (env-law.js + backlot.html)

- `EnvGen.build`: new RNG stream `rFar = mulberry32(S^0xFA57E1)`; builds `Built.far` via the
  pack hook when present and `params.farRings > 0` (ring list truncated to the dial).
  `meta.farTris` reported. Existing streams untouched — no-hook packs byte-identical.
- `scatterAll`: count multiplier picks `ctx.nearDetail` for `near:true` tables
  (punct > near > density precedence).
- `heightfield`: `basinMottle` + `verge` face-colour ops (basin branch only);
  optional `aerial.steps` — quantize the aerial mix into N hard rungs (ladder-law terrain).
- CONTROLS += `farRings` (WORLD) and `nearDetail` (PROPS) — old presets/banks normalize to
  defaults; packs without hooks ignore both.
- backlot.html: `rebuild`/`disposeBuilt`/`fitCameras` handle `built.far`; header gains
  "far in GLB" toggle beside "sky in GLB"; GLB input array appends far when toggled;
  recipe notes mention far regeneration. Nothing else moves.
- Budgets: shells ≤ 3 k tris · near-detail ≤ 8 k tris — both inside the existing 120 k cap.

## 7 · NEW PACK — MEADOW NOCTURNE (the Ascent, poured into 3D)

**The sentence:** *A twilight meadow under the rising night — dusk-rose horizon, tilted
crescent, stars thickening toward the zenith, firefly verges, and one great oak holding a
single lantern.* treatment:'grad'. Audience law from SKY-DESIGN: dreamy not techy, wishes
not lasers — warmth over void. This pack exists to prove §1–§5 in one frame.

- **Sky** — THE master gradient, exact hexes from SKY-DESIGN §2, compressed into the kart
  strip: `#0a0d1c` zenith → `#10142e` → `#1c2350` → `#3a3068` violet → `#6b4585` plum →
  `#a05a8c` → `#c96a8e` rose → `#f0997a` peach → `#ffc98a` gold → `#ffe4b0` horizon line
  (thin bright band, the title's halo). Dither + grain mandatory. timeOfDay reinterprets:
  dusk = the Ascent · night = DEEP NIGHT (warm run collapses, stars double) · dawn = CROWN
  OF DAWN (Act III payoff: rose-gold-cream) · day = BLUE HOUR (deep blue → pale gold).
- **Stars** — tiered ramp, ~26–200 by punct dial and tod; 5–7 hero four-ray stars in the
  kart strip; colours per §5. **Moon** — fat waxing crescent, tilt ~24°, LOW (elev ~19°),
  warm `#f7e8c8`, earthshine 6 %, soft halo; dusk/night only. 2–3 thin dark cloud wisps
  with a moonlit top edge, high in the frame. No painted terrain rows — shells do that work.
- **Terrain** — low rolling meadow (relief ~18–24, no terrace, gentle ridged 0), deep
  blue-green darks: floor `#101828`, mottle `#0d1420`, verge `#1b2742`; hills rise through
  `#0c1018 → #10162a → #161c36 → #232048`, aerial-quantized (steps 3) toward `#3a3068`.
- **Shells** — 3 rolling rings on the ladder `#141026 → #241d42 → #3d3161` (the Ascent
  far-hill family, ending just under the violet band). Clean arcs, no teeth — SKY-DESIGN:
  keep the horizon clean.
- **Near field** — grass tufts (5–9 thin cones, `#1b2742`, outer annulus), wildflower
  clusters (stem + tiny head, dusty lavender `#8f7fae`), pebble triads, stone+tuft+flower
  vignettes at the verge, **fireflies** `#ffdf8f` (core sphere + transparent halo sphere,
  floating 0.4–1.1 m, verge ring ± just outside) — static v1 (one-moving-thing law: drift
  is a later dial, default OFF).
- **Landmark** (dial): 0 **THE GREAT OAK** — huge silhouette crown, one hanging lantern
  (the lit-window-on-dark carrier — GRAFT law) · 1 **THE WISHING STONE** — leaning menhir,
  one glowing rune band · 2 **THE STONE CIRCLE** — knoll ring, one lit altar lamp.
  The lantern/rune/lamp is THE wrong colour (`accent`: lantern gold `#ffd98a` /
  spell teal `#63e0cf` / rose `#ff9fb4`). Nothing else warm-glows except fireflies (same
  family as lantern gold on purpose — the world's one temperature).
- **Presets** — `FIRST STAR` (dusk, the Ascent frame, oak) · `DEEP NIGHT` (night, stars
  doubled, wishing stone) · `CROWN OF DAWN` (dawn, stone circle, punct low).

## 8 · Retrofits this wave (two, minimal, judged by shots)

- **SUNDOWN POSTER** — `farfield`: 3 shells (nearest wears conifer TEETH) on its existing
  rowNear→rowFar ladder; paintSky keeps only its farthest painted row when shells are on;
  basin mottle (dry-meadow 2-tone) + verge band + near tufts/boulder-vignettes. Firewatch
  with real parallax.
- **MESA GOLDEN** — `farfield`: 3 MESA-style shells (flat-top slabs — the §3 grammar in
  its register) replacing both painted silhouette rows when on; butter-gold basin mottle +
  verge + near scrub tuftlets and pebble triads. The bowl feel dies with the dome demotion.
  **Colour lesson (build r4):** mixing a narrow palette family toward the horizon
  CONVERGES — the rings rendered fine but read as extra sky bands. Shell rungs must be
  VALUE-STEPPED (shade() off the haze, ~0.09 L per step) with LOW profile bases so real
  sky gaps open between silhouettes. Separation beats hue fidelity at 400 m+.
- Other packs: untouched this wave (still green). Retrofit recipe = this doc §2/§4; one
  pack-wave-2 session can sweep candy/neon/inkwash/palm later.

## 9 · Proof law (unchanged recipe, new matrix)

Headless SwiftShader recipe verbatim from BACKLOT-DESIGN §11. Gate shots (eyes on every PNG):
- MEADOW NOCTURNE: kart 45/165/285 + orbit, seed 7 (+ presets at one heading each).
- Retrofits: kart 45/165 each, seed 7, vs. their stored judge frames (must beat, not match).
- **Parallax proof**: kart cam at x −60 and +60, same heading — shells must visibly slide
  against each other between the two frames (the whole point, photographed).
- Determinism: same URL twice, `cmp` byte-identical (fresh×2, never vs stored). One
  no-hook pack (candy-basin) re-shot to prove the engine changes left it untouched.
- `node --check` every JS; appCheck: all 7 packs in picker, presets load, GLB/recipe export.

## 10 · Open forks (my picks, all vetoable ⚑)

- Shell rings at 430/720/1180 m, skirt to −30 — tuned by eye at kart cam, not sacred. ⚑
- `far` OUT of GLB by default (toggle in), matching sky. ⚑
- Fireflies static in v1; drift is a later "one moving thing" dial. ⚑
- MEADOW NOCTURNE is 'grad' register (smooth sky legal) but its terrain aerial is
  QUANTIZED (steps 3) — the hybrid is deliberate: soft sky, hard land. ⚑
- Existing four packs untouched this wave. ⚑
