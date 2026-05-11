// ═══════════════════════════════════════════════════
// GLOBALS SHIM — Functions that core modules depend on
// These were originally in index.html of the 2D version.
// Provides stubs and real implementations for the Phaser port.
// ═══════════════════════════════════════════════════

// ── Day seed for daily resets ──
function getDaySeed() { return Math.floor(Date.now() / 86400000); }

// ── Skill system ──
function hasSkill(skillId) {
  return G.unlockedSkills && G.unlockedSkills.includes(skillId);
}

// ── Zone detection (based on tile coordinates) ──
function getCurrentZone(px, py) {
  const x = Math.floor(px);
  const y = Math.floor(py);
  if (x > 88 && y < 42) return 'dark_castle';
  if (x > 60 && y < 43) return 'volcanic_isles';
  if (y >= 45) return 'rolling_hills';
  return 'frost_valley';
}

// ── Notification system (Phaser scene handles display) ──
let _notifyCallback = null;
function notify(text) {
  console.log('[NOTIFY]', text);
  if (_notifyCallback) _notifyCallback(text);
}
function notifyDiscovery(text) { notify(text); }
function notifyAmbient(text) { notify(text); }

// ── SFX stubs (replace with Phaser audio later) ──
const SFX = {
  click: () => {},
  encounterStart: () => {},
  hit: () => {},
  miss: () => {},
  ko: () => {},
  heal: () => {},
  craftSuccess: () => {},
  craftFail: () => {},
  levelUp: () => {},
  notify: () => {},
  collect: () => {},
  equip: () => {},
  sell: () => {},
  buy: () => {},
  gatherStart: () => {},
  gatherComplete: () => {},
  diceRoll: () => {},
  commBlip: () => {},
};

// ── Music stubs ──
const Music = {
  current: null,
  play: (track) => { Music.current = track; console.log('[Music] Playing:', track); },
  stop: () => { Music.current = null; },
  playJingle: (name) => { console.log('[Music] Jingle:', name); },
};

// ── Battle overlay stubs (Phaser BattleScene handles rendering) ──
function showBattleOverlay() {}
function hideBattleOverlay() {}
function renderBattle() {}
function showWildAppearedSplash(name) { console.log(`[Splash] Wild ${name} appeared!`); }
let battleFledThisSession = false;

// ── Accessory effects ──
function applyAccessoryBattleEffects() {
  if (!B || !G.equipped) return;
  // Ember Stone: +1 Sacred Fire at battle start
  if (G.equipped.accessory?.name?.includes('Ember')) {
    B.resources.sacredFire = (B.resources.sacredFire || 0) + 1;
    B.player.resources.sacredFire = (B.player.resources.sacredFire || 0) + 1;
  }
}

// ── Title tracking ──
function checkAndNotifyTitles() {
  if (!G.rep || !G.titles) return;
  if (G.rep.battlesWon >= 10 && !G.titles.includes('Veteran')) {
    G.titles.push('Veteran');
    notify('Title earned: Veteran!');
  }
  if (G.rep.battlesWon >= 50 && !G.titles.includes('Champion')) {
    G.titles.push('Champion');
    notify('Title earned: Champion!');
  }
}

// ── Spirit Comms (dialogue display) ──
function showComm(name, text, opts) {
  console.log(`[Comms] ${name}: ${text}`);
  if (_notifyCallback) _notifyCallback(`${name}: ${text}`);
}

// ── Save/Load (localStorage for now, Firebase later) ──
function saveGame() {
  try {
    const saveData = { playerData: G, timestamp: Date.now(), version: '1.0.0-phaser' };
    localStorage.setItem('boo_phaser_save', JSON.stringify(saveData));
    console.log('[Save] Game saved');
  } catch (e) {
    console.warn('[Save] Failed:', e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem('boo_phaser_save');
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.playerData) {
      Object.assign(G, data.playerData);
      console.log('[Load] Game loaded');
      return true;
    }
  } catch (e) {
    console.warn('[Load] Failed:', e);
  }
  return false;
}

// ── Extended G defaults (ensure all fields exist) ──
function ensurePlayerDefaults() {
  if (!G.team) G.team = [];
  if (!G.rep) G.rep = { battlesWon: 0, craftsCompleted: 0, itemsSold: 0, essencesCollected: 0, raresFound: 0 };
  if (!G.titles) G.titles = [];
  if (!G.essences) G.essences = [];
  if (!G.gear) G.gear = [];
  if (!G.equipped) G.equipped = { weapon: null, head: null, accessory: null };
  if (!G.mastery) G.mastery = { weapon: { xp: 0 }, armor: { xp: 0 }, accessory: { xp: 0 } };
  if (!G.quests) G.quests = { active: [], completed: [] };
  if (!G.loreCollected) G.loreCollected = [];
  if (!G.hostileNPCsDefeated) G.hostileNPCsDefeated = {};
  if (!G.unlockedSkills) G.unlockedSkills = [];
  if (G.level === undefined) G.level = 1;
  if (G.xp === undefined) G.xp = 0;
  if (G.coins === undefined) G.coins = 100;
  if (G.activeIdx === undefined) G.activeIdx = 0;
}
