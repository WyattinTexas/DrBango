// MULTIPLAYER
// Multiplayer — presence, chat, cantina, arena, guild
// Extracted from index.html — v7.1.0
// All functions and variables remain global.

function showOnlineStatus() {
  // Remove any existing status indicator
  const existing = document.getElementById('onlineStatus');
  if (existing) existing.remove();
  const existingBtn = document.getElementById('reconnectBtn');
  if (existingBtn) existingBtn.remove();

  const onlineEl = document.createElement('span');
  onlineEl.id = 'onlineStatus';
  onlineEl.style.cssText = 'font-size:10px;margin-left:8px;';
  if (window._useLocalStorage) {
    onlineEl.textContent = '\uD83D\uDD34 Offline';
    onlineEl.style.color = '#a66';
  } else {
    onlineEl.textContent = '\uD83D\uDFE2 Online';
    onlineEl.style.color = '#6a6';
  }
  document.querySelector('#hud .hud-left')?.appendChild(onlineEl);

  // Add reconnect button when offline
  if (window._useLocalStorage) {
    const reconnBtn = document.createElement('button');
    reconnBtn.id = 'reconnectBtn';
    reconnBtn.className = 'hud-btn';
    reconnBtn.textContent = '\uD83D\uDD04 Reconnect';
    reconnBtn.onclick = async () => {
      if (typeof firebase === 'undefined' || !firebase.auth) {
        notify('Firebase SDK not loaded. Refresh the page to try again.');
        return;
      }
      notify('Attempting to reconnect...');
      try {
        const result = await firebase.auth().signInAnonymously();
        uid = result.user.uid;
        window._useLocalStorage = false;
        showOnlineStatus();
        startPresence();
        initPartySystem();
        startWorldBossListener();
        loadPlayerTraps();
        loadAllTraps();
        notify('Connected! Multiplayer features enabled.');
      } catch(e) {
        notify('Still offline. Check Firebase console — anonymous auth may be disabled.');
      }
    };
    document.querySelector('#hud .hud-right')?.appendChild(reconnBtn);
  }
}


let _presenceIntervalId = null;
let _autoSaveIntervalId = null;

function startPresence() {
  if (!uid) return;
  if (window._useLocalStorage) return; // No multiplayer in offline mode

  // Clear any existing intervals from a previous connection to prevent duplicates
  if (_presenceIntervalId) { clearInterval(_presenceIntervalId); _presenceIntervalId = null; }
  if (_autoSaveIntervalId) { clearInterval(_autoSaveIntervalId); _autoSaveIntervalId = null; }

  // Detach old listeners before re-attaching
  db.ref('overworld/presence').off('value');
  db.ref('overworld/chat').off('child_added');

  // Write presence
  const presRef = db.ref(`overworld/presence/${uid}`);
  presRef.set({
    name: G.name,
    discipline: G.discipline,
    level: G.level,
    x: G.x,
    y: G.y,
    team: G.team.map(g => ({ id: g.id, name: g.name })),
    gear: G.gear.map(g => ({ name: g.name, craftedBy: g.craftedBy })),
    mastery: G.mastery,
    titles: G.titles || [],
    sprite: G.sprite || 1,
    direction: G.direction || 'down',
    guild: G.guild || null,
  });

  // Disconnect cleanup
  presRef.onDisconnect().remove();

  // Update position periodically (2s instead of 500ms to reduce Firebase writes)
  _presenceIntervalId = setInterval(() => {
    if (!uid || G.inBattle || window._useLocalStorage) return;
    presRef.update({
      x: Math.round(G.x * 10) / 10,
      y: Math.round(G.y * 10) / 10,
      level: G.level,
      sprite: G.sprite || 1,
      direction: G.direction || 'down',
    });
  }, 2000);

  // Auto-save every 30s
  _autoSaveIntervalId = setInterval(saveGame, 30000);

  // Listen for other players
  db.ref('overworld/presence').on('value', snap => {
    const data = snap.val() || {};
    otherPlayers = data;
    document.getElementById('hudPlayers').textContent = Object.keys(data).length;
  });

  // Listen for chat
  db.ref('overworld/chat').orderByChild('ts').limitToLast(20).on('child_added', snap => {
    const msg = snap.val();
    if (msg && msg.ts > Date.now() - 60000) {
      addChatMessage(msg.sender, msg.text);
    }
  });
}

// ═══════ CHAT ═══════


function addChatMessage(sender, text) {
  const el = document.getElementById('chatMessages');
  const div = document.createElement('div');
  if (sender === 'system' && text.includes('tipped')) {
    div.className = 'chat-tip';
    div.textContent = text;
  } else if (sender === 'system') {
    div.className = 'chat-system';
    div.textContent = text;
  } else {
    div.className = 'chat-msg';
    // Guild members show in gold
    const isGuildMember = G.guild && sender.startsWith(`[${G.guild.tag}]`);
    const senderColor = isGuildMember ? 'color:#daa520;' : '';
    const senderSpan = document.createElement('span');
    senderSpan.className = 'sender';
    if (senderColor) senderSpan.style.cssText = senderColor;
    senderSpan.textContent = sender + ':';
    const textSpan = document.createElement('span');
    textSpan.className = 'text';
    textSpan.textContent = ' ' + text;
    div.appendChild(senderSpan);
    div.appendChild(textSpan);
  }
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;

  // Cap messages
  while (el.children.length > 50) el.removeChild(el.firstChild);
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  // Check for /help command
  if (text.toLowerCase() === '/help') {
    input.value = '';
    addChatMessage('system', 'Commands: /tip [name] [amount] — Send coins | /wave /cheer /craft /sit /dance — Emotes | /help — This message');
    input.blur();
    return;
  }

  // Check for /tip command
  if (text.toLowerCase().startsWith('/tip')) {
    input.value = '';
    processTipCommand(text);
    input.blur();
    return;
  }

  const title = getHighestTitle();
  const guildPrefix = G.guild ? `[${G.guild.tag}] ` : '';
  const senderName = guildPrefix + (title ? `[${title}] ${G.name}` : G.name);

  // Check if this is an emote command
  const isEmote = ['/wave','/cheer','/craft','/sit','/dance'].includes(text.toLowerCase());

  if (!window._useLocalStorage) {
    db.ref('overworld/chat').push({
      sender: senderName,
      text: text.slice(0, 200),
      ts: firebase.database.ServerValue.TIMESTAMP,
    });
  } else {
    // Show locally in offline mode
    addChatMessage(senderName, text.slice(0, 200));
  }

  // Profession XP: charisma
  addProfessionXP('charisma', isEmote ? 3 : 1);

  input.value = '';
}

// ═══════ CANTINA SYSTEM ═══════

let cantinaOpen = false;

function openCantina() {
  cantinaOpen = true;
  document.getElementById('cantinaOverlay').classList.add('active');
  renderCantinaPatrons();
  // Load recent cantina chat
  loadCantinaChatHistory();
}

function closeCantina() {
  cantinaOpen = false;
  document.getElementById('cantinaOverlay').classList.remove('active');
}

function renderCantinaPatrons() {
  const patronsEl = document.getElementById('cantinaPatrons');
  const hubX = HUB.x, hubY = HUB.y;
  const cantinaX = hubX + 3.5, cantinaY = hubY + 5;
  let patrons = [];
  for (const [pid, p] of Object.entries(otherPlayers)) {
    if (pid === uid) continue;
    const dist = Math.sqrt((p.x - cantinaX) ** 2 + (p.y - cantinaY) ** 2);
    if (dist < 4) {
      patrons.push(p.name || '???');
    }
  }
  if (patrons.length === 0) {
    patronsEl.innerHTML = 'Just you here... pull up a chair.';
  } else {
    patronsEl.innerHTML = patrons.map(n => `<span class="patron">${n}</span>`).join('');
  }
}

function loadCantinaChatHistory() {
  const chatEl = document.getElementById('cantinaChatMessages');
  chatEl.innerHTML = '';
  if (window._useLocalStorage) {
    chatEl.innerHTML = '<div class="chat-system" style="color:#555;">Cantina chat unavailable offline.</div>';
    return;
  }
  db.ref('overworld/cantina_chat').orderByChild('ts').limitToLast(30).once('value').then(snap => {
    const msgs = snap.val();
    if (!msgs) return;
    Object.values(msgs).sort((a,b) => (a.ts||0) - (b.ts||0)).forEach(msg => {
      addCantinaChatMsg(msg.sender, msg.text, msg.emote);
    });
  });
  // Listen for new messages
  db.ref('overworld/cantina_chat').orderByChild('ts').limitToLast(1).on('child_added', snap => {
    const msg = snap.val();
    if (msg && msg.ts > Date.now() - 60000) {
      addCantinaChatMsg(msg.sender, msg.text, msg.emote);
    }
  });
}

function addCantinaChatMsg(sender, text, isEmote) {
  const chatEl = document.getElementById('cantinaChatMessages');
  const div = document.createElement('div');
  if (isEmote) {
    div.className = 'chat-emote';
    div.textContent = text;
  } else {
    div.className = 'chat-msg';
    const senderSpan = document.createElement('span');
    senderSpan.className = 'sender';
    senderSpan.textContent = sender + ':';
    const textSpan = document.createElement('span');
    textSpan.className = 'text';
    textSpan.textContent = ' ' + text;
    div.appendChild(senderSpan);
    div.appendChild(textSpan);
  }
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
  while (chatEl.children.length > 60) chatEl.removeChild(chatEl.firstChild);
}

const CANTINA_EMOTES = {
  '/wave': { emoji: '\u{1F44B}', action: 'waves!' },
  '/cheer': { emoji: '\u{1F389}', action: 'cheers!' },
  '/craft': { emoji: '\u{1F528}', action: 'brandishes their crafting hammer!' },
  '/sit': { emoji: '\u{1FA91}', action: 'sits down.' },
  '/dance': { emoji: '\u{1F57A}', action: 'dances!' },
};

function sendCantinaChat() {
  if (window._useLocalStorage) { notify('Cantina chat requires an online connection.'); return; }
  const input = document.getElementById('cantinaChatInput');
  const text = input.value.trim();
  if (!text) return;

  const title = getHighestTitle();
  const senderName = title ? `[${title}] ${G.name}` : G.name;

  // Check for emotes
  const emoteCmd = text.toLowerCase();
  const emote = CANTINA_EMOTES[emoteCmd];
  if (emote) {
    db.ref('overworld/cantina_chat').push({
      sender: senderName,
      text: `${emote.emoji} ${senderName} ${emote.action}`,
      emote: true,
      ts: firebase.database.ServerValue.TIMESTAMP,
    });
    addProfessionXP('charisma', 3); // emote in cantina
  } else {
    db.ref('overworld/cantina_chat').push({
      sender: senderName,
      text: text.slice(0, 200),
      emote: false,
      ts: firebase.database.ServerValue.TIMESTAMP,
    });
    addProfessionXP('charisma', 1); // cantina chat
  }

  input.value = '';
}

// Periodically update cantina patrons if open
setInterval(() => {
  if (cantinaOpen) renderCantinaPatrons();
}, 3000);

// Periodically update time of day in HUD + wind volume
setInterval(() => {
  const todEl = document.getElementById('hudTimeOfDay');
  if (todEl) todEl.textContent = getTimeIcon(getTimeOfDay().phase);
  SFX.updateWindVolume();
}, 5000);

// ═══════ RESIZE ═══════

let arenaTab = 'challenge';
let arenaListeners = [];

function openArena() {
  if (window._useLocalStorage) { notify('Arena requires an online connection.'); return; }
  document.getElementById('arenaOverlay').classList.add('active');
  arenaTab = 'challenge';
  document.getElementById('arenaTabChallenge').classList.add('active');
  document.getElementById('arenaTabLeaderboard').classList.remove('active');
  // Clean up stale challenges on open
  cleanStaleArenaChallenges();
  renderArena();
  listenForChallenges();
  // Start countdown timer refresh
  if (window._arenaChallengeTimer) clearInterval(window._arenaChallengeTimer);
  window._arenaChallengeTimer = setInterval(() => {
    if (document.getElementById('arenaOverlay').classList.contains('active') && arenaTab === 'challenge') {
      updateArenaChallengeCountdowns();
    }
  }, 1000);
}

function cleanStaleArenaChallenges() {
  if (window._useLocalStorage) return;
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  db.ref('overworld/arena').orderByChild('status').equalTo('pending').once('value').then(snap => {
    const challenges = snap.val() || {};
    for (const [cid, ch] of Object.entries(challenges)) {
      if (ch.createdAt && ch.createdAt < fiveMinAgo) {
        db.ref(`overworld/arena/${cid}`).update({ status: 'expired' });
        // Clean up after marking expired
        setTimeout(() => db.ref(`overworld/arena/${cid}`).remove(), 5000);
      }
    }
  });
}

function updateArenaChallengeCountdowns() {
  const countdownEls = document.querySelectorAll('[data-challenge-created]');
  const now = Date.now();
  countdownEls.forEach(el => {
    const created = parseInt(el.dataset.challengeCreated);
    const expiresAt = created + 5 * 60 * 1000;
    const remaining = Math.max(0, expiresAt - now);
    if (remaining <= 0) {
      el.textContent = 'Expired';
      el.style.color = '#f44';
      // Auto-refresh arena to clear expired
      renderArena();
    } else {
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      el.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  });
}

function closeArena() {
  document.getElementById('arenaOverlay').classList.remove('active');
  // Clean up listeners
  arenaListeners.forEach(ref => ref.off());
  arenaListeners = [];
  // Clean up countdown timer
  if (window._arenaChallengeTimer) { clearInterval(window._arenaChallengeTimer); window._arenaChallengeTimer = null; }
}

function switchArenaTab(tab) {
  arenaTab = tab;
  document.getElementById('arenaTabChallenge').classList.toggle('active', tab === 'challenge');
  document.getElementById('arenaTabLeaderboard').classList.toggle('active', tab === 'leaderboard');
  renderArena();
}

function listenForChallenges() {
  // Listen for challenges directed at us
  const ref = db.ref('overworld/arena').orderByChild('status').equalTo('pending');
  ref.on('value', snap => {
    renderArena();
  });
  arenaListeners.push(ref);
}

function renderArena() {
  const content = document.getElementById('arenaContent');

  if (arenaTab === 'challenge') {
    let html = '';

    // Pending challenges TO me
    html += '<h3 style="color:#daa520;font-size:12px;text-transform:uppercase;margin-bottom:6px;">Incoming Challenges</h3>';
    db.ref('overworld/arena').orderByChild('status').equalTo('pending').once('value').then(snap => {
      const challenges = snap.val() || {};
      let pendingHtml = '';
      let hasPending = false;
      const now = Date.now();
      const fiveMin = 5 * 60 * 1000;
      for (const [cid, ch] of Object.entries(challenges)) {
        // Auto-decline stale challenges
        if (ch.createdAt && ch.createdAt < now - fiveMin) {
          db.ref(`overworld/arena/${cid}`).remove();
          continue;
        }
        if (ch.defenderUid === uid) {
          hasPending = true;
          pendingHtml += `<div class="arena-pending">
            <div>
              <div class="ap-name">${ch.challenger.name} challenges you!</div>
              <div class="ap-detail">Wager: ${ch.wager} coins | Team: ${ch.challenger.team.map(t=>t.name).join(', ')}</div>
              <div class="ap-detail" style="color:#daa520;">Expires in: <span data-challenge-created="${ch.createdAt || now}" style="color:#ff8;">--:--</span></div>
            </div>
            <div>
              <button class="arena-accept-btn" onclick="acceptArenaChallenge('${cid}')">Accept</button>
              <button class="arena-decline-btn" onclick="declineArenaChallenge('${cid}')">Decline</button>
            </div>
          </div>`;
        }
        // Show challenges sent BY me with cancel button
        if (ch.challenger && ch.challenger.uid === uid) {
          hasPending = true;
          const targetName = otherPlayers[ch.defenderUid]?.name || 'Unknown';
          pendingHtml += `<div class="arena-pending" style="border-color:#555;">
            <div>
              <div class="ap-name" style="color:#8cf;">Awaiting ${targetName}...</div>
              <div class="ap-detail">Wager: ${ch.wager} coins</div>
              <div class="ap-detail" style="color:#daa520;">Expires in: <span data-challenge-created="${ch.createdAt || now}" style="color:#ff8;">--:--</span></div>
            </div>
            <div>
              <button class="arena-decline-btn" onclick="cancelArenaChallenge('${cid}')">Cancel</button>
            </div>
          </div>`;
        }
      }
      const pendingEl = document.getElementById('arenaPendingList');
      if (pendingEl) pendingEl.innerHTML = hasPending ? pendingHtml : '<p style="color:#555;font-size:11px;">No incoming challenges.</p>';
    });

    html += '<div id="arenaPendingList"><p style="color:#555;font-size:11px;">Loading...</p></div>';

    // Nearby players to challenge
    html += '<h3 style="color:#c8a0ff;font-size:12px;text-transform:uppercase;margin:12px 0 6px;">Nearby Wardens</h3>';
    let nearbyHtml = '';
    let hasNearby = false;
    for (const [pid, p] of Object.entries(otherPlayers)) {
      if (pid === uid) continue;
      // Hub proximity: y < 15 means near hub
      if (p.y < 15) {
        hasNearby = true;
        const disc = DISCIPLINES.find(d => d.id === p.discipline)?.name || '?';
        nearbyHtml += `<div class="arena-player-row">
          <div class="ap-info">
            <div class="ap-name">${p.name || '???'}</div>
            <div class="ap-detail">Lv.${p.level || 1} ${disc} | Team: ${(p.team || []).map(t=>t.name).join(', ') || 'Unknown'}</div>
          </div>
          <button class="arena-challenge-btn" onclick="sendArenaChallenge('${pid}')">Challenge (5 coins)</button>
        </div>`;
      }
    }
    if (!hasNearby) {
      nearbyHtml = '<p style="color:#555;font-size:11px;text-align:center;padding:12px;">No other wardens nearby. Invite friends!</p>';
    }
    html += nearbyHtml;

    // My arena record
    html += `<div style="text-align:center;margin-top:12px;font-size:12px;color:#888;">
      Your Record: <span style="color:#4f8;">${G.rep?.arenaWins || 0}W</span> / <span style="color:#f88;">${G.rep?.arenaLosses || 0}L</span>
    </div>`;

    content.innerHTML = html;

  } else if (arenaTab === 'leaderboard') {
    content.innerHTML = '<p style="color:#555;font-size:11px;text-align:center;">Loading leaderboard...</p>';
    db.ref('overworld/arena_stats').orderByChild('wins').limitToLast(10).once('value').then(snap => {
      const stats = snap.val() || {};
      const sorted = Object.entries(stats).map(([uid2, s]) => ({ uid: uid2, ...s }))
        .sort((a, b) => (b.wins || 0) - (a.wins || 0));

      if (sorted.length === 0) {
        content.innerHTML = '<p style="color:#555;font-size:11px;text-align:center;padding:20px;">No arena battles yet. Be the first champion!</p>';
        return;
      }

      let html = '';
      sorted.forEach((s, i) => {
        const medal = i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : `#${i+1}`;
        html += `<div class="arena-leaderboard-row">
          <span class="rank">${medal}</span>
          <span class="lb-name">${s.name || 'Unknown'}</span>
          <span class="lb-stats">${s.wins || 0}W / ${s.losses || 0}L</span>
        </div>`;
      });
      content.innerHTML = html;
    });
  }
}

function sendArenaChallenge(targetUid) {
  if (window._useLocalStorage) { notify('Arena requires an online connection.'); return; }
  if (G.coins < 5) { notify('Need 5 coins to wager!'); return; }
  if (G.team.length === 0) { notify('You need a team first!'); return; }

  const targetPlayer = otherPlayers[targetUid];
  if (!targetPlayer) { notify('Player not found.'); return; }

  const challengeId = uid + '_' + Date.now();
  const challengeData = {
    challenger: {
      uid: uid,
      name: G.name,
      team: G.team.map(t => ({ id: t.id, name: t.name, hp: t.hp, maxHp: t.maxHp, ability: t.ability, rarity: t.rarity })),
    },
    defenderUid: targetUid,
    defender: null,
    status: 'pending',
    wager: 5,
    round: 0,
    createdAt: firebase.database.ServerValue.TIMESTAMP,
  };

  db.ref(`overworld/arena/${challengeId}`).set(challengeData);
  notify(`Challenge sent to ${targetPlayer.name}! (5 coin wager)`);
  renderArena();
}

function acceptArenaChallenge(challengeId) {
  if (G.coins < 5) { notify('Need 5 coins to accept!'); return; }
  if (G.team.length === 0) { notify('You need a team first!'); return; }

  db.ref(`overworld/arena/${challengeId}`).once('value').then(snap => {
    const ch = snap.val();
    if (!ch || ch.status !== 'pending') { notify('Challenge expired.'); return; }

    // Write defender data
    const defenderData = {
      uid: uid,
      name: G.name,
      team: G.team.map(t => ({ id: t.id, name: t.name, hp: t.hp, maxHp: t.maxHp, ability: t.ability, rarity: t.rarity })),
    };

    db.ref(`overworld/arena/${challengeId}`).update({
      defender: defenderData,
      status: 'active',
    });

    // Simulate the battle
    simulateArenaBattle(challengeId, ch.challenger, defenderData, ch.wager);
  });
}

function declineArenaChallenge(challengeId) {
  db.ref(`overworld/arena/${challengeId}`).remove();
  notify('Challenge declined.');
  renderArena();
}

function cancelArenaChallenge(challengeId) {
  db.ref(`overworld/arena/${challengeId}`).remove();
  notify('Challenge cancelled.');
  renderArena();
}

function simulateArenaBattle(challengeId, challenger, defender, wager) {
  // Clone teams
  const cTeam = challenger.team.map(t => ({ ...t, ko: false }));
  const dTeam = defender.team.map(t => ({ ...t, ko: false }));

  let cActive = cTeam.find(t => !t.ko) || cTeam[0];
  let dActive = dTeam.find(t => !t.ko) || dTeam[0];

  const log = [];
  let round = 1;
  const maxRounds = 30;

  log.push(`${challenger.name}'s ${cActive.name} vs ${defender.name}'s ${dActive.name}!`);

  while (round <= maxRounds) {
    const cDice = rollDice(3);
    const dDice = rollDice(3);
    const cRoll = classify(cDice);
    const dRoll = classify(dDice);
    const winner = compareRolls(cRoll, dRoll);

    log.push(`R${round}: ${cActive.name} [${cDice.join(',')}] ${cRoll.type} vs ${dActive.name} [${dDice.join(',')}] ${dRoll.type}`);

    if (winner === 'a') {
      dActive.hp = Math.max(0, dActive.hp - cRoll.damage);
      log.push(`  ${cActive.name} deals ${cRoll.damage} damage!`);
      if (dActive.hp <= 0) {
        dActive.ko = true;
        log.push(`  ${dActive.name} is KO'd!`);
        const next = dTeam.find(t => !t.ko);
        if (!next) break;
        dActive = next;
        log.push(`  ${defender.name} sends out ${dActive.name}!`);
      }
    } else if (winner === 'b') {
      cActive.hp = Math.max(0, cActive.hp - dRoll.damage);
      log.push(`  ${dActive.name} deals ${dRoll.damage} damage!`);
      if (cActive.hp <= 0) {
        cActive.ko = true;
        log.push(`  ${cActive.name} is KO'd!`);
        const next = cTeam.find(t => !t.ko);
        if (!next) break;
        cActive = next;
        log.push(`  ${challenger.name} sends out ${cActive.name}!`);
      }
    } else {
      log.push(`  Tie!`);
    }
    round++;
  }

  // Determine winner — total remaining HP breaks ties when alive counts are equal
  const cAlive = cTeam.filter(t => !t.ko).length;
  const dAlive = dTeam.filter(t => !t.ko).length;
  let challengerWins;
  if (cAlive !== dAlive) {
    challengerWins = cAlive > dAlive;
  } else {
    // Tiebreaker: total remaining HP
    const cHp = cTeam.filter(t => !t.ko).reduce((s, t) => s + t.hp, 0);
    const dHp = dTeam.filter(t => !t.ko).reduce((s, t) => s + t.hp, 0);
    challengerWins = cHp >= dHp; // challenger wins ties (slight advantage for aggressor)
  }
  const winnerName = challengerWins ? challenger.name : defender.name;
  const loserName = challengerWins ? defender.name : challenger.name;

  log.push(`--- ${winnerName} WINS! ---`);

  // Determine if WE won (we are the defender)
  const weWon = !challengerWins;

  if (weWon) {
    G.coins += wager;
    if (!G.rep) G.rep = {};
    G.rep.arenaWins = (G.rep.arenaWins || 0) + 1;
    notify(`Arena Victory! +${wager} coins!`);
    SFX.victory();
  } else {
    G.coins = Math.max(0, G.coins - wager);
    if (!G.rep) G.rep = {};
    G.rep.arenaLosses = (G.rep.arenaLosses || 0) + 1;
    notify(`Arena Defeat. -${wager} coins.`);
    SFX.defeat();
  }

  // Update arena stats in Firebase
  db.ref(`overworld/arena_stats/${uid}`).set({
    name: G.name,
    wins: G.rep.arenaWins || 0,
    losses: G.rep.arenaLosses || 0,
  });

  // Also update challenger stats (increment win/loss)
  db.ref(`overworld/arena_stats/${challenger.uid}`).once('value').then(snap => {
    const existing = snap.val() || { name: challenger.name, wins: 0, losses: 0 };
    if (challengerWins) {
      existing.wins = (existing.wins || 0) + 1;
    } else {
      existing.losses = (existing.losses || 0) + 1;
    }
    existing.name = challenger.name;
    db.ref(`overworld/arena_stats/${challenger.uid}`).set(existing);
  });

  // Save result
  db.ref(`overworld/arena/${challengeId}`).update({
    status: 'resolved',
    winner: challengerWins ? 'challenger' : 'defender',
    winnerName,
    log: log,
    resolvedAt: firebase.database.ServerValue.TIMESTAMP,
  });

  saveGame();
  updateHUD();

  // Show result in arena UI
  const content = document.getElementById('arenaContent');
  content.innerHTML = `
    <h3 style="color:${weWon ? '#4f8' : '#f88'};text-align:center;font-size:16px;margin-bottom:8px;">
      ${weWon ? 'VICTORY!' : 'DEFEAT'}
    </h3>
    <p style="text-align:center;font-size:13px;color:#ccc;margin-bottom:8px;">
      ${winnerName} defeated ${loserName}! ${weWon ? `+${wager}` : `-${wager}`} coins.
    </p>
    <div class="arena-result-log">${log.map(l => `<div style="color:${l.includes('deals') ? '#f84' : l.includes('KO') ? '#f44' : l.includes('WINS') ? '#4f8' : '#aaa'}">${l}</div>`).join('')}</div>
    <button class="arena-challenge-btn" style="display:block;margin:8px auto;" onclick="renderArena()">Back to Arena</button>
  `;
}

// Clean up old arena challenges (older than 5 minutes)
function cleanOldArenaChallenges() {
  if (window._useLocalStorage) return;
  db.ref('overworld/arena').once('value').then(snap => {
    const challenges = snap.val() || {};
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    for (const [cid, ch] of Object.entries(challenges)) {
      if (ch.status === 'pending' && ch.createdAt && ch.createdAt < fiveMinAgo) {
        db.ref(`overworld/arena/${cid}`).remove();
      }
      if (ch.status === 'resolved' && ch.resolvedAt && ch.resolvedAt < fiveMinAgo) {
        db.ref(`overworld/arena/${cid}`).remove();
      }
    }
  });
}
setInterval(cleanOldArenaChallenges, 60000);


// ═══════ GUILD SYSTEM ═══════

function toggleGuildPanel() {
  const panel = document.getElementById('guildPanel');
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) renderGuildPanel();
}

function renderGuildPanel() {
  const content = document.getElementById('guildPanelContent');

  if (!G.guild) {
    content.innerHTML = `
      <p style="color:#888;font-size:12px;text-align:center;margin-bottom:16px;">You are not in a guild.</p>
      <button class="btn-primary" onclick="openGuildCreate()">Create Guild (50 coins)</button>
    `;
    return;
  }

  if (window._useLocalStorage) {
    content.innerHTML = `
      <div style="text-align:center;margin-bottom:12px;">
        <span class="guild-tag">[${G.guild.tag}]</span>
        <span style="font-size:16px;font-weight:bold;color:#fff;margin-left:4px;">${G.guild.name}</span>
      </div>
      <p style="color:#555;font-size:12px;text-align:center;">Guild details unavailable offline.</p>
    `;
    return;
  }

  // Fetch guild data from Firebase
  db.ref(`overworld/guilds/${G.guild.id}`).once('value').then(snap => {
    const guild = snap.val();
    if (!guild) {
      G.guild = null;
      renderGuildPanel();
      return;
    }

    let html = `
      <div style="text-align:center;margin-bottom:12px;">
        <span class="guild-tag">[${guild.tag}]</span>
        <span style="font-size:16px;font-weight:bold;color:#fff;margin-left:4px;">${guild.name}</span>
      </div>
      <h3 style="font-size:12px;">Members</h3>
    `;

    const members = guild.members || {};
    const sortedMembers = Object.entries(members).sort((a, b) => {
      if (a[1].role === 'leader') return -1;
      if (b[1].role === 'leader') return 1;
      return (a[1].joined || 0) - (b[1].joined || 0);
    });

    for (const [mUid, member] of sortedMembers) {
      const isLeader = member.role === 'leader';
      html += `<div class="guild-member-row${isLeader ? ' leader' : ''}">
        <span class="gm-name">${isLeader ? '\u{1F451} ' : ''}${member.name}</span>
        <span class="gm-role">${member.role}</span>
      </div>`;
    }

    html += '<div style="margin-top:16px;text-align:center;">';
    if (G.guild.role === 'leader') {
      html += '<button class="btn-primary" style="background:#3a1a1a;border-color:#6a3a3a;font-size:12px;padding:8px 16px;" onclick="disbandGuild()">Disband Guild</button>';
    } else {
      html += '<button class="btn-primary" style="background:#3a1a1a;border-color:#6a3a3a;font-size:12px;padding:8px 16px;" onclick="leaveGuild()">Leave Guild</button>';
    }
    html += '</div>';

    content.innerHTML = html;
  });
}

function renderInventoryGuildInfo() {
  const el = document.getElementById('inventoryGuildInfo');
  if (!el) return;
  if (!G.guild) {
    el.innerHTML = '<p style="color:#555;font-size:12px;">Not in a guild. <span style="color:#8cf;cursor:pointer;text-decoration:underline;" onclick="openGuildCreate()">Create one</span></p>';
  } else {
    el.innerHTML = `<div class="essence-item"><span class="guild-tag">[${G.guild.tag}]</span> <span style="color:#fff;font-weight:bold;">${G.guild.name}</span><br><span style="font-size:10px;color:#888;">Role: ${G.guild.role}</span></div>`;
  }
}

function openGuildCreate() {
  if (G.guild) {
    notify('You are already in a guild!');
    return;
  }
  if (G.coins < 50) {
    notify('Need 50 coins to create a guild!');
    return;
  }
  document.getElementById('guildNameInput').value = '';
  document.getElementById('guildTagInput').value = '';
  document.getElementById('guildCreateOverlay').classList.add('active');
}

function closeGuildCreate() {
  document.getElementById('guildCreateOverlay').classList.remove('active');
}

function confirmCreateGuild() {
  if (window._useLocalStorage) { notify('Guilds require an online connection.'); return; }
  const name = document.getElementById('guildNameInput').value.trim();
  const tag = document.getElementById('guildTagInput').value.trim().toUpperCase();

  if (!name || name.length < 2 || name.length > 20) {
    notify('Guild name must be 2-20 characters.');
    return;
  }
  if (!tag || tag.length < 1 || tag.length > 4) {
    notify('Guild tag must be 1-4 characters.');
    return;
  }
  if (G.coins < 50) {
    notify('Need 50 coins to create a guild!');
    return;
  }

  G.coins -= 50;

  const guildId = uid + '_' + Date.now();
  const guildData = {
    name: name,
    tag: tag,
    leader: uid,
    members: {
      [uid]: { name: G.name, role: 'leader', joined: Date.now() },
    },
    createdAt: Date.now(),
  };

  db.ref(`overworld/guilds/${guildId}`).set(guildData);

  G.guild = { id: guildId, name: name, tag: tag, role: 'leader' };

  closeGuildCreate();
  updateHUD();
  addProfessionXP('charisma', 10); // guild creation
  saveGame();
  notify(`Guild [${tag}] ${name} created!`);
  renderGuildPanel();
}

function inviteToGuild(targetUid, targetName) {
  if (window._useLocalStorage) { notify('Guild invites require an online connection.'); return; }
  if (!G.guild) { notify('You are not in a guild!'); return; }

  // Write invitation to Firebase
  db.ref(`overworld/guild_invites/${targetUid}/${G.guild.id}`).set({
    guildId: G.guild.id,
    guildName: G.guild.name,
    guildTag: G.guild.tag,
    invitedBy: G.name,
    invitedAt: Date.now(),
  });

  addProfessionXP('charisma', 10); // guild invite
  notify(`Guild invite sent to ${targetName}!`);
}

function acceptGuildInvite(guildId) {
  if (window._useLocalStorage) { notify('Cannot accept guild invites while offline.'); return; }
  if (G.guild) { notify('Leave your current guild first!'); return; }

  db.ref(`overworld/guilds/${guildId}`).once('value').then(snap => {
    const guild = snap.val();
    if (!guild) { notify('Guild no longer exists.'); return; }

    // Add ourselves as member
    db.ref(`overworld/guilds/${guildId}/members/${uid}`).set({
      name: G.name,
      role: 'member',
      joined: Date.now(),
    });

    G.guild = { id: guildId, name: guild.name, tag: guild.tag, role: 'member' };

    // Remove invite
    db.ref(`overworld/guild_invites/${uid}/${guildId}`).remove();

    saveGame();
    updateHUD();
    notify(`Joined guild [${guild.tag}] ${guild.name}!`);
    renderGuildPanel();
  });
}

function leaveGuild() {
  if (!G.guild) return;
  if (window._useLocalStorage) { notify('Cannot leave guild while offline.'); return; }

  db.ref(`overworld/guilds/${G.guild.id}/members/${uid}`).remove();
  notify(`Left guild [${G.guild.tag}] ${G.guild.name}.`);
  G.guild = null;
  saveGame();
  updateHUD();
  renderGuildPanel();
}

function disbandGuild() {
  if (!G.guild || G.guild.role !== 'leader') return;
  if (window._useLocalStorage) { notify('Cannot disband guild while offline.'); return; }

  db.ref(`overworld/guilds/${G.guild.id}`).remove();
  notify(`Guild [${G.guild.tag}] ${G.guild.name} disbanded.`);

  // Push a chat message
  addChatMessage('system', `Guild [${G.guild.tag}] ${G.guild.name} has been disbanded.`);

  G.guild = null;
  saveGame();
  updateHUD();
  renderGuildPanel();
}

function checkGuildInvites() {
  if (!uid || G.guild || window._useLocalStorage) return;
  db.ref(`overworld/guild_invites/${uid}`).once('value').then(snap => {
    const invites = snap.val();
    if (!invites) return;
    for (const [guildId, invite] of Object.entries(invites)) {
      // Auto-show notification for pending invites
      notify(`Guild invite from ${invite.invitedBy}: [${invite.guildTag}] ${invite.guildName}. Open inventory to accept.`);
    }
  });
}

function getDisplayName() {
  if (G.guild) {
    return `[${G.guild.tag}] ${G.name}`;
  }
  return G.name;
}

// ═══════ PARTY SYSTEM ═══════

// Initialize party state on G if not present
function initParty() {
  if (!G.party) {
    G.party = { id: null, members: [], invites: [] };
  }
}

function isInParty() {
  return G.party && G.party.id && G.party.members && G.party.members.length > 1;
}

function sendPartyInvite(targetUid, targetName) {
  if (window._useLocalStorage) { notify('Party system requires an online connection.'); return; }
  if (!uid) return;
  initParty();

  // Create party if we don't have one
  if (!G.party.id) {
    G.party.id = uid;
    G.party.members = [{ uid: uid, name: G.name }];
    db.ref(`overworld/parties/${uid}`).set({
      leader: uid,
      members: { [uid]: { name: G.name, x: G.x, y: G.y } },
      createdAt: firebase.database.ServerValue.TIMESTAMP,
    });
  }

  // Max party size of 4
  if (G.party.members.length >= 4) {
    notify('Party is full! (max 4)');
    return;
  }

  // Don't send duplicate invites
  if (G.party.invites.includes(targetUid)) {
    notify('Already invited ' + targetName + '!');
    return;
  }

  // Write invite to Firebase
  db.ref(`overworld/party_invites/${targetUid}/${uid}`).set({
    name: G.name,
    partyId: G.party.id,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
  });

  G.party.invites.push(targetUid);
  notify('Party invite sent to ' + targetName + '!');
}

let _partyInviteListener = null;

function startPartyInviteListener() {
  if (window._useLocalStorage || !uid) return;
  if (_partyInviteListener) return; // Already listening

  _partyInviteListener = db.ref(`overworld/party_invites/${uid}`);
  _partyInviteListener.on('child_added', snap => {
    const invite = snap.val();
    if (!invite) return;
    const inviterUid = snap.key;
    showPartyInviteNotification(inviterUid, invite.name, invite.partyId);
  });
}

function stopPartyInviteListener() {
  if (_partyInviteListener) {
    _partyInviteListener.off();
    _partyInviteListener = null;
  }
}

function showPartyInviteNotification(inviterUid, inviterName, partyId) {
  // Remove any existing party invite notification
  const existing = document.getElementById('partyInviteNotif');
  if (existing) existing.remove();

  const notif = document.createElement('div');
  notif.id = 'partyInviteNotif';
  notif.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#1a1a2e;border:2px solid #4a8a4a;border-radius:12px;padding:12px 20px;z-index:9999;text-align:center;min-width:240px;box-shadow:0 4px 20px rgba(0,0,0,0.6);';
  notif.innerHTML = `
    <div style="color:#ccc;font-size:13px;margin-bottom:8px;"><strong style="color:#fff;">${inviterName}</strong> invited you to a party!</div>
    <div style="display:flex;gap:8px;justify-content:center;">
      <button style="padding:6px 16px;background:#2a6a2a;border:1px solid #4a8a4a;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;" onclick="acceptPartyInvite('${inviterUid}','${partyId}','${inviterName.replace(/'/g, "\\'")}')">Accept</button>
      <button style="padding:6px 16px;background:#4a1a1a;border:1px solid #6a3a3a;color:#fff;border-radius:6px;cursor:pointer;font-size:12px;" onclick="declinePartyInvite('${inviterUid}')">Decline</button>
    </div>
  `;
  document.body.appendChild(notif);

  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    const el = document.getElementById('partyInviteNotif');
    if (el) el.remove();
  }, 30000);
}

function acceptPartyInvite(inviterUid, partyId, inviterName) {
  if (window._useLocalStorage) { notify('Party system requires an online connection.'); return; }
  initParty();

  // Leave current party if in one
  if (G.party.id) {
    leaveParty(true); // silent leave
  }

  // Join the party in Firebase
  db.ref(`overworld/parties/${partyId}/members/${uid}`).set({
    name: G.name,
    x: G.x,
    y: G.y,
  });

  // Set local state
  G.party.id = partyId;
  G.party.members = [{ uid: uid, name: G.name }];
  G.party.invites = [];

  // Remove the invite from Firebase
  db.ref(`overworld/party_invites/${uid}/${inviterUid}`).remove();

  // Remove notification
  const notif = document.getElementById('partyInviteNotif');
  if (notif) notif.remove();

  // Start listening to party changes
  startPartyMemberListener();

  notify('Joined ' + inviterName + "'s party!");
  renderPartyIndicator();
}

function declinePartyInvite(inviterUid) {
  if (!window._useLocalStorage && uid) {
    db.ref(`overworld/party_invites/${uid}/${inviterUid}`).remove();
  }
  const notif = document.getElementById('partyInviteNotif');
  if (notif) notif.remove();
  notify('Party invite declined.');
}

let _partyMemberListener = null;

function startPartyMemberListener() {
  if (window._useLocalStorage || !G.party || !G.party.id) return;
  stopPartyMemberListener();

  _partyMemberListener = db.ref(`overworld/parties/${G.party.id}/members`);
  _partyMemberListener.on('value', snap => {
    const members = snap.val();
    if (!members) {
      // Party was disbanded
      G.party = { id: null, members: [], invites: [] };
      notify('Party disbanded.');
      renderPartyIndicator();
      return;
    }
    G.party.members = Object.entries(members).map(([mUid, m]) => ({
      uid: mUid,
      name: m.name,
      x: m.x,
      y: m.y,
    }));
    renderPartyIndicator();
  });
}

function stopPartyMemberListener() {
  if (_partyMemberListener) {
    _partyMemberListener.off();
    _partyMemberListener = null;
  }
}

function leaveParty(silent) {
  if (window._useLocalStorage) { if (!silent) notify('Cannot leave party while offline.'); return; }
  initParty();
  if (!G.party.id) { if (!silent) notify('You are not in a party.'); return; }

  const wasLeader = G.party.id === uid;
  const partyId = G.party.id;

  // Remove self from Firebase party
  db.ref(`overworld/parties/${partyId}/members/${uid}`).remove();

  // If leader, disband the whole party
  if (wasLeader) {
    db.ref(`overworld/parties/${partyId}`).remove();
  }

  // Stop listening
  stopPartyMemberListener();

  // Clear local state
  G.party = { id: null, members: [], invites: [] };

  if (!silent) notify('Left the party.');
  renderPartyIndicator();
}

function renderPartyIndicator() {
  // Remove existing indicator
  const existing = document.getElementById('partyIndicator');
  if (existing) existing.remove();

  initParty();
  if (!G.party.id || !G.party.members || G.party.members.length <= 1) return;

  const indicator = document.createElement('div');
  indicator.id = 'partyIndicator';
  indicator.style.cssText = 'position:fixed;top:48px;right:8px;background:rgba(26,26,46,0.9);border:1px solid #4a8a4a;border-radius:8px;padding:6px 10px;z-index:100;font-size:11px;color:#ccc;min-width:100px;';

  let html = '<div style="color:#daa520;font-weight:bold;font-size:10px;text-transform:uppercase;margin-bottom:4px;">Party</div>';
  for (const m of G.party.members) {
    const isMe = m.uid === uid;
    const isLeader = m.uid === G.party.id;
    const color = isMe ? '#4f8' : '#daa520';
    html += `<div style="color:${color};font-size:11px;">${isLeader ? '\u2605 ' : ''}${m.name}${isMe ? ' (you)' : ''}</div>`;
  }
  html += `<button style="margin-top:6px;padding:2px 8px;background:#4a1a1a;border:1px solid #6a3a3a;color:#ccc;border-radius:4px;cursor:pointer;font-size:10px;width:100%;" onclick="leaveParty()">Leave Party</button>`;

  indicator.innerHTML = html;
  document.body.appendChild(indicator);
}

// Update party member positions in Firebase periodically (piggybacks on presence interval)
function updatePartyPosition() {
  if (window._useLocalStorage || !G.party || !G.party.id || !uid) return;
  db.ref(`overworld/parties/${G.party.id}/members/${uid}`).update({
    x: Math.round(G.x * 10) / 10,
    y: Math.round(G.y * 10) / 10,
  });
}

// Draw party tethers on the overworld canvas between party members
function drawPartyTethers(ctx, camX, camY, tileSize) {
  initParty();
  if (!G.party.id || !G.party.members || G.party.members.length <= 1) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(218,165,32,0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);

  const myScreenX = (G.x - camX) * tileSize + tileSize / 2;
  const myScreenY = (G.y - camY) * tileSize + tileSize / 2;

  for (const m of G.party.members) {
    if (m.uid === uid) continue;
    const ox = (m.x - camX) * tileSize + tileSize / 2;
    const oy = (m.y - camY) * tileSize + tileSize / 2;
    ctx.beginPath();
    ctx.moveTo(myScreenX, myScreenY);
    ctx.lineTo(ox, oy);
    ctx.stroke();
  }

  ctx.restore();
}

// Override name label color for party members (call from render loop)
function getPlayerNameColor(playerUid) {
  initParty();
  if (G.party && G.party.id && G.party.members) {
    if (G.party.members.some(m => m.uid === playerUid)) {
      return '#daa520'; // Gold for party members
    }
  }
  return '#8cf'; // Default blue
}

// Initialize party system — call after auth and presence setup
function initPartySystem() {
  initParty();
  startPartyInviteListener();
  // If we were in a party before (saved state), reconnect the listener
  if (G.party && G.party.id) {
    startPartyMemberListener();
    renderPartyIndicator();
  }
}

// Update party position every 2s (same cadence as presence)
setInterval(() => {
  if (!window._useLocalStorage && G.party && G.party.id) {
    updatePartyPosition();
  }
}, 2000);

// Clean up stale party invites older than 5 minutes
function cleanOldPartyInvites() {
  if (window._useLocalStorage || !uid) return;
  db.ref(`overworld/party_invites/${uid}`).once('value').then(snap => {
    const invites = snap.val();
    if (!invites) return;
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    for (const [inviterUid, invite] of Object.entries(invites)) {
      if (invite.timestamp && invite.timestamp < fiveMinAgo) {
        db.ref(`overworld/party_invites/${uid}/${inviterUid}`).remove();
      }
    }
  });
}
setInterval(cleanOldPartyInvites, 60000);

// ═══════ RESOURCE SURVEYING SYSTEM ═══════
