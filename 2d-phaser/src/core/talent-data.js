// ══════════════════════════════════════════════════════════
//  TALENT TREE DATA + ALLOCATION LOGIC
//  WoW-style talent calculator — 6 class trees, 3 branches each
// ══════════════════════════════════════════════════════════

const CLASS_TREES = {

  // ─── BUFFER ───────────────────────────────────────────
  buffer: {
    name: 'Buffer',
    desc: 'Buff other players with auras and blessings. Gain XP by buffing unique players.',
    color: '#44bbff',
    branches: ['Duration', 'Power', 'Resonance'],
    talents: [
      // Branch 0: Duration
      { id: 'buf_dur_1', branch: 0, tier: 0, name: 'Extended Blessing',
        desc: '+5 min buff duration per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'buf_dur_2', branch: 0, tier: 1, name: 'Enduring Aura',
        desc: 'Buffs persist through one KO', cost: 1, maxRank: 2, prereq: 'buf_dur_1' },
      { id: 'buf_dur_3', branch: 0, tier: 2, name: 'Persistent Ward',
        desc: 'Buffs refresh 50% duration on battle win', cost: 1, maxRank: 1, prereq: 'buf_dur_2' },
      { id: 'buf_dur_4', branch: 0, tier: 3, name: 'Eternal Blessing',
        desc: 'Buffs last 1 hour', cost: 1, maxRank: 1, prereq: 'buf_dur_3' },

      // Branch 1: Power
      { id: 'buf_pow_1', branch: 1, tier: 0, name: 'Potent Blessing',
        desc: '+1 Lucky Stone on buff per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'buf_pow_2', branch: 1, tier: 1, name: 'Battle Surge',
        desc: 'Buff grants +1 damage for all rolls after the first', cost: 1, maxRank: 2, prereq: 'buf_pow_1' },
      { id: 'buf_pow_3', branch: 1, tier: 2, name: 'Sacrifice Roll',
        desc: 'Buff removes 1 die from first roll but +2 damage rest of battle', cost: 1, maxRank: 1, prereq: 'buf_pow_2' },
      { id: 'buf_pow_4', branch: 1, tier: 3, name: 'Warcry',
        desc: 'Buff grants +1 to all dice rolls for the entire battle', cost: 1, maxRank: 1, prereq: 'buf_pow_3' },

      // Branch 2: Resonance
      { id: 'buf_res_1', branch: 2, tier: 0, name: 'Spirit Link',
        desc: '+10% Buff XP per unique player buffed per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'buf_res_2', branch: 2, tier: 1, name: 'Aura Cascade',
        desc: 'Buffing a player also buffs their active spiritkin', cost: 1, maxRank: 2, prereq: 'buf_res_1' },
      { id: 'buf_res_3', branch: 2, tier: 2, name: 'Group Blessing',
        desc: 'Buff hits 2 nearby players at once', cost: 1, maxRank: 1, prereq: 'buf_res_2' },
      { id: 'buf_res_4', branch: 2, tier: 3, name: 'Resonance Field',
        desc: 'All players in your region get a minor buff passively', cost: 1, maxRank: 1, prereq: 'buf_res_3' },
    ],
  },

  // ─── ARTISAN ──────────────────────────────────────────
  artisan: {
    name: 'Artisan',
    desc: 'Build structures, vehicles, and eventually entire towns.',
    color: '#dd9933',
    branches: ['Construction', 'Vehicles', 'Township'],
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

      // Branch 1: Vehicles
      { id: 'art_veh_1', branch: 1, tier: 0, name: 'Raft Builder',
        desc: 'Craft a basic raft for water travel', cost: 1, maxRank: 3, prereq: null },
      { id: 'art_veh_2', branch: 1, tier: 1, name: 'Boat Builder',
        desc: 'Craft a boat (faster water travel)', cost: 1, maxRank: 2, prereq: 'art_veh_1' },
      { id: 'art_veh_3', branch: 1, tier: 2, name: 'Wagon Engineer',
        desc: 'Craft a wagon (carry more items overland)', cost: 1, maxRank: 1, prereq: 'art_veh_2' },
      { id: 'art_veh_4', branch: 1, tier: 3, name: 'Hover Skiff',
        desc: 'Craft a sci-fi hover skiff (all-terrain)', cost: 1, maxRank: 1, prereq: 'art_veh_3' },

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

  // ─── GENETICIST ───────────────────────────────────────
  geneticist: {
    name: 'Geneticist',
    desc: 'Extract DNA from spiritkin and create mutations in the lab.',
    color: '#aa55ff',
    branches: ['Extraction', 'Mutations', 'Synthesis'],
    talents: [
      // Branch 0: Extraction
      { id: 'gen_ext_1', branch: 0, tier: 0, name: 'DNA Probe',
        desc: 'Unlock DNA extraction from wild spiritkin', cost: 1, maxRank: 3, prereq: null },
      { id: 'gen_ext_2', branch: 0, tier: 1, name: 'Refined Extraction',
        desc: '+15% extraction success per rank', cost: 1, maxRank: 2, prereq: 'gen_ext_1' },
      { id: 'gen_ext_3', branch: 0, tier: 2, name: 'Quick Getaway',
        desc: 'Auto-escape after failed extraction', cost: 1, maxRank: 1, prereq: 'gen_ext_2' },
      { id: 'gen_ext_4', branch: 0, tier: 3, name: 'Master Extractor',
        desc: 'Extract DNA from legendary spiritkin', cost: 1, maxRank: 1, prereq: 'gen_ext_3' },

      // Branch 1: Mutations (Sideline helpers → Ace fighter)
      { id: 'gen_mut_1', branch: 1, tier: 0, name: 'Splice Basics',
        desc: 'Create basic mutations in the lab', cost: 1, maxRank: 3, prereq: null },
      { id: 'gen_mut_2', branch: 1, tier: 1, name: 'Combat Strain',
        desc: 'Mutations gain +2 base damage', cost: 1, maxRank: 2, prereq: 'gen_mut_1' },
      { id: 'gen_mut_3', branch: 1, tier: 2, name: 'Alpha Predator',
        desc: 'Create ace-tier mutations with unique abilities', cost: 1, maxRank: 1, prereq: 'gen_mut_2' },
      { id: 'gen_mut_4', branch: 1, tier: 3, name: 'Perfect Specimen',
        desc: 'Mutations can evolve once in battle', cost: 1, maxRank: 1, prereq: 'gen_mut_3' },

      // Branch 2: Synthesis (Resource generation)
      { id: 'gen_syn_1', branch: 2, tier: 0, name: 'Bio Reactor',
        desc: 'Mutations passively generate resources', cost: 1, maxRank: 3, prereq: null },
      { id: 'gen_syn_2', branch: 2, tier: 1, name: 'Sideline Specialist',
        desc: 'Create support mutations that buff your team', cost: 1, maxRank: 2, prereq: 'gen_syn_1' },
      { id: 'gen_syn_3', branch: 2, tier: 2, name: 'Harvest Protocol',
        desc: 'Double resource yield from mutations', cost: 1, maxRank: 1, prereq: 'gen_syn_2' },
      { id: 'gen_syn_4', branch: 2, tier: 3, name: 'Living Factory',
        desc: 'Mutations auto-generate rare materials over time', cost: 1, maxRank: 1, prereq: 'gen_syn_3' },
    ],
  },

  // ─── DARK RIDER (hidden until unlocked) ───────────────
  dark_rider: {
    name: '???',
    desc: 'A mysterious force stirs within...',
    color: '#cc2244',
    hidden: true,
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

  // ─── MOUNTS ───────────────────────────────────────────
  mounts: {
    name: 'Mounts',
    desc: 'Tame and create rideable spiritkin mounts.',
    color: '#ffaa44',
    branches: ['Taming', 'Speed', 'War Mount'],
    talents: [
      // Branch 0: Taming
      { id: 'mnt_tam_1', branch: 0, tier: 0, name: 'Mount Training',
        desc: 'Unlock basic mount creation from spiritkin', cost: 1, maxRank: 3, prereq: null },
      { id: 'mnt_tam_2', branch: 0, tier: 1, name: 'Stable Master',
        desc: 'Store up to 3 mounts at once', cost: 1, maxRank: 2, prereq: 'mnt_tam_1' },
      { id: 'mnt_tam_3', branch: 0, tier: 2, name: 'Wild Breaker',
        desc: 'Tame rare spiritkin as mounts', cost: 1, maxRank: 1, prereq: 'mnt_tam_2' },
      { id: 'mnt_tam_4', branch: 0, tier: 3, name: 'Legendary Steed',
        desc: 'Tame legendary spiritkin as mounts', cost: 1, maxRank: 1, prereq: 'mnt_tam_3' },

      // Branch 1: Speed
      { id: 'mnt_spd_1', branch: 1, tier: 0, name: 'Saddle Up',
        desc: '+20% mount speed per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'mnt_spd_2', branch: 1, tier: 1, name: 'Sprint',
        desc: 'Mount dash ability (short burst of speed)', cost: 1, maxRank: 2, prereq: 'mnt_spd_1' },
      { id: 'mnt_spd_3', branch: 1, tier: 2, name: 'All-Terrain',
        desc: 'Mount ignores terrain speed penalties', cost: 1, maxRank: 1, prereq: 'mnt_spd_2' },
      { id: 'mnt_spd_4', branch: 1, tier: 3, name: 'Teleport Gallop',
        desc: 'Instant travel to any visited location while mounted', cost: 1, maxRank: 1, prereq: 'mnt_spd_3' },

      // Branch 2: War Mount
      { id: 'mnt_war_1', branch: 2, tier: 0, name: 'Battle Ready',
        desc: 'Mount grants +1 die in battle per rank', cost: 1, maxRank: 3, prereq: null },
      { id: 'mnt_war_2', branch: 2, tier: 1, name: 'Armored Mount',
        desc: 'Mount absorbs first hit of damage', cost: 1, maxRank: 2, prereq: 'mnt_war_1' },
      { id: 'mnt_war_3', branch: 2, tier: 2, name: 'Charge',
        desc: 'Mounted charge deals bonus damage on first attack', cost: 1, maxRank: 1, prereq: 'mnt_war_2' },
      { id: 'mnt_war_4', branch: 2, tier: 3, name: 'Juggernaut',
        desc: 'Mount + rider fight as one (combined HP pool)', cost: 1, maxRank: 1, prereq: 'mnt_war_3' },
    ],
  },
};


// ── Talent Point Calculations ──────────────────────────

function getTalentPointsTotal() {
  const fromLevel = G.level || 1;
  const profXP = G.professionXP || {};
  const totalProfXP = Object.values(profXP).reduce((s, v) => s + v, 0);
  const fromProfXP = Math.floor(totalProfXP / 500);
  return Math.min(51, fromLevel + fromProfXP);
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

function canAllocateTalent(treeId, talentId) {
  const talent = _findTalent(treeId, talentId);
  if (!talent) return false;
  // Already maxed?
  if (getTalentRank(treeId, talentId) >= talent.maxRank) return false;
  // Enough points?
  if (getTalentPointsRemaining() < talent.cost) return false;
  // Prereq satisfied?
  if (talent.prereq) {
    const prereqTalent = _findTalent(treeId, talent.prereq);
    if (!prereqTalent) return false;
    if (getTalentRank(treeId, talent.prereq) < prereqTalent.maxRank) return false;
  }
  // Dark Rider hidden check
  const tree = CLASS_TREES[treeId];
  if (tree.hidden && !G.darkRiderUnlocked) return false;
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
  // Check if any talent depends on this one having max ranks
  const tree = CLASS_TREES[treeId];
  if (!tree) return false;
  const talent = _findTalent(treeId, talentId);
  if (!talent) return false;
  for (const t of tree.talents) {
    if (t.prereq === talentId && getTalentRank(treeId, t.id) > 0) {
      // A dependent talent has ranks — can't remove unless we'd still be at max
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
  if (tree.hidden && !G.darkRiderUnlocked) return false;
  return true;
}
