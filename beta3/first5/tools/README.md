# first5/tools

Harness for the FIRST5 sandbox (the first-night tutorial test build at
drbango.com/beta3/first5/ — batch `ss-2026-10-07-first-night`).

**first5-check.mjs** — the whole-batch suite (76 checks, cards 01-06):
static seams, then live at DPR 3 — the virgin first open (ftue owed, prefix
isolation, `window.__ssftue`), the LURE (real CDP click launches the rise
and arms the sound), THE SKY LEANS IN (ember 33hp, real-tap STAR cast,
star-write, the density gate vs the full dictionary, curated trio, encore,
a real 5-letter cast firing the cue ladder), THE TEACHING SCRIPTS (real
dewTile/blackTile prompts, once-per-run dedupe, the forge/plant chain),
THE LIT SKY (a fell through the true chain writes the mark, the converge,
the ledger, the kept sky surviving reopen), the demo solver, the pocket
round (quickck write + relaunch + glint + both refusals), and the reset
door. Run it from first5/ — ~6 min.

    cd beta3/first5 && perl -e 'alarm 580; exec @ARGV' node tools/first5-check.mjs

Serves the REPO ROOT on :8901 if nothing does (first5 reaches ../vendor,
../words*, ../art — the standing :8899 beta3 server roots too deep to serve
them). Chrome on :9476 with the desc-check swiftshader recipe
(`--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader`);
plain `--disable-gpu` has no WebGL and the fresh-profile raster probe aborts.

House gotchas inherited from beta3/tools: never RETURN a Phaser object from
an evaluate; the harness's own evaluates ride the first5 storage shim, so ask
for keys by the GAME's names (`beta3.boot`) — never pre-prefixed ones.
