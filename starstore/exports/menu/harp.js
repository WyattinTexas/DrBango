// STARSPELL sky object · LYRA · THE HARP · showcase only (basic lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named pulse arcs parts) · objects 18 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
harp: {
  name: 'LYRA', title: 'THE HARP', tier: 'basic', lvl: 2, tint: 0xcfd8ff, eye: 0xe2ecff,
  stars: [[0,-48],[33,-54],[-9,-15],[30,-9],[-15,45],[27,51]],
  edges: [[0,1],[0,2],[2,3],[2,4],[3,5],[4,5]], eyes: [[0,-48]],
  mags: [1,4,3,3,3,2], hues: [0xe2ecff,null,null,0xff6e58,0xa6c8ff,0xa6c8ff],
  named: [[0,'VEGA']],
  pulse: [[4,12.9,0.6]],
  arcs: [[2,4,0.09,0.12],[2,4,0.18,0.09],[3,5,-0.09,0.12],[3,5,-0.18,0.09]],
  parts: [{ t:'binary', at:1, sep:3.5, ang:20, hue:0xe2ecff, T:0 },
          { t:'ring', at:4, x:6, y:51, rx:5.5, ry:4.5, hue:0x6fe0d0, a:0.55 },
          { t:'nebula', at:4, x:6, y:51, r:7, hue:0xff6e58, a:0.22 }],
  fx: { idle:'ripple', atk:'lash', strands:4 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   harp: 'THE HARP',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | harp | LYRA (the harp) | basic 2 | store SS-STAR-01 |