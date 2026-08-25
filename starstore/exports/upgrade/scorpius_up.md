NEEDS SS-SKY-01 FIRST (this record uses: hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-scorpius — SCORPIUS · THE CRIMSON STING — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Antares red at the heart, the rival of Mars, as the wish-star; the head trio blue-white; the stinger becomes the Cat's Eyes pair; M4 sits eight units below the heart as a baked cluster.
Changed against the shipped record: new layers: hues named parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the scorpius record in the bosses block @150-216 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · SCORPIUS · THE CRIMSON STING · opponent (an UPGRADE of the shipped record) (boss lvl 2)
// NEEDS SS-SKY-01 (uses: hues named parts) · objects 31 battle / 30 home
// REPLACE the scorpius record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
scorpius: {
  name: 'SCORPIUS', title: 'THE CRIMSON STING', tier: 'boss', lvl: 2, tint: 0xe87a6b, eye: 0xff3860,
  stars: [[-84,-38],[-66,-52],[-72,-18],[-52,-30],[-36,-22],[-20,-12],[-8,4],[-2,20],[4,36],[14,50],[30,58],[48,56],[62,46],[70,30],[64,14],[50,6]],
  edges: [[0,3],[1,3],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15]], eyes: [[-20,-12],[50,6]],
  hues: [0xa6c8ff,0xa6c8ff,0xa6c8ff,null,null,0xff6e58,null,null,null,null,null,null,null,null,null,0xa6c8ff],
  named: [[5,'ANTARES']],
  parts: [{ t:'binary', at:15, sep:4, ang:30, hue:0xa6c8ff, T:0 },
          { t:'cluster', at:5, x:-20, y:-2, n:9, r:5, hue:0xffe9c9 }],
  fx: { idle:'pinch', atk:'lash' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the scorpius row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the scorpius row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast scorpius` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 31 / 30), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.scorpius)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.