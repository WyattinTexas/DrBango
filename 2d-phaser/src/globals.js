// ═══════════════════════════════════════════════════
// GLOBALS SHIM — Functions that core modules depend on
// These were originally in index.html of the 2D version.
// Provides stubs and real implementations for the Phaser port.
// ═══════════════════════════════════════════════════

// ── Safe DOM stubs (core modules reference 274 DOM elements that don't exist in Phaser) ──
const _realGetById = document.getElementById.bind(document);
document.getElementById = function(id) {
  const el = _realGetById(id);
  if (el) return el;
  // Return a safe stub element so .style, .textContent, .innerHTML don't crash
  return {
    style: new Proxy({}, { set: () => true, get: () => '' }),
    textContent: '', innerHTML: '', innerText: '',
    classList: { add: ()=>{}, remove: ()=>{}, toggle: ()=>{}, contains: ()=>false },
    setAttribute: ()=>{}, getAttribute: ()=>null, removeAttribute: ()=>{},
    addEventListener: ()=>{}, removeEventListener: ()=>{},
    appendChild: ()=>{}, removeChild: ()=>{}, remove: ()=>{},
    querySelectorAll: ()=>[], querySelector: ()=>null,
    children: [], childNodes: [], parentElement: null,
    getBoundingClientRect: ()=>({top:0,left:0,width:0,height:0,right:0,bottom:0}),
    offsetWidth: 0, offsetHeight: 0,
    dataset: {},
    checked: false, value: '',
    _stub: true
  };
};

// Also stub querySelectorAll for bulk DOM queries
const _realQSA = document.querySelectorAll.bind(document);
document.querySelectorAll = function(sel) {
  try { return _realQSA(sel); } catch(e) { return []; }
};

// ── Constants from index.html ──
const TILE = 32;
const WORLD_W = 100;
const WORLD_H = 80;
const HUB = { x: 15, y: 20 };
const HUB_MEADOW = { x: 28, y: 52 };
const HUB_VOLCANIC = { x: 68, y: 28 };
const HUB_DARK = { x: 92, y: 15 };

// World map stub (gathering.js references worldMap[y][x] for tile types)
// Tile types: 0=grass, 1=path, 2=water, 6=encounter zone
const worldMap = [];
for (let y = 0; y < WORLD_H; y++) {
  worldMap[y] = [];
  for (let x = 0; x < WORLD_W; x++) {
    // Default everything to encounter zone (6) so gathering works
    worldMap[y][x] = 6;
    // Water borders
    if (x === 0 || y === 0 || x === WORLD_W - 1 || y === WORLD_H - 1) worldMap[y][x] = 2;
  }
}

// Canvas stub (some modules reference a canvas context for rendering)
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// NOTE: spiritWisps, roamingEnemies, etc. are declared in their own
// core modules (gathering.js, world-events.js). Do NOT redeclare here.

// ── Day seed for daily resets ──
function getDaySeed() { return Math.floor(Date.now() / 86400000); }

// ── Time of day cycle (10-minute loop) ──
function getTimeOfDay() {
  const cyclePos = (Date.now() / 1000 / 60) % 10;
  let phase, progress, nightFactor;
  if (cyclePos < 2) { phase = 'dawn'; progress = cyclePos / 2; nightFactor = 1 - progress; }
  else if (cyclePos < 5) { phase = 'day'; progress = (cyclePos - 2) / 3; nightFactor = 0; }
  else if (cyclePos < 7) { phase = 'dusk'; progress = (cyclePos - 5) / 2; nightFactor = progress; }
  else { phase = 'night'; progress = (cyclePos - 7) / 3; nightFactor = 1; }
  return { phase, progress, nightFactor };
}

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
var battleFledThisSession = false;
var uid = 'local_' + Math.random().toString(36).substr(2, 9);
var ENCOUNTER_ZONES = []; // stub — gathering.js needs this

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
