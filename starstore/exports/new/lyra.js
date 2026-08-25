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