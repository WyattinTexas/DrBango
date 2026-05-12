// ═══════════════════════════════════════════════════
// WORLD SCENE — Full overworld with sprites, NPCs, enemies
// ═══════════════════════════════════════════════════

class WorldScene extends Phaser.Scene {
  constructor() { super('WorldScene'); }

  create() {
    // Safety: clear stale battle state from previous session
    G.inBattle = false;
    B = null;

    const T = 32;
    const MW = WORLD_W, MH = WORLD_H; // 110x85 from world-gen.js

    this.cameras.main.fadeIn(600);
    this.cameras.main.setBackgroundColor('#d8e8f0');

    // ── Render the REAL world map from generateWorld() ──
    // Impassable tiles for collision
    this.collisionTiles = this.physics.add.staticGroup();

    // Convert hex color string to Phaser number
    function hexToNum(hex) { return parseInt(hex.replace('#', ''), 16); }

    for (let y = 0; y < MH; y++) {
      for (let x = 0; x < MW; x++) {
        const tileType = worldMap[y] ? worldMap[y][x] : 0;
        const colorHex = TILE_COLORS[tileType] || '#d8e8f0';
        const color = hexToNum(colorHex);
        this.add.rectangle(x * T + T/2, y * T + T/2, T, T, color);

        // Collision for mountains, walls, water, trees, buildings
        const impassable = [1, 3, 7, 13, 15, 16, 21, 23, 25];
        if (impassable.includes(tileType)) {
          const block = this.collisionTiles.create(x * T + T/2, y * T + T/2, null);
          block.setDisplaySize(T, T).setVisible(false).refreshBody();
        }
      }
    }

    // ── Player ──
    this.player = this.physics.add.sprite(G.x * T, G.y * T, 'player', 0);
    this.player.setScale(2);
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.collisionTiles);

    // ── Camera ──
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.5); // 1.5 instead of 1.8 — HUD stays readable
    this.cameras.main.setBounds(0, 0, MW * T, MH * T);

    // ── UI Camera (unzoomed, for HUD elements) ──
    this.uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.uiCam.setScroll(0, 0);
    // Main camera ignores UI elements (we'll tag them)

    // ── NPCs (positions from npcs.js NPCS + HOSTILE_NPCS data) ──
    this.npcSprites = [];
    // Friendly — Frost Valley hub
    this.spawnNPC('Elder Frost', (HUB.x + 2) * T, (HUB.y - 1) * T, 'npc_elder', 0xdaa520);
    this.spawnNPC('Smith Ember', HUB.x * T, (HUB.y + 5) * T, 'npc_knight', 0xe07020);
    this.spawnNPC('Keeper Zara', (HUB.x + 7) * T, (HUB.y + 1) * T, 'npc_hunter', 0xc0a040);
    // Friendly — Rolling Hills
    this.spawnNPC('Farmer Bea', 24 * T, 58 * T, 'npc_elder', 0x6a8a4a);
    this.spawnNPC('Herbalist Sage', 28 * T, 60 * T, 'npc_knight', 0x4a8a6a);

    // Hostile NPCs (from HOSTILE_NPCS positions)
    this.spawnNPC('Brawler Jax', 30 * T, 20 * T, 'enemy_sprite', 0xcc4444, true);
    this.spawnNPC('Ice Queen Vera', 40 * T, 15 * T, 'npc_knight', 0x6688cc, true);
    this.spawnNPC('Bandit Marcus', 28 * T, 48 * T, 'enemy_sprite', 0xa88844, true);

    // ── Enemies ──
    this.enemies = this.physics.add.group();
    for (let i = 0; i < 8; i++) this.spawnEnemy();
    this._spawnTimer = this.time.addEvent({ delay: 4000, callback: this.spawnEnemy, callbackScope: this, loop: true });
    this.physics.add.overlap(this.player, this.enemies, this.onEnemyContact, null, this);

    // ── Spirit Wisps (glowing collectible orbs) ──
    this.wisps = this.physics.add.group();
    for (let i = 0; i < 5; i++) this.spawnWisp();
    this.time.addEvent({ delay: 6000, callback: this.spawnWisp, callbackScope: this, loop: true });
    this.physics.add.overlap(this.player, this.wisps, this.onWispCollect, null, this);

    // ── Controls ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.eKey = this.input.keyboard.addKey('E');
    this.cKey = this.input.keyboard.addKey('C');
    this.tKey = this.input.keyboard.addKey('T');
    this.iKey = this.input.keyboard.addKey('I');

    // ── HUD ──
    this.buildHUD();

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

    // ── Region labels on the map ──
    const regionLabels = [
      { text: 'FROST VALLEY', x: 25, y: 5, color: '#88bbff' },
      { text: 'Polaris Hub', x: HUB.x + 3, y: HUB.y - 3, color: '#daa520' },
      { text: 'ROLLING HILLS', x: 30, y: 47, color: '#88cc44' },
      { text: 'Meadowbrook', x: 26, y: 56, color: '#6a8a4a' },
      { text: 'VOLCANIC ISLES', x: 72, y: 7, color: '#ff8844' },
      { text: 'DARK CASTLE', x: 98, y: 5, color: '#aa66cc' },
    ];
    for (const rl of regionLabels) {
      this.add.text(rl.x * T, rl.y * T, rl.text, {
        fontSize: '10px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: rl.color,
        backgroundColor: '#00000066', padding: { x: 4, y: 2 },
      }).setDepth(5);
    }

    // ── Building labels in Polaris ──
    const buildings = [
      { name: 'Trading Post', x: HUB.x + 1, y: HUB.y + 1 },
      { name: 'Arena', x: HUB.x + 5, y: HUB.y + 1 },
      { name: 'Workshop', x: HUB.x + 1, y: HUB.y + 3 },
      { name: 'Inn', x: HUB.x + 5, y: HUB.y + 3 },
      { name: 'Cantina', x: HUB.x + 3, y: HUB.y + 5 },
    ];
    for (const b of buildings) {
      // Building marker (slightly brighter square on top of tile)
      this.add.rectangle(b.x * T + T/2, b.y * T + T/2, T - 2, T - 2, 0x8a7a5a)
        .setStrokeStyle(1, 0xaaa888).setDepth(3);
      this.add.text(b.x * T + T/2, b.y * T - 6, b.name, {
        fontSize: '7px', fontFamily: 'monospace', color: '#eecc88',
        backgroundColor: '#00000066', padding: { x: 2, y: 1 },
      }).setOrigin(0.5).setDepth(6);
    }

    // ── Encounter zone labels ──
    for (const zone of ENCOUNTER_ZONES) {
      this.add.text((zone.x + zone.w/2) * T, zone.y * T - 8, zone.name, {
        fontSize: '8px', fontFamily: 'monospace', color: '#aa88dd',
        backgroundColor: '#00000044', padding: { x: 2, y: 1 },
      }).setOrigin(0.5).setDepth(5);
    }

    // ── Menu buttons bar (top-center) ──
    const menuY = 8;
    const btnW = 80, btnH = 28, btnGap = 6;
    const buttons = [
      { label: 'TEAM (T)', key: 'T', action: () => this.showTeamLineup(), color: 0x445588 },
      { label: 'ITEMS (I)', key: 'I', action: () => this.showInventory(), color: 0x885544 },
      { label: 'CRAFT (C)', key: 'C', action: () => { this.scene.launch('CraftScene'); this.scene.pause(); }, color: 0x665533 },
      { label: 'MAP (M)', key: null, action: () => this.showNotification('Minimap is bottom-right!'), color: 0x448844 },
    ];
    const startX = this.scale.width / 2 - (buttons.length * (btnW + btnGap)) / 2;
    buttons.forEach((btn, i) => {
      const x = startX + i * (btnW + btnGap) + btnW / 2;
      const bg = this.add.rectangle(x, menuY + btnH/2, btnW, btnH, btn.color, 0.85)
        .setScrollFactor(0).setDepth(200).setInteractive({ useHandCursor: true })
        .setStrokeStyle(1, 0x666666);
      this.add.text(x, menuY + btnH/2, btn.label, {
        fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
      bg.on('pointerdown', btn.action);
      bg.on('pointerover', () => bg.setAlpha(1));
      bg.on('pointerout', () => bg.setAlpha(0.85));
    });

    // ── Controls hint ──
    this.add.text(10, this.scale.height - 20, 'WASD: Move | E: Interact | I: Items | T: Team', {
      fontSize: '10px', fontFamily: 'monospace', color: '#666666',
    }).setScrollFactor(0).setDepth(200);

    // ── Region text ──
    this.regionText = this.add.text(640, 40, '', {
      fontSize: '16px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#ffffff',
      backgroundColor: '#00000066', padding: { x: 12, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    // Notify callback for globals
    _notifyCallback = (text) => this.showNotification(text);

    // Panel manager for inventory/team overlays
    this.panels = new PanelManager(this);

    // Star Fox comm overlay
    this.comm = new CommOverlay(this);

    // ── Music ──
    try {
      this._currentMusic = 'frost';
      if (this.sound.get('music_hub')) {
        this.sound.play('music_hub', { loop: true, volume: 0.3 });
      }
    } catch(e) { console.log('[Audio] Music skipped:', e.message); }
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

    // Day/night cycle
    this.updateDayNight();

    // Region detection
    const region = getCurrentRegion(G.x, G.y);
    const regionNames = { frost_valley: 'Frost Valley', rolling_hills: 'Rolling Hills', volcanic_isles: 'Volcanic Isles', dark_castle: 'Dark Castle' };
    this.regionText.setText(regionNames[region] || '');

    // NPC proximity
    this.checkNPCProximity();

    // Panel hotkeys
    if (Phaser.Input.Keyboard.JustDown(this.cKey)) {
      this.scene.launch('CraftScene');
      this.scene.pause();
    }
    if (Phaser.Input.Keyboard.JustDown(this.tKey)) {
      this.showTeamLineup();
    }
    if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
      this.showInventory();
    }

    // Dynamic encounter rate — faster spawns inside encounter zones
    const zoneIdx = getCurrentZone();
    if (zoneIdx >= 0 && !this._inZone) {
      this._inZone = true;
      if (this._spawnTimer) this._spawnTimer.remove();
      this._spawnTimer = this.time.addEvent({ delay: 2500, callback: this.spawnEnemy, callbackScope: this, loop: true });
    } else if (zoneIdx < 0 && this._inZone) {
      this._inZone = false;
      if (this._spawnTimer) this._spawnTimer.remove();
      this._spawnTimer = this.time.addEvent({ delay: 4000, callback: this.spawnEnemy, callbackScope: this, loop: true });
    }

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
    const ePressed = Phaser.Input.Keyboard.JustDown(this.eKey);

    for (const npc of this.npcSprites) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);

      if (dist < 80) {
        npc.label.setColor(npc.hostile ? '#ffaa44' : '#ffdd44');
        // Show interaction hint
        if (!npc._hint) {
          npc._hint = this.add.text(npc.x, npc.y + 24, '[E]', {
            fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
            backgroundColor: '#000000aa', padding: { x: 3, y: 1 },
          }).setOrigin(0.5).setDepth(12);
        }

        if (ePressed) {
          if (this.comm && this.comm.isActive) {
            this.comm.dismiss();
          } else if (npc.hostile) {
            this.triggerTrainerBattle(npc);
          } else {
            this.comm.show(npc.name, this.getNPCDialogue(npc.name), { color: '#88ff88' });
          }
        }
      } else {
        npc.label.setColor(npc.hostile ? '#ff8888' : '#88ff88');
        if (npc._hint) { npc._hint.destroy(); npc._hint = null; }
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
    // Scale enemy HP with player level (+15% per level above 1)
    const scaledMaxHp = Math.round(cardData.maxHp * (1 + (G.level - 1) * 0.15));
    const enemyGhosts = [{ id: cardData.id, name: cardData.name, hp: scaledMaxHp, maxHp: scaledMaxHp,
      ko: false, ability: cardData.ability, abilityDesc: cardData.desc, rarity: cardData.rarity,
      usedOncePerGame: false, entryFired: false }];

    B = {
      round: 1, player: { ghosts: playerGhosts, activeIdx: 0, resources: {} },
      enemy: { ghosts: enemyGhosts, activeIdx: 0, resources: {} },
      enemyCard: cardData, zoneIdx: getCurrentZone(), phase: 'ready', log: [], playerDice: [], enemyDice: [],
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
    if (this.comm) this.comm.show(npc.name, trainerData.challenge, { color: '#ff6644' });
    this.time.delayedCall(2500, () => {
      // Set up battle state directly (DON'T call triggerHostileNPCBattle — it uses DOM)
      G.inBattle = true;
      const playerGhosts = buildPlayerBattleTeam();
      const trainerTeamSize = { frost_valley: 1, rolling_hills: 2, volcanic_isles: 2, dark_castle: 3 }[getCurrentRegion(G.x, G.y)] || 3;
      const trainerCardIds = trainerData.team.slice(0, trainerTeamSize);
      const enemyGhosts = trainerCardIds.map(id => {
        const card = getCard(id);
        if (!card) return null;
        return { id: card.id, name: card.name, hp: card.maxHp, maxHp: card.maxHp, ko: false,
          ability: card.ability, abilityDesc: card.desc, rarity: card.rarity,
          usedOncePerGame: false, entryFired: false };
      }).filter(Boolean);

      if (enemyGhosts.length === 0) { G.inBattle = false; return; }

      B = {
        round: 1, player: { ghosts: playerGhosts, activeIdx: 0, resources: {} },
        enemy: { ghosts: enemyGhosts, activeIdx: 0, resources: {} },
        enemyCard: getCard(trainerData.team[0]), phase: 'ready', log: [],
        playerDice: [], enemyDice: [], isHostileNPC: trainerData.id,
        nextRoundMods: { playerExtraDice: 0, enemyExtraDice: 0, playerMaxDice: 99, enemyMaxDice: 99 },
      };

      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.launch('BattleScene', { enemyCard: getCard(trainerData.team[0]), trainerName: npc.name });
        this.scene.pause();
      });
    });
  }

  // ═══════ TEAM LINEUP ═══════

  showTeamLineup() {
    if (this.panels.isOpen()) { this.panels.close(); return; }

    this.panels.open('TEAM LINEUP — Click to set active', (container, w, h) => {
      if (G.team.length === 0) {
        const empty = this.add.text(w / 2, 40, 'No Spiritkin!', {
          fontSize: '16px', fontFamily: 'Georgia, serif', color: '#ff6644',
        }).setOrigin(0.5).setScrollFactor(0);
        container.add(empty);
        return;
      }

      G.team.forEach((ghost, i) => {
        const y = 12 + i * 56;
        const isActive = i === G.activeIdx;

        // Clickable row
        const rowBg = this.add.rectangle(w / 2, y + 20, w - 20, 48, isActive ? 0x224422 : 0x222244, 0.6)
          .setStrokeStyle(1, isActive ? 0x44aa44 : 0x334466)
          .setInteractive({ useHandCursor: true }).setScrollFactor(0);
        rowBg.on('pointerover', () => rowBg.setFillStyle(isActive ? 0x336633 : 0x333366));
        rowBg.on('pointerout', () => rowBg.setFillStyle(isActive ? 0x224422 : 0x222244, 0.6));
        rowBg.on('pointerdown', () => {
          if (!ghost.ko && ghost.hp > 0) {
            G.activeIdx = i;
            this.panels.close();
            this.showNotification(`${ghost.name} is now active!`);
            saveGame();
          } else {
            this.showNotification(`${ghost.name} is KO'd!`);
          }
        });

        const indicator = isActive ? '\u25b6 ' : '  ';
        const nameColor = isActive ? '#88ff88' : ghost.ko ? '#ff4444' : '#cccccc';
        const nameText = this.add.text(14, y + 8, `${indicator}${ghost.name}`, {
          fontSize: '14px', fontFamily: 'monospace', fontStyle: isActive ? 'bold' : 'normal', color: nameColor,
        }).setScrollFactor(0);

        const hpText = this.add.text(w - 14, y + 8, `HP ${ghost.hp}/${ghost.maxHp}`, {
          fontSize: '12px', fontFamily: 'monospace', color: ghost.hp <= 0 ? '#ff4444' : '#aaaaaa',
        }).setOrigin(1, 0).setScrollFactor(0);

        const abilityText = this.add.text(14, y + 28, `  ${ghost.ability || ''}`, {
          fontSize: '11px', fontFamily: 'monospace', fontStyle: 'italic', color: '#888888',
        }).setScrollFactor(0);

        container.add([rowBg, nameText, hpText, abilityText]);
      });
    }, { width: 320, height: Math.min(G.team.length * 56 + 50, 400) });
  }

  // ═══════ INVENTORY PANEL ═══════

  showInventory() {
    if (this.panels.isOpen()) { this.panels.close(); return; }
    this._invTab = this._invTab || 'essences';

    this.panels.open('INVENTORY', (container, w, h) => {
      this._buildInventoryContent(container, w, h);
    }, { width: 480, height: 380 });
  }

  _buildInventoryContent(container, w, h) {
    const tabs = ['essences', 'gear', 'materials'];
    const tabW = w / tabs.length;

    // Tab bar
    tabs.forEach((tab, i) => {
      const isActive = tab === this._invTab;
      const tabBg = this.add.rectangle(tabW * i + tabW / 2, 14, tabW - 4, 24, isActive ? 0x445588 : 0x222233)
        .setStrokeStyle(1, isActive ? 0x6688cc : 0x333344)
        .setInteractive({ useHandCursor: true }).setScrollFactor(0);
      const tabText = this.add.text(tabW * i + tabW / 2, 14, tab.toUpperCase(), {
        fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', color: isActive ? '#ffffff' : '#888888',
      }).setOrigin(0.5).setScrollFactor(0);
      tabBg.on('pointerdown', () => {
        this._invTab = tab;
        this.panels.close();
        this.showInventory();
      });
      container.add([tabBg, tabText]);
    });

    const cy = 36;

    if (this._invTab === 'essences') {
      const essences = G.essences || [];
      if (essences.length === 0) {
        container.add(this.add.text(w / 2, cy + 30, 'No essences yet.\nDefeat spirits to collect!', {
          fontSize: '13px', fontFamily: 'Georgia, serif', color: '#666', align: 'center',
        }).setOrigin(0.5, 0).setScrollFactor(0));
      } else {
        const shown = essences.slice(-8);
        shown.forEach((ess, i) => {
          const y = cy + 6 + i * 36;
          const rColors = { common: '#aaa', uncommon: '#5599ff', rare: '#aa55ff', 'ghost-rare': '#ff55aa', legendary: '#ffaa22' };
          container.add(this.add.text(14, y, ess.fromName || ess.name, {
            fontSize: '13px', fontFamily: 'monospace', color: rColors[ess.rarity] || '#ccc',
          }).setScrollFactor(0));
          container.add(this.add.text(w - 14, y, `P:${ess.potency} S:${ess.stability} R:${ess.resonance}`, {
            fontSize: '10px', fontFamily: 'monospace', color: '#888',
          }).setOrigin(1, 0).setScrollFactor(0));
          container.add(this.add.text(14, y + 16, `${ess.region || 'Unknown'} — ${ess.subtype || 'Essence'}`, {
            fontSize: '10px', fontFamily: 'monospace', fontStyle: 'italic', color: '#555',
          }).setScrollFactor(0));
        });
        if (essences.length > 8) {
          container.add(this.add.text(w / 2, cy + 8 * 36 + 8, `...and ${essences.length - 8} more`, {
            fontSize: '11px', fontFamily: 'monospace', color: '#555',
          }).setOrigin(0.5, 0).setScrollFactor(0));
        }
      }

    } else if (this._invTab === 'gear') {
      const equipped = G.equipped || {};
      let y = cy + 6;

      // Equipped section
      container.add(this.add.text(14, y, 'EQUIPPED:', {
        fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffdd44',
      }).setScrollFactor(0));
      y += 20;

      for (const [slot, item] of Object.entries(equipped)) {
        const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);
        const itemName = item ? item.name : '(empty)';
        container.add(this.add.text(14, y, `${slotLabel}:`, {
          fontSize: '12px', fontFamily: 'monospace', color: '#aaa',
        }).setScrollFactor(0));
        container.add(this.add.text(100, y, itemName, {
          fontSize: '12px', fontFamily: 'monospace', color: item ? '#88ff88' : '#555',
        }).setScrollFactor(0));

        if (item) {
          const unBtn = this.add.text(w - 14, y, '[UNEQUIP]', {
            fontSize: '10px', fontFamily: 'monospace', color: '#cc6644',
          }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setScrollFactor(0);
          unBtn.on('pointerdown', () => {
            G.gear.push(item);
            G.equipped[slot] = null;
            saveGame();
            this.panels.close();
            this.showInventory();
          });
          container.add(unBtn);
        }
        y += 20;
      }

      // Gear inventory
      y += 10;
      container.add(this.add.text(14, y, 'INVENTORY:', {
        fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffdd44',
      }).setScrollFactor(0));
      y += 20;

      const gear = G.gear || [];
      if (gear.length === 0) {
        container.add(this.add.text(14, y, 'No gear. Craft some at the Workshop!', {
          fontSize: '12px', fontFamily: 'Georgia, serif', color: '#666',
        }).setScrollFactor(0));
      } else {
        gear.slice(0, 6).forEach((item, i) => {
          const iy = y + i * 28;
          container.add(this.add.text(14, iy, item.name, {
            fontSize: '12px', fontFamily: 'monospace', color: '#ccc',
          }).setScrollFactor(0));
          const slot = item.slot || 'accessory';
          const eqBtn = this.add.text(w - 14, iy, `[EQUIP \u2192 ${slot}]`, {
            fontSize: '10px', fontFamily: 'monospace', color: '#44aa44',
          }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setScrollFactor(0);
          eqBtn.on('pointerdown', () => {
            if (G.equipped[slot]) G.gear.push(G.equipped[slot]);
            G.equipped[slot] = item;
            G.gear.splice(G.gear.indexOf(item), 1);
            saveGame();
            this.panels.close();
            this.showInventory();
          });
          container.add(eqBtn);
        });
      }

    } else if (this._invTab === 'materials') {
      let y = cy + 6;
      const mats = {
        'Ice Shards': G.iceShards || 0,
        'Sacred Fire': G.sacredFire || 0,
        'Surge': G.surge || 0,
        'Moonstone': G.moonstone || 0,
      };
      if (G.materials) {
        for (const [k, v] of Object.entries(G.materials)) {
          if (v > 0) mats[k] = v;
        }
      }
      for (const [name, count] of Object.entries(mats)) {
        container.add(this.add.text(14, y, `${name}: ${count}`, {
          fontSize: '13px', fontFamily: 'monospace', color: count > 0 ? '#88ccff' : '#555',
        }).setScrollFactor(0));
        y += 22;
      }
    }
  }

  // ═══════ SPIRIT WISPS ═══════

  spawnWisp() {
    if (!this.wisps || this.wisps.getLength() >= 8) return;
    const px = this.player ? this.player.x : 500;
    const py = this.player ? this.player.y : 500;
    const angle = Math.random() * Math.PI * 2;
    const dist = Phaser.Math.Between(100, 300);
    const wx = px + Math.cos(angle) * dist;
    const wy = py + Math.sin(angle) * dist;

    const WISP_TYPES = [
      { name: 'Frost Shard', color: 0x88ccff },
      { name: 'Ember Dust', color: 0xff8844 },
      { name: 'Spirit Thread', color: 0xaa66ff },
      { name: 'Mask Fragment', color: 0xffffff },
    ];
    const type = WISP_TYPES[Math.floor(Math.random() * WISP_TYPES.length)];

    const wisp = this.wisps.create(wx, wy, null);
    wisp.setDisplaySize(12, 12).setVisible(false);
    wisp.wispType = type;

    // Glowing circle visual
    const glow = this.add.circle(wx, wy, 6, type.color, 0.8).setDepth(8);
    const outerGlow = this.add.circle(wx, wy, 10, type.color, 0.2).setDepth(7);
    wisp.glowCircle = glow;
    wisp.outerGlow = outerGlow;

    // Pulse animation
    this.tweens.add({ targets: outerGlow, scaleX: 1.5, scaleY: 1.5, alpha: 0.05, duration: 1200, yoyo: true, repeat: -1 });
    // Float animation
    this.tweens.add({ targets: [glow, outerGlow, wisp], y: wy + Phaser.Math.Between(-15, 15), duration: 2000, yoyo: true, repeat: -1 });

    // Auto-despawn after 12 seconds
    this.time.delayedCall(12000, () => {
      if (wisp.active) {
        glow.destroy();
        outerGlow.destroy();
        wisp.destroy();
      }
    });
  }

  onWispCollect(player, wisp) {
    const type = wisp.wispType;
    if (wisp.glowCircle) wisp.glowCircle.destroy();
    if (wisp.outerGlow) wisp.outerGlow.destroy();
    wisp.destroy();

    // Grant resource
    const resourceMap = { 'Frost Shard': 'iceShards', 'Ember Dust': 'sacredFire', 'Spirit Thread': 'surge', 'Mask Fragment': 'moonstone' };
    const key = resourceMap[type.name];
    if (key && G[key] !== undefined) G[key]++;

    this.showNotification(`Collected ${type.name}!`);
    saveGame();
  }

  // ═══════ DAY/NIGHT CYCLE ═══════

  updateDayNight() {
    const tod = getTimeOfDay();
    if (!this._nightOverlay) {
      this._nightOverlay = this.add.rectangle(
        this.scale.width / 2, this.scale.height / 2,
        this.scale.width * 2, this.scale.height * 2,
        0x000022
      ).setScrollFactor(0).setDepth(150).setAlpha(0);
    }
    this._nightOverlay.setAlpha(tod.nightFactor * 0.5);
  }

  // ═══════ HUD ═══════

  buildHUD() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Top-left: player info
    this.hudPlayerText = this.add.text(10, 8, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#ffffff',
      backgroundColor: '#000000aa', padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(200);

    // Top-left below: active ghost + HP
    this.hudTeamText = this.add.text(10, 36, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#88ff88',
      backgroundColor: '#000000aa', padding: { x: 8, y: 3 },
    }).setScrollFactor(0).setDepth(200);

    // Top-right: time of day
    this.hudTimeText = this.add.text(W - 10, 8, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#aaaacc',
      backgroundColor: '#000000aa', padding: { x: 6, y: 3 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(200);

    // ── Minimap (bottom-right) ──
    const mmW = 160, mmH = 120;
    this.minimapBg = this.add.rectangle(W - mmW/2 - 8, H - mmH/2 - 8, mmW + 4, mmH + 4, 0x000000, 0.7)
      .setStrokeStyle(1, 0x444466).setScrollFactor(0).setDepth(200);

    // Minimap graphics
    this.minimapGfx = this.add.graphics().setScrollFactor(0).setDepth(201);

    // Player dot on minimap
    this.minimapDot = this.add.circle(0, 0, 3, 0x44aaff)
      .setScrollFactor(0).setDepth(202);

    this.drawMinimap();
  }

  drawMinimap() {
    const W = this.scale.width;
    const H = this.scale.height;
    const mmW = 160, mmH = 120;
    const mmX = W - mmW - 8;
    const mmY = H - mmH - 8;
    const scaleX = mmW / WORLD_W;
    const scaleY = mmH / WORLD_H;

    this.minimapGfx.clear();

    // Draw tiles at minimap scale
    for (let y = 0; y < WORLD_H; y += 2) {
      for (let x = 0; x < WORLD_W; x += 2) {
        const tile = worldMap[y]?.[x] || 0;
        const colorHex = TILE_COLORS[tile] || '#888888';
        const color = parseInt(colorHex.replace('#', ''), 16);
        this.minimapGfx.fillStyle(color, 1);
        this.minimapGfx.fillRect(mmX + x * scaleX, mmY + y * scaleY, scaleX * 2, scaleY * 2);
      }
    }

    // Encounter zone outlines
    for (const zone of ENCOUNTER_ZONES) {
      this.minimapGfx.lineStyle(1, 0x8866dd, 0.5);
      this.minimapGfx.strokeRect(
        mmX + zone.x * scaleX, mmY + zone.y * scaleY,
        zone.w * scaleX, zone.h * scaleY
      );
    }
  }

  updateHUD() {
    const wins = G.rep?.battlesWon || 0;
    const sideline = wins >= 5 ? 'UNLOCKED' : `${wins}/5 wins`;

    const xpNeeded = G.level * 3;
    this.hudPlayerText.setText(`${G.name} | LV ${G.level} (${G.xp}/${xpNeeded} XP) | ${G.coins} Gold`);

    const ghost = G.team[G.activeIdx];
    if (ghost) {
      this.hudTeamText.setText(`${ghost.name} HP ${ghost.hp}/${ghost.maxHp} | ${ghost.ability}`);
      this.hudTeamText.setColor(ghost.hp <= ghost.maxHp * 0.33 ? '#ff6644' : '#88ff88');
    } else {
      this.hudTeamText.setText('No Spiritkin!');
    }

    // Quest tracker (uses wins from above)
    let questText = '';
    if (wins < 1) questText = 'Quest: Defeat your first wild Spiritkin!';
    else if (wins < 5) questText = `Quest: Win ${5 - wins} more battles to unlock sideline`;
    else if (wins < 10) questText = `Quest: Defeat ${10 - wins} more for Veteran title`;
    else questText = `Battles won: ${wins}`;
    if (!this.hudQuestText) {
      this.hudQuestText = this.add.text(10, 58, '', {
        fontSize: '11px', fontFamily: 'monospace', color: '#ffcc44',
        backgroundColor: '#000000aa', padding: { x: 6, y: 2 },
      }).setScrollFactor(0).setDepth(200);
    }
    this.hudQuestText.setText(questText);

    // Time of day
    const tod = getTimeOfDay();
    const icons = { dawn: '🌅', day: '☀️', dusk: '🌇', night: '🌙' };
    this.hudTimeText.setText(`${icons[tod.phase] || ''} ${tod.phase}`);

    // Minimap player dot
    const W = this.scale.width;
    const H = this.scale.height;
    const mmW = 160, mmH = 120;
    const mmX = W - mmW - 8;
    const mmY = H - mmH - 8;
    this.minimapDot.setPosition(mmX + G.x * (mmW / WORLD_W), mmY + G.y * (mmH / WORLD_H));
  }
}
