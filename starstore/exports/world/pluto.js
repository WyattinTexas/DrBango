// STARSPELL sky object · PLUTO · THE FAR PAIR · opponent (basic lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 20 battle / 20 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
pluto: {
  name: 'PLUTO', title: 'THE FAR PAIR', tier: 'basic', lvl: 3, tint: 0xd9c4a8, eye: 0xfff2cc,
  stars: [[0,0],[2,10],[-70,-56],[-46,-64],[52,-60],[76,-50],[-8,72]],
  edges: [[2,3],[4,5]], eyes: [[3,3]],
  mags: [5,4,5,5,5,5,5], hues: [null,0xa89f97,null,null,null,null,null],
  named: [[1,'CHARON']],
  steady: [0,1],
  parts: [{ t:'planet', at:0, r:12, hue:0xd9c4a8, bands:[[2,4,0xb3946e]], spot:{ y:3, rx:5, ry:4.5, hue:0xf0e2cc }, limb:0.15, spin:-12.8 },
          { t:'orbit', at:0, rx:30, ry:10, tilt:-12, a:0.1, T:12.8, occlude:12, ride:[[1,0.25,1]] },
          { t:'cluster', at:0, n:18, r:66, ring:true, hue:0xcfd8ff, a:0.22 }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   pluto: 'THE FAR PAIR',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | pluto | PLUTO (the far pair) | basic 3 | store SS-STAR-01 |