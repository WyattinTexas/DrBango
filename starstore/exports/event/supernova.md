NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse arcs parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-supernova — SUPERNOVA · THE LAST LIGHT — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Tycho's star of 1572, a star that ended and for two weeks burned bright enough to see at noon: a blazing white core breathing on a two-second pulse inside a gold flash, a rose shell of torn filaments and the blue-white shock ring frozen at the edge of the box; the shell ripples, the core stays. The eye is the neutron star left in the middle; the nova at amp 1.5 flashes the whole shell.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[2].bosses @257: append 'supernova' (Act III boss, the star that outshone the dawn; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · SUPERNOVA · THE LAST LIGHT · opponent (boss lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named pulse arcs parts) · objects 30 battle / 29 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
supernova: {
  name: 'SUPERNOVA', title: 'THE LAST LIGHT', tier: 'boss', lvl: 3, tint: 0xe2ecff, eye: 0xb8f0ff,
  stars: [[0,0],[44,-30],[56,8],[30,44],[-12,54],[-48,32],[-56,-14],[-30,-46],[8,-56],[17,-17],[17,17],[-17,17],[-17,-17]],
  edges: [[0,9],[0,10],[0,11],[0,12]], eyes: [[0,0]],
  mags: [1,4,5,4,5,4,5,4,5,5,5,5,5], hues: [null,0xff7a9a,null,0xff7a9a,null,0xff7a9a,null,0xff7a9a,null,null,null,null,null],
  named: [[0,'STELLA NOVA']],
  pulse: [[0,2.2,0.6]],
  arcs: [[1,2,-0.1,0.2],[2,3,-0.1,0.2],[3,4,-0.1,0.2],[4,5,-0.1,0.2],[5,6,-0.1,0.2],[6,7,-0.1,0.2],[7,8,-0.1,0.2],[8,1,-0.1,0.2]],
  parts: [{ t:'nebula', at:0, r:16, hue:0xffdc7a, a:0.26 },
          { t:'nebula', at:0, r:44, hue:0xff7a9a, a:0.06 },
          { t:'ring', at:0, rx:50, ry:50, hue:0xff7a9a, a:0.3 },
          { t:'ring', at:0, rx:57, ry:57, hue:0xa6c8ff, a:0.25 }],
  fx: { idle:'ripple', atk:'nova', amp:1.5 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   supernova: 'THE LAST LIGHT',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | supernova | SUPERNOVA (the last light) | boss 3 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `supernova: 'THE LAST LIGHT',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast supernova` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 30 / 29), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.supernova)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.