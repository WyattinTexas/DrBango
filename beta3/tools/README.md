# beta3 dev tools

Thirteen scripts, all dev-only — nothing here ships to the browser.

## make-word-packs.py

Rebuilds the per-language gameplay dictionaries `beta3/words-{es,fr,pt,de}.js`
(fed to `SS_DICT` — see packs.js for the whole language-pack system). Raw
source lists are cached in `~/starspell-art-sources/wordlist-sources/` (kept
out of the repo); the script's docstring carries sources, licenses and the
Scrabble-style normalization rules. The one subtle part: the German book
corpus contains English fragments, so German is sieved by en-vs-de relative
frequency — the measured gap (intruders ≥ 52×, true homographs ≤ 18×) is cut
at 25×. If you regenerate and "night" validates in German, that sieve broke.

## make-art-assets.py

Re-cuts `beta3/art/*.png` from the original Midjourney renders — button/tile
sources in `~/Downloads`, the meadow in `~/starspell-art-sources` (override with
`MEADOW_SRC`). Run it when you want to re-tune the painted art rather than
hand-edit the PNGs. `ONLY=meadow` (or `button`/`tiles`) re-cuts one asset.

```
CALM=0.55 python3 tools/make-art-assets.py
ONLY=meadow NIGHT=0.55 python3 tools/make-art-assets.py
```

`CALM` (0–1, default 0.55) is a vertical-only blur on the tile face. It exists because
16 tiles sit on the board at once, and the painting's horizontal cloud band read as an
obviously repeated asset. 0 keeps the raw painting, 0.85 is nearly flat glass.

What the script handles that a manual crop would not:

- **Alpha is an authored rounded-rect mask, not a colour key.** The button's navy face is
  within a few RGB values of the Midjourney canvas behind it, so keying eats the face.
- **The gold rim is split from the tintable body** at a hue threshold of `r > b + 22`.
  The threshold has to clear the face itself, which is warm pink (`r - b ≈ 17`) — a lower
  threshold swallows the whole tile.
- **The rim overlay is limited to the rim and the top sheen.** The warm mid-tile cloud band
  also passes the hue test, and leaving it in the overlay makes it immune to both the tier
  colour and the calm pass.
- **The source sparkle is inpainted out**; it landed exactly on the tile's printed point
  value at +25, +21. Inpainting samples a blurred copy so the gradient continues — a flat
  fill leaves a visible patch.
- **The button's drop shadow is cropped off** on purpose. Buttons scale 1.03 on hover and
  1.08 on the launch bloom and drop to alpha 0.45 when disabled; a baked shadow grows,
  shifts and goes translucent with them.
- **Game-side (v0.6.1):** consumers display buttons at ~3.2:1–6.5:1 while the painting is
  1.8:1, so `ssBtn()` in game.js bakes an aspect-correct 9-slice per display size —
  corners at true proportions, braid runs mirror-tiled (alternate tiles flipped so the
  pattern joins at the cuts), only the plain face stretched. Slice maths are in integer
  device pixels: fractional boundaries antialias into bright hairline seams.

What the meadow cut handles (`art/meadow.png`, v0.6.0):

- **The painting's sky never ships.** A per-column ridge detector keys everything above
  the mountain line to alpha 0, so the painted landscape sits against the game's own
  procedural dusk gradient — no palette clash, and the ascent/battle handoff is untouched.
- **Ridge detection needs a 20 px sustained dark run** (`lum < 148`): the pink band has
  ~10 px dark cloud streaks that an 8 px run latched onto (rectangular chunks of sky kept
  opaque), and the pale far ridge at lum ~142 vanishes if the threshold is 130. The curve
  is then median-filtered and gaussian-rounded — raw per-column disagreement renders as
  column-aligned banding, and the median alone leaves staircase plateaus on peaks.
- **`NIGHT` (0–1, default 0.55)** ramps a darken/desaturate/cool-shift grade from the
  ridge (keeps the dusk glow) to the bottom (night): the render's foreground is
  daylight-bright green, but the buttons live down there as "lanterns in dark grass".
- The matching game-side change: with the plate on, `skygrad` drops its baked razor
  horizon line and dark-ground plunge (an `artHz` variant in `ssSkyTextures`) — the
  plate's ridge sits lower than the old procedural hills in places, and the baked edge
  showed through/above the painted forest as a straight grey band.

If the art ever goes default-on (not just `?art=1`), convert the output to WebP — the
button goes 427 KB → ~55 KB with no quality loss (the meadow 639 KB → similar savings).
Palette-quantised PNG is smaller too but adds visible dither to the dark face.

## streak-check.mjs

The streak lantern's own harness (v0.40.0), and the companion to
`fps-check.mjs`: that suite pins the LAWS in a handful of checks, this one
walks the SURFACES — the five lamp dresses on the meadow, the lantern sheet's
week strip opened by a real tap, the daily end screen's two lines, the profile
ledger, the migration paths, and the full player flow (play a daily that
crosses a mark → tap HOME → the ceremony arrives on the grass by itself).
Same CDP shape as `click-test.js`; `--disable-gpu` is fine here because
nothing in it forces the WebGL renderer.

```
node tools/streak-check.mjs      # served on :8899, headless Chrome on :9444
```

## lamp-check.mjs

The lantern's PIXELS (v0.45.0). streak-check pins what the lamp IS; this one
snapshots the lamp's on-screen rect in all five dresses and asserts it LOOKS
like a lamp — warm glass when lit, visible pewter when cold — on three boots:
as shipped, with `roundRect` deleted before compat.js (iOS 15, the shell's
floor: the polyfill must carry every bake), and with `roundRect` killed AFTER
compat.js so every painter that calls it throws (`ssBake` must wipe, fall
back, DIAG and carry on). Takes the CDP port and the renderer; run it once per
renderer, with a Chrome that can honour it:

```
node tools/lamp-check.mjs 9444 cv      # --disable-gpu Chrome
node tools/lamp-check.mjs 9446 gl      # the three swiftshader flags
```

What TestFlight v0.43.0 taught, in three lines:

- **Wyatt's "gray rectangle" was the COLD lamp, by design.** The end screen
  says "the lantern is lit" after the very first hunt and the cold sheet
  promises "tonight's hunt lights it", but `ssLanternTier` lit the meadow's
  lamp only from night TWO — so night one showed dark iron at 50% alpha,
  26×36 CSS px, against the dusk: a box. Every desktop harness "verified" it
  because it was asserting the texture KEY, and the key was the one the law
  asked for. Now lit from night one (numbered from two), and the cold dress
  is pale pewter at 0.82 with a glint on the glass.
- **A painter that throws used to poison every bake after it.** Phaser
  registers the key the moment `createCanvas` returns, so the meadow wore a
  half-drawn texture and every later `mk()` never ran. `ssBake` (both
  factories) wipes the canvas, resets the context (a throw after
  `save()`/`translate()`/`'lighter'` leaves all of it behind — `restore()`
  past the stack is a no-op, so it is called sixteen times), runs the bake's
  fallback painter if it has one (the lantern's is straight lines and
  `fillRect` only), DIAGs `bake failed: <key> · <message>` and carries on.
  `window.__ssBakeFail` lists them for a harness.
- **`roundRect` is polyfilled in compat.js (arcTo path) and that polyfill is
  now pinned**: the iOS-15 boot paints warm/iron counts within 10% of the
  native one. Nothing else in the bakes is newer than iOS 15
  (`setLineDash`, `multiply`/`destination-in`, `direction`,
  `actualBoundingBoxAscent` are all Safari ≤ 11.1).

## vs-match.mjs

The rival queue, matched by rating (v0.48.0). Wyatt: "searching for a rival
should queue you up against someone close to your rating." The UX did not
move — a searcher still IS a waiting public room (FIND A RIVAL takes a seat
or opens one), so the queue entry is the room: `seekAt` is the moment FIND
was pressed (`now - seekAt` is the wait, for the 12s-fallback task to read),
the host seat already carries the true `rating` (rhide is display-only).
`vsPickRoom` takes the CLOSEST host within a tolerance that opens with the
pair's COMBINED wait (±75 at once, +75 per 3s between them — `vsTolerance`),
skipping private rooms, full rooms and hosts who faded (`gone`). A host
waiting alone rescans every 2.5s and only ever migrates into an OLDER room
(the elder stays put, so two hosts can never cross), shutting its own door
with an only-if-still-alone transaction first and reopening it under the
same code and wait if the elder room filled meanwhile. The seat itself is
still claimed by the same join transaction as before.

Three headless Chromes (:9461–:9463, `/tmp/cdp-vsm1..3`) against the
testroom RTDB — the local fallback refuses versus — each seeded with its
own rating through `beta3.profile` on `ascent.html` before the game boots,
pressing FIND A RIVAL with real taps:

```
python3 -m http.server 8899 &
node tools/vs-match.mjs       # 24 checks: near over far, lone widens (+veil), 3-at-once ×3
```

Harness lesson: a page http.server serves as `text/markdown` has no
localStorage (opaque document) — seed on a real HTML page of the origin.

Since v0.49.0 the same run also pins the quiet sky (below): the one of three
left alone is met by a circle mage 12–16s in, and two far-apart searchers
(1000 vs 1700 — beyond the opened tolerance) who both reach the 12s mark
pair with EACH OTHER, never with the circle. 34 checks.

## rival-check.mjs

The rival engine (`rival.js`, v0.49.0) and the quiet sky it answers. One
duelist per `SS_RIVAL.spawn({ code, rating })`: it takes a seat through the
very join transaction a phone runs, over its OWN Firebase app instance
(`SSNET.side('rival')` — so its writes reach this tab the way a remote
client's do, no optimistic local apply), deals the identical board from the
room seed with a private RNG (never the game's `rng()`, which is dealing the
human's board in the same page), and plays under a skill dial that is a
TARGET RATING: how long a word it can see, how often it passes the best
word over, when a poor board is worth a SCRY — plus a person's pacing (a
hesitation before the first move, log-normal jitter, a rush when the clock
runs low; never under 1.6s, never past the mode's stall limit).

Dev seam: `?botduel=<rating>[&vsmode=turns|timed][&seed=N]` seals a room and
seats a rival opposite you; `?vsdemo=1` alongside lets the solver play the
human seat. The transcript is in `window.__ssRivalLog` (page memory only).

**The quiet sky** (`VsBattle.quietSky`, `VS_FB` in versus.js): a searcher the
queue has not served 11.2–14.4s after FIND (jittered, then a 0.5–1.3s breath
for the arrival) is met by one of THE CIRCLE — up to eight mages this device
has met, kept in localStorage (`starspellCircle`), each with a uid and name
from the same minters a new device uses and an ordinary `players/<uid>` row
holding exactly the fields `SS.sync` writes, which grows with every duel
(runs, words, wins, and a rating moved by the same Elo the human's client
applies to itself). The seat is rated 40–90 off the player's, either side.
People always win the race: the last instant before the door opens the
queue is read once more — an ELDER room takes the searcher whatever the
rating gap, and a YOUNGER room already on its way (within tolerance, or
past its own clock) holds the door up to 6s. FIND on a reclaimed seat that
had no clock (an unanswered rematch) now stamps `seekAt`. Never a presence
row, never a score on a board, never an answer to a friend request — a
quiet player, by inspection. The versus rating math needed NO special-casing:
Elo runs off the seat's `rating` as for any stranger.

```
node tools/rival-check.mjs          # everything, ~12 minutes
node tools/rival-check.mjs brain    # sim + pacing pins (seconds)
node tools/rival-check.mjs queue    # the quiet sky: reveal 11–17s, forced WIN then LOSS
                                    # (rating + / −), rows, boards, presence, console
```

Harness lessons: a top-level `const` is not a `window` property — wait on
`typeof SS_RIVAL !== 'undefined'`, not `window.SS_RIVAL` (the old wait burned
its whole 60s timeout and every assert ran on a finished duel). FIND reclaims
any waiting seat the uid already holds, so a stale room from a previous run
(the rematch nobody answered) must be swept BEFORE the run. Two game bugs
the harness's real taps exposed, both fixed in v0.49.0: a refill tile was
tappable while still falling (it crosses the rival's nameplate on the way
down — a tap on the name wove the tile, and the solver froze on a selection
it never made), and the other client settling the room on your wound
before your cast animation landed let the animation's tail write `state =
'pick'` over `'done'`, which killed REMATCH.

## tagline-check.mjs

THE HOME MENU's own harness (v0.46.0 flavour cull · v0.47.0 campaign doors ·
v0.51.0 HOME RESHAPE · v0.52.0 leaderboard into the profile — 68 checks). The
column since v0.52.0, top to bottom:
`[CONTINUE GAME while a climb stands] · NEW GAME · VERSUS`.

- **LEADERBOARD left the meadow (v0.52.0, Wyatt 8/25).** It is a door in the
  PROFILE now — `Profile.leaderB` / `leaderT`, right under the star rating,
  dressed like the ✦ YOUR SKIES › door — opening the same Board ceremony with
  `{ from: 'profile' }`, so its back link reads ‹ PROFILE and returns there
  (‹ HOME from the profile closes the chain). The Board spends its start data
  on create: Phaser replays the LAST start data for a `start()` that passes
  none, so a bare `scene.start('board')` would otherwise inherit a stale
  `from`. No new strings — `board` / `profile` / `home` keys reused. With a
  checkpoint the column reads 454/522/590, without one 488/556.

- **CONTINUE GAME exists only while a checkpoint stands.** Without one it is
  NOT RENDERED AT ALL (the v0.47.0 grey dress retired — `visible` carries the
  state, because the intro and wake paths restore every ui item's ALPHA to
  `baseAlpha` and would undo any alpha dress). `home.refreshCampDoor(snap)`
  is still the one door for the state, and `home.layoutMenu(snap)` closes the
  ranks: visible rows sit 68 apart centred on 522 — three rows read 454..590,
  two read 488..556, never a gap. `campaignCheckpoint()` validation
  unchanged (older build's save re-derives `actIdx`, garbage reads as none).
- **QUICK PLAY's button left the meadow** (Wyatt is testing the menu without
  it and may bring it back). The MODE is intact — daily chip, `m:'quick'`
  leaderboard rows, in-battle labels, and `?quick=1` boots straight into a
  quick run (no intro) for any harness that used to tap the button.
- **The rename is total**: `newCamp`/`contCamp` and the restart sheet's
  `restartTitle`/`restartBody` say game, not campaign, in all ten languages
  (the suite scans for each language's old campaign word). The `quick` string
  key deliberately SURVIVES in every language.
- **The tagline is MEASURED, not eyeballed** (v0.51.0: parchment-gold ink,
  the crest's navy rim + letterpress glow — the old `#8a94c4` measured
  1.04:1 against the dusk rose band, i.e. invisible, which was exactly the
  complaint). `game.renderer.snapshot` → the text rect + two side strips of
  pure band on the same rows; bright/dark = top/bottom 4% of WCAG-linearized
  luminances. Asserted on BOTH skies: one side of the glyph pops from the
  band (the gold on dusk ~2.1, the rim on dawn ~8-9 — gold ink alone MELTS
  into the bright dawn band at 1.14, the rim is what carries it) and the
  core-vs-rim span beats the old grey's whole contrast by ≥1.5×. Pins sit
  under the 2026-08-25 measurements with margin; re-pin from the printed
  line if the ink or the sky changes.
- The v0.46.0 laws still hold: labels dead-centre in 58-tall buttons, only
  LIVE sub-lines (campaign progress, friends online) via
  `home.setRowSub(key, text, color, snap)`, the label gliding 9 for them;
  retired `*Sub` keys stay gone from all ten languages.

```
node tools/tagline-check.mjs 9444     # served on :8899, --disable-gpu Chrome on :9444
BEFORE=http://localhost:8898/index.html SHOTS=/tmp/shots node tools/tagline-check.mjs 9444
```

Walks both checkpoint states plus `?lang=de` / `?lang=ja` boots on REAL taps
aimed at the labels: CONTINUE hidden then shown (and the tap chain NEW GAME →
sign sheet → unsigned climb → star chart node → a real campaign battle),
the restart sheet (BACK keeps the climb, NEW wipes it and the door VANISHES
with the column closing live), the won-campaign dawn return, friends
presence, and the `?quick=1` seam. Firebase is BLOCKED at the network layer
(`Network.setBlockedURLs`) — the suite plays campaigns to their end and must
never write a live row. It also wipes `beta3.profile`/`beta3.lang` at boot
(a leftover `?lang=ja` run failed the label pins, and a grown profile's
forge ceremony once veiled the dawn measurement black), and grants all 24
sigils before the win flow for the same reason. `BEFORE=` a served copy of
the previous build adds a before/after snapshot pair.

## drip-check.mjs

The sigil drip's own harness — both halves (v0.43.0). `fps-check.mjs` pins
the three LAWS — the pool never starves, nobody who already plays loses a
sigil, and no sigil is ever listed asleep and awake at once — while this one
walks the whole mechanic: the starting twelve and their tier split, the twelve
locks and the twelve stats behind them, the counters under a real demo run
(plus the two a demo cannot reach, driven through their real code paths), the
unlock at a LOSS's end, THE FORGE CEREMONY (its dress, its screen-space
drawing, one real tap to dismiss, and two discoveries queueing rather than
stacking), THE SLEEPING GALLERY (the profile door, the STILL SLEEPING section,
every bar against the counter behind it, the silhouette that gives away
nothing, and the migration from asleep to held), persistence, versus's
immunity, grandfathering in seven shapes, and the copy in ten languages. Same
CDP shape as `streak-check.mjs`, on its own port so all three suites can run
side by side; `--disable-gpu` is fine.

```
node tools/drip-check.mjs      # served on :8899, headless Chrome on :9445
```

⚠ **Run the suites ONE AT A TIME.** Three headless Chromes at DPR 3 will
starve each other's game loop on this box (one renderer was measured at 295%
CPU), and a starved loop reads as a wall of red in whichever suite is
unlucky — 2026-08-21, streak-check went 58/58 → 50/58 → hard crash purely from
company. It also reproduces on a *previous* commit, which is how it was
identified. Kill every `/tmp/cdp-*` Chrome between suites.

Six things this file learned the hard way:

- **Inside a Container it is the CHILD's scroll factor the camera consults,
  not the container's.** A full-screen beat whose container carries
  `setScrollFactor(0)` while its children do not is drawn in WORLD space — on
  the meadow, whose camera sits thousands of pixels down the sky, that means
  drawn nowhere. Every child of the forge ceremony sets it for itself, and the
  harness asserts it rather than trusting a screenshot.
- **A `\/` inside a template literal is just `/`.** The gallery reader
  originally filtered its bars with `` `... / \/ /.test(t) ...` ``, which
  reached the page as `/ / /` — a syntax error thrown from inside
  `Runtime.evaluate`, twenty lines from anything that looked wrong. Use
  `indexOf(' / ')` in an evaluated string, never a regex with an escaped
  slash.
- **The meadow's ceremony fires about a second after the grass does.** A
  harness that waits out a 12-second navigation and *then* looks finds an
  empty meadow and calls a working feature broken. Start the poll before the
  boot settles.
- **The demo solver is never struck.** It fells everything before the timer
  runs out, so `hit` and `brnk` stay at zero through a whole automated run.
  Both are driven for real instead: `shieldUsed = true; beast.count = 1;
  tickEnemy(() => {})` for the strike, and `beast.hpNow = -64; run.hp = 9;
  beastDeath()` for a fell on the brink.
- **`110`, not `111`, is the correct tier-fall.** Three legendary rolls
  against a starting pool holding one legendary (already taken) and two rares
  give two rare cards and then a basic — the board spends the rares itself as
  it fills.
- **Verifying the ceremony on `?rend=gl` needs a different tap and a different
  camera.** The swiftshader box runs the loop as slowly as **1 fps**, and at
  1 fps a press+release 60 ms apart lands inside a single frame, so Phaser
  never sees a pointer that was DOWN and nothing is ever clicked. Move, wait
  ~600 ms, press, **hold ~2.2 s**, release. And `Page.captureScreenshot` on a
  WebGL canvas hands back an early or stale frame (no `preserveDrawingBuffer`)
  — the 2026-08-21 GL shot of the forge rite showed a bright meadow and no
  copy at all, which looked exactly like a broken renderer and was not.
  `game.renderer.snapshot(img => …)` reads the buffer properly.
- **At 1 fps the scene clock stretches every tween ~25×**, so a rite that
  looks finished after 3 wall-clock seconds at 60 fps is still at veil 0.79
  and every word at alpha 0. Poll the display list's alphas; never sleep and
  shoot.

## device-rows.mjs + dev-check.mjs — the device report and the crisp sentinel (v0.50.0)

Wyatt's phone rendered v0.49.0 uniformly SOFT inside the TestFlight app —
sky, buttons, title, sigil cards, body text, all a 2–3× upscale of a small
buffer (`~/starspell-jumpr/ref/wyatt-blur-*.jpg`, a 1170×2532 screenshot:
a 390×844 @3 class phone) — while headless Chrome at the same CSS size and
DPR is pixel-crisp. The game had never said one number about the device it
runs on, so v0.50.0 is the INSTRUMENT, not a fix (instrument before
guessing). Nothing player-facing changed.

**The device report** (`ssDeviceBeat` in game.js) is one ~560-byte object
built after `ready` and after every viewport settle: ua, the iOS shell's
`__STARSHELL` build, standalone, `location.search` (a stale `?dpr=1` in a
Home-Screen bookmark would explain everything), inner + visualViewport
dims, `devicePixelRatio` vs the `DPR` the game chose, the canvas buffer /
clientWidth / computed style / `game.scale`, renderer + `SS_REND`
mode/why + probe ms + gpu string, `gl.drawingBufferWidth/Height` under
WebGL, deviceMemory / cores, the insets, and three counts — `<canvas>`
elements, Phaser Text objects alive (each is its own canvas) and textures.
It goes three places: `devices/<uid>` in the RTDB (same SSNET channel and
uid as `players/<uid>`, overwritten per device, throttled to changes or
60s), a 5-deep `beta3.devlog` localStorage ring, and four `dev …` lines in
the `?diag=1` box (painted again only when something changed, so the crisp
lines survive the settle loop's four re-polls). The harnesses' `test_`
identities write nothing home unless the run passes `?devreport=1`.

**The crisp sentinel** runs inside the same beat: `canvas.width` must equal
`round(clientWidth × DPR)` on both axes and, under WebGL, the drawing buffer
must equal the canvas (iOS can silently allocate a smaller one — Phaser
never checks). A settle measures the canvas AS THE VIEWPORT LEFT IT before
the resize/fit path runs (`found`, kept for the session with the tag it
happened under), and the beat measures again after; a miss that survives
is DIAGed `crisp: … — healing`, healed ONCE by re-running
`scale.resize` + `fitCanvas`, and the report carries `crisp`, `found`,
`miss` and `heals`. A forced `?dpr=` that disagrees with the device is
named as `dprOff` (the fit path cannot heal a choice) and makes
`crisp:false` without a heal. On every desktop browser and every harness
the measure simply agrees: zero heals, nothing moves.

```
node tools/device-rows.mjs                 # every devices/* row, newest first
node tools/device-rows.mjs --name=hare     # filter by players/<uid> name
node tools/device-rows.mjs --uid=u26 --json
node tools/device-rows.mjs --all           # include test_ identities

node tools/dev-check.mjs                   # served on :8899, Chrome on :9447 (either renderer)
```

`device-rows.mjs` is read-only over the RTDB REST endpoint and joins the
name from `players/<uid>`. `dev-check.mjs` is the sentinel's harness —
21 checks: the report after ready (buffer = css×dpr, crisp, under 1 KB, the
counts, the query), the diag lines, the ring, the row landing in the RTDB
with a throwaway `test_dev…` identity (deleted at the end), a forced
mismatch (`canvas.width = 500`) caught AS FOUND by the settle and healed,
a live mismatch healed by the beat itself with the RTDB row overwritten,
and a plain boot that heals nothing, paints nothing and writes nothing.
Run it once under `--disable-gpu` and once with the swiftshader flags to
walk both the Canvas and the `drawingBuffer` branches.

**Reading Wyatt's phone:** once he has relaunched the app on v0.50.0,
`node tools/device-rows.mjs --name="<his name>"` prints the row. The
things to compare first: `dpr` vs `DPR` vs the `?` query (a forced dpr),
`buffer` vs `css × dpr` and vs `gl drawingBuffer` (a small buffer), and
`visual @scale` (a zoomed visual viewport reads as blur too).

## crisp-check.mjs — the portrait device matrix (v0.50.1)

Wyatt's standing order: "make sure the game looks good in portrait no matter
what the device is." This is the proof. Eight phones, each emulated over CDP
(`Emulation.setDeviceMetricsOverride`: mobile + touch, the real css size and
devicePixelRatio, the notch insets through `?inset=T,B`), and on each the four
surfaces — home, a battle board, CHOOSE A SIGIL, the daily share card — walked
with REAL TOUCHES (`Input.dispatchTouchEvent`), asserting geometry (buffer ===
css × dpr, game.scale === buffer, no CSS transform, visualViewport scale 1, the
v0.50.0 sentinel crisp with zero heals), SHARPNESS, layout (safe band, nothing
clipped, ≥ 44-pt tap targets, no text overlaps, the one-line law) and that
every tap landed.

```
python3 -m http.server 8899 &
node tools/crisp-check.mjs                    # all eight + the ?dpr=1 control (~2.5 min, --disable-gpu)
node tools/crisp-check.mjs --only=se,16       # a subset (substring of the id); --nocontrol skips the blur run
node tools/crisp-check.mjs --gl               # swiftshader GL instead of Canvas
SHOTS=/tmp/crisp node tools/crisp-check.mjs   # keep a PNG per surface
```

**The sharpness metric.** `Page.captureScreenshot` at device px (what the
screen shows — a small buffer stretched by CSS arrives stretched), cropped to
the title / button-label / tile regions; mean |Laplacian| of luminance, divided
by the same for that region shrunk to 1 css px per px and bilinearly stretched
back (= a 1× buffer upscaled, Wyatt's phone). Measured 2026-08-21, Canvas
renderer, min ratio per surface (home · battle · sigils · share):

| device | css @dpr | home | battle | sigils | share |
|---|---|---|---|---|---|
| iPhone SE | 375×667 @2 | 2.77 | 2.28 | 2.00 | 2.10 |
| iPhone 8 Plus | 414×736 @3 | 3.10 | 2.61 | 2.86 | 2.51 |
| iPhone XR / 11 | 414×896 @2 | 2.23 | 1.93 | 2.13 | 2.05 |
| iPhone 13 mini | 375×812 @3 | 3.70 | 2.73 | 2.67 | 2.61 |
| iPhone 15 / 16 | 393×852 @3 | 3.87 | 2.70 | 2.38 | 2.12 |
| iPhone 16 Pro Max | 440×956 @3 | 2.95 | 2.16 | 2.71 | 2.06 |
| iPad portrait | 820×1180 @2 | 2.10 | 1.83 | 2.04 | 1.77 |
| small Android | 360×800 @2.625 | 2.68 | 2.76 | 2.79 | 2.28 |
| **15/16 at ?dpr=1 (control)** | 393×852 @3 | 1.22 | 1.26 | 1.26 | 1.23 |

The PIN floors (1.55 at dpr ≥ 3, 1.4 at 2.625, 1.3 at 2) sit between the
crisp pack and the control's ~1.25 with margin on both sides; the control's
ceiling is 1.35. Re-pin from the printed table if the art changes. 242/242 on
the first full run; the 2× devices (XR, iPad) score lowest because the shrink
is only 2× — still 40 % clear of the floor.

**No device profile reproduces Wyatt's blur.** Every one of the eight boots to
a full-DPR buffer and a crisp frame in headless Chrome, so the blur is not in
the game's scaling law for any phone geometry — it lives on his device / shell
(the v0.50.0 device report in `devices/<uid>` is what will name it).

**What the matrix DID find: tap targets under 44 pt** (the 🔊/🌐 glyphs at
13×15, ‹ back at 8×23, the ✕ closes, the profile chip / rating pill / daily
chip, and on narrow phones every 44/46-pt design button, since the 420-wide
design box scales to 0.83–0.94 css px per pt). Fixed in game.js by `ssHitPad`:
`setInteractive()` is wrapped so every RECTANGULAR hit area is padded, centred,
to ≥ 44 css pt on each axis — the art keeps its size, only the hit rect grows.
Custom shapes / pixel-perfect areas are untouched; the first rect is kept on
the object so a re-pad is never cumulative; a swapped texture (the lantern
lighting up) re-bases on the new frame. `ssHitPad(o, 44, 'up'|'down')` anchors
growth for stacked pairs (profile chip over rating pill) so the lower never
steals the upper's taps.

Gotchas:

- **`DPR` is a script binding, not `window.DPR`.** The page-side lib reads it
  by name inside an evaluated function; `window.DPR` is undefined.
- **Taps repeat until the scene answers** (`touchUntil`): objects built in one
  frame register with the input plugin on the next, and at software frame
  rates a touch fired the instant a surface appears is simply lost.
- **Full-screen blockers are skipped by size** (≥ 90 % of both axes), and
  everything drawn before an opaque veil is dropped from the layout walk — it
  is neither tappable nor read.
- **Text ink vs canvas**: a Text's canvas carries its shadow/glow padding; the
  band and overlap checks strip `padding` so a glow under the safe line is not
  a fail.
- **No `timeout` on macOS** — `perl -e 'alarm 580; exec @ARGV' node tools/crisp-check.mjs`
  caps a foreground run (the JUMPR rule: never background a harness).

## click-test.js

Verifies the game is actually **clickable**, which a screenshot cannot. Drives headless
Chrome over the DevTools protocol from node (node 22 has a global `WebSocket`, so there is
no puppeteer dependency), synthesises a real press+release on the first button, and reports
which scenes went active.

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-sandbox --enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader \
  --remote-debugging-port=9333 --user-data-dir=/tmp/cdp --window-size=390,844 \
  --force-device-scale-factor=3 about:blank &

node tools/click-test.js "http://127.0.0.1:8781/index.html?art=1" click
```

Two things it will not work without:

- **`--force-device-scale-factor=3`.** At DPR 1 the canvas attribute size equals its CSS
  size, so pointer-scaling bugs are invisible. This is exactly how v0.5.0 shipped with a
  completely unclickable UI behind five clean screenshots.
- **Cache disabled** (the script sets `Network.setCacheDisabled`). The `?v=` stamps on the
  script tags will otherwise hand you the previous build, and you will "verify" the bug you
  just fixed.

Healthy output has `displayScale` equal to the device pixel ratio — if it reads `1.000` at
DPR 3, pointer coordinates are unscaled and nothing on screen is hittable.

If the page crawls (~5fps rAF, a renderer process pinned at 500%+ CPU), the swiftshader
GL path has gone pathological — seen with Chrome 150 (2026-08): the same scene that ran
60fps two days earlier rendered at 3-5fps, which silently stretches every scene-clock
timer ~25x and makes "the game is frozen" a false diagnosis. Swap the three GL flags for
`--disable-gpu`: Phaser falls back to its Canvas renderer, real clicks and
`--force-device-scale-factor=3` still work, and the loop runs at 60fps again.

A LONG-LIVED headless Chrome eventually stops running the game loop altogether
(2026-08-20, ~40 min in): scenes never start, `busy()` sticks true forever, and
every check after that point fails at once while the page reports no
exceptions. It is the browser, not the build — kill it and launch a fresh one
before believing a wall of red. Related: `?rend=gl` cannot pass under
`--disable-gpu` (the harness aborts on `game === null` there), so a FULL
fps-check run needs the three swiftshader flags and takes ~25 minutes at the
~12fps they impose. `streak-check.mjs` forces neither renderer and runs happily
on `--disable-gpu` in about four.

Serve the folder over HTTP rather than opening `file://`: the painted art is drawn into
canvas textures, and a `file://` image taints the canvas so the WebGL upload throws.

## Time travel: `?daykey=` and `SSNET.setDayKey()` (v0.39.0)

The streak lantern only means anything across days, and a test cannot wait one.
Two dev-only seams in `net.js`, both aimed at `SSNET.dayKey()`:

```
http://localhost:8899/index.html?daykey=20260601     # pin today's key at boot
SSNET.setDayKey('20260602')                          # move it mid-session
SSNET.setDayKey('')                                  # back to the real clock
```

Only the **no-argument** `dayKey()` is overridden. `dayKey(someDate)` — which is
what `pruneBoards` and anything else asking about a specific date uses — always
gets the truth, so a fake today cannot make the pruner sweep live boards.

Two things to know before using it:

- **It moves the whole daily surface, not just the streak.** The board seed, the
  RTDB path (`daily/<key>`) and the played-flag all follow it, so a harness that
  plays dailies under fake keys writes real rows to future days. Those days will
  never be pruned (the sweep only deletes keys *older* than its cutoff), so
  delete them yourself: `curl -X DELETE .../starspell/daily/<key>.json`, plus the
  `players/test_*` and `weekly/<week>/test_*` rows the run leaves behind.
- **Mid-session moves are the only way to test rollover.** The meadow's daily
  chip and lantern re-check on a 1s tick; `setDayKey` then waiting ~2.6s proves
  midnight lands without a reload. Do not use a 1.6s wait — under load the scene
  clock stretches and a single tick may not have fired yet, which reads as a bug
  that isn't there.

## The grace night and the marks (v0.40.0)

Part 2 of the lantern adds state that `?daykey=` alone will not put you in.
The whole ledger is one object, so a harness sets it directly:

```js
SS.prof.streak = { n, last, best, g, gp, gd, mk, pend }
```

- `g` 0/1 — the grace night in hand. `gp` 0-4 — nights walked toward
  re-earning a spent one (five re-earn it). `gd` — day keys a grace actually
  bridged; the week strip draws its ◌ rings from this and from `p.daily`.
- `mk` — the highest mark (7/30/100) this run of the streak has celebrated.
  `pend` — a mark earned but not yet honoured on the grass.

Three things that are easy to get wrong when testing this:

- **The grace is spent by the HUNT, not by the miss.** At a two-day gap with a
  grace in hand, `ssStreakCount()` still returns the streak and
  `ssStreakState().grace` is true — the lamp is meant to keep burning while
  the player still has tonight to come back for it. Nothing is deducted until
  `ssStreakNote()` runs.
- **`pend` survives a reload on purpose**, so a mark earned on the end screen
  still gets its ceremony if the app was closed there. `milestoneCheck()` then
  POLLS for a meadow that is standing still (no ascent, no sheet) for ~16s.
  A test that sets `pend` and looks immediately will find nothing; poll for
  `home.riteC`.
- **A leftover `pend` in `beta3.profile` poisons the next test.** The rite
  opens over the meadow on the next boot and the run you *meant* to test is
  behind a veil. Reset the whole streak object between cases.

The lamp is five baked textures (`lantern-cold`, `lantern-lit`,
`lantern-m1..m3`) rather than one tinted image — `setTint` is a silent no-op
under the Canvas renderer and this game boots either. `SS_LANTERN_W/H/Y/TY`
are the display constants; the texture carries 13 units of transparent crown
margin above the lamp body, and `SS_LANTERN_Y` is exactly half the height so
the sprite's top edge lands ON the safe band and never under a notch.

## The sigil drip: the profile IS the seam (v0.42.0)

There is no `?drip=` flag, because there does not need to be one. Everything
the drip does hangs off `prof.sig`, and a harness sets it directly:

```js
SS.prof.sig = { u: { longbow: 1 }, c: { w6: 8, frg: 25 }, pend: [], gf: 0 }
localStorage.removeItem('beta3.profile')      // …or start from nothing
```

- `u` id → unlocked stamp · `c` the counters · `pend` unlocked but not yet
  announced · `gf` this profile was grandfathered.
- `ssSigilOpen()`, `ssSigilUnlocked(id)`, `ssSigilStat(key)`,
  `ssSigilProgress(sg)` and `ssSigilCheck()` are all plain globals, so the
  whole rule set can be asserted without a pixel.
- **The grandfather decision is made ONCE**, when `sig` is first created, and
  saved on the spot. To re-test it you must delete the whole profile, not just
  its stats — a profile that already carries `sig` will never re-decide.

## The forge ceremony and the sleeping gallery (v0.43.0)

Part two of the drip has two surfaces and no new flag either.

**The ceremony** (`ssSigilRite` / `ssSigilAnnounce`, `SS_RITE.busy`) is a
full-screen beat in the mark rite's language: veil at **0.985** — not the mark
rite's 0.9, because this one prints its copy across the middle of the screen
where the meadow's own gold buttons live, and at anything lighter their
letters read straight through the sigil's name — the glyph rising in a baked
`ssSigilMedalTex` medallion, the name in `ssGoldTex`, the rarity ribbon, the
effect, the condition that earned it, and "now appearing in your skies."

- Its container stamps `setData('sigilRite', id)`. That is the harness handle:
  which rite is up, and how many are (the answer must always be ≤ 1).
- `SS_RITE.busy` is part of `Home.busy()`, so no run can start, no sheet can
  open and no mark rite can cut in while a discovery is being held.
- The queue is spent **as each rite is built** — not when it is scheduled (a
  scene that dies first must leave the rest in `pend` for the grass) and not
  when it closes (being told twice reads as a bug).
- Lines under the nameplate stack on MEASURED text heights (`o.height / l.s`),
  because a two-line German effect and a two-line German condition are both
  ordinary and a fixed ladder either overlaps or leaves a hole.

**The gallery** is `ssSigilPanel(scene, { …, sleeping: true })`. It appends a
STILL SLEEPING section built from `SS_SIGILS.filter(s => s.lock &&
!ssSigilUnlocked(s.id))` — the same truth `ssSigilOpen()` draws pick boards
from, which is what makes the no-double-listing law hold by construction
rather than by care. Rows are heterogeneous now, so the panel lays out on a
prefix sum of per-row heights; the mask and the drag-scroll still read
`contentH`.

- The Profile's `✦ YOUR SKIES n / 24 ›` door reads the sky **live** on every
  open (`ssSigilOpen()` inside the handler, `dressDoor()` on close). Baking
  the list at scene build was the one real bug this task shipped and caught:
  a rite handing a sigil over while the profile stood open left the gallery
  one short.
- A sleeping row shows the rarity ribbon and NOTHING else that identifies it —
  no name, no glyph, no effect. `ssSleepCardTex` is a separate baked card
  (slate glass, dashed frame, empty socket) rather than a tinted one, so the
  Canvas renderer needs no tint at all.
- `barW = maxW - 72`. The panel's mask ends at design x 186, so a bar wider
  than its row is not merely ugly — it is CUT at the window's edge, which is
  how the first draft looked.

## The share card, and clicking a button that was born this frame (v0.41.0)

The daily's SHARE button copies `ssShareCard(...)` — a pure builder, so
`fps-check` asserts the string itself before it ever touches the UI, and the
same function is what the button runs. Two things that only show up when you
test it for real:

- **A single click on a just-built end screen is dropped.** The window's
  buttons are created and made interactive in one frame, and Phaser registers
  them with its input plugin on the NEXT update. Under the software renderer
  (~12fps) a click fired the instant the label appears lands on nothing, and
  reads exactly like a broken button. The suite's `tapUntil` re-taps every 3s
  until the effect shows — the same POLL, NEVER SLEEP law as the scene timers.
- **`beta3.result` is stamped on the way HOME, not by `endRun`.** A harness
  that reads it straight after ending a run gets the PREVIOUS run's score and
  "proves" the card is wrong. For a daily, `SS.prof.daily[<dayKey>]` is the
  score the end screen actually used.

The clipboard is read back by defining an own `navigator.clipboard` property
with a capturing `writeText` (the prototype getter cannot be assigned over),
and the WKWebView fallback by hooking `document.execCommand` and reading
`document.activeElement.value`. `navigator.share` is replaced with a tripwire
for the whole section: it proves the game never calls it AND makes sure the
native macOS sheet can never open and freeze the browser (see below).

## The honest copy and the banner policy (v0.43.1)

TestFlight 1.0 (1) proved that in the WKWebView shell `navigator.clipboard`
EXISTS but `writeText()` REJECTS (NotAllowedError) — so a WKWebView stub must
be a clipboard whose writeText rejects, **never** `clipboard: undefined`
(that tests a browser that does not exist). Every clipboard write now funnels
through `ssCopyText()` (game.js): awaited async write, rejection falls
through to the readonly-textarea + execCommand path, resolves true only when
a path really copied — and the share button fires on the UP via `vsOnTap`
(touchstart is not an iOS user activation; touchend is).

The banner policy (compat.js): an unhandled REJECTION never paints for
players — it is appended to the `beta3.diaglog` localStorage ring (last 20)
— while under `?diag=1` it paints as before and the stored ring is replayed
at boot. Three harness traps:

- **The replay must land in the tap-to-dismiss errbox, not the rolling
  diagbox** — the boot's own DIAG chatter (five `vp … minor` lines alone)
  floods the 14-line window in seconds, and a harness that polls the diagbox
  "proves" the replay broken.
- **Phaser's "Cannot create WebGL context, aborting." throw is ASYNC** — it
  escapes the workload probe's try/catch and used to paint a red box over a
  perfectly working canvas game on any GL-less box (headless `--disable-gpu`
  reproduces it on a COLD profile only: the verdict is cached 7 days).
  `window.__ssProbing` marks the probe window; compat.js gates exactly that
  message inside it. The same throw from the real game still paints.
- A synthesized `window.dispatchEvent(new ErrorEvent('error', {message,
  filename, lineno}))` runs the real compat handler and never opens a native
  dialog — that is how the error path is pinned without crashing anything.

## One line per Text: desc-check.mjs (v0.44.0)

TestFlight v0.43.0: FIRST LIGHT, BLOOD INK and LEYLINE ROOTS reached Wyatt's
phone with NO effect text, and v0.38's MOONWARD before them. The pattern that
cracked it: **every victim is a desc that wraps to a second line**, every
one-line desc renders, and it is deterministic per sigil. It has never
reproduced in headless Chrome or real desktop WebKit, on either renderer — so
do not chase a local repro. A Phaser multi-line wrapped-italic bake is
inkless on iOS WebKit for these strings, and the healer's re-bake fails the
same way (on his phone it had been "healing" these cards on every pick and
shipping blanks).

The fix that cannot lose: **no desc bakes multi-line in a single Text.**
`ssWrapLines` asks Phaser's own wrap measurement for the line strings (so the
breaks land exactly where `wordWrap` put them — desc-check pixel-compares a
two-line card against a legacy wordWrap card at the same spot and gets an
average channel diff of 0.04), and `ssTextBlock` renders one single-line Text
per line, stacked at `lineHeight + lineSpacing`, inside a Container that sizes
itself so `.height` reads like a Text's (the rite's measured ladder depends on
it). Used by the pick card, the inspector rows, the sleeping gallery's
conditions, the forge ceremony's effect + condition, the abandon dialog, the
zodiac pick's desc and versus's wrapped notes. `setText`/`setColor` rebuild in
place, so call sites that re-set a label did not change.

- **ja/zh wrap without spaces**: those take Phaser's char-level
  (`useAdvancedWrap`) measurement — the old basic wrap left them one
  overflowing line. Arabic and Hindi split only at spaces; each line is
  shaped and bidi-ordered by the canvas on its own, exactly as it was inside
  one canvas. A run that cannot break inside the width shrinks the block's
  font (to 70%) rather than ever baking multi-line.
- **The healer now confirms its heals.** After `updateText()` the canvas is
  sampled again; a Text that stays inkless is NOT counted and DIAGs as
  `unhealable: <first four words> · <tag>`. If Wyatt's phone ever shows that
  line, the bug has moved and has a name.
- **`getWrappedText()` returns an ARRAY in Phaser 3.90**, not a string — the
  first draft of the wrapper called `.split` on it.
- **Pixel-compare two cards at the SAME position, sequentially.** A card 200
  design units lower sits at a different fractional pixel, and every
  antialiased edge then differs by itself (avg diff 3.7 for identical cards);
  and put an opaque ground under them, or the sky gradient is the diff.
- The suite readers in drip-check and fps-check collect `o.text` from a
  block container too (`getData('textBlock')`), because `txt.includes(desc)`
  on the line Texts alone would never match a two-line desc.

```
node tools/desc-check.mjs      # served on :8899, swiftshader Chrome on :9446
```

86 checks: 24 sigils × 10 languages on the pick card, the inspector + gallery
and the rite, on BOTH `?rend=cv` and `?rend=gl` — every line inked, no
newline, breaks matching legacy wordWrap (or fitting, for CJK), scrollFactor 0
on every rite child, the ladder on measured height, the healer drill, a real
tap through a pick of the three phone cards, and real `?lang=ar` / `?lang=ja`
boots. `SHOTS=<dir>` keeps the snapshots.

## Harness gotchas learned on the friends/invites work (v0.25.0)

- **Never let headless Chrome reach `navigator.share`.** Headless Chrome on macOS still
  has it (127.0.0.1 is a secure context), and calling it inside a user-activation window
  opens the NATIVE macOS share sheet — the whole browser process blocks (every CDP eval
  and even `/json/list` hang) and a panel pops on Skylar's desktop. Strip it with
  `Page.addScriptToEvaluateOnNewDocument` (`navigator.share = undefined`, and
  `navigator.clipboard = undefined` so the game falls through to `execCommand('copy')`).
  It only bites after a REAL synthesized click (transient activation lasts ~5s), which is
  why an auto-run `?frdemo=invite` boot never showed it.
- Objects inside a Container are not in `scene.children.list` — search `container.list`
  (`overlayC`, `lobbyC`, `frC`, `bannerC`).
- Click at `getBounds().centerX/Y`, not at `(x, y)`: a left-anchored text's origin sits
  exactly on its hit-area edge and the rounded pointer lands one pixel outside it.
- Subtract `cameras.main.scrollX/Y` from world coords before `Input.dispatchMouseEvent`
  — the versus lobby lives at the meadow (`zenithAtZero` sky, camera scrolled ~4200px).
- `Runtime.evaluate` with `returnByValue` on a Phaser game object comes back `undefined`,
  not truthy — always wrap finders in `!!(...)`.
- Friends recipes: `?frdemo=host&mpuid=a` (befriend test_b, wait online, CHALLENGE),
  `?frdemo=guest&mpuid=b` (auto-ACCEPT the summons), `?frdemo=invite&mpuid=a` (INVITE A
  FRIEND → private lobby), `?frdemo=join&mpuid=x` (solver on, nothing automatic — the
  real-click harness drives it). Beacons: `beta3.summons`, `beta3.deeplink`,
  `beta3.vsresult`. Clean up `friends|recent|invites|presence|players/test_*` after.

## names-check.mjs — unique player names (v0.53.0)

One person per name, so a player can be reached by name alone (task 43
builds the reaching; this is the registry). `names/<key>` → uid in the
SSNET RTDB, `<key>` = `SSNET.nameKey(name)`: NFKC, trim, collapse
whitespace, lower-case, RTDB-forbidden `. # $ [ ] /` → `_` (the header of
net.js is the spec). A claim is a transaction (`SSNET.claimName`): it lands
only when the key is free or already yours. A fresh device (`starspellNameFresh`
set by the first mint) keeps minting until its claim wins, silently. An
existing player claims their standing name at connect and on every profile
sync (`ensureName`, one proven key cached per session); beaten to it, they are
re-minted (`mintClaimed`: 8 fresh mints, then `<Second word> <3 digits cut
from the uid>`) and told ONCE, in fiction (`nameTakenTitle/Body`), by the
`ss-renamed` event → `ssRenameNotice` on whichever scene is live, or the
meadow the next time it builds. A rename onto a taken name is HELD: the old
name comes back with `nameHeldTitle/Body`; a clean rename releases the old
claim. THE CIRCLE's mages claim over their own `SSNET.side('rival')` door
before they take a seat (`SS_RIVAL.claimCircleName`); `?botduel` seats and
`test_` identities (`?mpuid`) never enter the registry. RTDB security rules
are not managed in this repo (the database is open, hobby-scale) — constrain
`names/<key>` there when rules land.

```
python3 -m http.server 8899 &
for p in a:9448 b:9449; do "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-sandbox --mute-audio --disable-gpu --remote-debugging-port=${p#*:} \
  --user-data-dir=/tmp/cdp-names-${p%%:*} --window-size=390,844 --force-device-scale-factor=3 about:blank & done
node tools/names-check.mjs      # 67 checks, ~2 min, deletes everything it wrote
```

Two REAL throwaway uids (seeded into localStorage by
`Page.addScriptToEvaluateOnNewDocument`, with `sessionStorage.beta3.skipIntro`)
race one standing name at connect: exactly one holds it, the loser is
re-minted and sees the notice on the meadow; then the instant race (both
`claimName` transactions fired in the same tick, 3 rounds), held/free renames,
the silent fresh-device path, the `test_` exemption, the circle, nameKey, and
the desc law on the notice in all 10 languages (no child Text holds a
newline, every line fits 292u). Harness lesson: a `Page.navigate` fired while
about:blank is still settling can be DROPPED — `nav` proves `location.href`
and `typeof SSNET` before waiting on the game.

## byname-check.mjs — challenge by name (v0.54.0)

A duel started from a name alone (task 43, on task 42's registry). VERSUS
has a BY NAME door beside the seal code: the same floating DOM input the
rename and seal code use (`ssDomInput`, fixed-position, scene-tied — the
iOS keyboard never touches the canvas, and the crisp sentinel stays green)
takes a name, `SSNET.findByName` folds it through `nameKey` (case, spacing)
to `names/<key>` → uid and reads the name back as its owner wears it, and
`VsMenu.challenge` rings the EXISTING bell (`invites/<to>/<from>`, a
private room sealed with `invited`). Online → the usual "waiting for X to
answer"; away → `vsWaitAway` ("your summons waits under their stars"),
mid-duel → `vsWaitBusy`. A miss says so (`vsNameNone`) and the field comes
back holding what was typed; your own name is `vsNameSelf`. Because a
summons ages out of `FR.pending()` after INVITE_MS (5 min), a standing
challenge lobby re-rings the bell every two minutes (`VsBattle.keepBell`,
never after a decline) — a mage arriving an hour later still finds it.

```
python3 -m http.server 8899 &
for p in a:9450 b:9451; do "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-sandbox --mute-audio --disable-gpu --remote-debugging-port=${p#*:} \
  --user-data-dir=/tmp/cdp-byname-${p%%:*} --window-size=390,844 --force-device-scale-factor=3 about:blank & done
node tools/byname-check.mjs      # 51 checks, ~2.5 min, deletes everything it wrote
```

Two REAL throwaway uids (test_ rigs never enter the registry): A taps BY
NAME for real, types B's name sloppily (`Input.insertText` + a real Enter),
lands in the lobby; B's banner rings and a real ACCEPT starts the duel. Then
the miss/retry/Escape/prefill path, own name, and the offline path: B parked,
the row lands and survives, the re-ring refreshes `at` under the same seal,
B boots later, finds and answers it. Harness lessons: tap the banner only
after its 420 ms entrance settles (a tap mid-tween lands where the button
WAS); `nav` marks the old document and never fires a second navigate over a
load in progress (that aborts game.js and versus.js throws on a missing QS);
seed guards key on the uid so a reused `/tmp/cdp-*` profile re-seeds.

## recent-check.mjs — recent rivals in VERSUS (v0.55.0)

The RECENT roll (task 44): the friends panel now holds three friend rows, a
`— RECENT RIVALS —` heading and the last three mages you crossed swords
with, newest first (`SSNET.FR.recentList(n)` — friends included, unlike the
older `rivals(n)`), each with the coarse night clock (`vsNightsAgo`:
tonight / last night / N nights ago / long ago — nights are local
noon-to-noon, so a 1 a.m. duel is still "tonight" at 3 a.m.), the friends
roll's presence glint, a gold ⚔ AGAIN and a `+` (befriend). The whole row is
the door: `VsMenu.rematch(r)` → the same `challenge(f)` a friend CHALLENGE /
BY NAME rides — online rings the bell, away lands a standing invite and the
lobby says so. A mage of THE CIRCLE is recognised by uid
(`SS_RIVAL.circle()`), rings NO bell: the private room is sealed the same
way, `challenged.circle` carries the persona, and `VsBattle.create` seats it
through `SS_RIVAL.spawn` 1.4–3s later (its own rating and row; the invite
watcher is skipped so the lobby never says "declined" while the mage walks
in). `recent/` is fed once, in `beginBattle`, for every seated opponent —
queue, seal code, by-name, challenge, rematch and the engine's seat alike —
and the FR listener paints it live. A first-night player sees `vsNoRecent`.
Fixed on the way: `(at | 0)` folded a millisecond stamp to 32 bits (every
row read "long ago"; the old `rivals()` sort suffered the same).

```
python3 -m http.server 8899 &
for p in a:9452 b:9453; do "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --no-sandbox --mute-audio --disable-gpu --remote-debugging-port=${p#*:} \
  --user-data-dir=/tmp/cdp-recent-${p%%:*} --window-size=390,844 --force-device-scale-factor=3 about:blank & done
node tools/recent-check.mjs      # 64 checks, ~3 min, deletes everything it wrote
```

Two REAL uids: the empty line; a by-name duel writes `recent/` on both
sides and the row is in memory mid-duel (no reload); back in VERSUS B is
first, "tonight", lit; a real tap on AGAIN rings B, B accepts, the rematch
lands; B offline → the same tap → `vsWaitAway` + a standing invite; then A
searches alone, a circle mage answers, the row appears marked of the
circle, a real tap routes through the engine (no `invites/` row, private
room sealed for the mage, `seated` in `__ssRivalLog`, status active).
Harness lessons: a PARKED headless tab (about:blank) keeps its Firebase
socket for a minute or more, so the server's onDisconnect — and every
"X left the sky" check — fires late and flaky; leave the sky through the
client's own `firebase.database().goOffline()` first, then park (byname-check
now does the same). And a dropped first navigate (see names-check) leaves a
half-loaded document that throws `SFX/SS_BEASTS is not defined` — clear the
exception log after the boot that landed.
