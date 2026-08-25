// STARSPELL sky object · THE RIVER · THE MILKY WAY · menu decor (SS_DECOR)
// NEEDS SS-SKY-01 (uses: mags hues parts) · objects 15 battle / 15 home
// a MENU SKY seat: paste into SS_DECOR (SS-SKY-01's menu-sky seats) — never into SS_BEASTS (data.js:225 needs a tier)
milkyway: {
  name: 'THE RIVER', title: 'THE MILKY WAY', seat: [210,300], tint: 0xcfd8ff,
  stars: [[0,0]], edges: [], eyes: [],
  parts: [{ t:'nebula', at:0, x:-62, y:36, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:-31, y:18, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:0, y:0, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:31, y:-18, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'nebula', at:0, x:62, y:-36, r:40, hue:0xcfd8ff, a:0.1 },
          { t:'cluster', at:0, x:-47, y:27, n:10, r:26, hue:0xfff2cc, a:0.5 },
          { t:'cluster', at:0, x:-16, y:9, n:10, r:26, hue:0xfff2cc, a:0.5 },
          { t:'cluster', at:0, x:16, y:-9, n:10, r:26, hue:0xfff2cc, a:0.5 },
          { t:'cluster', at:0, x:47, y:-27, n:10, r:26, hue:0xfff2cc, a:0.5 }],
},