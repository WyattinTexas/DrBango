NEEDS SS-SKY-01 FIRST (this record uses: mags hues named steady parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-andromeda — ANDROMEDA · THE SISTER GALAXY — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Two and a half million light-years off and six full Moons wide, the farthest thing a bare eye can see, found by hopping Mirach to mu to nu; its two small companions M32 and M110 cling to the disc, and it is coming at us, due in four billion years. The eye is the core.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[3].bosses @263: append 'andromeda' (Act IV boss, the farthest thing an eye can see; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · ANDROMEDA · THE SISTER GALAXY · opponent (boss lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts) · objects 20 battle / 19 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
andromeda: {
  name: 'ANDROMEDA', title: 'THE SISTER GALAXY', tier: 'boss', lvl: 4, tint: 0xcfd8ff, eye: 0xfff2cc,
  stars: [[-8,-4],[14,22],[22,42],[40,66],[-72,40],[64,-56]],
  edges: [[3,2],[2,1],[1,0]], eyes: [[-8,-4]],
  mags: [3,3,3,1,5,5], hues: [0xfff2cc,0xa6c8ff,null,0xff6e58,null,null],
  named: [[3,'MIRACH']],
  steady: [0],
  parts: [{ t:'galaxy', at:0, x:-8, y:-4, r:34, tilt:-32, hue:0xcfd8ff, a:0.2 },
          { t:'galaxy', at:0, x:-2, y:14, r:4, tilt:40, hue:0xcfd8ff, a:0.14 },
          { t:'galaxy', at:0, x:-30, y:-26, r:6, tilt:-10, hue:0xcfd8ff, a:0.12 }],
  fx: { idle:'lumber', atk:'charge' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   andromeda: 'THE SISTER GALAXY',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | andromeda | ANDROMEDA (the sister galaxy) | boss 4 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `andromeda: 'THE SISTER GALAXY',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast andromeda` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 20 / 19), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.andromeda)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.