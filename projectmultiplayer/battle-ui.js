// battle-ui.js — Layer 2: Rendering, narration, audio, ability callouts, HP bars, overlays.
// Depends on: battle-core.js (B, S, active, opp, spd, ghostData, hasSideline), dice.js (renderDice)

// ============================================================
// NARRATION SYSTEM
// ============================================================
// Narration queue — prevents rapid narrations from overwriting each other
let narrateQueue = [];
let narrateActive = false;
function narrate(html) {
  const el = document.getElementById('narrator');
  if (!el) return;
  if (!html) { el.innerHTML = ''; narrateQueue = []; narrateActive = false; return; }
  narrateQueue.push(html);
  if (!narrateActive) drainNarrate();
}
function drainNarrate() {
  const el = document.getElementById('narrator');
  if (!el || narrateQueue.length === 0) { narrateActive = false; return; }
  narrateActive = true;
  const html = narrateQueue.shift();
  el.style.opacity = '0';
  setTimeout(() => {
    el.innerHTML = '<span>' + html + '</span>';
    el.style.opacity = '1';
    // Always hold 1800ms — even as the last item in the queue.
    // Without this, `narrateActive` drops to false immediately after display,
    // so any narrate() called within ~800–1500ms (e.g. "Y enters the arena!"
    // after "X is down!") bypasses the queue and stomps the current line.
    // After the 1800ms hold, drain the next queued item if one arrived,
    // otherwise release the lock so future calls fire immediately.
    setTimeout(() => {
      if (narrateQueue.length > 0) drainNarrate();
      else narrateActive = false;
    }, 1800);
  }, 150);
}

// ============================================================
// AUDIO
// ============================================================
function playSfx(id, vol) {
  const el = document.getElementById(id);
  if (!el || typeof el.play !== 'function') return;
  el.currentTime = 0;
  el.volume = Math.min(vol || 0.8, 1.0);
  el.play().catch(() => {});
}

function playDamageSfx(dmg) {
  if (dmg >= 3) playSfx('sfx3Damage');
  else if (dmg === 2) playSfx('sfx2Damage');
  else playSfx('sfx1Damage');
}

// ============================================================
// MUSIC SYSTEM — v740 rewrite (fixes stale listeners, fade reset, mute state)
// ============================================================
let _musicStarted = false;
let _musicRetryHandler = null; // track the single retry listener so we can remove it

function startMusic() {
  if (_musicStarted) return;
  if (_muted) { _musicStarted = true; return; }
  const music = document.getElementById('bgMusic');
  music.currentTime = 0;
  music.volume = 0.2;
  // Remove any stale retry handler from a previous battle cycle
  if (_musicRetryHandler) {
    document.removeEventListener('click', _musicRetryHandler);
    _musicRetryHandler = null;
  }
  const p = music.play();
  if (p) {
    p.then(() => { _musicStarted = true; }).catch(() => {
      // Autoplay blocked — attach a single retry on next click
      _musicRetryHandler = () => {
        if (_musicStarted) return;
        _musicStarted = true;
        _musicRetryHandler = null;
        music.volume = 0.2;
        music.play().catch(() => {});
      };
      document.addEventListener('click', _musicRetryHandler, { once: true });
    });
  } else {
    _musicStarted = true;
  }
}

function fadeOutMusic() {
  const music = document.getElementById('bgMusic');
  clearInterval(music._fadeInt);
  music._fadeInt = setInterval(() => {
    if (music.volume > 0.03) { music.volume -= 0.03; }
    else {
      clearInterval(music._fadeInt);
      music.pause();
      music.volume = 0.2;
      _musicStarted = false; // reset so music can restart on next battle
    }
  }, 60);
}

// v734: mute toggle — persists via localStorage
let _muted = localStorage.getItem('tr_muted') === '1';
function toggleMute() {
  _muted = !_muted;
  localStorage.setItem('tr_muted', _muted ? '1' : '0');
  const music = document.getElementById('bgMusic');
  const btn = document.getElementById('muteToggle');
  if (_muted) {
    music.pause();
    // Don't reset _musicStarted — muting is temporary, not a stop
    btn.textContent = '\u{1F507}';
    btn.title = 'Music off — click to unmute';
  } else {
    music.volume = 0.2;
    _musicStarted = false; // allow startMusic path to re-engage
    const p = music.play();
    if (p) {
      p.then(() => { _musicStarted = true; }).catch(() => {
        // Autoplay blocked on unmute — retry on next click
        if (_musicRetryHandler) document.removeEventListener('click', _musicRetryHandler);
        _musicRetryHandler = () => {
          if (_musicStarted) return;
          _musicStarted = true;
          _musicRetryHandler = null;
          music.volume = 0.2;
          music.play().catch(() => {});
        };
        document.addEventListener('click', _musicRetryHandler, { once: true });
      });
    } else {
      _musicStarted = true;
    }
    btn.textContent = '\u{1F50A}';
    btn.title = 'Music on — click to mute';
  }
}
// Apply saved mute state on load
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('muteToggle');
  if (btn && _muted) {
    btn.textContent = '\u{1F507}';
    btn.title = 'Music off — click to unmute';
  }
});

function stopMusicHard() {
  const music = document.getElementById('bgMusic');
  clearInterval(music._fadeInt);
  music.pause();
  music.currentTime = 0;
  music.volume = 0.2;
  _musicStarted = false;
  // Clean up any pending retry handler
  if (_musicRetryHandler) {
    document.removeEventListener('click', _musicRetryHandler);
    _musicRetryHandler = null;
  }
}

// Unlock audio on first user interaction (browsers block autoplay)
// v726: skip bgMusic entirely — startMusic() has its own retry-on-click handler.
// unlockAudio's play().then(pause) pattern races with startMusic's retry and kills music.
(function unlockAudio() {
  const unlock = () => {
    document.querySelectorAll('audio').forEach(a => {
      if (a.id === 'bgMusic') return; // handled by startMusic's own retry
      if (!a.paused) return;
      a.play().then(() => a.pause()).catch(() => {});
    });
    document.removeEventListener('click', unlock);
    document.removeEventListener('touchstart', unlock);
  };
  document.addEventListener('click', unlock, { once: true });
  document.addEventListener('touchstart', unlock, { once: true });
})();

// ============================================================
// ABILITY CALLOUT SYSTEM
// ============================================================

function showTriplesEffect(side, rollType) {
  const banner = document.getElementById('triplesBanner');
  const flash = document.getElementById('triplesFlash');
  const bannerText = { penta:'PENTA!!', quads:'QUADS!', triples:'TRIPLES!' };
  banner.textContent = bannerText[rollType] || (rollType.endsWith('-of-a-kind') ? rollType.toUpperCase() + '!!!' : 'TRIPLES!');

  if (rollType === 'triples') playSfx('triplesSfx', 1.0);

  // Glow on dice
  const diceEl = document.getElementById(side + '-dice');
  if (diceEl) {
    diceEl.querySelectorAll('.die').forEach(d => d.classList.add('triples-glow'));
  }
  // Also glow 3D dice
  const tripPh = _dicePhysics[side];
  if (tripPh && tripPh.settled) {
    tripPh.dice.forEach(d => d.el.classList.add('triples-glow-3d'));
  }

  // Flash
  flash.className = 'triples-flash ' + side + '-flash';
  flash.style.transition = 'none';
  flash.style.opacity = '0.6';
  requestAnimationFrame(() => { flash.style.transition = 'opacity 0.8s ease-out'; flash.style.opacity = '0'; });

  // Screen shake
  document.body.classList.add('screen-shake');
  setTimeout(() => document.body.classList.remove('screen-shake'), spd(500));

  // Banner pop
  banner.className = 'triples-banner ' + side + '-triples';
  requestAnimationFrame(() => {
    banner.classList.add('show');
    setTimeout(() => {
      banner.classList.remove('show');
      banner.classList.add('fade');
      setTimeout(() => { banner.className = 'triples-banner'; }, spd(500));
    }, spd(1200));
  });
}

// Ability splash themes mapped from color vars
const SPLASH_THEMES = {
  'var(--magma)':      'theme-fire',
  'var(--moonstone)':  'theme-blue',
  'var(--rare)':       'theme-blue',
  'var(--ghost-rare)': 'theme-purple',
  'var(--uncommon)':   'theme-green',
  'var(--legendary)':  'theme-gold',
  'var(--accent)':     'theme-red',
  '#22c55e':           'theme-green',
  '#fbbf24':           'theme-gold',
  '#a855f7':           'theme-purple',
};

// ============================================================
// ABILITY QUEUE — cinematic sequential playback
// ============================================================
let abilityQueue = [];
let abilityQueueMode = false;

function queueAbility(name, color, desc, onShow, team) {
  if (abilityQueueMode) {
    abilityQueue.push({ name, color, desc, onShow, team });
  } else {
    showAbilityCallout(name, color, desc, team);
    if (onShow) onShow();
  }
}

function drainAbilityQueue(callback) {
  abilityQueueMode = false;
  if (abilityQueue.length === 0) {
    try { callback(); } catch (e) { console.error('[drainAbilityQueue empty-callback CRASH]', e); try { log(`<span class="log-dmg">ERROR in post-drain callback:</span> ${e && e.message ? e.message : String(e)}`); } catch (_) {} try { B.phase = 'ready'; resetRollButtons(); renderBattle(); } catch (_) {} }
    return;
  }
  let i = 0;
  function next() {
    if (i >= abilityQueue.length) {
      abilityQueue = [];
      // 1500ms: each splash displays for 1400ms, so firing the callback at 900ms
      // (the old value) meant the last splash still had 500ms left on screen when
      // the callback ran — causing roll buttons, modals, and narration to appear
      // while the callout was still visible.  1500ms gives 100ms of clearance after
      // the last splash auto-dismisses, eliminating the race across ALL drain paths.
      // v386: wrap callback in try/catch so a broken post-drain handler never freezes the game
      setTimeout(() => {
        try { callback(); } catch (e) {
          console.error('[drainAbilityQueue callback CRASH]', e);
          try { log(`<span class="log-dmg">ERROR in post-drain callback:</span> ${e && e.message ? e.message : String(e)}`); } catch (_) {}
          try { B.phase = 'ready'; resetRollButtons(); renderBattle(); } catch (_) {}
        }
      }, spd(1500));
      return;
    }
    const a = abilityQueue[i++];
    // v386: wrap each ability's onShow in try/catch — a single broken closure must not
    // kill the whole cinematic queue and freeze the game.
    try { showAbilityCallout(a.name, a.color, a.desc, a.team); } catch (e) { console.error('[showAbilityCallout CRASH]', a, e); }
    if (a.onShow) {
      try { a.onShow(); } catch (e) { console.error('[ability onShow CRASH]', a.name, e); try { log(`<span class="log-dmg">ERROR in ${a.name} onShow:</span> ${e && e.message ? e.message : String(e)}`); } catch (_) {} }
    }
    setTimeout(next, spd(1300));
  }
  next();
}

// showAbilityCallout — v407: no more full-screen proscenium splash.
// Instead: the firing fighter's card glows with a themed spotlight pulse,
// and the narrator strip shows the ability name + desc for the callout beat.
// #abilitySplash DOM element kept (display:none) so .active toggling still works
// for any external code that reads it (3 callsites) — safe no-op.
function showAbilityCallout(name, color, desc, team) {
  // v721: capture ability events for PvP Blue sync (hooked here to catch ALL callouts)
  if (LIVE_PVP && PVP_SIDE === 'red') {
    pvpAbilityEvents.push({ name: name || '', color: color || '', desc: desc || '', team: team || '' });
  }
  // Maintain splash .active compatibility (visual no-op — CSS sets display:none)
  const el = document.getElementById('abilitySplash');
  const theme = SPLASH_THEMES[color] || '';
  el.className = 'ability-splash ' + theme;
  el.classList.add('active');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.classList.remove('active'); }, spd(1400));

  // Play the ability SFX — audio cue is good, keep it
  playSfx('sfxSpecial', 0.85);

  // Card spotlight glow — pulse the firing fighter's slot
  if (team) {
    const slotId = team === 'red' ? 'red-fighter' : 'blue-fighter';
    const slot = document.getElementById(slotId);
    if (slot) {
      const fireTheme = theme.replace('theme-', '') || 'default';
      clearTimeout(slot._abilityFireTimer);
      slot.classList.remove(
        'ability-fire', 'ability-fire-fire', 'ability-fire-blue',
        'ability-fire-purple', 'ability-fire-green', 'ability-fire-gold',
        'ability-fire-red', 'ability-fire-default'
      );
      void slot.offsetWidth; // force reflow so re-trigger restarts the animation
      slot.classList.add('ability-fire', 'ability-fire-' + fireTheme);
      slot._abilityFireTimer = setTimeout(() => {
        slot.classList.remove(
          'ability-fire', 'ability-fire-fire', 'ability-fire-blue',
          'ability-fire-purple', 'ability-fire-green', 'ability-fire-gold',
          'ability-fire-red', 'ability-fire-default'
        );
      }, spd(1200));
    }
  }

  // Narrator strip — ability name (colored) + desc for the duration of the beat
  const narrator = document.getElementById('narrator');
  if (narrator) {
    clearTimeout(narrator._abilityTimer);
    narrator.classList.add('ability-active');
    narrator.innerHTML = '<b style="color:' + (color || 'var(--moonstone)') + '">' + name + '</b>' +
      (desc ? ' <span style="opacity:0.72;font-size:12px;font-weight:500">\u2014 ' + desc + '</span>' : '');
    narrator._abilityTimer = setTimeout(() => { narrator.classList.remove('ability-active'); }, spd(1300));
  }

  // Small hype-pop callout strip — unobtrusive, keep it
  const small = document.getElementById('abilityCallout');
  if (small) {
    small.style.visibility = '';
    small.textContent = name;
    small.style.color = color || 'var(--moonstone)';
    small.classList.remove('hype-pop');
    void small.offsetWidth;
    small.classList.add('hype-pop');
    clearTimeout(small._timer);
    small._timer = setTimeout(() => { small.textContent = ''; small.classList.remove('hype-pop'); }, spd(2200));
  }
}

// ============================================================
// RENDERING
// ============================================================
function renderCardSlot(ghost, isFighter) {
  const g = ghostData(ghost.id) || ghost; // fallback to ghost object itself (boss ghosts)
  const rarityLabel = (g.rarity || 'legendary').replace('-',' ');
  const artHtml = g.art
    ? `<img class="card-img" src="${g.art}" alt="${ghost.name}" loading="lazy" onerror="this.outerHTML='<div class=\\'card-img-placeholder\\'>👻</div>'">`
    : `<div class="card-img-placeholder">👻</div>`;
  let statusHtml = '';
  if (isFighter) {
    if (ghost.hankFirstRoll) statusHtml += `<span class="status-tag pressure">Lazy (1-2-3)</span>`;
    if (ghost.maximoFirstRoll) statusHtml += `<span class="status-tag streak">Napping (1 die)</span>`;
    // Check if opponent has Timber (210) — Howl debuff indicator
    if (B) {
      const thisTeam = B.red.ghosts.includes(ghost) ? B.red : B.blue;
      const thisTeamName = thisTeam === B.red ? 'red' : 'blue';
      const oppTeam = thisTeam === B.red ? B.blue : B.red;
      const oppActive = active(oppTeam);
      if (oppActive && oppActive.id === 210 && !oppActive.ko) {
        statusHtml += `<span class="status-tag pressure" style="background:var(--surface3);">⚠️ Timber · Choose Each Roll</span>`;
      }
      // Retribution indicator — Knight Light (402) has pending bonus dice stored up
      if (ghost.id === 402 && !ghost.ko && B.retributionDice) {
        const stored = B.retributionDice[thisTeamName] || 0;
        if (stored > 0) {
          statusHtml += `<span class="status-tag" style="background:rgba(52,152,219,0.15);color:var(--rare);">+${stored} ⚡ Retribution</span>`;
        }
      }
      // Zain (206) — Ice Blade: persistent forged status
      if (ghost.id === 206 && !ghost.ko && ghost.iceBladeForged) {
        statusHtml += `<span class="status-tag" style="background:rgba(103,232,249,0.18);color:#67e8f9;border:1px solid rgba(103,232,249,0.45);" title="Ice Blade forged — swing for +1 die and +2 damage on win">🗡️ Ice Blade</span>`;
      }
            // Finn (204) Forge indicator:
      // • Finn on sideline → show Forge state on the active fighter's card
      // • Finn IS the active fighter → show "dormant" on his own card so players
      //   know they need to bench him for Forge to activate
      if (ghost.id === 204) {
        statusHtml += `<span class="status-tag" style="background:rgba(100,116,139,0.18);color:#94a3b8;" title="Finn can forge the Flame Blade (sideline or active)">🔥 Flame Blade: ${B.flameBlade && B.flameBlade[thisTeamName] ? 'FORGED' : 'ready to forge'}</span>`;
      } else if (hasSideline(thisTeam, 204)) {
        const canForge = (thisTeam.resources.ice >= 2) || (thisTeam.resources.fire >= 2);
        if (canForge) {
          statusHtml += `<span class="status-tag" style="background:rgba(251,191,36,0.16);color:#fbbf24;border:1px solid rgba(251,191,36,0.35);">🔨 Forge: ready</span>`;
        } else {
          statusHtml += `<span class="status-tag" style="background:rgba(100,116,139,0.18);color:#94a3b8;">🔨 Forge: idle</span>`;
        }
      }
    }
    // Overclock indicator — moonstone cyan pulse, matching HP bar + HP text colors when hp > maxHp
    if (ghost.hp > ghost.maxHp) {
      const overAmt = ghost.hp - ghost.maxHp;
      statusHtml += `<span class="status-tag overclock">💧 +${overAmt} Overheal</span>`;
    }
  }
  // HP color
  const hpRatio = ghost.hp / ghost.maxHp;
  const hpColor = hpRatio > 1 ? 'var(--moonstone)' : hpRatio > 0.6 ? 'var(--hp-green)' : hpRatio > 0.3 ? 'var(--hp-yellow)' : 'var(--hp-red)';
  return `
    <div class="card-name-banner rarity-${g.rarity}">${ghost.name}</div>
    <div class="card-rarity-badge rarity-${g.rarity}">${rarityLabel}</div>
    <div class="card-hp-badge" style="color:${hpColor}">${ghost.hp}/${ghost.maxHp}</div>
    ${artHtml}
    <div class="ability-banner">${g.ability}</div>
    <div class="card-info">
      <div class="ci-desc" title="${g.abilityDesc}">${g.abilityDesc}</div>
    </div>
    ${statusHtml ? `<div class="fighter-status">${statusHtml}</div>` : ''}`;
}

function updateHpBar(team, hp, maxHp) {
  const pct = Math.max(0, hp / maxHp * 100);
  const bar = document.getElementById(`${team}-hpBar`);
  bar.style.width = Math.min(pct, 100) + '%';
  const isOverclock = hp > maxHp;
  bar.classList.toggle('hp-low', !isOverclock && pct <= 50 && pct > 25);
  bar.classList.toggle('hp-critical', !isOverclock && pct <= 25);
  bar.classList.toggle('hp-overclock', isOverclock);
  const hpText = document.getElementById(`${team}-hpText`);
  hpText.textContent = `${Math.max(0, hp)} / ${maxHp}`;
  if (isOverclock) hpText.style.color = 'var(--moonstone)';
  else hpText.style.color = '';
}

// Visual hit — shake the card + drain the HP bar for a team
function hitDamage(teamName) {
  const t = B[teamName];
  const f = active(t);
  const el = document.getElementById(teamName + '-fighter');
  el.classList.add('hit');
  setTimeout(() => el.classList.remove('hit'), 500);
  updateHpBar(teamName, f.hp, f.maxHp);
}

function renderBattle() {
  if (!B) return;

  // v736: enforce Moonstone cap (1) and Firefly cap (1) globally
  ['red','blue'].forEach(s => {
    if (B[s].resources.moonstone > 1) B[s].resources.moonstone = 1;
    if ((B[s].resources.firefly || 0) > 1) B[s].resources.firefly = 1;
  });

  ['red','blue'].forEach(team => {
    const t = B[team];
    const f = active(t);
    const sl = t.ghosts.filter((_,i) => i !== t.activeIdx);

    // Fighter
    const fighterEl = document.getElementById(`${team}-fighter`);
    const fData = ghostData(f.id) || f;
    fighterEl.className = `arena-card fighter-slot team-${team} rarity-${fData.rarity || 'legendary'} ${f.ko?'ko':''}`;
    fighterEl.innerHTML = renderCardSlot(f, true);

    // HP Bar
    updateHpBar(team, f.hp, f.maxHp);

    // Sideline
    const slLeft = document.getElementById(`${team}-sl-left`);
    const slRight = document.getElementById(`${team}-sl-right`);
    const isKoPickTeam = B.phase === 'ko-swap' && B.koSwapQueue && B.koSwapQueue[0] === team;
    [slLeft, slRight].forEach((el, i) => {
      if (sl[i] && !sl[i].isPadded) {
        el.style.visibility = 'visible';
        const slData = ghostData(sl[i].id) || sl[i];
        const isPick = isKoPickTeam && !sl[i].ko;
        const realIdx = t.ghosts.indexOf(sl[i]);
        el.className = `arena-card sideline-slot rarity-${slData.rarity || 'legendary'} ${sl[i].ko?'ko':''} ${isPick?'ko-swap-pick':''}`;
        let slCardHtml = renderCardSlot(sl[i], false);
        // Burn badge: show how much burn is stacked on this sideline ghost
        if (B.burn && B.burn[team] && B.burn[team][realIdx]) {
          const bc = B.burn[team][realIdx];
          slCardHtml += `<div class="burn-badge">🔥${bc}</div>`;
        }
        el.innerHTML = slCardHtml;
        el.onclick = isPick ? () => doKoSwap(team, realIdx) : null;
      } else {
        el.style.visibility = 'hidden';
        el.onclick = null;
      }
    });

    // Resources — single tile per resource (boobattles style)
    const r = t.resources;
    const c = B.committed[team];
    // Pre-roll controls are available during 'ready' OR during the Duel Phase
    // when it's this team's turn — matches the isPreRollActive() handler gate.
    const isReady = isPreRollActive(team);
    // Sylvia (313): ice is free (not consumed on commit), so r.ice already includes committed ice
    const isSylviaActive = f && f.id === 313 && !f.ko;
    const totalIce = isSylviaActive ? r.ice : (r.ice + c.ice);
    const totalFire = r.fire + c.fire;
    const totalSurge = r.surge + c.surge;
    let rh = '';

    if (r.moonstone > 0) {
      rh += `<div class="res-tile moonstone" title="Moonstone: after rolling, click it — then pick any die and set it to any value you choose"><span class="res-main">💎</span><span class="res-count">${r.moonstone}</span><span class="res-label">MS</span></div>`;
    }
    if (totalIce > 0) {
      const committed = c.ice > 0;
      const click = isReady ? `onclick="cycleCommit('${team}','ice')"` : '';
      const label = committed ? `${c.ice}/${totalIce}⚔` : totalIce;
      const tileLabel = committed ? `+${c.ice} DMG` : 'ICE';
      const iceTitle = committed
        ? `${c.ice} of ${totalIce} Ice Shard${totalIce>1?'s':''} committed — +${c.ice} damage if you win${c.ice < totalIce ? ' (click to commit more)' : ''}`
        : `Ice Shards: ${totalIce} available — click to commit (+1 dmg each)`;
      rh += `<div class="res-tile ice ${committed?'committed':''} ${isReady?'clickable':''}" ${click} title="${iceTitle}"><span class="res-main"><img src="../boobattles/iceshard.png"></span><span class="res-count">${label}</span><span class="res-label ${committed?'res-label-bonus':''}">${tileLabel}</span></div>`;
    }
    if (totalFire > 0) {
      const committed = c.fire > 0;
      const click = isReady ? `onclick="cycleCommit('${team}','fire')"` : '';
      const label = committed ? `${c.fire}/${totalFire}⚔` : totalFire;
      const tileLabel = committed ? `+${c.fire*3} DMG` : 'FIRE';
      const fireTitle = committed
        ? `${c.fire} of ${totalFire} Sacred Fire committed — +${c.fire*3} damage if you win${c.fire < totalFire ? ' (click to commit more)' : ''}`
        : `Sacred Fire: ${totalFire} available — click to commit (+3 dmg each)`;
      rh += `<div class="res-tile fire ${committed?'committed':''} ${isReady?'clickable':''}" ${click} title="${fireTitle}"><span class="res-main"><img src="../boobattles/sacredfire.png"></span><span class="res-count">${label}</span><span class="res-label ${committed?'res-label-bonus':''}">${tileLabel}</span></div>`;
    }
    if (totalSurge > 0) {
      const committed = c.surge > 0;
      const click = isReady ? `onclick="cycleCommit('${team}','surge')"` : '';
      const label = committed ? `${c.surge}/${totalSurge}⚔` : totalSurge;
      const tileLabel = committed ? `+${c.surge} ${c.surge>1?'DICE':'DIE'}` : 'SURGE';
      const surgeTitle = committed
        ? `${c.surge} of ${totalSurge} Surge committed — +${c.surge} extra ${c.surge>1?'dice':'die'} this roll${c.surge < totalSurge ? ' (click to commit more)' : ''}`
        : `Surge: ${totalSurge} available — click to commit (+1 extra die each)`;
      rh += `<div class="res-tile surge ${committed?'committed':''} ${isReady?'clickable':''}" ${click} title="${surgeTitle}"><span class="res-main">⚡</span><span class="res-count">${label}</span><span class="res-label ${committed?'res-label-bonus':''}">${tileLabel}</span></div>`;
    }
    if (r.healingSeed > 0) {
      const canHeal = isReady && f.hp < f.maxHp;
      const click = canHeal ? `onclick="spendHealingSeed('${team}')"` : '';
      const seedTitle = canHeal
        ? `Healing Seed: click to heal 1 HP (${f.hp}/${f.maxHp})`
        : f.hp > f.maxHp
          ? `Healing Seed: HP is overclocked (${f.hp}/${f.maxHp}) — Seeds cannot heal above max HP`
          : f.hp === f.maxHp
            ? `Healing Seed: HP is already full (${f.hp}/${f.maxHp}) — can't use now`
            : `Healing Seed: heal 1 HP — only usable during your turn`;
      rh += `<div class="res-tile healingSeed ${canHeal?'clickable':''}" ${click} title="${seedTitle}"><span class="res-main">🌱</span><span class="res-count">${r.healingSeed}</span><span class="res-label">SEED</span></div>`;
    }
    if (r.luckyStone > 0) {
      rh += `<div class="res-tile luckyStone" title="Lucky Stone: use after rolling to reroll any one of your dice"><span class="res-main">🍀</span><span class="res-count">${r.luckyStone}</span><span class="res-label">LUCK</span></div>`;
    }
    // Magic Fireflies — clickable wildcard resource (pre-roll only)
    if (r.firefly > 0) {
      const ffClick = isReady ? `onclick="showFireflyPicker('${team}')"` : '';
      rh += `<div class="res-tile firefly ${isReady?'clickable':''}" ${ffClick} title="Magic Fireflies: ${r.firefly} available — click to convert to any resource"><span class="res-main">✨</span><span class="res-count">${r.firefly}</span><span class="res-label">FIREFLY</span></div>`;
    }
    // Burn resource pool — clickable to place on enemy sideline ghosts (pre-roll only)
    if (r.burn > 0) {
      const burnClick = isReady ? `onclick="showBurnPicker('${team}')"` : '';
      rh += `<div class="res-tile fire ${isReady?'clickable':''}" ${burnClick} title="Burn: ${r.burn} available — click to place on an enemy sideline ghost (deals damage on entry)"><span class="res-main">🔥</span><span class="res-count">${r.burn}</span><span class="res-label">BURN</span></div>`;
    }
    // Burn placed indicator removed — burn disappears when spent, no need to track visually
    // Happy Crystal (208) — sacrifice tile
    if (isReady && f.id === 208 && !f.ko) {
      rh += `<div class="res-tile moonstone clickable" onclick="sacrificeHappyCrystal('${team}')" title="Sacrifice for 1 Moonstone"><span class="res-main">💀</span><span class="res-label">Sac</span></div>`;
    }
    // Aunt Susan (309) — commit healing seeds for damage (click=add, right-click=remove)
    if (isReady && f.id === 309 && (r.healingSeed > 0 || c.auntSusan > 0)) {
      rh += `<div class="res-tile healingSeed clickable ${c.auntSusan>0?'committed':''}" onclick="toggleAuntSusan('${team}')" oncontextmenu="event.preventDefault();uncommitAuntSusan('${team}')" title="Click: +2 dmg per seed. Right-click: remove"><span class="res-main">🌱</span><span class="res-label">${c.auntSusan>0?'+'+c.auntSusan*2+'dmg':'+2dmg'}</span></div>`;
    }
    // Moonstone Sickness indicator
    {
      const msMode = document.getElementById('moonstoneModeSelect')?.value || 'D';
      const stacks = t.moonstoneSickness || 0;
      const pending = t.moonstoneSicknessPending || 0;
      if ((msMode === 'A' || msMode === 'D' || msMode === 'G') && stacks > 0) {
        const dmgPerTurn = msMode === 'A' ? stacks * 2 : stacks;
        rh += `<div class="res-tile" style="border-color:rgba(168,85,247,0.5);box-shadow:0 0 8px rgba(168,85,247,0.3);" title="Moonstone Sickness: ${dmgPerTurn} damage before every roll (${stacks} stack${stacks>1?'s':''})"><span class="res-main" style="font-size:16px;">🌑</span><span class="res-count" style="color:#a855f7;">${dmgPerTurn}</span><span class="res-label" style="color:#a855f7;">SICK×${stacks}</span></div>`;
      } else if ((msMode === 'B' || msMode === 'C') && pending > 0) {
        rh += `<div class="res-tile" style="border-color:rgba(168,85,247,0.5);box-shadow:0 0 8px rgba(168,85,247,0.3);" title="Moonstone Sickness: ${pending} damage before next roll"><span class="res-main" style="font-size:16px;">🌑</span><span class="res-count" style="color:#a855f7;">${pending}</span><span class="res-label" style="color:#a855f7;">NEXT</span></div>`;
      }
    }
    // Snapshot current resources for flash detection
    const newSnap = { moonstone:r.moonstone, ice:totalIce, fire:totalFire, surge:r.surge+c.surge, healingSeed:r.healingSeed, luckyStone:r.luckyStone, firefly:r.firefly||0 };
    const prev = prevResources[team] || {};
    document.getElementById(`${team}-resources`).innerHTML = rh;
    // Flash any resource tile that increased
    const resEl = document.getElementById(`${team}-resources`);
    ['moonstone','ice','fire','surge','healingSeed','luckyStone','firefly'].forEach(key => {
      if ((newSnap[key]||0) > (prev[key]||0)) {
        const tile = resEl.querySelector(`.res-tile.${key}`);
        if (tile) { tile.classList.remove('res-gained'); void tile.offsetWidth; tile.classList.add('res-gained'); }
      }
    });
    prevResources[team] = newSnap;

    // Persistent permanent effect badges
    const opp_team = team === 'red' ? 'blue' : 'red';
    let permHtml = '';
    if (B.haywireBonus && B.haywireBonus[team] > 0) permHtml += `<div class="permanent-buff">\u{1F3B5} +${B.haywireBonus[team]} Die (Wild Chords)</div>`;
    if (B.haywireDamageBonus && B.haywireDamageBonus[team] > 0) permHtml += `<div class="permanent-buff">\u{1F3B5} +${B.haywireDamageBonus[team]} Dmg (Wild Chords)</div>`;
    if (B.pipDieRemoval && B.pipDieRemoval[team] > 0) permHtml += `<div class="permanent-debuff">🍞 -${B.pipDieRemoval[team]} Die (Toasted)</div>`;
    if (B.carpenterHammer && B.carpenterHammer[team]) permHtml += `<div class="permanent-buff">🔨 Hammer: Singles hit +2 harder</div>`;
    if (B.welderTorch && B.welderTorch[team]) permHtml += `<div class="permanent-buff">💥 Torch: Wins give +1 Burn</div>`;
    if (permHtml) {
      const permRow = document.createElement('div');
      permRow.className = 'permanent-effects-row';
      permRow.innerHTML = permHtml;
      resEl.appendChild(permRow);
    }
  });

  const turnEl = document.getElementById('turnIndicator');
  if (turnEl) turnEl.textContent = '';
  const battleLogEl = document.getElementById('battleLog');
  if (battleLogEl) {
    const logWrap = battleLogEl.parentElement;
    battleLogEl.innerHTML = B.log.map(l=>`<div class="log-entry">${l}</div>`).join('');
    if (logWrap) logWrap.scrollTop = 0;
  }

  // Ability buttons (pre-roll actions)
  // Spectators see NO ability buttons — they can't interact
  const isSpectator = typeof RaidState !== 'undefined' && RaidState.amSpectator && RaidState.amSpectator();
  ['red','blue'].forEach(team => {
    const el = document.getElementById(`${team}-ability-buttons`);
    // Spectators: clear ALL ability buttons
    if (isSpectator) { el.innerHTML = ''; return; }
    // Boss mode: skip blue ability buttons — boss doesn't get interactive buttons
    if (window.BOSS_MODE && team === 'blue') { el.innerHTML = ''; return; }
    const f = active(B[team]);
    const enemy = opp(B[team]);
    let html = '';
    if (isPreRollActive(team)) {
      // Dark Fang (202) — Pressure button (once per round)
      if (f.id === 202 && !f.ko && !dylanNegates(enemy) && !(B.pressureUsed && B.pressureUsed[team])) {
        const enemySideline = enemy.ghosts.filter((g,i) => i !== enemy.activeIdx && !g.ko);
        if (enemySideline.length > 0) {
          html += `<button class="ability-btn pressure" onclick="usePressure('${team}')">🔥 Pressure</button>`;
        }
      }
      // Tyson (365) — Hop: swap self to bench before rolling (no entry effects)
      if (f.id === 365 && !f.ko) {
        const aliveSl = B[team].ghosts.filter((g,i) => i !== B[team].activeIdx && !g.ko);
        if (aliveSl.length > 0) {
          const blocked = dylanNegates(enemy);
          html += `<button class="ability-btn ${blocked?'':'pressure'}" onclick="useTysonHop('${team}')" ${blocked?'disabled title="Blocked by Dylan"':''}>${blocked?'🚫':'🐰'} Hop${blocked?' (Blocked)':''}</button>`;
        }
      }
      // Harrison (315) — Ascend: spend seeds for extra dice (click=add, right-click=remove)
      if (f.id === 315 && !f.ko && (B[team].resources.healingSeed > 0 || B.committed[team].harrison > 0)) {
        const cnt = B.committed[team].harrison;
        html += `<button class="ability-btn ${cnt>0?'committed':'pressure'}" onclick="toggleHarrison('${team}')" oncontextmenu="event.preventDefault();uncommitHarrison('${team}')" style="${cnt>0?'border-color:#22c55e;box-shadow:0 0 8px rgba(34,197,113,0.4);':''}">🌱 Ascend${cnt>0?' (+'+cnt+' dice)':''}</button>`;
      }
      // Mable Stadango (446) — Hex: now passive (triggers in doBurnPlace), no button needed
      // Finn (204) — Flame Blade: forge button (2 Healing Seeds + 1 Sacred Fire) OR swing toggle if forged
      if (B[team].ghosts.some(g => g.id === 204 && !g.ko)) {
        if (!B.flameBlade || !B.flameBlade[team]) {
          const r = B[team].resources;
          const canForge = (r.healingSeed || 0) >= 1 && (r.fire || 0) >= 1;
          if (canForge) {
            html += `<button class="ability-btn pressure" onclick="useFinnFlameBlade('${team}')" title="Finn — forge the Flame Blade (2 Healing Seeds + 1 Sacred Fire)" style="border-color:#fb923c;color:#fb923c;">🔥 Forge Flame Blade (1🌱 + 1🔥)</button>`;
          } else {
            html += `<button class="ability-btn" disabled title="Need 2 Healing Seeds + 1 Sacred Fire" style="opacity:0.4;border-color:#fb923c;color:#fb923c;">🔥 Forge Flame Blade (1🌱 + 1🔥)</button>`;
          }
        }
      }
      // Flame Blade toggle (if forged — shown for any active ghost on the team)
      if (B.flameBlade && B.flameBlade[team]) {
        const fbSwung = B.flameBladeSwing && B.flameBladeSwing[team];
        html += `<button class="ability-btn ${fbSwung?'committed':'pressure'}" onclick="toggleFlameBlade('${team}')" title="${fbSwung?'Sheathing — click to stop swinging':'Swing the Flame Blade — +1 die to your roll AND +3 Burn if you win'}" style="border-color:#fb923c;color:${fbSwung?'#fff':'#fb923c'};${fbSwung?'background:linear-gradient(135deg,#b45309,#fb923c);':''}">🔥 ${fbSwung?'Flame Blade SWINGING (+1 die, +3 Burn on win)':'Swing Flame Blade'}</button>`;
      }
      // Zain (206) — Ice Blade: forge button (Sideline & In Play) OR swing toggle (any active ghost, if forged)
      const hasZainForForge = (f.id === 206 && !f.ko) || B[team].ghosts.some(g => g.id === 206 && !g.ko && B[team].ghosts.indexOf(g) !== B[team].activeIdx);
      if (hasZainForForge && !B.iceBladeForgedPermanent[team]) {
        const r = B[team].resources;
        const canForge = r.ice >= 1 && r.moonstone >= 1;
        if (canForge) {
          html += `<button class="ability-btn pressure" onclick="useZainForge('${team}')" title="Forge the Ice Blade — spend 1 Ice Shard + 1 Moonstone" style="border-color:#67e8f9;color:#67e8f9;">🗡️ Forge Ice Blade (1❄️ + 1💎)</button>`;
        } else {
          html += `<button class="ability-btn" disabled title="Need 1 Ice Shard + 1 Moonstone to forge" style="opacity:0.4;border-color:#67e8f9;color:#67e8f9;">🗡️ Forge Ice Blade (1❄️ + 1💎)</button>`;
        }
      }
      // Ice Blade toggle (if forged — shown for any active ghost on the team)
      if (B.iceBladeForgedPermanent && B.iceBladeForgedPermanent[team]) {
        const ibSwung = (B.iceBladeSwing && B.iceBladeSwing[team]) || (B.committed[team].zainBlade > 0);
        html += `<button class="ability-btn ${ibSwung?'committed':'pressure'}" onclick="toggleIceBlade('${team}')" title="${ibSwung?'Sheathing — click to stop swinging':'Swing the Ice Blade — +1 die to your roll AND +2 damage if you win'}" style="border-color:#67e8f9;color:${ibSwung?'#fff':'#67e8f9'};${ibSwung?'background:linear-gradient(135deg,#0e7490,#67e8f9);':''}">🗡️ ${ibSwung?'Ice Blade SWINGING (+1 die, +2 dmg on win)':'Swing Ice Blade'}</button>`;
      }
      // Sophia (457) — Mask toggle (shown for any active ghost on the team, if mask is owned)
      if (B.sophiaMask && B.sophiaMask[team]) {
        const maskType = B.sophiaMask[team];
        const maskOn = B.sophiaMaskActive[team];
        const maskIcon = maskType === 'day' ? '☀️' : '🌙';
        const maskName = maskType === 'day' ? 'Mask of Day' : 'Mask of Night';
        const maskEffect = maskType === 'day' ? 'Gain 1 Burn per 1 or 2 rolled' : 'Mirror enemy dice count, +1 dmg';
        const maskColor = maskType === 'day' ? '#ffd700' : '#6b7aff';
        const maskBg = maskType === 'day' ? 'background:linear-gradient(135deg,#b8860b,#ffd700);' : 'background:linear-gradient(135deg,#2a2a5a,#6b7aff);';
        html += `<button class="ability-btn ${maskOn?'committed':'pressure'}" onclick="toggleSophiaMask('${team}')" title="${maskOn?'Remove mask':'Wear mask — '+maskEffect}" style="border-color:${maskColor};color:${maskOn?'#fff':maskColor};${maskOn?maskBg:''}">${maskIcon} ${maskOn?maskName+' ON ('+maskEffect+')':'Wear '+maskName}</button>`;
      }
      // Carpenter (449) — no button needed; transforms when Surge is committed via cycleCommit
      // Smudge (403) — Blackout: name a number
      if (f.id === 403 && !f.ko) {
        html += `<div class="blackout-picker">
          <span class="blackout-label">Blackout:</span>
          ${[1,2,3,4,5,6].map(n =>
            `<button class="blackout-num ${B.blackoutNum && B.blackoutNum[team] === n ? 'active' : ''}" onclick="setBlackout('${team}', ${n})">${n}</button>`
          ).join('')}
        </div>`;
      }
      // Zork (463) — Stoke: pre-roll button to discard Burn for dice
      if (f.id === 463 && !f.ko && B.zorkDecided && !B.zorkDecided[team] &&
          B[team].resources && B[team].resources.burn >= 1) {
        html += `<button class="ability-btn pressure" onclick="useZorkStoke('${team}')" style="border-color:#f59e0b;color:#f59e0b;font-weight:bold;">🔥 SMOLDER! (${B[team].resources.burn} Burn → +${B[team].resources.burn} dice)</button>`;
      }
      // Miyoshi (454) — Bonzai!: pre-roll button to sacrifice HP for dice
      if (f.id === 454 && !f.ko && f.hp > 4 && B.bonzaiDecided && !B.bonzaiDecided[team]) {
        html += `<button class="ability-btn pressure" onclick="useBonzaiButton('${team}')" style="border-color:#dc2626;color:#dc2626;font-weight:bold;">⚡ BONZAI! (−4 HP, +5 dice)</button>`;
      }
      // Toby (97) — Pure Heart: pre-roll button to declare all-in
      if (f.id === 97 && !f.ko &&
          B.pureHeartDeclared && B.pureHeartDeclared[team] === null &&
          !(B.pureHeartScheduledKO && B.pureHeartScheduledKO[team])) {
        html += `<button class="ability-btn pressure" onclick="useTobyButton('${team}')" style="border-color:#7f1d1d;color:#7f1d1d;font-weight:bold;">💀 PURE HEART! (Final Roll)</button>`;
      }
      // Castle Gardener (442) — Cultivate: pre-roll button to trade seeds for fire
      if (f.id === 442 && !f.ko && B[team].resources && B[team].resources.healingSeed >= 1) {
        html += `<button class="ability-btn pressure" onclick="useCultivate('${team}')" style="border-color:#40916c;color:#40916c;font-weight:bold;">🌱 CULTIVATE! (1 Seed → 2 Sacred Fire)</button>`;
      }
      // No voluntary swap — swapping only happens via abilities (Tyson Hop, Pressure) or KO
    }
    el.innerHTML = html;
  });

  // Raid boss HP bar: track cumulative damage to blue team (exclude padded ghosts)
  if (RAID_MODE && RAID_PARAMS && B.blue) {
    let totalBlueDamage = 0;
    const realCount = RAID_PARAMS.realBossGhostCount || B.blue.ghosts.length;
    for (let i = 0; i < realCount; i++) {
      const g = B.blue.ghosts[i];
      if (g) totalBlueDamage += g.maxHp - Math.max(0, g.ko ? 0 : g.hp);
    }
    RAID_PARAMS.bossHp = Math.max(0, RAID_PARAMS.bossMaxHp - totalBlueDamage);
    updateRaidBossBar();

    // Write battle snapshot to Firebase for spectators (throttled to every 2s)
    if (RAID_PARAMS.instanceId && db) {
      const now = Date.now();
      if (!window._lastRaidSnapshot || now - window._lastRaidSnapshot > 2000) {
        window._lastRaidSnapshot = now;
        const redActive = active(B.red);
        const blueActive = active(B.blue);
        const snapshot = {
          playerName: MP_PLAYER_NAMES.red || 'Raider',
          playerGhost: { name: redActive.name, hp: redActive.hp, maxHp: redActive.maxHp, art: redActive.art || '' },
          bossGhost: { name: blueActive.name, hp: blueActive.hp, maxHp: blueActive.maxHp, art: blueActive.art || '', isBoss: true },
          playerSideline: B.red.ghosts.filter((_, i) => i !== B.red.activeIdx).map(g => ({ name: g.name, hp: g.hp, maxHp: g.maxHp, ko: g.ko })),
          bossSideline: B.blue.ghosts.filter((_, i) => i !== B.blue.activeIdx).slice(0, realCount - 1).map(g => ({ name: g.name, hp: g.hp, maxHp: g.maxHp, ko: g.ko })),
          bossPoolHp: RAID_PARAMS.bossHp,
          bossMaxHp: RAID_PARAMS.bossMaxHp,
          round: B.round || 1,
          phase: B.phase || 'roll',
          lastRoll: window._lastRaidRollData || null,
          abilityCallout: window._lastRaidAbilityCallout || null,
          updatedAt: firebase.database.ServerValue.TIMESTAMP
        };
        db.ref(`mp/raids/instances/${RAID_PARAMS.instanceId}/battleState`).set(snapshot);
      }
    }
  }
}

// ============================================================
// BUTTONS — Roll button management
// ============================================================
function resetRollButtons() {
  // Fire registered hooks — if any hook returns true, skip default behavior
  for (const fn of _resetRollHooks) {
    try { if (fn()) return; } catch(e) { console.error('[resetRollButtons hook error]', e); }
  }
  const r = document.getElementById('rollRedBtn');
  const b = document.getElementById('rollBlueBtn');
  if (r) { r.classList.remove('locked', 'pulse'); r.disabled = false; r.textContent = 'Red Roll'; }
  if (b) { b.classList.remove('locked', 'pulse'); b.disabled = false; b.textContent = 'Blue Roll'; }
  // v733: async MP — Red button says "READY" (commit signal), Blue is AI-controlled
  if (MP_MODE && !LIVE_PVP) {
    if (r) r.textContent = 'READY';
    if (b) b.style.display = 'none'; // hide Blue's button — AI rolls it
    pvpRedClickedRoll = false; // reset each round
  }
  // Live PvP: hide opponent's button, label ours properly
  if (LIVE_PVP) {
    const oppSide = PVP_SIDE === 'red' ? 'blue' : 'red';
    const oppBtn = document.getElementById(oppSide === 'red' ? 'rollRedBtn' : 'rollBlueBtn');
    if (oppBtn) oppBtn.style.display = 'none';
    const myBtn = document.getElementById(PVP_SIDE === 'red' ? 'rollRedBtn' : 'rollBlueBtn');
    if (myBtn) myBtn.textContent = 'ROLL';
  }
  // Clear dice display between rounds — no leftover numbers from last roll
  ['red', 'blue'].forEach(t => {
    const el = document.getElementById(t + '-dice');
    if (el) el.innerHTML = '';
  });
  // Start AFK pulse timer — if player doesn't roll within 5s, buttons start pulsing
  resetAfkTimer();
}

function disableRollButtons() {
  const r = document.getElementById('rollRedBtn');
  const b = document.getElementById('rollBlueBtn');
  if (r) r.disabled = true;
  if (b) b.disabled = true;
}

// ============================================================
// DUEL UI
// ============================================================
function renderDuelUI() {
  // Show/hide Done buttons and apply .duel-locked class to the inactive team column
  const inDuel = (B && (B.phase === 'duel-1' || B.phase === 'duel-2'));
  const rDone = document.getElementById('duelDoneRedBtn');
  const bDone = document.getElementById('duelDoneBlueBtn');
  const rCol = document.getElementById('red-team-column');
  const bCol = document.getElementById('blue-team-column');
  if (rDone) rDone.style.display = (inDuel && B.duelActiveTeam === 'red') ? 'block' : 'none';
  if (bDone) bDone.style.display = (inDuel && B.duelActiveTeam === 'blue') ? 'block' : 'none';
  if (rCol) rCol.classList.toggle('duel-locked', inDuel && B.duelActiveTeam !== 'red');
  if (bCol) bCol.classList.toggle('duel-locked', inDuel && B.duelActiveTeam !== 'blue');
}

// ============================================================
// OVERLAYS AND RESET
// ============================================================
function clearAllOverlays() {
  document.getElementById('gameOver').classList.remove('active');
  document.getElementById('swapOverlay').classList.remove('active');
  document.getElementById('msPicker').classList.remove('active');
  clearLsCountdown();
  document.getElementById('stealOverlay').classList.remove('active');
  document.getElementById('pressureOverlay').classList.remove('active');
  document.getElementById('seleneOverlay').classList.remove('active');
  document.getElementById('timberOverlay').classList.remove('active');
  document.getElementById('romyOverlay').classList.remove('active');
  document.getElementById('tobyOverlay').classList.remove('active');
  document.getElementById('gfWishBtn').style.display = 'none';
  if (gfWishTimer) { clearInterval(gfWishTimer); gfWishTimer = null; }
  document.getElementById('tylerOverlay').classList.remove('active');
  document.getElementById('eloiseOverlay').classList.remove('active');
  document.getElementById('booOverlay').classList.remove('active');
  document.getElementById('bogeyOverlay').classList.remove('active');
  document.getElementById('gusGaleBtn').style.display = 'none';
  if (gusGaleTimer) { clearInterval(gusGaleTimer); gusGaleTimer = null; }
  document.getElementById('mallowOverlay').classList.remove('active');
  document.getElementById('jacksonOverlay').classList.remove('active');
  document.getElementById('jeanieOverlay').classList.remove('active');
  document.getElementById('sonyaOverlay').classList.remove('active');
  document.getElementById('darkWingOverlay').classList.remove('active');
  document.getElementById('raditzHuntOverlay').classList.remove('active');
  document.getElementById('dougCautionOverlay').classList.remove('active');
  document.getElementById('tobogganOverlay').classList.remove('active');
  document.getElementById('fangOutsideOverlay').classList.remove('active');
  document.getElementById('fangUndercoverArmOverlay').classList.remove('active');
  document.getElementById('fangUndercoverSwapOverlay').classList.remove('active');
  document.getElementById('winstonSchemeOverlay').classList.remove('active');
  document.getElementById('catchyTuneOverlay').classList.remove('active');
  document.getElementById('tysonHopOverlay').classList.remove('active');
  document.getElementById('galeForcePickerOverlay').classList.remove('active');
  document.getElementById('wiseAlOverlay').classList.remove('active');
  document.getElementById('gordokOverlay').classList.remove('active');
  document.getElementById('standingsOverlay').classList.remove('active');
  document.getElementById('cultivateOverlay').classList.remove('active');
  document.getElementById('chowOverlay').classList.remove('active');
  document.getElementById('hexOverlay').classList.remove('active');
  document.getElementById('nickKnackOverlay').classList.remove('active');
  document.getElementById('jasperOverlay').classList.remove('active');
  document.getElementById('jenkinsOverlay').classList.remove('active');
  document.getElementById('balatronOverlay').classList.remove('active');
  document.getElementById('tommyOverlay').classList.remove('active');
  document.getElementById('sylviaOverlay').classList.remove('active');
  document.getElementById('burnOverlay').classList.remove('active');
  document.getElementById('fireflyOverlay').classList.remove('active');
  document.getElementById('abilitySplash').classList.remove('active');
  const vsSplash = document.getElementById('vsSplash');
  if (vsSplash) vsSplash.classList.remove('active');
  clearTimeout(afkTimer);
}

function resetBattle() {
  stopMusicHard();
  const skipBtn = document.getElementById('skipSpecialsBtn');
  if (skipBtn) skipBtn.style.display = 'none';
  B = null; S.battle = null;
  S.redPicks = []; S.bluePicks = [];
  abilityQueue = [];
  abilityQueueMode = false;
  clearAllOverlays();
  document.getElementById('battle-view').style.display = 'none';
  document.getElementById('team-select').style.display = 'block';
  document.querySelector('.app').classList.remove('battle-active');
  resetRollButtons();
  narrate('');
  renderDice(null, null);
  renderPicks();
}

function rematchBattle() {
  stopMusicHard();
  const redIds = S.redPicks.slice();
  const blueIds = S.bluePicks.slice();
  B = null; S.battle = null;
  abilityQueue = [];
  abilityQueueMode = false;
  clearAllOverlays();
  resetRollButtons();
  narrate('');
  renderDice(null, null);
  // Restore picks and start fresh battle
  S.redPicks = redIds;
  S.bluePicks = blueIds;
  startBattle();
}

// ============================================================
// AFK TIMER
// ============================================================
// AFK timer — pulse roll buttons after 5s of inactivity (Feature 10)
let afkTimer = null;
function resetAfkTimer() {
  clearTimeout(afkTimer);
  document.querySelectorAll('#rollRedBtn, #rollBlueBtn').forEach(b => b.classList.remove('pulse'));
  // At higher speeds, shave 1s off AFK pulse (5s→4s) — player still has plenty of time
  const afkDelay = getSpeedDivisor() > 1 ? 4000 : 5000;
  afkTimer = setTimeout(() => {
    if (B && B.phase === 'ready') {
      document.querySelectorAll('#rollRedBtn, #rollBlueBtn').forEach(b => {
        if (!b.disabled && !b.classList.contains('locked')) b.classList.add('pulse');
      });
    }
  }, afkDelay);
}

// ============================================================
// SIDELINE POP
// ============================================================
// Pop a sideline card to foreground when its ability triggers
function popSidelineCard(teamObj, ghostId) {
  const teamName = teamObj === B.red ? 'red' : 'blue';
  const sl = teamObj.ghosts.filter((g,i) => i !== teamObj.activeIdx);
  const slIdx = sl.findIndex(g => g.id === ghostId);
  if (slIdx < 0) return;
  const elId = slIdx === 0 ? `${teamName}-sl-left` : `${teamName}-sl-right`;
  const el = document.getElementById(elId);
  if (!el) return;
  el.classList.add('sideline-pop');
  setTimeout(() => el.classList.remove('sideline-pop'), spd(1300));
}

// ============================================================
// RAID BOSS BAR
// ============================================================
// Raid boss bar update — called after each damage event
function updateRaidBossBar() {
  if (!RAID_MODE || !RAID_PARAMS) return;
  const pct = Math.max(0, RAID_PARAMS.bossHp / RAID_PARAMS.bossMaxHp * 100);
  const fill = document.getElementById('raid-boss-bar-fill');
  const text = document.getElementById('raid-boss-bar-text');
  const phase = document.getElementById('raid-boss-bar-phase');
  if (fill) {
    fill.style.width = pct + '%';
    fill.style.background = pct > 75 ? '#2ecc71' : pct > 50 ? '#f39c12' : pct > 25 ? '#e74c3c' : '#8e44ad';
  }
  if (text) text.textContent = `${RAID_PARAMS.bossHp} / ${RAID_PARAMS.bossMaxHp}`;
  if (phase) {
    const phaseNum = pct > 75 ? 1 : pct > 50 ? 2 : pct > 25 ? 3 : 4;
    phase.textContent = 'PHASE ' + phaseNum;
    phase.style.color = pct > 75 ? '#2ecc71' : pct > 50 ? '#f39c12' : pct > 25 ? '#e74c3c' : '#8e44ad';
  }
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', e => {
  // Enter or Space on game-over screen → rematch (or redirect in MP mode)
  if ((e.key === 'Enter' || e.key === ' ') && document.getElementById('gameOver').classList.contains('active')) {
    e.preventDefault();
    if (MP_MODE) {
      // Determine result and redirect
      const winner = B && B.phase === 'over' ? (document.getElementById('goTitle').className.includes('red') ? 'red' : document.getElementById('goTitle').className.includes('blue') ? 'blue' : 'draw') : 'draw';
      const result = winner === 'red' ? 'win' : (winner === 'blue' ? 'loss' : 'draw');
      const returnUrl = MP_DAILY
        ? '../multiplayer/?dailyResult=' + result
        : '../multiplayer/?result=' + result;
      window.location.href = returnUrl;
    } else {
      rematchBattle();
    }
    return;
  }
  // Escape closes any open overlay/modal.
  // pressureOverlay is intentionally excluded — the Pressure pick is a FORCED choice
  // for the opponent; allowing Escape to dismiss it would bypass pressureUsed and let
  // Dark Fang spam Pressure every round. The modal only closes via doPressureSwap().
  if (e.key === 'Escape') {
    // In MP mode, don't allow Escape to close gameOver (must use Return to Arena button)
    const overlays = ['swapOverlay','msPicker','stealOverlay','standingsOverlay'];
    if (!MP_MODE) overlays.push('gameOver');
    overlays.forEach(id => document.getElementById(id)?.classList.remove('active'));
  }
});

// ── BattleUI export ───────────────────────────────────────────────
window.BattleUI = {
  narrate, drainNarrate,
  playSfx, playDamageSfx, startMusic, fadeOutMusic, toggleMute, stopMusicHard,
  showTriplesEffect, queueAbility, drainAbilityQueue, showAbilityCallout,
  renderCardSlot, updateHpBar, hitDamage, renderBattle,
  resetRollButtons, disableRollButtons, renderDuelUI,
  clearAllOverlays, resetBattle, rematchBattle,
  popSidelineCard, resetAfkTimer, updateRaidBossBar
};
