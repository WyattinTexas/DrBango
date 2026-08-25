// STARSPELL sky object · EARTH · THE BLUE MARBLE · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit') · objects 19 battle / 19 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
earth: {
  name: 'EARTH', title: 'THE BLUE MARBLE', tier: 'mini', lvl: 2, tint: 0x6fa8dc, eye: 0xe2ecff,
  stars: [[0,0],[34,0],[0,-66],[-84,40],[-46,60],[46,60],[84,40]],
  edges: [[0,2],[3,4],[4,5],[5,6]], eyes: [[-8,7]],
  mags: [5,3,2,5,5,5,5], hues: [null,0xd9d9d9,0xfff2cc,null,null,null,null],
  named: [[2,'POLARIS']],
  steady: [0,1],
  parts: [{ t:'planet', at:0, r:21, hue:0x3a7bd5, bands:[[-20,1.8,0xe6eef8],[-7,0.7,0x8fb8e6],[20,1.8,0xe6eef8]], spot:{ y:0, rx:8, ry:7, hue:0x7a9e55 }, limb:0.1, spin:24 },
          { t:'orbit', at:0, rx:34, ry:10, tilt:-6, a:0.1, T:54.6, occlude:21, ride:[[1,0.15,1]] }],
  fx: { idle:'orbit', atk:'slam' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   earth: 'THE BLUE MARBLE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | earth | EARTH (the blue marble) | mini 2 | store SS-STAR-01 |