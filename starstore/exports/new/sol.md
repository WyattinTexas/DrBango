NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts idle 'orbit' attack 'fling' edges[] (glint guard)). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-sol — SOL · THE LONG ORBIT — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Eight worlds round one star on hoops compressed rx = 10 x AU^0.62 (Neptune barely moves, which is true and teaches; the x6 battle clock is the orrery dial), a belt of 24 baked specks, Pluto dipping inside Neptune's line on a tilted dashed rail. Eight bolts in order.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[3].bosses @263: append 'sol' (Act IV alternate, the network fight; Wyatt confirms). edges is EMPTY: SS-SKY-01's glint guard @2425 lands first.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- edges is empty — today's spawnGlint throws and FREEZES the game ~640 ms after arm; SS-SKY-01's guard is required (NEEDS).
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · SOL · THE LONG ORBIT · opponent (boss lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling' edges[] (glint guard)) · objects 26 battle / 25 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
sol: {
  name: 'SOL', title: 'THE LONG ORBIT', tier: 'boss', lvl: 3, tint: 0xffdc7a, eye: 0xfff2cc,
  stars: [[0,0],[8,2],[-9,5],[-18,-5],[18,-10],[15,19],[-62,0],[-24,-31],[88,-12],[-41,29]],
  edges: [], eyes: [[0,0]],
  mags: [1,5,3,3,4,2,2,3,3,5], hues: [null,0xc9b8a8,0xfff2cc,0x3a7bd5,0xe0704a,0xe8d5b5,0xf0dcae,0x9fe6e0,0x3d63ff,0xd9c4a8],
  named: [[0,'THE SUN']],
  steady: [0,1,2,3,4,5,6,7,8,9],
  parts: [{ t:'nebula', at:0, r:18, hue:0xffdc7a, a:0.22 },
          { t:'orbit', at:0, rx:10, ry:4.2, a:0.12, T:2.9, occlude:6, ride:[[1,0.1,1]] },
          { t:'orbit', at:0, rx:16, ry:6.7, a:0.12, T:7.4, occlude:6, ride:[[2,0.35,1]] },
          { t:'orbit', at:0, rx:22, ry:9.2, a:0.12, T:12, occlude:6, ride:[[3,0.6,1]] },
          { t:'orbit', at:0, rx:30, ry:12.6, a:0.12, T:22.6, occlude:6, ride:[[4,0.85,1]] },
          { t:'orbit', at:0, rx:48, ry:20.2, a:0.12, T:142, occlude:6, ride:[[5,0.2,1]] },
          { t:'orbit', at:0, rx:62, ry:26, a:0.12, T:354, occlude:6, ride:[[6,0.5,1]] },
          { t:'orbit', at:0, rx:78, ry:32.8, a:0.12, T:1008, occlude:6, ride:[[7,0.7,1]] },
          { t:'orbit', at:0, rx:92, ry:38.6, a:0.12, T:1978, occlude:6, ride:[[8,0.95,1]] },
          { t:'orbit', at:0, rx:100, ry:42, tilt:17, e:0.25, a:0.08, dash:true, T:2976, ride:[[9,0.3,1]] },
          { t:'cluster', at:0, n:24, r:38, ring:true, hue:0xcfd8ff, a:0.25 }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   sol: 'THE LONG ORBIT',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | sol | SOL (the long orbit) | boss 3 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `sol: 'THE LONG ORBIT',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast sol` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 26 / 25), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges is EMPTY here — the glint guard is why this card NEEDS SS-SKY-01).
- `SS_BEAST_T(SS_BEASTS.sol)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.