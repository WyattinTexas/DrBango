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

   Connections (v0.25): the front door is FRIENDS — a mutual list in
   RTDB (SSNET.FR), presence dots, one-tap CHALLENGE that seals a
   private room and rings a summons banner on the friend's screen
   (VsSummons overlay scene, any screen), and native INVITE links
   (?join=CODE&from=UID via navigator.share / clipboard) that
   auto-join on boot. The 4-letter seal stays as the fallback.
   Testing: ?vsdemo=1&vsmode=turns|timed|bg&mpuid=a — solver plays.
   ?frdemo=host|guest|invite|join&mpuid=x — friends recipes (see
   frDemo / VsSummons.create).
   ============================================================ */

const VS_MAX = { turns: 2, timed: 2, bg: 4 };
const VS_MIN = { turns: 2, timed: 2, bg: 2 };
const VS_TIME_MS = 180000;
const VS_HP = 60;
const VS_EMBLEMS = ['vulpes', 'strix', 'serpens', 'draco'];
const FRDEMO = QS.get('frdemo');                              // friends-flow test recipes
const VSDEMO = QS.get('vsdemo') === '1' || !!FRDEMO;          // the solver plays the duel
const VSAUTO = QS.get('vsdemo') === '1';                      // …and auto quick-matches from the menu
if (FRDEMO) window.__VSDEMO_REMATCHED = true;                 // friends recipes end after one duel
// identity comes from SSNET (which honors ?mpuid= for same-machine tests) —
// friends, presence, invites and seats all key by the same uid
const vsUid = () => SSNET.uid();
const vsName = () => SSNET.myName();
const VS_MODES = ['turns', 'timed', 'bg'];
const VS_MODE_KEY = { turns: 'vsModeTurns', timed: 'vsModeTimed', bg: 'vsModeBg' };
const VS_MODE_SUB = { turns: 'vsTurnsSub', timed: 'vsTimedSub', bg: 'vsBgSub' };
// every seat carries its rating into the room: the Elo exchange at the end
// reads the rival's number from here, and rhide keeps a veiled rating out of
// the opponent's VIEW (the math still needs the true value — client-
// authoritative, same caveat as every score in this game)
const vsSeat = (seat) => ({
  name: vsName(), hp: VS_HP, seat, casts: 0, dealt: 0, gone: false, joinedAt: Date.now(),
  rating: SS.prof.rating, rhide: SS.prof.rhide ? 1 : 0,
});

/* ============================================================
   Menu — friends first: who's online, one-tap CHALLENGE, native
   INVITE links; then quick match, then the seal code as fallback
   ============================================================ */
class VsMenu extends Phaser.Scene {
  constructor() { super('vsmenu'); }
  create() {
    const l = ssLayout(this);
    ssMakeTextures(this);
    ssStarfield(this, 90);
    const back = ssTxt(this, l.x(-195), l.y(24), '‹ HOME', l.u(14), '#9fb0e8').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { SFX.ui(); this.scene.start('home'); });
    ssTxt(this, l.x(0), l.y(62), '⚔ VERSUS ⚔', l.u(22), '#f3e5b4').setOrigin(0.5).setShadow(0, 0, '#c9a94f', l.u(14), true, true);
    ssTxt(this, l.x(0), l.y(90), SS_T('vsAs', vsName()), l.u(11), '#8a94c4', 'italic').setOrigin(0.5);
    this.busyC = false;

    if (SSNET.mode === 'local') {
      ssTxt(this, l.x(0), l.y(300), SS_T('vsNoSky'), l.u(14), '#8c5a5a', 'italic').setOrigin(0.5).setAlign('center');
      return;
    }
    this.mode = VS_MODES.includes(localStorage.getItem('beta3.vsmode')) ? localStorage.getItem('beta3.vsmode') : 'turns';
    if (QS.get('vsmode') && VS_MODES.includes(QS.get('vsmode'))) this.mode = QS.get('vsmode');

    this.buildFriends(l);

    // the mode picker — three pills, the chosen one wears the gold button;
    // CHALLENGE, INVITE and FIND all seal a room of this mode
    this.pills = {};
    VS_MODES.forEach((m, i) => {
      const x = l.x(-124 + i * 124);
      const b = this.add.image(x, l.y(440), ssBtn(this, true, 116, 32)).setDisplaySize(l.u(116), l.u(32)).setInteractive({ useHandCursor: true });
      const t = ssTxt(this, x, l.y(440), SS_T(VS_MODE_KEY[m]), l.u(10.5), '#9fb0e8').setOrigin(0.5);
      b.on('pointerdown', () => { SFX.ui(); this.setMode(m); });
      this.pills[m] = { b, t };
    });
    this.modeSubT = ssTxt(this, l.x(0), l.y(466), '', l.u(9.5), '#8a94c4', 'italic').setOrigin(0.5);
    this.setMode(this.mode, true);

    // INVITE A FRIEND — the modern door: seals a private room and opens the
    // share sheet with a link that joins it. Wired on pointerUP: iOS grants
    // navigator.share/clipboard only inside a user activation, and Phaser's
    // pointerdown comes from touchstart, which is not one — touchend is.
    const invB = this.add.image(l.x(0), l.y(512), ssBtn(this, false, 320, 60)).setDisplaySize(l.u(320), l.u(60)).setInteractive({ useHandCursor: true });
    ssTxt(this, l.x(0), l.y(502), SS_T('vsInvite'), l.u(17), BTN_INK()).setOrigin(0.5);
    ssTxt(this, l.x(0), l.y(524), SS_T('vsInviteSub'), l.u(9.5), BTN_INK2(), 'italic').setOrigin(0.5);
    vsOnTap(invB, () => { SFX.ensure(); SFX.ui(); this.inviteFriend(); });
    // FIND A RIVAL — quick match, as before
    const findB = this.add.image(l.x(0), l.y(580), ssBtn(this, false, 320, 60)).setDisplaySize(l.u(320), l.u(60)).setInteractive({ useHandCursor: true });
    ssTxt(this, l.x(0), l.y(570), SS_T('vsFind'), l.u(17), BTN_INK()).setOrigin(0.5);
    ssTxt(this, l.x(0), l.y(592), SS_T('vsFindSub'), l.u(9.5), BTN_INK2(), 'italic').setOrigin(0.5);
    findB.on('pointerdown', () => { SFX.ensure(); SFX.ui(); this.match(this.mode); });
    // the seal code — still the cross-device fallback that needs no friend setup
    ssTxt(this, l.x(0), l.y(632), SS_T('vsOrSeal'), l.u(11), '#5a6390').setOrigin(0.5);
    const joinB = this.add.image(l.x(0), l.y(664), ssBtn(this, true, 250, 44)).setDisplaySize(l.u(250), l.u(44)).setInteractive({ useHandCursor: true });
    ssTxt(this, l.x(0), l.y(664), SS_T('vsSeal'), l.u(13), '#9fb0e8').setOrigin(0.5);
    joinB.on('pointerdown', () => this.codePrompt(l));
    this.noteT = ssTextBlock(this, l.x(0), l.y(708), '', {
      fontSize: l.u(11) + 'px', color: '#c9b676', fontStyle: 'italic', shadow: true,
      wrapW: l.u(340), align: 'center', ox: 0.5, oy: 0.5,
    });

    this.events.once('shutdown', () => { if (this.frOff) { this.frOff(); this.frOff = null; } });
    if (VSAUTO) this.time.delayedCall(600, () => this.match(this.mode));
    if (FRDEMO === 'host' || FRDEMO === 'invite') this.time.delayedCall(800, () => this.frDemo());
  }
  note(s, ms) {
    if (!this.noteT || !this.noteT.active) return;
    this.noteT.setText(s || '');
    if (this.noteTimer) { this.noteTimer.remove(false); this.noteTimer = null; }
    if (s && ms) this.noteTimer = this.time.delayedCall(ms, () => { if (this.noteT.active) this.noteT.setText(''); });
  }
  setMode(m, silent) {
    this.mode = m;
    try { localStorage.setItem('beta3.vsmode', m); } catch (e) { }
    const l = ssLayout(this);
    for (const k of VS_MODES) {
      const sel = k === m;
      this.pills[k].b.setTexture(ssBtn(this, !sel, 116, 32)).setDisplaySize(l.u(116), l.u(32));
      this.pills[k].t.setColor(sel ? BTN_INK() : '#9fb0e8');
    }
    this.modeSubT.setText(SS_T(VS_MODE_SUB[m]));
    if (!silent) this.refreshFriends();
  }

  /* ---------- the friends panel ----------
     Live from SSNET.FR: friends online first (dot lit, CHALLENGE ready),
     then the rest with when they were last seen; below the roll, recent
     rivals as one-tap "+ ADD" links and the friend-link share. */
  buildFriends(l) {
    const PH = 296, top = 118;
    this.frTop = top;
    this.add.image(l.x(0), l.y(top + PH / 2), 'endpanel').setDisplaySize(l.u(372), l.u(PH));
    ssTxt(this, l.x(0), l.y(top + 22), SS_T('vsFriends'), l.u(12), '#c9b676').setOrigin(0.5);
    this.frC = this.add.container(0, 0);
    this.frOff = SSNET.FR.on(() => this.refreshFriends());
    // "seen 2h ago" and online dots age while the menu sits open
    this.time.addEvent({ delay: 15000, loop: true, callback: () => this.refreshFriends() });
  }
  refreshFriends() {
    if (!this.frC || !this.frC.scene) return;   // (not isActive: the first paint happens inside create)
    const l = ssLayout(this), top = this.frTop, FR = SSNET.FR;
    this.frC.removeAll(true);
    const items = [];
    const friends = FR.list();
    const ROWS = 5, rowY = (i) => l.y(top + 54 + i * 38);
    if (!friends.length) {
      items.push(ssTextBlock(this, l.x(0), l.y(top + 120), SS_T('vsNoFriends'), {
        fontSize: l.u(11) + 'px', color: '#5a6390', fontStyle: 'italic', shadow: true,
        wrapW: l.u(320), align: 'center', ox: 0.5, oy: 0.5,
      }));
    }
    const shown = friends.length > ROWS ? friends.slice(0, ROWS - 1) : friends;
    shown.forEach((f, i) => {
      const y = rowY(i);
      const dot = this.add.circle(l.x(-160), y, l.u(4.5), f.online ? 0x7fe0a0 : 0x39406b);
      if (f.online) {
        dot.setStrokeStyle(l.u(1), 0xbfffd8, 0.6);
        this.tweens.add({ targets: dot, alpha: 0.45, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      items.push(dot);
      const nm = ssTxt(this, l.x(-146), y - l.u(7), f.name, l.u(13), f.online ? '#f0e8d2' : '#a9a99a').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
      while (nm.width > l.u(150) && nm.text.length > 2) nm.setText(nm.text.slice(0, -2) + '…');
      nm.on('pointerdown', () => ssRatingCard(this, { uid: f.id, name: f.name }));
      items.push(nm);
      const p = FR.presence[f.id];
      const status = f.online ? (f.busy ? SS_T('vsInDuel') : SS_T('vsOnline'))
        : (p && p.at ? SS_T('vsSeen', vsAgo(Date.now() - p.at)) : SS_T('vsOffline'));
      items.push(ssTxt(this, l.x(-146), y + l.u(9), status, l.u(9), f.online ? (f.busy ? '#e8a87f' : '#7fe0a0') : '#5a6390', 'italic').setOrigin(0, 0.5));
      if (f.online && !f.busy) {
        const cb = this.add.image(l.x(96), y, ssBtn(this, false, 104, 30)).setDisplaySize(l.u(104), l.u(30)).setInteractive({ useHandCursor: true });
        const ct = ssTxt(this, l.x(96), y, SS_T('vsChallenge'), l.u(10.5), BTN_INK()).setOrigin(0.5);
        cb.on('pointerdown', () => { SFX.ensure(); SFX.ui(); this.challenge(f); });
        cb.on('pointerover', () => cb.setScale(cb.scaleX * 1.03, cb.scaleY * 1.03));
        cb.on('pointerout', () => cb.setDisplaySize(l.u(104), l.u(30)));
        items.push(cb, ct);
      }
      const rm = ssTxt(this, l.x(176), y, '✕', l.u(11), '#39406b').setOrigin(0.5).setInteractive({ useHandCursor: true });
      rm.on('pointerdown', () => { SFX.ui(); FR.remove(f.id); });
      items.push(rm);
    });
    if (friends.length > ROWS) {
      items.push(ssTxt(this, l.x(0), rowY(ROWS - 1), SS_T('vsMore', friends.length - shown.length), l.u(10.5), '#5a6390', 'italic').setOrigin(0.5));
    }
    // recent rivals → one-tap adds
    const rivals = FR.rivals(3);
    if (rivals.length) {
      let x = -168;
      const lab = ssTxt(this, l.x(x), l.y(top + 254), SS_T('vsRecent') + ':', l.u(9.5), '#5a6390', 'italic').setOrigin(0, 0.5);
      items.push(lab);
      x += lab.width / l.u(1) + 10;
      for (const r of rivals) {
        const t = ssTxt(this, l.x(x), l.y(top + 254), SS_T('vsAdd') + ' ' + r.name, l.u(10), '#9fb0e8').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        while (t.width > l.u(120) && t.text.length > 6) t.setText(t.text.slice(0, -2) + '…');
        t.on('pointerdown', () => { SFX.ui(); t.setColor('#5a6390'); FR.add(r.id, r.name).then(() => vsNotify(SS_T('frAdded', r.name))); });
        items.push(t);
        x += t.width / l.u(1) + 14;
        if (x > 150) break;
      }
    }
    // your friend link — the way to add someone without a duel first
    const fl = ssTxt(this, l.x(0), l.y(top + 278), SS_T('vsFriendLink'), l.u(10), '#c9b676').setOrigin(0.5).setInteractive({ useHandCursor: true });
    vsOnTap(fl, () => {
      SFX.ui();
      vsShare(SS_T('vsFriendText', vsName()), vsFriendUrl()).then((r) => {
        if (r === 'copied') this.note(SS_T('vsCopied'), 2500);
        else if (r === 'failed') this.note(SS_T('vsCopyFail'), 2500);
      });
    });
    items.push(fl);
    this.frC.add(items);
  }

  /* ---------- the three doors ---------- */
  async challenge(f) {
    if (this.busyC) return;
    this.busyC = true;
    this.note(SS_T('vsConsult'));
    try {
      const conn = await SSNET.connect();
      if (conn !== 'firebase') { this.note(SS_T('vsNoSky'), 3000); this.busyC = false; return; }
      const code = vsCode();
      const ok = await vsSealRoom(code, this.mode, { private: true, invited: f.id });
      if (!ok || !this.sys.isActive()) { this.note(SS_T('vsRefused'), 3000); this.busyC = false; return; }
      await SSNET.FR.challenge(f.id, code, this.mode);
      if (!this.sys.isActive()) return;
      this.scene.start('vsbattle', { code, challenged: { id: f.id, name: f.name } });
    } catch (e) { this.note(SS_T('vsRefused'), 3000); this.busyC = false; }
  }
  inviteFriend() {
    if (this.busyC || SSNET.mode !== 'firebase') { if (SSNET.mode !== 'firebase') this.note(SS_T('vsNoSky'), 3000); return; }
    this.busyC = true;
    // the code is minted locally, so the link exists BEFORE the room write
    // lands — the share sheet opens inside the tap's activation window
    const code = vsCode();
    const sharing = vsShare(SS_T('vsShareText', vsName()), vsInviteUrl(code));
    vsSealRoom(code, this.mode, { private: true }).then((ok) => {
      if (!this.sys.isActive()) return;
      if (!ok) { this.note(SS_T('vsRefused'), 3000); this.busyC = false; return; }
      this.scene.start('vsbattle', { code, sharing });
    });
  }
  codePrompt(l) {
    SFX.ui();
    const inp = document.createElement('input');
    inp.type = 'text'; inp.maxLength = 4; inp.placeholder = 'SEAL';
    inp.style.cssText = 'position:fixed;left:50%;top:30%;transform:translateX(-50%);z-index:9999;font:700 ' +
      Math.round(l.u(26)) + 'px Georgia,serif;text-align:center;letter-spacing:0.3em;text-transform:uppercase;background:#141a33;color:#f3e5b4;border:2px solid #c9a94f;border-radius:10px;padding:10px;outline:none;width:52%;max-width:220px;';
    // no commitOnShutdown: leaving the menu mid-type must not join a room
    ssDomInput(this, inp, async (v) => {
      const code = v.trim().toUpperCase();
      if (code.length !== 4 || !this.sys.isActive()) return;
      const ok = await vsJoinRoom(code);
      if (!this.sys.isActive()) return;   // the scene moved on while we were joining
      if (ok) this.scene.start('vsbattle', { code });
      else this.note(SS_T('vsColdSeal'), 2000);
    });
  }
  async match(mode) {
    if (this.busyC) return;
    this.busyC = true;
    this.note(SS_T('vsConsult'));
    const conn = await SSNET.connect();
    if (conn !== 'firebase') { this.note(SS_T('vsNoSky')); this.busyC = false; return; }
    const code = await vsQuickMatch(mode);
    if (!this.sys.isActive()) return;
    if (code) this.scene.start('vsbattle', { code });
    else { this.note(SS_T('vsRefused'), 3000); this.busyC = false; }
  }
  /* ---------- test recipes (?frdemo=) ----------
     host:   befriend test_b, wait for them online, CHALLENGE (their tab runs
             ?frdemo=guest and auto-accepts the summons)
     invite: INVITE A FRIEND → private lobby; a third tab boots with
             ?join=<code>&from=test_a to prove the deep link */
  async frDemo() {
    await SSNET.connect();
    if (!this.sys.isActive()) return;
    if (FRDEMO === 'invite') { this.inviteFriend(); return; }
    const other = QS.get('frwith') || 'b';
    await SSNET.FR.add('test_' + other, 'Wisp ' + other.toUpperCase());
    let tries = 0;
    const tick = () => {
      if (!this.sys.isActive()) return;
      if (SSNET.FR.isOnline('test_' + other) && !SSNET.FR.isBusy('test_' + other)) { this.challenge({ id: 'test_' + other, name: 'Wisp ' + other.toUpperCase() }); return; }
      if (++tries < 90) this.time.delayedCall(1000, tick);
    };
    tick();
  }
}

// "seen 3d ago" / "seen 2h 10m ago" / "seen 4m ago"
function vsAgo(ms) {
  const d = Math.floor(ms / 86400000);
  return d >= 1 ? SS_T('cdD', d) : ssCountdown(Math.max(60000, ms));
}

/* ---------- links + native share ----------
   Share buttons fire on pointerUP (iOS grants navigator.share / clipboard
   only inside a user activation, and Phaser's pointerdown comes from
   touchstart, which is not one — touchend is). But an up alone is a trap:
   a tap on RETURN in the previous scene queues the switch on its down, and
   its release then lands on whatever button now sits under the finger in
   the NEW scene — the INVITE door, as it happens. So arm on down, fire on
   the matching up, disarm on out. */
function vsOnTap(obj, fn) {
  let armed = false;
  obj.on('pointerdown', () => { armed = true; });
  obj.on('pointerout', () => { armed = false; });
  obj.on('pointerup', () => { if (!armed) return; armed = false; fn(); });
}
function vsLinkBase() {
  const u = new URL(location.href);
  u.search = ''; u.hash = '';
  return u;
}
function vsInviteUrl(code) {
  const u = vsLinkBase();
  u.searchParams.set('join', code); u.searchParams.set('from', vsUid());
  return u.toString();
}
function vsFriendUrl() {
  const u = vsLinkBase();
  u.searchParams.set('friend', vsUid());
  return u.toString();
}
// share sheet where there is one (iOS/Android/desktop Chrome+Safari), the
// clipboard where there isn't, the old execCommand path as a last resort.
// Resolves 'shared' | 'aborted' | 'copied' | 'failed'. A native shell later
// (WKWebView, the FAVOR precedent) inherits this unchanged — true contacts /
// Game Center friends would be that shell's job.
async function vsShare(text, url) {
  if (navigator.share) {
    try { await navigator.share({ title: 'STARSPELL', text, url }); return 'shared'; }
    catch (e) { if (e && e.name === 'AbortError') return 'aborted'; }
  }
  // one copy routine for the whole game (ssCopyText, game.js): awaited async
  // clipboard, WKWebView's rejection falling through to textarea+execCommand,
  // true only when a path really copied
  const full = text + ' ' + url;
  return (await ssCopyText(full)) ? 'copied' : 'failed';
}
// a toast on whatever screen is up (the summons overlay scene draws it)
function vsNotify(text) {
  const s = window.game && game.scene.getScene('summons');
  if (s && s.sys.isActive() && s.toast) s.toast(text);
}

/* ---------- deep links: ?join=CODE&from=UID · ?friend=UID ----------
   Consumed once per page load by Home.create (after compat/intro decisions,
   before the meadow is interactive): befriend the sender, join the room,
   drop into its lobby. The URL is scrubbed so a reload or the language
   switch never answers the same summons twice. */
const VS_DEEP = (() => {
  const j = QS.get('join'), f = QS.get('friend'), from = QS.get('from');
  if (!j && !f) return null;
  return { join: j ? j.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) : null, friend: f || from || null, consumed: false };
})();
function vsDeepPending() { return !!(VS_DEEP && !VS_DEEP.consumed); }
async function vsDeepRun(scene) {
  if (!vsDeepPending()) return;
  VS_DEEP.consumed = true;
  INTRO_SEEN = true;   // the meadow, when we get there, is a return — not a cold open
  try {
    const u = new URL(location.href);
    ['join', 'from', 'friend'].forEach((k) => u.searchParams.delete(k));
    history.replaceState(null, '', u.toString());
  } catch (e) { }
  const l = ssLayout(scene);
  const veil = scene.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setScrollFactor(0).setAlpha(0.7).setDepth(650).setInteractive();
  const t = ssTxt(scene, l.W / 2, l.H * 0.42, VS_DEEP.join ? SS_T('smJoining') : SS_T('lbLoading'), l.u(15), '#ffe9a8', 'italic').setOrigin(0.5).setScrollFactor(0).setDepth(651)
    .setShadow(0, 0, '#c9b676', l.u(10), true, true);
  const t2 = VS_DEEP.join ? ssTxt(scene, l.W / 2, l.H * 0.42 + l.u(34), VS_DEEP.join, l.u(30), '#ffe9a8').setOrigin(0.5).setScrollFactor(0).setDepth(651) : null;
  const done = () => { veil.destroy(); t.destroy(); if (t2) t2.destroy(); };
  let friendName = null, joined = false;
  try {
    const conn = await SSNET.connect();
    if (conn === 'firebase') {
      if (VS_DEEP.friend && VS_DEEP.friend !== vsUid()) {
        // who sent this? the synced profile, else their presence row, else the
        // seat they hold in the room the link points at (a brand-new stargazer
        // may never have synced a profile before sharing their first invite)
        const p = await SSNET.dbGet('players/' + VS_DEEP.friend).catch(() => null);
        const already = await SSNET.dbGet('friends/' + vsUid() + '/' + VS_DEEP.friend).catch(() => null);
        friendName = (p && p.name) || null;
        if (!friendName) { const pr = await SSNET.dbGet('presence/' + VS_DEEP.friend).catch(() => null); friendName = (pr && pr.name) || null; }
        if (!friendName && VS_DEEP.join) { const seat = await SSNET.dbGet('mp/rooms/' + VS_DEEP.join + '/players/' + VS_DEEP.friend).catch(() => null); friendName = (seat && seat.name) || null; }
        if (friendName && !already) await SSNET.FR.add(VS_DEEP.friend, friendName);
        else friendName = null;   // already friends, or no such stargazer — nothing to announce
      }
      if (VS_DEEP.join) joined = await vsJoinRoom(VS_DEEP.join);
    }
  } catch (e) { }
  localStorage.setItem('beta3.deeplink', JSON.stringify({ join: VS_DEEP.join, joined, friend: VS_DEEP.friend, friendName, t: Date.now() }));
  if (!scene.sys.isActive()) return;
  if (joined) {
    scene.scene.start('vsbattle', { code: VS_DEEP.join });
    if (friendName) scene.time.delayedCall(700, () => vsNotify(SS_T('frAdded', friendName)));
    return;
  }
  done();
  if (VS_DEEP.join) vsNotify(SS_T('smCold'));
  if (friendName) scene.time.delayedCall(VS_DEEP.join ? 2600 : 200, () => vsNotify(SS_T('frAdded', friendName)));
}

/* ---------- room helpers ---------- */
function vsCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}
/* ---------- the rival queue: matched by rating (v0.48.0) ----------
   A searcher IS a waiting public room — pressing FIND A RIVAL either takes a
   seat in someone's room or opens one and waits. The queue entry is the room
   itself: `seekAt` is the moment FIND was pressed, so "how long has this
   searcher waited" is always `now - seekAt` (the fallback tasks read it
   there); `createdAt` is the room's own age, and they diverge once a host has
   migrated (below). The host seat already carries `rating` (true number even
   under rhide — the veil is display-only).
   Pairing prefers the CLOSEST rating on offer, within a tolerance that opens
   with the pair's COMBINED wait: ±75 at once, +75 per 3s waited between them,
   so a lone searcher meets anyone soon enough. A host waiting alone rescans
   every 2.5s (VsBattle.rescan) — and only a YOUNGER room ever migrates into
   an OLDER one, so two hosts rescanning at the same instant can never cross
   into each other's room. Seats are still claimed by the same single join
   transaction as before: the rating preference chooses WHICH door to try,
   the transaction decides who got through it. */
const VS_MM = { TOL: 75, STEP: 75, STEP_MS: 3000, RESCAN_MS: 2500 };
/* ---------- the quiet sky (v0.49.0) ----------
   A searcher the queue has not served ~12s after FIND is met by one of the
   circle (rival.js): a mage of this device's acquaintance, rated a believable
   distance from the player, who comes in through the same door as anyone.
   The moment is jittered (AT + up to SPREAD after seekAt, then a breath for
   the arrival) — the same instant every time would be a tell. People always
   win the race: the last instant before the door opens the queue is read once
   more, an ELDER room takes me whatever its rating, and a YOUNGER room already
   on its way (within tolerance, or past its own clock — it will read the queue
   the same way and find me) holds the door up to HOLD_MS. */
const VS_FB = { AT: 11200, SPREAD: 3200, HOLD_MS: 6000, ARRIVE_MS: 500, ARRIVE_SPREAD: 800, RETRY_MS: 9000 };
// a younger public room of `mode`, host alone, that is about to migrate into mine
function vsYoungerComing(rooms, mode, now, own, seekAt) {
  for (const [id, r] of Object.entries(rooms || {})) {
    if (!r || r.status !== 'waiting' || r.mode !== mode || r.private || id === own.code) continue;
    if (now - (r.createdAt || 0) > 5 * 60000) continue;
    const players = r.players || {};
    if (Object.keys(players).length !== 1) continue;
    const host = players[r.hostUid];
    if (!host || host.gone) continue;
    const age = r.createdAt || 0;
    if (age < own.createdAt || (age === own.createdAt && id < own.code)) continue;   // an elder: vsPickRoom's business
    const theirWait = now - vsRoomSeekAt(r, now);
    const diff = Math.abs(SS.prof.rating - vsRoomRating(r));
    if (diff <= vsTolerance(now - seekAt, theirWait) || theirWait >= VS_FB.AT) return true;
  }
  return false;
}
function vsTolerance(waitA, waitB) {
  return VS_MM.TOL + VS_MM.STEP * Math.floor((Math.max(0, waitA | 0) + Math.max(0, waitB | 0)) / VS_MM.STEP_MS);
}
function vsRoomRating(r) {
  const h = r && r.players && r.players[r.hostUid];
  return h && Number.isFinite(h.rating) ? h.rating : SS_RATING.BASE;
}
function vsRoomSeekAt(r, now) { return r.seekAt || r.createdAt || now; }
// the best open room of `mode` for me right now, or null. `own` is my own
// waiting room ({code, createdAt}) when I already hold one: then only rooms
// OLDER than mine qualify. `skip` lists codes whose door already shut on me.
function vsPickRoom(rooms, mode, now, seekAt, own, skip) {
  let best = null;
  for (const [id, r] of Object.entries(rooms || {})) {
    if (!r || r.status !== 'waiting' || r.mode !== mode) continue;
    if (r.private) continue;   // sealed for a friend or an invite link — not open sky
    if (now - (r.createdAt || 0) > 5 * 60000) continue;
    if (skip && skip.has(id)) continue;
    const players = r.players || {};
    if (players[vsUid()]) continue;
    if (Object.keys(players).length >= VS_MAX[mode]) continue;
    const host = players[r.hostUid];
    if (!host || host.gone) continue;   // a host who faded away never starts the duel
    if (own) {
      if (id === own.code) continue;
      const age = r.createdAt || 0;
      if (age > own.createdAt || (age === own.createdAt && id > own.code)) continue;   // the elder stays put
    }
    const diff = Math.abs(SS.prof.rating - vsRoomRating(r));
    if (diff > vsTolerance(now - seekAt, now - vsRoomSeekAt(r, now))) continue;
    if (!best || diff < best.diff || (diff === best.diff && (r.createdAt || 0) < best.createdAt)) best = { id, diff, createdAt: r.createdAt || 0 };
  }
  return best;
}
async function vsQuickMatch(mode) {
  try {
    const rooms = (await SSNET.dbGet('mp/rooms').catch(() => null)) || {};
    const now = Date.now();
    // housekeeping: clear stale rooms as we pass by. No createdAt = a skeleton
    // (an armed onDisconnect writing players/<uid>/gone into a deleted room
    // re-creates it as junk) — sweep those too, they'd otherwise live forever.
    for (const [id, r] of Object.entries(rooms)) {
      if (r && (!r.createdAt || now - r.createdAt > 40 * 60000)) SSNET.dbSet('mp/rooms/' + id, null).catch(() => { });
    }
    // a seat I already hold (a reload mid-wait) is mine to return to — and
    // FIND is FIND: a room that had no queue clock (a rematch nobody answered)
    // gets one now, so the quiet sky can answer it like any other wait
    for (const [id, r] of Object.entries(rooms)) {
      if (r && r.status === 'waiting' && r.mode === mode && !r.private && (r.players || {})[vsUid()]) {
        if (!r.seekAt) await SSNET.dbUpdate('mp/rooms/' + id, { seekAt: now }).catch(() => { });
        return id;
      }
    }
    // the closest rival first; if their door shuts as I reach it, the next
    const skip = new Set();
    for (;;) {
      const pick = vsPickRoom(rooms, mode, now, now, null, skip);
      if (!pick) break;
      if (await vsJoinRoom(pick.id)) return pick.id;
      skip.add(pick.id);
    }
    // open a new room and wait in the queue
    const code = vsCode();
    if (!(await vsSealRoom(code, mode, { seekAt: now }))) return null;
    return code;
  } catch (e) { return null; }
}
// seal a fresh room under a known code (minted by vsCode() beforehand, so an
// invite link can exist before the write lands). private rooms are skipped
// by quick match; invited names the friend a CHALLENGE was rung for.
async function vsSealRoom(code, mode, opts) {
  try {
    await SSNET.dbSet('mp/rooms/' + code, {
      mode, status: 'waiting', createdAt: Date.now(), hostUid: vsUid(),
      seed: (opts && opts.seed) || Math.floor(Math.random() * 1e9),   // ?botduel&seed= pins a board for the harness
      lang: ssGameLang(),   // the creator's tongue rules the duel — both bags and dictionaries follow it
      private: !!(opts && opts.private), invited: (opts && opts.invited) || null,
      seekAt: (opts && opts.seekAt) || null,   // set = this host is in the rival queue, since then
      players: { [vsUid()]: vsSeat(0) },
    });
    return true;
  } catch (e) { return false; }
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
      players[vsUid()] = vsSeat(seat);
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
  init(d) {
    this.code = d.code;
    this.challenged = d.challenged || null;   // {id,name} when this room was sealed by a CHALLENGE
    this.sharing = d.sharing || null;         // the INVITE share promise, for lobby feedback
    // the scene instance outlives a room: the quiet sky's clock must start
    // fresh with every seal, or the NEXT search would be answered at once
    this.fbAt = 0; this.fbRival = null; this.fbSpawnAt = 0; this.fbBusy = false;
    this.migrating = false; this.rescanning = false; this.lastScan = 0; this.left = false;
  }

  create() {
    const l = this.L = ssLayout(this);
    ssMakeTextures(this);
    // both duelists share the seal code, so hashing it seeds an IDENTICAL sky —
    // you wait on the same meadow and rise together into the same stars
    let seedH = 0;
    for (const ch of this.code) seedH = (seedH * 31 + ch.charCodeAt(0)) | 0;
    this.sky = ssSkyWorld(this, { zenithAtZero: true, seed: (seedH ^ 0x5f37c11) || 1 });
    this.sky.setP(0, 0);       // the lobby waits on the meadow
    this.room = null;
    this.state = 'wait';       // wait | rise | pick | anim | sigil | done
    this.board = []; this.sel = []; this.lineTiles = [];
    this.mySigils = [];
    this.seenCasts = {};
    this.scryCooldown = 0;
    this.buildUi();

    this.roomRef = SSNET.ref('mp/rooms/' + this.code);
    if (!this.roomRef) { this.scene.start('vsmenu'); return; }
    SSNET.FR.setBusy(true);   // friends see "in a duel" and can't ring me mid-fight
    // a CHALLENGE lobby watches its own bell: if the friend removes it without
    // taking a seat, they declined
    if (this.challenged) {
      this.invRef = SSNET.ref('invites/' + this.challenged.id + '/' + vsUid());
      this.onInvCb = (snap) => {
        if (snap.val() != null) return;
        this.time.delayedCall(1500, () => {
          if (!this.sys.isActive() || !this.room || this.room.status !== 'waiting') return;
          if ((this.room.players || {})[this.challenged.id]) return;
          if (this.lobbySub && this.lobbySub.active) this.lobbySub.setText(SS_T('vsDeclined', this.challenged.name)).setColor('#e8a87f');
        });
      };
      if (this.invRef) this.invRef.on('value', this.onInvCb);
    }
    this.onRoomCb = (snap) => this.onRoom(snap.val());
    this.roomRef.on('value', this.onRoomCb);
    this.meRef = SSNET.ref('mp/rooms/' + this.code + '/players/' + vsUid());
    if (this.meRef) this.meRef.child('gone').onDisconnect().set(true);
    this.castsRef = SSNET.ref('mp/rooms/' + this.code + '/casts');
    this.onCastCb = (snap) => { this.onCast(snap.key, snap.val()); };
    if (this.castsRef) this.castsRef.on('child_added', this.onCastCb);

    this.onAchCb = (def) => ssAchToast(this, def);
    this.game.events.on('ss-ach', this.onAchCb);
    this.events.once('shutdown', () => {
      this.game.events.off('ss-ach', this.onAchCb);
      if (this.roomRef) this.roomRef.off('value', this.onRoomCb);
      if (this.castsRef) this.castsRef.off('child_added', this.onCastCb);
      if (this.invRef) this.invRef.off('value', this.onInvCb);
      SSNET.FR.setBusy(false);
      // walking out of a challenge lobby takes the bell back
      if (this.challenged && (!this.room || this.room.status === 'waiting')) SSNET.FR.cancelChallenge(this.challenged.id);
      // this.left: leaveRoom already deleted the seat — update() on the dead
      // path would write players/<uid>/{gone:true} back, resurrecting a ghost
      if (!this.left && this.meRef && this.room && this.room.status !== 'done') this.meRef.update({ gone: true }).catch(() => { });
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
    back.on('pointerdown', () => {
      SFX.ui();
      // deserting a live battle settles as a loss — fleeing can't dodge the
      // Elo exchange (endBattle never runs for a seat that walked out)
      if (this.room && this.room.status === 'active' && this.state !== 'done') {
        const foes = Object.entries(this.room.players || {}).filter(([id]) => id !== vsUid()).map(([, p]) => p);
        if (foes.length) {
          const oppAvg = foes.reduce((a, p) => a + (Number.isFinite(p.rating) ? p.rating : SS_RATING.BASE), 0) / foes.length;
          SS_RATING.duel(oppAvg, 0);
          SS.save(); SS.sync();
        }
      }
      this.scene.start('vsmenu');
    });

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

    this.castB = this.add.image(l.x(70), l.y(766), ssBtn(this, false, 180, 52)).setDisplaySize(l.u(180), l.u(52)).setInteractive({ useHandCursor: true });
    this.castT = txt(l.x(70), l.y(766), 'CAST', 19, BTN_INK()).setOrigin(0.5);
    this.castB.on('pointerdown', () => this.tryCast());
    this.scryB = this.add.rectangle(l.x(-140), l.y(766), l.u(110), l.u(48), 0x151b33).setStrokeStyle(l.u(1.5), 0x4a5a8c).setInteractive({ useHandCursor: true });
    this.scryT = txt(l.x(-140), l.y(766), 'SCRY ↻', 13, '#9fb0e8').setOrigin(0.5);
    this.scryB.on('pointerdown', () => this.scry());
    // held sigils fold into a chip between SCRY and CAST — tap = the inspector
    // window (a duel can't pause, but the box still reads and shields the board)
    this.sigChipB = this.add.rectangle(l.x(-52), l.y(766), l.u(58), l.u(48), 0x151b33)
      .setStrokeStyle(l.u(1.5), 0x8c7a4a).setInteractive({ useHandCursor: true }).setVisible(false);
    this.sigChipT = txt(l.x(-52), l.y(766), '', 14, '#ffd77a').setOrigin(0.5).setVisible(false);
    this.sigChipB.on('pointerdown', () => this.openInspect());

    this.fxC = this.add.container(0, 0).setDepth(50);
    this.starBurst = this.add.particles(0, 0, 'dot', {
      speed: { min: 60, max: 320 }, lifespan: { min: 300, max: 800 }, scale: { start: 0.9, end: 0 },
      blendMode: 'ADD', emitting: false,
    }).setDepth(60);
    this.overlayC = this.add.container(0, 0).setDepth(100);

    // lobby veil — the battle HUD lives at the zenith, but the camera waits
    // down at the meadow, so the lobby is parked AT the camera's resting
    // scroll. It was scrollFactor(0) once: that renders in the right corner
    // but hit-tests in world space (a Container's scrollFactor affects
    // rendering only, never input), so every lobby tap — LEAVE included —
    // landed a full sky-height away from the text that drew it.
    const cam = this.cameras.main;
    this.lobbyC = this.add.container(cam.scrollX, cam.scrollY).setDepth(90);
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.55);
    const leave = ssTxt(this, l.x(-195), l.y(24), '‹ LEAVE', l.u(14), '#9fb0e8').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    leave.on('pointerdown', () => this.leaveRoom());
    const ch = this.challenged;
    this.lobbyTitle = txt(l.x(0), l.y(206), ch ? SS_T('vsSent', ch.name) : SS_T('lobbyTitle'), ch ? 17 : 20, '#f3e5b4').setOrigin(0.5)
      .setShadow(0, 0, '#c9a94f', l.u(12), true, true);
    while (this.lobbyTitle.width > l.u(360) && this.lobbyTitle.text.length > 8) this.lobbyTitle.setText(this.lobbyTitle.text.slice(0, -2) + '…');
    this.lobbyCode = txt(l.x(0), l.y(262), this.code, 44, '#ffe9a8').setOrigin(0.5)
      .setShadow(0, 0, '#c9a94f', l.u(18), true, true);
    this.lobbySub = ssTextBlock(this, l.x(0), l.y(308), ch ? SS_T('vsWaitAnswer', ch.name) : SS_T('lobbySub'), {
      fontSize: l.u(11) + 'px', color: '#8a94c4', fontStyle: 'italic', shadow: true,
      wrapW: l.u(340), align: 'center', ox: 0.5, oy: 0.5,
    });
    // native invite from the lobby too — same link, same pointerUP rule
    this.shareB = this.add.image(l.x(0), l.y(360), ssBtn(this, false, 250, 46)).setDisplaySize(l.u(250), l.u(46)).setInteractive({ useHandCursor: true });
    this.shareT = txt(l.x(0), l.y(360), SS_T('vsShareInvite'), 13, BTN_INK()).setOrigin(0.5);
    vsOnTap(this.shareB, () => {
      SFX.ui();
      vsShare(SS_T('vsShareText', vsName()), vsInviteUrl(this.code)).then((r) => this.shareNote(r));
    });
    if (this.sharing) this.sharing.then((r) => this.shareNote(r)).catch(() => { });
    this.lobbyRoster = txt(l.x(0), l.y(440), '', 14, '#d8d2bd').setOrigin(0.5).setAlign('center');
    this.beginB = this.add.image(l.x(0), l.y(548), ssBtn(this, false, 220, 56)).setDisplaySize(l.u(220), l.u(56)).setInteractive({ useHandCursor: true }).setVisible(false);
    this.beginT = txt(l.x(0), l.y(548), 'BEGIN THE BATTLE', 15, BTN_INK()).setOrigin(0.5).setVisible(false);
    this.beginB.on('pointerdown', () => this.hostStart());
    this.lobbyC.add([veil, this.lobbyTitle, this.lobbyCode, this.lobbySub, this.shareB, this.shareT, this.lobbyRoster, this.beginB, this.beginT, leave]);
  }
  shareNote(r) {
    if (!this.shareT || !this.shareT.active) return;
    if (r === 'copied') this.shareT.setText(SS_T('vsCopied'));
    else if (r === 'failed') this.shareT.setText(SS_T('vsCopyFail'));
    else return;
    this.time.delayedCall(2600, () => { if (this.shareT.active) this.shareT.setText(SS_T('vsShareInvite')); });
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
    if (!room) { if (this.migrating) return; if (this.state !== 'done') { this.scene.start('vsmenu'); } return; }
    const first = !this.room;
    const prevStatus = this.room && this.room.status;
    this.room = room;
    // start pulling the room's dictionary the moment its tongue is known, so
    // the beginBattle gate almost never actually has to wait
    if (first && room.lang && room.lang !== 'en') SS_DICT.load(room.lang);
    if (room.status === 'waiting') { this.updateLobby(); this.maybeAutoStart(); return; }
    if (room.status === 'active' && (first || prevStatus === 'waiting')) this.beginBattle();
    if (room.status === 'active') {
      this.updatePanels();
      this.checkEnd();
    }
    if (room.status === 'done' && this.state !== 'done') this.endBattle();
    else if (room.status === 'done' && room.rematch && !this.rematchBusy) this.showRematchCall();
  }

  updateLobby() {
    const n = Object.keys(this.room.players || {}).length;
    const names = Object.values(this.room.players || {}).sort((a, b) => a.seat - b.seat)
      .map((p, i) => (i + 1) + '.  ' + p.name + (p.name === vsName() ? '   (you)' : ''));
    // a duel sealed in another tongue says so before you rise into it
    const langLine = (this.room.lang && this.room.lang !== ssGameLang() && SS_PACKS[this.room.lang])
      ? '\n' + SS_T('vsLang', SS_LANGS[this.room.lang] || this.room.lang) : '';
    this.lobbyRoster.setText(names.join('\n') + '\n\n' + n + ' / ' + VS_MAX[this.room.mode] + ' mages answered' + langLine);
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

  /* ---------- leave: surrender the seat, not just the screen ---------- */
  leaveRoom() {
    SFX.ui();
    this.left = true;
    try { if (this.meRef) this.meRef.child('gone').onDisconnect().cancel(); } catch (e) { }
    SSNET.dbTxn('mp/rooms/' + this.code, (cur) => {
      if (!cur || !cur.players || !cur.players[vsUid()]) return cur;
      if (cur.status !== 'waiting') { cur.players[vsUid()].gone = true; return cur; }   // battle began mid-tap — bow out like a disconnect
      const players = { ...cur.players };
      delete players[vsUid()];
      const rest = Object.entries(players).sort((a, b) => a[1].seat - b[1].seat);
      if (!rest.length) return null;   // last one out seals the room behind them
      const next = { ...cur, players };
      if (cur.hostUid === vsUid()) next.hostUid = rest[0][0];   // pass the host key on, or auto-start never fires for those still waiting
      return next;
    }).catch(() => { });
    this.scene.start('vsmenu');
  }

  /* ---------- the queue, from the host's chair ----------
     Waiting alone in a room I opened by FIND A RIVAL, I look again every
     2.5s: as my wait grows the tolerance opens, and a rival who was too far
     a moment ago may be close enough now. Only an OLDER room is ever joined
     from here (vsPickRoom's elder rule) — the other host sees mine as younger
     and stays put, so we can never swap rooms under each other. */
  rescan() {
    const r = this.room;
    if (this.rescanning || this.migrating || !r || r.status !== 'waiting') return;
    if (r.private || !r.seekAt || r.hostUid !== vsUid() || this.challenged) return;
    if (Object.keys(r.players || {}).length !== 1) return;
    if (Date.now() - (this.lastScan || 0) < VS_MM.RESCAN_MS) return;
    this.lastScan = Date.now();
    this.rescanning = true;
    (async () => {
      try {
        const rooms = (await SSNET.dbGet('mp/rooms').catch(() => null)) || {};
        if (!this.sys.isActive() || !this.room || this.room.status !== 'waiting' || Object.keys(this.room.players || {}).length !== 1) return;
        const pick = vsPickRoom(rooms, r.mode, Date.now(), r.seekAt, { code: this.code, createdAt: r.createdAt || 0 }, null);
        if (pick) await this.migrate(pick.id);
      } catch (e) { } finally { this.rescanning = false; }
    })();
  }
  async migrate(target) {
    const mode = this.room.mode, seekAt = this.room.seekAt;
    this.migrating = true;
    // 1. shut my own door — atomically, and only if I am still alone behind
    //    it; a rival who took the seat meanwhile wins, and I stay
    try { if (this.meRef) this.meRef.child('gone').onDisconnect().cancel(); } catch (e) { }
    const shut = await SSNET.dbTxn('mp/rooms/' + this.code, (cur) => {
      if (!cur) return cur;
      if (cur.status !== 'waiting' || !cur.players || !cur.players[vsUid()] || Object.keys(cur.players).length !== 1) return cur;
      return null;
    });
    if (shut.value) {   // taken — the duel is here after all
      this.migrating = false;
      try { if (this.meRef) this.meRef.child('gone').onDisconnect().set(true); } catch (e) { }
      return;
    }
    // 2. the same seat-claim transaction a newcomer uses; the elder room may
    //    have filled in the meantime, and then my own door reopens under the
    //    same code with the same wait (the queue never forgets how long)
    if (await vsJoinRoom(target)) {
      this.left = true;   // nothing to mark gone — the old room is already gone
      if (this.sys.isActive()) this.scene.start('vsbattle', { code: target });
      return;
    }
    await vsSealRoom(this.code, mode, { seekAt });
    try { if (this.meRef) this.meRef.child('gone').onDisconnect().set(true); } catch (e) { }
    this.migrating = false;
  }

  /* ---------- the quiet sky, from the host's chair (VS_FB above) ---------- */
  quietSky() {
    const r = this.room;
    if (this.fbBusy || this.migrating || this.rescanning || !r || r.status !== 'waiting') return;
    if (r.private || !r.seekAt || r.hostUid !== vsUid() || this.challenged) return;
    if (VS_MAX[r.mode] !== 2) return;   // the battlegrounds fill by hand
    if (Object.keys(r.players || {}).length !== 1) return;
    if (typeof SS_RIVAL === 'undefined' || SSNET.mode !== 'firebase') return;
    if (!this.fbAt) this.fbAt = r.seekAt + VS_FB.AT + Math.random() * VS_FB.SPREAD;
    const now = Date.now();
    if (now < this.fbAt) return;
    if (this.fbRival && (this.fbRival.alive || now - this.fbSpawnAt < VS_FB.RETRY_MS)) return;   // on the way (or a door that stayed cold: once more, later)
    this.fbBusy = true;
    (async () => {
      try {
        const rooms = (await SSNET.dbGet('mp/rooms').catch(() => null)) || {};
        if (!this.sys.isActive() || this.migrating || !this.room || this.room.status !== 'waiting' || Object.keys(this.room.players || {}).length !== 1) return;
        const t = Date.now();
        const own = { code: this.code, createdAt: r.createdAt || 0 };
        // the last look: an elder room takes me whatever the gap
        const pick = vsPickRoom(rooms, r.mode, t, t - 1e7, own, null);
        if (pick) { await this.migrate(pick.id); return; }
        // a younger room on its way holds the door
        if (t - this.fbAt < VS_FB.HOLD_MS && vsYoungerComing(rooms, r.mode, t, own, r.seekAt)) return;
        const who = SS_RIVAL.persona(SS.prof.rating);
        this.fbSpawnAt = Date.now();
        this.fbRival = SS_RIVAL.spawn({ code: this.code, rating: who.rating, seatRating: who.rating, uid: who.uid, name: who.name, persona: who,
          delay: VS_FB.ARRIVE_MS + Math.random() * VS_FB.ARRIVE_SPREAD });
      } catch (e) { } finally { this.fbBusy = false; }
    })();
  }

  beginBattle() {
    // the room's tongue rules the duel: both clients must hold its dictionary
    // BEFORE the shared-seed deal, or their identical boards diverge. The
    // dictionary was prefetched at the first room snapshot, so this gate is
    // usually already open; if the fetch truly fails (10s of retries), fall
    // back to English rather than soft-lock the lobby.
    const rl = (this.room.lang && SS_PACKS[this.room.lang]) ? this.room.lang : 'en';
    if (!SS_DICT.ready(rl) && (this.dictTries | 0) < 40) {
      this.dictTries = (this.dictTries | 0) + 1;
      SS_DICT.load(rl);
      this.time.delayedCall(250, () => {
        if (this.state === 'wait' && this.room && this.room.status === 'active') this.beginBattle();
      });
      return;
    }
    ssUsePack(SS_DICT.ready(rl) ? rl : 'en');
    this.tweens.add({ targets: this.lobbyC, alpha: 0, duration: 400, onComplete: () => this.lobbyC.setVisible(false) });
    // everyone I cross swords with becomes a recent rival (one-tap add later)
    for (const p of this.others()) SSNET.FR.noteRival(p.id, p.name);
    if (this.challenged) SSNET.FR.cancelChallenge(this.challenged.id);   // the bell is answered
    setSeed(this.room.seed || 1);
    this.board = []; this.sel = [];
    this.buildOpponentPanels();
    this.state = 'rise';
    // rise together: both clients see status flip to active within moments of
    // each other and climb the same seeded sky. On a stale rejoin (resize
    // restart mid-battle) skip straight to the zenith.
    const fresh = Date.now() - (this.room.startedAt || 0) < 8000;
    if (!fresh || ssReduceMotion()) { this.arriveBattle(true); return; }
    SFX.riser();
    this.riseStart = this.time.now;
    this.riseSkipAt = null; this.riseLastP = 0; this.riseLastT = this.time.now;
    this.time.delayedCall(400, () => {   // arm skip past any launching tap
      if (this.state !== 'rise') return;
      this.riseSkipFn = () => { if (this.state === 'rise' && !this.riseSkipAt) this.riseSkipAt = ASC.TOTAL_MS - 220; };
      this.input.on('pointerdown', this.riseSkipFn);
    });
  }
  update(time) {
    if (this.state !== 'rise' || !this.riseStart) return;
    try {
      let ms = time - this.riseStart;
      if (this.riseSkipAt && ms < this.riseSkipAt) { this.riseStart = time - this.riseSkipAt; ms = this.riseSkipAt; }
      if (ms >= ASC.TOTAL_MS) { this.arriveBattle(); return; }
      const p = ssAscentP(ms);
      const vel = Math.max(0, (p - this.riseLastP) / Math.max(1, time - this.riseLastT));
      this.sky.setP(p, vel);
      this.riseLastP = p; this.riseLastT = time;
    } catch (e) { this.arriveBattle(true); }
  }
  arriveBattle(instant) {
    if (this.state !== 'rise') return;
    if (this.riseSkipFn) { this.input.off('pointerdown', this.riseSkipFn); this.riseSkipFn = null; }
    this.sky.setP(1, 0);
    if (!instant) SFX.arriveChime();
    SFX.victory();
    const l = this.L;
    this.fillBoard(true);
    this.state = 'pick';
    this.updatePanels();
    const go = ssTxt(this, l.x(0), l.y(400), 'WEAVE!', l.u(30), '#2fe0d0').setOrigin(0.5).setDepth(80).setScale(0.5);
    this.tweens.add({ targets: go, scale: 1, duration: 200, ease: 'Back.easeOut' });
    this.tweens.add({ targets: go, alpha: 0, delay: 900, duration: 300, onComplete: () => go.destroy() });
    // arriving into a duel woven in another tongue — say so over the board,
    // for joiners who rose past the lobby too fast to read it there
    if (this.room.lang && this.room.lang !== ssGameLang() && SS_PACKS[this.room.lang]) {
      const lt = ssTxt(this, l.x(0), l.y(438), SS_T('vsLang', SS_LANGS[this.room.lang] || this.room.lang),
        l.u(12), '#ffe9a8', 'italic').setOrigin(0.5).setDepth(80);
      this.tweens.add({ targets: lt, alpha: 0, delay: 2600, duration: 400, onComplete: () => lt.destroy() });
    }
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
      // the rival's star-class glyph rides beside the name (veiled ratings show
      // no glyph); tapping the name opens their rating card from the room record
      const hidden = !!p.rhide;
      const pr = Number.isFinite(p.rating) ? p.rating : SS_RATING.BASE;
      const nm = ssTxt(this, l.u(n === 1 ? -40 : -30), -l.u(22), (hidden ? '' : ssRatingTier(pr).glyph + ' ') + p.name, l.u(n === 1 ? 15 : 12), '#f0e8d2').setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true });
      nm.on('pointerdown', () => ssRatingCard(this, { name: p.name, rating: pr, rhide: hidden }));
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
    if (this.room && this.room.status === 'waiting') { this.rescan(); this.quietSky(); }
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
      ch = PACK.digraph[ch] || ch;
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
      fontFamily: SERIF, fontSize: l.u(ch.length > 1 ? 30 : 36) + 'px', fontStyle: 'bold',
      color: tier === 2 ? '#1d4a66' : tier === 1 ? '#5a3c05' : '#3a3020',
    }).setOrigin(0.5);
    // value at 15px in near-letter-dark ink — it has to read at arm's length
    // (and tier 2 finally gets its own blue ink, matching the solo board)
    const val = this.add.text(l.u(24), l.u(21), String(this.tileVal(ch, tier)), {
      fontFamily: SERIF, fontSize: l.u(15) + 'px', fontStyle: 'bold',
      color: tier === 2 ? '#215a7c' : tier === 1 ? '#5f420a' : '#655636',
    }).setOrigin(0.5);
    c.add([img, letter, val]);
    // a tile is tappable once it has LANDED: on its way down it crosses the
    // rival's nameplate, and a tap meant for the name would weave it instead
    c.setSize(this.tileSize, this.tileSize);
    c.on('pointerdown', () => this.tapTile(i));
    this.boardC.add(c);
    this.board[i] = { ch, tier, c, img, letter, val };
    this.tweens.add({ targets: c, y: p.y, duration: 450, ease: 'Bounce.easeOut', delay: initial ? i * 40 : Math.random() * 90,
      onComplete: () => { if (c.active) c.setInteractive({ useHandCursor: true }); } });
  }
  tileVal(ch, tier) { return (VALS[ch] || VALS[ch[0]] || 1) + (tier === 1 ? 6 : 0); }
  // USE IT OR LOSE IT, versus edition: same law as the solo board — a bonus
  // tile not woven into your very next cast drains to plain. Both clients run
  // the rule on their own boards, so the duel stays fair.
  expireSpecials() {
    const l = this.L;
    let drained = false;
    for (const s of this.board) {
      if (!s || !s.tier || !s.c.active) continue;
      drained = true;
      const tint = s.tier === 2 ? 0x9fd8ff : 0xffd77a;
      s.tier = 0;
      const plain = this.add.image(0, 0, 'tile0').setDisplaySize(this.tileSize, this.tileSize).setAlpha(0);
      s.c.addAt(plain, s.c.list.indexOf(s.img) + 1);
      const old = s.img;
      s.img = plain;
      this.tweens.add({ targets: plain, alpha: 1, duration: 480, delay: 120, onComplete: () => { if (old.active) old.destroy(); } });
      // pure cosmetics use Math.random, never rng() — the seeded stream deals
      // the tiles and must not be nudged by an animation
      for (let k = 0; k < 3; k++) {
        const mote = this.add.image(s.c.x + (Math.random() - 0.5) * l.u(34), s.c.y + (Math.random() - 0.5) * l.u(20), 'dot')
          .setScale(0.5 + Math.random() * 0.4).setTint(tint).setAlpha(0.5).setBlendMode('ADD').setDepth(60);
        this.boardC.add(mote);
        this.tweens.add({ targets: mote, y: mote.y + l.u(16 + Math.random() * 10), alpha: 0, delay: k * 90, duration: 520, ease: 'Sine.easeIn', onComplete: () => mote.destroy() });
      }
      this.time.delayedCall(280, () => {
        if (!s.c.active) return;
        s.letter.setColor('#3a3020');
        s.val.setText(String(this.tileVal(s.ch, 0))).setColor('#655636');
      });
    }
    if (drained) SFX.fizzle();
  }
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
  validWord() { const w = this.currentWord(); return this.sel.length >= 2 && WORDSET.has(w); }
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
        fontFamily: SERIF, fontSize: l.u(s.ch.length > 1 ? 16 : 20) + 'px', fontStyle: 'bold', color: valid ? '#1d6a35' : '#3a3020',
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
    SS.prof.words++; SS.prof.vsWords++; SS.save();
    if (SS.prof.vsWords >= 25) SS.award('war-weaver', this.game);

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
      this.expireSpecials();               // unspent bonuses fade before the new reward drops
      if (letters >= 7) this.pendingTier = 2;
      else if (letters >= 5) this.pendingTier = 1;
      if (this.pendingTier && this.hasSigil('forge')) this.pendingTier = 2;
      if (this.pendingTier) SFX.forge();
      this.fillBoard(false);
      this.layoutLine();
      // roguelite pick-3 every 3 of my casts
      // the rival's client may have settled the room on my wound before my
      // tiles landed: the end screen is already up, and nothing here may
      // reopen the board over it (REMATCH reads state === 'done')
      if (this.state === 'done') return;
      if (myCasts % 3 === 0) this.showSigilPick();
      else this.state = 'pick';
      this.checkEnd();
    } catch (e) {
      if (this.state !== 'done') this.state = 'pick';
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
    // Only sigils this engine actually implements (see wordDamage/tryCast) —
    // the solo-only ones (battle timers, heals, revives) would be dead picks.
    // The old exclusion list leaked leech and gilded, which did nothing here.
    const VS_OK = ['quill', 'choir', 'runes', 'forge', 'longbow', 'blood'];
    const avail = SS_SIGILS.filter((s) => !this.mySigils.includes(s.id) && VS_OK.includes(s.id));
    const opts = [];
    while (opts.length < 3 && avail.length) opts.push(avail.splice(Math.floor(Math.random() * avail.length), 1)[0]);
    if (!opts.length) { this.state = 'pick'; return; }
    // dim the board — the cards were floating straight over lit tiles and the
    // header drowned; the veil also swallows stray taps
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive().setDepth(118);
    this.tweens.add({ targets: veil, alpha: 0.72, duration: 250 });
    const head = ssTxt(this, l.x(0), l.y(428), SS_T('vsSigilHead'), l.u(14), '#c9b676').setOrigin(0.5).setDepth(120)
      .setShadow(0, 0, '#c9b676', l.u(8), true, true);
    const items = [veil, head];
    opts.forEach((sg, k) => {
      const tier = sg.rarity | 0;
      const cy = l.y(486 + k * 94);
      if (tier > 0) {
        items.push(this.add.image(l.x(0), cy, 'glowbig').setDisplaySize(l.u(430), l.u(150))
          .setTint(SS_RARITY[tier].glow).setAlpha(tier === 2 ? 0.16 : 0.09).setBlendMode('ADD').setDepth(119));
      }
      const card = ssSigilCard(this, l, sg, 330, 84).setPosition(l.x(0), cy).setDepth(120).setAlpha(0);
      this.tweens.add({ targets: card, alpha: 1, delay: 100 + k * 110, duration: 260 });
      items.push(card);
      card.on('pointerdown', () => {
        if (this.state !== 'sigil') return;
        SFX.sigil();
        this.mySigils.push(sg.id);
        if (this.meRef) this.meRef.update({ sigils: this.mySigils }).catch(() => { });
        for (const it of items) it.destroy();
        this.state = 'pick';
        this.refreshSigChip();
        this.updatePanels();
      });
    });
    this.overlayC.add(items);
  }

  // ---------- the sigil inspector ----------
  refreshSigChip() {
    const n = this.mySigils.length;
    this.sigChipB.setVisible(n > 0);
    this.sigChipT.setVisible(n > 0).setText(n ? '✦ ' + n : '');
  }
  openInspect() {
    if (this.inspectP || this.state !== 'pick' || !this.mySigils.length) return;
    SFX.ensure();
    this.inspectP = ssSigilPanel(this, {
      sigils: this.mySigils,
      onClose: () => { this.inspectP = null; },
    });
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
    if (this.inspectP) this.inspectP.close();   // the end screen owes the reader nothing
    if (this.sky) this.sky.setP(1, 0);   // if the duel dies mid-rise, land at the zenith where the overlay lives
    const l = this.L;
    const won = this.room.winnerUid === vsUid();
    const winner = this.room.players[this.room.winnerUid];
    if (won) { SS.prof.wins++; SS.prof.vsWins++; } else SFX.defeat();
    // THE FANFARE — you beat a *person*: the head-to-head gets its own beat
    // (comets crossing, the rival named) before the stats settle in. The
    // fanfare carries the victory sting, so no SFX.victory() here.
    let fanWait = 0;
    if (won) {
      const rivals = this.others();
      const sub = rivals.length === 1 ? SS_T('fanVsSub', rivals[0].name) : SS_T('fanVsSubMany');
      fanWait = ssWinFanfare(this, 2, { text: SS_T('fanVs'), sub, cy: 300 });
    }
    // the rating exchange — Elo against the field's average, each client
    // settling its own ledger from the same room record (so a duel's two
    // deltas mirror). No winner (everyone faded) = no exchange.
    let rd = 0;
    if (this.room.winnerUid) {
      const foes = Object.entries(this.room.players || {}).filter(([id]) => id !== vsUid()).map(([, p]) => p);
      if (foes.length) {
        const oppAvg = foes.reduce((a, p) => a + (Number.isFinite(p.rating) ? p.rating : SS_RATING.BASE), 0) / foes.length;
        rd = SS_RATING.duel(oppAvg, won ? 1 : 0);
      }
    }
    SS.prof.runs++; SS.save(); SS.sync();
    if (won) {
      SS.award('rival-star', this.game);
      if (this.room.mode === 'bg' && Object.keys(this.room.players || {}).length >= 3) SS.award('sky-marshal', this.game);
    }
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.85).setInteractive().setDepth(150);
    const items = [veil];
    items.push(ssTxt(this, l.x(0), l.y(280), won ? 'THE SKY BOWS TO YOU' : 'THE DUEL IS LOST', l.u(24), won ? '#ffe9a8' : '#e66a6a').setOrigin(0.5).setDepth(151)
      .setShadow(0, 0, won ? '#c9b676' : '#802020', l.u(12), true, true));
    items.push(ssTxt(this, l.x(0), l.y(330), winner ? winner.name + ' stands alone beneath the stars' : 'the night ends quietly', l.u(13), '#d8d2bd', 'italic').setOrigin(0.5).setDepth(151));
    const me = this.me() || {};
    items.push(ssTxt(this, l.x(0), l.y(380), 'damage dealt  ' + (me.dealt | 0) + '   ·   words  ' + (me.casts | 0), l.u(13), '#8a94c4').setOrigin(0.5).setDepth(151));
    if (rd !== 0) {
      const rTier = ssRatingTier(SS.prof.rating);
      items.push(ssTxt(this, l.x(0), l.y(408), '✦ ' + (rd > 0 ? '+' : '') + rd + '  ·  ' + SS.prof.rating + ' ' + SS_T(rTier.key), l.u(12), rd > 0 ? '#ffd77a' : '#c98080').setOrigin(0.5).setDepth(151)
        .setShadow(0, 0, rd > 0 ? '#c9b676' : '#802020', l.u(6), true, true));
    }
    this.rematchB = this.add.image(l.x(0), l.y(455), ssBtn(this, false, 240, 56)).setDisplaySize(l.u(240), l.u(56)).setInteractive({ useHandCursor: true }).setDepth(151);
    this.rematchT = ssTxt(this, l.x(0), l.y(455), '⚔ REMATCH', l.u(16), BTN_INK()).setOrigin(0.5).setDepth(151);
    this.rematchB.on('pointerdown', () => { SFX.ui(); this.doRematch(); });
    const homeB = this.add.image(l.x(0), l.y(525), ssBtn(this, true, 220, 52)).setDisplaySize(l.u(220), l.u(52)).setInteractive({ useHandCursor: true }).setDepth(151);
    const homeT = ssTxt(this, l.x(0), l.y(525), 'RETURN', l.u(15), '#9fb0e8').setOrigin(0.5).setDepth(151);
    items.push(this.rematchB, this.rematchT, homeB, homeT);
    homeB.on('pointerdown', () => { SFX.ui(); this.scene.start('vsmenu'); });
    // the rival you just fought is the friend you're most likely to want
    const foesL = this.others();
    if (foesL.length === 1 && !SSNET.FR.friends[foesL[0].id] && SSNET.mode === 'firebase') {
      const f = foesL[0];
      const addT = ssTxt(this, l.x(0), l.y(578), SS_T('endAddFriend', f.name), l.u(11.5), '#c9b676').setOrigin(0.5).setDepth(151).setInteractive({ useHandCursor: true });
      while (addT.width > l.u(360) && addT.text.length > 8) addT.setText(addT.text.slice(0, -2) + '…');
      addT.on('pointerdown', () => {
        SFX.ui(); addT.disableInteractive().setColor('#7fe0a0').setText(SS_T('endFriends'));
        SSNET.FR.add(f.id, f.name).then(() => vsNotify(SS_T('frAdded', f.name)));
      });
      items.push(addT);
    }
    this.overlayC.add(items);
    // a win's window waits out the fanfare, then settles up into place; the
    // veil dims quickly (the celebration reads better on a hushed field) and
    // deepens as the window arrives. Buttons stay locked until it lands.
    if (fanWait) {
      veil.setAlpha(0);
      this.tweens.chain({ targets: veil, tweens: [
        { alpha: 0.5, duration: 260 },
        { alpha: 0.85, duration: 450, delay: Math.max(0, fanWait - 710) },
      ] });
      const rest = items.filter((o) => o !== veil);
      rest.forEach((it) => { it.alpha = 0; it.y += l.u(14); });
      this.tweens.add({ targets: rest, alpha: 1, y: '-=' + l.u(14), duration: 400, ease: 'Back.easeOut', delay: fanWait });
      const lock = rest.filter((o) => o.input);
      lock.forEach((o) => { o.input.enabled = false; });
      this.time.delayedCall(fanWait, () => lock.forEach((o) => { if (o.active && o.input) o.input.enabled = true; }));
    }
    if (this.room.rematch) this.showRematchCall();
    if (VSDEMO) {
      localStorage.setItem('beta3.vsresult', JSON.stringify({ won, mode: this.room.mode, dealt: me.dealt | 0, casts: me.casts | 0, rematch: !!window.__VSDEMO_REMATCHED, rating: SS.prof.rating, rd, t: Date.now() }));
      if (!window.__VSDEMO_REMATCHED) {
        window.__VSDEMO_REMATCHED = true;
        this.time.delayedCall(2000 + Math.random() * 2000, () => { if (this.scene.isActive()) this.doRematch(); });
      }
    }
  }

  /* ---------- rematch: first presser seals a fresh room on the old one ---------- */
  showRematchCall() {
    if (!this.rematchT || this.rematchPulse) return;
    this.rematchT.setText('⚔ ANSWER THE REMATCH');
    this.rematchPulse = this.tweens.add({ targets: [this.rematchB, this.rematchT], alpha: 0.55, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  async doRematch() {
    if (this.rematchBusy || this.state !== 'done' || !this.room) return;
    this.rematchBusy = true;
    this.rematchT && this.rematchT.setText('SEALING…');
    try {
      let dest = this.room.rematch;
      if (!dest) {
        const code = vsCode();
        await SSNET.dbSet('mp/rooms/' + code, {
          mode: this.room.mode, status: 'waiting', createdAt: Date.now(), hostUid: vsUid(),
          seed: Math.floor(Math.random() * 1e9),
          lang: this.room.lang || 'en',   // a rematch keeps the tongue the duel began in
          players: { [vsUid()]: vsSeat(0) },
        });
        // one rematch room per battle — a transaction settles simultaneous pressers
        const r = await SSNET.dbTxn('mp/rooms/' + this.code + '/rematch', (cur) => (cur == null ? code : undefined));
        dest = (r && r.value) || code;
        if (dest !== code) SSNET.dbSet('mp/rooms/' + code, null).catch(() => { });
      }
      const mine = await vsJoinRoom(dest); // idempotent — true if we are already seated
      if (!mine) { this.rematchBusy = false; this.rematchT && this.rematchT.setText('THE SEAL IS COLD'); return; }
      this.scene.start('vsbattle', { code: dest });
    } catch (e) {
      this.rematchBusy = false;
      this.rematchT && this.rematchT.setText('⚔ REMATCH');
    }
  }

  /* ---------- demo: the solver duels itself ---------- */
  demoStep() {
    if (this.state === 'sigil') {
      const cards = this.overlayC.list.filter((o) => o.getData && o.getData('sigilCard'));
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

/* ============================================================
   THE SUMMONS — a transparent overlay scene that runs above every
   other screen (Home launches it once, brings it to top). It draws
   two things: the pulsing challenge banner when a friend rings the
   bell (ACCEPT drops straight into their room, whatever you were
   doing — the campaign checkpoint is safe, a quick run is not) and
   small toasts for the friends layer ("X is now your friend").
   Nothing here is interactive except the banner itself, so taps
   elsewhere fall through to the scene beneath.
   ============================================================ */
class VsSummons extends Phaser.Scene {
  constructor() { super('summons'); }
  create() {
    ssMakeTextures(this);
    this.bannerC = null; this.shown = null; this.accepting = false;
    this.toastY = 0;
    this.frOff = SSNET.FR.on(() => this.refresh());
    // banners age out and "suppressed" flips as scenes come and go
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.refresh() });
    this.events.once('shutdown', () => { if (this.frOff) { this.frOff(); this.frOff = null; } });
    if (FRDEMO === 'guest') this.time.addEvent({ delay: 1500, loop: true, callback: () => { const inv = SSNET.FR.pending()[0]; if (inv && !this.accepting) this.accept(inv); } });
  }
  // no bell while a versus scene is up: a fresh challenge waits in RTDB (5 min)
  // and rings the moment you're back on a menu
  suppressed() {
    const vb = this.scene.get('vsbattle');
    return !!(vb && vb.sys.isActive());
  }
  refresh() {
    if (!this.sys.isActive()) return;
    const list = SSNET.FR.pending();
    const inv = list[0];
    if (!inv || this.suppressed()) { if (this.bannerC && !this.accepting) this.hide(); return; }
    if (this.shown && this.shown.from === inv.from && this.shown.code === inv.code) {
      if (this.moreT && this.moreT.active) this.moreT.setText(list.length > 1 ? SS_T('smMore', list.length - 1) : '');
      return;
    }
    if (this.accepting) return;
    this.show(inv, list.length - 1);
  }
  show(inv, more) {
    if (this.bannerC) { this.bannerC.destroy(); this.bannerC = null; }
    this.shown = inv;
    const l = ssLayout(this);
    const c = this.bannerC = this.add.container(l.x(0), l.y(120)).setDepth(900);
    const W = 356, H = 66;
    const glow = this.add.image(0, 0, 'glowbig').setDisplaySize(l.u(W * 1.5), l.u(H * 2.6)).setTint(0xffd77a).setAlpha(0.16).setBlendMode('ADD');
    this.tweens.add({ targets: glow, alpha: 0.05, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const bg = this.add.image(0, 0, ssBtn(this, true, W, H)).setDisplaySize(l.u(W), l.u(H)).setInteractive();
    const name = inv.name || SSNET.FR.nameOf(inv.from);
    const t1 = ssTxt(this, -l.u(W / 2 - 16), -l.u(13), SS_T('smTitle', name), l.u(13), '#ffe9a8').setOrigin(0, 0.5)
      .setShadow(0, 0, '#c9b676', l.u(6), true, true);
    while (t1.width > l.u(220) && t1.text.length > 6) t1.setText(t1.text.slice(0, -2) + '…');
    const t2 = ssTxt(this, -l.u(W / 2 - 16), l.u(11), SS_T(VS_MODE_KEY[inv.mode] || 'vsModeTurns') + '  ·  ' + inv.code, l.u(10), '#9fb0e8', 'italic').setOrigin(0, 0.5);
    const ab = this.add.image(l.u(W / 2 - 78), 0, ssBtn(this, false, 96, 32)).setDisplaySize(l.u(96), l.u(32)).setInteractive({ useHandCursor: true });
    const at = ssTxt(this, l.u(W / 2 - 78), 0, SS_T('smAccept'), l.u(11), BTN_INK()).setOrigin(0.5);
    this.tweens.add({ targets: [ab, at], alpha: 0.7, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    ab.on('pointerdown', () => { SFX.ensure(); SFX.ui(); this.accept(inv); });
    const xb = ssTxt(this, l.u(W / 2 - 16), 0, '✕', l.u(15), '#8a94c4').setOrigin(0.5).setInteractive({ useHandCursor: true });
    xb.on('pointerdown', () => { SFX.ui(); SSNET.FR.decline(inv.from); this.hide(); });
    this.moreT = ssTxt(this, 0, l.u(H / 2 + 12), more > 0 ? SS_T('smMore', more) : '', l.u(9), '#8a94c4', 'italic').setOrigin(0.5);
    this.acceptT = at;
    c.add([glow, bg, t1, t2, ab, at, xb, this.moreT]);
    c.y = l.y(120) - l.u(90); c.alpha = 0;
    this.tweens.add({ targets: c, y: l.y(120), alpha: 1, duration: 420, ease: 'Back.easeOut' });
    SFX.forge();
    localStorage.setItem('beta3.summons', JSON.stringify({ from: inv.from, code: inv.code, mode: inv.mode, t: Date.now() }));
  }
  hide() {
    const c = this.bannerC;
    this.bannerC = null; this.shown = null; this.moreT = null; this.acceptT = null;
    if (!c) return;
    this.tweens.add({ targets: c, alpha: 0, y: c.y - ssLayout(this).u(30), duration: 220, onComplete: () => c.destroy() });
  }
  async accept(inv) {
    if (this.accepting) return;
    this.accepting = true;
    if (this.acceptT && this.acceptT.active) this.acceptT.setText('…');
    let ok = false;
    try { ok = await vsJoinRoom(inv.code); } catch (e) { ok = false; }
    SSNET.FR.decline(inv.from);   // the bell is answered either way
    if (!this.sys.isActive()) { this.accepting = false; return; }
    if (!ok) { this.accepting = false; this.hide(); this.toast(SS_T('smCold')); return; }
    // whatever was running steps aside: a battle mid-swing, the meadow, a
    // sleeping Home under a battle, a half-typed seal code…
    PENDING_ASCENT = null;
    for (const s of this.game.scene.getScenes(false)) {
      if (s === this) continue;
      if (s.sys.isActive() || s.sys.isSleeping() || s.sys.isPaused()) s.scene.stop();
    }
    this.hide();
    this.accepting = false;
    this.scene.launch('vsbattle', { code: inv.code });
    this.scene.bringToTop();
  }
  toast(text) {
    if (!this.sys.isActive()) return;
    const l = ssLayout(this);
    const c = this.add.container(l.x(0), l.y(-40)).setDepth(910);
    const t = ssTxt(this, 0, 0, text, l.u(12), '#ffe9a8').setOrigin(0.5).setShadow(0, 0, '#c9b676', l.u(6), true, true);
    while (t.width > l.u(330) && t.text.length > 6) t.setText(t.text.slice(0, -2) + '…');
    const bw = Math.ceil((t.width / l.u(1) + 36) / 20) * 20;   // coarse steps: one baked pill per width bucket
    const bg = this.add.image(0, 0, ssBtn(this, true, bw, 34)).setDisplaySize(l.u(bw), l.u(34));
    c.add([bg, t]);
    const y = this.bannerC ? 186 : 120;   // clear of the home chips (and the banner, when one is up)
    this.tweens.add({ targets: c, y: l.y(y), duration: 380, ease: 'Back.easeOut' });
    this.tweens.add({ targets: c, alpha: 0, delay: 2600, duration: 400, onComplete: () => c.destroy() });
    SFX.ach();
  }
}

ssAddScene('vsmenu', VsMenu);
ssAddScene('vsbattle', VsBattle);
ssAddScene('summons', VsSummons);
