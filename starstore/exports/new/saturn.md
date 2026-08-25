NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts idle 'orbit'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-saturn — SATURN · THE CROWNED ONE — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Nine Earths wide with rings 280,000 km across and ten metres thick, tilted 26.7 degrees; Titan, the only moon with real air, circles every 16 days; Enceladus sprays ice. The attack is the rings flashing white; the polar storm is the eye.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[1].bosses @251: append 'saturn' (Act II boss — Wyatt's seat to confirm).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · SATURN · THE CROWNED ONE · opponent (boss lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit') · objects 22 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
saturn: {
  name: 'SATURN', title: 'THE CROWNED ONE', tier: 'boss', lvl: 1, tint: 0xf0dcae, eye: 0xffb066,
  stars: [[0,0],[70,0],[-35,0],[-62,-40],[58,-44],[10,60],[-50,48],[66,30]],
  edges: [[3,4],[4,7],[7,5],[5,6],[6,3]], eyes: [[0,-21]],
  mags: [5,3,5,4,4,5,5,4], hues: [null,0xffb066,0xe2ecff,null,null,null,null,null],
  named: [[1,'TITAN']],
  steady: [0,1,2],
  parts: [{ t:'planet', at:0, r:25, hue:0xf0dcae, bands:[[-8,3,0xe6c88f],[4,4,0xe6c88f],[14,2,0xd9b87a]], ring:{ rx:58, ry:14, tilt:26.7, hue:0xe8d9b5, a:0.7, gap:0.88 } },
          { t:'orbit', at:0, rx:70, ry:17, tilt:26.7, a:0.1, T:32, occlude:25, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:35, ry:8.5, tilt:26.7, a:0.08, T:2.7, occlude:25, ride:[[2,0.3,1]] }],
  fx: { idle:'orbit', atk:'nova', amp:1.1 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   saturn: 'THE CROWNED ONE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | saturn | SATURN (the crowned one) | boss 1 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `saturn: 'THE CROWNED ONE',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast saturn` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 22 / 21), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.saturn)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.