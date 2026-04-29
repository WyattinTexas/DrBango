// =================================================================
// RAID ENGINE — Boss AI, loot, equip, team building, damage modifiers
// v2.0 — Lifecycle/queue/sync moved to raid-sync.js + raid-state-machine.js
// Depends on: cards.js (RAID_BOSSES, RAID_BOSS_MINIONS, RAID_BADGES)
//             battle-engine.js (classify, weightedRoll, etc.)
//             raid-state-machine.js (RaidState)
// =================================================================

const RAID_CONFIG = {
  MAX_PLAYERS: 10,
  MIN_PLAYERS_FOR_EARLY_START: 5,
  QUEUE_TIMEOUT_MS: 10 * 60 * 1000,
  HEARTBEAT_INTERVAL_MS: 5000,
  DISCONNECT_TIMEOUT_MS: 30000,
  COUNTDOWN_SECONDS: 5,
  STALE_INSTANCE_MS: 60 * 60 * 1000,
  STALE_QUEUE_MS: 30 * 60 * 1000,
  PHASE_THRESHOLDS: [0.76, 0.51, 0.26, 0],
  ENRAGE_DICE_BONUS: { 3: 1, 7: 1 },
  ENRAGE_DAMAGE_BONUS: { 5: 1 },
  BOSS_BASE_DICE: 4,
  INSTANT_KILL_FLAT_DAMAGE: 5
};

// ─── LOOT TABLE SYSTEM ──────────────────────────────────────────
const RAID_ITEMS = {
  ice_blade:   { name: 'Ice Blade',   icon: '🗡️', type: 'blade', tier: 'rare', slot: 'weapon',
                 desc: '+1 die while swinging. Wins grant +1 Ice Shard.' },
  flame_blade: { name: 'Flame Blade', icon: '🔥', type: 'blade', tier: 'rare', slot: 'weapon',
                 desc: '+1 die while swinging. Wins generate +5 Burn.' },
  mask_of_day:   { name: 'Mask of Day',   icon: '🌅', type: 'mask', tier: 'rare', slot: 'head',
                   desc: 'Gain 1 Burn for each 1 or 2 you roll.' },
  mask_of_night: { name: 'Mask of Night', icon: '🌙', type: 'mask', tier: 'rare', slot: 'head',
                   desc: 'Roll same dice as enemy +1. +1 damage on wins.' },
  lucky_charm:    { name: 'Lucky Charm',    icon: '🍀', type: 'charm', tier: 'common', slot: 'accessory',
                    desc: 'Start each fight with 1 Lucky Stone.' },
  healing_root:   { name: 'Healing Root',   icon: '🌿', type: 'charm', tier: 'common', slot: 'accessory',
                    desc: 'Start each fight with 1 Healing Seed.' },
  ember_stone:    { name: 'Ember Stone',    icon: '🔶', type: 'charm', tier: 'common', slot: 'accessory',
                    desc: 'Start each fight with 1 Sacred Fire.' },
  frost_shard:    { name: 'Frost Shard',    icon: '❄️', type: 'charm', tier: 'common', slot: 'accessory',
                    desc: 'Start each fight with 1 Ice Shard.' },
  surge_crystal:  { name: 'Surge Crystal',  icon: '⚡', type: 'charm', tier: 'common', slot: 'accessory',
                    desc: 'Start each fight with 1 Surge.' },
  moonstone_ring: { name: 'Moonstone Ring', icon: '💎', type: 'legendary', tier: 'legendary', slot: 'accessory',
                    desc: 'Start each fight with 1 Moonstone.' },
  firefly_lantern:{ name: 'Firefly Lantern',icon: '🏮', type: 'charm', tier: 'rare', slot: 'accessory',
                    desc: 'Start each fight with 1 Magic Firefly. Take 2 damage immediately.' },
  golden_dice:    { name: 'Golden Dice',    icon: '🎲', type: 'legendary', tier: 'legendary', slot: 'weapon',
                    desc: '+1 die on your first roll of every fight.' },
  shades_cape:   { name: 'Shade\'s Cape',   icon: '👑', type: 'legendary', tier: 'legendary', slot: 'head',
                    desc: 'Your active ghost gains +1 max HP for this raid.' },
  valkins_crystal:   { name: "Valkin's Crystal",  icon: '💀', type: 'legendary', tier: 'legendary', slot: 'accessory',
                    desc: 'Doubles deal +1 bonus damage.' },
};

const EQUIP_SLOTS = {
  head:      { label: 'Head',      icon: '👤', empty: 'No headgear' },
  weapon:    { label: 'Weapon',    icon: '⚔️', empty: 'No weapon' },
  accessory: { label: 'Accessory', icon: '💍', empty: 'No accessory' }
};

const RAID_LOOT_TABLES = {
  1: { singles: ['lucky_charm', 'healing_root', 'ember_stone', 'frost_shard', 'surge_crystal'],
       doubles: ['ice_blade', 'flame_blade', 'mask_of_day', 'firefly_lantern'],
       triples: ['golden_dice', 'shades_cape', 'moonstone_ring'] },
  2: { singles: ['lucky_charm', 'healing_root', 'frost_shard', 'surge_crystal', 'ember_stone'],
       doubles: ['ice_blade', 'mask_of_night', 'firefly_lantern', 'flame_blade'],
       triples: ['golden_dice', 'shades_cape', 'valkins_crystal', 'moonstone_ring'] },
  3: { singles: ['ember_stone', 'healing_root', 'surge_crystal', 'lucky_charm', 'frost_shard'],
       doubles: ['flame_blade', 'mask_of_day', 'mask_of_night', 'firefly_lantern'],
       triples: ['valkins_crystal', 'golden_dice', 'shades_cape', 'moonstone_ring'] },
  4: { singles: ['lucky_charm', 'healing_root', 'ember_stone', 'frost_shard', 'surge_crystal'],
       doubles: ['ice_blade', 'flame_blade', 'mask_of_night', 'mask_of_day'],
       triples: ['valkins_crystal', 'shades_cape', 'golden_dice', 'moonstone_ring'] },
  5: { singles: ['lucky_charm', 'healing_root', 'ember_stone', 'frost_shard', 'surge_crystal'],
       doubles: ['ice_blade', 'flame_blade', 'mask_of_day', 'mask_of_night'],
       triples: ['valkins_crystal', 'golden_dice', 'shades_cape', 'moonstone_ring'] }
};

// ─── LOOT ROLL ──────────────────────────────────────────────────
function rollBossLoot(tier) {
  const d = () => Math.floor(Math.random() * 6) + 1;
  const r = Math.random();
  let rollType, roll;
  if (r < 0.10) {
    rollType = 'triples';
    const v = d(); roll = [v, v, v];
  } else if (r < 0.45) {
    rollType = 'doubles';
    const v = d(); let third = d(); while (third === v) third = d();
    roll = [v, v, third].sort(() => Math.random() - 0.5);
  } else {
    rollType = 'singles';
    const a = d(); let b = d(); while (b === a) b = d();
    let c = d(); while (c === a || c === b) c = d();
    roll = [a, b, c].sort(() => Math.random() - 0.5);
  }
  const table = RAID_LOOT_TABLES[tier] || RAID_LOOT_TABLES[1];
  const pool = table[rollType] || [];
  const itemKey = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
  const item = itemKey ? { key: itemKey, ...RAID_ITEMS[itemKey] } : null;
  return { roll, rollType, item };
}

// ─── APPLY LOOT ─────────────────────────────────────────────────
function applyRaidLoot(battleState, team, lootInventory) {
  if (!lootInventory || !lootInventory.items) return;
  const t = battleState.teams?.[team] || battleState[team];
  if (!t) return;

  const equipped = lootInventory.equipped;
  const itemsToApply = equipped
    ? Object.values(equipped).filter(Boolean)
    : lootInventory.items;

  itemsToApply.forEach(item => {
    const def = RAID_ITEMS[item];
    if (!def) return;
    switch (item) {
      case 'lucky_charm':    if (t.resources) t.resources.luckyStone = (t.resources.luckyStone || 0) + 1; break;
      case 'healing_root':   if (t.resources) t.resources.healingSeed = (t.resources.healingSeed || 0) + 1; break;
      case 'ember_stone':    if (t.resources) t.resources.fire = (t.resources.fire || 0) + 1; break;
      case 'frost_shard':    if (t.resources) t.resources.ice = (t.resources.ice || 0) + 1; break;
      case 'surge_crystal':  if (t.resources) t.resources.surge = (t.resources.surge || 0) + 2; break; // gives 2 Surge per spec
      case 'moonstone_ring': if (t.resources) t.resources.moonstone = (t.resources.moonstone || 0) + 1; break;
      case 'firefly_lantern':
        if (t.resources) t.resources.firefly = (t.resources.firefly || 0) + 1;
        if (t.ghosts && t.ghosts[0]) t.ghosts[0].hp = Math.max(1, (t.ghosts[0].hp || 1) - 2);
        break;
      case 'ice_blade':
        if (battleState.iceBladeForgedPermanent) battleState.iceBladeForgedPermanent[team] = true;
        break;
      case 'flame_blade':
        if (battleState.flameBlade) battleState.flameBlade[team] = true;
        break;
      case 'mask_of_day':
        // Integrate with Sophia's mask system (same combat mechanics)
        battleState.sophiaMask = battleState.sophiaMask || { red: null, blue: null };
        battleState.sophiaMaskActive = battleState.sophiaMaskActive || { red: false, blue: false };
        battleState.sophiaMask[team] = 'day';
        battleState.sophiaMaskActive[team] = true;
        break;
      case 'mask_of_night':
        battleState.sophiaMask = battleState.sophiaMask || { red: null, blue: null };
        battleState.sophiaMaskActive = battleState.sophiaMaskActive || { red: false, blue: false };
        battleState.sophiaMask[team] = 'night';
        battleState.sophiaMaskActive[team] = true;
        break;
      case 'golden_dice':
        battleState.goldenDice = battleState.goldenDice || {};
        battleState.goldenDice[team] = true;
        break;
      case 'shades_cape': {
        // +1 max HP to the active ghost (not always index 0)
        const activeGhost = t.ghosts && t.ghosts[t.activeIdx || 0];
        if (activeGhost) { activeGhost.maxHp = (activeGhost.maxHp || 0) + 1; activeGhost.hp = (activeGhost.hp || 0) + 1; }
        break;
      }
      case 'valkins_crystal':
        battleState.valkinShard = battleState.valkinShard || {};
        battleState.valkinShard[team] = true;
        break;
    }
  });

  if (lootInventory.resources) {
    Object.entries(lootInventory.resources).forEach(([key, amount]) => {
      if (t.resources && typeof t.resources[key] !== 'undefined') {
        t.resources[key] = (t.resources[key] || 0) + amount;
      }
    });
  }
}

// ─── EQUIP SYSTEM ───────────────────────────────────────────────
async function equipRaidItem(itemKey) {
  const user = firebase.auth().currentUser;
  if (!user) return null;
  const def = RAID_ITEMS[itemKey];
  if (!def || !def.slot) return null;

  const ref = db.ref(`mp/users/${user.uid}/raidRunInventory`);
  const snap = await ref.once('value');
  const inv = snap.val();
  if (!inv || !inv.items || !inv.items.includes(itemKey)) return null;

  const equipped = inv.equipped || { head: null, weapon: null, accessory: null };
  equipped[def.slot] = itemKey;
  await ref.child('equipped').set(equipped);
  return equipped;
}

async function unequipRaidSlot(slot) {
  const user = firebase.auth().currentUser;
  if (!user) return null;
  await db.ref(`mp/users/${user.uid}/raidRunInventory/equipped/${slot}`).remove();
}

async function getRaidEquipped() {
  const user = firebase.auth().currentUser;
  if (!user) return { head: null, weapon: null, accessory: null };
  const snap = await db.ref(`mp/users/${user.uid}/raidRunInventory`).once('value');
  const inv = snap.val();
  return inv?.equipped || { head: null, weapon: null, accessory: null };
}

// ─── HP SCALING ─────────────────────────────────────────────────
function getPlayerHpMultiplier(playerCount) {
  if (playerCount <= 1) return 1;
  if (playerCount <= 2) return 1.5;
  if (playerCount <= 3) return 2;
  if (playerCount <= 5) return 3;
  if (playerCount <= 7) return 3.5;
  return 4;
}

// ─── BOSS TEAM BUILDING ─────────────────────────────────────────
function getBossPhase(currentHp, maxHp) {
  return 1; // phases disabled
}

function buildBossTeam(bossConfig, phase, enrageLevel) {
  const bossGhost = {
    ...bossConfig.bossGhost,
    rarity: bossConfig.bossGhost.rarity || 'legendary',
    hp: bossConfig.bossGhost.maxHp,
    ko: false,
    isBoss: true
  };

  const minionIds = bossConfig.minionsByPhase[phase] || [];
  const minions = minionIds.map(mid => {
    const minionData = RAID_BOSS_MINIONS.find(m => m.id === mid);
    if (!minionData) return null;
    return { ...minionData, hp: minionData.maxHp, ko: false, isMinion: true };
  }).filter(Boolean);

  return {
    boss: bossGhost,
    minions: minions,
    activeIdx: 0,
    resources: { moonstone: 0, ice: 0, fire: 0, surge: 0, healingSeed: 0, luckyStone: 0, firefly: 0, burn: 0 },
    enrageLevel: enrageLevel,
    phase: phase,
    personality: bossConfig.personality,
    sacrificeUsedThisRound: false,
    spawnCounter: 0,
    swapCooldown: 0,
    roundsSinceSwap: 0
  };
}

// ─── MINION WAVES ───────────────────────────────────────────────
function getWaveChance(slotIdx) {
  if (slotIdx <= 2) return 0;
  if (slotIdx <= 5) return 0.5;
  if (slotIdx <= 8) return 0.75;
  return 1.0;
}

// ─── BOSS AI DECISIONS ──────────────────────────────────────────
function bossAutoRoll(bossTeam, playerTeam, battleState) {
  const personality = bossTeam.personality;
  const phase = bossTeam.phase;
  const enrage = bossTeam.enrageLevel;

  let diceCount = RAID_CONFIG.BOSS_BASE_DICE;
  Object.entries(RAID_CONFIG.ENRAGE_DICE_BONUS).forEach(([level, bonus]) => {
    if (enrage >= parseInt(level)) diceCount += bonus;
  });

  if (personality === 'swarm') {
    const livingMinions = bossTeam.minions.filter(m => m && !m.ko).length;
    diceCount += livingMinions;
  }

  const dice = [];
  for (let i = 0; i < diceCount; i++) dice.push(Math.floor(Math.random() * 6) + 1);
  dice.sort((a, b) => b - a);

  const preRollActions = bossPreRoll(personality, phase, enrage, bossTeam, playerTeam, battleState);
  const postRollResult = bossPostRoll(personality, phase, enrage, dice, bossTeam, playerTeam, battleState);

  return {
    dice: postRollResult.dice || dice,
    preRollActions: preRollActions,
    postRollActions: postRollResult.actions || [],
    diceCount: diceCount
  };
}

function bossPreRoll(personality, phase, enrage, bossTeam, playerTeam, battleState) {
  const actions = [];
  switch (personality) {
    case 'tyrant':
      if (bossTeam.resources.surge > 0) actions.push({ type: 'commit_surge', amount: bossTeam.resources.surge });
      if (bossTeam.resources.fire > 0) actions.push({ type: 'commit_fire', amount: bossTeam.resources.fire });
      break;
    case 'trickster':
      if (bossTeam.roundsSinceSwap >= 4 && bossTeam.minions.some(m => m && !m.ko)) {
        actions.push({ type: 'swap_to_minion' });
      }
      break;
    case 'swarm':
      const raidId = RaidState.raidId;
      const spawnInterval = RAID_BOSSES[raidId]?.spawnInterval?.[phase] || 3;
      bossTeam.spawnCounter++;
      if (bossTeam.spawnCounter >= spawnInterval) {
        const emptySlot = bossTeam.minions.findIndex(m => !m || m.ko);
        if (emptySlot >= 0) {
          actions.push({ type: 'spawn_minion', slot: emptySlot });
        } else {
          actions.push({ type: 'sacrifice_heal', amount: 3 });
        }
        bossTeam.spawnCounter = 0;
      }
      break;
    case 'glacier':
      const frostDamage = phase >= 4 ? 2 : 1;
      actions.push({ type: 'frost_aura', damage: frostDamage });
      const frozenCount = (phase >= 3 || bossTeam.minions.some(m => m?.id === 9132 && !m.ko)) ? 2 : 1;
      actions.push({ type: 'frozen_dice', count: frozenCount });
      break;
  }
  return actions;
}

function bossPostRoll(personality, phase, enrage, dice, bossTeam, playerTeam, battleState) {
  const actions = [];
  let modifiedDice = [...dice];
  switch (personality) {
    case 'trickster':
      const swapCount = phase >= 4 ? 2 : 1;
      actions.push({ type: 'mirror_dice', swapCount: swapCount });
      break;
  }
  return { dice: modifiedDice, actions };
}

// ─── BOSS DAMAGE MODIFIERS ──────────────────────────────────────
function bossWinDamageModifier(baseDamage, personality, phase, enrage, rollType, bossTeam, playerTeam) {
  let damage = baseDamage;
  Object.entries(RAID_CONFIG.ENRAGE_DAMAGE_BONUS).forEach(([level, bonus]) => {
    if (enrage >= parseInt(level)) damage += bonus;
  });
  if (enrage >= 9) damage *= 2;
  switch (personality) {
    case 'tyrant': damage += enrage; break;
  }
  return damage;
}

function bossDefenseDamageModifier(baseDamage, resourceDamage, personality, phase, bossTeam) {
  if (personality !== 'glacier') return baseDamage + resourceDamage;
  const cap = phase >= 3 ? 2 : 3;
  return Math.min(baseDamage, cap) + resourceDamage;
}

function bossCheckSacrifice(personality, bossTeam, incomingDamage) {
  if (personality !== 'swarm') return false;
  if (bossTeam.sacrificeUsedThisRound) return false;
  if (incomingDamage < 2) return false;
  const sacrificeTarget = bossTeam.minions.find(m => m && !m.ko);
  if (!sacrificeTarget) return false;
  bossTeam.sacrificeUsedThisRound = true;
  sacrificeTarget.ko = true;
  sacrificeTarget.hp = 0;
  return { sacrificed: sacrificeTarget, negatedDamage: incomingDamage };
}

function bossStealResource(bossTeam, playerResources) {
  const stealable = Object.entries(playerResources)
    .filter(([key, val]) => val > 0 && key !== 'burn')
    .map(([key]) => key);
  if (stealable.length === 0) return null;
  const stolen = stealable[Math.floor(Math.random() * stealable.length)];
  const amount = bossTeam.phase >= 2 ? 2 : 1;
  const actualAmount = Math.min(amount, playerResources[stolen]);
  playerResources[stolen] -= actualAmount;
  bossTeam.resources[stolen] = (bossTeam.resources[stolen] || 0) + actualAmount;
  return { resource: stolen, amount: actualAmount };
}

function bossMirrorDice(bossDice, playerDice, swapCount) {
  const newBossDice = [...bossDice];
  const newPlayerDice = [...playerDice];
  for (let s = 0; s < swapCount; s++) {
    let bestSwap = null;
    let bestScore = -Infinity;
    for (let bi = 0; bi < newBossDice.length; bi++) {
      for (let pi = 0; pi < newPlayerDice.length; pi++) {
        if (newBossDice[bi] >= newPlayerDice[pi]) continue;
        const testBoss = [...newBossDice];
        const testPlayer = [...newPlayerDice];
        testBoss[bi] = newPlayerDice[pi];
        testPlayer[pi] = newBossDice[bi];
        const score = testBoss.reduce((a, b) => a + b, 0) - testPlayer.reduce((a, b) => a + b, 0);
        if (score > bestScore) { bestScore = score; bestSwap = { bossIdx: bi, playerIdx: pi }; }
      }
    }
    if (bestSwap) {
      const temp = newBossDice[bestSwap.bossIdx];
      newBossDice[bestSwap.bossIdx] = newPlayerDice[bestSwap.playerIdx];
      newPlayerDice[bestSwap.playerIdx] = temp;
    }
  }
  return { bossDice: newBossDice.sort((a, b) => b - a), playerDice: newPlayerDice.sort((a, b) => b - a) };
}

function bossCrushingBlow(rollType, playerSideline) {
  if (rollType !== 'triples' && rollType !== 'quads' && rollType !== 'penta') return [];
  const hits = [];
  playerSideline.forEach(g => {
    if (g && !g.ko) {
      g.hp = Math.max(0, g.hp - 1);
      if (g.hp <= 0) g.ko = true;
      hits.push({ ghost: g.name, damage: 1, ko: g.ko });
    }
  });
  return hits;
}

function applyFrozenDice(playerDice, frozenCount) {
  const sorted = [...playerDice].sort((a, b) => b - a);
  for (let i = 0; i < Math.min(frozenCount, sorted.length); i++) {
    const idx = playerDice.indexOf(sorted[i]);
    if (idx >= 0) playerDice[idx] = 1;
  }
  return playerDice;
}

function isIceWallActive(bossTeam) {
  return bossTeam.minions.some(m => m && !m.ko && m.id === 9131);
}

function checkBossPhaseTransition(oldHp, newHp, maxHp, personality, bossConfig) {
  return { transitioned: false };
}

function applyPhaseTransition(transition, bossTeam, playerTeam, bossConfig) {
  const effects = [];
  switch (transition.personality) {
    case 'tyrant':
      effects.push({ type: 'chip_damage', target: 'player_active', amount: 2, desc: 'THE TYRANT ROARS' });
      effects.push({ type: 'boss_retreat', rounds: 3, desc: 'The Mountain King retreats behind a minion' });
      break;
    case 'trickster':
      effects.push({ type: 'illusion_split', desc: 'The Phantom splits into two!' });
      break;
    case 'swarm':
      const livingMinions = bossTeam.minions.filter(m => m && !m.ko);
      const explosionDamage = livingMinions.length * 2;
      livingMinions.forEach(m => { m.ko = true; m.hp = 0; });
      effects.push({ type: 'brood_burst', damage: explosionDamage, count: livingMinions.length, desc: 'BROOD BURST!' });
      effects.push({ type: 'spawn_minions', count: 2, desc: 'New minions emerge!' });
      break;
    case 'glacier':
      effects.push({ type: 'freeze_resources', rounds: 3, desc: 'ABSOLUTE ZERO' });
      break;
  }
  const newMinions = bossConfig.minionsByPhase[transition.toPhase] || [];
  effects.push({ type: 'update_minions', minionIds: newMinions });
  return effects;
}

// ─── REWARDS ────────────────────────────────────────────────────
async function distributeRaidRewards(instanceId, bossDefeated, killingBlowUid) {
  const instSnap = await db.ref(`mp/raids/instances/${instanceId}`).once('value');
  const instance = instSnap.val();
  if (!instance) return;

  const bossConfig = RAID_BOSSES[instance.raidId];
  if (!bossConfig) return;

  const players = instance.players || {};
  const updates = {};

  let mvpUid = null;
  let maxDamage = 0;
  Object.values(players).forEach(p => {
    if ((p.damageDealt || 0) > maxDamage) { maxDamage = p.damageDealt; mvpUid = p.uid; }
  });

  const badgePromises = [];
  for (const [slot, p] of Object.entries(players)) {
    let points = 0;
    if (bossDefeated) {
      points = bossConfig.rewardPoints;
      if (p.uid === killingBlowUid) points += bossConfig.bonusPoints;
      if (p.uid === mvpUid) points += bossConfig.bonusPoints;
      if (p.status === 'registered') points = Math.round(bossConfig.rewardPoints * 0.25);
    } else {
      points = Math.round(bossConfig.rewardPoints * 0.5 * (p.damageDealt || 0) / (instance.bossMaxHp || 100));
    }
    if (p.status === 'disconnected') points = 0;

    if (points > 0) updates[`mp/users/${p.uid}/raidPoints`] = firebase.database.ServerValue.increment(points);
    updates[`mp/users/${p.uid}/raidStats/raidsCompleted`] = firebase.database.ServerValue.increment(1);
    updates[`mp/users/${p.uid}/raidStats/totalBossDamage`] = firebase.database.ServerValue.increment(p.damageDealt || 0);
    if (p.uid === killingBlowUid) updates[`mp/users/${p.uid}/raidStats/killingBlows`] = firebase.database.ServerValue.increment(1);

    if (bossDefeated) {
      const badgeEntry = Object.entries(RAID_BADGES).find(([key, badge]) => badge.boss === instance.raidId);
      if (badgeEntry) badgePromises.push(awardRaidBadge(p.uid, badgeEntry[0]));
    }

    if (bossDefeated && p.status !== 'disconnected') {
      const loot = rollBossLoot(bossConfig.tier || 1);
      updates[`mp/raids/instances/${instanceId}/players/${slot}/lootRoll`] = loot.roll;
      updates[`mp/raids/instances/${instanceId}/players/${slot}/lootType`] = loot.rollType;
      updates[`mp/raids/instances/${instanceId}/players/${slot}/lootItem`] = loot.item ? loot.item.key : null;
      updates[`mp/raids/instances/${instanceId}/players/${slot}/lootItemName`] = loot.item ? loot.item.name : null;
      updates[`mp/raids/instances/${instanceId}/players/${slot}/lootItemIcon`] = loot.item ? loot.item.icon : null;

      const invRef = db.ref(`mp/users/${p.uid}/raidRunInventory`);
      const invSnap = await invRef.once('value');
      const inv = invSnap.val() || { items: [] };
      if (loot.item && !inv.items.includes(loot.item.key)) {
        inv.items.push(loot.item.key);
        const itemDef = RAID_ITEMS[loot.item.key];
        if (itemDef?.slot) {
          inv.equipped = inv.equipped || { head: null, weapon: null, accessory: null };
          if (!inv.equipped[itemDef.slot]) inv.equipped[itemDef.slot] = loot.item.key;
        }
      }
      await invRef.set(inv);
    }

    updates[`mp/users/${p.uid}/activeRaid`] = null;
  }

  await db.ref().update(updates);
  if (badgePromises.length > 0) await Promise.all(badgePromises);
}

async function awardRaidBadge(uid, badgeKey) {
  const snap = await db.ref(`mp/users/${uid}/raidBadges`).once('value');
  const badges = snap.val() || [];
  if (!badges.includes(badgeKey)) {
    badges.push(badgeKey);
    await db.ref(`mp/users/${uid}/raidBadges`).set(badges);
    Object.entries(RAID_BADGES).forEach(([key, badge]) => {
      if (badge.requires && !badges.includes(key)) {
        if (badge.requires.every(req => badges.includes(req))) {
          badges.push(key);
          db.ref(`mp/users/${uid}/raidBadges`).set(badges);
        }
      }
    });
  }
}

function hasRaidBadge(badges, badgeKey) {
  return (badges || []).includes(badgeKey);
}

// ─── DISCONNECT MONITOR ─────────────────────────────────────────
function monitorCurrentFighter(data) {
  const currentIdx = data.currentFighterIdx || 0;
  const fighter = data.players?.[currentIdx];
  if (!fighter || fighter.status !== 'fighting') return;

  const now = Date.now();
  const serverOffset = window._serverTimeOffset || 0;
  const serverNow = now + serverOffset;
  const lastBeat = fighter.lastHeartbeat || 0;

  if (lastBeat > 0 && (serverNow - lastBeat) > RAID_CONFIG.DISCONNECT_TIMEOUT_MS) {
    handleFighterDisconnect(data, currentIdx);
  }
}

async function handleFighterDisconnect(data, slotIdx) {
  const instanceId = RaidState.instanceId;
  if (!instanceId) return;

  const instRef = db.ref(`mp/raids/instances/${instanceId}`);
  await instRef.transaction((current) => {
    if (!current) return current;
    if (current.currentFighterIdx !== slotIdx) return;
    current.players[slotIdx].status = 'disconnected';
    current.currentFighterIdx = slotIdx + 1;
    current.enrageLevel = (current.enrageLevel || 0) + 1;
    const totalPlayers = Object.keys(current.players).length;
    if (current.currentFighterIdx >= totalPlayers) {
      current.status = 'complete';
      current.fightPhase = 'done';
    } else {
      current.currentFighterUid = current.players[current.currentFighterIdx]?.uid || null;
    }
    return current;
  });
}

// ─── BOSS HP POOL DRAIN ─────────────────────────────────────────
// Called by bossDamageTracker (battle-core.js) when damage is dealt
// to the boss team. Updates RaidState, visual bar, and Firebase.
function drainBossHpPool(damage) {
  if (!RaidState.isActive() || damage <= 0) return;

  const oldHp = RaidState.bossCurrentHp;
  const newHp = Math.max(0, oldHp - damage);
  RaidState.bossCurrentHp = newHp;
  RaidState.totalDamageDealt += damage;

  // Update visual boss HP bar
  if (typeof renderBossHpPool === 'function') {
    renderBossHpPool(newHp, RaidState.bossMaxHp);
  }

  // Write to Firebase (non-blocking)
  if (RaidSync._instanceRef) {
    RaidSync._instanceRef.update(firebaseSafe({
      bossCurrentHp: newHp,
      totalDamageDealt: firebase.database.ServerValue.increment(damage)
    })).catch(e => console.warn('[drainBossHpPool] Firebase write error:', e));
  }

  // Check for boss defeat
  if (newHp <= 0) {
    console.log('[drainBossHpPool] Boss defeated!');
    // The game-over hook in the adapter will handle this via showGameOver
  }
}

// ─── INIT ───────────────────────────────────────────────────────
// Called once at app startup after auth. Initializes adapter + sync.
async function initRaidSystem() {
  if (window._raidResultPending) return;
  RaidBattleAdapter.init();
  await RaidSync.init();
}

// ─── BACKWARD COMPAT ALIASES ────────────────────────────────────
// These are called from index.html UI code. Route to new modules.
function joinRaidQueue(raidId, team) { return RaidSync.joinQueue(raidId, team); }
function leaveRaidQueue(raidId) { return RaidSync.leaveQueue(raidId); }
function startRaidManually(raidId) { return RaidSync.startRaidManually(raidId); }
