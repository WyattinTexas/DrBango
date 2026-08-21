# beta3 dev tools

Nine scripts, all dev-only — nothing here ships to the browser.

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

## tagline-check.mjs

Also THE CAMPAIGN DOORS (v0.47.0, 57 checks). Wyatt: the first door reads
CONTINUE CAMPAIGN (`contCamp`, not the in-run `cont`); with no checkpoint it
is grey (button 0.45 / label 0.55 as BASE alphas — the intro and wake paths
restore every ui item to `baseAlpha`, so a plain `setAlpha` is undone) and
DEAD (`disableInteractive()`, a real tap opens nothing); with one it is alive
and its live line is `ACT I · fight 3 of 5`. NEW CAMPAIGN over a checkpoint
opens the restart sheet ("This will restart your current campaign in
progress." · BACK keeps the climb · NEW wipes it and the door greys at
once); with none it goes straight to the stars. `home.refreshCampDoor(snap)`
is the one door for the state and runs on first paint, every return from a
battle (a win or loss clears the checkpoint → grey again) and after NEW.
`campaignCheckpoint()` validates what it reads: an older build's save without
an `actIdx` re-derives it from the fight, garbage reads as none. Harness
lesson: `\s` inside a template literal reaches the page as `s` — the sheet
reader joins lines with split/filter, never a regex escape.

The meadow buttons without their flavour lines (v0.46.0). Wyatt: "remove the
text below CAMPAIGN, NEW CAMPAIGN, QUICK PLAY and VERSUS." The four labels
now sit dead-centre in their 58-tall buttons; the only sub-lines left are
LIVE INFORMATION — versus's `✦ N of your friends online` while friends are
on, the campaign's `fight N of 5` while a checkpoint stands — and
`home.setRowSub(key, text, color, snap)` is the one door for them: the label
glides up 9 (200ms) when a line arrives and back down when it goes. The
`campaignSub` / `newCampSub` / `quickSub` / `versusSub` keys are gone from
all ten languages (`vsFriendsOn` and `fightN` stay).

```
node tools/tagline-check.mjs 9444     # served on :8899, --disable-gpu Chrome on :9444
BEFORE=http://localhost:8898/index.html SHOTS=/tmp/shots node tools/tagline-check.mjs 9444
```

35 checks: geometry of the five rows (height, label lift, no sub showing,
LEADERBOARD still 46, daily chip untouched), the retired keys absent in
every language, two then three friends arriving through the presence layer
(`FR.friends` + `FR.presence`, `FR._emit()`) and leaving again, a checkpoint
boot wearing CONTINUE · fight 3 of 5, the abandon flow on real taps dropping
it, and all four doors opened by a real tap AIMED AT THE LABEL. `BEFORE=` a
served copy of the previous build adds a before/after snapshot pair.

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
