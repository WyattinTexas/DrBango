// ═══════════════════════════════════════════════════
// WORLD SCENE — Full overworld with sprites, NPCs, enemies
// ═══════════════════════════════════════════════════

class WorldScene extends Phaser.Scene {
  constructor() { super('WorldScene'); }

  create() {
    const T = 32;
    const MW = 80, MH = 60;

    this.cameras.main.fadeIn(600);
    this.cameras.main.setBackgroundColor('#3a7d44');

    // ── Generate world with colored rectangles (clean, no tileset issues) ──
    const grassColors = [0x3a7d44, 0x3e8248, 0x368040, 0x42864c];
    const pathColor = 0x8b7355;
    const waterColor = 0x2255aa;

    for (let y = 0; y < MH; y++) {
      for (let x = 0; x < MW; x++) {
        let color;
        if (x === 0 || y === 0 || x === MW-1 || y === MH-1) {
          color = waterColor;
        } else if (y === 30 || y === 31 || x === 40 || x === 41) {
          color = pathColor;
        } else {
          color = grassColors[(x * 7 + y * 13) % grassColors.length];
        }
        this.add.rectangle(x * T + T/2, y * T + T/2, T, T, color);
      }
    }

    // ── Trees using tileset spritesheet (16x16 tiles from nature tileset) ──
    // Nature tileset: 384x336, 16px tiles = 24 cols x 21 rows
    // Tree tiles are around index 48-72 area (row 2-3)
    this.trees = this.physics.add.staticGroup();
    for (let i = 0; i < 80; i++) {
      const tx = Phaser.Math.Between(3, MW - 4) * T;
      const ty = Phaser.Math.Between(3, MH - 4) * T;
      const tileX = Math.floor(tx / T), tileY = Math.floor(ty / T);
      if (tileY === 30 || tileY === 31 || tileX === 40 || tileX === 41) continue;
      // Use nature tileset frame for trees (frame 48 = a tree-like tile)
      const tree = this.trees.create(tx, ty, 'tiles_nature', Phaser.Math.Between(48, 55));
      tree.setScale(2).refreshBody();
    }

    // ── Player ──
    this.player = this.physics.add.sprite(G.x * T, G.y * T, 'player', 0);
    this.player.setScale(2);
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.trees);

    // ── Camera ──
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.8);
    this.cameras.main.setBounds(0, 0, MW * T, MH * T);

    // ── NPCs ──
    this.npcSprites = [];
    this.spawnNPC('Elder Frost', 17 * T, 19 * T, 'npc_elder', 0x44cc44);
    this.spawnNPC('Smith Ember', 15 * T, 25 * T, 'npc_knight', 0xe07020);
    this.spawnNPC('Keeper Zara', 22 * T, 21 * T, 'npc_hunter', 0xc0a040);

    // Hostile NPCs
    this.spawnNPC('Brawler Jax', 30 * T, 20 * T, 'enemy_sprite', 0xcc4444, true);
    this.spawnNPC('Ice Queen Vera', 40 * T, 15 * T, 'npc_knight', 0x6688cc, true);

    // ── Enemies ──
    this.enemies = this.physics.add.group();
    for (let i = 0; i < 8; i++) this.spawnEnemy();
    this.time.addEvent({ delay: 4000, callback: this.spawnEnemy, callbackScope: this, loop: true });
    this.physics.add.overlap(this.player, this.enemies, this.onEnemyContact, null, this);

    // ── Controls ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.eKey = this.input.keyboard.addKey('E');

    // ── HUD ──
    this.hudText = this.add.text(10, 10, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffffff',
      backgroundColor: '#000000aa', padding: { x: 8, y: 6 },
    }).setScrollFactor(0).setDepth(200);

    // ── Dialogue box ──
    this.dialogueContainer = this.add.container(0, 0).setDepth(300).setScrollFactor(0);
    this.dialogueBg = this.add.rectangle(640, 660, 1100, 80, 0x111128, 0.92)
      .setStrokeStyle(2, 0x4444aa);
    this.dialogueNameText = this.add.text(120, 630, '', {
      fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#ffdd44',
    });
    this.dialogueBodyText = this.add.text(120, 650, '', {
      fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ccccee',
      wordWrap: { width: 900 },
    });
    this.dialogueContainer.add([this.dialogueBg, this.dialogueNameText, this.dialogueBodyText]);
    this.dialogueContainer.setVisible(false);

    // ── World bounds ──
    this.physics.world.setBounds(0, 0, MW * T, MH * T);

    // ── Region text ──
    this.regionText = this.add.text(640, 40, '', {
      fontSize: '16px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#00000066', padding: { x: 12, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    // Notify callback for globals
    _notifyCallback = (text) => this.showNotification(text);
  }

  update() {
    if (G.inBattle) return;

    const speed = 140;
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) { vx = -speed; this._lastDir = 'left'; }
    else if (this.cursors.right.isDown || this.wasd.D.isDown) { vx = speed; this._lastDir = 'right'; }
    if (this.cursors.up.isDown || this.wasd.W.isDown) { vy = -speed; this._lastDir = 'up'; }
    else if (this.cursors.down.isDown || this.wasd.S.isDown) { vy = speed; this._lastDir = 'down'; }

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    this.player.setVelocity(vx, vy);

    // Animate walk or show idle frame
    if (vx !== 0 || vy !== 0) {
      this.player.play(`walk_${this._lastDir}`, true);
    } else {
      this.player.stop();
      // Idle: show frame 0 of last direction (col index: down=0, up=1, left=2, right=3)
      const idleFrame = { down: 0, up: 1, left: 2, right: 3 }[this._lastDir || 'down'];
      this.player.setFrame(idleFrame);
    }

    G.x = this.player.x / 32;
    G.y = this.player.y / 32;

    // Region detection
    const region = getCurrentZone(G.x, G.y);
    const regionNames = { frost_valley: 'Frost Valley', rolling_hills: 'Rolling Hills', volcanic_isles: 'Volcanic Isles', dark_castle: 'Dark Castle' };
    this.regionText.setText(regionNames[region] || '');

    // NPC proximity
    this.checkNPCProximity();
    this.updateHUD();
  }

  // ═══════ NPCs ═══════

  spawnNPC(name, x, y, spriteKey, tint, hostile = false) {
    const npc = this.physics.add.staticSprite(x, y, spriteKey, 0).setScale(2);
    if (tint) npc.setTint(tint);

    const label = this.add.text(x, y - 40, name, {
      fontSize: '10px', fontFamily: 'monospace', color: hostile ? '#ff8888' : '#88ff88',
      backgroundColor: '#00000088', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(11);

    // Exclamation mark for hostile
    let marker = null;
    if (hostile) {
      marker = this.add.text(x, y - 52, '!', {
        fontSize: '16px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#ff4444',
      }).setOrigin(0.5).setDepth(11);
      this.tweens.add({ targets: marker, y: y - 58, duration: 800, yoyo: true, repeat: -1 });
    }

    this.npcSprites.push({ sprite: npc, name, label, marker, hostile, x, y });
  }

  checkNPCProximity() {
    for (const npc of this.npcSprites) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);

      if (dist < 60) {
        npc.label.setColor(npc.hostile ? '#ffaa44' : '#ffdd44');

        if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
          if (npc.hostile) {
            this.triggerTrainerBattle(npc);
          } else {
            this.showDialogue(npc.name, this.getNPCDialogue(npc.name));
          }
        }
      } else {
        npc.label.setColor(npc.hostile ? '#ff8888' : '#88ff88');
      }
    }
  }

  getNPCDialogue(name) {
    const lines = {
      'Elder Frost': ['The spirits remember what men forget.', 'Frost Valley was the first land the Spiritkin claimed.'],
      'Smith Ember': ['Iron sings when you heat it right.', 'Bring me ore and I will make you something worth carrying.'],
      'Keeper Zara': ['Every Spiritkin has a story.', 'The battle is won before the dice are rolled.'],
    };
    const pool = lines[name] || ['...'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  showDialogue(name, text) {
    this.dialogueNameText.setText(name);
    this.dialogueBodyText.setText(text);
    this.dialogueContainer.setVisible(true);
    if (this._dialogueTimer) this._dialogueTimer.remove();
    this._dialogueTimer = this.time.delayedCall(4000, () => this.dialogueContainer.setVisible(false));
  }

  showNotification(text) {
    const notif = this.add.text(640, 80, text, {
      fontSize: '16px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#000000aa', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(300);
    this.tweens.add({ targets: notif, alpha: 0, y: 40, duration: 2000, delay: 1500, onComplete: () => notif.destroy() });
  }

  // ═══════ Enemies ═══════

  spawnEnemy() {
    if (!this.enemies || this.enemies.getLength() >= 12) return;
    const px = this.player ? this.player.x : 800;
    const py = this.player ? this.player.y : 800;
    const angle = Math.random() * Math.PI * 2;
    const dist = Phaser.Math.Between(250, 500);
    const ex = px + Math.cos(angle) * dist;
    const ey = py + Math.sin(angle) * dist;

    const wildCard = ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];
    const enemy = this.enemies.create(ex, ey, 'enemy_sprite', 0).setScale(1.8);
    enemy.cardData = wildCard;
    enemy.setDepth(9);
    enemy.setTint(wildCard.rarity === 'rare' ? 0xaa55ff : wildCard.rarity === 'uncommon' ? 0x5599ff : 0xffffff);

    enemy.label = this.add.text(ex, ey - 28, wildCard.name, {
      fontSize: '9px', fontFamily: 'monospace', color: '#ffaaaa',
      backgroundColor: '#00000088', padding: { x: 2, y: 1 },
    }).setOrigin(0.5).setDepth(11);

    this.tweens.add({
      targets: enemy, x: ex + Phaser.Math.Between(-40, 40), y: ey + Phaser.Math.Between(-40, 40),
      duration: Phaser.Math.Between(2000, 4000), yoyo: true, repeat: -1,
      onUpdate: () => { if (enemy.label) enemy.label.setPosition(enemy.x, enemy.y - 28); }
    });
  }

  onEnemyContact(player, enemy) {
    if (G.inBattle || G.team.length === 0) return;
    const cardData = enemy.cardData;
    if (enemy.label) enemy.label.destroy();
    enemy.destroy();

    // Set up battle using real engine
    G.inBattle = true;
    const playerGhosts = buildPlayerBattleTeam();
    const enemyGhosts = [{ id: cardData.id, name: cardData.name, hp: cardData.maxHp, maxHp: cardData.maxHp,
      ko: false, ability: cardData.ability, abilityDesc: cardData.desc, rarity: cardData.rarity,
      usedOncePerGame: false, entryFired: false }];

    B = {
      round: 1, player: { ghosts: playerGhosts, activeIdx: 0, resources: {} },
      enemy: { ghosts: enemyGhosts, activeIdx: 0, resources: {} },
      enemyCard: cardData, phase: 'ready', log: [], playerDice: [], enemyDice: [],
      nextRoundMods: { playerExtraDice: 0, enemyExtraDice: 0, playerMaxDice: 99, enemyMaxDice: 99 },
    };

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.launch('BattleScene', { enemyCard: cardData });
      this.scene.pause();
    });
  }

  triggerTrainerBattle(npc) {
    if (G.inBattle || G.team.length === 0) return;
    const trainerData = HOSTILE_NPCS.find(h => h.name === npc.name);
    if (!trainerData) return;
    if (isHostileNPCDefeatedToday(trainerData.id)) {
      this.showDialogue(npc.name, trainerData.dialogue?.[0] || 'Come back tomorrow.');
      return;
    }

    // Show challenge dialogue then battle
    this.showDialogue(npc.name, trainerData.challenge);
    this.time.delayedCall(2000, () => {
      if (typeof triggerHostileNPCBattle === 'function') {
        triggerHostileNPCBattle(trainerData);
      }
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.launch('BattleScene', { enemyCard: getCard(trainerData.team[0]), trainerName: npc.name });
        this.scene.pause();
      });
    });
  }

  // ═══════ HUD ═══════

  updateHUD() {
    const teamName = G.team.length > 0 ? G.team[G.activeIdx]?.name || '---' : 'No Spiritkin';
    const hp = G.team[G.activeIdx]?.hp || 0;
    const maxHp = G.team[G.activeIdx]?.maxHp || 0;
    const wins = G.rep?.battlesWon || 0;
    const sideline = wins >= 5 ? 'UNLOCKED' : `${wins}/5`;
    this.hudText.setText(
      `${G.name} | LV ${G.level} | ${G.coins} Gold\n` +
      `${teamName} HP ${hp}/${maxHp} | Sideline: ${sideline}`
    );
  }
}
