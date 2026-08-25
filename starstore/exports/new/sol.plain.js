// STARSPELL sky object · SOL · THE LONG ORBIT · opponent (boss lvl 3)
// NEEDS SS-SKY-01 (uses: edges[] (glint guard)) · objects 22 battle / 21 home
// paste INSIDE the SS_BEASTS literal (data.js, above the closing `};` at 218 — never as an assignment after the tier loop at 221-229); 200x160 box, y down; then register (see the jumpr card)
sol: {
  name: 'SOL', title: 'THE LONG ORBIT', tier: 'boss', lvl: 3, tint: 0xffdc7a, eye: 0xfff2cc,
  stars: [[0,0],[8,2],[-9,5],[-18,-5],[18,-10],[15,19],[-62,0],[-24,-31],[88,-12],[-41,29]],
  edges: [], eyes: [[0,0]],
  fx: { idle:'ripple', atk:'volley', bolts:9 },
},
// strings.js — add under beast: in the 9 non-English maps (es:112 fr:267 pt:422 de:577 ja:732 ko:887 zh:1042 hi:1197 ar:1352):
//   sol: 'THE LONG ORBIT',     (English fallback via strings.js:1547 — SS_BEAST_T(b) takes the beast OBJECT and reads b.id, never an id string; translate when Wyatt supplies lines)
// BESTIARY.md table @26: | sol | SOL (the long orbit) | boss 3 | store SS-STAR-01 |