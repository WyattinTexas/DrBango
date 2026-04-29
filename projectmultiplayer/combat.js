// combat.js — Layer 4: Resolution pipeline, KO handling, game over, AI, PvP networking.
// Depends on: battle-core.js (B, S, active, opp, log, classify, spd, makeTeam, etc.)
//             dice.js, battle-ui.js, abilities.js
// NOTE: B, active, opp, teamName, log, prevResources, LOG_MAX are in battle-core.js

function startBattle() {
  prevResources = { red: {}, blue: {} };
  narrateQueue = []; narrateActive = false;
  B = {
    red: makeTeam(S.redPicks), blue: makeTeam(S.bluePicks),
    round:1, log:[], phase:'ready',
    pendingMoonstone:null, pendingSteal:null,
    // === HAND LIMIT ===
    handLimitMode: !!(document.getElementById('handLimitCheckbox')?.checked),
    HAND_LIMIT: parseInt(document.getElementById('handLimitSlider')?.value) || 3,
    handLimitPending: null,
    // === DUEL PHASE ===
    // Lower-HP loser goes first in the pre-roll commit phase. Toggle off to revert to simultaneous.
    duelPhaseMode: true,
    duelPriority: null,     // 'red' | 'blue' | null — who goes first THIS round's Duel Phase (null = simultaneous)
    duelActiveTeam: null,   // who is currently acting during Duel Phase (gates clicks)
    duelLastLoser: null,    // team that lost the previous roll (null on tie or round 1)
    committed: { red: { ice:0, fire:0, surge:0, auntSusan:0, auntSusanHeal:0, harrison:0, zainBlade:0 }, blue: { ice:0, fire:0, surge:0, auntSusan:0, auntSusanHeal:0, harrison:0, zainBlade:0 } },
    retributionDice: { red: 0, blue: 0 },
    cameronBonusDice: { red: 0, blue: 0 },
    pressureUsed: { red: false, blue: false },
    romyPrediction: { red: null, blue: null },
    pureHeartDeclared: { red: null, blue: null },
    pureHeartScheduledKO: { red: false, blue: false },
    splinterActivated: { red: false, blue: false },
    guardianFairyStandby: { red: false, blue: false },
    letsDanceBonus: { red: 0, blue: 0 },
    tommyRegulatorBonus: { red: 0, blue: 0 },
    eloiseUsedThisRound: { red: false, blue: false },
    outlawStolenDie: { red: 0, blue: 0 },
    bogeyUsed: { red: false, blue: false },
    marcusGlacialBonus: { red: 0, blue: 0 },
    hugoWreckage: { red: 0, blue: 0 },
    logeyLockout: { red: 0, blue: 0 },
    dreamCatBonus: { red: 0, blue: 0 },
    // galeForcePending/galeForceDecided removed — Gus is now reactive post-win
    alucardUsed: { red: false, blue: false },
    jacksonUsedThisRound: { red: false, blue: false },
    sonyaUsedThisRound: { red: false, blue: false },
    darkWingUsedThisGame: { red: false, blue: false },
    haywireBonus: { red: 0, blue: 0 },
    haywireDamageBonus: { red: 0, blue: 0 },
    chowDecided: { red: false, blue: false },
    zorkDecided: { red: false, blue: false },
    zorkExtraDie: { red: 0, blue: 0 },
    bonzaiDecided: { red: false, blue: false },
    battleStarted: false,
    cultivateDecided: { red: false, blue: false },
    willowLostLast: { red: false, blue: false },
    haywireUsed: { red: false, blue: false },
    mallowDecided: { red: false, blue: false },
    jeanieUsed: { red: false, blue: false },
    raditzHuntReady: { red: false, blue: false },
    dougCautionUsed: { red: false, blue: false },
    dougCautionDieBonus: { red: false, blue: false },
    jeffSnicker: { red: 0, blue: 0 },
    pendingLucyDmg: { red: 0, blue: 0 },
    fangUndercoverArmed: { red: false, blue: false },
    fangUndercoverSwapPending: null,
    winstonSchemePending: null,
    winstonDiceBonus: { red: 0, blue: 0 },
    catchyTuneUnlocked: { red: false, blue: false },
    catchyTuneLockedDie: { red: null, blue: null },
    catchyTunePending: null,
    lastRollDiceCount: { red: 3, blue: 3 },
    tysonDisabled: { red: [], blue: [] },
    tysonPickerPending: null,
    galeForcePicker: null,
    scallywagsFrenzyBonus: { red: 0, blue: 0 },
    floopMuck: { red: 0, blue: 0 },
    tylerDecidedThisRound: { red: false, blue: false },
    booTeamworkDecidedThisRound: { red: false, blue: false },
    tylerHeatUpDieBonus: { red: 0, blue: 0 },
    booTeamworkDieDebt: { red: 0, blue: 0 },
    pipToastedUsed: { red: false, blue: false },
    pipDieRemoval: { red: 0, blue: 0 },
    luckyStoneSpentThisTurn: { red: 0, blue: 0 },
    preRollAbilitiesFiredThisTurn: { red: false, blue: false }, moonstoneSicknessFiredThisTurn: false,
    burn: { red: {}, blue: {} },
    burnSource: { red: {}, blue: {} },
    lucasKindlingBonus: { red: 0, blue: 0 },
    iceBladeForgedPermanent: { red: false, blue: false },
    flameBlade: { red: false, blue: false },
    flameBladeSwing: { red: false, blue: false },
    iceBladeSwing: { red: false, blue: false },
    gordokDieBonus: { red: 0, blue: 0 },
    hexDieRemoval: { red: 0, blue: 0 },
    carpenterHammer: { red: false, blue: false },
    welderTorch: { red: false, blue: false },
    foremanDieBonus: { red: 0, blue: 0 },
    carpenterDiceTrade: { red: 0, blue: 0 },
    sophiaMask: { red: null, blue: null },
    sophiaMaskActive: { red: false, blue: false },
  };
  S.battle = B;
  if (typeof initMatchStats === 'function') initMatchStats();
  const _teamSel = document.getElementById('team-select');
  if (_teamSel) _teamSel.style.display = 'none';
  const _battleView = document.getElementById('battle-view');
  if (_battleView) _battleView.style.display = 'block';
  const _appEl = document.querySelector('.app');
  if (_appEl) _appEl.classList.add('battle-active');
  if (typeof startMusic === 'function') startMusic();
  log('<span class="log-round">Battle begins!</span>');
  renderBattle();

  // Disable roll buttons until everything is done
  const rBtn = document.getElementById('rollRedBtn');
  const bBtn = document.getElementById('rollBlueBtn');
  if (rBtn) { rBtn.disabled = true; }
  if (bBtn) { bBtn.disabled = true; }

  // Show VS splash FIRST, then entry abilities cinematic sequence
  // Skip splash in raid mode — adapter hides it, no point waiting 2.2s for an invisible animation
  const splash = document.getElementById('vsSplash');
  if (splash && splash.style.display !== 'none') {
    document.getElementById('vsRedName').textContent = active(B.red).name;
    document.getElementById('vsBlueName').textContent = active(B.blue).name;
    if (RAID_MODE && RAID_PARAMS) {
      document.getElementById('vsBlueName').textContent = '\u2694 ' + RAID_PARAMS.bossName + ' \u2694';
    }
    const redBench = B.red.ghosts.filter((g,i) => i !== B.red.activeIdx).map(g => g.name);
    const blueBench = B.blue.ghosts.filter((g,i) => i !== B.blue.activeIdx).map(g => g.name);
    document.getElementById('vsRedRoster').textContent = redBench.join(' / ');
    document.getElementById('vsBlueRoster').textContent = blueBench.join(' / ');
    splash.classList.add('active');
    setTimeout(() => {
      splash.classList.remove('active');
      // VS splash done — now fire entry abilities cinematically.
      // Duel Phase v1: ENTRY EFFECT ORDER matches the Duel Phase priority.
      // Lower-HP ghost's entry fires first (the underdog strikes). If HP tied,
      // compute priority via the helper (which uses rarity and finally coin flip).
      // If fully symmetric (mirror match), fall back to Red-first as before.
      const _priority = computeDuelPriority();
      const firstTeam  = (_priority === 'blue') ? B.blue : B.red;
      const secondTeam = (_priority === 'blue') ? B.red  : B.blue;
      const firstEntryCount = triggerEntry(firstTeam);
      renderBattle();
      afterEntryWithJenkins(firstEntryCount, () => {
        const secondEntryCount = triggerEntry(secondTeam);
        renderBattle();
        afterEntryWithJenkins(secondEntryCount, () => {
          // All entry effects done — check for KOs, then enable rolling
          B.battleStarted = true; // Nicholas Sneak Attack can now fire on swaps
          if (handleKOs()) return;
          // Duel Phase v1: check for priority before unlocking rolls
          startNextRound();
          narrate(`<b class="gold">Round 1</b> — <b class="red-text">${active(B.red).name}</b>&nbsp;vs&nbsp;<b class="blue-text">${active(B.blue).name}</b> — <b class="gold">Fight!</b>`);
        });
      });
    }, spd(2200));
  } else {
    // No splash — fire entries in Duel Phase priority order, then enable
    const _priority2 = computeDuelPriority();
    const firstTeam2  = (_priority2 === 'blue') ? B.blue : B.red;
    const secondTeam2 = (_priority2 === 'blue') ? B.red  : B.blue;
    const ec1 = triggerEntry(firstTeam2);
    afterEntryWithJenkins(ec1, () => {
      const ec2 = triggerEntry(secondTeam2);
      afterEntryWithJenkins(ec2, () => {
        renderBattle();
        B.battleStarted = true; // Nicholas Sneak Attack can now fire on swaps
        if (handleKOs()) return;
        narrate(`<b class="gold">Round 1</b> — <b class="red-text">${active(B.red).name}</b>&nbsp;vs&nbsp;<b class="blue-text">${active(B.blue).name}</b> — <b class="gold">Fight!</b>`);
        if (rBtn) { rBtn.disabled = false; rBtn.classList.add('pulse'); }
        if (bBtn) { bBtn.disabled = false; bBtn.classList.add('pulse'); }
      });
    });
  }
}

function doResolve(redDice, blueDice, redRoll, blueRoll) {
  B.pendingResolve = { redDice, blueDice, redRoll, blueRoll };
  resolveRound();
}

// v386: Safe wrapper — catches any thrown error in the damage/cinematic pipeline
// and recovers the game to a rollable state. Without this, a ReferenceError or
// TypeError anywhere inside the 2000-line resolveRound body silently kills the
// round and freezes the UI (no damage applied, no callouts, no roll buttons).
// The wrapper surfaces the error to the log/narrator so it can be diagnosed AND
// forces B.phase='ready' + resetRollButtons() so the game keeps running.
function resolveRound() {
  try {
    _resolveRoundImpl();
  } catch (err) {
    console.error('[resolveRound CRASH]', err);
    try { log(`<span class="log-dmg">INTERNAL ERROR</span> in resolveRound: ${err && err.message ? err.message : String(err)} — game recovered, please roll again.`); } catch (_) {}
    try { narrate(`<b class="gold">⚠ Round resolution crashed</b> — <span style="color:var(--text2)">${err && err.message ? err.message : 'unknown error'}</span>`); } catch (_) {}
    // Force the game out of 'resolving' so roll buttons come back alive
    try {
      if (typeof B !== 'undefined' && B) {
        B.phase = 'ready';
        B.preRoll = null;
        B.pendingResolve = null;
        B.sylviaPendingResult = null;
        B.sylviaResuming = false;
        B.bogeyReflectResuming = false;
        B.bogeyReflectChoice = null;
        B.bogeyReflectPending = null;
      }
      abilityQueue = [];
      abilityQueueMode = false;
      if (typeof narrateQueue !== 'undefined') narrateQueue = [];
      if (typeof resetRollButtons === 'function') resetRollButtons();
      if (typeof renderBattle === 'function') renderBattle();
    } catch (_) {}
  }
}
function _resolveRoundImpl() {
  B.phase = 'resolving';
  // v331: resolveRound can be re-entered after the Sylvia player-rolled modal resolves.
  // When resuming, we skip the Blackout pass (already applied) and the header log line
  // (already printed) so nothing double-fires. All downstream logic (winner determination,
  // damage calc, cinematics) is pure w.r.t. dice state and safe to re-run.
  const sylviaResuming = !!B.sylviaResuming;
  B.sylviaResuming = false;
  // Clear any stale roll narrations ("X rolls...", "X rolled [...]") that built up in the
  // narrator queue while both teams were rolling. Without this, up to 4 queued items (each
  // holding 1800ms) delay the damage narration by 5–7 seconds after the HP bar has already
  // visually dropped — the narrator then explains an event the player already watched long ago.
  // We clear only the PENDING queue (not the currently-displaying item), so whatever is
  // mid-display finishes its 1800ms hold, then the damage narration fires immediately after.
  narrateQueue = [];
  const redDice = B.pendingResolve.redDice;
  const blueDice = B.pendingResolve.blueDice;

  // Blackout (403) — remove named number from opponent's dice
  // Only fires if Smudge is active and alive on the team that set the number
  // Callouts are collected here and prepended to the post-roll ability queue below,
  // so BLACKOUT! plays sequentially instead of being stomped by the first queued ability.
  // Use B.blackoutCallouts so the queue survives a Sylvia-resuming re-entry.
  if (!sylviaResuming) B.blackoutCallouts = [];
  const blackoutCallouts = B.blackoutCallouts || [];
  if (!sylviaResuming) {
    ['red', 'blue'].forEach(team => {
      const oppTeam = team === 'red' ? 'blue' : 'red';
      const t = B[team];
      const smudgeActive = active(t).id === 403 && !active(t).ko;
      if (B.blackoutNum && B.blackoutNum[team] && smudgeActive) {
        const num = B.blackoutNum[team];
        const originalDice = team === 'red' ? blueDice : redDice;
        const filtered = [];
        let removed = 0;
        originalDice.forEach(d => {
          if (d === num) { removed++; }
          else { filtered.push(d); }
        });
        if (removed > 0) {
          if (team === 'red') { blueDice.splice(0, blueDice.length, ...filtered); }
          else { redDice.splice(0, redDice.length, ...filtered); }
          blackoutCallouts.push({ name: 'BLACKOUT!', color: 'var(--rare)', desc: `Smudge — ${removed} dice showing ${num} vanished!`, team: team });
          log(`<span class="log-ability">Smudge</span> — Blackout! Named ${num} — <span class="log-dmg">${removed} opponent dice removed!</span>`);
        }
        // No callout if opponent didn't roll the number — silent miss, don't interrupt the flow
      }
    });
    // Reset blackout picks
    B.blackoutNum = {};
  }

  B.redDice = redDice; B.blueDice = blueDice;

  // Kaylee (453) — Slipstream: if any die shows a 2, player chooses which dice to swap
  // Interactive modal pauses resolution — player picks one of their dice and one of opponent's
  // Fires BEFORE winner determination so the swap changes the outcome
  let slipstreamTeam = null;
  if (!sylviaResuming) {
    for (const _slipTeam of ['red', 'blue']) {
      const _slipF = active(B[_slipTeam]);
      if (_slipF && _slipF.id === 453 && !_slipF.ko) {
        const myDice = _slipTeam === 'red' ? redDice : blueDice;
        if (myDice.includes(2)) { slipstreamTeam = _slipTeam; break; }
      }
    }
  }
  if (slipstreamTeam) {
    const myDice = slipstreamTeam === 'red' ? redDice : blueDice;
    const oppDice = slipstreamTeam === 'red' ? blueDice : redDice;
    // Sync dice display so player can see what they rolled
    renderDice(B.redDice, B.blueDice);
    // Show interactive picker — resolution resumes in callback
    B.slipstreamResuming = true;
    showSlipstreamPicker(slipstreamTeam, myDice, oppDice, () => {
      // Resume resolution from the top — slipstreamResuming flag skips re-entry into slipstream
      B.sylviaResuming = true; // reuse this flag to skip header log + blackout re-fire
      _resolveRoundImpl();
    });
    return; // Pause resolution until player picks
  }
  B.slipstreamResuming = false;

  // Sync visual dice display after Blackout/Slipstream may have modified dice arrays.
  renderDice(B.redDice, B.blueDice);

  const rR = classify(redDice), bR = classify(blueDice);
  if (!sylviaResuming) {
    log(`Red [${redDice.join(',')}] <span style="color:var(--text2)">(${rR.type} ${rR.value})</span> vs Blue [${blueDice.join(',')}] <span style="color:var(--text2)">(${bR.type} ${bR.value})</span>`);
  }

  // Captain James (443) — Final Strike: triples or higher → gain 2 Sacred Fires
  // (Fires win or lose, just needs triples+. Placed in post-roll section near Gom Gom Gom/Sable.)

  // Welder (450) — Arc: if any die shows a 4, Welder transforms into Foreman
  ['red', 'blue'].forEach(_wTeam => {
    const _wF = active(B[_wTeam]);
    const _wDice = _wTeam === 'red' ? redDice : blueDice;
    if (_wF.id === 450 && !_wF.ko && _wDice.some(d => d === 4)) {
      welderTransform(_wTeam);
    }
  });

  // Determine winner with cascading tiebreakers
  // Rule: compare best hand type first. If same type AND same value,
  // compare remaining dice highest-to-lowest. Missing dice = 0.
  const typeRank = {penta:5,quads:4,triples:3,doubles:2,singles:1,none:0};
  function getRank(type) {
    if (typeRank[type] !== undefined) return typeRank[type];
    if (type.endsWith('-of-a-kind')) return parseInt(type); // 6-of-a-kind → 6, 7 → 7, etc.
    return 0;
  }
  let winner = null;
  let tiebreaker = null; // {value: N} — the remaining die that broke the tie

  // Hector (96) — Protector: when Hector is active on either team, singles beat doubles.
  // Singles promote to effective rank 2.5 — still lose to triples, quads, penta, etc.
  const _rAct = active(B.red), _bAct = active(B.blue);
  const hectorActive = (_rAct.id === 96 && !_rAct.ko) || (_bAct.id === 96 && !_bAct.ko);
  const rEffRank = (hectorActive && rR.type === 'singles' && bR.type === 'doubles') ? 2.5 : getRank(rR.type);
  const bEffRank = (hectorActive && bR.type === 'singles' && rR.type === 'doubles') ? 2.5 : getRank(bR.type);

  if (rEffRank > bEffRank) winner = 'red';
  else if (bEffRank > rEffRank) winner = 'blue';
  else if (rR.value > bR.value) winner = 'red';
  else if (bR.value > rR.value) winner = 'blue';
  else {
    // Same hand type AND same value — cascading tiebreaker on remaining dice
    // Remove the matched dice, then compare highest-to-lowest
    const rRemain = [...redDice];
    const bRemain = [...blueDice];
    // Remove the matching group (e.g., for doubles of 6, remove two 6s from each)
    const matchCount = {doubles:2, triples:3, quads:4, penta:5, singles:1, none:0}[rR.type] || 0;
    for (let i = 0; i < matchCount; i++) {
      const ri = rRemain.indexOf(rR.value);
      if (ri >= 0) rRemain.splice(ri, 1);
      const bi = bRemain.indexOf(bR.value);
      if (bi >= 0) bRemain.splice(bi, 1);
    }
    // Sort remaining descending and compare
    rRemain.sort((a,b) => b-a);
    bRemain.sort((a,b) => b-a);
    const maxLen = Math.max(rRemain.length, bRemain.length);
    for (let i = 0; i < maxLen; i++) {
      const rv = i < rRemain.length ? rRemain[i] : 0;
      const bv = i < bRemain.length ? bRemain[i] : 0;
      if (rv > bv) { winner = 'red'; tiebreaker = {value: rv}; break; }
      if (bv > rv) { winner = 'blue'; tiebreaker = {value: bv}; break; }
    }
  }

  // Charlie (18) — Flick: upon losing a roll or rolling Doubles, Flick a die
  // Fires BEFORE highlights/Sylvia so new dice change the outcome.
  // Charlie (18) — Rush / Flick: upon LOSING a roll, Flick a die
  // Uses B.flickResuming to skip on re-entry after dice are modified.
  if (!B.flickResuming) {
    let flickTeam = null;
    for (const ft of ['red', 'blue']) {
      const f = active(B[ft]);
      if (f.id === 18 && !f.ko) {
        const lost = winner !== null && winner !== ft;
        if (lost) { flickTeam = ft; break; }
      }
    }
    if (flickTeam) {
      showFlickPicker(flickTeam, () => {
        B.flickResuming = true;
        B.sylviaResuming = true;
        _resolveRoundImpl();
      });
      return;
    }
  }
  B.flickResuming = false;

  // Highlight dice immediately — winner dice glow, losers fade
  if (winner) {
    const loser = winner === 'red' ? 'blue' : 'red';
    const wRoll = winner === 'red' ? rR : bR;
    setTimeout(() => highlightWinnerDice(winner, wRoll, loser, tiebreaker), 80);
  }

  // ========================================
  // SYLVIA (313) — PORPOISE PLAYER-ROLLED DODGE
  // v331: if the losing fighter is Sylvia and no result is pending yet,
  // show the Sylvia modal so the player rolls 1 die themselves. The modal
  // stores B.sylviaPendingResult then re-enters resolveRound with
  // B.sylviaResuming=true to pick up where we left off.
  // Ties (winner === null) don't trigger — Sylvia only cares about losses.
  // ========================================
  if (winner !== null && !sylviaResuming && !B.sylviaPendingResult) {
    const loserTeamName = winner === 'red' ? 'blue' : 'red';
    const loserF = active(B[loserTeamName]);
    // Cameron (25) — Unstoppable Force: skip Sylvia's dodge modal when Cameron is the winner
    const winnerF = active(B[winner]);
    if (loserF && loserF.id === 313 && !loserF.ko && !(winnerF && winnerF.id === 25 && !winnerF.ko)) {
      showSylviaModal(loserTeamName, () => {
        B.sylviaResuming = true;
        resolveRound();
      });
      return;
    }
  }

  if (winner === null) {
    // ========================================
    // TIE — reset dice highlight so previous round's glow doesn't linger
    // ========================================
    let dupyFrolicKO = false;
    ['red','blue'].forEach(team => {
      const el = document.getElementById(team + '-dice');
      if (el) el.querySelectorAll('.die').forEach(d => {
        d.classList.remove('die-win','die-win-doubles','die-win-triples','die-win-mega','die-win-secondary','die-loser');
      });
      // Also clear 3D dice highlights
      const ph = _dicePhysics[team];
      if (ph && ph.settled) {
        ph.dice.forEach(d => d.el.classList.remove('die-win-singles-3d','die-win-doubles-3d','die-win-triples-3d','die-win-mega-3d','die-win-secondary-3d','die-loser-3d','triples-glow-3d','highlight-single','highlight-double','highlight-triple'));
      }
    });

    // Mark both active ghosts as having rolled (so Ambush/Lurk don't fire next round).
    active(B.red)._rolledOnce = true;
    active(B.blue)._rolledOnce = true;
    log(`<span class="log-ability">TIE!</span> No damage dealt.`);
    narrate(`Both roll ${describeRoll(rR)} — <b class="gold">a standoff!</b> No damage dealt.`);
    playSfx('sfxSpecial', 0.3);

    // Queue tie-round ability callouts so they play sequentially
    abilityQueue = [];
    abilityQueueMode = true;

    // Tweak and Twonk (303) — sideline: tie → gain 4 Surge (Roaring Crowd)
    // Sandwiches (33) — Dependable: mirrors the Surge grant to opponent.
    [B.red, B.blue].forEach(team => {
      const tNameTie = team === B.red ? 'red' : 'blue';
      if (hasSideline(team, 303)) {
        const tweakGhost = getSidelineGhost(team, 303);
        const oppTeamTweak = opp(team);
        const sandwichMirrorsTweak = hasOnTeam(oppTeamTweak, 33);
        const surgeTotal = team.resources.surge + 4;
        queueAbility('ROARING CROWD!', 'var(--common)', `Tweak and Twonk — Tie! +4 Surge! (${surgeTotal} total)`, () => {
          team.resources.surge += 4;
          popSidelineCard(team, 303);
          log(`<span class="log-ability">Tweak and Twonk</span> (sideline) — Roaring Crowd! Tie → gained <span class="log-ms">4 Surge</span>!`);
          renderBattle();
        }, tNameTie);
        // Knight reactions must be queued WHILE abilityQueueMode===true (not inside onShow
        // where abilityQueueMode is false and checkKnightEffects fires showAbilityCallout
        // directly, stomping the ROARING CROWD! callout still on screen).
        checkKnightEffects(tNameTie, 'Tweak and Twonk', tweakGhost);
        if (sandwichMirrorsTweak) {
          queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Roaring Crowd! +4 Surge! (${oppTeamTweak.resources.surge + 4} total)`, () => { oppTeamTweak.resources.surge += 4; renderBattle(); }, tNameTie === 'red' ? 'blue' : 'red');
        }
      }
    });

    // Jimmy (352) — Sideline & In Play: tie → gain 3 Lucky Stones + 1 Magic Firefly
    [B.red, B.blue].forEach(team => {
      const f = active(team);
      const tNameJim = team === B.red ? 'red' : 'blue';
      const hasJimmyActive = f.id === 352 && !f.ko;
      const hasJimmySideline = hasSideline(team, 352);
      if (hasJimmyActive || hasJimmySideline) {
        const oppTeamJim = team === B.red ? B.blue : B.red;
        const sandwichMirrorsJim = hasOnTeam(oppTeamJim, 33);
        const lsTotal = team.resources.luckyStone + 3;
        const ffTotal = (team.resources.firefly || 0) + 1;
        const jimmyGhost = hasJimmyActive ? f : team.ghosts.find(g => g.id === 352);
        queueAbility('CHIRP!', 'var(--common)', `${jimmyGhost.name} — Tie! +3 Lucky Stones + 1 Magic Firefly! (${lsTotal} LS, ${ffTotal} FF)`, () => {
          team.resources.luckyStone += 3;
          team.resources.firefly = (team.resources.firefly || 0) + 1;
          log(`<span class="log-ability">${jimmyGhost.name}</span> — Chirp! Tie → gained <span class="log-ms">3 Lucky Stones</span> + <span class="log-ms">1 Magic Firefly</span>!`);
          renderBattle();
        }, tNameJim);
        checkKnightEffects(tNameJim, jimmyGhost.name);
        if (sandwichMirrorsJim) {
          queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Chirp! +3 Lucky Stones + 1 Magic Firefly!`, () => { oppTeamJim.resources.luckyStone += 3; oppTeamJim.resources.firefly = (oppTeamJim.resources.firefly || 0) + 1; renderBattle(); }, tNameJim === 'red' ? 'blue' : 'red');
        }
      }
    });

    // Goobs (444) — Dance Break: Sideline & In Play: on a tie, both players gain 1 of every resource
    // Check BOTH teams; fire once even if both teams have Goobs
    {
      let goobFired = false;
      [B.red, B.blue].forEach(team => {
        if (goobFired) return;
        const f = active(team);
        const tNameGoob = team === B.red ? 'red' : 'blue';
        const hasGoobActive = f.id === 444 && !f.ko;
        const hasGoobSideline = hasSideline(team, 444);
        if (hasGoobActive || hasGoobSideline) {
          goobFired = true;
          const goobGhost = hasGoobActive ? f : team.ghosts.find(g => g.id === 444);
          const goobName = goobGhost ? goobGhost.name : 'Goobs';
          const goobTeam = B[tNameGoob];
          const goobActiveGhost = active(goobTeam);
          queueAbility('DANCE PARTY!', 'var(--uncommon)', `${goobName} — Tie! Both players gain 1 Magic Firefly! ${goobActiveGhost.name} +5 HP!`, () => {
            [B.red, B.blue].forEach(t => {
              if (!t.resources.firefly) t.resources.firefly = 0;
              t.resources.firefly += 1;
            });
            goobActiveGhost.hp += 5;
            log(`<span class="log-ability">${goobName}</span> — Dance Party! Both teams gain <span class="log-ms">+1 Magic Firefly!</span> <span class="log-heal">${goobActiveGhost.name} +5 HP!</span>`);
            renderBattle();
          }, tNameGoob);
          checkKnightEffects(tNameGoob, goobName);
        }
      });
    }

    // Kairan (68) — Let's Dance: doubles (win, lose, or tie) → +1 die next roll
    [B.red, B.blue].forEach(team => {
      const f = active(team);
      const tNameKai = team === B.red ? 'red' : 'blue';
      const kaiRoll = team === B.red ? rR : bR;
      if (f.id === 68 && !f.ko && kaiRoll.type === 'doubles') {
        B.letsDanceBonus[tNameKai] = (B.letsDanceBonus[tNameKai] || 0) + 1;
        queueAbility("LET'S DANCE!", 'var(--rare)', `${f.name} — Doubles on a tie! +1 die next roll!`, null, tNameKai);
        checkKnightEffects(tNameKai, f.name);
        log(`<span class="log-ability">${f.name}</span> — Let's Dance! Doubles tie → +1 die next round.`);
      }
    });

    // Outlaw (43) — Thief: doubles (tie) → steal 1 enemy die next roll
    [B.red, B.blue].forEach(team => {
      const f = active(team);
      const tNameOut = team === B.red ? 'red' : 'blue';
      const outRoll = team === B.red ? rR : bR;
      if (f.id === 43 && !f.ko && outRoll.type === 'doubles') {
        B.outlawStolenDie[tNameOut] = (B.outlawStolenDie[tNameOut] || 0) + 1;
        queueAbility('THIEF!', 'var(--uncommon)', `${f.name} — Doubles tie! Stealing 1 die from enemy next round!`, null, tNameOut);
        log(`<span class="log-ability">${f.name}</span> — Thief! Doubles tie → steal 1 enemy die next round.`);
        checkKnightEffects(tNameOut, f.name);
      }
    });

    // Haywire (78) — Wild Chords: tie — triples or better grants +1 permanent die AND Haywire +2 damage for the rest of the game (once per game)
    [B.red, B.blue].forEach(team => {
      const f = active(team);
      const tNameHW = team === B.red ? 'red' : 'blue';
      const hwRoll = team === B.red ? rR : bR;
      if (f.id === 78 && !f.ko && isTripleOrBetter(hwRoll.type) && B.haywireUsed && !B.haywireUsed[tNameHW]) {
        B.haywireBonus[tNameHW] = (B.haywireBonus[tNameHW] || 0) + 1;
        B.haywireDamageBonus[tNameHW] = 2;
        B.haywireUsed[tNameHW] = true;
        queueAbility('WILD CHORDS!', 'var(--rare)', `${f.name} — Triples or better on a tie! +1 permanent die AND Haywire gains +2 damage for the rest of the game! (Once per game)`, null, tNameHW);
        log(`<span class="log-ability">${f.name}</span> — Wild Chords! Triples or better tie → +1 permanent die + Haywire +2 damage for the rest of the game!`);
        checkKnightEffects(tNameHW, f.name);
      }
    });

    // Scallywags (19) — Frenzy: tie — if Scallywags' own dice are all under 4, gain +1 die next turn
    [B.red, B.blue].forEach(team => {
      const f = active(team);
      const tNameSC = team === B.red ? 'red' : 'blue';
      const scDice = team === B.red ? redDice : blueDice;
      if (f.id === 19 && !f.ko && scDice && scDice.length > 0 && scDice.every(d => d < 4)) {
        B.scallywagsFrenzyBonus[tNameSC] = (B.scallywagsFrenzyBonus[tNameSC] || 0) + 1;
        team.resources.surge = (team.resources.surge || 0) + 1;
        queueAbility('FRENZY!', 'var(--common)', `${f.name} — All dice under 4 on a tie! +1 die next roll + 1 Surge!`, null, tNameSC);
        log(`<span class="log-ability">${f.name}</span> — Frenzy! Tie: all dice under 4 → +1 die next round + <span class="log-ms">+1 Surge</span>.`);
        checkKnightEffects(tNameSC, f.name);
      }
    });

    // Floop (20) — Muck: tie — if opponent rolled doubles, they lose 1 die next round
    [B.red, B.blue].forEach(team => {
      const f = active(team);
      if (f.id === 20 && !f.ko) {
        const enemyTeam = opp(team);
        const enemyTName = enemyTeam === B.red ? 'red' : 'blue';
        const enemyRoll = enemyTeam === B.red ? rR : bR;
        if (enemyRoll.type === 'doubles') {
          B.floopMuck[enemyTName] = (B.floopMuck[enemyTName] || 0) + 1;
          queueAbility('MUCK!', 'var(--common)', `${f.name} — ${active(enemyTeam).name} rolled doubles on a tie! They lose 1 die next round!`, null, team === B.red ? 'red' : 'blue');
          log(`<span class="log-ability">${f.name}</span> — Muck! ${active(enemyTeam).name} rolled doubles → -1 die next round.`);
          checkKnightEffects(team === B.red ? 'red' : 'blue', f.name);
        }
      }
    });

    // Logey (26) — Heinous: tie — count opponent's 5+ dice, lock them out next roll
    [B.red, B.blue].forEach(team => {
      const f = active(team);
      if (f.id === 26 && !f.ko) {
        const enemyTeam = opp(team);
        const enemyTName = enemyTeam === B.red ? 'red' : 'blue';
        const enemyDice = enemyTeam === B.red ? redDice : blueDice;
        const locked = (enemyDice || []).filter(d => d >= 5).length;
        if (locked > 0) {
          B.logeyLockout[enemyTName] = (B.logeyLockout[enemyTName] || 0) + locked;
          queueAbility('HEINOUS!', 'var(--common)', `${f.name} — Tie! ${locked} of ${active(enemyTeam).name}'s dice (5+) locked out next roll!`, null, team === B.red ? 'red' : 'blue');
          log(`<span class="log-ability">${f.name}</span> — Heinous! Tie: locked ${locked} of enemy's 5+ dice.`);
          checkKnightEffects(team === B.red ? 'red' : 'blue', f.name);
        }
      }
    });

    // Sable (413) — Smoldering Soul: all odd dice → +1 Sacred Fire (active or sideline, tie path)
    [B.red, B.blue].forEach(team => {
      const f = active(team);
      const tNameSable = team === B.red ? 'red' : 'blue';
      const sableDice = team === B.red ? redDice : blueDice;
      const hasSableActive = f.id === 413 && !f.ko;
      const hasSableSideline = hasSideline(team, 413);
      if ((hasSableActive || hasSableSideline) && sableDice && sableDice.length > 0 && sableDice.every(d => d % 2 === 1)) {
        team.resources.fire++;
        const sableName = hasSableActive ? f.name : (getSidelineGhost(team, 413) || { name: 'Sable' }).name;
        const sableLoc = hasSableActive ? '' : ' (sideline)';
        queueAbility('SMOLDERING SOUL!', 'var(--uncommon)', `${sableName}${sableLoc} — All dice odd! +1 Sacred Fire!`, null, tNameSable);
        log(`<span class="log-ability">${sableName}</span> — Smoldering Soul! All dice odd → <span class="log-ms">+1 Sacred Fire!</span>`);
        checkKnightEffects(tNameSable, sableName);
      }
    });

    // Pip (418) — Toasted: triples+ → remove 1 enemy die permanently + 2 Sacred Fires (once per game, tie path)
    [B.red, B.blue].forEach(team => {
      const f = active(team);
      const tNamePip = team === B.red ? 'red' : 'blue';
      const pipRoll = team === B.red ? rR : bR;
      if (f.id === 418 && !f.ko && isTripleOrBetter(pipRoll.type) && B.pipToastedUsed && !B.pipToastedUsed[tNamePip]) {
        B.pipToastedUsed[tNamePip] = true;
        const oppName = tNamePip === 'red' ? 'blue' : 'red';
        B.pipDieRemoval[oppName] = (B.pipDieRemoval[oppName] || 0) + 1;
        team.resources.fire += 2;
        queueAbility('TOASTED!', 'var(--rare)', `${f.name} — ${pipRoll.type}! Enemy permanently loses 1 die + 2 Sacred Fires! (Once per game)`, null, tNamePip);
        log(`<span class="log-ability">${f.name}</span> — Toasted! ${pipRoll.type} → enemy -1 die permanently + <span class="log-ms">+2 Sacred Fires!</span>`);
        checkKnightEffects(tNamePip, f.name);
      }
    });

    // Dream Cat (28) — Jinx: tie where BOTH teams rolled doubles → +1 die next round
    // In a tie rR.type === bR.type, so rR.type === 'doubles' means both had doubles.
    if (rR.type === 'doubles') {
      [B.red, B.blue].forEach(team => {
        const f = active(team);
        if (f.id === 28 && !f.ko) {
          const tNameDC = team === B.red ? 'red' : 'blue';
          B.dreamCatBonus[tNameDC] = (B.dreamCatBonus[tNameDC] || 0) + 1;
          queueAbility('JINX!', 'var(--common)', `${f.name} — Both teams rolled doubles on a tie! +1 die next round!`, null, tNameDC);
          log(`<span class="log-ability">${f.name}</span> — Jinx! Both rolled doubles (tie) → +1 die next round.`);
          checkKnightEffects(tNameDC, f.name);
        }
      });
    }

    // Opa (48) — Rest: tie → gain +1 HP (overclocks! Rule #9 — do NOT add Math.min cap)
    // Mr Filbert (59) — Mask Merchant: flips heal to -1 damage when on enemy sideline.
    [B.red, B.blue].forEach(team => {
      const f = active(team);
      const tNameOpaTie = team === B.red ? 'red' : 'blue';
      if (f.id === 48 && !f.ko) {
        const opaEnemy = opp(team);
        if (hasSideline(opaEnemy, 59)) {
          const opaFlippedTie = Math.max(0, f.hp - 1);
          const opaGhostTie = f;
          queueAbility('MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Rest cursed! ${f.name} takes 1 damage! (${f.hp}→${opaFlippedTie} HP)`, () => { opaGhostTie.hp = opaFlippedTie; if (opaGhostTie.hp <= 0) { opaGhostTie.hp = 0; opaGhostTie.ko = true; opaGhostTie.killedBy = 59; } renderBattle(); }, tNameOpaTie);
          log(`<span class="log-ability">${f.name}</span> — Rest! Mr Filbert curses → -1 HP (${opaFlippedTie} HP).`);
        } else {
          const opaNewHpTie = f.hp + 1;
          const opaOverTie = opaNewHpTie > f.maxHp;
          queueAbility('REST!', 'var(--uncommon)', `${f.name} — Tie! +1 HP! (${f.hp}→${opaNewHpTie} HP${opaOverTie ? ' · overclocked!' : ''})`, () => { f.hp++; renderBattle(); }, tNameOpaTie);
          log(`<span class="log-ability">${f.name}</span> — Rest! Tie → +1 HP (${opaNewHpTie} HP${opaOverTie ? ' overclocked!' : ''}).`);
        }
        checkKnightEffects(tNameOpaTie, f.name);
      }
    });

    // Ancient One (22) — Friend to All: sideline passive → active ghost gains +3 HP on ties
    // Negated by Cornelius (45) — Antidote: if the enemy team has Cornelius on sideline, Friend to All is blocked.
    // Mr Filbert (59) — Mask Merchant: flips the +3 heal to 3 damage when on enemy sideline (Cornelius takes priority).
    [B.red, B.blue].forEach(team => {
      const f = active(team);
      const tNameAO = team === B.red ? 'red' : 'blue';
      if (!hasSideline(team, 22) || f.ko) return;
      const aoEnemy = opp(team);
      if (hasSideline(aoEnemy, 45)) {
        const cornGhostAO = getSidelineGhost(aoEnemy, 45);
        queueAbility('ANTIDOTE!', 'var(--uncommon)', `${cornGhostAO ? cornGhostAO.name : 'Cornelius'} (sideline) — blocks Ancient One's Friend to All on ${f.name}!`, () => { renderBattle(); }, tNameAO);
        checkKnightEffects(tNameAO, cornGhostAO ? cornGhostAO.name : 'Cornelius');
        log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Friend to All blocked for ${f.name}.`);
      } else if (hasSideline(aoEnemy, 59)) {
        const aoFlipped = Math.max(0, f.hp - 3);
        queueAbility('MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Friend to All cursed! ${f.name} takes 3 damage! (${f.hp}→${aoFlipped} HP)`, () => { f.hp = Math.max(0, f.hp - 3); if (f.hp <= 0) { f.hp = 0; f.ko = true; f.killedBy = 59; } renderBattle(); }, tNameAO);
        checkKnightEffects(tNameAO, 'Mr Filbert');
        log(`<span class="log-ability">${f.name}</span> — Friend to All! Mr Filbert curses → -3 HP (${aoFlipped} HP).`);
      } else {
        const aoNewHp = f.hp + 3;
        const aoOver = aoNewHp > f.maxHp;
        queueAbility('FRIEND TO ALL!', 'var(--common)', `Ancient One — Tie! ${f.name} gains +3 HP! (${f.hp}→${aoNewHp} HP${aoOver ? ' · overclocked!' : ''})`, () => { f.hp += 3; renderBattle(); }, tNameAO);
        checkKnightEffects(tNameAO, 'Ancient One');
        log(`<span class="log-ability">${f.name}</span> — Friend to All! Tie → +3 HP (${aoNewHp} HP${aoOver ? ' overclocked!' : ''}).`);
      }
    });

    // Maximo (302) — end of round: gain 1 Healing Seed
    // Sandwiches (33) — Dependable: if opponent gains a seed, mirror it.
    [B.red, B.blue].forEach(team => {
      const f = active(team);
      const tNameMax = team === B.red ? 'red' : 'blue';
      if (f.id === 302 && !f.ko) {
        const oppTeamMax    = opp(team);
        const sandwichMirrorsMax = hasOnTeam(oppTeamMax, 33);
        queueAbility('NAP!', 'var(--common)', `${f.name} — +1 Healing Seed and +1 Lucky Stone while napping!`, () => {
          team.resources.healingSeed++;
          team.resources.luckyStone++;
          log(`<span class="log-ability">${f.name}</span> — Nap! Gained <span class="log-ms">1 Healing Seed</span> + <span class="log-ms">1 Lucky Stone</span>.`);
          renderBattle();
        }, tNameMax);
        // Knight reactions must be queued WHILE abilityQueueMode===true (not inside onShow
        // where abilityQueueMode is false and checkKnightEffects fires showAbilityCallout
        // directly, stomping the NAP! callout still on screen).
        checkKnightEffects(tNameMax, f.name);
        if (sandwichMirrorsMax) {
          queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Nap! +1 Healing Seed + 1 Lucky Stone!`, () => { oppTeamMax.resources.healingSeed++; oppTeamMax.resources.luckyStone++; renderBattle(); }, tNameMax === 'red' ? 'blue' : 'red');
        }
      }
    });

    // Dupy (12) — Frolic: tie → instant KO the opposing ghost
    [B.red, B.blue].forEach(team => {
      const f = active(team);
      const ef = active(opp(team));
      const tNameDupy = team === B.red ? 'red' : 'blue';
      if (f.id === 12 && !f.ko && !ef.ko) {
        ef.hp = 0;
        ef.ko = true;
        ef.killedBy = 12;
        dupyFrolicKO = true;
        playDamageSfx();
        queueAbility('FROLIC!', 'var(--common)', `${f.name} — Tie! ${ef.name} instantly KO'd!`, () => { hitDamage(tNameDupy); renderBattle(); }, tNameDupy);
        log(`<span class="log-ability">${f.name}</span> — Frolic! Tie → ${ef.name} <span class="log-ko">instantly KO'd!</span>`);
        checkKnightEffects(tNameDupy, f.name);
      }
    });

    abilityQueueMode = false;

    // Reset committed resources + Blackout picks + per-round ability flags
    B.committed.red = { ice:0, fire:0, surge:0, auntSusan:0, auntSusanHeal:0, harrison:0, zainBlade:0 };
    B.committed.blue = { ice:0, fire:0, surge:0, auntSusan:0, auntSusanHeal:0, harrison:0, zainBlade:0 };
    B.blackoutNum = {};
    B.pressureUsed = { red: false, blue: false };
    if (B.romyPrediction) { B.romyPrediction.red = null; B.romyPrediction.blue = null; }
    if (B.guardianFairyStandby) { B.guardianFairyStandby.red = false; B.guardianFairyStandby.blue = false; }
    if (B.eloiseUsedThisRound) { B.eloiseUsedThisRound.red = false; B.eloiseUsedThisRound.blue = false; }
    // bogeyArmed removed v430 — Bogey reflect is now reactive (no pre-arm state)
    // Duel Phase: tie rounds DON'T clear duelLastLoser — the previous non-tie loser's
    // initiative is sticky, so it carries forward through tie rounds. "Easier to
    // understand: tie round just keeps the last loser as first mover." (Wyatt, v394)
    // galeForceDecided reset removed — Gus is now reactive post-win
    if (B.jacksonUsedThisRound) { B.jacksonUsedThisRound.red = false; B.jacksonUsedThisRound.blue = false; }
    if (B.sonyaUsedThisRound) { B.sonyaUsedThisRound.red = false; B.sonyaUsedThisRound.blue = false; }
    // Dark Wing (76) Precision: NO per-round reset — once-per-GAME flag persists across rounds (v595)
    if (B.mallowDecided) { B.mallowDecided.red = false; B.mallowDecided.blue = false; }
    if (B.fangUndercoverArmed) { B.fangUndercoverArmed.red = false; B.fangUndercoverArmed.blue = false; } // clear — tied, no damage taken
    if (B.tylerDecidedThisRound) { B.tylerDecidedThisRound.red = false; B.tylerDecidedThisRound.blue = false; }
    if (B.booTeamworkDecidedThisRound) { B.booTeamworkDecidedThisRound.red = false; B.booTeamworkDecidedThisRound.blue = false; }
    if (B.luckyStoneSpentThisTurn) { B.luckyStoneSpentThisTurn.red = 0; B.luckyStoneSpentThisTurn.blue = 0; }
    if (B.preRollAbilitiesFiredThisTurn) { B.preRollAbilitiesFiredThisTurn.red = false; B.preRollAbilitiesFiredThisTurn.blue = false; } B.moonstoneSicknessFiredThisTurn = false;
    // Willow (435) — Joy of Painting: tie = nobody lost, clear both flags
    if (B.willowLostLast) { B.willowLostLast.red = false; B.willowLostLast.blue = false; }
    // Reset item swing toggles each round (player must actively choose to swing)
    if (B.flameBladeSwing) { B.flameBladeSwing.red = false; B.flameBladeSwing.blue = false; }
    if (B.iceBladeSwing) { B.iceBladeSwing.red = false; B.iceBladeSwing.blue = false; }
    // Toby — Pure Heart: carry forward scheduled KO, then clear declaration (tie path)
    if (B.pureHeartDeclared) {
      if (B.pureHeartDeclared.red === true && B.pureHeartScheduledKO) B.pureHeartScheduledKO.red = true;
      if (B.pureHeartDeclared.blue === true && B.pureHeartScheduledKO) B.pureHeartScheduledKO.blue = true;
      B.pureHeartDeclared.red = null;
      B.pureHeartDeclared.blue = null;
    }
    B.selenePending = null; // discard any doubles-triggered Selene reward from this tie round — it must not ghost into the next round's post-roll flow
    B.wiseAlPending = null;
    B.gordokPending = null;
    B.sophiaPending = null;

    B.round++;
    B.phase = 'ko-pause'; // brief hold on tie so narration lands
    B.preRoll = null;
    renderDice(redDice, blueDice);
    renderBattle();

    // Drain tie-round ability callouts, then resume.
    // drainAbilityQueue now fires its callback 1500ms after the LAST callout fires —
    // 100ms after the 1400ms splash auto-dismisses — so roll buttons only become live
    // after the last callout is fully cleared.  The old 600ms wrapper (v111) that
    // compensated for the former 900ms early-callback window has been removed.
    // Narrate first, then enable buttons 350ms later — same breathing-room pattern as
    // the no-KO path (v110), KO path (v114), and openKoSwap all-swaps-done (v113).
    // Previously: B.phase='ready' + resetRollButtons() fired BEFORE narrate(), making
    // roll buttons live the instant the callback ran — zero reading time on "Round N".
    drainAbilityQueue(() => {
      // Dupy (12) — Frolic killed on this tie — hand off to KO swap flow
      if (dupyFrolicKO) {
        if (!handleKOs()) renderBattle();
        return;
      }
      narrate(`<b class="gold">Round ${B.round}</b> — <b class="red-text">${active(B.red).name}</b>&nbsp;vs&nbsp;<b class="blue-text">${active(B.blue).name}</b>`);
      renderBattle();
      setTimeout(() => { startNextRound(); }, spd(350));
    });
    return;
  }

  // ========================================
  // PHASE 5: RESOLVE DAMAGE
  // ========================================
  const winTeamName = winner;
  const winTeam = B[winner];
  const loseTeamName = winner === 'red' ? 'blue' : 'red';
  const loseTeam = opp(winTeam);
  // Mr Filbert (59) — Mask Merchant: while on the enemy sideline, any healing the opponent receives
  // is flipped to damage instead. filbertCursesWin = Filbert is on loseTeam's bench → wF heals → damage.
  const filbertCursesWin = hasSideline(loseTeam, 59);
  const filbertCursesLose = hasSideline(winTeam, 59);
  // Sandwiches (33) — Dependable: while on the sideline, if opponent gains a Special, you gain it too.
  // sandwichForLose = Sandwiches on loseTeam bench → mirrors winTeam Special grants to loseTeam.
  // sandwichForWin  = Sandwiches on winTeam bench  → mirrors loseTeam Special grants to winTeam.
  const sandwichForLose = hasOnTeam(loseTeam, 33);
  const sandwichForWin  = hasOnTeam(winTeam, 33);
  const wF = active(winTeam);
  const lF = active(loseTeam);
  // Per-ghost first-roll tracking for Nikon (2) Ambush and Cave Dweller (46) Lurk.
  // B.round === 1 is WRONG for KO-swap replacements — a ghost brought in round 4 has their
  // "first roll" in round 4, not round 1. Solution: tag each ghost object with _rolledOnce
  // (falsy until they've resolved their first roll as either winner or loser). Checked here,
  // BEFORE being set to true, so the first call into resolveRound correctly captures state.
  const nikonIsFirstRoll = (wF.id === 2 && !wF._rolledOnce);
  const caveDwellerIsFirstRoll = (wF.id === 46 && !wF._rolledOnce);
  wF._rolledOnce = true;
  lF._rolledOnce = true;
  const wR = winner==='red' ? rR : bR;
  const lR = winner==='red' ? bR : rR;
  const winDice = winner==='red' ? redDice : blueDice;
  const loseDice = winner==='red' ? blueDice : redDice;

  // Store roll data for raid spectator snapshots
  if (RAID_MODE) {
    window._lastRaidRollData = {
      player: [...redDice],
      boss: [...blueDice],
      winner: winner === 'red' ? 'player' : 'boss',
      damage: wR.damage
    };
    window._lastRaidAbilityCallout = wF.name + ' — ' + wR.type + (wR.type !== 'singles' ? '!' : '');
  }

  let dmg = wR.damage;

  // Antoinette (82) — Grace: +1 damage on doubles
  if (wF.id === 82 && !wF.ko && wR.type === 'doubles') {
    dmg += 1;
    log(`<span class="log-ability">${wF.name}</span> — Grace! Doubles → +1 damage!`);
  }

  // Valkin's Crystal (raid item): +1 damage on doubles
  if (B.valkinShard && B.valkinShard[winTeamName] && wR.type === 'doubles') {
    dmg += 1;
    queueAbility("Valkin's Crystal", 'var(--legendary)', 'Doubles deal +1 bonus damage!', winTeamName);
    log(`<span class="log-ability">Valkin's Crystal</span> — Doubles → +1 damage!`);
  }

  // Boo Brothers (17) — Teamwork damage bonus: +1 if they used the ability this round
  let booTeamworkDmgTriggered = false;
  if (wF.id === 17 && !wF.ko && B.booTeamworkDmgBonus && B.booTeamworkDmgBonus[winTeamName] > 0) {
    dmg += 1;
    booTeamworkDmgTriggered = true;
    B.booTeamworkDmgBonus[winTeamName] = 0;
    log(`<span class="log-ability">${wF.name}</span> — Teamwork Bonus! Used ability → +1 damage!`);
  }
  // Clear unused Boo Brothers bonus on loss
  if (lF.id === 17 && B.booTeamworkDmgBonus && B.booTeamworkDmgBonus[loseTeamName] > 0) {
    B.booTeamworkDmgBonus[loseTeamName] = 0;
  }

  // Zippa (423) — Glimmer: +1 damage per Healing Seed held (passive, active or sideline)
  let zippaGlimmerBonus = 0;
  if (wF.id === 423 && !wF.ko) {
    const zippaSeeds = winTeam.resources.healingSeed || 0;
    if (zippaSeeds > 0) {
      zippaGlimmerBonus = zippaSeeds;
      dmg += zippaSeeds;
      log(`<span class="log-ability">${wF.name}</span> — Glimmer! ${zippaSeeds} Healing Seed${zippaSeeds>1?'s':''} → +${zippaSeeds} damage!`);
    }
  }

  // v386: collectKC defined BEFORE any ability block that might call it (was TDZ-declared
  // at line ~8163 but referenced by Skylar Winter Barrage at 8131 and Tyler Heating Up
  // at 8144 — would throw ReferenceError if either fighter was active with ice/fire
  // committed. Same bug class as v305 teamLabel and v377 calloutCount.)
  const resolveKnightCallouts = [];
  const pendingHeavyAirHits = []; // deferred Heavy Air damage — only applied if Knight Terror survives the round
  const collectKC = (t, n, s) => {
    const savedQ = abilityQueue, savedM = abilityQueueMode;
    abilityQueue = []; abilityQueueMode = true;
    // Use deferred mode: Heavy Air damage stored, not applied immediately
    checkKnightEffects(t, n, s, pendingHeavyAirHits);
    resolveKnightCallouts.push(...abilityQueue);
    abilityQueue = savedQ; abilityQueueMode = savedM;
  };

  // Champ (438) — Thrill (A): immune to damage from Specials (committed resources)
  const champImmuneToSpecials = lF.id === 438 && !lF.ko;
  if (champImmuneToSpecials && (B.committed[winTeamName].ice > 0 || B.committed[winTeamName].fire > 0 || B.committed[winTeamName].surge > 0)) {
    log(`<span class="log-ability">${lF.name}</span> — Thrill! Immune to all committed resource damage!`);
  }

  // Committed Ice Shards: +1 per shard (Skylar Winter Barrage: +2 each)
  let skylarTriggered = false;
  if (B.committed[winTeamName].ice > 0 && !champImmuneToSpecials) {
    const skylarActive = wF.id === 104 && !wF.ko;
    const perShard = skylarActive ? 2 : 1;
    const iceDmg = B.committed[winTeamName].ice * perShard;
    dmg += iceDmg;
    if (skylarActive) {
      skylarTriggered = true;
      collectKC(winTeamName, wF.name);
    }
    log(`<span class="log-ms">Ice Shards committed!</span> <span class="log-dmg">+${iceDmg} damage!</span>${skylarActive ? ' (Winter Barrage ×2!)' : ''}`);
  }
  // Committed Sacred Fires: +3 per fire (Tyler 105 Heating Up: ×2 = +6 per fire)
  // Rook (416) — Charcoal: immune to Sacred Fire damage when Rook is the LOSER/target
  let tylerFireTriggered = false;
  if (B.committed[winTeamName].fire > 0 && lF.id !== 416 && !champImmuneToSpecials) {
    const tylerWins = wF.id === 105 && !wF.ko;
    const perFire = tylerWins ? 6 : 3;
    // Lucy's Shadow (439) — Mentor: doubles Sacred Fire damage when Lucy (108) is active winner
    // Cornelius (45) Antidote blocks Lucy's Shadow sideline effect
    const corneliusBlocksLucyShadowDmg = hasSideline(loseTeam, 45);
    const lucyShadowBoost = (wF.id === 108 && hasSideline(winTeam, 439) && !corneliusBlocksLucyShadowDmg) ? 2 : 1;
    const fireDmg = B.committed[winTeamName].fire * perFire * lucyShadowBoost;
    dmg += fireDmg;
    if (tylerWins) {
      tylerFireTriggered = true;
      collectKC(winTeamName, wF.name);
    }
    const lucyShadowTag = lucyShadowBoost === 2 ? ' (Mentor ×2!)' : '';
    log(`<span class="log-ms">Sacred Fires committed!</span> <span class="log-dmg">+${fireDmg} damage!</span>${tylerWins ? ' (Heating Up ×2!)' : ''}${lucyShadowTag}`);

    // Eternal Flame (406) — Sacred Fires not discarded (grant deferred to ETERNAL FLAME! onShow)
  }
  // Rook (416) — Charcoal: Sacred Fire immunity log
  if (B.committed[winTeamName].fire > 0 && lF.id === 416) {
    log(`<span class="log-ability">${lF.name}</span> — Charcoal! Immune to Sacred Fire damage!`);
  }

  // Aunt Susan (309) — +2 damage per seed committed (also blocked by Champ Thrill)
  if (B.auntSusanBonus[winTeamName] > 0 && !champImmuneToSpecials) {
    const susanDmg = B.auntSusanBonus[winTeamName] * 2;
    dmg += susanDmg;
    log(`<span class="log-ability">${wF.name}</span> — Harvest Dance! <span class="log-dmg">+${susanDmg} bonus damage!</span>`);
  }

  // Rook (416) — Charcoal: Win: +1 dmg per Surge committed this round (also blocked by Champ Thrill)
  if (wF.id === 416 && !wF.ko && B.committed[winTeamName].surge > 0 && !champImmuneToSpecials) {
    const rookSurgeDmg = B.committed[winTeamName].surge;
    dmg += rookSurgeDmg;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Charcoal! <span class="log-dmg">+${rookSurgeDmg} damage</span> from ${rookSurgeDmg} Surge committed!`);
  }

  // Haywire (78) — Wild Chords permanent +2 damage on any winning roll (after trigger)
  // Added to base before doubles/triples multipliers so the bonus scales with Mountain King etc., same precedent as Pudge 311.
  if (wF.id === 78 && !wF.ko && (B.haywireDamageBonus[winTeamName] || 0) > 0) {
    const hwDmg = B.haywireDamageBonus[winTeamName];
    dmg += hwDmg;
    log(`<span class="log-ability">${wF.name}</span> — Wild Chords damage! <span class="log-dmg">+${hwDmg} damage!</span>`);
  }

  // v386: collectKC + resolveKnightCallouts moved to ~line 8125, before any ability
  // block that might reference them. (Was: `const collectKC = …` here, which created
  // a Temporal Dead Zone for Skylar/Tyler at lines ~8131/~8144.)

  // Little Boo (9) — Mercy: enemy rolled triples count as a 1,2,3 roll instead.
  // Override wR.type to 'singles' BEFORE all damage-multiplier checks so Larry Flying Kick,
  // Haywire Wild Chords, Bubble Boys Pop, and all other triples-gated abilities see 'singles'.
  // Adjust dmg by -2 to swap base from 3 (triples) to 1 (singles); committed resources preserved.
  let mercyTriggered = false;
  if (lF.id === 9 && !lF.ko && wR.type === 'triples') {
    wR.type = 'singles';
    wR.damage = 1;
    dmg -= 2; // triples base 3 → singles base 1; committed ice/fire bonuses untouched
    mercyTriggered = true;
    collectKC(loseTeamName, lF.name);
    log(`<span class="log-ability">${lF.name}</span> — Mercy! Enemy triples converted to [1,2,3]! Base damage reduced 3 → 1!`);
  }

  // Bigsby (424) — Omen: Win: +1 damage
  if (wF.id === 424 && !wF.ko) {
    dmg += 1;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Omen! <span class="log-dmg">+1 damage!</span>`);
  }

  // Michael (445) — Torrent: Even doubles → +2 damage
  if (wF.id === 445 && !wF.ko && wR.type === 'doubles' && wR.value % 2 === 0) {
    dmg += 2;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Torrent! Even doubles → <span class="log-dmg">+2 damage!</span>`);
  }

  // Twyla (417) — Lucky Dance: MOVED to dice count section (v674 rework: Lucky Stones give dice + Healing Seeds, not damage + HP)

  // Pudge (311) — doubles: +2 damage
  let pudgeSelfDmg = false;
  if (wF.id === 311 && !wF.ko && wR.type === 'doubles') {
    dmg += 2;
    pudgeSelfDmg = true;
    collectKC(winTeamName, wF.name);
  }

  // The Mountain King (110) — Beast Mode: doubles deal 2X damage
  let mountainKingTriggered = false;
  let mountainKingBaseDmg = 0;
  if (wF.id === 110 && !wF.ko && wR.type === 'doubles') {
    mountainKingBaseDmg = dmg;
    dmg *= 2;
    mountainKingTriggered = true;
    collectKC(winTeamName, wF.name);
  }

  // Stone Cold (73) — One-two-one!: winning with double 1s → 3X damage
  // Accept any roll containing two or more 1s (doubles, triples, quads of 1).
  let stoneColdTriggered = false;
  let stoneColdBaseDmg = 0;
  if (wF.id === 73 && !wF.ko && winDice && winDice.filter(d => d === 1).length >= 2) {
    stoneColdBaseDmg = dmg;
    dmg *= 3;
    stoneColdTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — One-two-one! Double 1s → 3X damage!`);
  }

  // Larry (35) — Flying Kick: triples deal 3X damage
  let larryTriggered = false;
  let larryBaseDmg = 0;
  if (wF.id === 35 && !wF.ko && wR.type === 'triples') {
    larryBaseDmg = dmg;
    dmg *= 3;
    larryTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Flying Kick! Triples → 3X damage!`);
  }

  // Buttons (8) — Perfect Plan: triple 6s deal +15 bonus damage.
  // The dream: 1 HP kamikaze — if it lands, it nukes anything. 3+15=18 damage minimum.
  // Accept any roll with at least 3 sixes in the winning dice (triples/quads/penta of 6).
  let buttonsTriggered = false;
  let buttonsBaseDmg = 0;
  if (wF.id === 8 && !wF.ko && winDice && winDice.filter(d => d === 6).length >= 3) {
    buttonsBaseDmg = dmg;
    dmg += 15;
    buttonsTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Perfect Plan! Triple 6s! ${buttonsBaseDmg} + 15 = ${dmg} damage!`);
  }

  // Nikon (2) — Ambush: first roll win deals 3X damage
  // nikonIsFirstRoll is captured above (before _rolledOnce is set) — works for starters AND KO-swap replacements.
  let nikonTriggered = false;
  let nikonBaseDmg = 0;
  if (wF.id === 2 && !wF.ko && nikonIsFirstRoll) {
    nikonBaseDmg = dmg;
    dmg *= 3;
    nikonTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Ambush! First roll ambush → 3X damage!`);
  }

  // Cave Dweller (46) — Lurk: first roll win deals 3X damage
  // caveDwellerIsFirstRoll captured above — correct for starters AND KO-swap replacements.
  let caveDwellerTriggered = false;
  let caveDwellerBaseDmg = 0;
  if (wF.id === 46 && !wF.ko && caveDwellerIsFirstRoll) {
    caveDwellerBaseDmg = dmg;
    dmg *= 3;
    caveDwellerTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Lurk! First roll ambush → 3X damage!`);
  }

  // Doom (112) — Fiendship: every win deals +2 bonus damage
  let doomTriggered = false;
  if (wF.id === 112 && !wF.ko) {
    dmg += 2;
    doomTriggered = true;
    collectKC(winTeamName, wF.name);
  }

  // Lucy (108) — Blue Fire: Win → gain 1 Sacred Fire (REWORKED 2026-04-12, swapped with Humar)
  let lucyTriggered = false;
  let lucyShadowExtraFire = false;
  if (wF.id === 108 && !wF.ko) {
    lucyTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Blue Fire! Gain <span class="log-ms">1 Sacred Fire</span>!`);
    // Lucy's Shadow (439) — Mentor: +1 extra Sacred Fire when Lucy wins
    // Cornelius (45) Antidote blocks Lucy's Shadow sideline effect
    const corneliusBlocksLucyShadowFire = hasSideline(loseTeam, 45);
    if (hasSideline(winTeam, 439) && !corneliusBlocksLucyShadowFire) {
      lucyShadowExtraFire = true;
      log(`<span class="log-ability">Lucy's Shadow</span> — Mentor! +1 extra Sacred Fire!`);
    } else if (hasSideline(winTeam, 439) && corneliusBlocksLucyShadowFire) {
      const cornGhostLS = getSidelineGhost(loseTeam, 45);
      log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Lucy's Shadow Mentor blocked!`);
    }
  }

  // Gom Gom Gom (440) — Chaos: Win with doubles → gain 1 Sacred Fire (v685: moved from post-roll to win-path only)
  let gomTriggered = false;
  if (wF.id === 440 && !wF.ko && ['doubles','triples','quads','penta'].includes(wR.type)) {
    gomTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Chaos! Win with doubles → <span class="log-ms">+1 Sacred Fire</span>!`);
  }

  // Humar (336) — Meteor: Win → opponent takes 2 damage before next roll + gain 1 Burn (was Lucy's old ability, buffed 1→2 dmg)
  let humarTriggered = false;
  if (wF.id === 336 && !wF.ko) {
    B.pendingLucyDmg[loseTeamName] = 2; // reuse pendingLucyDmg but with 2 damage
    if (!winTeam.resources.burn) winTeam.resources.burn = 0;
    winTeam.resources.burn += 1;
    humarTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Meteor! <span class="log-dmg">2 delayed damage</span> + <span class="log-dmg">1 Burn</span>!`);
  }

  // Wim (65) — Slash: all winning dice odd → +5 damage
  let wimTriggered = false;
  let wimBaseDmg = 0;
  if (wF.id === 65 && !wF.ko && winDice && winDice.length > 0 && winDice.every(d => d % 2 === 1)) {
    wimBaseDmg = dmg;
    dmg += 5;
    wimTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Slash! All dice odd → +5 damage!`);
  }

  // Snorton (67) — Fissure: two or more 6s in winning dice → +5 damage
  let snortonTriggered = false;
  let snortonBaseDmg = 0;
  if (wF.id === 67 && !wF.ko && winDice && winDice.filter(d => d === 6).length >= 2) {
    snortonBaseDmg = dmg;
    dmg += 5;
    snortonTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Fissure! Two 6s → +5 damage!`);
  }

  // Pelter (86) — Snowball: doubles win → +2 bonus damage
  let pelterTriggered = false;
  let pelterBaseDmg = 0;
  if (wF.id === 86 && !wF.ko && wR.type === 'doubles') {
    pelterBaseDmg = dmg;
    dmg += 2;
    pelterTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Snowball! Doubles win → +2 damage!`);
  }

  // Kaylee (453) — Slipstream: dice stealing handled pre-winner in _resolveRoundImpl
  const slipstreamBonus = 0; // kept for callout compatibility

  // Doc (42) — Savage: doubles win → +5 bonus damage
  let docTriggered = false;
  let docBaseDmg = 0;
  if (wF.id === 42 && !wF.ko && wR.type === 'doubles') {
    docBaseDmg = dmg;
    dmg += 5;
    docTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Savage! Doubles win → +5 damage!`);
  }

  // Charlie (18) — Rush is now a Flick ability (triggers on loss in resolveRound)
  // No damage modifier on win — the old "Double 2s = 7 damage" is retired.
  let charlieTriggered = false;
  let charlieBaseDmg = 0;

  // Bill & Bob (36) — Bait n Switch: while below 4 HP, winning rolls deal 2X damage
  let billBobTriggered = false;
  let billBobBaseDmg = 0;
  if (wF.id === 36 && !wF.ko && wF.hp < 4) {
    billBobBaseDmg = dmg;
    dmg *= 2;
    billBobTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Bait n Switch! Below 4 HP → 2X damage!`);
  }

  // Alucard (38) — Colony Call: doubles win → +2 damage per alive sideline ghost. Once per game.
  let alucardTriggered = false;
  let alucardBaseDmg = 0;
  let alucardSidelineCount = 0;
  if (wF.id === 38 && !wF.ko && wR.type === 'doubles' && B.alucardUsed && !B.alucardUsed[winTeamName]) {
    alucardSidelineCount = winTeam.ghosts.filter((g, i) => i !== winTeam.activeIdx && !g.ko).length;
    if (alucardSidelineCount > 0) {
      alucardBaseDmg = dmg;
      dmg += alucardSidelineCount * 2;
      alucardTriggered = true;
      B.alucardUsed[winTeamName] = true;
      collectKC(winTeamName, wF.name);
      log(`<span class="log-ability">${wF.name}</span> — Colony Call! ${alucardSidelineCount} sideline ghost${alucardSidelineCount>1?'s':''} × 2 = +${alucardSidelineCount*2} damage!`);
    }
  }

  // Castle Guards (39) — Flamethrower: each 3 in winning dice multiplies damage by 2.
  // e.g. one 3 = 2X, two 3s = 4X, three 3s = 8X. Only fires when at least one 3 is rolled.
  let castleGuardsTriggered = false;
  let castleGuardsBaseDmg = 0;
  let castleGuardsThreeCount = 0;
  if (wF.id === 39 && !wF.ko && winDice && winDice.length > 0) {
    castleGuardsThreeCount = winDice.filter(d => d === 3).length;
    if (castleGuardsThreeCount > 0) {
      castleGuardsBaseDmg = dmg;
      for (let t = 0; t < castleGuardsThreeCount; t++) dmg *= 2;
      castleGuardsTriggered = true;
      collectKC(winTeamName, wF.name);
      log(`<span class="log-ability">${wF.name}</span> — Flamethrower! ${castleGuardsThreeCount} three${castleGuardsThreeCount>1?'s':''} → ${castleGuardsBaseDmg} × ${Math.pow(2,castleGuardsThreeCount)} = ${dmg} damage!`);
    }
  }

  // Team Zippy (40) — Teamwork: singles win deals +2 bonus damage.
  // Ported from boobattles: `if (roll.type === 'singles') damage += 2`.
  let teamZippyTriggered = false;
  let teamZippyBaseDmg = 0;
  if (wF.id === 40 && !wF.ko && wR.type === 'singles') {
    teamZippyBaseDmg = dmg;
    dmg += 2;
    teamZippyTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Teamwork! Singles win → +2 damage!`);
  }

  // Ridley (462) — Nimble: singles +1 damage, doubles +2 damage.
  let ridleyTriggered = false;
  let ridleyBaseDmg = 0;
  let ridleyBonus = 0;
  if (wF.id === 462 && !wF.ko) {
    if (wR.type === 'singles') { ridleyBonus = 1; }
    else if (['doubles','triples','quads','penta'].includes(wR.type)) { ridleyBonus = 2; }
    if (ridleyBonus > 0) {
      ridleyBaseDmg = dmg;
      dmg += ridleyBonus;
      ridleyTriggered = true;
      collectKC(winTeamName, wF.name);
      log(`<span class="log-ability">${wF.name}</span> — Nimble! ${wR.type === 'singles' ? 'Singles' : 'Doubles'} → +${ridleyBonus} damage!`);
    }
  }

  // Carpenter (449) — Apprentice: +2 damage on singles (active Carpenter only)
  let carpenterTriggered = false;
  if (wF.id === 449 && !wF.ko && wR.type === 'singles') {
    dmg += 2;
    carpenterTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Apprentice! Singles win → +2 damage!`);
  }

  // Carpenter's Hammer (permanent item) — +2 damage on singles for ANY active ghost on the team
  let carpenterHammerTriggered = false;
  if (B.carpenterHammer && B.carpenterHammer[winTeamName] && wR.type === 'singles' && wF.id !== 449) {
    dmg += 2;
    carpenterHammerTriggered = true;
    log(`<span class="log-ability">Carpenter's Hammer</span> — +2 singles damage!`);
  }

  // Greg (49) — Chase: if Greg has more HP than the opposing ghost, rolls deal 2X damage.
  // Faithfully ported from GHOSTS abilityDesc: "If Greg has more health than the opposing ghost, Greg's rolls do x2 damage."
  let gregTriggered = false;
  let gregBaseDmg = 0;
  if (wF.id === 49 && !wF.ko && wF.hp > lF.hp) {
    gregBaseDmg = dmg;
    dmg *= 2;
    gregTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Chase! Greg has ${wF.hp} HP vs enemy ${lF.hp} HP → 2X damage!`);
  }

  // Tommy Salami (30) — Regulator: bonus dice from chain-6s were already added in checkTommyRegulator.
  // No win-path damage bonus — the extra dice ARE the benefit (more dice = higher hand type / more damage).
  let tommyTriggered = false;
  let tommyRegulatedCount = (B.tommyRegulatorBonus && B.tommyRegulatorBonus[winTeamName]) || 0;
  if (wF.id === 30 && !wF.ko && tommyRegulatedCount > 0) {
    tommyTriggered = true;
    collectKC(winTeamName, wF.name);
  }

  // Romy (114) — Valley Guardian: if prediction matches any winning die, +3 damage
  // Capture prediction now; clear both teams so neither carries over to next round.
  const romyPredRed = (B.romyPrediction || {}).red;
  const romyPredBlue = (B.romyPrediction || {}).blue;
  if (B.romyPrediction) { B.romyPrediction.red = null; B.romyPrediction.blue = null; }
  const romyWinPred = winTeamName === 'red' ? romyPredRed : romyPredBlue;
  let romyTriggered = false;
  if (wF.id === 114 && !wF.ko && romyWinPred != null && winDice && winDice.includes(romyWinPred)) {
    dmg += 3;
    romyTriggered = true;
    collectKC(winTeamName, wF.name);
  }

  // Hector (96) — Protector: singles win → +1 bonus damage
  let hectorTriggered = false;
  if (wF.id === 96 && !wF.ko && wR.type === 'singles') {
    dmg += 1;
    hectorTriggered = true;
    collectKC(winTeamName, wF.name);
  }

  // Toby (97) — Pure Heart: win with declaration → instant KO enemy (boost dmg to exactly KO)
  let pureHeartKO = false;
  if (wF.id === 97 && !wF.ko && B.pureHeartDeclared && B.pureHeartDeclared[winTeamName] === true) {
    dmg = Math.max(dmg, lF.hp); // guarantee KO via normal damage resolution at Beat 3
    pureHeartKO = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Pure Heart! Instant KO — ${lF.name} is defeated!`);
  }

  // Zain (206) — Ice Blade: permanent +2 damage on ALL winning rolls once forged AND swinging
  // Fires for ANY ghost on the team, not just Zain.
  let zainIceBladeTriggered = false;
  if (B.iceBladeForgedPermanent && B.iceBladeForgedPermanent[winTeamName] && (B.committed[winTeamName].zainBlade > 0 || (B.iceBladeSwing && B.iceBladeSwing[winTeamName]))) {
    dmg += 2;
    zainIceBladeTriggered = true;
  }

  // Sophia (457) — Mask of Night: +1 damage on win when active
  let maskOfNightDmgTriggered = false;
  if (B.sophiaMask && B.sophiaMask[winTeamName] === 'night' && B.sophiaMaskActive[winTeamName]) {
    dmg += 1;
    maskOfNightDmgTriggered = true;
    log(`<span class="log-ability">Mask of Night</span> — 🌙 +1 damage!`);
  }

  // Flame Blade: +3 Burn on win when swinging
  let flameBladeWinTriggered = false;
  if (B.flameBlade && B.flameBlade[winTeamName] && B.flameBladeSwing && B.flameBladeSwing[winTeamName]) {
    if (!winTeam.resources.burn) winTeam.resources.burn = 0;
    winTeam.resources.burn += 3;
    flameBladeWinTriggered = true;
    log(`<span class="log-ability">Flame Blade</span> — Win while swinging! <span class="log-dmg">+3 Burn!</span>`);
  }

  // Red Hunter (345) — if opponent has any specials (resources, including committed): +3 damage
  let redHunterTriggered = false;
  if (wF.id === 345 && !wF.ko) {
    const eRes = loseTeam.resources;
    const eCom = B.committed[loseTeamName];
    const hasSpecials = (eRes.moonstone + (eCom.moonstone||0)) > 0
      || (eRes.ice + (eCom.ice||0)) > 0
      || (eRes.fire + (eCom.fire||0)) > 0
      || (eRes.surge + (eCom.surge||0)) > 0
      || (eRes.healingSeed + (eCom.healingSeed||0)) > 0
      || (eRes.luckyStone + (eCom.luckyStone||0)) > 0;
    if (hasSpecials) {
      dmg += 3;
      redHunterTriggered = true;
      collectKC(winTeamName, wF.name);
    }
  }

  // Timpleton (312) — Big Target: v640 rework — Win a roll, deal +3 damage if enemy HP > Timpleton's HP.
  // Was an Entry strike (triggerEntry) until v640. Now a Win-path damage multiplier, patterned after Red Hunter.
  let timpletonTriggered = false;
  if (wF.id === 312 && !wF.ko && lF && !lF.ko && lF.hp > wF.hp) {
    dmg += 3;
    timpletonTriggered = true;
    collectKC(winTeamName, wF.name);
  }

  // Cameron (25) — Unstoppable Force: Cameron's damage cannot be negated.
  // Defined early so it guards Sylvia, Guard Thomas, Bogey, Kodako, Patrick, Dealer, Sky, City Cyboo, King Jay, Fang.
  const cameronUnnegatable = (wF.id === 25 && !wF.ko);

  // Sylvia (313) — loser dodge check: roll 1 die, if it's a 6 negate all damage.
  // v331: the die is rolled by the PLAYER via the Sylvia modal (showSylviaModal) before
  // resolveRound's second pass reaches this block. B.sylviaPendingResult = { value, dodged }
  // is set by doSylviaRoll(). If it's missing (defensive fallback), we roll 1 die here.
  // Note: callouts are intentionally NOT queued here — they are queued in the cinematic section
  // (where abilityQueueMode=true) to prevent them firing synchronously and being stomped.
  let sylviaDodged = false;
  let sylviaDodgeRolls = []; // store for callout (array form for back-compat with callout)
  if (lF.id === 313 && !lF.ko && !cameronUnnegatable) {
    let rolledValue;
    if (B.sylviaPendingResult && typeof B.sylviaPendingResult.value === 'number') {
      rolledValue = B.sylviaPendingResult.value;
      sylviaDodged = !!B.sylviaPendingResult.dodged;
      B.sylviaPendingResult = null; // consume
    } else {
      // Defensive fallback — should never hit in normal flow
      rolledValue = Math.floor(Math.random()*6)+1;
      sylviaDodged = (rolledValue >= 5); // 5 or 6 dodge
    }
    sylviaDodgeRolls = [rolledValue];
    if (sylviaDodged) {
      dmg = 0;
      log(`<span class="log-ability">${lF.name}</span> — Porpoise! Rolled [${rolledValue}] — <span class="log-ms">ALL DAMAGE NEGATED!</span>`);
    } else {
      log(`<span class="log-ability">${lF.name}</span> — Porpoise dodge: [${rolledValue}] (needed 5 or 6).`);
    }
    collectKC(loseTeamName, lF.name);
  }

  // Tabitha (95) — Rally: while on the sideline, +2 damage to the active ghost's doubles wins
  // Negated by Cornelius (45) — Antidote: if the LOSING team has Cornelius on sideline, Rally is blocked.
  let tabithaTriggered = false;
  const corneliusBlocksRally = hasSideline(loseTeam, 45);   // win-team's sideline effects blocked (Cornelius on loseTeam)
  const corneliusOnWinTeam = hasSideline(winTeam, 45);       // lose-team's sideline effects blocked (Cornelius on winTeam)
  // Tracks whether Cornelius actually negated a sideline effect this round (for ANTIDOTE! callout)
  let corneliusSidelineBlockedList = [];
  if (hasSideline(winTeam, 95) && wR.type === 'doubles' && !wF.ko) {
    if (corneliusBlocksRally) {
      const cornGhost2 = getSidelineGhost(loseTeam, 45);
      log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! <span class="log-ability">Tabitha</span> Rally blocked!`);
    } else {
      dmg += 2;
      tabithaTriggered = true;
      const tabithaGhost = getSidelineGhost(winTeam, 95);
      collectKC(winTeamName, 'Tabitha', tabithaGhost);
      log(`<span class="log-ability">Tabitha</span> (sideline) — Rally! Doubles win gets +2 damage!`);
    }
  }

  // Admiral (71) — Comrades: while on the sideline, +2 damage to your even doubles rolls.
  // "Even doubles" = win type is doubles AND the paired value is even (2, 4, or 6).
  // FIX v279: was winDice.every(d => d%2===0) — that required ALL dice to be even, so [4,4,3]
  // (double 4s with an odd third die) wrongly failed. Correct check is wR.value % 2 === 0.
  let admiralTriggered = false;
  let admiralBaseDmg = 0;
  if (hasSideline(winTeam, 71) && !wF.ko && wR.type === 'doubles' && wR.value % 2 === 0) {
    if (!corneliusBlocksRally) {
      admiralBaseDmg = dmg;
      dmg += 2;
      admiralTriggered = true;
      const admiralGhost = getSidelineGhost(winTeam, 71);
      collectKC(winTeamName, 'Admiral', admiralGhost);
      log(`<span class="log-ability">Admiral</span> (sideline) — Comrades! Even doubles → +2 damage!`);
    } else { corneliusSidelineBlockedList.push('Admiral'); log(`<span class="log-ability">Cornelius</span> — Antidote! Admiral Comrades blocked.`); }
  }

  // Explorer Jeff (455) — Treasure Hunter: sideline & in play, +1 damage if 3+ different specials held
  let explorerJeffTriggered = false;
  let explorerJeffBaseDmg = 0;
  const ejOnSidelineDmg = hasSideline(winTeam, 455);
  const ejActiveDmg = wF.id === 455 && !wF.ko;
  if ((ejOnSidelineDmg || ejActiveDmg) && !wF.ko) {
    const ejRes = B[winTeamName].resources;
    const ejTypes = ['moonstone','ice','fire','surge','healingSeed','luckyStone','firefly','burn'].filter(r => (ejRes[r] || 0) > 0).length;
    if (ejTypes >= 3) {
      // Cornelius only blocks sideline, not in-play
      if (ejOnSidelineDmg && !ejActiveDmg && corneliusBlocksRally) {
        corneliusSidelineBlockedList.push('Explorer Jeff'); log(`<span class="log-ability">Cornelius</span> — Antidote! Explorer Jeff Treasure Hunter blocked.`);
      } else {
        explorerJeffBaseDmg = dmg;
        dmg += 1;
        explorerJeffTriggered = true;
        const loc = ejActiveDmg ? 'in play' : 'sideline';
        if (ejOnSidelineDmg && !ejActiveDmg) { const ejGhost = getSidelineGhost(winTeam, 455); collectKC(winTeamName, 'Explorer Jeff', ejGhost); }
        else { collectKC(winTeamName, wF.name); }
        log(`<span class="log-ability">Explorer Jeff</span> (${loc}) — Treasure Hunter! ${ejTypes} specials → +1 damage!`);
      }
    }
  }

  // Dark Jeff (74) — Cackle: while on the sideline, all your rolls deal +1 damage.
  // Passive sideline damage booster — applies to any win when Dark Jeff is benched.
  let darkJeffTriggered = false;
  let darkJeffBaseDmg = 0;
  if (hasSideline(winTeam, 74) && !wF.ko) {
    if (!corneliusBlocksRally) {
      darkJeffBaseDmg = dmg;
      dmg += 1;
      darkJeffTriggered = true;
      const djGhost = getSidelineGhost(winTeam, 74);
      collectKC(winTeamName, 'Dark Jeff', djGhost);
      log(`<span class="log-ability">Dark Jeff</span> (sideline) — Cackle! +1 damage to all rolls!`);
    } else { corneliusSidelineBlockedList.push('Dark Jeff'); log(`<span class="log-ability">Cornelius</span> — Antidote! Dark Jeff Cackle blocked.`); }
  }

  // Bilbo (80) — Little Buddy: while on the sideline, your ghost in play gains +2 damage on singles wins.
  // Dark Castle sideline singles booster — pairs naturally with Team Zippy Teamwork (+2 singles) and Hector Protector (+1 singles).
  let bilboTriggered = false;
  let bilboBaseDmg = 0;
  if (hasSideline(winTeam, 80) && !wF.ko && wR.type === 'singles') {
    if (!corneliusBlocksRally) {
      bilboBaseDmg = dmg;
      dmg += 2;
      bilboTriggered = true;
      const bilboGhost = getSidelineGhost(winTeam, 80);
      collectKC(winTeamName, 'Bilbo', bilboGhost);
      log(`<span class="log-ability">Bilbo</span> (sideline) — Little Buddy! Singles win → +2 damage!`);
    } else { corneliusSidelineBlockedList.push('Bilbo'); log(`<span class="log-ability">Cornelius</span> — Antidote! Bilbo Little Buddy blocked.`); }
  }

  // Pale Nimbus (88) — Hidden Storm: while on the sideline, +2 damage if winning dice sum < 7.
  // Frost Valley sideline damage booster — rewards low-total rolls (1+2+3=6, 1+1+4=6, etc.) from the bench.
  let paleNimbusTriggered = false;
  let paleNimbusBaseDmg = 0;
  if (hasSideline(winTeam, 88) && !wF.ko && winDice && winDice.reduce((s, d) => s + d, 0) < 7) {
    if (!corneliusBlocksRally) {
      paleNimbusBaseDmg = dmg;
      dmg += 2;
      paleNimbusTriggered = true;
      const pnGhost = getSidelineGhost(winTeam, 88);
      collectKC(winTeamName, 'Pale Nimbus', pnGhost);
      log(`<span class="log-ability">Pale Nimbus</span> (sideline) — Hidden Storm! Roll sum ${winDice.reduce((s,d)=>s+d,0)} < 7 → +2 damage!`);
    } else { corneliusSidelineBlockedList.push('Pale Nimbus'); log(`<span class="log-ability">Cornelius</span> — Antidote! Pale Nimbus Hidden Storm blocked.`); }
  }

  // Laura (79) — Catchy Tune: Sideline & In Play: roll a straight to unlock permanently.
  // Check WINNER's dice for straight activation (both teams checked separately below).
  let catchyJustUnlockedWin = false, catchyJustUnlockedLose = false;
  if (!B.catchyTuneUnlocked[winTeamName] && hasAlive(winTeam, 79) && winDice && isStraight(winDice)) {
    if (!corneliusBlocksRally || wF.id === 79) {
      B.catchyTuneUnlocked[winTeamName] = true;
      catchyJustUnlockedWin = true;
      const lauraG = wF.id === 79 ? wF : (getSidelineGhost(winTeam, 79) || { name: 'Laura' });
      const lauraLoc = wF.id === 79 ? '' : ' (sideline)';
      collectKC(winTeamName, lauraG.name);
      log(`<span class="log-ability">${lauraG.name}${lauraLoc}</span> — Catchy Tune unlocked! Straight [${[...winDice].sort((a,b)=>a-b).join('-')}]! Choose a die to lock after each roll!`);
      popSidelineCard(winTeam, 79);
    } else { corneliusSidelineBlockedList.push('Laura'); }
  }
  // Check LOSER's dice for straight activation too (Laura is Sideline & In Play — triggers on any roll)
  if (!B.catchyTuneUnlocked[loseTeamName] && hasAlive(loseTeam, 79) && loseDice && isStraight(loseDice)) {
    const enemyCornelius = hasSideline(winTeam, 45);
    if (!enemyCornelius || lF.id === 79) {
      B.catchyTuneUnlocked[loseTeamName] = true;
      catchyJustUnlockedLose = true;
      const lauraGL = lF.id === 79 ? lF : (getSidelineGhost(loseTeam, 79) || { name: 'Laura' });
      const lauraLocL = lF.id === 79 ? '' : ' (sideline)';
      collectKC(loseTeamName, lauraGL.name);
      log(`<span class="log-ability">${lauraGL.name}${lauraLocL}</span> — Catchy Tune unlocked! Straight [${[...loseDice].sort((a,b)=>a-b).join('-')}]! Choose a die to lock after each roll!`);
      popSidelineCard(loseTeam, 79);
    }
  }

  // Gary (92) — Lucky Novice: gain +1 Ice Shard for each 1 rolled by your active ghost.
  // v598 BUFF (Wyatt 2026-04-11): Gary now fires whether he is on the sideline OR in play.
  // When Gary is active, the dice he's counting are his own.
  // Cornelius (45) Antidote still blocks sideline Gary — but an ACTIVE Gary is not a
  // sideline ability and is unaffected by Cornelius.
  const winGaryActive = wF.id === 92 && !wF.ko;
  const winGarySide = hasSideline(winTeam, 92);
  const loseGaryActive = lF.id === 92 && !lF.ko;
  const loseGarySide = hasSideline(loseTeam, 92);
  const garyOnesWin = ((winGaryActive || (winGarySide && !corneliusBlocksRally)) && winDice) ? winDice.filter(d => d === 1).length : 0;
  const garyOnesLose = ((loseGaryActive || (loseGarySide && !corneliusOnWinTeam)) && loseDice) ? loseDice.filter(d => d === 1).length : 0;
  // v599 BALANCE BUFF (Wyatt 2026-04-11): Lucky Novice grants +2 Ice Shards per 1 rolled, not +1.
  const garyIceWin = garyOnesWin * 2;
  const garyIceLose = garyOnesLose * 2;
  if (garyOnesWin > 0) {
    const garyWinGhost = winGaryActive ? wF : getSidelineGhost(winTeam, 92);
    collectKC(winTeamName, 'Gary', garyWinGhost);
    const winLoc = winGaryActive ? 'active' : 'sideline';
    log(`<span class="log-ability">Gary</span> (${winLoc}) — Lucky Novice! ${garyOnesWin} rolled 1${garyOnesWin > 1 ? 's' : ''} → +${garyIceWin} Ice Shards!`);
  }
  if (garyOnesLose > 0) {
    const garyLoseGhost = loseGaryActive ? lF : getSidelineGhost(loseTeam, 92);
    collectKC(loseTeamName, 'Gary', garyLoseGhost);
    const loseLoc = loseGaryActive ? 'active' : 'sideline';
    log(`<span class="log-ability">Gary</span> (${loseLoc}) — Lucky Novice! ${garyOnesLose} rolled 1${garyOnesLose > 1 ? 's' : ''} → +${garyIceLose} Ice Shards!`);
  }

  // Bandit Pete (93) — Bandit: while on the sideline, if either player rolls only 2 dice, active ghost gains +3 damage.
  // Frost Valley sideline booster — punishes die-drain builds (Piper, Hugo, Outlaw) by turning a 2-die roll into a damage trigger.
  let banditPeteTriggered = false;
  let banditPeteBaseDmg = 0;
  if (hasSideline(winTeam, 93) && !wF.ko && winDice && loseDice && (winDice.length === 2 || loseDice.length === 2)) {
    if (!corneliusBlocksRally) {
      banditPeteBaseDmg = dmg;
      dmg += 3;
      banditPeteTriggered = true;
      const bpGhost = getSidelineGhost(winTeam, 93);
      collectKC(winTeamName, 'Bandit Pete', bpGhost);
      const bpWho = winDice.length === 2 ? 'Your ghost rolled only 2 dice' : 'Opponent rolled only 2 dice';
      log(`<span class="log-ability">Bandit Pete</span> (sideline) — Bandit! ${bpWho} → +3 damage!`);
    } else { corneliusSidelineBlockedList.push('Bandit Pete'); log(`<span class="log-ability">Cornelius</span> — Antidote! Bandit Pete Bandit blocked.`); }
  }

  // Zach (87) — Craftsman: while on the sideline, Guard Thomas gains +3 damage on Doubles.
  // Frost Valley sideline synergy — specific Guard Thomas / Zach pairing: doubles win + GT active + Zach benched → +3 bonus.
  let zachCraftsmanTriggered = false;
  let zachCraftsmanBaseDmg = 0;
  if (hasSideline(winTeam, 87) && wF.id === 41 && !wF.ko && wR.type === 'doubles') {
    if (!corneliusBlocksRally) {
      zachCraftsmanBaseDmg = dmg;
      dmg += 3;
      zachCraftsmanTriggered = true;
      const zachGhost = getSidelineGhost(winTeam, 87);
      collectKC(winTeamName, 'Zach', zachGhost);
      log(`<span class="log-ability">Zach</span> (sideline) — Craftsman! Guard Thomas doubles → +3 damage!`);
    } else { corneliusSidelineBlockedList.push('Zach'); log(`<span class="log-ability">Cornelius</span> — Antidote! Zach Craftsman blocked.`); }
  }

  // Lou (32) — Bros: while on the sideline, Grawr (id=34) gains +1 Damage and +1 Health on Winning Rolls.
  // Frost Valley common — dedicated Grawr support. Damage bonus computed here; HP grant deferred to onShow in cinematic queue.
  let louBrosTriggered = false;
  let louBrosBaseDmg = 0;
  if (hasSideline(winTeam, 32) && wF.id === 34 && !wF.ko) {
    if (!corneliusBlocksRally) {
      louBrosBaseDmg = dmg;
      dmg += 1;
      louBrosTriggered = true;
      log(`<span class="log-ability">Lou</span> (sideline) — Bros! Grawr wins → +1 damage!`);
    } else { corneliusSidelineBlockedList.push('Lou'); log(`<span class="log-ability">Cornelius</span> — Antidote! Lou Bros blocked.`); }
  }

  // Chip (16) — Acrobatic Dive: even rolled doubles add +3 damage if you deal damage.
  // "Even doubles" = win type is doubles AND the paired value is even (2, 4, or 6) AND dmg > 0.
  // FIX v279: was winDice.every(d => d%2===0) — required ALL dice to be even, so [4,4,3]
  // (double 4s with an odd third die) wrongly failed. Correct check is wR.value % 2 === 0.
  let chipTriggered = false;
  let chipBaseDmg = 0;
  if (wF.id === 16 && !wF.ko && wR.type === 'doubles' && dmg > 0 && wR.value % 2 === 0) {
    chipBaseDmg = dmg;
    dmg += 3;
    chipTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Acrobatic Dive! Even doubles → +3 damage! (${chipBaseDmg} + 3 = ${dmg})`);
  }

  // Yawn Eater (464) — Feast: odd doubles deal +1 damage
  let yawnEaterOddTriggered = false;
  if (wF.id === 464 && !wF.ko && wR.type === 'doubles' && wR.value % 2 === 1 && dmg > 0) {
    const yeBaseDmg = dmg;
    dmg += 1;
    yawnEaterOddTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Feast! Odd doubles → +1 damage! (${yeBaseDmg} + 1 = ${dmg})`);
  }

  // Dealer (37) — House Rules WIN: straight → +3 damage.
  let dealerWinTriggered = false;
  if (wF.id === 37 && !wF.ko && dmg > 0 && winDice && isStraight(winDice)) {
    const dealerWinBase = dmg;
    dmg += 3;
    dealerWinTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — House Rules! Straight [${[...winDice].sort((a,b)=>a-b).join(', ')}] → +3 damage! (${dealerWinBase} + 3 = ${dmg})`);
  }

  // Dark Fang (202) — Pressure: Win: +1 damage per KO'd ghost this game (both teams)
  let deathHowlTriggered = false;
  let deathHowlKOs = 0;
  if (wF.id === 202 && !wF.ko && dmg > 0) {
    deathHowlKOs = [...B.red.ghosts, ...B.blue.ghosts].filter(g => g.ko && !g.isPadded).length;
    if (deathHowlKOs > 0) {
      const dhBaseDmg = dmg;
      dmg += deathHowlKOs;
      deathHowlTriggered = true;
      collectKC(winTeamName, wF.name);
      log(`<span class="log-ability">${wF.name}</span> — Pressure! ${deathHowlKOs} KO'd ghost${deathHowlKOs > 1 ? 's' : ''} → +${deathHowlKOs} damage! (${dhBaseDmg} + ${deathHowlKOs} = ${dmg})`);
    }
  }

  // Wanderer (4) — Curiosity: roll a straight (consecutive, no repeats) → +2 damage.
  let wandererTriggered = false;
  if (wF.id === 4 && !wF.ko && dmg > 0 && winDice && isStraight(winDice)) {
    const wandererBaseDmg = dmg;
    dmg += 2;
    wandererTriggered = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Curiosity! Straight [${[...winDice].sort((a,b)=>a-b).join(', ')}] → +2 damage! (${wandererBaseDmg} + 2 = ${dmg})`);
  }

  // Ancient Librarian (3) — Knowledge: for each 2 rolled by BOTH players combined, add +1 damage (only if winning ghost deals damage).
  // Set 1 common — both teams' dice count, so high-die-count opponents ironically fuel the bonus. Pure damage engine.
  let librarianTriggered = false;
  let librarianBaseDmg = 0;
  let librarianTwos = 0;
  if (wF.id === 3 && !wF.ko && dmg > 0 && winDice && loseDice) {
    librarianTwos = [...winDice, ...loseDice].filter(d => d === 2).length;
    if (librarianTwos > 0) {
      librarianBaseDmg = dmg;
      dmg += librarianTwos;
      librarianTriggered = true;
      collectKC(winTeamName, wF.name);
      log(`<span class="log-ability">${wF.name}</span> — Knowledge! ${librarianTwos} two${librarianTwos > 1 ? 's' : ''} rolled (both teams) → +${librarianTwos} damage!`);
    }
  }

  // Sparky (64) — Tinder: each rolled 1 adds +3 damage, but only if Sparky wins and damage > 0 (the 1s "ignite").
  // Set 1 rare damage multiplier — rewards low-die faces (1s are usually the worst roll, now lethal).
  let sparkyTriggered = false;
  let sparkyBaseDmg = 0;
  let sparkyOneCount = 0;
  if (wF.id === 64 && !wF.ko && dmg > 0 && winDice) {
    sparkyOneCount = winDice.filter(d => d === 1).length;
    if (sparkyOneCount > 0) {
      sparkyBaseDmg = dmg;
      dmg += sparkyOneCount * 3;
      sparkyTriggered = true;
      collectKC(winTeamName, wF.name);
      log(`<span class="log-ability">${wF.name}</span> — Tinder! ${sparkyOneCount} rolled 1${sparkyOneCount > 1 ? 's' : ''} × 3 = +${sparkyOneCount * 3} damage!`);
    }
  }

  // Splinter (101) — Toxic Fumes: first win activates fumes; 1 pre-roll chip damage every subsequent round
  let splinterJustActivated = false;
  if (wF.id === 101 && !wF.ko && B.splinterActivated && !B.splinterActivated[winTeamName]) {
    B.splinterActivated[winTeamName] = true;
    splinterJustActivated = true;
    log(`<span class="log-ability">${wF.name}</span> — Toxic Fumes! Activated — 1 pre-roll damage every round from here on.`);
  }

  // Kodako (1) — Swift WIN case: rolling 1-2-3 (all three values present) while winning → deal exactly 4 damage (overrides all modifiers)
  let kodakoSwiftWin = false;
  if (wF.id === 1 && !wF.ko && winDice && [1,2,3].every(v => winDice.includes(v))) {
    dmg = 4;
    kodakoSwiftWin = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Swift! 1-2-3 combo → exactly 4 damage!`);
  }

  // Guard Thomas (41) — Stoic: while Guard Thomas has less than 6 HP, singles rolls deal 0 damage to him.
  // Defensive immunity — no stat change needed, just zero out dmg and flag it.
  let guardThomasStoic = false;
  if (lF.id === 41 && !lF.ko && lF.hp < 6 && wR.type === 'singles' && dmg > 0 && !cameronUnnegatable) {
    guardThomasStoic = true;
    dmg = 0;
    log(`<span class="log-ability">${lF.name}</span> — Stoic! Below 6 HP — immune to singles! ${wF.name}'s singles roll blocked!`);
  }

  // Bogey (53) — Bogus: REACTIVE reflect — player sees incoming damage and chooses whether to bounce it.
  // v430: Sylvia re-entry pattern. First pass: open modal with live damage preview, return early.
  // Second pass (bogeyReflectResuming): read choice and either zero dmg + mark used, or fall through.
  // Fires after guardThomasStoic — Stoic may have zeroed dmg, Bogus only triggers on real damage.
  let bogeyReflected = false;
  let bogeyReflectDmg = 0;
  let bogeyHpAfter = 0;
  const bogeyReflectResuming = !!B.bogeyReflectResuming;
  B.bogeyReflectResuming = false;
  if (lF.id === 53 && !lF.ko && B.bogeyUsed && !B.bogeyUsed[loseTeamName] && dmg > 0 && !cameronUnnegatable) {
    if (!bogeyReflectResuming && !B.bogeyReflectChoice) {
      // First pass — pause resolveRound, open modal with live damage preview
      B.bogeyReflectPending = { loseTeamName, dmg };
      const subEl = document.getElementById('bogeyReflectSub');
      if (subEl) subEl.innerHTML =
        `<b>${wF.name}</b> hits <b>${lF.name}</b> for <b>${dmg}</b> damage. Reflect it back?` +
        `<br><i>(Once per game — save it for a bigger hit?)</i>`;
      document.getElementById('bogeyOverlay').classList.add('active');
      return; // pause — doBogeyReflectChoice() will re-enter resolveRound
    }
    // Second pass — read choice and clear pending state
    const bogeyChoice = B.bogeyReflectChoice;
    B.bogeyReflectChoice = null;
    B.bogeyReflectPending = null;
    if (bogeyChoice === 'yes') {
      bogeyReflectDmg = dmg;
      dmg = 0; // Bogey takes nothing — all damage bounces back
      bogeyReflected = true;
      B.bogeyUsed[loseTeamName] = true;   // once per game — never offered again
      collectKC(loseTeamName, lF.name, lF);
      log(`<span class="log-ability">${lF.name}</span> — Bogus! ${bogeyReflectDmg} damage reflected back to ${wF.name}!`);
    }
    // bogeyChoice === 'no': dmg falls through unchanged, bogeyUsed stays false (reflect preserved)
  }

  // Kodako (1) — Swift LOSE case: rolling 1-2-3 while losing → negate all incoming damage, deal 4 back to winner
  let kodakoSwiftLose = false;
  if (lF.id === 1 && !lF.ko && loseDice && [1,2,3].every(v => loseDice.includes(v)) && dmg > 0 && !cameronUnnegatable) {
    dmg = 0; // Kodako takes nothing — Swift counters the hit
    kodakoSwiftLose = true;
    collectKC(loseTeamName, lF.name);
    log(`<span class="log-ability">${lF.name}</span> — Swift! 1-2-3 while losing → negate damage, deal 4 back to ${wF.name}!`);
  }

  // Patrick (10) — Stone Form: losing to a singles roll negates all incoming damage and deals 3 counter-damage back to the winner.
  // Fires after Kodako Swift Lose — if Swift already zeroed dmg, Patrick won't double-trigger on the same hit.
  let patrickStoneForm = false;
  const patrickStoneDmg = 3;
  let stoneFormHpAfter = 0;
  if (lF.id === 10 && !lF.ko && wR.type === 'singles' && dmg > 0 && !cameronUnnegatable) {
    dmg = 0; // Patrick takes nothing — Stone Form counters singles
    patrickStoneForm = true;
    collectKC(loseTeamName, lF.name);
    log(`<span class="log-ability">${lF.name}</span> — Stone Form! Singles roll negated — dealing 3 back to ${wF.name}!`);
  }

  // Dealer (37) — House Rules LOSE: straight (consecutive, no repeats) → negate all incoming damage.
  let dealerHouseRules = false;
  if (lF.id === 37 && !lF.ko && dmg > 0 && loseDice && loseDice.length >= 2 && !cameronUnnegatable && isStraight(loseDice)) {
    dmg = 0;
    dealerHouseRules = true;
    collectKC(loseTeamName, lF.name);
    log(`<span class="log-ability">${lF.name}</span> — House Rules! Straight [${[...loseDice].sort((a,b)=>a-b).join(', ')}] — ${wF.name}'s attack negated!`);
  }

  // Sky (72) — Elusive: if incoming damage is greater than 2, negate it and deal counter die damage.
  // Counter die is pre-computed; KO flag set synchronously; HP mutation deferred to modal.
  let skyElusive = false;
  let skyElusiveBlockedDmg = 0;
  if (lF.id === 72 && !lF.ko && dmg > 2 && !cameronUnnegatable) {
    skyElusiveBlockedDmg = dmg;
    dmg = 0;
    skyElusive = true;
    const skyCounterDie = Math.floor(Math.random() * 6) + 1;
    const skyCounterHp = Math.max(0, wF.hp - skyCounterDie);
    if (skyCounterHp <= 0) { wF.ko = true; wF.killedBy = 72; }
    B.skyElusivePending = {
      counterDie: skyCounterDie,
      wFName: wF.name,
      lFName: lF.name,
      winTeamName: winTeamName
    };
    collectKC(loseTeamName, lF.name);
    log(`<span class="log-ability">${lF.name}</span> — Elusive! ${skyElusiveBlockedDmg} incoming damage > 2 — ${wF.name}'s hit negated! Counter die pending.`);
  }

  // City Cyboo (77) — Barrier: takes no damage from enemy doubles.
  // A 1 HP doubles-immune defender — the win roll type must be 'doubles' for Barrier to trigger.
  let cityCybooBarrier = false;
  let cityCybooBlockedDmg = 0;
  if (lF.id === 77 && !lF.ko && wR.type === 'doubles' && dmg > 0 && !cameronUnnegatable) {
    cityCybooBlockedDmg = dmg;
    dmg = 0;
    cityCybooBarrier = true;
    collectKC(loseTeamName, lF.name);
    log(`<span class="log-ability">${lF.name}</span> — Barrier! Enemy doubles blocked! ${cityCybooBlockedDmg} damage negated!`);
  }

  // Puff (5) — Cute: enemy doubles and triples deal -1 damage (minimum 0).
  // Partial reduction, NOT full negation — Cute is not a negation (Cameron Unstoppable Force doesn't interact with it).
  let puffCute = false;
  let puffCuteOriginalDmg = 0;
  if (lF.id === 5 && !lF.ko && (wR.type === 'doubles' || wR.type === 'triples') && dmg > 0) {
    puffCuteOriginalDmg = dmg;
    dmg = Math.max(0, dmg - 1);
    puffCute = true;
    collectKC(loseTeamName, lF.name);
    log(`<span class="log-ability">${lF.name}</span> — Cute! ${wR.type} roll softened — ${puffCuteOriginalDmg} → ${dmg} damage!`);
  }

  // King Jay (106) — Reflection: lose the roll & loser's dice total = 7 → reflect all damage back to winner
  // Fires after Sylvia (both can't be active at the same time, but ordering is: Sylvia negates first, then Jay reflects what's left)
  let kingJayReflected = false;
  let kingJayReflectDmg = 0;
  let kingJayHpAfter = 0;
  if (lF.id === 106 && !lF.ko && dmg > 0 && loseDice && loseDice.reduce((a, b) => a + b, 0) === 7 && !cameronUnnegatable) {
    kingJayReflectDmg = dmg;
    dmg = 0; // loser takes nothing — all damage goes back
    kingJayReflected = true;
    collectKC(loseTeamName, lF.name);
    log(`<span class="log-ability">${lF.name}</span> — Reflection! Dice total = 7! ${kingJayReflectDmg} damage reflected back to ${wF.name}!`);
  }

  // Gus (31) — Gale Force: reactive post-win timed button.
  // Defers damage — player decides in drain chain whether to force swap or deal damage.
  // Detects BEFORE Guardian Fairy so winner gets first choice.
  let galeForceSwap = false;
  let galeForceSLIdx = -1;
  let galeForceDmg = 0;
  let gusGaleReactiveTriggered = false;
  if (wF.id === 31 && !wF.ko && dmg > 0) {
    galeForceSLIdx = loseTeam.ghosts.findIndex((g, i) => i !== loseTeam.activeIdx && !g.ko);
    if (galeForceSLIdx >= 0) {
      gusGaleReactiveTriggered = true;
      galeForceDmg = dmg; // stash original damage for swap picker or decline
      dmg = 0; // defer ALL damage — reactive handler will apply or swap
      // Set up reactive pending (resume set later in drain chain)
      B.gusGaleReactivePending = {
        winTeamName, loseTeamName, dmg: galeForceDmg, wF, lF,
        resume: null // set in drain chain
      };
    }
  }

  // Guardian Fairy (99) — Wish: REACTIVE — if losing team has GF on sideline and damage > 0,
  // defer damage application and show a modal letting the player choose to swap GF in.
  // GF intercepts BEFORE damage is applied to lF. (Gus Gale Force takes priority if both trigger.)
  let guardianFairyAbsorbed = false;
  let guardianFairyAbsorbedDmg = 0;
  let guardianFairyKOd = false;
  let gfSacrifice = null;
  let gfHpAfter = 0;
  let guardianFairyReactiveTriggered = false;
  if (!kingJayReflected && dmg > 0) {
    const gfG = getSidelineGhost(loseTeam, 99);
    if (gfG && !gfG.ko) {
      // Store pending state — damage deferred to modal handler
      guardianFairyReactiveTriggered = true;
      gfSacrifice = gfG;
      guardianFairyAbsorbedDmg = dmg;
      B.guardianFairyReactivePending = {
        loseTeamName, gfGhost: gfG, dmg, lF, wFName: wF.name, wFId: (wF.originalId || wF.id),
        resume: null // set later during drain
      };
      dmg = 0; // defer ALL damage — modal handler will apply it
      guardianFairyAbsorbed = true; // flag so "0 damage" log doesn't fire
    }
  }

  // Fang Undercover (7) — Skilled Coward: armed → negate all incoming damage, trigger post-round swap
  // Fires after Guardian Fairy (GF takes priority if both are in play; Fang Undercover fires only if GF didn't absorb)
  let fangUndercoverActivated = false;
  if (!kingJayReflected && !guardianFairyAbsorbed && !cameronUnnegatable &&
      lF.id === 7 && !lF.ko && B.fangUndercoverArmed && B.fangUndercoverArmed[loseTeamName] && dmg > 0) {
    B.fangUndercoverArmed[loseTeamName] = false; // consume the arm
    fangUndercoverActivated = true;
    B.fangUndercoverSwapPending = loseTeamName; // signal drain callback to show ghost-picker
    dmg = 0; // Fang takes no damage — dodge activated
    collectKC(loseTeamName, lF.name);
    log(`<span class="log-ability">${lF.name}</span> — Skilled Coward! Dodge activated! Fang will swap to the sideline!`);
  }
  if (B.fangUndercoverArmed) { B.fangUndercoverArmed[loseTeamName] = false; B.fangUndercoverArmed[winTeamName] = false; } // clear any unused arm

  // --- Mirror Matt (410) — Seven Years: doubles ONLY damage reflected to winner ---
  let mirrorMattReflected = false;
  let mirrorMattReflectDmg = 0;
  if (lF.id === 410 && !lF.ko && dmg > 0 && wR.type === 'doubles') {
    mirrorMattReflectDmg = dmg;
    wF.hp = Math.max(0, wF.hp - dmg);
    if (wF.hp <= 0) { wF.ko = true; wF.killedBy = 410; }
    dmg = 0; // Mirror Matt takes nothing
    mirrorMattReflected = true;
    collectKC(loseTeamName, lF.name);
    log(`<span class="log-ability">${lF.name}</span> — SEVEN YEARS! ${wR.type} reflected! <span class="log-dmg">${mirrorMattReflectDmg} damage bounced to ${wF.name}!</span> ${wF.ko?'<span class="log-ko">KO!</span>':wF.hp+' HP left'}`);
  }

  // Garrick (427) — Watchfire: Lose: -1 damage (damage reduction)
  if (lF.id === 427 && !lF.ko && dmg > 0) {
    dmg = Math.max(0, dmg - 1);
    log(`<span class="log-ability">${lF.name}</span> — Watchfire! Absorbs 1 damage. (${dmg > 0 ? dmg + ' damage remaining' : 'All damage absorbed!'})`);
  }

  // Gordok (430) — River Terror: Win: you MAY steal 2 resources instead of dealing damage (player choice)
  let gordokStole = false;
  if (wF.id === 430 && !wF.ko && dmg > 0) {
    const gordokOppRes = loseTeam.resources;
    const gordokResTypes = ['ice', 'fire', 'surge', 'luckyStone', 'moonstone', 'healingSeed'];
    const gordokTotalRes = gordokResTypes.reduce((sum, r) => sum + (gordokOppRes[r] || 0), 0);
    if (gordokTotalRes > 0) {
      if (autoPlayRunning) {
        // AI auto-picks: always steal
        let gordokStolen = 0;
        const gordokStolenList = [];
        for (let i = 0; i < 2 && gordokStolen < 2; i++) {
          const avail = gordokResTypes.filter(r => (gordokOppRes[r] || 0) > 0);
          if (avail.length === 0) break;
          const pick = avail[Math.floor(Math.random() * avail.length)];
          gordokOppRes[pick]--;
          winTeam.resources[pick] = (winTeam.resources[pick] || 0) + 1;
          gordokStolenList.push(pick);
          gordokStolen++;
        }
        dmg = 0;
        gordokStole = true;
        if (!B.gordokDieBonus) B.gordokDieBonus = { red: 0, blue: 0 };
        B.gordokDieBonus[winTeamName] = 1;
        winTeam.resources.moonstone++;
        collectKC(winTeamName, wF.name);
        log(`<span class="log-ability">${wF.name}</span> — River Terror! Stole ${gordokStolenList.join(', ')} instead of dealing damage! <span class="log-ice">+1 die next roll!</span> <span class="log-ms">+1 Moonstone!</span>`);
      } else {
        // Human player: defer to modal choice
        B.gordokPending = { winTeam, winTeamName, loseTeam, lF, wF, dmg, resume: null };
        dmg = 0; // defer damage — modal handler will apply
        gordokStole = true; // flag so "0 damage" log doesn't fire
      }
    }
  }

  // Pal Al (431) — Squall: Win: you MAY gain 4 Ice Shards instead of dealing damage (player choice)
  let wiseAlSqualled = false;
  if (wF.id === 431 && !wF.ko && dmg > 0) {
    if (autoPlayRunning) {
      // AI auto-picks: take ice if < 6
      const wiseAlIce = winTeam.resources.ice || 0;
      if (wiseAlIce < 6) {
        winTeam.resources.ice = (winTeam.resources.ice || 0) + 4;
        dmg = 0;
        wiseAlSqualled = true;
        collectKC(winTeamName, wF.name);
        log(`<span class="log-ability">${wF.name}</span> — Squall! <span class="log-ice">+4 Ice Shards</span> instead of dealing damage!`);
      }
    } else {
      // Human player: defer to modal choice
      B.wiseAlPending = { winTeam, winTeamName, loseTeam, lF, wF, dmg, resume: null };
      dmg = 0; // defer damage — modal handler will apply
      wiseAlSqualled = true; // flag so "0 damage" log doesn't fire
    }
  }

  // Sophia (457) — Masquerade: Win: you MAY gain Mask of Day or Mask of Night instead of dealing damage (once per game)
  let sophiaMasqueraded = false;
  if (wF.id === 457 && !wF.ko && dmg > 0 && !B.sophiaMask[winTeamName]) {
    if (autoPlayRunning) {
      // AI auto-picks: take Mask of Night (anti-dice is stronger for AI)
      B.sophiaMask[winTeamName] = 'night';
      B.sophiaMaskActive[winTeamName] = true;
      dmg = 0;
      sophiaMasqueraded = true;
      collectKC(winTeamName, wF.name);
      log(`<span class="log-ability">${wF.name}</span> — Masquerade! Gained <b>🌙 Mask of Night</b> instead of dealing damage! (Roll the same number of dice as the enemy ghost, +1 damage)`);
    } else {
      // Human player: defer to modal choice
      B.sophiaPending = { winTeam, winTeamName, loseTeam, lF, wF, dmg, resume: null };
      dmg = 0;
      sophiaMasqueraded = true;
    }
  }

  // --- APPLY DAMAGE (game state updates immediately) ---
  const winColor = winTeamName === 'red' ? 'red-text' : 'blue-text';
  const loseColor = winTeamName === 'red' ? 'blue-text' : 'red-text';
  if (dmg > 0) {
    lF.hp = Math.max(0, lF.hp - dmg);
    if (lF.hp <= 0) { lF.ko = true; lF.killedBy = (wF.originalId || wF.id); }
    log(`<span class="log-dmg">${wF.name} deals ${dmg} to ${lF.name}!</span> ${lF.ko?'<span class="log-ko">KO!</span>':lF.hp+' HP left'}`);
    // Boss mode: drain shared HP pool when damage is dealt to the boss team
    if (window.BOSS_MODE && loseTeamName === 'blue' && typeof bossDamageTracker === 'function') {
      bossDamageTracker(dmg, lF);
    }

  // Resolve deferred Heavy Air hits — only if Knight Terror survived this round's damage
  if (pendingHeavyAirHits.length > 0) {
    // lF is the loser; check if Knight Terror (401) is on the losing side and got KO'd
    const knightSurvived = !lF.ko || lF.id !== 401;
    // Also check if Knight Terror is on the winning side (he could be the winner's opponent's active)
    const oppKnight = active(B[loseTeamName]);
    const knightOnLosingTeamKOd = oppKnight && oppKnight.id === 401 && oppKnight.ko;
    if (!knightOnLosingTeamKOd) {
      // Knight Terror survived — apply all deferred Heavy Air damage
      for (const hit of pendingHeavyAirHits) {
        if (!hit.target.ko) {
          hit.target.hp = Math.max(0, hit.target.hp - 2);
          if (hit.target.hp <= 0) { hit.target.ko = true; hit.target.killedBy = 401; }
          log(`<span class="log-ability">Knight Terror</span> — Heavy Air! <span class="log-dmg">${hit.targetName} loses 2 HP!</span> ${hit.target.ko ? '<span class="log-ko">KO!</span>' : hit.target.hp + ' HP left'}`);
        }
      }
    } else {
      // Knight Terror was KO'd — discard all Heavy Air hits and callouts
      const heavyAirCalloutCount = pendingHeavyAirHits.length;
      // Remove the queued HEAVY AIR! callouts from resolveKnightCallouts
      for (let i = resolveKnightCallouts.length - 1; i >= 0; i--) {
        if (resolveKnightCallouts[i].name === 'HEAVY AIR!') resolveKnightCallouts.splice(i, 1);
      }
    }
    pendingHeavyAirHits.length = 0;
  }
  } else if (!mirrorMattReflected && !gordokStole && !wiseAlSqualled && !kingJayReflected && !guardianFairyAbsorbed && !bogeyReflected && !kodakoSwiftLose && !patrickStoneForm && !dealerHouseRules && !skyElusive && !cityCybooBarrier && !puffCute && !fangUndercoverActivated) {
    log(`${wF.name} wins but deals 0 damage.`);
  }

  // Jasper (428) — Flame Dive: Win: interactive bonus die reveal (Balatron-style)
  // HP visual deferred to showJasperModal → finishJasperRoll.
  // KO flag set synchronously so downstream checks (Balatron Party Time, Cameron, etc.)
  // see the correct alive/dead state immediately.
  let jasperTriggered = false;
  let jasperBonusDie = 0;
  if (wF.id === 428 && !wF.ko) {
    jasperBonusDie = Math.floor(Math.random() * 6) + 1;
    jasperTriggered = true;
    collectKC(winTeamName, wF.name);
    // Synchronous KO check — Flame Dive bonus damage to loser
    const jasperLFHpAfter = Math.max(0, lF.hp - jasperBonusDie);
    if (jasperLFHpAfter <= 0 && !lF.ko) { lF.ko = true; lF.killedBy = 428; }
    // Synchronous self-damage check — Jasper takes 1 recoil
    const jasperSelfHpAfter = Math.max(0, wF.hp - 1);
    if (jasperSelfHpAfter <= 0) { wF.ko = true; wF.killedBy = -1; }
    // Stash for modal — HP visual mutations deferred to finishJasperRoll
    B.jasperPending = {
      bonusDie: jasperBonusDie,
      wFName: wF.name,
      lFName: lF.name,
      winTeamName: winTeamName
    };
  }

  // Mirror Matt (410) — Seven Years reflected damage callout (deferred to cinematic)
  // HP already applied synchronously above, callout queued later in ability queue section.

  // King Jay reflected damage — applies to the winner
  // wF.hp deferred to onShow so HP bar updates when REFLECTION! callout fires, not silently during beat 4.
  // wF.ko is set synchronously here so Cameron (25) Force of Nature check immediately below sees the correct KO state.
  if (kingJayReflected && kingJayReflectDmg > 0) {
    kingJayHpAfter = Math.max(0, wF.hp - kingJayReflectDmg);
    if (kingJayHpAfter <= 0) { wF.ko = true; wF.killedBy = lF.id; }
    log(`<span class="log-dmg">${lF.name} reflects ${kingJayReflectDmg} back! ${wF.name} takes the hit!</span> ${wF.ko?'<span class="log-ko">KO!</span>':kingJayHpAfter+' HP left'}`);
  }

  // Bogey reflected damage — applies to the winner (lF takes 0; wF eats the full hit)
  // wF.hp deferred to onShow so HP bar updates when BOGUS! callout fires, not silently during beat 4.
  // wF.ko is set synchronously so Cameron (25) Force of Nature check immediately below sees the correct KO state.
  if (bogeyReflected && bogeyReflectDmg > 0) {
    bogeyHpAfter = Math.max(0, wF.hp - bogeyReflectDmg);
    if (bogeyHpAfter <= 0) { wF.ko = true; wF.killedBy = lF.id; }
    log(`<span class="log-dmg">${lF.name} — BOGUS! ${bogeyReflectDmg} damage bounced back to ${wF.name}!</span> ${wF.ko?'<span class="log-ko">KO!</span>':bogeyHpAfter+' HP left'}`);
  }

  // Kodako (1) — Swift lose counter: 4 damage dealt back to the winner
  // wF.hp deferred to onShow so HP bar updates when SWIFT! callout fires, not silently during beat 4.
  // wF.ko is set synchronously here so Cameron (25) Force of Nature check immediately below sees the correct KO state.
  let swiftLoseHpAfter = 0;
  if (kodakoSwiftLose) {
    swiftLoseHpAfter = Math.max(0, wF.hp - 4);
    if (swiftLoseHpAfter <= 0) { wF.ko = true; wF.killedBy = lF.id; }
    log(`<span class="log-dmg">${lF.name} — Swift counter! 4 damage to ${wF.name}!</span> ${wF.ko?'<span class="log-ko">KO!</span>':swiftLoseHpAfter+' HP left'}`);
  }

  // Patrick (10) — Stone Form counter: 3 damage dealt back to the winner for throwing a singles roll
  // wF.hp deferred to onShow so HP bar updates when STONE FORM! callout fires, not silently during beat 4.
  // wF.ko is set synchronously here so Cameron (25) Force of Nature check at line ~8814 sees the correct KO state.
  if (patrickStoneForm) {
    stoneFormHpAfter = Math.max(0, wF.hp - patrickStoneDmg);
    if (stoneFormHpAfter <= 0) { wF.ko = true; wF.killedBy = lF.id; }
    log(`<span class="log-dmg">${lF.name} — Stone Form counter! ${patrickStoneDmg} damage to ${wF.name}!</span> ${wF.ko?'<span class="log-ko">KO!</span>':stoneFormHpAfter+' HP left'}`);
  }

  // Cameron (25) — Unstoppable Force: damage cannot be negated (cameronUnnegatable flag set above,
  // all negation checks already guarded). Log a callout if Cameron wins and dealt damage.
  let cameronUnstoppableLogged = false;
  if (cameronUnnegatable && !wF.ko && dmg > 0) {
    cameronUnstoppableLogged = true;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Unstoppable Force! Damage cannot be negated!`);
  }

  // Pudge self-damage (game state — HP mutation deferred to BELLY FLOP! onShow)
  // pudgeSelfDmgApplied tracks that damage landed so the visual fires even on a fatal hit —
  // without it, wF.ko=true from the fatal self-hit causes the animation to be silently skipped.
  let pudgeSelfDmgApplied = false;
  let pudgeHpAfter = 0;
  if (pudgeSelfDmg && !wF.ko) {
    pudgeHpAfter = Math.max(0, wF.hp - 1); // compute only — HP bar deferred to onShow
    if (pudgeHpAfter <= 0) { wF.ko = true; wF.killedBy = -1; } // ko flag synchronous (Cameron check); killedBy=-1 = self-inflicted (Belly Flop), so no kill credit goes to the loser
    pudgeSelfDmgApplied = true;
    log(`<span class="log-dmg">${wF.name} takes 1 self-damage from Belly Flop!</span> ${wF.ko?'<span class="log-ko">KO!</span>':pudgeHpAfter+' HP left'}`);
  }

  // Prince Balatron (113) — Party Time: lose & survive → player rolls 1 counter die
  // Counter fires even if wF is not KO'd by the main roll — Balatron always fights back when alive.
  // The counter die is pre-computed here (so wF.ko/Cameron cascade stays accurate) but the
  // reveal + HP mutation + log are deferred to showBalatronModal → finishBalatronRoll so the
  // player gets the dramatic click-to-roll moment. See function block near showSylviaModal.
  let balatronCounterDie = 0;
  let balatronHpAfter = 0;
  let balatronTriggered = false;
  if (lF.id === 113 && !lF.ko && !wF.ko) {
    balatronCounterDie = Math.floor(Math.random() * 6) + 1;
    balatronHpAfter = Math.max(0, wF.hp - balatronCounterDie); // compute only — HP bar deferred to modal
    const willKo = balatronHpAfter <= 0;
    if (willKo) { wF.ko = true; wF.killedBy = lF.id; } // ko flag synchronous (Cameron check)
    balatronTriggered = true;
    collectKC(loseTeamName, lF.name);
    // Stash everything the modal will need. Log is deferred to finishBalatronRoll so the
    // combat log doesn't spoil the reveal before the player clicks the roll button.
    B.balatronPending = {
      counterDie: balatronCounterDie,
      hpAfter: balatronHpAfter,
      wasKo: willKo,
      lFName: lF.name,
      wFName: wF.name,
      loseTeamName: loseTeamName
    };
  }

  // Bubble Boys (44) — Pop: if the opposing ghost rolled triples, Bubble Boys are instantly defeated.
  // Two cases: (1) BB lost and enemy winner rolled triples; (2) BB won but losing roll was also triples.
  let bubbleBoysPopped = false;
  let bubbleBoysName = '';
  let bubbleBoysEnemyName = '';
  // Case 1: Bubble Boys lost, enemy winner rolled triples
  if (lF.id === 44 && !lF.ko && wR.type === 'triples') {
    lF.hp = 0;
    lF.ko = true;
    lF.killedBy = (wF.originalId || wF.id);
    bubbleBoysPopped = true;
    bubbleBoysName = lF.name;
    bubbleBoysEnemyName = wF.name;
    collectKC(loseTeamName, lF.name);
    log(`<span class="log-ability">${lF.name}</span> — Pop! ${wF.name} rolled triples — Bubble Boys burst!`);
  }
  // Case 2: Bubble Boys won, but the losing roll was also triples (enemy still activated Pop)
  if (wF.id === 44 && !wF.ko && lR.type === 'triples') {
    wF.hp = 0;
    wF.ko = true;
    wF.killedBy = lF.id;
    bubbleBoysPopped = true;
    bubbleBoysName = wF.name;
    bubbleBoysEnemyName = lF.name;
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Pop! ${lF.name} rolled triples — Bubble Boys burst even in victory!`);
  }

  // Night Master (103) — Bullseye: win with doubles → destroy an enemy sideline ghost that has < 4 HP
  // Snipes the first eligible target (lowest index). KO applied now; callout fires via queue.
  let bullseyeTarget = null;
  if (wF.id === 103 && !wF.ko && wR.type === 'doubles') {
    const loseActiveIdx = loseTeam.activeIdx;
    const bsCandidate = loseTeam.ghosts.find((g, i) => i !== loseActiveIdx && !g.ko && g.hp < 4);
    if (bsCandidate) {
      bullseyeTarget = { ghost: bsCandidate, priorHp: bsCandidate.hp };
      bsCandidate.hp = 0;
      bsCandidate.ko = true;
      bsCandidate.killedBy = 103;
      collectKC(winTeamName, wF.name);
      log(`<span class="log-ability">${wF.name}</span> — Bullseye! ${bsCandidate.name} (${bullseyeTarget.priorHp} HP) sniped from the enemy sideline!`);
    }
  }

  // Slicer (460) — Parting Gift: Sideline & In Play — win with quads+ → destroy any enemy sideline ghost
  // Auto-picks highest-HP target (most impactful). No HP restriction unlike Night Master.
  let slicerTarget = null;
  const slicerActive = wF.id === 460 && !wF.ko;
  const slicerSideline = hasSideline(winTeam, 460);
  if ((slicerActive || slicerSideline) && (wR.type === 'quads' || wR.type === 'penta' || wR.type.endsWith('-of-a-kind'))) {
    const loseActiveIdx = loseTeam.activeIdx;
    const slicerCandidates = loseTeam.ghosts.filter((g, i) => i !== loseActiveIdx && !g.ko);
    if (slicerCandidates.length > 0) {
      const best = slicerCandidates.reduce((a, b) => b.hp > a.hp ? b : a);
      slicerTarget = { ghost: best, priorHp: best.hp };
      best.hp = 0;
      best.ko = true;
      best.killedBy = 460;
      const slicerGhost = slicerActive ? wF : getSidelineGhost(winTeam, 460);
      const slicerLabel = slicerSideline && !slicerActive ? `${slicerGhost.name} (sideline)` : slicerGhost.name;
      collectKC(winTeamName, slicerLabel);
      log(`<span class="log-ability">${slicerLabel}</span> — Parting Gift! ${best.name} (${slicerTarget.priorHp} HP) destroyed from the enemy sideline!`);
    }
  }

  // Flora (75) — Restore: rolling doubles (win OR lose) heals +2 HP. Fires after damage is applied.
  // Win case: Flora won with doubles — heal her after lF took damage.
  // Lose case: Flora lost but rolled doubles and survived — heal even in defeat.
  // Mr Filbert (59) — Mask Merchant: if Filbert is on the enemy sideline, the +2 heal flips to -2 damage.
  // HP mutation deferred to onShow so the bar jumps exactly when RESTORE!/MASK MERCHANT! flashes.
  let floraRestored = false;
  let floraRestoredName = '';
  let floraRestoredHp = 0;
  let floraFlipped = false;
  let floraFlippedName = '';
  let floraFlippedFrom = 0;
  let floraFlippedTo = 0;
  let floraGhost = null; // captured reference for onShow callback
  if (wF.id === 75 && !wF.ko && wR.type === 'doubles') {
    const flBefore = wF.hp;
    floraGhost = wF;
    if (filbertCursesWin) {
      floraFlippedTo = Math.max(0, wF.hp - 2); // compute only — defer mutation to onShow
      if (floraFlippedTo <= 0) { wF.ko = true; wF.killedBy = 59; } // KO flag synchronous (Cameron check)
      floraFlipped = true; floraFlippedName = wF.name; floraFlippedFrom = flBefore;
      collectKC(winTeamName, wF.name);
      log(`<span class="log-ability">${wF.name}</span> — Restore! Mr Filbert curses it → -2 HP! (${flBefore} → ${floraFlippedTo})`);
    } else {
      floraRestoredHp = wF.hp + 2; // compute only — defer mutation to onShow
      floraRestoredName = wF.name; floraRestored = true;
      collectKC(winTeamName, wF.name);
      log(`<span class="log-ability">${wF.name}</span> — Restore! Doubles win → +2 HP! (${flBefore} → ${floraRestoredHp}/${wF.maxHp}${floraRestoredHp > wF.maxHp ? ' overclocked!' : ''})`);
    }
  }
  if (lF.id === 75 && !lF.ko && lR.type === 'doubles') {
    const flBefore = lF.hp;
    floraGhost = lF;
    if (filbertCursesLose) {
      floraFlippedTo = Math.max(0, lF.hp - 2); // compute only — defer mutation to onShow
      if (floraFlippedTo <= 0) { lF.ko = true; lF.killedBy = 59; } // KO flag synchronous
      floraFlipped = true; floraFlippedName = lF.name; floraFlippedFrom = flBefore;
      collectKC(loseTeamName, lF.name);
      log(`<span class="log-ability">${lF.name}</span> — Restore! Mr Filbert curses it → -2 HP! (${flBefore} → ${floraFlippedTo})`);
    } else {
      floraRestoredHp = lF.hp + 2; // compute only — defer mutation to onShow
      floraRestoredName = lF.name; floraRestored = true;
      collectKC(loseTeamName, lF.name);
      log(`<span class="log-ability">${lF.name}</span> — Restore! Rolled doubles → +2 HP even in defeat! (${flBefore} → ${floraRestoredHp}/${lF.maxHp}${floraRestoredHp > lF.maxHp ? ' overclocked!' : ''})`);
    }
  }

  // Simon (24) — Brew Time: REMOVED from post-roll damage. Only triggers on before-the-roll effects
  // (Swarm, Haunt, Toxic Fumes, Blue Fire/Meteor, Princess Shade Bounty, Shade's Shadow).
  // Pre-roll triggers live in doPreRollSetup(). No post-roll Sacred Fire generation.
  let simonBrewTriggered = false;

  // Sad Sal (29) — Tough Job: losing ANY roll grants +1 Ice Shard (no dmg guard — triggers even on 0 damage)
  // Boobattles ref: "loser.ability === 'Tough Job' → iceShards += 1" — loss condition only, no HP threshold.
  let sadSalTriggered = false;
  if (lF.id === 29) {
    sadSalTriggered = true;
    collectKC(loseTeamName, lF.name);
    log(`<span class="log-ability">${lF.name}</span> — Tough Job! Lost the roll → +1 Ice Shard!`);
  }

  // Hugo (52) — Wreckage: when Hugo takes real roll damage, the attacker loses 1 die next roll
  // Fires even if Hugo is KO'd — attacking Hugo costs you regardless. Flag stored on the WIN team.
  let hugoWreckageTriggered = false;
  if (lF.id === 52 && dmg > 0) {
    B.hugoWreckage[winTeamName] = (B.hugoWreckage[winTeamName] || 0) + 1;
    hugoWreckageTriggered = true;
    collectKC(loseTeamName, lF.name);
    log(`<span class="log-ability">${lF.name}</span> — Wreckage! Took ${dmg} damage → ${wF.name} loses 1 die next roll!`);
  }

  // Marcus (57) — Glacial Pounding: if Marcus (loser) took 3+ real damage, the PLAYER gains +4 bonus dice next roll
  // Fires even if Marcus dies from the hit — the bonus carries to whoever comes in next
  // Must fire AFTER all defensive mods (Stoic, Bogus, King Jay, GF) so dmg reflects what actually landed on lF
  let marcusGlacialTriggered = false;
  if (lF.id === 57 && dmg >= 3) {
    B.marcusGlacialBonus[loseTeamName] = (B.marcusGlacialBonus[loseTeamName] || 0) + 4;
    marcusGlacialTriggered = true;
    collectKC(loseTeamName, lF.name);
    log(`<span class="log-ability">${lF.name}</span> — Glacial Pounding! Took ${dmg} damage → +4 bonus dice next roll!`);
  }

  // Troubling Haters (83) — Growing Mob: win with 4+ damage → +2 HP (overclocks per v294)
  // Mr Filbert (59) — Mask Merchant: flips the +2 heal to -2 damage when on enemy sideline.
  // HP mutation deferred to onShow so HP bar jumps WITH the callout, not before it (same as Opa/Villager/Jeffery pattern).
  let growingMobTriggered = false;
  let growingMobHpAfter = 0;
  let growingMobFlipped = false;
  if (wF.id === 83 && !wF.ko && dmg >= 4) {
    const gmBefore = wF.hp;
    if (filbertCursesWin) {
      growingMobHpAfter = Math.max(0, wF.hp - 2); growingMobFlipped = true; growingMobTriggered = true;
      collectKC(winTeamName, wF.name);
      log(`<span class="log-ability">${wF.name}</span> — Growing Mob! Mr Filbert curses it → -2 HP! (${gmBefore} → ${growingMobHpAfter})`);
    } else {
      growingMobHpAfter = wF.hp + 2; growingMobTriggered = true;
      collectKC(winTeamName, wF.name);
      log(`<span class="log-ability">${wF.name}</span> — Growing Mob! Dealt ${dmg} damage → +2 HP! (${gmBefore} → ${growingMobHpAfter}/${wF.maxHp}${growingMobHpAfter > wF.maxHp ? ' overclocked!' : ''})`);
    }
  }

  // Munch (66) — Scraps: upon defeating a ghost, gain 4 health (overclocks per v294)
  // Mr Filbert (59) — Mask Merchant: flips the +4 heal to -4 damage when on enemy sideline.
  // HP mutation deferred to onShow so HP bar jumps WITH the callout, not before it (same as Opa/Villager/Jeffery pattern).
  let munchScrapTriggered = false;
  let munchHpBefore = 0;
  let munchHpAfter = 0;
  let munchFlipped = false;
  if (wF.id === 66 && !wF.ko && lF.ko) {
    munchHpBefore = wF.hp;
    if (filbertCursesWin) {
      munchHpAfter = Math.max(0, wF.hp - 4); munchFlipped = true; munchScrapTriggered = true;
      collectKC(winTeamName, wF.name);
      log(`<span class="log-ability">${wF.name}</span> — Scraps! Mr Filbert curses it → -4 HP! (${munchHpBefore} → ${munchHpAfter})`);
    } else {
      munchHpAfter = wF.hp + 4; munchScrapTriggered = true;
      collectKC(winTeamName, wF.name);
      log(`<span class="log-ability">${wF.name}</span> — Scraps! ${lF.name} defeated → +4 HP! (${munchHpBefore} → ${munchHpAfter}/${wF.maxHp}${munchHpAfter > wF.maxHp ? ' overclocked!' : ''})`);
    }
  }

  // On-win resource gains — deferred to callout onShow so tiles update WITH the splash, not 800ms before it.
  // Beat 4 renderBattle() fires at t=1900ms; the ability queue starts at t=2700ms — without this deferral,
  // the player sees "+2 Surge" appear during the HP bar drop, then sees PLUNDER! announce it 800ms later.
  if (wF.id === 209 && !wF.ko) { collectKC(winTeamName, wF.name); }
  if (wF.id === 307 && !wF.ko) { collectKC(winTeamName, wF.name); }
  if (wF.id === 342 && !wF.ko) { collectKC(winTeamName, wF.name); }
  if (wF.id === 336 && !wF.ko) { collectKC(winTeamName, wF.name); }
  if (wF.id === 309 && !wF.ko) { collectKC(winTeamName, wF.name); }
  if (wF.id === 81 && !wF.ko) { collectKC(winTeamName, wF.name); }   // Spockles Valley Magic
  if (wF.id === 58 && !wF.ko) { collectKC(winTeamName, wF.name); }   // Ashley Burning Soul
  if (wF.id === 206 && !wF.ko) { collectKC(winTeamName, wF.name); }  // Zain Ice Blade — win grants +1 Ice Shard
  // Dylan (301) Stained Glass — Sideline & In Play: winning rolls gain +1 Burn
  const hasDylanWin = (wF.id === 301 && !wF.ko) || hasSideline(winTeam, 301);
  if (hasDylanWin) { collectKC(winTeamName, wF.id === 301 ? wF.name : 'Dylan'); }
  // Farmer Jeff (314) — Harvest: active OR sideline fires on any 6 rolled, win OR lose (v636 buff).
  // Cornelius (45) Antidote blocks Farmer Jeff's sideline effect (not active).
  const fjWinIsActive = wF.id === 314 && !wF.ko;
  const fjWinIsSideline = hasSideline(winTeam, 314);
  const corneliusBlocksFJWin = fjWinIsSideline && !fjWinIsActive && hasSideline(loseTeam, 45);
  const hasFJWin = (fjWinIsActive || fjWinIsSideline) && !corneliusBlocksFJWin;
  if (hasFJWin) {
    const sixes = countVal(winDice, 6);
    if (sixes > 0) { const jeffGhost = getSidelineGhost(winTeam, 314) || wF; collectKC(winTeamName, 'Farmer Jeff', jeffGhost); }
  }
  const fjLoseIsActive = lF.id === 314 && !lF.ko;
  const fjLoseIsSideline = hasSideline(loseTeam, 314);
  const corneliusBlocksFJLose = fjLoseIsSideline && !fjLoseIsActive && hasSideline(winTeam, 45);
  const hasFJLose = (fjLoseIsActive || fjLoseIsSideline) && !corneliusBlocksFJLose;
  if (hasFJLose) {
    const sixesLose = countVal(loseDice, 6);
    if (sixesLose > 0) { const jeffGhostLose = getSidelineGhost(loseTeam, 314) || lF; collectKC(loseTeamName, 'Farmer Jeff', jeffGhostLose); }
  }

  // Aunt Susan heal bonus (game state — preview only; actual HP mutation deferred to HARVEST DANCE! onShow)
  // Also checks for Mr. Filbert (59) curse: heal → damage (same pattern as Shoo/Boris/Katrina/Opa).
  B.auntSusanHealResult = {};
  ['red', 'blue'].forEach(tn => {
    if (B.auntSusanHealBonus[tn] > 0) {
      const f = active(B[tn]);
      if (!f.ko) {
        const healAmt = B.auntSusanHealBonus[tn] * 2;
        const enemyT = tn === 'red' ? B.blue : B.red;
        const filbertFlips = hasSideline(enemyT, 59);
        const hpBefore = f.hp;
        if (filbertFlips) {
          const hpAfter = Math.max(0, hpBefore - healAmt);
          B.auntSusanHealResult[tn] = { f, healAmt, before: hpBefore, after: hpAfter, filbertFlipped: true };
          log(`<span class="log-ability">Mr Filbert</span> — Harvest Dance cursed! ${f.name} takes ${healAmt} damage! (${hpBefore}→${hpAfter} HP)`);
        } else {
          const hpAfter = hpBefore + healAmt;
          const susanOver = hpAfter > f.maxHp;
          B.auntSusanHealResult[tn] = { f, healAmt, before: hpBefore, after: hpAfter, overclocked: susanOver };
          log(`<span class="log-heal">${f.name}</span> — Harvest Dance! Healed +${healAmt} HP (${hpBefore}→${hpAfter}/${f.maxHp})${susanOver ? ' · overclocked!' : ''}!`);
        }
      }
    }
  });

  // On-lose resource gains — deferred to BITTER END! onShow (same Beat-4 race as on-win grants)
  if (lF.id === 404 && !lF.ko) { collectKC(loseTeamName, lF.name); }
  // NOTE: Sad Sal (29) collectKC already called at line ~10004 (no-ko-guard block) — do NOT add a second one here

  // On-KO triggers (game state) — resource grants deferred to BEDTIME STORY!/BITTER END! onShow
  let powderFinalGiftTriggered = false;
  // Cornelius (45) Antidote blocks Granny's sideline Bedtime Story (hoisted for render section access)
  const corneliusBlocksGrannyLose = hasSideline(winTeam, 45);
  const corneliusBlocksGrannyWin = hasSideline(loseTeam, 45);
  if (lF.ko) {
    if (hasSideline(loseTeam, 310) && !corneliusBlocksGrannyLose) {
      const grannyGhost = getSidelineGhost(loseTeam, 310);
      collectKC(loseTeamName, 'Granny', grannyGhost);
    }
    // Powder (23) — Final Gift: KO'd → team gains 3 Ice Shards for the next ghost
    if (lF.id === 23) {
      powderFinalGiftTriggered = true;
      collectKC(loseTeamName, lF.name); // Knight reactions fire on FINAL GIFT! (same pattern as Granny/Chagrin KO paths)
      log(`<span class="log-ability">${lF.name}</span> — Final Gift! KO'd... leaving 3 Ice Shards for the next ghost.`);
    }
    if (lF.id === 404) { collectKC(loseTeamName, lF.name); } // Chagrin on-KO surge → BITTER END! onShow below
  }

  // Granny Bedtime Story fires for the WINNER's team too when the winner self-KOs (Pudge Belly Flop)
  if (wF.ko && hasSideline(winTeam, 310) && !corneliusBlocksGrannyWin) {
    const grannyGhost = getSidelineGhost(winTeam, 310);
    collectKC(winTeamName, 'Granny', grannyGhost);
  }

  // Bo (109) — Miracle: upon defeating a Ghost, revive a previously KO'd ally to sideline at 1 HP.
  // Detection in game-state section; actual revive deferred to MIRACLE! onShow so the resurrection
  // is visually synchronized with the callout splash (same Beat-4 deferral pattern as Granny/Dart).
  let boMiracleTarget = null;
  if (wF.id === 109 && !wF.ko && lF.ko) {
    const revived = winTeam.ghosts.find((g, i) => i !== winTeam.activeIdx && g.ko);
    if (revived) {
      boMiracleTarget = revived;
      collectKC(winTeamName, wF.name);
    }
  }

  // End-of-round (game state) — Maximo seed deferred to NAP! onShow
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tNameMax2 = team === B.red ? 'red' : 'blue';
    if (f.id === 302 && !f.ko) { collectKC(tNameMax2, f.name); }
  });

  // (Eternal Flame game state already handled at line ~2657)

  // ========================================
  // CINEMATIC ABILITY QUEUE — visuals play sequentially
  // ========================================
  abilityQueue = [];
  abilityQueueMode = true;

  // BLACKOUT! fires before winner calc, so its callouts lead the queue
  blackoutCallouts.forEach(b => queueAbility(b.name, b.color, b.desc, null, b.team));

  // Damage modifier callouts
  if (B.auntSusanBonus[winTeamName] > 0) {
    const cnt = B.auntSusanBonus[winTeamName];
    queueAbility('HARVEST DANCE!', 'var(--rare)', `${wF.name} — ${cnt} seed${cnt>1?'s':''} → +${cnt*2} damage!`, null, winTeamName);
  }
  // Aunt Susan heal callouts (both teams) — actual HP mutation happens inside onShow so the bar
  // jumps exactly when HARVEST DANCE! (or MASK MERCHANT!) fires, not before.
  ['red', 'blue'].forEach(tn => {
    if (B.auntSusanHealBonus[tn] > 0) {
      const cnt = B.auntSusanHealBonus[tn];
      const res = (B.auntSusanHealResult || {})[tn];
      if (res) {
        const { f, healAmt, before, after, overclocked, filbertFlipped } = res;
        if (filbertFlipped) {
          queueAbility('MASK MERCHANT!', 'var(--uncommon)',
            `Mr Filbert — Harvest Dance cursed! ${f.name} takes ${healAmt} damage! (${before}→${after} HP)`,
            () => { f.hp = Math.max(0, f.hp - healAmt); if (f.hp <= 0) { f.hp = 0; f.ko = true; f.killedBy = 59; } renderBattle(); }, tn);
        } else {
          const hpDelta = `${before}→${after} HP${overclocked ? ' · overclocked!' : ''}`;
          queueAbility('HARVEST DANCE!', 'var(--rare)',
            `${f.name} — ${cnt} seed${cnt>1?'s':''} → +${cnt*2} HP! ${hpDelta}`,
            () => { f.hp += healAmt; renderBattle(); }, tn);
        }
      }
    }
  });
  if (pudgeSelfDmg || (wF.id === 311 && wR.type === 'doubles')) {
    queueAbility('BELLY FLOP!', 'var(--common)', `${wF.name} — Doubles! +2 damage, 1 self-damage! (${pudgeHpAfter} HP left)`, pudgeSelfDmgApplied ? () => { wF.hp = pudgeHpAfter; renderBattle(); } : null, winTeamName);
  }
  if (mountainKingTriggered) {
    queueAbility('BEAST MODE!', 'var(--legendary)', `${wF.name} — Doubles! ${mountainKingBaseDmg} × 2 = ${dmg} damage!`, null, winTeamName);
  }
  if (stoneColdTriggered) {
    queueAbility('ONE-TWO-ONE!', 'var(--rare)', `${wF.name} — Double 1s! ${stoneColdBaseDmg} × 3 = ${dmg} damage!`, null, winTeamName);
  }
  if (larryTriggered) {
    queueAbility('FLYING KICK!', 'var(--uncommon)', `${wF.name} — Triples! ${larryBaseDmg} × 3 = ${dmg} damage!`, null, winTeamName);
  }
  if (buttonsTriggered) {
    queueAbility('PERFECT PLAN!', 'var(--common)', `${wF.name} — TRIPLE 6s!!! ${buttonsBaseDmg} + 15 = ${dmg} damage!!`, null, winTeamName);
  }
  if (nikonTriggered) {
    queueAbility('AMBUSH!', 'var(--common)', `${wF.name} — First roll! ${nikonBaseDmg} × 3 = ${dmg} damage!`, null, winTeamName);
  }
  if (caveDwellerTriggered) {
    queueAbility('LURK!', 'var(--uncommon)', `${wF.name} — First roll ambush! ${caveDwellerBaseDmg} × 3 = ${dmg} damage!`, null, winTeamName);
  }
  if (doomTriggered) {
    queueAbility('FIENDSHIP!', 'var(--legendary)', `${wF.name} — Win! +2 bonus damage dealt!`, null, winTeamName);
  }
  if (lucyTriggered) {
    queueAbility('BLUE FIRE!', 'var(--legendary)', `${wF.name} — Win! +1 Sacred Fire!`, () => { winTeam.resources.fire++; renderBattle(); }, winTeamName);
  }
  if (lucyShadowExtraFire) {
    queueAbility('MENTOR!', 'var(--rare)', `Lucy's Shadow — Mentor! +1 extra Sacred Fire!`, () => { winTeam.resources.fire++; renderBattle(); }, winTeamName);
  }
  if (gomTriggered) {
    queueAbility('CHAOS!', 'var(--common)', `${wF.name} — Win with doubles! +1 Sacred Fire!`, () => { winTeam.resources.fire++; renderBattle(); }, winTeamName);
  }
  if (wimTriggered) {
    queueAbility('SLASH!', 'var(--rare)', `${wF.name} — All dice odd! ${wimBaseDmg} + 5 = ${dmg} damage!`, null, winTeamName);
  }
  if (snortonTriggered) {
    queueAbility('FISSURE!', 'var(--rare)', `${wF.name} — Two 6s! ${snortonBaseDmg} + 5 = ${dmg} damage!`, null, winTeamName);
  }
  if (floraRestored) {
    queueAbility('RESTORE!', 'var(--rare)', `${floraRestoredName} — Doubles! +2 HP! Now at ${floraRestoredHp} HP!`, () => { floraGhost.hp = floraRestoredHp; renderBattle(); }, floraGhost === wF ? winTeamName : loseTeamName);
  }
  if (floraFlipped) {
    queueAbility('MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Restore cursed! ${floraFlippedName} takes 2 damage instead! (${floraFlippedFrom} → ${floraFlippedTo} HP)`, () => { floraGhost.hp = floraFlippedTo; renderBattle(); }, floraGhost === wF ? winTeamName : loseTeamName);
  }
  if (pelterTriggered) {
    queueAbility('SNOWBALL!', 'var(--rare)', `${wF.name} — Doubles! ${pelterBaseDmg} + 2 = ${dmg} damage!`, null, winTeamName);
  }
  // Kaylee (453) — Slipstream callout now handled in pre-winner section via blackoutCallouts queue
  if (docTriggered) {
    queueAbility('SAVAGE!', 'var(--uncommon)', `${wF.name} — Doubles! ${docBaseDmg} + 5 = ${dmg} damage!`, null, winTeamName);
  }
  if (charlieTriggered) {
    queueAbility('RUSH!', 'var(--common)', `${wF.name} — Double 2s! Override → exactly 7 damage!`, null, winTeamName);
  }
  if (billBobTriggered) {
    queueAbility('BAIT N SWITCH!', 'var(--uncommon)', `${wF.name} — Below 4 HP! ${billBobBaseDmg} × 2 = ${dmg} damage!`, null, winTeamName);
  }
  if (alucardTriggered) {
    queueAbility('COLONY CALL!', 'var(--uncommon)', `${wF.name} — Doubles! ${alucardSidelineCount} sideline ghost${alucardSidelineCount>1?'s':''} × 2 = ${alucardBaseDmg} + ${alucardSidelineCount*2} = ${dmg} damage! (Once per game used)`, null, winTeamName);
  }
  if (castleGuardsTriggered) {
    queueAbility('FLAMETHROWER!', 'var(--uncommon)', `${wF.name} — ${castleGuardsThreeCount} three${castleGuardsThreeCount>1?'s':''} rolled! ${castleGuardsBaseDmg} × ${Math.pow(2,castleGuardsThreeCount)} = ${dmg} damage!`, null, winTeamName);
  }
  if (teamZippyTriggered) {
    queueAbility('TEAMWORK!', 'var(--uncommon)', `${wF.name} — Singles win! ${teamZippyBaseDmg} + 2 = ${dmg} damage!`, null, winTeamName);
  }
  if (ridleyTriggered) {
    queueAbility('NIMBLE!', 'var(--uncommon)', `${wF.name} — ${wR.type === 'singles' ? 'Singles' : 'Doubles'}! ${ridleyBaseDmg} + ${ridleyBonus} = ${ridleyBaseDmg + ridleyBonus} damage!`, null, winTeamName);
  }
  if (gregTriggered) {
    queueAbility('CHASE!', 'var(--uncommon)', `${wF.name} — More HP than ${lF.name}! (${wF.hp} vs ${lF.hp}) ${gregBaseDmg} × 2 = ${dmg} damage!`, null, winTeamName);
  }
  if (tommyTriggered) {
    queueAbility('REGULATOR!', 'var(--common)', `${wF.name} — Rolled 6s! +${tommyRegulatedCount} bonus dice added!`, null, winTeamName);
  }
  if (growingMobTriggered) {
    const growingMobGhost = wF; // safe closure reference
    if (growingMobFlipped) {
      queueAbility('MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Growing Mob cursed! ${growingMobGhost.name} takes 2 damage instead! (→ ${growingMobHpAfter} HP)`, () => { growingMobGhost.hp = growingMobHpAfter; if (growingMobGhost.hp <= 0) { growingMobGhost.hp = 0; growingMobGhost.ko = true; growingMobGhost.killedBy = 59; } renderBattle(); }, winTeamName);
    } else {
      queueAbility('GROWING MOB!', 'var(--rare)', `${growingMobGhost.name} — ${dmg} damage dealt! +2 HP! Now at ${growingMobHpAfter} HP!`, () => { growingMobGhost.hp = growingMobHpAfter; renderBattle(); }, winTeamName);
    }
  }
  if (munchScrapTriggered) {
    const munchGhost = wF; // safe closure reference
    if (munchFlipped) {
      queueAbility('MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Scraps cursed! ${munchGhost.name} takes 4 damage instead! (${munchHpBefore} → ${munchHpAfter} HP)`, () => { munchGhost.hp = munchHpAfter; if (munchGhost.hp <= 0) { munchGhost.hp = 0; munchGhost.ko = true; munchGhost.killedBy = 59; } renderBattle(); }, winTeamName);
    } else {
      queueAbility('SCRAPS!', 'var(--rare)', `${munchGhost.name} — ${lF.name} defeated! +4 HP! (${munchHpBefore} → ${munchHpAfter}/${munchGhost.maxHp})`, () => { munchGhost.hp = munchHpAfter; renderBattle(); }, winTeamName);
    }
  }
  if (romyTriggered) {
    queueAbility('VALLEY GUARDIAN!', 'var(--legendary)', `${wF.name} — Predicted ${romyWinPred}... HIT! +3 damage!`, null, winTeamName);
  }
  if (hectorTriggered) {
    queueAbility('PROTECTOR!', 'var(--ghost-rare)', `${wF.name} — Singles win! +1 bonus damage!`, null, winTeamName);
  }
  if (tabithaTriggered) {
    queueAbility('RALLY!', 'var(--ghost-rare)', `Tabitha cheers from the sideline — Doubles! +2 damage!`, null, winTeamName);
  }
  if (darkJeffTriggered) {
    queueAbility('CACKLE!', 'var(--rare)', `Dark Jeff (sideline) — ${darkJeffBaseDmg} + 1 = ${dmg} damage!`, null, winTeamName);
  }
  if (explorerJeffTriggered) {
    queueAbility('TREASURE HUNTER!', 'var(--uncommon)', `Explorer Jeff (sideline) — ${explorerJeffBaseDmg} + 1 = ${dmg} damage!`, null, winTeamName);
  }
  if (admiralTriggered) {
    queueAbility('COMRADES!', 'var(--rare)', `Admiral (sideline) — Even doubles! ${admiralBaseDmg} + 2 = ${dmg} damage!`, null, winTeamName);
  }
  if (bilboTriggered) {
    queueAbility('LITTLE BUDDY!', 'var(--rare)', `Bilbo (sideline) — Singles win! ${bilboBaseDmg} + 2 = ${dmg} damage!`, null, winTeamName);
  }
  if (paleNimbusTriggered) {
    const pnSum = winDice ? winDice.reduce((s, d) => s + d, 0) : '?';
    queueAbility('HIDDEN STORM!', 'var(--rare)', `Pale Nimbus (sideline) — Roll sum ${pnSum} < 7! ${paleNimbusBaseDmg} + 2 = ${dmg} damage!`, null, winTeamName);
  }
  // Laura (79) — Catchy Tune unlock callouts (only on first activation)
  if (catchyJustUnlockedWin) {
    const _lSeq = [...winDice].sort((a, b) => a - b).join('-');
    queueAbility('CATCHY TUNE!', 'var(--rare)', `Laura — Straight [${_lSeq}]! Catchy Tune unlocked permanently!`, () => { renderBattle(); }, winTeamName);
  }
  if (catchyJustUnlockedLose) {
    const _lSeqL = [...loseDice].sort((a, b) => a - b).join('-');
    queueAbility('CATCHY TUNE!', 'var(--rare)', `Laura — Straight [${_lSeqL}]! Catchy Tune unlocked permanently!`, () => { renderBattle(); }, loseTeamName);
  }
  // Gary (92) — Lucky Novice: win-team Gary — 1s in winning dice grant ice shards (active OR sideline, v598)
  if (garyOnesWin > 0) {
    const garyWinIceTotal = winTeam.resources.ice + garyIceWin;
    const _garyWinId = winGaryActive ? 92 : (getSidelineGhost(winTeam, 92) || { id: 92 }).id;
    const _garyWinLoc = winGaryActive ? 'active' : 'sideline';
    queueAbility('LUCKY NOVICE!', 'var(--rare)', `Gary (${_garyWinLoc}) — ${garyOnesWin} rolled 1${garyOnesWin > 1 ? 's' : ''}! +${garyIceWin} Ice Shards! (${garyWinIceTotal} total)`, () => { winTeam.resources.ice += garyIceWin; creditGhost(winTeamName, _garyWinId, 'ice', garyIceWin); renderBattle(); }, winTeamName);
    if (sandwichForLose) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Lucky Novice! +${garyIceWin} Ice Shards! (${loseTeam.resources.ice + garyIceWin} total)`, () => { loseTeam.resources.ice += garyIceWin; creditGhost(loseTeamName, 33, 'ice', garyIceWin); renderBattle(); }, loseTeamName);
    // Knight reactions already collected via collectKC at game-state section (line ~9526) — do NOT double-fire here
  }
  if (banditPeteTriggered) {
    const bpWhoQ = winDice && winDice.length === 2 ? 'Your ghost rolled only 2 dice!' : 'Opponent rolled only 2 dice!';
    queueAbility('BANDIT!', 'var(--rare)', `Bandit Pete (sideline) — ${bpWhoQ} ${banditPeteBaseDmg} + 3 = ${dmg} damage!`, null, winTeamName);
  }
  // Bandit Pete knight reactions already collected via collectKC at game-state section (~line 9545) — do NOT double-fire here
  if (zachCraftsmanTriggered) {
    queueAbility('CRAFTSMAN!', 'var(--rare)', `Zach (sideline) — Guard Thomas doubles! ${zachCraftsmanBaseDmg} + 3 = ${dmg} damage!`, null, winTeamName);
  }
  if (booTeamworkDmgTriggered) {
    queueAbility('TEAMWORK!', 'var(--common)', `${wF.name} — Used Teamwork! +1 bonus damage!`, null, winTeamName);
  }
  if (zippaGlimmerBonus > 0) {
    queueAbility('GLIMMER!', 'var(--uncommon)', `${wF.name} — ${zippaGlimmerBonus} Healing Seed${zippaGlimmerBonus>1?'s':''} = +${zippaGlimmerBonus} damage!`, null, winTeamName);
  }
  // Zach knight reactions already collected via collectKC at game-state section (~line 9561) — do NOT double-fire here
  if (louBrosTriggered) {
    // HP heal deferred so the tile updates exactly as the BROS! splash fires — same pattern as Opa Rest / Calvin Overclock
    const louHpBefore = wF.hp;
    const louHpAfter = wF.hp + 1;
    const louOver = louHpAfter > wF.maxHp;
    if (filbertCursesWin) {
      const louFlipped = Math.max(0, wF.hp - 1);
      const louGhost = wF;
      queueAbility('MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Bros heal cursed! ${wF.name} takes 1 damage instead! (${wF.hp}→${louFlipped} HP)`, () => { louGhost.hp = louFlipped; if (louGhost.hp <= 0) { louGhost.hp = 0; louGhost.ko = true; louGhost.killedBy = 59; } renderBattle(); }, winTeamName);
      log(`<span class="log-ability">Lou</span> (sideline) — Bros heal cursed by Mr Filbert! ${wF.name} loses 1 HP.`);
    } else {
      queueAbility('BROS!', 'var(--common)', `Lou (sideline) — ${wF.name} wins! ${louBrosBaseDmg} + 1 = ${dmg} damage! +1 HP! (${louHpBefore}→${louHpAfter} HP${louOver ? ' · overclocked!' : ''})`, () => { wF.hp++; renderBattle(); }, winTeamName);
      log(`<span class="log-ability">Lou</span> (sideline) — Bros! Grawr wins → +1 HP (${louHpBefore}→${louHpAfter}${louOver ? ' overclocked!' : ''}).`);
    }
  }
  // Lou knight reactions already collected via collectKC at game-state section (~line 9577) — do NOT double-fire here
  if (chipTriggered) {
    queueAbility('ACROBATIC DIVE!', 'var(--common)', `${wF.name} — Even doubles! +3 damage! (${chipBaseDmg} + 3 = ${dmg})`, null, winTeamName);
  }
  // Chip knight reactions already collected via collectKC at game-state section (~line 9589) — do NOT double-fire here
  if (yawnEaterOddTriggered) {
    queueAbility('FEAST!', 'var(--uncommon)', `${wF.name} — Odd doubles! +1 damage!`, null, winTeamName);
  }
  if (librarianTriggered) {
    queueAbility('KNOWLEDGE!', 'var(--common)', `Ancient Librarian — ${librarianTwos} 2${librarianTwos > 1 ? 's' : ''} rolled by both teams! ${librarianBaseDmg} + ${librarianTwos} = ${dmg} damage!`, null, winTeamName);
  }
  // Ancient Librarian knight reactions already collected via collectKC at game-state section (~line 9604) — do NOT double-fire here
  if (wandererTriggered) {
    const _wandererSorted = [...winDice].sort((a, b) => a - b);
    queueAbility('CURIOSITY!', 'var(--common)', `${wF.name} — Straight [${_wandererSorted.join('-')}]! +2 damage!`, null, winTeamName);
  }
  if (sparkyTriggered) {
    queueAbility('TINDER!', 'var(--rare)', `${wF.name} — ${sparkyOneCount} rolled 1${sparkyOneCount > 1 ? 's' : ''} × 3 = +${sparkyOneCount * 3} damage! (${sparkyBaseDmg} + ${sparkyOneCount * 3} = ${dmg})`, null, winTeamName);
  }
  // Sparky knight reactions already collected via collectKC at game-state section (~line 9620) — do NOT double-fire here
  if (!tabithaTriggered && corneliusBlocksRally && hasSideline(winTeam, 95) && wR.type === 'doubles' && !wF.ko) {
    // Cornelius (45) — Antidote: blocked Tabitha Rally — show the negation callout
    const cornGhost3 = getSidelineGhost(loseTeam, 45);
    const blockerName = cornGhost3 ? cornGhost3.name : 'Cornelius';
    queueAbility('ANTIDOTE!', 'var(--uncommon)', `${blockerName} neutralizes Tabitha's Rally — +0 damage!`, null, loseTeamName);
  }
  // Cornelius (45) — Antidote: blocked any other sideline damage boosters (Admiral/Dark Jeff/Bilbo/Pale Nimbus/Laura/Bandit Pete/Zach/Lou)
  if (corneliusSidelineBlockedList.length > 0) {
    const cornGhost4 = getSidelineGhost(loseTeam, 45);
    const antidoteName = cornGhost4 ? cornGhost4.name : 'Cornelius';
    const blockedStr = corneliusSidelineBlockedList.join(', ');
    queueAbility('ANTIDOTE!', 'var(--uncommon)', `${antidoteName} neutralizes: ${blockedStr} — sideline buffs blocked!`, null, loseTeamName);
  }
  if (kodakoSwiftWin) {
    queueAbility('SWIFT!', 'var(--common)', `${wF.name} — 1-2-3! Combo locked in → exactly 4 damage!`, null, winTeamName);
  }
  // Kodako knight reactions already collected via collectKC at game-state section (~line 9638) — do NOT double-fire here
  if (pureHeartKO) {
    queueAbility('PURE HEART!', 'var(--ghost-rare)', `${wF.name} — All-in! ${lF.name} instantly defeated!`, null, winTeamName);
  }
  // Pure Heart/Toby knight reactions already collected via collectKC at game-state section (~line 9356) — do NOT double-fire here
  if (skylarTriggered) {
    const shardsUsed = B.committed[winTeamName].ice;
    queueAbility('WINTER BARRAGE!', 'var(--ghost-rare)', `${wF.name} — ${shardsUsed} Ice Shard${shardsUsed>1?'s':''} × 2 = +${shardsUsed*2} damage!`, null, winTeamName);
  }
  // Skylar knight reactions already collected via collectKC at game-state section (~line 9052) — do NOT double-fire here
  if (tylerFireTriggered) {
    const firesUsed = B.committed[winTeamName].fire;
    queueAbility('HEATING UP!', 'var(--ghost-rare)', `${wF.name} — ${firesUsed} Sacred Fire${firesUsed>1?'s':''} × 2 = +${firesUsed*6} damage!`, null, winTeamName);
  }
  // Tyler knight reactions already collected via collectKC at game-state section (~line 9065) — do NOT double-fire here
  if (zainIceBladeTriggered) {
    queueAbility('ICE BLADE!', 'var(--ghost-rare)', `${wF.name} — Ice Blade strikes! +2 damage!`, null, winTeamName);
  }
  if (zainIceBladeTriggered) checkKnightEffects(winTeamName, wF.name); // Knight Terror/Light react to ICE BLADE! (committed blade)
  // Flame Blade: +3 Burn on win callout
  if (flameBladeWinTriggered) {
    queueAbility('FLAME BLADE!', 'var(--rare)', `Flame Blade strikes! +3 Burn!`, null, winTeamName);
  }
  if (redHunterTriggered) {
    queueAbility('RUMBLE!', 'var(--ghost-rare)', `${wF.name} — Enemy has resources! +3 damage!`, null, winTeamName);
  }
  // Red Hunter knight reactions already collected via collectKC at game-state section (line ~9384) — do NOT double-fire here
  if (timpletonTriggered) {
    queueAbility('BIG TARGET!', 'var(--rare)', `${wF.name} — ${lF.name}'s HP higher than Timpleton! +3 damage!`, null, winTeamName);
  }
  // Timpleton knight reactions already collected via collectKC in the game-state Big Target block above — do NOT double-fire here
  // Sylvia dodge callouts (queued here — abilityQueueMode=true — not in the game-state section)
  if (lF.id === 313 && !lF.ko && sylviaDodgeRolls.length > 0) {
    if (sylviaDodged) queueAbility('PORPOISE!', 'var(--rare)', `${lF.name} rolls [${sylviaDodgeRolls.join(', ')}] — DODGED!`, null, loseTeamName);
    else queueAbility('PORPOISE — MISS', 'var(--border)', `${lF.name} rolls [${sylviaDodgeRolls.join(', ')}] — odd! No dodge.`, null, loseTeamName);
  }
  // Sylvia knight reactions already collected via collectKC at game-state section — do NOT double-fire here

  // Eternal Flame callout — grant fires in onShow so counter updates when the splash fires, not before
  if (B.committed[winTeamName].fire > 0 && winTeam.ghosts.some(g => g.id === 406 && !g.ko)) {
    const _etFlameTeam = winTeam;
    const _etFlameCount = B.committed[winTeamName].fire;
    queueAbility('ETERNAL FLAME!', 'var(--uncommon)', `Fed and Hayden — ${_etFlameCount} Sacred Fire${_etFlameCount > 1 ? 's' : ''} preserved!`, () => {
      _etFlameTeam.resources.fire += _etFlameCount;
      log(`<span class="log-ability">Fed and Hayden</span> — Eternal Flame! ${_etFlameCount} Sacred Fire${_etFlameCount > 1 ? 's' : ''} not discarded! (${_etFlameTeam.resources.fire} total)`);
      renderBattle();
    }, winTeamName);
    checkKnightEffects(winTeamName, 'Fed and Hayden'); // Knight Terror/Light react to ETERNAL FLAME!
    if (sandwichForLose) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Eternal Flame! +${_etFlameCount} Sacred Fire${_etFlameCount > 1 ? 's' : ''}! (${loseTeam.resources.fire + _etFlameCount} total)`, () => { loseTeam.resources.fire += _etFlameCount; renderBattle(); }, loseTeamName);
  }

  // Prince Balatron (113) — Party Time: NO auto-callout here. B.balatronPending was set in
  // the compute block above; the interactive reveal modal fires at the START of the
  // drainAbilityQueue post-callback (see showBalatronModal injection below), giving the
  // player a click-to-roll moment instead of a flat combat-log line.

  // Night Master (103) — Bullseye: sideline snipe callout — onShow updates sideline display
  if (bullseyeTarget) {
    queueAbility('BULLSEYE!', 'var(--ghost-rare)', `${wF.name} — Doubles! ${bullseyeTarget.ghost.name} (${bullseyeTarget.priorHp} HP) sniped from the enemy sideline!`, () => { renderBattle(); }, winTeamName);
  }

  // Slicer (460) — Parting Gift: sideline snipe callout — onShow updates sideline display
  if (slicerTarget) {
    const slicerGhostQ = (wF.id === 460 && !wF.ko) ? wF : getSidelineGhost(winTeam, 460);
    const slicerLabelQ = (slicerSideline && !slicerActive) ? `${slicerGhostQ ? slicerGhostQ.name : 'Slicer'} (sideline)` : (slicerGhostQ ? slicerGhostQ.name : 'Slicer');
    queueAbility('PARTING GIFT!', 'var(--uncommon)', `${slicerLabelQ} — Quads! ${slicerTarget.ghost.name} (${slicerTarget.priorHp} HP) destroyed from the enemy sideline!`, () => {
      if (slicerSideline && !slicerActive) popSidelineCard(winTeam, 460);
      renderBattle();
    }, winTeamName);
  }

  // Bubble Boys (44) — Pop: callout fires after Bullseye, onShow re-renders so KO greys out BB
  if (bubbleBoysPopped) {
    queueAbility('POP!', 'var(--uncommon)', `${bubbleBoysName} — ${bubbleBoysEnemyName} rolled triples! Bubble Boys burst!`, () => { renderBattle(); }, loseTeamName);
  }

  // King Jay (106) — Reflection: lost + dice total 7 → damage reflected to winner
  // onShow defers wF.hp mutation so the HP bar drops exactly when REFLECTION! fires, not silently during beat 4.
  if (kingJayReflected) {
    const reflectKoSuffix = wF.ko ? ' — KO!' : ` — ${kingJayHpAfter} HP left`;
    queueAbility('REFLECTION!', 'var(--ghost-rare)', `${lF.name} — Lucky 7! ${kingJayReflectDmg} damage reflected back!${reflectKoSuffix}`, () => { wF.hp = kingJayHpAfter; renderBattle(); }, loseTeamName);
  }
  // King Jay knight reactions already collected via collectKC at game-state section (line ~9746) — do NOT double-fire here

  // Guardian Fairy (99) — Wish: absorbed damage callout (onShow re-renders sideline to grey out GF if KO'd)
  if (guardianFairyAbsorbed && gfSacrifice) {
    const gfKoSuffix = guardianFairyKOd ? ' — GUARDIAN FAIRY FALLS!' : ` — ${gfHpAfter} HP remaining.`;
    queueAbility('WISH!', 'var(--ghost-rare)', `${gfSacrifice.name} — Takes ${guardianFairyAbsorbedDmg} damage for ${lF.name}!${gfKoSuffix}`, () => { gfSacrifice.hp = gfHpAfter; renderBattle(); }, loseTeamName);
  }
  // Guardian Fairy knight reactions already collected via collectKC at game-state section (line ~9767) — do NOT double-fire here

  // Guard Thomas (41) — Stoic: immunity callout fires after Wish so defenses resolve in order
  if (guardThomasStoic) {
    queueAbility('STOIC!', 'var(--uncommon)', `${lF.name} — Below 6 HP! Singles roll negated — taking no damage!`, null, loseTeamName);
  }
  if (guardThomasStoic) checkKnightEffects(loseTeamName, lF.name); // Knight Terror/Light react to STOIC!

  // Bogey (53) — Bogus: reflect callout fires after Stoic — shows the reflected amount and winner's remaining HP
  // HP bar updates in onShow callback so it drops exactly when BOGUS! flashes, not silently at beat 4.
  if (bogeyReflected) {
    const bogeyKoSuffix = wF.ko ? ' — KO!' : ` — ${bogeyHpAfter} HP left`;
    queueAbility('BOGUS!', 'var(--uncommon)', `${lF.name} — REFLECT! ${bogeyReflectDmg} damage bounced back to ${wF.name}!${bogeyKoSuffix}`,
      () => { wF.hp = bogeyHpAfter; renderBattle(); }, loseTeamName);
  }
  // Bogey knight reactions already collected via collectKC at game-state section (line ~9662) — do NOT double-fire here

  // Mirror Matt (410) — Seven Years: reflected damage callout
  if (mirrorMattReflected) {
    const mmKoSuffix = wF.ko ? ' — KO!' : ` — ${wF.hp} HP left`;
    queueAbility('SEVEN YEARS!', 'var(--uncommon)', `${lF.name} — REFLECT! ${wR.type} → ${mirrorMattReflectDmg} damage bounced to ${wF.name}!${mmKoSuffix}`, null, loseTeamName);
  }

  // Jasper (428) — Flame Dive: NO auto-callout here. B.jasperPending was set in the
  // resolver; the interactive modal (showJasperModal) fires in the post-drain callback.

  // Twyla (417) — Lucky Dance: v674 rework moved to dice count section (dice + Healing Seeds pre-roll)

  // Garrick (427) — Watchfire: damage reduction callout (on loss)
  if (lF.id === 427 && !lF.ko) {
    // callout only if Garrick was hit — logged inline above
  }

  if (kodakoSwiftLose) {
    const swiftLoseKoSuffix = wF.ko ? ' — KO!' : ` — ${swiftLoseHpAfter} HP left`;
    queueAbility('SWIFT!', 'var(--common)', `${lF.name} — 1-2-3! Negate damage, deal 4 back to ${wF.name}!${swiftLoseKoSuffix}`,
      () => { wF.hp = swiftLoseHpAfter; renderBattle(); }, loseTeamName);
  }
  // Kodako SWIFT! lose-path knight reactions already collected via collectKC at game-state section (line ~9671) — do NOT double-fire here

  // Patrick (10) — Stone Form: singles negated + 3 counter-damage callout
  // onShow defers wF.hp mutation so the HP bar drops at the same moment the callout fires.
  if (patrickStoneForm) {
    const stoneFormKoSuffix = wF.ko ? ' — KO!' : ` — ${stoneFormHpAfter} HP left`;
    queueAbility('STONE FORM!', 'var(--common)', `${lF.name} — Singles blocked! ${patrickStoneDmg} damage to ${wF.name}!${stoneFormKoSuffix}`,
      () => { wF.hp = stoneFormHpAfter; renderBattle(); }, loseTeamName);
  }
  // Patrick knight reactions already collected via collectKC at game-state section (line ~9683) — do NOT double-fire here

  // Dealer (37) — House Rules: straight on loss → damage negated callout
  if (dealerHouseRules) {
    const _dealerSorted = [...loseDice].sort((a, b) => a - b);
    queueAbility('HOUSE RULES!', 'var(--uncommon)', `${lF.name} — Straight [${_dealerSorted.join('-')}]! ${wF.name}'s attack is nullified!`, null, loseTeamName);
  }
  // Dealer (37) — House Rules: straight on win → +3 damage callout
  if (dealerWinTriggered) {
    const _dealerWinSorted = [...winDice].sort((a, b) => a - b);
    queueAbility('HOUSE RULES!', 'var(--uncommon)', `${wF.name} — Straight [${_dealerWinSorted.join('-')}]! +3 damage!`, null, winTeamName);
  }
  if (deathHowlTriggered) {
    queueAbility('PRESSURE!', 'var(--rare)', `${wF.name} — ${deathHowlKOs} KO${deathHowlKOs > 1 ? 's' : ''} on the field! +${deathHowlKOs} damage!`, null, winTeamName);
  }

  // Sky (72) — Elusive: incoming big damage (>2) negated + counter die pending
  if (skyElusive) {
    queueAbility('ELUSIVE!', 'var(--rare)', `${lF.name} — ${skyElusiveBlockedDmg} damage? Too much! Negated + counter die incoming!`, null, loseTeamName);
  }
  // Sky knight reactions already collected via collectKC at game-state section (line ~9709) — do NOT double-fire here

  // City Cyboo (77) — Barrier: enemy doubles negated callout
  if (cityCybooBarrier) {
    queueAbility('BARRIER!', 'var(--rare)', `${lF.name} — Enemy doubles BLOCKED! ${cityCybooBlockedDmg} damage negated!`, null, loseTeamName);
  }
  // City Cyboo knight reactions already collected via collectKC at game-state section (line ~9721) — do NOT double-fire here

  // Puff (5) — Cute: doubles/triples softened by 1 callout
  if (puffCute) {
    const puffSuffix = dmg === 0 ? ` — 0 damage! Fully absorbed!` : ` — ${wF.name} deals ${dmg} instead!`;
    queueAbility('CUTE!', 'var(--common)', `${lF.name} — ${wR.type}! -1 damage (${puffCuteOriginalDmg} → ${dmg})${puffSuffix}`, null, loseTeamName);
  }
  // Puff knight reactions already collected via collectKC at game-state section (line ~9733) — do NOT double-fire here

  // Little Boo (9) — Mercy: enemy triples converted to [1,2,3] singles callout
  if (mercyTriggered) {
    queueAbility('MERCY!', 'var(--common)', `${lF.name} — Enemy triples count as [1,2,3]! Base damage: 3 → 1. ${wF.name}'s big roll softened!`, null, loseTeamName);
  }
  // Little Boo knight reactions already collected via collectKC at game-state section (line ~9093) — do NOT double-fire here

  // Fang Undercover (7) — Skilled Coward: dodge activated → negate hit, ghost-picker fires after queue drains
  if (fangUndercoverActivated) {
    queueAbility('SKILLED COWARD!', 'var(--common)', `${lF.name} — Dodge! ${wF.name}'s attack negated! Fang slips to the sideline...`, null, loseTeamName);
  }
  // Fang Undercover knight reactions already collected via collectKC at game-state section (line ~9784) — do NOT double-fire here

  // Cameron (25) — Unstoppable Force: damage pierced negation callout (queued after defense callouts)
  if (cameronUnstoppableLogged) {
    queueAbility('UNSTOPPABLE!', 'var(--common)', `${wF.name} — Damage cannot be negated! ${dmg} damage goes through!`, null, winTeamName);
  }
  // Cameron knight reactions already collected via collectKC at game-state section — do NOT double-fire here

  // Gus (31) — Gale Force: callout now handled in doGusGaleReactive() when player accepts
  // Gus knight reactions already collected via collectKC at game-state section (line ~9798) — do NOT double-fire here

  // Hugo (52) — Wreckage: took real damage → attacker loses 1 die next roll
  if (hugoWreckageTriggered) {
    queueAbility('WRECKAGE!', 'var(--uncommon)', `${lF.name} — Took ${dmg} damage! ${wF.name} loses 1 die next roll!`, null, loseTeamName);
  }
  // Hugo knight reactions already collected via collectKC at game-state section (line ~10019) — do NOT double-fire here

  // Marcus (57) — Glacial Pounding: taking 3+ damage charges up +4 bonus dice for the PLAYER's next roll
  if (marcusGlacialTriggered) {
    queueAbility('GLACIAL POUNDING!', 'var(--uncommon)', `${lF.name} — Took ${dmg} damage! +4 bonus dice next roll${lF.ko ? ' for the next fighter!' : '!'}`, null, loseTeamName);
  }
  // Marcus knight reactions already collected via collectKC at game-state section (line ~10029) — do NOT double-fire here

  // On-win callouts — onShow grants the resource the moment the splash appears (not 800ms earlier at Beat 4)
  if (wF.id === 209 && !wF.ko) { queueAbility('PLUNDER!', 'var(--common)', `${wF.name} — Win! +2 Surge!`, () => { winTeam.resources.surge += 2; renderBattle(); }, winTeamName); }
  // Dart knight reactions already collected via collectKC at game-state section (line ~10075) — do NOT double-fire here
  if (wF.id === 209 && !wF.ko && sandwichForLose) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Plunder! +2 Surge! (${loseTeam.resources.surge + 2} total)`, () => { loseTeam.resources.surge += 2; renderBattle(); }, loseTeamName);
  if (wF.id === 307 && !wF.ko) { queueAbility('DAUGHTER OF THE STREAM!', 'var(--rare)', `${wF.name} — Win! +3 Ice Shards!`, () => { winTeam.resources.ice += 3; renderBattle(); }, winTeamName); }
  // Artemis knight reactions already collected via collectKC at game-state section (line ~10076) — do NOT double-fire here
  if (wF.id === 307 && !wF.ko && sandwichForLose) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Daughter of the Stream! +3 Ice Shards!`, () => { loseTeam.resources.ice += 3; creditGhost(loseTeamName, 33, 'ice', 3); renderBattle(); }, loseTeamName);
  if (wF.id === 81 && !wF.ko) { queueAbility('VALLEY MAGIC!', 'var(--rare)', `${wF.name} — Win! +2 Ice Shards! (${winTeam.resources.ice + 2} total)`, () => { winTeam.resources.ice += 2; renderBattle(); }, winTeamName); }
  // Spockles knight reactions already collected via collectKC at game-state section (line ~10080) — do NOT double-fire here
  if (wF.id === 81 && !wF.ko && sandwichForLose) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Valley Magic! +2 Ice Shards! (${loseTeam.resources.ice + 2} total)`, () => { loseTeam.resources.ice += 2; creditGhost(loseTeamName, 33, 'ice', 2); renderBattle(); }, loseTeamName);
  // Zain (206) — Ice Blade: win any roll → gain 1 Ice Shard (fires every win, regardless of blade swing)
  if (wF.id === 206 && !wF.ko) { queueAbility('ICE SHARD!', 'var(--ghost-rare)', `${wF.name} — Win! +1 Ice Shard! (${winTeam.resources.ice + 1} total)`, () => { winTeam.resources.ice++; creditGhost(winTeamName, 206, 'ice', 1); renderBattle(); }, winTeamName); }
  // Zain ICE SHARD knight reactions already collected via collectKC at game-state section (line ~10082) — do NOT double-fire here
  if (wF.id === 206 && !wF.ko && sandwichForLose) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Ice Shard! +1 Ice Shard! (${loseTeam.resources.ice + 1} total)`, () => { loseTeam.resources.ice++; creditGhost(loseTeamName, 33, 'ice', 1); renderBattle(); }, loseTeamName);
  // Dylan (301) — Stained Glass: Sideline & In Play, winning rolls gain +1 Burn
  if (hasDylanWin) {
    if (!winTeam.resources.burn) winTeam.resources.burn = 0;
    const dylanName = (wF.id === 301) ? wF.name : (getSidelineGhost(winTeam, 301) || {}).name || 'Dylan';
    const dylanLabel = (wF.id === 301) ? '' : ' (sideline)';
    queueAbility('STRAW GUARDIAN!', 'var(--common)', `${dylanName}${dylanLabel} — Win! +1 Burn!`, () => { winTeam.resources.burn += 1; renderBattle(); }, winTeamName);
    log(`<span class="log-ability">${dylanName}${dylanLabel}</span> — Straw Guardian! Gain <span class="log-dmg">1 Burn</span>!`);
  }
  // Foreman (451) — Blueprint: win → +1 die next turn
  if (wF.id === 451 && !wF.ko) {
    if (!B.foremanDieBonus) B.foremanDieBonus = { red: 0, blue: 0 };
    B.foremanDieBonus[winTeamName] = (B.foremanDieBonus[winTeamName] || 0) + 1;
    collectKC(winTeamName, wF.name);
    queueAbility('BLUEPRINT!', 'var(--rare)', `${wF.name} — Win! +1 die next turn!`, null, winTeamName);
    log(`<span class="log-ability">${wF.name}</span> — Blueprint! <span class="log-ms">+1 die next turn!</span>`);
  }
  // Welder (450) — Arc: wins give 1 Burn (active Welder only, not duplicated by Torch)
  if (wF.id === 450 && !wF.ko) {
    if (!winTeam.resources.burn) winTeam.resources.burn = 0;
    queueAbility('ARC!', 'var(--uncommon)', `${wF.name} — Win! +1 Burn!`, () => { winTeam.resources.burn += 1; renderBattle(); }, winTeamName);
    log(`<span class="log-ability">${wF.name}</span> — Arc! Gain <span class="log-dmg">1 Burn</span>!`);
  }
  // Welder's Torch (permanent item) — wins give 1 Burn for ANY active ghost on the team
  if (B.welderTorch && B.welderTorch[winTeamName] && wF.id !== 450) {
    if (!winTeam.resources.burn) winTeam.resources.burn = 0;
    queueAbility("WELDER'S TORCH!", 'var(--rare)', `Welder's Torch — Win! +1 Burn!`, () => { winTeam.resources.burn += 1; renderBattle(); }, winTeamName);
    log(`<span class="log-ability">Welder's Torch</span> — Win! <span class="log-dmg">+1 Burn!</span>`);
  }
  // Roger (54) — Tempest: win with 4+ dice containing 2 different pairs → +3 Sacred Fires
  if (wF.id === 54 && !wF.ko && winDice && winDice.length >= 4) {
    const _dieCounts = {};
    winDice.forEach(d => _dieCounts[d] = (_dieCounts[d]||0)+1);
    const _pairCount = Object.values(_dieCounts).filter(c => c >= 2).length;
    if (_pairCount >= 2) {
      collectKC(winTeamName, wF.name);  // Roger Tempest — Knight Terror/Light react when ability fires
      const _newFires = winTeam.resources.fire + 3;
      queueAbility('TEMPEST!', 'var(--uncommon)', `${wF.name} — 2 pairs! Boom shaka laka! +3 Sacred Fires! (${_newFires} total)`, () => { winTeam.resources.fire += 3; renderBattle(); }, winTeamName);
      if (sandwichForLose) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Tempest! +3 Sacred Fires! (${loseTeam.resources.fire + 3} total)`, () => { loseTeam.resources.fire += 3; renderBattle(); }, loseTeamName);
    }
  }
  // Ashley (58) — Burning Soul: win a roll → gain +1 Sacred Fire
  if (wF.id === 58 && !wF.ko) { queueAbility('BURNING SOUL!', 'var(--uncommon)', `${wF.name} — Win! +1 Sacred Fire! (${winTeam.resources.fire + 1} total)`, () => { winTeam.resources.fire++; renderBattle(); }, winTeamName); }
  // Ashley knight reactions already collected via collectKC at game-state section (line ~10081) — do NOT double-fire here
  if (wF.id === 58 && !wF.ko && sandwichForLose) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Burning Soul! +1 Sacred Fire! (${loseTeam.resources.fire + 1} total)`, () => { loseTeam.resources.fire++; renderBattle(); }, loseTeamName);
  // Piper (107) — Slick Coat: win with singles → gain 1 Sacred Fire
  if (wF.id === 107 && !wF.ko && wR.type === 'singles') {
    queueAbility('SLICK COAT!', 'var(--ghost-rare)', `${wF.name} — Singles win! +1 Sacred Fire! (${winTeam.resources.fire + 1} total)`, () => { winTeam.resources.fire++; renderBattle(); }, winTeamName);
    log(`<span class="log-ability">${wF.name}</span> — Slick Coat! Singles win → <span class="log-ms">+1 Sacred Fire!</span>`);
    collectKC(winTeamName, wF.name);
  }
  // Opa (48) — Rest: win → gain +1 HP (overclocks! Rule #9 — do NOT add Math.min cap)
  // Mr Filbert (59) — Mask Merchant: flips the +1 heal to -1 damage when on enemy sideline.
  if (wF.id === 48 && !wF.ko) {
    if (filbertCursesWin) {
      const opaFlipped = Math.max(0, wF.hp - 1);
      const opaGhost = wF;
      queueAbility('MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Rest cursed! ${wF.name} takes 1 damage! (${wF.hp}→${opaFlipped} HP)`, () => { opaGhost.hp = opaFlipped; if (opaGhost.hp <= 0) { opaGhost.hp = 0; opaGhost.ko = true; opaGhost.killedBy = 59; } renderBattle(); }, winTeamName);
      log(`<span class="log-ability">${wF.name}</span> — Rest! Mr Filbert curses → -1 HP (${opaFlipped} HP).`);
    } else {
      const opaNewHp = wF.hp + 1;
      const opaOver = opaNewHp > wF.maxHp;
      queueAbility('REST!', 'var(--uncommon)', `${wF.name} — Won! +1 HP! (${wF.hp}→${opaNewHp} HP${opaOver ? ' · overclocked!' : ''})`, () => { wF.hp++; renderBattle(); }, winTeamName);
      log(`<span class="log-ability">${wF.name}</span> — Rest! Win → +1 HP (${opaNewHp} HP${opaOver ? ' overclocked!' : ''}).`);
    }
  }
  if (wF.id === 48 && !wF.ko) checkKnightEffects(winTeamName, wF.name); // Knight Terror/Light react to REST! (both heal and Filbert-curse branches)
  // Villager (11) — Hospitality: sideline passive — active ghost gains +1 HP every winning roll (Filbert-aware, Cornelius-aware).
  if (hasSideline(winTeam, 11) && !wF.ko) {
    if (corneliusBlocksRally) {
      const cornVillager = getSidelineGhost(loseTeam, 45);
      const antidoteNameV = cornVillager ? cornVillager.name : 'Cornelius';
      queueAbility('ANTIDOTE!', 'var(--uncommon)', `${antidoteNameV} neutralizes Villager's Hospitality — heal blocked!`, null, winTeamName);
      log(`<span class="log-ability">Cornelius</span> — Antidote! Villager Hospitality blocked.`);
    } else if (filbertCursesWin) {
      const villagerFlipped = Math.max(0, wF.hp - 1);
      const villagerGhost = wF;
      queueAbility('MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Hospitality cursed! ${wF.name} takes 1 damage! (${wF.hp}→${villagerFlipped} HP)`, () => { villagerGhost.hp = villagerFlipped; if (villagerGhost.hp <= 0) { villagerGhost.hp = 0; villagerGhost.ko = true; villagerGhost.killedBy = 59; } renderBattle(); }, winTeamName);
      log(`<span class="log-ability">${wF.name}</span> — Hospitality! Filbert curses → -1 HP (${villagerFlipped} HP).`);
    } else {
      const villagerNewHp = wF.hp + 1;
      const vilOver = villagerNewHp > wF.maxHp;
      queueAbility('HOSPITALITY!', 'var(--common)', `Villager — ${wF.name} wins! +1 HP from the sideline! (${wF.hp}→${villagerNewHp} HP${vilOver ? ' · overclocked!' : ''})`, () => { guardedHeal(wF, 1, winTeamName); renderBattle(); }, winTeamName);
      log(`<span class="log-ability">${wF.name}</span> — Hospitality! Villager sideline → +1 HP (${villagerNewHp} HP${vilOver ? ' overclocked!' : ''}).`);
    }
  }
  if (hasSideline(winTeam, 11) && !wF.ko) checkKnightEffects(winTeamName, wF.name); // Knight Terror/Light react to HOSPITALITY! (all branches)
  // Jeffery (14) — Chuckle: sideline passive — active ghost gains +3 HP when the winning roll DEFEATS the enemy ghost (lF.ko).
  // "Wins a battle" = KO an enemy ghost, NOT merely winning a roll. Filbert-aware, Cornelius-aware.
  // Phase 3 debug breadcrumb — helps Wyatt verify the Chuckle path fires correctly
  if (DEBUG) console.log('[CHUCKLE DEBUG]', {
    hasSideline: hasSideline(winTeam, 14),
    wFko: wF.ko,
    lFko: lF.ko,
    cornelius: corneliusBlocksRally,
    filbert: filbertCursesWin
  });
  if (hasSideline(winTeam, 14) && !wF.ko && lF.ko) {
    if (corneliusBlocksRally) {
      const cornJeffery = getSidelineGhost(loseTeam, 45);
      const antidoteNameJ = cornJeffery ? cornJeffery.name : 'Cornelius';
      queueAbility('ANTIDOTE!', 'var(--uncommon)', `${antidoteNameJ} neutralizes Jeffery's Chuckle — heal blocked!`, null, winTeamName);
      log(`<span class="log-ability">Cornelius</span> — Antidote! Jeffery Chuckle blocked.`);
    } else if (filbertCursesWin) {
      const jeffFlipped = Math.max(0, wF.hp - 3);
      const jeffGhost = wF;
      queueAbility('MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Chuckle cursed! ${wF.name} takes 3 damage! (${wF.hp}→${jeffFlipped} HP)`, () => { jeffGhost.hp = jeffFlipped; if (jeffGhost.hp <= 0) { jeffGhost.hp = 0; jeffGhost.ko = true; jeffGhost.killedBy = 59; } renderBattle(); }, winTeamName);
      log(`<span class="log-ability">${wF.name}</span> — Chuckle! Filbert curses → -3 HP (${jeffFlipped} HP).`);
    } else {
      const jeffNewHp = wF.hp + 3;
      const jeffOver = jeffNewHp > wF.maxHp;
      queueAbility('CHUCKLE!', 'var(--common)', `Jeffery — ${wF.name} wins! +3 HP from the sideline! (${wF.hp}→${jeffNewHp} HP${jeffOver ? ' · overclocked!' : ''})`, () => { wF.hp += 3; renderBattle(); }, winTeamName);
      log(`<span class="log-ability">${wF.name}</span> — Chuckle! Jeffery sideline → +3 HP (${jeffNewHp} HP${jeffOver ? ' overclocked!' : ''}).`);
    }
  }
  if (hasSideline(winTeam, 14) && !wF.ko && lF.ko) checkKnightEffects(winTeamName, wF.name); // Knight Terror/Light react to CHUCKLE! (all branches, KO-gated)
  // Calvin (342) — Overclock: win heals 1 HP + gains 1 Healing Seed. Mr Filbert flips the heal to damage.
  if (wF.id === 342 && !wF.ko) {
    if (filbertCursesWin) {
      const calFlipped = Math.max(0, wF.hp - 1);
      queueAbility('MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Overclock cursed! ${wF.name} takes 1 damage! (${wF.hp}→${calFlipped} HP)`, () => { wF.hp = calFlipped; if (wF.hp <= 0) { wF.hp = 0; wF.ko = true; wF.killedBy = 59; } renderBattle(); }, winTeamName);
      log(`<span class="log-ability">Mr Filbert</span> — Mask Merchant! Calvin Overclock flipped to damage. ${wF.name} ${wF.hp} → ${calFlipped} HP.`);
    } else {
      queueAbility('OVERCLOCK!', 'var(--uncommon)', `${wF.name} — Win heals 1 HP + 1 Healing Seed! ${wF.hp}→${wF.hp + 1} HP${wF.hp + 1 > wF.maxHp ? ' · overclocked!' : ''}`, () => { guardedHeal(wF, 1, winTeamName); winTeam.resources.healingSeed++; renderBattle(); }, winTeamName);
      log(`<span class="log-ability">${wF.name}</span> — Overclock! +1 HP (${wF.hp + 1} HP${wF.hp + 1 > wF.maxHp ? ' overclocked!' : ''}) + <span class="log-heal">+1 Healing Seed!</span>`);
    }
  }
  // Calvin knight reactions already collected via collectKC at game-state section (line ~10077) — do NOT double-fire here
  if (humarTriggered) { queueAbility('METEOR!', 'var(--legendary)', `${wF.name} — Win! 2 delayed damage + 1 Burn gained!`, () => { renderBattle(); }, winTeamName); }
  // Humar knight reactions already collected via collectKC at game-state section (line ~10078) — do NOT double-fire here
  // Humar Sandwiches mirror removed — Meteor deals delayed damage + burn, not mirrorable resources
  if (wF.id === 309 && !wF.ko) { queueAbility('HARVEST DANCE!', 'var(--rare)', `${wF.name} — Win → +2 Healing Seeds!`, () => { winTeam.resources.healingSeed += 2; renderBattle(); }, winTeamName); }
  // Aunt Susan knight reactions already collected via collectKC at game-state section (line ~10079) — do NOT double-fire here
  if (wF.id === 309 && !wF.ko && sandwichForLose) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Harvest Dance! +1 Healing Seed! (${loseTeam.resources.healingSeed + 1} total)`, () => { loseTeam.resources.healingSeed++; renderBattle(); }, loseTeamName);
  // Splinter (101) — Toxic Fumes: first win triggers activation callout
  if (splinterJustActivated) {
    queueAbility('TOXIC FUMES!', 'var(--ghost-rare)', `${wF.name} — First Win! Toxic Fumes activated — 1 chip damage before every roll from now on!`, null, winTeamName);
  }
  // Farmer Jeff (314) — Harvest: active OR sideline fires on any 6 rolled, win OR lose (v636 buff).
  // Cornelius (45) Antidote — show block callout if Jeff's sideline Harvest was negated
  if (corneliusBlocksFJWin && countVal(winDice, 6) > 0) {
    const cornGhostFJW = getSidelineGhost(loseTeam, 45);
    queueAbility('ANTIDOTE!', 'var(--uncommon)', `${cornGhostFJW ? cornGhostFJW.name : 'Cornelius'} blocks Farmer Jeff's Harvest!`, null, loseTeamName);
    log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Farmer Jeff Harvest blocked!`);
  }
  if (corneliusBlocksFJLose && countVal(loseDice, 6) > 0) {
    const cornGhostFJL = getSidelineGhost(winTeam, 45);
    queueAbility('ANTIDOTE!', 'var(--uncommon)', `${cornGhostFJL ? cornGhostFJL.name : 'Cornelius'} blocks Farmer Jeff's Harvest!`, null, winTeamName);
    log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Farmer Jeff Harvest blocked!`);
  }
  if (hasFJWin && countVal(winDice, 6) > 0) {
    const sx = countVal(winDice, 6);
    const fjIsActive = wF.id === 314 && !wF.ko;
    const _jeffId = fjIsActive ? 314 : (getSidelineGhost(winTeam, 314) || { id: 314 }).id;
    const fjLabel = fjIsActive ? 'Farmer Jeff' : 'Farmer Jeff (sideline)';
    queueAbility('HARVEST!', 'var(--ghost-rare)', `${fjLabel} — ${sx} six${sx>1?'es':''} = ${sx} Healing Seed${sx>1?'s':''}!`, () => { winTeam.resources.healingSeed += sx; creditGhost(winTeamName, _jeffId, 'seed', sx); if (!fjIsActive) popSidelineCard(winTeam, 314); renderBattle(); }, winTeamName);
    // Farmer Jeff knight reactions already collected via collectKC at game-state section — do NOT double-fire here
    if (sandwichForLose) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Harvest! +${sx} Healing Seed${sx>1?'s':''}! (${loseTeam.resources.healingSeed + sx} total)`, () => { loseTeam.resources.healingSeed += sx; creditGhost(loseTeamName, 33, 'seed', sx); renderBattle(); }, loseTeamName);
  }
  if (hasFJLose && countVal(loseDice, 6) > 0) {
    const sxL = countVal(loseDice, 6);
    const fjIsActiveLose = lF.id === 314 && !lF.ko;
    const _jeffIdLose = fjIsActiveLose ? 314 : (getSidelineGhost(loseTeam, 314) || { id: 314 }).id;
    const fjLabelLose = fjIsActiveLose ? 'Farmer Jeff' : 'Farmer Jeff (sideline)';
    queueAbility('HARVEST!', 'var(--ghost-rare)', `${fjLabelLose} — ${sxL} six${sxL>1?'es':''} = ${sxL} Healing Seed${sxL>1?'s':''}!`, () => { loseTeam.resources.healingSeed += sxL; creditGhost(loseTeamName, _jeffIdLose, 'seed', sxL); if (!fjIsActiveLose) popSidelineCard(loseTeam, 314); renderBattle(); }, loseTeamName);
    // Farmer Jeff lose-path knight reactions already collected via collectKC at game-state section — do NOT double-fire here
    if (sandwichForWin) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Harvest! +${sxL} Healing Seed${sxL>1?'s':''}! (${winTeam.resources.healingSeed + sxL} total)`, () => { winTeam.resources.healingSeed += sxL; creditGhost(winTeamName, 33, 'seed', sxL); renderBattle(); }, winTeamName);
  }

  // Simon (24) — Brew Time: post-roll trigger REMOVED. Only fires on pre-roll chip damage now.
  // simonBrewTriggered is always false — kept for code structure compatibility.

  // Sad Sal (29) — Tough Job: lost → +1 Ice Shard (onShow deferred so ice tile updates WITH the splash)
  if (sadSalTriggered) {
    const sadSalIceTotal = loseTeam.resources.ice + 1;
    queueAbility('TOUGH JOB!', 'var(--common)', `${lF.name} — Lost the roll... but gained 1 Ice Shard! (${sadSalIceTotal} total)`, () => { loseTeam.resources.ice++; renderBattle(); }, loseTeamName);
    // Sad Sal knight reactions already collected via collectKC at game-state section (line ~10009) — do NOT double-fire here
    if (sandwichForWin) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Tough Job! +1 Ice Shard! (${winTeam.resources.ice + 1} total)`, () => { winTeam.resources.ice++; creditGhost(winTeamName, 33, 'ice', 1); renderBattle(); }, winTeamName);
  }

  // Gary (92) — Lucky Novice: lose-team Gary — 1s in losing dice still grant ice shards (active OR sideline, v598)
  if (garyOnesLose > 0) {
    const garyLoseIceTotal = loseTeam.resources.ice + garyIceLose;
    const _garyLoseId = loseGaryActive ? 92 : (getSidelineGhost(loseTeam, 92) || { id: 92 }).id;
    const _garyLoseLoc = loseGaryActive ? 'active' : 'sideline';
    queueAbility('LUCKY NOVICE!', 'var(--rare)', `Gary (${_garyLoseLoc}) — ${garyOnesLose} rolled 1${garyOnesLose > 1 ? 's' : ''}! +${garyIceLose} Ice Shards! (${garyLoseIceTotal} total)`, () => { loseTeam.resources.ice += garyIceLose; creditGhost(loseTeamName, _garyLoseId, 'ice', garyIceLose); renderBattle(); }, loseTeamName);
    if (sandwichForWin) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Lucky Novice! +${garyIceLose} Ice Shards! (${winTeam.resources.ice + garyIceLose} total)`, () => { winTeam.resources.ice += garyIceLose; creditGhost(winTeamName, 33, 'ice', garyIceLose); renderBattle(); }, winTeamName);
    // Gary lose-path knight reactions already collected via collectKC at game-state section (line ~9531) — do NOT double-fire here
  }

  // On-lose callouts — onShow applies the surge grant with the splash
  if (lF.id === 404 && !lF.ko) { queueAbility('BITTER END!', 'var(--rare)', `${lF.name} — Lost but gained 1 Surge!`, () => { loseTeam.resources.surge++; renderBattle(); }, loseTeamName); }
  // Chagrin knight reactions already collected via collectKC at game-state section (line ~10109) — do NOT double-fire here
  if (lF.id === 404 && !lF.ko && sandwichForWin) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Bitter End! +1 Surge! (${winTeam.resources.surge + 1} total)`, () => { winTeam.resources.surge++; renderBattle(); }, winTeamName);
  // On-KO callouts — onShow applies the Granny resource grant with the splash
  if (lF.ko) {
    if (hasSideline(loseTeam, 310) && !corneliusBlocksGrannyLose) {
      if (wR.type === 'singles') {
        queueAbility('BEDTIME STORY!', 'var(--uncommon)', `Granny consoles — singles KO → 3 Lucky Stones!`, () => { loseTeam.resources.luckyStone += 3; creditGhost(loseTeamName, 310, 'ls', 3); popSidelineCard(loseTeam, 310); renderBattle(); }, loseTeamName);
        if (sandwichForWin) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Bedtime Story! +3 Lucky Stones! (${winTeam.resources.luckyStone + 3} total)`, () => { winTeam.resources.luckyStone += 3; renderBattle(); }, winTeamName);
      } else if (wR.type === 'doubles') {
        queueAbility('BEDTIME STORY!', 'var(--uncommon)', `Granny consoles — doubles KO → Moonstone!`, () => { loseTeam.resources.moonstone++; creditGhost(loseTeamName, 310, 'ms', 1); popSidelineCard(loseTeam, 310); renderBattle(); }, loseTeamName);
        if (sandwichForWin) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Bedtime Story! +1 Moonstone! (${winTeam.resources.moonstone + 1} total)`, () => { winTeam.resources.moonstone++; renderBattle(); }, winTeamName);
      } else if (isTripleOrBetter(wR.type)) {
        queueAbility('BEDTIME STORY!', 'var(--uncommon)', `Granny consoles — ${wR.type} KO → 3 Sacred Fires!`, () => { loseTeam.resources.fire += 3; creditGhost(loseTeamName, 310, 'fire', 3); popSidelineCard(loseTeam, 310); renderBattle(); }, loseTeamName);
        if (sandwichForWin) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Bedtime Story! +3 Sacred Fires! (${winTeam.resources.fire + 3} total)`, () => { winTeam.resources.fire += 3; renderBattle(); }, winTeamName);
      }
    } else if (hasSideline(loseTeam, 310) && corneliusBlocksGrannyLose) {
      const cornGhostGrL = getSidelineGhost(winTeam, 45);
      queueAbility('ANTIDOTE!', 'var(--uncommon)', `${cornGhostGrL ? cornGhostGrL.name : 'Cornelius'} blocks Granny's Bedtime Story!`, null, winTeamName);
      log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Granny Bedtime Story blocked!`);
    }
    if (lF.id === 404) { queueAbility('BITTER END!', 'var(--rare)', `${lF.name} — KO'd but still gains 1 Surge!`, () => { loseTeam.resources.surge++; renderBattle(); }, loseTeamName); }
    if (lF.id === 404 && sandwichForWin) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Bitter End (KO)! +1 Surge! (${winTeam.resources.surge + 1} total)`, () => { winTeam.resources.surge++; renderBattle(); }, winTeamName);
  }
  // Granny callout when winner self-KOs (Pudge Belly Flop doubles = always surge for Granny on winner's team)
  if (wF.ko && hasSideline(winTeam, 310) && !corneliusBlocksGrannyWin) {
    if (wR.type === 'singles') {
      queueAbility('BEDTIME STORY!', 'var(--uncommon)', `Granny consoles — singles KO → 3 Lucky Stones!`, () => { winTeam.resources.luckyStone += 3; creditGhost(winTeamName, 310, 'ls', 3); popSidelineCard(winTeam, 310); renderBattle(); }, winTeamName);
      if (sandwichForLose) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Bedtime Story! +3 Lucky Stones! (${loseTeam.resources.luckyStone + 3} total)`, () => { loseTeam.resources.luckyStone += 3; renderBattle(); }, loseTeamName);
    } else if (wR.type === 'doubles') {
      queueAbility('BEDTIME STORY!', 'var(--uncommon)', `Granny consoles — doubles KO → Moonstone!`, () => { winTeam.resources.moonstone++; creditGhost(winTeamName, 310, 'ms', 1); popSidelineCard(winTeam, 310); renderBattle(); }, winTeamName);
      if (sandwichForLose) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Bedtime Story! +1 Moonstone! (${loseTeam.resources.moonstone + 1} total)`, () => { loseTeam.resources.moonstone++; renderBattle(); }, loseTeamName);
    } else if (isTripleOrBetter(wR.type)) {
      queueAbility('BEDTIME STORY!', 'var(--uncommon)', `Granny consoles — ${wR.type} KO → 3 Sacred Fires!`, () => { winTeam.resources.fire += 3; creditGhost(winTeamName, 310, 'fire', 3); popSidelineCard(winTeam, 310); renderBattle(); }, winTeamName);
      if (sandwichForLose) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Bedtime Story! +3 Sacred Fires! (${loseTeam.resources.fire + 3} total)`, () => { loseTeam.resources.fire += 3; renderBattle(); }, loseTeamName);
    }
  } else if (wF.ko && hasSideline(winTeam, 310) && corneliusBlocksGrannyWin) {
    const cornGhostGrW = getSidelineGhost(loseTeam, 45);
    queueAbility('ANTIDOTE!', 'var(--uncommon)', `${cornGhostGrW ? cornGhostGrW.name : 'Cornelius'} blocks Granny's Bedtime Story!`, null, loseTeamName);
    log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Granny Bedtime Story blocked!`);
  }

  // Powder (23) — Final Gift: KO'd → loseTeam gains 3 Ice Shards (onShow deferred for visual sync)
  if (powderFinalGiftTriggered) {
    const powderIceTotal = loseTeam.resources.ice + 3;
    queueAbility('FINAL GIFT!', 'var(--common)', `${lF.name} — Defeated... but leaves 3 Ice Shards behind! (${powderIceTotal} total)`, () => { loseTeam.resources.ice += 3; creditGhost(loseTeamName, 23, 'ice', 3); renderBattle(); }, loseTeamName);
    if (sandwichForWin) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Final Gift! +3 Ice Shards! (${winTeam.resources.ice + 3} total)`, () => { winTeam.resources.ice += 3; creditGhost(winTeamName, 33, 'ice', 3); renderBattle(); }, winTeamName);
  }

  // Chester (426) — Well Read: Win: +1 Healing Seed always. Doubles+: also +2 Burn.
  if (wF.id === 426 && !wF.ko) {
    const chesterIsDoubles = ['doubles','triples','quads','penta'].includes(wR.type);
    if (chesterIsDoubles) {
      // Doubles+: +1 Healing Seed AND +2 Burn (granted as resource, player places via burn picker)
      queueAbility('WELL READ!', 'var(--uncommon)', `${wF.name} — Doubles+ Win! +1 Healing Seed + 2 Burn!`, () => {
        winTeam.resources.healingSeed++;
        if (!winTeam.resources.burn) winTeam.resources.burn = 0;
        winTeam.resources.burn += 2;
        renderBattle();
      }, winTeamName);
      log(`<span class="log-ability">${wF.name}</span> — Well Read! +1 Healing Seed + 2 Burn!`);
    } else {
      queueAbility('WELL READ!', 'var(--uncommon)', `${wF.name} — Win! +1 Healing Seed!`, () => { winTeam.resources.healingSeed++; renderBattle(); }, winTeamName);
      log(`<span class="log-ability">${wF.name}</span> — Well Read! +1 Healing Seed!`);
    }
    checkKnightEffects(winTeamName, wF.name);
  }

  // Nick & Knack (409) — Knick Knack: steal is pre-roll now (win trigger removed)

  // Zippa (423) — Glimmer: reworked — +1 damage per Healing Seed held

  // Mable Stadango (446) — Hex: Win → +1 Burn
  if (wF.id === 446 && !wF.ko) {
    queueAbility('HEX!', 'var(--uncommon)', `${wF.name} — Win! +1 Burn!`, () => {
      if (!winTeam.resources.burn) winTeam.resources.burn = 0;
      winTeam.resources.burn += 1;
      renderBattle();
    }, winTeamName);
    log(`<span class="log-ability">${wF.name}</span> — Hex! Win → +1 Burn!`);
    checkKnightEffects(winTeamName, wF.name);
  }
  // Mable Stadango (446) — Hex: in play only, no sideline win trigger

  // Starling (441) — Moonbeam: Win with doubles+ → +1 Moonstone + 1 Magic Firefly
  if (wF.id === 441 && !wF.ko && ['doubles','triples','quads','penta'].includes(wR.type)) {
    const _starWTeam = winTeam;
    const _starSandOpp = opp(winTeam);
    queueAbility('MOONBEAM!', 'var(--rare)', `${wF.name} — Doubles+ Win! +1 Magic Firefly!`, () => {
      _starWTeam.resources.firefly = (_starWTeam.resources.firefly || 0) + 1;
      log(`<span class="log-ability">${wF.name}</span> — Moonbeam! +1 Magic Firefly!`);
      renderBattle();
    }, winTeamName);
    checkKnightEffects(winTeamName, wF.name);
  }

  // Harvey (448) — Harvest Moon: Win: +1 damage per 5 rolled, gain 1 Moonstone if any 5s (v799 — added damage)
  if (wF.id === 448 && !wF.ko) {
    const fives = winDice.filter(d => d === 5).length;
    if (fives > 0) {
      const harveyDmg = fives;
      queueAbility('HARVEST MOON!', 'var(--ghost-rare)', `${wF.name} — Win with ${fives} five${fives > 1 ? 's' : ''}! +${harveyDmg} damage + 1 Moonstone!`, () => {
        const lF = active(loseTeam);
        if (lF && !lF.ko) {
          lF.hp = Math.max(0, lF.hp - harveyDmg);
          log(`<span class="log-ability">${wF.name}</span> — Harvest Moon! ${fives} five${fives > 1 ? 's' : ''} → <span class="log-dmg">${harveyDmg} bonus damage</span> + <span class="log-ms">1 Moonstone</span>!`);
          if (lF.hp <= 0) { lF.ko = true; }
        }
        winTeam.resources.moonstone = Math.min((winTeam.resources.moonstone || 0) + 1, 1);
        renderBattle();
      }, winTeamName);
      checkKnightEffects(winTeamName, wF.name);
      if (sandwichForLose) {
        queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Harvest Moon! +1 Moonstone!`, () => { loseTeam.resources.moonstone = Math.min((loseTeam.resources.moonstone || 0) + 1, 1); renderBattle(); }, loseTeamName);
      }
    }
  }

  // Gordok (430) — River Terror: callout for steal (logic applied pre-damage) — only for autoPlay (human uses modal)
  if (gordokStole && !B.gordokPending) {
    queueAbility('RIVER TERROR!', 'var(--rare)', `${wF.name} — stole resources instead of dealing damage! +1 Moonstone!`, null, winTeamName);
  }

  // Pal Al (431) — Squall: callout for ice gain (logic applied pre-damage) — only for autoPlay (human uses modal)
  if (wiseAlSqualled && !B.wiseAlPending) {
    queueAbility('SQUALL!', 'var(--rare)', `${wF.name} — +4 Ice Shards instead of dealing damage!`, null, winTeamName);
  }

  // Garrick (427) — Watchfire: Win + KO → +1 Sacred Fire
  if (wF.id === 427 && !wF.ko && lF.ko) {
    queueAbility('WATCHFIRE!', 'var(--uncommon)', `${wF.name} — KO! +1 Sacred Fire!`, () => { winTeam.resources.fire++; renderBattle(); }, winTeamName);
    log(`<span class="log-ability">${wF.name}</span> — Watchfire! KO → <span class="log-ms">+1 Sacred Fire!</span>`);
    checkKnightEffects(winTeamName, wF.name);
  }

  // Nyx & Bessie (415) — Moo! Caw!: sideline KO → 3 Healing Seeds
  // Cornelius (45) Antidote blocks Nyx & Bessie's sideline effect
  const corneliusBlocksNyx = hasSideline(loseTeam, 45);
  if (hasSideline(winTeam, 415) && !wF.ko && lF.ko && !corneliusBlocksNyx) {
    const nyxG = getSidelineGhost(winTeam, 415);
    const nyxName = nyxG ? nyxG.name : 'Nyx & Bessie';
    queueAbility('MOO! CAW!', 'var(--uncommon)', `${nyxName} (sideline) — KO! +4 Healing Seeds!`, () => { winTeam.resources.healingSeed += 4; renderBattle(); }, winTeamName);
    log(`<span class="log-ability">${nyxName}</span> — Moo! Caw! KO → <span class="log-heal">+4 Healing Seeds!</span>`);
    checkKnightEffects(winTeamName, wF.name);
  } else if (hasSideline(winTeam, 415) && !wF.ko && lF.ko && corneliusBlocksNyx) {
    const cornGhostNyx = getSidelineGhost(loseTeam, 45);
    queueAbility('ANTIDOTE!', 'var(--uncommon)', `${cornGhostNyx ? cornGhostNyx.name : 'Cornelius'} blocks Nyx & Bessie's Moo! Caw!!`, null, loseTeamName);
    log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Nyx & Bessie Moo! Caw! blocked!`);
  }

  // Valkin the Grand (432) — Grand Spoils: active Valkin KO → full resource suite
  if (wF.id === 432 && !wF.ko && lF.ko) {
    queueAbility('GRAND SPOILS!', 'var(--legendary)', `${wF.name} — KO! Grand Spoils: +1 Fire, +2 Ice, +1 Lucky, +1 Moon, +2 Seed!`, () => {
      winTeam.resources.fire += 1;
      winTeam.resources.ice += 2;
      winTeam.resources.luckyStone += 1;
      winTeam.resources.moonstone += 1;
      winTeam.resources.healingSeed += 2;
      renderBattle();
    }, winTeamName);
    log(`<span class="log-ability">${wF.name}</span> — Grand Spoils! KO → <span class="log-ms">+1🔥 +2❄️ +1🍀 +1🌙 +2🌱!</span>`);
    checkKnightEffects(winTeamName, wF.name);
  }

  // Bo (109) — Miracle callout: fires after enemy KO effects; onShow applies the revive so the
  // resurrection is visually synchronized with the legendary splash rather than jumping the HP bar.
  // Vigil (433) sideline — Kindling: +6 Sacred Fires on any resurrection.
  // Both triggers also fire for any future resurrection sources (e.g. Shepherd's Flock 360 when implemented).
  if (boMiracleTarget) {
    const bt = boMiracleTarget; // capture for closure
    // If resurrecting a transformed ghost (Bigsby→Doom), restore original identity
    if (bt.originalId) {
      bt.id = bt.originalId; bt.name = bt.originalName; bt.art = bt.originalArt;
      bt.maxHp = bt.originalMaxHp; bt.ability = bt.originalAbility;
      bt.abilityDesc = bt.originalAbilityDesc; bt.rarity = bt.originalRarity;
      delete bt.originalId; delete bt.originalName; delete bt.originalArt;
      delete bt.originalMaxHp; delete bt.originalAbility; delete bt.originalAbilityDesc; delete bt.originalRarity;
    }
    const lucasActive = hasSideline(winTeam, 433);
    const calloutText = `${wF.name} — KO! ${bt.name} resurrected to sideline at 1 HP + 1 Magic Firefly!`;
    queueAbility('MIRACLE!', 'var(--legendary)', calloutText, () => {
      bt.ko = false;
      bt.hp = 1;
      winTeam.resources.firefly = Math.min((winTeam.resources.firefly || 0) + 1, 1); // v736: was 3
      log(`<span class="log-ability">Bo</span> — Miracle! <span class="log-heal">${bt.name} revived at 1 HP!</span> <span class="log-ms">+1 Magic Firefly!</span>`);
      if (lucasActive) {
        // Lucas (433) — Kindling: revived ghost enters play at 4 HP, Bo to sideline, +1 die next roll
        bt.hp += 3; // 1 + 3 = 4 HP total
        const revivedIdx = winTeam.ghosts.indexOf(bt);
        if (revivedIdx !== -1) winTeam.activeIdx = revivedIdx; // swap revived ghost to active
        if (!B.lucasKindlingBonus) B.lucasKindlingBonus = { red: 0, blue: 0 };
        B.lucasKindlingBonus[winTeamName] = 1; // +1 die next roll
        log(`<span class="log-ability">Lucas</span> — Kindling! <span class="log-heal">${bt.name} charges into play at ${bt.hp} HP! +1 die next roll!</span>`);
        queueAbility('KINDLING!', 'var(--rare)', `Lucas — ${bt.name} charges into play at ${bt.hp} HP! +3 HP, +1 die next roll!`, null, winTeamName);
      }
      renderBattle();
    }, winTeamName);
  }

  // Kairan (68) — Let's Dance: rolling doubles (win or lose) → +1 die next roll
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tNameKai = team === B.red ? 'red' : 'blue';
    const kaiRoll = team === B.red ? rR : bR;
    if (f.id === 68 && !f.ko && kaiRoll.type === 'doubles') {
      B.letsDanceBonus[tNameKai] = (B.letsDanceBonus[tNameKai] || 0) + 1;
      const ctx = f === wF ? 'Winner doubles' : 'Loser doubles still counts';
      queueAbility("LET'S DANCE!", 'var(--rare)', `${f.name} — ${ctx}! +1 die next roll!`, null, tNameKai);
      checkKnightEffects(tNameKai, f.name); // Knight Terror / Knight Light react to LET'S DANCE!
      log(`<span class="log-ability">${f.name}</span> — Let's Dance! Doubles → +1 die next round.`);
    }
  });

  // Outlaw (43) — Thief: doubles → remove 1 enemy die next roll.
  // Farewell pattern (Wyatt 2026-04-11): a dying Outlaw still plants the die
  // penalty on the enemy for next round. Uses wF/lF so a KO'd Outlaw still fires.
  // Indexing note: B.outlawStolenDie[myTName] keys by Outlaw's OWN team — the
  // consumption block at line ~7199 reads it that way and subtracts from the enemy.
  [[wF, wR, winTeamName], [lF, lR, loseTeamName]].forEach(([f, roll, myTName]) => {
    if (f.id !== 43) return;
    if (roll.type !== 'doubles') return;
    B.outlawStolenDie[myTName] = (B.outlawStolenDie[myTName] || 0) + 1;
    const ctx = f === wF ? 'Winner doubles' : (f.ko ? 'Final doubles' : 'Loser doubles');
    queueAbility('THIEF!', 'var(--uncommon)', `${f.name} — ${ctx}! Stealing 1 die from enemy next round!`, null, myTName);
    checkKnightEffects(myTName, f.name);
    log(`<span class="log-ability">${f.name}</span> — Thief! ${ctx} → steal 1 enemy die next round.`);
  });

  // Suspicious Jeff (61) — Snicker: sideline passive — when your ghost DEFEATS an enemy ghost (lF.ko), steal 1 enemy die next roll.
  // "Wins a battle" = KO the enemy, NOT merely winning a roll. Same family correction as Jeffery Chuckle.
  if (hasSideline(winTeam, 61) && !wF.ko && lF.ko) {
    const jeffSideF = getSidelineGhost(winTeam, 61);
    const jeffName = jeffSideF ? jeffSideF.name : 'Suspicious Jeff';
    B.jeffSnicker[winTeamName] = (B.jeffSnicker[winTeamName] || 0) + 1;
    queueAbility('SNICKER!', 'var(--uncommon)', `${jeffName} (sideline) — Your ghost won! Stealing 1 die from ${lF.name} next round!`, null, winTeamName);
    log(`<span class="log-ability">${jeffName}</span> — Snicker! Win → steal 1 enemy die next round.`);
  }

  // Haywire (78) — Wild Chords: rolling triples or better grants +1 permanent die AND Haywire +2 damage for the rest of the game (once per game, win or lose)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tNameHW = team === B.red ? 'red' : 'blue';
    const hwRoll = team === B.red ? rR : bR;
    if (f.id === 78 && !f.ko && isTripleOrBetter(hwRoll.type) && B.haywireUsed && !B.haywireUsed[tNameHW]) {
      B.haywireBonus[tNameHW] = (B.haywireBonus[tNameHW] || 0) + 1;
      B.haywireDamageBonus[tNameHW] = 2;
      B.haywireUsed[tNameHW] = true;
      queueAbility('WILD CHORDS!', 'var(--rare)', `${f.name} — Triples or better! +1 permanent die AND Haywire gains +2 damage for the rest of the game! (Once per game)`, null, tNameHW);
      log(`<span class="log-ability">${f.name}</span> — Wild Chords! Triples or better → +1 permanent die + Haywire +2 damage for the rest of the game!`);
      checkKnightEffects(tNameHW, f.name);
    }
  });

  // Sable (413) — Smoldering Soul: all odd dice → +1 Sacred Fire (active or sideline, win/loss path)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tNameSable = team === B.red ? 'red' : 'blue';
    const sableDice = team === B.red ? redDice : blueDice;
    const hasSableActive = f.id === 413 && !f.ko;
    const hasSableSideline = hasSideline(team, 413);
    if ((hasSableActive || hasSableSideline) && sableDice && sableDice.length > 0 && sableDice.every(d => d % 2 === 1)) {
      team.resources.fire++;
      const sableName = hasSableActive ? f.name : (getSidelineGhost(team, 413) || { name: 'Sable' }).name;
      const sableLoc = hasSableActive ? '' : ' (sideline)';
      queueAbility('SMOLDERING SOUL!', 'var(--uncommon)', `${sableName}${sableLoc} — All dice odd! +1 Sacred Fire!`, null, tNameSable);
      log(`<span class="log-ability">${sableName}</span> — Smoldering Soul! All dice odd → <span class="log-ms">+1 Sacred Fire!</span>`);
      checkKnightEffects(tNameSable, sableName);
    }
  });

  // Pip (418) — Toasted: triples+ → remove 1 enemy die permanently + 2 Sacred Fires (once per game, win/loss path)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tNamePip = team === B.red ? 'red' : 'blue';
    const pipRoll = team === B.red ? rR : bR;
    if (f.id === 418 && !f.ko && isTripleOrBetter(pipRoll.type) && B.pipToastedUsed && !B.pipToastedUsed[tNamePip]) {
      B.pipToastedUsed[tNamePip] = true;
      const oppName = tNamePip === 'red' ? 'blue' : 'red';
      B.pipDieRemoval[oppName] = (B.pipDieRemoval[oppName] || 0) + 1;
      team.resources.fire += 2;
      queueAbility('TOASTED!', 'var(--rare)', `${f.name} — ${pipRoll.type}! Enemy permanently loses 1 die + 2 Sacred Fires! (Once per game)`, null, tNamePip);
      log(`<span class="log-ability">${f.name}</span> — Toasted! ${pipRoll.type} → enemy -1 die permanently + <span class="log-ms">+2 Sacred Fires!</span>`);
      checkKnightEffects(tNamePip, f.name);
    }
  });

  // Dream Cat (28) — Jinx: if BOTH teams rolled doubles, Dream Cat gains +2 dice next round
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    if (f.id === 28 && !f.ko) {
      const tNameDC = team === B.red ? 'red' : 'blue';
      const ownRoll = team === B.red ? rR : bR;
      const foeRoll = team === B.red ? bR : rR;
      if (ownRoll.type === 'doubles' && foeRoll.type === 'doubles') {
        B.dreamCatBonus[tNameDC] = (B.dreamCatBonus[tNameDC] || 0) + 2;
        queueAbility('JINX!', 'var(--common)', `${f.name} — Both teams rolled doubles! +2 dice next round!`, null, tNameDC);
        log(`<span class="log-ability">${f.name}</span> — Jinx! Both rolled doubles → +2 dice next round.`);
        checkKnightEffects(tNameDC, f.name);
      }
    }
  });

  // Scallywags (19) — Frenzy: if Scallywags' own dice are all under 4, gain +1 die next round.
  // Farewell pattern (Wyatt 2026-04-11): fires even if Scallywags is KO'd by this roll
  // — the +1 die is granted to the team (his replacement) as his parting gift.
  // Uses wF/lF (captured pre-damage) and winDice/loseDice so Scallywags's death
  // mid-round does not drop the ability.
  [[wF, winDice, winTeamName], [lF, loseDice, loseTeamName]].forEach(([f, dice, myTName]) => {
    if (f.id !== 19) return;
    if (!dice || dice.length === 0 || !dice.every(d => d < 4)) return;
    B.scallywagsFrenzyBonus[myTName] = (B.scallywagsFrenzyBonus[myTName] || 0) + 1;
    const _scTeam = B[myTName];
    _scTeam.resources.surge = (_scTeam.resources.surge || 0) + 1;
    const ctx = f === wF ? 'Win' : (f.ko ? 'Down' : 'Loss');
    queueAbility('FRENZY!', 'var(--common)', `${f.name} — ${ctx}! All dice under 4! +1 die next roll + 1 Surge!`, null, myTName);
    log(`<span class="log-ability">${f.name}</span> — Frenzy! ${ctx}: all dice under 4 → +1 die next round + <span class="log-ms">+1 Surge</span>.`);
    checkKnightEffects(myTName, f.name);
  });

  // Floop (20) — Muck: if opponent rolled doubles, they lose 1 die next round.
  // Fires whenever Floop was the ACTIVE fighter at roll time — win, lose, OR killed.
  // Uses wF/lF (captured pre-damage at line ~9025) instead of active(team) so a
  // dying Floop still triggers Muck, and skips the !f.ko gate entirely.
  // Wyatt spec 2026-04-11: "No ifs, ands, or buts."
  [[wF, winTeamName, lR, loseTeamName], [lF, loseTeamName, wR, winTeamName]].forEach(([f, myTName, enemyRoll, enemyTName]) => {
    if (f.id !== 20) return;
    if (enemyRoll.type !== 'doubles') return;
    B.floopMuck[enemyTName] = (B.floopMuck[enemyTName] || 0) + 1;
    const ctx = f === wF ? 'Win' : (f.ko ? 'Down' : 'Loss');
    const enemyName = f === wF ? lF.name : wF.name;
    queueAbility('MUCK!', 'var(--common)', `${f.name} — ${ctx}! ${enemyName} rolled doubles → they lose 1 die next round!`, null, myTName);
    log(`<span class="log-ability">${f.name}</span> — Muck! ${enemyName} rolled doubles → -1 die next round.`);
    checkKnightEffects(myTName, f.name);
  });

  // Logey (26) — Heinous: win/lose — count opponent's 5+ dice, lock them out next roll
  // Farewell pattern (Wyatt 2026-04-11): dying Logey still locks out enemy 5+ dice.
  if (wF.id === 26) {
    const locked = (loseDice || []).filter(d => d >= 5).length;
    if (locked > 0) {
      B.logeyLockout[loseTeamName] = (B.logeyLockout[loseTeamName] || 0) + locked;
      const wCtx = wF.ko ? 'Down' : 'Win';
      queueAbility('HEINOUS!', 'var(--common)', `${wF.name} — ${wCtx}! ${locked} of ${lF.name}'s 5+ dice locked out next roll!`, null, winTeamName);
      log(`<span class="log-ability">${wF.name}</span> — Heinous! ${wCtx}: locked ${locked} of ${lF.name}'s 5+ dice.`);
    }
  }
  if (lF.id === 26) {
    const locked = (winDice || []).filter(d => d >= 5).length;
    if (locked > 0) {
      B.logeyLockout[winTeamName] = (B.logeyLockout[winTeamName] || 0) + locked;
      const lCtx = lF.ko ? 'Down' : 'Loss';
      queueAbility('HEINOUS!', 'var(--common)', `${lF.name} — ${lCtx}! ${locked} of ${wF.name}'s 5+ dice locked out next roll!`, null, loseTeamName);
      log(`<span class="log-ability">${lF.name}</span> — Heinous! ${lCtx}: locked ${locked} of ${wF.name}'s 5+ dice.`);
    }
  }

  // End-of-round callouts — Maximo seed granted with NAP! splash via onShow
  // Sandwiches (33) — Dependable: if opponent gains a seed, you mirror it.
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    if (f.id === 302 && !f.ko) {
      const isWinSide = team === winTeam;
      const sandwichMirrors = isWinSide ? sandwichForLose : sandwichForWin;
      const oppTeam         = isWinSide ? loseTeam : winTeam;
      queueAbility('NAP!', 'var(--common)', `${f.name} — round ends, +1 Healing Seed and +1 Lucky Stone!`, () => { team.resources.healingSeed++; team.resources.luckyStone++; renderBattle(); }, team === B.red ? 'red' : 'blue');
      // Maximo knight reactions already collected via collectKC at game-state section (line ~10155) — do NOT double-fire here
      if (sandwichMirrors) queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Nap! +1 Healing Seed + 1 Lucky Stone!`, () => { oppTeam.resources.healingSeed++; oppTeam.resources.luckyStone++; renderBattle(); }, isWinSide ? loseTeamName : winTeamName);
    }
  });

  // Knight reactions (HEAVY AIR!/RETRIBUTION!) collected from all pre-cinematic ability triggers.
  // These play last in the queue — after all ability callouts — so each Knight reaction follows
  // the full round's events rather than firing synchronously and being stomped.
  resolveKnightCallouts.forEach(kc => queueAbility(kc.name, kc.color, kc.desc, kc.onShow, kc.team));

  abilityQueueMode = false;

  // ========================================
  // CINEMATIC PLAYBACK — damage hits first, then abilities sequence
  // ========================================
  // ========================================
  // CINEMATIC BEATS — pauses let each moment land
  // ========================================
  // Beat 1: Announce the winner (pause to let dice highlight register)
  let beatTimer = 0;
  const BEAT_ANNOUNCE = 600;  // pause after dice highlight, before narration
  const BEAT_DAMAGE  = 800;   // pause after narration, before damage hit
  const BEAT_HP      = 500;   // pause after hit animation, before HP bar drops
  const BEAT_POST    = 800;   // pause after HP update, before ability queue

  setTimeout(() => {
    // Beat 2: Narration
    if (dmg > 0) {
      let dmgNarr = '';
      if (wR.type === 'penta') {
        dmgNarr = `IMPOSSIBLE! FIVE ${wR.value}'s! <b class="${winColor}">${wF.name}</b> unleashes <b class="gold">${dmg} damage</b>!`;
      } else if (wR.type === 'quads') {
        dmgNarr = `DEVASTATING! <b class="${winColor}">${wF.name}</b> slams FOUR ${wR.value}'s! <b class="gold">${dmg} damage</b>!`;
      } else if (wR.type === 'triples') {
        dmgNarr = `<b class="${winColor}">${wF.name}</b> CRUSHES with triple ${wR.value}'s! <b class="gold">${dmg} damage</b> rocks <b class="${loseColor}">${lF.name}</b>!`;
      } else if (wR.type === 'doubles') {
        dmgNarr = `<b class="${winColor}">${wF.name}</b> lands a solid hit with double ${wR.value}'s — <b class="gold">${dmg} damage</b> to <b class="${loseColor}">${lF.name}</b>!`;
      } else {
        dmgNarr = `<b class="${winColor}">${wF.name}</b> edges out <b class="${loseColor}">${lF.name}</b> — <b class="gold">${dmg} damage</b>!`;
      }
      narrate(dmgNarr);

      // Beat 3: Damage hit (after narration sinks in)
      setTimeout(() => {
        playDamageSfx(dmg);
        const hitEl = document.getElementById(loseTeamName + '-fighter');
        hitEl.classList.add('hit');
        setTimeout(() => hitEl.classList.remove('hit'), 500);

        // Beat 4: HP bar drops (after hit animation)
        setTimeout(() => {
          updateHpBar(loseTeamName, lF.hp, lF.maxHp);
          if (lF.ko) {
            playSfx('sfxShatter', 0.7);
            narrate(`<b class="ko-text">${lF.name} goes down!</b>&nbsp;<b class="${winColor}">${wF.name}</b> stands victorious!`);
          } else {
            narrate(`<b class="${loseColor}">${lF.name}</b> holds on — <b class="gold">${lF.hp} HP</b> remaining.`);
          }
          renderBattle();
        }, BEAT_HP);
      }, BEAT_DAMAGE);
    } else {
      if (gusGaleReactiveTriggered) {
        narrate(`<b class="${winColor}">${wF.name}</b> wins! <b class="gold">💨 GALE FORCE?</b> — choose to force a swap!`);
      } else {
        narrate(`<b class="${winColor}">${wF.name}</b> wins the roll but deals 0 damage!`);
      }
    }
  }, BEAT_ANNOUNCE);

  // Pudge self-damage visual (after all damage beats)
  const pudgeDelay = BEAT_ANNOUNCE + BEAT_DAMAGE + BEAT_HP + 400;
  if (pudgeSelfDmgApplied) {
    setTimeout(() => {
      playDamageSfx(1);
      hitDamage(winTeamName);
    }, pudgeDelay);
  }

  // Ability queue drains after all damage beats finish.
  // dmg=0 path: the "deals 0 damage" narration fires at BEAT_ANNOUNCE (600ms) and holds
  // its drainNarrate lock for 1800ms (until t=2400ms).  With the old value of
  // BEAT_ANNOUNCE+200=800ms the drain callback fired at t=800ms — well inside the
  // narration window.  The no-KO path then called narrate("Round N") at t=1550ms, but
  // that message queued behind the still-active 0-damage lock and didn't display until
  // t=2400ms, while roll buttons went live at t=1900ms — a 500ms window where buttons
  // were clickable but zero round-context was visible.
  // Fix: wait BEAT_ANNOUNCE + 1800 + 200 = 2600ms so the callback fires 200ms after the
  // 0-damage narration releases, giving "Round N — X vs Y" a clear slot to display
  // immediately before roll buttons activate.  For non-empty queues the ability callouts
  // also now fire after the 0-damage line clears (more cinematically correct).
  const totalDmgBeats = dmg > 0 ? (BEAT_ANNOUNCE + BEAT_DAMAGE + BEAT_HP + BEAT_POST) : (BEAT_ANNOUNCE + 1800 + 200);
  const dmgDelay = totalDmgBeats;
  setTimeout(() => {
    drainAbilityQueue(() => {
      // Prince Balatron (113) — Party Time: if the loser is Balatron, fire the
      // interactive counter-die modal FIRST (before any round state is reset)
      // so the reveal lands on top of the current scene. Once the player clicks
      // and the shuffle finishes, finishBalatronRoll() calls runPostDrain() to
      // continue with the normal reset + modal chain.
      const runPostDrain = () => {
      // Reset committed resources + per-round ability flags
      B.committed.red = { ice:0, fire:0, surge:0, auntSusan:0, auntSusanHeal:0, harrison:0, zainBlade:0 };
      B.committed.blue = { ice:0, fire:0, surge:0, auntSusan:0, auntSusanHeal:0, harrison:0, zainBlade:0 };
      B.pressureUsed = { red: false, blue: false };
      if (B.romyPrediction) { B.romyPrediction.red = null; B.romyPrediction.blue = null; }
      if (B.guardianFairyStandby) { B.guardianFairyStandby.red = false; B.guardianFairyStandby.blue = false; }
      if (B.eloiseUsedThisRound) { B.eloiseUsedThisRound.red = false; B.eloiseUsedThisRound.blue = false; }
      // bogeyArmed removed v430 — Bogey reflect is now reactive (no pre-arm state)
      // galeForceDecided reset removed — Gus is now reactive post-win
      if (B.jacksonUsedThisRound) { B.jacksonUsedThisRound.red = false; B.jacksonUsedThisRound.blue = false; }
      if (B.sonyaUsedThisRound) { B.sonyaUsedThisRound.red = false; B.sonyaUsedThisRound.blue = false; }
      // Dark Wing (76) Precision: NO per-round reset — once-per-GAME flag persists across rounds (v595)
      if (B.mallowDecided) { B.mallowDecided.red = false; B.mallowDecided.blue = false; }
      // fangUndercoverSwapPending already consumed above; clear arm flag for safety
      if (B.fangUndercoverArmed) { B.fangUndercoverArmed.red = false; B.fangUndercoverArmed.blue = false; }
      if (B.tylerDecidedThisRound) { B.tylerDecidedThisRound.red = false; B.tylerDecidedThisRound.blue = false; }
      if (B.booTeamworkDecidedThisRound) { B.booTeamworkDecidedThisRound.red = false; B.booTeamworkDecidedThisRound.blue = false; }
      if (B.luckyStoneSpentThisTurn) { B.luckyStoneSpentThisTurn.red = 0; B.luckyStoneSpentThisTurn.blue = 0; }
    if (B.preRollAbilitiesFiredThisTurn) { B.preRollAbilitiesFiredThisTurn.red = false; B.preRollAbilitiesFiredThisTurn.blue = false; } B.moonstoneSicknessFiredThisTurn = false;
      // Willow (435) — Joy of Painting: winner didn't lose, loser did
      if (B.willowLostLast) { B.willowLostLast[winTeamName] = false; B.willowLostLast[loseTeamName] = true; }
      // Reset item swing toggles each round (player must actively choose to swing)
      if (B.flameBladeSwing) { B.flameBladeSwing.red = false; B.flameBladeSwing.blue = false; }
      if (B.iceBladeSwing) { B.iceBladeSwing.red = false; B.iceBladeSwing.blue = false; }
      // Toby — Pure Heart: carry forward the scheduled KO flag, then clear declaration
      if (B.pureHeartDeclared) {
        if (B.pureHeartDeclared.red === true && B.pureHeartScheduledKO) B.pureHeartScheduledKO.red = true;
        if (B.pureHeartDeclared.blue === true && B.pureHeartScheduledKO) B.pureHeartScheduledKO.blue = true;
        B.pureHeartDeclared.red = null;
        B.pureHeartDeclared.blue = null;
      }

      // MVP round credit: diff team resources + ghost HPs against the pre-roll snapshot
      try { creditRoundDelta(winTeamName); } catch (e) { console.warn('[MVP] credit failed:', e); }

      // Duel Phase: record this round's loser so they get first move next round
      B.duelLastLoser = loseTeamName;

      B.round++;
      B.preRoll = null;
      // Re-render dice then re-apply highlights SYNCHRONOUSLY in the same tick.
      // The previous code used setTimeout(10) which allowed the browser to paint
      // one neutral frame between innerHTML wipe and highlight re-apply — visible
      // as a ~6-frame flash where winners shrank to scale(1.0) and losers grew
      // from scale(0.94) to scale(1.0), making it look like the losing dice briefly
      // became the winners. Calling highlight synchronously coalesces both DOM
      // changes into one paint.
      renderDice(redDice, blueDice);
      highlightWinnerDice(winTeamName, wR, loseTeamName, tiebreaker);

      // Calvin & Anna (91) — Toboggan: when C&A scores a KO, offer to swap with sideline ghost
      const tobogganAlive = (wF.id === 91 && !wF.ko && lF.ko)
        ? winTeam.ghosts.filter((g, i) => i !== winTeam.activeIdx && !g.ko)
        : [];

      // Fang Outside (6) — Skillful Coward: after any win, offer to swap Fang to sideline
      const fangOutsideAlive = (wF.id === 6 && !wF.ko)
        ? winTeam.ghosts.filter((g, i) => i !== winTeam.activeIdx && !g.ko)
        : [];

      // Winston (15) — Scheme: any win → offer to force-swap opponent's active ghost + gain 2 dice next roll
      const winstonSchemeSideline = (wF.id === 15 && !wF.ko)
        ? loseTeam.ghosts.filter((g, i) => i !== loseTeam.activeIdx && !g.ko)
        : [];

      const proceedToKoHandling = () => {
        // Live PvP: broadcast state after damage so Blue sees HP changes in near-real-time
        pvpBroadcastState({ event: 'damageResolved' });
        if (lF.ko) {
          B.phase = 'ko-pause';
          renderBattle();
          setTimeout(() => {
            if (!handleKOs()) {
              narrate(`<b class="gold">Round ${B.round}</b> — <b class="red-text">${active(B.red).name}</b>&nbsp;vs&nbsp;<b class="blue-text">${active(B.blue).name}</b>`);
              renderBattle();
              setTimeout(() => { startNextRound(); }, spd(350));
            }
          }, spd(900)); // v729: was 1800ms — tightened so swap picker appears faster
        } else {
          B.phase = 'ko-pause';
          renderBattle();
          setTimeout(() => {
            if (!handleKOs()) {
              // Narrate the new matchup first, then enable roll buttons 350ms later —
              // gives the player a beat to read "Round N — X vs Y" before the game unblocks.
              narrate(`<b class="gold">Round ${B.round}</b> — <b class="red-text">${active(B.red).name}</b>&nbsp;vs&nbsp;<b class="blue-text">${active(B.blue).name}</b>`);
              renderBattle();
              setTimeout(() => { startNextRound(); }, spd(350));
            }
          }, spd(750));
        }
      };

      // Fang Undercover (7) — Skilled Coward: if dodge was activated this round, show ghost-picker for lose team
      const fuSwapTeam = B.fangUndercoverSwapPending;
      B.fangUndercoverSwapPending = null;

      // Tyson (365) — Hop: win → choose enemy sideline ghost to disable
      const checkTysonHop = () => {
        if (wF.id === 365 && !wF.ko) {
          const tysonTargets = loseTeam.ghosts.filter((g, i) => i !== loseTeam.activeIdx && !g.ko && !B.tysonDisabled[loseTeamName].includes(i));
          if (tysonTargets.length > 0) {
            showTysonHopPicker(winTeamName, loseTeamName, tysonTargets, proceedToKoHandling);
            return;
          }
        }
        proceedToKoHandling();
      };

      // Winston (15) — Scheme: fires after Toboggan/FangOutside, before Tyson
      const checkWinstonScheme = () => {
        // Barnaby (326) — Stubborn: immune to opponent forced swaps
        const _barnabyWin = active(loseTeam);
        if (_barnabyWin && _barnabyWin.id === 326 && !_barnabyWin.ko && winstonSchemeSideline.length > 0) {
          queueAbility('STUBBORN!', 'var(--uncommon)', `${_barnabyWin.name} — Stubborn! Winston's Scheme is blocked!`, null, loseTeamName);
          log(`<span class="log-ability">Barnaby</span> — Stubborn! Winston Scheme blocked — ${_barnabyWin.name} cannot be forced out.`);
          checkTysonHop();
          return;
        }
        if (winstonSchemeSideline.length > 0) {
          showWinstonSchemeModal(winTeamName, loseTeamName, winstonSchemeSideline, checkTysonHop);
        } else {
          checkTysonHop();
        }
      };

      const afterFangUndercover = () => {
        if (tobogganAlive.length > 0) {
          showTobogganModal(winTeamName, tobogganAlive, checkWinstonScheme);
        } else if (fangOutsideAlive.length > 0) {
          showFangOutsideModal(winTeamName, fangOutsideAlive, checkWinstonScheme);
        } else {
          checkWinstonScheme();
        }
      };

      // Gus (31) — Gale Force: win → force swap, new ghost takes the damage.
      const checkGaleForcePicker = () => {
        if (galeForceSwap && !wF.ko) {
          // Barnaby (326) — Stubborn: immune to opponent forced swaps; takes galeForceDmg directly
          const _barnabyGF = active(loseTeam);
          if (_barnabyGF && _barnabyGF.id === 326 && !_barnabyGF.ko) {
            queueAbility('STUBBORN!', 'var(--uncommon)', `${_barnabyGF.name} — Stubborn! Gus's Gale Force is blocked!`, () => {
              log(`<span class="log-ability">Barnaby</span> — Stubborn! Gale Force blocked — ${_barnabyGF.name} takes ${galeForceDmg} damage directly.`);
              _barnabyGF.hp = Math.max(0, _barnabyGF.hp - galeForceDmg);
              if (_barnabyGF.hp <= 0) { _barnabyGF.ko = true; _barnabyGF.killedBy = 31; }
              renderBattle();
              afterFangUndercover();
            }, loseTeamName);
            return;
          }
          B._galeForceDmg = galeForceDmg; // stash for picker
          const gfAlive = loseTeam.ghosts.filter((g, i) => i !== loseTeam.activeIdx && !g.ko);
          if (gfAlive.length > 1) {
            showGaleForcePickerModal(winTeamName, loseTeamName, gfAlive, afterFangUndercover);
            return;
          } else if (gfAlive.length === 1) {
            // Only 1 option — auto-swap + apply damage
            const autoTarget = gfAlive[0];
            loseTeam.activeIdx = loseTeam.ghosts.indexOf(autoTarget);
            if (galeForceDmg > 0) {
              autoTarget.hp = Math.max(0, autoTarget.hp - galeForceDmg);
              if (autoTarget.hp <= 0) { autoTarget.hp = 0; autoTarget.ko = true; autoTarget.killedBy = 31; }
            }
            renderBattle();
            log(`<span class="log-ability">Gus</span> — Gale Force! ${autoTarget.name} was the only option — enters and takes <span class="log-dmg">${galeForceDmg} damage!</span>${autoTarget.ko ? ' <span class="log-ko">KO!</span>' : ' ' + autoTarget.hp + ' HP left'}`);
            const entryCount = triggerEntry(loseTeam, false);
            afterEntryWithJenkins(entryCount, afterFangUndercover);
            return;
          }
        }
        afterFangUndercover();
      };

      if (fuSwapTeam) {
        const fuTeam = B[fuSwapTeam];
        const fuSidelineGhosts = fuTeam.ghosts.filter((g, i) => i !== fuTeam.activeIdx && !g.ko);
        if (fuSidelineGhosts.length > 0) {
          showFangUndercoverSwapModal(fuSwapTeam, fuSidelineGhosts, checkGaleForcePicker);
        } else {
          // No sideline ghosts (all KO'd since the arm was set) — just proceed
          checkGaleForcePicker();
        }
      } else {
        checkGaleForcePicker();
      }
      }; // end runPostDrain

      // Sky Elusive modal: show after Jasper if pending
      const afterSkyElusive = () => {
        runPostDrain();
      };
      // Jasper Flame Dive modal: show after Balatron if pending
      const afterJasper = () => {
        if (B.skyElusivePending) {
          showSkyElusiveModal(afterSkyElusive);
        } else {
          afterSkyElusive();
        }
      };
      const afterBalatron = () => {
        if (B.jasperPending) {
          showJasperModal(afterJasper);
        } else {
          afterJasper();
        }
      };

      // Guardian Fairy reactive modal: show before Balatron/postDrain if GF pending
      const afterGfReactive = () => {
        // Balatron modal injection: if the pending flag is set, play the interactive
        // counter-die reveal first, then runPostDrain() continues the normal flow.
        if (B.balatronPending) {
          showBalatronModal(afterBalatron);
        } else {
          afterBalatron();
        }
      };

      // Gus (31) — Gale Force reactive: winner decides before Guardian Fairy (loser's defense)
      const afterGusGaleChoice = () => {
        if (B._gusGaleAccepted) {
          // Player accepted Gale Force — damage zeroed, swap picker needed
          B._gusGaleAccepted = false;
          galeForceSwap = true;
          galeForceDmg = B._gusGaleDmg || galeForceDmg;
          dmg = 0; // zero damage to current opponent
          // Skip Guardian Fairy — no damage to absorb
          afterGfReactive();
        } else {
          // Player declined (or wasn't offered) — damage flows normally, GF may absorb
          if (B.guardianFairyReactivePending) {
            const gfp = B.guardianFairyReactivePending;
            gfp.resume = afterGfReactive;
            // v783: timed button instead of full-screen modal
            showGfWishButton();
          } else {
            afterGfReactive();
          }
        }
      };

      // Pal Al / Gordok choice modals: fire before Gus Gale Force (winner decides first)
      const afterWiseAlGordok = () => {
        if (B.gusGaleReactivePending) {
          const gp = B.gusGaleReactivePending;
          gp.resume = afterGusGaleChoice;
          // Auto-accept for AI/autoPlay
          if (autoPlayRunning) {
            doGusGaleReactive('yes');
          } else {
            showGusGaleButton();
          }
        } else {
          afterGusGaleChoice();
        }
      };

      const afterGordokChoice = () => {
        if (B.wiseAlPending) {
          showWiseAlModal(afterWiseAlGordok);
        } else {
          afterWiseAlGordok();
        }
      };

      const afterSophiaChoice = () => {
        if (B.gordokPending) {
          showGordokModal(afterGordokChoice);
        } else {
          afterGordokChoice();
        }
      };

      if (B.sophiaPending) {
        showSophiaModal(afterSophiaChoice);
      } else {
        afterSophiaChoice();
      }
    });
  }, dmgDelay);
}

function handleKOs() {
  // Mark any ghost with hp <= 0 as KO (safety net for edge cases)
  ['red','blue'].forEach(team => {
    B[team].ghosts.forEach(g => { if (g.hp <= 0 && !g.ko) g.ko = true; });
  });

  // Fire post-resolve hooks (event-driven spectator snapshot)
  for (const fn of _postResolveHooks) { try { fn(B); } catch(e) {} }

  // Check for game-over first
  const redAllDown = B.red.ghosts.every(g => g.ko);
  const blueAllDown = B.blue.ghosts.every(g => g.ko);
  if (redAllDown && blueAllDown) { showGameOver('draw'); renderBattle(); return true; }
  if (redAllDown) { showGameOver('blue'); renderBattle(); return true; }
  if (blueAllDown) { showGameOver('red'); renderBattle(); return true; }

  // Check if any active ghost is KO'd and needs a replacement pick
  const teamsNeedingSwap = [];
  for (const team of ['red','blue']) {
    const t = B[team];
    const f = active(t);
    if (f.ko) {
      // Mode G: clear moonstone sickness on KO
      const msModeKO = document.getElementById('moonstoneModeSelect')?.value || 'D';
      if (msModeKO === 'G' && t.moonstoneSickness > 0) {
        log(`<span style="color:var(--moonstone)">Moonstone Sickness cleared!</span> ${team.toUpperCase()}'s sickness lifts with ${f.name}'s defeat.`);
        t.moonstoneSickness = 0;
      }
      const alive = t.ghosts.filter((g,i) => i !== t.activeIdx && !g.ko);
      if (alive.length > 0) {
        teamsNeedingSwap.push(team);
      } else {
        // Active is KO'd and no sideline — this team is fully eliminated
        const winner = team === 'red' ? 'blue' : 'red';
        showGameOver(winner); renderBattle(); return true;
      }
    }
  }

  if (teamsNeedingSwap.length > 0) {
    // Queue the KO swap picks — caller must NOT resume to 'ready'
    B.koSwapQueue = teamsNeedingSwap.slice();
    B.phase = 'ko-swap';
    renderBattle();
    openKoSwap();
    return true; // signal: don't resume, swap in progress
  }

  renderBattle();
  return false;
}

function openKoSwap() {
  if (!B.koSwapQueue || B.koSwapQueue.length === 0) {
    // All swaps done — announce the new matchup first, then enable roll buttons
    // 350ms later. Same breathing-room pattern as the v110 no-KO path: narrate()
    // fires before B.phase='ready' so roll buttons don't become live while the
    // entry narration (still draining in drainNarrate) or round announcement is
    // still on screen. Previously B.phase='ready' + resetRollButtons() fired
    // BEFORE narrate(), making buttons clickable before the round line appeared.
    B.koSwapQueue = null;
    renderBattle();
    narrate(`<b class="gold">Round ${B.round}</b> — <b class="red-text">${active(B.red).name}</b>&nbsp;vs&nbsp;<b class="blue-text">${active(B.blue).name}</b>`);
    setTimeout(() => { startNextRound(); }, spd(350));
    return;
  }
  const team = B.koSwapQueue[0];
  const t = B[team];
  const fallen = active(t);
  const alive = t.ghosts.filter((g,i) => i !== t.activeIdx && !g.ko);

  // v728: Blue's local engine auto-picks only for RED's KO swaps (can't make Red's choice).
  // Blue's OWN KO swaps show the real picker so the player can choose.
  if (LIVE_PVP && PVP_SIDE === 'blue' && pvpBlueResolvedLocally && team !== 'blue') {
    const autoIdx = t.ghosts.indexOf(alive[0]);
    const teamLabel = team.charAt(0).toUpperCase() + team.slice(1);
    narrate(`<b class="ko-text">${fallen.name} is down!</b>&nbsp;<b class="${team}-text">${teamLabel}:</b>&nbsp;<b>${alive[0].name}</b> steps up!`);
    setTimeout(() => doKoSwap(team, autoIdx), 400); // v729: was 800ms
    return;
  }

  if (LIVE_PVP && PVP_SIDE === 'red' && team === 'blue') {
    pvpBroadcastState({ event: 'koSwapNeeded', swapTeam: 'blue' });
    const aliveIdxes = alive.map(g => t.ghosts.indexOf(g));
    PVP_GAME_REF.child('koSwapRequest').set({
      side: 'blue',
      fallenName: fallen.name,
      aliveIdxes: aliveIdxes,
      aliveNames: alive.map(g => g.name),
      ts: Date.now()
    });
    // Red waits for Blue's koSwap response via existing listener
    const banner = document.getElementById('pvp-wait-banner');
    if (banner) { banner.textContent = "Waiting for opponent's swap pick..."; banner.style.display = 'block'; }
    return;
  }

  // If only one option, auto-pick (no real choice)
  if (alive.length === 1) {
    const teamLabel = team.charAt(0).toUpperCase() + team.slice(1);
    narrate(`<b class="ko-text">${fallen.name} is down!</b>&nbsp;<b class="${team}-text">${teamLabel}:</b>&nbsp;<b>${alive[0].name}</b> steps up!`);
    setTimeout(() => doKoSwap(team, t.ghosts.indexOf(alive[0])), 400); // v729: was 800ms
    return;
  }

  const teamLabel = team.charAt(0).toUpperCase() + team.slice(1);
  narrate(`<b class="ko-text">${fallen.name} is down!</b>&nbsp;<b class="${team}-text">${teamLabel}</b> — who answers the call?`);
  // Brief delay so narrator text appears before picker lights up
  setTimeout(() => renderBattle(), 150); // v729: was 300ms — tightened for snappier feel
}

function doKoSwap(team, idx) {
  // v728: if Blue picks a KO swap during local resolution, broadcast to Red immediately
  if (LIVE_PVP && PVP_SIDE === 'blue' && pvpBlueResolvedLocally && team === 'blue') {
    PVP_GAME_REF.child('koSwap').push({ side: 'blue', idx: idx, timestamp: firebase.database.ServerValue.TIMESTAMP });
    B._blueKoSwapPick = idx; // stash so koSwapRequest listener can use it
  }
  const t = B[team];
  const fallen = active(t);
  // doKoSwap fires only when a ghost is KO'd by damage — entry effects always fire.
  // Tyson's Hop (skipEntry=true) is handled exclusively via useTysonHop → doSwap.
  const skipEntry = false;
  t.activeIdx = idx;
  const f = active(t);
  // Returning from sideline = full HP
  f.hp = f.maxHp;

  log(`<span class="log-ko">${fallen.name} is down!</span> <span class="log-ability">${f.name} enters at full HP!</span>`);
  const entryCalloutCount = triggerEntry(t, skipEntry);

  renderBattle();

  // Fire post-resolve hooks (spectator snapshot after KO swap)
  for (const fn of _postResolveHooks) { try { fn(B); } catch(e) {} }

  // Remove this team from the queue
  B.koSwapQueue.shift();

  // After entry callouts + Jenkins modal resolve, check for KOs and continue
  afterEntryWithJenkins(entryCalloutCount > 0 ? entryCalloutCount : 0, () => {
    // Check if entry effects caused new KOs (e.g. Nerina's Leviathan, Jenkins Greeting)
    const redAllDown = B.red.ghosts.every(g => g.ko);
    const blueAllDown = B.blue.ghosts.every(g => g.ko);
    if (redAllDown && blueAllDown) { showGameOver('draw'); return; }
    if (redAllDown) { showGameOver('blue'); return; }
    if (blueAllDown) { showGameOver('red'); return; }

    // Check if entry damage KO'd someone new — add to queue
    ['red','blue'].forEach(tm => {
      const tt = B[tm];
      if (active(tt).ko && !B.koSwapQueue.includes(tm)) {
        const alive = tt.ghosts.filter((g,i) => i !== tt.activeIdx && !g.ko);
        if (alive.length > 0) B.koSwapQueue.push(tm);
      }
    });

    openKoSwap();
  });
}

function showGameOver(winner) {
  B.phase = 'over';
  // Fire registered hooks BEFORE the default game-over logic
  for (const fn of _gameOverHooks) {
    try { fn(winner); } catch(e) { console.error('[showGameOver hook error]', e); }
  }
  // Live PvP: broadcast game over so both clients show it
  if (LIVE_PVP && PVP_GAME_REF && PVP_SIDE === 'red') {
    const stateSnap = pvpSerializeState();
    PVP_GAME_REF.child('stateSync').set(stateSnap);
    PVP_GAME_REF.child('gameOver').set({ winner, ts: Date.now() });
    PVP_GAME_REF.child('roundResult').push({
      state: stateSnap,
      redDice: B.redDice || null,
      blueDice: B.blueDice || null,
      gameOver: winner,
      ts: Date.now()
    });
  }
  fadeOutMusic();
  // Victory fanfare (delayed to let music fade a bit)
  setTimeout(() => playSfx('sfxVictory', 0.6), 600);
  // Clean up any active overlays/animations
  document.getElementById('abilitySplash').classList.remove('active');
  clearLsCountdown();
  disableRollButtons();

  // Record standings
  let matchMvp = null;
  let redMvpId = null;
  let blueMvpId = null;
  if (winner === 'red' || winner === 'blue') {
    const winTeam = B[winner];
    const loseTeamName = winner === 'red' ? 'blue' : 'red';
    const loseTeamObj = B[loseTeamName];
    winTeam.ghosts.forEach(g => recordWin(g.originalId || g.id));
    loseTeamObj.ghosts.forEach(g => recordLoss(g.originalId || g.id));
    // Record KO'D (times defeated) and Kills (KOs scored) from killedBy tags
    const allGhosts = [...winTeam.ghosts, ...loseTeamObj.ghosts];
    allGhosts.forEach(g => {
      if (g.ko) {
        recordKO(g.originalId || g.id); // this ghost was defeated
        if (g.killedBy && g.killedBy > 0) recordKill(g.killedBy); // credit the killer
      }
    });
    // MVP: pick the winning team's top scorer and record in standings
    try {
      matchMvp = pickMatchMvp(winner);
      if (matchMvp) recordMvp(matchMvp.originalId || matchMvp.id);
      // Compute stats-based MVPs for BOTH teams for the end-of-match display.
      // The losing team gets an MVP too — even if every ghost was KO'd — based
      // on who actually contributed most (KOs scored, damage, rolls won,
      // resources generated). This is display-only; standings still only count
      // the winning team's MVP via recordMvp() above.
      const redPick = pickMatchMvp('red');
      const bluePick = pickMatchMvp('blue');
      redMvpId = redPick ? redPick.id : null;
      blueMvpId = bluePick ? bluePick.id : null;
    } catch (e) { console.warn('[MVP] pick failed:', e); }
  }

  const el = document.getElementById('gameOver');
  el.classList.add('active');
  const title = document.getElementById('goTitle');
  const rounds = B.round - 1;
  if (winner === 'draw') { title.textContent = 'DRAW!'; title.className = ''; }
  else {
    const winnerName = MP_MODE ? MP_PLAYER_NAMES[winner] : `Team ${winner.charAt(0).toUpperCase() + winner.slice(1)}`;
    title.textContent = `${winnerName} WINS!`;
    title.className = `${winner}-win`;
  }

  // Round count
  document.getElementById('goRounds').textContent = `${rounds} round${rounds !== 1 ? 's' : ''} played`;

  // Battle summary with ghost statuses
  function buildTeamCol(teamObj, teamLabel, teamColor, mvpId) {
    const gd = id => ghostData(id);

    const rows = teamObj.ghosts.map((g, i) => {
      const displayId = g.originalId || g.id;
      const displayName = g.originalName || g.name;
      const displayArt = g.originalArt || g.art;
      const data = gd(displayId);
      // MVP badge follows the stats-based pick from pickMatchMvp() — awarded
      // even if the MVP ghost was KO'd (wiped-team case).
      const isMvp = (mvpId != null && (g.id === mvpId || g.originalId === mvpId));
      const artSrc = displayArt || (data && data.art);
      const artHtml = artSrc
        ? `<img class="go-ghost-art" src="${artSrc}" alt="${displayName}" loading="lazy" onerror="this.outerHTML='<div class=\\'go-ghost-art-placeholder\\'>👻</div>'">`
        : `<div class="go-ghost-art-placeholder">&#128123;</div>`;
      const statusText = g.ko
        ? "KO'd"
        : `${g.hp}/${g.maxHp} HP`;
      const statusClass = g.ko ? 'ko' : 'survived';
      const mvpBadge = isMvp ? '<span class="go-mvp-badge">MVP</span>' : '';
      return `<div class="go-ghost-row${isMvp ? ' mvp' : ''}">
        ${artHtml}
        <div class="go-ghost-info">
          <div class="go-ghost-name">${displayName}</div>
          <div class="go-ghost-status ${statusClass}">${statusText}</div>
        </div>
        ${mvpBadge}
      </div>`;
    }).join('');

    const displayLabel = MP_MODE ? MP_PLAYER_NAMES[teamColor] : `Team ${teamLabel}`;
    return `<div class="go-team-col">
      <h3 class="${teamColor}-label">${displayLabel}</h3>
      ${rows}
    </div>`;
  }

  const summaryHtml = buildTeamCol(B.red, 'Red', 'red', redMvpId) + buildTeamCol(B.blue, 'Blue', 'blue', blueMvpId);
  document.getElementById('goSummary').innerHTML = summaryHtml;

  // MULTIPLAYER MODE: replace buttons with "Return to Arena" redirect
  if (MP_MODE) {
    // In live PvP, result is relative to YOUR side
    const result = LIVE_PVP
      ? (winner === PVP_SIDE ? 'win' : (winner === 'draw' ? 'draw' : 'loss'))
      : (winner === 'red' ? 'win' : (winner === 'blue' ? 'loss' : 'draw'));

    // Clean up live PvP game
    if (LIVE_PVP && PVP_GAME_REF) {
      PVP_GAME_REF.child('status').set('finished');
      PVP_GAME_REF.child('winner').set(winner);
    }

    const goButtons = el.querySelector('.go-buttons');

    // RAID MODE: show boss dialogue and redirect with raid results
    if (RAID_MODE && RAID_PARAMS) {
      const bossLine = winner === 'red'
        ? `${RAID_PARAMS.bossName} has been defeated!`
        : `${RAID_PARAMS.bossName} stands triumphant.`;
      const dialogueEl = document.createElement('div');
      dialogueEl.style.cssText = 'text-align:center;color:var(--text2);font-style:italic;font-size:1.1rem;margin:12px 0;';
      dialogueEl.textContent = bossLine;
      const goTitle = document.getElementById('goTitle');
      if (goTitle) goTitle.after(dialogueEl);
      // Calculate total damage dealt to blue team (boss) — exclude padded ghosts
      let totalDamage = 0;
      if (B && B.blue) {
        const realCount = RAID_PARAMS.realBossGhostCount || B.blue.ghosts.length;
        for (let i = 0; i < realCount; i++) {
          const g = B.blue.ghosts[i];
          if (g) totalDamage += Math.max(0, g.maxHp - (g.ko ? 0 : g.hp));
        }
      }
      const ghostsLost = B ? B.red.ghosts.filter(g => g.ko).length : 0;
      // Calculate damage taken by player's team
      let damageTaken = 0;
      if (B && B.red) {
        B.red.ghosts.forEach(g => {
          damageTaken += Math.max(0, g.maxHp - (g.ko ? 0 : g.hp));
        });
      }

      if (goButtons) {
        const returnUrl = `../multiplayer/?raidResult=done`
          + `&instanceId=${encodeURIComponent(RAID_PARAMS.instanceId)}`
          + `&raidId=${encodeURIComponent(RAID_PARAMS.raidId)}`
          + `&damage=${totalDamage}`
          + `&damageTaken=${damageTaken}`
          + `&ghostsLost=${ghostsLost}`
          + `&slot=${RAID_PARAMS.slot}`
          + `&result=${result}`;
        goButtons.innerHTML = `
          <button class="go-btn-rematch" onclick="try{sessionStorage.setItem('raidJustCompleted','1')}catch(e){};window.location.href='${returnUrl}'">
            Return to Raid
          </button>
        `;
        // Mark raid as completed in sessionStorage (survives page navigation)
        try { sessionStorage.setItem('raidJustCompleted', '1'); } catch(e) {}
        // Auto-redirect after 5 seconds
        setTimeout(() => { window.location.href = returnUrl; }, 5000);
      }
    } else if (goButtons) {
      // Daily mode uses dailyResult param; regular MP uses result param
      const returnUrl = MP_DAILY
        ? `../multiplayer/?dailyResult=${result}`
        : `../multiplayer/?result=${result}`;
      goButtons.innerHTML = `
        <button class="go-btn-rematch" onclick="window.location.href='${returnUrl}'">
          Return to Arena
        </button>
      `;
    }
  }
}

// ============================================================
// SWAP
// ============================================================
function openSwap(team) {
  if (!B || B.phase!=='ready') return;
  const t = B[team];
  const opts = t.ghosts.filter((g,i) => i!==t.activeIdx);
  document.getElementById('swapTitle').textContent = `Swap ${team.toUpperCase()} Active Ghost`;
  document.getElementById('swapOptions').innerHTML = opts.map(g => {
    const realIdx = t.ghosts.indexOf(g);
    const gd = ghostData(g.id) || g;
    const hpRatio = g.hp / g.maxHp;
    const hpColor = hpRatio > 0.6 ? 'var(--hp-green)' : hpRatio > 0.3 ? 'var(--hp-yellow)' : 'var(--hp-red)';
    return `<div class="swap-option ${g.ko?'ko':''}" onclick="doSwap('${team}',${realIdx})" style="display:flex; gap:10px; align-items:center;">
      ${gd.art ? `<img src="${gd.art}" style="width:50px; height:50px; border-radius:6px; object-fit:cover; border:1px solid var(--${gd.rarity || 'legendary'});">` : ''}
      <div>
        <div class="so-name">${g.name}</div>
        <div class="so-info"><span style="color:${hpColor}; font-weight:700;">&hearts; ${g.hp}/${g.maxHp}</span> ${g.ko?'<span style="color:var(--accent); font-weight:800;">(KO)</span>':''} &middot; <span style="color:var(--moonstone);">${gd.ability || ''}</span></div>
      </div>
    </div>`;
  }).join('');
  document.getElementById('swapOverlay').classList.add('active');
}

function doSwap(team, idx) {
  const t = B[team];
  if (t.ghosts[idx].ko) return;
  const oldGhost = active(t);
  const oldName = oldGhost.name;
  const skipEntry = (oldGhost.id === 365); // Tyson — Hop: no entry effects
  t.activeIdx = idx;
  const f = active(t);
  // Returning from sideline = full HP
  f.hp = f.maxHp;

  log(`<span class="log-ability">${oldName} swaps out — ${f.name} enters at full HP!</span>`);
  if (skipEntry) {
    log(`<span class="log-ability">Tyson</span> — Hop! No entry effects triggered.`);
  }
  const entryCount = triggerEntry(t, skipEntry);

  document.getElementById('swapOverlay').classList.remove('active');
  if (B.jenkinsPending) {
    afterEntryWithJenkins(entryCount, () => {
      if (!handleKOs()) renderBattle();
    });
  } else {
    if (!handleKOs()) renderBattle();
  }
}

// ============================================================
// MULTIPLAYER MODE — URL param handler
// ============================================================
// When loaded with ?red=ID,ID,ID&mode=mp, auto-set teams and start battle.
// Player controls both sides. On game end, redirect back to multiplayer page.
// MP_MODE declared earlier (near TESTROOM_VERSION) so keyboard shortcuts can reference it.

(function checkMultiplayerParams() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  if (mode !== 'mp' && mode !== 'daily' && mode !== 'champion') return;
  if (mode === 'daily') MP_DAILY = true;

  const redParam = params.get('red');
  if (!redParam) return;

  const redIds = redParam.split(',').map(Number).filter(id => ghostData(id));
  if (redIds.length !== 3) return;

  MP_MODE = true;

  // Force standard settings for all MP/daily games
  const speedEl = document.getElementById('speedSlider');
  if (speedEl) speedEl.value = 0; // 1x speed
  const hlCheck = document.getElementById('handLimitCheckbox');
  if (hlCheck) hlCheck.checked = true; // hand limit ON
  const hlSlider = document.getElementById('handLimitSlider');
  if (hlSlider) hlSlider.value = 4; // limit of 4
  const stSlider = document.getElementById('specialsTimerSlider');
  if (stSlider) stSlider.value = 8; // v731: 8 second timer (was 5 — too rushed)

  // Set red team from URL params (player's team)
  S.redPicks = redIds;

  // For daily mode, use blue team from URL; for mp mode, pick curated team
  const blueParam = params.get('blue');
  if (blueParam) {
    const blueIds = blueParam.split(',').map(Number).filter(id => ghostData(id));
    if (blueIds.length === 3) {
      S.bluePicks = blueIds;
    } else {
      S.bluePicks = getCuratedTeam(redIds);
    }
  } else {
    S.bluePicks = getCuratedTeam(redIds);
  }

  // Show opponent name/elo if provided (async PvP)
  const oppName = params.get('oppName');
  const oppElo = params.get('oppElo');
  MP_PLAYER_NAMES.red = 'You';
  if (oppName) {
    MP_PLAYER_NAMES.blue = decodeURIComponent(oppName);
    const blueTitle = document.querySelector('.roster-title.blue');
    if (blueTitle) {
      blueTitle.innerHTML = `<span class="roster-dot"></span> ${MP_PLAYER_NAMES.blue} <span style="font-size:0.7em;color:var(--text2)">(${oppElo || '?'} Elo)</span>`;
    }
  }

  // Switch to arena tab and auto-start battle
  setTimeout(() => {
    switchTab('battle');
    renderPicks();
    startBattle();
    // Start blue AI for async/daily modes (not live PvP — that's a real player)
    if (!LIVE_PVP) startBlueAI();
  }, 300);
})();

// ============================================================
// RAID MODE — Boss fights with cinematic testroom experience
// URL: ?mode=raid&red=id,id,id&blue=bossId,minionId,minionId
//      &raidId=...&instanceId=...&slot=...&bossHp=...&bossMaxHp=...&bossName=...&personality=...
// ============================================================
(function checkRaidParams() {
  // Check URL first, then sessionStorage (survives cache-bust reload)
  let params = new URLSearchParams(window.location.search);
  if (params.get('mode') !== 'raid') {
    const saved = sessionStorage.getItem('_raidParams');
    if (saved) {
      params = new URLSearchParams(saved);
      sessionStorage.removeItem('_raidParams');
    }
  }
  if (params.get('mode') !== 'raid') return;
  if (window._raidParamsProcessed) return;
  window._raidParamsProcessed = true;

  // Clean URL & session immediately so refresh doesn't re-trigger
  window.history.replaceState({}, '', window.location.pathname);
  sessionStorage.removeItem('_raidParams');

  const redParam = params.get('red');
  const blueParam = params.get('blue');
  if (!redParam || !blueParam) return;

  // Parse red team (player's ghosts — must be valid)
  const redIds = redParam.split(',').map(Number).filter(id => ghostData(id));
  if (redIds.length !== 3) return;

  // Parse blue team (boss + minions — may not be in GHOSTS array)
  const blueIds = blueParam.split(',').map(Number);

  // Register boss ghosts in the GHOSTS lookup so the battle engine can find them
  // Boss ghost data is passed via URL as a JSON blob in the 'bossData' param
  const bossDataParam = params.get('bossData');
  if (bossDataParam) {
    try {
      const bossGhosts = JSON.parse(decodeURIComponent(bossDataParam));
      bossGhosts.forEach(bg => {
        const existingIdx = GHOSTS.findIndex(g => g.id === bg.id);
        if (existingIdx >= 0) {
          // Override maxHp for boss version of existing ghost (keeps all ability handlers)
          GHOSTS[existingIdx] = { ...GHOSTS[existingIdx], maxHp: bg.maxHp };
        } else {
          GHOSTS.push({
            id: bg.id, name: bg.name, maxHp: bg.maxHp, art: bg.art || '',
            ability: bg.ability || 'Boss', abilityDesc: bg.abilityDesc || '',
            rarity: bg.rarity || 'legendary', set: 'Raid Boss'
          });
        }
      });
    } catch (e) { console.warn('[RAID] Failed to parse bossData:', e); }
  }

  // Verify all blue IDs are now findable
  const validBlue = blueIds.filter(id => ghostData(id));
  if (validBlue.length === 0) { console.error('[RAID] No valid blue team ghosts'); return; }
  // Track how many real boss ghosts there are (before padding)
  const realBossGhostCount = validBlue.length;
  // Pad to 3 for engine compatibility — padded ghosts will be auto-KO'd after battle starts
  while (validBlue.length < 3) validBlue.push(validBlue[0]);

  // Set raid state
  RAID_MODE = true;
  MP_MODE = true; // reuse MP infrastructure (hide team select, auto-start, etc.)

  RAID_PARAMS = {
    raidId: params.get('raidId') || '',
    instanceId: params.get('instanceId') || '',
    slot: parseInt(params.get('slot') || '0'),
    bossHp: parseInt(params.get('bossHp') || '50'),
    bossMaxHp: parseInt(params.get('bossMaxHp') || '50'),
    bossName: decodeURIComponent(params.get('bossName') || 'Boss'),
    personality: params.get('personality') || 'tyrant',
    totalDamageDealt: 0,
    realBossGhostCount: realBossGhostCount
  };

  // Set teams
  S.redPicks = redIds;
  S.bluePicks = validBlue;

  // Force standard settings
  const speedEl = document.getElementById('speedSlider');
  if (speedEl) speedEl.value = 2; // Faster pace for raids
  const hlCheck = document.getElementById('handLimitCheckbox');
  if (hlCheck) hlCheck.checked = true;
  const hlSlider = document.getElementById('handLimitSlider');
  if (hlSlider) hlSlider.value = 4;
  const stSlider = document.getElementById('specialsTimerSlider');
  if (stSlider) stSlider.value = 8;

  // Set player names
  MP_PLAYER_NAMES.red = 'You';
  MP_PLAYER_NAMES.blue = RAID_PARAMS.bossName;

  // Show boss HP bar
  const bossBar = document.getElementById('raid-boss-bar');
  if (bossBar) {
    bossBar.style.display = 'block';
    document.getElementById('raid-boss-bar-name').textContent = RAID_PARAMS.bossName;
    document.getElementById('raid-boss-bar-text').textContent = `${RAID_PARAMS.bossHp} / ${RAID_PARAMS.bossMaxHp}`;
    document.getElementById('raid-boss-bar-fill').style.width = '100%';
    updateRaidBossBar();
    // Push the arena down to make room for the bar
    document.querySelector('.app').style.paddingTop = '56px';
  }

  // Switch to arena tab and auto-start
  setTimeout(() => {
    switchTab('battle');
    renderPicks();
    startBattle();
    // Mark padded ghost slots as empty placeholders — not real KOs
    if (B && B.blue && realBossGhostCount < 3) {
      for (let i = realBossGhostCount; i < B.blue.ghosts.length; i++) {
        B.blue.ghosts[i].hp = 0;
        B.blue.ghosts[i].ko = true;
        B.blue.ghosts[i].isPadded = true; // flag: not a real ghost, exclude from KO counts
      }
      renderBattle();
    }
    startBlueAI();
  }, 300);
})();

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
// BLUE AI AUTO-PLAY — for MP/daily modes (not live PvP)
// ============================================================
// Watches for blue's roll button to become enabled, then auto-plays:
// - Commits specials before rolling (ice shards, sacred fire, surge)
// - Auto-rolls after a brief delay (feels natural, not instant)
// - Auto-picks KO replacement (save best ghost for last)
// - Auto-handles ability modals on blue's side
let AI_ACTIVE = false;
let aiCheckInterval = null;

function startBlueAI() {
  if (AI_ACTIVE || LIVE_PVP) return;
  AI_ACTIVE = true;

  // Poll for opportunities to act
  aiCheckInterval = setInterval(() => {
    if (!B || B.phase === 'over') { stopBlueAI(); return; }
    aiTick();
  }, 600);
}

function stopBlueAI() {
  AI_ACTIVE = false;
  if (aiCheckInterval) { clearInterval(aiCheckInterval); aiCheckInterval = null; }
}

function aiTick() {
  if (!B || !AI_ACTIVE) return;

  // --- Auto-roll blue when button is ready ---
  if (B.phase === 'ready' || B.phase === 'rolling') {
    // Boss mode: simplified check — blue button is hidden, just check state
    const blueBtn = document.getElementById('rollBlueBtn');
    const btnReady = window.BOSS_MODE
      ? (B.phase === 'ready' || B.phase === 'rolling') // boss always ready if phase allows
      : (blueBtn && !blueBtn.disabled && !blueBtn.classList.contains('locked'));
    if (btnReady) {
      // v733: wait for Red to click READY before AI rolls Blue
      if (!pvpRedClickedRoll) return;
      // Commit specials before rolling
      aiCommitSpecials('blue');
      // v733: Red already committed — short delay for feel, then roll
      pvpRedClickedRoll = false;
      setTimeout(() => {
        if (B && (B.phase === 'ready' || B.phase === 'rolling')) {
          rollReady('blue');
        }
      }, 800 + Math.random() * 400);
      return;
    }
  }

  // --- Auto-pick KO replacement ---
  if (B.phase === 'ko-swap' && B.koSwapQueue && B.koSwapQueue[0] === 'blue') {
    const t = B.blue;
    const alive = t.ghosts.filter((g, i) => i !== t.activeIdx && !g.ko);
    if (alive.length > 0) {
      // Save the best ghost for last: pick the WEAKER one now
      // "Best" = highest rarity, then highest HP
      const rarityRank = { common: 0, uncommon: 1, rare: 2, 'ghost-rare': 3, legendary: 4 };
      // Bo (109) + Lucas (433) combo: keep Lucas on sideline for Kindling triggers
      const boOnTeam = t.ghosts.some(g => g.id === 109 && !g.ko);
      alive.sort((a, b) => {
        if (boOnTeam) {
          const aIsLucas = a.id === 433 ? 1 : 0;
          const bIsLucas = b.id === 433 ? 1 : 0;
          if (aIsLucas !== bIsLucas) return aIsLucas - bIsLucas;
        }
        // Lou (32) must stay on sideline to buff Grawr (34) — always send Grawr in first
        const grawrOnTeam = t.ghosts.some(g => g.id === 34 && !g.ko);
        if (grawrOnTeam) {
          const aIsLou = a.id === 32 ? 1 : 0;
          const bIsLou = b.id === 32 ? 1 : 0;
          if (aIsLou !== bIsLou) return bIsLou - aIsLou; // Lou sorts to front (saved for last = kept on sideline)
        }
        const rd = (rarityRank[b.rarity] || 0) - (rarityRank[a.rarity] || 0);
        if (rd !== 0) return rd;
        return b.hp - a.hp;
      });
      // Pick the WORST (last in sorted = lowest rarity/HP), saving best for last
      const pick = alive[alive.length - 1];
      const pickIdx = t.ghosts.indexOf(pick);
      setTimeout(() => {
        if (B && B.phase === 'ko-swap' && B.koSwapQueue && B.koSwapQueue[0] === 'blue') {
          doKoSwap('blue', pickIdx);
        }
      }, 800 + Math.random() * 400);
      return;
    }
  }

  // --- Duel Phase: auto-click Done for blue ---
  if ((B.phase === 'duel-1' || B.phase === 'duel-2') && B.duelActiveTeam === 'blue') {
    aiCommitSpecials('blue');
    const doneBtn = document.getElementById('duelDoneBlueBtn');
    if (doneBtn && !doneBtn.disabled) {
      setTimeout(() => {
        if (doneBtn && !doneBtn.disabled) doneBtn.click();
      }, 500 + Math.random() * 500);
      return;
    }
  }

  // --- Hand Limit discard for blue: auto-discard least valuable resource ---
  if (B.handLimitPending && B.handLimitPending.team === 'blue') {
    const overlay = document.getElementById('handLimitOverlay');
    if (overlay && overlay.classList.contains('active')) {
      const blueRes = B.blue.resources;
      // Discard priority: least valuable first
      const discardOrder = ['ice', 'healingSeed', 'surge', 'fire', 'luckyStone', 'moonstone', 'firefly'];
      for (const key of discardOrder) {
        if ((blueRes[key] || 0) > 0) {
          setTimeout(() => doHandLimitDiscard('blue', key), 400);
          return;
        }
      }
    }
  }

  // --- Auto-handle blue ability modals ---
  // Timber choice: always choose to discard specials (less punishing)
  if (B.timberPending && B.timberPending.team !== 'blue') {
    // Timber is opponent's ability affecting blue — auto-pick "discard"
    const timberOverlay = document.getElementById('timberOverlay');
    if (timberOverlay && timberOverlay.classList.contains('active')) {
      setTimeout(() => doTimberChoice('discard'), 600);
      return;
    }
  }

  // Ryder Toll: AI takes 1 damage unless it would KO them (HP <= 1), then give Sacred Fire
  if (B.riderPending && B.riderPending.oppTeamName === 'blue') {
    const riderOverlay = document.getElementById('riderOverlay');
    if (riderOverlay && riderOverlay.classList.contains('active')) {
      const aiActive = active(B.blue);
      const choice = (aiActive && aiActive.hp <= 1) ? 'sacredfire' : 'damage';
      setTimeout(() => doRiderChoice(choice), 600);
      return;
    }
  }

  // Tyler: always opt in if HP > 4 (aggressive AI)
  if (B.tylerPending && B.tylerPending.team === 'blue') {
    const f = active(B.blue);
    setTimeout(() => doTylerChoice(f && f.hp > 4 ? 'yes' : 'no'), 600);
    return;
  }

  // Toby Pure Heart: declare when AI is losing (fewer remaining ghosts) or Toby is last ghost
  if (B.tobyPending && B.tobyPending.team === 'blue') {
    const blueAlive = S.blue.filter(g => g.hp > 0).length;
    const redAlive = S.red.filter(g => g.hp > 0).length;
    const shouldDeclare = blueAlive < redAlive || blueAlive === 1;
    setTimeout(() => doTobyPureHeart(shouldDeclare), 600);
    return;
  }

  // Romy prediction: pick 4 (most common high-value die)
  if (B.romyPending && B.romyPending.team === 'blue') {
    setTimeout(() => doRomyPrediction(4), 600);
    return;
  }

  // Selene (305): prefer Lucky Stones (3 LS is more impactful than 2 seeds)
  if (B.selenePending && B.selenePending.tName === 'blue') {
    const seleneOverlay = document.getElementById('seleneOverlay');
    if (seleneOverlay && seleneOverlay.classList.contains('active')) {
      setTimeout(() => doSeleneChoice('stone'), 600);
      return;
    }
  }

  // Pal Al: always pick damage (aggressive AI)
  if (B.wiseAlPending && B.wiseAlPending.winTeamName === 'blue') {
    setTimeout(() => { if (B.wiseAlPending) doWiseAlChoice('damage'); }, 600);
    return;
  }

  // Sophia: AI picks Mask of Night
  if (B.sophiaPending && B.sophiaPending.winTeamName === 'blue') {
    setTimeout(() => { if (B.sophiaPending) doSophiaChoice('night'); }, 600);
    return;
  }

  // Gordok: always pick damage (aggressive AI)
  if (B.gordokPending && B.gordokPending.winTeamName === 'blue') {
    setTimeout(() => { if (B.gordokPending) doGordokChoice('damage'); }, 600);
    return;
  }

  // Jackson (50): opt in if HP > 5 (aggressive but safe)
  if (B.jacksonPending && B.jacksonPending.team === 'blue') {
    const jacksonOverlay = document.getElementById('jacksonOverlay');
    if (jacksonOverlay && jacksonOverlay.classList.contains('active')) {
      const jf = active(B.blue);
      setTimeout(() => doJacksonChoice(jf && jf.hp > 5 ? 'yes' : 'no'), 600);
      return;
    }
  }

  // Sonya (69): always use Mesmerize (change die to 2 — weakens opponent)
  if (B.sonyaPending && B.sonyaPending.team === 'blue') {
    const sonyaOverlay = document.getElementById('sonyaOverlay');
    if (sonyaOverlay && sonyaOverlay.classList.contains('active')) {
      setTimeout(() => doSonyaChoice('yes'), 600);
      return;
    }
  }

  // Jeanie (90): always use Hidden Treasure (force opponent reroll)
  if (B.jeaniePending && B.jeaniePending.team === 'blue') {
    const jeanieOverlay = document.getElementById('jeanieOverlay');
    if (jeanieOverlay && jeanieOverlay.classList.contains('active')) {
      setTimeout(() => doJeanieChoice('yes'), 600);
      return;
    }
  }

  // Dark Wing: always opt in
  if (B.darkWingPending && B.darkWingPending.team === 'blue') {
    setTimeout(() => { if (typeof doDarkWingChoice === 'function') doDarkWingChoice('yes'); }, 600);
    return;
  }

  // Tommy chain: auto-roll the bonus die
  if (B.tommyChainPending && B.tommyChainPending.team === 'blue') {
    const tommyOverlay = document.getElementById('tommyOverlay');
    if (tommyOverlay && tommyOverlay.classList.contains('active')) {
      const tommyBtn = document.getElementById('tommyRollBtn');
      if (tommyBtn && !tommyBtn.disabled) {
        setTimeout(() => doTommyRoll(), 600);
      }
      return;
    }
  }

  // Balatron (113): auto-roll the counter die
  if (B.balatronPending && B.balatronPending.loseTeamName === 'blue') {
    const balatronOverlay = document.getElementById('balatronOverlay');
    if (balatronOverlay && balatronOverlay.classList.contains('active')) {
      const balatronBtn = document.getElementById('balatronRollBtn');
      if (balatronBtn && !balatronBtn.disabled) {
        setTimeout(() => doBalatronRoll(), 600);
      }
      return;
    }
  }

  // Sylvia (313): auto-roll ice shard die when modal appears
  if (B.sylviaResume && B.sylviaTeamName === 'blue') {
    const sylviaOverlay = document.getElementById('sylviaOverlay');
    if (sylviaOverlay && sylviaOverlay.classList.contains('active')) {
      const sylviaBtn = document.getElementById('sylviaRollBtn');
      if (sylviaBtn && !sylviaBtn.disabled) {
        setTimeout(() => { if (sylviaBtn.onclick) sylviaBtn.onclick(); else sylviaBtn.click(); }, 600);
      }
      return;
    }
  }

  // Pressure picker: blue is forced to swap — pick which of blue's own ghosts enters
  // pressurePickerTeam = 'blue' means red attacked, blue chooses which of their own sideline ghosts comes in
  if (B.pressurePickerTeam === 'blue') {
    const pressureOverlay = document.getElementById('pressureOverlay');
    if (pressureOverlay && pressureOverlay.classList.contains('active')) {
      const blueTeam = B.blue;
      const sidelineAlive = blueTeam.ghosts
        .map((g, i) => ({ ghost: g, index: i }))
        .filter(x => x.index !== blueTeam.activeIdx && !x.ghost.ko);
      if (sidelineAlive.length > 0) {
        // Save the best ghost: pick the weaker one now (same logic as KO swap)
        const rarityRank = { common: 0, uncommon: 1, rare: 2, 'ghost-rare': 3, legendary: 4 };
        // Bo (109) + Lucas (433) combo: keep Lucas on sideline for Kindling triggers
        const boOnTeamP = blueTeam.ghosts.some(g => g.id === 109 && !g.ko);
        sidelineAlive.sort((a, b) => {
          if (boOnTeamP) {
            const aIsLucas = a.ghost.id === 433 ? 1 : 0;
            const bIsLucas = b.ghost.id === 433 ? 1 : 0;
            if (aIsLucas !== bIsLucas) return aIsLucas - bIsLucas;
          }
          const rd = (rarityRank[b.ghost.rarity] || 0) - (rarityRank[a.ghost.rarity] || 0);
          if (rd !== 0) return rd;
          return b.ghost.hp - a.ghost.hp;
        });
        const pick = sidelineAlive[sidelineAlive.length - 1]; // weakest
        setTimeout(() => doPressureSwap('red', pick.index), 600);
      }
      return;
    }
  }

  // Burn picker overlay: auto-pick best target (lowest HP sideline ghost)
  if (B.burnPickerTeam === 'blue') {
    const burnOverlay = document.getElementById('burnOverlay');
    if (burnOverlay && burnOverlay.classList.contains('active')) {
      const enemyTeam = B.red;
      const sidelineTargets = enemyTeam.ghosts
        .map((g, i) => ({ ghost: g, index: i }))
        .filter(x => x.index !== enemyTeam.activeIdx && !x.ghost.ko);
      if (sidelineTargets.length > 0) {
        sidelineTargets.sort((a, b) => a.ghost.hp - b.ghost.hp);
        setTimeout(() => doBurnPlace('blue', sidelineTargets[0].index), 500);
      } else {
        setTimeout(() => closeBurnPicker(), 400);
      }
      return;
    }
  }

  // Firefly picker overlay: convert to moonstone (best default)
  if (B.fireflyPickerTeam === 'blue') {
    const fireflyOverlay = document.getElementById('fireflyOverlay');
    if (fireflyOverlay && fireflyOverlay.classList.contains('active')) {
      setTimeout(() => doFireflyConvert('blue', 'moonstone'), 500);
      return;
    }
  }

  // Nick Knack picker: steal most valuable resource from opponent
  if (B.nickKnackPending && B.nickKnackPending.team === 'blue') {
    const nickOverlay = document.getElementById('nickKnackOverlay');
    if (nickOverlay && nickOverlay.classList.contains('active')) {
      const oppRes = B.red.resources;
      // Priority: moonstone > luckyStone > surge > fire > ice > healingSeed
      const stealOrder = ['moonstone', 'luckyStone', 'surge', 'fire', 'ice', 'healingSeed'];
      const stealKey = stealOrder.find(k => (oppRes[k] || 0) > 0) || 'skip';
      setTimeout(() => doNickKnackSteal('blue', stealKey), 500);
      return;
    }
  }

  // --- Post-roll: auto-use moonstone / lucky stone for blue ---
  aiHandlePostRoll();
}

// AI commits available specials before rolling
function aiCommitSpecials(team) {
  if (!B || !B[team]) return;
  const t = B[team];
  const r = t.resources;
  if (!r) return;
  const f = active(t);
  if (!f || f.ko) return;

  // --- Magic Fireflies: convert to most useful resource FIRST (before other commits) ---
  while ((r.firefly || 0) > 0) {
    // Priority: moonstone > luckyStone > surge > ice > fire > healingSeed
    // Moonstone = guaranteed die change to 6, Lucky Stone = reroll safety net
    // Moonstone capped at 1 — skip if already holding one
    let bestRes = (r.moonstone || 0) >= 1 ? 'luckyStone' : 'moonstone';
    if ((r.luckyStone || 0) >= 2 && (r.moonstone || 0) >= 1) bestRes = 'surge';
    if ((r.surge || 0) >= 2) bestRes = 'ice';
    // If HP is low, prefer healing seed
    if (f.hp < f.maxHp * 0.5 && (r.healingSeed || 0) < 2) bestRes = 'healingSeed';
    doFireflyConvert(team, bestRes);
  }

  // --- Healing Seeds: use if HP below max (heal before fighting) ---
  while (r.healingSeed > 0 && f.hp < f.maxHp) {
    spendHealingSeed(team);
  }

  // --- Bonzai (Miyoshi 454): sacrifice 4 HP for +5 dice — use whenever survivable ---
  if (f.id === 454 && !f.ko && f.hp > 4 && B.bonzaiDecided && !B.bonzaiDecided[team]) {
    useBonzaiButton(team);
    // doPreRollSetup already ran (Red clicked first), so bonzaiBtnDice was 0 when
    // dice counts were computed. Inject the +5 directly into preRoll if it exists.
    if (B.preRoll && B.preRoll[team]) {
      B.preRoll[team].count = Math.min(10, B.preRoll[team].count + 5);
    }
  }

  // --- Ice Blade: swing it if forged ---
  if (B.iceBladeForgedPermanent && B.iceBladeForgedPermanent[team] &&
      B.iceBladeSwing && !B.iceBladeSwing[team]) {
    toggleIceBlade(team);
  }

  // --- Flame Blade: swing it if forged ---
  if (B.flameBlade && B.flameBlade[team] &&
      B.flameBladeSwing && !B.flameBladeSwing[team]) {
    if (typeof toggleFlameBlade === 'function') toggleFlameBlade(team);
  }

  // --- Zain Ice Blade forge: forge if we have Zain + materials ---
  if (!B.iceBladeForgedPermanent?.[team]) {
    const zain = t.ghosts.find(g => g.id === 206 && !g.ko && !g.iceBladeForged);
    if (zain && r.ice >= 1 && r.moonstone >= 1) {
      useZainForge(team);
    }
  }

  // --- Finn Flame Blade forge ---
  if (!B.flameBlade?.[team]) {
    const finn = t.ghosts.find(g => g.id === 204 && !g.ko);
    if (finn && r.healingSeed >= 1 && r.fire >= 1) {
      if (typeof useFinnFlameBlade === 'function') useFinnFlameBlade(team);
    }
  }

  // --- Harrison (315) Ascend: commit healing seeds for extra dice ---
  if (f.id === 315 && !f.ko && r.healingSeed > 0 && B.committed) {
    // Commit all available seeds (each = +1 die)
    while (r.healingSeed > 0) {
      toggleHarrison(team);
    }
  }

  // --- Commit resources using cycleCommit (properly moves from pool to committed) ---
  // Commit all ice shards
  while (r.ice > 0 && B.committed) {
    cycleCommit(team, 'ice');
  }

  // Commit all sacred fire
  while (r.fire > 0 && B.committed) {
    cycleCommit(team, 'fire');
  }

  // Commit all surge for extra dice
  while (r.surge > 0 && B.committed) {
    cycleCommit(team, 'surge');
  }

  // --- Aunt Susan (308): commit seeds for damage if HP is full ---
  if (r.healingSeed > 0 && f.hp >= f.maxHp && B.committed) {
    const auntSusan = t.ghosts.find(g => g.id === 308 && !g.ko);
    if (auntSusan) {
      while (r.healingSeed > 0) {
        if (typeof toggleAuntSusan === 'function') toggleAuntSusan(team);
        else break;
      }
    }
  }

  // --- Aunt Susan Heal (308): commit seeds for healing if HP is low and Aunt Susan active ---
  if (r.healingSeed > 0 && f.id === 308 && f.hp < f.maxHp && B.committed) {
    while (r.healingSeed > 0) {
      if (typeof toggleAuntSusanHeal === 'function') toggleAuntSusanHeal(team);
      else break;
    }
  }

  // --- Burn: place all burn on enemy sideline ghosts ---
  if ((r.burn || 0) > 0) {
    const enemyTeamName = team === 'red' ? 'blue' : 'red';
    const enemyTeam = B[enemyTeamName];
    // Find non-KO'd sideline ghosts on enemy team
    const sidelineTargets = enemyTeam.ghosts
      .map((g, i) => ({ ghost: g, index: i }))
      .filter(x => x.index !== enemyTeam.activeIdx && !x.ghost.ko);
    if (sidelineTargets.length > 0) {
      while ((r.burn || 0) > 0 && sidelineTargets.length > 0) {
        // Spread burn across targets, prioritizing ghosts with lower HP
        sidelineTargets.sort((a, b) => a.ghost.hp - b.ghost.hp);
        const target = sidelineTargets[0];
        // Call doBurnPlace directly (bypasses the overlay picker)
        r.burn--;
        if (!B.burn) B.burn = { red: {}, blue: {} };
        if (!B.burn[enemyTeamName]) B.burn[enemyTeamName] = {};
        B.burn[enemyTeamName][target.index] = (B.burn[enemyTeamName][target.index] || 0) + 1;
        // Track burn source for KO credit
        const burnPlacer = active(B[team]);
        const burnPlacerId = burnPlacer ? (burnPlacer.originalId || burnPlacer.id) : 0;
        if (!B.burnSource) B.burnSource = { red: {}, blue: {} };
        if (!B.burnSource[enemyTeamName]) B.burnSource[enemyTeamName] = {};
        if (!B.burnSource[enemyTeamName][target.index]) B.burnSource[enemyTeamName][target.index] = {};
        B.burnSource[enemyTeamName][target.index][burnPlacerId] = (B.burnSource[enemyTeamName][target.index][burnPlacerId] || 0) + 1;
        const totalBurn = B.burn[enemyTeamName][target.index];
        log(`<span class="log-ability">BURN!</span> AI placed on <span class="log-dmg">${target.ghost.name}</span>! (${totalBurn} total)`);
        // Mable (446) Hex: burn placement = enemy -1 die
        const mableActive = active(B[team]);
        if (mableActive && mableActive.id === 446 && !mableActive.ko) {
          if (!B.hexDieRemoval) B.hexDieRemoval = { red: 0, blue: 0 };
          B.hexDieRemoval[enemyTeamName] = (B.hexDieRemoval[enemyTeamName] || 0) + 1;
          log(`<span class="log-ability">${mableActive.name}</span> — Hex! Burn placed → enemy -1 die next roll!`);
        }
      }
    }
  }

  // --- Hex (Mable 446): spend burn for -1 enemy die + sacred fire ---
  if (f.id === 446 && !f.ko && (r.burn || 0) > 0) {
    while ((r.burn || 0) > 0) {
      useHex(team);
    }
  }

  renderBattle();
}

// --- POST-ROLL AI: auto-use moonstone and lucky stone for blue ---
function aiHandlePostRoll() {
  if (!AI_ACTIVE || !B) return;

  // Auto-use Moonstone when it pops up for blue
  if (B.pendingMoonstone && B.pendingMoonstone.team === 'blue') {
    const pm = B.pendingMoonstone;

    if (pm.phase === 'pick-resource') {
      // Click the moonstone tile to activate it
      const resEl = document.getElementById('blue-resources');
      const msEl = resEl && resEl.querySelector('.res-tile.moonstone.rerollable');
      if (msEl) {
        setTimeout(() => { if (msEl.onclick) msEl.onclick(); }, 600);
      } else {
        // If no clickable moonstone, skip
        setTimeout(() => skipMoonstone(), 600);
      }
      return;
    }

    if (pm.phase === 'pick-die') {
      // Pick the lowest die to change
      const dice = pm.dice || B.blueDice || [];
      let worstIdx = 0;
      let worstVal = 7;
      dice.forEach((d, i) => { if (d < worstVal) { worstVal = d; worstIdx = i; } });
      setTimeout(() => { if (typeof pickMsDie === 'function') pickMsDie(worstIdx); }, 500);
      return;
    }

    if (pm.phase === 'pick-value') {
      // Change to 6 (best value)
      setTimeout(() => { if (typeof pickMsValue === 'function') pickMsValue(6); }, 500);
      return;
    }
  }

  // Auto-use Lucky Stone when it appears for blue
  const blueDiceEl = document.getElementById('blue-dice');
  if (blueDiceEl) {
    const rerollable = blueDiceEl.querySelectorAll('.die.rerollable');
    if (rerollable.length > 0 && B.phase && B.phase.includes('luckystone') && B.blue?.resources?.luckyStone > 0) {
      // Find lowest die and click it
      let lowestEl = null, lowestVal = 7;
      rerollable.forEach(el => {
        const val = parseInt(el.textContent);
        if (!isNaN(val) && val < lowestVal) { lowestVal = val; lowestEl = el; }
      });
      if (lowestEl && lowestVal <= 3) {
        setTimeout(() => { if (lowestEl.onclick) lowestEl.onclick(); }, 600);
      }
    }
  }
}

// ============================================================
// LIVE PVP MODE — real-time 1v1 via Firebase
// ============================================================
// URL: ?livepvp=GAMEID&side=red|blue&red=IDS&blue=IDS
// Each player controls ONLY their roll button + their decisions.
// Dice sync: when you roll, your dice broadcast to opponent.
// Opponent's dice are injected DIRECTLY into engine state (bypassing rollReady
// to avoid pre-roll ability modals blocking on the wrong client).
(function checkLivePvPParams() {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get('livepvp');
  if (!gameId) return;

  const side = params.get('side');
  if (side !== 'red' && side !== 'blue') return;

  const redParam = params.get('red');
  const blueParam = params.get('blue');
  if (!redParam || !blueParam) return;

  const redIds = redParam.split(',').map(Number).filter(id => ghostData(id));
  const blueIds = blueParam.split(',').map(Number).filter(id => ghostData(id));
  if (redIds.length !== 3 || blueIds.length !== 3) return;

  LIVE_PVP = true;
  MP_MODE = true;
  PVP_SIDE = side;
  PVP_GAME_ID = gameId;
  PVP_GAME_REF = db.ref(`mp/livegames/${gameId}`);

  // Force standard settings
  const speedEl = document.getElementById('speedSlider');
  if (speedEl) speedEl.value = 0;
  const hlCheck = document.getElementById('handLimitCheckbox');
  if (hlCheck) hlCheck.checked = true;
  const hlSlider = document.getElementById('handLimitSlider');
  if (hlSlider) hlSlider.value = 4;
  const stSlider = document.getElementById('specialsTimerSlider');
  if (stSlider) stSlider.value = 8; // v731: 8 second timer (was 5)

  // Set teams
  S.redPicks = redIds;
  S.bluePicks = blueIds;

  // Show player labels
  const redName = params.get('redName') || 'Red';
  const blueName = params.get('blueName') || 'Blue';
  MP_PLAYER_NAMES.red = decodeURIComponent(redName);
  MP_PLAYER_NAMES.blue = decodeURIComponent(blueName);
  const redTitle = document.querySelector('.roster-title.red');
  const blueTitle = document.querySelector('.roster-title.blue');
  if (redTitle) redTitle.innerHTML = `<span class="roster-dot"></span> ${decodeURIComponent(redName)}${side === 'red' ? ' (You)' : ''}`;
  if (blueTitle) blueTitle.innerHTML = `<span class="roster-dot"></span> ${decodeURIComponent(blueName)}${side === 'blue' ? ' (You)' : ''}`;

  // Switch to arena tab and hide team selection UI
  switchTab('battle');
  const teamRosters = document.getElementById('teamRosters');
  if (teamRosters) teamRosters.style.display = 'none';
  const randRow = document.querySelector('.random-pick-row');
  if (randRow) randRow.style.display = 'none';
  const controls = document.querySelector('.controls');
  if (controls) controls.style.display = 'none';
  // Hide the tab bar itself — no switching in PvP
  const tabs = document.querySelector('.tabs');
  if (tabs) tabs.style.display = 'none';

  // Add wait banner
  const waitBanner = document.createElement('div');
  waitBanner.id = 'pvp-wait-banner';
  waitBanner.style.cssText = 'text-align:center;padding:12px;font-family:Creepster,cursive;font-size:1.2rem;color:var(--gold-bright);letter-spacing:2px;display:none;';
  waitBanner.textContent = "Waiting for opponent's roll...";
  const bv = document.getElementById('battle-view');
  if (bv) bv.prepend(waitBanner);

  // Add turn timer display — prominent, above the dice
  const timerBar = document.createElement('div');
  timerBar.id = 'pvp-turn-timer';
  timerBar.style.cssText = 'text-align:center;padding:8px 16px;font-family:Creepster,cursive;font-size:1.1rem;font-weight:700;color:var(--text2);letter-spacing:2px;background:rgba(0,0,0,0.4);border-radius:8px;margin:4px auto;max-width:400px;';
  timerBar.textContent = '';
  // Insert at top of battle view
  const battleView = document.getElementById('battle-view');
  if (battleView) battleView.prepend(timerBar);

  // Start battle immediately
  setTimeout(() => {
    renderPicks();
    startBattle();
    // Duel Phase disabled in live PvP — the Firebase ready-check already ensures
    // both players commit resources before resolution (Blue rolls when ready).
    if (B) B.duelPhaseMode = false;
    setupLivePvP();
  }, 400);
})();

// ---- LIVE PVP SETUP ----
let PVP_BLUE_READY_DATA = null;
// v726: generate BOTH dice sets only when both players are ready.
// Top-level so rollReady can call it from Red's roll handler.
function pvpTryGenerateDice() {
  if (!PVP_OPPONENT_READY || !pvpRedReady || !B) return;
  if (B.phase !== 'rolling') return;

  // Apply Blue's committed resources
  if (PVP_BLUE_READY_DATA) {
    if (PVP_BLUE_READY_DATA.committed) B.committed.blue = PVP_BLUE_READY_DATA.committed;
    if (PVP_BLUE_READY_DATA.resources) B.blue.resources = PVP_BLUE_READY_DATA.resources;
    if (PVP_BLUE_READY_DATA.activeHp != null) {
      const blueActive = active(B.blue);
      if (blueActive) blueActive.hp = PVP_BLUE_READY_DATA.activeHp;
    }
    PVP_BLUE_READY_DATA = null;
  }
  PVP_OPPONENT_READY = false;
  pvpRedReady = false;

  // Now generate Red's dice, then Blue's dice — standard engine flow
  doTeamRoll('red', document.getElementById('rollRedBtn'));
  // Small delay so Red's dice broadcast first, then Blue's
  setTimeout(() => { rollReady('blue'); }, 50);
}

function setupLivePvP() {
  if (!LIVE_PVP || !PVP_GAME_REF) return;

  const mySide = PVP_SIDE;
  const oppSide = mySide === 'red' ? 'blue' : 'red';
  const oppBtnId = oppSide === 'red' ? 'rollRedBtn' : 'rollBlueBtn';

  // Clean up stale data from previous games
  PVP_GAME_REF.child('blueReady').set(false);
  PVP_GAME_REF.child('redReady').set(false);
  PVP_GAME_REF.child('committedUpdate').set(null);
  PVP_GAME_REF.child('rolls').remove();
  PVP_GAME_REF.child('roundResult').remove();
  PVP_GAME_REF.child('koSwap').remove();
  PVP_GAME_REF.child('koSwapRequest').remove();
  PVP_GAME_REF.child('swap').remove();
  PVP_GAME_REF.child('gameOver').remove();
  PVP_GAME_REF.child('specialsChoice').remove(); // v731
  PVP_GAME_REF.child('specialsDone').set(null);   // v731

  // Hide opponent's roll button
  const oppBtn = document.getElementById(oppBtnId);
  if (oppBtn) oppBtn.style.display = 'none';

  // Connection tracking
  PVP_GAME_REF.child(`connected/${mySide}`).set(true);
  PVP_GAME_REF.child(`connected/${mySide}`).onDisconnect().set(false);

  // --- DICE SYNC (Red-authoritative) ---
  // Red generates ALL dice. Blue sends "ready" signal.
  // When both are ready, Red rolls both sides and broadcasts results.
  if (mySide === 'blue') {
    // v725: Blue listens for dice rolls, animates them, AND runs local combat resolution.
    // pvpInjectOpponentDice handles Red's dice; for Blue's own dice we inject + animate directly.
    // When both dice arrive, pvpInjectOpponentDice triggers doPostRollAndResolve locally.
    PVP_GAME_REF.child('rolls').on('child_added', snap => {
      const data = snap.val();
      if (!data || !B || B.phase === 'over') return;
      snap.ref.remove();
      if (typeof resetPvPAfk === 'function') resetPvPAfk();
      if (data.side === 'red') {
        // Red's dice — inject as opponent dice (triggers resolution if Blue's dice already present)
        pvpInjectOpponentDice('red', data.dice);
      } else {
        // Blue's own dice — inject into engine state + animate, then check for resolution
        pvpInjectOwnDice('blue', data.dice);
      }
    });

    // BLUE: listen for Red's authoritative round result
    // v725: when pvpBlueResolvedLocally is true, Blue already ran combat locally.
    // roundResult becomes a silent state correction — no effects, no callouts.
    let pvpBluePendingResults = []; // v729: queue results while Blue is in interactive state

    function pvpBlueProcessEvent(data) {
      // v730: queue roundResult while Blue is in any KO-related phase or mid-resolution.
      // Red's broadcasts (damageResolved, koSwap) arrive while Blue's local engine is
      // still processing — don't stomp the interactive KO picker or ability flow.
      if (B && (B.phase === 'ko-swap' || B.phase === 'ko-pause') && pvpBlueResolvedLocally) {
        pvpBluePendingResults.push(data);
        return;
      }

      // v722: reset AFK timer — Blue is actively watching, not idle
      if (typeof resetPvPAfk === 'function') resetPvPAfk();

      const banner = document.getElementById('pvp-wait-banner');
      if (banner) banner.style.display = 'none';

      // v726: dismiss stale PvP KO swap overlay if present
      const koOverlay = document.getElementById('pvp-ko-swap-overlay');
      if (koOverlay) koOverlay.style.display = 'none';

      if (pvpBlueResolvedLocally) {
        // v725: Blue already saw the full combat experience locally.
        // v728: Only re-render if Red's authoritative state actually differs from local state.
        const stateChanged = pvpApplyState(data.state);
        if (stateChanged) renderBattle();

        // Reset for next round on roundEnd
        if (data.event === 'roundEnd' || !data.event) {
          B.phase = 'ready';
          B.preRoll = null;
          B.committed.blue = { ice:0, fire:0, surge:0, auntSusan:0, auntSusanHeal:0, harrison:0, zainBlade:0 };
          pvpBlueResolvedLocally = false;
          const myBtn = document.getElementById('rollBlueBtn');
          if (myBtn && B.phase !== 'over') {
            myBtn.disabled = false;
            myBtn.textContent = 'ROLL';
          }
          renderBattle();
          if (typeof resetPvPAfk === 'function') resetPvPAfk();
          // v729: drain any results queued while Blue was in interactive phase
          while (pvpBluePendingResults.length > 0) {
            pvpBlueProcessEvent(pvpBluePendingResults.shift());
          }
        }

        // If game over from Red's authority
        if (data.gameOver) {
          setTimeout(() => {
            if (B && B.phase !== 'over') showGameOver(data.gameOver);
          }, 800);
        }
        return;
      }

      // Fallback: Blue hasn't resolved locally (shouldn't happen in v725, but safe)
      const abilities = data.abilityEvents || [];
      const hasAbilities = abilities.length > 0;

      // v724: Dice are animated live from the `rolls` listener.
      if (B.redDice && B.blueDice) {
        renderDice(B.redDice, B.blueDice);
        highlightRollPreview('red', B.redDice);
        highlightRollPreview('blue', B.blueDice);
      }

      if (hasAbilities) {
        const last = abilities[abilities.length - 1];
        showAbilityCallout(last.name, last.color, last.desc, last.team);
      }
      pvpApplyState(data.state);
      renderBattle();

      if (data.event === 'roundEnd' || !data.event) {
        B.phase = 'ready';
        B.preRoll = null;
        B.committed.blue = { ice:0, fire:0, surge:0, auntSusan:0, auntSusanHeal:0, harrison:0, zainBlade:0 };
        const myBtn = document.getElementById('rollBlueBtn');
        if (myBtn && B.phase !== 'over') {
          myBtn.disabled = false;
          myBtn.textContent = 'ROLL';
        }
        renderBattle();
        if (typeof resetPvPAfk === 'function') resetPvPAfk();
      }

      if (data.gameOver) {
        setTimeout(() => {
          if (B && B.phase !== 'over') showGameOver(data.gameOver);
        }, 800);
      }
    }

    PVP_GAME_REF.child('roundResult').on('child_added', snap => {
      const data = snap.val();
      if (!data || !B || B.phase === 'over') return;
      snap.ref.remove();
      pvpBlueProcessEvent(data);
    });
  } else {
    // v726: RED waits for BOTH ready signals before generating dice.
    // This gives Blue time to commit resources (Ice Shards, Fire, etc.)
    PVP_OPPONENT_READY = false;
    PVP_BLUE_READY_DATA = null;
    pvpRedReady = false;

    PVP_GAME_REF.child('blueReady').on('value', snap => {
      const data = snap.val();
      if (!data || !data.ready || !B || B.phase === 'over') return;
      PVP_OPPONENT_READY = true;
      PVP_BLUE_READY_DATA = data;
      PVP_GAME_REF.child('blueReady').set(false);

      const banner = document.getElementById('pvp-wait-banner');
      if (banner) banner.style.display = 'none';

      pvpTryGenerateDice();
    });

    // Poll: if both ready but phase wasn't right, retry
    setInterval(() => {
      if (PVP_OPPONENT_READY && pvpRedReady && B && B.phase !== 'over') pvpTryGenerateDice();
    }, 500);
  }

  // --- KO SWAP SYNC ---
  PVP_GAME_REF.child('koSwap').on('child_added', snap => {
    const data = snap.val();
    if (!data || data.side !== oppSide) return;
    snap.ref.remove();

    const banner = document.getElementById('pvp-wait-banner');
    if (banner) banner.style.display = 'none';

    if (B && B.phase === 'ko-swap' && B.koSwapQueue && B.koSwapQueue[0] === oppSide) {
      doKoSwap(oppSide, data.idx);
    }
  });

  // --- KO SWAP REQUEST (Blue receives from Red when Blue needs to pick) ---
  // v726: Blue now runs engine locally and auto-resolves KO swaps during resolution.
  // This Firebase listener is only needed as a FALLBACK when local resolution didn't handle it.
  if (mySide === 'blue') {
    PVP_GAME_REF.child('koSwapRequest').on('value', snap => {
      const data = snap.val();
      if (!data || data.side !== 'blue' || !B) return;
      PVP_GAME_REF.child('koSwapRequest').set(null);

      // v728: if Blue already resolved locally, the local engine showed the real picker.
      // Blue's doKoSwap already broadcast the choice — just skip the redundant picker.
      if (pvpBlueResolvedLocally) {
        // If Blue already picked (doKoSwap broadcast), skip. If not yet picked, the local
        // picker is still active and doKoSwap will broadcast when Blue chooses.
        if (B._blueKoSwapPick != null) {
          // Already broadcast — nothing to do
          B._blueKoSwapPick = null;
        }
        // Either way, don't show a second picker — local engine is handling it
        return;
      }

      const banner = document.getElementById('pvp-wait-banner');
      if (banner) banner.style.display = 'none';

      const aliveIdxes = data.aliveIdxes || [];
      const aliveNames = data.aliveNames || [];
      const fallenName = data.fallenName || 'Your ghost';

      if (aliveIdxes.length === 1) {
        narrate(`<b class="ko-text">${fallenName} is down!</b> <b class="blue-text">${aliveNames[0]}</b> steps up!`);
        PVP_GAME_REF.child('koSwap').push({ side: 'blue', idx: aliveIdxes[0], timestamp: firebase.database.ServerValue.TIMESTAMP });
        return;
      }

      narrate(`<b class="ko-text">${fallenName} is down!</b> <b class="blue-text">Blue</b> — who answers the call?`);

      let overlay = document.getElementById('pvp-ko-swap-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'pvp-ko-swap-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';
        document.body.appendChild(overlay);
      }
      overlay.innerHTML = '<div style="font-family:Creepster,cursive;font-size:1.6rem;color:var(--gold-bright);letter-spacing:2px;margin-bottom:8px;">Choose your next ghost!</div>';
      aliveIdxes.forEach((idx, i) => {
        const btn = document.createElement('button');
        btn.textContent = aliveNames[i];
        btn.style.cssText = 'font-family:Creepster,cursive;font-size:1.3rem;padding:14px 32px;border-radius:10px;border:2px solid var(--gold-bright);background:rgba(30,30,50,0.95);color:var(--text);cursor:pointer;min-width:200px;transition:transform 0.15s;';
        btn.onmouseenter = () => { btn.style.transform = 'scale(1.08)'; };
        btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
        btn.onclick = () => {
          overlay.style.display = 'none';
          PVP_GAME_REF.child('koSwap').push({ side: 'blue', idx: idx, timestamp: firebase.database.ServerValue.TIMESTAMP });
          narrate(`<b class="blue-text">${aliveNames[i]}</b> answers the call!`);
        };
        overlay.appendChild(btn);
      });
      overlay.style.display = 'flex';
    });
  }

  // --- v729: LIVE RESOURCE COMMIT SYNC ---
  // See opponent commit Ice Shards, Fire, Surge in real-time (the theater of the game)
  PVP_GAME_REF.child('committedUpdate').on('value', snap => {
    const data = snap.val();
    if (!data || data.side === mySide || !B) return;
    // Apply opponent's committed resources + updated resource pool + active HP
    if (data.committed) B.committed[data.side] = { ...data.committed };
    if (data.resources) Object.assign(B[data.side].resources, data.resources);
    if (data.activeHp != null) {
      const oppActive = active(B[data.side]);
      if (oppActive) oppActive.hp = data.activeHp;
    }
    // v735: sync burn state — critical for entry damage on KO swaps
    if (data.burn) {
      B.burn = data.burn;
      if (!B.burn.red) B.burn.red = {};
      if (!B.burn.blue) B.burn.blue = {};
    }
    if (data.burnSource) B.burnSource = data.burnSource;
    renderBattle();
    playSfx('sfxSpecial', 0.15); // subtle audio cue that opponent is doing something
  });

  // --- VOLUNTARY SWAP SYNC ---
  PVP_GAME_REF.child('swap').on('child_added', snap => {
    const data = snap.val();
    if (!data || data.side !== oppSide) return;
    snap.ref.remove();
    if (B && B.phase === 'ready') doSwap(oppSide, data.idx);
  });

  // --- DISCONNECT DETECTION ---
  // If opponent disconnects, they forfeit
  PVP_GAME_REF.child(`connected/${oppSide}`).on('value', snap => {
    const connected = snap.val();
    // Only trigger forfeit if game is in progress (not during initial load)
    if (connected === false && B && B.phase !== 'over' && B.round > 1) {
      const banner = document.getElementById('pvp-wait-banner');
      if (banner) {
        banner.textContent = 'Opponent disconnected — you win!';
        banner.style.display = 'block';
        banner.style.color = 'var(--uncommon)';
      }
      // Trigger game over — we win
      setTimeout(() => {
        if (B && B.phase !== 'over') showGameOver(mySide);
      }, 1500);
    }
  });

  // --- TURN TIMER + AFK TIMEOUT ---
  let pvpAfkTimer = null;
  let pvpAfkWarned = false;
  let pvpTurnStart = Date.now();
  let pvpTimerInterval = null;

  function updateTurnTimer() {
    const timerEl = document.getElementById('pvp-turn-timer');
    if (!timerEl || !B || B.phase === 'over') {
      if (timerEl) timerEl.textContent = '';
      return;
    }

    const elapsed = Math.floor((Date.now() - pvpTurnStart) / 1000);
    const remaining = Math.max(0, 45 - elapsed); // v722: 45s total (was 25s — too tight with ability replays)

    // Determine whose turn it is
    const myBtn = document.getElementById(mySide === 'red' ? 'rollRedBtn' : 'rollBlueBtn');
    const myTurnToRoll = myBtn && !myBtn.disabled && !myBtn.classList.contains('locked') &&
                         (B.phase === 'ready' || B.phase === 'rolling');

    if (B.phase === 'ko-swap') {
      const whoSwaps = B.koSwapQueue && B.koSwapQueue[0];
      if (whoSwaps === mySide) {
        timerEl.textContent = `Your pick — ${remaining}s`;
        timerEl.style.color = remaining <= 10 ? 'var(--accent)' : 'var(--gold-bright)';
      } else {
        timerEl.textContent = `Opponent picking...`;
        timerEl.style.color = 'var(--text2)';
      }
    } else if (myTurnToRoll) {
      if (remaining <= 10) {
        timerEl.textContent = `ROLL NOW! ${remaining}s`;
        timerEl.style.color = 'var(--accent)';
        timerEl.style.fontSize = '1.4rem';
        timerEl.style.background = 'rgba(233,69,96,0.2)';
        timerEl.style.animation = 'pvpTimerPulse 0.5s ease-in-out infinite';
      } else if (remaining <= 20) {
        timerEl.textContent = `Your roll — ${remaining}s`;
        timerEl.style.color = 'var(--accent)';
        timerEl.style.fontSize = '1.2rem';
        timerEl.style.background = 'rgba(233,69,96,0.1)';
        timerEl.style.animation = '';
      } else {
        timerEl.textContent = `Your roll — ${remaining}s`;
        timerEl.style.color = 'var(--gold-bright)';
        timerEl.style.fontSize = '1.1rem';
        timerEl.style.background = 'rgba(0,0,0,0.4)';
        timerEl.style.animation = '';
      }
    } else if (B.phase === 'ready' || B.phase === 'rolling') {
      timerEl.textContent = `Waiting for opponent...`;
      timerEl.style.color = 'var(--text2)';
      timerEl.style.fontSize = '1.1rem';
      timerEl.style.background = 'rgba(0,0,0,0.4)';
      timerEl.style.animation = '';
    } else {
      timerEl.textContent = '';
    }
  }

  // Start the visible timer
  pvpTimerInterval = setInterval(updateTurnTimer, 1000);

  function resetPvPAfk() {
    clearTimeout(pvpAfkTimer);
    pvpAfkWarned = false;
    pvpTurnStart = Date.now();
    const warn = document.getElementById('pvp-afk-warning');
    if (warn) warn.style.display = 'none';

    pvpAfkTimer = setTimeout(() => {
      if (!B || B.phase === 'over' || !LIVE_PVP) return;
      const myBtn = document.getElementById(mySide === 'red' ? 'rollRedBtn' : 'rollBlueBtn');
      if (!myBtn || myBtn.disabled || myBtn.classList.contains('locked')) return;
      if (B.phase !== 'ready' && B.phase !== 'rolling') return;

      pvpAfkWarned = true;
      let warn = document.getElementById('pvp-afk-warning');
      if (!warn) {
        warn = document.createElement('div');
        warn.id = 'pvp-afk-warning';
        warn.style.cssText = 'text-align:center;padding:10px;font-weight:800;font-size:1rem;color:var(--accent);display:none;';
        document.querySelector('.battle-arena')?.prepend(warn);
      }
      warn.textContent = 'Roll now or forfeit in 15 seconds!';
      warn.style.display = 'block';

      setTimeout(() => {
        if (!pvpAfkWarned || !B || B.phase === 'over') return;
        const myBtn2 = document.getElementById(mySide === 'red' ? 'rollRedBtn' : 'rollBlueBtn');
        if (myBtn2 && !myBtn2.disabled && !myBtn2.classList.contains('locked') &&
            (B.phase === 'ready' || B.phase === 'rolling')) {
          warn.textContent = 'Time expired — you forfeit!';
          PVP_GAME_REF.child(`connected/${mySide}`).set(false);
          setTimeout(() => {
            if (B && B.phase !== 'over') {
              const winSide = mySide === 'red' ? 'blue' : 'red';
              showGameOver(winSide);
            }
          }, 1000);
        }
      }, 15000); // v722: 15s forfeit window (was 10s)
    }, 30000); // v722: 30s before warning (was 15s)
  }

  // v736: only reset AFK timer on clicks during roll phases, not during ko-swap.
  // During ko-swap the timer was resetting on every click (including swap card clicks),
  // making the countdown jump back to 45s and preventing players from swapping.
  document.addEventListener('click', () => {
    if (B && (B.phase === 'ko-swap' || B.phase === 'ko-pause')) return; // don't reset during swaps
    resetPvPAfk();
  });
  // Start initial timer
  resetPvPAfk();

  // Cleanup
  window.addEventListener('beforeunload', () => {
    if (PVP_GAME_REF) PVP_GAME_REF.child(`connected/${mySide}`).set(false);
    clearTimeout(pvpAfkTimer);
    clearInterval(pvpTimerInterval);
  });

  // --- v722: CHOICE MODAL SPECTATING ---
  // When Red opens a choice modal (Pal Al, Gordok, Selene, etc.), broadcast it
  // so Blue sees what's happening instead of staring at a blank screen.
  if (mySide === 'red') {
    // Watch all selene-overlay elements for .active class
    const overlays = document.querySelectorAll('.selene-overlay');
    overlays.forEach(ol => {
      const obs = new MutationObserver(() => {
        if (ol.classList.contains('active')) {
          // Extract the ability name from the overlay's banner or h3
          const banner = ol.querySelector('.selene-banner');
          const h3 = ol.querySelector('h3');
          const abilityText = banner ? banner.textContent.trim() : (h3 ? h3.textContent.trim() : 'Making a choice...');
          PVP_GAME_REF.child('choiceModal').set({ text: abilityText, ts: Date.now() });
        } else {
          PVP_GAME_REF.child('choiceModal').set(null);
        }
      });
      obs.observe(ol, { attributes: true, attributeFilter: ['class'] });
    });
  } else {
    // Blue: show spectator banner when Red has a choice modal open
    PVP_GAME_REF.child('choiceModal').on('value', snap => {
      const data = snap.val();
      let spectBanner = document.getElementById('pvp-choice-spectate');
      if (!spectBanner) {
        spectBanner = document.createElement('div');
        spectBanner.id = 'pvp-choice-spectate';
        spectBanner.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;' +
          'background:rgba(0,0,0,0.85);border:2px solid var(--gold-bright);border-radius:14px;padding:20px 32px;' +
          'font-family:Creepster,cursive;font-size:1.3rem;color:var(--gold-bright);text-align:center;letter-spacing:2px;' +
          'display:none;pointer-events:none;animation:pvpTimerPulse 1.5s ease-in-out infinite;';
        document.body.appendChild(spectBanner);
      }
      if (data && data.text) {
        spectBanner.textContent = '⚔️ ' + data.text;
        spectBanner.style.display = 'block';
        if (typeof resetPvPAfk === 'function') resetPvPAfk();
      } else {
        spectBanner.style.display = 'none';
      }
    });
  }
}

// v723: Animate dice on Blue's screen without running resolution.
// Blue sees the full dice show (shake → reveal → triples) but combat
// resolution still comes from Red's roundResult broadcast.
function pvpAnimateDice(side, dice) {
  if (!B) return;
  // Create minimal preRoll structure if needed (don't run doPreRollSetup — that triggers abilities)
  if (!B.preRoll) {
    B.preRoll = {
      red: { count: ghostData(active(B.red).id)?.dice ?? 3, dice: null },
      blue: { count: ghostData(active(B.blue).id)?.dice ?? 3, dice: null }
    };
    B.phase = 'rolling';
    renderBattle();
  }
  // Store dice in engine state
  B.preRoll[side].dice = dice;
  if (side === 'red') B.redDice = dice;
  else B.blueDice = dice;

  const f = active(B[side]);
  const cls = side === 'red' ? 'red-text' : 'blue-text';
  const diceCount = dice.length;

  // Full dice animation: shake → SFX → reveal → triples
  showRolling(side, diceCount);
  if (diceCount > 0) playSfx('sfxDiceRoll');
  narrate(`<b class="${cls}">${f.name}</b> rolls...`);

  setTimeout(() => {
    revealDice(side, dice);
    const roll = classify(dice);
    const tl = typeLabel(roll.type);
    narrate(`<b class="${cls}">${f.name}</b>&nbsp;rolled [${dice.join(', ')}]${tl ? '&nbsp;<b class="gold">'+tl+'</b>' : ''}`);
    if (isTripleOrBetter(roll.type)) showTriplesEffect(side, roll.type);
    // NO resolution here — Blue waits for roundResult from Red
  }, spd(700));
}

// Inject opponent's dice directly into the engine — bypasses rollReady entirely.
// This avoids all pre-roll ability modals (Timber, Romy, Tyler, etc.) firing
// on the wrong client. Those modals only fire when YOU click YOUR roll button.
function pvpInjectOpponentDice(oppSide, dice) {
  if (!B) return;

  // If pre-roll hasn't been set up yet (we haven't clicked our own roll),
  // we need to trigger it first so B.preRoll exists with correct dice counts.
  if (!B.preRoll) {
    doPreRollSetup();
    if (B.phase === 'ready') B.phase = 'rolling';
    renderBattle();
  }

  // Set opponent's dice in engine state
  B.preRoll[oppSide].dice = dice;
  if (oppSide === 'red') B.redDice = dice;
  else B.blueDice = dice;

  // Show rolling animation + reveal for opponent's side
  const f = active(B[oppSide]);
  const cls = oppSide === 'red' ? 'red-text' : 'blue-text';
  const diceCount = dice.length;

  showRolling(oppSide, diceCount);
  if (diceCount > 0) playSfx('sfxDiceRoll');
  narrate(`<b class="${cls}">${f.name}</b> rolls...`);

  setTimeout(() => {
    revealDice(oppSide, dice);
    const roll = classify(dice);
    const tl = typeLabel(roll.type);
    narrate(`<b class="${cls}">${f.name}</b>&nbsp;rolled [${dice.join(', ')}]${tl ? '&nbsp;<b class="gold">'+tl+'</b>' : ''}`);
    if (isTripleOrBetter(roll.type)) showTriplesEffect(oppSide, roll.type);

    // Check if both sides have rolled — resolve
    if (B.preRoll && B.preRoll.red.dice && B.preRoll.blue.dice && !B.preRoll.resolved) {
      B.preRoll.resolved = true;
      // v725: mark Blue as resolving locally so roundResult becomes a silent correction
      if (LIVE_PVP && PVP_SIDE === 'blue') pvpBlueResolvedLocally = true;
      const otherRoll = classify(B.preRoll[PVP_SIDE]?.dice || []);
      const eitherTripled = isTripleOrBetter(roll.type) || isTripleOrBetter(otherRoll.type);
      setTimeout(() => {
        doPostRollAndResolve(B.preRoll.red.dice, B.preRoll.blue.dice);
      }, spd(eitherTripled ? 1800 : 1400));
    }
  }, spd(700));
}

// v725: Inject Blue's own dice (received from Red's broadcast) into the engine.
// Similar to pvpInjectOpponentDice but for Blue's own side.
function pvpInjectOwnDice(side, dice) {
  if (!B) return;
  // Ensure preRoll exists (should already from doPreRollSetup in rollReady)
  if (!B.preRoll) {
    B.preRoll = {
      red: { count: ghostData(active(B.red).id)?.dice ?? 3, dice: null },
      blue: { count: ghostData(active(B.blue).id)?.dice ?? 3, dice: null }
    };
    if (B.phase === 'ready') B.phase = 'rolling';
    renderBattle();
  }

  // Store authoritative dice from Red (overrides any local placeholder)
  B.preRoll[side].dice = dice;
  if (side === 'red') B.redDice = dice;
  else B.blueDice = dice;

  // Reveal Blue's own dice (rolling animation already started in rollReady)
  const f = active(B[side]);
  const cls = side === 'red' ? 'red-text' : 'blue-text';

  setTimeout(() => {
    revealDice(side, dice);
    const roll = classify(dice);
    const tl = typeLabel(roll.type);
    narrate(`<b class="${cls}">${f.name}</b>&nbsp;rolled [${dice.join(', ')}]${tl ? '&nbsp;<b class="gold">'+tl+'</b>' : ''}`);
    if (isTripleOrBetter(roll.type)) showTriplesEffect(side, roll.type);

    // Check if both sides have rolled — resolve
    if (B.preRoll && B.preRoll.red.dice && B.preRoll.blue.dice && !B.preRoll.resolved) {
      B.preRoll.resolved = true;
      pvpBlueResolvedLocally = true;
      const otherRoll = classify(B.preRoll[side === 'red' ? 'blue' : 'red']?.dice || []);
      const eitherTripled = isTripleOrBetter(roll.type) || isTripleOrBetter(otherRoll.type);
      setTimeout(() => {
        doPostRollAndResolve(B.preRoll.red.dice, B.preRoll.blue.dice);
      }, spd(eitherTripled ? 1800 : 1400));
    }
  }, spd(400)); // shorter delay since rolling animation already started
}

// ---- HOOKS: broadcast our actions to Firebase ----

// Hook doTeamRoll — after our side rolls, broadcast dice
const _origDoTeamRollFn = doTeamRoll;
doTeamRoll = function(team, btn) {
  _origDoTeamRollFn(team, btn);

  // v723: Red broadcasts ALL dice (both sides) so Blue can animate them
  if (LIVE_PVP && PVP_SIDE === 'red' && B && B.preRoll && B.preRoll[team]?.dice) {
    PVP_GAME_REF.child('rolls').push({
      side: team,
      round: B.round,
      dice: B.preRoll[team].dice,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });

    // Show waiting banner if opponent hasn't rolled yet
    const oppSide = PVP_SIDE === 'red' ? 'blue' : 'red';
    if (!B.preRoll[oppSide]?.dice) {
      const banner = document.getElementById('pvp-wait-banner');
      if (banner) banner.style.display = 'block';
    }
  }
};

// Hook doKoSwap — broadcast our swap choice
const _origDoKoSwapFn = doKoSwap;
doKoSwap = function(team, idx) {
  if (LIVE_PVP && team === PVP_SIDE) {
    PVP_GAME_REF.child('koSwap').push({
      side: team, idx: idx,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  }
  _origDoKoSwapFn(team, idx);
  // Broadcast state after KO swap so Blue sees the new active ghost immediately
  pvpBroadcastState({ event: 'koSwap', swapTeam: team, swapIdx: idx });
};

// Hook doSwap — broadcast voluntary swaps
const _origDoSwapFn = doSwap;
doSwap = function(team, idx) {
  if (LIVE_PVP && team === PVP_SIDE) {
    PVP_GAME_REF.child('swap').push({
      side: team, idx: idx,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  }
  _origDoSwapFn(team, idx);
};

// ---- PVP STATE SYNC: Red is authoritative ----
function pvpBroadcastState(extras) {
  if (!LIVE_PVP || PVP_SIDE !== 'red' || !PVP_GAME_REF || !B) return;
  const state = pvpSerializeState();
  PVP_GAME_REF.child('stateSync').set(state);
  // v721: include ability events so Blue can replay callouts
  const abilityEvts = pvpAbilityEvents.length > 0 ? pvpAbilityEvents.slice() : null;
  pvpAbilityEvents = [];
  PVP_GAME_REF.child('roundResult').push({
    state: state,
    redDice: B.redDice || null,
    blueDice: B.blueDice || null,
    abilityEvents: abilityEvts,
    gameOver: null,
    ...extras,
    ts: Date.now()
  });
}

function pvpSerializeState() {
  if (!B) return null;
  return {
    round: B.round,
    phase: B.phase || null,
    koSwapQueue: B.koSwapQueue ? B.koSwapQueue.slice() : null,
    red: {
      activeIdx: B.red.activeIdx,
      ghosts: B.red.ghosts.map(g => ({ id: g.id, hp: g.hp, maxHp: g.maxHp, ko: g.ko, killedBy: g.killedBy || null })),
      resources: { ...B.red.resources },
      committed: B.committed.red ? { ...B.committed.red } : null
    },
    blue: {
      activeIdx: B.blue.activeIdx,
      ghosts: B.blue.ghosts.map(g => ({ id: g.id, hp: g.hp, maxHp: g.maxHp, ko: g.ko, killedBy: g.killedBy || null })),
      resources: { ...B.blue.resources },
      committed: B.committed.blue ? { ...B.committed.blue } : null
    },
    willowLostLast: B.willowLostLast ? { ...B.willowLostLast } : { red: false, blue: false },
    iceBladeForgedPermanent: B.iceBladeForgedPermanent ? { ...B.iceBladeForgedPermanent } : { red: false, blue: false },
    flameBlade: B.flameBlade ? { ...B.flameBlade } : { red: false, blue: false },
    sophiaMask: B.sophiaMask ? { ...B.sophiaMask } : { red: null, blue: null },
    sophiaMaskActive: B.sophiaMaskActive ? { ...B.sophiaMaskActive } : { red: false, blue: false },
    duelLastLoser: B.duelLastLoser || null,
    burn: B.burn ? { red: { ...B.burn.red }, blue: { ...B.burn.blue } } : { red: {}, blue: {} },
    log: B.log.slice(0, 20),
    ts: Date.now()
  };
}

function pvpApplyState(state) {
  if (!B || !state) return;
  B.round = state.round;

  // v728: track whether anything actually changed, to avoid unnecessary re-renders
  let changed = false;

  // Sync ghosts: HP, KO, activeIdx — only update if values actually differ
  ['red', 'blue'].forEach(side => {
    if (!state[side]) return;
    // v736: skip activeIdx update during Blue's local resolution — prevents
    // "old ghost" flash where Red's state correction briefly shows the wrong fighter
    if (B[side].activeIdx !== state[side].activeIdx) {
      if (!(pvpBlueResolvedLocally && (B.phase === 'ko-swap' || B.phase === 'ko-pause'))) {
        B[side].activeIdx = state[side].activeIdx;
        changed = true;
      }
    }
    state[side].ghosts.forEach((sg, i) => {
      const g = B[side].ghosts[i];
      if (!g) return;
      if (g.hp !== sg.hp) { g.hp = sg.hp; changed = true; }
      if (g.maxHp !== sg.maxHp) { g.maxHp = sg.maxHp; changed = true; }
      if (g.ko !== sg.ko) { g.ko = sg.ko; changed = true; }
      if (sg.killedBy) g.killedBy = sg.killedBy;
    });
    // Sync resources — only update keys that differ
    if (state[side].resources) {
      const sr = state[side].resources;
      const br = B[side].resources;
      for (const k in sr) {
        if (br[k] !== sr[k]) { br[k] = sr[k]; changed = true; }
      }
    }
    // v724: sync committed resources so Blue sees Red's specials (and vice versa)
    if (state[side].committed) {
      B.committed[side] = { ...state[side].committed };
    }
  });

  // Sync battle flags
  if (state.willowLostLast) B.willowLostLast = state.willowLostLast;
  if (state.iceBladeForgedPermanent) B.iceBladeForgedPermanent = state.iceBladeForgedPermanent;
  if (state.flameBlade) B.flameBlade = state.flameBlade;
  if (state.sophiaMask) B.sophiaMask = state.sophiaMask;
  if (state.sophiaMaskActive) B.sophiaMaskActive = state.sophiaMaskActive;
  if (state.duelLastLoser !== undefined) B.duelLastLoser = state.duelLastLoser;
  if (state.burn) B.burn = state.burn;
  if (state.log) B.log = state.log;

  return changed; // v728: caller can skip renderBattle() if nothing changed
}

// Also sync game over: if Red declares game over, Blue should see it
if (LIVE_PVP && PVP_GAME_REF) {
  PVP_GAME_REF.child('gameOver').on('value', snap => {
    const data = snap.val();
    if (data && data.winner && B && B.phase !== 'over') {
      // Red declared game over — show it on Blue's client too
      setTimeout(() => {
        if (B && B.phase !== 'over') showGameOver(data.winner);
      }, 500);
    }
  });
}

// ---- PVP: Auto-resolve ability modals ----
// v728: Both sides auto-resolve ONLY the opponent's modals.
// Blue's own interactive abilities (Lucky Stone, Moonstone, KO swap, etc.) now show real pickers.
// Red's roundResult silently corrects any divergence afterward.
if (LIVE_PVP) {
  const oppSide = PVP_SIDE === 'red' ? 'blue' : 'red';
  const mySide = PVP_SIDE;
  // v728: auto-resolve opponent's modals only — never auto-resolve your own team's choices
  const shouldAutoResolve = (modalTeam) => {
    return modalTeam === oppSide;
  };

  // Poll for modals and auto-resolve them
  setInterval(() => {
    if (!B || B.phase === 'over') return;

    // Pal Al — auto-pick damage (aggressive)
    if (B.wiseAlPending && shouldAutoResolve(B.wiseAlPending.winTeamName)) {
      setTimeout(() => { if (B.wiseAlPending) doWiseAlChoice('damage'); }, 300);
    }
    // Gordok — auto-pick damage
    if (B.gordokPending && shouldAutoResolve(B.gordokPending.winTeamName)) {
      setTimeout(() => { if (B.gordokPending) doGordokChoice('damage'); }, 300);
    }
    // Sophia — auto-pick Mask of Night (AI prefers dice mirroring)
    if (B.sophiaPending && shouldAutoResolve(B.sophiaPending.winTeamName)) {
      setTimeout(() => { if (B.sophiaPending) doSophiaChoice('night'); }, 300);
    }
    // Selene — auto-pick heal
    if (B.selenePending && shouldAutoResolve(B.selenePending.tName)) {
      const overlay = document.getElementById('seleneOverlay');
      if (overlay && overlay.classList.contains('active')) {
        setTimeout(() => { if (typeof doSeleneChoice === 'function') doSeleneChoice('heal'); }, 300);
      }
    }
    // Pressure / Raditz Hunt — auto-pick first available when overlay is active
    // v728: only auto-pick if the picker is for the OPPONENT's team
    const pressureOvl = document.getElementById('pressureOverlay');
    if (pressureOvl && pressureOvl.classList.contains('active') && B.pressurePickerTeam && shouldAutoResolve(B.pressurePickerTeam)) {
      const firstOpt = pressureOvl.querySelector('.pressure-opt');
      if (firstOpt) {
        setTimeout(() => { firstOpt.click(); }, 300);
      }
    }
    // Hand Limit — auto-discard first available resource
    // v728: only auto-discard for the opponent's team
    const handLimitOvl = document.getElementById('handLimitOverlay');
    if (handLimitOvl && handLimitOvl.classList.contains('active') && B.handLimitPending && shouldAutoResolve(B.handLimitPending.team)) {
      const hlTeam = B.handLimitPending.team;
      const hlRes = B[hlTeam]?.resources;
      if (hlRes) {
        const hlKey = Object.keys(hlRes).find(k => (hlRes[k] || 0) > 0);
        if (hlKey) setTimeout(() => { if (typeof doHandLimitDiscard === 'function') doHandLimitDiscard(hlTeam, hlKey); }, 300);
      }
    }
    // Sylvia — auto-roll (don't skip)
    const sylviaOverlay = document.getElementById('sylviaOverlay');
    if (sylviaOverlay && sylviaOverlay.classList.contains('active') && B.sylviaResume && B.sylviaTeamName && shouldAutoResolve(B.sylviaTeamName)) {
      setTimeout(() => { if (typeof doSylviaRoll === 'function') doSylviaRoll(); }, 300);
    }
    // Balatron — auto-roll
    const balatronOverlay = document.getElementById('balatronOverlay');
    if (balatronOverlay && balatronOverlay.classList.contains('active') && B.balatronPending && shouldAutoResolve(B.balatronPending.loseTeamName)) {
      setTimeout(() => { if (typeof doBalatronRoll === 'function') doBalatronRoll(); }, 300);
    }
    // DarkWing — auto-yes (reroll)
    if (B.darkWingPending && shouldAutoResolve(B.darkWingPending.team)) {
      const overlay = document.getElementById('darkWingOverlay');
      if (overlay && overlay.classList.contains('active')) {
        setTimeout(() => { if (typeof doDarkWingChoice === 'function') doDarkWingChoice('yes'); }, 300);
      }
    }
    // Jeanie — auto-yes (force reroll)
    if (B.jeaniePending && shouldAutoResolve(B.jeaniePending.team)) {
      const overlay = document.getElementById('jeanieOverlay');
      if (overlay && overlay.classList.contains('active')) {
        setTimeout(() => { if (typeof doJeanieChoice === 'function') doJeanieChoice('yes'); }, 300);
      }
    }
    // Nick Knack — auto-pick first option
    const nickOverlay = document.getElementById('nickKnackOverlay');
    if (nickOverlay && nickOverlay.classList.contains('active') && B.nickKnackPending && shouldAutoResolve(B.nickKnackPending.team)) {
      setTimeout(() => { if (typeof doNickKnackSteal === 'function') doNickKnackSteal(B.nickKnackPending.team, 'moonstone'); }, 300);
    }
    // Burn picker — auto-pick first enemy sideline
    const burnOverlay = document.getElementById('burnOverlay');
    if (burnOverlay && burnOverlay.classList.contains('active') && B.burnPickerPending && shouldAutoResolve(B.burnPickerPending.team)) {
      const autoPickTeam = B.burnPickerPending.team === 'red' ? B.blue : B.red;
      const target = autoPickTeam.ghosts.find((g, i) => i !== autoPickTeam.activeIdx && !g.ko);
      if (target) {
        const idx = autoPickTeam.ghosts.indexOf(target);
        setTimeout(() => { if (typeof doBurnPick === 'function') doBurnPick(idx); }, 300);
      }
    }
    // Firefly picker — auto-pick moonstone
    const fireflyOverlay = document.getElementById('fireflyOverlay');
    if (fireflyOverlay && fireflyOverlay.classList.contains('active') && B.fireflyPending && shouldAutoResolve(B.fireflyPending.team)) {
      setTimeout(() => { if (typeof doFireflyChoice === 'function') doFireflyChoice('moonstone'); }, 300);
    }
    // Tommy — auto-yes / auto-roll chain
    const tommyOverlay = document.getElementById('tommyOverlay');
    if (tommyOverlay && tommyOverlay.classList.contains('active')) {
      if (B.tommyPending && shouldAutoResolve(B.tommyPending.team)) {
        setTimeout(() => { if (typeof doTommyChoice === 'function') doTommyChoice('yes'); }, 300);
      } else if (B.tommyChainPending && shouldAutoResolve(B.tommyChainPending.team)) {
        setTimeout(() => { if (typeof doTommyRoll === 'function') doTommyRoll(); }, 300);
      }
    }
    // Jackson — auto-yes
    const jacksonOverlay = document.getElementById('jacksonOverlay');
    if (jacksonOverlay && jacksonOverlay.classList.contains('active') && B.jacksonPending && shouldAutoResolve(B.jacksonPending.team)) {
      setTimeout(() => { if (typeof doJacksonChoice === 'function') doJacksonChoice('yes'); }, 300);
    }
    // Sonya — auto-yes
    const sonyaOverlay = document.getElementById('sonyaOverlay');
    if (sonyaOverlay && sonyaOverlay.classList.contains('active') && B.sonyaPending && shouldAutoResolve(B.sonyaPending.team)) {
      setTimeout(() => { if (typeof doSonyaChoice === 'function') doSonyaChoice('yes'); }, 300);
    }
    // Toboggan — auto-pick first ghost
    const tobogganOverlay = document.getElementById('tobogganOverlay');
    if (tobogganOverlay && tobogganOverlay.classList.contains('active') && B.tobogganPending && shouldAutoResolve(B.tobogganPending.winTeamName)) {
      const tobTeam = B[B.tobogganPending.winTeamName];
      const tobAlive = tobTeam.ghosts.filter((g,i) => i !== tobTeam.activeIdx && !g.ko);
      const tobIdx = tobAlive.length > 0 ? tobTeam.ghosts.indexOf(tobAlive[0]) : -1;
      setTimeout(() => { if (typeof doTobogganChoice === 'function') doTobogganChoice(tobIdx); }, 300);
    }
    // Fang Outside — auto-skip (don't swap)
    const fangOutsideOverlay = document.getElementById('fangOutsideOverlay');
    if (fangOutsideOverlay && fangOutsideOverlay.classList.contains('active') && B.fangOutsidePending && shouldAutoResolve(B.fangOutsidePending.winTeamName)) {
      setTimeout(() => { if (typeof doFangOutsideChoice === 'function') doFangOutsideChoice(-1); }, 300);
    }
    // Winston Scheme — auto-pick first target
    const winstonOverlay = document.getElementById('winstonSchemeOverlay');
    if (winstonOverlay && winstonOverlay.classList.contains('active') && B.winstonSchemePending && shouldAutoResolve(B.winstonSchemePending.winTeamName)) {
      const wsTeam = B[B.winstonSchemePending.loseTeamName];
      const wsAlive = wsTeam.ghosts.filter((g,i) => i !== wsTeam.activeIdx && !g.ko);
      const wsIdx = wsAlive.length > 0 ? wsTeam.ghosts.indexOf(wsAlive[0]) : -1;
      setTimeout(() => { if (typeof doWinstonSchemeChoice === 'function') doWinstonSchemeChoice(wsIdx); }, 300);
    }
    // Gus Gale Force picker — auto-pick first available
    const gfPickerOverlay = document.getElementById('galeForcePickerOverlay');
    if (gfPickerOverlay && gfPickerOverlay.classList.contains('active') && B.galeForcePicker && shouldAutoResolve(B.galeForcePicker.winTeamName)) {
      const gfLoseTeam = B[B.galeForcePicker.loseTeamName];
      const gfAlive = gfLoseTeam?.ghosts?.filter((g,i) => i !== gfLoseTeam.activeIdx && !g.ko);
      if (gfAlive && gfAlive.length > 0) {
        const gfIdx = gfLoseTeam.ghosts.indexOf(gfAlive[0]);
        setTimeout(() => { if (typeof doGaleForcePickerChoice === 'function') doGaleForcePickerChoice(gfIdx); }, 300);
      }
    }
    // Gus Gale Force — auto-accept (always force swap for rival AI)
    const gusGaleBtnEl = document.getElementById('gusGaleBtn');
    if (gusGaleBtnEl && gusGaleBtnEl.style.display !== 'none' && B.gusGaleReactivePending && shouldAutoResolve(B.gusGaleReactivePending.winTeamName)) {
      setTimeout(() => { if (typeof doGusGaleReactive === 'function') doGusGaleReactive('yes'); }, 300);
    }
    // Guardian Fairy — auto-decline (let damage apply normally)
    const gfReactiveOverlay = document.getElementById('guardianFairyOverlay');
    if (gfReactiveOverlay && gfReactiveOverlay.classList.contains('active') && B.guardianFairyReactivePending && shouldAutoResolve(B.guardianFairyReactivePending.loseTeamName)) {
      setTimeout(() => { if (typeof doGuardianFairyReactive === 'function') doGuardianFairyReactive('no'); }, 300);
    }
    // Jenkins — auto-roll greeting dice
    const jenkinsOverlay = document.getElementById('jenkinsOverlay');
    if (jenkinsOverlay && jenkinsOverlay.classList.contains('active') && B.jenkinsPending && shouldAutoResolve(B.jenkinsPending.team)) {
      setTimeout(() => { if (typeof doJenkinsRoll === 'function') doJenkinsRoll(); }, 300);
    }
    // Jasper — auto-roll flame dive
    const jasperOverlay = document.getElementById('jasperOverlay');
    if (jasperOverlay && jasperOverlay.classList.contains('active') && B.jasperPending && shouldAutoResolve(B.jasperPending.winTeamName)) {
      setTimeout(() => { if (typeof doJasperRoll === 'function') doJasperRoll(); }, 300);
    }
    // Sky Elusive — auto-roll counter die
    const skyElOverlay = document.getElementById('skyElusiveOverlay');
    if (skyElOverlay && skyElOverlay.classList.contains('active') && B.skyElusivePending && shouldAutoResolve(B.skyElusivePending.winTeamName)) {
      setTimeout(() => { if (typeof doSkyElusiveRoll === 'function') doSkyElusiveRoll(); }, 300);
    }
    // Fang Undercover swap — auto-pick first available sideline ghost
    const fuSwapOverlay = document.getElementById('fangUndercoverSwapOverlay');
    if (fuSwapOverlay && fuSwapOverlay.classList.contains('active') && B.fangUndercoverSwapData) {
      const fuLoseTeam = B[B.fangUndercoverSwapData.loseTeamName];
      if (fuLoseTeam && shouldAutoResolve(B.fangUndercoverSwapData.loseTeamName)) {
        const fuAlive = fuLoseTeam.ghosts.filter((g,i) => i !== fuLoseTeam.activeIdx && !g.ko);
        if (fuAlive.length > 0) {
          const fuIdx = fuLoseTeam.ghosts.indexOf(fuAlive[0]);
          setTimeout(() => { if (typeof doFangUndercoverSwapChoice === 'function') doFangUndercoverSwapChoice(fuIdx); }, 300);
        }
      }
    }
  }, 500);
}

// Hook renderBattle — hide opponent's controls after each render
const _origRenderBattle = renderBattle;
renderBattle = function() {
  _origRenderBattle();
  if (!LIVE_PVP) return;
  const oppSide = PVP_SIDE === 'red' ? 'blue' : 'red';

  // Always hide opponent's roll button
  const oppBtnId = oppSide === 'red' ? 'rollRedBtn' : 'rollBlueBtn';
  const oppBtn = document.getElementById(oppBtnId);
  if (oppBtn) oppBtn.style.display = 'none';

  // Block clicking opponent's specials/resources
  const oppResources = document.getElementById(`${oppSide}-resources`);
  if (oppResources) {
    oppResources.style.pointerEvents = 'none';
    oppResources.style.opacity = '0.7';
  }

  // Block ALL opponent-side sideline interactions
  document.querySelectorAll(`#${oppSide}-sl-left, #${oppSide}-sl-right`).forEach(el => {
    el.style.pointerEvents = 'none';
  });

  // During KO swap: only allow clicking YOUR OWN sideline when it's YOUR swap turn
  if (B && B.phase === 'ko-swap' && B.koSwapQueue) {
    const whoSwaps = B.koSwapQueue[0];
    // Block YOUR sideline if it's NOT your turn to swap
    if (whoSwaps !== PVP_SIDE) {
      document.querySelectorAll(`#${PVP_SIDE}-sl-left, #${PVP_SIDE}-sl-right`).forEach(el => {
        el.style.pointerEvents = 'none';
      });
    }
    // Block opponent's sideline always (they pick on their own client)
    document.querySelectorAll(`#${oppSide}-sl-left, #${oppSide}-sl-right`).forEach(el => {
      el.style.pointerEvents = 'none';
    });
  }

  // v730: manage wait banner during KO swaps
  if (B && B.phase === 'ko-swap' && B.koSwapQueue && B.koSwapQueue[0] === oppSide) {
    const banner = document.getElementById('pvp-wait-banner');
    if (banner) {
      banner.textContent = "Waiting for opponent to choose replacement...";
      banner.style.display = 'block';
    }
  } else if (B && LIVE_PVP) {
    // Dismiss banner when it's our turn or not in ko-swap
    const banner = document.getElementById('pvp-wait-banner');
    if (banner && B.phase !== 'rolling') banner.style.display = 'none';
  }
};

// ── BattleEngine facade ───────────────────────────────────────────
// This is the public API that raid-battle-adapter.js and other external
// code uses. It delegates to the appropriate module.
window.BattleEngine = {
  // Lifecycle
  startBattle,
  // State (from BattleCore)
  getState: () => B,
  setState: (state) => { B = state; S.battle = B; },
  getS: () => S,
  active,
  // Combat
  resolveRound, handleKOs, showGameOver,
  doKoSwap, openSwap, doSwap,
  // Rendering (from BattleUI)
  renderBattle,
  // AI
  startBlueAI, stopBlueAI,
  // Hooks (from BattleCore)
  onGameOver, onResetRollButtons, onPostResolve,
  // Abilities (from BattleAbilities)
  rollReady, doTeamRoll, startNextRound,
  // Dice
  classify, rollDice, weightedRoll
};
