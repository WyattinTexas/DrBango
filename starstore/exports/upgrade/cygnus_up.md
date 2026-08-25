NEEDS SS-SKY-01 FIRST (this record uses: hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-cygnus — CYGNUS · THE CROSSWIND SWAN — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Deneb white at the tail as the wish-star, Sadr cream at the cross, Gienah orange, and the beak becomes Albireo, the two-coloured star, gold and blue twinkling in counter-phase. A rose North America blob beside Deneb.
Changed against the shipped record: new layers: hues named parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the cygnus record in the basics block @34-81 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CYGNUS · THE CROSSWIND SWAN · opponent (an UPGRADE of the shipped record) (basic lvl 3)
// NEEDS SS-SKY-01 (uses: hues named parts) · objects 25 battle / 25 home
// REPLACE the cygnus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
cygnus: {
  name: 'CYGNUS', title: 'THE CROSSWIND SWAN', tier: 'basic', lvl: 3, tint: 0xdfe8ff, eye: 0x9fb4ff,
  stars: [[4,-58],[0,-30],[0,-4],[-2,24],[-4,48],[30,2],[58,10],[84,24],[-30,-10],[-58,-6],[-84,6]],
  edges: [[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[6,7],[2,8],[8,9],[9,10]], eyes: [[-8,50]],
  hues: [0xe2ecff,null,0xfff2cc,null,0xffdc7a,null,0xffb066,null,null,null,null],
  named: [[0,'DENEB']],
  parts: [{ t:'binary', at:4, sep:5, ang:-20, hue:0xa6c8ff, T:0 },
          { t:'nebula', at:0, x:22, y:-52, r:14, hue:0xff7a9a, a:0.05 }],
  fx: { idle:'flex', atk:'swoop' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the cygnus row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the cygnus row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast cygnus` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 25 / 25), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.cygnus)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.