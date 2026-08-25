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