// ══════════════════════════════════════════════════════════
//  TALENT TREE DATA + ALLOCATION LOGIC
//  WoW-style talent calculator — class trees, 3 branches each
//  Artisan mastery unlocks: Architect, Armorsmith, Weaponsmith
// ══════════════════════════════════════════════════════════

const CLASS_TREES = {

  // ─── FORTUNE TELLER ───────────────────────────────────
  fortune_teller: {
    name: 'Fortune Teller',
    desc: 'Bestow fortunes upon other players. Gain XP by blessing unique travelers.',
    color: '#44bbff',
    branches: ['Duration', 'Power', 'Resonance'],
    talents: [
      // Branch 0: Duration
      { id: 'ft_dur_1', branch: 0, tier: 0, name: 'Extended Fortune',
        desc: '+5 min fortune duration per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'ft_dur_2', branch: 0, tier: 1, name: 'Enduring Aura',
        desc: 'Fortunes persist through one KO', cost: 1, maxRank: 2, prereq: 'ft_dur_1' },
      { id: 'ft_dur_3', branch: 0, tier: 2, name: 'Persistent Ward',
        desc: 'Fortunes refresh 50% duration on battle win', cost: 1, maxRank: 1, prereq: 'ft_dur_2' },
      { id: 'ft_dur_4', branch: 0, tier: 3, name: 'Eternal Fortune',
        desc: 'Fortunes last 1 hour', cost: 1, maxRank: 1, prereq: 'ft_dur_3' },

      // Branch 1: Power
      { id: 'ft_pow_1', branch: 1, tier: 0, name: 'Potent Fortune',
        desc: '+1 Lucky Stone on fortune per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'ft_pow_2', branch: 1, tier: 1, name: 'Battle Surge',
        desc: 'Fortune grants +1 damage for all rolls after the first', cost: 1, maxRank: 2, prereq: 'ft_pow_1' },
      { id: 'ft_pow_3', branch: 1, tier: 2, name: 'Sacrifice Roll',
        desc: 'Fortune removes 1 die from first roll but +2 damage rest of battle', cost: 1, maxRank: 1, prereq: 'ft_pow_2' },
      { id: 'ft_pow_4', branch: 1, tier: 3, name: 'Warcry',
        desc: 'Fortune grants +1 to all dice rolls for the entire battle', cost: 1, maxRank: 1, prereq: 'ft_pow_3' },

      // Branch 2: Resonance
      { id: 'ft_res_1', branch: 2, tier: 0, name: 'Spirit Link',
        desc: '+10% Fortune XP per unique player blessed per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'ft_res_2', branch: 2, tier: 1, name: 'Aura Cascade',
        desc: 'Blessing a player also fortunes their active spiritkin', cost: 1, maxRank: 2, prereq: 'ft_res_1' },
      { id: 'ft_res_3', branch: 2, tier: 2, name: 'Group Blessing',
        desc: 'Fortune hits 2 nearby players at once', cost: 1, maxRank: 1, prereq: 'ft_res_2' },
      { id: 'ft_res_4', branch: 2, tier: 3, name: 'Resonance Field',
        desc: 'All players in your region get a minor fortune passively', cost: 1, maxRank: 1, prereq: 'ft_res_3' },
    ],
  },

  // ─── ARTISAN (base — mastering unlocks Architect, Armorsmith, Weaponsmith) ──
  artisan: {
    name: 'Artisan',
    desc: 'Master crafting fundamentals. Completing this tree unlocks Architect, Armorsmith & Weaponsmith.',
    color: '#dd9933',
    branches: ['Construction', 'Materials', 'Township'],
    talents: [
      // Branch 0: Construction
      { id: 'art_con_1', branch: 0, tier: 0, name: 'Foundation',
        desc: 'Build a basic house (respawn point)', cost: 1, maxRank: 3, prereq: null },
      { id: 'art_con_2', branch: 0, tier: 1, name: 'Homestead',
        desc: 'House grants a mini buff when you exit', cost: 1, maxRank: 2, prereq: 'art_con_1' },
      { id: 'art_con_3', branch: 0, tier: 2, name: 'Workshop',
        desc: 'Build a workshop (+10% crafting success nearby)', cost: 1, maxRank: 1, prereq: 'art_con_2' },
      { id: 'art_con_4', branch: 0, tier: 3, name: 'Fortress',
        desc: 'Build reinforced structures that resist raids', cost: 1, maxRank: 1, prereq: 'art_con_3' },

      // Branch 1: Materials
      { id: 'art_mat_1', branch: 1, tier: 0, name: 'Resource Finder',
        desc: '+15% gathering yield per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'art_mat_2', branch: 1, tier: 1, name: 'Efficient Craft',
        desc: '10% chance to not consume materials per rank', cost: 1, maxRank: 2, prereq: 'art_mat_1' },
      { id: 'art_mat_3', branch: 1, tier: 2, name: 'Rare Alloys',
        desc: 'Unlock rare material recipes', cost: 1, maxRank: 1, prereq: 'art_mat_2' },
      { id: 'art_mat_4', branch: 1, tier: 3, name: 'Master Refiner',
        desc: 'All crafted items gain +1 quality tier', cost: 1, maxRank: 1, prereq: 'art_mat_3' },

      // Branch 2: Township
      { id: 'art_twn_1', branch: 2, tier: 0, name: 'Settlement',
        desc: 'Designate an area as your settlement', cost: 1, maxRank: 3, prereq: null },
      { id: 'art_twn_2', branch: 2, tier: 1, name: 'Tavern',
        desc: 'Build a tavern (players can rest for buffs)', cost: 1, maxRank: 2, prereq: 'art_twn_1' },
      { id: 'art_twn_3', branch: 2, tier: 2, name: 'Market Square',
        desc: 'Build a market (players can trade here)', cost: 1, maxRank: 1, prereq: 'art_twn_2' },
      { id: 'art_twn_4', branch: 2, tier: 3, name: 'Battle Arena',
        desc: 'Build a custom battle arena in your town', cost: 1, maxRank: 1, prereq: 'art_twn_3' },
    ],
  },

  // ─── ARCHITECT (requires Artisan mastery) ─────────────
  architect: {
    name: 'Architect',
    desc: 'Design grand structures and mounts. Requires Artisan mastery.',
    color: '#cc8833',
    requiresTree: 'artisan',
    branches: ['Grand Design', 'Mounts', 'Wonders'],
    talents: [
      // Branch 0: Grand Design
      { id: 'arc_gd_1', branch: 0, tier: 0, name: 'Blueprints',
        desc: 'Design advanced structures before building', cost: 1, maxRank: 3, prereq: null },
      { id: 'arc_gd_2', branch: 0, tier: 1, name: 'Reinforced Walls',
        desc: 'Structures have 2x durability per rank', cost: 1, maxRank: 2, prereq: 'arc_gd_1' },
      { id: 'arc_gd_3', branch: 0, tier: 2, name: 'Grand Hall',
        desc: 'Build a grand hall (8 players can rest inside)', cost: 1, maxRank: 1, prereq: 'arc_gd_2' },
      { id: 'arc_gd_4', branch: 0, tier: 3, name: 'Citadel',
        desc: 'Build a citadel — the ultimate player structure', cost: 1, maxRank: 1, prereq: 'arc_gd_3' },

      // Branch 1: Mounts
      { id: 'arc_mnt_1', branch: 1, tier: 0, name: 'Raft Builder',
        desc: 'Craft a basic raft for water travel', cost: 1, maxRank: 3, prereq: null },
      { id: 'arc_mnt_2', branch: 1, tier: 1, name: 'Stable & Saddle',
        desc: 'Build a stable and craft basic spiritkin mounts', cost: 1, maxRank: 2, prereq: 'arc_mnt_1' },
      { id: 'arc_mnt_3', branch: 1, tier: 2, name: 'Armored Mount',
        desc: 'Upgrade mounts with armor (+1 HP absorb)', cost: 1, maxRank: 1, prereq: 'arc_mnt_2' },
      { id: 'arc_mnt_4', branch: 1, tier: 3, name: 'Hover Skiff',
        desc: 'Craft a sci-fi hover skiff (all-terrain mount)', cost: 1, maxRank: 1, prereq: 'arc_mnt_3' },

      // Branch 2: Wonders
      { id: 'arc_wnd_1', branch: 2, tier: 0, name: 'Beacon Tower',
        desc: 'Build a beacon visible across the region', cost: 1, maxRank: 3, prereq: null },
      { id: 'arc_wnd_2', branch: 2, tier: 1, name: 'Portal Arch',
        desc: 'Build a portal connecting two of your structures', cost: 1, maxRank: 2, prereq: 'arc_wnd_1' },
      { id: 'arc_wnd_3', branch: 2, tier: 2, name: 'Sky Bridge',
        desc: 'Connect distant structures with a traversable bridge', cost: 1, maxRank: 1, prereq: 'arc_wnd_2' },
      { id: 'arc_wnd_4', branch: 2, tier: 3, name: 'Monument',
        desc: 'Build a monument — permanent world landmark with your name', cost: 1, maxRank: 1, prereq: 'arc_wnd_3' },
    ],
  },

  // ─── ARMORSMITH (requires Artisan mastery) ────────────
  armorsmith: {
    name: 'Armorsmith',
    desc: 'Forge powerful armor and shields. Requires Artisan mastery.',
    color: '#7799cc',
    requiresTree: 'artisan',
    branches: ['Plate', 'Shields', 'Enchantment'],
    talents: [
      // Branch 0: Plate
      { id: 'arm_plt_1', branch: 0, tier: 0, name: 'Iron Plate',
        desc: 'Craft basic armor (+1 damage reduction per rank)', cost: 1, maxRank: 3, prereq: null },
      { id: 'arm_plt_2', branch: 0, tier: 1, name: 'Tempered Steel',
        desc: 'Armor durability increased 50% per rank', cost: 1, maxRank: 2, prereq: 'arm_plt_1' },
      { id: 'arm_plt_3', branch: 0, tier: 2, name: 'Spirit Plate',
        desc: 'Craft armor infused with spiritkin essence', cost: 1, maxRank: 1, prereq: 'arm_plt_2' },
      { id: 'arm_plt_4', branch: 0, tier: 3, name: 'Legendary Armor',
        desc: 'Craft legendary-tier armor with unique passive', cost: 1, maxRank: 1, prereq: 'arm_plt_3' },

      // Branch 1: Shields
      { id: 'arm_shd_1', branch: 1, tier: 0, name: 'Buckler',
        desc: 'Craft a basic shield (block 1 damage per rank)', cost: 1, maxRank: 3, prereq: null },
      { id: 'arm_shd_2', branch: 1, tier: 1, name: 'Tower Shield',
        desc: 'Shield blocks 2 additional damage', cost: 1, maxRank: 2, prereq: 'arm_shd_1' },
      { id: 'arm_shd_3', branch: 1, tier: 2, name: 'Reflective Guard',
        desc: 'Shield reflects 1 damage back to attacker', cost: 1, maxRank: 1, prereq: 'arm_shd_2' },
      { id: 'arm_shd_4', branch: 1, tier: 3, name: 'Aegis',
        desc: 'Craft the Aegis — absorbs one full attack per battle', cost: 1, maxRank: 1, prereq: 'arm_shd_3' },

      // Branch 2: Enchantment
      { id: 'arm_enc_1', branch: 2, tier: 0, name: 'Basic Rune',
        desc: 'Apply a basic rune to armor (+1 stat per rank)', cost: 1, maxRank: 3, prereq: null },
      { id: 'arm_enc_2', branch: 2, tier: 1, name: 'Warding Rune',
        desc: 'Rune grants resistance to status effects', cost: 1, maxRank: 2, prereq: 'arm_enc_1' },
      { id: 'arm_enc_3', branch: 2, tier: 2, name: 'Soulforge',
        desc: 'Bind a spiritkin soul to armor for a passive ability', cost: 1, maxRank: 1, prereq: 'arm_enc_2' },
      { id: 'arm_enc_4', branch: 2, tier: 3, name: 'Mythic Enchant',
        desc: 'Apply a mythic enchant — armor gains a unique active ability', cost: 1, maxRank: 1, prereq: 'arm_enc_3' },
    ],
  },

  // ─── WEAPONSMITH (requires Artisan mastery) ───────────
  weaponsmith: {
    name: 'Weaponsmith',
    desc: 'Forge devastating weapons. Requires Artisan mastery.',
    color: '#dd5544',
    requiresTree: 'artisan',
    branches: ['Blades', 'Ranged', 'Infusion'],
    talents: [
      // Branch 0: Blades
      { id: 'wpn_bld_1', branch: 0, tier: 0, name: 'Iron Blade',
        desc: 'Craft a basic blade (+1 damage per rank)', cost: 1, maxRank: 3, prereq: null },
      { id: 'wpn_bld_2', branch: 0, tier: 1, name: 'Keen Edge',
        desc: 'Blades have +10% crit chance per rank', cost: 1, maxRank: 2, prereq: 'wpn_bld_1' },
      { id: 'wpn_bld_3', branch: 0, tier: 2, name: 'Spirit Blade',
        desc: 'Craft a blade that channels spiritkin energy', cost: 1, maxRank: 1, prereq: 'wpn_bld_2' },
      { id: 'wpn_bld_4', branch: 0, tier: 3, name: 'Legendary Sword',
        desc: 'Craft a legendary sword with a unique ability', cost: 1, maxRank: 1, prereq: 'wpn_bld_3' },

      // Branch 1: Ranged
      { id: 'wpn_rng_1', branch: 1, tier: 0, name: 'Slingshot',
        desc: 'Craft a basic ranged weapon per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'wpn_rng_2', branch: 1, tier: 1, name: 'Crossbow',
        desc: 'Craft a crossbow (+2 first-strike damage)', cost: 1, maxRank: 2, prereq: 'wpn_rng_1' },
      { id: 'wpn_rng_3', branch: 1, tier: 2, name: 'Energy Blaster',
        desc: 'Craft a sci-fi blaster (ignores armor)', cost: 1, maxRank: 1, prereq: 'wpn_rng_2' },
      { id: 'wpn_rng_4', branch: 1, tier: 3, name: 'Plasma Cannon',
        desc: 'Craft a plasma cannon — devastating AoE first strike', cost: 1, maxRank: 1, prereq: 'wpn_rng_3' },

      // Branch 2: Infusion
      { id: 'wpn_inf_1', branch: 2, tier: 0, name: 'Flame Touch',
        desc: 'Infuse weapon with fire (+1 burn damage per rank)', cost: 1, maxRank: 3, prereq: null },
      { id: 'wpn_inf_2', branch: 2, tier: 1, name: 'Frost Bite',
        desc: 'Infuse weapon with ice (chance to slow enemy)', cost: 1, maxRank: 2, prereq: 'wpn_inf_1' },
      { id: 'wpn_inf_3', branch: 2, tier: 2, name: 'Lightning Strike',
        desc: 'Infuse weapon with lightning (chain to nearby)', cost: 1, maxRank: 1, prereq: 'wpn_inf_2' },
      { id: 'wpn_inf_4', branch: 2, tier: 3, name: 'Void Edge',
        desc: 'Infuse weapon with void energy — attacks drain spirit', cost: 1, maxRank: 1, prereq: 'wpn_inf_3' },
    ],
  },

  // ─── TRAINER ──────────────────────────────────────────
  trainer: {
    name: 'Trainer',
    desc: 'Master the art of spiritkin combat and collection.',
    color: '#44dd66',
    branches: ['Combat', 'Collection', 'Bonding'],
    talents: [
      // Branch 0: Combat
      { id: 'trn_com_1', branch: 0, tier: 0, name: 'Battle Instinct',
        desc: '+5% combat XP per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'trn_com_2', branch: 0, tier: 1, name: 'Veteran Tactics',
        desc: 'See enemy HP before battle starts', cost: 1, maxRank: 2, prereq: 'trn_com_1' },
      { id: 'trn_com_3', branch: 0, tier: 2, name: 'Challenger',
        desc: '+1 Spirit reward from trainer battles', cost: 1, maxRank: 1, prereq: 'trn_com_2' },
      { id: 'trn_com_4', branch: 0, tier: 3, name: 'Champion',
        desc: 'Defeating a trainer grants a chance at their rarest spiritkin', cost: 1, maxRank: 1, prereq: 'trn_com_3' },

      // Branch 1: Collection
      { id: 'trn_col_1', branch: 1, tier: 0, name: 'Keen Eye',
        desc: '+10% recruit chance per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'trn_col_2', branch: 1, tier: 1, name: 'Spiritkin Whisperer',
        desc: 'Wild spiritkin are less aggressive', cost: 1, maxRank: 2, prereq: 'trn_col_1' },
      { id: 'trn_col_3', branch: 1, tier: 2, name: 'Rare Seeker',
        desc: 'Increased rare spiritkin spawn rate', cost: 1, maxRank: 1, prereq: 'trn_col_2' },
      { id: 'trn_col_4', branch: 1, tier: 3, name: 'Legendary Tracker',
        desc: 'Sense legendary spiritkin in your region', cost: 1, maxRank: 1, prereq: 'trn_col_3' },

      // Branch 2: Bonding
      { id: 'trn_bnd_1', branch: 2, tier: 0, name: 'Kindred Spirit',
        desc: 'Active spiritkin gains +1 max HP per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'trn_bnd_2', branch: 2, tier: 1, name: 'Spirit Sync',
        desc: 'Spiritkin abilities have +10% potency', cost: 1, maxRank: 2, prereq: 'trn_bnd_1' },
      { id: 'trn_bnd_3', branch: 2, tier: 2, name: 'Soul Bond',
        desc: 'Bonded spiritkin heals 1 HP between battles', cost: 1, maxRank: 1, prereq: 'trn_bnd_2' },
      { id: 'trn_bnd_4', branch: 2, tier: 3, name: 'True Partner',
        desc: 'Your lead spiritkin gains a unique passive', cost: 1, maxRank: 1, prereq: 'trn_bnd_3' },
    ],
  },

  // ─── SCIENTIST (was Geneticist) ───────────────────────
  scientist: {
    name: 'Scientist',
    desc: 'Extract DNA from spiritkin and create mutations in the lab.',
    color: '#aa55ff',
    branches: ['Extraction', 'Mutations', 'Synthesis'],
    talents: [
      // Branch 0: Extraction
      { id: 'sci_ext_1', branch: 0, tier: 0, name: 'DNA Probe',
        desc: 'Unlock DNA extraction from wild spiritkin', cost: 1, maxRank: 3, prereq: null },
      { id: 'sci_ext_2', branch: 0, tier: 1, name: 'Refined Extraction',
        desc: '+15% extraction success per rank', cost: 1, maxRank: 2, prereq: 'sci_ext_1' },
      { id: 'sci_ext_3', branch: 0, tier: 2, name: 'Quick Getaway',
        desc: 'Auto-escape after failed extraction', cost: 1, maxRank: 1, prereq: 'sci_ext_2' },
      { id: 'sci_ext_4', branch: 0, tier: 3, name: 'Master Extractor',
        desc: 'Extract DNA from legendary spiritkin', cost: 1, maxRank: 1, prereq: 'sci_ext_3' },

      // Branch 1: Mutations
      { id: 'sci_mut_1', branch: 1, tier: 0, name: 'Splice Basics',
        desc: 'Create basic mutations in the lab', cost: 1, maxRank: 3, prereq: null },
      { id: 'sci_mut_2', branch: 1, tier: 1, name: 'Combat Strain',
        desc: 'Mutations gain +2 base damage', cost: 1, maxRank: 2, prereq: 'sci_mut_1' },
      { id: 'sci_mut_3', branch: 1, tier: 2, name: 'Alpha Predator',
        desc: 'Create ace-tier mutations with unique abilities', cost: 1, maxRank: 1, prereq: 'sci_mut_2' },
      { id: 'sci_mut_4', branch: 1, tier: 3, name: 'Perfect Specimen',
        desc: 'Mutations can evolve once in battle', cost: 1, maxRank: 1, prereq: 'sci_mut_3' },

      // Branch 2: Synthesis
      { id: 'sci_syn_1', branch: 2, tier: 0, name: 'Bio Reactor',
        desc: 'Mutations passively generate resources', cost: 1, maxRank: 3, prereq: null },
      { id: 'sci_syn_2', branch: 2, tier: 1, name: 'Sideline Specialist',
        desc: 'Create support mutations that buff your team', cost: 1, maxRank: 2, prereq: 'sci_syn_1' },
      { id: 'sci_syn_3', branch: 2, tier: 2, name: 'Harvest Protocol',
        desc: 'Double resource yield from mutations', cost: 1, maxRank: 1, prereq: 'sci_syn_2' },
      { id: 'sci_syn_4', branch: 2, tier: 3, name: 'Living Factory',
        desc: 'Mutations auto-generate rare materials over time', cost: 1, maxRank: 1, prereq: 'sci_syn_3' },
    ],
  },

  // ─── DARK RIDER (hidden — secret unlock) ──────────────
  dark_rider: {
    name: '???',
    desc: 'A mysterious force stirs within...',
    color: '#cc2244',
    hidden: 'darkRider',
    branches: ['Shadow', 'Dominion', 'Dread'],
    talents: [
      // Branch 0: Shadow
      { id: 'drk_shd_1', branch: 0, tier: 0, name: 'Dark Awakening',
        desc: 'Transform into Dark Rider for 1 minute (1-day cooldown)', cost: 1, maxRank: 3, prereq: null },
      { id: 'drk_shd_2', branch: 0, tier: 1, name: 'Shadow Stride',
        desc: 'Move 50% faster while transformed', cost: 1, maxRank: 2, prereq: 'drk_shd_1' },
      { id: 'drk_shd_3', branch: 0, tier: 2, name: 'Cloak of Night',
        desc: 'Immune to unwanted battles while transformed', cost: 1, maxRank: 1, prereq: 'drk_shd_2' },
      { id: 'drk_shd_4', branch: 0, tier: 3, name: 'Endless Night',
        desc: 'Transform lasts 2 minutes', cost: 1, maxRank: 1, prereq: 'drk_shd_3' },

      // Branch 1: Dominion
      { id: 'drk_dom_1', branch: 1, tier: 0, name: 'Dark Challenge',
        desc: 'Challenge any live player as a Dark Rider', cost: 1, maxRank: 3, prereq: null },
      { id: 'drk_dom_2', branch: 1, tier: 1, name: 'Soul Harvest',
        desc: '+50% Spirit reward from Dark Rider victories', cost: 1, maxRank: 2, prereq: 'drk_dom_1' },
      { id: 'drk_dom_3', branch: 1, tier: 2, name: 'Fear Aura',
        desc: 'Nearby players see a warning when you transform', cost: 1, maxRank: 1, prereq: 'drk_dom_2' },
      { id: 'drk_dom_4', branch: 1, tier: 3, name: 'Wrath of the Rider',
        desc: 'Dark Rider battles grant 3x Spirit on victory', cost: 1, maxRank: 1, prereq: 'drk_dom_3' },

      // Branch 2: Dread
      { id: 'drk_drd_1', branch: 2, tier: 0, name: 'Spirit Sight',
        desc: 'Interact with hidden spirit objects while transformed', cost: 1, maxRank: 3, prereq: null },
      { id: 'drk_drd_2', branch: 2, tier: 1, name: 'Dread Presence',
        desc: 'NPCs react differently to your Dark Rider form', cost: 1, maxRank: 2, prereq: 'drk_drd_1' },
      { id: 'drk_drd_3', branch: 2, tier: 2, name: 'Phantom Gate',
        desc: 'Access hidden Dark Rider-only areas', cost: 1, maxRank: 1, prereq: 'drk_drd_2' },
      { id: 'drk_drd_4', branch: 2, tier: 3, name: 'The Horseman',
        desc: 'Cooldown reduced to 12 hours', cost: 1, maxRank: 1, prereq: 'drk_drd_3' },
    ],
  },

  // ─── ELDER (hidden — secret unlock) ───────────────────
  elder: {
    name: '???',
    desc: 'The wisdom of ages flows through you...',
    color: '#ddcc44',
    hidden: 'elder',
    branches: ['Protection', 'Prosperity', 'Council'],
    talents: [
      // Branch 0: Protection — defensive world abilities
      { id: 'eld_pro_1', branch: 0, tier: 0, name: 'Elder Shield',
        desc: 'Shield absorbs the first roll of damage in every battle', cost: 1, maxRank: 3, prereq: null },
      { id: 'eld_pro_2', branch: 0, tier: 1, name: 'Spirit Barrier',
        desc: 'Shield also protects your sideline spiritkin', cost: 1, maxRank: 2, prereq: 'eld_pro_1' },
      { id: 'eld_pro_3', branch: 0, tier: 2, name: 'Sanctuary',
        desc: 'Declare a safe zone — no battles in a small radius', cost: 1, maxRank: 1, prereq: 'eld_pro_2' },
      { id: 'eld_pro_4', branch: 0, tier: 3, name: 'Aegis of the Elder',
        desc: 'Shield absorbs the first TWO rolls of damage', cost: 1, maxRank: 1, prereq: 'eld_pro_3' },

      // Branch 1: Prosperity — buffs & party bonuses
      { id: 'eld_prs_1', branch: 1, tier: 0, name: 'Golden Touch',
        desc: 'Unique buff: +15% gold from victories per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'eld_prs_2', branch: 1, tier: 1, name: 'Elder Bond',
        desc: 'Party members gain +10% XP while grouped with you', cost: 1, maxRank: 2, prereq: 'eld_prs_1' },
      { id: 'eld_prs_3', branch: 1, tier: 2, name: 'Teamup Surge',
        desc: 'Party battles grant bonus dice to all members', cost: 1, maxRank: 1, prereq: 'eld_prs_2' },
      { id: 'eld_prs_4', branch: 1, tier: 3, name: 'Elder Sanctum',
        desc: 'Unlocks the Elder Sanctum — a unique area only Elders can visit', cost: 1, maxRank: 1, prereq: 'eld_prs_3' },

      // Branch 2: Council — governance & amendments
      { id: 'eld_cou_1', branch: 2, tier: 0, name: 'Council Voice',
        desc: 'Vote in the weekly Elder Council', cost: 1, maxRank: 3, prereq: null },
      { id: 'eld_cou_2', branch: 2, tier: 1, name: 'Proposal Rights',
        desc: 'Propose new amendments for the Council to vote on', cost: 1, maxRank: 2, prereq: 'eld_cou_1' },
      { id: 'eld_cou_3', branch: 2, tier: 2, name: 'Filibuster',
        desc: 'Your vote counts double in Council elections', cost: 1, maxRank: 1, prereq: 'eld_cou_2' },
      { id: 'eld_cou_4', branch: 2, tier: 3, name: 'Grand Elder',
        desc: 'Break ties in Council votes. Your word is final.', cost: 1, maxRank: 1, prereq: 'eld_cou_3' },
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


// ── Talent Point Calculations ──────────────────────────
// Enough to master 2 full trees + most of a 3rd
// Each tree costs 21 to max (3+2+1+1 per branch x3)
// Cap: 60 points = master 2 trees (42) + 18 into a 3rd

const TALENT_POINT_CAP = 60;

function getTalentPointsTotal() {
  const fromLevel = (G.level || 1) * 2;
  const profXP = G.professionXP || {};
  const totalProfXP = Object.values(profXP).reduce((s, v) => s + v, 0);
  const fromProfXP = Math.floor(totalProfXP / 250);
  return Math.min(TALENT_POINT_CAP, fromLevel + fromProfXP);
}

function getTalentPointsSpent() {
  if (!G.talents) return 0;
  let spent = 0;
  for (const treeId in G.talents) {
    for (const talentId in G.talents[treeId]) {
      spent += G.talents[treeId][talentId] || 0;
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
  // Prereq satisfied?
  if (talent.prereq) {
    const prereqTalent = _findTalent(treeId, talent.prereq);
    if (!prereqTalent) return false;
    if (getTalentRank(treeId, talent.prereq) < prereqTalent.maxRank) return false;
  }
  // Tree visibility check (hidden trees + requiresTree)
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
  // If this is a parent tree, also respec child trees that depend on it
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
  let spent = 0;
  for (const talentId in G.talents[treeId]) {
    spent += G.talents[treeId][talentId] || 0;
  }
  return spent;
}

function isTreeVisible(treeId) {
  const tree = CLASS_TREES[treeId];
  if (!tree) return false;
  // Hidden trees need their specific unlock flag
  if (tree.hidden === 'darkRider' && !G.darkRiderUnlocked) return false;
  if (tree.hidden === 'elder' && !G.elderUnlocked) return false;
  // Sub-trees require parent mastery
  if (tree.requiresTree && !_isTreeFullyMaxed(tree.requiresTree)) return false;
  return true;
}
