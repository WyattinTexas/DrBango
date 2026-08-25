NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts idle 'orbit' attack 'fling'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-jupiter — JUPITER · THE KING OF WORLDS — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Eleven Earths wide, striped by cloud belts scrolling once every ten seconds, with a storm bigger than Earth that has raged 350 years and IS the eye. Four Galilean moons slide along an edge-on line, dimming in front and vanishing behind; the moons are the bolts of the fling.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[2].bosses @257: append 'jupiter' (Act III boss — Wyatt's seat to confirm).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · JUPITER · THE KING OF WORLDS · opponent (boss lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 24 battle / 23 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
jupiter: {
  name: 'JUPITER', title: 'THE KING OF WORLDS', tier: 'boss', lvl: 2, tint: 0xe8d5b5, eye: 0xd9604a,
  stars: [[0,0],[36,0],[-42,0],[50,0],[-62,0],[-70,-48],[74,-40],[-60,50],[68,52]],
  edges: [[5,6],[6,8],[8,7],[7,5]], eyes: [[8,9]],
  mags: [5,4,4,3,4,4,4,5,5], hues: [null,0xffe08a,0xe2ecff,0xc9b8a8,0x8a8078,null,null,null,null],
  named: [[3,'GANYMEDE']],
  steady: [0,1,2,3,4],
  parts: [{ t:'planet', at:0, r:30, hue:0xe8d5b5, bands:[[-22,4,0xc69c6d],[-10,3,0xc69c6d],[4,5,0xb07a56],[16,3,0xc69c6d]], spot:{ x:8, y:9, rx:6, ry:3.6, hue:0xd9604a }, limb:0.12, spin:10 },
          { t:'orbit', at:0, rx:36, ry:2, a:0, T:3.5, occlude:30, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:42, ry:2, a:0, T:7.1, occlude:30, ride:[[2,0.25,1]] },
          { t:'orbit', at:0, rx:50, ry:2, a:0, T:14.3, occlude:30, ride:[[3,0.5,1]] },
          { t:'orbit', at:0, rx:62, ry:2, a:0, T:33.4, occlude:30, ride:[[4,0.75,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   jupiter: 'THE KING OF WORLDS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | jupiter | JUPITER (the king of worlds) | boss 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `jupiter: 'THE KING OF WORLDS',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast jupiter` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 24 / 23), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.jupiter)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.