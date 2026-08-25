NEEDS SS-SKY-01 FIRST (this record uses: mags hues steady parts). Do not fire this card until SS-SKY-01 is LIVE; if it must ship sooner, use MAKE A PLAIN COPY (stars/edges/eyes/fx only), which is READY TODAY.
# SS-OPP-vorago — VORAGO · THE STAR THAT DRINKS — a new STARSPELL opponent from the Star Store
lane: /Users/drbango/DrBango/beta3 · account: per the ring · effort: max · made in the Star Store 2026-08-25 by Skylar

## WHAT IT IS
Cygnus X-1, the first one found: a shadow the colour of the sky inside a photon ring, an accretion disc scrolling cream to ember with the left half brighter (Doppler beaming), and one arm of seven stars falling in, the last two drawn out to streaks as the tide takes them. The true owner of the blackout curse; the attack a jet.

## WHERE IT LIVES
- SS_BEASTS (data.js, at the end of the bosses block @150-216) — the block below, verbatim.
- SS_ACTS[2].bosses @257: append 'vorago' (Act III boss, the owner of the blackout curse; Wyatt confirms). The eye sits on the photon ring's bright left side (Doppler beaming), so lash/breath/volley read the jet's root, not the shadow.
- Paste INSIDE the SS_BEASTS literal, above the closing `};` at data.js:218 — never as an assignment after the tier loop at 221-229.
- The home showcase cycler @4155 picks it up automatically.

## THE DATA
```js
// STARSPELL sky object · VORAGO · THE STAR THAT DRINKS · opponent (boss lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues steady parts) · objects 23 battle / 22 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
vorago: {
  name: 'VORAGO', title: 'THE STAR THAT DRINKS', tier: 'boss', lvl: 3, tint: 0xffb066, eye: 0xfff2cc,
  stars: [[88,32],[31,76],[-31,63],[-56,16],[-39,-24],[-6,-34],[14,-18]],
  edges: [[0,1],[1,2],[2,3]], eyes: [[-14,0]],
  mags: [3,3,3,3,2,2,2], hues: [null,null,null,null,null,0xffdc7a,0xfff2cc],
  steady: [6],
  parts: [{ t:'nebula', at:6, x:0, y:0, r:22, hue:0xffdc7a, a:0.16 },
          { t:'ring', at:6, x:0, y:0, rx:34, ry:11, hue:0xffb066, a:0.36 },
          { t:'blackhole', at:6, x:0, y:0, r:12, disc:true },
          { t:'comet', at:6, len:28, ang:-142, bulge:0, w:3, hue:0xfff2cc, a:0.55 },
          { t:'comet', at:5, len:22, ang:165, bulge:0, w:2.2, hue:0xffdc7a, a:0.4 }],
  fx: { idle:'coil', atk:'breath', curse:'blackout', ink:4 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   vorago: 'THE STAR THAT DRINKS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | vorago | VORAGO (the star that drinks) | boss 3 | store SS-STAR-01 |
```

## REGISTER
1. strings.js beast maps x9: es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352 — `vorago: 'THE STAR THAT DRINKS',` (English placeholder in all nine unless Wyatt supplies lines; strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string falls back to title).
2. BESTIARY.md: the table row above; remove nothing.
3. Version ritual: `const BUILD` game.js:11 and `?v=` on all 11 script tags index.html:29-48 bump together (0.50.1 → next). Phaser stays cacheable.

## PROOF (all must be green before deploy)
- SS-SKY-01 creates tools/sky-check.mjs; if it is absent, write it first per tools/README.md on the crisp-check pattern, then:
- `perl -e 'alarm 580; exec @ARGV' node tools/sky-check.mjs --beast vorago` on `?rend=cv` AND `--gl`, SE/14/iPad: boots the Preview seat, `cont.list.length` <= 40 in battle and <= 30 at home (expected 23 / 22), `window.__ssBakeFail` empty, zero Runtime.exceptionThrown, one strike fires and `fx.attacking` clears within 2600 ms, no glint error over 20 s (edges non-empty here, but the guard must be present).
- `SS_BEAST_T(SS_BEASTS.vorago)` (strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string) resolves in all 10 SS_LANGS.
- the 26 shipped beasts unchanged by object counts and texture keys (the 'nothing moves' proof — by counts, never pixels; the fly-in angle @1781 is Math.random).
- Deploy: stage only the five beta3 files (beta3/data.js beta3/strings.js beta3/BESTIARY.md beta3/game.js beta3/index.html), never `git commit -a` / `add -A`, push, then `curl -s https://drbango.com/beta3/game.js | grep BUILD` (Pages can lag minutes).

## DOES NOT MOVE
No other beast, no pool other than the one named above, no fight math, no saves, no versus emblems (VS_EMBLEMS versus.js:29 stays four), no star chart or zodiac glyph code.