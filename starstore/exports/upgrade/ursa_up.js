// STARSPELL sky object · URSA · THE WINTER BEAR · opponent (an UPGRADE of the shipped record) (mini lvl 2)
// NEEDS SS-SKY-01 (uses: hues named parts) · objects 28 battle / 28 home
// REPLACE the ursa record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
ursa: {
  name: 'URSA', title: 'THE WINTER BEAR', tier: 'mini', lvl: 2, hp: 76, atk: 14, timer: 3, tint: 0xd6a86b, eye: 0xffd23e,
  stars: [[58,-6],[44,-20],[38,-32],[16,-30],[-8,-38],[-38,-28],[-56,-10],[-48,14],[-42,34],[-8,8],[22,12],[26,34],[48,6]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[6,9],[9,10],[10,11],[0,12],[12,9]], eyes: [[46,-16]],
  hues: [null,0xffb066,null,null,null,null,null,0xe2ecff,0xa6c8ff,null,null,null,null],
  named: [[1,'DUBHE']],
  parts: [{ t:'binary', at:7, sep:5, ang:-40, hue:0xfff2cc, T:0 },
          { t:'galaxy', at:8, x:-56, y:48, r:8, tilt:20, hue:0xcfd8ff, a:0.08 }],
  fx: { idle:'lumber', atk:'slam' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the ursa row stays