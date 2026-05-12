// ═══════════════════════════════════════════════════
// BOOT SCENE — Load real assets, title screen
// ═══════════════════════════════════════════════════

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    // ── Character sprites ──
    this.load.spritesheet('player', 'assets/characters/Boy_walk.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('npc_elder', 'assets/characters/NPC_ElderFrost.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('npc_knight', 'assets/characters/NPC_Knight_idle.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('npc_hunter', 'assets/characters/NPC_Hunter_idle.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('npc_child', 'assets/characters/NPC_Child.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('enemy_sprite', 'assets/characters/FighterRed_walk.png', { frameWidth: 64, frameHeight: 64 });

    // ── Tilesets ──
    this.load.image('tiles_nature', 'assets/tiles/TilesetNature.png');
    this.load.image('tiles_water', 'assets/tiles/TilesetWater.png');
    this.load.image('tiles_field', 'assets/tiles/TilesetField.png');
    this.load.image('tiles_house', 'assets/tiles/TilesetHouse.png');
    this.load.image('tiles_desert', 'assets/tiles/TilesetDesert.png');

    // ── Card art (load the first batch for battles) ──
    for (const card of ALL_CARDS.slice(0, 40)) {
      if (card.art) {
        this.load.image(`card_${card.id}`, card.art);
      }
    }

    // ── Audio ──
    this.load.audio('music_hub', 'assets/audio/hub.ogg');
    this.load.audio('music_battle', 'assets/audio/battle.ogg');
    this.load.audio('music_frost', 'assets/audio/frost_valley.ogg');

    // Loading bar
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width/2, height/2 + 40, 300, 16, 0x333333);
    const fill = this.add.rectangle(width/2 - 148, height/2 + 40, 4, 12, 0x4488ff).setOrigin(0, 0.5);
    this.add.text(width/2, height/2, 'Loading...', { fontSize: '16px', color: '#888' }).setOrigin(0.5);
    this.load.on('progress', (p) => { fill.width = 296 * p; });
  }

  create() {
    const { width, height } = this.scale;

    // ── Player walk animations ──
    this.anims.create({ key: 'walk_down', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'walk_up', frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'walk_left', frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }), frameRate: 8, repeat: -1 });
    this.anims.create({ key: 'walk_right', frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }), frameRate: 8, repeat: -1 });

    // ── Title screen ──
    this.cameras.main.setBackgroundColor('#1a1a2e');

    for (let i = 0; i < 80; i++) {
      const star = this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 2), 0xffffff, Phaser.Math.FloatBetween(0.2, 0.8));
      this.tweens.add({ targets: star, alpha: 0.1, duration: Phaser.Math.Between(1000, 3000), yoyo: true, repeat: -1 });
    }

    // Player character preview
    const preview = this.add.sprite(width / 2, height * 0.58, 'player', 0).setScale(3);

    this.add.text(width / 2, height * 0.2, 'BATTLE OF ORIGINS', {
      fontSize: '52px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#ffffff',
      shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 8, fill: true }
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.3, 'The Spirit World Awaits', {
      fontSize: '18px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#aaaacc',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.34, 'v1.0.0 — Phaser Edition', {
      fontSize: '11px', fontFamily: 'monospace', color: '#555577',
    }).setOrigin(0.5);

    const btnBg = this.add.rectangle(width / 2, height * 0.75, 180, 50, 0xeeeeee, 0.9)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x333333);
    this.add.text(width / 2, height * 0.75, 'START', {
      fontSize: '26px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#1a1a1a',
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0xffffff));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0xeeeeee, 0.9));
    btnBg.on('pointerdown', () => {
      if (G.team.length === 0) {
        const starterIds = [39, 66, 91];
        for (const id of starterIds) {
          const card = ALL_CARDS.find(c => c.id === id);
          if (card) {
            G.team.push({ id: card.id, name: card.name, hp: card.maxHp, maxHp: card.maxHp,
              ko: false, ability: card.ability, abilityDesc: card.desc, rarity: card.rarity,
              usedOncePerGame: false, entryFired: false });
            notify(`${card.name} joins your team!`);
            break;
          }
        }
        saveGame();
      }
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(600, () => this.scene.start('WorldScene'));
    });
  }
}
