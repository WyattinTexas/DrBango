// ════════════════════════════════════════════════════════════════════
// PORTRAIT BATTLE SKIN (model_c) — Phase 1 shell
//
// Self-contained observer skin over the real battle engine. Creates its
// own DOM + CSS, mirrors battle state (B) into a model_a-style portrait
// view, and proxies clicks to the REAL engine controls hidden offscreen.
// ZERO edits to battle-engine.js / raid-battle-bridge.js — hooks are
// function wraps + a MutationObserver, so beta→model_c ports stay clean.
//
// Phase 1 scope: portrait frame, boss/player HP plates, placeholder
// sprites, narrator mirror, flat dice mirror, team cards (active card
// raised), ROLL proxy, KO-pick proxy. Phase 2 adds 3D dice, ability
// popups, damage FX.
// ════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // battle-engine.js overrides document.getElementById to return a hidden
  // dummy div for ANY missing id (multiplayer resilience). Truthiness checks
  // are therefore unreliable — use querySelector, which is NOT overridden.
  const $pb = (id) => document.querySelector('#' + id);

  const PB_ASSETS = 'assets/';
  // Placeholder sprites (Wyatt 2026-06-11: use these 4 until real art)
  const PLAYER_BACKS = [PB_ASSETS + 'Back_Gary.png', PB_ASSETS + 'Back_Shoo.png', PB_ASSETS + 'Back_Scallywags.png'];
  const BOSS_FRONT = PB_ASSETS + 'Front_Kodako.png';
  // Solo layout positions (model_a tuned values, 430px frame)
  const SOLO_POS = [{ x: 172, y: 389 }, { x: 106, y: 454 }, { x: 273, y: 455 }]; // active, sl-left, sl-right
  const BOSS_POS = { x: 176, y: 129 };

  let pbActive = false;
  let pbTimer = null;

  // ── CSS ──────────────────────────────────────────────────────────
  const css = `
#portrait-battle{position:fixed;inset:0;z-index:9400;display:none;background:#000;}
#portrait-battle.pb-show{display:block;}
#portrait-battle *{margin:0;padding:0;box-sizing:border-box;}
.pb-app{position:relative;width:100%;max-width:430px;height:100%;margin:0 auto;overflow:hidden;
  font-family:'Segoe UI',system-ui,sans-serif;color:#fff;display:flex;flex-direction:column;
  -webkit-user-select:none;user-select:none;}
.pb-arena-bg{position:absolute;inset:0;z-index:0;background:url('${PB_ASSETS}arena_bg.png') center center / cover no-repeat;}
.pb-arena-bg::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.4) 100%);}

/* HP plates (model_a style, pb- namespaced) */
.pb-plate{position:relative;z-index:10;height:80px;flex-shrink:0;}
.pb-plate-img{position:absolute;height:80px;width:auto;pointer-events:none;z-index:1;}
.pb-plate .pb-name{position:absolute;font-family:'Bangers',cursive;font-size:14px;letter-spacing:2px;
  color:#fff;text-shadow:0 1px 4px rgba(0,0,0,.9);z-index:3;white-space:nowrap;width:100px;top:23px;text-align:center;}
.pb-plate .pb-track{position:absolute;height:7px;overflow:hidden;background:transparent;z-index:3;width:82px;top:50px;
  clip-path:polygon(6px 0%, calc(100% - 3px) 0%, 100% 50%, calc(100% - 3px) 100%, 6px 100%, 0% 50%);}
.pb-plate .pb-hptext{position:absolute;font-family:'Bangers',cursive;font-size:11px;color:#fff;
  text-shadow:0 1px 3px #000;z-index:4;letter-spacing:1px;width:100px;top:48px;text-align:center;}
.pb-enemy-plate .pb-plate-img{right:-5px;top:0;transform:scaleX(-1);}
.pb-enemy-plate .pb-name{right:60px;}
.pb-enemy-plate .pb-track{right:67px;}
.pb-enemy-plate .pb-hptext{right:60px;}
.pb-player-plate .pb-plate-img{left:-5px;top:0;}
.pb-player-plate .pb-name{left:60px;}
.pb-player-plate .pb-track{left:67px;}
.pb-player-plate .pb-hptext{left:60px;}
.pb-fill{height:100%;transition:width .5s ease;background:linear-gradient(90deg,#22c55e,#4ade80);
  clip-path:polygon(6px 0%, calc(100% - 3px) 0%, 100% 50%, calc(100% - 3px) 100%, 6px 100%, 0% 50%);}
.pb-fill.mid{background:linear-gradient(90deg,#eab308,#facc15);}
.pb-fill.low{background:linear-gradient(90deg,#dc2626,#f87171);animation:pbHpPulse 1.5s ease-in-out infinite;}
@keyframes pbHpPulse{0%,100%{box-shadow:0 0 4px rgba(239,68,68,.4)}50%{box-shadow:0 0 12px rgba(239,68,68,.8)}}

/* Sprite field */
.pb-field{flex:1;position:relative;z-index:5;min-height:0;}
.pb-sprite{position:absolute;height:100px;width:auto;z-index:3;filter:drop-shadow(0 4px 10px rgba(0,0,0,.6));transition:all .3s;}
.pb-sprite.pb-active{height:125px;filter:drop-shadow(0 4px 10px rgba(0,0,0,.6)) drop-shadow(0 0 10px rgba(79,195,247,.5));}
.pb-sprite.pb-dead{opacity:.25;filter:grayscale(1);}
.pb-sprite.pb-boss{height:112px;}
/* floating HP bars for teammate sprites (multi-player, Phase 3) */
.pb-minihp{position:absolute;width:64px;height:6px;background:rgba(0,0,0,.6);border-radius:3px;z-index:4;overflow:hidden;}
.pb-minihp>div{height:100%;background:linear-gradient(90deg,#22c55e,#4ade80);transition:width .4s;}

/* Dice mirror (flat, Phase 1 — Phase 2 brings 3D) */
.pb-dice{position:absolute;left:0;right:0;top:34%;z-index:8;display:flex;flex-direction:column;gap:10px;align-items:center;pointer-events:none;}
.pb-dice-row{display:flex;gap:8px;min-height:34px;}
.pb-die{width:34px;height:34px;border-radius:7px;display:flex;align-items:center;justify-content:center;
  font-family:'Bangers',cursive;font-size:20px;color:#3a1f08;
  background:linear-gradient(165deg,#f4ecd8 0%,#e8dcb8 35%,#d8c894 70%,#b8a878 100%);
  border:1px solid rgba(120,80,30,0.5);box-shadow:inset 0 -2px 4px rgba(120,80,30,0.25);}
.pb-die.pb-blue{background:linear-gradient(165deg,#dcf0fc 0%,#a8d8ee 35%,#78a0c4 70%,#406088 100%);color:#0a3050;}

/* Bottom area */
.pb-bottom{position:relative;z-index:10;padding:0 0 8px;flex-shrink:0;
  background:linear-gradient(transparent,rgba(0,0,0,.4) 30%,rgba(0,0,0,.6));}
.pb-narrator{background:rgba(0,0,0,.7);border-radius:8px;padding:8px 12px;margin:6px 10px;font-size:13px;color:#ccc;
  text-align:center;min-height:32px;display:flex;align-items:center;justify-content:center;
  border:1px solid rgba(255,255,255,.05);}
.pb-narrator b{color:#ffd54f;padding:0 2px;}
.pb-cards{display:flex;gap:6px;padding:6px 10px 4px;align-items:flex-end;}
.pb-card{width:0;flex:1;aspect-ratio:2.5/3.5;border-radius:6px;overflow:hidden;border:2px solid rgba(255,255,255,.12);
  object-fit:cover;box-shadow:0 2px 8px rgba(0,0,0,.3);transition:all .25s;cursor:pointer;}
.pb-card.pb-active{border-color:#4fc3f7;box-shadow:0 0 12px rgba(79,195,247,.3);transform:translateY(-10px);}
.pb-card.pb-dead{opacity:.3;filter:grayscale(1);}
.pb-roll-wrap{display:flex;justify-content:center;padding:2px 10px 6px;}
.pb-roll{font-family:'Bangers',cursive;font-size:20px;letter-spacing:2px;padding:10px 44px;border:3px solid #7c3aed;
  border-radius:50px;background:linear-gradient(135deg,#4c1d95,#7c3aed);color:#fff;cursor:pointer;
  box-shadow:0 0 20px rgba(124,58,237,.4);}
.pb-roll:not(:disabled){animation:pbBtnPulse 1.2s ease-in-out infinite;}
.pb-roll:disabled{opacity:.35;animation:none;}
.pb-roll:active{transform:scale(.93);}
@keyframes pbBtnPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}

.pb-leave{position:absolute;top:6px;right:6px;z-index:60;font-size:10px;padding:4px 10px;border-radius:4px;
  background:rgba(180,40,40,.75);color:#fff;border:1px solid rgba(255,255,255,.25);cursor:pointer;
  font-family:'Bangers',cursive;letter-spacing:1px;}

/* dev toggle back to landscape */
.pb-dev-toggle{position:absolute;top:6px;left:6px;z-index:60;font-size:10px;padding:3px 8px;border-radius:4px;
  background:rgba(124,58,237,.5);color:#fff;border:none;cursor:pointer;opacity:.5;}

/* battle-view offscreen parking: keeps layout alive for engine measurements */
.pb-offscreen{position:fixed !important;left:-10000px !important;top:0 !important;width:1280px !important;
  visibility:hidden !important;pointer-events:none !important;}
.pb-offscreen.pb-peek{left:0 !important;visibility:visible !important;pointer-events:auto !important;
  z-index:200 !important;background:#0a0a14;}
`;

  // ── DOM ──────────────────────────────────────────────────────────
  function buildDom() {
    if ($pb('portrait-battle')) return;
    const style = document.createElement('style');
    style.id = 'pb-style';
    style.textContent = css;
    document.head.appendChild(style);
    // Bangers font (model_a typography)
    if (!document.querySelector('link[href*="Bangers"]')) {
      const f = document.createElement('link');
      f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Bangers&display=swap';
      document.head.appendChild(f);
    }
    const root = document.createElement('div');
    root.id = 'portrait-battle';
    root.innerHTML = `
  <div class="pb-app">
    <div class="pb-arena-bg"></div>
    <button class="pb-dev-toggle" onclick="pbPeekLandscape()">dev: landscape</button>
    <button class="pb-leave" onclick="pbLeaveRaid()">LEAVE RAID</button>
    <div class="pb-plate pb-enemy-plate">
      <img class="pb-plate-img" src="${PB_ASSETS}DarkGary_Health_UI.png" alt="">
      <div class="pb-name" id="pb-enemy-name"></div>
      <div class="pb-track"><div class="pb-fill" id="pb-enemy-fill" style="width:100%"></div></div>
      <div class="pb-hptext" id="pb-enemy-hptext"></div>
    </div>
    <div class="pb-field" id="pb-field"></div>
    <div class="pb-dice">
      <div class="pb-dice-row" id="pb-dice-blue"></div>
      <div class="pb-dice-row" id="pb-dice-red"></div>
    </div>
    <div class="pb-bottom">
      <div class="pb-plate pb-player-plate">
        <img class="pb-plate-img" src="${PB_ASSETS}hp_ui.png" alt="">
        <div class="pb-name" id="pb-player-name"></div>
        <div class="pb-track"><div class="pb-fill" id="pb-player-fill" style="width:100%"></div></div>
        <div class="pb-hptext" id="pb-player-hptext"></div>
      </div>
      <div class="pb-narrator" id="pb-narrator">…</div>
      <div class="pb-cards" id="pb-cards"></div>
      <div class="pb-roll-wrap"><button class="pb-roll" id="pb-roll" onclick="pbRollClick()">ROLL</button></div>
    </div>
  </div>`;
    // Mount INSIDE #raid-screen: it is a z=9000 stacking context holding the
    // battle bg AND the ability modals (.selene-overlay, local z=9500). As a
    // child at local z=9400 we cover the landscape HUD but stay under modals.
    (document.querySelector('#raid-screen') || document.body).appendChild(root);
  }

  // ── STATE HELPERS (read-only views over engine state) ────────────
  function safeActive(team) {
    try { if (typeof active === 'function') return active(team); } catch (e) {}
    return (team.ghosts || []).find(g => !g.ko) || (team.ghosts || [])[0];
  }
  function battleReady() {
    return typeof B !== 'undefined' && B && B.red && B.blue && B.red.ghosts && B.blue.ghosts;
  }

  // ── RENDER ───────────────────────────────────────────────────────
  function setPlate(prefix, ghost) {
    const fill = $pb('pb-' + prefix + '-fill');
    const name = $pb('pb-' + prefix + '-name');
    const hptext = $pb('pb-' + prefix + '-hptext');
    if (!ghost || !fill) return;
    const pct = Math.max(0, Math.min(100, (ghost.hp / (ghost.maxHp || 1)) * 100));
    fill.style.width = pct + '%';
    fill.className = 'pb-fill' + (pct <= 25 ? ' low' : pct <= 50 ? ' mid' : '');
    name.textContent = ghost.name || '';
    hptext.textContent = Math.max(0, ghost.hp) + '/' + (ghost.maxHp || '?');
  }

  function renderSprites() {
    const field = $pb('pb-field');
    if (!field) return;
    field.innerHTML = '';
    const act = safeActive(B.red);
    // order team: active first then others (matches SOLO_POS slots)
    const ordered = [act].concat(B.red.ghosts.filter(g => g !== act));
    ordered.forEach((g, i) => {
      if (!g || i > 2) return;
      const img = document.createElement('img');
      img.className = 'pb-sprite' + (g === act ? ' pb-active' : '') + (g.ko ? ' pb-dead' : '');
      img.src = PLAYER_BACKS[i % PLAYER_BACKS.length];
      img.alt = g.name;
      const pos = SOLO_POS[i];
      img.style.left = pos.x + 'px';
      img.style.top = pos.y + 'px';
      field.appendChild(img);
    });
    const boss = safeActive(B.blue);
    if (boss) {
      const img = document.createElement('img');
      img.className = 'pb-sprite pb-boss' + (boss.ko ? ' pb-dead' : '');
      img.src = BOSS_FRONT;
      img.alt = boss.name;
      img.style.left = BOSS_POS.x + 'px';
      img.style.top = BOSS_POS.y + 'px';
      field.appendChild(img);
    }
  }

  function renderDice() {
    const redRow = $pb('pb-dice-red');
    const blueRow = $pb('pb-dice-blue');
    if (!redRow) return;
    const pr = (B.preRoll || {});
    const draw = (row, dice, blue) => {
      row.innerHTML = '';
      (dice || []).forEach(v => {
        const d = document.createElement('div');
        d.className = 'pb-die' + (blue ? ' pb-blue' : '');
        d.textContent = v;
        row.appendChild(d);
      });
    };
    draw(redRow, pr.red && pr.red.dice, false);
    draw(blueRow, pr.blue && pr.blue.dice, true);
  }

  function renderCards() {
    const wrap = $pb('pb-cards');
    if (!wrap) return;
    const act = safeActive(B.red);
    wrap.innerHTML = '';
    B.red.ghosts.slice(0, 3).forEach(g => {
      const img = document.createElement('img');
      img.className = 'pb-card' + (g === act ? ' pb-active' : '') + (g.ko ? ' pb-dead' : '');
      img.src = g.art || '';
      img.alt = g.name;
      // KO-pick proxy: clicking a portrait card clicks the matching hidden
      // arena card in #battle-view (sideline slots are the engine's picker).
      img.onclick = function () { pbProxyCardClick(g.name); };
      wrap.appendChild(img);
    });
  }

  function renderNarrator() {
    const src = document.querySelector('#battle-view .narrator-box') || document.querySelector('.narrator-box');
    const dst = $pb('pb-narrator');
    if (src && dst && dst.innerHTML !== src.innerHTML) dst.innerHTML = src.innerHTML;
  }

  function renderRollBtn() {
    const real = $pb('rollRedBtn');
    const mine = $pb('pb-roll');
    if (!real || !mine) return;
    const visible = real.offsetParent !== null || (real.style.display !== 'none' && !real.hidden);
    mine.textContent = (real.textContent || 'ROLL').trim().toUpperCase() || 'ROLL';
    mine.disabled = real.disabled || !visible;
  }

  function renderPortrait() {
    if (!pbActive || !battleReady()) return;
    setPlate('enemy', safeActive(B.blue));
    setPlate('player', safeActive(B.red));
    renderSprites();
    renderDice();
    renderCards();
    renderNarrator();
    renderRollBtn();
  }

  // ── PROXIES ──────────────────────────────────────────────────────
  window.pbRollClick = function () {
    const real = $pb('rollRedBtn');
    if (real && !real.disabled) real.click();
  };
  window.pbProxyCardClick = function (ghostName) {
    // engine KO picker = clicking sideline slot cards inside #battle-view
    const slots = document.querySelectorAll('#red-sl-left, #red-sl-right, #red-fighter');
    for (const slot of slots) {
      if (slot.textContent.indexOf(ghostName) >= 0) { slot.click(); return; }
    }
  };
  window.pbLeaveRaid = function () {
    if (typeof leaveRaid === 'function') { leaveRaid(); return; }
    var b = document.querySelector('#raid-leave-btn') || document.querySelector('#leaveRaidBtn');
    if (b) b.click();
  };
  window.pbPeekLandscape = function () {
    const bv = $pb('battle-view');
    if (bv) bv.classList.toggle('pb-peek');
  };

  // ── ENTER / EXIT ─────────────────────────────────────────────────
  window.enterPortraitBattle = function () {
    buildDom();
    const bv = $pb('battle-view');
    if (bv) bv.classList.add('pb-offscreen');
    $pb('portrait-battle').classList.add('pb-show');
    pbActive = true;
    if (pbTimer) clearInterval(pbTimer);
    pbTimer = setInterval(renderPortrait, 400); // safety mirror; renderBattle wrap is primary
    renderPortrait();
  };
  window.exitPortraitBattle = function () {
    pbActive = false;
    if (pbTimer) { clearInterval(pbTimer); pbTimer = null; }
    const bv = $pb('battle-view');
    if (bv) bv.classList.remove('pb-offscreen', 'pb-peek');
    const pb = $pb('portrait-battle');
    if (pb) pb.classList.remove('pb-show');
  };

  // ── HOOKS (function wraps — no ported-file edits) ────────────────
  function installHooks() {
    // 1. Raid battle starts → enter portrait
    if (typeof window.initRaidBattleInPage === 'function' && !window.initRaidBattleInPage._pbWrapped) {
      const orig = window.initRaidBattleInPage;
      const wrapped = function () {
        const r = orig.apply(this, arguments);
        try { enterPortraitBattle(); } catch (e) { console.error('[pb] enter failed', e); }
        return r;
      };
      wrapped._pbWrapped = true;
      window.initRaidBattleInPage = wrapped;
    }
    // 2. Engine re-render → mirror portrait
    if (typeof window.renderBattle === 'function' && !window.renderBattle._pbWrapped) {
      const orig = window.renderBattle;
      const wrapped = function () {
        const r = orig.apply(this, arguments);
        if (pbActive) { try { renderPortrait(); } catch (e) {} }
        return r;
      };
      wrapped._pbWrapped = true;
      window.renderBattle = wrapped;
    }
    // 3. Raid over → bridge hides #battle-view → exit portrait
    const bv = $pb('battle-view');
    if (bv && !bv._pbObserved) {
      bv._pbObserved = true;
      new MutationObserver(() => {
        if (pbActive && bv.style.display === 'none') exitPortraitBattle();
      }).observe(bv, { attributes: true, attributeFilter: ['style'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installHooks);
  } else {
    installHooks();
  }
})();
