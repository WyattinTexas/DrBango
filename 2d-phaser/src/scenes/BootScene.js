// ═══════════════════════════════════════════════════
// BOOT SCENE — Load assets, show title screen
// ═══════════════════════════════════════════════════

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Generate placeholder sprites programmatically (replace with real art later)
    this.generatePlaceholders();
  }

  create() {
    // Title screen
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Stars
    for (let i = 0; i < 80; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.8)
      );
      this.tweens.add({
        targets: star,
        alpha: { from: star.alpha, to: 0.1 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
      });
    }

    // Title
    this.add.text(width / 2, height * 0.3, 'BATTLE OF ORIGINS', {
      fontSize: '56px',
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      color: '#ffffff',
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 8, fill: true }
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height * 0.4, 'The Spirit World Awaits', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      fontStyle: 'italic',
      color: '#aaaacc',
    }).setOrigin(0.5);

    // Version
    this.add.text(width / 2, height * 0.45, 'v1.0.0 — Phaser Edition', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#666688',
    }).setOrigin(0.5);

    // START button
    const btnBg = this.add.rectangle(width / 2, height * 0.62, 200, 56, 0xeeeeee, 0.9)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x333333);

    this.add.text(width / 2, height * 0.62, 'START', {
      fontSize: '28px',
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      color: '#1a1a1a',
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0xffffff));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0xeeeeee, 0.9));
    btnBg.on('pointerdown', () => {
      // Grant starter Spiritkin if none
      if (G.team.length === 0) {
        // Try Castle Guards, Snorton, Gary
        const starterIds = [39, 66, 91];
        for (const id of starterIds) {
          const card = ALL_CARDS.find(c => c.id === id);
          if (card) {
            G.team.push({
              id: card.id, name: card.name, hp: card.maxHp, maxHp: card.maxHp,
              ko: false, ability: card.ability, abilityDesc: card.desc,
              rarity: card.rarity, usedOncePerGame: false, entryFired: false
            });
            notify(`${card.name} joins your team!`);
            break;
          }
        }
        saveGame();
      }

      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.time.delayedCall(800, () => {
        this.scene.start('WorldScene');
      });
    });
  }

  generatePlaceholders() {
    // Player sprite (16x16 colored square)
    const playerGfx = this.make.graphics({ x: 0, y: 0, add: false });
    playerGfx.fillStyle(0x4488ff, 1);
    playerGfx.fillRect(0, 0, 16, 16);
    playerGfx.fillStyle(0x88bbff, 1);
    playerGfx.fillRect(4, 2, 8, 4); // head
    playerGfx.generateTexture('player', 16, 16);
    playerGfx.destroy();

    // NPC sprite
    const npcGfx = this.make.graphics({ x: 0, y: 0, add: false });
    npcGfx.fillStyle(0x44cc44, 1);
    npcGfx.fillRect(0, 0, 16, 16);
    npcGfx.fillStyle(0x88ff88, 1);
    npcGfx.fillRect(4, 2, 8, 4);
    npcGfx.generateTexture('npc', 16, 16);
    npcGfx.destroy();

    // Enemy sprite
    const enemyGfx = this.make.graphics({ x: 0, y: 0, add: false });
    enemyGfx.fillStyle(0xcc4444, 1);
    enemyGfx.fillRect(0, 0, 16, 16);
    enemyGfx.fillStyle(0xff8888, 1);
    enemyGfx.fillRect(4, 2, 8, 4);
    enemyGfx.generateTexture('enemy', 16, 16);
    enemyGfx.destroy();

    // Grass tile
    const grassGfx = this.make.graphics({ x: 0, y: 0, add: false });
    grassGfx.fillStyle(0x3a7d44, 1);
    grassGfx.fillRect(0, 0, 32, 32);
    grassGfx.fillStyle(0x4a8d54, 1);
    grassGfx.fillRect(4, 8, 3, 3);
    grassGfx.fillRect(20, 16, 3, 3);
    grassGfx.fillRect(12, 24, 3, 3);
    grassGfx.generateTexture('grass', 32, 32);
    grassGfx.destroy();

    // Path tile
    const pathGfx = this.make.graphics({ x: 0, y: 0, add: false });
    pathGfx.fillStyle(0x8b7355, 1);
    pathGfx.fillRect(0, 0, 32, 32);
    pathGfx.fillStyle(0x9b8365, 1);
    pathGfx.fillRect(8, 4, 4, 4);
    pathGfx.fillRect(20, 20, 4, 4);
    pathGfx.generateTexture('path', 32, 32);
    pathGfx.destroy();

    // Water tile
    const waterGfx = this.make.graphics({ x: 0, y: 0, add: false });
    waterGfx.fillStyle(0x2255aa, 1);
    waterGfx.fillRect(0, 0, 32, 32);
    waterGfx.fillStyle(0x3366bb, 1);
    waterGfx.fillRect(4, 12, 24, 2);
    waterGfx.generateTexture('water', 32, 32);
    waterGfx.destroy();

    // Tree
    const treeGfx = this.make.graphics({ x: 0, y: 0, add: false });
    treeGfx.fillStyle(0x5a3a1a, 1);
    treeGfx.fillRect(12, 20, 8, 12); // trunk
    treeGfx.fillStyle(0x2d6b2d, 1);
    treeGfx.fillCircle(16, 14, 12); // canopy
    treeGfx.generateTexture('tree', 32, 32);
    treeGfx.destroy();
  }
}
