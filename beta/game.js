'use strict';

// ============================================================
// RUNEFALL — Phase 0.7 "The Run"    v0.7.0
// A 20-level Rune Dice-style run: flick dice from your DICE BAG,
// merges damage enemies, gold dice pay out, shops between fights
// sell dice for your bag, minibosses guard the deep levels.
// ============================================================

const VERSION = 'v0.9.0';

const TUNE = {
  MAX_RESTING_DICE: 28,
  SEED_DICE: 12,
  MAX_VALUE: 6,

  DIE_SIZE_FRAC: 0.092,
  DIE_SIZE_MIN: 34,
  DIE_SIZE_MAX: 72,

  RESTITUTION: 0.7,
  FRICTION_AIR: 0.014,
  FRICTION: 0.01,

  MAX_PULL_FRAC: 0.38,
  MIN_PULL_PX: 26,
  MAX_SPEED_FRAC: 0.04,
  MIN_SPEED_FRAC: 0.22,

  SETTLE_SPEED: 0.35,
  SETTLE_MS: 220,

  TOUCH_SWEEP_MS: 300,

  RISE_MS: 180,
  RISE_HEIGHT_FRAC: 1.0,
  FALL_MS: 420,
  HOP_PAUSE_MS: 90,
  HOP_BASE_MS: 260,
  HOP_PER_PX: 0.5,
  HOP_HEIGHT_FRAC: 1.5,

  BOUNCE_RANGE_FRAC: 4.0,
  LAND_SLIDE: 3.0,

  KNOCK_RADIUS_FRAC: 2.7,
  KNOCK_SPEED: 3.6,
  KNOCK_PER_CHAIN: 0.45,

  SPIN_RATE: 0.05,
  TRAIL_MIN_SPEED: 4,

  PLAYER_HP: 50,
  REFRESH_THROWS: 4,
  BOMB_DAMAGE: 6,
  DETONATE_DAMAGE: 12,
  POTION_HEAL: 6,
  STONE_HITS: 2,
  STONE_HIT_SPEED: 4,
  SPIKE_DAMAGE: 3,
};

// The run: 20 levels. fight / shop / boss (miniboss).
const LEVEL_TRACK = [
  'fight', 'fight', 'shop', 'fight', 'boss',
  'fight', 'shop', 'fight', 'fight', 'boss',
  'shop', 'fight', 'fight', 'shop', 'boss',
  'fight', 'shop', 'fight', 'fight', 'boss',
];

const STARTING_BAG = [
  { kind: 'num', value: 1 }, { kind: 'num', value: 1 },
  { kind: 'num', value: 1 }, { kind: 'num', value: 2 },
  { kind: 'num', value: 2 }, { kind: 'num', value: 3 },
];

const feedback = {
  chainStep(n) {
    try {
      if (navigator.vibrate) navigator.vibrate(Math.min(8 + n * 6, 60));
    } catch (e) { /* no-op */ }
  },
};

const VALUE_COLORS = {
  1: 0xf2efe4, 2: 0xe4bf7e, 3: 0x8ec873,
  4: 0x6fb3dd, 5: 0xa98ae0, 6: 0xf2b23e,
};
const NUMBER_COLOR = '#443355';
const GOLD = '#f2b23e';

const BOARD = {
  frame: 0x4a3226,
  frameGrain: 0x3e2a1e,
  frameHi: 0x5e4130,
  dirt: 0x7b5136,
  dirtDark: 0x6f4830,
  dirtLight: 0x875a3d,
  apron: 0xa4744e,
  cream: '#ead9b8',
  creamDim: '#c9b391',
};

const MOBS = [
  { name: 'imp', color: 0xc95b4a },
  { name: 'slime', color: 0x6aa84f },
  { name: 'brute', color: 0x8e6bb5 },
];

const TOOLTIPS = {
  bomb: 'BOMB DIE\nMerges with its number, then\nblasts nearby dice away and\ndeals its number to ALL enemies',
  potion: 'POTION\nBreaks on impact\nand heals you +6 HP',
  stone: 'CURSED STONE\nBlocks the board.\nTwo hard hits crush it',
  spike: 'SPIKE DIE\nHitting it hurts you:\n-3 HP. It then crumbles',
  wild: 'WILD DIE\nMerges with ANY number\nand becomes its match',
  stun: 'STUN DIE\nBreaks on impact and delays\nevery enemy attack by 2 throws',
  thief: 'THIEF DIE\nTouching it steals 3 gold,\nthen it escapes',
};

function shade(color, f) {
  const r = (color >> 16) & 255, g = (color >> 8) & 255, b = color & 255;
  const ch = (c) => Math.max(0, Math.min(255, Math.round(f > 0 ? c + (255 - c) * f : c * (1 + f))));
  return 'rgb(' + ch(r) + ',' + ch(g) + ',' + ch(b) + ')';
}

function shadeHex(color, f) {
  const rgb = shade(color, f).match(/\d+/g).map(Number);
  return (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
}

class ParticlePool {
  constructor(scene, texture, max) {
    this.scene = scene;
    this.live = [];
    this.free = [];
    for (let i = 0; i < max; i++) {
      const img = scene.add.image(0, 0, texture).setVisible(false).setDepth(18);
      img.setBlendMode(Phaser.BlendModes.ADD);
      this.free.push(img);
    }
  }
  burst(x, y, tint, count, opt) {
    const o = Object.assign({ speedMin: 1.2, speedMax: 4.5, life: 420, scale: 1, drag: 0.94 }, opt);
    for (let i = 0; i < count; i++) {
      const img = this.free.pop() || this.live.shift()?.img;
      if (!img) return;
      const a = Math.random() * Math.PI * 2;
      const sp = o.speedMin + Math.random() * (o.speedMax - o.speedMin);
      img.setVisible(true).setPosition(x, y).setTint(tint).setAlpha(1)
        .setScale(o.scale * (0.6 + Math.random() * 0.8));
      this.live.push({
        img, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: o.life * (0.7 + Math.random() * 0.6), age: 0, drag: o.drag,
        scale0: img.scaleX,
      });
    }
  }
  update(delta) {
    const dt = delta / 16.667;
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      p.age += delta;
      if (p.age >= p.life) {
        p.img.setVisible(false);
        this.free.push(p.img);
        this.live.splice(i, 1);
        continue;
      }
      p.vx *= p.drag; p.vy *= p.drag;
      p.img.x += p.vx * dt; p.img.y += p.vy * dt;
      const t = 1 - p.age / p.life;
      p.img.setAlpha(t).setScale(p.scale0 * (0.4 + 0.6 * t));
    }
  }
}

class GameScene extends Phaser.Scene {
  constructor() { super('game'); }

  create() {
    this.MatterLib = Phaser.Physics.Matter.Matter;

    this.dice = [];
    this.enemies = [];
    this.nextId = 1;
    this.fuseQueue = [];
    this.loftCount = 0;
    this.thrownDie = null;
    this.chain = 0;
    this.bestChain = 0;
    this.ready = false;
    this.aim = null;
    this.fireTime = 0;
    this.trailAccum = 0;
    this.hp = TUNE.PLAYER_HP;
    this.gold = 0;
    this.level = 0;
    this.throws = 0;
    this.refreshIn = TUNE.REFRESH_THROWS;
    this.gameOver = false;
    this.levelClearing = false;
    this.levelClearPending = false;
    this.modalOpen = null;   // 'bag' | 'shop' | 'track' | null
    this.modalObjects = [];

    // the dice bag: your deck. Draw pile empties, then resets.
    this.bag = STARTING_BAG.map(e => ({ ...e }));
    this.drawPile = [];
    this.reshuffleBag();
    this.nextQueue = [this.drawFromBag(), this.drawFromBag(), this.drawFromBag()];

    this.computeLayout();
    this.makeTextures();
    this.buildBoard();
    this.buildWalls();
    this.buildHud();
    this.buildLauncher();

    this.sparks = new ParticlePool(this, 'spark', 120);
    this.trajGfx = this.add.graphics().setDepth(6);
    this.bandGfx = this.add.graphics().setDepth(7);

    this.matter.world.on('collisionstart', (event) => {
      for (const pair of event.pairs) {
        const a = pair.bodyA.dieRef, b = pair.bodyB.dieRef;
        if (a && b) {
          const va = a.body ? a.body.speed : 0, vb = b.body ? b.body.speed : 0;
          const impact = Math.max(va, vb);
          if (this.handleSpecialContact(a, b, impact)) continue;
          this.fuseQueue.push([a, b, impact]);
          if (impact > 3) {
            this.squash(a); this.squash(b);
            const mx = (a.img.x + b.img.x) / 2, my = (a.img.y + b.img.y) / 2;
            this.sparks.burst(mx, my, 0xd9c098, Math.min(6, 2 + impact | 0),
              { speedMin: 0.8, speedMax: 2.5, life: 260, scale: 0.5 });
            a.spinSign = Math.random() < 0.5 ? -1 : 1;
            b.spinSign = -a.spinSign;
          }
        } else if ((a || b) && (pair.bodyA.isStatic || pair.bodyB.isStatic)) {
          const d = a || b;
          if (d.body && d.body.speed > 4) {
            this.squash(d);
            this.sparks.burst(d.img.x, d.img.y, 0xd9c098, 3,
              { speedMin: 0.6, speedMax: 2, life: 220, scale: 0.45 });
            d.spinSign = Math.random() < 0.5 ? -1 : 1;
          }
        }
      }
    });

    this.input.on('pointerdown', (p) => {
      if (this.gameOver) { this.scene.restart(); return; }
      if (this.modalOpen || this.levelClearPending) return;
      if (!this.ready) return;
      this.aim = { sx: p.x, sy: p.y };
    });
    this.input.on('pointermove', (p) => {
      if (this.aim) this.drawAim(p);
    });
    this.input.on('pointerup', (p) => {
      if (!this.aim) return;
      const launch = this.launchVectorFor(p);
      this.aim = null;
      this.trajGfx.clear();
      this.bandGfx.clear();
      if (launch) this.fire(launch);
      else this.previewImg.setPosition(this.launcherPos.x, this.launcherPos.y);
    });

    this.scale.on('resize', () => this.handleResize());
    this.setReady(true);
    this.startLevel(1);
  }

  // ---------- bag ----------

  reshuffleBag() {
    this.drawPile = this.bag.map(e => ({ ...e }));
    Phaser.Utils.Array.Shuffle(this.drawPile);
  }

  drawFromBag() {
    if (this.drawPile.length === 0) this.reshuffleBag();
    return this.drawPile.pop();
  }

  bagRemaining() {
    // dice not yet thrown this cycle = draw pile + what's in the queue
    const counts = {};
    for (const e of [...this.drawPile, ...(this.nextQueue || [])]) {
      const k = e.kind + (this.mergeableKind(e.kind) ? e.value : '');
      counts[k] = (counts[k] || 0) + 1;
    }
    return counts;
  }

  // ---------- levels ----------

  levelType(n) {
    return LEVEL_TRACK[n - 1] || 'fight';
  }

  startLevel(n) {
    this.level = n;
    this.levelClearing = false;
    this.levelClearPending = false;
    this.refreshIn = TUNE.REFRESH_THROWS;
    this.drawRefreshText();
    this.clearBoard();
    for (const e of this.enemies) this.destroyEnemyVisual(e);
    this.enemies = [];
    const type = this.levelType(n);
    this.levelText.setText('LEVEL ' + n + '/' + LEVEL_TRACK.length);
    if (type === 'shop') {
      this.banner('LEVEL ' + n + ' — SHOP', GOLD);
      this.time.delayedCall(600, () => this.openShop());
    } else {
      this.banner(type === 'boss' ? 'LEVEL ' + n + ' — MINIBOSS' : 'LEVEL ' + n,
        type === 'boss' ? '#ff8070' : '#ffd54a');
      this.time.delayedCall(350, () => {
        this.seedLevelBoard();
        this.spawnEnemies();
      });
    }
  }

  levelCfg() {
    const n = this.level, type = this.levelType(n);
    const goldMax = Math.min(1 + Math.floor(n / 5) + (type === 'boss' ? 1 : 0), 6);
    const goldCount = (type === 'boss' ? 5 : 4) + Math.floor(n / 8);
    return { type, goldMax, goldCount };
  }

  clearBoard() {
    for (const d of [...this.dice]) {
      if (d.dead) continue;
      d.dead = true;
      this.detachBody(d);
      this.tweens.add({
        targets: [d.img, d.shadow], alpha: 0, scale: d.img.scale * 0.4,
        duration: 320, ease: 'Quad.easeIn',
        onComplete: () => {
          d.img.destroy(); d.shadow.destroy();
          const idx = this.dice.indexOf(d);
          if (idx >= 0) this.dice.splice(idx, 1);
        },
      });
    }
    this.thrownDie = null;
  }

  seedLevelBoard() {
    const cfg = this.levelCfg();
    this.seedBoard(cfg.goldCount, cfg.goldMax);
    if (cfg.type === 'boss') {
      this.spawnStones(2);
      this.spawnSpikes(2 + Math.floor(this.level / 10));
      if (this.level >= 10) this.spawnHazard('thief', 1);
    } else if (this.level >= 4) {
      this.spawnStones(1);
      if (this.level >= 8) this.spawnHazard('thief', 1);
    }
  }

  spawnEnemies() {
    const n = this.level, type = this.levelType(n);
    const mkEnemy = (mobType, hp, dmg, cd, boss) => {
      const e = {
        type: mobType, hp, maxHp: hp, dmg,
        countdown: cd, baseCountdown: cd,
        alive: true, boss,
        img: this.add.image(0, 0, 'mob' + mobType).setDepth(30).setInteractive(),
        bar: this.add.graphics().setDepth(31),
        cdText: this.add.text(0, 0, '', {
          fontFamily: '-apple-system, Arial, sans-serif', fontSize: '11px',
          color: '#ffb0a0', fontStyle: 'bold',
        }).setOrigin(0.5, 0).setDepth(31),
      };
      const show = () => { if (e.alive) this.showEnemyTip(e); };
      e.img.on('pointerover', show);
      e.img.on('pointerdown', show);
      e.img.on('pointerout', () => this.hideTooltip());
      return e;
    };
    if (type === 'boss') {
      const hp = 20 + n * 5;
      this.enemies = [mkEnemy(Phaser.Math.Between(0, MOBS.length - 1),
        hp, 4 + Math.floor(n * 0.7), n >= 15 ? 2 : 3, true)];
    } else {
      const count = Math.min(1 + Math.floor(n / 5), 3);
      this.enemies = [];
      for (let i = 0; i < count; i++) {
        const hp = 4 + n * 3 + Phaser.Math.Between(0, Math.floor(n / 2));
        const cd = (n >= 12 ? 2 : 3) + (i % 2);
        this.enemies.push(mkEnemy(Phaser.Math.Between(0, MOBS.length - 1),
          hp, 1 + Math.ceil(n * 0.6), cd, false));
      }
    }
    this.layoutEnemies();
  }

  layoutEnemies() {
    const n = this.enemies.length;
    if (!n) return;
    this.enemies.forEach((e, i) => {
      const size = Phaser.Math.Clamp(this.stripH * (e.boss ? 0.95 : 0.72), 36, 96);
      const x = this.W * (0.5 + (i - (n - 1) / 2) * 0.2);
      const y = this.stripH * 0.5;
      e.x = x; e.y = y;
      e.img.setPosition(x, y).setDisplaySize(size, size);
      if (e.boss) e.img.setTint(0xffd0c0);
      this.drawEnemyBar(e);
    });
  }

  drawEnemyBar(e) {
    const w = Math.max(44, this.stripH * (e.boss ? 1.3 : 0.9)), h = 5;
    const x = e.x - w / 2, y = this.stripH - 12;
    e.bar.clear();
    if (!e.alive) { e.cdText.setText(''); return; }
    e.bar.fillStyle(0x241408, 0.8);
    e.bar.fillRoundedRect(x - 1, y - 1, w + 2, h + 2, 2);
    const frac = Math.max(0, e.hp / e.maxHp);
    e.bar.fillStyle(frac > 0.5 ? 0x6aa84f : frac > 0.25 ? 0xe6c229 : 0xc9564a, 1);
    if (frac > 0) e.bar.fillRoundedRect(x, y, w * frac, h, 2);
    if (e.countdown <= 1) {
      e.cdText.setPosition(e.x, y - 16).setText('⚔ 1').setColor('#ff8070');
    } else {
      e.cdText.setPosition(e.x, y - 16).setText('⏳ ' + e.countdown).setColor('#c9b391');
    }
  }

  destroyEnemyVisual(e) {
    e.img.destroy(); e.bar.destroy(); e.cdText.destroy();
  }

  showEnemyTip(e) {
    const name = MOBS[e.type].name.toUpperCase();
    const msg = (e.boss ? 'MINIBOSS — ' : '') + name +
      '\nHP ' + e.hp + '/' + e.maxHp +
      '\nDeals ' + e.dmg + ' damage every ' + e.baseCountdown + ' throws' +
      (e.countdown === 1 ? '\nATTACKS AFTER THIS THROW!' :
        '\nWaiting: attacks in ' + e.countdown + ' throws') +
      '\nSpecial: none (coming later)';
    this.showTooltipText(e.x, e.y + this.stripH * 0.5, msg);
  }

  firstAliveEnemy() {
    return this.enemies.find(e => e.alive) || null;
  }

  dealDamage(amount, fromX, fromY, all) {
    if (this.gameOver) return;
    const targets = all ? this.enemies.filter(e => e.alive)
      : (this.firstAliveEnemy() ? [this.firstAliveEnemy()] : []);
    for (const e of targets) {
      const bolt = this.add.image(fromX, fromY, 'spark').setDepth(32)
        .setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd54a)
        .setScale(1.4);
      this.tweens.add({
        targets: bolt, x: e.x, y: e.y, duration: 260, ease: 'Quad.easeIn',
        onComplete: () => {
          bolt.destroy();
          this.hitEnemy(e, amount);
        },
      });
    }
  }

  hitEnemy(e, amount) {
    if (!e.alive) {
      const next = this.firstAliveEnemy();
      if (next) this.hitEnemy(next, amount);
      return;
    }
    e.hp -= amount;
    this.sparks.burst(e.x, e.y, 0xffd54a, 8, { speedMin: 1, speedMax: 3.5, life: 320, scale: 0.7 });
    this.floatText(e.x, e.y - this.stripH * 0.2, '-' + amount, '#ffd54a', true);
    e.img.setTintFill(0xffffff);
    this.time.delayedCall(70, () => {
      if (e.img.active) { e.img.clearTint(); if (e.boss) e.img.setTint(0xffd0c0); }
    });
    this.tweens.add({
      targets: e.img, y: e.y - 5, duration: 50, yoyo: true,
      onComplete: () => { if (e.img.active) e.img.setY(e.y); },
    });
    if (e.hp <= 0) {
      e.alive = false;
      e.hp = 0;
      this.tweens.add({
        targets: e.img, alpha: 0, scale: e.img.scaleX * 0.4, angle: 40, duration: 320,
        onComplete: () => e.img.setVisible(false),
      });
      this.sparks.burst(e.x, e.y, shadeHex(MOBS[e.type].color, 0.2), 16,
        { speedMin: 1.5, speedMax: 5, life: 500, scale: 1 });
    }
    this.drawEnemyBar(e);
    if (!this.enemies.some(en => en.alive) && !this.levelClearing && this.enemies.length) {
      // don't end the level yet — cascades, coins, and specials may
      // still be resolving. Clear once all dice stop, like a turn.
      this.levelClearing = true;
      this.levelClearPending = true;
    }
  }

  // the board is busy while anything is airborne, merging, thrown,
  // or still physically sliding (bomb shoves keep dice moving long
  // after states settle — refreshes must wait for all of it)
  boardBusy() {
    if (this.thrownDie !== null || this.loftCount > 0) return true;
    for (const d of this.dice) {
      if (d.dead) continue;
      if (d.state === 'active' || d.state === 'loft' || d.state === 'merge') return true;
      if (d.body && d.body.speed > TUNE.SETTLE_SPEED) return true;
    }
    return false;
  }

  onThrowResolved() {
    if (this.gameOver || this.levelClearing) return;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.countdown--;
      if (e.countdown <= 0) {
        e.countdown = e.baseCountdown;
        this.enemyAttack(e);
      }
      this.drawEnemyBar(e);
    }
    this.refreshIn--;
    if (this.refreshIn <= 0) {
      this.refreshIn = TUNE.REFRESH_THROWS;
      this.fieldRefresh();
    }
    this.drawRefreshText();
  }

  fieldRefresh() {
    this.banner('FIELD REFRESH', BOARD.cream);
    const clearing = this.dice.filter(d =>
      !d.dead && d.kind === 'num' && (d.state === 'rest' || d.state === 'active'));
    for (const d of clearing) {
      d.dead = true;
      this.detachBody(d);
      this.tweens.add({
        targets: [d.img, d.shadow], alpha: 0, scale: d.img.scale * 0.4,
        duration: 380, ease: 'Quad.easeIn',
        onComplete: () => {
          d.img.destroy(); d.shadow.destroy();
          const idx = this.dice.indexOf(d);
          if (idx >= 0) this.dice.splice(idx, 1);
        },
      });
    }
    this.time.delayedCall(450, () => {
      if (this.gameOver || this.modalOpen === 'shop') return;
      const cfg = this.levelCfg();
      this.seedBoard(cfg.goldCount, cfg.goldMax);
    });
  }

  drawRefreshText() {
    if (!this.refreshText) return;
    this.refreshText
      .setText('Refresh in ' + this.refreshIn)
      .setColor(this.refreshIn <= 1 ? '#ffd54a' : BOARD.creamDim);
  }

  enemyAttack(e) {
    this.tweens.add({
      targets: e.img, y: e.y + 10, duration: 90, yoyo: true, ease: 'Quad.easeIn',
      onComplete: () => { if (e.img.active) e.img.setY(e.y); },
    });
    const veil = this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0xaa2222, 0.22)
      .setDepth(40);
    this.tweens.add({
      targets: veil, alpha: 0, duration: 300,
      onComplete: () => veil.destroy(),
    });
    this.cameras.main.shake(120, 0.004);
    this.hp = Math.max(0, this.hp - e.dmg);
    this.floatText(this.W * 0.16, this.H - this.rail - 40, '-' + e.dmg, '#ff8070', true);
    this.drawHpBar();
    if (this.hp <= 0) this.doGameOver();
  }

  heal(amount) {
    this.hp = Math.min(TUNE.PLAYER_HP, this.hp + amount);
    this.floatText(this.W * 0.16, this.H - this.rail - 30, '+' + amount, '#8ec873');
    this.drawHpBar();
  }

  addGold(amount, x, y) {
    this.gold += amount;
    this.floatText(x, y, '+' + amount + 'g', GOLD);
    this.sparks.burst(x, y, 0xf2b23e, 8, { speedMin: 1, speedMax: 3, life: 400, scale: 0.7 });
    this.drawGold();
  }

  doGameOver() {
    this.gameOver = true;
    this.closeModal();
    this.aim = null;
    this.trajGfx.clear();
    this.bandGfx.clear();
    this.previewImg.setVisible(false);
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x120a06, 0.78).setDepth(50);
    this.add.text(this.W / 2, this.H * 0.36, 'DEFEATED', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '52px',
      fontStyle: 'bold', color: '#ff8070', stroke: '#2a0f08', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(51);
    this.add.text(this.W / 2, this.H * 0.52,
      'Reached level ' + this.level + '/' + LEVEL_TRACK.length +
      '  ·  Best chain ×' + this.bestChain + '  ·  ' + this.gold + 'g earned', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '18px',
      color: BOARD.cream,
    }).setOrigin(0.5).setDepth(51);
    const tap = this.add.text(this.W / 2, this.H * 0.66, 'TAP TO RETRY', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '22px',
      fontStyle: 'bold', color: '#ffd54a',
    }).setOrigin(0.5).setDepth(51);
    this.tweens.add({ targets: tap, alpha: 0.35, duration: 550, yoyo: true, repeat: -1 });
  }

  doVictory() {
    this.gameOver = true;
    this.closeModal();
    this.previewImg.setVisible(false);
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x120a06, 0.78).setDepth(50);
    this.add.text(this.W / 2, this.H * 0.36, 'VICTORY!', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '52px',
      fontStyle: 'bold', color: GOLD, stroke: '#2a0f08', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(51);
    this.add.text(this.W / 2, this.H * 0.52,
      'All ' + LEVEL_TRACK.length + ' levels cleared  ·  Best chain ×' + this.bestChain +
      '  ·  ' + this.gold + 'g', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '18px',
      color: BOARD.cream,
    }).setOrigin(0.5).setDepth(51);
    const tap = this.add.text(this.W / 2, this.H * 0.66, 'TAP TO PLAY AGAIN', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '22px',
      fontStyle: 'bold', color: '#ffd54a',
    }).setOrigin(0.5).setDepth(51);
    this.tweens.add({ targets: tap, alpha: 0.35, duration: 550, yoyo: true, repeat: -1 });
  }

  // ---------- modals: bag / shop / track ----------

  modalAdd(obj) {
    this.modalObjects.push(obj);
    return obj;
  }

  closeModal() {
    for (const o of this.modalObjects) o.destroy();
    this.modalObjects = [];
    this.modalOpen = null;
  }

  modalBase(title, phWant) {
    for (const o of this.modalObjects) o.destroy();
    this.modalObjects = [];
    const dim = this.modalAdd(this.add.rectangle(
      this.W / 2, this.H / 2, this.W, this.H, 0x120a06, 0.7).setDepth(70).setInteractive());
    const pw = Math.min(this.W * 0.82, 640);
    const ph = phWant ? Math.min(phWant, this.H * 0.94) : Math.min(this.H * 0.78, 400);
    const px = this.W / 2 - pw / 2, py = this.H / 2 - ph / 2;
    const panel = this.modalAdd(this.add.graphics().setDepth(71));
    panel.fillStyle(0x2a1a10, 0.97);
    panel.fillRoundedRect(px, py, pw, ph, 12);
    panel.lineStyle(2, 0x6b4a33, 1);
    panel.strokeRoundedRect(px, py, pw, ph, 12);
    this.modalAdd(this.add.text(this.W / 2, py + 20, title, {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '20px',
      fontStyle: 'bold', color: BOARD.cream,
    }).setOrigin(0.5).setDepth(72));
    return { dim, px, py, pw, ph };
  }

  modalCloseButton(px, py, pw, onClose) {
    const btn = this.modalAdd(this.add.text(px + pw - 14, py + 12, '✕', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '20px',
      fontStyle: 'bold', color: BOARD.creamDim,
    }).setOrigin(1, 0).setDepth(73).setInteractive());
    btn.on('pointerdown', () => onClose());
  }

  // -- bag modal --

  openBag() {
    if (this.modalOpen || this.gameOver) return;
    this.modalOpen = 'bag';
    const { dim, px, py, pw, ph } = this.modalBase('DICE BAG');
    dim.on('pointerdown', () => this.closeModal());
    this.modalCloseButton(px, py, pw, () => this.closeModal());
    const remaining = this.bagRemaining();
    const groups = {};
    for (const e of this.bag) {
      const k = e.kind + (this.mergeableKind(e.kind) ? e.value : '');
      if (!groups[k]) groups[k] = { entry: e, total: 0 };
      groups[k].total++;
    }
    const keys = Object.keys(groups);
    const cols = Math.min(Math.max(keys.length, 1), 6);
    const cellW = pw / (cols + 0.5);
    const s = Math.min(this.dieSize, cellW * 0.55);
    keys.forEach((k, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = px + cellW * (col + 0.75);
      const y = py + 80 + row * (s + 46);
      const g = groups[k];
      const left = remaining[k] || 0;
      const img = this.modalAdd(this.add.image(x, y,
        this.textureFor(g.entry.kind, g.entry.value)).setDepth(72)
        .setDisplaySize(s, s));
      if (left === 0) img.setAlpha(0.3);
      this.modalAdd(this.add.text(x, y + s * 0.62 + 4, left + '/' + g.total + ' left', {
        fontFamily: '-apple-system, Arial, sans-serif', fontSize: '12px',
        color: left === 0 ? '#7a6a55' : BOARD.cream,
      }).setOrigin(0.5, 0).setDepth(72));
    });
    this.modalAdd(this.add.text(this.W / 2, py + ph - 16,
      'A random die is drawn each throw. The bag refills once every die has been thrown.', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '11px',
      color: BOARD.creamDim,
    }).setOrigin(0.5, 1).setDepth(72));
  }

  // -- shop modal --

  shopStock() {
    const n = this.level;
    const tier = n <= 5 ? 1 : n <= 12 ? 2 : 3;
    const pools = {
      1: [
        { kind: 'num', value: 2, price: 5 }, { kind: 'num', value: 3, price: 7 },
        { kind: 'potion', value: 0, price: 6 }, { kind: 'bomb', value: 2, price: 8 },
        { kind: 'num', value: 1, price: 2 }, { kind: 'stun', value: 0, price: 6 },
      ],
      2: [
        { kind: 'num', value: 3, price: 6 }, { kind: 'num', value: 4, price: 10 },
        { kind: 'bomb', value: 3, price: 8 }, { kind: 'potion', value: 0, price: 6 },
        { kind: 'num', value: 5, price: 13 }, { kind: 'stun', value: 0, price: 6 },
        { kind: 'wild', value: 0, price: 14 },
      ],
      3: [
        { kind: 'num', value: 4, price: 9 }, { kind: 'num', value: 5, price: 12 },
        { kind: 'num', value: 6, price: 16 }, { kind: 'bomb', value: 4, price: 8 },
        { kind: 'potion', value: 0, price: 6 }, { kind: 'wild', value: 0, price: 12 },
        { kind: 'stun', value: 0, price: 5 },
      ],
    };
    const pool = Phaser.Utils.Array.Shuffle([...pools[tier]]);
    return {
      offers: pool.slice(0, 4),
      heal: { amount: 10 + tier * 5, price: 5 + tier },
    };
  }

  openShop() {
    if (this.gameOver) return;
    this.modalOpen = 'shop';
    this.renderShop(this.shopStock());
  }

  renderShop(stock) {
    // size the panel from its content so rows never collide
    const pwGuess = Math.min(this.W * 0.82, 640);
    const sGuess = Math.min(this.dieSize * 1.1, (pwGuess / 4) * 0.5);
    const offerBottom = 92 + sGuess * 0.65 + 40;
    const { px, py, pw, ph } = this.modalBase('SHOP — LEVEL ' + this.level,
      offerBottom + 30 + 62 + 36);
    this.modalOpen = 'shop';
    this.modalAdd(this.add.text(px + 16, py + 12, this.gold + 'g', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '18px',
      fontStyle: 'bold', color: GOLD,
    }).setDepth(72));
    const cellW = pw / 4;
    const s = Math.min(this.dieSize * 1.1, cellW * 0.5);
    stock.offers.forEach((o, i) => {
      const x = px + cellW * (i + 0.5);
      const y = py + 92;
      const canAfford = this.gold >= o.price && !o.sold;
      const img = this.modalAdd(this.add.image(x, y,
        this.textureFor(o.kind, o.value)).setDepth(72).setDisplaySize(s, s));
      const labels = {
        bomb: 'Bomb die ' + o.value, potion: 'Potion die',
        wild: 'Wild die', stun: 'Stun die',
      };
      const label = o.kind === 'num' ? 'Die: ' + o.value : labels[o.kind];
      this.modalAdd(this.add.text(x, y + s * 0.65 + 4, label, {
        fontFamily: '-apple-system, Arial, sans-serif', fontSize: '12px',
        color: BOARD.cream,
      }).setOrigin(0.5, 0).setDepth(72));
      this.modalAdd(this.add.text(x, y + s * 0.65 + 22,
        o.sold ? 'SOLD' : o.price + 'g', {
        fontFamily: '-apple-system, Arial, sans-serif', fontSize: '14px',
        fontStyle: 'bold', color: o.sold ? '#7a6a55' : canAfford ? GOLD : '#8a6a50',
      }).setOrigin(0.5, 0).setDepth(72));
      if (!o.sold) {
        img.setInteractive();
        img.on('pointerdown', () => {
          if (this.gold < o.price || o.sold) return;
          this.gold -= o.price;
          o.sold = true;
          this.bag.push({ kind: o.kind, value: o.value });
          this.drawPile.splice(Phaser.Math.Between(0, this.drawPile.length), 0,
            { kind: o.kind, value: o.value });
          this.drawGold();
          this.updateBagCount();
          this.renderShop(stock);
        });
      }
      if (!canAfford && !o.sold) img.setAlpha(0.55);
    });
    const hy = py + 92 + s * 0.65 + 40 + 30;
    const healBtn = this.modalAdd(this.add.text(px + pw * 0.28, hy,
      '❤ Heal +' + stock.heal.amount + ' HP — ' + stock.heal.price + 'g', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '15px',
      fontStyle: 'bold',
      color: this.gold >= stock.heal.price ? '#8ec873' : '#6a7a5a',
      backgroundColor: '#1c120a', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(72).setInteractive());
    healBtn.on('pointerdown', () => {
      if (this.gold < stock.heal.price) return;
      this.gold -= stock.heal.price;
      this.heal(stock.heal.amount);
      this.drawGold();
      this.renderShop(stock);
    });
    this.modalAdd(this.add.text(px + pw * 0.72, hy, 'Special items — coming later', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '13px',
      color: '#7a6a55', fontStyle: 'italic',
      backgroundColor: '#1c120a', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setDepth(72));
    const leave = this.modalAdd(this.add.text(this.W / 2, hy + 56, '▶ LEAVE SHOP', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '17px',
      fontStyle: 'bold', color: '#ffd54a',
      backgroundColor: '#3a2517', padding: { x: 14, y: 7 },
    }).setOrigin(0.5).setDepth(72).setInteractive());
    leave.on('pointerdown', () => {
      this.closeModal();
      this.startLevel(this.level + 1);
    });
  }

  // -- track modal --

  openTrack(autoCloseMs) {
    if (this.gameOver) return;
    this.modalOpen = 'track';
    const { dim, px, py, pw, ph } = this.modalBase('THE RUN');
    dim.on('pointerdown', () => this.closeModal());
    this.modalCloseButton(px, py, pw, () => this.closeModal());
    const total = LEVEL_TRACK.length;
    const perRow = 10;
    const rows = Math.ceil(total / perRow);
    const cellW = pw / (perRow + 1);
    const rowH = (ph - 110) / rows;
    const lineG = this.modalAdd(this.add.graphics().setDepth(71));
    lineG.lineStyle(2, 0x6b4a33, 0.8);
    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / perRow);
      const col = row % 2 === 0 ? i % perRow : perRow - 1 - (i % perRow); // snake
      const x = px + cellW * (col + 1);
      const y = py + 70 + row * rowH;
      if (i > 0) {
        const pr = Math.floor((i - 1) / perRow);
        const pc = pr % 2 === 0 ? (i - 1) % perRow : perRow - 1 - ((i - 1) % perRow);
        lineG.lineBetween(px + cellW * (pc + 1), py + 70 + pr * rowH, x, y);
      }
      const lvl = i + 1, type = LEVEL_TRACK[i];
      const done = lvl < this.level, current = lvl === this.level;
      const nodeCol = done ? 0x3a2a1c :
        type === 'shop' ? 0xf2b23e : type === 'boss' ? 0xc9564a : 0xa08a6a;
      const node = this.modalAdd(this.add.graphics().setDepth(72));
      node.fillStyle(nodeCol, done ? 0.55 : 1);
      node.fillCircle(x, y, 13);
      if (current) {
        node.lineStyle(3, 0xffd54a, 1);
        node.strokeCircle(x, y, 17);
      }
      const icon = type === 'shop' ? '🛒' : type === 'boss' ? '💀' : '⚔';
      this.modalAdd(this.add.text(x, y, icon, { fontSize: '13px' })
        .setOrigin(0.5).setDepth(73).setAlpha(done ? 0.45 : 1));
      this.modalAdd(this.add.text(x, y + 17, String(lvl), {
        fontFamily: '-apple-system, Arial, sans-serif', fontSize: '10px',
        color: current ? '#ffd54a' : BOARD.creamDim,
      }).setOrigin(0.5, 0).setDepth(73));
    }
    this.modalAdd(this.add.text(this.W / 2, py + ph - 14,
      '⚔ fight   🛒 shop   💀 miniboss', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '12px',
      color: BOARD.creamDim,
    }).setOrigin(0.5, 1).setDepth(72));
    if (autoCloseMs) {
      this.time.delayedCall(autoCloseMs, () => {
        if (this.modalOpen === 'track') this.closeModal();
      });
    }
  }

  // ---------- textures ----------

  makeTextures() {
    this.makeDieTextures();
    this.makeGoldDieTextures();
    this.makeSpecialTextures();
    this.makeNewSpecialTextures();
    this.makeMobTextures();
    this.makeBagTexture();
    this.makeSoftTexture('spark', 32, 'rgba(255,255,255,1)', 'rgba(255,255,255,0)');
    this.makeSoftTexture('shadow', 64, 'rgba(20,10,4,0.6)', 'rgba(20,10,4,0)');
    this.makeSoftTexture('flash', 96, 'rgba(255,250,235,0.95)', 'rgba(255,250,235,0)');
  }

  makeSoftTexture(key, px, inner, outer) {
    if (this.textures.exists(key)) this.textures.remove(key);
    const tex = this.textures.createCanvas(key, px, px);
    const ctx = tex.getContext();
    const g = ctx.createRadialGradient(px / 2, px / 2, px * 0.05, px / 2, px / 2, px / 2);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, px, px);
    tex.refresh();
  }

  drawCubeBase(key, color) {
    const px = Math.round(this.dieSize * 2);
    if (this.textures.exists(key)) this.textures.remove(key);
    const tex = this.textures.createCanvas(key, px, px);
    const ctx = tex.getContext();
    const pad = px * 0.03, depth = px * 0.13, r = px * 0.2;
    ctx.clearRect(0, 0, px, px);
    ctx.beginPath();
    this.roundedRectPath(ctx, pad, pad, px - pad * 2, px - pad * 2, r);
    const sideGrad = ctx.createLinearGradient(0, 0, px * 0.3, px);
    sideGrad.addColorStop(0, shade(color, -0.25));
    sideGrad.addColorStop(1, shade(color, -0.48));
    ctx.fillStyle = sideGrad;
    ctx.fill();
    ctx.lineWidth = px * 0.028;
    ctx.strokeStyle = 'rgba(30,15,8,0.55)';
    ctx.stroke();
    const tw = px - pad * 2 - depth;
    ctx.beginPath();
    this.roundedRectPath(ctx, pad, pad, tw, tw, r * 0.85);
    const topGrad = ctx.createLinearGradient(0, pad, 0, pad + tw);
    topGrad.addColorStop(0, shade(color, 0.32));
    topGrad.addColorStop(1, shade(color, 0.02));
    ctx.fillStyle = topGrad;
    ctx.fill();
    ctx.lineWidth = px * 0.02;
    ctx.strokeStyle = 'rgba(30,15,8,0.3)';
    ctx.stroke();
    ctx.beginPath();
    this.roundedRectPath(ctx, pad + px * 0.045, pad + px * 0.045,
      tw - px * 0.09, tw - px * 0.09, r * 0.65);
    ctx.lineWidth = px * 0.02;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.stroke();
    return { tex, ctx, px, pad, tw };
  }

  drawDieNumber(ctx, px, pad, tw, v) {
    const cx = pad + tw / 2, cy = pad + tw / 2;
    ctx.font = `900 ${Math.round(tw * 0.62)}px -apple-system, "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = px * 0.045;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.strokeText(String(v), cx, cy + tw * 0.04);
    ctx.fillStyle = NUMBER_COLOR;
    ctx.fillText(String(v), cx, cy + tw * 0.04);
    const depth = px * 0.13;
    ctx.font = `900 ${Math.round(depth * 0.85)}px -apple-system, Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,245,225,0.5)';
    ctx.fillText(String(v), cx, px - pad - depth * 0.52);
  }

  makeDieTextures() {
    for (let v = 1; v <= TUNE.MAX_VALUE; v++) {
      const { tex, ctx, px, pad, tw } = this.drawCubeBase('die' + v, VALUE_COLORS[v]);
      this.drawDieNumber(ctx, px, pad, tw, v);
      tex.refresh();
    }
  }

  // gold dice: same values, but a gold coin sits behind the number
  makeGoldDieTextures() {
    for (let v = 1; v <= TUNE.MAX_VALUE; v++) {
      const { tex, ctx, px, pad, tw } = this.drawCubeBase('gold' + v, VALUE_COLORS[v]);
      const cx = pad + tw / 2, cy = pad + tw / 2, cr = tw * 0.34;
      const cg = ctx.createRadialGradient(cx - cr * 0.3, cy - cr * 0.3, cr * 0.15, cx, cy, cr);
      cg.addColorStop(0, '#ffe08a');
      cg.addColorStop(0.7, '#f2b23e');
      cg.addColorStop(1, '#c8862a');
      ctx.beginPath();
      ctx.arc(cx, cy + tw * 0.03, cr, 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.fill();
      ctx.lineWidth = px * 0.02;
      ctx.strokeStyle = '#8a5f1e';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy + tw * 0.03, cr * 0.72, 0, Math.PI * 2);
      ctx.lineWidth = px * 0.012;
      ctx.strokeStyle = 'rgba(138,95,30,0.6)';
      ctx.stroke();
      this.drawDieNumber(ctx, px, pad, tw, v);
      tex.refresh();
    }
  }

  makeSpecialTextures() {
    // bombs are numbered: dark cube, bomb ball, amber number on top
    for (let v = 1; v <= TUNE.MAX_VALUE; v++) {
      const { tex, ctx, px, pad, tw } = this.drawCubeBase('bomb' + v, 0x4a4a52);
      const cx = pad + tw / 2, cy = pad + tw / 2, br = tw * 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy + tw * 0.04, br, 0, Math.PI * 2);
      const bg = ctx.createRadialGradient(cx - br * 0.3, cy - br * 0.25, br * 0.2, cx, cy, br);
      bg.addColorStop(0, '#3a3a40');
      bg.addColorStop(1, '#17171c');
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = px * 0.015;
      ctx.stroke();
      ctx.strokeStyle = '#7a5a38';
      ctx.lineWidth = px * 0.035;
      ctx.beginPath();
      ctx.moveTo(cx + br * 0.4, cy - br * 0.7);
      ctx.quadraticCurveTo(cx + br * 0.9, cy - br * 1.3, cx + br * 0.5, cy - br * 1.55);
      ctx.stroke();
      ctx.fillStyle = '#ffb347';
      ctx.beginPath();
      ctx.arc(cx + br * 0.5, cy - br * 1.55, px * 0.045, 0, Math.PI * 2);
      ctx.fill();
      // the number, amber so it reads on the dark face
      ctx.font = `900 ${Math.round(tw * 0.5)}px -apple-system, "Arial Black", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = px * 0.04;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(20,10,5,0.85)';
      ctx.strokeText(String(v), cx, cy + tw * 0.05);
      ctx.fillStyle = '#ffcf7a';
      ctx.fillText(String(v), cx, cy + tw * 0.05);
      tex.refresh();
    }
    {
      const { tex, ctx, px, pad, tw } = this.drawCubeBase('potion', 0xdfe8d2);
      const cx = pad + tw / 2, cy = pad + tw / 2, s = tw * 0.5;
      ctx.fillStyle = '#3f9d4e';
      const arm = s * 0.34;
      ctx.beginPath();
      this.roundedRectPath(ctx, cx - arm / 2, cy - s / 2, arm, s, arm * 0.3);
      ctx.fill();
      ctx.beginPath();
      this.roundedRectPath(ctx, cx - s / 2, cy - arm / 2, s, arm, arm * 0.3);
      ctx.fill();
      tex.refresh();
    }
    for (let stage = 0; stage < 2; stage++) {
      const key = stage === 0 ? 'stone' : 'stone1';
      const { tex, ctx, px, pad, tw } = this.drawCubeBase(key, 0x6e6a63);
      const cx = pad + tw / 2, cy = pad + tw / 2;
      ctx.strokeStyle = 'rgba(40,20,60,0.65)';
      ctx.lineWidth = px * 0.035;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - tw * 0.16, cy - tw * 0.2);
      ctx.lineTo(cx + tw * 0.14, cy - tw * 0.02);
      ctx.lineTo(cx - tw * 0.12, cy + tw * 0.2);
      ctx.stroke();
      if (stage === 1) {
        ctx.strokeStyle = 'rgba(25,20,18,0.8)';
        ctx.lineWidth = px * 0.02;
        ctx.beginPath();
        ctx.moveTo(pad + tw * 0.15, pad + tw * 0.1);
        ctx.lineTo(cx - tw * 0.05, cy);
        ctx.lineTo(pad + tw * 0.2, pad + tw * 0.85);
        ctx.moveTo(cx - tw * 0.05, cy);
        ctx.lineTo(pad + tw * 0.8, cy + tw * 0.3);
        ctx.stroke();
      }
      tex.refresh();
    }
    // spike die: dark purple with spikes — a miniboss's gift
    {
      const { tex, ctx, px, pad, tw } = this.drawCubeBase('spike', 0x5a3a6e);
      const cx = pad + tw / 2, cy = pad + tw / 2;
      ctx.fillStyle = '#2e1a3a';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const bx = cx + Math.cos(a) * tw * 0.18, by = cy + Math.sin(a) * tw * 0.18;
        const txp = cx + Math.cos(a) * tw * 0.42, typ = cy + Math.sin(a) * tw * 0.42;
        const pa = a + Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(bx + Math.cos(pa) * tw * 0.07, by + Math.sin(pa) * tw * 0.07);
        ctx.lineTo(txp, typ);
        ctx.lineTo(bx - Math.cos(pa) * tw * 0.07, by - Math.sin(pa) * tw * 0.07);
        ctx.closePath();
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(cx, cy, tw * 0.16, 0, Math.PI * 2);
      ctx.fillStyle = '#241430';
      ctx.fill();
      tex.refresh();
    }
  }

  makeNewSpecialTextures() {
    // wild: warm cream cube with a plum star
    {
      const { tex, ctx, px, pad, tw } = this.drawCubeBase('wild', 0xf5ecd0);
      const cx = pad + tw / 2, cy = pad + tw / 2, R = tw * 0.3, r = R * 0.45;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? R : r;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = NUMBER_COLOR;
      ctx.fill();
      ctx.lineWidth = px * 0.015;
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.stroke();
      tex.refresh();
    }
    // stun: icy blue cube with a spiral
    {
      const { tex, ctx, px, pad, tw } = this.drawCubeBase('stun', 0xa8d8e8);
      const cx = pad + tw / 2, cy = pad + tw / 2;
      ctx.strokeStyle = '#2a6a8a';
      ctx.lineWidth = px * 0.035;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let t = 0; t <= 4.2; t += 0.1) {
        const rad = tw * 0.05 + t * tw * 0.055;
        const x = cx + Math.cos(t * 1.6) * rad, y = cy + Math.sin(t * 1.6) * rad;
        if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      tex.refresh();
    }
    // thief: maroon cube with a bandit mask
    {
      const { tex, ctx, px, pad, tw } = this.drawCubeBase('thief', 0x6e3a3a);
      const cx = pad + tw / 2, cy = pad + tw / 2;
      ctx.fillStyle = '#241416';
      ctx.beginPath();
      this.roundedRectPath(ctx, pad + tw * 0.12, cy - tw * 0.16, tw * 0.76, tw * 0.3, tw * 0.1);
      ctx.fill();
      for (const s of [-1, 1]) {
        ctx.fillStyle = '#fff4dc';
        ctx.beginPath();
        ctx.ellipse(cx + s * tw * 0.17, cy, tw * 0.09, tw * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#241416';
        ctx.beginPath();
        ctx.arc(cx + s * tw * 0.17, cy, tw * 0.03, 0, Math.PI * 2);
        ctx.fill();
      }
      // a little gold coin it swiped
      ctx.fillStyle = '#f2b23e';
      ctx.beginPath();
      ctx.arc(cx + tw * 0.24, cy + tw * 0.27, tw * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a5f1e';
      ctx.lineWidth = px * 0.012;
      ctx.stroke();
      tex.refresh();
    }
  }

  makeBagTexture() {
    const px = Math.round(this.dieSize * 2);
    if (this.textures.exists('bag')) this.textures.remove('bag');
    const tex = this.textures.createCanvas('bag', px, px);
    const ctx = tex.getContext();
    const cx = px / 2;
    ctx.clearRect(0, 0, px, px);
    const grad = ctx.createLinearGradient(0, px * 0.3, 0, px);
    grad.addColorStop(0, '#9a6a42');
    grad.addColorStop(1, '#6e4426');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#3a2210';
    ctx.lineWidth = px * 0.03;
    ctx.beginPath();
    ctx.moveTo(cx - px * 0.12, px * 0.3);
    ctx.bezierCurveTo(cx - px * 0.45, px * 0.42, cx - px * 0.42, px * 0.92, cx, px * 0.94);
    ctx.bezierCurveTo(cx + px * 0.42, px * 0.92, cx + px * 0.45, px * 0.42, cx + px * 0.12, px * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7c5030';
    ctx.beginPath();
    ctx.ellipse(cx, px * 0.28, px * 0.16, px * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#d9b070';
    ctx.lineWidth = px * 0.035;
    ctx.beginPath();
    ctx.moveTo(cx - px * 0.15, px * 0.3);
    ctx.quadraticCurveTo(cx, px * 0.38, cx + px * 0.15, px * 0.3);
    ctx.stroke();
    ctx.fillStyle = '#f2efe4';
    ctx.strokeStyle = '#3a2210';
    ctx.lineWidth = px * 0.02;
    ctx.beginPath();
    this.roundedRectPath(ctx, cx - px * 0.1, px * 0.1, px * 0.2, px * 0.2, px * 0.04);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = NUMBER_COLOR;
    ctx.beginPath();
    ctx.arc(cx, px * 0.2, px * 0.03, 0, Math.PI * 2);
    ctx.fill();
    tex.refresh();
  }

  makeMobTextures() {
    const px = Math.round(Phaser.Math.Clamp(this.stripH * 0.72, 36, 68) * 2);
    for (let i = 0; i < MOBS.length; i++) {
      const key = 'mob' + i;
      if (this.textures.exists(key)) this.textures.remove(key);
      const tex = this.textures.createCanvas(key, px, px);
      const ctx = tex.getContext();
      const color = MOBS[i].color;
      const cx = px / 2;
      ctx.clearRect(0, 0, px, px);
      const grad = ctx.createLinearGradient(0, 0, 0, px);
      grad.addColorStop(0, shade(color, 0.25));
      grad.addColorStop(1, shade(color, -0.25));
      ctx.fillStyle = grad;
      ctx.strokeStyle = 'rgba(20,10,10,0.5)';
      ctx.lineWidth = px * 0.03;
      ctx.beginPath();
      if (i === 0) {
        ctx.arc(cx, px * 0.58, px * 0.34, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - px * 0.26, px * 0.34);
        ctx.lineTo(cx - px * 0.34, px * 0.08);
        ctx.lineTo(cx - px * 0.12, px * 0.28);
        ctx.moveTo(cx + px * 0.26, px * 0.34);
        ctx.lineTo(cx + px * 0.34, px * 0.08);
        ctx.lineTo(cx + px * 0.12, px * 0.28);
        ctx.fillStyle = shade(color, -0.15);
        ctx.fill();
      } else if (i === 1) {
        ctx.moveTo(cx - px * 0.38, px * 0.86);
        ctx.quadraticCurveTo(cx - px * 0.42, px * 0.22, cx, px * 0.18);
        ctx.quadraticCurveTo(cx + px * 0.42, px * 0.22, cx + px * 0.38, px * 0.86);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      } else {
        this.roundedRectPath(ctx, cx - px * 0.34, px * 0.22, px * 0.68, px * 0.64, px * 0.12);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f0e6d0';
        ctx.beginPath();
        ctx.moveTo(cx - px * 0.2, px * 0.74);
        ctx.lineTo(cx - px * 0.26, px * 0.58);
        ctx.lineTo(cx - px * 0.12, px * 0.7);
        ctx.moveTo(cx + px * 0.2, px * 0.74);
        ctx.lineTo(cx + px * 0.26, px * 0.58);
        ctx.lineTo(cx + px * 0.12, px * 0.7);
        ctx.fill();
      }
      const ey = px * (i === 1 ? 0.48 : 0.52);
      for (const s of [-1, 1]) {
        ctx.fillStyle = '#fff8ee';
        ctx.beginPath();
        ctx.arc(cx + s * px * 0.13, ey, px * 0.085, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#241a1a';
        ctx.beginPath();
        ctx.arc(cx + s * px * 0.13, ey + px * 0.015, px * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = '#241a1a';
      ctx.lineWidth = px * 0.028;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - px * 0.2, ey - px * 0.13);
      ctx.lineTo(cx - px * 0.06, ey - px * 0.08);
      ctx.moveTo(cx + px * 0.2, ey - px * 0.13);
      ctx.lineTo(cx + px * 0.06, ey - px * 0.08);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - px * 0.08, ey + px * 0.16);
      ctx.lineTo(cx + px * 0.08, ey + px * 0.16);
      ctx.stroke();
      tex.refresh();
    }
  }

  roundedRectPath(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------- layout & board ----------

  computeLayout() {
    const W = this.scale.gameSize.width, H = this.scale.gameSize.height;
    this.W = W; this.H = H;
    this.stripH = Phaser.Math.Clamp(H * 0.17, 52, 96);
    this.dieSize = Phaser.Math.Clamp(
      Math.min(W, H - this.stripH) * TUNE.DIE_SIZE_FRAC, TUNE.DIE_SIZE_MIN, TUNE.DIE_SIZE_MAX);
    this.dieRadius = this.dieSize / 2;
    this.rail = Math.max(10, Math.round(this.dieSize * 0.42));
    this.boardTop = this.stripH;
    this.fieldTop = this.stripH + this.rail;
    this.launcherPos = { x: W / 2, y: H - this.dieSize * 1.45 };
    this.maxSpeed = W * TUNE.MAX_SPEED_FRAC;
    this.maxPull = H * TUNE.MAX_PULL_FRAC;
  }

  buildWalls() {
    if (this.walls) for (const w of this.walls) this.matter.world.remove(w);
    const t = 200, { W, H } = this, r = this.rail;
    const opts = { isStatic: true, restitution: 1, friction: 0 };
    this.walls = [
      this.matter.add.rectangle(W / 2, this.fieldTop - t / 2, W + t * 2, t, opts),
      this.matter.add.rectangle(W / 2, H - r + t / 2, W + t * 2, t, opts),
      this.matter.add.rectangle(r - t / 2, H / 2, t, H + t * 2, opts),
      this.matter.add.rectangle(W - r + t / 2, H / 2, t, H + t * 2, opts),
    ];
  }

  handleResize() {
    this.computeLayout();
    this.buildWalls();
    this.buildBoard();
    this.layoutHud();
    this.layoutLauncher();
    this.layoutEnemies();
    for (const d of this.dice) {
      if (!d.body) continue;
      const m = this.rail + this.dieRadius;
      const x = Phaser.Math.Clamp(d.body.position.x, m, this.W - m);
      const y = Phaser.Math.Clamp(d.body.position.y, this.fieldTop + this.dieRadius, this.H - m);
      this.MatterLib.Body.setPosition(d.body, { x, y });
    }
  }

  buildBoard() {
    if (this.boardGfx) this.boardGfx.destroy();
    const g = this.add.graphics().setDepth(0);
    this.boardGfx = g;
    const { W, H } = this, r = this.rail, top = this.boardTop;
    g.fillStyle(0x1b2418, 1);
    g.fillRect(0, 0, W, top);
    g.fillStyle(0x243019, 1);
    for (let x = 0; x < W; x += 46) {
      g.fillEllipse(x + 20, top * 0.35, 52, top * 0.8);
    }
    g.fillStyle(0x4a7c3a, 1);
    g.fillRect(0, top - 6, W, 6);
    g.fillStyle(0x3c6830, 1);
    for (let x = 0; x < W; x += 13) {
      g.fillTriangle(x, top - 6, x + 4, top - 13, x + 8, top - 6);
    }
    g.fillStyle(BOARD.frame, 1);
    g.fillRect(0, top, W, H - top);
    g.lineStyle(2, BOARD.frameGrain, 0.7);
    for (let y = top + 6; y < H; y += 14) {
      g.lineBetween(0, y, W, y);
    }
    g.fillStyle(BOARD.dirt, 1);
    g.fillRoundedRect(r, this.fieldTop, W - r * 2, H - this.fieldTop - r, r * 0.6);
    for (let i = 0; i < 70; i++) {
      const bx = r + Math.random() * (W - r * 2);
      const by = this.fieldTop + Math.random() * (H - this.fieldTop - r);
      const br = 8 + Math.random() * 30;
      g.fillStyle(Math.random() < 0.5 ? BOARD.dirtDark : BOARD.dirtLight,
        0.10 + Math.random() * 0.12);
      g.fillEllipse(bx, by, br * 2, br * 1.2);
    }
    for (let i = 0; i < 4; i++) {
      g.lineStyle(3, 0x241408, 0.18 - i * 0.035);
      g.strokeRoundedRect(r + 1 + i * 3, this.fieldTop + 1 + i * 3,
        W - (r + 1 + i * 3) * 2, H - this.fieldTop - r - 1 - i * 6 + 4, r * 0.6);
    }
    g.lineStyle(2, BOARD.frameHi, 0.9);
    g.strokeRoundedRect(r - 2, this.fieldTop - 2, W - (r - 2) * 2, H - this.fieldTop - r + 4, r * 0.6);
    g.fillStyle(0x241408, 0.35);
    g.fillCircle(this.launcherPos.x, this.launcherPos.y, this.dieRadius * 2.2);
    g.lineStyle(2, BOARD.apron, 0.6);
    g.strokeCircle(this.launcherPos.x, this.launcherPos.y, this.dieRadius * 2.2);
  }

  // ---------- dice ----------

  textureFor(kind, value, gold) {
    if (kind === 'num') return (gold ? 'gold' : 'die') + value;
    if (kind === 'bomb') return 'bomb' + value;
    return kind;
  }

  makeDie(x, y, value, state, kind, gold) {
    kind = kind || 'num';
    const shadow = this.add.image(x, y + this.dieSize * 0.16, 'shadow')
      .setDisplaySize(this.dieSize * 1.15, this.dieSize * 0.55)
      .setAlpha(0.35).setDepth(8);
    const img = this.add.image(x, y, this.textureFor(kind, value, gold))
      .setDisplaySize(this.dieSize, this.dieSize).setDepth(10);
    const die = {
      id: this.nextId++, value, kind, gold: !!gold, img, shadow, body: null,
      baseScale: img.scaleX,
      state,
      gx: x, gy: y, h: 0, popScale: 1,
      spinSign: Math.random() < 0.5 ? -1 : 1,
      slowMs: 0, restingSince: 0, dead: false, reserved: false,
      leftLauncher: true,
      stoneHits: 0,
    };
    if (state !== 'loft') this.attachBody(die, x, y);
    if (kind !== 'num') {
      img.setInteractive();
      const show = () => { if (!die.dead) this.showTooltip(die.gx, die.gy, kind); };
      img.on('pointerover', show);
      img.on('pointerdown', show);
      img.on('pointerout', () => this.hideTooltip());
    }
    this.dice.push(die);
    return die;
  }

  attachBody(die, x, y) {
    const heavy = die.kind === 'stone';
    const body = this.matter.add.circle(x, y, this.dieRadius * 0.96, {
      restitution: heavy ? 0.2 : TUNE.RESTITUTION,
      frictionAir: heavy ? 0.08 : TUNE.FRICTION_AIR,
      friction: TUNE.FRICTION,
      density: heavy ? 0.008 : 0.001,
    });
    body.dieRef = die;
    die.body = body;
  }

  detachBody(die) {
    if (die.body) {
      this.matter.world.remove(die.body);
      die.body.dieRef = null;
      die.body = null;
    }
  }

  destroyDie(die) {
    die.dead = true;
    this.detachBody(die);
    die.img.destroy();
    die.shadow.destroy();
    const i = this.dice.indexOf(die);
    if (i >= 0) this.dice.splice(i, 1);
  }

  consumeDie(die) {
    die.dead = true;
    if (die === this.thrownDie) this.thrownDie = null;
    this.detachBody(die);
    this.sparks.burst(die.img.x, die.img.y, 0xc9a878, 8,
      { speedMin: 0.5, speedMax: 2, life: 300, scale: 0.6 });
    this.tweens.add({
      targets: [die.img, die.shadow],
      x: this.launcherPos.x, y: this.launcherPos.y,
      scale: 0, alpha: 0, duration: 260, ease: 'Quad.easeIn',
      onComplete: () => {
        die.img.destroy(); die.shadow.destroy();
        const i = this.dice.indexOf(die);
        if (i >= 0) this.dice.splice(i, 1);
      },
    });
  }

  renderAir(die) {
    const hn = Phaser.Math.Clamp(die.h / (this.dieSize * 1.6), 0, 1);
    die.img.setPosition(die.gx, die.gy - die.h);
    die.img.setScale(die.baseScale * (1 + 0.45 * hn) * die.popScale);
    die.shadow.setPosition(die.gx, die.gy + this.dieSize * 0.16);
    die.shadow.setAlpha(0.35 * (1 - 0.65 * hn));
  }

  weightedValue() {
    const r = Math.random();
    if (r < 0.45) return 1;
    if (r < 0.80) return 2;
    return 3;
  }

  findSeedSpot(placed, minGap) {
    const m = this.rail + this.dieSize;
    const yMin = this.fieldTop + this.dieSize;
    const yMax = this.fieldTop + (this.H - this.fieldTop) * 0.55;
    for (let tries = 0; tries < 60; tries++) {
      const x = Phaser.Math.Between(m, this.W - m);
      const y = Phaser.Math.Between(yMin, yMax);
      if (placed.every(p => Phaser.Math.Distance.Between(p.x, p.y, x, y) > minGap) &&
        this.dice.every(d => d.dead ||
          Phaser.Math.Distance.Between(d.gx, d.gy, x, y) > minGap)) {
        placed.push({ x, y });
        return { x, y };
      }
    }
    return null;
  }

  seedBoard(goldCount, goldMax) {
    const placed = [];
    const minGap = this.dieSize * 1.4;
    const rollIn = (d, i) => {
      d.restingSince = this.time.now;
      d.img.setScale(0);
      d.img.rotation = Math.random() * Math.PI;
      this.tweens.add({
        targets: d.img, scale: d.baseScale, rotation: 0,
        duration: 320, delay: i * 45, ease: 'Back.easeOut',
      });
      // seeds spawn dead-still: any drift can bring equal dice into
      // contact, and touching equals merge — boards must not self-play
    };
    for (let i = 0; i < TUNE.SEED_DICE; i++) {
      const spot = this.findSeedSpot(placed, minGap);
      if (!spot) break;
      rollIn(this.makeDie(spot.x, spot.y, this.weightedValue(), 'rest'), i);
    }
    // gold dice: the level's treasure
    for (let i = 0; i < (goldCount || 0); i++) {
      const spot = this.findSeedSpot(placed, minGap);
      if (!spot) break;
      const gm = Math.max(1, goldMax || 1);
      const v = 1 + Math.floor(Math.random() * gm);
      rollIn(this.makeDie(spot.x, spot.y, Math.min(v, gm), 'rest', 'num', true),
        TUNE.SEED_DICE + i);
    }
  }

  spawnStones(count) {
    const placed = [];
    const existing = this.dice.filter(d => d.kind === 'stone' && !d.dead).length;
    for (let i = 0; i < count && existing + i < 3; i++) {
      const spot = this.findSeedSpot(placed, this.dieSize * 1.5);
      if (!spot) break;
      const d = this.makeDie(spot.x, spot.y, 0, 'rest', 'stone');
      d.restingSince = this.time.now;
      d.img.setScale(0);
      this.tweens.add({
        targets: d.img, scale: d.baseScale, duration: 300, ease: 'Back.easeOut',
      });
      this.sparks.burst(spot.x, spot.y, 0x8a97ad, 8, { speedMin: 0.5, speedMax: 2, life: 300, scale: 0.6 });
    }
  }

  spawnSpikes(count) {
    this.spawnHazard('spike', count);
  }

  spawnHazard(kind, count) {
    const tint = kind === 'spike' ? 0x8a5aa8 : 0x6e3a3a;
    const placed = [];
    for (let i = 0; i < count; i++) {
      const spot = this.findSeedSpot(placed, this.dieSize * 1.5);
      if (!spot) break;
      const d = this.makeDie(spot.x, spot.y, 0, 'rest', kind);
      d.restingSince = this.time.now;
      d.img.setScale(0);
      this.tweens.add({
        targets: d.img, scale: d.baseScale, duration: 300, ease: 'Back.easeOut',
      });
      this.sparks.burst(spot.x, spot.y, tint, 8, { speedMin: 0.5, speedMax: 2, life: 300, scale: 0.6 });
    }
  }

  // ---------- special dice behavior ----------

  handleSpecialContact(a, b, impact) {
    let handled = false;
    for (const [x, other] of [[a, b], [b, a]]) {
      if (x.dead || other.dead) continue;
      const hard = (k) => k === 'num' || k === 'bomb' || k === 'wild';
      if (x.kind === 'potion' && impact > 0.8) {
        this.consumePotion(x);
        handled = true;
      } else if (x.kind === 'stun' && impact > 0.8) {
        this.consumeStun(x);
        handled = true;
      } else if (x.kind === 'thief' && hard(other.kind) && impact > 1.0) {
        this.triggerThief(x);
        handled = true;
      } else if (x.kind === 'stone' && hard(other.kind) &&
        impact > TUNE.STONE_HIT_SPEED) {
        this.hitStone(x);
        handled = true;
      } else if (x.kind === 'spike' && hard(other.kind) && impact > 1.2) {
        this.triggerSpike(x);
        handled = true;
      }
    }
    return handled;
  }

  // fired when a bomb die merges with its number
  bombBlast(x, y, riseH, value) {
    const apexY = y - riseH;
    const flash = this.add.image(x, apexY, 'flash').setDepth(19)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(this.dieSize * 2, this.dieSize * 2);
    this.tweens.add({
      targets: flash, alpha: 0, scale: flash.scaleX * 2.6, duration: 300,
      onComplete: () => flash.destroy(),
    });
    const ring = this.add.graphics().setDepth(19).setPosition(x, y);
    ring.lineStyle(5, 0xff8040, 1);
    ring.strokeCircle(0, 0, this.dieRadius);
    this.tweens.add({
      targets: ring, scale: 5, alpha: 0, duration: 450,
      onComplete: () => ring.destroy(),
    });
    this.sparks.burst(x, apexY, 0xff8040, 24, { speedMin: 2, speedMax: 7, life: 550, scale: 1.1 });
    this.sparks.burst(x, y, 0x4a4a52, 10, { speedMin: 1, speedMax: 4, life: 450, scale: 0.8 });
    // the point of the bomb: shove everything HARD
    this.knockback(x, y, this.dieSize * TUNE.KNOCK_RADIUS_FRAC * 1.9, TUNE.KNOCK_SPEED * 2.4);
    for (const d of [...this.dice]) {
      if ((d.kind === 'stone' || d.kind === 'spike') && !d.dead &&
        Phaser.Math.Distance.Between(d.gx, d.gy, x, y) < this.dieSize * TUNE.KNOCK_RADIUS_FRAC * 1.4) {
        if (d.kind === 'stone') this.hitStone(d);
        else this.crumbleSpike(d);
      }
    }
    this.cameras.main.shake(200, 0.006);
    this.dealDamage(value, x, apexY, true);
    feedback.chainStep(4);
  }

  consumePotion(die) {
    if (die.dead) return;
    const x = die.gx, y = die.gy;
    if (die === this.thrownDie) this.thrownDie = null;
    this.destroyDie(die);
    this.sparks.burst(x, y, 0x3f9d4e, 16, { speedMin: 1, speedMax: 4, life: 500, scale: 0.9 });
    this.heal(TUNE.POTION_HEAL);
  }

  consumeStun(die) {
    if (die.dead) return;
    const x = die.gx, y = die.gy;
    if (die === this.thrownDie) this.thrownDie = null;
    this.destroyDie(die);
    this.sparks.burst(x, y, 0x7ec8e8, 18, { speedMin: 1, speedMax: 4, life: 500, scale: 0.9 });
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.countdown = Math.min(e.countdown + 2, 9);
      this.floatText(e.x, e.y - this.stripH * 0.15, '+2 ⏳', '#7ec8e8');
      this.drawEnemyBar(e);
    }
  }

  triggerThief(die) {
    if (die.dead) return;
    const x = die.gx, y = die.gy;
    const stolen = Math.min(this.gold, 3);
    this.gold -= stolen;
    this.drawGold();
    this.floatText(x, y - 10, '-' + stolen + 'g', '#c9564a', true);
    this.destroyDie(die);
    this.sparks.burst(x, y, 0x6e3a3a, 12, { speedMin: 1.5, speedMax: 4, life: 400, scale: 0.8 });
  }

  hitStone(die) {
    if (die.dead) return;
    die.stoneHits++;
    this.sparks.burst(die.gx, die.gy, 0x9a958c, 8, { speedMin: 1, speedMax: 3, life: 350, scale: 0.7 });
    this.cameras.main.shake(60, 0.002);
    if (die.stoneHits >= TUNE.STONE_HITS) {
      const x = die.gx, y = die.gy;
      this.destroyDie(die);
      this.sparks.burst(x, y, 0x6e6a63, 16, { speedMin: 1.5, speedMax: 5, life: 500, scale: 1 });
      this.floatText(x, y - 10, 'CRUSHED', BOARD.creamDim);
    } else {
      die.img.setTexture('stone1').setDisplaySize(this.dieSize, this.dieSize);
      this.squash(die);
    }
  }

  triggerSpike(die) {
    if (die.dead) return;
    this.hp = Math.max(0, this.hp - TUNE.SPIKE_DAMAGE);
    this.floatText(die.gx, die.gy - 10, '-' + TUNE.SPIKE_DAMAGE + ' HP', '#ff8070', true);
    const veil = this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0xaa22aa, 0.15)
      .setDepth(40);
    this.tweens.add({ targets: veil, alpha: 0, duration: 250, onComplete: () => veil.destroy() });
    this.drawHpBar();
    this.crumbleSpike(die);
    if (this.hp <= 0) this.doGameOver();
  }

  crumbleSpike(die) {
    if (die.dead) return;
    const x = die.gx, y = die.gy;
    this.destroyDie(die);
    this.sparks.burst(x, y, 0x8a5aa8, 14, { speedMin: 1.5, speedMax: 4.5, life: 450, scale: 0.9 });
  }

  // ---------- launcher ----------

  buildLauncher() {
    this.previewImg = this.add.image(0, 0, 'die1').setDepth(12);
    this.nextLabel = this.add.text(0, 0, 'NEXT', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '11px',
      color: BOARD.creamDim, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);
    this.queueImgs = [
      this.add.image(0, 0, 'die1').setDepth(11).setAlpha(0.8),
      this.add.image(0, 0, 'die1').setDepth(11).setAlpha(0.55),
    ];
    const tipFor = (idx, img) => {
      const show = () => {
        const e = this.nextQueue[idx];
        if (e && e.kind !== 'num') this.showTooltip(img.x, img.y, e.kind);
      };
      img.setInteractive();
      img.on('pointerover', show);
      img.on('pointerdown', show);
      img.on('pointerout', () => this.hideTooltip());
    };
    tipFor(0, this.previewImg);
    tipFor(1, this.queueImgs[0]);
    tipFor(2, this.queueImgs[1]);
    // the dice bag button
    this.bagImg = this.add.image(0, 0, 'bag').setDepth(12).setInteractive();
    this.bagImg.on('pointerdown', () => this.openBag());
    this.bagCount = this.add.text(0, 0, '', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '12px',
      fontStyle: 'bold', color: BOARD.cream,
    }).setOrigin(0.5, 0).setDepth(12);
    this.layoutLauncher();
  }

  layoutLauncher() {
    const { x, y } = this.launcherPos, s = this.dieSize;
    const q = this.nextQueue;
    this.previewImg.setPosition(x, y)
      .setTexture(this.textureFor(q[0].kind, q[0].value)).setDisplaySize(s, s);
    this.queueImgs[0].setPosition(x + s * 2.1, y + s * 0.12)
      .setTexture(this.textureFor(q[1].kind, q[1].value)).setDisplaySize(s * 0.55, s * 0.55);
    this.queueImgs[1].setPosition(x + s * 2.95, y + s * 0.12)
      .setTexture(this.textureFor(q[2].kind, q[2].value)).setDisplaySize(s * 0.42, s * 0.42);
    this.nextLabel.setPosition(x + s * 2.5, y - s * 0.55);
    this.bagImg.setPosition(this.W - this.rail - s * 0.9, this.H - this.rail - s * 0.95)
      .setDisplaySize(s * 1.3, s * 1.3);
    this.bagCount.setPosition(this.bagImg.x, this.bagImg.y + s * 0.72);
    this.updateBagCount();
  }

  updateBagCount() {
    if (!this.bagCount) return;
    const left = this.drawPile.length + this.nextQueue.length;
    this.bagCount.setText(left + '/' + this.bag.length);
  }

  setReady(ready) {
    this.ready = ready;
    if (this.gameOver) return;
    this.previewImg.setVisible(ready);
    if (ready) {
      this.layoutLauncher();
      const target = this.previewImg.scaleX;
      this.previewImg.setAlpha(0).setScale(target * 0.6);
      this.tweens.add({
        targets: this.previewImg, alpha: 1, scale: target,
        duration: 160, ease: 'Back.easeOut',
      });
      this.enforceClutterCap();
    }
  }

  get nextValue() { return this.nextQueue[0].value; }
  set nextValue(v) { this.nextQueue[0] = { kind: 'num', value: v }; this.layoutLauncher(); }

  launchVectorFor(pointer) {
    const dx = this.aim.sx - pointer.x, dy = this.aim.sy - pointer.y;
    const pull = Math.hypot(dx, dy);
    if (pull < TUNE.MIN_PULL_PX) return null;
    const frac = Math.min(pull, this.maxPull) / this.maxPull;
    const speed = this.maxSpeed * (TUNE.MIN_SPEED_FRAC + (1 - TUNE.MIN_SPEED_FRAC) * frac);
    return { x: (dx / pull) * speed, y: (dy / pull) * speed, frac };
  }

  fire(vel) {
    this.setReady(false);
    this.chain = 0;
    this.fireTime = this.time.now;
    this.throws++;
    const entry = this.nextQueue[0];
    const { x, y } = this.launcherPos;
    const die = this.makeDie(x, y, entry.value, 'active', entry.kind);
    die.leftLauncher = false;
    this.MatterLib.Body.setVelocity(die.body, { x: vel.x, y: vel.y });
    die.spinSign = vel.x >= 0 ? 1 : -1;
    this.thrownDie = die;
    this.nextQueue.shift();
    this.nextQueue.push(this.drawFromBag());
    this.updateBagCount();
    this.sparks.burst(x, y, 0xead9b8, 6, { speedMin: 1, speedMax: 3, life: 240, scale: 0.5 });
  }

  // ---------- aiming ----------

  drawAim(pointer) {
    const { x: lx, y: ly } = this.launcherPos;
    const launch = this.launchVectorFor(pointer);
    const band = this.bandGfx;
    band.clear();
    this.trajGfx.clear();

    let ox = pointer.x - this.aim.sx, oy = pointer.y - this.aim.sy;
    const olen = Math.hypot(ox, oy), omax = this.dieSize * 2.2;
    if (olen > omax) { ox = ox / olen * omax; oy = oy / olen * omax; }
    const px = lx + ox, py = ly + oy;
    this.previewImg.setPosition(px, py);

    if (!launch) return;

    const pc = Phaser.Display.Color.Interpolate.ColorWithColor(
      new Phaser.Display.Color(234, 217, 184),
      new Phaser.Display.Color(255, 96, 64), 100, Math.round(launch.frac * 100));
    const bandTint = Phaser.Display.Color.GetColor(pc.r, pc.g, pc.b);
    band.lineStyle(3, bandTint, 0.9);
    const perp = Math.atan2(oy, ox) + Math.PI / 2;
    const rr = this.dieRadius * 1.4;
    band.beginPath();
    band.moveTo(lx + Math.cos(perp) * rr, ly + Math.sin(perp) * rr);
    band.lineTo(px, py);
    band.lineTo(lx - Math.cos(perp) * rr, ly - Math.sin(perp) * rr);
    band.strokePath();

    const g = this.trajGfx;
    let sx = lx, sy = ly;
    let vx = launch.x, vy = launch.y;
    const r = this.dieRadius, rail = this.rail;
    const decay = 1 - TUNE.FRICTION_AIR;
    const loX = rail + r, loY = this.fieldTop + r;
    const hiX = this.W - rail - r, hiY = this.H - rail - r;
    const candidates = this.dice.filter(d =>
      d.body && !d.dead && d !== this.thrownDie && d.state === 'rest');
    let hitDie = null;
    let travelled = 0, nextDot = 0;
    for (let step = 0; step < 130 && !hitDie; step++) {
      vx *= decay; vy *= decay;
      sx += vx; sy += vy;
      travelled += Math.hypot(vx, vy);
      if (sx < loX) { sx = loX + (loX - sx); vx = -vx * TUNE.RESTITUTION; }
      if (sx > hiX) { sx = hiX - (sx - hiX); vx = -vx * TUNE.RESTITUTION; }
      if (sy < loY) { sy = loY + (loY - sy); vy = -vy * TUNE.RESTITUTION; }
      if (sy > hiY) { sy = hiY - (sy - hiY); vy = -vy * TUNE.RESTITUTION; }
      for (const d of candidates) {
        if (Phaser.Math.Distance.Between(sx, sy, d.body.position.x, d.body.position.y) < r * 1.92) {
          hitDie = d;
          break;
        }
      }
      if (travelled >= nextDot) {
        nextDot = travelled + this.dieSize * 0.55;
        g.fillStyle(0xf5e6c8, 0.8);
        g.fillCircle(sx, sy, Math.max(2.5, r * 0.16));
      }
      if (Math.hypot(vx, vy) < 0.5) break;
    }
    if (hitDie) {
      const thrown = this.nextQueue[0];
      let c = 0xf5e6c8, strong = false;
      const match = this.canMerge(
        { kind: thrown.kind, value: thrown.value }, hitDie);
      if (thrown.kind === 'potion') { c = 0x3f9d4e; strong = true; }
      else if (thrown.kind === 'stun') { c = 0x7ec8e8; strong = true; }
      else if (hitDie.kind === 'spike') { c = 0xaa55cc; strong = true; }
      else if (hitDie.kind === 'thief') { c = 0xc9564a; strong = true; }
      else if (match && (thrown.kind === 'bomb' || hitDie.kind === 'bomb')) { c = 0xff8040; strong = true; }
      else if (match) { c = 0x8ec873; strong = true; }
      const pulse = 1 + 0.08 * Math.sin(this.time.now / 90);
      g.lineStyle(3, c, strong ? 1 : 0.5);
      g.strokeCircle(hitDie.body.position.x, hitDie.body.position.y,
        this.dieRadius * 1.35 * (strong ? pulse : 1));
    }
  }

  // ---------- fuse & cascade ----------

  processFuseQueue() {
    while (this.fuseQueue.length) {
      const [a, b] = this.fuseQueue.shift();
      if (a.dead || b.dead) continue;
      if (!this.canMerge(a, b)) continue;
      if (a.state !== 'rest' && a.state !== 'active') continue;
      if (b.state !== 'rest' && b.state !== 'active') continue;
      this.fuse(a, b);
    }
  }

  mergeableKind(k) {
    return k === 'num' || k === 'bomb';
  }

  canMerge(a, b) {
    const m = (k) => k === 'num' || k === 'bomb';
    if (a.kind === 'wild' && m(b.kind)) return true;
    if (b.kind === 'wild' && m(a.kind)) return true;
    return m(a.kind) && m(b.kind) && a.value === b.value;
  }

  touchSweep() {
    const touchDist = this.dieRadius * 0.96 * 2 + 3;
    const sweepKind = (k) => k === 'num' || k === 'bomb' || k === 'wild';
    for (let i = 0; i < this.dice.length; i++) {
      const a = this.dice[i];
      if (a.dead || !sweepKind(a.kind) || !a.body) continue;
      if (a.state !== 'rest' && a.state !== 'active') continue;
      for (let j = i + 1; j < this.dice.length; j++) {
        const b = this.dice[j];
        if (b.dead || !b.body || !this.canMerge(a, b)) continue;
        if (b.state !== 'rest' && b.state !== 'active') continue;
        if (Phaser.Math.Distance.Between(a.gx, a.gy, b.gx, b.gy) < touchDist) {
          this.fuseQueue.push([a, b, 0]);
        }
      }
    }
  }

  fuse(a, b) {
    const value = a.kind === 'wild' ? b.value : a.value;
    for (const d of [a, b]) {
      d.reserved = true;
      if (d === this.thrownDie) this.thrownDie = null;
      this.detachBody(d);
      if (d.state !== 'loft') { d.gx = d.img.x; d.gy = d.img.y; }
      d.state = 'merge';
      d.sx = d.gx; d.sy = d.gy; d.hStart = d.h;
      d.startRot = d.img.rotation;
      d.img.setDepth(20);
    }
    this.loftCount++;
    const mx = (a.gx + b.gx) / 2, my = (a.gy + b.gy) / 2;
    const riseH = this.dieSize * TUNE.RISE_HEIGHT_FRAC + (a.h + b.h) / 2;
    const c = { t: 0 };
    this.tweens.add({
      targets: c, t: 1, duration: TUNE.RISE_MS, ease: 'Quad.easeOut',
      onUpdate: () => {
        for (const d of [a, b]) {
          if (d.dead) continue;
          d.gx = d.sx + (mx - d.sx) * c.t;
          d.gy = d.sy + (my - d.sy) * c.t;
          d.h = d.hStart + (riseH - d.hStart) * c.t;
          d.img.rotation = d.startRot * (1 - c.t);
          this.renderAir(d);
        }
      },
      onComplete: () => {
        if (a.dead || b.dead) { this.loftCount--; return; }
        this.completeMerge(a, b, mx, my, riseH, value);
      },
    });
  }

  completeMerge(a, b, mx, my, riseH, value) {
    if (window.RUNEFALL_DEBUG) {
      console.log('MERGE ' + value + '+' + value + ' -> ' + (value + 1) +
        ' at ' + Math.round(mx) + ',' + Math.round(my) + ' chain->' + (this.chain + 1));
    }
    // gold dice pay out when merged
    for (const d of [a, b]) {
      if (d.gold) this.addGold(d.value, mx, my - riseH - 14);
    }
    this.destroyDie(a);
    this.destroyDie(b);

    this.chain++;
    if (this.chain > this.bestChain) this.bestChain = this.chain;
    feedback.chainStep(this.chain);
    this.flashChain();

    // a bomb in the pair: no merged die — a blast that shoves the
    // board apart (hopefully into new merges) and hits EVERY enemy
    // for the bomb's number
    if (a.kind === 'bomb' || b.kind === 'bomb') {
      this.bombBlast(mx, my, riseH, value);
      this.loftCount--;
      return;
    }

    this.mergeImpact(mx, my, riseH, value);

    const newValue = value + 1;
    this.dealDamage(newValue > TUNE.MAX_VALUE ? TUNE.DETONATE_DAMAGE : newValue,
      mx, my - riseH, newValue > TUNE.MAX_VALUE);

    if (newValue > TUNE.MAX_VALUE) {
      this.detonate(mx, my, riseH);
      this.loftCount--;
      return;
    }

    const die = this.makeDie(mx, my, newValue, 'loft');
    die.gx = mx; die.gy = my; die.h = riseH;
    die.img.setDepth(20);
    die.shadow.setDepth(7);
    die.popScale = 0.3;
    this.tweens.add({
      targets: die, popScale: 1, duration: 150, ease: 'Back.easeOut',
      onUpdate: () => this.renderAir(die),
    });
    this.renderAir(die);

    this.time.delayedCall(150 + TUNE.HOP_PAUSE_MS, () => {
      if (die.dead) { this.loftCount--; return; }
      const target = this.findNearestResting(newValue, die);
      if (target) this.bounceToward(die, target);
      else this.fallToGround(die);
    });
  }

  bounceToward(die, target) {
    const sx = die.gx, sy = die.gy, h0 = die.h;
    const tx = target.body ? target.body.position.x : target.img.x;
    const ty = target.body ? target.body.position.y : target.img.y;
    const dist = Phaser.Math.Distance.Between(sx, sy, tx, ty);
    if (dist < 1) { this.fallToGround(die); return; }
    const range = this.dieSize * TUNE.BOUNCE_RANGE_FRAC;
    const travel = Math.min(dist, range);
    const dirX = (tx - sx) / dist, dirY = (ty - sy) / dist;
    const m = this.rail + this.dieRadius;
    const ex = Phaser.Math.Clamp(sx + dirX * travel, m, this.W - m);
    const ey = Phaser.Math.Clamp(sy + dirY * travel, this.fieldTop + this.dieRadius, this.H - m);
    const dur = TUNE.HOP_BASE_MS + travel * TUNE.HOP_PER_PX;
    const hopH = this.dieSize * TUNE.HOP_HEIGHT_FRAC * (0.45 + 0.55 * travel / range) + h0 * 0.3;
    const spinDir = this.chain % 2 === 0 ? 1 : -1;
    const c = { t: 0 };
    const SPLIT = 0.68;
    this.tweens.add({
      targets: c, t: 1, duration: dur, ease: 'Linear',
      onUpdate: () => {
        die.gx = sx + (ex - sx) * c.t;
        die.gy = sy + (ey - sy) * c.t;
        if (c.t < SPLIT) {
          const u = c.t / SPLIT;
          die.h = h0 * (1 - u) + hopH * Math.sin(Math.PI * u);
        } else {
          const u = (c.t - SPLIT) / (1 - SPLIT);
          die.h = hopH * 0.22 * Math.sin(Math.PI * u);
        }
        die.img.rotation = spinDir * Math.PI * 2 * c.t;
        this.renderAir(die);
      },
      onComplete: () => {
        die.img.rotation = 0;
        die.h = 0;
        if (die.dead) { this.loftCount--; return; }
        die.img.setDepth(10);
        die.shadow.setDepth(8);
        this.renderAir(die);
        die.state = 'active';
        this.attachBody(die, die.gx, die.gy);
        this.MatterLib.Body.setVelocity(die.body, {
          x: dirX * TUNE.LAND_SLIDE, y: dirY * TUNE.LAND_SLIDE,
        });
        this.sparks.burst(die.gx, die.gy + this.dieRadius * 0.5, 0xc9a878, 7,
          { speedMin: 0.6, speedMax: 2.2, life: 320, scale: 0.6 });
        this.squash(die);
        this.loftCount--;
      },
    });
  }

  fallToGround(die) {
    const h0 = Math.max(die.h, 1);
    const c = { p: 0 };
    this.tweens.add({
      targets: c, p: 1, duration: TUNE.FALL_MS, ease: 'Bounce.easeOut',
      onUpdate: () => {
        die.h = h0 * (1 - c.p);
        this.renderAir(die);
      },
      onComplete: () => {
        die.h = 0;
        die.img.setDepth(10);
        die.shadow.setDepth(8);
        this.renderAir(die);
        die.state = 'active';
        this.attachBody(die, die.gx, die.gy);
        const a = Math.random() * Math.PI * 2;
        this.MatterLib.Body.setVelocity(die.body, { x: Math.cos(a) * 1.4, y: Math.sin(a) * 1.4 });
        this.sparks.burst(die.gx, die.gy + this.dieRadius * 0.5, 0xc9a878, 8,
          { speedMin: 0.6, speedMax: 2.2, life: 320, scale: 0.6 });
        this.squash(die);
        this.loftCount--;
      },
    });
  }

  findNearestResting(value, exclude) {
    let best = null, bestD = Infinity;
    for (const d of this.dice) {
      if (d === exclude || d.dead || d.reserved) continue;
      if (!d.body) continue;
      if (d.kind !== 'wild' &&
        (!this.mergeableKind(d.kind) || d.value !== value)) continue;
      if (d.state !== 'rest' && d.state !== 'active') continue;
      const dist = Phaser.Math.Distance.Between(
        exclude.gx, exclude.gy, d.body.position.x, d.body.position.y);
      if (dist < bestD) { bestD = dist; best = d; }
    }
    return best;
  }

  // ---------- impact effects ----------

  mergeImpact(gx, gy, riseH, value) {
    const apexY = gy - riseH;
    const color = shadeHex(VALUE_COLORS[Math.min(value + 1, TUNE.MAX_VALUE)], -0.1);
    const flash = this.add.image(gx, apexY, 'flash').setDepth(19)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(this.dieSize * 1.4, this.dieSize * 1.4);
    this.tweens.add({
      targets: flash, alpha: 0, scale: flash.scaleX * 2.4, duration: 240,
      onComplete: () => flash.destroy(),
    });
    const ring = this.add.graphics().setDepth(19).setPosition(gx, apexY);
    ring.lineStyle(3.5, 0xfff4dc, 0.95);
    ring.strokeCircle(0, 0, this.dieRadius);
    this.tweens.add({
      targets: ring, scale: 2.6 + this.chain * 0.25, alpha: 0, duration: 320,
      onComplete: () => ring.destroy(),
    });
    this.sparks.burst(gx, apexY, color, Math.min(22, 10 + this.chain * 3),
      { speedMin: 1.5, speedMax: 5.5 + this.chain * 0.5, life: 480, scale: 0.9 });
    this.sparks.burst(gx, gy + this.dieRadius * 0.4, 0xc9a878, 6,
      { speedMin: 0.5, speedMax: 2, life: 340, scale: 0.7 });

    this.knockback(gx, gy, this.dieSize * TUNE.KNOCK_RADIUS_FRAC,
      TUNE.KNOCK_SPEED + this.chain * TUNE.KNOCK_PER_CHAIN);

    this.cameras.main.shake(60 + this.chain * 12, 0.0016 + this.chain * 0.0008);
    if (this.chain >= 3) {
      const cam = this.cameras.main;
      this.tweens.add({
        targets: cam, zoom: 1.03 + Math.min(this.chain, 8) * 0.004,
        duration: 70, yoyo: true, ease: 'Sine.easeOut',
        onComplete: () => cam.setZoom(1),
      });
    }
  }

  knockback(x, y, R, kick) {
    for (const d of this.dice) {
      if (!d.body || d.dead) continue;
      const dx = d.body.position.x - x, dy = d.body.position.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist > R || dist < 1) continue;
      const f = (1 - dist / R) * kick;
      this.MatterLib.Sleeping.set(d.body, false);
      this.MatterLib.Body.setVelocity(d.body, {
        x: d.body.velocity.x + (dx / dist) * f,
        y: d.body.velocity.y + (dy / dist) * f,
      });
      this.squash(d);
    }
  }

  detonate(gx, gy, riseH) {
    const apexY = gy - riseH;
    this.sparks.burst(gx, apexY, 0xf2b23e, 30, { speedMin: 3, speedMax: 8, life: 650, scale: 1.2 });
    this.sparks.burst(gx, apexY, 0xfff4dc, 14, { speedMin: 1, speedMax: 4, life: 450, scale: 0.8 });
    const ring = this.add.graphics().setDepth(19).setPosition(gx, apexY);
    ring.lineStyle(5, 0xf2b23e, 1);
    ring.strokeCircle(0, 0, this.dieRadius);
    this.tweens.add({
      targets: ring, scale: 5, alpha: 0, duration: 480,
      onComplete: () => ring.destroy(),
    });
    this.knockback(gx, gy, this.dieSize * TUNE.KNOCK_RADIUS_FRAC * 1.8, TUNE.KNOCK_SPEED * 2.2);
    this.cameras.main.shake(220, 0.006);
  }

  squash(die) {
    if (die.squashing || die.dead) return;
    die.squashing = true;
    this.tweens.add({
      targets: die.img,
      scaleX: die.baseScale * 1.22, scaleY: die.baseScale * 0.82,
      duration: 55, yoyo: true, ease: 'Sine.easeOut',
      onComplete: () => {
        die.squashing = false;
        if (!die.dead && die.state !== 'loft' && die.state !== 'merge') {
          die.img.setScale(die.baseScale);
        }
      },
    });
  }

  enforceClutterCap() {
    const resting = this.dice.filter(d => d.state === 'rest' && !d.dead);
    if (resting.length <= TUNE.MAX_RESTING_DICE) return;
    resting.sort((x, y) => x.restingSince - y.restingSince);
    const excess = resting.length - TUNE.MAX_RESTING_DICE;
    for (let i = 0; i < excess; i++) {
      const d = resting[i];
      d.dead = true;
      this.detachBody(d);
      this.tweens.add({
        targets: [d.img, d.shadow], alpha: 0, scale: d.img.scale * 0.5, duration: 420,
        onComplete: () => {
          d.img.destroy(); d.shadow.destroy();
          const idx = this.dice.indexOf(d);
          if (idx >= 0) this.dice.splice(idx, 1);
        },
      });
    }
  }

  // ---------- HUD ----------

  buildHud() {
    const style = { fontFamily: '-apple-system, Arial, sans-serif', fontSize: '15px', color: BOARD.creamDim };
    this.fpsText = this.add.text(0, 0, '', { ...style, color: '#7ec96f', fontSize: '12px' }).setDepth(30);
    this.levelText = this.add.text(0, 0, 'LEVEL 1/' + LEVEL_TRACK.length, {
      ...style, fontSize: '16px', color: BOARD.cream, fontStyle: 'bold',
    }).setDepth(30);
    this.mapBtn = this.add.text(0, 0, '[ MAP ]', {
      ...style, fontSize: '13px', color: '#ffd54a', fontStyle: 'bold',
    }).setDepth(30).setInteractive();
    this.mapBtn.on('pointerdown', () => {
      if (this.modalOpen === 'track') this.closeModal();
      else if (!this.modalOpen) this.openTrack();
    });
    this.bestText = this.add.text(0, 0, 'Best chain: 0', style).setOrigin(1, 0).setDepth(30);
    this.refreshText = this.add.text(0, 0, '', {
      ...style, fontSize: '14px', fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(30);
    this.versionText = this.add.text(0, 0, VERSION, { ...style, fontSize: '12px' }).setOrigin(1, 1).setDepth(30);
    this.chainText = this.add.text(0, 0, '', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '46px',
      fontStyle: 'bold', color: '#ffffff', stroke: '#3a2517', strokeThickness: 7,
    }).setOrigin(0.5).setAlpha(0).setDepth(30);
    this.hpBar = this.add.graphics().setDepth(30);
    this.hpText = this.add.text(0, 0, '', {
      ...style, fontSize: '12px', color: BOARD.cream, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(31);
    this.goldText = this.add.text(0, 0, '', {
      ...style, fontSize: '15px', color: GOLD, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(31);
    this.tipBg = this.add.graphics().setDepth(60).setVisible(false);
    this.tipText = this.add.text(0, 0, '', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '13px',
      color: BOARD.cream, align: 'center', lineSpacing: 3,
    }).setOrigin(0.5, 1).setDepth(61).setVisible(false);
    this.layoutHud();
    this.drawHpBar();
    this.drawGold();
    this.drawRefreshText();
  }

  layoutHud() {
    this.fpsText.setPosition(6, 4);
    const ly = Math.max(20, this.stripH * 0.35);
    this.levelText.setPosition(6, ly);
    this.mapBtn.setPosition(this.levelText.x + this.levelText.width + 10, ly + 2);
    this.refreshText.setPosition(this.W - 8, ly);
    this.bestText.setPosition(this.W - 8, 4);
    this.versionText.setPosition(this.W - this.rail - 6, this.H - this.rail - 4);
    this.chainText.setPosition(this.W / 2, this.H * 0.3);
    this.drawHpBar();
    this.drawGold();
  }

  drawHpBar() {
    const w = Math.min(this.W * 0.24, 210), h = 12;
    const x = this.rail + 8, y = this.H - this.rail - 22;
    const g = this.hpBar;
    g.clear();
    g.fillStyle(0x241408, 0.85);
    g.fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 4);
    const frac = Math.max(0, this.hp / TUNE.PLAYER_HP);
    g.fillStyle(frac > 0.5 ? 0x6aa84f : frac > 0.25 ? 0xe6c229 : 0xc9564a, 1);
    if (frac > 0) g.fillRoundedRect(x, y, w * frac, h, 3);
    g.lineStyle(1, BOARD.frameHi, 0.8);
    g.strokeRoundedRect(x - 2, y - 2, w + 4, h + 4, 4);
    this.hpText.setPosition(x + w + 8, y + h / 2)
      .setText(this.hp + '/' + TUNE.PLAYER_HP);
  }

  drawGold() {
    if (!this.goldText) return;
    const x = this.rail + 8, y = this.H - this.rail - 44;
    this.goldText.setPosition(x, y).setText('◉ ' + this.gold + 'g');
  }

  showTooltip(x, y, kind) {
    const msg = TOOLTIPS[kind];
    if (!msg) return;
    this.showTooltipText(x, y, msg);
  }

  showTooltipText(x, y, msg) {
    this.tipText.setText(msg);
    const b = this.tipText.getBounds();
    const pad = 8;
    let tx = Phaser.Math.Clamp(x, b.width / 2 + pad + 4, this.W - b.width / 2 - pad - 4);
    let ty = y - this.dieSize * 0.9;
    if (ty - b.height - pad * 2 < this.stripH) ty = y + this.dieSize * 0.9 + b.height + pad;
    this.tipText.setPosition(tx, ty).setVisible(true);
    const g = this.tipBg;
    g.clear();
    g.fillStyle(0x241408, 0.92);
    g.fillRoundedRect(tx - b.width / 2 - pad, ty - b.height - pad,
      b.width + pad * 2, b.height + pad * 2, 6);
    g.lineStyle(1, 0x6b4a33, 1);
    g.strokeRoundedRect(tx - b.width / 2 - pad, ty - b.height - pad,
      b.width + pad * 2, b.height + pad * 2, 6);
    g.setVisible(true);
    if (this.tipTimer) this.tipTimer.remove();
    this.tipTimer = this.time.delayedCall(2600, () => this.hideTooltip());
  }

  hideTooltip() {
    this.tipBg.setVisible(false);
    this.tipText.setVisible(false);
  }

  banner(msg, color) {
    const t = this.add.text(this.W / 2, this.H * 0.38, msg, {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '40px',
      fontStyle: 'bold', color, stroke: '#2a1a0e', strokeThickness: 7,
    }).setOrigin(0.5).setDepth(45).setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.time.delayedCall(1100, () => {
      this.tweens.add({ targets: t, alpha: 0, duration: 300, onComplete: () => t.destroy() });
    });
  }

  floatText(x, y, msg, color, big) {
    const t = this.add.text(x, y, msg, {
      fontFamily: '-apple-system, Arial, sans-serif',
      fontSize: (big ? 30 : 18) + 'px',
      fontStyle: 'bold', color, stroke: '#241408', strokeThickness: big ? 6 : 4,
    }).setOrigin(0.5).setDepth(35);
    if (big) t.setScale(0.5);
    this.tweens.add({
      targets: t, y: y - (big ? 44 : 26), alpha: 0, scale: 1,
      duration: big ? 1400 : 750, ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  flashChain() {
    const n = this.chain;
    const color = n >= 7 ? '#ff5252' : n >= 5 ? '#ff9838' : n >= 3 ? '#ffd54a' : '#fff4dc';
    this.chainText.setText('CHAIN ×' + n).setColor(color)
      .setAlpha(1).setScale(1.35 + Math.min(n, 8) * 0.05)
      .setRotation((Math.random() - 0.5) * 0.06);
    this.tweens.add({ targets: this.chainText, scale: 1, duration: 190, ease: 'Back.easeOut' });
    if (this.chainFade) this.chainFade.remove();
    this.chainFade = this.time.delayedCall(1100, () => {
      this.tweens.add({ targets: this.chainText, alpha: 0, duration: 350 });
    });
    this.bestText.setText('Best chain: ' + this.bestChain);
  }

  // ---------- main loop ----------

  update(time, delta) {
    this._sweepAccum = (this._sweepAccum || 0) + delta;
    if (this._sweepAccum >= TUNE.TOUCH_SWEEP_MS) {
      this._sweepAccum = 0;
      this.touchSweep();
    }
    this.processFuseQueue();
    this.sparks.update(delta);

    for (const d of this.dice) {
      if (!d.body) continue;
      d.gx = d.body.position.x; d.gy = d.body.position.y;
      d.img.setPosition(d.gx, d.gy);
      d.shadow.setPosition(d.gx, d.gy + this.dieSize * 0.16);
      const speed = d.body.speed;

      if (d.state === 'rest' || d.state === 'active') {
        const distL = Phaser.Math.Distance.Between(
          d.gx, d.gy, this.launcherPos.x, this.launcherPos.y);
        const apronR = this.dieRadius * 2.2;
        if (!d.leftLauncher) {
          if (distL > apronR + this.dieRadius) d.leftLauncher = true;
        } else if (distL < apronR * 0.85) {
          this.consumeDie(d);
          continue;
        }
      }

      if (speed > 0.8 && !d.squashing) {
        d.img.rotation += d.spinSign * speed * TUNE.SPIN_RATE * (delta / 16.667);
        d.uprighting = false;
      } else if (!d.uprighting && Math.abs(d.img.rotation % (Math.PI * 2)) > 0.02) {
        d.uprighting = true;
        const snapped = Math.round(d.img.rotation / (Math.PI * 2)) * (Math.PI * 2);
        this.tweens.add({
          targets: d.img, rotation: snapped, duration: 220, ease: 'Sine.easeOut',
          onComplete: () => { if (!d.dead) d.img.rotation = 0; },
        });
      }

      if (d.state === 'active') {
        if (speed < TUNE.SETTLE_SPEED) {
          d.slowMs += delta;
          if (d.slowMs >= TUNE.SETTLE_MS) {
            if (d.kind === 'potion') { this.consumePotion(d); continue; }
            if (d.kind === 'stun') { this.consumeStun(d); continue; }
            d.state = 'rest';
            d.restingSince = time;
            d.slowMs = 0;
            if (d === this.thrownDie) this.thrownDie = null;
          }
        } else {
          d.slowMs = 0;
        }
      }
    }

    if (this.thrownDie && this.thrownDie.body &&
      this.thrownDie.body.speed > TUNE.TRAIL_MIN_SPEED) {
      this.trailAccum += delta;
      if (this.trailAccum > 26) {
        this.trailAccum = 0;
        const d = this.thrownDie;
        this.sparks.burst(d.img.x, d.img.y + this.dieRadius * 0.4, 0xc9a878, 1,
          { speedMin: 0, speedMax: 0.4, life: 320, scale: 0.8, drag: 1 });
      }
    }

    if (this.levelClearPending && !this.gameOver) {
      if (!this.boardBusy()) {
        this.levelClearPending = false;
        if (this.level >= LEVEL_TRACK.length) {
          this.time.delayedCall(400, () => this.doVictory());
        } else {
          this.banner('LEVEL CLEAR!', '#8ec873');
          this.time.delayedCall(1500, () => {
            if (!this.gameOver) this.startLevel(this.level + 1);
          });
        }
      }
    }

    if (!this.ready && !this.gameOver) {
      const timedOut = time - this.fireTime > 8000;
      if ((!this.boardBusy() || timedOut) && time - this.fireTime > 350) {
        this.onThrowResolved();
        this.setReady(true);
      }
    }

    if (!this._fpsAccum) this._fpsAccum = 0;
    this._fpsAccum += delta;
    if (this._fpsAccum > 250) {
      this._fpsAccum = 0;
      const fps = Math.round(this.game.loop.actualFps);
      const color = fps >= 55 ? '#7ec96f' : fps >= 45 ? '#e6c229' : '#e74c3c';
      this.fpsText.setColor(color).setText(fps + ' FPS · ' + this.dice.length + ' dice');
    }
  }
}

// ---- live tuning panel (index.html only; test pages have none) ----
function bindTunePanel() {
  const panel = document.getElementById('tune-panel');
  const toggle = document.getElementById('tune-toggle');
  if (!panel || !toggle) return;
  toggle.addEventListener('click', () => {
    panel.classList.toggle('hidden');
  });
  const defs = [
    ['bounce-range', 'BOUNCE_RANGE_FRAC'],
    ['bounce-height', 'HOP_HEIGHT_FRAC'],
    ['land-slide', 'LAND_SLIDE'],
    ['hop-time', 'HOP_PER_PX'],
  ];
  for (const [id, key] of defs) {
    const input = document.getElementById(id);
    const label = document.getElementById(id + '-val');
    if (!input || !label) continue;
    const saved = localStorage.getItem('runefall.' + key);
    if (saved !== null && !isNaN(parseFloat(saved))) {
      TUNE[key] = parseFloat(saved);
      input.value = saved;
    }
    label.textContent = TUNE[key];
    input.addEventListener('input', () => {
      TUNE[key] = parseFloat(input.value);
      label.textContent = input.value;
      localStorage.setItem('runefall.' + key, input.value);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  bindTunePanel();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#2e2018',
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    physics: {
      default: 'matter',
      matter: {
        gravity: { x: 0, y: 0 },
        enableSleeping: true,
      },
    },
    scene: [GameScene],
  });
  window.__runefall = game; // debugging handle
});
