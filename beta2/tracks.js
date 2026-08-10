// DRIFTLINE tracks — pure data, the future course builder edits exactly this.
// A track is a closed loop of control points (Catmull-Rom smoothed at runtime),
// a road width, and a color theme. Nothing else: cones, walls, start line and
// the minimap are all derived from the points, so user-built courses need only
// drag points around to make a valid, fully-dressed track.
const DRIFTLINE_TRACKS = [
  {
    id: 'neon-loop',
    name: 'NEON LOOP',
    width: 170,
    theme: { edge: 0xff2f9e, edge2: 0x2fe0ff, road: 0x151226, dash: 0x2fe0ff },
    points: [
      [600, 500], [1500, 380], [2400, 470], [3050, 800],
      [3250, 1500], [2900, 2100], [2200, 2300], [1800, 1850],
      [1500, 1400], [1050, 1300], [720, 1640], [674, 1994],
      [490, 2070], [306, 1994], [300, 1500], [350, 900],
    ],
  },
  {
    id: 'hairpin-harbor',
    name: 'HAIRPIN HARBOR',
    width: 155,
    theme: { edge: 0x2fe0ff, edge2: 0xffb347, road: 0x121a26, dash: 0xffb347 },
    points: [
      [500, 400], [1600, 320], [2700, 420], [3200, 900],
      [2700, 1250], [1900, 1150], [1418, 1308], [1360, 1450],
      [1418, 1592], [2100, 1750],
      [2900, 1700], [3300, 2100], [2800, 2550], [1800, 2600],
      [900, 2450], [450, 2000], [750, 1500], [420, 950],
    ],
  },
];
