'use strict';
/* ============================================================
   STARSPELL versus — three modes on one RTDB room system
   (pattern lifted from BoO raids: single room listener, txn
   join, multi-path turn handoff, onDisconnect presence).

   · DUEL  · TURNS — alternate casts, no clock, wait your turn
   · DUEL  · TIMED — both weave at once, 3:00, KO or higher HP
   · BATTLEGROUND  — 2–4 mages, turns rotate, hits find the leader

   Every 3rd cast of your own → sigil pick-3.
   Boards start identical (shared seed) then diverge.
   Testing: ?vsdemo=1&vsmode=turns|timed|bg&mpuid=a — solver plays.
   ============================================================ */

const VS_MAX = { turns: 2, timed: 2, bg: 4 };
const VS_MIN = { turns: 2, timed: 2, bg: 2 };
const VS_TIME_MS = 180000;
const VS_HP = 60;
const VS_EMBLEMS = ['vulpes', 'strix', 'serpens', 'draco'];
const VSDEMO = QS.get('vsdemo') === '1';
const MPUID = QS.get('mpuid');
const vsUid = () => (MPUID ? 'test_' + MPUID : SSNET.uid());
const vsName = () => (MPUID ? 'Wisp ' + MPUID.toUpperCase() : SSNET.myName());

/* ============================================================
   Menu — pick a mode, quick-match or join by seal code
   ============================================================ */
class VsMenu extends Phaser.Scene {
  constructor() { super('vsmenu'); }
  create() {
    const l = ssLayout(this);
    ssMakeTextures(this);
    ssStarfield(this, 90);
    const back = ssTxt(this, l.x(-195), l.y(24), '‹ HOME', l.u(14), '#9fb0e8').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { SFX.ui(); this.scene.start('home'); });
    ssTxt(this, l.x(0), l.y(70), '⚔ VERSUS ⚔', l.u(24), '#f3e5b4').setOrigin(0.5).setShadow(0, 0, '#c9a94f', l.u(14), true, true);
    ssTxt(this, l.x(0), l.y(102), 'as ' + vsName(), l.u(12), '#8a94c4', 'italic').setOrigin(0.5);

    if (SSNET.mode === 'local') {
      ssTxt(this, l.x(0), l.y(300), 'the wider sky is unreachable —\nduels need a connection', l.u(14), '#8c5a5a', 'italic').setOrigin(0.5).setAlign('center');
      return;
    }
    const rows = [
      { y: 190, label: 'DUEL · TURNS', sub: 'trade words blow for blow — no clock, no mercy', mode: 'turns' },
      { y: 278, label: 'DUEL · TIMED', sub: 'three minutes, both weaving at once', mode: 'timed' },
      { y: 366, label: 'BATTLEGROUND', sub: 'two to four mages · every hit finds the leader', mode: 'bg' },
    ];
    for (const r of rows) {
      const b = this.add.image(l.x(0), l.y(r.y), 'btn').setDisplaySize(l.u(320), l.u(66)).setInteractive({ useHandCursor: true });
      ssTxt(this, l.x(0), l.y(r.y - 10), r.label, l.u(17), '#4a3305').setOrigin(0.5);
      ssTxt(this, l.x(0), l.y(r.y + 13), r.sub, l.u(9.5), '#7a6535', 'italic').setOrigin(0.5);
      b.on('pointerdown', () => { SFX.ensure(); SFX.ui(); this.match(r.mode); });
    }
    ssTxt(this, l.x(0), l.y(460), '— or answer a summons —', l.u(12), '#5a6390').setOrigin(0.5);
    const joinB = this.add.image(l.x(0), l.y(505), 'btndark').setDisplaySize(l.u(260), l.u(52)).setInteractive({ useHandCursor: true });
    ssTxt(this, l.x(0), l.y(505), 'ENTER A SEAL CODE', l.u(14), '#9fb0e8').setOrigin(0.5);
    joinB.on('pointerdown', () => this.codePrompt(l));
    this.noteT = ssTxt(this, l.x(0), l.y(560), '', l.u(11), '#c9b676', 'italic').setOrigin(0.5);

    if (VSDEMO) this.time.delayedCall(600, () => this.match(QS.get('vsmode') || 'turns'));
  }
  codePrompt(l) {
    SFX.ui();
    const inp = document.createElement('input');
    inp.type = 'text'; inp.maxLength = 4; inp.placeholder = 'SEAL';
    inp.style.cssText = 'position:fixed;left:50%;top:30%;transform:translateX(-50%);z-index:9999;font:700 ' +
      Math.round(l.u(26)) + 'px Georgia,serif;text-align:center;letter-spacing:0.3em;text-transform:uppercase;background:#141a33;color:#f3e5b4;border:2px solid #c9a94f;border-radius:10px;padding:10px;outline:none;width:52%;max-width:220px;';
    document.body.appendChild(inp);
    inp.focus();
    const go = async () => {
      const code = inp.value.trim().toUpperCase();
      inp.remove();
      if (code.length !== 4) return;
      const ok = await vsJoinRoom(code);
      if (ok) this.scene.start('vsbattle', { code });
      else { this.noteT.setText('that seal answers to no one'); this.time.delayedCall(2000, () => this.noteT.setText('')); }
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); if (e.key === 'Escape') inp.remove(); });
    inp.addEventListener('blur', go);
  }
  async match(mode) {
    this.noteT && this.noteT.setText('consulting the stars…');
    const conn = await SSNET.connect();
    if (conn !== 'firebase') { this.noteT.setText('the wider sky is unreachable'); return; }
    const code = await vsQuickMatch(mode);
    if (code) this.scene.start('vsbattle', { code });
    else { this.noteT.setText('the stars refused — try again'); }
  }
}

/* ---------- room helpers ---------- */
function vsCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}
async function vsQuickMatch(mode) {
  try {
    const rooms = (await SSNET.dbGet('mp/rooms').catch(() => null)) || {};
    const now = Date.now();
    // housekeeping: clear stale rooms as we pass by
    for (const [id, r] of Object.entries(rooms)) {
      if (r && r.createdAt && now - r.createdAt > 40 * 60000) SSNET.dbSet('mp/rooms/' + id, null).catch(() => { });
    }
    for (const [id, r] of Object.entries(rooms)) {
      if (!r || r.status !== 'waiting' || r.mode !== mode) continue;
      if (now - (r.createdAt || 0) > 5 * 60000) continue;
      const n = Object.keys(r.players || {}).length;
      if (n >= VS_MAX[mode]) continue;
      if ((r.players || {})[vsUid()]) return id;
      if (await vsJoinRoom(id)) return id;
    }
    // open a new room
    const code = vsCode();
    await SSNET.dbSet('mp/rooms/' + code, {
      mode, status: 'waiting', createdAt: Date.now(), hostUid: vsUid(),
      seed: Math.floor(Math.random() * 1e9),
      players: { [vsUid()]: { name: vsName(), hp: VS_HP, seat: 0, casts: 0, dealt: 0, gone: false, joinedAt: Date.now() } },
    });
    return code;
  } catch (e) { return null; }
}
async function vsJoinRoom(code) {
  try {
    const r = await SSNET.dbTxn('mp/rooms/' + code, (cur) => {
      if (!cur) return cur; // room unknown (or first-pass null guess) — leave it be
      if (cur.status !== 'waiting') return cur;
      const players = cur.players || {};
      if (players[vsUid()]) return cur;
      if (Object.keys(players).length >= VS_MAX[cur.mode]) return cur;
      const seats = Object.values(players).map((p) => p.seat);
      let seat = 0;
      while (seats.includes(seat)) seat++;
      players[vsUid()] = { name: vsName(), hp: VS_HP, seat, casts: 0, dealt: 0, gone: false, joinedAt: Date.now() };
      return { ...cur, players };
    });
    return !!(r.value && r.value.players && r.value.players[vsUid()]);
  } catch (e) { return false; }
}

/* ============================================================
   The versus battlefield (lobby + fight + end in one scene)
   ============================================================ */
class VsBattle extends Phaser.Scene {
  constructor() { super('vsbattle'); }
  init(d) { this.code = d.code; }

  create() {
    const l = this.L = ssLayout(this);
    ssMakeTextures(this);
    ssStarfield(this, 100);
    this.room = null;
    this.state = 'wait';       // wait | pick | anim | sigil | done
    this.board = []; this.sel = []; this.lineTiles = [];
    this.mySigils = [];
    this.seenCasts = {};
    this.scryCooldown = 0;
    this.buildUi();

    this.roomRef = SSNET.ref('mp/rooms/' + this.code);
    if (!this.roomRef) { this.scene.start('vsmenu'); return; }
    this.onRoomCb = (snap) => this.onRoom(snap.val());
    this.roomRef.on('value', this.onRoomCb);
    this.meRef = SSNET.ref('mp/rooms/' + this.code + '/players/' + vsUid());
    if (this.meRef) this.meRef.child('gone').onDisconnect().set(true);
    this.castsRef = SSNET.ref('mp/rooms/' + this.code + '/casts');
    this.onCastCb = (snap) => { this.onCast(snap.key, snap.val()); };
    if (this.castsRef) this.castsRef.on('child_added', this.onCastCb);

    this.events.once('shutdown', () => {
      if (this.roomRef) this.roomRef.off('value', this.onRoomCb);
      if (this.castsRef) this.castsRef.off('child_added', this.onCastCb);
      if (this.meRef && this.room && this.room.status !== 'done') this.meRef.update({ gone: true }).catch(() => { });
    });

    if (VSDEMO) this.time.addEvent({ delay: 1500, loop: true, callback: () => this.demoStep() });
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.secondTick() });
    this.input.on('pointerdown', () => SFX.ensure());
  }

  buildUi() {
    const l = this.L;
    const txt = (x, y, s, size, color, style) => ssTxt(this, x, y, s, l.u(size), color, style);
    this.headT = txt(l.x(0), l.y(24), 'SEAL ' + this.code, 14, '#c9b676').setOrigin(0.5);
    this.clockT = txt(l.x(190), l.y(24), '', 15, '#ffe9a8').setOrigin(1, 0.5);
    const back = txt(l.x(-195), l.y(24), '‹', 22, '#5a6390').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { SFX.ui(); this.scene.start('vsmenu'); });

    this.oppC = this.add.container(0, 0);          // opponents row
    this.turnT = txt(l.x(0), l.y(320), '', 14, '#ffe9a8').setOrigin(0.5);

    txt(l.x(-190), l.y(352), 'YOU', 11, '#c9b676').setOrigin(0, 0.5);
    this.myName = txt(l.x(-150), l.y(352), vsName(), 12, '#f0e8d2').setOrigin(0, 0.5);
    this.hpBarBg = this.add.rectangle(l.x(-150), l.y(370), l.u(300), l.u(9), 0x1a2038).setOrigin(0, 0.5);
    this.hpBar = this.add.rectangle(l.x(-150), l.y(370), l.u(300), l.u(9), 0xd7b45c).setOrigin(0, 0.5);
    this.hpT = txt(l.x(190), l.y(352), VS_HP + ' / ' + VS_HP, 12).setOrigin(1, 0.5);

    this.lineC = this.add.container(l.x(0), l.y(408));
    this.lineHint = txt(l.x(0), l.y(408), 'tap letters to weave a word', 12, '#5a6390').setOrigin(0.5);

    this.boardC = this.add.container(0, 0);
    this.tileSize = l.u(78); this.tileGap = l.u(8);
    this.slotPos = (i) => ({
      x: l.x(0) + ((i % 4) - 1.5) * (this.tileSize + this.tileGap),
      y: l.y(576) + (Math.floor(i / 4) - 1.5) * (this.tileSize + this.tileGap),
    });

    this.castB = this.add.image(l.x(70), l.y(766), 'btn').setDisplaySize(l.u(180), l.u(52)).setInteractive({ useHandCursor: true });
    this.castT = txt(l.x(70), l.y(766), 'CAST', 19, '#4a3305').setOrigin(0.5);
    this.castB.on('pointerdown', () => this.tryCast());
    this.scryB = this.add.rectangle(l.x(-140), l.y(766), l.u(110), l.u(48), 0x151b33).setStrokeStyle(l.u(1.5), 0x4a5a8c).setInteractive({ useHandCursor: true });
    this.scryT = txt(l.x(-140), l.y(766), 'SCRY ↻', 13, '#9fb0e8').setOrigin(0.5);
    this.scryB.on('pointerdown', () => this.scry());

    this.fxC = this.add.container(0, 0).setDepth(50);
    this.starBurst = this.add.particles(0, 0, 'dot', {
      speed: { min: 60, max: 320 }, lifespan: { min: 300, max: 800 }, scale: { start: 0.9, end: 0 },
      blendMode: 'ADD', emitting: false,
    }).setDepth(60);
    this.overlayC = this.add.container(0, 0).setDepth(100);

    // lobby veil
    this.lobbyC = this.add.container(0, 0).setDepth(90);
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.75);
    this.lobbyTitle = txt(l.x(0), l.y(240), 'THE SUMMONS IS SEALED', 20, '#f3e5b4').setOrigin(0.5)
      .setShadow(0, 0, '#c9a94f', l.u(12), true, true);
    this.lobbyCode = txt(l.x(0), l.y(300), this.code, 44, '#ffe9a8').setOrigin(0.5)
      .setShadow(0, 0, '#c9a94f', l.u(18), true, true);
    this.lobbySub = txt(l.x(0), l.y(348), 'share this seal — your rival enters it under VERSUS', 11, '#8a94c4', 'italic').setOrigin(0.5);
    this.lobbyRoster = txt(l.x(0), l.y(430), '', 14, '#d8d2bd').setOrigin(0.5).setAlign('center');
    this.beginB = this.add.image(l.x(0), l.y(540), 'btn').setDisplaySize(l.u(220), l.u(56)).setInteractive({ useHandCursor: true }).setVisible(false);
    this.beginT = txt(l.x(0), l.y(540), 'BEGIN THE BATTLE', 15, '#4a3305').setOrigin(0.5).setVisible(false);
    this.beginB.on('pointerdown', () => this.hostStart());
    this.lobbyC.add([veil, this.lobbyTitle, this.lobbyCode, this.lobbySub, this.lobbyRoster, this.beginB, this.beginT]);
  }

  /* ---------- room snapshots drive everything ---------- */
  me() { return this.room && this.room.players ? this.room.players[vsUid()] : null; }
  others() {
    if (!this.room || !this.room.players) return [];
    return Object.entries(this.room.players).filter(([id]) => id !== vsUid())
      .map(([id, p]) => ({ id, ...p })).sort((a, b) => a.seat - b.seat);
  }
  alivePlayers() {
    return Object.entries((this.room && this.room.players) || {})
      .filter(([, p]) => p.hp > 0 && !p.gone).map(([id, p]) => ({ id, ...p }));
  }
  isMyTurn() {
    if (!this.room || this.room.status !== 'active') return false;
    if (this.room.mode === 'timed') return true;
    return this.room.turnUid === vsUid();
  }

  onRoom(room) {
    if (!room) { if (this.state !== 'done') { this.scene.start('vsmenu'); } return; }
    const first = !this.room;
    const prevStatus = this.room && this.room.status;
    this.room = room;
    if (room.status === 'waiting') { this.updateLobby(); this.maybeAutoStart(); return; }
    if (room.status === 'active' && (first || prevStatus === 'waiting')) this.beginBattle();
    if (room.status === 'active') {
      this.updatePanels();
      this.checkEnd();
    }
    if (room.status === 'done' && this.state !== 'done') this.endBattle();
  }

  updateLobby() {
    const n = Object.keys(this.room.players || {}).length;
    const names = Object.values(this.room.players || {}).sort((a, b) => a.seat - b.seat)
      .map((p, i) => (i + 1) + '.  ' + p.name + (p.name === vsName() ? '   (you)' : ''));
    this.lobbyRoster.setText(names.join('\n') + '\n\n' + n + ' / ' + VS_MAX[this.room.mode] + ' mages answered');
    const host = this.room.hostUid === vsUid();
    const canBegin = this.room.mode === 'bg' && host && n >= VS_MIN.bg;
    this.beginB.setVisible(canBegin); this.beginT.setVisible(canBegin);
  }
  maybeAutoStart() {
    const n = Object.keys(this.room.players || {}).length;
    const auto = this.room.mode !== 'bg' && n >= VS_MAX[this.room.mode];
    const full = this.room.mode === 'bg' && n >= VS_MAX.bg;
    if ((auto || full) && this.room.hostUid === vsUid()) this.hostStart();
    if (VSDEMO && this.room.mode === 'bg' && this.room.hostUid === vsUid() && n >= VS_MIN.bg) {
      // demo battlegrounds start as soon as two wisps answer
      this.time.delayedCall(2500, () => { if (this.room && this.room.status === 'waiting') this.hostStart(); });
    }
  }
  hostStart() {
    if (!this.room || this.room.status !== 'waiting' || this.room.hostUid !== vsUid()) return;
    const seats = Object.entries(this.room.players).map(([id, p]) => ({ id, seat: p.seat })).sort((a, b) => a.seat - b.seat);
    this.roomRef.update({ status: 'active', startedAt: Date.now(), turnUid: seats[0].id, turnCount: 0 }).catch(() => { });
  }

  beginBattle() {
    SFX.victory();
    const l = this.L;
    this.tweens.add({ targets: this.lobbyC, alpha: 0, duration: 400, onComplete: () => this.lobbyC.setVisible(false) });
    setSeed(this.room.seed || 1);
    this.board = []; this.sel = [];
    this.fillBoard(true);
    this.buildOpponentPanels();
    this.state = 'pick';
    this.updatePanels();
    const go = ssTxt(this, l.x(0), l.y(400), 'WEAVE!', l.u(30), '#2fe0d0').setOrigin(0.5).setDepth(80).setScale(0.5);
    this.tweens.add({ targets: go, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.tweens.add({ targets: go, alpha: 0, delay: 900, duration: 300, onComplete: () => go.destroy() });
  }

  buildOpponentPanels() {
    const l = this.L;
    this.oppC.removeAll(true);
    this.oppPanels = {};
    const opps = this.others();
    const n = opps.length;
    opps.forEach((p, i) => {
      const w = n === 1 ? 360 : 176;
      const cx = n === 1 ? 0 : (i % 2 === 0 ? -95 : 95);
      const cy = n === 1 ? 150 : (i < 2 ? 110 : 230);
      const c = this.add.container(l.x(cx), l.y(cy));
      const av = this.add.container(n === 1 ? -l.u(120) : -l.u(60), 0);
      ssAssembleBeast(this, av, SS_BEASTS[VS_EMBLEMS[p.seat % VS_EMBLEMS.length]], l.u(n === 1 ? 0.35 : 0.2));
      const nm = ssTxt(this, l.u(n === 1 ? -40 : -30), -l.u(22), p.name, l.u(n === 1 ? 15 : 12), '#f0e8d2').setOrigin(0, 0.5);
      const barBg = this.add.rectangle(l.u(n === 1 ? -40 : -30), 0, l.u(n === 1 ? 200 : 110), l.u(8), 0x1a2038).setOrigin(0, 0.5);
      const bar = this.add.rectangle(l.u(n === 1 ? -40 : -30), 0, l.u(n === 1 ? 200 : 110), l.u(8), 0xe66a6a).setOrigin(0, 0.5);
      const sub = ssTxt(this, l.u(n === 1 ? -40 : -30), l.u(20), '', l.u(10), '#8a94c4', 'italic').setOrigin(0, 0.5);
      c.add([av, nm, barBg, bar, sub]);
      this.oppC.add(c);
      this.oppPanels[p.id] = { c, bar, sub, nm, w: l.u(n === 1 ? 200 : 110) };
    });
  }

  updatePanels() {
    if (!this.room || !this.oppPanels) return;
    const me = this.me();
    if (me) {
      this.hpBar.width = this.L.u(300) * clamp(me.hp / VS_HP, 0, 1);
      this.hpT.setText(Math.max(0, me.hp) + ' / ' + VS_HP);
    }
    for (const p of this.others()) {
      const pan = this.oppPanels[p.id];
      if (!pan) continue;
      pan.bar.width = pan.w * clamp(p.hp / VS_HP, 0, 1);
      pan.sub.setText(p.gone ? 'faded away' : p.hp <= 0 ? 'defeated' : p.lastWord ? '· ' + p.lastWord : '');
      pan.c.setAlpha(p.hp <= 0 || p.gone ? 0.35 : 1);
    }
    if (this.room.mode === 'timed') this.turnT.setText(this.state === 'sigil' ? 'choose your sigil' : 'weave freely — the clock burns');
    else {
      const who = this.room.players && this.room.players[this.room.turnUid];
      this.turnT.setText(this.isMyTurn() ? '✦ YOUR TURN ✦' : (who ? who.name + ' is weaving…' : ''));
      this.turnT.setColor(this.isMyTurn() ? '#ffe9a8' : '#5a6390');
    }
    const canAct = this.state === 'pick' && this.isMyTurn();
    this.castB.setAlpha(canAct ? (this.validWord() ? 1 : 0.45) : 0.25);
    this.scryB.setAlpha(canAct && this.scryCooldown <= 0 ? 1 : 0.25);
  }

  secondTick() {
    if (this.scryCooldown > 0) this.scryCooldown--;
    if (!this.room || this.room.status !== 'active') return;
    if (this.room.mode === 'timed') {
      const left = Math.max(0, VS_TIME_MS - (Date.now() - this.room.startedAt));
      const m = Math.floor(left / 60000), s = Math.floor(left % 60000 / 1000);
      this.clockT.setText(m + ':' + (s < 10 ? '0' : '') + s);
      if (left <= 0) this.checkEnd(true);
    }
    this.updatePanels();
  }

  /* ---------- board (mirror of solo board, PvP damage) ---------- */
  boardVowels() { return this.board.filter((s) => s && VOWELS.includes(s.ch[0])).length; }
  fillBoard(initial) {
    for (let i = 0; i < 16; i++) {
      if (this.board[i]) continue;
      let ch = rpick(BAG);
      if (this.boardVowels() < 5 && !VOWELS.includes(ch)) ch = rpick(['a', 'e', 'i', 'o', 'u']);
      if (ch === 'q') ch = 'qu';
      const tier = this.pendingTier || 0;
      this.pendingTier = 0;
      this.spawnTile(i, ch, tier, initial);
    }
  }
  spawnTile(i, ch, tier, initial) {
    const l = this.L, p = this.slotPos(i);
    const c = this.add.container(p.x, p.y - l.u(initial ? 460 : 420));
    const img = this.add.image(0, 0, 'tile' + tier).setDisplaySize(this.tileSize, this.tileSize);
    const letter = this.add.text(0, -l.u(2), ch === 'qu' ? 'Qu' : ch.toUpperCase(), {
      fontFamily: SERIF, fontSize: l.u(ch === 'qu' ? 30 : 36) + 'px', fontStyle: 'bold',
      color: tier === 2 ? '#1d4a66' : tier === 1 ? '#5a3c05' : '#3a3020',
    }).setOrigin(0.5);
    const val = this.add.text(l.u(25), l.u(21), String(this.tileVal(ch, tier)), {
      fontFamily: SERIF, fontSize: l.u(12) + 'px', fontStyle: 'bold', color: tier === 1 ? '#7a5510' : '#8d7f60',
    }).setOrigin(0.5);
    c.add([img, letter, val]);
    c.setSize(this.tileSize, this.tileSize).setInteractive({ useHandCursor: true });
    c.on('pointerdown', () => this.tapTile(i));
    this.boardC.add(c);
    this.board[i] = { ch, tier, c };
    this.tweens.add({ targets: c, y: p.y, duration: 450, ease: 'Bounce.easeOut', delay: initial ? i * 40 : Math.random() * 90 });
  }
  tileVal(ch, tier) { return (VALS[ch[0]] || 1) + (ch === 'qu' ? 1 : 0) + (tier === 1 ? 6 : 0); }
  tapTile(i) {
    if (this.state !== 'pick' || !this.isMyTurn()) return;
    SFX.ensure();
    const k = this.sel.indexOf(i);
    if (k >= 0) { this.unselectFrom(k); return; }
    if (this.sel.length >= 8) return;
    this.sel.push(i);
    this.board[i].c.setAlpha(0.28);
    SFX.chime(this.sel.length - 1);
    this.layoutLine();
  }
  unselectFrom(k) {
    if (!this.sel.length) return;
    SFX.unchime();
    const removed = this.sel.splice(k);
    for (const i of removed) if (this.board[i]) this.board[i].c.setAlpha(1);
    this.layoutLine();
  }
  currentWord() { return this.sel.map((i) => this.board[i].ch).join(''); }
  validWord() { const w = this.currentWord(); return this.sel.length >= 3 && WORDSET.has(w); }
  layoutLine() {
    const l = this.L;
    for (const t of this.lineTiles) t.destroy();
    this.lineTiles = [];
    const n = this.sel.length;
    this.lineHint.setAlpha(n ? 0 : 0.9);
    const valid = this.validWord();
    const sz = l.u(44), gap = l.u(6);
    const w = n * sz + (n - 1) * gap;
    this.sel.forEach((bi, k) => {
      const s = this.board[bi];
      const mc = this.add.container(-w / 2 + sz / 2 + k * (sz + gap), 0);
      mc.add(this.add.image(0, 0, 'tile' + s.tier).setDisplaySize(sz, sz));
      mc.add(this.add.text(0, 0, s.ch === 'qu' ? 'Qu' : s.ch.toUpperCase(), {
        fontFamily: SERIF, fontSize: l.u(20) + 'px', fontStyle: 'bold', color: valid ? '#1d6a35' : '#3a3020',
      }).setOrigin(0.5));
      mc.setSize(sz, sz).setInteractive({ useHandCursor: true });
      mc.on('pointerdown', () => this.unselectFrom(k));
      this.lineC.add(mc);
      this.lineTiles.push(mc);
      mc.setScale(0.6); this.tweens.add({ targets: mc, scale: 1, duration: 140, ease: 'Back.easeOut' });
    });
    this.castT.setText(valid ? 'CAST ' + this.wordDamage(this.sel.map((i) => this.board[i])) : 'CAST');
    this.updatePanels();
  }
  hasSigil(id) { return this.mySigils.includes(id); }
  wordDamage(tiles) {
    let base = 0, starMult = 1, vowelsN = 0, letters = 0;
    for (const s of tiles) {
      base += this.tileVal(s.ch, s.tier);
      if (s.tier === 2) starMult = 1.5;
      letters += s.ch.length;
      if (VOWELS.includes(s.ch[0])) vowelsN++;
      if (this.hasSigil('runes') && 'sret'.includes(s.ch[0])) base += 2;
    }
    if (this.hasSigil('choir')) base += vowelsN * 2;
    let dmg = base * (LEN_MULT[Math.min(letters, 8)] || 2.3) * starMult;
    if (this.hasSigil('quill')) dmg += 4;
    if (this.hasSigil('longbow') && letters >= 6) dmg += 12;
    if (this.hasSigil('blood')) dmg *= 1.25;
    return Math.round(dmg);
  }

  pickTarget() {
    const foes = this.alivePlayers().filter((p) => p.id !== vsUid());
    if (!foes.length) return null;
    foes.sort((a, b) => b.hp - a.hp);
    return foes[0];
  }

  async tryCast() {
    if (this.state !== 'pick' || !this.isMyTurn()) return;
    const l = this.L;
    if (!this.validWord()) {
      SFX.invalid();
      this.tweens.add({ targets: this.lineC, x: this.lineC.x + l.u(8), duration: 50, yoyo: true, repeat: 3, onComplete: () => this.lineC.setX(l.x(0)) });
      return;
    }
    const word = this.currentWord();
    const tiles = this.sel.map((i) => this.board[i]);
    const letters = tiles.reduce((a, s) => a + s.ch.length, 0);
    const dmg = this.wordDamage(tiles);
    const target = this.pickTarget();
    if (!target) return;
    this.state = 'anim';
    SFX.cast(this.sel.length);
    if (letters >= 6) { SFX.bigWord(); this.cameras.main.flash(220, 240, 210, 120, false); }
    SS.prof.words++; SS.save();

    // fly tiles toward the target's panel
    const pan = this.oppPanels[target.id];
    const tx = (pan ? pan.c.x : l.x(0)) - this.lineC.x, ty = (pan ? pan.c.y : l.y(150)) - this.lineC.y;
    this.lineTiles.forEach((mc, k) => {
      this.tweens.add({
        targets: mc, x: tx, y: ty, scale: 0.2, alpha: 0.9, delay: k * 50, duration: 260, ease: 'Cubic.easeIn',
        onComplete: () => { this.starBurst.emitParticleAt(this.lineC.x + tx, this.lineC.y + ty, 4); mc.destroy(); },
      });
    });
    const used = [...this.sel];
    this.sel = []; this.lineTiles = [];
    this.time.delayedCall(used.length * 50 + 300, () => SFX.impact());

    // authoritative writes: the caster deals the damage
    try {
      await this.castsRef.push({ uid: vsUid(), name: vsName(), word: word.toUpperCase(), dmg, target: target.id, at: Date.now() });
      await SSNET.dbTxn('mp/rooms/' + this.code + '/players/' + target.id + '/hp', (cur) => Math.max(0, (cur == null ? VS_HP : cur) - dmg));
      const myCasts = ((this.me() || {}).casts | 0) + 1;
      const up = { lastWord: word.toUpperCase(), casts: myCasts, dealt: ((this.me() || {}).dealt | 0) + dmg };
      await this.meRef.update(up);
      // turn handoff (turns + battleground)
      if (this.room.mode !== 'timed') {
        const alive = this.alivePlayers().sort((a, b) => a.seat - b.seat);
        const idx = alive.findIndex((p) => p.id === vsUid());
        let next = vsUid();
        for (let i = 1; i <= alive.length; i++) {
          const cand = alive[(idx + i) % alive.length];
          if (cand.hp > 0 && !cand.gone) { next = cand.id; break; }
        }
        await this.roomRef.update({ turnUid: next, turnCount: (this.room.turnCount | 0) + 1 });
      }
      for (const i of used) { if (this.board[i]) { this.board[i].c.destroy(); this.board[i] = null; } }
      if (letters >= 7) this.pendingTier = 2;
      else if (letters >= 5) this.pendingTier = 1;
      if (this.pendingTier && this.hasSigil('forge')) this.pendingTier = 2;
      if (this.pendingTier) SFX.forge();
      this.fillBoard(false);
      this.layoutLine();
      // roguelite pick-3 every 3 of my casts
      if (myCasts % 3 === 0) this.showSigilPick();
      else this.state = 'pick';
      this.checkEnd();
    } catch (e) {
      this.state = 'pick';
    }
    this.updatePanels();
  }

  scry() {
    if (this.state !== 'pick' || !this.isMyTurn() || this.scryCooldown > 0) return;
    SFX.ensure(); SFX.noise(0.4, 600, 1, 0.12, 1800);
    this.unselectFrom(0);
    for (let i = 0; i < 16; i++) { if (this.board[i]) { this.board[i].c.destroy(); this.board[i] = null; } }
    this.fillBoard(false);
    if (this.room.mode === 'timed') { this.scryCooldown = 6; return; }
    // turn modes: the reroll is your action
    const alive = this.alivePlayers().sort((a, b) => a.seat - b.seat);
    const idx = alive.findIndex((p) => p.id === vsUid());
    const next = alive.length > 1 ? alive[(idx + 1) % alive.length].id : vsUid();
    this.roomRef.update({ turnUid: next, turnCount: (this.room.turnCount | 0) + 1 }).catch(() => { });
  }

  onCast(key, cast) {
    if (!cast || this.seenCasts[key]) return;
    this.seenCasts[key] = true;
    if (cast.uid === vsUid()) return;
    const l = this.L;
    if (cast.target === vsUid()) {
      SFX.hurt();
      this.cameras.main.shake(200, 0.01);
      this.cameras.main.flash(200, 120, 20, 30);
      const t = ssTxt(this, l.x(0), l.y(370), cast.name + ' cast ' + cast.word + '   −' + cast.dmg, l.u(14), '#ff8a8a').setOrigin(0.5).setDepth(80);
      this.tweens.add({ targets: t, y: t.y - l.u(26), alpha: 0, duration: 1400, onComplete: () => t.destroy() });
    } else {
      const t = ssTxt(this, l.x(0), l.y(88), cast.name + ' → ' + cast.word + ' −' + cast.dmg, l.u(11), '#8a94c4', 'italic').setOrigin(0.5).setDepth(80);
      this.tweens.add({ targets: t, alpha: 0, duration: 1600, onComplete: () => t.destroy() });
    }
  }

  showSigilPick() {
    const l = this.L;
    this.state = 'sigil';
    const avail = SS_SIGILS.filter((s) => !this.mySigils.includes(s.id) && !['aegis', 'hush', 'shield', 'feather', 'salve', 'comet', 'tome', 'first'].includes(s.id));
    const opts = [];
    while (opts.length < 3 && avail.length) opts.push(avail.splice(Math.floor(Math.random() * avail.length), 1)[0]);
    if (!opts.length) { this.state = 'pick'; return; }
    const head = ssTxt(this, l.x(0), l.y(430), '— A SIGIL OFFERS ITSELF —', l.u(14), '#c9b676').setOrigin(0.5).setDepth(120);
    const items = [head];
    opts.forEach((sg, k) => {
      const cy = l.y(490 + k * 78);
      const card = this.add.image(l.x(0), cy, 'panel').setDisplaySize(l.u(320), l.u(66)).setInteractive({ useHandCursor: true }).setDepth(120);
      const nm = ssTxt(this, l.x(0), cy - l.u(14), sg.name, l.u(14), '#6a4e11').setOrigin(0.5).setDepth(121);
      const ds = ssTxt(this, l.x(0), cy + l.u(10), sg.desc, l.u(10), '#4a4030', 'italic').setOrigin(0.5).setDepth(121);
      items.push(card, nm, ds);
      card.on('pointerdown', () => {
        SFX.sigil();
        this.mySigils.push(sg.id);
        if (this.meRef) this.meRef.update({ sigils: this.mySigils }).catch(() => { });
        for (const it of items) it.destroy();
        this.state = 'pick';
        this.updatePanels();
      });
    });
    this.overlayC.add(items);
  }

  checkEnd(timeUp) {
    if (!this.room || this.room.status !== 'active') return;
    const alive = this.alivePlayers();
    const timedOut = this.room.mode === 'timed' && (timeUp || Date.now() - this.room.startedAt > VS_TIME_MS);
    if (alive.length <= 1 || timedOut) {
      let winner = alive[0];
      if (timedOut && alive.length > 1) winner = [...alive].sort((a, b) => b.hp - a.hp || (b.dealt | 0) - (a.dealt | 0))[0];
      this.roomRef.update({ status: 'done', winnerUid: winner ? winner.id : null, endedAt: Date.now() }).catch(() => { });
    }
  }

  endBattle() {
    this.state = 'done';
    const l = this.L;
    const won = this.room.winnerUid === vsUid();
    const winner = this.room.players[this.room.winnerUid];
    if (won) { SFX.victory(); SS.prof.wins++; } else SFX.defeat();
    SS.prof.runs++; SS.save(); SS.sync();
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.85).setInteractive().setDepth(150);
    const items = [veil];
    items.push(ssTxt(this, l.x(0), l.y(280), won ? 'THE SKY BOWS TO YOU' : 'THE DUEL IS LOST', l.u(24), won ? '#ffe9a8' : '#e66a6a').setOrigin(0.5).setDepth(151)
      .setShadow(0, 0, won ? '#c9b676' : '#802020', l.u(12), true, true));
    items.push(ssTxt(this, l.x(0), l.y(330), winner ? winner.name + ' stands alone beneath the stars' : 'the night ends quietly', l.u(13), '#d8d2bd', 'italic').setOrigin(0.5).setDepth(151));
    const me = this.me() || {};
    items.push(ssTxt(this, l.x(0), l.y(380), 'damage dealt  ' + (me.dealt | 0) + '   ·   words  ' + (me.casts | 0), l.u(13), '#8a94c4').setOrigin(0.5).setDepth(151));
    const homeB = this.add.image(l.x(0), l.y(470), 'btn').setDisplaySize(l.u(220), l.u(56)).setInteractive({ useHandCursor: true }).setDepth(151);
    const homeT = ssTxt(this, l.x(0), l.y(470), 'RETURN', l.u(16), '#4a3305').setOrigin(0.5).setDepth(151);
    items.push(homeB, homeT);
    homeB.on('pointerdown', () => { SFX.ui(); this.scene.start(VSDEMO ? 'vsmenu' : 'vsmenu'); });
    this.overlayC.add(items);
    if (VSDEMO) {
      localStorage.setItem('beta3.vsresult', JSON.stringify({ won, mode: this.room.mode, dealt: me.dealt | 0, casts: me.casts | 0, t: Date.now() }));
    }
  }

  /* ---------- demo: the solver duels itself ---------- */
  demoStep() {
    if (this.state === 'sigil') {
      const cards = this.overlayC.list.filter((o) => o.texture && o.texture.key === 'panel');
      if (cards.length) cards[Math.floor(Math.random() * cards.length)].emit('pointerdown');
      return;
    }
    if (this.state !== 'pick' || !this.isMyTurn() || this.sel.length) return;
    this.buildTrie();
    const best = this.bestWord();
    if (!best) { this.scry(); return; }
    best.forEach((bi, k) => this.time.delayedCall(k * 110, () => this.tapTile(bi)));
    this.time.delayedCall(best.length * 110 + 300, () => this.tryCast());
    localStorage.setItem('beta3.vsstat', JSON.stringify({
      v: BUILD, code: this.code, mode: this.room ? this.room.mode : '?', myhp: (this.me() || {}).hp,
      casts: (this.me() || {}).casts | 0, t: Date.now(),
    }));
  }
}
VsBattle.prototype.buildTrie = Battle.prototype.buildTrie;
VsBattle.prototype.bestWord = Battle.prototype.bestWord;

game.scene.add('vsmenu', VsMenu);
game.scene.add('vsbattle', VsBattle);
