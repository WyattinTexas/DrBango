// STARSPELL sky object · SATURN · THE CROWNED ONE · opponent (boss lvl 1)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 19 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
saturn: {
  name: 'SATURN', title: 'THE CROWNED ONE', tier: 'boss', lvl: 1, tint: 0xf0dcae, eye: 0xffb066,
  stars: [[0,0],[70,0],[-35,0],[-62,-40],[58,-44],[10,60],[-50,48],[66,30]],
  edges: [[3,4],[4,7],[7,5],[5,6],[6,3]], eyes: [[0,-21]],
  fx: { idle:'ripple', atk:'nova', amp:1.1 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   saturn: 'THE CROWNED ONE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | saturn | SATURN (the crowned one) | boss 1 | store SS-STAR-01 |