// ══════════════════════════════════════════════════════════════════════════════
// BATTLE — Dice combat engine (adapted from Arch)
// ══════════════════════════════════════════════════════════════════════════════

let pick = null, enemy = null;
let playerHp, enemyHp, round, battleOver;
let currentEnemyRoll = null;
let iceShards = 0, sacredFires = 0;
let playerBonusDice = 0, enemyBonusDice = 0;
let playerRemoveDice = 0, enemyRemoveDice = 0;
let isFirstRoll = true;
let bogeyReflectUsed = false;
let tookDamageLastRound = false;
let isBossFight = false;
let battleItemsUsed = [];

// ── DICE ENGINE ──

function rollDice(count) {
  const dice = [];
  for (let i = 0; i < Math.max(1, count); i++) {
    dice.push(Math.floor(Math.random() * 6) + 1);
  }
  return dice;
}

function analyzeRoll(dice) {
  const sorted = [...dice].sort((a, b) => b - a);
  const counts = {};
  dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
  const maxCount = Math.max(...Object.values(counts));
  const matchVal = +Object.keys(counts).find(k => counts[k] === maxCount);
  if (maxCount >= 3) return { type: 'triples', value: matchVal, damage: 3, dice: sorted, matchDie: matchVal };
  if (maxCount === 2) {
    const pairVal = +Object.keys(counts).find(k => counts[k] === 2);
    const kicker = +Object.keys(counts).find(k => counts[k] === 1);
    return { type: 'doubles', value: pairVal, kicker, damage: 2, dice: sorted, matchDie: pairVal };
  }
  return { type: 'singles', value: sorted[0], damage: 1, dice: sorted, matchDie: null };
}

function compareRolls(pRoll, eRoll) {
  const rank = { singles: 0, doubles: 1, triples: 2 };
  if (rank[pRoll.type] !== rank[eRoll.type]) return rank[pRoll.type] > rank[eRoll.type] ? 1 : -1;
  if (pRoll.type === 'triples') return pRoll.value > eRoll.value ? 1 : pRoll.value < eRoll.value ? -1 : 0;
  if (pRoll.type === 'doubles') {
    if (pRoll.value !== eRoll.value) return pRoll.value > eRoll.value ? 1 : -1;
    return (pRoll.kicker || 0) > (eRoll.kicker || 0) ? 1 : (pRoll.kicker || 0) < (eRoll.kicker || 0) ? -1 : 0;
  }
  for (let i = 0; i < Math.max(pRoll.dice.length, eRoll.dice.length); i++) {
    if ((pRoll.dice[i] || 0) > (eRoll.dice[i] || 0)) return 1;
    if ((pRoll.dice[i] || 0) < (eRoll.dice[i] || 0)) return -1;
  }
  return 0;
}

function describeRoll(roll) {
  if (roll.type === 'triples') return `three ${roll.value}'s`;
  if (roll.type === 'doubles') return `two ${roll.value}'s and a ${roll.kicker}`;
  return roll.dice.join(', ');
}

// ── BATTLE FLOW ──

function showPreBattle(enemyGhost, boss) {
  isBossFight = !!boss;
  enemy = { ...enemyGhost };
  enemyHp = enemy.hp;

  showScreen('prebattleScreen');
  document.getElementById('pbTitle').textContent = boss ? `Boss: ${enemy.name}` : enemy.name;
  document.getElementById('pbEnemyCard').innerHTML = `<img src="${IMG}${enemy.file}">`;
  document.getElementById('pbEnemyName').textContent = enemy.name;
  document.getElementById('pbStats').innerHTML = `
    <div>${enemy.name} — ${enemy.hp} HP — ${enemy.ability}: ${enemy.abilityDesc}</div>
  `;

  // Ghost selector
  const sel = document.getElementById('pbGhostSelect');
  sel.innerHTML = '';
  game.collection.forEach((g, i) => {
    const card = document.createElement('div');
    card.className = 'pb-ghost-card' + (i === 0 ? ' selected' : '');
    card.innerHTML = `<img src="${IMG}${g.file}"><div class="pb-ghost-name">${g.name}</div><div class="pb-ghost-hp">${g.hp}/${g.maxHp}</div>`;
    card.onclick = () => {
      sel.querySelectorAll('.pb-ghost-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      game.selectedGhostIndex = i;
      document.getElementById('pbPlayerCard').innerHTML = `<img src="${IMG}${g.file}">`;
      document.getElementById('pbPlayerName').textContent = g.name;
    };
    sel.appendChild(card);
  });

  game.selectedGhostIndex = 0;
  const g = game.collection[0];
  document.getElementById('pbPlayerCard').innerHTML = `<img src="${IMG}${g.file}">`;
  document.getElementById('pbPlayerName').textContent = g.name;
}

function startBattle() {
  pick = { ...game.collection[game.selectedGhostIndex] };
  playerHp = pick.hp;
  round = 1;
  battleOver = false;
  isFirstRoll = true;
  bogeyReflectUsed = false;
  tookDamageLastRound = false;
  playerBonusDice = 0; enemyBonusDice = 0;
  playerRemoveDice = 0; enemyRemoveDice = 0;
  battleItemsUsed = [];

  showScreen('battleScreen');
  document.getElementById('enemyCard').innerHTML = `<img src="${IMG}${enemy.file}">`;
  document.getElementById('playerCard').innerHTML = `<img src="${IMG}${pick.file}">`;
  document.getElementById('enemyNameText').textContent = enemy.name;
  document.getElementById('playerNameText').textContent = pick.name;
  updateHpDisplay();
  renderBattleItems();

  narrate(`${enemy.name} rolls first...`);
  document.getElementById('rollBtn').style.display = 'none';

  setTimeout(doEnemyRoll, 1200);
}

function doEnemyRoll() {
  if (battleOver) return;
  const count = Math.max(1, 3 + enemyBonusDice - enemyRemoveDice);
  const dice = rollDice(count);
  currentEnemyRoll = analyzeRoll(dice);
  enemyBonusDice = 0; enemyRemoveDice = 0;

  // Show enemy dice
  for (let i = 0; i < 3; i++) {
    const el = document.getElementById('eDie' + i);
    el.textContent = dice[i] || '';
    el.style.display = dice[i] ? 'flex' : 'none';
  }

  playSfx('sfxDiceRoll');
  narrate(`${enemy.name} rolled ${describeRoll(currentEnemyRoll)}. Your turn!`);
  document.getElementById('rollBtn').style.display = 'block';
}

function doPlayerRoll() {
  if (battleOver || !currentEnemyRoll) return;
  document.getElementById('rollBtn').style.display = 'none';

  // Before-roll abilities
  if (pick.ability === 'Seeker' && playerHp < enemyHp) {
    playerHp = Math.min(playerHp + 1, pick.maxHp);
    updateHpDisplay();
  }
  if (pick.ability === 'Sploop!' && isFirstRoll) {
    iceShards += 2;
  }
  // Shade: after first roll, enemy takes 1 before each roll
  if (pick.ability === 'Haunt' && !isFirstRoll) {
    enemyHp -= 1;
    updateHpDisplay();
    if (enemyHp <= 0) { enemyDefeated(); return; }
  }

  const count = Math.max(1, 3 + playerBonusDice - playerRemoveDice);
  const dice = rollDice(count);
  const playerRoll = analyzeRoll(dice);
  playerBonusDice = 0; playerRemoveDice = 0;

  // Show player dice
  for (let i = 0; i < 3; i++) {
    const el = document.getElementById('pDie' + i);
    el.textContent = dice[i] || '';
    el.style.display = dice[i] ? 'flex' : 'none';
  }

  playSfx('sfxDiceRoll');

  // Patrick: Stone Form
  if (pick.ability === 'Stone Form') {
    if (currentEnemyRoll.type === 'singles') {
      narrate(`Stone Form! Negated damage, dealt 3 to ${enemy.name}!`);
      enemyHp -= 3;
      updateHpDisplay();
      if (enemyHp <= 0) { enemyDefeated(); return; }
      isFirstRoll = false;
      round++;
      setTimeout(doEnemyRoll, 1500);
      return;
    }
  }

  const result = compareRolls(playerRoll, currentEnemyRoll);
  let narratorText = '';

  if (result > 0) {
    // Player wins
    let damage = playerRoll.damage;

    // Ability bonuses
    if (pick.ability === 'Protector' && playerRoll.type === 'singles') damage += 1;
    if (pick.ability === 'Slash' && dice.every(d => d % 2 === 1)) damage += 5;
    if (pick.ability === 'One-two-one!' && playerRoll.type === 'doubles' && playerRoll.value === 1) damage *= 3;
    if (pick.ability === 'Snowball' && playerRoll.type === 'doubles') damage += 2;
    if (pick.ability === 'Blue Fire') damage += 1;
    if (pick.ability === 'Fiendship') damage += 2;
    if (pick.ability === 'Beast Mode' && playerRoll.type === 'doubles') damage *= 2;
    if (pick.ability === 'Lurk' && isFirstRoll) damage *= 3;
    if (pick.ability === 'Ambush' && isFirstRoll) damage *= 3;
    if (pick.ability === 'Valley Magic') iceShards += 2;
    if (pick.ability === 'Let\'s Dance' && playerRoll.type === 'doubles') playerBonusDice += 1;
    if (pick.ability === 'Burning Soul') sacredFires += 1;

    // Ice Shards
    if (iceShards > 0) {
      const shardDmg = pick.ability === 'Winter Barrage' ? iceShards * 2 : iceShards;
      damage += shardDmg;
      iceShards = 0;
    }
    // Sacred Fires
    if (sacredFires > 0) {
      damage += sacredFires;
      sacredFires = 0;
    }

    // Kodako: 1-2-3
    if (pick.ability === 'Swift' && dice.includes(1) && dice.includes(2) && dice.includes(3)) {
      damage = 4;
    }

    enemyHp -= damage;
    tookDamageLastRound = false;
    narratorText = `You rolled ${describeRoll(playerRoll)}. ${damage} damage to ${enemy.name}!`;
    playSfx(damage >= 3 ? 'sfx3Damage' : damage >= 2 ? 'sfx2Damage' : 'sfx1Damage');

    // Doubles healing
    if (pick.ability === 'Restore' && playerRoll.type === 'doubles') {
      playerHp = Math.min(playerHp + 2, pick.maxHp);
    }

  } else if (result < 0) {
    // Enemy wins
    let damage = currentEnemyRoll.damage;

    // Enemy ability bonuses
    if (enemy.ability === 'Blue Fire') damage += 1;
    if (enemy.ability === 'Fiendship') damage += 2;
    if (enemy.ability === 'Beast Mode' && currentEnemyRoll.type === 'doubles') damage *= 2;
    if (enemy.ability === 'Snowball' && currentEnemyRoll.type === 'doubles') damage += 2;

    // Protector: singles beat doubles
    if (pick.ability === 'Protector' && playerRoll.type === 'singles' && currentEnemyRoll.type === 'doubles') {
      damage = 0;
      narratorText = `Protector! Singles beat doubles!`;
    }

    // Shield item
    if (damage > 0 && game.items.includes('shield') && !battleItemsUsed.includes('shield')) {
      damage = 0;
      battleItemsUsed.push('shield');
      narratorText = `Spirit Shield blocked the hit!`;
    }

    // Bogey reflect
    if (damage > 0 && pick.ability === 'Bogus' && !bogeyReflectUsed) {
      bogeyReflectUsed = true;
      enemyHp -= damage;
      damage = 0;
      narratorText = `Bogus! Reflected ${damage} damage back!`;
    }

    // Stoic: below 6 HP immune to singles
    if (pick.ability === 'Stoic' && playerHp < 6 && currentEnemyRoll.type === 'singles') {
      damage = 0;
      narratorText = `Stoic! Immune to singles below 6 HP!`;
    }

    // King Jay: reflection on 7
    if (pick.ability === 'Reflection' && playerRoll.dice.reduce((a, b) => a + b, 0) === 7) {
      enemyHp -= damage;
      damage = 0;
      narratorText = `Reflection! Dice total 7 — damage reflected!`;
    }

    if (damage > 0) {
      playerHp -= damage;
      tookDamageLastRound = true;
      if (pick.ability === 'Brew Time') sacredFires += 1;
      if (pick.ability === 'Tough Job') iceShards += 1;
      if (pick.ability === 'Glacial Pounding' && damage >= 3) playerBonusDice += 4;
      // Balatron counter die
      if (pick.ability === 'Party Time' && playerHp > 0) {
        const counter = Math.floor(Math.random() * 6) + 1;
        enemyHp -= counter;
        narratorText = `Lost the roll, but Party Time! Counter die: ${counter} damage!`;
      } else {
        narratorText = `${enemy.name} rolled ${describeRoll(currentEnemyRoll)}. You took ${damage} damage!`;
      }
      playSfx(damage >= 3 ? 'sfx3Damage' : 'sfx1Damage');
    }

    // Cameron: if damage negated, destroy enemy
    if (pick.ability === 'Force of Nature' && damage === 0 && currentEnemyRoll.damage > 0) {
      enemyHp = 0;
      narratorText = `Force of Nature! Damage negated — enemy destroyed!`;
    }

  } else {
    narratorText = `Tie! Both rolled ${describeRoll(playerRoll)}. No damage.`;
    tookDamageLastRound = false;
  }

  // Outlaw: doubles remove enemy die
  if (pick.ability === 'Thief' && playerRoll.type === 'doubles') {
    enemyRemoveDice += 1;
  }
  // Piper: slick coat
  if (pick.ability === 'Slick Coat') {
    enemyRemoveDice += 1;
  }

  updateHpDisplay();
  narrate(narratorText);
  isFirstRoll = false;
  round++;

  // Check outcomes
  if (enemyHp <= 0) {
    setTimeout(enemyDefeated, 1200);
  } else if (playerHp <= 0) {
    setTimeout(playerDefeated, 1200);
  } else {
    setTimeout(doEnemyRoll, 1800);
  }
}

function enemyDefeated() {
  battleOver = true;
  narrate(`${enemy.name} defeated!`);

  // Update ghost HP
  game.collection[game.selectedGhostIndex].hp = Math.max(1, playerHp);

  // Mark node visited
  const nodes = game.regionMaps[game.currentRegion];
  const node = nodes.find(n => n.id === game.currentNode);
  if (node) node.visited = true;

  if (isBossFight) {
    game.bossesBeaten++;
    // Check if this was the final boss
    if (game.currentRegion === REGIONS.length - 1) {
      setTimeout(showVictory, 1500);
      return;
    }
  }

  // Show rewards
  setTimeout(() => showRewards(isBossFight), 1000);
}

function playerDefeated() {
  battleOver = true;

  // Powder: Final Gift
  if (pick.ability === 'Final Gift') {
    iceShards += 3;
  }

  // Remove ghost (permadeath)
  game.collection.splice(game.selectedGhostIndex, 1);
  game.deadGhosts.push(pick.name);

  // Mark node visited — you fought here, win or lose
  const nodes = game.regionMaps[game.currentRegion];
  const node = nodes.find(n => n.id === game.currentNode);
  if (node) node.visited = true;

  if (game.collection.length === 0) {
    setTimeout(showGameOver, 1500);
  } else {
    narrate(`${pick.name} has fallen...`);
    setTimeout(() => {
      saveGame();
      showMap();
    }, 2000);
  }
}

function showRewards(wasBoss) {
  showScreen('rewardScreen');
  const loot = document.getElementById('rewardLoot');
  const ghostPick = document.getElementById('rewardGhostPick');
  let html = '';

  // Item reward
  if (wasBoss) {
    // Boss drops a key or special item
    const regionIdx = game.currentRegion;
    if (regionIdx === 0) {
      gainItem('key_cavern');
      html += `<div class="reward-item"><span>${ITEMS.key_cavern.icon}</span> ${ITEMS.key_cavern.name} — ${ITEMS.key_cavern.desc}</div>`;
    } else if (regionIdx === 1) {
      gainItem('key_palace');
      html += `<div class="reward-item"><span>${ITEMS.key_palace.icon}</span> ${ITEMS.key_palace.name} — ${ITEMS.key_palace.desc}</div>`;
    } else if (regionIdx === 2) {
      gainItem('key_castle');
      html += `<div class="reward-item"><span>${ITEMS.key_castle.icon}</span> ${ITEMS.key_castle.name} — ${ITEMS.key_castle.desc}</div>`;
    }
    html += `<div class="reward-item"><span>⚡</span> Power Shard</div>`;
    gainItem('power');
  } else {
    const drop = ['reroll', 'heal', 'power'][Math.floor(Math.random() * 3)];
    gainItem(drop);
    html += `<div class="reward-item"><span>${ITEMS[drop].icon}</span> ${ITEMS[drop].name}</div>`;
  }

  loot.innerHTML = html;

  // Ghost recruit — pick from 2 random options
  const weights = ENCOUNTER_WEIGHTS[Math.min(game.currentRegion, ENCOUNTER_WEIGHTS.length - 1)];
  const options = [];
  for (let i = 0; i < 2; i++) {
    let rarity = weightedRarity(weights);
    const pool = ALL_GHOSTS.filter(g => g.rarity === rarity && !game.collection.find(c => c.name === g.name) && !options.find(o => o.name === g.name));
    if (pool.length > 0) options.push({ ...pool[Math.floor(Math.random() * pool.length)] });
  }

  if (options.length > 0) {
    ghostPick.innerHTML = '<div class="reward-ghost-label">Recruit a new Spiritkin:</div>' +
      options.map((g, i) => `
        <div class="reward-ghost-option" onclick="selectRewardGhost(${i})" id="rewardGhost${i}">
          <img src="${IMG}${g.file}">
          <div class="rgo-name">${g.name}</div>
          <div class="rgo-stats">${g.maxHp} HP — ${g.ability}</div>
          <div class="rgo-desc">${g.abilityDesc}</div>
        </div>
      `).join('');
    game.pendingRewardGhosts = options;
    game.selectedRewardGhost = -1;
  } else {
    ghostPick.innerHTML = '';
    game.pendingRewardGhosts = [];
  }
}

function selectRewardGhost(index) {
  game.selectedRewardGhost = index;
  document.querySelectorAll('.reward-ghost-option').forEach((el, i) => {
    el.classList.toggle('selected', i === index);
  });
}

function collectAndReturn() {
  // Add selected ghost
  if (game.pendingRewardGhosts && game.selectedRewardGhost >= 0) {
    const ghost = game.pendingRewardGhosts[game.selectedRewardGhost];
    game.collection.push({ ...ghost, hp: ghost.maxHp });
  }

  game.iceShards = iceShards;
  game.sacredFires = sacredFires;
  saveGame();
  showMap();
}

function weightedRarity(weights) {
  const roll = Math.random();
  let cum = 0;
  for (const [rarity, w] of Object.entries(weights)) {
    cum += w;
    if (roll < cum) return rarity;
  }
  return 'common';
}

// ── UI HELPERS ──

function updateHpDisplay() {
  document.getElementById('enemyHpText').textContent = `${Math.max(0, enemyHp)}/${enemy.maxHp || enemy.hp}`;
  document.getElementById('playerHpText').textContent = `${Math.max(0, playerHp)}/${pick.maxHp}`;
  const ePct = Math.max(0, enemyHp / (enemy.maxHp || enemy.hp) * 100);
  const pPct = Math.max(0, playerHp / pick.maxHp * 100);
  document.getElementById('enemyHpBar').style.width = ePct + '%';
  document.getElementById('playerHpBar').style.width = pPct + '%';
}

function renderBattleItems() {
  const el = document.getElementById('battleItems');
  const usable = game.items.filter(id => !ITEMS[id]?.keyItem && !battleItemsUsed.includes(id));
  el.innerHTML = usable.map(id => `<button class="battle-item-btn" onclick="useBattleItem('${id}')">${ITEMS[id].icon} ${ITEMS[id].name}</button>`).join('');
}

function useBattleItem(id) {
  if (battleItemsUsed.includes(id)) return;
  if (id === 'heal') {
    playerHp = Math.min(playerHp + 4, pick.maxHp);
    updateHpDisplay();
    narrate(`Used Spirit Potion! +4 HP`);
  } else if (id === 'power') {
    playerBonusDice += 1;
    narrate(`Power Shard! +1 die this roll!`);
  } else if (id === 'lucky_dice') {
    // Will be handled on next loss
    narrate(`Lucky Dice activated!`);
  }
  battleItemsUsed.push(id);
  // Remove from inventory
  const idx = game.items.indexOf(id);
  if (idx >= 0) game.items.splice(idx, 1);
  renderBattleItems();
}

function narrate(text) {
  const el = document.getElementById('narrator');
  if (el) el.innerHTML = text;
}

function playSfx(id) {
  const el = document.getElementById(id);
  if (el) { el.currentTime = 0; el.play().catch(() => {}); }
}
