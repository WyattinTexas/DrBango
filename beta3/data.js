'use strict';
/* ============================================================
   STARSPELL data — beasts, acts, sigils, achievements.
   Constellations are hand-authored star points in a 200x160 box
   centered on origin; edges are index pairs; eyes glow + pulse.

   fx: presence + attack, all archetype-driven (ssBeastFx in game.js).
   New beasts pick from the shared archetypes rather than getting
   hand-soldered effects:
     idle — prowl · bob · coil · pinch · headturn · lumber · ripple · flex
     atk  — pounce · slam · lash · snap · swoop · breath · nova
   Optional tuning fields: hops (pounce), strands (lash), amp (flex).
   ============================================================ */

const SS_BEASTS = {
  vulpes: {
    name: 'VULPES', title: 'THE EMBER FOX', hp: 30, atk: 8, timer: 4, tint: 0xffb066, eye: 0xffd23e,
    stars: [[-78, 18], [-58, 2], [-38, 10], [-20, -2], [2, -10], [20, -14], [38, -24], [34, -44], [56, -40], [54, -22], [64, -14], [46, -6], [26, 16], [30, 34], [-8, 16], [-6, 34]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 6], [5, 12], [12, 13], [3, 14], [14, 15]],
    eyes: [[46, -22]],
    fx: { idle: 'prowl', atk: 'pounce' },
  },
  lepus: {
    name: 'LEPUS', title: 'THE MOONLIT HARE', hp: 38, atk: 9, timer: 4, tint: 0xbfe8c9, eye: 0xa8ffc4,
    stars: [[-10, -64], [14, -60], [-2, -38], [8, -30], [26, -26], [0, -4], [8, 18], [-28, -18], [-52, -6], [-58, 16], [-36, 34], [-66, -14]],
    edges: [[0, 2], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [5, 7], [7, 8], [8, 9], [9, 10], [8, 11]],
    eyes: [[12, -32]],
    fx: { idle: 'bob', atk: 'pounce', hops: 2 },
  },
  serpens: {
    name: 'SERPENS', title: 'THE TIDE SERPENT', hp: 48, atk: 10, timer: 3, tint: 0x6fe0d0, eye: 0x9ffcee,
    stars: [[-84, 32], [-62, 14], [-40, 28], [-18, 10], [4, 24], [26, 6], [46, 18], [60, 0], [68, -20], [58, -40], [42, -34], [74, -34]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [9, 11]],
    eyes: [[52, -38], [64, -38]],
    fx: { idle: 'coil', atk: 'lash' },
  },
  cancer: {
    name: 'CANCER', title: 'THE GLOOM CRAB', hp: 62, atk: 12, timer: 3, tint: 0xc79af5, eye: 0xff7ad9,
    stars: [[-20, 0], [0, -12], [20, 0], [14, 16], [-14, 16], [-38, -8], [-60, -20], [-76, -8], [-88, -20], [-72, -34], [38, -8], [60, -20], [76, -8], [88, -20], [72, -34], [-26, 26], [-34, 44], [0, 28], [0, 46], [26, 26], [34, 44], [-8, -24], [8, -24]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5], [5, 6], [6, 7], [7, 8], [7, 9], [2, 10], [10, 11], [11, 12], [12, 13], [12, 14], [4, 15], [15, 16], [3, 17], [17, 18], [3, 19], [19, 20], [1, 21], [1, 22]],
    eyes: [[-8, -28], [8, -28]],
    fx: { idle: 'pinch', atk: 'snap' },
  },
  corvus: {
    name: 'CORVUS', title: 'THE HOLLOW RAVEN', hp: 58, atk: 12, timer: 3, tint: 0x9a86e8, eye: 0xf2f2ff,
    stars: [[48, -30], [66, -22], [30, -24], [8, -10], [-28, 4], [-46, 14], [-42, -4], [2, -40], [-18, -56], [-40, -62], [8, 14], [-8, 30], [-28, 40]],
    edges: [[0, 1], [0, 2], [2, 3], [3, 4], [4, 5], [4, 6], [2, 7], [7, 8], [8, 9], [3, 10], [10, 11], [11, 12]],
    eyes: [[50, -34]],
    fx: { idle: 'headturn', atk: 'swoop' },
  },
  ursa: {
    name: 'URSA', title: 'THE WINTER BEAR', hp: 76, atk: 14, timer: 3, tint: 0xd6a86b, eye: 0xffd23e,
    stars: [[58, -6], [44, -20], [38, -32], [16, -30], [-8, -38], [-38, -28], [-56, -10], [-48, 14], [-42, 34], [-8, 8], [22, 12], [26, 34], [48, 6]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [6, 9], [9, 10], [10, 11], [0, 12], [12, 9]],
    eyes: [[46, -16]],
    fx: { idle: 'lumber', atk: 'slam' },
  },
  aranea: {
    name: 'ARANEA', title: 'THE SILK WIDOW', hp: 70, atk: 13, timer: 3, tint: 0xba6be0, eye: 0xff4d6b,
    stars: [[10, -14], [-14, 6], [26, -30], [44, -44], [32, -12], [56, -16], [30, 6], [52, 18], [18, 18], [28, 38], [-30, -24], [-46, -40], [-36, -4], [-58, -6], [-32, 14], [-48, 28], [-22, 26], [-28, 46], [18, -26], [6, -28]],
    edges: [[0, 1], [0, 2], [2, 3], [0, 4], [4, 5], [0, 6], [6, 7], [1, 8], [8, 9], [1, 10], [10, 11], [1, 12], [12, 13], [1, 14], [14, 15], [1, 16], [16, 17], [0, 18], [0, 19]],
    eyes: [[8, -18], [14, -16]],
    fx: { idle: 'ripple', atk: 'lash', strands: 3 },
  },
  strix: {
    name: 'STRIX', title: 'THE VOID OWL', hp: 85, atk: 14, timer: 3, tint: 0x9fb4ff, eye: 0xffe08a, boss: true,
    stars: [[0, -50], [28, -40], [40, -12], [28, 16], [0, 26], [-28, 16], [-40, -12], [-28, -40], [-38, -58], [38, -58], [0, 4], [-8, 14], [8, 14], [-52, 0], [-72, 22], [-58, 40], [52, 0], [72, 22], [58, 40], [-14, 52], [14, 52]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [7, 8], [1, 9], [10, 11], [10, 12], [6, 13], [13, 14], [14, 15], [2, 16], [16, 17], [17, 18], [4, 19], [4, 20]],
    eyes: [[-14, -18], [14, -18]],
    fx: { idle: 'headturn', atk: 'swoop' },
  },
  draco: {
    name: 'DRACO', title: 'THE STAR EATER', hp: 130, atk: 18, timer: 4, tint: 0xffc46b, eye: 0xff5e4d, boss: true,
    stars: [[-92, 42], [-72, 28], [-52, 36], [-32, 22], [-12, 28], [8, 14], [2, -8], [-16, -36], [6, -54], [20, -32], [42, -46], [30, 2], [46, -12], [58, -30], [50, -48], [70, -44], [78, -18], [62, -6], [24, 30], [18, 48], [44, 26], [48, 44]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [6, 9], [9, 10], [5, 11], [11, 12], [12, 13], [13, 14], [13, 15], [13, 16], [16, 17], [11, 18], [18, 19], [11, 20], [20, 21]],
    eyes: [[56, -26]],
    fx: { idle: 'flex', atk: 'breath' },
  },
  phoenix: {
    name: 'PHOENIX', title: 'THE FIRST FLAME', hp: 170, atk: 22, timer: 4, tint: 0xffa94d, eye: 0xfff0a8, boss: true,
    stars: [[0, -58], [14, -62], [-8, -72], [0, -40], [0, -14], [22, -28], [46, -42], [70, -26], [-22, -28], [-46, -42], [-70, -26], [8, 26], [20, 48], [0, 30], [0, 56], [-8, 26], [-20, 48]],
    edges: [[0, 1], [0, 2], [0, 3], [3, 4], [3, 5], [5, 6], [6, 7], [3, 8], [8, 9], [9, 10], [4, 11], [11, 12], [4, 13], [13, 14], [4, 15], [15, 16]],
    eyes: [[5, -56]],
    fx: { idle: 'flex', atk: 'nova', amp: 1.35 },
  },
};

// Campaign: three acts. Umbral variants reuse a constellation with new colors
// and scaled stats — mult applies to hp, add to atk.
const SS_ACTS = [
  {
    name: 'ACT I · THE MEADOW SKY', mult: 1, atkAdd: 0, umbral: false,
    fights: ['vulpes', 'lepus', 'serpens', 'cancer', 'strix'],
  },
  {
    name: 'ACT II · THE DEEP NIGHT', mult: 1.35, atkAdd: 2, umbral: false,
    fights: ['corvus', 'aranea', 'ursa', 'serpens', 'draco'],
  },
  {
    name: 'ACT III · THE CROWN OF DAWN', mult: 1.8, atkAdd: 5, umbral: true,
    fights: ['cancer', 'strix', 'ursa', 'draco', 'phoenix'],
  },
];
const SS_UMBRAL = { tint: 0x8080a8, eye: 0xff3860, prefix: 'UMBRAL ' };

// Quick Play / Daily: four random lesser beasts then Draco.
const SS_QUICK_POOL = ['vulpes', 'lepus', 'serpens', 'cancer', 'corvus', 'ursa', 'aranea'];
const SS_QUICK_BOSS = 'draco';

// rarity: 0 = basic, 1 = rare, 2 = legendary. Rares and legendaries surface
// deeper into the campaign (and at low odds anywhere in quick/daily) — the
// gating curve lives in Battle.sigilChances().
const SS_SIGILS = [
  // ---- basic ----
  { id: 'quill', icon: '❦', rarity: 0, name: 'EMBER QUILL', desc: 'Every word deals +4 damage.' },
  { id: 'choir', icon: '♫', rarity: 0, name: 'VOWEL CHOIR', desc: 'Vowels are worth +2 each.' },
  { id: 'runes', icon: '✣', rarity: 0, name: 'RIVER RUNES', desc: 'S, R, E and T are worth +2 each.' },
  { id: 'salve', icon: '☾', rarity: 0, name: 'MOON SALVE', desc: 'Words of 5+ letters heal you 4.' },
  { id: 'aegis', icon: '✺', rarity: 0, name: 'AEGIS OF DAWN', desc: '+20 max health, healed now.' },
  { id: 'first', icon: '✧', rarity: 0, name: 'FIRST LIGHT', desc: 'Your first word each battle deals double.' },
  { id: 'hush', icon: '⧗', rarity: 0, name: 'HUSHED HOURGLASS', desc: 'Beasts strike one cast later.' },
  { id: 'comet', icon: '☄', rarity: 0, name: 'COMET TRAIL', desc: 'SCRY no longer hastens the strike.' },
  { id: 'shield', icon: '◈', rarity: 0, name: 'SILVER SHIELD', desc: 'Block the first strike of every battle.' },
  { id: 'leech', icon: '❉', rarity: 0, name: 'DEW DRINKER', desc: 'Every word heals you 1.' },
  { id: 'longbow', icon: '➳', rarity: 0, name: 'STARRY LONGBOW', desc: 'Words of 6+ letters deal +12.' },
  { id: 'gilded', icon: '✹', rarity: 0, name: 'GILDED DAWN', desc: 'Every battle begins with a gilded tile.' },
  // ---- rare ----
  { id: 'forge', icon: '❂', rarity: 1, name: 'STAR FORGE', desc: 'Forged tiles come one tier higher.' },
  { id: 'blood', icon: '✠', rarity: 1, name: 'BLOOD INK', desc: 'Your words +25%. Beast strikes +25%.' },
  { id: 'tome', icon: '◉', rarity: 1, name: 'WHISPERING TOME', desc: 'The eye ◉ reveals a strong word, once per battle.' },
  { id: 'storm', icon: '↯', rarity: 1, name: 'STORMBINDER', desc: 'Every third word you cast strikes twice.' },
  { id: 'roots', icon: '❧', rarity: 1, name: 'LEYLINE ROOTS', desc: 'Words deal +2 for every sigil you hold.' },
  { id: 'ward', icon: '✥', rarity: 1, name: 'MOONWARD', desc: 'Beast strikes deal 3 less, never below 1.' },
  { id: 'echo', icon: '☍', rarity: 1, name: 'ECHO OF RUIN', desc: 'Overkill damage wounds the next beast.' },
  // ---- legendary ----
  { id: 'feather', icon: '❋', rarity: 2, name: 'PHOENIX FEATHER', desc: 'Once per run, survive death at 1 health.' },
  { id: 'eclipse', icon: '◐', rarity: 2, name: 'THE ECLIPSE', desc: 'Beast strikes deal only half.' },
  { id: 'nova', icon: '✸', rarity: 2, name: 'CROWN OF NOVAE', desc: 'Words of 7+ letters deal double.' },
  { id: 'verse', icon: '∞', rarity: 2, name: 'THE UNENDING VERSE', desc: 'Words deal +1 for every word woven this run.' },
  { id: 'meteor', icon: '✽', rarity: 2, name: 'HEART OF THE METEOR', desc: 'Felling a beast restores you to full health.' },
];

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
  { id: 'first-flame', icon: '🔥', name: 'THE FIRST FLAME', desc: 'Fell PHOENIX and finish the story.' },
  { id: 'rival-star', icon: '⚔', name: 'RIVAL STAR', desc: 'Win a versus battle.' },
  { id: 'sky-marshal', icon: '♜', name: 'SKY MARSHAL', desc: 'Win a battleground of 3+ mages.' },
  { id: 'war-weaver', icon: '✷', name: 'WAR WEAVER', desc: 'Cast 25 words in versus, lifetime.' },
];
