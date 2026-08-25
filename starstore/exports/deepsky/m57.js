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