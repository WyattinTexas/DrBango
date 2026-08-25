// STARSPELL sky object · SATURN · THE CROWNED ONE · opponent (boss lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit') · objects 22 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
saturn: {
  name: 'SATURN', title: 'THE CROWNED ONE', tier: 'boss', lvl: 1, tint: 0xf0dcae, eye: 0xffb066,
  stars: [[0,0],[70,0],[-35,0],[-62,-40],[58,-44],[10,60],[-50,48],[66,30]],
  edges: [[3,4],[4,7],[7,5],[5,6],[6,3]], eyes: [[0,-21]],
  mags: [5,3,5,4,4,5,5,4], hues: [null,0xffb066,0xe2ecff,null,null,null,null,null],
  named: [[1,'TITAN']],
  steady: [0,1,2],
  parts: [{ t:'planet', at:0, r:25, hue:0xf0dcae, bands:[[-8,3,0xe6c88f],[4,4,0xe6c88f],[14,2,0xd9b87a]], ring:{ rx:58, ry:14, tilt:26.7, hue:0xe8d9b5, a:0.7, gap:0.88 } },
          { t:'orbit', at:0, rx:70, ry:17, tilt:26.7, a:0.1, T:32, occlude:25, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:35, ry:8.5, tilt:26.7, a:0.08, T:2.7, occlude:25, ride:[[2,0.3,1]] }],
  fx: { idle:'orbit', atk:'nova', amp:1.1 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   saturn: 'THE CROWNED ONE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | saturn | SATURN (the crowned one) | boss 1 | store SS-STAR-01 |