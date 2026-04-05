// ══════════════════════════════════════════════════════════════════════════════
// GAME — Main game flow, save/load, events, screen management
// ══════════════════════════════════════════════════════════════════════════════

let game = null;

function newGame() {
  return {
    collection: [],
    items: [],
    iceShards: 0,
    sacredFires: 0,
    unlockedAreas: [],
    currentRegion: 0,
    currentNode: 'r0_n0',
    regionMaps: [],
    deadGhosts: [],
    bossesBeaten: 0,
    selectedGhostIndex: 0,
    selectedRewardGhost: -1,
    pendingRewardGhosts: [],
  };
}

function saveGame() {
  localStorage.setItem('boo_boardgame_save', JSON.stringify(game));
}

function loadGame() {
  try { return JSON.parse(localStorage.getItem('boo_boardgame_save')); } catch { return null; }
}

// ── SCREEN MANAGEMENT ──

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── GAME START ──

function startNewGame() {
  game = newGame();
  // Generate all region maps
  REGIONS.forEach((_, i) => {
    game.regionMaps.push(generateRegionMap(i));
  });
  showScreen('pickScreen');
  renderStarterPick();
}

function continueGame() {
  game = loadGame();
  if (!game) return startNewGame();
  iceShards = game.iceShards || 0;
  sacredFires = game.sacredFires || 0;
  showMap();
}

function renderStarterPick() {
  const grid = document.getElementById('pickGrid');
  grid.innerHTML = '';
  let selected = -1;

  STARTERS.forEach((name, i) => {
    const ghost = ALL_GHOSTS.find(g => g.name === name);
    const card = document.createElement('div');
    card.className = 'starter-card';
    card.innerHTML = `
      <img src="${IMG}${ghost.file}" alt="${ghost.name}">
      <div class="starter-name">${ghost.name}</div>
      <div class="starter-ability">${ghost.ability}</div>
      <div class="starter-desc">${ghost.abilityDesc}</div>
      <div class="starter-hp">${ghost.maxHp} HP</div>
    `;
    card.onclick = () => {
      grid.querySelectorAll('.starter-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selected = i;
      document.getElementById('pickBtn').classList.add('ready');
      document.getElementById('pickInfo').innerHTML = `<b>${ghost.name}</b> — ${ghost.ability}: ${ghost.abilityDesc}`;
    };
    grid.appendChild(card);
  });

  window._confirmStarter = () => {
    if (selected < 0) return;
    const ghost = ALL_GHOSTS.find(g => g.name === STARTERS[selected]);
    game.collection.push({ ...ghost, hp: ghost.maxHp });
    saveGame();
    showMap();
  };
}

function confirmStarter() {
  if (window._confirmStarter) window._confirmStarter();
}

// ── MAP SCREEN ──

function showMap() {
  showScreen('mapScreen');
  renderMap();

  // Check for continue button on title
  if (loadGame()) {
    document.getElementById('continueBtn').style.display = 'block';
  }
}

// ── EVENTS ──

function showEvent(event) {
  showScreen('eventScreen');
  document.getElementById('eventTitle').textContent = event.title;
  document.getElementById('eventDesc').textContent = event.desc;
  const choicesEl = document.getElementById('eventChoices');
  choicesEl.innerHTML = event.choices.map((c, i) =>
    `<button class="event-choice-btn" onclick="resolveEvent('${c.effect}')">${c.text}</button>`
  ).join('');
}

function resolveEvent(effect) {
  const activeGhost = game.collection[0];
  let msg = '';

  switch (effect) {
    case 'trade_hp_item':
      activeGhost.hp = Math.max(1, activeGhost.hp - 2);
      const drop = ['reroll', 'heal', 'power', 'shield'][Math.floor(Math.random() * 4)];
      gainItem(drop);
      msg = `Lost 2 HP but gained ${ITEMS[drop].name}!`;
      break;
    case 'heal_3':
      activeGhost.hp = Math.min(activeGhost.hp + 3, activeGhost.maxHp);
      msg = `Healed 3 HP! Now at ${activeGhost.hp}/${activeGhost.maxHp}`;
      break;
    case 'gain_power':
      gainItem('power');
      msg = 'Gained a Power Shard!';
      break;
    case 'gain_ice':
      game.iceShards = (game.iceShards || 0) + 2;
      iceShards = game.iceShards;
      msg = 'Gained 2 Ice Shards!';
      break;
    case 'gain_fire':
      game.sacredFires = (game.sacredFires || 0) + 2;
      sacredFires = game.sacredFires;
      msg = 'Gained 2 Sacred Fires!';
      break;
    case 'reveal_nodes':
      game.regionMaps[game.currentRegion].forEach(n => n.revealed = true);
      msg = 'All nearby nodes revealed!';
      break;
    case 'gain_reroll':
      gainItem('reroll');
      msg = 'Gained a Reroll Charm!';
      break;
    case 'chest_gamble':
      if (Math.random() < 0.6) {
        const good = ['power', 'shield', 'lucky_dice'][Math.floor(Math.random() * 3)];
        gainItem(good);
        msg = `Found ${ITEMS[good].name}!`;
      } else {
        activeGhost.hp = Math.max(1, activeGhost.hp - 3);
        msg = `Trapped! Lost 3 HP!`;
      }
      break;
    case 'recruit_random':
      const pool = ALL_GHOSTS.filter(g => !game.collection.find(c => c.name === g.name));
      if (pool.length > 0) {
        const ghost = pool[Math.floor(Math.random() * pool.length)];
        game.collection.push({ ...ghost, hp: ghost.maxHp });
        msg = `${ghost.name} joined your team!`;
      } else {
        msg = 'No spirits available...';
      }
      break;
    case 'gamble_roll':
      const roll = Math.floor(Math.random() * 6) + 1;
      if (roll >= 4) {
        gainItem('power');
        msg = `Rolled a ${roll}! Won a Power Shard!`;
      } else {
        activeGhost.hp = Math.max(1, activeGhost.hp - 2);
        msg = `Rolled a ${roll}... Lost 2 HP!`;
      }
      break;
    case 'nothing':
      msg = 'You move on...';
      break;
  }

  // Mark node visited
  const nodes = game.regionMaps[game.currentRegion];
  const node = nodes.find(n => n.id === game.currentNode);
  if (node) node.visited = true;

  saveGame();

  // Show result briefly then return to map
  document.getElementById('eventChoices').innerHTML = `<div class="event-result">${msg}</div>`;
  setTimeout(() => showMap(), 2000);
}

// ── ITEM MANAGEMENT ──

function gainItem(itemId) {
  game.items.push(itemId);
  // Auto-unlock areas
  const item = ITEMS[itemId];
  if (item && item.keyItem && item.unlocks) {
    if (!game.unlockedAreas.includes(item.unlocks)) {
      game.unlockedAreas.push(item.unlocks);
    }
  }
  saveGame();
}

// ── GAME OVER / VICTORY ──

function showGameOver() {
  showScreen('gameoverScreen');
  document.getElementById('gameoverStats').innerHTML = `
    <div>Bosses beaten: ${game.bossesBeaten}</div>
    <div>Ghosts lost: ${game.deadGhosts.length}</div>
    <div>Fallen: ${game.deadGhosts.join(', ') || 'None'}</div>
  `;
  localStorage.removeItem('boo_boardgame_save');
}

function showVictory() {
  showScreen('winScreen');
  document.getElementById('winStats').innerHTML = `
    <div class="win-crown">👑</div>
    <div>You defeated The Mountain King!</div>
    <div>Bosses beaten: ${game.bossesBeaten}</div>
    <div>Team: ${game.collection.map(g => g.name).join(', ')}</div>
    <div>Fallen heroes: ${game.deadGhosts.join(', ') || 'None'}</div>
  `;
  localStorage.removeItem('boo_boardgame_save');
}

// ── INIT ──

window.addEventListener('DOMContentLoaded', () => {
  const saved = loadGame();
  if (saved) {
    document.getElementById('continueBtn').style.display = 'block';
  }
  // Reset bg
  document.body.style.background = '';
});
