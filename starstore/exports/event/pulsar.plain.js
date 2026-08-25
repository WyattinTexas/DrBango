// STARSPELL sky object · PULSAR · THE LIGHTHOUSE · opponent (mini lvl 3)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 16 battle / 16 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
pulsar: {
  name: 'PULSAR', title: 'THE LIGHTHOUSE', tier: 'mini', lvl: 3, tint: 0xa6c8ff, eye: 0xb8f0ff,
  stars: [[0,0],[12,-8],[-12,8],[-72,-44],[70,40],[-46,56],[56,-58]],
  edges: [[1,0],[0,2]], eyes: [[0,0]],
  fx: { idle:'ripple', atk:'volley', bolts:3 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   pulsar: 'THE LIGHTHOUSE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | pulsar | PULSAR (the lighthouse) | mini 3 | store SS-STAR-01 |