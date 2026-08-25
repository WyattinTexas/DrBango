NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-cetus — CETUS · THE DROWNED LEVIATHAN — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Mira, the Wonderful, the first variable star ever known: a red giant on the neck that is the wish-star at full blaze and then fades to an ember and back, its cross with it, over 33 seconds (332 days compressed), a red halo holding its place while it is gone. Menkar red at the jaw, Diphda orange at the tail. One object: the halo.
Changed against the shipped record: new layers: mags hues named pulse parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the cetus record in the minibosses block @82-149 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CETUS · THE DROWNED LEVIATHAN · opponent (an UPGRADE of the shipped record) (mini lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues named pulse parts) · objects 27 battle / 27 home
// REPLACE the cetus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
cetus: {
  name: 'CETUS', title: 'THE DROWNED LEVIATHAN', tier: 'mini', lvl: 4, tint: 0x6b9fe0, eye: 0x9ffcee,
  stars: [[52,-44],[76,-32],[82,-8],[66,10],[46,-2],[42,-26],[58,22],[28,14],[4,26],[-22,30],[-46,20],[-62,2],[-80,16],[-90,0],[-88,36]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[3,6],[4,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[12,14]], eyes: [[60,-30]],
  mags: [3,2,3,3,3,4,4,1,4,3,4,3,3,1,4], hues: [null,0xff6e58,null,null,null,null,null,0xff6e58,null,null,null,null,null,0xffb066,null],
  named: [[7,'MIRA']],
  pulse: [[7,33,0.15]],
  parts: [{ t:'nebula', at:7, r:11, hue:0xff6e58, a:0.2 }],
  fx: { idle:'coil', atk:'breath' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the cetus row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the cetus row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast cetus` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 27 / 27), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.cetus)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.