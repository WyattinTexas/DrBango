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