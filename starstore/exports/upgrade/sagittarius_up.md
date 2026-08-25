NEEDS SS-SKY-01 FIRST (this record uses: mags hues parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-sagittarius — SAGITTARIUS · THE ZENITH ARCHER — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The bow is the Teapot's spout: Kaus Australis blue-white at its foot, Kaus Media and Kaus Borealis orange up the stave, Nunki blue-white on the shoulder. Where the arrow points, the heart of the galaxy glows as a cream star cloud: the archer aims at the centre of everything. One object; the figure is past the amber line as shipped (36 bare), so no cross.
Changed against the shipped record: new layers: mags hues parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the sagittarius record in the bosses block @150-216 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · SAGITTARIUS · THE ZENITH ARCHER · opponent (an UPGRADE of the shipped record) (boss lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 38 battle / 37 home
// REPLACE the sagittarius record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
sagittarius: {
  name: 'SAGITTARIUS', title: 'THE ZENITH ARCHER', tier: 'boss', lvl: 4, hp: 200, atk: 24, timer: 4, tint: 0xff9e58, eye: 0xfff0a8,
  stars: [[10,-58],[-4,-44],[26,-46],[0,-22],[20,-26],[30,-8],[16,4],[-4,0],[-10,-12],[-24,-18],[-44,-58],[-56,-38],[-48,-16],[-30,-38],[-70,-44],[44,-14],[66,-8],[80,-18],[90,-4],[2,18],[-2,40],[4,60],[62,12],[70,34],[62,58]],
  edges: [[0,1],[0,2],[1,3],[2,4],[3,4],[4,5],[5,6],[6,7],[7,8],[8,3],[8,9],[1,11],[10,11],[11,12],[13,14],[2,13],[5,15],[15,16],[16,17],[17,18],[6,19],[19,20],[20,21],[16,22],[22,23],[23,24]], eyes: [[6,-60]],
  mags: [3,3,3,3,2,3,3,4,3,4,2,2,1,4,4,3,3,4,3,4,4,5,4,4,5], hues: [null,null,null,null,0xa6c8ff,null,null,null,null,null,0xffb066,0xffb066,0xa6c8ff,null,null,null,null,null,null,null,null,null,null,null,null],
  parts: [{ t:'nebula', at:12, x:-78, y:-8, r:30, hue:0xffe9c9, a:0.32 }],
  fx: { idle:'flex', atk:'volley', amp:0.7, bolts:5 },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the sagittarius row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the sagittarius row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast sagittarius` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 38 / 37), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.sagittarius)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.