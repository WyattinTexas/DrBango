# THE CAMPAIGN SKY REDESIGN — design doc (2026-09-03, design only, nothing built)

**Provenance — Skylar (Skylar's console), 2026-09-03 ~12:30, verbatim:** "Create a design document not in the jumper queue. We want a redesign on the campaign sky. The first thing is that the difference between the acts doesn't really make sense. Also, the final boss of each act should have a glow or Something that makes them feel a little extra special or mysterious let's remove the Act 2, Deep Night, Act 3, Act 4, and Journey's End text. Once the player gets up to those points, once the player defeats the Act 1 boss, the top of the screen will update and say Act 2. Each constellation in the campaign sky needs to be redesigned individually so they aesthetically pleasing and visually represent the constellations that they are. This is of high importance to have the individual designs looking their best. Currently, they are Blob B, Too Close Together and hardly resemble the constellations they represent." (Voice-dictated. At review he added: also explore act MECHANICS, and confirmed this runs solo, not via jumpr.)

**Review page (the deliverable to rule on): https://skypilot82.github.io/starspell-sky-redesign/** — all 26 constellations current-vs-proposed at identical scale with chart-node minis (+ badge-fit minis for the five zodiac-shared), BUILD/TWEAK/KEEP chips per row and a COPY VERDICTS bar; the acts recommendation up top. **Buildable data: `design/campaign-sky-redesign-2026-09-data.json`** — every proposed shape as stars/edges/eyes (+ flourish anchors for centaurus/sagittarius), judge-verified (min star distance ≥ 12 target 14+, in-box, connected, ≤2 crossings, star counts within ±25% of current) and machine-validated. The 15 dictated words this answers are the four asks below.

## 1 · The constellations (the headline — "of high importance")
Every one of the 26 SS_BEASTS shapes redrawn individually. Method: the ~22 real IAU names start from the REAL asterism's canonical spine (Cygnus' Northern Cross, Cassiopeia's W, Delphinus' Job's-Coffin kite, Orion's belt, Taurus' Hyades-V + horns, Scorpius' hook, Draco's wind, Leo's sickle…), then stylize toward the beast; ursa leans on the Big Dipper; vulpes nods to faint Vulpecula's zigzag; strix/aranea are invented but chart-plausible (chains + few branches, never dot-to-dot). Worst current offenders fixed: taurus min star distance 4.5 → 19+, draco 8.2 → 16+, phoenix 8.9 → 16+. Each proposal was adversarially judged (node-computed spacing, silhouette trace) — all 26 passed.
- **Zodiac ripple (needs Skylar's knowing yes, marked on the page):** taurus, cancer, leo, scorpius, sagittarius share their star data with the v0.79 sign-picker cards, the battle emblem, and the v0.78 profile badges — rebuilding them restyles those surfaces too. Badge-fit minis on the page show the compact reading.
- **v0.81 flourish re-authoring:** centaurus (rear pivot + foreleg sparks) and sagittarius (bow + arrow line the shooting star flies) get NEW anchors shipped inside their proposals (dashed marks on the page); tap-sign-check's 57 pins re-aim with them.

## 2 · The acts ("the difference doesn't really make sense")
Recommendation **THE PARTING VEIL** — composite of three independent design passes that converged: four sky-wash BANDS on the one baked mapsky gradient aligned to the road's act spans (meadow dusk → true deep night, darkest → eclipse violet w/ thin gold crown rim, agreeing with SS_UMBRAL → cold star-white summit air), per-band dust temperature/density, per-act beast-node hue families as a CHART-NODE TINT LAYER ONLY (never baked into SS_BEASTS — the zodiac surfaces must not shift), and a soft baked **haze seam** where each dead label sat — weather, not signage. Option on top (Skylar's call): **veil unreached acts** — beasts above the current act's boss dimmed behind thick haze; the haze parts when the act boss falls — the reveal is the reward. Trade: the entry ride would open on a *veiled* summit.

### Act mechanics (explored per his ruling — proposals only, one felt rule per act, Act I stays the named twist-free baseline "First Light")
| Act | Recommended | Variants |
|---|---|---|
| II · The Deep Night | **The Dark Tile** — one rack tile's letter hidden until played; small bonus for the courage | 2 shrouded tiles, tap unveils one free |
| III · The Crown of Dawn | **The Shadow Rises** — umbral beasts re-rise once at ~40% (the recolor finally MEANS something) | the Emberveil (damage reads "??" unless you cast 5+ letters) · the Dawnlit Letter (migrating ×1.5 tile) |
| IV · The Endless Hunt | **No Rest in the Hunt** — orion→centaurus→sagittarius as a gauntlet, partial heal only between them | the Quarry Flees (beast regen % / turn) · the Hunt Quickens (+1 atk/turn from turn 3, capped) |

Any accepted rule is campaign-scoped behind the act index (data-tag law: signlevel/hard/endless zero-edit) and must pass a 15k-deal sim (the v0.60 bag-rebalance rig) in its build card.

## 3 · The act-boss aura ("extra special or mysterious")
Keyed to the **ACT-FINAL SLOT, never the beast id** (draco is act II's finale AND sits in acts III/IV boss pools). BEFORE the kill: a breathing radial shroud in the act's hue behind the node, the constellation drawn occluded (dark star-cores, bright rims, 2–3 stars lit) — legible but withholding, still nameless per the v0.80 law; one baked texture ×4 tints, one slow alpha tween, reduce-motion = static mid-alpha. AFTER: the shroud breaks at the kill — full stars, the name stamps in, and the glow settles to a **still corona that persists forever**: scroll back up a finished campaign and four crowned bosses stand as trophies.

## 4 · Road labels out, the header announces
Retire the road usages of the act gap labels (v0.80 anchors game.js:4392 · +74 on v0.81), the ACT I foot label (:4396) and the `mapDest` "journey's end" summit text (:4473) — the summit goes mute above the shrouded boss. The `act1–act4` string keys STAY ×5 (the anchored header reads them, game.js:4495); only `mapDest` is orphaned ×5. The moment: during the post-boss victory glide the camera crosses the seam → the sky band turns first → at settle the header turns over (old act faded during the glide, ~300ms held beat, "ACT II" stamps in slightly oversized and settles; one soft chime = Skylar's call). Skip-tap / `?ride=0` / reduced-motion collapse to the final state; the beat finishes before `state='map'` stamps (the settled-means-tappable law).

## Build sizing (for the eventual build cards — queue law: nothing fires without Skylar's done-and-agreed)
- **Constellation data card:** rewrite 26 SS_BEASTS star/edge/eye sets from the data.json; four render surfaces ripple (chart node, in-fight assembly incl. star-count pacing — all deltas within ±25%, meadow showcase + SS_SKY_TAPS zones sized to star bounds, zodiac glyph surfaces); tap-sign-check flourish re-aims; sign/signlevel/hard badge censuses re-checked; likely split into 3–4 cards by tier so verification stays honest.
- **Acts/aura/header card:** mapsky re-bake + dust variants + node tint layer + haze seams + shroud/corona sprites + the header beat; sky-check surgery (it pins "journey's end" + label anchors, 60 asserts); i18n: mapDest retired ×5, any twist copy new ×5; Canvas-renderer budget: baked sprites + single tweens only; veil/reveal states need `?ride=0`/reduce-motion equivalents.
- **Mechanics cards (if any stamped):** one card per accepted rule, campaign-scoped, each with its own sim pass + suite battery.

## FOR SKYLAR (also on the page)
1. Per-constellation verdicts: BUILD / TWEAK / KEEP ×26 (chips + COPY VERDICTS on the page).
2. The zodiac-shared five restyle the sign cards + badges — knowing yes?
3. Veil unreached acts (mystery) vs today's clear road — yes/no?
4. Act mechanics: pick/veto per act, or "visual only".
5. The act-turnover chime — yes/no?
