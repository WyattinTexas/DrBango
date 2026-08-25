// STARSPELL sky object · LEPUS · THE MOONLIT HARE · opponent (an UPGRADE of the shipped record) (basic lvl 2)
// NEEDS SS-SKY-01 (uses: hues named pulse) · objects 24 battle / 24 home
// REPLACE the lepus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
lepus: {
  name: 'LEPUS', title: 'THE MOONLIT HARE', tier: 'basic', lvl: 2, tint: 0xbfe8c9, eye: 0xa8ffc4,
  stars: [[-10,-64],[14,-60],[-2,-38],[8,-30],[26,-26],[0,-4],[8,18],[-28,-18],[-52,-6],[-58,16],[-36,34],[-66,-14]],
  edges: [[0,2],[1,2],[2,3],[3,4],[3,5],[5,6],[5,7],[7,8],[8,9],[9,10],[8,11]], eyes: [[12,-32]],
  hues: [null,0xff4d6b,null,null,null,0xfff2cc,null,0xffdc7a,null,null,null,null],
  named: [[5,'ARNEB']],
  pulse: [[1,6,0.3]],
  fx: { idle:'bob', atk:'pounce', hops:2 },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the lepus row stays