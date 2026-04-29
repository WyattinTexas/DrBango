// =================================================================
// RAID TRANSCRIPT v2 — Comprehensive battle audit log
// Records every game event with timestamps for post-game review.
// Auto-downloads as a text file when the raid ends.
//
// Captures: dice rolls, winner/loser, damage breakdowns, ability
// triggers, pre-roll decisions, committed resources, entry abilities,
// spectating summaries, ghost IDs, and full state snapshots.
// =================================================================

const RaidTranscript = {
  _lines: [],
  _active: false,
  _startTime: 0,
  _playerName: '',
  _bossName: '',
  _raidId: '',
  _lastLoggedRound: -1,
  _lastLoggedPhase: '',
  _hooksInstalled: false,

  // ── Start recording ─────────────────────────────────────────────
  start(playerName, bossName, raidId) {
    this._lines = [];
    this._active = true;
    this._startTime = Date.now();
    this._lastLoggedRound = -1;
    this._lastLoggedPhase = '';
    this._playerName = playerName || 'Player';
    this._bossName = bossName || 'Boss';
    this._raidId = raidId || '';

    this._header();
    this._installHooks();
    console.log('[Transcript] Recording started');
  },

  // ── Stop recording ──────────────────────────────────────────────
  stop() {
    this._active = false;
    this._unhookLog();
    this._unhookAbilityCallout();
    console.log('[Transcript] Recording stopped (' + this._lines.length + ' lines)');
  },

  // ── Add a line ──────────────────────────────────────────────────
  add(category, text) {
    if (!this._active) return;
    const elapsed = ((Date.now() - this._startTime) / 1000).toFixed(1);
    const clean = String(text).replace(/<[^>]*>/g, '').trim();
    this._lines.push(`[${elapsed}s] [${category}] ${clean}`);
  },

  // ── Ghost label with ID ─────────────────────────────────────────
  _ghost(g) {
    if (!g) return '???';
    return `${g.name} (${g.originalId || g.id})`;
  },

  // ── Write header ────────────────────────────────────────────────
  _header() {
    const now = new Date().toISOString();
    const rs = typeof RaidState !== 'undefined' ? RaidState : null;
    this.add('SYSTEM', '════════════════════════════════════════════════════════');
    this.add('SYSTEM', `RAID TRANSCRIPT v2 — ${now}`);
    this.add('SYSTEM', `Boss: ${this._bossName} | Raid: ${this._raidId}`);
    this.add('SYSTEM', `Recorded by: ${this._playerName}`);
    this.add('SYSTEM', `Players: ${rs ? rs.players.map((p, i) => `[${i}] ${p?.displayName}`).join(', ') : '?'}`);
    this.add('SYSTEM', `Boss HP Pool: ${rs ? rs.bossCurrentHp + '/' + rs.bossMaxHp : '?'}`);
    this.add('SYSTEM', `Enrage: ${rs ? rs.enrageLevel : '?'}`);

    // Log each player's team composition with ghost IDs
    if (rs && rs.players) {
      rs.players.forEach((p, i) => {
        if (p && p.team) {
          const teamStr = p.team.map(id => {
            const g = typeof getGhost === 'function' ? getGhost(id) : null;
            return g ? `${g.name} (${id}) ${g.maxHp}HP` : `ID:${id}`;
          }).join(' | ');
          this.add('SYSTEM', `  Player ${i} [${p.displayName}] team: ${teamStr}`);
        }
      });
    }

    // Log boss team
    if (rs && rs.bossConfig) {
      const bg = rs.bossConfig.bossGhost;
      this.add('SYSTEM', `  Boss: ${bg.name} (${bg.id}) ${bg.maxHp}HP base, personality: ${rs.bossConfig.personality}`);
    }

    this.add('SYSTEM', '════════════════════════════════════════════════════════');
  },

  // ══════════════════════════════════════════════════════════════════
  // HOOKS
  // ══════════════════════════════════════════════════════════════════

  _installHooks() {
    this._hookLog();
    this._hookAbilityCallout();
    this._hookResolve();
  },

  // ── Hook: battle log ────────────────────────────────────────────
  _origLog: null,

  _hookLog() {
    if (this._origLog) return;
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

  // ── Hook: ability callouts (every ability that fires) ───────────
  _origShowAbilityCallout: null,

  _hookAbilityCallout() {
    if (this._origShowAbilityCallout) return;
    if (typeof showAbilityCallout !== 'function') return;
    this._origShowAbilityCallout = window.showAbilityCallout;
    const self = this;
    window.showAbilityCallout = function(name, color, desc, team) {
      self._origShowAbilityCallout(name, color, desc, team);
      if (self._active) {
        const side = team || '?';
        self.add('ABILITY', `[${side}] ${name} — ${desc || ''}`);
      }
    };
  },

  _unhookAbilityCallout() {
    if (this._origShowAbilityCallout) {
      window.showAbilityCallout = this._origShowAbilityCallout;
      this._origShowAbilityCallout = null;
    }
  },

  // ── Hook: post-resolve state snapshot ───────────────────────────
  _hookResolve() {
    if (this._hooksInstalled) return;
    this._hooksInstalled = true;
    const self = this;

    if (typeof onPostResolve === 'function') {
      onPostResolve(function(B) {
        if (!self._active || !B) return;

        // Dedup
        if (self._lastLoggedRound === B.round && self._lastLoggedPhase === B.phase) return;
        self._lastLoggedRound = B.round;
        self._lastLoggedPhase = B.phase;

        const red = B.red, blue = B.blue;
        const rF = red.ghosts[red.activeIdx];
        const bF = blue.ghosts[blue.activeIdx];

        // ── Dice + Winner ──
        if (B.redDice && B.blueDice) {
          const rRoll = classify(B.redDice);
          const bRoll = classify(B.blueDice);

          self.add('DICE', `Red: [${B.redDice.join(',')}] → ${rRoll.type} ${rRoll.value} (dmg ${rRoll.damage})`);
          self.add('DICE', `Blue: [${B.blueDice.join(',')}] → ${bRoll.type} ${bRoll.value} (dmg ${bRoll.damage})`);

          // Determine winner from roll comparison
          const typeRank = { none:0, singles:1, doubles:2, triples:3, quads:4, penta:5 };
          const rRank = typeRank[rRoll.type] || 0;
          const bRank = typeRank[bRoll.type] || 0;
          if (rRank > bRank) {
            self.add('RESULT', `RED WINS — ${rRoll.type} ${rRoll.value} beats ${bRoll.type} ${bRoll.value} | base damage: ${rRoll.damage}`);
          } else if (bRank > rRank) {
            self.add('RESULT', `BLUE WINS — ${bRoll.type} ${bRoll.value} beats ${rRoll.type} ${rRoll.value} | base damage: ${bRoll.damage}`);
          } else if (rRoll.value > bRoll.value) {
            self.add('RESULT', `RED WINS (tiebreak) — ${rRoll.type} ${rRoll.value} vs ${bRoll.value} | base damage: ${rRoll.damage}`);
          } else if (bRoll.value > rRoll.value) {
            self.add('RESULT', `BLUE WINS (tiebreak) — ${bRoll.type} ${bRoll.value} vs ${rRoll.value} | base damage: ${bRoll.damage}`);
          } else {
            self.add('RESULT', `TIE — both ${rRoll.type} ${rRoll.value}`);
          }
        }

        // ── Committed resources (what was spent this round) ──
        if (B.committed) {
          const rC = B.committed.red || {};
          const bC = B.committed.blue || {};
          const fmtCommit = (c) => {
            const parts = [];
            if (c.ice) parts.push(`ice:${c.ice}`);
            if (c.fire) parts.push(`fire:${c.fire}`);
            if (c.surge) parts.push(`surge:${c.surge}`);
            if (c.auntSusan) parts.push(`auntSusan:${c.auntSusan}`);
            if (c.harrison) parts.push(`harrison:${c.harrison}`);
            if (c.zainBlade) parts.push(`zainBlade:${c.zainBlade}`);
            return parts.length ? parts.join(', ') : 'none';
          };
          self.add('COMMIT', `Red committed: ${fmtCommit(rC)}`);
          if (Object.values(bC).some(v => v)) self.add('COMMIT', `Blue committed: ${fmtCommit(bC)}`);
        }

        // ── Full state snapshot ──
        self.add('STATE', `Round ${B.round} — post-resolve snapshot:`);
        self.add('STATE', `  Red active: ${self._ghost(rF)} ${rF?.hp}/${rF?.maxHp} HP${rF?.ko ? ' [KO]' : ''}`);
        self.add('STATE', `  Blue active: ${self._ghost(bF)} ${bF?.hp}/${bF?.maxHp} HP${bF?.ko ? ' [KO]' : ''}`);

        // Bench with IDs
        red.ghosts.forEach((g, i) => {
          if (i !== red.activeIdx) {
            self.add('STATE', `  Red bench[${i}]: ${self._ghost(g)} ${g.hp}/${g.maxHp}${g.ko ? ' [KO]' : ''}`);
          }
        });
        blue.ghosts.forEach((g, i) => {
          if (i !== blue.activeIdx) {
            self.add('STATE', `  Blue bench[${i}]: ${self._ghost(g)} ${g.hp}/${g.maxHp}${g.ko ? ' [KO]' : ''}`);
          }
        });

        // Resources with labels
        const resKeys = ['moonstone', 'ice', 'fire', 'surge', 'healingSeed', 'luckyStone', 'firefly', 'burn'];
        const fmtRes = (res) => resKeys.filter(k => res[k]).map(k => `${k}:${res[k]}`).join(', ') || 'none';
        self.add('STATE', `  Red resources: ${fmtRes(red.resources || {})}`);
        if (Object.values(blue.resources || {}).some(v => v)) {
          self.add('STATE', `  Blue resources: ${fmtRes(blue.resources || {})}`);
        }

        // Permanent effects
        const perms = [];
        if (B.iceBladeForgedPermanent?.red) perms.push('Red: Ice Blade forged');
        if (B.iceBladeForgedPermanent?.blue) perms.push('Blue: Ice Blade forged');
        if (B.flameBlade?.red) perms.push('Red: Flame Blade');
        if (B.flameBlade?.blue) perms.push('Blue: Flame Blade');
        if (B.carpenterHammer?.red) perms.push('Red: Carpenter Hammer');
        if (B.welderTorch?.red) perms.push('Red: Welder Torch');
        if (B.haywireBonus?.red) perms.push(`Red: Haywire +${B.haywireBonus.red} dice`);
        if (B.gordokDieBonus?.red) perms.push(`Red: Gordok +${B.gordokDieBonus.red} dice`);
        if (B.foremanDieBonus?.red) perms.push(`Red: Foreman +${B.foremanDieBonus.red} dice`);
        if (perms.length) self.add('STATE', `  Permanent effects: ${perms.join(' | ')}`);

        // Boss HP pool
        if (typeof RaidState !== 'undefined' && RaidState.isActive()) {
          self.add('BOSS', `Boss pool: ${RaidState.bossCurrentHp}/${RaidState.bossMaxHp}`);
        }

        self.add('RESOLVE', '─────────────────────────────────────────────────────');
      });
    }
  },

  // ══════════════════════════════════════════════════════════════════
  // TURN EVENTS (called from raid-battle-adapter.js)
  // ══════════════════════════════════════════════════════════════════

  recordTurnStart(playerName, slotIdx) {
    this.add('TURN', '');
    this.add('TURN', `═══════════════════════════════════════════════════`);
    this.add('TURN', `TURN: ${playerName} (slot ${slotIdx})`);
    if (typeof RaidState !== 'undefined') {
      this.add('TURN', `Boss HP: ${RaidState.bossCurrentHp}/${RaidState.bossMaxHp} | Enrage: ${RaidState.enrageLevel}`);
    }
    // Log the fighter's team at turn start
    const B = typeof BattleEngine !== 'undefined' ? BattleEngine.getState() : null;
    if (B && B.red) {
      B.red.ghosts.forEach((g, i) => {
        const active = i === B.red.activeIdx ? ' [ACTIVE]' : '';
        this.add('TURN', `  ${this._ghost(g)} ${g.hp}/${g.maxHp}${g.ko ? ' [KO]' : ''}${active}`);
      });
    }
    this.add('TURN', `═══════════════════════════════════════════════════`);
  },

  recordTurnEnd(playerName) {
    this.add('TURN', `── End of ${playerName}'s turn ──`);
  },

  // ── Spectating summary (called when watching another player) ────
  recordSpectating(playerName, slotIdx, bossHp, bossMaxHp) {
    this.add('SPECTATE', `Watching ${playerName} (slot ${slotIdx}) fight...`);
    this.add('SPECTATE', `Boss pool: ${bossHp}/${bossMaxHp}`);
  },

  recordSpectateResult(playerName, bossHpBefore, bossHpAfter, bossMaxHp) {
    const dmg = bossHpBefore - bossHpAfter;
    this.add('SPECTATE', `${playerName}'s turn ended — dealt ${dmg} damage to boss (${bossHpBefore}→${bossHpAfter}/${bossMaxHp})`);
  },

  // ── Entry ability tracking ──────────────────────────────────────
  recordEntry(ghostName, ghostId, team, abilityName) {
    this.add('ENTRY', `[${team}] ${ghostName} (${ghostId}) enters — ability: ${abilityName || 'none'}`);
  },

  // ── Pre-roll decision tracking ──────────────────────────────────
  recordPreRollAction(action, detail) {
    this.add('PRE-ROLL', `${action}: ${detail}`);
  },

  // ── Game over ───────────────────────────────────────────────────
  recordGameOver(winner, bossHp, bossMaxHp) {
    this.add('GAME', '');
    this.add('GAME', '════════════════════════════════════════════════════════');
    this.add('GAME', `GAME OVER — Winner: ${winner}`);
    this.add('GAME', `Boss HP: ${bossHp}/${bossMaxHp}`);

    // Final state of all players
    if (typeof RaidState !== 'undefined') {
      RaidState.players.forEach((p, i) => {
        this.add('GAME', `  Player ${i} [${p?.displayName}]: ${p?.damageDealt || 0} dmg, ${p?.ghostsLost || 0} ghosts lost, status: ${p?.status}`);
      });
    }

    this.add('GAME', '════════════════════════════════════════════════════════');
  },

  // ══════════════════════════════════════════════════════════════════
  // OUTPUT
  // ══════════════════════════════════════════════════════════════════

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

  getText() {
    return this._lines.join('\n');
  }
};
