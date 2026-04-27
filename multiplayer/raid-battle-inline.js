// =================================================================
// RAID BATTLE INLINE ENGINE
// Multiplayer raid battles that run directly in the multiplayer page.
// No testroom redirect — all players see the same battle state via
// Firebase realtime listeners and take alternating turns rolling
// against a shared boss HP pool.
//
// Architecture:
//   - All state lives in Firebase at mp/raids/instances/{id}/inlineBattle/
//   - Every player listens to that path and renders the shared view
//   - Only the active turn player can write rolls/actions
//   - Boss rolls are computed by the active player's client and written
//     to Firebase so all spectators see the result simultaneously
//   - Turn order cycles through all non-eliminated players
//
// Depends on:
//   - cards.js        → getGhost(), RAID_BOSSES
//   - raid-engine.js  → RAID_CONFIG, bossPreRoll, distributeRaidRewards,
//                        getBossPhase, applyFrozenDice
//   - Firebase RTDB   → firebase.database(), firebase.auth()
// =================================================================

const INLINE_BATTLE = (() => {
  'use strict';

  // ─── CONSTANTS ──────────────────────────────────────────────────

  const TYPE_RANK = { singles: 1, doubles: 2, triples: 3, quads: 4, penta: 5 };
  const EMPTY_RESOURCES = { luckyStone: 0, healingSeed: 0, fire: 0, ice: 0, surge: 0, moonstone: 0, firefly: 0 };
  const COMMITTABLE = ['fire', 'ice', 'surge'];

  // Local listener handle so we can detach on cleanup
  let _listener = null;
  let _listenerRef = null;

  // ─── DICE CORE ──────────────────────────────────────────────────

  /**
   * Roll `count` d6 dice. Returns a sorted (ascending) array.
   */
  function rollDice(count = 3) {
    const dice = [];
    for (let i = 0; i < count; i++) {
      dice.push(Math.floor(Math.random() * 6) + 1);
    }
    return dice.sort((a, b) => a - b);
  }

  /**
   * Classify a sorted dice array into a roll result.
   * Returns { type, value, damage }.
   */
  function classify(dice) {
    if (!dice || !dice.length) return { type: 'none', value: 0, damage: 0 };
    if (dice.length === 1) return { type: 'singles', value: dice[0], damage: 1 };

    const counts = {};
    dice.forEach(d => { counts[d] = (counts[d] || 0) + 1; });

    const maxCount = Math.max(...Object.values(counts));
    const matchedValues = Object.entries(counts)
      .filter(([, v]) => v === maxCount)
      .map(([k]) => +k);
    const bestValue = Math.max(...matchedValues);

    if (maxCount >= 5) return { type: 'penta', value: bestValue, damage: 5 };
    if (maxCount >= 4) return { type: 'quads', value: bestValue, damage: 4 };
    if (maxCount >= 3) return { type: 'triples', value: bestValue, damage: 3 };
    if (maxCount >= 2) return { type: 'doubles', value: bestValue, damage: 2 };
    return { type: 'singles', value: Math.max(...dice), damage: 1 };
  }

  /**
   * Compare two roll results. Returns 'player' | 'boss' | 'tie'.
   */
  function determineWinner(playerResult, bossResult) {
    const pRank = TYPE_RANK[playerResult.type] || 0;
    const bRank = TYPE_RANK[bossResult.type] || 0;

    if (pRank > bRank) return 'player';
    if (bRank > pRank) return 'boss';
    // Same type — compare matched value
    if (playerResult.value > bossResult.value) return 'player';
    if (bossResult.value > playerResult.value) return 'boss';
    return 'tie';
  }

  // ─── HELPERS ────────────────────────────────────────────────────

  function _db() { return firebase.database(); }
  function _uid() { return firebase.auth().currentUser?.uid || null; }
  function _battleRef(instanceId) { return _db().ref(`mp/raids/instances/${instanceId}/inlineBattle`); }

  /**
   * Read the current inline battle state from Firebase (one-shot).
   */
  async function _getState(instanceId) {
    const snap = await _battleRef(instanceId).once('value');
    return snap.val();
  }

  /**
   * Build the pre-filled turn order array.
   * Cycles through player indices for a fixed number of max rounds.
   */
  function _buildTurnOrder(playerCount, maxCycles = 30) {
    const order = [];
    for (let cycle = 0; cycle < maxCycles; cycle++) {
      for (let p = 0; p < playerCount; p++) {
        order.push(p);
      }
    }
    return order;
  }

  /**
   * Find the next non-eliminated player in the turn order starting
   * from the current turnIndex. Returns -1 if everyone is eliminated.
   */
  function getNextTurn(state) {
    if (!state || !state.turnOrder || !state.players) return -1;

    const playerCount = Object.keys(state.players).length;
    let idx = (state.turnIndex || 0) + 1;

    // Walk forward through turnOrder, skipping eliminated players.
    // Stop after a full cycle to avoid infinite loops.
    let checked = 0;
    while (checked < playerCount) {
      if (idx >= state.turnOrder.length) {
        // Wrap — shouldn't happen with 30 cycles, but be safe
        return -1;
      }
      const pIdx = state.turnOrder[idx];
      const player = state.players[pIdx];
      if (player && !player.eliminated) {
        return idx; // index into turnOrder
      }
      idx++;
      checked++;
    }
    return -1; // all eliminated
  }

  /**
   * Count how many living minions the boss has (for Swarm personality).
   */
  function _livingMinionCount(bossData) {
    if (!bossData || !bossData.ghosts) return 0;
    return bossData.ghosts.filter((g, i) => i > 0 && g && !g.ko).length;
  }

  // ─── INIT ───────────────────────────────────────────────────────

  /**
   * Initialize the inline battle state and write it to Firebase.
   * Called once when the raid transitions to 'active'.
   *
   * @param {string} instanceId — Firebase raid instance key
   * @param {object} raidData   — full raid instance data from Firebase
   */
  async function initInlineBattle(instanceId, raidData) {
    const raidId = raidData.raidId;
    const bossConfig = typeof RAID_BOSSES !== 'undefined' ? RAID_BOSSES[raidId] : null;
    if (!bossConfig) {
      console.error('[INLINE] Unknown raid:', raidId);
      return null;
    }

    const bossGhostSource = bossConfig.bossGhost;
    const bossMaxHp = raidData.bossMaxHp || bossGhostSource.maxHp;

    // Build player entries
    const players = {};
    const rawPlayers = raidData.players || {};
    const playerCount = Object.keys(rawPlayers).length;

    for (const [slotStr, pData] of Object.entries(rawPlayers)) {
      const slot = parseInt(slotStr, 10);
      const ghosts = (pData.team || []).map(ghostId => {
        const g = typeof getGhost === 'function' ? getGhost(ghostId) : null;
        if (!g) return { id: ghostId, name: '???', hp: 5, maxHp: 5, ko: false, art: null };
        return {
          id: g.id,
          name: g.name,
          hp: g.maxHp || g.hp || 5,
          maxHp: g.maxHp || g.hp || 5,
          ko: false,
          art: g.art || g.image || null
        };
      });

      players[slot] = {
        uid: pData.uid,
        displayName: pData.displayName || 'Raider',
        ghosts: ghosts,
        activeIdx: 0,
        resources: { ...EMPTY_RESOURCES },
        committed: { fire: 0, ice: 0, surge: 0 },
        damageDealt: 0,
        eliminated: false
      };
    }

    // Build boss entry
    const bossGhost = {
      id: bossGhostSource.id,
      name: bossGhostSource.name,
      hp: bossGhostSource.maxHp || bossGhostSource.hp,
      maxHp: bossGhostSource.maxHp || bossGhostSource.hp,
      ko: false,
      art: bossGhostSource.art || bossGhostSource.image || null,
      isBoss: true
    };

    // Include minions if boss config has them
    const bossGhosts = [bossGhost];
    if (bossConfig.minionsByPhase) {
      const phase1Minions = bossConfig.minionsByPhase[1] || [];
      const MINIONS = typeof RAID_BOSS_MINIONS !== 'undefined' ? RAID_BOSS_MINIONS : [];
      phase1Minions.forEach(mid => {
        const m = MINIONS.find(x => x.id === mid);
        if (m) {
          bossGhosts.push({
            id: m.id,
            name: m.name,
            hp: m.maxHp || m.hp,
            maxHp: m.maxHp || m.hp,
            ko: false,
            art: m.art || m.image || null,
            isBoss: false
          });
        }
      });
    }

    const turnOrder = _buildTurnOrder(playerCount);

    const initialState = {
      phase: 'pre-roll',
      turnPlayerIdx: turnOrder[0],
      round: 1,
      bossHp: bossMaxHp,
      bossMaxHp: bossMaxHp,
      enrageLevel: 0,
      players: players,
      boss: { ghosts: bossGhosts, activeIdx: 0 },
      lastRoll: null,
      log: ['Raid battle begins!'],
      turnOrder: turnOrder,
      turnIndex: 0,
      bossPersonality: bossConfig.personality || null,
      raidId: raidId,
      startedAt: firebase.database.ServerValue.TIMESTAMP
    };

    await _battleRef(instanceId).set(initialState);

    // Start listening
    listenToInlineBattle(instanceId, null);

    return initialState;
  }

  // ─── PRE-ROLL ACTIONS ──────────────────────────────────────────

  /**
   * Toggle a committed resource (fire/ice/surge) before rolling.
   * Only the active turn player can call this.
   */
  async function commitResource(instanceId, resourceType) {
    if (!COMMITTABLE.includes(resourceType)) return;

    const state = await _getState(instanceId);
    if (!state || state.phase !== 'pre-roll') return;

    const uid = _uid();
    const pIdx = state.turnPlayerIdx;
    const player = state.players?.[pIdx];
    if (!player || player.uid !== uid) return;

    const available = player.resources[resourceType] || 0;
    const currentCommit = player.committed[resourceType] || 0;

    // Toggle: if already committed, uncommit. Otherwise commit 1.
    const newCommit = currentCommit > 0 ? 0 : Math.min(1, available);

    await _battleRef(instanceId)
      .child(`players/${pIdx}/committed/${resourceType}`)
      .set(newCommit);
  }

  /**
   * Use a Healing Seed to heal active ghost +1 HP (capped at maxHp).
   * Only usable pre-roll on your turn.
   */
  async function useHealingSeed(instanceId) {
    const state = await _getState(instanceId);
    if (!state || state.phase !== 'pre-roll') return { error: 'Not in pre-roll phase' };

    const uid = _uid();
    const pIdx = state.turnPlayerIdx;
    const player = state.players?.[pIdx];
    if (!player || player.uid !== uid) return { error: 'Not your turn' };
    if ((player.resources.healingSeed || 0) < 1) return { error: 'No Healing Seeds' };

    const ghost = player.ghosts[player.activeIdx];
    if (!ghost || ghost.ko) return { error: 'No active ghost' };
    if (ghost.hp >= ghost.maxHp) return { error: 'Already at full HP' };

    const newHp = Math.min(ghost.hp + 1, ghost.maxHp);
    const newSeeds = player.resources.healingSeed - 1;

    const updates = {};
    updates[`players/${pIdx}/ghosts/${player.activeIdx}/hp`] = newHp;
    updates[`players/${pIdx}/resources/healingSeed`] = newSeeds;

    const logEntry = `${player.displayName} used a Healing Seed! ${ghost.name} healed to ${newHp} HP.`;
    const newLog = [...(state.log || []), logEntry].slice(-50);
    updates['log'] = newLog;

    await _battleRef(instanceId).update(updates);
    return { success: true, newHp };
  }

  // ─── ROLLING ────────────────────────────────────────────────────

  /**
   * The active player clicks ROLL. Resolves the entire roll sequence:
   * player dice, boss dice, boss personality effects, winner, damage.
   * Writes the result to Firebase as an atomic update.
   */
  async function doPlayerRoll(instanceId) {
    const state = await _getState(instanceId);
    if (!state || state.phase !== 'pre-roll') return { error: 'Not in pre-roll phase' };

    const uid = _uid();
    const pIdx = state.turnPlayerIdx;
    const player = state.players?.[pIdx];
    if (!player || player.uid !== uid) return { error: 'Not your turn' };

    const playerGhost = player.ghosts[player.activeIdx];
    if (!playerGhost || playerGhost.ko) return { error: 'No active ghost' };

    const bossGhost = state.boss.ghosts[state.boss.activeIdx];
    if (!bossGhost) return { error: 'No boss ghost' };

    // Mark phase as rolling (optimistic lock)
    await _battleRef(instanceId).child('phase').set('rolling');

    // ─── Player dice ───
    let playerDice = rollDice(3);

    // ─── Boss dice ───
    const baseBossDice = (typeof RAID_CONFIG !== 'undefined' ? RAID_CONFIG.BOSS_BASE_DICE : 4);
    let bossDiceCount = baseBossDice;

    // Boss personality pre-roll effects
    const personality = state.bossPersonality;
    const enrage = state.enrageLevel || 0;
    let preRollLog = [];

    if (personality === 'tyrant') {
      // Tyrant auto-commits all available resources for +damage
      // (boss doesn't have player-style resources in inline mode,
      //  so this translates to a flat +1 damage bonus at enrage 3+)
      if (enrage >= 3) {
        preRollLog.push('The Tyrant channels dark energy...');
      }
    }

    if (personality === 'glacier') {
      // Freeze 1 player die to 1
      const freezeCount = enrage >= 5 ? 2 : 1;
      playerDice = _applyFrozenDice(playerDice, freezeCount);
      preRollLog.push(`Glacier freezes ${freezeCount} of your dice to 1!`);
    }

    if (personality === 'swarm') {
      // +1 die per living minion
      const minionCount = _livingMinionCount(state.boss);
      if (minionCount > 0) {
        bossDiceCount += minionCount;
        preRollLog.push(`Swarm gains +${minionCount} dice from minions!`);
      }
    }

    // Enrage dice bonus
    if (typeof RAID_CONFIG !== 'undefined' && RAID_CONFIG.ENRAGE_DICE_BONUS) {
      Object.entries(RAID_CONFIG.ENRAGE_DICE_BONUS).forEach(([level, bonus]) => {
        if (enrage >= parseInt(level, 10)) bossDiceCount += bonus;
      });
    }

    let bossDice = rollDice(bossDiceCount);

    // ─── Classify ───
    const playerResult = classify(playerDice);
    const bossResult = classify(bossDice);

    // ─── Winner ───
    const winner = determineWinner(playerResult, bossResult);

    // ─── Damage calculation ───
    let finalDamage = 0;
    const committedTotal = (player.committed.fire || 0)
                         + (player.committed.ice || 0)
                         + (player.committed.surge || 0);

    if (winner === 'player') {
      // Player wins: base damage + committed resources
      finalDamage = playerResult.damage + committedTotal;
    } else if (winner === 'boss') {
      // Boss wins: base damage + enrage bonuses
      finalDamage = bossResult.damage;
      // Enrage damage bonus
      if (typeof RAID_CONFIG !== 'undefined' && RAID_CONFIG.ENRAGE_DAMAGE_BONUS) {
        Object.entries(RAID_CONFIG.ENRAGE_DAMAGE_BONUS).forEach(([level, bonus]) => {
          if (enrage >= parseInt(level, 10)) finalDamage += bonus;
        });
      }
      // Enrage 9+: double damage
      if (enrage >= 9) finalDamage *= 2;
    }
    // Tie: no damage

    // ─── Apply damage ───
    const updates = {};
    let logLines = [...preRollLog];

    logLines.push(
      `${player.displayName} rolled [${playerDice.join(',')}] (${playerResult.type} ${playerResult.value}) ` +
      `vs Boss [${bossDice.join(',')}] (${bossResult.type} ${bossResult.value})`
    );

    let newBossHp = state.bossHp;
    let playerGhostHp = playerGhost.hp;
    let bossDefeated = false;
    let playerGhostKo = false;

    if (winner === 'player' && finalDamage > 0) {
      // Drain shared boss HP pool
      newBossHp = Math.max(0, state.bossHp - finalDamage);
      updates['bossHp'] = newBossHp;
      logLines.push(`${player.displayName} deals ${finalDamage} damage to the boss! (${newBossHp}/${state.bossMaxHp} HP)`);

      if (newBossHp <= 0) {
        bossDefeated = true;
        logLines.push('THE BOSS HAS BEEN DEFEATED!');
      }
    } else if (winner === 'boss' && finalDamage > 0) {
      // Boss damages player's active ghost
      playerGhostHp = Math.max(0, playerGhost.hp - finalDamage);
      updates[`players/${pIdx}/ghosts/${player.activeIdx}/hp`] = playerGhostHp;
      logLines.push(`Boss deals ${finalDamage} damage to ${playerGhost.name}! (${playerGhostHp}/${playerGhost.maxHp} HP)`);

      if (playerGhostHp <= 0) {
        updates[`players/${pIdx}/ghosts/${player.activeIdx}/ko`] = true;
        playerGhostKo = true;
        logLines.push(`${playerGhost.name} has been KO'd!`);
      }
    } else {
      logLines.push('TIE! No damage dealt.');
    }

    // Deduct committed resources
    for (const resType of COMMITTABLE) {
      const spent = player.committed[resType] || 0;
      if (spent > 0) {
        const newAmount = Math.max(0, (player.resources[resType] || 0) - spent);
        updates[`players/${pIdx}/resources/${resType}`] = newAmount;
      }
    }
    // Reset committed
    updates[`players/${pIdx}/committed`] = { fire: 0, ice: 0, surge: 0 };

    // Track damage dealt by this player
    if (winner === 'player' && finalDamage > 0) {
      const newDamage = (player.damageDealt || 0) + finalDamage;
      updates[`players/${pIdx}/damageDealt`] = newDamage;
    }

    // Build lastRoll snapshot
    updates['lastRoll'] = {
      playerIdx: pIdx,
      playerDice: playerDice,
      bossDice: bossDice,
      playerResult: playerResult,
      bossResult: bossResult,
      winner: winner,
      finalDamage: finalDamage
    };

    // ─── Determine next phase ───
    if (bossDefeated) {
      updates['phase'] = 'game-over';
      logLines.push('VICTORY! The raid boss falls!');
    } else if (playerGhostKo) {
      // Check if player has alive sideline ghosts
      const aliveGhosts = player.ghosts.filter((g, i) => i !== player.activeIdx && !g.ko);
      if (aliveGhosts.length > 0) {
        updates['phase'] = 'ko-swap';
        logLines.push(`${player.displayName} must choose a new ghost.`);
      } else {
        // All ghosts KO'd — player eliminated
        updates[`players/${pIdx}/eliminated`] = true;
        logLines.push(`${player.displayName} has been eliminated!`);

        // Check if all players are eliminated
        const allEliminated = _checkAllEliminated(state.players, pIdx);
        if (allEliminated) {
          updates['phase'] = 'game-over';
          logLines.push('All players eliminated. The boss wins...');
        } else {
          // Advance turn
          const nextTurnIdx = getNextTurn(state);
          if (nextTurnIdx === -1) {
            updates['phase'] = 'game-over';
            logLines.push('No players remaining. The boss wins...');
          } else {
            updates['phase'] = 'pre-roll';
            updates['turnIndex'] = nextTurnIdx;
            updates['turnPlayerIdx'] = state.turnOrder[nextTurnIdx];
            // Check if we completed a full round
            const nextPlayerIdx = state.turnOrder[nextTurnIdx];
            if (nextPlayerIdx <= pIdx) {
              updates['round'] = (state.round || 1) + 1;
              updates['enrageLevel'] = enrage + 1;
              logLines.push(`Round ${(state.round || 1) + 1} begins. Enrage level: ${enrage + 1}`);
            }
          }
        }
      }
    } else {
      // Normal turn advance — move to next player
      const nextTurnIdx = getNextTurn(state);
      if (nextTurnIdx === -1) {
        // Shouldn't happen if boss not defeated and players alive, but handle gracefully
        updates['phase'] = 'game-over';
        logLines.push('No players remaining.');
      } else {
        updates['phase'] = 'pre-roll';
        updates['turnIndex'] = nextTurnIdx;
        updates['turnPlayerIdx'] = state.turnOrder[nextTurnIdx];
        const nextPlayerIdx = state.turnOrder[nextTurnIdx];
        if (nextPlayerIdx <= pIdx) {
          updates['round'] = (state.round || 1) + 1;
          updates['enrageLevel'] = enrage + 1;
          logLines.push(`Round ${(state.round || 1) + 1} begins. Enrage level: ${enrage + 1}`);
        }
      }
    }

    // Append log (keep last 50 entries)
    const newLog = [...(state.log || []), ...logLines].slice(-50);
    updates['log'] = newLog;

    // Atomic write
    await _battleRef(instanceId).update(updates);

    // If game over, trigger end-of-battle logic
    if (updates['phase'] === 'game-over') {
      // Small delay so listeners pick up the final state before cleanup
      setTimeout(() => {
        endInlineBattle(instanceId, bossDefeated);
      }, 500);
    }

    return {
      playerDice, bossDice, playerResult, bossResult,
      winner, finalDamage, bossDefeated, playerGhostKo
    };
  }

  /**
   * Check if all players would be eliminated after marking pIdx as eliminated.
   */
  function _checkAllEliminated(players, justEliminatedIdx) {
    for (const [slot, p] of Object.entries(players)) {
      if (parseInt(slot, 10) === justEliminatedIdx) continue;
      if (!p.eliminated) return false;
    }
    return true;
  }

  /**
   * Apply Glacier's frozen dice effect — lock highest dice to 1.
   */
  function _applyFrozenDice(dice, count) {
    // dice is sorted ascending, so highest are at the end
    const result = [...dice];
    for (let i = 0; i < Math.min(count, result.length); i++) {
      result[result.length - 1 - i] = 1;
    }
    return result.sort((a, b) => a - b);
  }

  // ─── POST-ROLL ACTIONS ─────────────────────────────────────────

  /**
   * After rolling, spend a Lucky Stone to reroll one die.
   * Recalculates the result after the reroll.
   */
  async function useLuckyStone(instanceId, dieIndex) {
    const state = await _getState(instanceId);
    if (!state || state.phase !== 'rolling') return { error: 'Not in rolling phase' };
    // Allow Lucky Stone use right after roll resolves — check lastRoll exists
    if (!state.lastRoll) return { error: 'No roll to modify' };

    const uid = _uid();
    const pIdx = state.turnPlayerIdx;
    const player = state.players?.[pIdx];
    if (!player || player.uid !== uid) return { error: 'Not your turn' };
    if ((player.resources.luckyStone || 0) < 1) return { error: 'No Lucky Stones' };

    const lastRoll = state.lastRoll;
    if (lastRoll.playerIdx !== pIdx) return { error: 'Roll does not belong to you' };

    const dice = [...lastRoll.playerDice];
    if (dieIndex < 0 || dieIndex >= dice.length) return { error: 'Invalid die index' };

    // Reroll the chosen die
    const oldValue = dice[dieIndex];
    dice[dieIndex] = Math.floor(Math.random() * 6) + 1;
    const newDice = dice.sort((a, b) => a - b);

    // Recalculate
    const newPlayerResult = classify(newDice);
    const bossResult = lastRoll.bossResult;
    const newWinner = determineWinner(newPlayerResult, bossResult);

    // Recalculate damage
    const committedTotal = (player.committed.fire || 0)
                         + (player.committed.ice || 0)
                         + (player.committed.surge || 0);
    let newFinalDamage = 0;
    if (newWinner === 'player') {
      newFinalDamage = newPlayerResult.damage + committedTotal;
    } else if (newWinner === 'boss') {
      newFinalDamage = bossResult.damage;
      const enrage = state.enrageLevel || 0;
      if (typeof RAID_CONFIG !== 'undefined' && RAID_CONFIG.ENRAGE_DAMAGE_BONUS) {
        Object.entries(RAID_CONFIG.ENRAGE_DAMAGE_BONUS).forEach(([level, bonus]) => {
          if (enrage >= parseInt(level, 10)) newFinalDamage += bonus;
        });
      }
      if (enrage >= 9) newFinalDamage *= 2;
    }

    // We need to UNDO the old damage and APPLY the new damage.
    // Revert old outcome first.
    const updates = {};
    const logLines = [];
    const oldWinner = lastRoll.winner;
    const oldDamage = lastRoll.finalDamage;

    let bossHp = state.bossHp;
    const playerGhost = player.ghosts[player.activeIdx];
    let playerGhostHp = playerGhost.hp;

    // Revert old damage
    if (oldWinner === 'player' && oldDamage > 0) {
      bossHp = Math.min(state.bossMaxHp, bossHp + oldDamage);
    } else if (oldWinner === 'boss' && oldDamage > 0) {
      playerGhostHp = Math.min(playerGhost.maxHp, playerGhostHp + oldDamage);
      // Un-KO if it was KO'd
      if (playerGhost.ko) {
        updates[`players/${pIdx}/ghosts/${player.activeIdx}/ko`] = false;
      }
    }

    // Apply new damage
    let bossDefeated = false;
    let playerGhostKo = false;

    if (newWinner === 'player' && newFinalDamage > 0) {
      bossHp = Math.max(0, bossHp - newFinalDamage);
      logLines.push(`Lucky Stone! Rerolled ${oldValue} → ${dice[dieIndex]}. Now deals ${newFinalDamage} to boss! (${bossHp}/${state.bossMaxHp})`);
      if (bossHp <= 0) bossDefeated = true;
    } else if (newWinner === 'boss' && newFinalDamage > 0) {
      playerGhostHp = Math.max(0, playerGhostHp - newFinalDamage);
      logLines.push(`Lucky Stone! Rerolled ${oldValue} → ${dice[dieIndex]}. Boss deals ${newFinalDamage} to ${playerGhost.name}. (${playerGhostHp}/${playerGhost.maxHp})`);
      if (playerGhostHp <= 0) playerGhostKo = true;
    } else {
      logLines.push(`Lucky Stone! Rerolled ${oldValue} → ${dice[dieIndex]}. Result: TIE!`);
    }

    updates['bossHp'] = bossHp;
    updates[`players/${pIdx}/ghosts/${player.activeIdx}/hp`] = playerGhostHp;
    updates[`players/${pIdx}/ghosts/${player.activeIdx}/ko`] = playerGhostKo;
    updates[`players/${pIdx}/resources/luckyStone`] = player.resources.luckyStone - 1;

    // Update damage tracking
    if (oldWinner === 'player' && oldDamage > 0) {
      updates[`players/${pIdx}/damageDealt`] = Math.max(0, (player.damageDealt || 0) - oldDamage);
    }
    if (newWinner === 'player' && newFinalDamage > 0) {
      updates[`players/${pIdx}/damageDealt`] = ((updates[`players/${pIdx}/damageDealt`] !== undefined)
        ? updates[`players/${pIdx}/damageDealt`]
        : (player.damageDealt || 0)) + newFinalDamage;
    }

    // Update lastRoll
    updates['lastRoll'] = {
      ...lastRoll,
      playerDice: newDice,
      playerResult: newPlayerResult,
      winner: newWinner,
      finalDamage: newFinalDamage,
      luckyStoneUsed: true
    };

    // Now resolve phase transitions exactly like doPlayerRoll
    if (bossDefeated) {
      updates['phase'] = 'game-over';
      logLines.push('VICTORY! The raid boss falls!');
    } else if (playerGhostKo) {
      const aliveGhosts = player.ghosts.filter((g, i) => i !== player.activeIdx && !g.ko);
      if (aliveGhosts.length > 0) {
        updates['phase'] = 'ko-swap';
      } else {
        updates[`players/${pIdx}/eliminated`] = true;
        const allElim = _checkAllEliminated(state.players, pIdx);
        if (allElim) {
          updates['phase'] = 'game-over';
          logLines.push('All players eliminated. The boss wins...');
        } else {
          const nextTurnIdx = getNextTurn(state);
          if (nextTurnIdx === -1) {
            updates['phase'] = 'game-over';
          } else {
            updates['phase'] = 'pre-roll';
            updates['turnIndex'] = nextTurnIdx;
            updates['turnPlayerIdx'] = state.turnOrder[nextTurnIdx];
          }
        }
      }
    } else {
      // Advance turn (same logic as doPlayerRoll)
      const nextTurnIdx = getNextTurn(state);
      if (nextTurnIdx === -1) {
        updates['phase'] = 'game-over';
      } else {
        updates['phase'] = 'pre-roll';
        updates['turnIndex'] = nextTurnIdx;
        updates['turnPlayerIdx'] = state.turnOrder[nextTurnIdx];
        const nextPlayerIdx = state.turnOrder[nextTurnIdx];
        if (nextPlayerIdx <= pIdx) {
          updates['round'] = (state.round || 1) + 1;
          updates['enrageLevel'] = (state.enrageLevel || 0) + 1;
        }
      }
    }

    const newLog = [...(state.log || []), ...logLines].slice(-50);
    updates['log'] = newLog;

    await _battleRef(instanceId).update(updates);

    if (updates['phase'] === 'game-over') {
      setTimeout(() => endInlineBattle(instanceId, bossDefeated), 500);
    }

    return { newDice, newPlayerResult, newWinner, newFinalDamage, bossDefeated, playerGhostKo };
  }

  // ─── KO SWAP ────────────────────────────────────────────────────

  /**
   * After a player's active ghost is KO'd, they pick a sideline replacement.
   */
  async function doKoSwap(instanceId, playerIdx, ghostIdx) {
    const state = await _getState(instanceId);
    if (!state || state.phase !== 'ko-swap') return { error: 'Not in ko-swap phase' };

    const uid = _uid();
    const player = state.players?.[playerIdx];
    if (!player || player.uid !== uid) return { error: 'Not your ghost' };

    const ghost = player.ghosts[ghostIdx];
    if (!ghost || ghost.ko) return { error: 'Cannot swap to a KO\'d ghost' };
    if (ghostIdx === player.activeIdx) return { error: 'Already active' };

    const updates = {};
    updates[`players/${playerIdx}/activeIdx`] = ghostIdx;

    const logEntry = `${player.displayName} sends in ${ghost.name}! (${ghost.hp}/${ghost.maxHp} HP)`;

    // Advance turn after swap
    const pIdx = state.turnPlayerIdx;
    const nextTurnIdx = getNextTurn(state);

    if (nextTurnIdx === -1) {
      updates['phase'] = 'game-over';
    } else {
      updates['phase'] = 'pre-roll';
      updates['turnIndex'] = nextTurnIdx;
      updates['turnPlayerIdx'] = state.turnOrder[nextTurnIdx];

      const nextPlayerIdx = state.turnOrder[nextTurnIdx];
      if (nextPlayerIdx <= pIdx) {
        updates['round'] = (state.round || 1) + 1;
        updates['enrageLevel'] = (state.enrageLevel || 0) + 1;
      }
    }

    const newLog = [...(state.log || []), logEntry].slice(-50);
    updates['log'] = newLog;

    await _battleRef(instanceId).update(updates);

    if (updates['phase'] === 'game-over') {
      setTimeout(() => endInlineBattle(instanceId, false), 500);
    }

    return { success: true, newActiveIdx: ghostIdx };
  }

  // ─── END BATTLE ─────────────────────────────────────────────────

  /**
   * Finalize the inline battle. Updates the raid instance with results
   * and distributes rewards if the boss was defeated.
   */
  async function endInlineBattle(instanceId, bossDefeated) {
    const state = await _getState(instanceId);
    if (!state) return;

    // Calculate per-player damage totals
    const playerDamage = {};
    if (state.players) {
      for (const [slot, p] of Object.entries(state.players)) {
        playerDamage[slot] = {
          uid: p.uid,
          displayName: p.displayName,
          damageDealt: p.damageDealt || 0,
          eliminated: p.eliminated || false
        };
      }
    }

    // Update the parent raid instance
    const instanceRef = _db().ref(`mp/raids/instances/${instanceId}`);
    const instanceUpdates = {
      bossCurrentHp: state.bossHp,
      status: 'complete',
      completedAt: firebase.database.ServerValue.TIMESTAMP,
      fightPhase: 'done'
    };

    // Write per-player damage back to the instance players
    if (state.players) {
      for (const [slot, p] of Object.entries(state.players)) {
        instanceUpdates[`players/${slot}/damageDealt`] = p.damageDealt || 0;
        instanceUpdates[`players/${slot}/status`] = p.eliminated ? 'eliminated' : 'done';
      }
    }

    if (bossDefeated) {
      const uid = _uid();
      instanceUpdates['bossDefeatedBy'] = uid;
    }

    await instanceRef.update(instanceUpdates);

    // Distribute rewards via raid-engine
    if (typeof distributeRaidRewards === 'function') {
      const killingBlowUid = bossDefeated ? _uid() : null;
      await distributeRaidRewards(instanceId, bossDefeated, killingBlowUid);
    }

    // Clean up listener
    stopListening();
  }

  // ─── LISTENER ───────────────────────────────────────────────────

  /**
   * Subscribe to real-time updates on the inline battle state.
   * All connected players call this — it's how spectators stay in sync.
   *
   * @param {string}   instanceId — raid instance key
   * @param {Function} callback   — called with (state) on every change; nullable
   */
  function listenToInlineBattle(instanceId, callback) {
    // Detach any previous listener
    stopListening();

    const ref = _battleRef(instanceId);
    _listenerRef = ref;
    _listener = ref.on('value', (snap) => {
      const state = snap.val();
      if (state && typeof callback === 'function') {
        callback(state);
      }
      // Also fire a custom DOM event so the UI layer can hook in
      // without needing a direct reference to this module
      if (state) {
        window.dispatchEvent(new CustomEvent('inline-battle-update', { detail: { instanceId, state } }));
      }
    });
  }

  /**
   * Detach the Firebase listener.
   */
  function stopListening() {
    if (_listenerRef && _listener) {
      _listenerRef.off('value', _listener);
    }
    _listener = null;
    _listenerRef = null;
  }

  // ─── PUBLIC API ─────────────────────────────────────────────────

  return {
    // Init
    initInlineBattle,

    // Dice
    rollDice,
    classify,
    determineWinner,

    // Turn actions
    commitResource,
    useHealingSeed,
    doPlayerRoll,
    useLuckyStone,
    doKoSwap,

    // End
    endInlineBattle,

    // Listener
    listenToInlineBattle,
    stopListening,

    // Utility
    getNextTurn
  };
})();

// ─── GLOBAL SHIMS ─────────────────────────────────────────────
// Expose action functions globally so raid-battle-ui.js onclick handlers work
if (typeof INLINE_BATTLE !== 'undefined') {
  window.doPlayerRoll = INLINE_BATTLE.doPlayerRoll;
  window.commitResource = INLINE_BATTLE.commitResource;
  window.useHealingSeed = INLINE_BATTLE.useHealingSeed;
  window.useLuckyStone = INLINE_BATTLE.useLuckyStone;
  window.doKoSwap = INLINE_BATTLE.doKoSwap;
}
