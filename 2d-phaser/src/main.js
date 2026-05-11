// ═══════════════════════════════════════════════════
// BATTLE OF ORIGINS — Phaser 4 Entry Point
// ═══════════════════════════════════════════════════

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, WorldScene, BattleScene],
};

// Global player state (mirrors the 2D version's G object)
const G = {
  name: 'Adventurer',
  level: 1,
  xp: 0,
  coins: 100,
  x: 25, y: 25,  // tile position
  team: [],
  activeIdx: 0,
  inBattle: false,
  rep: { battlesWon: 0, craftsCompleted: 0, itemsSold: 0, essencesCollected: 0, raresFound: 0 },
  hostileNPCsDefeated: {},
  // Resources
  iceShards: 0, sacredFire: 0, healingSeeds: 0, luckyStones: 0,
  surge: 0, moonstone: 0, firefly: 0,
};

const game = new Phaser.Game(config);
