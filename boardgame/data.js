// ══════════════════════════════════════════════════════════════════════════════
// DATA — Ghosts, items, events, map structure
// ══════════════════════════════════════════════════════════════════════════════

const IMG = '../tierlist/cards/';

// ── ALL GHOSTS ──
const ALL_GHOSTS = [
  { name:"Hector", file:"hector.jpg", rarity:"ghost-rare", maxHp:6, ability:"Protector", abilityDesc:"Singles beat doubles. +1 damage on singles." },
  { name:"Flora", file:"flora.jpg", rarity:"rare", maxHp:4, ability:"Restore", abilityDesc:"Roll doubles: +2 HP after damage." },
  { name:"Skylar", file:"skylar.jpg", rarity:"ghost-rare", maxHp:7, ability:"Winter Barrage", abilityDesc:"Ice Shards deal +2 damage instead of +1." },
  { name:"King Jay", file:"king_jay.jpg", rarity:"ghost-rare", maxHp:7, ability:"Reflection", abilityDesc:"Lose roll & dice total = 7: reflect all damage." },
  { name:"Piper", file:"piper.jpg", rarity:"ghost-rare", maxHp:6, ability:"Slick Coat", abilityDesc:"-1 enemy die next roll." },
  { name:"Stone Cold", file:"stone_cold.jpg", rarity:"rare", maxHp:7, ability:"One-two-one!", abilityDesc:"Roll double 1's: deal 3X damage." },
  { name:"Wim", file:"wim.jpg", rarity:"rare", maxHp:6, ability:"Slash", abilityDesc:"+5 damage when all dice are odd." },
  { name:"Spockles", file:"spockles.jpg", rarity:"rare", maxHp:6, ability:"Valley Magic", abilityDesc:"Win a roll: gain 2 Ice Shards." },
  { name:"Antoinette", file:"antoinette.jpg", rarity:"rare", maxHp:6, ability:"Grace", abilityDesc:"Roll as many dice as your opponent." },
  { name:"Kairan", file:"kairan.jpg", rarity:"rare", maxHp:3, ability:"Let's Dance", abilityDesc:"Roll doubles: +1 die next roll." },
  { name:"Katrina", file:"katrina.jpg", rarity:"rare", maxHp:5, ability:"Seeker", abilityDesc:"Less HP than enemy: gain 1 HP before rolling." },
  { name:"Hard Luck Snorton", file:"snorton.jpg", rarity:"rare", maxHp:8, ability:"Fissure", abilityDesc:"+5 damage with two 6's." },
  { name:"Pelter", file:"pelter.jpg", rarity:"rare", maxHp:5, ability:"Snowball", abilityDesc:"Doubles gain +2 damage." },
  { name:"Outlaw", file:"outlaw.jpg", rarity:"uncommon", maxHp:5, ability:"Thief", abilityDesc:"Roll doubles: remove 1 opponent die." },
  { name:"Guard Thomas", file:"guard_thomas.jpg", rarity:"uncommon", maxHp:6, ability:"Stoic", abilityDesc:"Below 6 HP: immune to singles." },
  { name:"Bogey", file:"bogey.jpg", rarity:"uncommon", maxHp:5, ability:"Bogus", abilityDesc:"Reflect all damage once per game." },
  { name:"Masked Hero", file:"masked_hero.jpg", rarity:"uncommon", maxHp:5, ability:"Underdog", abilityDesc:"When enemy uses before-roll effect: deal 3." },
  { name:"Chad", file:"chad.jpg", rarity:"uncommon", maxHp:6, ability:"Sploop!", abilityDesc:"On entry, gain 2 Ice Shards." },
  { name:"Marcus", file:"marcus.jpg", rarity:"uncommon", maxHp:7, ability:"Glacial Pounding", abilityDesc:"Take 3+ damage: gain 4 extra dice." },
  { name:"Cave Dweller", file:"cave_dweller.jpg", rarity:"uncommon", maxHp:7, ability:"Lurk", abilityDesc:"Deal 3X damage on first roll win." },
  { name:"Boo Brothers", file:"boo_brothers.jpg", rarity:"common", maxHp:5, ability:"Teamwork", abilityDesc:"Remove 1 die to gain 1 HP." },
  { name:"Patrick", file:"patrick.jpg", rarity:"common", maxHp:3, ability:"Stone Form", abilityDesc:"Don't roll. Opponent singles: negate damage, deal 3." },
  { name:"Nikon", file:"nikon.jpg", rarity:"common", maxHp:6, ability:"Ambush", abilityDesc:"Win first roll: deal triple damage." },
  { name:"Kodako", file:"kodako.jpg", rarity:"common", maxHp:6, ability:"Swift", abilityDesc:"Roll 1-2-3: negate damage, deal 4." },
  { name:"Powder", file:"powder.jpg", rarity:"common", maxHp:5, ability:"Final Gift", abilityDesc:"When defeated, gain 3 Ice Shards." },
  { name:"Simon", file:"simon.jpg", rarity:"common", maxHp:6, ability:"Brew Time", abilityDesc:"Take damage: gain 1 Sacred Fire." },
  { name:"Cameron", file:"cameron.jpg", rarity:"common", maxHp:6, ability:"Unstoppable Force", abilityDesc:"Opponent uses special: +1 die. Damage can't be negated." },
  { name:"Dream Cat", file:"dream_cat.jpg", rarity:"common", maxHp:4, ability:"Jinx", abilityDesc:"Both roll doubles: +1 die next turn." },
  { name:"Sad Sal", file:"sad_sal.jpg", rarity:"common", maxHp:5, ability:"Tough Job", abilityDesc:"Lose a roll: gain 1 Ice Shard." },
  { name:"Tommy Salami", file:"tommy_salami.jpg", rarity:"common", maxHp:6, ability:"Regulator", abilityDesc:"Enemy 5's and 6's reroll low." },
  { name:"Prince Balatron", file:"balatron.jpg", rarity:"legendary", maxHp:6, ability:"Party Time", abilityDesc:"Lose & survive: roll counter die for damage." },
  { name:"Lucy", file:"lucy.jpg", rarity:"legendary", maxHp:8, ability:"Blue Fire", abilityDesc:"Win a roll: +1 bonus damage." },
  { name:"Romy", file:"romy.jpg", rarity:"legendary", maxHp:8, ability:"Valley Guardian", abilityDesc:"Predict a die: if match, +3 damage." },
  { name:"The Mountain King", file:"mountain_king_leg.jpg", rarity:"legendary", maxHp:9, ability:"Beast Mode", abilityDesc:"Doubles deal 2X damage." },
  { name:"Doom", file:"doom.jpg", rarity:"legendary", maxHp:7, ability:"Fiendship", abilityDesc:"+2 bonus damage!" },
  { name:"Shade", file:"shade.jpg", rarity:"legendary", maxHp:5, ability:"Haunt", abilityDesc:"After first roll, opponent takes 1 before each roll." },
].map(g => ({ ...g, hp: g.maxHp }));

const STARTERS = ['Dream Cat', 'Outlaw', 'Wim'];

// Art slot labels — shown as placeholders on the map until real art is dropped in.
// Wyatt: swap the `art` fields to image paths when illustrations are ready.
const NODE_ART = {
  start:  { art: null, label: 'START',    tagline: 'The trail begins',    icon: '✦' },
  battle: { art: null, label: 'BATTLE',   tagline: 'A spirit blocks the way', icon: '⚔' },
  item:   { art: null, label: 'CHEST',    tagline: 'Loot inside',         icon: '◈' },
  event:  { art: null, label: 'MYSTERY',  tagline: 'Fate calls',          icon: '?' },
  rest:   { art: null, label: 'CAMPFIRE', tagline: 'Rest & recover',      icon: '△' },
  boss:   { art: null, label: 'BOSS',     tagline: 'The region tyrant',   icon: '♛' },
};

// ── ITEMS ──
const ITEMS = {
  reroll: { name: 'Reroll Charm', icon: '🎲', desc: 'Reroll 1 of your dice', color: '#67e8f9' },
  heal:   { name: 'Spirit Potion', icon: '💚', desc: '+4 HP to active ghost', color: '#34d399' },
  power:  { name: 'Power Shard', icon: '⚡', desc: '+1 die this roll', color: '#fbbf24' },
  shield: { name: 'Spirit Shield', icon: '🛡️', desc: 'Block first hit in battle', color: '#a78bfa' },
  lucky_dice: { name: 'Lucky Dice', icon: '🍀', desc: 'Reroll losing rolls once per battle', color: '#22c55e' },
};

// ── EVENTS — choices with consequences ──
const EVENTS = [
  {
    title: 'A Wandering Merchant',
    desc: 'A ghostly merchant appears, rattling translucent wares.',
    choices: [
      { text: 'Trade 2 HP for an item', effect: 'trade_hp_item' },
      { text: 'Pass by', effect: 'nothing' },
    ]
  },
  {
    title: 'A Mysterious Shrine',
    desc: 'A glowing shrine hums with spirit energy. You feel drawn to it.',
    choices: [
      { text: 'Pray — restore 3 HP', effect: 'heal_3' },
      { text: 'Smash it — gain a Power Shard', effect: 'gain_power' },
    ]
  },
  {
    title: 'Fork in the Road',
    desc: 'The path splits. One side glitters with frost, the other glows with heat.',
    choices: [
      { text: 'Take the frosty path — gain 2 Ice Shards', effect: 'gain_ice' },
      { text: 'Take the hot path — gain 2 Sacred Fires', effect: 'gain_fire' },
    ]
  },
  {
    title: 'An Old Spirit',
    desc: 'A weary spirit offers wisdom or power.',
    choices: [
      { text: 'Wisdom — reveal all nearby nodes', effect: 'reveal_nodes' },
      { text: 'Power — gain a Reroll Charm', effect: 'gain_reroll' },
    ]
  },
  {
    title: 'Treasure Chest',
    desc: 'A chest sits in the clearing. It could be trapped...',
    choices: [
      { text: 'Open it!', effect: 'chest_gamble' },
      { text: 'Leave it', effect: 'nothing' },
    ]
  },
  {
    title: 'A Fallen Spiritkin',
    desc: 'A wounded spirit lies on the ground. It could join you... or drain you.',
    choices: [
      { text: 'Help them — recruit a random ghost', effect: 'recruit_random' },
      { text: 'Walk away', effect: 'nothing' },
    ]
  },
  {
    title: 'The Gambler\'s Den',
    desc: 'Roll the bones. High roll wins big. Low roll... doesn\'t.',
    choices: [
      { text: 'Roll! (4+ = Power Shard, 3- = lose 2 HP)', effect: 'gamble_roll' },
      { text: 'Too risky', effect: 'nothing' },
    ]
  },
];

// ── REGIONS — each region has a layout of nodes and a boss ──
const REGIONS = [
  {
    name: 'Frost Valley',
    tagline: 'Snowbound pines, frozen rivers, restless spirits',
    theme: {
      bg: 'linear-gradient(180deg, #001020, #002040, #001020)',
      accent: '#38bdf8',
      terrain: 'radial-gradient(ellipse at 50% 20%, rgba(56,189,248,0.18), transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(167,139,250,0.08), transparent 60%)',
      fogColor: 'rgba(103,232,249,0.06)',
    },
    keyArt: null, // [art slot: frost-valley-panorama — 600×180]
    boss: 'Pelter',
    bossHp: 7,
  },
  {
    name: 'Hot Hot Cavern',
    tagline: 'Magma veins, sulfur smoke, old stone gods',
    theme: {
      bg: 'linear-gradient(180deg, #1a0500, #2a0a00, #0a0500)',
      accent: '#f97316',
      terrain: 'radial-gradient(ellipse at 50% 30%, rgba(249,115,22,0.18), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(220,38,38,0.12), transparent 60%)',
      fogColor: 'rgba(249,115,22,0.07)',
    },
    keyArt: null, // [art slot: hot-hot-cavern-panorama — 600×180]
    boss: 'Stone Cold',
    bossHp: 9,
  },
  {
    name: 'Ice Palace',
    tagline: 'Crystal halls, silent thrones, watchful ghosts',
    theme: {
      bg: 'linear-gradient(180deg, #000a1a, #001a2a, #000a1a)',
      accent: '#3b82f6',
      terrain: 'radial-gradient(ellipse at 50% 20%, rgba(59,130,246,0.22), transparent 60%), radial-gradient(ellipse at 30% 80%, rgba(103,232,249,0.1), transparent 60%)',
      fogColor: 'rgba(59,130,246,0.08)',
    },
    keyArt: null, // [art slot: ice-palace-panorama — 600×180]
    boss: 'King Jay',
    bossHp: 9,
  },
  {
    name: 'Dark Castle',
    tagline: 'Black spires, bound spirits, the king who never sleeps',
    theme: {
      bg: 'linear-gradient(180deg, #0a0a2a, #1a0a2a, #0a0a1a)',
      accent: '#8b5cf6',
      terrain: 'radial-gradient(ellipse at 50% 20%, rgba(139,92,246,0.22), transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(236,72,153,0.1), transparent 60%)',
      fogColor: 'rgba(139,92,246,0.08)',
    },
    keyArt: null, // [art slot: dark-castle-panorama — 600×180]
    boss: 'The Mountain King',
    bossHp: 12,
  },
];

// Rarity weights for encounters & rewards by region index
const ENCOUNTER_WEIGHTS = [
  { common: 0.60, uncommon: 0.30, rare: 0.10, 'ghost-rare': 0, legendary: 0 },
  { common: 0.30, uncommon: 0.40, rare: 0.25, 'ghost-rare': 0.05, legendary: 0 },
  { common: 0.10, uncommon: 0.30, rare: 0.40, 'ghost-rare': 0.20, legendary: 0 },
  { common: 0, uncommon: 0.10, rare: 0.40, 'ghost-rare': 0.40, legendary: 0.10 },
];
