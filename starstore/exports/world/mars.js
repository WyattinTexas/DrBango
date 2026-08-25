// STARSPELL sky object · MARS · THE RED WANDERER · opponent (basic lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 20 battle / 20 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
mars: {
  name: 'MARS', title: 'THE RED WANDERER', tier: 'basic', lvl: 2, tint: 0xe0704a, eye: 0xffb066,
  stars: [[0,0],[27,0],[44,0],[-74,-44],[-52,-62],[-30,-50],[70,44],[84,24]],
  edges: [[3,4],[4,5],[6,7]], eyes: [[-6,-4]],
  mags: [5,5,5,2,5,4,5,5], hues: [null,0xa89f97,0xa89f97,0xff6e58,null,null,null,null],
  named: [[3,'ANTARES']],
  steady: [0,1,2],
  parts: [{ t:'planet', at:0, r:16, hue:0xe0704a, bands:[[-13,4,0xfff2cc]], spot:{ y:-3, rx:5, ry:3.5, hue:0x8f3a28 }, limb:0.15, spin:24.6 },
          { t:'orbit', at:0, rx:27, ry:8, tilt:-10, a:0.08, T:0.64, occlude:16, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:44, ry:13, tilt:-10, a:0.08, T:2.5, occlude:16, ride:[[2,0.4,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   mars: 'THE RED WANDERER',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | mars | MARS (the red wanderer) | basic 2 | store SS-STAR-01 |