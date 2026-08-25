NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-crab — CRAB NEBULA · THE HEART THAT BEATS — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The wreck of a star seen exploding in 1054, bright enough to read by in daylight for three weeks; the rose shell and its orange filaments still fly outward, and at the centre a neutron star spins thirty times a second, compressed here to a two-a-second heartbeat. The eye IS the pulsar.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[1].bosses @251: append 'crab' (Act II boss, the wreck of the star of 1054; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CRAB NEBULA · THE HEART THAT BEATS · opponent (boss lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named pulse parts) · objects 25 battle / 24 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
crab: {
  name: 'CRAB NEBULA', title: 'THE HEART THAT BEATS', tier: 'boss', lvl: 2, tint: 0xff7a9a, eye: 0xb8f0ff,
  stars: [[0,0],[31,4],[16,20],[-5,23],[-27,12],[-29,-8],[-11,-22],[11,-22],[28,-10]],
  edges: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8]], eyes: [[0,0]],
  mags: [2,5,4,5,4,5,4,5,4], hues: [0xb8f0ff,0xffb066,null,0xffb066,null,0xffb066,null,0xffb066,null],
  named: [[0,'THE PULSAR']],
  pulse: [[0,0.5,0.2]],
  parts: [{ t:'nebula', at:0, r:32, hue:0xff7a9a, a:0.38 },
          { t:'nebula', at:0, r:13, hue:0xa6c8ff, a:0.4 },
          { t:'ring', at:0, rx:27, ry:21, hue:0xffb066, a:0.4 }],
  fx: { idle:'ripple', atk:'slam', amp:1.1 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   crab: 'THE HEART THAT BEATS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | crab | CRAB NEBULA (the heart that beats) | boss 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `crab: 'THE HEART THAT BEATS',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast crab` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 25 / 24), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.crab)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.