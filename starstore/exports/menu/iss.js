// STARSPELL sky object · THE ISS · THE PASSING LIGHT · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: steady parts) · objects 8 battle / 8 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
iss: {
  name: 'THE ISS', title: 'THE PASSING LIGHT', seat: [120,240], tint: 0xfff2cc,
  stars: [[0,0]], edges: [], eyes: [],
  steady: [0],
  parts: [{ t:'nebula', at:0, r:6, hue:0xfff2cc, a:0.3 },
          { t:'comet', at:0, len:44, ang:158, bulge:0, w:5, hue:0xfff2cc, a:0.85 }],
},