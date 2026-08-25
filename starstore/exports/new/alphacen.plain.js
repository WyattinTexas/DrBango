// STARSPELL sky object · ALPHA CEN · THE THREE SISTERS · opponent (basic lvl 1)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 17 battle / 17 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
alphacen: {
  name: 'ALPHA CEN', title: 'THE THREE SISTERS', tier: 'basic', lvl: 1, tint: 0xffdc7a, eye: 0xffb066,
  stars: [[18,8],[34,2],[52,-58],[-30,-8],[-74,-54],[-84,6],[-58,-26],[-96,-30]],
  edges: [[0,1],[0,3],[4,5],[6,7]], eyes: [[34,2]],
  fx: { idle:'ripple', atk:'volley', bolts:3 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   alphacen: 'THE THREE SISTERS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | alphacen | ALPHA CEN (the three sisters) | basic 1 | store SS-STAR-01 |