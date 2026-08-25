// STARSPELL sky object · SUPERNOVA · THE LAST LIGHT · opponent (boss lvl 3)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 25 battle / 24 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
supernova: {
  name: 'SUPERNOVA', title: 'THE LAST LIGHT', tier: 'boss', lvl: 3, tint: 0xe2ecff, eye: 0xb8f0ff,
  stars: [[0,0],[44,-30],[56,8],[30,44],[-12,54],[-48,32],[-56,-14],[-30,-46],[8,-56],[17,-17],[17,17],[-17,17],[-17,-17]],
  edges: [[0,9],[0,10],[0,11],[0,12]], eyes: [[0,0]],
  fx: { idle:'ripple', atk:'nova', amp:1.5 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   supernova: 'THE LAST LIGHT',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | supernova | SUPERNOVA (the last light) | boss 3 | store SS-STAR-01 |