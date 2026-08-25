// STARSPELL sky object · THE TRIANGLE · THE THREE LANTERNS · showcase only (basic lvl 1)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 16 battle / 16 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
lanterns: {
  name: 'THE TRIANGLE', title: 'THE THREE LANTERNS', tier: 'basic', lvl: 1, tint: 0xe2ecff, eye: 0xfff2cc,
  stars: [[-42,-37],[32,-58],[5,59],[23,-42],[-9,-2],[-30,-17],[41,-22]],
  edges: [[0,1],[1,2],[2,0]], eyes: [[-42,-37]],
  fx: { idle:'ripple', atk:'volley', bolts:3 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   lanterns: 'THE THREE LANTERNS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | lanterns | THE TRIANGLE (the three lanterns) | basic 1 | store SS-STAR-01 |