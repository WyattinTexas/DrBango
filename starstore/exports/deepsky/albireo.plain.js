// STARSPELL sky object · ALBIREO · THE TWO-COLOURED · opponent (basic lvl 1)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 17 battle / 17 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
albireo: {
  name: 'ALBIREO', title: 'THE TWO-COLOURED', tier: 'basic', lvl: 1, tint: 0xe2ecff, eye: 0xa6c8ff,
  stars: [[-20,4],[20,-4],[-70,-48],[58,46],[-52,60],[74,-36],[22,-66],[-84,18]],
  edges: [[0,1]], eyes: [[20,-4]],
  fx: { idle:'ripple', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   albireo: 'THE TWO-COLOURED',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | albireo | ALBIREO (the two-coloured) | basic 1 | store SS-STAR-01 |