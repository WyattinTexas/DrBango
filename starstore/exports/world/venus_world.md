NEEDS SS-SKY-01 FIRST (this record uses: mags named steady parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-venus_world — VENUS · THE VEILED ONE — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The brightest thing in the night after the Moon, wrapped in a veil of sulphur cloud so thick no one saw its ground until radar did; it never twinkles, and its clouds race round in four days while the ground beneath takes 243. The attack is the veil flashing white. The eye is the south polar vortex, a storm with two eyes of its own.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[0].minis @243: append 'venus_world' (Act I mini; Wyatt confirms). 'venus' is the MENU SKY's point decor; this is the world.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · VENUS · THE VEILED ONE · opponent (mini lvl 1)
// NEEDS SS-SKY-01 (uses: mags named steady parts) · objects 17 battle / 17 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
venus_world: {
  name: 'VENUS', title: 'THE VEILED ONE', tier: 'mini', lvl: 1, tint: 0xfff2cc, eye: 0xffdc7a,
  stars: [[0,0],[-84,50],[-42,64],[0,70],[42,64],[84,50]],
  edges: [[1,2],[2,3],[3,4],[4,5]], eyes: [[0,17]],
  mags: [5,5,4,5,4,5],
  named: [[0,'VENUS']],
  steady: [0],
  parts: [{ t:'nebula', at:0, r:44, hue:0xfff2cc, a:0.42 },
          { t:'planet', at:0, r:21, hue:0xfff2cc, bands:[[-9,3,0xf2dfae],[3,4,0xf2dfae],[13,2,0xe8d09a]], limb:0.08 }],
  fx: { idle:'lumber', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   venus_world: 'THE VEILED ONE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | venus_world | VENUS (the veiled one) | mini 1 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `venus_world: 'THE VEILED ONE',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast venus_world` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 17 / 17), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.venus_world)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.