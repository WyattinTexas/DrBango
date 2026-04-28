// =================================================================
// RAID TRANSCRIPT — Detailed battle log for auditing
// Records every game event with timestamps for post-game review.
// Auto-downloads as a text file when the raid ends.
// =================================================================

const RaidTranscript = {
  _lines: [],
  _active: false,
  _startTime: 0,
  _playerName: '',
  _bossName: '',
  _raidId: '',

  // ── Start recording ─────────────────────────────────────────────
  start(playerName, bossName, raidId) {
    this._lines = [];
    this._active = true;
    this._startTime = Date.now();
    this._playerName = playerName || 'Player';
    this._bossName = bossName || 'Boss';
    this._raidId = raidId || '';

    this._header();
    this._hookLog();
    this._hookResolve();
    console.log('[Transcript] Recording started');
  },

  // ── Stop recording ──────────────────────────────────────────────
  stop() {
    this._active = false;
    this._unhookLog();
    this._unhookResolve();
    console.log('[Transcript] Recording stopped (' + this._lines.length + ' lines)');
  },

  // ── Add a line ──────────────────────────────────────────────────
  add(category, text) {
    if (!this._active) return;
    const elapsed = ((Date.now() - this._startTime) / 1000).toFixed(1);
    const clean = text.replace(/<[^>]*>/g, '').trim(); // strip HTML
    this._lines.push(`[${elapsed}s] [${category}] ${clean}`);
  },

  // ── Write header ────────────────────────────────────────────────
  _header() {
    const now = new Date().toISOString();
    this.add('SYSTEM', '═══════════════════════════════════════════');
    this.add('SYSTEM', `RAID TRANSCRIPT — ${now}`);
    this.add('SYSTEM', `Boss: ${this._bossName} | Raid: ${this._raidId}`);
    this.add('SYSTEM', `Player: ${this._playerName}`);
    this.add('SYSTEM', `RaidState phase: ${typeof RaidState !== 'undefined' ? RaidState.phase : '?'}`);
    this.add('SYSTEM', `Players: ${typeof RaidState !== 'undefined' ? RaidState.players.map(p => p?.displayName).join(', ') : '?'}`);
    this.add('SYSTEM', `Boss HP: ${typeof RaidState !== 'undefined' ? RaidState.bossCurrentHp + '/' + RaidState.bossMaxHp : '?'}`);
    this.add('SYSTEM', '═══════════════════════════════════════════');
  },

  // ── Hook into battle log ────────────────────────────────────────
  _origLog: null,

  _hookLog() {
    if (this._origLog) return; // already hooked
    this._origLog = window.log;
    const self = this;
    window.log = function(html) {
      self._origLog(html);
      self.add('LOG', html);
    };
  },

  _unhookLog() {
    if (this._origLog) {
      window.log = this._origLog;
      this._origLog = null;
    }
  },

  // ── Hook into resolve for detailed combat data ──────────────────
  _resolveHookRegistered: false,

  _hookResolve() {
    if (this._resolveHookRegistered) return;
    this._resolveHookRegistered = true;
    const self = this;

    // Hook post-resolve to capture round results
    if (typeof onPostResolve === 'function') {
      onPostResolve(function(B) {
        if (!self._active || !B) return;

        // Snapshot the state after each resolve
        const red = B.red, blue = B.blue;
        const rF = red.ghosts[red.activeIdx];
        const bF = blue.ghosts[blue.activeIdx];

        self.add('RESOLVE', `Round ${B.round} resolved`);
        self.add('STATE', `Red active: ${rF?.name} ${rF?.hp}/${rF?.maxHp} HP${rF?.ko ? ' [KO]' : ''}`);
        self.add('STATE', `Blue active: ${bF?.name} ${bF?.hp}/${bF?.maxHp} HP${bF?.ko ? ' [KO]' : ''}`);

        // Red team full state
        red.ghosts.forEach((g, i) => {
          if (i !== red.activeIdx) {
            self.add('STATE', `  Red bench ${i}: ${g.name} ${g.hp}/${g.maxHp}${g.ko ? ' [KO]' : ''}`);
          }
        });

        // Blue team full state
        blue.ghosts.forEach((g, i) => {
          if (i !== blue.activeIdx) {
            self.add('STATE', `  Blue bench ${i}: ${g.name} ${g.hp}/${g.maxHp}${g.ko ? ' [KO]' : ''}`);
          }
        });

        // Resources
        const rRes = red.resources || {};
        const bRes = blue.resources || {};
        const resKeys = ['moonstone', 'ice', 'fire', 'surge', 'healingSeed', 'luckyStone', 'firefly', 'burn'];
        const rResStr = resKeys.filter(k => rRes[k]).map(k => `${k}:${rRes[k]}`).join(', ');
        const bResStr = resKeys.filter(k => bRes[k]).map(k => `${k}:${bRes[k]}`).join(', ');
        if (rResStr) self.add('STATE', `  Red resources: ${rResStr}`);
        if (bResStr) self.add('STATE', `  Blue resources: ${bResStr}`);

        // Dice
        if (B.redDice) self.add('DICE', `Red dice: [${B.redDice.join(',')}] → ${classify(B.redDice).type} ${classify(B.redDice).value}`);
        if (B.blueDice) self.add('DICE', `Blue dice: [${B.blueDice.join(',')}] → ${classify(B.blueDice).type} ${classify(B.blueDice).value}`);

        // Boss HP pool
        if (typeof RaidState !== 'undefined' && RaidState.isActive()) {
          self.add('BOSS', `Boss pool HP: ${RaidState.bossCurrentHp}/${RaidState.bossMaxHp}`);
        }

        self.add('RESOLVE', '───────────────────────────────────────');
      });
    }
  },

  _unhookResolve() {
    // Can't easily remove from the hooks array, but the _active flag prevents recording
  },

  // ── Record turn events ──────────────────────────────────────────
  recordTurnStart(playerName, slotIdx) {
    this.add('TURN', `═══ TURN: ${playerName} (slot ${slotIdx}) ═══`);
    if (typeof RaidState !== 'undefined') {
      this.add('TURN', `Boss HP: ${RaidState.bossCurrentHp}/${RaidState.bossMaxHp} | Enrage: ${RaidState.enrageLevel}`);
    }
  },

  recordTurnEnd(playerName) {
    this.add('TURN', `── End of ${playerName}'s turn ──`);
  },

  recordGameOver(winner, bossHp, bossMaxHp) {
    this.add('GAME', '═══════════════════════════════════════════');
    this.add('GAME', `GAME OVER — Winner: ${winner}`);
    this.add('GAME', `Boss HP: ${bossHp}/${bossMaxHp}`);
    this.add('GAME', '═══════════════════════════════════════════');
  },

  // ── Download transcript ─────────────────────────────────────────
  download() {
    if (this._lines.length === 0) {
      console.log('[Transcript] Nothing to download');
      return;
    }

    const text = this._lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `raid-transcript-${this._bossName.replace(/\s+/g, '-')}-${ts}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('[Transcript] Downloaded (' + this._lines.length + ' lines)');
  },

  // ── Get as string (for console/copy) ────────────────────────────
  getText() {
    return this._lines.join('\n');
  }
};
