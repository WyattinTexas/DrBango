// ═══════════════════════════════════════════════════════════════
// FIXED ENCOUNTER POOLS — each location has specific ghosts
// 175 non-legendary cards distributed across ~31 encounter nodes
// Rarity scales with depth: early = commons, deep = rares/ghost-rares
// v1.1 — added Crossroads pool; fixed pool count comment
// ═══════════════════════════════════════════════════════════════

const ENCOUNTER_POOLS = {
  // ═══════════════════════════════════
  // ROLLING HILLS — gentle, inviting
  // 28 RH cards + ~14 Set 1 commons/uncommons
  // ═══════════════════════════════════

  // -- Toby's neighborhood (easiest) --
  'Sunlit Glade': {
    desc: 'Friendly commons play in the warm light.',
    ghosts: [352,301,444,11,13,8,9,10], // Jimmy, Dylan, Goobs, Villager, Shoo, Buttons, Little Boo, Patrick
    terrain: 'meadow with wildflowers, butterflies, warm golden light'
  },
  'Riverbank': {
    desc: 'Water spirits splash along the creek.',
    ghosts: [419,302,445,12,14,6,7,18], // Boopies, Maximo, Mike, Dupy, Jeffery, Fang Outside, Fang Undercover, Charlie
    terrain: 'riverbank with reeds, stepping stones, gentle current'
  },
  'Flower Field': {
    desc: 'Colorful spirits hide among the petals.',
    ghosts: [409,303,311,16,17,1,5,15], // Nick&Knack, Tweak&Twonk, Pudge, Chip, Boo Brothers, Kodako, Puff, Winston
    terrain: 'vibrant flower field, poppies, daisies, bees buzzing'
  },

  // -- Mid Rolling Hills (uncommons appear) --
  'Ancient Oak': {
    desc: 'Wise spirits nest in the ancient canopy.',
    ghosts: [308,342,426,415,2,3,4,37], // Kaplan, Calvin, Chester, Nyx&Bessie, Nikon, Ancient Librarian, Wanderer, Dealer
    terrain: 'massive oak tree from above, roots spreading wide, acorns'
  },
  'Hilltop Summit': {
    desc: 'Strong winds carry rare spirits.',
    ghosts: [423,310,309,312,34,35,48,49], // Zippa, Granny, Aunt Susan, Timpleton, Grawr, Larry, Opa, Greg
    terrain: 'hilltop clearing, windswept grass, panoramic view'
  },

  // -- Deep Rolling Hills (rares) --
  'Moss Goo Den': {
    desc: 'Ancient spirits guard the Goo.',
    ghosts: [307,447,428,204,417,315,50,46], // Artemis, Prof Hawking, Jasper, Finn, Twyla, Harrison, Jackson, Cave Dweller
    terrain: 'mossy cave entrance, glowing mushrooms, ancient stones'
  },
  'Bramble Thicket': {
    desc: 'Rare spirits hide in the thorns.',
    ghosts: [429,446,430,314,431,40,39,44], // Young Cap, Mable, Gordok, Farmer Jeff, Pal Al, Team Zippy, Castle Guards, Bubble Boys
    terrain: 'dense thorny bushes, hidden clearings, berry patches'
  },

  // ═══════════════════════════════════
  // FROST VALLEY — cold, mysterious
  // 38 FV cards + ~14 Set 1 rares
  // ═══════════════════════════════════

  // -- Valley entrance (FV commons) --
  'Frozen Pond': {
    desc: 'Ice spirits glide beneath the surface.',
    ghosts: [28,23,29,33,27,42,45,47], // Dream Cat, Powder, Sad Sal, Sandwiches, Fredrick, Doc, Cornelius, Hermit
    terrain: 'frozen pond, cracked ice, snow-dusted reeds'
  },
  'Snowdrift Pass': {
    desc: 'Spirits emerge from the blowing snow.',
    ghosts: [25,26,30,24,38,43,36,41], // Cameron, Logey, Tommy Salami, Simon, Alucard, Outlaw, Bill&Bob, Guard Thomas
    terrain: 'narrow mountain pass, snowdrifts, icicles hanging'
  },

  // -- Mid Frost Valley (uncommons) --
  'Crystal Cavern': {
    desc: 'Rare spirits shimmer in crystal light.',
    ghosts: [56,53,58,60,61,63,69,68], // Chad, Bogey, Ashley, Dallas, Suspicious Jeff, Doug, Sonya, Kairan
    terrain: 'ice cave with crystal formations, blue-white glow'
  },
  'Glacial Ridge': {
    desc: 'Powerful spirits patrol the ice ridge.',
    ghosts: [55,54,59,57,31,32,64,71], // Masked Hero, Roger, Mr Filbert, Marcus, Gus, Lou, Sparky, Admiral
    terrain: 'glacier edge, deep crevasses, aurora in sky'
  },
  'Aurora Bridge': {
    desc: 'Northern lights attract mystical spirits.',
    ghosts: [83,84,88,90,85,86,70,72], // Troubling Haters, Wandering Sue, Pale Nimbus, Jeanie, Eloise, Pelter, Katrina, Sky
    terrain: 'ice bridge over chasm, aurora borealis dancing above'
  },

  // -- Deep Frost Valley (rares/ghost-rares) --
  'Permafrost Altar': {
    desc: 'Ancient summoning ground. Only strong spirits.',
    ghosts: [81,82,91,92,89,93,62,73], // Spockles, Antoinette, Calvin&Anna, Gary, Mallow, Bandit Pete, Raditz, Stone Cold
    terrain: 'stone altar frozen in ice, rune carvings, mist'
  },
  'Ice Spire Peak': {
    desc: 'The summit. Ghost-rare spirits rule here.',
    ghosts: [87,103,104,105,106,107,65,66,67], // Zach, Night Master, Skylar, Tyler, King Jay, Piper, Wim, Munch, Snorton
    terrain: 'mountain peak, ice spires, howling wind, stars visible'
  },

  // ═══════════════════════════════════
  // VOLCANIC ISLES — dangerous, fiery
  // 26 VA cards + ~12 Set 1 mixed
  // ═══════════════════════════════════

  // -- Shore & pools (VA commons) --
  'Ashen Shore': {
    desc: 'Embers dance on the volcanic beach.',
    ghosts: [208,209,365,207,77,76,75,74], // Happy Crystal, Dart, Tyson, Hank, City Cyboo, Dark Wing, Flora, Dark Jeff
    terrain: 'black sand beach, glowing embers, waves of heat'
  },
  'Magma Pools': {
    desc: 'Fire spirits bathe in molten rock.',
    ghosts: [304,449,406,343,413,95,99,100], // Ember Force, Carpenter, Fed&Hayden, Boris, Sable, Tabitha, Guardian Fairy, Cyboo
    terrain: 'bubbling lava pools, steam vents, orange glow'
  },

  // -- Mid Volcanic (uncommons/rares) --
  'Obsidian Fields': {
    desc: 'Dark glass hides dangerous spirits.',
    ghosts: [201,203,313,433,450,451,94,101], // Bouril, Benjamin, Sylvia, Lucas, Welder, Foreman, Jenkins, Splinter
    terrain: 'obsidian rock field, sharp edges catching light, smoke'
  },
  'Sulfur Vents': {
    desc: 'Toxic fumes breed powerful spirits.',
    ghosts: [205,403,404,402,416,202,401], // Shade's Shadow, Smudge, Chagrin, Knight Light, Rook, Death Howl, Knight Terror
    terrain: 'sulfur vents, yellow-green gas, crackling heat'
  },

  // -- Deep Volcanic (ghost-rares) --
  'Caldera Basin': {
    desc: 'The volcano\'s heart. Legends dwell here.',
    ghosts: [206,327,345,418], // Zain, Natalia, Red Hunter, Pip
    terrain: 'volcanic caldera, lava lake, heat shimmer, ancient'
  },

  // ═══════════════════════════════════
  // CROSSROADS — neutral mid-map (between Frost Valley and Volcanic Isles)
  // Mixed FV and VI commons/uncommons; thematically "fire meets ice"
  // ═══════════════════════════════════

  'Crossroads': {
    desc: 'Spirits from fire and ice converge at this neutral ground.',
    ghosts: [25,26,29,56,207,209,343,365,58,404,27,33], // Cameron, Logey, Sad Sal, Chad, Hank, Dart, Boris, Tyson, Ashley, Chagrin, Fredrick, Sandwiches
    terrain: 'dirt crossroads, scorched earth on one side, frost on the other, cracked stone path'
  },

  // ═══════════════════════════════════
  // DARK CASTLE — ominous, powerful
  // 27 DC cards
  // ═══════════════════════════════════

  // -- Castle grounds (DC commons) --
  'Shadow Gate': {
    desc: 'Spirits warp through the castle entrance.',
    ghosts: [410,442,437,420,440,19,20], // Mirror Matt, Castle Gardener, Rascals, Lars, Gom Gom Gom, Scallywags, Floop
    terrain: 'massive iron gate, torches, long shadows, gargoyles'
  },
  'Haunted Corridor': {
    desc: 'Echoes of fallen summoners linger.',
    ghosts: [21,22,51,414,424,427,52], // Needle, Ancient One, Nicholas, Chow, Bigsby, Garrick, Hugo
    terrain: 'stone corridor, flickering torches, portraits with eyes'
  },

  // -- Inner castle (rares) --
  'Phantom Gallery': {
    desc: 'Ghost-rare spirits haunt the art gallery.',
    ghosts: [80,436,441,439,79,443], // Bilbo, Princess Shade, Wendy, Lucy's Shadow, Laura, Captain James
    terrain: 'grand gallery, paintings, moonlight through windows'
  },
  'Dark Sanctum': {
    desc: 'The deepest chamber. Only legends.',
    ghosts: [78,435,438,96,448], // Haywire, Willow, Champ, Hector, Harvey
    terrain: 'dark sanctum, purple crystals, arcane circles'
  },

  // -- Final chambers (ghost-rares) --
  'Eclipse Chamber': {
    desc: 'The last summoning ground before Valkin.',
    ghosts: [97,98], // Toby, Redd
    terrain: 'eclipse chamber, total darkness, single beam of moonlight'
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ENCOUNTER_POOLS = ENCOUNTER_POOLS;
}
