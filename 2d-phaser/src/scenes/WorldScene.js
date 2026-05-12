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

    // ── Render the world map as a single RenderTexture (not 9350 rectangles) ──
    // Build the impassable lookup set once
    this._impassableSet = new Set([1, 3, 7, 13, 15, 16, 21, 23, 25]);
    this._tileSize = T;

    // Convert hex color string to Phaser number
    function hexToNum(hex) { return parseInt(hex.replace('#', ''), 16); }

    // Draw entire map as a single Graphics object — replaces 9350 individual rectangles
    const mapGfx = this.add.graphics();
    for (let y = 0; y < MH; y++) {
      for (let x = 0; x < MW; x++) {
        const tileType = worldMap[y] ? worldMap[y][x] : 0;
        const colorHex = TILE_COLORS[tileType] || '#d8e8f0';
        const color = hexToNum(colorHex);
        mapGfx.fillStyle(color, 1);
        mapGfx.fillRect(x * T, y * T, T, T);
      }
    }

    // No physics static group — collision is handled by tile lookup in update()

    // ── Player ──
    // Reset to hub if saved position is problematic (blocked OR far from any hub)
    const spawnTX = Math.floor(G.x);
    const spawnTY = Math.floor(G.y);
    const nearAnyHub = [HUB, HUB_MEADOW, HUB_VOLCANIC, HUB_DARK].some(
      h => Math.abs(spawnTX - h.x) < 20 && Math.abs(spawnTY - h.y) < 20
    );
    if (spawnTX < 0 || spawnTY < 0 || spawnTX >= MW || spawnTY >= MH ||
        this._impassableSet.has(worldMap[spawnTY]?.[spawnTX]) || !nearAnyHub) {
      console.log('[WorldScene] Resetting to Polaris Hub from', spawnTX, spawnTY);
      G.x = HUB.x + 3;
      G.y = HUB.y + 2;
      saveGame();
    }

    this.player = this.physics.add.sprite(G.x * T, G.y * T, 'player', 0);
    this.player.setScale(2);
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);

    // Bright player indicator — large pulsing glow so you can always find yourself
    this._playerMarker = this.add.circle(0, 0, 20, 0x44aaff, 0.5).setDepth(9);
    this._playerMarkerRing = this.add.circle(0, 0, 26, 0x44aaff, 0).setDepth(9).setStrokeStyle(2, 0x44aaff, 0.7);
    this.tweens.add({ targets: this._playerMarkerRing, scaleX: 1.4, scaleY: 1.4, alpha: 0, duration: 1000, yoyo: false, repeat: -1 });
    // No physics collider — tile collision handled manually in update()

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
    // Friendly — Volcanic Isles
    this.spawnNPC('Captain Flint', 74 * T, 16 * T, 'npc_hunter', 0xcc6644);
    this.spawnNPC('Lava Tender', 76 * T, 14 * T, 'npc_knight', 0xff8844);
    // Friendly — Dark Castle
    this.spawnNPC('Shadow Warden', 93 * T, 20 * T, 'npc_hunter', 0x8a6aaa);
    this.spawnNPC('Cursed Scholar', 95 * T, 22 * T, 'npc_elder', 0x6a4a8a);

    // Hostile NPCs (from HOSTILE_NPCS positions)
    this.spawnNPC('Brawler Jax', 30 * T, 20 * T, 'enemy_sprite', 0xcc4444, true);
    this.spawnNPC('Ice Queen Vera', 40 * T, 15 * T, 'npc_knight', 0x6688cc, true);
    this.spawnNPC('Bandit Marcus', 28 * T, 48 * T, 'enemy_sprite', 0xa88844, true);
    this.spawnNPC('Lava Raider Kira', 68 * T, 25 * T, 'npc_hunter', 0xee8844, true);
    this.spawnNPC('Shadow Knight Vex', 92 * T, 18 * T, 'npc_elder', 0x8866aa, true);
    this.spawnNPC('The Exile', 55 * T, 35 * T, 'npc_knight', 0x666666, true);

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
    this.pKey = this.input.keyboard.addKey('P');

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

    // ── Wave 3: Building Interactions ──
    this._interactBuildings = [
      { name: 'Trading Post', x: HUB.x + 1, y: HUB.y + 1, action: 'tradingPost' },
      { name: 'Arena', x: HUB.x + 5, y: HUB.y + 1, action: 'arena' },
      { name: 'Workshop', x: HUB.x + 1, y: HUB.y + 3, action: 'workshop' },
      { name: 'Inn', x: HUB.x + 5, y: HUB.y + 3, action: 'inn' },
      { name: 'Cantina', x: HUB.x + 3, y: HUB.y + 5, action: 'cantina' },
    ];

    // ── Wave 3: Signposts ──
    this._signposts = [
      { x: HUB.x + 3, y: HUB.y - 2, text: 'Welcome to Polaris Hub! North: Frost Valley zones. South: Rolling Hills.' },
      { x: 28, y: 42, text: 'CAUTION: Mountain pass ahead. Rolling Hills region beyond.' },
      { x: 58, y: 20, text: 'Volcanic Isles passage. Beware lava flows and strong Spiritkin.' },
      { x: 90, y: 20, text: 'Dark Castle entrance. Only the brave pass this threshold.' },
      { x: 26, y: 56, text: 'Meadowbrook — a peaceful settlement among the rolling green hills.' },
      { x: 74, y: 13, text: 'Volcanic Settlement — built on sand and ash. Trade and rest here.' },
    ];
    for (const sp of this._signposts) {
      this.add.text(sp.x * T + T/2, sp.y * T + T/2, '\u{1F4DC}', {
        fontSize: '16px',
      }).setOrigin(0.5).setDepth(6);
    }

    // ── Wave 3: Lore Tablets ──
    this._loreTablets = [
      { id: 'lore_polaris', x: 20, y: 16, text: 'The first settlers named this land after the Polaris star, a beacon visible even through spirit storms. Frost Valley was where Spiritkin and humans first learned to coexist.' },
      { id: 'lore_lake', x: 40, y: 20, text: 'The Frozen Lake was once a sacred pool where Spiritkin emerged from the spirit world. When the Great Frost came, the lake sealed shut — trapping hundreds of spirits beneath the ice.' },
      { id: 'lore_hills', x: 30, y: 55, text: 'Rolling Hills was farmland before the Spiritkin arrived. Farmer Bea says the flowers here bloom in colors that don\'t exist anywhere else — fed by spirit energy seeping up from below.' },
      { id: 'lore_castle', x: 98, y: 12, text: 'The Dark Castle was built by the Valkin, ancient spirit wardens who believed darkness could be harnessed. When they vanished, the castle remained — and something still stirs inside.' },
    ];
    this._loreTabletSprites = [];
    for (const lt of this._loreTablets) {
      if (G.loreCollected.includes(lt.id)) continue; // already collected
      const glow = this.add.rectangle(lt.x * T + T/2, lt.y * T + T/2, 14, 14, 0xffcc00, 0.85)
        .setStrokeStyle(1, 0xffee44).setDepth(8);
      const outerGlow = this.add.rectangle(lt.x * T + T/2, lt.y * T + T/2, 20, 20, 0xffcc00, 0.2)
        .setDepth(7);
      this.tweens.add({ targets: outerGlow, scaleX: 1.5, scaleY: 1.5, alpha: 0.05, duration: 1200, yoyo: true, repeat: -1 });
      this._loreTabletSprites.push({ id: lt.id, x: lt.x, y: lt.y, text: lt.text, glow, outerGlow });
    }

    // ── Wave 3: Region transition tracking ──
    this._lastRegion = getCurrentRegion(G.x, G.y);

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
      { label: 'PROF (P)', key: 'P', action: () => this.showProfessionPanel(), color: 0x664488 },
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
    console.log('[WorldScene] create: HUD + UI done');

    // Panel manager for inventory/team overlays
    this.panels = new PanelManager(this);
    console.log('[WorldScene] create: PanelManager done');

    // Star Fox comm overlay
    try {
      this.comm = new CommOverlay(this);
      console.log('[WorldScene] create: CommOverlay done');
    } catch(e) {
      console.error('[WorldScene] CommOverlay FAILED:', e);
      this.comm = null;
    }

    // ── Music ──
    try {
      this._currentMusic = 'frost';
      if (this.sound.get('music_hub')) {
        this.sound.play('music_hub', { loop: true, volume: 0.3 });
      }
    } catch(e) { console.log('[Audio] Music skipped:', e.message); }
    console.log('[WorldScene] create: COMPLETE');
  }

  // ── Tile collision helper (replaces 2270 static physics bodies) ──
  isTileBlocked(px, py) {
    const tx = Math.floor(px / this._tileSize);
    const ty = Math.floor(py / this._tileSize);
    if (tx < 0 || ty < 0 || tx >= WORLD_W || ty >= WORLD_H) return true;
    return this._impassableSet.has(worldMap[ty]?.[tx]);
  }

  update(time, delta) {
    try {
    if (G.inBattle) return;
    if (!this._updateLogged) { this._updateLogged = true; console.log('[WorldScene] update() running, player:', this.player?.x, this.player?.y); }

    const speed = 140;
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) { vx = -speed; this._lastDir = 'left'; }
    else if (this.cursors.right.isDown || this.wasd.D.isDown) { vx = speed; this._lastDir = 'right'; }
    if (this.cursors.up.isDown || this.wasd.W.isDown) { vy = -speed; this._lastDir = 'up'; }
    else if (this.cursors.down.isDown || this.wasd.S.isDown) { vy = speed; this._lastDir = 'down'; }

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    // Tile-based collision: check destination before applying velocity
    const T = this._tileSize;
    const halfBody = 10; // approximate half-width of player collision body
    const px = this.player.x;
    const py = this.player.y;
    const dt = (delta || 16) / 1000;
    const nextX = px + vx * dt;
    const nextY = py + vy * dt;

    // Check X movement
    if (vx !== 0) {
      const probeX = vx > 0 ? nextX + halfBody : nextX - halfBody;
      if (this.isTileBlocked(probeX, py - halfBody) || this.isTileBlocked(probeX, py + halfBody)) {
        vx = 0;
      }
    }
    // Check Y movement
    if (vy !== 0) {
      const probeY = vy > 0 ? nextY + halfBody : nextY - halfBody;
      if (this.isTileBlocked(px - halfBody, probeY) || this.isTileBlocked(px + halfBody, probeY)) {
        vy = 0;
      }
    }

    this.player.setVelocity(vx, vy);

    // Safety: if player is currently INSIDE a blocked tile, push them out
    if (this.isTileBlocked(px, py)) {
      const safeTX = Math.floor(px / T);
      const safeTY = Math.floor(py / T);
      let escaped = false;
      for (let r = 1; r < 15 && !escaped; r++) {
        for (let dy = -r; dy <= r && !escaped; dy++) {
          for (let dx = -r; dx <= r && !escaped; dx++) {
            if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const checkTX = safeTX + dx, checkTY = safeTY + dy;
            if (checkTX >= 0 && checkTY >= 0 && checkTX < WORLD_W && checkTY < WORLD_H &&
                !this._impassableSet.has(worldMap[checkTY]?.[checkTX])) {
              this.player.setPosition(checkTX * T + T / 2, checkTY * T + T / 2);
              this.player.setVelocity(0, 0);
              escaped = true;
            }
          }
        }
      }
      // If still stuck after 15-tile radius, warp to hub
      if (!escaped) {
        this.player.setPosition((HUB.x + 3) * T, (HUB.y + 2) * T);
        this.player.setVelocity(0, 0);
      }
    }

    // Track player marker
    if (this._playerMarker) this._playerMarker.setPosition(this.player.x, this.player.y);
    if (this._playerMarkerRing) this._playerMarkerRing.setPosition(this.player.x, this.player.y);

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
    if (Phaser.Input.Keyboard.JustDown(this.pKey)) {
      this.showProfessionPanel();
    }

    // Wave 3: Building interactions (E key near buildings)
    this.checkBuildingProximity();

    // Wave 3: Signpost interactions (E key near signposts)
    this.checkSignpostProximity();

    // Wave 3: Lore tablet collection (walk over)
    this.checkLoreTablets();

    // Wave 3: Region transition banners + exploration XP
    this.checkRegionTransition(region);

    // Dynamic encounter rate — faster spawns inside encounter zones
    const zoneIdx = getCurrentZone(G.x, G.y);
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
    } catch (e) { console.error('[WorldScene] update error:', e); }
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
    this._eConsumed = false; // reset each frame

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
          this._eConsumed = true;
          if (this.comm && this.comm.isActive) {
            this.comm.dismiss();
          } else if (npc.hostile) {
            this.triggerTrainerBattle(npc);
          } else if (this.comm) {
            this.comm.show(npc.name, this.getNPCDialogue(npc.name), { color: '#88ff88' });
          } else {
            // Fallback if CommOverlay failed to initialize
            this.showDialogue(npc.name, this.getNPCDialogue(npc.name));
          }
        }
      } else {
        npc.label.setColor(npc.hostile ? '#ff8888' : '#88ff88');
        if (npc._hint) { npc._hint.destroy(); npc._hint = null; }
      }
    }
  }

  getNPCDialogue(name) {
    // Use the rich NPC_DIALOGUE_MAP from npcs.js if available
    if (typeof NPC_DIALOGUE_MAP !== 'undefined' && NPC_DIALOGUE_MAP[name] && NPC_DIALOGUE_MAP[name].getLine) {
      return NPC_DIALOGUE_MAP[name].getLine();
    }
    // Fallback for any NPC not in the map
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

  // ═══════ WAVE 3: BUILDING INTERACTIONS ═══════

  checkBuildingProximity() {
    if (this._eConsumed) return; // NPC already handled E this frame
    const ePressed = Phaser.Input.Keyboard.JustDown(this.eKey);
    if (!ePressed) return;
    // Don't interact if a panel, comm overlay, or dialogue is active
    if (this.panels.isOpen()) return;
    if (this.comm && this.comm.isActive) return;

    const px = this.player.x;
    const py = this.player.y;
    const T = this._tileSize;
    const INTERACT_DIST = 60; // pixels

    for (const bld of this._interactBuildings) {
      const bx = bld.x * T + T / 2;
      const by = bld.y * T + T / 2;
      const dist = Phaser.Math.Distance.Between(px, py, bx, by);
      if (dist > INTERACT_DIST) continue;

      this._eConsumed = true;
      switch (bld.action) {
        case 'tradingPost':
          this.showBuildingPanel('Trading Post', 'Coming in Wave 4 — Buy and sell Spiritkin essences, gear, and materials.');
          break;
        case 'arena':
          this.showBuildingPanel('Arena', 'Coming in Wave 4 — Challenge ranked trainers and earn arena titles.');
          break;
        case 'workshop':
          this.scene.launch('CraftScene');
          this.scene.pause();
          break;
        case 'inn':
          this.interactInn();
          break;
        case 'cantina':
          this.interactCantina();
          break;
      }
      return; // only interact with one building per press
    }
  }

  showBuildingPanel(title, message) {
    this.panels.open(title, (container, w, h) => {
      const text = this.add.text(w / 2, h / 2 - 20, message, {
        fontSize: '14px', fontFamily: 'Georgia, serif', color: '#aaaacc',
        wordWrap: { width: w - 40 }, align: 'center',
      }).setOrigin(0.5).setScrollFactor(0);
      container.add(text);
    }, { width: 360, height: 160 });
  }

  interactInn() {
    const cost = 5;
    if (G.coins < cost) {
      this.showNotification('Not enough gold! Inn costs 5 gold.');
      return;
    }
    // Check if any team member is hurt
    const anyHurt = G.team.some(g => g.hp < g.maxHp || g.ko);
    if (!anyHurt) {
      this.showNotification('Your team is already at full health!');
      return;
    }
    G.coins -= cost;
    for (const ghost of G.team) {
      ghost.hp = ghost.maxHp;
      ghost.ko = false;
    }
    saveGame();
    this.showNotification('Team fully healed at the Inn! (-5 gold)');
  }

  interactCantina() {
    const tips = [
      'Bartender says: "The elder knows which zones are running hot. Ask him."',
      '"Heard a traveler found a lore tablet near the frozen lake. Golden, glowing thing."',
      '"The Workshop crafts the best gear. Bring essences from encounter zones."',
      '"Some say the Dark Castle holds ancient Spiritkin sealed away for centuries."',
      '"If your team is hurt, the Inn can fix them up — just 5 gold."',
      '"Encounter zones cycle quality every 12 hours. Patience pays off."',
      '"The Rolling Hills are peaceful, but don\'t let that fool you — the Spiritkin there are crafty."',
      '"Captain Flint at the Volcanic settlement used to be a pirate. Don\'t tell him I said that."',
      '"Spirit Wisps carry resources. Collect them before they vanish!"',
      '"They say a master crafter can forge legendary weapons. Get your mastery up."',
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    if (this.comm) {
      this.comm.show('The Frozen Mug', tip, { color: '#cc9944' });
    } else {
      this.showDialogue('The Frozen Mug', tip);
    }
  }

  // ═══════ WAVE 3: SIGNPOST INTERACTIONS ═══════

  checkSignpostProximity() {
    if (this._eConsumed) return; // NPC or building already handled E this frame
    const ePressed = Phaser.Input.Keyboard.JustDown(this.eKey);
    if (!ePressed) return;
    if (this.panels.isOpen()) return;
    if (this.comm && this.comm.isActive) return;

    const px = this.player.x;
    const py = this.player.y;
    const T = this._tileSize;
    const INTERACT_DIST = 50;

    for (const sp of this._signposts) {
      const sx = sp.x * T + T / 2;
      const sy = sp.y * T + T / 2;
      const dist = Phaser.Math.Distance.Between(px, py, sx, sy);
      if (dist > INTERACT_DIST) continue;

      if (this.comm) {
        this.comm.show('Signpost', sp.text, { color: '#ccbb88' });
      } else {
        this.showNotification(sp.text);
      }
      return;
    }
  }

  // ═══════ WAVE 3: LORE TABLETS ═══════

  checkLoreTablets() {
    const px = this.player.x;
    const py = this.player.y;
    const T = this._tileSize;
    const COLLECT_DIST = 30;

    for (let i = this._loreTabletSprites.length - 1; i >= 0; i--) {
      const lt = this._loreTabletSprites[i];
      const lx = lt.x * T + T / 2;
      const ly = lt.y * T + T / 2;
      const dist = Phaser.Math.Distance.Between(px, py, lx, ly);
      if (dist > COLLECT_DIST) continue;

      // Collect this lore tablet
      if (!G.loreCollected.includes(lt.id)) {
        G.loreCollected.push(lt.id);
        saveGame();
      }

      // Remove visuals
      if (lt.glow) lt.glow.destroy();
      if (lt.outerGlow) lt.outerGlow.destroy();
      this._loreTabletSprites.splice(i, 1);

      // Show lore text in a panel
      this.panels.open('LORE DISCOVERED', (container, w, h) => {
        const title = this.add.text(w / 2, 16, `Lore Tablet (${G.loreCollected.length}/4)`, {
          fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffcc44',
        }).setOrigin(0.5).setScrollFactor(0);
        const body = this.add.text(w / 2, h / 2, lt.text, {
          fontSize: '13px', fontFamily: 'Georgia, serif', color: '#ccccee',
          wordWrap: { width: w - 40 }, align: 'center', lineSpacing: 4,
        }).setOrigin(0.5).setScrollFactor(0);
        container.add([title, body]);
      }, { width: 420, height: 220 });

      this.showNotification('Lore tablet discovered!');
      return; // one at a time
    }
  }

  // ═══════ WAVE 3: REGION TRANSITION BANNERS ═══════

  checkRegionTransition(currentRegion) {
    if (currentRegion === this._lastRegion) return;
    const isFirstSet = this._lastRegion === undefined;
    this._lastRegion = currentRegion;

    // Award exploration XP on region change (skip the initial set on scene load)
    if (!isFirstSet && typeof addProfessionXP === 'function') {
      addProfessionXP('exploration', 5);
    }

    const regionDisplay = {
      frost_valley: { name: 'Frost Valley', color: '#88bbff' },
      rolling_hills: { name: 'Rolling Hills', color: '#88cc44' },
      volcanic_isles: { name: 'Volcanic Isles', color: '#ff8844' },
      dark_castle: { name: 'Dark Castle', color: '#aa66cc' },
    };
    const info = regionDisplay[currentRegion];
    if (!info) return;

    // Large banner text — fade in, hold, fade out
    const banner = this.add.text(640, 200, `Entering ${info.name}`, {
      fontSize: '28px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: info.color,
      backgroundColor: '#000000aa', padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(400).setAlpha(0);

    // Subtitle with region flavor
    const flavors = {
      frost_valley: 'Land of ice and ancient spirits',
      rolling_hills: 'Where green hills meet the sky',
      volcanic_isles: 'Fire and paradise intertwined',
      dark_castle: 'Shadows hold secrets',
    };
    const subtitle = this.add.text(640, 240, flavors[currentRegion] || '', {
      fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#999999',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(400).setAlpha(0);

    // Fade in
    this.tweens.add({
      targets: [banner, subtitle], alpha: 1, duration: 600,
      onComplete: () => {
        // Hold then fade out
        this.tweens.add({
          targets: [banner, subtitle], alpha: 0, y: '-=20', duration: 1200, delay: 2000,
          onComplete: () => { banner.destroy(); subtitle.destroy(); }
        });
      }
    });
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

    const _resources = { iceShards: G.iceShards || 0, sacredFire: G.sacredFire || 0, healingSeeds: G.healingSeeds || 0, luckyStones: G.luckyStones || 0, surge: G.surge || 0, moonstone: G.moonstone || 0, firefly: G.firefly || 0 };
    B = {
      round: 1,
      player: { ghosts: playerGhosts, activeIdx: 0, resources: { ..._resources } },
      enemy: { ghosts: enemyGhosts, activeIdx: 0, resources: { iceShards: 0, sacredFire: 0, healingSeeds: 0, luckyStones: 0, surge: 0, moonstone: 0, firefly: 0 } },
      enemyCard: cardData, zoneIdx: getCurrentZone(G.x, G.y), phase: 'ready', log: [], playerDice: [], enemyDice: [],
      nextRoundMods: { playerExtraDice: 0, enemyExtraDice: 0, playerMaxDice: 99, enemyMaxDice: 99 },
      resources: { ..._resources },
      entryFired: false, enemyUsedResource: false, damageTakenThisRound: 0,
      koSwapTeam: null, committed: {},
    };

    if (typeof applyAccessoryBattleEffects === 'function') applyAccessoryBattleEffects();

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

      const _tRes = { iceShards: G.iceShards || 0, sacredFire: G.sacredFire || 0, healingSeeds: G.healingSeeds || 0, luckyStones: G.luckyStones || 0, surge: G.surge || 0, moonstone: G.moonstone || 0, firefly: G.firefly || 0 };
      B = {
        round: 1,
        player: { ghosts: playerGhosts, activeIdx: 0, resources: { ..._tRes } },
        enemy: { ghosts: enemyGhosts, activeIdx: 0, resources: { iceShards: 0, sacredFire: 0, healingSeeds: 0, luckyStones: 0, surge: 0, moonstone: 0, firefly: 0 } },
        enemyCard: getCard(trainerData.team[0]), phase: 'ready', log: [],
        playerDice: [], enemyDice: [], isHostileNPC: trainerData.id,
        nextRoundMods: { playerExtraDice: 0, enemyExtraDice: 0, playerMaxDice: 99, enemyMaxDice: 99 },
        resources: { ..._tRes },
        entryFired: false, enemyUsedResource: false, damageTakenThisRound: 0,
        koSwapTeam: null, committed: {},
      };

      if (typeof applyAccessoryBattleEffects === 'function') applyAccessoryBattleEffects();

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

  // ═══════ PROFESSION PANEL ═══════

  showProfessionPanel() {
    if (this.panels.isOpen()) { this.panels.close(); return; }

    this.panels.open('PROFESSIONS', (container, w, h) => {
      const categories = [
        { key: 'combat',      label: 'Combat',      icon: '\u2694\uFE0F', color: '#ff6644' },
        { key: 'exploration', label: 'Exploration',  icon: '\uD83E\uDDED', color: '#44bbff' },
        { key: 'crafting',    label: 'Crafting',     icon: '\uD83D\uDD28', color: '#ffaa22' },
        { key: 'trade',       label: 'Trade',        icon: '\uD83D\uDCB0', color: '#44dd44' },
        { key: 'charisma',    label: 'Charisma',     icon: '\uD83C\uDF89', color: '#cc88ff' },
      ];

      // Discipline badge
      let y = 6;
      if (G.discipline && typeof DISCIPLINES !== 'undefined' && DISCIPLINES[G.discipline]) {
        const disc = DISCIPLINES[G.discipline];
        container.add(this.add.text(w / 2, y, disc.icon + ' ' + disc.name + ' Discipline', {
          fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: disc.color,
        }).setOrigin(0.5, 0).setScrollFactor(0));
        y += 18;
        container.add(this.add.text(w / 2, y, disc.desc, {
          fontSize: '10px', fontFamily: 'monospace', fontStyle: 'italic', color: '#888899',
        }).setOrigin(0.5, 0).setScrollFactor(0));
        y += 20;
      }

      // Divider
      container.add(this.add.rectangle(w / 2, y, w - 20, 1, 0x334466).setScrollFactor(0));
      y += 8;

      // Skill points summary
      var totalMilestones = Object.values(G.professionXP || {}).reduce(function(sum, xp) { return sum + Math.floor(xp / 100); }, 0);
      var available = Math.max(0, totalMilestones - (G.skillPointsUsed || 0));
      var capVal = (typeof SKILL_POINT_CAP !== 'undefined') ? SKILL_POINT_CAP : 80;
      container.add(this.add.text(w / 2, y, 'Skill Points: ' + available + ' available (' + (G.skillPointsUsed || 0) + ' / ' + capVal + ' used)', {
        fontSize: '11px', fontFamily: 'monospace', color: available > 0 ? '#88ff88' : '#888888',
      }).setOrigin(0.5, 0).setScrollFactor(0));
      y += 22;

      // Category rows
      for (var ci = 0; ci < categories.length; ci++) {
        var cat = categories[ci];
        var xp = (G.professionXP && G.professionXP[cat.key]) || 0;
        var mastery = (typeof getProfessionMasteryInfo === 'function') ? getProfessionMasteryInfo(xp) : { name: 'Novice', min: 0 };

        // Row background
        var rowBg = this.add.rectangle(w / 2, y + 24, w - 16, 52, 0x111122, 0.6)
          .setStrokeStyle(1, 0x334466).setScrollFactor(0);
        container.add(rowBg);

        // Icon + label
        container.add(this.add.text(14, y + 8, cat.icon + ' ' + cat.label, {
          fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: cat.color,
        }).setScrollFactor(0));

        // XP value
        container.add(this.add.text(w - 14, y + 8, xp + ' XP', {
          fontSize: '12px', fontFamily: 'monospace', color: '#aaaacc',
        }).setOrigin(1, 0).setScrollFactor(0));

        // Mastery rank
        var rankColors = { Novice: '#666', Apprentice: '#88aacc', Journeyman: '#aaccee', Expert: '#ffcc44', Master: '#ff8844', 'Grand Master': '#ff44ff' };
        container.add(this.add.text(14, y + 28, 'Rank: ' + mastery.name, {
          fontSize: '11px', fontFamily: 'monospace', color: rankColors[mastery.name] || '#888',
        }).setScrollFactor(0));

        // XP progress bar
        var nextLevel = null;
        if (typeof PROFESSION_MASTERY_LEVELS !== 'undefined') {
          for (var li = 0; li < PROFESSION_MASTERY_LEVELS.length; li++) {
            if (PROFESSION_MASTERY_LEVELS[li].min > xp) { nextLevel = PROFESSION_MASTERY_LEVELS[li]; break; }
          }
        }
        var barW = 160, barH = 8;
        var barX = w - 14 - barW;
        var barY = y + 32;
        container.add(this.add.rectangle(barX + barW / 2, barY + barH / 2, barW, barH, 0x222233).setScrollFactor(0));
        if (nextLevel) {
          var prevMin = mastery.min;
          var progress = Math.min(1, (xp - prevMin) / (nextLevel.min - prevMin));
          if (progress > 0) {
            var fillColor = parseInt(cat.color.replace('#', ''), 16);
            container.add(this.add.rectangle(barX + (barW * progress) / 2, barY + barH / 2, barW * progress, barH - 2, fillColor, 0.7).setOrigin(0.5, 0.5).setScrollFactor(0));
          }
        } else {
          // Max rank
          var fillColorMax = parseInt(cat.color.replace('#', ''), 16);
          container.add(this.add.rectangle(barX + barW / 2, barY + barH / 2, barW, barH - 2, fillColorMax, 0.7).setScrollFactor(0));
        }

        y += 58;
      }
    }, { width: 420, height: 400 });
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
      { name: 'Healing Seed', color: 0x44aa44 },
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

    // Grant battle resource
    const resourceMap = { 'Frost Shard': 'iceShards', 'Ember Dust': 'sacredFire', 'Spirit Thread': 'surge', 'Mask Fragment': 'moonstone', 'Healing Seed': 'healingSeeds' };
    const key = resourceMap[type.name];
    if (key && G[key] !== undefined) G[key]++;

    // Also store as crafting material (used by SCHEMATICS with requiresMaterial)
    const materialMap = { 'Frost Shard': 'frost_shard', 'Ember Dust': 'ember_dust', 'Spirit Thread': 'spirit_thread', 'Mask Fragment': 'mask_fragment' };
    const matKey = materialMap[type.name];
    if (matKey) {
      if (!G.materials) G.materials = {};
      G.materials[matKey] = (G.materials[matKey] || 0) + 1;
    }

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

    // Wave 3: Zone quality display
    const zoneIdx = getCurrentZone(G.x, G.y);
    if (!this.hudZoneText) {
      this.hudZoneText = this.add.text(10, 78, '', {
        fontSize: '11px', fontFamily: 'monospace', color: '#aa88dd',
        backgroundColor: '#000000aa', padding: { x: 6, y: 2 },
      }).setScrollFactor(0).setDepth(200);
    }
    if (zoneIdx >= 0) {
      const zone = ENCOUNTER_ZONES[zoneIdx];
      const quality = getZoneQuality(zoneIdx, getZoneCycleId());
      const qualLabel = getZoneQualityLabel(quality);
      const qualColor = quality >= 1.2 ? '#44ff44' : quality >= 0.8 ? '#cccc44' : '#ff6644';
      this.hudZoneText.setText(`Zone: ${zone.name} (${qualLabel})`);
      this.hudZoneText.setColor(qualColor);
      this.hudZoneText.setVisible(true);
    } else {
      this.hudZoneText.setVisible(false);
    }

    // Wave 3: Mastery display
    if (!this.hudMasteryText) {
      this.hudMasteryText = this.add.text(10, 98, '', {
        fontSize: '11px', fontFamily: 'monospace', color: '#cc9944',
        backgroundColor: '#000000aa', padding: { x: 6, y: 2 },
      }).setScrollFactor(0).setDepth(200);
    }
    // Sync combat mastery XP from battlesWon (read-only from BattleScene)
    if (G.mastery && G.mastery.combat) {
      G.mastery.combat.xp = wins;
    }
    const combatMastery = (typeof getMasteryInfo === 'function') ? getMasteryInfo(wins) : { name: 'Novice' };
    this.hudMasteryText.setText(`Combat: ${combatMastery.name} (${wins} XP)`);

    // Minimap player dot
    const W = this.scale.width;
    const H = this.scale.height;
    const mmW = 160, mmH = 120;
    const mmX = W - mmW - 8;
    const mmY = H - mmH - 8;
    this.minimapDot.setPosition(mmX + G.x * (mmW / WORLD_W), mmY + G.y * (mmH / WORLD_H));
  }
}
