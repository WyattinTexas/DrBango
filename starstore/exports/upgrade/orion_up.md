NEEDS SS-SKY-01 FIRST (this record uses: mags hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-orion — ORION · THE STARBOUND HUNTER — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Betelgeuse red on the shoulder, Rigel blue-white at the foot as the wish-star, the belt three class-1 blue-whites, and the lower sword star becomes the Orion Nebula, rose over a teal core. Jar 30 at home, the amber line exactly.
Changed against the shipped record: new layers: mags hues named parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the orion record in the minibosses block @82-149 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · ORION · THE STARBOUND HUNTER · opponent (an UPGRADE of the shipped record) (mini lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 30 battle / 30 home
// REPLACE the orion record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
orion: {
  name: 'ORION', title: 'THE STARBOUND HUNTER', tier: 'mini', lvl: 4, tint: 0x9fc4ff, eye: 0xffb066,
  stars: [[0,-56],[-28,-34],[28,-38],[-10,2],[0,6],[10,10],[-24,48],[28,44],[4,20],[6,30],[-42,-52],[-48,-68],[-34,-74],[54,-28],[62,-10],[60,8]],
  edges: [[0,1],[0,2],[1,2],[1,3],[2,5],[3,4],[4,5],[3,6],[5,7],[4,8],[8,9],[1,10],[10,11],[11,12],[2,13],[13,14],[14,15]], eyes: [[0,-58]],
  mags: [3,1,1,2,2,2,1,1,3,4,4,5,5,4,4,5], hues: [null,0xff6e58,0xa6c8ff,0x9fb4ff,0x9fb4ff,0x9fb4ff,0xa6c8ff,0xa6c8ff,null,null,null,null,null,null,null,null],
  named: [[7,'RIGEL']],
  parts: [{ t:'nebula', at:9, r:14, hue:0xff7a9a, a:0.12 },
          { t:'nebula', at:9, r:7, hue:0x6fe0d0, a:0.14 }],
  fx: { idle:'headturn', atk:'slam' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the orion row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the orion row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast orion` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 30 / 30), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.orion)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.