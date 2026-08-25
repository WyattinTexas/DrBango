// STARSPELL sky object · PLEIADES · THE SEVEN SISTERS · opponent (basic lvl 1)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 25 battle / 25 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
pleiades: {
  name: 'PLEIADES', title: 'THE SEVEN SISTERS', tier: 'basic', lvl: 1, tint: 0xa6c8ff, eye: 0xe2ecff,
  stars: [[0,0],[-31,4],[-33,-7],[13,22],[20,-18],[35,4],[37,-22],[44,-11],[24,-31],[-13,-44],[-53,26],[48,40],[-4,53],[62,-40],[-44,-26]],
  edges: [[2,1],[1,0],[0,3],[3,5],[5,4],[4,0]], eyes: [[0,0]],
  fx: { idle:'bob', atk:'volley', bolts:7 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   pleiades: 'THE SEVEN SISTERS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | pleiades | PLEIADES (the seven sisters) | basic 1 | store SS-STAR-01 |