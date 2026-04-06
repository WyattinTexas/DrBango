// ══════════════════════════════════════════════════════════════════════════════
// GAME — Main game flow, save/load, events, screen management
// ══════════════════════════════════════════════════════════════════════════════

let game = null;

// ── Real game rules ──
// Team in play = 1 active fighter + up to 2 sideline supporters (face-up).
// Overflow recruits go into reserve (inventory). Deaths are permanent.
const SIDELINE_MAX = 2;

function newGame() {
  return {
    active: null,        // single fighting ghost
    sideline: [],        // up to SIDELINE_MAX face-up supporters
    reserve: [],         // overflow inventory (unlimited)
    items: [],
    iceShards: 0,
    sacredFires: 0,
    currentRegion: 0,
    currentNode: 'r0_n0',
    regionMaps: [],
    deadGhosts: [],
    bossesBeaten: 0,
    selectedRewardGhost: -1,
    pendingRewardGhosts: [],
  };
}

function saveGame() {
  localStorage.setItem('boo_boardgame_save', JSON.stringify(game));
}

function loadGame() {
  try {
    const raw = JSON.parse(localStorage.getItem('boo_boardgame_save'));
    return migrateSave(raw);
  } catch { return null; }
}

// Migrate v0.3 flat-collection saves into v0.4 active/sideline/reserve model
function migrateSave(s) {
  if (!s) return s;
  if (s.collection && !s.active && !s.sideline) {
    s.active = s.collection[0] || null;
    s.sideline = s.collection.slice(1, 1 + SIDELINE_MAX);
    s.reserve = s.collection.slice(1 + SIDELINE_MAX);
    delete s.collection;
    delete s.selectedGhostIndex;
  }
  s.sideline = s.sideline || [];
  s.reserve = s.reserve || [];
  return s;
}

// ── Team helpers ──

// All ghosts currently in play (active + sideline). Order: active first.
function teamInPlay() {
  return game.active ? [game.active, ...game.sideline] : [...game.sideline];
}

// Add a recruited ghost to the first available slot.
// Returns 'active' | 'sideline' | 'reserve'
function recruitGhost(ghost) {
  const g = { ...ghost, hp: ghost.maxHp };
  if (!game.active) { game.active = g; return 'active'; }
  if (game.sideline.length < SIDELINE_MAX) { game.sideline.push(g); return 'sideline'; }
  game.reserve.push(g);
  return 'reserve';
}

// Swap the active ghost with a sideline ghost at given index
function promoteSideline(sidelineIdx) {
  if (sidelineIdx < 0 || sidelineIdx >= game.sideline.length) return;
  const prev = game.active;
  game.active = game.sideline[sidelineIdx];
  game.sideline[sidelineIdx] = prev;
  saveGame();
}

// Move a reserve ghost into the team. If sideline has room, push to sideline.
// Otherwise swap into the given sideline index (replaced ghost goes back to reserve).
function pullFromReserve(reserveIdx, targetSidelineIdx) {
  if (reserveIdx < 0 || reserveIdx >= game.reserve.length) return;
  const incoming = game.reserve.splice(reserveIdx, 1)[0];
  if (!game.active) { game.active = incoming; saveGame(); return; }
  if (game.sideline.length < SIDELINE_MAX) {
    game.sideline.push(incoming);
  } else {
    const idx = (targetSidelineIdx != null) ? targetSidelineIdx : 0;
    const displaced = game.sideline[idx];
    game.sideline[idx] = incoming;
    game.reserve.push(displaced);
  }
  saveGame();
}

// When the active ghost dies: promote the first sideline, or pull from reserve.
// Returns true if the team still has fighters, false if wiped.
function handleActiveDeath() {
  if (game.active) {
    game.deadGhosts.push(game.active.name);
    game.active = null;
  }
  if (game.sideline.length > 0) {
    game.active = game.sideline.shift();
    // Back-fill sideline from reserve if any
    if (game.reserve.length > 0 && game.sideline.length < SIDELINE_MAX) {
      game.sideline.push(game.reserve.shift());
    }
    return true;
  }
  if (game.reserve.length > 0) {
    game.active = game.reserve.shift();
    return true;
  }
  return false;
}

// Is this ghost already on our team (active/sideline/reserve)?
function ownsGhost(name) {
  if (game.active && game.active.name === name) return true;
  if (game.sideline.find(g => g.name === name)) return true;
  if (game.reserve.find(g => g.name === name)) return true;
  return false;
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
    recruitGhost(ghost);
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
  const activeGhost = game.active;
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
    case 'recruit_random': {
      const pool = ALL_GHOSTS.filter(g => !ownsGhost(g.name));
      if (pool.length > 0) {
        const ghost = pool[Math.floor(Math.random() * pool.length)];
        const slot = recruitGhost(ghost);
        if (slot === 'active') msg = `${ghost.name} joins as your fighter!`;
        else if (slot === 'sideline') msg = `${ghost.name} takes a sideline spot!`;
        else msg = `${ghost.name} joins your reserve.`;
      } else {
        msg = 'No spirits available...';
      }
      break;
    }
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
  const survivors = [];
  if (game.active) survivors.push(game.active.name);
  game.sideline.forEach(g => survivors.push(g.name));
  game.reserve.forEach(g => survivors.push(g.name));
  document.getElementById('winStats').innerHTML = `
    <div class="win-crown">👑</div>
    <div>You defeated The Mountain King!</div>
    <div>Bosses beaten: ${game.bossesBeaten}</div>
    <div>Survivors: ${survivors.join(', ') || '—'}</div>
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
