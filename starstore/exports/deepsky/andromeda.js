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