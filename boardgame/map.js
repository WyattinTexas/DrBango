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
    id: id(0), type: 'start', x: 0.5, y: 0.92,
    connections: [id(1), id(2)], visited: false, revealed: true,
    region: regionIndex, label: 'Start'
  });

  // Row 1 — two branches
  nodes.push({
    id: id(1), type: shuffled[0], x: 0.28, y: 0.74,
    connections: [id(3), id(4)], visited: false, revealed: true,
    region: regionIndex
  });
  nodes.push({
    id: id(2), type: shuffled[1], x: 0.72, y: 0.74,
    connections: [id(4), id(5)], visited: false, revealed: true,
    region: regionIndex
  });

  // Row 2 — three nodes
  nodes.push({
    id: id(3), type: shuffled[2], x: 0.18, y: 0.56,
    connections: [id(6)], visited: false, revealed: true,
    region: regionIndex
  });
  nodes.push({
    id: id(4), type: shuffled[3], x: 0.5, y: 0.56,
    connections: [id(6), id(7)], visited: false, revealed: true,
    region: regionIndex
  });
  nodes.push({
    id: id(5), type: shuffled[4], x: 0.82, y: 0.56,
    connections: [id(7)], visited: false, revealed: true,
    region: regionIndex
  });

  // Row 3 — two converge nodes
  nodes.push({
    id: id(6), type: shuffled[5], x: 0.34, y: 0.38,
    connections: [id(8)], visited: false, revealed: true,
    region: regionIndex
  });
  nodes.push({
    id: id(7), type: shuffled[6], x: 0.66, y: 0.38,
    connections: [id(8)], visited: false, revealed: true,
    region: regionIndex
  });

  // Boss node — sits just below the region banner
  nodes.push({
    id: id(8), type: 'boss', x: 0.5, y: 0.2,
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
  if (regionIndex >= 1 && Math.random() < 0.3) return 'lucky_dice';
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

  // Terrain layer — region atmosphere gradient (or key art if provided)
  const terrain = document.getElementById('mapTerrain');
  if (region.keyArt) {
    terrain.style.background = `url('${region.keyArt}') center/cover, ${region.theme.terrain}`;
    terrain.classList.remove('no-art');
  } else {
    terrain.style.background = region.theme.terrain;
    terrain.classList.add('no-art');
  }

  // Region banner
  const banner = document.getElementById('regionBanner');
  banner.innerHTML = `
    <div class="region-banner-name">${region.name}</div>
    <div class="region-banner-tagline">${region.tagline || ''}</div>
    <div class="region-banner-boss">Boss: ${region.boss}</div>
  `;

  // Team HUD + resources
  renderTeamHud();
  renderResourceStrip();

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
  const nodeLabel = currentNode ? `You are at <b>${currentNode.label || currentNode.type}</b>` : '';
  infoPanel.innerHTML = `<div class="info-node-line">${nodeLabel}</div>`;
  renderRegionTabs();
}

function drawMapLines(canvas, nodes, region) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const accent = region.theme.accent;

  const drawCurve = (x1, y1, x2, y2) => {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    // slight horizontal offset for curve flavor
    const cpX = midX + (x2 - x1) * 0.12 + (Math.sin((x1 + y1) * 0.05) * 8);
    const cpY = midY;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cpX, cpY, x2, y2);
    ctx.stroke();
  };

  // Draw all connections as soft curves (glow layer + line layer)
  const connections = [];
  nodes.forEach(node => {
    if (!node.revealed) return;
    const sx = node.x * canvas.width;
    const sy = node.y * canvas.height;
    node.connections.forEach(cid => {
      const target = nodes.find(n => n.id === cid);
      if (!target || !target.revealed) return;
      connections.push({ sx, sy, tx: target.x * canvas.width, ty: target.y * canvas.height });
    });
  });

  // Glow pass
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.15;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  connections.forEach(c => drawCurve(c.sx, c.sy, c.tx, c.ty));

  // Base line pass
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  connections.forEach(c => drawCurve(c.sx, c.sy, c.tx, c.ty));
  ctx.setLineDash([]);

  // Highlighted paths to reachable nodes (on top)
  const reachable = getReachableNodes();
  const currentNode = nodes.find(n => n.id === game.currentNode);
  if (currentNode) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 5]);
    nodes.forEach(node => {
      if (!reachable.includes(node.id)) return;
      if (!currentNode.connections.includes(node.id)) return;
      const sx = currentNode.x * canvas.width;
      const sy = currentNode.y * canvas.height;
      drawCurve(sx, sy, node.x * canvas.width, node.y * canvas.height);
    });
    ctx.setLineDash([]);
  }
}

function renderMapNodes(nodesEl, nodes, region) {
  const reachable = getReachableNodes();
  nodesEl.innerHTML = '';

  // Resolve a display name for each node type
  const displayName = (node) => {
    if (node.type === 'start') return 'Trailhead';
    if (node.type === 'boss') return node.bossGhost || region.boss;
    if (node.type === 'battle') return node.encounter ? node.encounter.name : 'Unknown Foe';
    if (node.type === 'item') return node.visited ? (ITEMS[node.itemDrop]?.name || 'Empty') : 'Treasure';
    if (node.type === 'event') return node.event ? node.event.title : 'Mystery';
    if (node.type === 'rest') return 'Rest Site';
    return node.label || '';
  };

  nodes.forEach(node => {
    if (!node.revealed) return;
    const el = document.createElement('div');
    el.className = 'map-node';
    el.dataset.type = node.type;
    el.style.left = (node.x * 100) + '%';
    el.style.top = (node.y * 100) + '%';

    const isCurrent = node.id === game.currentNode;
    const isReachable = reachable.includes(node.id);
    const artData = NODE_ART[node.type] || { icon: '?', label: '' };

    // Plate: uses art if provided, else emoji/glyph with a [art slot] dev label
    const hasArt = !!artData.art;
    const plateInner = hasArt
      ? `<img src="${artData.art}" alt="${artData.label}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
      : artData.icon;
    const plateClass = hasArt ? 'node-plate' : 'node-plate no-art';
    const artSlotName = `art:node-${node.type}`;

    el.innerHTML = `
      <div class="${plateClass}" data-art-slot="${artSlotName}">
        <div class="node-plate-inner">${plateInner}</div>
      </div>
      <div class="node-type-label">${artData.label}</div>
      <div class="node-name">${displayName(node)}</div>
    `;

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

function renderTeamHud() {
  const hud = document.getElementById('teamHud');
  hud.innerHTML = '';

  // ── Active slot ── (larger, glowing)
  const activeSlot = document.createElement('div');
  activeSlot.className = 'team-slot active-slot';
  if (game.active) {
    const g = game.active;
    const pct = Math.max(0, (g.hp / g.maxHp) * 100);
    activeSlot.innerHTML = `
      <div class="slot-role">ACTIVE</div>
      <img class="team-slot-portrait" src="${IMG}${g.file}" alt="${g.name}">
      <div class="team-slot-info">
        <div class="team-slot-name">${g.name}</div>
        <div class="team-slot-hp-wrap"><div class="team-slot-hp-bar" style="width:${pct}%;"></div></div>
        <div class="team-slot-hp-text">${g.hp}/${g.maxHp} HP</div>
      </div>
    `;
  } else {
    activeSlot.classList.add('empty');
    activeSlot.innerHTML = `<div class="team-slot-empty-text">No Fighter</div>`;
  }
  hud.appendChild(activeSlot);

  // ── Sideline slots ── (up to 2, smaller; tap to promote to active)
  for (let i = 0; i < SIDELINE_MAX; i++) {
    const g = game.sideline[i];
    const slot = document.createElement('div');
    slot.className = 'team-slot sideline-slot';
    if (g) {
      const pct = Math.max(0, (g.hp / g.maxHp) * 100);
      slot.innerHTML = `
        <div class="slot-role">SIDELINE</div>
        <img class="team-slot-portrait" src="${IMG}${g.file}" alt="${g.name}">
        <div class="team-slot-info">
          <div class="team-slot-name">${g.name}</div>
          <div class="team-slot-hp-wrap"><div class="team-slot-hp-bar" style="width:${pct}%;"></div></div>
          <div class="team-slot-hp-text">${g.hp}/${g.maxHp}</div>
        </div>
      `;
      slot.title = `Tap to swap ${g.name} into the active slot`;
      slot.onclick = () => { promoteSideline(i); renderTeamHud(); };
    } else {
      slot.classList.add('empty');
      slot.innerHTML = `<div class="team-slot-empty-text">Sideline</div>`;
    }
    hud.appendChild(slot);
  }

  // ── Reserve badge ── (opens an overlay panel)
  const badge = document.createElement('div');
  badge.className = 'reserve-badge';
  badge.innerHTML = `
    <div class="reserve-badge-icon">◫</div>
    <div class="reserve-badge-count">${game.reserve.length}</div>
    <div class="reserve-badge-label">Reserve</div>
  `;
  if (game.reserve.length > 0) {
    badge.onclick = openReservePanel;
  } else {
    badge.classList.add('empty');
  }
  hud.appendChild(badge);
}

// ── Reserve panel ──
function openReservePanel() {
  const overlay = document.getElementById('reserveOverlay');
  const list = document.getElementById('reserveList');
  list.innerHTML = '';
  if (game.reserve.length === 0) {
    list.innerHTML = '<div class="reserve-empty">No ghosts in reserve.</div>';
  } else {
    game.reserve.forEach((g, i) => {
      const row = document.createElement('div');
      row.className = 'reserve-row';
      row.innerHTML = `
        <img class="reserve-portrait" src="${IMG}${g.file}" alt="${g.name}">
        <div class="reserve-info">
          <div class="reserve-name">${g.name}</div>
          <div class="reserve-hp">${g.hp}/${g.maxHp} HP — ${g.ability}</div>
          <div class="reserve-desc">${g.abilityDesc}</div>
        </div>
        <button class="reserve-swap-btn" data-idx="${i}">Swap In</button>
      `;
      row.querySelector('.reserve-swap-btn').onclick = () => {
        // If sideline has room, just push. Otherwise, swap with sideline slot 0.
        pullFromReserve(i, 0);
        openReservePanel(); // refresh
        renderTeamHud();
      };
      list.appendChild(row);
    });
  }
  overlay.classList.add('active');
}
function closeReservePanel() {
  document.getElementById('reserveOverlay').classList.remove('active');
}

function renderResourceStrip() {
  const strip = document.getElementById('resourceStrip');
  const itemIcons = game.items.map(id => ITEMS[id]?.icon || '?').join(' ');

  strip.innerHTML = `
    <span class="rs-items">${itemIcons || '<span style="color:#444">no items</span>'}</span>
    <span class="rs-res">
      ${game.iceShards ? `<span class="rs-ice"><img src="iceshard.png" class="res-icon"> ${game.iceShards}</span>` : ''}
      ${game.sacredFires ? `<span class="rs-fire"><img src="sacredfire.png" class="res-icon"> ${game.sacredFires}</span>` : ''}
    </span>
  `;
}

function renderRegionTabs() {
  const panel = document.getElementById('mapInfoPanel');
  let tabs = '<div class="region-tabs">';
  REGIONS.forEach((r, i) => {
    const locked = i > game.bossesBeaten;
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
    // Heal the active + sideline team (reserves don't heal at rest)
    teamInPlay().forEach(g => { g.hp = Math.min(g.hp + 3, g.maxHp); });
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
  if (index > game.bossesBeaten) return;

  game.currentRegion = index;
  // Find start node
  const nodes = game.regionMaps[index];
  const start = nodes.find(n => n.type === 'start');
  game.currentNode = start.id;
  saveGame();
  renderMap();
}
