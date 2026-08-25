NEEDS SS-SKY-01 FIRST (this record uses: mags hues parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-centaurus — CENTAURUS · THE FIRSTBORN CENTAUR — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The front hooves are the Pointers, Rigil Kentaurus gold and Hadar blue-white, the two stars that point at the Southern Cross; Omega Centauri, ten million stars, rides the back as one baked cluster. One object; the figure is past the amber line as shipped (34 bare), so no cross.
Changed against the shipped record: new layers: mags hues parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the centaurus record in the bosses block @150-216 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CENTAURUS · THE FIRSTBORN CENTAUR · opponent (an UPGRADE of the shipped record) (boss lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 36 battle / 35 home
// REPLACE the centaurus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
centaurus: {
  name: 'CENTAURUS', title: 'THE FIRSTBORN CENTAUR', tier: 'boss', lvl: 4, tint: 0xc9a26b, eye: 0xffe08a,
  stars: [[-40,-62],[-54,-48],[-26,-50],[-8,-56],[12,-64],[30,-72],[-42,-30],[-24,-16],[2,-12],[28,-16],[50,-10],[68,-20],[80,-6],[-34,4],[-40,28],[-36,52],[-14,4],[-12,30],[-16,54],[44,8],[54,30],[46,54],[8,8]],
  edges: [[0,1],[0,2],[1,6],[2,6],[2,3],[3,4],[4,5],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[7,13],[13,14],[14,15],[7,16],[16,17],[17,18],[10,19],[19,20],[20,21],[16,22],[22,19]], eyes: [[-40,-64]],
  mags: [1,4,3,5,2,1,4,3,5,2,1,4,3,5,2,1,4,3,1,2,1,1,3], hues: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0xa6c8ff,null,null,0xffdc7a,null],
  parts: [{ t:'cluster', at:22, x:0, y:-14, n:60, r:12, hue:0xfff2cc, a:0.8 }],
  fx: { idle:'lumber', atk:'charge', amp:1.2 },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the centaurus row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the centaurus row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast centaurus` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 36 / 35), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.centaurus)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.