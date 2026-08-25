// STARSPELL sky object · MARS · THE RED WANDERER · opponent (basic lvl 2)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 17 battle / 17 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
mars: {
  name: 'MARS', title: 'THE RED WANDERER', tier: 'basic', lvl: 2, tint: 0xe0704a, eye: 0xffb066,
  stars: [[0,0],[27,0],[44,0],[-74,-44],[-52,-62],[-30,-50],[70,44],[84,24]],
  edges: [[3,4],[4,5],[6,7]], eyes: [[-6,-4]],
  fx: { idle:'ripple', atk:'volley', bolts:3 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   mars: 'THE RED WANDERER',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | mars | MARS (the red wanderer) | basic 2 | store SS-STAR-01 |