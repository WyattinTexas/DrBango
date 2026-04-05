// ══════════════════════════════════════════════════════════════════════════════
// MAP — Node graph generation, rendering, navigation
// ══════════════════════════════════════════════════════════════════════════════

// Node types: battle, item, event, rest, lock, boss
// Each region generates a small graph of ~8-10 nodes with branching paths

function generateRegionMap(regionIndex) {
  const region = REGIONS[regionIndex];
  const nodes = [];
  const id = (i) => `r${regionIndex}_n${i}`;

  // Fixed structure per region — branching paths converge on boss
  // Row 0: Start
  // Row 1: 2-3 nodes (branch)
  // Row 2: 2-3 nodes (mid)
  // Row 3: 1-2 nodes (converge)
  // Row 4: Boss

  const nodeTypes = ['battle','item','event','rest','battle','item','event','battle'];
  const shuffled = [...nodeTypes].sort(() => Math.random() - 0.5);

  // Start node
  nodes.push({
    id: id(0), type: 'start', x: 0.5, y: 0.9,
    connections: [id(1), id(2)], visited: false, revealed: true,
    region: regionIndex, label: 'Start'
  });

  // Row 1 — two branches
  nodes.push({
    id: id(1), type: shuffled[0], x: 0.3, y: 0.72,
    connections: [id(3), id(4)], visited: false, revealed: true,
    region: regionIndex
  });
  nodes.push({
    id: id(2), type: shuffled[1], x: 0.7, y: 0.72,
    connections: [id(4), id(5)], visited: false, revealed: true,
    region: regionIndex
  });

  // Row 2 — three nodes
  nodes.push({
    id: id(3), type: shuffled[2], x: 0.2, y: 0.52,
    connections: [id(6)], visited: false, revealed: true,
    region: regionIndex
  });
  nodes.push({
    id: id(4), type: shuffled[3], x: 0.5, y: 0.52,
    connections: [id(6), id(7)], visited: false, revealed: true,
    region: regionIndex
  });
  nodes.push({
    id: id(5), type: shuffled[4], x: 0.8, y: 0.52,
    connections: [id(7)], visited: false, revealed: true,
    region: regionIndex
  });

  // Row 3 — two converge nodes
  nodes.push({
    id: id(6), type: shuffled[5], x: 0.35, y: 0.32,
    connections: [id(8)], visited: false, revealed: true,
    region: regionIndex
  });
  nodes.push({
    id: id(7), type: shuffled[6], x: 0.65, y: 0.32,
    connections: [id(8)], visited: false, revealed: true,
    region: regionIndex
  });

  // Boss node
  nodes.push({
    id: id(8), type: 'boss', x: 0.5, y: 0.12,
    connections: [], visited: false, revealed: true,
    region: regionIndex, label: region.boss,
    bossGhost: region.boss, bossHp: region.bossHp
  });

  // Assign random encounters to battle nodes
  nodes.forEach(n => {
    if (n.type === 'battle') {
      n.encounter = rollEncounter(regionIndex);
      n.label = n.encounter.name;
    }
    if (n.type === 'item') {
      n.itemDrop = rollItemDrop(regionIndex);
      n.label = 'Chest';
    }
    if (n.type === 'event') {
      n.event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      n.label = '?';
    }
    if (n.type === 'rest') {
      n.label = 'Rest';
    }
  });

  return nodes;
}

function rollEncounter(regionIndex) {
  const weights = ENCOUNTER_WEIGHTS[Math.min(regionIndex, ENCOUNTER_WEIGHTS.length - 1)];
  const roll = Math.random();
  let cumulative = 0;
  let targetRarity = 'common';
  for (const [rarity, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (roll < cumulative) { targetRarity = rarity; break; }
  }
  const pool = ALL_GHOSTS.filter(g => g.rarity === targetRarity);
  if (pool.length === 0) return ALL_GHOSTS[Math.floor(Math.random() * ALL_GHOSTS.length)];
  const ghost = pool[Math.floor(Math.random() * pool.length)];
  // Scale HP by region
  const hpBonus = regionIndex * 2;
  return { ...ghost, hp: ghost.maxHp + hpBonus, maxHp: ghost.maxHp + hpBonus };
}

function rollItemDrop(regionIndex) {
  const basicItems = ['reroll', 'heal', 'power', 'shield'];
  // Key items drop in specific regions
  if (regionIndex === 0 && Math.random() < 0.4) return 'key_cavern';
  if (regionIndex === 0 && Math.random() < 0.3) return 'key_palace';
  if (regionIndex <= 1 && Math.random() < 0.3) return 'key_palace';
  if (regionIndex <= 2 && Math.random() < 0.4) return 'key_castle';
  if (regionIndex === 1 && Math.random() < 0.3) return 'lucky_dice';
  return basicItems[Math.floor(Math.random() * basicItems.length)];
}

// ── MAP RENDERING ──

function renderMap() {
  const region = REGIONS[game.currentRegion];
  const nodes = game.regionMaps[game.currentRegion];
  const container = document.getElementById('mapContainer');
  const nodesEl = document.getElementById('mapNodes');
  const canvas = document.getElementById('mapCanvas');

  // Mark start as visited
  const startNode = nodes.find(n => n.type === 'start');
  if (startNode) startNode.visited = true;

  // Theme
  document.body.style.background = region.theme.bg;
  document.documentElement.style.setProperty('--accent', region.theme.accent);

  // HUD
  renderHud();

  // Size canvas — defer if container has no size yet
  requestAnimationFrame(() => {
    const rect = container.getBoundingClientRect();
    if (rect.width === 0) return;
    canvas.width = rect.width;
    canvas.height = rect.height;
    drawMapLines(canvas, nodes, region);
  });

  // Always render nodes immediately
  renderMapNodes(nodesEl, nodes, region);

  // Info panel then region tabs
  const infoPanel = document.getElementById('mapInfoPanel');
  const currentNode = nodes.find(n => n.id === game.currentNode);
  if (currentNode) {
    infoPanel.innerHTML = `<div class="info-region">${region.name}</div><div class="info-node">${currentNode.label || currentNode.type}</div>`;
  } else {
    infoPanel.innerHTML = `<div class="info-region">${region.name}</div>`;
  }
  renderRegionTabs();
}

function drawMapLines(canvas, nodes, region) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw connections
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  nodes.forEach(node => {
    if (!node.revealed) return;
    const sx = node.x * canvas.width;
    const sy = node.y * canvas.height;
    node.connections.forEach(cid => {
      const target = nodes.find(n => n.id === cid);
      if (!target || !target.revealed) return;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(target.x * canvas.width, target.y * canvas.height);
      ctx.stroke();
    });
  });

  // Highlighted paths to reachable nodes
  const reachable = getReachableNodes();
  ctx.strokeStyle = region.theme.accent;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  nodes.forEach(node => {
    if (!reachable.includes(node.id)) return;
    const currentNode = nodes.find(n => n.id === game.currentNode);
    if (!currentNode || !currentNode.connections.includes(node.id)) return;
    const sx = currentNode.x * canvas.width;
    const sy = currentNode.y * canvas.height;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(node.x * canvas.width, node.y * canvas.height);
    ctx.stroke();
  });
  ctx.setLineDash([]);
}

function renderMapNodes(nodesEl, nodes, region) {
  const reachable = getReachableNodes();
  nodesEl.innerHTML = '';
  nodes.forEach(node => {
    if (!node.revealed) return;
    const el = document.createElement('div');
    el.className = 'map-node';
    el.style.left = (node.x * 100) + '%';
    el.style.top = (node.y * 100) + '%';

    const isCurrent = node.id === game.currentNode;
    const isReachable = reachable.includes(node.id);

    let icon = '?';
    if (node.type === 'start') icon = '🏁';
    else if (node.type === 'battle') icon = '⚔️';
    else if (node.type === 'boss') icon = '👑';
    else if (node.type === 'item') icon = '📦';
    else if (node.type === 'event') icon = '❓';
    else if (node.type === 'rest') icon = '🔥';

    el.innerHTML = `<div class="node-icon">${icon}</div><div class="node-label">${node.label || ''}</div>`;

    if (isCurrent) el.classList.add('current');
    else if (node.visited) el.classList.add('visited');
    else if (isReachable) {
      el.classList.add('reachable');
      el.onclick = () => moveToNode(node.id);
    } else {
      el.classList.add('locked');
    }

    nodesEl.appendChild(el);
  });
}

function renderHud() {
  const hud = document.getElementById('mapHud');
  const activeGhost = game.collection[0];
  const itemIcons = game.items.map(id => ITEMS[id]?.icon || '?').join(' ');
  const keyIcons = game.items.filter(id => ITEMS[id]?.keyItem).map(id => ITEMS[id].icon).join(' ');

  hud.innerHTML = `
    <div class="hud-ghost">
      <img class="hud-ghost-img" src="${IMG}${activeGhost.file}" alt="${activeGhost.name}">
      <div class="hud-ghost-info">
        <div class="hud-ghost-name">${activeGhost.name}</div>
        <div class="hud-ghost-hp">${activeGhost.hp}/${activeGhost.maxHp} HP</div>
      </div>
      <div class="hud-team-count">${game.collection.length} ghost${game.collection.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="hud-items">${itemIcons || 'No items'}</div>
    ${keyIcons ? `<div class="hud-keys">Keys: ${keyIcons}</div>` : ''}
    <div class="hud-ice-fire">
      ${game.iceShards ? `<span class="hud-ice"><img src="iceshard.png" class="res-icon"> ${game.iceShards}</span>` : ''}
      ${game.sacredFires ? `<span class="hud-fire"><img src="sacredfire.png" class="res-icon"> ${game.sacredFires}</span>` : ''}
    </div>
  `;
}

function renderRegionTabs() {
  const panel = document.getElementById('mapInfoPanel');
  let tabs = '<div class="region-tabs">';
  REGIONS.forEach((r, i) => {
    const locked = r.unlockRequires && !game.unlockedAreas.includes(r.unlockRequires);
    const active = i === game.currentRegion;
    const cls = active ? 'region-tab active' : locked ? 'region-tab locked' : 'region-tab';
    const onclick = locked || active ? '' : `onclick="switchRegion(${i})"`;
    tabs += `<div class="${cls}" ${onclick}>${locked ? '🔒' : ''} ${r.name}</div>`;
  });
  tabs += '</div>';
  panel.innerHTML += tabs;
}

function getReachableNodes() {
  const nodes = game.regionMaps[game.currentRegion];
  const current = nodes.find(n => n.id === game.currentNode);
  if (!current) return [];
  return current.connections.filter(cid => {
    const target = nodes.find(n => n.id === cid);
    return target && target.revealed && !target.visited;
  });
}

function moveToNode(nodeId) {
  const nodes = game.regionMaps[game.currentRegion];
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;

  // Mark current as visited
  const current = nodes.find(n => n.id === game.currentNode);
  if (current) current.visited = true;

  game.currentNode = nodeId;
  saveGame();

  // Handle node type
  if (node.type === 'battle') {
    showPreBattle(node.encounter);
  } else if (node.type === 'boss') {
    const bossGhost = ALL_GHOSTS.find(g => g.name === node.bossGhost);
    const boss = { ...bossGhost, hp: node.bossHp, maxHp: node.bossHp };
    showPreBattle(boss, true);
  } else if (node.type === 'item') {
    gainItem(node.itemDrop);
    node.visited = true;
    // Show item pickup as a quick event
    const item = ITEMS[node.itemDrop];
    showScreen('eventScreen');
    document.getElementById('eventTitle').textContent = 'Found a Chest!';
    document.getElementById('eventDesc').textContent = `You found: ${item.icon} ${item.name}`;
    document.getElementById('eventChoices').innerHTML = `<div class="event-result">${item.desc}</div>`;
    setTimeout(() => { saveGame(); showMap(); }, 1800);
  } else if (node.type === 'event') {
    showEvent(node.event);
  } else if (node.type === 'rest') {
    // Heal active ghost +3
    game.collection[0].hp = Math.min(game.collection[0].hp + 3, game.collection[0].maxHp);
    narrate(`Rested. ${game.collection[0].name} healed to ${game.collection[0].hp} HP.`);
    node.visited = true;
    saveGame();
    renderMap();
  } else {
    node.visited = true;
    renderMap();
  }
}

function switchRegion(index) {
  const region = REGIONS[index];
  if (region.unlockRequires && !game.unlockedAreas.includes(region.unlockRequires)) return;

  game.currentRegion = index;
  // Find start node
  const nodes = game.regionMaps[index];
  const start = nodes.find(n => n.type === 'start');
  game.currentNode = start.id;
  saveGame();
  renderMap();
}
