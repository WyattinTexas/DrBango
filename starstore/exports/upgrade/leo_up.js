// STARSPELL sky object · LEO · THE SOVEREIGN LION · opponent (an UPGRADE of the shipped record) (boss lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 30 battle / 29 home
// REPLACE the leo record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
leo: {
  name: 'LEO', title: 'THE SOVEREIGN LION', tier: 'boss', lvl: 1, tint: 0xffd23e, eye: 0xffb066,
  stars: [[-24,30],[-32,10],[-22,-12],[-34,-30],[-52,-36],[-64,-22],[-70,-6],[8,-14],[40,-22],[70,-10],[44,8],[-28,54],[42,34],[50,56],[8,52],[82,-24]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[0,2],[2,7],[7,8],[8,9],[9,15],[8,10],[10,0],[0,11],[10,12],[12,13],[7,14]], eyes: [[-58,-24]],
  mags: [1,3,2,3,4,2,4,4,2,3,3,5,4,5,5,2], hues: [0xa6c8ff,null,0xffdc7a,null,null,null,null,null,null,null,null,null,null,null,null,0xe2ecff],
  named: [[0,'REGULUS']],
  parts: [{ t:'binary', at:2, sep:5, ang:-35, hue:0xffb066, T:0 },
          { t:'galaxy', at:13, x:72, y:68, r:7, tilt:-25, hue:0xcfd8ff, a:0.22 }],
  fx: { idle:'prowl', atk:'pounce' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the leo row stays