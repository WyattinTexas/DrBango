// STARSPELL sky object · HALLEY · THE ONCE-A-LIFETIME · opponent (mini lvl 1)
// NEEDS SS-SKY-01 (uses: mags named pulse parts) · objects 18 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
halley: {
  name: 'HALLEY', title: 'THE ONCE-A-LIFETIME', tier: 'mini', lvl: 1, tint: 0xcfe8ff, eye: 0xfff2cc,
  stars: [[-56,26],[-40,18],[-24,9],[-8,1],[8,-8],[24,-16]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5]], eyes: [[-56,26]],
  mags: [1,5,5,5,5,5],
  named: [[0,'HALLEY']],
  pulse: [[3,1.8,0.3],[4,1.8,0.2]],
  parts: [{ t:'nebula', at:0, r:8, hue:0xcfe8ff, a:0.5 },
          { t:'comet', at:0, len:96, ang:-28, bulge:0.18, w:10, hue:0xffe9c9, a:0.5 },
          { t:'comet', at:0, len:110, ang:-16, bulge:0, w:4, hue:0xa6c8ff, a:0.35 }],
  fx: { idle:'bob', atk:'swoop' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   halley: 'THE ONCE-A-LIFETIME',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | halley | HALLEY (the once-a-lifetime) | mini 1 | store SS-STAR-01 |