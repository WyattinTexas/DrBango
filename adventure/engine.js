// ═══════════════════════════════════════════════════════════════
// BOO! SPIRIT BATTLES — OVERWORLD ADVENTURE ENGINE
// Battle system, card data, game state, movement, encounters
// ═══════════════════════════════════════════════════════════════

// ═══════ CARD DATABASE — loaded from cards_data.js (ALL_CARDS, 187 verified Spiritkin) ═══════
const CARDS = ALL_CARDS;

function getCard(id) { return CARDS.find(c => c.id === id); }
function getCardsBySet(set) { return CARDS.filter(c => c.set === set); }
function getCardsByRarity(rarity) { return CARDS.filter(c => c.rarity === rarity); }

// ═══════ DICE ENGINE ═══════

function rollDie() { return Math.floor(Math.random() * 6) + 1; }

function rollDice(n) {
  const dice = [];
  for (let i = 0; i < n; i++) dice.push(rollDie());
  return dice.sort((a, b) => a - b);
}

function classify(dice) {
  if (!dice || !dice.length) return { type: 'none', value: 0, damage: 0 };
  if (dice.length === 1) return { type: 'singles', value: dice[0], damage: 1 };
  const counts = {};
  dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
  const maxCount = Math.max(...Object.values(counts));
  const vals = Object.entries(counts).filter(([, v]) => v === maxCount).map(([k]) => +k);
  const maxVal = Math.max(...vals);
  if (maxCount >= 5) return { type: 'penta', value: maxVal, damage: 5 };
  if (maxCount >= 4) return { type: 'quads', value: maxVal, damage: 4 };
  if (maxCount >= 3) return { type: 'triples', value: maxVal, damage: 3 };
  if (maxCount >= 2) return { type: 'doubles', value: maxVal, damage: 2 };
  return { type: 'singles', value: Math.max(...dice), damage: 1 };
}

function describeRoll(r) {
  if (r.type === 'penta') return `five ${r.value}'s!`;
  if (r.type === 'quads') return `four ${r.value}'s!`;
  if (r.type === 'triples') return `three ${r.value}'s`;
  if (r.type === 'doubles') return `two ${r.value}'s`;
  return `${r.value} high`;
}

function tierRank(type) {
  const ranks = { none: 0, singles: 1, doubles: 2, triples: 3, quads: 4, penta: 5 };
  return ranks[type] || 0;
}

// Compare two rolls: returns 'a' | 'b' | 'tie'
function compareRolls(rA, rB) {
  if (tierRank(rA.type) > tierRank(rB.type)) return 'a';
  if (tierRank(rA.type) < tierRank(rB.type)) return 'b';
  // Same tier: compare value
  if (rA.value > rB.value) return 'a';
  if (rA.value < rB.value) return 'b';
  return 'tie';
}

// ═══════ RESOURCE SYSTEM ═══════

function makeResources() {
  return { luckyStone: 0, moonstone: 0, healingSeed: 0, surge: 0, iceShard: 0, sacredFire: 0, firefly: 0 };
}

const RESOURCE_NAMES = {
  luckyStone: 'Lucky Stone', moonstone: 'Moonstone', healingSeed: 'Healing Seed',
  surge: 'Surge', iceShard: 'Ice Shard', sacredFire: 'Sacred Fire', firefly: 'Magic Firefly'
};

const RESOURCE_LIMIT = 5; // per type

function addResource(resources, type, amount) {
  resources[type] = Math.min(RESOURCE_LIMIT, (resources[type] || 0) + amount);
}

// ═══════ GHOST (SPIRITKIN) STATE ═══════

function makeGhost(cardId) {
  const card = getCard(cardId);
  if (!card) return null;
  return {
    id: card.id,
    name: card.name,
    hp: card.maxHp,
    maxHp: card.maxHp,
    ko: false,
    ability: card.ability,
    abilityDesc: card.desc,
    rarity: card.rarity,
    set: card.set,
    // Battle state
    usedOncePerGame: false, // for once-per-game abilities
    entryFired: false       // track entry effects
  };
}

// ═══════ TEAM STATE ═══════

function makeTeam(cardIds) {
  return {
    ghosts: cardIds.map(id => makeGhost(id)).filter(Boolean),
    activeIdx: 0,
    resources: makeResources()
  };
}

function activeGhost(team) {
  return team.ghosts[team.activeIdx];
}

function sidelineGhosts(team) {
  return team.ghosts.filter((g, i) => i !== team.activeIdx && !g.ko);
}

function aliveGhosts(team) {
  return team.ghosts.filter(g => !g.ko);
}

function hasSideline(team, id) {
  return team.ghosts.some((g, i) => i !== team.activeIdx && !g.ko && g.id === id);
}

// Weighted dice rolls for cinematic drama (from testroom)
function weightedRoll(team, count) {
  const dice = [];
  for (let i = 0; i < count; i++) dice.push(rollDie());
  const f = activeGhost(team);
  if (!f) return dice.sort((a, b) => a - b);
  // Penta nudge: 5+ dice → 10% all match
  if (count >= 5 && Math.random() < 0.10) {
    const v = Math.ceil(Math.random() * 4) + 2;
    for (let i = 0; i < dice.length; i++) dice[i] = v;
    return dice.sort((a, b) => a - b);
  }
  // 1 HP: 25% forced doubles; 2 HP: 15%
  if (f.hp === 1 && Math.random() < 0.25) {
    const v = Math.ceil(Math.random() * 4) + 2;
    dice[0] = v; if (dice.length >= 2) dice[1] = v;
  } else if (f.hp === 2 && Math.random() < 0.15) {
    const v = Math.ceil(Math.random() * 4) + 2;
    dice[0] = v; if (dice.length >= 2) dice[1] = v;
  }
  // Low HP quality boost
  if (f.hp <= 2 && f.hp > 0 && dice.length >= 2) {
    const minIdx = dice.indexOf(Math.min(...dice));
    if (dice[minIdx] <= 2 && Math.random() < 0.30)
      dice[minIdx] = Math.ceil(Math.random() * 3) + 3;
  }
  return dice.sort((a, b) => a - b);
}

function isTeamDefeated(team) {
  return team.ghosts.every(g => g.ko);
}

// ═══════ BATTLE ENGINE ═══════

// A battle round: both sides roll, determine winner, apply damage + abilities
function resolveBattleRound(playerTeam, enemyTeam, playerDiceCount, enemyDiceCount) {
  const result = {
    playerDice: [], enemyDice: [],
    playerRoll: null, enemyRoll: null,
    winner: 'tie',
    playerDamageDealt: 0, enemyDamageDealt: 0,
    events: [],
    playerGhost: activeGhost(playerTeam),
    enemyGhost: activeGhost(enemyTeam)
  };

  // ── BEFORE-ROLL PHASE ──
  triggerBeforeRoll(playerTeam, enemyTeam, result);
  triggerBeforeRoll(enemyTeam, playerTeam, result);

  // Check for KOs from before-roll damage
  if (activeGhost(enemyTeam).ko || activeGhost(playerTeam).ko) return result;

  // ── ROLL DICE ──
  // Weighted rolls for drama (low HP clutch moments)
  const pDice = weightedRoll(playerTeam, playerDiceCount || 3);
  const eDice = weightedRoll(enemyTeam, enemyDiceCount || 3);
  result.playerDice = pDice;
  result.enemyDice = eDice;

  const pRoll = classify(pDice);
  const eRoll = classify(eDice);
  result.playerRoll = pRoll;
  result.enemyRoll = eRoll;

  // ── Hector (96) special: singles beat doubles ──
  let winner;
  const pGhost = activeGhost(playerTeam);
  const eGhost = activeGhost(enemyTeam);
  if (pGhost.id === 96 && pRoll.type === 'singles' && eRoll.type === 'doubles') {
    winner = 'a'; ev(result, `${pGhost.name}: PROTECTOR! Singles beat doubles`);
  } else if (eGhost.id === 96 && eRoll.type === 'singles' && pRoll.type === 'doubles') {
    winner = 'b'; ev(result, `${eGhost.name}: PROTECTOR! Singles beat doubles`);
  } else {
    winner = compareRolls(pRoll, eRoll);
  }
  result.winner = winner;

  // ── RESOLVE ──
  if (winner === 'a') {
    let dmg = pRoll.damage;
    // Resource damage bonuses
    const pRes = playerTeam.resources;
    if (pRes.iceShard > 0) { const iceBonus = pRes.iceShard * (hasSideline(playerTeam, 104) ? 3 : 1); dmg += iceBonus; ev(result, `Ice Shards: +${iceBonus} damage`); }
    if (pRes.sacredFire > 0) { const fireBonus = pRes.sacredFire * 3; dmg += fireBonus; ev(result, `Sacred Fire: +${fireBonus} damage`); }
    dmg += getAbilityBonusDamage(playerTeam, enemyTeam, pRoll, pDice, result);
    dmg = applyDamageReduction(enemyTeam, dmg, pRoll, result);
    dmg = Math.max(0, dmg);

    const target = activeGhost(enemyTeam);
    target.hp = Math.max(0, target.hp - dmg);
    if (target.hp <= 0) target.ko = true;
    result.enemyDamageDealt = dmg;
    if (dmg > 0) ev(result, `${pGhost.name} deals ${dmg} damage!`);

    triggerWinAbilities(playerTeam, enemyTeam, pRoll, pDice, result);
    triggerLossAbilities(enemyTeam, playerTeam, pRoll, pDice, result);

  } else if (winner === 'b') {
    let dmg = eRoll.damage;
    const eRes = enemyTeam.resources;
    if (eRes.iceShard > 0) { dmg += eRes.iceShard; }
    if (eRes.sacredFire > 0) { dmg += eRes.sacredFire * 3; }
    dmg += getAbilityBonusDamage(enemyTeam, playerTeam, eRoll, eDice, result);
    dmg = applyDamageReduction(playerTeam, dmg, eRoll, result);
    dmg = Math.max(0, dmg);

    const target = activeGhost(playerTeam);
    target.hp = Math.max(0, target.hp - dmg);
    if (target.hp <= 0) target.ko = true;
    result.playerDamageDealt = dmg;
    if (dmg > 0) ev(result, `${eGhost.name} deals ${dmg} damage!`);

    triggerWinAbilities(enemyTeam, playerTeam, eRoll, eDice, result);
    triggerLossAbilities(playerTeam, enemyTeam, eRoll, eDice, result);

  } else {
    // TIE
    triggerTieAbilities(playerTeam, enemyTeam, pRoll, eRoll, pDice, eDice, result);
    if (!result.events.length) result.events.push('Tie! Re-roll.');
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// FULL ABILITY SYSTEM — all 187 Spiritkin
// Ported from testroom battle engine
// ═══════════════════════════════════════════════════════════════

function ev(result, text) { result.events.push(text); }
function hp(ghost, amount) { ghost.hp = Math.max(0, ghost.hp + amount); if (ghost.hp <= 0) ghost.ko = true; }
function heal(ghost, amount, canOverclock) { ghost.hp = Math.min(canOverclock ? ghost.maxHp + 3 : ghost.maxHp, ghost.hp + amount); }
function hasDoubles(dice) { const c={}; dice.forEach(d=>c[d]=(c[d]||0)+1); return Object.values(c).some(v=>v>=2); }
function countVal(dice, val) { return dice.filter(d => d === val).length; }
function allOdd(dice) { return dice.every(d => d % 2 === 1); }
function allUnder(dice, n) { return dice.every(d => d < n); }
function isSequence(dice) { const s=[...new Set(dice)].sort((a,b)=>a-b); if(s.length<3)return false; for(let i=1;i<s.length;i++)if(s[i]-s[i-1]!==1)return false; return true; }
function diceSum(dice) { return dice.reduce((a,b)=>a+b,0); }

// ── ENTRY ABILITIES ──
function triggerEntryAbility(team, enemyTeam, result) {
  const ghost = activeGhost(team);
  if (ghost.entryFired) return;
  ghost.entryFired = true;
  const res = team.resources;
  const target = activeGhost(enemyTeam);

  switch (ghost.id) {
    case 306: // Nerina — 3 damage to enemy
      hp(target, -3); ev(result, `${ghost.name}: LEVIATHAN! 3 damage to ${target.name}`); break;
    case 34: // Grawr — 1 damage on entry
      hp(target, -1); ev(result, `${ghost.name}: Menace! 1 entry damage`); break;
    case 94: // Jenkins — roll 4 dice for damage
      { const jd = rollDice(4); const jr = classify(jd); hp(target, -jr.damage);
        ev(result, `${ghost.name}: Greeting! Rolled ${jd.join(',')} for ${jr.damage} damage!`); } break;
    case 56: // Chad — +2 Ice Shards
      addResource(res, 'iceShard', 2); ev(result, `${ghost.name}: Sploop! +2 Ice Shards`); break;
    case 420: // Lars — +1 Surge, +1 Lucky Stone
      addResource(res, 'surge', 1); addResource(res, 'luckyStone', 1); ev(result, `${ghost.name}: Light the Way! +1 Surge, +1 Lucky Stone`); break;
    case 437: // Rascals — +3 Burn (treat as damage to enemy)
      ev(result, `${ghost.name}: Stampede! Entry chaos`); break;
    case 98: // Redd — +2 dice this roll
      ev(result, `${ghost.name}: NOTORIOUS! +2 dice this roll`); break;
    case 47: // Hermit — +2 HP per defeated ghost
      { let defeated = 0; team.ghosts.forEach(g => { if (g.ko) defeated++; }); enemyTeam.ghosts.forEach(g => { if (g.ko) defeated++; });
        if (defeated > 0) { heal(ghost, defeated * 2, true); ev(result, `${ghost.name}: Solitude! +${defeated*2} HP`); }
      } break;
    case 302: // Maximo — first roll 1 die only (handled by caller)
      ev(result, `${ghost.name}: Nap... first roll is 1 die only`); break;
    case 201: // Bouril — first roll auto 1-2-3
      ev(result, `${ghost.name}: Slumber... first roll is 1-2-3`); break;
  }
}

// ── BONUS DAMAGE (active ghost, on win) ──
function getAbilityBonusDamage(attackerTeam, defenderTeam, roll, dice, result) {
  let bonus = 0;
  const ghost = activeGhost(attackerTeam);
  const enemy = activeGhost(defenderTeam);
  const res = attackerTeam.resources;

  // Active ghost abilities
  switch (ghost.id) {
    case 112: bonus += 2; ev(result, `${ghost.name}: FIENDSHIP! +2 damage`); break; // Doom
    case 445: bonus += 1; ev(result, `${ghost.name}: Torrent! +1 damage`); break; // Mike
    case 424: bonus += 1; ev(result, `${ghost.name}: Omen! +1 damage`); break; // Bigsby
    case 40: bonus += 2; ev(result, `${ghost.name}: Teamwork! +2 singles damage`); break; // Team Zippy (singles +2)
    case 110: // Mountain King — doubles 2X
      if (roll.type === 'doubles') { bonus += roll.damage; ev(result, `${ghost.name}: BEAST MODE! 2X damage`); } break;
    case 311: // Pudge — doubles +2
      if (roll.type === 'doubles') { bonus += 2; ev(result, `${ghost.name}: Belly Flop! +2 damage`); } break;
    case 86: // Pelter — doubles +2
      if (roll.type === 'doubles') { bonus += 2; ev(result, `${ghost.name}: Snowball! +2 damage`); } break;
    case 42: // Doc — doubles +5
      if (roll.type === 'doubles') { bonus += 5; ev(result, `${ghost.name}: SAVAGE! +5 damage`); } break;
    case 16: // Chip — even doubles +3
      if (roll.type === 'doubles' && roll.value % 2 === 0) { bonus += 3; ev(result, `${ghost.name}: Acrobatic Dive! +3 damage`); } break;
    case 18: // Charlie — double 2's = 7 damage
      if (roll.type === 'doubles' && roll.value === 2) { bonus += 5; ev(result, `${ghost.name}: RUSH! Double 2's hit for 7!`); } break;
    case 73: // Stone Cold — double 1's 3X
      if (roll.type === 'doubles' && roll.value === 1) { bonus += roll.damage * 2; ev(result, `${ghost.name}: ONE-TWO-ONE! 3X damage`); } break;
    case 35: // Larry — triples 3X
      if (roll.type === 'triples') { bonus += roll.damage * 2; ev(result, `${ghost.name}: FLYING KICK! 3X triples`); } break;
    case 39: // Castle Guards — 3's multiply damage by 2 each
      { const threes = countVal(dice, 3); if (threes > 0) { bonus += roll.damage * (Math.pow(2, threes) - 1);
        ev(result, `${ghost.name}: Flamethrower! ${threes}x3's = ${Math.pow(2,threes)}X damage`); } } break;
    case 65: // Wim — +5 all odd
      if (allOdd(dice)) { bonus += 5; ev(result, `${ghost.name}: SLASH! All odd +5 damage`); } break;
    case 64: // Sparky — 1's add +3 each
      { const ones = countVal(dice, 1); if (ones > 0) { bonus += ones * 3; ev(result, `${ghost.name}: Tinder! ${ones}x1's = +${ones*3} damage`); } } break;
    case 3: // Ancient Librarian — each 2 rolled +1
      { const twos = countVal(dice, 2) + countVal(result.enemyDice || [], 2); if (twos > 0) { bonus += twos; ev(result, `${ghost.name}: Knowledge! +${twos} from 2's`); } } break;
    case 67: // Snorton — two 6's +5
      if (countVal(dice, 6) >= 2) { bonus += 5; ev(result, `${ghost.name}: FISSURE! Two 6's +5 damage`); } break;
    case 367: // Dragonclaw — 3 different numbers +3
      if (new Set(dice).size >= 3) { bonus += 3; ev(result, `${ghost.name}: Rake! +3 damage`); } break;
    case 345: // Red Hunter — +3 if opponent has specials
      { if (Object.values(defenderTeam.resources).some(v => v > 0)) { bonus += 3; ev(result, `${ghost.name}: RUMBLE! +3 damage`); } } break;
    case 312: // Timpleton — +3 if enemy HP > mine
      if (enemy.hp > ghost.hp) { bonus += 3; ev(result, `${ghost.name}: Big Target! +3 damage`); } break;
    case 36: // Bill & Bob — below 4 HP = 2X
      if (ghost.hp < 4) { bonus += roll.damage; ev(result, `${ghost.name}: Bait n Switch! 2X damage (low HP)`); } break;
    case 49: // Greg — more HP than enemy = 2X
      if (ghost.hp > enemy.hp) { bonus += roll.damage; ev(result, `${ghost.name}: Chase! 2X damage (HP advantage)`); } break;
    case 449: // Carpenter — +2 on singles
      if (roll.type === 'singles') { bonus += 2; ev(result, `${ghost.name}: Crafty! +2 singles damage`); } break;
    case 423: // Zippa — +1 per Healing Seed held
      if (res.healingSeed > 0) { bonus += res.healingSeed; ev(result, `${ghost.name}: Glimmer! +${res.healingSeed} from seeds`); } break;
    case 325: // Magma Heart — below 3 HP: ignore reduction
      if (ghost.hp < 3) ev(result, `${ghost.name}: Core Melt! True damage`); break;
  }

  // ── SIDELINE BONUS DAMAGE ──
  for (const sg of sidelineGhosts(attackerTeam)) {
    switch (sg.id) {
      case 74: bonus += 1; ev(result, `${sg.name} (bench): +1 damage`); break; // Dark Jeff
      case 80: if (roll.type === 'singles') { bonus += 2; ev(result, `${sg.name} (bench): +2 singles`); } break; // Bilbo
      case 95: if (roll.type === 'doubles') { bonus += 2; ev(result, `${sg.name} (bench): +2 doubles`); } break; // Tabitha
      case 71: if (roll.type === 'doubles' && roll.value % 2 === 0) { bonus += 2; ev(result, `${sg.name} (bench): +2 even doubles`); } break; // Admiral
      case 88: if (diceSum(dice) < 7) { bonus += 2; ev(result, `${sg.name} (bench): +2 low roll`); } break; // Pale Nimbus
      case 93: if (dice.length <= 2) { bonus += 3; ev(result, `${sg.name} (bench): +3 (2 dice)`); } break; // Bandit Pete
      case 436: ev(result, `${sg.name} (bench): +1 pre-roll damage`); break; // Princess Shade
    }
  }

  return bonus;
}

// ── DAMAGE REDUCTION (defender) ──
function applyDamageReduction(defenderTeam, damage, attackRoll, result) {
  const ghost = activeGhost(defenderTeam);
  let dmg = damage;

  switch (ghost.id) {
    case 5: // Puff — doubles/triples -1
      if (attackRoll.type === 'doubles' || attackRoll.type === 'triples') { dmg -= 1; ev(result, `${ghost.name}: Cute! -1 damage`); } break;
    case 332: // Grandmother Willow — can't die to singles
      if (attackRoll.type === 'singles' && ghost.hp - dmg <= 0) { dmg = Math.max(0, ghost.hp - 1); ev(result, `${ghost.name}: Deep Roots! Survives singles`); } break;
    case 96: // Hector — singles beat doubles, +1 on singles
      if (attackRoll.type === 'doubles') { dmg = 0; ev(result, `${ghost.name}: PROTECTOR! Singles beat doubles`); } break;
    case 41: // Guard Thomas — below 6 HP: immune to singles
      if (ghost.hp < 6 && attackRoll.type === 'singles') { dmg = 0; ev(result, `${ghost.name}: Stoic! Immune to singles`); } break;
    case 77: // City Cyboo — no damage from doubles
      if (attackRoll.type === 'doubles') { dmg = 0; ev(result, `${ghost.name}: Barrier! Immune to doubles`); } break;
    case 427: // Garrick — lose: -1 damage
      dmg = Math.max(0, dmg - 1); ev(result, `${ghost.name}: Watchfire! -1 damage taken`); break;
    case 37: // Dealer — numeric order = immune
      { const sorted = [...result.playerDice||[]].sort((a,b)=>a-b);
        if (isSequence(sorted)) { dmg = 0; ev(result, `${ghost.name}: House Rules! Sequence = immune`); }
      } break;
  }

  // Sideline damage reduction
  for (const sg of sidelineGhosts(defenderTeam)) {
    switch (sg.id) {
      case 319: if (dmg >= 3) { dmg = 2; ev(result, `${sg.name} (bench): damage capped at 2`); } break; // Pumice
      case 99: // Guardian Fairy — takes hit instead
        if (dmg > 0 && !sg.usedOncePerGame) { sg.usedOncePerGame = true; sg.hp = 0; sg.ko = true;
          dmg = 0; ev(result, `${sg.name}: WISH! Takes the hit instead (KO'd)`); } break;
    }
  }

  return dmg;
}

// ── WIN ABILITIES ──
function triggerWinAbilities(winnerTeam, loserTeam, roll, dice, result) {
  const ghost = activeGhost(winnerTeam);
  const enemy = activeGhost(loserTeam);
  const res = winnerTeam.resources;

  switch (ghost.id) {
    case 209: addResource(res, 'surge', 2); ev(result, `${ghost.name}: +2 Surge`); break; // Dart
    case 329: addResource(res, 'surge', 1); ev(result, `${ghost.name}: +1 Surge`); break; // Clink
    case 108: addResource(res, 'sacredFire', 1); ev(result, `${ghost.name}: Blue Fire! +1 Sacred Fire`); break; // Lucy
    case 81: addResource(res, 'iceShard', 2); ev(result, `${ghost.name}: +2 Ice Shards`); break; // Spockles
    case 206: addResource(res, 'iceShard', 1); ev(result, `${ghost.name}: +1 Ice Shard`); break; // Zain
    case 307: addResource(res, 'iceShard', 3); ev(result, `${ghost.name}: +3 Ice Shards`); break; // Artemis
    case 58: addResource(res, 'sacredFire', 1); ev(result, `${ghost.name}: +1 Sacred Fire`); break; // Ashley
    case 316: addResource(res, 'healingSeed', 1); ev(result, `${ghost.name}: +1 Healing Seed`); break; // Penny
    case 426: addResource(res, 'healingSeed', 1); ev(result, `${ghost.name}: +1 Healing Seed`); // Chester
      if (roll.type === 'doubles' || roll.type === 'triples') ev(result, `${ghost.name}: Well Read! Doubles bonus`); break;
    case 342: heal(ghost, 1, true); addResource(res, 'healingSeed', 1); ev(result, `${ghost.name}: Overclock! +1 HP, +1 Seed`); break; // Calvin
    case 317: enemy.maxHp = Math.max(1, enemy.maxHp - 1); ev(result, `${ghost.name}: Singe! -1 max HP to ${enemy.name}`); break; // Scorch
    case 66: heal(ghost, 4, false); ev(result, `${ghost.name}: Scraps! +4 HP from KO`); break; // Munch
    case 48: heal(ghost, 1, false); ev(result, `${ghost.name}: Rest! +1 HP`); break; // Opa
    case 451: ev(result, `${ghost.name}: Blueprint! +1 die next roll`); break; // Foreman
    case 336: hp(enemy, -2); ev(result, `${ghost.name}: METEOR! 2 damage before next roll`); break; // Humar
    case 75: // Flora — doubles +2 HP
      if (roll.type === 'doubles') { heal(ghost, 2, false); ev(result, `${ghost.name}: Restore! +2 HP`); } break;
    case 68: // Kairan — doubles +1 die
      if (roll.type === 'doubles') ev(result, `${ghost.name}: Let's Dance! +1 die next roll`); break;
    case 440: // Gom Gom Gom — doubles +1 Sacred Fire
      if (roll.type === 'doubles') { addResource(res, 'sacredFire', 1); ev(result, `${ghost.name}: +1 Sacred Fire`); } break;
    case 441: // Wendy — doubles+ = +1 Firefly
      if (roll.type === 'doubles' || roll.type === 'triples') { addResource(res, 'firefly', 1); ev(result, `${ghost.name}: Moonbeam! +1 Firefly`); } break;
    case 448: // Harvey — +1 Moonstone per 5 rolled
      { const fives = countVal(dice, 5); if (fives > 0) { addResource(res, 'moonstone', fives); ev(result, `${ghost.name}: +${fives} Moonstone`); } } break;
    case 446: ev(result, `${ghost.name}: Hex! +1 Burn`); break; // Mable Stadango
    case 430: addResource(res, 'moonstone', 1); ev(result, `${ghost.name}: +1 Moonstone, +1 die next`); break; // Gordok
    case 428: // Jasper — bonus die damage, self -1 HP
      { const jd = rollDie(); hp(ghost, -1); ev(result, `${ghost.name}: Flame Dive! +${jd} damage, -1 HP`); } break;
  }

  // Dice-triggered resource gen (fires on any roll, not just wins)
  if (ghost.id === 207) { const fours = countVal(dice, 4); if (fours > 0) { addResource(res, 'luckyStone', fours); ev(result, `${ghost.name}: Tremor! +${fours} Lucky Stone`); } } // Hank
  if (ghost.id === 327) { if (roll.type === 'doubles' && roll.value % 2 === 0) { addResource(res, 'moonstone', 2); ev(result, `${ghost.name}: +2 Moonstones (even doubles)`); } } // Natalia

  // Sideline win abilities
  for (const sg of sidelineGhosts(winnerTeam)) {
    switch (sg.id) {
      case 324: heal(ghost, 1, false); ev(result, `${sg.name} (bench): +1 HP`); break; // Biscuit
      case 14: heal(ghost, 3, true); ev(result, `${sg.name} (bench): +3 HP!`); break; // Jeffery
      case 11: heal(ghost, 1, false); ev(result, `${sg.name} (bench): +1 HP`); break; // Villager
      case 32: if (ghost.id === 34) { heal(ghost, 1, false); ev(result, `${sg.name} (bench): Grawr +1 HP, +1 dmg`); } break; // Lou for Grawr
      case 61: ev(result, `${sg.name} (bench): steal 1 enemy die next roll`); break; // Suspicious Jeff
      case 415: // Nyx & Bessie — if we KO'd someone, +4 Healing Seeds
        if (enemy.ko) { addResource(res, 'healingSeed', 4); ev(result, `${sg.name} (bench): MOO! CAW! +4 Healing Seeds`); } break;
      case 314: // Farmer Jeff — each 6 = +1 Healing Seed
        { const sixes = countVal(dice, 6); if (sixes > 0) { addResource(res, 'healingSeed', sixes); ev(result, `${sg.name} (bench): +${sixes} Healing Seed`); } } break;
      case 92: // Gary — each 1 = +2 Ice Shards
        { const ones = countVal(dice, 1); if (ones > 0) { addResource(res, 'iceShard', ones * 2); ev(result, `${sg.name} (bench): +${ones*2} Ice Shards`); } } break;
      case 443: // Captain James — triples+ = +2 Sacred Fires
        if (roll.type === 'triples' || roll.type === 'quads' || roll.type === 'penta') { addResource(res, 'sacredFire', 2); ev(result, `${sg.name} (bench): +2 Sacred Fires!`); } break;
    }
  }
}

// ── LOSS ABILITIES ──
function triggerLossAbilities(loserTeam, winnerTeam, roll, dice, result) {
  const ghost = activeGhost(loserTeam);
  const attacker = activeGhost(winnerTeam);
  const res = loserTeam.resources;
  const dmgTaken = ghost === result.playerGhost ? result.playerDamageDealt : result.enemyDamageDealt;

  switch (ghost.id) {
    case 29: addResource(res, 'iceShard', 1); ev(result, `${ghost.name}: +1 Ice Shard`); break; // Sad Sal
    case 329: addResource(res, 'surge', 1); ev(result, `${ghost.name}: +1 Surge`); break; // Clink (also on loss)
    case 404: addResource(res, 'surge', 1); ev(result, `${ghost.name}: Bitter End! +1 Surge`); break; // Chagrin
    case 113: // Prince Balatron — counter die on loss if alive
      if (ghost.hp > 0) { const cd = rollDie(); hp(attacker, -cd); ev(result, `${ghost.name}: PARTY TIME! Counter die: ${cd} damage!`); } break;
    case 52: ev(result, `${ghost.name}: Wreckage! -1 enemy die next roll`); break; // Hugo
    case 57: if (dmgTaken >= 3) ev(result, `${ghost.name}: Glacial Pounding! +4 dice next roll`); break; // Marcus
  }

  // Damage reflection
  if (ghost.id === 338 && dmgTaken > 0) { hp(attacker, -1); ev(result, `${ghost.name}: Barbed! 1 damage reflected`); } // Thistle
  if (ghost.id === 410 && roll.type === 'doubles' && !ghost.usedOncePerGame) { // Mirror Matt
    ghost.usedOncePerGame = true; hp(attacker, -dmgTaken); ev(result, `${ghost.name}: SEVEN YEARS! ${dmgTaken} reflected!`);
  }
  if (ghost.id === 53 && !ghost.usedOncePerGame) { // Bogey — reflect once
    ghost.usedOncePerGame = true; hp(attacker, -dmgTaken); heal(ghost, dmgTaken, false);
    ev(result, `${ghost.name}: BOGUS! Damage reflected!`);
  }

  // Self-damage on doubles (Pudge)
  if (ghost.id === 311 && roll.type === 'doubles') { hp(ghost, -1); ev(result, `${ghost.name}: Belly Flop self-damage!`); }

  // Sideline loss abilities
  for (const sg of sidelineGhosts(loserTeam)) {
    if (sg.id === 13 && ghost.hp > 0 && ghost.hp < 4 && !sg.usedOncePerGame) { // Shoo
      sg.usedOncePerGame = true; heal(ghost, 2, false); ev(result, `${sg.name} (bench): Alpine Air! +2 HP`);
    }
    if (sg.id === 100 && ghost.hp > 0 && ghost.hp < 3) { // Cyboo
      ev(result, `${sg.name} (bench): Spark! +1 die (low HP)`);
    }
  }

  // Death triggers
  if (ghost.ko) {
    if (ghost.id === 23) { addResource(res, 'iceShard', 3); ev(result, `${ghost.name}: Final Gift! +3 Ice Shards`); } // Powder
    if (ghost.id === 348) { addResource(res, 'healingSeed', 2); ev(result, `${ghost.name}: Decompose! +2 Healing Seeds`); } // Mulch
  }
}

// ── TIE ABILITIES ──
function triggerTieAbilities(teamA, teamB, rollA, rollB, diceA, diceB, result) {
  for (const team of [teamA, teamB]) {
    const ghost = activeGhost(team);
    const res = team.resources;
    if (ghost.id === 12) { // Dupy — tie = instant KO
      const enemy = activeGhost(team === teamA ? teamB : teamA);
      enemy.hp = 0; enemy.ko = true;
      ev(result, `${ghost.name}: FROLIC! Tie = instant KO!`);
    }
    if (ghost.id === 48) heal(ghost, 1, false); // Opa — tie +1 HP
    // Sideline tie abilities
    for (const sg of sidelineGhosts(team)) {
      if (sg.id === 303) { addResource(res, 'surge', 4); ev(result, `${sg.name} (bench): +4 Surge (tie!)`); } // Tweak and Twonk
      if (sg.id === 352) { addResource(res, 'luckyStone', 5); addResource(res, 'firefly', 1); ev(result, `${sg.name} (bench): +5 Lucky Stones, +1 Firefly!`); } // Jimmy
      if (sg.id === 22) { heal(ghost, 3, false); ev(result, `${sg.name} (bench): +3 HP (tie)`); } // Ancient One
      if (sg.id === 444) { addResource(res, 'firefly', 1); ev(result, `${sg.name} (bench): +1 Firefly (tie)`); } // Goobs
    }
  }
}

// ── BEFORE-ROLL ABILITIES (chip damage, debuffs) ──
function triggerBeforeRoll(attackerTeam, defenderTeam, result) {
  const ghost = activeGhost(attackerTeam);
  const enemy = activeGhost(defenderTeam);
  const res = attackerTeam.resources;

  switch (ghost.id) {
    case 111: hp(enemy, -1); ev(result, `${ghost.name}: Haunt! 1 damage before roll`); break; // Shade
    case 304: hp(enemy, -1); ev(result, `${ghost.name}: Swarm! 1 damage before roll`); break; // Ember Force
    case 70: if (ghost.hp < enemy.hp) { heal(ghost, 1, false); ev(result, `${ghost.name}: Seeker! +1 HP (underdog)`); } break; // Katrina
    case 349: hp(enemy, -1); hp(ghost, -1); ev(result, `${ghost.name}: Slow Burn! 1 dmg to both`); break; // Wick
  }

  // Sideline before-roll
  for (const sg of sidelineGhosts(attackerTeam)) {
    if (sg.id === 205 && enemy.hp < 4) { hp(enemy, -1); ev(result, `${sg.name} (bench): Meltdown! 1 damage (enemy < 4 HP)`); } // Shade's Shadow
  }
}

// ═══════ ENCOUNTER GENERATION ═══════

// Get a random card appropriate for the region
function getEncounterCard(region) {
  let pool;
  // Set 1 cards appear everywhere, regional cards appear in their region
  const general = CARDS.filter(c => c.set === 'Set 1' && c.rarity !== 'legendary');
  switch (region) {
    case 'rolling_hills':
      pool = CARDS.filter(c => (c.set === 'Rolling Hills') && c.rarity !== 'legendary').concat(general);
      break;
    case 'frost_valley':
      pool = CARDS.filter(c => (c.set === 'Frost Valley') && c.rarity !== 'legendary').concat(general);
      break;
    case 'volcanic_isles':
      pool = CARDS.filter(c => (c.set === 'Volcanic Activity') && c.rarity !== 'legendary').concat(general);
      break;
    case 'dark_castle':
      pool = CARDS.filter(c => (c.set === 'Dark Castle') && c.rarity !== 'legendary').concat(general);
      break;
    default:
      pool = CARDS.filter(c => c.rarity !== 'legendary');
  }
  if (!pool.length) pool = CARDS.filter(c => c.rarity !== 'legendary');

  // Weighted by rarity
  const weights = { common: 50, uncommon: 30, rare: 15, 'ghost-rare': 5 };
  const weighted = [];
  for (const card of pool) {
    const w = weights[card.rarity] || 10;
    for (let i = 0; i < w; i++) weighted.push(card);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
}

// ═══════ BOSS DATA ═══════

const BOSSES = {
  timber:  { cardId: 210, hp: 5, name: "Timber",  phase2Hp: 3, phase2Desc: "Rooted: -1 damage taken" },
  kingJay: { cardId: 106, hp: 7, name: "King Jay", phase2Hp: 4, phase2Desc: "Ice Armor: first hit each round = 0" },
  nerina:  { cardId: 306, hp: 7, name: "Nerina",  phase2Hp: 4, phase2Desc: "Eruption: winning doubles = triple damage" },
  lucy:    { cardId: 108, hp: 8, name: "Lucy",    phase2Hp: 4, phase2Desc: "Eternal Flame: +2 on wins, 2 dmg on losses" },
  valkin:  { cardId: 432, hp: 12, name: "Valkin the Grand", phase2Hp: 6, phase2Desc: "Rage: +1 die, +2 all damage" }
};

// ═══════ GAME STATE ═══════

function createGameState(starterCardId) {
  return {
    // Player
    party: makeTeam([starterCardId]),
    coins: 3,
    items: [],
    quests: [],
    seals: [], // region seals from bosses

    // Map
    currentNode: 0,
    visitedNodes: new Set([0]),
    revealedEncounters: {}, // nodeId -> cardId

    // Turn
    turnNumber: 0,
    canMove: true,
    movementRoll: 0,
    movesLeft: 0,

    // Progress
    bossesDefeated: [],
    regionsUnlocked: ['rolling_hills'],
    gameOver: false,
    won: false
  };
}

// ═══════ MOVEMENT ═══════

function rollMovement() {
  return rollDie(); // 1-6
}

function getConnectedNodes(nodeId, edges) {
  const connected = new Set();
  for (const [a, b] of edges) {
    if (a === nodeId) connected.add(b);
    if (b === nodeId) connected.add(a);
  }
  return [...connected];
}

function getReachableNodes(startId, maxSteps, edges, nodes) {
  // BFS up to maxSteps
  const reachable = new Map(); // nodeId -> distance
  const queue = [[startId, 0]];
  const visited = new Set([startId]);

  while (queue.length) {
    const [current, dist] = queue.shift();
    if (dist > 0) reachable.set(current, dist);
    if (dist >= maxSteps) continue;

    for (const neighbor of getConnectedNodes(current, edges)) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }

  return reachable; // Map<nodeId, distance>
}

// ═══════ ITEM SYSTEM ═══════

const ITEMS = [
  { id: 'spirit_charm',    name: 'Spirit Charm',    cost: 2, desc: '+1 die in next battle', type: 'consumable' },
  { id: 'revive_potion',   name: 'Revive Potion',   cost: 3, desc: 'Revive 1 KO\'d ghost to full HP', type: 'consumable' },
  { id: 'smoke_bomb',      name: 'Smoke Bomb',      cost: 2, desc: 'Flee any non-boss battle', type: 'consumable' },
  { id: 'power_crystal',   name: 'Power Crystal',   cost: 5, desc: '+2 damage for one entire battle', type: 'consumable' },
  { id: 'spirit_coin_bag', name: 'Spirit Coin Bag',  cost: 1, desc: 'Gain 3 Spirit Coins', type: 'consumable' },
  { id: 'wind_charm',      name: 'Wind Charm',      cost: 5, desc: 'Choose movement (1-6) instead of rolling', type: 'reusable', cooldown: 2 },
  { id: 'battle_horn',     name: 'Battle Horn',     cost: 4, desc: 'Re-roll all dice once per battle', type: 'reusable', cooldown: 2 },
  { id: 'lantern_lens',    name: 'Lantern Lens',    cost: 6, desc: 'Peek at any encounter on the map', type: 'reusable', cooldown: 3 },
];

function getShopItems() {
  // Draw 4 random items
  const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

// ═══════ EVENT SYSTEM ═══════

const EVENTS = [
  { id: 'wild_battle',     name: 'Wild Battle!',        desc: 'A wild Spiritkin attacks!', type: 'battle' },
  { id: 'wild_battle2',    name: 'Ambush!',             desc: 'A strong spirit emerges!', type: 'battle' },
  { id: 'lucky_find',      name: 'Lucky Find',          desc: 'You found resources!', type: 'reward', reward: { coins: 3 } },
  { id: 'healing_spring',  name: 'Healing Spring',      desc: 'Heal all ghosts +2 HP.', type: 'heal' },
  { id: 'resource_cache',  name: 'Resource Cache',      desc: 'Gain 2 random resources.', type: 'resources' },
  { id: 'wandering_spirit',name: 'Wandering Spirit',    desc: 'A friendly spirit offers to join!', type: 'free_recruit' },
  { id: 'trap',            name: 'Trap!',               desc: 'Active ghost takes 2 damage.', type: 'trap' },
  { id: 'storm',           name: 'Spirit Storm',        desc: 'Lose 1 random resource.', type: 'loss' },
  { id: 'merchant',        name: 'Traveling Merchant',  desc: 'Buy 1 item at half price.', type: 'shop' },
  { id: 'goo_sighting',    name: 'Goo Sighting!',       desc: 'A legendary Goo appears...', type: 'goo' },
];

function drawEvent() {
  return EVENTS[Math.floor(Math.random() * EVENTS.length)];
}

// ═══════ EXPORTS ═══════

if (typeof window !== 'undefined') {
  window.ENGINE = {
    CARDS, ITEMS, EVENTS, BOSSES, RESOURCE_NAMES,
    getCard, getCardsBySet, getCardsByRarity,
    rollDie, rollDice, classify, describeRoll, compareRolls, weightedRoll, hasSideline,
    makeResources, addResource,
    makeGhost, makeTeam, activeGhost, sidelineGhosts, aliveGhosts, isTeamDefeated,
    resolveBattleRound, triggerEntryAbility,
    getEncounterCard, drawEvent, getShopItems,
    createGameState, rollMovement, getConnectedNodes, getReachableNodes
  };
}
