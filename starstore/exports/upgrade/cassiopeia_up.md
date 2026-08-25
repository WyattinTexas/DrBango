NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-cassiopeia — CASSIOPEIA · THE VAIN QUEEN — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The crown is the W, and every point wears its true jewel: Caph cream, Schedar orange as the wish-star, gamma Cas blue-white and breathing (a shell star that erupts), Ruchbah white, Segin blue-white. Off the crown's edge a faint blue ring: Tycho's Star of 1572, the supernova that proved the heavens change.
Changed against the shipped record: new layers: mags hues named pulse parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the cassiopeia record in the minibosses block @82-149 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CASSIOPEIA · THE VAIN QUEEN · opponent (an UPGRADE of the shipped record) (mini lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named pulse parts) · objects 29 battle / 29 home
// REPLACE the cassiopeia record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
cassiopeia: {
  name: 'CASSIOPEIA', title: 'THE VAIN QUEEN', tier: 'mini', lvl: 3, tint: 0xe0aed0, eye: 0xffd23e,
  stars: [[-74,-26],[-38,-48],[-2,-24],[34,-52],[66,-30],[-2,-4],[-14,10],[12,8],[-16,34],[16,32],[-10,54],[12,52],[-30,6],[34,4]],
  edges: [[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[5,7],[6,8],[7,9],[8,10],[9,11],[8,9],[12,8],[13,9]], eyes: [[-6,-6],[2,-6]],
  mags: [2,1,2,3,3,3,4,4,4,4,5,5,4,4], hues: [0xfff2cc,0xffb066,0xa6c8ff,0xe2ecff,0xa6c8ff,null,null,null,null,null,null,null,null,null],
  named: [[1,'SCHEDAR']],
  pulse: [[2,25,0.55]],
  parts: [{ t:'ring', at:0, x:-84, y:-54, rx:7, ry:7, hue:0xa6c8ff, a:0.25 }],
  fx: { idle:'headturn', atk:'lash' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the cassiopeia row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the cassiopeia row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast cassiopeia` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 29 / 29), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.cassiopeia)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.