# first5/tools

Harness for the FIRST5 sandbox (the first-night tutorial test build at
drbango.com/beta3/first5/ — batch `ss-2026-10-07-first-night` + fix round
`ss-2026-10-08-first5-fixes` + `ss-2026-10-09-night-sky-live` card 03 +
`ss-2026-10-09-first5-script` cards 01–02).

**first5-check.mjs** — the whole-stage suite (cards 01-06 + fix 01 THE
CLEAN REFRESH + fix 02 THE STRAY SIGNS + fix 03 THE SCRY LESSON + STRAIGHT
INTO THE NIGHT + THE PAINTED FIRST FIVE + THE GUIDED HAND, ORANGE): static
seams (including THE GUIDED HAND's — twenty-four F5-GUIDED sites, the
script table for all five tongues, the rig carrying every refill of the
scripted fight, the lock on tile/CAST/SCRY, the held continuation, the
showcase trigger, the reset-before-build — plus THE SIMULATION: every
tongue's script dealt and cast exactly as the game does, against the REAL
dictionaries in ../words*.js and the live damage math — word two must
forge the orange, word three must start on it at exactly +6, VULPES must
survive, the rig must be spent, the free board dense; and including the
painted seams — thirteen F5-PAINTED sites, the live game's plate seat /
zenith crown / fight frame (ssNightSkyTex · ssNightSkyCap · ssZenithSky)
proven byte-for-byte against ../game.js, the painted wordmark branch, the
bounded boot wait for the opening's own two files through ../art, the old
110-dot seat gone from Battle.create — and the straight seams — seventeen
F5-STRAIGHT sites, the landing that STANDS instead of settling, the lean
that RESUMES the shipped rise from the title's own frame, the riser sized
to it, the stale-ref reset — and the
ground-truth scan proving every `location.reload/replace` in the copies
announces itself through `__f5survive` first, and the stray-sign seams —
no battle boot draw, six F5-FIX1-02 sites, the census tag), then live at
DPR 3 — the virgin first open (ftue owed, prefix isolation,
`window.__ssftue`), STRAIGHT INTO THE NIGHT (a page-side trace installed
at document start proves the camera never left the zenith between the title
and the fight — min p ≥ 0.9 — the meadow chrome never showed, the grass
grain never lit, the intro beacon read "stands" never "done"; proven on the
untapped 5s fallback, under emulated reduce-motion, and on the REAL lure
tap; the DPR-3 capture pair `tools/shots-straight/` title-night.png +
first-fight.png — untracked, never committed), THE PAINTED FIRST FIVE (at
the title: both art files landed, `sky.art`, the `nightskyart` plate seated
2400u tall × full width right over the gradient, the standing word is
`title@art`, its halo at the whisper 0.099, the tiers thinned to 79 dots
none past 0.24·l.s; in the fight: the sky-stays plate census — the plate
at l.y(0), the lowest child, the 27/16/8 tiers only, 8 on ADD — and the
SAME plate object still standing after the whole first lesson; §5 the
`?art=0` fallback — no plate, `title@en`, the full 233-dot tiers; §6 THE
PIXEL LAW — the LIVE game booted on the same server (Firebase blocked),
its zenith (grain hidden, p 1, chrome dark) and its title shade (p 0.92 +
the painted word at playIntro's seat) captured as `live-zenith.png` +
`live-title-shade.png`, and the first5 frames judged against them with a
dependency-free PNG reader: the first fight's outer sky strips ≥95% within
±6, the title night's full frame ≥95% within ±8, the wordmark band ≥90%),
the LURE (real CDP click at
the TITLE launches the lean and arms the sound), THE SKY LEANS IN (ember 33hp, star-write,
the density gate vs the full dictionary, curated trio, encore, the cue
ladder), THE GUIDED HAND, ORANGE (§2c: REAL taps follow the finger through
STAR, then — no free-typing gap — MOONS; the lock proven with real fingers:
a tile off the road, SCRY, and CAST with MOON standing all refused while
un-weaving stays allowed; MOONS forges the orange, which lands on cell 0
with the hand resting on it and the +6 line spoken; the pointed tile is
the first tap of SKY; the showcase HOLDS the fight — state anim, the cast
cells still empty, the fuse unticked, VULPES shown at 3 — with 16 damage /
plain 10 / +6 on the beacon, the light veil at 900, the showcase at 950,
the hand raised to 960 on the number; a real tap past the 900ms floor lets
go: the hand retires, n·o·s lands, the fuse ticks to 1, tiles answer
freely, the free board is density-gated; three DPR-3 captures in
`tools/shots-guided/` — finger-word2 · orange-intro · orange-showcase —
untracked, never committed), THE TEACHING SCRIPTS (real
dewTile/blackTile prompts, once-per-run dedupe, the forge/plant chain),
THE LIT SKY (a fell through the true chain writes the mark, the converge,
the rite still SEATING its mark + the sweep clearing the zenith, the
ledger, the kept sky surviving a CARRIED reopen, the resumed battle
booting CLEAN, a carried reopen with the night still OWED standing at the
title with ZERO kept marks, the meadow still wearing the morning-after sky
once the night is DONE), the demo
solver, THE SKYLAR SCENE (solver paused atomically at 'pick' mid-run:
zero standing marks by census, a DPR-3 screenshot kept in
`tools/shots-stray/` — untracked, never committed — and a pixel probe
proving the circled vulpes seat is clean sky while the YOU bar and the
beast constellation stand), the carried night (graft-4 resume through the
survive door, then the REAL versus retry button firing a true scripted
reload that keeps the held fight — both resumed boots proven mark-free),
the glint + both refusals, THE SCRY LESSON (§3b2: the pre-seed cleared,
an honest stall arms the gate — Skylar's line verbatim, veil at 900 with
SCRY alone above it; REAL CDP taps prove tile/CAST/back inert and the
gate standing; the real SCRY tap redeals, the count steps down [N, N−1]
under the raised pill, the cost line speaks once, the gate lifts with
every depth home; real taps select and bounce again; a later stall only
glints — the hand is never taken twice), THE CLEAN REFRESH itself
(Page.reload with no flag wipes sentinel/quickck/stat, re-opens the FTUE
gate, and the lure asks again, at the title), and the reset door (still honored,
out-ranking even a survive flag). Run from first5/ — ~13-18 min.

Sandbox-only law: the wipe-on-refresh is THE STAGE'S law, never the live
game's — see the SANDBOX-ONLY block atop first5.js before any integration.

    cd beta3/first5 && perl -e 'alarm 1500; exec @ARGV' node tools/first5-check.mjs

Run the SAME suite against the published page (after a shasum match of
the local copies vs live — §1 reads local files):

    F5BASE=https://drbango.com/beta3/first5/index.html perl -e 'alarm 1500; exec @ARGV' node tools/first5-check.mjs

The scry-lesson sections NUDGE the game clock (mouseMoved per poll, a
BURST of 6 for the 1.5s lift beat): in-game delayedCall beats stall when
headless input quiets — a woken clock pays about one clamped frame per
input event. The older sections pre-seed SS.prof.f5scry=1 so their
organic stalls keep the old glint+ribbon voice instead of veiling their
own chains; §3b2 clears the seed and owns the gate.

Serves the REPO ROOT on :8901 if nothing does (first5 reaches ../vendor,
../words*, ../art — the standing :8899 beta3 server roots too deep to serve
them). Chrome on :9476 on the Mac's REAL GPU (THE GPU LAW, 10/9): plain
`--headless=new` gives WebGL on the Radeon at 60 fps, the game's own phone
pace. The old desc-check swiftshader recipe (`--enable-unsafe-swiftshader
--use-gl=angle --use-angle=swiftshader`) is software GL — it left the game on
its CANVAS renderer at ~5 fps, and once the painted plate stood under the
fight (~2.6 fps) the real-time sections went red by the dozen (every one a
timing miss). `F5SOFT=1` restores it for a box without a GPU; plain
`--disable-gpu` has no WebGL and the fresh-profile raster probe aborts.

House gotchas inherited from beta3/tools: never RETURN a Phaser object from
an evaluate; the harness's own evaluates ride the first5 storage shim, so ask
for keys by the GAME's names (`beta3.boot`) — never pre-prefixed ones.
