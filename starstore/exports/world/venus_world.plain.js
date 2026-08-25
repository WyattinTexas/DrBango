// STARSPELL sky object · VENUS · THE VEILED ONE · opponent (mini lvl 1)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 14 battle / 14 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
venus_world: {
  name: 'VENUS', title: 'THE VEILED ONE', tier: 'mini', lvl: 1, tint: 0xfff2cc, eye: 0xffdc7a,
  stars: [[0,0],[-84,50],[-42,64],[0,70],[42,64],[84,50]],
  edges: [[1,2],[2,3],[3,4],[4,5]], eyes: [[0,17]],
  fx: { idle:'lumber', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   venus_world: 'THE VEILED ONE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | venus_world | VENUS (the veiled one) | mini 1 | store SS-STAR-01 |