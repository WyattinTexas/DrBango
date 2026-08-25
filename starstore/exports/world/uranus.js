// STARSPELL sky object · URANUS · THE TILTED ONE · opponent (mini lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 25 battle / 25 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
uranus: {
  name: 'URANUS', title: 'THE TILTED ONE', tier: 'mini', lvl: 3, tint: 0x9fe6e0, eye: 0xe2ecff,
  stars: [[0,0],[4,26],[4,32],[6,40],[7,52],[9,61],[-86,-10],[86,10],[-54,-64],[58,-60],[-8,74]],
  edges: [[6,0],[0,7]], eyes: [[13,1]],
  mags: [5,5,5,5,4,5,5,5,5,5,5], hues: [null,0xcfd8ff,0xe2ecff,0x8a8078,0xd9c4a8,0xb5a496,null,null,null,null,null],
  named: [[4,'TITANIA']],
  steady: [0,1,2,3,4,5],
  parts: [{ t:'planet', at:0, r:18, hue:0x9fe6e0, limb:0.1, ring:{ rx:30, ry:11, tilt:82, hue:0x7fbfb8, a:0.45, gap:0.9 } },
          { t:'orbit', at:0, rx:26, ry:8, tilt:82, a:0.07, T:2.8, occlude:18, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:32, ry:10, tilt:82, a:0.07, T:5, occlude:18, ride:[[2,0.3,1]] },
          { t:'orbit', at:0, rx:40, ry:12, tilt:82, a:0.07, T:8.3, occlude:18, ride:[[3,0.55,1]] },
          { t:'orbit', at:0, rx:52, ry:16, tilt:82, a:0.07, T:17.4, occlude:18, ride:[[4,0.15,1]] },
          { t:'orbit', at:0, rx:62, ry:19, tilt:82, a:0.07, T:27.1, occlude:18, ride:[[5,0.7,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   uranus: 'THE TILTED ONE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | uranus | URANUS (the tilted one) | mini 3 | store SS-STAR-01 |