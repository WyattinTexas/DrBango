// STARSPELL sky object · PLUTO · THE FAR PAIR · opponent (basic lvl 3)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 16 battle / 16 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
pluto: {
  name: 'PLUTO', title: 'THE FAR PAIR', tier: 'basic', lvl: 3, tint: 0xd9c4a8, eye: 0xfff2cc,
  stars: [[0,0],[2,10],[-70,-56],[-46,-64],[52,-60],[76,-50],[-8,72]],
  edges: [[2,3],[4,5]], eyes: [[3,3]],
  fx: { idle:'ripple', atk:'volley', bolts:3 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   pluto: 'THE FAR PAIR',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | pluto | PLUTO (the far pair) | basic 3 | store SS-STAR-01 |