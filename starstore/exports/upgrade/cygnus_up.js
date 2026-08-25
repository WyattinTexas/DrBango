// STARSPELL sky object · CYGNUS · THE CROSSWIND SWAN · opponent (an UPGRADE of the shipped record) (basic lvl 3)
// NEEDS SS-SKY-01 (uses: hues named parts) · objects 25 battle / 25 home
// REPLACE the cygnus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
cygnus: {
  name: 'CYGNUS', title: 'THE CROSSWIND SWAN', tier: 'basic', lvl: 3, tint: 0xdfe8ff, eye: 0x9fb4ff,
  stars: [[4,-58],[0,-30],[0,-4],[-2,24],[-4,48],[30,2],[58,10],[84,24],[-30,-10],[-58,-6],[-84,6]],
  edges: [[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[6,7],[2,8],[8,9],[9,10]], eyes: [[-8,50]],
  hues: [0xe2ecff,null,0xfff2cc,null,0xffdc7a,null,0xffb066,null,null,null,null],
  named: [[0,'DENEB']],
  parts: [{ t:'binary', at:4, sep:5, ang:-20, hue:0xa6c8ff, T:0 },
          { t:'nebula', at:0, x:22, y:-52, r:14, hue:0xff7a9a, a:0.05 }],
  fx: { idle:'flex', atk:'swoop' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the cygnus row stays