// =================================================================
// RAID BATTLE UI — Inline multiplayer raid battle renderer
// Renders the battle screen directly inside #raid-screen using the
// EXACT same HTML structure and CSS classes as the testroom arena.
//
// Depends on:
//   cards.js           — getGhost(), ghost data
//   battle-engine.js   — INLINE_BATTLE.classify()
//   raid-engine.js     — doPlayerRoll, commitResource, useHealingSeed,
//                        doKoSwap (action functions called on user input)
//   Firebase           — firebase.auth().currentUser for turn detection
//
// Uses testroom class names — NO "rib-" prefix for the battle area.
// Boss HP pool bar + game-over overlay keep existing rib- classes
// (already defined in index.html CSS).
// =================================================================

(function () {
  'use strict';

  // ─── STYLE INJECTION ──────────────────────────────────────────
  const STYLE_ID = 'raid-testroom-styles';
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `

/* ── Arena Board (testroom exact) ──────────────────────────────── */
#raid-screen .arena-board {
  max-width:1400px; margin:0 auto;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(233,69,96,0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 50%, rgba(52,152,219,0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(15,20,60,0.9) 0%, transparent 100%),
    linear-gradient(90deg, #04041a 0%, #080820 25%, #0a0a2e 50%, #080820 75%, #04041a 100%);
  border-radius:20px; border:1px solid rgba(126,232,250,0.15); padding:16px; overflow:hidden;
  display:flex; flex-direction:row; align-items:stretch; gap:12px; position:relative;
  box-shadow:0 0 60px rgba(0,0,0,0.8), inset 0 0 120px rgba(126,232,250,0.04);
}
#raid-screen .arena-board::before {
  content:''; position:absolute; inset:0; border-radius:20px; pointer-events:none;
  background-image:
    radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 30% 35%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 55% 12%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 75% 28%, rgba(255,255,255,0.35) 0%, transparent 100%),
    radial-gradient(1px 1px at 88% 8%, rgba(255,255,255,0.5) 0%, transparent 100%),
    radial-gradient(1px 1px at 42% 68%, rgba(255,255,255,0.3) 0%, transparent 100%),
    radial-gradient(1px 1px at 65% 80%, rgba(255,255,255,0.4) 0%, transparent 100%),
    radial-gradient(1px 1px at 20% 90%, rgba(255,255,255,0.25) 0%, transparent 100%),
    radial-gradient(1px 1px at 92% 60%, rgba(255,255,255,0.45) 0%, transparent 100%),
    radial-gradient(1px 1px at 5% 55%, rgba(255,255,255,0.3) 0%, transparent 100%);
}

/* ── Team Columns ──────────────────────────────────────────────── */
#raid-screen .team-column {
  flex:1; display:flex; flex-direction:column; gap:8px; align-items:center; justify-content:center;
  min-width:0;
}
#raid-screen .team-battle-row { display:flex; gap:12px; align-items:center; justify-content:center; }
#raid-screen .sideline-stack { display:flex; flex-direction:column; gap:6px; }
#raid-screen .team-info { display:flex; flex-direction:column; align-items:center; gap:6px; width:100%; }

/* ── Arena Center ──────────────────────────────────────────────── */
#raid-screen .arena-center {
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;
  min-width:220px; padding:0 4px; flex-shrink:0;
}
#raid-screen .arena-mid { display:flex; flex-direction:column; align-items:center; gap:8px; width:100%; }

/* ── Arena Card (base) ─────────────────────────────────────────── */
#raid-screen .arena-card {
  background:var(--surface, #14101c); border:2px solid var(--border, #2a2230); border-radius:12px;
  overflow:hidden; transition:all .3s; position:relative;
}
#raid-screen .arena-card.ko { opacity:0.25; }

/* Rarity border colors */
#raid-screen .arena-card.rarity-common { border-color:var(--common, #8b95a5); }
#raid-screen .arena-card.rarity-uncommon { border-color:var(--uncommon, #2ecc71); box-shadow:0 0 8px rgba(46,204,113,0.2); }
#raid-screen .arena-card.rarity-rare { border-color:var(--rare, #3498db); box-shadow:0 0 10px rgba(52,152,219,0.25); }
#raid-screen .arena-card.rarity-ghost-rare { border-color:var(--ghost-rare, #9b59b6); box-shadow:0 0 14px rgba(155,89,182,0.35); }
#raid-screen .arena-card.rarity-legendary { border-color:var(--legendary, #f39c12); box-shadow:0 0 18px rgba(243,156,18,0.45); animation:legendaryPulse 2s ease-in-out infinite; }
@keyframes legendaryPulse {
  0%,100% { box-shadow:0 0 18px rgba(243,156,18,0.45); }
  50% { box-shadow:0 0 30px rgba(243,156,18,0.7), 0 0 50px rgba(243,156,18,0.25); }
}

/* ── Fighter Slot ──────────────────────────────────────────────── */
#raid-screen .fighter-slot {
  width:240px; flex-shrink:0;
  position:relative;
  overflow:visible !important;
  background: linear-gradient(180deg, #1e1828 0%, #100a18 100%);
  border-radius:14px;
  border-width:2px;
  margin-left:22px;
  margin-right:22px;
}
#raid-screen .fighter-slot.team-red {
  background: linear-gradient(180deg, #281620 0%, #100610 100%) !important;
  border-color:var(--accent, #e94560);
  box-shadow:
    inset 0 0 80px rgba(233, 69, 96, 0.10),
    0 0 12px rgba(233, 69, 96, 0.18),
    0 18px 30px rgba(233, 69, 96, 0.18),
    0 24px 50px rgba(0, 0, 0, 0.70),
    0 0 30px rgba(233,69,96,0.35), 0 0 60px rgba(233,69,96,0.1) !important;
}
#raid-screen .fighter-slot.team-blue {
  background: linear-gradient(180deg, #16242e 0%, #060e16 100%) !important;
  border-color:var(--rare, #3498db);
  box-shadow:
    inset 0 0 80px rgba(76, 201, 240, 0.10),
    0 0 12px rgba(76, 201, 240, 0.18),
    0 18px 30px rgba(76, 201, 240, 0.16),
    0 24px 50px rgba(0, 0, 0, 0.70),
    0 0 30px rgba(52,152,219,0.35), 0 0 60px rgba(52,152,219,0.1) !important;
}
#raid-screen .fighter-slot .card-rarity-badge { display:none; }
#raid-screen .fighter-slot .card-name-banner {
  padding:8px 10px;
  font-family: 'Inter', sans-serif;
  letter-spacing:0.06em;
  font-size:15px;
}
#raid-screen .fighter-slot > .card-img,
#raid-screen .fighter-slot > .card-name-banner { border-top-left-radius:12px; border-top-right-radius:12px; }
#raid-screen .fighter-slot.hit { animation:hitShake 0.5s ease-out; }
@keyframes hitShake {
  0% { transform:translate(0,0) scale(1); }
  10% { transform:translate(-8px, 4px) scale(0.97); }
  25% { transform:translate(6px, -5px) scale(1.02); }
  40% { transform:translate(-5px, 3px); }
  55% { transform:translate(3px, -2px); }
  70% { transform:translate(-2px, 1px); }
  100% { transform:translate(0,0) scale(1); }
}

/* ── Sideline Slot ─────────────────────────────────────────────── */
#raid-screen .sideline-slot {
  width:150px; flex-shrink:0;
  transition:transform 0.3s, z-index 0s, opacity 0.25s;
  background: linear-gradient(180deg, rgba(28, 22, 38, 0.92), rgba(14, 10, 22, 0.92));
  border:1px solid rgba(212, 160, 64, 0.22) !important;
  border-radius:9px;
  opacity:0.88;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.55);
}
#raid-screen .sideline-slot:hover { opacity:1; transform:translateY(-3px); }
#raid-screen .sideline-slot .card-name-banner { font-size:12px; padding:5px 8px; }
#raid-screen .sideline-slot .card-rarity-badge { display:none; }

/* ── Card Image & Name Banner ──────────────────────────────────── */
#raid-screen .arena-card .card-img { width:100%; aspect-ratio:1; object-fit:cover; display:block; background:var(--bg, #0a0612); }
#raid-screen .card-name-banner {
  padding:8px 10px;
  font-family:'Inter', sans-serif;
  font-size:15px; font-weight:700;
  color:var(--text, #f4ecd8);
  letter-spacing:0.06em;
  text-shadow:0 1px 4px rgba(0,0,0,0.75);
  border-bottom:1px solid rgba(212,160,64,0.22);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  text-align:center;
}
#raid-screen .card-name-banner.rarity-common { background:linear-gradient(135deg, rgba(139,149,165,0.4), rgba(139,149,165,0.2)); }
#raid-screen .card-name-banner.rarity-uncommon { background:linear-gradient(135deg, rgba(46,204,113,0.4), rgba(46,204,113,0.2)); }
#raid-screen .card-name-banner.rarity-rare { background:linear-gradient(135deg, rgba(52,152,219,0.4), rgba(52,152,219,0.2)); }
#raid-screen .card-name-banner.rarity-ghost-rare { background:linear-gradient(135deg, rgba(155,89,182,0.5), rgba(155,89,182,0.25)); }
#raid-screen .card-name-banner.rarity-legendary { background:linear-gradient(135deg, rgba(243,156,18,0.5), rgba(243,156,18,0.25)); }

/* ── Card HP Badge ─────────────────────────────────────────────── */
#raid-screen .card-hp-badge {
  position:absolute; bottom:6px; right:6px;
  background:rgba(0,0,0,0.75); color:var(--text, #f4ecd8);
  font-size:12px; font-weight:800; padding:3px 8px; border-radius:6px;
  backdrop-filter:blur(4px); z-index:3;
  border:1px solid rgba(255,255,255,0.1);
}

/* ── HP Bars ───────────────────────────────────────────────────── */
#raid-screen .hp-bar-wrap {
  width:100%; height:10px; background:rgba(255,255,255,0.06); border-radius:5px;
  overflow:hidden; border:1px solid rgba(255,255,255,0.06); position:relative;
}
#raid-screen .hp-bar {
  height:100%; border-radius:4px; transition:width 0.6s ease-out, background 0.4s;
  position:relative; width:100%;
}
#raid-screen .hp-bar::after {
  content:''; position:absolute; top:0; left:0; right:0; height:50%;
  background:linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%);
  border-radius:4px 4px 0 0;
}
#raid-screen .hp-bar.team-red { background:linear-gradient(90deg, #dc2626, #f87171); box-shadow:0 0 8px rgba(248,113,113,0.4); }
#raid-screen .hp-bar.team-blue { background:linear-gradient(90deg, #0891b2, #67e8f9); box-shadow:0 0 8px rgba(103,232,249,0.4); }
#raid-screen .hp-bar.hp-low { background:linear-gradient(90deg, #d97706, #fbbf24) !important; box-shadow:0 0 10px rgba(251,191,36,0.5) !important; }
#raid-screen .hp-bar.hp-critical { background:linear-gradient(90deg, #b91c1c, #ef4444) !important; box-shadow:0 0 12px rgba(239,68,68,0.6) !important; animation:hpPulse 0.8s ease-in-out infinite; }
@keyframes hpPulse { 0%, 100% { opacity:1; } 50% { opacity:0.65; } }
#raid-screen .hp-text { display:flex; justify-content:space-between; font-size:0.6rem; font-weight:700; color:#666; margin-top:3px; }
#raid-screen .hp-text .hp-num { color:#aaa; }

/* ── Resources — Gilt tiles ────────────────────────────────────── */
#raid-screen .resources { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; align-items:center; }
#raid-screen .res-tile {
  width:48px; height:56px;
  border-radius:8px;
  border:1px solid rgba(212, 160, 64, 0.28);
  background: linear-gradient(180deg, rgba(28, 22, 38, 0.9), rgba(14, 10, 22, 0.9));
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  position:relative; cursor:default; transition:all 0.2s; backdrop-filter:blur(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
#raid-screen .res-tile .res-main { font-size:20px; line-height:1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.55)); }
#raid-screen .res-tile .res-count {
  font-family:'Inter', sans-serif;
  font-size:15px; font-weight:700; line-height:1;
  margin-top:2px;
}
#raid-screen .res-tile .res-label {
  font-family:'Inter', sans-serif;
  font-size:7px; font-weight:700;
  color:var(--text-dim, #6a6056);
  letter-spacing:0.18em;
  text-transform:uppercase; margin-top:2px; line-height:1;
}
#raid-screen .res-tile.moonstone { border-color:rgba(126,232,250,0.4); box-shadow:0 0 8px rgba(126,232,250,0.15); }
#raid-screen .res-tile.moonstone .res-count { color:var(--moonstone, #7ee8fa); }
#raid-screen .res-tile.ice { border-color:rgba(52,152,219,0.4); box-shadow:0 0 8px rgba(52,152,219,0.15); }
#raid-screen .res-tile.ice .res-count { color:var(--rare, #3498db); }
#raid-screen .res-tile.fire { border-color:rgba(243,156,18,0.4); box-shadow:0 0 8px rgba(243,156,18,0.15); }
#raid-screen .res-tile.fire .res-count { color:#fb923c; }
#raid-screen .res-tile.surge { border-color:rgba(168,85,247,0.4); box-shadow:0 0 8px rgba(168,85,247,0.15); }
#raid-screen .res-tile.surge .res-count { color:#a855f7; }
#raid-screen .res-tile.healingSeed { border-color:rgba(34,197,94,0.4); box-shadow:0 0 8px rgba(34,197,94,0.15); }
#raid-screen .res-tile.healingSeed .res-count { color:#22c55e; }
#raid-screen .res-tile.luckyStone { border-color:rgba(251,191,36,0.4); box-shadow:0 0 8px rgba(251,191,36,0.15); }
#raid-screen .res-tile.luckyStone .res-count { color:#fbbf24; }
#raid-screen .res-tile.firefly { border-color:rgba(255,215,0,0.5); box-shadow:0 0 10px rgba(255,215,0,0.25); }
#raid-screen .res-tile.firefly .res-count { color:#ffd700; }
#raid-screen .res-tile.clickable { cursor:pointer; }
#raid-screen .res-tile.clickable:hover { transform:scale(1.08); border-color:rgba(255,255,255,0.4); }
#raid-screen .res-tile.committed {
  border-color:rgba(251,191,36,0.7); box-shadow:0 0 16px rgba(251,191,36,0.4);
  animation:committedPulse 1s ease-in-out infinite;
}
@keyframes committedPulse {
  0%, 100% { box-shadow:0 0 10px rgba(251,191,36,0.3); }
  50% { box-shadow:0 0 24px rgba(251,191,36,0.6); }
}

/* ── Dice Tray ─────────────────────────────────────────────────── */
#raid-screen .dice-stack {
  display:flex; flex-direction:column; gap:14px; width:100%;
  padding:18px 22px 16px;
  position:relative;
  background:
    radial-gradient(ellipse at center 65%, rgba(120, 65, 25, 0.4), transparent 80%),
    linear-gradient(165deg, #2c1812 0%, #1a0a05 55%, #0e0502 100%);
  border-radius:14px;
  border:1px solid rgba(140, 80, 35, 0.45);
  box-shadow:
    inset 0 3px 10px rgba(0, 0, 0, 0.7),
    inset 0 -2px 6px rgba(180, 100, 40, 0.18),
    0 8px 26px rgba(0, 0, 0, 0.65);
}
#raid-screen .dice-stack::before {
  content:'';
  position:absolute; inset:5px;
  border:1px solid rgba(180, 120, 50, 0.22);
  border-radius:11px;
  pointer-events:none;
  z-index:1;
}
#raid-screen .dice-stack::after {
  content:'';
  position:absolute; inset:0;
  border-radius:14px;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='wg'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='2' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23wg)' opacity='0.5'/%3E%3C/svg%3E");
  opacity:0.08;
  mix-blend-mode:overlay;
  pointer-events:none;
}
#raid-screen .dice-row { display:flex; gap:12px; position:relative; z-index:2; }
#raid-screen .dice-row.dice-red { justify-content:flex-start; padding-left:8px; }
#raid-screen .dice-row.dice-blue { justify-content:flex-end; padding-right:8px; }

/* ── Dice ──────────────────────────────────────────────────────── */
#raid-screen .die {
  width:56px; height:56px;
  background: linear-gradient(165deg, #f4ecd8 0%, #e8dcb8 35%, #d8c894 70%, #b8a878 100%);
  border:1px solid rgba(120, 80, 30, 0.5);
  border-radius:11px;
  display:flex; align-items:center; justify-content:center;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size:28px; font-weight:800;
  color:#3a1f08;
  letter-spacing:-0.5px;
  transition:all .3s; user-select:none;
  box-shadow:
    inset 0 -4px 8px rgba(120, 80, 30, 0.35),
    inset 0 2px 3px rgba(255, 255, 240, 0.7),
    inset 2px 0 4px rgba(255, 255, 240, 0.4),
    inset -2px 0 4px rgba(120, 80, 30, 0.3),
    0 4px 0 -1px rgba(0, 0, 0, 0.4),
    0 8px 14px -2px rgba(0, 0, 0, 0.7),
    0 14px 22px -8px rgba(0, 0, 0, 0.6),
    0 18px 28px -10px rgba(120, 60, 20, 0.5);
}
#raid-screen .dice-row .die:nth-child(odd) { transform: rotate(-1.5deg); }
#raid-screen .dice-row .die:nth-child(even) { transform: rotate(1deg); }
#raid-screen .dice-row .die:nth-child(3n) { transform: rotate(-2deg); }
#raid-screen .die.die-red {
  border-color:rgba(233,69,96,0.55);
  background: linear-gradient(165deg, #fce0d8 0%, #f4b8a8 35%, #d88878 70%, #a05050 100%);
  color:#4a0e1a;
}
#raid-screen .die.die-blue {
  border-color:rgba(76,201,240,0.55);
  background: linear-gradient(165deg, #dcf0fc 0%, #a8d8ee 35%, #78a0c4 70%, #406088 100%);
  color:#0a3050;
}
#raid-screen .die.rolling { animation:shake .12s infinite; }
@keyframes shake {
  0%,100% { transform:rotate(0); }
  25% { transform:rotate(-8deg) scale(1.08); }
  75% { transform:rotate(8deg) scale(1.08); }
}

/* Dice gold highlighting — forged gold winner dice */
#raid-screen .die.locked,
#raid-screen .die.die-win,
#raid-screen .die.die-win-doubles,
#raid-screen .die.die-win-triples,
#raid-screen .die.die-win-mega {
  background: linear-gradient(158deg,
    #fff6cc 0%,
    #ffe27a 18%,
    #ffc83a 42%,
    #d79418 72%,
    #7c4d08 100%) !important;
  border: 1.5px solid #fff3a0 !important;
  color: #3a1d02 !important;
  text-shadow:
    0 1px 0 rgba(255,255,220,0.85),
    0 -1px 1px rgba(80,40,0,0.55) !important;
  transform: rotate(0deg) translateY(-2px) scale(1.10) !important;
  position: relative;
  z-index: 3;
  overflow: hidden;
  box-shadow:
    inset 0 2px 3px rgba(255,255,220,0.95),
    inset 0 -5px 10px rgba(120,70,0,0.55),
    inset 2px 0 4px rgba(255,240,170,0.45),
    inset -2px 0 4px rgba(95,50,0,0.4),
    0 0 0 2px rgba(255,215,110,0.45),
    0 0 14px rgba(255,200,60,0.8),
    0 0 28px rgba(255,175,35,0.5),
    0 6px 14px -4px rgba(150,85,0,0.6) !important;
  animation: dieWinPulse 1.3s ease-in-out infinite;
}
@keyframes dieWinPulse {
  0%,100% { filter: brightness(1); }
  50%     { filter: brightness(1.14) saturate(1.05); }
}

/* Loser dice — soft recede */
#raid-screen .die.die-loser {
  opacity: 0.42 !important;
  transform: scale(0.94) !important;
  transition: opacity 0.4s, transform 0.4s;
}

/* ── Turn Indicator ────────────────────────────────────────────── */
#raid-screen .turn-indicator { font-size:13px; color:var(--text2, #a09686); text-transform:uppercase; letter-spacing:1.5px; font-weight:700; text-align:center; }

/* ── Action Buttons ────────────────────────────────────────────── */
#raid-screen .action-btn {
  padding:12px 26px;
  border:1px solid var(--border, #2a2230); border-radius:8px; cursor:pointer;
  font-family:'Inter', sans-serif;
  font-size:12px; font-weight:700;
  letter-spacing:0.28em; text-transform:uppercase;
  background:var(--surface, #14101c); color:var(--text, #f4ecd8); transition:all .15s;
  text-shadow:0 1px 2px rgba(0,0,0,0.6);
  position:relative; overflow:hidden;
}
#raid-screen .action-btn:hover { border-color:var(--moonstone, #7ee8fa); background:var(--surface2, #1c1828); }
#raid-screen .action-btn.roll-red {
  background: linear-gradient(180deg, #e94560 0%, #a02040 100%);
  border: 1px solid #f06080;
  color: white;
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.4),
    0 8px 18px rgba(233, 69, 96, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -3px 6px rgba(0, 0, 0, 0.3);
  animation: pulse-red 2.4s ease-in-out infinite;
}
#raid-screen .action-btn.roll-red:hover:not(:disabled) { transform:translateY(-2px); }
#raid-screen .action-btn:disabled { opacity:0.3; pointer-events:none; }
#raid-screen .team-roll { width:90%; max-width:280px; margin-top:6px; padding:10px 20px; font-size:14px; }
@keyframes pulse-red {
  0%, 100% {
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.4),
      0 8px 18px rgba(233, 69, 96, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -3px 6px rgba(0, 0, 0, 0.3);
  }
  50% {
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.4),
      0 10px 28px rgba(233, 69, 96, 0.95),
      0 0 24px rgba(233, 69, 96, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -3px 6px rgba(0, 0, 0, 0.3);
  }
}

/* ── Narrator ──────────────────────────────────────────────────── */
#raid-screen .narrator-box { width:100%; margin-top:4px; position:relative; z-index:200; }
#raid-screen .narrator-inner {
  background:rgba(10,10,25,0.92); border:1px solid rgba(255,255,255,0.1);
  border-radius:10px; padding:8px 14px; text-align:center; font-size:13px;
  font-weight:700; color:#ccc; line-height:1.4; min-height:34px;
  display:flex; align-items:center; justify-content:center;
  backdrop-filter:blur(8px); box-shadow:0 4px 16px rgba(0,0,0,0.5);
  transition:opacity 0.3s;
}
#raid-screen .narrator-inner b.red-text { color:var(--accent, #e94560); }
#raid-screen .narrator-inner b.blue-text { color:var(--rare, #3498db); }
#raid-screen .narrator-inner b.gold { color:var(--legendary, #f39c12); }
#raid-screen .narrator-inner b.ko-text { color:var(--accent, #e94560); font-size:16px; }

/* ── Battle Log ────────────────────────────────────────────────── */
#raid-screen .log-wrap {
  background: linear-gradient(180deg, rgba(20, 14, 28, 0.94), rgba(10, 6, 18, 0.94));
  border:1px solid rgba(212, 160, 64, 0.35);
  border-radius:10px;
  padding:14px 16px 12px;
  max-height:200px; overflow-y:auto; margin-top:14px; scroll-behavior:smooth;
  box-shadow: 0 0 32px rgba(212, 160, 64, 0.10), inset 0 1px 0 rgba(255,255,255,0.03);
  position:relative;
}
#raid-screen .log-wrap::before {
  content:'';
  position:absolute; top:-1px; left:12px; right:12px; height:1px;
  background: linear-gradient(90deg, transparent, var(--gilt, #b8862c), transparent);
}
#raid-screen .log-wrap h4 {
  font-family:'Inter', sans-serif;
  font-size:9px; font-weight:700;
  color:var(--gold-bright, #f0c560);
  margin-bottom:10px; padding-bottom:8px;
  text-transform:uppercase; letter-spacing:0.4em;
  text-align:center;
  border-bottom:1px solid rgba(212, 160, 64, 0.25);
}
#raid-screen .log-wrap h4::before, #raid-screen .log-wrap h4::after {
  content:'\u2726';
  font-size:7px;
  color:var(--gilt, #b8862c);
  margin:0 8px;
  vertical-align:middle;
  opacity:0.7;
}
#raid-screen .log-entry {
  font-family:'Inter', sans-serif;
  font-size:13px; padding:4px 0;
  border-bottom:1px dotted rgba(255,255,255,0.05);
  color:var(--text2, #a09686); line-height:1.55;
  font-style:italic;
}
#raid-screen .log-entry:last-child { border-bottom:none; }

/* ── KO Swap Pick ──────────────────────────────────────────────── */
#raid-screen .sideline-slot.ko-swap-pick {
  cursor:pointer !important;
  border-color:gold !important;
  box-shadow:0 0 0 2px gold, 0 0 22px rgba(255,215,0,0.7) !important;
  animation:koSwapPulse 0.75s ease-in-out infinite;
  transform:scale(1.04);
  z-index:2;
}
#raid-screen .sideline-slot.ko-swap-pick:hover { box-shadow:0 0 0 3px gold, 0 0 36px rgba(255,215,0,1) !important; }
@keyframes koSwapPulse {
  0%,100% { box-shadow:0 0 0 2px gold, 0 0 18px rgba(255,215,0,0.6); }
  50%      { box-shadow:0 0 0 3px gold, 0 0 32px rgba(255,215,0,0.95); }
}

/* ── Damage Callout ────────────────────────────────────────────── */
#raid-screen .damage-callout {
  position: absolute; pointer-events: none;
  font-family: 'Creepster', cursive; font-size: 2rem;
  animation: calloutPop 0.8s ease forwards;
  z-index: 10;
}
#raid-screen .damage-callout.dmg { color: #e74c3c; }
#raid-screen .damage-callout.heal { color: #2ecc71; }
@keyframes calloutPop {
  0%   { opacity: 1; transform: translateY(0) scale(0.6); }
  30%  { opacity: 1; transform: translateY(-10px) scale(1.2); }
  100% { opacity: 0; transform: translateY(-40px) scale(0.8); }
}

/* ── Confetti ──────────────────────────────────────────────────── */
.raid-confetti-canvas {
  position: fixed; inset: 0; z-index: 9999; pointer-events: none;
}

/* ── Mobile responsive ─────────────────────────────────────────── */
@media (max-width: 900px) {
  #raid-screen .arena-board { flex-direction:column; padding:10px; gap:8px; }
  #raid-screen .fighter-slot { width:180px; margin-left:10px; margin-right:10px; }
  #raid-screen .sideline-slot { width:120px; }
  #raid-screen .arena-center { min-width:unset; }
  #raid-screen .die { width:44px; height:44px; font-size:22px; }
  #raid-screen .narrator-inner { font-size:12px; padding:8px 12px; min-height:30px; }
  #raid-screen .log-wrap { max-height:120px !important; }
}
@media (max-width: 600px) {
  #raid-screen .fighter-slot { width:140px; margin-left:4px; margin-right:4px; }
  #raid-screen .sideline-slot { width:100px; }
  #raid-screen .die { width:36px; height:36px; font-size:18px; border-radius:8px; }
  #raid-screen .res-tile { width:40px; height:48px; }
  #raid-screen .res-tile .res-main { font-size:16px; }
  #raid-screen .res-tile .res-count { font-size:12px; }
  #raid-screen .narrator-inner { font-size:11px; padding:6px 10px; }
}

`;
    document.head.appendChild(style);
  }

  // ─── UTILITY ────────────────────────────────────────────────────

  /** Am I the active turn player? */
  function isMyTurn(state) {
    const user = firebase.auth().currentUser;
    if (!user || !state) return false;
    const current = (state.players || {})[state.turnPlayerIdx];
    return current && current.uid === user.uid;
  }

  /** Find my player index. */
  function myPlayerIdx(state) {
    const user = firebase.auth().currentUser;
    if (!user || !state) return -1;
    for (const [idx, p] of Object.entries(state.players || {})) {
      if (p.uid === user.uid) return parseInt(idx);
    }
    return -1;
  }

  /** Resolve ghost art with fallback. */
  function ghostArt(ghost) {
    return (ghost && ghost.art) || '../testroom/art/timber.jpg';
  }

  /** Return HP bar state class. */
  function hpBarClass(hp, maxHp) {
    if (maxHp <= 0) return '';
    const pct = hp / maxHp;
    if (pct <= 0.25) return 'hp-critical';
    if (pct <= 0.50) return 'hp-low';
    return '';
  }

  /** Get rarity from ghost data. */
  function ghostRarity(ghost) {
    if (!ghost) return 'common';
    if (ghost.rarity) return ghost.rarity;
    if (typeof getGhost === 'function') {
      const data = getGhost(ghost.id);
      if (data && data.rarity) return data.rarity;
    }
    return 'common';
  }

  /** Boss pool bar color by HP percentage. */
  function poolColor(hp, maxHp) {
    const pct = maxHp > 0 ? hp / maxHp : 0;
    if (pct > 0.75) return '#2ecc71';
    if (pct > 0.50) return '#f39c12';
    if (pct > 0.25) return '#e74c3c';
    return '#8e44ad';
  }

  /** Count occurrences of each die value. */
  function diceCounts(dice) {
    const c = {};
    (dice || []).forEach(d => { c[d] = (c[d] || 0) + 1; });
    return c;
  }

  // ─── TRACK STATE FOR INCREMENTAL UPDATES ────────────────────────

  let _skeletonBuilt = false;
  let _lastLogLength = 0;
  let _lastRound = 0;
  let _lastPhase = '';

  // ═══════════════════════════════════════════════════════════════
  // RENDER HELPERS — Build innerHTML for each slot
  // ═══════════════════════════════════════════════════════════════

  /** Render fighter-slot innerHTML (card-name-banner, card-img, card-hp-badge). */
  function renderFighterSlot(ghost, team) {
    if (!ghost) return '';
    const rarity = ghostRarity(ghost);
    const art = ghostArt(ghost);
    const hp = Math.max(0, ghost.hp || 0);
    const maxHp = Math.max(1, ghost.maxHp || 1);
    return `<div class="card-name-banner rarity-${rarity}">${ghost.name || '???'}</div>` +
      `<img class="card-img" src="${art}" alt="${ghost.name || '?'}" onerror="this.src='../testroom/art/timber.jpg'">` +
      `<div class="card-hp-badge">${hp} / ${maxHp}</div>`;
  }

  /** Render sideline-slot innerHTML. */
  function renderSidelineSlot(ghost) {
    if (!ghost) return '';
    const rarity = ghostRarity(ghost);
    const art = ghostArt(ghost);
    const hp = Math.max(0, ghost.hp || 0);
    const maxHp = Math.max(1, ghost.maxHp || 1);
    return `<div class="card-name-banner rarity-${rarity}">${ghost.name || '???'}</div>` +
      `<img class="card-img" src="${art}" alt="${ghost.name || '?'}" onerror="this.src='../testroom/art/timber.jpg'">` +
      `<div class="card-hp-badge">${hp} / ${maxHp}</div>`;
  }

  /** Render resource tiles HTML. */
  function renderResourceTiles(resources, committed, isMine, instanceId) {
    if (!resources) return '';

    const defs = [
      { key: 'fire',        icon: '\uD83D\uDD25', label: 'FIRE',    togglable: true  },
      { key: 'ice',         icon: '\u2744\uFE0F',  label: 'ICE',     togglable: true  },
      { key: 'surge',       icon: '\u26A1',        label: 'SURGE',   togglable: true  },
      { key: 'luckyStone',  icon: '\uD83C\uDF40',  label: 'LUCKY',   togglable: false },
      { key: 'healingSeed', icon: '\uD83C\uDF3F',  label: 'SEED',    togglable: false, action: 'heal' },
      { key: 'moonstone',   icon: '\uD83D\uDC8E',  label: 'MOON',    togglable: false },
      { key: 'firefly',     icon: '\uD83C\uDFEE',  label: 'FLY',     togglable: false },
    ];

    return defs.map(d => {
      const count = resources[d.key] || 0;
      if (count <= 0 && !d.togglable) return '';  // hide empty non-togglable resources
      const isCommitted = (committed && committed[d.key]) || false;
      const commitCls = isCommitted ? ' committed' : '';
      const canClick = isMine && count > 0 && (d.togglable || d.action);
      const clickCls = canClick ? ' clickable' : '';
      const dataAttr = d.togglable
        ? `data-action="commit" data-resource="${d.key}"`
        : d.action === 'heal'
          ? `data-action="heal"`
          : '';

      return `<div class="res-tile ${d.key}${commitCls}${clickCls}" ${dataAttr}>
        <span class="res-main">${d.icon}</span>
        <span class="res-count">${count}</span>
        <span class="res-label">${d.label}</span>
      </div>`;
    }).filter(Boolean).join('');
  }

  /** Render dice row HTML with match highlighting. */
  function renderDice(dice, team, isWinner) {
    if (!dice || dice.length === 0) return '';
    const counts = diceCounts(dice);
    return dice.map(d => {
      const n = counts[d] || 0;
      const teamCls = team === 'red' ? 'die-red' : 'die-blue';
      // Winner dice get gold locked class
      let matchCls = '';
      if (isWinner && n >= 2) matchCls = ' locked';
      // Loser dice recede
      let loserCls = '';
      if (!isWinner && isWinner !== null) loserCls = ' die-loser';
      return `<div class="die ${teamCls}${matchCls}${loserCls}">${d}</div>`;
    }).join('');
  }

  /** Update narrator text based on state. */
  function updateNarrator(state) {
    const el = document.getElementById('narrator');
    if (!el) return;

    const lastRoll = state.lastRoll;
    const phase = state.phase;

    if (phase === 'ko-swap') {
      const isMine = isMyTurn(state);
      if (isMine) {
        el.innerHTML = '<b class="ko-text">Your fighter was KO\'d!</b> Pick your next Spiritkin.';
      } else {
        const turnPlayer = (state.players || {})[state.turnPlayerIdx];
        el.innerHTML = `<b class="red-text">${turnPlayer ? turnPlayer.displayName : 'Player'}</b> is choosing a new fighter...`;
      }
      return;
    }

    if (lastRoll) {
      const turnPlayer = (state.players || {})[lastRoll.playerIdx];
      const playerName = turnPlayer ? turnPlayer.displayName : 'Player';
      const pResult = lastRoll.playerResult || {};
      const bResult = lastRoll.bossResult || {};
      const winner = lastRoll.winner;
      const finalDmg = lastRoll.finalDamage || 0;

      let text = '';
      if (winner === 'player') {
        text = `<b class="red-text">${playerName}</b> rolled ${pResult.type || 'singles'} ` +
          `and dealt <b class="gold">${finalDmg}</b> damage to the boss!`;
      } else if (winner === 'boss') {
        text = `The <b class="blue-text">Boss</b> rolled ${bResult.type || 'singles'} ` +
          `and dealt <b class="gold">${finalDmg}</b> damage!`;
      } else {
        text = `<b class="gold">TIE!</b> No damage dealt.`;
      }
      el.innerHTML = text;
      return;
    }

    // Default: show whose turn it is
    if (isMyTurn(state)) {
      el.innerHTML = '<b class="red-text">YOUR TURN</b> — Roll!';
    } else {
      const turnPlayer = (state.players || {})[state.turnPlayerIdx];
      el.innerHTML = `Watching <b class="red-text">${turnPlayer ? turnPlayer.displayName : 'Player'}</b>...`;
    }
  }

  /** Update battle log. */
  function updateBattleLog(log) {
    const el = document.getElementById('battleLog');
    if (!el) return;
    const entries = (log || []).slice(-30);
    el.innerHTML = entries.map(entry => {
      const text = typeof entry === 'string' ? entry : (entry.text || '');
      return `<div class="log-entry">${text}</div>`;
    }).join('');
    el.scrollTop = el.scrollHeight;
  }

  // ═══════════════════════════════════════════════════════════════
  // BUILD SKELETON — Only on first render
  // ═══════════════════════════════════════════════════════════════

  function buildSkeleton(container) {
    container.innerHTML = `
      <!-- Boss HP Pool Bar (raid-specific, uses existing rib- classes) -->
      <div class="rib-boss-pool" id="raid-boss-pool">
        <div class="rib-boss-pool-label" style="font-family:'Creepster',cursive;font-size:0.85rem;letter-spacing:2px;text-align:center;color:var(--text2,#a09686);margin-bottom:4px;">BOSS HP POOL</div>
        <div class="rib-boss-pool-bar" style="position:relative;width:100%;height:22px;background:#1a1228;border-radius:4px;overflow:hidden;border:1px solid var(--border,#2a2230);">
          <div class="rib-boss-pool-fill" id="raid-boss-fill" style="height:100%;border-radius:4px;transition:width 0.6s ease,background 0.4s ease;width:100%;background:#2ecc71;"></div>
          <div class="rib-boss-pool-text" id="raid-boss-text" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,0.8);letter-spacing:1px;">BOSS HP</div>
        </div>
      </div>

      <!-- Testroom Arena Board -->
      <div class="arena-board">
        <!-- RED Team (current turn player) -->
        <div class="team-column" id="red-team-column">
          <div class="team-battle-row">
            <div class="sideline-stack">
              <div id="red-sl-left" class="arena-card sideline-slot" style="visibility:hidden"></div>
              <div id="red-sl-right" class="arena-card sideline-slot" style="visibility:hidden"></div>
            </div>
            <div id="red-fighter" class="arena-card fighter-slot team-red"></div>
          </div>
          <div class="team-info">
            <div class="hp-bar-wrap"><div class="hp-bar team-red" id="red-hpBar" style="width:100%"></div></div>
            <div class="hp-text"><span class="hp-num" id="red-hpText"></span></div>
            <div class="resources" id="red-resources"></div>
          </div>
          <button class="action-btn roll-red team-roll" id="rollRedBtn" style="display:none">ROLL</button>
        </div>

        <!-- Center -->
        <div class="arena-center">
          <div class="turn-indicator" id="turnIndicator">Round 1</div>
          <div class="arena-mid">
            <div class="dice-stack">
              <div class="dice-row dice-red" id="red-dice"></div>
              <div class="dice-row dice-blue" id="blue-dice"></div>
            </div>
          </div>
        </div>

        <!-- BLUE Team (boss) -->
        <div class="team-column" id="blue-team-column">
          <div class="team-battle-row">
            <div id="blue-fighter" class="arena-card fighter-slot team-blue"></div>
            <div class="sideline-stack">
              <div id="blue-sl-left" class="arena-card sideline-slot" style="visibility:hidden"></div>
              <div id="blue-sl-right" class="arena-card sideline-slot" style="visibility:hidden"></div>
            </div>
          </div>
          <div class="team-info">
            <div class="hp-bar-wrap"><div class="hp-bar team-blue" id="blue-hpBar" style="width:100%"></div></div>
            <div class="hp-text"><span class="hp-num" id="blue-hpText"></span></div>
          </div>
        </div>
      </div>

      <div class="narrator-box">
        <div class="narrator-inner" id="narrator"></div>
      </div>
      <div class="log-wrap">
        <h4>Battle Log</h4>
        <div id="battleLog"></div>
      </div>

      <!-- Game Over Overlay (hidden, shown when phase=game-over) -->
      <div id="raid-gameover" class="rib-game-over" style="display:none"></div>
    `;
    _skeletonBuilt = true;
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER — Called on every Firebase state update
  // ═══════════════════════════════════════════════════════════════

  window.renderInlineBattle = function (state, instanceId) {
    const container = document.getElementById('raid-screen');
    if (!container || !state) return;

    // Build skeleton on first call
    if (!_skeletonBuilt || !container.querySelector('.arena-board')) {
      buildSkeleton(container);
    }

    // ── Game Over ──
    if (state.phase === 'game-over') {
      renderGameOver(state, instanceId);
      return;
    }

    // Hide game-over overlay if not game-over
    const goEl = document.getElementById('raid-gameover');
    if (goEl) goEl.style.display = 'none';

    // ── Resolve turn player and boss ──
    const players = state.players || {};
    const turnIdx = state.turnPlayerIdx;
    const turnPlayer = players[turnIdx];
    const boss = state.boss || {};
    const bossGhost = (boss.ghosts || [])[boss.activeIdx] || {};
    const playerGhost = turnPlayer ? (turnPlayer.ghosts || [])[turnPlayer.activeIdx] || {} : {};
    const mine = isMyTurn(state);
    const myIdx = myPlayerIdx(state);

    // ── Boss HP Pool ──
    const bossHp = Math.max(0, state.bossHp || 0);
    const bossMax = Math.max(1, state.bossMaxHp || 1);
    const bossPct = Math.min(100, (bossHp / bossMax) * 100);
    const fillEl = document.getElementById('raid-boss-fill');
    const textEl = document.getElementById('raid-boss-text');
    if (fillEl) {
      fillEl.style.width = bossPct + '%';
      fillEl.style.background = poolColor(bossHp, bossMax);
    }
    if (textEl) textEl.textContent = `BOSS HP: ${bossHp} / ${bossMax}`;

    // ── Red Fighter (turn player's active ghost) ──
    const redFighter = document.getElementById('red-fighter');
    if (redFighter) {
      const rarity = ghostRarity(playerGhost);
      redFighter.className = `arena-card fighter-slot team-red rarity-${rarity}`;
      if (playerGhost.ko || (playerGhost.hp || 0) <= 0) redFighter.classList.add('ko');
      redFighter.innerHTML = renderFighterSlot(playerGhost, 'red');
    }

    // ── Blue Fighter (boss active ghost) ──
    const blueFighter = document.getElementById('blue-fighter');
    if (blueFighter) {
      const rarity = ghostRarity(bossGhost);
      blueFighter.className = `arena-card fighter-slot team-blue rarity-${rarity}`;
      if (bossGhost.ko || (bossGhost.hp || 0) <= 0) blueFighter.classList.add('ko');
      blueFighter.innerHTML = renderFighterSlot(bossGhost, 'blue');
    }

    // ── Red HP Bar (turn player's active ghost HP) ──
    const redHpBar = document.getElementById('red-hpBar');
    const redHpText = document.getElementById('red-hpText');
    if (redHpBar && playerGhost.maxHp) {
      const hp = Math.max(0, playerGhost.hp || 0);
      const maxHp = playerGhost.maxHp || 1;
      const pct = Math.min(100, (hp / maxHp) * 100);
      redHpBar.style.width = pct + '%';
      redHpBar.className = 'hp-bar team-red ' + hpBarClass(hp, maxHp);
    }
    if (redHpText) {
      redHpText.textContent = `${Math.max(0, playerGhost.hp || 0)} / ${playerGhost.maxHp || 0}`;
    }

    // ── Blue HP Bar (boss active ghost HP) ──
    const blueHpBar = document.getElementById('blue-hpBar');
    const blueHpText = document.getElementById('blue-hpText');
    if (blueHpBar && bossGhost.maxHp) {
      const hp = Math.max(0, bossGhost.hp || 0);
      const maxHp = bossGhost.maxHp || 1;
      const pct = Math.min(100, (hp / maxHp) * 100);
      blueHpBar.style.width = pct + '%';
      blueHpBar.className = 'hp-bar team-blue ' + hpBarClass(hp, maxHp);
    }
    if (blueHpText) {
      blueHpText.textContent = `${Math.max(0, bossGhost.hp || 0)} / ${bossGhost.maxHp || 0}`;
    }

    // ── Red Sideline (turn player's sideline ghosts) ──
    const redSlLeft = document.getElementById('red-sl-left');
    const redSlRight = document.getElementById('red-sl-right');
    if (turnPlayer) {
      const sideline = (turnPlayer.ghosts || [])
        .map((g, i) => ({ ...g, origIdx: i }))
        .filter((g, i) => i !== turnPlayer.activeIdx);
      const isKoSwap = state.phase === 'ko-swap' && mine;

      [redSlLeft, redSlRight].forEach((slot, i) => {
        const ghost = sideline[i];
        if (ghost && !ghost.ko && (ghost.hp || 0) > 0) {
          slot.style.visibility = 'visible';
          const rarity = ghostRarity(ghost);
          slot.className = `arena-card sideline-slot rarity-${rarity}`;
          slot.innerHTML = renderSidelineSlot(ghost);
          // KO swap: make alive sideline ghosts clickable
          if (isKoSwap) {
            slot.classList.add('ko-swap-pick');
            slot.onclick = function () {
              if (typeof doKoSwap === 'function') doKoSwap(instanceId, myIdx, ghost.origIdx);
            };
          } else {
            slot.classList.remove('ko-swap-pick');
            slot.onclick = null;
          }
        } else if (ghost && (ghost.ko || (ghost.hp || 0) <= 0)) {
          slot.style.visibility = 'visible';
          slot.className = 'arena-card sideline-slot ko';
          slot.innerHTML = renderSidelineSlot(ghost);
          slot.onclick = null;
        } else {
          slot.style.visibility = 'hidden';
          slot.innerHTML = '';
          slot.onclick = null;
        }
      });
    }

    // ── Blue Sideline (boss minions if any) ──
    const blueSlLeft = document.getElementById('blue-sl-left');
    const blueSlRight = document.getElementById('blue-sl-right');
    if (boss.ghosts) {
      const bossSideline = (boss.ghosts || [])
        .filter((g, i) => i !== boss.activeIdx);
      [blueSlLeft, blueSlRight].forEach((slot, i) => {
        const ghost = bossSideline[i];
        if (ghost && !ghost.ko && (ghost.hp || 0) > 0) {
          slot.style.visibility = 'visible';
          const rarity = ghostRarity(ghost);
          slot.className = `arena-card sideline-slot rarity-${rarity}`;
          slot.innerHTML = renderSidelineSlot(ghost);
        } else if (ghost && (ghost.ko || (ghost.hp || 0) <= 0)) {
          slot.style.visibility = 'visible';
          slot.className = 'arena-card sideline-slot ko';
          slot.innerHTML = renderSidelineSlot(ghost);
        } else {
          slot.style.visibility = 'hidden';
          slot.innerHTML = '';
        }
      });
    }

    // ── Resources — hidden for raids (V1: just roll, no resource management) ──
    const resEl = document.getElementById('red-resources');
    if (resEl) resEl.style.display = 'none';

    // ── Dice Display (with animation) ──
    const redDiceEl = document.getElementById('red-dice');
    const blueDiceEl = document.getElementById('blue-dice');
    const lastRoll = state.lastRoll;
    if (lastRoll && redDiceEl && blueDiceEl) {
      const pDice = lastRoll.playerDice || [];
      const bDice = lastRoll.bossDice || [];
      const winner = lastRoll.winner;
      // Detect new roll — animate only once per roll
      const rollKey = pDice.join(',') + '|' + bDice.join(',');
      if (rollKey !== window._lastRollKey) {
        window._lastRollKey = rollKey;
        // Animate: tumble → land → highlight
        animateDiceRoll(pDice, bDice, () => {
          redDiceEl.innerHTML = renderDice(pDice, 'red', winner === 'player');
          blueDiceEl.innerHTML = renderDice(bDice, 'blue', winner === 'boss');
        });
      }
    } else if (redDiceEl && blueDiceEl) {
      redDiceEl.innerHTML = '';
      blueDiceEl.innerHTML = '';
      window._lastRollKey = null;
    }

    // ── Turn Indicator ──
    const turnEl = document.getElementById('turnIndicator');
    if (turnEl) {
      if (mine) {
        turnEl.innerHTML = `<span style="color:var(--gold-bright,#f0c560)">YOUR TURN</span> \u2014 Round ${state.round || 1}`;
      } else {
        const name = turnPlayer ? turnPlayer.displayName : 'Player';
        turnEl.innerHTML = `Watching ${name}... \u2014 Round ${state.round || 1}`;
      }
    }

    // ── Roll Button ──
    const rollBtn = document.getElementById('rollRedBtn');
    if (rollBtn) {
      if (mine && state.phase === 'pre-roll') {
        rollBtn.style.display = '';
        rollBtn.disabled = false;
        // Remove old listener and re-bind
        rollBtn.onclick = function () {
          rollBtn.disabled = true;
          if (typeof doPlayerRoll === 'function') doPlayerRoll(instanceId);
        };
      } else {
        rollBtn.style.display = 'none';
      }
    }

    // ── Narrator ──
    updateNarrator(state);

    // ── Battle Log ──
    updateBattleLog(state.log);

    _lastPhase = state.phase;
    _lastRound = state.round;
  };

  // ═══════════════════════════════════════════════════════════════
  // GAME OVER
  // ═══════════════════════════════════════════════════════════════

  function renderGameOver(state, instanceId) {
    const goEl = document.getElementById('raid-gameover');
    if (!goEl) return;

    const bossHp = state.bossHp || 0;
    const victory = bossHp <= 0;
    const players = state.players || {};
    const user = firebase.auth().currentUser;

    // Damage summary
    const sorted = Object.entries(players)
      .map(([idx, p]) => ({ idx: parseInt(idx), ...p }))
      .sort((a, b) => (b.damageDealt || 0) - (a.damageDealt || 0));

    const rows = sorted.map(p => {
      const isMe = p.uid === user?.uid;
      return `<div class="rib-game-over-player" style="${isMe ? 'border-left:3px solid var(--gold-bright,#f0c560);' : ''}">
        <div class="name">${p.displayName || 'Player'}${isMe ? ' (you)' : ''}</div>
        <div class="dmg">${p.damageDealt || 0}</div>
        <div class="dmg-label">damage dealt</div>
      </div>`;
    }).join('');

    goEl.className = 'rib-game-over ' + (victory ? 'victory' : 'defeat');
    goEl.style.display = '';
    goEl.innerHTML = `
      <h1>${victory ? 'BOSS DEFEATED!' : 'RAID FAILED'}</h1>
      <p style="color:var(--text2,#a09686);font-size:0.9rem;margin:8px 0 16px;">
        ${victory ? 'The Spiritkin prevail!' : 'Boss survived with ' + bossHp + ' HP remaining.'}
      </p>
      <div class="rib-game-over-stats">${rows}</div>
      <button class="action-btn roll-red team-roll" id="raid-return-btn" style="margin-top:16px;">RETURN TO LOBBY</button>
    `;

    // Bind return button
    const returnBtn = document.getElementById('raid-return-btn');
    if (returnBtn) {
      returnBtn.onclick = function () {
        if (typeof closeRaidResult === 'function') closeRaidResult();
        else {
          const screen = document.getElementById('raid-screen');
          if (screen) screen.style.display = 'none';
        }
      };
    }

    // Victory confetti
    if (victory) {
      setTimeout(fireConfetti, 300);
    }

    // Hide the arena board
    const arena = container.querySelector('.arena-board');
    // Actually, show it dimmed behind the overlay for drama
  }

  // ═══════════════════════════════════════════════════════════════
  // DICE ROLL ANIMATION
  // ═══════════════════════════════════════════════════════════════

  let _animatingDice = false;

  window.animateDiceRoll = function (playerDice, bossDice, callback) {
    if (_animatingDice) { if (callback) callback(); return; }
    _animatingDice = true;

    const redDiceEl = document.getElementById('red-dice');
    const blueDiceEl = document.getElementById('blue-dice');
    if (!redDiceEl || !blueDiceEl) { _animatingDice = false; if (callback) callback(); return; }

    // Phase 1: Show rolling placeholders
    const buildRolling = (count, team) => Array.from({ length: count }, () =>
      `<div class="die die-${team} rolling">?</div>`
    ).join('');

    redDiceEl.innerHTML = buildRolling(playerDice.length, 'red');
    blueDiceEl.innerHTML = buildRolling(bossDice.length, 'blue');

    // Phase 2: Rapid random faces
    const randomInterval = setInterval(() => {
      redDiceEl.querySelectorAll('.die.rolling').forEach(el => {
        el.textContent = Math.floor(Math.random() * 6) + 1;
      });
      blueDiceEl.querySelectorAll('.die.rolling').forEach(el => {
        el.textContent = Math.floor(Math.random() * 6) + 1;
      });
    }, 70);

    // Phase 3: Land on final values (staggered, like testroom)
    setTimeout(() => {
      clearInterval(randomInterval);

      // Land red dice first
      playerDice.forEach((val, i) => {
        const dieEl = redDiceEl.querySelectorAll('.die')[i];
        if (dieEl) {
          setTimeout(() => {
            dieEl.classList.remove('rolling');
            dieEl.textContent = val;
          }, i * 100);
        }
      });

      // Land blue dice after a beat
      setTimeout(() => {
        bossDice.forEach((val, i) => {
          const dieEl = blueDiceEl.querySelectorAll('.die')[i];
          if (dieEl) {
            setTimeout(() => {
              dieEl.classList.remove('rolling');
              dieEl.textContent = val;
            }, i * 100);
          }
        });
      }, 200);

      // Phase 4: Highlight winners after all dice land
      const totalLandTime = 200 + bossDice.length * 100 + 300;
      setTimeout(() => {
        redDiceEl.innerHTML = renderDice(playerDice, 'red', true);
        blueDiceEl.innerHTML = renderDice(bossDice, 'blue', true);
        _animatingDice = false;
        if (callback) setTimeout(callback, 300);
      }, totalLandTime);
    }, 700);
  };

  // ═══════════════════════════════════════════════════════════════
  // DAMAGE CALLOUT ANIMATION
  // ═══════════════════════════════════════════════════════════════

  window.animateDamageCallout = function (damage, target) {
    const fighterEl = document.getElementById(target === 'boss' ? 'blue-fighter' : 'red-fighter');
    if (!fighterEl) return;

    // Add hit shake
    fighterEl.classList.add('hit');
    setTimeout(() => fighterEl.classList.remove('hit'), 500);

    // Pop damage number
    const callout = document.createElement('div');
    callout.className = 'damage-callout dmg';
    callout.textContent = '-' + damage;
    callout.style.top = '30%';
    callout.style.left = '50%';
    callout.style.transform = 'translateX(-50%)';
    fighterEl.appendChild(callout);
    setTimeout(() => callout.remove(), 850);
  };

  // ═══════════════════════════════════════════════════════════════
  // CONFETTI (victory)
  // ═══════════════════════════════════════════════════════════════

  function fireConfetti() {
    const canvas = document.createElement('canvas');
    canvas.className = 'raid-confetti-canvas';
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

  // ═══════════════════════════════════════════════════════════════
  // LEGACY EXPORTS (for raid-battle-inline.js shims)
  // ═══════════════════════════════════════════════════════════════

  window.renderBossHpBar = function (bossHp, bossMaxHp) {
    // Update in-place if skeleton exists
    const fillEl = document.getElementById('raid-boss-fill');
    const textEl = document.getElementById('raid-boss-text');
    if (fillEl && textEl) {
      const hp = Math.max(0, bossHp || 0);
      const max = Math.max(1, bossMaxHp || 1);
      const pct = Math.min(100, (hp / max) * 100);
      fillEl.style.width = pct + '%';
      fillEl.style.background = poolColor(hp, max);
      textEl.textContent = `BOSS HP: ${hp} / ${max}`;
    }
  };

  window.renderFighterCard = function (ghost, team) {
    return renderFighterSlot(ghost, team);
  };

  window.renderDiceDisplay = function (dice, result, side) {
    const isWinner = result && result.winner;
    return renderDice(dice, side === 'boss' ? 'blue' : 'red', isWinner);
  };

  window.renderResourceBar = function (resources, committed, isActive, instanceId) {
    return renderResourceTiles(resources, committed, isActive, instanceId);
  };

  window.renderTurnIndicator = function (state) {
    const turnEl = document.getElementById('turnIndicator');
    if (turnEl && state) {
      const mine = isMyTurn(state);
      if (mine) {
        turnEl.innerHTML = `<span style="color:var(--gold-bright,#f0c560)">YOUR TURN</span> \u2014 Round ${state.round || 1}`;
      } else {
        const turnPlayer = (state.players || {})[state.turnPlayerIdx];
        const name = turnPlayer ? turnPlayer.displayName : 'Player';
        turnEl.innerHTML = `Watching ${name}... \u2014 Round ${state.round || 1}`;
      }
    }
  };

  window.renderBattleLog = function (log) {
    updateBattleLog(log);
  };

  window.renderSidelineGhosts = function () {
    // Sideline rendering is now handled inline by the main render function
  };

  window.renderKoSwapPicker = function () {
    // KO swap is now handled inline via ko-swap-pick class on sideline slots
  };

  window.renderGameOver = function (state, instanceId) {
    renderGameOver(state, instanceId);
  };

})();
