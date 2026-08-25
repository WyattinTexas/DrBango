// STARSPELL sky object · NEPTUNE · THE DEEP BLUE · opponent (boss lvl 3)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 19 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
neptune: {
  name: 'NEPTUNE', title: 'THE DEEP BLUE', tier: 'boss', lvl: 3, tint: 0x4d70ff, eye: 0xa6c8ff,
  stars: [[0,0],[39,16],[-36,-76],[-30,-48],[0,-48],[30,-48],[36,-76],[0,-80]],
  edges: [[3,4],[4,5],[4,7],[4,0]], eyes: [[-5,-6]],
  fx: { idle:'ripple', atk:'charge' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   neptune: 'THE DEEP BLUE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | neptune | NEPTUNE (the deep blue) | boss 3 | store SS-STAR-01 |