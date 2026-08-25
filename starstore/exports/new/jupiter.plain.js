// STARSPELL sky object · JUPITER · THE KING OF WORLDS · opponent (boss lvl 2)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 21 battle / 20 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
jupiter: {
  name: 'JUPITER', title: 'THE KING OF WORLDS', tier: 'boss', lvl: 2, tint: 0xe8d5b5, eye: 0xd9604a,
  stars: [[0,0],[36,0],[-42,0],[50,0],[-62,0],[-70,-48],[74,-40],[-60,50],[68,52]],
  edges: [[5,6],[6,8],[8,7],[7,5]], eyes: [[8,9]],
  fx: { idle:'ripple', atk:'volley', bolts:4 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   jupiter: 'THE KING OF WORLDS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | jupiter | JUPITER (the king of worlds) | boss 2 | store SS-STAR-01 |