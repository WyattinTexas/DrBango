'use strict';

// ============================================================
// RUNEFALL — Phase 0 "Feel Prototype"    v0.3.0
// Billiards-feel dice flicking, Rune Dice style. Equal values
// that collide at speed BOUNCE INTO THE AIR and fuse at the
// apex into value+1; the fused die leaps at the nearest match.
// The board persists between throws — that's the design thesis.
// ============================================================

const VERSION = 'v0.3.0';

// ---- Tunable knobs (everything feel-related lives here) ----
const TUNE = {
  MAX_RESTING_DICE: 28,   // clutter cap — the knob, not a guess
  SEED_DICE: 12,
  MAX_VALUE: 6,           // two 6s fuse -> detonation, die removed

  DIE_SIZE_FRAC: 0.092,
  DIE_SIZE_MIN: 34,
  DIE_SIZE_MAX: 72,

  // billiards feel: glide far, lively bounces, learnable angles
  RESTITUTION: 0.7,
  FRICTION_AIR: 0.014,
  FRICTION: 0.01,

  MAX_PULL_FRAC: 0.38,
  MIN_PULL_PX: 26,        // release below this = cancel, no accidental throws
  MAX_SPEED_FRAC: 0.04,
  MIN_SPEED_FRAC: 0.22,

  SETTLE_SPEED: 0.35,
  SETTLE_MS: 220,

  // ANY equal-value contact at this speed merges — pushed dice
  // chain too, not just the thrown die
  MERGE_PUSH_SPEED: 1.0,

  // merge choreography: both dice hop up, fuse at the apex,
  // and the result either leaps onward or bounce-lands
  RISE_MS: 180,
  RISE_HEIGHT_FRAC: 1.0,  // × dieSize
  FALL_MS: 420,           // Bounce.easeOut → visible double bounce
  HOP_PAUSE_MS: 90,
  HOP_BASE_MS: 260,
  HOP_PER_PX: 0.5,
  HOP_HEIGHT_FRAC: 1.5,

  // merge impact physics: the explosion shoves nearby dice
  KNOCK_RADIUS_FRAC: 2.7,
  KNOCK_SPEED: 3.6,
  KNOCK_PER_CHAIN: 0.45,

  SPIN_RATE: 0.05,
  TRAIL_MIN_SPEED: 4,
};

// ---- Haptic hook (real impl arrives via native bridge, Phase 5) ----
// navigator.vibrate is unsupported on iOS Safari/WKWebView — this
// no-ops there by design. Escalates with chain length elsewhere.
const feedback = {
  chainStep(n) {
    try {
      if (navigator.vibrate) navigator.vibrate(Math.min(8 + n * 6, 60));
    } catch (e) { /* no-op */ }
  },
};

// Rune Dice palette: light warm die bodies, dark plum numbers
const VALUE_COLORS = {
  1: 0xf2efe4, 2: 0xe4bf7e, 3: 0x8ec873,
  4: 0x6fb3dd, 5: 0xa98ae0, 6: 0xf2b23e,
};
const NUMBER_COLOR = '#443355';

const BOARD = {
  page: 0x2e2018,       // outside the frame
  frame: 0x4a3226,      // wood frame
  frameGrain: 0x3e2a1e,
  frameHi: 0x5e4130,
  dirt: 0x7b5136,       // the felt... which is dirt now
  dirtDark: 0x6f4830,
  dirtLight: 0x875a3d,
  apron: 0xa4744e,
  cream: '#ead9b8',
  creamDim: '#c9b391',
};

function weightedNextValue() {
  const r = Math.random();
  if (r < 0.45) return 1;
  if (r < 0.80) return 2;
  return 3;
}

function shade(color, f) { // f > 0 lighten, f < 0 darken
  const r = (color >> 16) & 255, g = (color >> 8) & 255, b = color & 255;
  const ch = (c) => Math.max(0, Math.min(255, Math.round(f > 0 ? c + (255 - c) * f : c * (1 + f))));
  return 'rgb(' + ch(r) + ',' + ch(g) + ',' + ch(b) + ')';
}

function shadeHex(color, f) {
  const rgb = shade(color, f).match(/\d+/g).map(Number);
  return (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
}

// ------------------------------------------------------------
// Tiny particle pool — no engine API risk, hard perf cap.
// ------------------------------------------------------------
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
    this.nextId = 1;
    this.fuseQueue = [];
    this.loftCount = 0;     // merges/leaps in progress — blocks rearm
    this.thrownDie = null;
    this.chain = 0;
    this.bestChain = 0;
    this.ready = false;
    this.aim = null;
    this.fireTime = 0;
    this.trailAccum = 0;

    this.computeLayout();
    this.makeTextures();
    this.buildBoard();
    this.buildWalls();
    this.buildHud();
    this.buildLauncher();

    this.sparks = new ParticlePool(this, 'spark', 120);
    this.trajGfx = this.add.graphics().setDepth(6);
    this.bandGfx = this.add.graphics().setDepth(7);

    this.seedBoard();

    this.matter.world.on('collisionstart', (event) => {
      for (const pair of event.pairs) {
        const a = pair.bodyA.dieRef, b = pair.bodyB.dieRef;
        if (a && b) {
          const va = a.body ? a.body.speed : 0, vb = b.body ? b.body.speed : 0;
          const impact = Math.max(va, vb);
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
  }

  // ---------- layout (resolution-driven, never hardcoded) ----------

  computeLayout() {
    const W = this.scale.gameSize.width, H = this.scale.gameSize.height;
    this.W = W; this.H = H;
    this.dieSize = Phaser.Math.Clamp(
      Math.min(W, H) * TUNE.DIE_SIZE_FRAC, TUNE.DIE_SIZE_MIN, TUNE.DIE_SIZE_MAX);
    this.dieRadius = this.dieSize / 2;
    this.rail = Math.max(10, Math.round(this.dieSize * 0.42));
    this.launcherPos = { x: W / 2, y: H - this.dieSize * 1.45 };
    this.maxSpeed = W * TUNE.MAX_SPEED_FRAC;
    this.maxPull = H * TUNE.MAX_PULL_FRAC;
  }

  buildWalls() {
    if (this.walls) for (const w of this.walls) this.matter.world.remove(w);
    const t = 200, { W, H } = this, r = this.rail;
    const opts = { isStatic: true, restitution: 1, friction: 0 };
    this.walls = [
      this.matter.add.rectangle(W / 2, r - t / 2, W + t * 2, t, opts),
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
    for (const d of this.dice) {
      if (!d.body) continue;
      const m = this.rail + this.dieRadius;
      const x = Phaser.Math.Clamp(d.body.position.x, m, this.W - m);
      const y = Phaser.Math.Clamp(d.body.position.y, m, this.H - m);
      this.MatterLib.Body.setPosition(d.body, { x, y });
    }
  }

  // ---------- textures (all programmer art, baked once) ----------

  makeTextures() {
    this.makeDieTextures();
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

  // 3/4-view cube dice, Rune Dice style: big top face with a chunky
  // number, darker front/side strips for depth, rounded silhouette.
  makeDieTextures() {
    const px = Math.round(this.dieSize * 2); // 2x for crispness
    for (let v = 1; v <= TUNE.MAX_VALUE; v++) {
      const key = 'die' + v;
      if (this.textures.exists(key)) this.textures.remove(key);
      const tex = this.textures.createCanvas(key, px, px);
      const ctx = tex.getContext();
      const color = VALUE_COLORS[v];
      const pad = px * 0.03, depth = px * 0.13, r = px * 0.2;
      ctx.clearRect(0, 0, px, px);
      // silhouette = the cube's darker sides (bottom + right visible)
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
      // top face, nudged up-left — the classic 3/4 cube read
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
      // top-left inner highlight
      ctx.beginPath();
      this.roundedRectPath(ctx, pad + px * 0.045, pad + px * 0.045,
        tw - px * 0.09, tw - px * 0.09, r * 0.65);
      ctx.lineWidth = px * 0.02;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.stroke();
      // the number: big, chunky, dark plum like Rune Dice
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
      // small echo of the number on the front strip
      ctx.font = `900 ${Math.round(depth * 0.85)}px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = 'rgba(255,245,225,0.5)';
      ctx.fillText(String(v), cx, px - pad - depth * 0.52);
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

  // ---------- the board: warm dirt field in a wooden frame ----------

  buildBoard() {
    if (this.boardGfx) this.boardGfx.destroy();
    const g = this.add.graphics().setDepth(0);
    this.boardGfx = g;
    const { W, H } = this, r = this.rail;
    // wooden frame
    g.fillStyle(BOARD.frame, 1);
    g.fillRect(0, 0, W, H);
    g.lineStyle(2, BOARD.frameGrain, 0.7);
    for (let y = 6; y < H; y += 14) {
      g.lineBetween(0, y, W, y);
    }
    g.lineStyle(3, BOARD.frameHi, 0.5);
    g.strokeRect(2, 2, W - 4, H - 4);
    // dirt field
    g.fillStyle(BOARD.dirt, 1);
    g.fillRoundedRect(r, r, W - r * 2, H - r * 2, r * 0.6);
    // mottled dirt texture
    for (let i = 0; i < 70; i++) {
      const bx = r + Math.random() * (W - r * 2);
      const by = r + Math.random() * (H - r * 2);
      const br = 8 + Math.random() * 30;
      g.fillStyle(Math.random() < 0.5 ? BOARD.dirtDark : BOARD.dirtLight,
        0.10 + Math.random() * 0.12);
      g.fillEllipse(bx, by, br * 2, br * 1.2);
    }
    // inner shadow rim — the field sits below the frame
    for (let i = 0; i < 4; i++) {
      g.lineStyle(3, 0x241408, 0.18 - i * 0.035);
      g.strokeRoundedRect(r + 1 + i * 3, r + 1 + i * 3,
        W - (r + 1 + i * 3) * 2, H - (r + 1 + i * 3) * 2, r * 0.6);
    }
    // frame inner edge highlight
    g.lineStyle(2, BOARD.frameHi, 0.9);
    g.strokeRoundedRect(r - 2, r - 2, W - (r - 2) * 2, H - (r - 2) * 2, r * 0.6);
    // launcher apron: a worn patch of lighter dirt
    g.fillStyle(BOARD.apron, 0.25);
    g.fillCircle(this.launcherPos.x, this.launcherPos.y, this.dieRadius * 2.2);
    g.lineStyle(2, BOARD.apron, 0.6);
    g.strokeCircle(this.launcherPos.x, this.launcherPos.y, this.dieRadius * 2.2);
  }

  // ---------- dice ----------

  makeDie(x, y, value, state) {
    const shadow = this.add.image(x, y + this.dieSize * 0.16, 'shadow')
      .setDisplaySize(this.dieSize * 1.15, this.dieSize * 0.55)
      .setAlpha(0.35).setDepth(8);
    const img = this.add.image(x, y, 'die' + value)
      .setDisplaySize(this.dieSize, this.dieSize).setDepth(10);
    const die = {
      id: this.nextId++, value, img, shadow, body: null,
      baseScale: img.scaleX,
      state, // 'rest' | 'active' | 'loft' | 'merge'
      gx: x, gy: y, h: 0, popScale: 1,
      spinSign: Math.random() < 0.5 ? -1 : 1,
      slowMs: 0, restingSince: 0, dead: false, reserved: false,
    };
    if (state !== 'loft') this.attachBody(die, x, y);
    this.dice.push(die);
    return die;
  }

  attachBody(die, x, y) {
    const body = this.matter.add.circle(x, y, this.dieRadius * 0.96, {
      restitution: TUNE.RESTITUTION,
      frictionAir: TUNE.FRICTION_AIR,
      friction: TUNE.FRICTION,
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

  // shared renderer for airborne dice: ground pos + height
  renderAir(die) {
    const hn = Phaser.Math.Clamp(die.h / (this.dieSize * 1.6), 0, 1);
    die.img.setPosition(die.gx, die.gy - die.h);
    die.img.setScale(die.baseScale * (1 + 0.45 * hn) * die.popScale);
    die.shadow.setPosition(die.gx, die.gy + this.dieSize * 0.16);
    die.shadow.setAlpha(0.35 * (1 - 0.65 * hn));
  }

  seedBoard() {
    const placed = [];
    const minGap = this.dieSize * 1.4, m = this.rail + this.dieSize;
    for (let i = 0; i < TUNE.SEED_DICE; i++) {
      const v = weightedNextValue();
      for (let tries = 0; tries < 60; tries++) {
        const x = Phaser.Math.Between(m, this.W - m);
        const y = Phaser.Math.Between(m, this.H * 0.6);
        if (placed.every(p => Phaser.Math.Distance.Between(p.x, p.y, x, y) > minGap)) {
          placed.push({ x, y });
          const d = this.makeDie(x, y, v, 'rest');
          d.restingSince = this.time.now;
          d.img.setScale(0);
          d.img.rotation = Math.random() * Math.PI;
          this.tweens.add({
            targets: d.img, scale: d.baseScale, rotation: 0,
            duration: 320, delay: i * 45, ease: 'Back.easeOut',
          });
          // nudge stays below MERGE_PUSH_SPEED so the opening
          // roll-out can't fuse dice before the first throw
          const a = Math.random() * Math.PI * 2;
          this.MatterLib.Body.setVelocity(d.body, { x: Math.cos(a) * 0.8, y: Math.sin(a) * 0.8 });
          break;
        }
      }
    }
  }

  // ---------- launcher: slingshot with elastic band ----------

  buildLauncher() {
    this.nextQueue = [weightedNextValue(), weightedNextValue(), weightedNextValue()];
    this.previewImg = this.add.image(0, 0, 'die' + this.nextQueue[0]).setDepth(12);
    this.nextLabel = this.add.text(0, 0, 'NEXT', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '11px',
      color: BOARD.creamDim, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);
    this.queueImgs = [
      this.add.image(0, 0, 'die1').setDepth(11).setAlpha(0.8),
      this.add.image(0, 0, 'die1').setDepth(11).setAlpha(0.55),
    ];
    this.layoutLauncher();
  }

  layoutLauncher() {
    const { x, y } = this.launcherPos, s = this.dieSize;
    this.previewImg.setPosition(x, y).setTexture('die' + this.nextQueue[0])
      .setDisplaySize(s, s);
    this.queueImgs[0].setPosition(x + s * 2.1, y + s * 0.12)
      .setTexture('die' + this.nextQueue[1]).setDisplaySize(s * 0.55, s * 0.55);
    this.queueImgs[1].setPosition(x + s * 2.95, y + s * 0.12)
      .setTexture('die' + this.nextQueue[2]).setDisplaySize(s * 0.42, s * 0.42);
    this.nextLabel.setPosition(x + s * 2.5, y - s * 0.55);
  }

  setReady(ready) {
    this.ready = ready;
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

  get nextValue() { return this.nextQueue[0]; }
  set nextValue(v) { this.nextQueue[0] = v; this.layoutLauncher(); }

  launchVectorFor(pointer) {
    const dx = this.aim.sx - pointer.x, dy = this.aim.sy - pointer.y;
    const pull = Math.hypot(dx, dy);
    if (pull < TUNE.MIN_PULL_PX) return null; // re-aim / cancel
    const frac = Math.min(pull, this.maxPull) / this.maxPull;
    const speed = this.maxSpeed * (TUNE.MIN_SPEED_FRAC + (1 - TUNE.MIN_SPEED_FRAC) * frac);
    return { x: (dx / pull) * speed, y: (dy / pull) * speed, frac };
  }

  fire(vel) {
    this.setReady(false);
    this.chain = 0;
    this.fireTime = this.time.now;
    const { x, y } = this.launcherPos;
    const die = this.makeDie(x, y, this.nextQueue[0], 'active');
    this.MatterLib.Body.setVelocity(die.body, { x: vel.x, y: vel.y });
    die.spinSign = vel.x >= 0 ? 1 : -1;
    this.thrownDie = die;
    this.nextQueue.shift();
    this.nextQueue.push(weightedNextValue());
    this.sparks.burst(x, y, 0xead9b8, 6, { speedMin: 1, speedMax: 3, life: 240, scale: 0.5 });
  }

  // ---------- aiming: elastic band + honest trajectory + hit preview ----------

  drawAim(pointer) {
    const { x: lx, y: ly } = this.launcherPos;
    const launch = this.launchVectorFor(pointer);
    const band = this.bandGfx;
    band.clear();
    this.trajGfx.clear();

    // die follows the pull like a slingshot pocket
    let ox = pointer.x - this.aim.sx, oy = pointer.y - this.aim.sy;
    const olen = Math.hypot(ox, oy), omax = this.dieSize * 2.2;
    if (olen > omax) { ox = ox / olen * omax; oy = oy / olen * omax; }
    const px = lx + ox, py = ly + oy;
    this.previewImg.setPosition(px, py);

    if (!launch) return; // under min pull: no band, no dots — release cancels

    // elastic band from the pad rim to the die, cream -> hot with power
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

    // simulate the throw with the same decay + wall bounces the
    // physics will apply — the dots are honest, bank shots included
    const g = this.trajGfx;
    let sx = lx, sy = ly;
    let vx = launch.x, vy = launch.y;
    const r = this.dieRadius, rail = this.rail;
    const decay = 1 - TUNE.FRICTION_AIR;
    const lo = rail + r, hiX = this.W - rail - r, hiY = this.H - rail - r;
    const candidates = this.dice.filter(d =>
      d.body && !d.dead && d !== this.thrownDie && d.state === 'rest');
    let hitDie = null;
    let travelled = 0, nextDot = 0;
    for (let step = 0; step < 130 && !hitDie; step++) {
      vx *= decay; vy *= decay;
      sx += vx; sy += vy;
      travelled += Math.hypot(vx, vy);
      if (sx < lo) { sx = lo + (lo - sx); vx = -vx * TUNE.RESTITUTION; }
      if (sx > hiX) { sx = hiX - (sx - hiX); vx = -vx * TUNE.RESTITUTION; }
      if (sy < lo) { sy = lo + (lo - sy); vy = -vy * TUNE.RESTITUTION; }
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
    // first-impact preview: ring the die you'll hit;
    // green pulse if it's a fuse, cream if it's just a shove
    if (hitDie) {
      const fusing = hitDie.value === this.nextQueue[0];
      const c = fusing ? 0x8ec873 : 0xf5e6c8;
      const pulse = 1 + 0.08 * Math.sin(this.time.now / 90);
      g.lineStyle(3, c, fusing ? 1 : 0.5);
      g.strokeCircle(hitDie.body.position.x, hitDie.body.position.y,
        this.dieRadius * 1.35 * (fusing ? pulse : 1));
    }
  }

  // ---------- fuse & cascade ----------

  processFuseQueue() {
    while (this.fuseQueue.length) {
      const [a, b, impact] = this.fuseQueue.shift();
      if (a.dead || b.dead) continue;
      if (a.value !== b.value) continue;
      if (a.state === 'merge' || b.state === 'merge') continue;
      // merge if either die was set moving by the player's throw OR
      // the contact itself is fast — pushed dice chain too
      const eligible = a.state === 'active' || b.state === 'active' ||
        impact >= TUNE.MERGE_PUSH_SPEED;
      if (eligible) this.fuse(a, b);
    }
  }

  // Both dice bounce INTO THE AIR and fuse at the apex.
  fuse(a, b) {
    const value = a.value;
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
    this.destroyDie(a);
    this.destroyDie(b);

    this.chain++;
    if (this.chain > this.bestChain) this.bestChain = this.chain;
    feedback.chainStep(this.chain);
    this.flashChain();
    this.mergeImpact(mx, my, riseH, value);

    const newValue = value + 1;
    if (newValue > TUNE.MAX_VALUE) {
      this.detonate(mx, my, riseH);
      this.loftCount--;
      return;
    }

    // the merged die is born at the apex
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
      if (target) {
        target.reserved = true;
        this.leap(die, target, 0);
      } else {
        this.fallToGround(die);
      }
    });
  }

  // parabolic leap from current height onto the target
  leap(die, target, chases) {
    const sx = die.gx, sy = die.gy, h0 = die.h;
    const tx = target.body ? target.body.position.x : target.img.x;
    const ty = target.body ? target.body.position.y : target.img.y;
    const dist = Phaser.Math.Distance.Between(sx, sy, tx, ty);
    const dur = TUNE.HOP_BASE_MS + dist * TUNE.HOP_PER_PX;
    const hopH = this.dieSize * TUNE.HOP_HEIGHT_FRAC + dist * 0.07;
    const spinDir = this.chain % 2 === 0 ? 1 : -1;
    const c = { t: 0 };
    this.tweens.add({
      targets: c, t: 1, duration: dur, ease: 'Sine.easeInOut',
      onUpdate: () => {
        die.gx = sx + (tx - sx) * c.t;
        die.gy = sy + (ty - sy) * c.t;
        die.h = h0 * (1 - c.t) + hopH * Math.sin(Math.PI * c.t);
        die.img.rotation = spinDir * Math.PI * 2 * c.t;
        this.renderAir(die);
      },
      onComplete: () => {
        die.img.rotation = 0;
        die.h = 0;
        if (die.dead) { this.loftCount--; return; }
        if (target.dead) { this.fallToGround(die); return; }
        const nx = target.body ? target.body.position.x : target.img.x;
        const ny = target.body ? target.body.position.y : target.img.y;
        const drift = Phaser.Math.Distance.Between(tx, ty, nx, ny);
        if (drift > this.dieSize * 1.5 && chases < 1) {
          this.leap(die, target, chases + 1); // it dodged — pounce again
          return;
        }
        this.loftCount--;
        this.fuse(die, target); // both bounce up and fuse in the air
      },
    });
  }

  // no match: fall from the apex and bounce out on the dirt
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

  // nearest fusable die of this value — resting or still rolling
  findNearestResting(value, exclude) {
    let best = null, bestD = Infinity;
    for (const d of this.dice) {
      if (d === exclude || d.dead || d.reserved) continue;
      if (d.value !== value || !d.body) continue;
      if (d.state !== 'rest' && d.state !== 'active') continue;
      const dist = Phaser.Math.Distance.Between(
        exclude.gx, exclude.gy, d.body.position.x, d.body.position.y);
      if (dist < bestD) { bestD = dist; best = d; }
    }
    return best;
  }

  // ---------- impact effects: this is where "physics" gets loud ----------

  mergeImpact(gx, gy, riseH, value) {
    const apexY = gy - riseH;
    const color = shadeHex(VALUE_COLORS[Math.min(value + 1, TUNE.MAX_VALUE)], -0.1);
    // white core flash at the apex, where the fuse happens
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
    // dust kicked up on the dirt below
    this.sparks.burst(gx, gy + this.dieRadius * 0.4, 0xc9a878, 6,
      { speedMin: 0.5, speedMax: 2, life: 340, scale: 0.7 });

    // the shockwave physically shoves nearby dice — the board
    // rearranges itself and cascades feel like they have mass
    const R = this.dieSize * TUNE.KNOCK_RADIUS_FRAC;
    const kick = TUNE.KNOCK_SPEED + this.chain * TUNE.KNOCK_PER_CHAIN;
    this.knockback(gx, gy, R, kick);

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

  // ---------- clutter cap (the knob) ----------

  enforceClutterCap() {
    const resting = this.dice.filter(d => d.state === 'rest' && !d.dead);
    if (resting.length <= TUNE.MAX_RESTING_DICE) return;
    resting.sort((x, y) => x.restingSince - y.restingSince); // oldest first
    const excess = resting.length - TUNE.MAX_RESTING_DICE;
    for (let i = 0; i < excess; i++) {
      const d = resting[i];
      d.dead = true; // no longer fusable while fading
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
    this.fpsText = this.add.text(0, 0, '', { ...style, color: '#7ec96f' }).setDepth(30);
    this.bestText = this.add.text(0, 0, 'Best chain: 0', style).setOrigin(1, 0).setDepth(30);
    this.versionText = this.add.text(0, 0, VERSION, { ...style, fontSize: '12px' }).setOrigin(1, 1).setDepth(30);
    this.chainText = this.add.text(0, 0, '', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '46px',
      fontStyle: 'bold', color: '#ffffff', stroke: '#3a2517', strokeThickness: 7,
    }).setOrigin(0.5).setAlpha(0).setDepth(30);
    this.layoutHud();
  }

  layoutHud() {
    this.fpsText.setPosition(this.rail + 8, this.rail + 6);
    this.bestText.setPosition(this.W - this.rail - 8, this.rail + 6);
    this.versionText.setPosition(this.W - this.rail - 6, this.H - this.rail - 4);
    this.chainText.setPosition(this.W / 2, this.H * 0.22);
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
    this.processFuseQueue();
    this.sparks.update(delta);

    for (const d of this.dice) {
      if (!d.body) continue;
      d.gx = d.body.position.x; d.gy = d.body.position.y;
      d.img.setPosition(d.gx, d.gy);
      d.shadow.setPosition(d.gx, d.gy + this.dieSize * 0.16);
      const speed = d.body.speed;

      // rolling tumble: fast dice visibly spin, slowing dice ease upright
      if (speed > 0.8 && !d.squashing) {
        d.img.rotation += d.spinSign * speed * TUNE.SPIN_RATE * (delta / 16.667);
        d.uprighting = false;
      } else if (!d.uprighting && Math.abs(d.img.rotation % (Math.PI * 2)) > 0.02) {
        d.uprighting = true;
        // settle the cube art back to upright — full turns only
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

    // dust trail on the thrown die
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

    // rearm the launcher when nothing fusable is still in motion
    if (!this.ready) {
      const anyActive = this.thrownDie !== null ||
        this.loftCount > 0 ||
        this.dice.some(d => d.state === 'active' || d.state === 'loft' || d.state === 'merge');
      const timedOut = time - this.fireTime > 6000;
      if ((!anyActive || timedOut) && time - this.fireTime > 350) this.setReady(true);
    }

    // FPS readout — mandatory in this phase
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

window.addEventListener('DOMContentLoaded', () => {
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
