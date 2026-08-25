// STARSPELL sky object · DELPHINUS · THE STARLIT DOLPHIN · opponent (an UPGRADE of the shipped record) (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 23 battle / 23 home
// REPLACE the delphinus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
delphinus: {
  name: 'DELPHINUS', title: 'THE STARLIT DOLPHIN', tier: 'basic', lvl: 1, tint: 0x9fd8e8, eye: 0xcfffff,
  stars: [[44,-52],[16,-34],[32,-8],[58,-26],[80,-44],[-4,12],[-34,30],[-64,38],[-84,20],[-80,58]],
  edges: [[0,1],[1,2],[2,3],[3,0],[3,4],[2,5],[5,6],[6,7],[7,8],[7,9]], eyes: [[48,-40]],
  mags: [2,2,3,3,4,4,3,4,5,5], hues: [0xa6c8ff,0xfff2cc,null,0xffdc7a,null,null,null,null,null,null],
  named: [[0,'SUALOCIN']],
  parts: [{ t:'binary', at:3, sep:3, ang:-30, hue:0xfff2cc, T:0 },
          { t:'ring', at:9, rx:4, ry:4, hue:0x6fe0d0, a:0.45 }],
  fx: { idle:'coil', atk:'pounce' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the delphinus row stays