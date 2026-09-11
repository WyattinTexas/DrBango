'use strict';
/* ============================================================
   STARSPELL versus — the async battle, on the RTDB room system
   (pattern lifted from BoO raids: single room listener, txn
   join, multi-path turn handoff, onDisconnect presence).

   THE PAGE (v0.73.0, Skylar 9/2): challenge-first. No heading, no
   mode pills — every door on this page seals a TURNS room (the
   async battle is the only duel offered). Two primaries:
   · CHALLENGE A FRIEND — opens the social sheet: the friends roll
     (drawn crossed-blades glyph + CHALLENGE on every row; an away
     friend takes a standing summons), the recent rivals beneath,
     a + that adds a friend by their unique name, and — pinned at
     the sheet's foot — the invite that sends a NEW friend the
     STARSPELL app itself (VS_APP_URL, never a drbango.com page).
   · CHALLENGE WORLDWIDE — a searching theater (9/3 card 03): a
     rolled 8–15s "searching for an opponent…", then OPPONENT
     FOUND, then straight into the turns duel. Humans first under
     the veil (the rival queue runs unchanged); a quiet sky is
     answered by THE CIRCLE at the roll's end — and that duel
     moves to THIS device (SS_NEAR) so it can breathe at a busy
     human's rhythm and survive the app closing. Friend summonses
     no longer wait at a screen either: they stand as pending rows
     on this page (VS_PEND), the roaming watcher in VsSummons
     keeping them honest. The summons-sealed lobby is gone.

   The room ENGINE below still speaks turns/timed/bg — a room's
   mode rules its battle, so an old client's timed room resolves —
   but this page mints turns only, and nothing saves a mode choice.

   Every 3rd cast of your own → sigil pick-3.
   Boards start identical (shared seed) then diverge.

   Connections (v0.25): FRIENDS — a mutual list in RTDB (SSNET.FR),
   presence dots, one-tap CHALLENGE that seals a private room and
   rings a summons banner on the friend's screen (VsSummons overlay
   scene, any screen). ?join=CODE&from=UID deep links auto-join on
   boot (minted by the lobby's share button).
   Testing: ?vsdemo=1&mpuid=a — solver plays.
   ?frdemo=host|guest|invite|join&mpuid=x — friends recipes (see
   frDemo / VsSummons.create).
   ============================================================ */

const VS_MAX = { turns: 2, timed: 2, bg: 4 };
const VS_MIN = { turns: 2, timed: 2, bg: 2 };
const VS_TIME_MS = 180000;
const VS_HP = 60;
/* ---------- correspondence (9/8 card 04, Skylar) ----------
   A turns duel is CORRESPONDENCE now: turns of exactly 3 casts each,
   alternating — you weave your three whenever you like, your rival weaves
   theirs whenever THEY open the app. Rooms wear `corr: 1`, live long, and a
   step out is never desertion (abandoning is its own confirmed door, and a
   rated loss). At 60 hp a single strong turn could end a duel before it ever
   breathed — correspondence hp is 150 so the duel goes rounds, the way a
   week-long game should. `turnCasts` counts the standing turn's casts on the
   room record itself; legacy rooms (no corr) keep the old cast-and-pass. */
const VS_CORR_HP = 150;
const VS_TURN_CASTS = 3;
const VS_CAP = 5;   // ongoing duels at most, friend + worldwide together (Skylar's five)
// a rematch wait is freed by the rival's word (rematchNo on the old room) or,
// when no word can ever come (network death, a force-quit), by this belt —
// no waiting screen in versus may be unescapable (9/8 card 02). ?rmbelt=MS
// pins it for the harnesses (the ?vsfind pattern).
const VS_RM_BELT_MS = (() => { const p = parseInt(QS.get('rmbelt'), 10); return Number.isFinite(p) && p > 0 ? p : 90000; })();
function vsTurnSize(room) { return room && room.corr ? VS_TURN_CASTS : 1; }
function vsRoomHp(room) { return (room && room.hp) || VS_HP; }
const VS_EMBLEMS = ['vulpes', 'strix', 'serpens', 'draco'];
const FRDEMO = QS.get('frdemo');                              // friends-flow test recipes
const VSDEMO = QS.get('vsdemo') === '1' || !!FRDEMO;          // the solver plays the duel
const VSAUTO = QS.get('vsdemo') === '1';                      // …and auto quick-matches from the menu
if (FRDEMO) window.__VSDEMO_REMATCHED = true;                 // friends recipes end after one duel
// identity comes from SSNET (which honors ?mpuid= for same-machine tests) —
// friends, presence, invites and seats all key by the same uid
const vsUid = () => SSNET.uid();
const vsName = () => SSNET.myName();
// the ENGINE's mode vocabulary (rooms still speak all three — an old
// client's timed/bg room resolves; rival.js's ?botduel seam validates its
// ?vsmode against this list). The MENU offers none of them: it mints turns.
const VS_MODES = ['turns', 'timed', 'bg'];
// the summons banner still names an old client's timed/bg challenge honestly
const VS_MODE_KEY = { turns: 'vsModeTurns', timed: 'vsModeTimed', bg: 'vsModeBg' };
// where a NEW friend is sent: the STARSPELL app itself (the TestFlight door
// today — swap this one constant when the App Store page exists). A store
// link cannot carry a ?friend= deep link, so the share names the sender and
// the new mage adds them by their unique name after installing.
const VS_APP_URL = 'https://testflight.apple.com/join/Hxs8e7fU';
// every seat carries its rating into the room: the Elo exchange at the end
// reads the rival's number from here, and rhide keeps a veiled rating out of
// the opponent's VIEW (the math still needs the true value — client-
// authoritative, same caveat as every score in this game)
const vsSeat = (seat, hp) => ({
  name: vsName(), hp: hp || VS_HP, seat, casts: 0, dealt: 0, gone: false, joinedAt: Date.now(),
  rating: SS.prof.rating, rhide: SS.prof.rhide ? 1 : 0,
});
// a seat HELD for a rival who has not yet answered: the challenger weaves
// their first three into it, the claim (vsJoinRoom) fills the person in
const vsHeldSeat = (seat, hp, name) => ({
  name: name || '…', hp: hp || VS_HP, seat, casts: 0, dealt: 0, gone: false, joinedAt: 0, held: 1,
});

/* ============================================================
   Menu — THE DUELING GROUND (v0.97.0, the 9/9 UNDER ONE SKY
   review built on Skylar's 9/10 go; challenge-first bones from
   v0.73.0/v0.83.0 kept). The page stands on the shipped
   sky-world in its versus dress, wears the VERSUS wordmark and
   THE DUELISTS hero (two mage asterisms sharing one zenith
   star), promotes the duel ledger to seal-plaques with cap pips
   and a summons plate, seats the people the systems know on a
   presence strip, gives a fresh device the first-visit funnel
   and a blocked sky the ghost ledger. Turns only; friends are
   reached through the sheet, new mages through the app invite,
   rooms through summons bells and ?join deep links.
   ============================================================ */
class VsMenu extends Phaser.Scene {
  constructor() { super('vsmenu'); }
  create() {
    const l = ssLayout(this);
    ssMakeTextures(this);
    // the dueling ground: the same world the searching theater and the
    // rise-together already run — menu → search → rise is one place now.
    // A fixed seed keeps the page's own starfield grade its own.
    this.sky = ssSkyWorld(this, { versus: true, seed: 0x1701 });
    // scene instances persist across restarts — stale truthy refs from a
    // previous life could keep the sheet (or a band rebuild) from ever
    // happening again
    this.socialC = null; this.frC = null; this.shNoteT = null;
    this.recentRows = null; this.frRows = null;
    this.frOff = null; this.frTimer = null;
    this.busyC = false;
    this.pendC = null; this.pendRows = null; this.pendKey = '';
    this.doorsC = null; this.doorsMode = null; this.stripC = null; this.chipRows = null; this.stripHeadT = null;
    this.chFriendB = null; this.chWorldB = null; this.addDoorB = null; this.invDoorB = null; this.retryB = null;
    this.noteT = null; this.whisperT = null; this.idChipT = null; this.idChipB = null;
    this.zenith = null; this.zenithHalo = null; this.zenBreath = null; this.zenFlare = 0;
    const back = ssTxt(this, l.x(-195), l.y(24), '‹ HOME', l.u(14), '#9fb0e8').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { SFX.ui(); this.scene.start('home'); });

    // the wordmark — the home door's word in the gold letterpress bake, the
    // drawn blades flanking it (the U+2694 text emblem died in the 9/10 sweep;
    // no sixth string: SS_T('versus') localizes the mark for free)
    const wm = ssGoldTex(this, SS_T('versus'), 23);
    const wsc = Math.min(1, 210 / wm.w);
    this.wordmark = this.add.image(l.x(0), l.y(62), wm.key).setDisplaySize(l.u(wm.w * wsc), l.u(wm.h * wsc));
    const woff = (wm.w * wsc) / 2 + 21;
    this.add.image(l.x(-woff), l.y(62), vsSwordsTex(this)).setDisplaySize(l.u(20), l.u(20)).setAlpha(0.95);
    this.add.image(l.x(woff), l.y(62), vsSwordsTex(this)).setDisplaySize(l.u(20), l.u(20)).setAlpha(0.95);
    ssTxt(this, l.x(0), l.y(94), SS_T('vsAsync'), l.u(10.5), '#c9b676', 'italic').setOrigin(0.5);

    const offline = SSNET.mode === 'local';
    this.buildHero(l, offline);

    // the design box runs to y 800, but a width-limited phone floats it, so
    // the true foot is computed — doors, whisper and note all anchor to it
    const safeB = 400 + (l.H - (SS_INSET.top + SS_INSET.bottom) * DPR) / (2 * l.s);
    this.safeB = safeB;
    // the feedback line and the record whisper share the foot line — a live
    // note steps in front of the whisper, and gives it back when it clears
    this.noteT = ssTextBlock(this, l.x(0), l.y(safeB - 44), '', {
      fontSize: l.u(11) + 'px', color: '#c9b676', fontStyle: 'italic', shadow: true,
      wrapW: l.u(340), align: 'center', ox: 0.5, oy: 0.5,
    });

    if (offline) {
      // STILL A PLACE (the review's offline state): the sky is local, so it
      // still builds — the Duelists dimmed, the shared star unlit, the
      // shipped couplet in its rose ink, then the ghost ledger: the standing
      // duels this device remembers, at low alpha, waiting on the connection.
      ssTxt(this, l.x(0), l.y(330), SS_T('vsNoSky'), l.u(14), '#8c5a5a', 'italic').setOrigin(0.5).setAlign('center');
      const ghosts = [...new Set(vsGameRows().map((r) => r.name))].slice(0, 4);
      if (ghosts.length) {
        this.ghostT = ssTxt(this, l.x(0), l.y(408), ghosts.join(' · '), l.u(10.5), '#8a94c4').setOrigin(0.5).setAlpha(0.55);
        while (this.ghostT.width > l.u(340) && this.ghostT.text.length > 4) this.ghostT.setText(this.ghostT.text.slice(0, -3) + '…');
        ssTxt(this, l.x(0), l.y(428), SS_T('vsGhost'), l.u(8.5), '#5a6390', 'italic').setOrigin(0.5);
      }
      // TRY THE SKY AGAIN — the one honest retry is a fresh boot (connect()
      // is once-per-load by design), so the door reloads the page in place
      const rb = this.retryB = this.add.image(l.x(0), l.y(496), ssBtn(this, true, 300, 54)).setDisplaySize(l.u(300), l.u(54)).setInteractive({ useHandCursor: true });
      ssTxt(this, l.x(0), l.y(496), SS_T('vsRetry'), l.u(12.5), '#c9d0f0').setOrigin(0.5);
      rb.on('pointerdown', () => { SFX.ui(); try { location.reload(); } catch (e) { } });
      return;
    }
    try { localStorage.removeItem('beta3.vsmode'); } catch (e) { }   // the mode choice is retired — sweep the dead key

    // the identity chip — stakes in the corner: tier glyph, name, rating
    // (a first-night mage wears ✧ and no number yet); tap → your rating card
    const fresh0 = !vsGameRows().length && !SSNET.FR.list().length && !SSNET.FR.recentList(1).length;
    const idT = this.idChipT = ssTxt(this, 0, l.y(24),
      fresh0 ? '✧ ' + vsName() : ssRatingTier(SS.prof.rating).glyph + ' ' + vsName() + ' · ' + SS.prof.rating,
      l.u(10), '#c9b676').setOrigin(0.5);
    while (idT.width > l.u(150) && idT.text.length > 6) idT.setText(idT.text.slice(0, -2) + '…');
    const bw = Math.ceil((idT.width / l.u(1) + 24) / 10) * 10;   // coarse pill buckets, the toast law
    const idB = this.idChipB = this.add.image(0, l.y(24), ssBtn(this, true, bw, 26)).setDisplaySize(l.u(bw), l.u(26)).setInteractive({ useHandCursor: true });
    idB.setX(l.x(198) - idB.displayWidth / 2); idT.setX(idB.x); idT.setDepth(1);
    ssHitPad(idB, 44);
    idB.on('pointerdown', () => { SFX.ui(); ssRatingCard(this, { uid: vsUid(), name: vsName() }); });

    // the record whisper over the fireflies — the one synced record the game
    // keeps; at zero wins the fireflies own the foot alone
    this.whisperT = ssTxt(this, l.x(0), l.y(safeB - 44), '', l.u(9.5), '#c9b676').setOrigin(0.5).setAlpha(0.85);

    // the middle of the page — plaques, strip, doors — rebuilds itself when
    // its truth changes; the 1s tick also redresses chips and the zenith star
    this.pendC = this.add.container(0, 0);
    this.refreshPend();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshPend() });

    this.events.once('shutdown', () => this.closeSocial());
    if (VSAUTO) this.time.delayedCall(600, () => this.match('turns'));
    if (FRDEMO === 'host' || FRDEMO === 'invite') this.time.delayedCall(800, () => this.frDemo());
  }
  // feedback lands where the eye is: on the sheet's own line while it is
  // open, on the page line otherwise (the whisper steps aside for a note)
  note(s, ms) {
    const t = (this.socialC && this.shNoteT && this.shNoteT.active) ? this.shNoteT : this.noteT;
    if (!t || !t.active) return;
    t.setText(s || '');
    if (t === this.noteT && this.whisperT && this.whisperT.active) this.whisperT.setVisible(!s && !!this.whisperT.text);
    if (this.noteTimer) { this.noteTimer.remove(false); this.noteTimer = null; }
    if (s && ms) this.noteTimer = this.time.delayedCall(ms, () => {
      if (t.active) t.setText('');
      if (t === this.noteT && this.whisperT && this.whisperT.active) this.whisperT.setVisible(!!this.whisperT.text);
    });
  }

  /* ---------- the social sheet (v0.73.0) ----------
     CHALLENGE A FRIEND opens this over the page: the friends roll live from
     SSNET.FR (presence dot, the drawn crossed-blades glyph + CHALLENGE on
     EVERY row — an away friend takes a standing summons, a busy one a
     waiting bell, exactly the by-name manners), the recent rivals beneath
     (AGAIN + befriend, the circle answering through the engine), a + by the
     heading that adds a friend by their unique STARSPELL name, and — pinned
     at the very bottom — the invite that sends a NEW friend the app itself. */
  openSocial() {
    if (this.socialC || this.busyC) return;
    if (SSNET.mode !== 'firebase') { this.note(SS_T('vsNoSky'), 3000); return; }
    const l = ssLayout(this);
    const c = this.socialC = this.add.container(0, 0).setDepth(600);
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.62).setInteractive();
    veil.on('pointerdown', () => this.closeSocial());
    const PH = 380, top = this.shTop = 400 - PH / 2;
    c.add(veil);
    c.add(this.add.image(l.x(0), l.y(400), 'endpanel').setDisplaySize(l.u(372), l.u(PH)));
    const head = ssTxt(this, l.x(0), l.y(top + 26), SS_T('vsFriends'), l.u(12), '#c9b676').setOrigin(0.5);
    // + — add a friend by their unique name, right next to FRIENDS
    const addB = this.add.image(l.x(0) + head.width / 2 + l.u(26), l.y(top + 26), ssBtn(this, true, 34, 26))
      .setDisplaySize(l.u(34), l.u(26)).setInteractive({ useHandCursor: true });
    const addT = ssTxt(this, 0, l.y(top + 26) - l.u(1), '+', l.u(15), '#9fb0e8').setOrigin(0.5).setX(addB.x);
    addB.on('pointerdown', () => { SFX.ui(); this.addPrompt(l); });
    this.addB = addB;
    const xb = ssTxt(this, l.x(166), l.y(top + 26), '✕', l.u(14), '#8a94c4').setOrigin(0.5).setInteractive({ useHandCursor: true });
    xb.on('pointerdown', () => { SFX.ui(); this.closeSocial(); });
    c.add([head, addB, addT, xb]);
    this.frC = this.add.container(0, 0);
    c.add(this.frC);
    // pinned at the sheet's foot: invite a NEW friend to challenge — the
    // share carries the STARSPELL app link (VS_APP_URL), never a web page.
    // pointerUP law: iOS grants share/clipboard only inside a user activation.
    const invB = this.add.image(l.x(0), l.y(top + PH - 44), ssBtn(this, false, 320, 54)).setDisplaySize(l.u(320), l.u(54)).setInteractive({ useHandCursor: true });
    const invT = ssTxt(this, l.x(0), l.y(top + PH - 53), SS_T('vsInviteNew'), l.u(13.5), BTN_INK()).setOrigin(0.5);
    for (let fs = 13.5; invT.width > l.u(296) && fs > 9; fs -= 0.5) invT.setFontSize(l.u(fs));
    const invS = ssTxt(this, l.x(0), l.y(top + PH - 33), SS_T('vsInviteNewSub'), l.u(9), BTN_INK2(), 'italic').setOrigin(0.5);
    for (let fs = 9; invS.width > l.u(300) && fs > 7; fs -= 0.5) invS.setFontSize(l.u(fs));
    vsOnTap(invB, () => { SFX.ensure(); SFX.ui(); this.inviteNew(); });
    this.invB = invB;
    c.add([invB, invT, invS]);
    this.shNoteT = ssTextBlock(this, l.x(0), l.y(top + PH + 22), '', {
      fontSize: l.u(10.5) + 'px', color: '#c9b676', fontStyle: 'italic', shadow: true,
      wrapW: l.u(340), align: 'center', ox: 0.5, oy: 0.5,
    });
    c.add(this.shNoteT);
    this.refreshFriends();
    this.frOff = SSNET.FR.on(() => this.refreshFriends());
    // "seen 2h ago" and online dots age while the sheet sits open
    this.frTimer = this.time.addEvent({ delay: 15000, loop: true, callback: () => this.refreshFriends() });
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 180 });
  }
  closeSocial() {
    if (this.frOff) { this.frOff(); this.frOff = null; }
    if (this.frTimer) { this.frTimer.remove(false); this.frTimer = null; }
    if (this.socialC) { const c = this.socialC; this.socialC = null; c.destroy(); }
    this.frC = null; this.shNoteT = null; this.recentRows = null; this.frRows = null;
  }
  refreshFriends() {
    if (!this.socialC || !this.frC || !this.frC.scene) return;
    const l = ssLayout(this), top = this.shTop, FR = SSNET.FR;
    this.frC.removeAll(true);
    const items = [];
    const friends = FR.list();
    const ROWS = 3, rowY = (i) => l.y(top + 62 + i * 38);
    this.frRows = [];
    if (!friends.length) {
      items.push(ssTextBlock(this, l.x(0), l.y(top + 100), SS_T('vsNoFriends'), {
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
      while (nm.width > l.u(118) && nm.text.length > 2) nm.setText(nm.text.slice(0, -2) + '…');
      ssHitPad(nm, 30);
      nm.on('pointerdown', () => ssRatingCard(this, { uid: f.id, name: f.name }));
      items.push(nm);
      const p = FR.presence[f.id];
      const status = f.online ? (f.busy ? SS_T('vsInDuel') : SS_T('vsOnline'))
        : (p && p.at ? SS_T('vsSeen', vsAgo(Date.now() - p.at)) : SS_T('vsOffline'));
      items.push(ssTxt(this, l.x(-146), y + l.u(9), status, l.u(9), f.online ? (f.busy ? '#e8a87f' : '#7fe0a0') : '#5a6390', 'italic').setOrigin(0, 0.5));
      // every friend row carries the challenge (Skylar 9/2): the drawn glyph
      // + the button. Ready = gold; away or mid-duel = the dark dress, and
      // the tap lands the standing summons the by-name door already speaks.
      const ready = f.online && !f.busy;
      const glyph = this.add.image(l.x(36), y, vsSwordsTex(this)).setDisplaySize(l.u(20), l.u(20)).setAlpha(ready ? 1 : 0.55);
      items.push(glyph);
      const cb = this.add.image(l.x(102), y, ssBtn(this, !ready, 96, 30)).setDisplaySize(l.u(96), l.u(30)).setInteractive({ useHandCursor: true });
      ssHitPad(cb, 30);
      const ct = ssTxt(this, l.x(102), y, SS_T('vsChallenge'), l.u(10), ready ? BTN_INK() : '#9fb0e8').setOrigin(0.5);
      for (let fs = 10; ct.width > l.u(88) && fs > 7; fs -= 0.5) ct.setFontSize(l.u(fs));
      cb.on('pointerdown', () => { SFX.ensure(); SFX.ui(); this.challenge({ id: f.id, name: f.name, away: !f.online, busy: f.online && f.busy }); });
      items.push(cb, ct);
      const rm = ssTxt(this, l.x(176), y, '✕', l.u(11), '#39406b').setOrigin(0.5).setInteractive({ useHandCursor: true });
      ssHitPad(rm, 30);
      rm.on('pointerdown', () => { SFX.ui(); FR.remove(f.id); });
      items.push(rm);
      this.frRows.push({ id: f.id, name: f.name, cb, ct, glyph, rm, nameT: nm, online: f.online, busy: f.busy });
    });
    if (friends.length > ROWS) {
      items.push(ssTxt(this, l.x(0), rowY(ROWS - 1), SS_T('vsMore', friends.length - shown.length), l.u(10.5), '#5a6390', 'italic').setOrigin(0.5));
    }
    /* ---------- RECENT (task 44) ----------
       The last handful of mages you crossed swords with, newest first —
       name, how long ago (coarse: tonight / last night / N nights ago), the
       same presence glint the friends roll wears. One tap on the row → the
       same challenge path a friend CHALLENGE / BY NAME rides: online = a live
       summons, away = a standing invite (the lobby says so); a mage of THE
       CIRCLE answers through the rival engine. A first-night player sees one
       quiet line. `+` befriends without a duel. */
    items.push(ssTxt(this, l.x(0), l.y(top + 170), SS_T('vsRecentHead'), l.u(10.5), '#c9b676').setOrigin(0.5));
    const recent = FR.recentList(3);
    this.recentRows = [];
    if (!recent.length) {
      items.push(ssTextBlock(this, l.x(0), l.y(top + 228), SS_T('vsNoRecent'), {
        fontSize: l.u(11) + 'px', color: '#5a6390', fontStyle: 'italic', shadow: true,
        wrapW: l.u(320), align: 'center', ox: 0.5, oy: 0.5,
      }));
    }
    const circle = (typeof SS_RIVAL !== 'undefined') ? SS_RIVAL.circle() : [];
    recent.forEach((r, i) => {
      const y = l.y(top + 196 + i * 32);
      const ofCircle = circle.some((c) => c.uid === r.id);
      const lit = r.online || ofCircle;   // a mage of the circle always answers — it glints ready
      const dot = this.add.circle(l.x(-160), y, l.u(4), lit ? (r.busy ? 0xe8a87f : 0x7fe0a0) : 0x39406b);
      if (lit && !r.busy) {
        dot.setStrokeStyle(l.u(1), 0xbfffd8, 0.6);
        this.tweens.add({ targets: dot, alpha: 0.45, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      items.push(dot);
      const nm = ssTxt(this, l.x(-146), y, r.name, l.u(12), lit ? '#f0e8d2' : '#a9a99a').setOrigin(0, 0.5);
      while (nm.width > l.u(118) && nm.text.length > 2) nm.setText(nm.text.slice(0, -2) + '…');
      items.push(nm);
      const ago = ssTxt(this, l.x(-22), y, vsNightsAgo(Date.now() - r.at), l.u(9), '#5a6390', 'italic').setOrigin(0, 0.5);
      while (ago.width > l.u(78) && ago.text.length > 3) ago.setText(ago.text.slice(0, -2) + '…');
      items.push(ago);
      // the whole row is the door; the small gold AGAIN says so
      const ab = this.add.image(l.x(112), y, ssBtn(this, false, 76, 24)).setDisplaySize(l.u(76), l.u(24)).setInteractive({ useHandCursor: true });
      ssHitPad(ab, 30);
      const at = ssTxt(this, l.x(112), y, SS_T('vsAgain'), l.u(9.5), BTN_INK()).setOrigin(0.5);
      for (let fs = 9.5; at.width > l.u(70) && fs > 7; fs -= 0.5) at.setFontSize(l.u(fs));
      const go = () => { SFX.ensure(); SFX.ui(); this.rematch(r, ofCircle); };
      ab.on('pointerdown', go);
      const zone = this.add.zone(l.x(-30), y, l.u(280), l.u(28)).setOrigin(0.5).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', go);
      items.push(zone, ab, at);
      if (!r.friend) {
        const add = ssTxt(this, l.x(176), y, '+', l.u(14), '#9fb0e8').setOrigin(0.5).setInteractive({ useHandCursor: true });
        ssHitPad(add, 30);
        add.on('pointerdown', () => { SFX.ui(); add.setColor('#5a6390'); FR.add(r.id, r.name).then(() => vsNotify(SS_T('frAdded', r.name))); });
        items.push(add);
      }
      this.recentRows.push({ id: r.id, name: r.name, row: zone, again: ab, nameT: nm, agoT: ago, circle: ofCircle });
    });
    this.frC.add(items);
  }
  // + on the sheet: add a friend by their unique STARSPELL name. The registry
  // resolves it (case and spacing fold through nameKey), FR.add writes both
  // sides, and the roll repaints itself through the FR listener. The by-name
  // manners hold: an honest miss re-offers what was typed, yourself is
  // refused gently.
  addPrompt(l, prefill) {
    if (this.busyC) return;
    SFX.ui();
    const inp = document.createElement('input');
    inp.type = 'text'; inp.maxLength = 24; inp.placeholder = SS_T('vsNamePh');
    inp.setAttribute('autocapitalize', 'words'); inp.setAttribute('autocorrect', 'off');
    inp.setAttribute('autocomplete', 'off'); inp.setAttribute('enterkeyhint', 'go'); inp.spellcheck = false;
    inp.value = prefill != null ? prefill : '';
    inp.style.cssText = 'position:fixed;left:50%;top:30%;transform:translateX(-50%);z-index:9999;font:700 ' +
      Math.round(l.u(20)) + 'px Georgia,serif;text-align:center;background:#141a33;color:#f3e5b4;border:2px solid #c9a94f;border-radius:10px;padding:10px 14px;outline:none;width:70%;max-width:320px;';
    // no commitOnShutdown: leaving the menu mid-type must not add anyone
    ssDomInput(this, inp, (v) => this.seekAdd(v, l));
    if (inp.value) inp.select();
  }
  async seekAdd(v, l) {
    const typed = String(v || '').trim().replace(/\s+/g, ' ');
    if (!typed || !this.sys.isActive() || this.busyC || !this.socialC) return;
    if (SSNET.nameKey(typed) === SSNET.nameKey(vsName())) { this.note(SS_T('vsAddSelf'), 3500); return; }
    this.busyC = true;
    this.note(SS_T('vsNameSeek', typed));
    let hit = null;
    try { hit = await SSNET.findByName(typed); } catch (e) { hit = null; }
    if (!this.sys.isActive()) return;
    this.busyC = false;
    if (hit && hit.uid === vsUid()) { this.note(SS_T('vsAddSelf'), 3500); return; }
    if (!hit) {
      // an honest miss — and the field comes back holding what they typed
      this.note(SS_T('vsNameNone', typed), 4000);
      if (this.socialC) this.addPrompt(l, typed);
      return;
    }
    const ok = await SSNET.FR.add(hit.uid, hit.name);
    if (!this.sys.isActive()) return;
    this.note(ok ? SS_T('frAdded', hit.name) : SS_T('vsRefused'), 3000);
  }
  // the pinned invite: a NEW friend gets the STARSPELL app itself (VS_APP_URL
  // — the TestFlight door today), never a drbango.com page. The share names
  // the sender twice over so the new mage can add them by name after install.
  inviteNew() {
    vsShare(SS_T('vsAppText', vsName(), vsName()), VS_APP_URL).then((r) => {
      if (r === 'copied') this.note(SS_T('vsCopied'), 2500);
      else if (r === 'failed') this.note(SS_T('vsShareFail'), 2500);
    });
  }

  /* ---------- THE DUELISTS (the review's hero, option A ★) ----------
     Two faceless mage asterisms — yours gold, the rival's moon-blue —
     reaching for one shared zenith star: the duel's own fiction (both
     players rise through one seeded sky) drawn in the game's native art
     form, pure chart data through the shipped beast renderer. The stars
     fly in on the session's first visit and stand assembled after;
     reduced motion (and the offline page) skips every flight. The star
     flares while a summons stands — the sky announcing the challenge. */
  buildHero(l, dim) {
    const still = dim || ssReduceMotion();
    const fly = !still && !window.__ssVsHeroSeen;
    window.__ssVsHeroSeen = 1;
    this.heroFly = fly;   // verification beacon: did this visit fly the stars in?
    const mk = (x, mirror, tint) => {
      const cont = this.add.container(l.x(x), l.y(212));
      if (mirror) cont.setScale(-1, 1);
      if (dim) cont.setAlpha(0.45);
      vsMageFigure(this, cont, tint, l.u(1.5), { fly, still });
      return cont;
    };
    this.heroL = mk(-24, false, 0xd7b45c);   // yours, gold
    this.heroR = mk(24, true, 0x9fb0e8);     // the rival's, moon-blue
    const zx = l.x(0), zy = l.y(128);
    if (dim) { this.zenith = this.add.image(zx, zy, 'dot').setScale(1.1).setTint(0x4a5480); return; }
    this.zenithHalo = this.add.image(zx, zy, 'glowbig').setScale(l.u(0.5)).setTint(0xffe9c9).setAlpha(0.13).setBlendMode('ADD');
    this.zenith = this.add.image(zx, zy, 'spark4').setDisplaySize(l.u(24), l.u(24)).setTint(0xfff2c9).setBlendMode('ADD');
    if (!still) {
      this.tweens.add({ targets: this.zenith, angle: 360, duration: 64000, repeat: -1 });
      this.zenBreath = this.tweens.add({ targets: this.zenithHalo, alpha: 0.08, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  /* ---------- the middle of the page ----------
     One truth for every standing duel (9/8 card 04): vsGameRows() —
     summonses, near duels AND live-sky correspondence, calls first — now
     promoted from quiet text to seal-plaques (the review's band), with an
     incoming challenge landing as a gold ACCEPT plate, cap pips on the band
     head, the presence strip beneath, and the doors on the meadow. The band
     rebuilds only when its truth changes; chips rank once per page open and
     are only ever REDRESSED by the tick, never reordered. */
  refreshPend() {
    if (!this.pendC || !this.pendC.scene) return;
    // a friend answered while this page stood: step into the duel at once
    const live = VS_PEND.list().find((p) => p.active);
    if (live) { VS_PEND.remove(live.code); this.scene.start('vsbattle', { code: live.code }); return; }
    const sums = (SSNET.FR.pending() || []).map((inv) => ({ kind: 'sum', code: inv.code, name: inv.name || SSNET.FR.nameOf(inv.from), inv }));
    const games = vsGameRows().filter((g) => !sums.some((s) => s.code === g.code));
    const rows = [...sums, ...games];
    const funnel = !rows.length && !SSNET.FR.list().length && !SSNET.FR.recentList(1).length;
    const key = JSON.stringify([funnel ? 'f' : 'd', vsOngoingCount(), rows.map((r) => r.kind + r.code + r.name)]);
    if (key !== this.pendKey) { this.pendKey = key; this.buildBand(rows, funnel); }
    this.tickDress();
  }
  buildBand(rows, funnel) {
    const l = ssLayout(this);
    this.pendC.removeAll(true);
    this.pendRows = [];
    if (this.doorsMode !== (funnel ? 'funnel' : 'duels')) this.buildDoors(funnel);
    if (funnel) { if (this.stripC) this.stripC.setVisible(false); this.setWhisper(false); return; }
    // the plaques — up to four; a fifth folds into the shipped '+%1 more'
    const shown = rows.length > 4 ? rows.slice(0, 3) : rows;
    let items = [];
    if (rows.length) {
      // the band head + five cap pips: one lit per standing duel, so the
      // five-duel law teaches itself before the cap sheet ever scolds
      const head = ssTxt(this, l.x(0), l.y(306), SS_T('vsDuelsHead'), l.u(10.5), '#c9b676').setOrigin(0.5);
      items.push(head);
      const lit = Math.min(5, vsOngoingCount());
      this.capPips = [];
      for (let i = 0; i < 5; i++) {
        const p = this.add.circle(l.x(0) + head.width / 2 + l.u(14 + i * 9), l.y(306), l.u(2.2), i < lit ? 0xffd77a : 0x39406b);
        this.capPips.push(p); items.push(p);
      }
    }
    shown.forEach((r, i) => { items = items.concat(this.plaque(l, r, 336 + i * 58)); });
    if (rows.length > 4) items.push(ssTxt(this, l.x(0), l.y(336 + 3 * 58 - 8), SS_T('vsMore', rows.length - 3), l.u(10.5), '#5a6390', 'italic').setOrigin(0.5));
    this.pendC.add(items);
    // the strip rides under the plaques and folds (head off) when four rows
    // stand — it never vanishes: the players who duel most keep their rematch
    const rowsEnd = rows.length ? 336 + (Math.min(shown.length, 4) - (rows.length > 4 ? 0 : 1)) * 58 + 29 : 306;
    if (!this.stripC) this.buildStrip(l);
    if (this.stripC) {
      const fold = (rows.length > 4 ? 4 : shown.length) >= 4;
      if (this.stripHeadT) this.stripHeadT.setVisible(!fold);
      this.stripC.setVisible(true);
      this.stripC.y = l.y(fold ? rowsEnd + 10 : rowsEnd + 10) - (fold ? l.u(26) : 0);
    }
    this.setWhisper(true);
  }
  // the record whisper: only with a number to say, never over a live note
  setWhisper(onPage) {
    if (!this.whisperT || !this.whisperT.active) return;
    const n = SS.prof.vsWins | 0;
    this.whisperT.setText(onPage && n > 0 ? SS_T('vsVict', n) : '');
    this.whisperT.setVisible(!!this.whisperT.text && !(this.noteT && this.noteT.active && this.noteT.text));
  }
  /* one seal-plaque: nine-slice dark panel, drawn-blades glyph, the rival's
     name over the shipped status fiction, the affair's own doors at the
     right. A your-move plaque (and the summons plate) wears the pre-baked
     breathing gold rim — alpha tween only, never a per-frame stroke. */
  plaque(l, r, yD) {
    const y = l.y(yD);
    const items = [];
    items.push(this.add.image(l.x(0), y, ssBtn(this, true, 344, 50)).setDisplaySize(l.u(344), l.u(50)));
    if (r.kind === 'move' || r.kind === 'sum') {
      const rim = this.add.image(l.x(0), y, vsPlaqRimTex(this)).setDisplaySize(l.u(344), l.u(50));
      this.tweens.add({ targets: rim, alpha: { from: r.kind === 'sum' ? 0.95 : 0.9, to: 0.45 }, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      items.push(rim);
    }
    items.push(this.add.image(l.x(-150), y, vsSwordsTex(this)).setDisplaySize(l.u(18), l.u(18)).setAlpha(r.kind === 'move' || r.kind === 'sum' ? 1 : 0.6));
    const nm = ssTxt(this, l.x(-132), y - l.u(8), r.name, l.u(12), r.kind === 'move' || r.kind === 'sum' ? '#ffe9a8' : '#d8d2bd').setOrigin(0, 0.5);
    while (nm.width > l.u(150) && nm.text.length > 2) nm.setText(nm.text.slice(0, -2) + '…');
    items.push(nm);
    const status = r.kind === 'sum' ? SS_T('vsSumRow')
      : r.kind === 'move' ? SS_T('vsYourMove') : r.kind === 'theirs' ? SS_T('vsTheirMove', r.name)
        : r.kind === 'done' ? SS_T('vsPendDone')
          : r.kind === 'declined' ? SS_T('vsDeclined', r.name)
            : SS_T(r.p && r.p.away ? 'vsWaitAway' : r.p && r.p.busy ? 'vsWaitBusy' : 'vsWaitAnswer', r.name);
    const st = ssTxt(this, l.x(-132), y + l.u(9), status, l.u(8.5),
      r.kind === 'move' || r.kind === 'sum' ? '#ffd77a' : r.kind === 'declined' ? '#e8a87f' : '#8a94c4', 'italic').setOrigin(0, 0.5);
    while (st.width > l.u(r.kind === 'sum' ? 190 : 228) && st.text.length > 4) st.setText(st.text.slice(0, -2) + '…');
    items.push(st);
    const row = { kind: r.kind, code: r.code, name: r.name, nameT: nm, statusT: st };
    if (r.kind === 'sum') {
      // an incoming challenge lands HERE too (the review: young players miss
      // sliding banners; the plaque waits) — one tap, the same claim the
      // banner's ACCEPT makes
      const ab = this.add.image(l.x(122), y, ssBtn(this, false, 76, 30)).setDisplaySize(l.u(76), l.u(30)).setInteractive({ useHandCursor: true });
      ssHitPad(ab, 44);
      const at = ssTxt(this, l.x(122), y, SS_T('smAccept'), l.u(9.5), BTN_INK()).setOrigin(0.5);
      for (let fs = 9.5; at.width > l.u(68) && fs > 7; fs -= 0.5) at.setFontSize(l.u(fs));
      ab.on('pointerdown', () => { SFX.ensure(); SFX.ui(); this.acceptSummons(r.inv); });
      items.push(ab, at);
      row.accept = ab;
    } else if (r.kind === 'wait') {
      const sh = ssTxt(this, l.x(118), y, '✶', l.u(14), '#c9b676').setOrigin(0.5).setInteractive({ useHandCursor: true });
      ssHitPad(sh, 30);
      vsOnTap(sh, () => {
        SFX.ui();
        vsShare(SS_T('vsShareText', vsName()), vsInviteUrl(r.code)).then((res) => {
          if (res === 'copied') this.note(SS_T('vsCopied'), 2500);
          else if (res === 'failed') this.note(SS_T('vsCopyFail'), 2500);
        });
      });
      items.push(sh);
      row.share = sh;
    }
    if (r.kind === 'wait' || r.kind === 'declined') {
      const xb = ssTxt(this, l.x(154), y, '✕', l.u(13), '#8a94c4').setOrigin(0.5).setInteractive({ useHandCursor: true });
      ssHitPad(xb, 30);
      xb.on('pointerdown', () => { SFX.ui(); this.cancelPend(r); });
      items.push(xb);
      row.cancel = xb;
    } else if (r.kind !== 'sum') {
      items.push(ssTxt(this, l.x(124), y, '›', l.u(16), r.kind === 'move' ? '#ffd77a' : '#8a94c4').setOrigin(0.5));
      const zone = this.add.zone(l.x(-28), y, l.u(288), l.u(50)).setOrigin(0.5).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => { SFX.ensure(); SFX.ui(); this.scene.start('vsbattle', { code: r.code }); });
      items.push(zone);
      row.zone = zone;
      // an ongoing duel's way out (9/8 card 04): ✕ → the confirmed abandon
      // (a rated loss once words were exchanged; a decided duel just ends)
      if (r.kind !== 'done') {
        const ab = ssTxt(this, l.x(154), y, '✕', l.u(13), '#8a94c4').setOrigin(0.5).setInteractive({ useHandCursor: true });
        ssHitPad(ab, 30);
        ab.on('pointerdown', () => { SFX.ui(); vsAbandon(this, r, () => { this.pendKey = ''; this.refreshPend(); }); });
        items.push(ab);
        row.abandon = ab;
      }
    }
    this.pendRows.push(row);
    return items;
  }
  // the plaque's ACCEPT — the same claim the banner makes: join, light the
  // room, answer the bell, step in
  async acceptSummons(inv) {
    if (this.busyC) return;
    this.busyC = true;
    this.note(SS_T('smJoining'));
    let ok = false;
    try { ok = await vsJoinRoom(inv.code); } catch (e) { ok = false; }
    if (ok) await vsStartIfFull(inv.code);
    SSNET.FR.decline(inv.from);   // the bell is answered either way
    if (!this.sys.isActive()) return;
    this.busyC = false;
    if (!ok) { this.note(SS_T('smCold'), 3000); this.pendKey = ''; this.refreshPend(); return; }
    this.scene.start('vsbattle', { code: inv.code, joining: true });
  }
  cancelPend(r) {
    // one takeback for every unexchanged duel: the bell, the room (guarded
    // by its own txn — a claim landing this instant wins), the rows
    vsAbandonNow(r, null, false);
    this.pendKey = '';
    this.refreshPend();
  }
  /* ---------- the doors ----------
     The full ground keeps the two primaries, re-anchored to the true foot so
     the meadow always survives beneath them. A fresh device gets the funnel
     instead: no rivals yet, CHALLENGE WORLDWIDE promoted as the guaranteed
     door (the circle seats an opponent inside the search's own beat), the
     by-name add and the app invite beneath — empty of data, never an empty
     place. */
  buildDoors(funnel) {
    const l = ssLayout(this);
    this.doorsMode = funnel ? 'funnel' : 'duels';
    if (this.doorsC) { this.doorsC.destroy(); this.doorsC = null; }
    const c = this.doorsC = this.add.container(0, 0);
    this.chFriendB = null; this.chWorldB = null; this.addDoorB = null; this.invDoorB = null;
    const prim = (y, key, subKey, cb) => {
      const b = this.add.image(l.x(0), l.y(y), ssBtn(this, false, 320, 60)).setDisplaySize(l.u(320), l.u(60)).setInteractive({ useHandCursor: true });
      const t = ssTxt(this, l.x(0), l.y(y - 10), SS_T(key), l.u(17), BTN_INK()).setOrigin(0.5);
      for (let fs = 17; t.width > l.u(296) && fs > 11; fs -= 0.5) t.setFontSize(l.u(fs));
      const s = ssTxt(this, l.x(0), l.y(y + 12), SS_T(subKey), l.u(9.5), BTN_INK2(), 'italic').setOrigin(0.5);
      for (let fs = 9.5; s.width > l.u(300) && fs > 7; fs -= 0.5) s.setFontSize(l.u(fs));
      b.on('pointerdown', cb);
      c.add([b, t, s]);
      return b;
    };
    const dark = (y, key, subKey, cb, onUp) => {
      const b = this.add.image(l.x(0), l.y(y), ssBtn(this, true, 320, 56)).setDisplaySize(l.u(320), l.u(56)).setInteractive({ useHandCursor: true });
      const t = ssTxt(this, l.x(0), l.y(y - 9), SS_T(key), l.u(12.5), '#c9d0f0').setOrigin(0.5);
      for (let fs = 12.5; t.width > l.u(296) && fs > 9; fs -= 0.5) t.setFontSize(l.u(fs));
      const s = ssTxt(this, l.x(0), l.y(y + 11), SS_T(subKey), l.u(8.5), '#5a6390', 'italic').setOrigin(0.5);
      for (let fs = 8.5; s.width > l.u(300) && fs > 7; fs -= 0.5) s.setFontSize(l.u(fs));
      if (onUp) vsOnTap(b, cb); else b.on('pointerdown', cb);
      c.add([b, t, s]);
      return b;
    };
    if (funnel) {
      const fic = ssTextBlock(this, l.x(0), l.y(330), SS_T('vsNoRecent'), {
        fontSize: l.u(11) + 'px', color: '#5a6390', fontStyle: 'italic', shadow: true,
        wrapW: l.u(320), align: 'center', ox: 0.5, oy: 0.5,
      });
      c.add(fic);
      this.chWorldB = prim(414, 'vsChWorld', 'vsChWorldSub', () => { SFX.ensure(); SFX.ui(); this.match('turns'); });
      this.addDoorB = dark(488, 'vsAddFriend', 'vsAddFriendSub', () => {
        SFX.ensure(); SFX.ui();
        // the by-name door opens the sheet AND the name field — after the
        // add, the new friend stands on the roll behind the prompt
        this.openSocial();
        if (this.socialC) this.addPrompt(l);
      });
      // the share must fire on pointerUP (iOS user-activation law)
      this.invDoorB = dark(562, 'vsInviteNew', 'vsInviteNewSub', () => { SFX.ensure(); SFX.ui(); this.inviteNew(); }, true);
    } else {
      const safeB = this.safeB;
      this.chFriendB = prim(safeB - 158, 'vsChFriend', 'vsChFriendSub', () => { SFX.ensure(); SFX.ui(); this.openSocial(); });
      this.chWorldB = prim(safeB - 90, 'vsChWorld', 'vsChWorldSub', () => { SFX.ensure(); SFX.ui(); this.match('turns'); });
    }
  }
  /* ---------- UNDER THIS SKY TONIGHT — the presence strip ----------
     Up to two pill chips + › ALL MAGES: friends online first (green pulse),
     then recent rivals with the night-clock, then mages of the circle — who
     glint ready but are NEVER labeled online (their quiet-player fiction
     holds). Every action is dressed as a button (gold = a live duel starts
     now, dark = a summons will wait) and routes through the same cap gate as
     the doors. Ranked once per page open; the tick only redresses. */
  buildStrip(l) {
    const FR = SSNET.FR;
    const circle = (typeof SS_RIVAL !== 'undefined') ? SS_RIVAL.circle() : [];
    const inCircle = (id) => circle.some((p) => p.uid === id);
    const picks = []; const seen = new Set();
    for (const f of FR.list()) { if (picks.length >= 2) break; if (f.online && !seen.has(f.id)) { picks.push({ kind: 'friend', id: f.id, name: f.name }); seen.add(f.id); } }
    for (const r of FR.recentList(6)) { if (picks.length >= 2) break; if (!seen.has(r.id)) { picks.push({ kind: 'recent', id: r.id, name: r.name, at: r.at, circle: inCircle(r.id) }); seen.add(r.id); } }
    for (const p of circle) { if (picks.length >= 2) break; if (!seen.has(p.uid)) { picks.push({ kind: 'circle', id: p.uid, name: p.name, circle: true }); seen.add(p.uid); } }
    if (!picks.length) return;   // nothing under this sky tonight — no strip
    const c = this.stripC = this.add.container(0, 0);
    this.stripHeadT = ssTxt(this, l.x(0), 0, SS_T('vsTonight'), l.u(9.5), '#8a94c4', 'italic').setOrigin(0.5);
    c.add(this.stripHeadT);
    this.chipRows = [];
    const widths = picks.map(() => 118).concat([96]);
    const total = widths.reduce((a, w) => a + w + 8, -8);
    let cx = -total / 2;
    picks.forEach((p, i) => {
      const x = l.x(cx + 59); cx += 126;
      const pill = this.add.image(x, l.u(26), ssBtn(this, true, 118, 36)).setDisplaySize(l.u(118), l.u(36)).setInteractive({ useHandCursor: true });
      ssHitPad(pill, 44);
      const dot = this.add.circle(x - l.u(45), l.u(26), l.u(4), 0x39406b);
      const nm = ssTxt(this, x - l.u(36), l.u(26) - l.u(7), p.name, l.u(9), '#f0e8d2').setOrigin(0, 0.5);
      while (nm.width > l.u(44) && nm.text.length > 2) nm.setText(nm.text.slice(0, -2) + '…');
      const sub = ssTxt(this, x - l.u(36), l.u(26) + l.u(7), '', l.u(7), '#5a6390', 'italic').setOrigin(0, 0.5);
      const tagB = this.add.image(x + l.u(36), l.u(26), ssBtn(this, true, 48, 20)).setDisplaySize(l.u(48), l.u(20));
      const tagT = ssTxt(this, x + l.u(36), l.u(26), '', l.u(7.5), '#8a94c4').setOrigin(0.5);
      c.add([pill, dot, nm, sub, tagB, tagT]);
      const row = { kind: p.kind, id: p.id, name: p.name, at: p.at || 0, circle: !!p.circle, pill, dot, nameT: nm, subT: sub, tagB, tagT, pulse: null, lit: null };
      pill.on('pointerdown', () => {
        SFX.ensure(); SFX.ui();
        if (row.kind === 'friend') this.challenge({ id: row.id, name: row.name, away: !SSNET.FR.isOnline(row.id), busy: SSNET.FR.isOnline(row.id) && SSNET.FR.isBusy(row.id) });
        else this.rematch({ id: row.id, name: row.name }, row.circle);
      });
      this.chipRows.push(row);
    });
    const allB = this.add.image(l.x(cx + 48), l.u(26), ssBtn(this, true, 96, 36)).setDisplaySize(l.u(96), l.u(36)).setInteractive({ useHandCursor: true });
    ssHitPad(allB, 44);
    const allT = ssTxt(this, allB.x, l.u(26), SS_T('vsAllMages'), l.u(8.5), '#9fb0e8').setOrigin(0.5);
    for (let fs = 8.5; allT.width > l.u(86) && fs > 6.5; fs -= 0.5) allT.setFontSize(l.u(fs));
    allB.on('pointerdown', () => { SFX.ensure(); SFX.ui(); this.openSocial(); });
    c.add([allB, allT]);
    this.allMagesB = allB;
    this.dressChips();
  }
  // the 1-second redress: dots recolor, words refresh, the zenith star
  // flares while a summons stands — nothing ever reorders under a finger
  dressChips() {
    if (!this.chipRows) return;
    const l0 = ssLayout(this);
    const FR = SSNET.FR;
    const pend = FR.pending() || [];
    for (const r of this.chipRows) {
      if (!r.dot.active) continue;
      const online = FR.isOnline(r.id), busy = FR.isBusy(r.id);
      // a circle mage glints ready, and is never labeled online (the law)
      const lit = r.circle ? 'circle' : online ? (busy ? 'busy' : 'on') : 'off';
      const called = pend.some((inv) => inv.from === r.id);
      const state = lit + (called ? '!' : '');
      if (state !== r.lit) {
        r.lit = state;
        if (r.pulse) { r.pulse.stop(); r.pulse = null; }
        r.dot.setAlpha(1);
        r.dot.setFillStyle(called ? 0xffd77a : r.circle ? 0xffd77a : online ? (busy ? 0xe8a87f : 0x7fe0a0) : 0x39406b);
        if (r.circle || (online && !busy) || called) {
          r.pulse = this.tweens.add({ targets: r.dot, alpha: 0.45, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        const gold = r.circle || (online && !busy);
        r.tagB.setTexture(ssBtn(this, !gold, 48, 20));
        r.tagT.setText(SS_T(r.kind === 'recent' ? 'vsAgain' : 'vsDuelTag')).setColor(gold ? BTN_INK() : '#8a94c4');
        for (let fs = 7.5; r.tagT.width > l0.u(44) && fs > 5.5; fs -= 0.5) r.tagT.setFontSize(l0.u(fs));
      }
      const sub = r.kind === 'friend' ? (online ? (busy ? SS_T('vsInDuel') : SS_T('vsOnline')) : SS_T('vsOffline'))
        : r.kind === 'recent' ? vsNightsAgo(Date.now() - r.at) : '';
      if (r.subT.active && r.subT.text !== sub) {
        r.subT.setText(sub);
        while (r.subT.width > l0.u(44) && r.subT.text.length > 3) r.subT.setText(r.subT.text.slice(0, -2) + '…');
      }
    }
  }
  tickDress() {
    this.dressChips();
    // the zenith star flares while a summons stands — the sky announcing it
    const want = (SSNET.FR.pending() || []).length ? 1 : 0;
    if (want !== this.zenFlare && this.zenith && this.zenith.active && this.zenithHalo) {
      this.zenFlare = want;
      const l = ssLayout(this);
      if (this.zenBreath) { this.zenBreath.stop(); this.zenBreath = null; }
      this.zenithHalo.setAlpha(want ? 0.3 : 0.13);
      this.zenith.setDisplaySize(l.u(want ? 34 : 24), l.u(want ? 34 : 24));
      if (!ssReduceMotion()) {
        this.zenBreath = this.tweens.add({ targets: this.zenithHalo, alpha: want ? 0.16 : 0.08, duration: want ? 900 : 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }
  }

  /* ---------- the challenge doors ---------- */
  // a RECENT row tapped: the same challenge a friend CHALLENGE / BY NAME rides.
  // A mage of the circle has no phone to ring — the room is sealed the same
  // way and the rival engine seats them in it (they answer, as they answer
  // rematches), so the tap lands a live duel, never a dead invite
  rematch(r, ofCircle) {
    const FR = SSNET.FR;
    const p = ofCircle ? SS_RIVAL.circle().find((c) => c.uid === r.id) : null;
    if (p) { this.challenge({ id: p.uid, name: p.name, circle: p }); return; }
    this.challenge({ id: r.id, name: r.name, away: !FR.isOnline(r.id), busy: FR.isOnline(r.id) && FR.isBusy(r.id) });
  }
  async challenge(f) {
    if (this.busyC) return;
    if (vsCapSheet(this)) return;   // five duels stand — the way through is finish or abandon
    this.busyC = true;
    this.note(SS_T('vsConsult'));
    try {
      const conn = await SSNET.connect();
      if (conn !== 'firebase') { this.note(SS_T('vsNoSky'), 3000); this.busyC = false; return; }
      const code = vsCode();
      // a mage of the circle answers in moments — that duel is lived, not
      // pended: enter, and the engine seats them (the arcade-paced AGAIN)
      if (f.circle) {
        const ok = await vsSealRoom(code, 'turns', { private: true, invited: f.id });
        if (!ok || !this.sys.isActive()) { this.note(SS_T('vsRefused'), 3000); this.busyC = false; return; }
        this.scene.start('vsbattle', { code, challenged: { id: f.id, name: f.name, circle: f.circle } });
        return;
      }
      // CORRESPONDENCE (9/8 card 04): the challenge seals the duel ACTIVE
      // with the friend's seat held, and the challenger steps straight in to
      // weave their first three — the friend answers whenever they open the
      // app. The summons row + roaming watcher carry the wait exactly as
      // before; the bell rings them, the ?join link still lands them here.
      const ok = await vsSealRoom(code, 'turns', { private: true, invited: f.id, hold: { id: f.id, name: f.name } });
      if (!ok || !this.sys.isActive()) { this.note(SS_T('vsRefused'), 3000); this.busyC = false; return; }
      // the one I challenged is a recent rival from this moment — I weave and
      // leave before they claim, so beginBattle (which skips the held seat)
      // never notes them; do it here so the RECENT roll remembers the summons
      SSNET.FR.noteRival(f.id, f.name);
      await SSNET.FR.challenge(f.id, code, 'turns');
      if (!this.sys.isActive()) return;
      VS_PEND.add({ code, to: { id: f.id, name: f.name }, away: !!f.away, busy: !!f.busy, at: Date.now(), rung: Date.now() });
      this.scene.start('vsbattle', { code, challenged: { id: f.id, name: f.name, away: !!f.away, busy: !!f.busy } });
    } catch (e) { this.note(SS_T('vsRefused'), 3000); this.busyC = false; }
  }
  // ?frdemo=invite: seal a private room and stand in its lobby — the deep-link
  // recipe (the lobby's own ✶ SHARE INVITE LINK button carries the ?join link)
  sealLobby() {
    if (this.busyC || SSNET.mode !== 'firebase') { if (SSNET.mode !== 'firebase') this.note(SS_T('vsNoSky'), 3000); return; }
    this.busyC = true;
    const code = vsCode();
    vsSealRoom(code, 'turns', { private: true }).then((ok) => {
      if (!this.sys.isActive()) return;
      if (!ok) { this.note(SS_T('vsRefused'), 3000); this.busyC = false; return; }
      this.scene.start('vsbattle', { code });
    });
  }
  async match(mode) {
    if (this.busyC) return;
    if (vsCapSheet(this)) return;   // the worldwide door respects the five too
    this.busyC = true;
    this.note(SS_T('vsConsult'));
    // the searching theater's clock starts at the tap — the whole hunt
    // (reads, joins, the quiet sky) plays out under one rolled 8–15s beat.
    // ?vsfind=MS pins the roll for the harnesses (the ?ride=0 pattern).
    const pin = parseInt(QS.get('vsfind'), 10);
    const theater = { t0: Date.now(), T: Number.isFinite(pin) ? Math.max(1200, pin) : Math.round(VS_FB.T_MIN + Math.random() * VS_FB.T_SPREAD) };
    const conn = await SSNET.connect();
    if (conn !== 'firebase') { this.note(SS_T('vsNoSky')); this.busyC = false; return; }
    const code = await vsQuickMatch(mode);
    if (!this.sys.isActive()) return;
    if (code) this.scene.start('vsbattle', { code, theater });
    else { this.note(SS_T('vsRefused'), 3000); this.busyC = false; }
  }
  /* ---------- test recipes (?frdemo=) ----------
     host:   befriend test_b, wait for them online, CHALLENGE (their tab runs
             ?frdemo=guest and auto-accepts the summons)
     invite: sealLobby → private lobby; a third tab boots with
             ?join=<code>&from=test_a to prove the deep link */
  async frDemo() {
    await SSNET.connect();
    if (!this.sys.isActive()) return;
    if (FRDEMO === 'invite') { this.sealLobby(); return; }
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

// the RECENT roll's coarse clock: "tonight" / "last night" / "3 nights ago"
// — a duel is an evening's thing, so it is counted in nights, and the night
// boundary is local noon-to-noon (a 1 a.m. duel is still "tonight" at 3 a.m.)
function vsNightsAgo(ms) {
  if (!(ms > 0)) return SS_T('vsAgoTonight');
  const night = (t) => Math.floor((t - 12 * 3600000 - new Date(t).getTimezoneOffset() * 60000) / 86400000);
  const now = Date.now(), n = night(now) - night(now - ms);
  if (n <= 0) return SS_T('vsAgoTonight');
  if (n === 1) return SS_T('vsAgoLastNight');
  if (n >= 60) return SS_T('vsAgoLong');
  return SS_T('vsAgoNights', n);
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

/* ---------- the crossed-blades glyph ----------
   Drawn art, never an emoji (the no-emoji-as-game-art law): two gold blades
   crossed on a transparent square, baked once per scene at the texture
   factory's resolution through ssBake (wipe + fallback + DIAG on a painter
   throw). Consumers use setDisplaySize, per the R-scaled-texture rule.
   Two bakes since v0.83.0: the friend rows keep the byte-identical 96px
   'vsswords' for their 20u glyphs, and the hero crest asks for its own
   width (210 → 'vsswords210', ~630 device px at DPR 3) so 2.5× never
   upscale-blurs — the painter stays in its hand-tuned 96-space and the
   context scale carries it up, shadow softness riding the same factor. */
function vsSwordsTex(scene, w) {
  const W = w || 96, D = 96, k = W / D;
  const key = W === D ? 'vsswords' : 'vsswords' + W;
  if (scene.textures.exists(key)) return key;
  const R = ssTexRes(scene);
  const t = scene.textures.createCanvas(key, Math.round(W * R), Math.round(W * R));
  t.context.scale(R * k, R * k);
  const blade = (c, a) => {
    c.save(); c.translate(D / 2, D / 2); c.rotate(a);
    // tapered body with a bright face, a dark edge and a fuller line
    c.beginPath(); c.moveTo(-4.6, 26); c.lineTo(-1.7, -40); c.lineTo(0, -45); c.lineTo(1.7, -40); c.lineTo(4.6, 26); c.closePath();
    c.fillStyle = '#ead9a4'; c.fill();
    c.lineWidth = 1.4; c.strokeStyle = '#8a6210'; c.stroke();
    c.beginPath(); c.moveTo(0, 22); c.lineTo(0, -40);
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(138,98,16,0.55)'; c.stroke();
    // crossguard, grip, pommel
    c.beginPath(); c.roundRect(-11, 24, 22, 5, 2.5);
    c.fillStyle = '#c9a94f'; c.fill();
    c.lineWidth = 1; c.strokeStyle = '#7a5c1a'; c.stroke();
    c.fillStyle = '#8a6210'; c.fillRect(-2.1, 29, 4.2, 10);
    c.beginPath(); c.arc(0, 42, 3.4, 0, Math.PI * 2);
    c.fillStyle = '#c9a94f'; c.fill();
    c.lineWidth = 1; c.strokeStyle = '#7a5c1a'; c.stroke();
    c.restore();
  };
  ssBake(t, key, D, D, (c) => {
    c.clearRect(0, 0, D, D);
    c.save();
    // shadowBlur lives in device px, outside the transform — scale it by hand
    c.shadowColor = 'rgba(255,215,122,0.5)'; c.shadowBlur = 5 * k;
    blade(c, -0.66); blade(c, 0.66);
    c.restore();
  }, (c) => {
    // fallback: two plain crossed bars — still blades, no curves, no shadows
    c.clearRect(0, 0, D, D);
    c.fillStyle = '#e0c878';
    c.save(); c.translate(D / 2, D / 2);
    for (const a of [-0.66, 0.66]) { c.save(); c.rotate(a); c.fillRect(-2.5, -44, 5, 84); c.fillRect(-10, 24, 20, 4); c.restore(); }
    c.restore();
  });
  return key;
}
/* ---------- THE DUELISTS' chart ----------
   The authored faceless mage asterism from the UNDER ONE SKY review (9/9),
   verbatim: eleven stars, eleven edges, no eyes. One chart serves both
   figures — the rival's container mirrors it — and the shipped renderer's
   own magnitude classes dress the stars, exactly as every beast wears them. */
const VS_MAGE = {
  stars: [[-58, -56], [-72, -40], [-44, -42], [-74, -22], [-48, -24], [-34, -36], [-18, -50], [-64, 0], [-82, 42], [-58, 50], [-38, 40]],
  edges: [[0, 1], [0, 2], [1, 3], [2, 4], [4, 5], [5, 6], [3, 7], [7, 8], [8, 9], [9, 10], [10, 4]],
};
/* one Duelist figure, drawn to the review's own dress: the authored
   magnitudes, a soft halo under every star, the edges in the figure's tint,
   hot centres on the anchors — all from chart data and the shipped 'dot'
   texture (no new art). `fly` staggers the stars in on the assembly
   grammar (the session's first visit); `still` (reduced motion, the
   offline page) stands everything at once with no breath. */
const VS_MAGE_MAG = [3.3, 2.2, 2.2, 2.6, 2.6, 2.2, 3.4, 2.6, 2.4, 2.9, 2.4];
function vsMageFigure(scene, cont, tint, unitScale, opts) {
  opts = opts || {};
  cont.removeAll(true);
  const sc = unitScale;
  const g = scene.add.graphics();
  g.lineStyle(unitScale * 1.1, tint, 0.5);
  for (const [a, b] of VS_MAGE.edges) g.lineBetween(VS_MAGE.stars[a][0] * sc, VS_MAGE.stars[a][1] * sc, VS_MAGE.stars[b][0] * sc, VS_MAGE.stars[b][1] * sc);
  cont.add(g);
  if (opts.fly) { g.setAlpha(0); scene.tweens.add({ targets: g, alpha: 1, duration: 500, delay: VS_MAGE.stars.length * 40 + 520 }); }
  VS_MAGE.stars.forEach((p, i) => {
    const m = VS_MAGE_MAG[i];
    const x = p[0] * sc, y = p[1] * sc;
    const halo = scene.add.image(x, y, 'dot').setScale(m * 1.2).setAlpha(0.14).setTint(tint).setBlendMode('ADD');
    const st = scene.add.image(x, y, 'dot').setScale(m * 0.62).setTint(tint).setBlendMode('ADD');
    cont.add(halo); cont.add(st);
    const hot = m >= 3 ? scene.add.image(x, y, 'dot').setScale(m * 0.24).setAlpha(0.6).setTint(0xfff6dd).setBlendMode('ADD') : null;
    if (hot) cont.add(hot);
    if (opts.fly) {
      const ang = Math.random() * Math.PI * 2, d = 260 * unitScale + Math.random() * 200;
      for (const o of [halo, st, hot]) {
        if (!o) continue;
        const fa = o.alpha;
        o.setPosition(x + Math.cos(ang) * d, y + Math.sin(ang) * d).setAlpha(0);
        scene.tweens.add({ targets: o, x, y, alpha: fa, delay: i * 40, duration: 620, ease: 'Cubic.easeOut' });
      }
    }
    if (!opts.still) {
      scene.tweens.add({
        targets: st, scale: m * 0.48, alpha: 0.72, delay: opts.fly ? i * 40 + 640 : 0,
        duration: 900 + (i * 137) % 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
  });
}
/* the your-move plaque's gold rim: baked ONCE, breathed by alpha tween only
   — never a per-frame stroke (the iOS renderer's law) */
function vsPlaqRimTex(scene) {
  const key = 'vsplaqrim';
  if (scene.textures.exists(key)) return key;
  const W = 344, H = 50, R = ssTexRes(scene);
  const t = scene.textures.createCanvas(key, Math.round(W * R), Math.round(H * R));
  t.context.scale(R, R);
  ssBake(t, key, W, H, (c) => {
    c.clearRect(0, 0, W, H);
    c.save();
    c.shadowColor = 'rgba(255,215,122,0.55)'; c.shadowBlur = 7;
    c.strokeStyle = '#ffd77a'; c.lineWidth = 1.6;
    c.beginPath(); c.roundRect(3, 3, W - 6, H - 6, 10); c.stroke();
    c.shadowColor = 'transparent'; c.shadowBlur = 0;
    c.strokeStyle = 'rgba(255,233,168,0.5)'; c.lineWidth = 0.8;
    c.beginPath(); c.roundRect(4.2, 4.2, W - 8.4, H - 8.4, 9); c.stroke();
    c.restore();
  }, (c) => {
    // fallback: a plain gold frame — still a rim, no curves, no shadows
    c.clearRect(0, 0, W, H);
    c.strokeStyle = '#ffd77a'; c.lineWidth = 2;
    c.strokeRect(3, 3, W - 6, H - 6);
  });
  return key;
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
      if (joined) await vsStartIfFull(VS_DEEP.join);   // the challenger roams now — the arriving seat lights the duel
    }
  } catch (e) { }
  localStorage.setItem('beta3.deeplink', JSON.stringify({ join: VS_DEEP.join, joined, friend: VS_DEEP.friend, friendName, t: Date.now() }));
  if (!scene.sys.isActive()) return;
  if (joined) {
    scene.scene.start('vsbattle', { code: VS_DEEP.join, joining: true });
    if (friendName) scene.time.delayedCall(700, () => vsNotify(SS_T('frAdded', friendName)));
    return;
  }
  done();
  if (VS_DEEP.join) vsNotify(SS_T('smCold'));
  if (friendName) scene.time.delayedCall(VS_DEEP.join ? 2600 : 200, () => vsNotify(SS_T('frAdded', friendName)));
}

/* ---------- room helpers ---------- */
/* one cast (or a scry, `pass`) lands on the room record: count it against
   the standing turn, flip to the next living seat when the turn's three are
   woven (legacy rooms flip on every cast — vsTurnSize). Runs INSIDE a
   transaction on both skies, so two writes can never read the same count.
   The rival engine steps its turns through this very function. */
function vsTurnStep(cur, me, pass) {
  const size = vsTurnSize(cur);
  const tc = (cur.turnCasts | 0) + 1;
  const next = { ...cur, movedAt: Date.now() };
  if (pass || tc >= size) {
    const alive = Object.entries(cur.players || {})
      .filter(([, p]) => p.hp > 0 && (cur.corr ? true : !p.gone))
      .map(([id, p]) => ({ id, seat: p.seat })).sort((a, b) => a.seat - b.seat);
    const idx = alive.findIndex((p) => p.id === me);
    let to = me;
    for (let i = 1; i <= alive.length; i++) { const cand = alive[(idx + i) % alive.length]; if (cand) { to = cand.id; break; } }
    next.turnUid = to; next.turnCount = (cur.turnCount | 0) + 1; next.turnCasts = 0;
  } else next.turnCasts = tc;
  return next;
}
function vsCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

/* ============================================================
   THE NEAR SKY (9/3 feedback card 03) — a worldwide duel lives on
   THIS device once the quiet sky answers it: the room record is
   byte-shaped like a live room and every write goes through the
   same ref/txn grammar, but the tree lives in localStorage and
   survives app restarts — the busy-human rhythm (a reply every
   1:30–5:00) needs a duel that outlives the tab. The driver fires
   its listeners a beat later, the way the sky does; writes apply
   synchronously inside one JS turn, so a reload can never catch
   half a cast. Beside each room rides a NOTE (the pacing clock,
   both players' play scripts for board replay, the seen
   watermark) — outside the room record on purpose: the record
   stays a room, nothing more.
   ============================================================ */
const SS_NEAR = (() => {
  const KEY = 'starspellDuels';
  let store = null;
  function load() {
    if (store) return store;
    try { store = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { store = {}; }
    if (!store.rooms || typeof store.rooms !== 'object') store.rooms = {};
    if (!store.notes || typeof store.notes !== 'object') store.notes = {};
    return store;
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { } }
  // paths arrive as 'mp/rooms/CODE[/…]' — the near tree holds only rooms
  const parts = (path) => String(path).split('/').filter(Boolean).slice(2);
  function read(path) {
    const p = parts(path);
    let n = load().rooms;
    for (const k of p) { if (n == null || typeof n !== 'object') return null; n = n[k]; }
    return n === undefined ? null : n;
  }
  function write(path, v) {
    const p = parts(path);
    if (!p.length) return;
    const s = load();
    let n = s.rooms;
    for (let i = 0; i < p.length - 1; i++) {
      if (typeof n[p[i]] !== 'object' || n[p[i]] == null) n[p[i]] = {};
      n = n[p[i]];
    }
    if (v === null) delete n[p[p.length - 1]]; else n[p[p.length - 1]] = v;
    persist();
    fire(p[0]);
  }
  // listeners fire asynchronously and coalesced, exactly one beat after the
  // write — the grammar every scene already speaks
  const listeners = [];   // {code, path, type, cb, seen:Set}
  let firing = null;
  const snap = (v, k) => ({ val: () => (v === undefined ? null : v), key: k });
  function deliver(l) {
    try {
      if (l.type === 'value') l.cb(snap(read(l.path)));
      else if (l.type === 'child_added') {
        const kids = read(l.path) || {};
        for (const k of Object.keys(kids).sort()) {
          if (l.seen.has(k)) continue;
          l.seen.add(k);
          l.cb(snap(kids[k], k));
        }
      }
    } catch (e) { }
  }
  function fire(code) {
    if (firing) { firing.add(code); return; }
    firing = new Set([code]);
    setTimeout(() => {
      const codes = firing;
      firing = null;
      for (const l of [...listeners]) if (codes.has(l.code) && listeners.includes(l)) deliver(l);
    }, 0);
  }
  function ref(path) {
    return {
      on(type, cb) {
        const l = { code: parts(path)[0], path, type, cb, seen: new Set() };
        listeners.push(l);
        // the sky fires value once on attach, and child_added for what stands
        setTimeout(() => { if (listeners.includes(l)) deliver(l); }, 0);
        return cb;
      },
      off(type, cb) {
        for (let i = listeners.length - 1; i >= 0; i--) {
          const l = listeners[i];
          if (l.path === path && (!type || l.type === type) && (!cb || l.cb === cb)) listeners.splice(i, 1);
        }
      },
      child(k) { return ref(path + '/' + k); },
      set(v) { write(path, v); return Promise.resolve(); },
      update(v) {
        const cur = read(path);
        write(path, Object.assign({}, (cur && typeof cur === 'object') ? cur : {}, v));
        return Promise.resolve();
      },
      push(v) {
        const k = '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        write(path + '/' + k, v);
        return Promise.resolve({ key: k });
      },
      get() { return Promise.resolve(snap(read(path))); },
      onDisconnect() { return { set: () => Promise.resolve(), cancel: () => Promise.resolve(), remove: () => Promise.resolve() }; },
    };
  }
  async function txn(path, fn) {
    const cur = read(path);
    const next = fn(cur);
    if (next === undefined) return { committed: true, value: cur };
    write(path, next);
    return { committed: true, value: next };
  }
  const api = {
    ref, txn,
    set: (p, v) => { write(p, v); return Promise.resolve(); },
    update: (p, v) => ref(p).update(v),
    get: async (p) => read(p),
  };
  return {
    api,
    has: (code) => !!load().rooms[code],
    room: (code) => load().rooms[code] || null,
    codes: () => Object.keys(load().rooms),
    note: (code) => load().notes[code] || null,
    setNote(code, patch) {
      const s = load();
      s.notes[code] = Object.assign({}, s.notes[code] || {}, patch || {});
      persist();
      return s.notes[code];
    },
    // seal a fresh near room + its note in one stroke
    seal(code, rec, noteRec) {
      const s = load();
      s.rooms[code] = rec;
      s.notes[code] = noteRec || {};
      persist();
      fire(code);
    },
    purge(code) {
      const s = load();
      delete s.rooms[code];
      delete s.notes[code];
      persist();
      fire(code);
    },
  };
})();

/* the standing friend summonses — the versus page's pending rows (Q3) */
const VS_PEND = (() => {
  const KEY = 'starspellPending';
  function list() { try { const a = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { } }
  return {
    list,
    add(rec) { const a = list().filter((r) => r.code !== rec.code); a.unshift(rec); save(a.slice(0, 6)); },
    mark(code, patch) { const a = list(); const r = a.find((x) => x.code === code); if (r) { Object.assign(r, patch); save(a); } return r; },
    remove(code) { save(list().filter((r) => r.code !== code)); },
    get(code) { return list().find((r) => r.code === code) || null; },
  };
})();

/* ---------- the ledger of my ongoing sky duels (9/8 card 04) ----------
   A correspondence duel in the LIVE sky outlives every visit, so this device
   keeps its own ledger — code, rival, whose turn it stands on, what I have
   seen — the way SS_NEAR's notes carry a near duel. The roaming watcher
   (VsSummons) keeps each entry honest against its room; the home strip and
   the versus page render from here synchronously. An identity is a device in
   this game (starspellUid), so the ledger travels exactly as far as the
   player does. */
const VS_GAMES = (() => {
  const KEY = 'starspellGames';
  function list() { try { const a = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) { } }
  return {
    list,
    add(rec) { const a = list().filter((r) => r.code !== rec.code); a.unshift(rec); save(a.slice(0, 8)); },
    mark(code, patch) { const a = list(); const r = a.find((x) => x.code === code); if (r) { Object.assign(r, patch); save(a); } return r; },
    remove(code) { save(list().filter((r) => r.code !== code)); },
    get(code) { return list().find((r) => r.code === code) || null; },
  };
})();

/* every standing duel as one row list — the home strip and the versus page
   read the same truth: friend summonses waiting (VS_PEND), near duels
   breathing on this device (SS_NEAR), and live-sky correspondence duels
   (VS_GAMES). One row per code; calls-to-action first. */
function vsGameRows() {
  const rows = [], seen = new Set();
  const put = (r) => { if (!seen.has(r.code)) { seen.add(r.code); rows.push(r); } };
  for (const p of VS_PEND.list()) put({ kind: p.declined ? 'declined' : 'wait', code: p.code, name: p.to.name, at: p.at, p });
  for (const code of SS_NEAR.codes()) {
    const r = SS_NEAR.room(code), n = SS_NEAR.note(code) || {};
    if (!r || !r.players) continue;
    const foe = Object.entries(r.players).find(([id]) => id !== SSNET.uid());
    const name = foe ? foe[1].name : '…';
    if (r.status === 'done') { if (!n.myEnd) put({ kind: 'done', code, name, at: r.endedAt || r.createdAt || 0, near: 1 }); }
    else if (r.status === 'active') put({ kind: r.turnUid === SSNET.uid() ? 'move' : 'theirs', code, name, at: r.startedAt || r.createdAt || 0, near: 1 });
  }
  for (const g of VS_GAMES.list()) {
    if (g.status === 'done') { if (!g.myEnd) put({ kind: 'done', code: g.code, name: g.foe.name, at: g.at || 0, g }); }
    else put({ kind: g.held ? 'wait' : g.turn === SSNET.uid() ? 'move' : 'theirs', code: g.code, name: g.foe.name, at: g.at || 0, g });
  }
  const RANK = { move: 0, done: 1, theirs: 2, wait: 3, declined: 4 };
  return rows.sort((a, b) => (RANK[a.kind] - RANK[b.kind]) || (b.at - a.at));
}
// the five-game cap counts what is truly ONGOING: waiting summonses, active
// near duels, active sky duels — decided and declined rows hold no slot
function vsOngoingCount() {
  const codes = new Set();
  for (const p of VS_PEND.list()) if (!p.declined) codes.add(p.code);
  for (const code of SS_NEAR.codes()) { const r = SS_NEAR.room(code); if (r && r.status !== 'done') codes.add(code); }
  for (const g of VS_GAMES.list()) if (g.status !== 'done') codes.add(g.code);
  return codes.size;
}
/* the cap, spoken honestly (Skylar: five ongoing games, then finish or
   abandon one). One window, one door out. Returns true when the cap held. */
function vsCapSheet(scene) {
  if (vsOngoingCount() < VS_CAP) return false;
  SFX.ui();
  const l = ssLayout(scene);
  const c = scene.add.container(0, 0).setDepth(760);
  const veil = scene.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.7).setInteractive();
  const pane = scene.add.image(l.x(0), l.y(400), 'endpanel').setDisplaySize(l.u(340), l.u(220));
  const head = ssTxt(scene, l.x(0), l.y(330), SS_T('vsCapTitle'), l.u(16), '#ffe9a8').setOrigin(0.5)
    .setShadow(0, 0, '#c9b676', l.u(8), true, true);
  for (let fs = 16; head.width > l.u(300) && fs > 11; fs -= 0.5) head.setFontSize(l.u(fs));
  const body = ssTextBlock(scene, l.x(0), l.y(392), SS_T('vsCapBody'), {
    fontSize: l.u(12) + 'px', color: '#d8d2bd', fontStyle: 'italic', shadow: true,
    wrapW: l.u(300), align: 'center', ox: 0.5, oy: 0.5,
  });
  const ok = scene.add.image(l.x(0), l.y(468), ssBtn(scene, false, 220, 48)).setDisplaySize(l.u(220), l.u(48)).setInteractive({ useHandCursor: true });
  const okT = ssTxt(scene, l.x(0), l.y(468), SS_T('vsCapOk'), l.u(13), BTN_INK()).setOrigin(0.5);
  const close = () => { SFX.ui(); c.destroy(); };
  veil.on('pointerdown', close);
  ok.on('pointerdown', close);
  c.add([veil, pane, head, body, ok, okT]);
  c.setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, duration: 180 });
  return true;
}

/* ---------- abandoning a duel (9/8 card 04, Q3 stamped) ----------
   A real door with a confirm: abandoning an exchanged duel settles as a
   RATED LOSS (the desertion convention — SS_RATING.duel at 0) and the rival
   inherits the win; the room is marked done so THEIR side ends honorably.
   A duel the rival never wove into (no cast of theirs, a summons unclaimed)
   is simply taken back — nothing was exchanged, nothing is lost, the room
   dissolves on both sides. `row` is a vsGameRows() row; done() runs after
   either resolution so the caller can repaint. */
function vsAbandon(scene, row, done) {
  const db = vsDb(row.code);
  const finish = () => { try { if (done) done(); } catch (e) { } };
  (async () => {
    let room = null;
    try { room = await db.get('mp/rooms/' + row.code); } catch (e) { room = null; }
    // the summons rows (wait/declined) never exchanged anything — and a room
    // already decided settles at its end screen, not here
    const me = SSNET.uid();
    const foeE = room && room.players ? Object.entries(room.players).find(([id]) => id !== me) : null;
    const foeCast = !!(room && foeE && Object.values(room.casts || {}).some((cst) => cst && cst.uid === foeE[0]));
    const rated = !!(room && room.status === 'active' && foeE && !foeE[1].held && foeCast);
    if (!scene.sys.isActive()) return;
    const l = ssLayout(scene);
    const c = scene.add.container(0, 0).setDepth(760);
    const veil = scene.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.7).setInteractive();
    const pane = scene.add.image(l.x(0), l.y(400), 'endpanel').setDisplaySize(l.u(340), l.u(250));
    const head = ssTxt(scene, l.x(0), l.y(318), SS_T('vsQuitTitle'), l.u(16), '#ffe9a8').setOrigin(0.5)
      .setShadow(0, 0, '#c9b676', l.u(8), true, true);
    for (let fs = 16; head.width > l.u(300) && fs > 11; fs -= 0.5) head.setFontSize(l.u(fs));
    const body = ssTextBlock(scene, l.x(0), l.y(372), SS_T(rated ? 'vsQuitBody' : 'vsQuitFree', row.name), {
      fontSize: l.u(12) + 'px', color: rated ? '#e8b09a' : '#d8d2bd', fontStyle: 'italic', shadow: true,
      wrapW: l.u(300), align: 'center', ox: 0.5, oy: 0.5,
    });
    const keepB = scene.add.image(l.x(0), l.y(432), ssBtn(scene, false, 250, 48)).setDisplaySize(l.u(250), l.u(48)).setInteractive({ useHandCursor: true });
    const keepT = ssTxt(scene, l.x(0), l.y(432), SS_T('vsQuitKeep'), l.u(13), BTN_INK()).setOrigin(0.5);
    for (let fs = 13; keepT.width > l.u(230) && fs > 9; fs -= 0.5) keepT.setFontSize(l.u(fs));
    const goB = scene.add.image(l.x(0), l.y(488), ssBtn(scene, true, 220, 42)).setDisplaySize(l.u(220), l.u(42)).setInteractive({ useHandCursor: true });
    const goT = ssTxt(scene, l.x(0), l.y(488), SS_T('vsQuitGo'), l.u(12), '#e66a6a').setOrigin(0.5);
    for (let fs = 12; goT.width > l.u(200) && fs > 9; fs -= 0.5) goT.setFontSize(l.u(fs));
    const close = () => c.destroy();
    veil.on('pointerdown', () => { SFX.ui(); close(); });
    keepB.on('pointerdown', () => { SFX.ui(); close(); });
    goB.on('pointerdown', () => {
      SFX.ui();
      close();
      vsAbandonNow(row, room, rated);
      finish();
    });
    c.add([veil, pane, head, body, keepB, keepT, goB, goT]);
    c.setAlpha(0);
    scene.tweens.add({ targets: c, alpha: 1, duration: 180 });
  })();
}
// the confirmed abandon itself — also the ✕ path for wait/declined rows
function vsAbandonNow(row, room, rated) {
  const me = SSNET.uid();
  const db = vsDb(row.code);
  if (rated && room) {
    const foeE = Object.entries(room.players || {}).find(([id]) => id !== me);
    const foeR = foeE && Number.isFinite(foeE[1].rating) ? foeE[1].rating : SS_RATING.BASE;
    SS_RATING.duel(foeR, 0);
    SS.save(); SS.sync();
    db.txn('mp/rooms/' + row.code, (cur) => {
      if (!cur || cur.status !== 'active') return undefined;
      return { ...cur, status: 'done', winnerUid: foeE ? foeE[0] : null, endedAt: Date.now(), resigned: me };
    }).catch(() => { });
    if (row.near || SS_NEAR.has(row.code)) {
      // the near mage's own ledger settles on its done-beat; then the duel
      // leaves this device — decided, seen, and abandoned all at once
      SS_NEAR.setNote(row.code, { settled: 1, myEnd: 1 });
      setTimeout(() => {
        try { if (typeof SS_RIVAL !== 'undefined' && SS_RIVAL.stopFor) SS_RIVAL.stopFor(row.code); SS_NEAR.purge(row.code); } catch (e) { }
      }, 700);
    } else VS_GAMES.remove(row.code);
  } else {
    // nothing exchanged: take the whole duel back, both sides dissolve. The
    // txn re-proves it — a rival's cast or claim landing this instant wins,
    // and the duel stands (the row repaints on the next beat)
    if (row.near || SS_NEAR.has(row.code)) {
      try { if (typeof SS_RIVAL !== 'undefined' && SS_RIVAL.stopFor) SS_RIVAL.stopFor(row.code); } catch (e) { }
      SS_NEAR.purge(row.code);
    } else {
      SSNET.dbTxn('mp/rooms/' + row.code, (cur) => {
        if (!cur || !cur.players || !cur.players[me]) return cur;
        if (cur.corr && cur.status === 'active') {
          const foe = Object.entries(cur.players).find(([id]) => id !== me);
          if (foe && !foe[1].held && Object.values(cur.casts || {}).some((cst) => cst && cst.uid === foe[0])) return cur;
          return null;
        }
        if (cur.status !== 'waiting') return cur;
        const players = { ...cur.players };
        delete players[me];
        if (!Object.keys(players).length) return null;
        return { ...cur, players };
      }).catch(() => { });
      VS_GAMES.remove(row.code);
    }
  }
  const p = VS_PEND.get(row.code);
  if (p && p.to) SSNET.FR.cancelChallenge(p.to.id);
  VS_PEND.remove(row.code);
}

// one grammar, two skies: a near code's writes land in localStorage, any
// other room speaks to the live sky exactly as before
function vsDb(code) {
  if (SS_NEAR.has(code)) return SS_NEAR.api;
  return { ref: (p) => SSNET.ref(p), txn: SSNET.dbTxn, set: SSNET.dbSet, update: SSNET.dbUpdate, get: SSNET.dbGet };
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
/* ---------- the quiet sky (v0.49.0, retimed by the theater 9/3 card 03) ----------
   A searcher the queue has not served is met by one of the circle
   (rival.js): a mage of this device's acquaintance, rated a believable
   distance from the player, who comes in through the same door as anyone.
   The clock is the searching theater's own roll — T_MIN + up to T_SPREAD,
   rolled at the tap — and the answer is staged SETUP_MS before the beat
   lands so OPPONENT FOUND arrives on time. People always win the race: the
   last instant before the door opens the queue is read once more, an ELDER
   room takes me whatever its rating, and a YOUNGER room already on its way
   (within tolerance, or old enough that its own last look has begun) holds
   the door — but never past the beat. */
// HOLD_MS bridges two theaters' rolls: the elder's hold (fbAt + HOLD) must
// reach the youngest possible last look (their T up to 15s, staged −2.4s) —
// 8s covers the full 7s roll spread, so two real searchers ALWAYS pair, and
// the beat runs a breath long only when a person is genuinely inbound.
// COMING_MS is the younger's proof of life: ANY public searcher who has
// waited a breath will reach their own last look inside the elder's hold —
// gating the hold on a longer wait let an early-rolling elder swap local
// while a person was mid-theater (both got the circle; Q1 says people first)
const VS_FB = { T_MIN: 8000, T_SPREAD: 7000, SETUP_MS: 2400, HOLD_MS: 8000, COMING_MS: 1500, ARRIVE_MS: 500, ARRIVE_SPREAD: 800 };
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
    if (diff <= vsTolerance(now - seekAt, theirWait) || theirWait >= VS_FB.COMING_MS) return true;
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
    // Correspondence rooms (corr) are LONG-LIVED by design: an active one
    // lives while anyone still weaves (30 idle days), a decided one lingers a
    // week so both seats can read the end. Everything else keeps the 40-min law.
    for (const [id, r] of Object.entries(rooms)) {
      if (!r) continue;
      const stale = !r.createdAt
        || (!r.corr && now - r.createdAt > 40 * 60000)
        || (r.corr && r.status === 'done' && now - (r.endedAt || r.createdAt) > 7 * 86400000)
        || (r.corr && r.status !== 'done' && now - (r.movedAt || r.createdAt) > 30 * 86400000);
      if (stale) SSNET.dbSet('mp/rooms/' + id, null).catch(() => { });
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
// Every turns room this build mints is CORRESPONDENCE (corr: 1, hp 150,
// 3-cast turns) — opts.corr === false is the legacy seam (?botduel arcade).
// opts.hold = {id, name} seals the room ACTIVE at birth with the rival's
// seat held: the challenger weaves their first three at once, and the claim
// comes whenever the rival answers (Skylar's 9/8 friend flow).
async function vsSealRoom(code, mode, opts) {
  try {
    const corr = mode === 'turns' && !(opts && opts.corr === false);
    const hold = (opts && opts.hold) || null;
    const rec = {
      mode, status: 'waiting', createdAt: Date.now(), hostUid: vsUid(),
      seed: (opts && opts.seed) || Math.floor(Math.random() * 1e9),   // ?botduel&seed= pins a board for the harness
      lang: ssGameLang(),   // the creator's tongue rules the duel — both bags and dictionaries follow it
      private: !!(opts && opts.private), invited: (opts && opts.invited) || null,
      seekAt: (opts && opts.seekAt) || null,   // set = this host is in the rival queue, since then
      players: { [vsUid()]: vsSeat(0, corr ? VS_CORR_HP : 0) },
    };
    if (corr) { rec.corr = 1; rec.hp = VS_CORR_HP; rec.turnCasts = 0; rec.movedAt = Date.now(); }
    if (hold) {
      rec.players[hold.id] = vsHeldSeat(1, rec.hp, hold.name);
      rec.status = 'active'; rec.startedAt = Date.now(); rec.turnUid = vsUid(); rec.turnCount = 0;
    }
    await SSNET.dbSet('mp/rooms/' + code, rec);
    return true;
  } catch (e) { return false; }
}
async function vsJoinRoom(code) {
  try {
    const r = await SSNET.dbTxn('mp/rooms/' + code, (cur) => {
      if (!cur) return cur; // room unknown (or first-pass null guess) — leave it be
      const players = cur.players || {};
      if (players[vsUid()] && !players[vsUid()].held) return cur;
      // a correspondence room holds its rival's seat — the arriving mage
      // CLAIMS it: the seat's story (hp, the wounds already dealt) survives,
      // the person fills in. Keyed to them by the challenge, or '_open' when
      // the room was sealed for a link; a forwarded link claims like any.
      if (cur.status === 'active' && cur.corr) {
        const heldKey = players[vsUid()] && players[vsUid()].held ? vsUid()
          : Object.keys(players).find((id) => players[id] && players[id].held);
        if (!heldKey) return cur;
        const seatRec = { ...players[heldKey] };
        delete players[heldKey];
        delete seatRec.held;
        players[vsUid()] = { ...seatRec, name: vsName(), joinedAt: Date.now(), gone: false,
          rating: SS.prof.rating, rhide: SS.prof.rhide ? 1 : 0 };
        return { ...cur, players };
      }
      if (cur.status !== 'waiting') return cur;
      if (Object.keys(players).length >= VS_MAX[cur.mode]) return cur;
      const seats = Object.values(players).map((p) => p.seat);
      let seat = 0;
      while (seats.includes(seat)) seat++;
      players[vsUid()] = vsSeat(seat, cur.hp);
      return { ...cur, players };
    });
    return !!(r.value && r.value.players && r.value.players[vsUid()] && !r.value.players[vsUid()].held);
  } catch (e) { return false; }
}
// the joiner lights a private room when their seat fills it (9/3 card 03):
// the challenge host no longer waits at a screen, so the accepting side
// starts the duel — a transaction, so a racing starter cannot double-light
async function vsStartIfFull(code) {
  try {
    await SSNET.dbTxn('mp/rooms/' + code, (cur) => {
      if (!cur || cur.status !== 'waiting' || !cur.private) return undefined;
      const seats = Object.entries(cur.players || {}).map(([id, p]) => ({ id, seat: p.seat })).sort((a, b) => a.seat - b.seat);
      if (seats.length < VS_MAX[cur.mode || 'turns']) return undefined;
      return { ...cur, status: 'active', startedAt: Date.now(), turnUid: seats[0].id, turnCount: 0 };
    });
  } catch (e) { }
}

/* ============================================================
   The versus battlefield (lobby + fight + end in one scene)
   ============================================================ */
class VsBattle extends Phaser.Scene {
  constructor() { super('vsbattle'); }
  init(d) {
    this.code = d.code;
    this.challenged = d.challenged || null;   // {id,name} when this room was sealed by a CHALLENGE
    this.sharing = d.sharing || null;         // the INVITE share promise, for wait-beat feedback
    this.joining = !!d.joining;               // arrived through a summons/deep link
    this.theater = d.theater || null;         // the worldwide searching beat {t0, T}
    this.near = SS_NEAR.has(d.code);          // this duel lives on this device
    this.corr = this.near && SS_NEAR.room(d.code) ? !!SS_NEAR.room(d.code).corr : false;   // learned from the first sky snapshot otherwise
    this.recapQ = [];                         // the story of the turns I missed, told at the landing
    this.seenHigh = 0;                        // the highest cast stamp met this life (flushed to the ledger)
    // seeing the rival whole (9/8 card 03) — reset every visit, like the
    // rematch affair: the scene instance persists across duels
    this.histMine = [];                       // my own casts off the feed (the story's opening verse)
    this.foeLast = {};                        // uid → {word, dmg}: the price worn beside their last word
    this.foeSeenAt = 0;                       // the latest ALREADY-SEEN foreign cast (the story's left edge)
    this.myHpD = null;                        // my bar's display state (shown value + running tween)
    this.storyC = null; this.storyEv = null; this.storyLand = null;
    this.storyTold = false;                   // a corr landing tells its tale exactly once
    this.storyPend = null;                    // the telling's one-breath timer (cancellable)
    this.deal = null;                         // the duel's private deal stream (beginBattle seats it)
    this.revealed = !this.theater;            // the found gate holds beginBattle under the theater
    this.beginQueued = false; this.revealTimer = null; this.swapping = false;
    // the scene instance outlives a room: the quiet sky's clock must start
    // fresh with every seal, or the NEXT search would be answered at once
    this.fbAt = 0; this.fbRival = null; this.fbSpawnAt = 0; this.fbBusy = false;
    this.migrating = false; this.rescanning = false; this.lastScan = 0; this.left = false;
    // the rematch affair, reset every visit — the scene instance persists,
    // so a stale rematchBusy/pulse would dead-lock the NEXT end screen's door
    this.rematchWait = d.rematchWait || null;   // {from, foe:{id,name}}: this room was sealed by my rematch press
    this.rematchBusy = false; this.rematchPulse = null; this.rematchDead = false;
    this.rmDeclB = null; this.rmDeclT = null; this.rmGone = false; this.rmGoneT = null; this.rematchG = null;
    this.rmNoRef = null; this.rmNoCb = null; this.rmNoDisc = null; this.rmBelt = null; this.rmDone = false;
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

    // one grammar, two skies (9/3 card 03): a near room's refs write to this
    // device; a live room's to the sky — the scene cannot tell, by design
    this.db = vsDb(this.code);
    this.roomRef = this.db.ref('mp/rooms/' + this.code);
    if (!this.roomRef) { this.scene.start('vsmenu'); return; }
    SSNET.FR.setBusy(true);   // friends see "in a duel" and can't ring me mid-fight
    // a near duel re-entered gets its mage back (idempotent — the boot wake
    // usually already has) and remembers what has been read
    if (this.near) {
      if (typeof SS_RIVAL !== 'undefined' && SS_RIVAL.ensure) SS_RIVAL.ensure(this.code);
    }
    this.onRoomCb = (snap) => this.onRoom(snap.val());
    this.roomRef.on('value', this.onRoomCb);
    this.meRef = this.db.ref('mp/rooms/' + this.code + '/players/' + vsUid());
    if (this.meRef && !this.near) this.meRef.child('gone').onDisconnect().set(true);
    this.castsRef = this.db.ref('mp/rooms/' + this.code + '/casts');
    this.onCastCb = (snap) => { this.onCast(snap.key, snap.val()); };
    if (this.castsRef) this.castsRef.on('child_added', this.onCastCb);

    // a rematch wait can be REFUSED (9/8 card 02): the OLD room carries the
    // rival's word (rematchNo — spoken by their ✕, their leaving the end
    // screen, or their app closing), and this side resolves within a breath.
    // The belt frees the wait even if no word ever comes.
    if (this.rematchWait && !this.near) {
      this.rmNoRef = SSNET.ref('mp/rooms/' + this.rematchWait.from + '/rematchNo');
      if (this.rmNoRef) {
        this.rmNoCb = (snap) => { const v = snap.val(); if (v && v.by !== vsUid()) this.rematchRefused(v); };
        this.rmNoRef.on('value', this.rmNoCb);
      }
      this.rmBelt = this.time.delayedCall(VS_RM_BELT_MS, () => this.rematchRefused(null));
    }

    this.onAchCb = (def) => ssAchToast(this, def);
    this.game.events.on('ss-ach', this.onAchCb);
    this.events.once('shutdown', () => {
      this.game.events.off('ss-ach', this.onAchCb);
      if (this.roomRef) this.roomRef.off('value', this.onRoomCb);
      if (this.castsRef) this.castsRef.off('child_added', this.onCastCb);
      if (this.rmNoRef && this.rmNoCb) { this.rmNoRef.off('value', this.rmNoCb); this.rmNoCb = null; }
      // leaving the end screen is a DECLINE (Skylar's 9/8 stamp: walking
      // away counts) — one honest word on the room frees a waiting rival at
      // once, and a rematch pressed later learns the seat has moved on. The
      // presser's own restart (rematchBusy) and an affair already spoken
      // for (rematchNo standing / the door already faded) are exempt.
      if (!this.near && this.state === 'done' && !this.rematchBusy && !this.rmGone
        && this.room && this.room.status === 'done' && !this.room.rematchNo) {
        SSNET.dbSet('mp/rooms/' + this.code + '/rematchNo', { by: vsUid(), name: vsName(), at: Date.now() }).catch(() => { });
      }
      try { if (this.rmNoDisc) { this.rmNoDisc.cancel(); this.rmNoDisc = null; } } catch (e) { }
      SSNET.FR.setBusy(false);
      if (this.near) {
        // the duel stands when you step away — no gone-mark, no desertion;
        // a decided duel you have SEEN leaves with you
        if (this.room && this.room.status === 'done' && this.state === 'done') SS_NEAR.purge(this.code);
        return;
      }
      // a correspondence duel simply STANDS when you go — no gone-mark: the
      // seat is a standing chair, not a presence, and the strip holds the door
      if (this.corr) return;
      // this.left: leaveRoom already deleted the seat — update() on the dead
      // path would write players/<uid>/{gone:true} back, resurrecting a ghost
      if (!this.left && this.meRef && this.room && this.room.status !== 'done') this.meRef.update({ gone: true }).catch(() => { });
    });

    // a RECENT rematch on one of the circle: the mage arrives through the
    // rival engine a breath after the door opens (task 44) — its own seat
    // rating, its own row, the same join a phone runs
    if (this.challenged && this.challenged.circle && typeof SS_RIVAL !== 'undefined') {
      const p = this.challenged.circle;
      this.fbRival = SS_RIVAL.spawn({ code: this.code, rating: p.rating, seatRating: p.rating, uid: p.uid, name: p.name, persona: p,
        delay: 1400 + Math.random() * 1600 });
      try { localStorage.setItem('starspellCircleLast', p.uid); } catch (e) { }
    }
    if (VSDEMO) this.time.addEvent({ delay: 1500, loop: true, callback: () => this.demoStep() });
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.secondTick() });
    this.input.on('pointerdown', () => SFX.ensure());
  }

  buildUi() {
    const l = this.L;
    const txt = (x, y, s, size, color, style) => ssTxt(this, x, y, s, l.u(size), color, style);
    // the worldwide path never speaks a seal (9/3 card 03) — a searching
    // theater's room, and a near duel, wear no code; friend rooms keep theirs
    this.headT = txt(l.x(0), l.y(24), (this.near || this.theater) ? '' : 'SEAL ' + this.code, 14, '#c9b676').setOrigin(0.5);
    this.clockT = txt(l.x(190), l.y(24), '', 15, '#ffe9a8').setOrigin(1, 0.5);
    const back = txt(l.x(-195), l.y(24), '‹', 22, '#5a6390').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      SFX.ui();
      // a correspondence duel KEEPS when you step out mid-rhythm — that IS
      // the design (each side weaves in their own time): no desertion, no
      // gone-mark, the home strip and the pending row hold the door open.
      // Said once, the first time. Abandoning is its own confirmed door and
      // a rated loss (Q3's stamp) — never an accident of the back arrow.
      if (this.near || this.corr) {
        if (this.room && this.room.status === 'active' && this.state !== 'done' && !localStorage.getItem('beta3.duelStands')) {
          try { localStorage.setItem('beta3.duelStands', '1'); } catch (e) { }
          vsNotify(SS_T('vsDuelStands'));
        }
        this.scene.start('vsmenu');
        return;
      }
      // deserting a live legacy battle settles as a loss — fleeing can't
      // dodge the Elo exchange (endBattle never runs for a walked-out seat)
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

    this.youT = txt(l.x(-190), l.y(352), 'YOU', 11, '#c9b676').setOrigin(0, 0.5);
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

    // the waiting screen (9/3 card 03: the summons-sealed lobby is GONE) —
    // parked AT the camera's resting scroll, never scrollFactor(0): a
    // Container's scrollFactor affects rendering only, never input, so a
    // factor-0 wait screen hit-tests a full sky-height away from its text.
    const cam = this.cameras.main;
    this.waitC = this.add.container(cam.scrollX, cam.scrollY).setDepth(90);
    if (this.theater) this.buildTheater(l);
    else this.buildWaitBeat(l);
  }

  /* ---------- the searching theater (worldwide, 9/3 card 03) ----------
     Skylar: tap CHALLENGE WORLDWIDE → "searching for an opponent" for a
     rolled 8–15s → OPPONENT FOUND → straight into the duel. No seal code,
     no share, no roster. Under the veil the real hunt runs unchanged
     (humans first — Q1's stamp): the queue can seat a person at any beat;
     the quiet sky answers at the roll's end. The dress is the game's own —
     the crossed-blades crest breathing over a slow orbit of star motes,
     never a spinner. */
  buildTheater(l) {
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.88).setInteractive();
    const leave = ssTxt(this, l.x(-195), l.y(24), '‹ LEAVE', l.u(14), '#9fb0e8').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    leave.on('pointerdown', () => this.leaveRoom());
    const still = ssReduceMotion();
    const glow = this.add.image(l.x(0), l.y(330), 'glowbig').setDisplaySize(l.u(360), l.u(360)).setTint(0xc9a94f).setAlpha(0.1).setBlendMode('ADD');
    if (!still) this.tweens.add({ targets: glow, alpha: 0.05, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const crest = this.add.image(l.x(0), l.y(330), vsSwordsTex(this, 210)).setDisplaySize(l.u(120), l.u(120)).setAlpha(0.95);
    // six star motes on a slow elliptic orbit, each with its own phase
    this.thMotes = [];
    if (!still) {
      for (let i = 0; i < 6; i++) {
        const m = this.add.image(l.x(0), l.y(330), i % 2 ? 'spark4' : 'dot').setScale(i % 2 ? 0.5 : 0.8).setTint(0xffe9a8).setAlpha(0.85).setBlendMode('ADD');
        m.__ph = (i / 6) * Math.PI * 2;
        m.__r = l.u(92 + (i % 3) * 10);
        this.thMotes.push(m);
      }
    }
    this.searchT = ssTxt(this, l.x(0), l.y(470), SS_T('vsSearching'), l.u(15), '#ffe9a8').setOrigin(0.5)
      .setShadow(0, 0, '#c9b676', l.u(10), true, true);
    for (let fs = 15; this.searchT.width > l.u(360) && fs > 10; fs -= 0.5) this.searchT.setFontSize(l.u(fs));
    if (!still) this.tweens.add({ targets: this.searchT, alpha: 0.55, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // the search wears a clock (Skylar 9/8): elapsed time counting up under
    // the line, so the wait READS as a search — it ticks under reduce-motion
    // too (information, not ornament) and stands down at OPPONENT FOUND
    this.searchClockT = ssTxt(this, l.x(0), l.y(505), '0:00', l.u(21), '#d8c98f').setOrigin(0.5)
      .setShadow(0, 0, '#c9b676', l.u(8), true, true);
    const tick = () => {
      if (this.revealed || !this.searchClockT || !this.searchClockT.active) return;
      const s = Math.max(0, Math.floor((Date.now() - this.theater.t0) / 1000));
      const txt = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
      if (this.searchClockT.text !== txt) this.searchClockT.setText(txt);
    };
    tick();
    this.thClockEv = this.time.addEvent({ delay: 250, loop: true, callback: tick });
    this.waitT = null;
    this.waitC.add([veil, glow, crest, ...this.thMotes, this.searchT, this.searchClockT, leave]);
  }
  /* ---------- the minimal wait-beat ----------
     Every other waiting moment — a circle rematch forming, a summons/deep
     link joining, the ?frdemo=invite recipe's shared room — gets one quiet
     line and the LEAVE door. A private room minted to be SHARED keeps its
     one ✶ (the link is the only key it has). */
  buildWaitBeat(l) {
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0.55);
    const leave = ssTxt(this, l.x(-195), l.y(24), '‹ LEAVE', l.u(14), '#9fb0e8').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    leave.on('pointerdown', () => this.leaveRoom());
    const ch = this.challenged;
    const line = ch ? (ch.circle ? SS_T('vsWaitDuel') : SS_T(ch.away ? 'vsWaitAway' : ch.busy ? 'vsWaitBusy' : 'vsWaitAnswer', ch.name))
      : SS_T(this.joining ? 'smJoining' : 'vsWaitDuel');
    this.waitT = ssTextBlock(this, l.x(0), l.y(330), line, {
      fontSize: l.u(13) + 'px', color: '#d8d2bd', fontStyle: 'italic', shadow: true,
      wrapW: l.u(340), align: 'center', ox: 0.5, oy: 0.5,
    });
    if (!ssReduceMotion()) this.tweens.add({ targets: this.waitT, alpha: 0.6, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.waitC.add([veil, this.waitT, leave]);
    // a rematch wait is for a KNOWN rival — no invite link to share there
    if (!ch && !this.near && !this.rematchWait) {
      this.shareB = this.add.image(l.x(0), l.y(420), ssBtn(this, false, 250, 46)).setDisplaySize(l.u(250), l.u(46)).setInteractive({ useHandCursor: true });
      this.shareT = ssTxt(this, l.x(0), l.y(420), SS_T('vsShareInvite'), l.u(13), BTN_INK()).setOrigin(0.5);
      vsOnTap(this.shareB, () => {
        SFX.ui();
        vsShare(SS_T('vsShareText', vsName()), vsInviteUrl(this.code)).then((r) => this.shareNote(r));
      });
      if (this.sharing) this.sharing.then((r) => this.shareNote(r)).catch(() => { });
      this.waitC.add([this.shareB, this.shareT]);
    }
  }
  shareNote(r) {
    if (!this.shareT || !this.shareT.active) return;
    if (r === 'copied') this.shareT.setText(SS_T('vsCopied'));
    else if (r === 'failed') this.shareT.setText(SS_T('vsCopyFail'));
    else return;
    this.time.delayedCall(2600, () => { if (this.shareT.active) this.shareT.setText(SS_T('vsShareInvite')); });
  }
  killTheater() {
    if (this.revealTimer) { this.revealTimer.remove(false); this.revealTimer = null; }
    if (this.thClockEv) { this.thClockEv.remove(false); this.thClockEv = null; }
    this.revealed = true;
    if (this.thMotes) { for (const m of this.thMotes) m.destroy(); this.thMotes = null; }
  }

  /* ---------- room snapshots drive everything ---------- */
  me() { return this.room && this.room.players ? this.room.players[vsUid()] : null; }
  others() {
    if (!this.room || !this.room.players) return [];
    return Object.entries(this.room.players).filter(([id]) => id !== vsUid())
      .map(([id, p]) => ({ id, ...p })).sort((a, b) => a.seat - b.seat);
  }
  alivePlayers() {
    // in correspondence a gone-mark means "away", never "dead" — the duel
    // stands however long a seat sits empty; legacy rooms keep the old law
    const corr = this.room && this.room.corr;
    return Object.entries((this.room && this.room.players) || {})
      .filter(([, p]) => p.hp > 0 && (corr ? true : !p.gone)).map(([id, p]) => ({ id, ...p }));
  }
  isMyTurn() {
    if (!this.room || this.room.status !== 'active') return false;
    if (this.room.mode === 'timed') return true;
    return this.room.turnUid === vsUid();
  }

  onRoom(room) {
    if (!room) { if (this.migrating || this.swapping) return; if (this.state !== 'done') { this.scene.start('vsmenu'); } return; }
    const first = !this.room;
    this.room = room;
    if (room.corr && !this.corr) {
      // a correspondence room: the seat is a standing chair — a dropped
      // connection must never write it gone (the duel stands, by design)
      this.corr = true;
      if (!this.near) { try { if (this.meRef) this.meRef.child('gone').onDisconnect().cancel(); } catch (e) { } }
    }
    // the ledger shadows a live-sky correspondence room: whose turn it
    // stands on, whether the held seat was claimed — the home strip's truth
    if (this.corr && !this.near && VS_GAMES.get(this.code)) {
      const foe = Object.entries(room.players || {}).find(([id]) => id !== vsUid());
      VS_GAMES.mark(this.code, { status: room.status, turn: room.turnUid || null,
        held: foe && foe[1].held ? 1 : 0, foe: foe ? { id: foe[0], name: foe[1].name } : (VS_GAMES.get(this.code) || {}).foe });
    }
    // start pulling the room's dictionary the moment its tongue is known, so
    // the beginBattle gate almost never actually has to wait
    if (first && room.lang && room.lang !== 'en') SS_DICT.load(room.lang);
    if (room.status === 'waiting') { this.maybeAutoStart(); return; }
    if (room.status === 'active' && this.state === 'wait') this.queueBegin();
    if (room.status === 'active') {
      this.updatePanels();
      this.checkEnd();
    }
    if (room.status === 'done' && this.state !== 'done') this.endBattle();
    else if (room.status === 'done') {
      // the rival's moved-on word outranks the rematch call — the door
      // fades honestly instead of ringing for a seat that left
      if (room.rematchNo && room.rematchNo.by !== vsUid()) this.showRematchGone(room.rematchNo);
      else if (room.rematch && !this.rematchBusy) this.showRematchCall();
    }
  }

  /* ---------- the FOUND GATE (9/3 card 03) ----------
     Under the theater the duel may form early (a person!) — the reveal
     holds until the rolled beat lands, then OPPONENT FOUND, then the rise.
     Without a theater this is beginBattle, as ever. */
  queueBegin() {
    if (this.state !== 'wait' || this.beginQueued) return;
    this.beginQueued = true;
    if (!this.theater) { this.beginBattle(); return; }
    const wait = Math.max(0, this.theater.t0 + this.theater.T - Date.now());
    this.revealTimer = this.time.delayedCall(wait, () => this.foundBeat());
  }
  foundBeat() {
    this.revealTimer = null;
    if (this.state !== 'wait' || !this.room || this.room.status !== 'active') { this.beginQueued = false; return; }
    this.revealed = true;
    const l = this.L;
    if (this.searchT && this.searchT.active) {
      this.tweens.killTweensOf(this.searchT);
      this.searchT.setText(SS_T('vsFound')).setAlpha(1).setColor('#ffd77a').setScale(0.7)
        .setShadow(0, 0, '#c9a94f', l.u(14), true, true);
      this.tweens.add({ targets: this.searchT, scale: 1, duration: 260, ease: 'Back.easeOut' });
    }
    // the clock's search is over — the notice takes the stage
    if (this.searchClockT && this.searchClockT.active) this.tweens.add({ targets: this.searchClockT, alpha: 0, duration: 360 });
    this.cameras.main.flash(300, 240, 210, 120, false);
    SFX.forge();
    this.time.delayedCall(1100, () => { if (this.state === 'wait') this.beginBattle(); });
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

  /* ---------- a rematch refused sets you free (9/8 card 02) ----------
     The rival's word (rematchNo on the old room) — or the belt, when no
     word can ever come — resolves the "duel is forming…" wait: a gentle
     notice, the fresh room dissolved like any dead invite (the FIND
     scavenger's last-one-out law), and back to the versus page freed. */
  rematchRefused(v) {
    if (this.rmDone || this.state !== 'wait') return;
    if (this.room && this.room.status !== 'waiting') return;   // the duel formed in the same breath — it wins
    this.rmDone = true;
    if (this.rmBelt) { this.rmBelt.remove(false); this.rmBelt = null; }
    if (this.rmNoRef && this.rmNoCb) { this.rmNoRef.off('value', this.rmNoCb); this.rmNoCb = null; }
    // detach before the seat leaves — the null snapshot must not slam the door
    if (this.roomRef) this.roomRef.off('value', this.onRoomCb);
    if (this.castsRef) this.castsRef.off('child_added', this.onCastCb);
    try { if (this.meRef) this.meRef.child('gone').onDisconnect().cancel(); } catch (e) { }
    this.left = true;
    this.db.txn('mp/rooms/' + this.code, (cur) => {
      if (!cur || !cur.players || !cur.players[vsUid()]) return cur;
      if (cur.status !== 'waiting') { cur.players[vsUid()].gone = true; return cur; }   // claimed mid-word — bow out like a disconnect
      const players = { ...cur.players };
      delete players[vsUid()];
      const rest = Object.entries(players).sort((a, b) => a[1].seat - b[1].seat);
      if (!rest.length) return null;   // last one out seals the room behind them
      const next = { ...cur, players };
      if (cur.hostUid === vsUid()) next.hostUid = rest[0][0];
      return next;
    }).catch(() => { });
    // the gentle notice where the wait line stood, then the page, freed
    const name = (v && v.name) || (this.rematchWait && this.rematchWait.foe && this.rematchWait.foe.name) || '';
    if (this.waitT) { this.tweens.killTweensOf(this.waitT); this.waitT.destroy(); }
    const l = this.L;
    this.waitT = ssTextBlock(this, l.x(0), l.y(330), SS_T('vsRmMoved', name), {
      fontSize: l.u(13) + 'px', color: '#ffe9a8', fontStyle: 'italic', shadow: true,
      wrapW: l.u(340), align: 'center', ox: 0.5, oy: 0.5,
    });
    this.waitC.add(this.waitT);
    SFX.ui();
    try { localStorage.setItem('beta3.rmfree', JSON.stringify({ code: this.code, from: this.rematchWait && this.rematchWait.from, name, belt: !v, t: Date.now() })); } catch (e) { }
    this.time.delayedCall(2400, () => { if (this.sys.isActive() && this.state === 'wait') this.scene.start('vsmenu'); });
  }

  /* ---------- leave: surrender the seat, not just the screen ---------- */
  leaveRoom() {
    SFX.ui();
    this.left = true;
    if (this.near) {
      // a near search cancelled before it was ever seen = never happened:
      // sweep the room, the note and the answering mage together
      if (typeof SS_RIVAL !== 'undefined' && SS_RIVAL.stopFor) SS_RIVAL.stopFor(this.code);
      if (this.roomRef) this.roomRef.off('value', this.onRoomCb);
      if (this.castsRef) this.castsRef.off('child_added', this.onCastCb);
      SS_NEAR.purge(this.code);
      this.scene.start('vsmenu');
      return;
    }
    try { if (this.meRef) this.meRef.child('gone').onDisconnect().cancel(); } catch (e) { }
    this.db.txn('mp/rooms/' + this.code, (cur) => {
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
    if (this.rescanning || this.migrating || this.swapping || this.near || !r || r.status !== 'waiting') return;
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
    if (this.fbBusy || this.migrating || this.rescanning || this.swapping || this.near || !r || r.status !== 'waiting') return;
    if (r.private || !r.seekAt || r.hostUid !== vsUid() || this.challenged) return;
    if (VS_MAX[r.mode] !== 2) return;   // the battlegrounds fill by hand
    if (Object.keys(r.players || {}).length !== 1) return;
    if (typeof SS_RIVAL === 'undefined' || SSNET.mode !== 'firebase') return;
    // the theater's roll governs: the answer is staged so OPPONENT FOUND
    // lands on the rolled beat, never the old fixed clock
    if (!this.fbAt) {
      const end = this.theater ? this.theater.t0 + this.theater.T : r.seekAt + VS_FB.T_MIN + Math.random() * VS_FB.T_SPREAD;
      this.fbAt = end - VS_FB.SETUP_MS;
    }
    const now = Date.now();
    if (now < this.fbAt) return;
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
        // a younger room on its way holds the door (humans first — the beat
        // runs a breath long rather than seat a mage over a real searcher)
        if (t < this.fbAt + VS_FB.HOLD_MS && vsYoungerComing(rooms, r.mode, t, own, r.seekAt)) return;
        await this.goNear();
      } catch (e) { } finally { this.fbBusy = false; }
    })();
  }
  /* ---------- the local swap (9/3 card 03) ----------
     Nobody came: the search leaves the live sky. My waiting room is deleted
     (atomically — a person landing in that same instant WINS, and the live
     duel proceeds), the same code is re-sealed on THIS device, and one of
     the circle is seated to answer at a busy human's rhythm. The room
     record is byte-identical in shape; the sky simply no longer holds it. */
  async goNear() {
    this.swapping = true;
    try {
      if (this.roomRef) this.roomRef.off('value', this.onRoomCb);
      if (this.castsRef) this.castsRef.off('child_added', this.onCastCb);
      try { if (this.meRef) this.meRef.child('gone').onDisconnect().cancel(); } catch (e) { }
      const shut = await SSNET.dbTxn('mp/rooms/' + this.code, (cur) => {
        if (!cur) return cur;
        if (cur.status !== 'waiting' || !cur.players || !cur.players[vsUid()] || Object.keys(cur.players).length !== 1) return cur;
        return null;
      });
      if (shut.value) {
        // taken — a person got the seat as the door was closing; play THEM
        try { if (this.meRef) this.meRef.child('gone').onDisconnect().set(true); } catch (e) { }
        this.roomRef.on('value', this.onRoomCb);
        this.castsRef.on('child_added', this.onCastCb);
        return;
      }
      const who = SS_RIVAL.persona(SS.prof.rating);
      const nearRec = {
        mode: this.room.mode, status: 'waiting', createdAt: this.room.createdAt || Date.now(), hostUid: vsUid(),
        seed: this.room.seed || Math.floor(Math.random() * 1e9), lang: this.room.lang || ssGameLang(),
        private: false, seekAt: this.room.seekAt || Date.now(),   // the shape a live worldwide room wears
        players: { [vsUid()]: vsSeat(0, this.room.hp) },
      };
      // the correspondence dress travels with the duel (3-cast turns, 150 hp)
      if (this.room.corr) { nearRec.corr = 1; nearRec.hp = this.room.hp || VS_CORR_HP; nearRec.turnCasts = 0; nearRec.movedAt = Date.now(); }
      SS_NEAR.seal(this.code, nearRec, { uid: who.uid, myPlays: [], plays: [], seen: 0 });
      this.near = true;
      this.db = SS_NEAR.api;
      this.room = null;   // re-primed by the near listener's first fire
      this.roomRef = this.db.ref('mp/rooms/' + this.code);
      this.meRef = this.db.ref('mp/rooms/' + this.code + '/players/' + vsUid());
      this.castsRef = this.db.ref('mp/rooms/' + this.code + '/casts');
      this.roomRef.on('value', this.onRoomCb);
      this.castsRef.on('child_added', this.onCastCb);
      this.fbRival = SS_RIVAL.spawn({ code: this.code, rating: who.rating, seatRating: who.rating, uid: who.uid, name: who.name, persona: who,
        pace: 'busy', roomDb: SS_NEAR.api, delay: VS_FB.ARRIVE_MS + Math.random() * VS_FB.ARRIVE_SPREAD });
    } finally { this.swapping = false; }
  }

  beginBattle() {
    // the duel formed — the rematch-refusal story (watch + belt) stands down
    if (this.rmBelt) { this.rmBelt.remove(false); this.rmBelt = null; }
    if (this.rmNoRef && this.rmNoCb) { this.rmNoRef.off('value', this.rmNoCb); this.rmNoCb = null; }
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
    // the duel's deal rides a PRIVATE stream (the rival engine's own
    // mulberry, same seed, same draw grammar — byte-identical boards): a
    // resumed board hands the stream back AT ITS TRUE POSITION, so the
    // refill after a resume deals the very tile a fresh replay would
    // (the global rng()'s position is lost across restarts — reading it
    // post-resume dealt off-stream tiles that a later reload re-dealt)
    this.deal = (typeof SS_RIVAL !== 'undefined' && SS_RIVAL.mkRng) ? SS_RIVAL.mkRng(this.room.seed || 1) : null;
    this.tweens.add({ targets: this.waitC, alpha: 0, duration: 400, onComplete: () => { this.waitC.setVisible(false); this.killTheater(); } });
    // everyone I cross swords with becomes a recent rival (one-tap add later)
    // — but a HELD seat is a rival not yet arrived: no note until they claim
    for (const p of this.others()) { if (!p.held) SSNET.FR.noteRival(p.id, p.name); }
    // the bell is answered — unless the challenged seat still stands held:
    // the challenger enters at once now (their first three), and the summons
    // must keep ringing until the friend truly claims (the accepting side
    // takes the bell down itself; the watcher stops re-ringing at the claim)
    if (this.challenged) {
      const chSeat = (this.room.players || {})[this.challenged.id];
      if (!chSeat || !chSeat.held) SSNET.FR.cancelChallenge(this.challenged.id);
    }
    setSeed(this.room.seed || 1);
    this.board = []; this.sel = [];
    // a correspondence duel re-entered mid-rhythm: my sigils ride my seat,
    // and my board is replayed move-for-move from my play script (the same
    // deterministic deal the rival engine mirrors) — the exact tiles I left
    // stand waiting, not a fresh opening deal. A near duel's script lives in
    // the note; a live-sky duel's rides my own seat (players/<me>/plays).
    this.restored = null;
    const seatMe = this.me();
    if (this.near || this.corr) {
      this.mySigils = (seatMe && Array.isArray(seatMe.sigils)) ? [...seatMe.sigils] : [];
      const script = this.near ? ((SS_NEAR.note(this.code) || {}).myPlays || [])
        : ((seatMe && Array.isArray(seatMe.plays)) ? seatMe.plays : []);
      if (script.length && typeof SS_RIVAL !== 'undefined' && SS_RIVAL.replayBoard) {
        try {
          this.restored = SS_RIVAL.replayBoard(PACK, this.room.seed || 1, script);
          if (this.restored && this.restored.rng) this.deal = this.restored.rng;   // the stream, at its true position
        } catch (e) { this.restored = null; }
      }
      this.refreshSigChip();
    }
    if (this.corr && !this.near) {
      // the duel enters the device's ledger — the home strip's row, the
      // cap's count, the seen watermark all live here from this moment
      if (seatMe && seatMe.gone) this.meRef.update({ gone: false }).catch(() => { });
      const foe = Object.entries(this.room.players || {}).find(([id]) => id !== vsUid());
      if (!VS_GAMES.get(this.code)) {
        VS_GAMES.add({ code: this.code, foe: foe ? { id: foe[0], name: foe[1].name } : { id: '', name: '…' },
          at: this.room.createdAt || Date.now(), turn: this.room.turnUid || null, status: 'active',
          held: foe && foe[1].held ? 1 : 0, seen: this.seenHigh || 0, settled: 0 });
      } else if (this.seenHigh) this.setSeenMark(this.seenHigh);   // casts that landed before the entry stood
    }
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
    // the theater's star motes on their slow orbit
    if (this.thMotes) {
      const l = this.L;
      for (const m of this.thMotes) {
        const a = m.__ph + time / 2400;
        m.x = l.x(0) + Math.cos(a) * m.__r;
        m.y = l.y(330) + Math.sin(a) * m.__r * 0.55;
        m.alpha = 0.5 + 0.4 * (0.5 + 0.5 * Math.sin(a * 3 + m.__ph * 5));
      }
    }
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
    if (this.restored) {
      // the standing board, tile for tile (the correspondence resume) — and
      // the pending bonus exactly where the replay left it
      this.pendingTier = this.restored.pendingTier || 0;
      this.restored.slots.forEach((s, i) => { if (s) this.spawnTile(i, s.ch, s.tier, true); });
      this.restored = null;
    } else this.fillBoard(true);
    this.state = 'pick';
    this.playRecap();   // the story of the turns you missed — the corr story sheet pre-sets my bar
    this.updatePanels();
    // the landing beat: YOUR TURN gets the old WEAVE!; a duel standing on
    // the rival's turn lands quietly (the board is a window, not a summons) —
    // and a landing with a tale to tell lets the story be the beat instead
    if (!(this.corr && this.recapQ.length) && (this.isMyTurn() || this.room.mode === 'timed')) {
      const go = ssTxt(this, l.x(0), l.y(400), 'WEAVE!', l.u(30), '#2fe0d0').setOrigin(0.5).setDepth(80).setScale(0.5);
      this.tweens.add({ targets: go, scale: 1, duration: 200, ease: 'Back.easeOut' });
      this.tweens.add({ targets: go, alpha: 0, delay: 900, duration: 300, onComplete: () => go.destroy() });
    }
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
      const bx = n === 1 ? -40 : -30, bw = n === 1 ? 200 : 110;
      const barBg = this.add.rectangle(l.u(bx), 0, l.u(bw), l.u(8), 0x1a2038).setOrigin(0, 0.5);
      const bar = this.add.rectangle(l.u(bx), 0, l.u(bw), l.u(8), 0xe66a6a).setOrigin(0, 0.5);
      // their health, always readable (9/8 card 03): the number wears the same
      // dress as your own row's, above the bar's far end — never a value to hunt
      const hpT = ssTxt(this, l.u(bx + bw), -l.u(n === 1 ? 22 : 20), '', l.u(n === 1 ? 12 : 10), '#f0e8d2').setOrigin(1, 0.5);
      const sub = ssTxt(this, l.u(bx), l.u(20), '', l.u(10), '#8a94c4', 'italic').setOrigin(0, 0.5);
      // their held sigils, worn openly: the house chip (your own sigChipB's
      // dress) — tap opens the same inspector, read from THEIR seat. A bot's
      // seat carries the very same array a phone writes, so the chip cannot
      // tell them apart, by construction.
      const chx = bx + bw - (n === 1 ? 26 : 20), chy = n === 1 ? 24 : 22;
      const chipB = this.add.rectangle(l.u(chx), l.u(chy), l.u(n === 1 ? 52 : 40), l.u(n === 1 ? 30 : 24), 0x151b33)
        .setStrokeStyle(l.u(1.5), 0x8c7a4a).setInteractive({ useHandCursor: true }).setVisible(false);
      const chipT = ssTxt(this, l.u(chx), l.u(chy), '', l.u(n === 1 ? 12 : 10), '#ffd77a').setOrigin(0.5).setVisible(false);
      chipB.on('pointerdown', () => this.openInspectFoe(p.id));
      c.add([av, nm, barBg, bar, hpT, sub, chipB, chipT]);
      this.oppC.add(c);
      this.oppPanels[p.id] = { c, bar, sub, nm, hpT, chipB, chipT, w: l.u(bw), bx: l.u(bx), shown: null, hpTween: null };
    });
  }

  updatePanels() {
    if (!this.room || !this.oppPanels) return;
    const HP = vsRoomHp(this.room);   // a correspondence duel breathes at 150 — the room record rules
    const me = this.me();
    // every bar speaks through the display engine (a drop plays as a strike);
    // while the turn story retells the missed blows it drives my bar itself
    if (me && !this.storyC) this.showHp('me', me.hp, HP);
    for (const p of this.others()) {
      const pan = this.oppPanels[p.id];
      if (!pan) continue;
      this.showHp(p.id, p.hp, HP);
      // their last word wears its price (the cast feed's dmg, matched by word
      // so a lagging feed can never mislabel a strike)
      const fl = this.foeLast && this.foeLast[p.id];
      const priced = p.lastWord ? ('· ' + p.lastWord + (fl && fl.word === p.lastWord ? '  −' + fl.dmg : '')) : '';
      // a correspondence seat is a standing chair — never "faded away"
      pan.sub.setText((p.gone && !this.corr) ? 'faded away' : p.hp <= 0 ? 'defeated' : priced);
      // their held sigils on the chip, live from the seat
      const sn = Array.isArray(p.sigils) ? p.sigils.length : 0;
      pan.chipB.setVisible(sn > 0);
      pan.chipT.setVisible(sn > 0).setText(sn ? '✦ ' + sn : '');
      pan.c.setAlpha(p.hp <= 0 || (p.gone && !this.corr) ? 0.35 : 1);
    }
    if (this.room.mode === 'timed') this.turnT.setText(this.state === 'sigil' ? 'choose your sigil' : 'weave freely — the clock burns');
    else if (this.corr) {
      // three casts to a turn (Skylar's 9/8 stamp): the line counts them out
      const who = this.room.players && this.room.players[this.room.turnUid];
      const tc = this.room.turnCasts | 0;
      this.turnT.setText(this.isMyTurn() ? SS_T(tc >= VS_TURN_CASTS - 1 ? 'vsTurnLast' : 'vsTurnOf', tc + 1)
        : (who ? SS_T(who.held ? 'vsWaitAnswer' : 'vsWeaving', who.name) : ''));
      this.turnT.setColor(this.isMyTurn() ? '#ffe9a8' : '#5a6390');
      if (this.turnT.width > this.L.u(380)) this.turnT.setFontSize(this.L.u(11.5));
      else this.turnT.setFontSize(this.L.u(14));
    } else {
      const who = this.room.players && this.room.players[this.room.turnUid];
      this.turnT.setText(this.isMyTurn() ? '✦ YOUR TURN ✦' : (who ? who.name + ' is weaving…' : ''));
      this.turnT.setColor(this.isMyTurn() ? '#ffe9a8' : '#5a6390');
    }
    const canAct = this.state === 'pick' && this.isMyTurn();
    this.castB.setAlpha(canAct ? (this.validWord() ? 1 : 0.45) : 0.25);
    this.scryB.setAlpha(canAct && this.scryCooldown <= 0 ? 1 : 0.25);
  }

  /* ---------- health you can read, wounds you can FEEL (9/8 card 03) ----------
     One display engine for every bar, yours included: the shown value chases
     the seat's truth, and a drop plays as a strike — the bar sinks eased, the
     lost slice ghosts pale before it fades, the number rolls down, the price
     speaks beside it — instead of teleporting on the next snapshot. The turn
     story drives your own bar through the same door when it retells a missed
     turn. Rectangles and text only: no new bakes, nothing tinted (the Canvas
     renderer's law). */
  hpState(id) {
    if (id === 'me') return (this.myHpD = this.myHpD || { shown: null, hpTween: null });
    return this.oppPanels ? this.oppPanels[id] : null;
  }
  showHp(id, hp, max) {
    const st = this.hpState(id);
    if (!st) return;
    const target = Math.max(0, Math.min(max, hp | 0));
    // equal: the running telling (if any) owns the paint; first sight or a
    // rebuilt panel (shown null) and any rise settle silently
    if (target === st.shown) { if (!st.hpTween) this.paintHp(id, target, max); return; }
    if (st.shown == null || target > st.shown) { st.shown = target; this.paintHp(id, target, max); return; }
    const from = st.shown;
    st.shown = target;   // the truth at once — the tween is only the telling
    if (st.hpTween) { st.hpTween.stop(); st.hpTween = null; }
    const o = { v: from };
    st.hpTween = this.tweens.add({
      targets: o, v: target, duration: 560, ease: 'Cubic.easeOut',
      onUpdate: () => this.paintHp(id, o.v, max),
      onComplete: () => { st.hpTween = null; this.paintHp(id, target, max); },
    });
    this.strikeFx(id, from, target, max);
  }
  paintHp(id, v, max) {
    const l = this.L, val = Math.max(0, Math.round(v));
    if (id === 'me') {
      if (!this.hpBar || !this.hpBar.active) return;
      this.hpBar.width = l.u(300) * clamp(v / max, 0, 1);
      this.hpT.setText(val + ' / ' + max);
      return;
    }
    const pan = this.oppPanels ? this.oppPanels[id] : null;
    if (!pan || !pan.bar.active) return;
    pan.bar.width = pan.w * clamp(v / max, 0, 1);
    pan.hpT.setText(val + ' / ' + max);
  }
  strikeFx(id, from, to, max) {
    const l = this.L, mine = id === 'me';
    const pan = mine ? null : (this.oppPanels ? this.oppPanels[id] : null);
    if (!mine && !pan) return;
    const bw = mine ? l.u(300) : pan.w;
    // the pale ghost of the slice just lost — it lingers a breath, then goes
    const gx = (mine ? this.hpBar.x : pan.bx) + bw * clamp(to / max, 0, 1);
    const gw = Math.max(l.u(1.5), bw * clamp((from - to) / max, 0, 1));
    const ghost = this.add.rectangle(gx, mine ? this.hpBar.y : 0, gw, l.u(mine ? 9 : 8), 0xfff0d0).setOrigin(0, 0.5).setAlpha(0.9);
    if (mine) ghost.setDepth(97); else pan.c.add(ghost);   // 97: above the story veil, above the lifted bar
    this.tweens.add({ targets: ghost, alpha: 0, duration: 700, delay: 140, onComplete: () => ghost.destroy() });
    // the bar flinches (its own tween, its own target — never a shared one)
    const bar = mine ? this.hpBar : pan.bar;
    this.tweens.add({ targets: bar, alpha: { from: 0.35, to: 1 }, duration: 320, ease: 'Quad.easeOut' });
    // …and the price speaks beside the number
    const px = mine ? this.hpT.x : pan.c.x + pan.bx + pan.w;
    const py = (mine ? this.hpT.y : pan.c.y - l.u(22)) - l.u(4);
    const t = ssTxt(this, px, py, '−' + Math.max(1, Math.round(from - to)), l.u(mine ? 15 : 14), '#ff8a8a').setOrigin(1, 1).setDepth(97)
      .setShadow(0, 0, '#802020', l.u(6), true, true);
    this.tweens.add({ targets: t, y: py - l.u(22), alpha: 0, duration: 1150, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
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
    // the private deal stream when one stands (correspondence resume law);
    // the global seeded stream as ever otherwise — same mulberry, same draws
    const draw = (arr) => (this.deal ? this.deal.pick(arr) : rpick(arr));
    for (let i = 0; i < 16; i++) {
      if (this.board[i]) continue;
      let ch = draw(BAG);
      if (this.boardVowels() < 5 && !VOWELS.includes(ch)) ch = draw(['a', 'e', 'i', 'o', 'u']);
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
    // the value chip rides the solo board's baked glyphs now (same inks, same
    // arm's-length 15px) — so a sigil-raised letter wears the same warm spark
    // here, and the TRUE worth is what prints (Skylar 9/1)
    const val = this.add.image(l.u(24), l.u(21), this.chipKey(ch, tier))
      .setDisplaySize(l.u(30), l.u(20));
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
  // per-letter sigil bonuses — the same one data-driven place the solo board
  // reads (ssSigilLetterAdd over SS_SIGILS `lb`), fed my held list
  sigilLetterAdd(ch) { return ssSigilLetterAdd(this.mySigils, ch); }
  // the chip's texture: the TRUE worth (letter + tier + held sigils); a raised
  // letter prints warmer and wears the spark, exactly as in solo
  chipKey(ch, tier) {
    if (this.sigilLetterAdd(ch) > 0) return ssGlyphVal(this, this.tileVal(ch, tier) + this.sigilLetterAdd(ch), SS_BUFF_VINK[tier], true);
    return ssGlyphVal(this, this.tileVal(ch, tier), SS_TILE_VINK[tier]);
  }
  // the held set changed MID-DUEL (a sigil every third cast) and this board
  // persists — every standing chip repaints to the true worth
  repaintChips() {
    const l = this.L;
    for (const s of this.board) {
      if (!s || !s.c.active) continue;
      s.val.setTexture(this.chipKey(s.ch, s.tier)).setDisplaySize(l.u(30), l.u(20));
    }
  }
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
        s.val.setTexture(this.chipKey(s.ch, 0)).setDisplaySize(l.u(30), l.u(20));
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
    let base = 0, starMult = 1, letters = 0;
    for (const s of tiles) {
      // the chip's own arithmetic (letter + tier + held-sigil letter bonuses)
      // — the board and the cast can never differ
      base += this.tileVal(s.ch, s.tier) + this.sigilLetterAdd(s.ch);
      if (s.tier === 2) starMult = 1.5;
      letters += s.ch.length;
    }
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
    if (this.storyC) this.storyDone(true);   // a cast takes up the duel — the tale yields
    this.storyWaive();                       // …and acting waives one still forming
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
      const seatHp = vsRoomHp(this.room);
      await this.castsRef.push({ uid: vsUid(), name: vsName(), word: word.toUpperCase(), dmg, target: target.id, at: Date.now() });
      await this.db.txn('mp/rooms/' + this.code + '/players/' + target.id + '/hp', (cur) => Math.max(0, (cur == null ? seatHp : cur) - dmg));
      const myCasts = ((this.me() || {}).casts | 0) + 1;
      const up = { lastWord: word.toUpperCase(), casts: myCasts, dealt: ((this.me() || {}).dealt | 0) + dmg };
      // a live-sky correspondence seat carries its own play script — the
      // board replay on the next visit re-lives exactly these indices
      if (this.corr && !this.near) up.plays = [...(((this.me() || {}).plays) || []), { c: used }];
      await this.meRef.update(up);
      // turn bookkeeping (turns + battleground): a transaction counts the
      // cast against the standing turn and flips it when the three are woven
      let handed = false;
      if (this.room.mode !== 'timed') {
        const tr = await this.db.txn('mp/rooms/' + this.code, (cur) => {
          if (!cur || cur.status !== 'active') return undefined;
          return vsTurnStep(cur, vsUid());
        });
        handed = !!(tr && tr.value && tr.value.turnUid && tr.value.turnUid !== vsUid());
      }
      // a near duel writes its move into the note's script — and its store is
      // synchronous truth while the listener lands a beat later: refresh, so
      // the next tap reads the turn as it truly stands
      if (this.near) {
        const n = SS_NEAR.note(this.code) || {};
        SS_NEAR.setNote(this.code, { myPlays: [...(n.myPlays || []), { c: used }] });
        const fresh = SS_NEAR.room(this.code);
        if (fresh) this.room = fresh;
      }
      if (handed && this.corr) this.turnDoneBeat();
      for (const i of used) { if (this.board[i]) { this.board[i].c.destroy(); this.board[i] = null; } }
      this.expireSpecials();               // unspent bonuses fade before the new reward drops
      if (letters >= 7) this.pendingTier = 2;
      else if (letters >= 5) this.pendingTier = 1;
      if (this.pendingTier && this.hasSigil('forge')) this.pendingTier = 2;
      if (this.pendingTier) SFX.forge();
      this.fillBoard(false);
      this.layoutLine();
      // roguelite pick-3 every N of my casts — N is the cadence table's
      // versus row (data.js SS_CADENCE; the rival engine reads the same)
      // the rival's client may have settled the room on my wound before my
      // tiles landed: the end screen is already up, and nothing here may
      // reopen the board over it (REMATCH reads state === 'done')
      if (this.state === 'done') return;
      if (myCasts % ((SS_CADENCE.versus && SS_CADENCE.versus.casts) || 3) === 0) this.showSigilPick();
      else this.state = 'pick';
      this.checkEnd();
    } catch (e) {
      if (this.state !== 'done') this.state = 'pick';
    }
    this.updatePanels();
  }

  // the turn's three are woven: one gold beat says the duel now waits on
  // them — cast in their own time, answered in theirs (said in five tongues)
  turnDoneBeat() {
    const l = this.L;
    const foe = this.others()[0];
    const t = ssTxt(this, l.x(0), l.y(342), SS_T('vsTurnDone', foe ? foe.name : ''), l.u(12.5), '#ffe9a8', 'italic').setOrigin(0.5).setDepth(80)
      .setShadow(0, 0, '#c9b676', l.u(8), true, true);
    for (let fs = 12.5; t.width > l.u(370) && fs > 9; fs -= 0.5) t.setFontSize(l.u(fs));
    t.setAlpha(0).setY(t.y + l.u(10));
    this.tweens.add({ targets: t, alpha: 1, y: t.y - l.u(10), duration: 320, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, delay: 2800, duration: 500, onComplete: () => t.destroy() });
  }
  scry() {
    if (this.storyC) this.storyDone(true);   // the reroll takes up the duel too
    this.storyWaive();
    if (this.state !== 'pick' || !this.isMyTurn() || this.scryCooldown > 0) return;
    SFX.ensure(); SFX.noise(0.4, 600, 1, 0.12, 1800);
    this.unselectFrom(0);
    for (let i = 0; i < 16; i++) { if (this.board[i]) { this.board[i].c.destroy(); this.board[i] = null; } }
    this.fillBoard(false);
    if (this.near) {
      const n = SS_NEAR.note(this.code) || {};
      SS_NEAR.setNote(this.code, { myPlays: [...(n.myPlays || []), { s: 1 }] });
    } else if (this.corr) {
      const me = this.me() || {};
      this.meRef.update({ plays: [...(me.plays || []), { s: 1 }] }).catch(() => { });
    }
    if (this.room.mode === 'timed') { this.scryCooldown = 6; return; }
    // turn modes: the reroll is your whole turn — in correspondence too, the
    // three casts go with it (the reroll is your action, as it always was)
    this.db.txn('mp/rooms/' + this.code, (cur) => {
      if (!cur || cur.status !== 'active') return undefined;
      return vsTurnStep(cur, vsUid(), true);
    }).then(() => {
      if (this.near) { const fresh = SS_NEAR.room(this.code); if (fresh) this.room = fresh; }
      if (this.corr) this.turnDoneBeat();
      this.updatePanels();
    }).catch(() => { });
  }

  // the seen watermark, one voice for two skies: a near duel's rides its
  // note, a live correspondence duel's rides the device ledger
  seenMark() {
    if (this.near) return Number((SS_NEAR.note(this.code) || {}).seen) || 0;   // never |0 — an epoch-ms stamp shears at 32 bits
    const g = VS_GAMES.get(this.code);
    return g ? Number(g.seen) || 0 : 0;
  }
  setSeenMark(at) {
    this.seenHigh = Math.max(this.seenHigh || 0, at);   // casts can land before the ledger entry exists (a joiner's first attach) — beginBattle flushes
    if (this.near) SS_NEAR.setNote(this.code, { seen: at });
    else if (VS_GAMES.get(this.code)) VS_GAMES.mark(this.code, { seen: at });
  }
  onCast(key, cast) {
    if (!cast || this.seenCasts[key]) return;
    this.seenCasts[key] = true;
    // my own casts off the feed: the turn story's opening verse (the three I
    // wove before stepping away) is retold from these at the landing
    if (cast.uid === vsUid()) { this.histMine.push(cast); return; }
    // their last word wears its price on the panel (matched by word there)
    this.foeLast[cast.uid] = { word: cast.word, dmg: cast.dmg | 0 };
    // a correspondence duel re-entered: everything under the seen watermark
    // is history and stays quiet; the truly-new replies move the mark — and
    // when they land before the board does (the landing, the theater), they
    // queue as the RECAP: the story of the turn you missed, told at arrival.
    // ⚠ this.corr is learned from the first room snapshot, which can land
    // AFTER these historical casts (child_added fires on attach, this.room
    // may still be null) — so the watermark and the buffer never gate on it;
    // only the LEDGER write (setSeenMark) and the recap PLAYBACK do, and both
    // know the truth by the time they run (setNote/VS_GAMES guard themselves;
    // playRecap runs at the landing, when this.corr is set)
    if (cast.at) {
      if (cast.at <= this.seenMark()) { this.foeSeenAt = Math.max(this.foeSeenAt || 0, cast.at); return; }
      this.setSeenMark(cast.at);
    }
    // a correspondence landing keeps buffering until its tale is told — the
    // casts feed syncs on its own clock, and an instant re-entry can land
    // before the history drains (the story sheet must miss nothing)
    if (!this.revealed || this.state === 'wait' || this.state === 'rise' || (this.corr && !this.storyTold)) {
      this.recapQ.push(cast);   // told at the landing IF this is correspondence (playRecap gates)
      return;   // under the theater the sky is covered — no flash for a blow you were never shown
    }
    this.castStory(cast);
  }
  castStory(cast) {
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
  // the landing tells the missed story: a correspondence duel gets the STORY
  // SHEET (every word whole, every price, staged — 9/8 card 03); a live
  // room's rise-buffered blows keep the old floats (the arcade grammar)
  playRecap() {
    if (this.corr && !this.storyTold && this.state !== 'done') {
      // one breath for the feed to drain (child_added syncs on its own
      // clock — an instant re-entry can land ahead of the history), then
      // the whole tale in one telling
      this.storyPend = this.time.delayedCall(450, () => {
        this.storyPend = null;
        this.storyTold = true;   // from here, live blows speak as floats
        const q = this.recapQ;
        this.recapQ = [];
        if (!q.length || this.state === 'done' || !this.sys.isActive()) return;
        q.sort((a, b) => (a.at || 0) - (b.at || 0));
        this.turnStory(q);
      });
      return;
    }
    const q = this.recapQ;
    this.recapQ = [];
    if (!q.length) return;
    q.sort((a, b) => (a.at || 0) - (b.at || 0));
    q.forEach((cast, i) => this.time.delayedCall(500 + i * 950, () => { if (this.sys.isActive() && this.state !== 'done') this.castStory(cast); }));
  }

  /* ---------- the turn story (9/8 card 03) ----------
     A correspondence duel re-entered retells the turn you missed as a story,
     not a blink: every word the rival cast, whole, with the price it took —
     staged one strike at a time onto your own bar, which opens where the
     turn found it and sinks to the truth. Your own last turn opens the tale
     (dim), so the exchange reads whole. It stands until tapped: a tap
     mid-telling completes it, the next takes up the duel. tryCast/scry/
     demoStep sweep it themselves, so every existing door still opens. */
  turnStory(q) {
    const l = this.L;
    const me = this.me() || {};
    const HP = vsRoomHp(this.room);
    const t0 = q[0].at || 0;
    // my last turn: my casts between their last already-seen word and their
    // first untold one — the three I wove before stepping away
    const mine = this.histMine.filter((c) => (c.at || 0) > (this.foeSeenAt || 0) && (c.at || 0) < t0).slice(-VS_TURN_CASTS);
    const foeName = (q[0] && q[0].name) || ((this.others()[0] || {}).name) || '';
    const inc = q.reduce((a, c) => a + (c.target === vsUid() ? (c.dmg | 0) : 0), 0);
    // rewind my bar to where the turn found it — the story sinks it back
    const pre = Math.min(HP, Math.max(0, me.hp | 0) + inc);
    if (this.myHpD && this.myHpD.hpTween) this.myHpD.hpTween.stop();
    this.myHpD = { shown: pre, hpTween: null };
    this.paintHp('me', pre, HP);
    // the window sits BELOW your hp row (the story's whole point is watching
    // that bar sink — the lift keeps it lit above the veil); tall tales
    // tighten their rows rather than crowd the CAST button
    const TH = q.length > 4 ? 26 : 34;
    const winH = 52 + (mine.length ? 26 : 0) + 26 + q.length * TH + 12 + 24 + 22;
    const top = Math.max(396, Math.min(430, 764 - winH));
    const c = this.storyC = this.add.container(0, 0).setDepth(95);
    this.storyEv = [];
    this.storyLift(true);
    const veil = this.add.image(l.W / 2, l.H / 2, 'veil').setDisplaySize(l.W, l.H).setAlpha(0).setInteractive();
    this.tweens.add({ targets: veil, alpha: 0.78, duration: 250 });
    const win = this.add.image(l.x(0), l.y(top + winH / 2), 'endpanel').setDisplaySize(l.u(372), l.u(winH)).setInteractive();
    const tk = ssGoldTex(this, SS_T('vsStoryTitle'), 16);
    const tsc = Math.min(1, 300 / tk.w);
    c.add([veil, win, this.add.image(l.x(0), l.y(top + 30), tk.key).setDisplaySize(l.u(tk.w * tsc), l.u(tk.h * tsc))]);
    let y = top + 52;
    if (mine.length) {
      // your own three, one dim self-labeled line — the exchange reads whole
      const ml = ssTxt(this, l.x(0), l.y(y + 13), SS_T('vsStoryYours') + '  ·  ' + mine.map((cast) => (cast.word || '') + ' −' + (cast.dmg | 0)).join('  ·  '),
        l.u(10.5), '#8a94c4').setOrigin(0.5);
      for (let fs = 10.5; ml.width > l.u(336) && fs > 8; fs -= 0.5) ml.setFontSize(l.u(fs));
      c.add(ml);
      y += 26;
    }
    const th = ssTxt(this, l.x(0), l.y(y + 13), '—  ' + SS_T('vsStoryTheirs', foeName) + '  —', l.u(11), '#c9b676').setOrigin(0.5).setLetterSpacing(l.u(1.5))
      .setShadow(0, 0, '#c9b676', l.u(6), true, true);
    for (let fs = 11; th.width > l.u(330) && fs > 8; fs -= 0.5) th.setFontSize(l.u(fs));
    c.add(th);
    y += 26;
    let run = pre;
    const rows = [];
    for (const cast of q) {
      const ry = y + TH / 2;
      const w = ssTxt(this, l.x(-140), l.y(ry), cast.word || '', l.u(15), '#f0e8d2').setOrigin(0, 0.5).setAlpha(0);
      const d = ssTxt(this, l.x(140), l.y(ry), '−' + (cast.dmg | 0), l.u(15), '#ff8a8a').setOrigin(1, 0.5).setAlpha(0)
        .setShadow(0, 0, '#802020', l.u(5), true, true);
      const toMe = cast.target === vsUid();
      if (toMe) run = Math.max(0, run - (cast.dmg | 0));
      rows.push({ w, d, toMe, after: run });
      c.add([w, d]);
      y += TH;
    }
    y += 12;
    const took = ssTxt(this, l.x(0), l.y(y + 8), SS_T('vsStoryTook', inc), l.u(11.5), '#d8d2bd', 'italic').setOrigin(0.5).setAlpha(0);
    const go = ssTxt(this, l.x(0), l.y(top + winH - 15), SS_T('vsStoryGo'), l.u(9.5), '#5a6390', 'italic').setOrigin(0.5).setAlpha(0);
    c.add([took, go]);
    this.storyLand = { rows, took, go, HP };
    // the strikes land one at a time, a breath after the window rises
    rows.forEach((r, i) => this.storyEv.push(this.time.delayedCall(650 + i * 820, () => this.storyRow(i))));
    this.storyEv.push(this.time.delayedCall(650 + rows.length * 820 + 100, () => this.storyRest()));
    const dismiss = () => { SFX.ui(); this.storyDone(false); };
    veil.on('pointerdown', dismiss);
    win.on('pointerdown', dismiss);
  }
  storyRow(i) {
    const s = this.storyLand;
    if (!s || !this.storyC) return;
    const r = s.rows[i];
    if (!r || r.done) return;
    r.done = true;
    const l = this.L;
    for (const o of [r.w, r.d]) { o.setAlpha(1); o.y += l.u(8); this.tweens.add({ targets: o, y: o.y - l.u(8), duration: 260, ease: 'Back.easeOut' }); }
    SFX.impact();
    if (r.toMe) { this.showHp('me', r.after, s.HP); this.cameras.main.shake(130, 0.004); }
  }
  storyRest() {
    const s = this.storyLand;
    if (!s || !this.storyC) return;
    this.tweens.add({ targets: [s.took, s.go], alpha: 1, duration: 300 });
  }
  // while the tale is told, your hp row stays LIT above the veil — the sheet
  // sits below it, so the sinking bar and the words read as one scene
  storyLift(on) {
    const d = on ? 96 : 0;
    for (const o of [this.hpBarBg, this.hpBar, this.hpT, this.myName, this.youT]) { if (o && o.active) o.setDepth(d); }
  }
  // acting before the tale is told waives it (the harness and the solver
  // reach the doors under the veil; a finger never can) — the watermark
  // already stands, so nothing is lost but the telling
  storyWaive() {
    this.storyTold = true;
    if (this.storyPend) { this.storyPend.remove(false); this.storyPend = null; this.recapQ = []; }
  }
  // fast = sweep it whole (a cast, the demo, the end): land everything and go
  storyDone(fast) {
    const s = this.storyLand;
    if (!this.storyC) return;
    const pending = s && s.rows.some((r) => !r.done);
    if (pending) {
      // complete the telling in one stroke — no repeated shakes, just truth
      for (const ev of this.storyEv || []) ev.remove(false);
      this.storyEv = [];
      for (const r of s.rows) { if (!r.done) { r.done = true; r.w.setAlpha(1); r.d.setAlpha(1); } }
      this.storyRest();
      if (this.myHpD && this.myHpD.hpTween) { this.myHpD.hpTween.stop(); }
      this.myHpD = { shown: null, hpTween: null };
      const me0 = this.me();
      if (me0) this.showHp('me', me0.hp, s.HP);
      if (!fast) return;   // the tale stands, told whole — the next tap closes
    }
    for (const ev of this.storyEv || []) ev.remove(false);
    this.storyEv = [];
    const c = this.storyC;
    this.storyC = null; this.storyLand = null;
    this.storyLift(false);
    const me = this.me();
    if (me && this.room) this.showHp('me', me.hp, vsRoomHp(this.room));   // the truth owns the bar again
    if (fast) c.destroy();
    else this.tweens.add({ targets: c, alpha: 0, duration: 200, onComplete: () => { if (c.active) c.destroy(); } });
    this.updatePanels();
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
        this.repaintChips();   // the duel board persists — a letter bonus shows at once
        if (this.meRef) this.meRef.update({ sigils: this.mySigils }).catch(() => { });
        // the pick joins the play script: a resumed board replays the deal
        // with the sigil held (a forge-lifted refill must re-deal as a star)
        if (this.near) {
          const n = SS_NEAR.note(this.code) || {};
          SS_NEAR.setNote(this.code, { myPlays: [...(n.myPlays || []), { g: sg.id }] });
        } else if (this.corr && this.meRef) {
          const me = this.me() || {};
          this.meRef.update({ plays: [...(me.plays || []), { g: sg.id }] }).catch(() => { });
        }
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
  // the rival's powers, inspected through the very same window (9/8 card 03):
  // read live from THEIR seat — name, glyph, what each one does. A bot's seat
  // carries the same array a phone writes, so the door cannot tell them apart.
  openInspectFoe(id) {
    if (this.inspectP || this.state !== 'pick' || this.storyC) return;
    const p = ((this.room && this.room.players) || {})[id];
    const sigils = (p && Array.isArray(p.sigils)) ? p.sigils : [];
    if (!sigils.length) return;
    SFX.ensure(); SFX.ui();
    this.inspectP = ssSigilPanel(this, {
      sigils, title: 'vsTheirSigils', titleArg: p.name,
      onClose: () => { this.inspectP = null; },
    });
  }

  checkEnd(timeUp) {
    if (!this.room || this.room.status !== 'active') return;
    // a HELD seat is a rival not yet arrived — nothing settles while a chair
    // stands empty-but-promised (a duel cannot be won against an unanswered
    // summons; the abandon door takes such a duel back for free instead)
    if (Object.values(this.room.players || {}).some((p) => p && p.held)) return;
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
    this.killTheater();   // a duel decided under the searching veil still ends honestly
    if (this.waitC && this.waitC.visible) { this.waitC.setVisible(false); }
    if (this.storyC) this.storyDone(true);      // a decided duel outranks the tale
    this.storyWaive();
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
    // a correspondence duel settles its Elo exactly once — the note (near) or
    // the ledger (live sky) remembers: the scene is reborn on every visit, so
    // the record must carry the guard, not the scene (a decided duel left
    // unread for days settles at the boot/watcher sweep instead)
    const nearNote = this.near ? (SS_NEAR.note(this.code) || {}) : null;
    const ledger = (!this.near && this.corr) ? VS_GAMES.get(this.code) : null;
    if (this.room.winnerUid && !(nearNote && nearNote.settled) && !(ledger && ledger.settled)) {
      const foes = Object.entries(this.room.players || {}).filter(([id]) => id !== vsUid()).map(([, p]) => p);
      if (foes.length) {
        const oppAvg = foes.reduce((a, p) => a + (Number.isFinite(p.rating) ? p.rating : SS_RATING.BASE), 0) / foes.length;
        rd = SS_RATING.duel(oppAvg, won ? 1 : 0);
      }
      if (nearNote) SS_NEAR.setNote(this.code, { settled: 1 });
      if (ledger) VS_GAMES.mark(this.code, { settled: 1 });
    }
    // the end is SEEN: the strip row leaves, the slot frees, the summons dies
    if (nearNote) SS_NEAR.setNote(this.code, { myEnd: 1 });
    if (this.corr && !this.near) VS_GAMES.remove(this.code);
    VS_PEND.remove(this.code);
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
    this.rematchT = ssTxt(this, l.x(0), l.y(455), '', l.u(16), BTN_INK()).setOrigin(0.5).setDepth(151);
    // the U+2694 text died in the 9/10 sweep — the drawn blades ride beside the
    // label instead, re-laid after EVERY setText (statuses hide the glyph)
    this.rematchG = this.add.image(l.x(0), l.y(455), vsSwordsTex(this)).setDisplaySize(l.u(18), l.u(18)).setDepth(151);
    this.dressRematch = (label, glyph) => {
      if (!this.rematchT || !this.rematchT.active) return;
      this.rematchT.setText(label);
      let fs = 16;
      for (; this.rematchT.width > l.u(glyph ? 176 : 200) && fs > 10; fs -= 0.5) this.rematchT.setFontSize(l.u(fs));
      if (glyph && this.rematchG && this.rematchG.active) {
        this.rematchT.setX(l.x(0) + l.u(11));
        this.rematchG.setVisible(true).setPosition(this.rematchT.x - this.rematchT.width / 2 - l.u(13), l.y(455));
      } else {
        this.rematchT.setX(l.x(0));
        if (this.rematchG && this.rematchG.active) this.rematchG.setVisible(false);
      }
    };
    this.dressRematch('REMATCH', true);
    this.rematchB.on('pointerdown', () => { SFX.ui(); this.doRematch(); });
    const homeB = this.add.image(l.x(0), l.y(525), ssBtn(this, true, 220, 52)).setDisplaySize(l.u(220), l.u(52)).setInteractive({ useHandCursor: true }).setDepth(151);
    const homeT = ssTxt(this, l.x(0), l.y(525), 'RETURN', l.u(15), '#9fb0e8').setOrigin(0.5).setDepth(151);
    items.push(this.rematchB, this.rematchT, this.rematchG, homeB, homeT);
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
    // the app closing at this screen is a decline too (the 9/8 stamp) — the
    // armed word lands by itself and frees a waiting rival; pressing either
    // rematch door cancels the arm (doRematch)
    if (!this.near && this.roomRef) {
      try {
        this.rmNoDisc = this.roomRef.child('rematchNo').onDisconnect();
        this.rmNoDisc.set({ by: vsUid(), name: vsName(), at: Date.now() });
      } catch (e) { this.rmNoDisc = null; }
    }
    if (this.room.rematchNo && this.room.rematchNo.by !== vsUid()) this.showRematchGone(this.room.rematchNo);
    else if (this.room.rematch) this.showRematchCall();
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
    if (!this.rematchT || this.rmGone || this.rematchDead || this.rematchPulse) return;
    this.dressRematch('ANSWER THE REMATCH', true);
    // the call can land during the winner's fanfare entrance (the pair still
    // rising at alpha 0) — the pulse pins its own range (from 1) so it never
    // breathes around the entrance's zero. NEVER killTweensOf here: the
    // entrance is ONE shared tween, and killing it for this pair freezes
    // every other end-screen item (RETURN included) at alpha 0.
    this.rematchPulse = this.tweens.add({ targets: [this.rematchB, this.rematchT, this.rematchG].filter(Boolean), alpha: { from: 1, to: 0.55 }, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // the quieter door beside it (9/8 card 02): a rematch can be REFUSED —
    // the ✕ says so out loud, and the waiting rival is freed at once
    if (!this.near && !this.rmDeclB) {
      const l = this.L;
      this.rmDeclB = this.add.image(l.x(152), l.y(455), ssBtn(this, true, 48, 48)).setDisplaySize(l.u(48), l.u(48)).setInteractive({ useHandCursor: true }).setDepth(151).setAlpha(0);
      this.rmDeclT = ssTxt(this, l.x(152), l.y(455), '✕', l.u(16), '#8a94c4').setOrigin(0.5).setDepth(151).setAlpha(0);
      ssHitPad(this.rmDeclB, 44);
      this.rmDeclB.on('pointerdown', () => this.declineRematch());
      this.overlayC.add([this.rmDeclB, this.rmDeclT]);
      this.tweens.add({ targets: [this.rmDeclB, this.rmDeclT], alpha: 1, duration: 300 });
    }
  }
  // the ✕ beside ANSWER THE REMATCH: one honest word on the room — the
  // waiting side watches it and is freed the moment it lands
  declineRematch() {
    if (this.state !== 'done' || this.rematchBusy || this.rmGone || this.rematchDead || !this.room) return;
    SFX.ui();
    this.rematchDead = true;
    SSNET.dbSet('mp/rooms/' + this.code + '/rematchNo', { by: vsUid(), name: vsName(), at: Date.now() }).catch(() => { });
    try { if (this.rmNoDisc) { this.rmNoDisc.cancel(); this.rmNoDisc = null; } } catch (e) { }
    if (this.rematchPulse) { this.rematchPulse.stop(); this.rematchPulse = null; }
    this.rmFadeDoors();
  }
  // the doors leave: input off at once, a 400ms fade, then hidden — never
  // destroyed mid-screen and never killTweensOf (both would break the
  // fanfare's ONE shared entrance tween for every other end-screen item)
  rmFadeDoors() {
    const dead = [this.rematchB, this.rematchT, this.rematchG, this.rmDeclB, this.rmDeclT].filter(Boolean);
    dead.forEach((o) => { if (o.input) o.input.enabled = false; });
    this.tweens.add({ targets: dead, alpha: 0, duration: 400, onComplete: () => dead.forEach((o) => { if (o.active) o.setVisible(false); }) });
    this.rematchB = null; this.rematchT = null; this.rematchG = null; this.rmDeclB = null; this.rmDeclT = null;
  }
  /* the rival moved on (their ✕, their leaving, their app closing) — the
     rematch door fades honestly instead of sealing a wait nobody will ever
     answer (Skylar 9/8: "no indication that they refused") */
  showRematchGone(v) {
    if (this.rmGone || this.state !== 'done' || !this.rematchB) return;
    this.rmGone = true;
    if (this.rematchPulse) { this.rematchPulse.stop(); this.rematchPulse = null; }
    this.rmFadeDoors();
    const l = this.L;
    const name = (v && v.name) || ((this.others()[0] || {}).name) || '';
    this.rmGoneT = ssTextBlock(this, l.x(0), l.y(455), SS_T('vsRmMoved', name), {
      fontSize: l.u(12) + 'px', color: '#d8d2bd', fontStyle: 'italic', shadow: true,
      wrapW: l.u(340), align: 'center', ox: 0.5, oy: 0.5,
    }).setDepth(151).setAlpha(0);
    this.overlayC.add(this.rmGoneT);
    // the line waits out most of the door's fade — a dissolve, not a collision
    this.tweens.add({ targets: this.rmGoneT, alpha: 1, duration: 400, delay: 300 });
  }
  async doRematch() {
    if (this.rematchBusy || this.state !== 'done' || !this.room || this.rematchDead || this.rmGone) return;
    // the rival already moved on — say so instead of sealing a doomed wait
    if (this.room.rematchNo && this.room.rematchNo.by !== vsUid()) { this.showRematchGone(this.room.rematchNo); return; }
    // a rematch seals a fresh ongoing duel — the five-game cap holds here too
    if (this.room.corr && vsCapSheet(this)) return;
    this.rematchBusy = true;
    try { if (this.rmNoDisc) { this.rmNoDisc.cancel(); this.rmNoDisc = null; } } catch (e) { }
    this.rematchT && this.dressRematch('SEALING…', false);
    try {
      if (this.near) {
        // the same rival answers on this device: a fresh near room, the old
        // one (seen, decided) swept behind us — the busy rhythm carries over
        const n = SS_NEAR.note(this.code) || {};
        const persona = (typeof SS_RIVAL !== 'undefined') ? SS_RIVAL.circle().find((p) => p.uid === n.uid) : null;
        if (!persona) throw new Error('cold');
        const code = vsCode();
        SS_RIVAL.stopFor(this.code);
        if (this.roomRef) this.roomRef.off('value', this.onRoomCb);
        if (this.castsRef) this.castsRef.off('child_added', this.onCastCb);
        SS_NEAR.purge(this.code);
        SS_NEAR.seal(code, {
          mode: 'turns', status: 'waiting', createdAt: Date.now(), hostUid: vsUid(),
          seed: Math.floor(Math.random() * 1e9), lang: this.room.lang || 'en',
          corr: 1, hp: VS_CORR_HP, turnCasts: 0, movedAt: Date.now(),
          players: { [vsUid()]: vsSeat(0, VS_CORR_HP) },
        }, { uid: persona.uid, myPlays: [], plays: [], seen: 0 });
        SS_RIVAL.spawn({ code, rating: persona.rating, seatRating: persona.rating, uid: persona.uid, name: persona.name, persona,
          pace: 'busy', roomDb: SS_NEAR.api, delay: 1600 + Math.random() * 2400 });
        this.scene.start('vsbattle', { code });
        return;
      }
      let dest = this.room.rematch;
      if (!dest) {
        const code = vsCode();
        const rec = {
          mode: this.room.mode, status: 'waiting', createdAt: Date.now(), hostUid: vsUid(),
          seed: Math.floor(Math.random() * 1e9),
          lang: this.room.lang || 'en',   // a rematch keeps the tongue the duel began in
          players: { [vsUid()]: vsSeat(0, this.room.corr ? VS_CORR_HP : 0) },
        };
        if (this.room.corr) { rec.corr = 1; rec.hp = VS_CORR_HP; rec.turnCasts = 0; rec.movedAt = Date.now(); }
        await SSNET.dbSet('mp/rooms/' + code, rec);
        // one rematch room per battle — a transaction settles simultaneous pressers
        const r = await SSNET.dbTxn('mp/rooms/' + this.code + '/rematch', (cur) => (cur == null ? code : undefined));
        dest = (r && r.value) || code;
        if (dest !== code) SSNET.dbSet('mp/rooms/' + code, null).catch(() => { });
      }
      const mine = await vsJoinRoom(dest); // idempotent — true if we are already seated
      if (!mine) { this.rematchBusy = false; this.rematchT && this.dressRematch('THE SEAL IS COLD', false); return; }
      // the wait ahead knows whom it waits for: the old room carries the
      // refusal word, the foe's name dresses the freed-notice, the belt arms
      const foe0 = this.others()[0] || null;
      this.scene.start('vsbattle', { code: dest, rematchWait: { from: this.code, foe: foe0 ? { id: foe0.id, name: foe0.name } : null } });
    } catch (e) {
      this.rematchBusy = false;
      this.rematchT && this.dressRematch('REMATCH', true);
    }
  }

  /* ---------- demo: the solver duels itself ---------- */
  demoStep() {
    if (this.storyC) this.storyDone(true);   // the solver reads fast
    this.storyWaive();
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
    this.bannerC = null; this.shown = null; this.accepting = false; this.bannerKind = null;
    this.toastY = 0;
    this.pendWatch = {};
    this.frOff = SSNET.FR.on(() => this.refresh());
    // banners age out and "suppressed" flips as scenes come and go; the
    // standing summonses are kept honest on the same beat
    this.time.addEvent({ delay: 1000, loop: true, callback: () => { this.refresh(); this.watchPending(); } });
    this.events.once('shutdown', () => {
      if (this.frOff) { this.frOff(); this.frOff = null; }
      for (const code of Object.keys(this.pendWatch)) this.unwatchPend(code);
    });
    if (FRDEMO === 'guest') this.time.addEvent({ delay: 1500, loop: true, callback: () => { const inv = SSNET.FR.pending()[0]; if (inv && !this.accepting) this.accept(inv); } });
  }

  /* ---------- the standing summonses (9/3 card 03) ----------
     A challenge no longer waits at a screen — it stands in a pending row
     while the challenger roams, and THIS overlay is the row's keeper
     wherever they are: it re-rings the bell every two minutes, lights the
     room the moment the friend takes the seat (a txn, so a racing starter
     cannot double-light it), banners "%1 answers", and marks a summons
     declined when the bell is taken down unanswered. */
  watchPending() {
    if (SSNET.mode !== 'firebase') return;
    const pend = VS_PEND.list();
    const games = VS_GAMES.list();   // live-sky correspondence duels ride the same watcher (9/8 card 04)
    const want = new Set([...pend.map((p) => p.code), ...games.map((g) => g.code)]);
    for (const code of Object.keys(this.pendWatch)) {
      if (!want.has(code)) this.unwatchPend(code);
    }
    for (const code of want) {
      if (this.pendWatch[code]) continue;
      const p = pend.find((x) => x.code === code) || null;
      const w = this.pendWatch[code] = { seenBell: false };
      w.roomRef = SSNET.ref('mp/rooms/' + code);
      if (!w.roomRef) { delete this.pendWatch[code]; continue; }
      w.roomCb = (snap) => this.onPendRoom(code, snap.val());
      w.roomRef.on('value', w.roomCb);
      if (p && !p.declined) {
        w.invRef = SSNET.ref('invites/' + p.to.id + '/' + vsUid());
        if (w.invRef) {
          w.invCb = (snap) => {
            if (snap.val() != null) { w.seenBell = true; return; }
            if (!w.seenBell) return;
            w.seenBell = false;
            // taken down without a seat claimed = declined (a beat of grace
            // for the join racing the removal)
            this.time.delayedCall(1500, () => {
              const rec = VS_PEND.get(code);
              if (!rec || rec.declined || rec.active) return;
              VS_PEND.mark(code, { declined: 1 });
              this.toast(SS_T('vsDeclined', p.to.name));
            });
          };
          w.invRef.on('value', w.invCb);
        }
      }
    }
    const now = Date.now();
    for (const p of pend) {
      if (p.declined || p.active) continue;
      // the bell ages out of RTDB after 5 minutes — the standing summons
      // re-rings it, so a friend arriving late still finds it
      // (the answered-while-roaming banner is onPendRoom's moment)
      if (now - (p.rung || p.at) >= 120000) {
        VS_PEND.mark(p.code, { rung: now });
        SSNET.FR.challenge(p.to.id, p.code, 'turns');
      }
    }
    // a decided sky duel left unread two days settles honestly and leaves —
    // the mirror of the near sky's boot sweep (the room itself lingers for
    // the week-long sweep so the other seat can still read the end)
    for (const g of games) {
      if (g.status !== 'done' || !(g.endedAt > 0) || now - g.endedAt <= 48 * 3600000) continue;
      const w = this.pendWatch[g.code];
      const room = w && w.room;
      if (!g.settled && room && room.winnerUid) {
        const foeE = Object.entries(room.players || {}).find(([id]) => id !== vsUid());
        const foeR = foeE && Number.isFinite(foeE[1].rating) ? foeE[1].rating : SS_RATING.BASE;
        SS_RATING.duel(foeR, room.winnerUid === vsUid() ? 1 : 0);
        SS.save(); SS.sync();
      }
      VS_GAMES.remove(g.code);
    }
  }
  unwatchPend(code) {
    const w = this.pendWatch[code];
    if (!w) return;
    if (w.roomRef && w.roomCb) w.roomRef.off('value', w.roomCb);
    if (w.invRef && w.invCb) w.invRef.off('value', w.invCb);
    delete this.pendWatch[code];
  }
  onPendRoom(code, room) {
    const w = this.pendWatch[code];
    if (w) w.room = room;   // the settle sweep reads the last snapshot
    const rec = VS_PEND.get(code);
    const g = VS_GAMES.get(code);
    if (!rec && !g) { this.unwatchPend(code); return; }
    if (!room) {
      // the room is gone (swept, cancelled, or dissolved) — the rows follow
      this.unwatchPend(code);
      VS_PEND.remove(code);
      VS_GAMES.remove(code);
      return;
    }
    if (room.status === 'waiting' && Object.keys(room.players || {}).length >= VS_MAX[room.mode || 'turns']) {
      vsStartIfFull(code);
      return;
    }
    const me = vsUid();
    const foeE = Object.entries(room.players || {}).find(([id]) => id !== me);
    // the device ledger shadows the room — the home strip's synchronous truth
    if (g) {
      VS_GAMES.mark(code, { status: room.status, turn: room.turnUid || null, endedAt: room.endedAt || 0,
        held: foeE && foeE[1].held ? 1 : 0, foe: foeE ? { id: foeE[0], name: foeE[1].name } : g.foe });
    }
    // a correspondence summons is ANSWERED when the held seat is claimed —
    // the room was active from birth, so activity alone proves nothing there
    const claimed = room.corr ? !!(foeE && !foeE[1].held) : (room.status === 'active' || room.status === 'done');
    if (rec && claimed && !rec.active) {
      if (room.corr) {
        // the summons row retires — the game's own ledger row carries the
        // duel from here (whose move, the strip, the abandon door); the
        // banner still announces the answer wherever you roam
        if (!VS_GAMES.get(code)) {
          VS_GAMES.add({ code, foe: foeE ? { id: foeE[0], name: foeE[1].name } : rec.to, at: Date.now(),
            turn: room.turnUid || null, status: room.status, held: 0, seen: 0, settled: 0 });
        }
        VS_PEND.remove(code);
        if (!this.scene.isActive('vsmenu') && !this.suppressed() && !rec.bannered) this.answerBanner(code, rec.to.name);
        return;
      }
      VS_PEND.mark(code, { active: 1 });
      if (!this.scene.isActive('vsmenu') && !this.suppressed() && !rec.bannered) {
        VS_PEND.mark(code, { bannered: 1 });
        this.answerBanner(code, rec.to.name);
      }
    }
    // the turn came home while you roam: one quiet ring per turn — and one
    // when the duel is decided (never at attach; only on a true flip)
    if (g && room.corr && w) {
      const foeName = foeE ? foeE[1].name : '';
      if (w.lastTurn === undefined) { w.lastTurn = room.turnUid; w.lastStatus = room.status; return; }
      const vb = this.scene.get('vsbattle');
      const inIt = vb && vb.sys.isActive() && vb.code === code;
      if (room.status === 'active' && room.turnUid !== w.lastTurn) {
        w.lastTurn = room.turnUid;
        if (room.turnUid === me && !inIt && foeE && !foeE[1].held) this.toast(SS_T('vsBotAnswered', foeName));
      }
      if (room.status === 'done' && w.lastStatus !== 'done') {
        w.lastStatus = 'done';
        if (!inIt) this.toast(foeName + ' — ' + SS_T('vsPendDone'));
      } else w.lastStatus = room.status;
    }
  }
  answerBanner(code, name) {
    if (this.bannerC) return;   // a challenge banner holds the stage — the row still stands under VERSUS
    this.bannerKind = 'answer';
    const l = ssLayout(this);
    const c = this.bannerC = this.add.container(l.x(0), l.y(120)).setDepth(900);
    const W = 356, H = 62;
    const glow = this.add.image(0, 0, 'glowbig').setDisplaySize(l.u(W * 1.5), l.u(H * 2.6)).setTint(0xffd77a).setAlpha(0.16).setBlendMode('ADD');
    this.tweens.add({ targets: glow, alpha: 0.05, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const bg = this.add.image(0, 0, ssBtn(this, true, W, H)).setDisplaySize(l.u(W), l.u(H)).setInteractive();
    // the drawn blades here too — vsAnswered lost its U+2694 in the 9/10 sweep
    const gl = this.add.image(-l.u(W / 2 - 28), 0, vsSwordsTex(this)).setDisplaySize(l.u(20), l.u(20)).setAlpha(0.95);
    const t1 = ssTxt(this, -l.u(W / 2 - 46), 0, SS_T('vsAnswered', name), l.u(12.5), '#ffe9a8').setOrigin(0, 0.5)
      .setShadow(0, 0, '#c9b676', l.u(6), true, true);
    while (t1.width > l.u(176) && t1.text.length > 6) t1.setText(t1.text.slice(0, -2) + '…');
    const ab = this.add.image(l.u(W / 2 - 74), 0, ssBtn(this, false, 88, 32)).setDisplaySize(l.u(88), l.u(32)).setInteractive({ useHandCursor: true });
    const at = ssTxt(this, l.u(W / 2 - 74), 0, SS_T('smAccept'), l.u(11), BTN_INK()).setOrigin(0.5);
    this.tweens.add({ targets: [ab, at], alpha: 0.7, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    ab.on('pointerdown', () => { SFX.ensure(); SFX.ui(); this.enterPending(code); });
    const xb = ssTxt(this, l.u(W / 2 - 16), 0, '✕', l.u(15), '#8a94c4').setOrigin(0.5).setInteractive({ useHandCursor: true });
    xb.on('pointerdown', () => { SFX.ui(); this.hide(); });
    c.add([glow, bg, gl, t1, ab, at, xb]);
    c.y = l.y(120) - l.u(90); c.alpha = 0;
    this.tweens.add({ targets: c, y: l.y(120), alpha: 1, duration: 420, ease: 'Back.easeOut' });
    SFX.forge();
  }
  enterPending(code) {
    VS_PEND.remove(code);
    PENDING_ASCENT = null;
    for (const s of this.game.scene.getScenes(false)) {
      if (s === this) continue;
      if (s.sys.isActive() || s.sys.isSleeping() || s.sys.isPaused()) s.scene.stop();
    }
    this.hide();
    this.scene.launch('vsbattle', { code });
    this.scene.bringToTop();
  }
  // no bell while a versus scene is up: a fresh challenge waits in RTDB (5 min)
  // and rings the moment you're back on a menu
  suppressed() {
    const vb = this.scene.get('vsbattle');
    return !!(vb && vb.sys.isActive());
  }
  refresh() {
    if (!this.sys.isActive()) return;
    if (this.bannerC && this.bannerKind === 'answer') return;   // the answers banner holds until entered or waved off
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
    // the drawn blades at the pill's left — the U+2694 left smTitle in the 9/10 sweep
    const gl = this.add.image(-l.u(W / 2 - 28), 0, vsSwordsTex(this)).setDisplaySize(l.u(20), l.u(20)).setAlpha(0.95);
    const name = inv.name || SSNET.FR.nameOf(inv.from);
    const t1 = ssTxt(this, -l.u(W / 2 - 46), -l.u(13), SS_T('smTitle', name), l.u(13), '#ffe9a8').setOrigin(0, 0.5)
      .setShadow(0, 0, '#c9b676', l.u(6), true, true);
    while (t1.width > l.u(196) && t1.text.length > 6) t1.setText(t1.text.slice(0, -2) + '…');
    const t2 = ssTxt(this, -l.u(W / 2 - 46), l.u(11), SS_T(VS_MODE_KEY[inv.mode] || 'vsModeTurns') + '  ·  ' + inv.code, l.u(10), '#9fb0e8', 'italic').setOrigin(0, 0.5);
    const ab = this.add.image(l.u(W / 2 - 78), 0, ssBtn(this, false, 96, 32)).setDisplaySize(l.u(96), l.u(32)).setInteractive({ useHandCursor: true });
    const at = ssTxt(this, l.u(W / 2 - 78), 0, SS_T('smAccept'), l.u(11), BTN_INK()).setOrigin(0.5);
    this.tweens.add({ targets: [ab, at], alpha: 0.7, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    ab.on('pointerdown', () => { SFX.ensure(); SFX.ui(); this.accept(inv); });
    const xb = ssTxt(this, l.u(W / 2 - 16), 0, '✕', l.u(15), '#8a94c4').setOrigin(0.5).setInteractive({ useHandCursor: true });
    xb.on('pointerdown', () => { SFX.ui(); SSNET.FR.decline(inv.from); this.hide(); });
    this.moreT = ssTxt(this, 0, l.u(H / 2 + 12), more > 0 ? SS_T('smMore', more) : '', l.u(9), '#8a94c4', 'italic').setOrigin(0.5);
    this.acceptT = at;
    c.add([glow, bg, gl, t1, t2, ab, at, xb, this.moreT]);
    c.y = l.y(120) - l.u(90); c.alpha = 0;
    this.tweens.add({ targets: c, y: l.y(120), alpha: 1, duration: 420, ease: 'Back.easeOut' });
    SFX.forge();
    localStorage.setItem('beta3.summons', JSON.stringify({ from: inv.from, code: inv.code, mode: inv.mode, t: Date.now() }));
  }
  hide() {
    const c = this.bannerC;
    this.bannerC = null; this.shown = null; this.moreT = null; this.acceptT = null; this.bannerKind = null;
    if (!c) return;
    this.tweens.add({ targets: c, alpha: 0, y: c.y - ssLayout(this).u(30), duration: 220, onComplete: () => c.destroy() });
  }
  async accept(inv) {
    if (this.accepting) return;
    this.accepting = true;
    if (this.acceptT && this.acceptT.active) this.acceptT.setText('…');
    let ok = false;
    try { ok = await vsJoinRoom(inv.code); } catch (e) { ok = false; }
    if (ok) await vsStartIfFull(inv.code);   // the challenger roams now — the accepting seat lights the duel
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
    this.scene.launch('vsbattle', { code: inv.code, joining: true });
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
