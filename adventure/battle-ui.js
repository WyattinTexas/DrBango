// ═══════════════════════════════════════════════════════════════
// BATTLE UI + CARD RENDERING + PARTY MANAGEMENT
// Multiplayer-quality visuals, testroom-accurate battle system
// ═══════════════════════════════════════════════════════════════

const RARITY_COLORS = {
  common: '#8b95a5',
  uncommon: '#2ecc71',
  rare: '#3498db',
  'ghost-rare': '#9b59b6',
  'ghost rare': '#9b59b6',
  legendary: '#f39c12'
};

function artPath(id) {
  return typeof ART_MAP !== 'undefined' && ART_MAP[id] ? '../testroom/' + ART_MAP[id] : '';
}

function hpClass(hp, maxHp) {
  const pct = hp / maxHp;
  if (pct > 0.6) return 'healthy';
  if (pct > 0.3) return 'warning';
  return 'critical';
}

// ═══════════════════════════════════════════
// CARD RENDERING (multiplayer quality)
// ═══════════════════════════════════════════

function renderCard(ghost, options = {}) {
  const card = ENGINE.getCard(ghost.id) || ghost;
  const art = artPath(ghost.id);
  const rc = RARITY_COLORS[card.rarity] || '#8b95a5';
  const isActive = options.active;
  const isKo = ghost.ko;
  const showHp = options.showHp !== false;
  const size = options.size || 'normal'; // 'mini', 'normal', 'large'
  const clickable = options.onClick;

  if (size === 'mini') {
    return `<div class="card-mini ${isKo?'ko':''}" ${clickable?`onclick="${clickable}"`:''}>
      ${art?`<img src="${art}" onerror="this.style.display='none'">`:
        `<div class="card-mini-placeholder">${ghost.name[0]}</div>`}
      <div class="mini-info">
        <div class="mini-name">${ghost.name}</div>
        <div class="mini-ability">${ghost.ability || ''}</div>
        <div class="mini-hp" style="color:${hpClass(ghost.hp,ghost.maxHp)==='critical'?'#e94560':hpClass(ghost.hp,ghost.maxHp)==='warning'?'#f39c12':'#50c040'}">${ghost.hp}/${ghost.maxHp} HP</div>
      </div>
    </div>`;
  }

  if (size === 'large') {
    // Full card (roster panel style, 200px wide)
    return `<div class="card-large ${isKo?'ko':''} ${isActive?'active-card':''}" style="border-color:${rc}" ${clickable?`onclick="${clickable}"`:''}>
      <div class="card-rarity-bar" style="background:${rc}"></div>
      ${options.slotNum?`<div class="card-slot-num">${options.slotNum}</div>`:''}
      ${art?`<img class="card-art" src="${art}" onerror="this.src=''">`:`<div class="card-art-placeholder"></div>`}
      <div class="card-info">
        <div class="card-name">${ghost.name}</div>
        ${showHp?`<div class="card-hp"><span class="heart">♥</span> ${ghost.hp}/${ghost.maxHp} HP</div>`:''}
        <div class="card-rarity" style="color:${rc}">${(card.rarity||'').toUpperCase()}</div>
        <div class="card-ability-name">${ghost.ability}</div>
        <div class="card-ability-desc">${ghost.abilityDesc || card.desc || ''}</div>
      </div>
    </div>`;
  }

  // Normal (battle display)
  return `<div class="card-normal ${isKo?'ko':''}">
    ${art?`<img class="card-portrait" src="${art}" onerror="this.style.display='none'">`:`<div class="card-portrait-placeholder">${ghost.name[0]}</div>`}
    <div class="card-battle-info">
      <div class="card-name">${ghost.name}</div>
      <div class="card-ability-name">${ghost.ability}</div>
      <div class="card-ability-desc">${ghost.abilityDesc || card.desc || ''}</div>
      ${showHp?`
      <div class="hp-bar-outer">
        <div class="hp-bar-inner ${hpClass(ghost.hp,ghost.maxHp)}" style="width:${Math.max(0,ghost.hp/ghost.maxHp*100)}%"></div>
        <div class="hp-bar-text">${ghost.hp} / ${ghost.maxHp}</div>
      </div>`:''}
    </div>
  </div>`;
}

function renderResources(resources) {
  const icons = {luckyStone:'🍀',moonstone:'🌙',healingSeed:'🌱',surge:'⚡',iceShard:'❄️',sacredFire:'🔥',firefly:'✨'};
  let html = '';
  for (const [key, icon] of Object.entries(icons)) {
    if (resources[key] > 0) html += `<span class="res-badge">${icon}${resources[key]}</span>`;
  }
  return html;
}

// ═══════════════════════════════════════════
// BATTLE SCREEN (testroom-accurate)
// ═══════════════════════════════════════════

function renderBattleScreen(bs) {
  const pGhost = ENGINE.activeGhost(bs.playerTeam);
  const eGhost = ENGINE.activeGhost(bs.enemyTeam);
  const pSideline = ENGINE.sidelineGhosts(bs.playerTeam);
  const eSideline = ENGINE.sidelineGhosts(bs.enemyTeam);

  // Enemy side
  document.getElementById('b-enemy').innerHTML = `
    <div class="battle-side enemy-side">
      <div class="side-label">ENEMY</div>
      ${renderCard(eGhost, {size:'normal', active:true})}
      <div class="battle-resources">${renderResources(bs.enemyTeam.resources)}</div>
      ${eSideline.length ? `<div class="sideline-row">
        ${eSideline.map(g => renderCard(g, {size:'mini'})).join('')}
      </div>` : ''}
    </div>
  `;

  // Player side
  document.getElementById('b-player').innerHTML = `
    <div class="battle-side player-side">
      <div class="side-label" style="color:#2ecc71">YOUR TEAM</div>
      ${renderCard(pGhost, {size:'normal', active:true})}
      <div class="battle-resources">${renderResources(bs.playerTeam.resources)}</div>
      ${pSideline.length ? `<div class="sideline-row">
        ${pSideline.map(g => renderCard(g, {size:'mini'})).join('')}
      </div>` : ''}
    </div>
  `;
}

// ═══════════════════════════════════════════
// PARTY MANAGEMENT SCREEN
// ═══════════════════════════════════════════

function showPartyScreen() {
  if (!G) return;
  const ghosts = G.party.ghosts;

  let html = `<div class="party-header">
    <h2>YOUR PARTY</h2>
    <p class="party-subtitle">Tap cards to set roster order. Position 1 is your active fighter.</p>
  </div>
  <div class="party-roster">`;

  ghosts.forEach((ghost, i) => {
    const label = i === 0 ? 'ACTIVE' : i <= 2 ? `BENCH ${i}` : `RESERVE ${i}`;
    const isActive = i === 0;
    html += renderCard(ghost, {
      size: 'large',
      active: isActive,
      showHp: true,
      slotNum: i + 1,
      onClick: `swapPartyPosition(${i})`
    });
  });

  html += `</div>
  <div class="party-actions">
    <button class="party-done-btn" onclick="hidePartyScreen()">DONE</button>
  </div>`;

  showModal('Party Management', html, []);
  // Override modal styling for party screen
  document.getElementById('modal').style.maxWidth = '800px';
}

let _swapFrom = -1;
window.swapPartyPosition = function(idx) {
  if (_swapFrom === -1) {
    _swapFrom = idx;
    // Highlight selected
    document.querySelectorAll('.card-large').forEach((el, i) => {
      el.classList.toggle('swap-selected', i === idx);
    });
  } else {
    // Swap positions
    const ghosts = G.party.ghosts;
    [ghosts[_swapFrom], ghosts[idx]] = [ghosts[idx], ghosts[_swapFrom]];
    // If we moved position 0, update activeIdx
    G.party.activeIdx = 0;
    _swapFrom = -1;
    showPartyScreen(); // Refresh
    updateHUD();
  }
};

function hidePartyScreen() {
  hideModal();
  document.getElementById('modal').style.maxWidth = '500px';
  _swapFrom = -1;
}

// ═══════════════════════════════════════════
// ENCOUNTER PREVIEW
// ═══════════════════════════════════════════

function showEncounterPreview(card, onFight, onFlee) {
  const ghost = ENGINE.makeGhost(card.id);
  const rc = RARITY_COLORS[card.rarity] || '#8b95a5';

  showModal('Wild Encounter!', `
    <div style="text-align:center">
      ${renderCard(ghost, {size:'large', showHp:true})}
      <p style="margin-top:12px;color:${rc};font-weight:700">${(card.rarity||'').toUpperCase()}</p>
    </div>
  `, [
    { text: 'FIGHT', primary: true, action: onFight },
    { text: 'FLEE', action: onFlee }
  ]);
  document.getElementById('modal').style.maxWidth = '320px';
}

// ═══════════════════════════════════════════
// RECRUIT SCREEN (when party is full)
// ═══════════════════════════════════════════

function showRecruitScreen(newCard, onDone) {
  const newGhost = ENGINE.makeGhost(newCard.id);
  let html = `<div style="text-align:center;margin-bottom:16px">
    <p style="font-weight:700;color:#2ecc71;margin-bottom:8px">${newCard.name} wants to join!</p>
    ${renderCard(newGhost, {size:'large', showHp:true})}
  </div>`;

  if (G.party.ghosts.length >= 5) {
    html += `<p style="text-align:center;margin-bottom:12px;color:#f0d860">Party is full! Choose who to replace:</p>
    <div class="recruit-roster">`;
    G.party.ghosts.forEach((ghost, i) => {
      html += `<div class="recruit-option" onclick="doRecruit(${newCard.id}, ${i})">
        ${renderCard(ghost, {size:'mini'})}
        <span class="recruit-replace-label">Replace</span>
      </div>`;
    });
    html += `</div>`;
  }

  const actions = [];
  if (G.party.ghosts.length < 5) {
    actions.push({ text: 'RECRUIT', primary: true, action: () => {
      G.party.ghosts.push(ENGINE.makeGhost(newCard.id));
      hideModal(); updateHUD(); onDone();
    }});
  }
  actions.push({ text: 'PASS', action: () => { hideModal(); onDone(); }});

  showModal('Recruit', html, actions);
  document.getElementById('modal').style.maxWidth = '600px';

  window.doRecruit = function(cardId, replaceIdx) {
    G.party.ghosts[replaceIdx] = ENGINE.makeGhost(cardId);
    G.party.activeIdx = 0;
    hideModal();
    document.getElementById('modal').style.maxWidth = '500px';
    updateHUD();
    onDone();
  };
}

// ═══════════════════════════════════════════
// KO SWAP PICKER
// ═══════════════════════════════════════════

function showKoSwapPicker(team, enemyTeam, onSwap) {
  const alive = team.ghosts.filter((g, i) => i !== team.activeIdx && !g.ko);
  if (!alive.length) { onSwap(); return; }

  let html = '<div class="ko-picker-grid">';
  alive.forEach(g => {
    const idx = team.ghosts.indexOf(g);
    html += `<div class="ko-option" onclick="doKoSwap(${idx})">
      ${renderCard(g, {size:'large', showHp:true})}
    </div>`;
  });
  html += '</div>';

  setBattleActions([]);
  document.getElementById('b-log').innerHTML += '<div style="color:#f0d860;font-weight:700">Choose your next fighter!</div>';

  // Show as overlay within battle screen
  const overlay = document.createElement('div');
  overlay.id = 'ko-overlay';
  overlay.innerHTML = `<div class="ko-overlay-content">
    <h3 style="color:#e05050;margin-bottom:12px">GHOST DOWN! Choose replacement:</h3>
    ${html}
  </div>`;
  document.getElementById('battle-screen').appendChild(overlay);

  window.doKoSwap = function(idx) {
    team.activeIdx = idx;
    const entry = { events: [] };
    ENGINE.triggerEntryAbility(team, enemyTeam, entry);
    entry.events.forEach(e => logBattle(e));
    document.getElementById('ko-overlay')?.remove();
    onSwap();
  };
}

// ═══════════════════════════════════════════
// STARTER SCREEN (with card quality)
// ═══════════════════════════════════════════

function renderStarterScreen() {
  const starters = [
    ENGINE.getCard(28),  // Dream Cat
    ENGINE.getCard(16),  // Chip
    ENGINE.getCard(20),  // Floop
  ].filter(Boolean);

  const el = document.getElementById('starter-choices');
  el.innerHTML = '';
  for (const card of starters) {
    const ghost = ENGINE.makeGhost(card.id);
    const div = document.createElement('div');
    div.className = 'starter-card-wrap';
    div.innerHTML = renderCard(ghost, {size:'large', showHp:true});
    div.onclick = () => startGame(card.id);
    el.appendChild(div);
  }
}

// Export to window
window.renderBattleScreen = renderBattleScreen;
window.renderCard = renderCard;
window.showPartyScreen = showPartyScreen;
window.hidePartyScreen = hidePartyScreen;
window.showEncounterPreview = showEncounterPreview;
window.showRecruitScreen = showRecruitScreen;
window.showKoSwapPicker = showKoSwapPicker;
window.renderStarterScreen = renderStarterScreen;
