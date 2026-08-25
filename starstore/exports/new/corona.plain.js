// STARSPELL sky object · CORONA · THE NORTHERN CROWN · opponent (basic lvl 2)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 17 battle / 17 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
corona: {
  name: 'CORONA', title: 'THE NORTHERN CROWN', tier: 'basic', lvl: 2, tint: 0xe2ecff, eye: 0xfff2cc,
  stars: [[-58,2],[-40,-26],[-14,-42],[14,-42],[38,-30],[54,-10],[60,14],[28,20]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]], eyes: [[-14,-42]],
  fx: { idle:'ripple', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   corona: 'THE NORTHERN CROWN',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | corona | CORONA (the northern crown) | basic 2 | store SS-STAR-01 |