// =================================================================
// RAID AUTO-TEST — Paste raidAutoTest('raid_dark_fang') in console
// Joins queue, starts raid, auto-rolls every turn, downloads transcript.
// Each player runs this independently in their own browser.
// =================================================================

async function raidAutoTest(raidId, options = {}) {
  const {
    autoRoll = true,       // automatically click ROLL each turn
    rollDelay = 2000,      // ms to wait before rolling (time for pre-roll abilities)
    autoStart = true,      // automatically click START when enough players
    team = null,           // [id, id, id] or null for current team
    verbose = true         // log to console
  } = options;

  const log = verbose ? console.log.bind(console, '[AutoTest]') : () => {};
  const user = firebase.auth().currentUser;
  if (!user) { console.error('[AutoTest] Not logged in!'); return; }

  log(`Player: ${user.displayName} (${user.uid})`);
  log(`Raid: ${raidId}`);

  // ── Step 1: Navigate to raids and select the boss ───────────────
  if (typeof showRaidLobby === 'function') showRaidLobby();
  await _sleep(500);
  if (typeof selectRaid === 'function') selectRaid(raidId);
  await _sleep(500);

  // ── Step 2: Set team if provided ────────────────────────────────
  if (team && team.length === 3) {
    raidTeamPicks = team;
    log(`Team set: ${team.join(', ')}`);
  } else {
    // Use whatever team is currently selected
    log(`Using current team: ${raidTeamPicks?.join(', ') || 'none selected'}`);
    if (!raidTeamPicks || raidTeamPicks.length !== 3) {
      // Auto-pick 3 random ghosts from collection
      const userSnap = await db.ref(`mp/users/${user.uid}/collection`).once('value');
      const collection = userSnap.val() || [];
      const activeGhosts = collection.filter(id => {
        const g = getGhost(id);
        return g && !SHELVED_IDS.has(id);
      });
      if (activeGhosts.length >= 3) {
        raidTeamPicks = activeGhosts.slice(0, 3);
        log(`Auto-picked team: ${raidTeamPicks.map(id => getGhost(id)?.name).join(', ')}`);
      } else {
        console.error('[AutoTest] Not enough ghosts in collection!');
        return;
      }
    }
  }

  // ── Step 3: Join the raid queue ─────────────────────────────────
  log('Joining raid queue...');
  const joinResult = await joinRaidQueue(raidId, raidTeamPicks);
  if (joinResult.error) {
    console.error('[AutoTest] Join failed:', joinResult.error);
    return;
  }
  log('Joined queue. Waiting for other players...');

  // ── Step 4: Wait for enough players and auto-start ──────────────
  if (autoStart) {
    log('Watching for enough players to start...');
    await _waitForCondition(() => {
      const startBtn = document.getElementById('raid-start-btn');
      return startBtn && !startBtn.disabled && startBtn.style.display !== 'none';
    }, 120000, 1000); // wait up to 2 minutes

    log('Enough players! Starting raid...');
    await _sleep(1000); // brief pause for dramatic effect
    const startBtn = document.getElementById('raid-start-btn');
    if (startBtn && !startBtn.disabled) {
      startBtn.click();
      log('Raid started!');
    }
  }

  // ── Step 5: Auto-roll loop ──────────────────────────────────────
  if (autoRoll) {
    log(`Auto-roll enabled (${rollDelay}ms delay before each roll)`);
    _autoRollLoop(rollDelay, log);
  }

  log('Auto-test running. Transcript will download when raid ends.');
  log('To stop auto-rolling: window._autoTestStop = true');
}

// ── Auto-roll loop ────────────────────────────────────────────────
function _autoRollLoop(delay, log) {
  window._autoTestStop = false;

  const interval = setInterval(() => {
    if (window._autoTestStop) {
      clearInterval(interval);
      log('Auto-roll stopped.');
      return;
    }

    // Check if we're the active fighter with a roll button
    if (typeof RaidState === 'undefined' || !RaidState.amFighter || !RaidState.amFighter()) return;

    const B = typeof BattleEngine !== 'undefined' ? BattleEngine.getState() : null;
    if (!B) return;

    // Only roll when phase is 'ready'
    if (B.phase !== 'ready') return;

    const rollBtn = document.getElementById('rollRedBtn');
    if (!rollBtn || rollBtn.disabled || rollBtn.style.display === 'none') return;

    // Wait the specified delay before rolling
    clearInterval(interval);
    log(`Rolling in ${delay}ms...`);

    setTimeout(() => {
      const btn = document.getElementById('rollRedBtn');
      if (btn && !btn.disabled && B.phase === 'ready') {
        btn.click();
        log('ROLLED!');
      }
      // Resume the loop
      if (!window._autoTestStop) {
        setTimeout(() => _autoRollLoop(delay, log), 1500);
      }
    }, delay);

  }, 500); // check every 500ms
}

// ── Quick-start: skip queue, just auto-roll ───────────────────────
function raidAutoRoll(delay = 2000) {
  const log = console.log.bind(console, '[AutoRoll]');
  log(`Auto-rolling with ${delay}ms delay. Stop with: window._autoTestStop = true`);
  _autoRollLoop(delay, log);
}

// ── Utilities ─────────────────────────────────────────────────────
function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function _waitForCondition(fn, timeout = 30000, interval = 500) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = setInterval(() => {
      if (fn()) {
        clearInterval(check);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(check);
        resolve(); // don't reject — just continue
      }
    }, interval);
  });
}

// ── Console help ──────────────────────────────────────────────────
console.log('%c[Raid AutoTest Ready]', 'color: #2ecc71; font-weight: bold',
  '\n  raidAutoTest("raid_dark_fang")  — full auto (join, start, roll)',
  '\n  raidAutoRoll(2000)              — just auto-roll (already in raid)',
  '\n  window._autoTestStop = true     — stop auto-rolling',
  '\n  RaidTranscript.download()       — download transcript now'
);
