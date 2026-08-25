NEEDS SS-SKY-01 FIRST (this record uses: mags hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-leo — LEO · THE SOVEREIGN LION — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Regulus, the little king, blue-white at the base of the Sickle as the wish-star; Algieba on the neck becomes the gold double, its orange companion four units off; Denebola white at the tail tip. Under the hind leg one smudge of the Leo Triplet, a galaxy the lion stands over. The eye stays in the mane.
Changed against the shipped record: new layers: mags hues named parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the leo record in the bosses block @150-216 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · LEO · THE SOVEREIGN LION · opponent (an UPGRADE of the shipped record) (boss lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 30 battle / 29 home
// REPLACE the leo record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
leo: {
  name: 'LEO', title: 'THE SOVEREIGN LION', tier: 'boss', lvl: 1, tint: 0xffd23e, eye: 0xffb066,
  stars: [[-24,30],[-32,10],[-22,-12],[-34,-30],[-52,-36],[-64,-22],[-70,-6],[8,-14],[40,-22],[70,-10],[44,8],[-28,54],[42,34],[50,56],[8,52],[82,-24]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[0,2],[2,7],[7,8],[8,9],[9,15],[8,10],[10,0],[0,11],[10,12],[12,13],[7,14]], eyes: [[-58,-24]],
  mags: [1,3,2,3,4,2,4,4,2,3,3,5,4,5,5,2], hues: [0xa6c8ff,null,0xffdc7a,null,null,null,null,null,null,null,null,null,null,null,null,0xe2ecff],
  named: [[0,'REGULUS']],
  parts: [{ t:'binary', at:2, sep:5, ang:-35, hue:0xffb066, T:0 },
          { t:'galaxy', at:13, x:72, y:68, r:7, tilt:-25, hue:0xcfd8ff, a:0.22 }],
  fx: { idle:'prowl', atk:'pounce' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the leo row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the leo row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast leo` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 30 / 29), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.leo)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.