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