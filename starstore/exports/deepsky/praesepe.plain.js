// STARSPELL sky object · PRAESEPE · THE SWARM · opponent (basic lvl 1)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 19 battle / 19 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
praesepe: {
  name: 'PRAESEPE', title: 'THE SWARM', tier: 'basic', lvl: 1, tint: 0xfff2cc, eye: 0xffdc7a,
  stars: [[2,-3],[28,1],[10,-25],[-16,-20],[-26,7],[-10,26],[17,21],[8,-62],[38,40]],
  edges: [[1,2],[2,3],[3,4],[4,5],[5,6],[6,1]], eyes: [[2,-3]],
  fx: { idle:'ripple', atk:'volley', bolts:6 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   praesepe: 'THE SWARM',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | praesepe | PRAESEPE (the swarm) | basic 1 | store SS-STAR-01 |