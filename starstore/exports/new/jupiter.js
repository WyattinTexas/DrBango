// STARSPELL sky object · JUPITER · THE KING OF WORLDS · opponent (boss lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 24 battle / 23 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
jupiter: {
  name: 'JUPITER', title: 'THE KING OF WORLDS', tier: 'boss', lvl: 2, tint: 0xe8d5b5, eye: 0xd9604a,
  stars: [[0,0],[36,0],[-42,0],[50,0],[-62,0],[-70,-48],[74,-40],[-60,50],[68,52]],
  edges: [[5,6],[6,8],[8,7],[7,5]], eyes: [[8,9]],
  mags: [5,4,4,3,4,4,4,5,5], hues: [null,0xffe08a,0xe2ecff,0xc9b8a8,0x8a8078,null,null,null,null],
  named: [[3,'GANYMEDE']],
  steady: [0,1,2,3,4],
  parts: [{ t:'planet', at:0, r:30, hue:0xe8d5b5, bands:[[-22,4,0xc69c6d],[-10,3,0xc69c6d],[4,5,0xb07a56],[16,3,0xc69c6d]], spot:{ x:8, y:9, rx:6, ry:3.6, hue:0xd9604a }, limb:0.12, spin:10 },
          { t:'orbit', at:0, rx:36, ry:2, a:0, T:3.5, occlude:30, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:42, ry:2, a:0, T:7.1, occlude:30, ride:[[2,0.25,1]] },
          { t:'orbit', at:0, rx:50, ry:2, a:0, T:14.3, occlude:30, ride:[[3,0.5,1]] },
          { t:'orbit', at:0, rx:62, ry:2, a:0, T:33.4, occlude:30, ride:[[4,0.75,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   jupiter: 'THE KING OF WORLDS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | jupiter | JUPITER (the king of worlds) | boss 2 | store SS-STAR-01 |