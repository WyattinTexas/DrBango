// STARSPELL sky object · THE MOON · THE PALE WATCHER · opponent (mini lvl 2)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 15 battle / 15 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
luna: {
  name: 'THE MOON', title: 'THE PALE WATCHER', tier: 'mini', lvl: 2, tint: 0xf7e8c8, eye: 0xfff2cc,
  stars: [[0,0],[-80,-40],[-44,-66],[0,-74],[44,-66],[80,-40]],
  edges: [[1,2],[2,3],[3,4],[4,5]], eyes: [[-4,21],[-10,-5]],
  fx: { idle:'lumber', atk:'slam' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   luna: 'THE PALE WATCHER',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | luna | THE MOON (the pale watcher) | mini 2 | store SS-STAR-01 |