// ═══════════════════════════════════════════════════
// WORLD SCENE — Overworld exploration with tilemaps
// ═══════════════════════════════════════════════════

class WorldScene extends Phaser.Scene {
  constructor() {
    super('WorldScene');
  }

  create() {
    const TILE = 32;
    const MAP_W = 60;
    const MAP_H = 60;

    // ── Generate world map ──
    this.map = this.generateMap(MAP_W, MAP_H);

    // ── Render tiles ──
    this.tileGroup = this.add.group();
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const tile = this.map[y][x];
        const key = tile === 0 ? 'grass' : tile === 1 ? 'path' : tile === 2 ? 'water' : 'grass';
        this.add.image(x * TILE + TILE / 2, y * TILE + TILE / 2, key);
      }
    }

    // ── Trees (decorative, collidable) ──
    this.trees = this.physics.add.staticGroup();
    for (let i = 0; i < 120; i++) {
      const tx = Phaser.Math.Between(2, MAP_W - 3);
      const ty = Phaser.Math.Between(2, MAP_H - 3);
      if (this.map[ty][tx] === 0) { // Only on grass
        this.trees.create(tx * TILE + TILE / 2, ty * TILE + TILE / 2, 'tree');
      }
    }

    // ── Player ──
    this.player = this.physics.add.sprite(G.x * TILE, G.y * TILE, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(2);
    this.player.setDepth(10);
    this.physics.add.collider(this.player, this.trees);

    // ── Camera follows player ──
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    this.cameras.main.fadeIn(800);

    // ── NPCs ──
    this.npcs = [];
    this.spawnNPC('Elder Frost', 15, 20, 0x44cc44);
    this.spawnNPC('Smith Ember', 22, 18, 0x44cc44);
    this.spawnNPC('Brawler Jax', 30, 20, 0xcc4444);

    // ── Wild enemies ──
    this.enemies = this.physics.add.group();
    this.spawnTimer = this.time.addEvent({
      delay: 3000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });
    // Spawn initial batch
    for (let i = 0; i < 5; i++) this.spawnEnemy();

    // ── Enemy collision → battle ──
    this.physics.add.overlap(this.player, this.enemies, this.onEnemyContact, null, this);

    // ── Controls ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');

    // ── HUD ──
    this.buildHUD();

    // ── World bounds ──
    this.physics.world.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
  }

  update() {
    if (G.inBattle) return;

    const speed = 120;
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed;
    else if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -speed;
    else if (this.cursors.down.isDown || this.wasd.S.isDown) vy = speed;

    // Diagonal normalization
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    this.player.setVelocity(vx, vy);

    // Update global position
    G.x = this.player.x / 32;
    G.y = this.player.y / 32;

    // NPC proximity check
    this.checkNPCProximity();

    // Update HUD
    this.updateHUD();
  }

  // ═══════ MAP GENERATION ═══════

  generateMap(w, h) {
    const map = [];
    for (let y = 0; y < h; y++) {
      map[y] = [];
      for (let x = 0; x < w; x++) {
        // Default: grass
        let tile = 0;

        // Paths (horizontal and vertical roads)
        if (y === Math.floor(h / 2) || x === Math.floor(w / 2)) tile = 1;
        if (y === Math.floor(h / 2) + 1 || x === Math.floor(w / 2) + 1) tile = 1;

        // Water (lake in corner)
        if (x > w - 10 && y > h - 10 && Math.random() < 0.6) tile = 2;

        // Border water
        if (x === 0 || y === 0 || x === w - 1 || y === h - 1) tile = 2;

        map[y][x] = tile;
      }
    }
    return map;
  }

  // ═══════ NPCS ═══════

  spawnNPC(name, tx, ty, color) {
    const TILE = 32;
    const npcGfx = this.make.graphics({ add: false });
    npcGfx.fillStyle(color, 1);
    npcGfx.fillRect(0, 0, 16, 16);
    npcGfx.fillStyle(0xffffff, 1);
    npcGfx.fillRect(4, 2, 8, 4);
    const key = `npc_${name.replace(/\s/g, '')}`;
    npcGfx.generateTexture(key, 16, 16);
    npcGfx.destroy();

    const npc = this.physics.add.staticSprite(tx * TILE, ty * TILE, key).setScale(2);

    // Name label
    const label = this.add.text(tx * TILE, ty * TILE - 20, name, {
      fontSize: '10px', fontFamily: 'monospace', color: '#ffffff',
      backgroundColor: '#00000088', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(11);

    this.npcs.push({ sprite: npc, name, label, tx, ty });
  }

  checkNPCProximity() {
    const px = this.player.x;
    const py = this.player.y;

    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(px, py, npc.sprite.x, npc.sprite.y);
      if (dist < 48) {
        npc.label.setColor('#ffdd44');

        // E to interact
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('E'))) {
          this.showDialogue(npc.name, 'Welcome, traveler. The spirit world has much to offer.');
        }
      } else {
        npc.label.setColor('#ffffff');
      }
    }
  }

  showDialogue(name, text) {
    if (this.dialogueBox) this.dialogueBox.destroy();
    if (this.dialogueText) this.dialogueText.destroy();

    const { width, height } = this.scale;
    const cam = this.cameras.main;

    this.dialogueBox = this.add.rectangle(
      cam.scrollX + width / cam.zoom / 2,
      cam.scrollY + height / cam.zoom - 40,
      width / cam.zoom - 40, 60,
      0x111122, 0.9
    ).setDepth(100).setStrokeStyle(2, 0x4444aa);

    this.dialogueText = this.add.text(
      cam.scrollX + 30,
      cam.scrollY + height / cam.zoom - 60,
      `${name}: ${text}`,
      { fontSize: '11px', fontFamily: 'monospace', color: '#ffffff', wordWrap: { width: width / cam.zoom - 60 } }
    ).setDepth(101);

    this.time.delayedCall(4000, () => {
      if (this.dialogueBox) this.dialogueBox.destroy();
      if (this.dialogueText) this.dialogueText.destroy();
    });
  }

  // ═══════ ENEMIES ═══════

  spawnEnemy() {
    if (this.enemies.getLength() >= 10) return;

    const TILE = 32;
    const px = this.player ? this.player.x : G.x * TILE;
    const py = this.player ? this.player.y : G.y * TILE;

    const angle = Math.random() * Math.PI * 2;
    const dist = Phaser.Math.Between(200, 400);
    const ex = px + Math.cos(angle) * dist;
    const ey = py + Math.sin(angle) * dist;

    // Pick a random card for the enemy
    const wildCard = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];

    const enemy = this.enemies.create(ex, ey, 'enemy').setScale(1.5);
    enemy.cardData = wildCard;
    enemy.setDepth(9);

    // Name label
    enemy.label = this.add.text(ex, ey - 16, wildCard.name, {
      fontSize: '8px', fontFamily: 'monospace', color: '#ff8888',
      backgroundColor: '#00000088', padding: { x: 2, y: 1 },
    }).setOrigin(0.5).setDepth(11);

    // Simple patrol movement
    this.tweens.add({
      targets: enemy,
      x: ex + Phaser.Math.Between(-60, 60),
      y: ey + Phaser.Math.Between(-60, 60),
      duration: Phaser.Math.Between(2000, 4000),
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        if (enemy.label) {
          enemy.label.setPosition(enemy.x, enemy.y - 16);
        }
      }
    });
  }

  onEnemyContact(player, enemy) {
    if (G.inBattle || G.team.length === 0) return;

    G.inBattle = true;
    const cardData = enemy.cardData;

    // Remove the enemy
    if (enemy.label) enemy.label.destroy();
    enemy.destroy();

    // Switch to battle scene
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.launch('BattleScene', { enemyCard: cardData });
      this.scene.pause();
    });
  }

  // ═══════ HUD ═══════

  buildHUD() {
    const cam = this.cameras.main;
    this.hudText = this.add.text(10, 10, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffffff',
      backgroundColor: '#00000088', padding: { x: 6, y: 4 },
    }).setScrollFactor(0).setDepth(200);
  }

  updateHUD() {
    if (!this.hudText) return;
    const teamName = G.team.length > 0 ? G.team[G.activeIdx]?.name || '---' : 'No Spiritkin';
    const wins = G.rep?.battlesWon || 0;
    const sideline = wins >= 5 ? 'UNLOCKED' : `${wins}/5 wins`;
    this.hudText.setText(
      `${G.name} | LV ${G.level} | ${G.coins} Gold\n` +
      `Active: ${teamName} | Sideline: ${sideline}`
    );
  }
}
