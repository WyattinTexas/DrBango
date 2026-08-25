// STARSPELL sky object · CASTOR · THE SIX · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named parts idle 'orbit' attack 'fling') · objects 19 battle / 19 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
castor: {
  name: 'CASTOR', title: 'THE SIX', tier: 'mini', lvl: 2, tint: 0xe2ecff, eye: 0xa6c8ff,
  stars: [[-11,5],[11,-5],[-56,30],[62,-52],[72,46]],
  edges: [[0,1],[0,2]], eyes: [[0,0]],
  mags: [1,2,3,5,2], hues: [null,null,0xff6e58,null,0xffb066],
  named: [[0,'CASTOR']],
  parts: [{ t:'nebula', at:0, x:0, y:0, r:15, hue:0xe2ecff, a:0.12 },
          { t:'binary', at:0, sep:6, ang:20, hue:0xe2ecff, T:18.4 },
          { t:'binary', at:1, sep:6, ang:-60, hue:0xe2ecff, T:5.8 },
          { t:'binary', at:2, sep:5, ang:0, hue:0xff6e58, T:1.6 },
          { t:'orbit', at:0, x:0, y:0, rx:22, ry:14, tilt:-25, e:0.34, a:0.2, T:60, ride:[[0,0.5,0.7],[1,0,1]] },
          { t:'orbit', at:0, x:0, y:0, rx:68, ry:36, a:0.12, dash:true, T:400, ride:[[2,0.4,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   castor: 'THE SIX',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | castor | CASTOR (the six) | mini 2 | store SS-STAR-01 |