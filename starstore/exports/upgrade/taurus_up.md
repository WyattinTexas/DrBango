NEEDS SS-SKY-01 FIRST (this record uses: mags hues pulse parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-taurus — TAURUS · THE STORM-EYED BULL — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Aldebaran orange at the eye, Elnath blue-white at the horn tip, the Pleiades in their blue haze on the shoulder, and on the far horn the Crab's pulsar beating once a second. One object; the figure is past the amber line as shipped (34 bare), so no cross.
Changed against the shipped record: new layers: mags hues pulse parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the taurus record in the bosses block @150-216 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · TAURUS · THE STORM-EYED BULL · opponent (an UPGRADE of the shipped record) (boss lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues pulse parts) · objects 36 battle / 35 home
// REPLACE the taurus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
taurus: {
  name: 'TAURUS', title: 'THE STORM-EYED BULL', tier: 'boss', lvl: 1, tint: 0xc4915e, eye: 0xff7a45,
  stars: [[-16,18],[-28,2],[-38,-14],[-2,2],[8,-12],[-58,-34],[-74,-52],[26,-34],[40,-56],[30,4],[58,-2],[80,10],[66,30],[70,52],[4,36],[0,58],[28,34],[30,56],[48,-24],[54,-28],[58,-22],[52,-18],[58,-30]],
  edges: [[2,1],[1,0],[0,3],[3,4],[2,5],[5,6],[4,7],[7,8],[3,9],[9,10],[10,11],[11,12],[12,13],[0,14],[14,15],[9,16],[16,17]], eyes: [[-38,-14]],
  mags: [1,4,3,5,2,1,4,3,3,2,1,4,3,5,2,1,4,3,2,3,3,4,3], hues: [null,null,0xffb066,null,null,null,0xa6c8ff,null,0xa6c8ff,null,null,null,null,null,null,null,null,null,0xa6c8ff,0xa6c8ff,0xa6c8ff,0xa6c8ff,0xa6c8ff],
  pulse: [[8,1,0.6]],
  parts: [{ t:'nebula', at:19, x:54, y:-24, r:14, hue:0xa6c8ff, a:0.08 }],
  fx: { idle:'lumber', atk:'charge' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the taurus row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the taurus row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast taurus` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 36 / 35), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.taurus)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.