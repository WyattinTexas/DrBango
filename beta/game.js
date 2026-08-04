'use strict';

// ============================================================
// RUNEFALL — Phase 0 "Feel Prototype"    v0.1.0
// Flick a die across the board. Equal values fuse into value+1,
// then the fused die lofts and hunts the nearest match: cascade.
// The board PERSISTS between throws — that's the design thesis.
// ============================================================

const VERSION = 'v0.1.0';

// ---- Tunable knobs (everything feel-related lives here) ----
const TUNE = {
  MAX_RESTING_DICE: 28,   // clutter cap — the knob, not a guess
  SEED_DICE: 12,          // dice scattered on the board at start
  MAX_VALUE: 6,           // two 6s fuse -> burst (die removed)

  DIE_SIZE_FRAC: 0.088,   // die size as fraction of min(viewport w,h)
  DIE_SIZE_MIN: 32,
  DIE_SIZE_MAX: 68,

  RESTITUTION: 0.6,       // bounciness off walls / other dice
  FRICTION_AIR: 0.018,    // how quickly a sliding die bleeds speed
  FRICTION: 0.02,

  MAX_PULL_FRAC: 0.35,    // max pull distance, fraction of height
  MIN_PULL_PX: 26,        // release below this = cancel, no throw
  MAX_SPEED_FRAC: 0.034,  // max launch speed, fraction of width (px/step)
  MIN_SPEED_FRAC: 0.28,   // floor as fraction of max speed

  SETTLE_SPEED: 0.3,      // below this speed a die can settle
  SETTLE_MS: 250,         // must stay slow this long to count as resting

  HOP_BASE_MS: 250,       // cascade hop duration base…
  HOP_PER_PX: 0.4,        // …plus this per px of travel (readability)
  HOP_PAUSE_MS: 60,       // beat between fuse and next hop
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
  1: '#7f8fa6', 2: '#3fae6a', 3: '#3d8fd1',
  4: '#9b59b6', 5: '#e67e22', 6: '#f1c40f',
};

function weightedNextValue() {
  const r = Math.random();
  if (r < 0.45) return 1;
  if (r < 0.80) return 2;
  return 3;
}

class GameScene extends Phaser.Scene {
  constructor() { super('game'); }

  create() {
    this.MatterLib = Phaser.Physics.Matter.Matter;

    this.dice = [];          // every die on the board
    this.nextId = 1;
    this.fuseQueue = [];     // collision pairs, processed outside physics step
    this.loftCount = 0;      // dice currently flying a cascade hop
    this.thrownDie = null;
    this.chain = 0;
    this.bestChain = 0;
    this.ready = false;
    this.aim = null;         // {sx, sy} while dragging
    this.fireTime = 0;

    this.computeLayout();
    this.makeDieTextures();
    this.buildWalls();
    this.buildHud();
    this.buildLauncher();
    this.seedBoard();

    this.trajGfx = this.add.graphics().setDepth(5);

    this.matter.world.on('collisionstart', (event) => {
      for (const pair of event.pairs) {
        const a = pair.bodyA.dieRef, b = pair.bodyB.dieRef;
        if (a && b) this.fuseQueue.push([a, b]);
      }
    });

    this.input.on('pointerdown', (p) => {
      if (!this.ready) return;
      this.aim = { sx: p.x, sy: p.y };
    });
    this.input.on('pointermove', (p) => {
      if (this.aim) this.drawTrajectory(p);
    });
    this.input.on('pointerup', (p) => {
      if (!this.aim) return;
      const launch = this.launchVectorFor(p);
      this.aim = null;
      this.trajGfx.clear();
      if (launch) this.fire(launch);
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
    this.launcherPos = { x: W / 2, y: H - this.dieSize * 1.15 };
    this.maxSpeed = W * TUNE.MAX_SPEED_FRAC;
    this.maxPull = H * TUNE.MAX_PULL_FRAC;
  }

  buildWalls() {
    if (this.walls) for (const w of this.walls) this.matter.world.remove(w);
    const t = 200, { W, H } = this;
    const opts = { isStatic: true, restitution: 1, friction: 0 };
    this.walls = [
      this.matter.add.rectangle(W / 2, -t / 2, W + t * 2, t, opts),
      this.matter.add.rectangle(W / 2, H + t / 2, W + t * 2, t, opts),
      this.matter.add.rectangle(-t / 2, H / 2, t, H + t * 2, opts),
      this.matter.add.rectangle(W + t / 2, H / 2, t, H + t * 2, opts),
    ];
  }

  handleResize() {
    this.computeLayout();
    this.buildWalls();
    this.layoutHud();
    this.layoutLauncher();
    // Clamp any dice that ended up outside the new bounds
    for (const d of this.dice) {
      if (!d.body) continue;
      const x = Phaser.Math.Clamp(d.body.position.x, this.dieRadius, this.W - this.dieRadius);
      const y = Phaser.Math.Clamp(d.body.position.y, this.dieRadius, this.H - this.dieRadius);
      this.MatterLib.Body.setPosition(d.body, { x, y });
    }
  }

  // ---------- programmer-art die textures ----------

  makeDieTextures() {
    const px = Math.round(this.dieSize * 2); // 2x for crispness
    for (let v = 1; v <= TUNE.MAX_VALUE; v++) {
      const key = 'die' + v;
      if (this.textures.exists(key)) this.textures.remove(key);
      const tex = this.textures.createCanvas(key, px, px);
      const ctx = tex.getContext();
      const r = px * 0.22, pad = px * 0.04;
      ctx.clearRect(0, 0, px, px);
      // rounded square
      ctx.beginPath();
      this.roundedRectPath(ctx, pad, pad, px - pad * 2, px - pad * 2, r);
      ctx.fillStyle = VALUE_COLORS[v];
      ctx.fill();
      ctx.lineWidth = px * 0.035;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.stroke();
      // number
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = px * 0.05;
      ctx.font = `bold ${Math.round(px * 0.52)}px -apple-system, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(String(v), px / 2, px * 0.54);
      ctx.fillText(String(v), px / 2, px * 0.54);
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

  // ---------- dice ----------

  makeDie(x, y, value, state) {
    const img = this.add.image(x, y, 'die' + value)
      .setDisplaySize(this.dieSize, this.dieSize).setDepth(10);
    const die = {
      id: this.nextId++, value, img, body: null,
      state, // 'rest' | 'active' | 'loft'
      slowMs: 0, restingSince: 0, dead: false,
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
    const i = this.dice.indexOf(die);
    if (i >= 0) this.dice.splice(i, 1);
  }

  seedBoard() {
    const values = [];
    for (let i = 0; i < TUNE.SEED_DICE; i++) values.push(weightedNextValue());
    const placed = [];
    const minGap = this.dieSize * 1.35;
    for (const v of values) {
      for (let tries = 0; tries < 60; tries++) {
        const x = Phaser.Math.Between(this.dieSize, this.W - this.dieSize);
        const y = Phaser.Math.Between(this.dieSize, this.H * 0.62);
        if (placed.every(p => Phaser.Math.Distance.Between(p.x, p.y, x, y) > minGap)) {
          placed.push({ x, y });
          const d = this.makeDie(x, y, v, 'rest');
          d.restingSince = this.time.now;
          break;
        }
      }
    }
  }

  // ---------- launcher & throwing ----------

  buildLauncher() {
    this.nextValue = weightedNextValue();
    this.launcherGfx = this.add.graphics().setDepth(4);
    this.previewImg = this.add.image(0, 0, 'die' + this.nextValue).setDepth(11);
    this.layoutLauncher();
  }

  layoutLauncher() {
    const { x, y } = this.launcherPos;
    this.launcherGfx.clear();
    this.launcherGfx.lineStyle(2, 0x3a4356, 1);
    this.launcherGfx.strokeCircle(x, y, this.dieRadius * 1.5);
    this.previewImg.setPosition(x, y).setDisplaySize(this.dieSize, this.dieSize);
  }

  setReady(ready) {
    this.ready = ready;
    this.previewImg.setVisible(ready);
    if (ready) {
      this.previewImg.setTexture('die' + this.nextValue)
        .setDisplaySize(this.dieSize, this.dieSize).setAlpha(0);
      this.tweens.add({ targets: this.previewImg, alpha: 1, duration: 150 });
      this.enforceClutterCap();
    }
  }

  launchVectorFor(pointer) {
    const dx = this.aim.sx - pointer.x, dy = this.aim.sy - pointer.y;
    const pull = Math.hypot(dx, dy);
    if (pull < TUNE.MIN_PULL_PX) return null; // re-aim / cancel, no accidental throws
    const frac = Math.min(pull, this.maxPull) / this.maxPull;
    const speed = this.maxSpeed * (TUNE.MIN_SPEED_FRAC + (1 - TUNE.MIN_SPEED_FRAC) * frac);
    return { x: (dx / pull) * speed, y: (dy / pull) * speed };
  }

  fire(vel) {
    this.setReady(false);
    this.chain = 0;
    this.fireTime = this.time.now;
    const { x, y } = this.launcherPos;
    const die = this.makeDie(x, y, this.nextValue, 'active');
    this.MatterLib.Body.setVelocity(die.body, vel);
    this.thrownDie = die;
    this.nextValue = weightedNextValue();
  }

  // Dotted trajectory preview — simulates the same decay + wall
  // bounces the physics will apply, so the dots are honest.
  drawTrajectory(pointer) {
    const g = this.trajGfx;
    g.clear();
    const launch = this.launchVectorFor(pointer);
    if (!launch) return;
    let px = this.launcherPos.x, py = this.launcherPos.y;
    let vx = launch.x, vy = launch.y;
    const r = this.dieRadius, decay = 1 - TUNE.FRICTION_AIR;
    g.fillStyle(0xffffff, 0.85);
    for (let step = 0; step < 110; step++) {
      vx *= decay; vy *= decay;
      px += vx; py += vy;
      if (px < r) { px = r + (r - px); vx = -vx * TUNE.RESTITUTION; }
      if (px > this.W - r) { px = (this.W - r) - (px - (this.W - r)); vx = -vx * TUNE.RESTITUTION; }
      if (py < r) { py = r + (r - py); vy = -vy * TUNE.RESTITUTION; }
      if (py > this.H - r) { py = (this.H - r) - (py - (this.H - r)); vy = -vy * TUNE.RESTITUTION; }
      if (step % 4 === 0) {
        const fade = 1 - step / 110;
        g.fillStyle(0xffffff, 0.15 + 0.6 * fade);
        g.fillCircle(px, py, Math.max(2, this.dieRadius * 0.14 * (0.5 + fade)));
      }
      if (Math.hypot(vx, vy) < 0.5) break;
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
    const mx = ((a.body ? a.body.position.x : a.img.x) + (b.body ? b.body.position.x : b.img.x)) / 2;
    const my = ((a.body ? a.body.position.y : a.img.y) + (b.body ? b.body.position.y : b.img.y)) / 2;
    if (a === this.thrownDie || b === this.thrownDie) this.thrownDie = null;
    this.destroyDie(a);
    this.destroyDie(b);

    this.chain++;
    if (this.chain > this.bestChain) this.bestChain = this.chain;
    feedback.chainStep(this.chain);
    this.flashChain();
    this.popEffect(mx, my, value);
    if (this.chain >= 3) this.cameras.main.shake(70, 0.0025);

    const newValue = value + 1;
    if (newValue > TUNE.MAX_VALUE) {
      this.burstEffect(mx, my);
      return;
    }

    const die = this.makeDie(mx, my, newValue, 'loft');
    this.loftCount++;
    die.img.setDepth(20);

    this.time.delayedCall(TUNE.HOP_PAUSE_MS, () => {
      if (die.dead) return;
      const target = this.findNearestResting(newValue, die);
      if (target) {
        target.reserved = true;
        const tx = target.body.position.x, ty = target.body.position.y;
        const dist = Phaser.Math.Distance.Between(mx, my, tx, ty);
        const dur = TUNE.HOP_BASE_MS + dist * TUNE.HOP_PER_PX;
        this.tweens.add({
          targets: die.img, x: tx, y: ty, duration: dur, ease: 'Sine.easeIn',
          onComplete: () => {
            this.loftCount--;
            if (die.dead) return;
            if (target.dead) { this.landLoftedDie(die); return; }
            this.fuse(die, target);
          },
        });
        this.tweens.add({
          targets: die.img, scale: die.img.scale * 1.4,
          duration: dur / 2, yoyo: true, ease: 'Sine.easeInOut',
        });
      } else {
        this.loftCount--;
        this.landLoftedDie(die);
      }
    });
  }

  landLoftedDie(die) {
    die.state = 'active';
    this.attachBody(die, die.img.x, die.img.y);
    const a = Math.random() * Math.PI * 2;
    this.MatterLib.Body.setVelocity(die.body, { x: Math.cos(a) * 1.2, y: Math.sin(a) * 1.2 });
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
        targets: d.img, alpha: 0, scale: d.img.scale * 0.6, duration: 400,
        onComplete: () => {
          d.img.destroy();
          const idx = this.dice.indexOf(d);
          if (idx >= 0) this.dice.splice(idx, 1);
        },
      });
    }
  }

  // ---------- effects ----------

  popEffect(x, y, value) {
    const g = this.add.graphics().setDepth(15);
    g.lineStyle(3, 0xffffff, 0.9);
    g.strokeCircle(0, 0, this.dieRadius * 0.8);
    g.setPosition(x, y);
    this.tweens.add({
      targets: g, scale: 2.2, alpha: 0, duration: 260,
      onComplete: () => g.destroy(),
    });
  }

  burstEffect(x, y) {
    for (let i = 0; i < 8; i++) {
      const g = this.add.graphics().setDepth(15);
      g.fillStyle(0xf1c40f, 1);
      g.fillCircle(0, 0, this.dieRadius * 0.2);
      g.setPosition(x, y);
      const a = (i / 8) * Math.PI * 2;
      this.tweens.add({
        targets: g,
        x: x + Math.cos(a) * this.dieSize * 2.2,
        y: y + Math.sin(a) * this.dieSize * 2.2,
        alpha: 0, duration: 420,
        onComplete: () => g.destroy(),
      });
    }
    this.cameras.main.shake(120, 0.004);
  }

  flashChain() {
    this.chainText.setText('CHAIN ×' + this.chain).setAlpha(1).setScale(1.35);
    this.tweens.add({ targets: this.chainText, scale: 1, duration: 180 });
    if (this.chainFade) this.chainFade.remove();
    this.chainFade = this.time.delayedCall(1100, () => {
      this.tweens.add({ targets: this.chainText, alpha: 0, duration: 350 });
    });
    this.bestText.setText('Best chain: ' + this.bestChain);
  }

  // ---------- HUD ----------

  buildHud() {
    const style = { fontFamily: '-apple-system, Arial, sans-serif', fontSize: '15px', color: '#9aa4b2' };
    this.fpsText = this.add.text(0, 0, '', { ...style, color: '#3fae6a' }).setDepth(30);
    this.bestText = this.add.text(0, 0, 'Best chain: 0', style).setOrigin(1, 0).setDepth(30);
    this.versionText = this.add.text(0, 0, VERSION, { ...style, fontSize: '12px' }).setOrigin(1, 1).setDepth(30);
    this.chainText = this.add.text(0, 0, '', {
      fontFamily: '-apple-system, Arial, sans-serif', fontSize: '44px',
      fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0).setDepth(30);
    this.layoutHud();
  }

  layoutHud() {
    this.fpsText.setPosition(10, 8);
    this.bestText.setPosition(this.W - 10, 8);
    this.versionText.setPosition(this.W - 8, this.H - 6);
    this.chainText.setPosition(this.W / 2, this.H * 0.22);
  }

  // ---------- main loop ----------

  update(time, delta) {
    this.processFuseQueue();

    // sync visuals to bodies; settle detection
    for (const d of this.dice) {
      if (!d.body) continue;
      d.img.setPosition(d.body.position.x, d.body.position.y);
      if (d.state === 'active') {
        if (d.body.speed < TUNE.SETTLE_SPEED) {
          d.slowMs += delta;
          if (d.slowMs >= TUNE.SETTLE_MS) {
            d.state = 'rest';
            d.restingSince = time;
            if (d === this.thrownDie) this.thrownDie = null;
          }
        } else {
          d.slowMs = 0;
        }
      }
    }

    // rearm the launcher when nothing fusable is still in motion
    if (!this.ready) {
      const anyActive = this.thrownDie !== null ||
        this.loftCount > 0 ||
        this.dice.some(d => d.state === 'active' || d.state === 'loft');
      const timedOut = time - this.fireTime > 4000;
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

window.addEventListener('load', () => {
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
