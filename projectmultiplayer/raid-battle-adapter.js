// =================================================================
// RAID BATTLE ADAPTER — Clean adapter between RaidState and BattleEngine
// Replaces: raid-battle-bridge.js (930 lines of monkey-patches)
// Uses: hook system (onGameOver, onResetRollButtons, onPostResolve)
// Depends on: raid-state-machine.js, raid-sync.js, battle-engine.js, raid-engine.js
// =================================================================

const RaidBattleAdapter = {
  // Boss ghost lookup (scoped, not global GHOSTS mutation)
  _bossGhostLookup: {},
  _origGetGhost: null, // saved original for cleanup

  // ── Initialize: register hooks once at load time ──────────────
  init() {
    // ── Turn rotation hook ────────────────────────────────────────
    // Replaces the 125-line resetRollButtons monkey-patch in the old bridge
    BattleEngine.onResetRollButtons(() => {
      if (!RaidState.isActive() || !RaidState.amFighter()) return false;

      const B = BattleEngine.getState();
      if (!B || B.round <= 1) return false; // first round — let default run
      if (B.phase === 'over') return false;  // onGameOver already owns the endgame

      // Turn handoff — boss KO is handled by handleKOs → showGameOver
      this._handleTurnHandoff();
      return true;
    });

    // ── Game over hook ────────────────────────────────────────────
    // Replaces the 130-line showGameOver monkey-patch in the old bridge
    BattleEngine.onGameOver((winner) => {
      if (!RaidState.isActive()) return false; // not in raid — let default UI run
      this._handleRaidGameOver(winner);
      return true; // consumed — skip default showGameOver UI (prevents 5s auto-redirect)
    });

    // ── Post-resolve hook (event-driven snapshot) ─────────────────
    // Replaces the 500ms setInterval snapshot polling
    BattleEngine.onPostResolve((B) => {
      if (!RaidState.amFighter() || !B) return;
      RaidSync.writeBattleSnapshot(B);
    });

    // ── React to state machine transitions ────────────────────────
    RaidState.on('transition', ({ from, to, data }) => {
      if (to === 'fighting' && RaidState.isMyTurn()) {
        this._startMyFight();
      }
      if (to === 'spectating') {
        this._fightStarted = false; // reset so next turn can start
        // Record spectating in transcript
        if (typeof RaidTranscript !== 'undefined' && RaidTranscript._active) {
          const currentPlayer = RaidState.players[RaidState.currentFighterIdx];
          RaidTranscript.recordSpectating(
            currentPlayer?.displayName || 'Unknown',
            RaidState.currentFighterIdx,
            RaidState.bossCurrentHp,
            RaidState.bossMaxHp
          );
        }
        this._startSpectating();
      }
      if (to === 'complete') {
        this._showResults();
      }
      if (to === 'idle') {
        this._cleanup();
      }
    });

    // ── React to Firebase updates ─────────────────────────────────
    RaidState.on('firebase-update', ({ instanceId, data }) => {
      this._handleFirebaseUpdate(instanceId, data);
    });

    // ── React to raid assignment ──────────────────────────────────
    RaidState.on('raid-assigned', ({ instanceId, data }) => {
      this._enterRaid(instanceId, data);
    });

    // ── React to raid cleared ─────────────────────────────────────
    RaidState.on('raid-cleared', () => {
      // Don't clean up if results are showing — distributeRaidRewards
      // clears activeRaid which fires this, but the result screen must stay.
      if (RaidState.phase === 'complete') return;
      if (RaidState.isActive()) {
        this._cleanup();
        RaidState.reset();
      }
    });

    console.log('[RaidAdapter] Initialized — hooks registered');
  },

  // ══════════════════════════════════════════════════════════════════
  // RAID ENTRY
  // ══════════════════════════════════════════════════════════════════

  _entering: false, // hard lock to prevent any re-entry

  _enterRaid(instanceId, data) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // Hard lock — prevents recursion from Firebase listener firing during connect
    if (this._entering) return;
    // Guard: don't re-enter if already in a raid
    if (RaidState.isActive() && RaidState.instanceId === instanceId) return;

    this._entering = true;

    // Load state from Firebase
    RaidState.loadFromFirebase(instanceId, data, user.uid);

    // Transition out of idle BEFORE connecting Firebase listener.
    // If we connect first, the listener fires immediately, which calls
    // _handleFirebaseUpdate, which sees phase==='idle' and calls _enterRaid
    // again → infinite recursion.
    RaidState.transition('lobby');

    // Now safe to connect — phase is no longer 'idle'
    // NOTE: connect() fires the Firebase listener SYNCHRONOUSLY. If the instance
    // status is already 'active', _handleFirebaseUpdate will transition to
    // 'fighting' and call _startMyFight BEFORE we reach the switch below.
    // We must check the CURRENT phase after connect, not the original data.
    RaidSync.connect(instanceId);

    // If the Firebase listener already advanced us to fighting/spectating,
    // don't show the waiting room or try to transition again.
    if (RaidState.phase === 'fighting' || RaidState.phase === 'spectating') {
      // Battle already started via Firebase handler — just show the raid screen
      if (typeof showRaidScreen === 'function') showRaidScreen(instanceId);
      this._entering = false;
      return;
    }

    // Still in lobby/countdown — handle based on Firebase data status
    switch (data.status) {
      case 'countdown':
        if (typeof showRaidWaitingRoom === 'function') {
          showRaidWaitingRoom(instanceId, data);
        }
        // Auto-start fallback (first player starts after 20s)
        if (RaidState.mySlot === 0) {
          setTimeout(async () => {
            if (RaidState.phase !== 'lobby') return;
            RaidSync.startRaid();
          }, 20000);
        }
        break;

      case 'active':
        RaidState.transition('countdown');
        if (RaidState.mySlot === RaidState.currentFighterIdx) {
          RaidState.transition('fighting');
        } else {
          RaidState.transition('spectating');
        }
        break;

      case 'complete':
        RaidState.transition('countdown');
        RaidState.transition('complete');
        break;
    }

    if (typeof showRaidScreen === 'function') showRaidScreen(instanceId);
    this._entering = false;
  },

  // ══════════════════════════════════════════════════════════════════
  // FIREBASE UPDATE HANDLER
  // ══════════════════════════════════════════════════════════════════

  _processingUpdate: false, // lock to prevent re-entrant Firebase processing

  _handleFirebaseUpdate(instanceId, data) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // Prevent re-entrant processing (Firebase listener can fire synchronously
    // during connect() or when we write back to the same instance)
    if (this._processingUpdate) return;
    this._processingUpdate = true;
    try { this.__handleFirebaseUpdateInner(instanceId, data); }
    finally { this._processingUpdate = false; }
  },

  __handleFirebaseUpdateInner(instanceId, data) {

    // Update RaidState from Firebase data
    RaidState.currentFighterIdx = data.currentFighterIdx || 0;
    RaidState.currentFighterUid = data.currentFighterUid || null;
    RaidState.turnCounter = data.turnCounter || 0;
    // Default to bossMaxHp if bossCurrentHp hasn't been written yet (raid just started)
    RaidState.bossCurrentHp = data.bossCurrentHp != null ? data.bossCurrentHp : (RaidState.bossMaxHp || data.bossMaxHp || 15);
    RaidState.enrageLevel = data.enrageLevel || 0;
    RaidState.bossGhostState = data.bossGhostState || null;
    RaidState.playerGhostState = data.playerGhostState || {};

    // Update players
    if (data.players) {
      for (const [slot, p] of Object.entries(data.players)) {
        RaidState.players[parseInt(slot)] = p;
      }
    }

    switch (data.status) {
      case 'countdown':
        if (RaidState.phase === 'idle') {
          this._enterRaid(instanceId, data);
        }
        // Only show waiting room ONCE — _enterRaid already calls it.
        // Calling it on every Firebase update causes an infinite loop:
        // showRaidWaitingRoom → pushRaidChatMessage → Firebase write →
        // listener fires → _handleFirebaseUpdate → showRaidWaitingRoom → ...
        break;

      case 'active':
        if (typeof hideRaidWaitingRoom === 'function') hideRaidWaitingRoom();
        this._handleActiveFight(data);
        break;

      case 'complete':
        if (RaidState.phase !== 'complete') {
          // Need valid transition path
          if (RaidState.phase === 'idle') {
            RaidState.transition('lobby');
            RaidState.transition('countdown');
          }
          if (RaidState.phase === 'lobby') {
            RaidState.transition('countdown');
          }
          if (['countdown', 'fighting', 'spectating', 'turn-handoff'].includes(RaidState.phase)) {
            RaidState.transition('complete');
          }
        }
        break;
    }
  },

  // Handle active fight — decide fighter vs spectator
  _lastProcessedTurn: -1,
  _lastProcessedCounter: -1,

  _handleActiveFight(data) {
    const currentIdx = data.currentFighterIdx || 0;
    const turnCounter = data.turnCounter || 0;

    // Only process each turn once
    if (currentIdx === this._lastProcessedTurn && turnCounter === this._lastProcessedCounter) {
      // Still same turn — just update spectator if watching
      if (RaidState.amSpectator() && data.battleState) {
        this._updateSpectatorView(data.battleState);
      }
      return;
    }
    this._lastProcessedTurn = currentIdx;
    this._lastProcessedCounter = turnCounter;

    // Check slot directly — don't use isMyTurn() which requires phase==='fighting'
    // (we haven't transitioned yet — that's what we're deciding here)
    const isMyTurn = (RaidState.mySlot === currentIdx) &&
      RaidState.players[RaidState.mySlot]?.status !== 'done' &&
      RaidState.players[RaidState.mySlot]?.status !== 'disconnected';

    if (isMyTurn) {
      // Clean up spectator overlay
      if (typeof hideRaidSpectatorOverlay === 'function') hideRaidSpectatorOverlay();
      const gameOverEl = document.getElementById('gameOver');
      if (gameOverEl) { gameOverEl.style.display = 'none'; gameOverEl.innerHTML = ''; }
      BattleEngine.stopBlueAI();

      // Valid transition path to fighting
      if (RaidState.phase === 'spectating') {
        RaidState.transition('fighting');
      } else if (RaidState.phase === 'turn-handoff') {
        RaidState.transition('fighting');
      } else if (['lobby', 'countdown'].includes(RaidState.phase)) {
        if (RaidState.phase === 'lobby') RaidState.transition('countdown');
        RaidState.transition('fighting');
      }
    } else {
      // Valid transition path to spectating
      if (RaidState.phase === 'fighting') {
        RaidState.transition('spectating');
      } else if (RaidState.phase === 'turn-handoff') {
        RaidState.transition('spectating');
      } else if (['lobby', 'countdown'].includes(RaidState.phase)) {
        if (RaidState.phase === 'lobby') RaidState.transition('countdown');
        RaidState.transition('spectating');
      }
      // Don't apply the stale battleState from the previous fighter's turn —
      // _startSpectating() just built the correct team via startBattle().
      // Fresh snapshots from the new fighter will arrive on subsequent Firebase events.
    }
  },

  // ══════════════════════════════════════════════════════════════════
  // FIGHTER: START MY FIGHT
  // ══════════════════════════════════════════════════════════════════

  _fightStarted: false, // prevent double startBattle

  async _startMyFight() {
    if (this._fightStarted) return;
    this._fightStarted = true;

    const { bossConfig, players, currentFighterIdx, bossGhostState, playerGhostState } = RaidState;
    const playerData = players[currentFighterIdx];
    if (!playerData || !bossConfig) { this._fightStarted = false; return; }

    // Preload player's equipped items from Firebase
    let playerInventory = null;
    try {
      const user = firebase.auth().currentUser;
      if (user) {
        const invSnap = await db.ref(`mp/users/${user.uid}/raidRunInventory`).once('value');
        playerInventory = invSnap.val();
      }
    } catch (e) { console.warn('[RaidAdapter] Failed to load inventory:', e); }

    // Start transcript recording
    if (typeof RaidTranscript !== 'undefined') {
      const user = firebase.auth().currentUser;
      if (!RaidTranscript._active) {
        RaidTranscript.start(user?.displayName || 'Player', bossConfig.name, RaidState.raidId);
      }
      RaidTranscript.recordTurnStart(playerData.displayName || 'Player ' + currentFighterIdx, currentFighterIdx);
    }

    // Hide any waiting room/countdown overlays from the entry flow
    if (typeof hideRaidWaitingRoom === 'function') hideRaidWaitingRoom();
    const launchCountdown = document.getElementById('raid-launch-countdown');
    if (launchCountdown) launchCountdown.remove();

    // Clear ALL stale dice from spectating (3D physics dice block click events)
    document.querySelectorAll('.die-physics').forEach(el => el.remove());
    const rdEl = document.getElementById('red-dice');
    const bdEl = document.getElementById('blue-dice');
    if (rdEl) rdEl.innerHTML = '';
    if (bdEl) bdEl.innerHTML = '';

    // Show raid screen and battle view
    const raidScreen = document.getElementById('raid-screen');
    if (raidScreen) raidScreen.style.display = 'block';
    const battleView = document.getElementById('battle-view');
    if (battleView) battleView.style.display = 'block';

    // Build boss team
    const phase = 1; // phases disabled
    const bossTeam = buildBossTeam(bossConfig, phase, RaidState.enrageLevel);
    RaidState.bossTeam = bossTeam;
    const blueGhosts = [bossTeam.boss, ...bossTeam.minions].slice(0, 3);

    // Register boss ghosts in a LOCAL lookup (no GHOSTS array mutation!)
    this._bossGhostLookup = {};
    blueGhosts.forEach(g => { this._bossGhostLookup[g.id] = g; });

    // Set picks on shared app state
    const S = BattleEngine.getS();
    S.redPicks = playerData.team;
    S.bluePicks = blueGhosts.map(g => g.id);

    // Patch getGhost for the duration of the fight (boss ghost IDs need resolving
    // not just during makeTeam, but also during renderBattle and ability callbacks)
    // IMPORTANT: Save original only ONCE — on subsequent turns, window.getGhost is
    // already our patch. Re-saving would create a recursive reference.
    if (!this._origGetGhost) {
      this._origGetGhost = window.getGhost;
    }
    const lookup = this._bossGhostLookup;
    const origFn = this._origGetGhost;
    window.getGhost = (id) => lookup[id] || origFn(id);

    // Suppress entry abilities if resuming a saved turn
    const user = firebase.auth().currentUser;
    const savedState = playerGhostState?.[user?.uid];
    if (savedState) {
      window._raidSkipEntry = true;
    }

    // Skip VS splash in raids
    const vsSplash = document.getElementById('vsSplash');
    if (vsSplash) vsSplash.style.display = 'none';

    // Set MP_MODE so blue AI responds to red's roll
    MP_MODE = true;

    // Hide battle view during startBattle → restore gap to prevent
    // a frame where KO'd ghosts appear alive at full HP
    if (battleView) battleView.style.opacity = '0';

    // Save battle log before startBattle resets it (B.log = [])
    const savedLog = BattleEngine.getState()?.log || [];

    BattleEngine.startBattle();

    // Restore log from previous turns + add turn separator
    const B_new = BattleEngine.getState();
    if (B_new && savedLog.length > 0) {
      const turnNum = (RaidState.turnCounter || 0) + 1;
      B_new.log = [...savedLog, `<span class="log-round">── Turn ${turnNum} ──</span>`, ...B_new.log];
    }

    // Fix: if a player ghost shares an ID with a boss ghost, startBattle gave
    // it boss stats (higher HP, boss art, etc.). Restore regular data for red team.
    const B_post = BattleEngine.getState();
    if (B_post && B_post.red) {
      B_post.red.ghosts.forEach(g => {
        if (lookup[g.id]) {
          const regular = origFn(g.id);
          if (regular) {
            g.maxHp = regular.maxHp;
            g.hp = regular.maxHp; // full HP
            g.rarity = regular.rarity;
            g.art = regular.art;
            g.ability = regular.ability;
            g.abilityDesc = regular.abilityDesc;
          }
        }
      });
    }

    // Keep patched getGhost — renderBattle and entry abilities need it
    // throughout the fight. Restore only on cleanup.

    // Keep splash hidden for the entire raid — no restore needed

    // Clear skip-entry flag after entries have been suppressed
    if (window._raidSkipEntry) {
      setTimeout(() => { window._raidSkipEntry = false; }, 8000);
    }

    const B = BattleEngine.getState();
    if (B) {
      B.duelPhaseMode = false; // boss fights skip duel phase

      // Restore boss ghost state from previous player's turn
      if (bossGhostState && bossGhostState.ghosts && B.blue) {
        bossGhostState.ghosts.forEach((gs, i) => {
          if (B.blue.ghosts[i]) {
            B.blue.ghosts[i].hp = gs.hp;
            B.blue.ghosts[i].ko = !!gs.ko;
            if (gs.ko) B.blue.ghosts[i].hp = 0;
            if (gs.id != null) {
              B.blue.ghosts[i].id = gs.id;
              B.blue.ghosts[i].name = gs.name;
              B.blue.ghosts[i].art = gs.art;
              B.blue.ghosts[i].maxHp = gs.maxHp;
              B.blue.ghosts[i].ability = gs.ability;
              B.blue.ghosts[i].abilityDesc = gs.abilityDesc;
              B.blue.ghosts[i].rarity = gs.rarity;
            }
          }
        });
        if (bossGhostState.activeIdx != null) {
          B.blue.activeIdx = bossGhostState.activeIdx;
        }
      }

      // Restore player ghost state (HP, resources, transforms)
      if (savedState && savedState.ghosts) {
        savedState.ghosts.forEach((gs, i) => {
          if (B.red.ghosts[i]) {
            B.red.ghosts[i].hp = gs.hp;
            B.red.ghosts[i].ko = !!gs.ko;
            if (gs.ko) B.red.ghosts[i].hp = 0;
            if (gs.id != null) {
              B.red.ghosts[i].id = gs.id;
              B.red.ghosts[i].name = gs.name;
              B.red.ghosts[i].art = gs.art;
              B.red.ghosts[i].maxHp = gs.maxHp;
              B.red.ghosts[i].ability = gs.ability;
              B.red.ghosts[i].abilityDesc = gs.abilityDesc;
              B.red.ghosts[i].rarity = gs.rarity;
            }
            // Restore original* fields for reverse-transform
            if (gs.originalId != null) {
              B.red.ghosts[i].originalId = gs.originalId;
              B.red.ghosts[i].originalName = gs.originalName;
              B.red.ghosts[i].originalArt = gs.originalArt;
              B.red.ghosts[i].originalMaxHp = gs.originalMaxHp;
              B.red.ghosts[i].originalAbility = gs.originalAbility;
              B.red.ghosts[i].originalAbilityDesc = gs.originalAbilityDesc;
              B.red.ghosts[i].originalRarity = gs.originalRarity;
            }
          }
        });
        if (savedState.activeIdx != null) B.red.activeIdx = savedState.activeIdx;
        if (savedState.resources) B.red.resources = { ...B.red.resources, ...savedState.resources };
        // Restore willowLostLast so Joy of Painting carries across raid turns
        if (savedState.willowLostLast != null) {
          B.willowLostLast = B.willowLostLast || { red: false, blue: false };
          B.willowLostLast.red = !!savedState.willowLostLast;
        }
      }

      // Clear dice from previous player's turn
      B.redDice = null;
      B.blueDice = null;
      const redDiceEl = document.getElementById('red-dice');
      const blueDiceEl = document.getElementById('blue-dice');
      if (redDiceEl) redDiceEl.innerHTML = '';
      if (blueDiceEl) blueDiceEl.innerHTML = '';
      document.querySelectorAll('.die-physics').forEach(el => el.remove());

      // ── APPLY EQUIPPED ITEMS (first turn only) ─────────────────────
      // Only apply once — item resources (healing seed, lucky stone, etc.) should
      // not stack every turn. Blade forges and mask flags are also one-time.
      const isFirstPlayerTurn = !this._itemsApplied;
      if (isFirstPlayerTurn && playerInventory && typeof applyRaidLoot === 'function') {
        this._itemsApplied = true;
        applyRaidLoot(B, 'red', playerInventory);

        // Log applied items in transcript
        if (typeof RaidTranscript !== 'undefined' && RaidTranscript._active) {
          const equipped = playerInventory.equipped || {};
          const slots = ['head', 'weapon', 'accessory'];
          slots.forEach(slot => {
            const itemKey = equipped[slot];
            if (itemKey && RAID_ITEMS[itemKey]) {
              RaidTranscript.add('ITEM', `Equipped [${slot}]: ${RAID_ITEMS[itemKey].name} — ${RAID_ITEMS[itemKey].desc}`);
            }
          });
          // Log resulting resources after item application
          const res = B.red.resources || {};
          const resKeys = ['moonstone', 'ice', 'fire', 'surge', 'healingSeed', 'luckyStone', 'firefly'];
          const resStr = resKeys.filter(k => res[k]).map(k => `${k}:${res[k]}`).join(', ');
          if (resStr) RaidTranscript.add('ITEM', `Starting resources after items: ${resStr}`);
        }
      }

      BattleEngine.renderBattle();

      // Restore battle view now that state is correct (no ghost flash)
      if (battleView) battleView.style.opacity = '1';
    }

    // Hide blue roll button (boss auto-rolls via AI)
    const blueBtn = document.getElementById('rollBlueBtn');
    if (blueBtn) blueBtn.style.display = 'none';

    // Start blue AI + heartbeat (fighter only)
    BattleEngine.startBlueAI();
    RaidSync.startHeartbeat(RaidState.mySlot);

    // Update player status
    RaidSync.setPlayerStatus(RaidState.mySlot, 'fighting');

    // Ensure red roll button is visible and unlocked
    // The 'locked' class may persist from a previous turn because the raid hook
    // consumes resetRollButtons (skipping the default classList.remove('locked')).
    setTimeout(() => {
      if (!RaidState.amFighter()) return;
      const redBtn = document.getElementById('rollRedBtn');
      const B2 = BattleEngine.getState();
      if (redBtn && B2 && B2.phase === 'ready') {
        redBtn.style.display = '';
        redBtn.disabled = false;
        redBtn.classList.remove('locked');
        redBtn.textContent = 'ROLL';
      }
    }, 300);

    // Watchdog: if game gets stuck (no phase change for 20s while fighting),
    // log diagnostic info and try to recover
    this._startWatchdog();

    // Render boss HP pool bar
    this._ensureBossHpPoolBar();
    renderBossHpPool(RaidState.bossCurrentHp, RaidState.bossMaxHp);

    // Show boss intro on first turn only
    const isFirstTurn = (RaidState.turnCounter || 0) === 0;
    if (isFirstTurn && typeof showBossIntro === 'function') {
      showBossIntro(bossConfig, phase, () => {});
    }
  },

  // ══════════════════════════════════════════════════════════════════
  // SPECTATOR
  // ══════════════════════════════════════════════════════════════════

  _startSpectating() {
    // Clear stale dice from previous fight/turn
    const redDiceEl = document.getElementById('red-dice');
    const blueDiceEl = document.getElementById('blue-dice');
    if (redDiceEl) redDiceEl.innerHTML = '';
    if (blueDiceEl) blueDiceEl.innerHTML = '';
    document.querySelectorAll('.die-physics').forEach(el => el.remove());

    const data = RaidState;
    const currentIdx = data.currentFighterIdx;
    const currentPlayer = data.players[currentIdx];
    if (!currentPlayer || !currentPlayer.team) return;

    const bossConfig = data.bossConfig;
    if (!bossConfig) return;

    // Show raid screen, hide battle view during setup (prevent boss ghost flash)
    const raidScreen = document.getElementById('raid-screen');
    if (raidScreen) raidScreen.style.display = 'block';
    const specBattleView = document.getElementById('battle-view');
    if (specBattleView) specBattleView.style.opacity = '0';

    // Build boss team for arena visuals
    const bossTeam = buildBossTeam(bossConfig, 1, data.enrageLevel || 0);
    const blueGhosts = [bossTeam.boss, ...bossTeam.minions].slice(0, 3);

    // Suppress entry abilities for spectator
    window._raidSkipEntry = true;

    // Register boss ghosts in lookup (for getGhost during startBattle)
    this._bossGhostLookup = {};
    blueGhosts.forEach(g => { this._bossGhostLookup[g.id] = g; });

    const S = BattleEngine.getS();
    S.redPicks = currentPlayer.team;
    S.bluePicks = blueGhosts.map(g => g.id);

    // Scoped getGhost patch
    const _origGetGhost = window.getGhost;
    const lookup = this._bossGhostLookup;
    window.getGhost = (id) => lookup[id] || _origGetGhost(id);

    MP_MODE = true;

    // Save battle log before startBattle resets it
    const savedLog = BattleEngine.getState()?.log || [];

    BattleEngine.startBattle();

    // Restore log from previous turns
    const B_spec = BattleEngine.getState();
    if (B_spec && savedLog.length > 0) {
      B_spec.log = [...savedLog, ...B_spec.log];
    }

    window.getGhost = _origGetGhost;

    // SPECTATOR LOCKDOWN: prevent ALL game logic from running.
    // startBattle created a full B state — neutralize it so no modals,
    // abilities, or roll handlers can trigger on the spectator's client.
    if (B_spec) {
      B_spec.phase = 'spectating'; // no game logic checks this phase
      B_spec.duelPhaseMode = false;
    }
    BattleEngine.stopBlueAI();

    // Clear ALL overlays that startBattle may have triggered
    if (typeof clearAllOverlays === 'function') clearAllOverlays();

    // Clear skip-entry flag
    window._raidSkipEntry = false;

    // Hide ALL interactive elements
    const rollBtn = document.getElementById('rollRedBtn');
    if (rollBtn) rollBtn.style.display = 'none';
    const blueBtn = document.getElementById('rollBlueBtn');
    if (blueBtn) blueBtn.style.display = 'none';
    // Clear ability buttons explicitly
    ['red', 'blue'].forEach(t => {
      const el = document.getElementById(`${t}-ability-buttons`);
      if (el) el.innerHTML = '';
    });

    // Show watching banner
    const narrator = document.getElementById('narrator');
    if (narrator) {
      const name = currentPlayer.displayName || 'Player ' + (currentIdx + 1);
      narrator.innerHTML = `Watching <b class="red-text">${name}</b> fight...`;
    }

    // Boss HP pool bar
    this._ensureBossHpPoolBar();
    renderBossHpPool(data.bossCurrentHp || 0, data.bossMaxHp || 1);

    // Restore battle view now that spectator state is set up (no ghost flash)
    if (specBattleView) specBattleView.style.opacity = '1';
  },

  // ── Spectator view update (from Firebase snapshot) ──────────────
  _updateSpectatorView(snapshot) {
    if (!RaidState.amSpectator()) return;
    const B = BattleEngine.getState();
    if (!B || !B.red || !B.blue) return;
    if (!snapshot) return;

    // Sync ALL ghost HP, KO status, and activeIdx
    if (snapshot.allPlayerGhosts && B.red) {
      snapshot.allPlayerGhosts.forEach((sg, i) => {
        if (B.red.ghosts[i]) {
          B.red.ghosts[i].hp = sg.hp;
          B.red.ghosts[i].maxHp = sg.maxHp;
          B.red.ghosts[i].ko = !!sg.ko;
          if (sg.id) B.red.ghosts[i].id = sg.id;
          if (sg.name) B.red.ghosts[i].name = sg.name;
          if (sg.art) B.red.ghosts[i].art = sg.art;
          if (sg.ability) B.red.ghosts[i].ability = sg.ability;
          if (sg.abilityDesc) B.red.ghosts[i].abilityDesc = sg.abilityDesc;
          if (sg.rarity) B.red.ghosts[i].rarity = sg.rarity;
        }
      });
      if (snapshot.playerActiveIdx != null) B.red.activeIdx = snapshot.playerActiveIdx;
    } else if (snapshot.playerGhost && B.red) {
      const rf = BattleEngine.active(B.red);
      if (rf) {
        rf.hp = snapshot.playerGhost.hp;
        rf.maxHp = snapshot.playerGhost.maxHp;
        if (snapshot.playerGhost.ko) rf.ko = true;
      }
    }

    if (snapshot.allBossGhosts && B.blue) {
      snapshot.allBossGhosts.forEach((sg, i) => {
        if (B.blue.ghosts[i]) {
          B.blue.ghosts[i].hp = sg.hp;
          B.blue.ghosts[i].maxHp = sg.maxHp;
          B.blue.ghosts[i].ko = !!sg.ko;
          if (sg.id) B.blue.ghosts[i].id = sg.id;
          if (sg.name) B.blue.ghosts[i].name = sg.name;
          if (sg.art) B.blue.ghosts[i].art = sg.art;
          if (sg.ability) B.blue.ghosts[i].ability = sg.ability;
          if (sg.abilityDesc) B.blue.ghosts[i].abilityDesc = sg.abilityDesc;
          if (sg.rarity) B.blue.ghosts[i].rarity = sg.rarity;
        }
      });
      if (snapshot.bossActiveIdx != null) B.blue.activeIdx = snapshot.bossActiveIdx;
    } else if (snapshot.bossGhost && B.blue) {
      const bf = BattleEngine.active(B.blue);
      if (bf) {
        bf.hp = snapshot.bossGhost.hp;
        bf.maxHp = snapshot.bossGhost.maxHp;
        if (snapshot.bossGhost.ko) bf.ko = true;
      }
    }

    // Update round
    if (snapshot.round) B.round = snapshot.round;

    // Show dice from the last roll
    if (snapshot.lastRoll) {
      const redDiceEl = document.getElementById('red-dice');
      const blueDiceEl = document.getElementById('blue-dice');
      if (redDiceEl && snapshot.lastRoll.player) {
        redDiceEl.innerHTML = snapshot.lastRoll.player.map(v =>
          `<div class="die die-red">${v}</div>`
        ).join('');
      }
      if (blueDiceEl && snapshot.lastRoll.boss) {
        blueDiceEl.innerHTML = snapshot.lastRoll.boss.map(v =>
          `<div class="die die-blue">${v}</div>`
        ).join('');
      }
    }

    // Update boss HP pool bar
    if (snapshot.bossPoolHp != null) {
      renderBossHpPool(snapshot.bossPoolHp, snapshot.bossMaxHp || 1);
    }

    // Sync resources
    if (snapshot.playerResources && B.red) {
      B.red.resources = { ...snapshot.playerResources };
    }

    BattleEngine.renderBattle();
  },

  // ══════════════════════════════════════════════════════════════════
  // TURN HANDOFF
  // ══════════════════════════════════════════════════════════════════

  _handleTurnHandoff() {
    BattleEngine.stopBlueAI();
    RaidSync.stopHeartbeat();

    // Record turn end in transcript
    if (typeof RaidTranscript !== 'undefined' && RaidTranscript._active) {
      const user = firebase.auth().currentUser;
      RaidTranscript.recordTurnEnd(user?.displayName || 'Player');
    }

    // Reset fight lock so next turn can start _startMyFight again
    this._fightStarted = false;

    // Force one last snapshot write
    RaidSync._lastSnapshotHash = '';
    const B = BattleEngine.getState();
    if (B) RaidSync.writeBattleSnapshot(B);

    // Hide roll button, clear all dice (including 3D physics dice)
    const rollBtn = document.getElementById('rollRedBtn');
    if (rollBtn) rollBtn.style.display = 'none';
    const redDice = document.getElementById('red-dice');
    const blueDice = document.getElementById('blue-dice');
    if (redDice) redDice.innerHTML = '';
    if (blueDice) blueDice.innerHTML = '';
    document.querySelectorAll('.die-physics').forEach(el => el.remove());
    const narrator = document.getElementById('narrator');
    if (narrator) narrator.innerHTML = 'Passing to the next raider...';

    RaidState.transition('turn-handoff');

    // Advance to next fighter — skip dead/done players
    const currentIdx = RaidState.mySlot;
    const playerCount = RaidState.players.length;
    let nextIdx = (currentIdx + 1) % playerCount;
    while (nextIdx !== currentIdx &&
           (RaidState.players[nextIdx]?.status === 'done' ||
            RaidState.players[nextIdx]?.status === 'disconnected')) {
      nextIdx = (nextIdx + 1) % playerCount;
    }

    setTimeout(() => {
      RaidSync.advanceTurn(B, currentIdx, nextIdx, RaidState.players.length);
    }, 1500);
  },

  // ══════════════════════════════════════════════════════════════════
  // GAME OVER
  // ══════════════════════════════════════════════════════════════════

  _handleRaidGameOver(winner) {
    BattleEngine.stopBlueAI();
    RaidSync.stopHeartbeat();

    // Fade music — the default showGameOver was consumed so it never ran fadeOutMusic
    if (typeof fadeOutMusic === 'function') fadeOutMusic();

    // Boss KO = pool is 0 (abilities like Meltdown can cause drift, so force sync)
    if (winner === 'red') RaidState.bossCurrentHp = 0;

    const B = BattleEngine.getState();
    const currentIdx = RaidState.mySlot;
    const playerCount = RaidState.players.length;

    // Hide battle engine's game-over overlay — raid adapter owns all endgame UI
    const gameOverEl = document.getElementById('gameOver');
    if (gameOverEl) { gameOverEl.style.display = 'none'; gameOverEl.innerHTML = ''; }

    // ── CASE 1: Player eliminated (winner='blue') ────────────────
    // This player's team is wiped. Check if other players can continue.
    if (winner === 'blue') {
      const otherPlayersAlive = RaidState.players.some((p, i) =>
        i !== currentIdx && p && p.status !== 'done' && p.status !== 'disconnected'
      );

      if (otherPlayersAlive) {
        // Raid continues — mark this player as done, hand off
        if (typeof RaidTranscript !== 'undefined' && RaidTranscript._active) {
          RaidTranscript.recordGameOver(winner, RaidState.bossCurrentHp, RaidState.bossMaxHp);
        }
        setTimeout(() => {
          RaidSync.writeGameOver(B, winner, currentIdx, playerCount);
        }, 1500);

        const narrator = document.getElementById('narrator');
        if (narrator) narrator.innerHTML = 'Your team is out! Watching the raid continue...';
        this._fightStarted = false;
        // Firebase update will trigger _startSpectating via _handleActiveFight
        return;
      }
      // No other players alive — fall through to raid-over
    }

    // ── CASE 2: Raid truly over ──────────────────────────────────
    // Either: winner='red' (pool=0, victory) or winner='blue' (all players out, defeat)
    if (typeof RaidTranscript !== 'undefined' && RaidTranscript._active) {
      RaidTranscript.recordGameOver(winner, RaidState.bossCurrentHp, RaidState.bossMaxHp);
      RaidTranscript.stop();
      RaidTranscript.download();
    }

    // Write game-over to Firebase (includes status=complete atomically)
    setTimeout(() => {
      RaidSync.writeGameOver(B, winner, currentIdx, playerCount);
    }, 1500);

    // Show result screen DIRECTLY — don't wait for Firebase round-trip
    this._showRaidEndScreen(winner);
  },

  // ══════════════════════════════════════════════════════════════════
  // RESULTS — bulletproof inline-styled screen, no CSS class dependencies
  // ══════════════════════════════════════════════════════════════════

  // Called by Firebase listener when status=complete (for spectators)
  _showResults() {
    // If the end screen is already showing, don't duplicate
    if (document.getElementById('raid-end-screen')) return;
    // Determine winner from boss HP
    const winner = (RaidState.bossCurrentHp <= 0) ? 'red' : 'blue';
    this._showRaidEndScreen(winner);
  },

  // Called DIRECTLY from _handleRaidGameOver (for fighter) and _showResults (for spectator)
  _showRaidEndScreen(winner) {
    // Prevent duplicates
    if (document.getElementById('raid-end-screen')) return;

    // Stop everything
    BattleEngine.stopBlueAI();
    RaidSync.stopHeartbeat();
    if (typeof fadeOutMusic === 'function') fadeOutMusic();

    const victory = (winner === 'red');
    const bossName = RaidState.bossConfig?.name || 'The Boss';
    const players = RaidState.players || [];

    // Build player rows
    let playerRows = '';
    players.forEach((p, i) => {
      if (!p) return;
      const dmg = p.damageDealt || 0;
      const lost = p.ghostsLost || 0;
      playerRows += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:rgba(255,255,255,0.04);border-radius:8px;margin:4px 0;">
        <span style="font-weight:700;color:#e8e2f0;">${p.displayName || 'Player ' + i}</span>
        <span style="color:#a89ec4;font-size:0.85rem;">${dmg} dmg &bull; ${3 - lost}/3 survived</span>
      </div>`;
    });

    // Create the overlay — 100% inline styles, appended to document.body
    const el = document.createElement('div');
    el.id = 'raid-end-screen';
    el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:linear-gradient(180deg,#0a0612,#14101e,#0e0820);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:sans-serif;';
    el.innerHTML = `
      <h1 style="font-family:Creepster,cursive;font-size:3rem;letter-spacing:4px;margin:0;color:${victory ? '#f0c560' : '#e94560'};">
        ${victory ? 'RAID COMPLETE!' : 'RAID FAILED'}
      </h1>
      <div style="font-size:1.1rem;color:#a89ec4;margin-bottom:8px;">
        ${victory ? bossName + ' has been defeated!' : bossName + ' stands triumphant.'}
      </div>
      <div style="width:300px;max-width:90%;margin:8px 0;">
        ${playerRows || '<div style="color:#6a5d7e;text-align:center;">No player data</div>'}
      </div>
      <button onclick="document.getElementById('raid-end-screen').remove(); if(typeof closeRaidResult==='function') closeRaidResult(); else RaidBattleAdapter._returnToLobby();"
        style="margin-top:16px;padding:14px 40px;font-size:1rem;font-weight:700;font-family:Creepster,cursive;letter-spacing:2px;
        background:linear-gradient(135deg,#9b59b6,#8e44ad);color:#fff;border:1px solid #c084fc;border-radius:10px;
        cursor:pointer;text-transform:uppercase;box-shadow:0 4px 20px rgba(155,89,182,0.4);">
        RETURN TO LOBBY
      </button>
    `;
    document.body.appendChild(el);
    console.log('[Raid] End screen shown:', victory ? 'VICTORY' : 'DEFEAT');
  },

  // ══════════════════════════════════════════════════════════════════
  // CLEANUP
  // ══════════════════════════════════════════════════════════════════

  _cleanup() {
    this._entering = false;
    this._fightStarted = false;
    this._processingUpdate = false;
    this._itemsApplied = false;
    this._stopWatchdog();
    // Restore original getGhost
    if (this._origGetGhost) {
      window.getGhost = this._origGetGhost;
      this._origGetGhost = null;
    }
    // Download transcript on ANY exit
    if (typeof RaidTranscript !== 'undefined' && RaidTranscript._active) {
      RaidTranscript.add('GAME', 'RAID EXITED');
      RaidTranscript.stop();
      RaidTranscript.download();
    }

    BattleEngine.stopBlueAI();
    RaidSync.stopHeartbeat();
    RaidSync.disconnect();

    // Reset process tracking
    this._lastProcessedTurn = -1;
    this._lastProcessedCounter = -1;
    this._bossGhostLookup = {};

    // Remove result overlay if present (preserves arena template)
    const resultOverlay = document.getElementById('raid-result-overlay');
    if (resultOverlay) resultOverlay.remove();

    // Hide raid screen
    const raidScreen = document.getElementById('raid-screen');
    if (raidScreen) raidScreen.style.display = 'none';
    const battleView = document.getElementById('battle-view');
    if (battleView) battleView.style.display = 'none';

    // Remove boss HP pool bar (adapter-created, not part of template)
    const poolBar = document.getElementById('raid-boss-pool');
    if (poolBar) poolBar.remove();

    // Restore blue roll button
    const blueBtn = document.getElementById('rollBlueBtn');
    if (blueBtn) blueBtn.style.display = '';

    // Hide game-over overlay
    const gameOverEl = document.getElementById('gameOver');
    if (gameOverEl) {
      gameOverEl.style.display = 'none';
      gameOverEl.classList.remove('active');
      gameOverEl.innerHTML = '';
    }

    // Clear battle state
    const S = BattleEngine.getS();
    S.redPicks = [];
    S.bluePicks = [];
    BattleEngine.setState(null);

    // Show main content
    if (typeof hideRaidScreen === 'function') {
      hideRaidScreen();
    } else {
      const mc = document.getElementById('main-content');
      if (mc) mc.style.display = '';
    }

    window._raidSkipEntry = false;
    MP_MODE = false;
  },

  _returnToLobby() {
    this._cleanup();
    RaidSync.clearActiveRaid();
    RaidState.reset();
    if (typeof showRaidLobby === 'function') showRaidLobby();
    if (typeof closeRaidResult === 'function') closeRaidResult();
  },

  // ══════════════════════════════════════════════════════════════════
  // WATCHDOG — detects stuck game state and recovers
  // ══════════════════════════════════════════════════════════════════

  _watchdogTimer: null,
  _watchdogLastPhase: '',
  _watchdogLastRound: -1,

  _startWatchdog() {
    this._stopWatchdog();
    this._watchdogTimer = setInterval(() => {
      if (!RaidState.amFighter()) { this._stopWatchdog(); return; }
      const B = BattleEngine.getState();
      if (!B) return;

      // Check if state has changed since last tick
      const key = `${B.phase}:${B.round}`;
      if (key === this._watchdogLastPhase) {
        // Same state for 20 seconds — game might be stuck
        if (B.phase !== 'ready' && B.phase !== 'over') {
          console.warn('[Watchdog] Game appears stuck!', {
            phase: B.phase, round: B.round,
            redDice: B.redDice, blueDice: B.blueDice,
            koSwapQueue: B.koSwapQueue,
            pendingMoonstone: B.pendingMoonstone,
            pendingResolve: !!B.pendingResolve,
            abilityQueueMode: typeof abilityQueueMode !== 'undefined' ? abilityQueueMode : '?'
          });

          // Log to transcript
          if (typeof RaidTranscript !== 'undefined' && RaidTranscript._active) {
            RaidTranscript.add('WATCHDOG', `Game stuck! phase=${B.phase} round=${B.round}`);
          }

          // Attempt recovery: force to ready state
          console.warn('[Watchdog] Attempting recovery — forcing phase to ready');
          B.phase = 'ready';
          if (typeof clearAllOverlays === 'function') clearAllOverlays();
          if (typeof resetRollButtons === 'function') resetRollButtons();
          if (typeof renderBattle === 'function') renderBattle();
        }
      }
      this._watchdogLastPhase = key;
    }, 20000); // check every 20 seconds
  },

  _stopWatchdog() {
    if (this._watchdogTimer) {
      clearInterval(this._watchdogTimer);
      this._watchdogTimer = null;
    }
    this._watchdogLastPhase = '';
  },

  // ══════════════════════════════════════════════════════════════════
  // BOSS HP POOL BAR (extracted from bridge)
  // ══════════════════════════════════════════════════════════════════

  _ensureBossHpPoolBar() {
    if (document.getElementById('raid-boss-pool')) return;

    const raidScreen = document.getElementById('raid-screen');
    const battleView = document.getElementById('battle-view');
    const target = raidScreen || battleView;
    if (!target) return;

    const bar = document.createElement('div');
    bar.className = 'rib-boss-pool';
    bar.id = 'raid-boss-pool';
    bar.innerHTML = `
      <div class="rib-boss-pool-fill" id="raid-boss-fill"
           style="height:100%; border-radius:10px; transition:width 0.6s ease, background 0.4s; width:100%; background:#2ecc71;">
      </div>
      <div class="rib-boss-pool-text" id="raid-boss-text"
           style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
                  font-weight:900; font-size:0.85rem; color:#fff; text-shadow:0 1px 4px rgba(0,0,0,0.6); letter-spacing:1px;">
        BOSS HP
      </div>
    `;
    target.insertBefore(bar, target.firstChild);
  }
};

// ── renderBossHpPool (global, used by adapter and raid-ui) ────────
function renderBossHpPool(bossHp, bossMaxHp) {
  const fill = document.getElementById('raid-boss-fill');
  const text = document.getElementById('raid-boss-text');
  if (!fill || !text) return;

  const hp  = Math.max(0, bossHp);
  const max = Math.max(1, bossMaxHp);
  const pct = (hp / max) * 100;

  fill.style.width = pct + '%';

  if (pct > 75)      fill.style.background = '#2ecc71';
  else if (pct > 50) fill.style.background = '#f1c40f';
  else if (pct > 25) fill.style.background = '#e74c3c';
  else               fill.style.background = '#9b59b6';

  text.textContent = 'BOSS HP: ' + hp + ' / ' + max;
}

// ── Backward-compat aliases (called from index.html) ──────────────
function cleanupRaidBattle() { RaidBattleAdapter._returnToLobby(); }
function cleanupRaid() { RaidBattleAdapter._cleanup(); RaidState.reset(); }
