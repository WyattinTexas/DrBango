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