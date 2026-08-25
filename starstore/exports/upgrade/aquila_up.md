NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-aquila — AQUILA · THE THUNDER EAGLE — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Altair, the eagle's white head star, is the wish-star, with Tarazed orange and Alshain gold flanking it: the Altair line, three colours in a row you can find tonight. Eta Aquilae on the belly is a Cepheid, breathing every 7.2 seconds. Hues, one cross and one pulse carry the whole upgrade.
Changed against the shipped record: new layers: mags hues named pulse.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the aquila record in the minibosses block @82-149 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · AQUILA · THE THUNDER EAGLE · opponent (an UPGRADE of the shipped record) (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named pulse) · objects 26 battle / 26 home
// REPLACE the aquila record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
aquila: {
  name: 'AQUILA', title: 'THE THUNDER EAGLE', tier: 'mini', lvl: 2, tint: 0xd8c06b, eye: 0xfff0a8,
  stars: [[0,-52],[-12,-58],[10,-46],[0,-28],[-4,-4],[-30,-18],[-58,-8],[-82,8],[28,-14],[54,-2],[78,16],[2,20],[-8,40],[12,42],[2,58]],
  edges: [[1,0],[0,2],[0,3],[3,4],[3,5],[5,6],[6,7],[3,8],[8,9],[9,10],[4,11],[11,12],[11,13],[12,14],[13,14]], eyes: [[0,-54]],
  mags: [1,2,3,3,3,3,3,2,3,3,2,2,4,4,3], hues: [0xe2ecff,0xffb066,0xffdc7a,null,null,null,null,null,null,null,null,null,null,null,null],
  named: [[0,'ALTAIR']],
  pulse: [[11,7.2,0.55]],
  fx: { idle:'flex', atk:'swoop' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the aquila row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the aquila row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast aquila` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 26 / 26), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.aquila)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.