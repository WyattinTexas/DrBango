// STARSPELL sky object · LYRA · THE HARP · showcase only (basic lvl 2)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 14 battle / 14 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
harp: {
  name: 'LYRA', title: 'THE HARP', tier: 'basic', lvl: 2, tint: 0xcfd8ff, eye: 0xe2ecff,
  stars: [[0,-48],[33,-54],[-9,-15],[30,-9],[-15,45],[27,51]],
  edges: [[0,1],[0,2],[2,3],[2,4],[3,5],[4,5]], eyes: [[0,-48]],
  fx: { idle:'ripple', atk:'lash', strands:4 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   harp: 'THE HARP',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | harp | LYRA (the harp) | basic 2 | store SS-STAR-01 |