# first5/tools

Harness for the FIRST5 sandbox (the first-night tutorial test build at
drbango.com/beta3/first5/ — batch `ss-2026-10-07-first-night`).

**first5-check.mjs** — the stage suite (25 checks): static seams (script
order, no Firebase, `../` repoints, one `?v=f5-*` stamp), then live boots in
headless Chrome at DPR 3 — virgin first open with the FTUE gate owed, every
storage key under the `first5.` prefix, the ascent rising by itself (read
from the game's own `window.__ssftue` beacon; swiftshader stretches the
intro, hence the generous window), a `?demo=1` solver run that weaves, and
`?reset=1` restoring the virgin open and scrubbing itself from the URL.

    cd beta3/first5 && perl -e 'alarm 580; exec @ARGV' node tools/first5-check.mjs

Serves the REPO ROOT on :8901 if nothing does (first5 reaches ../vendor,
../words*, ../art — the standing :8899 beta3 server roots too deep to serve
them). Chrome on :9476 with the desc-check swiftshader recipe
(`--enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader`);
plain `--disable-gpu` has no WebGL and the fresh-profile raster probe aborts.

House gotchas inherited from beta3/tools: never RETURN a Phaser object from
an evaluate; the harness's own evaluates ride the first5 storage shim, so ask
for keys by the GAME's names (`beta3.boot`) — never pre-prefixed ones.
