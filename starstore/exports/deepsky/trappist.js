// STARSPELL sky object · TRAPPIST-1 · THE SEVEN HEARTHS · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 26 battle / 26 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
trappist: {
  name: 'TRAPPIST-1', title: 'THE SEVEN HEARTHS', tier: 'mini', lvl: 2, tint: 0xff6e58, eye: 0xff6e58,
  stars: [[0,0],[12,0],[11,7],[-5,12],[-24,6],[-30,-8],[-9,-20],[28,-19],[-74,-52],[68,-46],[-62,48],[76,40]],
  edges: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7]], eyes: [[0,0]],
  mags: [1,3,3,3,3,3,3,3,5,4,5,4], hues: [null,0xd9c4a8,0xc9b8a8,0xe0d0b8,0x7fb8e8,0x7fb8e8,0x7fb8e8,0xa89f97,null,null,null,null],
  named: [[0,'TRAPPIST-1']],
  steady: [1,2,3,4,5,6,7],
  parts: [{ t:'nebula', at:0, r:12, hue:0xff6e58, a:0.2 },
          { t:'orbit', at:0, rx:12, ry:6.6, a:0.1, T:1.51, occlude:3, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:17, ry:9.35, a:0.1, T:2.42, occlude:3, ride:[[2,0.14,1]] },
          { t:'orbit', at:0, rx:22, ry:12.1, a:0.1, T:4.05, occlude:3, ride:[[3,0.29,1]] },
          { t:'orbit', at:0, rx:27, ry:14.85, a:0.1, T:6.1, occlude:3, ride:[[4,0.43,1]] },
          { t:'orbit', at:0, rx:33, ry:18.15, a:0.1, T:9.21, occlude:3, ride:[[5,0.57,1]] },
          { t:'orbit', at:0, rx:38, ry:20.9, a:0.1, T:12.35, occlude:3, ride:[[6,0.71,1]] },
          { t:'orbit', at:0, rx:44, ry:24.2, a:0.1, T:18.77, occlude:3, ride:[[7,0.86,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   trappist: 'THE SEVEN HEARTHS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | trappist | TRAPPIST-1 (the seven hearths) | mini 2 | store SS-STAR-01 |