# THE STAR STORE — every example's jumpr card (64)


================================================================================================
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

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: hues named pulse). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-lepus — LEPUS · THE MOONLIT HARE — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Arneb cream at the chest as the wish-star, Nihal gold, and Hind's Crimson Star, a drop of blood on the ear tip, swelling and fading every six seconds (427 days compressed). Zero new objects.
Changed against the shipped record: new layers: hues named pulse.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the lepus record in the basics block @34-81 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · LEPUS · THE MOONLIT HARE · opponent (an UPGRADE of the shipped record) (basic lvl 2)
// NEEDS SS-SKY-01 (uses: hues named pulse) · objects 24 battle / 24 home
// REPLACE the lepus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
lepus: {
  name: 'LEPUS', title: 'THE MOONLIT HARE', tier: 'basic', lvl: 2, tint: 0xbfe8c9, eye: 0xa8ffc4,
  stars: [[-10,-64],[14,-60],[-2,-38],[8,-30],[26,-26],[0,-4],[8,18],[-28,-18],[-52,-6],[-58,16],[-36,34],[-66,-14]],
  edges: [[0,2],[1,2],[2,3],[3,4],[3,5],[5,6],[5,7],[7,8],[8,9],[9,10],[8,11]], eyes: [[12,-32]],
  hues: [null,0xff4d6b,null,null,null,0xfff2cc,null,0xffdc7a,null,null,null,null],
  named: [[5,'ARNEB']],
  pulse: [[1,6,0.3]],
  fx: { idle:'bob', atk:'pounce', hops:2 },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the lepus row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the lepus row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast lepus` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 24 / 24), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.lepus)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
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

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-orion — ORION · THE STARBOUND HUNTER — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Betelgeuse red on the shoulder, Rigel blue-white at the foot as the wish-star, the belt three class-1 blue-whites, and the lower sword star becomes the Orion Nebula, rose over a teal core. Jar 30 at home, the amber line exactly.
Changed against the shipped record: new layers: mags hues named parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the orion record in the minibosses block @82-149 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · ORION · THE STARBOUND HUNTER · opponent (an UPGRADE of the shipped record) (mini lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 30 battle / 30 home
// REPLACE the orion record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
orion: {
  name: 'ORION', title: 'THE STARBOUND HUNTER', tier: 'mini', lvl: 4, tint: 0x9fc4ff, eye: 0xffb066,
  stars: [[0,-56],[-28,-34],[28,-38],[-10,2],[0,6],[10,10],[-24,48],[28,44],[4,20],[6,30],[-42,-52],[-48,-68],[-34,-74],[54,-28],[62,-10],[60,8]],
  edges: [[0,1],[0,2],[1,2],[1,3],[2,5],[3,4],[4,5],[3,6],[5,7],[4,8],[8,9],[1,10],[10,11],[11,12],[2,13],[13,14],[14,15]], eyes: [[0,-58]],
  mags: [3,1,1,2,2,2,1,1,3,4,4,5,5,4,4,5], hues: [null,0xff6e58,0xa6c8ff,0x9fb4ff,0x9fb4ff,0x9fb4ff,0xa6c8ff,0xa6c8ff,null,null,null,null,null,null,null,null],
  named: [[7,'RIGEL']],
  parts: [{ t:'nebula', at:9, r:14, hue:0xff7a9a, a:0.12 },
          { t:'nebula', at:9, r:7, hue:0x6fe0d0, a:0.14 }],
  fx: { idle:'headturn', atk:'slam' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the orion row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the orion row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast orion` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 30 / 30), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.orion)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
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

================================================================================================
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

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-ursa — URSA · THE WINTER BEAR — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Dubhe orange at the head as the wish-star, Alkaid blue-white at the tail tip, Mizar and Alcor, the horse and rider, and the Whirlpool Galaxy dragged past the tail.
Changed against the shipped record: new layers: hues named parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the ursa record in the minibosses block @82-149 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · URSA · THE WINTER BEAR · opponent (an UPGRADE of the shipped record) (mini lvl 2)
// NEEDS SS-SKY-01 (uses: hues named parts) · objects 28 battle / 28 home
// REPLACE the ursa record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
ursa: {
  name: 'URSA', title: 'THE WINTER BEAR', tier: 'mini', lvl: 2, hp: 76, atk: 14, timer: 3, tint: 0xd6a86b, eye: 0xffd23e,
  stars: [[58,-6],[44,-20],[38,-32],[16,-30],[-8,-38],[-38,-28],[-56,-10],[-48,14],[-42,34],[-8,8],[22,12],[26,34],[48,6]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[6,9],[9,10],[10,11],[0,12],[12,9]], eyes: [[46,-16]],
  hues: [null,0xffb066,null,null,null,null,null,0xe2ecff,0xa6c8ff,null,null,null,null],
  named: [[1,'DUBHE']],
  parts: [{ t:'binary', at:7, sep:5, ang:-40, hue:0xfff2cc, T:0 },
          { t:'galaxy', at:8, x:-56, y:48, r:8, tilt:20, hue:0xcfd8ff, a:0.08 }],
  fx: { idle:'lumber', atk:'slam' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the ursa row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the ursa row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast ursa` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 28 / 28), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.ursa)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-centaurus — CENTAURUS · THE FIRSTBORN CENTAUR — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The front hooves are the Pointers, Rigil Kentaurus gold and Hadar blue-white, the two stars that point at the Southern Cross; Omega Centauri, ten million stars, rides the back as one baked cluster. One object; the figure is past the amber line as shipped (34 bare), so no cross.
Changed against the shipped record: new layers: mags hues parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the centaurus record in the bosses block @150-216 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CENTAURUS · THE FIRSTBORN CENTAUR · opponent (an UPGRADE of the shipped record) (boss lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 36 battle / 35 home
// REPLACE the centaurus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
centaurus: {
  name: 'CENTAURUS', title: 'THE FIRSTBORN CENTAUR', tier: 'boss', lvl: 4, tint: 0xc9a26b, eye: 0xffe08a,
  stars: [[-40,-62],[-54,-48],[-26,-50],[-8,-56],[12,-64],[30,-72],[-42,-30],[-24,-16],[2,-12],[28,-16],[50,-10],[68,-20],[80,-6],[-34,4],[-40,28],[-36,52],[-14,4],[-12,30],[-16,54],[44,8],[54,30],[46,54],[8,8]],
  edges: [[0,1],[0,2],[1,6],[2,6],[2,3],[3,4],[4,5],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[7,13],[13,14],[14,15],[7,16],[16,17],[17,18],[10,19],[19,20],[20,21],[16,22],[22,19]], eyes: [[-40,-64]],
  mags: [1,4,3,5,2,1,4,3,5,2,1,4,3,5,2,1,4,3,1,2,1,1,3], hues: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0xa6c8ff,null,null,0xffdc7a,null],
  parts: [{ t:'cluster', at:22, x:0, y:-14, n:60, r:12, hue:0xfff2cc, a:0.8 }],
  fx: { idle:'lumber', atk:'charge', amp:1.2 },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the centaurus row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the centaurus row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast centaurus` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 36 / 35), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.centaurus)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
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

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-draco — DRACO · THE STAR EATER — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Eltanin orange at the head, right under the red eye; Rastaban gold beside it on the jaw; Thuban, the pole star the pyramids were built to, plain white on the coils where nobody looks now. In the throat the Cat's Eye, a teal ring: the last star it swallowed. One object; the figure is past the amber line as shipped (33 bare), so no cross.
Changed against the shipped record: new layers: mags hues parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the draco record in the bosses block @150-216 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · DRACO · THE STAR EATER · opponent (an UPGRADE of the shipped record) (boss lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 35 battle / 34 home
// REPLACE the draco record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
draco: {
  name: 'DRACO', title: 'THE STAR EATER', tier: 'boss', lvl: 2, hp: 130, atk: 18, timer: 4, tint: 0xffc46b, eye: 0xff5e4d,
  stars: [[-92,42],[-72,28],[-52,36],[-32,22],[-12,28],[8,14],[2,-8],[-16,-36],[6,-54],[20,-32],[42,-46],[30,2],[46,-12],[58,-30],[50,-48],[70,-44],[78,-18],[62,-6],[24,30],[18,48],[44,26],[48,44]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[6,9],[9,10],[5,11],[11,12],[12,13],[13,14],[13,15],[13,16],[16,17],[11,18],[18,19],[11,20],[20,21]], eyes: [[56,-26]],
  mags: [4,3,4,3,4,3,3,4,4,4,4,3,3,1,4,2,3,4,4,5,4,5], hues: [null,null,null,0xe2ecff,null,null,null,null,null,null,null,null,null,0xffb066,null,0xffdc7a,null,null,null,null,null,null],
  parts: [{ t:'ring', at:11, rx:6, ry:5, hue:0x6fe0d0, a:0.55 }],
  fx: { idle:'flex', atk:'breath', curse:'blackout', ink:3 },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the draco row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the draco row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast draco` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 35 / 34), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.draco)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-sagittarius — SAGITTARIUS · THE ZENITH ARCHER — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The bow is the Teapot's spout: Kaus Australis blue-white at its foot, Kaus Media and Kaus Borealis orange up the stave, Nunki blue-white on the shoulder. Where the arrow points, the heart of the galaxy glows as a cream star cloud: the archer aims at the centre of everything. One object; the figure is past the amber line as shipped (36 bare), so no cross.
Changed against the shipped record: new layers: mags hues parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the sagittarius record in the bosses block @150-216 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · SAGITTARIUS · THE ZENITH ARCHER · opponent (an UPGRADE of the shipped record) (boss lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 38 battle / 37 home
// REPLACE the sagittarius record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
sagittarius: {
  name: 'SAGITTARIUS', title: 'THE ZENITH ARCHER', tier: 'boss', lvl: 4, hp: 200, atk: 24, timer: 4, tint: 0xff9e58, eye: 0xfff0a8,
  stars: [[10,-58],[-4,-44],[26,-46],[0,-22],[20,-26],[30,-8],[16,4],[-4,0],[-10,-12],[-24,-18],[-44,-58],[-56,-38],[-48,-16],[-30,-38],[-70,-44],[44,-14],[66,-8],[80,-18],[90,-4],[2,18],[-2,40],[4,60],[62,12],[70,34],[62,58]],
  edges: [[0,1],[0,2],[1,3],[2,4],[3,4],[4,5],[5,6],[6,7],[7,8],[8,3],[8,9],[1,11],[10,11],[11,12],[13,14],[2,13],[5,15],[15,16],[16,17],[17,18],[6,19],[19,20],[20,21],[16,22],[22,23],[23,24]], eyes: [[6,-60]],
  mags: [3,3,3,3,2,3,3,4,3,4,2,2,1,4,4,3,3,4,3,4,4,5,4,4,5], hues: [null,null,null,null,0xa6c8ff,null,null,null,null,null,0xffb066,0xffb066,0xa6c8ff,null,null,null,null,null,null,null,null,null,null,null,null],
  parts: [{ t:'nebula', at:12, x:-78, y:-8, r:30, hue:0xffe9c9, a:0.32 }],
  fx: { idle:'flex', atk:'volley', amp:0.7, bolts:5 },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the sagittarius row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the sagittarius row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast sagittarius` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 38 / 37), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.sagittarius)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
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

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-cancer — CANCER · THE GLOOM CRAB — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The crab has no bright stars, so the Beehive is the upgrade: two dozen cream stars swarming inside the shell between the two Donkeys, Asellus Borealis white above and Asellus Australis orange below; Tarf orange at the far claw. One object; the figure is past the amber line as shipped (35 bare), so no cross.
Changed against the shipped record: new layers: mags hues parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the cancer record in the minibosses block @82-149 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CANCER · THE GLOOM CRAB · opponent (an UPGRADE of the shipped record) (mini lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 36 battle / 36 home
// REPLACE the cancer record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
cancer: {
  name: 'CANCER', title: 'THE GLOOM CRAB', tier: 'mini', lvl: 1, hp: 62, atk: 12, timer: 3, tint: 0xc79af5, eye: 0xff7ad9,
  stars: [[-20,0],[0,-12],[20,0],[14,16],[-14,16],[-38,-8],[-60,-20],[-76,-8],[-88,-20],[-72,-34],[38,-8],[60,-20],[76,-8],[88,-20],[72,-34],[-26,26],[-34,44],[0,28],[0,46],[26,26],[34,44],[-8,-24],[8,-24]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[0,5],[5,6],[6,7],[7,8],[7,9],[2,10],[10,11],[11,12],[12,13],[12,14],[4,15],[15,16],[3,17],[17,18],[3,19],[19,20],[1,21],[1,22]], eyes: [[-8,-28],[8,-28]],
  mags: [4,2,4,2,4,4,4,4,5,5,4,4,3,2,5,4,5,4,5,4,5,5,5], hues: [null,0xe2ecff,null,0xffb066,null,null,null,null,null,null,null,null,null,0xffb066,null,null,null,null,null,null,null,null,null],
  parts: [{ t:'cluster', at:1, x:0, y:3, n:24, r:12, hue:0xfff2cc, a:1 }],
  fx: { idle:'pinch', atk:'snap' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the cancer row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the cancer row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast cancer` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 36 / 36), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.cancer)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
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

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-UP-delphinus — DELPHINUS · THE STARLIT DOLPHIN — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The head is Job's Coffin, the little diamond: Sualocin blue-white as the wish-star, Rotanev cream beside it (two stars named for an astronomer spelled backwards), gamma Delphini at the nose a gold-and-cream pair. A tiny teal ring on the tail fluke is the Blue Flash Nebula.
Changed against the shipped record: new layers: mags hues named parts.

## WHERE IT LIVES
- replaces the existing record in place; no pool changes
- SS_BEASTS (data.js): the delphinus record in the basics block @34-81 — swap it for the block below, verbatim.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · DELPHINUS · THE STARLIT DOLPHIN · opponent (an UPGRADE of the shipped record) (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 23 battle / 23 home
// REPLACE the delphinus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
delphinus: {
  name: 'DELPHINUS', title: 'THE STARLIT DOLPHIN', tier: 'basic', lvl: 1, tint: 0x9fd8e8, eye: 0xcfffff,
  stars: [[44,-52],[16,-34],[32,-8],[58,-26],[80,-44],[-4,12],[-34,30],[-64,38],[-84,20],[-80,58]],
  edges: [[0,1],[1,2],[2,3],[3,0],[3,4],[2,5],[5,6],[6,7],[7,8],[7,9]], eyes: [[48,-40]],
  mags: [2,2,3,3,4,4,3,4,5,5], hues: [0xa6c8ff,0xfff2cc,null,0xffdc7a,null,null,null,null,null,null],
  named: [[0,'SUALOCIN']],
  parts: [{ t:'binary', at:3, sep:3, ang:-30, hue:0xfff2cc, T:0 },
          { t:'ring', at:9, rx:4, ry:4, hue:0x6fe0d0, a:0.45 }],
  fx: { idle:'coil', atk:'pounce' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the delphinus row stays
```

## REGISTER
1. strings.js: title unchanged — the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are.
2. BESTIARY.md: the delphinus row stays; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast delphinus` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 23 / 23), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.delphinus)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the other 25 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
- hp/atk/timer/title/tier/lvl/fx unchanged unless listed here: nothing — all as shipped.
- No other beast, no pool, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
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

================================================================================================
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

================================================================================================
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

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-mercury — MERCURY · THE SCORCHED — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The smallest world and the nearest to the Sun, baked on one face and frozen on the other, cratered like our Moon; the Sun sits at its shoulder, near enough to scorch, and the Caloris Basin, an impact scar 1,500 km wide, drifts across its face every 59 days (118 s here). The eye is Hokusai, the young crater whose rays reach halfway round the planet.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the basics block @34-81) — the block below, verbatim.
- SS_QUICK_POOL @279: append 'mercury'. No act unless Wyatt seats it.
- A quick-pool change re-deals today's DAILY for anyone who boots after the deploy — deploy at the day rollover, or seat the id in an ACT pool instead (pinned per campaign, never shifts a run).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · MERCURY · THE SCORCHED · opponent (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts) · objects 19 battle / 19 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
mercury: {
  name: 'MERCURY', title: 'THE SCORCHED', tier: 'basic', lvl: 1, tint: 0xc9b8a8, eye: 0xfff2cc,
  stars: [[0,0],[-64,0],[30,-56],[58,-30],[68,4],[58,38],[30,60]],
  edges: [[2,3],[3,4],[4,5],[5,6]], eyes: [[2,-10]],
  mags: [5,1,5,4,5,4,5], hues: [null,0xffdc7a,null,null,null,null,null],
  named: [[1,'THE SUN']],
  steady: [0,1],
  parts: [{ t:'nebula', at:1, r:30, hue:0xffdc7a, a:0.6 },
          { t:'planet', at:0, r:14, hue:0xc9b8a8, spot:{ y:-3, rx:4.5, ry:3.5, hue:0xa89684 }, limb:0.2, spin:118 }],
  fx: { idle:'bob', atk:'charge' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   mercury: 'THE SCORCHED',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | mercury | MERCURY (the scorched) | basic 1 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `mercury: 'THE SCORCHED',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast mercury` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 19 / 19), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.mercury)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags named steady parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-venus_world — VENUS · THE VEILED ONE — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The brightest thing in the night after the Moon, wrapped in a veil of sulphur cloud so thick no one saw its ground until radar did; it never twinkles, and its clouds race round in four days while the ground beneath takes 243. The attack is the veil flashing white. The eye is the south polar vortex, a storm with two eyes of its own.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[0].minis @243: append 'venus_world' (Act I mini; Wyatt confirms). 'venus' is the MENU SKY's point decor; this is the world.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · VENUS · THE VEILED ONE · opponent (mini lvl 1)
// NEEDS SS-SKY-01 (uses: mags named steady parts) · objects 17 battle / 17 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
venus_world: {
  name: 'VENUS', title: 'THE VEILED ONE', tier: 'mini', lvl: 1, tint: 0xfff2cc, eye: 0xffdc7a,
  stars: [[0,0],[-84,50],[-42,64],[0,70],[42,64],[84,50]],
  edges: [[1,2],[2,3],[3,4],[4,5]], eyes: [[0,17]],
  mags: [5,5,4,5,4,5],
  named: [[0,'VENUS']],
  steady: [0],
  parts: [{ t:'nebula', at:0, r:44, hue:0xfff2cc, a:0.42 },
          { t:'planet', at:0, r:21, hue:0xfff2cc, bands:[[-9,3,0xf2dfae],[3,4,0xf2dfae],[13,2,0xe8d09a]], limb:0.08 }],
  fx: { idle:'lumber', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   venus_world: 'THE VEILED ONE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | venus_world | VENUS (the veiled one) | mini 1 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `venus_world: 'THE VEILED ONE',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast venus_world` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 17 / 17), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.venus_world)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts idle 'orbit'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-earth — EARTH · THE BLUE MARBLE — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Home: an ocean world with white weather and one green-brown continent turning once a day (24 s), ice at both poles, its axis drawn as a line up to Polaris, the still star everything else wheels round. The Moon, thirty Earths out, circles every 27 days (54.6 s) showing the same face the whole way. The eye is a hurricane over the ocean.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[1].minis @250: append 'earth' (Act II mini; Wyatt's seat to confirm; the catalog says you do not fight home, so the showcase is the alternative).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · EARTH · THE BLUE MARBLE · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit') · objects 19 battle / 19 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
earth: {
  name: 'EARTH', title: 'THE BLUE MARBLE', tier: 'mini', lvl: 2, tint: 0x6fa8dc, eye: 0xe2ecff,
  stars: [[0,0],[34,0],[0,-66],[-84,40],[-46,60],[46,60],[84,40]],
  edges: [[0,2],[3,4],[4,5],[5,6]], eyes: [[-8,7]],
  mags: [5,3,2,5,5,5,5], hues: [null,0xd9d9d9,0xfff2cc,null,null,null,null],
  named: [[2,'POLARIS']],
  steady: [0,1],
  parts: [{ t:'planet', at:0, r:21, hue:0x3a7bd5, bands:[[-20,1.8,0xe6eef8],[-7,0.7,0x8fb8e6],[20,1.8,0xe6eef8]], spot:{ y:0, rx:8, ry:7, hue:0x7a9e55 }, limb:0.1, spin:24 },
          { t:'orbit', at:0, rx:34, ry:10, tilt:-6, a:0.1, T:54.6, occlude:21, ride:[[1,0.15,1]] }],
  fx: { idle:'orbit', atk:'slam' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   earth: 'THE BLUE MARBLE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | earth | EARTH (the blue marble) | mini 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `earth: 'THE BLUE MARBLE',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast earth` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 19 / 19), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.earth)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts idle 'orbit' attack 'fling'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-mars — MARS · THE RED WANDERER — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Half Earth's size and rust-red, an ice cap at the north pole and Syrtis Major, a dark shield of old lava, drifting across its face once a day (24.6 s). Two potato moons ride it, Phobos so close and fast it laps the planet three times a day, Deimos further out; both are the bolts of the fling. Antares, the rival of Mars, twinkles red at the corner; Mars never twinkles. The eye is Olympus Mons.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the basics block @34-81) — the block below, verbatim.
- SS_QUICK_POOL @279: append 'mars'. No act unless Wyatt seats it.
- A quick-pool change re-deals today's DAILY for anyone who boots after the deploy — deploy at the day rollover, or seat the id in an ACT pool instead (pinned per campaign, never shifts a run).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · MARS · THE RED WANDERER · opponent (basic lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 20 battle / 20 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
mars: {
  name: 'MARS', title: 'THE RED WANDERER', tier: 'basic', lvl: 2, tint: 0xe0704a, eye: 0xffb066,
  stars: [[0,0],[27,0],[44,0],[-74,-44],[-52,-62],[-30,-50],[70,44],[84,24]],
  edges: [[3,4],[4,5],[6,7]], eyes: [[-6,-4]],
  mags: [5,5,5,2,5,4,5,5], hues: [null,0xa89f97,0xa89f97,0xff6e58,null,null,null,null],
  named: [[3,'ANTARES']],
  steady: [0,1,2],
  parts: [{ t:'planet', at:0, r:16, hue:0xe0704a, bands:[[-13,4,0xfff2cc]], spot:{ y:-3, rx:5, ry:3.5, hue:0x8f3a28 }, limb:0.15, spin:24.6 },
          { t:'orbit', at:0, rx:27, ry:8, tilt:-10, a:0.08, T:0.64, occlude:16, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:44, ry:13, tilt:-10, a:0.08, T:2.5, occlude:16, ride:[[2,0.4,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   mars: 'THE RED WANDERER',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | mars | MARS (the red wanderer) | basic 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `mars: 'THE RED WANDERER',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast mars` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 20 / 20), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.mars)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts idle 'orbit' attack 'fling'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-uranus — URANUS · THE TILTED ONE — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
A pale cyan world knocked onto its side: it rolls round the Sun with a pole facing forward, so its thin dark rings stand on end like a hoop and its five big moons, named for Shakespeare's people, climb up and over instead of left to right (1 day = 2 s). The moons are the bolts of the fling; the eye is the bright hood over the pole that faces the Sun.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[2].minis @256: append 'uranus' (Act III mini — Wyatt's seat to confirm).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · URANUS · THE TILTED ONE · opponent (mini lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 25 battle / 25 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
uranus: {
  name: 'URANUS', title: 'THE TILTED ONE', tier: 'mini', lvl: 3, tint: 0x9fe6e0, eye: 0xe2ecff,
  stars: [[0,0],[4,26],[4,32],[6,40],[7,52],[9,61],[-86,-10],[86,10],[-54,-64],[58,-60],[-8,74]],
  edges: [[6,0],[0,7]], eyes: [[13,1]],
  mags: [5,5,5,5,4,5,5,5,5,5,5], hues: [null,0xcfd8ff,0xe2ecff,0x8a8078,0xd9c4a8,0xb5a496,null,null,null,null,null],
  named: [[4,'TITANIA']],
  steady: [0,1,2,3,4,5],
  parts: [{ t:'planet', at:0, r:18, hue:0x9fe6e0, limb:0.1, ring:{ rx:30, ry:11, tilt:82, hue:0x7fbfb8, a:0.45, gap:0.9 } },
          { t:'orbit', at:0, rx:26, ry:8, tilt:82, a:0.07, T:2.8, occlude:18, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:32, ry:10, tilt:82, a:0.07, T:5, occlude:18, ride:[[2,0.3,1]] },
          { t:'orbit', at:0, rx:40, ry:12, tilt:82, a:0.07, T:8.3, occlude:18, ride:[[3,0.55,1]] },
          { t:'orbit', at:0, rx:52, ry:16, tilt:82, a:0.07, T:17.4, occlude:18, ride:[[4,0.15,1]] },
          { t:'orbit', at:0, rx:62, ry:19, tilt:82, a:0.07, T:27.1, occlude:18, ride:[[5,0.7,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   uranus: 'THE TILTED ONE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | uranus | URANUS (the tilted one) | mini 3 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `uranus: 'THE TILTED ONE',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast uranus` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 25 / 25), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.uranus)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady arcs parts idle 'orbit'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-neptune — NEPTUNE · THE DEEP BLUE — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The farthest world and the windiest, deep blue from methane, white cirrus streaking round it at 2,000 km an hour and a Great Dark Spot the size of Earth for an eye. Triton, its big moon, circles backwards (the one hoop in the store that runs clockwise) and is slowly falling in. The trident stands above it, its shaft driven into the world.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[2].bosses @257: append 'neptune' (Act III boss, the cold act; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · NEPTUNE · THE DEEP BLUE · opponent (boss lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named steady arcs parts idle 'orbit') · objects 22 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
neptune: {
  name: 'NEPTUNE', title: 'THE DEEP BLUE', tier: 'boss', lvl: 3, tint: 0x4d70ff, eye: 0xa6c8ff,
  stars: [[0,0],[39,16],[-36,-76],[-30,-48],[0,-48],[30,-48],[36,-76],[0,-80]],
  edges: [[3,4],[4,5],[4,7],[4,0]], eyes: [[-5,-6]],
  mags: [5,3,4,5,5,5,4,4], hues: [null,0xdfe8ff,null,null,null,null,null,null],
  named: [[1,'TRITON']],
  steady: [0,1],
  arcs: [[3,2,-0.14],[5,6,0.14]],
  parts: [{ t:'planet', at:0, r:21, hue:0x3d63ff, bands:[[-9,0.8,0x6a88ff],[7,0.7,0x6a88ff]], spot:{ y:-6, rx:6, ry:3.6, hue:0x223a96 }, limb:0.14, spin:16 },
          { t:'orbit', at:0, rx:42, ry:13, tilt:22, a:0.1, T:-11.8, occlude:21, ride:[[1,0,1]] }],
  fx: { idle:'orbit', atk:'charge' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   neptune: 'THE DEEP BLUE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | neptune | NEPTUNE (the deep blue) | boss 3 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `neptune: 'THE DEEP BLUE',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast neptune` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 22 / 21), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.neptune)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts idle 'orbit' attack 'fling'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-pluto — PLUTO · THE FAR PAIR — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
A double world at the cold edge of the map, inside the belt of ice it belongs to: Charon is half Pluto's size, so the two swing round a point in the empty space between them every 6.4 days (12.8 s), each forever showing the other the same face. The eye is the pale heart, Sputnik Planitia, a plain of nitrogen ice.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the basics block @34-81) — the block below, verbatim.
- SS_QUICK_POOL @279: append 'pluto'. No act unless Wyatt seats it (a cold-act basic).
- A quick-pool change re-deals today's DAILY for anyone who boots after the deploy — deploy at the day rollover, or seat the id in an ACT pool instead (pinned per campaign, never shifts a run).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · PLUTO · THE FAR PAIR · opponent (basic lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 20 battle / 20 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
pluto: {
  name: 'PLUTO', title: 'THE FAR PAIR', tier: 'basic', lvl: 3, tint: 0xd9c4a8, eye: 0xfff2cc,
  stars: [[0,0],[2,10],[-70,-56],[-46,-64],[52,-60],[76,-50],[-8,72]],
  edges: [[2,3],[4,5]], eyes: [[3,3]],
  mags: [5,4,5,5,5,5,5], hues: [null,0xa89f97,null,null,null,null,null],
  named: [[1,'CHARON']],
  steady: [0,1],
  parts: [{ t:'planet', at:0, r:12, hue:0xd9c4a8, bands:[[2,4,0xb3946e]], spot:{ y:3, rx:5, ry:4.5, hue:0xf0e2cc }, limb:0.15, spin:-12.8 },
          { t:'orbit', at:0, rx:30, ry:10, tilt:-12, a:0.1, T:12.8, occlude:12, ride:[[1,0.25,1]] },
          { t:'cluster', at:0, n:18, r:66, ring:true, hue:0xcfd8ff, a:0.22 }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   pluto: 'THE FAR PAIR',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | pluto | PLUTO (the far pair) | basic 3 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `pluto: 'THE FAR PAIR',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast pluto` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 20 / 20), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.pluto)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags steady parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-luna — THE MOON · THE PALE WATCHER — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Our own Moon three nights from full, the dark seas of old lava on its face and Tycho, the bright young crater, throwing rays across the south. It never twinkles; it turns once for every trip round us, so we only ever see this side. Waxing gibbous tonight (25 August 2026); on the 28th it goes copper in a total eclipse. The eyes are Tycho and Copernicus.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[0].minis @243: append 'luna' (Act I mini; Wyatt confirms). The MENU SKY keeps its decor 'moon'; this is the opponent.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · THE MOON · THE PALE WATCHER · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags steady parts) · objects 16 battle / 16 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
luna: {
  name: 'THE MOON', title: 'THE PALE WATCHER', tier: 'mini', lvl: 2, tint: 0xf7e8c8, eye: 0xfff2cc,
  stars: [[0,0],[-80,-40],[-44,-66],[0,-74],[44,-66],[80,-40]],
  edges: [[1,2],[2,3],[3,4],[4,5]], eyes: [[-4,21],[-10,-5]],
  mags: [5,5,5,4,5,5],
  steady: [0],
  parts: [{ t:'moon', at:0, r:30, phase:0.42, angle:0 }],
  fx: { idle:'lumber', atk:'slam' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   luna: 'THE PALE WATCHER',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | luna | THE MOON (the pale watcher) | mini 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `luna: 'THE PALE WATCHER',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast luna` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 16 / 16), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.luna)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts idle 'orbit' attack 'fling'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-trappist — TRAPPIST-1 · THE SEVEN HEARTHS — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
A red dwarf forty light-years off with seven Earth-sized worlds packed closer than Mercury, circling in 1.5 to 19 seconds (one real day = one second) in a chain of resonances that line up like a music box; the warm three are blue. Seven spokes run from the hearth to its worlds and turn like clock hands; seven bolts in order. The eye is the hearth.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[1].minis @250: append 'trappist' (Act II mini, the network fight; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · TRAPPIST-1 · THE SEVEN HEARTHS · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 26 battle / 26 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
trappist: {
  name: 'TRAPPIST-1', title: 'THE SEVEN HEARTHS', tier: 'mini', lvl: 2, tint: 0xff6e58, eye: 0xff6e58,
  stars: [[0,0],[12,0],[11,7],[-5,12],[-24,6],[-30,-8],[-9,-20],[28,-19],[-74,-52],[68,-46],[-62,48],[76,40]],
  edges: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7]], eyes: [[0,0]],
  mags: [1,3,3,3,3,3,3,3,5,4,5,4], hues: [null,0xd9c4a8,0xc9b8a8,0xe0d0b8,0x7fb8e8,0x7fb8e8,0x7fb8e8,0xa89f97,null,null,null,null],
  named: [[0,'TRAPPIST-1']],
  steady: [1,2,3,4,5,6,7],
  parts: [{ t:'nebula', at:0, r:12, hue:0xff6e58, a:0.2 },
          { t:'orbit', at:0, rx:12, ry:6.6, a:0.1, T:1.51, occlude:3, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:17, ry:9.35, a:0.1, T:2.42, occlude:3, ride:[[2,0.14,1]] },
          { t:'orbit', at:0, rx:22, ry:12.1, a:0.1, T:4.05, occlude:3, ride:[[3,0.29,1]] },
          { t:'orbit', at:0, rx:27, ry:14.85, a:0.1, T:6.1, occlude:3, ride:[[4,0.43,1]] },
          { t:'orbit', at:0, rx:33, ry:18.15, a:0.1, T:9.21, occlude:3, ride:[[5,0.57,1]] },
          { t:'orbit', at:0, rx:38, ry:20.9, a:0.1, T:12.35, occlude:3, ride:[[6,0.71,1]] },
          { t:'orbit', at:0, rx:44, ry:24.2, a:0.1, T:18.77, occlude:3, ride:[[7,0.86,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   trappist: 'THE SEVEN HEARTHS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | trappist | TRAPPIST-1 (the seven hearths) | mini 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `trappist: 'THE SEVEN HEARTHS',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast trappist` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 26 / 26), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.trappist)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-sirius — SIRIUS · THE DOG STAR — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The brightest star in the night, twice the Sun and 8.6 light-years off, in a big white glow, with the Pup, a white dwarf the size of Earth, pale blue on a fifty-second eccentric hoop (one second = one year) that swings in close and races past; the line between them is the leash. Mirzam the Announcer rises just ahead of it. The eye is Sirius itself.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the basics block @34-81) — the block below, verbatim.
- SS_QUICK_POOL @279: append 'sirius'. No act unless Wyatt seats it (CANIS the spare carries it at the throat).
- A quick-pool change re-deals today's DAILY for anyone who boots after the deploy — deploy at the day rollover, or seat the id in an ACT pool instead (pinned per campaign, never shifts a run).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · SIRIUS · THE DOG STAR · opponent (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 21 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
sirius: {
  name: 'SIRIUS', title: 'THE DOG STAR', tier: 'basic', lvl: 1, tint: 0xe2ecff, eye: 0xe2ecff,
  stars: [[8,4],[-34,-14],[-64,32],[-74,64],[58,-54],[74,32],[-28,68],[42,62]],
  edges: [[0,1]], eyes: [[8,4]],
  mags: [1,3,2,5,4,5,5,4], hues: [null,0xb8f0ff,0xa6c8ff,null,null,null,null,null],
  named: [[0,'SIRIUS']],
  parts: [{ t:'nebula', at:0, r:18, hue:0xe2ecff, a:0.2 },
          { t:'nebula', at:1, r:5, hue:0xb8f0ff, a:0.3 },
          { t:'orbit', at:0, rx:42, ry:20, tilt:25, e:0.6, a:0.2, T:50, ride:[[1,0.5,1]] }],
  fx: { idle:'prowl', atk:'pounce' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   sirius: 'THE DOG STAR',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | sirius | SIRIUS (the dog star) | basic 1 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `sirius: 'THE DOG STAR',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast sirius` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 21 / 21), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.sirius)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named parts idle 'orbit' attack 'fling'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-castor — CASTOR · THE SIX — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
One star to the eye, six in truth: two white pairs waltzing round each other on a sixty-second hoop in a shared glow, each pair itself a tight binary spinning in days, and far out on a dashed rail a third pair of red dwarfs, YY Geminorum, eclipsing each other every 1.6 seconds. Pollux, the other twin, sits orange at the corner. The eye is the heart of the waltz.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[1].minis @250: append 'castor' (Act II mini, the head of GEMINI; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CASTOR · THE SIX · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named parts idle 'orbit' attack 'fling') · objects 19 battle / 19 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
castor: {
  name: 'CASTOR', title: 'THE SIX', tier: 'mini', lvl: 2, tint: 0xe2ecff, eye: 0xa6c8ff,
  stars: [[-11,5],[11,-5],[-56,30],[62,-52],[72,46]],
  edges: [[0,1],[0,2]], eyes: [[0,0]],
  mags: [1,2,3,5,2], hues: [null,null,0xff6e58,null,0xffb066],
  named: [[0,'CASTOR']],
  parts: [{ t:'nebula', at:0, x:0, y:0, r:15, hue:0xe2ecff, a:0.12 },
          { t:'binary', at:0, sep:6, ang:20, hue:0xe2ecff, T:18.4 },
          { t:'binary', at:1, sep:6, ang:-60, hue:0xe2ecff, T:5.8 },
          { t:'binary', at:2, sep:5, ang:0, hue:0xff6e58, T:1.6 },
          { t:'orbit', at:0, x:0, y:0, rx:22, ry:14, tilt:-25, e:0.34, a:0.2, T:60, ride:[[0,0.5,0.7],[1,0,1]] },
          { t:'orbit', at:0, x:0, y:0, rx:68, ry:36, a:0.12, dash:true, T:400, ride:[[2,0.4,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   castor: 'THE SIX',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | castor | CASTOR (the six) | mini 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `castor: 'THE SIX',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast castor` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 19 / 19), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.castor)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-albireo — ALBIREO · THE TWO-COLOURED — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The prettiest double in any small telescope, drawn through one: a gold giant and a blue star close together in the round of the eyepiece, each in its own glow, the one bridge line between them, the gold one breathing every 2.4 seconds. Nothing else: restraint is the object. The eye is the blue one.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the basics block @34-81) — the block below, verbatim.
- SS_QUICK_POOL @279: append 'albireo'. No act unless Wyatt seats it (the beak of CYGNUS wears the pair).
- A quick-pool change re-deals today's DAILY for anyone who boots after the deploy — deploy at the day rollover, or seat the id in an ACT pool instead (pinned per campaign, never shifts a run).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · ALBIREO · THE TWO-COLOURED · opponent (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named pulse parts) · objects 21 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
albireo: {
  name: 'ALBIREO', title: 'THE TWO-COLOURED', tier: 'basic', lvl: 1, tint: 0xe2ecff, eye: 0xa6c8ff,
  stars: [[-20,4],[20,-4],[-70,-48],[58,46],[-52,60],[74,-36],[22,-66],[-84,18]],
  edges: [[0,1]], eyes: [[20,-4]],
  mags: [1,2,5,4,5,4,5,5], hues: [0xffdc7a,0xa6c8ff,null,null,null,null,null,null],
  named: [[0,'ALBIREO']],
  pulse: [[0,2.4,0.55]],
  parts: [{ t:'ring', at:0, x:0, y:0, rx:92, ry:92, hue:0xcfd8ff, a:0.12 },
          { t:'nebula', at:0, r:20, hue:0xffdc7a, a:0.2 },
          { t:'nebula', at:1, r:14, hue:0xa6c8ff, a:0.2 }],
  fx: { idle:'ripple', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   albireo: 'THE TWO-COLOURED',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | albireo | ALBIREO (the two-coloured) | basic 1 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `albireo: 'THE TWO-COLOURED',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast albireo` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 21 / 21), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.albireo)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-m42 — ORION NEBULA · THE CRADLE — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The nearest great star factory, 1,344 light-years down the sword of Orion: a rose cloud over a teal core, lit by the four Trapezium stars in its heart, with M43 budding off the top, the Running Man above and Hatysa below. The eye is the brightest Trapezium star.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[0].minis @243: append 'm42' (Act I mini; the sword of ORION wears it as a part; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · ORION NEBULA · THE CRADLE · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags named parts) · objects 24 battle / 24 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
m42: {
  name: 'ORION NEBULA', title: 'THE CRADLE', tier: 'mini', lvl: 2, tint: 0xa6c8ff, eye: 0xe2ecff,
  stars: [[5,-12],[-13,-8],[-8,10],[10,12],[31,22],[-3,58],[5,-54],[-64,-56],[60,50]],
  edges: [[0,1],[1,2],[2,3],[3,0],[3,4]], eyes: [[5,-12]],
  mags: [2,3,4,3,3,2,4,5,5],
  named: [[0,'TRAPEZIUM']],
  parts: [{ t:'nebula', at:0, x:0, y:3, r:44, hue:0xff7a9a, a:0.26 },
          { t:'nebula', at:0, x:0, y:0, r:20, hue:0x6fe0d0, a:0.32 },
          { t:'nebula', at:0, x:15, y:-33, r:12, hue:0xff7a9a, a:0.16 },
          { t:'nebula', at:6, x:5, y:-56, r:13, hue:0xa6c8ff, a:0.12 }],
  fx: { idle:'ripple', atk:'breath' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   m42: 'THE CRADLE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | m42 | ORION NEBULA (the cradle) | mini 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `m42: 'THE CRADLE',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast m42` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 24 / 24), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.m42)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-crab — CRAB NEBULA · THE HEART THAT BEATS — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The wreck of a star seen exploding in 1054, bright enough to read by in daylight for three weeks; the rose shell and its orange filaments still fly outward, and at the centre a neutron star spins thirty times a second, compressed here to a two-a-second heartbeat. The eye IS the pulsar.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[1].bosses @251: append 'crab' (Act II boss, the wreck of the star of 1054; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CRAB NEBULA · THE HEART THAT BEATS · opponent (boss lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named pulse parts) · objects 25 battle / 24 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
crab: {
  name: 'CRAB NEBULA', title: 'THE HEART THAT BEATS', tier: 'boss', lvl: 2, tint: 0xff7a9a, eye: 0xb8f0ff,
  stars: [[0,0],[31,4],[16,20],[-5,23],[-27,12],[-29,-8],[-11,-22],[11,-22],[28,-10]],
  edges: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8]], eyes: [[0,0]],
  mags: [2,5,4,5,4,5,4,5,4], hues: [0xb8f0ff,0xffb066,null,0xffb066,null,0xffb066,null,0xffb066,null],
  named: [[0,'THE PULSAR']],
  pulse: [[0,0.5,0.2]],
  parts: [{ t:'nebula', at:0, r:32, hue:0xff7a9a, a:0.38 },
          { t:'nebula', at:0, r:13, hue:0xa6c8ff, a:0.4 },
          { t:'ring', at:0, rx:27, ry:21, hue:0xffb066, a:0.4 }],
  fx: { idle:'ripple', atk:'slam', amp:1.1 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   crab: 'THE HEART THAT BEATS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | crab | CRAB NEBULA (the heart that beats) | boss 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `crab: 'THE HEART THAT BEATS',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast crab` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 25 / 24), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.crab)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues pulse parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-m57 — RING NEBULA · THE SMOKE RING — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
A dying sun's shed shell hung under the harp's bottom string, teal inside and red at the rim, with the white-dwarf ember it left behind glowing faintly at the centre every three seconds; Sheliak on the string above winks every 12.9. The eye is the ember.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the basics block @34-81) — the block below, verbatim.
- SS_QUICK_POOL @279: append 'm57'. No act unless Wyatt seats it (LYRA the spare carries it).
- A quick-pool change re-deals today's DAILY for anyone who boots after the deploy — deploy at the day rollover, or seat the id in an ACT pool instead (pinned per campaign, never shifts a run).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · RING NEBULA · THE SMOKE RING · opponent (basic lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues pulse parts) · objects 16 battle / 16 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
m57: {
  name: 'RING NEBULA', title: 'THE SMOKE RING', tier: 'basic', lvl: 2, tint: 0x6fe0d0, eye: 0xb8f0ff,
  stars: [[2,22],[-42,-8],[46,-2],[28,-46],[-38,-50]],
  edges: [[4,3],[3,2],[2,1],[1,4]], eyes: [[2,22]],
  mags: [5,3,2,3,3], hues: [0xb8f0ff,0xa6c8ff,0xa6c8ff,0xff6e58,0xa6c8ff],
  pulse: [[0,3,0.3],[1,12.9,0.6]],
  parts: [{ t:'ring', at:0, rx:22, ry:16, hue:0x6fe0d0, a:0.55 },
          { t:'ring', at:0, rx:27, ry:20, hue:0xff6e58, a:0.28 },
          { t:'nebula', at:0, r:14, hue:0x6fe0d0, a:0.15 }],
  fx: { idle:'lumber', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   m57: 'THE SMOKE RING',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | m57 | RING NEBULA (the smoke ring) | basic 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `m57: 'THE SMOKE RING',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast m57` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 16 / 16), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.m57)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-andromeda — ANDROMEDA · THE SISTER GALAXY — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Two and a half million light-years off and six full Moons wide, the farthest thing a bare eye can see, found by hopping Mirach to mu to nu; its two small companions M32 and M110 cling to the disc, and it is coming at us, due in four billion years. The eye is the core.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[3].bosses @263: append 'andromeda' (Act IV boss, the farthest thing an eye can see; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · ANDROMEDA · THE SISTER GALAXY · opponent (boss lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts) · objects 20 battle / 19 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
andromeda: {
  name: 'ANDROMEDA', title: 'THE SISTER GALAXY', tier: 'boss', lvl: 4, tint: 0xcfd8ff, eye: 0xfff2cc,
  stars: [[-8,-4],[14,22],[22,42],[40,66],[-72,40],[64,-56]],
  edges: [[3,2],[2,1],[1,0]], eyes: [[-8,-4]],
  mags: [3,3,3,1,5,5], hues: [0xfff2cc,0xa6c8ff,null,0xff6e58,null,null],
  named: [[3,'MIRACH']],
  steady: [0],
  parts: [{ t:'galaxy', at:0, x:-8, y:-4, r:34, tilt:-32, hue:0xcfd8ff, a:0.2 },
          { t:'galaxy', at:0, x:-2, y:14, r:4, tilt:40, hue:0xcfd8ff, a:0.14 },
          { t:'galaxy', at:0, x:-30, y:-26, r:6, tilt:-10, hue:0xcfd8ff, a:0.12 }],
  fx: { idle:'lumber', atk:'charge' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   andromeda: 'THE SISTER GALAXY',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | andromeda | ANDROMEDA (the sister galaxy) | boss 4 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `andromeda: 'THE SISTER GALAXY',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast andromeda` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 20 / 19), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.andromeda)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-praesepe — PRAESEPE · THE SWARM — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The Beehive, M44, a thousand stars in the manger between the two donkeys of Cancer, a smudge to the bare eye: thirty baked in the swarm and six live ones ringing it as one honeycomb cell, Asellus Australis orange at the rim as the wish-star. Six bolts in the volley; the eye is the heart of the hive.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the basics block @34-81) — the block below, verbatim.
- SS_QUICK_POOL @279: append 'praesepe'. No act unless Wyatt seats it (CANCER the sign keeps it).
- A quick-pool change re-deals today's DAILY for anyone who boots after the deploy — deploy at the day rollover, or seat the id in an ACT pool instead (pinned per campaign, never shifts a run).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · PRAESEPE · THE SWARM · opponent (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 21 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
praesepe: {
  name: 'PRAESEPE', title: 'THE SWARM', tier: 'basic', lvl: 1, tint: 0xfff2cc, eye: 0xffdc7a,
  stars: [[2,-3],[28,1],[10,-25],[-16,-20],[-26,7],[-10,26],[17,21],[8,-62],[38,40]],
  edges: [[1,2],[2,3],[3,4],[4,5],[5,6],[6,1]], eyes: [[2,-3]],
  mags: [4,4,4,4,4,4,4,3,3], hues: [null,null,null,null,null,null,null,0xe2ecff,0xffb066],
  named: [[8,'ASELLUS AUSTRALIS']],
  parts: [{ t:'cluster', at:0, x:0, y:0, n:30, r:20, hue:0xfff2cc, a:0.9 }],
  fx: { idle:'ripple', atk:'volley', bolts:6 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   praesepe: 'THE SWARM',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | praesepe | PRAESEPE (the swarm) | basic 1 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `praesepe: 'THE SWARM',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast praesepe` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 21 / 21), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.praesepe)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse arcs parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-supernova — SUPERNOVA · THE LAST LIGHT — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Tycho's star of 1572, a star that ended and for two weeks burned bright enough to see at noon: a blazing white core breathing on a two-second pulse inside a gold flash, a rose shell of torn filaments and the blue-white shock ring frozen at the edge of the box; the shell ripples, the core stays. The eye is the neutron star left in the middle; the nova at amp 1.5 flashes the whole shell.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[2].bosses @257: append 'supernova' (Act III boss, the star that outshone the dawn; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · SUPERNOVA · THE LAST LIGHT · opponent (boss lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named pulse arcs parts) · objects 30 battle / 29 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
supernova: {
  name: 'SUPERNOVA', title: 'THE LAST LIGHT', tier: 'boss', lvl: 3, tint: 0xe2ecff, eye: 0xb8f0ff,
  stars: [[0,0],[44,-30],[56,8],[30,44],[-12,54],[-48,32],[-56,-14],[-30,-46],[8,-56],[17,-17],[17,17],[-17,17],[-17,-17]],
  edges: [[0,9],[0,10],[0,11],[0,12]], eyes: [[0,0]],
  mags: [1,4,5,4,5,4,5,4,5,5,5,5,5], hues: [null,0xff7a9a,null,0xff7a9a,null,0xff7a9a,null,0xff7a9a,null,null,null,null,null],
  named: [[0,'STELLA NOVA']],
  pulse: [[0,2.2,0.6]],
  arcs: [[1,2,-0.1,0.2],[2,3,-0.1,0.2],[3,4,-0.1,0.2],[4,5,-0.1,0.2],[5,6,-0.1,0.2],[6,7,-0.1,0.2],[7,8,-0.1,0.2],[8,1,-0.1,0.2]],
  parts: [{ t:'nebula', at:0, r:16, hue:0xffdc7a, a:0.26 },
          { t:'nebula', at:0, r:44, hue:0xff7a9a, a:0.06 },
          { t:'ring', at:0, rx:50, ry:50, hue:0xff7a9a, a:0.3 },
          { t:'ring', at:0, rx:57, ry:57, hue:0xa6c8ff, a:0.25 }],
  fx: { idle:'ripple', atk:'nova', amp:1.5 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   supernova: 'THE LAST LIGHT',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | supernova | SUPERNOVA (the last light) | boss 3 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `supernova: 'THE LAST LIGHT',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast supernova` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 30 / 29), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.supernova)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-eclipse — ECLIPSE · THE DARK SUN — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The Moon exactly covers the Sun, four hundred times smaller and four hundred times nearer, and the stars come out at noon: a black disc with the pearl corona round it, two long streamers east and west and short plumes at the poles, five Baily's beads along the rim where the Moon's valleys let light through, and the diamond ring blazing at the upper limb. The diamond is the eye; the breath is the corona streaming.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[1].bosses @251: append 'eclipse' (Act II boss, the sigil THE ECLIPSE gets a face; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · ECLIPSE · THE DARK SUN · opponent (boss lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 29 battle / 28 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
eclipse: {
  name: 'ECLIPSE', title: 'THE DARK SUN', tier: 'boss', lvl: 2, tint: 0xffdc7a, eye: 0xfff2cc,
  stars: [[27,-27],[6,-30],[14,-27],[26,-15],[30,-4],[30,6],[-78,-50],[70,52],[-62,40]],
  edges: [[1,2],[2,0],[0,3],[3,4],[4,5]], eyes: [[27,-27]],
  mags: [1,3,3,3,3,3,5,5,5], hues: [0xfff2cc,null,null,null,null,null,0xe2ecff,0xe2ecff,0xe2ecff],
  named: [[0,'THE DIAMOND RING']],
  parts: [{ t:'nebula', at:0, x:0, y:0, r:56, hue:0xfff2cc, a:0.1 },
          { t:'ring', at:0, x:0, y:0, rx:42, ry:42, hue:0xffdc7a, a:0.3 },
          { t:'blackhole', at:0, x:0, y:0, r:30 },
          { t:'comet', at:0, x:37, y:0, len:44, ang:4, bulge:0, w:7, hue:0xfff2cc, a:0.12 },
          { t:'comet', at:0, x:-37, y:0, len:44, ang:184, bulge:0, w:7, hue:0xfff2cc, a:0.12 },
          { t:'comet', at:0, x:0, y:-37, len:20, ang:-90, bulge:0, w:4, hue:0xfff2cc, a:0.08 },
          { t:'comet', at:0, x:0, y:37, len:20, ang:90, bulge:0, w:4, hue:0xfff2cc, a:0.08 }],
  fx: { idle:'lumber', atk:'breath' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   eclipse: 'THE DARK SUN',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | eclipse | ECLIPSE (the dark sun) | boss 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `eclipse: 'THE DARK SUN',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast eclipse` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 29 / 28), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.eclipse)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse arcs parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-pulsar — PULSAR · THE LIGHTHOUSE — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
A sun's weight packed into a city-sized ball, sweeping two beams from its magnetic poles: the first one found, in 1967, ticked every 1.337 seconds and they called it LGM-1, little green men. The core, a pale white-dwarf blue, blinks to nothing and back on exactly that clock; two beams lie along the tilted axis and four field loops arc from cap to cap. The eye is the core; the volley is timed to the beam.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[2].minis @256: append 'pulsar' (Act III mini, the beam is the telegraph; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · PULSAR · THE LIGHTHOUSE · opponent (mini lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named pulse arcs parts) · objects 22 battle / 22 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
pulsar: {
  name: 'PULSAR', title: 'THE LIGHTHOUSE', tier: 'mini', lvl: 3, tint: 0xa6c8ff, eye: 0xb8f0ff,
  stars: [[0,0],[12,-8],[-12,8],[-72,-44],[70,40],[-46,56],[56,-58]],
  edges: [[1,0],[0,2]], eyes: [[0,0]],
  mags: [1,5,5,5,5,5,5], hues: [0xb8f0ff,null,null,null,null,null,null],
  named: [[0,'LGM-1']],
  pulse: [[0,1.337,0.05]],
  arcs: [[1,2,0.35,0.12],[1,2,-0.35,0.12],[1,2,0.7,0.08],[1,2,-0.7,0.08]],
  parts: [{ t:'nebula', at:0, r:9, hue:0xb8f0ff, a:0.35 },
          { t:'comet', at:0, len:90, ang:-34, bulge:0, w:5, hue:0xa6c8ff, a:0.35 },
          { t:'comet', at:0, len:90, ang:146, bulge:0, w:5, hue:0xa6c8ff, a:0.35 },
          { t:'comet', at:0, x:73, y:-49, len:84, ang:146, bulge:0, w:12, hue:0xa6c8ff, a:0.1 },
          { t:'comet', at:0, x:-73, y:49, len:84, ang:-34, bulge:0, w:12, hue:0xa6c8ff, a:0.1 }],
  fx: { idle:'ripple', atk:'volley', bolts:3 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   pulsar: 'THE LIGHTHOUSE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | pulsar | PULSAR (the lighthouse) | mini 3 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `pulsar: 'THE LIGHTHOUSE',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast pulsar` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 22 / 22), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.pulsar)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (SS_DECOR + ssSkyDecor land there — the menu-sky seats). Do not fire this card until SS-SKY-01 is LIVE.
# SS-DECOR-venus — VENUS · THE EVENING STAR — a MENU SKY seat from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The brightest planet, following the Sun down; the first star out at dusk, and the one that never twinkles.

## WHERE IT LIVES
- SS_DECOR (data.js, beside SS_QUICK_POOL @279) — the block below, verbatim. Seat [335,392] in the 420x800 frame (design units; y 150 is the showcase, 445 the horizon).
- ssSkyDecor(scene, l) draws it under the showcase's depth, outside x 100-320 / y 70-230; ≤ 12 decor objects at rest.
- Never into SS_BEASTS (data.js:225 needs a tier); no pool changes.

## THE DATA
```js
// STARSPELL sky object · VENUS · THE EVENING STAR · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: named steady parts) · objects 8 battle / 8 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
venus: {
  name: 'VENUS', title: 'THE EVENING STAR', seat: [335,392], tint: 0xfff2cc,
  stars: [[0,0]], edges: [], eyes: [],
  named: [[0,'VENUS']],
  steady: [0],
  cross: 1.35,
  parts: [{ t:'nebula', at:0, r:30, hue:0xfff2cc, a:0.12 }],
},
```

## PROOF
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- tools/sky-check.mjs --decor venus on ?rend=cv AND --gl: the home rests with ≤ 12 decor objects, the seat never twinkles (steady), zero Runtime.exceptionThrown, `window.__ssBakeFail` empty.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No beast, no pool, no fight math, no saves; the SKY-DESIGN palette, gradient, moon seat and the 320-star budget.

================================================================================================
NEEDS SS-SKY-01 FIRST (SS_DECOR + ssSkyDecor land there — the menu-sky seats). Do not fire this card until SS-SKY-01 is LIVE.
# SS-DECOR-moon — THE MOON · THE NIGHT'S LANTERN — a MENU SKY seat from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The menu's own moon at its seat, upgraded to tonight's true phase (days since 2000-01-06T18:14Z over 29.530589, mod 1), with the maria, Tycho and its rays, and earthshine on the dark face. On the MENU SKY board dial D13 keeps the shipped crescent until flipped.

## WHERE IT LIVES
- SS_DECOR (data.js, beside SS_QUICK_POOL @279) — the block below, verbatim. Seat [70,425] in the 420x800 frame (design units; y 150 is the showcase, 445 the horizon).
- ssSkyDecor(scene, l) draws it under the showcase's depth, outside x 100-320 / y 70-230; ≤ 12 decor objects at rest.
- Never into SS_BEASTS (data.js:225 needs a tier); no pool changes.

## THE DATA
```js
// STARSPELL sky object · THE MOON · THE NIGHT'S LANTERN · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags steady parts) · objects 7 battle / 7 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
moon: {
  name: 'THE MOON', title: 'THE NIGHT\'S LANTERN', seat: [70,425], tint: 0xf7e8c8,
  stars: [[22,0]], edges: [], eyes: [],
  steady: [0],
  parts: [{ t:'moon', at:0, x:0, y:0, r:34, phase:'true', angle:24 }],
},
```

## PROOF
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- tools/sky-check.mjs --decor moon on ?rend=cv AND --gl: the home rests with ≤ 12 decor objects, the seat never twinkles (steady), zero Runtime.exceptionThrown, `window.__ssBakeFail` empty.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No beast, no pool, no fight math, no saves; the SKY-DESIGN palette, gradient, moon seat and the 320-star budget.

================================================================================================
NEEDS SS-SKY-01 FIRST (SS_DECOR + ssSkyDecor land there — the menu-sky seats). Do not fire this card until SS-SKY-01 is LIVE.
# SS-DECOR-perseids — PERSEIDS · THE FALLING NIGHT — a MENU SKY seat from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Comet dust from Swift-Tuttle hitting the air a hundred kilometres up every August the twelfth; every streak flies away from one point in Perseus, the radiant. Six streaks caught mid-fall: four cream, one green (magnesium), one orange fireball (sodium). Only the radiant twinkles.

## WHERE IT LIVES
- SS_DECOR (data.js, beside SS_QUICK_POOL @279) — the block below, verbatim. Seat [380,40] in the 420x800 frame (design units; y 150 is the showcase, 445 the horizon).
- ssSkyDecor(scene, l) draws it under the showcase's depth, outside x 100-320 / y 70-230; ≤ 12 decor objects at rest.
- Never into SS_BEASTS (data.js:225 needs a tier); no pool changes.

## THE DATA
```js
// STARSPELL sky object · PERSEIDS · THE FALLING NIGHT · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags parts) · objects 12 battle / 12 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
perseids: {
  name: 'PERSEIDS', title: 'THE FALLING NIGHT', seat: [380,40], tint: 0xfff2cc,
  stars: [[0,0]], edges: [], eyes: [],
  parts: [{ t:'comet', at:0, x:-6, y:52, len:26, ang:-84, bulge:0, w:2.6, hue:0xfff2cc, a:0.45 },
          { t:'comet', at:0, x:-30, y:46, len:22, ang:-57, bulge:0, w:2.4, hue:0xfff2cc, a:0.4 },
          { t:'comet', at:0, x:-48, y:40, len:34, ang:-40, bulge:0, w:3.4, hue:0xffb066, a:0.55 },
          { t:'comet', at:0, x:-40, y:18, len:20, ang:-24, bulge:0, w:2.2, hue:0xa8ffc4, a:0.4 },
          { t:'comet', at:0, x:-62, y:8, len:24, ang:-7, bulge:0, w:2.6, hue:0xfff2cc, a:0.45 },
          { t:'comet', at:0, x:-34, y:-8, len:18, ang:13, bulge:0, w:2.2, hue:0xfff2cc, a:0.35 }],
},
```

## PROOF
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- tools/sky-check.mjs --decor perseids on ?rend=cv AND --gl: the home rests with ≤ 12 decor objects, the seat never twinkles (steady), zero Runtime.exceptionThrown, `window.__ssBakeFail` empty.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No beast, no pool, no fight math, no saves; the SKY-DESIGN palette, gradient, moon seat and the 320-star budget.

================================================================================================
NEEDS SS-SKY-01 FIRST (SS_DECOR + ssSkyDecor land there — the menu-sky seats). Do not fire this card until SS-SKY-01 is LIVE.
# SS-DECOR-milkyway — THE RIVER · THE MILKY WAY — a MENU SKY seat from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Our own galaxy seen edge-on from inside, standing up from the south-west on an August dusk: five faint overlapping blobs make the band and forty baked dust stars ride it in four clusters. Nothing moves but the dust's twinkle, and nothing here is brighter than the showcase.

## WHERE IT LIVES
- SS_DECOR (data.js, beside SS_QUICK_POOL @279) — the block below, verbatim. Seat [210,300] in the 420x800 frame (design units; y 150 is the showcase, 445 the horizon).
- ssSkyDecor(scene, l) draws it under the showcase's depth, outside x 100-320 / y 70-230; ≤ 12 decor objects at rest.
- Never into SS_BEASTS (data.js:225 needs a tier); no pool changes.

## THE DATA
```js
// STARSPELL sky object · THE RIVER · THE MILKY WAY · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 15 battle / 15 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
milkyway: {
  name: 'THE RIVER', title: 'THE MILKY WAY', seat: [210,300], tint: 0xcfd8ff,
  stars: [[0,0]], edges: [], eyes: [],
  parts: [{ t:'nebula', at:0, x:-62, y:36, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:-31, y:18, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:0, y:0, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:31, y:-18, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:62, y:-36, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'cluster', at:0, x:-47, y:27, n:10, r:26, hue:0xfff2cc, a:0.5 },
          { t:'cluster', at:0, x:-16, y:9, n:10, r:26, hue:0xfff2cc, a:0.5 },
          { t:'cluster', at:0, x:16, y:-9, n:10, r:26, hue:0xfff2cc, a:0.5 },
          { t:'cluster', at:0, x:47, y:-27, n:10, r:26, hue:0xfff2cc, a:0.5 }],
},
```

## PROOF
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- tools/sky-check.mjs --decor milkyway on ?rend=cv AND --gl: the home rests with ≤ 12 decor objects, the seat never twinkles (steady), zero Runtime.exceptionThrown, `window.__ssBakeFail` empty.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No beast, no pool, no fight math, no saves; the SKY-DESIGN palette, gradient, moon seat and the 320-star budget.

================================================================================================
NEEDS SS-SKY-01 FIRST (SS_DECOR + ssSkyDecor land there — the menu-sky seats). Do not fire this card until SS-SKY-01 is LIVE.
# SS-DECOR-iss — THE ISS · THE PASSING LIGHT — a MENU SKY seat from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The space station crossing at dusk: a steady cream point that never twinkles, no cross, brighter than any star for the thirty-five seconds it takes to cross, then gone into Earth's shadow before the far side. The short bright streak behind it is the store's way of saying it moves.

## WHERE IT LIVES
- SS_DECOR (data.js, beside SS_QUICK_POOL @279) — the block below, verbatim. Seat [120,240] in the 420x800 frame (design units; y 150 is the showcase, 445 the horizon).
- ssSkyDecor(scene, l) draws it under the showcase's depth, outside x 100-320 / y 70-230; ≤ 12 decor objects at rest.
- Never into SS_BEASTS (data.js:225 needs a tier); no pool changes.

## THE DATA
```js
// STARSPELL sky object · THE ISS · THE PASSING LIGHT · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: steady parts) · objects 8 battle / 8 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
iss: {
  name: 'THE ISS', title: 'THE PASSING LIGHT', seat: [120,240], tint: 0xfff2cc,
  stars: [[0,0]], edges: [], eyes: [],
  steady: [0],
  parts: [{ t:'nebula', at:0, r:6, hue:0xfff2cc, a:0.3 },
          { t:'comet', at:0, len:44, ang:158, bulge:0, w:5, hue:0xfff2cc, a:0.85 }],
},
```

## PROOF
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- tools/sky-check.mjs --decor iss on ?rend=cv AND --gl: the home rests with ≤ 12 decor objects, the seat never twinkles (steady), zero Runtime.exceptionThrown, `window.__ssBakeFail` empty.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No beast, no pool, no fight math, no saves; the SKY-DESIGN palette, gradient, moon seat and the 320-star budget.

================================================================================================
NEEDS SS-SKY-01 FIRST (SS_DECOR + ssSkyDecor land there — the menu-sky seats). Do not fire this card until SS-SKY-01 is LIVE.
# SS-DECOR-conjunction — THE TRIO · THE EVENING TRIO — a MENU SKY seat from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Three wanderers in one line low over the sunset, the way the sky does it a few evenings a year: a two-day-old crescent Moon nearest the Sun with earthshine on its dark face, Venus cream and blazing with the cross, Jupiter gold above and left. None of the three twinkles.

## WHERE IT LIVES
- SS_DECOR (data.js, beside SS_QUICK_POOL @279) — the block below, verbatim. Seat [330,380] in the 420x800 frame (design units; y 150 is the showcase, 445 the horizon).
- ssSkyDecor(scene, l) draws it under the showcase's depth, outside x 100-320 / y 70-230; ≤ 12 decor objects at rest.
- Never into SS_BEASTS (data.js:225 needs a tier); no pool changes.

## THE DATA
```js
// STARSPELL sky object · THE TRIO · THE EVENING TRIO · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts) · objects 10 battle / 10 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
conjunction: {
  name: 'THE TRIO', title: 'THE EVENING TRIO', seat: [330,380], tint: 0xfff2cc,
  stars: [[0,0],[-50,-16]], edges: [], eyes: [],
  named: [[0,'VENUS']],
  steady: [0,1],
  cross: 1.35,
  parts: [{ t:'nebula', at:0, r:24, hue:0xfff2cc, a:0.1 },
          { t:'moon', at:0, x:46, y:16, r:9, phase:0.1, angle:30 }],
},
```

## PROOF
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- tools/sky-check.mjs --decor conjunction on ?rend=cv AND --gl: the home rests with ≤ 12 decor objects, the seat never twinkles (steady), zero Runtime.exceptionThrown, `window.__ssBakeFail` empty.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No beast, no pool, no fight math, no saves; the SKY-DESIGN palette, gradient, moon seat and the 320-star budget.

================================================================================================
NEEDS SS-SKY-01 FIRST (SS_DECOR + ssSkyDecor land there — the menu-sky seats). Do not fire this card until SS-SKY-01 is LIVE.
# SS-DECOR-wish — THE WISH · THE WISHING STAR — a MENU SKY seat from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
One grain of comet dust, white-hot for a third of a second: a class-1 cream head in its own small bloom, a white streak trailing back toward the radiant in the top-right corner with two sparks still burning in it. The head does not twinkle; it falls. The one you are meant to wish on.

## WHERE IT LIVES
- SS_DECOR (data.js, beside SS_QUICK_POOL @279) — the block below, verbatim. Seat [300,120] in the 420x800 frame (design units; y 150 is the showcase, 445 the horizon).
- ssSkyDecor(scene, l) draws it under the showcase's depth, outside x 100-320 / y 70-230; ≤ 12 decor objects at rest.
- Never into SS_BEASTS (data.js:225 needs a tier); no pool changes.

## THE DATA
```js
// STARSPELL sky object · THE WISH · THE WISHING STAR · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags hues steady parts) · objects 11 battle / 11 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
wish: {
  name: 'THE WISH', title: 'THE WISHING STAR', seat: [300,120], tint: 0xe2ecff,
  stars: [[0,0],[12,-15],[24,-29]], edges: [], eyes: [],
  steady: [0],
  parts: [{ t:'nebula', at:0, r:7, hue:0xfff2cc, a:0.3 },
          { t:'comet', at:0, len:60, ang:-51, bulge:0, w:4.2, hue:0xe2ecff, a:0.8 }],
},
```

## PROOF
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- tools/sky-check.mjs --decor wish on ?rend=cv AND --gl: the home rests with ≤ 12 decor objects, the seat never twinkles (steady), zero Runtime.exceptionThrown, `window.__ssBakeFail` empty.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No beast, no pool, no fight math, no saves; the SKY-DESIGN palette, gradient, moon seat and the 320-star budget.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-crown — CORONA · THE NORTHERN CROWN — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The sky's real crown: seven stars in a bowl, opening downward as it does over the north in spring. Alphecca, the gem, is the white wish-star and the eye, dipping every seventeen seconds because it is two stars eclipsing. Inside the rim T Coronae, the Blaze Star, breathes red on a thirty-second swell; one night soon it goes off for real.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the basics block @34-81) — the block below, verbatim.
- MENU SKY showcase list (Home.buildMeadowUi @4153-4166): append 'crown'; never SS_ACTS unless Wyatt seats it.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CORONA · THE NORTHERN CROWN · showcase only (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named pulse) · objects 18 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
crown: {
  name: 'CORONA', title: 'THE NORTHERN CROWN', tier: 'basic', lvl: 1, tint: 0xe2ecff, eye: 0xfff2cc,
  stars: [[-72,14],[-50,-20],[-18,-40],[18,-40],[48,-26],[68,0],[75,30],[35,37]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]], eyes: [[-18,-40]],
  mags: [4,3,1,3,4,4,5,3], hues: [0xa6c8ff,0xfff2cc,null,null,null,0xffb066,null,0xff6e58],
  named: [[2,'ALPHECCA']],
  pulse: [[2,17.4,0.85],[7,30,0.15]],
  fx: { idle:'ripple', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   crown: 'THE NORTHERN CROWN',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | crown | CORONA (the northern crown) | basic 1 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `crown: 'THE NORTHERN CROWN',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast crown` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 18 / 18), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.crown)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse arcs parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-harp — LYRA · THE HARP — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Vega, the star the magnitude scale was once measured from, blazes white at the top as the wish-star and the eye; the little parallelogram hangs under it, its two sides bowed out into the curved arms of a lyre, four arcs the ripple plucks. Sheliak on the lower left dims every thirteen seconds, and on the bottom bar sits the Ring Nebula, teal with a red rim, a sun's last breath.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the basics block @34-81) — the block below, verbatim.
- MENU SKY showcase list (Home.buildMeadowUi @4153-4166): append 'harp'; never SS_ACTS unless Wyatt seats it.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · LYRA · THE HARP · showcase only (basic lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named pulse arcs parts) · objects 18 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
harp: {
  name: 'LYRA', title: 'THE HARP', tier: 'basic', lvl: 2, tint: 0xcfd8ff, eye: 0xe2ecff,
  stars: [[0,-48],[33,-54],[-9,-15],[30,-9],[-15,45],[27,51]],
  edges: [[0,1],[0,2],[2,3],[2,4],[3,5],[4,5]], eyes: [[0,-48]],
  mags: [1,4,3,3,3,2], hues: [0xe2ecff,null,null,0xff6e58,0xa6c8ff,0xa6c8ff],
  named: [[0,'VEGA']],
  pulse: [[4,12.9,0.6]],
  arcs: [[2,4,0.09,0.12],[2,4,0.18,0.09],[3,5,-0.09,0.12],[3,5,-0.18,0.09]],
  parts: [{ t:'binary', at:1, sep:3.5, ang:20, hue:0xe2ecff, T:0 },
          { t:'ring', at:4, x:6, y:51, rx:5.5, ry:4.5, hue:0x6fe0d0, a:0.55 },
          { t:'nebula', at:4, x:6, y:51, r:7, hue:0xff6e58, a:0.22 }],
  fx: { idle:'ripple', atk:'lash', strands:4 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   harp: 'THE HARP',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | harp | LYRA (the harp) | basic 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `harp: 'THE HARP',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast harp` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 18 / 18), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.harp)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-hound — CANIS MAJOR · THE HOUND — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Orion's hound, forever running after the hare: Sirius, the brightest star in the whole sky, is the wish-star at the throat and the eye, with the Pup, a white dwarf the size of Earth, circling it every fifty seconds. Adhara and Wezen carry the haunches, M41 glimmers under the throat, and at the flank a ruby, VY Canis Majoris, one of the largest stars known.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- MENU SKY showcase list (Home.buildMeadowUi @4153-4166): append 'hound'; Act II mini if Wyatt seats it.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CANIS MAJOR · THE HOUND · showcase only (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 23 battle / 23 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
hound: {
  name: 'CANIS MAJOR', title: 'THE HOUND', tier: 'mini', lvl: 2, tint: 0xa6c8ff, eye: 0xb8f0ff,
  stars: [[-12,-40],[-48,-35],[0,-62],[2,8],[12,30],[-7,61],[36,49],[-43,56],[-41,27],[50,18]],
  edges: [[0,1],[0,2],[0,3],[3,4],[4,6],[4,5],[5,7],[7,8],[8,3]], eyes: [[-12,-40]],
  mags: [1,2,4,3,2,1,2,3,4,4], hues: [0xe2ecff,null,null,null,0xfff2cc,null,null,null,null,0xff4d6b],
  named: [[0,'SIRIUS']],
  parts: [{ t:'binary', at:0, sep:6, ang:60, hue:0xb8f0ff, T:50 },
          { t:'cluster', at:3, x:-19, y:-6, n:10, r:6, hue:0xfff2cc, a:0.55 }],
  fx: { idle:'prowl', atk:'pounce' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   hound: 'THE HOUND',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | hound | CANIS MAJOR (the hound) | mini 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `hound: 'THE HOUND',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast hound` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 23 / 23), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.hound)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-lanterns — THE TRIANGLE · THE THREE LANTERNS — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The three lanterns of August: Vega, Deneb and Altair, three white first-class stars a hand-span apart, tied by three long lines you can point at from any garden. Between them a faint field, with Albireo, gold beside blue, at the heart. Vega is the eye; the attack is a volley of three.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the basics block @34-81) — the block below, verbatim.
- MENU SKY showcase list (Home.buildMeadowUi @4153-4166): append 'lanterns' for July-September nights; never SS_ACTS.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · THE TRIANGLE · THE THREE LANTERNS · showcase only (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 20 battle / 20 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
lanterns: {
  name: 'THE TRIANGLE', title: 'THE THREE LANTERNS', tier: 'basic', lvl: 1, tint: 0xe2ecff, eye: 0xfff2cc,
  stars: [[-42,-37],[32,-58],[5,59],[23,-42],[-9,-2],[-30,-17],[41,-22]],
  edges: [[0,1],[1,2],[2,0]], eyes: [[-42,-37]],
  mags: [1,1,1,4,3,5,5], hues: [null,null,null,null,0xffdc7a,null,null],
  named: [[0,'VEGA'],[1,'DENEB'],[2,'ALTAIR']],
  parts: [{ t:'binary', at:4, sep:5, ang:-20, hue:0xa6c8ff, T:0 }],
  fx: { idle:'ripple', atk:'volley', bolts:3 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   lanterns: 'THE THREE LANTERNS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | lanterns | THE TRIANGLE (the three lanterns) | basic 1 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `lanterns: 'THE THREE LANTERNS',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast lanterns` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 20 / 20), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.lanterns)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
READY TODAY (a sign is stars/edges only — ssZodiacGlyph @3546 draws lines; zero engine change). Fire any time.
# SS-SIGN-gemini — GEMINI · THE TWINS — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
GEMINI · THE TWINS (air) redrawn: 12 stars, 12 lines. id/name/title/el/desc unchanged — the boon stays: Twinned letters: words that use the same letter twice deal +10..
The store's new layers on this sign (hues, parts, named) are not exported — the game draws a sign as lines only.

## WHERE IT LIVES
- SS_ZODIAC (data.js:294-357): replace the stars/edges of the gemini entry in place — id/name/title/el/desc unchanged; no pool changes.
- No 13th sign: the game is hard-wired to twelve (game.js:6774 `cleared >= 12`, the 3x4 picker @5229, the profile strip @7121) — this card replaces one of them, never adds.

## THE DATA
```js
// STARSPELL sky object · GEMINI · THE TWINS · sign (SS_ZODIAC)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 25 battle / 25 home
// REPLACE stars/edges of SS_ZODIAC_BY.gemini (data.js:294-357) — id/name/title/el/desc unchanged
  stars: [[-28,-58],[30,-52],[-34,-30],[-42,-2],[-48,26],[-36,52],[-64,34],[24,-26],[34,2],[28,28],[44,52],[60,30]],
  edges: [[0,2],[2,3],[3,4],[4,5],[4,6],[1,7],[7,8],[8,9],[9,10],[9,11],[2,7],[3,8]],
```

## REGISTER
1. strings.js: nothing — the zod titles and boons are unchanged.
2. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- Boot headless on the crisp-check.mjs pattern (tools/crisp-check.mjs:37-131) on ?rend=cv AND ?rend=gl, iPhone SE + iPhone 14 + iPad geometries: clear beta3.campaign, tap NEW CAMPAIGN; the sign sheet draws 12 glyphs in the 3x4 grid with gemini's new stars/edges; pick it; the profile strip @7121 draws the same glyph; zero Runtime.exceptionThrown over 20 s AND the frame counter still advances.
- The other eleven signs unchanged by star/edge counts; the 26 shipped beasts untouched.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
The other eleven signs, the boons (desc), the elements, every beast, no pool, no fight math, no saves, no star chart or zodiac glyph code.

================================================================================================
READY TODAY (a sign is stars/edges only — ssZodiacGlyph @3546 draws lines; zero engine change). Fire any time.
# SS-SIGN-libra — LIBRA · THE SCALES — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
LIBRA · THE SCALES (air) redrawn: 7 stars, 7 lines. id/name/title/el/desc unchanged — the boon stays: The scales: words with vowels and consonants in balance deal +10..
The store's new layers on this sign (hues, parts, named) are not exported — the game draws a sign as lines only.

## WHERE IT LIVES
- SS_ZODIAC (data.js:294-357): replace the stars/edges of the libra entry in place — id/name/title/el/desc unchanged; no pool changes.
- No 13th sign: the game is hard-wired to twelve (game.js:6774 `cleared >= 12`, the 3x4 picker @5229, the profile strip @7121) — this card replaces one of them, never adds.

## THE DATA
```js
// STARSPELL sky object · LIBRA · THE SCALES · sign (SS_ZODIAC)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 17 battle / 17 home
// REPLACE stars/edges of SS_ZODIAC_BY.libra (data.js:294-357) — id/name/title/el/desc unchanged
  stars: [[0,-52],[-52,-16],[44,-24],[-58,28],[-44,52],[38,24],[54,50]],
  edges: [[0,1],[0,2],[1,2],[1,3],[3,4],[2,5],[5,6]],
```

## REGISTER
1. strings.js: nothing — the zod titles and boons are unchanged.
2. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- Boot headless on the crisp-check.mjs pattern (tools/crisp-check.mjs:37-131) on ?rend=cv AND ?rend=gl, iPhone SE + iPhone 14 + iPad geometries: clear beta3.campaign, tap NEW CAMPAIGN; the sign sheet draws 12 glyphs in the 3x4 grid with libra's new stars/edges; pick it; the profile strip @7121 draws the same glyph; zero Runtime.exceptionThrown over 20 s AND the frame counter still advances.
- The other eleven signs unchanged by star/edge counts; the 26 shipped beasts untouched.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
The other eleven signs, the boons (desc), the elements, every beast, no pool, no fight math, no saves, no star chart or zodiac glyph code.

================================================================================================
READY TODAY (a sign is stars/edges only — ssZodiacGlyph @3546 draws lines; zero engine change). Fire any time.
# SS-SIGN-capricorn — CAPRICORN · THE SEA-GOAT — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
CAPRICORN · THE SEA-GOAT (earth) redrawn: 9 stars, 9 lines. id/name/title/el/desc unchanged — the boon stays: The climb: words deal +1 for every beast felled this run..
The store's new layers on this sign (hues, parts, named, pulse) are not exported — the game draws a sign as lines only.

## WHERE IT LIVES
- SS_ZODIAC (data.js:294-357): replace the stars/edges of the capricorn entry in place — id/name/title/el/desc unchanged; no pool changes.
- No 13th sign: the game is hard-wired to twelve (game.js:6774 `cleared >= 12`, the 3x4 picker @5229, the profile strip @7121) — this card replaces one of them, never adds.

## THE DATA
```js
// STARSPELL sky object · CAPRICORN · THE SEA-GOAT · sign (SS_ZODIAC)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 21 battle / 21 home
// REPLACE stars/edges of SS_ZODIAC_BY.capricorn (data.js:294-357) — id/name/title/el/desc unchanged
  stars: [[-72,-30],[-62,-10],[-34,10],[-2,26],[30,26],[56,8],[70,-24],[40,-20],[-16,-24]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,0]],
```

## REGISTER
1. strings.js: nothing — the zod titles and boons are unchanged.
2. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- Boot headless on the crisp-check.mjs pattern (tools/crisp-check.mjs:37-131) on ?rend=cv AND ?rend=gl, iPhone SE + iPhone 14 + iPad geometries: clear beta3.campaign, tap NEW CAMPAIGN; the sign sheet draws 12 glyphs in the 3x4 grid with capricorn's new stars/edges; pick it; the profile strip @7121 draws the same glyph; zero Runtime.exceptionThrown over 20 s AND the frame counter still advances.
- The other eleven signs unchanged by star/edge counts; the 26 shipped beasts untouched.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
The other eleven signs, the boons (desc), the elements, every beast, no pool, no fight math, no saves, no star chart or zodiac glyph code.

================================================================================================
READY TODAY (a sign is stars/edges only — ssZodiacGlyph @3546 draws lines; zero engine change). Fire any time.
# SS-SIGN-aquarius — AQUARIUS · THE WATER-BEARER — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
AQUARIUS · THE WATER-BEARER (air) redrawn: 12 stars, 11 lines. id/name/title/el/desc unchanged — the boon stays: Once per battle, falling below half health pours the waters: heal 8..
The store's new layers on this sign (hues, parts, named) are not exported — the game draws a sign as lines only.

## WHERE IT LIVES
- SS_ZODIAC (data.js:294-357): replace the stars/edges of the aquarius entry in place — id/name/title/el/desc unchanged; no pool changes.
- No 13th sign: the game is hard-wired to twelve (game.js:6774 `cleared >= 12`, the 3x4 picker @5229, the profile strip @7121) — this card replaces one of them, never adds.

## THE DATA
```js
// STARSPELL sky object · AQUARIUS · THE WATER-BEARER · sign (SS_ZODIAC)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 25 battle / 25 home
// REPLACE stars/edges of SS_ZODIAC_BY.aquarius (data.js:294-357) — id/name/title/el/desc unchanged
  stars: [[28,-46],[12,-58],[44,-56],[24,-26],[-8,-22],[-42,-30],[-66,-6],[42,-4],[26,14],[42,32],[22,52],[50,56]],
  edges: [[1,0],[2,0],[0,3],[3,4],[4,5],[5,6],[3,7],[7,8],[8,9],[9,10],[10,11]],
```

## REGISTER
1. strings.js: nothing — the zod titles and boons are unchanged.
2. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- Boot headless on the crisp-check.mjs pattern (tools/crisp-check.mjs:37-131) on ?rend=cv AND ?rend=gl, iPhone SE + iPhone 14 + iPad geometries: clear beta3.campaign, tap NEW CAMPAIGN; the sign sheet draws 12 glyphs in the 3x4 grid with aquarius's new stars/edges; pick it; the profile strip @7121 draws the same glyph; zero Runtime.exceptionThrown over 20 s AND the frame counter still advances.
- The other eleven signs unchanged by star/edge counts; the 26 shipped beasts untouched.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
The other eleven signs, the boons (desc), the elements, every beast, no pool, no fight math, no saves, no star chart or zodiac glyph code.

================================================================================================
READY TODAY (a sign is stars/edges only — ssZodiacGlyph @3546 draws lines; zero engine change). Fire any time.
# SS-SIGN-pisces — PISCES · THE TWIN FISH — re-authored in the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
PISCES · THE TWIN FISH (water) redrawn: 14 stars, 15 lines. id/name/title/el/desc unchanged — the boon stays: The deep current: words woven at one cast from the strike deal +30%..
The store's new layers on this sign (hues, parts, named, pulse) are not exported — the game draws a sign as lines only.

## WHERE IT LIVES
- SS_ZODIAC (data.js:294-357): replace the stars/edges of the pisces entry in place — id/name/title/el/desc unchanged; no pool changes.
- No 13th sign: the game is hard-wired to twelve (game.js:6774 `cleared >= 12`, the 3x4 picker @5229, the profile strip @7121) — this card replaces one of them, never adds.

## THE DATA
```js
// STARSPELL sky object · PISCES · THE TWIN FISH · sign (SS_ZODIAC)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 28 battle / 28 home
// REPLACE stars/edges of SS_ZODIAC_BY.pisces (data.js:294-357) — id/name/title/el/desc unchanged
  stars: [[52,44],[18,34],[-14,26],[-44,22],[-66,14],[-84,20],[-86,36],[-68,42],[-52,34],[46,16],[40,-12],[34,-40],[24,-58],[44,-60]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,3],[0,9],[9,10],[10,11],[11,12],[12,13],[13,11]],
```

## REGISTER
1. strings.js: nothing — the zod titles and boons are unchanged.
2. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- Boot headless on the crisp-check.mjs pattern (tools/crisp-check.mjs:37-131) on ?rend=cv AND ?rend=gl, iPhone SE + iPhone 14 + iPad geometries: clear beta3.campaign, tap NEW CAMPAIGN; the sign sheet draws 12 glyphs in the 3x4 grid with pisces's new stars/edges; pick it; the profile strip @7121 draws the same glyph; zero Runtime.exceptionThrown over 20 s AND the frame counter still advances.
- The other eleven signs unchanged by star/edge counts; the 26 shipped beasts untouched.
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
The other eleven signs, the boons (desc), the elements, every beast, no pool, no fight math, no saves, no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named parts idle 'orbit' attack 'fling'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-alphacen — ALPHA CEN · THE THREE SISTERS — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The nearest star system, 4.4 light-years off: a gold A and an orange B waltzing on a 24-second eccentric hoop, Proxima a red speck far out on a dashed rail. A and Hadar are the Pointers, the line that finds the Southern Cross, Acrux blue-white at its foot and Gacrux red at its head. The riders are the bolts of the fling; the eye is B.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the basics block @34-81) — the block below, verbatim.
- SS_QUICK_POOL @279: append 'alphacen'. No act unless Wyatt seats it.
- A quick-pool change re-deals today's DAILY for anyone who boots after the deploy — deploy at the day rollover, or seat the id in an ACT pool instead (pinned per campaign, never shifts a run).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · ALPHA CEN · THE THREE SISTERS · opponent (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named parts idle 'orbit' attack 'fling') · objects 21 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
alphacen: {
  name: 'ALPHA CEN', title: 'THE THREE SISTERS', tier: 'basic', lvl: 1, tint: 0xffdc7a, eye: 0xffb066,
  stars: [[18,8],[34,2],[52,-58],[-30,-8],[-74,-54],[-84,6],[-58,-26],[-96,-30]],
  edges: [[0,1],[0,3],[4,5],[6,7]], eyes: [[34,2]],
  mags: [1,2,4,1,3,1,2,3], hues: [0xffdc7a,0xffb066,0xff6e58,0xa6c8ff,0xff6e58,0xa6c8ff,null,null],
  named: [[0,'RIGIL KENTAURUS']],
  parts: [{ t:'nebula', at:0, r:18, hue:0xffdc7a, a:0.16 },
          { t:'nebula', at:2, r:5, hue:0xff6e58, a:0.3 },
          { t:'orbit', at:0, x:26, y:5, rx:18, ry:11, tilt:12, e:0.5, a:0.2, T:24, ride:[[0,0.5,0.6],[1,0,1]] },
          { t:'orbit', at:0, x:38, y:-26, rx:36, ry:30, tilt:30, a:0.12, dash:true, T:0, ride:[[2,0.62,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   alphacen: 'THE THREE SISTERS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | alphacen | ALPHA CEN (the three sisters) | basic 1 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `alphacen: 'THE THREE SISTERS',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast alphacen` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 21 / 21), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.alphacen)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts idle 'orbit'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-saturn — SATURN · THE CROWNED ONE — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Nine Earths wide with rings 280,000 km across and ten metres thick, tilted 26.7 degrees; Titan, the only moon with real air, circles every 16 days; Enceladus sprays ice. The attack is the rings flashing white; the polar storm is the eye.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[1].bosses @251: append 'saturn' (Act II boss — Wyatt's seat to confirm).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · SATURN · THE CROWNED ONE · opponent (boss lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit') · objects 22 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
saturn: {
  name: 'SATURN', title: 'THE CROWNED ONE', tier: 'boss', lvl: 1, tint: 0xf0dcae, eye: 0xffb066,
  stars: [[0,0],[70,0],[-35,0],[-62,-40],[58,-44],[10,60],[-50,48],[66,30]],
  edges: [[3,4],[4,7],[7,5],[5,6],[6,3]], eyes: [[0,-21]],
  mags: [5,3,5,4,4,5,5,4], hues: [null,0xffb066,0xe2ecff,null,null,null,null,null],
  named: [[1,'TITAN']],
  steady: [0,1,2],
  parts: [{ t:'planet', at:0, r:25, hue:0xf0dcae, bands:[[-8,3,0xe6c88f],[4,4,0xe6c88f],[14,2,0xd9b87a]], ring:{ rx:58, ry:14, tilt:26.7, hue:0xe8d9b5, a:0.7, gap:0.88 } },
          { t:'orbit', at:0, rx:70, ry:17, tilt:26.7, a:0.1, T:32, occlude:25, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:35, ry:8.5, tilt:26.7, a:0.08, T:2.7, occlude:25, ride:[[2,0.3,1]] }],
  fx: { idle:'orbit', atk:'nova', amp:1.1 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   saturn: 'THE CROWNED ONE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | saturn | SATURN (the crowned one) | boss 1 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `saturn: 'THE CROWNED ONE',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast saturn` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 22 / 21), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.saturn)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts idle 'orbit' attack 'fling'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-jupiter — JUPITER · THE KING OF WORLDS — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Eleven Earths wide, striped by cloud belts scrolling once every ten seconds, with a storm bigger than Earth that has raged 350 years and IS the eye. Four Galilean moons slide along an edge-on line, dimming in front and vanishing behind; the moons are the bolts of the fling.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[2].bosses @257: append 'jupiter' (Act III boss — Wyatt's seat to confirm).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · JUPITER · THE KING OF WORLDS · opponent (boss lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 24 battle / 23 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
jupiter: {
  name: 'JUPITER', title: 'THE KING OF WORLDS', tier: 'boss', lvl: 2, tint: 0xe8d5b5, eye: 0xd9604a,
  stars: [[0,0],[36,0],[-42,0],[50,0],[-62,0],[-70,-48],[74,-40],[-60,50],[68,52]],
  edges: [[5,6],[6,8],[8,7],[7,5]], eyes: [[8,9]],
  mags: [5,4,4,3,4,4,4,5,5], hues: [null,0xffe08a,0xe2ecff,0xc9b8a8,0x8a8078,null,null,null,null],
  named: [[3,'GANYMEDE']],
  steady: [0,1,2,3,4],
  parts: [{ t:'planet', at:0, r:30, hue:0xe8d5b5, bands:[[-22,4,0xc69c6d],[-10,3,0xc69c6d],[4,5,0xb07a56],[16,3,0xc69c6d]], spot:{ x:8, y:9, rx:6, ry:3.6, hue:0xd9604a }, limb:0.12, spin:10 },
          { t:'orbit', at:0, rx:36, ry:2, a:0, T:3.5, occlude:30, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:42, ry:2, a:0, T:7.1, occlude:30, ride:[[2,0.25,1]] },
          { t:'orbit', at:0, rx:50, ry:2, a:0, T:14.3, occlude:30, ride:[[3,0.5,1]] },
          { t:'orbit', at:0, rx:62, ry:2, a:0, T:33.4, occlude:30, ride:[[4,0.75,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   jupiter: 'THE KING OF WORLDS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | jupiter | JUPITER (the king of worlds) | boss 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `jupiter: 'THE KING OF WORLDS',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast jupiter` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 24 / 23), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.jupiter)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts idle 'orbit' attack 'fling' edges[] (glint guard)). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-sol — SOL · THE LONG ORBIT — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Eight worlds round one star on hoops compressed rx = 10 x AU^0.62 (Neptune barely moves, which is true and teaches; the x6 battle clock is the orrery dial), a belt of 24 baked specks, Pluto dipping inside Neptune's line on a tilted dashed rail. Eight bolts in order.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[3].bosses @263: append 'sol' (Act IV alternate, the network fight; Wyatt confirms). edges is EMPTY: SS-SKY-01's glint guard @2425 lands first.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- edges is empty — today's spawnGlint throws and FREEZES the game ~640 ms after arm; SS-SKY-01's guard is required (NEEDS).
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · SOL · THE LONG ORBIT · opponent (boss lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling' edges[] (glint guard)) · objects 26 battle / 25 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
sol: {
  name: 'SOL', title: 'THE LONG ORBIT', tier: 'boss', lvl: 3, tint: 0xffdc7a, eye: 0xfff2cc,
  stars: [[0,0],[8,2],[-9,5],[-18,-5],[18,-10],[15,19],[-62,0],[-24,-31],[88,-12],[-41,29]],
  edges: [], eyes: [[0,0]],
  mags: [1,5,3,3,4,2,2,3,3,5], hues: [null,0xc9b8a8,0xfff2cc,0x3a7bd5,0xe0704a,0xe8d5b5,0xf0dcae,0x9fe6e0,0x3d63ff,0xd9c4a8],
  named: [[0,'THE SUN']],
  steady: [0,1,2,3,4,5,6,7,8,9],
  parts: [{ t:'nebula', at:0, r:18, hue:0xffdc7a, a:0.22 },
          { t:'orbit', at:0, rx:10, ry:4.2, a:0.12, T:2.9, occlude:6, ride:[[1,0.1,1]] },
          { t:'orbit', at:0, rx:16, ry:6.7, a:0.12, T:7.4, occlude:6, ride:[[2,0.35,1]] },
          { t:'orbit', at:0, rx:22, ry:9.2, a:0.12, T:12, occlude:6, ride:[[3,0.6,1]] },
          { t:'orbit', at:0, rx:30, ry:12.6, a:0.12, T:22.6, occlude:6, ride:[[4,0.85,1]] },
          { t:'orbit', at:0, rx:48, ry:20.2, a:0.12, T:142, occlude:6, ride:[[5,0.2,1]] },
          { t:'orbit', at:0, rx:62, ry:26, a:0.12, T:354, occlude:6, ride:[[6,0.5,1]] },
          { t:'orbit', at:0, rx:78, ry:32.8, a:0.12, T:1008, occlude:6, ride:[[7,0.7,1]] },
          { t:'orbit', at:0, rx:92, ry:38.6, a:0.12, T:1978, occlude:6, ride:[[8,0.95,1]] },
          { t:'orbit', at:0, rx:100, ry:42, tilt:17, e:0.25, a:0.08, dash:true, T:2976, ride:[[9,0.3,1]] },
          { t:'cluster', at:0, n:24, r:38, ring:true, hue:0xcfd8ff, a:0.25 }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   sol: 'THE LONG ORBIT',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | sol | SOL (the long orbit) | boss 3 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `sol: 'THE LONG ORBIT',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast sol` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 26 / 25), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges is EMPTY here — the glint guard is why this card NEEDS SS-SKY-01).
- `SS_BEAST_T(SS_BEASTS.sol)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags named pulse parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-halley — HALLEY · THE ONCE-A-LIFETIME — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Comes round every 75 years; last seen 1986, back in July 2061, so a child playing tonight will see it. A curved cream dust tail and a straight blue ion tail, both pointing AWAY from the light.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[0].minis @243: append 'halley' (Act I mini; Wyatt confirms), or the MENU SKY's slow comet seat.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · HALLEY · THE ONCE-A-LIFETIME · opponent (mini lvl 1)
// NEEDS SS-SKY-01 (uses: mags named pulse parts) · objects 18 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
halley: {
  name: 'HALLEY', title: 'THE ONCE-A-LIFETIME', tier: 'mini', lvl: 1, tint: 0xcfe8ff, eye: 0xfff2cc,
  stars: [[-56,26],[-40,18],[-24,9],[-8,1],[8,-8],[24,-16]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5]], eyes: [[-56,26]],
  mags: [1,5,5,5,5,5],
  named: [[0,'HALLEY']],
  pulse: [[3,1.8,0.3],[4,1.8,0.2]],
  parts: [{ t:'nebula', at:0, r:8, hue:0xcfe8ff, a:0.5 },
          { t:'comet', at:0, len:96, ang:-28, bulge:0.18, w:10, hue:0xffe9c9, a:0.5 },
          { t:'comet', at:0, len:110, ang:-16, bulge:0, w:4, hue:0xa6c8ff, a:0.35 }],
  fx: { idle:'bob', atk:'swoop' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   halley: 'THE ONCE-A-LIFETIME',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | halley | HALLEY (the once-a-lifetime) | mini 1 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `halley: 'THE ONCE-A-LIFETIME',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast halley` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 18 / 18), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.halley)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags named pulse parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-pleiades — PLEIADES · THE SEVEN SISTERS — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
A hundred-million-year-old nursery of hot blue stars in a blue reflection haze; nine named sisters and six companions; Pleione, the lost sister, fades to nothing for a breath every forty seconds. Seven bolts in the volley.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the basics block @34-81) — the block below, verbatim.
- SS_QUICK_POOL @279: append 'pleiades'. No act unless Wyatt seats it.
- A quick-pool change re-deals today's DAILY for anyone who boots after the deploy — deploy at the day rollover, or seat the id in an ACT pool instead (pinned per campaign, never shifts a run).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · PLEIADES · THE SEVEN SISTERS · opponent (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags named pulse parts) · objects 27 battle / 27 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
pleiades: {
  name: 'PLEIADES', title: 'THE SEVEN SISTERS', tier: 'basic', lvl: 1, tint: 0xa6c8ff, eye: 0xe2ecff,
  stars: [[0,0],[-31,4],[-33,-7],[13,22],[20,-18],[35,4],[37,-22],[44,-11],[24,-31],[-13,-44],[-53,26],[48,40],[-4,53],[62,-40],[-44,-26]],
  edges: [[2,1],[1,0],[0,3],[3,5],[5,4],[4,0]], eyes: [[0,0]],
  mags: [1,2,4,2,2,2,3,4,4,5,5,5,5,5,5],
  named: [[0,'ALCYONE']],
  pulse: [[2,40,0]],
  parts: [{ t:'nebula', at:3, x:13, y:13, r:30, hue:0xa6c8ff, a:0.09 }],
  fx: { idle:'bob', atk:'volley', bolts:7 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   pleiades: 'THE SEVEN SISTERS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | pleiades | PLEIADES (the seven sisters) | basic 1 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `pleiades: 'THE SEVEN SISTERS',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast pleiades` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 27 / 27), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.pleiades)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-corona — CORONA · THE NORTHERN CROWN — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The sky's actual crown: seven stars in a bowl, Alphecca the Jewel as the wish-star, and T CrB, the Blaze Star, a recurrent nova due any night now, breathing red at the rim.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the basics block @34-81) — the block below, verbatim.
- SS_QUICK_POOL @279: append 'corona'. Act III is THE CROWN OF DAWN; the relic seat is Wyatt's to give.
- A quick-pool change re-deals today's DAILY for anyone who boots after the deploy — deploy at the day rollover, or seat the id in an ACT pool instead (pinned per campaign, never shifts a run).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CORONA · THE NORTHERN CROWN · opponent (basic lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named pulse) · objects 18 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
corona: {
  name: 'CORONA', title: 'THE NORTHERN CROWN', tier: 'basic', lvl: 2, tint: 0xe2ecff, eye: 0xfff2cc,
  stars: [[-58,2],[-40,-26],[-14,-42],[14,-42],[38,-30],[54,-10],[60,14],[28,20]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]], eyes: [[-14,-42]],
  mags: [4,3,1,3,4,4,5,5], hues: [0xa6c8ff,0xfff2cc,null,null,0xffdc7a,0xffb066,null,0xff6e58],
  named: [[2,'ALPHECCA']],
  pulse: [[7,30,0.15]],
  fx: { idle:'ripple', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   corona: 'THE NORTHERN CROWN',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | corona | CORONA (the northern crown) | basic 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `corona: 'THE NORTHERN CROWN',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast corona` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 18 / 18), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.corona)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse arcs parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-lyra — LYRA · THE SILVER HARP — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Vega, the old zero of the magnitude scale, as the wish-star; a small parallelogram body strung with four harp-string arcs; Sheliak dimming every 12.9 seconds; the Ring Nebula between beta and gamma. The ripple runs down the strings; the attack is a four-strand lash.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[1].minis @250: append 'lyra' (Act II mini — Wyatt's seat to confirm).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · LYRA · THE SILVER HARP · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named pulse arcs parts) · objects 18 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
lyra: {
  name: 'LYRA', title: 'THE SILVER HARP', tier: 'mini', lvl: 2, tint: 0xe2ecff, eye: 0xa6c8ff,
  stars: [[0,-44],[22,-48],[-6,-22],[20,-18],[-10,18],[18,22]],
  edges: [[0,1],[0,2],[2,3],[2,4],[3,5],[4,5]], eyes: [[0,-44]],
  mags: [1,4,3,3,3,2], hues: [null,null,null,0xff6e58,0xa6c8ff,0xa6c8ff],
  named: [[0,'VEGA']],
  pulse: [[4,12.9,0.6]],
  arcs: [[2,5,0.12,0.12],[3,4,-0.12,0.12],[2,3,0.3,0.12],[4,5,-0.3,0.12]],
  parts: [{ t:'binary', at:1, sep:4, ang:20, hue:0xe2ecff, T:0 },
          { t:'ring', at:4, x:4, y:22, rx:6, ry:5, hue:0x6fe0d0, a:0.5 },
          { t:'nebula', at:4, x:4, y:22, r:8, hue:0xff6e58, a:0.25 }],
  fx: { idle:'ripple', atk:'lash', strands:4 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   lyra: 'THE SILVER HARP',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | lyra | LYRA (the silver harp) | mini 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `lyra: 'THE SILVER HARP',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast lyra` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 18 / 18), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.lyra)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-canis — CANIS · THE GREAT DOG — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Orion's hound, forever chasing the hare: Sirius at the throat as the wish-star with the Pup circling it once every fifty seconds, Adhara and Wezen in the haunches, M41 under the throat, and VY Canis Majoris, one of the largest stars known, a ruby at the flank.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[1].minis @250: append 'canis' (Act II mini, the hound chasing LEPUS; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CANIS · THE GREAT DOG · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 23 battle / 23 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
canis: {
  name: 'CANIS', title: 'THE GREAT DOG', tier: 'mini', lvl: 2, tint: 0xcfd8ff, eye: 0xa6c8ff,
  stars: [[-10,-40],[-40,-36],[0,-58],[2,0],[10,18],[-6,44],[30,34],[-36,40],[-34,16],[42,8]],
  edges: [[0,1],[0,2],[0,3],[3,4],[4,6],[4,5],[5,7],[7,8],[8,3]], eyes: [[-4,-46]],
  mags: [1,2,4,3,2,1,2,3,4,4], hues: [0xe2ecff,0xa6c8ff,null,null,0xfff2cc,0xa6c8ff,0xa6c8ff,null,null,0xff4d6b],
  named: [[0,'SIRIUS']],
  parts: [{ t:'cluster', at:3, x:-16, y:-12, n:10, r:6, hue:0xfff2cc },
          { t:'binary', at:0, sep:6, ang:60, hue:0xb8f0ff, T:50 }],
  fx: { idle:'prowl', atk:'pounce' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   canis: 'THE GREAT DOG',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | canis | CANIS (the great dog) | mini 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `canis: 'THE GREAT DOG',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast canis` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 23 / 23), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.canis)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.

================================================================================================
NEEDS SS-SKY-01 FIRST (this record uses: mags hues steady parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-vorago — VORAGO · THE STAR THAT DRINKS — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Cygnus X-1, the first one found: a shadow the colour of the sky inside a photon ring, an accretion disc scrolling cream to ember with the left half brighter (Doppler beaming), and one arm of seven stars falling in, the last two drawn out to streaks as the tide takes them. The true owner of the blackout curse; the attack a jet.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[2].bosses @257: append 'vorago' (Act III boss, the owner of the blackout curse; Wyatt confirms). The eye sits on the photon ring's bright left side (Doppler beaming), so lash/breath/volley read the jet's root, not the shadow.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · VORAGO · THE STAR THAT DRINKS · opponent (boss lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues steady parts) · objects 23 battle / 22 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
vorago: {
  name: 'VORAGO', title: 'THE STAR THAT DRINKS', tier: 'boss', lvl: 3, tint: 0xffb066, eye: 0xfff2cc,
  stars: [[88,32],[31,76],[-31,63],[-56,16],[-39,-24],[-6,-34],[14,-18]],
  edges: [[0,1],[1,2],[2,3]], eyes: [[-14,0]],
  mags: [3,3,3,3,2,2,2], hues: [null,null,null,null,null,0xffdc7a,0xfff2cc],
  steady: [6],
  parts: [{ t:'nebula', at:6, x:0, y:0, r:22, hue:0xffdc7a, a:0.16 },
          { t:'ring', at:6, x:0, y:0, rx:34, ry:11, hue:0xffb066, a:0.36 },
          { t:'blackhole', at:6, x:0, y:0, r:12, disc:true },
          { t:'comet', at:6, len:28, ang:-142, bulge:0, w:3, hue:0xfff2cc, a:0.55 },
          { t:'comet', at:5, len:22, ang:165, bulge:0, w:2.2, hue:0xffdc7a, a:0.4 }],
  fx: { idle:'coil', atk:'breath', curse:'blackout', ink:4 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   vorago: 'THE STAR THAT DRINKS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | vorago | VORAGO (the star that drinks) | boss 3 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `vorago: 'THE STAR THAT DRINKS',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast vorago` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 23 / 22), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.vorago)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.