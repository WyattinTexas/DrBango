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