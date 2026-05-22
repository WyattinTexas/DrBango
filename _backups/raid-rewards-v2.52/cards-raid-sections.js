const RAID_BOSS_MINIONS = [
  // --- Tyrant minions ---
  {id:9101, name:"War Drummer", rarity:"boss-minion", maxHp:4, art:"../testroom/art/originals/Brock.png",
    ability:"Battle Cadence", abilityDesc:"Sideline: boss deals +1 damage on doubles.",
    bossMinion:true, personality:"tyrant"},
  {id:9102, name:"Shield Bearer", rarity:"boss-minion", maxHp:6, art:"../testroom/art/originals/CastleGuards.png",
    ability:"Phalanx", abilityDesc:"Sideline: boss takes 1 less damage per hit (minimum 1).",
    bossMinion:true, personality:"tyrant"},
  {id:9103, name:"Blood Knight", rarity:"boss-minion", maxHp:5, art:"../testroom/art/originals/DarkFang.png",
    ability:"Siphon", abilityDesc:"Win: boss heals 2 HP from the shared pool.",
    bossMinion:true, personality:"tyrant"},

  // --- Trickster minions ---
  {id:9111, name:"Mimic", rarity:"boss-minion", maxHp:3, art:"../testroom/art/originals/Alucard.png",
    ability:"Copy", abilityDesc:"Sideline: copies the player's sideline ghost passive ability.",
    bossMinion:true, personality:"trickster"},
  {id:9112, name:"Jinxer", rarity:"boss-minion", maxHp:5, art:"../testroom/art/originals/PrincessShade.png",
    ability:"Hex", abilityDesc:"Sideline: player resource generation produces 1 fewer (minimum 0).",
    bossMinion:true, personality:"trickster"},
  {id:9113, name:"Doppelganger", rarity:"boss-minion", maxHp:6, art:"../testroom/art/originals/Shade.png",
    ability:"Mirror Match", abilityDesc:"Rolls the same dice as the player — every round is a tie unless abilities modify.",
    bossMinion:true, personality:"trickster"},

  // --- Swarm Queen minions ---
  {id:9121, name:"Drone", rarity:"boss-minion", maxHp:3, art:"../testroom/art/originals/Cindergrub.png",
    ability:"Expendable", abilityDesc:"No ability. Sacrifice fodder.",
    bossMinion:true, personality:"swarm"},
  {id:9122, name:"Worker", rarity:"boss-minion", maxHp:4, art:"../testroom/art/originals/Beewick.png",
    ability:"Harvest", abilityDesc:"Sideline: boss gains 1 Ice Shard per round.",
    bossMinion:true, personality:"swarm"},
  {id:9123, name:"Soldier", rarity:"boss-minion", maxHp:5, art:"../testroom/art/originals/Champ.png",
    ability:"Formation", abilityDesc:"Doubles deal +2 damage.",
    bossMinion:true, personality:"swarm"},
  {id:9124, name:"Healer Drone", rarity:"boss-minion", maxHp:3, art:"../testroom/art/originals/Cornelius.png",
    ability:"Mend", abilityDesc:"Sideline: boss heals 1 HP from the shared pool per round.",
    bossMinion:true, personality:"swarm"},
  {id:9125, name:"Spitter", rarity:"boss-minion", maxHp:4, art:"../testroom/art/originals/Cyboo.png",
    ability:"Acid Entry", abilityDesc:"Entry: deal 2 damage to player's active ghost.",
    bossMinion:true, personality:"swarm"},

  // --- Glacier minions ---
  {id:9131, name:"Ice Wall", rarity:"boss-minion", maxHp:8, art:"../testroom/art/originals/BubbleBoys.png",
    ability:"Barrier", abilityDesc:"While alive: boss cannot take damage. Must be destroyed first.",
    bossMinion:true, personality:"glacier"},
  {id:9132, name:"Frost Wisp", rarity:"boss-minion", maxHp:3, art:"../testroom/art/originals/Chip.png",
    ability:"Deep Freeze", abilityDesc:"Sideline: Frozen Dice locks player's TWO highest dice instead of one.",
    bossMinion:true, personality:"glacier"},
  {id:9133, name:"Blizzard Elemental", rarity:"boss-minion", maxHp:7, art:"../testroom/art/originals/Millicent.png",
    ability:"Whiteout", abilityDesc:"While active: all player dice are reduced by 1 (minimum 1).",
    bossMinion:true, personality:"glacier"},
  {id:9134, name:"Avalanche", rarity:"boss-minion", maxHp:5, art:"../testroom/art/originals/ancient_one.jpg",
    ability:"Collapse", abilityDesc:"On death: deal 4 damage to player's active ghost.",
    bossMinion:true, personality:"glacier"}
];

const RAID_BOSSES = {
  // ======================== ROLLING HILLS ========================
  raid_timber: {
    id: 'raid_timber',
    name: 'Timber',
    title: 'Dances with Wolves',
    personality: 'tyrant',
    tier: 1, set: 'Rolling Hills',
    requiredBadge: 'dark_fang_slayer', requiredPlayers: 3,
    bossGhost: {
      id: 210, name: 'Timber', maxHp: 18, art: '../testroom/art/timber.jpg',
      ability: 'Howl of the Alpha', abilityDesc: 'Before each roll: remove 1 enemy die. Triples+: deal 1 chip damage to all enemy sideline ghosts.'
    },
    minionsByPhase: { 1: [], 2: [9101], 3: [9101, 9102], 4: [9101, 9103] },
    baseHp: 80, rewardPoints: 50, bonusPoints: 25,
    dialogue: {
      intro: 'The pack answers to no one.',
      phase2: 'You think you can outrun the wolf?',
      phase3: 'The hills belong to ME.',
      phase4: 'AWOOOOOO!',
      defeat: 'The alpha... rests...',
      victory: 'The pack hunts forever.'
    }
  },
  raid_dark_fang: {
    id: 'raid_dark_fang',
    name: 'Dark Fang',
    title: 'The Unseen Predator',
    personality: 'trickster',
    tier: 1, set: 'Rolling Hills',
    requiredBadge: null, requiredPlayers: 2, minPlayers: 1,
    bossGhost: {
      id: 202, name: 'Dark Fang', maxHp: 9, art: '../testroom/art/originals/DarkFang.png',
      ability: 'Pressure', abilityDesc: 'Win: deal +1 damage for each KO\'d ghost this game.'
    },
    minionsByPhase: { 1: [], 2: [], 3: [], 4: [] },
    baseHp: 60, rewardPoints: 50, bonusPoints: 25,
    dialogue: {
      intro: 'I smell fear...',
      phase2: 'Your team is falling apart.',
      phase3: 'No one escapes the dark.',
      phase4: 'THE HUNT ENDS NOW.',
      defeat: 'The shadow... fades...',
      victory: 'Darkness swallows all.'
    }
  },
  raid_jasper: {
    id: 'raid_jasper',
    name: 'Jasper',
    title: 'The Restless Flame',
    personality: 'swarm',
    tier: 1, set: 'Rolling Hills',
    requiredBadge: null, requiredPlayers: 2,
    bossGhost: {
      id: 428, name: 'Jasper', maxHp: 10, art: '../testroom/art/originals/Pickwick.png',
      ability: 'Flame Dive', abilityDesc: 'Win: roll 1 bonus die and deal its value as damage. Jasper takes 1 self-damage. High risk, high reward.'
    },
    minionsByPhase: { 1: [9121, 9122], 2: [9123, 9122], 3: [9124, 9123], 4: [9123, 9125] },
    spawnInterval: { 1: 3, 2: 2, 3: 2, 4: 1 },
    baseHp: 50, rewardPoints: 50, bonusPoints: 25,
    dialogue: {
      intro: 'A wanderer fights hardest when cornered!',
      phase2: 'I have seen every hill and every valley.',
      phase3: 'You cannot stop a force of nature!',
      phase4: 'ONE LAST DIVE!',
      defeat: 'The wanderer... finally rests...',
      victory: 'The road goes ever on.'
    }
  },

  // ======================== FROST VALLEY ========================
  raid_king_jay: {
    id: 'raid_king_jay',
    name: 'King Jay',
    title: 'The Frozen Throne',
    personality: 'glacier',
    tier: 2, set: 'Frost Valley',
    requiredBadge: null, requiredPlayers: 2,
    bossGhost: {
      id: 106, name: 'King Jay', maxHp: 14, art: '../testroom/art/originals/king_jay.jpg',
      ability: 'Reflection', abilityDesc: 'Lose roll & dice total = 7: reflect ALL damage. Permafrost: max 3 damage per hit. Frost Aura: 1 cold damage per round.'
    },
    minionsByPhase: { 1: [9131], 2: [9131, 9132], 3: [9133, 9132], 4: [9134] },
    baseHp: 100, rewardPoints: 100, bonusPoints: 25,
    dialogue: {
      intro: 'The crown of frost answers to no challenger.',
      phase2: 'Your fire grows cold before me.',
      phase3: 'Every kingdom falls to winter.',
      phase4: 'BOW BEFORE THE FROST KING.',
      defeat: 'The crown... melts...',
      victory: 'Winter reigns eternal.'
    }
  },
  raid_romy: {
    id: 'raid_romy',
    name: 'Romy',
    title: 'Seer of the Frozen Vale',
    personality: 'trickster',
    tier: 2, set: 'Frost Valley',
    requiredBadge: 'lucy_slayer', requiredPlayers: 3,
    bossGhost: {
      id: 114, name: 'Romy', maxHp: 20, art: '../testroom/art/originals/romy.jpg',
      ability: 'Valley Guardian', abilityDesc: 'Predicts a die number each round. If any die matches: +3 damage. Mirror Dice: swap 1 die with player after rolling.'
    },
    minionsByPhase: { 1: [9111], 2: [9112], 3: [9112, 9113], 4: [9111, 9112] },
    baseHp: 80, rewardPoints: 100, bonusPoints: 25,
    dialogue: {
      intro: 'I have foreseen your arrival... and your defeat.',
      phase2: 'Every number tells a story.',
      phase3: 'The valley sees ALL.',
      phase4: 'YOUR FATE WAS WRITTEN IN THE ICE.',
      defeat: 'The vision... clears...',
      victory: 'The valley predicted this.'
    }
  },
  raid_mountain_king: {
    id: 'raid_mountain_king',
    name: 'The Mountain King',
    title: 'The Immovable',
    personality: 'tyrant',
    tier: 2, set: 'Frost Valley',
    requiredBadge: null, requiredPlayers: 5,
    bossGhost: {
      id: 110, name: 'The Mountain King', maxHp: 30, art: '../testroom/art/originals/mountain_king_leg.jpg',
      ability: 'Beast Mode', abilityDesc: 'Doubles deal 2X damage. Triples+: deal 2 chip damage to ALL enemy ghosts. On KO: gain 2 Sacred Fire.'
    },
    minionsByPhase: { 1: [], 2: [9101], 3: [9101, 9102], 4: [9103, 9101] },
    baseHp: 120, rewardPoints: 100, bonusPoints: 25,
    dialogue: {
      intro: 'YOU DARE CLIMB MY MOUNTAIN?',
      phase2: 'The peak crushes all who reach it.',
      phase3: 'I AM the mountain!',
      phase4: 'AVALANCHE!',
      defeat: 'The mountain... crumbles...',
      victory: 'The mountain stands forever.'
    }
  },

  // ======================== VOLCANIC ISLES ========================
  raid_pip: {
    id: 'raid_pip',
    name: 'Pip',
    title: 'The Living Ember',
    personality: 'swarm',
    tier: 3, set: 'Volcanic Isles',
    requiredBadge: 'king_jay_slayer', requiredPlayers: 2,
    bossGhost: {
      id: 418, name: 'Pip', maxHp: 11, art: '../testroom/art/originals/Pip.png',
      ability: 'Toasted', abilityDesc: 'Triples+: permanently remove 1 enemy die. +1 die per living minion. Gains 2 Sacred Fires on triples.'
    },
    minionsByPhase: { 1: [9121, 9122], 2: [9123, 9122], 3: [9124, 9123], 4: [9123, 9125] },
    spawnInterval: { 1: 3, 2: 2, 3: 2, 4: 1 },
    baseHp: 100, rewardPoints: 150, bonusPoints: 25,
    dialogue: {
      intro: '*giggle* You wanna play? *giggle*',
      phase2: 'Hehehe! More fire! MORE!',
      phase3: 'Why won\'t you just MELT?!',
      phase4: '*SCREAMING GIGGLE* EVERYTHING BURNS!',
      defeat: '*tiny voice* ...ow...',
      victory: '*delighted spin* Again! Again!'
    }
  },
  raid_humar: {
    id: 'raid_humar',
    name: 'Humar',
    title: 'Herald of the Meteor',
    personality: 'tyrant',
    tier: 3, set: 'Volcanic Isles',
    requiredBadge: 'king_jay_slayer', requiredPlayers: 3,
    bossGhost: {
      id: 336, name: 'Humar', maxHp: 16, art: '../testroom/art/humar.jpg',
      ability: 'Meteor', abilityDesc: 'Win: opponent takes 2 damage before their next roll. Gain 1 Burn. On KO: gain 2 Sacred Fire.'
    },
    minionsByPhase: { 1: [9101], 2: [9101, 9103], 3: [9103, 9102], 4: [9103, 9101] },
    baseHp: 100, rewardPoints: 150, bonusPoints: 25,
    dialogue: {
      intro: 'The blue flame does not forgive.',
      phase2: 'Feel the heat of a thousand suns.',
      phase3: 'The isles burn at my command.',
      phase4: 'METEOR SHOWER!',
      defeat: 'The flame... dims...',
      victory: 'The volcano never sleeps.'
    }
  },
  raid_nerina: {
    id: 'raid_nerina',
    name: 'Nerina',
    title: 'Terror of the Depths',
    personality: 'glacier',
    tier: 3, set: 'Volcanic Isles',
    requiredBadge: 'heart_of_the_hills', requiredPlayers: 5,
    bossGhost: {
      id: 306, name: 'Nerina', maxHp: 35, art: '../testroom/art/the_deep.jpg',
      ability: 'Leviathan', abilityDesc: 'Entry: deal 3 damage. Permafrost: max 3 damage per hit. Frost Aura: 1 damage per round. 9 HP base — a true titan.'
    },
    minionsByPhase: { 1: [9131], 2: [9131, 9132], 3: [9133, 9132], 4: [9134, 9134] },
    baseHp: 120, rewardPoints: 150, bonusPoints: 25,
    dialogue: {
      intro: 'The deep calls... and it is HUNGRY.',
      phase2: 'You are drowning and you don\'t even know it.',
      phase3: 'The ocean swallows kingdoms.',
      phase4: 'LEVIATHAN RISES!',
      defeat: 'The tide... retreats...',
      victory: 'The deep claims all.'
    }
  },

  // ======================== DARK CASTLE ========================
  raid_lucy: {
    id: 'raid_lucy',
    name: 'Lucy',
    title: 'Warden of the Blue Flame',
    personality: 'trickster',
    tier: 4, set: 'Dark Castle',
    requiredBadge: 'dark_castle_key', requiredPlayers: 2,
    bossGhost: {
      id: 108, name: 'Lucy', maxHp: 16, art: '../testroom/art/originals/lucy.jpg',
      ability: 'Blue Fire', abilityDesc: 'Win: gain 1 Sacred Fire. Mirror Dice: swap 1 die. Steal 1 resource on win. Sacred Fires deal double damage.'
    },
    minionsByPhase: { 1: [9111], 2: [9112, 9113], 3: [9113, 9112], 4: [9111, 9113] },
    baseHp: 120, rewardPoints: 200, bonusPoints: 25,
    dialogue: {
      intro: 'Welcome to the castle. You won\'t be leaving.',
      phase2: 'The blue fire sees through all deception.',
      phase3: 'Your resources feed MY flames.',
      phase4: 'THE CASTLE BURNS BLUE.',
      defeat: 'The fire... goes out...',
      victory: 'The castle stands. The fire burns.'
    }
  },
  raid_shade: {
    id: 'raid_shade',
    name: 'Shade',
    title: 'The Endless Whisper',
    personality: 'glacier',
    tier: 4, set: 'Dark Castle',
    requiredBadge: 'dark_castle_key', requiredPlayers: 2,
    bossGhost: {
      id: 111, name: 'Shade', maxHp: 12, art: '../testroom/art/originals/shade.jpg',
      ability: 'Haunt', abilityDesc: 'Before EVERY roll: opponent takes 2 damage. Permafrost: max 2 damage per hit. The tick damage is relentless.'
    },
    minionsByPhase: { 1: [9131], 2: [9131, 9132], 3: [9133, 9134], 4: [9134, 9134] },
    baseHp: 100, rewardPoints: 200, bonusPoints: 25,
    dialogue: {
      intro: '...you shouldn\'t have come here...',
      phase2: '*whisper* ...it hurts, doesn\'t it...',
      phase3: 'The darkness is all that remains.',
      phase4: 'HAUNT. HAUNT. HAUNT.',
      defeat: '...finally... silence...',
      victory: 'The haunting never ends.'
    }
  },
  raid_bigsby: {
    id: 'raid_bigsby',
    name: 'Bigsby',
    title: 'The Omen Bearer',
    personality: 'swarm',
    tier: 4, set: 'Dark Castle',
    requiredBadge: 'dark_castle_key', requiredPlayers: 3,
    bossGhost: {
      id: 424, name: 'Bigsby', maxHp: 10, art: '../testroom/art/originals/Digby.png',
      ability: 'Omen', abilityDesc: 'Win: deal +1 damage. Moonstone use triggers Doom transformation. +1 die per living minion.'
    },
    minionsByPhase: { 1: [9121, 9122], 2: [9123, 9122], 3: [9124, 9123], 4: [9123, 9125] },
    spawnInterval: { 1: 3, 2: 2, 3: 2, 4: 1 },
    baseHp: 100, rewardPoints: 200, bonusPoints: 25,
    dialogue: {
      intro: 'I have dug through the dark... and found only doom.',
      phase2: 'The omen was clear. You should not have come.',
      phase3: 'Doom stirs beneath the castle.',
      phase4: 'THE OMEN IS FULFILLED!',
      defeat: 'The darkness... recedes...',
      victory: 'The omen always comes true.'
    }
  },

  // ======================== THE DARK SPIRE ========================
  raid_valkin: {
    id: 'raid_valkin',
    name: 'Valkin the Grand',
    title: 'The Corruptor',
    personality: 'tyrant',
    tier: 5, set: 'The Dark Spire',
    requiredBadge: 'dark_spire_key', requiredPlayers: 3,
    bossGhost: {
      id: 9012, name: 'Valkin the Grand', maxHp: 25, art: '../testroom/art/originals/ValkinTheGrand.png',
      ability: 'Grand Dominion', abilityDesc: 'Doubles deal 3X damage. Triples+: deal 3 chip to ALL enemies. On KO: gain 3 Sacred Fire. The final boss.'
    },
    minionsByPhase: { 1: [9101, 9102], 2: [9101, 9103], 3: [9103, 9102], 4: [9103, 9103] },
    baseHp: 150, rewardPoints: 300, bonusPoints: 50,
    dialogue: {
      intro: 'So... the little spirits have come to challenge the Grand.',
      phase2: 'I have ruled this castle for millennia.',
      phase3: 'You are NOTHING before my dominion.',
      phase4: 'I. AM. VALKIN. THE. GRAND.',
      defeat: 'The castle... my castle... impossible...',
      victory: 'The Grand reigns supreme. As always.'
    }
  }
};

// Badge definitions for raid progression
// Non-linear gating: Rolling Hills → Frost Valley/Volcanic Isles → Dark Castle → Dark Spire
// Cross-region gates: Lucy's badge unlocks Romy, Heart of the Hills unlocks Nerina
const RAID_BADGES = {
  // Rolling Hills badges (open)
  timber_slayer:     { name: 'Dances with Wolves', icon: '&#x1F43A;', boss: 'raid_timber', tier: 1 },
  dark_fang_slayer:  { name: 'Fang', icon: '&#x1F3D1;', boss: 'raid_dark_fang', tier: 1 },
  jasper_slayer:     { name: 'Trail Blazer', icon: '&#x1F525;', boss: 'raid_jasper', tier: 1 },
  heart_of_the_hills: { name: 'Heart of the Hills', icon: '&#x1F33F;', requires: ['timber_slayer', 'dark_fang_slayer', 'jasper_slayer'], tier: 1 },

  // Frost Valley badges (King Jay + MK open; Romy requires Lucy's badge)
  king_jay_slayer:   { name: 'Ice Scepter', icon: '&#x1F451;', boss: 'raid_king_jay', tier: 2 },
  mountain_king_slayer: { name: 'Mountainbreaker', icon: '&#x26F0;', boss: 'raid_mountain_king', tier: 2 },
  romy_slayer:       { name: 'Veil Piercer', icon: '&#x1F52E;', boss: 'raid_romy', tier: 2 },
  frostborne:        { name: 'Valley Hero', icon: '&#x2744;', requires: ['king_jay_slayer', 'mountain_king_slayer', 'romy_slayer'], tier: 2 },

  // Volcanic Isles badges (Pip+Humar need Mountainbreaker; Nerina needs Heart of the Hills)
  pip_slayer:        { name: 'Smoldering', icon: '&#x1F432;', boss: 'raid_pip', tier: 3 },
  humar_slayer:      { name: 'Meteorfall', icon: '&#x2604;', boss: 'raid_humar', tier: 3 },
  nerina_slayer:     { name: 'The Depths', icon: '&#x1F30A;', boss: 'raid_nerina', tier: 3 },
  dark_castle_key:   { name: 'Dark Castle Key', icon: '&#x1F5DD;', requires: ['pip_slayer', 'humar_slayer', 'nerina_slayer'], tier: 3 },

  // Dark Castle badges (all require Dark Castle Key)
  lucy_slayer:       { name: 'Blue Flame', icon: '&#x1F56F;', boss: 'raid_lucy', tier: 4 },
  shade_slayer:      { name: 'Shady Cloak', icon: '&#x1F47B;', boss: 'raid_shade', tier: 4 },
  bigsby_slayer:     { name: 'Doom Denied', icon: '&#x1F573;', boss: 'raid_bigsby', tier: 4 },
  dark_spire_key:    { name: 'Dark Spire Key', icon: '&#x1F3F0;', requires: ['lucy_slayer', 'shade_slayer', 'bigsby_slayer'], tier: 4 },

  // The Dark Spire — final tier (requires Dark Spire Key)
  valkin_slayer:     { name: 'The Grand', icon: '&#x2694;', boss: 'raid_valkin', tier: 5 },

  // Ultimate — the title Toby's grandfather held
  spiritkin_grand_master: { name: 'Spiritkin Grand Master', icon: '&#x1F31F;', requires: ['heart_of_the_hills', 'frostborne', 'dark_castle_key', 'dark_spire_key', 'valkin_slayer'] }
};

// Raid shop items
const RAID_SHOP_ITEMS = [
  { id: 'pack_spirit', name: 'Spirit Pack', type: 'pack', cost: 150, desc: '5 cards, standard rarity weights' },
  { id: 'pack_premium', name: 'Premium Spirit Pack', type: 'pack', cost: 300, desc: '5 cards, guaranteed rare+' },
  { id: 'pack_legendary', name: 'Legendary Pack', type: 'pack', cost: 800, desc: '3 cards, guaranteed legendary' },
  { id: 'pack_frost', name: 'Frost Valley Pack', type: 'pack', cost: 200, set: 'Frost Valley', desc: '5 Frost Valley cards' },
  { id: 'pack_volcanic', name: 'Volcanic Isles Pack', type: 'pack', cost: 200, set: 'Volcanic Isles', desc: '5 Volcanic Isles cards' },
  { id: 'pack_rolling', name: 'Rolling Hills Pack', type: 'pack', cost: 200, set: 'Rolling Hills', desc: '5 Rolling Hills cards' },
  { id: 'pack_dark', name: 'Dark Castle Pack', type: 'pack', cost: 200, set: 'Dark Castle', desc: '5 Dark Castle cards' }
];
