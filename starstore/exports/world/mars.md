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