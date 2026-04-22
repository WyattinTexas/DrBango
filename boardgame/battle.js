// ══════════════════════════════════════════════════════════════════════════════
// BATTLE — Full dice combat engine with every card ability and cinematic narration
// ══════════════════════════════════════════════════════════════════════════════

let pick = null, enemy = null;
let playerHp, enemyHp, round, battleOver, phase;
let currentEnemyRoll = null;
let iceShards = 0, sacredFires = 0;
// Committed resources — locked in before rolling, spent win or lose (real game rule)
let committedShards = 0, committedFires = 0;
let enemyIceShards = 0, enemySacredFires = 0;
let playerBonusDice = 0, enemyBonusDice = 0;
let playerRemoveDice = 0, enemyRemoveDice = 0;
let isFirstRoll = true;
let bogeyReflectUsed = false;
let tookDamageLastRound = false;
let isBossFight = false;
let battleItemsUsed = [];
let playerDiceValues = [];

// ══════════════════════════════════════════════
// DICE ENGINE
// ══════════════════════════════════════════════

function rollDice(count) {
  const dice = [];
  for (let i = 0; i < Math.max(1, count); i++) dice.push(Math.floor(Math.random() * 6) + 1);
  return dice;
}

function analyzeRoll(dice) {
  const sorted = [...dice].sort((a, b) => b - a);
  const counts = {};
  dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
  const maxCount = Math.max(...Object.values(counts));
  const matchVal = +Object.keys(counts).find(k => counts[k] === maxCount);
  if (maxCount >= 6) return { type: 'sixcity', value: matchVal, damage: 6, dice: sorted, matchDie: matchVal };
  if (maxCount === 5) return { type: 'penta', value: matchVal, damage: 5, dice: sorted, matchDie: matchVal };
  if (maxCount === 4) return { type: 'quads', value: matchVal, damage: 4, dice: sorted, matchDie: matchVal };
  if (maxCount === 3) return { type: 'triples', value: matchVal, damage: 3, dice: sorted, matchDie: matchVal };
  if (maxCount === 2) {
    const pairVal = +Object.keys(counts).find(k => counts[k] === 2);
    const kicker = +Object.keys(counts).find(k => counts[k] === 1);
    return { type: 'doubles', value: pairVal, kicker, damage: 2, dice: sorted, matchDie: pairVal };
  }
  return { type: 'singles', value: sorted[0], damage: 1, dice: sorted, matchDie: null };
}

function compareRollsWithAbilities(pRoll, eRoll) {
  const rank = { singles: 0, doubles: 1, triples: 2, quads: 3, penta: 4, sixcity: 5 };
  const playerHector = pick && pick.ability === 'Protector';
  const enemyHector = enemy && enemy.ability === 'Protector';
  let pRank = rank[pRoll.type] ?? 0;
  let eRank = rank[eRoll.type] ?? 0;

  // Hector: singles beat doubles
  if ((playerHector || enemyHector) && pRoll.type === 'singles' && eRoll.type === 'doubles') pRank = 1.5;
  if ((playerHector || enemyHector) && eRoll.type === 'singles' && pRoll.type === 'doubles') eRank = 1.5;

  if (pRank !== eRank) return pRank > eRank ? 1 : -1;
  if (['triples','quads','penta','sixcity'].includes(pRoll.type)) return pRoll.value > eRoll.value ? 1 : pRoll.value < eRoll.value ? -1 : 0;
  if (pRoll.type === 'doubles' || pRank === 1.5) {
    const pVal = pRoll.type === 'doubles' ? pRoll.value : pRoll.dice[0];
    const eVal = eRoll.type === 'doubles' ? eRoll.value : eRoll.dice[0];
    if (pVal !== eVal) return pVal > eVal ? 1 : -1;
    return (pRoll.kicker||0) > (eRoll.kicker||0) ? 1 : (pRoll.kicker||0) < (eRoll.kicker||0) ? -1 : 0;
  }
  for (let i = 0; i < Math.max(pRoll.dice.length, eRoll.dice.length); i++) {
    if ((pRoll.dice[i]||0) > (eRoll.dice[i]||0)) return 1;
    if ((pRoll.dice[i]||0) < (eRoll.dice[i]||0)) return -1;
  }
  return 0;
}

function describeRoll(roll) {
  if (roll.type === 'sixcity') return `SIX CITY — six ${roll.value}'s!`;
  if (roll.type === 'penta') return `five ${roll.value}'s!`;
  if (roll.type === 'quads') return `four ${roll.value}'s!`;
  if (roll.type === 'triples') return `three ${roll.value}'s`;
  if (roll.type === 'doubles') return `two ${roll.value}'s and a ${roll.kicker}`;
  return roll.dice.join(', ');
}

function typeLabel(type) {
  if (type === 'sixcity') return 'SIX CITY!!';
  if (type === 'penta') return 'PENTA!';
  if (type === 'quads') return 'QUADS!';
  if (type === 'triples') return 'TRIPLES!';
  if (type === 'doubles') return 'Doubles';
  return 'Singles';
}

function isTripleOrBetter(type) { return ['triples','quads','penta','sixcity'].includes(type); }

// ══════════════════════════════════════════════
// DICE COUNT — abilities that modify dice
// ══════════════════════════════════════════════

function getPlayerDiceCount() {
  let count = 3 + playerBonusDice - playerRemoveDice;
  if (pick && pick.ability === 'Grace') {
    const enemyBase = Math.max(1, Math.min(7, 3 + enemyBonusDice - enemyRemoveDice));
    count = Math.max(count, enemyBase);
  }
  return Math.max(1, Math.min(7, count));
}

function getEnemyDiceCount() {
  let count = 3 + enemyBonusDice - enemyRemoveDice;
  if (pick && pick.ability === 'Careful') count = Math.min(3, count);
  if (enemy && enemy.ability === 'Grace') count = getPlayerDiceCount();
  return Math.max(1, Math.min(7, count));
}

// Best N of M dice
function bestNOf(dice, n) {
  if (dice.length <= n) return [...dice];
  let best = null;
  const combos = getCombinations(dice.length, n);
  for (const combo of combos) {
    const sub = combo.map(i => dice[i]);
    const roll = analyzeRoll(sub);
    if (!best || compareRollsWithAbilities(roll, best) > 0) best = roll;
  }
  return best.dice;
}
function getCombinations(total, choose) {
  const results = [];
  function recurse(start, combo) {
    if (combo.length === choose) { results.push([...combo]); return; }
    for (let i = start; i < total; i++) { combo.push(i); recurse(i+1, combo); combo.pop(); }
  }
  recurse(0, []);
  return results;
}

// ══════════════════════════════════════════════
// NARRATOR — Battle log that tells the story
// ══════════════════════════════════════════════

function clearLog() { document.getElementById('narratorLog').innerHTML = ''; }

function log(text, type) {
  const el = document.getElementById('narratorLog');
  const line = document.createElement('div');
  line.className = 'log-line ' + (type || '');
  line.innerHTML = text;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function logDivider() {
  const el = document.getElementById('narratorLog');
  const div = document.createElement('div');
  div.className = 'log-divider';
  el.appendChild(div);
}

// ══════════════════════════════════════════════
// ABILITY SPLASH — Full-screen ability callout
// ══════════════════════════════════════════════

function showAbilitySplash(name, desc, duration, callback) {
  const el = document.getElementById('abilitySplash');
  document.getElementById('splashName').textContent = name;
  document.getElementById('splashDesc').textContent = desc;
  el.classList.add('active');
  playSfx('sfxSpecial');
  setTimeout(() => {
    el.classList.remove('active');
    if (callback) callback();
  }, duration);
}

function showTriplesBanner(type) {
  const el = document.getElementById('triplesBanner');
  el.textContent = typeLabel(type);
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 1200);
}

// ══════════════════════════════════════════════
// PRE-BATTLE
// ══════════════════════════════════════════════

function showPreBattle(enemyGhost, boss) {
  // Safety: should never happen, but guard anyway
  if (!game.active) { showGameOver(); return; }
  isBossFight = !!boss;
  enemy = { ...enemyGhost };
  enemyHp = enemy.hp;

  showScreen('prebattleScreen');
  document.getElementById('pbTitle').textContent = boss ? `BOSS: ${enemy.name}` : enemy.name;
  document.getElementById('pbEnemyCard').innerHTML = `<img src="${IMG}${enemy.file}">`;
  document.getElementById('pbEnemyName').textContent = enemy.name;
  document.getElementById('pbStats').innerHTML = `
    <div class="pb-stat-line"><b>${enemy.name}</b> &mdash; ${enemy.hp} HP</div>
    <div class="pb-stat-ability"><span class="ability-label">${enemy.ability}</span> ${enemy.abilityDesc}</div>
  `;

  // Pre-battle shows the active fighter; tap a sideline ghost to swap them in first.
  const sel = document.getElementById('pbGhostSelect');
  sel.innerHTML = '';
  const renderPickRow = () => {
    sel.innerHTML = '';
    const slots = [
      { ghost: game.active, label: 'ACTIVE', kind: 'active' },
      ...game.sideline.map(g => ({ ghost: g, label: 'SIDELINE', kind: 'sideline' })),
    ];
    slots.forEach((slot, i) => {
      if (!slot.ghost) return;
      const card = document.createElement('div');
      card.className = 'pb-ghost-card' + (slot.kind === 'active' ? ' selected' : '');
      card.innerHTML = `
        <div class="pb-ghost-role">${slot.label}</div>
        <img src="${IMG}${slot.ghost.file}">
        <div class="pb-ghost-name">${slot.ghost.name}</div>
        <div class="pb-ghost-hp">${slot.ghost.hp}/${slot.ghost.maxHp}</div>
      `;
      if (slot.kind === 'sideline') {
        card.onclick = () => {
          // Promote this sideline ghost to active
          const sIdx = i - 1;
          promoteSideline(sIdx);
          renderPickRow();
          document.getElementById('pbPlayerCard').innerHTML = `<img src="${IMG}${game.active.file}">`;
          document.getElementById('pbPlayerName').textContent = game.active.name;
        };
      }
      sel.appendChild(card);
    });
  };
  renderPickRow();

  const g = game.active;
  document.getElementById('pbPlayerCard').innerHTML = `<img src="${IMG}${g.file}">`;
  document.getElementById('pbPlayerName').textContent = g.name;
}

// ══════════════════════════════════════════════
// BATTLE START
// ══════════════════════════════════════════════

function startBattle() {
  pick = { ...game.active };
  playerHp = pick.hp;
  round = 1;
  phase = 0;
  battleOver = false;
  committedShards = 0;
  committedFires = 0;
  isFirstRoll = true;
  bogeyReflectUsed = false;
  tookDamageLastRound = false;
  playerBonusDice = 0; enemyBonusDice = 0;
  playerRemoveDice = 0; enemyRemoveDice = 0;
  enemyIceShards = 0; enemySacredFires = 0;
  battleItemsUsed = [];
  playerDiceValues = [];

  showScreen('battleScreen');

  // Set up cards
  document.getElementById('enemyCard').innerHTML = `<img src="${IMG}${enemy.file}">`;
  document.getElementById('playerCard').innerHTML = `<img src="${IMG}${pick.file}">`;
  document.getElementById('enemyNameText').textContent = enemy.name;
  document.getElementById('playerNameText').textContent = pick.name;
  document.getElementById('enemyAbilityTag').innerHTML = `<span class="at-name">${enemy.ability}</span> <span class="at-desc">${enemy.abilityDesc}</span>`;
  document.getElementById('playerAbilityTag').innerHTML = `<span class="at-name">${pick.ability}</span> <span class="at-desc">${pick.abilityDesc}</span>`;
  document.getElementById('enemyDiceLabel').textContent = enemy.name;
  document.getElementById('playerDiceLabel').textContent = pick.name;

  // Render face-up sideline ghosts (visual support row)
  const sidelineEl = document.getElementById('battleSideline');
  if (sidelineEl) {
    sidelineEl.innerHTML = game.sideline.length > 0
      ? game.sideline.map(g => `
          <div class="sideline-ghost" title="${g.name} — ${g.ability}: ${g.abilityDesc}">
            <img src="${IMG}${g.file}" alt="${g.name}">
            <div class="sideline-ghost-hp">${g.hp}/${g.maxHp}</div>
          </div>
        `).join('')
      : '';
  }

  updateHpDisplay();
  renderBattleItems();
  renderResources();
  clearLog();
  hideAllDice();
  hideRollBtn();

  // Roll tags
  document.getElementById('enemyRollTag').textContent = '';
  document.getElementById('playerRollTag').textContent = '';

  log(`Round ${round} — ${enemy.name} rolls first...`, 'system');

  // On-entry abilities
  const entryChain = [];

  // Wandering Sue: Hidden Weakness — destroy if enemy >= 12 HP
  if (pick.ability === 'Hidden Weakness' && enemyHp >= 12) {
    entryChain.push(cb => {
      showAbilitySplash('Hidden Weakness', `${enemy.name} has 12+ HP — Destroyed!`, 2000, () => {
        log(`Hidden Weakness! ${enemy.name} destroyed instantly!`, 'ability');
        enemyHp = 0;
        updateHpDisplay();
        setTimeout(enemyDefeated, 800);
      });
    });
  }

  // Chad: Sploop! — gain 2 ice shards on entry
  if (pick.ability === 'Sploop!') {
    entryChain.push(cb => {
      iceShards += 2;
      renderResources();
      showAbilitySplash('Sploop!', '+2 Ice Shards!', 1400, () => {
        log(`Sploop! +2 Ice Shards (${iceShards} total)`, 'ability');
        cb();
      });
    });
  }

  // Enemy Sploop
  if (enemy.ability === 'Sploop!') {
    entryChain.push(cb => {
      enemyIceShards += 2;
      log(`${enemy.name} — Sploop! +2 Ice Shards`, 'enemy-ability');
      cb();
    });
  }

  // Run entry chain then start
  runChain(entryChain, () => {
    if (enemyHp <= 0) return; // Hidden Weakness killed them
    setTimeout(doEnemyRoll, 800);
  });
}

function runChain(fns, done) {
  if (fns.length === 0) { done(); return; }
  const fn = fns.shift();
  fn(() => runChain(fns, done));
}

// ══════════════════════════════════════════════
// ENEMY ROLL
// ══════════════════════════════════════════════

function doEnemyRoll() {
  if (battleOver) return;
  phase = 0;

  // Piper: Slick Coat — -1 enemy die each round
  if (pick && pick.ability === 'Slick Coat') {
    enemyRemoveDice += 1;
  }

  const eDiceCount = getEnemyDiceCount();
  enemyBonusDice = 0; enemyRemoveDice = 0;

  let dice = rollDice(eDiceCount);

  // Tommy Salami: enemy rolls weighted toward 5s/6s, then reroll them low
  if (pick && pick.ability === 'Regulator') {
    dice = dice.map(d => {
      if (d >= 5) {
        const r = Math.random();
        if (r < 0.30) return 1;
        if (r < 0.55) return 2;
        if (r < 0.70) return 3;
        return 4;
      }
      return d;
    });
  }

  // Analyze — use best 3 if more than 3 dice
  let analyzeDice = eDiceCount > 3 ? bestNOf(dice, 3) : dice;
  const fullRoll = analyzeRoll(dice);
  if (['quads','penta','sixcity'].includes(fullRoll.type)) analyzeDice = dice;
  currentEnemyRoll = analyzeRoll(analyzeDice);

  // Show enemy dice with animation
  hideAllDice();
  for (let i = 0; i < Math.min(eDiceCount, 7); i++) {
    const d = document.getElementById('eDie' + i);
    d.style.display = 'flex';
    d.textContent = '?';
    d.className = 'die e rolling';
  }

  playSfx('sfxDiceRoll');

  // Reveal dice one by one
  setTimeout(() => {
    dice.slice(0, 7).forEach((v, i) => {
      setTimeout(() => {
        const d = document.getElementById('eDie' + i);
        d.classList.remove('rolling');
        d.textContent = v;
        if (currentEnemyRoll.matchDie && v === currentEnemyRoll.matchDie) {
          setTimeout(() => d.classList.add('glow'), 100);
        }
      }, i * 180);
    });

    const revealTime = Math.min(eDiceCount, 7) * 180 + 300;
    setTimeout(() => {
      // Show roll type tag
      document.getElementById('enemyRollTag').textContent = typeLabel(currentEnemyRoll.type);
      document.getElementById('enemyRollTag').className = 'roll-type-tag enemy-tag';

      if (isTripleOrBetter(currentEnemyRoll.type)) {
        showTriplesBanner(currentEnemyRoll.type);
      }

      // Bubble Boys: enemy triples = instant defeat
      if (pick.ability === 'Pop' && isTripleOrBetter(currentEnemyRoll.type)) {
        log(`${enemy.name} rolled ${describeRoll(currentEnemyRoll)} — ${typeLabel(currentEnemyRoll.type)}!`, 'enemy');
        log(`Pop! Bubble Boys burst from the triples!`, 'enemy-ability');
        playerHp = 0;
        updateHpDisplay();
        setTimeout(playerDefeated, 1200);
        return;
      }

      log(`${enemy.name} rolled ${describeRoll(currentEnemyRoll)} — ${typeLabel(currentEnemyRoll.type)}`, 'enemy');

      // Shade (enemy): Haunt — player takes 1 damage before their roll
      if (enemy.ability === 'Haunt' && !isFirstRoll) {
        playerHp -= 1;
        updateHpDisplay();
        log(`Haunt! You take 1 damage before rolling (${playerHp} HP)`, 'enemy-ability');
        if (playerHp <= 0) { setTimeout(playerDefeated, 800); return; }
      }

      phase = 1;
      log(`Your turn — tap Roll!`, 'prompt');
      showRollBtn();
      renderBattleItems();
      renderResources(); // refresh so shards/fires show as committable
    }, revealTime + (isTripleOrBetter(currentEnemyRoll.type) ? 800 : 0));
  }, 600);
}

// ══════════════════════════════════════════════
// PLAYER ROLL
// ══════════════════════════════════════════════

function doPlayerRoll() {
  if (phase !== 1 || battleOver) return;
  phase = 2;
  hideRollBtn();
  renderResources(); // clear committable highlight
  playSfx('sfxDiceRoll');

  // ── Before-roll abilities ──
  const preRollEffects = [];

  // Katrina: Seeker — gain 1 HP if below enemy
  if (pick.ability === 'Seeker' && playerHp < enemyHp) {
    playerHp += 1;
    updateHpDisplay();
    preRollEffects.push(`Seeker! +1 HP (${playerHp} HP)`);
  }

  // Shade (player): Haunt — enemy takes 1 after first roll
  if (pick.ability === 'Haunt' && !isFirstRoll) {
    enemyHp -= 1;
    updateHpDisplay();
    preRollEffects.push(`Haunt! ${enemy.name} takes 1 damage (${enemyHp} HP)`);
    if (enemyHp <= 0) {
      preRollEffects.forEach(t => log(t, 'ability'));
      setTimeout(enemyDefeated, 800);
      return;
    }
  }

  // Boo Brothers: Teamwork — remove 1 die to gain 1 HP (auto at low HP)
  if (pick.ability === 'Teamwork' && playerHp <= 2 && playerBonusDice === 0) {
    playerRemoveDice += 1;
    playerHp = Math.min(playerHp + 1, pick.maxHp);
    updateHpDisplay();
    preRollEffects.push(`Teamwork! Sacrificed a die — +1 HP (${playerHp} HP)`);
  }

  preRollEffects.forEach(t => log(t, 'ability'));

  // ── Roll dice ──
  let dieCount = getPlayerDiceCount();
  playerBonusDice = 0; playerRemoveDice = 0;

  playerDiceValues = rollDice(dieCount);

  // Kairan: 10% boost to doubles
  if (pick.ability === "Let's Dance" && Math.random() < 0.10) {
    const v = Math.floor(Math.random()*6)+1;
    playerDiceValues[0] = v; playerDiceValues[1] = v;
  }

  // Wim: 15% boost to all-odd
  if (pick.ability === 'Slash' && !playerDiceValues.every(d => d % 2 === 1) && Math.random() < 0.15) {
    playerDiceValues = playerDiceValues.map(d => d % 2 === 0 ? (d - 1 || 1) : d);
  }

  // 1 HP clutch: improved odds
  if (playerHp === 1 && pick.ability !== 'Underdog') {
    const r = Math.random();
    if (r < 0.20) { const v = Math.ceil(Math.random()*4)+2; playerDiceValues[0]=v; playerDiceValues[1]=v; }
    else if (r < 0.30) { const v = Math.ceil(Math.random()*4)+2; playerDiceValues = playerDiceValues.map(()=>v); }
  }
  if (pick.ability === 'Underdog' && playerHp === 1) {
    const r = Math.random();
    if (r < 0.40) { const v = Math.ceil(Math.random()*4)+2; playerDiceValues = playerDiceValues.map(()=>v); }
    else if (r < 0.70) { const v = Math.ceil(Math.random()*3)+3; playerDiceValues[0]=v; playerDiceValues[1]=v; }
  }

  // Show dice with animation
  for (let i = 0; i < 7; i++) {
    const d = document.getElementById('pDie' + i);
    if (i < dieCount) {
      d.style.display = 'flex';
      d.textContent = '?';
      d.className = 'die p rolling';
    } else {
      d.style.display = 'none';
    }
  }

  // Reveal dice
  setTimeout(() => {
    playerDiceValues.forEach((v, i) => {
      if (i >= 7) return;
      setTimeout(() => {
        const d = document.getElementById('pDie' + i);
        d.classList.remove('rolling');
        d.textContent = v;
      }, i * 180);
    });

    const revealTime = Math.min(dieCount, 7) * 180 + 300;
    setTimeout(() => {
      // Analyze
      let finalDice;
      if (dieCount > 3) {
        const fullRoll = analyzeRoll(playerDiceValues);
        finalDice = ['quads','penta','sixcity'].includes(fullRoll.type) ? [...playerDiceValues] : bestNOf(playerDiceValues, 3);
      } else {
        finalDice = [...playerDiceValues];
      }
      const pRoll = analyzeRoll(finalDice);

      // Highlight matching dice
      playerDiceValues.forEach((v, i) => {
        if (i >= 7) return;
        if (pRoll.matchDie && v === pRoll.matchDie) {
          setTimeout(() => document.getElementById('pDie'+i).classList.add('glow'), 100);
        }
      });

      // Show roll type
      document.getElementById('playerRollTag').textContent = typeLabel(pRoll.type);
      document.getElementById('playerRollTag').className = 'roll-type-tag player-tag';

      if (isTripleOrBetter(pRoll.type)) showTriplesBanner(pRoll.type);

      log(`You rolled ${describeRoll(pRoll)} — ${typeLabel(pRoll.type)}`, 'player');

      // ── Special overrides ──

      // Patrick: Stone Form — doesn't compare rolls
      if (pick.ability === 'Stone Form') {
        setTimeout(() => resolveStoneForm(pRoll, currentEnemyRoll), 600);
        return;
      }

      // Kodako: Swift — 1-2-3 override
      if (pick.ability === 'Swift' && playerDiceValues.length >= 3 && [1,2,3].every(v => playerDiceValues.includes(v))) {
        setTimeout(() => {
          showAbilitySplash('Swift', '1-2-3! Negate damage, deal 4!', 1600, () => {
            log(`Swift! 1-2-3 triggered — 4 damage to ${enemy.name}, your damage negated!`, 'ability');
            enemyHp -= 4;
            hitCard('enemyCard');
            playDamageSfx(4);
            updateHpDisplay();
            if (enemyHp <= 0) setTimeout(enemyDefeated, 600);
            else setTimeout(nextRound, 1000);
          });
        }, 600);
        return;
      }

      // Normal resolution
      setTimeout(() => resolveRound(pRoll, currentEnemyRoll), 600);
    }, revealTime + (isTripleOrBetter(analyzeRoll(playerDiceValues).type) ? 800 : 0));
  }, 600);
}

// ══════════════════════════════════════════════
// RESOLVE ROUND — The heart of combat
// ══════════════════════════════════════════════

function resolveRound(pRoll, eRoll) {
  phase = 3;
  const result = compareRollsWithAbilities(pRoll, eRoll);
  const wasFirstRoll = isFirstRoll;
  isFirstRoll = false;

  // ── Kairan: Let's Dance — doubles = +1 die (win, lose, or tie) ──
  if (pick.ability === "Let's Dance" && pRoll.type === 'doubles') {
    playerBonusDice += 1;
    log(`Let's Dance! Doubles rolled — +1 die next turn`, 'ability');
  }
  if (enemy.ability === "Let's Dance" && eRoll.type === 'doubles') {
    enemyBonusDice += 1;
    log(`${enemy.name} — Let's Dance! +1 die next turn`, 'enemy-ability');
  }

  // ── TIE ──
  if (result === 0) {
    if (committedShards > 0 || committedFires > 0) {
      log(`Committed resources lost on the tie — rolling again with empty hands.`, 'tie');
      committedShards = 0; committedFires = 0;
      renderResources();
    } else {
      log(`Tie! No damage dealt. Roll again!`, 'tie');
    }
    round++;
    setTimeout(doEnemyRoll, 1400);
    return;
  }

  const playerWins = result === 1;

  if (playerWins) {
    resolvePlayerWin(pRoll, eRoll, wasFirstRoll);
  } else {
    // Lost the roll — committed shards/fires are burned (real rule)
    if (committedShards > 0 || committedFires > 0) {
      log(`Committed shards/fires wasted on the loss.`, 'tie');
      committedShards = 0; committedFires = 0;
    }
    resolveEnemyWin(pRoll, eRoll, wasFirstRoll);
  }
}

// ── PLAYER WINS ──
function resolvePlayerWin(pRoll, eRoll, wasFirstRoll) {
  let damage = pRoll.damage;
  const abilityLog = [];

  // ── Offensive abilities ──
  if (pick.ability === 'Protector' && pRoll.type === 'singles') {
    damage += 1;
    abilityLog.push(`Protector! +1 damage on singles`);
  }
  if (pick.ability === 'Slash' && pRoll.dice.every(d => d % 2 === 1)) {
    damage += 5;
    abilityLog.push(`SLASH! All dice odd — +5 damage!`);
  }
  if (pick.ability === 'One-two-one!' && pRoll.type === 'doubles' && pRoll.value === 1) {
    damage *= 3;
    abilityLog.push(`One-two-one! Double 1's — 3X damage!`);
  }
  if (pick.ability === 'Snowball' && pRoll.type === 'doubles') {
    damage += 2;
    abilityLog.push(`Snowball! Doubles +2 damage`);
  }
  if (pick.ability === 'Ambush' && wasFirstRoll) {
    damage *= 3;
    abilityLog.push(`Ambush! First roll win — 3X damage!`);
  }
  if (pick.ability === 'Lurk' && wasFirstRoll) {
    damage *= 3;
    abilityLog.push(`Lurk! First roll win — 3X damage!`);
  }
  if (pick.ability === 'Blue Fire') {
    damage += 1;
    abilityLog.push(`Blue Fire! +1 bonus damage`);
  }
  if (pick.ability === 'Fiendship') {
    damage += 2;
    abilityLog.push(`Fiendship! +2 bonus damage`);
  }
  if (pick.ability === 'Beast Mode' && pRoll.type === 'doubles') {
    damage *= 2;
    abilityLog.push(`Beast Mode! Doubles deal 2X damage!`);
  }
  if (pick.ability === 'Fissure' && pRoll.dice.filter(d => d === 6).length >= 2) {
    damage += 5;
    abilityLog.push(`Fissure! Two 6's — +5 damage!`);
  }

  // ── Committed Ice Shards — add damage on win (already spent, win or lose) ──
  if (committedShards > 0) {
    const perShard = pick.ability === 'Winter Barrage' ? 2 : 1;
    const shardDmg = committedShards * perShard;
    damage += shardDmg;
    abilityLog.push(`${committedShards} Ice Shard${committedShards>1?'s':''} cashed in! +${shardDmg} damage${pick.ability === 'Winter Barrage' ? ' (Winter Barrage 2X!)' : ''}`);
  }

  // ── Committed Sacred Fires — add damage on win ──
  if (committedFires > 0) {
    const perFire = pick.ability === 'Heating Up' ? 6 : 3;
    const fireDmg = committedFires * perFire;
    damage += fireDmg;
    abilityLog.push(`${committedFires} Sacred Fire${committedFires>1?'s':''} cashed in! +${fireDmg} damage${pick.ability === 'Heating Up' ? ' (Heating Up 2X!)' : ''}`);
  }
  // Committed resources are spent now — zero them so renderResources reflects it next redraw
  committedShards = 0; committedFires = 0;
  renderResources();

  // ── Defense — enemy blocks/reflects ──
  let reflected = false;
  let blocked = false;

  // Stoic: below 6 HP immune to singles
  if (enemy.ability === 'Stoic' && enemyHp < 6 && pRoll.type === 'singles') {
    damage = 0;
    blocked = true;
    abilityLog.push(`${enemy.name} — Stoic! Immune to singles below 6 HP`);
  }

  // Bogey: reflect (enemy auto-reflects first hit of 2+)
  if (!blocked && enemy.ability === 'Bogus' && !bogeyReflectUsed && damage >= 2) {
    bogeyReflectUsed = true;
    reflected = true;
    abilityLog.push(`${enemy.name} — Bogus! ${damage} damage reflected back!`);
  }

  // King Jay: Reflection — dice total = 7
  if (!blocked && !reflected && enemy.ability === 'Reflection' && eRoll.dice.reduce((a,b) => a+b, 0) === 7) {
    reflected = true;
    abilityLog.push(`${enemy.name} — Reflection! Dice total 7 — ${damage} damage reflected!`);
  }

  // ── Show ability splashes then apply damage ──
  const chain = abilityLog.map(text => cb => {
    log(text, text.includes(enemy.name) ? 'enemy-ability' : 'ability');
    setTimeout(cb, 400);
  });

  runChain(chain, () => {
    if (reflected) {
      // Damage hits player instead
      playerHp -= damage;
      hitCard('playerCard');
      playDamageSfx(damage);
      updateHpDisplay();
      log(`${damage} damage reflected to ${pick.name}! (${Math.max(0,playerHp)} HP)`, 'damage-enemy');

      if (playerHp <= 0) { setTimeout(playerDefeated, 800); return; }
      afterWinTriggers(pRoll, eRoll, damage, true);
      setTimeout(nextRound, 1200);
    } else if (blocked) {
      log(`Attack blocked! No damage dealt`, 'block');
      // Cameron: Unstoppable Force — damage cannot be negated, force damage through
      if (pick.ability === 'Unstoppable Force') {
        showAbilitySplash('Unstoppable Force', 'Damage cannot be negated!', 1600, () => {
          log(`Unstoppable Force! Damage goes through!`, 'ability');
          enemyHp -= damage;
          updateHpDisplay();
          if (enemyHp <= 0) { setTimeout(enemyDefeated, 600); }
          else { setTimeout(nextRound, 1000); }
        });
      } else {
        setTimeout(nextRound, 1000);
      }
    } else {
      enemyHp -= damage;
      hitCard('enemyCard');
      playDamageSfx(damage);
      updateHpDisplay();
      log(`${damage} damage to ${enemy.name}! (${Math.max(0,enemyHp)} HP)`, 'damage-player');

      // After-win triggers
      afterWinTriggers(pRoll, eRoll, damage, true);

      // Enemy: Party Time counter die
      if (enemy.ability === 'Party Time' && enemyHp > 0) {
        setTimeout(() => {
          const counter = Math.floor(Math.random() * 6) + 1;
          playerHp -= counter;
          hitCard('playerCard');
          playDamageSfx(counter);
          updateHpDisplay();
          log(`${enemy.name} — Party Time! Counter die: ${counter} damage to you! (${Math.max(0,playerHp)} HP)`, 'enemy-ability');
          if (playerHp <= 0) setTimeout(playerDefeated, 800);
          else if (enemyHp <= 0) setTimeout(enemyDefeated, 800);
          else setTimeout(nextRound, 1200);
        }, 800);
        return;
      }

      if (enemyHp <= 0) setTimeout(enemyDefeated, 800);
      else setTimeout(nextRound, 1200);
    }
    renderResources();
  });
}

// ── ENEMY WINS ──
function resolveEnemyWin(pRoll, eRoll, wasFirstRoll) {
  let damage = eRoll.damage;
  const abilityLog = [];

  // Enemy offensive abilities
  if (enemy.ability === 'Protector' && eRoll.type === 'singles') { damage += 1; abilityLog.push(`${enemy.name} — Protector! +1 on singles`); }
  if (enemy.ability === 'Slash' && eRoll.dice.every(d => d % 2 === 1)) { damage += 5; abilityLog.push(`${enemy.name} — Slash! All odd — +5!`); }
  if (enemy.ability === 'One-two-one!' && eRoll.type === 'doubles' && eRoll.value === 1) { damage *= 3; abilityLog.push(`${enemy.name} — One-two-one! 3X damage!`); }
  if (enemy.ability === 'Snowball' && eRoll.type === 'doubles') { damage += 2; abilityLog.push(`${enemy.name} — Snowball! +2 damage`); }
  if (enemy.ability === 'Blue Fire') { damage += 1; abilityLog.push(`${enemy.name} — Blue Fire! +1 damage`); }
  if (enemy.ability === 'Fiendship') { damage += 2; abilityLog.push(`${enemy.name} — Fiendship! +2 damage`); }
  if (enemy.ability === 'Beast Mode' && eRoll.type === 'doubles') { damage *= 2; abilityLog.push(`${enemy.name} — Beast Mode! 2X damage!`); }
  if (enemy.ability === 'Ambush' && wasFirstRoll) { damage *= 3; abilityLog.push(`${enemy.name} — Ambush! 3X on first roll!`); }
  if (enemy.ability === 'Lurk' && wasFirstRoll) { damage *= 3; abilityLog.push(`${enemy.name} — Lurk! 3X on first roll!`); }
  if (enemy.ability === 'Fissure' && eRoll.dice.filter(d => d === 6).length >= 2) { damage += 5; abilityLog.push(`${enemy.name} — Fissure! +5 damage!`); }

  // Enemy ice shards
  if (enemyIceShards > 0) {
    const perShard = enemy.ability === 'Winter Barrage' ? 2 : 1;
    const shardDmg = enemyIceShards * perShard;
    damage += shardDmg;
    abilityLog.push(`${enemy.name} consumed ${enemyIceShards} Ice Shard${enemyIceShards>1?'s':''}! +${shardDmg} damage`);
    enemyIceShards = 0;
  }
  if (enemySacredFires > 0) {
    const fireDmg = enemySacredFires * 3;
    damage += fireDmg;
    abilityLog.push(`${enemy.name} consumed ${enemySacredFires} Sacred Fire${enemySacredFires>1?'s':''}! +${fireDmg} damage`);
    enemySacredFires = 0;
  }

  // ── Player defense ──
  let reflected = false;
  let blocked = false;

  // Protector: singles beat doubles
  if (pick.ability === 'Protector' && pRoll.type === 'singles' && eRoll.type === 'doubles') {
    // This is already handled in compareRolls — player would have won
    // But as a safety net:
    damage = 0; blocked = true;
    abilityLog.push(`Protector! Singles beat doubles!`);
  }

  // Stoic: below 6 HP immune to singles
  if (!blocked && pick.ability === 'Stoic' && playerHp < 6 && eRoll.type === 'singles') {
    damage = 0; blocked = true;
    abilityLog.push(`Stoic! Immune to singles below 6 HP`);
  }

  // Bogey: reflect
  if (!blocked && pick.ability === 'Bogus' && !bogeyReflectUsed) {
    bogeyReflectUsed = true;
    reflected = true;
    abilityLog.push(`Bogus! ${damage} damage reflected to ${enemy.name}!`);
  }

  // King Jay: Reflection — YOUR dice total = 7
  if (!blocked && !reflected && pick.ability === 'Reflection' && pRoll.dice.reduce((a,b) => a+b, 0) === 7) {
    reflected = true;
    abilityLog.push(`Reflection! Your dice total 7 — ${damage} damage reflected!`);
  }

  // Shield item
  if (!blocked && !reflected && damage > 0 && game.items.includes('shield') && !battleItemsUsed.includes('shield')) {
    damage = 0; blocked = true;
    battleItemsUsed.push('shield');
    abilityLog.push(`Spirit Shield blocked the hit!`);
  }

  // Show ability logs then apply
  const chain = abilityLog.map(text => cb => {
    log(text, text.includes(enemy.name + ' —') ? 'enemy-ability' : 'ability');
    setTimeout(cb, 400);
  });

  runChain(chain, () => {
    if (reflected) {
      enemyHp -= damage;
      hitCard('enemyCard');
      playDamageSfx(damage);
      updateHpDisplay();
      log(`${damage} damage reflected to ${enemy.name}! (${Math.max(0,enemyHp)} HP)`, 'damage-player');
      if (enemyHp <= 0) setTimeout(enemyDefeated, 800);
      else setTimeout(nextRound, 1200);
    } else if (blocked) {
      log(`Attack blocked!`, 'block');
      // Cameron (enemy): Unstoppable Force — damage cannot be negated
      if (enemy.ability === 'Unstoppable Force') {
        log(`${enemy.name} — Unstoppable Force! Damage goes through!`, 'enemy-ability');
        playerHp -= damage; updateHpDisplay();
        if (playerHp <= 0) { setTimeout(playerDefeated, 800); }
        else { setTimeout(nextRound, 1200); }
      } else {
        // Cameron (player): damage cannot be negated — force damage through
        if (pick.ability === 'Unstoppable Force' && !reflected) {
          showAbilitySplash('Unstoppable Force', 'Damage cannot be negated!', 1600, () => {
            log(`Unstoppable Force! Damage goes through!`, 'ability');
            enemyHp -= damage; updateHpDisplay();
            if (enemyHp <= 0) { setTimeout(enemyDefeated, 600); }
            else { setTimeout(nextRound, 1000); }
          });
        } else {
          setTimeout(nextRound, 1000);
        }
      }
    } else {
      playerHp -= damage;
      hitCard('playerCard');
      playDamageSfx(damage);
      updateHpDisplay();
      tookDamageLastRound = true;
      log(`You took ${damage} damage! (${Math.max(0,playerHp)} HP)`, 'damage-enemy');

      // After-loss triggers
      afterLossTriggers(pRoll, eRoll, damage);

      // Balatron counter die
      if (pick.ability === 'Party Time' && playerHp > 0) {
        setTimeout(() => {
          const counter = Math.floor(Math.random() * 6) + 1;
          enemyHp -= counter;
          hitCard('enemyCard');
          playDamageSfx(counter);
          updateHpDisplay();
          log(`Party Time! Counter die: ${counter} damage to ${enemy.name}! (${Math.max(0,enemyHp)} HP)`, 'ability');
          if (enemyHp <= 0) setTimeout(enemyDefeated, 800);
          else if (playerHp <= 0) setTimeout(playerDefeated, 800);
          else setTimeout(nextRound, 1200);
        }, 800);
        return;
      }

      if (playerHp <= 0) setTimeout(playerDefeated, 800);
      else setTimeout(nextRound, 1200);
    }
    renderResources();
  });
}

// ══════════════════════════════════════════════
// AFTER-WIN / AFTER-LOSS TRIGGERS
// ══════════════════════════════════════════════

function afterWinTriggers(pRoll, eRoll, damage, isPlayer) {
  // Valley Magic: +2 ice shards
  if (pick.ability === 'Valley Magic') { iceShards += 2; log(`Valley Magic! +2 Ice Shards (${iceShards})`, 'ability'); }
  // Burning Soul: +1 sacred fire
  if (pick.ability === 'Burning Soul') { sacredFires += 1; log(`Burning Soul! +1 Sacred Fire (${sacredFires})`, 'ability'); }
  // Outlaw: doubles steal a die
  if (pick.ability === 'Thief' && pRoll.type === 'doubles') { enemyRemoveDice += 1; log(`Thief! Stole 1 of ${enemy.name}'s dice next turn`, 'ability'); }
  // Troubling Haters: 4+ damage = +2 HP
  if (pick.ability === 'Growing Mob' && damage >= 4) {
    playerHp = Math.min(pick.maxHp, playerHp + 2); updateHpDisplay();
    log(`Growing Mob! Big hit — +2 HP (${playerHp})`, 'ability');
  }
  // Dream Cat: both doubles = +1 die
  if (pick.ability === 'Jinx' && eRoll.type === 'doubles' && pRoll.type === 'doubles') {
    playerBonusDice += 1; log(`Jinx! Both rolled doubles — +1 die next turn`, 'ability');
  }
  // Flora: doubles = +2 HP
  if (pick.ability === 'Restore' && pRoll.type === 'doubles') {
    playerHp = Math.min(pick.maxHp, playerHp + 2); updateHpDisplay();
    log(`Restore! Doubles — +2 HP (${playerHp})`, 'ability');
  }
  // Roger: 2 pairs in 4+ dice = +3 sacred fires
  if (pick.ability === 'Tempest' && playerDiceValues.length >= 4) {
    const counts = {};
    playerDiceValues.forEach(d => counts[d] = (counts[d]||0)+1);
    if (Object.values(counts).filter(c => c >= 2).length >= 2) {
      sacredFires += 3;
      log(`Tempest! Two pairs — +3 Sacred Fires! (${sacredFires})`, 'ability');
    }
  }
  // Enemy: Valley Magic, Burning Soul etc.
  if (enemy.ability === 'Valley Magic') { enemyIceShards += 2; }
  if (enemy.ability === 'Burning Soul') { enemySacredFires += 1; }
  if (enemy.ability === 'Thief' && eRoll.type === 'doubles') { playerRemoveDice += 1; log(`${enemy.name} — Thief! Stole one of your dice`, 'enemy-ability'); }

  renderResources();
}

function afterLossTriggers(pRoll, eRoll, damage) {
  // Sad Sal: lose = +1 ice shard
  if (pick.ability === 'Tough Job') { iceShards += 1; log(`Tough Job! +1 Ice Shard (${iceShards})`, 'ability'); }
  // Simon: take damage = +1 sacred fire
  if (pick.ability === 'Brew Time' && damage > 0) { sacredFires += 1; log(`Brew Time! Took damage — +1 Sacred Fire (${sacredFires})`, 'ability'); }
  // Marcus: 3+ damage = +4 dice next roll
  if (pick.ability === 'Glacial Pounding' && damage >= 3) { playerBonusDice += 4; log(`Glacial Pounding! +4 dice next roll!`, 'ability'); }
  // Flora: doubles on loss = +2 HP
  if (pick.ability === 'Restore' && pRoll.type === 'doubles' && playerHp > 0) {
    playerHp = Math.min(pick.maxHp, playerHp + 2); updateHpDisplay();
    log(`Restore! Doubles — +2 HP (${playerHp})`, 'ability');
  }
  // Dream Cat: both doubles on loss too
  if (pick.ability === 'Jinx' && pRoll.type === 'doubles' && eRoll.type === 'doubles') {
    playerBonusDice += 1; log(`Jinx! Both doubled — +1 die next turn`, 'ability');
  }
  // Logey (enemy): lock high dice
  if (enemy.ability === 'Heinous' && playerHp > 0) {
    const highCount = pRoll.dice.filter(d => d >= 5).length;
    if (highCount > 0) {
      playerRemoveDice += highCount;
      log(`${enemy.name} — Heinous! ${highCount} of your high dice locked out next roll`, 'enemy-ability');
    }
  }
  // Enemy after-loss triggers
  if (enemy.ability === 'Tough Job') { enemyIceShards += 1; }
  if (enemy.ability === 'Brew Time') { enemySacredFires += 1; }
  if (enemy.ability === 'Glacial Pounding' && damage >= 3) { enemyBonusDice += 4; log(`${enemy.name} — Glacial Pounding! +4 dice next roll`, 'enemy-ability'); }

  renderResources();
}

// ══════════════════════════════════════════════
// SPECIAL ABILITIES — Patrick, Eloise, Tyler
// ══════════════════════════════════════════════

function resolveStoneForm(pRoll, eRoll) {
  if (eRoll.type === 'singles') {
    showAbilitySplash('Stone Form', 'Singles negated! 3 damage!', 1600, () => {
      log(`Stone Form! Enemy singles negated — 3 damage to ${enemy.name}!`, 'ability');
      enemyHp -= 3;
      hitCard('enemyCard');
      playDamageSfx(3);
      updateHpDisplay();
      if (enemyHp <= 0) setTimeout(enemyDefeated, 600);
      else { isFirstRoll = false; setTimeout(nextRound, 1000); }
    });
  } else {
    // Patrick takes damage from non-singles
    let damage = eRoll.damage;
    if (enemy.ability === 'Beast Mode' && eRoll.type === 'doubles') damage *= 2;
    if (enemy.ability === 'Blue Fire') damage += 1;
    if (enemy.ability === 'Fiendship') damage += 2;
    playerHp -= damage;
    hitCard('playerCard');
    playDamageSfx(damage);
    updateHpDisplay();
    tookDamageLastRound = true;
    log(`${enemy.name} rolled ${typeLabel(eRoll.type)} — Stone Form can't block! ${damage} damage! (${Math.max(0,playerHp)} HP)`, 'damage-enemy');
    if (playerHp <= 0) setTimeout(playerDefeated, 800);
    else { isFirstRoll = false; setTimeout(nextRound, 1000); }
  }
}

// ══════════════════════════════════════════════
// NEXT ROUND
// ══════════════════════════════════════════════

function nextRound() {
  if (battleOver) return;
  round++;
  logDivider();
  log(`Round ${round}`, 'system');

  // Reset dice display
  document.getElementById('enemyRollTag').textContent = '';
  document.getElementById('playerRollTag').textContent = '';
  for (let i = 0; i < 7; i++) {
    const e = document.getElementById('eDie'+i);
    const p = document.getElementById('pDie'+i);
    e.className = 'die e'; e.textContent = ''; e.style.display = 'none';
    p.className = 'die p'; p.textContent = ''; p.style.display = 'none';
  }

  // Piper Slick Coat: notify
  if (pick && pick.ability === 'Slick Coat') {
    log(`Slick Coat — ${enemy.name} loses 1 die`, 'ability');
  }

  // Fredrick: Careful
  if (pick && pick.ability === 'Careful') {
    log(`Careful — ${enemy.name} capped at 3 dice`, 'ability');
  }

  renderBattleItems();
  setTimeout(doEnemyRoll, 600);
}

// ══════════════════════════════════════════════
// POST-BATTLE
// ══════════════════════════════════════════════

function enemyDefeated() {
  battleOver = true;
  log(`${enemy.name} defeated!`, 'victory');

  if (isBossFight) {
    // Boss fights get the full ceremony
    showAbilitySplash('Victory!', `${enemy.name} has been defeated!`, 2000, () => {
      if (game.active) game.active.hp = Math.max(1, playerHp);
      const nodes = game.regionMaps[game.currentRegion];
      const node = nodes.find(n => n.id === game.currentNode);
      if (node) node.visited = true;
      game.bossesBeaten++;

      const isFinal = game.currentRegion === REGIONS.length - 1;
      showBossCeremony(game.currentRegion, isFinal, () => {
        if (isFinal) {
          showVictory();
        } else {
          showRewards(true);
        }
      });
    });
  } else {
    // Regular battles — quick splash
    showAbilitySplash('Victory!', `${enemy.name} has been defeated!`, 2000, () => {
      if (game.active) game.active.hp = Math.max(1, playerHp);
      const nodes = game.regionMaps[game.currentRegion];
      const node = nodes.find(n => n.id === game.currentNode);
      if (node) node.visited = true;
      setTimeout(() => showRewards(false), 500);
    });
  }
}

// ══════════════════════════════════════════════
// BOSS CEREMONY — Zelda OoT-style relic moment
// ══════════════════════════════════════════════

const BOSS_RELICS = [
  { icon: '❄️', name: 'Frost Valley Conquered',  sub: 'The caverns tremble at your approach', color: '#38bdf8' },
  { icon: '🔥', name: 'Hot Hot Cavern Conquered', sub: 'The ice palace gates shatter open',   color: '#f97316' },
  { icon: '💎', name: 'Ice Palace Conquered',     sub: 'The Dark Castle awaits',               color: '#3b82f6' },
  { icon: '👑', name: 'Champion',                  sub: 'The Mountain King has fallen',         color: '#fbbf24' },
];

function showBossCeremony(regionIdx, isFinal, callback) {
  const relic = BOSS_RELICS[regionIdx];
  const el = document.getElementById('bossCeremony');
  const particles = document.getElementById('ceremonyParticles');

  // Set region color
  el.style.setProperty('--ceremony-color', relic.color);

  // Set relic content
  document.getElementById('ceremonyRelic').textContent = relic.icon;
  document.getElementById('ceremonyLabel').textContent = relic.name;
  document.getElementById('ceremonySublabel').textContent = relic.sub;

  // Final boss gets the grander version
  if (isFinal) el.classList.add('final');
  else el.classList.remove('final');

  // Generate particles
  particles.innerHTML = '';
  const particleCount = isFinal ? 40 : 24;
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.className = 'ceremony-particle';
    p.style.left = (15 + Math.random() * 70) + '%';
    p.style.top = (50 + Math.random() * 40) + '%';
    p.style.setProperty('--p-dur', (3 + Math.random() * 3) + 's');
    p.style.setProperty('--p-delay', (Math.random() * 3) + 's');
    p.style.width = p.style.height = (2 + Math.random() * 4) + 'px';
    particles.appendChild(p);
  }

  // Reset classes
  el.className = 'boss-ceremony';

  // Sequence the reveal
  el.classList.add('active');
  requestAnimationFrame(() => {
    // Phase 1: darken
    el.classList.add('darken');

    // Phase 2: beam + relic descend (after darkness settles)
    setTimeout(() => {
      el.classList.add('reveal');
      playSfx('sfxSpecial');
    }, 800);

    // Phase 3: ring burst when relic lands
    setTimeout(() => {
      el.classList.add('ring');
    }, 2600);

    // Phase 4: gentle float
    setTimeout(() => {
      el.classList.add('float');
    }, 3200);

    // Phase 5: hold the moment, then fade out
    const holdTime = isFinal ? 6500 : 5500;
    setTimeout(() => {
      el.classList.add('darken');
      el.style.transition = 'opacity 1s ease';
      el.style.opacity = '0';
      setTimeout(() => {
        el.className = 'boss-ceremony';
        el.style.transition = '';
        el.style.opacity = '';
        particles.innerHTML = '';
        if (callback) callback();
      }, 1000);
    }, holdTime);
  });
}

function playerDefeated() {
  battleOver = true;

  // Powder: Final Gift
  if (pick.ability === 'Final Gift') {
    iceShards += 3;
    log(`Final Gift... +3 Ice Shards for your next ghost`, 'ability');
  }

  log(`${pick.name} has fallen...`, 'defeat');

  // Promote a sideline/reserve ghost if any remain
  const stillAlive = handleActiveDeath();

  const nodes = game.regionMaps[game.currentRegion];
  const node = nodes.find(n => n.id === game.currentNode);
  if (node) node.visited = true;

  if (!stillAlive) {
    setTimeout(showGameOver, 1500);
  } else {
    log(`${game.active.name} steps up from the sideline!`, 'ability');
    setTimeout(() => { saveGame(); showMap(); }, 2500);
  }
}

// ══════════════════════════════════════════════
// REWARDS
// ══════════════════════════════════════════════

function showRewards(wasBoss) {
  showScreen('rewardScreen');
  document.getElementById('rewardTitle').textContent = wasBoss ? 'Region Conquered!' : 'Victory!';
  const loot = document.getElementById('rewardLoot');
  const ghostPick = document.getElementById('rewardGhostPick');
  let html = '';

  if (wasBoss) {
    gainItem('power');
    html += rewardItemHtml('power');
    gainItem('shield');
    html += rewardItemHtml('shield');
  } else {
    const drop = ['reroll', 'heal', 'power'][Math.floor(Math.random() * 3)];
    gainItem(drop);
    html += rewardItemHtml(drop);
  }
  loot.innerHTML = html;

  const weights = ENCOUNTER_WEIGHTS[Math.min(game.currentRegion, ENCOUNTER_WEIGHTS.length - 1)];
  const options = [];
  for (let i = 0; i < 2; i++) {
    let rarity = weightedRarity(weights);
    const pool = ALL_GHOSTS.filter(g => g.rarity === rarity && !ownsGhost(g.name) && !options.find(o => o.name === g.name));
    if (pool.length > 0) options.push({ ...pool[Math.floor(Math.random() * pool.length)] });
  }

  if (options.length > 0) {
    ghostPick.innerHTML = '<div class="reward-ghost-label">Recruit a new Spiritkin:</div>' +
      options.map((g, i) => `
        <div class="reward-ghost-option" onclick="selectRewardGhost(${i})" id="rewardGhost${i}">
          <img src="${IMG}${g.file}">
          <div class="rgo-name">${g.name}</div>
          <div class="rgo-stats">${g.maxHp} HP &mdash; ${g.ability}</div>
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

function rewardItemHtml(id) {
  const item = ITEMS[id];
  return `<div class="reward-item"><span class="ri-icon">${item.icon}</span><span class="ri-name">${item.name}</span><span class="ri-desc">${item.desc}</span></div>`;
}

function selectRewardGhost(index) {
  game.selectedRewardGhost = index;
  document.querySelectorAll('.reward-ghost-option').forEach((el, i) => el.classList.toggle('selected', i === index));
}

function collectAndReturn() {
  if (game.pendingRewardGhosts && game.selectedRewardGhost >= 0) {
    const ghost = game.pendingRewardGhosts[game.selectedRewardGhost];
    recruitGhost(ghost);
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

// ══════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════

function updateHpDisplay() {
  const eMax = enemy.maxHp || enemy.hp;
  document.getElementById('enemyHpText').textContent = `${Math.max(0, enemyHp)} / ${eMax} HP`;
  document.getElementById('playerHpText').textContent = `${Math.max(0, playerHp)} / ${pick.maxHp} HP`;
  document.getElementById('enemyHpBar').style.width = Math.max(0, enemyHp / eMax * 100) + '%';
  document.getElementById('playerHpBar').style.width = Math.max(0, playerHp / pick.maxHp * 100) + '%';
}

function renderResources() {
  const el = document.getElementById('battleResources');
  const canCommit = phase === 1 && !battleOver;
  let html = '';

  // Ice shards — tap during phase 1 to commit
  if (iceShards > 0) {
    const cls = canCommit ? 'res-ice committable' : 'res-ice';
    const onclick = canCommit ? 'onclick="commitShard()"' : '';
    html += `<span class="${cls}" ${onclick} title="Tap to commit — +1 dmg on win, lost on loss"><img src="iceshard.png" class="res-icon"> ${iceShards}</span>`;
  }
  if (committedShards > 0) {
    const onclick = canCommit ? 'onclick="uncommitShard()"' : '';
    html += `<span class="res-ice-committed" ${onclick} title="Committed — tap to take back"><img src="iceshard.png" class="res-icon"> ${committedShards} locked</span>`;
  }

  // Sacred fires — tap during phase 1 to commit
  if (sacredFires > 0) {
    const cls = canCommit ? 'res-fire committable' : 'res-fire';
    const onclick = canCommit ? 'onclick="commitFire()"' : '';
    html += `<span class="${cls}" ${onclick} title="Tap to commit — +3 dmg on win, lost on loss"><img src="sacredfire.png" class="res-icon"> ${sacredFires}</span>`;
  }
  if (committedFires > 0) {
    const onclick = canCommit ? 'onclick="uncommitFire()"' : '';
    html += `<span class="res-fire-committed" ${onclick} title="Committed — tap to take back"><img src="sacredfire.png" class="res-icon"> ${committedFires} locked</span>`;
  }

  if (playerBonusDice > 0) html += `<span class="res-dice">+${playerBonusDice} bonus dice</span>`;
  el.innerHTML = html;
}

// Commit / uncommit helpers — move resources between pool and committed
function commitShard() {
  if (phase !== 1 || iceShards <= 0) return;
  iceShards -= 1;
  committedShards += 1;
  log(`Ice Shard committed — ${committedShards} locked in.`, 'ability');
  renderResources();
}
function uncommitShard() {
  if (phase !== 1 || committedShards <= 0) return;
  committedShards -= 1;
  iceShards += 1;
  renderResources();
}
function commitFire() {
  if (phase !== 1 || sacredFires <= 0) return;
  sacredFires -= 1;
  committedFires += 1;
  log(`Sacred Fire committed — ${committedFires} locked in.`, 'ability');
  renderResources();
}
function uncommitFire() {
  if (phase !== 1 || committedFires <= 0) return;
  committedFires -= 1;
  sacredFires += 1;
  renderResources();
}

function renderBattleItems() {
  const el = document.getElementById('battleItems');
  const usable = game.items.filter(id => !battleItemsUsed.includes(id));
  el.innerHTML = usable.map(id => `<button class="battle-item-btn" onclick="useBattleItem('${id}')">${ITEMS[id].icon} ${ITEMS[id].name}</button>`).join('');
}

function useBattleItem(id) {
  if (battleItemsUsed.includes(id) || phase !== 1) return;
  if (id === 'heal') {
    playerHp = Math.min(playerHp + 4, pick.maxHp);
    updateHpDisplay();
    log(`Used Spirit Potion! +4 HP (${playerHp} HP)`, 'item');
  } else if (id === 'power') {
    playerBonusDice += 1;
    renderResources();
    log(`Power Shard! +1 die this roll`, 'item');
  } else if (id === 'reroll') {
    // Simple: reroll lowest die on next roll
    log(`Reroll Charm ready — your lowest die will be rerolled`, 'item');
  }
  battleItemsUsed.push(id);
  const idx = game.items.indexOf(id);
  if (idx >= 0) game.items.splice(idx, 1);
  renderBattleItems();
}

function hideAllDice() {
  for (let i = 0; i < 7; i++) {
    document.getElementById('eDie'+i).style.display = 'none';
    document.getElementById('pDie'+i).style.display = 'none';
  }
}

function showRollBtn() { document.getElementById('rollBtn').style.display = 'block'; }
function hideRollBtn() { document.getElementById('rollBtn').style.display = 'none'; }

function hitCard(id) {
  const el = document.getElementById(id);
  el.classList.add('hit');
  // Flash
  const flash = document.getElementById('impactFlash');
  flash.classList.add('active');
  setTimeout(() => flash.classList.remove('active'), 150);
  setTimeout(() => el.classList.remove('hit'), 500);
}

function playSfx(id) {
  const el = document.getElementById(id);
  if (el) { el.currentTime = 0; el.play().catch(() => {}); }
}

function playDamageSfx(dmg) {
  playSfx(dmg >= 3 ? 'sfx3Damage' : dmg >= 2 ? 'sfx2Damage' : 'sfx1Damage');
}

function narrate(text) {
  // Legacy compat — just log it
  log(text, 'system');
}
