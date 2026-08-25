// STARSPELL sky object · DRACO · THE STAR EATER · opponent (an UPGRADE of the shipped record) (boss lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 35 battle / 34 home
// REPLACE the draco record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
draco: {
  name: 'DRACO', title: 'THE STAR EATER', tier: 'boss', lvl: 2, hp: 130, atk: 18, timer: 4, tint: 0xffc46b, eye: 0xff5e4d,
  stars: [[-92,42],[-72,28],[-52,36],[-32,22],[-12,28],[8,14],[2,-8],[-16,-36],[6,-54],[20,-32],[42,-46],[30,2],[46,-12],[58,-30],[50,-48],[70,-44],[78,-18],[62,-6],[24,30],[18,48],[44,26],[48,44]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[6,9],[9,10],[5,11],[11,12],[12,13],[13,14],[13,15],[13,16],[16,17],[11,18],[18,19],[11,20],[20,21]], eyes: [[56,-26]],
  mags: [4,3,4,3,4,3,3,4,4,4,4,3,3,1,4,2,3,4,4,5,4,5], hues: [null,null,null,0xe2ecff,null,null,null,null,null,null,null,null,null,0xffb066,null,0xffdc7a,null,null,null,null,null,null],
  parts: [{ t:'ring', at:11, rx:6, ry:5, hue:0x6fe0d0, a:0.55 }],
  fx: { idle:'flex', atk:'breath', curse:'blackout', ink:3 },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the draco row stays