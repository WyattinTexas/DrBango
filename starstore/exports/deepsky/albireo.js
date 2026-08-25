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