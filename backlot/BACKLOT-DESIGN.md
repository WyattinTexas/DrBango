# BACKLOT — the 3D environment generator
### CELSTUDIO makes the actors. BACKLOT makes the sets. · 2026-08-10

**Goal (Wyatt, 8/10):** take the celstudio 3D modeler lineage (figure3d.js — toon solids, baked
ink hulls, export-safe primitives) and grow it into a **3D environment generator**: beautiful,
seeded, curate-able worlds in **multiple distinct styles** — not just Mars. 2D sprites will live
in these 3D environments across several games. First fitness test: a **kart racer** — no track
baked in, just environments that *hit* at kart height.

**Sharing (hard requirement):** Skylar must be able to use it. Therefore the whole lane is one
self-contained folder — works opened over `file://`, no fetch/XHR/modules/CDN — so it ships two
ways: (a) zip the folder and send it, (b) host it as a subpath on drbango.com (GH Pages). Same
bytes both ways.

---

## 0 · Charter & house rules

- Lives at `~/celstudio/backlot/`. Never writes to `~/mars/`. Never edits `../lib/*-law.js`.
- CELSTUDIO's charter covers it: "standalone character+environment creator, serves other IPs."
- Determinism is a hard requirement: `build(params, seed)` twice → identical scene graph.
  `mulberry32` seeded RNG only. No `Math.random()`, no `Date.now()` in any build path.
- **Read every PNG you render.** Two render/critique/fix rounds minimum before returning.
- Headless shots: unique `--user-data-dir`, always `pkill` your Chrome after.

## 1 · Files

```
backlot/
  BACKLOT-DESIGN.md      this doc
  backlot.html           the app — workshop instrument, its own identity
  lib/env-law.js         window.EL  — shared 3D world grammar (the law)
  lib/packs/<name>.js    window.BACKLOT_PACKS['<name>'] — one style pack per file
  vendor/                three.min.js r147 UMD · OrbitControls.js · GLTFExporter.js (copied)
  proofs/                proof pages if needed (the app's ?shot mode usually suffices)
  shots/                 PNG proofs, read by human eyes
```

Script order in backlot.html (classic tags, file:// clean):
`vendor/three.min.js → vendor/OrbitControls.js → vendor/GLTFExporter.js → lib/env-law.js →
lib/packs/*.js (any order) → app inline script`.

## 2 · The generator interface (Gen contract, poured into 3D)

Same shape as the studio's `Figure`/`Scene` contract so the ergonomics carry:

```js
window.EnvGen = {
  CONTROLS,        // Array<Ctl>: {k,l,g, t:'rng'|'cyc'|'tog', min,max,step | o:[...]}
  GROUPS,          // ['WORLD','TERRAIN','SKY','PROPS','COLOR','MOOD']
  defaults(pack),  // -> params (flat, JSON-safe; includes pack:'mesa-golden')
  roll(params, locks, seed),   // NEW params; re-rolls only unlocked keys; pure+deterministic
  build(params, seed),         // -> Built (below); pure, no DOM writes, no globals mutated
  PRESETS,         // Array<{name, pack, params}> — ≥2 hand-tuned presets PER PACK
}

Built = {
  group: THREE.Group,     // the world: terrain + props + water. +y up, meters, origin = basin centre
  sky:   THREE.Object3D,  // dome/cylinder with canvas texture (added separately; excluded from GLB by default)
  fog:   null | {color, near, far},     // packs that use aerial perspective
  bounds:{radius},        // playable-basin radius in meters
  meta:  {pack, label, palette:[...hexes], tris, moving:[...]}   // UI displays, never depends
}
```

A **style pack** is data + paint, not a fork of the engine:

```js
window.BACKLOT_PACKS['mesa-golden'] = {
  name, label, blurb,
  treatment: 'flat' | 'toon' | 'grad',     // material law (§5)
  palette(params, rnd) -> {ground:[...bands], sky:{...}, props:{...}, ink, fogHex?},
  terrain(params, rnd) -> profile,          // relief, feature mix, terrace/ridge ops (§4)
  paintSky(ctx, w, h, pal, params, rnd),    // canvas paint — bands, sun, clouds, punctuation
  props(EL, rnd, params, pal) -> [{geo/mesh builders, scatter table}],  // §6
  presets: [{name, params}, ...],
}
```

## 3 · Scale & the KART FITNESS LAW (why this generator exists)

- Units are **meters**, +y up. A kart is ~2 m long, driver eye **1.1 m**. World tile ≈ 600×600 m.
- **THE BASIN LAW:** every generated world has a **playable basin** — a radial mask around the
  origin (radius dial, default 130 m; smooth edge blend over ~40 m) where terrain flattens to
  gentle rolling (max slope ≈ 6%) and props keep out (scatter density → 0 inside, full outside;
  a sparse "edge punctuation" ring MAY intrude just inside the rim so the basin edge reads).
  No track is generated — the basin is the canvas a track will later be laid on.
- **The judge camera is the kart camera.** Beauty is graded at eye 1.1 m from inside the basin
  looking out, not from orbit. The horizon must be interesting at that height in every heading:
  layered silhouettes, a landmark ("the one big thing" — every pack places exactly ONE
  oversized landmark feature off-basin), sky doing work.
- Readability law: ground colour inside the basin stays calm/low-detail (sprites and karts must
  pop against it); drama lives at and beyond the rim.

## 4 · Terrain law

- Seeded heightfield: grid `PLANE 600×600 m, 128×128 segments` (dial), FBM value noise
  (mulberry32-fed) + per-pack feature ops: **terrace** (quantize heights → mesas, HB posterized
  ground), **ridge** (|noise| fold → crests/dunes), **crater/carve**, **island falloff** (radial
  dropoff for sea packs). Basin mask applied last (§3).
- **Vertex-colour banding:** ground colour = height/slope bands from the pack palette. HB-family
  packs POSTERIZE (3–5 hard bands, no smooth gradients — the 2D law survives); poster/grad packs
  may blend smoothly. Aerial perspective = `mix(hue → sky hue, distance)` — the WL algebra (§7).
- Optional water plane at `y = waterLevel` (flat colour + shore band by depth-banded vertex
  colour on the terrain, not a shader).

## 5 · Material law (export-safe by construction — figure3d's law, kept)

- **No custom shaders anywhere.** Three treatments:
  - `flat` — MeshBasicMaterial, unlit. The HB register (mars game proved it: "lighting" comes
    from painted bands + the sky).
  - `toon` — MeshToonMaterial with the 3-step DataTexture ramp (figure3d's `toonKit`), plus
    **baked inverted-hull ink** (real displaced geometry, BackSide basic) on HERO props only —
    the landmark and near-rim props. Ink hex = pack ink (never black; WL's `ink()` derivation).
  - `grad` — vertex-coloured Lambert/Basic with smooth ramps + THREE.Fog (poster register).
- Fog is allowed only in packs whose register says so (it IS a smooth ramp). Fog doesn't export
  to GLB — the recipe JSON carries it; the doc'd loader note tells the engine to re-apply.
- **No InstancedMesh in the export graph** (r147 GLTFExporter law). Props are plain Meshes
  SHARING geometries/materials — GLTF dedupes shared geometry, files stay small.
- Budgets: terrain ≤ 33 k tris · props ≤ 60 k tris · whole set ≤ 120 k tris. One canvas texture
  for the sky, one optional canvas texture per pack for ground decal — nothing else.

## 6 · Prop & scatter law

- Props are primitive-built (lathe/cylinder/sphere/box/cone/tube — the figure3d vocabulary):
  rocks, mesas-minor, cacti, trees (cone/blob canopies), palms, crystals, towers, arches,
  pylons, clouds-as-geometry where the pack wants them.
- Scatter table per pack: `{builder, count, ring:[rMin,rMax], scaleRng, jitter, align:'up'|'slope'}`
  — placed by seeded rnd in polar rings around the basin, density dial multiplies counts,
  never inside the basin (§3), **odd counts, left-heavy** where punctuation applies (house law).
- Exactly **ONE landmark** per world (§3): oversized, silhouette-first, placed on a ring
  115–200 m out at a seeded bearing; the thing you steer by. It takes the ink hull in toon packs.
- Every prop family must read at 300 m at eye 1.1 m — silhouette first, detail never smaller
  than ~1.5 m features.

## 7 · Colour law (ported from world-law, kept numeric)

- Port WL's algebra into EL verbatim: `shade(hex, ΔL, ΔH°, ΔS)`, `mix(a,b,t)`, `ink(hex)`
  (L−0.38, H+8° toward red, S+0.12 — never black). BG bands stay gouache-legal
  (S∈[0.20,0.62], L∈[0.22,0.72]) in HB-register packs; sprite/kart layer keeps the cel range —
  that split is WHY 2D sprites will pop in these worlds.
- Each pack: ≤ 7 base hues + derived shades only. **One "wrong" colour per world** (house law) —
  a single accent element (the landmark's trim, one pond, one door) in a hue that breaks the
  scheme on purpose.
- MESA GOLDEN lifts hexes from `../lib/world-law.js` §BG/§CEL tables (copied as data — backlot
  stays standalone, no runtime dep).

## 8 · Sky law

- Sky = big inverted sphere/cylinder with a **canvas texture painted by the pack**: hard bands +
  scallops + sun/moon disc + punctuation (HB register), or smooth multi-stop gradient + cloud
  shapes (poster register). One canvas, painted once per build, seeded.
- The sky does half the work at kart height — it owns ~55% of the frame. Pack authors paint it
  first, not last.

## 9 · The app — `backlot.html`

Workshop instrument, its own identity (NOT a Mars file, NOT the studio — same family, new tool:
dark frame, deep-green faceplate, brass/cream chrome — "backlot at golden hour").

1. **Pack picker** — big cards with name+blurb+swatch strip. Switching packs swaps
   defaults/presets; seed persists.
2. **Control panel** from CONTROLS/GROUPS, collapsible; **per-dial 🔒 lock**, lock-group,
   lock/unlock-all; lock state persists (`backlot-*` localStorage, versioned).
3. **RANDOMIZE** + seed field (visible, editable) + prev/next seed steppers.
4. **Viewport** (three.js): ORBIT cam (OrbitControls) and **KART CAM** — toggle drops to
   eye 1.1 m in the basin, WASD+mouse (or arrows) drive-around at ~20 m/s with kinematic
   ground-follow. Judging happens here. HUD chip shows cam mode + FPS.
5. **BANK** — save current world (pack+params+seed+128px thumbnail via canvas grab); gallery
   strip renders banked worlds side by side; load/rename/delete/reorder; EXPORT/IMPORT the
   whole bank as JSON. This is the curation surface.
6. **Export per world:** ⬇ GLB (terrain+props; sky excluded by default, toggle to include) ·
   ⬇ RECIPE JSON (pack+params+seed+fog+notes — regenerates exactly in-engine) · ⬇ PNG 2×.
7. **?shot=1&pack=X&seed=N&cam=orbit|kart&heading=D** — headless proof mode: fixed cam,
   rAF kept alive, renders every 10th tick after the first 3 warm frames (the pattern that
   works under SwiftShader), `document.title = 'SHOT-READY'` when warm.
8. Footer: determinism note + "made with CELSTUDIO · BACKLOT".

## 10 · Style packs v1 — six, each must HIT

Every pack ships ≥2 presets and passes the kart-cam judge. One "home" style, five learned ones.

| pack | register | the sentence |
|---|---|---|
| **MESA GOLDEN** | flat (HB gouache) | The house look off-Mars: terraced butter-gold mesas under a 4-band dusk sky, googie punctuation on the rim, one teal pond doing the wrong-colour job. |
| **SUNDOWN POSTER** | grad + fog | Firewatch register: five ridge silhouettes deepening toward an enormous gradient sky, fire-lookout landmark, everything is aerial perspective. |
| **CANDY BASIN** | toon | Pastel geometry — mint/rose/cream terraces, gumdrop trees, soft round rocks with ink hulls; the kart-classic candy world grown up (Monument Valley manners). |
| **NEON CIRCUIT** | flat + emissive-look hexes | Synthwave night: near-black glass ground with banded glow grid, chrome sun with stripe bites, wireframe-read mountain rims, one magenta obelisk. |
| **INKWASH CANYON** | toon (heavy hull) | Moebius/Sable: pale paper tones, sparse washes, every mass owns a fat ink line; a bone-white arch landmark; the emptiest and boldest of the six. |
| **PALM LAGOON** | toon | Wind-Waker manners: ring of toon sea (island falloff), scalloped shore band, leaning palms, puffy geometry clouds, volcano landmark with a cream smoke curl. |

The pack roster is a shelf, not a cap — packs are one file each; new games add packs.

## 11 · Proof law (headless WebGL — the recipe that works)

`--disable-gpu` kills the context; vtb races SwiftShader. The proven fallback (duel, 8/8):

```
chrome --headless=new --enable-unsafe-swiftshader --user-data-dir=/tmp/blshot-$RANDOM \
  --no-first-run --no-default-browser-check --mute-audio --hide-scrollbars \
  --window-size=1600,900 --virtual-time-budget=20000 --timeout=60000 \
  --screenshot=shots/<name>.png 'file://…/backlot.html?shot=1&pack=X&seed=N&cam=kart&heading=45'
pkill -f blshot- afterward; SwiftShader ≈ 0.2–0.8 s/frame — budgets mean real minutes.
```

Judge shots at BOTH cams: 1 orbit establishing + 3 kart-cam headings (45/165/285) per world.
The kart-cam shots are the ones that gate.

## 12 · Phases

1. **CORE** — EL (env-law) + EnvGen + backlot.html + MESA GOLDEN as the reference pack;
   orbit+kart cams; shot mode; GLB/recipe export. DoD: mesa-golden seed 7 proof shots read
   HB at kart height; GLB reimports in a bare three viewer; same seed twice = identical.
2. **PACK WAVE** — five remaining packs in parallel against §2's pack contract; each
   self-proofs (2+ rounds), then independent adversarial audit per pack (fresh eyes, kart-cam
   shots), then a judge pass ranks + grafts (the mockup-suite process).
3. **CURATION SURFACE** — bank/gallery polish, look-book artifact (shots of every pack ×
   3 seeds) for Wyatt + Skylar to curate from.
4. **SHIP** — zip for Skylar + host at drbango.com/backlot/ (GH Pages subpath law: whole
   folder copies in, no Jekyll traps — no leading-underscore names, no symlinks).
5. Later (post-curation): pack expansion per game, track-authoring layer (separate tool —
   BACKLOT stays trackless), engine-side loader notes for the kart racer.

## 13 · Open forks (my picks applied, all vetoable)

- **Name/identity:** BACKLOT, deep-green+brass faceplate. ⚑
- Sky excluded from GLB by default (engines usually own their sky); toggle exists. ⚑
- Water is flat-banded, never animated in v1 (one-moving-thing candidates: cloud drift,
  water shimmer — default OFF, dial exists per pack later). ⚑
- Kart cam has no collision (drive-through props) — it's a judging camera, not a game. ⚑
- 600 m tile, single tile v1; no streaming/tiling until a game demands it. ⚑
