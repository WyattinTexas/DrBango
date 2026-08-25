NEEDS SS-SKY-01 FIRST (this record uses: mags hues named parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-canis — CANIS · THE GREAT DOG — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Orion's hound, forever chasing the hare: Sirius at the throat as the wish-star with the Pup circling it once every fifty seconds, Adhara and Wezen in the haunches, M41 under the throat, and VY Canis Majoris, one of the largest stars known, a ruby at the flank.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the minibosses block @82-149) — the block below, verbatim.
- SS_ACTS[1].minis @250: append 'canis' (Act II mini, the hound chasing LEPUS; Wyatt confirms).
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · CANIS · THE GREAT DOG · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 23 battle / 23 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
canis: {
  name: 'CANIS', title: 'THE GREAT DOG', tier: 'mini', lvl: 2, tint: 0xcfd8ff, eye: 0xa6c8ff,
  stars: [[-10,-40],[-40,-36],[0,-58],[2,0],[10,18],[-6,44],[30,34],[-36,40],[-34,16],[42,8]],
  edges: [[0,1],[0,2],[0,3],[3,4],[4,6],[4,5],[5,7],[7,8],[8,3]], eyes: [[-4,-46]],
  mags: [1,2,4,3,2,1,2,3,4,4], hues: [0xe2ecff,0xa6c8ff,null,null,0xfff2cc,0xa6c8ff,0xa6c8ff,null,null,0xff4d6b],
  named: [[0,'SIRIUS']],
  parts: [{ t:'cluster', at:3, x:-16, y:-12, n:10, r:6, hue:0xfff2cc },
          { t:'binary', at:0, sep:6, ang:60, hue:0xb8f0ff, T:50 }],
  fx: { idle:'prowl', atk:'pounce' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   canis: 'THE GREAT DOG',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | canis | CANIS (the great dog) | mini 2 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `canis: 'THE GREAT DOG',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast canis` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 23 / 23), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.canis)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.