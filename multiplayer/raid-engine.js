// =================================================================
// RAID ENGINE — Boss AI, raid lifecycle, Firebase state management
// Depends on: cards.js (RAID_BOSSES, RAID_BOSS_MINIONS, RAID_BADGES)
//             battle-engine.js (classify, weightedRoll, etc.)
// v0.90 — EQUIP SYSTEM: 3 slots (Head, Weapon, Accessory). Players choose
//          which items to equip from their raid inventory. Only equipped items
//          apply in battle. New loot auto-equips into empty slots.
//          (v0.89: loot tables, v0.88: phase labels)
// =================================================================

const RAID_CONFIG = {
  MAX_PLAYERS: 10,
  MIN_PLAYERS_FOR_EARLY_START: 5,
  QUEUE_TIMEOUT_MS: 10 * 60 * 1000,     // 10 min before early start
  HEARTBEAT_INTERVAL_MS: 5000,
  DISCONNECT_TIMEOUT_MS: 30000,
  COUNTDOWN_SECONDS: 5,
  STALE_INSTANCE_MS: 60 * 60 * 1000,    // 1 hour
  STALE_QUEUE_MS: 30 * 60 * 1000,       // 30 min
  PHASE_THRESHOLDS: [0.76, 0.51, 0.26, 0], // Phase 1: 100-76%, Phase 2: 75-51%, etc.
  ENRAGE_DICE_BONUS: { 3: 1, 7: 1 },    // enrage level → +dice
  ENRAGE_DAMAGE_BONUS: { 5: 1 },         // enrage level → +damage
  BOSS_BASE_DICE: 4,
  INSTANT_KILL_FLAT_DAMAGE: 5            // Instant-kill abilities deal this instead vs bosses
};

// ─── LOOT TABLE SYSTEM ──────────────────────────────────────────
// Players roll 3 dice after defeating a boss. Roll determines loot tier:
//   Singles → common drop (resources)
//   Doubles → rare drop (blue)
//   Triples → legendary drop (orange)
// Items carry within the raid run, reset when raid ends.
// Players start each boss fight with their accumulated loot equipped.
// 3 equipment slots: Head, Weapon, Accessory. That's all you get.

const RAID_ITEMS = {
  // === BLADES → weapon slot ===
  ice_blade:   { name: 'Ice Blade',   icon: '🗡️', type: 'blade', tier: 'rare', slot: 'weapon',
                 desc: '+1 die while swinging. Wins grant +1 Ice Shard.' },
  flame_blade: { name: 'Flame Blade', icon: '🔥', type: 'blade', tier: 'rare', slot: 'weapon',
                 desc: '+1 die while swinging. Wins generate +5 Burn.' },

  // === MASKS → head slot ===
  mask_of_day:   { name: 'Mask of Day',   icon: '🌅', type: 'mask', tier: 'rare', slot: 'head',
                   desc: 'Gain 1 Burn for each 1 or 2 you roll.' },
  mask_of_night: { name: 'Mask of Night', icon: '🌙', type: 'mask', tier: 'rare', slot: 'head',
                   desc: 'Roll same dice as enemy +1. +1 damage on wins.' },

  // === CHARMS → accessory slot ===
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

  // === LEGENDARY → weapon or head slot ===
  golden_dice:    { name: 'Golden Dice',    icon: '🎲', type: 'legendary', tier: 'legendary', slot: 'weapon',
                    desc: '+1 die on your first roll of every fight.' },
  shades_cape:   { name: 'Shade\'s Cape',   icon: '👑', type: 'legendary', tier: 'legendary', slot: 'head',
                    desc: 'Your active ghost gains +1 max HP for this raid.' },
  valkins_crystal:   { name: "Valkin's Crystal",  icon: '💀', type: 'legendary', tier: 'legendary', slot: 'accessory',
                    desc: 'Doubles deal +1 bonus damage.' },
};

// Equipment slot labels & icons
const EQUIP_SLOTS = {
  head:      { label: 'Head',      icon: '👤', empty: 'No headgear' },
  weapon:    { label: 'Weapon',    icon: '⚔️', empty: 'No weapon' },
  accessory: { label: 'Accessory', icon: '💍', empty: 'No accessory' }
};

// Per-tier loot pools — what can drop at each tier
const RAID_LOOT_TABLES = {
  1: { // Rolling Hills
    singles: ['lucky_charm', 'healing_root', 'ember_stone', 'frost_shard', 'surge_crystal'],
    doubles: ['ice_blade', 'flame_blade', 'mask_of_day', 'firefly_lantern'],
    triples: ['golden_dice', 'shades_cape', 'moonstone_ring']
  },
  2: { // Frost Valley
    singles: ['lucky_charm', 'healing_root', 'frost_shard', 'surge_crystal', 'ember_stone'],
    doubles: ['ice_blade', 'mask_of_night', 'firefly_lantern', 'flame_blade'],
    triples: ['golden_dice', 'shades_cape', 'valkins_crystal', 'moonstone_ring']
  },
  3: { // Volcanic Isles
    singles: ['ember_stone', 'healing_root', 'surge_crystal', 'lucky_charm', 'frost_shard'],
    doubles: ['flame_blade', 'mask_of_day', 'mask_of_night', 'firefly_lantern'],
    triples: ['valkins_crystal', 'golden_dice', 'shades_cape', 'moonstone_ring']
  },
  4: { // Dark Castle
    singles: ['lucky_charm', 'healing_root', 'ember_stone', 'frost_shard', 'surge_crystal'],
    doubles: ['ice_blade', 'flame_blade', 'mask_of_night', 'mask_of_day'],
    triples: ['valkins_crystal', 'shades_cape', 'golden_dice', 'moonstone_ring']
  },
  5: { // The Dark Spire (Valkin)
    singles: ['lucky_charm', 'healing_root', 'ember_stone', 'frost_shard', 'surge_crystal'],
    doubles: ['ice_blade', 'flame_blade', 'mask_of_day', 'mask_of_night'],
    triples: ['valkins_crystal', 'golden_dice', 'shades_cape', 'moonstone_ring']
  }
};

/**
 * Roll loot after defeating a boss
 * Returns { roll: [d1,d2,d3], rollType: 'singles'|'doubles'|'triples', item: {...}|null }
 *
 * Rarity is weighted (not natural dice odds):
 *   Singles 55%, Doubles 35%, Triples 10%
 * Dice visuals are generated to match the chosen rarity.
 */
function rollBossLoot(tier) {
  const d = () => Math.floor(Math.random() * 6) + 1;

  // Weighted rarity pick: 55% singles, 35% doubles, 10% triples
  const r = Math.random();
  let rollType, roll;
  if (r < 0.10) {
    // Triples — all three dice match
    rollType = 'triples';
    const v = d();
    roll = [v, v, v];
  } else if (r < 0.45) {
    // Doubles — exactly two match, third differs
    rollType = 'doubles';
    const v = d();
    let third = d();
    while (third === v) third = d();
    roll = [v, v, third].sort(() => Math.random() - 0.5);
  } else {
    // Singles — all three different
    rollType = 'singles';
    const a = d();
    let b = d(); while (b === a) b = d();
    let c = d(); while (c === a || c === b) c = d();
    roll = [a, b, c].sort(() => Math.random() - 0.5);
  }

  const table = RAID_LOOT_TABLES[tier] || RAID_LOOT_TABLES[1];

  // Pick an item from the appropriate pool
  const pool = table[rollType] || [];
  const itemKey = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
  const item = itemKey ? { key: itemKey, ...RAID_ITEMS[itemKey] } : null;

  return { roll, rollType, item };
}

/**
 * Apply loot items to battle state at fight start.
 * Only EQUIPPED items are applied (head, weapon, accessory slots).
 * Falls back to applying all items if no equipment data exists (backwards compat).
 */
function applyRaidLoot(battleState, team, lootInventory) {
  if (!lootInventory || !lootInventory.items) return;
  const t = battleState.teams?.[team] || battleState[team];
  if (!t) return;

  // Determine which items to apply — equipped items take priority
  const equipped = lootInventory.equipped;
  const itemsToApply = equipped
    ? Object.values(equipped).filter(Boolean)   // only the 3 equipped slots
    : lootInventory.items;                       // legacy: apply everything

  itemsToApply.forEach(item => {
    const def = RAID_ITEMS[item];
    if (!def) return;

    switch (item) {
      // Charms — grant starting resources
      case 'lucky_charm':    if (t.resources) t.resources.luckyStone = (t.resources.luckyStone || 0) + 1; break;
      case 'healing_root':   if (t.resources) t.resources.healingSeed = (t.resources.healingSeed || 0) + 1; break;
      case 'ember_stone':    if (t.resources) t.resources.fire = (t.resources.fire || 0) + 1; break;
      case 'frost_shard':    if (t.resources) t.resources.ice = (t.resources.ice || 0) + 1; break;
      case 'surge_crystal':  if (t.resources) t.resources.surge = (t.resources.surge || 0) + 1; break;
      case 'moonstone_ring': if (t.resources) t.resources.moonstone = (t.resources.moonstone || 0) + 1; break;
      case 'firefly_lantern':
        if (t.resources) t.resources.firefly = (t.resources.firefly || 0) + 1;
        // Firefly Lantern costs 2 HP on equip
        if (t.ghosts && t.ghosts[0]) t.ghosts[0].hp = Math.max(1, (t.ghosts[0].hp || 1) - 2);
        break;

      // Blades — forge them immediately
      case 'ice_blade':
        if (battleState.iceBladeForgedPermanent) battleState.iceBladeForgedPermanent[team] = true;
        break;
      case 'flame_blade':
        if (battleState.flameBlade) battleState.flameBlade[team] = true;
        break;

      // Masks — set flags
      case 'mask_of_day':
        battleState.maskOfDay = battleState.maskOfDay || {};
        battleState.maskOfDay[team] = true;
        break;
      case 'mask_of_night':
        battleState.maskOfNight = battleState.maskOfNight || {};
        battleState.maskOfNight[team] = true;
        break;

      // Legendary
      case 'golden_dice':
        battleState.goldenDice = battleState.goldenDice || {};
        battleState.goldenDice[team] = true; // +1 die on first roll
        break;
      case 'shades_cape':
        // +1 max HP to active ghost
        if (t.ghosts && t.ghosts[0]) t.ghosts[0].maxHp = (t.ghosts[0].maxHp || 0) + 1;
        if (t.ghosts && t.ghosts[0]) t.ghosts[0].hp = (t.ghosts[0].hp || 0) + 1;
        break;
      case 'valkins_crystal':
        battleState.valkinShard = battleState.valkinShard || {};
        battleState.valkinShard[team] = true; // +1 damage on doubles
        break;
    }
  });

  // Also apply carried resources from previous boss fights
  if (lootInventory.resources) {
    Object.entries(lootInventory.resources).forEach(([key, amount]) => {
      if (t.resources && typeof t.resources[key] !== 'undefined') {
        t.resources[key] = (t.resources[key] || 0) + amount;
      }
    });
  }
}

// ─── EQUIP SYSTEM ───────────────────────────────────────────────
// Players equip items into 3 slots: head, weapon, accessory.
// Equipped state persists in Firebase alongside the raid run inventory.

/**
 * Equip an item from raid inventory into the matching slot.
 * Returns the updated equipped map.
 */
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

/**
 * Unequip a slot (head/weapon/accessory).
 */
async function unequipRaidSlot(slot) {
  const user = firebase.auth().currentUser;
  if (!user) return null;

  const ref = db.ref(`mp/users/${user.uid}/raidRunInventory/equipped/${slot}`);
  await ref.remove();
}

/**
 * Get current equipped items for display.
 */
async function getRaidEquipped() {
  const user = firebase.auth().currentUser;
  if (!user) return { head: null, weapon: null, accessory: null };
  const snap = await db.ref(`mp/users/${user.uid}/raidRunInventory`).once('value');
  const inv = snap.val();
  return inv?.equipped || { head: null, weapon: null, accessory: null };
}

// ─── HP SCALING ─────────────────────────────────────────────────
// Boss HP = bossGhost.maxHp × multiplier. Each boss naturally varies
// because their ghost maxHp differs (10-20 range). Solo fights use
// the ghost's actual HP. Multiplayer scales sub-linearly so 10
// players don't face 10× HP — keeps it fun, not grindy.
function getPlayerHpMultiplier(playerCount) {
  if (playerCount <= 1) return 1;    // solo = ghost's real HP
  if (playerCount <= 2) return 1.5;  // duo
  if (playerCount <= 3) return 2;    // trio
  if (playerCount <= 5) return 3;    // squad
  if (playerCount <= 7) return 3.5;  // large group
  return 4;                          // full 8-10 raid
}

// ─── RAID STATE ─────────────────────────────────────────────────
let currentRaid = null;       // Active raid instance data
let raidListeners = {};       // Firebase listener handles
let heartbeatTimer = null;    // Heartbeat interval ID
let raidBattleState = null;   // Local battle state for the fighting player

// ─── RAID LIFECYCLE ─────────────────────────────────────────────

/**
 * Join a raid queue
 */
async function joinRaidQueue(raidId, team) {
  const user = firebase.auth().currentUser;
  if (!user) return { error: 'Not signed in' };
  if (!team || team.length !== 3) return { error: 'Must select 3 ghosts' };

  const bossConfig = RAID_BOSSES[raidId];
  if (!bossConfig) return { error: 'Unknown raid' };

  // Check badge access
  if (bossConfig.requiredBadge) {
    const userSnap = await db.ref(`mp/users/${user.uid}/raidBadges`).once('value');
    const badges = userSnap.val() || [];
    if (!badges.includes(bossConfig.requiredBadge)) {
      return { error: 'Missing required badge: ' + RAID_BADGES[bossConfig.requiredBadge]?.name };
    }
  }

  // Reset raid run inventory for Tier 1 bosses (fresh start each raid run)
  // Later tiers keep accumulated loot from earlier bosses
  if (bossConfig.tier === 1) {
    await db.ref(`mp/users/${user.uid}/raidRunInventory`).remove();
  }

  const queueRef = db.ref(`mp/raids/queue/${raidId}/${user.uid}`);
  await queueRef.set({
    displayName: user.displayName || 'Raider',
    team: team,
    joinedAt: firebase.database.ServerValue.TIMESTAMP
  });

  // Start listening for queue fill
  startQueueListener(raidId);
  return { success: true };
}

/**
 * Leave a raid queue
 */
async function leaveRaidQueue(raidId) {
  const user = firebase.auth().currentUser;
  if (!user) return;
  await db.ref(`mp/raids/queue/${raidId}/${user.uid}`).remove();
  stopQueueListener(raidId);
}

/**
 * Listen for queue fill — auto-create instance when full
 */
function startQueueListener(raidId) {
  if (raidListeners['queue_' + raidId]) return;

  const queueRef = db.ref(`mp/raids/queue/${raidId}`);
  raidListeners['queue_' + raidId] = queueRef.on('value', async (snap) => {
    const queue = snap.val();
    if (!queue) {
      // Empty queue — instance was likely created. Check if we should enter it.
      if (typeof updateRaidQueueUI === 'function') updateRaidQueueUI(raidId, []);
      // Failsafe: if we have an activeRaid but aren't in a raid yet, enter it
      const user = firebase.auth().currentUser;
      if (user && !currentRaid) {
        const activeSnap = await db.ref(`mp/users/${user.uid}/activeRaid`).once('value');
        const activeId = activeSnap.val();
        if (activeId) {
          const instSnap = await db.ref(`mp/raids/instances/${activeId}`).once('value');
          const inst = instSnap.val();
          if (inst && inst.status !== 'complete' && inst.status !== 'abandoned') {
            console.log('[RAID] Queue cleared — entering raid via failsafe:', activeId);
            currentRaid = { instanceId: activeId, ...inst };
            enterRaidScreen(activeId);
          }
        }
      }
      return;
    }

    const entries = Object.entries(queue)
      .map(([uid, data]) => ({ uid, ...data }))
      .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

    // Update UI with queue count
    if (typeof updateRaidQueueUI === 'function') {
      updateRaidQueueUI(raidId, entries);
    }

    // UI handles the START button — no auto-fire
  });
}

/**
 * Manually start a raid — called when a player clicks START RAID
 */
async function startRaidManually(raidId) {
  const queueSnap = await db.ref(`mp/raids/queue/${raidId}`).once('value');
  const queue = queueSnap.val();
  if (!queue) return { error: 'Queue is empty' };

  const entries = Object.entries(queue)
    .map(([uid, data]) => ({ uid, ...data }))
    .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

  const bossConfig = RAID_BOSSES[raidId];
  const minPlayers = bossConfig?.minPlayers || 2;
  const maxPlayers = bossConfig?.requiredPlayers || RAID_CONFIG.MAX_PLAYERS;

  if (entries.length < minPlayers) {
    return { error: `Need at least ${minPlayers} players to start` };
  }

  await tryCreateRaidInstance(raidId, entries.slice(0, maxPlayers));
  return { success: true };
}

function stopQueueListener(raidId) {
  const key = 'queue_' + raidId;
  if (raidListeners[key]) {
    db.ref(`mp/raids/queue/${raidId}`).off('value', raidListeners[key]);
    delete raidListeners[key];
  }
}

/**
 * Create a raid instance atomically via Firebase transaction
 */
async function tryCreateRaidInstance(raidId, players) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const queueRef = db.ref(`mp/raids/queue/${raidId}`);

  // Transaction: read queue, create instance, clear queue
  const bossConfig = RAID_BOSSES[raidId];
  const minNeeded = bossConfig?.minPlayers || 2;
  const result = await queueRef.transaction((currentQueue) => {
    if (!currentQueue) return currentQueue; // Queue already cleared
    const entries = Object.entries(currentQueue)
      .map(([uid, data]) => ({ uid, ...data }))
      .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

    if (entries.length < minNeeded) return; // abort — not enough
    return null; // Clear the queue
  });

  if (!result.committed) return; // Another client beat us

  const playerCount = players.length;
  const scaledHp = Math.round(bossConfig.bossGhost.maxHp * getPlayerHpMultiplier(playerCount));

  // Create instance
  const instanceRef = db.ref('mp/raids/instances').push();
  const instanceId = instanceRef.key;

  const playerSlots = {};
  players.forEach((p, idx) => {
    playerSlots[idx] = {
      uid: p.uid,
      displayName: p.displayName,
      team: p.team,
      status: 'registered',
      damageDealt: 0,
      ghostsLost: 0,
      joinedAt: p.joinedAt,
      lastHeartbeat: firebase.database.ServerValue.TIMESTAMP
    };
  });

  await instanceRef.set({
    raidId: raidId,
    bossId: bossConfig.bossGhost.id,
    bossName: bossConfig.name,
    bossPersonality: bossConfig.personality,
    bossMaxHp: scaledHp,
    bossCurrentHp: scaledHp,
    tier: bossConfig.tier,
    status: 'countdown',
    created: firebase.database.ServerValue.TIMESTAMP,
    startedAt: null,
    completedAt: null,
    currentFighterIdx: 0,
    currentFighterUid: players[0].uid,
    fightPhase: 'countdown',
    bossDefeatedBy: null,
    totalDamageDealt: 0,
    enrageLevel: 0,
    players: playerSlots,
    battleState: null
  });

  // Set activeRaid flag for all players
  const updates = {};
  players.forEach(p => {
    updates[`mp/users/${p.uid}/activeRaid`] = instanceId;
  });
  await db.ref().update(updates);
}

/**
 * Listen for active raid assignment (auto-load into raid)
 */
function startActiveRaidListener() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  // Don't auto-enter raids if we just returned from one (URL param only)
  const params = new URLSearchParams(window.location.search);
  if (params.get('raidResult') || window._raidResultPending) return;

  // Clear stale session flag — but ALWAYS register the listener
  // (previous bug: stale raidJustCompleted blocked the listener permanently)
  let justCompleted = sessionStorage.getItem('raidJustCompleted');
  sessionStorage.removeItem('raidJustCompleted');

  console.log('[RAID] activeRaid listener registered for', user.uid);
  db.ref(`mp/users/${user.uid}/activeRaid`).on('value', async (snap) => {
    const instanceId = snap.val();
    console.log('[RAID] activeRaid changed:', instanceId);
    if (!instanceId) {
      if (currentRaid) {
        cleanupRaid();
      }
      return;
    }

    // Skip auto-joining stale raids from a just-completed session (one-time gate)
    if (justCompleted) {
      justCompleted = null; // consumed — next trigger will work normally
      await db.ref(`mp/users/${user.uid}/activeRaid`).remove();
      return;
    }

    // Load into the raid
    const instSnap = await db.ref(`mp/raids/instances/${instanceId}`).once('value');
    const instance = instSnap.val();
    if (!instance || instance.status === 'complete' || instance.status === 'abandoned') {
      await db.ref(`mp/users/${user.uid}/activeRaid`).remove();
      return;
    }

    currentRaid = { instanceId, ...instance };
    enterRaidScreen(instanceId);
  });
}

// ─── RAID SCREEN FLOW ───────────────────────────────────────────

/**
 * Enter the raid screen — start countdown, listen for state changes
 */
function enterRaidScreen(instanceId) {
  const instRef = db.ref(`mp/raids/instances/${instanceId}`);

  // Listen ONLY for status/fighter changes — NOT the entire tree (chat etc. would cause loops)
  raidListeners['instance_status'] = instRef.child('status').on('value', async (snap) => {
    const status = snap.val();
    if (!status) return;
    // Re-fetch minimal fields, not the whole tree
    const [statusSnap, fighterSnap, hpSnap, phaseSnap] = await Promise.all([
      Promise.resolve(status),
      instRef.child('currentFighterIdx').once('value'),
      instRef.child('bossCurrentHp').once('value'),
      instRef.child('fightPhase').once('value')
    ]);
    const minimalData = {
      ...currentRaid,
      status: status,
      currentFighterIdx: fighterSnap.val(),
      bossCurrentHp: hpSnap.val(),
      fightPhase: phaseSnap.val()
    };
    currentRaid = { instanceId, ...minimalData };
    handleRaidStateChange(minimalData);
  });

  // Listen for fighter index changes — this is how Player 2 detects it's their turn
  raidListeners['fighterIdx'] = instRef.child('currentFighterIdx').on('value', async (snap) => {
    const idx = snap.val();
    if (idx == null || !currentRaid) return;
    // Re-fetch instance data for the new fighter
    const freshSnap = await instRef.once('value');
    const freshData = freshSnap.val();
    if (!freshData || freshData.status !== 'active') return;
    currentRaid = { instanceId, ...freshData };
    handleActiveFight(freshData);
  });

  // Listen for battle state (spectator feed) — updates Player 2's arena live
  raidListeners['battleState'] = instRef.child('battleState').on('value', (snap) => {
    const state = snap.val();
    if (!state) return;
    // Use the bridge's spectator sync (updates real arena) if available
    if (typeof updateSpectatorFromSnapshot === 'function') {
      updateSpectatorFromSnapshot(state);
    }
  });

  if (typeof showRaidScreen === 'function') {
    showRaidScreen(instanceId);
  }
}

/**
 * Handle raid state transitions
 */
function handleRaidStateChange(data) {
  const user = firebase.auth().currentUser;

  switch (data.status) {
    case 'countdown':
      // Show the waiting room (social lobby) — but only once
      if (typeof showRaidWaitingRoom === 'function' && data.fightPhase === 'countdown' && !window._raidWaitingRoomShown) {
        window._raidWaitingRoomShown = true;
        showRaidWaitingRoom(currentRaid.instanceId, data);
        // The first player triggers the start after 15s (or when LAUNCH is clicked)
        const slot0 = data.players && data.players[0];
        if (slot0 && slot0.uid === user.uid) {
          // Waiting room handles its own timer — when it fires, it calls handleActiveFight
          // Set a fallback transition after 20s in case waiting room JS doesn't trigger.
          // Re-fetch fightPhase from Firebase to avoid the stale-closure double-write.
          setTimeout(async () => {
            if (!currentRaid) return;
            const phaseSnap = await db.ref(`mp/raids/instances/${currentRaid.instanceId}/fightPhase`).once('value');
            if (phaseSnap.val() === 'countdown') {
              db.ref(`mp/raids/instances/${currentRaid.instanceId}`).update({
                status: 'active',
                startedAt: firebase.database.ServerValue.TIMESTAMP,
                fightPhase: 'fighting'
              });
            }
          }, 20000);
        }
      } else if (typeof showRaidCountdown === 'function') {
        showRaidCountdown(data);
      }
      break;

    case 'active':
      // Hide waiting room if still visible
      if (typeof hideRaidWaitingRoom === 'function') hideRaidWaitingRoom();
      // Use battle-engine.js via bridge (the real testroom experience)
      handleActiveFight(data);
      break;

    case 'complete':
      if (typeof hideRaidSpectatorOverlay === 'function') hideRaidSpectatorOverlay();
      if (typeof hideRaidWaitingRoom === 'function') hideRaidWaitingRoom();
      if (typeof showRaidResult === 'function') {
        // Re-fetch full instance so result screen has fresh player data (damageDealt, ghostsLost)
        const cid = currentRaid?.instanceId;
        if (cid && typeof db !== 'undefined') {
          db.ref(`mp/raids/instances/${cid}`).once('value').then(snap => {
            const fresh = snap.val();
            showRaidResult(fresh ? { ...data, ...fresh } : data);
          }).catch(() => showRaidResult(data));
        } else {
          showRaidResult(data);
        }
      }
      break;
  }
}

/**
 * Handle active fight — determine if it's our turn
 */
function handleActiveFight(data) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  // Find our slot
  const players = data.players || {};
  let mySlot = -1;
  Object.entries(players).forEach(([slot, p]) => {
    if (p.uid === user.uid) mySlot = parseInt(slot);
  });

  const currentIdx = data.currentFighterIdx || 0;

  if (mySlot === currentIdx && players[mySlot]?.status !== 'done' && players[mySlot]?.status !== 'disconnected') {
    // It's our turn to fight!
    const wasSpectating = (typeof _isSpectating !== 'undefined') && _isSpectating;
    if (typeof _isSpectating !== 'undefined') _isSpectating = false;
    window._raidMyFightActive = true; // prevent spectator branch from overriding

    // Start our fight if: no battle state, or we were spectating (turn just swapped to us),
    // or previous battle is done/waiting
    if (!raidBattleState || wasSpectating || raidBattleState.phase === 'waiting' || raidBattleState.phase === 'done') {
      // Hide spectator overlay if we were watching
      if (typeof hideRaidSpectatorOverlay === 'function') hideRaidSpectatorOverlay();
      // Clean up previous battle UI before starting ours
      const gameOverEl = document.getElementById('gameOver');
      if (gameOverEl) { gameOverEl.style.display = 'none'; gameOverEl.innerHTML = ''; }
      if (typeof stopBlueAI === 'function') stopBlueAI();
      B = null;
      raidBattleState = null;
      startMyRaidFight(data);
    }
  } else {
    // Don't enter spectator mode if we're actively fighting
    if (window._raidMyFightActive) return;
    // Mark as spectating so the bridge's updateSpectatorFromSnapshot works
    if (typeof _isSpectating !== 'undefined') _isSpectating = true;
    // Not our turn — show the SAME battle screen the active player sees,
    // but with roll button hidden (watch mode). This replaces the old
    // spectator overlay that showed broken ??? cards.
    if (typeof initRaidBattleInPage === 'function') {
      const currentPlayer = players[currentIdx];
      if (currentPlayer && currentPlayer.team) {
        // Build the boss team so we can show it
        const bossConfig = RAID_BOSSES[data.raidId];
        if (bossConfig) {
          const phase = getBossPhase(data.bossCurrentHp || bossConfig.bossGhost.maxHp, data.bossMaxHp || bossConfig.bossGhost.maxHp);
          const bossTeam = buildBossTeam(bossConfig, phase, data.enrageLevel || 0);
          const blueGhosts = [bossTeam.boss, ...bossTeam.minions].slice(0, 3);
          // Show the battle screen in watch mode (no roll button)
          initRaidBattleInPage(data, blueGhosts, currentPlayer.team, false);
          // Hide roll button — we're watching
          const rollBtn = document.getElementById('rollRedBtn');
          if (rollBtn) { rollBtn.style.display = 'none'; }
          // Show a "Watching [player]..." banner
          const narrator = document.getElementById('narrator');
          if (narrator) {
            const name = currentPlayer.displayName || 'Player ' + (currentIdx + 1);
            narrator.innerHTML = `Watching <b class="red-text">${name}</b> fight...`;
          }
        }
      }
    }
  }
}

// ─── BOSS BATTLE ENGINE ─────────────────────────────────────────

/**
 * Start the player's raid fight
 */
function startMyRaidFight(raidData) {
  const user = firebase.auth().currentUser;
  const bossConfig = RAID_BOSSES[raidData.raidId];
  if (!bossConfig) return;

  const currentIdx = raidData.currentFighterIdx || 0;
  const playerData = raidData.players[currentIdx];
  if (!playerData) return;

  // Update our status
  db.ref(`mp/raids/instances/${currentRaid.instanceId}/players/${currentIdx}/status`).set('fighting');

  // Start heartbeat
  startHeartbeat(currentIdx);

  // Determine if there's a minion wave before the boss
  const waveChance = getWaveChance(currentIdx);
  const hasWave = Math.random() < waveChance;

  // Build boss team for this fight
  const phase = getBossPhase(raidData.bossCurrentHp, raidData.bossMaxHp);
  const bossTeam = buildBossTeam(bossConfig, phase, raidData.enrageLevel || 0);

  raidBattleState = {
    phase: 'fighting',
    raidData: raidData,
    bossConfig: bossConfig,
    bossTeam: bossTeam,
    playerTeam: playerData.team,
    currentBossHp: raidData.bossCurrentHp,
    maxBossHp: raidData.bossMaxHp,
    enrageLevel: raidData.enrageLevel || 0,
    bossPhase: phase,
    totalDamageDealt: 0,
    ghostsLost: 0,
    hasWave: hasWave,
    waveDefeated: false,
    currentSlot: currentIdx
  };

  if (hasWave) {
    startMinionWave(raidData, bossConfig, currentIdx);
  } else {
    startBossFight(raidData, bossConfig);
  }
}

/**
 * Get minion wave probability based on player slot
 */
function getWaveChance(slotIdx) {
  if (slotIdx <= 2) return 0;       // Players 1-3: no wave
  if (slotIdx <= 5) return 0.5;     // Players 4-6: 50%
  if (slotIdx <= 8) return 0.75;    // Players 7-9: 75%
  return 1.0;                        // Player 10: guaranteed
}

/**
 * Get the current boss phase (1-4) based on HP percentage
 */
function getBossPhase(currentHp, maxHp) {
  const pct = currentHp / maxHp;
  if (pct > 0.75) return 1;
  if (pct > 0.50) return 2;
  if (pct > 0.25) return 3;
  return 4;
}

/**
 * Build the boss team (boss ghost + minions for current phase)
 */
function buildBossTeam(bossConfig, phase, enrageLevel) {
  const bossGhost = {
    ...bossConfig.bossGhost,
    hp: bossConfig.bossGhost.maxHp,
    ko: false,
    isBoss: true
  };

  const minionIds = bossConfig.minionsByPhase[phase] || [];
  const minions = minionIds.map(mid => {
    const minionData = RAID_BOSS_MINIONS.find(m => m.id === mid);
    if (!minionData) return null;
    return {
      ...minionData,
      hp: minionData.maxHp,
      ko: false,
      isMinion: true
    };
  }).filter(Boolean);

  return {
    boss: bossGhost,
    minions: minions,
    activeIdx: 0, // 0 = boss is active
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

/**
 * Start a minion wave before the boss fight
 */
function startMinionWave(raidData, bossConfig, slotIdx) {
  const waveSize = slotIdx <= 5 ? 1 : (slotIdx <= 8 ? 2 : 3);
  const phase = getBossPhase(raidData.bossCurrentHp, raidData.bossMaxHp);
  const minionIds = bossConfig.minionsByPhase[phase] || [];

  // Pick wave minions from available pool
  const waveMinions = [];
  for (let i = 0; i < Math.min(waveSize, minionIds.length); i++) {
    const mid = minionIds[i % minionIds.length];
    const minionData = RAID_BOSS_MINIONS.find(m => m.id === mid);
    if (minionData) {
      waveMinions.push({ ...minionData, hp: minionData.maxHp, ko: false, isMinion: true, isWave: true });
    }
  }

  // Fill remaining slots with Drones
  while (waveMinions.length < waveSize) {
    const drone = RAID_BOSS_MINIONS.find(m => m.id === 9121);
    if (drone) waveMinions.push({ ...drone, hp: drone.maxHp, ko: false, isMinion: true, isWave: true });
    else break;
  }

  raidBattleState.waveMinions = waveMinions;

  if (typeof showMinionWaveIntro === 'function') {
    showMinionWaveIntro(waveMinions, () => {
      // After wave intro, start wave battle
      launchRaidBattle(raidData, waveMinions, true);
    });
  } else {
    launchRaidBattle(raidData, waveMinions, true);
  }
}

/**
 * Start the actual boss fight
 */
function startBossFight(raidData, bossConfig) {
  const phase = getBossPhase(raidData.bossCurrentHp, raidData.bossMaxHp);
  const bossTeam = buildBossTeam(bossConfig, phase, raidData.enrageLevel || 0);

  // Build the blue team array (boss + minions) for battle engine
  const blueGhosts = [bossTeam.boss, ...bossTeam.minions].slice(0, 3);

  if (typeof showBossIntro === 'function') {
    showBossIntro(bossConfig, phase, () => {
      launchRaidBattle(raidData, blueGhosts, false);
    });
  } else {
    launchRaidBattle(raidData, blueGhosts, false);
  }
}

/**
 * Launch a raid battle (wave or boss) using the existing battle engine
 */
function launchRaidBattle(raidData, enemyGhosts, isWave) {
  const playerData = raidData.players[raidData.currentFighterIdx || 0];
  const playerTeam = playerData.team;

  // Use bridge to run battle in-page (no testroom redirect)
  if (typeof initRaidBattleInPage === 'function') {
    initRaidBattleInPage(raidData, enemyGhosts, playerTeam, isWave);
  } else {
    // Fallback: old testroom redirect
    window.BOSS_MODE = true;
    window.BOSS_RAID_DATA = raidBattleState;
    window.IS_WAVE_FIGHT = isWave;
    if (typeof showRaidBattleUI === 'function') {
      showRaidBattleUI(playerTeam, enemyGhosts, isWave, raidData);
    }
  }
}

// ─── BOSS AI DECISIONS ──────────────────────────────────────────

/**
 * Boss auto-roll — called by battle engine when BOSS_MODE is true
 * Returns the boss's dice roll and any pre/post-roll actions
 */
function bossAutoRoll(bossTeam, playerTeam, battleState) {
  const personality = bossTeam.personality;
  const phase = bossTeam.phase;
  const enrage = bossTeam.enrageLevel;

  // Calculate boss dice count
  let diceCount = RAID_CONFIG.BOSS_BASE_DICE; // 4 base

  // Enrage dice bonus
  Object.entries(RAID_CONFIG.ENRAGE_DICE_BONUS).forEach(([level, bonus]) => {
    if (enrage >= parseInt(level)) diceCount += bonus;
  });

  // Personality-specific dice modifiers
  if (personality === 'swarm') {
    // Hive Mind: +1 die per living minion
    const livingMinions = bossTeam.minions.filter(m => m && !m.ko).length;
    diceCount += livingMinions;
  }

  // Roll the dice
  const dice = [];
  for (let i = 0; i < diceCount; i++) {
    dice.push(Math.floor(Math.random() * 6) + 1);
  }
  dice.sort((a, b) => b - a);

  // Pre-roll actions
  const preRollActions = bossPreRoll(personality, phase, enrage, bossTeam, playerTeam, battleState);

  // Post-roll actions (personality-specific modifications)
  const postRollResult = bossPostRoll(personality, phase, enrage, dice, bossTeam, playerTeam, battleState);

  return {
    dice: postRollResult.dice || dice,
    preRollActions: preRollActions,
    postRollActions: postRollResult.actions || [],
    diceCount: diceCount
  };
}

/**
 * Boss pre-roll decisions
 */
function bossPreRoll(personality, phase, enrage, bossTeam, playerTeam, battleState) {
  const actions = [];

  switch (personality) {
    case 'tyrant':
      // Commit all available resources for maximum damage
      if (bossTeam.resources.surge > 0) {
        actions.push({ type: 'commit_surge', amount: bossTeam.resources.surge });
      }
      if (bossTeam.resources.fire > 0) {
        actions.push({ type: 'commit_fire', amount: bossTeam.resources.fire });
      }
      break;

    case 'trickster':
      // Decide on swap based on HP and cooldown
      if (bossTeam.roundsSinceSwap >= 4 && bossTeam.minions.some(m => m && !m.ko)) {
        actions.push({ type: 'swap_to_minion' });
      }
      break;

    case 'swarm':
      // Check spawn cycle
      const spawnInterval = RAID_BOSSES[currentRaid?.raidId]?.spawnInterval?.[phase] || 3;
      bossTeam.spawnCounter++;
      if (bossTeam.spawnCounter >= spawnInterval) {
        const emptySlot = bossTeam.minions.findIndex(m => !m || m.ko);
        if (emptySlot >= 0) {
          actions.push({ type: 'spawn_minion', slot: emptySlot });
        } else {
          // Sacrifice weakest minion to heal boss 3 HP
          actions.push({ type: 'sacrifice_heal', amount: 3 });
        }
        bossTeam.spawnCounter = 0;
      }
      break;

    case 'glacier':
      // Frost Aura: deal cold damage at start of round
      const frostDamage = phase >= 4 ? 2 : 1;
      actions.push({ type: 'frost_aura', damage: frostDamage });

      // Frozen Dice: lock player's highest die(s) to 1
      const frozenCount = (phase >= 3 || bossTeam.minions.some(m => m?.id === 9132 && !m.ko)) ? 2 : 1;
      actions.push({ type: 'frozen_dice', count: frozenCount });
      break;
  }

  return actions;
}

/**
 * Boss post-roll actions
 */
function bossPostRoll(personality, phase, enrage, dice, bossTeam, playerTeam, battleState) {
  const actions = [];
  let modifiedDice = [...dice];

  switch (personality) {
    case 'trickster':
      // Mirror Dice: swap dice with player
      const swapCount = phase >= 4 ? 2 : 1;
      actions.push({ type: 'mirror_dice', swapCount: swapCount });
      break;

    case 'tyrant':
      // Crushing Blow check — handled in damage resolution
      break;

    case 'glacier':
      // Permafrost damage cap handled in damage resolution
      break;
  }

  return { dice: modifiedDice, actions };
}

/**
 * Apply boss damage modifiers when the boss wins a roll
 */
function bossWinDamageModifier(baseDamage, personality, phase, enrage, rollType, bossTeam, playerTeam) {
  let damage = baseDamage;

  // Enrage damage bonus
  Object.entries(RAID_CONFIG.ENRAGE_DAMAGE_BONUS).forEach(([level, bonus]) => {
    if (enrage >= parseInt(level)) damage += bonus;
  });

  // Enrage 9: double damage
  if (enrage >= 9) damage *= 2;

  switch (personality) {
    case 'tyrant':
      // +enrageLevel bonus damage
      damage += enrage;
      // On KO: gain 1 Sacred Fire (handled separately)
      break;

    case 'trickster':
      // Steal 1 resource on win
      // (handled in post-damage resolution)
      break;

    case 'swarm':
      // Base damage, no modifier
      break;

    case 'glacier':
      // Permafrost is a cap on PLAYER damage, not boss damage
      break;
  }

  return damage;
}

/**
 * Apply Permafrost damage cap when PLAYER deals damage to Glacier
 */
function bossDefenseDamageModifier(baseDamage, resourceDamage, personality, phase, bossTeam) {
  if (personality !== 'glacier') return baseDamage + resourceDamage;

  // Permafrost: cap base damage, resource damage bypasses
  const cap = phase >= 3 ? 2 : 3;
  const cappedBase = Math.min(baseDamage, cap);
  return cappedBase + resourceDamage;
}

/**
 * Check if boss should sacrifice a minion to negate damage (Swarm Queen)
 */
function bossCheckSacrifice(personality, bossTeam, incomingDamage) {
  if (personality !== 'swarm') return false;
  if (bossTeam.sacrificeUsedThisRound) return false;

  // Only sacrifice if damage would be significant (>= 2)
  if (incomingDamage < 2) return false;

  const sacrificeTarget = bossTeam.minions.find(m => m && !m.ko);
  if (!sacrificeTarget) return false;

  bossTeam.sacrificeUsedThisRound = true;
  sacrificeTarget.ko = true;
  sacrificeTarget.hp = 0;

  return { sacrificed: sacrificeTarget, negatedDamage: incomingDamage };
}

/**
 * Handle Trickster's resource steal on win
 */
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

/**
 * Handle Trickster's Mirror Dice swap
 */
function bossMirrorDice(bossDice, playerDice, swapCount) {
  const newBossDice = [...bossDice];
  const newPlayerDice = [...playerDice];

  for (let s = 0; s < swapCount; s++) {
    // Find the swap that maximizes boss advantage
    let bestSwap = null;
    let bestScore = -Infinity;

    for (let bi = 0; bi < newBossDice.length; bi++) {
      for (let pi = 0; pi < newPlayerDice.length; pi++) {
        if (newBossDice[bi] >= newPlayerDice[pi]) continue; // Only swap if we gain

        const testBoss = [...newBossDice];
        const testPlayer = [...newPlayerDice];
        testBoss[bi] = newPlayerDice[pi];
        testPlayer[pi] = newBossDice[bi];

        // Score: sum of boss dice - sum of player dice
        const score = testBoss.reduce((a, b) => a + b, 0) - testPlayer.reduce((a, b) => a + b, 0);
        if (score > bestScore) {
          bestScore = score;
          bestSwap = { bossIdx: bi, playerIdx: pi };
        }
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

/**
 * Tyrant Crushing Blow — on triples+, deal chip damage to sideline
 */
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

/**
 * Apply Glacier's Frozen Dice effect on player's next roll
 */
function applyFrozenDice(playerDice, frozenCount) {
  const sorted = [...playerDice].sort((a, b) => b - a);
  for (let i = 0; i < Math.min(frozenCount, sorted.length); i++) {
    // Find this die in the original array and lock to 1
    const idx = playerDice.indexOf(sorted[i]);
    if (idx >= 0) playerDice[idx] = 1;
  }
  return playerDice;
}

/**
 * Check if Ice Wall is alive (Glacier personality)
 */
function isIceWallActive(bossTeam) {
  return bossTeam.minions.some(m => m && !m.ko && m.id === 9131);
}

/**
 * Check for boss phase transition
 */
function checkBossPhaseTransition(oldHp, newHp, maxHp, personality, bossConfig) {
  const oldPhase = getBossPhase(oldHp, maxHp);
  const newPhase = getBossPhase(newHp, maxHp);

  if (newPhase > oldPhase) {
    return {
      transitioned: true,
      fromPhase: oldPhase,
      toPhase: newPhase,
      dialogue: bossConfig.dialogue['phase' + newPhase] || '',
      personality: personality
    };
  }
  return { transitioned: false };
}

/**
 * Apply phase transition effects
 */
function applyPhaseTransition(transition, bossTeam, playerTeam, bossConfig) {
  const effects = [];

  switch (transition.personality) {
    case 'tyrant':
      // Deal 2 chip damage to player's active ghost
      effects.push({ type: 'chip_damage', target: 'player_active', amount: 2, desc: 'THE TYRANT ROARS' });
      // Boss retreats for 3 rounds
      effects.push({ type: 'boss_retreat', rounds: 3, desc: 'The Mountain King retreats behind a minion' });
      break;

    case 'trickster':
      // Split into real + illusion
      effects.push({ type: 'illusion_split', desc: 'The Phantom splits into two!' });
      break;

    case 'swarm':
      // All minions explode, deal 2 damage each to player active
      const livingMinions = bossTeam.minions.filter(m => m && !m.ko);
      const explosionDamage = livingMinions.length * 2;
      livingMinions.forEach(m => { m.ko = true; m.hp = 0; });
      effects.push({ type: 'brood_burst', damage: explosionDamage, count: livingMinions.length, desc: 'BROOD BURST!' });
      // Spawn 2 new minions
      effects.push({ type: 'spawn_minions', count: 2, desc: 'New minions emerge!' });
      break;

    case 'glacier':
      // Freeze all player resources for 3 rounds
      effects.push({ type: 'freeze_resources', rounds: 3, desc: 'ABSOLUTE ZERO' });
      break;
  }

  // Update minions for new phase
  const newMinions = bossConfig.minionsByPhase[transition.toPhase] || [];
  effects.push({ type: 'update_minions', minionIds: newMinions });

  return effects;
}

// ─── DAMAGE & HP TRACKING ───────────────────────────────────────

/**
 * Apply damage to the shared boss HP pool and update Firebase
 */
async function drainBossHpPool(damage) {
  if (!currentRaid || !raidBattleState) return;

  const instanceId = currentRaid.instanceId;
  const oldHp = raidBattleState.currentBossHp;
  const newHp = Math.max(0, oldHp - damage);
  raidBattleState.currentBossHp = newHp;
  raidBattleState.totalDamageDealt += damage;

  // Update Firebase
  await db.ref(`mp/raids/instances/${instanceId}`).update({
    bossCurrentHp: newHp,
    totalDamageDealt: firebase.database.ServerValue.increment(damage)
  });

  // Check for phase transition
  const bossConfig = RAID_BOSSES[currentRaid.raidId];
  const transition = checkBossPhaseTransition(oldHp, newHp, raidBattleState.maxBossHp, bossConfig.personality, bossConfig);

  if (transition.transitioned) {
    raidBattleState.bossPhase = transition.toPhase;
    const effects = applyPhaseTransition(transition, raidBattleState.bossTeam, null, bossConfig);
    if (typeof showPhaseTransition === 'function') {
      showPhaseTransition(transition, effects);
    }
  }

  // Check for boss defeat
  if (newHp <= 0) {
    await handleBossDefeated();
  }

  return { oldHp, newHp, transition };
}

/**
 * Boss defeated!
 */
async function handleBossDefeated() {
  const user = firebase.auth().currentUser;
  const instanceId = currentRaid.instanceId;

  await db.ref(`mp/raids/instances/${instanceId}`).update({
    status: 'complete',
    completedAt: firebase.database.ServerValue.TIMESTAMP,
    bossDefeatedBy: user.uid,
    fightPhase: 'done'
  });

  // Distribute rewards to all participants
  await distributeRaidRewards(instanceId, true, user.uid);
}

/**
 * Player's fight is over (all 3 ghosts KO'd or boss team wiped for this round)
 */
async function endMyRaidFight(result) {
  if (!currentRaid || !raidBattleState) return;

  const instanceId = currentRaid.instanceId;
  const slotIdx = raidBattleState.currentSlot;

  // Stop heartbeat
  stopHeartbeat();

  // Update player stats
  await db.ref(`mp/raids/instances/${instanceId}/players/${slotIdx}`).update({
    status: 'done',
    damageDealt: raidBattleState.totalDamageDealt,
    ghostsLost: raidBattleState.ghostsLost
  });

  // Increment enrage and advance to next fighter
  const nextIdx = slotIdx + 1;
  const players = currentRaid.players || {};
  const totalPlayers = Object.keys(players).length;

  if (nextIdx >= totalPlayers) {
    // All players have fought — boss survived
    await db.ref(`mp/raids/instances/${instanceId}`).update({
      status: 'complete',
      completedAt: firebase.database.ServerValue.TIMESTAMP,
      fightPhase: 'done'
    });
    await distributeRaidRewards(instanceId, false, null);
  } else {
    // Advance to next fighter
    const nextPlayer = players[nextIdx];
    await db.ref(`mp/raids/instances/${instanceId}`).update({
      currentFighterIdx: nextIdx,
      currentFighterUid: nextPlayer?.uid || null,
      enrageLevel: firebase.database.ServerValue.increment(1),
      fightPhase: 'fighting'
    });
  }

  // Clear boss mode
  window.BOSS_MODE = false;
  window.BOSS_RAID_DATA = null;
  if (raidBattleState) raidBattleState.phase = 'done';
}

// ─── REWARDS ────────────────────────────────────────────────────

/**
 * Distribute rewards to all raid participants
 */
async function distributeRaidRewards(instanceId, bossDefeated, killingBlowUid) {
  const instSnap = await db.ref(`mp/raids/instances/${instanceId}`).once('value');
  const instance = instSnap.val();
  if (!instance) return;

  const bossConfig = RAID_BOSSES[instance.raidId];
  if (!bossConfig) return;

  const players = instance.players || {};
  const updates = {};

  // Find MVP (most damage dealt)
  let mvpUid = null;
  let maxDamage = 0;
  Object.values(players).forEach(p => {
    if ((p.damageDealt || 0) > maxDamage) {
      maxDamage = p.damageDealt;
      mvpUid = p.uid;
    }
  });

  // Calculate rewards for each player
  const badgePromises = [];
  for (const [slot, p] of Object.entries(players)) {
    let points = 0;

    if (bossDefeated) {
      points = bossConfig.rewardPoints;

      if (p.uid === killingBlowUid) {
        points += bossConfig.bonusPoints; // Killing blow bonus
      }
      if (p.uid === mvpUid) {
        points += bossConfig.bonusPoints; // MVP bonus
      }

      // Players who were queued but didn't get to fight yet get 25% participation reward
      if (p.status === 'registered') {
        points = Math.round(bossConfig.rewardPoints * 0.25);
      }
    } else {
      // Boss survived — 50% partial reward based on damage
      points = Math.round(bossConfig.rewardPoints * 0.5 * (p.damageDealt || 0) / (instance.bossMaxHp || 100));
    }

    if (p.status === 'disconnected') {
      points = 0; // Disconnected players get nothing
    }

    // Update user's raid points
    if (points > 0) {
      updates[`mp/users/${p.uid}/raidPoints`] = firebase.database.ServerValue.increment(points);
    }

    // Update raid stats
    updates[`mp/users/${p.uid}/raidStats/raidsCompleted`] = firebase.database.ServerValue.increment(1);
    updates[`mp/users/${p.uid}/raidStats/totalBossDamage`] = firebase.database.ServerValue.increment(p.damageDealt || 0);

    if (p.uid === killingBlowUid) {
      updates[`mp/users/${p.uid}/raidStats/killingBlows`] = firebase.database.ServerValue.increment(1);
    }

    // Award boss badge (first-time kill) — collect promise so we can await all badges
    if (bossDefeated) {
      const badgeEntry = Object.entries(RAID_BADGES).find(([key, badge]) => badge.boss === instance.raidId);
      if (badgeEntry) {
        badgePromises.push(awardRaidBadge(p.uid, badgeEntry[0]));
      }
    }

    // === LOOT ROLL ===
    // Each player rolls 3 dice to determine their loot drop
    if (bossDefeated && p.status !== 'disconnected') {
      const loot = rollBossLoot(bossConfig.tier || 1);

      // Store loot roll result on the instance so UI can show it
      updates[`mp/raids/instances/${instanceId}/players/${slot}/lootRoll`] = loot.roll;
      updates[`mp/raids/instances/${instanceId}/players/${slot}/lootType`] = loot.rollType;
      updates[`mp/raids/instances/${instanceId}/players/${slot}/lootItem`] = loot.item ? loot.item.key : null;
      updates[`mp/raids/instances/${instanceId}/players/${slot}/lootItemName`] = loot.item ? loot.item.name : null;
      updates[`mp/raids/instances/${instanceId}/players/${slot}/lootItemIcon`] = loot.item ? loot.item.icon : null;

      // Save to player's raid run inventory (persists across bosses within this raid)
      const invRef = db.ref(`mp/users/${p.uid}/raidRunInventory`);
      const invSnap = await invRef.once('value');
      const inv = invSnap.val() || { items: [] };

      // Add item if not already owned
      if (loot.item && !inv.items.includes(loot.item.key)) {
        inv.items.push(loot.item.key);

        // Auto-equip into empty slot
        const itemDef = RAID_ITEMS[loot.item.key];
        if (itemDef?.slot) {
          inv.equipped = inv.equipped || { head: null, weapon: null, accessory: null };
          if (!inv.equipped[itemDef.slot]) {
            inv.equipped[itemDef.slot] = loot.item.key;
          }
        }
      }

      await invRef.set(inv);
    }

    // Clear active raid flag
    updates[`mp/users/${p.uid}/activeRaid`] = null;
  }

  await db.ref().update(updates);
  // Await all badge grants so spectators reliably receive their badge
  if (badgePromises.length > 0) {
    await Promise.all(badgePromises);
  }
}

/**
 * Award a raid badge if not already owned
 */
async function awardRaidBadge(uid, badgeKey) {
  const snap = await db.ref(`mp/users/${uid}/raidBadges`).once('value');
  const badges = snap.val() || [];

  if (!badges.includes(badgeKey)) {
    badges.push(badgeKey);
    await db.ref(`mp/users/${uid}/raidBadges`).set(badges);

    // Check if this unlocks a composite badge (dragon_slayer, raid_master, ultimate_raider)
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

/**
 * Check if user has a specific badge
 */
function hasRaidBadge(badges, badgeKey) {
  return (badges || []).includes(badgeKey);
}

// ─── HEARTBEAT & DISCONNECT ────────────────────────────────────

function startHeartbeat(slotIdx) {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (currentRaid) {
      db.ref(`mp/raids/instances/${currentRaid.instanceId}/players/${slotIdx}/lastHeartbeat`)
        .set(firebase.database.ServerValue.TIMESTAMP);
    }
  }, RAID_CONFIG.HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

/**
 * Monitor current fighter for disconnect (other players watch)
 */
function monitorCurrentFighter(data) {
  const currentIdx = data.currentFighterIdx || 0;
  const fighter = data.players?.[currentIdx];
  if (!fighter || fighter.status !== 'fighting') return;

  const now = Date.now();
  const serverOffset = window._serverTimeOffset || 0;
  const serverNow = now + serverOffset;
  const lastBeat = fighter.lastHeartbeat || 0;

  if (lastBeat > 0 && (serverNow - lastBeat) > RAID_CONFIG.DISCONNECT_TIMEOUT_MS) {
    // Fighter appears disconnected — try to advance
    handleFighterDisconnect(data, currentIdx);
  }
}

/**
 * Handle a disconnected fighter — advance to next
 */
async function handleFighterDisconnect(data, slotIdx) {
  const instanceId = currentRaid?.instanceId;
  if (!instanceId) return;

  // Use transaction to avoid race condition (multiple players detecting disconnect)
  const instRef = db.ref(`mp/raids/instances/${instanceId}`);
  await instRef.transaction((current) => {
    if (!current) return current;
    if (current.currentFighterIdx !== slotIdx) return; // Already advanced

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

// ─── SPECTATOR SNAPSHOT ─────────────────────────────────────────

/**
 * Write a battle snapshot for spectators
 */
async function writeBattleSnapshot(snapshotData) {
  if (!currentRaid) return;
  const instanceId = currentRaid.instanceId;

  // Firebase rejects undefined values — coerce all fields to non-undefined
  const pg = snapshotData.playerGhost || {};
  const bg = snapshotData.bossGhost || {};
  const snapshot = {
    playerName: snapshotData.playerName || 'Raider',
    playerGhost: {
      name: pg.name || '???',
      hp: pg.hp || 0,
      maxHp: pg.maxHp || 1,
      art: pg.art || '',
      ko: pg.ko || false
    },
    bossGhost: {
      name: bg.name || '???',
      hp: bg.hp || 0,
      maxHp: bg.maxHp || 1,
      art: bg.art || '',
      isBoss: true,
      ko: bg.ko || false
    },
    playerSideline: (snapshotData.playerSideline || []).map(g => ({
      name: g.name || '???', hp: g.hp || 0, maxHp: g.maxHp || 1, ko: !!g.ko, art: g.art || ''
    })),
    bossSideline: (snapshotData.bossSideline || []).map(g => ({
      name: g.name || '???', hp: g.hp || 0, maxHp: g.maxHp || 1, ko: !!g.ko, art: g.art || ''
    })),
    lastRoll: snapshotData.lastRoll || null,
    bossPoolHp: raidBattleState?.currentBossHp || 0,
    bossMaxHp: raidBattleState?.maxBossHp || 100,
    round: snapshotData.round || 0,
    isWave: snapshotData.isWave || false,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };
  await db.ref(`mp/raids/instances/${instanceId}/battleState`).set(snapshot);
}

// ─── CLEANUP ────────────────────────────────────────────────────

/**
 * Clean up all raid listeners and state
 */
function cleanupRaid() {
  // Remove Firebase listeners
  if (currentRaid?.instanceId) {
    const instRef = db.ref(`mp/raids/instances/${currentRaid.instanceId}`);
    if (raidListeners['instance']) instRef.off('value', raidListeners['instance']);
    if (raidListeners['instance_status']) instRef.child('status').off('value', raidListeners['instance_status']);
    if (raidListeners['battleState']) instRef.child('battleState').off('value', raidListeners['battleState']);
  }
  Object.entries(raidListeners).forEach(([key]) => {
    if (key.startsWith('queue_')) {
      const raidId = key.replace('queue_', '');
      db.ref(`mp/raids/queue/${raidId}`).off('value', raidListeners[key]);
    }
  });
  raidListeners = {};
  stopHeartbeat();
  currentRaid = null;
  raidBattleState = null;
  window.BOSS_MODE = false;
  window.BOSS_RAID_DATA = null;
  window._raidWaitingRoomShown = false;
}

/**
 * Clean up stale raids on app initialization
 */
async function cleanupStaleRaids() {
  const now = Date.now();
  const serverOffset = window._serverTimeOffset || 0;
  const serverNow = now + serverOffset;

  // Clean stale instances
  const instSnap = await db.ref('mp/raids/instances').orderByChild('status').equalTo('active').once('value');
  const instances = instSnap.val() || {};
  for (const [id, inst] of Object.entries(instances)) {
    if (inst.startedAt && (serverNow - inst.startedAt) > RAID_CONFIG.STALE_INSTANCE_MS) {
      await db.ref(`mp/raids/instances/${id}/status`).set('abandoned');
      // Clear activeRaid for all players
      if (inst.players) {
        const updates = {};
        Object.values(inst.players).forEach(p => {
          updates[`mp/users/${p.uid}/activeRaid`] = null;
        });
        await db.ref().update(updates);
      }
    }
  }

  // Clean stale queue entries
  const allBosses = Object.keys(RAID_BOSSES);
  for (const raidId of allBosses) {
    const qSnap = await db.ref(`mp/raids/queue/${raidId}`).once('value');
    const queue = qSnap.val() || {};
    for (const [uid, entry] of Object.entries(queue)) {
      if (entry.joinedAt && (serverNow - entry.joinedAt) > RAID_CONFIG.STALE_QUEUE_MS) {
        await db.ref(`mp/raids/queue/${raidId}/${uid}`).remove();
      }
    }
  }
}

// ─── INIT ───────────────────────────────────────────────────────

async function initRaidSystem() {
  // Don't init if we're processing a raid result return
  if (window._raidResultPending) return;

  // Clear any stale activeRaid from crashed sessions BEFORE starting listeners
  const user = firebase.auth().currentUser;
  if (user) {
    const arSnap = await db.ref(`mp/users/${user.uid}/activeRaid`).once('value');
    const activeId = arSnap.val();
    if (activeId) {
      const instSnap = await db.ref(`mp/raids/instances/${activeId}/status`).once('value');
      const status = instSnap.val();
      if (!status || status === 'complete' || status === 'abandoned') {
        await db.ref(`mp/users/${user.uid}/activeRaid`).remove();
        console.log('[RAID] Cleared stale activeRaid:', activeId);
      }
    }
  }
  startActiveRaidListener();
  cleanupStaleRaids();
}
