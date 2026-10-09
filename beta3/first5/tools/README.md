# first5/tools

Harness for the FIRST5 sandbox (the first-night tutorial test build at
drbango.com/beta3/first5/ — batch `ss-2026-10-07-first-night` + fix round
`ss-2026-10-08-first5-fixes` + `ss-2026-10-09-night-sky-live` card 03).

**first5-check.mjs** — the whole-stage suite (cards 01-06 + fix 01 THE
CLEAN REFRESH + fix 02 THE STRAY SIGNS + fix 03 THE SCRY LESSON + STRAIGHT
INTO THE NIGHT): static seams (including the straight seams — seventeen
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
first-fight.png — untracked, never committed), the LURE (real CDP click at
the TITLE launches the lean and arms the sound), THE SKY LEANS IN (ember 33hp, real-tap STAR cast, star-write,
the density gate vs the full dictionary, curated trio, encore, a real
5-letter cast firing the cue ladder), THE TEACHING SCRIPTS (real
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
out-ranking even a survive flag). Run from first5/ — ~10-15 min.

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
them). Chrome on :9476 with the desc-check swiftshader recipe
(`--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader`);
plain `--disable-gpu` has no WebGL and the fresh-profile raster probe aborts.

House gotchas inherited from beta3/tools: never RETURN a Phaser object from
an evaluate; the harness's own evaluates ride the first5 storage shim, so ask
for keys by the GAME's names (`beta3.boot`) — never pre-prefixed ones.
