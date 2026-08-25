// STARSPELL sky object · EARTH · THE BLUE MARBLE · opponent (mini lvl 2)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 16 battle / 16 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
earth: {
  name: 'EARTH', title: 'THE BLUE MARBLE', tier: 'mini', lvl: 2, tint: 0x6fa8dc, eye: 0xe2ecff,
  stars: [[0,0],[34,0],[0,-66],[-84,40],[-46,60],[46,60],[84,40]],
  edges: [[0,2],[3,4],[4,5],[5,6]], eyes: [[-8,7]],
  fx: { idle:'ripple', atk:'slam' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   earth: 'THE BLUE MARBLE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | earth | EARTH (the blue marble) | mini 2 | store SS-STAR-01 |