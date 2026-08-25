// STARSPELL sky object · TAURUS · THE STORM-EYED BULL · opponent (an UPGRADE of the shipped record) (boss lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues pulse parts) · objects 36 battle / 35 home
// REPLACE the taurus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
taurus: {
  name: 'TAURUS', title: 'THE STORM-EYED BULL', tier: 'boss', lvl: 1, tint: 0xc4915e, eye: 0xff7a45,
  stars: [[-16,18],[-28,2],[-38,-14],[-2,2],[8,-12],[-58,-34],[-74,-52],[26,-34],[40,-56],[30,4],[58,-2],[80,10],[66,30],[70,52],[4,36],[0,58],[28,34],[30,56],[48,-24],[54,-28],[58,-22],[52,-18],[58,-30]],
  edges: [[2,1],[1,0],[0,3],[3,4],[2,5],[5,6],[4,7],[7,8],[3,9],[9,10],[10,11],[11,12],[12,13],[0,14],[14,15],[9,16],[16,17]], eyes: [[-38,-14]],
  mags: [1,4,3,5,2,1,4,3,3,2,1,4,3,5,2,1,4,3,2,3,3,4,3], hues: [null,null,0xffb066,null,null,null,0xa6c8ff,null,0xa6c8ff,null,null,null,null,null,null,null,null,null,0xa6c8ff,0xa6c8ff,0xa6c8ff,0xa6c8ff,0xa6c8ff],
  pulse: [[8,1,0.6]],
  parts: [{ t:'nebula', at:19, x:54, y:-24, r:14, hue:0xa6c8ff, a:0.08 }],
  fx: { idle:'lumber', atk:'charge' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the taurus row stays