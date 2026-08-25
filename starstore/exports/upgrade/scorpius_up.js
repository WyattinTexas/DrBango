// STARSPELL sky object · SCORPIUS · THE CRIMSON STING · opponent (an UPGRADE of the shipped record) (boss lvl 2)
// NEEDS SS-SKY-01 (uses: hues named parts) · objects 31 battle / 30 home
// REPLACE the scorpius record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
scorpius: {
  name: 'SCORPIUS', title: 'THE CRIMSON STING', tier: 'boss', lvl: 2, tint: 0xe87a6b, eye: 0xff3860,
  stars: [[-84,-38],[-66,-52],[-72,-18],[-52,-30],[-36,-22],[-20,-12],[-8,4],[-2,20],[4,36],[14,50],[30,58],[48,56],[62,46],[70,30],[64,14],[50,6]],
  edges: [[0,3],[1,3],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15]], eyes: [[-20,-12],[50,6]],
  hues: [0xa6c8ff,0xa6c8ff,0xa6c8ff,null,null,0xff6e58,null,null,null,null,null,null,null,null,null,0xa6c8ff],
  named: [[5,'ANTARES']],
  parts: [{ t:'binary', at:15, sep:4, ang:30, hue:0xa6c8ff, T:0 },
          { t:'cluster', at:5, x:-20, y:-2, n:9, r:5, hue:0xffe9c9 }],
  fx: { idle:'pinch', atk:'lash' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the scorpius row stays