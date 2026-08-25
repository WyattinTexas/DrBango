// STARSPELL sky object · TRAPPIST-1 · THE SEVEN HEARTHS · opponent (mini lvl 2)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 23 battle / 23 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
trappist: {
  name: 'TRAPPIST-1', title: 'THE SEVEN HEARTHS', tier: 'mini', lvl: 2, tint: 0xff6e58, eye: 0xff6e58,
  stars: [[0,0],[12,0],[11,7],[-5,12],[-24,6],[-30,-8],[-9,-20],[28,-19],[-74,-52],[68,-46],[-62,48],[76,40]],
  edges: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7]], eyes: [[0,0]],
  fx: { idle:'ripple', atk:'volley', bolts:7 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   trappist: 'THE SEVEN HEARTHS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | trappist | TRAPPIST-1 (the seven hearths) | mini 2 | store SS-STAR-01 |