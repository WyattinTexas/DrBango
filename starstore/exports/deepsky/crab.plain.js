// STARSPELL sky object · CRAB NEBULA · THE HEART THAT BEATS · opponent (boss lvl 2)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 21 battle / 20 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
crab: {
  name: 'CRAB NEBULA', title: 'THE HEART THAT BEATS', tier: 'boss', lvl: 2, tint: 0xff7a9a, eye: 0xb8f0ff,
  stars: [[0,0],[31,4],[16,20],[-5,23],[-27,12],[-29,-8],[-11,-22],[11,-22],[28,-10]],
  edges: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8]], eyes: [[0,0]],
  fx: { idle:'ripple', atk:'slam', amp:1.1 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   crab: 'THE HEART THAT BEATS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | crab | CRAB NEBULA (the heart that beats) | boss 2 | store SS-STAR-01 |