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