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

let raidBookPage = 0;
const RAID_ZONES = [
  { tier: 1, name: 'Rolling Hills', color: '#2ecc71', bg: 'linear-gradient(135deg, #0a1a0e, #142810)', championBadge: 'heart_of_the_hills', desc: 'Where the wild packs roam and wanderers never rest.' },
  { tier: 2, name: 'Frost Valley', color: '#75BEEB', bg: 'linear-gradient(135deg, #0a1520, #0d2040)', championBadge: 'frostborne', desc: 'A frozen kingdom where the ice king reigns and seers guard ancient secrets.' },
  { tier: 3, name: 'Volcanic Isles', color: '#e74c3c', bg: 'linear-gradient(135deg, #1a0a0a, #281410)', championBadge: 'dark_castle_key', desc: 'Islands of fire and fury. The ember dragon giggles as the world burns.' },
  { tier: 4, name: 'Dark Castle', color: '#9b59b6', bg: 'linear-gradient(135deg, #120a1a, #1a1028)', championBadge: 'dark_spire_key', desc: 'Where the blue flame burns and shadows whisper your name.' },
  { tier: 5, name: 'The Dark Spire', color: '#c0392b', bg: 'linear-gradient(135deg, #1a0505, #2a0a0a)', championBadge: 'valkin_slayer', desc: 'The final ascent. Valkin the Grand awaits.' }
];

function renderRaidLobby(userBadges) {
  const container = document.getElementById('raid-lobby');
  if (!container) return;

  const zone = RAID_ZONES[raidBookPage];
  const bosses = Object.entries(RAID_BOSSES).filter(([, b]) => b.tier === zone.tier);
  const champion = RAID_BADGES[zone.championBadge];
  const hasChampion = hasRaidBadge(userBadges, zone.championBadge);

  // Build zone tabs
  let tabsHtml = '<div class="book-tabs">';
  RAID_ZONES.forEach((z, i) => {
    const active = i === raidBookPage;
    tabsHtml += `<button class="book-tab ${active ? 'active' : ''}" style="--tab-color:${z.color}" onclick="raidBookPage=${i};showRaidLobby()">${z.name}</button>`;
  });
  tabsHtml += '</div>';

  // Build boss entries for this zone
  let bossesHtml = '';
  bosses.forEach(([raidId, boss]) => {
    const locked = boss.requiredBadge && !hasRaidBadge(userBadges, boss.requiredBadge);
    const reqBadge = boss.requiredBadge ? RAID_BADGES[boss.requiredBadge] : null;
    const defeated = userBadges.some(b => {
      const badge = RAID_BADGES[b];
      return badge && badge.boss === raidId;
    });
    const playerCount = boss.requiredPlayers || 10;

    bossesHtml += `<div class="book-boss ${locked ? 'locked' : ''} ${defeated ? 'defeated' : ''}"
                        onclick="${locked ? '' : `selectRaid('${raidId}')`}">
      <div class="book-boss-art">
        <img src="${boss.bossGhost.art}" alt="${boss.name}" onerror="this.src='../testroom/art/timber.jpg'">
        ${locked ? '<div class="book-boss-lock">&#x1F512;</div>' : ''}
        ${defeated ? '<div class="book-boss-check">&#x2714;</div>' : ''}
        <div class="book-boss-overlay">
          <div class="book-boss-name">${boss.name}</div>
          <div class="book-boss-title">${boss.title}</div>
        </div>
      </div>
      <div class="book-boss-bar">
        <div class="book-boss-meta">
          <span class="book-hp">${boss.bossGhost.maxHp} HP</span>
          <span class="book-players">${(() => { const min = boss.minPlayers || 2; if (min === playerCount) return min + ' players'; return min + '-' + playerCount + ' players'; })()}</span>
        </div>
        ${locked ? `<div class="book-boss-req">Requires: ${reqBadge?.name || boss.requiredBadge}</div>` : ''}
      </div>
    </div>`;
  });

  // Champion badge display
  const championHtml = champion ? `
    <div class="book-champion ${hasChampion ? 'earned' : ''}">
      <span class="book-champion-icon">${champion.icon}</span>
      <span class="book-champion-name">${champion.name}</span>
      ${hasChampion ? '<span class="book-champion-check">&#x2714;</span>' : '<span class="book-champion-locked">Defeat all bosses</span>'}
    </div>` : '';

  // Page navigation
  const prevBtn = raidBookPage > 0
    ? `<button class="book-nav book-prev" onclick="raidBookPage--;showRaidLobby()">&#x25C0; ${RAID_ZONES[raidBookPage - 1].name}</button>`
    : '<div></div>';
  const nextBtn = raidBookPage < RAID_ZONES.length - 1
    ? `<button class="book-nav book-next" onclick="raidBookPage++;showRaidLobby()">${RAID_ZONES[raidBookPage + 1].name} &#x25B6;</button>`
    : '<div></div>';

  container.innerHTML = `
    <h2 class="raid-section-title">SPIRIT WORLD</h2>
    ${tabsHtml}
    <div class="raid-book" style="background:${zone.bg}">
      <div class="book-page">
        <div class="book-page-header" style="border-bottom-color:${zone.color}">
          <h3 class="book-zone-name" style="color:${zone.color}">${zone.name}</h3>
          <p class="book-zone-desc">${zone.desc}</p>
        </div>
        <div class="book-bosses">${bossesHtml}</div>
        ${championHtml}
        <div class="book-page-nav">${prevBtn}${nextBtn}</div>
      </div>
      <div class="book-spine"></div>
    </div>`;
}

// ─── RAID QUEUE VIEW ────────────────────────────────────────────

let selectedRaidId = null;

function selectRaid(raidId) {
  selectedRaidId = raidId;
  const boss = RAID_BOSSES[raidId];
  if (!boss) return;

  const container = document.getElementById('raid-lobby');
  if (!container) return;

  // Use the player's current multiplayer team (already selected in collection grid)
  // `team` is the global [id, id, id] array from index.html
  raidTeamPicks = (typeof team !== 'undefined' ? team : []).filter(id => id != null);

  // Build team display from current picks
  const teamHtml = raidTeamPicks.length === 3
    ? raidTeamPicks.map(id => {
        const g = getGhost(id);
        if (!g) return '';
        return `<div class="raid-team-slot ${g.rarity}">
          <img src="${g.art}" alt="${g.name}" onerror="this.src='../testroom/art/timber.jpg'">
          <span>${g.name}</span>
        </div>`;
      }).join('')
    : '<div class="raid-team-empty">Pick your team above first!</div>';

  const hasTeam = raidTeamPicks.length === 3;

  let html = `
    <div class="raid-queue-view">
      <button class="raid-back-btn" onclick="showRaidLobby()">&#x2190; Back</button>
      <div class="raid-queue-header">
        <img class="raid-queue-boss-art" src="${boss.bossGhost.art}" alt="${boss.name}"
             onerror="this.src='../testroom/art/timber.jpg'">
        <div class="raid-queue-boss-info">
          <h2>${boss.name}</h2>
          <div class="raid-boss-title">${boss.title}</div>
          <div class="raid-boss-personality">${boss.personality.toUpperCase()} &bull; ${boss.bossGhost.maxHp} HP &bull; Tier ${boss.tier} &bull; ${boss.requiredPlayers || 10} players</div>
          <p class="raid-boss-desc">${boss.bossGhost.abilityDesc}</p>
        </div>
      </div>
      <div class="raid-queue-team">
        <h3>YOUR TEAM</h3>
        <div class="raid-team-slots">${teamHtml}</div>
        ${!hasTeam ? '<p style="color:var(--accent);font-size:0.85rem;margin-top:8px;">Select 3 Spiritkin in your collection above before joining a raid.</p>' : ''}
      </div>
      <div id="raid-queue-status" class="raid-queue-status">
        <div id="raid-queue-count">Loading queue...</div>
        <div id="raid-queue-players" class="raid-queue-players"></div>
      </div>
      <div class="raid-queue-actions">
        <button id="raid-join-btn" class="raid-join-btn" onclick="joinRaid()" ${hasTeam ? '' : 'disabled'}>
          ${hasTeam ? 'JOIN RAID' : 'SELECT A TEAM FIRST'}
        </button>
        <button id="raid-start-btn" class="raid-start-btn" onclick="startRaidFromQueue()" style="display:none">
          START RAID
        </button>
        <button id="raid-leave-btn" class="raid-leave-btn" onclick="leaveRaid()" style="display:none">
          LEAVE QUEUE
        </button>
      </div>
    </div>`;

  container.innerHTML = html;
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
  // Show initial empty state immediately (Firebase may not have this path yet)
  updateRaidQueueUI(raidId, []);
  startQueueListener(raidId);
}

function updateRaidQueueUI(raidId, entries) {
  if (raidId !== selectedRaidId) return;

  const countEl = document.getElementById('raid-queue-count');
  const playersEl = document.getElementById('raid-queue-players');
  if (!countEl || !playersEl) return;

  const bossConfig = RAID_BOSSES[raidId];
  const max = bossConfig?.requiredPlayers || RAID_CONFIG.MAX_PLAYERS;
  const minP = RAID_BOSSES[raidId]?.minPlayers || 2;
  const user = firebase.auth().currentUser;
  const inQueue = entries.some(e => e.uid === user?.uid);
  const canStart = entries.length >= minP && inQueue;

  if (entries.length === 0) {
    countEl.innerHTML = `<span style="color:var(--text-dim);">Waiting for raiders...</span>`;
  } else if (entries.length < minP) {
    countEl.innerHTML = `<span class="raid-queue-num">${entries.length}</span> / <span class="raid-queue-num">${minP}</span> raiders needed to start`;
  } else {
    countEl.innerHTML = `<span class="raid-queue-num">${entries.length}</span> Raiders ready!`;
  }

  let html = '';
  entries.forEach((e, i) => {
    const isMe = e.uid === user?.uid;
    html += `<div class="raid-queue-player ${isMe ? 'is-me' : ''}">
      <span class="raid-queue-slot">#${i + 1}</span>
      <span class="raid-queue-name">${e.displayName}${isMe ? ' (you)' : ''}</span>
    </div>`;
  });
  playersEl.innerHTML = html;

  // Show/hide buttons based on queue state
  const joinBtn = document.getElementById('raid-join-btn');
  const leaveBtn = document.getElementById('raid-leave-btn');
  const startBtn = document.getElementById('raid-start-btn');
  if (joinBtn) joinBtn.style.display = inQueue ? 'none' : '';
  if (leaveBtn) leaveBtn.style.display = inQueue ? '' : 'none';
  if (startBtn) {
    startBtn.style.display = canStart ? '' : 'none';
    startBtn.disabled = !canStart;
  }
}

async function joinRaid() {
  if (!selectedRaidId || raidTeamPicks.length !== 3) return;
  const result = await joinRaidQueue(selectedRaidId, raidTeamPicks);
  if (result.error) {
    alert(result.error);
  }
}

async function startRaidFromQueue() {
  if (!selectedRaidId) return;
  const btn = document.getElementById('raid-start-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'STARTING...'; }

  const result = await startRaidManually(selectedRaidId);
  if (result.error) {
    alert(result.error);
    if (btn) { btn.disabled = false; btn.textContent = 'START RAID'; }
    return;
  }

  // Show countdown
  const bossConfig = RAID_BOSSES[selectedRaidId];
  if (!document.getElementById('raid-launch-countdown')) {
    showRaidLaunchCountdown(bossConfig?.name || 'Boss');
  }
}

async function leaveRaid() {
  if (!selectedRaidId) return;
  await leaveRaidQueue(selectedRaidId);
  // Swap buttons back
  const joinBtn = document.getElementById('raid-join-btn');
  const leaveBtn = document.getElementById('raid-leave-btn');
  if (joinBtn) { joinBtn.style.display = ''; joinBtn.disabled = false; joinBtn.textContent = 'JOIN RAID'; }
  if (leaveBtn) leaveBtn.style.display = 'none';
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

// ─── RAID LAUNCH COUNTDOWN (Queue → Battle transition) ─────────

function showRaidLaunchCountdown(bossName) {
  const overlay = document.createElement('div');
  overlay.id = 'raid-launch-countdown';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;';
  overlay.innerHTML = `
    <div style="font-family:Creepster,cursive;font-size:1.4rem;color:#75BEEB;letter-spacing:3px;margin-bottom:8px;">RAID INCOMING</div>
    <div style="font-family:Creepster,cursive;font-size:1.2rem;color:var(--text2,#a09686);letter-spacing:2px;">${bossName}</div>
    <div id="raid-countdown-num" style="font-family:Creepster,cursive;font-size:8rem;color:#f0c560;text-shadow:0 0 40px rgba(240,197,96,0.4);transition:transform 0.3s ease;"></div>
  `;
  document.body.appendChild(overlay);

  const numEl = document.getElementById('raid-countdown-num');
  let count = 3;
  numEl.textContent = count;

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      numEl.textContent = count;
      numEl.style.transform = 'scale(1.3)';
      setTimeout(() => { numEl.style.transform = 'scale(1)'; }, 200);
    } else if (count === 0) {
      numEl.textContent = 'GO!';
      numEl.style.color = '#2ecc71';
      numEl.style.transform = 'scale(1.5)';
    } else {
      clearInterval(interval);
      // Overlay will be removed when page redirects to testroom
    }
  }, 1000);
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
  const barColor = pct > 50 ? '#2ecc71' : pct > 25 ? '#f39c12' : '#e74c3c';

  return `<div class="raid-boss-hp-container">
    <div class="raid-boss-hp-header">
      <span class="raid-boss-hp-name">${bossName}</span>
      <span class="raid-boss-hp-personality">${personality.toUpperCase()}</span>
    </div>
    <div class="raid-boss-hp-bar-bg">
      <div class="raid-boss-hp-bar-fill" style="width:${pct}%;background:${barColor}">
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
  const boss = RAID_BOSSES[raidData.raidId];
  if (!boss) return;

  // Build boss ghost data blob for the testroom to register
  const bossGhostData = enemyGhosts.map(g => ({
    id: g.id, name: g.name, maxHp: g.maxHp, art: g.art || '',
    ability: g.ability || '', abilityDesc: g.abilityDesc || '',
    rarity: g.rarity || 'legendary'
  }));

  // Calculate scaled HP based on player count
  const playerCount = raidData.players ? Object.keys(raidData.players).length : 1;
  const scaledHp = raidData.bossCurrentHp || boss.bossGhost.maxHp;
  const scaledMaxHp = raidData.bossMaxHp || boss.bossGhost.maxHp;

  // Redirect to testroom with raid params — full cinematic experience!
  const url = '../testroom/?mode=raid'
    + '&red=' + playerTeam.join(',')
    + '&blue=' + enemyGhosts.map(g => g.id).join(',')
    + '&raidId=' + encodeURIComponent(raidData.raidId)
    + '&instanceId=' + encodeURIComponent(currentRaid?.instanceId || '')
    + '&slot=' + (raidData.currentFighterIdx || 0)
    + '&bossHp=' + scaledHp
    + '&bossMaxHp=' + scaledMaxHp
    + '&bossName=' + encodeURIComponent(boss.name)
    + '&personality=' + encodeURIComponent(boss.personality)
    + '&bossData=' + encodeURIComponent(JSON.stringify(bossGhostData))
    + '&bossDialogue=' + encodeURIComponent(JSON.stringify(boss.dialogue || {}));

  window.location.href = url;
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

// =================================================================
// RAID WAITING ROOM — Social pre-fight lobby ("the poker table")
// =================================================================

let _wrTimerInterval = null;
let _wrChatListener = null;
let _wrInstanceId = null;

/**
 * Show the waiting room with all queued players, their teams, boss art, and chat.
 * Called from raid-engine after the raid instance is created.
 */
function showRaidWaitingRoom(instanceId, raidData) {
  _wrInstanceId = instanceId;
  const boss = RAID_BOSSES[raidData.raidId];
  if (!boss) return;

  const overlay = document.getElementById('raid-waiting-room');
  if (!overlay) return;

  // Fill boss header
  const bossArt = document.getElementById('raid-wr-boss-art');
  const bossName = document.getElementById('raid-wr-boss-name');
  const bossTitle = document.getElementById('raid-wr-boss-title');
  const bossQuote = document.getElementById('raid-wr-boss-quote');
  if (bossArt) { bossArt.src = boss.bossGhost.art || '../testroom/art/timber.jpg'; bossArt.alt = boss.name; }
  if (bossName) bossName.textContent = boss.name;
  if (bossTitle) bossTitle.textContent = boss.title;
  if (bossQuote) bossQuote.textContent = '"' + (boss.dialogue?.intro || 'Prepare yourselves.') + '"';

  // Render players
  renderWaitingRoomPlayers(raidData.players || {});

  // Set up reactions
  const reactionsEl = document.getElementById('raid-chat-reactions');
  if (reactionsEl) {
    reactionsEl.innerHTML = [
      { emoji: '\u2694\uFE0F', text: "Let's go!" },
      { emoji: '\uD83C\uDFB2', text: 'Nice team!' },
      { emoji: '\uD83D\uDD25', text: 'Fire!' },
      { emoji: '\uD83D\uDC80', text: 'Watch out!' },
      { emoji: '\uD83D\uDC7B', text: 'Spooky...' }
    ].map(r => `<button class="raid-chat-react-btn" onclick="sendRaidChatReaction('${r.emoji} ${r.text}')">${r.emoji} ${r.text}</button>`).join('');
  }

  // Start chat listener
  startRaidChatListener(instanceId);

  // Chat enter-key handler
  const chatInput = document.getElementById('raid-chat-input');
  if (chatInput) {
    chatInput.onkeydown = (e) => { if (e.key === 'Enter') sendRaidChat(); };
  }

  // Show overlay
  overlay.classList.add('active');

  // Auto-launch timer (15 seconds)
  let countdown = 15;
  const timerEl = document.getElementById('raid-wr-timer');
  if (timerEl) timerEl.textContent = countdown;

  if (_wrTimerInterval) clearInterval(_wrTimerInterval);
  _wrTimerInterval = setInterval(() => {
    countdown--;
    if (timerEl) timerEl.textContent = countdown;
    if (countdown <= 0) {
      clearInterval(_wrTimerInterval);
      _wrTimerInterval = null;
      launchFromWaitingRoom();
    }
  }, 1000);

  // Send system join message
  const user = firebase.auth().currentUser;
  if (user) {
    pushRaidChatMessage(instanceId, 'SYSTEM', user.displayName + ' entered the waiting room.', true);
  }
}

function renderWaitingRoomPlayers(players) {
  const container = document.getElementById('raid-wr-players');
  if (!container) return;
  const user = firebase.auth().currentUser;

  let html = '';
  Object.entries(players).forEach(([slot, p]) => {
    const isMe = p.uid === user?.uid;
    const teamHtml = (p.team || []).map(id => {
      const g = typeof getGhost === 'function' ? getGhost(id) : null;
      return g ? `<img src="${g.art}" alt="${g.name}" title="${g.name}" onerror="this.src='../testroom/art/timber.jpg'">` : '';
    }).join('');

    html += `<div class="raid-wr-player ${isMe ? 'is-me' : ''}">
      <div class="raid-wr-player-name">${p.displayName}${isMe ? ' (you)' : ''}</div>
      <div class="raid-wr-player-team">${teamHtml}</div>
      <div class="raid-wr-player-status">#${parseInt(slot) + 1}</div>
    </div>`;
  });

  container.innerHTML = html;
}

function hideRaidWaitingRoom() {
  const overlay = document.getElementById('raid-waiting-room');
  if (overlay) overlay.classList.remove('active');
  if (_wrTimerInterval) { clearInterval(_wrTimerInterval); _wrTimerInterval = null; }
  stopRaidChatListener();
}

function launchFromWaitingRoom() {
  if (_wrTimerInterval) { clearInterval(_wrTimerInterval); _wrTimerInterval = null; }

  // Disable button to prevent double-clicks
  const btn = document.getElementById('raid-wr-launch-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'LAUNCHING...'; }

  // Transition the raid from 'countdown' to 'active' in Firebase
  // This triggers handleRaidStateChange on all clients (including ours),
  // which hides the waiting room and starts the fight
  if (currentRaid && currentRaid.instanceId) {
    db.ref(`mp/raids/instances/${currentRaid.instanceId}`).update({
      status: 'active',
      startedAt: firebase.database.ServerValue.TIMESTAMP,
      fightPhase: 'fighting'
    });
    // Send launch message to chat
    pushRaidChatMessage(currentRaid.instanceId, 'SYSTEM', 'Raid launched! Entering battle...', true);
  }
}

// =================================================================
// RAID CHAT — Firebase-backed real-time messaging
// =================================================================

function startRaidChatListener(instanceId) {
  stopRaidChatListener();
  const chatRef = db.ref(`mp/raids/instances/${instanceId}/chat`);
  _wrChatListener = chatRef.orderByChild('timestamp').limitToLast(50).on('child_added', (snap) => {
    const msg = snap.val();
    if (!msg) return;
    appendChatMessage(msg.displayName, msg.message, msg.isSystem);
  });
}

function stopRaidChatListener() {
  if (_wrChatListener && _wrInstanceId) {
    db.ref(`mp/raids/instances/${_wrInstanceId}/chat`).off('child_added', _wrChatListener);
    _wrChatListener = null;
  }
}

function appendChatMessage(name, message, isSystem) {
  // Append to both waiting room and spectator chat
  ['raid-chat-messages', 'raid-spec-chat-messages'].forEach(id => {
    const container = document.getElementById(id);
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'raid-chat-msg' + (isSystem ? ' system' : '');
    div.innerHTML = `<span class="chat-name">${name}:</span> <span class="chat-text">${message}</span>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  });
}

function sendRaidChat() {
  const input = document.getElementById('raid-chat-input') || document.getElementById('raid-spec-chat-input');
  if (!input || !input.value.trim()) return;
  const instanceId = _wrInstanceId || currentRaid?.instanceId;
  if (!instanceId) return;
  const user = firebase.auth().currentUser;
  if (!user) return;
  pushRaidChatMessage(instanceId, user.displayName || 'Raider', input.value.trim(), false);
  input.value = '';
}

function sendRaidChatReaction(text) {
  const instanceId = _wrInstanceId || currentRaid?.instanceId;
  if (!instanceId) return;
  const user = firebase.auth().currentUser;
  if (!user) return;
  pushRaidChatMessage(instanceId, user.displayName || 'Raider', text, false);
}

function pushRaidChatMessage(instanceId, displayName, message, isSystem) {
  db.ref(`mp/raids/instances/${instanceId}/chat`).push({
    uid: firebase.auth().currentUser?.uid || '',
    displayName: displayName,
    message: message,
    isSystem: isSystem || false,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  });
}

// =================================================================
// RAID SPECTATOR VIEW — Live battle watching
// =================================================================

let _specBattleListener = null;

/**
 * Enhanced spectator view — shows live battle state from Firebase snapshots.
 * Called when it's NOT our turn to fight.
 */
function showRaidSpectatorOverlay(data, mySlot, currentIdx) {
  const overlay = document.getElementById('raid-spectator-overlay');
  if (!overlay) return;

  const instanceId = currentRaid?.instanceId || _wrInstanceId;
  const currentFighter = data.players?.[currentIdx];
  const boss = RAID_BOSSES[data.raidId];

  // Set fighter name
  const nameEl = document.getElementById('raid-spec-fighter-name');
  if (nameEl) nameEl.textContent = (currentFighter?.displayName || 'Raider') + ' vs ' + (boss?.name || 'Boss');

  // Initialize boss pool bar
  updateSpectatorBossPool(data.bossCurrentHp || 0, data.bossMaxHp || 1);

  // Show chat for spectators
  const chatEl = document.getElementById('raid-spec-chat');
  if (chatEl) chatEl.style.display = '';

  // Set up spectator chat reactions
  const reactionsEl = document.getElementById('raid-spec-chat-reactions');
  if (reactionsEl) {
    reactionsEl.innerHTML = [
      { emoji: '\uD83C\uDFB2', text: 'Nice roll!' },
      { emoji: '\u2694\uFE0F', text: "Let's go!" },
      { emoji: '\uD83D\uDC80', text: 'Watch out!' },
      { emoji: '\uD83D\uDD25', text: 'Fire!' },
      { emoji: '\uD83D\uDC7B', text: 'Spooky...' }
    ].map(r => `<button class="raid-chat-react-btn" onclick="sendRaidChatReaction('${r.emoji} ${r.text}')">${r.emoji} ${r.text}</button>`).join('');
  }

  // Chat input enter-key
  const chatInput = document.getElementById('raid-spec-chat-input');
  if (chatInput) {
    chatInput.onkeydown = (e) => { if (e.key === 'Enter') sendRaidChat(); };
  }

  // Start chat listener if not already active
  if (instanceId) startRaidChatListener(instanceId);

  // Start battle state listener
  startSpectatorBattleListener(instanceId);

  overlay.classList.add('active');
}

function hideRaidSpectatorOverlay() {
  const overlay = document.getElementById('raid-spectator-overlay');
  if (overlay) overlay.classList.remove('active');
  stopSpectatorBattleListener();
}

function startSpectatorBattleListener(instanceId) {
  stopSpectatorBattleListener();
  if (!instanceId) return;

  const ref = db.ref(`mp/raids/instances/${instanceId}/battleState`);
  _specBattleListener = ref.on('value', (snap) => {
    const state = snap.val();
    if (state) updateSpectatorBattleView(state);
  });
}

function stopSpectatorBattleListener() {
  if (_specBattleListener && (_wrInstanceId || currentRaid?.instanceId)) {
    const id = _wrInstanceId || currentRaid?.instanceId;
    db.ref(`mp/raids/instances/${id}/battleState`).off('value', _specBattleListener);
    _specBattleListener = null;
  }
}

/**
 * Update the spectator battle view with a new snapshot from Firebase.
 */
function updateSpectatorBattleView(snapshot) {
  if (!snapshot) return;

  const pGhost = snapshot.playerGhost || {};
  const bGhost = snapshot.bossGhost || {};
  const lastRoll = snapshot.lastRoll || {};

  // Player fighter
  const pArt = document.getElementById('raid-spec-p-art');
  const pName = document.getElementById('raid-spec-p-name');
  const pHpFill = document.getElementById('raid-spec-p-hp-fill');
  const pHpText = document.getElementById('raid-spec-p-hp-text');
  const pDice = document.getElementById('raid-spec-p-dice');

  if (pArt && pGhost.art) pArt.src = pGhost.art;
  if (pName) pName.textContent = pGhost.name || '???';
  if (pHpFill) pHpFill.style.width = ((pGhost.hp / (pGhost.maxHp || 1)) * 100) + '%';
  if (pHpText) pHpText.textContent = (pGhost.hp || 0) + '/' + (pGhost.maxHp || 0);
  if (pDice && lastRoll.player) pDice.textContent = '[' + lastRoll.player.join(', ') + ']';

  // Boss fighter
  const bArt = document.getElementById('raid-spec-b-art');
  const bName = document.getElementById('raid-spec-b-name');
  const bHpFill = document.getElementById('raid-spec-b-hp-fill');
  const bHpText = document.getElementById('raid-spec-b-hp-text');
  const bDice = document.getElementById('raid-spec-b-dice');

  if (bArt && bGhost.art) bArt.src = bGhost.art;
  if (bName) bName.textContent = bGhost.name || '???';
  if (bHpFill) bHpFill.style.width = ((bGhost.hp / (bGhost.maxHp || 1)) * 100) + '%';
  if (bHpText) bHpText.textContent = (bGhost.hp || 0) + '/' + (bGhost.maxHp || 0);
  if (bDice && lastRoll.boss) bDice.textContent = '[' + lastRoll.boss.join(', ') + ']';

  // Round
  const roundEl = document.getElementById('raid-spec-round');
  if (roundEl) roundEl.textContent = snapshot.round || 1;

  // Fighter name
  const fighterNameEl = document.getElementById('raid-spec-fighter-name');
  if (fighterNameEl) fighterNameEl.textContent = (snapshot.playerName || 'Raider') + ' vs ' + (bGhost.name || 'Boss');

  // Callout
  const calloutEl = document.getElementById('raid-spec-callout');
  if (calloutEl && lastRoll.winner) {
    const isPlayerWin = lastRoll.winner === 'player';
    calloutEl.className = 'raid-spec-callout ' + (isPlayerWin ? 'player-win' : 'boss-win');
    calloutEl.textContent = isPlayerWin
      ? (snapshot.playerName || 'Raider') + ' deals ' + (lastRoll.damage || 0) + ' damage!'
      : (bGhost.name || 'Boss') + ' deals ' + (lastRoll.damage || 0) + ' damage!';
  }
  if (calloutEl && snapshot.abilityCallout) {
    calloutEl.textContent = snapshot.abilityCallout;
  }

  // Boss pool HP
  updateSpectatorBossPool(snapshot.bossPoolHp || 0, snapshot.bossMaxHp || 1);

  // Player sideline
  const pSideline = document.getElementById('raid-spec-p-sideline');
  if (pSideline && snapshot.playerSideline) {
    pSideline.innerHTML = snapshot.playerSideline.map(g =>
      `<span class="raid-spec-sideline-ghost ${g.ko ? 'ko' : ''}">${g.name} ${g.ko ? 'KO' : g.hp + '/' + g.maxHp}</span>`
    ).join('');
  }

  // Boss sideline
  const bSideline = document.getElementById('raid-spec-b-sideline');
  if (bSideline && snapshot.bossSideline) {
    bSideline.innerHTML = snapshot.bossSideline.map(g =>
      `<span class="raid-spec-sideline-ghost ${g.ko ? 'ko' : ''}">${g.name} ${g.ko ? 'KO' : g.hp + '/' + g.maxHp}</span>`
    ).join('');
  }
}

function updateSpectatorBossPool(currentHp, maxHp) {
  const pct = Math.max(0, (currentHp / maxHp) * 100);
  const fill = document.getElementById('raid-spec-pool-fill');
  const text = document.getElementById('raid-spec-pool-text');
  const innerText = document.getElementById('raid-spec-pool-inner-text');
  if (fill) fill.style.width = pct + '%';
  if (text) text.textContent = currentHp + ' / ' + maxHp;
  if (innerText) innerText.textContent = currentHp + ' / ' + maxHp;
}

/**
 * Show post-fight results in the spectator view when a fighter finishes.
 */
function showPostFightResults(playerData, bossData) {
  const postFight = document.getElementById('raid-spec-post-fight');
  if (!postFight) return;

  const damage = playerData.damageDealt || 0;
  const won = (bossData.bossCurrentHp || 0) <= 0;
  const remaining = Math.max(0, bossData.bossCurrentHp || 0);

  postFight.style.display = 'block';
  postFight.innerHTML = `
    <div class="raid-post-fight-title ${won ? 'victory' : 'defeat'}">
      ${playerData.displayName || 'Raider'} ${won ? 'FINISHED THE BOSS!' : 'has fallen!'}
    </div>
    <div class="raid-post-fight-damage">${damage} damage dealt</div>
    <div class="raid-post-fight-hp">Boss HP: ${remaining} remaining</div>
    ${won ? '<div style="color:#2ecc71;font-family:Creepster,cursive;font-size:1.3rem;margin-top:12px;letter-spacing:3px;">RAID COMPLETE!</div>' : ''}
    ${!won && remaining > 0 ? '<div style="color:var(--text2);font-size:0.85rem;margin-top:8px;">Next fighter stepping up...</div>' : ''}
  `;
}
