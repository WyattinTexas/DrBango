// STARSPELL sky object · STRIX · THE VOID OWL · opponent (an UPGRADE of the shipped record) (boss lvl 1)
// NEEDS SS-SKY-01 (uses: mags parts) · objects 35 battle / 34 home
// REPLACE the strix record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
strix: {
  name: 'STRIX', title: 'THE VOID OWL', tier: 'boss', lvl: 1, hp: 85, atk: 14, timer: 3, tint: 0x9fb4ff, eye: 0xffe08a,
  stars: [[0,-50],[28,-40],[40,-12],[28,16],[0,26],[-28,16],[-40,-12],[-28,-40],[-38,-58],[38,-58],[0,4],[-8,14],[8,14],[-52,0],[-72,22],[-58,40],[52,0],[72,22],[58,40],[-14,52],[14,52]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[7,8],[1,9],[10,11],[10,12],[6,13],[13,14],[14,15],[2,16],[16,17],[17,18],[4,19],[4,20]], eyes: [[-14,-18],[14,-18]],
  mags: [2,3,2,3,2,3,2,3,3,3,3,4,4,3,4,4,3,4,4,4,4],
  parts: [{ t:'blackhole', at:10, r:4, disc:true }],
  fx: { idle:'headturn', atk:'swoop', curse:'blackout' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the strix row stays