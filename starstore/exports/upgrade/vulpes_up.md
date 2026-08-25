NEEDS SS-SKY-01 FIRST (this record uses: named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-vulpes — VULPES · THE EMBER FOX — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The fox as shipped, plus Anser as the wish-star at the head and the Dumbbell Nebula, the first planetary ever found, hung on the flank as a two-lobed teal lantern.
Changed against the shipped record: new layers: named parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the vulpes record in the basics block @34-81 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · VULPES · THE EMBER FOX · opponent (an UPGRADE of the shipped record) (basic lvl 1)
// NEEDS SS-SKY-01 (uses: named parts) · objects 30 battle / 30 home
// REPLACE the vulpes record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
vulpes: {
  name: 'VULPES', title: 'THE EMBER FOX', tier: 'basic', lvl: 1, tint: 0xffb066, eye: 0xffd23e,
  stars: [[-78,18],[-58,2],[-38,10],[-20,-2],[2,-10],[20,-14],[38,-24],[34,-44],[56,-40],[54,-22],[64,-14],[46,-6],[26,16],[30,34],[-8,16],[-6,34]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,6],[5,12],[12,13],[3,14],[14,15]], eyes: [[46,-22]],
  named: [[6,'ANSER']],
  parts: [{ t:'nebula', at:3, x:-36, y:-24, r:11, hue:0x6fe0d0, a:0.07, twin:16 }],
  fx: { idle:'prowl', atk:'pounce' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the vulpes row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the vulpes row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast vulpes` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 30 / 30), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.vulpes)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.