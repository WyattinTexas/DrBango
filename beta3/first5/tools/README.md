# first5/tools

Harness for the FIRST5 sandbox (the first-night tutorial test build at
drbango.com/beta3/first5/ — batch `ss-2026-10-07-first-night` + fix round
`ss-2026-10-08-first5-fixes`).

**first5-check.mjs** — the whole-stage suite (cards 01-06 + fix 01 THE
CLEAN REFRESH + fix 02 THE STRAY SIGNS): static seams (including the
ground-truth scan proving every `location.reload/replace` in the copies
announces itself through `__f5survive` first, and the stray-sign seams —
no battle boot draw, six F5-FIX1-02 sites, the census tag), then live at
DPR 3 — the virgin first open (ftue owed, prefix isolation,
`window.__ssftue`), the LURE (real CDP click launches the rise and arms
the sound), THE SKY LEANS IN (ember 33hp, real-tap STAR cast, star-write,
the density gate vs the full dictionary, curated trio, encore, a real
5-letter cast firing the cue ladder), THE TEACHING SCRIPTS (real
dewTile/blackTile prompts, once-per-run dedupe, the forge/plant chain),
THE LIT SKY (a fell through the true chain writes the mark, the converge,
the rite still SEATING its mark + the sweep clearing the zenith, the
ledger, the kept sky surviving a CARRIED reopen, the resumed battle
booting CLEAN, the meadow still wearing the morning-after sky), the demo
solver, THE SKYLAR SCENE (solver paused atomically at 'pick' mid-run:
zero standing marks by census, a DPR-3 screenshot kept in
`tools/shots-stray/` — untracked, never committed — and a pixel probe
proving the circled vulpes seat is clean sky while the YOU bar and the
beast constellation stand), the carried night (graft-4 resume through the
survive door, then the REAL versus retry button firing a true scripted
reload that keeps the held fight — both resumed boots proven mark-free),
the glint + both refusals, THE CLEAN REFRESH itself (Page.reload with no
flag wipes sentinel/quickck/stat, re-opens the FTUE gate, and the lure
asks again), and the reset door (still honored, out-ranking even a
survive flag). Run from first5/ — ~8-10 min.

Sandbox-only law: the wipe-on-refresh is THE STAGE'S law, never the live
game's — see the SANDBOX-ONLY block atop first5.js before any integration.

    cd beta3/first5 && perl -e 'alarm 840; exec @ARGV' node tools/first5-check.mjs

Serves the REPO ROOT on :8901 if nothing does (first5 reaches ../vendor,
../words*, ../art — the standing :8899 beta3 server roots too deep to serve
them). Chrome on :9476 with the desc-check swiftshader recipe
(`--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader`);
plain `--disable-gpu` has no WebGL and the fresh-profile raster probe aborts.

House gotchas inherited from beta3/tools: never RETURN a Phaser object from
an evaluate; the harness's own evaluates ride the first5 storage shim, so ask
for keys by the GAME's names (`beta3.boot`) — never pre-prefixed ones.
