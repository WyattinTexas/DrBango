'use strict';
/* ============================================================
   STARSPELL — word-roguelite prototype (Corkscrew Games)
   Spell words from the letter board to battle constellation
   beasts. Every cast advances the beast's strike counter.
   Long words forge gilded / star tiles. Between fights, choose
   a sigil. Five beasts; the fifth is the boss.
   ?demo=1 — self-playing solver (attract mode / verification)
   ?daily=1 — date-seeded board (same run for everyone today)
   ============================================================ */

const BUILD = 'STARSPELL v0.1.1';
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const QS = new URLSearchParams(location.search);
const DEMO = QS.get('demo') === '1';
const DAILY = QS.get('daily') === '1';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

// seeded RNG (mulberry32) so ?daily=1 gives everyone the same run
let _seed = DAILY ? (() => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); })() : (Math.floor(Math.random() * 1e9));
function rng() {
  _seed |= 0; _seed = (_seed + 0x6D2B79F5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rpick = (arr) => arr[Math.floor(rng() * arr.length)];

// ---------- words ----------
const WORDSET = new Set(STARSPELL_WORDS.split(' '));

// ---------- letters ----------
const VALS = { a: 1, b: 3, c: 3, d: 2, e: 1, f: 4, g: 2, h: 4, i: 1, j: 8, k: 5, l: 1, m: 3, n: 1, o: 1, p: 3, q: 9, r: 1, s: 1, t: 1, u: 1, v: 4, w: 4, x: 8, y: 4, z: 10 };
const BAG = [];
for (const [ch, n] of Object.entries({ e: 12, a: 9, i: 9, o: 8, n: 6, r: 6, t: 6, l: 4, s: 4, u: 4, d: 4, g: 3, b: 2, c: 2, m: 2, p: 2, f: 2, h: 2, v: 2, w: 2, y: 2, k: 1, j: 1, x: 1, q: 1, z: 1 })) {
  for (let i = 0; i < n; i++) BAG.push(ch);
}
const VOWELS = 'aeiou';
const LEN_MULT = [0, 0, 0, 1, 1.15, 1.35, 1.6, 1.9, 2.3];

// ---------- constellation beasts ----------
// star coords live in a 200x160 box centered on origin
const BEASTS = [
  {
    name: 'VULPES', title: 'THE EMBER FOX', hp: 30, atk: 8, timer: 4, tint: 0xffb066, eye: 0xffd23e,
    stars: [[-78, 18], [-58, 2], [-38, 10], [-20, -2], [2, -10], [20, -14], [38, -24], [34, -44], [56, -40], [54, -22], [64, -14], [46, -6], [26, 16], [30, 34], [-8, 16], [-6, 34]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 6], [5, 12], [12, 13], [3, 14], [14, 15]],
    eyes: [[46, -22]],
  },
  {
    name: 'SERPENS', title: 'THE TIDE SERPENT', hp: 48, atk: 10, timer: 3, tint: 0x6fe0d0, eye: 0x9ffcee,
    stars: [[-84, 32], [-62, 14], [-40, 28], [-18, 10], [4, 24], [26, 6], [46, 18], [60, 0], [68, -20], [58, -40], [42, -34], [74, -34]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [9, 11]],
    eyes: [[52, -38], [64, -38]],
  },
  {
    name: 'CANCER', title: 'THE GLOOM CRAB', hp: 66, atk: 12, timer: 3, tint: 0xc79af5, eye: 0xff7ad9,
    stars: [[-20, 0], [0, -12], [20, 0], [14, 16], [-14, 16], [-38, -8], [-60, -20], [-76, -8], [-88, -20], [-72, -34], [38, -8], [60, -20], [76, -8], [88, -20], [72, -34], [-26, 26], [-34, 44], [0, 28], [0, 46], [26, 26], [34, 44], [-8, -24], [8, -24]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [0, 5], [5, 6], [6, 7], [7, 8], [7, 9], [2, 10], [10, 11], [11, 12], [12, 13], [12, 14], [4, 15], [15, 16], [3, 17], [17, 18], [3, 19], [19, 20], [1, 21], [1, 22]],
    eyes: [[-8, -28], [8, -28]],
  },
  {
    name: 'STRIX', title: 'THE VOID OWL', hp: 85, atk: 14, timer: 3, tint: 0x9fb4ff, eye: 0xffe08a,
    stars: [[0, -50], [28, -40], [40, -12], [28, 16], [0, 26], [-28, 16], [-40, -12], [-28, -40], [-38, -58], [38, -58], [0, 4], [-8, 14], [8, 14], [-52, 0], [-72, 22], [-58, 40], [52, 0], [72, 22], [58, 40], [-14, 52], [14, 52]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [7, 8], [1, 9], [10, 11], [10, 12], [6, 13], [13, 14], [14, 15], [2, 16], [16, 17], [17, 18], [4, 19], [4, 20]],
    eyes: [[-14, -18], [14, -18]],
  },
  {
    name: 'DRACO', title: 'THE STAR EATER', hp: 130, atk: 18, timer: 4, tint: 0xffc46b, eye: 0xff5e4d, boss: true,
    stars: [[-92, 42], [-72, 28], [-52, 36], [-32, 22], [-12, 28], [8, 14], [2, -8], [-16, -36], [6, -54], [20, -32], [42, -46], [30, 2], [46, -12], [58, -30], [50, -48], [70, -44], [78, -18], [62, -6], [24, 30], [18, 48], [44, 26], [48, 44]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [6, 9], [9, 10], [5, 11], [11, 12], [12, 13], [13, 14], [13, 15], [13, 16], [16, 17], [11, 18], [18, 19], [11, 20], [20, 21]],
    eyes: [[56, -26]],
  },
];

// ---------- sigils ----------
const SIGILS = [
  { id: 'quill', name: 'EMBER QUILL', desc: 'Every word deals +4 damage.' },
  { id: 'choir', name: 'VOWEL CHOIR', desc: 'Vowels are worth +2 each.' },
  { id: 'runes', name: 'RIVER RUNES', desc: 'S, R, E and T are worth +2 each.' },
  { id: 'salve', name: 'MOON SALVE', desc: 'Words of 5+ letters heal you 4.' },
  { id: 'forge', name: 'STAR FORGE', desc: 'Forged tiles come one tier higher.' },
  { id: 'aegis', name: 'AEGIS OF DAWN', desc: '+20 max health, healed now.' },
  { id: 'first', name: 'FIRST LIGHT', desc: 'Your first word each battle deals double.' },
  { id: 'hush', name: 'HUSHED HOURGLASS', desc: 'Beasts strike one cast later.' },
];

/* ============================================================
   Synth audio (built on first gesture; zero asset files)
   ============================================================ */
class SynthAudio {
  constructor() { this.ok = false; this.muted = localStorage.getItem('beta3.mute') === '1'; }
  ensure() {
    if (this.ok) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      this.ctx = new C();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
      this.ok = true;
    } catch (e) { /* garnish only */ }
  }
  setMuted(m) { this.muted = m; localStorage.setItem('beta3.mute', m ? '1' : '0'); if (this.ok) this.master.gain.value = m ? 0 : 0.5; }
  tone(freq, dur, type, gain, when, glideTo) {
    if (!this.ok) return;
    const t = (when || 0) + this.ctx.currentTime;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.03);
  }
  noise(dur, freq, q, gain, sweepTo) {
    if (!this.ok) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(this.master); s.start(t); s.stop(t + dur + 0.05);
  }
  // pentatonic chime rising with each letter added
  chime(n) { const F = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5]; this.tone(F[Math.min(n, F.length - 1)], 0.35, 'sine', 0.1); this.tone(F[Math.min(n, F.length - 1)] * 2, 0.18, 'sine', 0.03); }
  unchime() { this.tone(392, 0.12, 'sine', 0.06); }
  invalid() { this.tone(140, 0.2, 'square', 0.07); this.tone(110, 0.25, 'square', 0.06, 0.06); }
  cast(len) { this.noise(0.3, 900, 1.2, 0.14, 3400); for (let i = 0; i < len; i++) this.tone(660 + i * 80, 0.1, 'triangle', 0.05, i * 0.055); }
  impact() { this.noise(0.16, 300, 1, 0.2); this.tone(180, 0.18, 'sine', 0.18, 0, 70); }
  forge() { this.tone(880, 0.3, 'sine', 0.1); this.tone(1318.5, 0.45, 'sine', 0.09, 0.09); }
  hurt() { this.noise(0.35, 200, 0.8, 0.26, 70); this.tone(90, 0.4, 'sawtooth', 0.12, 0, 50); }
  sigil() { [659.3, 784, 987.8].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.09, i * 0.08)); }
  victory() { [523.3, 659.3, 784, 1046.5].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.1, i * 0.11)); }
  defeat() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.6, 'sine', 0.1, i * 0.16)); }
}
const SFX = new SynthAudio();

/* ============================================================
   Main scene
   ============================================================ */
class Main extends Phaser.Scene {
  constructor() { super('main'); }

  // ---- layout: design space 420 x 800, scaled + centered ----
  L() {
    const W = this.scale.width, H = this.scale.height;
    const s = Math.min(W / 420, H / 800);
    return { W, H, s, x: (d) => W / 2 + d * s, y: (d) => H / 2 + (d - 400) * s, u: (d) => d * s };
  }

  create() {
    const l = this.L();
    this.makeTextures();

    // starfield
    for (let i = 0; i < 130; i++) {
      const st = this.add.image(Math.random() * l.W, Math.random() * l.H, 'dot')
        .setScale(0.3 + Math.random() * 0.8).setAlpha(0.15 + Math.random() * 0.5).setTint(0xcfd8ff);
      this.tweens.add({ targets: st, alpha: 0.08 + Math.random() * 0.2, duration: 1200 + Math.random() * 2600, yoyo: true, repeat: -1, delay: Math.random() * 2000 });
    }

    // run state
    this.run = {
      fight: 0, hpMax: 50, hp: 50, sigils: [], score: 0,
      words: 0, longest: '', totalDmg: 0, firstUsed: false,
    };
    this.state = 'boot';
    this.board = [];      // 16 slots {ch, tier, c(ontainer)}
    this.sel = [];        // indices into board, in tap order
    this.lineTiles = [];  // mini clones in the casting line

    this.buildUi();
    this.startFight();

    if (DEMO) { this.demoTimer = this.time.addEvent({ delay: 1500, loop: true, callback: () => this.demoStep() }); }

    this.input.on('pointerdown', () => SFX.ensure());
    localStorage.setItem('beta3.boot', BUILD);
    console.log(BUILD);
  }

  // ---------- textures ----------
  makeTextures() {
    const mk = (key, w, h, fn) => {
      if (this.textures.exists(key)) return;
      const t = this.textures.createCanvas(key, w, h);
      fn(t.context, w, h); t.refresh();
    };
    mk('dot', 16, 16, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    const tileTex = (key, top, bottom, edge) => mk(key, 128, 128, (c) => {
      const r = 24;
      c.beginPath(); c.roundRect(6, 6, 116, 116, r);
      const g = c.createLinearGradient(0, 6, 0, 122);
      g.addColorStop(0, top); g.addColorStop(1, bottom);
      c.fillStyle = g; c.fill();
      c.lineWidth = 3; c.strokeStyle = edge; c.stroke();
      // top bevel light
      c.beginPath(); c.roundRect(12, 11, 104, 30, 16);
      const g2 = c.createLinearGradient(0, 11, 0, 41);
      g2.addColorStop(0, 'rgba(255,255,255,0.5)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g2; c.fill();
      // bottom shade
      c.beginPath(); c.roundRect(10, 92, 108, 28, 14);
      const g3 = c.createLinearGradient(0, 92, 0, 120);
      g3.addColorStop(0, 'rgba(0,0,0,0)'); g3.addColorStop(1, 'rgba(60,40,10,0.22)');
      c.fillStyle = g3; c.fill();
    });
    tileTex('tile0', '#f7f1e2', '#dfd3b8', '#b8a67f');   // ivory
    tileTex('tile1', '#ffe9a8', '#e8b84b', '#a97c1c');   // gilded
    tileTex('tile2', '#e6f6ff', '#a8d9f2', '#5f9fc4');   // star crystal
    mk('veil', 8, 8, (c, w, h) => { c.fillStyle = '#060812'; c.fillRect(0, 0, w, h); });
    mk('panel', 256, 256, (c) => {
      c.beginPath(); c.roundRect(4, 4, 248, 248, 22);
      const g = c.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, '#f8f2e4'); g.addColorStop(1, '#e4d7ba');
      c.fillStyle = g; c.fill();
      c.lineWidth = 3; c.strokeStyle = '#a98d51'; c.stroke();
      c.lineWidth = 1.5; c.strokeStyle = '#ffffffaa';
      c.beginPath(); c.roundRect(8, 8, 240, 240, 18); c.stroke();
    });
    mk('btn', 256, 96, (c) => {
      c.beginPath(); c.roundRect(4, 4, 248, 88, 46);
      const g = c.createLinearGradient(0, 4, 0, 92);
      g.addColorStop(0, '#ffdf8f'); g.addColorStop(0.5, '#f0b93e'); g.addColorStop(1, '#c98f1d');
      c.fillStyle = g; c.fill();
      c.lineWidth = 3; c.strokeStyle = '#8a6210'; c.stroke();
      c.beginPath(); c.roundRect(14, 10, 228, 34, 20);
      const g2 = c.createLinearGradient(0, 10, 0, 44);
      g2.addColorStop(0, 'rgba(255,255,255,0.65)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g2; c.fill();
    });
  }

  // ---------- ui scaffolding ----------
  buildUi() {
    const l = this.L();
    const serif = 'Georgia, "Iowan Old Style", "Times New Roman", serif';
    this.fonts = { serif };
    const txt = (x, y, str, size, color, style) => this.add.text(x, y, str, {
      fontFamily: serif, fontSize: l.u(size) + 'px', color: color || '#f0e8d2', fontStyle: style || 'bold',
    }).setShadow(0, l.u(1.5), '#000000', l.u(5));

    // header: title + run pips + score
    this.add.text(l.x(0), l.y(24), 'S T A R S P E L L', {
      fontFamily: serif, fontSize: l.u(15) + 'px', color: '#c9b676', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#c9b676', l.u(8), true, true).setAlpha(0.9);
    this.pips = [];
    for (let i = 0; i < BEASTS.length; i++) {
      this.pips.push(this.add.image(l.x(-40 + i * 20), l.y(48), 'dot').setScale(0.6).setTint(0x4a5480));
    }
    this.scoreT = txt(l.x(190), l.y(24), '0', 15, '#f0e8d2').setOrigin(1, 0.5);

    // player hp
    this.hpLabel = txt(l.x(-190), l.y(70), 'YOU', 12, '#c9b676').setOrigin(0, 0.5);
    this.hpBarBg = this.add.rectangle(l.x(-150), l.y(70), l.u(250), l.u(9), 0x1a2038).setOrigin(0, 0.5);
    this.hpBar = this.add.rectangle(l.x(-150), l.y(70), l.u(250), l.u(9), 0xd7b45c).setOrigin(0, 0.5);
    this.hpT = txt(l.x(190), l.y(70), '', 12).setOrigin(1, 0.5);

    // beast zone
    this.beastC = this.add.container(l.x(0), l.y(170));
    this.beastName = txt(l.x(0), l.y(280), '', 17, '#ffffff').setOrigin(0.5);
    this.beastTitle = txt(l.x(0), l.y(300), '', 11, '#8a94c4').setOrigin(0.5);
    this.ehpBarBg = this.add.rectangle(l.x(-110), l.y(322), l.u(220), l.u(8), 0x1a2038).setOrigin(0, 0.5);
    this.ehpBar = this.add.rectangle(l.x(-110), l.y(322), l.u(220), l.u(8), 0xe66a6a).setOrigin(0, 0.5);
    this.strikeT = txt(l.x(0), l.y(342), '', 12, '#e6a2a2').setOrigin(0.5);

    // casting line
    this.lineC = this.add.container(l.x(0), l.y(372));
    this.lineHint = txt(l.x(0), l.y(372), 'tap letters to weave a word', 12, '#5a6390').setOrigin(0.5).setAlpha(0.9);

    // board 4x4
    this.boardC = this.add.container(0, 0);
    this.tileSize = l.u(78); this.tileGap = l.u(8);
    this.slotPos = (i) => {
      const cx = i % 4, cy = Math.floor(i / 4);
      return {
        x: l.x(0) + (cx - 1.5) * (this.tileSize + this.tileGap),
        y: l.y(556) + (cy - 1.5) * (this.tileSize + this.tileGap),
      };
    };

    // buttons
    this.castB = this.add.image(l.x(60), l.y(754), 'btn').setDisplaySize(l.u(190), l.u(56)).setInteractive({ useHandCursor: true });
    this.castT = txt(l.x(60), l.y(754), 'CAST', 20, '#4a3305').setOrigin(0.5).setShadow(0, l.u(1), '#ffe9b0', l.u(1));
    this.castB.on('pointerdown', () => this.tryCast());
    this.scryB = this.add.rectangle(l.x(-140), l.y(754), l.u(110), l.u(50), 0x151b33).setStrokeStyle(l.u(1.5), 0x4a5a8c).setInteractive({ useHandCursor: true });
    this.scryT = txt(l.x(-140), l.y(754), 'SCRY ↻', 14, '#9fb0e8').setOrigin(0.5);
    this.scryB.on('pointerdown', () => this.scry());

    // mute
    this.muteB = txt(l.x(-195), l.y(790), SFX.muted ? '🔇' : '🔊', 14).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setAlpha(0.7);
    this.muteB.on('pointerdown', () => { SFX.ensure(); SFX.setMuted(!SFX.muted); this.muteB.setText(SFX.muted ? '🔇' : '🔊'); });
    txt(l.x(195), l.y(790), BUILD + (DAILY ? ' · DAILY' : ''), 9, '#39406b').setOrigin(1, 0.5);

    // floating layer for damage numbers etc.
    this.fxC = this.add.container(0, 0).setDepth(50);
    // particles
    this.starBurst = this.add.particles(0, 0, 'dot', {
      speed: { min: 60, max: 320 }, lifespan: { min: 300, max: 800 }, scale: { start: 0.9, end: 0 },
      blendMode: 'ADD', emitting: false,
    }).setDepth(60);
    this.overlayC = this.add.container(0, 0).setDepth(100);
  }

  // ---------- board ----------
  drawLetter() { return rpick(BAG); }
  boardVowels() { return this.board.filter((s) => s && VOWELS.includes(s.ch[0])).length; }

  fillBoard(initial) {
    for (let i = 0; i < 16; i++) {
      if (this.board[i]) continue;
      let ch = this.drawLetter();
      if (this.boardVowels() < 5 && !VOWELS.includes(ch)) ch = rpick(['a', 'e', 'i', 'o', 'u']);
      if (ch === 'q') ch = 'qu';
      this.spawnTile(i, ch, this.pendingTier || 0, initial);
      this.pendingTier = 0;
    }
  }

  spawnTile(i, ch, tier, initial) {
    const l = this.L(), p = this.slotPos(i);
    const c = this.add.container(p.x, p.y - (initial ? l.u(500) + i * l.u(14) : l.u(420)));
    const img = this.add.image(0, 0, 'tile' + tier).setDisplaySize(this.tileSize, this.tileSize);
    const letter = this.add.text(0, -l.u(2), ch === 'qu' ? 'Qu' : ch.toUpperCase(), {
      fontFamily: this.fonts.serif, fontSize: l.u(ch === 'qu' ? 34 : 40) + 'px', fontStyle: 'bold',
      color: tier === 2 ? '#1d4a66' : tier === 1 ? '#5a3c05' : '#3a3020',
    }).setOrigin(0.5);
    const val = this.add.text(l.u(28), l.u(24), String(this.tileVal(ch, tier)), {
      fontFamily: this.fonts.serif, fontSize: l.u(13) + 'px', fontStyle: 'bold',
      color: tier === 2 ? '#2a6a8e' : tier === 1 ? '#7a5510' : '#8d7f60',
    }).setOrigin(0.5);
    c.add([img, letter, val]);
    if (tier > 0) {
      const glow = this.add.image(0, 0, 'dot').setScale(this.tileSize / 9).setAlpha(tier === 2 ? 0.35 : 0.25)
        .setTint(tier === 2 ? 0x9fd8ff : 0xffd77a).setBlendMode('ADD');
      c.addAt(glow, 0);
    }
    c.setSize(this.tileSize, this.tileSize).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => this.tapTile(i));
    this.boardC.add(c);
    this.board[i] = { ch, tier, c };
    this.tweens.add({
      targets: c, y: p.y, duration: initial ? 550 : 420, ease: 'Bounce.easeOut', delay: (initial ? i * 45 : Math.random() * 90),
    });
  }

  tileVal(ch, tier) { return (VALS[ch[0]] || 1) + (ch === 'qu' ? 1 : 0) + (tier === 1 ? 6 : 0); }

  // ---------- selection ----------
  tapTile(i) {
    if (this.state !== 'pick') return;
    SFX.ensure();
    const k = this.sel.indexOf(i);
    if (k >= 0) { this.unselectFrom(k); return; }
    if (this.sel.length >= 8) return;
    this.sel.push(i);
    const s = this.board[i];
    s.c.setAlpha(0.28);
    SFX.chime(this.sel.length - 1);
    this.layoutLine();
  }

  unselectFrom(k) {
    SFX.unchime();
    const removed = this.sel.splice(k);
    for (const i of removed) this.board[i].c.setAlpha(1);
    this.layoutLine();
  }

  currentWord() { return this.sel.map((i) => this.board[i].ch).join(''); }

  layoutLine() {
    const l = this.L();
    for (const t of this.lineTiles) t.destroy();
    this.lineTiles = [];
    const n = this.sel.length;
    this.lineHint.setAlpha(n ? 0 : 0.9);
    const word = this.currentWord();
    const valid = n >= 3 && WORDSET.has(word);
    const sz = l.u(44), gap = l.u(6);
    const w = n * sz + (n - 1) * gap;
    this.sel.forEach((bi, k) => {
      const s = this.board[bi];
      const mc = this.add.container(-w / 2 + sz / 2 + k * (sz + gap), 0);
      const img = this.add.image(0, 0, 'tile' + s.tier).setDisplaySize(sz, sz);
      const letter = this.add.text(0, 0, s.ch === 'qu' ? 'Qu' : s.ch.toUpperCase(), {
        fontFamily: this.fonts.serif, fontSize: l.u(s.ch === 'qu' ? 17 : 21) + 'px', fontStyle: 'bold',
        color: valid ? '#1d6a35' : '#3a3020',
      }).setOrigin(0.5);
      mc.add([img, letter]);
      mc.setSize(sz, sz).setInteractive({ useHandCursor: true });
      mc.on('pointerdown', () => this.unselectFrom(k));
      this.lineC.add(mc);
      this.lineTiles.push(mc);
      mc.setScale(0.6); this.tweens.add({ targets: mc, scale: 1, duration: 140, ease: 'Back.easeOut' });
    });
    // cast button state
    const on = valid;
    this.castB.setAlpha(on ? 1 : 0.45);
    this.castT.setAlpha(on ? 1 : 0.5);
    this.castT.setText(on ? 'CAST ' + this.previewDamage() : 'CAST');
  }

  // ---------- damage ----------
  hasSigil(id) { return this.run.sigils.includes(id); }
  wordDamage(tiles) {
    let base = 0, starMult = 1, vowelsN = 0;
    for (const s of tiles) {
      base += this.tileVal(s.ch, s.tier);
      if (s.tier === 2) starMult = 1.5;
      const c0 = s.ch[0];
      if (VOWELS.includes(c0)) vowelsN++;
      if (this.hasSigil('runes') && 'sret'.includes(c0)) base += 2;
    }
    if (this.hasSigil('choir')) base += vowelsN * 2;
    let dmg = base * (LEN_MULT[Math.min(tiles.reduce((a, s) => a + s.ch.length, 0), 8)] || 2.3) * starMult;
    if (this.hasSigil('quill')) dmg += 4;
    if (this.hasSigil('first') && !this.run.firstUsed) dmg *= 2;
    return Math.round(dmg);
  }
  previewDamage() { return this.wordDamage(this.sel.map((i) => this.board[i])); }

  // ---------- fights ----------
  startFight() {
    const l = this.L();
    this.beast = { ...BEASTS[this.run.fight] };
    if (this.hasSigil('hush')) this.beast.timer += 1;
    this.beast.hpNow = this.beast.hp;
    this.beast.count = this.beast.timer;
    this.run.firstUsed = false;
    this.pips.forEach((p, i) => p.setTint(i < this.run.fight ? 0xd7b45c : i === this.run.fight ? 0xffffff : 0x39406b)
      .setScale(i === this.run.fight ? 0.9 : 0.6));
    this.drawBeast();
    this.beastName.setText(this.beast.name);
    this.beastTitle.setText(this.beast.title + (this.beast.boss ? ' · BOSS' : ''));
    this.updateBars();
    // board
    this.sel = [];
    for (const s of this.board) if (s) s.c.destroy();
    this.board = [];
    this.tweens.killTweensOf([this.boardC, this.lineC]);
    this.boardC.setAlpha(1); this.lineC.setAlpha(1);
    this.layoutLine();
    this.fillBoard(true);
    this.state = 'pick';
    // entrance
    this.beastC.setAlpha(0).setScale(0.7);
    this.tweens.add({ targets: this.beastC, alpha: 1, scale: 1, duration: 600, ease: 'Back.easeOut' });
  }

  drawBeast() {
    const l = this.L();
    this.beastC.removeAll(true);
    if (this.breathTween) { this.breathTween.stop(); this.breathTween = null; }
    const B = this.beast, sc = l.u(1.15) * (B.boss ? 1.15 : 1);
    const g = this.add.graphics();
    g.lineStyle(l.u(1.4), 0xffffff, 0.35);
    for (const [a, b] of B.edges) {
      g.lineBetween(B.stars[a][0] * sc, B.stars[a][1] * sc, B.stars[b][0] * sc, B.stars[b][1] * sc);
    }
    this.beastC.add(g);
    this.beastLines = g;
    this.beastStars = [];
    B.stars.forEach((p, i) => {
      const big = i % 3 === 0;
      const st = this.add.image(p[0] * sc, p[1] * sc, 'dot').setScale(big ? 1.1 : 0.7).setTint(B.tint).setBlendMode('ADD');
      this.beastC.add(st); this.beastStars.push(st);
      this.tweens.add({ targets: st, scale: (big ? 1.1 : 0.7) * 0.75, duration: 900 + (i * 137) % 900, yoyo: true, repeat: -1 });
    });
    for (const e of B.eyes) {
      const eye = this.add.image(e[0] * sc, e[1] * sc, 'dot').setScale(0.9).setTint(B.eye).setBlendMode('ADD');
      this.beastC.add(eye);
      this.tweens.add({ targets: eye, alpha: 0.5, duration: 700, yoyo: true, repeat: -1 });
    }
    this.breathTween = this.tweens.add({ targets: this.beastC, scaleX: 1.04, scaleY: 0.97, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  updateBars() {
    const l = this.L();
    this.hpBar.width = l.u(250) * clamp(this.run.hp / this.run.hpMax, 0, 1);
    this.hpT.setText(this.run.hp + ' / ' + this.run.hpMax);
    this.ehpBar.width = l.u(220) * clamp(this.beast.hpNow / this.beast.hp, 0, 1);
    this.strikeT.setText(this.beast.hpNow > 0 ? '✦ strikes in ' + this.beast.count + (this.beast.count === 1 ? ' cast ✦' : ' casts ✦') : '');
    this.scoreT.setText(String(this.runScore()));
  }
  runScore() { return this.run.totalDmg + this.run.longest.length * 15 + this.run.fight * 50; }

  // ---------- casting ----------
  tryCast() {
    if (this.state !== 'pick') return;
    const word = this.currentWord();
    if (this.sel.length < 3 || !WORDSET.has(word)) {
      SFX.invalid();
      this.cameras.main.shake(120, 0.004);
      const l = this.L();
      this.tweens.add({ targets: this.lineC, x: this.lineC.x + l.u(8), duration: 50, yoyo: true, repeat: 3 });
      return;
    }
    this.state = 'anim';
    const l = this.L();
    const tiles = this.sel.map((i) => this.board[i]);
    const dmg = this.wordDamage(tiles);
    const wlen = word.length;
    this.run.words++; this.run.firstUsed = true;
    if (wlen > this.run.longest.length) this.run.longest = word;
    SFX.cast(this.sel.length);

    // fly line tiles into the beast
    const tx = this.beastC.x - this.lineC.x, ty = this.beastC.y - this.lineC.y;
    this.lineTiles.forEach((mc, k) => {
      this.tweens.add({
        targets: mc, x: tx + (rng() - 0.5) * l.u(60), y: ty + (rng() - 0.5) * l.u(40),
        scale: 0.25, alpha: 0.9, delay: k * 55, duration: 260, ease: 'Cubic.easeIn',
        onComplete: () => {
          this.starBurst.emitParticleAt(this.beastC.x + (rng() - 0.5) * l.u(60), this.beastC.y + (rng() - 0.5) * l.u(40), 4);
          mc.destroy();
        },
      });
    });

    this.time.delayedCall(this.sel.length * 55 + 300, () => {
      SFX.impact();
      this.cameras.main.shake(140, 0.006);
      this.beastHit(dmg);
      // heal sigil
      if (this.hasSigil('salve') && wlen >= 5) this.heal(4);
      // consume tiles, forge gems
      const used = [...this.sel];
      this.sel = [];
      this.lineTiles = [];
      let tier = wlen >= 7 ? 2 : wlen >= 5 ? 1 : 0;
      if (tier > 0 && this.hasSigil('forge')) tier = 2;
      for (const i of used) { this.board[i].c.destroy(); this.board[i] = null; }
      if (tier > 0) { this.pendingTier = tier; SFX.forge(); }
      this.layoutLine();
      this.time.delayedCall(200, () => {
        if (this.beast.hpNow <= 0) return; // victory path runs from beastHit
        this.fillBoard(false);
        this.tickEnemy(() => { this.state = 'pick'; });
      });
    });
  }

  beastHit(dmg) {
    const l = this.L();
    this.beast.hpNow -= dmg;
    this.run.totalDmg += dmg;
    // damage number
    const dt = this.add.text(this.beastC.x, this.beastC.y - l.u(40), String(dmg), {
      fontFamily: this.fonts.serif, fontSize: l.u(34) + 'px', fontStyle: 'bold', color: '#ffe9a8',
    }).setOrigin(0.5).setShadow(0, l.u(2), '#000', l.u(6));
    this.fxC.add(dt);
    this.tweens.add({ targets: dt, y: dt.y - l.u(46), alpha: 0, scale: 1.25, duration: 800, ease: 'Cubic.easeOut', onComplete: () => dt.destroy() });
    // recoil + line flash
    this.tweens.add({ targets: this.beastC, x: this.beastC.x + l.u(10), duration: 60, yoyo: true, repeat: 1 });
    if (this.beastLines) { this.beastLines.setAlpha(1); this.tweens.add({ targets: this.beastLines, alpha: 0.35, duration: 300 }); }
    this.updateBars();
    if (this.beast.hpNow <= 0) this.beastDeath();
  }

  beastDeath() {
    this.state = 'anim';
    SFX.victory();
    const l = this.L();
    if (this.breathTween) this.breathTween.stop();
    // constellation shatters
    for (const st of this.beastStars) {
      const ang = Math.atan2(st.y, st.x) + (rng() - 0.5);
      this.tweens.add({
        targets: st, x: st.x + Math.cos(ang) * l.u(140), y: st.y + Math.sin(ang) * l.u(140),
        alpha: 0, scale: 0.1, duration: 900, ease: 'Cubic.easeOut',
      });
    }
    this.starBurst.emitParticleAt(this.beastC.x, this.beastC.y, 26);
    if (this.beastLines) this.tweens.add({ targets: this.beastLines, alpha: 0, duration: 350 });
    this.strikeT.setText('');
    this.run.fight++;
    this.heal(6);
    this.time.delayedCall(1100, () => {
      if (this.run.fight >= BEASTS.length) this.endRun(true);
      else this.showSigilPick();
    });
  }

  heal(n) {
    this.run.hp = clamp(this.run.hp + n, 0, this.run.hpMax);
    this.updateBars();
  }

  tickEnemy(done) {
    this.beast.count--;
    this.updateBars();
    if (this.beast.count > 0) { done(); return; }
    // beast strikes
    const l = this.L();
    this.beast.count = this.beast.timer;
    SFX.hurt();
    this.tweens.add({ targets: this.beastC, y: this.beastC.y + l.u(60), duration: 160, yoyo: true, ease: 'Cubic.easeIn' });
    this.cameras.main.shake(260, 0.012);
    this.cameras.main.flash(220, 120, 20, 30);
    this.time.delayedCall(220, () => {
      this.run.hp -= this.beast.atk;
      const dt = this.add.text(l.x(-160), l.y(70), '-' + this.beast.atk, {
        fontFamily: this.fonts.serif, fontSize: l.u(22) + 'px', fontStyle: 'bold', color: '#ff8a8a',
      }).setOrigin(0.5).setShadow(0, l.u(1.5), '#000', l.u(5));
      this.fxC.add(dt);
      this.tweens.add({ targets: dt, y: dt.y + l.u(30), alpha: 0, duration: 800, onComplete: () => dt.destroy() });
      this.updateBars();
      if (this.run.hp <= 0) this.endRun(false);
      else done();
    });
  }

  scry() {
    if (this.state !== 'pick') return;
    SFX.ensure(); SFX.noise(0.4, 600, 1, 0.12, 1800);
    this.state = 'anim';
    this.unselectFrom(0);
    for (let i = 0; i < 16; i++) { if (this.board[i]) { this.board[i].c.destroy(); this.board[i] = null; } }
    this.fillBoard(false);
    this.tickEnemy(() => { this.state = 'pick'; });
  }

  // ---------- sigil pick ----------
  showSigilPick() {
    const l = this.L();
    this.state = 'sigil';
    const avail = SIGILS.filter((s) => !this.run.sigils.includes(s.id));
    const opts = [];
    while (opts.length < 3 && avail.length) opts.push(avail.splice(Math.floor(rng() * avail.length), 1)[0]);
    this.tweens.add({ targets: [this.boardC, this.lineC], alpha: 0.1, duration: 300 });
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.82).setInteractive();
    const head = this.add.text(l.x(0), l.y(150), '— CHOOSE A SIGIL —', {
      fontFamily: this.fonts.serif, fontSize: l.u(18) + 'px', color: '#c9b676', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#c9b676', l.u(10), true, true);
    const items = [veil, head];
    opts.forEach((sg, k) => {
      const cy = l.y(280 + k * 150);
      const card = this.add.image(l.x(0), cy, 'panel').setDisplaySize(l.u(330), l.u(124)).setInteractive({ useHandCursor: true });
      const nm = this.add.text(l.x(0), cy - l.u(26), sg.name, {
        fontFamily: this.fonts.serif, fontSize: l.u(17) + 'px', color: '#6a4e11', fontStyle: 'bold',
      }).setOrigin(0.5);
      const ds = this.add.text(l.x(0), cy + l.u(8), sg.desc, {
        fontFamily: this.fonts.serif, fontSize: l.u(13) + 'px', color: '#4a4030', fontStyle: 'italic',
        wordWrap: { width: l.u(290) },
      }).setOrigin(0.5);
      items.push(card, nm, ds);
      card.setScale(0.7).setAlpha(0);
      nm.setAlpha(0); ds.setAlpha(0);
      this.tweens.add({ targets: [card], scale: { from: 0.7, to: l.u(330) / 256 }, alpha: 1, delay: 150 + k * 120, duration: 300, ease: 'Back.easeOut', onUpdate: (tw, t) => { t.setDisplaySize(l.u(330) * (0.7 + 0.3 * tw.progress), l.u(124) * (0.7 + 0.3 * tw.progress)); } });
      this.tweens.add({ targets: [nm, ds], alpha: 1, delay: 220 + k * 120, duration: 300 });
      card.on('pointerdown', () => {
        SFX.sigil();
        this.run.sigils.push(sg.id);
        if (sg.id === 'aegis') { this.run.hpMax += 20; this.run.hp = this.run.hpMax; }
        for (const it of items) it.destroy();
        this.startFight();
      });
    });
    this.overlayC.add(items);
    this.sigilCards = opts;
  }

  // ---------- run end ----------
  endRun(won) {
    const l = this.L();
    this.state = 'end';
    if (!won) SFX.defeat();
    this.tweens.add({ targets: [this.boardC, this.lineC], alpha: 0.1, duration: 300 });
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.82).setInteractive();
    const items = [veil];
    const t1 = this.add.text(l.x(0), l.y(220), won ? 'THE SKY IS QUIET' : 'THE STARS CLAIM YOU', {
      fontFamily: this.fonts.serif, fontSize: l.u(26) + 'px', color: won ? '#ffe9a8' : '#e66a6a', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, won ? '#c9b676' : '#802020', l.u(12), true, true);
    const lines = [
      'score  ' + this.runScore(),
      'beasts felled  ' + this.run.fight + ' / ' + BEASTS.length,
      'words woven  ' + this.run.words,
      'finest word  ' + (this.run.longest ? this.run.longest.toUpperCase() : '—'),
    ];
    items.push(t1);
    lines.forEach((s, k) => {
      items.push(this.add.text(l.x(0), l.y(300 + k * 34), s, {
        fontFamily: this.fonts.serif, fontSize: l.u(16) + 'px', color: '#d8d2bd',
      }).setOrigin(0.5));
    });
    const best = parseInt(localStorage.getItem('beta3.bestscore') || '0', 10);
    if (this.runScore() > best) localStorage.setItem('beta3.bestscore', String(this.runScore()));
    items.push(this.add.text(l.x(0), l.y(300 + 4 * 34), 'best  ' + Math.max(best, this.runScore()), {
      fontFamily: this.fonts.serif, fontSize: l.u(13) + 'px', color: '#8a94c4',
    }).setOrigin(0.5));
    const again = this.add.image(l.x(0), l.y(560), 'btn').setDisplaySize(l.u(220), l.u(64)).setInteractive({ useHandCursor: true });
    const againT = this.add.text(l.x(0), l.y(560), 'NEW RUN', {
      fontFamily: this.fonts.serif, fontSize: l.u(20) + 'px', color: '#4a3305', fontStyle: 'bold',
    }).setOrigin(0.5);
    items.push(again, againT);
    again.on('pointerdown', () => {
      for (const it of items) it.destroy();
      this.run = { fight: 0, hpMax: 50, hp: 50, sigils: [], score: 0, words: 0, longest: '', totalDmg: 0, firstUsed: false };
      this.startFight();
    });
    this.overlayC.add(items);
    if (DEMO) {
      localStorage.setItem('beta3.result', JSON.stringify({ won, score: this.runScore(), words: this.run.words, longest: this.run.longest }));
      this.time.delayedCall(2500, () => again.emit('pointerdown'));
    }
  }

  // ---------- demo solver ----------
  buildTrie() {
    if (this.trie) return;
    const root = {};
    for (const w of WORDSET) {
      if (w.length > 8) continue;
      let n = root;
      for (const ch of w) n = n[ch] || (n[ch] = {});
      n.$ = true;
    }
    this.trie = root;
  }
  bestWord() {
    this.buildTrie();
    const tiles = this.board.map((s, i) => ({ i, s })).filter((x) => x.s);
    let best = null, bestScore = -1;
    const used = new Array(tiles.length).fill(false);
    const pick = [];
    const dive = (node) => {
      if (node.$ && pick.length >= 3) {
        const dmg = this.wordDamage(pick.map((k) => tiles[k].s));
        if (dmg > bestScore) { bestScore = dmg; best = pick.map((k) => tiles[k].i); }
      }
      if (pick.length >= 8) return;
      const seen = new Set();
      for (let k = 0; k < tiles.length; k++) {
        if (used[k]) continue;
        const chs = tiles[k].s.ch;
        if (seen.has(chs + ':' + tiles[k].s.tier)) continue;
        seen.add(chs + ':' + tiles[k].s.tier);
        let n = node, ok = true;
        for (const ch of chs) { n = n[ch]; if (!n) { ok = false; break; } }
        if (!ok) continue;
        used[k] = true; pick.push(k);
        dive(n);
        used[k] = false; pick.pop();
      }
    };
    dive(this.trie);
    return best;
  }
  demoStep() {
    if (this.state !== 'pick') {
      if (this.state === 'sigil') {
        if (!this.sigilShownAt) this.sigilShownAt = this.time.now;
        if (this.time.now - this.sigilShownAt > 2200) {
          this.sigilShownAt = 0;
          const cards = this.overlayC.list.filter((o) => o.texture && o.texture.key === 'panel');
          if (cards.length) cards[Math.floor(Math.random() * cards.length)].emit('pointerdown');
        }
      }
      return;
    }
    if (this.sel.length) return;
    const best = this.bestWord();
    if (!best) { this.scry(); return; }
    best.forEach((bi, k) => this.time.delayedCall(k * 130, () => this.tapTile(bi)));
    this.time.delayedCall(best.length * 130 + 350, () => this.tryCast());
    // heartbeat
    localStorage.setItem('beta3.stat', JSON.stringify({
      v: BUILD, fight: this.run.fight, hp: this.run.hp, words: this.run.words,
      longest: this.run.longest, score: this.runScore(), t: Date.now(),
    }));
  }
}

/* ============================================================
   Boot
   ============================================================ */
const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: Math.round(window.innerWidth * DPR),
  height: Math.round(window.innerHeight * DPR),
  backgroundColor: '#0a0d1c',
  scale: { mode: Phaser.Scale.NONE },
  render: { antialias: true, powerPreference: 'high-performance' },
  scene: [Main],
});
function fitCanvas() {
  const c = game.canvas;
  if (!c) return;
  c.style.width = window.innerWidth + 'px';
  c.style.height = window.innerHeight + 'px';
}
game.events.once('ready', fitCanvas);
let resizeTo = null;
window.addEventListener('resize', () => {
  game.scale.resize(Math.round(window.innerWidth * DPR), Math.round(window.innerHeight * DPR));
  fitCanvas();
  clearTimeout(resizeTo);
  resizeTo = setTimeout(() => game.scene.getScene('main').scene.restart(), 250);
});
