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