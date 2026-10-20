#!/bin/bash
# FIRSTNIGHT-STAGE — re-run the first5 sandbox's whole suite (first5-check,
# 280 checks) against the INTEGRATED live game.js (the first-night
# integration, branch first-night). Builds beta3/f5stage/ = the sandbox's
# shim + index + suite, with every game file swapped for the live copy
# (art/ → ../art/, words-<lang> → ../words-), the suite port-swapped onto
# Playwright's Chromium (never the Google Chrome bundle — headless instances
# of it hijack AppleScript's hold on the real browser), its demo run marked
# ?f5night=1 (a demo run is not a first night; the seam lets it play the
# grafts), and the retry door announcing __f5survive on the STAGE copy only
# (live never wipes, so live never announces). f5stage/ is scratch — never
# commit it. Expected reds on the integrated bytes (4, all static): the two
# game.js __f5survive sites (sandbox-only, dropped) + their seam tag, the
# F5-PAINTED tag count (live's own comments won those hunks), and the
# boot's soft list (4 files live: + the home doors). 276/280 on 10/20.
#   cd beta3 && tools/firstnight-stage.sh && (cd f5stage && node tools/first5-check.mjs)
set -e
cd "$(dirname "$0")/.."
CH=/Users/admin/Library/Caches/ms-playwright/chromium-1140/chrome-mac/Chromium.app/Contents/MacOS/Chromium
rm -rf f5stage && mkdir f5stage && cp -R first5/* f5stage/
cp game.js audio.js strings.js net.js rival.js versus.js packs.js compat.js data.js seed-names.js f5stage/
cd f5stage
sed -i '' "s#im.src = 'art/'#im.src = '../art/'#g" game.js
sed -i '' "s#'<script src=\"words-'#'<script src=\"../words-'#" packs.js
sed -i '' "s#rb.on('pointerdown', () => { SFX.ui(); try { location.reload(); } catch (e) { } });#rb.on('pointerdown', () => { SFX.ui(); try { window.__f5survive \&\& window.__f5survive(); } catch (e) { } try { location.reload(); } catch (e) { } });#" versus.js
sed -i '' -e "s#^const PORT = 9476, SRV = 8901;#const PORT = 9511, SRV = 8911;#" \
  -e "s#'/beta3/first5/index.html'#'/beta3/f5stage/index.html'#" \
  -e "s#^const CHROME = .*#const CHROME = '$CH';#" \
  -e "s#/tmp/cdp-first5#/tmp/cdp-f5stage#g" \
  -e "s#'?reset=1&demo=1'#'?reset=1\&demo=1\&f5night=1'#g" tools/first5-check.mjs
echo "stage ready: beta3/f5stage (run: cd f5stage && node tools/first5-check.mjs)"
