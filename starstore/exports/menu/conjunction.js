// STARSPELL sky object · THE TRIO · THE EVENING TRIO · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags hues named steady parts) · objects 10 battle / 10 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
conjunction: {
  name: 'THE TRIO', title: 'THE EVENING TRIO', seat: [330,380], tint: 0xfff2cc,
  stars: [[0,0],[-50,-16]], edges: [], eyes: [],
  named: [[0,'VENUS']],
  steady: [0,1],
  cross: 1.35,
  parts: [{ t:'nebula', at:0, r:24, hue:0xfff2cc, a:0.1 },
          { t:'moon', at:0, x:46, y:16, r:9, phase:0.1, angle:30 }],
},