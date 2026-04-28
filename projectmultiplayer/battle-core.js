// battle-core.js — Layer 0: State, utilities, hooks. Foundation for all other modules.
// =================================================================
// BATTLE ENGINE — Extracted from testroom for multiplayer use
// Depends on: cards.js (GHOSTS, getGhost, getActiveGhosts, SHELVED_IDS)
// =================================================================

// Alias: testroom uses ghostData, cards.js uses getGhost
function ghostData(id) { return getGhost(id); }

// Safety: testroom code does getElementById().style/.classList without null checks.
// In multiplayer, some elements may not exist. We use a safe getter helper instead
// of overriding the global getElementById (which breaks other libraries).
function safeEl(id) {
  const el = document.getElementById(id);
  if (el) return el;
  // Audio elements must return null so playSfx() can handle gracefully
  if (id && (id.startsWith('sfx') || id.startsWith('bg') || id === 'triplesSfx')) return null;
  // Return a dummy div for DOM access safety (style, classList, etc.)
  if (!safeEl._dummy) {
    safeEl._dummy = document.createElement('div');
    safeEl._dummy.id = '_battle_dummy';
    safeEl._dummy.style.display = 'none';
  }
  return safeEl._dummy;
}

// ── Hook system ──────────────────────────────────────────────────
// Registered hooks fire before default behavior. resetRollButtons hooks
// can return true to consume (skip default). Replaces monkey-patching.
const _gameOverHooks = [];
const _resetRollHooks = [];
const _postResolveHooks = [];
function onGameOver(fn) { _gameOverHooks.push(fn); }
function onResetRollButtons(fn) { _resetRollHooks.push(fn); }
function onPostResolve(fn) { _postResolveHooks.push(fn); }

// Missing globals from testroom
var DEBUG = false;

// Stubs for testroom-specific functions not needed in multiplayer
function recordWin(id) {}
function recordLoss(id) {}
function recordKO(id) {}
function recordKill(id) {}
function recordMvp(id) {}
function renderPicks() {}
function renderGallery() {}
let autoPlayRunning = false;
let autoPlayQueue = 0;
let autoPlayTotal = 0;

// Battle state (from testroom)
let S = { tab:'battle', redPicks:[], bluePicks:[], battle:null };

// =================================================================
// BOSS MODE — Raid system hooks
// When window.BOSS_MODE is true, the blue team is a raid boss.
// - Blue roll button is hidden; boss auto-rolls via bossAutoRoll()
// - All damage dealt to blue team also drains the shared boss HP pool
// - Instant-kill abilities deal flat damage instead vs bosses
// - After each roll resolution, a spectator snapshot is written
// =================================================================

/**
 * Track damage dealt to the boss team for HP pool drain.
 * Called after any HP reduction on a blue-team ghost in boss mode.
 * @param {number} damage — amount of HP lost
 * @param {object} ghost — the ghost that took damage
 */
function bossDamageTracker(damage, ghost) {
  if (!window.BOSS_MODE || !window.BOSS_RAID_DATA) return;
  if (damage <= 0) return;

  // Glacier Ice Wall check: boss cannot take damage while Ice Wall lives
  const raidState = window.BOSS_RAID_DATA;
  if (raidState.bossConfig?.personality === 'glacier' && !ghost?.isMinion) {
    if (typeof isIceWallActive === 'function' && isIceWallActive(raidState.bossTeam)) {
      return; // Damage blocked by Ice Wall
    }
  }

  // Swarm Queen sacrifice check
  if (raidState.bossConfig?.personality === 'swarm' && typeof bossCheckSacrifice === 'function') {
    const sacrificeResult = bossCheckSacrifice('swarm', raidState.bossTeam, damage);
    if (sacrificeResult) {
      if (typeof showAbilityCallout === 'function') {
        showAbilityCallout('SACRIFICE!', 'var(--ghost-rare)', `${sacrificeResult.sacrificed.name} is sacrificed to negate ${damage} damage!`, 'blue');
      }
      return; // Damage negated
    }
  }

  // Permafrost (Glacier): cap base damage. Resource damage tracked separately by caller
  // This is handled at the resolve level, not here — bossDamageTracker receives final damage

  // Drain the shared HP pool
  raidState.totalDamageDealt += damage;
  if (typeof drainBossHpPool === 'function') {
    drainBossHpPool(damage);
  }
}

/**
 * Check if an instant-kill ability should be converted to flat damage vs a boss.
 * Returns the flat damage amount if in boss mode, or 0 if not (let normal logic proceed).
 */
function bossInstantKillCheck(targetGhost) {
  if (!window.BOSS_MODE) return 0;
  if (targetGhost?.isBoss) return 5; // RAID_CONFIG.INSTANT_KILL_FLAT_DAMAGE
  return 0; // Minions can be instant-killed normally
}

/**
 * Write spectator snapshot after each roll resolution in boss mode.
 */
function bossWriteSnapshot(redDice, blueDice, winner, damage) {
  if (!window.BOSS_MODE || !window.BOSS_RAID_DATA || !B) return;
  if (typeof writeBattleSnapshot !== 'function') return;

  const raidState = window.BOSS_RAID_DATA;
  const user = firebase.auth().currentUser;

  writeBattleSnapshot({
    playerName: user?.displayName || 'Raider',
    playerGhost: active(B.red),
    bossGhost: active(B.blue),
    playerSideline: B.red.ghosts.filter((g, i) => i !== B.red.activeIdx),
    bossSideline: B.blue.ghosts.filter((g, i) => i !== B.blue.activeIdx),
    lastRoll: {
      player: redDice,
      boss: blueDice,
      winner: winner,
      damage: damage
    },
    round: B.round,
    isWave: window.IS_WAVE_FIGHT || false
  });
}

// =================================================================
// MP / PVP MODE FLAGS
// =================================================================
let MP_MODE = false; // set true when loaded via multiplayer page URL params
let RAID_MODE = false; // set true when loaded via raid mode
let RAID_PARAMS = null; // { raidId, instanceId, slot, bossHp, bossMaxHp, bossName, personality }
let LIVE_PVP = false; // true when in real-time PvP mode
let PVP_SIDE = null;  // 'red' or 'blue' — which side this client controls
let PVP_GAME_ID = null;
let PVP_GAME_REF = null;
let PVP_OPPONENT_READY = false; // tracks if opponent has clicked roll
let MP_DAILY = false; // true when loaded via daily rival mode
let MP_PLAYER_NAMES = { red: 'Red', blue: 'Blue' }; // display names for game over screen
let pvpAbilityEvents = []; // v721: capture ability callouts for Blue sync
let pvpRedClickedRoll = false; // v733: async MP — AI waits for Red to click READY before rolling
let pvpBlueResolvedLocally = false; // v725: flag to prevent double-resolution on Blue
let pvpRedReady = false; // v726: Red has committed resources and is waiting for Blue

// ============================================================
// BATTLE SPEED — multiplier for all animation/delay timings
// 0=1x (normal), 1=10x, 2=25x, 3=100x
// ============================================================
const SPEED_DIVISORS = [1, 10, 25, 100];
const SPEED_LABELS = ['1x', '10x', '25x', '100x'];
function getSpeedDivisor() { return SPEED_DIVISORS[parseInt(document.getElementById('speedSlider')?.value) || 0]; }
function spd(ms) { return Math.max(1, Math.round(ms / getSpeedDivisor())); }
function updateSpeedLabel() { document.getElementById('speedLabel').textContent = 'Speed: ' + SPEED_LABELS[parseInt(document.getElementById('speedSlider')?.value) || 0]; }
function getSpecialsTimerSecs() { return parseInt(document.getElementById('specialsTimerSlider')?.value) || 5; }

// Lite Mode — reduce animations for better performance on slower devices
function toggleLiteMode(on) {
  document.body.classList.toggle('lite-mode', on);
  localStorage.setItem('tr_liteMode', on ? '1' : '0');
}

// Charlie (18) — Flick face detection: determine die value from current 3D rotation
function getFlickFaceValue(rx, ry) {
  let best = 1, bestD = Infinity;
  for (const [v, t] of Object.entries(FACE_TARGET)) {
    const drx = ((rx % 360) + 360) % 360, try_ = ((t.rx % 360) + 360) % 360;
    const dry = ((ry % 360) + 360) % 360, tyy = ((t.ry % 360) + 360) % 360;
    const dx = Math.min(Math.abs(drx - try_), 360 - Math.abs(drx - try_));
    const dy = Math.min(Math.abs(dry - tyy), 360 - Math.abs(dry - tyy));
    const d = dx + dy;
    if (d < bestD) { bestD = d; best = parseInt(v); }
  }
  return best;
}

function initMatchStats() {
  B.matchStats = {
    red: {}, blue: {},
    finishingBlowGhostId: null,
    finishingBlowTeam: null,
    snapshot: null,
    // Per-round side-band: resource amounts that have been explicitly credited
    // to a specific ghost (via creditGhost). Subtracted from the delta in
    // creditRoundDelta so we don't double-count them to the active fighter.
    explicit: { red: { ls:0, ms:0, ice:0, fire:0, seed:0 }, blue: { ls:0, ms:0, ice:0, fire:0, seed:0 } }
  };
}

function ensureMatchStat(team, ghostId) {
  if (!B.matchStats[team][ghostId]) {
    B.matchStats[team][ghostId] = {
      rollsWon: 0,
      kosScored: 0,
      damageDealt: 0,
      ls: 0, ms: 0, ice: 0, fire: 0, seed: 0
    };
  }
  return B.matchStats[team][ghostId];
}

// Explicit per-ghost credit. Call this inside any sideline onShow callback
// that grants a resource, so the sideline ghost (not the active fighter)
// gets the MVP points. The amount is added to B.matchStats.explicit so
// creditRoundDelta's snapshot-diff doesn't also credit the active fighter
// for the same grant.
function creditGhost(team, ghostId, resource, amount) {
  if (!B || !B.matchStats || !ghostId || amount <= 0) return;
  if (team !== 'red' && team !== 'blue') return;
  if (!['ls','ms','ice','fire','seed'].includes(resource)) return;
  const stat = ensureMatchStat(team, ghostId);
  stat[resource] = (stat[resource] || 0) + amount;
  B.matchStats.explicit[team][resource] = (B.matchStats.explicit[team][resource] || 0) + amount;
}

function snapshotRound() {
  if (!B || !B.matchStats) return;
  // Reset the explicit side-band — credits accumulate per-round only
  B.matchStats.explicit = { red: { ls:0, ms:0, ice:0, fire:0, seed:0 }, blue: { ls:0, ms:0, ice:0, fire:0, seed:0 } };
  B.matchStats.snapshot = {
    red: {
      res: { ...B.red.resources },
      ghosts: B.red.ghosts.map(g => ({ id: g.id, hp: g.hp, ko: g.ko }))
    },
    blue: {
      res: { ...B.blue.resources },
      ghosts: B.blue.ghosts.map(g => ({ id: g.id, hp: g.hp, ko: g.ko }))
    }
  };
}

function creditRoundDelta(roundWinner) {
  if (!B || !B.matchStats || !B.matchStats.snapshot) return;
  const snap = B.matchStats.snapshot;
  ['red', 'blue'].forEach(team => {
    const t = B[team];
    const activeF = active(t);
    if (!activeF) return;
    const stat = ensureMatchStat(team, activeF.id);
    // Resource deltas — credit the currently-active ghost for the non-explicit leftover.
    // Sideline generators (Gary, Farmer Jeff, Granny, etc.) call creditGhost() directly
    // inside their onShow callbacks, populating B.matchStats.explicit[team]. We subtract
    // those amounts here so the active fighter only gets credit for resources they earned.
    const rNow = t.resources;
    const rBefore = snap[team].res;
    const explicit = B.matchStats.explicit[team] || { ls:0, ms:0, ice:0, fire:0, seed:0 };
    const clampPos = (a, b, sub) => Math.max(0, (a || 0) - (b || 0) - (sub || 0));
    stat.ls   += clampPos(rNow.luckyStone, rBefore.luckyStone, explicit.ls);
    stat.ms   += clampPos(rNow.moonstone, rBefore.moonstone, explicit.ms);
    stat.ice  += clampPos(rNow.ice, rBefore.ice, explicit.ice);
    stat.fire += clampPos(rNow.fire, rBefore.fire, explicit.fire);
    stat.seed += clampPos(rNow.healingSeed, rBefore.healingSeed, explicit.seed);
    // Damage dealt / KOs scored: enemy ghosts took damage credited to this active
    const enemyTeam = team === 'red' ? 'blue' : 'red';
    const enemyBefore = snap[enemyTeam].ghosts;
    const enemyNow = B[enemyTeam].ghosts;
    enemyNow.forEach((g, i) => {
      const before = enemyBefore[i];
      if (!before) return;
      const dmg = Math.max(0, (before.hp || 0) - (g.hp || 0));
      if (dmg > 0) stat.damageDealt += dmg;
      if (!before.ko && g.ko) {
        stat.kosScored++;
        // Track the LAST KO seen so the final-round KO gets the finishing-blow bonus
        B.matchStats.finishingBlowGhostId = activeF.id;
        B.matchStats.finishingBlowTeam = team;
      }
    });
  });
  // Roll won: credit the winning team's active
  if (roundWinner === 'red' || roundWinner === 'blue') {
    const wActive = active(B[roundWinner]);
    if (wActive) {
      const wStat = ensureMatchStat(roundWinner, wActive.id);
      wStat.rollsWon++;
    }
  }
}

function computeMvpScore(stat, isSurvivor, isFinishingBlow) {
  const ko = (stat.kosScored || 0) * 5;
  const rw = (stat.rollsWon || 0) * 1;
  const dmg = (stat.damageDealt || 0) * 0.5;
  const res = (stat.ls || 0) * 1 + (stat.ms || 0) * 3 + (stat.fire || 0) * 3 + (stat.ice || 0) * 1 + (stat.seed || 0) * 1;
  const surv = isSurvivor ? 3 : 0;
  const fb = isFinishingBlow ? 5 : 0;
  return ko + rw + dmg + res + surv + fb;
}

function pickMatchMvp(winnerTeamName) {
  if (!B || !B.matchStats || (winnerTeamName !== 'red' && winnerTeamName !== 'blue')) return null;
  const team = B[winnerTeamName];
  const stats = B.matchStats[winnerTeamName] || {};
  const fbId = B.matchStats.finishingBlowGhostId;
  const fbTeam = B.matchStats.finishingBlowTeam;
  let best = null;
  team.ghosts.forEach(g => {
    const s = stats[g.id] || { rollsWon:0, kosScored:0, damageDealt:0, ls:0, ms:0, ice:0, fire:0, seed:0 };
    const survived = !g.ko;
    const finishing = (g.id === fbId && fbTeam === winnerTeamName);
    const score = computeMvpScore(s, survived, finishing);
    const candidate = { id: g.id, name: g.name, score, kos: s.kosScored || 0, dmg: s.damageDealt || 0 };
    if (!best) { best = candidate; return; }
    if (candidate.score > best.score) { best = candidate; return; }
    if (candidate.score === best.score) {
      if (candidate.kos > best.kos) { best = candidate; return; }
      if (candidate.kos === best.kos) {
        if (candidate.dmg > best.dmg) { best = candidate; return; }
        if (candidate.dmg === best.dmg && candidate.name.localeCompare(best.name) < 0) { best = candidate; return; }
      }
    }
  });
  return best;
}

const RARITY_ORDER = {common:0, uncommon:1, rare:2, 'ghost-rare':3, legendary:4};
const SET_ORDER = ['Set 1','Dark Castle','Frost Valley','Volcanic Isles','Rolling Hills'];
function getSetClass(s) {
  if (s === 'Rolling Hills') return 'set-rolling';
  if (s === 'Volcanic Isles') return 'set-volcanic';
  if (s === 'Set 1') return 'set-set1';
  if (s === 'Dark Castle') return 'set-darkcastle';
  if (s === 'Frost Valley') return 'set-frostvalley';
  return '';
}
function getSetColor(s) {
  if (s === 'Rolling Hills') return 'var(--uncommon)';
  if (s === 'Volcanic Isles') return 'var(--magma)';
  if (s === 'Set 1') return '#c084fc';
  if (s === 'Dark Castle') return '#f87171';
  if (s === 'Frost Valley') return '#67e8f9';
  return 'var(--text2)';
}
function sortBySetThenRarity(a, b) {
  const sa = SET_ORDER.indexOf(a.set);
  const sb = SET_ORDER.indexOf(b.set);
  if (sa !== sb) return sa - sb;
  return (RARITY_ORDER[a.rarity]||0) - (RARITY_ORDER[b.rarity]||0);
}
function sortByRarity(a, b) { return (RARITY_ORDER[a.rarity]||0) - (RARITY_ORDER[b.rarity]||0); }

// --- Curated Team Compositions (Wyatt Directive 2026-04-11) ---
// Each team is [starter, sideline1, sideline2]. Order matters:
//   starter  = the fighter who battles first
//   sideline1 = primary support / second fighter
//   sideline2 = backup / synergy piece
const CURATED_TEAMS = [
  // ===================== HIGH TIER (15 teams) =====================

  // #1  Valkin's Grand Conquest — Valkin KOs for full resource suite, Bigsby evolves into Doom on Moonstone, Willow +1 die after losses
  [432, 424, 435],
  // #2  Blue Fire Burn Chain — Lucy wins for Sacred Fires, Rascals entry 3 Burn, Mable spends Burn to remove dice + gain Sacred Fire
  [108, 437, 446],
  // #3  Ice Blade Forge — Zain forges Ice Blade from wins, Sylvia free Ice Shards, Finn forges Flame Blade from seeds+fire
  [206, 313, 431],
  // #4  Resurrection Engine — Miyoshi Bonzai sacrifices HP for +5 dice, Bo revives on KO + 3 Fireflies, Lucas buffs revived ghost +3HP/+1die
  [454, 109, 433],
  // #5  Dice Destroyer — Pip triples remove opponent dice permanently, Haywire triples gain permanent die, Willow +1 die after losses
  [418, 78, 435],
  // #6  Resource Avalanche — Chester wins for seeds/fireflies, Twyla spends Lucky Stones for +dice/+seeds, Zippa converts seeds to stones
  [426, 417, 423],
  // #7  Mountain King Doubles — TMK 2X doubles damage, Tabitha +2 doubles damage from sideline, Admiral +2 even doubles from sideline
  [110, 95, 71],
  // #8  Shade Pressure — Shade deals 1 before every roll, Shade's Shadow deals 1 to <4HP from sideline, Princess Shade +1 to pre-roll damage
  [111, 205, 436],
  // #9  Nerina Blitz — Nerina entry 3 damage, Nicholas 2 damage on enemy entry from sideline, Grawr entry 1 damage
  [306, 51, 34],
  // #10 Timber Lockdown — Timber forces discard or -1 die, Dylan blocks enemy before-roll effects + gains Burn, Piper negates effects/-1 die
  [210, 301, 107],
  // #11 Humar Burn Assault — Humar wins for 2 pre-roll damage + Burn, Mable spends Burn to remove dice, Princess Shade +1 pre-roll damage
  [336, 446, 436],
  // #12 Red Hunter Aggro — Red Hunter +3 damage if enemy holds specials, Gordok steals 2 specials on win, Dark Jeff +1 all damage from sideline
  [345, 430, 74],
  // #13 Sacred Fire Engine — Lucy wins for Sacred Fire, Fed & Hayden Sacred Fires don't discard, Lucy's Shadow doubles Lucy's fire damage
  [108, 406, 439],
  // #14 Toby All-In — Toby declares final roll for KO, Guardian Fairy takes hits from sideline, Hector singles beat doubles
  [97, 99, 96],
  // #15 Frost Blade Master — Skylar Ice Shards deal +2, Pal Al wins for 4 Ice Shards, Spockles wins for 2 Ice Shards
  [104, 431, 81],

  // ===================== MID TIER (25 teams) =====================

  // #16 Dark Castle Control — Captain James triples for 2 Sacred Fires, Garrick -1 damage on loss + Sacred Fire on KO, Champ immune to specials
  [443, 427, 438],
  // #17 Rolling Hills Harvest — Farmer Jeff 6s gain Healing Seeds, Aunt Susan spends seeds for +2 damage/heal, Boopies seeds → stones
  [314, 309, 419],
  // #18 Frost Valley Blizzard — Romy predicts die for +3, Marcus 3+ damage taken → 4 extra dice, Pale Nimbus +2 if roll <7 from sideline
  [114, 57, 88],
  // #19 Tank & Spank — Bubble Boys 9HP wall, Bilbo +2 singles damage from sideline, Dark Jeff +1 all damage from sideline
  [44, 80, 74],
  // #20 Volcanic Disruption — Knight Terror enemy loses 2HP on ability trigger, Knight Light gains +1 die on enemy ability, Smudge names number to negate
  [401, 402, 403],
  // #21 Doubles Delight — Doc +5 doubles damage, Tabitha +2 doubles from sideline, Flora +2HP on doubles
  [42, 95, 75],
  // #22 Defensive Wall — Stone Cold 7HP + 3X double-1s, Puff -1 from enemy doubles/triples, Guard Thomas immune to singles below 6HP
  [73, 5, 41],
  // #23 Healing Seed Engine — Young Cap seeds give +1die/+1shard/+1surge, Chow spends seed for +2 dice, Kaplan gains seeds on enemy doubles
  [429, 414, 308],
  // #24 Frost Valley Thieves — Dallas steals 1 die for 2 rolls on entry, Suspicious Jeff steals 1 die on ally win, Outlaw doubles remove 1 die
  [60, 61, 43],
  // #25 Moonstone Madness — Benjamin free Moonstone use, Natalia even doubles → 2 Moonstones, Harvey wins → Moonstones per 5 rolled
  [203, 327, 448],
  // #26 Lucky Stone Payoff — Hank 4s gain Lucky Stones, Twyla spends stones for +dice/+seeds, Selene doubles → 2 seeds or 3 stones
  [305, 417, 207],
  // #27 Burn & Punish — Sable odd rolls gain Sacred Fire, The Ember Force 1 damage before rolling, Rook immune to fire + Surge damage bonus
  [304, 413, 416],
  // #28 Entry Damage Blitz — Grawr 1 damage on entry, Jenkins rolls 4 dice damage on entry, Nicholas 2 damage to enemy on entry
  [34, 94, 51],
  // #29 Simon's Fire Factory — Simon gains Sacred Fire when taking damage, Marcus 3+ damage → 4 extra dice, Mallow removes fire for 3HP from sideline
  [24, 57, 89],
  // #30 Surge Builder — Dart wins for 2 Surge, Boris spends Surge for +2HP, Chagrin loses for 1 Surge
  [209, 343, 404],
  // #31 Chow Kitchen — Chow spends seeds for +2 dice, Farmer Jeff 6s → seeds, Maximo gains seed + stone each round
  [414, 314, 302],
  // #32 Gordok Pirate — Gordok steals 2 specials on win + Moonstone, Nick & Knack steals 1 special + 3HP, Sandwiches mirrors enemy specials
  [430, 409, 33],
  // #33 Frost Valley Snipers — Night Master doubles+win → destroy <4HP sideline ghost, Pelter +2 doubles damage, Bogey reflects damage once
  [103, 86, 53],
  // #34 Redd Entrance — Redd entry +2 dice, Hugo enemy loses die on hit, Floop enemy loses die on doubles
  [98, 52, 20],
  // #35 Volcanic Isles Core — Rook immune to fire + Surge bonus, Sable odd rolls Sacred Fire, The Ember Force 1 pre-roll damage
  [416, 413, 304],
  // #36 HP Swap Gambit — Eloise spends Ice Shard to swap HP, Chad entry 2 Ice Shards, Sad Sal loses → Ice Shard
  [85, 56, 29],
  // #37 Wandering Sue Sniper — Sue destroys 12+ HP enemies, Villager +1HP on wins from sideline, Shoo +2HP when <4HP from sideline
  [84, 11, 13],
  // #38 Midrange Doubles — Prince Balatron counter die on survive loss, Kairan doubles → +1 die, Laura numeric order → +3 damage
  [113, 68, 79],
  // #39 Castle Guards Threes — Castle Guards 3s multiply damage by 2, Zach +3 doubles damage for Guard Thomas (but Guards benefit from 3s), Lou +1dmg/+1HP for Grawr from sideline
  [39, 87, 88],
  // #40 Jasper Glass Cannon — Jasper wins → bonus die damage + self-damage, Bilbo +2 singles from sideline, Dark Jeff +1 all damage
  [428, 80, 74],

  // ===================== FUN / MEME TIER (10 teams) =====================

  // #41 Glass Cannon Squad — all tiny HP, maximum chaos
  [8, 205, 410],   // Buttons 1HP triple-6 dream + Shade's Shadow <4HP poke + Mirror Matt reflects doubles
  // #42 Mirror Theft — Mirror Matt reflects doubles, Nick & Knack steals specials, Outlaw removes dice on doubles
  [410, 409, 43],
  // #43 Tie Party — Jimmy ties for 5 stones + firefly, Goobs ties for 2 fireflies each, Ancient One +3HP on ties from sideline
  [352, 444, 22],
  // #44 Tommy Salami Chain-6s — Tommy 6s chain extra dice, Rascals entry 3 Burn for fuel, Lars entry resources
  [30, 437, 420],
  // #45 All Legendary Showdown — Bo revives, Shade pre-roll damage, Selene doubles for resources
  [109, 111, 305],
  // #46 Buttons & Needle Dream — Buttons triple-6 for +15, Needle gives Buttons +1 die from sideline, Tabitha +2 doubles from sideline
  [8, 21, 95],
  // #47 Dupy Coin Flip — Dupy ties instant KO, Hermit entry HP per defeated ghosts, Little Boo turns enemy triples into 1-2-3
  [12, 47, 9],
  // #48 Fang Tag Team — Fang Outside swaps on win, Fang Undercover swaps on damage, Doug swaps once + gains die
  [6, 7, 63],
  // #49 Chaos Reroll — Jackson removes HP to reroll dice, Sonya changes die to 2, Dealer numeric order negates damage
  [50, 69, 37],
  // #50 Wanderer's Gambit — Wanderer 8HP reveals hidden cards, Cameron gains dice from enemy specials + damage can't be negated, Masked Hero punishes before-roll effects
  [4, 25, 55],

  // ===================== NEW WAVE (25 teams) =====================

  // #51 Gary's Ice Factory — Skylar boosts Ice Shards to +2, Gary generates 2 shards per 1 rolled from sideline, Artemis wins for 3 shards
  [104, 92, 307],
  // #52 Hermit Late Game — Powder dies first (gives 3 Ice Shards on death), Granny harvests KO resources from sideline, Hermit enters last with +2HP per KO'd ghost
  [23, 310, 47],
  // #53 Splinter Poison — Splinter wins once to start permanent pre-roll chip, Princess Shade amplifies every pre-roll hit +1, Shoo heals active from sideline
  [101, 436, 13],
  // #54 Fredrick Lockdown — Fredrick caps enemy to 3 dice, Antoinette mirrors enemy dice count for parity, Floop punishes enemy doubles with -1 die
  [27, 82, 20],
  // #55 Munch Cleanup Crew — Greg bullies with 2x damage when higher HP, Munch gains 4HP on KO to sustain, Calvin & Anna swap on KO for flexibility
  [49, 66, 91],
  // #56 Chip Even Doubles — Chip deals +3 on even doubles, Admiral boosts even doubles +2 from sideline, Natalia generates 2 Moonstones on even doubles
  [16, 71, 327],
  // #57 Ancient Librarian Math — Librarian stacks +1 damage per 2 rolled by anyone, Sonya forces a die to 2 every roll, Dark Jeff +1 all damage from sideline
  [3, 69, 74],
  // #58 Katrina Sustain — Katrina gains 1HP when lower HP, Villager heals +1HP on wins from sideline, Opa gains +1HP on every win or tie
  [70, 11, 48],
  // #59 Triple Threat — Larry deals 3x on triples, Haywire gains permanent die + damage on triples, Pip removes enemy die on triples permanently
  [35, 78, 418],
  // #60 Cave Ambush — Cave Dweller deals 3x on first-roll win, Dallas steals a die for 2 rolls on entry, Bandit Pete +3 damage when anyone rolls only 2 dice
  [46, 60, 93],
  // #61 Bill & Bob Berserker — Bill & Bob deal 2x below 4HP, Cyboo gives +1 die when active below 3HP from sideline, Shade's Shadow chips <4HP enemies from sideline
  [36, 100, 205],
  // #62 Wim All-Odds — Wim deals +5 when all dice are odd, Laura adds +3 on numeric order wins, Pale Nimbus adds +2 when roll sum <7 from sideline
  [65, 79, 88],
  // #63 Snorton Six Stacker — Tommy chains 6s for extra dice, Snorton deals +5 when 2+ sixes hit, Harvey generates Moonstones per 5 rolled
  [30, 67, 448],
  // #64 Kodako Counter — Kodako negates damage and deals 4 on 1-2-3, Little Boo turns enemy triples into 1-2-3, Dealer negates damage on numeric order
  [1, 9, 37],
  // #65 Professor Moonstone — Natalia generates Moonstones on even doubles, Professor Hawking rolls +2 dice while holding Moonstone, Benjamin uses Moonstones for free
  [327, 447, 203],
  // #66 Dark Fang Disruption — Dark Fang forces enemy swap pre-roll, Raditz forces enemy swap on entry, Winston forces enemy swap on doubles
  [202, 62, 15],
  // #67 Bo's Proper Setup — Munch fights first (gains 4HP on KO), Granny harvests resources on ally KO from sideline, Bo enters last to resurrect fallen ally
  [66, 310, 109],
  // #68 Gus Swap Punish — Gus forces enemy swap instead of damage, Nicholas deals 2 damage to every entering ghost from sideline, Lars enters with Surge + Stone + Burn
  [31, 51, 420],
  // #69 Charlie Double-2s — Charlie deals 7 on double 2s, Ancient Librarian stacks +1 per 2 rolled, Sonya forces a die to 2 every roll
  [18, 3, 69],
  // #70 Sparky One-Bomb — Sparky deals +3 per 1 rolled, Gary generates 2 Ice Shards per 1 from sideline, Sad Sal gains Ice Shard on every loss
  [64, 92, 29],
  // #71 King Jay Reflect — King Jay reflects all damage on lose+sum=7, Marcus gains 4 extra dice on 3+ damage taken, Puff reduces enemy doubles/triples -1
  [106, 57, 5],
  // #72 Patrick Stone Wall — Patrick deals 3 and negates on enemy singles (no dice rolled), Cornelius shuts down all enemy sideline effects, Villager heals +1HP on wins from sideline
  [10, 45, 11],
  // #73 Dream Cat Die Ladder — Dream Cat gains +2 dice on mutual doubles, Kairan gains +1 die on any doubles, TMK deals 2x damage on doubles
  [28, 68, 110],
  // #74 Nyx Seed Harvest — Zippa deals +1 per Healing Seed held, Harrison spends seeds for extra dice, Nyx & Bessie generate 4 seeds on KO from sideline
  [423, 315, 415],
  // #75 Carpenter's Workshop — Dart fights first generating Surge, Carpenter enters and uses Surge to evolve up the chain, Bilbo adds +2 singles from sideline
  [209, 449, 80],
  // #76 Dark Pressure — Ryder Toll forces opponent choice (1 dmg or Sacred Fire), Tyler doubles Sacred Fire damage, Princess Shade +1 on all pre-roll chip damage
  [456, 105, 436],

  // ===================== NEW WAVE 2 (20 teams) =====================

  // #77 Ridley Sniper Squad — Ridley +1 singles/+2 doubles, Dark Jeff +1 all from bench, Bilbo +2 singles from bench. Singles deal +4.
  [462, 74, 80],
  // #78 Zork Burn Engine — Ronan generates Ice+Burn on doubles, Zork Smolders Burn into dice, Lars enters with Surge+Stone+Burn fuel
  [461, 463, 420],
  // #79 Maisie's Lucky Fives — Maisie 1s→5s, Eli generates Lucky Stones every round, Twyla spends stones for +dice/+seeds
  [458, 459, 417],
  // #80 Sophia's Dark Court — Gom wins doubles for Sacred Fire, Sophia comes in for Mask, Willow +1 die on loss from bench
  [440, 457, 435],
  // #81 Explorer Jeff's Hoard — Lars enters with 3 specials instantly, Explorer Jeff gets +1 die/+1 dmg at 3+ specials, Chester maintains diversity
  [420, 455, 426],
  // #82 Kaylee Dice Thief — Kaylee swaps 2s for opponent's best, Suspicious Jeff steals die on wins from bench, Dallas steals die on entry
  [453, 61, 60],
  // #83 Castle Gardener Forge — Gardener converts seeds→fire, Farmer Jeff generates seeds on 6s from bench, Finn forges Flame Blade
  [442, 314, 204],
  // #84 Troubling Haters Brawl — Haters grow +2 HP on 4+ damage, Shoo +2 HP when <4 from bench, Jeffery +3 HP on wins from bench
  [83, 13, 14],
  // #85 Tyson Tag Team — Tyson hops to dodge matchups, Redd enters with +2 dice power spike, Grawr deals 1 on entry
  [365, 98, 34],
  // #86 Michael's Shield Wall — Michael makes bench immune to Burn, Boopies generates stones on seed spends, Kaplan generates seeds on enemy doubles
  [445, 419, 308],
  // #87 City Cyboo Anti-Doubles — Cyboo no doubles damage, Puff -1 from doubles/triples, Little Boo turns enemy triples into 1-2-3
  [77, 5, 9],
  // #88 Wendy Firefly Factory — Wendy doubles for Fireflies, Goobs bench +5 HP + ties give Fireflies, Jimmy ties for 3 stones + Firefly
  [441, 444, 352],
  // #89 Jeanie's Insurance — Stone Cold 7HP tank + 3X double-1s, Jeanie forces enemy reroll once, Guardian Fairy takes hits from bench
  [73, 90, 99],
  // #90 Ronan's Dual Engine — Ronan generates Ice+Burn on doubles, Spockles wins for 2 Ice Shards, Ashley wins for Sacred Fire
  [461, 81, 58],
  // #91 Ripagoo Transform Chain — Carpenter evolves on Surge, Ripagoo gains 2 Burn per transform from bench, Dart generates Surge on wins
  [449, 452, 209],
  // #92 Slicer's Patience — Miyoshi Bonzais for 9 dice (quads possible), Slicer bench destroys sideline ghost on quads, Haywire gains permanent dice on triples
  [454, 460, 78],
  // #93 Eli's Slow Build — Eli generates Lucky Stones every round, Dark Jeff +1 all damage from bench, Twyla spends stone mountain for +dice/+seeds
  [459, 74, 417],
  // #94 Maisie Power — Maisie 1s→5s boosted rolls, Tabitha +2 doubles from bench, Dark Jeff +1 all from bench
  [458, 95, 74],
  // #95 Gom Gom to Lucy — Gom generates Sacred Fire on doubles, Lucy's Shadow waits on bench, Lucy enters and Shadow doubles her fire gains + damage
  [440, 439, 108],
  // #96 Ridley Snowball — Ridley +1 singles/+2 doubles, Villager heals +1 on wins from bench, Suspicious Jeff steals die on wins from bench
  [462, 11, 61],
];

// --- Quick-fill helpers (Wyatt Directive 2026-04-11) ---
// Picks a curated 3-ghost composition. excludeIds prevents overlap with the other team.
function getCuratedTeam(excludeIds = []) {
  const validIds = new Set(GHOSTS.filter(g => !SHELVED_IDS.has(g.id)).map(g => g.id));
  const available = CURATED_TEAMS.filter(team =>
    team.every(id => validIds.has(id)) &&
    !team.some(id => excludeIds.includes(id))
  );
  if (available.length === 0) return getRandomTeamFallback(excludeIds);
  return [...available[Math.floor(Math.random() * available.length)]];
}

// Fallback: purely random team when no curated team fits (e.g. extreme overlap)
function getRandomTeamFallback(excludeIds = []) {
  const pool = GHOSTS.filter(g => !SHELVED_IDS.has(g.id) && !excludeIds.includes(g.id));
  const picks = [];
  let hasLegendary = false;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (const g of shuffled) {
    if (picks.length >= 3) break;
    if (g.rarity === 'legendary') {
      if (hasLegendary) continue;
      hasLegendary = true;
    }
    picks.push(g.id);
  }
  return picks;
}

function pickRandomTeam(team) {
  const other = S[team === 'red' ? 'bluePicks' : 'redPicks'];
  S[`${team}Picks`] = getCuratedTeam(other);
  renderPicks();
}

// Fills both teams at once with two non-overlapping curated teams.
function pickRandomBoth() {
  S.redPicks = getCuratedTeam([]);
  S.bluePicks = getCuratedTeam(S.redPicks);
  renderPicks();
}

// ============================================================
// BATTLE ENGINE
// ============================================================
// ghostData(id) defined in header — uses getGhost() from cards.js


function makeTeam(ids, resolver) {
  resolver = resolver || ghostData;
  return {
    ghosts: ids.map(id => {
      const g = resolver(id);
      return { id, name:g.name, hp:g.maxHp, maxHp:g.maxHp, ko:false, ability:g.ability, abilityDesc:g.abilityDesc, rarity:g.rarity,
        hankFirstRoll:false, maximoFirstRoll:false, usedMagicTouch:false };
    }),
    activeIdx: 0,
    resources: { moonstone:0, ice:0, fire:0, surge:0, healingSeed:0, luckyStone:0, firefly:0 },
    moonstoneSickness: 0,       // Mode A: permanent stacking counter
    moonstoneSicknessCount: 0,  // Mode B: escalating counter
    moonstoneSicknessPending: 0 // Mode B & C: damage to apply next roll
  };
}

function active(t) { return t.ghosts[t.activeIdx]; }
function opp(team) { return team===B.red ? B.blue : B.red; }
function teamName(team) { return team===B.red ? 'Red' : 'Blue'; }

let B = null; // battle state
let prevResources = { red: {}, blue: {} }; // for resource-gained flash

const LOG_MAX = 50; // [shadow] perf: cap battle log to prevent unbounded array growth
function log(html) { B.log.unshift(html); if (B.log.length > LOG_MAX) B.log.length = LOG_MAX; }

function classify(dice) {
  if (!dice||!dice.length) return {type:'none',value:0,damage:0};
  if (dice.length === 1) return {type:'singles',value:dice[0],damage:1};
  const c = {};
  dice.forEach(d=>c[d]=(c[d]||0)+1);
  const mx = Math.max(...Object.values(c));
  const vals = Object.entries(c).filter(([,v])=>v===mx).map(([k])=>+k);
  const mv = Math.max(...vals);
  if (mx>=6) return {type:mx+'-of-a-kind',value:mv,damage:mx};
  if (mx>=5) return {type:'penta',value:mv,damage:5};
  if (mx>=4) return {type:'quads',value:mv,damage:4};
  if (mx>=3) return {type:'triples',value:mv,damage:3};
  if (mx>=2) return {type:'doubles',value:mv,damage:2};
  return {type:'singles',value:Math.max(...dice),damage:1};
}

function describeRoll(r) {
  if (r.type.endsWith('-of-a-kind')) return `${r.damage} ${r.value}'s!!!`;
  if (r.type==='penta') return `five ${r.value}'s!`;
  if (r.type==='quads') return `four ${r.value}'s!`;
  if (r.type==='triples') return `three ${r.value}'s`;
  if (r.type==='doubles') return `two ${r.value}'s`;
  return `${r.value} high`;
}

function isTripleOrBetter(type) { return ['triples','quads','penta'].includes(type) || type.endsWith('-of-a-kind'); }

// Dark Fang (202) — Pressure: returns true if the OPPONENT has Dark Fang active, blocking healing for this team
function deathHowlBlocksHealing(teamName) {
  if (!B) return false;
  const oppTeamName = teamName === 'red' ? 'blue' : 'red';
  const oppActive = active(B[oppTeamName]);
  return oppActive && oppActive.id === 202 && !oppActive.ko;
}
// Masked Hero (55) — Underdog: immune to before-roll damage
function maskedHeroImmune(ghost) {
  return ghost && ghost.id === 55 && !ghost.ko;
}
// Dark Fang — guarded heal: adds HP only if not blocked. Returns true if heal went through.
function guardedHeal(ghost, amount, teamName) {
  if (deathHowlBlocksHealing(teamName)) {
    log(`<span class="log-ability">Dark Fang</span> — Pressure! ${ghost.name}'s healing blocked!`);
    return false;
  }
  ghost.hp += amount;
  return true;
}

function typeLabel(type) {
  if (type.endsWith('-of-a-kind')) return type.toUpperCase() + '!!!';
  if (type==='penta') return 'PENTA!!';
  if (type==='quads') return 'QUADS!';
  if (type==='triples') return 'TRIPLES!';
  if (type==='doubles') return 'DOUBLES!';
  return '';
}

// Helper: check if a team has a ghost with given id on sideline (alive)
function hasSideline(team, id) {
  const teamName = B && team === B.red ? 'red' : 'blue';
  const disabled = B && B.tysonDisabled ? B.tysonDisabled[teamName] : [];
  return team.ghosts.some((g,i) => i !== team.activeIdx && !g.ko && g.id === id && !disabled.includes(i));
}
function getSidelineGhost(team, id) {
  const teamName = B && team === B.red ? 'red' : 'blue';
  const disabled = B && B.tysonDisabled ? B.tysonDisabled[teamName] : [];
  return team.ghosts.find((g,i) => i !== team.activeIdx && !g.ko && g.id === id && !disabled.includes(i));
}
function hasAlive(team, id) {
  return team.ghosts.some(g => !g.ko && g.id === id);
}
function isStraight(dice) {
  if (!dice || dice.length < 2) return false;
  const sorted = [...new Set(dice)].sort((a, b) => a - b);
  if (sorted.length !== dice.length) return false; // no repeats
  return sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1);
}

// Pop a sideline card to foreground when its ability triggers
function popSidelineCard(teamObj, ghostId) {
  const teamName = teamObj === B.red ? 'red' : 'blue';
  const sl = teamObj.ghosts.filter((g,i) => i !== teamObj.activeIdx);
  const slIdx = sl.findIndex(g => g.id === ghostId);
  if (slIdx < 0) return;
  const elId = slIdx === 0 ? `${teamName}-sl-left` : `${teamName}-sl-right`;
  const el = document.getElementById(elId);
  if (!el) return;
  el.classList.add('sideline-pop');
  setTimeout(() => el.classList.remove('sideline-pop'), spd(1300));
}

// Helper: check if opponent has Dylan (301) on sideline to negate before-roll effects
function dylanNegates(enemyTeam) {
  // Dylan (301) sideline OR Piper (107) active — both negate enemy before-rolling effects
  const enemyActive = active(enemyTeam);
  return hasSideline(enemyTeam, 301) || (enemyActive && enemyActive.id === 107 && !enemyActive.ko);
}

// Helper: count occurrences of a value in dice array
function countVal(dice, val) { return dice.filter(d => d === val).length; }

// Helper: check if dice contain doubles (at least two of same value)
function hasDoubles(dice) {
  const c = {};
  dice.forEach(d => c[d] = (c[d]||0)+1);
  return Object.values(c).some(v => v >= 2);
}

// Helper: check if dice have even doubles (2s, 4s, or 6s)
function hasEvenDoubles(dice) {
  const c = {};
  dice.forEach(d => c[d] = (c[d]||0)+1);
  return (c[2] >= 2) || (c[4] >= 2) || (c[6] >= 2);
}

// ── BattleCore export ─────────────────────────────────────────────
window.BattleCore = {
  getState: () => B,
  setState: (state) => { B = state; S.battle = B; },
  getS: () => S,
  active, opp, teamName, hasSideline, getSidelineGhost, hasAlive,
  spd, classify, describeRoll, isTripleOrBetter, typeLabel,
  log, countVal, hasDoubles, hasEvenDoubles, isStraight,
  makeTeam, ghostData, guardedHeal, deathHowlBlocksHealing, maskedHeroImmune,
  onGameOver, onResetRollButtons, onPostResolve,
  initMatchStats, snapshotRound, creditRoundDelta, creditGhost, pickMatchMvp,
  safeEl, dylanNegates
};
