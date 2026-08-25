NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse arcs parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-pulsar — PULSAR · THE LIGHTHOUSE — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
A sun's weight packed into a city-sized ball, sweeping two beams from its magnetic poles: the first one found, in 1967, ticked every 1.337 seconds and they called it LGM-1, little green men. The core, a pale white-dwarf blue, blinks to nothing and back on exactly that clock; two beams lie along the tilted axis and four field loops arc from cap to cap. The eye is the core; the volley is timed to the beam.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[2].minis @256: append 'pulsar' (Act III mini, the beam is the telegraph; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · PULSAR · THE LIGHTHOUSE · opponent (mini lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named pulse arcs parts) · objects 22 battle / 22 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
pulsar: {
  name: 'PULSAR', title: 'THE LIGHTHOUSE', tier: 'mini', lvl: 3, tint: 0xa6c8ff, eye: 0xb8f0ff,
  stars: [[0,0],[12,-8],[-12,8],[-72,-44],[70,40],[-46,56],[56,-58]],
  edges: [[1,0],[0,2]], eyes: [[0,0]],
  mags: [1,5,5,5,5,5,5], hues: [0xb8f0ff,null,null,null,null,null,null],
  named: [[0,'LGM-1']],
  pulse: [[0,1.337,0.05]],
  arcs: [[1,2,0.35,0.12],[1,2,-0.35,0.12],[1,2,0.7,0.08],[1,2,-0.7,0.08]],
  parts: [{ t:'nebula', at:0, r:9, hue:0xb8f0ff, a:0.35 },
          { t:'comet', at:0, len:90, ang:-34, bulge:0, w:5, hue:0xa6c8ff, a:0.35 },
          { t:'comet', at:0, len:90, ang:146, bulge:0, w:5, hue:0xa6c8ff, a:0.35 },
          { t:'comet', at:0, x:73, y:-49, len:84, ang:146, bulge:0, w:12, hue:0xa6c8ff, a:0.1 },
          { t:'comet', at:0, x:-73, y:49, len:84, ang:-34, bulge:0, w:12, hue:0xa6c8ff, a:0.1 }],
  fx: { idle:'ripple', atk:'volley', bolts:3 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   pulsar: 'THE LIGHTHOUSE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | pulsar | PULSAR (the lighthouse) | mini 3 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `pulsar: 'THE LIGHTHOUSE',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast pulsar` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 22 / 22), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.pulsar)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.