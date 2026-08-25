NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts idle 'orbit'). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-earth — EARTH · THE BLUE MARBLE — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Home: an ocean world with white weather and one green-brown continent turning once a day (24 s), ice at both poles, its axis drawn as a line up to Polaris, the still star everything else wheels round. The Moon, thirty Earths out, circles every 27 days (54.6 s) showing the same face the whole way. The eye is a hurricane over the ocean.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[1].minis @250: append 'earth' (Act II mini; Wyatt's seat to confirm; the catalog says you do not fight home, so the showcase is the alternative).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · EARTH · THE BLUE MARBLE · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit') · objects 19 battle / 19 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
earth: {
  name: 'EARTH', title: 'THE BLUE MARBLE', tier: 'mini', lvl: 2, tint: 0x6fa8dc, eye: 0xe2ecff,
  stars: [[0,0],[34,0],[0,-66],[-84,40],[-46,60],[46,60],[84,40]],
  edges: [[0,2],[3,4],[4,5],[5,6]], eyes: [[-8,7]],
  mags: [5,3,2,5,5,5,5], hues: [null,0xd9d9d9,0xfff2cc,null,null,null,null],
  named: [[2,'POLARIS']],
  steady: [0,1],
  parts: [{ t:'planet', at:0, r:21, hue:0x3a7bd5, bands:[[-20,1.8,0xe6eef8],[-7,0.7,0x8fb8e6],[20,1.8,0xe6eef8]], spot:{ y:0, rx:8, ry:7, hue:0x7a9e55 }, limb:0.1, spin:24 },
          { t:'orbit', at:0, rx:34, ry:10, tilt:-6, a:0.1, T:54.6, occlude:21, ride:[[1,0.15,1]] }],
  fx: { idle:'orbit', atk:'slam' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   earth: 'THE BLUE MARBLE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | earth | EARTH (the blue marble) | mini 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `earth: 'THE BLUE MARBLE',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast earth` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 19 / 19), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.earth)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.