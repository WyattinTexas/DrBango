NEEDS SS-SKY-01 FIRST (this record uses: mags hues named pulse). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-crown — CORONA · THE NORTHERN CROWN — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
The sky's real crown: seven stars in a bowl, opening downward as it does over the north in spring. Alphecca, the gem, is the white wish-star and the eye, dipping every seventeen seconds because it is two stars eclipsing. Inside the rim T Coronae, the Blaze Star, breathes red on a thirty-second swell; one night soon it goes off for real.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the basics block @34-81) — the block below, verbatim.
- MENU SKY showcase list (Home.buildMeadowUi @4153-4166): append 'crown'; never SS_ACTS unless Wyatt seats it.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CORONA · THE NORTHERN CROWN · showcase only (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named pulse) · objects 18 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
crown: {
  name: 'CORONA', title: 'THE NORTHERN CROWN', tier: 'basic', lvl: 1, tint: 0xe2ecff, eye: 0xfff2cc,
  stars: [[-72,14],[-50,-20],[-18,-40],[18,-40],[48,-26],[68,0],[75,30],[35,37]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]], eyes: [[-18,-40]],
  mags: [4,3,1,3,4,4,5,3], hues: [0xa6c8ff,0xfff2cc,null,null,null,0xffb066,null,0xff6e58],
  named: [[2,'ALPHECCA']],
  pulse: [[2,17.4,0.85],[7,30,0.15]],
  fx: { idle:'ripple', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   crown: 'THE NORTHERN CROWN',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | crown | CORONA (the northern crown) | basic 1 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `crown: 'THE NORTHERN CROWN',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast crown` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 18 / 18), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.crown)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.