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