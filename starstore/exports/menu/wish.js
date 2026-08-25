// STARSPELL sky object · THE WISH · THE WISHING STAR · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags hues steady parts) · objects 11 battle / 11 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
wish: {
  name: 'THE WISH', title: 'THE WISHING STAR', seat: [300,120], tint: 0xe2ecff,
  stars: [[0,0],[12,-15],[24,-29]], edges: [], eyes: [],
  steady: [0],
  parts: [{ t:'nebula', at:0, r:7, hue:0xfff2cc, a:0.3 },
          { t:'comet', at:0, len:60, ang:-51, bulge:0, w:4.2, hue:0xe2ecff, a:0.8 }],
},