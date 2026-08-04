'use strict';

// ============================================================
// RUNEFALL — Phase 0 "Feel Prototype"    v0.2.0
// Billiards-feel dice flicking. Equal values fuse into value+1;
// the fused die LEAPS to the nearest match and the chain runs.
// The board persists between throws — that's the design thesis.
// ============================================================

const VERSION = 'v0.2.0';

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

  // cascade pacing: pop-in, breath, leap, impact
  BOUNCE_IN_MS: 130,
  HOP_PAUSE_MS: 90,
  HOP_BASE_MS: 260,
  HOP_PER_PX: 0.5,
  HOP_HEIGHT_FRAC: 1.5,   // × dieSize, plus a little per px of distance

  // merge impact physics: the explosion shoves nearby dice
  KNOCK_RADIUS_FRAC: 2.7, // × dieSize
  KNOCK_SPEED: 3.6,
  KNOCK_PER_CHAIN: 0.45,

  SPIN_RATE: 0.05,        // visual tumble per px/step of speed
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

const VALUE_COLORS = {
  1: 0x8492a6, 2: 0x2ecc71, 3: 0x3b82f6,
  4: 0xa855f7, 5: 0xf97316, 6: 0xfbbf24,
};

// standard pip layouts on a 3x3 grid (-1..1 in x and y)
const PIPS = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
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

function hex(color) {
  return '#' + color.toString(16).padStart(6, '0');
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
    this.loftCount = 0;
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
          this.fuseQueue.push([a, b]);
          // meaty die-on-die contact: squash pulse + spark
          const va = a.body ? a.body.speed : 0, vb = b.body ? b.body.speed : 0;
          const impact = Math.max(va, vb);
          if (impact > 3) {
            this.squash(a); this.squash(b);
            const mx = (a.img.x + b.img.x) / 2, my = (a.img.y + b.img.y) / 2;
            this.sparks.burst(mx, my, 0xffffff, Math.min(6, 2 + impact | 0),
              { speedMin: 0.8, speedMax: 2.5, life: 260, scale: 0.5 });
            a.spinSign = Math.random() < 0.5 ? -1 : 1;
            b.spinSign = -a.spinSign;
          }
        } else if ((a || b) && (pair.bodyA.isStatic || pair.bodyB.isStatic)) {
          const d = a || b;
          if (d.body && d.body.speed > 4) {
            this.squash(d);
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
      this.layoutLauncher();
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
    this.rail = Math.max(8, Math.round(this.dieSize * 0.22));
    this.launcherPos = { x: W / 2, y: H - this.dieSize * 1.35 };
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
    this.makeSoftTexture('shadow', 64, 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0)');
    this.makeSoftTexture('flash', 96, 'rgba(255,255,255,0.95)', 'rgba(255,255,255,0)');
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

  makeDieTextures() {
    const px = Math.round(this.dieSize * 2); // 2x for crispness
    for (let v = 1; v <= TUNE.MAX_VALUE; v++) {
      const key = 'die' + v;
      if (this.textures.exists(key)) this.textures.remove(key);
      const tex = this.textures.createCanvas(key, px, px);
      const ctx = tex.getContext();
      const color = VALUE_COLORS[v];
      const pad = px * 0.045, r = px * 0.24;
      ctx.clearRect(0, 0, px, px);
      // face with vertical gradient (light catches the top edge)
      const grad = ctx.createLinearGradient(0, pad, 0, px - pad);
      grad.addColorStop(0, shade(color, 0.28));
      grad.addColorStop(0.45, hex(color));
      grad.addColorStop(1, shade(color, -0.22));
      ctx.beginPath();
      this.roundedRectPath(ctx, pad, pad, px - pad * 2, px - pad * 2, r);
      ctx.fillStyle = grad;
      ctx.fill();
      // bevel: dark outer edge, bright inner top highlight
      ctx.lineWidth = px * 0.045;
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.stroke();
      ctx.beginPath();
      this.roundedRectPath(ctx, pad + px * 0.05, pad + px * 0.05,
        px - (pad + px * 0.05) * 2, px - (pad + px * 0.05) * 2, r * 0.75);
      ctx.lineWidth = px * 0.025;
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.stroke();
      // pips: flat bright white with a dark rim — reads at phone size
      const cell = px * 0.22, cx = px / 2, cy = px / 2, pr = px * 0.105;
      for (const [gx, gy] of PIPS[v]) {
        const x = cx + gx * cell, y = cy + gy * cell;
        ctx.beginPath();
        ctx.arc(x, y, pr, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = px * 0.018;
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.stroke();
      }
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

  // ---------- the board: felt, dot grid, rails ----------

  buildBoard() {
    if (this.boardGfx) this.boardGfx.destroy();
    const g = this.add.graphics().setDepth(0);
    this.boardGfx = g;
    const { W, H } = this, r = this.rail;
    // felt
    g.fillStyle(0x121826, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0x0d1220, 1);
    g.fillRect(r, r, W - r * 2, H - r * 2);
    // dot grid — subtle, helps you read speed and angles
    g.fillStyle(0x27324a, 0.35);
    const step = this.dieSize * 1.4;
    for (let x = r + step; x < W - r; x += step)
      for (let y = r + step; y < H - r; y += step)
        g.fillCircle(x, y, 1.5);
    // rails: bevelled billiard cushions
    g.lineStyle(r, 0x2b3550, 1);
    g.strokeRect(r / 2, r / 2, W - r, H - r);
    g.lineStyle(2, 0x46567c, 1);
    g.strokeRect(r, r, W - r * 2, H - r * 2);
    g.lineStyle(2, 0x151b2c, 1);
    g.strokeRect(1, 1, W - 2, H - 2);
    // launcher apron
    g.fillStyle(0x1a2236, 0.6);
    g.fillCircle(this.launcherPos.x, this.launcherPos.y, this.dieRadius * 2.1);
    g.lineStyle(2, 0x3d4a63, 0.9);
    g.strokeCircle(this.launcherPos.x, this.launcherPos.y, this.dieRadius * 2.1);
  }

  // ---------- dice ----------

  makeDie(x, y, value, state) {
    const shadow = this.add.image(x, y + this.dieSize * 0.16, 'shadow')
      .setDisplaySize(this.dieSize * 1.15, this.dieSize * 0.55)
      .setAlpha(0.4).setDepth(8);
    const img = this.add.image(x, y, 'die' + value)
      .setDisplaySize(this.dieSize, this.dieSize).setDepth(10);
    const die = {
      id: this.nextId++, value, img, shadow, body: null,
      baseScale: img.scaleX,
      state, // 'rest' | 'active' | 'loft'
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

  destroyDie(die) {
    die.dead = true;
    if (die.body) { this.matter.world.remove(die.body); die.body.dieRef = null; die.body = null; }
    die.img.destroy();
    die.shadow.destroy();
    const i = this.dice.indexOf(die);
    if (i >= 0) this.dice.splice(i, 1);
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
          // roll-out flourish: dice tumble in with a nudge
          d.img.setScale(0);
          d.img.rotation = Math.random() * Math.PI;
          this.tweens.add({
            targets: d.img, scale: d.baseScale, rotation: 0,
            duration: 320, delay: i * 45, ease: 'Back.easeOut',
          });
          const a = Math.random() * Math.PI * 2;
          this.MatterLib.Body.setVelocity(d.body, { x: Math.cos(a) * 1.5, y: Math.sin(a) * 1.5 });
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
      color: '#5b6980', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);
    this.queueImgs = [
      this.add.image(0, 0, 'die1').setDepth(11).setAlpha(0.75),
      this.add.image(0, 0, 'die1').setDepth(11).setAlpha(0.5),
    ];
    this.layoutLauncher();
  }

  layoutLauncher() {
    const { x, y } = this.launcherPos, s = this.dieSize;
    this.previewImg.setPosition(x, y).setDisplaySize(s, s)
      .setTexture('die' + this.nextQueue[0]).setDisplaySize(s, s);
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
    // muzzle flash on the pad
    this.sparks.burst(x, y, 0xffffff, 6, { speedMin: 1, speedMax: 3, life: 240, scale: 0.5 });
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

    // elastic band from the pad rim to the die
    const powerColor = Phaser.Display.Color.Interpolate.ColorWithColor(
      new Phaser.Display.Color(120, 144, 180),
      new Phaser.Display.Color(255, 96, 64), 100, Math.round(launch.frac * 100));
    const bandTint = Phaser.Display.Color.GetColor(powerColor.r, powerColor.g, powerColor.b);
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
        g.fillStyle(0xffffff, 0.75);
        g.fillCircle(sx, sy, Math.max(2.5, r * 0.16));
      }
      if (Math.hypot(vx, vy) < 0.5) break;
    }
    // first-impact preview: ring the die you'll hit;
    // green pulse if it's a fuse, white if it's just a shove
    if (hitDie) {
      const fusing = hitDie.value === this.nextQueue[0];
      const c = fusing ? 0x2ecc71 : 0xffffff;
      const pulse = 1 + 0.08 * Math.sin(this.time.now / 90);
      g.lineStyle(3, c, fusing ? 1 : 0.55);
      g.strokeCircle(hitDie.body.position.x, hitDie.body.position.y,
        this.dieRadius * 1.35 * (fusing ? pulse : 1));
    }
  }

  // ---------- fuse & cascade ----------

  processFuseQueue() {
    while (this.fuseQueue.length) {
      const [a, b] = this.fuseQueue.shift();
      if (a.dead || b.dead) continue;
      if (a.value !== b.value) continue;
      if (a.state !== 'active' && b.state !== 'active') continue; // resting dice never auto-fuse
      this.fuse(a, b);
    }
  }

  fuse(a, b) {
    const value = a.value;
    const ax = a.body ? a.body.position.x : a.img.x;
    const ay = a.body ? a.body.position.y : a.img.y;
    const bx = b.body ? b.body.position.x : b.img.x;
    const by = b.body ? b.body.position.y : b.img.y;
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    if (a === this.thrownDie || b === this.thrownDie) this.thrownDie = null;
    this.destroyDie(a);
    this.destroyDie(b);

    this.chain++;
    if (this.chain > this.bestChain) this.bestChain = this.chain;
    feedback.chainStep(this.chain);
    this.flashChain();
    this.mergeImpact(mx, my, value);

    const newValue = value + 1;
    if (newValue > TUNE.MAX_VALUE) {
      this.detonate(mx, my);
      return;
    }

    // the merged die pops in, takes a breath, then LEAPS at its prey
    const die = this.makeDie(mx, my, newValue, 'loft');
    this.loftCount++;
    die.img.setDepth(20);
    die.shadow.setDepth(7);
    die.img.setScale(0.2);
    this.tweens.add({
      targets: die.img, scale: die.baseScale,
      duration: TUNE.BOUNCE_IN_MS, ease: 'Back.easeOut',
    });

    this.time.delayedCall(TUNE.BOUNCE_IN_MS + TUNE.HOP_PAUSE_MS, () => {
      if (die.dead) { this.loftCount--; return; }
      const target = this.findNearestResting(newValue, die);
      if (target) {
        target.reserved = true;
        this.leap(die, target, 0);
      } else {
        this.loftCount--;
        this.landLoftedDie(die);
      }
    });
  }

  // parabolic leap with height, separating shadow, mid-air tumble
  leap(die, target, chases) {
    const sx = die.img.x, sy = die.img.y;
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
        const gx = sx + (tx - sx) * c.t, gy = sy + (ty - sy) * c.t;
        const h = Math.sin(Math.PI * c.t);
        die.img.setPosition(gx, gy - h * hopH);
        die.img.setScale(die.baseScale * (1 + 0.45 * h));
        die.img.rotation = spinDir * Math.PI * 2 * c.t; // one full airborne flip
        die.shadow.setPosition(gx, gy + this.dieSize * 0.16);
        die.shadow.setAlpha(0.4 * (1 - 0.65 * h));
        die.shadow.setScale(die.shadow.scaleX, die.shadow.scaleY); // size steady, alpha carries height
      },
      onComplete: () => {
        if (die.dead) { this.loftCount--; return; }
        die.img.rotation = 0;
        if (target.dead) { this.loftCount--; this.landLoftedDie(die); return; }
        const nx = target.body ? target.body.position.x : target.img.x;
        const ny = target.body ? target.body.position.y : target.img.y;
        const drift = Phaser.Math.Distance.Between(tx, ty, nx, ny);
        if (drift > this.dieSize * 1.5 && chases < 1) {
          this.leap(die, target, chases + 1); // it dodged — pounce again
          return;
        }
        this.loftCount--;
        this.fuse(die, target);
      },
    });
  }

  landLoftedDie(die) {
    die.state = 'active';
    // drop back to the felt with a thud
    this.tweens.add({
      targets: die.img, scale: die.baseScale, duration: 140, ease: 'Bounce.easeOut',
    });
    this.attachBody(die, die.img.x, die.img.y);
    const a = Math.random() * Math.PI * 2;
    this.MatterLib.Body.setVelocity(die.body, { x: Math.cos(a) * 1.4, y: Math.sin(a) * 1.4 });
    this.sparks.burst(die.img.x, die.img.y + this.dieRadius * 0.5, 0x8a97ad, 6,
      { speedMin: 0.6, speedMax: 2, life: 300, scale: 0.6 });
  }

  findNearestResting(value, exclude) {
    let best = null, bestD = Infinity;
    for (const d of this.dice) {
      if (d === exclude || d.dead || d.reserved) continue;
      if (d.value !== value || d.state !== 'rest' || !d.body) continue;
      const dist = Phaser.Math.Distance.Between(
        exclude.img.x, exclude.img.y, d.body.position.x, d.body.position.y);
      if (dist < bestD) { bestD = dist; best = d; }
    }
    return best;
  }

  // ---------- impact effects: this is where "physics" gets loud ----------

  mergeImpact(x, y, value) {
    const color = VALUE_COLORS[Math.min(value + 1, TUNE.MAX_VALUE)];
    // white core flash
    const flash = this.add.image(x, y, 'flash').setDepth(19)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDisplaySize(this.dieSize * 1.4, this.dieSize * 1.4);
    this.tweens.add({
      targets: flash, alpha: 0, scale: flash.scaleX * 2.4, duration: 240,
      onComplete: () => flash.destroy(),
    });
    // shock ring
    const ring = this.add.graphics().setDepth(19).setPosition(x, y);
    ring.lineStyle(3.5, 0xffffff, 0.95);
    ring.strokeCircle(0, 0, this.dieRadius);
    this.tweens.add({
      targets: ring, scale: 2.6 + this.chain * 0.25, alpha: 0, duration: 320,
      onComplete: () => ring.destroy(),
    });
    // colored debris
    this.sparks.burst(x, y, color, Math.min(22, 10 + this.chain * 3),
      { speedMin: 1.5, speedMax: 5.5 + this.chain * 0.5, life: 480, scale: 0.9 });

    // the merge explosion physically shoves nearby dice — the board
    // rearranges itself and cascades feel like they have mass
    const R = this.dieSize * TUNE.KNOCK_RADIUS_FRAC;
    const kick = TUNE.KNOCK_SPEED + this.chain * TUNE.KNOCK_PER_CHAIN;
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

    // escalating camera: shake always, zoom-punch once it's a real chain
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

  detonate(x, y) {
    // two maxed dice annihilate: the big payoff
    this.sparks.burst(x, y, 0xfbbf24, 30, { speedMin: 3, speedMax: 8, life: 650, scale: 1.2 });
    this.sparks.burst(x, y, 0xffffff, 14, { speedMin: 1, speedMax: 4, life: 450, scale: 0.8 });
    const ring = this.add.graphics().setDepth(19).setPosition(x, y);
    ring.lineStyle(5, 0xfbbf24, 1);
    ring.strokeCircle(0, 0, this.dieRadius);
    this.tweens.add({
      targets: ring, scale: 5, alpha: 0, duration: 480,
      onComplete: () => ring.destroy(),
    });
    const R = this.dieSize * TUNE.KNOCK_RADIUS_FRAC * 1.8;
    for (const d of this.dice) {
      if (!d.body || d.dead) continue;
      const dx = d.body.position.x - x, dy = d.body.position.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist > R || dist < 1) continue;
      const f = (1 - dist / R) * TUNE.KNOCK_SPEED * 2.2;
      this.MatterLib.Sleeping.set(d.body, false);
      this.MatterLib.Body.setVelocity(d.body, {
        x: d.body.velocity.x + (dx / dist) * f,
        y: d.body.velocity.y + (dy / dist) * f,
      });
      this.squash(d);
    }
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
        if (!die.dead) die.img.setScale(die.baseScale);
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
      if (d.body) { this.matter.world.remove(d.body); d.body.dieRef = null; d.body = null; }
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
    const style = { fontFamily: '-apple-system, Arial, sans-serif', fontSize: '15px', color: '#9aa4b2' };
    this.fpsText = this.add.text(0, 0, '', { ...style, color: '#3fae6a' }).setDepth(30);
    this.bestText = this.add.text(0, 0, 'Best chain: 0', style).setOrigin(1, 0).setDepth(30);
    this.versionText = this.add.text(0, 0, VERSION, { ...style, fontSize: '12px' }).setOrigin(1, 1).setDepth(30);
    this.chainText = this.add.text(0, 0, '', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '46px',
      fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0).setDepth(30);
    this.layoutHud();
  }

  layoutHud() {
    this.fpsText.setPosition(this.rail + 6, this.rail + 4);
    this.bestText.setPosition(this.W - this.rail - 6, this.rail + 4);
    this.versionText.setPosition(this.W - this.rail - 4, this.H - this.rail - 2);
    this.chainText.setPosition(this.W / 2, this.H * 0.22);
  }

  flashChain() {
    const n = this.chain;
    const color = n >= 7 ? '#ff5252' : n >= 5 ? '#ff9838' : n >= 3 ? '#ffd54a' : '#ffffff';
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
      d.img.setPosition(d.body.position.x, d.body.position.y);
      d.shadow.setPosition(d.body.position.x, d.body.position.y + this.dieSize * 0.16);
      const speed = d.body.speed;

      // rolling tumble: fast dice visibly spin, slowing dice ease upright
      if (speed > 0.8 && !d.squashing) {
        d.img.rotation += d.spinSign * speed * TUNE.SPIN_RATE * (delta / 16.667);
        d.uprighting = false;
      } else if (!d.uprighting && Math.abs(d.img.rotation % (Math.PI / 2)) > 0.02) {
        d.uprighting = true;
        const snapped = Math.round(d.img.rotation / (Math.PI / 2)) * (Math.PI / 2);
        this.tweens.add({
          targets: d.img, rotation: snapped, duration: 160, ease: 'Sine.easeOut',
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

    // speed trail on the thrown die
    if (this.thrownDie && this.thrownDie.body &&
      this.thrownDie.body.speed > TUNE.TRAIL_MIN_SPEED) {
      this.trailAccum += delta;
      if (this.trailAccum > 26) {
        this.trailAccum = 0;
        const d = this.thrownDie;
        this.sparks.burst(d.img.x, d.img.y, VALUE_COLORS[d.value], 1,
          { speedMin: 0, speedMax: 0.4, life: 300, scale: 0.85, drag: 1 });
      }
    }

    // rearm the launcher when nothing fusable is still in motion
    if (!this.ready) {
      const anyActive = this.thrownDie !== null ||
        this.loftCount > 0 ||
        this.dice.some(d => d.state === 'active' || d.state === 'loft');
      const timedOut = time - this.fireTime > 5000;
      if ((!anyActive || timedOut) && time - this.fireTime > 350) this.setReady(true);
    }

    // FPS readout — mandatory in this phase
    if (!this._fpsAccum) this._fpsAccum = 0;
    this._fpsAccum += delta;
    if (this._fpsAccum > 250) {
      this._fpsAccum = 0;
      const fps = Math.round(this.game.loop.actualFps);
      const color = fps >= 55 ? '#3fae6a' : fps >= 45 ? '#e6c229' : '#e74c3c';
      this.fpsText.setColor(color).setText(fps + ' FPS · ' + this.dice.length + ' dice');
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    backgroundColor: '#0e1117',
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
