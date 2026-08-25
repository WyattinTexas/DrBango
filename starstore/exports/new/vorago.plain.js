// STARSPELL sky object · VORAGO · THE STAR THAT DRINKS · opponent (boss lvl 3)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 18 battle / 17 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
vorago: {
  name: 'VORAGO', title: 'THE STAR THAT DRINKS', tier: 'boss', lvl: 3, tint: 0xffb066, eye: 0xfff2cc,
  stars: [[88,32],[31,76],[-31,63],[-56,16],[-39,-24],[-6,-34],[14,-18]],
  edges: [[0,1],[1,2],[2,3]], eyes: [[-14,0]],
  fx: { idle:'coil', atk:'breath', curse:'blackout', ink:4 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   vorago: 'THE STAR THAT DRINKS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | vorago | VORAGO (the star that drinks) | boss 3 | store SS-STAR-01 |