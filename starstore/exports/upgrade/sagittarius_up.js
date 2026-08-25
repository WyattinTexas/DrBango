// STARSPELL sky object · SAGITTARIUS · THE ZENITH ARCHER · opponent (an UPGRADE of the shipped record) (boss lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 38 battle / 37 home
// REPLACE the sagittarius record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
sagittarius: {
  name: 'SAGITTARIUS', title: 'THE ZENITH ARCHER', tier: 'boss', lvl: 4, hp: 200, atk: 24, timer: 4, tint: 0xff9e58, eye: 0xfff0a8,
  stars: [[10,-58],[-4,-44],[26,-46],[0,-22],[20,-26],[30,-8],[16,4],[-4,0],[-10,-12],[-24,-18],[-44,-58],[-56,-38],[-48,-16],[-30,-38],[-70,-44],[44,-14],[66,-8],[80,-18],[90,-4],[2,18],[-2,40],[4,60],[62,12],[70,34],[62,58]],
  edges: [[0,1],[0,2],[1,3],[2,4],[3,4],[4,5],[5,6],[6,7],[7,8],[8,3],[8,9],[1,11],[10,11],[11,12],[13,14],[2,13],[5,15],[15,16],[16,17],[17,18],[6,19],[19,20],[20,21],[16,22],[22,23],[23,24]], eyes: [[6,-60]],
  mags: [3,3,3,3,2,3,3,4,3,4,2,2,1,4,4,3,3,4,3,4,4,5,4,4,5], hues: [null,null,null,null,0xa6c8ff,null,null,null,null,null,0xffb066,0xffb066,0xa6c8ff,null,null,null,null,null,null,null,null,null,null,null,null],
  parts: [{ t:'nebula', at:12, x:-78, y:-8, r:30, hue:0xffe9c9, a:0.32 }],
  fx: { idle:'flex', atk:'volley', amp:0.7, bolts:5 },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the sagittarius row stays