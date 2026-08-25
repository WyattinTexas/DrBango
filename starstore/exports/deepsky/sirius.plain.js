// STARSPELL sky object · SIRIUS · THE DOG STAR · opponent (basic lvl 1)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 17 battle / 17 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
sirius: {
  name: 'SIRIUS', title: 'THE DOG STAR', tier: 'basic', lvl: 1, tint: 0xe2ecff, eye: 0xe2ecff,
  stars: [[8,4],[-34,-14],[-64,32],[-74,64],[58,-54],[74,32],[-28,68],[42,62]],
  edges: [[0,1]], eyes: [[8,4]],
  fx: { idle:'prowl', atk:'pounce' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   sirius: 'THE DOG STAR',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | sirius | SIRIUS (the dog star) | basic 1 | store SS-STAR-01 |