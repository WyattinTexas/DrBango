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
const vsSeat = (seat) => ({
  name: vsName(), hp: VS_HP, seat, casts: 0, dealt: 0, gone: false, joinedAt: Date.now(),
  rating: SS.prof.rating, rhide: SS.prof.rhide ? 1 : 0,
});

/* ============================================================
   Menu — challenge-first (v0.73.0, floor cleared v0.83.0): the
   hero crest, then two primaries (CHALLENGE A FRIEND → the social
   sheet · CHALLENGE WORLDWIDE → quick match) centred between the
   crest and the safe band's foot. Turns only. The BY NAME / seal
   doors left with Skylar's 9/3 call — friends are reached through
   the sheet, new mages through the app invite, rooms through
   summons bells and ?join deep links.
   ============================================================ */
class VsMenu extends Phaser.Scene {
  constructor() { super('vsmenu'); }
  create() {
    const l = ssLayout(this);
    ssMakeTextures(this);
    ssStarfield(this, 90);
    // scene instances persist across restarts — stale truthy refs from a
    // previous life could keep the sheet from ever opening again
    this.socialC = null; this.frC = null; this.shNoteT = null;
    this.recentRows = null; this.frRows = null;
    this.frOff = null; this.frTimer = null;
    this.busyC = false;
    const back = ssTxt(this, l.x(-195), l.y(24), '‹ HOME', l.u(14), '#9fb0e8').setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => { SFX.ui(); this.scene.start('home'); });

    if (SSNET.mode === 'local') {
      ssTxt(this, l.x(0), l.y(300), SS_T('vsNoSky'), l.u(14), '#8c5a5a', 'italic').setOrigin(0.5).setAlign('center');
      return;
    }
    try { localStorage.removeItem('beta3.vsmode'); } catch (e) { }   // the mode choice is retired — sweep the dead key

    // the hero crest (Skylar 9/3, stamped 2.5×): drawn crossed blades over a
    // slow gold breath, no words beneath — the page's one emblem, baked big
    // enough to stay crisp at this size (the setDisplaySize-only upscale of
    // the 96px bake was the v0.3.4 blur). Glow rides the same 2.5×.
    const crestGlow = this.add.image(l.x(0), l.y(168), 'glowbig').setDisplaySize(l.u(625), l.u(625)).setTint(0xc9a94f).setAlpha(0.1).setBlendMode('ADD');
    this.tweens.add({ targets: crestGlow, alpha: 0.045, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.image(l.x(0), l.y(168), vsSwordsTex(this, 210)).setDisplaySize(l.u(210), l.u(210)).setAlpha(0.96);

    // the two primaries — and only these (Skylar 9/2). Every door on this
    // page seals a turn-based room; the caption says the mode once. The pair
    // centres between the crest's bottom edge and the safe band's bottom
    // (Skylar 9/3, "right in the middle") — the design box runs to y 800,
    // but a width-limited phone floats it, so the true foot is computed.
    const crestB = 168 + 105;
    const safeB = 400 + (l.H - (SS_INSET.top + SS_INSET.bottom) * DPR) / (2 * l.s);
    const friendY = Math.round((crestB + safeB) / 2 - 36);   // buttons span friendY−30 … friendY+102
    ssTxt(this, l.x(0), l.y(friendY - 38), SS_T('vsAsync'), l.u(10.5), '#c9b676', 'italic').setOrigin(0.5);
    const prim = (y, key, subKey, cb) => {
      const b = this.add.image(l.x(0), l.y(y), ssBtn(this, false, 320, 60)).setDisplaySize(l.u(320), l.u(60)).setInteractive({ useHandCursor: true });
      const t = ssTxt(this, l.x(0), l.y(y - 10), SS_T(key), l.u(17), BTN_INK()).setOrigin(0.5);
      for (let fs = 17; t.width > l.u(296) && fs > 11; fs -= 0.5) t.setFontSize(l.u(fs));
      const s = ssTxt(this, l.x(0), l.y(y + 12), SS_T(subKey), l.u(9.5), BTN_INK2(), 'italic').setOrigin(0.5);
      for (let fs = 9.5; s.width > l.u(300) && fs > 7; fs -= 0.5) s.setFontSize(l.u(fs));
      b.on('pointerdown', cb);
      return b;
    };
    this.chFriendB = prim(friendY, 'vsChFriend', 'vsChFriendSub', () => { SFX.ensure(); SFX.ui(); this.openSocial(); });
    this.chWorldB = prim(friendY + 72, 'vsChWorld', 'vsChWorldSub', () => { SFX.ensure(); SFX.ui(); this.match('turns'); });

    // the feedback line keeps the foot's old breathing room under the pair
    this.noteT = ssTextBlock(this, l.x(0), l.y(friendY + 134), '', {
      fontSize: l.u(11) + 'px', color: '#c9b676', fontStyle: 'italic', shadow: true,
      wrapW: l.u(340), align: 'center', ox: 0.5, oy: 0.5,
    });

    // the standing duels (9/3 card 03) — friend summonses waiting or
    // declined, worldwide duels mid-rhythm — as quiet rows under the crest
    this.pendC = this.add.container(0, 0);
    this.pendKey = '';
    this.refreshPend();
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.refreshPend() });

    this.events.once('shutdown', () => this.closeSocial());
    if (VSAUTO) this.time.delayedCall(600, () => this.match('turns'));
    if (FRDEMO === 'host' || FRDEMO === 'invite') this.time.delayedCall(800, () => this.frDemo());
  }
  // feedback lands where the eye is: on the sheet's own line while it is
  // open, on the page line otherwise
  note(s, ms) {
    const t = (this.socialC && this.shNoteT && this.shNoteT.active) ? this.shNoteT : this.noteT;
    if (!t || !t.active) return;
    t.setText(s || '');
    if (this.noteTimer) { this.noteTimer.remove(false); this.noteTimer = null; }
    if (s && ms) this.noteTimer = this.time.delayedCall(ms, () => { if (t.active) t.setText(''); });
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

  /* ---------- the pending rows (9/3 card 03) ----------
     Standing duels live HERE now, not at a waiting screen: a friend summons
     waits as a row (✶ shares the invite link, ✕ takes the summons back), a
     declined one says so once, and a worldwide duel mid-rhythm shows whose
     move it is — tap the row to step back under those stars. */
  pendList() {
    const rows = [];
    for (const p of VS_PEND.list()) rows.push({ kind: p.declined ? 'declined' : 'wait', code: p.code, name: p.to.name, at: p.at, p });
    for (const code of SS_NEAR.codes()) {
      const r = SS_NEAR.room(code);
      if (!r || !r.players) continue;
      const foe = Object.entries(r.players).find(([id]) => id !== vsUid());
      const name = foe ? foe[1].name : '…';
      if (r.status === 'done') rows.push({ kind: 'done', code, name, at: r.endedAt || r.createdAt || 0 });
      else if (r.status === 'active') rows.push({ kind: r.turnUid === vsUid() ? 'move' : 'theirs', code, name, at: r.startedAt || r.createdAt || 0 });
    }
    return rows.sort((a, b) => b.at - a.at).slice(0, 4);
  }
  refreshPend() {
    if (!this.pendC || !this.pendC.scene) return;
    // a friend answered while this page stood: step into the duel at once
    const live = VS_PEND.list().find((p) => p.active);
    if (live) { VS_PEND.remove(live.code); this.scene.start('vsbattle', { code: live.code }); return; }
    const rows = this.pendList();
    const key = JSON.stringify(rows.map((r) => r.kind + r.code + r.name));
    if (key === this.pendKey) return;
    this.pendKey = key;
    const l = ssLayout(this);
    this.pendC.removeAll(true);
    this.pendRows = [];
    rows.forEach((r, i) => {
      const y = l.y(300 + i * 36);
      const items = [];
      items.push(this.add.image(l.x(-166), y, vsSwordsTex(this)).setDisplaySize(l.u(18), l.u(18)).setAlpha(r.kind === 'move' ? 1 : 0.6));
      const nm = ssTxt(this, l.x(-148), y - l.u(7), r.name, l.u(12), r.kind === 'move' ? '#ffe9a8' : '#d8d2bd').setOrigin(0, 0.5);
      while (nm.width > l.u(150) && nm.text.length > 2) nm.setText(nm.text.slice(0, -2) + '…');
      items.push(nm);
      const status = r.kind === 'move' ? SS_T('vsYourMove') : r.kind === 'theirs' ? SS_T('vsTheirMove', r.name)
        : r.kind === 'done' ? SS_T('vsPendDone')
          : r.kind === 'declined' ? SS_T('vsDeclined', r.name)
            : SS_T(r.p && r.p.away ? 'vsWaitAway' : r.p && r.p.busy ? 'vsWaitBusy' : 'vsWaitAnswer', r.name);
      const st = ssTxt(this, l.x(-148), y + l.u(8), status, l.u(8.5), r.kind === 'move' ? '#ffd77a' : r.kind === 'declined' ? '#e8a87f' : '#8a94c4', 'italic').setOrigin(0, 0.5);
      while (st.width > l.u(240) && st.text.length > 4) st.setText(st.text.slice(0, -2) + '…');
      items.push(st);
      const row = { kind: r.kind, code: r.code, name: r.name, nameT: nm, statusT: st };
      if (r.kind === 'wait') {
        const sh = ssTxt(this, l.x(140), y, '✶', l.u(14), '#c9b676').setOrigin(0.5).setInteractive({ useHandCursor: true });
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
        const xb = ssTxt(this, l.x(172), y, '✕', l.u(13), '#8a94c4').setOrigin(0.5).setInteractive({ useHandCursor: true });
        ssHitPad(xb, 30);
        xb.on('pointerdown', () => { SFX.ui(); this.cancelPend(r); });
        items.push(xb);
        row.cancel = xb;
      } else {
        items.push(ssTxt(this, l.x(166), y, '›', l.u(16), r.kind === 'move' ? '#ffd77a' : '#8a94c4').setOrigin(0.5));
        const zone = this.add.zone(l.x(-10), y, l.u(340), l.u(32)).setOrigin(0.5).setInteractive({ useHandCursor: true });
        zone.on('pointerdown', () => { SFX.ensure(); SFX.ui(); this.scene.start('vsbattle', { code: r.code }); });
        items.push(zone);
        row.zone = zone;
      }
      this.pendRows.push(row);
      this.pendC.add(items);
    });
  }
  cancelPend(r) {
    VS_PEND.remove(r.code);
    if (r.kind === 'wait' && r.p) {
      SSNET.FR.cancelChallenge(r.p.to.id);
      // take the room back the way LEAVE would — mine alone, so it seals
      SSNET.dbTxn('mp/rooms/' + r.code, (cur) => {
        if (!cur || !cur.players || !cur.players[vsUid()]) return cur;
        if (cur.status !== 'waiting') return cur;
        const players = { ...cur.players };
        delete players[vsUid()];
        if (!Object.keys(players).length) return null;
        return { ...cur, players };
      }).catch(() => { });
    }
    this.refreshPend();
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
    this.busyC = true;
    this.note(SS_T('vsConsult'));
    try {
      const conn = await SSNET.connect();
      if (conn !== 'firebase') { this.note(SS_T('vsNoSky'), 3000); this.busyC = false; return; }
      const code = vsCode();
      const ok = await vsSealRoom(code, 'turns', { private: true, invited: f.id });
      if (!ok || !this.sys.isActive()) { this.note(SS_T('vsRefused'), 3000); this.busyC = false; return; }
      // a mage of the circle answers in moments — that duel is lived, not
      // pended: enter, and the engine seats them (the arcade-paced AGAIN)
      if (f.circle) { this.scene.start('vsbattle', { code, challenged: { id: f.id, name: f.name, circle: f.circle } }); return; }
      await SSNET.FR.challenge(f.id, code, 'turns');
      if (!this.sys.isActive()) return;
      // the summons STANDS (9/3 card 03): no waiting screen — a pending row
      // on this page carries the wait, the roaming watcher rings the moment
      // they answer, and the invite link still travels from the row's ✶
      VS_PEND.add({ code, to: { id: f.id, name: f.name }, away: !!f.away, busy: !!f.busy, at: Date.now(), rung: Date.now() });
      this.busyC = false;
      this.closeSocial();
      this.note(SS_T('vsSent', f.name), 3500);
      this.refreshPend();
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
    this.revealed = !this.theater;            // the found gate holds beginBattle under the theater
    this.beginQueued = false; this.revealTimer = null; this.swapping = false;
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

    this.onAchCb = (def) => ssAchToast(this, def);
    this.game.events.on('ss-ach', this.onAchCb);
    this.events.once('shutdown', () => {
      this.game.events.off('ss-ach', this.onAchCb);
      if (this.roomRef) this.roomRef.off('value', this.onRoomCb);
      if (this.castsRef) this.castsRef.off('child_added', this.onCastCb);
      SSNET.FR.setBusy(false);
      if (this.near) {
        // the duel stands when you step away — no gone-mark, no desertion;
        // a decided duel you have SEEN leaves with you
        if (this.room && this.room.status === 'done' && this.state === 'done') SS_NEAR.purge(this.code);
        return;
      }
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
      // a near duel keeps when you step out mid-rhythm — that IS the design
      // (the reply comes in its own time): no desertion, no gone-mark, the
      // pending row holds the door open. Said once, the first time.
      if (this.near) {
        if (this.room && this.room.status === 'active' && this.state !== 'done' && !localStorage.getItem('beta3.duelStands')) {
          try { localStorage.setItem('beta3.duelStands', '1'); } catch (e) { }
          vsNotify(SS_T('vsDuelStands'));
        }
        this.scene.start('vsmenu');
        return;
      }
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
    if (!ch && !this.near) {
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
    return Object.entries((this.room && this.room.players) || {})
      .filter(([, p]) => p.hp > 0 && !p.gone).map(([id, p]) => ({ id, ...p }));
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
    else if (room.status === 'done' && room.rematch && !this.rematchBusy) this.showRematchCall();
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
      SS_NEAR.seal(this.code, {
        mode: this.room.mode, status: 'waiting', createdAt: this.room.createdAt || Date.now(), hostUid: vsUid(),
        seed: this.room.seed || Math.floor(Math.random() * 1e9), lang: this.room.lang || ssGameLang(),
        private: false, seekAt: this.room.seekAt || Date.now(),   // the shape a live worldwide room wears
        players: { [vsUid()]: vsSeat(0) },
      }, { uid: who.uid, myPlays: [], plays: [], seen: 0 });
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
    this.tweens.add({ targets: this.waitC, alpha: 0, duration: 400, onComplete: () => { this.waitC.setVisible(false); this.killTheater(); } });
    // everyone I cross swords with becomes a recent rival (one-tap add later)
    for (const p of this.others()) SSNET.FR.noteRival(p.id, p.name);
    if (this.challenged) SSNET.FR.cancelChallenge(this.challenged.id);   // the bell is answered
    setSeed(this.room.seed || 1);
    this.board = []; this.sel = [];
    // a near duel re-entered mid-rhythm: my sigils ride my seat, and my board
    // is replayed move-for-move from the note's script (the same
    // deterministic deal the rival engine mirrors) — the exact tiles I left
    // stand waiting, not a fresh opening deal
    this.restored = null;
    if (this.near) {
      const seatMe = this.me();
      this.mySigils = (seatMe && Array.isArray(seatMe.sigils)) ? [...seatMe.sigils] : [];
      const n = SS_NEAR.note(this.code) || {};
      if ((n.myPlays || []).length && typeof SS_RIVAL !== 'undefined' && SS_RIVAL.replayBoard) {
        try { this.restored = SS_RIVAL.replayBoard(PACK, this.room.seed || 1, n.myPlays); } catch (e) { this.restored = null; }
      }
      this.refreshSigChip();
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
      // the standing board, tile for tile (the near-sky resume)
      this.pendingTier = 0;
      this.restored.slots.forEach((s, i) => { if (s) this.spawnTile(i, s.ch, s.tier, true); });
      this.restored = null;
    } else this.fillBoard(true);
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
      await this.db.txn('mp/rooms/' + this.code + '/players/' + target.id + '/hp', (cur) => Math.max(0, (cur == null ? VS_HP : cur) - dmg));
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
      // a near duel writes its move into the note's script — the board replay
      // on the next visit re-lives exactly these indices
      if (this.near) {
        const n = SS_NEAR.note(this.code) || {};
        SS_NEAR.setNote(this.code, { myPlays: [...(n.myPlays || []), { c: used }] });
      }
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

  scry() {
    if (this.state !== 'pick' || !this.isMyTurn() || this.scryCooldown > 0) return;
    SFX.ensure(); SFX.noise(0.4, 600, 1, 0.12, 1800);
    this.unselectFrom(0);
    for (let i = 0; i < 16; i++) { if (this.board[i]) { this.board[i].c.destroy(); this.board[i] = null; } }
    this.fillBoard(false);
    if (this.near) {
      const n = SS_NEAR.note(this.code) || {};
      SS_NEAR.setNote(this.code, { myPlays: [...(n.myPlays || []), { s: 1 }] });
    }
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
    // a near duel re-entered: everything under the seen watermark is history
    // and stays quiet; a truly-new reply floats once and moves the mark
    if (this.near && cast.at) {
      const n = SS_NEAR.note(this.code) || {};
      if (cast.at <= (Number(n.seen) || 0)) return;   // never |0 — an epoch-ms stamp shears at 32 bits
      SS_NEAR.setNote(this.code, { seen: cast.at });
    }
    // under the theater the sky is covered — the panels tell the truth at
    // the reveal; no flash for a blow you were never shown
    if (!this.revealed) return;
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
        this.repaintChips();   // the duel board persists — a letter bonus shows at once
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
    this.killTheater();   // a duel decided under the searching veil still ends honestly
    if (this.waitC && this.waitC.visible) { this.waitC.setVisible(false); }
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
    // a near duel settles its Elo exactly once — the note remembers (a
    // decided duel left unread for days settles at the boot sweep instead)
    const nearNote = this.near ? (SS_NEAR.note(this.code) || {}) : null;
    if (this.room.winnerUid && !(nearNote && nearNote.settled)) {
      const foes = Object.entries(this.room.players || {}).filter(([id]) => id !== vsUid()).map(([, p]) => p);
      if (foes.length) {
        const oppAvg = foes.reduce((a, p) => a + (Number.isFinite(p.rating) ? p.rating : SS_RATING.BASE), 0) / foes.length;
        rd = SS_RATING.duel(oppAvg, won ? 1 : 0);
      }
      if (nearNote) SS_NEAR.setNote(this.code, { settled: 1 });
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
          players: { [vsUid()]: vsSeat(0) },
        }, { uid: persona.uid, myPlays: [], plays: [], seen: 0 });
        SS_RIVAL.spawn({ code, rating: persona.rating, seatRating: persona.rating, uid: persona.uid, name: persona.name, persona,
          pace: 'busy', roomDb: SS_NEAR.api, delay: 1600 + Math.random() * 2400 });
        this.scene.start('vsbattle', { code });
        return;
      }
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
    for (const code of Object.keys(this.pendWatch)) {
      if (!pend.some((p) => p.code === code)) this.unwatchPend(code);
    }
    for (const p of pend) {
      if (this.pendWatch[p.code]) continue;
      const w = this.pendWatch[p.code] = { seenBell: false };
      w.roomRef = SSNET.ref('mp/rooms/' + p.code);
      if (!w.roomRef) { delete this.pendWatch[p.code]; continue; }
      w.roomCb = (snap) => this.onPendRoom(p.code, snap.val());
      w.roomRef.on('value', w.roomCb);
      if (!p.declined) {
        w.invRef = SSNET.ref('invites/' + p.to.id + '/' + vsUid());
        if (w.invRef) {
          w.invCb = (snap) => {
            if (snap.val() != null) { w.seenBell = true; return; }
            if (!w.seenBell) return;
            w.seenBell = false;
            // taken down without a seat claimed = declined (a beat of grace
            // for the join racing the removal)
            this.time.delayedCall(1500, () => {
              const rec = VS_PEND.get(p.code);
              if (!rec || rec.declined || rec.active) return;
              VS_PEND.mark(p.code, { declined: 1 });
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
  }
  unwatchPend(code) {
    const w = this.pendWatch[code];
    if (!w) return;
    if (w.roomRef && w.roomCb) w.roomRef.off('value', w.roomCb);
    if (w.invRef && w.invCb) w.invRef.off('value', w.invCb);
    delete this.pendWatch[code];
  }
  onPendRoom(code, room) {
    const rec = VS_PEND.get(code);
    if (!rec) { this.unwatchPend(code); return; }
    if (!room) {
      // the room is gone (swept, or cancelled elsewhere) — the row follows
      this.unwatchPend(code);
      VS_PEND.remove(code);
      return;
    }
    if (room.status === 'waiting' && Object.keys(room.players || {}).length >= VS_MAX[room.mode || 'turns']) {
      vsStartIfFull(code);
      return;
    }
    if ((room.status === 'active' || room.status === 'done') && !rec.active) {
      VS_PEND.mark(code, { active: 1 });
      if (!this.scene.isActive('vsmenu') && !this.suppressed() && !rec.bannered) {
        VS_PEND.mark(code, { bannered: 1 });
        this.answerBanner(code, rec.to.name);
      }
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
    const t1 = ssTxt(this, -l.u(W / 2 - 16), 0, SS_T('vsAnswered', name), l.u(12.5), '#ffe9a8').setOrigin(0, 0.5)
      .setShadow(0, 0, '#c9b676', l.u(6), true, true);
    while (t1.width > l.u(200) && t1.text.length > 6) t1.setText(t1.text.slice(0, -2) + '…');
    const ab = this.add.image(l.u(W / 2 - 74), 0, ssBtn(this, false, 88, 32)).setDisplaySize(l.u(88), l.u(32)).setInteractive({ useHandCursor: true });
    const at = ssTxt(this, l.u(W / 2 - 74), 0, SS_T('smAccept'), l.u(11), BTN_INK()).setOrigin(0.5);
    this.tweens.add({ targets: [ab, at], alpha: 0.7, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    ab.on('pointerdown', () => { SFX.ensure(); SFX.ui(); this.enterPending(code); });
    const xb = ssTxt(this, l.u(W / 2 - 16), 0, '✕', l.u(15), '#8a94c4').setOrigin(0.5).setInteractive({ useHandCursor: true });
    xb.on('pointerdown', () => { SFX.ui(); this.hide(); });
    c.add([glow, bg, t1, ab, at, xb]);
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
