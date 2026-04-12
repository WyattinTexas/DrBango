/* ==========================================================
   THE LANTERN'S PATH — Prototype Game Logic
   ========================================================== */

// ==================== STATE ====================
const SAVE_KEY = 'lanternspath_v1';

let state = null;

function defaultState() {
  const spark = clone(ADVENTURE_CARDS.find(c => c.id === 'spark'));
  spark.hp = spark.maxHp;
  return {
    flame: 8,
    maxFlame: 12,
    wills: 0,
    shards: 0,
    party: [spark],
    activeGhostId: 'spark',
    act: 0,             // index into map (0-3)
    position: null,     // current node id
    cleared: [],        // cleared node ids
    koStates: {},       // { cardId: nodesUntilRevive }
    map: null,
    grandfatherEchoUsed: false,
    started: false,
    log: [],
  };
}

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function rand(n) { return Math.floor(Math.random() * n); }
function rollD6() { return rand(6) + 1; }
function rollDice(n) { return Array.from({ length: n }, rollD6); }
function choice(arr) { return arr[rand(arr.length)]; }

// ==================== MAP GENERATION ====================
const ACTS = [
  { region: 'Rolling Hills', mood: 'The Deceptive Calm' },
  { region: 'Frost Valley',  mood: 'The Slow Punishment' },
  { region: 'Dark Valley',   mood: 'The Hungry Road' },
  { region: 'Dark Castle',   mood: 'The Final Ritual' },
];

const NODE_TYPES = {
  boo:      { glyph: '⚔', name: 'BOO Match' },
  corrupt:  { glyph: '❈', name: 'Corrupted' },
  camp:     { glyph: '✦', name: 'Camp' },
  hazard:   { glyph: '❉', name: 'Hazard' },
  story:    { glyph: '❦', name: 'Story Beat' },
  shrine:   { glyph: '✧', name: 'Shrine' },
  stranger: { glyph: '☙', name: 'Stranger' },
  boss:     { glyph: '♛', name: 'Boss' },
  valkin:   { glyph: '♛', name: 'Valkin' },
  start:    { glyph: '✦', name: 'Start' },
};

// Weighted pool of node types per region (start/boss handled separately)
const REGION_POOLS = {
  'Rolling Hills': ['boo','corrupt','camp','hazard','story','shrine','stranger','boo','corrupt','camp'],
  'Frost Valley':  ['boo','corrupt','hazard','hazard','camp','story','shrine','stranger','boo','corrupt'],
  'Dark Valley':   ['boo','boo','corrupt','hazard','camp','story','shrine','boo','corrupt','hazard'],
  'Dark Castle':   ['boo','corrupt','shrine','story','boo','corrupt','shrine'],
};

function generateMap() {
  const map = [];
  for (let actIdx = 0; actIdx < ACTS.length; actIdx++) {
    const act = ACTS[actIdx];
    const isFinal = actIdx === 3;
    const pool = REGION_POOLS[act.region].slice();
    shuffle(pool);

    const rows = [];
    // Row 0: start
    rows.push([{ id: `a${actIdx}-r0-n0`, type: 'start', actIdx }]);

    // Middle rows
    const middleRowCount = isFinal ? 3 : 4;
    let poolIdx = 0;
    for (let r = 1; r <= middleRowCount; r++) {
      const width = (r === middleRowCount) ? 1 : 2;
      const row = [];
      for (let n = 0; n < width; n++) {
        const type = pool[poolIdx % pool.length] || 'boo';
        poolIdx++;
        row.push({ id: `a${actIdx}-r${r}-n${n}`, type, actIdx });
      }
      rows.push(row);
    }

    // Final row: boss (or Valkin)
    const bossType = isFinal ? 'valkin' : 'boss';
    rows.push([{ id: `a${actIdx}-r${middleRowCount+1}-n0`, type: bossType, actIdx }]);

    // Wire connections: each node in row r points to every node in row r+1
    const connections = {};
    for (let r = 0; r < rows.length - 1; r++) {
      for (const node of rows[r]) {
        const nextRow = rows[r + 1];
        // Simple fork: connect to same-column (or both) in next row
        if (nextRow.length === 1) {
          connections[node.id] = [nextRow[0].id];
        } else if (rows[r].length === 1) {
          // One node forks to both
          connections[node.id] = nextRow.map(n => n.id);
        } else {
          // Parallel: same-column link, or crossed if available
          const idx = rows[r].indexOf(node);
          connections[node.id] = [nextRow[Math.min(idx, nextRow.length - 1)].id];
          // 50% chance add a crossover for more branching
          if (nextRow.length > 1 && Math.random() < 0.5) {
            const other = nextRow.find(n => !connections[node.id].includes(n.id));
            if (other) connections[node.id].push(other.id);
          }
        }
      }
    }

    map.push({
      region: act.region,
      mood: act.mood,
      rows,
      connections,
    });
  }
  return map;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function findNode(nodeId) {
  for (const act of state.map) {
    for (const row of act.rows) {
      const n = row.find(x => x.id === nodeId);
      if (n) return n;
    }
  }
  return null;
}

function nodeConnections(nodeId) {
  for (const act of state.map) {
    if (act.connections[nodeId]) return act.connections[nodeId];
  }
  return [];
}

// ==================== SAVE / LOAD ====================
function saveState() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) {}
}
function loadState() {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    if (s) return JSON.parse(s);
  } catch(e) {}
  return null;
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
}

// ==================== HUD ====================
function refreshHud() {
  $('#flameCount').textContent = state.flame;
  $('#flameMax').textContent = state.maxFlame;
  $('#willsCount').textContent = state.wills;
  $('#shardsCount').textContent = state.shards;

  if (state.map && state.act != null) {
    const act = state.map[state.act];
    if (act) {
      $('#regionTag').textContent = `— ${act.region} —`;
      $('#regionMood').textContent = act.mood;
    }
  }

  document.body.classList.toggle('lantern-dim', state.flame <= 2);
  refreshPartyRoster();
}

function refreshPartyRoster() {
  const slots = $('#partySlots');
  slots.innerHTML = '';
  state.party.forEach(card => {
    const isActive = card.id === state.activeGhostId;
    const isKo = card.hp <= 0;
    const resting = (state.koStates[card.id] || 0) > 0;
    const div = document.createElement('div');
    div.className = 'party-slot';
    if (isActive && !isKo) div.classList.add('active');
    if (isKo) div.classList.add('ko');
    if (resting) div.classList.add('resting');
    div.innerHTML = `
      <div class="party-portrait">${cardPortraitInner(card)}</div>
      <div class="party-info">
        <div class="party-name">${card.name}</div>
        <div class="party-hp">${hpPips(card.hp, card.maxHp)}</div>
      </div>
    `;
    div.title = `${card.ability}: ${card.abilityText}`;
    div.onclick = () => {
      if (isKo || resting) return;
      state.activeGhostId = card.id;
      refreshHud();
      toast(`${card.name} steps forward.`);
    };
    slots.appendChild(div);
  });
}

function cardPortraitInner(card) {
  if (card.art) return `<img src="${card.art}" alt="${card.name}" onerror="this.style.display='none';this.parentElement.textContent='${card.name[0]}';">`;
  return card.name[0];
}

function hpPips(hp, max) {
  let html = '';
  for (let i = 0; i < max; i++) {
    html += `<span class="hp-pip${i < hp ? '' : ' lost'}"></span>`;
  }
  return html;
}

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

// ==================== SCREENS ====================
function showScreen(name) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const target = $(`.screen-${name}`);
  if (target) target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== MAP RENDERING ====================
function renderMap() {
  const act = state.map[state.act];
  $('#mapAct').textContent = `— Act ${romanize(state.act + 1)} —`;
  $('#mapRegion').textContent = act.region;
  $('#mapSubtitle').textContent = act.mood;

  const body = $('#mapBody');
  body.innerHTML = '';

  // Determine reachable set from current position
  const reachable = new Set();
  if (state.position) {
    nodeConnections(state.position).forEach(id => {
      if (!state.cleared.includes(id)) reachable.add(id);
    });
  }

  act.rows.forEach((row, rIdx) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'map-row';
    row.forEach(node => {
      const nodeEl = document.createElement('div');
      nodeEl.className = 'map-node';
      if (node.type === 'boss') nodeEl.classList.add('boss');
      if (node.type === 'valkin') nodeEl.classList.add('boss', 'valkin');

      if (state.cleared.includes(node.id)) nodeEl.classList.add('cleared');
      if (node.id === state.position) nodeEl.classList.add('current');
      if (reachable.has(node.id)) nodeEl.classList.add('reachable');
      if (!state.cleared.includes(node.id) && !reachable.has(node.id) && node.id !== state.position) {
        nodeEl.classList.add('unreachable');
      }

      const typeInfo = NODE_TYPES[node.type];
      nodeEl.innerHTML = `
        <div class="glyph">${typeInfo.glyph}</div>
        <div class="node-name">${typeInfo.name}</div>
      `;

      if (reachable.has(node.id)) {
        nodeEl.onclick = () => enterNode(node);
      } else if (node.id === state.position && node.type === 'start') {
        nodeEl.onclick = () => {
          // clicking the current start node opens first reachable
        };
      }

      rowEl.appendChild(nodeEl);
    });
    body.appendChild(rowEl);
  });
}

function romanize(n) {
  return ['I','II','III','IV','V'][n-1] || String(n);
}

// ==================== NODE ENTRY ====================
function enterNode(node) {
  const prev = state.position;
  state.position = node.id;

  // Tick down KO states for every node entered
  Object.keys(state.koStates).forEach(id => {
    state.koStates[id] = Math.max(0, state.koStates[id] - 1);
    if (state.koStates[id] === 0) {
      const card = state.party.find(c => c.id === id);
      if (card && card.hp <= 0) card.hp = Math.max(1, Math.floor(card.maxHp / 2));
    }
  });

  saveState();
  refreshHud();

  // Resolve by type
  switch (node.type) {
    case 'start':    enterStartNode(node); break;
    case 'boo':      enterBooNode(node); break;
    case 'corrupt':  enterCorruptNode(node); break;
    case 'camp':     enterCampNode(node); break;
    case 'hazard':   enterHazardNode(node); break;
    case 'story':    enterStoryNode(node); break;
    case 'shrine':   enterShrineNode(node); break;
    case 'stranger': enterStrangerNode(node); break;
    case 'boss':     enterBossNode(node); break;
    case 'valkin':   enterValkinNode(node); break;
    default:         advanceFromNode(node);
  }
}

function markCleared(nodeId) {
  if (!state.cleared.includes(nodeId)) state.cleared.push(nodeId);
}

function advanceFromNode(node, auto) {
  markCleared(node.id);
  saveState();
  // If this is the end of an act, move to next act or end game
  const connections = nodeConnections(node.id);
  if (connections.length === 0) {
    // End of current act
    if (state.act < state.map.length - 1) {
      state.act += 1;
      const nextStart = state.map[state.act].rows[0][0];
      state.position = nextStart.id;
      markCleared(nextStart.id);
      saveState();
      toast(`You cross into ${state.map[state.act].region}.`);
    } else {
      // All acts done
      endGame('victory');
      return;
    }
  }
  renderMap();
  showScreen('map');
}

// ==================== ENCOUNTER: START ====================
function enterStartNode(node) {
  markCleared(node.id);
  renderMap();
  showScreen('map');
}

// ==================== ENCOUNTER: BOO MATCH ====================
function enterBooNode(node) {
  const enemyPool = WILD_ENEMIES[state.map[state.act].region] || WILD_ENEMIES['Rolling Hills'];
  const enemy = clone(choice(enemyPool));
  enemy.maxHp = enemy.hp;
  startCombat(node, enemy, false, false);
}

function startCombat(node, enemy, isBoss, isValkin) {
  const card = $('#encounterCard');
  const region = state.map[state.act].region;
  const eyebrow = isValkin ? 'The Final BOO' : (isBoss ? `${region} — Boss` : `${region} — Encounter`);

  card.innerHTML = `
    <div class="enc-eyebrow">${eyebrow}</div>
    <div class="enc-title">${isValkin ? 'Valkin the Grand' : (isBoss ? REGION_BOSSES[region]?.name || enemy.name : enemy.name)}</div>
    <div class="enc-body">${enemy.flavor}</div>
    <div id="combatContainer"></div>
  `;
  showScreen('encounter');

  // If no active ghost ready, ask the player to pick one
  const active = getActiveCard();
  if (!active || active.hp <= 0) {
    renderGhostPicker(node, () => startCombat(node, enemy, isBoss, isValkin));
    return;
  }

  renderCombat(node, enemy, active, isBoss, isValkin);
}

function getActiveCard() {
  return state.party.find(c => c.id === state.activeGhostId && c.hp > 0)
      || state.party.find(c => c.hp > 0);
}

function renderGhostPicker(node, after) {
  const container = $('#combatContainer');
  const usable = state.party.filter(c => c.hp > 0 && !(state.koStates[c.id] > 0));
  if (usable.length === 0) {
    container.innerHTML = `
      <div class="enc-body"><em>No companion can stand. The lantern flickers alone.</em></div>
      <div class="enc-actions"><button class="btn-primary" onclick="handleWipeOut()">Retreat</button></div>
    `;
    return;
  }
  container.innerHTML = `
    <div class="enc-body">Choose a companion to stand forward.</div>
    <div class="ghost-picker" id="ghostPicker"></div>
  `;
  const picker = $('#ghostPicker');
  usable.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'picker-card';
    btn.innerHTML = `
      <div class="picker-name">${c.name}</div>
      <div class="picker-hp">HP ${c.hp}/${c.maxHp}</div>
      <div class="picker-ability">${c.abilityText}</div>
    `;
    btn.onclick = () => {
      state.activeGhostId = c.id;
      refreshHud();
      after();
    };
    picker.appendChild(btn);
  });
}

function renderCombat(node, enemy, active, isBoss, isValkin) {
  const container = $('#combatContainer');
  active.hp = active.hp || active.maxHp;

  // Shared combat state (lives in closure)
  const combat = {
    enemy,
    active,
    round: 0,
    playerDice: [],
    enemyDice: [],
    log: '',
    echoAvailable: isValkin,
    finished: false,
  };

  const render = () => {
    const region = state.map[state.act].region;
    const bossArt = isBoss && REGION_BOSSES[region]?.art;
    const heroArt = bossArt
      ? `<img src="${bossArt}" class="enc-art" alt="${enemy.name}" onerror="this.remove();">`
      : '';
    const enemyGlyph = isValkin ? '♛' : enemy.name[0];
    const rollClass = combat.justRolled ? ' rolling' : '';

    let diceTrayInner;
    if (combat.playerDice.length === 0) {
      diceTrayInner = '<div style="color:var(--ghost-dim);font-style:italic;">— Roll to begin the round —</div>';
    } else {
      const playerHtml = combat.playerDice.map(d => `<div class="die${rollClass}">${d}</div>`).join('');
      const trapHtml = combat.trapDie ? `<div class="die rigged${rollClass}" title="Hidden trap die">${combat.trapDie}</div>` : '';
      const vsSep = '<span style="align-self:center;color:var(--ghost-dim);font-family:\'IM Fell English\',serif;font-style:italic;">vs</span>';
      const enemyHtml = combat.enemyDice.map(d => `<div class="die${rollClass}">${d}</div>`).join('');
      diceTrayInner = playerHtml + vsSep + enemyHtml + trapHtml;
    }

    container.innerHTML = `
      ${heroArt}
      <div class="combat-row">
        <div class="combatant">
          <div class="combatant-name">${active.name}</div>
          <div class="combatant-portrait">${cardPortraitInner(active)}</div>
          <div class="combatant-hp">${hpBoxes(active.hp, active.maxHp)}</div>
          <div class="combatant-ability">${active.abilityText}</div>
        </div>
        <div class="vs">⚔</div>
        <div class="combatant enemy">
          <div class="combatant-name">${enemy.name}</div>
          <div class="combatant-portrait">${enemyGlyph}</div>
          <div class="combatant-hp">${hpBoxes(enemy.hp, enemy.maxHp)}</div>
          <div class="combatant-ability">${isValkin ? '<em>The match is rigged.</em>' : (region === 'Rolling Hills' && !isBoss ? '<em>Hides a trap die each round.</em>' : '')}</div>
        </div>
      </div>
      <div class="dice-tray" id="diceTray">${diceTrayInner}</div>
      <div class="combat-log">${combat.log || '<em>The encounter begins.</em>'}</div>
      <div class="enc-actions">
        <button class="btn-primary" id="btnRoll" ${combat.finished ? 'disabled' : ''}>Roll the Round</button>
        ${combat.echoAvailable && !state.grandfatherEchoUsed && state.flame >= 3 ? '<button class="btn-ghost" id="btnEcho">Grandfather\'s Echo (−3 flame)</button>' : ''}
        <button class="btn-ghost" id="btnRetreat">Retreat</button>
      </div>
    `;
    combat.justRolled = false;
    $('#btnRoll').onclick = () => rollRound(combat, node, isBoss, isValkin, render);
    const echoBtn = $('#btnEcho');
    if (echoBtn) echoBtn.onclick = () => useEcho(combat, render);
    $('#btnRetreat').onclick = () => retreatFromCombat(node);
  };

  render();
}

function rollRound(combat, node, isBoss, isValkin, rerender) {
  if (combat.finished) return;
  combat.round++;
  combat.justRolled = true;

  const region = state.map[state.act].region;

  // Roll dice
  combat.playerDice = rollDice(3);
  combat.enemyDice = rollDice(3);
  combat.trapDie = null;

  // Apply hollowe-style passive mods
  if (combat.active.passiveEnemyMod) {
    combat.enemyDice = combat.active.passiveEnemyMod(combat.enemyDice);
  }

  // --- REGIONAL PERSONALITY: Rolling Hills trap die ---
  // Bandits hide a trap die every round. It's revealed when the round resolves and
  // acts as a hidden fourth enemy die — a face of 4+ strikes, lower rolls miss.
  let trapNote = '';
  if (region === 'Rolling Hills' && !isValkin && !isBoss) {
    combat.trapDie = rollD6();
    const trapHit = combat.trapDie >= 4;
    trapNote = `<em class="dmg">A hidden trap die flips up: ${combat.trapDie} — ${trapHit ? 'it strikes' : 'it misses'}.</em><br>`;
  }

  // --- REGIONAL PERSONALITY: Frost Valley round-one freeze ---
  // The cold holds your active companion in the opening round. Their dice are shown
  // but cannot strike. The player still sees the roll so the freeze feels specific.
  let freezeNote = '';
  let frozen = false;
  if (region === 'Frost Valley' && !isValkin && combat.round === 1) {
    frozen = true;
    freezeNote = `<em>Frost Valley — the cold holds ${combat.active.name}. Their first-round dice freeze mid-air.</em><br>`;
  }

  // Rigged: Valkin flips one of your dice to 1
  let riggedNote = '';
  if (isValkin) {
    const idx = rand(combat.playerDice.length);
    combat.playerDice[idx] = 1;
    riggedNote = `<em class="dmg">Valkin bends fate — one of your dice becomes a 1.</em><br>`;
  }

  // Calculate player damage
  const playerCtx = { dice: combat.playerDice, phase: 'boo' };
  let playerDmg = combat.playerDice.filter(d => d >= 4).length;
  let trig = combat.active.trigger ? combat.active.trigger(playerCtx, state) : {};
  if (trig.bonusDmg) playerDmg += trig.bonusDmg;
  if (trig.overrideDmg != null) playerDmg = trig.overrideDmg;
  if (frozen) playerDmg = 0;
  const abilityNote = (!frozen && trig.note) ? `<em>${trig.note}</em><br>` : '';

  // Calculate enemy damage
  let enemyDmg = combat.enemyDice.filter(d => d >= 4).length + (combat.enemy.dmgBonus || 0);
  if (combat.trapDie != null && combat.trapDie >= 4) enemyDmg += 1;

  // Thorn Wall-style retaliation
  let retNote = '';
  if (trig.oppDmg && !frozen) { enemyDmg = Math.max(0, enemyDmg); combat.enemy.hp = Math.max(0, combat.enemy.hp - trig.oppDmg); retNote = ` Thorns prick the enemy for ${trig.oppDmg}.`; }

  // Apply damage simultaneously
  combat.enemy.hp = Math.max(0, combat.enemy.hp - playerDmg);
  combat.active.hp = Math.max(0, combat.active.hp - enemyDmg);

  const strikeLine = frozen
    ? `${combat.active.name} rolls <em>${combat.playerDice.join(', ')}</em> — but deals <em class="dmg">0</em>, frozen.`
    : `${combat.active.name} rolls <em>${combat.playerDice.join(', ')}</em> and strikes for <em class="dmg">${playerDmg}</em>.${retNote}`;
  combat.log = `${freezeNote}${riggedNote}${abilityNote}${trapNote}${strikeLine}<br>${combat.enemy.name} answers with <em>${combat.enemyDice.join(', ')}</em> for <em class="dmg">${enemyDmg}</em>.`;

  // Check end
  if (combat.enemy.hp <= 0 && combat.active.hp <= 0) {
    // Mutual kill — the protagonist lives. Ancient One heals extra, everyone else survives at 1 HP.
    if (combat.active.onTie) {
      const tieNote = combat.active.onTie(state, combat.active);
      if (tieNote) combat.log += `<br><em>${tieNote}</em>`;
    }
    if (combat.active.hp <= 0) combat.active.hp = 1;
    combat.log += `<br><em>${combat.active.name} falls beside the ${combat.enemy.name} — and then, impossibly, rises. 1 HP.</em>`;
    combat.finished = true;
    finishCombatWin(combat, node, isBoss, isValkin, rerender);
  } else if (combat.enemy.hp <= 0) {
    // Player won
    if (combat.active.onWin) {
      const wNote = combat.active.onWin(state, combat.active, combat.enemy);
      if (wNote) combat.log += `<br><em>${wNote}</em>`;
    }
    combat.finished = true;
    finishCombatWin(combat, node, isBoss, isValkin, rerender);
  } else if (combat.active.hp <= 0) {
    combat.finished = true;
    finishCombatLoss(combat, node, isBoss, isValkin, rerender);
  }

  rerender();
  refreshHud();
  saveState();
}

function useEcho(combat, rerender) {
  if (state.grandfatherEchoUsed || state.flame < 3) return;
  state.flame -= 3;
  state.grandfatherEchoUsed = true;
  // Restore last damage and let player roll again
  combat.active.hp = Math.min(combat.active.maxHp, combat.active.hp + 2);
  combat.enemy.hp = Math.min(combat.enemy.maxHp, combat.enemy.hp + 1);
  combat.log = '<em>Grandfather\'s Echo — the round unwinds. The lantern dims by three.</em><br>' + combat.log;
  refreshHud();
  rerender();
}

function hpBoxes(hp, max) {
  let html = '';
  for (let i = 0; i < max; i++) html += `<div class="hp-box${i < hp ? '' : ' lost'}"></div>`;
  return html;
}

function finishCombatWin(combat, node, isBoss, isValkin, rerender) {
  const container = $('#combatContainer');
  let spoils = '';
  if (isValkin) {
    spoils = 'The castle falls silent. Somewhere, a lantern you have never seen before begins to burn brighter.';
    state.wills += 3;
    state.shards += 1;
  } else if (isBoss) {
    state.flame = Math.min(state.maxFlame, state.flame + 2);
    state.wills += 2;
    spoils = 'You gain <em>+2 flame</em> and <em>+2 Wills</em>. The road opens.';
  } else {
    state.flame = Math.min(state.maxFlame, state.flame + 1);
    state.wills += 1;
    spoils = 'You gain <em>+1 flame</em> and <em>+1 Will</em>.';
  }

  setTimeout(() => {
    container.innerHTML = `
      <div class="enc-body"><strong>${combat.active.name} stands over the ${combat.enemy.name}.</strong><br>${spoils}</div>
      <div class="enc-actions">
        <button class="btn-primary" id="btnContinue">${isValkin ? 'Witness the End' : 'Walk On'}</button>
      </div>
    `;
    $('#btnContinue').onclick = () => {
      if (isValkin) {
        endGame('valkin-defeated');
      } else {
        advanceFromNode(node);
      }
    };
    refreshHud();
    saveState();
  }, 1200);
}

function finishCombatLoss(combat, node, isBoss, isValkin, rerender) {
  const container = $('#combatContainer');
  // KO the active ghost
  state.koStates[combat.active.id] = 3;
  state.flame = Math.max(0, state.flame - 1);

  setTimeout(() => {
    container.innerHTML = `
      <div class="enc-body"><em>${combat.active.name} falls. They retreat into the lantern to rest.</em><br>You lose <em class="dmg">1 flame</em>. The ${combat.enemy.name} slips back into the dark.</div>
      <div class="enc-actions">
        <button class="btn-primary" id="btnContinue">Walk On</button>
      </div>
    `;
    $('#btnContinue').onclick = () => {
      markCleared(node.id);
      // Check wipe
      const anyStanding = state.party.some(c => c.hp > 0);
      if (!anyStanding) { endGame('wipe'); return; }
      renderMap();
      showScreen('map');
    };
    refreshHud();
    saveState();
  }, 1200);
}

function handleWipeOut() {
  endGame('wipe');
}

function retreatFromCombat(node) {
  // Cost: lose 1 flame, don't clear node
  state.flame = Math.max(0, state.flame - 1);
  refreshHud();
  saveState();
  toast('You pull back into the dark. −1 flame.');
  renderMap();
  showScreen('map');
}

// ==================== ENCOUNTER: RESTORATION (Corrupted) ====================
function enterCorruptNode(node) {
  const spirit = clone(choice(CORRUPTED_SPIRITKIN));
  const region = state.map[state.act].region;

  // Dark Valley head-start
  if (region === 'Dark Valley') spirit.corruption += 2;

  const card = $('#encounterCard');
  showScreen('encounter');

  // Region-specific restoration art
  const REGION_RESTORATION_ART = {
    'Frost Valley': 'art/FrostValley-Restoration.png',
  };
  const sceneArt = REGION_RESTORATION_ART[region];

  const restore = {
    spirit,
    round: 0,
    log: '',
    finished: false,
    dice: [],
    justRolled: false,
  };

  const render = () => {
    const pct = (spirit.corruption / spirit.threshold) * 100;
    const rollClass = restore.justRolled ? ' rolling' : '';
    card.innerHTML = `
      <div class="enc-eyebrow">${region} — A Corrupted Spiritkin</div>
      <div class="enc-title">${spirit.name}</div>
      ${sceneArt ? `<img src="${sceneArt}" class="enc-art" alt="Restoration scene" onerror="this.remove();">` : ''}
      <div class="enc-body">${spirit.flavor}</div>
      <div class="corruption-frame">
        <div class="corruption-label">
          <span>Corruption ${spirit.corruption} / ${spirit.threshold}</span>
          <span>Reach 0 to Restore</span>
        </div>
        <div class="corruption-bar">
          <div class="corruption-fill" style="width:${Math.min(100,pct)}%;"></div>
          <div class="corruption-threshold" style="left:100%;"></div>
        </div>
      </div>
      <div class="dice-tray" id="diceTray">
        ${restore.dice.length === 0 ? '<div style="color:var(--ghost-dim);font-style:italic;">— Roll to channel Wills —</div>' : restore.dice.map(d => `<div class="die${rollClass} ${d >= 4 ? 'light' : ''}">${d}</div>`).join('')}
      </div>
      <div class="combat-log">${restore.log || '<em>Its corruption drifts in the air like black smoke.</em>'}</div>
      <div class="enc-actions">
        <button class="btn-primary" id="btnPurify" ${restore.finished ? 'disabled' : ''}>Channel Wills</button>
        <button class="btn-ghost" id="btnAbandon">Abandon Restoration</button>
      </div>
    `;
    restore.justRolled = false;
    $('#btnPurify').onclick = () => purifyRound(restore, node, render);
    $('#btnAbandon').onclick = () => {
      toast('You turn away. The Spiritkin flees into the dark.');
      markCleared(node.id);
      state.flame = Math.max(0, state.flame - 1);
      refreshHud();
      saveState();
      renderMap();
      showScreen('map');
    };
  };

  render();
}

function purifyRound(restore, node, rerender) {
  if (restore.finished) return;
  restore.round++;
  restore.justRolled = true;

  const active = getActiveCard();
  if (!active) {
    restore.log = '<em>No companion stands. The corruption wins.</em>';
    restore.finished = true;
    rerender();
    return;
  }

  restore.dice = rollDice(3);
  let wills = restore.dice.filter(d => d >= 4).length;

  // Ability contribution
  const ctx = { dice: restore.dice, phase: 'restoration' };
  const trig = active.trigger ? active.trigger(ctx, state) : {};
  if (trig.bonusLight) wills += trig.bonusLight;
  const abilityNote = trig.note ? `<em>${trig.note}</em><br>` : '';

  // Apply wills, then corruption advances (+1 per round — tuned per Gary review)
  restore.spirit.corruption -= wills;
  let advanceNote = '';
  if (restore.spirit.corruption > 0) {
    restore.spirit.corruption += 1;
    advanceNote = ' Its corruption advances +1.';
  }

  restore.log = `${abilityNote}${active.name} channels <em>${wills} Wills</em> (dice: ${restore.dice.join(', ')}).${advanceNote}`;

  // Resolve
  if (restore.spirit.corruption <= 0) {
    restore.finished = true;
    rerender();
    setTimeout(() => showRestorationChoice(restore.spirit, node), 1000);
    return;
  }
  if (restore.spirit.corruption >= restore.spirit.threshold) {
    restore.finished = true;
    rerender();
    setTimeout(() => {
      $('#encounterCard').innerHTML = `
        <div class="enc-eyebrow">— It Flees —</div>
        <div class="enc-title">Too Late</div>
        <div class="enc-body"><em>${restore.spirit.name} disappears into its own shadow. The lantern dims. You lose <em class="dmg">1 flame</em>.</em></div>
        <div class="enc-actions"><button class="btn-primary" id="btnC">Walk On</button></div>
      `;
      state.flame = Math.max(0, state.flame - 1);
      refreshHud();
      markCleared(node.id);
      saveState();
      $('#btnC').onclick = () => { renderMap(); showScreen('map'); };
    }, 800);
    return;
  }

  rerender();
}

function showRestorationChoice(spirit, node) {
  $('#encounterCard').innerHTML = `
    <div class="enc-eyebrow">— Restored —</div>
    <div class="enc-title">The Light Holds</div>
    <div class="enc-body">The corruption unravels. <em>${spirit.name}</em> looks at you with a small, new kind of quiet. Now you choose.</div>
    <div class="choice-grid">
      <button class="choice-card" data-choice="release">
        <span class="choice-verb">Release</span>
        <span class="choice-desc">They drift away in peace. <em>+2 flame, +2 Wills.</em></span>
      </button>
      <button class="choice-card" data-choice="recruit" ${state.party.length >= 6 ? 'disabled' : ''}>
        <span class="choice-verb">Recruit</span>
        <span class="choice-desc">They join the lantern. <em>+1 flame</em>. ${state.party.length >= 6 ? '<br>(Lantern full)' : '(Adds a companion)'}</span>
      </button>
      <button class="choice-card" data-choice="commune">
        <span class="choice-verb">Commune</span>
        <span class="choice-desc">Receive a shard of grandfather's path. <em>+1 Shard.</em></span>
      </button>
    </div>
  `;
  $$('.choice-card').forEach(btn => {
    btn.onclick = () => {
      const c = btn.dataset.choice;
      if (c === 'release') {
        state.flame = Math.min(state.maxFlame, state.flame + 2);
        state.wills += 2;
        toast('Released. +2 flame, +2 Wills.');
      } else if (c === 'recruit' && state.party.length < 6) {
        // Generate a simple companion from the pool
        const newCard = generateRecruit(spirit);
        state.party.push(newCard);
        state.flame = Math.min(state.maxFlame, state.flame + 1);
        toast(`${newCard.name} joins the lantern. +1 flame.`);
      } else if (c === 'commune') {
        state.shards += 1;
        toast('A shard of your grandfather\'s path. +1 Shard.');
      }
      markCleared(node.id);
      refreshHud();
      saveState();
      renderMap();
      showScreen('map');
    };
  });
}

function generateRecruit(spirit) {
  // Pick an unused card from the pool
  const ownedIds = state.party.map(c => c.id);
  const pool = ADVENTURE_CARDS.filter(c =>
    c.region === state.map[state.act].region && !ownedIds.includes(c.id)
  );
  const pick = pool.length > 0 ? choice(pool) : ADVENTURE_CARDS.find(c => !ownedIds.includes(c.id));
  if (!pick) {
    return { id: 'restored-' + Date.now(), name: spirit.name, region: state.map[state.act].region, maxHp: 4, hp: 4, ability: 'Quiet Light', abilityText: 'No special effect.', art: null, trigger: () => ({}) };
  }
  const c = clone(pick);
  c.hp = c.maxHp;
  return c;
}

// ==================== ENCOUNTER: CAMP ====================
function enterCampNode(node) {
  const region = state.map[state.act].region;
  const flameCost = region === 'Dark Valley' ? 2 : 1;
  const canCamp = state.flame >= flameCost;

  $('#encounterCard').innerHTML = `
    <div class="enc-eyebrow">${region} — A Quiet Place</div>
    <div class="enc-title">A Camp in the Dark</div>
    <div class="enc-body">A soft clearing. A place to sit and share the flame. <em>Camping costs ${flameCost} blue flame and restores 2 HP to every companion.</em></div>
    <div class="enc-actions">
      <button class="btn-primary" id="btnCamp" ${canCamp ? '' : 'disabled'}>Camp (−${flameCost} flame)</button>
      <button class="btn-ghost" id="btnPass">Keep Walking</button>
    </div>
  `;
  showScreen('encounter');
  $('#btnCamp').onclick = () => {
    if (!canCamp) return;
    state.flame -= flameCost;
    state.party.forEach(c => { if (c.hp > 0) c.hp = Math.min(c.maxHp, c.hp + 2); });
    toast('The party heals. The night feels kinder.');
    advanceFromNode(node);
  };
  $('#btnPass').onclick = () => advanceFromNode(node);
}

// ==================== ENCOUNTER: HAZARD ====================
const HAZARDS = {
  'Rolling Hills': { name: 'A Sudden Ford', text: 'A river, wider than it looked from the hill. You must cross.', target: 7 },
  'Frost Valley':  { name: 'A Blizzard', text: 'The snow comes down in sheets. Visibility fades. Your companions shiver in the lantern.', target: 8 },
  'Dark Valley':   { name: 'A Grasping Dark', text: 'The road is gone. Shapes move just past the firelight.', target: 9 },
  'Dark Castle':   { name: 'A Ritual Corridor', text: 'The hallway forgets its own length. The floor tries to become the ceiling.', target: 9 },
};

function enterHazardNode(node) {
  const region = state.map[state.act].region;
  const hazard = HAZARDS[region];

  $('#encounterCard').innerHTML = `
    <div class="enc-eyebrow">${region} — Hazard</div>
    <div class="enc-title">${hazard.name}</div>
    <div class="enc-body">${hazard.text}</div>
    <div class="enc-actions">
      <button class="btn-primary" id="btnPush">Push Through (roll 2d6, target ${hazard.target})</button>
      <button class="btn-ghost" id="btnShelter" ${state.flame >= 2 ? '' : 'disabled'}>Spend 2 flame to Shelter</button>
    </div>
    <div class="combat-log" id="hazardLog"></div>
  `;
  showScreen('encounter');
  $('#btnPush').onclick = () => {
    const dice = rollDice(2);
    const sum = dice[0] + dice[1];
    const pass = sum >= hazard.target;
    $('#hazardLog').innerHTML = `You roll <em>${dice.join(' + ')}</em> = <em>${sum}</em>. ${pass ? '<em>You make it through.</em>' : '<em class="dmg">The cold finds you. −1 HP, −1 flame.</em>'}`;
    if (!pass) {
      const active = getActiveCard();
      if (active) active.hp = Math.max(0, active.hp - 1);
      state.flame = Math.max(0, state.flame - 1);
      refreshHud();
    }
    saveState();
    setTimeout(() => advanceFromNode(node), 1400);
  };
  $('#btnShelter').onclick = () => {
    if (state.flame < 2) return;
    state.flame -= 2;
    toast('You wait it out. The hazard passes.');
    advanceFromNode(node);
  };
}

// ==================== ENCOUNTER: STORY BEAT ====================
const STORY_BEATS = [
  { title: 'A Rusted Bell', text: 'In a clearing you find a rusted bell hanging from a low branch. It still rings when you touch it — the same note your grandfather used to hum.' },
  { title: 'A Set of Footprints', text: 'A single trail of footprints runs along the path. Adult. Careful. Older than the wind. The lantern grows a little brighter.' },
  { title: 'Spark Digs', text: 'Spark digs up a tennis ball, mud-stained and half-forgotten. He brings it to your feet and waits, tail thumping.' },
  { title: 'A Voice on the Wind', text: 'You hear it only once, far away: your own name, in your grandfather\'s voice. Then the wind takes it.' },
  { title: 'Grandfather\'s Medallion', text: 'Caught in the roots of a cold tree — a medallion with a blue flame etched into its face. Grandfather wore one like it.' },
];

function enterStoryNode(node) {
  const beat = choice(STORY_BEATS);
  state.flame = Math.min(state.maxFlame, state.flame + 1);
  state.wills += 1;

  $('#encounterCard').innerHTML = `
    <div class="enc-eyebrow">${state.map[state.act].region} — A Quiet Moment</div>
    <div class="enc-title">${beat.title}</div>
    <div class="enc-body">${beat.text}</div>
    <div class="enc-body"><em>The lantern brightens. +1 flame, +1 Will.</em></div>
    <div class="enc-actions">
      <button class="btn-primary" id="btnOn">Walk On</button>
    </div>
  `;
  showScreen('encounter');
  refreshHud();
  saveState();
  $('#btnOn').onclick = () => advanceFromNode(node);
}

// ==================== ENCOUNTER: SHRINE ====================
function enterShrineNode(node) {
  $('#encounterCard').innerHTML = `
    <div class="enc-eyebrow">${state.map[state.act].region} — A Shrine</div>
    <div class="enc-title">A Stone That Remembers</div>
    <div class="enc-body">A shrine of pale stones. Something watches from inside it. You feel, for a moment, that it is offering a trade.</div>
    <div class="choice-grid">
      <button class="choice-card" data-c="blood"><span class="choice-verb">Offer Blood</span><span class="choice-desc">Lose 2 HP from active companion. Gain <em>+3 flame</em>.</span></button>
      <button class="choice-card" data-c="light"><span class="choice-verb">Offer Light</span><span class="choice-desc">Spend <em>3 flame</em>. Heal the whole party to full.</span></button>
      <button class="choice-card" data-c="memory"><span class="choice-verb">Offer Memory</span><span class="choice-desc">Spend <em>1 Shard</em>. Gain a permanent <em>+2 max flame</em>.</span></button>
      <button class="choice-card" data-c="walk"><span class="choice-verb">Walk On</span><span class="choice-desc">Take nothing. Give nothing.</span></button>
    </div>
  `;
  showScreen('encounter');
  $$('.choice-card').forEach(btn => {
    btn.onclick = () => {
      const c = btn.dataset.c;
      if (c === 'blood') {
        const a = getActiveCard();
        if (a && a.hp >= 3) {
          a.hp = Math.max(1, a.hp - 2);
          state.flame = Math.min(state.maxFlame, state.flame + 3);
          toast(`${a.name} bleeds for the stone. +3 flame.`);
        } else {
          toast('Not enough strength.');
          return;
        }
      } else if (c === 'light') {
        if (state.flame >= 3) {
          state.flame -= 3;
          state.party.forEach(p => { if (p.hp > 0) p.hp = p.maxHp; });
          toast('The party is whole.');
        } else {
          toast('Not enough flame.');
          return;
        }
      } else if (c === 'memory') {
        if (state.shards >= 1) {
          state.shards -= 1;
          state.maxFlame += 2;
          state.flame = Math.min(state.maxFlame, state.flame + 2);
          toast('The lantern grows. +2 max flame.');
        } else {
          toast('No shards to offer.');
          return;
        }
      }
      advanceFromNode(node);
    };
  });
}

// ==================== ENCOUNTER: STRANGER ====================
const STRANGERS = [
  { title: 'An Old Woman with a Cup', text: 'She holds out a cup of something steaming. "A gift," she says, "for the road."', offer: 'heal' },
  { title: 'A Hooded Trader', text: 'Silent. He gestures at a satchel of wills. His eyes ask for flame.', offer: 'wills' },
  { title: 'A Lost Spiritkin', text: 'A small spirit, not quite corrupted, not quite whole. It wants to come with you.', offer: 'recruit' },
];

function enterStrangerNode(node) {
  const s = choice(STRANGERS);

  $('#encounterCard').innerHTML = `
    <div class="enc-eyebrow">${state.map[state.act].region} — A Stranger</div>
    <div class="enc-title">${s.title}</div>
    <div class="enc-body">${s.text}</div>
    <div class="enc-actions" id="stActions"></div>
  `;
  showScreen('encounter');
  const actions = $('#stActions');

  if (s.offer === 'heal') {
    actions.innerHTML = `
      <button class="btn-primary" id="btnAccept">Accept the cup (full heal active companion)</button>
      <button class="btn-ghost" id="btnDecline">Walk On</button>
    `;
    $('#btnAccept').onclick = () => {
      const a = getActiveCard();
      if (a) a.hp = a.maxHp;
      toast('Warmth in the chest. The road looks lighter.');
      advanceFromNode(node);
    };
  } else if (s.offer === 'wills') {
    actions.innerHTML = `
      <button class="btn-primary" id="btnAccept" ${state.flame >= 2 ? '' : 'disabled'}>Trade 2 flame for 3 Wills</button>
      <button class="btn-ghost" id="btnDecline">Walk On</button>
    `;
    $('#btnAccept').onclick = () => {
      state.flame -= 2;
      state.wills += 3;
      toast('The trader nods once. The coins of the lantern are in your hand.');
      advanceFromNode(node);
    };
  } else if (s.offer === 'recruit') {
    const canRecruit = state.party.length < 6;
    actions.innerHTML = `
      <button class="btn-primary" id="btnAccept" ${canRecruit ? '' : 'disabled'}>Take them in</button>
      <button class="btn-ghost" id="btnDecline">Walk On</button>
    `;
    $('#btnAccept').onclick = () => {
      const newCard = generateRecruit({});
      if (newCard) {
        state.party.push(newCard);
        toast(`${newCard.name} joins the lantern.`);
      }
      advanceFromNode(node);
    };
  }
  $('#btnDecline').onclick = () => advanceFromNode(node);
}

// ==================== ENCOUNTER: BOSS ====================
function enterBossNode(node) {
  const region = state.map[state.act].region;
  const boss = clone(REGION_BOSSES[region] || { name: 'A Region Boss', hp: 10, dmgBonus: 2, flavor: 'Something rises to meet you.' });
  boss.maxHp = boss.hp;
  startCombat(node, boss, true, false);
}

function enterValkinNode(node) {
  const v = clone(VALKIN);
  v.maxHp = v.hp;
  startCombat(node, v, true, true);
}

// ==================== END GAME ====================
function endGame(outcome) {
  showScreen('end');
  const eyebrow = $('#endEyebrow');
  const title = $('#endTitle');
  const body = $('#endBody');
  const stats = $('#endStats');

  if (outcome === 'valkin-defeated') {
    eyebrow.textContent = '— The Rigged Match Falls —';
    title.innerHTML = 'The Lantern Holds.';
    body.innerHTML = `<em>You stand in the hollow throne room. The blue flame flickers, steady and stubborn. Somewhere, far beneath you, the sound of a door unlocking. This is not the end of the walk — but for today, it is enough.</em>`;
  } else if (outcome === 'wipe') {
    eyebrow.textContent = '— The Road Ends —';
    title.innerHTML = 'The lantern has gone dark.';
    body.innerHTML = `<em>Every companion has fallen. The blue flame gives one last flicker, and then there is only the wind. Somewhere, Spark begins to bark again — the sound is distant, but it is real.</em>`;
  } else {
    eyebrow.textContent = '— The Walk Continues —';
    title.innerHTML = 'A Quiet Rest.';
    body.innerHTML = `<em>You have seen more of the Overworld than you thought possible. The lantern remembers the road.</em>`;
  }

  stats.innerHTML = `
    <div><div class="end-stat-value">${state.cleared.length}</div><div class="end-stat-label">Nodes Walked</div></div>
    <div><div class="end-stat-value">${state.wills}</div><div class="end-stat-label">Wills</div></div>
    <div><div class="end-stat-value">${state.shards}</div><div class="end-stat-label">Shards</div></div>
    <div><div class="end-stat-value">${state.party.length}</div><div class="end-stat-label">Companions</div></div>
  `;
  clearSave();
}

// ==================== TOAST ====================
let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ==================== START / LOAD FLOWS ====================
function newRun() {
  state = defaultState();
  state.map = generateMap();
  const start = state.map[0].rows[0][0];
  state.position = start.id;
  state.cleared.push(start.id);
  state.started = true;
  saveState();
  refreshHud();
  renderMap();
  showScreen('map');
}

function continueRun() {
  const s = loadState();
  if (!s || !s.started) { newRun(); return; }
  state = s;
  // Rehydrate card behaviors (triggers are lost through JSON)
  state.party = state.party.map(saved => {
    const base = ADVENTURE_CARDS.find(c => c.id === saved.id);
    if (base) {
      const rehydrated = clone(base);
      rehydrated.hp = saved.hp != null ? saved.hp : rehydrated.maxHp;
      return rehydrated;
    }
    return saved;
  });
  refreshHud();
  renderMap();
  showScreen('map');
}

// ==================== INITIAL BOOT ====================
function boot() {
  // Starfield
  generateStars();

  // Initial state check
  const saved = loadState();
  state = defaultState();
  if (saved && saved.started) {
    $('#btnContinue').style.display = 'inline-block';
  }

  // Wire start screen
  $('#btnNewRun').onclick = () => { clearSave(); newRun(); };
  $('#btnContinue').onclick = () => continueRun();
  $('#btnRestart').onclick = () => { clearSave(); newRun(); };

  // Menu
  $('#menuBtn').onclick = () => {
    $('#menuModal').hidden = false;
    $('#menuHelp').hidden = true;
  };
  $('#miReturn').onclick = () => { $('#menuModal').hidden = true; };
  $('#miReset').onclick = () => {
    if (confirm('Abandon this run? The lantern will not remember.')) {
      clearSave();
      $('#menuModal').hidden = true;
      state = defaultState();
      refreshHud();
      showScreen('start');
    }
  };
  $('#miHelp').onclick = () => { $('#menuHelp').hidden = false; };
  $('#menuModal').onclick = (e) => { if (e.target.id === 'menuModal') $('#menuModal').hidden = true; };

  refreshHud();
  showScreen('start');
}

function generateStars() {
  const stars = $('#stars');
  const count = 220;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 2 + 0.3;
    const opa = Math.random() * 0.75 + 0.2;
    const dur = Math.random() * 4 + 2;
    const delay = Math.random() * 5;
    s.style.left = (Math.random() * 100) + '%';
    s.style.top = (Math.random() * 100) + '%';
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.setProperty('--opa', opa);
    s.style.setProperty('--dur', dur + 's');
    s.style.setProperty('--delay', delay + 's');
    s.style.opacity = opa;
    s.style.boxShadow = '0 0 ' + (size * 2.5) + 'px rgba(255, 255, 255, ' + (opa * 0.55) + ')';
    stars.appendChild(s);
  }
}

document.addEventListener('DOMContentLoaded', boot);
