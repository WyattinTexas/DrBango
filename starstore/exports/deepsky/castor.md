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