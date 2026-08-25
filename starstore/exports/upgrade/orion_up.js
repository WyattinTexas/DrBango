// STARSPELL sky object · ORION · THE STARBOUND HUNTER · opponent (an UPGRADE of the shipped record) (mini lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 30 battle / 30 home
// REPLACE the orion record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
orion: {
  name: 'ORION', title: 'THE STARBOUND HUNTER', tier: 'mini', lvl: 4, tint: 0x9fc4ff, eye: 0xffb066,
  stars: [[0,-56],[-28,-34],[28,-38],[-10,2],[0,6],[10,10],[-24,48],[28,44],[4,20],[6,30],[-42,-52],[-48,-68],[-34,-74],[54,-28],[62,-10],[60,8]],
  edges: [[0,1],[0,2],[1,2],[1,3],[2,5],[3,4],[4,5],[3,6],[5,7],[4,8],[8,9],[1,10],[10,11],[11,12],[2,13],[13,14],[14,15]], eyes: [[0,-58]],
  mags: [3,1,1,2,2,2,1,1,3,4,4,5,5,4,4,5], hues: [null,0xff6e58,0xa6c8ff,0x9fb4ff,0x9fb4ff,0x9fb4ff,0xa6c8ff,0xa6c8ff,null,null,null,null,null,null,null,null],
  named: [[7,'RIGEL']],
  parts: [{ t:'nebula', at:9, r:14, hue:0xff7a9a, a:0.12 },
          { t:'nebula', at:9, r:7, hue:0x6fe0d0, a:0.14 }],
  fx: { idle:'headturn', atk:'slam' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the orion row stays