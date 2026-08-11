# STARSPELL — THE ASCENT
### Sky & transition design · v1 · 2026-08-10 · status: DESIGN (nothing built)

**The pitch.** The menu is no longer *in* the sky — it's a twilight meadow you stand in,
looking up. The beasts wheel overhead, tiny and far. When you join a game, you **rise**:
one continuous camera move up through the dusk, past the clouds, into the deep night —
and the beast assembles in front of you. The battle screen was always the sky; this gives
it an *earth* to leave.

Reference for the mechanic: Skyrim's skill menu (camera tilts from your character up into
constellations — https://www.youtube.com/shorts/SWUKkmaMEvc). Reference for the mood:
Sky: Children of the Light, Monument Valley, Alto's Odyssey at night. **Dreamy, not techy.
Wishes, not lasers.** The audience skews young and female — warmth over void, wonder over
sci-fi. No HUD chrome, no cold space. Fireflies, crickets, a crescent moon.

Why it fits what's already shipped: Act I is literally "THE MEADOW SKY", the campaign
tagline is "three acts · one long night", Act III is "THE CROWN OF DAWN". The fiction
already stands in a meadow at dusk. This makes the game look like its own words.

---

## 1 · THE WORLD COLUMN

One vertical world, 3 screens tall (design space 420 × 2400; screen frame 420 × 800).
The camera shows the bottom frame at HOME and the top frame is the battle sky.

```
worldY 0 ─────────  BAND A · ZENITH (the battle sky)
   deep night #0a0d1c (== game bg, == battle scene, exact match for handoff)
   densest stars (~200 in frame) · aurora glows (existing teal/violet/gold)
worldY 800 ───────  BAND B · THE CLIMB
   indigo → violet gradient · 2–3 cloud wisps (crossed mid-ascent)
   star density ramping up · nothing interactive lives here
worldY 1600 ──────  BAND C · THE MEADOW (home frame)
   dusk band + horizon glow at ~y2030 · crescent moon low
   ground silhouette + grass + fireflies · all menu UI lives here
worldY 2400 ──────
```

HOME camera scrollY = 1600. Ascent = tween scrollY 1600 → 0, then scene-transition
into `battle` (which is unchanged — it already *is* the zenith).

## 2 · THE MASTER GRADIENT (the beautiful image)

One tall canvas texture (`skygrad`, 64 × 1024, stretched over the full world).
Never pure black anywhere. Top must end at **exactly #0a0d1c** so the battle
handoff is invisible.

| worldY % | hex | note |
|---|---|---|
| 0–9 | `#0a0d1c` | zenith — matches game/battle bg exactly |
| 27 | `#10142e` | deep indigo |
| 43 | `#1c2350` | night blue |
| 57.5 | `#3a3068` | violet |
| 68.5 | `#6b4585` | plum (dusk begins — top of the home frame lands here) |
| 76 | `#a05a8c` | plum-rose |
| 80.5 | `#c96a8e` | rose |
| 83 | `#f0997a` | peach |
| 84.6 | `#ffc98a` | horizon gold |
| 85.2 | `#ffe4b0` | horizon line (thin bright band) |
| 86–100 | `#0c0918→#070510` | ground — the meadow fills the bottom 45% of the home frame (horizon sits at ~55% of the frame; worldY 2045 of 2400) |

**Banding law:** when drawing the gradient canvas, add ±1.5 RGB noise per scanline
(dither), and lay a 128×128 random-noise tile over the whole world at ~3% alpha.
Smooth dark gradients band hard on OLED; grain is what makes it look expensive.

## 3 · STARS (the jewelry)

- **Three tiers**, by distance. Tier F (far, small, dim) scrollFactor **0.55**;
  tier M **0.70**; tier N (near, bright) **0.85**. Each tier's field is authored across
  its own travel span (`1600 × factor + 800`) so the frame is always filled.
- **Density ramp:** ~12 stars in-frame at the horizon → ~200 at zenith. The thickening
  sky is what sells the climb.
- **Colors, not white:** base `#cfd8ff` (current), plus warm `#ffe9c9`, rare pink
  `#ffd1dc`, rare mint `#c9fff2`. Subtle — a jewelry box, not confetti.
- **Twinkle law:** existing yoyo-alpha tweens, but ≤3% of stars twinkling *strongly*
  at any moment, never synchronized (random 1.2–3.8s periods, random delays — current
  code already does this right).
- **Hero stars:** 5–7 in the meadow sky get a 4-point diffraction cross (tiny cross
  texture, slow rotation, gentle pulse). These are the ones a player would wish on.
- During peak ascent velocity, tier-N stars **stretch** (scaleY up to ~2.2, +0.2 alpha)
  — speed lines without drawing speed lines. Ease back to 1.0 at the settle.

## 4 · SET DRESSING

- **Moon:** fat waxing crescent, tilted ~24°, low near the horizon (world ~(120, 2040)),
  warm `#f7e8c8`, soft halo (glowbig), faint earthshine disk at ~6% alpha.
  scrollFactor 0.85 — it slides down and out in the first half of the rise.
  The battle sky has **no moon**: the beast owns the zenith.
- **Clouds:** 2–3 thin dark wisps in Band B (`#141028` at ~55% alpha, blurred, moonlit
  top edge `#ffe4b0` at ~20%). They drift ±20px horizontally at rest; during the rise
  they sweep past — the "passing through" beat.
- **Ground:** two hill silhouettes (far `#141026`, near `#0c0918`), a grass-blade
  strip along the bottom edge (~40 blades, ±1.5px sway, staggered), 3–5 wildflower
  silhouettes. No trees — keep the horizon clean.
- **Fireflies:** 10–14 warm `#ffdf8f` dots over the grass, sine drift, slow alpha
  pulse, ADD blend. On tap-to-play they scatter gently upward (anticipation beat).
- **Aurora:** existing three glows stay in Band A (battle). A faint teal hint may
  bleed into the top of the home frame — a tease of where you're going.
- **Menu layout on the meadow frame:** horizon sits at ~55% of frame. Beast showcase
  (existing cycler) floats in the dusk sky *above* the horizon — tonight's hunt, rising.
  Title sits just above the horizon glow, which acts as its halo. The gold buttons sit
  over the dark meadow below — lanterns in the grass. Buttons/board/profile rows are
  unchanged in content and order.

## 5 · THE MOVE (choreography)

Total tap → beast named ≈ 4.5s. The ascent itself is ~2.6s + 450ms crossfade.
**Once per run** (entering campaign/quick/daily/versus battle) — never between fights.

| t | beat |
|---|---|
| 0 | tap. Button blooms. Fireflies scatter upward. Riser starts. Crickets duck. |
| 0–260ms | **anticipation:** camera dips +14px (easeOutSine) — a breath in. Menu UI begins 300ms alpha fade (it belongs to earth). |
| 260–2000ms | **the rise:** scrollY 1600 → ~60, one easeInOutQuint curve. Moon exits by ~40%. Clouds cross 45–70%. Star-stretch window 40–75%. Sky darkens because the gradient darkens — no tinting needed. |
| 2000–2600ms | **the settle:** final 60px easeOutQuint with ~10px overshoot and return. Twinkles stagger on. 150ms of near-silence, then the arrival chime. |
| 2600ms | `scene.transition('battle', 450ms)` crossfade. Battle fades its layers in and runs the existing beast assembly (stars fly in, lines, name) — the arrival payoff is already built. |

- **Skippable:** any tap during the rise jumps to the settle. Respect repeat players.
- **`prefers-reduced-motion`:** no pan — 400ms veil crossfade to battle.
- **Return home** (from battle back-arrow): descend, 1.15s easeInOutCubic, crickets rise.
- **Defeat:** no descent — 350ms fade to the meadow. You wake up back on earth.
- **Resize during ascent:** existing resize handler restarts the scene; acceptable
  (re-enters home at rest). Guard: if mid-ascent, finish to battle instead.

## 6 · SOUND

All procedural, extending audio.js patterns. The AmbientPad is global and already
survives scene changes — continuity for free.

- **Crickets (new, meadow only):** 2 voices; bursts of 4–6 bandpass chirps ~4.2kHz,
  high Q, gain ~0.02, random 300–900ms gaps. Instant "standing in grass at night."
- **Riser:** `SFX.noise`-style bandpass sweep 300 → 2600Hz over 2.2s, low gain, plus a
  low wind layer (200–600Hz) swelling under it.
- **The hush:** 150ms of almost-nothing at the top of the settle. Silence is the frame.
- **Arrival chime:** 880 + 1318.5 sine pair (the forge voice — already the prettiest
  sound in the game).
- **Descent:** reversed sweep, shorter; crickets crossfade back in.

## 7 · BUILD PLAN (maps to real code)

**P1 — the ascent (one session).**
1. `ssSkyWorld(scene)` in game.js shared helpers (~120 lines): builds `skygrad`
   texture + grain, ground/grass/flowers, moon, clouds, star tiers with scrollFactors +
   density ramp, fireflies. Returns `{ ascend(opts) → Promise }` running §5.
2. `Home.create`: replace `ssStarfield`/aurora with `ssSkyWorld`; place existing UI
   at Band C world coords (default scrollFactor 1 means it all scrolls away naturally);
   `this.cameras.main.setScroll(0, 1600·s)` (everything in `ssLayout` units × s).
3. `Home.startMode` / versus entry: `await ascend()`, then
   `this.scene.transition({ target:'battle', duration:450, data:{mode,resume}, moveBelow:true })`
   — Battle reads `data` in `init` exactly as today.
4. `Battle.create`: root layers start alpha 0, fade in over ~300ms (bg color already
   identical — no pop). Same for `vsbattle`.

**P2 — sound + feel.** Crickets/riser/hush/chime in audio.js; star stretch; skip-tap;
reduced-motion veil; title fade; fireflies scatter.

**P3 — flourishes.** Descend-home + defeat-fade; DAWN gradient variant after a campaign
win (Act III payoff: you rose at dusk, fought one long night, and come down at sunrise);
versus "rise together" (both players ascend on match found; shared seed = same sky);
title dissolving into stars as you pass it.

**Perf budget:** ≤320 star images total + 14 fireflies (Phaser eats this; DPR already
capped at 2). Everything animates transform/alpha only. No new assets — the whole sky
stays procedural, zero downloads.

## 8 · DID WE NAIL IT

- [ ] The menu at rest is a place you'd want to *stay* (crickets, fireflies, moon).
- [ ] Tap → beast named is ONE unbroken motion. No pop, no cut you can point to.
- [ ] 60fps on a mid phone; total ≤4.5s; skippable.
- [ ] Zero visible banding on an OLED screen.
- [ ] Any paused frame of the ascent is wallpaper-worthy.
- [ ] A first-time player says something out loud. That's the real test.

## 9 · LATER / PARKED

Seasonal meadow skies (date-seeded dusk hues) · shooting star = tap to wish (rare,
cosmetic) · leaderboard as its own quiet hillside at dawn · constellation lines drawn
between letters of your finest word on the victory screen.
