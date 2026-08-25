// STARSPELL sky object · CENTAURUS · THE FIRSTBORN CENTAUR · opponent (an UPGRADE of the shipped record) (boss lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 36 battle / 35 home
// REPLACE the centaurus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
centaurus: {
  name: 'CENTAURUS', title: 'THE FIRSTBORN CENTAUR', tier: 'boss', lvl: 4, tint: 0xc9a26b, eye: 0xffe08a,
  stars: [[-40,-62],[-54,-48],[-26,-50],[-8,-56],[12,-64],[30,-72],[-42,-30],[-24,-16],[2,-12],[28,-16],[50,-10],[68,-20],[80,-6],[-34,4],[-40,28],[-36,52],[-14,4],[-12,30],[-16,54],[44,8],[54,30],[46,54],[8,8]],
  edges: [[0,1],[0,2],[1,6],[2,6],[2,3],[3,4],[4,5],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[7,13],[13,14],[14,15],[7,16],[16,17],[17,18],[10,19],[19,20],[20,21],[16,22],[22,19]], eyes: [[-40,-64]],
  mags: [1,4,3,5,2,1,4,3,5,2,1,4,3,5,2,1,4,3,1,2,1,1,3], hues: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,0xa6c8ff,null,null,0xffdc7a,null],
  parts: [{ t:'cluster', at:22, x:0, y:-14, n:60, r:12, hue:0xfff2cc, a:0.8 }],
  fx: { idle:'lumber', atk:'charge', amp:1.2 },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the centaurus row stays