// ══════════════════════════════════════════════════════════
//  TALENT TREE DATA + ALLOCATION LOGIC
//  Scaling costs: Tier 0=1pt, Tier 1=2pt, Tier 2=3pt, Tier 3=4pt
//  Per tree: (3×1 + 2×2 + 1×3 + 1×4) × 3 branches = 42 pts to max
//  Cap: 120 pts = master 2 trees + ~85% of a 3rd
// ══════════════════════════════════════════════════════════

const CLASS_TREES = {

  // ═══════════════════════════════════════════════════════
  //  FORTUNE TELLER (base) → Oracle, Mystic, Enchanter
  // ═══════════════════════════════════════════════════════

  fortune_teller: {
    name: 'Fortune Teller',
    desc: 'Bestow fortunes upon other players and yourself. Mastery unlocks Oracle, Mystic & Enchanter.',
    color: '#44bbff',
    branches: ['Duration', 'Power', 'Resonance'],
    talents: [
      // Branch 0: Duration
      { id: 'ft_dur_1', branch: 0, tier: 0, name: 'Extended Fortune',
        desc: '+5 min fortune duration per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'ft_dur_2', branch: 0, tier: 1, name: 'Enduring Aura',
        desc: 'Fortunes persist through one KO', cost: 2, maxRank: 2, prereq: 'ft_dur_1' },
      { id: 'ft_dur_3', branch: 0, tier: 2, name: 'Persistent Ward',
        desc: 'Fortunes refresh 50% duration on battle win', cost: 3, maxRank: 1, prereq: 'ft_dur_2' },
      { id: 'ft_dur_4', branch: 0, tier: 3, name: 'Eternal Fortune',
        desc: 'Fortunes last 1 hour', cost: 4, maxRank: 1, prereq: 'ft_dur_3' },
      // Branch 1: Power
      { id: 'ft_pow_1', branch: 1, tier: 0, name: 'Potent Fortune',
        desc: '+1 Lucky Stone on fortune per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'ft_pow_2', branch: 1, tier: 1, name: 'Battle Surge',
        desc: 'Fortune grants +1 damage for all rolls after the first', cost: 2, maxRank: 2, prereq: 'ft_pow_1' },
      { id: 'ft_pow_3', branch: 1, tier: 2, name: 'Sacrifice Roll',
        desc: 'Fortune removes 1 die from first roll but +2 damage rest of battle', cost: 3, maxRank: 1, prereq: 'ft_pow_2' },
      { id: 'ft_pow_4', branch: 1, tier: 3, name: 'Warcry',
        desc: 'Fortune grants +1 to all dice rolls for the entire battle', cost: 4, maxRank: 1, prereq: 'ft_pow_3' },
      // Branch 2: Resonance
      { id: 'ft_res_1', branch: 2, tier: 0, name: 'Spirit Link',
        desc: '+10% Fortune XP per unique player blessed per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'ft_res_2', branch: 2, tier: 1, name: 'Aura Cascade',
        desc: 'Blessing a player also fortunes their active spiritkin', cost: 2, maxRank: 2, prereq: 'ft_res_1' },
      { id: 'ft_res_3', branch: 2, tier: 2, name: 'Group Blessing',
        desc: 'Fortune hits 2 nearby players at once', cost: 3, maxRank: 1, prereq: 'ft_res_2' },
      { id: 'ft_res_4', branch: 2, tier: 3, name: 'Resonance Field',
        desc: 'All players in your region get a minor fortune passively', cost: 4, maxRank: 1, prereq: 'ft_res_3' },
    ],
  },

  oracle: {
    name: 'Oracle',
    desc: 'See what others cannot. Predict events, find hidden treasures, reveal secrets.',
    color: '#66ccff',
    requiresTree: 'fortune_teller',
    branches: ['Foresight', 'Divination', 'Prophecy'],
    talents: [
      { id: 'orc_for_1', branch: 0, tier: 0, name: 'Premonition',
        desc: 'See the next wild encounter\'s spiritkin before it spawns', cost: 1, maxRank: 3, prereq: null },
      { id: 'orc_for_2', branch: 0, tier: 1, name: 'Battle Vision',
        desc: 'Preview enemy dice rolls 1 turn ahead', cost: 2, maxRank: 2, prereq: 'orc_for_1' },
      { id: 'orc_for_3', branch: 0, tier: 2, name: 'Fate Weaver',
        desc: 'Reroll one die per battle', cost: 3, maxRank: 1, prereq: 'orc_for_2' },
      { id: 'orc_for_4', branch: 0, tier: 3, name: 'Omniscience',
        desc: 'See all hidden objects and spiritkin in your region', cost: 4, maxRank: 1, prereq: 'orc_for_3' },
      { id: 'orc_div_1', branch: 1, tier: 0, name: 'Treasure Sense',
        desc: 'Detect hidden loot within a larger radius per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'orc_div_2', branch: 1, tier: 1, name: 'Omen Reader',
        desc: 'Collect omens from spiritkin — trade for rare items', cost: 2, maxRank: 2, prereq: 'orc_div_1' },
      { id: 'orc_div_3', branch: 1, tier: 2, name: 'Spirit Compass',
        desc: 'Reveals the path to the nearest legendary spiritkin', cost: 3, maxRank: 1, prereq: 'orc_div_2' },
      { id: 'orc_div_4', branch: 1, tier: 3, name: 'The All-Seeing Eye',
        desc: 'See every player and their active spiritkin on the map', cost: 4, maxRank: 1, prereq: 'orc_div_3' },
      { id: 'orc_pro_1', branch: 2, tier: 0, name: 'Lucky Star',
        desc: '+5% crit chance for yourself per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'orc_pro_2', branch: 2, tier: 1, name: 'Destiny\'s Favor',
        desc: 'Once per day, auto-succeed a failed recruit attempt', cost: 2, maxRank: 2, prereq: 'orc_pro_1' },
      { id: 'orc_pro_3', branch: 2, tier: 2, name: 'Twist of Fate',
        desc: 'Once per battle, swap your roll with the enemy\'s', cost: 3, maxRank: 1, prereq: 'orc_pro_2' },
      { id: 'orc_pro_4', branch: 2, tier: 3, name: 'Written in the Stars',
        desc: 'Choose your dice outcome once per day (any battle)', cost: 4, maxRank: 1, prereq: 'orc_pro_3' },
    ],
  },

  mystic: {
    name: 'Mystic',
    desc: 'Turn your fortunes inward. Meditate for power, enhance yourself, transcend limits.',
    color: '#8888ff',
    requiresTree: 'fortune_teller',
    branches: ['Meditation', 'Inner Fire', 'Transcendence'],
    talents: [
      { id: 'mys_med_1', branch: 0, tier: 0, name: 'Focus',
        desc: '+1 to your own dice rolls for 5 min after meditating per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'mys_med_2', branch: 0, tier: 1, name: 'Deep Trance',
        desc: 'Meditation heals your active spiritkin 2 HP', cost: 2, maxRank: 2, prereq: 'mys_med_1' },
      { id: 'mys_med_3', branch: 0, tier: 2, name: 'Spirit Walk',
        desc: 'Meditate to astral project — explore without triggering battles', cost: 3, maxRank: 1, prereq: 'mys_med_2' },
      { id: 'mys_med_4', branch: 0, tier: 3, name: 'Zen Master',
        desc: 'Meditation buffs last 30 minutes and stack', cost: 4, maxRank: 1, prereq: 'mys_med_3' },
      { id: 'mys_fir_1', branch: 1, tier: 0, name: 'Inner Flame',
        desc: '+1 base damage to your spiritkin per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'mys_fir_2', branch: 1, tier: 1, name: 'Spirit Surge',
        desc: 'Your spiritkin\'s ability triggers twice (once per battle)', cost: 2, maxRank: 2, prereq: 'mys_fir_1' },
      { id: 'mys_fir_3', branch: 1, tier: 2, name: 'Overcharge',
        desc: 'Sacrifice 2 HP to add +3 damage on your next roll', cost: 3, maxRank: 1, prereq: 'mys_fir_2' },
      { id: 'mys_fir_4', branch: 1, tier: 3, name: 'Avatar State',
        desc: 'Once per day, your spiritkin deals double damage for one full battle', cost: 4, maxRank: 1, prereq: 'mys_fir_3' },
      { id: 'mys_trn_1', branch: 2, tier: 0, name: 'Third Eye',
        desc: 'See enemy abilities before battle begins per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'mys_trn_2', branch: 2, tier: 1, name: 'Phase Shift',
        desc: 'Dodge the first attack in every battle', cost: 2, maxRank: 2, prereq: 'mys_trn_1' },
      { id: 'mys_trn_3', branch: 2, tier: 2, name: 'Soul Mirror',
        desc: 'Copy the enemy spiritkin\'s ability for one battle', cost: 3, maxRank: 1, prereq: 'mys_trn_2' },
      { id: 'mys_trn_4', branch: 2, tier: 3, name: 'Ascension',
        desc: 'Your spiritkin temporarily evolves during battle (+3 HP, +2 damage)', cost: 4, maxRank: 1, prereq: 'mys_trn_3' },
    ],
  },

  enchanter: {
    name: 'Enchanter',
    desc: 'Weave fortune magic into items and spiritkin. Permanent enhancements.',
    color: '#44ddaa',
    requiresTree: 'fortune_teller',
    branches: ['Gear Enchants', 'Spirit Enchants', 'Cursework'],
    talents: [
      { id: 'enc_gear_1', branch: 0, tier: 0, name: 'Minor Enchant',
        desc: 'Enchant gear with +1 stat per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'enc_gear_2', branch: 0, tier: 1, name: 'Fortune Blade',
        desc: 'Enchant weapons with +10% crit chance', cost: 2, maxRank: 2, prereq: 'enc_gear_1' },
      { id: 'enc_gear_3', branch: 0, tier: 2, name: 'Ward of Stars',
        desc: 'Enchant armor to absorb 1 damage per battle', cost: 3, maxRank: 1, prereq: 'enc_gear_2' },
      { id: 'enc_gear_4', branch: 0, tier: 3, name: 'Legendary Enchant',
        desc: 'Apply a legendary enchant — gear gains a unique passive', cost: 4, maxRank: 1, prereq: 'enc_gear_3' },
      { id: 'enc_spr_1', branch: 1, tier: 0, name: 'Spirit Mark',
        desc: 'Mark a spiritkin to gain +1 XP per battle per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'enc_spr_2', branch: 1, tier: 1, name: 'Blessed Bond',
        desc: 'Enchanted spiritkin heals 1 HP after each victory', cost: 2, maxRank: 2, prereq: 'enc_spr_1' },
      { id: 'enc_spr_3', branch: 1, tier: 2, name: 'Soul Rune',
        desc: 'Permanently add +1 die to a spiritkin (once per spiritkin)', cost: 3, maxRank: 1, prereq: 'enc_spr_2' },
      { id: 'enc_spr_4', branch: 1, tier: 3, name: 'Awaken Potential',
        desc: 'Unlock a hidden second ability on any spiritkin', cost: 4, maxRank: 1, prereq: 'enc_spr_3' },
      { id: 'enc_crs_1', branch: 2, tier: 0, name: 'Hex',
        desc: 'Curse an enemy spiritkin: -1 damage per rank for 1 battle', cost: 1, maxRank: 3, prereq: null },
      { id: 'enc_crs_2', branch: 2, tier: 1, name: 'Jinx',
        desc: 'Cursed enemies have 20% chance to miss per rank', cost: 2, maxRank: 2, prereq: 'enc_crs_1' },
      { id: 'enc_crs_3', branch: 2, tier: 2, name: 'Doom Mark',
        desc: 'Mark an enemy — they take +2 damage from all sources', cost: 3, maxRank: 1, prereq: 'enc_crs_2' },
      { id: 'enc_crs_4', branch: 2, tier: 3, name: 'Shatter Curse',
        desc: 'Destroy one piece of enemy equipment permanently', cost: 4, maxRank: 1, prereq: 'enc_crs_3' },
    ],
  },

  // ═══════════════════════════════════════════════════════
  //  ARTISAN (base) → Architect, Armorsmith, Weaponsmith
  // ═══════════════════════════════════════════════════════

  artisan: {
    name: 'Artisan',
    desc: 'Master crafting fundamentals. Mastery unlocks Architect, Armorsmith & Weaponsmith.',
    color: '#dd9933',
    branches: ['Construction', 'Materials', 'Township'],
    talents: [
      { id: 'art_con_1', branch: 0, tier: 0, name: 'Foundation',
        desc: 'Build a basic house (respawn point)', cost: 1, maxRank: 3, prereq: null },
      { id: 'art_con_2', branch: 0, tier: 1, name: 'Homestead',
        desc: 'House grants a mini buff when you exit', cost: 2, maxRank: 2, prereq: 'art_con_1' },
      { id: 'art_con_3', branch: 0, tier: 2, name: 'Workshop',
        desc: 'Build a workshop (+10% crafting success nearby)', cost: 3, maxRank: 1, prereq: 'art_con_2' },
      { id: 'art_con_4', branch: 0, tier: 3, name: 'Fortress',
        desc: 'Build reinforced structures that resist raids', cost: 4, maxRank: 1, prereq: 'art_con_3' },
      { id: 'art_mat_1', branch: 1, tier: 0, name: 'Resource Finder',
        desc: '+15% gathering yield per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'art_mat_2', branch: 1, tier: 1, name: 'Efficient Craft',
        desc: '10% chance to not consume materials per rank', cost: 2, maxRank: 2, prereq: 'art_mat_1' },
      { id: 'art_mat_3', branch: 1, tier: 2, name: 'Rare Alloys',
        desc: 'Unlock rare material recipes', cost: 3, maxRank: 1, prereq: 'art_mat_2' },
      { id: 'art_mat_4', branch: 1, tier: 3, name: 'Master Refiner',
        desc: 'All crafted items gain +1 quality tier', cost: 4, maxRank: 1, prereq: 'art_mat_3' },
      { id: 'art_twn_1', branch: 2, tier: 0, name: 'Settlement',
        desc: 'Designate an area as your settlement', cost: 1, maxRank: 3, prereq: null },
      { id: 'art_twn_2', branch: 2, tier: 1, name: 'Tavern',
        desc: 'Build a tavern (players can rest for buffs)', cost: 2, maxRank: 2, prereq: 'art_twn_1' },
      { id: 'art_twn_3', branch: 2, tier: 2, name: 'Market Square',
        desc: 'Build a market (players can trade here)', cost: 3, maxRank: 1, prereq: 'art_twn_2' },
      { id: 'art_twn_4', branch: 2, tier: 3, name: 'Battle Arena',
        desc: 'Build a custom battle arena in your town', cost: 4, maxRank: 1, prereq: 'art_twn_3' },
    ],
  },

  architect: {
    name: 'Architect',
    desc: 'Design grand structures and mounts. Requires Artisan mastery.',
    color: '#cc8833',
    requiresTree: 'artisan',
    branches: ['Grand Design', 'Mounts', 'Wonders'],
    talents: [
      { id: 'arc_gd_1', branch: 0, tier: 0, name: 'Blueprints',
        desc: 'Design advanced structures before building', cost: 1, maxRank: 3, prereq: null },
      { id: 'arc_gd_2', branch: 0, tier: 1, name: 'Reinforced Walls',
        desc: 'Structures have 2x durability per rank', cost: 2, maxRank: 2, prereq: 'arc_gd_1' },
      { id: 'arc_gd_3', branch: 0, tier: 2, name: 'Grand Hall',
        desc: 'Build a grand hall (8 players can rest inside)', cost: 3, maxRank: 1, prereq: 'arc_gd_2' },
      { id: 'arc_gd_4', branch: 0, tier: 3, name: 'Citadel',
        desc: 'Build a citadel — the ultimate player structure', cost: 4, maxRank: 1, prereq: 'arc_gd_3' },
      { id: 'arc_mnt_1', branch: 1, tier: 0, name: 'Raft Builder',
        desc: 'Craft a basic raft for water travel', cost: 1, maxRank: 3, prereq: null },
      { id: 'arc_mnt_2', branch: 1, tier: 1, name: 'Stable & Saddle',
        desc: 'Build a stable and craft basic spiritkin mounts', cost: 2, maxRank: 2, prereq: 'arc_mnt_1' },
      { id: 'arc_mnt_3', branch: 1, tier: 2, name: 'Armored Mount',
        desc: 'Upgrade mounts with armor (+1 HP absorb)', cost: 3, maxRank: 1, prereq: 'arc_mnt_2' },
      { id: 'arc_mnt_4', branch: 1, tier: 3, name: 'Hover Skiff',
        desc: 'Craft a sci-fi hover skiff (all-terrain mount)', cost: 4, maxRank: 1, prereq: 'arc_mnt_3' },
      { id: 'arc_wnd_1', branch: 2, tier: 0, name: 'Beacon Tower',
        desc: 'Build a beacon visible across the region', cost: 1, maxRank: 3, prereq: null },
      { id: 'arc_wnd_2', branch: 2, tier: 1, name: 'Portal Arch',
        desc: 'Build a portal connecting two of your structures', cost: 2, maxRank: 2, prereq: 'arc_wnd_1' },
      { id: 'arc_wnd_3', branch: 2, tier: 2, name: 'Sky Bridge',
        desc: 'Connect distant structures with a traversable bridge', cost: 3, maxRank: 1, prereq: 'arc_wnd_2' },
      { id: 'arc_wnd_4', branch: 2, tier: 3, name: 'Monument',
        desc: 'Build a monument — permanent world landmark with your name', cost: 4, maxRank: 1, prereq: 'arc_wnd_3' },
    ],
  },

  armorsmith: {
    name: 'Armorsmith',
    desc: 'Forge powerful armor and shields. Requires Artisan mastery.',
    color: '#7799cc',
    requiresTree: 'artisan',
    branches: ['Plate', 'Shields', 'Enchantment'],
    talents: [
      { id: 'arm_plt_1', branch: 0, tier: 0, name: 'Iron Plate',
        desc: 'Craft basic armor (+1 damage reduction per rank)', cost: 1, maxRank: 3, prereq: null },
      { id: 'arm_plt_2', branch: 0, tier: 1, name: 'Tempered Steel',
        desc: 'Armor durability increased 50% per rank', cost: 2, maxRank: 2, prereq: 'arm_plt_1' },
      { id: 'arm_plt_3', branch: 0, tier: 2, name: 'Spirit Plate',
        desc: 'Craft armor infused with spiritkin essence', cost: 3, maxRank: 1, prereq: 'arm_plt_2' },
      { id: 'arm_plt_4', branch: 0, tier: 3, name: 'Legendary Armor',
        desc: 'Craft legendary-tier armor with unique passive', cost: 4, maxRank: 1, prereq: 'arm_plt_3' },
      { id: 'arm_shd_1', branch: 1, tier: 0, name: 'Buckler',
        desc: 'Craft a basic shield (block 1 damage per rank)', cost: 1, maxRank: 3, prereq: null },
      { id: 'arm_shd_2', branch: 1, tier: 1, name: 'Tower Shield',
        desc: 'Shield blocks 2 additional damage', cost: 2, maxRank: 2, prereq: 'arm_shd_1' },
      { id: 'arm_shd_3', branch: 1, tier: 2, name: 'Reflective Guard',
        desc: 'Shield reflects 1 damage back to attacker', cost: 3, maxRank: 1, prereq: 'arm_shd_2' },
      { id: 'arm_shd_4', branch: 1, tier: 3, name: 'Aegis',
        desc: 'Craft the Aegis — absorbs one full attack per battle', cost: 4, maxRank: 1, prereq: 'arm_shd_3' },
      { id: 'arm_enc_1', branch: 2, tier: 0, name: 'Basic Rune',
        desc: 'Apply a basic rune to armor (+1 stat per rank)', cost: 1, maxRank: 3, prereq: null },
      { id: 'arm_enc_2', branch: 2, tier: 1, name: 'Warding Rune',
        desc: 'Rune grants resistance to status effects', cost: 2, maxRank: 2, prereq: 'arm_enc_1' },
      { id: 'arm_enc_3', branch: 2, tier: 2, name: 'Soulforge',
        desc: 'Bind a spiritkin soul to armor for a passive ability', cost: 3, maxRank: 1, prereq: 'arm_enc_2' },
      { id: 'arm_enc_4', branch: 2, tier: 3, name: 'Mythic Enchant',
        desc: 'Apply a mythic enchant — armor gains a unique active ability', cost: 4, maxRank: 1, prereq: 'arm_enc_3' },
    ],
  },

  weaponsmith: {
    name: 'Weaponsmith',
    desc: 'Forge devastating weapons. Requires Artisan mastery.',
    color: '#dd5544',
    requiresTree: 'artisan',
    branches: ['Blades', 'Ranged', 'Infusion'],
    talents: [
      { id: 'wpn_bld_1', branch: 0, tier: 0, name: 'Iron Blade',
        desc: 'Craft a basic blade (+1 damage per rank)', cost: 1, maxRank: 3, prereq: null },
      { id: 'wpn_bld_2', branch: 0, tier: 1, name: 'Keen Edge',
        desc: 'Blades have +10% crit chance per rank', cost: 2, maxRank: 2, prereq: 'wpn_bld_1' },
      { id: 'wpn_bld_3', branch: 0, tier: 2, name: 'Spirit Blade',
        desc: 'Craft a blade that channels spiritkin energy', cost: 3, maxRank: 1, prereq: 'wpn_bld_2' },
      { id: 'wpn_bld_4', branch: 0, tier: 3, name: 'Legendary Sword',
        desc: 'Craft a legendary sword with a unique ability', cost: 4, maxRank: 1, prereq: 'wpn_bld_3' },
      { id: 'wpn_rng_1', branch: 1, tier: 0, name: 'Slingshot',
        desc: 'Craft a basic ranged weapon per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'wpn_rng_2', branch: 1, tier: 1, name: 'Crossbow',
        desc: 'Craft a crossbow (+2 first-strike damage)', cost: 2, maxRank: 2, prereq: 'wpn_rng_1' },
      { id: 'wpn_rng_3', branch: 1, tier: 2, name: 'Energy Blaster',
        desc: 'Craft a sci-fi blaster (ignores armor)', cost: 3, maxRank: 1, prereq: 'wpn_rng_2' },
      { id: 'wpn_rng_4', branch: 1, tier: 3, name: 'Plasma Cannon',
        desc: 'Craft a plasma cannon — devastating AoE first strike', cost: 4, maxRank: 1, prereq: 'wpn_rng_3' },
      { id: 'wpn_inf_1', branch: 2, tier: 0, name: 'Flame Touch',
        desc: 'Infuse weapon with fire (+1 burn damage per rank)', cost: 1, maxRank: 3, prereq: null },
      { id: 'wpn_inf_2', branch: 2, tier: 1, name: 'Frost Bite',
        desc: 'Infuse weapon with ice (chance to slow enemy)', cost: 2, maxRank: 2, prereq: 'wpn_inf_1' },
      { id: 'wpn_inf_3', branch: 2, tier: 2, name: 'Lightning Strike',
        desc: 'Infuse weapon with lightning (chain to nearby)', cost: 3, maxRank: 1, prereq: 'wpn_inf_2' },
      { id: 'wpn_inf_4', branch: 2, tier: 3, name: 'Void Edge',
        desc: 'Infuse weapon with void energy — attacks drain spirit', cost: 4, maxRank: 1, prereq: 'wpn_inf_3' },
    ],
  },

  // ═══════════════════════════════════════════════════════
  //  TRAINER (base) → Beastmaster, Gladiator, Ranger
  // ═══════════════════════════════════════════════════════

  trainer: {
    name: 'Trainer',
    desc: 'Master spiritkin combat and collection. Mastery unlocks Beastmaster, Gladiator & Ranger.',
    color: '#44dd66',
    branches: ['Combat', 'Collection', 'Bonding'],
    talents: [
      { id: 'trn_com_1', branch: 0, tier: 0, name: 'Battle Instinct',
        desc: '+5% combat XP per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'trn_com_2', branch: 0, tier: 1, name: 'Veteran Tactics',
        desc: 'See enemy HP before battle starts', cost: 2, maxRank: 2, prereq: 'trn_com_1' },
      { id: 'trn_com_3', branch: 0, tier: 2, name: 'Challenger',
        desc: '+1 Spirit reward from trainer battles', cost: 3, maxRank: 1, prereq: 'trn_com_2' },
      { id: 'trn_com_4', branch: 0, tier: 3, name: 'Champion',
        desc: 'Defeating a trainer grants a chance at their rarest spiritkin', cost: 4, maxRank: 1, prereq: 'trn_com_3' },
      { id: 'trn_col_1', branch: 1, tier: 0, name: 'Keen Eye',
        desc: '+10% recruit chance per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'trn_col_2', branch: 1, tier: 1, name: 'Spiritkin Whisperer',
        desc: 'Wild spiritkin are less aggressive', cost: 2, maxRank: 2, prereq: 'trn_col_1' },
      { id: 'trn_col_3', branch: 1, tier: 2, name: 'Rare Seeker',
        desc: 'Increased rare spiritkin spawn rate', cost: 3, maxRank: 1, prereq: 'trn_col_2' },
      { id: 'trn_col_4', branch: 1, tier: 3, name: 'Legendary Tracker',
        desc: 'Sense legendary spiritkin in your region', cost: 4, maxRank: 1, prereq: 'trn_col_3' },
      { id: 'trn_bnd_1', branch: 2, tier: 0, name: 'Kindred Spirit',
        desc: 'Active spiritkin gains +1 max HP per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'trn_bnd_2', branch: 2, tier: 1, name: 'Spirit Sync',
        desc: 'Spiritkin abilities have +10% potency', cost: 2, maxRank: 2, prereq: 'trn_bnd_1' },
      { id: 'trn_bnd_3', branch: 2, tier: 2, name: 'Soul Bond',
        desc: 'Bonded spiritkin heals 1 HP between battles', cost: 3, maxRank: 1, prereq: 'trn_bnd_2' },
      { id: 'trn_bnd_4', branch: 2, tier: 3, name: 'True Partner',
        desc: 'Your lead spiritkin gains a unique passive', cost: 4, maxRank: 1, prereq: 'trn_bnd_3' },
    ],
  },

  beastmaster: {
    name: 'Beastmaster',
    desc: 'Command wild spiritkin. Larger teams, wild bonds, untamed power.',
    color: '#33bb55',
    requiresTree: 'trainer',
    branches: ['Wild Bond', 'Pack Leader', 'Alpha Call'],
    talents: [
      { id: 'bst_wld_1', branch: 0, tier: 0, name: 'Wild Affinity',
        desc: 'Wild spiritkin deal 10% less damage to you per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'bst_wld_2', branch: 0, tier: 1, name: 'Feral Bond',
        desc: 'Recruited wild spiritkin start with +2 HP', cost: 2, maxRank: 2, prereq: 'bst_wld_1' },
      { id: 'bst_wld_3', branch: 0, tier: 2, name: 'Nature\'s Chosen',
        desc: 'Wild spiritkin occasionally join you without battle', cost: 3, maxRank: 1, prereq: 'bst_wld_2' },
      { id: 'bst_wld_4', branch: 0, tier: 3, name: 'Spirit of the Wild',
        desc: 'Your team gains a passive nature buff in outdoor areas', cost: 4, maxRank: 1, prereq: 'bst_wld_3' },
      { id: 'bst_pak_1', branch: 1, tier: 0, name: 'Expanded Roster',
        desc: '+1 team slot per rank (beyond base 3)', cost: 1, maxRank: 3, prereq: null },
      { id: 'bst_pak_2', branch: 1, tier: 1, name: 'Tag Team',
        desc: 'Swap spiritkin mid-battle without losing a turn', cost: 2, maxRank: 2, prereq: 'bst_pak_1' },
      { id: 'bst_pak_3', branch: 1, tier: 2, name: 'Pack Tactics',
        desc: 'Sideline spiritkin contribute +1 damage each', cost: 3, maxRank: 1, prereq: 'bst_pak_2' },
      { id: 'bst_pak_4', branch: 1, tier: 3, name: 'Stampede',
        desc: 'Once per day, all team members attack simultaneously', cost: 4, maxRank: 1, prereq: 'bst_pak_3' },
      { id: 'bst_alp_1', branch: 2, tier: 0, name: 'Intimidate',
        desc: 'Enemy spiritkin lose 1 die on first roll per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'bst_alp_2', branch: 2, tier: 1, name: 'Primal Roar',
        desc: 'Stun enemy spiritkin for 1 turn (once per battle)', cost: 2, maxRank: 2, prereq: 'bst_alp_1' },
      { id: 'bst_alp_3', branch: 2, tier: 2, name: 'Apex Predator',
        desc: '+3 damage against spiritkin with lower HP than yours', cost: 3, maxRank: 1, prereq: 'bst_alp_2' },
      { id: 'bst_alp_4', branch: 2, tier: 3, name: 'King of Beasts',
        desc: 'Your lead spiritkin gains permanent +2 to all stats', cost: 4, maxRank: 1, prereq: 'bst_alp_3' },
    ],
  },

  gladiator: {
    name: 'Gladiator',
    desc: 'Arena specialist. Dominate PvP, earn glory, climb the ranks.',
    color: '#ee6644',
    requiresTree: 'trainer',
    branches: ['Arena', 'Glory', 'Tactics'],
    talents: [
      { id: 'gld_arn_1', branch: 0, tier: 0, name: 'Arena Veteran',
        desc: '+5% damage in PvP battles per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'gld_arn_2', branch: 0, tier: 1, name: 'Ranked Fighter',
        desc: 'Win streak bonus: +1 damage per consecutive PvP win', cost: 2, maxRank: 2, prereq: 'gld_arn_1' },
      { id: 'gld_arn_3', branch: 0, tier: 2, name: 'Arena Champion',
        desc: 'Challenge NPCs to exhibition matches for double rewards', cost: 3, maxRank: 1, prereq: 'gld_arn_2' },
      { id: 'gld_arn_4', branch: 0, tier: 3, name: 'Grand Champion',
        desc: 'Earn a title visible to all players. +10% gold from all PvP.', cost: 4, maxRank: 1, prereq: 'gld_arn_3' },
      { id: 'gld_glo_1', branch: 1, tier: 0, name: 'Crowd Pleaser',
        desc: 'Earn +20% more glory per PvP win per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'gld_glo_2', branch: 1, tier: 1, name: 'Fame',
        desc: 'NPCs offer better prices based on your arena rank', cost: 2, maxRank: 2, prereq: 'gld_glo_1' },
      { id: 'gld_glo_3', branch: 1, tier: 2, name: 'Sponsorship',
        desc: 'Earn passive gold income based on arena wins', cost: 3, maxRank: 1, prereq: 'gld_glo_2' },
      { id: 'gld_glo_4', branch: 1, tier: 3, name: 'Legend',
        desc: 'Your name appears on the world leaderboard permanently', cost: 4, maxRank: 1, prereq: 'gld_glo_3' },
      { id: 'gld_tac_1', branch: 2, tier: 0, name: 'Counter Stance',
        desc: 'After taking damage, gain +1 damage next roll per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'gld_tac_2', branch: 2, tier: 1, name: 'Feint',
        desc: 'Once per battle, force enemy to reroll their attack', cost: 2, maxRank: 2, prereq: 'gld_tac_1' },
      { id: 'gld_tac_3', branch: 2, tier: 2, name: 'Exploit Weakness',
        desc: 'Deal +2 damage to enemies below 50% HP', cost: 3, maxRank: 1, prereq: 'gld_tac_2' },
      { id: 'gld_tac_4', branch: 2, tier: 3, name: 'Finishing Blow',
        desc: 'If enemy is at 1 HP, auto-KO with a cinematic finisher', cost: 4, maxRank: 1, prereq: 'gld_tac_3' },
    ],
  },

  ranger: {
    name: 'Ranger',
    desc: 'Master of the wilds. Navigate, track, survive, and discover.',
    color: '#88aa44',
    requiresTree: 'trainer',
    branches: ['Pathfinding', 'Survival', 'Discovery'],
    talents: [
      { id: 'rng_pth_1', branch: 0, tier: 0, name: 'Trailblazer',
        desc: '+15% movement speed per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'rng_pth_2', branch: 0, tier: 1, name: 'Shortcut',
        desc: 'Discover hidden paths between regions', cost: 2, maxRank: 2, prereq: 'rng_pth_1' },
      { id: 'rng_pth_3', branch: 0, tier: 2, name: 'Wayfinder',
        desc: 'Reveal the full map of any region you enter', cost: 3, maxRank: 1, prereq: 'rng_pth_2' },
      { id: 'rng_pth_4', branch: 0, tier: 3, name: 'Ghost Trail',
        desc: 'Move through encounter zones without triggering battles', cost: 4, maxRank: 1, prereq: 'rng_pth_3' },
      { id: 'rng_srv_1', branch: 1, tier: 0, name: 'Forager',
        desc: 'Find healing items while exploring per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'rng_srv_2', branch: 1, tier: 1, name: 'Campfire',
        desc: 'Rest to heal all spiritkin 2 HP (5 min cooldown)', cost: 2, maxRank: 2, prereq: 'rng_srv_1' },
      { id: 'rng_srv_3', branch: 1, tier: 2, name: 'Weather the Storm',
        desc: 'Immune to negative world events', cost: 3, maxRank: 1, prereq: 'rng_srv_2' },
      { id: 'rng_srv_4', branch: 1, tier: 3, name: 'Undying',
        desc: 'Once per day, survive a battle you would have lost (1 HP)', cost: 4, maxRank: 1, prereq: 'rng_srv_3' },
      { id: 'rng_dsc_1', branch: 2, tier: 0, name: 'Survey',
        desc: '+25% surveying results per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'rng_dsc_2', branch: 2, tier: 1, name: 'Cartographer',
        desc: 'Create map markers visible to party members', cost: 2, maxRank: 2, prereq: 'rng_dsc_1' },
      { id: 'rng_dsc_3', branch: 2, tier: 2, name: 'Ruin Delver',
        desc: 'Access hidden ruins with unique loot', cost: 3, maxRank: 1, prereq: 'rng_dsc_2' },
      { id: 'rng_dsc_4', branch: 2, tier: 3, name: 'World Walker',
        desc: 'Teleport to any discovered landmark once per day', cost: 4, maxRank: 1, prereq: 'rng_dsc_3' },
    ],
  },

  // ═══════════════════════════════════════════════════════
  //  SCIENTIST (base) → Alchemist, Gene Splicer, Inventor
  // ═══════════════════════════════════════════════════════

  scientist: {
    name: 'Scientist',
    desc: 'Extract DNA and create mutations. Mastery unlocks Alchemist, Gene Splicer & Inventor.',
    color: '#aa55ff',
    branches: ['Extraction', 'Mutations', 'Synthesis'],
    talents: [
      { id: 'sci_ext_1', branch: 0, tier: 0, name: 'DNA Probe',
        desc: 'Unlock DNA extraction from wild spiritkin', cost: 1, maxRank: 3, prereq: null },
      { id: 'sci_ext_2', branch: 0, tier: 1, name: 'Refined Extraction',
        desc: '+15% extraction success per rank', cost: 2, maxRank: 2, prereq: 'sci_ext_1' },
      { id: 'sci_ext_3', branch: 0, tier: 2, name: 'Quick Getaway',
        desc: 'Auto-escape after failed extraction', cost: 3, maxRank: 1, prereq: 'sci_ext_2' },
      { id: 'sci_ext_4', branch: 0, tier: 3, name: 'Master Extractor',
        desc: 'Extract DNA from legendary spiritkin', cost: 4, maxRank: 1, prereq: 'sci_ext_3' },
      { id: 'sci_mut_1', branch: 1, tier: 0, name: 'Splice Basics',
        desc: 'Create basic mutations in the lab', cost: 1, maxRank: 3, prereq: null },
      { id: 'sci_mut_2', branch: 1, tier: 1, name: 'Combat Strain',
        desc: 'Mutations gain +2 base damage', cost: 2, maxRank: 2, prereq: 'sci_mut_1' },
      { id: 'sci_mut_3', branch: 1, tier: 2, name: 'Alpha Predator',
        desc: 'Create ace-tier mutations with unique abilities', cost: 3, maxRank: 1, prereq: 'sci_mut_2' },
      { id: 'sci_mut_4', branch: 1, tier: 3, name: 'Perfect Specimen',
        desc: 'Mutations can evolve once in battle', cost: 4, maxRank: 1, prereq: 'sci_mut_3' },
      { id: 'sci_syn_1', branch: 2, tier: 0, name: 'Bio Reactor',
        desc: 'Mutations passively generate resources', cost: 1, maxRank: 3, prereq: null },
      { id: 'sci_syn_2', branch: 2, tier: 1, name: 'Sideline Specialist',
        desc: 'Create support mutations that buff your team', cost: 2, maxRank: 2, prereq: 'sci_syn_1' },
      { id: 'sci_syn_3', branch: 2, tier: 2, name: 'Harvest Protocol',
        desc: 'Double resource yield from mutations', cost: 3, maxRank: 1, prereq: 'sci_syn_2' },
      { id: 'sci_syn_4', branch: 2, tier: 3, name: 'Living Factory',
        desc: 'Mutations auto-generate rare materials over time', cost: 4, maxRank: 1, prereq: 'sci_syn_3' },
    ],
  },

  alchemist: {
    name: 'Alchemist',
    desc: 'Brew potions, elixirs, and consumables. Chemistry is power.',
    color: '#bb66dd',
    requiresTree: 'scientist',
    branches: ['Potions', 'Elixirs', 'Transmutation'],
    talents: [
      { id: 'alc_pot_1', branch: 0, tier: 0, name: 'Healing Brew',
        desc: 'Craft basic healing potions (heal 3 HP per rank)', cost: 1, maxRank: 3, prereq: null },
      { id: 'alc_pot_2', branch: 0, tier: 1, name: 'Antidote',
        desc: 'Craft potions that cure status effects', cost: 2, maxRank: 2, prereq: 'alc_pot_1' },
      { id: 'alc_pot_3', branch: 0, tier: 2, name: 'Mega Potion',
        desc: 'Craft potions that heal entire team for 5 HP', cost: 3, maxRank: 1, prereq: 'alc_pot_2' },
      { id: 'alc_pot_4', branch: 0, tier: 3, name: 'Elixir of Life',
        desc: 'Craft a potion that revives a KO\'d spiritkin at full HP', cost: 4, maxRank: 1, prereq: 'alc_pot_3' },
      { id: 'alc_elx_1', branch: 1, tier: 0, name: 'Strength Elixir',
        desc: 'Craft an elixir granting +1 damage per rank for 3 battles', cost: 1, maxRank: 3, prereq: null },
      { id: 'alc_elx_2', branch: 1, tier: 1, name: 'Speed Elixir',
        desc: 'Craft an elixir granting first-strike in battle', cost: 2, maxRank: 2, prereq: 'alc_elx_1' },
      { id: 'alc_elx_3', branch: 1, tier: 2, name: 'Rage Elixir',
        desc: 'Craft an elixir granting +3 damage but -2 HP', cost: 3, maxRank: 1, prereq: 'alc_elx_2' },
      { id: 'alc_elx_4', branch: 1, tier: 3, name: 'Philosopher\'s Draught',
        desc: 'Craft a legendary elixir granting +2 to all stats for 10 battles', cost: 4, maxRank: 1, prereq: 'alc_elx_3' },
      { id: 'alc_trn_1', branch: 2, tier: 0, name: 'Dissolve',
        desc: 'Break down items into raw materials per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'alc_trn_2', branch: 2, tier: 1, name: 'Transmute',
        desc: 'Convert one material type to another', cost: 2, maxRank: 2, prereq: 'alc_trn_1' },
      { id: 'alc_trn_3', branch: 2, tier: 2, name: 'Gold Synthesis',
        desc: 'Convert excess materials into gold', cost: 3, maxRank: 1, prereq: 'alc_trn_2' },
      { id: 'alc_trn_4', branch: 2, tier: 3, name: 'Philosopher\'s Stone',
        desc: 'Transmute any material into any other material', cost: 4, maxRank: 1, prereq: 'alc_trn_3' },
    ],
  },

  gene_splicer: {
    name: 'Gene Splicer',
    desc: 'Advanced mutations. Splice legendary DNA, create hybrid spiritkin.',
    color: '#dd44ff',
    requiresTree: 'scientist',
    branches: ['Hybridization', 'Enhancement', 'Chimera'],
    talents: [
      { id: 'gen_hyb_1', branch: 0, tier: 0, name: 'Cross-Splice',
        desc: 'Combine DNA from 2 spiritkin into a hybrid', cost: 1, maxRank: 3, prereq: null },
      { id: 'gen_hyb_2', branch: 0, tier: 1, name: 'Dominant Traits',
        desc: 'Choose which abilities the hybrid inherits', cost: 2, maxRank: 2, prereq: 'gen_hyb_1' },
      { id: 'gen_hyb_3', branch: 0, tier: 2, name: 'Rare Genome',
        desc: 'Splice rare-tier DNA (unique color + boosted stats)', cost: 3, maxRank: 1, prereq: 'gen_hyb_2' },
      { id: 'gen_hyb_4', branch: 0, tier: 3, name: 'Legendary Splice',
        desc: 'Create a legendary hybrid with abilities from both parents', cost: 4, maxRank: 1, prereq: 'gen_hyb_3' },
      { id: 'gen_enh_1', branch: 1, tier: 0, name: 'Gene Therapy',
        desc: 'Boost a spiritkin\'s HP by +1 per rank permanently', cost: 1, maxRank: 3, prereq: null },
      { id: 'gen_enh_2', branch: 1, tier: 1, name: 'Adaptive DNA',
        desc: 'Spiritkin gains resistance to its weakness element', cost: 2, maxRank: 2, prereq: 'gen_enh_1' },
      { id: 'gen_enh_3', branch: 1, tier: 2, name: 'Super Strain',
        desc: 'Enhanced spiritkin deals +2 damage permanently', cost: 3, maxRank: 1, prereq: 'gen_enh_2' },
      { id: 'gen_enh_4', branch: 1, tier: 3, name: 'Perfected Genome',
        desc: 'Max out one spiritkin\'s stats to their species cap', cost: 4, maxRank: 1, prereq: 'gen_enh_3' },
      { id: 'gen_chi_1', branch: 2, tier: 0, name: 'Unstable Mutation',
        desc: 'Create a random mutation (chaotic but powerful)', cost: 1, maxRank: 3, prereq: null },
      { id: 'gen_chi_2', branch: 2, tier: 1, name: 'Controlled Chaos',
        desc: 'Reduce randomness — choose 1 of 3 mutation results', cost: 2, maxRank: 2, prereq: 'gen_chi_1' },
      { id: 'gen_chi_3', branch: 2, tier: 2, name: 'Chimera',
        desc: 'Fuse 3 spiritkin DNA into one abomination (very powerful)', cost: 3, maxRank: 1, prereq: 'gen_chi_2' },
      { id: 'gen_chi_4', branch: 2, tier: 3, name: 'The Apex',
        desc: 'Create a one-of-a-kind spiritkin — unique in the entire world', cost: 4, maxRank: 1, prereq: 'gen_chi_3' },
    ],
  },

  inventor: {
    name: 'Inventor',
    desc: 'Build gadgets, traps, and tech. Science meets warfare.',
    color: '#ff8844',
    requiresTree: 'scientist',
    branches: ['Gadgets', 'Traps', 'Robotics'],
    talents: [
      { id: 'inv_gad_1', branch: 0, tier: 0, name: 'Scanner',
        desc: 'Scan spiritkin to reveal stats and abilities per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'inv_gad_2', branch: 0, tier: 1, name: 'Shield Generator',
        desc: 'Deploy a shield that blocks 2 damage once per battle', cost: 2, maxRank: 2, prereq: 'inv_gad_1' },
      { id: 'inv_gad_3', branch: 0, tier: 2, name: 'Hologram Decoy',
        desc: 'Enemy attacks your decoy for 1 turn', cost: 3, maxRank: 1, prereq: 'inv_gad_2' },
      { id: 'inv_gad_4', branch: 0, tier: 3, name: 'Temporal Device',
        desc: 'Rewind 1 turn in battle (once per day)', cost: 4, maxRank: 1, prereq: 'inv_gad_3' },
      { id: 'inv_trp_1', branch: 1, tier: 0, name: 'Snare',
        desc: 'Place a trap that auto-catches weak spiritkin per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'inv_trp_2', branch: 1, tier: 1, name: 'Stun Mine',
        desc: 'Place a mine that stuns enemies for 1 turn', cost: 2, maxRank: 2, prereq: 'inv_trp_1' },
      { id: 'inv_trp_3', branch: 1, tier: 2, name: 'Containment Field',
        desc: 'Trap prevents enemy from fleeing battle', cost: 3, maxRank: 1, prereq: 'inv_trp_2' },
      { id: 'inv_trp_4', branch: 1, tier: 3, name: 'Gravity Well',
        desc: 'Trap pulls all nearby spiritkin to one spot (AoE capture)', cost: 4, maxRank: 1, prereq: 'inv_trp_3' },
      { id: 'inv_bot_1', branch: 2, tier: 0, name: 'Repair Drone',
        desc: 'Deploy a drone that heals 1 HP per turn per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'inv_bot_2', branch: 2, tier: 1, name: 'Combat Drone',
        desc: 'Deploy a drone that deals 2 damage per turn', cost: 2, maxRank: 2, prereq: 'inv_bot_1' },
      { id: 'inv_bot_3', branch: 2, tier: 2, name: 'Mech Suit',
        desc: 'Enter a mech suit — +5 HP and +2 damage for one battle', cost: 3, maxRank: 1, prereq: 'inv_bot_2' },
      { id: 'inv_bot_4', branch: 2, tier: 3, name: 'War Machine',
        desc: 'Deploy an autonomous battle robot that fights alongside you', cost: 4, maxRank: 1, prereq: 'inv_bot_3' },
    ],
  },

  // ═══════════════════════════════════════════════════════
  //  HIDDEN TREES (secret unlocks)
  // ═══════════════════════════════════════════════════════

  dark_rider: {
    name: '???',
    desc: 'A mysterious force stirs within...',
    color: '#cc2244',
    hidden: 'darkRider',
    branches: ['Shadow', 'Dominion', 'Dread'],
    talents: [
      { id: 'drk_shd_1', branch: 0, tier: 0, name: 'Dark Awakening',
        desc: 'Transform into Dark Rider for 1 minute (1-day cooldown)', cost: 1, maxRank: 3, prereq: null },
      { id: 'drk_shd_2', branch: 0, tier: 1, name: 'Shadow Stride',
        desc: 'Move 50% faster while transformed', cost: 2, maxRank: 2, prereq: 'drk_shd_1' },
      { id: 'drk_shd_3', branch: 0, tier: 2, name: 'Cloak of Night',
        desc: 'Immune to unwanted battles while transformed', cost: 3, maxRank: 1, prereq: 'drk_shd_2' },
      { id: 'drk_shd_4', branch: 0, tier: 3, name: 'Endless Night',
        desc: 'Transform lasts 2 minutes', cost: 4, maxRank: 1, prereq: 'drk_shd_3' },
      { id: 'drk_dom_1', branch: 1, tier: 0, name: 'Dark Challenge',
        desc: 'Challenge any live player as a Dark Rider', cost: 1, maxRank: 3, prereq: null },
      { id: 'drk_dom_2', branch: 1, tier: 1, name: 'Soul Harvest',
        desc: '+50% Spirit reward from Dark Rider victories', cost: 2, maxRank: 2, prereq: 'drk_dom_1' },
      { id: 'drk_dom_3', branch: 1, tier: 2, name: 'Fear Aura',
        desc: 'Nearby players see a warning when you transform', cost: 3, maxRank: 1, prereq: 'drk_dom_2' },
      { id: 'drk_dom_4', branch: 1, tier: 3, name: 'Wrath of the Rider',
        desc: 'Dark Rider battles grant 3x Spirit on victory', cost: 4, maxRank: 1, prereq: 'drk_dom_3' },
      { id: 'drk_drd_1', branch: 2, tier: 0, name: 'Spirit Sight',
        desc: 'Interact with hidden spirit objects while transformed', cost: 1, maxRank: 3, prereq: null },
      { id: 'drk_drd_2', branch: 2, tier: 1, name: 'Dread Presence',
        desc: 'NPCs react differently to your Dark Rider form', cost: 2, maxRank: 2, prereq: 'drk_drd_1' },
      { id: 'drk_drd_3', branch: 2, tier: 2, name: 'Phantom Gate',
        desc: 'Access hidden Dark Rider-only areas', cost: 3, maxRank: 1, prereq: 'drk_drd_2' },
      { id: 'drk_drd_4', branch: 2, tier: 3, name: 'The Horseman',
        desc: 'Cooldown reduced to 12 hours', cost: 4, maxRank: 1, prereq: 'drk_drd_3' },
    ],
  },

  elder: {
    name: '???',
    desc: 'The wisdom of ages flows through you...',
    color: '#ddcc44',
    hidden: 'elder',
    branches: ['Protection', 'Prosperity', 'Council'],
    talents: [
      { id: 'eld_pro_1', branch: 0, tier: 0, name: 'Elder Shield',
        desc: 'Shield absorbs the first roll of damage in every battle', cost: 1, maxRank: 3, prereq: null },
      { id: 'eld_pro_2', branch: 0, tier: 1, name: 'Spirit Barrier',
        desc: 'Shield also protects your sideline spiritkin', cost: 2, maxRank: 2, prereq: 'eld_pro_1' },
      { id: 'eld_pro_3', branch: 0, tier: 2, name: 'Sanctuary',
        desc: 'Declare a safe zone — no battles in a small radius', cost: 3, maxRank: 1, prereq: 'eld_pro_2' },
      { id: 'eld_pro_4', branch: 0, tier: 3, name: 'Aegis of the Elder',
        desc: 'Shield absorbs the first TWO rolls of damage', cost: 4, maxRank: 1, prereq: 'eld_pro_3' },
      { id: 'eld_prs_1', branch: 1, tier: 0, name: 'Golden Touch',
        desc: 'Unique buff: +15% gold from victories per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'eld_prs_2', branch: 1, tier: 1, name: 'Elder Bond',
        desc: 'Party members gain +10% XP while grouped with you', cost: 2, maxRank: 2, prereq: 'eld_prs_1' },
      { id: 'eld_prs_3', branch: 1, tier: 2, name: 'Teamup Surge',
        desc: 'Party battles grant bonus dice to all members', cost: 3, maxRank: 1, prereq: 'eld_prs_2' },
      { id: 'eld_prs_4', branch: 1, tier: 3, name: 'Elder Sanctum',
        desc: 'Unlocks the Elder Sanctum — a unique area only Elders can visit', cost: 4, maxRank: 1, prereq: 'eld_prs_3' },
      { id: 'eld_cou_1', branch: 2, tier: 0, name: 'Council Voice',
        desc: 'Vote in the weekly Elder Council', cost: 1, maxRank: 3, prereq: null },
      { id: 'eld_cou_2', branch: 2, tier: 1, name: 'Proposal Rights',
        desc: 'Propose new amendments for the Council to vote on', cost: 2, maxRank: 2, prereq: 'eld_cou_1' },
      { id: 'eld_cou_3', branch: 2, tier: 2, name: 'Filibuster',
        desc: 'Your vote counts double in Council elections', cost: 3, maxRank: 1, prereq: 'eld_cou_2' },
      { id: 'eld_cou_4', branch: 2, tier: 3, name: 'Grand Elder',
        desc: 'Break ties in Council votes. Your word is final.', cost: 4, maxRank: 1, prereq: 'eld_cou_3' },
    ],
  },
};

// ── Elder Council Amendments (only 1 active at a time) ─
const ELDER_AMENDMENTS = [
  { id: 'amend_1', name: 'Amendment I: Rider\'s Bane',
    desc: '+1 Die on your first roll against Dark Riders' },
  { id: 'amend_2', name: 'Amendment II: Trade Tax',
    desc: 'Tax on all bought goods increased by 500%' },
  { id: 'amend_3', name: 'Amendment III: Survey Boom',
    desc: 'Surveying results increased by 200%' },
  { id: 'amend_4', name: 'Amendment IV: Spirit Limit',
    desc: 'Bans the 3rd Spiritkin — max 2 in battle' },
];


// ══════════════════════════════════════════════════════════
//  TALENT POINT CALCULATIONS & ALLOCATION LOGIC
//  Scaling: T0=1, T1=2, T2=3, T3=4 per rank
//  Per tree: (3×1 + 2×2 + 1×3 + 1×4) × 3 = 42 to max
//  Cap: 120 = master 2 trees (84) + 85% of a 3rd (36/42)
// ══════════════════════════════════════════════════════════

const TALENT_POINT_CAP = 120;

function getTalentPointsTotal() {
  const fromLevel = (G.level || 1) * 3;
  const profXP = G.professionXP || {};
  const totalProfXP = Object.values(profXP).reduce((s, v) => s + v, 0);
  const fromProfXP = Math.floor(totalProfXP / 200);
  return Math.min(TALENT_POINT_CAP, fromLevel + fromProfXP);
}

function getTalentPointsSpent() {
  if (!G.talents) return 0;
  let spent = 0;
  for (const treeId in G.talents) {
    const tree = CLASS_TREES[treeId];
    if (!tree) continue;
    for (const talentId in G.talents[treeId]) {
      const ranks = G.talents[treeId][talentId] || 0;
      const talent = tree.talents.find(t => t.id === talentId);
      const costPerRank = talent ? talent.cost : 1;
      spent += ranks * costPerRank;
    }
  }
  return spent;
}

function getTalentPointsRemaining() {
  return getTalentPointsTotal() - getTalentPointsSpent();
}

function getTalentRank(treeId, talentId) {
  if (!G.talents || !G.talents[treeId]) return 0;
  return G.talents[treeId][talentId] || 0;
}

function _findTalent(treeId, talentId) {
  const tree = CLASS_TREES[treeId];
  if (!tree) return null;
  return tree.talents.find(t => t.id === talentId) || null;
}

function _isTreeFullyMaxed(treeId) {
  const tree = CLASS_TREES[treeId];
  if (!tree) return false;
  for (const t of tree.talents) {
    if (getTalentRank(treeId, t.id) < t.maxRank) return false;
  }
  return true;
}

function canAllocateTalent(treeId, talentId) {
  const talent = _findTalent(treeId, talentId);
  if (!talent) return false;
  if (getTalentRank(treeId, talentId) >= talent.maxRank) return false;
  if (getTalentPointsRemaining() < talent.cost) return false;
  if (talent.prereq) {
    const prereqTalent = _findTalent(treeId, talent.prereq);
    if (!prereqTalent) return false;
    if (getTalentRank(treeId, talent.prereq) < prereqTalent.maxRank) return false;
  }
  if (!isTreeVisible(treeId)) return false;
  return true;
}

function allocateTalent(treeId, talentId) {
  if (!canAllocateTalent(treeId, talentId)) return false;
  if (!G.talents) G.talents = {};
  if (!G.talents[treeId]) G.talents[treeId] = {};
  G.talents[treeId][talentId] = (G.talents[treeId][talentId] || 0) + 1;
  if (typeof saveGame === 'function') saveGame();
  return true;
}

function canDeallocateTalent(treeId, talentId) {
  const rank = getTalentRank(treeId, talentId);
  if (rank <= 0) return false;
  const tree = CLASS_TREES[treeId];
  if (!tree) return false;
  const talent = _findTalent(treeId, talentId);
  if (!talent) return false;
  for (const t of tree.talents) {
    if (t.prereq === talentId && getTalentRank(treeId, t.id) > 0) {
      if (rank - 1 < talent.maxRank) return false;
    }
  }
  return true;
}

function deallocateTalent(treeId, talentId) {
  if (!canDeallocateTalent(treeId, talentId)) return false;
  G.talents[treeId][talentId] -= 1;
  if (typeof saveGame === 'function') saveGame();
  return true;
}

function respecTree(treeId) {
  if (!G.talents || !G.talents[treeId]) return;
  for (const childId in CLASS_TREES) {
    if (CLASS_TREES[childId].requiresTree === treeId) {
      if (G.talents[childId]) G.talents[childId] = {};
    }
  }
  G.talents[treeId] = {};
  if (typeof saveGame === 'function') saveGame();
}

function getTreePointsSpent(treeId) {
  if (!G.talents || !G.talents[treeId]) return 0;
  const tree = CLASS_TREES[treeId];
  if (!tree) return 0;
  let spent = 0;
  for (const talentId in G.talents[treeId]) {
    const ranks = G.talents[treeId][talentId] || 0;
    const talent = tree.talents.find(t => t.id === talentId);
    const costPerRank = talent ? talent.cost : 1;
    spent += ranks * costPerRank;
  }
  return spent;
}

function getTreeMaxPoints(treeId) {
  const tree = CLASS_TREES[treeId];
  if (!tree) return 0;
  let total = 0;
  for (const t of tree.talents) total += t.cost * t.maxRank;
  return total;
}

function isTreeVisible(treeId) {
  const tree = CLASS_TREES[treeId];
  if (!tree) return false;
  if (tree.hidden === 'darkRider' && !G.darkRiderUnlocked) return false;
  if (tree.hidden === 'elder' && !G.elderUnlocked) return false;
  if (tree.requiresTree && !_isTreeFullyMaxed(tree.requiresTree)) return false;
  return true;
}
