// STARSPELL sky object · ORION NEBULA · THE CRADLE · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags named parts) · objects 24 battle / 24 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
m42: {
  name: 'ORION NEBULA', title: 'THE CRADLE', tier: 'mini', lvl: 2, tint: 0xa6c8ff, eye: 0xe2ecff,
  stars: [[5,-12],[-13,-8],[-8,10],[10,12],[31,22],[-3,58],[5,-54],[-64,-56],[60,50]],
  edges: [[0,1],[1,2],[2,3],[3,0],[3,4]], eyes: [[5,-12]],
  mags: [2,3,4,3,3,2,4,5,5],
  named: [[0,'TRAPEZIUM']],
  parts: [{ t:'nebula', at:0, x:0, y:3, r:44, hue:0xff7a9a, a:0.26 },
          { t:'nebula', at:0, x:0, y:0, r:20, hue:0x6fe0d0, a:0.32 },
          { t:'nebula', at:0, x:15, y:-33, r:12, hue:0xff7a9a, a:0.16 },
          { t:'nebula', at:6, x:5, y:-56, r:13, hue:0xa6c8ff, a:0.12 }],
  fx: { idle:'ripple', atk:'breath' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   m42: 'THE CRADLE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | m42 | ORION NEBULA (the cradle) | mini 2 | store SS-STAR-01 |