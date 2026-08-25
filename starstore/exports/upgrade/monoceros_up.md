NEEDS SS-SKY-01 FIRST (this record uses: mags hues parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-monoceros — MONOCEROS · THE GLASS UNICORN — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The horn tip is beta Monocerotis, blue-white and class 1, a triple in any telescope; on the chest the Rosette, a rose ring with the young cluster in its hole, the flower the unicorn wears. One object: the jar sits at 30, the amber line, so the horn goes without its cross.
Changed against the shipped record: new layers: mags hues parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the monoceros record in the minibosses block @82-149 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · MONOCEROS · THE GLASS UNICORN · opponent (an UPGRADE of the shipped record) (mini lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 30 battle / 30 home
// REPLACE the monoceros record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
monoceros: {
  name: 'MONOCEROS', title: 'THE GLASS UNICORN', tier: 'mini', lvl: 3, tint: 0xd8d2f0, eye: 0xbfe8ff,
  stars: [[-70,-58],[-56,-42],[-46,-30],[-58,-18],[-34,-24],[-16,-30],[8,-26],[32,-28],[50,-18],[66,-2],[60,18],[-28,-6],[-34,16],[-30,44],[0,-2],[26,-4],[34,20],[28,46]],
  edges: [[0,1],[1,2],[2,3],[2,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[4,11],[11,12],[12,13],[11,14],[14,15],[15,16],[16,17],[7,15]], eyes: [[-48,-34]],
  mags: [1,3,3,4,3,3,4,3,3,3,4,3,4,4,4,3,4,4], hues: [0xa6c8ff,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  parts: [{ t:'ring', at:11, rx:8, ry:8, hue:0xff7a9a, a:0.45 }],
  fx: { idle:'prowl', atk:'charge' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the monoceros row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the monoceros row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast monoceros` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 30 / 30), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.monoceros)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.