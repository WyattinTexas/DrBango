// STARSPELL sky object · ECLIPSE · THE DARK SUN · opponent (boss lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 29 battle / 28 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
eclipse: {
  name: 'ECLIPSE', title: 'THE DARK SUN', tier: 'boss', lvl: 2, tint: 0xffdc7a, eye: 0xfff2cc,
  stars: [[27,-27],[6,-30],[14,-27],[26,-15],[30,-4],[30,6],[-78,-50],[70,52],[-62,40]],
  edges: [[1,2],[2,0],[0,3],[3,4],[4,5]], eyes: [[27,-27]],
  mags: [1,3,3,3,3,3,5,5,5], hues: [0xfff2cc,null,null,null,null,null,0xe2ecff,0xe2ecff,0xe2ecff],
  named: [[0,'THE DIAMOND RING']],
  parts: [{ t:'nebula', at:0, x:0, y:0, r:56, hue:0xfff2cc, a:0.1 },
          { t:'ring', at:0, x:0, y:0, rx:42, ry:42, hue:0xffdc7a, a:0.3 },
          { t:'blackhole', at:0, x:0, y:0, r:30 },
          { t:'comet', at:0, x:37, y:0, len:44, ang:4, bulge:0, w:7, hue:0xfff2cc, a:0.12 },
          { t:'comet', at:0, x:-37, y:0, len:44, ang:184, bulge:0, w:7, hue:0xfff2cc, a:0.12 },
          { t:'comet', at:0, x:0, y:-37, len:20, ang:-90, bulge:0, w:4, hue:0xfff2cc, a:0.08 },
          { t:'comet', at:0, x:0, y:37, len:20, ang:90, bulge:0, w:4, hue:0xfff2cc, a:0.08 }],
  fx: { idle:'lumber', atk:'breath' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   eclipse: 'THE DARK SUN',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | eclipse | ECLIPSE (the dark sun) | boss 2 | store SS-STAR-01 |