'use strict';
/* ============================================================
   STARSPELL data — beasts, acts, sigils, achievements.
   Constellations are hand-authored star points in a 200x160 box
   centered on origin (y down); edges are index pairs; eyes glow
   + pulse. New shapes are placed from the real star charts so
   each figure resembles its namesake asterism (see BESTIARY.md
   for the roster plan and what remains unauthored).

   Authoring a beast is data-only:
     tier: 'basic' | 'mini' | 'boss'  + lvl 1-4 → stats come from
     SS_TIER_CURVE; explicit hp/atk/timer override the curve.
   fx: presence + attack, all archetype-driven (ssBeastFx in game.js).
     idle — prowl · bob · coil · pinch · headturn · lumber · ripple · flex
     atk  — pounce · slam · lash · snap · swoop · breath · nova · charge · volley
   Optional tuning fields: hops (pounce), strands (lash), amp
   (flex/charge), bolts (volley).
   Boss curse (bosses only, where void/ink fits the fiction):
     curse: 'blackout' (+ ink: tiles per volley, default 2) — the
     boss inks the highest-value letters as its strike charges;
     inked tiles stay usable but score 0 (Battle.blackoutAttack).
   ============================================================ */

// Stats by tier + lvl (lvl ≈ the act the beast is at home in). The original
// ten keep their hand-tuned explicit stats; new beasts ride the curve.
const SS_TIER_CURVE = {
  basic: (l) => ({ hp: 22 + 8 * l, atk: 7 + l, timer: l >= 3 ? 3 : 4 }),
  mini: (l) => ({ hp: 40 + 15 * l, atk: 10 + Math.round(l * 1.5), timer: 3 }),
  boss: (l) => ({ hp: 60 + 30 * l, atk: 13 + 2 * l, timer: l >= 3 ? 4 : 3 }),
};

const SS_BEASTS = {
  // ---- basics ----
  vulpes: {
    name: 'VULPES', title: 'THE EMBER FOX', tier: 'basic', lvl: 1, hp: 30, atk: 8, timer: 4, tint: 0xffb066, eye: 0xffd23e,
    stars: [[-78, 18], [-58, 2], [-38, 10], [-20, -2], [2, -10], [20, -14], [38, -24], [34, -44], [56, -40], [54, -22], [64, -14], [46, -6], [26, 16], [30, 34], [-8, 16], [-6, 34]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 6], [5, 12], [12, 13], [3, 14], [14, 15]],
    eyes: [[46, -22]],
    fx: { idle: 'prowl', atk: 'pounce' },
  },
  lepus: {
    name: 'LEPUS', title: 'THE MOONLIT HARE', tier: 'basic', lvl: 2, hp: 38, atk: 9, timer: 4, tint: 0xbfe8c9, eye: 0xa8ffc4,
    stars: [[-10, -64], [14, -60], [-2, -38], [8, -30], [26, -26], [0, -4], [8, 18], [-28, -18], [-52, -6], [-58, 16], [-36, 34], [-66, -14]],
    edges: [[0, 2], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [5, 7], [7, 8], [8, 9], [9, 10], [8, 11]],
    eyes: [[12, -32]],
    fx: { idle: 'bob', atk: 'pounce', hops: 2 },
  },
  serpens: {
    name: 'SERPENS', title: 'THE TIDE SERPENT', tier: 'basic', lvl: 3, hp: 48, atk: 10, timer: 3, tint: 0x6fe0d0, eye: 0x9ffcee,
    stars: [[-84, 32], [-62, 14], [-40, 28], [-18, 10], [4, 24], [26, 6], [46, 18], [60, 0], [68, -20], [58, -40], [42, -34], [74, -34]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [9, 11]],
    eyes: [[52, -38], [64, -38]],
    fx: { idle: 'coil', atk: 'lash' },
  },
  delphinus: {
    name: 'DELPHINUS', title: 'THE STARLIT DOLPHIN', tier: 'basic', lvl: 1, tint: 0x9fd8e8, eye: 0xcfffff,
    stars: [[44, -52], [16, -34], [32, -8], [58, -26], [80, -44], [-4, 12], [-34, 30], [-64, 38], [-84, 20], [-80, 58]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [2, 5], [5, 6], [6, 7], [7, 8], [7, 9]],
    eyes: [[48, -40]],
    fx: { idle: 'coil', atk: 'pounce' },
  },
  columba: {
    name: 'COLUMBA', title: 'THE HERALD DOVE', tier: 'basic', lvl: 1, tint: 0xe8ddc8, eye: 0xfff2c9,
    stars: [[-10, -46], [-26, -52], [-2, -28], [6, -8], [12, 10], [-34, -24], [-60, -34], [-84, -46], [30, -18], [56, -24], [82, -34], [4, 32], [-10, 46], [18, 48]],
    edges: [[0, 1], [0, 2], [2, 3], [3, 4], [2, 5], [5, 6], [6, 7], [2, 8], [8, 9], [9, 10], [4, 11], [11, 12], [11, 13]],
    eyes: [[-14, -48]],
    fx: { idle: 'bob', atk: 'swoop' },
  },
  lacerta: {
    name: 'LACERTA', title: 'THE ZIGZAG LIZARD', tier: 'basic', lvl: 2, tint: 0xa8e86b, eye: 0xd4ff5e,
    stars: [[8, -68], [-8, -58], [6, -46], [-10, -34], [8, -22], [-8, -10], [6, 2], [-8, 14], [4, 28], [-6, 44], [6, 58], [-2, 72], [-28, -26], [26, -14], [-24, 36], [26, 36]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [3, 12], [4, 13], [8, 14], [8, 15]],
    eyes: [[2, -58]],
    fx: { idle: 'coil', atk: 'lash' },
  },
  cygnus: {
    name: 'CYGNUS', title: 'THE CROSSWIND SWAN', tier: 'basic', lvl: 3, tint: 0xdfe8ff, eye: 0x9fb4ff,
    stars: [[4, -58], [0, -30], [0, -4], [-2, 24], [-4, 48], [30, 2], [58, 10], [84, 24], [-30, -10], [-58, -6], [-84, 6]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [6, 7], [2, 8], [8, 9], [9, 10]],
    eyes: [[-8, 50]],
    fx: { idle: 'flex', atk: 'swoop' },
  },
  pavo: {
    name: 'PAVO', title: 'THE VEILED PEACOCK', tier: 'basic', lvl: 3, tint: 0x6be0c4, eye: 0x7affd4,
    stars: [[0, 10], [4, 28], [-4, -8], [0, -26], [6, -38], [-64, -6], [-52, -34], [-28, -54], [4, -62], [36, -50], [58, -26], [68, 2], [-8, 46], [12, 46]],
    edges: [[1, 0], [0, 2], [2, 3], [3, 4], [0, 5], [0, 6], [0, 7], [0, 8], [0, 9], [0, 10], [0, 11], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [1, 12], [1, 13]],
    eyes: [[-4, -28]],
    fx: { idle: 'ripple', atk: 'volley', bolts: 4 },
  },
  // ---- minibosses ----
  cancer: {
    name: 'CANCER', title: 'THE GLOOM CRAB', tier: 'mini', lvl: 1, hp: 62, atk: 12, timer: 3, tint: 0xc79af5, eye: 0xff7ad9,
    stars: [[-20, 0], [0, -12], [20, 0], [14, 16], [-14, 16], [-38, -8], [-60, -20], [-76, -8], [-88, -20], [-72, -34], [38, -8], [60, -20], [76, -8], [88, -20], [72, -34], [-26, 26], [-34, 44], [0, 28], [0, 46], [26, 26], [34, 44], [-8, -24], [8, -24]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5], [5, 6], [6, 7], [7, 8], [7, 9], [2, 10], [10, 11], [11, 12], [12, 13], [12, 14], [4, 15], [15, 16], [3, 17], [17, 18], [3, 19], [19, 20], [1, 21], [1, 22]],
    eyes: [[-8, -28], [8, -28]],
    fx: { idle: 'pinch', atk: 'snap' },
  },
  corvus: {
    name: 'CORVUS', title: 'THE HOLLOW RAVEN', tier: 'mini', lvl: 1, hp: 58, atk: 12, timer: 3, tint: 0x9a86e8, eye: 0xf2f2ff,
    stars: [[48, -30], [66, -22], [30, -24], [8, -10], [-28, 4], [-46, 14], [-42, -4], [2, -40], [-18, -56], [-40, -62], [8, 14], [-8, 30], [-28, 40]],
    edges: [[0, 1], [0, 2], [2, 3], [3, 4], [4, 5], [4, 6], [2, 7], [7, 8], [8, 9], [3, 10], [10, 11], [11, 12]],
    eyes: [[50, -34]],
    fx: { idle: 'headturn', atk: 'swoop' },
  },
  ursa: {
    name: 'URSA', title: 'THE WINTER BEAR', tier: 'mini', lvl: 2, hp: 76, atk: 14, timer: 3, tint: 0xd6a86b, eye: 0xffd23e,
    stars: [[58, -6], [44, -20], [38, -32], [16, -30], [-8, -38], [-38, -28], [-56, -10], [-48, 14], [-42, 34], [-8, 8], [22, 12], [26, 34], [48, 6]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [6, 9], [9, 10], [10, 11], [0, 12], [12, 9]],
    eyes: [[46, -16]],
    fx: { idle: 'lumber', atk: 'slam' },
  },
  aranea: {
    name: 'ARANEA', title: 'THE SILK WIDOW', tier: 'mini', lvl: 2, hp: 70, atk: 13, timer: 3, tint: 0xba6be0, eye: 0xff4d6b,
    stars: [[10, -14], [-14, 6], [26, -30], [44, -44], [32, -12], [56, -16], [30, 6], [52, 18], [18, 18], [28, 38], [-30, -24], [-46, -40], [-36, -4], [-58, -6], [-32, 14], [-48, 28], [-22, 26], [-28, 46], [18, -26], [6, -28]],
    edges: [[0, 1], [0, 2], [2, 3], [0, 4], [4, 5], [0, 6], [6, 7], [1, 8], [8, 9], [1, 10], [10, 11], [1, 12], [12, 13], [1, 14], [14, 15], [1, 16], [16, 17], [0, 18], [0, 19]],
    eyes: [[8, -18], [14, -16]],
    fx: { idle: 'ripple', atk: 'lash', strands: 3 },
  },
  aquila: {
    name: 'AQUILA', title: 'THE THUNDER EAGLE', tier: 'mini', lvl: 2, tint: 0xd8c06b, eye: 0xfff0a8,
    stars: [[0, -52], [-12, -58], [10, -46], [0, -28], [-4, -4], [-30, -18], [-58, -8], [-82, 8], [28, -14], [54, -2], [78, 16], [2, 20], [-8, 40], [12, 42], [2, 58]],
    edges: [[1, 0], [0, 2], [0, 3], [3, 4], [3, 5], [5, 6], [6, 7], [3, 8], [8, 9], [9, 10], [4, 11], [11, 12], [11, 13], [12, 14], [13, 14]],
    eyes: [[0, -54]],
    fx: { idle: 'flex', atk: 'swoop' },
  },
  lupus: {
    name: 'LUPUS', title: 'THE STAR-STARVED WOLF', tier: 'mini', lvl: 3, tint: 0xb0bdd4, eye: 0xff5e4d,
    stars: [[-62, -52], [-48, -40], [-58, -30], [-36, -48], [-30, -22], [-10, -12], [14, -16], [38, -10], [56, -24], [70, -40], [-22, 6], [-26, 28], [-20, 50], [30, 8], [38, 30], [30, 52], [4, 10]],
    edges: [[0, 1], [1, 2], [1, 3], [1, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [5, 10], [10, 11], [11, 12], [7, 13], [13, 14], [14, 15], [10, 16], [16, 13]],
    eyes: [[-44, -44]],
    fx: { idle: 'prowl', atk: 'pounce' },
  },
  monoceros: {
    name: 'MONOCEROS', title: 'THE GLASS UNICORN', tier: 'mini', lvl: 3, tint: 0xd8d2f0, eye: 0xbfe8ff,
    stars: [[-70, -58], [-56, -42], [-46, -30], [-58, -18], [-34, -24], [-16, -30], [8, -26], [32, -28], [50, -18], [66, -2], [60, 18], [-28, -6], [-34, 16], [-30, 44], [0, -2], [26, -4], [34, 20], [28, 46]],
    edges: [[0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [4, 11], [11, 12], [12, 13], [11, 14], [14, 15], [15, 16], [16, 17], [7, 15]],
    eyes: [[-48, -34]],
    fx: { idle: 'prowl', atk: 'charge' },
  },
  cassiopeia: {
    name: 'CASSIOPEIA', title: 'THE VAIN QUEEN', tier: 'mini', lvl: 3, tint: 0xe0aed0, eye: 0xffd23e,
    stars: [[-74, -26], [-38, -48], [-2, -24], [34, -52], [66, -30], [-2, -4], [-14, 10], [12, 8], [-16, 34], [16, 32], [-10, 54], [12, 52], [-30, 6], [34, 4]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [5, 7], [6, 8], [7, 9], [8, 10], [9, 11], [8, 9], [12, 8], [13, 9]],
    eyes: [[-6, -6], [2, -6]],
    fx: { idle: 'headturn', atk: 'lash' },
  },
  cetus: {
    name: 'CETUS', title: 'THE DROWNED LEVIATHAN', tier: 'mini', lvl: 4, tint: 0x6b9fe0, eye: 0x9ffcee,
    stars: [[52, -44], [76, -32], [82, -8], [66, 10], [46, -2], [42, -26], [58, 22], [28, 14], [4, 26], [-22, 30], [-46, 20], [-62, 2], [-80, 16], [-90, 0], [-88, 36]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [3, 6], [4, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [12, 14]],
    eyes: [[60, -30]],
    fx: { idle: 'coil', atk: 'breath' },
  },
  orion: {
    name: 'ORION', title: 'THE STARBOUND HUNTER', tier: 'mini', lvl: 4, tint: 0x9fc4ff, eye: 0xffb066,
    stars: [[0, -56], [-28, -34], [28, -38], [-10, 2], [0, 6], [10, 10], [-24, 48], [28, 44], [4, 20], [6, 30], [-42, -52], [-48, -68], [-34, -74], [54, -28], [62, -10], [60, 8]],
    edges: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 5], [3, 4], [4, 5], [3, 6], [5, 7], [4, 8], [8, 9], [1, 10], [10, 11], [11, 12], [2, 13], [13, 14], [14, 15]],
    eyes: [[0, -58]],
    fx: { idle: 'headturn', atk: 'slam' },
  },
  // ---- bosses ----
  strix: {
    name: 'STRIX', title: 'THE VOID OWL', tier: 'boss', lvl: 1, hp: 85, atk: 14, timer: 3, tint: 0x9fb4ff, eye: 0xffe08a,
    stars: [[0, -50], [28, -40], [40, -12], [28, 16], [0, 26], [-28, 16], [-40, -12], [-28, -40], [-38, -58], [38, -58], [0, 4], [-8, 14], [8, 14], [-52, 0], [-72, 22], [-58, 40], [52, 0], [72, 22], [58, 40], [-14, 52], [14, 52]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [7, 8], [1, 9], [10, 11], [10, 12], [6, 13], [13, 14], [14, 15], [2, 16], [16, 17], [17, 18], [4, 19], [4, 20]],
    eyes: [[-14, -18], [14, -18]],
    fx: { idle: 'headturn', atk: 'swoop', curse: 'blackout' },   // the void drinks the light
  },
  leo: {
    name: 'LEO', title: 'THE SOVEREIGN LION', tier: 'boss', lvl: 1, tint: 0xffd23e, eye: 0xffb066,
    stars: [[-24, 30], [-32, 10], [-22, -12], [-34, -30], [-52, -36], [-64, -22], [-70, -6], [8, -14], [40, -22], [70, -10], [44, 8], [-28, 54], [42, 34], [50, 56], [8, 52], [82, -24]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [0, 2], [2, 7], [7, 8], [8, 9], [9, 15], [8, 10], [10, 0], [0, 11], [10, 12], [12, 13], [7, 14]],
    eyes: [[-58, -24]],
    fx: { idle: 'prowl', atk: 'pounce' },
  },
  taurus: {
    name: 'TAURUS', title: 'THE STORM-EYED BULL', tier: 'boss', lvl: 1, tint: 0xc4915e, eye: 0xff7a45,
    stars: [[-16, 18], [-28, 2], [-38, -14], [-2, 2], [8, -12], [-58, -34], [-74, -52], [26, -34], [40, -56], [30, 4], [58, -2], [80, 10], [66, 30], [70, 52], [4, 36], [0, 58], [28, 34], [30, 56], [48, -24], [54, -28], [58, -22], [52, -18], [58, -30]],
    edges: [[2, 1], [1, 0], [0, 3], [3, 4], [2, 5], [5, 6], [4, 7], [7, 8], [3, 9], [9, 10], [10, 11], [11, 12], [12, 13], [0, 14], [14, 15], [9, 16], [16, 17]],
    eyes: [[-38, -14]],
    fx: { idle: 'lumber', atk: 'charge' },
  },
  scorpius: {
    name: 'SCORPIUS', title: 'THE CRIMSON STING', tier: 'boss', lvl: 2, tint: 0xe87a6b, eye: 0xff3860,
    stars: [[-84, -38], [-66, -52], [-72, -18], [-52, -30], [-36, -22], [-20, -12], [-8, 4], [-2, 20], [4, 36], [14, 50], [30, 58], [48, 56], [62, 46], [70, 30], [64, 14], [50, 6]],
    edges: [[0, 3], [1, 3], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 15]],
    eyes: [[-20, -12], [50, 6]],
    fx: { idle: 'pinch', atk: 'lash' },
  },
  draco: {
    name: 'DRACO', title: 'THE STAR EATER', tier: 'boss', lvl: 2, hp: 130, atk: 18, timer: 4, tint: 0xffc46b, eye: 0xff5e4d,
    stars: [[-92, 42], [-72, 28], [-52, 36], [-32, 22], [-12, 28], [8, 14], [2, -8], [-16, -36], [6, -54], [20, -32], [42, -46], [30, 2], [46, -12], [58, -30], [50, -48], [70, -44], [78, -18], [62, -6], [24, 30], [18, 48], [44, 26], [48, 44]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [6, 9], [9, 10], [5, 11], [11, 12], [12, 13], [13, 14], [13, 15], [13, 16], [16, 17], [11, 18], [18, 19], [11, 20], [20, 21]],
    eyes: [[56, -26]],
    fx: { idle: 'flex', atk: 'breath', curse: 'blackout', ink: 3 },   // the Star Eater eats more
  },
  phoenix: {
    name: 'PHOENIX', title: 'THE FIRST FLAME', tier: 'boss', lvl: 3, hp: 170, atk: 22, timer: 4, tint: 0xffa94d, eye: 0xfff0a8,
    stars: [[0, -58], [14, -62], [-8, -72], [0, -40], [0, -14], [22, -28], [46, -42], [70, -26], [-22, -28], [-46, -42], [-70, -26], [8, 26], [20, 48], [0, 30], [0, 56], [-8, 26], [-20, 48]],
    edges: [[0, 1], [0, 2], [0, 3], [3, 4], [3, 5], [5, 6], [6, 7], [3, 8], [8, 9], [9, 10], [4, 11], [11, 12], [4, 13], [13, 14], [4, 15], [15, 16]],
    eyes: [[5, -56]],
    fx: { idle: 'flex', atk: 'nova', amp: 1.35 },
  },
  centaurus: {
    name: 'CENTAURUS', title: 'THE FIRSTBORN CENTAUR', tier: 'boss', lvl: 4, tint: 0xc9a26b, eye: 0xffe08a,
    stars: [[-40, -62], [-54, -48], [-26, -50], [-8, -56], [12, -64], [30, -72], [-42, -30], [-24, -16], [2, -12], [28, -16], [50, -10], [68, -20], [80, -6], [-34, 4], [-40, 28], [-36, 52], [-14, 4], [-12, 30], [-16, 54], [44, 8], [54, 30], [46, 54], [8, 8]],
    edges: [[0, 1], [0, 2], [1, 6], [2, 6], [2, 3], [3, 4], [4, 5], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [7, 13], [13, 14], [14, 15], [7, 16], [16, 17], [17, 18], [10, 19], [19, 20], [20, 21], [16, 22], [22, 19]],
    eyes: [[-40, -64]],
    fx: { idle: 'lumber', atk: 'charge', amp: 1.2 },
  },
  sagittarius: {
    name: 'SAGITTARIUS', title: 'THE ZENITH ARCHER', tier: 'boss', lvl: 4, hp: 200, atk: 24, timer: 4, tint: 0xff9e58, eye: 0xfff0a8,
    stars: [[10, -58], [-4, -44], [26, -46], [0, -22], [20, -26], [30, -8], [16, 4], [-4, 0], [-10, -12], [-24, -18], [-44, -58], [-56, -38], [-48, -16], [-30, -38], [-70, -44], [44, -14], [66, -8], [80, -18], [90, -4], [2, 18], [-2, 40], [4, 60], [62, 12], [70, 34], [62, 58]],
    edges: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 3], [8, 9], [1, 11], [10, 11], [11, 12], [13, 14], [2, 13], [5, 15], [15, 16], [16, 17], [17, 18], [6, 19], [19, 20], [20, 21], [16, 22], [22, 23], [23, 24]],
    eyes: [[6, -60]],
    fx: { idle: 'flex', amp: 0.7, atk: 'volley', bolts: 5 },
  },
};

// Resolve tiers → stats + the boss flag every consumer already reads.
for (const _id in SS_BEASTS) {
  const _b = SS_BEASTS[_id];
  _b.id = _id;
  _b.boss = _b.tier === 'boss';
  const _c = SS_TIER_CURVE[_b.tier](_b.lvl || 1);
  if (_b.hp == null) _b.hp = _c.hp;
  if (_b.atk == null) _b.atk = _c.atk;
  if (_b.timer == null) _b.timer = _c.timer;
}

/* Campaign: four acts of five fights. Acts draw from tier pools — a slot is
   'b' (basics pool), 'm' (minis pool), 'B' (bosses pool), or a fixed beast id.
   The draw is rolled once per campaign (game.js ssCampaignRoster) and pinned
   in localStorage so chart, battles and checkpoint resume agree; the fixed
   anchors keep the story beats — STRIX, DRACO, PHOENIX, and Act IV's climb of
   ORION → CENTAURUS → SAGITTARIUS, the end-game pair.
   Umbral variants reuse a constellation with new colors and scaled stats —
   mult applies to hp, add to atk. Act names live in strings.js (nameKey). */
const SS_ACTS = [
  {
    nameKey: 'act1', mult: 1, atkAdd: 0, umbral: false,
    slots: ['b', 'b', 'b', 'm', 'strix'],
    basics: ['vulpes', 'lepus', 'delphinus', 'columba', 'lacerta', 'serpens'],
    minis: ['cancer', 'corvus', 'aquila'],
  },
  {
    nameKey: 'act2', mult: 1.35, atkAdd: 2, umbral: false,
    slots: ['b', 'm', 'm', 'B', 'draco'],
    basics: ['serpens', 'cygnus', 'pavo', 'lacerta'],
    minis: ['corvus', 'aranea', 'ursa', 'aquila', 'lupus', 'monoceros'],
    bosses: ['leo', 'taurus'],
  },
  {
    nameKey: 'act3', mult: 1.8, atkAdd: 5, umbral: true,
    slots: ['m', 'm', 'B', 'B', 'phoenix'],
    minis: ['ursa', 'aranea', 'lupus', 'monoceros', 'cetus', 'cassiopeia'],
    bosses: ['strix', 'draco', 'leo', 'taurus', 'scorpius'],
  },
  {
    nameKey: 'act4', mult: 1.8, atkAdd: 6, umbral: false,
    slots: ['m', 'B', 'orion', 'centaurus', 'sagittarius'],
    minis: ['cetus', 'cassiopeia', 'lupus', 'monoceros'],
    bosses: ['leo', 'taurus', 'scorpius', 'draco'],
  },
];
const SS_UMBRAL = { tint: 0x8080a8, eye: 0xff3860, prefix: 'UMBRAL ' };

// Flatten a rolled roster into the fight list Battle marches.
function SS_CAMPAIGN_FIGHTS(roster) {
  const fights = [];
  let k = 0;
  SS_ACTS.forEach((act, ai) => act.slots.forEach((sl, fi) => {
    fights.push({ id: roster[k++], actIdx: ai, mult: act.mult, atkAdd: act.atkAdd, umbral: act.umbral, actStart: fi === 0 });
  }));
  return fights;
}

// Quick Play / Daily: four random lesser beasts then Draco.
const SS_QUICK_POOL = ['vulpes', 'lepus', 'serpens', 'cancer', 'corvus', 'ursa', 'aranea', 'delphinus', 'columba', 'lacerta', 'cygnus', 'pavo', 'aquila'];
const SS_QUICK_BOSS = 'draco';

/* ============================================================
   THE ZODIAC — twelve birth signs, pickable before a campaign.
   Each is a starting character with one modest power that bends
   HOW the climb is played, never a straight power-up. Five signs
   share a constellation with a bestiary beast (beast:) and draw
   its stars; the other seven carry their own hand-placed
   asterisms from the real charts, same 200x160 box as beasts.
   English title/desc are canonical here; other languages carry a
   `zod` map in strings.js (SS_ZOD). Latin sign NAMES never
   translate, like beast names. Element tints color the glyphs.
   ============================================================ */
const SS_ELEMENTS = { fire: 0xffa94d, earth: 0xa8d883, air: 0x9fc4ff, water: 0x6fe0d0 };
const SS_ZODIAC = [
  {
    id: 'aries', name: 'ARIES', title: 'THE RAM', el: 'fire',
    desc: 'Each battle opens with a headlong ram: the beast takes 8.',
    stars: [[-60, -20], [-24, -32], [10, -30], [40, -6], [48, 18]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4]],
  },
  {
    id: 'taurus', name: 'TAURUS', title: 'THE BULL', el: 'earth', beast: 'taurus',
    desc: 'The bull endures: +15 max health at the climb\'s start.',
  },
  {
    id: 'gemini', name: 'GEMINI', title: 'THE TWINS', el: 'air',
    desc: 'Twinned letters: words that use the same letter twice deal +10.',
    stars: [[-28, -58], [30, -52], [-34, -30], [-42, -2], [-48, 26], [-36, 52], [-64, 34], [24, -26], [34, 2], [28, 28], [44, 52], [60, 30]],
    edges: [[0, 2], [2, 3], [3, 4], [4, 5], [4, 6], [1, 7], [7, 8], [8, 9], [9, 10], [9, 11], [2, 7], [3, 8]],
  },
  {
    id: 'cancer', name: 'CANCER', title: 'THE CRAB', el: 'water', beast: 'cancer',
    desc: 'The shell holds: the first strike of every battle deals half.',
  },
  {
    id: 'leo', name: 'LEO', title: 'THE LION', el: 'fire', beast: 'leo',
    desc: 'The roar: words of 6+ letters deal +8.',
  },
  {
    id: 'virgo', name: 'VIRGO', title: 'THE MAIDEN', el: 'earth',
    desc: 'Once per battle, tap your sign, then a tile, to purify it into a new letter.',
    stars: [[-72, 44], [-38, 20], [-10, 4], [18, -8], [2, -34], [-18, -56], [46, -24], [74, -40], [40, 18], [66, 36]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [3, 6], [6, 7], [3, 8], [8, 9]],
  },
  {
    id: 'libra', name: 'LIBRA', title: 'THE SCALES', el: 'air',
    desc: 'The scales: words with vowels and consonants in balance deal +10.',
    stars: [[0, -52], [-52, -16], [44, -24], [-58, 28], [-44, 52], [38, 24], [54, 50]],
    edges: [[0, 1], [0, 2], [1, 2], [1, 3], [3, 4], [2, 5], [5, 6]],
  },
  {
    id: 'scorpio', name: 'SCORPIO', title: 'THE SCORPION', el: 'water', beast: 'scorpius',
    desc: 'Venom builds with every word — the beast suffers it after each cast.',
  },
  {
    id: 'sagittarius', name: 'SAGITTARIUS', title: 'THE ARCHER', el: 'fire', beast: 'sagittarius',
    desc: 'The nocked arrow: SCRY also strikes the beast for 6.',
  },
  {
    id: 'capricorn', name: 'CAPRICORN', title: 'THE SEA-GOAT', el: 'earth',
    desc: 'The climb: words deal +1 for every beast felled this run.',
    stars: [[-72, -30], [-62, -10], [-34, 10], [-2, 26], [30, 26], [56, 8], [70, -24], [40, -20], [-16, -24]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 0]],
  },
  {
    id: 'aquarius', name: 'AQUARIUS', title: 'THE WATER-BEARER', el: 'air',
    desc: 'Once per battle, falling below half health pours the waters: heal 8.',
    stars: [[28, -46], [12, -58], [44, -56], [24, -26], [-8, -22], [-42, -30], [-66, -6], [42, -4], [26, 14], [42, 32], [22, 52], [50, 56]],
    edges: [[1, 0], [2, 0], [0, 3], [3, 4], [4, 5], [5, 6], [3, 7], [7, 8], [8, 9], [9, 10], [10, 11]],
  },
  {
    id: 'pisces', name: 'PISCES', title: 'THE TWIN FISH', el: 'water',
    desc: 'The deep current: words woven at one cast from the strike deal +30%.',
    stars: [[52, 44], [18, 34], [-14, 26], [-44, 22], [-66, 14], [-84, 20], [-86, 36], [-68, 42], [-52, 34], [46, 16], [40, -12], [34, -40], [24, -58], [44, -60]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 3], [0, 9], [9, 10], [10, 11], [11, 12], [12, 13], [13, 11]],
  },
];
const SS_ZODIAC_BY = {};
for (const _z of SS_ZODIAC) SS_ZODIAC_BY[_z.id] = _z;

// rarity: 0 = basic, 1 = rare, 2 = legendary. Rares and legendaries surface
// deeper into the campaign (and at low odds anywhere in quick/daily) — the
// gating curve lives in Battle.sigilChances().
/* THE DRIP (v0.42.0). Twelve of these twenty-four are yours from the first
   night; the other twelve carry a `lock` and are DISCOVERED by playing.
   `lock` is {s, n, how}: `s` names a stat the game already keeps (ssSigilStat
   resolves it — lifetime profile figures, or a cheap counter fed by play),
   `n` is what it must reach, `how` the English sentence (%1 = n; other
   languages carry an `unl` map in strings.js and fall back to this one).
   Two rules the choice of the twelve obeys:
   · EVERY TIER KEEPS MEMBERS. The starting pool is 9 basic + 2 rare + 1
     legendary, not "all the basics" — rollSigilOpts falls DOWNWARD when a
     tier is dry, so the fat tier has to be tier 0, and a new player must
     still be able to meet a rare and a legendary in their first week.
   · THE OPEN TWELVE TEACH, THE LOCKED TWELVE REWARD. What is open needs no
     knowledge of forging, scrying or tile tiers to be worth taking; what is
     locked either pays off a habit (SCRY, long words, overkill) or asks the
     player to already know the board.
   Conditions progress across runs and a LOSS that advanced one counts exactly
   the same — the counters are fed by play, never by winning.
   `lb` marks a sigil that raises single LETTERS' worth: { add, letters:'sret' }
   and/or { add, vowels:true } (the letter's FIRST character decides, so RR
   rides an `r` rune and Qu is q — exactly as the damage math always read it).
   ssSigilLetterAdd (game.js) folds every held lb into one per-letter figure
   that the tile's printed chip, the CAST preview, the blackout's weighing and
   wordDamage all read — one place, so the board can never disagree with the
   cast. Future sigil tiers change `add` here, never the renderer. Word-level
   effects (Ember Quill, the longbow, doublers) are NOT lb — they belong to the
   whole word and never print on a tile.
   `charges` marks a per-battle allowance (Comet Trail: how many scries ride
   free before SCRY hastens the strike again — Skylar 9/1: scry must NEVER
   stop hastening it outright). Granted fresh at every startFight, spent one
   scry at a time, printed as pips on the SCRY button. The coming sigil tiers
   turn only this number (base 1, rare 2, legendary 3 — epic skipped). */
const SS_SIGILS = [
  // ---- basic ----
  { id: 'quill', icon: '❦', rarity: 0, name: 'EMBER QUILL', desc: 'Every word deals +4 damage.' },
  { id: 'choir', icon: '♫', rarity: 0, name: 'VOWEL CHOIR', desc: 'Vowels are worth +2 each.', lb: { vowels: true, add: 2 } },
  { id: 'runes', icon: '✣', rarity: 0, name: 'RIVER RUNES', desc: 'S, R, E and T are worth +2 each.', lb: { letters: 'sret', add: 2 } },
  { id: 'salve', icon: '☾', rarity: 0, name: 'MOON SALVE', desc: 'Words of 5+ letters heal you 4.' },
  { id: 'aegis', icon: '✺', rarity: 0, name: 'AEGIS OF DAWN', desc: '+20 max health, healed now.' },
  { id: 'first', icon: '✧', rarity: 0, name: 'FIRST LIGHT', desc: 'Your first word each battle deals double.' },
  { id: 'hush', icon: '⧗', rarity: 0, name: 'HUSHED HOURGLASS', desc: 'Beasts strike one cast later.' },
  { id: 'comet', icon: '☄', rarity: 0, name: 'COMET TRAIL', desc: 'Your first SCRY each battle does not hasten the strike.', charges: 1, lock: { s: 'scry', n: 20, how: 'Call on SCRY %1 times.' } },
  { id: 'shield', icon: '◈', rarity: 0, name: 'SILVER SHIELD', desc: 'Block the first strike of every battle.' },
  { id: 'leech', icon: '❉', rarity: 0, name: 'DEW DRINKER', desc: 'Every word heals you 1.' },
  { id: 'longbow', icon: '➳', rarity: 0, name: 'STARRY LONGBOW', desc: 'Words of 6+ letters deal +12.', lock: { s: 'w6', n: 8, how: 'Weave %1 words of six letters or more.' } },
  { id: 'gilded', icon: '✹', rarity: 0, name: 'GILDED DAWN', desc: 'Every battle begins with a gilded tile.', lock: { s: 'frg', n: 25, how: 'Forge %1 tiles with long words.' } },
  // ---- rare ----
  { id: 'forge', icon: '❂', rarity: 1, name: 'STAR FORGE', desc: 'Forged tiles come one tier higher.', lock: { s: 'w7', n: 5, how: 'Weave %1 words of seven letters or more.' } },
  { id: 'blood', icon: '✠', rarity: 1, name: 'BLOOD INK', desc: 'Your words +25%. Beast strikes +25%.', lock: { s: 'big', n: 60, how: 'Deal %1 damage with a single word.' } },
  { id: 'tome', icon: '◉', rarity: 1, name: 'WHISPERING TOME', desc: 'The eye ◉ reveals a strong word, once per battle. Tome’s price: −25% final score.', lock: { s: 'fell', n: 30, how: 'Fell %1 star-beasts.' } },
  { id: 'storm', icon: '↯', rarity: 1, name: 'STORMBINDER', desc: 'Every third word you cast strikes twice.', lock: { s: 'wins', n: 3, how: 'Win %1 hunts.' } },
  { id: 'roots', icon: '❧', rarity: 1, name: 'LEYLINE ROOTS', desc: 'Words deal +2 for every sigil you hold.' },
  { id: 'ward', icon: '✥', rarity: 1, name: 'MOONWARD', desc: 'Beast strikes deal 3 less, never below 1.' },
  { id: 'echo', icon: '☍', rarity: 1, name: 'ECHO OF RUIN', desc: 'Overkill damage wounds the next beast.', lock: { s: 'ovk', n: 120, how: 'Spill %1 damage of overkill.' } },
  // ---- legendary ----
  { id: 'feather', icon: '❋', rarity: 2, name: 'PHOENIX FEATHER', desc: 'Once per run, survive death at 1 health.' },
  { id: 'eclipse', icon: '◐', rarity: 2, name: 'THE ECLIPSE', desc: 'Beast strikes deal only half.', lock: { s: 'hit', n: 80, how: 'Weather %1 beast strikes.' } },
  { id: 'nova', icon: '✸', rarity: 2, name: 'CROWN OF NOVAE', desc: 'Words of 7+ letters deal double.', lock: { s: 'w8', n: 1, how: 'Weave a word of eight letters.' } },
  { id: 'verse', icon: '∞', rarity: 2, name: 'THE UNENDING VERSE', desc: 'Words deal +1 for every word woven this run.', lock: { s: 'word', n: 400, how: 'Weave %1 words, lifetime.' } },
  { id: 'meteor', icon: '✽', rarity: 2, name: 'HEART OF THE METEOR', desc: 'Felling a beast restores you to full health.', lock: { s: 'brnk', n: 3, how: 'Fell %1 beasts at ten health or less.' } },
];
const SS_SIG_BY = {};
for (const _s of SS_SIGILS) SS_SIG_BY[_s.id] = _s;

// Achievements — checked against the event bag the battle scene maintains.
const SS_ACH = [
  { id: 'first-blood', icon: '✦', name: 'FIRST BLOOD', desc: 'Fell your first beast.' },
  { id: 'star-caller', icon: '☄', name: 'STAR CALLER', desc: 'Win a Quick Play run.' },
  { id: 'sky-sweeper', icon: '♛', name: 'SKY SWEEPER', desc: 'Complete the Campaign.' },
  { id: 'lexicon-7', icon: '✶', name: 'LEXICON', desc: 'Weave a 7-letter word.' },
  { id: 'grand-weaver', icon: '❂', name: 'GRAND WEAVER', desc: 'Weave an 8-letter word.' },
  { id: 'heavy-hit', icon: '⚡', name: 'STARFALL', desc: 'Deal 60+ damage with one word.' },
  { id: 'untouched', icon: '❈', name: 'UNTOUCHED', desc: 'Fell a beast without being struck that battle.' },
  { id: 'no-scry', icon: '👁', name: 'CLEAR EYES', desc: 'Win a Quick Play without using SCRY.' },
  { id: 'q-mage', icon: 'Q', name: 'QUILLED Q', desc: 'Cast a word using the Qu tile.' },
  { id: 'century', icon: 'C', name: 'CENTURION', desc: 'Cast 100 words, lifetime.' },
  { id: 'daily-devout', icon: '☀', name: 'DAILY DEVOUT', desc: 'Complete a Daily hunt.' },
  { id: 'dragonfall', icon: '🐉', name: 'DRAGONFALL', desc: 'Fell DRACO, the Star Eater.' },
  { id: 'first-flame', icon: '🔥', name: 'THE FIRST FLAME', desc: 'Fell PHOENIX, the First Flame.' },
  { id: 'rival-star', icon: '⚔', name: 'RIVAL STAR', desc: 'Win a versus battle.' },
  { id: 'sky-marshal', icon: '♜', name: 'SKY MARSHAL', desc: 'Win a battleground of 3+ mages.' },
  { id: 'war-weaver', icon: '✷', name: 'WAR WEAVER', desc: 'Cast 25 words in versus, lifetime.' },
  { id: 'sign-born', icon: '✵', name: 'SIGN-BORN', desc: 'Complete the Campaign under a zodiac sign.' },
  { id: 'wheel-walker', icon: '❁', name: 'WHEEL WALKER', desc: 'Clear campaigns under 3 different signs.' },
  { id: 'grand-zodiac', icon: '✪', name: 'THE GRAND ZODIAC', desc: 'Clear a campaign under all 12 signs.' },
  { id: 'star-crossed', icon: '☌', name: 'STAR-CROSSED', desc: 'Fell the beast that wears your own sign.' },
  // the lantern's three marks (v0.40.0). Earned by the streak crossing 7 / 30 /
  // 100 nights, which is also where the lantern itself grows a new dress — so
  // each of these is the ledger's record of a visible change on the meadow.
  { id: 'flame-7', icon: '🕯', name: 'SEVEN NIGHTS', desc: 'Keep the lantern lit seven nights running.' },
  { id: 'flame-30', icon: '🏮', name: 'THE LONG BURN', desc: 'Keep the lantern lit thirty nights running.' },
  { id: 'flame-100', icon: '🌠', name: 'THE COMET CROWN', desc: 'Keep the lantern lit one hundred nights running.' },
];
