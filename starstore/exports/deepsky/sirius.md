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