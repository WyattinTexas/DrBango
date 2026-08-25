NEEDS SS-SKY-01 FIRST (this record uses: mags hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-delphinus — DELPHINUS · THE STARLIT DOLPHIN — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The head is Job's Coffin, the little diamond: Sualocin blue-white as the wish-star, Rotanev cream beside it (two stars named for an astronomer spelled backwards), gamma Delphini at the nose a gold-and-cream pair. A tiny teal ring on the tail fluke is the Blue Flash Nebula.
Changed against the shipped record: new layers: mags hues named parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the delphinus record in the basics block @34-81 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · DELPHINUS · THE STARLIT DOLPHIN · opponent (an UPGRADE of the shipped record) (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 23 battle / 23 home
// REPLACE the delphinus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
delphinus: {
  name: 'DELPHINUS', title: 'THE STARLIT DOLPHIN', tier: 'basic', lvl: 1, tint: 0x9fd8e8, eye: 0xcfffff,
  stars: [[44,-52],[16,-34],[32,-8],[58,-26],[80,-44],[-4,12],[-34,30],[-64,38],[-84,20],[-80,58]],
  edges: [[0,1],[1,2],[2,3],[3,0],[3,4],[2,5],[5,6],[6,7],[7,8],[7,9]], eyes: [[48,-40]],
  mags: [2,2,3,3,4,4,3,4,5,5], hues: [0xa6c8ff,0xfff2cc,null,0xffdc7a,null,null,null,null,null,null],
  named: [[0,'SUALOCIN']],
  parts: [{ t:'binary', at:3, sep:3, ang:-30, hue:0xfff2cc, T:0 },
          { t:'ring', at:9, rx:4, ry:4, hue:0x6fe0d0, a:0.45 }],
  fx: { idle:'coil', atk:'pounce' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the delphinus row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the delphinus row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast delphinus` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 23 / 23), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.delphinus)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.