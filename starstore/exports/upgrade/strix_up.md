NEEDS SS-SKY-01 FIRST (this record uses: mags parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-strix — STRIX · THE VOID OWL — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Invented, so its jewel is invented: the void is its heart. A black hole on the chest, a shadow the colour of the sky inside a cream photon ring with a small orange accretion disc scrolling round it, the gold eyes watching from above; at home only the ring shows. One object; the figure is past the amber line as shipped (33 bare).
Changed against the shipped record: new layers: mags parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the strix record in the bosses block @150-216 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · STRIX · THE VOID OWL · opponent (an UPGRADE of the shipped record) (boss lvl 1)
// NEEDS SS-SKY-01 (uses: mags parts) · objects 35 battle / 34 home
// REPLACE the strix record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
strix: {
  name: 'STRIX', title: 'THE VOID OWL', tier: 'boss', lvl: 1, hp: 85, atk: 14, timer: 3, tint: 0x9fb4ff, eye: 0xffe08a,
  stars: [[0,-50],[28,-40],[40,-12],[28,16],[0,26],[-28,16],[-40,-12],[-28,-40],[-38,-58],[38,-58],[0,4],[-8,14],[8,14],[-52,0],[-72,22],[-58,40],[52,0],[72,22],[58,40],[-14,52],[14,52]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[7,8],[1,9],[10,11],[10,12],[6,13],[13,14],[14,15],[2,16],[16,17],[17,18],[4,19],[4,20]], eyes: [[-14,-18],[14,-18]],
  mags: [2,3,2,3,2,3,2,3,3,3,3,4,4,3,4,4,3,4,4,4,4],
  parts: [{ t:'blackhole', at:10, r:4, disc:true }],
  fx: { idle:'headturn', atk:'swoop', curse:'blackout' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the strix row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the strix row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast strix` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 35 / 34), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.strix)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.