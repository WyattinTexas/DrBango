// STARSPELL sky object · ALPHA CEN · THE THREE SISTERS · opponent (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named parts idle 'orbit' attack 'fling') · objects 21 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
alphacen: {
  name: 'ALPHA CEN', title: 'THE THREE SISTERS', tier: 'basic', lvl: 1, tint: 0xffdc7a, eye: 0xffb066,
  stars: [[18,8],[34,2],[52,-58],[-30,-8],[-74,-54],[-84,6],[-58,-26],[-96,-30]],
  edges: [[0,1],[0,3],[4,5],[6,7]], eyes: [[34,2]],
  mags: [1,2,4,1,3,1,2,3], hues: [0xffdc7a,0xffb066,0xff6e58,0xa6c8ff,0xff6e58,0xa6c8ff,null,null],
  named: [[0,'RIGIL KENTAURUS']],
  parts: [{ t:'nebula', at:0, r:18, hue:0xffdc7a, a:0.16 },
          { t:'nebula', at:2, r:5, hue:0xff6e58, a:0.3 },
          { t:'orbit', at:0, x:26, y:5, rx:18, ry:11, tilt:12, e:0.5, a:0.2, T:24, ride:[[0,0.5,0.6],[1,0,1]] },
          { t:'orbit', at:0, x:38, y:-26, rx:36, ry:30, tilt:30, a:0.12, dash:true, T:0, ride:[[2,0.62,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   alphacen: 'THE THREE SISTERS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | alphacen | ALPHA CEN (the three sisters) | basic 1 | store SS-STAR-01 |