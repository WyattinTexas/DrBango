NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts idle 'orbit' attack 'fling'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-uranus — URANUS · THE TILTED ONE — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
A pale cyan world knocked onto its side: it rolls round the Sun with a pole facing forward, so its thin dark rings stand on end like a hoop and its five big moons, named for Shakespeare's people, climb up and over instead of left to right (1 day = 2 s). The moons are the bolts of the fling; the eye is the bright hood over the pole that faces the Sun.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[2].minis @256: append 'uranus' (Act III mini — Wyatt's seat to confirm).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · URANUS · THE TILTED ONE · opponent (mini lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 25 battle / 25 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
uranus: {
  name: 'URANUS', title: 'THE TILTED ONE', tier: 'mini', lvl: 3, tint: 0x9fe6e0, eye: 0xe2ecff,
  stars: [[0,0],[4,26],[4,32],[6,40],[7,52],[9,61],[-86,-10],[86,10],[-54,-64],[58,-60],[-8,74]],
  edges: [[6,0],[0,7]], eyes: [[13,1]],
  mags: [5,5,5,5,4,5,5,5,5,5,5], hues: [null,0xcfd8ff,0xe2ecff,0x8a8078,0xd9c4a8,0xb5a496,null,null,null,null,null],
  named: [[4,'TITANIA']],
  steady: [0,1,2,3,4,5],
  parts: [{ t:'planet', at:0, r:18, hue:0x9fe6e0, limb:0.1, ring:{ rx:30, ry:11, tilt:82, hue:0x7fbfb8, a:0.45, gap:0.9 } },
          { t:'orbit', at:0, rx:26, ry:8, tilt:82, a:0.07, T:2.8, occlude:18, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:32, ry:10, tilt:82, a:0.07, T:5, occlude:18, ride:[[2,0.3,1]] },
          { t:'orbit', at:0, rx:40, ry:12, tilt:82, a:0.07, T:8.3, occlude:18, ride:[[3,0.55,1]] },
          { t:'orbit', at:0, rx:52, ry:16, tilt:82, a:0.07, T:17.4, occlude:18, ride:[[4,0.15,1]] },
          { t:'orbit', at:0, rx:62, ry:19, tilt:82, a:0.07, T:27.1, occlude:18, ride:[[5,0.7,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   uranus: 'THE TILTED ONE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | uranus | URANUS (the tilted one) | mini 3 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `uranus: 'THE TILTED ONE',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast uranus` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 25 / 25), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.uranus)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.