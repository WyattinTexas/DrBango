// =================================================================
// RAID UI — Screen rendering, lobby, raider lineup, boss HP bar,
//           spectator view, result screen, badge display
// Depends on: cards.js, raid-engine.js, battle-engine.js
// =================================================================

// ─── RAID LOBBY (Boss Selection) ────────────────────────────────

function showRaidLobby() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  // Get user's badges
  db.ref(`mp/users/${user.uid}/raidBadges`).once('value').then(snap => {
    const badges = snap.val() || [];
    renderRaidLobby(badges);
  });
}

function renderRaidLobby(userBadges) {
  const container = document.getElementById('raid-lobby');
  if (!container) return;

  const tiers = [1, 2, 3];
  let html = '<h2 class="raid-section-title">CHOOSE YOUR RAID</h2>';

  tiers.forEach(tier => {
    const bosses = Object.entries(RAID_BOSSES).filter(([, b]) => b.tier === tier);
    if (bosses.length === 0) return;

    html += `<div class="raid-tier-group">
      <div class="raid-tier-label">TIER ${tier}</div>
      <div class="raid-boss-grid">`;

    bosses.forEach(([raidId, boss]) => {
      const locked = boss.requiredBadge && !hasRaidBadge(userBadges, boss.requiredBadge);
      const reqBadge = boss.requiredBadge ? RAID_BADGES[boss.requiredBadge] : null;
      const defeated = userBadges.some(b => {
        const badge = RAID_BADGES[b];
        return badge && badge.boss === raidId;
      });

      html += `<div class="raid-boss-card ${locked ? 'locked' : ''} ${defeated ? 'defeated' : ''}"
                    onclick="${locked ? '' : `selectRaid('${raidId}')`}">
        <div class="raid-boss-art-wrap">
          <img class="raid-boss-art" src="${boss.bossGhost.art}" alt="${boss.name}"
               onerror="this.src='../testroom/art/timber.jpg'">
          ${locked ? '<div class="raid-boss-lock">&#x1F512;</div>' : ''}
          ${defeated ? '<div class="raid-boss-check">&#x2714;</div>' : ''}
        </div>
        <div class="raid-boss-info">
          <div class="raid-boss-name">${boss.name}</div>
          <div class="raid-boss-title">${boss.title}</div>
          <div class="raid-boss-stats">
            <span class="raid-hp-badge">${boss.baseHp} HP</span>
            <span class="raid-personality-badge">${boss.personality.toUpperCase()}</span>
            <span class="raid-pts-badge">${boss.rewardPoints} pts</span>
          </div>
          ${locked ? `<div class="raid-boss-req">Requires: ${reqBadge?.name || boss.requiredBadge}</div>` : ''}
        </div>
      </div>`;
    });

    html += '</div></div>';
  });

  container.innerHTML = html;
}

// ─── RAID QUEUE VIEW ────────────────────────────────────────────

let selectedRaidId = null;

function selectRaid(raidId) {
  selectedRaidId = raidId;
  const boss = RAID_BOSSES[raidId];
  if (!boss) return;

  const container = document.getElementById('raid-lobby');
  if (!container) return;

  // Show queue view with team picker
  let html = `
    <div class="raid-queue-view">
      <button class="raid-back-btn" onclick="showRaidLobby()">&#x2190; Back</button>
      <div class="raid-queue-header">
        <img class="raid-queue-boss-art" src="${boss.bossGhost.art}" alt="${boss.name}"
             onerror="this.src='../testroom/art/timber.jpg'">
        <div class="raid-queue-boss-info">
          <h2>${boss.name}</h2>
          <div class="raid-boss-title">${boss.title}</div>
          <div class="raid-boss-personality">${boss.personality.toUpperCase()} &bull; ${boss.baseHp} HP &bull; Tier ${boss.tier}</div>
          <p class="raid-boss-desc">${boss.bossGhost.abilityDesc}</p>
        </div>
      </div>
      <div class="raid-queue-team">
        <h3>SELECT YOUR TEAM</h3>
        <div id="raid-team-picker" class="raid-team-picker"></div>
        <div id="raid-selected-team" class="raid-selected-team"></div>
      </div>
      <div id="raid-queue-status" class="raid-queue-status">
        <div id="raid-queue-count">Loading queue...</div>
        <div id="raid-queue-players" class="raid-queue-players"></div>
      </div>
      <div class="raid-queue-actions">
        <button id="raid-join-btn" class="raid-join-btn" onclick="joinRaid()" disabled>
          SELECT 3 GHOSTS TO JOIN
        </button>
        <button id="raid-leave-btn" class="raid-leave-btn" onclick="leaveRaid()" style="display:none">
          LEAVE QUEUE
        </button>
      </div>
    </div>`;

  container.innerHTML = html;
  renderRaidTeamPicker();
  listenToRaidQueue(raidId);
}

let raidTeamPicks = [];

function renderRaidTeamPicker() {
  const picker = document.getElementById('raid-team-picker');
  if (!picker) return;

  // Use player's collection (from multiplayer's existing collection system)
  const collection = window.myCollection || [];
  const activeGhosts = getActiveGhosts().filter(g => collection.includes(g.id));

  let html = '';
  activeGhosts.sort((a, b) => {
    const order = { legendary: 0, 'ghost-rare': 1, rare: 2, uncommon: 3, common: 4 };
    return (order[a.rarity] || 5) - (order[b.rarity] || 5);
  });

  activeGhosts.forEach(g => {
    const selected = raidTeamPicks.includes(g.id);
    html += `<div class="raid-pick-card ${selected ? 'selected' : ''} ${g.rarity}"
                  onclick="toggleRaidPick(${g.id})">
      <img src="${g.art}" alt="${g.name}" onerror="this.src='../testroom/art/timber.jpg'">
      <div class="raid-pick-name">${g.name}</div>
      <div class="raid-pick-hp">${g.maxHp} HP</div>
    </div>`;
  });

  picker.innerHTML = html;
  updateRaidSelectedTeam();
}

function toggleRaidPick(ghostId) {
  const idx = raidTeamPicks.indexOf(ghostId);
  if (idx >= 0) {
    raidTeamPicks.splice(idx, 1);
  } else if (raidTeamPicks.length < 3) {
    raidTeamPicks.push(ghostId);
  }
  renderRaidTeamPicker();
}

function updateRaidSelectedTeam() {
  const container = document.getElementById('raid-selected-team');
  const joinBtn = document.getElementById('raid-join-btn');
  if (!container) return;

  if (raidTeamPicks.length === 0) {
    container.innerHTML = '<div class="raid-team-empty">Pick 3 ghosts for your raid team</div>';
    if (joinBtn) { joinBtn.disabled = true; joinBtn.textContent = 'SELECT 3 GHOSTS TO JOIN'; }
    return;
  }

  let html = '<div class="raid-team-slots">';
  raidTeamPicks.forEach(id => {
    const g = getGhost(id);
    if (!g) return;
    html += `<div class="raid-team-slot ${g.rarity}">
      <img src="${g.art}" alt="${g.name}" onerror="this.src='../testroom/art/timber.jpg'">
      <span>${g.name}</span>
    </div>`;
  });
  for (let i = raidTeamPicks.length; i < 3; i++) {
    html += '<div class="raid-team-slot empty">?</div>';
  }
  html += '</div>';
  container.innerHTML = html;

  if (joinBtn) {
    if (raidTeamPicks.length === 3) {
      joinBtn.disabled = false;
      joinBtn.textContent = 'JOIN RAID';
    } else {
      joinBtn.disabled = true;
      joinBtn.textContent = `SELECT ${3 - raidTeamPicks.length} MORE`;
    }
  }
}

function listenToRaidQueue(raidId) {
  startQueueListener(raidId);
}

function updateRaidQueueUI(raidId, entries) {
  if (raidId !== selectedRaidId) return;

  const countEl = document.getElementById('raid-queue-count');
  const playersEl = document.getElementById('raid-queue-players');
  if (!countEl || !playersEl) return;

  const max = RAID_CONFIG.MAX_PLAYERS;
  countEl.innerHTML = `<span class="raid-queue-num">${entries.length}</span> / <span class="raid-queue-num">${max}</span> Raiders`;

  let html = '';
  entries.forEach((e, i) => {
    html += `<div class="raid-queue-player">
      <span class="raid-queue-slot">#${i + 1}</span>
      <span class="raid-queue-name">${e.displayName}</span>
    </div>`;
  });
  playersEl.innerHTML = html;

  // Check if we're in the queue
  const user = firebase.auth().currentUser;
  const inQueue = entries.some(e => e.uid === user?.uid);
  const joinBtn = document.getElementById('raid-join-btn');
  const leaveBtn = document.getElementById('raid-leave-btn');
  if (joinBtn) joinBtn.style.display = inQueue ? 'none' : '';
  if (leaveBtn) leaveBtn.style.display = inQueue ? '' : 'none';
}

async function joinRaid() {
  if (!selectedRaidId || raidTeamPicks.length !== 3) return;
  const result = await joinRaidQueue(selectedRaidId, raidTeamPicks);
  if (result.error) {
    alert(result.error);
  }
}

async function leaveRaid() {
  if (!selectedRaidId) return;
  await leaveRaidQueue(selectedRaidId);
}

// ─── RAID SCREEN (Main battle view) ────────────────────────────

function showRaidScreen(instanceId) {
  // Hide multiplayer main, show raid screen
  const mainContent = document.getElementById('main-content');
  const raidScreen = document.getElementById('raid-screen');
  if (mainContent) mainContent.style.display = 'none';
  if (raidScreen) raidScreen.style.display = 'block';
}

function hideRaidScreen() {
  const mainContent = document.getElementById('main-content');
  const raidScreen = document.getElementById('raid-screen');
  if (mainContent) mainContent.style.display = '';
  if (raidScreen) raidScreen.style.display = 'none';
}

// ─── RAID COUNTDOWN ─────────────────────────────────────────────

function showRaidCountdown(data) {
  const raidScreen = document.getElementById('raid-screen');
  if (!raidScreen) return;

  const boss = RAID_BOSSES[data.raidId];
  if (!boss) return;

  const players = data.players || {};

  let playersHtml = '';
  Object.entries(players).forEach(([slot, p]) => {
    const teamIcons = (p.team || []).map(id => {
      const g = getGhost(id);
      return g ? `<img class="raid-countdown-ghost" src="${g.art}" alt="${g.name}" onerror="this.src='../testroom/art/timber.jpg'">` : '';
    }).join('');
    playersHtml += `<div class="raid-countdown-player">
      <div class="raid-countdown-slot">#${parseInt(slot) + 1}</div>
      <div class="raid-countdown-name">${p.displayName}</div>
      <div class="raid-countdown-team">${teamIcons}</div>
    </div>`;
  });

  raidScreen.innerHTML = `
    <div class="raid-countdown-screen">
      <div class="raid-countdown-boss">
        <img class="raid-countdown-boss-art" src="${boss.bossGhost.art}" alt="${boss.name}"
             onerror="this.src='../testroom/art/timber.jpg'">
        <h1 class="raid-countdown-boss-name">${boss.name}</h1>
        <div class="raid-countdown-boss-title">${boss.title}</div>
        <div class="raid-countdown-personality">${boss.personality.toUpperCase()}</div>
      </div>
      <div class="raid-countdown-timer" id="raid-countdown-timer">RAID STARTING...</div>
      <div class="raid-countdown-dialogue">"${boss.dialogue.intro}"</div>
      <div class="raid-countdown-players">${playersHtml}</div>
    </div>`;

  // Countdown animation
  let seconds = RAID_CONFIG.COUNTDOWN_SECONDS;
  const timerEl = document.getElementById('raid-countdown-timer');
  const countdownInterval = setInterval(() => {
    seconds--;
    if (timerEl) timerEl.textContent = seconds > 0 ? seconds : 'GO!';
    if (seconds <= 0) clearInterval(countdownInterval);
  }, 1000);
}

// ─── BOSS HP BAR ────────────────────────────────────────────────

function renderBossHpBar(currentHp, maxHp, bossName, personality) {
  const pct = Math.max(0, currentHp / maxHp * 100);
  const phase = getBossPhase(currentHp, maxHp);
  const phaseNames = { 1: 'OPENING GAMBIT', 2: 'ESCALATION', 3: 'DESPERATION', 4: 'ENRAGE' };
  const phaseColors = { 1: '#2ecc71', 2: '#f39c12', 3: '#e74c3c', 4: '#8e44ad' };

  return `<div class="raid-boss-hp-container">
    <div class="raid-boss-hp-header">
      <span class="raid-boss-hp-name">${bossName}</span>
      <span class="raid-boss-hp-personality">${personality.toUpperCase()}</span>
      <span class="raid-boss-hp-phase" style="color:${phaseColors[phase]}">${phaseNames[phase]}</span>
    </div>
    <div class="raid-boss-hp-bar-bg">
      <div class="raid-boss-hp-bar-fill" style="width:${pct}%;background:${phaseColors[phase]}">
        <div class="raid-boss-hp-bar-glow"></div>
      </div>
      <div class="raid-boss-hp-markers">
        <div class="raid-boss-hp-marker" style="left:75%"></div>
        <div class="raid-boss-hp-marker" style="left:50%"></div>
        <div class="raid-boss-hp-marker" style="left:25%"></div>
      </div>
      <div class="raid-boss-hp-text">${currentHp} / ${maxHp}</div>
    </div>
  </div>`;
}

// ─── RAIDER LINEUP ──────────────────────────────────────────────

function renderRaiderLineup(players, currentIdx) {
  let html = '<div class="raid-lineup-scroll">';

  Object.entries(players).forEach(([slot, p]) => {
    const idx = parseInt(slot);
    const isCurrent = idx === currentIdx;
    const isDone = p.status === 'done';
    const isDisconnected = p.status === 'disconnected';
    const isWaiting = !isCurrent && !isDone && !isDisconnected;

    let statusClass = 'waiting';
    let statusText = 'WAITING';
    let extraInfo = '';

    if (isCurrent) {
      statusClass = 'fighting';
      statusText = 'FIGHTING';
    } else if (isDone) {
      statusClass = 'done';
      statusText = `${p.damageDealt || 0} DMG`;
      const ghostStatus = [];
      if (p.ghostsLost !== undefined) {
        for (let i = 0; i < 3 - (p.ghostsLost || 0); i++) ghostStatus.push('<span class="raid-ghost-alive">&#x2764;</span>');
        for (let i = 0; i < (p.ghostsLost || 0); i++) ghostStatus.push('<span class="raid-ghost-ko">&#x1F480;</span>');
      }
      extraInfo = ghostStatus.join('');
    } else if (isDisconnected) {
      statusClass = 'disconnected';
      statusText = 'DC';
    }

    html += `<div class="raid-lineup-slot ${statusClass} ${isCurrent ? 'current' : ''}">
      <div class="raid-lineup-num">#${idx + 1}</div>
      <div class="raid-lineup-name">${p.displayName}</div>
      <div class="raid-lineup-status">${statusText}</div>
      ${extraInfo ? `<div class="raid-lineup-ghosts">${extraInfo}</div>` : ''}
    </div>`;
  });

  html += '</div>';
  return html;
}

// ─── RAID BATTLE UI ─────────────────────────────────────────────

function showRaidBattleUI(playerTeam, enemyGhosts, isWave, raidData) {
  const raidScreen = document.getElementById('raid-screen');
  if (!raidScreen) return;

  const boss = RAID_BOSSES[raidData.raidId];
  const players = raidData.players || {};
  const currentIdx = raidData.currentFighterIdx || 0;

  // Build the raid battle layout
  raidScreen.innerHTML = `
    <div class="raid-battle-layout">
      ${renderBossHpBar(raidData.bossCurrentHp, raidData.bossMaxHp, boss.name, boss.personality)}
      ${renderRaiderLineup(players, currentIdx)}
      <div class="raid-battle-arena" id="raid-battle-arena">
        <!-- Battle engine renders here -->
        <div id="battleContainer" class="raid-battle-container">
          <div id="vsSplash" class="vs-splash">
            <div class="vs-splash-inner">
              <div class="vs-red"><span id="vsRedName"></span><div id="vsRedRoster" class="vs-roster"></div></div>
              <div class="vs-text">VS</div>
              <div class="vs-blue"><span id="vsBlueName"></span><div id="vsBlueRoster" class="vs-roster"></div></div>
            </div>
          </div>
          <div id="battlefield">
            <div id="red-side" class="fighter-side">
              <div id="red-active" class="fighter-card"></div>
              <div id="red-sideline" class="sideline-row"></div>
              <div id="red-dice" class="dice-row"></div>
              <button id="rollRedBtn" class="roll-btn red-roll" onclick="rollReady('red')">ROLL</button>
            </div>
            <div id="battle-center" class="battle-center">
              <div id="narrator" class="narrator"></div>
              <div id="round-counter" class="round-counter"></div>
            </div>
            <div id="blue-side" class="fighter-side">
              <div id="blue-active" class="fighter-card"></div>
              <div id="blue-sideline" class="sideline-row"></div>
              <div id="blue-dice" class="dice-row"></div>
              <button id="rollBlueBtn" class="roll-btn blue-roll" style="display:none">BOSS</button>
            </div>
          </div>
          <div id="gameOver" class="game-over-overlay"></div>
          <div id="abilitySplash" class="ability-splash"></div>
          <div id="battle-log" class="battle-log"></div>
        </div>
      </div>
      <div class="raid-spectator-feed" id="raid-spectator-feed">
        <div class="raid-feed-title">RAID LOG</div>
        <div id="raid-feed-content" class="raid-feed-content"></div>
      </div>
    </div>`;

  // Set up battle picks and start the battle engine
  S.redPicks = playerTeam;
  S.bluePicks = enemyGhosts.map(g => g.id);

  // Override makeTeam for boss ghosts (they may not be in GHOSTS array)
  const originalMakeTeam = window._originalMakeTeam || makeTeam;
  if (!window._originalMakeTeam) window._originalMakeTeam = makeTeam;

  // Start battle after a brief delay
  setTimeout(() => {
    startBattle();
  }, 500);
}

// ─── SPECTATOR VIEW ─────────────────────────────────────────────

function showRaidSpectatorView(data, mySlot, currentIdx) {
  // Update the raider lineup
  const lineupContainer = document.querySelector('.raid-lineup-scroll');
  if (lineupContainer) {
    lineupContainer.outerHTML = renderRaiderLineup(data.players || {}, currentIdx);
  }

  // Update boss HP bar
  const hpContainer = document.querySelector('.raid-boss-hp-container');
  const boss = RAID_BOSSES[data.raidId];
  if (hpContainer && boss) {
    hpContainer.outerHTML = renderBossHpBar(data.bossCurrentHp, data.bossMaxHp, boss.name, boss.personality);
  }
}

function renderRaidBattleSpectator(snapshot) {
  if (!snapshot) return;

  // Only render spectator view if we're NOT the active fighter
  if (raidBattleState && raidBattleState.phase === 'fighting') return;

  const arena = document.getElementById('raid-battle-arena');
  if (!arena) return;

  const pGhost = snapshot.playerGhost || {};
  const bGhost = snapshot.bossGhost || {};
  const lastRoll = snapshot.lastRoll || {};

  arena.innerHTML = `
    <div class="raid-spectator-battle">
      <div class="raid-spec-player">
        <div class="raid-spec-name">${snapshot.playerName || 'Raider'}</div>
        <div class="raid-spec-ghost">
          <img class="raid-spec-art" src="${pGhost.art || '../testroom/art/timber.jpg'}" alt="${pGhost.name}">
          <div class="raid-spec-ghost-name">${pGhost.name || '???'}</div>
          <div class="raid-spec-hp">
            <div class="raid-spec-hp-fill" style="width:${(pGhost.hp / pGhost.maxHp * 100) || 0}%;background:#e74c3c"></div>
            <span>${pGhost.hp || 0}/${pGhost.maxHp || 0}</span>
          </div>
        </div>
        ${lastRoll.player ? `<div class="raid-spec-dice">[${lastRoll.player.join(', ')}]</div>` : ''}
      </div>
      <div class="raid-spec-vs">
        <div class="raid-spec-round">Round ${snapshot.round || 1}</div>
        <div class="raid-spec-vs-text">VS</div>
        ${lastRoll.winner ? `<div class="raid-spec-result ${lastRoll.winner === 'player' ? 'player-win' : 'boss-win'}">${lastRoll.winner === 'player' ? snapshot.playerName + ' wins!' : (bGhost.name || 'Boss') + ' wins!'} ${lastRoll.damage || 0} damage!</div>` : ''}
      </div>
      <div class="raid-spec-boss">
        <div class="raid-spec-name">${bGhost.isBoss ? 'BOSS' : 'MINION'}</div>
        <div class="raid-spec-ghost">
          <img class="raid-spec-art" src="${bGhost.art || '../testroom/art/timber.jpg'}" alt="${bGhost.name}">
          <div class="raid-spec-ghost-name">${bGhost.name || '???'}</div>
          <div class="raid-spec-hp">
            <div class="raid-spec-hp-fill" style="width:${(bGhost.hp / bGhost.maxHp * 100) || 0}%;background:#8e44ad"></div>
            <span>${bGhost.hp || 0}/${bGhost.maxHp || 0}</span>
          </div>
        </div>
        ${lastRoll.boss ? `<div class="raid-spec-dice">[${lastRoll.boss.join(', ')}]</div>` : ''}
      </div>
    </div>
    <div class="raid-spec-sidelines">
      <div class="raid-spec-sideline-label">Player Sideline</div>
      <div class="raid-spec-sideline-ghosts">
        ${(snapshot.playerSideline || []).map(g => `<span class="${g.ko ? 'ko' : ''}">${g.name} ${g.ko ? '(KO)' : g.hp + '/' + g.maxHp}</span>`).join(' ')}
      </div>
      <div class="raid-spec-sideline-label">Boss Sideline</div>
      <div class="raid-spec-sideline-ghosts">
        ${(snapshot.bossSideline || []).map(g => `<span class="${g.ko ? 'ko' : ''}">${g.name} ${g.ko ? '(KO)' : g.hp + '/' + g.maxHp}</span>`).join(' ')}
      </div>
    </div>`;
}

// ─── BOSS INTRO SPLASH ─────────────────────────────────────────

function showBossIntro(bossConfig, phase, callback) {
  const raidScreen = document.getElementById('raid-screen');
  if (!raidScreen) { callback(); return; }

  const overlay = document.createElement('div');
  overlay.className = 'raid-boss-intro';
  overlay.innerHTML = `
    <div class="raid-boss-intro-inner">
      <img class="raid-boss-intro-art" src="${bossConfig.bossGhost.art}" alt="${bossConfig.name}">
      <h1 class="raid-boss-intro-name">${bossConfig.name}</h1>
      <div class="raid-boss-intro-title">${bossConfig.title}</div>
      <div class="raid-boss-intro-dialogue">"${bossConfig.dialogue.intro}"</div>
      <div class="raid-boss-intro-phase">Phase ${phase}</div>
    </div>`;
  raidScreen.appendChild(overlay);

  setTimeout(() => { overlay.classList.add('active'); }, 50);
  setTimeout(() => {
    overlay.classList.remove('active');
    setTimeout(() => { overlay.remove(); callback(); }, 500);
  }, 3000);
}

function showMinionWaveIntro(waveMinions, callback) {
  const raidScreen = document.getElementById('raid-screen');
  if (!raidScreen) { callback(); return; }

  const overlay = document.createElement('div');
  overlay.className = 'raid-boss-intro raid-wave-intro';
  overlay.innerHTML = `
    <div class="raid-boss-intro-inner">
      <h2 class="raid-wave-title">MINION WAVE!</h2>
      <div class="raid-wave-minions">
        ${waveMinions.map(m => `<div class="raid-wave-minion">
          <img src="${m.art}" alt="${m.name}" onerror="this.src='../testroom/art/timber.jpg'">
          <span>${m.name}</span>
        </div>`).join('')}
      </div>
      <div class="raid-wave-subtitle">Defeat the minions to reach the boss!</div>
    </div>`;
  raidScreen.appendChild(overlay);

  setTimeout(() => { overlay.classList.add('active'); }, 50);
  setTimeout(() => {
    overlay.classList.remove('active');
    setTimeout(() => { overlay.remove(); callback(); }, 500);
  }, 2500);
}

// ─── PHASE TRANSITION ───────────────────────────────────────────

function showPhaseTransition(transition, effects) {
  const overlay = document.createElement('div');
  overlay.className = 'raid-phase-transition';

  const phaseNames = { 1: 'OPENING GAMBIT', 2: 'ESCALATION', 3: 'DESPERATION', 4: 'ENRAGE' };

  let effectsHtml = effects.map(e => `<div class="raid-phase-effect">${e.desc || e.type}</div>`).join('');

  overlay.innerHTML = `
    <div class="raid-phase-inner">
      <div class="raid-phase-label">PHASE ${transition.toPhase}</div>
      <div class="raid-phase-name">${phaseNames[transition.toPhase]}</div>
      <div class="raid-phase-dialogue">"${transition.dialogue}"</div>
      ${effectsHtml}
    </div>`;

  document.body.appendChild(overlay);
  setTimeout(() => overlay.classList.add('active'), 50);
  setTimeout(() => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 500);
  }, 3000);
}

// ─── RAID RESULT SCREEN ─────────────────────────────────────────

function showRaidResult(data) {
  const raidScreen = document.getElementById('raid-screen');
  if (!raidScreen) return;

  const boss = RAID_BOSSES[data.raidId];
  const bossDefeated = data.bossCurrentHp <= 0;
  const players = data.players || {};

  // Sort players by damage dealt
  const sortedPlayers = Object.entries(players)
    .map(([slot, p]) => ({ slot: parseInt(slot), ...p }))
    .sort((a, b) => (b.damageDealt || 0) - (a.damageDealt || 0));

  const mvp = sortedPlayers[0];
  const user = firebase.auth().currentUser;
  const killingBlowPlayer = data.bossDefeatedBy ? Object.values(players).find(p => p.uid === data.bossDefeatedBy) : null;

  let html = `
    <div class="raid-result-screen ${bossDefeated ? 'victory' : 'defeat'}">
      <div class="raid-result-header">
        <h1 class="raid-result-title">${bossDefeated ? 'RAID COMPLETE!' : 'RAID FAILED'}</h1>
        <div class="raid-result-boss">${boss?.name || 'Unknown Boss'}</div>
        ${bossDefeated
          ? `<div class="raid-result-subtitle">${boss?.dialogue?.defeat || 'The boss falls!'}</div>`
          : `<div class="raid-result-subtitle">${boss?.dialogue?.victory || 'The boss stands triumphant.'}</div>`
        }
      </div>

      <div class="raid-result-stats">
        <div class="raid-result-stat">
          <span class="raid-stat-label">Boss HP</span>
          <span class="raid-stat-value">${bossDefeated ? 'DEFEATED' : `${data.bossCurrentHp}/${data.bossMaxHp} remaining`}</span>
        </div>
        <div class="raid-result-stat">
          <span class="raid-stat-label">Total Damage</span>
          <span class="raid-stat-value">${data.totalDamageDealt || 0}</span>
        </div>
        ${killingBlowPlayer ? `<div class="raid-result-stat highlight">
          <span class="raid-stat-label">Killing Blow</span>
          <span class="raid-stat-value">${killingBlowPlayer.displayName}</span>
        </div>` : ''}
      </div>

      <div class="raid-result-leaderboard">
        <h3>DAMAGE LEADERBOARD</h3>
        ${sortedPlayers.map((p, i) => {
          const isMvp = i === 0;
          const isMe = p.uid === user?.uid;
          const isKiller = p.uid === data.bossDefeatedBy;
          return `<div class="raid-result-row ${isMe ? 'is-me' : ''} ${isMvp ? 'is-mvp' : ''}">
            <span class="raid-result-rank">#${i + 1}</span>
            <span class="raid-result-player-name">${p.displayName}${isMvp ? ' <span class="mvp-badge">MVP</span>' : ''}${isKiller ? ' <span class="kb-badge">KB</span>' : ''}</span>
            <span class="raid-result-damage">${p.damageDealt || 0} dmg</span>
            <span class="raid-result-ghosts-lost">${3 - (p.ghostsLost || 0)}/3 survived</span>
          </div>`;
        }).join('')}
      </div>

      <button class="raid-result-close" onclick="closeRaidResult()">RETURN TO LOBBY</button>
    </div>`;

  raidScreen.innerHTML = html;
}

function closeRaidResult() {
  hideRaidScreen();
  cleanupRaid();
  showRaidLobby();
  // Refresh main UI
  if (typeof renderMainScreen === 'function') renderMainScreen();
}

// ─── BADGE DISPLAY ──────────────────────────────────────────────

function renderRaidBadges(badges) {
  if (!badges || badges.length === 0) return '<div class="raid-no-badges">No badges earned yet</div>';

  let html = '<div class="raid-badge-grid">';
  Object.entries(RAID_BADGES).forEach(([key, badge]) => {
    const earned = badges.includes(key);
    html += `<div class="raid-badge ${earned ? 'earned' : 'locked'}">
      <span class="raid-badge-icon">${badge.icon}</span>
      <span class="raid-badge-name">${badge.name}</span>
      ${earned ? '<span class="raid-badge-check">&#x2714;</span>' : ''}
    </div>`;
  });
  html += '</div>';
  return html;
}

// ─── MULTIPLAYER SPECTATOR BANNER ───────────────────────────────

/**
 * Show a "RAID IN PROGRESS" banner on the main multiplayer screen
 * for non-participating users to click and spectate
 */
function checkForActiveRaids() {
  db.ref('mp/raids/instances').orderByChild('status').equalTo('active').limitToFirst(1).on('value', snap => {
    const instances = snap.val();
    const banner = document.getElementById('raid-active-banner');

    if (!instances) {
      if (banner) banner.style.display = 'none';
      return;
    }

    const [instanceId, instance] = Object.entries(instances)[0];
    const boss = RAID_BOSSES[instance.raidId];
    if (!boss) return;

    if (banner) {
      banner.style.display = 'flex';
      banner.innerHTML = `
        <span class="raid-banner-pulse"></span>
        <span class="raid-banner-text">RAID IN PROGRESS: ${boss.name} (${instance.bossCurrentHp}/${instance.bossMaxHp} HP)</span>
        <button class="raid-banner-watch" onclick="spectateRaid('${instanceId}')">WATCH</button>`;
    }
  });
}

function spectateRaid(instanceId) {
  currentRaid = { instanceId };
  showRaidScreen(instanceId);
  enterRaidScreen(instanceId);

  // Register as spectator
  const user = firebase.auth().currentUser;
  if (user) {
    db.ref(`mp/raids/instances/${instanceId}/spectators/${user.uid}`).set({
      displayName: user.displayName || 'Spectator',
      joinedAt: firebase.database.ServerValue.TIMESTAMP
    });
  }
}
