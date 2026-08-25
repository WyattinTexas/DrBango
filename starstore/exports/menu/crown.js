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