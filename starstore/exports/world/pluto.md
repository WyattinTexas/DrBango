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