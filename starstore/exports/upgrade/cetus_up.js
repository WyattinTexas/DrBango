// STARSPELL sky object · CETUS · THE DROWNED LEVIATHAN · opponent (an UPGRADE of the shipped record) (mini lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues named pulse parts) · objects 27 battle / 27 home
// REPLACE the cetus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
cetus: {
  name: 'CETUS', title: 'THE DROWNED LEVIATHAN', tier: 'mini', lvl: 4, tint: 0x6b9fe0, eye: 0x9ffcee,
  stars: [[52,-44],[76,-32],[82,-8],[66,10],[46,-2],[42,-26],[58,22],[28,14],[4,26],[-22,30],[-46,20],[-62,2],[-80,16],[-90,0],[-88,36]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[3,6],[4,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[12,14]], eyes: [[60,-30]],
  mags: [3,2,3,3,3,4,4,1,4,3,4,3,3,1,4], hues: [null,0xff6e58,null,null,null,null,null,0xff6e58,null,null,null,null,null,0xffb066,null],
  named: [[7,'MIRA']],
  pulse: [[7,33,0.15]],
  parts: [{ t:'nebula', at:7, r:11, hue:0xff6e58, a:0.2 }],
  fx: { idle:'coil', atk:'breath' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the cetus row stays