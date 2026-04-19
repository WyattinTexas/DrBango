// ═══════════════════════════════════════════════════════════════
// BATTLE UI + CARD RENDERING + PARTY MANAGEMENT
// Visually stunning, immersive battle experience
// Every fight should feel like an EVENT
// ═══════════════════════════════════════════════════════════════

const RARITY_COLORS = {
  common: '#8b95a5',
  uncommon: '#2ecc71',
  rare: '#3498db',
  'ghost-rare': '#9b59b6',
  'ghost rare': '#9b59b6',
  legendary: '#f39c12'
};

const RARITY_GLOWS = {
  common: 'rgba(139,149,165,.15)',
  uncommon: 'rgba(46,204,113,.25)',
  rare: 'rgba(52,152,219,.3)',
  'ghost-rare': 'rgba(155,89,182,.35)',
  'ghost rare': 'rgba(155,89,182,.35)',
  legendary: 'rgba(243,156,18,.4)'
};

const RARITY_LABELS = {
  common: 'COMMON',
  uncommon: 'UNCOMMON',
  rare: 'RARE',
  'ghost-rare': 'GHOST RARE',
  'ghost rare': 'GHOST RARE',
  legendary: 'LEGENDARY'
};

function artPath(id) {
  return typeof ART_MAP !== 'undefined' && ART_MAP[id] ? '../testroom/' + ART_MAP[id] : '';
}

function hpClass(hp, maxHp) {
  const pct = hp / maxHp;
  if (pct > 0.6) return 'healthy';
  if (pct > 0.3) return 'warning';
  return 'critical';
}

function hpColor(hp, maxHp) {
  const pct = hp / maxHp;
  if (pct > 0.6) return '#2ecc71';
  if (pct > 0.3) return '#f39c12';
  return '#e94560';
}

function rarityColor(rarity) {
  return RARITY_COLORS[rarity] || RARITY_COLORS.common;
}

function rarityGlow(rarity) {
  return RARITY_GLOWS[rarity] || RARITY_GLOWS.common;
}

// ═══════════════════════════════════════════
// RESOURCE ICONS
// ═══════════════════════════════════════════

function renderResources(resources) {
  const icons = {
    luckyStone: '🍀', moonstone: '🌙', healingSeed: '🌱',
    surge: '⚡', iceShard: '❄️', sacredFire: '🔥', firefly: '✨'
  };
  let html = '';
  for (const [key, icon] of Object.entries(icons)) {
    if (resources[key] > 0) {
      html += `<span class="res-badge" style="
        background:rgba(255,255,255,.06);
        border:1px solid rgba(240,216,96,.15);
        padding:3px 8px;
        border-radius:6px;
        font:9px 'Press Start 2P',monospace;
        color:#f0d860;
        display:inline-flex;
        align-items:center;
        gap:3px;
      ">${icon}<span style="font-size:10px">${resources[key]}</span></span>`;
    }
  }
  return html;
}

// ═══════════════════════════════════════════
// CARD RENDERING — Three sizes, all polished
// ═══════════════════════════════════════════

function renderCard(ghost, options = {}) {
  const card = ENGINE.getCard(ghost.id) || ghost;
  const art = artPath(ghost.id);
  const rc = rarityColor(card.rarity);
  const rg = rarityGlow(card.rarity);
  const isActive = options.active;
  const isKo = ghost.ko;
  const showHp = options.showHp !== false;
  const size = options.size || 'normal';
  const clickable = options.onClick;
  const team = options.team || '';

  // ── MINI (Sideline) ──
  if (size === 'mini') {
    const hpc = hpColor(ghost.hp, ghost.maxHp);
    const hpPct = Math.max(0, ghost.hp / ghost.maxHp * 100);
    return `<div class="card-mini ${isKo ? 'ko' : ''}" style="
      display:flex;gap:10px;align-items:center;
      padding:8px 12px;
      border-radius:10px;
      border:1px solid ${isKo ? 'rgba(255,255,255,.06)' : `${rc}33`};
      background:${isKo ? 'rgba(255,255,255,.02)' : 'rgba(255,255,255,.04)'};
      transition:all .2s;
      cursor:${clickable ? 'pointer' : 'default'};
      min-width:180px;
      position:relative;
      overflow:hidden;
    " ${clickable ? `onclick="${clickable}"` : ''}
       onmouseover="this.style.borderColor='${rc}66';this.style.background='rgba(255,255,255,.07)'"
       onmouseout="this.style.borderColor='${rc}33';this.style.background='rgba(255,255,255,.04)'">
      ${art
        ? `<img src="${art}" style="
            width:40px;height:40px;border-radius:8px;object-fit:cover;flex-shrink:0;
            border:2px solid ${rc}55;
            box-shadow:0 0 8px ${rg};
          " onerror="this.style.display='none'">`
        : `<div style="
            width:40px;height:40px;border-radius:8px;flex-shrink:0;
            background:rgba(255,255,255,.06);
            display:flex;align-items:center;justify-content:center;
            font:900 18px 'Cinzel',serif;color:rgba(255,255,255,.2);
            border:2px solid ${rc}33;
          ">${ghost.name[0]}</div>`
      }
      <div style="flex:1;min-width:0">
        <div style="font:700 12px 'Cinzel',serif;color:#f0e8d8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px">${ghost.name}</div>
        <div style="font:10px 'Crimson Text',serif;color:#f0d860;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px">${ghost.ability || ''}</div>
        <div style="display:flex;align-items:center;gap:6px">
          <div style="flex:1;height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden">
            <div style="width:${hpPct}%;height:100%;background:${hpc};border-radius:3px;transition:width .4s"></div>
          </div>
          <div style="font:8px 'Press Start 2P',monospace;color:${hpc};white-space:nowrap">${ghost.hp}/${ghost.maxHp}</div>
        </div>
      </div>
    </div>`;
  }

  // ── LARGE (Party/Recruit/Starter screens) ──
  if (size === 'large') {
    const hpPct = Math.max(0, ghost.hp / ghost.maxHp * 100);
    const hpc = hpColor(ghost.hp, ghost.maxHp);
    const abilityDesc = ghost.abilityDesc || card.desc || '';
    const levelBadge = ghost.level && ghost.level > 1
      ? `<div style="
          position:absolute;top:8px;right:8px;z-index:3;
          width:28px;height:28px;border-radius:50%;
          background:linear-gradient(135deg,#f0d860,#d4a040);
          display:flex;align-items:center;justify-content:center;
          font:900 14px 'Press Start 2P',monospace;color:#1a0a00;
          box-shadow:0 2px 8px rgba(212,160,64,.4);
          border:2px solid rgba(255,255,255,.3);
        ">Lv${ghost.level}</div>`
      : '';

    return `<div class="card-large ${isKo ? 'ko' : ''} ${isActive ? 'active-card' : ''}" style="
      width:220px;
      border:2px solid ${isActive ? '#2ecc71' : `${rc}66`};
      border-radius:14px;
      overflow:hidden;
      background:linear-gradient(180deg,rgba(20,12,6,.95),rgba(12,6,2,.98));
      cursor:${clickable ? 'pointer' : 'default'};
      transition:all .25s;
      position:relative;
      flex-shrink:0;
      box-shadow:0 4px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.05);
    " ${clickable ? `onclick="${clickable}"` : ''}
       onmouseover="this.style.transform='scale(1.04) translateY(-4px)';this.style.boxShadow='0 8px 30px rgba(0,0,0,.5), 0 0 20px ${rg}'"
       onmouseout="this.style.transform='';this.style.boxShadow='0 4px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.05)'">
      <!-- Rarity bar -->
      <div style="height:4px;width:100%;background:linear-gradient(90deg,transparent,${rc},transparent)"></div>

      ${options.slotNum ? `<div style="
        position:absolute;top:10px;left:10px;z-index:3;
        font:900 20px 'Cinzel',serif;color:#d4a040;
        text-shadow:0 2px 8px rgba(0,0,0,.8);
      ">${options.slotNum}</div>` : ''}

      ${levelBadge}

      <!-- Portrait -->
      ${art
        ? `<div style="position:relative;overflow:hidden">
            <img class="card-art" src="${art}" style="
              width:100%;aspect-ratio:1;object-fit:cover;display:block;
              background:rgba(255,255,255,.03);
            " onerror="this.src=''">
            <div style="position:absolute;bottom:0;left:0;right:0;height:40%;
              background:linear-gradient(transparent,rgba(12,6,2,.95));pointer-events:none"></div>
           </div>`
        : `<div style="width:100%;aspect-ratio:1;background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));
            display:flex;align-items:center;justify-content:center;
            font:900 48px 'Cinzel',serif;color:rgba(255,255,255,.08)">
            ${ghost.name[0]}
           </div>`
      }

      <!-- Card info -->
      <div style="padding:12px 14px 14px">
        <div style="font:800 18px/1.2 'Cinzel',serif;color:#f0e8d8;margin-bottom:4px">${ghost.name}</div>

        ${showHp ? `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="color:#ef4444;font-size:14px">&#9829;</span>
          <div style="flex:1;height:10px;background:rgba(255,255,255,.08);border-radius:5px;overflow:hidden;position:relative">
            <div style="width:${hpPct}%;height:100%;background:linear-gradient(90deg,${hpc},${hpc}cc);border-radius:5px;transition:width .5s"></div>
          </div>
          <span style="font:700 11px 'Press Start 2P',monospace;color:${hpc}">${ghost.hp}/${ghost.maxHp}</span>
        </div>` : ''}

        <div style="font:700 10px 'Press Start 2P',monospace;color:${rc};letter-spacing:1px;margin-bottom:6px">
          ${RARITY_LABELS[card.rarity] || 'COMMON'}
        </div>

        <div style="font:700 13px 'Cinzel',serif;color:#f0d860;margin-bottom:4px">${ghost.ability || ''}</div>
        <div style="font:13px/1.5 'Crimson Text',serif;color:rgba(255,255,255,.6);font-style:italic">${abilityDesc}</div>
      </div>
    </div>`;
  }

  // ── NORMAL (Battle display — wide panel) ──
  const hpPct = Math.max(0, ghost.hp / ghost.maxHp * 100);
  const hpc = hpColor(ghost.hp, ghost.maxHp);
  const abilityDesc = ghost.abilityDesc || card.desc || '';
  const teamBorder = team === 'enemy' ? 'rgba(233,69,96,.35)' : 'rgba(46,204,113,.35)';
  const teamGlow = team === 'enemy' ? 'rgba(233,69,96,.08)' : 'rgba(46,204,113,.08)';
  const levelBadge = ghost.level && ghost.level > 1
    ? `<div style="
        position:absolute;top:-6px;left:-6px;z-index:3;
        width:26px;height:26px;border-radius:50%;
        background:linear-gradient(135deg,#f0d860,#d4a040);
        display:flex;align-items:center;justify-content:center;
        font:900 11px 'Press Start 2P',monospace;color:#1a0a00;
        box-shadow:0 2px 6px rgba(212,160,64,.4);
        border:2px solid rgba(255,255,255,.2);
      ">${ghost.level}</div>`
    : '';

  return `<div class="card-normal ${isKo ? 'ko' : ''}" style="
    display:flex;gap:16px;align-items:flex-start;
    padding:16px 18px;
    background:linear-gradient(135deg,rgba(255,255,255,.03),rgba(255,255,255,.01));
    border:1px solid ${teamBorder};
    border-radius:14px;
    position:relative;
    box-shadow:inset 0 0 30px ${teamGlow}, 0 2px 12px rgba(0,0,0,.3);
  ">
    <!-- Portrait with rarity border -->
    <div style="position:relative;flex-shrink:0">
      ${levelBadge}
      ${art
        ? `<img class="card-portrait" src="${art}" style="
            width:96px;height:96px;border-radius:12px;object-fit:cover;
            border:3px solid ${rc};
            box-shadow:0 0 16px ${rg}, 0 4px 12px rgba(0,0,0,.4);
            background:rgba(255,255,255,.03);
          " onerror="this.style.display='none'">`
        : `<div style="
            width:96px;height:96px;border-radius:12px;
            background:linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.02));
            display:flex;align-items:center;justify-content:center;
            font:900 38px 'Cinzel',serif;color:rgba(255,255,255,.12);
            border:3px solid ${rc}55;
          ">${ghost.name[0]}</div>`
      }
    </div>

    <!-- Info panel -->
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
        <div style="font:800 20px/1.2 'Cinzel',serif;color:#f0e8d8">${ghost.name}</div>
        <div style="font:700 8px 'Press Start 2P',monospace;color:${rc};letter-spacing:1px">${RARITY_LABELS[card.rarity] || ''}</div>
      </div>

      <div style="font:700 14px 'Cinzel',serif;color:#f0d860;margin-bottom:4px">${ghost.ability || ''}</div>
      <div style="font:14px/1.5 'Crimson Text',serif;color:rgba(240,232,216,.55);margin-bottom:10px">${abilityDesc}</div>

      ${showHp ? `
      <div class="hp-bar-outer" style="
        width:100%;height:18px;
        background:rgba(255,255,255,.06);
        border-radius:9px;overflow:hidden;position:relative;
        border:1px solid rgba(255,255,255,.06);
      ">
        <div class="hp-bar-inner ${hpClass(ghost.hp, ghost.maxHp)}" style="
          width:${hpPct}%;height:100%;border-radius:9px;
          transition:width .6s ease-out;
          box-shadow:0 0 8px ${hpc}44;
        "></div>
        <div class="hp-bar-text" style="
          position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
          font:700 10px 'Press Start 2P',monospace;color:#fff;
          text-shadow:0 1px 4px rgba(0,0,0,.8);
          letter-spacing:1px;
        ">${ghost.hp} / ${ghost.maxHp} HP</div>
      </div>` : ''}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════
// BATTLE SCREEN — Immersive full-screen
// ═══════════════════════════════════════════

function renderBattleScreen(bs) {
  const pGhost = ENGINE.activeGhost(bs.playerTeam);
  const eGhost = ENGINE.activeGhost(bs.enemyTeam);
  const pSideline = ENGINE.sidelineGhosts(bs.playerTeam);
  const eSideline = ENGINE.sidelineGhosts(bs.enemyTeam);

  // Inject atmospheric background based on boss status
  const battleScreen = document.getElementById('battle-screen');
  if (bs.isBoss) {
    battleScreen.style.background = `
      radial-gradient(ellipse at 50% 20%, rgba(233,69,96,.08) 0%, transparent 60%),
      radial-gradient(ellipse at 50% 80%, rgba(46,204,113,.06) 0%, transparent 60%),
      linear-gradient(180deg, rgba(4,1,0,.99), rgba(18,6,2,.98) 50%, rgba(4,1,0,.99))
    `;
  } else {
    battleScreen.style.background = `
      radial-gradient(ellipse at 50% 15%, rgba(233,69,96,.04) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 85%, rgba(46,204,113,.04) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(30,20,10,.3) 0%, transparent 80%),
      linear-gradient(180deg, rgba(6,3,1,.98), rgba(15,8,4,.98))
    `;
  }

  // Round indicator
  const roundBadge = bs.round
    ? `<div style="
        font:700 9px 'Press Start 2P',monospace;
        color:rgba(240,232,216,.25);
        letter-spacing:2px;
        text-align:center;
        margin-bottom:2px;
      ">ROUND ${bs.round}</div>`
    : '';

  // ── ENEMY SIDE ──
  document.getElementById('b-enemy').innerHTML = `
    <div class="battle-side enemy-side" style="
      background:linear-gradient(180deg,rgba(233,69,96,.04),rgba(255,255,255,.02));
      border:1px solid rgba(233,69,96,.2);
      border-radius:16px;
      padding:16px 20px;
      position:relative;
      box-shadow:inset 0 0 40px rgba(233,69,96,.03);
    ">
      <div class="side-label" style="
        font:700 10px 'Press Start 2P',monospace;
        letter-spacing:3px;
        color:#e94560;
        margin-bottom:10px;
        display:flex;align-items:center;gap:8px;
      ">
        <span style="display:inline-block;width:20px;height:2px;background:#e94560;opacity:.4"></span>
        ${bs.isBoss ? '💀 BOSS' : 'ENEMY'}
        <span style="display:inline-block;width:20px;height:2px;background:#e94560;opacity:.4"></span>
      </div>
      ${renderCard(eGhost, { size: 'normal', active: true, team: 'enemy' })}
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">${renderResources(bs.enemyTeam.resources)}</div>
      ${eSideline.length ? `
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          ${eSideline.map(g => renderCard(g, { size: 'mini', team: 'enemy' })).join('')}
        </div>` : ''}
    </div>
  `;

  // ── PLAYER SIDE ──
  document.getElementById('b-player').innerHTML = `
    <div class="battle-side player-side" style="
      background:linear-gradient(0deg,rgba(46,204,113,.04),rgba(255,255,255,.02));
      border:1px solid rgba(46,204,113,.2);
      border-radius:16px;
      padding:16px 20px;
      position:relative;
      box-shadow:inset 0 0 40px rgba(46,204,113,.03);
    ">
      <div class="side-label" style="
        font:700 10px 'Press Start 2P',monospace;
        letter-spacing:3px;
        color:#2ecc71;
        margin-bottom:10px;
        display:flex;align-items:center;gap:8px;
      ">
        <span style="display:inline-block;width:20px;height:2px;background:#2ecc71;opacity:.4"></span>
        ${summonerData && summonerData.name ? summonerData.name.toUpperCase() : 'YOUR TEAM'}
        <span style="display:inline-block;width:20px;height:2px;background:#2ecc71;opacity:.4"></span>
      </div>
      ${renderCard(pGhost, { size: 'normal', active: true, team: 'player' })}
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">${renderResources(bs.playerTeam.resources)}</div>
      ${pSideline.length ? `
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
          ${pSideline.map(g => renderCard(g, { size: 'mini', team: 'player' })).join('')}
        </div>` : ''}
    </div>
  `;
}

// ═══════════════════════════════════════════
// PARTY MANAGEMENT SCREEN
// ═══════════════════════════════════════════

function showPartyScreen() {
  if (!G) return;
  const ghosts = G.party.ghosts;

  let html = `<div style="text-align:center;margin-bottom:20px">
    <div style="font:900 24px 'Cinzel',serif;letter-spacing:4px;color:#f0e8d8;margin-bottom:6px">YOUR PARTY</div>
    <div style="font:13px 'Crimson Text',serif;color:rgba(255,255,255,.45);font-style:italic">
      Tap a card to select it, then tap another to swap positions. Slot 1 is your active fighter.
    </div>
  </div>
  <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">`;

  ghosts.forEach((ghost, i) => {
    const label = i === 0 ? 'ACTIVE' : `SLOT ${i + 1}`;
    html += `<div style="position:relative">
      <div style="
        text-align:center;margin-bottom:6px;
        font:700 8px 'Press Start 2P',monospace;
        color:${i === 0 ? '#2ecc71' : 'rgba(255,255,255,.3)'};
        letter-spacing:2px;
      ">${label}</div>
      ${renderCard(ghost, {
        size: 'large',
        active: i === 0,
        showHp: true,
        slotNum: i + 1,
        onClick: `swapPartyPosition(${i})`
      })}
    </div>`;
  });

  html += `</div>
  <div style="text-align:center;margin-top:20px">
    <button onclick="hidePartyScreen()" style="
      background:rgba(46,204,113,.12);
      border:2px solid #2ecc71;
      border-radius:10px;
      color:#2ecc71;
      font:700 15px 'Cinzel',serif;
      padding:12px 40px;
      cursor:pointer;
      letter-spacing:3px;
      transition:all .15s;
    " onmouseover="this.style.background='rgba(46,204,113,.25)'"
       onmouseout="this.style.background='rgba(46,204,113,.12)'">DONE</button>
  </div>`;

  showModal('Party Management', html, []);
  const modal = document.getElementById('modal');
  modal.style.maxWidth = '900px';
  modal.style.width = '95%';
}

let _swapFrom = -1;
window.swapPartyPosition = function(idx) {
  if (_swapFrom === -1) {
    _swapFrom = idx;
    document.querySelectorAll('.card-large').forEach((el, i) => {
      if (i === idx) {
        el.classList.add('swap-selected');
        el.style.borderColor = '#f0d860';
        el.style.boxShadow = '0 0 20px rgba(240,216,96,.4)';
      }
    });
  } else {
    const ghosts = G.party.ghosts;
    [ghosts[_swapFrom], ghosts[idx]] = [ghosts[idx], ghosts[_swapFrom]];
    G.party.activeIdx = 0;
    _swapFrom = -1;
    showPartyScreen();
    updateHUD();
  }
};

function hidePartyScreen() {
  hideModal();
  const modal = document.getElementById('modal');
  modal.style.maxWidth = '500px';
  modal.style.width = '90%';
  _swapFrom = -1;
}

// ═══════════════════════════════════════════
// ENCOUNTER PREVIEW — "A wild Spiritkin appeared!"
// ═══════════════════════════════════════════

function showEncounterPreview(card, onFight, onFlee) {
  const ghost = ENGINE.makeGhost(card.id);
  const rc = rarityColor(card.rarity);
  const rg = rarityGlow(card.rarity);
  const art = artPath(card.id);

  // Power comparison
  let powerLabel = '';
  let powerColor = '#f0d860';
  if (typeof G !== 'undefined' && G && G.party) {
    const playerGhost = ENGINE.activeGhost(G.party);
    if (playerGhost) {
      const pHp = playerGhost.hp;
      const eHp = ghost.hp;
      if (eHp > pHp + 2) { powerLabel = '⚠️ DANGEROUS'; powerColor = '#e94560'; }
      else if (eHp < pHp - 2) { powerLabel = 'Easy prey'; powerColor = '#2ecc71'; }
      else { powerLabel = 'Evenly matched'; powerColor = '#f0d860'; }
    }
  }

  const abilityDesc = card.desc || ghost.abilityDesc || '';

  const modalBody = `
    <div style="text-align:center;animation:encounterSlideIn .4s ease-out">
      <style>
        @keyframes encounterSlideIn {
          0% { transform:translateY(-30px) scale(.9); opacity:0 }
          100% { transform:translateY(0) scale(1); opacity:1 }
        }
        @keyframes encounterPulse {
          0%, 100% { box-shadow: 0 0 20px ${rg}, 0 4px 20px rgba(0,0,0,.5) }
          50% { box-shadow: 0 0 35px ${rg}, 0 4px 30px rgba(0,0,0,.5) }
        }
      </style>

      <div style="
        font:700 10px 'Press Start 2P',monospace;
        color:${rc};letter-spacing:2px;
        margin-bottom:12px;
        opacity:.8;
      ">WILD ENCOUNTER</div>

      <div style="display:inline-block;animation:encounterPulse 2s ease-in-out infinite">
        ${renderCard(ghost, { size: 'large', showHp: true })}
      </div>

      <div style="
        margin-top:14px;
        font:700 11px 'Press Start 2P',monospace;
        color:${rc};letter-spacing:1px;
      ">${RARITY_LABELS[card.rarity] || 'COMMON'}</div>

      ${powerLabel ? `<div style="
        margin-top:10px;
        font:700 10px 'Press Start 2P',monospace;
        color:${powerColor};letter-spacing:1px;
      ">${powerLabel}</div>` : ''}

      ${card.ability ? `<div style="
        margin-top:8px;
        font:700 13px 'Cinzel',serif;
        color:#f0d860;
      ">${card.ability}</div>` : ''}
      ${abilityDesc ? `<div style="
        margin-top:4px;
        font:12px/1.4 'Crimson Text',serif;
        color:rgba(255,255,255,.55);
        font-style:italic;
        max-width:280px;
        margin-left:auto;margin-right:auto;
      ">${abilityDesc}</div>` : ''}
    </div>
  `;

  showModal('', modalBody, [
    {
      text: '⚔ FIGHT',
      primary: true,
      action: onFight
    },
    {
      text: 'Flee',
      action: onFlee
    }
  ]);

  const modal = document.getElementById('modal');
  modal.style.maxWidth = '340px';

  // Style the fight button with green glow
  setTimeout(() => {
    const btns = document.querySelectorAll('#modal-actions button');
    if (btns[0]) {
      btns[0].style.background = 'rgba(46,204,113,.15)';
      btns[0].style.borderColor = '#2ecc71';
      btns[0].style.color = '#2ecc71';
      btns[0].style.padding = '12px 32px';
      btns[0].style.fontSize = '15px';
      btns[0].style.letterSpacing = '2px';
    }
    if (btns[1]) {
      btns[1].style.opacity = '.6';
      btns[1].style.fontSize = '12px';
    }
  }, 0);
}

// ═══════════════════════════════════════════
// RECRUIT SCREEN — New Spiritkin wants to join
// ═══════════════════════════════════════════

function showRecruitScreen(newCard, onDone) {
  const newGhost = ENGINE.makeGhost(newCard.id);
  const rc = rarityColor(newCard.rarity);

  let html = `
    <div style="text-align:center;margin-bottom:20px">
      <div style="
        font:700 10px 'Press Start 2P',monospace;
        color:#2ecc71;letter-spacing:2px;
        margin-bottom:8px;
      ">NEW ALLY</div>

      <div style="
        font:700 18px 'Cinzel',serif;
        color:#f0e8d8;margin-bottom:14px;
      ">${newCard.name} wants to join your party!</div>

      <div style="display:inline-block">
        ${renderCard(newGhost, { size: 'large', showHp: true })}
      </div>
    </div>`;

  if (G.party.ghosts.length >= 5) {
    html += `
      <div style="
        text-align:center;margin-bottom:14px;
        font:700 12px 'Cinzel',serif;
        color:#f0d860;
        padding:8px 16px;
        background:rgba(240,216,96,.06);
        border:1px solid rgba(240,216,96,.15);
        border-radius:8px;
      ">Party is full! Choose who to replace:</div>

      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">`;

    G.party.ghosts.forEach((ghost, i) => {
      html += `<div style="
        position:relative;cursor:pointer;transition:all .2s;
      " onclick="doRecruit(${newCard.id}, ${i})"
         onmouseover="this.style.transform='scale(1.06)'"
         onmouseout="this.style.transform=''">
        ${renderCard(ghost, { size: 'mini' })}
        <div style="
          position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);
          font:700 8px 'Press Start 2P',monospace;
          color:#e94560;background:rgba(0,0,0,.85);
          padding:3px 8px;border-radius:4px;
          white-space:nowrap;
          border:1px solid rgba(233,69,96,.3);
        ">REPLACE</div>
      </div>`;
    });
    html += `</div>`;
  }

  const actions = [];
  if (G.party.ghosts.length < 5) {
    actions.push({
      text: '✨ RECRUIT',
      primary: true,
      action: () => {
        G.party.ghosts.push(ENGINE.makeGhost(newCard.id));
        hideModal();
        updateHUD();
        onDone();
      }
    });
  }
  actions.push({
    text: 'Pass',
    action: () => { hideModal(); onDone(); }
  });

  showModal('Recruit', html, actions);

  const modal = document.getElementById('modal');
  modal.style.maxWidth = '640px';
  modal.style.width = '95%';

  // Style recruit button
  setTimeout(() => {
    const btns = document.querySelectorAll('#modal-actions button');
    if (btns[0] && G.party.ghosts.length < 5) {
      btns[0].style.background = 'rgba(46,204,113,.15)';
      btns[0].style.borderColor = '#2ecc71';
      btns[0].style.color = '#2ecc71';
      btns[0].style.padding = '12px 32px';
      btns[0].style.fontSize = '15px';
    }
  }, 0);

  window.doRecruit = function(cardId, replaceIdx) {
    G.party.ghosts[replaceIdx] = ENGINE.makeGhost(cardId);
    G.party.activeIdx = 0;
    hideModal();
    modal.style.maxWidth = '500px';
    modal.style.width = '90%';
    updateHUD();
    onDone();
  };
}

// ═══════════════════════════════════════════
// KO SWAP PICKER — Dramatic replacement
// ═══════════════════════════════════════════

function showKoSwapPicker(team, enemyTeam, onSwap) {
  const alive = team.ghosts.filter((g, i) => i !== team.activeIdx && !g.ko);
  if (!alive.length) { onSwap(); return; }

  setBattleActions([]);
  logBattle('<span style="color:#f0d860;font-weight:700">Choose your next fighter!</span>');

  // Remove existing overlay if any
  document.getElementById('ko-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'ko-overlay';
  overlay.style.cssText = `
    position:absolute;inset:0;z-index:10;
    background:rgba(0,0,0,.9);
    display:flex;align-items:center;justify-content:center;
    animation:koFadeIn .3s ease-out;
  `;

  // Add keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes koFadeIn { 0% { opacity:0 } 100% { opacity:1 } }
    @keyframes koPulse { 0%,100% { text-shadow: 0 0 20px rgba(233,69,96,.4) } 50% { text-shadow: 0 0 40px rgba(233,69,96,.6) } }
  `;
  overlay.appendChild(style);

  let cardsHtml = '';
  alive.forEach(g => {
    const idx = team.ghosts.indexOf(g);
    cardsHtml += `<div style="
      cursor:pointer;transition:all .2s;
    " onclick="doKoSwap(${idx})"
       onmouseover="this.style.transform='scale(1.05)';this.style.filter='brightness(1.1)'"
       onmouseout="this.style.transform='';this.style.filter=''">
      ${renderCard(g, { size: 'large', showHp: true })}
    </div>`;
  });

  overlay.innerHTML += `
    <div style="text-align:center;max-width:700px;padding:20px">
      <div style="
        font:900 12px 'Press Start 2P',monospace;
        color:#e94560;letter-spacing:3px;
        margin-bottom:6px;
        animation:koPulse 1.5s ease-in-out infinite;
      ">GHOST DOWN</div>
      <div style="
        font:900 24px 'Cinzel',serif;
        color:#f0e8d8;letter-spacing:2px;
        margin-bottom:20px;
      ">Choose Your Next Fighter</div>
      <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
        ${cardsHtml}
      </div>
    </div>
  `;

  document.getElementById('battle-screen').appendChild(overlay);

  window.doKoSwap = function(idx) {
    team.activeIdx = idx;
    const entry = { events: [] };
    ENGINE.triggerEntryAbility(team, enemyTeam, entry);
    entry.events.forEach(e => logBattle(e));
    document.getElementById('ko-overlay')?.remove();
    onSwap();
  };
}

// ═══════════════════════════════════════════
// STARTER SCREEN — Choose your first Spiritkin
// ═══════════════════════════════════════════

function renderStarterScreen() {
  const starters = [
    ENGINE.getCard(28),  // Dream Cat
    ENGINE.getCard(16),  // Chip
    ENGINE.getCard(20),  // Floop
  ].filter(Boolean);

  const el = document.getElementById('starter-choices');
  el.innerHTML = '';
  el.style.display = 'flex';
  el.style.gap = '20px';
  el.style.justifyContent = 'center';
  el.style.flexWrap = 'wrap';

  for (const card of starters) {
    const ghost = ENGINE.makeGhost(card.id);
    const rc = rarityColor(card.rarity);
    const rg = rarityGlow(card.rarity);

    const wrap = document.createElement('div');
    wrap.className = 'starter-card-wrap';
    wrap.style.cssText = `
      cursor:pointer;
      transition:all .3s cubic-bezier(.34,1.56,.64,1);
      position:relative;
    `;
    wrap.innerHTML = renderCard(ghost, { size: 'large', showHp: true });
    wrap.onclick = () => startGame(card.id);

    wrap.onmouseover = () => {
      wrap.style.transform = 'translateY(-8px) scale(1.04)';
      wrap.style.filter = 'brightness(1.08)';
    };
    wrap.onmouseout = () => {
      wrap.style.transform = '';
      wrap.style.filter = '';
    };

    el.appendChild(wrap);
  }
}

// ═══════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════

window.renderBattleScreen = renderBattleScreen;
window.renderCard = renderCard;
window.showPartyScreen = showPartyScreen;
window.hidePartyScreen = hidePartyScreen;
window.showEncounterPreview = showEncounterPreview;
window.showRecruitScreen = showRecruitScreen;
window.showKoSwapPicker = showKoSwapPicker;
window.renderStarterScreen = renderStarterScreen;
