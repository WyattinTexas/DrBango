// ═══════════════════════════════════════════════════════════════
// BOO! SPIRIT BATTLES — OVERWORLD ADVENTURE ENGINE
// Battle system, card data, game state, movement, encounters
// ═══════════════════════════════════════════════════════════════

// ═══════ CARD DATABASE — loaded from cards_data.js (ALL_CARDS, 233 cards) ═══════
// Fallback if cards_data.js hasn't loaded yet
if (typeof ALL_CARDS === 'undefined') var ALL_CARDS = [];
const CARDS = ALL_CARDS.length ? ALL_CARDS : [
  // Minimal fallback
  {id:316, name:"Penny",     rarity:"common",   maxHp:4, ability:"Forager",       desc:"Win: gain 1 Healing Seed.",                   set:"Rolling Hills"},
  {id:320, name:"Bramble",   rarity:"common",   maxHp:3, ability:"Thorn Wall",    desc:"Entry: opponent takes 1 damage next round.",   set:"Rolling Hills"},
  {id:328, name:"Drizzle",   rarity:"common",   maxHp:4, ability:"Rain Dance",    desc:"Both players reroll all 1s.",                  set:"Rolling Hills"},
  {id:340, name:"Cluck",     rarity:"common",   maxHp:5, ability:"Peck",          desc:"Win with singles: deal +2 damage.",            set:"Rolling Hills"},
  {id:358, name:"Tadpole",   rarity:"common",   maxHp:5, ability:"Splash",        desc:"Entry: gain 1 Surge.",                        set:"Rolling Hills"},
  {id:324, name:"Biscuit",   rarity:"common",   maxHp:5, ability:"Warm Up",       desc:"Sideline: active ghost heals +1 HP on wins.", set:"Rolling Hills"},
  {id:311, name:"Pudge",     rarity:"common",   maxHp:7, ability:"Belly Flop",    desc:"Doubles: deal +2 damage. Then take 1 damage.", set:"Rolling Hills"},
  {id:308, name:"Kaplan",    rarity:"uncommon", maxHp:5, ability:"Pollinate",      desc:"When opponent rolls doubles: gain 1 Healing Seed.", set:"Rolling Hills"},
  {id:318, name:"Magnolia",  rarity:"uncommon", maxHp:5, ability:"Bloom",          desc:"Spend 1 Healing Seed: +2 damage this round.", set:"Rolling Hills"},
  {id:342, name:"Calvin",    rarity:"uncommon", maxHp:5, ability:"Overclock",      desc:"Win: heal +1 HP (can exceed max). +1 Healing Seed.", set:"Rolling Hills"},
  {id:334, name:"Fiddle",    rarity:"uncommon", maxHp:6, ability:"Hoedown",        desc:"Win: you may swap active ghost safely.",       set:"Rolling Hills"},
  {id:309, name:"Aunt Susan",rarity:"rare",     maxHp:4, ability:"Harvest Dance",  desc:"Spend 1 Healing Seed: +2 dmg OR +2 HP. Win: +1 seed.", set:"Rolling Hills"},
  {id:338, name:"Thistle",   rarity:"rare",     maxHp:7, ability:"Barbed",         desc:"When you take damage: attacker takes 1 back.", set:"Rolling Hills"},
  {id:346, name:"Harvest Moon",rarity:"rare",   maxHp:6, ability:"Reaping",        desc:"Defeat a ghost: gain 1 of every resource.",   set:"Rolling Hills"},
  {id:332, name:"Grandmother Willow",rarity:"ghost-rare",maxHp:7, ability:"Deep Roots", desc:"Cannot be KO'd by singles damage.", set:"Rolling Hills"},
  {id:305, name:"Selene",    rarity:"legendary",maxHp:6, ability:"Heart of Hills", desc:"Doubles: choose 2 Healing Seeds OR 3 Lucky Stones.", set:"Rolling Hills"},
  {id:210, name:"Timber",    rarity:"legendary",maxHp:7, ability:"Howl",           desc:"Before roll: opponent discards 2 specials OR removes 1 die.", set:"Rolling Hills"},

  // ── FROST VALLEY ──
  {id:23,  name:"Powder",    rarity:"common",   maxHp:5, ability:"Final Gift",     desc:"When defeated: gain 3 Ice Shards.",           set:"Frost Valley"},
  {id:25,  name:"Cameron",   rarity:"common",   maxHp:6, ability:"Force of Nature",desc:"If your damage is negated, destroy the enemy.",set:"Frost Valley"},
  {id:29,  name:"Sad Sal",   rarity:"common",   maxHp:5, ability:"Tough Job",      desc:"Lose a roll: gain 1 Ice Shard.",              set:"Frost Valley"},
  {id:31,  name:"Gus",       rarity:"common",   maxHp:7, ability:"Gale Force",     desc:"Win: may force opponent to swap instead of damage.", set:"Frost Valley"},
  {id:30,  name:"Tommy Salami",rarity:"common", maxHp:6, ability:"Regulator",      desc:"Roll a 6: gain +1 die and roll it. Chains.",  set:"Frost Valley"},
  {id:56,  name:"Chad",      rarity:"uncommon", maxHp:6, ability:"Sploop!",        desc:"Entry: gain 2 Ice Shards.",                   set:"Frost Valley"},
  {id:53,  name:"Bogey",     rarity:"uncommon", maxHp:5, ability:"Bogus",          desc:"Reflect damage back once per game.",           set:"Frost Valley"},
  {id:57,  name:"Marcus",    rarity:"uncommon", maxHp:7, ability:"Glacial Pounding",desc:"Take 3+ damage: gain 4 extra dice next roll.",set:"Frost Valley"},
  {id:86,  name:"Pelter",    rarity:"rare",     maxHp:5, ability:"Snowball",       desc:"Doubles gain +2 damage.",                     set:"Frost Valley"},
  {id:81,  name:"Spockles",  rarity:"rare",     maxHp:6, ability:"Valley Magic",   desc:"Win: gain 2 Ice Shards.",                     set:"Frost Valley"},
  {id:75,  name:"Flora",     rarity:"rare",     maxHp:4, ability:"Restore",        desc:"Roll doubles: +2 HP after damage.",           set:"Frost Valley"},
  {id:92,  name:"Gary",      rarity:"rare",     maxHp:6, ability:"Lucky Novice",   desc:"Gain +2 Ice Shards for each 1 you roll.",     set:"Frost Valley"},
  {id:106, name:"King Jay",  rarity:"ghost-rare",maxHp:7, ability:"Reflection",    desc:"Lose & dice total 7: reflect all damage.",    set:"Frost Valley"},
  {id:104, name:"Skylar",    rarity:"ghost-rare",maxHp:7, ability:"Winter Barrage",desc:"Ice Shards deal +2 damage instead of +1.",    set:"Frost Valley"},
  {id:113, name:"Prince Balatron",rarity:"legendary",maxHp:6, ability:"Party Time",desc:"Lose & survive: roll 1 counter die for damage.", set:"Frost Valley"},

  // ── VOLCANIC ISLES ──
  {id:209, name:"Dart",      rarity:"common",   maxHp:3, ability:"Plunder",        desc:"Win: gain 2 Surge.",                          set:"Volcanic Activity"},
  {id:329, name:"Clink",     rarity:"common",   maxHp:3, ability:"Prospect",       desc:"Win OR lose: gain 1 Surge.",                  set:"Volcanic Activity"},
  {id:317, name:"Scorch",    rarity:"common",   maxHp:3, ability:"Singe",          desc:"Win: opponent loses 1 max HP permanently.",   set:"Volcanic Activity"},
  {id:304, name:"Ember Force",rarity:"uncommon",maxHp:3, ability:"Swarm",          desc:"Before rolling: deal 1 damage to enemy.",     set:"Volcanic Activity"},
  {id:321, name:"Forge Fire",rarity:"uncommon", maxHp:5, ability:"Temper",         desc:"Spend 1 Surge: next win deals double damage.",set:"Volcanic Activity"},
  {id:343, name:"Boris",     rarity:"uncommon", maxHp:6, ability:"Fortify",        desc:"Spend 1 Surge: gain 2 HP (can exceed max).",  set:"Volcanic Activity"},
  {id:325, name:"Magma Heart",rarity:"rare",    maxHp:7, ability:"Core Melt",      desc:"Below 3 HP: damage ignores all reduction.",   set:"Volcanic Activity"},
  {id:367, name:"Dragonclaw",rarity:"rare",     maxHp:7, ability:"Rake",           desc:"Win with 3 different numbers: +3 damage.",    set:"Volcanic Activity"},
  {id:327, name:"Natalia",   rarity:"ghost-rare",maxHp:6, ability:"Materialization",desc:"Even doubles (2s,4s,6s): gain 2 Moonstones.",set:"Volcanic Activity"},
  {id:345, name:"Red Hunter",rarity:"ghost-rare",maxHp:6, ability:"Rumble",        desc:"Win: if opponent has specials, deal +3 damage.", set:"Volcanic Activity"},
  {id:306, name:"Nerina",    rarity:"legendary",maxHp:9, ability:"Leviathan",      desc:"Entry: deal 3 damage to enemy.",              set:"Volcanic Activity"},

  // ── DARK CASTLE ──
  {id:19,  name:"Scallywags",rarity:"common",   maxHp:5, ability:"Frenzy",         desc:"All dice under 4: gain +1 die next turn.",    set:"Dark Castle"},
  {id:22,  name:"Ancient One",rarity:"common",  maxHp:7, ability:"Friend to All",  desc:"Sideline: +3 HP to active ghost on ties.",    set:"Dark Castle"},
  {id:5,   name:"Puff",      rarity:"common",   maxHp:6, ability:"Cute",           desc:"Enemy doubles and triples do -1 damage.",     set:"Dark Castle"},
  {id:52,  name:"Hugo",      rarity:"uncommon", maxHp:5, ability:"Wreckage",       desc:"Take damage: opponent loses 1 die next roll.",set:"Dark Castle"},
  {id:96,  name:"Hector",    rarity:"ghost-rare",maxHp:6, ability:"Protector",     desc:"Singles beat doubles. +1 damage on singles.", set:"Dark Castle"},
  {id:98,  name:"Redd",      rarity:"ghost-rare",maxHp:7, ability:"Notorious",     desc:"Entry: gain +2 dice this roll.",              set:"Dark Castle"},
  {id:108, name:"Lucy",      rarity:"legendary",maxHp:8, ability:"Blue Fire",      desc:"Win: gain 1 Sacred Fire.",                   set:"Dark Castle"},
  {id:112, name:"Doom",      rarity:"legendary",maxHp:7, ability:"Fiendship",      desc:"+2 bonus damage on all wins.",               set:"Dark Castle"},
  {id:110, name:"Mountain King",rarity:"legendary",maxHp:9, ability:"Beast Mode",  desc:"Doubles deal 2X damage.",                    set:"Dark Castle"},
  {id:432, name:"Valkin the Grand",rarity:"legendary",maxHp:8, ability:"Grand Spoils",desc:"KO a ghost: gain 1 of every resource type.", set:"Dark Castle"}
];

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

function isTeamDefeated(team) {
  return team.ghosts.every(g => g.ko);
}

// ═══════ BATTLE ENGINE ═══════

// A battle round: both sides roll, determine winner, apply damage + abilities
function resolveBattleRound(playerTeam, enemyTeam, playerDiceCount, enemyDiceCount) {
  const pDice = rollDice(playerDiceCount || 3);
  const eDice = rollDice(enemyDiceCount || 3);
  const pRoll = classify(pDice);
  const eRoll = classify(eDice);
  const winner = compareRolls(pRoll, eRoll);

  const result = {
    playerDice: pDice,
    enemyDice: eDice,
    playerRoll: pRoll,
    enemyRoll: eRoll,
    winner: winner, // 'a' = player wins, 'b' = enemy wins, 'tie' = tie
    playerDamageDealt: 0,
    enemyDamageDealt: 0,
    events: [], // text log of what happened
    playerGhost: activeGhost(playerTeam),
    enemyGhost: activeGhost(enemyTeam)
  };

  if (winner === 'a') {
    // Player wins this roll
    let dmg = pRoll.damage;
    // Apply committed Ice Shards
    dmg += playerTeam.resources.iceShard;
    // Apply committed Sacred Fires
    dmg += playerTeam.resources.sacredFire * 3;
    // Apply simple ability bonuses
    dmg += getAbilityBonusDamage(playerTeam, enemyTeam, pRoll, pDice, result);

    // Apply enemy damage reduction
    dmg = applyDamageReduction(enemyTeam, dmg, pRoll, result);
    dmg = Math.max(0, dmg);

    const target = activeGhost(enemyTeam);
    target.hp = Math.max(0, target.hp - dmg);
    if (target.hp <= 0) target.ko = true;
    result.enemyDamageDealt = dmg;
    result.events.push(`${activeGhost(playerTeam).name} deals ${dmg} damage!`);

    // Trigger win abilities
    triggerWinAbilities(playerTeam, enemyTeam, pRoll, pDice, result);

  } else if (winner === 'b') {
    // Enemy wins this roll
    let dmg = eRoll.damage;
    dmg += enemyTeam.resources.iceShard;
    dmg += enemyTeam.resources.sacredFire * 3;
    dmg += getAbilityBonusDamage(enemyTeam, playerTeam, eRoll, eDice, result);
    dmg = applyDamageReduction(playerTeam, dmg, eRoll, result);
    dmg = Math.max(0, dmg);

    const target = activeGhost(playerTeam);
    target.hp = Math.max(0, target.hp - dmg);
    if (target.hp <= 0) target.ko = true;
    result.playerDamageDealt = dmg;
    result.events.push(`${activeGhost(enemyTeam).name} deals ${dmg} damage!`);

    // Trigger loss abilities for player
    triggerLossAbilities(playerTeam, enemyTeam, eRoll, eDice, result);

  } else {
    result.events.push('Tie! Re-roll next round.');
  }

  return result;
}

// ═══════ ABILITY HANDLERS (simplified for board game) ═══════

function getAbilityBonusDamage(attackerTeam, defenderTeam, roll, dice, result) {
  let bonus = 0;
  const ghost = activeGhost(attackerTeam);

  switch (ghost.id) {
    case 112: // Doom — +2 on all wins
      bonus += 2;
      result.events.push(`${ghost.name}: Fiendship! +2 damage`);
      break;
    case 340: // Cluck — +2 on singles wins
      if (roll.type === 'singles') { bonus += 2; result.events.push(`${ghost.name}: Peck! +2 damage`); }
      break;
    case 311: // Pudge — +2 on doubles
      if (roll.type === 'doubles') { bonus += 2; result.events.push(`${ghost.name}: Belly Flop! +2 damage`); }
      break;
    case 86: // Pelter — +2 on doubles
      if (roll.type === 'doubles') { bonus += 2; result.events.push(`${ghost.name}: Snowball! +2 damage`); }
      break;
    case 110: // Mountain King — doubles 2X
      if (roll.type === 'doubles') { bonus += roll.damage; result.events.push(`${ghost.name}: Beast Mode! 2X damage`); }
      break;
    case 367: // Dragonclaw — +3 if 3 different numbers
      { const unique = new Set(dice).size;
        if (unique >= 3) { bonus += 3; result.events.push(`${ghost.name}: Rake! +3 damage`); }
      }
      break;
    case 345: // Red Hunter — +3 if opponent has specials
      { const oRes = defenderTeam.resources;
        const hasSpecials = Object.values(oRes).some(v => v > 0);
        if (hasSpecials) { bonus += 3; result.events.push(`${ghost.name}: Rumble! +3 damage`); }
      }
      break;
  }

  // Sideline abilities
  for (const sg of sidelineGhosts(attackerTeam)) {
    switch (sg.id) {
      case 74: // Dark Jeff — +1 all rolls
        bonus += 1;
        result.events.push(`${sg.name} (sideline): +1 damage`);
        break;
      case 80: // Bilbo — +2 on singles
        if (roll.type === 'singles') { bonus += 2; result.events.push(`${sg.name} (sideline): +2 singles damage`); }
        break;
      case 95: // Tabitha — +2 on doubles
        if (roll.type === 'doubles') { bonus += 2; result.events.push(`${sg.name} (sideline): +2 doubles damage`); }
        break;
    }
  }

  return bonus;
}

function applyDamageReduction(defenderTeam, damage, attackRoll, result) {
  const ghost = activeGhost(defenderTeam);
  let dmg = damage;

  switch (ghost.id) {
    case 5: // Puff — doubles/triples -1
      if (attackRoll.type === 'doubles' || attackRoll.type === 'triples') {
        dmg -= 1;
        result.events.push(`${ghost.name}: Cute! -1 damage`);
      }
      break;
    case 332: // Grandmother Willow — can't be KO'd by singles
      if (attackRoll.type === 'singles' && ghost.hp - dmg <= 0) {
        dmg = Math.max(0, ghost.hp - 1);
        result.events.push(`${ghost.name}: Deep Roots! Survives singles`);
      }
      break;
    case 96: // Hector — singles beat doubles
      if (attackRoll.type === 'doubles') {
        dmg = 0;
        result.events.push(`${ghost.name}: Protector! Singles beat doubles`);
      }
      break;
  }

  // Sideline damage reduction
  for (const sg of sidelineGhosts(defenderTeam)) {
    if (sg.id === 319 && dmg >= 3) { // Pumice — cap at 2
      dmg = 2;
      result.events.push(`${sg.name} (sideline): damage capped at 2`);
    }
  }

  return dmg;
}

function triggerWinAbilities(winnerTeam, loserTeam, roll, dice, result) {
  const ghost = activeGhost(winnerTeam);
  const res = winnerTeam.resources;

  switch (ghost.id) {
    case 316: // Penny — +1 Healing Seed
      addResource(res, 'healingSeed', 1);
      result.events.push(`${ghost.name}: +1 Healing Seed`);
      break;
    case 209: // Dart — +2 Surge
      addResource(res, 'surge', 2);
      result.events.push(`${ghost.name}: +2 Surge`);
      break;
    case 329: // Clink — +1 Surge (also on loss)
      addResource(res, 'surge', 1);
      result.events.push(`${ghost.name}: +1 Surge`);
      break;
    case 317: // Scorch — opponent -1 max HP
      { const target = activeGhost(loserTeam);
        target.maxHp = Math.max(1, target.maxHp - 1);
        result.events.push(`${ghost.name}: Singe! -1 max HP to ${target.name}`);
      }
      break;
    case 81: // Spockles — +2 Ice Shards
      addResource(res, 'iceShard', 2);
      result.events.push(`${ghost.name}: +2 Ice Shards`);
      break;
    case 108: // Lucy — +1 Sacred Fire
      addResource(res, 'sacredFire', 1);
      result.events.push(`${ghost.name}: Blue Fire! +1 Sacred Fire`);
      break;
    case 342: // Calvin — heal +1 HP + seed
      ghost.hp = Math.min(ghost.maxHp + 2, ghost.hp + 1); // can overclock slightly
      addResource(res, 'healingSeed', 1);
      result.events.push(`${ghost.name}: Overclock! +1 HP, +1 Seed`);
      break;
    case 75: // Flora — doubles +2 HP
      if (roll.type === 'doubles') {
        ghost.hp = Math.min(ghost.maxHp, ghost.hp + 2);
        result.events.push(`${ghost.name}: Restore! +2 HP`);
      }
      break;
  }

  // Sideline win triggers
  for (const sg of sidelineGhosts(winnerTeam)) {
    if (sg.id === 324) { // Biscuit — heal active +1
      ghost.hp = Math.min(ghost.maxHp, ghost.hp + 1);
      result.events.push(`${sg.name} (sideline): +1 HP`);
    }
    if (sg.id === 14) { // Jeffery — +3 HP on win
      ghost.hp = Math.min(ghost.maxHp + 1, ghost.hp + 3);
      result.events.push(`${sg.name} (sideline): +3 HP`);
    }
  }
}

function triggerLossAbilities(loserTeam, winnerTeam, roll, dice, result) {
  const ghost = activeGhost(loserTeam);
  const res = loserTeam.resources;

  switch (ghost.id) {
    case 29: // Sad Sal — +1 Ice Shard on loss
      addResource(res, 'iceShard', 1);
      result.events.push(`${ghost.name}: +1 Ice Shard`);
      break;
    case 329: // Clink — +1 Surge on loss too
      addResource(res, 'surge', 1);
      result.events.push(`${ghost.name}: +1 Surge`);
      break;
    case 404: // Chagrin — +1 Surge on loss
      addResource(res, 'surge', 1);
      result.events.push(`${ghost.name}: +1 Surge`);
      break;
  }

  // Thistle reflect
  if (ghost.id === 338 && result.enemyDamageDealt > 0) {
    const attacker = activeGhost(winnerTeam);
    attacker.hp = Math.max(0, attacker.hp - 1);
    if (attacker.hp <= 0) attacker.ko = true;
    result.events.push(`${ghost.name}: Barbed! 1 damage back`);
  }

  // Pudge self-damage on doubles
  if (ghost.id === 311 && roll.type === 'doubles') {
    ghost.hp = Math.max(0, ghost.hp - 1);
    if (ghost.hp <= 0) ghost.ko = true;
    result.events.push(`${ghost.name}: Belly Flop self-damage!`);
  }
}

function triggerEntryAbility(team, enemyTeam, result) {
  const ghost = activeGhost(team);
  if (ghost.entryFired) return;
  ghost.entryFired = true;

  switch (ghost.id) {
    case 320: // Bramble — 1 damage next round
      result.events.push(`${ghost.name}: Thorn Wall! 1 damage queued`);
      break;
    case 358: // Tadpole — +1 Surge
      addResource(team.resources, 'surge', 1);
      result.events.push(`${ghost.name}: Splash! +1 Surge`);
      break;
    case 56: // Chad — +2 Ice Shards
      addResource(team.resources, 'iceShard', 2);
      result.events.push(`${ghost.name}: Sploop! +2 Ice Shards`);
      break;
    case 306: // Nerina — 3 damage to enemy
      { const target = activeGhost(enemyTeam);
        target.hp = Math.max(0, target.hp - 3);
        if (target.hp <= 0) target.ko = true;
        result.events.push(`${ghost.name}: Leviathan! 3 damage to ${target.name}`);
      }
      break;
    case 34: // Grawr — 1 damage on entry
      { const target = activeGhost(enemyTeam);
        target.hp = Math.max(0, target.hp - 1);
        if (target.hp <= 0) target.ko = true;
        result.events.push(`${ghost.name}: Menace! 1 entry damage`);
      }
      break;
    case 98: // Redd — +2 dice this roll
      result.events.push(`${ghost.name}: Notorious! +2 dice this roll`);
      // Caller should check this
      break;
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
    rollDie, rollDice, classify, describeRoll, compareRolls,
    makeResources, addResource,
    makeGhost, makeTeam, activeGhost, sidelineGhosts, aliveGhosts, isTeamDefeated,
    resolveBattleRound, triggerEntryAbility,
    getEncounterCard, drawEvent, getShopItems,
    createGameState, rollMovement, getConnectedNodes, getReachableNodes
  };
}
