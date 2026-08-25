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