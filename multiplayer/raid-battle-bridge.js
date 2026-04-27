// =================================================================
// RAID BATTLE BRIDGE
// Connects the raid turn system to battle-engine.js
// Replaces raid-battle-inline.js (960 lines) and raid-battle-ui.js (2037 lines)
// with ~250 lines of glue code
// =================================================================

// Tracked state for cleanup
var _registeredRaidGhostIds = [];
var _originalGhostData = {};

/**
 * Initialize and launch a raid battle in-page using battle-engine.js.
 * Called by launchRaidBattle() instead of redirecting to the testroom.
 *
 * @param {object} raidData   — live raid instance data from Firebase
 * @param {Array}  enemyGhosts — boss/minion ghost objects (with id, name, maxHp, art, ability, etc.)
 * @param {Array}  playerTeam  — array of 3 ghost IDs the player chose
 * @param {boolean} isWave     — true if this is a minion wave, false for the boss fight
 */
function initRaidBattleInPage(raidData, enemyGhosts, playerTeam, isWave) {
  // ── 1. Show the raid screen and battle view ──────────────────
  const raidScreen = document.getElementById('raid-screen');
  if (raidScreen) {
    raidScreen.style.display = 'block';
  }
  const battleView = document.getElementById('battle-view');
  if (battleView) {
    battleView.style.display = 'block';
  }

  // ── 2. Register/override boss ghosts so getGhost() returns boss versions ─
  // Boss ghosts often share IDs with regular ghosts (e.g. Dark Fang 202) but
  // have different maxHp. We need makeTeam() to use the BOSS version.
  // Strategy: temporarily override the ghost in the GHOSTS array.
  _registeredRaidGhostIds = [];
  _originalGhostData = {};
  enemyGhosts.forEach(g => {
    if (typeof GHOSTS !== 'undefined') {
      const idx = GHOSTS.findIndex(gh => gh.id === g.id);
      if (idx >= 0) {
        // Save original and override with boss version
        _originalGhostData[g.id] = { ...GHOSTS[idx] };
        GHOSTS[idx] = { ...GHOSTS[idx], maxHp: g.maxHp, art: g.art || GHOSTS[idx].art };
        _registeredRaidGhostIds.push(g.id);
      } else {
        // Ghost doesn't exist at all — add it
        GHOSTS.push({
          id: g.id,
          name: g.name,
          rarity: g.rarity || 'legendary',
          maxHp: g.maxHp,
          art: g.art || '',
          ability: g.ability || '',
          abilityDesc: g.abilityDesc || '',
          _raidBridgeRegistered: true
        });
        _registeredRaidGhostIds.push(g.id);
      }
    }
  });

  // ── 3. Set picks on the shared app state ─────────────────────
  S.redPicks = playerTeam;                       // array of 3 IDs
  S.bluePicks = enemyGhosts.map(g => g.id);      // boss + minions

  // ── 4. Set boss mode flags ───────────────────────────────────
  window.BOSS_MODE = true;
  window.RAID_MODE = true;
  window.IS_WAVE_FIGHT = !!isWave;
  // MP_MODE must be true for the blue AI to respond to red's roll
  if (typeof MP_MODE !== 'undefined') MP_MODE = true;

  // ── 5. Build BOSS_RAID_DATA from the live raidBattleState ────
  // raidBattleState is maintained by raid-engine.js (startMyRaidFight).
  // We just alias it so battle-engine.js can read it.
  if (typeof raidBattleState !== 'undefined' && raidBattleState) {
    window.BOSS_RAID_DATA = raidBattleState;
  } else {
    // Fallback: build a minimal data blob
    const bossConfig = typeof RAID_BOSSES !== 'undefined'
      ? RAID_BOSSES[raidData.raidId] : null;
    window.BOSS_RAID_DATA = {
      raidData: raidData,
      bossConfig: bossConfig,
      currentBossHp: raidData.bossCurrentHp || 0,
      maxBossHp: raidData.bossMaxHp || 1,
      totalDamageDealt: 0,
      ghostsLost: 0,
      bossPhase: getBossPhase(raidData.bossCurrentHp, raidData.bossMaxHp),
      enrageLevel: raidData.enrageLevel || 0,
      currentSlot: raidData.currentFighterIdx || 0,
      bossTeam: null,
      personality: bossConfig ? bossConfig.personality : 'tyrant'
    };
  }

  // ── 6. Start the battle via battle-engine.js ─────────────────
  startBattle();

  // ── 7. Post-init tweaks on the B battle state ────────────────
  if (B) {
    B.duelPhaseMode = false;   // boss fights skip duel phase
  }

  // ── 8. Hide blue roll button (boss auto-rolls via AI) ───────
  const blueBtn = document.getElementById('rollBlueBtn');
  if (blueBtn) {
    blueBtn.style.display = 'none';
  }

  // ── 9. Start blue AI — this is what makes the boss auto-roll ─
  // In the testroom, startBlueAI() polls every 600ms and clicks
  // the blue roll button when it's ready. Without this, the boss
  // never rolls back after the player rolls.
  if (typeof startBlueAI === 'function') {
    startBlueAI();
  }

  // ── 9. Render the boss HP pool bar ───────────────────────────
  const bossHp    = raidData.bossCurrentHp || 0;
  const bossMaxHp = raidData.bossMaxHp || 1;
  _ensureBossHpPoolBar();
  renderBossHpPool(bossHp, bossMaxHp);
}

// (_registeredRaidGhostIds declared at top of file)

// ─── BOSS HP POOL BAR ──────────────────────────────────────────

/**
 * Ensure the boss HP pool bar DOM exists inside #raid-screen.
 * Uses the existing .rib-boss-pool CSS classes from index.html.
 */
function _ensureBossHpPoolBar() {
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

  // Insert at the top of the target container
  target.insertBefore(bar, target.firstChild);
}

/**
 * Render / update the boss HP pool bar.
 * Color shifts by phase: green >75%, yellow >50%, red >25%, purple <=25%.
 *
 * @param {number} bossHp    — current shared boss HP
 * @param {number} bossMaxHp — maximum boss HP
 */
function renderBossHpPool(bossHp, bossMaxHp) {
  const fill = document.getElementById('raid-boss-fill');
  const text = document.getElementById('raid-boss-text');
  if (!fill || !text) return;

  const hp  = Math.max(0, bossHp);
  const max = Math.max(1, bossMaxHp);
  const pct = (hp / max) * 100;

  fill.style.width = pct + '%';

  // Phase color
  if (pct > 75)      fill.style.background = '#2ecc71';  // green
  else if (pct > 50) fill.style.background = '#f1c40f';  // yellow
  else if (pct > 25) fill.style.background = '#e74c3c';  // red
  else               fill.style.background = '#9b59b6';  // purple

  text.textContent = 'BOSS HP: ' + hp + ' / ' + max;
}

// ─── CLEANUP ───────────────────────────────────────────────────

/**
 * Clean up after a raid battle ends or the player leaves.
 * Resets flags, hides the raid screen, removes injected ghosts.
 */
function cleanupRaidBattle() {
  // ── Reset global flags ────────────────────────────────────────
  window.BOSS_MODE = false;
  window.RAID_MODE = false;
  window.BOSS_RAID_DATA = null;
  window.IS_WAVE_FIGHT = false;

  // ── Hide raid screen ──────────────────────────────────────────
  const raidScreen = document.getElementById('raid-screen');
  if (raidScreen) {
    raidScreen.style.display = 'none';
  }

  // ── Hide battle view ──────────────────────────────────────────
  const battleView = document.getElementById('battle-view');
  if (battleView) {
    battleView.style.display = 'none';
  }

  // ── Show main app ─────────────────────────────────────────────
  const app = document.getElementById('app');
  if (app) {
    app.style.display = '';
  }

  // ── Restore blue roll button visibility ───────────────────────
  const blueBtn = document.getElementById('rollBlueBtn');
  if (blueBtn) {
    blueBtn.style.display = '';
  }

  // ── Remove boss HP pool bar ───────────────────────────────────
  const poolBar = document.getElementById('raid-boss-pool');
  if (poolBar) {
    poolBar.remove();
  }

  // ── Restore original ghost data (undo boss HP overrides) ──────
  if (_originalGhostData && typeof GHOSTS !== 'undefined') {
    Object.entries(_originalGhostData).forEach(([id, original]) => {
      const idx = GHOSTS.findIndex(g => g.id === parseInt(id));
      if (idx >= 0) GHOSTS[idx] = original;
    });
    _originalGhostData = {};
  }
  // Remove any ghosts that were injected (not overridden)
  if (typeof GHOSTS !== 'undefined') {
    for (let i = GHOSTS.length - 1; i >= 0; i--) {
      if (GHOSTS[i]._raidBridgeRegistered) GHOSTS.splice(i, 1);
    }
  }
  _registeredRaidGhostIds = [];

  // ── Clear battle state ────────────────────────────────────────
  B = null;
  S.redPicks = [];
  S.bluePicks = [];
}

// ─── GAME-OVER HOOK ────────────────────────────────────────────
// battle-engine.js showGameOver() already checks RAID_MODE and calls
// endMyRaidFight() (global from raid-engine.js). We just need a
// "Return to Lobby" button on the game-over overlay.

/**
 * Inject a "Return to Lobby" button into the game-over overlay when
 * in raid mode. Call this after showGameOver() has rendered.
 * battle-engine.js fires showGameOver -> endMyRaidFight after 3s,
 * so we hook in slightly earlier to add the button.
 */
function injectRaidReturnButton() {
  // Look for the game-over overlay that battle-engine.js renders
  const overlay = document.getElementById('game-over-overlay')
    || document.getElementById('gameOverOverlay')
    || document.querySelector('.game-over-overlay');
  if (!overlay) return;

  // Don't double-add
  if (overlay.querySelector('.raid-return-btn')) return;

  const btn = document.createElement('button');
  btn.className = 'raid-return-btn';
  btn.textContent = 'RETURN TO LOBBY';
  btn.style.cssText = `
    margin-top: 16px; padding: 12px 32px; font-size: 1rem; font-weight: 700;
    background: linear-gradient(135deg, #9b59b6, #8e44ad); color: #fff;
    border: none; border-radius: 8px; cursor: pointer; letter-spacing: 1px;
    text-transform: uppercase; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  `;
  btn.onclick = function () {
    cleanupRaidBattle();
    // If raid-engine has a lobby return function, call it
    if (typeof showRaidLobby === 'function') {
      showRaidLobby();
    }
  };
  overlay.appendChild(btn);
}

// ─── PATCH: auto-inject return button when game ends in raid mode ─
// We monkey-patch by watching B.phase. A simpler approach: poll after
// showGameOver's 3s delay.
(function _hookGameOverForRaid() {
  const _origShowGameOver = window.showGameOver;
  if (typeof _origShowGameOver !== 'function') return;

  window.showGameOver = function (winner) {
    _origShowGameOver.call(this, winner);
    if (window.RAID_MODE) {
      // Replace ALL buttons in game-over with our return-to-lobby button
      requestAnimationFrame(() => {
        const goButtons = document.querySelector('.go-buttons');
        if (goButtons) {
          goButtons.innerHTML = `
            <button class="go-btn-rematch" style="background:linear-gradient(135deg,#9b59b6,#8e44ad);color:#fff;border:1px solid #c084fc;padding:12px 32px;font-size:1rem;font-weight:700;border-radius:8px;cursor:pointer;letter-spacing:1px;text-transform:uppercase;box-shadow:0 4px 12px rgba(0,0,0,0.4);"
              onclick="cleanupRaidBattle(); if(typeof showRaidLobby==='function') showRaidLobby(); if(typeof closeRaidResult==='function') closeRaidResult();">
              RETURN TO LOBBY
            </button>`;
        }
        // Also call endMyRaidFight to report results to Firebase
        if (typeof endMyRaidFight === 'function') {
          try { endMyRaidFight({ damage: 0, ghostsLost: 0 }); } catch(e) { console.warn('[RAID] endMyRaidFight error:', e); }
        }
      });
    }
  };
})();
