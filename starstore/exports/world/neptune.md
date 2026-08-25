NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady arcs parts idle 'orbit'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-neptune — NEPTUNE · THE DEEP BLUE — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The farthest world and the windiest, deep blue from methane, white cirrus streaking round it at 2,000 km an hour and a Great Dark Spot the size of Earth for an eye. Triton, its big moon, circles backwards (the one hoop in the store that runs clockwise) and is slowly falling in. The trident stands above it, its shaft driven into the world.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[2].bosses @257: append 'neptune' (Act III boss, the cold act; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · NEPTUNE · THE DEEP BLUE · opponent (boss lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named steady arcs parts idle 'orbit') · objects 22 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
neptune: {
  name: 'NEPTUNE', title: 'THE DEEP BLUE', tier: 'boss', lvl: 3, tint: 0x4d70ff, eye: 0xa6c8ff,
  stars: [[0,0],[39,16],[-36,-76],[-30,-48],[0,-48],[30,-48],[36,-76],[0,-80]],
  edges: [[3,4],[4,5],[4,7],[4,0]], eyes: [[-5,-6]],
  mags: [5,3,4,5,5,5,4,4], hues: [null,0xdfe8ff,null,null,null,null,null,null],
  named: [[1,'TRITON']],
  steady: [0,1],
  arcs: [[3,2,-0.14],[5,6,0.14]],
  parts: [{ t:'planet', at:0, r:21, hue:0x3d63ff, bands:[[-9,0.8,0x6a88ff],[7,0.7,0x6a88ff]], spot:{ y:-6, rx:6, ry:3.6, hue:0x223a96 }, limb:0.14, spin:16 },
          { t:'orbit', at:0, rx:42, ry:13, tilt:22, a:0.1, T:-11.8, occlude:21, ride:[[1,0,1]] }],
  fx: { idle:'orbit', atk:'charge' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   neptune: 'THE DEEP BLUE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | neptune | NEPTUNE (the deep blue) | boss 3 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `neptune: 'THE DEEP BLUE',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast neptune` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 22 / 21), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.neptune)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.