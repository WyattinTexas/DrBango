// abilities.js — Layer 3: All 184 card ability implementations.
// Entry abilities, pre-roll modals, post-roll abilities, specials windows.
// Depends on: battle-core.js, dice.js, battle-ui.js

function triggerEntry(team, skipEntryEffects) {
  const f = active(team);
  const enemy = opp(team);
  if (skipEntryEffects || window._raidSkipEntry) return 0;

  const entryTeamName = team === B.red ? 'red' : 'blue';

  // Tyson (365) — Hop: when a disabled ghost enters play, re-enable its sideline ability
  if (B.tysonDisabled && B.tysonDisabled[entryTeamName].includes(team.activeIdx)) {
    B.tysonDisabled[entryTeamName] = B.tysonDisabled[entryTeamName].filter(i => i !== team.activeIdx);
    log(`<span class="log-ability">${f.name}</span> — enters play! Sideline ability re-enabled.`);
  }
  narrate(`<b class="${entryTeamName}-text">${f.name}</b> enters the arena!`);

  // Castle Guide (420) — Burn: check if the entering ghost has burn on it
  // Mike (445) — Torrent: while Mike is on the team (sideline), entering ghosts are immune to Burn
  let burnEntryFired = false;
  // Debug: log burn state on every entry for tracking burn-not-firing issues
  if (DEBUG) console.log(`[BURN DEBUG] ${f.name} (id:${f.id}) entering for ${entryTeamName}, activeIdx=${team.activeIdx}, B.burn[${entryTeamName}]=`, JSON.stringify(B.burn?.[entryTeamName] || {}));
  if (B.burn && B.burn[entryTeamName]) {
    const activeIdx = team.activeIdx;
    const burnCount = B.burn[entryTeamName][activeIdx] || 0;
    // Mike (445) — Torrent: if Mike is on the sideline of this team, burn is consumed but deals 0
    const mikeProtects = hasSideline(team, 445);
    if (burnCount > 0 && !f.ko && mikeProtects) {
      // Mike's Torrent: sideline immune to Burn — consume burn, deal 0
      delete B.burn[entryTeamName][activeIdx];
      if (B.burnSource && B.burnSource[entryTeamName]) delete B.burnSource[entryTeamName][activeIdx];
      burnEntryFired = true;
      showAbilityCallout('TORRENT!', 'var(--rare)', `Mike — Torrent! Sideline immune to Burn! ${f.name} takes no damage.`, entryTeamName);
      log(`<span class="log-ability">Mike</span> — Torrent! <span class="log-heal">Sideline immune to Burn!</span> ${f.name} takes no damage.`);
    } else if (burnCount > 0 && !f.ko && f.id !== 416) {
      // Welder (450) active OR Welder's Torch permanent: burns deal +1 extra damage
      const oppTeamName = entryTeamName === 'red' ? 'blue' : 'red';
      const welderBurnBonus = (active(B[oppTeamName]).id === 450 && !active(B[oppTeamName]).ko) || (B.welderTorch && B.welderTorch[oppTeamName]) ? burnCount : 0;
      const totalBurnDmg = burnCount + welderBurnBonus;
      const burnPre = f.hp;
      f.hp = Math.max(0, f.hp - totalBurnDmg);
      // Credit the Spiritkin who placed the most burn on this ghost
      if (f.hp <= 0) {
        f.ko = true;
        let topBurner = -2;
        const sources = B.burnSource && B.burnSource[entryTeamName] && B.burnSource[entryTeamName][activeIdx];
        if (sources) {
          let maxCount = 0;
          for (const [sid, cnt] of Object.entries(sources)) {
            if (cnt > maxCount) { maxCount = cnt; topBurner = parseInt(sid); }
          }
        }
        f.killedBy = topBurner;
      }
      delete B.burn[entryTeamName][activeIdx];
      if (B.burnSource && B.burnSource[entryTeamName]) delete B.burnSource[entryTeamName][activeIdx];
      burnEntryFired = true;
      const welderBurnLabel = welderBurnBonus > 0 ? ` (Welder's Torch: +${welderBurnBonus}!)` : '';
      showAbilityCallout('BURN!', 'var(--accent)', `${f.name} takes ${totalBurnDmg} Burn damage on entry!${welderBurnLabel} (${burnPre} → ${f.hp} HP)${f.ko ? ' KO!' : ''}`, entryTeamName);
      log(`<span class="log-dmg">${f.name}</span> — Burn! <span class="log-dmg">${totalBurnDmg} damage on entry!</span>${welderBurnLabel} (${burnPre} → ${f.hp} HP)${f.ko ? ' <span class="log-ko">KO!</span>' : ''}`);
    } else if (burnCount > 0 && f.id === 416) {
      // Rook (416) — Immune to Burn: consume burn but take no damage
      delete B.burn[entryTeamName][activeIdx];
      if (B.burnSource && B.burnSource[entryTeamName]) delete B.burnSource[entryTeamName][activeIdx];
      burnEntryFired = true;
      showAbilityCallout('BURN IMMUNE!', 'var(--rare)', `${f.name} — Immune to Burn! No damage taken.`, entryTeamName);
      log(`<span class="log-ability">${f.name}</span> — <span class="log-heal">Immune to Burn!</span> No damage taken.`);
    }
  }

  // Collect all entry callouts (entry ability + any Knight reactions) into a sequential array,
  // then fire them with 1500ms spacing. This prevents HEAVY AIR! / RETRIBUTION! from
  // instantly stomping the entry callout (same sequential-stomp pattern fixed in v90–v95
  // for Selene, Timber modal, Timber forced-auto, and Harrison Ascend).
  const entryCallouts = [];

  // Helper: collect Knight reactions into entryCallouts via temporary queue mode
  const collectKnightReactions = () => {
    const savedQ = abilityQueue;
    abilityQueue = [];
    abilityQueueMode = true;
    checkKnightEffects(entryTeamName, f.name);
    abilityQueue.forEach(item => entryCallouts.push([item.name, item.color, item.desc, item.team]));
    abilityQueue = savedQ;
    abilityQueueMode = false;
  };

  // Bouril (201) — Slumber: first roll is auto 1-2-3
  if (f.id === 201) {
    f.hankFirstRoll = true;
    entryCallouts.push(['SLUMBER!', 'var(--uncommon)', `${f.name} — first roll locked to 1-2-3!`, entryTeamName]);
    log(`<span class="log-ability">${f.name}</span> enters lazily — first roll will be 1-2-3.`);
    collectKnightReactions();
  }

  // Zain (206) — Ice Blade: opt-in pre-roll forge button (see useZainForge), no entry effect

  // Nerina (306) — Leviathan: deal 3 damage to enemy active
  if (f.id === 306) {
    const ef = active(enemy);
    if (!ef.ko) {
      ef.hp = Math.max(0, ef.hp - 3);
      if (ef.hp <= 0) { ef.ko = true; ef.killedBy = (f.originalId || f.id); }
      const enemyName = enemy === B.red ? 'red' : 'blue';
      entryCallouts.push(['LEVIATHAN!', 'var(--legendary)', `${f.name} — 3 entry damage to ${ef.name}!`, entryTeamName]);
      log(`<span class="log-ability">${f.name}</span> — Leviathan! <span class="log-dmg">3 entry damage to ${ef.name}!</span> ${ef.ko?'<span class="log-ko">KO!</span>':ef.hp+' HP left'}`);
      playDamageSfx(3);
      hitDamage(enemyName);
      collectKnightReactions();
    }
  }

  // Maximo (302) — Nap: first roll is 1 die
  if (f.id === 302) {
    f.maximoFirstRoll = true;
    entryCallouts.push(['NAP!', 'var(--common)', `${f.name} — first roll is 1 die only!`, entryTeamName]);
    log(`<span class="log-ability">${f.name}</span> is napping... first roll will be only 1 die.`);
    collectKnightReactions();
  }

  // Redd (98) — Notorious: first roll after entry gets +2 extra dice
  if (f.id === 98) {
    f.reddFirstRoll = true;
    entryCallouts.push(['NOTORIOUS!', 'var(--ghost-rare)', `${f.name} — +2 dice for this roll!`, entryTeamName]);
    log(`<span class="log-ability">${f.name}</span> — Notorious! Enters with +2 bonus dice for the first roll!`);
    collectKnightReactions();
  }

  // Jenkins (94) — Greeting: on entry, roll 4 dice and deal damage by roll TYPE (not sum).
  // Deferred to interactive modal — dice are pre-computed here, damage applied after player rolls.
  if (f.id === 94) {
    const ef = active(enemy);
    if (!ef.ko) {
      const jenkinsDice = rollDice(4);
      const jenkinsRoll = classify(jenkinsDice);
      const jenkinsDmg = jenkinsRoll.damage;
      const enemyTeamName = enemy === B.red ? 'red' : 'blue';
      B.jenkinsPending = {
        team: entryTeamName,
        enemyTeam: enemyTeamName,
        dice: jenkinsDice,
        roll: jenkinsRoll,
        damage: jenkinsDmg,
        enemyName: ef.name,
        jenkinsName: f.name
      };
      // No callout here — the modal handles the reveal
      collectKnightReactions();
    }
  }

  // Timber (210) — Howl: no entry callout; the pre-roll Howl modal/callout handles it every round

  // Timpleton (312) — Big Target: v640 rework — moved from Entry strike to Win-roll damage multiplier.
  // New logic lives in _resolveRoundImpl near Red Hunter (345) (search: "Timpleton (312) — Big Target").

  // Grawr (34) — Menace: on entry, deal 1 damage to the enemy active ghost
  if (f.id === 34) {
    const ef = active(enemy);
    if (!ef.ko) {
      ef.hp = Math.max(0, ef.hp - 1);
      if (ef.hp <= 0) { ef.ko = true; ef.killedBy = (f.originalId || f.id); }
      const enemyName = enemy === B.red ? 'red' : 'blue';
      entryCallouts.push(['MENACE!', 'var(--uncommon)', `${f.name} — 1 entry damage to ${ef.name}!`, entryTeamName]);
      log(`<span class="log-ability">${f.name}</span> — Menace! <span class="log-dmg">1 entry damage to ${ef.name}!</span> ${ef.ko ? '<span class="log-ko">KO!</span>' : ef.hp + ' HP left'}`);
      playDamageSfx(1);
      hitDamage(enemyName);
      collectKnightReactions();
    }
  }

  // Hermit (47) — Solitude: on entry, gain +2 HP per ghost defeated on both teams
  if (f.id === 47) {
    const koCount = [...B.red.ghosts, ...B.blue.ghosts].filter(g => g.ko && !g.isPadded).length;
    if (koCount > 0) {
      const gain = koCount * 2;
      const before = f.hp;
      f.hp += gain; // allow overclock — late-game scaling tank
      entryCallouts.push(['SOLITUDE!', 'var(--uncommon)', `${f.name} — +${gain} HP from ${koCount} fallen ghost${koCount > 1 ? 's' : ''}! (${before}→${f.hp} HP)`, entryTeamName]);
      log(`<span class="log-ability">${f.name}</span> — Solitude! +${gain} HP from ${koCount} fallen ghosts. (${before}→${f.hp} HP)`);
    } else {
      entryCallouts.push(['SOLITUDE!', 'var(--uncommon)', `${f.name} — No fallen ghosts yet. Waiting...`, entryTeamName]);
      log(`<span class="log-ability">${f.name}</span> — Solitude! No fallen ghosts yet.`);
    }
  }

  // Chad (56) — Sploop!: on entry, gain 2 Ice Shards
  // Sandwiches (33) Dependable: opponent mirrors the Ice Shard gain.
  if (f.id === 56) {
    team.resources.ice += 2;
    entryCallouts.push(['SPLOOP!', 'var(--uncommon)', `${f.name} — +2 Ice Shards! (${team.resources.ice} total)`, entryTeamName]);
    log(`<span class="log-ability">${f.name}</span> — Sploop! Gained <span class="log-ice">2 Ice Shards</span>! (${team.resources.ice} total)`);
    collectKnightReactions();
    if (hasOnTeam(enemy, 33)) {
      enemy.resources.ice += 2;
      entryCallouts.push(['DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Sploop! +2 Ice Shards! (${enemy.resources.ice} total)`, entryTeamName === 'red' ? 'blue' : 'red']);
      log(`<span class="log-ability">Sandwiches</span> — Dependable! Mirrors Sploop: +<span class="log-ice">2 Ice Shards</span>! (${enemy.resources.ice} total)`);
    }
  }

  // Raditz (62) — Hunt: on entry, may force opponent to swap their active ghost (one-time)
  // Prime the Hunt flag so it fires before Raditz's first roll (handled in rollReady).
  if (f.id === 62 && !skipEntryEffects) {
    const teamName = team === B.red ? 'red' : 'blue';
    const enemySideline = enemy.ghosts.filter((g, i) => i !== enemy.activeIdx && !g.ko);
    if (enemySideline.length > 0) {
      if (!B.raditzHuntReady) B.raditzHuntReady = { red: false, blue: false };
      B.raditzHuntReady[teamName] = true;
      entryCallouts.push(['HUNT!', 'var(--rare)', `${f.name} — may force an opponent swap before rolling!`, entryTeamName]);
      log(`<span class="log-ability">${f.name}</span> — Hunt! Primed — choose to force an opponent swap before rolling.`);
    }
  }

  // Dallas (60) — Quick Draw: on entry from sideline, prime die theft for first 2 rolls
  // Only fires when coming OFF the sideline — not when Dallas starts as the active ghost
  if (f.id === 60 && B.battleStarted) {
    f.dallasQuickDraw = 2;
    entryCallouts.push(['QUICK DRAW!', 'var(--uncommon)', `${f.name} — stealing 1 opponent die for the next 2 rolls!`, entryTeamName]);
    log(`<span class="log-ability">${f.name}</span> — Quick Draw! Steals 1 opponent die for the first 2 rolls.`);
    collectKnightReactions();
  }

  // Lars (420) — Light the Way: entry → +1 Surge, +1 Lucky Stone, +1 Burn (as resource — player clicks to place)
  if (f.id === 420) {
    team.resources.surge++;
    team.resources.luckyStone++;
    if (!team.resources.burn) team.resources.burn = 0;
    team.resources.burn++;
    entryCallouts.push(['LIGHT THE WAY!', 'var(--uncommon)', `${f.name} — Entry! +1 Surge, +1 Lucky Stone, +1 Burn!`, entryTeamName]);
    log(`<span class="log-ability">${f.name}</span> — Light the Way! <span class="log-ms">+1 Surge, +1 Lucky Stone, +1 Burn!</span>`);
    collectKnightReactions();
  }

  // Rascals (437) — Stampede: Entry → gain 3 Burn
  if (f.id === 437 && !f.ko) {
    if (!team.resources.burn) team.resources.burn = 0;
    team.resources.burn += 3;
    entryCallouts.push(['STAMPEDE!', 'var(--common)', `${f.name} — Entry! +3 Burn!`, entryTeamName]);
    log(`<span class="log-ability">${f.name}</span> — Stampede! Entry → <span class="log-dmg">+3 Burn!</span>`);
    collectKnightReactions();
  }

  // Nicholas (51) — Sneak Attack: while on the sideline, deal 2 damage to the entering ghost
  // Does NOT fire at initial battle setup — only fires on mid-battle swaps (KO, Pressure, Gus, etc.)
  // B.battleStarted is set to true after the initial entry sequence completes.
  if (hasSideline(enemy, 51) && !f.ko && B.battleStarted) {
    const nicholasGhost = getSidelineGhost(enemy, 51);
    f.hp = Math.max(0, f.hp - 2);
    if (f.hp <= 0) { f.ko = true; f.killedBy = 51; }
    const enteringTeamName = team === B.red ? 'red' : 'blue';
    const nicholasTeamName = enteringTeamName === 'red' ? 'blue' : 'red';
    entryCallouts.push(['SNEAK ATTACK!', 'var(--uncommon)',
      `${nicholasGhost.name} — 2 damage to ${f.name} on entry!`, nicholasTeamName]);
    log(`<span class="log-ability">${nicholasGhost.name}</span> — Sneak Attack! <span class="log-dmg">2 damage to ${f.name} on entry!</span> ${f.ko ? '<span class="log-ko">KO!</span>' : f.hp + ' HP left'}`);
    playDamageSfx(2);
    hitDamage(enteringTeamName);
    // Knight reactions: Nicholas's ability belongs to the enemy team — the entering team may counter.
    // Use nicholasTeamName (not entryTeamName) so Knight Terror/Light on the ENTERING side
    // correctly punish/reward in response to the enemy ability (not double-punish the entering ghost).
    const savedQN = abilityQueue;
    abilityQueue = [];
    abilityQueueMode = true;
    checkKnightEffects(nicholasTeamName, nicholasGhost.name);
    abilityQueue.forEach(item => entryCallouts.push([item.name, item.color, item.desc, item.team]));
    abilityQueue = savedQN;
    abilityQueueMode = false;
  }

  // Fire all entry callouts sequentially — each 1500ms after the previous
  // c[3] = team string for card-glow spotlight; undefined = narrator-only fallback
  entryCallouts.forEach((c, i) => {
    setTimeout(() => showAbilityCallout(c[0], c[1], c[2], c[3]), i * spd(1500));
  });
  return entryCallouts.length;
}

// Helper: check if dice have even doubles (2s, 4s, or 6s)
function hasEvenDoubles(dice) {
  const c = {};
  dice.forEach(d => c[d] = (c[d]||0)+1);
  return (c[2] >= 2) || (c[4] >= 2) || (c[6] >= 2);
}

// Boris (343) — Fortify: when surge is spent, Boris gains 2 HP (overclocks past maxHp)
function triggerBorisHook(team) {
  team.ghosts.forEach(g => {
    if (g.id === 343 && !g.ko) {
      const before = g.hp;
      g.hp += 2; // overclocks — no cap
      log(`<span class="log-heal">${g.name}</span> — Fortify! Surge spent → +2 HP (${before}→${g.hp}/${g.maxHp}${g.hp > g.maxHp ? ' · overclocked!' : ''}).`);
    }
  });
}

// Cameron (25) — Unstoppable Force: opponent uses a special → Cameron's team gains +1 die
// Called with the team that USED the special — Cameron must be on the OPPOSING team.
// immediate=true: post-roll context (Lucky Stone, Moonstone) — roll an extra die and add it NOW.
// immediate=false (default): pre-roll context — store for Phase 2 dice computation next roll.
function triggerCameronSpecialWatch(usingTeam, immediate) {
  if (!B) return;
  const oppTeamName = usingTeam === 'red' ? 'blue' : 'red';
  const oppTeam = B[oppTeamName];
  if (!oppTeam) return;
  const cameronAlive = oppTeam.ghosts.some(g => g.id === 25 && !g.ko);
  if (!cameronAlive) return;
  const camGhost = oppTeam.ghosts.find(g => g.id === 25 && !g.ko);
  const loc = oppTeam.ghosts[oppTeam.activeIdx]?.id === 25 ? 'active' : 'sideline';

  if (immediate && B.pendingResolve) {
    // Post-roll: immediately roll 1 extra die and splice it into Cameron's team dice
    const extraDie = Math.floor(Math.random() * 6) + 1;
    const diceKey = oppTeamName === 'red' ? 'redDice' : 'blueDice';
    const prKey = oppTeamName === 'red' ? 'redDice' : 'blueDice';
    const dice = B.pendingResolve[prKey] || B[diceKey] || [];
    dice.push(extraDie);
    dice.sort((a, b) => a - b);
    B.pendingResolve[prKey] = dice;
    B[diceKey] = dice;
    renderDice(B.redDice, B.blueDice);
    log(`<span class="log-ability">${camGhost.name}</span> (${loc}) — Unstoppable Force! Opponent used a special → <span class="log-ms">+1 die rolled immediately! [${extraDie}]</span>`);
    showAbilityCallout('UNSTOPPABLE FORCE!', 'var(--common)', `${camGhost.name} — +1 die! Rolled a ${extraDie}!`, oppTeamName);
  } else {
    // Pre-roll: store for next roll's Phase 2 dice computation
    if (!B.cameronBonusDice) B.cameronBonusDice = { red: 0, blue: 0 };
    B.cameronBonusDice[oppTeamName]++;
    log(`<span class="log-ability">${camGhost.name}</span> (${loc}) — Unstoppable Force! Opponent used a special → <span class="log-ms">+1 die next roll!</span> (${B.cameronBonusDice[oppTeamName]} stored)`);
  }
}

// ========================================
// RESOURCE SPENDING
// ========================================
// v729: broadcast resource/committed changes live so opponent sees pre-roll decisions
function pvpBroadcastCommitted(team) {
  if (!LIVE_PVP || !PVP_GAME_REF || !B || team !== PVP_SIDE) return;
  const t = B[team];
  const f = active(t);
  PVP_GAME_REF.child('committedUpdate').set({
    side: team,
    committed: { ...B.committed[team] },
    resources: { ...t.resources },
    activeHp: f ? f.hp : 0,
    // v735: include burn state so opponent's engine knows about burn placement
    burn: B.burn ? { red: { ...B.burn.red }, blue: { ...B.burn.blue } } : null,
    burnSource: B.burnSource ? JSON.parse(JSON.stringify(B.burnSource)) : null,
    ts: Date.now()
  });
}

function cycleCommit(team, type) {
  if (!isPreRollActive(team)) return;
  const t = B[team];
  const c = B.committed[team];
  const f = active(t);
  const total = t.resources[type] + c[type];
  if (total <= 0) return;
  // Sylvia (313) — Free Ice Shards: commit without consuming, but cap at actual ice count
  if (type === 'ice' && f && f.id === 313) {
    const sylviaIceMax = t.resources.ice; // actual ice held (never decremented for Sylvia)
    if (c.ice < sylviaIceMax) {
      c.ice++;
      // Don't decrement t.resources.ice — ice is free for Sylvia
    } else {
      c.ice = 0; // cycle back to zero (uncommit)
    }
  } else {
    c[type]++;
    t.resources[type]--;
    if (c[type] > total) {
      t.resources[type] = total;
      c[type] = 0;
    }
  }
  // Narrate what just happened
  const teamLabel = team.charAt(0).toUpperCase() + team.slice(1);
  if (c[type] === 0) {
    narrate(`<b class="${team}-text">${teamLabel}</b> cleared ${type === 'ice' ? 'Ice Shards' : type === 'fire' ? 'Sacred Fires' : 'Surge'}.`);
  } else if (type === 'ice') {
    narrate(`<b class="${team}-text">${teamLabel}</b> committed <b>${c[type]} Ice Shard${c[type]>1?'s':''}</b> — <b class="gold">+${c[type]} damage</b> if you win!`);
  } else if (type === 'fire') {
    narrate(`<b class="${team}-text">${teamLabel}</b> committed <b>${c[type]} Sacred Fire${c[type]>1?'s':''}</b> — <b class="gold">+${c[type]*3} damage</b> if you win!`);
  } else if (type === 'surge') {
    narrate(`<b class="${team}-text">${teamLabel}</b> committed <b>${c[type]} Surge</b> — <b class="gold">+${c[type]} ${c[type]>1?'dice':'die'}</b> this roll!`);
  }
  playSfx('sfxSpecial', 0.3);
  // Carpenter (449) — transforms into Welder when a Surge is committed
  if (type === 'surge' && c[type] > 0 && f && f.id === 449 && !f.ko) {
    carpenterTransform(team);
  }
  // Cameron (25) — Unstoppable Force: opponent committed a special → Cameron gains +1 die
  if (c[type] > 0) triggerCameronSpecialWatch(team);
  renderBattle();
  pvpBroadcastCommitted(team);
}

function refundCommitted() {
  ['red', 'blue'].forEach(team => {
    const t = B[team];
    const c = B.committed[team];
    const f = active(t);
    // Sylvia (313) — ice was never consumed, so don't refund it
    if (!(f && f.id === 313)) {
      t.resources.ice += c.ice;
    }
    t.resources.fire += c.fire;
    t.resources.surge += c.surge;
    t.resources.healingSeed += c.auntSusan + c.auntSusanHeal + c.harrison;
    B.committed[team] = { ice:0, fire:0, surge:0, auntSusan:0, auntSusanHeal:0, harrison:0, zainBlade:0 };
  });
}

function spendHealingSeed(team) {
  if (!isPreRollActive(team)) return;
  const t = B[team];
  const f = active(t);
  if (t.resources.healingSeed <= 0 || f.hp >= f.maxHp) return;
  // Dark Fang (202) — Pressure: enemy ghost cannot heal
  if (deathHowlBlocksHealing(team)) {
    t.resources.healingSeed--;
    log(`<span class="log-ability">Dark Fang</span> — Pressure! ${f.name}'s Healing Seed consumed but healing blocked!`);
    renderBattle();
    return;
  }
  t.resources.healingSeed--;
  f.hp = Math.min(f.maxHp, f.hp + 1);
  playSfx('sfxSpecial', 0.4);
  log(`<span class="log-heal">${f.name}</span> used a Healing Seed! Healed to ${f.hp} HP.`);

  // Young Cap (429) — Energize: when active uses a Healing Seed, +1 die this roll + 1 Ice Shard + 1 Surge
  if (f.id === 429 && !f.ko) {
    if (!f.youngCapDieBonus) f.youngCapDieBonus = 0;
    f.youngCapDieBonus++;
    t.resources.ice++;
    t.resources.surge++;
    showAbilityCallout('ENERGIZE!', 'var(--uncommon)', `${f.name} — Healing Seed used! +1 die, +1 Ice Shard, +1 Surge!`, team);
    log(`<span class="log-ability">${f.name}</span> — Energize! Healing Seed → +1 die this roll, <span class="log-ice">+1 Ice Shard</span>, <span class="log-ms">+1 Surge</span>.`);
  }

  // Boopies (419) — Boopie Magic: sideline — when active spends Healing Seed, gain 1 Lucky Stone
  if (hasSideline(t, 419)) {
    t.resources.luckyStone++;
    const boopiesG = getSidelineGhost(t, 419);
    const boopiesName = boopiesG ? boopiesG.name : 'Boopies';
    showAbilityCallout('BOOPIE MAGIC!', 'var(--common)', `${boopiesName} (sideline) — Healing Seed spent! +1 Lucky Stone!`, team);
    log(`<span class="log-ability">${boopiesName}</span> — Boopie Magic! Healing Seed spent → <span class="log-ms">+1 Lucky Stone!</span>`);
  }

  // Cameron (25) — Unstoppable Force: opponent used a special
  triggerCameronSpecialWatch(team);

  renderBattle();
  pvpBroadcastCommitted(team);
}

function sacrificeHappyCrystal(team) {
  if (!isPreRollActive(team)) return;
  const t = B[team];
  const f = active(t);
  if (f.id !== 208 || f.ko) return;
  f.hp = 0; f.ko = true; f.killedBy = -1; // self-sacrifice
  t.resources.moonstone++;
  showAbilityCallout('SPARK STRIKE!', 'var(--moonstone)', `${f.name} sacrificed for 1 Moonstone!`, team);
  log(`<span class="log-ability">${f.name}</span> sacrifices itself! Gained <span class="log-ms">1 Moonstone</span>!`);
  if (!handleKOs()) renderBattle();
}

function toggleAuntSusan(team) {
  if (!isPreRollActive(team)) return;
  const tName = team;
  const t = B[team];
  const f = active(t);
  if (f.id !== 309 || f.ko) return;
  // Each click adds another seed to damage commit (click again to remove one)
  if (t.resources.healingSeed > 0) {
    B.committed[tName].auntSusan++;
    t.resources.healingSeed--;
  }
  renderBattle();
  pvpBroadcastCommitted(team);
}

function uncommitAuntSusan(team) {
  if (!isPreRollActive(team)) return;
  const tName = team;
  const t = B[team];
  if (B.committed[tName].auntSusan > 0) {
    B.committed[tName].auntSusan--;
    t.resources.healingSeed++;
  }
  renderBattle();
  pvpBroadcastCommitted(team);
}

function toggleAuntSusanHeal(team) {
  if (!isPreRollActive(team)) return;
  const tName = team;
  const t = B[team];
  const f = active(t);
  if (f.id !== 309 || f.ko) return;
  if (t.resources.healingSeed > 0) {
    B.committed[tName].auntSusanHeal++;
    t.resources.healingSeed--;
  }
  renderBattle();
}

function uncommitAuntSusanHeal(team) {
  if (!isPreRollActive(team)) return;
  const tName = team;
  const t = B[team];
  if (B.committed[tName].auntSusanHeal > 0) {
    B.committed[tName].auntSusanHeal--;
    t.resources.healingSeed++;
  }
  renderBattle();
}

// ============================================================
// HARRISON (315) — opt-in: spend 1 Healing Seed for +1 die
// ============================================================
function toggleHarrison(team) {
  if (!isPreRollActive(team)) return;
  const t = B[team];
  const f = active(t);
  if (f.id !== 315 || f.ko) return;
  // Click = add another seed, right-click to remove (handled separately)
  if (t.resources.healingSeed > 0) {
    B.committed[team].harrison++;
    t.resources.healingSeed--;
  }
  renderBattle();
}

function useFinnFlameBlade(team) {
  if (!isPreRollActive(team)) return;
  const t = B[team];
  // Finn must be on sideline or active (alive)
  const finnOnTeam = t.ghosts.some(g => g.id === 204 && !g.ko);
  if (!finnOnTeam) return;
  if (B.flameBlade && B.flameBlade[team]) return; // already forged
  if ((t.resources.healingSeed || 0) < 1 || (t.resources.fire || 0) < 1) return;
  t.resources.healingSeed -= 1;
  t.resources.fire -= 1;
  if (!B.flameBlade) B.flameBlade = { red: false, blue: false };
  B.flameBlade[team] = true;
  creditGhost(team, 204, 'ms', 1); // Finn earns MVP credit for forging
  log(`<span class="log-ability">Finn</span> — Forge! 1 Healing Seed + 1 Sacred Fire → <span class="log-ms">Flame Blade!</span> (permanent item)`);
  showAbilityCallout('FLAME BLADE!', 'var(--rare)', 'Finn forges the Flame Blade!', team);
  playSfx('sfxSpecial', 0.5);
  renderBattle();
}

// Carpenter (449) → Welder (450) transform: called when Surge is committed while Carpenter is active
function carpenterTransform(team) {
  const t = B[team];
  const g = active(t);
  if (g.id !== 449 || g.ko) return;
  // Preserve original identity
  g.originalId = g.originalId || g.id;
  g.originalName = g.originalName || g.name;
  g.originalArt = g.originalArt || g.art;
  g.originalMaxHp = g.originalMaxHp || g.maxHp;
  g.originalAbility = g.originalAbility || g.ability;
  g.originalAbilityDesc = g.originalAbilityDesc || g.abilityDesc;
  g.originalRarity = g.originalRarity || g.rarity;
  // Transform into Welder
  const welderData = ghostData(450);
  g.id = 450; g.name = welderData.name; g.maxHp = welderData.maxHp;
  g.hp = welderData.maxHp; // Full heal on evolution
  g.ability = welderData.ability; g.abilityDesc = welderData.abilityDesc;
  g.art = welderData.art; g.rarity = welderData.rarity;
  // Leave behind Carpenter's Hammer
  if (!B.carpenterHammer) B.carpenterHammer = { red: false, blue: false };
  B.carpenterHammer[team] = true;
  queueAbility('TRANSFORMATION!', 'var(--rare)', `Carpenter transforms into the Welder! Carpenter's Hammer forged! (+2 singles, permanent)`, null, team);
  log(`<span class="log-ability">Carpenter</span> — Evolution! <span class="log-ms">WELDER rises!</span> Carpenter's Hammer left behind!`);
  checkRipagooTransform(team);
  renderBattle();
}

// Welder (450) → Foreman (451) transform: called when any die shows a 4
function welderTransform(team) {
  const t = B[team];
  const g = active(t);
  if (g.id !== 450 || g.ko) return;
  // Preserve original identity (may already have original from Carpenter stage)
  g.originalId = g.originalId || g.id;
  g.originalName = g.originalName || g.name;
  g.originalArt = g.originalArt || g.art;
  g.originalMaxHp = g.originalMaxHp || g.maxHp;
  g.originalAbility = g.originalAbility || g.ability;
  g.originalAbilityDesc = g.originalAbilityDesc || g.abilityDesc;
  g.originalRarity = g.originalRarity || g.rarity;
  // Transform into Foreman
  const foremanData = ghostData(451);
  g.id = 451; g.name = foremanData.name; g.maxHp = foremanData.maxHp;
  g.hp = foremanData.maxHp; // Full heal on evolution
  g.ability = foremanData.ability; g.abilityDesc = foremanData.abilityDesc;
  g.art = foremanData.art; g.rarity = foremanData.rarity;
  // Leave behind Welder's Torch
  if (!B.welderTorch) B.welderTorch = { red: false, blue: false };
  B.welderTorch[team] = true;
  queueAbility('TRANSFORMATION!', 'var(--rare)', `Welder transforms into the Foreman! Welder's Torch forged! (burns +1, wins give Burn, permanent)`, null, team);
  log(`<span class="log-ability">Welder</span> — Evolution! <span class="log-ms">FOREMAN rises!</span> Welder's Torch left behind!`);
  checkRipagooTransform(team);
  renderBattle();
}

// Ripagoo (452) — Chemical Y: sideline — if a card in play transforms, gain 2 Burn
function checkRipagooTransform(team) {
  const t = B[team];
  if (hasSideline(t, 452)) {
    if (!t.resources.burn) t.resources.burn = 0;
    t.resources.burn += 2;
    const rg = getSidelineGhost(t, 452);
    const rName = rg ? rg.name : 'Ripagoo';
    popSidelineCard(t, 452);
    showAbilityCallout('CHEMICAL Y!', 'var(--uncommon)', `${rName} (sideline) — Transformation detected! +2 Burn!`, team);
    log(`<span class="log-ability">${rName}</span> — Chemical Y! Transformation → <span class="log-burn">+2 Burn!</span>`);
    renderBattle();
  }
}

function toggleFlameBlade(team) {
  if (!isPreRollActive(team)) return;
  if (!B.flameBlade || !B.flameBlade[team]) return;
  if (!B.flameBladeSwing) B.flameBladeSwing = { red: false, blue: false };
  B.flameBladeSwing[team] = !B.flameBladeSwing[team];
  renderBattle();
}

function toggleIceBlade(team) {
  if (!isPreRollActive(team)) return;
  if (!B.iceBladeForgedPermanent || !B.iceBladeForgedPermanent[team]) return;
  if (!B.iceBladeSwing) B.iceBladeSwing = { red: false, blue: false };
  B.iceBladeSwing[team] = !B.iceBladeSwing[team];
  // Keep backward compat with committed.zainBlade toggle
  B.committed[team].zainBlade = B.iceBladeSwing[team] ? 1 : 0;
  renderBattle();
}

function useZainForge(team) {
  if (!isPreRollActive(team)) return;
  const t = B[team];
  // Zain can forge from sideline or active — find him wherever he is
  const zain = t.ghosts.find(g => g.id === 206 && !g.ko);
  if (!zain) return;
  if (zain.iceBladeForged) return; // already forged — permanent, can't re-forge
  if (B.iceBladeForgedPermanent[team]) return;
  if (t.resources.ice < 1 || t.resources.moonstone < 1) return;
  t.resources.ice -= 1;
  t.resources.moonstone -= 1;
  zain.iceBladeForged = true;
  B.iceBladeForgedPermanent[team] = true; // permanent +2 damage for the rest of the game
  log(`<span class="log-ability">${zain.name}</span> — Ice Blade forged! Spent <span class="log-ice">1 Ice Shard</span> + <span class="log-ms">1 Moonstone</span>. Permanent +2 damage on ALL winning rolls for the rest of the game!`);
  showAbilityCallout('ICE BLADE!', 'var(--ghost-rare)', `${zain.name} forges the Ice Blade — permanent +2 damage on ALL wins!`, team);
  playSfx('sfxSpecial', 0.5);
  renderBattle();
}

// Per-round commit toggle: Zain (forged) chooses whether to swing the blade this round
// Kept for backward compat — delegates to new toggleIceBlade
function toggleZainBlade(team) {
  toggleIceBlade(team);
}

function uncommitHarrison(team) {
  if (!isPreRollActive(team)) return;
  const t = B[team];
  if (B.committed[team].harrison > 0) {
    B.committed[team].harrison--;
    t.resources.healingSeed++;
  }
  renderBattle();
}

// ============================================================
// KNIGHT EFFECTS — Heavy Air (401) & Retribution (402)
// ============================================================
function checkKnightEffects(abilityTeamName, abilityGhostName, sidelineGhost, deferredHeavyAir) {
  // abilityTeamName = the team whose ability is triggering
  // sidelineGhost = optional: the sideline ghost using the ability (if not the active fighter)
  // deferredHeavyAir = optional array: if provided, Heavy Air damage is stored here instead of applied immediately
  // The OPPONENT of that team might have Heavy Air or Retribution
  const oppTeamName = abilityTeamName === 'red' ? 'blue' : 'red';
  const oppTeam = B[oppTeamName];
  const oppActive = active(oppTeam);

  // Heavy Air (401) — after opponent ability resolves, enemy active ghost loses 2 HP
  if (oppActive.id === 401 && !oppActive.ko) {
    const abilityTeam = B[abilityTeamName];
    const target = active(abilityTeam);
    if (!target.ko) {
      if (deferredHeavyAir) {
        // Deferred mode: store the hit, apply only if Knight Terror survives the round
        deferredHeavyAir.push({ target, targetName: target.name, oppTeamName });
      } else {
        target.hp = Math.max(0, target.hp - 2);
        if (target.hp <= 0) { target.ko = true; target.killedBy = 401; }
        const targetName = target.name;
        if (abilityQueueMode) {
          queueAbility('HEAVY AIR!', 'var(--rare)', `Knight Terror — ${targetName} loses 2 HP!`, null, oppTeamName);
        } else {
          showAbilityCallout('HEAVY AIR!', 'var(--rare)', `Knight Terror — ${targetName} loses 2 HP!`, oppTeamName);
        }
        log(`<span class="log-ability">Knight Terror</span> — Heavy Air! <span class="log-dmg">${targetName} loses 2 HP!</span> ${target.ko ? '<span class="log-ko">KO!</span>' : target.hp + ' HP left'}`);
      }
    }
  }

  // Retribution (402) — gain +1 die next roll when opponent uses ability
  if (oppActive.id === 402 && !oppActive.ko) {
    if (!B.retributionDice) B.retributionDice = { red: 0, blue: 0 };
    B.retributionDice[oppTeamName]++;
    if (abilityQueueMode) {
      queueAbility('RETRIBUTION!', 'var(--rare)', `Knight Light — opponent used ability! +1 die next roll!`, null, oppTeamName);
    } else {
      showAbilityCallout('RETRIBUTION!', 'var(--rare)', `Knight Light — opponent used ability! +1 die next roll!`, oppTeamName);
    }
    log(`<span class="log-ability">Knight Light</span> — Retribution! <span class="log-ms">+1 die next roll!</span> (${B.retributionDice[oppTeamName]} stored)`);
  }
}

// ============================================================
// BLACKOUT — Smudge (403): name a number
// ============================================================
function setBlackout(team, num) {
  if (!isPreRollActive(team)) return; // Blackout is pre-roll only
  if (!B.blackoutNum) B.blackoutNum = {};
  if (B.blackoutNum[team] === num) {
    delete B.blackoutNum[team]; // toggle off
  } else {
    B.blackoutNum[team] = num;
  }
  renderBattle();
}

// ============================================================
// TYSON HOP — manual pre-roll swap (Tyson 365)
// ============================================================
function useTysonHop(team) {
  if (!isPreRollActive(team)) return;
  const t = B[team];
  const f = active(t);
  if (f.id !== 365 || f.ko) return;

  const enemy = opp(t);
  if (dylanNegates(enemy)) {
    showAbilityCallout('BLOCKED!', 'var(--text2)', `Dylan's Scarecrow shuts down Tyson's Hop!`, team === B.red ? 'blue' : 'red');
    log(`<span class="log-ability">Tyson</span> — Hop blocked by <span class="log-ability">Dylan's Scarecrow</span>!`);
    return;
  }
  const aliveSideline = t.ghosts.filter((g,i) => i !== t.activeIdx && !g.ko);
  if (aliveSideline.length === 0) return;

  log(`<span class="log-ability">${f.name}</span> — Hop! Swapping out, no entry effects for incoming ghost.`);
  // Queue HOP! + any Knight reactions sequentially before opening the swap modal
  abilityQueueMode = true;
  queueAbility('HOP!', 'var(--common)', `${f.name} hops to the bench — no entry triggers!`, null, team);
  checkKnightEffects(team, f.name);
  abilityQueueMode = false;
  // Open the standard swap modal only after all callouts finish playing
  drainAbilityQueue(() => openSwap(team));
}

// ============================================================
// PRESSURE — manual pre-roll ability (Dark Fang 202)
// ============================================================
function usePressure(team) {
  if (!isPreRollActive(team)) return;
  const t = B[team];
  const f = active(t);
  const enemy = opp(t);
  const enemyTeamName = team === 'red' ? 'blue' : 'red';
  if (f.id !== 202 || f.ko || dylanNegates(enemy)) return;

  // Barnaby (326) — Stubborn: immune to forced swaps by opponent effects
  const _barnabyPressure = active(enemy);
  if (_barnabyPressure && _barnabyPressure.id === 326 && !_barnabyPressure.ko) {
    log(`<span class="log-ability">Barnaby</span> — Stubborn! Dark Fang's Pressure is blocked — ${_barnabyPressure.name} cannot be forced out.`);
    narrate(`<b class="${team}-text">Dark Fang</b> — Pressure blocked! <b>${_barnabyPressure.name}</b> refuses to leave!`);
    return;
  }

  const aliveSideline = enemy.ghosts.filter((g,i) => i !== enemy.activeIdx && !g.ko);
  if (aliveSideline.length === 0) return;

  // If only one option, auto-pick
  if (aliveSideline.length === 1) {
    doPressureSwap(team, enemy.ghosts.indexOf(aliveSideline[0]));
    return;
  }

  // Open pressure picker for the OPPONENT to choose who comes in
  const enemyLabel = enemyTeamName.charAt(0).toUpperCase() + enemyTeamName.slice(1);
  // Update the "who picks" banner with the correct team color
  const whoBanner = document.getElementById('pressureWho');
  whoBanner.className = `pm-who-banner ${enemyTeamName}`;
  whoBanner.textContent = `🎯 ${enemyLabel.toUpperCase()} PICKS`;
  document.getElementById('pressureTitle').textContent = `Pressure! — Dark Fang forces a swap`;
  document.getElementById('pressureSub').textContent = `${enemyLabel} team: choose which ghost enters the fight.`;
  document.getElementById('pressureOptions').innerHTML = aliveSideline.map(g => {
    const realIdx = enemy.ghosts.indexOf(g);
    const gd = ghostData(g.id);
    const hpRatio = g.hp / g.maxHp;
    const hpColor = hpRatio > 0.6 ? 'var(--hp-green)' : hpRatio > 0.3 ? 'var(--hp-yellow)' : 'var(--hp-red)';
    return `<div class="pressure-opt" onclick="doPressureSwap('${team}',${realIdx})">
      ${gd.art ? `<img src="${gd.art}" style="width:50px; height:50px; border-radius:6px; object-fit:cover; border:1px solid var(--${gd.rarity});">` : ''}
      <div>
        <div style="font-weight:700;">${g.name}</div>
        <div style="font-size:12px; color:var(--text2);"><span style="color:${hpColor}; font-weight:700;">&hearts; ${g.hp}/${g.maxHp}</span> &middot; <span style="color:var(--moonstone);">${gd.ability}</span></div>
      </div>
    </div>`;
  }).join('');
  // Lock out Roll buttons while the opponent picks — phase resets to 'ready' in doPressureSwap
  B.phase = 'pressure';
  B.pressurePickerTeam = enemyTeamName; // v728: track which team picks (for PvP auto-resolve)
  document.getElementById('pressureOverlay').classList.add('active');
}

function doPressureSwap(attackerTeam, targetIdx) {
  document.getElementById('pressureOverlay').classList.remove('active');
  // Lock roll buttons for the full PRESSURE! + entry callout chain.
  // Previously: immediately restored B.phase='ready' (or left it 'ready' in the auto-pick
  // path), which meant both roll buttons were live during the 1500ms PRESSURE! splash and
  // any subsequent entry callouts (LEVIATHAN!, BIG TARGET!, SLUMBER!, etc.) — players could
  // click Roll mid-callout.  Now we park in 'ko-pause' and only restore 'ready' AFTER the
  // full chain finishes (same pattern used by doKoSwap, Timber, Selene, etc.).
  B.phase = 'ko-pause';
  // Mark Pressure as used for this round — prevents double-use when opponent has 2 sideline ghosts
  if (!B.pressureUsed) B.pressureUsed = { red: false, blue: false };
  B.pressureUsed[attackerTeam] = true;
  const t = B[attackerTeam];
  const f = active(t);
  const enemy = opp(t);
  const oldGhost = active(enemy);
  const oldName = oldGhost.name;
  // Pressure is a forced swap by Dark Fang — NOT Tyson's voluntary Hop.
  // Entry effects always fire for the incoming ghost regardless of who was forced out.
  enemy.activeIdx = targetIdx;
  const newGhost = active(enemy);
  // Returning from sideline = full HP
  newGhost.hp = newGhost.maxHp;
  // Narrate the swap so there's textual context in the narrator div for BOTH the auto-pick path
  // (single sideline ghost — no modal, no prior narration) and the manual-pick path (modal closes
  // silently).  Without this, the player just sees the PRESSURE! splash with zero narrator context.
  const attackerCls = attackerTeam === 'red' ? 'red-text' : 'blue-text';
  narrate(`<b class="${attackerCls}">${f.name}</b> — Pressure! <b>${oldName}</b> forced to the sideline — <b>${newGhost.name}</b> enters at full HP!`);
  showAbilityCallout('PRESSURE!', 'var(--rare)', `${oldName} forced out — ${newGhost.name} enters!`, attackerTeam);
  log(`<span class="log-ability">${f.name}</span> — Pressure! Forced ${oldName} out, ${newGhost.name} enters at full HP!`);
  // Delay entry effects by 1500ms so PRESSURE! fully displays before the first entry callout
  // fires (triggerEntry's first setTimeout is at i=0 → ~0ms, which stomped PRESSURE! instantly).
  setTimeout(() => {
    const entryCalloutCount = triggerEntry(enemy, false);
    afterEntryWithJenkins(entryCalloutCount, () => {
      if (!handleKOs()) { startNextRound(); }
    });
  }, spd(1500));
}

// ============================================================
// SELENE — Heart of the Hills in-game choice modal
// ============================================================
function showSeleneModal() {
  const sp = B.selenePending;
  const f = active(sp.team);
  const tName = sp.tName;
  const teamLabel = tName.charAt(0).toUpperCase() + tName.slice(1);
  const bannerEl = document.getElementById('seleneBanner');
  if (bannerEl) {
    bannerEl.textContent = `⛰️ ${teamLabel.toUpperCase()} PICKS`;
    bannerEl.className = `selene-banner ${tName}`;
  }
  const titleEl = document.getElementById('seleneTitle');
  if (titleEl) titleEl.textContent = `${f.name} — Heart of the Hills!`;
  narrate(`<b class="${tName}-text">${f.name}</b>&nbsp;rolled <b class="gold">DOUBLES!</b>&nbsp;Choose your reward!`);
  document.getElementById('seleneOverlay').classList.add('active');
}

function doSeleneChoice(choice) {
  const sp = B.selenePending;
  if (!sp) return; // guard against double-click
  const cont = sp._continue;
  B.selenePending = null;
  document.getElementById('seleneOverlay').classList.remove('active');
  const f = active(sp.team);
  const _selTeam = sp.team;
  const _selName = f.name;
  const subtitle = choice === 'seed'
    ? `${f.name} — Doubles! Chose 🌱 2 Healing Seeds!`
    : `${f.name} — Doubles! Chose 🍀 3 Lucky Stones!`;
  // Queue mode: HEART OF THE HILLS first, then knight reactions, then drain sequentially.
  // Grant is deferred into onShow so the resource counter updates exactly when the callout
  // fires — same deferred-onShow pattern as Hank Tremor (v307), Natalia/Kaplan (v308).
  abilityQueueMode = true;
  queueAbility('HEART OF THE HILLS!', 'var(--legendary)', subtitle, () => {
    if (choice === 'seed') {
      _selTeam.resources.healingSeed += 2;
      log(`<span class="log-ability">${_selName}</span> — Heart of the Hills! Doubles → chose <span class="log-ms">2 Healing Seeds</span>!`);
    } else {
      _selTeam.resources.luckyStone += 3;
      // Update lsAvailable so the post-roll Lucky Stone window sees these new stones
      if (B.lsAvailable) B.lsAvailable[sp.tName] = (B.lsAvailable[sp.tName] || 0) + 3;
      log(`<span class="log-ability">${_selName}</span> — Heart of the Hills! Doubles → chose <span class="log-ms">3 Lucky Stones</span>!`);
    }
    renderBattle();
  }, sp.tName);
  checkKnightEffects(sp.tName, f.name); // queues HEAVY AIR! or RETRIBUTION! if applicable
  // Sandwiches (33) — Dependable: mirror the chosen resource to opponent if Sandwiches on sideline.
  // Capture totals at queue-build time (before any grant fires) so the preview subtitle is correct.
  if (hasOnTeam(opp(sp.team), 33)) {
    if (choice === 'seed') {
      const _sandSeedOpp = opp(sp.team);
      const _sandSeedTotal = _sandSeedOpp.resources.healingSeed + 2;
      queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Heart of the Hills! +2 Healing Seeds! (${_sandSeedTotal} total)`, () => { _sandSeedOpp.resources.healingSeed += 2; renderBattle(); }, sp.tName === 'red' ? 'blue' : 'red');
    } else {
      const _sandLSOpp = opp(sp.team);
      const _sandLSTotal = _sandLSOpp.resources.luckyStone + 3;
      queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Heart of the Hills! +3 Lucky Stones! (${_sandLSTotal} total)`, () => { _sandLSOpp.resources.luckyStone += 3; renderBattle(); }, sp.tName === 'red' ? 'blue' : 'red');
    }
  }
  abilityQueueMode = false;
  // drainAbilityQueue plays each splash 1300ms apart and calls cont() after all finish.
  drainAbilityQueue(() => { if (cont) cont(); });
}

// Pal Al (431) — Squall: show choice modal
function showWiseAlModal(resumeCallback) {
  const wp = B.wiseAlPending;
  if (!wp) { resumeCallback(); return; }
  wp.resume = resumeCallback;
  document.getElementById('wiseAlSub').textContent = `Deal ${wp.dmg} damage or gain 4 Ice Shards?`;
  document.getElementById('wiseAlDmgBtn').textContent = `⚔️ Deal ${wp.dmg} Damage`;
  document.getElementById('wiseAlOverlay').classList.add('active');
}

function doWiseAlChoice(choice) {
  const wp = B.wiseAlPending;
  if (!wp) return;
  B.wiseAlPending = null;
  document.getElementById('wiseAlOverlay').classList.remove('active');
  if (choice === 'ice') {
    wp.winTeam.resources.ice = (wp.winTeam.resources.ice || 0) + 4;
    checkKnightEffects(wp.winTeamName, wp.wF.name);
    log(`<span class="log-ability">${wp.wF.name}</span> — Squall! <span class="log-ice">+4 Ice Shards</span> instead of dealing damage!`);
    queueAbility('SQUALL!', 'var(--rare)', `${wp.wF.name} — +4 ❄️ Ice Shards instead of dealing damage!`, () => { renderBattle(); }, wp.winTeamName);
  } else {
    // Deal the stashed damage
    wp.lF.hp = Math.max(0, wp.lF.hp - wp.dmg);
    if (wp.lF.hp <= 0) { wp.lF.ko = true; wp.lF.killedBy = (wp.wF.originalId || wp.wF.id); }
    log(`<span class="log-dmg">${wp.wF.name} deals ${wp.dmg} to ${wp.lF.name}!</span> ${wp.lF.ko?'<span class="log-ko">KO!</span>':wp.lF.hp+' HP left'}`);
    renderBattle();
  }
  drainAbilityQueue(() => { if (wp.resume) wp.resume(); });
}

// Sophia (457) — Masquerade: show choice modal
function showSophiaModal(resumeCallback) {
  const sp = B.sophiaPending;
  if (!sp) { resumeCallback(); return; }
  sp.resume = resumeCallback;
  document.getElementById('sophiaSub').textContent = `Deal ${sp.dmg} damage or gain a mask (once per game)?`;
  document.getElementById('sophiaDmgBtn').textContent = `⚔️ Deal ${sp.dmg} Damage`;
  document.getElementById('sophiaOverlay').classList.add('active');
}

function doSophiaChoice(choice) {
  const sp = B.sophiaPending;
  if (!sp) return;
  B.sophiaPending = null;
  document.getElementById('sophiaOverlay').classList.remove('active');
  if (choice === 'day' || choice === 'night') {
    B.sophiaMask[sp.winTeamName] = choice;
    B.sophiaMaskActive[sp.winTeamName] = true;
    const maskName = choice === 'day' ? '☀️ Mask of Day' : '🌙 Mask of Night';
    const maskDesc = choice === 'day' ? 'Gain 1 Burn for each 1 or 2 you roll' : 'Roll the same number of dice as the enemy ghost, +1 damage';
    checkKnightEffects(sp.winTeamName, sp.wF.name);
    log(`<span class="log-ability">${sp.wF.name}</span> — Masquerade! Gained <b>${maskName}</b> instead of dealing damage! (${maskDesc})`);
    queueAbility('MASQUERADE!', 'var(--rare)', `${sp.wF.name} — ${maskName}! ${maskDesc}`, () => { renderBattle(); }, sp.winTeamName);
  } else {
    // Deal the stashed damage
    sp.lF.hp = Math.max(0, sp.lF.hp - sp.dmg);
    if (sp.lF.hp <= 0) { sp.lF.ko = true; sp.lF.killedBy = (sp.wF.originalId || sp.wF.id); }
    log(`<span class="log-dmg">${sp.wF.name} deals ${sp.dmg} to ${sp.lF.name}!</span> ${sp.lF.ko?'<span class="log-ko">KO!</span>':sp.lF.hp+' HP left'}`);
    renderBattle();
  }
  drainAbilityQueue(() => { if (sp.resume) sp.resume(); });
}

function toggleSophiaMask(team) {
  if (!isPreRollActive(team)) return;
  if (!B.sophiaMask[team]) return;
  B.sophiaMaskActive[team] = !B.sophiaMaskActive[team];
  renderBattle();
}

// Gordok (430) — River Terror: show choice modal
function showGordokModal(resumeCallback) {
  const gp = B.gordokPending;
  if (!gp) { resumeCallback(); return; }
  gp.resume = resumeCallback;
  document.getElementById('gordokSub').textContent = `Deal ${gp.dmg} damage or steal up to 2 resources?`;
  document.getElementById('gordokDmgBtn').textContent = `⚔️ Deal ${gp.dmg} Damage`;
  document.getElementById('gordokOverlay').classList.add('active');
}

function doGordokChoice(choice) {
  const gp = B.gordokPending;
  if (!gp) return;
  B.gordokPending = null;
  document.getElementById('gordokOverlay').classList.remove('active');
  if (choice === 'steal') {
    const gordokOppRes = gp.loseTeam.resources;
    const gordokResTypes = ['ice', 'fire', 'surge', 'luckyStone', 'moonstone', 'healingSeed'];
    let gordokStolen = 0;
    const gordokStolenList = [];
    for (let i = 0; i < 2 && gordokStolen < 2; i++) {
      const avail = gordokResTypes.filter(r => (gordokOppRes[r] || 0) > 0);
      if (avail.length === 0) break;
      const pick = avail[Math.floor(Math.random() * avail.length)];
      gordokOppRes[pick]--;
      gp.winTeam.resources[pick] = (gp.winTeam.resources[pick] || 0) + 1;
      gordokStolenList.push(pick);
      gordokStolen++;
    }
    if (!B.gordokDieBonus) B.gordokDieBonus = { red: 0, blue: 0 };
    B.gordokDieBonus[gp.winTeamName] = 1;
    gp.winTeam.resources.moonstone++;
    checkKnightEffects(gp.winTeamName, gp.wF.name);
    log(`<span class="log-ability">${gp.wF.name}</span> — River Terror! Stole ${gordokStolenList.join(', ')} instead of dealing damage! <span class="log-ice">+1 die next roll!</span> <span class="log-ms">+1 Moonstone!</span>`);
    queueAbility('RIVER TERROR!', 'var(--rare)', `${gp.wF.name} — stole resources instead of dealing damage! +1 Moonstone!`, () => { renderBattle(); }, gp.winTeamName);
  } else {
    // Deal the stashed damage
    gp.lF.hp = Math.max(0, gp.lF.hp - gp.dmg);
    if (gp.lF.hp <= 0) { gp.lF.ko = true; gp.lF.killedBy = (gp.wF.originalId || gp.wF.id); }
    log(`<span class="log-dmg">${gp.wF.name} deals ${gp.dmg} to ${gp.lF.name}!</span> ${gp.lF.ko?'<span class="log-ko">KO!</span>':gp.lF.hp+' HP left'}`);
    renderBattle();
  }
  drainAbilityQueue(() => { if (gp.resume) gp.resume(); });
}

// Timber (210) — Howl choice modal
function showTimberModal(tp, resumeCallback) {
  const oppLabel = tp.oppTeamName.charAt(0).toUpperCase() + tp.oppTeamName.slice(1);
  const bannerEl = document.getElementById('timberBanner');
  if (bannerEl) {
    bannerEl.textContent = `🐺 ${oppLabel.toUpperCase()} MUST CHOOSE`;
    bannerEl.className = `selene-banner ${tp.oppTeamName}`;
    bannerEl.style.background = 'linear-gradient(135deg,#4a2c0a,#7c4a1a)';
  }
  const titleEl = document.getElementById('timberTitle');
  if (titleEl) titleEl.textContent = `Timber — Howl!`;
  const subEl = document.getElementById('timberSub');
  if (subEl) subEl.textContent = `${oppLabel}: choose your fate!`;
  // Disable discard button if opponent has fewer than 2 specials — they must take the die penalty
  const discardBtn = document.getElementById('timberDiscardBtn');
  if (discardBtn) {
    const r = tp.team.resources;
    const totalSpecials = ['surge','ice','healingSeed','luckyStone','fire','moonstone']
      .reduce((sum, t) => sum + (r[t] || 0), 0);
    discardBtn.disabled = totalSpecials < 2;
  }
  narrate(`<b class="${tp.oppTeamName}-text">${oppLabel}</b>&nbsp;faces <b class="gold">TIMBER!</b>&nbsp;Discard 2 specials or lose a die!`);
  B.timberPending._resumeCallback = resumeCallback;
  document.getElementById('timberOverlay').classList.add('active');
}

function doTimberChoice(choice) {
  const tp = B.timberPending;
  if (!tp) return;
  const resume = tp._resumeCallback;
  const oppLabel = tp.oppTeamName.charAt(0).toUpperCase() + tp.oppTeamName.slice(1);
  const timberGhost = active(B[tp.timberTeam]);
  const timberName = timberGhost ? timberGhost.name : 'Timber';
  B.timberPending = null;
  document.getElementById('timberOverlay').classList.remove('active');
  let subtitle;
  if (choice === 'discard') {
    // Discard 2 specials from most abundant first
    const r = tp.team.resources;
    let toDiscard = 2;
    const types = ['surge','ice','healingSeed','luckyStone','fire','moonstone'];
    types.sort((a,b) => (r[b]||0) - (r[a]||0));
    for (const t of types) {
      while (toDiscard > 0 && (r[t]||0) > 0) {
        r[t]--;
        toDiscard--;
      }
    }
    subtitle = `${oppLabel} discards 2 specials to keep all dice!`;
    log(`<span class="log-ability">${oppLabel}</span> chose to discard 2 specials to avoid Timber's Howl!`);
  } else {
    // Lose 1 die
    if (tp.oppTeamName === 'red') B.preRoll.red.count = Math.max(1, B.preRoll.red.count - 1);
    else B.preRoll.blue.count = Math.max(1, B.preRoll.blue.count - 1);
    subtitle = `${oppLabel} rolls 1 fewer die!`;
    log(`<span class="log-ability">${oppLabel}</span> chose to roll 1 fewer die under Timber's Howl!`);
  }
  renderBattle();
  // Queue mode: HOWL! first, then any knight reactions (HEAVY AIR! / RETRIBUTION!),
  // then drain sequentially. Mirrors the doSeleneChoice pattern from v90.
  // _oppBtn unlocked and resume() called only after the full callout chain completes.
  abilityQueueMode = true;
  queueAbility('HOWL!', 'var(--legendary)', subtitle, null, tp.timberTeam);
  checkKnightEffects(tp.timberTeam, timberName); // queues HEAVY AIR! or RETRIBUTION! if applicable
  abilityQueueMode = false;
  drainAbilityQueue(() => {
    if (tp._oppBtn) { tp._oppBtn.classList.remove('locked'); tp._oppBtn.disabled = false; }
    if (resume) resume();
  });
}

// Ryder (456) — Toll choice modal
function showRiderModal(tp, resumeCallback) {
  const oppLabel = tp.oppTeamName.charAt(0).toUpperCase() + tp.oppTeamName.slice(1);
  const bannerEl = document.getElementById('riderBanner');
  if (bannerEl) {
    bannerEl.textContent = `⚔️ ${oppLabel.toUpperCase()} MUST CHOOSE`;
    bannerEl.className = `selene-banner ${tp.oppTeamName}`;
    bannerEl.style.background = 'linear-gradient(135deg,#1a1a2e,#4a1942)';
  }
  const titleEl = document.getElementById('riderTitle');
  if (titleEl) titleEl.textContent = `Ryder — Toll!`;
  const subEl = document.getElementById('riderSub');
  if (subEl) subEl.textContent = `${oppLabel}: pay the toll!`;
  narrate(`<b class="${tp.oppTeamName}-text">${oppLabel}</b>&nbsp;faces <b class="gold">RYDER!</b>&nbsp;Take 1 damage or give Ryder Sacred Fire!`);
  B.riderPending._resumeCallback = resumeCallback;
  document.getElementById('riderOverlay').classList.add('active');
}

function doRiderChoice(choice) {
  const tp = B.riderPending;
  if (!tp) return;
  const resume = tp._resumeCallback;
  const oppLabel = tp.oppTeamName.charAt(0).toUpperCase() + tp.oppTeamName.slice(1);
  const riderGhost = active(B[tp.riderTeam]);
  const riderName = riderGhost ? riderGhost.name : 'Ryder';
  B.riderPending = null;
  document.getElementById('riderOverlay').classList.remove('active');
  let subtitle;
  if (choice === 'damage') {
    // Opponent takes 1 damage
    const oppGhost = active(tp.team);
    if (oppGhost && !oppGhost.ko) {
      oppGhost.hp = Math.max(0, oppGhost.hp - 1);
      if (oppGhost.hp <= 0) { oppGhost.hp = 0; oppGhost.ko = true; oppGhost.killedBy = 456; }
      subtitle = `${oppLabel}'s ${oppGhost.name} takes 1 damage! (${oppGhost.hp}/${oppGhost.maxHp} HP)`;
      log(`<span class="log-ability">${oppLabel}</span> chose to take 1 damage from Ryder's Toll! ${oppGhost.name} → ${oppGhost.hp}/${oppGhost.maxHp} HP.`);
      // Simon (24) — Brew Time: gain 1 Sacred Fire when taking ANY damage
      if (oppGhost.id === 24 && !oppGhost.ko) {
        tp.team.resources.fire = (tp.team.resources.fire || 0) + 2;
        queueAbility('BREW TIME!', 'var(--uncommon)', `Simon — Took Toll damage → +2 Sacred Fire!`, tp.oppTeamName);
        log(`<span class="log-ability">Simon</span> — Brew Time! Took Toll damage → <span class="log-ms">+1 Sacred Fire!</span>`);
      }
      // Princess Shade (436) — Bounty: +1 additional damage on pre-roll chip, works from sideline OR active (blocked by Cornelius 45)
      if (!oppGhost.ko && hasAlive(B[tp.riderTeam], 436) && !hasSideline(tp.team, 45)) {
        oppGhost.hp = Math.max(0, oppGhost.hp - 1);
        if (oppGhost.hp <= 0) { oppGhost.hp = 0; oppGhost.ko = true; oppGhost.killedBy = 436; }
        queueAbility('BOUNTY!', 'var(--rare)', `Princess Shade — +1 additional damage to ${oppGhost.name}!`, tp.riderTeam);
        log(`<span class="log-ability">Princess Shade</span> — Bounty! <span class="log-dmg">+1 additional damage to ${oppGhost.name}!</span> ${oppGhost.ko?'<span class="log-ko">KO!</span>':oppGhost.hp+' HP left'}`);
        popSidelineCard(B[tp.riderTeam], 436);
        // Simon takes Bounty damage too
        if (oppGhost.id === 24 && !oppGhost.ko) {
          tp.team.resources.fire = (tp.team.resources.fire || 0) + 1;
          queueAbility('BREW TIME!', 'var(--uncommon)', `Simon — Took Bounty damage → +2 Sacred Fire!`, tp.oppTeamName);
          log(`<span class="log-ability">Simon</span> — Brew Time! Took Bounty damage → <span class="log-ms">+1 Sacred Fire!</span>`);
        }
      } else if (!oppGhost.ko && hasAlive(B[tp.riderTeam], 436) && hasSideline(tp.team, 45)) {
        const cornGhost = getSidelineGhost(tp.team, 45);
        queueAbility('ANTIDOTE!', 'var(--uncommon)', `${cornGhost ? cornGhost.name : 'Cornelius'} blocks Princess Shade's Bounty!`, tp.oppTeamName);
        log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Princess Shade Bounty blocked!`);
      }
    }
  } else {
    // Give Ryder +1 Sacred Fire
    const riderTeamObj = B[tp.riderTeam];
    riderTeamObj.resources.fire = (riderTeamObj.resources.fire || 0) + 1;
    subtitle = `${riderName} gains +1 Sacred Fire! (${riderTeamObj.resources.fire} total)`;
    log(`<span class="log-ability">${oppLabel}</span> chose to give ${riderName} +1 Sacred Fire! (${riderTeamObj.resources.fire} total)`);
  }
  renderBattle();
  abilityQueueMode = true;
  queueAbility('TOLL!', 'var(--rare)', subtitle, null, tp.riderTeam);
  checkKnightEffects(tp.riderTeam, riderName);
  abilityQueueMode = false;
  drainAbilityQueue(() => {
    if (tp._oppBtn) { tp._oppBtn.classList.remove('locked'); tp._oppBtn.disabled = false; }
    if (resume) resume();
  });
}

// Sylvia (313) — Porpoise: when Sylvia loses a roll, player rolls 1 die.
// A 6 negates all damage. Player-driven dice reveal so there's real agency.
// Called from resolveRound right after winner determination, before any
// damage computation (which reads B.sylviaPendingResult at line ~8141).
function showSylviaModal(loseTeamName, resumeCallback) {
  const lF = active(B[loseTeamName]);
  B.phase = 'sylvia-roll';
  B.sylviaPendingResult = null; // cleared so Sylvia block at 8141 knows to wait for this modal
  B.sylviaResume = resumeCallback;
  B.sylviaTeamName = loseTeamName;

  const titleEl = document.getElementById('sylviaTitle');
  if (titleEl) titleEl.textContent = `${lF ? lF.name : 'Sylvia'} — Porpoise!`;
  const subEl = document.getElementById('sylviaSub');
  if (subEl) subEl.innerHTML = `Roll a <b>5 or 6</b> to dodge all damage!`;
  const dieEl = document.getElementById('sylviaDie');
  if (dieEl) {
    dieEl.textContent = '?';
    dieEl.style.transform = 'rotate(0deg)';
  }
  const btn = document.getElementById('sylviaRollBtn');
  if (btn) { btn.disabled = false; btn.textContent = '🌊 Roll the Die!'; }

  narrate(`<b class="${loseTeamName}-text">${lF ? lF.name : 'Sylvia'}</b>&nbsp;rolls for <b class="gold">PORPOISE!</b>&nbsp;5 or 6 dodges all damage!`);
  document.getElementById('sylviaOverlay').classList.add('active');
}

function doSylviaRoll() {
  const btn = document.getElementById('sylviaRollBtn');
  if (!btn || btn.disabled) return;
  btn.disabled = true;

  // Roll the actual die NOW (player click is the trigger)
  const finalValue = Math.floor(Math.random() * 6) + 1;
  const dieEl = document.getElementById('sylviaDie');
  if (!dieEl) { finishSylviaRoll(finalValue); return; }

  // Quick shuffle animation: flip through random values for ~800ms then reveal
  let ticks = 0;
  const totalTicks = 10;
  const tickMs = 70;
  const shuffle = setInterval(() => {
    ticks++;
    dieEl.textContent = String(Math.floor(Math.random() * 6) + 1);
    dieEl.style.transform = `rotate(${ticks * 36}deg)`;
    if (ticks >= totalTicks) {
      clearInterval(shuffle);
      dieEl.textContent = String(finalValue);
      dieEl.style.transform = 'rotate(0deg)';
      if (finalValue >= 5) { // 5 or 6 dodge
        dieEl.style.background = 'linear-gradient(135deg,#fde68a,#f59e0b)';
        dieEl.style.borderColor = '#f59e0b';
        dieEl.style.color = '#78350f';
      } else {
        dieEl.style.background = 'linear-gradient(135deg,#fecaca,#ef4444)';
        dieEl.style.borderColor = '#b91c1c';
        dieEl.style.color = '#7f1d1d';
      }
      setTimeout(() => finishSylviaRoll(finalValue), 850);
    }
  }, tickMs);
}

function finishSylviaRoll(value) {
  const dodged = (value >= 5); // 5 or 6 dodge
  B.sylviaPendingResult = { value, dodged };
  const resume = B.sylviaResume;
  B.sylviaResume = null;
  document.getElementById('sylviaOverlay').classList.remove('active');
  // Reset die visuals for next time
  const dieEl = document.getElementById('sylviaDie');
  if (dieEl) {
    dieEl.style.background = 'linear-gradient(135deg,#bae6fd,#e0f2fe)';
    dieEl.style.borderColor = '#0ea5e9';
    dieEl.style.color = '#0c4a6e';
  }
  if (resume) resume();
}

// ============================================================
// PRINCE BALATRON (113) — Party Time counter-die reveal
// ============================================================
// Counter-die value + post-counter HP are computed synchronously in
// _resolveRoundImpl so downstream KO-cascade logic sees the correct state.
// The modal is purely cinematic — it shuffles and lands on the pre-computed
// value, then applies the deferred wF.hp mutation so the bar drops the
// instant the reveal lands. B.balatronPending carries the precomputed data.
function showBalatronModal(resumeCallback) {
  const bp = B.balatronPending;
  if (!bp) { if (resumeCallback) resumeCallback(); return; }
  B.balatronResume = resumeCallback;

  const titleEl = document.getElementById('balatronTitle');
  if (titleEl) titleEl.textContent = `${bp.lFName} — Party Time!`;
  const subEl = document.getElementById('balatronSub');
  if (subEl) subEl.innerHTML = `${bp.lFName} lost the roll — but the party's not over.<br>Roll the counter die for damage to <b>${bp.wFName}</b>!`;
  const dieEl = document.getElementById('balatronDie');
  if (dieEl) {
    dieEl.textContent = '?';
    dieEl.style.transform = 'rotate(0deg)';
    dieEl.style.background = 'linear-gradient(135deg,#e9d5ff,#c4b5fd)';
    dieEl.style.borderColor = '#a855f7';
    dieEl.style.color = '#4c1d95';
  }
  const btn = document.getElementById('balatronRollBtn');
  if (btn) { btn.disabled = false; btn.textContent = '🎲 Roll the Counter Die!'; }

  narrate(`<b class="${bp.loseTeamName}-text">${bp.lFName}</b>&nbsp;retaliates — <b class="gold">PARTY TIME!</b>`);
  document.getElementById('balatronOverlay').classList.add('active');
}

function doBalatronRoll() {
  const btn = document.getElementById('balatronRollBtn');
  if (!btn || btn.disabled) return;
  btn.disabled = true;

  const bp = B.balatronPending;
  if (!bp) { finishBalatronRoll(); return; }
  const finalValue = bp.counterDie;

  const dieEl = document.getElementById('balatronDie');
  if (!dieEl) { finishBalatronRoll(); return; }

  // Shuffle animation — land on the pre-computed counter value
  let ticks = 0;
  const totalTicks = 10;
  const tickMs = 70;
  const shuffle = setInterval(() => {
    ticks++;
    dieEl.textContent = String(Math.floor(Math.random() * 6) + 1);
    dieEl.style.transform = `rotate(${ticks * 36}deg)`;
    if (ticks >= totalTicks) {
      clearInterval(shuffle);
      dieEl.textContent = String(finalValue);
      dieEl.style.transform = 'rotate(0deg)';
      // Color the die by hit size
      if (finalValue >= 5) {
        dieEl.style.background = 'linear-gradient(135deg,#fde68a,#f59e0b)';
        dieEl.style.borderColor = '#f59e0b';
        dieEl.style.color = '#78350f';
      } else if (finalValue >= 3) {
        dieEl.style.background = 'linear-gradient(135deg,#fbbf24,#d97706)';
        dieEl.style.borderColor = '#b45309';
        dieEl.style.color = '#78350f';
      } else {
        dieEl.style.background = 'linear-gradient(135deg,#fecaca,#ef4444)';
        dieEl.style.borderColor = '#b91c1c';
        dieEl.style.color = '#7f1d1d';
      }
      setTimeout(() => finishBalatronRoll(), 900);
    }
  }, tickMs);
}

function finishBalatronRoll() {
  const bp = B.balatronPending;
  const resume = B.balatronResume;
  B.balatronPending = null;
  B.balatronResume = null;
  document.getElementById('balatronOverlay').classList.remove('active');

  if (bp) {
    // Apply the deferred HP mutation + log so the bar drops exactly now.
    const wTeamName = bp.loseTeamName === 'red' ? 'blue' : 'red';
    const wTeamObj = B[wTeamName];
    const wF = wTeamObj ? active(wTeamObj) : null;
    if (wF && wF.name === bp.wFName) {
      wF.hp = bp.hpAfter;
    }
    log(`<span class="log-ability">${bp.lFName}</span> — Party Time! Counter die: <b>${bp.counterDie}</b> damage to ${bp.wFName}! ${bp.wasKo?'<span class="log-ko">KO!</span>':bp.hpAfter+' HP left'}`);
    renderBattle();
  }
  if (resume) resume();
}

// ============================================================
// ROMY (114) — Valley Guardian: pre-roll number prediction modal
// ============================================================
function doRomyPrediction(num) {
  document.getElementById('romyOverlay').classList.remove('active');
  const rp = B.romyPending;
  if (!rp) return;
  B.romyPending = null;
  if (B.romyPrediction) B.romyPrediction[rp.team] = num;
  narrate(`<b class="gold">${rp.ghostName} predicts... ${num}!</b> Valley Guardian ready!`);
  // Unlock this team's button and proceed to roll
  const myBtn = document.getElementById(rp.team === 'red' ? 'rollRedBtn' : 'rollBlueBtn');
  // Give the narration a beat to appear, then roll
  setTimeout(() => { doTeamRoll(rp.team, myBtn); }, 400);
}

// ============================================================
// TOBY (97) — Pure Heart: all-in declaration handler
// ============================================================
function doTobyPureHeart(declared) {
  document.getElementById('tobyOverlay').classList.remove('active');
  const tp = B.tobyPending;
  if (!tp) return;
  B.tobyPending = null;
  if (B.pureHeartDeclared) B.pureHeartDeclared[tp.team] = declared;
  const myBtn = document.getElementById(tp.team === 'red' ? 'rollRedBtn' : 'rollBlueBtn');
  if (declared) {
    narrate(`<b class="gold">PURE HEART!</b> Toby declares the final roll — a win ends it all! (Toby sacrifices next round)`);
  } else {
    narrate(`<b class="${tp.team}-text">Toby</b> stands down — not this round.`);
    if (B.pureHeartDeclared) B.pureHeartDeclared[tp.team] = false;
  }
  setTimeout(() => { doTeamRoll(tp.team, myBtn); }, 400);
}

// ============================================================
// TYLER (105) — Heating Up: opt-in 2 HP trade for +1 die
// ============================================================
function doTylerChoice(choice) {
  const tp = B.tylerPending;
  if (!tp) return;
  B.tylerPending = null;
  document.getElementById('tylerOverlay').classList.remove('active');
  const { team, btn } = tp;
  const f = active(B[team]);
  if (choice === 'yes' && f && !f.ko && f.hp >= 3) {
    const prevHp = f.hp;
    f.hp -= 2;
    // +1 die: bump the pre-roll count already stored by doPreRollSetup
    if (B.preRoll && B.preRoll[team]) {
      B.preRoll[team].count = Math.min(6, B.preRoll[team].count + 1);
    }
    showAbilityCallout('HEATING UP!', 'var(--ghost-rare)', `${f.name} — spends 2 HP for +1 die! (${prevHp} → ${f.hp} HP)`, team);
    log(`<span class="log-ability">${f.name}</span> — Heating Up! Spent 2 HP for +1 die (${prevHp} → ${f.hp} HP).`);
    renderBattle();
    // Short pause so the callout is visible before the dice roll
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(1500));
  } else {
    narrate(`<b class="${team}-text">Tyler</b> holds HP — rolling without the trade.`);
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(200));
  }
}

// ============================================================
// GUARDIAN FAIRY (99) — Wish: reactive damage swap handler
// ============================================================
let gfWishTimer = null;
function doGuardianFairyReactive(choice) {
  const gfp = B.guardianFairyReactivePending;
  if (!gfp) return;
  B.guardianFairyReactivePending = null;
  // Clear timer and hide button
  if (gfWishTimer) { clearInterval(gfWishTimer); gfWishTimer = null; }
  document.getElementById('gfWishBtn').style.display = 'none';
  const { loseTeamName, gfGhost, dmg, lF, resume } = gfp;
  const loseTeam = B[loseTeamName];
  if (choice === 'yes') {
    // Guardian Fairy takes the damage instead — heal to full first (entering from sideline)
    const gfIdx = loseTeam.ghosts.indexOf(gfGhost);
    gfGhost.hp = gfGhost.maxHp; // heal to full on entry
    gfGhost.hp = Math.max(0, gfGhost.hp - dmg);
    if (gfGhost.hp <= 0) { gfGhost.ko = true; gfGhost.killedBy = -1; }
    // Swap GF to active, original ghost to sideline at current HP
    if (gfIdx !== -1) loseTeam.activeIdx = gfIdx;
    const gfName = gfGhost.name || 'Guardian Fairy';
    queueAbility('WISH!', 'var(--ghost-rare)', `${gfName} — leaps in to absorb ${dmg} damage for ${lF.name}!${gfGhost.ko ? ' GF falls!' : ' ' + gfGhost.hp + ' HP left'}`, null, loseTeamName);
    log(`<span class="log-ability">${gfName}</span> — Wish! Absorbed ${dmg} damage for ${lF.name}! ${gfGhost.ko ? '<span class="log-ko">GF falls!</span>' : gfGhost.hp + ' HP left'}`);
    renderBattle();
    if (resume) setTimeout(resume, spd(1500));
  } else {
    // Damage applies to the original ghost
    lF.hp = Math.max(0, lF.hp - dmg);
    if (lF.hp <= 0) { lF.ko = true; lF.killedBy = gfp.wFId; }
    log(`<span class="log-dmg">${gfp.wFName} deals ${dmg} to ${lF.name}!</span> ${lF.ko?'<span class="log-ko">KO!</span>':lF.hp+' HP left'}`);
    renderBattle();
    if (resume) setTimeout(resume, 200);
  }
}

// Show GF Wish as a timed button with countdown — auto-declines on expiry
function showGfWishButton() {
  const gfp = B.guardianFairyReactivePending;
  if (!gfp) return;
  const gfG = gfp.gfGhost;
  const gfName = gfG.name || 'Guardian Fairy';
  const btn = document.getElementById('gfWishBtn');
  const cdEl = document.getElementById('gfWishCountdown');
  const subEl = document.getElementById('gfWishSub');
  subEl.innerHTML = `${gfName} absorbs ${gfp.dmg} dmg for ${gfp.lF.name}!`;
  btn.style.display = 'block';
  btn.onclick = () => doGuardianFairyReactive('yes');
  const secs = getSpecialsTimerSecs();
  let remaining = secs;
  cdEl.textContent = remaining;
  narrate(`<b class="${gfp.loseTeamName}-text">🧚 ${gfName}</b> can take this hit! Click to activate!`);
  if (gfWishTimer) clearInterval(gfWishTimer);
  gfWishTimer = setInterval(() => {
    remaining--;
    cdEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(gfWishTimer); gfWishTimer = null;
      doGuardianFairyReactive('no'); // auto-decline
    }
  }, 1000);
}

// ============================================================
// CHOW (414) — Secret Ingredient: spend 1 Healing Seed for +2 dice
// ============================================================
function doChowChoice(choice) {
  const cp = B.chowPending;
  if (!cp) return;
  B.chowPending = null;
  document.getElementById('chowOverlay').classList.remove('active');
  const { team, btn } = cp;
  const f = active(B[team]);
  if (choice === 'yes' && f && f.id === 414 && !f.ko && B[team].resources.healingSeed >= 1) {
    B[team].resources.healingSeed--;
    B.chowExtraDie[team] = (B.chowExtraDie[team] || 0) + 2;
    // Boopies (419) — Boopie Magic: sideline Healing Seed spending = +1 Lucky Stone
    if (hasSideline(B[team], 419)) { B[team].resources.luckyStone = (B[team].resources.luckyStone || 0) + 1; }
    showAbilityCallout('SECRET INGREDIENT!', 'var(--uncommon)',
      `${f.name} — discarded 1 Healing Seed for +2 dice! (total +${B.chowExtraDie[team]})`, team);
    log(`<span class="log-ability">${f.name}</span> — Secret Ingredient! Discarded 1 Healing Seed → +${B.chowExtraDie[team]} dice total!`);
    renderBattle();
    // If more seeds available, allow another use (re-offer after callout clears)
    if (B[team].resources.healingSeed >= 1) {
      setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(1500));
    } else {
      B.chowDecided[team] = true;
      setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(1500));
    }
  } else {
    B.chowDecided[team] = true;
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(200));
  }
}

// ============================================================
// ZORK (463) — Stoke: discard all Burn for +1 die per Burn (button)
// ============================================================
function useZorkStoke(team) {
  const f = active(B[team]);
  if (!f || f.id !== 463 || f.ko) return;
  if (B.zorkDecided[team]) return;
  if (!B[team].resources.burn || B[team].resources.burn <= 0) return;
  const burnSpent = B[team].resources.burn;
  B[team].resources.burn = 0;
  B.zorkDecided[team] = true;
  if (!B.zorkExtraDie) B.zorkExtraDie = { red: 0, blue: 0 };
  B.zorkExtraDie[team] = (B.zorkExtraDie[team] || 0) + burnSpent;
  showAbilityCallout('SMOLDER!', 'var(--common)',
    `${f.name} — ${burnSpent} Burn → +${burnSpent} dice!`, team);
  log(`<span class="log-ability">${f.name}</span> — Smolder! Discarded ${burnSpent} Burn for +${burnSpent} dice!`);
  renderBattle();
}

// ============================================================
// MIYOSHI (433) — Bonzai!: sacrifice 4 HP for +5 dice
// ============================================================
// ============================================================
// KAYLEE (453) — Slipstream: interactive dice swap
// ============================================================
function showSlipstreamPicker(team, myDice, oppDice, callback) {
  B.slipstreamState = { team, myDice, oppDice, callback, myIdx: null, oppIdx: null, step: 1 };
  const myContainer = document.getElementById('slipstreamMyDice');
  const oppContainer = document.getElementById('slipstreamOppDice');
  const stepLabel = document.getElementById('slipstreamStep');
  stepLabel.textContent = "Step 1: Pick YOUR die to give away";

  // Render my dice as clickable buttons
  myContainer.innerHTML = myDice.map((d, i) =>
    `<button class="die" style="cursor:pointer;font-size:22px;min-width:44px;padding:8px 12px;" onclick="slipstreamPickMy(${i})" id="slipMy${i}">${d}</button>`
  ).join('');

  // Render opponent dice (not clickable yet)
  oppContainer.innerHTML = oppDice.map((d, i) =>
    `<button class="die" style="cursor:default;opacity:0.5;font-size:22px;min-width:44px;padding:8px 12px;" id="slipOpp${i}">${d}</button>`
  ).join('');

  document.getElementById('slipstreamOverlay').classList.add('active');
}

function slipstreamPickMy(idx) {
  const s = B.slipstreamState;
  if (!s || s.step !== 1) return;
  s.myIdx = idx;
  s.step = 2;
  // Highlight selected die
  for (let i = 0; i < s.myDice.length; i++) {
    const el = document.getElementById('slipMy' + i);
    if (el) el.style.opacity = i === idx ? '1' : '0.3';
  }
  // Enable opponent dice clicking
  document.getElementById('slipstreamStep').textContent = "Step 2: Pick OPPONENT's die to take";
  for (let i = 0; i < s.oppDice.length; i++) {
    const el = document.getElementById('slipOpp' + i);
    if (el) { el.style.cursor = 'pointer'; el.style.opacity = '1'; el.onclick = () => slipstreamPickOpp(i); }
  }
}

function slipstreamPickOpp(idx) {
  const s = B.slipstreamState;
  if (!s || s.step !== 2) return;
  s.oppIdx = idx;
  document.getElementById('slipstreamOverlay').classList.remove('active');

  // Perform the swap
  const gave = s.myDice[s.myIdx];
  const took = s.oppDice[s.oppIdx];
  s.myDice[s.myIdx] = took;
  s.oppDice[s.oppIdx] = gave;
  s.myDice.sort((a, b) => a - b);
  s.oppDice.sort((a, b) => a - b);

  const _slipF = active(B[s.team]);
  B.slipstreamStolen = { team: s.team, gave, took };
  showAbilityCallout('SLIPSTREAM!', 'var(--rare)', `${_slipF.name} — Swapped ${gave} for opponent's ${took}!`, s.team);
  log(`<span class="log-ability">${_slipF.name}</span> — Slipstream! <span class="log-dmg">Swapped ${gave} for opponent's ${took}!</span>`);
  renderDice(B.redDice, B.blueDice);

  B.slipstreamState = null;
  // Resume resolution after a brief delay for the callout
  setTimeout(() => s.callback(), spd(1500));
}

function doSlipstreamChoice(choice) {
  if (choice === 'skip') {
    document.getElementById('slipstreamOverlay').classList.remove('active');
    const s = B.slipstreamState;
    B.slipstreamState = null;
    if (s && s.callback) s.callback();
  }
}

// Bonzai pre-roll BUTTON handler (clicked before Roll)
function useTobyButton(team) {
  const f = active(B[team]);
  if (!f || f.id !== 97 || f.ko) return;
  if (!B.pureHeartDeclared || B.pureHeartDeclared[team] !== null) return;
  B.pureHeartDeclared[team] = true;
  showAbilityCallout('PURE HEART!', 'var(--ghost-rare)',
    `${f.name} — declares the final roll! Win = instant KO! Toby sacrifices next round.`, team);
  narrate(`<b class="gold">PURE HEART!</b> Toby declares the final roll — a win ends it all!`);
  log(`<span class="log-ability">${f.name}</span> — PURE HEART declared! Win this roll = instant KO. Toby sacrifices next round.`);
  renderBattle();
}

function useBonzaiButton(team) {
  const f = active(B[team]);
  if (!f || f.id !== 454 || f.ko || f.hp <= 4) return;
  if (B.bonzaiDecided[team]) return;
  const preHp = f.hp;
  f.hp -= 4;
  if (f.hp <= 0) { f.ko = true; f.killedBy = -1; }
  B.bonzaiDecided[team] = true;
  // Store the dice bonus for consumption during roll setup
  if (!B.bonzaiBtnDice) B.bonzaiBtnDice = { red: 0, blue: 0 };
  B.bonzaiBtnDice[team] = 5;
  showAbilityCallout('BONZAI!', 'var(--rare)',
    `${f.name} — sacrificed 4 HP for +5 dice! (${preHp} → ${f.hp} HP)`, team);
  log(`<span class="log-ability">${f.name}</span> — BONZAI! Sacrificed 4 HP → +5 dice! (${preHp} → ${f.hp} HP)`);
  playDamageSfx(3);
  hitDamage(team);
  renderBattle();
}

function doBonzaiChoice(choice) {
  const bp = B.bonzaiPending;
  if (!bp) return;
  B.bonzaiPending = null;
  document.getElementById('bonzaiOverlay').classList.remove('active');
  const { team, btn } = bp;
  const f = active(B[team]);
  if (choice === 'yes' && f && f.id === 454 && !f.ko && f.hp > 4) {
    const preHp = f.hp;
    f.hp -= 4;
    if (f.hp <= 0) { f.ko = true; f.killedBy = -1; }
    // Add dice directly to preRoll count so they apply to THIS roll, not next
    if (B.preRoll && B.preRoll[team]) {
      B.preRoll[team].count = Math.min(10, B.preRoll[team].count + 5);
    }
    showAbilityCallout('BONZAI!', 'var(--rare)',
      `${f.name} — sacrificed 4 HP for +5 dice! (${preHp} → ${f.hp} HP)`, team);
    log(`<span class="log-ability">${f.name}</span> — BONZAI! Sacrificed 3 HP → +5 dice! (${preHp} → ${f.hp} HP)`);
    playDamageSfx(3);
    hitDamage(team);
    renderBattle();
    B.bonzaiDecided[team] = true;
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(1500));
  } else {
    B.bonzaiDecided[team] = true;
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(200));
  }
}

// ============================================================
// CASTLE GARDENER (442) — Cultivate: discard 1 Healing Seed for 2 Sacred Fire (pre-roll button)
// ============================================================
function useCultivate(team) {
  const f = active(B[team]);
  if (!f || f.id !== 442 || f.ko) return;
  if (!B[team].resources || B[team].resources.healingSeed < 1) return;
  B[team].resources.healingSeed--;
  B[team].resources.fire = (B[team].resources.fire || 0) + 2;
  // Boopies (419) — Boopie Magic: sideline Healing Seed spending = +1 Lucky Stone
  if (hasSideline(B[team], 419)) { B[team].resources.luckyStone = (B[team].resources.luckyStone || 0) + 1; }
  showAbilityCallout('CULTIVATE!', 'var(--uncommon)',
    `${f.name} — discarded 1 Healing Seed → +2 Sacred Fire!`, team);
  log(`<span class="log-ability">${f.name}</span> — Cultivate! Discarded 1 Healing Seed → +2 Sacred Fire!`);
  renderBattle();
}
// Legacy wrapper for old overlay (no longer used)
function doCultivateChoice(choice) {
  document.getElementById('cultivateOverlay').classList.remove('active');
  if (choice === 'yes') {
    const cp = B.cultivatePending;
    if (cp) { B.cultivatePending = null; useCultivate(cp.team); }
  }
}

// ============================================================
// FOREST SPIRIT (446) — Hex: spend 1 Burn to remove 1 enemy die (pre-roll button)
// ============================================================
function useHex(team) {
  const f = active(B[team]);
  if (!f || f.id !== 446 || f.ko) return;
  if ((B[team].resources.burn || 0) < 1) return;

  const oppTeamName = team === 'red' ? 'blue' : 'red';
  B[team].resources.burn--;
  B.hexDieRemoval[oppTeamName] = (B.hexDieRemoval[oppTeamName] || 0) + 1;
  B[team].resources.fire = (B[team].resources.fire || 0) + 1;

  showAbilityCallout('HEX!', 'var(--uncommon)', `${f.name} — -1 Burn → -1 enemy die + 1 Sacred Fire!`, team);
  log(`<span class="log-ability">${f.name}</span> — Hex! -1 Burn → opponent -1 die + <span class="log-ms">+1 Sacred Fire!</span>`);
  renderBattle(); // re-renders the button with updated burn count
}

// ============================================================
// NICK & KNACK (409) — Knick Knack: steal 1 resource from opponent
// ============================================================
function showNickKnackPicker(team, oppTeam) {
  const oppRes = B[oppTeam].resources;
  const resTypes = [
    { key: 'ice', label: 'Ice Shard', emoji: '❄️' },
    { key: 'fire', label: 'Sacred Fire', emoji: '🔥' },
    { key: 'surge', label: 'Surge', emoji: '⚡' },
    { key: 'luckyStone', label: 'Lucky Stone', emoji: '🍀' },
    { key: 'moonstone', label: 'Moonstone', emoji: '💎' },
    { key: 'healingSeed', label: 'Healing Seed', emoji: '🌱' }
  ];
  const available = resTypes.filter(r => (oppRes[r.key] || 0) > 0);
  const optionsEl = document.getElementById('nickKnackOptions');
  let html = '';
  available.forEach(r => {
    html += `<button class="selene-opt" onclick="doNickKnackSteal('${team}','${r.key}')" style="background:linear-gradient(135deg,#065f46,#059669);">${r.emoji} ${r.label} (${oppRes[r.key]})</button>`;
  });
  html += `<button class="selene-opt" onclick="doNickKnackSteal('${team}','skip')" style="background:linear-gradient(135deg,#374151,#1f2937);">✖ Skip</button>`;
  optionsEl.innerHTML = html;
  document.getElementById('nickKnackOverlay').classList.add('active');
}

function doNickKnackSteal(team, resKey) {
  const nnp = B.nickKnackPending;
  if (!nnp) return;
  B.nickKnackPending = null;
  document.getElementById('nickKnackOverlay').classList.remove('active');
  const { btn, oppTeam } = nnp;
  B.nickKnackDecided[team] = true;
  if (resKey !== 'skip') {
    B[oppTeam].resources[resKey]--;
    B[team].resources[resKey] = (B[team].resources[resKey] || 0) + 1;
    const resLabel = resKey === 'luckyStone' ? 'Lucky Stone' : resKey === 'moonstone' ? 'Moonstone' : resKey === 'healingSeed' ? 'Healing Seed' : resKey === 'ice' ? 'Ice Shard' : resKey === 'fire' ? 'Sacred Fire' : 'Surge';
    const f = active(B[team]);
    // Nick & Knack gains +1 HP + 2 Burn on steal
    f.hp += 1;
    // Grant 2 Burn as resource (player places via burn picker during pre-roll)
    if (!B[team].resources.burn) B[team].resources.burn = 0;
    B[team].resources.burn += 2;
    showAbilityCallout('KNICK KNACK!', 'var(--uncommon)',
      `${f.name} — stole 1 ${resLabel}! +1 HP + 2 Burn!`, team);
    log(`<span class="log-ability">${f.name}</span> — Knick Knack! Stole 1 <span class="log-ms">${resLabel}</span>! <span class="log-heal">+1 HP</span> + 2 Burn!`);
    renderBattle();
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(1500));
  } else {
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(200));
  }
}

// ============================================================
// BURN — Place burn resource on enemy sideline ghost (pre-roll)
// ============================================================
function showBurnPicker(team) {
  const t = B[team];
  const burnCount = t.resources.burn || 0;
  if (burnCount <= 0) return;

  const enemyTeamName = team === 'red' ? 'blue' : 'red';
  const enemyTeam = B[enemyTeamName];

  // Find non-KO'd sideline ghosts on enemy team
  const sidelineGhosts = enemyTeam.ghosts
    .map((g, i) => ({ ghost: g, index: i }))
    .filter(x => x.index !== enemyTeam.activeIdx && !x.ghost.ko);

  if (sidelineGhosts.length === 0) {
    log('<span class="log-ability">BURN</span> — No enemy sideline ghosts to burn!');
    return;
  }

  B.burnPickerTeam = team;

  const optionsEl = document.getElementById('burnPickerOptions');
  let html = '';
  sidelineGhosts.forEach(({ ghost, index }) => {
    const gd = ghostData(ghost.id);
    const existingBurn = (B.burn && B.burn[enemyTeamName] && B.burn[enemyTeamName][index]) || 0;
    const burnLabel = existingBurn > 0 ? ` (${existingBurn} Burn already)` : '';
    html += `<button class="selene-opt" onclick="doBurnPlace('${team}',${index})" style="background:linear-gradient(135deg,#7c1a1a,#c0392b);">🔥 ${ghost.name} — ${ghost.hp}/${ghost.maxHp} HP${burnLabel}</button>`;
  });
  html += `<button class="selene-opt" onclick="closeBurnPicker()" style="background:linear-gradient(135deg,#374151,#1f2937);">✖ Cancel</button>`;
  optionsEl.innerHTML = html;
  document.getElementById('burnPickerSub').innerHTML = `You have <b>${burnCount}</b> Burn to place. Each Burn deals 1 damage when the ghost enters battle.`;
  document.getElementById('burnOverlay').classList.add('active');
}

function doBurnPlace(team, ghostIndex) {
  const t = B[team];
  const enemyTeamName = team === 'red' ? 'blue' : 'red';

  if (!t.resources.burn || t.resources.burn <= 0) { closeBurnPicker(); return; }

  t.resources.burn--;
  if (!B.burn) B.burn = { red: {}, blue: {} };
  if (!B.burn[enemyTeamName]) B.burn[enemyTeamName] = {};
  B.burn[enemyTeamName][ghostIndex] = (B.burn[enemyTeamName][ghostIndex] || 0) + 1;

  // Track which Spiritkin placed this burn for KO credit
  const burnPlacer = active(B[team]);
  const burnPlacerId = burnPlacer ? (burnPlacer.originalId || burnPlacer.id) : 0;
  if (!B.burnSource) B.burnSource = { red: {}, blue: {} };
  if (!B.burnSource[enemyTeamName]) B.burnSource[enemyTeamName] = {};
  if (!B.burnSource[enemyTeamName][ghostIndex]) B.burnSource[enemyTeamName][ghostIndex] = {};
  B.burnSource[enemyTeamName][ghostIndex][burnPlacerId] = (B.burnSource[enemyTeamName][ghostIndex][burnPlacerId] || 0) + 1;

  const targetGhost = B[enemyTeamName].ghosts[ghostIndex];
  const totalBurn = B.burn[enemyTeamName][ghostIndex];
  log(`<span class="log-ability">BURN!</span> placed on <span class="log-dmg">${targetGhost.name}</span>! (${totalBurn} total)`);
  showAbilityCallout('BURN!', 'var(--rare)', `${targetGhost.name} has been marked! ${totalBurn} Burn on entry!`, team);

  // Mable Stadango (446) — Hex: when you place Burn, enemy loses 1 die next roll (in play only)
  const mableActive = active(B[team]);
  if (mableActive && mableActive.id === 446 && !mableActive.ko) {
    if (!B.hexDieRemoval) B.hexDieRemoval = { red: 0, blue: 0 };
    B.hexDieRemoval[enemyTeamName] = (B.hexDieRemoval[enemyTeamName] || 0) + 1;
    log(`<span class="log-ability">${mableActive.name}</span> — Hex! Burn placed → enemy -1 die next roll!`);
    showAbilityCallout('HEX!', 'var(--uncommon)', `${mableActive.name} — Burn placed! Enemy -1 die next roll!`, team);
  }

  // Cameron (25) — Unstoppable Force: opponent used a special (Burn)
  triggerCameronSpecialWatch(team);

  renderBattle();
  // v735: broadcast burn state so opponent's engine knows about it
  pvpBroadcastCommitted(team);

  // If still have burn to place, re-open picker after a brief delay
  if (t.resources.burn > 0) {
    setTimeout(() => showBurnPicker(team), 800);
  } else {
    closeBurnPicker();
  }
}

function closeBurnPicker() {
  document.getElementById('burnOverlay').classList.remove('active');
  B.burnPickerTeam = null;
}

// ============================================================
// MAGIC FIREFLIES — Convert wildcard firefly to any resource
// ============================================================
function showFireflyPicker(team) {
  const t = B[team];
  const ffCount = t.resources.firefly || 0;
  if (ffCount <= 0) return;

  B.fireflyPickerTeam = team;

  const resources = [
    { key: 'fire', label: 'Sacred Fire', emoji: '🔥' },
    { key: 'ice', label: 'Ice Shard', emoji: '❄️' },
    { key: 'luckyStone', label: 'Lucky Stone', emoji: '🍀' },
    { key: 'moonstone', label: 'Moonstone', emoji: '🌙' },
    { key: 'healingSeed', label: 'Healing Seed', emoji: '🌱' },
    { key: 'surge', label: 'Surge', emoji: '⚡' },
    { key: 'burn', label: 'Burn', emoji: '🔥' }
  ];

  const optionsEl = document.getElementById('fireflyOptions');
  let html = '';
  resources.forEach(r => {
    // Hide Moonstone if already at cap (max 1)
    if (r.key === 'moonstone' && (t.resources.moonstone || 0) >= 1) return;
    html += `<button class="selene-opt" onclick="doFireflyConvert('${team}','${r.key}')" style="background:linear-gradient(135deg,#8b6914,#daa520);">${r.emoji} ${r.label}</button>`;
  });
  html += `<button class="selene-opt" onclick="closeFireflyPicker()" style="background:linear-gradient(135deg,#374151,#1f2937);">✖ Cancel</button>`;
  optionsEl.innerHTML = html;
  document.getElementById('fireflySub').innerHTML = `You have <b>${ffCount}</b> Magic Firefl${ffCount === 1 ? 'y' : 'ies'}. Each converts to 1 resource of your choice.`;
  document.getElementById('fireflyOverlay').classList.add('active');
}

function doFireflyConvert(team, resourceKey) {
  const t = B[team];
  if (!t.resources.firefly || t.resources.firefly <= 0) { closeFireflyPicker(); return; }

  // Block moonstone conversion if already at cap
  if (resourceKey === 'moonstone' && (t.resources.moonstone || 0) >= 1) {
    closeFireflyPicker();
    showFireflyPicker(team);
    return;
  }
  t.resources.firefly--;
  if (!t.resources[resourceKey]) t.resources[resourceKey] = 0;
  t.resources[resourceKey]++;

  const labelMap = { fire:'Sacred Fire', ice:'Ice Shard', luckyStone:'Lucky Stone', moonstone:'Moonstone', healingSeed:'Healing Seed', surge:'Surge', burn:'Burn' };
  const resLabel = labelMap[resourceKey] || resourceKey;
  log(`<span class="log-ability">MAGIC FIREFLIES!</span> Converted to <span class="log-ms">${resLabel}</span>!`);
  showAbilityCallout('MAGIC FIREFLIES!', '#ffd700', `Converted to ${resLabel}!`, team);

  renderBattle();

  // If still have fireflies, re-open picker after a brief delay
  if (t.resources.firefly > 0) {
    setTimeout(() => showFireflyPicker(team), 800);
  } else {
    closeFireflyPicker();
  }
}

function closeFireflyPicker() {
  document.getElementById('fireflyOverlay').classList.remove('active');
  B.fireflyPickerTeam = null;
}

// ============================================================
// JASPER (428) — Flame Dive: interactive bonus die reveal modal
// ============================================================
function showJasperModal(resumeCallback) {
  const jp = B.jasperPending;
  if (!jp) { if (resumeCallback) resumeCallback(); return; }
  B.jasperResume = resumeCallback;
  const titleEl = document.getElementById('jasperTitle');
  if (titleEl) titleEl.textContent = `${jp.wFName} — Flame Dive!`;
  const subEl = document.getElementById('jasperSub');
  if (subEl) subEl.innerHTML = `${jp.wFName} won — roll the bonus die for extra damage to <b>${jp.lFName}</b>!<br><i>Jasper takes 1 recoil damage.</i>`;
  const dieEl = document.getElementById('jasperDie');
  if (dieEl) { dieEl.textContent = '?'; dieEl.style.transform = 'rotate(0deg)'; }
  const btn = document.getElementById('jasperRollBtn');
  if (btn) { btn.disabled = false; btn.textContent = '🔥 Roll the Bonus Die!'; }
  narrate(`<b class="${jp.winTeamName}-text">${jp.wFName}</b>&nbsp;unleashes <b class="gold">FLAME DIVE!</b>`);
  document.getElementById('jasperOverlay').classList.add('active');
}

function doJasperRoll() {
  const btn = document.getElementById('jasperRollBtn');
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  const jp = B.jasperPending;
  if (!jp) { finishJasperRoll(); return; }
  const finalValue = jp.bonusDie;
  const dieEl = document.getElementById('jasperDie');
  if (!dieEl) { finishJasperRoll(); return; }
  // Shuffle animation — same as Balatron
  let ticks = 0;
  const totalTicks = 10;
  const tickMs = 70;
  const shuffle = setInterval(() => {
    ticks++;
    dieEl.textContent = String(Math.floor(Math.random() * 6) + 1);
    dieEl.style.transform = `rotate(${ticks * 36}deg)`;
    if (ticks >= totalTicks) {
      clearInterval(shuffle);
      dieEl.textContent = String(finalValue);
      dieEl.style.transform = 'rotate(0deg)';
      if (finalValue >= 5) {
        dieEl.style.background = 'linear-gradient(135deg,#fde68a,#f59e0b)';
        dieEl.style.borderColor = '#f59e0b';
      } else if (finalValue >= 3) {
        dieEl.style.background = 'linear-gradient(135deg,#fbbf24,#d97706)';
        dieEl.style.borderColor = '#b45309';
      } else {
        dieEl.style.background = 'linear-gradient(135deg,#fecaca,#ef4444)';
        dieEl.style.borderColor = '#b91c1c';
      }
      setTimeout(() => finishJasperRoll(), 900);
    }
  }, tickMs);
}

function finishJasperRoll() {
  const jp = B.jasperPending;
  const resume = B.jasperResume;
  B.jasperPending = null;
  B.jasperResume = null;
  document.getElementById('jasperOverlay').classList.remove('active');
  if (jp) {
    const wTeamName = jp.winTeamName;
    const wTeamObj = B[wTeamName];
    const lTeamName = wTeamName === 'red' ? 'blue' : 'red';
    const lTeamObj = B[lTeamName];
    const wF = wTeamObj ? active(wTeamObj) : null;
    const lF = lTeamObj ? active(lTeamObj) : null;
    if (lF && lF.name === jp.lFName) {
      lF.hp = Math.max(0, lF.hp - jp.bonusDie);
      if (lF.hp <= 0 && !lF.ko) { lF.ko = true; lF.killedBy = 428; }
    }
    if (wF && wF.name === jp.wFName) {
      wF.hp = Math.max(0, wF.hp - 1);
      if (wF.hp <= 0) { wF.ko = true; wF.killedBy = -1; }
    }
    log(`<span class="log-ability">${jp.wFName}</span> — Flame Dive! Bonus die: <span class="log-dmg">${jp.bonusDie} extra damage</span> to ${jp.lFName}! Self-damage: <span class="log-dmg">1 HP</span>.`);
    renderBattle();
  }
  if (resume) setTimeout(resume, 300);
}

// ============================================================
// SKY (72) — Elusive: damage negated + interactive counter die
// ============================================================
function showSkyElusiveModal(resumeCallback) {
  const sp = B.skyElusivePending;
  if (!sp) { if (resumeCallback) resumeCallback(); return; }
  B.skyElusiveResume = resumeCallback;
  document.getElementById('skyElusiveTitle').textContent = `${sp.lFName} — Elusive!`;
  document.getElementById('skyElusiveSub').innerHTML = `Damage negated! Roll a counter die against <b>${sp.wFName}</b>!`;
  const dieEl = document.getElementById('skyElusiveDie');
  if (dieEl) { dieEl.textContent = '?'; dieEl.style.transform = 'rotate(0deg)'; }
  const btn = document.getElementById('skyElusiveRollBtn');
  if (btn) { btn.disabled = false; btn.textContent = '💨 Roll Counter Die!'; }
  document.getElementById('skyElusiveOverlay').classList.add('active');
}

function doSkyElusiveRoll() {
  const btn = document.getElementById('skyElusiveRollBtn');
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  const sp = B.skyElusivePending;
  if (!sp) { finishSkyElusive(); return; }
  const finalValue = sp.counterDie;
  const dieEl = document.getElementById('skyElusiveDie');
  if (!dieEl) { finishSkyElusive(); return; }
  let ticks = 0;
  const totalTicks = 10;
  const shuffle = setInterval(() => {
    ticks++;
    dieEl.textContent = String(Math.floor(Math.random() * 6) + 1);
    dieEl.style.transform = `rotate(${ticks * 36}deg)`;
    if (ticks >= totalTicks) {
      clearInterval(shuffle);
      dieEl.textContent = String(finalValue);
      dieEl.style.transform = 'rotate(0deg)';
      dieEl.style.background = finalValue >= 4
        ? 'linear-gradient(135deg,#bfdbfe,#3b82f6)'
        : 'linear-gradient(135deg,#dbeafe,#93c5fd)';
      setTimeout(() => finishSkyElusive(), 900);
    }
  }, 70);
}

function finishSkyElusive() {
  const sp = B.skyElusivePending;
  const resume = B.skyElusiveResume;
  B.skyElusivePending = null;
  B.skyElusiveResume = null;
  document.getElementById('skyElusiveOverlay').classList.remove('active');
  if (sp) {
    const wTeamName = sp.winTeamName;
    const wTeamObj = B[wTeamName];
    const wF = wTeamObj ? active(wTeamObj) : null;
    if (wF && wF.name === sp.wFName) {
      wF.hp = Math.max(0, wF.hp - sp.counterDie);
      if (wF.hp <= 0 && !wF.ko) { wF.ko = true; wF.killedBy = 72; }
    }
    log(`<span class="log-ability">${sp.lFName}</span> — Elusive! Counter die: <span class="log-dmg">${sp.counterDie} damage</span> to ${sp.wFName}! ${wF && wF.ko ? '<span class="log-ko">KO!</span>' : (wF ? wF.hp + ' HP left' : '')}`);
    renderBattle();
  }
  if (resume) setTimeout(resume, 300);
}

// ============================================================
// JENKINS (94) — Greeting: interactive 4-dice entry roll modal
// ============================================================
function showJenkinsModal(resumeCallback) {
  const jp = B.jenkinsPending;
  if (!jp) { if (resumeCallback) resumeCallback(); return; }
  B.jenkinsResume = resumeCallback;
  document.getElementById('jenkinsTitle').textContent = `${jp.jenkinsName} — Greeting!`;
  document.getElementById('jenkinsSub').innerHTML = `${jp.jenkinsName} enters the fight — roll 4 dice for entry damage to <b>${jp.enemyName}</b>!`;
  document.getElementById('jenkinsResult').style.display = 'none';
  for (let i = 0; i < 4; i++) {
    const d = document.getElementById('jenkinsDie' + i);
    if (d) { d.textContent = '?'; d.style.transform = 'rotate(0deg)'; d.style.background = 'linear-gradient(135deg,#a7f3d0,#34d399)'; d.style.borderColor = '#10b981'; d.style.color = '#064e3b'; }
  }
  const btn = document.getElementById('jenkinsRollBtn');
  if (btn) { btn.disabled = false; btn.textContent = '👋 Roll the Greeting Dice!'; }
  narrate(`<b class="${jp.team}-text">${jp.jenkinsName}</b> — <b class="gold">GREETING!</b>`);
  document.getElementById('jenkinsOverlay').classList.add('active');
}

function doJenkinsRoll() {
  const btn = document.getElementById('jenkinsRollBtn');
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  const jp = B.jenkinsPending;
  if (!jp) { finishJenkinsRoll(); return; }

  // Shuffle animation across all 4 dice, landing on pre-computed values
  // [shadow] perf: cache die elements before interval to avoid 4 getElementById calls per 65ms tick
  const jenkinsDieEls = Array.from({length: 4}, (_, i) => document.getElementById('jenkinsDie' + i));
  const jenkinsResultEl = document.getElementById('jenkinsResult');
  let ticks = 0;
  const totalTicks = 12;
  const tickMs = 65;
  const shuffle = setInterval(() => {
    ticks++;
    jenkinsDieEls.forEach(d => {
      if (d) {
        d.textContent = String(Math.floor(Math.random() * 6) + 1);
        d.style.transform = `rotate(${ticks * 30}deg)`;
      }
    });
    if (ticks >= totalTicks) {
      clearInterval(shuffle);
      // Land on final values
      jenkinsDieEls.forEach((d, i) => {
        if (d) {
          d.textContent = String(jp.dice[i]);
          d.style.transform = 'rotate(0deg)';
        }
      });
      // Color dice based on damage result
      const dmg = jp.damage;
      let bg, border, color;
      if (dmg >= 4) { bg = 'linear-gradient(135deg,#fde68a,#f59e0b)'; border = '#f59e0b'; color = '#78350f'; }
      else if (dmg >= 2) { bg = 'linear-gradient(135deg,#fbbf24,#d97706)'; border = '#b45309'; color = '#78350f'; }
      else { bg = 'linear-gradient(135deg,#a7f3d0,#34d399)'; border = '#10b981'; color = '#064e3b'; }
      jenkinsDieEls.forEach(d => {
        if (d) { d.style.background = bg; d.style.borderColor = border; d.style.color = color; }
      });
      // Show result label
      const rollLabel = describeRoll(jp.roll);
      if (jenkinsResultEl) {
        jenkinsResultEl.innerHTML = `<span style="color:var(--ghost-rare);">${rollLabel}</span> → <span style="color:var(--accent);">${dmg} damage</span> to ${jp.enemyName}!`;
        jenkinsResultEl.style.display = 'block';
      }
      setTimeout(() => finishJenkinsRoll(), 1200);
    }
  }, tickMs);
}

function finishJenkinsRoll() {
  const jp = B.jenkinsPending;
  const resume = B.jenkinsResume;
  B.jenkinsPending = null;
  B.jenkinsResume = null;
  document.getElementById('jenkinsOverlay').classList.remove('active');
  if (jp) {
    // Apply the deferred damage now
    const enemyTeam = B[jp.enemyTeam];
    const ef = enemyTeam ? active(enemyTeam) : null;
    if (ef && ef.name === jp.enemyName && !ef.ko) {
      ef.hp = Math.max(0, ef.hp - jp.damage);
      if (ef.hp <= 0) { ef.ko = true; ef.killedBy = 94; }
    }
    const rollLabel = describeRoll(jp.roll);
    log(`<span class="log-ability">${jp.jenkinsName}</span> — Greeting! Rolled [${jp.dice.join(', ')}] — ${rollLabel} → <span class="log-dmg">${jp.damage} entry damage to ${jp.enemyName}!</span> ${ef && ef.ko ? '<span class="log-ko">KO!</span>' : (ef ? ef.hp + ' HP left' : '')}`);
    playDamageSfx(jp.damage);
    hitDamage(jp.enemyTeam);
    renderBattle();
  }
  if (resume) setTimeout(resume, 300);
}

// Helper: after entry callouts finish, check for Jenkins modal before continuing
function afterEntryWithJenkins(entryCalloutCount, continuation) {
  const delay = entryCalloutCount > 0 ? entryCalloutCount * spd(1500) : 300;
  setTimeout(() => {
    if (B.jenkinsPending) {
      showJenkinsModal(continuation);
    } else {
      continuation();
    }
  }, delay);
}

// ============================================================
// ELOISE (85) — Change of Heart: swap HP with enemy for 1 Ice Shard
// ============================================================
function doEloiseChoice(choice) {
  const ep = B.eloisePending;
  if (!ep) return;
  B.eloisePending = null;
  document.getElementById('eloiseOverlay').classList.remove('active');
  const { team, btn } = ep;
  const f = active(B[team]);
  const oppTeam = team === 'red' ? 'blue' : 'red';
  const oppF = active(B[oppTeam]);
  if (choice === 'yes' && f && !f.ko && oppF && !oppF.ko && B[team].resources.ice >= 1) {
    // Spend 1 Ice Shard
    B[team].resources.ice -= 1;
    B.eloiseUsedThisRound[team] = true;
    // Swap HP values
    const myOldHp = f.hp;
    const oppOldHp = oppF.hp;
    f.hp = oppOldHp;
    oppF.hp = myOldHp;
    showAbilityCallout('CHANGE OF HEART!', 'var(--rare)', `${f.name} — HP swap! (${myOldHp} → ${f.hp}) vs enemy (${oppOldHp} → ${oppF.hp})`, team);
    log(`<span class="log-ability">${f.name}</span> — Change of Heart! Spent 1 Ice Shard. Swapped HP: ${myOldHp} → ${f.hp}, enemy ${oppOldHp} → ${oppF.hp}.`);
    renderBattle();
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(1500));
  } else {
    B.eloiseUsedThisRound[team] = true; // mark used so we don't re-offer on re-render
    narrate(`<b class="${team}-text">Eloise</b> holds — no swap this round.`);
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(200));
  }
}

// ============================================================
// MALLOW (89) — Dozy Cozy: spend 1 Sacred Fire to heal active ghost +3 HP
// ============================================================
function doMallowChoice(choice) {
  const mp = B.mallowPending;
  if (!mp) return;
  B.mallowPending = null;
  document.getElementById('mallowOverlay').classList.remove('active');
  const { team, btn } = mp;
  const f = active(B[team]);
  B.mallowDecided[team] = true;
  if (choice === 'yes' && f && !f.ko && B[team].resources && B[team].resources.fire >= 2) {
    B[team].resources.fire -= 2;
    const hpBefore = f.hp;
    const mallowSideG = getSidelineGhost(B[team], 89);
    const mallowName = mallowSideG ? mallowSideG.name : 'Mallow';
    // Mr Filbert (59) — Mask Merchant: healing on enemy's active ghost is flipped to damage
    const enemyTeamObj = B[team === 'red' ? 'blue' : 'red'];
    const filbertCursesMallow = hasSideline(enemyTeamObj, 59);
    if (filbertCursesMallow) {
      f.hp = Math.max(0, f.hp - 3);
      if (f.hp <= 0) { f.hp = 0; f.ko = true; f.killedBy = 59; }
      showAbilityCallout('MASK MERCHANT!', 'var(--uncommon)',
        `Mr Filbert — Dozy Cozy cursed! ${f.name} takes 3 damage! (${hpBefore} → ${f.hp} HP)`, team === 'red' ? 'blue' : 'red');
      log(`<span class="log-ability">Mr Filbert</span> — Mask Merchant! Dozy Cozy flipped to damage. ${f.name} ${hpBefore} → ${f.hp} HP.`);
    } else {
      f.hp += 3;
      const overMallow = f.hp > f.maxHp;
      // Grant 1 Burn as a resource (player places it via burn picker during pre-roll)
      if (!B[team].resources.burn) B[team].resources.burn = 0;
      B[team].resources.burn += 1;
      showAbilityCallout('DOZY COZY!', 'var(--rare)',
        `${mallowName} — spent 2 🔥! ${f.name} +3 HP (${hpBefore} → ${f.hp}${overMallow ? ' · overclocked!' : ''}) + 1 Burn!`, team);
      log(`<span class="log-ability">${mallowName}</span> — Dozy Cozy! Spent 2 Sacred Fire. ${f.name} +3 HP (${hpBefore} → ${f.hp}${overMallow ? ' · overclocked!' : ''}). +1 Burn!`);
    }
    renderBattle();
    if (f.ko) {
      // Ghost was KO'd by Filbert's Mask Merchant curse — trigger KO handling instead of rolling
      setTimeout(() => { if (!handleKOs()) renderBattle(); }, spd(1500));
    } else {
      setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(1500));
    }
  } else {
    log(`<span class="log-ability">Mallow</span> — holds the fire.`);
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(200));
  }
}

// ============================================================
// BOGEY (53) — Bogus: reactive reflect choice callback
// v430: Sylvia re-entry pattern. Called by bogeyOverlay buttons while
// resolveRound is paused at the damage-application decision point.
// ============================================================
function doBogeyReflectChoice(choice) {
  document.getElementById('bogeyOverlay').classList.remove('active');
  B.bogeyReflectChoice = choice;
  B.bogeyReflectResuming = true;
  resolveRound();
}

// ============================================================
// BOO BROTHERS (17) — Teamwork: trade 1 die for 1 HP before rolling
// ============================================================
function doBooChoice(choice) {
  const bp = B.booPending;
  if (!bp) return;
  B.booPending = null;
  document.getElementById('booOverlay').classList.remove('active');
  const { team, btn } = bp;
  const f = active(B[team]);
  if (choice === 'yes' && f && !f.ko && B.preRoll && B.preRoll[team] && B.preRoll[team].count >= 2) {
    // Flag: Boo Brothers used Teamwork this round → +1 damage bonus
    if (!B.booTeamworkDmgBonus) B.booTeamworkDmgBonus = { red: 0, blue: 0 };
    B.booTeamworkDmgBonus[team] = 1;
    const prevCount = B.preRoll[team].count;
    B.preRoll[team].count = Math.max(1, prevCount - 1);
    const prevHp = f.hp;
    // Mr Filbert (59) — Mask Merchant: healing on this ghost is flipped to damage
    const enemyTeamObj = B[team === 'red' ? 'blue' : 'red'];
    const filbertCursesTeamwork = hasSideline(enemyTeamObj, 59);
    if (filbertCursesTeamwork) {
      f.hp = Math.max(0, f.hp - 1);
      if (f.hp <= 0) { f.hp = 0; f.ko = true; f.killedBy = 59; }
      showAbilityCallout('MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Teamwork cursed! ${f.name} takes 1 damage! (${prevHp} → ${f.hp} HP)`, team === 'red' ? 'blue' : 'red');
      log(`<span class="log-ability">Mr Filbert</span> — Mask Merchant! Teamwork flipped to damage. ${f.name} ${prevHp} → ${f.hp} HP.`);
    } else {
      f.hp += 1;
      const overTeam = f.hp > f.maxHp;
      showAbilityCallout('TEAMWORK!', 'var(--common)', `${f.name} — trade 1 die for +1 HP! (${prevCount} → ${B.preRoll[team].count} dice | ${prevHp} → ${f.hp} HP${overTeam ? ' · overclocked!' : ''})`, team);
      log(`<span class="log-ability">${f.name}</span> — Teamwork! Traded 1 die for +1 HP (${prevCount} → ${B.preRoll[team].count} dice, ${prevHp} → ${f.hp} HP${overTeam ? ' · overclocked!' : ''}).`);
    }
    renderBattle();
    if (f.ko) {
      // Ghost was KO'd by Filbert's Mask Merchant curse — trigger KO handling instead of rolling
      setTimeout(() => { if (!handleKOs()) renderBattle(); }, spd(1500));
    } else {
      setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(1500));
    }
  } else {
    narrate(`<b class="${team}-text">Boo Brothers</b> hold — keeping all dice.`);
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(200));
  }
}

// ============================================================
// GUS (31) — Gale Force: reactive post-win timed button (Guardian Fairy pattern)
// ============================================================
let gusGaleTimer = null;
function doGusGaleReactive(choice) {
  const gp = B.gusGaleReactivePending;
  if (!gp) return;
  B.gusGaleReactivePending = null;
  // Clear timer and hide button
  if (gusGaleTimer) { clearInterval(gusGaleTimer); gusGaleTimer = null; }
  document.getElementById('gusGaleBtn').style.display = 'none';
  const { winTeamName, loseTeamName, dmg, wF, lF, resume } = gp;
  const loseTeam = B[loseTeamName];
  const winTeam = B[winTeamName];
  if (choice === 'yes') {
    // Force swap — new ghost takes the damage via picker
    collectKC(winTeamName, wF.name);
    log(`<span class="log-ability">${wF.name}</span> — Gale Force! ${loseTeamName} must choose a replacement — the new ghost takes ${dmg} damage!`);
    queueAbility('GALE FORCE!', 'var(--common)', `${wF.name} — No damage! ${loseTeamName === 'red' ? 'Red' : 'Blue'} team must choose a replacement!`, null, winTeamName);
    // Cancel Guardian Fairy if it was pending (Gus swap takes priority)
    if (B.guardianFairyReactivePending) {
      B.guardianFairyReactivePending = null;
      if (gfWishTimer) { clearInterval(gfWishTimer); gfWishTimer = null; }
      document.getElementById('gfWishBtn').style.display = 'none';
    }
    // Set up gale force swap state for the picker
    B._gusGaleAccepted = true;
    B._gusGaleDmg = dmg;
    B._gusGaleWinTeam = winTeamName;
    B._gusGaleLoseTeam = loseTeamName;
    if (resume) setTimeout(resume, spd(1500));
  } else {
    // Player declined — damage applies to the current opponent now
    B._gusGaleAccepted = false;
    lF.hp = Math.max(0, lF.hp - dmg);
    if (lF.hp <= 0) { lF.ko = true; lF.killedBy = (wF.originalId || wF.id); }
    log(`<span class="log-dmg">${wF.name} deals ${dmg} to ${lF.name}!</span> ${lF.ko?'<span class="log-ko">KO!</span>':lF.hp+' HP left'}`);
    playDamageSfx(dmg);
    hitDamage(loseTeamName);
    renderBattle();
    if (resume) setTimeout(resume, 200);
  }
}

// Show Gus Gale Force as a timed button with countdown — auto-declines on expiry
function showGusGaleButton() {
  const gp = B.gusGaleReactivePending;
  if (!gp) return;
  const btn = document.getElementById('gusGaleBtn');
  const cdEl = document.getElementById('gusGaleCountdown');
  const subEl = document.getElementById('gusGaleSub');
  subEl.innerHTML = `Force ${gp.loseTeamName === 'red' ? 'Red' : 'Blue'} to swap — new ghost takes ${gp.dmg} dmg!`;
  btn.style.display = 'block';
  btn.onclick = () => doGusGaleReactive('yes');
  const secs = getSpecialsTimerSecs();
  let remaining = secs;
  cdEl.textContent = remaining;
  narrate(`<b class="${gp.winTeamName}-text">💨 ${gp.wF.name}</b> can force a swap! Click to activate!`);
  if (gusGaleTimer) clearInterval(gusGaleTimer);
  gusGaleTimer = setInterval(() => {
    remaining--;
    cdEl.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(gusGaleTimer); gusGaleTimer = null;
      doGusGaleReactive('no'); // auto-decline
    }
  }, 1000);
}

// ============================================================
// RADITZ (62) — Hunt: entry forced-swap choice handlers
// ============================================================
function doRaditzHuntChoice(choice) {
  const rhp = B.raditzHuntPending;
  if (!rhp) return;
  B.raditzHuntPending = null;
  if (B.raditzHuntReady) B.raditzHuntReady[rhp.team] = false;
  document.getElementById('raditzHuntOverlay').classList.remove('active');
  const { team, btn, oppBtn } = rhp;

  if (choice === 'no') {
    narrate(`<b class="${team}-text">Raditz</b> — Hunt not used. Rolling as normal.`);
    // Unlock opponent's button so they can roll independently
    if (oppBtn) { oppBtn.disabled = false; oppBtn.classList.remove('locked'); }
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(200));
    return;
  }

  // YES — check for available sideline targets
  const enemyTeamName = team === 'red' ? 'blue' : 'red';
  const enemy = B[enemyTeamName];

  // Barnaby (326) — Stubborn: immune to opponent forced swaps
  const _barnabyHunt = active(enemy);
  if (_barnabyHunt && _barnabyHunt.id === 326 && !_barnabyHunt.ko) {
    narrate(`<b class="${team}-text">Raditz</b> — Hunt blocked! <b>${_barnabyHunt.name}</b> is Stubborn!`);
    log(`<span class="log-ability">Barnaby</span> — Stubborn! Raditz Hunt blocked — ${_barnabyHunt.name} cannot be forced out.`);
    if (oppBtn) { oppBtn.disabled = false; oppBtn.classList.remove('locked'); }
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(200));
    return;
  }

  const aliveSideline = enemy.ghosts.filter((g, i) => i !== enemy.activeIdx && !g.ko);

  if (aliveSideline.length === 0) {
    // No valid swap targets (shouldn't happen, but guard it)
    narrate(`<b class="${team}-text">Raditz</b> — Hunt! No sideline ghosts to swap in.`);
    if (oppBtn) { oppBtn.disabled = false; oppBtn.classList.remove('locked'); }
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(200));
    return;
  }

  // Store continuation for doRaditzHuntSwap
  B.raditzHuntCont = { team, btn, oppBtn };

  if (aliveSideline.length === 1) {
    // Auto-swap to the only option
    doRaditzHuntSwap(team, enemy.ghosts.indexOf(aliveSideline[0]));
    return;
  }

  // Multiple options — show pressureOverlay for opponent to pick who comes in
  const enemyLabel = enemyTeamName.charAt(0).toUpperCase() + enemyTeamName.slice(1);
  const whoBanner = document.getElementById('pressureWho');
  if (whoBanner) { whoBanner.className = `pm-who-banner ${enemyTeamName}`; whoBanner.textContent = `🎯 ${enemyLabel.toUpperCase()} PICKS`; }
  const pTitle = document.getElementById('pressureTitle');
  if (pTitle) pTitle.textContent = `Hunt! — Raditz forces a swap`;
  const pSub = document.getElementById('pressureSub');
  if (pSub) pSub.textContent = `${enemyLabel}: choose which ghost enters the fight.`;
  document.getElementById('pressureOptions').innerHTML = aliveSideline.map(g => {
    const realIdx = enemy.ghosts.indexOf(g);
    const gd = ghostData(g.id);
    const hpRatio = g.hp / g.maxHp;
    const hpColor = hpRatio > 0.6 ? 'var(--hp-green)' : hpRatio > 0.3 ? 'var(--hp-yellow)' : 'var(--hp-red)';
    return `<div class="pressure-opt" onclick="doRaditzHuntSwap('${team}',${realIdx})">
      ${gd.art ? `<img src="${gd.art}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;border:1px solid var(--${gd.rarity});">` : ''}
      <div><div style="font-weight:700;">${g.name}</div>
      <div style="font-size:12px;color:var(--text2);"><span style="color:${hpColor};font-weight:700;">♥ ${g.hp}/${g.maxHp}</span> · <span style="color:var(--moonstone);">${gd.ability}</span></div></div>
    </div>`;
  }).join('');
  // B.phase stays 'rolling'; both buttons are still locked — pressureOverlay blocks input
  B.pressurePickerTeam = enemyTeamName; // v728: track which team picks (for PvP auto-resolve)
  document.getElementById('pressureOverlay').classList.add('active');
}

function doRaditzHuntSwap(attackerTeam, targetIdx) {
  document.getElementById('pressureOverlay').classList.remove('active');
  const cont = B.raditzHuntCont;
  B.raditzHuntCont = null;
  if (!cont) return;
  const { team, btn, oppBtn } = cont;

  const t = B[attackerTeam];
  const raditzG = active(t);
  const enemy = opp(t);
  const oldGhost = active(enemy);
  const oldName = oldGhost.name;

  // Perform the swap — incoming ghost returns at full HP
  enemy.activeIdx = targetIdx;
  const newGhost = active(enemy);
  newGhost.hp = newGhost.maxHp;
  renderBattle();

  const attackerCls = attackerTeam === 'red' ? 'red-text' : 'blue-text';
  narrate(`<b class="${attackerCls}">${raditzG.name}</b> — Hunt! <b>${oldName}</b> to the sideline — <b>${newGhost.name}</b> enters at full HP!`);
  showAbilityCallout('HUNT!', 'var(--rare)', `${oldName} forced out — ${newGhost.name} enters!`, attackerTeam);
  log(`<span class="log-ability">${raditzG.name}</span> — Hunt! ${oldName} sent to sideline, ${newGhost.name} enters at full HP.`);

  setTimeout(() => {
    const entryCalloutCount = triggerEntry(enemy, false);
    afterEntryWithJenkins(entryCalloutCount, () => {
      if (handleKOs()) return; // entry effect caused a KO — KO flow takes over
      renderBattle();
      // Unlock opponent's button — they can now roll independently
      if (oppBtn) { oppBtn.disabled = false; oppBtn.classList.remove('locked'); }
      // Raditz's team rolls
      btn.disabled = false;
      btn.classList.remove('locked');
      doTeamRoll(team, btn);
    });
  }, spd(1500));
}

// ============================================================
// DOUG (63) — Caution: once-per-game pre-roll swap for +1 die
// ============================================================
function doDougCautionChoice(choice) {
  const dp = B.dougCautionPending;
  if (!dp) return;
  B.dougCautionPending = null;
  document.getElementById('dougCautionOverlay').classList.remove('active');
  const { team, btn } = dp;

  if (choice === 'no') {
    // Mark as used so we don't re-offer (once-per-game skip counts as use)
    if (B.dougCautionUsed) B.dougCautionUsed[team] = true;
    narrate(`<b class="${team}-text">Doug</b> — Caution not used. Rolling as normal.`);
    setTimeout(() => { btn.disabled = false; btn.classList.remove('locked'); doTeamRoll(team, btn); }, spd(200));
    return;
  }
  // YES — show ghost picker (already rendered in the overlay)
  // doDougCautionSwap handles the actual swap
}

function doDougCautionSwap(targetIdx) {
  document.getElementById('dougCautionOverlay').classList.remove('active');
  const dp = B.dougCautionPending;
  B.dougCautionPending = null;
  if (!dp) return;
  const { team, btn } = dp;

  if (B.dougCautionUsed) B.dougCautionUsed[team] = true;

  const myTeam = B[team];
  const doug = active(myTeam); // Doug (currently active)
  const dougOldIdx = myTeam.activeIdx;
  const dougName = doug.name;

  // Swap Doug to sideline, bring in chosen ghost
  myTeam.activeIdx = targetIdx;
  const newGhost = active(myTeam);
  const newName = newGhost.name;

  renderBattle();

  const teamCls = `${team}-text`;
  narrate(`<b class="${teamCls}">${dougName}</b> — Caution! Swaps to sideline — <b>${newName}</b> enters (+1 die this roll)!`);
  showAbilityCallout('CAUTION!', 'var(--rare)', `${dougName} → sideline | ${newName} enters with +1 die!`, team);
  log(`<span class="log-ability">${dougName}</span> — Caution! Doug to sideline, ${newName} enters (+1 die this roll).`);

  setTimeout(() => {
    const entryCalloutCount = triggerEntry(myTeam, false);
    afterEntryWithJenkins(entryCalloutCount, () => {
      if (handleKOs()) return;
      // Apply +1 die bonus to the incoming ghost's roll.
      // During Duel Phase, B.preRoll doesn't exist yet (it's built later in
      // doPreRollSetup), so stash a promise that doPreRollSetup picks up.
      if (B.preRoll && B.preRoll[team]) {
        B.preRoll[team].count = Math.min(6, B.preRoll[team].count + 1);
      } else if (B.dougCautionDieBonus) {
        B.dougCautionDieBonus[team] = true;
      }
      renderBattle();
      btn.disabled = false;
      btn.classList.remove('locked');
      doTeamRoll(team, btn);
    });
  }, spd(1500));
}

// ============================================================
// JACKSON (50) — Regrow: post-roll spend 1 HP to reroll 1 die
// ============================================================
function checkJacksonRegrow(team, dice, continuation) {
  const f = active(B[team]);
  if (!f || f.id !== 50 || f.ko || f.hp < 2) {
    continuation();
    return;
  }
  B.jacksonPending = { team, dice: [...dice], continuation };
  document.getElementById('jacksonTitle').textContent = `Jackson — Regrow! (${f.hp} HP)`;
  document.getElementById('jacksonSub').textContent = `Spend 1 HP to reroll 1 die? (${f.hp} → ${f.hp - 1} HP)`;
  document.getElementById('jacksonDiePicker').style.display = 'none';
  document.getElementById('jacksonOverlay').classList.add('active');
}

function doJacksonChoice(choice) {
  const jp = B.jacksonPending;
  if (!jp) return;
  const { team, dice, continuation } = jp;
  const f = active(B[team]);
  if (choice === 'no' || !f || f.ko || f.hp < 2) {
    B.jacksonPending = null;
    document.getElementById('jacksonOverlay').classList.remove('active');
    narrate(`<b class="${team}-text">Jackson</b> holds HP — keeping dice as rolled.`);
    continuation();
    return;
  }
  // YES — show die picker with current dice values as buttons
  const diceButtons = document.getElementById('jacksonDiceButtons');
  diceButtons.innerHTML = dice.map((v, i) =>
    `<button onclick="pickJacksonDie(${i})" style="width:50px;height:50px;border-radius:10px;border:2px solid var(--uncommon);background:rgba(74,222,128,0.12);color:var(--uncommon);font-size:24px;font-weight:900;cursor:pointer;">${v}</button>`
  ).join('');
  document.getElementById('jacksonDiePicker').style.display = 'block';
}

function pickJacksonDie(idx) {
  const jp = B.jacksonPending;
  if (!jp) return;
  B.jacksonPending = null;
  const { team, continuation } = jp;
  const t = B[team];
  const f = active(t);
  document.getElementById('jacksonOverlay').classList.remove('active');
  if (!f || f.ko || f.hp < 2) { continuation(); return; }

  // Spend 1 HP
  const prevHp = f.hp;
  f.hp -= 1;
  // Mutate the preRoll dice array IN-PLACE so postRollDone's closure sees the change.
  // (Same pattern as Sonya v284 / Jeanie v285 / Dark Wing v285)
  // Creating a new array via [...B.redDice] does NOT work: postRollDone() closes over
  // B.preRoll.*.dice by reference, so its B.pendingResolve = { redDice, blueDice }
  // would silently overwrite Jackson's rerolled die before resolveRound ever sees it.
  const preRollDice = team === 'red' ? B.preRoll.red.dice : B.preRoll.blue.dice;
  const oldVal = preRollDice[idx];
  const newVal = Math.floor(Math.random() * 6) + 1;
  preRollDice[idx] = newVal;
  preRollDice.sort((a, b) => a - b);

  // Keep B.redDice/B.blueDice and B.pendingResolve in sync (pendingResolve may not exist yet)
  if (team === 'red') { B.redDice = preRollDice; if (B.pendingResolve) B.pendingResolve.redDice = preRollDice; }
  else               { B.blueDice = preRollDice; if (B.pendingResolve) B.pendingResolve.blueDice = preRollDice; }
  renderDice(B.redDice, B.blueDice);
  renderBattle();

  showAbilityCallout('REGROW!', 'var(--uncommon)', `${f.name} — die rerolled: ${oldVal} → ${newVal}! (${prevHp} → ${f.hp} HP)`, team);
  log(`<span class="log-ability">${f.name}</span> — Regrow! Spent 1 HP, rerolled die: ${oldVal} → ${newVal} (${prevHp} → ${f.hp} HP). New dice: [${preRollDice.join(', ')}]`);

  // Short pause for callout, then re-prompt if Jackson can go again
  setTimeout(() => {
    checkJacksonRegrow(team, [...preRollDice], continuation);
  }, 1200);
}

// ============================================================
// Jeanie (90) — Hidden Treasure: force opponent reroll (once per game)
// Fires post-roll (after Jackson), when Jeanie is on the sideline
// ============================================================
function checkJeanieHiddenTreasure(team, continuation) {
  // Team is Jeanie's team — they can force the OPPONENT to reroll
  if (!hasSideline(B[team], 90) || !B.jeanieUsed || B.jeanieUsed[team]) {
    continuation();
    return;
  }
  const jF = getSidelineGhost(B[team], 90);
  if (!jF || jF.ko) { continuation(); return; }

  const oppTeam = team === 'red' ? 'blue' : 'red';
  const oppF = active(B[oppTeam]);
  const oppLabel = oppTeam.charAt(0).toUpperCase() + oppTeam.slice(1);
  const oppDice = team === 'red' ? B.blueDice : B.redDice;

  B.jeaniePending = { team, oppTeam, continuation };
  document.getElementById('jeanieTitle').textContent = `Jeanie — Hidden Treasure! (${team.charAt(0).toUpperCase()+team.slice(1)})`;
  document.getElementById('jeanieSub').textContent = `Force ${oppLabel} (${oppF ? oppF.name : 'opponent'}) to reroll all ${oppDice.length} dice? (Once per game)`;
  document.getElementById('jeanieOverlay').classList.add('active');
}

function doJeanieChoice(choice) {
  const jp = B.jeaniePending;
  if (!jp) return;
  B.jeaniePending = null;
  document.getElementById('jeanieOverlay').classList.remove('active');

  const { team, oppTeam, continuation } = jp;
  const teamLabel = team.charAt(0).toUpperCase() + team.slice(1);
  const oppLabel = oppTeam.charAt(0).toUpperCase() + oppTeam.slice(1);

  if (choice === 'no') {
    narrate(`<b class="${team}-text">Jeanie</b> holds the treasure for now...`);
    continuation();
    return;
  }

  // YES — consume the once-per-game use
  B.jeanieUsed[team] = true;

  // Reroll ALL of the opponent's dice
  // Mutate the preRoll dice array IN-PLACE so the doPostRollAndResolve closure captures
  // the change. Creating a new array and assigning to B.pendingResolve does NOT work:
  // postRollDone() creates B.pendingResolve = { redDice, blueDice } using the closure
  // variables (which are B.preRoll.red/blue.dice) AFTER Jeanie runs, silently
  // overwriting any assignment to B.pendingResolve made here. (Same bug fixed for Sonya
  // in v284 and Dark Wing earlier.)
  const oldDice = oppTeam === 'red' ? [...B.preRoll.red.dice] : [...B.preRoll.blue.dice];
  const numDice = oldDice.length;
  const newDice = Array.from({length: numDice}, () => Math.floor(Math.random() * 6) + 1).sort((a,b)=>a-b);

  // Splice into the preRoll array in-place so the closure sees the new values
  const preRollDice = oppTeam === 'red' ? B.preRoll.red.dice : B.preRoll.blue.dice;
  preRollDice.splice(0, preRollDice.length, ...newDice);
  if (oppTeam === 'red') { B.redDice = preRollDice; if (B.pendingResolve) B.pendingResolve.redDice = preRollDice; }
  else                   { B.blueDice = preRollDice; if (B.pendingResolve) B.pendingResolve.blueDice = preRollDice; }
  renderDice(B.redDice, B.blueDice);
  renderBattle();

  const jF = getSidelineGhost(B[team], 90);
  showAbilityCallout('HIDDEN TREASURE!', 'var(--rare)',
    `${jF ? jF.name : 'Jeanie'} forces ${oppLabel} to reroll! [${oldDice.join(', ')}] → [${newDice.join(', ')}]`, team);
  log(`<span class="log-ability">Jeanie</span> — Hidden Treasure! ${teamLabel} forces ${oppLabel} to reroll: [${oldDice.join(', ')}] → [${newDice.join(', ')}].`);

  // Pause for callout splash then continue
  setTimeout(() => { continuation(); }, spd(1500));
}

// ============================================================
// SONYA (69) — Mesmerize: post-roll change one die to 2 (once per round, free)
// ============================================================
function checkSonyaMesmerize(team, continuation) {
  const f = active(B[team]);
  if (!f || f.id !== 69 || f.ko || (B.sonyaUsedThisRound && B.sonyaUsedThisRound[team])) {
    continuation();
    return;
  }
  B.sonyaPending = { team, continuation };
  document.getElementById('sonyaTitle').textContent = `Sonya — Mesmerize! (${team.charAt(0).toUpperCase()+team.slice(1)})`;
  document.getElementById('sonyaSub').textContent = `Change one of your dice to a 2? (Free — once per roll)`;
  document.getElementById('sonyaDiePicker').style.display = 'none';
  document.getElementById('sonyaOverlay').classList.add('active');
}

function doSonyaChoice(choice) {
  const sp = B.sonyaPending;
  if (!sp) return;
  const { team, continuation } = sp;
  if (choice === 'no') {
    B.sonyaPending = null;
    document.getElementById('sonyaOverlay').classList.remove('active');
    narrate(`<b class="${team}-text">Sonya</b> holds steady — keeping dice as rolled.`);
    continuation();
    return;
  }
  // YES — show die picker with current dice as clickable buttons
  const dice = team === 'red' ? [...B.redDice] : [...B.blueDice];
  const diceButtons = document.getElementById('sonyaDiceButtons');
  diceButtons.innerHTML = dice.map((v, i) =>
    `<button onclick="pickSonyaDie(${i})" style="width:50px;height:50px;border-radius:10px;border:2px solid #8b2fc9;background:rgba(139,47,201,0.15);color:#c084fc;font-size:24px;font-weight:900;cursor:pointer;">${v}</button>`
  ).join('');
  document.getElementById('sonyaDiePicker').style.display = 'block';
}

function pickSonyaDie(idx) {
  const sp = B.sonyaPending;
  if (!sp) return;
  B.sonyaPending = null;
  const { team, continuation } = sp;
  const f = active(B[team]);
  document.getElementById('sonyaOverlay').classList.remove('active');
  if (!f || f.ko) { continuation(); return; }

  // Mutate the preRoll dice array IN-PLACE so the doPostRollAndResolve closure captures
  // the change. Creating a new array via [...B.redDice] does NOT work: postRollDone()
  // captures B.preRoll.red.dice by reference, so when it later runs
  //   B.pendingResolve = { redDice, blueDice, ... }
  // it uses the original unmodified closure variable, silently discarding Sonya's edit.
  // Dark Wing uses the same in-place splice pattern (see doDarkWingChoice ~line 4386).
  const preRollDice = team === 'red' ? B.preRoll.red.dice : B.preRoll.blue.dice;
  const oldVal = preRollDice[idx];

  preRollDice[idx] = 2;
  preRollDice.sort((a, b) => a - b);
  if (B.sonyaUsedThisRound) B.sonyaUsedThisRound[team] = true;

  // Keep B.redDice/B.blueDice and B.pendingResolve in sync (pendingResolve may not exist yet)
  if (team === 'red') { B.redDice = preRollDice; if (B.pendingResolve) B.pendingResolve.redDice = preRollDice; }
  else               { B.blueDice = preRollDice; if (B.pendingResolve) B.pendingResolve.blueDice = preRollDice; }
  renderDice(B.redDice, B.blueDice);
  renderBattle();

  if (oldVal === 2) {
    showAbilityCallout('MESMERIZE!', 'var(--rare)', `${f.name} — die already showing 2, no change!`, team);
    log(`<span class="log-ability">${f.name}</span> — Mesmerize! Die already a 2, no change.`);
  } else {
    showAbilityCallout('MESMERIZE!', 'var(--rare)', `${f.name} — changed die: ${oldVal} → 2! New dice: [${preRollDice.join(', ')}]`, team);
    log(`<span class="log-ability">${f.name}</span> — Mesmerize! Changed die ${oldVal} → 2. Dice: [${preRollDice.join(', ')}]`);
  }

  setTimeout(() => { continuation(); }, 1200);
}

// ============================================================
// Dark Wing (76) — Precision: post-roll reroll all dice if not doubles
// Fires after drainAbilityQueue, before Jackson in the post-roll chain
// ============================================================
function checkDarkWingPrecision(team, continuation) {
  const f = active(B[team]);
  if (!f || f.id !== 76 || f.ko) { continuation(); return; }
  if (B.darkWingUsedThisGame && B.darkWingUsedThisGame[team]) { continuation(); return; }
  const dice = team === 'red' ? B.redDice : B.blueDice;
  // Skip the reroll offer if we already got doubles OR BETTER (triples/quads/penta).
  // Rerolling a triple is strictly worse — damage can only drop.
  if (classify(dice).damage >= 2) { continuation(); return; }
  // Offer reroll
  B.darkWingPending = { team, continuation };
  const tLabel = team.charAt(0).toUpperCase() + team.slice(1);
  document.getElementById('darkWingTitle').textContent = `Dark Wing — Precision! (${tLabel})`;
  document.getElementById('darkWingSub').textContent = `Rolled [${dice.join(', ')}] — no doubles. Reroll all ${dice.length} dice?`;
  document.getElementById('darkWingOverlay').classList.add('active');
}

function doDarkWingChoice(choice) {
  const dp = B.darkWingPending;
  if (!dp) return;
  B.darkWingPending = null;
  document.getElementById('darkWingOverlay').classList.remove('active');
  const { team, continuation } = dp;
  const f = active(B[team]);
  if (B.darkWingUsedThisGame) B.darkWingUsedThisGame[team] = true;

  if (choice === 'no' || !f || f.ko) {
    narrate(`<b class="${team}-text">Dark Wing</b> holds — keeping dice as rolled.`);
    continuation();
    return;
  }

  // YES — reroll all dice for this team
  const count = team === 'red' ? B.preRoll.red.count : B.preRoll.blue.count;
  const newDice = Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => a - b);

  // Mutate the preRoll dice array in-place so the postRollDone closure sees the new values
  const preRollDice = team === 'red' ? B.preRoll.red.dice : B.preRoll.blue.dice;
  preRollDice.splice(0, preRollDice.length, ...newDice);
  if (team === 'red') B.redDice = preRollDice;
  else B.blueDice = preRollDice;
  renderDice(B.redDice, B.blueDice);
  renderBattle();

  const rollType = classify(newDice).type;
  showAbilityCallout('PRECISION!', 'var(--rare)', `${f.name} — rerolled! [${newDice.join(', ')}]${rollType === 'doubles' ? ' 🎯 Doubles!' : ''}`, team);
  log(`<span class="log-ability">${f.name}</span> — Precision! Rerolled all dice → [${newDice.join(', ')}]`);

  setTimeout(() => { continuation(); }, 1200);
}

// ============================================================
// Drizzle (328) — Rain Dance: auto-reroll all 1s from both teams (free, no modal)
// Fires before Dark Wing in the post-roll chain.
// Uses in-place splice/mutation so the postRollDone closure captures the new values.
// ============================================================
// Tommy Salami (30) — Regulator: when Tommy rolls a 6, gain +1 bonus die rolled immediately.
// Chains as long as bonus dice keep rolling 6s. Fires BEFORE Drizzle in the post-roll chain.
// Interactive modal version: each 6 triggers a click-to-roll bonus die. Chains on 6s.
// B.tommyRegulatorBonus[team] stores total bonus dice added (used for callouts/log only).
function checkTommyRegulator(continuation) {
  const rF = active(B.red), bF = active(B.blue);
  const tommyTeamName = (rF && rF.id === 30 && !rF.ko) ? 'red' : (bF && bF.id === 30 && !bF.ko) ? 'blue' : null;
  // Reset bonus both teams each round regardless of whether Tommy is active
  if (B.tommyRegulatorBonus) { B.tommyRegulatorBonus.red = 0; B.tommyRegulatorBonus.blue = 0; }
  if (!tommyTeamName) { continuation(); return; }
  const tommyF = tommyTeamName === 'red' ? rF : bF;
  const tommyDice = B.preRoll[tommyTeamName].dice;
  if (!tommyDice || tommyDice.length === 0) { continuation(); return; }
  // Count 6s in Tommy's initial roll
  const initialSixes = tommyDice.filter(d => d === 6).length;
  if (initialSixes === 0) { continuation(); return; }

  // AutoPlay: silent auto-roll (AI doesn't need the modal)
  if (autoPlayRunning) {
    let newSixes = initialSixes;
    let totalBonus = 0;
    while (newSixes > 0) {
      const bonusDice = [];
      for (let i = 0; i < newSixes; i++) {
        bonusDice.push(Math.floor(Math.random() * 6) + 1);
      }
      tommyDice.push(...bonusDice);
      totalBonus += bonusDice.length;
      newSixes = bonusDice.filter(d => d === 6).length;
    }
    if (totalBonus > 0) {
      B.tommyRegulatorBonus[tommyTeamName] = totalBonus;
      tommyDice.sort((a, b) => a - b);
      if (tommyTeamName === 'red') { B.redDice = tommyDice; }
      else { B.blueDice = tommyDice; }
      renderDice(B.redDice, B.blueDice);
      renderBattle();
    }
    continuation();
    return;
  }

  // Interactive modal: chain one die at a time
  B.tommyChainPending = {
    team: tommyTeamName,
    dice: tommyDice,
    pendingSixes: initialSixes,
    totalBonus: 0,
    tommyF: tommyF,
    continuation: continuation
  };
  // Show modal
  const sub = document.getElementById('tommySub');
  sub.textContent = `You rolled ${initialSixes} six${initialSixes > 1 ? 'es' : ''}! Roll a bonus die!`;
  const dieEl = document.getElementById('tommyDieDisplay');
  dieEl.textContent = '🎲';
  const btn = document.getElementById('tommyRollBtn');
  btn.disabled = false;
  btn.textContent = '🎲 Roll the Bonus Die!';
  document.getElementById('tommyOverlay').classList.add('active');
}

function doTommyRoll() {
  const btn = document.getElementById('tommyRollBtn');
  if (!btn || btn.disabled) return;
  btn.disabled = true;

  const tp = B.tommyChainPending;
  if (!tp) return;

  const finalValue = Math.floor(Math.random() * 6) + 1;
  const dieEl = document.getElementById('tommyDieDisplay');

  // Shuffle animation: cycle through random values for ~600ms then land
  let ticks = 0;
  const totalTicks = 10;
  const tickMs = 60;
  const shuffle = setInterval(() => {
    ticks++;
    dieEl.textContent = String(Math.floor(Math.random() * 6) + 1);
    dieEl.style.transform = `rotate(${ticks * 36}deg)`;
    if (ticks >= totalTicks) {
      clearInterval(shuffle);
      dieEl.textContent = String(finalValue);
      dieEl.style.transform = 'rotate(0deg) scale(1.3)';
      setTimeout(() => { dieEl.style.transform = 'rotate(0deg) scale(1)'; }, 200);

      // Add die to Tommy's array
      tp.dice.push(finalValue);
      tp.totalBonus++;
      tp.pendingSixes--;

      if (finalValue === 6) {
        // Chain continues! This 6 adds another pending roll
        tp.pendingSixes++;
      }

      const sub = document.getElementById('tommySub');
      if (tp.pendingSixes > 0) {
        // More rolls to do
        if (finalValue === 6) {
          sub.innerHTML = `<b>ANOTHER 6!</b> +${tp.totalBonus} bonus dice so far! Keep rolling!`;
        } else {
          sub.innerHTML = `Rolled a ${finalValue}! +${tp.totalBonus} bonus dice so far! ${tp.pendingSixes} more to roll!`;
        }
        btn.disabled = false;
        btn.textContent = '🎲 Roll the Bonus Die!';
      } else {
        // Chain ends
        if (finalValue === 6) {
          sub.innerHTML = `<b>ANOTHER 6!</b> +${tp.totalBonus} bonus dice total! Chain complete!`;
        } else {
          sub.innerHTML = `Rolled a ${finalValue}! Chain ends! <b>+${tp.totalBonus} bonus dice total!</b>`;
        }
        // Close modal after delay and finalize
        setTimeout(() => { finishTommyChain(); }, 1000);
      }
    }
  }, tickMs);
}

function finishTommyChain() {
  const tp = B.tommyChainPending;
  if (!tp) return;
  B.tommyChainPending = null;
  document.getElementById('tommyOverlay').classList.remove('active');

  const { team, dice, totalBonus, tommyF, continuation } = tp;
  B.tommyRegulatorBonus[team] = totalBonus;
  dice.sort((a, b) => a - b);
  if (team === 'red') { B.redDice = dice; }
  else { B.blueDice = dice; }
  renderDice(B.redDice, B.blueDice);
  renderBattle();
  showAbilityCallout('REGULATOR!', 'var(--common)',
    `${tommyF.name} — Rolled 6s! +${totalBonus} bonus dice! Now rolling [${dice.join(', ')}]`, team);
  log(`<span class="log-ability">${tommyF.name}</span> — Regulator! Rolled 6s → +${totalBonus} bonus dice! [${dice.join(', ')}]`);
  setTimeout(() => { continuation(); }, 800);
}

// ============================================================
// Calvin & Anna (91) — Toboggan: post-KO voluntary swap
// ============================================================
function showTobogganModal(winTeamName, sidelineGhosts, continuation) {
  const teamColor = winTeamName === 'red' ? 'red-text' : 'blue-text';
  const banner = document.getElementById('tobogganBanner');
  if (banner) {
    banner.className = 'pm-who-banner ' + winTeamName;
    banner.textContent = '🛷 TOBOGGAN!';
  }

  // Build ghost portrait options (sideline ghosts to swap C&A with)
  const opts = document.getElementById('tobogganOptions');
  if (opts) {
    opts.innerHTML = sidelineGhosts.map(g => {
      const gd = ghostData(g.id);
      const realIdx = B[winTeamName].ghosts.indexOf(g);
      const hpRatio = g.hp / g.maxHp;
      const hpColor = hpRatio > 0.6 ? 'var(--hp-green)' : hpRatio > 0.3 ? 'var(--hp-yellow)' : 'var(--hp-red)';
      return `<div class="pressure-opt" onclick="doTobogganChoice(${realIdx})">
        ${gd.art ? `<img src="${gd.art}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;border:1px solid var(--${gd.rarity});">` : ''}
        <div>
          <div style="font-weight:700;">${g.name}</div>
          <div style="font-size:12px;color:var(--text2);"><span style="color:${hpColor};font-weight:700;">&hearts; ${g.hp}/${g.maxHp}</span> &middot; <span style="color:var(--moonstone);">${gd.ability}</span></div>
        </div>
      </div>`;
    }).join('');
  }

  // Store continuation for doTobogganChoice
  B.tobogganPending = { winTeamName, continuation };
  B.phase = 'ko-pause'; // keep roll buttons locked during modal
  document.getElementById('tobogganOverlay').classList.add('active');
}

function doTobogganChoice(idx) {
  const tp = B.tobogganPending;
  if (!tp) return;
  B.tobogganPending = null;
  document.getElementById('tobogganOverlay').classList.remove('active');

  const { winTeamName, continuation } = tp;
  const winTeam = B[winTeamName];
  const caGhost = active(winTeam); // Calvin & Anna (currently active)

  if (idx === -1) {
    // No — C&A stays in
    narrate(`<b class="${winTeamName}-text">Calvin &amp; Anna</b> stays in the fight!`);
    log(`Calvin & Anna — Toboggan declined. Staying in.`);
    continuation();
    return;
  }

  // YES — swap C&A to sideline, bring chosen ghost in
  const oldName = caGhost.name;
  const newGhost = winTeam.ghosts[idx];

  winTeam.activeIdx = idx;
  // Incoming ghost heals to full HP when entering from sideline
  newGhost.hp = newGhost.maxHp;
  renderBattle();

  const teamColor = winTeamName === 'red' ? 'red-text' : 'blue-text';
  narrate(`<b class="${teamColor}">${oldName}</b> — Toboggan! Slides to sideline — <b>${newGhost.name}</b> enters the fight!`);
  showAbilityCallout('TOBOGGAN!', 'var(--rare)', `${oldName} slides out — ${newGhost.name} enters!`, winTeamName);
  log(`<span class="log-ability">Calvin & Anna</span> — Toboggan! ${oldName} slides to sideline, ${newGhost.name} enters.`);

  // Fire entry effects for the newly-active ghost, then continue
  setTimeout(() => {
    const entryCount = triggerEntry(winTeam, false);
    afterEntryWithJenkins(entryCount, continuation);
  }, spd(1500));
}

// ============================================================
// Fang Outside (6) — Skillful Coward: post-win voluntary swap
// ============================================================
function showFangOutsideModal(winTeamName, sidelineGhosts, continuation) {
  const banner = document.getElementById('fangOutsideBanner');
  if (banner) {
    banner.className = 'pm-who-banner ' + winTeamName;
    banner.textContent = '💨 SKILLFUL COWARD!';
  }

  // Build ghost portrait options (sideline ghosts to swap Fang with)
  const opts = document.getElementById('fangOutsideOptions');
  if (opts) {
    opts.innerHTML = sidelineGhosts.map(g => {
      const gd = ghostData(g.id);
      const realIdx = B[winTeamName].ghosts.indexOf(g);
      const hpRatio = g.hp / g.maxHp;
      const hpColor = hpRatio > 0.6 ? 'var(--hp-green)' : hpRatio > 0.3 ? 'var(--hp-yellow)' : 'var(--hp-red)';
      return `<div class="pressure-opt" onclick="doFangOutsideChoice(${realIdx})">
        ${gd.art ? `<img src="${gd.art}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;border:1px solid var(--${gd.rarity});">` : ''}
        <div>
          <div style="font-weight:700;">${g.name}</div>
          <div style="font-size:12px;color:var(--text2);"><span style="color:${hpColor};font-weight:700;">&hearts; ${g.hp}/${g.maxHp}</span> &middot; <span style="color:var(--moonstone);">${gd.ability}</span></div>
        </div>
      </div>`;
    }).join('');
  }

  B.fangOutsidePending = { winTeamName, continuation };
  B.phase = 'ko-pause';
  document.getElementById('fangOutsideOverlay').classList.add('active');
}

function doFangOutsideChoice(idx) {
  const fp = B.fangOutsidePending;
  if (!fp) return;
  B.fangOutsidePending = null;
  document.getElementById('fangOutsideOverlay').classList.remove('active');

  const { winTeamName, continuation } = fp;
  const winTeam = B[winTeamName];
  const fangGhost = active(winTeam); // Fang Outside (currently active)

  if (idx === -1) {
    // No — Fang stays in
    narrate(`<b class="${winTeamName}-text">Fang Outside</b> holds their ground!`);
    log(`Fang Outside — Skillful Coward declined. Staying in.`);
    continuation();
    return;
  }

  // YES — swap Fang to sideline, bring chosen ghost in
  const oldName = fangGhost.name;
  const newGhost = winTeam.ghosts[idx];

  winTeam.activeIdx = idx;
  // Fang retains their HP on the sideline; incoming ghost retains their sideline HP
  renderBattle();

  const teamColor = winTeamName === 'red' ? 'red-text' : 'blue-text';
  narrate(`<b class="${teamColor}">${oldName}</b> — Skillful Coward! Slips to sideline — <b>${newGhost.name}</b> enters the fight!`);
  showAbilityCallout('SKILLFUL COWARD!', 'var(--common)', `${oldName} slips out — ${newGhost.name} enters!`, winTeamName);
  log(`<span class="log-ability">Fang Outside</span> — Skillful Coward! ${oldName} to sideline, ${newGhost.name} enters.`);

  // Fire entry effects for the newly-active ghost, then continue
  setTimeout(() => {
    const entryCount = triggerEntry(winTeam, false);
    afterEntryWithJenkins(entryCount, continuation);
  }, spd(1500));
}

// Fang Undercover (7) — Skilled Coward: arm choice handler
function doFangUndercoverArmChoice(choice) {
  const fp = B.fangUndercoverPending;
  if (!fp) return;
  B.fangUndercoverPending = null;
  document.getElementById('fangUndercoverArmOverlay').classList.remove('active');
  const { team, btn } = fp;
  if (choice === 'yes') {
    B.fangUndercoverArmed[team] = true;
    showAbilityCallout('SKILLED COWARD!', 'var(--common)', `Fang Undercover armed — dodge incoming damage this round!`, team);
    log(`<span class="log-ability">Fang Undercover</span> — Skilled Coward armed!`);
  } else {
    log(`Fang Undercover — Skilled Coward declined. Fighting straight.`);
  }
  btn.classList.remove('locked');
  btn.disabled = false;
  doTeamRoll(team);
}

// Fang Undercover (7) — Skilled Coward: ghost-picker modal after dodge triggers
function showFangUndercoverSwapModal(loseTeamName, sidelineGhosts, continuation) {
  const banner = document.getElementById('fangUndercoverSwapBanner');
  if (banner) {
    banner.className = `pm-who-banner ${loseTeamName}`;
    banner.textContent = '🥷 SKILLED COWARD!';
  }
  const opts = document.getElementById('fangUndercoverSwapOptions');
  const fuTeam = B[loseTeamName];
  opts.innerHTML = sidelineGhosts.map(g => {
    const realIdx = fuTeam.ghosts.indexOf(g);
    const gd = ghostData(g.id);
    const hpRatio = g.hp / g.maxHp;
    const hpColor = hpRatio > 0.6 ? 'var(--hp-green)' : hpRatio > 0.3 ? 'var(--hp-yellow)' : 'var(--hp-red)';
    return `<div class="pressure-opt" onclick="doFangUndercoverSwapChoice(${realIdx})">
      ${gd.art ? `<img src="${gd.art}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;border:1px solid var(--common);">` : ''}
      <div><div style="font-weight:700;">${g.name}</div>
      <div style="font-size:12px;color:var(--text2);"><span style="color:${hpColor};font-weight:700;">♥ ${g.hp}/${g.maxHp}</span> · <span style="color:var(--common);">${gd.ability}</span></div></div>
    </div>`;
  }).join('');
  B.fangUndercoverSwapData = { loseTeamName, continuation };
  document.getElementById('fangUndercoverSwapOverlay').classList.add('active');
}

function doFangUndercoverSwapChoice(idx) {
  const sd = B.fangUndercoverSwapData;
  if (!sd) return;
  B.fangUndercoverSwapData = null;
  document.getElementById('fangUndercoverSwapOverlay').classList.remove('active');
  const { loseTeamName, continuation } = sd;
  const fuTeam = B[loseTeamName];
  const fangGhost = active(fuTeam); // Fang Undercover (currently active, going to sideline)
  const oldName = fangGhost.name;
  const newGhost = fuTeam.ghosts[idx];
  const teamColor = loseTeamName === 'red' ? 'red-text' : 'blue-text';

  fuTeam.activeIdx = idx; // swap Fang to sideline, new ghost becomes active
  renderBattle();

  narrate(`<b class="${teamColor}">${oldName}</b> — Skilled Coward! Slips to sideline — <b>${newGhost.name}</b> enters the fight!`);
  showAbilityCallout('SKILLED COWARD!', 'var(--common)', `${oldName} slips out — ${newGhost.name} enters!`, loseTeamName);
  log(`<span class="log-ability">Fang Undercover</span> — Skilled Coward! ${oldName} to sideline, ${newGhost.name} enters.`);

  // Fire entry effects for the newly-active ghost, then continue
  setTimeout(() => {
    const entryCount = triggerEntry(fuTeam, false);
    afterEntryWithJenkins(entryCount, continuation);
  }, spd(1500));
}

// ============================================================
// Winston (15) — Scheme: post-doubles-win force opponent ghost swap
// ============================================================
function showWinstonSchemeModal(winTeamName, loseTeamName, sidelineGhosts, continuation) {
  const banner = document.getElementById('winstonSchemeBanner');
  if (banner) {
    banner.className = `pm-who-banner ${winTeamName}`;
    banner.textContent = '♟️ SCHEME!';
  }

  const loseTeam = B[loseTeamName];
  const opts = document.getElementById('winstonSchemeOptions');
  if (opts) {
    opts.innerHTML = sidelineGhosts.map(g => {
      const gd = ghostData(g.id);
      const realIdx = loseTeam.ghosts.indexOf(g);
      const hpRatio = g.hp / g.maxHp;
      const hpColor = hpRatio > 0.6 ? 'var(--hp-green)' : hpRatio > 0.3 ? 'var(--hp-yellow)' : 'var(--hp-red)';
      return `<div class="pressure-opt" onclick="doWinstonSchemeChoice(${realIdx})">
        ${gd.art ? `<img src="${gd.art}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;border:1px solid var(--${gd.rarity});">` : ''}
        <div>
          <div style="font-weight:700;">${g.name}</div>
          <div style="font-size:12px;color:var(--text2);"><span style="color:${hpColor};font-weight:700;">&hearts; ${g.hp}/${g.maxHp}</span> &middot; <span style="color:var(--${gd.rarity});">${gd.ability}</span></div>
        </div>
      </div>`;
    }).join('');
  }

  B.winstonSchemePending = { winTeamName, loseTeamName, continuation };
  B.phase = 'ko-pause';
  document.getElementById('winstonSchemeOverlay').classList.add('active');
}

function doWinstonSchemeChoice(idx) {
  const sp = B.winstonSchemePending;
  if (!sp) return;
  B.winstonSchemePending = null;
  document.getElementById('winstonSchemeOverlay').classList.remove('active');

  const { winTeamName, loseTeamName, continuation } = sp;
  const loseTeam = B[loseTeamName];
  const winTeamColor = winTeamName === 'red' ? 'red-text' : 'blue-text';
  const loseTeamColor = loseTeamName === 'red' ? 'red-text' : 'blue-text';

  // Winston always gains +2 dice next roll on win (whether swap or skip)
  B.winstonDiceBonus[winTeamName] = (B.winstonDiceBonus[winTeamName] || 0) + 2;

  if (idx === -1) {
    // Skip — keep current opponent ghost, still get dice
    narrate(`<b class="${winTeamColor}">Winston</b> — Scheme skipped. +2 dice next roll!`);
    log(`Winston — Scheme declined. <span class="log-ms">+2 dice next roll!</span>`);
    continuation();
    return;
  }

  // Force opponent swap: active ghost goes to sideline, chosen sideline ghost enters
  const oldGhost = active(loseTeam);
  const oldName = oldGhost.name;
  const newGhost = loseTeam.ghosts[idx];

  loseTeam.activeIdx = idx; // old active goes to sideline, chosen ghost becomes active
  renderBattle();

  narrate(`<b class="${winTeamColor}">Winston</b> — Scheme! <b class="${loseTeamColor}">${oldName}</b> forced to sideline — <b class="${loseTeamColor}">${newGhost.name}</b> enters!`);
  showAbilityCallout('SCHEME!', 'var(--common)', `${oldName} forced out — ${newGhost.name} enters!`, winTeamName);
  log(`<span class="log-ability">Winston</span> — Scheme! Forced ${oldName} to sideline, ${newGhost.name} enters. <span class="log-ms">+2 dice next roll!</span>`);

  // Fire entry effects for the newly-active enemy ghost, then continue
  setTimeout(() => {
    const entryCount = triggerEntry(loseTeam, false);
    afterEntryWithJenkins(entryCount, continuation);
  }, spd(1500));
}

// ============================================================
// Tyson (365) — Hop: choose enemy sideline ghost to disable
// ============================================================
function showTysonHopPicker(winTeamName, loseTeamName, sidelineGhosts, continuation) {
  const banner = document.getElementById('tysonHopBanner');
  if (banner) {
    banner.className = `pm-who-banner ${winTeamName}`;
    banner.textContent = '🔥 HOP!';
  }
  const loseTeam = B[loseTeamName];
  const disabled = B.tysonDisabled[loseTeamName];
  const opts = document.getElementById('tysonHopOptions');
  if (opts) {
    opts.innerHTML = sidelineGhosts.filter(g => {
      const idx = loseTeam.ghosts.indexOf(g);
      return !disabled.includes(idx); // don't show already-disabled ghosts
    }).map(g => {
      const gd = ghostData(g.id);
      const realIdx = loseTeam.ghosts.indexOf(g);
      return `<div class="pressure-opt" onclick="doTysonHopChoice('${loseTeamName}', ${realIdx})">
        ${gd.art ? `<img src="${gd.art}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;border:1px solid var(--${gd.rarity});">` : ''}
        <div>
          <div style="font-weight:700;">${g.name}</div>
          <div style="font-size:12px;color:var(--text2);"><span style="color:var(--${gd.rarity});">${gd.ability}: ${gd.abilityDesc ? gd.abilityDesc.substring(0, 60) : ''}...</span></div>
        </div>
      </div>`;
    }).join('');
  }
  B.tysonPickerPending = { winTeamName, loseTeamName, continuation };
  B.phase = 'ko-pause';
  document.getElementById('tysonHopOverlay').classList.add('active');
}

function doTysonHopChoice(loseTeamName, ghostIdx) {
  const tp = B.tysonPickerPending;
  if (!tp) return;
  B.tysonPickerPending = null;
  document.getElementById('tysonHopOverlay').classList.remove('active');

  const { winTeamName, continuation } = tp;
  const loseTeam = B[loseTeamName];
  const targetGhost = loseTeam.ghosts[ghostIdx];
  const gd = ghostData(targetGhost.id);

  B.tysonDisabled[loseTeamName].push(ghostIdx);

  const winColor = winTeamName === 'red' ? 'red-text' : 'blue-text';
  narrate(`<b class="${winColor}">Tyson</b> — Hop! <b>${targetGhost.name}</b>'s sideline ability disabled!`);
  showAbilityCallout('HOP!', 'var(--common)', `${targetGhost.name}'s ${gd.ability} disabled!`, winTeamName);
  log(`<span class="log-ability">Tyson</span> — Hop! ${targetGhost.name}'s sideline ability (${gd.ability}) disabled until it enters play.`);

  continuation();
}

// ============================================================
// Laura (79) — Catchy Tune: die picker after each roll
// ============================================================
function showCatchyTunePicker(teamName, dice, continuation) {
  const banner = document.getElementById('catchyTuneBanner');
  if (banner) {
    banner.className = `pm-who-banner ${teamName}`;
    banner.textContent = '🎵 CATCHY TUNE!';
  }
  const opts = document.getElementById('catchyTuneDiceOptions');
  opts.innerHTML = dice.map((d, i) =>
    `<button onclick="doCatchyTuneChoice('${teamName}', ${d}, ${JSON.stringify(dice)}, this)" style="width:60px;height:60px;font-size:28px;font-weight:bold;border-radius:12px;border:2px solid rgba(255,255,255,0.3);background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;cursor:pointer;transition:transform 0.1s;">${d}</button>`
  ).join('');
  B.catchyTunePending = { teamName, continuation };
  B.phase = 'ko-pause';
  document.getElementById('catchyTuneOverlay').classList.add('active');
}

function doCatchyTuneChoice(teamName, dieValue, allDice, btnEl) {
  const ct = B.catchyTunePending;
  if (!ct) return;
  B.catchyTunePending = null;
  document.getElementById('catchyTuneOverlay').classList.remove('active');
  B.catchyTuneLockedDie[teamName] = dieValue;
  const teamColor = teamName === 'red' ? 'red-text' : 'blue-text';
  narrate(`<b class="${teamColor}">Catchy Tune</b> — locked a <b>${dieValue}</b> for next roll!`);
  log(`<span class="log-ability">Laura</span> — Catchy Tune! Locked die: <span class="log-ms">${dieValue}</span> for next roll.`);
  showAbilityCallout('LOCKED!', 'var(--rare)', `Die ${dieValue} locked for next roll!`, teamName);
  ct.continuation();
}

// ============================================================
// Gus (31) — Gale Force Picker: losing player chooses which sideline ghost to swap in
// ============================================================
function showGaleForcePickerModal(winTeamName, loseTeamName, sidelineGhosts, continuation) {
  const banner = document.getElementById('galeForcePickerBanner');
  if (banner) {
    banner.className = `pm-who-banner ${loseTeamName}`;
    banner.textContent = '💨 GALE FORCE!';
  }
  const loseTeam = B[loseTeamName];
  const opts = document.getElementById('galeForcePickerOptions');
  if (opts) {
    opts.innerHTML = sidelineGhosts.map(g => {
      const gd = ghostData(g.id);
      const realIdx = loseTeam.ghosts.indexOf(g);
      const hpRatio = g.hp / g.maxHp;
      const hpColor = hpRatio > 0.6 ? 'var(--hp-green)' : hpRatio > 0.3 ? 'var(--hp-yellow)' : 'var(--hp-red)';
      return `<div class="pressure-opt" onclick="doGaleForcePickerChoice(${realIdx})">
        ${gd.art ? `<img src="${gd.art}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;border:1px solid var(--${gd.rarity});">` : ''}
        <div>
          <div style="font-weight:700;">${g.name}</div>
          <div style="font-size:12px;color:var(--text2);"><span style="color:${hpColor};font-weight:700;">&hearts; ${g.hp}/${g.maxHp}</span> &middot; <span style="color:var(--${gd.rarity});">${gd.ability}</span></div>
        </div>
      </div>`;
    }).join('');
  }
  B.galeForcePicker = { winTeamName, loseTeamName, continuation, dmg: B._galeForceDmg || 0 };
  B.phase = 'ko-pause';
  document.getElementById('galeForcePickerOverlay').classList.add('active');
}

function doGaleForcePickerChoice(idx) {
  const gfp = B.galeForcePicker;
  if (!gfp) return;
  B.galeForcePicker = null;
  document.getElementById('galeForcePickerOverlay').classList.remove('active');

  const { winTeamName, loseTeamName, continuation, dmg } = gfp;
  const loseTeam = B[loseTeamName];
  const winTeamColor = winTeamName === 'red' ? 'red-text' : 'blue-text';
  const loseTeamColor = loseTeamName === 'red' ? 'red-text' : 'blue-text';

  const oldName = active(loseTeam).name;
  const newGhost = loseTeam.ghosts[idx];

  loseTeam.activeIdx = idx;

  // Apply stashed damage to the NEW ghost
  if (dmg > 0) {
    newGhost.hp = Math.max(0, newGhost.hp - dmg);
    if (newGhost.hp <= 0) { newGhost.hp = 0; newGhost.ko = true; newGhost.killedBy = 31; }
    playDamageSfx(dmg);
  }
  renderBattle();

  narrate(`<b class="${winTeamColor}">Gus</b> — Gale Force! <b class="${loseTeamColor}">${newGhost.name}</b> blown in — takes ${dmg} damage!${newGhost.ko ? ' <b>KO!</b>' : ''}`);
  log(`<span class="log-ability">Gus</span> — Gale Force! ${oldName} forced to bench — ${newGhost.name} enters and takes <span class="log-dmg">${dmg} damage!</span>${newGhost.ko ? ' <span class="log-ko">KO!</span>' : ' ' + newGhost.hp + ' HP left'}`);

  // Fire entry effects for the newly-active ghost, then continue
  setTimeout(() => {
    const entryCount = triggerEntry(loseTeam, false);
    afterEntryWithJenkins(entryCount, continuation);
  }, spd(1500));
}

// ============================================================
// TWO-BUTTON ROLL SYSTEM — each side rolls independently
// ============================================================
function rollReady(team) {
  if (!B) return;
  // Live PvP routing:
  // - Blue player clicking Blue Roll → send "ready" signal, don't run engine
  // - Red player clicking Red Roll → runs normally (Red's engine)
  // - Red's engine rolling Blue (from Firebase listener) → allowed through
  if (LIVE_PVP) {
    if (PVP_SIDE === 'blue' && team === 'blue') {
      // v725: Blue runs pre-roll setup locally so pre-roll modals fire (Timber, Romy, Tyler, etc.)
      if (B.phase === 'ready') {
        doPreRollSetup();
        if (B.phase !== 'ready') return; // pre-roll interrupted
        B.phase = 'rolling';
        renderBattle();
      }
      // Blue player: send committed resources + ready signal to Red's engine
      const blueActive = active(B.blue);
      pvpBlueResolvedLocally = false; // v725: reset for this round
      PVP_GAME_REF.child('blueReady').set({
        ready: true,
        committed: B.committed.blue,
        resources: B.blue.resources,
        activeHp: blueActive ? blueActive.hp : 0,
        ts: Date.now()
      });
      const btn2 = document.getElementById('rollBlueBtn');
      if (btn2) { btn2.disabled = true; btn2.textContent = 'Waiting...'; }
      // v723: show local rolling animation so Blue feels responsive
      const blueDiceCount = B.preRoll ? B.preRoll.blue.count : (ghostData(blueActive.id)?.dice ?? 3);
      showRolling('blue', blueDiceCount);
      playSfx('sfxDiceRoll');
      narrate(`<b class="blue-text">${blueActive.name}</b> rolls...`);
      return;
    }
    if (PVP_SIDE === 'blue' && team === 'red') {
      // Blue client trying to roll Red — block
      return;
    }
    // v726: Red waits for Blue to be ready before generating dice.
    // This ensures Blue has time to commit resources (Ice Shards, Fire, etc.)
    if (PVP_SIDE === 'red' && team === 'red') {
      // Run pre-roll setup (abilities, modals) but DON'T generate dice yet
      if (B.phase === 'ready') {
        const cc = doPreRollSetup();
        if (B.phase !== 'ready') return;
        B.phase = 'rolling';
        renderBattle();
        // Send Red's ready signal with committed resources
        const preDelay = cc > 0 ? cc * spd(1500) : 0;
        setTimeout(() => {
          const redActive = active(B.red);
          PVP_GAME_REF.child('redReady').set({
            ready: true,
            committed: B.committed.red,
            resources: B.red.resources,
            activeHp: redActive ? redActive.hp : 0,
            ts: Date.now()
          });
          pvpRedReady = true;
          const btn = document.getElementById('rollRedBtn');
          if (btn) { btn.disabled = true; btn.textContent = 'Waiting...'; }
          narrate(`<b class="red-text">${redActive.name}</b> is ready...`);
          // If Blue is already ready, generate dice now
          pvpTryGenerateDice();
        }, preDelay);
      }
      return; // Don't fall through to normal engine
    }
    // Red's engine rolling Blue (from pvpTryGenerateDice) → allowed through
  }
  // v733: async MP — when Red clicks READY, signal the AI to roll Blue after a short delay
  if (MP_MODE && !LIVE_PVP && team === 'red') {
    pvpRedClickedRoll = true;
  }
  // Duel Phase locks rolls until both players click Done
  if (B.phase === 'duel-1' || B.phase === 'duel-2') return;
  if (B.phase !== 'ready' && B.phase !== 'rolling') return;
  const btn = document.getElementById(team === 'red' ? 'rollRedBtn' : 'rollBlueBtn');
  if (btn.classList.contains('locked')) return;

  // Remove pulse and reset AFK timer on click
  document.querySelectorAll('#rollRedBtn, #rollBlueBtn').forEach(b => b.classList.remove('pulse'));
  resetAfkTimer();

  // First click: do pre-roll setup (abilities, dice counts)
  // calloutCount is HOISTED here (let, not const) so the modal-delay checks AFTER
  // this if-block can read it on BOTH first-click (we set it from doPreRollSetup)
  // and second-click paths (we compute the remaining wait from preRollCalloutEndTime).
  // Without this hoist, second-team clicks throw ReferenceError when any of the
  // post-`if` modal checks (Bogey, Gus, Hunt, Doug, Fang Undercover, etc.) reference
  // calloutCount — exact same bug class as the v305 teamLabel freeze.
  let calloutCount = 0;
  let preRollDelay = 0;
  if (B.phase === 'ready') {
    calloutCount = doPreRollSetup();
    if (B.phase !== 'ready') return; // pre-roll interrupted — KO-swap, game-over, or other phase change
    B.phase = 'rolling';
    // Re-render immediately so consumed status tags (Retribution, etc.) clear from fighter cards
    renderBattle();
    // If pre-roll callouts were queued (via setTimeout), wait for all of them to fully play
    // before dice roll — last callout starts at (N-1)*1500 and lasts ~1400ms, so N*1500 is exact
    if (calloutCount > 0) {
      preRollDelay = calloutCount * spd(1500);
      // Store the absolute end-time so the second team's click can also wait for callouts to finish
      B.preRollCalloutEndTime = Date.now() + calloutCount * spd(1500);
    }

    // Timber choice modal — pause rolling until opponent picks
    if (B.timberPending) {
      const tp = B.timberPending;
      const timberDelay = (tp.preRollCalloutCount || 0) * 1500;
      // Lock BOTH roll buttons — the modal must be resolved before anyone rolls,
      // regardless of which team clicked first. If we only locked the clicking button
      // and the opponent-calculated button, they could be the same element (when the
      // opponent clicks first), leaving Timber's team free to roll during the modal.
      const rBtn = document.getElementById('rollRedBtn');
      const bBtn = document.getElementById('rollBlueBtn');
      if (rBtn) { rBtn.classList.add('locked'); rBtn.disabled = true; }
      if (bBtn) { bBtn.classList.add('locked'); bBtn.disabled = true; }
      // Stash the NON-clicking button so doTimberChoice can unlock it after the choice
      // (the clicking button stays locked — doTeamRoll fires immediately after the choice)
      const otherBtnId = team === 'red' ? 'rollBlueBtn' : 'rollRedBtn';
      tp._oppBtn = document.getElementById(otherBtnId); // stash for cleanup in doTimberChoice
      setTimeout(() => {
        showTimberModal(tp, () => {
          // Resume rolling after choice
          setTimeout(() => { doTeamRoll(team, btn); }, 0);
        });
      }, timberDelay);
      return;
    }

    // Ryder (456) — Toll choice modal — pause rolling until opponent picks
    if (B.riderPending) {
      const tp = B.riderPending;
      const riderDelay = (tp.preRollCalloutCount || 0) * 1500;
      const rBtn = document.getElementById('rollRedBtn');
      const bBtn = document.getElementById('rollBlueBtn');
      if (rBtn) { rBtn.classList.add('locked'); rBtn.disabled = true; }
      if (bBtn) { bBtn.classList.add('locked'); bBtn.disabled = true; }
      const otherBtnId = team === 'red' ? 'rollBlueBtn' : 'rollRedBtn';
      tp._oppBtn = document.getElementById(otherBtnId);
      setTimeout(() => {
        showRiderModal(tp, () => {
          setTimeout(() => { doTeamRoll(team, btn); }, 0);
        });
      }, riderDelay);
      return;
    }

    // Piper (107) — Slick Coat: negate Romy's Valley Guardian prediction modal
    // If Romy is about to predict but the enemy has Piper active, suppress the modal
    // by setting romyPrediction to -1 (sentinel; no die value equals -1 → +3 bonus never fires).
    {
      const romyCheckG = active(B[team]);
      if (romyCheckG && romyCheckG.id === 114 && !romyCheckG.ko &&
          B.romyPrediction && B.romyPrediction[team] == null) {
        const piperOppName = team === 'red' ? 'blue' : 'red';
        const piperG = active(B[piperOppName]);
        if (piperG && piperG.id === 107 && !piperG.ko) {
          B.romyPrediction[team] = -1; // blocked — no die matches -1
          log(`<span class="log-ability">Piper</span> — Slick Coat! <span class="log-ability">${romyCheckG.name}'s</span> Valley Guardian prediction is negated!`);
          // Fall through — Romy modal block below sees romyPrediction != null and skips
        }
      }
    }

    // Romy (114) — Valley Guardian: show prediction modal before rolling
    // Only intercepts when Romy's OWN team clicks their roll button.
    const romyActive = active(B[team]);
    if (romyActive && romyActive.id === 114 && !romyActive.ko &&
        B.romyPrediction && B.romyPrediction[team] == null) {
      // Lock only Romy's button — opponent can still roll independently
      btn.classList.add('locked');
      btn.disabled = true;
      B.romyPending = { team, btn, ghostName: romyActive.name };
      const romyDelay = (calloutCount > 0) ? calloutCount * 1500 : 0;
      setTimeout(() => {
        document.getElementById('romyOverlay').classList.add('active');
      }, romyDelay);
      return;
    }

    // Toby (97) — Pure Heart: now handled by pre-roll ability button (useTobyButton)
    // If Toby hasn't declared yet, auto-set to false (skip) so roll proceeds.
    if (active(B[team])?.id === 97 && !active(B[team]).ko &&
        B.pureHeartDeclared && B.pureHeartDeclared[team] === null) {
      B.pureHeartDeclared[team] = false; // default to not declaring if button wasn't pressed
    }

    // Tyler (105) — Heating Up: opt-in 2 HP trade for +1 die
    // Only offered when Tyler has ≥ 3 HP (prevents self-KO via trade)
    // v429: skip if already decided in Duel Phase (tylerDecidedThisRound flag, Raditz pattern)
    const tylerActiveG = active(B[team]);
    if (tylerActiveG && tylerActiveG.id === 105 && !tylerActiveG.ko && tylerActiveG.hp >= 3 &&
        !(B.tylerDecidedThisRound && B.tylerDecidedThisRound[team])) {
      btn.classList.add('locked');
      btn.disabled = true;
      B.tylerPending = { team, btn };
      const tylerDelay = (calloutCount > 0) ? calloutCount * 1500 : 0;
      setTimeout(() => {
        const tF = active(B[team]);
        document.getElementById('tylerSub').textContent = `Spend 2 HP for +1 die this roll? (${tF.hp} HP → ${tF.hp - 2} HP)`;
        document.getElementById('tylerOverlay').classList.add('active');
      }, tylerDelay);
      return;
    }

    // Chow (414) — Secret Ingredient: spend 1 Healing Seed for +2 dice (interactive button)
    {
      const chowG = active(B[team]);
      if (chowG && chowG.id === 414 && !chowG.ko && B.chowDecided && !B.chowDecided[team] &&
          B[team].resources && B[team].resources.healingSeed >= 1) {
        btn.classList.add('locked');
        btn.disabled = true;
        B.chowPending = { team, btn };
        const chowDelay = (calloutCount > 0) ? calloutCount * 1500 : 0;
        setTimeout(() => {
          const cF = active(B[team]);
          document.getElementById('chowSub').innerHTML =
            `Discard 1 🌱 Healing Seed for +2 dice this roll?<br>` +
            `(Seeds: ${B[team].resources.healingSeed} | Current bonus dice: +${B.chowExtraDie[team] || 0})`;
          document.getElementById('chowOverlay').classList.add('active');
        }, chowDelay);
        return;
      }
    }

    // Zork (463) — Stoke: now handled by pre-roll ability button (useZorkStoke)

    // Miyoshi (454) — Bonzai!: now handled by pre-roll ability button (useBonzaiButton)

    // Castle Gardener (442) — Cultivate: now handled by pre-roll ability button (useCultivate)

    // Forest Spirit (446) — Hex: now handled by pre-roll button (useHex)

    // Nick & Knack (409) — Knick Knack: steal 1 resource from opponent → +1 HP + 2 Burn
    {
      const nnG = active(B[team]);
      const oppTeamNN = team === 'red' ? 'blue' : 'red';
      if (nnG && nnG.id === 409 && !nnG.ko && B.nickKnackDecided && !B.nickKnackDecided[team]) {
        const oppRes = B[oppTeamNN].resources;
        const resTypes = ['ice', 'fire', 'surge', 'luckyStone', 'moonstone', 'healingSeed'];
        const available = resTypes.filter(r => (oppRes[r] || 0) > 0);
        if (available.length > 0) {
          btn.classList.add('locked');
          btn.disabled = true;
          B.nickKnackPending = { team, btn, oppTeam: oppTeamNN };
          const nnDelay = (calloutCount > 0) ? calloutCount * 1500 : 0;
          setTimeout(() => {
            showNickKnackPicker(team, oppTeamNN);
          }, nnDelay);
          return;
        } else {
          B.nickKnackDecided[team] = true;
        }
      }
    }

    // Guardian Fairy (99) — Wish: now reactive (post-damage modal), no pre-roll standby needed

    // Eloise (85) — Change of Heart: spend 1 Ice Shard to swap HP with enemy before rolling
    // Offered once per round when Eloise is active and team has ≥1 Ice Shard.
    {
      const eloiseG = active(B[team]);
      const oppTeam = team === 'red' ? 'blue' : 'red';
      const oppF = active(B[oppTeam]);
      if (eloiseG && eloiseG.id === 85 && !eloiseG.ko &&
          B.eloiseUsedThisRound && !B.eloiseUsedThisRound[team] &&
          B[team].resources && B[team].resources.ice >= 1 && oppF && !oppF.ko) {
        btn.classList.add('locked');
        btn.disabled = true;
        B.eloisePending = { team, btn };
        const eloiseDelay = (calloutCount > 0) ? calloutCount * 1500 : 0;
        setTimeout(() => {
          document.getElementById('eloiseSub').innerHTML =
            `Spend 1 ❄️ Ice Shard to swap HP?<br>` +
            `<b>Your HP:</b> ${eloiseG.hp} → <b>${oppF.hp}</b> &nbsp;|&nbsp; ` +
            `<b>Enemy HP:</b> ${oppF.hp} → <b>${eloiseG.hp}</b>`;
          document.getElementById('eloiseOverlay').classList.add('active');
        }, eloiseDelay);
        return;
      }
    }

    // Mallow (89) — Dozy Cozy: spend 2 Sacred Fire for +3 HP + 2 Burn to active ghost (sideline)
    // Offered once per round when Mallow is on the sideline and team has ≥2 Sacred Fire.
    if (hasSideline(B[team], 89) && B.mallowDecided && !B.mallowDecided[team] &&
        B[team].resources && B[team].resources.fire >= 2) {
      btn.classList.add('locked');
      btn.disabled = true;
      B.mallowPending = { team, btn };
      const mallowDelay = (calloutCount > 0) ? calloutCount * 1500 : 0;
      setTimeout(() => {
        const mF = active(B[team]);
        const mallowHpAfter = mF ? mF.hp + 3 : '?';
        const mallowOver = mF && (mF.hp + 3 > mF.maxHp) ? ' <i>· overclocks!</i>' : '';
        document.getElementById('mallowSub').innerHTML =
          `Spend 2 🔥 Sacred Fire to give <b>${mF ? mF.name : 'your ghost'}</b> +3 HP and gain 1 🔥 Burn?<br>` +
          `(${mF ? mF.hp : '?'} HP → ${mallowHpAfter} HP${mallowOver} &nbsp;|&nbsp; 🔥 ${B[team].resources.fire} → ${B[team].resources.fire - 2})`;
        document.getElementById('mallowOverlay').classList.add('active');
      }, mallowDelay);
      return;
    }

    // Boo Brothers (17) — Teamwork: trade 1 die for 1 HP before rolling
    // Offered each round when Boo Brothers is active and has ≥ 2 dice.
    // NOTE: NO hp < maxHp gate — trading at full HP overclocks (v294 Hard Rule #9).
    // Do NOT re-add a maxHp cap here. Overclock is intentional by design.
    // v429: skip if already decided in Duel Phase (booTeamworkDecidedThisRound, Raditz pattern)
    {
      const booG = active(B[team]);
      if (booG && booG.id === 17 && !booG.ko && B.preRoll && B.preRoll[team] &&
          B.preRoll[team].count >= 2 &&
          !(B.booTeamworkDecidedThisRound && B.booTeamworkDecidedThisRound[team])) {
        btn.classList.add('locked');
        btn.disabled = true;
        B.booPending = { team, btn };
        const booDelay = (calloutCount > 0) ? calloutCount * 1500 : 0;
        setTimeout(() => {
          const bF = active(B[team]);
          document.getElementById('booSub').innerHTML =
            `Remove 1 die to gain +1 HP?<br>` +
            `<b>${B.preRoll[team].count}</b> dice → <b>${B.preRoll[team].count - 1}</b> dice` +
            `&nbsp;|&nbsp;<b>${bF.hp}</b> HP → <b>${bF.hp + 1}</b> HP${bF.hp + 1 > bF.maxHp ? ' <i>· overclocks!</i>' : ''}`;
          document.getElementById('booOverlay').classList.add('active');
        }, booDelay);
        return;
      }
    }
  }

  // Second-click path: pre-roll setup already ran, but pre-roll callouts may still
  // be in-flight. Compute remaining callout count from B.preRollCalloutEndTime so
  // the modal delays below still wait for them to clear.
  if (B.preRollCalloutEndTime && Date.now() < B.preRollCalloutEndTime) {
    calloutCount = Math.max(0, Math.ceil((B.preRollCalloutEndTime - Date.now()) / 1500));
  }

  // Miyoshi (454) — Bonzai!: now handled by pre-roll ability button (useBonzaiButton)

  // Gus (31) — Gale Force: now reactive post-win (no pre-roll modal)

  {
    // Raditz (62) — Hunt: one-time forced-swap on first roll after entry
    // Fires when Raditz's team clicks Roll for the first time after Raditz enters play.
    if (B.raditzHuntReady && B.raditzHuntReady[team]) {
      // Lock BOTH buttons — swap must complete before either team rolls
      const rBtn2 = document.getElementById('rollRedBtn');
      const bBtn2 = document.getElementById('rollBlueBtn');
      if (rBtn2) { rBtn2.classList.add('locked'); rBtn2.disabled = true; }
      if (bBtn2) { bBtn2.classList.add('locked'); bBtn2.disabled = true; }
      const oppBtn2 = team === 'red' ? bBtn2 : rBtn2;
      B.raditzHuntPending = { team, btn, oppBtn: oppBtn2 };
      const huntDelay = (calloutCount > 0) ? calloutCount * 1500 : 0;
      setTimeout(() => {
        const huntEnemyName = team === 'red' ? 'blue' : 'red';
        const huntActiveEnemy = active(B[huntEnemyName]);
        document.getElementById('raditzHuntSub').textContent =
          `Force ${huntActiveEnemy ? huntActiveEnemy.name : 'the opponent'} to the sideline and bring in a different ghost?`;
        document.getElementById('raditzHuntOverlay').classList.add('active');
      }, huntDelay);
      return;
    }
  }

    // Doug (63) — Caution: once-per-game pre-roll swap out for +1 die to incoming ghost
    {
      const dougG = active(B[team]);
      if (dougG && dougG.id === 63 && !dougG.ko &&
          B.dougCautionUsed && !B.dougCautionUsed[team]) {
        const mySideline = B[team].ghosts.filter((g, i) => i !== B[team].activeIdx && !g.ko);
        if (mySideline.length > 0) {
          btn.classList.add('locked');
          btn.disabled = true;
          B.dougCautionPending = { team, btn };
          const dougDelay = (calloutCount > 0) ? calloutCount * 1500 : 0;
          setTimeout(() => {
            const teamCls = team === 'red' ? 'red' : 'blue';
            document.getElementById('dougCautionBanner').className = `pm-who-banner ${teamCls}`;
            document.getElementById('dougCautionSub').textContent =
              `Switch Doug to the sideline and bring in a sideline ghost? They gain +1 die this roll. (Once per game)`;
            const dougOptions = document.getElementById('dougCautionOptions');
            dougOptions.innerHTML = mySideline.map(g => {
              const realIdx = B[team].ghosts.indexOf(g);
              const gd = ghostData(g.id);
              const hpRatio = g.hp / g.maxHp;
              const hpColor = hpRatio > 0.6 ? 'var(--hp-green)' : hpRatio > 0.3 ? 'var(--hp-yellow)' : 'var(--hp-red)';
              return `<div class="pressure-opt" onclick="doDougCautionSwap(${realIdx})">
                ${gd.art ? `<img src="${gd.art}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;border:1px solid var(--rare);">` : ''}
                <div><div style="font-weight:700;">${g.name}</div>
                <div style="font-size:12px;color:var(--text2);"><span style="color:${hpColor};font-weight:700;">♥ ${g.hp}/${g.maxHp}</span> · <span style="color:var(--moonstone);">${gd.ability}</span></div></div>
              </div>`;
            }).join('');
            document.getElementById('dougCautionOverlay').classList.add('active');
          }, dougDelay);
          return;
        }
      }
    }

  // Fang Undercover (7) — Skilled Coward: arm dodge before rolling
  // Offered each round when Fang Undercover is active with alive sideline ghosts.
  {
    const fuG = active(B[team]);
    const fuHasSideline = B[team].ghosts.some((g, i) => i !== B[team].activeIdx && !g.ko);
    if (fuG && fuG.id === 7 && !fuG.ko && fuHasSideline &&
        B.fangUndercoverArmed && !B.fangUndercoverArmed[team]) {
      btn.classList.add('locked');
      btn.disabled = true;
      B.fangUndercoverPending = { team, btn };
      const fuDelay = (calloutCount > 0) ? calloutCount * 1500 : 0;
      setTimeout(() => {
        const teamCls = team === 'red' ? 'red' : 'blue';
        document.getElementById('fangUndercoverArmSub').textContent =
          `Arm the dodge? If Fang takes damage this round, they swap to the sideline and negate all damage.`;
        document.getElementById('fangUndercoverArmOverlay').classList.add('active');
      }, fuDelay);
      return;
    }
  }

  // Lock this button
  btn.classList.add('locked');
  btn.disabled = true;

  // Second-click guard: if the first click started pre-roll callouts that are still playing,
  // wait for whatever time is left so the second team's roll animation doesn't stomp them.
  // (First-click path already has the full delay computed above; this only matters when
  //  preRollDelay is still 0, i.e. when this is the second team's click.)
  if (preRollDelay === 0 && B.preRollCalloutEndTime) {
    preRollDelay = Math.max(0, B.preRollCalloutEndTime - Date.now());
  }

  // Delay roll if pre-roll ability just showed a callout
  setTimeout(() => { doTeamRoll(team, btn); }, preRollDelay);
}

function doTeamRoll(team, btn) {
  // Guard: B or preRoll may have been cleared (round-end, raid sync, etc.)
  if (!B || !B.preRoll || !B.preRoll[team]) return;

  // Duel Phase intercept: if a modal primer resolved during Duel Phase, the
  // choice handler calls doTeamRoll() as its "proceed" signal. We catch that
  // here, re-enable the Ready button (so the player can commit resources),
  // and return without rolling. The player clicks Ready when they're done.
  if (B && (B.phase === 'duel-1' || B.phase === 'duel-2') && B.duelActiveTeam === team) {
    const doneId = team === 'red' ? 'duelDoneRedBtn' : 'duelDoneBlueBtn';
    const doneBtn = document.getElementById(doneId);
    if (doneBtn) { doneBtn.disabled = false; doneBtn.classList.remove('locked'); }
    return;
  }
  // Roll this team's dice (weighted for cinematic clutch moments)
  let diceCount = B.preRoll[team].count;
  const override = B.preRoll[team].override;
  // Laura (79) — Catchy Tune: if unlocked, one die is locked from last roll
  const lockedDie = (B.catchyTuneUnlocked && B.catchyTuneUnlocked[team] && B.catchyTuneLockedDie && B.catchyTuneLockedDie[team] !== null && diceCount > 0) ? B.catchyTuneLockedDie[team] : null;
  const rollCount = lockedDie !== null ? Math.max(0, diceCount - 1) : diceCount;
  const dice = override ? [1,2,3] : weightedRoll(team, rollCount);
  if (lockedDie !== null && !override) dice.push(lockedDie);
  dice.sort((a,b) => a-b);
  B.preRoll[team].dice = dice;
  B.lastRollDiceCount[team] = diceCount; // Frederick (27) — track for next round
  if (team === 'red') { B.redDice = dice; } else { B.blueDice = dice; }

  if (lockedDie !== null && !override) log(`<span class="log-ability">Laura</span> — Catchy Tune! Locked die: <span class="log-ms">${lockedDie}</span> carried over.`);
  if (override) log(`<span class="log-ability">Bouril</span> — Slumber! Auto-rolled [1,2,3]!`);

  // Animate: show rolling then reveal
  const f = active(B[team]);
  const cls = team === 'red' ? 'red-text' : 'blue-text';
  showRolling(team, diceCount);
  if (diceCount > 0) playSfx('sfxDiceRoll');
  if (diceCount === 0) {
    narrate(`<b class="${cls}">${f.name}</b> doesn't roll — <b class="gold">Stone Form!</b>`);
  } else {
    narrate(`<b class="${cls}">${f.name}</b> rolls...`);
  }

  setTimeout(() => {
    revealDice(team, dice);
    const roll = classify(dice);
    const tl = typeLabel(roll.type);
    narrate(`<b class="${cls}">${f.name}</b>&nbsp;rolled [${dice.join(', ')}]${tl ? '&nbsp;<b class="gold">'+tl+'</b>' : ''}`);
    if (isTripleOrBetter(roll.type)) showTriplesEffect(team, roll.type);

    // Check if both have rolled — guard against double-resolution
    if (B.preRoll && B.preRoll.red.dice && B.preRoll.blue.dice && !B.preRoll.resolved) {
      B.preRoll.resolved = true;
      // Use 1800ms if EITHER team rolled triples/quads/penta — the banner for the
      // first roller fires at T+700ms and lasts 1700ms (1200ms show + 500ms fade),
      // so resolution must not start until T+700+1800=T+2500ms regardless of which
      // team triggered the resolution check.
      const otherTeam = team === 'red' ? 'blue' : 'red';
      const otherRoll = classify(B.preRoll[otherTeam].dice);
      const eitherTripled = isTripleOrBetter(roll.type) || isTripleOrBetter(otherRoll.type);
      setTimeout(() => {
        doPostRollAndResolve(B.preRoll.red.dice, B.preRoll.blue.dice);
      }, spd(eitherTripled ? 1800 : 1400));
    }
  }, spd(700));
}

// ============================================================
// DUEL PHASE — sequenced pre-roll commits
// "Loser of previous exchange goes first. Round 1 uses lower max HP (underdog)."
// Dice rolls remain simultaneous; only pre-roll DECISIONS are ordered.
// ============================================================
const _RARITY_RANK = { 'common':0, 'uncommon':1, 'rare':2, 'ghost-rare':3, 'legendary':4 };

// -----------------------------------------------------------------------
// hasAnyDecision(team) — returns true if the team has anything to do
// during their Duel Phase turn: a modal primer that needs input, or a
// committable resource tile. Used by computeDuelPriority (skip-if-both-
// empty) and enterDuelPhase/_runDuelTeamTurn (auto-advance single team).
// v429: Tyler (105) and Boo Brothers (17) now included — Approach B decouples
//       their gates from B.preRoll (uses ghostData base dice ?? 3 instead).
// -----------------------------------------------------------------------
function hasAnyDecision(team) {
  if (!B) return false;
  const f = active(B[team]);
  if (!f || f.ko) return false;
  const oppTeamName = team === 'red' ? 'blue' : 'red';
  const oppF = active(B[oppTeamName]);
  const r = B[team].resources;
  const c = B.committed && B.committed[team];

  // — Modal primers —
  // Romy (114) — Valley Guardian
  if (f.id === 114 && B.romyPrediction && B.romyPrediction[team] == null) return true;
  // Toby (97) — Pure Heart
  if (f.id === 97 && B.pureHeartDeclared && B.pureHeartDeclared[team] === null &&
      !(B.pureHeartScheduledKO && B.pureHeartScheduledKO[team])) return true;
  // Guardian Fairy (99) — Wish: now reactive (post-damage), no pre-roll check needed
  // Eloise (85) — Change of Heart
  if (f.id === 85 && B.eloiseUsedThisRound && !B.eloiseUsedThisRound[team] &&
      r && r.ice >= 1 && oppF && !oppF.ko) return true;
  // Mallow (89) — Dozy Cozy (sideline) — costs 2 Sacred Fire
  if (hasSideline(B[team], 89) && B.mallowDecided && !B.mallowDecided[team] &&
      r && r.fire >= 2) return true;
  // Gus (31) — Gale Force: now reactive post-win (no pre-roll check)
  // Raditz (62) — Hunt
  if (B.raditzHuntReady && B.raditzHuntReady[team]) return true;
  // Doug (63) — Caution
  if (f.id === 63 && B.dougCautionUsed && !B.dougCautionUsed[team] &&
      B[team].ghosts.some((g, i) => i !== B[team].activeIdx && !g.ko)) return true;
  // Fang Undercover (7) — Skilled Coward
  if (f.id === 7 && B.fangUndercoverArmed && !B.fangUndercoverArmed[team] &&
      B[team].ghosts.some((g, i) => i !== B[team].activeIdx && !g.ko)) return true;
  // Tyler (105) — Heating Up: spend 2 HP for +1 die
  if (f.id === 105 && !f.ko && f.hp >= 3 &&
      !(B.tylerDecidedThisRound && B.tylerDecidedThisRound[team])) return true;
  // Boo Brothers (17) — Teamwork: trade 1 die for +1 HP (gate uses base dice, no preRoll dep)
  if (f.id === 17 && !f.ko && (ghostData(17)?.dice ?? 3) >= 2 &&
      !(B.booTeamworkDecidedThisRound && B.booTeamworkDecidedThisRound[team])) return true;

  // — Committable resource tiles (interactive during Duel Phase via isPreRollActive) —
  if (r && c) {
    if ((r.ice + c.ice) > 0) return true;
    if ((r.fire + c.fire) > 0) return true;
    if ((r.surge + c.surge) > 0) return true;
  }
  // Healing Seed (usable when HP below max)
  if (r && r.healingSeed > 0 && f.hp < f.maxHp) return true;
  // Happy Crystal (208) — sacrifice for Moonstone
  if (f.id === 208 && !f.ko) return true;
  // Aunt Susan (309) — commit seeds for damage or heal
  if (f.id === 309 && !f.ko && r &&
      (r.healingSeed > 0 || (c && (c.auntSusan > 0 || c.auntSusanHeal > 0)))) return true;

  return false;
}

// -----------------------------------------------------------------------
// _installDuelPhasePreRollWrapper — single-use doPreRollSetup wrapper that
// applies deferred die adjustments from Duel Phase Tyler/Boo Brothers choices.
// Tyler's +1 die and Boo Brothers' -1 die are captured via getter/setter
// interceptors on the pre-initialized B.preRoll[team] objects, then stored
// in B.tylerHeatUpDieBonus / B.booTeamworkDieDebt. This wrapper applies them
// AFTER doPreRollSetup initializes the real B.preRoll. Idempotent — safe to
// call from both Tyler and Boo Brothers sections in the same round.
// -----------------------------------------------------------------------
function _installDuelPhasePreRollWrapper() {
  if (window._duelDiePatchInstalled) return; // already installed this round
  window._duelDiePatchInstalled = true;
  const _origDPS = doPreRollSetup;
  window.doPreRollSetup = function() {
    window.doPreRollSetup = _origDPS;        // restore before calling (single-use)
    window._duelDiePatchInstalled = false;
    const result = _origDPS.apply(this, arguments);
    // Apply deferred die adjustments AFTER doPreRollSetup has initialized B.preRoll
    if (B && B.preRoll) {
      ['red', 'blue'].forEach(t => {
        if (!B.preRoll[t]) return;
        if (B.tylerHeatUpDieBonus && B.tylerHeatUpDieBonus[t] > 0) {
          B.preRoll[t].count = Math.min(6, B.preRoll[t].count + B.tylerHeatUpDieBonus[t]);
          B.tylerHeatUpDieBonus[t] = 0;
        }
        if (B.booTeamworkDieDebt && B.booTeamworkDieDebt[t] > 0) {
          B.preRoll[t].count = Math.max(1, B.preRoll[t].count - B.booTeamworkDieDebt[t]);
          B.booTeamworkDieDebt[t] = 0;
        }
      });
    }
    return result;
  };
}

// -----------------------------------------------------------------------
// openDuelPhasePrimers(team) — opens the first applicable modal primer
// for the team's active fighter during their Duel Phase turn. Disables
// the "✓ Ready" button until the player resolves the primer.
// Returns true if a primer was opened; false if nothing to open.
// The choice handlers call doTeamRoll() on resolution — the doTeamRoll
// Duel Phase intercept (below) catches that call and re-enables Ready
// so the player can commit resources before clicking Ready manually.
// -----------------------------------------------------------------------
function openDuelPhasePrimers(team) {
  if (!B) return false;
  const f = active(B[team]);
  if (!f || f.ko) return false;
  const oppTeamName = team === 'red' ? 'blue' : 'red';
  const doneId = team === 'red' ? 'duelDoneRedBtn' : 'duelDoneBlueBtn';
  const doneBtn = document.getElementById(doneId);
  const disableDone = () => { if (doneBtn) { doneBtn.disabled = true; doneBtn.classList.add('locked'); } };

  // — ROMY (114) — Valley Guardian: predict a die value before rolling
  if (f.id === 114 && B.romyPrediction && B.romyPrediction[team] == null) {
    // Check Piper (107) — Slick Coat suppresses the prediction
    const piperOppG = active(B[oppTeamName]);
    if (piperOppG && piperOppG.id === 107 && !piperOppG.ko) {
      B.romyPrediction[team] = -1; // sentinel: -1 never matches any die
      narrate(`<b class="${oppTeamName}-text">Piper</b> — Slick Coat! Romy's Valley Guardian is negated!`);
      log(`<span class="log-ability">Piper</span> — Slick Coat! Romy's Valley Guardian prediction negated in Duel Phase.`);
      // fall through to next primer check
    } else {
      disableDone();
      B.romyPending = { team, btn: doneBtn, ghostName: f.name };
      document.getElementById('romyOverlay').classList.add('active');
      return true;
    }
  }

  // — TOBY (97) — Pure Heart: now handled by pre-roll ability button (useTobyButton)
  // No modal intercept needed — button is in ability panel

  // — CHOW (414) — Secret Ingredient: spend 1 Healing Seed for +2 dice (Duel Phase)
  if (f.id === 414 && !f.ko && B.chowDecided && !B.chowDecided[team] &&
      B[team].resources && B[team].resources.healingSeed >= 1) {
    disableDone();
    B.chowPending = { team, btn: doneBtn };
    document.getElementById('chowSub').innerHTML =
      `Discard 1 🌱 Healing Seed for +2 dice this roll?<br>` +
      `(Seeds: ${B[team].resources.healingSeed} | Current bonus dice: +${B.chowExtraDie[team] || 0})`;
    document.getElementById('chowOverlay').classList.add('active');
    return true;
  }

  // — ZORK (463) — Stoke: now handled by pre-roll ability button (useZorkStoke)

  // — Miyoshi (454) — Bonzai!: now handled by pre-roll ability button (useBonzaiButton)

  // — CASTLE GARDENER (442) — Cultivate: now handled by pre-roll ability button (useCultivate)

  // — FOREST SPIRIT (446) — Hex: now handled by pre-roll button (useHex)

  // — NICK & KNACK (409) — Knick Knack: steal 1 resource → +1 HP + 2 Burn (Duel Phase)
  if (f.id === 409 && !f.ko && B.nickKnackDecided && !B.nickKnackDecided[team]) {
    const nnOppRes = B[oppTeamName].resources;
    const nnResTypes = ['ice', 'fire', 'surge', 'luckyStone', 'moonstone', 'healingSeed'];
    const nnAvailable = nnResTypes.filter(r => (nnOppRes[r] || 0) > 0);
    if (nnAvailable.length > 0) {
      disableDone();
      B.nickKnackPending = { team, btn: doneBtn, oppTeam: oppTeamName };
      showNickKnackPicker(team, oppTeamName);
      return true;
    } else {
      B.nickKnackDecided[team] = true;
    }
  }

  // Guardian Fairy (99) — Wish: now reactive (post-damage modal), no pre-roll standby

  // — ELOISE (85) — Change of Heart: spend 1 Ice Shard to swap HP
  {
    const oppF = active(B[oppTeamName]);
    if (f.id === 85 && B.eloiseUsedThisRound && !B.eloiseUsedThisRound[team] &&
        B[team].resources && B[team].resources.ice >= 1 && oppF && !oppF.ko) {
      disableDone();
      B.eloisePending = { team, btn: doneBtn };
      document.getElementById('eloiseSub').innerHTML =
        `Spend 1 ❄️ Ice Shard to swap HP?<br>` +
        `<b>Your HP:</b> ${f.hp} → <b>${oppF.hp}</b> &nbsp;|&nbsp; ` +
        `<b>Enemy HP:</b> ${oppF.hp} → <b>${f.hp}</b>`;
      document.getElementById('eloiseOverlay').classList.add('active');
      return true;
    }
  }

  // — MALLOW (89) — Dozy Cozy: spend 2 Sacred Fire for +3 HP + 2 Burn (sideline)
  if (hasSideline(B[team], 89) && B.mallowDecided && !B.mallowDecided[team] &&
      B[team].resources && B[team].resources.fire >= 2) {
    disableDone();
    B.mallowPending = { team, btn: doneBtn };
    const mallowHpAfter = f.hp + 3;
    const mallowOver = (f.hp + 3 > f.maxHp) ? ' <i>· overclocks!</i>' : '';
    document.getElementById('mallowSub').innerHTML =
      `Spend 2 🔥 Sacred Fire to give <b>${f.name}</b> +3 HP and gain 1 🔥 Burn?<br>` +
      `(${f.hp} HP → ${mallowHpAfter} HP${mallowOver} &nbsp;|&nbsp; 🔥 ${B[team].resources.fire} → ${B[team].resources.fire - 2})`;
    document.getElementById('mallowOverlay').classList.add('active');
    return true;
  }

  // — GUS (31) — Gale Force: now reactive post-win (no pre-roll Done check)

  // — RADITZ (62) — Hunt: force opponent's active ghost to the sideline (one-time on entry)
  if (B.raditzHuntReady && B.raditzHuntReady[team]) {
    B.raditzHuntReady[team] = false; // clear NOW so rollReady never double-fires this
    const enemy = B[oppTeamName];
    const huntTargetActive = active(enemy);
    const aliveSideline = enemy.ghosts.filter((g, i) => i !== enemy.activeIdx && !g.ko);

    // Auto-skip: opponent has no alive sideline ghosts
    if (aliveSideline.length === 0) {
      narrate(`<b class="${team}-text">Raditz</b> — Hunt primed, but the opponent has no sideline ghosts to swap in.`);
      log(`Raditz — Hunt skipped in Duel Phase: opponent has no alive sideline.`);
      return false; // auto-skipped, no primer opened
    }

    disableDone();
    B.raditzHuntPending = { team, btn: doneBtn, oppBtn: null };
    document.getElementById('raditzHuntSub').textContent =
      `Force ${huntTargetActive ? huntTargetActive.name : 'the opponent'} to the sideline and bring in a different ghost?`;
    document.getElementById('raditzHuntOverlay').classList.add('active');
    return true;
  }

  // — DOUG (63) — Caution: once-per-game pre-roll self-swap for +1 die to incoming ghost
  if (f.id === 63 && B.dougCautionUsed && !B.dougCautionUsed[team]) {
    const mySideline = B[team].ghosts.filter((g, i) => i !== B[team].activeIdx && !g.ko);
    if (mySideline.length > 0) {
      disableDone();
      B.dougCautionPending = { team, btn: doneBtn };
      const teamCls = team === 'red' ? 'red' : 'blue';
      document.getElementById('dougCautionBanner').className = `pm-who-banner ${teamCls}`;
      document.getElementById('dougCautionSub').textContent =
        `Switch Doug to the sideline and bring in a sideline ghost? They gain +1 die this roll. (Once per game)`;
      const dougOptions = document.getElementById('dougCautionOptions');
      dougOptions.innerHTML = mySideline.map(g => {
        const realIdx = B[team].ghosts.indexOf(g);
        const gd = ghostData(g.id);
        const hpRatio = g.hp / g.maxHp;
        const hpColor = hpRatio > 0.6 ? 'var(--hp-green)' : hpRatio > 0.3 ? 'var(--hp-yellow)' : 'var(--hp-red)';
        return `<div class="pressure-opt" onclick="doDougCautionSwap(${realIdx})">
          ${gd.art ? `<img src="${gd.art}" style="width:50px;height:50px;border-radius:6px;object-fit:cover;border:1px solid var(--${gd.rarity});">` : ''}
          <div><div style="font-weight:700;">${g.name}</div>
          <div style="font-size:12px;color:var(--text2);"><span style="color:${hpColor};font-weight:700;">♥ ${g.hp}/${g.maxHp}</span> · <span style="color:var(--moonstone);">${gd.ability}</span></div></div>
        </div>`;
      }).join('');
      document.getElementById('dougCautionOverlay').classList.add('active');
      return true;
    }
  }

  // — FANG UNDERCOVER (7) — Skilled Coward: arm dodge before rolling
  if (f.id === 7 && B.fangUndercoverArmed && !B.fangUndercoverArmed[team] &&
      B[team].ghosts.some((g, i) => i !== B[team].activeIdx && !g.ko)) {
    disableDone();
    B.fangUndercoverPending = { team, btn: doneBtn };
    document.getElementById('fangUndercoverArmSub').textContent =
      `Arm the dodge? If Fang takes damage this round, they swap to the sideline and negate all damage.`;
    document.getElementById('fangUndercoverArmOverlay').classList.add('active');
    return true;
  }

  // — TYLER (105) — Heating Up: spend 2 HP for +1 die (Approach B: gate uses hp, not preRoll)
  // Raditz pattern: set tylerDecidedThisRound BEFORE opening so rollReady skips after Duel Phase.
  // Pre-initialize B.preRoll[team] with a getter/setter interceptor so doTylerChoice's count
  // write is captured into B.tylerHeatUpDieBonus; the _installDuelPhasePreRollWrapper applies
  // it after doPreRollSetup initializes the real B.preRoll object.
  if (f.id === 105 && !f.ko && f.hp >= 3 &&
      !(B.tylerDecidedThisRound && B.tylerDecidedThisRound[team])) {
    if (B.tylerDecidedThisRound) B.tylerDecidedThisRound[team] = true; // clear — Raditz pattern
    if (!B.preRoll) B.preRoll = { red: null, blue: null };
    if (!B.preRoll[team]) {
      const _tylerTeam = team; // capture for setter closure
      const _baseDiceT = ghostData(f.id)?.dice ?? 3;
      B.preRoll[team] = {
        _count: _baseDiceT, override: false, dice: null,
        get count() { return this._count; },
        set count(v) {
          const delta = v - this._count;
          if (delta > 0 && B && B.tylerHeatUpDieBonus)
            B.tylerHeatUpDieBonus[_tylerTeam] = (B.tylerHeatUpDieBonus[_tylerTeam] || 0) + delta;
          this._count = v;
        }
      };
      _installDuelPhasePreRollWrapper();
    }
    disableDone();
    B.tylerPending = { team, btn: doneBtn };
    document.getElementById('tylerSub').textContent =
      `Spend 2 HP for +1 die this roll? (${f.hp} HP → ${f.hp - 2} HP)`;
    document.getElementById('tylerOverlay').classList.add('active');
    return true;
  }

  // — BOO BROTHERS (17) — Teamwork: trade 1 die for +1 HP (Approach B: gate uses base dice)
  // Auto-skip if the ghost's base dice count < 2 — can't trade a die they don't have.
  // Raditz pattern: set booTeamworkDecidedThisRound BEFORE opening so rollReady skips.
  // Pre-initialize B.preRoll[team] interceptor; doBooChoice's count write is captured
  // into B.booTeamworkDieDebt; the _installDuelPhasePreRollWrapper applies it post-setup.
  {
    const _baseDiceBoo = ghostData(17)?.dice ?? 3;
    if (f.id === 17 && !f.ko &&
        !(B.booTeamworkDecidedThisRound && B.booTeamworkDecidedThisRound[team])) {
      if (B.booTeamworkDecidedThisRound) B.booTeamworkDecidedThisRound[team] = true; // Raditz pattern
      if (_baseDiceBoo < 2) {
        // Auto-skip: no dice to trade
        narrate(`<b class="${team}-text">Boo Brothers</b> — Teamwork ready, but base dice (${_baseDiceBoo}) too low to trade.`);
        log(`Boo Brothers — Teamwork auto-skipped in Duel Phase: base dice ${_baseDiceBoo} < 2.`);
        return false;
      }
      if (!B.preRoll) B.preRoll = { red: null, blue: null };
      if (!B.preRoll[team]) {
        const _booTeam = team; // capture for setter closure
        B.preRoll[team] = {
          _count: _baseDiceBoo, override: false, dice: null,
          get count() { return this._count; },
          set count(v) {
            const delta = this._count - v;
            if (delta > 0 && B && B.booTeamworkDieDebt)
              B.booTeamworkDieDebt[_booTeam] = (B.booTeamworkDieDebt[_booTeam] || 0) + delta;
            this._count = v;
          }
        };
        _installDuelPhasePreRollWrapper();
      }
      disableDone();
      B.booPending = { team, btn: doneBtn };
      document.getElementById('booSub').innerHTML =
        `Remove 1 die to gain +1 HP?<br>` +
        `<b>${_baseDiceBoo}</b> dice → <b>${_baseDiceBoo - 1}</b> dice` +
        `&nbsp;|&nbsp;<b>${f.hp}</b> HP → <b>${f.hp + 1}</b> HP${f.hp + 1 > f.maxHp ? ' <i>· overclocks!</i>' : ''}`;
      document.getElementById('booOverlay').classList.add('active');
      return true;
    }
  }

  return false; // no primer matched
}

// -----------------------------------------------------------------------
// _runDuelTeamTurn(team) — called at the start of each team's Duel Phase
// slot (from enterDuelPhase and from the duel-1→duel-2 transition).
// 1. Opens any applicable primer modal (disables Ready until resolved).
// 2. If no primer AND no decisions at all → auto-advance after a short beat.
// -----------------------------------------------------------------------
function _runDuelTeamTurn(team) {
  if (!B) return;
  if (openDuelPhasePrimers(team)) return; // primer opened — Ready disabled, wait for player
  if (!hasAnyDecision(team)) {
    // Nothing to do — auto-fire Ready after a narrator beat
    const f = active(B[team]);
    const name = f ? f.name : team;
    setTimeout(() => {
      narrate(`<b class="${team}-text">${name}</b> has nothing to commit — rolling!`);
      setTimeout(() => { duelPhaseReady(team); }, spd(350));
    }, 250);
  }
  // else: team has resources to commit — leave Ready enabled, wait for manual click
}

function computeDuelPriority() {
  if (!B || B.duelPhaseMode === false) return null;
  // Skip Duel Phase entirely when neither team has any decisions to make —
  // saves ~3s per round and avoids pointless Ready clicks (Issue #2).
  if (!hasAnyDecision('red') && !hasAnyDecision('blue')) return null;
  // Unified rule: "previous round loser goes first."
  // Round 1 has no previous loser, so it uses lower max HP (the underdog strikes).
  // Ties of any kind (R1 HP tie, mirror match, R2+ tie round) fall through to
  // B.duelLastLoser — which is NULL in round 1 (→ simultaneous) but STICKY in R2+
  // (the previous NON-TIE loser carries forward through tie rounds).
  const rF = active(B.red);
  const bF = active(B.blue);
  if (!rF || !bF || rF.ko || bF.ko) return B.duelLastLoser || null;
  const isRoundOne = (B.round === 1);
  if (isRoundOne && rF.id !== bF.id && rF.maxHp !== bF.maxHp) {
    return rF.maxHp < bF.maxHp ? 'red' : 'blue';
  }
  return B.duelLastLoser || null;
}

function isPreRollActive(team) {
  if (!B) return false;
  if (B.phase === 'ready') return true;
  if (B.phase === 'duel-1' || B.phase === 'duel-2') {
    return B.duelActiveTeam === team;
  }
  return false;
}

function enterDuelPhase(priority) {
  if (!B) return;
  B.phase = 'duel-1';
  B.duelPriority = priority;
  B.duelActiveTeam = priority;
  // Lock both roll buttons — rolls don't unlock until both players click Done
  const r = document.getElementById('rollRedBtn');
  const b = document.getElementById('rollBlueBtn');
  if (r) { r.classList.add('locked'); r.classList.remove('pulse'); r.disabled = true; }
  if (b) { b.classList.add('locked'); b.classList.remove('pulse'); b.disabled = true; }
  const activeF = active(B[priority]);
  const activeName = activeF ? activeF.name : priority;
  const oppName = priority === 'red' ? 'blue' : 'red';
  // Narrator framing: R1 is "underdog", R2+ is "wounded"
  const isR1 = (B.round === 1);
  const msg = isR1
    ? `<b class="${priority}-text">${activeName}</b> stands as the underdog — first move!`
    : `<b class="${priority}-text">${activeName}</b> licks their wounds — first move this round!`;
  narrate(msg);
  log(`<span class="log-ability">DUEL PHASE</span> — ${activeName} (${priority}) moves first.`);
  renderBattle();
  renderDuelUI();
  _runDuelTeamTurn(priority);
}

function duelPhaseReady(team) {
  if (!B) return;
  if (B.phase !== 'duel-1' && B.phase !== 'duel-2') return;
  if (team !== B.duelActiveTeam) return;
  if (B.phase === 'duel-1') {
    // Advance to phase 2 — opponent's turn
    const nextTeam = team === 'red' ? 'blue' : 'red';
    B.phase = 'duel-2';
    B.duelActiveTeam = nextTeam;
    const nextActive = active(B[nextTeam]);
    const nextName = nextActive ? nextActive.name : nextTeam;
    narrate(`<b class="${nextTeam}-text">${nextName}</b> — your response!`);
    log(`<span class="log-ability">DUEL PHASE</span> — ${nextName} (${nextTeam}) responds.`);
    renderBattle();
    renderDuelUI();
    _runDuelTeamTurn(nextTeam);
  } else {
    // End Duel Phase — unlock rolls for simultaneous resolution
    endDuelPhase();
  }
}

function endDuelPhase() {
  if (!B) return;
  B.phase = 'ready';
  B.duelActiveTeam = null;
  narrate(`<b class="gold">Both ready!</b> Roll the dice!`);
  resetRollButtons();
  renderBattle();
  renderDuelUI();
}

// startNextRound — called from every "round ends" site instead of the direct
// B.phase = 'ready'; resetRollButtons(); pattern. Checks for Duel Phase priority
// and either enters the Duel Phase or falls back to simultaneous ready.
function startNextRound() {
  if (!B) return;

  // Laura (79) — Catchy Tune: if unlocked, show die picker before next round
  if (!B.catchyTuneUnlocked) B.catchyTuneUnlocked = { red: false, blue: false };
  if (!B.catchyTuneLockedDie) B.catchyTuneLockedDie = { red: null, blue: null };
  if (!B.lastRollDiceCount) B.lastRollDiceCount = { red: 3, blue: 3 };
  if (!B.tysonDisabled) B.tysonDisabled = { red: [], blue: [] };
  if (!B.winstonDiceBonus) B.winstonDiceBonus = { red: 0, blue: 0 };
  const ctRed = B.catchyTuneUnlocked.red && B.redDice && B.redDice.length > 0;
  const ctBlue = B.catchyTuneUnlocked.blue && B.blueDice && B.blueDice.length > 0;
  if (ctRed || ctBlue) {
    const proceedAfterPickers = () => { _doStartNextRound(); };
    if (ctRed && ctBlue) {
      showCatchyTunePicker('red', B.redDice, () => {
        showCatchyTunePicker('blue', B.blueDice, proceedAfterPickers);
      });
    } else if (ctRed) {
      showCatchyTunePicker('red', B.redDice, proceedAfterPickers);
    } else {
      showCatchyTunePicker('blue', B.blueDice, proceedAfterPickers);
    }
    return;
  }
  _doStartNextRound();
}
function _doStartNextRound() {
  if (!B) return;
  // Reset per-round Bonzai state for the new round
  B.bonzaiDecided = { red: false, blue: false };
  B.bonzaiBtnDice = { red: 0, blue: 0 };

  // Live PvP state sync: Red is authoritative — broadcasts full state after each round.
  if (B.phase !== 'over') pvpBroadcastState({ event: 'roundEnd' });
  // v726: reset ready flags for next round
  if (LIVE_PVP) { pvpRedReady = false; PVP_OPPONENT_READY = false; }

  // Hand Limit check — force discards BEFORE Duel Phase or roll buttons unlock
  checkHandLimits(() => {
    const priority = computeDuelPriority();
    if (priority) {
      enterDuelPhase(priority);
    } else {
      B.phase = 'ready';
      B.duelActiveTeam = null;
      B.duelPriority = null;
      resetRollButtons();
      renderBattle();
      renderDuelUI();
    }
  });
}

function resetRollButtons() {
  // Fire registered hooks — if any hook returns true, skip default behavior
  for (const fn of _resetRollHooks) {
    try { if (fn()) return; } catch(e) { console.error('[resetRollButtons hook error]', e); }
  }
  const r = document.getElementById('rollRedBtn');
  const b = document.getElementById('rollBlueBtn');
  if (r) { r.classList.remove('locked', 'pulse'); r.disabled = false; r.textContent = 'Red Roll'; }
  if (b) { b.classList.remove('locked', 'pulse'); b.disabled = false; b.textContent = 'Blue Roll'; }
  // v733: async MP — Red button says "ROLL" (commit signal), Blue is AI-controlled
  // Player uses pre-roll abilities (Miyoshi Bonzai, Tyler, etc.) then clicks ROLL.
  // Boss AI waits for pvpRedClickedRoll before rolling — gives player time for abilities.
  if (MP_MODE && !LIVE_PVP) {
    if (r) r.textContent = 'ROLL';
    pvpRedClickedRoll = false; // player must click ROLL — AI waits for this signal
    if (b) b.style.display = 'none'; // hide Blue's button — AI rolls it
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

// ============================================================
// HAND LIMIT MODE — cap specials at B.HAND_LIMIT (default 3)
// ============================================================
const HAND_RESOURCE_KEYS = ['moonstone','ice','fire','surge','healingSeed','luckyStone','firefly','burn'];
const HAND_RESOURCE_LABELS = {
  moonstone: { emoji:'🌙', name:'Moonstone' },
  ice:       { emoji:'❄️', name:'Ice Shard' },
  fire:      { emoji:'🔥', name:'Sacred Fire' },
  surge:     { emoji:'⚡', name:'Surge' },
  healingSeed:{ emoji:'🌱', name:'Healing Seed' },
  luckyStone:{ emoji:'🍀', name:'Lucky Stone' },
  firefly:   { emoji:'✨', name:'Firefly' },
  burn:      { emoji:'💥', name:'Burn' },
};

function getHandSize(team) {
  let total = 0;
  for (const k of HAND_RESOURCE_KEYS) total += (team.resources[k] || 0);
  return total;
}

// Check both teams after a round resolves. If over limit, show discard modal then call callback.
function checkHandLimits(callback) {
  if (!B || !B.handLimitMode) { callback(); return; }
  // Check red first, then blue, then proceed
  checkTeamHandLimit('red', () => {
    checkTeamHandLimit('blue', callback);
  });
}

function checkTeamHandLimit(teamName, callback) {
  const team = B[teamName];
  if (getHandSize(team) <= B.HAND_LIMIT) { callback(); return; }
  // Show discard modal
  B.handLimitPending = { team: teamName, callback };
  renderHandLimitModal(teamName);
  document.getElementById('handLimitOverlay').classList.add('active');
}

function renderHandLimitModal(teamName) {
  const team = B[teamName];
  const handSize = getHandSize(team);
  const over = handSize - B.HAND_LIMIT;
  const label = teamName === 'red' ? 'Red' : 'Blue';
  document.getElementById('handLimitTitle').textContent = `${label} Team — Discard to ${B.HAND_LIMIT}`;
  document.getElementById('handLimitSub').textContent = `${handSize} specials (${over} over limit). Tap one to destroy it.`;
  const container = document.getElementById('handLimitItems');
  container.innerHTML = '';
  for (const k of HAND_RESOURCE_KEYS) {
    const count = team.resources[k] || 0;
    if (count <= 0) continue;
    const info = HAND_RESOURCE_LABELS[k];
    for (let i = 0; i < count; i++) {
      const btn = document.createElement('button');
      btn.className = 'selene-opt';
      btn.style.cssText = 'background:linear-gradient(135deg,#374151,#1f2937);min-width:100px;margin:0;padding:8px 14px;font-size:14px;';
      btn.textContent = `${info.emoji} ${info.name}`;
      btn.onclick = () => doHandLimitDiscard(teamName, k);
      container.appendChild(btn);
    }
  }
}

function doHandLimitDiscard(teamName, resourceKey) {
  const team = B[teamName];
  if ((team.resources[resourceKey] || 0) <= 0) return;
  team.resources[resourceKey]--;
  const info = HAND_RESOURCE_LABELS[resourceKey];
  log(`<span class="log-ability">Hand Limit</span> — ${teamName === 'red' ? 'Red' : 'Blue'} discards ${info.emoji} ${info.name}! (${getHandSize(team)}/${B.HAND_LIMIT})`);
  renderBattle();
  // Still over? Re-render the modal
  if (getHandSize(team) > B.HAND_LIMIT) {
    renderHandLimitModal(teamName);
    return;
  }
  // Done — close modal and proceed
  document.getElementById('handLimitOverlay').classList.remove('active');
  const pending = B.handLimitPending;
  B.handLimitPending = null;
  if (pending?.callback) pending.callback();
}

// Pre-roll setup — called once when the first player clicks Roll
function doPreRollSetup() {
  if (!B || B.phase !== 'ready') return;
  const rF = active(B.red), bF = active(B.blue);
  if (rF.ko || bF.ko) return;
  // MVP snapshot: capture team resources + ghost HPs so we can credit deltas at round end
  snapshotRound();

  // Collect pre-roll callouts — drained sequentially after setup so none stomp each other
  const preRollCallouts = [];

  // Snapshot Lucky Stones + Moonstones available BEFORE this round
  // (can't use resources gained during the same roll)
  B.lsAvailable = {
    red: B.red.resources.luckyStone,
    blue: B.blue.resources.luckyStone
  };
  B.msAvailable = {
    red: B.red.resources.moonstone,
    blue: B.blue.resources.moonstone
  };

  // Reset per-round flags
  [B.red, B.blue].forEach(team => {
    active(team).usedMagicTouch = false;
  });
  // v640 — Piper (107) Slick Coat reactive: flag true when an auto-fire before-roll ability
  // is negated this round. Only then does Piper apply the -1 enemy die penalty.
  // Prevents the old behavior where Slick Coat fired unconditionally every round.
  B.piperBlockedThisRound = { red: false, blue: false };

  // ========================================
  // PHASE 1: PRE-ROLL TRIGGERS
  // ========================================

  // Moonstone Sickness — pre-roll damage (once per turn, does NOT hit replacement if KO)
  if (!B.moonstoneSicknessFiredThisTurn) {
    B.moonstoneSicknessFiredThisTurn = true;
    const msMode = document.getElementById('moonstoneModeSelect')?.value || 'D';
    ['red', 'blue'].forEach(teamKey => {
      const t = B[teamKey];
      let msDmg = 0;
      if (msMode === 'A' && t.moonstoneSickness > 0) {
        msDmg = t.moonstoneSickness * 2;
      } else if ((msMode === 'D' || msMode === 'G') && t.moonstoneSickness > 0) {
        msDmg = t.moonstoneSickness * 1;
      } else if ((msMode === 'B' || msMode === 'C') && t.moonstoneSicknessPending > 0) {
        msDmg = t.moonstoneSicknessPending;
        t.moonstoneSicknessPending = 0; // clear after applying
      }
      if (msDmg > 0) {
        const f = active(t);
        if (f && !f.ko) {
          f.hp = Math.max(0, f.hp - msDmg);
          if (f.hp <= 0) { f.ko = true; f.killedBy = -1; }
          log(`<span class="log-dmg">Moonstone Sickness!</span> ${f.name} takes ${msDmg} damage! ${f.ko ? '<span class="log-ko">KO!</span>' : f.hp + ' HP left'}`);
          narrate(`<b style="color:var(--moonstone)">Moonstone Sickness!</b> <b class="${teamKey}-text">${f.name}</b> takes ${msDmg} damage!${f.ko ? ' <b>KO!</b>' : ''}`);
          preRollCallouts.push(['MOONSTONE SICKNESS!', 'var(--moonstone)', `${f.name} takes ${msDmg} damage!`, teamKey]);
          playDamageSfx(msDmg);
          hitDamage(teamKey);
          renderBattle();
        }
      }
    });
  }

  // v687: Pre-roll chip damage abilities fire ONCE per turn. If they KO a ghost and
  // a replacement swaps in, doPreRollSetup re-runs — but the replacement is NOT hit
  // again. The flag is set before the first ability fires and checked on re-entry.
  const preRollAlreadyFired = B.preRollAbilitiesFiredThisTurn.red && B.preRollAbilitiesFiredThisTurn.blue;
  if (!preRollAlreadyFired) {
  B.preRollAbilitiesFiredThisTurn.red = true;
  B.preRollAbilitiesFiredThisTurn.blue = true;

  // Frederick (27) — Careful: deal 2 damage per extra die enemy rolled above 3 last round
  [B.red, B.blue].forEach(team => {
    const fFred = active(team);
    const enemyFred = opp(team);
    const tNameFred = team === B.red ? 'red' : 'blue';
    const enemyNameFred = enemyFred === B.red ? 'red' : 'blue';
    if (fFred.id === 27 && !fFred.ko) {
      const enemyLastDice = B.lastRollDiceCount[enemyNameFred] || 3;
      const extraDice = Math.max(0, enemyLastDice - 3);
      if (extraDice > 0) {
        const fredDmg = extraDice * 2;
        const ef = active(enemyFred);
        if (!ef.ko) {
          ef.hp = Math.max(0, ef.hp - fredDmg);
          if (ef.hp <= 0) { ef.hp = 0; ef.ko = true; ef.killedBy = 27; }
          preRollCallouts.push(['CAREFUL!', 'var(--common)', `${fFred.name} — Enemy rolled ${enemyLastDice} dice last round! ${extraDice} extra × 2 = ${fredDmg} damage!`, tNameFred]);
          log(`<span class="log-ability">${fFred.name}</span> — Careful! Enemy rolled ${enemyLastDice} dice (${extraDice} extra) → <span class="log-dmg">${fredDmg} damage to ${ef.name}!</span> ${ef.ko ? '<span class="log-ko">KO!</span>' : ef.hp + ' HP left'}`);
          playDamageSfx(fredDmg);
          hitDamage(enemyNameFred);
        }
      }
    }
  });

  // Ember Force (304) — deal 1 damage to enemy active (negated by Dylan)
  // Phase 4: Masked Hero (55) Underdog fires BEFORE pre-roll damage — if attacker KO'd, skip damage
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const enemy = opp(team);
    const tNamePre = team === B.red ? 'red' : 'blue';
    if (f.id === 304 && !f.ko && !dylanNegates(enemy)) {
      const ef = active(enemy);
      if (!ef.ko) {
        const enemyName = enemy === B.red ? 'red' : 'blue';
        // Masked Hero (55) — Underdog: immune to before-roll damage
        if (maskedHeroImmune(ef)) {
          preRollCallouts.push(['UNDERDOG!', 'var(--uncommon)', `${ef.name} — immune to before-roll damage!`, enemyName]);
          log(`<span class="log-ability">${ef.name}</span> — Underdog! Immune to ${f.name}'s Swarm!`);
          return;
        }
        ef.hp = Math.max(0, ef.hp - 1);
        if (ef.hp <= 0) { ef.ko = true; ef.killedBy = (f.originalId || f.id); }
        preRollCallouts.push(['SWARM!', 'var(--uncommon)', `${f.name} — 1 damage to ${ef.name}!`, tNamePre]);
        log(`<span class="log-ability">${f.name}</span> — Swarm! <span class="log-dmg">1 damage to ${ef.name}!</span> ${ef.ko?'<span class="log-ko">KO!</span>':ef.hp+' HP left'}`);
        playDamageSfx(1);
        hitDamage(enemyName);
        // Simon (24) — Brew Time: gain 1 Sacred Fire when taking ANY damage
        if (ef.id === 24 && !ef.ko) {
          B[enemyName].resources.fire += 2;
          preRollCallouts.push(['BREW TIME!', 'var(--uncommon)', `Simon — Took pre-roll damage → +2 Sacred Fire!`, enemyName]);
          log(`<span class="log-ability">Simon</span> — Brew Time! Took pre-roll damage → <span class="log-ms">+2 Sacred Fire!</span>`);
        }
        // Collect Knight reactions via temp queue mode so they splice AFTER SWARM! in preRollCallouts
        const _swarmSavedKQ = abilityQueue;
        abilityQueue = [];
        abilityQueueMode = true;
        checkKnightEffects(tNamePre, f.name);
        abilityQueueMode = false;
        abilityQueue.forEach(item => preRollCallouts.push([item.name, item.color, item.desc, item.team]));
        abilityQueue = _swarmSavedKQ;
        // Princess Shade (436) — Bounty: +1 additional damage on pre-roll chip, works from sideline OR active (blocked by Cornelius)
        if (!ef.ko && hasAlive(B[tNamePre], 436) && !hasSideline(B[enemyName], 45)) {
          const psPreHp = ef.hp;
          ef.hp = Math.max(0, ef.hp - 1);
          if (ef.hp <= 0) { ef.ko = true; ef.killedBy = 436; }
          preRollCallouts.push(['BOUNTY!', 'var(--rare)', `Princess Shade — +1 additional damage to ${ef.name}!`, tNamePre]);
          log(`<span class="log-ability">Princess Shade</span> — Bounty! <span class="log-dmg">+1 additional damage to ${ef.name}!</span> ${ef.ko?'<span class="log-ko">KO!</span>':ef.hp+' HP left'}`);
          playDamageSfx(1);
          hitDamage(enemyName);
          popSidelineCard(B[tNamePre], 436);
          if (ef.id === 24 && !ef.ko) {
            B[enemyName].resources.fire += 2;
            preRollCallouts.push(['BREW TIME!', 'var(--uncommon)', `Simon — Took pre-roll damage → +2 Sacred Fire!`, enemyName]);
            log(`<span class="log-ability">Simon</span> — Brew Time! Took pre-roll damage → <span class="log-ms">+1 Sacred Fire!</span>`);
          }
        } else if (!ef.ko && hasAlive(B[tNamePre], 436) && hasSideline(B[enemyName], 45)) {
          const cornGhostPS = getSidelineGhost(B[enemyName], 45);
          preRollCallouts.push(['ANTIDOTE!', 'var(--uncommon)', `${cornGhostPS ? cornGhostPS.name : 'Cornelius'} blocks Princess Shade's Bounty!`, enemyName]);
          log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Princess Shade Bounty blocked!`);
        }
      }
    } else if (f.id === 304 && !f.ko && dylanNegates(enemy)) {
      log(`<span class="log-ability">${f.name}</span> — Swarm blocked by <span class="log-ability">Dylan's Scarecrow</span>!`);
      B.piperBlockedThisRound[tNamePre] = true; // v640: Slick Coat gate
    }
  });

  // Shade's Shadow (205) — sideline: deal 1 dmg before each roll IF enemy active < 4 HP (negated by Dylan or Cornelius)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const enemy = opp(team);
    const tNameShade = team === B.red ? 'red' : 'blue';
    const corneliusBlocksShadow = hasSideline(enemy, 45);
    if (hasSideline(team, 205) && !dylanNegates(enemy) && !corneliusBlocksShadow) {
      const shadeGhost = getSidelineGhost(team, 205);
      const ef = active(enemy);
      if (!ef.ko && ef.hp < 4) {
        // Masked Hero (55) — immune to before-roll damage
        if (maskedHeroImmune(ef)) {
          preRollCallouts.push(['UNDERDOG!', 'var(--uncommon)', `${ef.name} — immune to Meltdown!`, tNameShade]);
          log(`<span class="log-ability">${ef.name}</span> — Underdog! Immune to Shade's Shadow Meltdown!`);
          return;
        }
        const preHp = ef.hp;
        ef.hp = Math.max(0, ef.hp - 1);
        if (ef.hp <= 0) { ef.ko = true; ef.killedBy = 205; }
        const enemyName = enemy === B.red ? 'red' : 'blue';
        const meltMsg = ef.ko
          ? `Shade's Shadow finishes ${ef.name}! (${preHp} HP → KO!)`
          : `Shade's Shadow chips ${ef.name}! (${preHp} → ${ef.hp} HP)`;
        preRollCallouts.push(['MELTDOWN!', 'var(--rare)', meltMsg, tNameShade]);
        log(`<span class="log-ability">Shade's Shadow</span> (sideline) — Meltdown! Enemy below 4 HP — <span class="log-dmg">1 damage to ${ef.name}!</span> ${ef.ko?'<span class="log-ko">KO!</span>':ef.hp+' HP left'}`);
        playDamageSfx(1);
        hitDamage(enemyName);
        popSidelineCard(team, 205);
        // Simon (24) — Brew Time: gain 1 Sacred Fire when taking ANY damage
        if (ef.id === 24 && !ef.ko) {
          B[enemyName].resources.fire += 2;
          preRollCallouts.push(['BREW TIME!', 'var(--uncommon)', `Simon — Took pre-roll damage → +2 Sacred Fire!`, enemyName]);
          log(`<span class="log-ability">Simon</span> — Brew Time! Took pre-roll damage → <span class="log-ms">+2 Sacred Fire!</span>`);
        }
        // Collect Knight reactions via temp queue mode so they splice AFTER MELTDOWN! in preRollCallouts
        // (not in queue mode → checkKnightEffects fires showAbilityCallout directly, stomping MELTDOWN!)
        const _meltSavedKQ = abilityQueue;
        abilityQueue = [];
        abilityQueueMode = true;
        checkKnightEffects(tNameShade, "Shade's Shadow", shadeGhost);
        abilityQueueMode = false;
        abilityQueue.forEach(item => preRollCallouts.push([item.name, item.color, item.desc, item.team]));
        abilityQueue = _meltSavedKQ;
        // Princess Shade (436) — Bounty: +1 additional damage on pre-roll chip, works from sideline OR active (blocked by Cornelius)
        if (!ef.ko && hasAlive(B[tNameShade], 436) && !hasSideline(enemy, 45)) {
          const psPreHp2 = ef.hp;
          ef.hp = Math.max(0, ef.hp - 1);
          if (ef.hp <= 0) { ef.ko = true; ef.killedBy = 436; }
          preRollCallouts.push(['BOUNTY!', 'var(--rare)', `Princess Shade — +1 additional damage to ${ef.name}!`, tNameShade]);
          log(`<span class="log-ability">Princess Shade</span> — Bounty! <span class="log-dmg">+1 additional damage to ${ef.name}!</span> ${ef.ko?'<span class="log-ko">KO!</span>':ef.hp+' HP left'}`);
          playDamageSfx(1);
          hitDamage(enemyName);
          popSidelineCard(B[tNameShade], 436);
          // Simon (24) — Brew Time: gain 1 Sacred Fire when taking ANY damage
          if (ef.id === 24 && !ef.ko) {
            B[enemyName].resources.fire += 2;
            preRollCallouts.push(['BREW TIME!', 'var(--uncommon)', `Simon — Took pre-roll damage → +2 Sacred Fire!`, enemyName]);
            log(`<span class="log-ability">Simon</span> — Brew Time! Took pre-roll damage → <span class="log-ms">+1 Sacred Fire!</span>`);
          }
        } else if (!ef.ko && hasAlive(B[tNameShade], 436) && hasSideline(enemy, 45)) {
          const cornGhostPS2 = getSidelineGhost(enemy, 45);
          preRollCallouts.push(['ANTIDOTE!', 'var(--uncommon)', `${cornGhostPS2 ? cornGhostPS2.name : 'Cornelius'} blocks Princess Shade's Bounty!`, enemyName]);
          log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Princess Shade Bounty blocked!`);
        }
      }
    } else if (hasSideline(team, 205) && dylanNegates(enemy)) {
      log(`<span class="log-ability">Shade's Shadow</span> — Meltdown blocked by <span class="log-ability">Dylan's Scarecrow</span>!`);
      B.piperBlockedThisRound[tNameShade] = true; // v640: Slick Coat gate
    } else if (hasSideline(team, 205) && corneliusBlocksShadow) {
      const cornGhostSS = getSidelineGhost(enemy, 45);
      const enemyNameSS = enemy === B.red ? 'red' : 'blue';
      preRollCallouts.push(['ANTIDOTE!', 'var(--uncommon)', `${cornGhostSS ? cornGhostSS.name : 'Cornelius'} blocks Shade's Shadow Meltdown!`, enemyNameSS]);
      log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! <span class="log-ability">Shade's Shadow</span> Meltdown blocked!`);
      B.piperBlockedThisRound[tNameShade] = true; // v640: Slick Coat gate
    }
  });

  // Shade (111) — active: deal 1 damage to enemy active before each roll INCLUDING round 1 (negated by Dylan)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const enemy = opp(team);
    const tNameHaunt = team === B.red ? 'red' : 'blue';
    if (f.id === 111 && !f.ko && f._rolledOnce && !dylanNegates(enemy)) {
      const ef = active(enemy);
      if (!ef.ko) {
        // Piper (107) — Slick Coat: negates Haunt
        if (ef.id === 107 && !ef.ko) {
          log(`<span class="log-ability">Piper</span> — Slick Coat! Shade's Haunt is negated.`);
        } else {
          const enemyName = enemy === B.red ? 'red' : 'blue';
          // Masked Hero (55) — immune to before-roll damage
          if (maskedHeroImmune(ef)) {
            preRollCallouts.push(['UNDERDOG!', 'var(--uncommon)', `${ef.name} — immune to Haunt!`, enemyName]);
            log(`<span class="log-ability">${ef.name}</span> — Underdog! Immune to Shade's Haunt!`);
            return;
          }
          const preHp = ef.hp;
          ef.hp = Math.max(0, ef.hp - 1);
          if (ef.hp <= 0) { ef.ko = true; ef.killedBy = 111; }
          const hauntMsg = ef.ko
            ? `Shade haunts ${ef.name}! (${preHp} HP → KO!)`
            : `Shade haunts ${ef.name}! (${preHp} → ${ef.hp} HP)`;
          preRollCallouts.push(['HAUNT!', 'var(--legendary)', hauntMsg, tNameHaunt]);
          log(`<span class="log-ability">Shade</span> — Haunt! <span class="log-dmg">1 damage to ${ef.name}!</span> ${ef.ko?'<span class="log-ko">KO!</span>':ef.hp+' HP left'}`);
          playDamageSfx(1);
          hitDamage(enemyName);
          // Simon (24) — Brew Time: gain 1 Sacred Fire when taking ANY damage
          if (ef.id === 24 && !ef.ko) {
            B[enemyName].resources.fire += 2;
            preRollCallouts.push(['BREW TIME!', 'var(--uncommon)', `Simon — Took pre-roll damage → +2 Sacred Fire!`, enemyName]);
            log(`<span class="log-ability">Simon</span> — Brew Time! Took pre-roll damage → <span class="log-ms">+1 Sacred Fire!</span>`);
          }
          // Collect Knight reactions via temp queue mode so they splice AFTER HAUNT! in preRollCallouts
          const _hauntSavedKQ = abilityQueue;
          abilityQueue = [];
          abilityQueueMode = true;
          checkKnightEffects(tNameHaunt, f.name);
          abilityQueueMode = false;
          abilityQueue.forEach(item => preRollCallouts.push([item.name, item.color, item.desc, item.team]));
          abilityQueue = _hauntSavedKQ;
          // Princess Shade (436) — Bounty: +1 additional damage on pre-roll chip, works from sideline OR active (blocked by Cornelius)
          if (!ef.ko && hasAlive(B[tNameHaunt], 436) && !hasSideline(enemy, 45)) {
            const psPreHp3 = ef.hp;
            ef.hp = Math.max(0, ef.hp - 1);
            if (ef.hp <= 0) { ef.ko = true; ef.killedBy = 436; }
            preRollCallouts.push(['BOUNTY!', 'var(--rare)', `Princess Shade — +1 additional damage to ${ef.name}!`, tNameHaunt]);
            log(`<span class="log-ability">Princess Shade</span> — Bounty! <span class="log-dmg">+1 additional damage to ${ef.name}!</span> ${ef.ko?'<span class="log-ko">KO!</span>':ef.hp+' HP left'}`);
            playDamageSfx(1);
            hitDamage(enemyName);
            popSidelineCard(B[tNameHaunt], 436);
            if (ef.id === 24 && !ef.ko) {
              B[enemyName].resources.fire += 2;
              preRollCallouts.push(['BREW TIME!', 'var(--uncommon)', `Simon — Took pre-roll damage → +2 Sacred Fire!`, enemyName]);
              log(`<span class="log-ability">Simon</span> — Brew Time! Took pre-roll damage → <span class="log-ms">+1 Sacred Fire!</span>`);
            }
          } else if (!ef.ko && hasAlive(B[tNameHaunt], 436) && hasSideline(enemy, 45)) {
            const cornGhostPS3 = getSidelineGhost(enemy, 45);
            const enemyNameHaunt = enemy === B.red ? 'red' : 'blue';
            preRollCallouts.push(['ANTIDOTE!', 'var(--uncommon)', `${cornGhostPS3 ? cornGhostPS3.name : 'Cornelius'} blocks Princess Shade's Bounty!`, enemyNameHaunt]);
            log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Princess Shade Bounty blocked!`);
          }
        }
      }
    } else if (f.id === 111 && !f.ko && dylanNegates(enemy)) {
      log(`<span class="log-ability">Shade</span> — Haunt blocked by <span class="log-ability">Dylan's Scarecrow</span>!`);
      B.piperBlockedThisRound[tNameHaunt] = true; // v640: Slick Coat gate
    }
  });

  // Lucy (108) — Blue Fire: pending tick from the previous round's win.
  // Lucy's "Win a roll: opponent takes 1 damage before their next roll" arrives here
  // as a separate beat — NOT bundled with the winning roll's damage. The flag is
  // Delayed damage: set by Lucy (108, 1 dmg) or Humar (336, 2 dmg) via B.pendingLucyDmg
  // Consumed before this round's roll. Target is the team holding the pending flag.
  [B.red, B.blue].forEach(team => {
    const tNameLucyTarget = team === B.red ? 'red' : 'blue';
    if (!(B.pendingLucyDmg && B.pendingLucyDmg[tNameLucyTarget] > 0)) return;
    const pendingDmg = B.pendingLucyDmg[tNameLucyTarget];
    const tNameLucyActor = tNameLucyTarget === 'red' ? 'blue' : 'red';
    const isHumar = pendingDmg >= 2;
    const abilityLabel = isHumar ? 'Meteor' : 'Blue Fire';
    const splashName = isHumar ? 'METEOR!' : 'BLUE FIRE!';
    const splashColor = 'var(--legendary)';
    if (!dylanNegates(team)) {
      const f = active(team);
      if (!f.ko) {
        // Phase 4: Masked Hero (55) Underdog fires BEFORE Lucy/Humar delayed damage
        if (f.id === 55 && !f.ko) {
          const lucyAttacker = active(B[tNameLucyActor]);
          if (lucyAttacker && !lucyAttacker.ko) {
            const undPreL = lucyAttacker.hp;
            lucyAttacker.hp = Math.max(0, lucyAttacker.hp - 3);
            if (lucyAttacker.hp <= 0) { lucyAttacker.ko = true; lucyAttacker.killedBy = 55; }
            const undMsgL = lucyAttacker.ko
              ? `${f.name} counters! 3 damage to ${lucyAttacker.name}! (${undPreL} HP → KO!)`
              : `${f.name} counters! 3 damage to ${lucyAttacker.name}! (${undPreL} → ${lucyAttacker.hp} HP)`;
            preRollCallouts.push(['UNDERDOG!', 'var(--uncommon)', undMsgL, tNameLucyTarget]);
            log(`<span class="log-ability">${f.name}</span> — Underdog! 3 counter-damage to ${lucyAttacker.name}!`);
            playDamageSfx(3);
            hitDamage(tNameLucyActor);
            if (lucyAttacker.ko) {
              B.pendingLucyDmg[tNameLucyTarget] = 0; // consume the flag
              return; // Attacker KO'd by Underdog — skip Lucy/Humar damage
            }
          }
        }
        const preHp = f.hp;
        f.hp = Math.max(0, f.hp - pendingDmg);
        if (f.hp <= 0) { f.ko = true; f.killedBy = isHumar ? 336 : 108; }
        const lucyMsg = f.ko
          ? `${abilityLabel} burns ${f.name}! (${preHp} HP → KO!)`
          : `${abilityLabel} burns ${f.name}! (${preHp} → ${f.hp} HP)`;
        preRollCallouts.push([splashName, splashColor, lucyMsg, tNameLucyActor]);
        log(`<span class="log-ability">${abilityLabel}</span> — <span class="log-dmg">${pendingDmg} damage to ${f.name}!</span> ${f.ko?'<span class="log-ko">KO!</span>':f.hp+' HP left'}`);
        playDamageSfx(pendingDmg);
        hitDamage(tNameLucyTarget);
        // Simon (24) — Brew Time: gain 1 Sacred Fire when taking ANY damage
        if (f.id === 24 && !f.ko) {
          B[tNameLucyTarget].resources.fire += 2;
          preRollCallouts.push(['BREW TIME!', 'var(--uncommon)', `Simon — Took pre-roll damage → +2 Sacred Fire!`, tNameLucyTarget]);
          log(`<span class="log-ability">Simon</span> — Brew Time! Took pre-roll damage → <span class="log-ms">+1 Sacred Fire!</span>`);
        }
        // Princess Shade (436) — Bounty: +1 additional damage on pre-roll chip, works from sideline OR active (blocked by Cornelius)
        if (!f.ko && hasAlive(B[tNameLucyActor], 436) && !hasSideline(B[tNameLucyTarget], 45)) {
          const psPreHpL = f.hp;
          f.hp = Math.max(0, f.hp - 1);
          if (f.hp <= 0) { f.ko = true; f.killedBy = 436; }
          preRollCallouts.push(['BOUNTY!', 'var(--rare)', `Princess Shade — +1 additional damage to ${f.name}!`, tNameLucyActor]);
          log(`<span class="log-ability">Princess Shade</span> — Bounty! <span class="log-dmg">+1 additional damage to ${f.name}!</span> ${f.ko?'<span class="log-ko">KO!</span>':f.hp+' HP left'}`);
          playDamageSfx(1);
          hitDamage(tNameLucyTarget);
          popSidelineCard(B[tNameLucyActor], 436);
          // Simon (24) — Brew Time: gain 1 Sacred Fire when taking ANY damage
          if (f.id === 24 && !f.ko) {
            B[tNameLucyTarget].resources.fire++;
            preRollCallouts.push(['BREW TIME!', 'var(--uncommon)', `Simon — Took pre-roll damage → +2 Sacred Fire!`, tNameLucyTarget]);
            log(`<span class="log-ability">Simon</span> — Brew Time! Took pre-roll damage → <span class="log-ms">+1 Sacred Fire!</span>`);
          }
        } else if (!f.ko && hasAlive(B[tNameLucyActor], 436) && hasSideline(B[tNameLucyTarget], 45)) {
          const cornGhostPSL = getSidelineGhost(B[tNameLucyTarget], 45);
          preRollCallouts.push(['ANTIDOTE!', 'var(--uncommon)', `${cornGhostPSL ? cornGhostPSL.name : 'Cornelius'} blocks Princess Shade's Bounty!`, tNameLucyTarget]);
          log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Princess Shade Bounty blocked!`);
        }
        // Knight reactions on Lucy's side (the actor). Temp queue mode so reactions
        // splice AFTER BLUE FIRE! in preRollCallouts instead of stomping it.
        const _lucySavedKQ = abilityQueue;
        abilityQueue = [];
        abilityQueueMode = true;
        checkKnightEffects(tNameLucyActor, 'Lucy');
        abilityQueueMode = false;
        abilityQueue.forEach(item => preRollCallouts.push([item.name, item.color, item.desc, item.team]));
        abilityQueue = _lucySavedKQ;
      }
    } else {
      log(`<span class="log-ability">Lucy</span> — Blue Fire blocked by <span class="log-ability">Dylan's Scarecrow</span>!`);
      B.piperBlockedThisRound[tNameLucyActor] = true; // v640: Slick Coat gate
    }
    B.pendingLucyDmg[tNameLucyTarget] = 0; // consume regardless (applied, negated, or target KO'd)
  });

  // Splinter (101) — Toxic Fumes: once activated (first win), deal 1 chip damage to enemy before every roll
  // Negated by Dylan's Scarecrow (same as Haunt). Stops naturally when Splinter is KO'd (no longer active).
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const enemy = opp(team);
    const tNameSplinter = team === B.red ? 'red' : 'blue';
    if (f.id === 101 && !f.ko && B.splinterActivated && B.splinterActivated[tNameSplinter]) {
      const ef = active(enemy);
      if (!ef.ko) {
        if (dylanNegates(enemy)) {
          log(`<span class="log-ability">Splinter</span> — Toxic Fumes blocked by <span class="log-ability">Dylan's Scarecrow</span>!`);
          B.piperBlockedThisRound[tNameSplinter] = true; // v640: Slick Coat gate
        } else {
          const enemyName = enemy === B.red ? 'red' : 'blue';
          // Masked Hero (55) — immune to before-roll damage
          if (maskedHeroImmune(ef)) {
            preRollCallouts.push(['UNDERDOG!', 'var(--uncommon)', `${ef.name} — immune to Toxic Fumes!`, enemyName]);
            log(`<span class="log-ability">${ef.name}</span> — Underdog! Immune to Splinter's Toxic Fumes!`);
            return;
          }
          const preHp = ef.hp;
          ef.hp = Math.max(0, ef.hp - 1);
          if (ef.hp <= 0) { ef.ko = true; ef.killedBy = 101; }
          const fumesMsg = ef.ko
            ? `Toxic Fumes choke ${ef.name}! (${preHp} HP → KO!)`
            : `Toxic Fumes choke ${ef.name}! (${preHp} → ${ef.hp} HP)`;
          preRollCallouts.push(['TOXIC FUMES!', 'var(--ghost-rare)', fumesMsg, tNameSplinter]);
          log(`<span class="log-ability">Splinter</span> — Toxic Fumes! <span class="log-dmg">1 damage to ${ef.name}!</span> ${ef.ko?'<span class="log-ko">KO!</span>':ef.hp+' HP left'}`);
          playDamageSfx(1);
          hitDamage(enemyName);
          if (ef.id === 24 && !ef.ko) {
            B[enemyName].resources.fire += 2;
            preRollCallouts.push(['BREW TIME!', 'var(--uncommon)', `Simon — Took pre-roll damage → +2 Sacred Fire!`, enemyName]);
            log(`<span class="log-ability">Simon</span> — Brew Time! Took pre-roll damage → <span class="log-ms">+1 Sacred Fire!</span>`);
          }
          const _splinterSavedKQ = abilityQueue;
          abilityQueue = [];
          abilityQueueMode = true;
          checkKnightEffects(tNameSplinter, f.name);
          abilityQueueMode = false;
          abilityQueue.forEach(item => preRollCallouts.push([item.name, item.color, item.desc, item.team]));
          abilityQueue = _splinterSavedKQ;
          // Princess Shade (436) — Bounty: +1 additional damage on pre-roll chip, works from sideline OR active (blocked by Cornelius)
          if (!ef.ko && hasAlive(B[tNameSplinter], 436) && !hasSideline(enemy, 45)) {
            const psPreHp4 = ef.hp;
            ef.hp = Math.max(0, ef.hp - 1);
            if (ef.hp <= 0) { ef.ko = true; ef.killedBy = 436; }
            preRollCallouts.push(['BOUNTY!', 'var(--rare)', `Princess Shade — +1 additional damage to ${ef.name}!`, tNameSplinter]);
            log(`<span class="log-ability">Princess Shade</span> — Bounty! <span class="log-dmg">+1 additional damage to ${ef.name}!</span> ${ef.ko?'<span class="log-ko">KO!</span>':ef.hp+' HP left'}`);
            playDamageSfx(1);
            hitDamage(enemyName);
            popSidelineCard(B[tNameSplinter], 436);
            if (ef.id === 24 && !ef.ko) {
              B[enemyName].resources.fire += 2;
              preRollCallouts.push(['BREW TIME!', 'var(--uncommon)', `Simon — Took pre-roll damage → +2 Sacred Fire!`, enemyName]);
              log(`<span class="log-ability">Simon</span> — Brew Time! Took pre-roll damage → <span class="log-ms">+1 Sacred Fire!</span>`);
            }
          } else if (!ef.ko && hasAlive(B[tNameSplinter], 436) && hasSideline(enemy, 45)) {
            const cornGhostPS4 = getSidelineGhost(enemy, 45);
            preRollCallouts.push(['ANTIDOTE!', 'var(--uncommon)', `${cornGhostPS4 ? cornGhostPS4.name : 'Cornelius'} blocks Princess Shade's Bounty!`, enemyName]);
            log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Princess Shade Bounty blocked!`);
          }
        }
      }
    }
  });

  } // end pre-roll once-per-turn guard (v687)

  // Toby (97) — Pure Heart: if declared last round, KO Toby before rolling (the sacrifice)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tNameToby = team === B.red ? 'red' : 'blue';
    if (f.id === 97 && !f.ko && B.pureHeartScheduledKO && B.pureHeartScheduledKO[tNameToby]) {
      B.pureHeartScheduledKO[tNameToby] = false;
      f.hp = 0;
      f.ko = true;
      f.killedBy = 97; // self-sacrifice
      preRollCallouts.push(['PURE HEART!', 'var(--ghost-rare)', `${f.name} — The sacrifice is complete. The final roll was played.`, tNameToby]);
      log(`<span class="log-ability">${f.name}</span> — Pure Heart! Toby is defeated before rolling (sacrifice).`);
    }
  });

  // Wandering Sue (84) — Hidden Weakness: if enemy active ghost has 12+ HP, destroy them before rolling
  // Anti-overclock assassin — punishes opponents who stack HP via Seeker, Boris Fortify, etc.
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    if (f.id === 84 && !f.ko) {
      const enemy = opp(team);
      const ef = active(enemy);
      if (!ef.ko && ef.hp >= 12) {
        const preHp = ef.hp;
        ef.hp = 0;
        ef.ko = true;
        ef.killedBy = 84;
        preRollCallouts.push(['HIDDEN WEAKNESS!', 'var(--rare)', `${ef.name} has ${preHp} HP — exposed and destroyed!`, team === B.red ? 'red' : 'blue']);
        log(`<span class="log-ability">${f.name}</span> — Hidden Weakness! ${ef.name} had ${preHp} HP (≥12) — <span class="log-ko">instant KO!</span>`);
      }
    }
  });

  // If a pre-roll ability (Swarm / Meltdown / Haunt / Pure Heart / Hidden Weakness) caused a KO, flush any pending
  // callouts (e.g. MELTDOWN!) BEFORE the swap modal opens — previously the early
  // return discarded them and the callout silently never played.
  const preRollKO = [B.red, B.blue].some(t => active(t).ko);
  if (preRollKO && preRollCallouts.length > 0) {
    // Park phase NOW so rollReady's `if (B.phase !== 'ready') return;` guard fires
    // and prevents rolling from starting while MELTDOWN! is on screen. Without this,
    // doPreRollSetup returns undefined, the phase stays 'ready', rollReady sets it to
    // 'rolling', and dice fly mid-callout — then handleKOs() opens the swap modal
    // mid-resolution. 'ko-pause' is the correct holding state (used by doPressureSwap,
    // doKoSwap, etc.) — handleKOs() will transition to 'ko-swap' when it fires.
    B.phase = 'ko-pause';
    preRollCallouts.forEach((c, i) => {
      setTimeout(() => showAbilityCallout(c[0], c[1], c[2], c[3]), i * spd(1500));
    });
    refundCommitted();
    setTimeout(() => handleKOs(), preRollCallouts.length * 1500);
    return;
  }
  if (handleKOs()) {
    // No pending callouts — swap flow opens immediately
    refundCommitted();
    return;
  }

  // Harrison (315) — opt-in: spend seeds for extra dice (1 per seed)
  B.harrisonExtraDie = { red: 0, blue: 0 };
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    if (f.id === 315 && !f.ko && B.committed[tName].harrison > 0) {
      B.harrisonExtraDie[tName] = B.committed[tName].harrison;
      const cnt = B.committed[tName].harrison;
      B.committed[tName].harrison = 0; // reset after use
      preRollCallouts.push(['ASCEND!', 'var(--rare)', `${f.name} — ${cnt} seed${cnt>1?'s':''} → +${cnt} dice!`, team === B.red ? 'red' : 'blue']);
      log(`<span class="log-ability">${f.name}</span> — Ascend! Spent ${cnt} Healing Seed${cnt>1?'s':''} for +${cnt} extra dice!`);
      // Knight reactions to Ascend — collect via temporary queue then splice into preRollCallouts
      // so HEAVY AIR! / RETRIBUTION! plays sequentially AFTER ASCEND!, not as a simultaneous stomp
      const _savedAscendAQ = abilityQueue;
      abilityQueue = [];
      abilityQueueMode = true;
      checkKnightEffects(tName, f.name);
      abilityQueueMode = false;
      abilityQueue.forEach(item => preRollCallouts.push([item.name, item.color, item.desc, item.team]));
      abilityQueue = _savedAscendAQ;
    }
  });

  // Nick & Knack (409) — Knick Knack: steal 1 resource → +1 HP + 2 Burn
  B.nickKnackDecided = { red: false, blue: false };

  // Chow (414) — Secret Ingredient: reset decided flag only, NOT chowExtraDie
  // chowExtraDie persists until consumed in the dice count section (lines ~8207-8208)
  // Resetting it here would kill the bonus before the roll uses it
  if (!B.chowExtraDie) B.chowExtraDie = { red: 0, blue: 0 };
  B.chowDecided = { red: false, blue: false };

  // Zork (463) — Stoke: reset decided flag, zorkExtraDie persists until consumed
  if (!B.zorkExtraDie) B.zorkExtraDie = { red: 0, blue: 0 };
  B.zorkDecided = { red: false, blue: false };

  // Miyoshi (454) — Bonzai!: sacrifice HP for dice
  // bonzaiDecided and bonzaiBtnDice are set by the pre-roll button (useBonzaiButton)
  // Do NOT reset here — they persist from button click through to dice consumption
  if (!B.bonzaiExtraDie) B.bonzaiExtraDie = { red: 0, blue: 0 };
  if (!B.bonzaiBtnDice) B.bonzaiBtnDice = { red: 0, blue: 0 };
  if (!B.bonzaiDecided) B.bonzaiDecided = { red: false, blue: false };

  // Castle Gardener (442) — Cultivate: reset per round
  B.cultivateDecided = { red: false, blue: false };

  // Forest Spirit (446) — Hex: NOT reset here — set by doBurnPlace, consumed at lines 8676-8687
  if (!B.hexDieRemoval) B.hexDieRemoval = { red: 0, blue: 0 };

  // Aunt Susan (309)
  B.auntSusanBonus = { red: false, blue: false };
  B.auntSusanHealBonus = { red: false, blue: false };
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    if (f.id === 309 && B.committed[tName].auntSusan > 0) {
      B.auntSusanBonus[tName] = B.committed[tName].auntSusan;
      log(`<span class="log-ability">${f.name}</span> — Harvest Dance! Spent ${B.committed[tName].auntSusan} Healing Seed${B.committed[tName].auntSusan>1?'s':''} for +${B.committed[tName].auntSusan * 2} damage!`);
    }
    if (f.id === 309 && B.committed[tName].auntSusanHeal > 0) {
      B.auntSusanHealBonus[tName] = B.committed[tName].auntSusanHeal;
      log(`<span class="log-ability">${f.name}</span> — Harvest Dance! Spent ${B.committed[tName].auntSusanHeal} Healing Seed${B.committed[tName].auntSusanHeal>1?'s':''} for +${B.committed[tName].auntSusanHeal * 2} HP!`);
    }
  });

  // Finn (204) — Flame Blade: opt-in forge button (see useFinnFlameBlade), no auto-conversion

  // Zippa (423) — Glimmer: REWORKED — now passive +1 damage per Healing Seed held (applied in damage calc section)

  // ========================================
  // PHASE 2: COMPUTE DICE COUNTS (rolled later per-click)
  // ========================================
  let redCount = 3, blueCount = 3;
  // Bosses roll 3 dice like regular ghosts — their power is extra HP, not extra dice
  // Doug (63) Caution duel-phase swap promised the incoming ghost +1 die — apply now.
  if (B.dougCautionDieBonus && B.dougCautionDieBonus.red) { redCount++; B.dougCautionDieBonus.red = false; }
  if (B.dougCautionDieBonus && B.dougCautionDieBonus.blue) { blueCount++; B.dougCautionDieBonus.blue = false; }

  // Knight Light Retribution — bonus dice from opponent abilities
  // Guard: only apply if KL (402) is still the active ghost on that team — if KL was KO'd
  // mid-round the stored dice are silently discarded (not inherited by the replacement ghost).
  if (B.retributionDice) {
    if (B.retributionDice.red > 0) {
      const klRed = active(B.red);
      if (klRed.id === 402 && !klRed.ko) {
        redCount += B.retributionDice.red;
        log(`<span class="log-ability">Knight Light</span> — Retribution! <span class="log-ms">+${B.retributionDice.red} bonus dice!</span>`);
      }
    }
    if (B.retributionDice.blue > 0) {
      const klBlue = active(B.blue);
      if (klBlue.id === 402 && !klBlue.ko) {
        blueCount += B.retributionDice.blue;
        log(`<span class="log-ability">Knight Light</span> — Retribution! <span class="log-ms">+${B.retributionDice.blue} bonus dice!</span>`);
      }
    }
    B.retributionDice = { red: 0, blue: 0 };
  }

  // Cameron (25) — Unstoppable Force: bonus dice from opponent special usage
  if (B.cameronBonusDice) {
    ['red', 'blue'].forEach(tName => {
      if (B.cameronBonusDice[tName] > 0) {
        const camTeam = B[tName];
        const camAlive = camTeam.ghosts.some(g => g.id === 25 && !g.ko);
        if (camAlive) {
          if (tName === 'red') redCount += B.cameronBonusDice.red;
          else blueCount += B.cameronBonusDice.blue;
          const camG = camTeam.ghosts.find(g => g.id === 25 && !g.ko);
          const loc = camTeam.ghosts[camTeam.activeIdx]?.id === 25 ? 'active' : 'sideline';
          preRollCallouts.push(['UNSTOPPABLE FORCE!', 'var(--common)', `${camG.name} (${loc}) — Opponent used specials! +${B.cameronBonusDice[tName]} bonus dice!`, tName]);
          log(`<span class="log-ability">${camG.name}</span> — Unstoppable Force! <span class="log-ms">+${B.cameronBonusDice[tName]} bonus dice</span> from opponent specials!`);
        }
        B.cameronBonusDice[tName] = 0;
      }
    });
  }

  // Bouril (201) — first roll override
  let hankOverride = { red: false, blue: false };
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    if (f.id === 201 && f.hankFirstRoll) {
      hankOverride[tName] = true;
      f.hankFirstRoll = false;
    }
  });

  // Maximo (302) — first roll 1 die
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    if (f.id === 302 && f.maximoFirstRoll) {
      if (tName === 'red') redCount = 1;
      else blueCount = 1;
      f.maximoFirstRoll = false;
      preRollCallouts.push(['NAP!', 'var(--common)', `${f.name} — still napping, rolling only 1 die!`, tName]);
      log(`<span class="log-ability">${f.name}</span> is still napping — rolling only 1 die!`);
    }
  });

  // Redd (98) — Notorious: +2 dice on first roll after entry
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    if (f.id === 98 && f.reddFirstRoll) {
      if (tName === 'red') redCount += 2;
      else blueCount += 2;
      f.reddFirstRoll = false;
      log(`<span class="log-ability">${f.name}</span> — Notorious! Rolling with +2 bonus dice!`);
    }
  });

  // Dallas (60) — Quick Draw: steal 1 enemy die for first 2 rolls after entering from sideline
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    const enemyTName = tName === 'red' ? 'blue' : 'red';
    if (f.id === 60 && !f.ko && f.dallasQuickDraw > 0) {
      if (enemyTName === 'red') redCount = Math.max(1, redCount - 1);
      else blueCount = Math.max(1, blueCount - 1);
      if (tName === 'red') redCount += 1; else blueCount += 1; // steal: transfer the die to Dallas
      f.dallasQuickDraw--;
      const rollsLeft = f.dallasQuickDraw;
      preRollCallouts.push(['QUICK DRAW!', 'var(--uncommon)', `${f.name} — stole 1 die from opponent! (${rollsLeft} roll${rollsLeft !== 1 ? 's' : ''} of Quick Draw left)`, team === B.red ? 'red' : 'blue']);
      log(`<span class="log-ability">${f.name}</span> — Quick Draw! Opponent rolls 1 fewer die. (${rollsLeft} uses left)`);
    }
  });

  // Timber (210) — Howl: opponent chooses discard 2 specials OR -1 die
  // Choice is resolved via modal before dice are stored. timberDieReduction tracks result.
  B.timberDieReduction = { red: false, blue: false };
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    if (f.id === 210 && !f.ko) {
      const oppTeamName = team === B.red ? 'blue' : 'red';
      const oppTeam = team === B.red ? B.blue : B.red;
      // Dylan (301) Scarecrow / Piper (107) Slick Coat: negate all enemy before-rolling effects
      if (dylanNegates(oppTeam)) {
        const oppLabel = oppTeamName.charAt(0).toUpperCase() + oppTeamName.slice(1);
        preRollCallouts.push(['BLOCKED!', 'var(--text2)', `${oppLabel} — Scarecrow/Slick Coat negates Timber's Howl!`, oppTeamName]);
        log(`<span class="log-ability">${oppLabel}</span> — Dylan/Piper negates Timber's Howl!`);
        B.piperBlockedThisRound[team === B.red ? 'red' : 'blue'] = true; // v640: Slick Coat gate
        return;
      }
      const r = oppTeam.resources;
      const totalSpecials = (r.ice||0) + (r.fire||0) + (r.surge||0) + (r.moonstone||0) + (r.healingSeed||0) + (r.luckyStone||0);
      if (totalSpecials < 2) {
        // Not enough specials — forced to lose die
        B.timberDieReduction[oppTeamName] = true;
        if (oppTeamName === 'red') redCount = Math.max(1, redCount - 1);
        else blueCount = Math.max(1, blueCount - 1);
        const oppLabel = oppTeamName.charAt(0).toUpperCase() + oppTeamName.slice(1);
        preRollCallouts.push(['HOWL!', 'var(--legendary)', `${oppLabel} has no specials — forced to roll 1 fewer die!`, team === B.red ? 'red' : 'blue']);
        log(`<span class="log-ability">${oppLabel}</span> has no specials — forced to roll 1 fewer die under Timber's Howl!`);
        // Knight reactions to forced Howl — collect via temporary queue then splice into preRollCallouts
        const timberTeamName = team === B.red ? 'red' : 'blue';
        const _savedKQ = abilityQueue;
        abilityQueue = [];
        abilityQueueMode = true;
        checkKnightEffects(timberTeamName, f.name);
        abilityQueueMode = false;
        abilityQueue.forEach(item => preRollCallouts.push([item.name, item.color, item.desc, item.team]));
        abilityQueue = _savedKQ;
      } else {
        // Opponent has resources — queue the choice modal
        const timberTeamName = team === B.red ? 'red' : 'blue';
        B.timberPending = { team: oppTeam, oppTeamName, timberTeam: timberTeamName, redCount, blueCount };
      }
    }
  });

  // Ryder (456) — Toll: opponent chooses take 1 damage or give Ryder +1 Sacred Fire
  // Choice resolved via modal before dice are rolled. Negated by Dylan/Piper.
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    if (f.id === 456 && !f.ko) {
      const oppTeamName = team === B.red ? 'blue' : 'red';
      const oppTeam = team === B.red ? B.blue : B.red;
      if (dylanNegates(oppTeam)) {
        const oppLabel = oppTeamName.charAt(0).toUpperCase() + oppTeamName.slice(1);
        preRollCallouts.push(['BLOCKED!', 'var(--text2)', `${oppLabel} — Scarecrow/Slick Coat negates Ryder's Toll!`, oppTeamName]);
        log(`<span class="log-ability">${oppLabel}</span> — Dylan/Piper negates Ryder's Toll!`);
        B.piperBlockedThisRound[team === B.red ? 'red' : 'blue'] = true;
        return;
      }
      const riderTeamName = team === B.red ? 'red' : 'blue';
      B.riderPending = { team: oppTeam, oppTeamName, riderTeam: riderTeamName };
    }
  });

  // Piper (107) — Slick Coat: -1 enemy die IF an enemy auto-fire before-roll ability was
  // actually negated this round. v640 (Wyatt 2026-04-11): reactive, not unconditional.
  // Previously Slick Coat fired the -1 die every single round whenever Piper was active,
  // even when the enemy had nothing to negate — Wyatt's playtest observation.
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    const oppTeamName = tName === 'red' ? 'blue' : 'red';
    if (f.id === 107 && !f.ko && B.piperBlockedThisRound[oppTeamName]) {
      if (oppTeamName === 'red') redCount = Math.max(1, redCount - 1);
      else blueCount = Math.max(1, blueCount - 1);
      preRollCallouts.push(['SLICK COAT!', 'var(--ghost-rare)', `${f.name} — negation + enemy rolls 1 fewer die!`, team === B.red ? 'red' : 'blue']);
      log(`<span class="log-ability">${f.name}</span> — Slick Coat! Negated enemy effect + -1 enemy die.`);
    }
  });

  // Cyboo (100) — Spark: while on the sideline, active ghost gains +1 die if it has < 3 HP
  // Negated by Cornelius (45) — Antidote: if the enemy team has Cornelius on their sideline, Spark is blocked.
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    const enemyTeamObj = team === B.red ? B.blue : B.red;
    const corneliusBlocksSpark = hasSideline(enemyTeamObj, 45);
    if (!f.ko && f.hp < 3 && hasSideline(team, 100)) {
      if (corneliusBlocksSpark) {
        const cornGhost = getSidelineGhost(enemyTeamObj, 45);
        log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! <span class="log-ability">Cyboo</span> Spark blocked for ${f.name}!`);
        const blockedByName = cornGhost ? cornGhost.name : 'Cornelius';
        preRollCallouts.push(['ANTIDOTE!', 'var(--uncommon)', `${blockedByName} blocks Cyboo's Spark on ${f.name}!`, tName === 'red' ? 'blue' : 'red']);
      } else {
        if (tName === 'red') redCount += 1;
        else blueCount += 1;
        const cybGhost = getSidelineGhost(team, 100);
        preRollCallouts.push(['SPARK!', 'var(--ghost-rare)', `${cybGhost ? cybGhost.name : 'Cyboo'} (sideline) — ${f.name} is at ${f.hp} HP! +1 bonus die!`, tName]);
        log(`<span class="log-ability">Cyboo</span> (sideline) — Spark! ${f.name} at ${f.hp} HP → +1 die!`);
      }
    }
  });

  // Explorer Jeff (455) — Treasure Hunter: sideline & in play, if holding 3+ different specials, +1 die
  // Negated by Cornelius (45) — Antidote (only when on sideline)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    const enemyTeamObj = team === B.red ? B.blue : B.red;
    const ejOnSideline = hasSideline(team, 455);
    const ejActive = f.id === 455 && !f.ko;
    if (!f.ko && (ejOnSideline || ejActive)) {
      const res = B[tName].resources;
      const types = ['moonstone','ice','fire','surge','healingSeed','luckyStone','firefly','burn'].filter(r => (res[r] || 0) > 0).length;
      if (types >= 3) {
        // Cornelius only blocks sideline abilities, not in-play
        if (ejOnSideline && hasSideline(enemyTeamObj, 45)) {
          const cornGhost = getSidelineGhost(enemyTeamObj, 45);
          preRollCallouts.push(['ANTIDOTE!', 'var(--uncommon)', `${cornGhost ? cornGhost.name : 'Cornelius'} blocks Explorer Jeff's Treasure Hunter!`, tName === 'red' ? 'blue' : 'red']);
          log(`<span class="log-ability">Cornelius</span> — Antidote! Explorer Jeff Treasure Hunter blocked.`);
        } else {
          if (tName === 'red') redCount += 1;
          else blueCount += 1;
          const loc = ejActive ? 'in play' : 'sideline';
          preRollCallouts.push(['TREASURE HUNTER!', 'var(--uncommon)', `Explorer Jeff (${loc}) — ${types} specials held! +1 die!`, tName]);
          log(`<span class="log-ability">Explorer Jeff</span> (${loc}) — Treasure Hunter! ${types} different specials → +1 die!`);
        }
      }
    }
  });

  // Shoo (13) — Alpine Air: while on the sideline, the active ghost gains +2 HP when HP < 4. Once per ghost.
  // Negated by Cornelius (45) — Antidote: if the enemy team has Cornelius on sideline, Alpine Air is blocked (once-per-ghost use NOT consumed).
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const enemyTeamObj = team === B.red ? B.blue : B.red;
    if (!f.ko && f.hp < 4 && hasSideline(team, 13) && !f.shooAlpineUsed) {
      const shooGhost = getSidelineGhost(team, 13);
      // Cornelius (45) — Antidote: block before consuming the once-per-ghost use
      if (hasSideline(enemyTeamObj, 45)) {
        const cornGhostShoo = getSidelineGhost(enemyTeamObj, 45);
        preRollCallouts.push(['ANTIDOTE!', 'var(--uncommon)', `${cornGhostShoo ? cornGhostShoo.name : 'Cornelius'} (sideline) — blocks Shoo's Alpine Air on ${f.name}!`, team === B.red ? 'blue' : 'red']);
        log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Shoo Alpine Air blocked for ${f.name}.`);
      } else {
        const shooHpBefore = f.hp;
        f.shooAlpineUsed = true;
        // Mr Filbert (59) — Mask Merchant: flip heal to damage when Filbert is on the enemy sideline
        if (hasSideline(enemyTeamObj, 59)) {
          f.hp = Math.max(0, f.hp - 2);
          if (f.hp <= 0) { f.hp = 0; f.ko = true; f.killedBy = 59; }
          preRollCallouts.push(['MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Alpine Air cursed! ${f.name} takes 2 damage! (${shooHpBefore}→${f.hp} HP)`, team === B.red ? 'blue' : 'red']);
          log(`<span class="log-ability">Mr Filbert</span> — Mask Merchant! Alpine Air flipped to damage. ${f.name} ${shooHpBefore} → ${f.hp} HP.`);
        } else {
          f.hp += 2;
          const overShoo = f.hp > f.maxHp;
          preRollCallouts.push(['ALPINE AIR!', 'var(--common)', `${shooGhost ? shooGhost.name : 'Shoo'} (sideline) — ${f.name} below 4 HP! +2 HP! (${shooHpBefore}→${f.hp}/${f.maxHp}${overShoo ? ' · overclocked!' : ''})`, team === B.red ? 'red' : 'blue']);
          log(`<span class="log-ability">Shoo</span> (sideline) — Alpine Air! ${f.name} at ${shooHpBefore} HP → +2 HP (${f.hp}/${f.maxHp}${overShoo ? ' overclocked!' : ''}). Used!`);
        }
      }
    }
  });

  // Needle (21) — Big Bro: while on the sideline, if Buttons (ID 8) is the active ghost, +1 die
  // Negated by Cornelius (45) — Antidote: if the enemy team has Cornelius on their sideline, Big Bro is blocked.
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    const enemyTeamObjNeedle = team === B.red ? B.blue : B.red;
    if (!f.ko && f.id === 8 && hasSideline(team, 21)) {
      if (hasSideline(enemyTeamObjNeedle, 45)) {
        const cornGhostNeedle = getSidelineGhost(enemyTeamObjNeedle, 45);
        preRollCallouts.push(['ANTIDOTE!', 'var(--uncommon)', `${cornGhostNeedle ? cornGhostNeedle.name : 'Cornelius'} (sideline) — blocks Needle's Big Bro on ${f.name}!`, tName === 'red' ? 'blue' : 'red']);
        log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Needle Big Bro blocked for ${f.name}.`);
      } else {
        if (tName === 'red') redCount += 1;
        else blueCount += 1;
        const needleGhost = getSidelineGhost(team, 21);
        preRollCallouts.push(['BIG BRO!', 'var(--common)', `${needleGhost ? needleGhost.name : 'Needle'} (sideline) — ${f.name} is in play! +1 bonus die!`, tName]);
        log(`<span class="log-ability">Needle</span> (sideline) — Big Bro! ${f.name} is in play → +1 die!`);
      }
    }
  });

  // Harrison extra die
  if (B.harrisonExtraDie.red) redCount += B.harrisonExtraDie.red;
  if (B.harrisonExtraDie.blue) blueCount += B.harrisonExtraDie.blue;

  // Chow (414) — Secret Ingredient: +2 dice from discarded seed, then consume
  if (B.chowExtraDie && B.chowExtraDie.red > 0) { redCount += B.chowExtraDie.red; B.chowExtraDie.red = 0; }
  if (B.chowExtraDie && B.chowExtraDie.blue > 0) { blueCount += B.chowExtraDie.blue; B.chowExtraDie.blue = 0; }

  // Miyoshi (454) — Bonzai!: +5 dice from pre-roll button click
  // Dylan (301) / Piper (107) negate Bonzai — refund the 4 HP sacrifice
  ['red', 'blue'].forEach(tName => {
    if (B.bonzaiBtnDice && B.bonzaiBtnDice[tName] > 0) {
      const team = tName === 'red' ? B.red : B.blue;
      const enemyTeam = tName === 'red' ? B.blue : B.red;
      const f = active(team);
      if (dylanNegates(enemyTeam)) {
        // Negate: refund HP and cancel dice
        if (f && f.id === 454 && !f.ko) {
          f.hp += 4;
        } else if (f && f.id === 454 && f.ko && f.killedBy === -1) {
          // Bonzai self-KO — revive
          f.ko = false; f.killedBy = null; f.hp = 4;
        }
        const enemyTName = tName === 'red' ? 'blue' : 'red';
        preRollCallouts.push(['BLOCKED!', 'var(--text2)', `${enemyTName.charAt(0).toUpperCase() + enemyTName.slice(1)} — Scarecrow/Slick Coat negates Bonzai!`, enemyTName]);
        log(`<span class="log-ability">${enemyTName.charAt(0).toUpperCase() + enemyTName.slice(1)}</span> — Dylan/Piper negates Miyoshi's Bonzai! HP refunded.`);
        B.piperBlockedThisRound[tName] = true;
        B.bonzaiBtnDice[tName] = 0;
      } else {
        if (tName === 'red') redCount += B.bonzaiBtnDice.red; else blueCount += B.bonzaiBtnDice.blue;
        B.bonzaiBtnDice[tName] = 0;
      }
    }
  });

  // Twyla (417) — Lucky Dance: MOVED to doLuckyReroll (v675) — bonus dice + seeds granted live when each stone is spent

  // Gordok (430) — River Terror: +1 die next roll after stealing (consumed after use)
  if (B.gordokDieBonus && B.gordokDieBonus.red > 0) {
    redCount += B.gordokDieBonus.red;
    preRollCallouts.push(['RIVER TERROR!', 'var(--rare)', `Gordok — stolen resources! +${B.gordokDieBonus.red} bonus die!`, 'red']);
    log(`<span class="log-ability">Gordok</span> — River Terror! +${B.gordokDieBonus.red} bonus die this roll.`);
    B.gordokDieBonus.red = 0;
  }
  if (B.gordokDieBonus && B.gordokDieBonus.blue > 0) {
    blueCount += B.gordokDieBonus.blue;
    preRollCallouts.push(['RIVER TERROR!', 'var(--rare)', `Gordok — stolen resources! +${B.gordokDieBonus.blue} bonus die!`, 'blue']);
    log(`<span class="log-ability">Gordok</span> — River Terror! +${B.gordokDieBonus.blue} bonus die this roll.`);
    B.gordokDieBonus.blue = 0;
  }

  // Foreman (451) — Blueprint: +1 die from previous win (consumed after use)
  if (B.foremanDieBonus && B.foremanDieBonus.red > 0) {
    redCount += B.foremanDieBonus.red;
    preRollCallouts.push(['BLUEPRINT!', 'var(--rare)', `Foreman — Win bonus! +${B.foremanDieBonus.red} die!`, 'red']);
    log(`<span class="log-ability">Foreman</span> — Blueprint! +${B.foremanDieBonus.red} bonus die this roll.`);
    B.foremanDieBonus.red = 0;
  }
  if (B.foremanDieBonus && B.foremanDieBonus.blue > 0) {
    blueCount += B.foremanDieBonus.blue;
    preRollCallouts.push(['BLUEPRINT!', 'var(--rare)', `Foreman — Win bonus! +${B.foremanDieBonus.blue} die!`, 'blue']);
    log(`<span class="log-ability">Foreman</span> — Blueprint! +${B.foremanDieBonus.blue} bonus die this roll.`);
    B.foremanDieBonus.blue = 0;
  }

  // Zork (463) — Stoke: consume committed dice from doZorkChoice
  if (B.zorkExtraDie && B.zorkExtraDie.red > 0) { redCount += B.zorkExtraDie.red; B.zorkExtraDie.red = 0; }
  if (B.zorkExtraDie && B.zorkExtraDie.blue > 0) { blueCount += B.zorkExtraDie.blue; B.zorkExtraDie.blue = 0; }

  // Flame Blade item: when swinging, +1 die
  if (B.flameBladeSwing && B.flameBladeSwing.red) {
    redCount += 1;
    preRollCallouts.push(['FLAME BLADE!', 'var(--rare)', `Flame Blade swinging — +1 die this roll!`, 'red']);
    log(`<span class="log-ability">Flame Blade</span> — swinging! <span class="log-ms">+1 die</span> this roll.`);
  }
  if (B.flameBladeSwing && B.flameBladeSwing.blue) {
    blueCount += 1;
    preRollCallouts.push(['FLAME BLADE!', 'var(--rare)', `Flame Blade swinging — +1 die this roll!`, 'blue']);
    log(`<span class="log-ability">Flame Blade</span> — swinging! <span class="log-ms">+1 die</span> this roll.`);
  }

  // Young Cap (429) — Energize: +1 die per Healing Seed spent this pre-roll
  const ycRed = active(B.red);
  if (ycRed && ycRed.id === 429 && !ycRed.ko && ycRed.youngCapDieBonus > 0) {
    redCount += ycRed.youngCapDieBonus;
    ycRed.youngCapDieBonus = 0;
  }
  const ycBlue = active(B.blue);
  if (ycBlue && ycBlue.id === 429 && !ycBlue.ko && ycBlue.youngCapDieBonus > 0) {
    blueCount += ycBlue.youngCapDieBonus;
    ycBlue.youngCapDieBonus = 0;
  }

  // Kairan (68) — Let's Dance: +1 die from previous round's doubles bonus
  // Guard: only apply the bonus if Kairan is STILL the active ghost — die is personal to Kairan,
  // not the team. If Kairan was KO'd or swapped since earning the bonus, the die is lost.
  if (B.letsDanceBonus && B.letsDanceBonus.red > 0) {
    if (active(B.red).id === 68 && !active(B.red).ko) {
      redCount += B.letsDanceBonus.red;
      preRollCallouts.push(["LET'S DANCE!", 'var(--rare)', `${active(B.red).name} — Last round's doubles! +${B.letsDanceBonus.red} bonus die!`, 'red']);
      log(`<span class="log-ability">${active(B.red).name}</span> — Let's Dance! +${B.letsDanceBonus.red} bonus die from last doubles!`);
    }
    B.letsDanceBonus.red = 0;
  }
  if (B.letsDanceBonus && B.letsDanceBonus.blue > 0) {
    if (active(B.blue).id === 68 && !active(B.blue).ko) {
      blueCount += B.letsDanceBonus.blue;
      preRollCallouts.push(["LET'S DANCE!", 'var(--rare)', `${active(B.blue).name} — Last round's doubles! +${B.letsDanceBonus.blue} bonus die!`, 'blue']);
      log(`<span class="log-ability">${active(B.blue).name}</span> — Let's Dance! +${B.letsDanceBonus.blue} bonus die from last doubles!`);
    }
    B.letsDanceBonus.blue = 0;
  }

  // Winston (15) — Scheme: +2 dice from last round's win
  if (B.winstonDiceBonus && B.winstonDiceBonus.red > 0) {
    if (active(B.red).id === 15 && !active(B.red).ko) {
      redCount += B.winstonDiceBonus.red;
      preRollCallouts.push(['SCHEME!', 'var(--common)', `Winston — +${B.winstonDiceBonus.red} bonus dice!`, 'red']);
      log(`<span class="log-ability">Winston</span> — Scheme! +${B.winstonDiceBonus.red} bonus dice from last win!`);
    }
    B.winstonDiceBonus.red = 0;
  }
  if (B.winstonDiceBonus && B.winstonDiceBonus.blue > 0) {
    if (active(B.blue).id === 15 && !active(B.blue).ko) {
      blueCount += B.winstonDiceBonus.blue;
      preRollCallouts.push(['SCHEME!', 'var(--common)', `Winston — +${B.winstonDiceBonus.blue} bonus dice!`, 'blue']);
      log(`<span class="log-ability">Winston</span> — Scheme! +${B.winstonDiceBonus.blue} bonus dice from last win!`);
    }
    B.winstonDiceBonus.blue = 0;
  }

  // Lucas (433) — Kindling: +1 die next roll after Miracle resurrection (consumed after use)
  if (B.lucasKindlingBonus && B.lucasKindlingBonus.red > 0) {
    redCount += B.lucasKindlingBonus.red;
    preRollCallouts.push(['KINDLING!', 'var(--rare)', `Lucas — Kindling! +${B.lucasKindlingBonus.red} bonus die!`, 'red']);
    log(`<span class="log-ability">Lucas</span> — Kindling! +${B.lucasKindlingBonus.red} bonus die this roll.`);
    B.lucasKindlingBonus.red = 0;
  }
  if (B.lucasKindlingBonus && B.lucasKindlingBonus.blue > 0) {
    blueCount += B.lucasKindlingBonus.blue;
    preRollCallouts.push(['KINDLING!', 'var(--rare)', `Lucas — Kindling! +${B.lucasKindlingBonus.blue} bonus die!`, 'blue']);
    log(`<span class="log-ability">Lucas</span> — Kindling! +${B.lucasKindlingBonus.blue} bonus die this roll.`);
    B.lucasKindlingBonus.blue = 0;
  }

  // Haywire (78) — Wild Chords: permanent +1 die bonus (awarded once per game on triples, always applied)
  if (B.haywireBonus && B.haywireBonus.red > 0) redCount += B.haywireBonus.red;
  if (B.haywireBonus && B.haywireBonus.blue > 0) blueCount += B.haywireBonus.blue;

  // Pip (418) — Toasted: permanent die removal applied to opponent
  if (B.pipDieRemoval && B.pipDieRemoval.red > 0) redCount = Math.max(1, redCount - B.pipDieRemoval.red);
  if (B.pipDieRemoval && B.pipDieRemoval.blue > 0) blueCount = Math.max(1, blueCount - B.pipDieRemoval.blue);

  // Mable Stadango (446) — Hex: consume die removal from Burn spend (applied to opponent's count)
  // FIX: callout name corrected from "Forest Spirit" to "Mable Stadango"
  if (B.hexDieRemoval && B.hexDieRemoval.red > 0) {
    redCount = Math.max(1, redCount - B.hexDieRemoval.red);
    preRollCallouts.push(['HEX!', 'var(--uncommon)', `Mable Stadango — Hex! Red loses ${B.hexDieRemoval.red} die this roll!`, 'blue']);
    log(`<span class="log-ability">Mable Stadango</span> — Hex! <span class="log-dmg">Red loses ${B.hexDieRemoval.red} die this roll!</span>`);
    B.hexDieRemoval.red = 0;
  }
  if (B.hexDieRemoval && B.hexDieRemoval.blue > 0) {
    blueCount = Math.max(1, blueCount - B.hexDieRemoval.blue);
    preRollCallouts.push(['HEX!', 'var(--uncommon)', `Mable Stadango — Hex! Blue loses ${B.hexDieRemoval.blue} die this roll!`, 'red']);
    log(`<span class="log-ability">Mable Stadango</span> — Hex! <span class="log-dmg">Blue loses ${B.hexDieRemoval.blue} die this roll!</span>`);
    B.hexDieRemoval.blue = 0;
  }

  // Professor Hawking (447) — Wisdom: +2 dice while holding a Moonstone (not consumed)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    if (f.id === 447 && !f.ko && team.resources.moonstone > 0) {
      if (tName === 'red') redCount += 2; else blueCount += 2;
      preRollCallouts.push(['WISDOM!', 'var(--rare)', `${f.name} — Holding Moonstone! +2 dice!`, tName]);
      log(`<span class="log-ability">${f.name}</span> — Wisdom! Holding <span class="log-ms">Moonstone</span> → +2 dice!`);
    }
  });

  // Willow (435) — Joy of Painting: Sideline & In Play: +1 die if you lost the last roll
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tNameW = team === B.red ? 'red' : 'blue';
    const enemyName = tNameW === 'red' ? 'blue' : 'red';
    const enemy = B[enemyName];
    const hasWillowActive = f.id === 435 && !f.ko;
    const hasWillowSideline = hasSideline(team, 435);

    // Cornelius (45) on enemy sideline negates Willow's sideline effect (not active)
    if (hasWillowSideline && !hasWillowActive && hasSideline(enemy, 45)) {
      if (B.willowLostLast[tNameW]) {
        const cornG = getSidelineGhost(enemy, 45);
        preRollCallouts.push(['ANTIDOTE!', 'var(--uncommon)', `${cornG ? cornG.name : 'Cornelius'} blocks Willow's Joy of Painting!`, enemyName]);
        log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Willow Joy of Painting blocked!`);
      }
      // Skip — Cornelius negates
    } else if ((hasWillowActive || hasWillowSideline) && B.willowLostLast[tNameW]) {
      if (tNameW === 'red') redCount++; else blueCount++;
      const wName = hasWillowActive ? f.name : (getSidelineGhost(team, 435) || {}).name || 'Willow';
      const wLabel = hasWillowActive ? '' : ' (sideline)';
      preRollCallouts.push(['JOY OF PAINTING!', 'var(--ghost-rare)', `${wName}${wLabel} — Lost last roll! +1 die!`, tNameW]);
      log(`<span class="log-ability">${wName}${wLabel}</span> — Joy of Painting! Lost last roll → +1 die!`);
      // Knight Terror (401) / Knight Light (402) react to this ability
      checkKnightEffects(tNameW, wName);
    }
  });

  // Dream Cat (28) — Jinx: consume last round's both-doubles bonus
  if (B.dreamCatBonus && B.dreamCatBonus.red > 0) {
    const dcRed = active(B.red);
    redCount += B.dreamCatBonus.red;
    if (dcRed && dcRed.id === 28 && !dcRed.ko) {
      preRollCallouts.push(['JINX!', 'var(--common)', `${dcRed.name} — Both rolled doubles! +${B.dreamCatBonus.red} bonus die!`, 'red']);
      log(`<span class="log-ability">${dcRed.name}</span> — Jinx! Both doubles → +${B.dreamCatBonus.red} bonus die this round.`);
    }
    B.dreamCatBonus.red = 0;
  }
  if (B.dreamCatBonus && B.dreamCatBonus.blue > 0) {
    const dcBlue = active(B.blue);
    blueCount += B.dreamCatBonus.blue;
    if (dcBlue && dcBlue.id === 28 && !dcBlue.ko) {
      preRollCallouts.push(['JINX!', 'var(--common)', `${dcBlue.name} — Both rolled doubles! +${B.dreamCatBonus.blue} bonus die!`, 'blue']);
      log(`<span class="log-ability">${dcBlue.name}</span> — Jinx! Both doubles → +${B.dreamCatBonus.blue} bonus die this round.`);
    }
    B.dreamCatBonus.blue = 0;
  }

  // Nick & Knack (409) — Knick Knack: dice bonus removed (ability is pre-roll steal now)

  // Zach (87) — Craftsman: while on sideline, Guard Thomas gets +1 die each turn
  // Negated by Cornelius (45) — Antidote: if the enemy team has Cornelius on their sideline, die bonus is blocked.
  ['red', 'blue'].forEach(tNameZ => {
    const teamZ = B[tNameZ];
    const fZ = active(teamZ);
    const enemyTeamObjZ = teamZ === B.red ? B.blue : B.red;
    if (fZ.id === 41 && !fZ.ko && hasSideline(teamZ, 87)) {
      if (hasSideline(enemyTeamObjZ, 45)) {
        const cornGhostZ = getSidelineGhost(enemyTeamObjZ, 45);
        preRollCallouts.push(['ANTIDOTE!', 'var(--uncommon)', `${cornGhostZ ? cornGhostZ.name : 'Cornelius'} blocks Zach's Craftsman die bonus!`, tNameZ === 'red' ? 'blue' : 'red']);
        log(`<span class="log-ability">Cornelius</span> (sideline) — Antidote! Zach Craftsman die bonus blocked for ${fZ.name}.`);
      } else {
        if (tNameZ === 'red') redCount++; else blueCount++;
        preRollCallouts.push(['CRAFTSMAN!', 'var(--rare)', `Zach (sideline) — Guard Thomas +1 die!`, tNameZ]);
        log(`<span class="log-ability">Zach</span> (sideline) — Craftsman! Guard Thomas +1 die.`);
      }
    }
  });

  // Wandering Sue (84) — Hidden Weakness: +1 die if enemy has more HP
  ['red', 'blue'].forEach(tNameSue => {
    const fSue = active(B[tNameSue]);
    if (fSue.id === 84 && !fSue.ko) {
      const oppSue = active(B[tNameSue === 'red' ? 'blue' : 'red']);
      if (oppSue && oppSue.hp > fSue.hp) {
        if (tNameSue === 'red') redCount++; else blueCount++;
        preRollCallouts.push(['HIDDEN WEAKNESS!', 'var(--uncommon)', `${fSue.name} — enemy has more HP! +1 die!`, tNameSue]);
        log(`<span class="log-ability">${fSue.name}</span> — Hidden Weakness! Enemy HP (${oppSue.hp}) > Sue (${fSue.hp}) → +1 die!`);
      }
    }
  });

  // Scallywags (19) — Frenzy: consume last round's all-under-4 bonus
  if (B.scallywagsFrenzyBonus && B.scallywagsFrenzyBonus.red > 0) {
    const scRed = active(B.red);
    redCount += B.scallywagsFrenzyBonus.red;
    if (scRed && scRed.id === 19 && !scRed.ko) {
      preRollCallouts.push(['FRENZY!', 'var(--common)', `${scRed.name} — All dice were under 4! +${B.scallywagsFrenzyBonus.red} bonus die!`, 'red']);
      log(`<span class="log-ability">${scRed.name}</span> — Frenzy! All dice under 4 last round → +${B.scallywagsFrenzyBonus.red} bonus die.`);
    }
    B.scallywagsFrenzyBonus.red = 0;
  }
  if (B.scallywagsFrenzyBonus && B.scallywagsFrenzyBonus.blue > 0) {
    const scBlue = active(B.blue);
    blueCount += B.scallywagsFrenzyBonus.blue;
    if (scBlue && scBlue.id === 19 && !scBlue.ko) {
      preRollCallouts.push(['FRENZY!', 'var(--common)', `${scBlue.name} — All dice were under 4! +${B.scallywagsFrenzyBonus.blue} bonus die!`, 'blue']);
      log(`<span class="log-ability">${scBlue.name}</span> — Frenzy! All dice under 4 last round → +${B.scallywagsFrenzyBonus.blue} bonus die.`);
    }
    B.scallywagsFrenzyBonus.blue = 0;
  }

  // Committed Surge: +1 die per surge
  if (B.committed.red.surge > 0) {
    redCount += B.committed.red.surge;
    log(`<span class="log-ability">Red</span> committed <span class="log-ms">${B.committed.red.surge} Surge</span> → +${B.committed.red.surge} dice!`);
    const borisRedG = B.red.ghosts.find(g => g.id === 343 && !g.ko);
    if (borisRedG) {
      const borisRedPre = borisRedG.hp;
      if (hasSideline(B.blue, 59)) {
        // Mr Filbert (59) — Mask Merchant: flip Boris Fortify heal to damage
        borisRedG.hp = Math.max(0, borisRedG.hp - 2);
        if (borisRedG.hp <= 0) { borisRedG.hp = 0; borisRedG.ko = true; borisRedG.killedBy = 59; }
        preRollCallouts.push(['MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Fortify cursed! ${borisRedG.name} takes 2 damage! (${borisRedPre}→${borisRedG.hp} HP)`, 'blue']);
        log(`<span class="log-ability">Mr Filbert</span> — Mask Merchant! Boris Fortify flipped to damage. ${borisRedG.name} ${borisRedPre} → ${borisRedG.hp} HP.`);
      } else {
        triggerBorisHook(B.red);
        const oc = borisRedG.hp > borisRedG.maxHp;
        preRollCallouts.push(['FORTIFY!', 'var(--uncommon)', `${borisRedG.name} — Surge spent! +2 HP (${borisRedPre}→${borisRedG.hp}/${borisRedG.maxHp}${oc ? ' · overclocked!' : ''})`, 'red']);
      }
    }
  }
  if (B.committed.blue.surge > 0) {
    blueCount += B.committed.blue.surge;
    log(`<span class="log-ability">Blue</span> committed <span class="log-ms">${B.committed.blue.surge} Surge</span> → +${B.committed.blue.surge} dice!`);
    const borisBlueG = B.blue.ghosts.find(g => g.id === 343 && !g.ko);
    if (borisBlueG) {
      const borisBlueRePre = borisBlueG.hp;
      if (hasSideline(B.red, 59)) {
        // Mr Filbert (59) — Mask Merchant: flip Boris Fortify heal to damage
        borisBlueG.hp = Math.max(0, borisBlueG.hp - 2);
        if (borisBlueG.hp <= 0) { borisBlueG.hp = 0; borisBlueG.ko = true; borisBlueG.killedBy = 59; }
        preRollCallouts.push(['MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Fortify cursed! ${borisBlueG.name} takes 2 damage! (${borisBlueRePre}→${borisBlueG.hp} HP)`, 'red']);
        log(`<span class="log-ability">Mr Filbert</span> — Mask Merchant! Boris Fortify flipped to damage. ${borisBlueG.name} ${borisBlueRePre} → ${borisBlueG.hp} HP.`);
      } else {
        triggerBorisHook(B.blue);
        const oc = borisBlueG.hp > borisBlueG.maxHp;
        preRollCallouts.push(['FORTIFY!', 'var(--uncommon)', `${borisBlueG.name} — Surge spent! +2 HP (${borisBlueRePre}→${borisBlueG.hp}/${borisBlueG.maxHp}${oc ? ' · overclocked!' : ''})`, 'blue']);
      }
    }
  }

  // Ice Blade item: when swinging (toggle or committed), +1 die (in addition to post-roll +2 dmg on win)
  if (B.committed.red.zainBlade > 0 || (B.iceBladeSwing && B.iceBladeSwing.red)) {
    if (B.iceBladeForgedPermanent && B.iceBladeForgedPermanent.red) {
      redCount += 1;
      preRollCallouts.push(['ICE BLADE!', 'var(--ghost-rare)', `Ice Blade swinging — +1 die this roll!`, 'red']);
      log(`<span class="log-ability">Ice Blade</span> — swinging! <span class="log-ice">+1 die</span> this roll (and +2 damage on win).`);
    }
  }
  if (B.committed.blue.zainBlade > 0 || (B.iceBladeSwing && B.iceBladeSwing.blue)) {
    if (B.iceBladeForgedPermanent && B.iceBladeForgedPermanent.blue) {
      blueCount += 1;
      preRollCallouts.push(['ICE BLADE!', 'var(--ghost-rare)', `Ice Blade swinging — +1 die this roll!`, 'blue']);
      log(`<span class="log-ability">Ice Blade</span> — swinging! <span class="log-ice">+1 die</span> this roll (and +2 damage on win).`);
    }
  }

  // Katrina (70) — Seeker: before rolling, if Katrina has less HP than the enemy active ghost, gain 1 HP
  // Mr Filbert (59) — Mask Merchant: flip the +1 HP heal to -1 damage when Filbert is on the enemy sideline.
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    if (f.id === 70 && !f.ko) {
      const oppG = team === B.red ? active(B.blue) : active(B.red);
      if (f.hp < oppG.hp) {
        const seekerHpBefore = f.hp;
        const enemyTeamObj = team === B.red ? B.blue : B.red;
        if (hasSideline(enemyTeamObj, 59)) {
          f.hp = Math.max(0, f.hp - 1);
          if (f.hp <= 0) { f.hp = 0; f.ko = true; f.killedBy = 59; }
          preRollCallouts.push(['MASK MERCHANT!', 'var(--uncommon)', `Mr Filbert — Seeker cursed! ${f.name} takes 1 damage! (${seekerHpBefore}→${f.hp} HP)`, team === B.red ? 'blue' : 'red']);
          log(`<span class="log-ability">Mr Filbert</span> — Mask Merchant! Seeker flipped to damage. ${f.name} ${seekerHpBefore} → ${f.hp} HP.`);
        } else {
          f.hp += 1;
          const seekerOver = f.hp > f.maxHp;
          preRollCallouts.push(['SEEKER!', 'var(--rare)', `${f.name} — HP below enemy! +1 HP (${seekerHpBefore}→${f.hp}/${f.maxHp}${seekerOver ? ' · overclocked!' : ''})`, team === B.red ? 'red' : 'blue']);
          log(`<span class="log-ability">${f.name}</span> — Seeker! HP below enemy → +1 HP (${f.hp}/${f.maxHp}${seekerOver ? ' overclocked!' : ''})`);
        }
      }
    }
  });

  // Eli (459) — Steady: before rolling, gain +1 Lucky Stone
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    if (f.id === 459 && !f.ko) {
      const tName = team === B.red ? 'red' : 'blue';
      team.resources.luckyStone = (team.resources.luckyStone || 0) + 1;
      preRollCallouts.push(['STEADY!', 'var(--common)', `${f.name} — +1 Lucky Stone! (${team.resources.luckyStone} total)`, tName]);
      log(`<span class="log-ability">${f.name}</span> — Steady! +1 Lucky Stone (${team.resources.luckyStone} total)`);
      collectKC(tName, f.name);
      // Sandwiches (33) — Dependable: opponent mirrors the Lucky Stone gain
      if (hasOnTeam(opp(team), 33)) {
        const _sandOpp = opp(team);
        _sandOpp.resources.luckyStone = (_sandOpp.resources.luckyStone || 0) + 1;
        preRollCallouts.push(['DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Steady! +1 Lucky Stone! (${_sandOpp.resources.luckyStone} total)`, tName === 'red' ? 'blue' : 'red']);
      }
    }
  });

  // Yawn Eater (464) — Feast: +1 die for each sideline ability on the enemy sideline
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    if (f.id === 464 && !f.ko) {
      const enemyTeam = opp(team);
      // Count enemy sideline ghosts that have sideline abilities
      const sidelineCount = enemyTeam.ghosts.filter((g, i) => {
        if (i === enemyTeam.activeIdx || g.ko) return false;
        const gd = ghostData(g.id);
        return gd && gd.abilityDesc && (gd.abilityDesc.includes('Sideline') || gd.abilityDesc.includes('sideline'));
      }).length;
      if (sidelineCount > 0) {
        if (tName === 'red') redCount += sidelineCount;
        else blueCount += sidelineCount;
        preRollCallouts.push(['FEAST!', 'var(--uncommon)', `${f.name} — ${sidelineCount} enemy sideline effect${sidelineCount > 1 ? 's' : ''}! +${sidelineCount} dice!`, tName]);
        log(`<span class="log-ability">${f.name}</span> — Feast! ${sidelineCount} enemy sideline effect${sidelineCount > 1 ? 's' : ''} → +${sidelineCount} dice!`);
      }
    }
  });

  // Antoinette (82) — Grace: roll as many dice as your opponent rolls. +1 damage on doubles.
  // Applied last so all other modifiers (Surge, Piper, Redd, etc.) are already baked into counts
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    if (f.id === 82 && !f.ko) {
      const myCount   = tName === 'red' ? redCount  : blueCount;
      const oppCount  = tName === 'red' ? blueCount : redCount;
      if (oppCount > myCount) {
        if (tName === 'red') redCount  = oppCount;
        else                 blueCount = oppCount;
        preRollCallouts.push(['GRACE!', 'var(--rare)', `${f.name} — matching opponent's ${oppCount} dice!`, tName]);
        log(`<span class="log-ability">${f.name}</span> — Grace! Matching opponent's ${oppCount} dice!`);
      }
    }
  });

  // Outlaw (43) — Thief: consume stolen-die penalty from last round (applied AFTER Grace so it can't be mirrored back)
  [B.red, B.blue].forEach(team => {
    const tName = team === B.red ? 'red' : 'blue';
    if (B.outlawStolenDie && B.outlawStolenDie[tName] > 0) {
      // This team's Outlaw removes an enemy die — decrement enemy count
      // intentional: spec says "remove", not "steal" — no transfer to Outlaw; subtract-only is correct
      const enemyTName = tName === 'red' ? 'blue' : 'red';
      if (enemyTName === 'red') redCount = Math.max(1, redCount - B.outlawStolenDie[tName]);
      else blueCount = Math.max(1, blueCount - B.outlawStolenDie[tName]);
      const outF = active(team);
      const enemyF = active(enemyTName === 'red' ? B.red : B.blue);
      preRollCallouts.push(['THIEF!', 'var(--uncommon)', `${outF.name} — removed 1 die from ${enemyF.name}! They roll 1 fewer die!`, tName]);
      log(`<span class="log-ability">${outF.name}</span> — Thief! ${enemyF.name} rolls 1 fewer die this round!`);
      B.outlawStolenDie[tName] = 0;
    }
  });

  // Suspicious Jeff (61) — Snicker: sideline die-theft from last round's win (stacks with Outlaw)
  // Cornelius (45) Antidote blocks the die theft if on the enemy's sideline.
  [B.red, B.blue].forEach(team => {
    const tName = team === B.red ? 'red' : 'blue';
    if (B.jeffSnicker && B.jeffSnicker[tName] > 0) {
      const enemyTName = tName === 'red' ? 'blue' : 'red';
      const enemyTeamObj = enemyTName === 'red' ? B.red : B.blue;
      const cornBlocksJeff = hasSideline(enemyTeamObj, 45);
      if (cornBlocksJeff) {
        const cornF = getSidelineGhost(enemyTeamObj, 45);
        const cornName = cornF ? cornF.name : 'Cornelius';
        preRollCallouts.push(['ANTIDOTE!', 'var(--uncommon)', `${cornName} neutralizes Suspicious Jeff's Snicker — die theft blocked!`, enemyTName]);
        log(`<span class="log-ability">Cornelius</span> — Antidote! Suspicious Jeff's Snicker die theft blocked!`);
      } else {
        if (enemyTName === 'red') redCount = Math.max(1, redCount - B.jeffSnicker[tName]);
        else blueCount = Math.max(1, blueCount - B.jeffSnicker[tName]);
        if (tName === 'red') redCount += B.jeffSnicker[tName];
        else blueCount += B.jeffSnicker[tName];
        const jeffF = getSidelineGhost(team, 61);
        const enemyF = active(enemyTeamObj);
        const jeffName = jeffF ? jeffF.name : 'Suspicious Jeff';
        preRollCallouts.push(['SNICKER!', 'var(--uncommon)', `${jeffName} (sideline) — Win stole 1 die from ${enemyF ? enemyF.name : 'opponent'}! They roll 1 fewer die!`, tName]);
        log(`<span class="log-ability">${jeffName}</span> — Snicker! ${enemyF ? enemyF.name : 'Opponent'} rolls 1 fewer die this round!`);
      }
      B.jeffSnicker[tName] = 0;
    }
  });

  // Hugo (52) — Wreckage: consume die penalty for attacking Hugo last round (applied after Outlaw so both stack correctly)
  [B.red, B.blue].forEach(team => {
    const tName = team === B.red ? 'red' : 'blue';
    if (B.hugoWreckage && B.hugoWreckage[tName] > 0) {
      // This team attacked Hugo — pay the die cost
      if (tName === 'red') redCount = Math.max(1, redCount - B.hugoWreckage[tName]);
      else blueCount = Math.max(1, blueCount - B.hugoWreckage[tName]);
      const hugoF = active(opp(team)); // Hugo is on the opposing team
      const penF = active(team);
      preRollCallouts.push(['WRECKAGE!', 'var(--uncommon)', `${hugoF ? hugoF.name + ' — Wreckage!' : 'Wreckage!'} ${penF.name} rolls 1 fewer die for attacking Hugo!`, tName === 'red' ? 'blue' : 'red']);
      log(`<span class="log-ability">Hugo</span> — Wreckage! ${penF.name} rolls 1 fewer die this round!`);
      B.hugoWreckage[tName] = 0;
    }
  });

  // Floop (20) — Muck: consume die penalty for rolling doubles last round while Floop was watching (stacks with Outlaw/Jeff/Hugo)
  [B.red, B.blue].forEach(team => {
    const tName = team === B.red ? 'red' : 'blue';
    if (B.floopMuck && B.floopMuck[tName] > 0) {
      // This team rolled doubles last round while Floop was the opponent — pay the die cost
      if (tName === 'red') redCount = Math.max(1, redCount - B.floopMuck[tName]);
      else blueCount = Math.max(1, blueCount - B.floopMuck[tName]);
      const floopF = active(opp(team)); // Floop is on the opposing team
      const penF = active(team);
      preRollCallouts.push(['MUCK!', 'var(--common)', `${floopF ? floopF.name + ' — Muck!' : 'Muck!'} ${penF.name} rolled doubles last round — they lose 1 die!`, tName === 'red' ? 'blue' : 'red']);
      log(`<span class="log-ability">${floopF ? floopF.name : 'Floop'}</span> — Muck! ${penF.name} rolled doubles → 1 fewer die this round.`);
      B.floopMuck[tName] = 0;
    }
  });

  // Marcus (57) — Glacial Pounding: consume bonus dice from last round's big hit (applied last so it can't be stolen by Outlaw)
  // Bonus goes to the PLAYER — whoever is active gets the dice, even if Marcus died from the hit
  [B.red, B.blue].forEach(team => {
    const tName = team === B.red ? 'red' : 'blue';
    if (B.marcusGlacialBonus && B.marcusGlacialBonus[tName] > 0) {
      const curF = active(team);
      if (curF && !curF.ko) {
        const bonus = B.marcusGlacialBonus[tName];
        if (tName === 'red') redCount += bonus;
        else blueCount += bonus;
        preRollCallouts.push(['GLACIAL POUNDING!', 'var(--uncommon)', `Marcus's revenge! ${curF.name} gets +${bonus} bonus dice!`, tName]);
        log(`<span class="log-ability">Marcus</span> — Glacial Pounding! ${curF.name} gets +${bonus} bonus dice from last round's big hit!`);
      }
      B.marcusGlacialBonus[tName] = 0;
    }
  });

  // Logey (26) — Heinous: reduce this team's die count by locked dice from last round
  [B.red, B.blue].forEach(team => {
    const tName = team === B.red ? 'red' : 'blue';
    if (B.logeyLockout && B.logeyLockout[tName] > 0) {
      const locked = B.logeyLockout[tName];
      if (tName === 'red') redCount = Math.max(1, redCount - locked);
      else blueCount = Math.max(1, blueCount - locked);
      const f = active(team);
      const loF = active(opp(team));
      preRollCallouts.push(['HEINOUS!', 'var(--common)', `${f.name} — ${locked} dice locked out by ${loF ? loF.name + "'s" : ''} Heinous! Rolling fewer dice!`, tName === 'red' ? 'blue' : 'red']);
      log(`<span class="log-ability">${f.name}</span> — Heinous lockout! ${locked} dice unavailable this round.`);
      B.logeyLockout[tName] = 0;
    }
  });

  // Sophia (457) — Mask of Night: roll the same number of dice as the enemy ghost
  ['red', 'blue'].forEach(tName => {
    if (B.sophiaMask[tName] === 'night' && B.sophiaMaskActive[tName]) {
      const myCount = tName === 'red' ? redCount : blueCount;
      const oppCount = tName === 'red' ? blueCount : redCount;
      if (myCount !== oppCount) {
        if (tName === 'red') redCount = oppCount;
        else blueCount = oppCount;
        const f = active(B[tName]);
        preRollCallouts.push(['MASK OF NIGHT!', 'var(--rare)', `🌙 Mask of Night — ${f.name} mirrors the enemy! Rolling ${oppCount} dice!`, tName]);
        log(`<span class="log-ability">Mask of Night</span> — ${f.name} rolls ${oppCount} dice (matching opponent)!`);
      }
    }
  });

  // Fredrick (27) — Careful: when Fredrick is active, opponent may only roll up to 3 dice (applied last so it overrides all bonuses)
  [B.red, B.blue].forEach(team => {
    const fredF = active(team);
    if (fredF && fredF.id === 27 && !fredF.ko) {
      const enemyTName = (team === B.red) ? 'blue' : 'red';
      const currentEnemyCount = enemyTName === 'red' ? redCount : blueCount;
      if (currentEnemyCount > 3) {
        if (enemyTName === 'red') redCount = 3;
        else blueCount = 3;
        const enemyF = active(team === B.red ? B.blue : B.red);
        preRollCallouts.push(['CAREFUL!', 'var(--common)', `${fredF.name} — Careful! ${enemyF ? enemyF.name : 'Opponent'} capped at 3 dice!`, enemyTName === 'red' ? 'blue' : 'red']);
        log(`<span class="log-ability">${fredF.name}</span> — Careful! Opponent capped at 3 dice this round.`);
      }
    }
  });

  // Patrick (10) — Stone Form: "Don't roll." Forced LAST so no other modifier restores dice.
  // With 0 dice, classify returns type:'none' which auto-loses to any real roll. The existing
  // Stone Form singles-counter at resolveRound ~8055 still fires: when opponent rolled singles,
  // Patrick negates the damage and deals 3 back; other roll types deal normal damage to Patrick.
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    if (f.id === 10 && !f.ko) {
      if (tName === 'red') redCount = 0;
      else blueCount = 0;
      preRollCallouts.push(['STONE FORM!', 'var(--common)', `${f.name} — Don't roll! Singles → negate + 3 counter!`, tName]);
      log(`<span class="log-ability">${f.name}</span> — Stone Form! Doesn't roll this round.`);
    }
  });

  // Late pre-roll KO guard — Boris Fortify and Katrina Seeker run AFTER the early preRollKO
  // check at line 6070, so a Filbert (59) curse that KOs the active ghost during those blocks
  // would fall through to the roll phase with a dead ghost. This second check mirrors the
  // early guard exactly: flush callouts → ko-pause → handleKOs().
  const latePreRollKO = [B.red, B.blue].some(t => active(t).ko);
  if (latePreRollKO && preRollCallouts.length > 0) {
    B.phase = 'ko-pause';
    preRollCallouts.forEach((c, i) => {
      setTimeout(() => showAbilityCallout(c[0], c[1], c[2], c[3]), i * spd(1500));
    });
    refundCommitted();
    setTimeout(() => handleKOs(), preRollCallouts.length * 1500);
    return;
  }
  if (latePreRollKO && handleKOs()) {
    refundCommitted();
    return;
  }

  // Store pre-roll data for per-click rolling
  B.preRoll = {
    red: { count: redCount, override: hankOverride.red, dice: null },
    blue: { count: blueCount, override: hankOverride.blue, dice: null }
  };

  // If Timber pending, update the stored counts reference so modal callback can adjust
  if (B.timberPending) {
    B.timberPending.preRollCalloutCount = preRollCallouts.length;
  }

  // If Ryder pending, update callout count so modal shows after callouts finish
  if (B.riderPending) {
    B.riderPending.preRollCalloutCount = preRollCallouts.length;
  }

  // Drain pre-roll callouts sequentially — each plays for 1.4s before the next fires
  preRollCallouts.forEach((c, i) => {
    setTimeout(() => showAbilityCallout(c[0], c[1], c[2], c[3]), i * spd(1500));
  });

  renderBattle();
  return preRollCallouts.length; // caller uses this to defer dice until all callouts clear
}

// ========================================
// POST-ROLL TRIGGERS (split out for staged timing)
// ========================================
function doPostRollAndResolve(redDice, blueDice) {
  // Queue post-roll ability callouts so they play one at a time
  abilityQueue = [];
  abilityQueueMode = true;

  // Shade's Shadow (205) — MOVED TO PRE-ROLL (doPreRollSetup)

  // Maisie (458) — Lucky: all 1s count as 5s (mutate dice FIRST, before any other post-roll reads them)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tName = team === B.red ? 'red' : 'blue';
    if (f.id === 458 && !f.ko) {
      const dice = tName === 'red' ? redDice : blueDice;
      let converted = 0;
      for (let i = 0; i < dice.length; i++) {
        if (dice[i] === 1) { dice[i] = 5; converted++; }
      }
      dice.sort((a, b) => a - b);
      if (converted > 0) {
        queueAbility('LUCKY!', 'var(--ghost-rare)', `${f.name} — ${converted} one${converted > 1 ? 's' : ''} became 5${converted > 1 ? 's' : ''}! 🍀`, () => { renderDice(redDice, blueDice); renderBattle(); }, tName);
        log(`<span class="log-ability">${f.name}</span> — Lucky! ${converted} one${converted > 1 ? 's' : ''} → 5${converted > 1 ? 's' : ''}! 🍀`);
      }
    }
  });

  // Sophia (457) — Mask of Day: gain 1 Burn for each 1 or 2 you roll
  ['red', 'blue'].forEach(tName => {
    if (B.sophiaMask[tName] === 'day' && B.sophiaMaskActive[tName]) {
      const team = tName === 'red' ? B.red : B.blue;
      const dice = tName === 'red' ? redDice : blueDice;
      const lowRolls = countVal(dice, 1) + countVal(dice, 2);
      if (lowRolls > 0) {
        const _modLow = lowRolls;
        const _modTeam = team;
        const _modTName = tName;
        const f = active(team);
        queueAbility('MASK OF DAY!', 'var(--rare)', `☀️ Mask of Day — ${f.name} rolled ${lowRolls} low die${lowRolls>1?'s':''}! +${lowRolls} Burn!`, () => {
          _modTeam.resources.burn = (_modTeam.resources.burn || 0) + _modLow;
          log(`<span class="log-ability">Mask of Day</span> — Rolled ${_modLow} low die${_modLow>1?'s':''}! <span class="log-dmg">+${_modLow} Burn!</span>`);
          renderBattle();
        }, _modTName);
      }
    }
  });

  // Hank (207) — each 4 rolled: gain 1 Lucky Stone (Tremor)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const dice = team === B.red ? redDice : blueDice;
    const tNameHank = team === B.red ? 'red' : 'blue';
    if (f.id === 207 && !f.ko) {
      const fours = countVal(dice, 4);
      if (fours > 0) {
        const _tremFours = fours;
        const _tremTeam = team;
        const _tremName = f.name;
        queueAbility('TREMOR!', 'var(--common)', `${f.name} — rolled ${fours} four${fours>1?'s':''}! +${fours} Lucky Stone${fours>1?'s':''}!`, () => {
          _tremTeam.resources.luckyStone += _tremFours;
          // Update lsAvailable so post-roll Lucky Stone window sees new stones
          if (B.lsAvailable) B.lsAvailable[tNameHank] = (B.lsAvailable[tNameHank] || 0) + _tremFours;
          log(`<span class="log-ability">${_tremName}</span> — Tremor! Gained <span class="log-ms">${_tremFours} Lucky Stone${_tremFours>1?'s':''}</span>!`);
          renderBattle();
        }, tNameHank);
        checkKnightEffects(tNameHank, f.name);
        if (hasOnTeam(opp(team), 33)) {
          const _sandOpp = opp(team);
          const _sandTotal = _sandOpp.resources.luckyStone + fours;
          queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Tremor! +${fours} Lucky Stone${fours>1?'s':''}! (${_sandTotal} total)`, () => { _sandOpp.resources.luckyStone += _tremFours; renderBattle(); }, tNameHank === 'red' ? 'blue' : 'red');
        }
      }
    }
  });

  // Selene (305) — doubles: choose 1 Healing Seed OR 2 Lucky Stones (deferred modal)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const dice = team === B.red ? redDice : blueDice;
    const tNameSel = team === B.red ? 'red' : 'blue';
    if (f.id === 305 && !f.ko && classify(dice).type === 'doubles') {
      B.selenePending = { team, tName: tNameSel };
    }
  });

  // Natalia (327) — even doubles (2s, 4s, 6s): gain 1 Moonstone (v799 — removed Lucky Stone)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const dice = team === B.red ? redDice : blueDice;
    const tNameNat = team === B.red ? 'red' : 'blue';
    if (f.id === 327 && !f.ko && hasEvenDoubles(dice)) {
      const _natTeam = team;
      const _natName = f.name;
      const _natSandOpp = opp(team);
      queueAbility('MATERIALIZATION!', 'var(--ghost-rare)', `${f.name} — Even doubles! +1 Moonstone!`, () => {
        _natTeam.resources.moonstone = Math.min((_natTeam.resources.moonstone || 0) + 1, 1);
        log(`<span class="log-ability">${_natName}</span> — Materialization! Even doubles → <span class="log-ms">+1 Moonstone</span>!`);
        renderBattle();
      }, tNameNat);
      checkKnightEffects(tNameNat, f.name);
      if (hasOnTeam(opp(team), 33)) {
        queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Materialization! +1 Moonstone!`, () => { _natSandOpp.resources.moonstone = Math.min((_natSandOpp.resources.moonstone || 0) + 1, 1); renderBattle(); }, tNameNat === 'red' ? 'blue' : 'red');
      }
    }
  });

  // Kaplan (308) — when OPPONENT rolls doubles: gain 1 Healing Seed
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const oppDice = team === B.red ? blueDice : redDice;
    const tNameKap = team === B.red ? 'red' : 'blue';
    if (f.id === 308 && !f.ko && classify(oppDice).type === 'doubles') {
      const _kapTeam = team;
      const _kapName = f.name;
      const _kapSandOpp = opp(team);
      const _kapSandTotal = _kapSandOpp.resources.healingSeed + 1;
      queueAbility('POLLINATE!', 'var(--uncommon)', `${f.name} — opponent's doubles = free Healing Seed!`, () => {
        _kapTeam.resources.healingSeed++;
        log(`<span class="log-ability">${_kapName}</span> — Pollinate! Opponent rolled doubles → gained <span class="log-ms">1 Healing Seed</span>!`);
        renderBattle();
      }, tNameKap);
      checkKnightEffects(tNameKap, f.name);
      if (hasOnTeam(opp(team), 33)) {
        queueAbility('DEPENDABLE!', 'var(--common)', `Sandwiches — mirrors Pollinate! +1 Healing Seed! (${_kapSandTotal} total)`, () => { _kapSandOpp.resources.healingSeed++; renderBattle(); }, tNameKap === 'red' ? 'blue' : 'red');
      }
    }
  });

  // Gom Gom Gom (440) — REMOVED from post-roll (moved to WIN-path only in v685)

  // Captain James (443) — Final Strike: Sideline & In Play — triples+ → gain 2 Sacred Fires (win or lose)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const dice = team === B.red ? redDice : blueDice;
    const tNameCJ = team === B.red ? 'red' : 'blue';
    const cjActive = f.id === 443 && !f.ko;
    const cjSideline = hasSideline(team, 443);
    if ((cjActive || cjSideline) && ['triples','quads','penta'].includes(classify(dice).type)) {
      const _cjTeam = team;
      const cjGhost = cjActive ? f : getSidelineGhost(team, 443);
      const _cjName = cjGhost ? cjGhost.name : 'Captain James';
      const cjLabel = cjSideline && !cjActive ? `${_cjName} (sideline)` : _cjName;
      queueAbility('FINAL STRIKE!', 'var(--rare)', `${cjLabel} — Triples! +2 Sacred Fires!`, () => {
        _cjTeam.resources.fire += 2;
        log(`<span class="log-ability">${cjLabel}</span> — Final Strike! Triples+ → gained <span class="log-ms">2 Sacred Fires</span>!`);
        if (cjSideline && !cjActive) popSidelineCard(team, 443);
        renderBattle();
      }, tNameCJ);
      checkKnightEffects(tNameCJ, _cjName, cjSideline ? cjGhost : undefined);
    }
  });

  // Champ (438) — Thrill (B): +1 Surge on any doubles+ (either team)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tNameChamp = team === B.red ? 'red' : 'blue';
    if (f.id === 438 && !f.ko) {
      const redRoll = classify(redDice);
      const blueRoll = classify(blueDice);
      const eitherDoubles = ['doubles','triples','quads','penta'].includes(redRoll.type) || ['doubles','triples','quads','penta'].includes(blueRoll.type);
      if (eitherDoubles) {
        const _champTeam = team;
        const _champName = f.name;
        queueAbility('THRILL!', 'var(--ghost-rare)', `${f.name} — Doubles detected! +1 Surge!`, () => {
          _champTeam.resources.surge++;
          log(`<span class="log-ability">${_champName}</span> — Thrill! Doubles → gained <span class="log-ms">1 Surge</span>!`);
          renderBattle();
        }, tNameChamp);
        checkKnightEffects(tNameChamp, f.name);
      }
    }
  });

  // Simon (24) — Brew Time: gain 2 Sacred Fire when enemy rolls triples or better
  [B.red, B.blue].forEach(team => {
    const fSimon = active(team);
    const tNameSimon = team === B.red ? 'red' : 'blue';
    const enemyNameSimon = tNameSimon === 'red' ? 'blue' : 'red';
    const enemyDiceSimon = tNameSimon === 'red' ? blueDice : redDice;
    if (fSimon.id === 24 && !fSimon.ko && enemyDiceSimon) {
      const enemyRollType = classify(enemyDiceSimon).type;
      if (isTripleOrBetter(enemyRollType)) {
        team.resources.fire = (team.resources.fire || 0) + 2;
        queueAbility('BREW TIME!', 'var(--uncommon)', `Simon — Enemy rolled ${enemyRollType}! +2 Sacred Fire!`, null, tNameSimon);
        log(`<span class="log-ability">Simon</span> — Brew Time! Enemy rolled ${enemyRollType} → <span class="log-ms">+2 Sacred Fire!</span>`);
        collectKC(tNameSimon, fSimon.name);
      }
    }
  });

  // Masked Hero (55) — Underdog: gain +1 Burn for each 3 rolled (win or lose)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tNameMH = team === B.red ? 'red' : 'blue';
    const mhDice = team === B.red ? redDice : blueDice;
    if (f.id === 55 && !f.ko && mhDice) {
      const threeCount = mhDice.filter(d => d === 3).length;
      if (threeCount > 0) {
        if (!team.resources.burn) team.resources.burn = 0;
        team.resources.burn += threeCount;
        queueAbility('UNDERDOG!', 'var(--uncommon)', `${f.name} — ${threeCount} three${threeCount > 1 ? 's' : ''} rolled! +${threeCount} Burn!`, null, tNameMH);
        log(`<span class="log-ability">${f.name}</span> — Underdog! Rolled ${threeCount} three${threeCount > 1 ? 's' : ''} → <span class="log-dmg">+${threeCount} Burn!</span>`);
        collectKC(tNameMH, f.name);
      }
    }
  });

  // Ronan (461) — Mixup: if you roll doubles+ → gain +1 Ice Shard & +1 Burn (win or lose)
  [B.red, B.blue].forEach(team => {
    const f = active(team);
    const tNameRonan = team === B.red ? 'red' : 'blue';
    const ronanDice = team === B.red ? redDice : blueDice;
    if (f.id === 461 && !f.ko && ['doubles','triples','quads','penta'].includes(classify(ronanDice).type)) {
      const _rTeam = team;
      const _rName = f.name;
      queueAbility('MIXUP!', 'var(--common)', `${f.name} — Doubles! +1 Ice Shard & +1 Burn!`, () => {
        if (!_rTeam.resources.ice) _rTeam.resources.ice = 0;
        _rTeam.resources.ice += 1;
        if (!_rTeam.resources.burn) _rTeam.resources.burn = 0;
        _rTeam.resources.burn += 1;
        log(`<span class="log-ability">${_rName}</span> — Mixup! Doubles → gained <span class="log-ms">1 Ice Shard</span> & <span class="log-dmg">1 Burn</span>!`);
        renderBattle();
      }, tNameRonan);
      checkKnightEffects(tNameRonan, f.name);
    }
  });

  abilityQueueMode = false;

  // Drain post-roll callouts sequentially, THEN check moonstone/KOs
  const postRollDone = () => {
    if (handleKOs()) return;

    // ========================================
    // MOONSTONE CHECK
    // ========================================
    B.pendingResolve = { redDice, blueDice, redUsedMs:false, blueUsedMs:false };

  // Only offer moonstones that existed BEFORE this round (not gained during roll)
  const redMsAvail = B.msAvailable ? B.msAvailable.red : 0;
  const blueMsAvail = B.msAvailable ? B.msAvailable.blue : 0;

    // Cross-type simultaneous: one team has exactly MS, other has exactly LS
    // (saves ~5s when neither acts vs the old 5s+5s sequential wait)
    const _redLsCtx = B.lsAvailable ? B.lsAvailable.red : 0;
    const _blueLsCtx = B.lsAvailable ? B.lsAvailable.blue : 0;
    const _redHasLS = _redLsCtx > 0 && B.red.resources.luckyStone > 0;
    const _blueHasLS = _blueLsCtx > 0 && B.blue.resources.luckyStone > 0;
    const _redHasMS  = redMsAvail > 0 && B.red.resources.moonstone > 0;
    const _blueHasMS = blueMsAvail > 0 && B.blue.resources.moonstone > 0;

    // v728: PvP — each side only shows their OWN specials windows.
    // Opponent's specials are skipped (can't make their choices).
    if (LIVE_PVP && PVP_SIDE === 'blue' && pvpBlueResolvedLocally) {
      // Blue's local resolution: show Blue's specials only
      if (_blueHasMS && _blueHasLS) {
        startSameTeamSpecialsWindow('blue', () => checkLuckyStones());
        return;
      }
      if (_blueHasMS) {
        B.phase = 'moonstone-blue';
        showMoonstoneChoice('blue', blueDice);
        return;
      }
      // No Blue moonstone — fall through to Lucky Stone check
      checkLuckyStones();
      return;
    }
    if (LIVE_PVP && PVP_SIDE === 'red') {
      // Red's engine: show Red's specials only
      if (_redHasMS && _redHasLS) {
        startSameTeamSpecialsWindow('red', () => checkLuckyStones());
        return;
      }
      if (_redHasMS) {
        B.phase = 'moonstone-red';
        showMoonstoneChoice('red', redDice);
        return;
      }
      // No Red moonstone — fall through to Lucky Stone check
      checkLuckyStones();
      return;
    }

    if (_redHasMS && _blueHasLS && !_blueHasMS && !_redHasLS) {
      startCrossTypeSpecialsWindow('red', 'blue');
      return;
    }
    if (_blueHasMS && _redHasLS && !_redHasMS && !_blueHasLS) {
      startCrossTypeSpecialsWindow('blue', 'red');
      return;
    }

    // Both teams have Moonstone — show simultaneously (saves up to 5s vs 5s+5s sequential)
    if (_redHasMS && _blueHasMS) {
      startSimultaneousMoonstoneWindows();
      return;
    }

    // Same-team unified specials: one team has BOTH Moonstone + Lucky Stone
    // Show a single reaction window with both resource tiles highlighted, one shared timer.
    if (_redHasMS && _redHasLS) {
      startSameTeamSpecialsWindow('red', () => {
        // After red's unified window, check if blue has anything
        if (_blueHasLS) checkLuckyStones();
        else resolveRound();
      });
      return;
    }
    if (_blueHasMS && _blueHasLS) {
      startSameTeamSpecialsWindow('blue', () => {
        // After blue's unified window, check if red has anything
        if (_redHasLS) checkLuckyStones();
        else resolveRound();
      });
      return;
    }

  if (_redHasMS) {
    B.phase = 'moonstone-red';
    showMoonstoneChoice('red', redDice);
    return;
  }
  if (_blueHasMS) {
    B.phase = 'moonstone-blue';
    showMoonstoneChoice('blue', blueDice);
    return;
  }

    checkLuckyStones();
  };

  // Drain post-roll ability callouts, then check for KOs (Shade's Shadow can KO during queue),
  // then continue to moonstone/lucky stones
  drainAbilityQueue(() => {
    if (handleKOs()) return; // Shade's Shadow or other queued ability caused a KO — swap flow takes over

    // Jackson (50) — Regrow: post-roll HP-for-reroll modal (before moonstone)
    // → then Sonya (69) — Mesmerize: change one die to 2 (free, once per round)
    // → then Jeanie (90) — Hidden Treasure: sideline force-opponent-reroll (once per game)
    // → then Selene → postRollDone
    const afterJeanie = () => {
      if (B.selenePending) {
        B.selenePending._continue = postRollDone;
        showSeleneModal();
        return;
      }
      postRollDone();
    };
    const afterSonya = () => {
      // Jeanie (90) chain: offer Red first, then Blue, then continue
      if (hasSideline(B.red, 90) && B.jeanieUsed && !B.jeanieUsed.red) {
        checkJeanieHiddenTreasure('red', () => {
          if (hasSideline(B.blue, 90) && B.jeanieUsed && !B.jeanieUsed.blue) {
            checkJeanieHiddenTreasure('blue', afterJeanie);
          } else {
            afterJeanie();
          }
        });
        return;
      }
      if (hasSideline(B.blue, 90) && B.jeanieUsed && !B.jeanieUsed.blue) {
        checkJeanieHiddenTreasure('blue', afterJeanie);
        return;
      }
      afterJeanie();
    };
    const afterJackson = () => {
      // Sonya (69) — Mesmerize chain: red first, then blue, then continue
      const sRed  = active(B.red);
      const sBlue = active(B.blue);
      if (sRed  && sRed.id  === 69 && !sRed.ko  && B.sonyaUsedThisRound && !B.sonyaUsedThisRound.red) {
        checkSonyaMesmerize('red',  afterSonya); return;
      }
      if (sBlue && sBlue.id === 69 && !sBlue.ko && B.sonyaUsedThisRound && !B.sonyaUsedThisRound.blue) {
        checkSonyaMesmerize('blue', afterSonya); return;
      }
      afterSonya();
    };
    // Dark Wing (76) — Precision: reroll all dice if not doubles
    const afterDarkWing = () => {
      const jRed  = active(B.red);
      const jBlue = active(B.blue);
      if (jRed  && jRed.id  === 50 && !jRed.ko  && jRed.hp  >= 2) {
        checkJacksonRegrow('red',  [...B.redDice],  afterJackson); return;
      }
      if (jBlue && jBlue.id === 50 && !jBlue.ko && jBlue.hp >= 2) {
        checkJacksonRegrow('blue', [...B.blueDice], afterJackson); return;
      }
      afterJackson();
    };
    // Drizzle (328) — Rain Dance fires AFTER Tommy (before Dark Wing), then DW, then Jackson
    const afterDrizzle = () => {
      const dwRed  = active(B.red);
      const dwBlue = active(B.blue);
      if (dwRed  && dwRed.id  === 76 && !dwRed.ko  && B.darkWingUsedThisGame && !B.darkWingUsedThisGame.red) {
        checkDarkWingPrecision('red',  afterDarkWing); return;

      }
      if (dwBlue && dwBlue.id === 76 && !dwBlue.ko && B.darkWingUsedThisGame && !B.darkWingUsedThisGame.blue) {
        checkDarkWingPrecision('blue', afterDarkWing); return;
      }
      afterDarkWing();
    };
    // Tommy Salami (30) — Regulator: fires FIRST so 5s/6s are suppressed before Drizzle, Dark Wing, etc.
    checkTommyRegulator(afterDrizzle);
  });
}

// ============================================================
// SKIP SPECIALS BUTTON — lets players skip the countdown window
// ============================================================
function showSkipBtn(callback) {
  B.skipSpecialsCallback = callback;
  if (!document.getElementById('skipBtnCheckbox')?.checked) return;
  const btn = document.getElementById('skipSpecialsBtn');
  if (btn) btn.style.display = '';
}
function hideSkipBtn() {
  B.skipSpecialsCallback = null;
  const btn = document.getElementById('skipSpecialsBtn');
  if (btn) btn.style.display = 'none';
}
function doSkipSpecials() {
  if (!B || !B.skipSpecialsCallback) return;
  const cb = B.skipSpecialsCallback;
  hideSkipBtn();
  cb();
}

// Moonstone Sickness — balance experiment
function applyMoonstoneSickness(team) {
  const mode = document.getElementById('moonstoneModeSelect')?.value || 'D';
  const t = B[team];
  if (mode === 'A') {
    t.moonstoneSickness = (t.moonstoneSickness || 0) + 1;
    const totalPerTurn = t.moonstoneSickness * 2;
    log(`<span class="log-dmg">Moonstone Sickness!</span> ${team.toUpperCase()} will take ${totalPerTurn} damage before every roll for the rest of the game.`);
    narrate(`<b class="${team}-text" style="color:var(--moonstone)">Moonstone Sickness!</b> ${totalPerTurn} damage before every roll!`);
  } else if (mode === 'D' || mode === 'G') {
    t.moonstoneSickness = (t.moonstoneSickness || 0) + 1;
    const totalPerTurn = t.moonstoneSickness * 1;
    const clearNote = mode === 'G' ? ' (clears on KO)' : '';
    log(`<span class="log-dmg">Moonstone Sickness!</span> ${team.toUpperCase()} will take ${totalPerTurn} damage before every roll${clearNote}.`);
    narrate(`<b class="${team}-text" style="color:var(--moonstone)">Moonstone Sickness!</b> ${totalPerTurn} damage before every roll!${clearNote}`);
  } else if (mode === 'B') {
    t.moonstoneSicknessCount = (t.moonstoneSicknessCount || 0) + 1;
    t.moonstoneSicknessPending = t.moonstoneSicknessCount * 2;
    log(`<span class="log-dmg">Moonstone Sickness!</span> ${team.toUpperCase()} will take ${t.moonstoneSicknessPending} damage before next roll.`);
    narrate(`<b class="${team}-text" style="color:var(--moonstone)">Moonstone Sickness!</b> ${t.moonstoneSicknessPending} damage before next roll!`);
  } else if (mode === 'C') {
    t.moonstoneSicknessPending = 3;
    log(`<span class="log-dmg">Moonstone Sickness!</span> ${team.toUpperCase()} will take 3 damage before next roll.`);
    narrate(`<b class="${team}-text" style="color:var(--moonstone)">Moonstone Sickness!</b> 3 damage before next roll!`);
  }
}

// Moonstone — timed window like Lucky Stone (3s countdown, click die to change)
let msCountdownTimer = null;

function showMoonstoneChoice(team, dice) {
  // Blue AI: auto-use moonstone
  if (AI_ACTIVE && team === 'blue') {
    const aiMsMode = document.getElementById('moonstoneModeSelect')?.value || 'D';
    B.pendingMoonstone = { team, dice: [...dice], dieIndex: null, phase: 'pick-resource' };

    if (aiMsMode === 'F') {
      // Toggle F AI: roll die, deal damage to opponent
      B[team].resources.moonstone--;
      const roll = Math.floor(Math.random() * 6) + 1;
      const oppTeam = team === 'red' ? 'blue' : 'red';
      const oppF = active(B[oppTeam]);
      if (oppF && !oppF.ko) {
        oppF.hp = Math.max(0, oppF.hp - roll);
        if (oppF.hp <= 0) { oppF.ko = true; oppF.killedBy = -1; }
        log(`<span class="log-ms">Moonstone Blast!</span> Blue rolled <b>${roll}</b> — ${oppF.name} takes <span class="log-dmg">${roll} damage!</span>${oppF.ko ? ' <span class="log-ko">KO!</span>' : ' ' + oppF.hp + ' HP left'}`);
        narrate(`<b style="color:var(--moonstone)">Moonstone Blast!</b> <b class="blue-text">Blue</b> rolled <b class="gold">${roll}</b> — <b class="red-text">${oppF.name}</b> takes ${roll} damage!`);
        playDamageSfx(roll);
        hitDamage(oppTeam);
      }
      B.pendingMoonstone = null;
      renderBattle();
      setTimeout(() => {
        if (B.pendingResolve) { const pr = B.pendingResolve; B.pendingResolve = null; doResolve(pr.redDice || B.redDice, pr.blueDice || B.blueDice, pr.redRoll, pr.blueRoll); }
        else checkLuckyStonePhase();
      }, spd(800));
      return;
    }

    if (aiMsMode === 'E') {
      // Toggle E AI: pick a random item
      B[team].resources.moonstone--;
      const pick = MS_ITEM_LIST[Math.floor(Math.random() * MS_ITEM_LIST.length)];
      if (pick.key === 'iceBlade') { if (!B.iceBladeForgedPermanent) B.iceBladeForgedPermanent={red:false,blue:false}; B.iceBladeForgedPermanent[team]=true; }
      else if (pick.key === 'flameBlade') { if (!B.flameBlade) B.flameBlade={red:false,blue:false}; B.flameBlade[team]=true; }
      else if (pick.key === 'maskOfDay') { if (!B.sophiaMask) B.sophiaMask={red:null,blue:null}; if (!B.sophiaMaskActive) B.sophiaMaskActive={red:false,blue:false}; B.sophiaMask[team]='day'; B.sophiaMaskActive[team]=true; }
      else if (pick.key === 'maskOfNight') { if (!B.sophiaMask) B.sophiaMask={red:null,blue:null}; if (!B.sophiaMaskActive) B.sophiaMaskActive={red:false,blue:false}; B.sophiaMask[team]='night'; B.sophiaMaskActive[team]=true; }
      else if (pick.key === 'hammer') { if (!B.carpenterHammer) B.carpenterHammer={red:false,blue:false}; B.carpenterHammer[team]=true; }
      else if (pick.key === 'torch') { if (!B.welderTorch) B.welderTorch={red:false,blue:false}; B.welderTorch[team]=true; }
      log(`<span class="log-ms">Moonstone → Item!</span> Blue receives <b>${pick.name}</b>! ${pick.desc}`);
      narrate(`<b style="color:var(--moonstone)">Moonstone → Item!</b> <b class="blue-text">Blue</b> receives <b>${pick.name}</b>!`);
      B.pendingMoonstone = null;
      renderBattle();
      setTimeout(() => {
        if (B.pendingResolve) { const pr = B.pendingResolve; B.pendingResolve = null; doResolve(pr.redDice || B.redDice, pr.blueDice || B.blueDice, pr.redRoll, pr.blueRoll); }
        else checkLuckyStonePhase();
      }, spd(800));
      return;
    }

    // Default modes A-D: change lowest die to 6
    // Find lowest die
    let worstIdx = 0, worstVal = 7;
    dice.forEach((d, i) => { if (d < worstVal) { worstVal = d; worstIdx = i; } });
    // Auto-use: change lowest die to 6
    B.pendingMoonstone.dieIndex = worstIdx;
    const newDice = [...dice];
    newDice[worstIdx] = 6;
    newDice.sort((a, b) => a - b);
    B[team === 'red' ? 'redDice' : 'blueDice'] = newDice;
    B.pendingMoonstone.dice = newDice;
    B[team].resources.moonstone--;
    applyMoonstoneSickness(team);
    triggerCameronSpecialWatch(team, true); // Cameron (25) — Unstoppable Force (immediate post-roll die)
    log(`<span class="log-ms">${team.toUpperCase()} uses Moonstone!</span> Changed die ${worstVal} → 6!`);
    narrate(`<b class="${team}-text">Blue</b> uses <b style="color:var(--moonstone)">Moonstone!</b> ${worstVal} → 6!`);
    B.pendingMoonstone = null;
    renderDice(B.redDice, B.blueDice);
    renderBattle();
    // Continue to resolve
    setTimeout(() => {
      if (B.pendingResolve) {
        const pr = B.pendingResolve;
        B.pendingResolve = null;
        doResolve(pr.redDice || B.redDice, pr.blueDice || B.blueDice, pr.redRoll, pr.blueRoll);
      } else {
        checkLuckyStonePhase();
      }
    }, spd(800));
    return;
  }

  // Toggle F: Roll die 1-6, deal that as damage to opponent
  const msModeF = document.getElementById('moonstoneModeSelect')?.value;
  if (msModeF === 'F') {
    B.pendingMoonstone = { team, dice: [...dice], dieIndex: null, phase: 'pick-resource' };
    renderDice(B.redDice, B.blueDice);
    renderBattle();
    const teamLabel = team.charAt(0).toUpperCase() + team.slice(1);
    narrate(`<b class="${team}-text">${teamLabel}</b> has a <b style="color:var(--moonstone)">Moonstone!</b>&nbsp;Click it to use!`);
    log(`<span class="log-ms">${team.toUpperCase()} has a Moonstone!</span> Click it to use — 5 seconds!`);
    showSkipBtn(() => skipMoonstone());
    const resEl = document.getElementById(team + '-resources');
    const msEl = resEl.querySelector('.res-tile.moonstone');
    if (msEl) {
      msEl.classList.add('rerollable');
      msEl.style.cursor = 'pointer';
      let remaining = getSpecialsTimerSecs();
      showLsCountdown(msEl, remaining);
      msEl.onclick = () => {
        hideSkipBtn();
        clearInterval(msCountdownTimer);
        clearMsCountdown(msEl);
        msEl.classList.remove('rerollable');
        msEl.onclick = null;
        // Consume moonstone
        const t = B[team];
        const f = active(t);
        let magicTouchFired = false;
        if (f.id === 203 && !f.usedMagicTouch) {
          f.usedMagicTouch = true;
          magicTouchFired = true;
          showAbilityCallout('MAGIC TOUCH!', 'var(--moonstone)', `${f.name} — Moonstone used without discarding!`, team);
          log(`<span class="log-ability">${f.name}</span> — Magic Touch! Used Moonstone without discarding it!`);
        } else {
          t.resources.moonstone--;
          playSfx('sfxSpecial', 0.5);
        }
        // Roll 1-6
        const roll = Math.floor(Math.random() * 6) + 1;
        const oppTeam = team === 'red' ? 'blue' : 'red';
        const oppF = active(B[oppTeam]);
        if (oppF && !oppF.ko) {
          oppF.hp = Math.max(0, oppF.hp - roll);
          if (oppF.hp <= 0) { oppF.ko = true; oppF.killedBy = -1; }
          showAbilityCallout('MOONSTONE BLAST!', 'var(--moonstone)', `Rolled a ${roll} — ${oppF.name} takes ${roll} damage!`, team);
          log(`<span class="log-ms">Moonstone Blast!</span> Rolled <b>${roll}</b> — ${oppF.name} takes <span class="log-dmg">${roll} damage!</span>${oppF.ko ? ' <span class="log-ko">KO!</span>' : ' ' + oppF.hp + ' HP left'}`);
          narrate(`<b style="color:var(--moonstone)">Moonstone Blast!</b> Rolled <b class="gold">${roll}</b> — <b class="${oppTeam}-text">${oppF.name}</b> takes ${roll} damage!${oppF.ko ? ' <b>KO!</b>' : ''}`);
          playDamageSfx(roll);
          hitDamage(oppTeam);
        }
        renderBattle();
        B.pendingMoonstone = null;
        setTimeout(() => {
          const blueMsLeft = B.msAvailable ? B.msAvailable.blue : 0;
          if (team === 'red' && blueMsLeft > 0 && B.blue.resources.moonstone > 0) {
            B.phase = 'moonstone-blue';
            showMoonstoneChoice('blue', B.blueDice);
            return;
          }
          if (B.afterMoonstoneCallback) { const _cb = B.afterMoonstoneCallback; delete B.afterMoonstoneCallback; _cb(); return; }
          checkLuckyStones();
        }, magicTouchFired ? 1600 : 1200);
      };
      clearInterval(msCountdownTimer);
      msCountdownTimer = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(msCountdownTimer);
          clearMsCountdown(msEl);
          if (msEl) { msEl.classList.remove('rerollable'); msEl.onclick = null; }
          skipMoonstone();
        } else {
          showLsCountdown(msEl, remaining);
        }
      }, 1000);
    }
    return;
  }

  // Toggle E: Choose an item instead of changing a die
  const msModeE = document.getElementById('moonstoneModeSelect')?.value;
  if (msModeE === 'E') {
    B.pendingMoonstone = { team, dice: [...dice], dieIndex: null, phase: 'pick-resource' };
    renderDice(B.redDice, B.blueDice);
    renderBattle();
    const teamLabel = team.charAt(0).toUpperCase() + team.slice(1);
    narrate(`<b class="${team}-text">${teamLabel}</b> has a <b style="color:var(--moonstone)">Moonstone!</b>&nbsp;Click it to choose an item!`);
    log(`<span class="log-ms">${team.toUpperCase()} has a Moonstone!</span> Click it to choose an item — 5 seconds!`);
    showSkipBtn(() => skipMoonstone());
    const resEl = document.getElementById(team + '-resources');
    const msEl = resEl.querySelector('.res-tile.moonstone');
    if (msEl) {
      msEl.classList.add('rerollable');
      msEl.style.cursor = 'pointer';
      let remaining = getSpecialsTimerSecs();
      showLsCountdown(msEl, remaining);
      msEl.onclick = () => {
        hideSkipBtn();
        clearInterval(msCountdownTimer);
        clearMsCountdown(msEl);
        msEl.classList.remove('rerollable');
        msEl.onclick = null;
        showMoonstoneItemPicker(team);
      };
      clearInterval(msCountdownTimer);
      msCountdownTimer = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(msCountdownTimer);
          clearMsCountdown(msEl);
          if (msEl) { msEl.classList.remove('rerollable'); msEl.onclick = null; }
          skipMoonstone();
        } else {
          showLsCountdown(msEl, remaining);
        }
      }, 1000);
    }
    return;
  }

  renderDice(B.redDice, B.blueDice);
  renderBattle();
  B.pendingMoonstone = { team, dice: [...dice], dieIndex:null, phase:'pick-resource' };
  showSkipBtn(() => skipMoonstone());

  const teamLabel = team.charAt(0).toUpperCase() + team.slice(1);
  narrate(`<b class="${team}-text">${teamLabel}</b> has a <b style="color:var(--moonstone)">Moonstone!</b>&nbsp;Click it to use!`);
  log(`<span class="log-ms">${team.toUpperCase()} has a Moonstone!</span> Click it to use — 5 seconds!`);

  const diceEl = document.getElementById(team + '-dice');
  const resEl = document.getElementById(team + '-resources');

  // Scroll dice area into view so the Moonstone UI is visible
  const arenaEl = document.getElementById('arena') || diceEl;
  arenaEl.scrollIntoView({ behavior:'smooth', block:'center' });
  const msEl = resEl.querySelector('.res-tile.moonstone') || diceEl;

  // Highlight the Moonstone resource — player clicks IT first
  if (msEl && msEl !== diceEl) {
    msEl.classList.add('rerollable');
    msEl.style.cursor = 'pointer';
    msEl.onclick = () => {
      // Player clicked Moonstone — clear the countdown and start fresh for die picking
      hideSkipBtn();
      clearInterval(msCountdownTimer);
      clearMsCountdown(msEl);
      msEl.classList.remove('rerollable');
      msEl.onclick = null;
      B.pendingMoonstone.phase = 'pick-die';
      narrate(`<b class="${team}-text">${teamLabel}</b> — pick a die to change!`);
      const dieDivs = diceEl.querySelectorAll('.die');
      dieDivs.forEach((d, i) => {
        d.classList.add('rerollable');
        d.style.borderColor = 'var(--moonstone)';
        d.onclick = () => pickMsDie(i);
      });
      sync3dDiceClickable(team);
      // Fresh 5s countdown for picking which die
      let pickRemaining = getSpecialsTimerSecs();
      showLsCountdown(diceEl, pickRemaining);
      msCountdownTimer = setInterval(() => {
        pickRemaining--;
        if (pickRemaining <= 0) {
          clearInterval(msCountdownTimer);
          clearMsCountdown(diceEl);
          clearDiceClickable(team);
          skipMoonstone();
        } else {
          showLsCountdown(diceEl, pickRemaining);
        }
      }, 1000);
    };
  } else {
    // No resource tile — fall back to direct dice click
    B.pendingMoonstone.phase = 'pick-die';
    const dieDivs = diceEl.querySelectorAll('.die');
    dieDivs.forEach((d, i) => {
      d.classList.add('rerollable');
      d.style.borderColor = 'var(--moonstone)';
      d.onclick = () => pickMsDie(i);
    });
    sync3dDiceClickable(team);
  }

  // Start countdown — auto-skip if not used
  let remaining = getSpecialsTimerSecs();
  showLsCountdown(msEl, remaining);

  clearInterval(msCountdownTimer);
  msCountdownTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(msCountdownTimer);
      clearMsCountdown(msEl);
      clearDiceClickable(team);
      if (msEl) { msEl.classList.remove('rerollable'); msEl.onclick = null; }
      skipMoonstone();
    } else {
      showLsCountdown(msEl, remaining);
    }
  }, 1000);
}

function clearMsCountdown(el) {
  if (el) { const cd = el.querySelector('.reroll-countdown'); if (cd) cd.remove(); }
}

function pickMsDie(idx) {
  if (!B || !B.pendingMoonstone || B.pendingMoonstone.phase !== 'pick-die') return;
  hideSkipBtn();
  clearInterval(msCountdownTimer);
  msCountdownTimer = null; // prevent any queued interval callbacks from firing
  const team = B.pendingMoonstone.team;
  B.pendingMoonstone.dieIndex = idx;
  B.pendingMoonstone.phase = 'pick-value';

  // Clear die clickability and countdowns immediately
  clearDiceClickable(team);
  const diceEl = document.getElementById(team + '-dice');
  const resEl = document.getElementById(team + '-resources');
  const msEl = resEl.querySelector('.res-tile.moonstone') || diceEl;
  clearMsCountdown(msEl);
  clearMsCountdown(diceEl);
  document.querySelectorAll('.reroll-countdown').forEach(el => el.remove());

  narrate(`Die ${idx+1} selected — pick a new value!`);

  // Hide the full-screen overlay, show inline picker in arena center
  document.getElementById('msPicker').classList.remove('active');
  const inlinePicker = document.getElementById('msInlinePicker');
  const inlineOpts = document.getElementById('msInlineOptions');
  inlineOpts.innerHTML = [1,2,3,4,5,6].map(v => `<div class="ms-die-option" onclick="pickMsValue(${v})">${v}</div>`).join('');
  inlinePicker.classList.add('active');

  // Scroll arena center into view
  const arenaCenter = inlinePicker.parentElement;
  if (arenaCenter) arenaCenter.scrollIntoView({ behavior:'smooth', block:'center' });

  // Auto-skip after 7s if no value picked
  let remaining = 7;
  showLsCountdown(inlinePicker, remaining);
  msCountdownTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(msCountdownTimer);
      inlinePicker.classList.remove('active');
      clearMsCountdown(inlinePicker);
      skipMoonstone();
    } else {
      showLsCountdown(inlinePicker, remaining);
    }
  }, 1000);
}

function pickMsValue(val) {
  clearInterval(msCountdownTimer);
  const ms = B.pendingMoonstone;
  if (!ms) return;
  const team = ms.team;
  const t = B[team];
  const f = active(t);

  const el = document.getElementById('msPicker');
  el.classList.remove('active');
  clearMsCountdown(el);
  document.getElementById('msInlinePicker').classList.remove('active');
  clearMsCountdown(document.getElementById('msInlinePicker'));

  // Benjamin (203) — Magic Touch: once per turn, don't decrement moonstone
  let magicTouchFired = false;
  if (f.id === 203 && !f.usedMagicTouch) {
    f.usedMagicTouch = true;
    magicTouchFired = true;
    showAbilityCallout('MAGIC TOUCH!', 'var(--moonstone)', `${f.name} — Moonstone used without discarding!`, team);
    log(`<span class="log-ability">${f.name}</span> — Magic Touch! Used Moonstone without discarding it!`);
  } else {
    t.resources.moonstone--;
    playSfx('sfxSpecial', 0.5);
  }
  applyMoonstoneSickness(team); // Moonstone Sickness — fires on USE (including Magic Touch)
  triggerCameronSpecialWatch(team, true); // Cameron (25) — Unstoppable Force (immediate post-roll die)

  ms.dice[ms.dieIndex] = val;
  ms.dice.sort((a,b)=>a-b);

  if (team==='red') B.pendingResolve.redDice = ms.dice;
  else B.pendingResolve.blueDice = ms.dice;

  B.redDice = B.pendingResolve.redDice;
  B.blueDice = B.pendingResolve.blueDice;
  renderDice(B.redDice, B.blueDice);

  const teamLabel = team.charAt(0).toUpperCase() + team.slice(1);
  log(`<span class="log-ms">Moonstone used!</span> ${team.toUpperCase()} changed die to ${val} → [${ms.dice.join(', ')}]`);
  narrate(`<b style="color:var(--moonstone)">Moonstone!</b>&nbsp;<b class="${team}-text">${teamLabel}</b> changes die to <b class="gold">${val}</b>! → [${ms.dice.join(', ')}]`);
  B.pendingMoonstone = null;

  // v731: broadcast Moonstone choice to Red's engine so it resolves with correct dice
  if (LIVE_PVP && PVP_SIDE === 'blue' && PVP_GAME_REF && team === 'blue') {
    PVP_GAME_REF.child('specialsChoice').push({
      type: 'moonstone',
      side: 'blue',
      dieIndex: ms.dieIndex,
      chosenValue: val,
      dice: ms.dice.slice(),
      ts: Date.now()
    });
  }

  // Bigsby (424) — Omen: if Bigsby is the active ghost when a Moonstone is used,
  // Bigsby MUST be sacrificed and replaced with Doom (id 112). Mandatory transformation.
  if (f.id === 424 && !f.ko) {
    const g = f; // mutate the ghost object in-place
    // Preserve original identity for MVP/results/resurrection/standings
    g.originalId = g.id;
    g.originalName = g.name;
    g.originalArt = g.art;
    g.originalMaxHp = g.maxHp;
    g.originalAbility = g.ability;
    g.originalAbilityDesc = g.abilityDesc;
    g.originalRarity = g.rarity;
    g.id = 112; g.name = "Doom"; g.maxHp = 7; g.hp = 7;
    g.ability = "Fiendship"; g.abilityDesc = "+2 bonus damage!";
    g.art = "art/originals/doom.jpg"; g.rarity = "legendary"; g.ko = false;
    queueAbility('TRANSFORMATION!', 'var(--legendary)', 'Bigsby sacrifices himself — DOOM rises!', null, team);
    log(`<span class="log-ability">Bigsby</span> — Omen! <span class="log-dmg">DOOM has arrived!</span>`);
    checkRipagooTransform(team);
    renderBattle();
  }

  // When Magic Touch fired, showAbilityCallout is on screen for 1400ms — wait 1600ms
  // so the splash fully clears before the next picker / Lucky Stones appear.
  // Without Magic Touch, only a visual dice update happened — 1200ms is enough.
  const msPostDelay = magicTouchFired ? 1600 : 1200;

  // Pause to let the changed dice register visually before continuing
  setTimeout(() => {
    // Check if other team also has moonstone (pre-round only)
    const blueMsLeft = B.msAvailable ? B.msAvailable.blue : 0;
    if (team==='red' && blueMsLeft > 0 && B.blue.resources.moonstone > 0) {
      B.phase = 'moonstone-blue';
      showMoonstoneChoice('blue', B.blueDice);
      return;
    }

    // Cross-type window callback: after MS resolves, offer LS to the other team
    if (B.afterMoonstoneCallback) {
      const _cb = B.afterMoonstoneCallback;
      delete B.afterMoonstoneCallback;
      _cb();
      return;
    }

    checkLuckyStones();
  }, msPostDelay);
}

// Toggle E: Moonstone item picker — choose an item from the game
const MS_ITEM_LIST = [
  { key: 'iceBlade', name: 'Ice Blade', emoji: '🗡️', desc: '+1 die, +2 damage on wins when swinging', color: 'var(--ghost-rare)' },
  { key: 'flameBlade', name: 'Flame Blade', emoji: '🔥', desc: '+1 die, +3 Burn on wins when swinging', color: 'var(--rare)' },
  { key: 'maskOfDay', name: 'Mask of Day', emoji: '☀️', desc: 'Gain 1 Burn for each 1 or 2 you roll', color: '#ffd700' },
  { key: 'maskOfNight', name: 'Mask of Night', emoji: '🌙', desc: 'Roll same dice as enemy, +1 damage on wins', color: '#4a4a8a' },
  { key: 'hammer', name: "Carpenter's Hammer", emoji: '🔨', desc: '+2 damage on Singles', color: 'var(--moonstone)' },
  { key: 'torch', name: "Welder's Torch", emoji: '🔦', desc: 'Burns deal +1 extra damage, wins grant 1 Burn', color: '#ff6b35' }
];

function showMoonstoneItemPicker(team) {
  clearInterval(msCountdownTimer);
  const inlinePicker = document.getElementById('msInlinePicker');
  const inlineOpts = document.getElementById('msInlineOptions');
  const h4 = inlinePicker.querySelector('h4');
  if (h4) h4.textContent = '💎 Choose an Item';
  inlineOpts.innerHTML = MS_ITEM_LIST.map((item, i) =>
    `<div class="ms-die-option" style="width:auto;height:auto;padding:8px 14px;font-size:13px;display:flex;flex-direction:column;align-items:center;gap:2px;" onclick="pickMoonstoneItem('${item.key}','${team}')" title="${item.desc}">
      <span style="font-size:20px;">${item.emoji}</span>
      <span style="font-size:11px;color:${item.color};font-weight:700;">${item.name}</span>
    </div>`
  ).join('');
  inlinePicker.classList.add('active');
  const arenaCenter = inlinePicker.parentElement;
  if (arenaCenter) arenaCenter.scrollIntoView({ behavior:'smooth', block:'center' });
  let remaining = 10;
  showLsCountdown(inlinePicker, remaining);
  msCountdownTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(msCountdownTimer);
      inlinePicker.classList.remove('active');
      clearMsCountdown(inlinePicker);
      skipMoonstone();
    } else {
      showLsCountdown(inlinePicker, remaining);
    }
  }, 1000);
}

function pickMoonstoneItem(key, team) {
  clearInterval(msCountdownTimer);
  const inlinePicker = document.getElementById('msInlinePicker');
  inlinePicker.classList.remove('active');
  clearMsCountdown(inlinePicker);

  const t = B[team];
  const f = active(t);
  const item = MS_ITEM_LIST.find(i => i.key === key);
  if (!item) { skipMoonstone(); return; }

  // Consume moonstone (Benjamin Magic Touch check)
  let magicTouchFired = false;
  if (f.id === 203 && !f.usedMagicTouch) {
    f.usedMagicTouch = true;
    magicTouchFired = true;
    showAbilityCallout('MAGIC TOUCH!', 'var(--moonstone)', `${f.name} — Moonstone used without discarding!`, team);
    log(`<span class="log-ability">${f.name}</span> — Magic Touch! Used Moonstone without discarding it!`);
  } else {
    t.resources.moonstone--;
    playSfx('sfxSpecial', 0.5);
  }

  // Grant the item
  if (key === 'iceBlade') {
    if (!B.iceBladeForgedPermanent) B.iceBladeForgedPermanent = { red: false, blue: false };
    B.iceBladeForgedPermanent[team] = true;
  } else if (key === 'flameBlade') {
    if (!B.flameBlade) B.flameBlade = { red: false, blue: false };
    B.flameBlade[team] = true;
  } else if (key === 'maskOfDay') {
    if (!B.sophiaMask) B.sophiaMask = { red: null, blue: null };
    if (!B.sophiaMaskActive) B.sophiaMaskActive = { red: false, blue: false };
    B.sophiaMask[team] = 'day';
    B.sophiaMaskActive[team] = true;
  } else if (key === 'maskOfNight') {
    if (!B.sophiaMask) B.sophiaMask = { red: null, blue: null };
    if (!B.sophiaMaskActive) B.sophiaMaskActive = { red: false, blue: false };
    B.sophiaMask[team] = 'night';
    B.sophiaMaskActive[team] = true;
  } else if (key === 'hammer') {
    if (!B.carpenterHammer) B.carpenterHammer = { red: false, blue: false };
    B.carpenterHammer[team] = true;
  } else if (key === 'torch') {
    if (!B.welderTorch) B.welderTorch = { red: false, blue: false };
    B.welderTorch[team] = true;
  }

  showAbilityCallout(item.emoji + ' ' + item.name.toUpperCase() + '!', item.color, `${f.name} receives ${item.name}!`, team);
  log(`<span class="log-ms">Moonstone → Item!</span> ${team.toUpperCase()} receives <b>${item.name}</b>! ${item.desc}`);
  narrate(`<b style="color:var(--moonstone)">Moonstone → Item!</b> <b class="${team}-text">${f.name}</b> receives <b style="color:${item.color}">${item.name}</b>!`);
  renderBattle();
  B.pendingMoonstone = null;

  const msPostDelay = magicTouchFired ? 1600 : 1200;
  setTimeout(() => {
    const blueMsLeft = B.msAvailable ? B.msAvailable.blue : 0;
    if (team === 'red' && blueMsLeft > 0 && B.blue.resources.moonstone > 0) {
      B.phase = 'moonstone-blue';
      showMoonstoneChoice('blue', B.blueDice);
      return;
    }
    if (B.afterMoonstoneCallback) { const _cb = B.afterMoonstoneCallback; delete B.afterMoonstoneCallback; _cb(); return; }
    checkLuckyStones();
  }, msPostDelay);
}

function skipMoonstone() {
  if (!B.pendingMoonstone) return;
  hideSkipBtn();
  const team = B.pendingMoonstone.team;
  clearInterval(msCountdownTimer);
  document.getElementById('msPicker').classList.remove('active');
  document.getElementById('msInlinePicker').classList.remove('active');
  clearDiceClickable(team);
  // Also clear the resource tile highlight + countdown badge
  const resEl = document.getElementById(team + '-resources');
  const msEl = resEl && resEl.querySelector('.res-tile.moonstone');
  if (msEl) { msEl.classList.remove('rerollable'); msEl.onclick = null; msEl.style.cursor = ''; clearMsCountdown(msEl); }
  log(`<span style="color:var(--text2)">${team.toUpperCase()} holds their Moonstone.</span>`);
  B.pendingMoonstone = null;

  const blueMsSkip = B.msAvailable ? B.msAvailable.blue : 0;
  if (team==='red' && blueMsSkip > 0 && B.blue.resources.moonstone > 0) {
    B.phase = 'moonstone-blue';
    showMoonstoneChoice('blue', B.blueDice);
    return;
  }
  if (B.afterMoonstoneCallback) {
    const _cb = B.afterMoonstoneCallback;
    delete B.afterMoonstoneCallback;
    _cb();
    return;
  }
  checkLuckyStones();
}

// ============================================================
// SIMULTANEOUS MOONSTONE WINDOW
// Both teams have a Moonstone — show both tiles highlighted at once.
// Shared 5s countdown. Whoever clicks first goes; the other follows.
// If Red acts first → existing red→blue sequential chain handles Blue.
// If Blue acts first → afterMoonstoneCallback offers Red afterward.
// If neither acts in 5s → both skip → checkLuckyStones().
// Saves up to 5s per round vs the old 5s+5s sequential wait.
// ============================================================
function startSimultaneousMoonstoneWindows() {
  B.phase = 'moonstone-shared';
  narrate(`<b class="red-text">Red</b> and <b class="blue-text">Blue</b> both have a <b style="color:var(--moonstone)">Moonstone!</b> Click yours to use it!`);
  log(`<span class="log-ms">Both teams have Moonstones!</span> Click yours to use — 5 seconds!`);

  const redResEl = document.getElementById('red-resources');
  const blueResEl = document.getElementById('blue-resources');
  const redMsTile  = redResEl  && redResEl.querySelector('.res-tile.moonstone');
  const blueMsTile = blueResEl && blueResEl.querySelector('.res-tile.moonstone');

  const state = { closed: false };

  const closeShared = () => {
    if (state.closed) return;
    state.closed = true;
    clearInterval(lsSharedTimer); lsSharedTimer = null;
    [redMsTile, blueMsTile].forEach(tile => {
      if (!tile) return;
      tile.classList.remove('rerollable');
      tile.onclick = null;
      tile.style.cursor = '';
    });
    document.querySelectorAll('.ls-shared-cd').forEach(el => el.remove());
  };

  const updateBadges = (r) => {
    [redMsTile, blueMsTile].forEach(tile => {
      if (!tile) return;
      let cd = tile.querySelector('.ls-shared-cd');
      if (!cd) {
        cd = document.createElement('div');
        cd.className = 'reroll-countdown ls-shared-cd';
        tile.style.position = 'relative';
        tile.appendChild(cd);
      }
      cd.textContent = r;
    });
  };

  let remaining = getSpecialsTimerSecs();
  updateBadges(remaining);
  clearInterval(lsSharedTimer); lsSharedTimer = null;
  lsSharedTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0 || state.closed) {
      clearInterval(lsSharedTimer); lsSharedTimer = null;
      if (!state.closed) {
        closeShared();
        log(`<span style="color:var(--text2)">Both teams passed on their Moonstones.</span>`);
        checkLuckyStones();
      }
    } else {
      updateBadges(remaining);
    }
  }, 1000);

  // Red tile click — Red goes first; existing red→blue chain in skipMoonstone/pickMsValue
  // automatically offers Blue afterward (no afterMoonstoneCallback needed).
  if (redMsTile) {
    redMsTile.classList.add('rerollable');
    redMsTile.style.cursor = 'pointer';
    redMsTile.onclick = () => {
      if (state.closed) return;
      closeShared();
      showMoonstoneChoice('red', B.pendingResolve.redDice || B.redDice);
    };
  }

  // Blue tile click — Blue goes first; afterMoonstoneCallback offers Red afterward.
  // Zero out B.msAvailable.blue before showing Red's window so the red→blue chain
  // in skipMoonstone/pickMsValue doesn't re-offer Blue (she already had her window).
  if (blueMsTile) {
    blueMsTile.classList.add('rerollable');
    blueMsTile.style.cursor = 'pointer';
    blueMsTile.onclick = () => {
      if (state.closed) return;
      closeShared();
      showMoonstoneChoice('blue', B.pendingResolve.blueDice || B.blueDice);
      B.afterMoonstoneCallback = () => {
        delete B.afterMoonstoneCallback;
        const redMsLeft = B.msAvailable ? B.msAvailable.red : 0;
        if (redMsLeft > 0 && B.red.resources.moonstone > 0) {
          if (B.msAvailable) B.msAvailable.blue = 0; // prevent double-offer of Blue
          showMoonstoneChoice('red', B.redDice);
          // After Red: skipMoonstone/pickMsValue see Blue=0 → fall to checkLuckyStones ✓
        } else {
          checkLuckyStones();
        }
      };
    };
  }
}

// ============================================================
// SAME-TEAM UNIFIED SPECIALS WINDOW
// One team has BOTH Moonstone + Lucky Stone(s).
// Show a single reaction window with both tiles highlighted, one shared timer.
// Player can use Moonstone once AND Lucky Stones multiple times, all in the same window.
// Timer resets briefly after each action (3s extension).
// ============================================================
function startSameTeamSpecialsWindow(team, finalCallback) {
  B.phase = 'specials-unified-' + team;
  showSkipBtn(() => closeWindow());
  const tLabel = team.charAt(0).toUpperCase() + team.slice(1);
  narrate(`<b class="${team}-text">${tLabel}</b> has a <b style="color:var(--moonstone)">Moonstone</b> and a <b class="gold">Lucky Stone!</b> Click either to use!`);

  const dice = team === 'red' ? B.pendingResolve.redDice : B.pendingResolve.blueDice;
  const diceEl = document.getElementById(team + '-dice');
  const resEl = document.getElementById(team + '-resources');
  const msTile = resEl && resEl.querySelector('.res-tile.moonstone');
  const lsTile = resEl && resEl.querySelector('.res-tile.luckyStone');

  const state = { closed: false, msUsed: false, picking: false, lsUsedCount: 0 };
  let sharedTimer = null;

  // Helper to get fresh DOM refs (renderBattle rebuilds innerHTML, stale refs break)
  const getMsTile = () => { const el = document.getElementById(team + '-resources'); return el && el.querySelector('.res-tile.moonstone'); };
  const getLsTile = () => { const el = document.getElementById(team + '-resources'); return el && el.querySelector('.res-tile.luckyStone'); };

  const updateBadge = (tile, val) => {
    if (!tile) return;
    let cd = tile.querySelector('.unified-cd');
    if (!cd) { cd = document.createElement('div'); cd.className = 'reroll-countdown unified-cd'; tile.style.position = 'relative'; tile.appendChild(cd); }
    cd.textContent = val;
    cd.style.animation = 'none'; requestAnimationFrame(() => { cd.style.animation = ''; });
  };
  const updateAllBadges = (val) => {
    const ms = getMsTile(); const ls = getLsTile();
    if (!state.msUsed && ms && ms.classList.contains('rerollable')) updateBadge(ms, val);
    if (ls && ls.classList.contains('rerollable')) updateBadge(ls, val);
  };
  const clearAllBadges = () => { document.querySelectorAll('.unified-cd').forEach(el => el.remove()); };

  const closeWindow = () => {
    if (state.closed) return;
    state.closed = true;
    hideSkipBtn();
    clearInterval(sharedTimer); sharedTimer = null;
    clearAllBadges();
    const ms = getMsTile(); const ls = getLsTile();
    if (ms) { ms.classList.remove('rerollable'); ms.onclick = null; ms.style.cursor = ''; clearMsCountdown(ms); }
    if (ls) { ls.classList.remove('rerollable'); ls.onclick = null; ls.style.cursor = ''; }
    clearDiceClickable(team);
    document.querySelectorAll('.reroll-countdown').forEach(el => el.remove());
    finalCallback();
  };

  const startTimer = (secs) => {
    clearInterval(sharedTimer); sharedTimer = null;
    clearAllBadges();
    let remaining = secs;
    updateAllBadges(remaining);
    sharedTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0 || state.closed) {
        clearInterval(sharedTimer); sharedTimer = null;
        if (!state.closed) {
          log(`<span style="color:var(--text2)">${team.toUpperCase()} specials window expired.</span>`);
          closeWindow();
        }
      } else {
        updateAllBadges(remaining);
      }
    }, 1000);
  };

  // Check if LS is still available and re-activate tile (with onclick re-bound)
  const refreshLsTile = () => {
    const ls = getLsTile();
    const lsAvail = B.lsAvailable ? B.lsAvailable[team] : 0;
    if (lsAvail > 0 && B[team].resources.luckyStone > 0 && ls) {
      ls.classList.add('rerollable');
      ls.style.cursor = 'pointer';
      ls.onclick = lsTileClick; // re-bind the click handler
    } else if (ls) {
      ls.classList.remove('rerollable');
      ls.onclick = null;
      ls.style.cursor = '';
    }
  };

  // Check if any action is still available, if not close
  const checkStillAvailable = () => {
    const hasMs = !state.msUsed && B[team].resources.moonstone > 0;
    const lsAvail = B.lsAvailable ? B.lsAvailable[team] : 0;
    const hasLs = lsAvail > 0 && B[team].resources.luckyStone > 0;
    if (!hasMs && !hasLs) {
      setTimeout(closeWindow, 400);
      return false;
    }
    return true;
  };

  // ─── Moonstone tile click ───
  const msTileClick = () => {
      if (state.closed || state.picking || state.msUsed) return;
      state.picking = true;
      clearInterval(sharedTimer); sharedTimer = null;
      clearAllBadges();
      const msCur = getMsTile();
      if (msCur) { msCur.classList.remove('rerollable'); msCur.onclick = null; msCur.style.cursor = ''; }

      // Enter die-pick phase for Moonstone
      B.pendingMoonstone = { team, dice: [...dice], dieIndex: null, phase: 'pick-die' };
      narrate(`<b class="${team}-text">${tLabel}</b> — pick a die to change!`);
      diceEl.querySelectorAll('.die').forEach((d, i) => {
        d.classList.add('rerollable');
        d.style.borderColor = 'var(--moonstone)';
        d.onclick = () => {
          clearInterval(msCountdownTimer);
          clearMsCountdown(diceEl);
          clearDiceClickable(team);
          document.querySelectorAll('.reroll-countdown').forEach(el => el.remove());

          // Now pick value via the standard picker
          B.pendingMoonstone.dieIndex = i;
          B.pendingMoonstone.phase = 'pick-value';
          narrate(`Die ${i+1} selected — pick a new value!`);
          document.getElementById('msPicker').classList.remove('active');
          const inlinePkr = document.getElementById('msInlinePicker');
          const inlineOps = document.getElementById('msInlineOptions');
          inlineOps.innerHTML = [1,2,3,4,5,6].map(v => `<div class="ms-die-option" onclick="pickMsValueUnified(${v})">${v}</div>`).join('');
          inlinePkr.classList.add('active');
          const arenaC = inlinePkr.parentElement;
          if (arenaC) arenaC.scrollIntoView({ behavior:'smooth', block:'center' });

          let valRem = 7;
          showLsCountdown(inlinePkr, valRem);
          msCountdownTimer = setInterval(() => {
            valRem--;
            if (valRem <= 0) {
              clearInterval(msCountdownTimer);
              el.classList.remove('active');
              clearMsCountdown(el);
              // Skip moonstone, mark as used phase
              state.msUsed = true;
              state.picking = false;
              B.pendingMoonstone = null;
              log(`<span style="color:var(--text2)">${team.toUpperCase()} holds their Moonstone.</span>`);
              if (checkStillAvailable()) {
                refreshLsTile();
                startTimer(Math.max(3, getSpecialsTimerSecs() - 2));
              }
            } else {
              showLsCountdown(el, valRem);
            }
          }, 1000);
        };
      });
      sync3dDiceClickable(team);

      // Die-pick countdown
      let pickRem = 5;
      showLsCountdown(diceEl, pickRem);
      clearInterval(msCountdownTimer);
      msCountdownTimer = setInterval(() => {
        pickRem--;
        if (pickRem <= 0) {
          clearInterval(msCountdownTimer);
          clearMsCountdown(diceEl);
          clearDiceClickable(team);
          state.msUsed = true;
          state.picking = false;
          B.pendingMoonstone = null;
          log(`<span style="color:var(--text2)">${team.toUpperCase()} holds their Moonstone.</span>`);
          if (checkStillAvailable()) {
            refreshLsTile();
            startTimer(Math.max(3, getSpecialsTimerSecs() - 2));
          }
        } else {
          showLsCountdown(diceEl, pickRem);
        }
      }, 1000);
  };

  if (msTile) {
    msTile.classList.add('rerollable');
    msTile.style.cursor = 'pointer';
    msTile.onclick = msTileClick;
  }

  // ─── Lucky Stone tile click ───
  const lsTileClick = () => {
    if (state.closed || state.picking) return;
    state.picking = true;
    clearInterval(sharedTimer); sharedTimer = null;
    clearAllBadges();
    const lsCur = getLsTile();
    if (lsCur) { lsCur.classList.remove('rerollable'); lsCur.onclick = null; lsCur.style.cursor = ''; }

    narrate(`<b class="${team}-text">${tLabel}</b> — pick a die to reroll!`);
    const liveDice = team === 'red' ? B.pendingResolve.redDice : B.pendingResolve.blueDice;
    diceEl.querySelectorAll('.die').forEach((d, i) => {
      d.classList.add('rerollable');
      d.onclick = () => {
        clearLsCountdown();
        clearDiceClickable(team);

        // Perform the reroll (prevent doLuckyReroll's own chaining — we handle it here)
        const savedAvail = B.lsAvailable ? B.lsAvailable[team] : 0;
        if (B.lsAvailable) B.lsAvailable[team] = 0;

        doLuckyReroll(team, i, liveDice, () => {
          state.picking = false;
          state.lsUsedCount++;
          if (B.lsAvailable) B.lsAvailable[team] = Math.max(0, savedAvail - 1);
          if (checkStillAvailable()) {
            refreshLsTile();
            // Re-activate MS tile if not used yet
            if (!state.msUsed && B[team].resources.moonstone > 0) {
              const msR = getMsTile();
              if (msR) { msR.classList.add('rerollable'); msR.style.cursor = 'pointer'; msR.onclick = msTileClick; }
            }
            startTimer(Math.max(3, getSpecialsTimerSecs() - 2));
          }
        });
      };
    });
    sync3dDiceClickable(team);

    let pickRem = Math.max(3, getSpecialsTimerSecs() - 2);
    showLsCountdown(diceEl, pickRem);
    clearInterval(lsCountdownTimer); lsCountdownTimer = null;
    lsCountdownTimer = setInterval(() => {
      pickRem--;
      if (pickRem <= 0) {
        clearInterval(lsCountdownTimer); lsCountdownTimer = null;
        clearLsCountdown();
        clearDiceClickable(team);
        state.picking = false;
        log(`<span style="color:var(--text2)">${team.toUpperCase()} didn't pick a die in time.</span>`);
        if (checkStillAvailable()) {
          refreshLsTile();
          if (!state.msUsed && B[team].resources.moonstone > 0) {
            const msR2 = getMsTile();
            if (msR2) { msR2.classList.add('rerollable'); msR2.style.cursor = 'pointer'; msR2.onclick = msTileClick; }
          }
          startTimer(Math.max(3, getSpecialsTimerSecs() - 2));
        }
      } else {
        showLsCountdown(diceEl, pickRem);
      }
    }, 1000);
  };

  if (lsTile) {
    lsTile.classList.add('rerollable');
    lsTile.style.cursor = 'pointer';
    lsTile.onclick = lsTileClick;
  }

  // Listen for Moonstone value selection completion
  const onMsDone = (e) => {
    if (e.detail.team !== team || state.closed) return;
    document.removeEventListener('unifiedMsDone', onMsDone);
    state.msUsed = true;
    state.picking = false;
    renderBattle();
    if (checkStillAvailable()) {
      refreshLsTile();
      startTimer(Math.max(3, getSpecialsTimerSecs() - 2));
    }
  };
  document.addEventListener('unifiedMsDone', onMsDone);

  // Start the initial shared timer
  startTimer(getSpecialsTimerSecs());
}

// Moonstone value picker callback for the unified specials window
// (separate from pickMsValue to avoid interfering with the standard MS flow)
function pickMsValueUnified(val) {
  clearInterval(msCountdownTimer);
  const ms = B.pendingMoonstone;
  if (!ms) return;
  const team = ms.team;
  const t = B[team];
  const f = active(t);

  const el = document.getElementById('msPicker');
  el.classList.remove('active');
  clearMsCountdown(el);
  document.getElementById('msInlinePicker').classList.remove('active');
  clearMsCountdown(document.getElementById('msInlinePicker'));

  // Benjamin (203) — Magic Touch: once per turn, don't decrement moonstone
  let magicTouchFired = false;
  if (f.id === 203 && !f.usedMagicTouch) {
    f.usedMagicTouch = true;
    magicTouchFired = true;
    showAbilityCallout('MAGIC TOUCH!', 'var(--moonstone)', `${f.name} — Moonstone used without discarding!`, team);
    log(`<span class="log-ability">${f.name}</span> — Magic Touch! Used Moonstone without discarding it!`);
  } else {
    t.resources.moonstone--;
    playSfx('sfxSpecial', 0.5);
  }
  applyMoonstoneSickness(team); // Moonstone Sickness — fires on USE (including Magic Touch)
  triggerCameronSpecialWatch(team, true); // Cameron (25) — Unstoppable Force (immediate post-roll die)

  ms.dice[ms.dieIndex] = val;
  ms.dice.sort((a,b)=>a-b);

  if (team==='red') B.pendingResolve.redDice = ms.dice;
  else B.pendingResolve.blueDice = ms.dice;
  B.redDice = B.pendingResolve.redDice;
  B.blueDice = B.pendingResolve.blueDice;
  renderDice(B.redDice, B.blueDice);

  const teamLabel = team.charAt(0).toUpperCase() + team.slice(1);
  log(`<span class="log-ms">Moonstone used!</span> ${team.toUpperCase()} changed die to ${val} → [${ms.dice.join(', ')}]`);
  narrate(`<b style="color:var(--moonstone)">Moonstone!</b>&nbsp;<b class="${team}-text">${teamLabel}</b> changes die to <b class="gold">${val}</b>! → [${ms.dice.join(', ')}]`);
  B.pendingMoonstone = null;

  // v731: broadcast Moonstone choice to Red's engine
  if (LIVE_PVP && PVP_SIDE === 'blue' && PVP_GAME_REF && team === 'blue') {
    PVP_GAME_REF.child('specialsChoice').push({
      type: 'moonstone',
      side: 'blue',
      dieIndex: ms.dieIndex,
      chosenValue: val,
      dice: ms.dice.slice(),
      ts: Date.now()
    });
  }

  // Bigsby (424) — Omen: if Bigsby is the active ghost when a Moonstone is used
  if (f.id === 424 && !f.ko) {
    const g = f;
    g.originalId = g.id; g.originalName = g.name; g.originalArt = g.art;
    g.originalMaxHp = g.maxHp; g.originalAbility = g.ability;
    g.originalAbilityDesc = g.abilityDesc; g.originalRarity = g.rarity;
    g.id = 112; g.name = "Doom"; g.maxHp = 7; g.hp = 7;
    g.ability = "Fiendship"; g.abilityDesc = "+2 bonus damage!";
    g.art = "art/originals/doom.jpg"; g.rarity = "legendary"; g.ko = false;
    queueAbility('TRANSFORMATION!', 'var(--legendary)', 'Bigsby sacrifices himself — DOOM rises!', null, team);
    log(`<span class="log-ability">Bigsby</span> — Omen! <span class="log-dmg">DOOM has arrived!</span>`);
    checkRipagooTransform(team);
    renderBattle();
  }

  // Dispatch a custom event so the unified window picks up the completion
  const msPostDelay = magicTouchFired ? 1600 : 1200;
  setTimeout(() => {
    document.dispatchEvent(new CustomEvent('unifiedMsDone', { detail: { team } }));
  }, msPostDelay);
}

// ============================================================
// CROSS-TYPE SPECIALS WINDOW
// One team has Moonstone, the other has Lucky Stone.
// Both tiles highlight simultaneously with a shared 5s countdown.
// If neither acts in 5s → both skip (saves ~5s vs 5s+5s sequential).
// If MS player acts first → LS player gets a fresh 5s after MS resolves.
// If LS player acts first → MS player gets a fresh 5s after LS resolves.
// ============================================================
function startCrossTypeSpecialsWindow(msTeam, lsTeam) {
  // Blue AI: if blue has either moonstone or lucky stone in cross-type window,
  // auto-use it so the player doesn't see blue's interactive prompts
  if (AI_ACTIVE && (msTeam === 'blue' || lsTeam === 'blue')) {
    // Auto-use blue's moonstone
    if (msTeam === 'blue' && B.blue.resources.moonstone > 0) {
      const dice = B.pendingResolve.blueDice || B.blueDice;
      let worstIdx = 0, worstVal = 7;
      dice.forEach((d, i) => { if (d < worstVal) { worstVal = d; worstIdx = i; } });
      dice[worstIdx] = 6;
      dice.sort((a, b) => a - b);
      B.blue.resources.moonstone--;
      applyMoonstoneSickness('blue'); // Moonstone Sickness
      triggerCameronSpecialWatch('blue', true); // Cameron (25) — Unstoppable Force (immediate post-roll die)
      B.blueDice = dice;
      log(`<span class="log-ms">BLUE uses Moonstone!</span> Changed ${worstVal} → 6!`);
      renderDice(B.redDice, B.blueDice);
    }
    // Auto-use blue's lucky stone
    if (lsTeam === 'blue' && B.blue.resources.luckyStone > 0) {
      const dice = B.pendingResolve.blueDice || B.blueDice;
      let worstIdx = 0, worstVal = 7;
      dice.forEach((d, i) => { if (d < worstVal) { worstVal = d; worstIdx = i; } });
      if (worstVal <= 4) {
        dice[worstIdx] = Math.floor(Math.random() * 6) + 1;
        dice.sort((a, b) => a - b);
        B.blue.resources.luckyStone--;
        B.blueDice = dice;
        log(`<span class="log-ms">BLUE uses Lucky Stone!</span> Rerolled ${worstVal}!`);
        renderDice(B.redDice, B.blueDice);
      }
    }
    // If the other team (red/player) still has their special, show only their window
    if (msTeam === 'red' && B.red.resources.moonstone > 0) {
      showMoonstoneChoice('red', B.pendingResolve.redDice || B.redDice);
      return;
    }
    if (lsTeam === 'red' && B.red.resources.luckyStone > 0) {
      startLuckyStoneWindow('red', () => {
        const pr = B.pendingResolve;
        if (pr) { B.pendingResolve = null; doResolve(pr.redDice, pr.blueDice, pr.redRoll, pr.blueRoll); }
      });
      return;
    }
    // Both auto-resolved — proceed to resolve
    setTimeout(() => {
      const pr = B.pendingResolve;
      if (pr) { B.pendingResolve = null; doResolve(pr.redDice, pr.blueDice, pr.redRoll, pr.blueRoll); }
    }, spd(800));
    return;
  }

  B.phase = 'specials-shared';
  const tLabel = t => t.charAt(0).toUpperCase() + t.slice(1);
  narrate(`<b class="${msTeam}-text">${tLabel(msTeam)}</b> has a <b style="color:var(--moonstone)">Moonstone</b> and <b class="${lsTeam}-text">${tLabel(lsTeam)}</b> has a <b class="gold">Lucky Stone!</b> Click yours to use it!`);

  const msDice = B.pendingResolve[msTeam === 'red' ? 'redDice' : 'blueDice'];
  const lsDice = B.pendingResolve[lsTeam === 'red' ? 'redDice' : 'blueDice'];

  const msResEl = document.getElementById(msTeam + '-resources');
  const msTile  = msResEl && msResEl.querySelector('.res-tile.moonstone');
  const lsResEl = document.getElementById(lsTeam + '-resources');
  const lsTile  = lsResEl && lsResEl.querySelector('.res-tile.luckyStone');
  const lsDiceEl = document.getElementById(lsTeam + '-dice');
  const msDiceEl = document.getElementById(msTeam + '-dice');

  const state = { closed: false };

  const closeBoth = () => {
    if (state.closed) return;
    state.closed = true;
    hideSkipBtn();
    clearInterval(lsSharedTimer); lsSharedTimer = null;
    // MS tile cleanup
    if (msTile) {
      msTile.classList.remove('rerollable');
      msTile.onclick = null;
      msTile.style.cursor = '';
      clearMsCountdown(msTile);
    }
    clearInterval(msCountdownTimer);
    // LS tile cleanup
    if (lsTile) {
      lsTile.classList.remove('rerollable');
      lsTile.onclick = null;
      lsTile.style.cursor = '';
    }
    document.querySelectorAll('.ls-shared-cd').forEach(el => el.remove());
    clearLsCountdown();
    clearDiceClickable(lsTeam);
  };
  showSkipBtn(() => closeBoth());

  // Shared countdown badges on both tiles
  const updateBadges = (r) => {
    if (msTile) {
      let cd = msTile.querySelector('.ls-shared-cd');
      if (!cd) {
        cd = document.createElement('div');
        cd.className = 'reroll-countdown ls-shared-cd';
        msTile.style.position = 'relative';
        msTile.appendChild(cd);
      }
      cd.textContent = r;
    }
    if (lsTile) {
      let cd = lsTile.querySelector('.ls-shared-cd');
      if (!cd) {
        cd = document.createElement('div');
        cd.className = 'reroll-countdown ls-shared-cd';
        lsTile.style.position = 'relative';
        lsTile.appendChild(cd);
      }
      cd.textContent = r;
    }
  };

  let remaining = getSpecialsTimerSecs();
  updateBadges(remaining);
  clearInterval(lsSharedTimer); lsSharedTimer = null;
  lsSharedTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0 || state.closed) {
      clearInterval(lsSharedTimer); lsSharedTimer = null;
      if (!state.closed) {
        closeBoth();
        log(`<span style="color:var(--text2)">Both teams passed on their specials.</span>`);
        resolveRound();
      }
    } else {
      updateBadges(remaining);
    }
  }, 1000);

  // ─── MS tile click ───────────────────────────────────────────
  if (msTile) {
    msTile.classList.add('rerollable');
    msTile.style.cursor = 'pointer';
    msTile.onclick = () => {
      if (state.closed) return;
      state.closed = true; // Lock out LS click while MS overlay is up
      clearInterval(lsSharedTimer); lsSharedTimer = null;
      document.querySelectorAll('.ls-shared-cd').forEach(el => el.remove());
      // Remove LS tile highlight (overlay blocks LS interaction anyway)
      if (lsTile) { lsTile.classList.remove('rerollable'); lsTile.onclick = null; lsTile.style.cursor = ''; }
      if (msTile) { clearMsCountdown(msTile); msTile.classList.remove('rerollable'); msTile.onclick = null; msTile.style.cursor = ''; }

      // After MS completes (use or skip), offer LS player their window
      B.afterMoonstoneCallback = () => {
        delete B.afterMoonstoneCallback;
        const lsAvail = B.lsAvailable ? B.lsAvailable[lsTeam] : 0;
        if (lsAvail > 0 && B[lsTeam].resources.luckyStone > 0) {
          startLuckyStoneWindow(lsTeam, () => resolveRound());
        } else {
          resolveRound();
        }
      };

      // Enter die-pick phase directly (skip re-showing the tile countdown)
      B.pendingMoonstone = { team: msTeam, dice: [...msDice], dieIndex: null, phase: 'pick-die' };
      narrate(`<b class="${msTeam}-text">${tLabel(msTeam)}</b> — pick a die to change!`);
      msDiceEl.querySelectorAll('.die').forEach((d, i) => {
        d.classList.add('rerollable');
        d.style.borderColor = 'var(--moonstone)';
        d.onclick = () => pickMsDie(i);
      });
      sync3dDiceClickable(msTeam);
      let pickRemaining = getSpecialsTimerSecs();
      showLsCountdown(msDiceEl, pickRemaining);
      clearInterval(msCountdownTimer);
      msCountdownTimer = setInterval(() => {
        pickRemaining--;
        if (pickRemaining <= 0) {
          clearInterval(msCountdownTimer);
          clearMsCountdown(msDiceEl);
          clearDiceClickable(msTeam);
          skipMoonstone();
        } else {
          showLsCountdown(msDiceEl, pickRemaining);
        }
      }, 1000);
    };
  }

  // ─── LS tile click ───────────────────────────────────────────
  if (lsTile) {
    lsTile.classList.add('rerollable');
    lsTile.style.cursor = 'pointer';
    lsTile.onclick = () => {
      if (state.closed) return;
      state.closed = true; // Lock out MS click while LS is running
      clearInterval(lsSharedTimer); lsSharedTimer = null;
      document.querySelectorAll('.ls-shared-cd').forEach(el => el.remove());
      if (msTile) { clearMsCountdown(msTile); msTile.classList.remove('rerollable'); msTile.onclick = null; msTile.style.cursor = ''; }
      if (lsTile) { lsTile.classList.remove('rerollable'); lsTile.onclick = null; lsTile.style.cursor = ''; }

      // After LS completes, offer MS player their window
      const afterLs = () => {
        const msAvail = B.msAvailable ? B.msAvailable[msTeam] : 0;
        if (msAvail > 0 && B[msTeam].resources.moonstone > 0) {
          showMoonstoneChoice(msTeam, msTeam === 'red' ? B.redDice : B.blueDice);
          B.afterMoonstoneCallback = () => {
            delete B.afterMoonstoneCallback;
            resolveRound();
          };
        } else {
          resolveRound();
        }
      };

      // LS die-pick phase
      narrate(`<b class="${lsTeam}-text">${tLabel(lsTeam)}</b> — pick a die to reroll!`);
      lsDiceEl.querySelectorAll('.die').forEach((d, i) => {
        d.classList.add('rerollable');
        d.onclick = () => doLuckyReroll(lsTeam, i, lsDice, afterLs);
      });
      sync3dDiceClickable(lsTeam);
      let pickRemaining = Math.max(3, getSpecialsTimerSecs() - 2);
      showLsCountdown(lsDiceEl, pickRemaining);
      clearInterval(lsCountdownTimer); lsCountdownTimer = null;
      lsCountdownTimer = setInterval(() => {
        pickRemaining--;
        if (pickRemaining <= 0) {
          clearInterval(lsCountdownTimer); lsCountdownTimer = null;
          clearLsCountdown();
          clearDiceClickable(lsTeam);
          log(`<span style="color:var(--text2)">${lsTeam.toUpperCase()} didn't pick a die in time.</span>`);
          afterLs();
        } else {
          showLsCountdown(lsDiceEl, pickRemaining);
        }
      }, 1000);
    };
  }
}

// ============================================================
// v731: PvP SPECIALS SYNC — Blue broadcasts "done", Red waits
// ============================================================
// Blue calls this after all specials (MS + LS) are finished,
// right before resolveRound(). Red listens for the signal.
function pvpBroadcastSpecialsDone() {
  if (!LIVE_PVP || PVP_SIDE !== 'blue' || !PVP_GAME_REF || !B) return;
  PVP_GAME_REF.child('specialsDone').set({
    blueDice: (B.pendingResolve ? B.pendingResolve.blueDice : B.blueDice || []).slice(),
    ts: Date.now()
  });
}

// Red calls this instead of resolveRound() after its own specials.
// If Blue had any specials available this round, Red waits for Blue's
// "specialsDone" signal (with final dice). Otherwise resolves immediately.
let _pvpSpecialsDoneRef = null; // listener handle for cleanup
function pvpWaitForBlueSpecials() {
  if (!LIVE_PVP || PVP_SIDE !== 'red' || !PVP_GAME_REF || !B) { resolveRound(); return; }

  // Check if Blue had any specials this round
  const blueMsAvail = B.msAvailable ? B.msAvailable.blue : 0;
  const blueLsAvail = B.lsAvailable ? B.lsAvailable.blue : 0;
  const blueHadMS = blueMsAvail > 0 && B.blue.resources.moonstone > 0;
  const blueHadLS = blueLsAvail > 0 && B.blue.resources.luckyStone > 0;

  if (!blueHadMS && !blueHadLS) { resolveRound(); return; }

  // Wait for Blue's specialsDone signal (with timeout safety)
  log(`<span style="color:var(--text2)">Waiting for Blue's specials...</span>`);
  let resolved = false;
  const finish = (blueDice) => {
    if (resolved) return;
    resolved = true;
    if (_pvpSpecialsDoneRef) { PVP_GAME_REF.child('specialsDone').off('value', _pvpSpecialsDoneRef); _pvpSpecialsDoneRef = null; }
    clearTimeout(safetyTimeout);
    PVP_GAME_REF.child('specialsDone').set(null);
    PVP_GAME_REF.child('specialsChoice').remove();
    // Apply Blue's final dice
    if (blueDice && blueDice.length && B.pendingResolve) {
      B.pendingResolve.blueDice = blueDice;
      B.blueDice = blueDice;
      renderDice(B.pendingResolve.redDice, blueDice);
    }
    resolveRound();
  };

  _pvpSpecialsDoneRef = PVP_GAME_REF.child('specialsDone').on('value', snap => {
    const data = snap.val();
    if (!data || !data.blueDice) return;
    finish(data.blueDice);
  });

  // Safety timeout — if Blue disconnects or something breaks, don't deadlock
  const safetyTimeout = setTimeout(() => {
    if (!resolved) {
      log(`<span style="color:var(--text2)">Blue specials timed out — resolving with current dice.</span>`);
      finish(null);
    }
  }, 15000);
}

// ============================================================
// LUCKY STONE — countdown + clickable dice reroll
// ============================================================
let lsCountdownTimer = null;
let lsSharedTimer = null; // separate timer for the simultaneous Lucky Stone window

function checkLuckyStones() {
  // Only offer Lucky Stones that existed BEFORE this round (not gained this turn)
  const redAvail = B.lsAvailable ? B.lsAvailable.red : 0;
  const blueAvail = B.lsAvailable ? B.lsAvailable.blue : 0;
  const redHasLS = redAvail > 0 && B.red.resources.luckyStone > 0;
  const blueHasLS = blueAvail > 0 && B.blue.resources.luckyStone > 0;

  if (!redHasLS && !blueHasLS) { resolveRound(); return; }

  // v728: PvP Blue local resolution — show Blue's own LS picker, skip Red's
  if (LIVE_PVP && PVP_SIDE === 'blue' && pvpBlueResolvedLocally) {
    if (blueHasLS) {
      startLuckyStoneWindow('blue', () => { pvpBroadcastSpecialsDone(); resolveRound(); });
    } else {
      pvpBroadcastSpecialsDone(); // v731: tell Red we're done with specials
      resolveRound();
    }
    return;
  }
  // v728: PvP Red — show Red's own LS picker, skip Blue's
  if (LIVE_PVP && PVP_SIDE === 'red') {
    if (redHasLS) {
      startLuckyStoneWindow('red', () => pvpWaitForBlueSpecials());
    } else {
      pvpWaitForBlueSpecials(); // v731: wait for Blue's LS/MS choices before resolving
    }
    return;
  }

  // Both teams have Lucky Stones — show simultaneously (saves up to 3s vs sequential)
  if (redHasLS && blueHasLS) {
    startSimultaneousLuckyStoneWindows();
    return;
  }

  // Only one team has stones — single sequential window (unchanged)
  if (redHasLS) { startLuckyStoneWindow('red', () => resolveRound()); return; }
  startLuckyStoneWindow('blue', () => resolveRound());
}

// Simultaneous Lucky Stone window: both teams' tiles highlight at the same time.
// Shared 5-second countdown. Either team can act; die-pick phases are serialized
// (one team at a time) to avoid timer conflicts on lsCountdownTimer.
function startSimultaneousLuckyStoneWindows() {
  B.phase = 'luckystone-shared';
  narrate(`Both teams have <b class="gold">Lucky Stones!</b> Click yours to use it!`);

  const state = { redDone: false, blueDone: false, pickingTeam: null, closed: false };

  const closeShared = () => {
    if (state.closed) return;
    state.closed = true;
    hideSkipBtn();
    clearInterval(lsSharedTimer); lsSharedTimer = null;
    clearLsCountdown();
    ['red', 'blue'].forEach(t => {
      clearDiceClickable(t);
      const resEl = document.getElementById(t + '-resources');
      const lsEl = resEl && resEl.querySelector('.res-tile.luckyStone');
      if (lsEl) { lsEl.classList.remove('rerollable'); lsEl.onclick = null; lsEl.style.cursor = ''; }
    });
    document.querySelectorAll('.ls-shared-cd').forEach(el => el.remove());
    resolveRound();
  };
  showSkipBtn(() => closeShared());

  const checkBothDone = () => { if (state.redDone && state.blueDone) closeShared(); };

  // Show/update the shared countdown badge on both active tiles
  const updateSharedBadges = (remaining) => {
    ['red', 'blue'].forEach(t => {
      const done = t === 'red' ? state.redDone : state.blueDone;
      if (done || state.pickingTeam === t) return;
      const resEl = document.getElementById(t + '-resources');
      const lsEl = resEl && resEl.querySelector('.res-tile.luckyStone');
      if (!lsEl || !lsEl.classList.contains('rerollable')) return;
      let cd = lsEl.querySelector('.ls-shared-cd');
      if (!cd) {
        cd = document.createElement('div');
        cd.className = 'reroll-countdown ls-shared-cd';
        lsEl.style.position = 'relative';
        lsEl.appendChild(cd);
      }
      cd.textContent = remaining;
      cd.style.animation = 'none';
      requestAnimationFrame(() => { cd.style.animation = ''; });
    });
  };

  const restartSharedCountdown = (secs) => {
    if (state.closed) return;
    clearInterval(lsSharedTimer); lsSharedTimer = null;
    document.querySelectorAll('.ls-shared-cd').forEach(el => el.remove());
    let remaining = secs;
    updateSharedBadges(remaining);
    lsSharedTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0 || state.closed) {
        clearInterval(lsSharedTimer); lsSharedTimer = null;
        document.querySelectorAll('.ls-shared-cd').forEach(el => el.remove());
        if (!state.closed) {
          log(`<span style="color:var(--text2)">Lucky Stone window expired.</span>`);
          closeShared();
        }
      } else {
        updateSharedBadges(remaining);
      }
    }, 1000);
  };

  // Activate a team's LS tile in shared mode
  const activateTile = (team) => {
    if (state.closed || (team === 'red' ? state.redDone : state.blueDone)) return;
    const dice = team === 'red' ? B.pendingResolve.redDice : B.pendingResolve.blueDice;
    const resEl = document.getElementById(team + '-resources');
    const lsEl = resEl && resEl.querySelector('.res-tile.luckyStone');
    const diceEl = document.getElementById(team + '-dice');
    const teamLabel = team.charAt(0).toUpperCase() + team.slice(1);
    if (!lsEl) { if (team === 'red') state.redDone = true; else state.blueDone = true; return; }

    lsEl.classList.add('rerollable');
    lsEl.style.cursor = 'pointer';
    lsEl.onclick = () => {
      if (state.closed || state.pickingTeam) return; // serialized: wait if other team is picking
      state.pickingTeam = team;
      // Pause shared countdown while this team picks a die
      clearInterval(lsSharedTimer); lsSharedTimer = null;
      document.querySelectorAll('.ls-shared-cd').forEach(el => el.remove());
      lsEl.classList.remove('rerollable'); lsEl.onclick = null; lsEl.style.cursor = '';

      narrate(`<b class="${team}-text">${teamLabel}</b> — pick a die to reroll!`);
      const dieDivs = diceEl.querySelectorAll('.die');
      dieDivs.forEach((d, i) => {
        d.classList.add('rerollable');
        d.onclick = () => {
          clearLsCountdown();
          clearDiceClickable(team);
          // Zero lsAvailable[team] so doLuckyReroll won't spawn a new sequential window;
          // we handle multi-stone re-offering ourselves in the callback.
          const savedAvail = B.lsAvailable ? B.lsAvailable[team] : 0;
          if (B.lsAvailable) B.lsAvailable[team] = 0;

          doLuckyReroll(team, i, dice, () => {
            state.pickingTeam = null;
            if (B.lsAvailable) B.lsAvailable[team] = Math.max(0, savedAvail - 1);
            const tObj = B[team];
            const stillAvail = B.lsAvailable ? B.lsAvailable[team] : 0;
            if (tObj.resources.luckyStone > 0 && stillAvail > 0) {
              // More stones — re-activate tile, resume shared countdown.
              // stillAvail is already correctly set to savedAvail-1 (line above),
              // representing the remaining authorized uses. Do NOT decrement again here —
              // the next click will capture the correct savedAvail from B.lsAvailable[team].
              setTimeout(() => { if (state.closed) return; activateTile(team); restartSharedCountdown(getSpecialsTimerSecs()); }, 600);
            } else {
              if (team === 'red') state.redDone = true; else state.blueDone = true;
              if (!state.closed) {
                const otherDone = team === 'red' ? state.blueDone : state.redDone;
                if (!otherDone) setTimeout(() => restartSharedCountdown(getSpecialsTimerSecs()), 600);
                else checkBothDone();
              }
            }
          });
        };
      });
      sync3dDiceClickable(team);

      // 3s die-pick sub-countdown (safe: serialized by pickingTeam)
      let pickRem = Math.max(3, getSpecialsTimerSecs() - 2);
      showLsCountdown(diceEl, pickRem);
      lsCountdownTimer = setInterval(() => {
        pickRem--;
        if (pickRem <= 0) {
          clearLsCountdown();
          clearDiceClickable(team);
          log(`<span style="color:var(--text2)">${team.toUpperCase()} didn't pick a die in time.</span>`);
          state.pickingTeam = null;
          if (team === 'red') state.redDone = true; else state.blueDone = true;
          if (!state.closed) {
            const otherDone = team === 'red' ? state.blueDone : state.redDone;
            if (!otherDone) setTimeout(() => restartSharedCountdown(Math.max(3, getSpecialsTimerSecs() - 2)), 100);
            else checkBothDone();
          }
        } else { showLsCountdown(diceEl, pickRem); }
      }, 1000);
    };
  };

  // Activate both tiles simultaneously
  activateTile('red');
  activateTile('blue');

  // AI blue: auto-use Lucky Stone (reroll lowest die) instead of waiting for DOM click
  if (AI_ACTIVE && !state.blueDone) {
    const dice = B.pendingResolve ? B.pendingResolve.blueDice : null;
    if (dice && B.blue.resources.luckyStone > 0) {
      let worstIdx = 0, worstVal = 7;
      dice.forEach((d, i) => { if (d < worstVal) { worstVal = d; worstIdx = i; } });
      if (worstVal <= 4) {
        B.blue.resources.luckyStone--;
        B.luckyStoneSpentThisTurn.blue++;
        const newVal = Math.floor(Math.random() * 6) + 1;
        dice[worstIdx] = newVal;
        dice.sort((a, b) => a - b);
        log(`<span class="log-ms">BLUE uses Lucky Stone!</span> Rerolled ${worstVal} → ${newVal}!`);
        narrate(`<b class="blue-text">Blue</b> uses <b class="gold">Lucky Stone!</b> ${worstVal} → ${newVal}!`);
        renderDice(B.redDice, B.blueDice);
        renderBattle();
      } else {
        log(`<span style="color:var(--text2)">BLUE holds Lucky Stone (${worstVal} is good enough).</span>`);
      }
    }
    // Mark blue as done — clear its tile
    state.blueDone = true;
    const blueResEl = document.getElementById('blue-resources');
    const blueLsEl = blueResEl && blueResEl.querySelector('.res-tile.luckyStone');
    if (blueLsEl) { blueLsEl.classList.remove('rerollable'); blueLsEl.onclick = null; blueLsEl.style.cursor = ''; }
  }

  checkBothDone(); // in case neither team had a tile element (or AI already resolved blue)
  if (!state.closed) restartSharedCountdown(getSpecialsTimerSecs());
}

// ============================================================
// FLICK — Charlie (18) physics-based die fling
// Normal roll plays out fully. Lowest die slides below the tray
// into open arena space. Player grabs and flings it upward into
// the lined-up dice. Physics runs in arena-center space — the
// tray has NO walls. All moved dice get new random results.
// ============================================================
function showFlickPicker(team, callback) {
  B.phase = 'flick-' + team;
  const myDice = team === 'red' ? B.pendingResolve.redDice : B.pendingResolve.blueDice;
  const oppTeam = team === 'red' ? 'blue' : 'red';
  const oppDice = team === 'red' ? B.pendingResolve.blueDice : B.pendingResolve.redDice;
  const teamLabel = team.charAt(0).toUpperCase() + team.slice(1);

  // Blue AI: auto-Flick lowest die into opponent's highest
  if (AI_ACTIVE && team === 'blue') {
    const oldVal = myDice[0];
    myDice[0] = Math.floor(Math.random() * 6) + 1;
    myDice.sort((a, b) => a - b);
    log(`<span class="log-ability">Charlie</span> — Rush! Flicked ${oldVal} → <b>${myDice[0]}</b>!`);
    if (oppDice.length > 0) {
      const ti = oppDice.length - 1;
      const tOld = oppDice[ti];
      oppDice[ti] = Math.floor(Math.random() * 6) + 1;
      oppDice.sort((a, b) => a - b);
      log(`<span class="log-ability">Charlie</span> — Contact! ${oppTeam} die ${tOld} → <b>${oppDice[oppDice.length-1]}</b>!`);
    }
    B.redDice = B.pendingResolve.redDice;
    B.blueDice = B.pendingResolve.blueDice;
    renderDice(B.redDice, B.blueDice);
    showAbilityCallout('RUSH!', '#f59e0b', 'Charlie — Flick!', team);
    setTimeout(() => callback(), spd(800));
    return;
  }

  narrate(`<b class="${team}-text">${teamLabel}</b> — <b style="color:#f59e0b">Rush!</b> Grab &amp; fling your lowest die!`);
  log(`<span class="log-ability">Charlie</span> — Rush! Flick activated!`);
  showAbilityCallout('RUSH!', '#f59e0b', 'Charlie — Fling a die!', team);

  // 1. Kill 3D dice, render flat
  ['red','blue'].forEach(t => {
    const ph = _dicePhysics[t];
    if (ph) { cancelAnimationFrame(ph.raf); ph.els.forEach(e => e.remove()); delete _dicePhysics[t]; }
  });
  renderDice(B.redDice, B.blueDice);

  // 2. Use full arena-board as physics space (entire battle screen)
  const board = document.querySelector('.arena-board');
  const center = document.querySelector('.arena-center');
  const centerRect = board.getBoundingClientRect();
  const physW = board.offsetWidth;
  const physH = board.offsetHeight;
  const tray = document.querySelector('.dice-stack');
  const trayRect = tray.getBoundingClientRect();
  const redRow = document.getElementById('red-dice');
  const blueRow = document.getElementById('blue-dice');
  const redDieEls = [...redRow.querySelectorAll('.die')];
  const blueDieEls = [...blueRow.querySelectorAll('.die')];
  const dieSize = redDieEls[0]?.offsetWidth || 56;
  const dieR = dieSize / 2;

  // 3. Record positions, create 3D physics dice
  const bodies = [];
  const allEls = [...redDieEls, ...blueDieEls];
  const flickEls = []; // 3D elements to clean up

  allEls.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const cx = r.left - centerRect.left + r.width / 2;
    const cy = r.top - centerRect.top + r.height / 2;
    const dTeam = i < redDieEls.length ? 'red' : 'blue';
    const dIdx = i < redDieEls.length ? i : i - redDieEls.length;
    const val = dTeam === 'red' ? B.redDice[dIdx] : B.blueDice[dIdx];

    // Create 3D die (same structure as showRolling)
    const die3d = document.createElement('div');
    die3d.className = 'die-physics';
    die3d.style.width = dieSize + 'px';
    die3d.style.height = dieSize + 'px';
    die3d.style.zIndex = '100';
    die3d.style.setProperty('--dh', dieR + 'px');
    die3d.innerHTML = `<div class="die-cube">${cube3dHTML(dTeam)}</div>`;
    const cube = die3d.querySelector('.die-cube');
    const ft = FACE_TARGET[val] || { rx: 0, ry: 0 };

    bodies.push({
      el: die3d, cube,
      cx, cy, vx: 0, vy: 0,
      rx: ft.rx, ry: ft.ry, rz: 0,
      vrx: 0, vry: 0, vrz: 0,
      origCx: cx, origCy: cy,
      team: dTeam, dieIndex: dIdx,
      isFlicker: dTeam === team && dIdx === 0,
      moved: false
    });
    flickEls.push(die3d);
  });

  // 4. Place 3D dice on arena-board, hide flat dice
  board.style.position = 'relative';
  board.style.overflow = 'hidden';
  redRow.style.visibility = 'hidden';
  blueRow.style.visibility = 'hidden';
  bodies.forEach(b => {
    b.el.style.left = (b.cx - dieR) + 'px';
    b.el.style.top = (b.cy - dieR) + 'px';
    b.cube.style.transform = `rotateX(${b.rx}deg) rotateY(${b.ry}deg)`;
    board.appendChild(b.el);
  });

  // 5. Position flicker die below tray, centered on board
  const flicker = bodies.find(b => b.isFlicker);
  const trayBottom = trayRect.bottom - centerRect.top;
  flicker.cx = physW / 2; // centered on the full board
  flicker.cy = trayBottom + dieSize * 0.8;
  // Clamp so it stays inside arena-center
  flicker.cy = Math.min(flicker.cy, physH - dieR - 8);
  flicker.origCx = flicker.cx;
  flicker.origCy = flicker.cy;
  flicker.el.style.transition = 'left 0.3s ease-out, top 0.3s ease-out';
  flicker.el.style.left = (flicker.cx - dieR) + 'px';
  flicker.el.style.top = (flicker.cy - dieR) + 'px';
  flicker.el.style.filter = 'drop-shadow(0 0 12px rgba(245,158,11,0.9))';
  flicker.el.style.cursor = 'grab';
  setTimeout(() => { flicker.el.style.transition = 'none'; }, 350);

  // -- Restore helper --
  const restoreLayout = () => {
    clearLsCountdown();
    flickEls.forEach(el => el.remove()); // remove 3D physics dice
    redRow.style.visibility = '';
    blueRow.style.visibility = '';
    board.style.overflow = '';
  };

  // 6. Mouse / touch fling
  let isDragging = false;
  let mouseHist = [];
  let launched = false;
  let flickRaf = null;

  const evtXY = (e) => {
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - centerRect.left, y: src.clientY - centerRect.top };
  };

  const onDown = (e) => {
    if (launched) return;
    e.preventDefault();
    const p = evtXY(e);
    const dx = p.x - flicker.cx, dy = p.y - flicker.cy;
    if (Math.sqrt(dx * dx + dy * dy) > dieR * 2.5) return;
    isDragging = true;
    flicker.el.style.cursor = 'grabbing';
    mouseHist = [{ x: p.x, y: p.y, t: performance.now() }];
  };

  const onMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const p = evtXY(e);
    p.x = Math.max(dieR, Math.min(physW - dieR, p.x));
    p.y = Math.max(dieR, Math.min(physH - dieR, p.y));
    mouseHist.push({ x: p.x, y: p.y, t: performance.now() });
    if (mouseHist.length > 12) mouseHist.shift();
    flicker.cx = p.x;
    flicker.cy = p.y;
    flicker.el.style.left = (p.x - dieR) + 'px';
    flicker.el.style.top = (p.y - dieR) + 'px';
  };

  const removeListeners = () => {
    flicker.el.removeEventListener('mousedown', onDown);
    flicker.el.removeEventListener('touchstart', onDown);
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
  };

  const onUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    launched = true;
    flicker.el.style.cursor = '';
    clearLsCountdown();
    removeListeners();

    const now = performance.now();
    const recent = mouseHist.filter(p => now - p.t < 150);
    if (recent.length >= 2) {
      const first = recent[0], last = recent[recent.length - 1];
      const dt = Math.max((last.t - first.t) / 16.67, 0.5);
      flicker.vx = (last.x - first.x) / dt;
      flicker.vy = (last.y - first.y) / dt;
      const sp = Math.sqrt(flicker.vx * flicker.vx + flicker.vy * flicker.vy);
      if (sp > 35) { flicker.vx = (flicker.vx / sp) * 35; flicker.vy = (flicker.vy / sp) * 35; }
      if (sp < 2) { flicker.vx = 0; flicker.vy = 0; }
    }

    playSfx('sfxDiceRoll');
    physStart = performance.now(); // start timer NOW, not when UI appeared
    flickRaf = requestAnimationFrame(physStep);
  };

  flicker.el.addEventListener('mousedown', onDown);
  flicker.el.addEventListener('touchstart', onDown, { passive: false });
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onUp);

  // 7. Physics — full arena-board walls, force-settle after 2.5s
  const BOUNCE_WALL = 0.5;   // walls absorb energy
  const BOUNCE_DIE = 0.85;   // die-die collisions: punchy but energy-losing
  const SETTLE_THRESH = 0.3;
  const PAD = 12;
  let collisionCooldown = 0;
  let physStart = 0; // set when fling launches, not when UI appears
  const FORCE_SETTLE_MS = 2500; // force stop after 2.5 seconds

  const physStep = () => {
    let maxSpd = 0;
    collisionCooldown = Math.max(0, collisionCooldown - 1);

    // Time-based friction ramp: starts normal, ramps hard after 1.5s
    const elapsed = performance.now() - physStart;
    const baseFriction = 0.96;
    const friction = elapsed > 1500
      ? baseFriction * Math.pow(0.97, (elapsed - 1500) / 100) // progressive slowdown
      : baseFriction;

    // Force settle if time exceeded
    if (elapsed > FORCE_SETTLE_MS) {
      cancelAnimationFrame(flickRaf);
      settleFlick();
      return;
    }

    // Sub-step physics to prevent tunneling at high velocity
    // At max fling (35 px/frame) and dieSize ~56, a die can skip past another.
    // 3 sub-steps = max ~12 px/step, well within the 56px collision radius.
    const SUB_STEPS = 3;
    const subFric = Math.pow(friction, 1 / SUB_STEPS);
    for (let ss = 0; ss < SUB_STEPS; ss++) {
      bodies.forEach(b => {
        b.cx += b.vx / SUB_STEPS; b.cy += b.vy / SUB_STEPS;
        b.vx *= subFric; b.vy *= subFric;
      });

      // Elastic collisions
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i], c = bodies[j];
          const dx = c.cx - a.cx, dy = c.cy - a.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < dieSize && dist > 0.01) {
            const nx = dx / dist, ny = dy / dist;
            const rvn = (a.vx - c.vx) * nx + (a.vy - c.vy) * ny;
            if (rvn > 0) {
              const imp = rvn * BOUNCE_DIE;
              a.vx -= imp * nx; a.vy -= imp * ny;
              c.vx += imp * nx; c.vy += imp * ny;
              // 3D tumble on impact
              const spinF = Math.min(rvn * 20, 400);
              a.vrx += (Math.random()-0.5) * spinF; a.vry += (Math.random()-0.5) * spinF; a.vrz += (Math.random()-0.5) * spinF * 0.5;
              c.vrx += (Math.random()-0.5) * spinF; c.vry += (Math.random()-0.5) * spinF; c.vrz += (Math.random()-0.5) * spinF * 0.5;
              if (collisionCooldown === 0) { playSfx('sfxDiceRoll', 0.15); collisionCooldown = 10; }
            }
            const ov = (dieSize - dist) / 2 + 0.5;
            a.cx -= ov * nx; a.cy -= ov * ny;
            c.cx += ov * nx; c.cy += ov * ny;
          }
        }
      }

      // Wall bounce
      bodies.forEach(b => {
        if (b.cx - dieR < PAD) { b.cx = PAD + dieR; b.vx = Math.abs(b.vx) * BOUNCE_WALL; b.vrx += (Math.random()-0.5)*120; b.vry += (Math.random()-0.5)*120; }
        if (b.cx + dieR > physW - PAD) { b.cx = physW - PAD - dieR; b.vx = -Math.abs(b.vx) * BOUNCE_WALL; b.vrx += (Math.random()-0.5)*120; b.vry += (Math.random()-0.5)*120; }
        if (b.cy - dieR < PAD) { b.cy = PAD + dieR; b.vy = Math.abs(b.vy) * BOUNCE_WALL; b.vrx += (Math.random()-0.5)*120; b.vry += (Math.random()-0.5)*120; }
        if (b.cy + dieR > physH - PAD) { b.cy = physH - PAD - dieR; b.vy = -Math.abs(b.vy) * BOUNCE_WALL; b.vrx += (Math.random()-0.5)*120; b.vry += (Math.random()-0.5)*120; }
      });
    }

    // Update 3D rotation — [shadow] perf: batch all JS reads before DOM writes to avoid layout thrash
    // Pass 1: all state updates + settle-threshold check (reads only)
    bodies.forEach(b => {
      b.rx += b.vrx; b.ry += b.vry; b.rz += b.vrz;
      b.vrx *= 0.93; b.vry *= 0.93; b.vrz *= 0.93; // angular friction
      const s = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      const rotSpd = Math.abs(b.vrx) + Math.abs(b.vry) + Math.abs(b.vrz);
      const totalMotion = s + rotSpd * 0.05;
      if (totalMotion > maxSpd) maxSpd = totalMotion;
    });
    // Pass 2: all DOM writes (batched to prevent interleaved forced reflow)
    bodies.forEach(b => {
      b.el.style.left = (b.cx - dieR) + 'px';
      b.el.style.top = (b.cy - dieR) + 'px';
      b.cube.style.transform = `rotateX(${b.rx}deg) rotateY(${b.ry}deg) rotateZ(${b.rz}deg)`;
    });

    if (maxSpd < SETTLE_THRESH) {
      cancelAnimationFrame(flickRaf);
      settleFlick();
    } else {
      flickRaf = requestAnimationFrame(physStep);
    }
  };

  // 8. Settle — read face value from 3D rotation, snap to nearest face
  const settleFlick = () => {
    let changed = 0;
    const flickerBody = bodies.find(b => b.isFlicker);
    bodies.forEach(b => {
      const dx = b.cx - b.origCx, dy = b.cy - b.origCy;
      b.moved = !b.isFlicker && Math.sqrt(dx * dx + dy * dy) > 15;
      if (b.moved) {
        changed++;
        // The 3D rotation determines the new value — not random!
        const nv = getFlickFaceValue(b.rx, b.ry);
        const ft = FACE_TARGET[nv] || { rx: 0, ry: 0 };
        b.cube.style.transition = 'transform 0.35s cubic-bezier(0.25,0.1,0.25,1)';
        b.cube.style.transform = `rotateX(${nearestSnap(b.rx, ft.rx)}deg) rotateY(${nearestSnap(b.ry, ft.ry)}deg) rotateZ(${nearestSnap(b.rz, 0)}deg)`;
        if (b.team === 'red') B.pendingResolve.redDice[b.dieIndex] = nv;
        else B.pendingResolve.blueDice[b.dieIndex] = nv;
      } else {
        // Didn't move or is the flicker die — snap to original/current face
        const val = b.isFlicker
          ? getFlickFaceValue(b.rx, b.ry)
          : (b.team === 'red' ? B.pendingResolve.redDice[b.dieIndex] : B.pendingResolve.blueDice[b.dieIndex]);
        if (b.isFlicker) {
          // Flicker die always changes its own value
          if (b.team === 'red') B.pendingResolve.redDice[b.dieIndex] = val;
          else B.pendingResolve.blueDice[b.dieIndex] = val;
        }
        const ft = FACE_TARGET[val] || { rx: 0, ry: 0 };
        b.cube.style.transition = 'transform 0.35s cubic-bezier(0.25,0.1,0.25,1)';
        b.cube.style.transform = `rotateX(${nearestSnap(b.rx, ft.rx)}deg) rotateY(${nearestSnap(b.ry, ft.ry)}deg) rotateZ(${nearestSnap(b.rz, 0)}deg)`;
      }
    });

    B.pendingResolve.redDice.sort((a, b) => a - b);
    B.pendingResolve.blueDice.sort((a, b) => a - b);
    B.redDice = B.pendingResolve.redDice;
    B.blueDice = B.pendingResolve.blueDice;

    if (changed > 0) {
      log(`<span class="log-ability">Charlie</span> — Flick! <b>${changed}</b> dice changed! → Red [${B.redDice.join(',')}] Blue [${B.blueDice.join(',')}]`);
      narrate(`<b style="color:#f59e0b">Flick!</b> ${changed} dice changed!`);
    } else {
      // MISS! — didn't hit any dice
      log(`<span class="log-ability">Charlie</span> — Flick missed! No contact.`);
      showAbilityCallout('MISS!', '#ef4444', 'Charlie whiffed the Flick!', flickerBody ? flickerBody.team : team);
      narrate(`<b style="color:#ef4444">MISS!</b> Charlie whiffed the Flick!`);
    }

    setTimeout(() => {
      restoreLayout();
      renderDice(B.redDice, B.blueDice);
      renderBattle();
      setTimeout(() => callback(), spd(400));
    }, spd(900));
  };

  // 9. Timeout
  let remaining = getSpecialsTimerSecs() + 3;
  showLsCountdown(center, remaining);
  lsCountdownTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearLsCountdown();
      if (flickRaf) cancelAnimationFrame(flickRaf);
      removeListeners();
      restoreLayout();
      renderDice(B.redDice, B.blueDice);
      log(`<span style="color:var(--text2)">Charlie didn't Flick in time.</span>`);
      B.redDice = B.pendingResolve.redDice;
      B.blueDice = B.pendingResolve.blueDice;
      callback();
    } else if (!launched) {
      showLsCountdown(center, remaining);
    }
  }, 1000);
}

function startLuckyStoneWindow(team, callback) {
  // Blue AI: auto-use lucky stone (reroll lowest die)
  if (AI_ACTIVE && team === 'blue') {
    B.phase = 'luckystone-' + team;
    const dice = team === 'red' ? B.pendingResolve.redDice : B.pendingResolve.blueDice;
    if (dice && B[team].resources.luckyStone > 0) {
      let worstIdx = 0, worstVal = 7;
      dice.forEach((d, i) => { if (d < worstVal) { worstVal = d; worstIdx = i; } });
      if (worstVal <= 4) {
        B[team].resources.luckyStone--;
        B.luckyStoneSpentThisTurn[team]++;
        const newVal = Math.floor(Math.random() * 6) + 1;
        dice[worstIdx] = newVal;
        dice.sort((a, b) => a - b);
        log(`<span class="log-ms">${team.toUpperCase()} uses Lucky Stone!</span> Rerolled ${worstVal} → ${newVal}!`);
        narrate(`<b class="${team}-text">Blue</b> uses <b class="gold">Lucky Stone!</b> ${worstVal} → ${newVal}!`);
        renderDice(B.redDice, B.blueDice);
        renderBattle();
      } else {
        log(`<span style="color:var(--text2)">${team.toUpperCase()} holds Lucky Stone (${worstVal} is good enough).</span>`);
      }
    }
    setTimeout(() => callback(), spd(800));
    return;
  }

  B.phase = 'luckystone-' + team;
  const dice = team === 'red' ? B.pendingResolve.redDice : B.pendingResolve.blueDice;
  const teamLabel = team.charAt(0).toUpperCase() + team.slice(1);
  let _lsSkipped = false;
  const skipLs = () => {
    if (_lsSkipped) return;
    _lsSkipped = true;
    hideSkipBtn();
    clearInterval(lsCountdownTimer);
    clearLsCountdown();
    clearDiceClickable(team);
    const resEl = document.getElementById(team + '-resources');
    const lsEl = resEl && resEl.querySelector('.res-tile.luckyStone');
    if (lsEl) { lsEl.classList.remove('rerollable'); lsEl.onclick = null; lsEl.style.cursor = ''; }
    log(`<span style="color:var(--text2)">${team.toUpperCase()} skipped Lucky Stone.</span>`);
    callback();
  };
  showSkipBtn(skipLs);

  narrate(`<b class="${team}-text">${teamLabel}</b> has a <b class="gold">Lucky Stone!</b>&nbsp;Click it to use!`);

  // Highlight the Lucky Stone resource tile — player clicks IT first
  const resEl = document.getElementById(team + '-resources');
  const lsEl = resEl.querySelector('.res-tile.luckyStone');
  const diceEl = document.getElementById(team + '-dice');
  const countdownTarget = lsEl || diceEl;

  if (lsEl) {
    lsEl.classList.add('rerollable');
    lsEl.style.cursor = 'pointer';
    lsEl.onclick = () => {
      // Player clicked Lucky Stone — stop the old tile countdown, start a fresh one for die picking
      clearInterval(lsCountdownTimer);
      clearLsCountdown(); // remove countdown display from the tile
      lsEl.classList.remove('rerollable');
      lsEl.onclick = null;
      narrate(`<b class="${team}-text">${teamLabel}</b> — pick a die to reroll!`);
      const dieDivs = diceEl.querySelectorAll('.die');
      dieDivs.forEach((d, i) => {
        d.classList.add('rerollable');
        d.onclick = () => doLuckyReroll(team, i, dice, callback);
      });
      sync3dDiceClickable(team);
      // Fresh 3s countdown on the dice row — mirrors Moonstone's pick-die phase
      let pickRemaining = Math.max(3, getSpecialsTimerSecs() - 2);
      showLsCountdown(diceEl, pickRemaining);
      lsCountdownTimer = setInterval(() => {
        pickRemaining--;
        if (pickRemaining <= 0) {
          clearLsCountdown();
          clearDiceClickable(team);
          log(`<span style="color:var(--text2)">${team.toUpperCase()} didn't pick a die in time.</span>`);
          callback();
        } else {
          showLsCountdown(diceEl, pickRemaining);
        }
      }, 1000);
    };
  } else {
    // No resource tile visible — fall back to direct dice click
    const dieDivs = diceEl.querySelectorAll('.die');
    dieDivs.forEach((d, i) => {
      d.classList.add('rerollable');
      d.onclick = () => doLuckyReroll(team, i, dice, callback);
    });
    sync3dDiceClickable(team);
  }

  // Start countdown — auto-skip if not used
  let remaining = getSpecialsTimerSecs();
  showLsCountdown(countdownTarget, remaining);

  lsCountdownTimer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearLsCountdown();
      clearDiceClickable(team);
      if (lsEl) { lsEl.classList.remove('rerollable'); lsEl.onclick = null; }
      log(`<span style="color:var(--text2)">${team.toUpperCase()} didn't use their Lucky Stone.</span>`);
      callback();
    } else {
      showLsCountdown(countdownTarget, remaining);
    }
  }, 1000);
}

function showLsCountdown(parentEl, num) {
  let cd = parentEl.querySelector('.reroll-countdown');
  if (!cd) {
    cd = document.createElement('div');
    cd.className = 'reroll-countdown';
    parentEl.style.position = 'relative';
    parentEl.appendChild(cd);
  }
  cd.textContent = num;
  cd.style.animation = 'none';
  requestAnimationFrame(() => { cd.style.animation = ''; });
}

function clearLsCountdown() {
  if (lsCountdownTimer) { clearInterval(lsCountdownTimer); lsCountdownTimer = null; }
  document.querySelectorAll('.reroll-countdown').forEach(el => el.remove());
}

function clearDiceClickable(team) {
  const diceEl = document.getElementById(team + '-dice');
  diceEl.querySelectorAll('.die').forEach(d => {
    d.classList.remove('rerollable');
    d.onclick = null;
  });
  // Also clear 3D dice rerollable state
  const physics = _dicePhysics[team];
  if (physics && physics.settled) {
    physics.dice.forEach(d => {
      d.el.classList.remove('rerollable-3d');
      d.el.onclick = null;
      d.el.style.cursor = '';
    });
  }
}

// ── BattleAbilities export ────────────────────────────────────────
window.BattleAbilities = {
  triggerEntry, doPreRollSetup, doPostRollAndResolve,
  rollReady, doTeamRoll, startNextRound,
  computeDuelPriority, enterDuelPhase, isPreRollActive,
  checkKnightEffects, checkHandLimits,
  cycleCommit, refundCommitted, spendHealingSeed,
  afterEntryWithJenkins, setBlackout,
  showMoonstoneChoice, checkLuckyStones,
  applyMoonstoneSickness, showFlickPicker
};
