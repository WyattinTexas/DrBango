// STARSPELL sky object · CASTOR · THE SIX · opponent (mini lvl 2)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 13 battle / 13 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
castor: {
  name: 'CASTOR', title: 'THE SIX', tier: 'mini', lvl: 2, tint: 0xe2ecff, eye: 0xa6c8ff,
  stars: [[-11,5],[11,-5],[-56,30],[62,-52],[72,46]],
  edges: [[0,1],[0,2]], eyes: [[0,0]],
  fx: { idle:'ripple', atk:'volley', bolts:3 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   castor: 'THE SIX',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | castor | CASTOR (the six) | mini 2 | store SS-STAR-01 |