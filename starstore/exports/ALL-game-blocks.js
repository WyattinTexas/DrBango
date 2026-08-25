// THE STAR STORE — every example's game block (64). Each pastes INSIDE the SS_BEASTS literal (data.js) — see the matching .md card.

// ------------------------------------------------------------------------------------------
// STARSPELL sky object · VULPES · THE EMBER FOX · opponent (an UPGRADE of the shipped record) (basic lvl 1)
// NEEDS SS-SKY-01 (uses: named parts) · objects 30 battle / 30 home
// REPLACE the vulpes record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
vulpes: {
  name: 'VULPES', title: 'THE EMBER FOX', tier: 'basic', lvl: 1, tint: 0xffb066, eye: 0xffd23e,
  stars: [[-78,18],[-58,2],[-38,10],[-20,-2],[2,-10],[20,-14],[38,-24],[34,-44],[56,-40],[54,-22],[64,-14],[46,-6],[26,16],[30,34],[-8,16],[-6,34]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,6],[5,12],[12,13],[3,14],[14,15]], eyes: [[46,-22]],
  named: [[6,'ANSER']],
  parts: [{ t:'nebula', at:3, x:-36, y:-24, r:11, hue:0x6fe0d0, a:0.07, twin:16 }],
  fx: { idle:'prowl', atk:'pounce' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the vulpes row stays
// ------------------------------------------------------------------------------------------
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
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · CYGNUS · THE CROSSWIND SWAN · opponent (an UPGRADE of the shipped record) (basic lvl 3)
// NEEDS SS-SKY-01 (uses: hues named parts) · objects 25 battle / 25 home
// REPLACE the cygnus record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
cygnus: {
  name: 'CYGNUS', title: 'THE CROSSWIND SWAN', tier: 'basic', lvl: 3, tint: 0xdfe8ff, eye: 0x9fb4ff,
  stars: [[4,-58],[0,-30],[0,-4],[-2,24],[-4,48],[30,2],[58,10],[84,24],[-30,-10],[-58,-6],[-84,6]],
  edges: [[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[6,7],[2,8],[8,9],[9,10]], eyes: [[-8,50]],
  hues: [0xe2ecff,null,0xfff2cc,null,0xffdc7a,null,0xffb066,null,null,null,null],
  named: [[0,'DENEB']],
  parts: [{ t:'binary', at:4, sep:5, ang:-20, hue:0xa6c8ff, T:0 },
          { t:'nebula', at:0, x:22, y:-52, r:14, hue:0xff7a9a, a:0.05 }],
  fx: { idle:'flex', atk:'swoop' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the cygnus row stays
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · ORION · THE STARBOUND HUNTER · opponent (an UPGRADE of the shipped record) (mini lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 30 battle / 30 home
// REPLACE the orion record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
orion: {
  name: 'ORION', title: 'THE STARBOUND HUNTER', tier: 'mini', lvl: 4, tint: 0x9fc4ff, eye: 0xffb066,
  stars: [[0,-56],[-28,-34],[28,-38],[-10,2],[0,6],[10,10],[-24,48],[28,44],[4,20],[6,30],[-42,-52],[-48,-68],[-34,-74],[54,-28],[62,-10],[60,8]],
  edges: [[0,1],[0,2],[1,2],[1,3],[2,5],[3,4],[4,5],[3,6],[5,7],[4,8],[8,9],[1,10],[10,11],[11,12],[2,13],[13,14],[14,15]], eyes: [[0,-58]],
  mags: [3,1,1,2,2,2,1,1,3,4,4,5,5,4,4,5], hues: [null,0xff6e58,0xa6c8ff,0x9fb4ff,0x9fb4ff,0x9fb4ff,0xa6c8ff,0xa6c8ff,null,null,null,null,null,null,null,null],
  named: [[7,'RIGEL']],
  parts: [{ t:'nebula', at:9, r:14, hue:0xff7a9a, a:0.12 },
          { t:'nebula', at:9, r:7, hue:0x6fe0d0, a:0.14 }],
  fx: { idle:'headturn', atk:'slam' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the orion row stays
// ------------------------------------------------------------------------------------------
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
// ------------------------------------------------------------------------------------------
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
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · URSA · THE WINTER BEAR · opponent (an UPGRADE of the shipped record) (mini lvl 2)
// NEEDS SS-SKY-01 (uses: hues named parts) · objects 28 battle / 28 home
// REPLACE the ursa record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
ursa: {
  name: 'URSA', title: 'THE WINTER BEAR', tier: 'mini', lvl: 2, hp: 76, atk: 14, timer: 3, tint: 0xd6a86b, eye: 0xffd23e,
  stars: [[58,-6],[44,-20],[38,-32],[16,-30],[-8,-38],[-38,-28],[-56,-10],[-48,14],[-42,34],[-8,8],[22,12],[26,34],[48,6]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[6,9],[9,10],[10,11],[0,12],[12,9]], eyes: [[46,-16]],
  hues: [null,0xffb066,null,null,null,null,null,0xe2ecff,0xa6c8ff,null,null,null,null],
  named: [[1,'DUBHE']],
  parts: [{ t:'binary', at:7, sep:5, ang:-40, hue:0xfff2cc, T:0 },
          { t:'galaxy', at:8, x:-56, y:48, r:8, tilt:20, hue:0xcfd8ff, a:0.08 }],
  fx: { idle:'lumber', atk:'slam' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the ursa row stays
// ------------------------------------------------------------------------------------------
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
// ------------------------------------------------------------------------------------------
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
// ------------------------------------------------------------------------------------------
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
// ------------------------------------------------------------------------------------------
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
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · CASSIOPEIA · THE VAIN QUEEN · opponent (an UPGRADE of the shipped record) (mini lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named pulse parts) · objects 29 battle / 29 home
// REPLACE the cassiopeia record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
cassiopeia: {
  name: 'CASSIOPEIA', title: 'THE VAIN QUEEN', tier: 'mini', lvl: 3, tint: 0xe0aed0, eye: 0xffd23e,
  stars: [[-74,-26],[-38,-48],[-2,-24],[34,-52],[66,-30],[-2,-4],[-14,10],[12,8],[-16,34],[16,32],[-10,54],[12,52],[-30,6],[34,4]],
  edges: [[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[5,7],[6,8],[7,9],[8,10],[9,11],[8,9],[12,8],[13,9]], eyes: [[-6,-6],[2,-6]],
  mags: [2,1,2,3,3,3,4,4,4,4,5,5,4,4], hues: [0xfff2cc,0xffb066,0xa6c8ff,0xe2ecff,0xa6c8ff,null,null,null,null,null,null,null,null,null],
  named: [[1,'SCHEDAR']],
  pulse: [[2,25,0.55]],
  parts: [{ t:'ring', at:0, x:-84, y:-54, rx:7, ry:7, hue:0xa6c8ff, a:0.25 }],
  fx: { idle:'headturn', atk:'lash' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the cassiopeia row stays
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · CANCER · THE GLOOM CRAB · opponent (an UPGRADE of the shipped record) (mini lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 36 battle / 36 home
// REPLACE the cancer record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
cancer: {
  name: 'CANCER', title: 'THE GLOOM CRAB', tier: 'mini', lvl: 1, hp: 62, atk: 12, timer: 3, tint: 0xc79af5, eye: 0xff7ad9,
  stars: [[-20,0],[0,-12],[20,0],[14,16],[-14,16],[-38,-8],[-60,-20],[-76,-8],[-88,-20],[-72,-34],[38,-8],[60,-20],[76,-8],[88,-20],[72,-34],[-26,26],[-34,44],[0,28],[0,46],[26,26],[34,44],[-8,-24],[8,-24]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,0],[0,5],[5,6],[6,7],[7,8],[7,9],[2,10],[10,11],[11,12],[12,13],[12,14],[4,15],[15,16],[3,17],[17,18],[3,19],[19,20],[1,21],[1,22]], eyes: [[-8,-28],[8,-28]],
  mags: [4,2,4,2,4,4,4,4,5,5,4,4,3,2,5,4,5,4,5,4,5,5,5], hues: [null,0xe2ecff,null,0xffb066,null,null,null,null,null,null,null,null,null,0xffb066,null,null,null,null,null,null,null,null,null],
  parts: [{ t:'cluster', at:1, x:0, y:3, n:24, r:12, hue:0xfff2cc, a:1 }],
  fx: { idle:'pinch', atk:'snap' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the cancer row stays
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · AQUILA · THE THUNDER EAGLE · opponent (an UPGRADE of the shipped record) (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named pulse) · objects 26 battle / 26 home
// REPLACE the aquila record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
aquila: {
  name: 'AQUILA', title: 'THE THUNDER EAGLE', tier: 'mini', lvl: 2, tint: 0xd8c06b, eye: 0xfff0a8,
  stars: [[0,-52],[-12,-58],[10,-46],[0,-28],[-4,-4],[-30,-18],[-58,-8],[-82,8],[28,-14],[54,-2],[78,16],[2,20],[-8,40],[12,42],[2,58]],
  edges: [[1,0],[0,2],[0,3],[3,4],[3,5],[5,6],[6,7],[3,8],[8,9],[9,10],[4,11],[11,12],[11,13],[12,14],[13,14]], eyes: [[0,-54]],
  mags: [1,2,3,3,3,3,3,2,3,3,2,2,4,4,3], hues: [0xe2ecff,0xffb066,0xffdc7a,null,null,null,null,null,null,null,null,null,null,null,null],
  named: [[0,'ALTAIR']],
  pulse: [[11,7.2,0.55]],
  fx: { idle:'flex', atk:'swoop' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the aquila row stays
// ------------------------------------------------------------------------------------------
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
// ------------------------------------------------------------------------------------------
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
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · MONOCEROS · THE GLASS UNICORN · opponent (an UPGRADE of the shipped record) (mini lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 30 battle / 30 home
// REPLACE the monoceros record in SS_BEASTS (data.js) with this one — stats/titles/fx kept unless changed
monoceros: {
  name: 'MONOCEROS', title: 'THE GLASS UNICORN', tier: 'mini', lvl: 3, tint: 0xd8d2f0, eye: 0xbfe8ff,
  stars: [[-70,-58],[-56,-42],[-46,-30],[-58,-18],[-34,-24],[-16,-30],[8,-26],[32,-28],[50,-18],[66,-2],[60,18],[-28,-6],[-34,16],[-30,44],[0,-2],[26,-4],[34,20],[28,46]],
  edges: [[0,1],[1,2],[2,3],[2,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[4,11],[11,12],[12,13],[11,14],[14,15],[15,16],[16,17],[7,15]], eyes: [[-48,-34]],
  mags: [1,3,3,4,3,3,4,3,3,3,4,3,4,4,4,3,4,4], hues: [0xa6c8ff,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
  parts: [{ t:'ring', at:11, rx:8, ry:8, hue:0xff7a9a, a:0.45 }],
  fx: { idle:'prowl', atk:'charge' },
},
// strings.js — title unchanged: the 9 beast maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352) stay as they are
// BESTIARY.md table @26: the monoceros row stays
// ------------------------------------------------------------------------------------------
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
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · MERCURY · THE SCORCHED · opponent (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts) · objects 19 battle / 19 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
mercury: {
  name: 'MERCURY', title: 'THE SCORCHED', tier: 'basic', lvl: 1, tint: 0xc9b8a8, eye: 0xfff2cc,
  stars: [[0,0],[-64,0],[30,-56],[58,-30],[68,4],[58,38],[30,60]],
  edges: [[2,3],[3,4],[4,5],[5,6]], eyes: [[2,-10]],
  mags: [5,1,5,4,5,4,5], hues: [null,0xffdc7a,null,null,null,null,null],
  named: [[1,'THE SUN']],
  steady: [0,1],
  parts: [{ t:'nebula', at:1, r:30, hue:0xffdc7a, a:0.6 },
          { t:'planet', at:0, r:14, hue:0xc9b8a8, spot:{ y:-3, rx:4.5, ry:3.5, hue:0xa89684 }, limb:0.2, spin:118 }],
  fx: { idle:'bob', atk:'charge' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   mercury: 'THE SCORCHED',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | mercury | MERCURY (the scorched) | basic 1 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · VENUS · THE VEILED ONE · opponent (mini lvl 1)
// NEEDS SS-SKY-01 (uses: mags named steady parts) · objects 17 battle / 17 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
venus_world: {
  name: 'VENUS', title: 'THE VEILED ONE', tier: 'mini', lvl: 1, tint: 0xfff2cc, eye: 0xffdc7a,
  stars: [[0,0],[-84,50],[-42,64],[0,70],[42,64],[84,50]],
  edges: [[1,2],[2,3],[3,4],[4,5]], eyes: [[0,17]],
  mags: [5,5,4,5,4,5],
  named: [[0,'VENUS']],
  steady: [0],
  parts: [{ t:'nebula', at:0, r:44, hue:0xfff2cc, a:0.42 },
          { t:'planet', at:0, r:21, hue:0xfff2cc, bands:[[-9,3,0xf2dfae],[3,4,0xf2dfae],[13,2,0xe8d09a]], limb:0.08 }],
  fx: { idle:'lumber', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   venus_world: 'THE VEILED ONE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | venus_world | VENUS (the veiled one) | mini 1 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · EARTH · THE BLUE MARBLE · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit') · objects 19 battle / 19 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
earth: {
  name: 'EARTH', title: 'THE BLUE MARBLE', tier: 'mini', lvl: 2, tint: 0x6fa8dc, eye: 0xe2ecff,
  stars: [[0,0],[34,0],[0,-66],[-84,40],[-46,60],[46,60],[84,40]],
  edges: [[0,2],[3,4],[4,5],[5,6]], eyes: [[-8,7]],
  mags: [5,3,2,5,5,5,5], hues: [null,0xd9d9d9,0xfff2cc,null,null,null,null],
  named: [[2,'POLARIS']],
  steady: [0,1],
  parts: [{ t:'planet', at:0, r:21, hue:0x3a7bd5, bands:[[-20,1.8,0xe6eef8],[-7,0.7,0x8fb8e6],[20,1.8,0xe6eef8]], spot:{ y:0, rx:8, ry:7, hue:0x7a9e55 }, limb:0.1, spin:24 },
          { t:'orbit', at:0, rx:34, ry:10, tilt:-6, a:0.1, T:54.6, occlude:21, ride:[[1,0.15,1]] }],
  fx: { idle:'orbit', atk:'slam' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   earth: 'THE BLUE MARBLE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | earth | EARTH (the blue marble) | mini 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · MARS · THE RED WANDERER · opponent (basic lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 20 battle / 20 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
mars: {
  name: 'MARS', title: 'THE RED WANDERER', tier: 'basic', lvl: 2, tint: 0xe0704a, eye: 0xffb066,
  stars: [[0,0],[27,0],[44,0],[-74,-44],[-52,-62],[-30,-50],[70,44],[84,24]],
  edges: [[3,4],[4,5],[6,7]], eyes: [[-6,-4]],
  mags: [5,5,5,2,5,4,5,5], hues: [null,0xa89f97,0xa89f97,0xff6e58,null,null,null,null],
  named: [[3,'ANTARES']],
  steady: [0,1,2],
  parts: [{ t:'planet', at:0, r:16, hue:0xe0704a, bands:[[-13,4,0xfff2cc]], spot:{ y:-3, rx:5, ry:3.5, hue:0x8f3a28 }, limb:0.15, spin:24.6 },
          { t:'orbit', at:0, rx:27, ry:8, tilt:-10, a:0.08, T:0.64, occlude:16, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:44, ry:13, tilt:-10, a:0.08, T:2.5, occlude:16, ride:[[2,0.4,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   mars: 'THE RED WANDERER',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | mars | MARS (the red wanderer) | basic 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · URANUS · THE TILTED ONE · opponent (mini lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 25 battle / 25 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
uranus: {
  name: 'URANUS', title: 'THE TILTED ONE', tier: 'mini', lvl: 3, tint: 0x9fe6e0, eye: 0xe2ecff,
  stars: [[0,0],[4,26],[4,32],[6,40],[7,52],[9,61],[-86,-10],[86,10],[-54,-64],[58,-60],[-8,74]],
  edges: [[6,0],[0,7]], eyes: [[13,1]],
  mags: [5,5,5,5,4,5,5,5,5,5,5], hues: [null,0xcfd8ff,0xe2ecff,0x8a8078,0xd9c4a8,0xb5a496,null,null,null,null,null],
  named: [[4,'TITANIA']],
  steady: [0,1,2,3,4,5],
  parts: [{ t:'planet', at:0, r:18, hue:0x9fe6e0, limb:0.1, ring:{ rx:30, ry:11, tilt:82, hue:0x7fbfb8, a:0.45, gap:0.9 } },
          { t:'orbit', at:0, rx:26, ry:8, tilt:82, a:0.07, T:2.8, occlude:18, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:32, ry:10, tilt:82, a:0.07, T:5, occlude:18, ride:[[2,0.3,1]] },
          { t:'orbit', at:0, rx:40, ry:12, tilt:82, a:0.07, T:8.3, occlude:18, ride:[[3,0.55,1]] },
          { t:'orbit', at:0, rx:52, ry:16, tilt:82, a:0.07, T:17.4, occlude:18, ride:[[4,0.15,1]] },
          { t:'orbit', at:0, rx:62, ry:19, tilt:82, a:0.07, T:27.1, occlude:18, ride:[[5,0.7,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   uranus: 'THE TILTED ONE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | uranus | URANUS (the tilted one) | mini 3 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · NEPTUNE · THE DEEP BLUE · opponent (boss lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named steady arcs parts idle 'orbit') · objects 22 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
neptune: {
  name: 'NEPTUNE', title: 'THE DEEP BLUE', tier: 'boss', lvl: 3, tint: 0x4d70ff, eye: 0xa6c8ff,
  stars: [[0,0],[39,16],[-36,-76],[-30,-48],[0,-48],[30,-48],[36,-76],[0,-80]],
  edges: [[3,4],[4,5],[4,7],[4,0]], eyes: [[-5,-6]],
  mags: [5,3,4,5,5,5,4,4], hues: [null,0xdfe8ff,null,null,null,null,null,null],
  named: [[1,'TRITON']],
  steady: [0,1],
  arcs: [[3,2,-0.14],[5,6,0.14]],
  parts: [{ t:'planet', at:0, r:21, hue:0x3d63ff, bands:[[-9,0.8,0x6a88ff],[7,0.7,0x6a88ff]], spot:{ y:-6, rx:6, ry:3.6, hue:0x223a96 }, limb:0.14, spin:16 },
          { t:'orbit', at:0, rx:42, ry:13, tilt:22, a:0.1, T:-11.8, occlude:21, ride:[[1,0,1]] }],
  fx: { idle:'orbit', atk:'charge' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   neptune: 'THE DEEP BLUE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | neptune | NEPTUNE (the deep blue) | boss 3 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · PLUTO · THE FAR PAIR · opponent (basic lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 20 battle / 20 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
pluto: {
  name: 'PLUTO', title: 'THE FAR PAIR', tier: 'basic', lvl: 3, tint: 0xd9c4a8, eye: 0xfff2cc,
  stars: [[0,0],[2,10],[-70,-56],[-46,-64],[52,-60],[76,-50],[-8,72]],
  edges: [[2,3],[4,5]], eyes: [[3,3]],
  mags: [5,4,5,5,5,5,5], hues: [null,0xa89f97,null,null,null,null,null],
  named: [[1,'CHARON']],
  steady: [0,1],
  parts: [{ t:'planet', at:0, r:12, hue:0xd9c4a8, bands:[[2,4,0xb3946e]], spot:{ y:3, rx:5, ry:4.5, hue:0xf0e2cc }, limb:0.15, spin:-12.8 },
          { t:'orbit', at:0, rx:30, ry:10, tilt:-12, a:0.1, T:12.8, occlude:12, ride:[[1,0.25,1]] },
          { t:'cluster', at:0, n:18, r:66, ring:true, hue:0xcfd8ff, a:0.22 }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   pluto: 'THE FAR PAIR',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | pluto | PLUTO (the far pair) | basic 3 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · THE MOON · THE PALE WATCHER · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags steady parts) · objects 16 battle / 16 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
luna: {
  name: 'THE MOON', title: 'THE PALE WATCHER', tier: 'mini', lvl: 2, tint: 0xf7e8c8, eye: 0xfff2cc,
  stars: [[0,0],[-80,-40],[-44,-66],[0,-74],[44,-66],[80,-40]],
  edges: [[1,2],[2,3],[3,4],[4,5]], eyes: [[-4,21],[-10,-5]],
  mags: [5,5,5,4,5,5],
  steady: [0],
  parts: [{ t:'moon', at:0, r:30, phase:0.42, angle:0 }],
  fx: { idle:'lumber', atk:'slam' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   luna: 'THE PALE WATCHER',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | luna | THE MOON (the pale watcher) | mini 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · TRAPPIST-1 · THE SEVEN HEARTHS · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 26 battle / 26 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
trappist: {
  name: 'TRAPPIST-1', title: 'THE SEVEN HEARTHS', tier: 'mini', lvl: 2, tint: 0xff6e58, eye: 0xff6e58,
  stars: [[0,0],[12,0],[11,7],[-5,12],[-24,6],[-30,-8],[-9,-20],[28,-19],[-74,-52],[68,-46],[-62,48],[76,40]],
  edges: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7]], eyes: [[0,0]],
  mags: [1,3,3,3,3,3,3,3,5,4,5,4], hues: [null,0xd9c4a8,0xc9b8a8,0xe0d0b8,0x7fb8e8,0x7fb8e8,0x7fb8e8,0xa89f97,null,null,null,null],
  named: [[0,'TRAPPIST-1']],
  steady: [1,2,3,4,5,6,7],
  parts: [{ t:'nebula', at:0, r:12, hue:0xff6e58, a:0.2 },
          { t:'orbit', at:0, rx:12, ry:6.6, a:0.1, T:1.51, occlude:3, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:17, ry:9.35, a:0.1, T:2.42, occlude:3, ride:[[2,0.14,1]] },
          { t:'orbit', at:0, rx:22, ry:12.1, a:0.1, T:4.05, occlude:3, ride:[[3,0.29,1]] },
          { t:'orbit', at:0, rx:27, ry:14.85, a:0.1, T:6.1, occlude:3, ride:[[4,0.43,1]] },
          { t:'orbit', at:0, rx:33, ry:18.15, a:0.1, T:9.21, occlude:3, ride:[[5,0.57,1]] },
          { t:'orbit', at:0, rx:38, ry:20.9, a:0.1, T:12.35, occlude:3, ride:[[6,0.71,1]] },
          { t:'orbit', at:0, rx:44, ry:24.2, a:0.1, T:18.77, occlude:3, ride:[[7,0.86,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   trappist: 'THE SEVEN HEARTHS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | trappist | TRAPPIST-1 (the seven hearths) | mini 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · SIRIUS · THE DOG STAR · opponent (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 21 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
sirius: {
  name: 'SIRIUS', title: 'THE DOG STAR', tier: 'basic', lvl: 1, tint: 0xe2ecff, eye: 0xe2ecff,
  stars: [[8,4],[-34,-14],[-64,32],[-74,64],[58,-54],[74,32],[-28,68],[42,62]],
  edges: [[0,1]], eyes: [[8,4]],
  mags: [1,3,2,5,4,5,5,4], hues: [null,0xb8f0ff,0xa6c8ff,null,null,null,null,null],
  named: [[0,'SIRIUS']],
  parts: [{ t:'nebula', at:0, r:18, hue:0xe2ecff, a:0.2 },
          { t:'nebula', at:1, r:5, hue:0xb8f0ff, a:0.3 },
          { t:'orbit', at:0, rx:42, ry:20, tilt:25, e:0.6, a:0.2, T:50, ride:[[1,0.5,1]] }],
  fx: { idle:'prowl', atk:'pounce' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   sirius: 'THE DOG STAR',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | sirius | SIRIUS (the dog star) | basic 1 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · CASTOR · THE SIX · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named parts idle 'orbit' attack 'fling') · objects 19 battle / 19 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
castor: {
  name: 'CASTOR', title: 'THE SIX', tier: 'mini', lvl: 2, tint: 0xe2ecff, eye: 0xa6c8ff,
  stars: [[-11,5],[11,-5],[-56,30],[62,-52],[72,46]],
  edges: [[0,1],[0,2]], eyes: [[0,0]],
  mags: [1,2,3,5,2], hues: [null,null,0xff6e58,null,0xffb066],
  named: [[0,'CASTOR']],
  parts: [{ t:'nebula', at:0, x:0, y:0, r:15, hue:0xe2ecff, a:0.12 },
          { t:'binary', at:0, sep:6, ang:20, hue:0xe2ecff, T:18.4 },
          { t:'binary', at:1, sep:6, ang:-60, hue:0xe2ecff, T:5.8 },
          { t:'binary', at:2, sep:5, ang:0, hue:0xff6e58, T:1.6 },
          { t:'orbit', at:0, x:0, y:0, rx:22, ry:14, tilt:-25, e:0.34, a:0.2, T:60, ride:[[0,0.5,0.7],[1,0,1]] },
          { t:'orbit', at:0, x:0, y:0, rx:68, ry:36, a:0.12, dash:true, T:400, ride:[[2,0.4,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   castor: 'THE SIX',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | castor | CASTOR (the six) | mini 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · ALBIREO · THE TWO-COLOURED · opponent (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named pulse parts) · objects 21 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
albireo: {
  name: 'ALBIREO', title: 'THE TWO-COLOURED', tier: 'basic', lvl: 1, tint: 0xe2ecff, eye: 0xa6c8ff,
  stars: [[-20,4],[20,-4],[-70,-48],[58,46],[-52,60],[74,-36],[22,-66],[-84,18]],
  edges: [[0,1]], eyes: [[20,-4]],
  mags: [1,2,5,4,5,4,5,5], hues: [0xffdc7a,0xa6c8ff,null,null,null,null,null,null],
  named: [[0,'ALBIREO']],
  pulse: [[0,2.4,0.55]],
  parts: [{ t:'ring', at:0, x:0, y:0, rx:92, ry:92, hue:0xcfd8ff, a:0.12 },
          { t:'nebula', at:0, r:20, hue:0xffdc7a, a:0.2 },
          { t:'nebula', at:1, r:14, hue:0xa6c8ff, a:0.2 }],
  fx: { idle:'ripple', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   albireo: 'THE TWO-COLOURED',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | albireo | ALBIREO (the two-coloured) | basic 1 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · ORION NEBULA · THE CRADLE · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags named parts) · objects 24 battle / 24 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
m42: {
  name: 'ORION NEBULA', title: 'THE CRADLE', tier: 'mini', lvl: 2, tint: 0xa6c8ff, eye: 0xe2ecff,
  stars: [[5,-12],[-13,-8],[-8,10],[10,12],[31,22],[-3,58],[5,-54],[-64,-56],[60,50]],
  edges: [[0,1],[1,2],[2,3],[3,0],[3,4]], eyes: [[5,-12]],
  mags: [2,3,4,3,3,2,4,5,5],
  named: [[0,'TRAPEZIUM']],
  parts: [{ t:'nebula', at:0, x:0, y:3, r:44, hue:0xff7a9a, a:0.26 },
          { t:'nebula', at:0, x:0, y:0, r:20, hue:0x6fe0d0, a:0.32 },
          { t:'nebula', at:0, x:15, y:-33, r:12, hue:0xff7a9a, a:0.16 },
          { t:'nebula', at:6, x:5, y:-56, r:13, hue:0xa6c8ff, a:0.12 }],
  fx: { idle:'ripple', atk:'breath' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   m42: 'THE CRADLE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | m42 | ORION NEBULA (the cradle) | mini 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · CRAB NEBULA · THE HEART THAT BEATS · opponent (boss lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named pulse parts) · objects 25 battle / 24 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
crab: {
  name: 'CRAB NEBULA', title: 'THE HEART THAT BEATS', tier: 'boss', lvl: 2, tint: 0xff7a9a, eye: 0xb8f0ff,
  stars: [[0,0],[31,4],[16,20],[-5,23],[-27,12],[-29,-8],[-11,-22],[11,-22],[28,-10]],
  edges: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8]], eyes: [[0,0]],
  mags: [2,5,4,5,4,5,4,5,4], hues: [0xb8f0ff,0xffb066,null,0xffb066,null,0xffb066,null,0xffb066,null],
  named: [[0,'THE PULSAR']],
  pulse: [[0,0.5,0.2]],
  parts: [{ t:'nebula', at:0, r:32, hue:0xff7a9a, a:0.38 },
          { t:'nebula', at:0, r:13, hue:0xa6c8ff, a:0.4 },
          { t:'ring', at:0, rx:27, ry:21, hue:0xffb066, a:0.4 }],
  fx: { idle:'ripple', atk:'slam', amp:1.1 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   crab: 'THE HEART THAT BEATS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | crab | CRAB NEBULA (the heart that beats) | boss 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · RING NEBULA · THE SMOKE RING · opponent (basic lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues pulse parts) · objects 16 battle / 16 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
m57: {
  name: 'RING NEBULA', title: 'THE SMOKE RING', tier: 'basic', lvl: 2, tint: 0x6fe0d0, eye: 0xb8f0ff,
  stars: [[2,22],[-42,-8],[46,-2],[28,-46],[-38,-50]],
  edges: [[4,3],[3,2],[2,1],[1,4]], eyes: [[2,22]],
  mags: [5,3,2,3,3], hues: [0xb8f0ff,0xa6c8ff,0xa6c8ff,0xff6e58,0xa6c8ff],
  pulse: [[0,3,0.3],[1,12.9,0.6]],
  parts: [{ t:'ring', at:0, rx:22, ry:16, hue:0x6fe0d0, a:0.55 },
          { t:'ring', at:0, rx:27, ry:20, hue:0xff6e58, a:0.28 },
          { t:'nebula', at:0, r:14, hue:0x6fe0d0, a:0.15 }],
  fx: { idle:'lumber', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   m57: 'THE SMOKE RING',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | m57 | RING NEBULA (the smoke ring) | basic 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · ANDROMEDA · THE SISTER GALAXY · opponent (boss lvl 4)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts) · objects 20 battle / 19 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
andromeda: {
  name: 'ANDROMEDA', title: 'THE SISTER GALAXY', tier: 'boss', lvl: 4, tint: 0xcfd8ff, eye: 0xfff2cc,
  stars: [[-8,-4],[14,22],[22,42],[40,66],[-72,40],[64,-56]],
  edges: [[3,2],[2,1],[1,0]], eyes: [[-8,-4]],
  mags: [3,3,3,1,5,5], hues: [0xfff2cc,0xa6c8ff,null,0xff6e58,null,null],
  named: [[3,'MIRACH']],
  steady: [0],
  parts: [{ t:'galaxy', at:0, x:-8, y:-4, r:34, tilt:-32, hue:0xcfd8ff, a:0.2 },
          { t:'galaxy', at:0, x:-2, y:14, r:4, tilt:40, hue:0xcfd8ff, a:0.14 },
          { t:'galaxy', at:0, x:-30, y:-26, r:6, tilt:-10, hue:0xcfd8ff, a:0.12 }],
  fx: { idle:'lumber', atk:'charge' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   andromeda: 'THE SISTER GALAXY',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | andromeda | ANDROMEDA (the sister galaxy) | boss 4 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · PRAESEPE · THE SWARM · opponent (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 21 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
praesepe: {
  name: 'PRAESEPE', title: 'THE SWARM', tier: 'basic', lvl: 1, tint: 0xfff2cc, eye: 0xffdc7a,
  stars: [[2,-3],[28,1],[10,-25],[-16,-20],[-26,7],[-10,26],[17,21],[8,-62],[38,40]],
  edges: [[1,2],[2,3],[3,4],[4,5],[5,6],[6,1]], eyes: [[2,-3]],
  mags: [4,4,4,4,4,4,4,3,3], hues: [null,null,null,null,null,null,null,0xe2ecff,0xffb066],
  named: [[8,'ASELLUS AUSTRALIS']],
  parts: [{ t:'cluster', at:0, x:0, y:0, n:30, r:20, hue:0xfff2cc, a:0.9 }],
  fx: { idle:'ripple', atk:'volley', bolts:6 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   praesepe: 'THE SWARM',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | praesepe | PRAESEPE (the swarm) | basic 1 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · SUPERNOVA · THE LAST LIGHT · opponent (boss lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named pulse arcs parts) · objects 30 battle / 29 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
supernova: {
  name: 'SUPERNOVA', title: 'THE LAST LIGHT', tier: 'boss', lvl: 3, tint: 0xe2ecff, eye: 0xb8f0ff,
  stars: [[0,0],[44,-30],[56,8],[30,44],[-12,54],[-48,32],[-56,-14],[-30,-46],[8,-56],[17,-17],[17,17],[-17,17],[-17,-17]],
  edges: [[0,9],[0,10],[0,11],[0,12]], eyes: [[0,0]],
  mags: [1,4,5,4,5,4,5,4,5,5,5,5,5], hues: [null,0xff7a9a,null,0xff7a9a,null,0xff7a9a,null,0xff7a9a,null,null,null,null,null],
  named: [[0,'STELLA NOVA']],
  pulse: [[0,2.2,0.6]],
  arcs: [[1,2,-0.1,0.2],[2,3,-0.1,0.2],[3,4,-0.1,0.2],[4,5,-0.1,0.2],[5,6,-0.1,0.2],[6,7,-0.1,0.2],[7,8,-0.1,0.2],[8,1,-0.1,0.2]],
  parts: [{ t:'nebula', at:0, r:16, hue:0xffdc7a, a:0.26 },
          { t:'nebula', at:0, r:44, hue:0xff7a9a, a:0.06 },
          { t:'ring', at:0, rx:50, ry:50, hue:0xff7a9a, a:0.3 },
          { t:'ring', at:0, rx:57, ry:57, hue:0xa6c8ff, a:0.25 }],
  fx: { idle:'ripple', atk:'nova', amp:1.5 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   supernova: 'THE LAST LIGHT',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | supernova | SUPERNOVA (the last light) | boss 3 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · ECLIPSE · THE DARK SUN · opponent (boss lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 29 battle / 28 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
eclipse: {
  name: 'ECLIPSE', title: 'THE DARK SUN', tier: 'boss', lvl: 2, tint: 0xffdc7a, eye: 0xfff2cc,
  stars: [[27,-27],[6,-30],[14,-27],[26,-15],[30,-4],[30,6],[-78,-50],[70,52],[-62,40]],
  edges: [[1,2],[2,0],[0,3],[3,4],[4,5]], eyes: [[27,-27]],
  mags: [1,3,3,3,3,3,5,5,5], hues: [0xfff2cc,null,null,null,null,null,0xe2ecff,0xe2ecff,0xe2ecff],
  named: [[0,'THE DIAMOND RING']],
  parts: [{ t:'nebula', at:0, x:0, y:0, r:56, hue:0xfff2cc, a:0.1 },
          { t:'ring', at:0, x:0, y:0, rx:42, ry:42, hue:0xffdc7a, a:0.3 },
          { t:'blackhole', at:0, x:0, y:0, r:30 },
          { t:'comet', at:0, x:37, y:0, len:44, ang:4, bulge:0, w:7, hue:0xfff2cc, a:0.12 },
          { t:'comet', at:0, x:-37, y:0, len:44, ang:184, bulge:0, w:7, hue:0xfff2cc, a:0.12 },
          { t:'comet', at:0, x:0, y:-37, len:20, ang:-90, bulge:0, w:4, hue:0xfff2cc, a:0.08 },
          { t:'comet', at:0, x:0, y:37, len:20, ang:90, bulge:0, w:4, hue:0xfff2cc, a:0.08 }],
  fx: { idle:'lumber', atk:'breath' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   eclipse: 'THE DARK SUN',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | eclipse | ECLIPSE (the dark sun) | boss 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · PULSAR · THE LIGHTHOUSE · opponent (mini lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named pulse arcs parts) · objects 22 battle / 22 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
pulsar: {
  name: 'PULSAR', title: 'THE LIGHTHOUSE', tier: 'mini', lvl: 3, tint: 0xa6c8ff, eye: 0xb8f0ff,
  stars: [[0,0],[12,-8],[-12,8],[-72,-44],[70,40],[-46,56],[56,-58]],
  edges: [[1,0],[0,2]], eyes: [[0,0]],
  mags: [1,5,5,5,5,5,5], hues: [0xb8f0ff,null,null,null,null,null,null],
  named: [[0,'LGM-1']],
  pulse: [[0,1.337,0.05]],
  arcs: [[1,2,0.35,0.12],[1,2,-0.35,0.12],[1,2,0.7,0.08],[1,2,-0.7,0.08]],
  parts: [{ t:'nebula', at:0, r:9, hue:0xb8f0ff, a:0.35 },
          { t:'comet', at:0, len:90, ang:-34, bulge:0, w:5, hue:0xa6c8ff, a:0.35 },
          { t:'comet', at:0, len:90, ang:146, bulge:0, w:5, hue:0xa6c8ff, a:0.35 },
          { t:'comet', at:0, x:73, y:-49, len:84, ang:146, bulge:0, w:12, hue:0xa6c8ff, a:0.1 },
          { t:'comet', at:0, x:-73, y:49, len:84, ang:-34, bulge:0, w:12, hue:0xa6c8ff, a:0.1 }],
  fx: { idle:'ripple', atk:'volley', bolts:3 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   pulsar: 'THE LIGHTHOUSE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | pulsar | PULSAR (the lighthouse) | mini 3 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · VENUS · THE EVENING STAR · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: named steady parts) · objects 8 battle / 8 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
venus: {
  name: 'VENUS', title: 'THE EVENING STAR', seat: [335,392], tint: 0xfff2cc,
  stars: [[0,0]], edges: [], eyes: [],
  named: [[0,'VENUS']],
  steady: [0],
  cross: 1.35,
  parts: [{ t:'nebula', at:0, r:30, hue:0xfff2cc, a:0.12 }],
},
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · THE MOON · THE NIGHT'S LANTERN · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags steady parts) · objects 7 battle / 7 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
moon: {
  name: 'THE MOON', title: 'THE NIGHT\'S LANTERN', seat: [70,425], tint: 0xf7e8c8,
  stars: [[22,0]], edges: [], eyes: [],
  steady: [0],
  parts: [{ t:'moon', at:0, x:0, y:0, r:34, phase:'true', angle:24 }],
},
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · PERSEIDS · THE FALLING NIGHT · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags parts) · objects 12 battle / 12 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
perseids: {
  name: 'PERSEIDS', title: 'THE FALLING NIGHT', seat: [380,40], tint: 0xfff2cc,
  stars: [[0,0]], edges: [], eyes: [],
  parts: [{ t:'comet', at:0, x:-6, y:52, len:26, ang:-84, bulge:0, w:2.6, hue:0xfff2cc, a:0.45 },
          { t:'comet', at:0, x:-30, y:46, len:22, ang:-57, bulge:0, w:2.4, hue:0xfff2cc, a:0.4 },
          { t:'comet', at:0, x:-48, y:40, len:34, ang:-40, bulge:0, w:3.4, hue:0xffb066, a:0.55 },
          { t:'comet', at:0, x:-40, y:18, len:20, ang:-24, bulge:0, w:2.2, hue:0xa8ffc4, a:0.4 },
          { t:'comet', at:0, x:-62, y:8, len:24, ang:-7, bulge:0, w:2.6, hue:0xfff2cc, a:0.45 },
          { t:'comet', at:0, x:-34, y:-8, len:18, ang:13, bulge:0, w:2.2, hue:0xfff2cc, a:0.35 }],
},
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · THE RIVER · THE MILKY WAY · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 15 battle / 15 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
milkyway: {
  name: 'THE RIVER', title: 'THE MILKY WAY', seat: [210,300], tint: 0xcfd8ff,
  stars: [[0,0]], edges: [], eyes: [],
  parts: [{ t:'nebula', at:0, x:-62, y:36, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:-31, y:18, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:0, y:0, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:31, y:-18, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:62, y:-36, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'cluster', at:0, x:-47, y:27, n:10, r:26, hue:0xfff2cc, a:0.5 },
          { t:'cluster', at:0, x:-16, y:9, n:10, r:26, hue:0xfff2cc, a:0.5 },
          { t:'cluster', at:0, x:16, y:-9, n:10, r:26, hue:0xfff2cc, a:0.5 },
          { t:'cluster', at:0, x:47, y:-27, n:10, r:26, hue:0xfff2cc, a:0.5 }],
},
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · THE ISS · THE PASSING LIGHT · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: steady parts) · objects 8 battle / 8 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
iss: {
  name: 'THE ISS', title: 'THE PASSING LIGHT', seat: [120,240], tint: 0xfff2cc,
  stars: [[0,0]], edges: [], eyes: [],
  steady: [0],
  parts: [{ t:'nebula', at:0, r:6, hue:0xfff2cc, a:0.3 },
          { t:'comet', at:0, len:44, ang:158, bulge:0, w:5, hue:0xfff2cc, a:0.85 }],
},
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · THE TRIO · THE EVENING TRIO · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts) · objects 10 battle / 10 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
conjunction: {
  name: 'THE TRIO', title: 'THE EVENING TRIO', seat: [330,380], tint: 0xfff2cc,
  stars: [[0,0],[-50,-16]], edges: [], eyes: [],
  named: [[0,'VENUS']],
  steady: [0,1],
  cross: 1.35,
  parts: [{ t:'nebula', at:0, r:24, hue:0xfff2cc, a:0.1 },
          { t:'moon', at:0, x:46, y:16, r:9, phase:0.1, angle:30 }],
},
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · THE WISH · THE WISHING STAR · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags hues steady parts) · objects 11 battle / 11 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
wish: {
  name: 'THE WISH', title: 'THE WISHING STAR', seat: [300,120], tint: 0xe2ecff,
  stars: [[0,0],[12,-15],[24,-29]], edges: [], eyes: [],
  steady: [0],
  parts: [{ t:'nebula', at:0, r:7, hue:0xfff2cc, a:0.3 },
          { t:'comet', at:0, len:60, ang:-51, bulge:0, w:4.2, hue:0xe2ecff, a:0.8 }],
},
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · CORONA · THE NORTHERN CROWN · showcase only (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named pulse) · objects 18 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
crown: {
  name: 'CORONA', title: 'THE NORTHERN CROWN', tier: 'basic', lvl: 1, tint: 0xe2ecff, eye: 0xfff2cc,
  stars: [[-72,14],[-50,-20],[-18,-40],[18,-40],[48,-26],[68,0],[75,30],[35,37]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]], eyes: [[-18,-40]],
  mags: [4,3,1,3,4,4,5,3], hues: [0xa6c8ff,0xfff2cc,null,null,null,0xffb066,null,0xff6e58],
  named: [[2,'ALPHECCA']],
  pulse: [[2,17.4,0.85],[7,30,0.15]],
  fx: { idle:'ripple', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   crown: 'THE NORTHERN CROWN',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | crown | CORONA (the northern crown) | basic 1 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · LYRA · THE HARP · showcase only (basic lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named pulse arcs parts) · objects 18 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
harp: {
  name: 'LYRA', title: 'THE HARP', tier: 'basic', lvl: 2, tint: 0xcfd8ff, eye: 0xe2ecff,
  stars: [[0,-48],[33,-54],[-9,-15],[30,-9],[-15,45],[27,51]],
  edges: [[0,1],[0,2],[2,3],[2,4],[3,5],[4,5]], eyes: [[0,-48]],
  mags: [1,4,3,3,3,2], hues: [0xe2ecff,null,null,0xff6e58,0xa6c8ff,0xa6c8ff],
  named: [[0,'VEGA']],
  pulse: [[4,12.9,0.6]],
  arcs: [[2,4,0.09,0.12],[2,4,0.18,0.09],[3,5,-0.09,0.12],[3,5,-0.18,0.09]],
  parts: [{ t:'binary', at:1, sep:3.5, ang:20, hue:0xe2ecff, T:0 },
          { t:'ring', at:4, x:6, y:51, rx:5.5, ry:4.5, hue:0x6fe0d0, a:0.55 },
          { t:'nebula', at:4, x:6, y:51, r:7, hue:0xff6e58, a:0.22 }],
  fx: { idle:'ripple', atk:'lash', strands:4 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   harp: 'THE HARP',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | harp | LYRA (the harp) | basic 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · CANIS MAJOR · THE HOUND · showcase only (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 23 battle / 23 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
hound: {
  name: 'CANIS MAJOR', title: 'THE HOUND', tier: 'mini', lvl: 2, tint: 0xa6c8ff, eye: 0xb8f0ff,
  stars: [[-12,-40],[-48,-35],[0,-62],[2,8],[12,30],[-7,61],[36,49],[-43,56],[-41,27],[50,18]],
  edges: [[0,1],[0,2],[0,3],[3,4],[4,6],[4,5],[5,7],[7,8],[8,3]], eyes: [[-12,-40]],
  mags: [1,2,4,3,2,1,2,3,4,4], hues: [0xe2ecff,null,null,null,0xfff2cc,null,null,null,null,0xff4d6b],
  named: [[0,'SIRIUS']],
  parts: [{ t:'binary', at:0, sep:6, ang:60, hue:0xb8f0ff, T:50 },
          { t:'cluster', at:3, x:-19, y:-6, n:10, r:6, hue:0xfff2cc, a:0.55 }],
  fx: { idle:'prowl', atk:'pounce' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   hound: 'THE HOUND',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | hound | CANIS MAJOR (the hound) | mini 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · THE TRIANGLE · THE THREE LANTERNS · showcase only (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 20 battle / 20 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
lanterns: {
  name: 'THE TRIANGLE', title: 'THE THREE LANTERNS', tier: 'basic', lvl: 1, tint: 0xe2ecff, eye: 0xfff2cc,
  stars: [[-42,-37],[32,-58],[5,59],[23,-42],[-9,-2],[-30,-17],[41,-22]],
  edges: [[0,1],[1,2],[2,0]], eyes: [[-42,-37]],
  mags: [1,1,1,4,3,5,5], hues: [null,null,null,null,0xffdc7a,null,null],
  named: [[0,'VEGA'],[1,'DENEB'],[2,'ALTAIR']],
  parts: [{ t:'binary', at:4, sep:5, ang:-20, hue:0xa6c8ff, T:0 }],
  fx: { idle:'ripple', atk:'volley', bolts:3 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   lanterns: 'THE THREE LANTERNS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | lanterns | THE TRIANGLE (the three lanterns) | basic 1 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · GEMINI · THE TWINS · sign (SS_ZODIAC)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 25 battle / 25 home
// REPLACE stars/edges of SS_ZODIAC_BY.gemini (data.js:294-357) — id/name/title/el/desc unchanged
  stars: [[-28,-58],[30,-52],[-34,-30],[-42,-2],[-48,26],[-36,52],[-64,34],[24,-26],[34,2],[28,28],[44,52],[60,30]],
  edges: [[0,2],[2,3],[3,4],[4,5],[4,6],[1,7],[7,8],[8,9],[9,10],[9,11],[2,7],[3,8]],
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · LIBRA · THE SCALES · sign (SS_ZODIAC)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 17 battle / 17 home
// REPLACE stars/edges of SS_ZODIAC_BY.libra (data.js:294-357) — id/name/title/el/desc unchanged
  stars: [[0,-52],[-52,-16],[44,-24],[-58,28],[-44,52],[38,24],[54,50]],
  edges: [[0,1],[0,2],[1,2],[1,3],[3,4],[2,5],[5,6]],
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · CAPRICORN · THE SEA-GOAT · sign (SS_ZODIAC)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 21 battle / 21 home
// REPLACE stars/edges of SS_ZODIAC_BY.capricorn (data.js:294-357) — id/name/title/el/desc unchanged
  stars: [[-72,-30],[-62,-10],[-34,10],[-2,26],[30,26],[56,8],[70,-24],[40,-20],[-16,-24]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,0]],
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · AQUARIUS · THE WATER-BEARER · sign (SS_ZODIAC)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 25 battle / 25 home
// REPLACE stars/edges of SS_ZODIAC_BY.aquarius (data.js:294-357) — id/name/title/el/desc unchanged
  stars: [[28,-46],[12,-58],[44,-56],[24,-26],[-8,-22],[-42,-30],[-66,-6],[42,-4],[26,14],[42,32],[22,52],[50,56]],
  edges: [[1,0],[2,0],[0,3],[3,4],[4,5],[5,6],[3,7],[7,8],[8,9],[9,10],[10,11]],
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · PISCES · THE TWIN FISH · sign (SS_ZODIAC)
// READY TODAY (stars/edges/eyes/tint/eye/fx only — zero engine change) · objects 28 battle / 28 home
// REPLACE stars/edges of SS_ZODIAC_BY.pisces (data.js:294-357) — id/name/title/el/desc unchanged
  stars: [[52,44],[18,34],[-14,26],[-44,22],[-66,14],[-84,20],[-86,36],[-68,42],[-52,34],[46,16],[40,-12],[34,-40],[24,-58],[44,-60]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,3],[0,9],[9,10],[10,11],[11,12],[12,13],[13,11]],
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · ALPHA CEN · THE THREE SISTERS · opponent (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named parts idle 'orbit' attack 'fling') · objects 21 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
alphacen: {
  name: 'ALPHA CEN', title: 'THE THREE SISTERS', tier: 'basic', lvl: 1, tint: 0xffdc7a, eye: 0xffb066,
  stars: [[18,8],[34,2],[52,-58],[-30,-8],[-74,-54],[-84,6],[-58,-26],[-96,-30]],
  edges: [[0,1],[0,3],[4,5],[6,7]], eyes: [[34,2]],
  mags: [1,2,4,1,3,1,2,3], hues: [0xffdc7a,0xffb066,0xff6e58,0xa6c8ff,0xff6e58,0xa6c8ff,null,null],
  named: [[0,'RIGIL KENTAURUS']],
  parts: [{ t:'nebula', at:0, r:18, hue:0xffdc7a, a:0.16 },
          { t:'nebula', at:2, r:5, hue:0xff6e58, a:0.3 },
          { t:'orbit', at:0, x:26, y:5, rx:18, ry:11, tilt:12, e:0.5, a:0.2, T:24, ride:[[0,0.5,0.6],[1,0,1]] },
          { t:'orbit', at:0, x:38, y:-26, rx:36, ry:30, tilt:30, a:0.12, dash:true, T:0, ride:[[2,0.62,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   alphacen: 'THE THREE SISTERS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | alphacen | ALPHA CEN (the three sisters) | basic 1 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · SATURN · THE CROWNED ONE · opponent (boss lvl 1)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit') · objects 22 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
saturn: {
  name: 'SATURN', title: 'THE CROWNED ONE', tier: 'boss', lvl: 1, tint: 0xf0dcae, eye: 0xffb066,
  stars: [[0,0],[70,0],[-35,0],[-62,-40],[58,-44],[10,60],[-50,48],[66,30]],
  edges: [[3,4],[4,7],[7,5],[5,6],[6,3]], eyes: [[0,-21]],
  mags: [5,3,5,4,4,5,5,4], hues: [null,0xffb066,0xe2ecff,null,null,null,null,null],
  named: [[1,'TITAN']],
  steady: [0,1,2],
  parts: [{ t:'planet', at:0, r:25, hue:0xf0dcae, bands:[[-8,3,0xe6c88f],[4,4,0xe6c88f],[14,2,0xd9b87a]], ring:{ rx:58, ry:14, tilt:26.7, hue:0xe8d9b5, a:0.7, gap:0.88 } },
          { t:'orbit', at:0, rx:70, ry:17, tilt:26.7, a:0.1, T:32, occlude:25, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:35, ry:8.5, tilt:26.7, a:0.08, T:2.7, occlude:25, ride:[[2,0.3,1]] }],
  fx: { idle:'orbit', atk:'nova', amp:1.1 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   saturn: 'THE CROWNED ONE',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | saturn | SATURN (the crowned one) | boss 1 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · JUPITER · THE KING OF WORLDS · opponent (boss lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling') · objects 24 battle / 23 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
jupiter: {
  name: 'JUPITER', title: 'THE KING OF WORLDS', tier: 'boss', lvl: 2, tint: 0xe8d5b5, eye: 0xd9604a,
  stars: [[0,0],[36,0],[-42,0],[50,0],[-62,0],[-70,-48],[74,-40],[-60,50],[68,52]],
  edges: [[5,6],[6,8],[8,7],[7,5]], eyes: [[8,9]],
  mags: [5,4,4,3,4,4,4,5,5], hues: [null,0xffe08a,0xe2ecff,0xc9b8a8,0x8a8078,null,null,null,null],
  named: [[3,'GANYMEDE']],
  steady: [0,1,2,3,4],
  parts: [{ t:'planet', at:0, r:30, hue:0xe8d5b5, bands:[[-22,4,0xc69c6d],[-10,3,0xc69c6d],[4,5,0xb07a56],[16,3,0xc69c6d]], spot:{ x:8, y:9, rx:6, ry:3.6, hue:0xd9604a }, limb:0.12, spin:10 },
          { t:'orbit', at:0, rx:36, ry:2, a:0, T:3.5, occlude:30, ride:[[1,0,1]] },
          { t:'orbit', at:0, rx:42, ry:2, a:0, T:7.1, occlude:30, ride:[[2,0.25,1]] },
          { t:'orbit', at:0, rx:50, ry:2, a:0, T:14.3, occlude:30, ride:[[3,0.5,1]] },
          { t:'orbit', at:0, rx:62, ry:2, a:0, T:33.4, occlude:30, ride:[[4,0.75,1]] }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   jupiter: 'THE KING OF WORLDS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | jupiter | JUPITER (the king of worlds) | boss 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · SOL · THE LONG ORBIT · opponent (boss lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts idle 'orbit' attack 'fling' edges[] (glint guard)) · objects 26 battle / 25 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
sol: {
  name: 'SOL', title: 'THE LONG ORBIT', tier: 'boss', lvl: 3, tint: 0xffdc7a, eye: 0xfff2cc,
  stars: [[0,0],[8,2],[-9,5],[-18,-5],[18,-10],[15,19],[-62,0],[-24,-31],[88,-12],[-41,29]],
  edges: [], eyes: [[0,0]],
  mags: [1,5,3,3,4,2,2,3,3,5], hues: [null,0xc9b8a8,0xfff2cc,0x3a7bd5,0xe0704a,0xe8d5b5,0xf0dcae,0x9fe6e0,0x3d63ff,0xd9c4a8],
  named: [[0,'THE SUN']],
  steady: [0,1,2,3,4,5,6,7,8,9],
  parts: [{ t:'nebula', at:0, r:18, hue:0xffdc7a, a:0.22 },
          { t:'orbit', at:0, rx:10, ry:4.2, a:0.12, T:2.9, occlude:6, ride:[[1,0.1,1]] },
          { t:'orbit', at:0, rx:16, ry:6.7, a:0.12, T:7.4, occlude:6, ride:[[2,0.35,1]] },
          { t:'orbit', at:0, rx:22, ry:9.2, a:0.12, T:12, occlude:6, ride:[[3,0.6,1]] },
          { t:'orbit', at:0, rx:30, ry:12.6, a:0.12, T:22.6, occlude:6, ride:[[4,0.85,1]] },
          { t:'orbit', at:0, rx:48, ry:20.2, a:0.12, T:142, occlude:6, ride:[[5,0.2,1]] },
          { t:'orbit', at:0, rx:62, ry:26, a:0.12, T:354, occlude:6, ride:[[6,0.5,1]] },
          { t:'orbit', at:0, rx:78, ry:32.8, a:0.12, T:1008, occlude:6, ride:[[7,0.7,1]] },
          { t:'orbit', at:0, rx:92, ry:38.6, a:0.12, T:1978, occlude:6, ride:[[8,0.95,1]] },
          { t:'orbit', at:0, rx:100, ry:42, tilt:17, e:0.25, a:0.08, dash:true, T:2976, ride:[[9,0.3,1]] },
          { t:'cluster', at:0, n:24, r:38, ring:true, hue:0xcfd8ff, a:0.25 }],
  fx: { idle:'orbit', atk:'fling' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   sol: 'THE LONG ORBIT',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | sol | SOL (the long orbit) | boss 3 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · HALLEY · THE ONCE-A-LIFETIME · opponent (mini lvl 1)
// NEEDS SS-SKY-01 (uses: mags named pulse parts) · objects 18 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
halley: {
  name: 'HALLEY', title: 'THE ONCE-A-LIFETIME', tier: 'mini', lvl: 1, tint: 0xcfe8ff, eye: 0xfff2cc,
  stars: [[-56,26],[-40,18],[-24,9],[-8,1],[8,-8],[24,-16]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5]], eyes: [[-56,26]],
  mags: [1,5,5,5,5,5],
  named: [[0,'HALLEY']],
  pulse: [[3,1.8,0.3],[4,1.8,0.2]],
  parts: [{ t:'nebula', at:0, r:8, hue:0xcfe8ff, a:0.5 },
          { t:'comet', at:0, len:96, ang:-28, bulge:0.18, w:10, hue:0xffe9c9, a:0.5 },
          { t:'comet', at:0, len:110, ang:-16, bulge:0, w:4, hue:0xa6c8ff, a:0.35 }],
  fx: { idle:'bob', atk:'swoop' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   halley: 'THE ONCE-A-LIFETIME',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | halley | HALLEY (the once-a-lifetime) | mini 1 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · PLEIADES · THE SEVEN SISTERS · opponent (basic lvl 1)
// NEEDS SS-SKY-01 (uses: mags named pulse parts) · objects 27 battle / 27 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
pleiades: {
  name: 'PLEIADES', title: 'THE SEVEN SISTERS', tier: 'basic', lvl: 1, tint: 0xa6c8ff, eye: 0xe2ecff,
  stars: [[0,0],[-31,4],[-33,-7],[13,22],[20,-18],[35,4],[37,-22],[44,-11],[24,-31],[-13,-44],[-53,26],[48,40],[-4,53],[62,-40],[-44,-26]],
  edges: [[2,1],[1,0],[0,3],[3,5],[5,4],[4,0]], eyes: [[0,0]],
  mags: [1,2,4,2,2,2,3,4,4,5,5,5,5,5,5],
  named: [[0,'ALCYONE']],
  pulse: [[2,40,0]],
  parts: [{ t:'nebula', at:3, x:13, y:13, r:30, hue:0xa6c8ff, a:0.09 }],
  fx: { idle:'bob', atk:'volley', bolts:7 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   pleiades: 'THE SEVEN SISTERS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | pleiades | PLEIADES (the seven sisters) | basic 1 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · CORONA · THE NORTHERN CROWN · opponent (basic lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named pulse) · objects 18 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
corona: {
  name: 'CORONA', title: 'THE NORTHERN CROWN', tier: 'basic', lvl: 2, tint: 0xe2ecff, eye: 0xfff2cc,
  stars: [[-58,2],[-40,-26],[-14,-42],[14,-42],[38,-30],[54,-10],[60,14],[28,20]],
  edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]], eyes: [[-14,-42]],
  mags: [4,3,1,3,4,4,5,5], hues: [0xa6c8ff,0xfff2cc,null,null,0xffdc7a,0xffb066,null,0xff6e58],
  named: [[2,'ALPHECCA']],
  pulse: [[7,30,0.15]],
  fx: { idle:'ripple', atk:'nova' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   corona: 'THE NORTHERN CROWN',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | corona | CORONA (the northern crown) | basic 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · LYRA · THE SILVER HARP · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named pulse arcs parts) · objects 18 battle / 18 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
lyra: {
  name: 'LYRA', title: 'THE SILVER HARP', tier: 'mini', lvl: 2, tint: 0xe2ecff, eye: 0xa6c8ff,
  stars: [[0,-44],[22,-48],[-6,-22],[20,-18],[-10,18],[18,22]],
  edges: [[0,1],[0,2],[2,3],[2,4],[3,5],[4,5]], eyes: [[0,-44]],
  mags: [1,4,3,3,3,2], hues: [null,null,null,0xff6e58,0xa6c8ff,0xa6c8ff],
  named: [[0,'VEGA']],
  pulse: [[4,12.9,0.6]],
  arcs: [[2,5,0.12,0.12],[3,4,-0.12,0.12],[2,3,0.3,0.12],[4,5,-0.3,0.12]],
  parts: [{ t:'binary', at:1, sep:4, ang:20, hue:0xe2ecff, T:0 },
          { t:'ring', at:4, x:4, y:22, rx:6, ry:5, hue:0x6fe0d0, a:0.5 },
          { t:'nebula', at:4, x:4, y:22, r:8, hue:0xff6e58, a:0.25 }],
  fx: { idle:'ripple', atk:'lash', strands:4 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   lyra: 'THE SILVER HARP',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | lyra | LYRA (the silver harp) | mini 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · CANIS · THE GREAT DOG · opponent (mini lvl 2)
// NEEDS SS-SKY-01 (uses: mags hues named parts) · objects 23 battle / 23 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
canis: {
  name: 'CANIS', title: 'THE GREAT DOG', tier: 'mini', lvl: 2, tint: 0xcfd8ff, eye: 0xa6c8ff,
  stars: [[-10,-40],[-40,-36],[0,-58],[2,0],[10,18],[-6,44],[30,34],[-36,40],[-34,16],[42,8]],
  edges: [[0,1],[0,2],[0,3],[3,4],[4,6],[4,5],[5,7],[7,8],[8,3]], eyes: [[-4,-46]],
  mags: [1,2,4,3,2,1,2,3,4,4], hues: [0xe2ecff,0xa6c8ff,null,null,0xfff2cc,0xa6c8ff,0xa6c8ff,null,null,0xff4d6b],
  named: [[0,'SIRIUS']],
  parts: [{ t:'cluster', at:3, x:-16, y:-12, n:10, r:6, hue:0xfff2cc },
          { t:'binary', at:0, sep:6, ang:60, hue:0xb8f0ff, T:50 }],
  fx: { idle:'prowl', atk:'pounce' },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   canis: 'THE GREAT DOG',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | canis | CANIS (the great dog) | mini 2 | store SS-STAR-01 |
// ------------------------------------------------------------------------------------------
// STARSPELL sky object · VORAGO · THE STAR THAT DRINKS · opponent (boss lvl 3)
// NEEDS SS-SKY-01 (uses: mags hues steady parts) · objects 23 battle / 22 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
vorago: {
  name: 'VORAGO', title: 'THE STAR THAT DRINKS', tier: 'boss', lvl: 3, tint: 0xffb066, eye: 0xfff2cc,
  stars: [[88,32],[31,76],[-31,63],[-56,16],[-39,-24],[-6,-34],[14,-18]],
  edges: [[0,1],[1,2],[2,3]], eyes: [[-14,0]],
  mags: [3,3,3,3,2,2,2], hues: [null,null,null,null,null,0xffdc7a,0xfff2cc],
  steady: [6],
  parts: [{ t:'nebula', at:6, x:0, y:0, r:22, hue:0xffdc7a, a:0.16 },
          { t:'ring', at:6, x:0, y:0, rx:34, ry:11, hue:0xffb066, a:0.36 },
          { t:'blackhole', at:6, x:0, y:0, r:12, disc:true },
          { t:'comet', at:6, len:28, ang:-142, bulge:0, w:3, hue:0xfff2cc, a:0.55 },
          { t:'comet', at:5, len:22, ang:165, bulge:0, w:2.2, hue:0xffdc7a, a:0.4 }],
  fx: { idle:'coil', atk:'breath', curse:'blackout', ink:4 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   vorago: 'THE STAR THAT DRINKS',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | vorago | VORAGO (the star that drinks) | boss 3 | store SS-STAR-01 |