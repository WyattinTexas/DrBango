NEEDS SS-SKY-01 FIRST (this record uses: mags hues parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-draco — DRACO · THE STAR EATER — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Eltanin orange at the head, right under the red eye; Rastaban gold beside it on the jaw; Thuban, the pole star the pyramids were built to, plain white on the coils where nobody looks now. In the throat the Cat's Eye, a teal ring: the last star it swallowed. One object; the figure is past the amber line as shipped (33 bare), so no cross.
Changed against the shipped record: new layers: mags hues parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the draco record in the bosses block @150-216 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · DRACO · THE STAR EATER · opponent (an UPGRADE of the shipped record) (boss lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 35 battle / 34 home
// REPLACE the draco record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
draco: {
  name: 'DRACO', title: 'THE STAR EATER', tier: 'boss', lvl: 2, hp: 130, atk: 18, timer: 4, tint: 0xffc46b, eye: 0xff5e4d,
  stars: [[-92,42],[-72,28],[-52,36],[-32,22],[-12,28],[8,14],[2,-8],[-16,-36],[6,-54],[20,-32],[42,-46],[30,2],[46,-12],[58,-30],[50,-48],[70,-44],[78,-18],[62,-6],[24,30],[18,48],[44,26],[48,44]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[6,9],[9,10],[5,11],[11,12],[12,13],[13,14],[13,15],[13,16],[16,17],[11,18],[18,19],[11,20],[20,21]], eyes: [[56,-26]],
  mags: [4,3,4,3,4,3,3,4,4,4,4,3,3,1,4,2,3,4,4,5,4,5], hues: [null,null,null,0xe2ecff,null,null,null,null,null,null,null,null,null,0xffb066,null,0xffdc7a,null,null,null,null,null,null],
  parts: [{ t:'ring', at:11, rx:6, ry:5, hue:0x6fe0d0, a:0.55 }],
  fx: { idle:'flex', atk:'breath', curse:'blackout', ink:3 },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the draco row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the draco row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast draco` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 35 / 34), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.draco)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.