// =================================================================
// RAID BATTLE UI — Inline multiplayer raid battle renderer
// Renders the battle screen directly inside #raid-screen on the
// multiplayer page (no testroom redirect). Players take alternating
// turns rolling dice against a shared boss while others spectate.
//
// Depends on:
//   cards.js        — getGhost(), ghost data
//   battle-engine.js — classify(), describeRoll(), typeLabel()
//   raid-engine.js  — doPlayerRoll, commitResource, useHealingSeed,
//                     doKoSwap (action functions called on user input)
//   Firebase         — firebase.auth().currentUser for turn detection
//
// All CSS classes are prefixed with `rib-` (raid inline battle).
// =================================================================

(function () {
  'use strict';

  // ─── STYLE INJECTION ──────────────────────────────────────────
  // Inject scoped styles once on first load.
  const STYLE_ID = 'rib-styles';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `

/* ── Layout ─────────────────────────────────────────────────── */
.rib-container {
  display: flex; flex-direction: column; gap: 10px;
  max-width: 520px; margin: 0 auto; padding: 12px 10px 80px;
  font-family: 'Inter', sans-serif; color: var(--text, #f4ecd8);
  min-height: 100vh; box-sizing: border-box;
}

/* ── Boss HP Pool ───────────────────────────────────────────── */
.rib-boss-pool { width: 100%; }
.rib-boss-pool-label {
  font-family: 'Creepster', cursive; font-size: 0.85rem;
  letter-spacing: 2px; text-align: center;
  color: var(--text2, #a09686); margin-bottom: 4px;
}
.rib-boss-pool-bar {
  position: relative; width: 100%; height: 22px;
  background: #1a1228; border-radius: 4px; overflow: hidden;
  border: 1px solid var(--border, #2a2230);
}
.rib-boss-pool-fill {
  height: 100%; border-radius: 4px; transition: width 0.6s ease, background 0.4s ease;
}
.rib-boss-pool-text {
  position: absolute; inset: 0; display: flex; align-items: center;
  justify-content: center; font-size: 0.75rem; font-weight: 700;
  color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.8);
  letter-spacing: 1px;
}

/* ── Matchup Area ───────────────────────────────────────────── */
.rib-matchup {
  display: flex; align-items: flex-start; justify-content: center;
  gap: 8px; position: relative;
}
.rib-vs {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding-top: 30px;
}
.rib-vs-text {
  font-family: 'Creepster', cursive; font-size: 1.6rem;
  color: var(--gold-bright, #f0c560); text-shadow: 0 0 12px rgba(240,197,96,0.3);
}
.rib-round-label {
  font-size: 0.65rem; color: var(--text-dim, #6a6056);
  letter-spacing: 1px; margin-top: 2px;
}

/* ── Fighter Card ───────────────────────────────────────────── */
.rib-fighter {
  width: 140px; display: flex; flex-direction: column;
  align-items: center; gap: 4px; position: relative;
}
.rib-fighter-art-wrap {
  width: 120px; height: 120px; border-radius: 8px; overflow: hidden;
  border: 2px solid var(--border, #2a2230); position: relative;
  background: var(--surface, #14101c);
}
.rib-fighter-art-wrap.boss { border-color: #8e44ad; }
.rib-fighter-art-wrap.player { border-color: var(--gold-bright, #f0c560); }
.rib-fighter-art {
  width: 100%; height: 100%; object-fit: cover;
  display: block;
}
.rib-ko-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.7); display: flex;
  align-items: center; justify-content: center;
  font-family: 'Creepster', cursive; font-size: 2rem;
  color: #e74c3c; text-shadow: 0 0 10px rgba(231,76,60,0.5);
}
.rib-fighter-name {
  font-family: 'Creepster', cursive; font-size: 0.9rem;
  color: var(--text, #f4ecd8); text-align: center;
  line-height: 1.1; max-width: 130px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rib-fighter-hp-bar {
  width: 110px; height: 10px; background: #1a1228;
  border-radius: 3px; overflow: hidden;
  border: 1px solid var(--border, #2a2230);
  position: relative;
}
.rib-fighter-hp-fill {
  height: 100%; border-radius: 3px;
  transition: width 0.4s ease, background 0.3s ease;
}
.rib-fighter-hp-text {
  font-size: 0.65rem; color: var(--text2, #a09686);
  font-weight: 600;
}

/* ── Dice Display ───────────────────────────────────────────── */
.rib-dice-area {
  display: flex; justify-content: space-between;
  align-items: flex-start; gap: 12px; padding: 0 8px;
}
.rib-dice-side {
  display: flex; flex-direction: column; align-items: center;
  gap: 3px; flex: 1;
}
.rib-dice-row {
  display: flex; gap: 4px; justify-content: center; flex-wrap: wrap;
}
.rib-die {
  width: 30px; height: 30px; border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 0.95rem;
  background: var(--surface2, #1c1828);
  border: 1px solid var(--border, #2a2230);
  color: var(--text, #f4ecd8);
  transition: transform 0.2s ease, background 0.3s ease, border-color 0.3s ease;
}
.rib-die.match-doubles { background: #4a3800; border-color: #f0c560; color: #f0c560; }
.rib-die.match-triples { background: #3a0a0a; border-color: #e74c3c; color: #e74c3c; }
.rib-die.match-quads   { background: #1a0a2a; border-color: #8e44ad; color: #8e44ad; }
.rib-die.match-penta   { background: #2a1a00; border-color: #ff6b6b; color: #ff6b6b; }
.rib-die.tumbling {
  animation: rib-tumble 0.12s infinite alternate;
}
@keyframes rib-tumble {
  0%   { transform: rotateZ(-8deg) scale(0.95); }
  100% { transform: rotateZ(8deg) scale(1.05); }
}
.rib-die.landed {
  animation: rib-land 0.3s ease forwards;
}
@keyframes rib-land {
  0%   { transform: scale(1.3); }
  60%  { transform: scale(0.92); }
  100% { transform: scale(1); }
}
.rib-die.winner-flash {
  animation: rib-flash 0.5s ease 2;
}
@keyframes rib-flash {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: 0 0 12px 3px rgba(240,197,96,0.6); }
}
.rib-roll-label {
  font-size: 0.7rem; color: var(--text-dim, #6a6056);
  letter-spacing: 0.5px; text-align: center;
}
.rib-roll-label.winner { color: var(--gold-bright, #f0c560); font-weight: 700; }

/* ── Resource Bar ───────────────────────────────────────────── */
.rib-resources {
  display: flex; flex-wrap: wrap; gap: 6px;
  justify-content: center; padding: 6px 8px;
  background: var(--surface, #14101c);
  border: 1px solid var(--border, #2a2230);
  border-radius: 8px;
}
.rib-resource {
  display: flex; align-items: center; gap: 3px;
  padding: 4px 8px; border-radius: 5px;
  font-size: 0.75rem; font-weight: 600;
  background: var(--surface2, #1c1828);
  border: 1px solid var(--border, #2a2230);
  cursor: pointer; user-select: none;
  transition: background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}
.rib-resource:hover:not(.disabled) {
  background: var(--surface3, #25202e);
  border-color: var(--gold-bright, #f0c560);
}
.rib-resource.committed {
  background: #2a2000; border-color: var(--gold-bright, #f0c560);
  box-shadow: 0 0 6px rgba(240,197,96,0.2);
}
.rib-resource.disabled {
  opacity: 0.35; cursor: default; pointer-events: none;
}
.rib-resource-icon { font-size: 1rem; }
.rib-resource-count { color: var(--text, #f4ecd8); }

/* ── Action Buttons ─────────────────────────────────────────── */
.rib-actions {
  display: flex; gap: 10px; justify-content: center; padding: 4px 0;
}
.rib-btn-roll {
  padding: 12px 36px; border-radius: 10px; border: 2px solid var(--gold-bright, #f0c560);
  background: linear-gradient(135deg, #3a2a00, #1a1200);
  color: var(--gold-bright, #f0c560); font-family: 'Creepster', cursive;
  font-size: 1.4rem; letter-spacing: 3px; cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
  text-shadow: 0 0 8px rgba(240,197,96,0.3);
}
.rib-btn-roll:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(240,197,96,0.3);
}
.rib-btn-roll:active { transform: scale(0.97); }
.rib-btn-roll:disabled {
  opacity: 0.3; cursor: default; transform: none; box-shadow: none;
}
.rib-btn-heal {
  padding: 10px 20px; border-radius: 8px; border: 1px solid #2ecc71;
  background: linear-gradient(135deg, #0a2a0e, #081a08);
  color: #2ecc71; font-family: 'Inter', sans-serif;
  font-size: 0.85rem; font-weight: 700; cursor: pointer;
  transition: transform 0.15s ease;
}
.rib-btn-heal:hover { transform: scale(1.04); }
.rib-btn-heal:disabled { opacity: 0.3; cursor: default; transform: none; }

/* ── Turn Indicator ─────────────────────────────────────────── */
.rib-turn {
  text-align: center; padding: 6px 0;
}
.rib-turn-active {
  font-family: 'Creepster', cursive; font-size: 1.1rem;
  color: var(--gold-bright, #f0c560); letter-spacing: 2px;
  animation: rib-pulse-glow 2s ease-in-out infinite;
}
@keyframes rib-pulse-glow {
  0%, 100% { text-shadow: 0 0 4px rgba(240,197,96,0.2); }
  50%      { text-shadow: 0 0 14px rgba(240,197,96,0.5); }
}
.rib-turn-waiting {
  font-size: 0.8rem; color: var(--text-dim, #6a6056);
}
.rib-turn-eliminated {
  font-size: 0.8rem; color: #e74c3c; font-style: italic;
}

/* ── Sideline Ghosts ────────────────────────────────────────── */
.rib-sidelines {
  display: flex; flex-direction: column; gap: 4px;
  padding: 6px 8px;
}
.rib-sideline-row {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  font-size: 0.72rem;
}
.rib-sideline-player-label {
  font-weight: 700; color: var(--text2, #a09686); min-width: 24px;
}
.rib-sideline-ghost {
  padding: 2px 6px; border-radius: 3px;
  background: var(--surface2, #1c1828);
  color: var(--text, #f4ecd8);
}
.rib-sideline-ghost.ko {
  text-decoration: line-through; opacity: 0.4;
  color: var(--text-dim, #6a6056);
}

/* ── Battle Log ─────────────────────────────────────────────── */
.rib-log {
  max-height: 160px; overflow-y: auto; padding: 6px 8px;
  background: var(--surface, #14101c); border: 1px solid var(--border, #2a2230);
  border-radius: 6px; font-size: 0.7rem; line-height: 1.5;
  color: var(--text2, #a09686);
  scroll-behavior: smooth;
}
.rib-log-entry { padding: 1px 0; }
.rib-log-entry.damage { color: #e74c3c; }
.rib-log-entry.heal   { color: #2ecc71; }
.rib-log-entry.system { color: var(--text-dim, #6a6056); font-style: italic; }

/* ── KO Swap Picker ─────────────────────────────────────────── */
.rib-ko-picker {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 16px; background: var(--surface, #14101c);
  border: 2px solid var(--accent, #e94560); border-radius: 10px;
}
.rib-ko-title {
  font-family: 'Creepster', cursive; font-size: 1.1rem;
  color: var(--accent, #e94560); letter-spacing: 2px;
}
.rib-ko-ghosts {
  display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
}
.rib-ko-card {
  width: 90px; display: flex; flex-direction: column;
  align-items: center; gap: 4px; padding: 8px;
  background: var(--surface2, #1c1828); border-radius: 8px;
  border: 2px solid var(--border, #2a2230);
  cursor: pointer; transition: border-color 0.2s ease, transform 0.15s ease;
}
.rib-ko-card:hover {
  border-color: var(--gold-bright, #f0c560); transform: scale(1.06);
}
.rib-ko-card img {
  width: 64px; height: 64px; border-radius: 6px; object-fit: cover;
}
.rib-ko-card-name {
  font-size: 0.72rem; color: var(--text, #f4ecd8);
  text-align: center; font-weight: 600;
}
.rib-ko-card-hp {
  font-size: 0.62rem; color: var(--text2, #a09686);
}

/* ── Game Over ──────────────────────────────────────────────── */
.rib-gameover {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 24px 16px; text-align: center;
}
.rib-gameover-title {
  font-family: 'Creepster', cursive; font-size: 2rem;
  letter-spacing: 4px;
}
.rib-gameover-title.victory { color: var(--gold-bright, #f0c560); }
.rib-gameover-title.defeat  { color: #e74c3c; }
.rib-gameover-subtitle {
  font-size: 0.9rem; color: var(--text2, #a09686);
}
.rib-damage-summary {
  display: flex; flex-direction: column; gap: 4px; width: 100%;
  max-width: 320px;
}
.rib-damage-row {
  display: flex; justify-content: space-between;
  padding: 4px 8px; border-radius: 4px;
  background: var(--surface2, #1c1828); font-size: 0.78rem;
}
.rib-damage-row.me { border-left: 3px solid var(--gold-bright, #f0c560); }
.rib-damage-name { color: var(--text, #f4ecd8); }
.rib-damage-val  { color: var(--text2, #a09686); font-weight: 700; }
.rib-btn-lobby {
  padding: 12px 28px; border-radius: 8px; border: 2px solid var(--gold-bright, #f0c560);
  background: transparent; color: var(--gold-bright, #f0c560);
  font-family: 'Creepster', cursive; font-size: 1.1rem;
  letter-spacing: 2px; cursor: pointer; margin-top: 8px;
  transition: background 0.2s ease;
}
.rib-btn-lobby:hover { background: rgba(240,197,96,0.1); }

/* ── Damage Callout ─────────────────────────────────────────── */
.rib-callout {
  position: absolute; pointer-events: none;
  font-family: 'Creepster', cursive; font-size: 2rem;
  animation: rib-callout-pop 0.8s ease forwards;
  z-index: 10;
}
.rib-callout.damage { color: #e74c3c; }
.rib-callout.heal   { color: #2ecc71; }
@keyframes rib-callout-pop {
  0%   { opacity: 1; transform: translateY(0) scale(0.6); }
  30%  { opacity: 1; transform: translateY(-10px) scale(1.2); }
  100% { opacity: 0; transform: translateY(-40px) scale(0.8); }
}

/* ── Confetti Canvas ────────────────────────────────────────── */
.rib-confetti-canvas {
  position: fixed; inset: 0; z-index: 9999; pointer-events: none;
}

/* ── Rarity Colors (borders for fighter cards) ──────────────── */
.rib-rarity-common      { border-color: #a09686 !important; }
.rib-rarity-uncommon    { border-color: #2ecc71 !important; }
.rib-rarity-rare        { border-color: #f0c040 !important; }
.rib-rarity-ghost-rare  { border-color: #8e44ad !important; }
.rib-rarity-legendary   { border-color: #e74c3c !important; }

`;
    document.head.appendChild(style);
  }

  // ─── UTILITY ────────────────────────────────────────────────────

  /** Get HP bar color by percentage. */
  function hpColor(hp, maxHp) {
    const pct = maxHp > 0 ? hp / maxHp : 0;
    if (pct > 0.6) return '#2ecc71';
    if (pct > 0.3) return '#f39c12';
    return '#e74c3c';
  }

  /** Get boss pool bar color by phase percentage. */
  function poolColor(hp, maxHp) {
    const pct = maxHp > 0 ? hp / maxHp : 0;
    if (pct > 0.75) return '#2ecc71';
    if (pct > 0.50) return '#f39c12';
    if (pct > 0.25) return '#e74c3c';
    return '#8e44ad';
  }

  /** Resolve ghost art, with fallback. */
  function ghostArt(ghost) {
    return (ghost && ghost.art) || '../testroom/art/timber.jpg';
  }

  /** Am I the active turn player? */
  function isMyTurn(state) {
    const user = firebase.auth().currentUser;
    if (!user || !state) return false;
    const players = state.players || {};
    const idx = state.currentPlayerIdx;
    const current = players[idx];
    return current && current.uid === user.uid;
  }

  /** Find my player index. */
  function myPlayerIdx(state) {
    const user = firebase.auth().currentUser;
    if (!user || !state) return -1;
    const players = state.players || {};
    for (const [idx, p] of Object.entries(players)) {
      if (p.uid === user.uid) return parseInt(idx);
    }
    return -1;
  }

  /** Get a count map for dice (for highlighting matching dice). */
  function diceCounts(dice) {
    const c = {};
    (dice || []).forEach(d => { c[d] = (c[d] || 0) + 1; });
    return c;
  }

  /** Return the match class for a die value given counts. */
  function dieMatchClass(value, counts) {
    const n = counts[value] || 0;
    if (n >= 5) return 'match-penta';
    if (n >= 4) return 'match-quads';
    if (n >= 3) return 'match-triples';
    if (n >= 2) return 'match-doubles';
    return '';
  }

  // ─── LOCAL ANIMATION STATE ──────────────────────────────────────

  // Track running animations so we don't re-trigger on every render.
  let _animatingDice = false;
  let _lastLogLength = 0;

  // ═══════════════════════════════════════════════════════════════
  // 1. MAIN RENDER
  // ═══════════════════════════════════════════════════════════════

  /**
   * renderInlineBattle(state, instanceId)
   * Main entry point. Called on every Firebase state change.
   * Renders the full battle UI into #raid-screen.
   */
  window.renderInlineBattle = function (state, instanceId) {
    const container = document.getElementById('raid-screen');
    if (!container || !state) return;

    // Game over check
    if (state.phase === 'game-over') {
      container.innerHTML = '<div class="rib-container">' + renderGameOverHTML(state, instanceId) + '</div>';
      bindGameOverEvents(state, instanceId);
      return;
    }

    // KO swap check
    const mine = isMyTurn(state);
    if (state.phase === 'ko-swap' && mine) {
      container.innerHTML = '<div class="rib-container">'
        + renderBossHpBarHTML(state.bossHp, state.bossMaxHp)
        + renderKoSwapPickerHTML(state, instanceId)
        + renderBattleLogHTML(state.log)
        + '</div>';
      bindKoSwapEvents(state, instanceId);
      autoScrollLog();
      return;
    }

    // Normal battle render
    const html = '<div class="rib-container">'
      + renderBossHpBarHTML(state.bossHp, state.bossMaxHp)
      + renderMatchupHTML(state)
      + renderDiceAreaHTML(state)
      + renderResourceBarHTML(state, instanceId)
      + renderActionButtonsHTML(state, instanceId)
      + renderTurnIndicatorHTML(state)
      + renderSidelineGhostsHTML(state)
      + renderBattleLogHTML(state.log)
      + '</div>';

    container.innerHTML = html;
    bindActionEvents(state, instanceId);
    autoScrollLog();
  };

  // ═══════════════════════════════════════════════════════════════
  // 2. BOSS HP BAR
  // ═══════════════════════════════════════════════════════════════

  window.renderBossHpBar = function (bossHp, bossMaxHp) {
    const el = document.createElement('div');
    el.innerHTML = renderBossHpBarHTML(bossHp, bossMaxHp);
    return el.firstElementChild;
  };

  function renderBossHpBarHTML(bossHp, bossMaxHp) {
    const hp = Math.max(0, bossHp || 0);
    const max = Math.max(1, bossMaxHp || 1);
    const pct = Math.min(100, (hp / max) * 100);
    const color = poolColor(hp, max);

    return `<div class="rib-boss-pool">
      <div class="rib-boss-pool-label">BOSS HP POOL</div>
      <div class="rib-boss-pool-bar">
        <div class="rib-boss-pool-fill" style="width:${pct}%;background:${color}"></div>
        <div class="rib-boss-pool-text">BOSS HP: ${hp} / ${max}</div>
      </div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. FIGHTER CARD
  // ═══════════════════════════════════════════════════════════════

  window.renderFighterCard = function (ghost, team) {
    const el = document.createElement('div');
    el.innerHTML = renderFighterCardHTML(ghost, team);
    return el.firstElementChild;
  };

  function renderFighterCardHTML(ghost, team) {
    if (!ghost) return '<div class="rib-fighter"></div>';

    const hp = Math.max(0, ghost.hp || 0);
    const maxHp = Math.max(1, ghost.maxHp || 1);
    const pct = (hp / maxHp) * 100;
    const color = hpColor(hp, maxHp);
    const ko = ghost.ko || hp <= 0;
    const art = ghostArt(ghost);
    const rarityClass = ghost.rarity ? 'rib-rarity-' + ghost.rarity : '';
    const teamClass = team === 'boss' ? 'boss' : 'player';

    return `<div class="rib-fighter" data-team="${team}">
      <div class="rib-fighter-art-wrap ${teamClass} ${rarityClass}">
        <img class="rib-fighter-art" src="${art}" alt="${ghost.name || '?'}"
             onerror="this.src='../testroom/art/timber.jpg'">
        ${ko ? '<div class="rib-ko-overlay">KO</div>' : ''}
      </div>
      <div class="rib-fighter-name">${ghost.name || '???'}</div>
      <div class="rib-fighter-hp-bar">
        <div class="rib-fighter-hp-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <div class="rib-fighter-hp-text">${hp} / ${maxHp}</div>
    </div>`;
  }

  /** Build the VS matchup section. */
  function renderMatchupHTML(state) {
    const bossGhost = state.bossActiveGhost || {};
    const playerGhost = state.currentPlayerGhost || {};
    const round = state.round || 1;

    return `<div class="rib-matchup">
      ${renderFighterCardHTML(bossGhost, 'boss')}
      <div class="rib-vs">
        <div class="rib-vs-text">VS</div>
        <div class="rib-round-label">Round ${round}</div>
      </div>
      ${renderFighterCardHTML(playerGhost, 'player')}
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. DICE DISPLAY
  // ═══════════════════════════════════════════════════════════════

  window.renderDiceDisplay = function (dice, result, side) {
    const el = document.createElement('div');
    el.innerHTML = renderDiceSideHTML(dice, result, side, false);
    return el.firstElementChild;
  };

  function renderDiceAreaHTML(state) {
    const lastRoll = state.lastRoll;
    if (!lastRoll) return '';

    const bossDice = lastRoll.bossDice || [];
    const playerDice = lastRoll.playerDice || [];
    const bossResult = lastRoll.bossResult || {};
    const playerResult = lastRoll.playerResult || {};
    const winner = lastRoll.winner; // 'player' | 'boss' | 'tie'

    return `<div class="rib-dice-area">
      ${renderDiceSideHTML(bossDice, bossResult, 'boss', winner === 'boss')}
      ${renderDiceSideHTML(playerDice, playerResult, 'player', winner === 'player')}
    </div>`;
  }

  function renderDiceSideHTML(dice, result, side, isWinner) {
    if (!dice || dice.length === 0) return '<div class="rib-dice-side"></div>';

    const counts = diceCounts(dice);
    const type = result.type || 'singles';
    const damage = result.damage || 0;

    // Human-readable label
    const typeLabels = {
      singles: 'singles', doubles: 'doubles', triples: 'triples',
      quads: 'quads', penta: 'PENTA'
    };
    const label = (typeLabels[type] || type) + ' \u2014 ' + damage;

    const diceHtml = dice.map(d => {
      const matchCls = dieMatchClass(d, counts);
      const winFlash = isWinner ? ' winner-flash' : '';
      return `<div class="rib-die ${matchCls}${winFlash}">${d}</div>`;
    }).join('');

    const winnerCls = isWinner ? ' winner' : '';

    return `<div class="rib-dice-side">
      <div class="rib-dice-row">${diceHtml}</div>
      <div class="rib-roll-label${winnerCls}">${label}</div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. RESOURCE BAR
  // ═══════════════════════════════════════════════════════════════

  window.renderResourceBar = function (resources, committed, isActive, instanceId) {
    const el = document.createElement('div');
    el.innerHTML = renderResourceBarHTML({ resources, committed, phase: 'pre-roll' }, instanceId, isActive);
    return el.firstElementChild;
  };

  function renderResourceBarHTML(state, instanceId) {
    const mine = isMyTurn(state);
    const myIdx = myPlayerIdx(state);
    const playerData = (state.players || {})[myIdx];
    const resources = (playerData && playerData.resources) || state.resources || {};
    const committed = state.committed || {};
    const phase = state.phase || 'pre-roll';

    const defs = [
      { key: 'fire',        icon: '\uD83D\uDD25', label: 'Fire',    togglable: true  },
      { key: 'ice',         icon: '\u2744\uFE0F',  label: 'Ice',     togglable: true  },
      { key: 'surge',       icon: '\u26A1',        label: 'Surge',   togglable: true  },
      { key: 'luckyStone',  icon: '\uD83C\uDF40',  label: 'Lucky',   togglable: false },
      { key: 'healingSeed', icon: '\uD83C\uDF3F',  label: 'Seed',    togglable: false },
      { key: 'moonstone',   icon: '\uD83D\uDC8E',  label: 'Moon',    togglable: false },
      { key: 'firefly',     icon: '\uD83C\uDFEE',  label: 'Firefly', togglable: false },
    ];

    const tiles = defs.map(d => {
      const count = resources[d.key] || 0;
      const isCommitted = committed[d.key] || false;
      const disabled = !mine || count <= 0;
      const commitCls = isCommitted ? ' committed' : '';
      const disabledCls = disabled ? ' disabled' : '';
      const dataAction = d.togglable ? `data-action="commit" data-resource="${d.key}"` : '';

      return `<div class="rib-resource${commitCls}${disabledCls}" ${dataAction}>
        <span class="rib-resource-icon">${d.icon}</span>
        <span class="rib-resource-count">\u00D7${count}</span>
      </div>`;
    }).join('');

    return `<div class="rib-resources">${tiles}</div>`;
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. ACTION BUTTONS
  // ═══════════════════════════════════════════════════════════════

  window.renderActionButtons = function (state, instanceId) {
    const el = document.createElement('div');
    el.innerHTML = renderActionButtonsHTML(state, instanceId);
    return el.firstElementChild;
  };

  function renderActionButtonsHTML(state, instanceId) {
    const mine = isMyTurn(state);
    const phase = state.phase || '';
    const myIdx = myPlayerIdx(state);
    const playerData = (state.players || {})[myIdx];
    const resources = (playerData && playerData.resources) || state.resources || {};
    const ghost = state.currentPlayerGhost || {};

    // ROLL button
    const showRoll = mine && phase === 'pre-roll';
    const rollHtml = showRoll
      ? `<button class="rib-btn-roll" data-action="roll">ROLL</button>`
      : '';

    // HEAL button
    const seeds = resources.healingSeed || 0;
    const canHeal = mine && seeds > 0 && ghost.hp < ghost.maxHp && !ghost.ko;
    const healHtml = canHeal
      ? `<button class="rib-btn-heal" data-action="heal">\uD83C\uDF3F HEAL</button>`
      : '';

    if (!rollHtml && !healHtml) return '';
    return `<div class="rib-actions">${rollHtml}${healHtml}</div>`;
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. TURN INDICATOR
  // ═══════════════════════════════════════════════════════════════

  window.renderTurnIndicator = function (state) {
    const el = document.createElement('div');
    el.innerHTML = renderTurnIndicatorHTML(state);
    return el.firstElementChild;
  };

  function renderTurnIndicatorHTML(state) {
    const user = firebase.auth().currentUser;
    const players = state.players || {};
    const currentIdx = state.currentPlayerIdx;
    const currentPlayer = players[currentIdx];
    const mine = isMyTurn(state);
    const myIdx = myPlayerIdx(state);
    const myData = players[myIdx];
    const eliminated = myData && myData.eliminated;

    let inner = '';
    if (eliminated) {
      inner = `<div class="rib-turn-eliminated">You've been eliminated \u2014 watching...</div>`;
    } else if (mine) {
      inner = `<div class="rib-turn-active">YOUR TURN \u2014 Roll!</div>`;
    } else if (currentPlayer) {
      inner = `<div class="rib-turn-waiting">Waiting for ${currentPlayer.displayName || 'Player'} to roll...</div>`;
    }

    // Show all player statuses
    let statusParts = [];
    Object.entries(players).forEach(([idx, p]) => {
      const isCurrent = parseInt(idx) === currentIdx;
      const isMe = p.uid === user?.uid;
      const tag = isMe ? ' (you)' : '';
      if (isCurrent) {
        statusParts.push(`<span style="color:var(--gold-bright)">${p.displayName}${tag}</span>`);
      } else if (p.eliminated) {
        statusParts.push(`<span style="color:var(--text-dim);text-decoration:line-through">${p.displayName}${tag}</span>`);
      } else {
        statusParts.push(`<span style="color:var(--text2)">${p.displayName}${tag}</span>`);
      }
    });

    return `<div class="rib-turn">
      ${inner}
      <div style="font-size:0.68rem;margin-top:4px;color:var(--text-dim)">
        TURN: ${statusParts.join(' \u00B7 ')}
      </div>
    </div>`;
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. SIDELINE GHOSTS
  // ═══════════════════════════════════════════════════════════════

  window.renderSidelineGhosts = function (state) {
    const el = document.createElement('div');
    el.innerHTML = renderSidelineGhostsHTML(state);
    return el.firstElementChild;
  };

  function renderSidelineGhostsHTML(state) {
    const players = state.players || {};
    let rows = '';

    Object.entries(players).forEach(([idx, p]) => {
      const sideline = p.sideline || [];
      if (sideline.length === 0) return;

      const ghostParts = sideline.map(g => {
        const ko = g.ko || (g.hp || 0) <= 0;
        const cls = ko ? ' ko' : '';
        const text = ko ? `${g.name} KO` : `${g.name} ${g.hp}/${g.maxHp}`;
        return `<span class="rib-sideline-ghost${cls}">${text}</span>`;
      }).join('');

      rows += `<div class="rib-sideline-row">
        <span class="rib-sideline-player-label">P${parseInt(idx) + 1}:</span>
        ${ghostParts}
      </div>`;
    });

    if (!rows) return '';
    return `<div class="rib-sidelines">${rows}</div>`;
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. BATTLE LOG
  // ═══════════════════════════════════════════════════════════════

  window.renderBattleLog = function (log) {
    const el = document.createElement('div');
    el.innerHTML = renderBattleLogHTML(log);
    return el.firstElementChild;
  };

  function renderBattleLogHTML(log) {
    const entries = (log || []).slice(-15);
    if (entries.length === 0) return '';

    const lines = entries.map(entry => {
      let cls = 'rib-log-entry';
      if (entry.type === 'damage') cls += ' damage';
      else if (entry.type === 'heal') cls += ' heal';
      else if (entry.type === 'system') cls += ' system';
      return `<div class="${cls}">${entry.text || entry}</div>`;
    }).join('');

    return `<div class="rib-log" id="rib-log">${lines}</div>`;
  }

  function autoScrollLog() {
    const el = document.getElementById('rib-log');
    if (el) el.scrollTop = el.scrollHeight;
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. KO SWAP PICKER
  // ═══════════════════════════════════════════════════════════════

  window.renderKoSwapPicker = function (state, instanceId) {
    const el = document.createElement('div');
    el.innerHTML = renderKoSwapPickerHTML(state, instanceId);
    return el.firstElementChild;
  };

  function renderKoSwapPickerHTML(state, instanceId) {
    const myIdx = myPlayerIdx(state);
    const playerData = (state.players || {})[myIdx];
    if (!playerData) return '';

    const sideline = (playerData.sideline || []).filter(g => !g.ko && g.hp > 0);
    if (sideline.length === 0) return '';

    const cards = sideline.map((g, i) => {
      return `<div class="rib-ko-card" data-action="ko-swap" data-player="${myIdx}" data-ghost="${g.sidelineIdx !== undefined ? g.sidelineIdx : i}">
        <img src="${ghostArt(g)}" alt="${g.name}" onerror="this.src='../testroom/art/timber.jpg'">
        <div class="rib-ko-card-name">${g.name}</div>
        <div class="rib-ko-card-hp">${g.hp}/${g.maxHp}</div>
      </div>`;
    }).join('');

    return `<div class="rib-ko-picker">
      <div class="rib-ko-title">Pick your next fighter!</div>
      <div class="rib-ko-ghosts">${cards}</div>
    </div>`;
  }

  function bindKoSwapEvents(state, instanceId) {
    document.querySelectorAll('[data-action="ko-swap"]').forEach(el => {
      el.addEventListener('click', () => {
        const playerIdx = parseInt(el.dataset.player);
        const ghostIdx = parseInt(el.dataset.ghost);
        if (typeof doKoSwap === 'function') {
          doKoSwap(instanceId, playerIdx, ghostIdx);
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 11. GAME OVER
  // ═══════════════════════════════════════════════════════════════

  window.renderGameOver = function (state, instanceId) {
    const el = document.createElement('div');
    el.innerHTML = renderGameOverHTML(state, instanceId);
    return el.firstElementChild;
  };

  function renderGameOverHTML(state, instanceId) {
    const bossHp = state.bossHp || 0;
    const victory = bossHp <= 0;
    const players = state.players || {};
    const user = firebase.auth().currentUser;

    // Damage summary rows sorted descending
    const sorted = Object.entries(players)
      .map(([idx, p]) => ({ idx: parseInt(idx), ...p }))
      .sort((a, b) => (b.damageDealt || 0) - (a.damageDealt || 0));

    const rows = sorted.map(p => {
      const isMe = p.uid === user?.uid;
      return `<div class="rib-damage-row${isMe ? ' me' : ''}">
        <span class="rib-damage-name">${p.displayName || 'Player'}${isMe ? ' (you)' : ''}</span>
        <span class="rib-damage-val">${p.damageDealt || 0} dmg</span>
      </div>`;
    }).join('');

    const titleCls = victory ? 'victory' : 'defeat';
    const titleText = victory ? 'BOSS DEFEATED!' : 'RAID FAILED';
    const subtitle = victory
      ? 'The Spiritkin prevail!'
      : `Boss survived with ${bossHp} HP remaining.`;

    return `<div class="rib-gameover">
      <div class="rib-gameover-title ${titleCls}">${titleText}</div>
      <div class="rib-gameover-subtitle">${subtitle}</div>
      <div class="rib-damage-summary">${rows}</div>
      <button class="rib-btn-lobby" data-action="lobby">RETURN TO LOBBY</button>
    </div>`;
  }

  function bindGameOverEvents(state, instanceId) {
    const bossHp = state.bossHp || 0;
    if (bossHp <= 0) {
      // Victory confetti
      setTimeout(() => fireConfetti(), 300);
    }
    document.querySelectorAll('[data-action="lobby"]').forEach(el => {
      el.addEventListener('click', () => {
        if (typeof closeRaidResult === 'function') closeRaidResult();
        else if (typeof hideRaidScreen === 'function') hideRaidScreen();
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 12. DICE ROLL ANIMATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * animateDiceRoll(playerDice, bossDice, callback)
   * Quick tumble animation (0.8s), then reveals final values.
   */
  window.animateDiceRoll = function (playerDice, bossDice, callback) {
    if (_animatingDice) { if (callback) callback(); return; }
    _animatingDice = true;

    const container = document.querySelector('.rib-dice-area');
    if (!container) { _animatingDice = false; if (callback) callback(); return; }

    // Phase 1: Show tumbling placeholders
    const buildTumble = (dice) => dice.map(() =>
      '<div class="rib-die tumbling">?</div>'
    ).join('');

    container.innerHTML = `
      <div class="rib-dice-side"><div class="rib-dice-row">${buildTumble(bossDice)}</div></div>
      <div class="rib-dice-side"><div class="rib-dice-row">${buildTumble(playerDice)}</div></div>
    `;

    // Phase 2: Rapid random faces (every 80ms for 600ms)
    const randomInterval = setInterval(() => {
      container.querySelectorAll('.rib-die.tumbling').forEach(el => {
        el.textContent = Math.floor(Math.random() * 6) + 1;
      });
    }, 80);

    // Phase 3: Land on final values
    setTimeout(() => {
      clearInterval(randomInterval);

      const bCounts = diceCounts(bossDice);
      const pCounts = diceCounts(playerDice);
      const bClassify = typeof classify === 'function' ? classify(bossDice) : { type: 'singles', damage: 1 };
      const pClassify = typeof classify === 'function' ? classify(playerDice) : { type: 'singles', damage: 1 };

      // Determine winner
      let winner = 'tie';
      if (pClassify.damage > bClassify.damage || (pClassify.damage === bClassify.damage && (pClassify.value || 0) > (bClassify.value || 0))) {
        winner = 'player';
      } else if (bClassify.damage > pClassify.damage || (bClassify.damage === pClassify.damage && (bClassify.value || 0) > (pClassify.value || 0))) {
        winner = 'boss';
      }

      const buildLanded = (dice, counts, isWin) => dice.map(d => {
        const match = dieMatchClass(d, counts);
        const flash = isWin ? ' winner-flash' : '';
        return `<div class="rib-die landed ${match}${flash}">${d}</div>`;
      }).join('');

      const sides = container.querySelectorAll('.rib-dice-side');
      if (sides[0]) sides[0].querySelector('.rib-dice-row').innerHTML = buildLanded(bossDice, bCounts, winner === 'boss');
      if (sides[1]) sides[1].querySelector('.rib-dice-row').innerHTML = buildLanded(playerDice, pCounts, winner === 'player');

      _animatingDice = false;
      if (callback) setTimeout(callback, 200);
    }, 650);
  };

  // ═══════════════════════════════════════════════════════════════
  // 13. DAMAGE CALLOUT ANIMATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * animateDamageCallout(damage, target, winner)
   * Pops a damage number over the target fighter card.
   * target: 'player' | 'boss'
   * winner: 'player' | 'boss' (determines color)
   */
  window.animateDamageCallout = function (damage, target, winner) {
    const fighters = document.querySelectorAll('.rib-fighter');
    let targetEl = null;

    fighters.forEach(f => {
      if (f.dataset.team === target) targetEl = f;
    });

    if (!targetEl) return;

    const rect = targetEl.getBoundingClientRect();
    const callout = document.createElement('div');
    const isDamage = target !== winner; // the target is taking damage if they're not the winner
    callout.className = 'rib-callout ' + (isDamage ? 'damage' : 'heal');
    callout.textContent = (isDamage ? '-' : '+') + damage;
    callout.style.position = 'fixed';
    callout.style.left = (rect.left + rect.width / 2 - 20) + 'px';
    callout.style.top = (rect.top + 10) + 'px';

    document.body.appendChild(callout);
    setTimeout(() => callout.remove(), 850);
  };

  // ═══════════════════════════════════════════════════════════════
  // EVENT BINDING (delegated)
  // ═══════════════════════════════════════════════════════════════

  function bindActionEvents(state, instanceId) {
    // ROLL button
    document.querySelectorAll('[data-action="roll"]').forEach(el => {
      el.addEventListener('click', () => {
        el.disabled = true;
        if (typeof doPlayerRoll === 'function') doPlayerRoll(instanceId);
      });
    });

    // HEAL button
    document.querySelectorAll('[data-action="heal"]').forEach(el => {
      el.addEventListener('click', () => {
        if (typeof useHealingSeed === 'function') useHealingSeed(instanceId);
      });
    });

    // Resource commit toggles
    document.querySelectorAll('[data-action="commit"]').forEach(el => {
      el.addEventListener('click', () => {
        const resource = el.dataset.resource;
        if (typeof commitResource === 'function') commitResource(instanceId, resource);
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // CONFETTI (victory)
  // ═══════════════════════════════════════════════════════════════

  function fireConfetti() {
    const canvas = document.createElement('canvas');
    canvas.className = 'rib-confetti-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const palette = ['#f0c560', '#e74c3c', '#9b59b6', '#ffffff', '#2ecc71', '#75BEEB'];
    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -200 - 10,
      w: Math.random() * 10 + 4,
      h: Math.random() * 5 + 2,
      color: palette[Math.floor(Math.random() * palette.length)],
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 3 + 1.5,
      rot: Math.random() * Math.PI * 2,
      drot: (Math.random() - 0.5) * 0.18
    }));

    let frame = 0;
    const maxFrames = 200;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const alpha = Math.max(0, 1 - Math.max(0, frame - 130) / 70);
      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.drot;
        p.vy += 0.06;
      });
      frame++;
      if (frame < maxFrames) requestAnimationFrame(draw);
      else canvas.remove();
    }
    requestAnimationFrame(draw);
  }

})();
