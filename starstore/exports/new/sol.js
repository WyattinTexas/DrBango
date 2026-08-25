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