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
#portrait-battle{position:fixed;inset:0;z-index:8999;display:none;background:#000;}
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

/* 3D dice arena (ported from model_a) */
#pb-dice3d{position:absolute;top:12%;left:5%;width:90%;height:48%;z-index:20;pointer-events:none;overflow:hidden;}
#pb-dice3d-overlay{position:absolute;top:27%;left:0;width:100%;height:23%;z-index:1;
  background:rgba(0,0,0,.35);backdrop-filter:blur(2px);}
#portrait-battle .die-physics{position:absolute;z-index:10;perspective:350px;pointer-events:none;}
#portrait-battle .die-cube{width:100%;height:100%;position:relative;transform-style:preserve-3d;}
#portrait-battle .die-face{position:absolute;width:100%;height:100%;border-radius:11px;box-sizing:border-box;
  backface-visibility:hidden;
  background:linear-gradient(165deg,#f4ecd8 0%,#e8dcb8 35%,#d8c894 70%,#b8a878 100%);
  border:1px solid rgba(120,80,30,0.5);
  box-shadow:inset 0 -2px 4px rgba(120,80,30,0.25),inset 0 1px 2px rgba(255,255,240,0.5);}
#portrait-battle .die-face.face-red{border-color:rgba(233,69,96,0.55);
  background:linear-gradient(165deg,#fce0d8 0%,#f4b8a8 35%,#d88878 70%,#a05050 100%);}
#portrait-battle .die-face.face-blue{border-color:rgba(76,201,240,0.55);
  background:linear-gradient(165deg,#dcf0fc 0%,#a8d8ee 35%,#78a0c4 70%,#406088 100%);}
#portrait-battle .face-front{transform:translateZ(var(--dh,28px));}
#portrait-battle .face-back{transform:rotateY(180deg) translateZ(var(--dh,28px));}
#portrait-battle .face-right{transform:rotateY(90deg) translateZ(var(--dh,28px));}
#portrait-battle .face-left{transform:rotateY(-90deg) translateZ(var(--dh,28px));}
#portrait-battle .face-top{transform:rotateX(-90deg) translateZ(var(--dh,28px));}
#portrait-battle .face-bottom{transform:rotateX(90deg) translateZ(var(--dh,28px));}
#portrait-battle .pip3d{position:absolute;width:9px;height:9px;border-radius:50%;background:#3a1f08;
  box-shadow:inset 0 1px 1px rgba(255,255,255,0.25),0 1px 2px rgba(0,0,0,0.3);}
#portrait-battle .face-red .pip3d{background:#4a0e1a;}
#portrait-battle .face-blue .pip3d{background:#0a3050;}
#portrait-battle .die-physics.settling .die-cube{transition:transform 0.35s cubic-bezier(0.25,0.1,0.25,1);}
#portrait-battle .die-physics.settling{transition:left 0.7s cubic-bezier(0.25,1.1,0.5,1),top 0.7s cubic-bezier(0.25,1.1,0.5,1);}
#portrait-battle .die-physics::after{content:'';position:absolute;bottom:-6px;left:8%;width:84%;height:10px;
  background:radial-gradient(ellipse,rgba(0,0,0,0.35),transparent 70%);border-radius:50%;pointer-events:none;}
#portrait-battle .die-physics.pb-win{transform:scale(1.15);
  filter:drop-shadow(0 0 14px rgba(255,205,70,0.9)) drop-shadow(0 0 30px rgba(255,180,45,0.5));}
#portrait-battle .die-physics.pb-win .die-face{border-color:#ffd448!important;
  background:linear-gradient(165deg,#fff6cc 0%,#ffe27a 35%,#ffc83a 70%,#d79418 100%)!important;}
#portrait-battle .die-physics.pb-win .pip3d{background:#5a2a08!important;}

/* Ability popup (model_a slam style) */
.pb-ability-popup{position:absolute;left:0;right:0;top:34%;z-index:35;text-align:center;pointer-events:none;
  opacity:0;transform:translateY(10px);transition:all .25s ease-out;}
.pb-ability-popup.show{opacity:1;transform:translateY(0);}
.pb-ability-popup .pb-ab-bg{position:absolute;left:0;right:0;top:-20px;bottom:-20px;
  background:linear-gradient(180deg,transparent 0%,rgba(0,0,0,.75) 20%,rgba(0,0,0,.85) 50%,rgba(0,0,0,.75) 80%,transparent 100%);}
.pb-ability-popup .pb-ab-name{position:relative;font-family:'Bangers',cursive;font-size:34px;color:#fff;
  letter-spacing:4px;text-transform:uppercase;
  text-shadow:0 0 20px rgba(79,195,247,.6),0 0 40px rgba(79,195,247,.3),0 2px 4px rgba(0,0,0,.8);}
.pb-ability-popup .pb-ab-desc{position:relative;font-size:13px;color:rgba(255,255,255,.75);margin-top:4px;
  letter-spacing:.5px;text-shadow:0 1px 3px rgba(0,0,0,.8);}
.pb-ability-popup.show .pb-ab-name{animation:pbAbSlam .35s cubic-bezier(.34,1.56,.64,1);}
@keyframes pbAbSlam{0%{transform:scale(1.8);opacity:0}50%{transform:scale(.95)}100%{transform:scale(1);opacity:1}}

/* Damage FX */
.pb-flash{position:absolute;inset:0;z-index:90;pointer-events:none;opacity:0;transition:opacity .15s;}
.pb-flash.pb-player-hit{background:radial-gradient(ellipse at 50% 80%,rgba(239,83,80,.4),transparent);opacity:1;}
.pb-flash.pb-enemy-hit{background:radial-gradient(ellipse at 50% 20%,rgba(79,195,247,.4),transparent);opacity:1;}
.pb-app.pb-shake{animation:pbShake .3s ease-in-out;}
@keyframes pbShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
.pb-float-dmg{position:absolute;z-index:40;font-family:'Bangers',cursive;font-size:46px;pointer-events:none;
  animation:pbFloatUp 1.8s ease-out forwards;
  text-shadow:0 0 12px rgba(0,0,0,.9),0 0 24px rgba(0,0,0,.7);-webkit-text-stroke:2px rgba(0,0,0,.5);}
.pb-float-dmg.pb-on-enemy{color:#4fc3f7;right:15%;top:13%;}
.pb-float-dmg.pb-on-player{color:#ef5350;left:15%;bottom:24%;}
@keyframes pbFloatUp{0%{opacity:1;transform:translateY(0) scale(1.3)}15%{opacity:1;transform:translateY(-5px) scale(1)}
  60%{opacity:1;transform:translateY(-30px) scale(1)}100%{opacity:0;transform:translateY(-60px) scale(.9)}}
#portrait-battle .pb-sprite.pb-hit{animation:pbSpriteFlash .45s ease-out,pbSpriteShake .4s ease-out;}
@keyframes pbSpriteFlash{0%{filter:brightness(1)}12%{filter:brightness(3) drop-shadow(0 0 15px rgba(255,255,255,.8))}
  25%{filter:brightness(1)}37%{filter:brightness(2.5) drop-shadow(0 0 12px rgba(239,83,80,.6))}55%{filter:brightness(1)}}
@keyframes pbSpriteShake{0%,100%{transform:translateX(0)}12%{transform:translateX(-5px)}25%{transform:translateX(5px)}
  37%{transform:translateX(-4px)}50%{transform:translateX(4px)}62%{transform:translateX(-2px)}75%{transform:translateX(2px)}}

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

/* glass mode: raid-screen stays mounted (engine owns it) but turns invisible
   and click-through; only ability modals (.selene-overlay) stay live above us */
#raid-screen.pb-glass{background:transparent !important;pointer-events:none !important;}
#raid-screen.pb-glass > *:not(.selene-overlay):not(#battle-view){visibility:hidden !important;}
#raid-screen.pb-glass .selene-overlay{pointer-events:auto;}

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
    <div id="pb-dice3d-overlay"></div>
    <div id="pb-dice3d"></div>
    <div class="pb-flash" id="pb-flash"></div>
    <div class="pb-ability-popup" id="pb-ability-popup">
      <div class="pb-ab-bg"></div>
      <div class="pb-ab-name" id="pb-ab-name"></div>
      <div class="pb-ab-desc" id="pb-ab-desc"></div>
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
    // Mount on BODY. Mounting inside #raid-screen dies: raid UI rewrites its
    // innerHTML (intro/phase/result screens), obliterating injected children.
    // Instead we sit just UNDER raid-screen (z8999 < 9000) and turn raid-screen
    // into click-through glass (.pb-glass) that shows only its ability modals.
    document.body.appendChild(root);
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

  // ── 3D DICE (ported from model_a Dice3D, driven by engine state) ──
  const PbDice = (function () {
    const PIP_LAYOUTS = {1:['c'],2:['tr','bl'],3:['tr','c','bl'],4:['tl','tr','bl','br'],5:['tl','tr','c','bl','br'],6:['tl','ml','bl','tr','mr','br']};
    const PIP_STYLES = {tl:'top:18%;left:18%',tr:'top:18%;right:18%',ml:'top:50%;left:18%;transform:translateY(-50%)',
      c:'top:50%;left:50%;transform:translate(-50%,-50%)',mr:'top:50%;right:18%;transform:translateY(-50%)',
      bl:'bottom:18%;left:18%',br:'bottom:18%;right:18%'};
    const FACE_TARGET = {1:{rx:0,ry:0},2:{rx:0,ry:-90},3:{rx:90,ry:0},4:{rx:-90,ry:0},5:{rx:0,ry:90},6:{rx:0,ry:180}};
    function nearestSnap(cur,tgt){return tgt+Math.round((cur-tgt)/360)*360;}
    function pipHTML(val){return (PIP_LAYOUTS[val]||PIP_LAYOUTS[1]).map(pp=>'<span class="pip3d" style="'+PIP_STYLES[pp]+'"></span>').join('');}
    function cubeHTML(team){const c='face-'+team;
      return [['front',1],['back',6],['right',2],['left',5],['top',3],['bottom',4]]
        .map(([f,v])=>'<div class="die-face '+c+' face-'+f+'">'+pipHTML(v)+'</div>').join('');}
    let _physics = {};
    const arena = () => $pb('pb-dice3d');
    function showRolling(team, count) {
      const a = arena(); if (!a || !count) return;
      if (_physics[team]) { cancelAnimationFrame(_physics[team].raf); _physics[team].els.forEach(e=>e.remove()); }
      const W=a.offsetWidth,H=a.offsetHeight,dieSize=52,half=dieSize/2,pad=10;
      const minX=pad,maxX=W-pad-dieSize,minY=pad,maxY=H-pad-dieSize;
      const isRed = team !== 'blue';
      const handX = isRed?minX+10:maxX-10, handY = isRed?maxY-5:minY+5;
      const dice=[],els=[];
      for (let i=0;i<count;i++){
        const die=document.createElement('div'); die.className='die-physics';
        die.style.width=dieSize+'px'; die.style.height=dieSize+'px'; die.style.zIndex='100';
        die.style.setProperty('--dh',half+'px');
        die.innerHTML='<div class="die-cube">'+cubeHTML(isRed?'blue':'red')+'</div>';
        a.appendChild(die); els.push(die);
        const t=count>1?i/(count-1):0.5;
        dice.push({el:die,cube:die.querySelector('.die-cube'),
          x:handX+(Math.random()-0.5)*6,y:handY+(Math.random()-0.5)*6,
          vx:(isRed?1:-1)*(11+t*13)*(1+(Math.random()-0.5)*0.25),
          vy:(isRed?-1:1)*(8+(1-t)*16)*(1+(Math.random()-0.5)*0.25),
          rx:Math.random()*720,ry:Math.random()*720,rz:Math.random()*360,
          vrx:(Math.random()-0.5)*55,vry:(Math.random()-0.5)*55,vrz:(Math.random()-0.5)*40,
          bounceCount:0});
      }
      function step(){
        for(let x=0;x<dice.length;x++)for(let y=x+1;y<dice.length;y++){
          const da=dice[x],db=dice[y],dx=da.x-db.x,dy=da.y-db.y,dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<dieSize&&dist>0.1){const push=(dieSize-dist)*0.15,nx=dx/dist,ny=dy/dist;
            da.vx+=nx*push;da.vy+=ny*push;db.vx-=nx*push;db.vy-=ny*push;}}
        dice.forEach(dd=>{
          dd.x+=dd.vx;dd.y+=dd.vy;dd.rx+=dd.vrx;dd.ry+=dd.vry;dd.rz+=dd.vrz;
          const speed=Math.abs(dd.vx)+Math.abs(dd.vy);
          const bc=Math.max(0.3,0.65*Math.pow(0.8,dd.bounceCount));
          if(dd.x<minX){dd.x=minX;dd.vx=Math.abs(dd.vx)*bc;dd.bounceCount++;}
          if(dd.x>maxX){dd.x=maxX;dd.vx=-Math.abs(dd.vx)*bc;dd.bounceCount++;}
          if(dd.y<minY){dd.y=minY;dd.vy=Math.abs(dd.vy)*bc;dd.bounceCount++;}
          if(dd.y>maxY){dd.y=maxY;dd.vy=-Math.abs(dd.vy)*bc;dd.bounceCount++;}
          const fric=speed>8?0.982:speed>3?0.965:0.935, rFric=speed>8?0.972:speed>3?0.950:0.920;
          dd.vx*=fric;dd.vy*=fric;dd.vrx*=rFric;dd.vry*=rFric;dd.vrz*=rFric;
          if(speed<6){const str=0.08*(1-speed/6);
            dd.rx+=(Math.round(dd.rx/90)*90-dd.rx)*str;dd.ry+=(Math.round(dd.ry/90)*90-dd.ry)*str;dd.rz+=(Math.round(dd.rz/90)*90-dd.rz)*str;}
          dd.el.style.left=dd.x+'px';dd.el.style.top=dd.y+'px';
          dd.cube.style.transform='rotateX('+dd.rx+'deg) rotateY('+dd.ry+'deg) rotateZ('+dd.rz+'deg)';
        });
        _physics[team].raf=requestAnimationFrame(step);
      }
      _physics[team]={raf:requestAnimationFrame(step),dice,els,settled:false};
    }
    function reveal(team, values) {
      const ph=_physics[team]; if(!ph||!ph.dice.length) return;
      cancelAnimationFrame(ph.raf);
      const a=arena(),W=a.offsetWidth,H=a.offsetHeight,dieSize=52,gap=14;
      const isRed = team !== 'blue';
      const totalW=values.length*dieSize+(values.length-1)*gap;
      const startX=W*0.5-totalW/2;
      const trayY=isRed?H*0.65-14:H*0.35-15;
      values.forEach((v,i)=>{const dd=ph.dice[i];if(!dd)return;
        const tgt=FACE_TARGET[v],frx=nearestSnap(dd.rx,tgt.rx),fry=nearestSnap(dd.ry,tgt.ry),frz=nearestSnap(dd.rz,0);
        setTimeout(()=>{dd.el.classList.add('settling');
          dd.el.style.left=(startX+i*(dieSize+gap))+'px';dd.el.style.top=trayY+'px';
          dd.cube.style.transform='rotateX('+frx+'deg) rotateY('+fry+'deg) rotateZ('+frz+'deg)';},i*80);
      });
      setTimeout(()=>{ph.settled=true;
        // highlight matching dice (pairs/trips) per team
        const counts={};values.forEach(v=>counts[v]=(counts[v]||0)+1);
        const best=Object.keys(counts).reduce((acc,k)=>counts[k]>counts[acc]?k:acc,Object.keys(counts)[0]);
        if(counts[best]>=2){ph.dice.forEach((dd,i)=>{if(values[i]===+best)dd.el.classList.add('pb-win');});}
      },values.length*80+750);
    }
    function clear(team){
      if(team){if(_physics[team]){cancelAnimationFrame(_physics[team].raf);_physics[team].els.forEach(e=>e.remove());delete _physics[team];}return;}
      Object.keys(_physics).forEach(clear);
    }
    return { showRolling, reveal, clear };
  })();

  // Dice lifecycle detector: engine sets B.preRoll[team].dice null -> [values]
  let _lastDice = { red: '', blue: '' };
  function renderDice() {
    const pr = B.preRoll;
    ['red', 'blue'].forEach(team => {
      const dice = pr && pr[team] && pr[team].dice;
      const key = dice ? dice.join(',') : '';
      if (key && key !== _lastDice[team]) {
        _lastDice[team] = key;
        PbDice.clear(team);
        PbDice.showRolling(team, dice.length);
        setTimeout(() => PbDice.reveal(team, dice), 900);
      } else if (!key && _lastDice[team]) {
        _lastDice[team] = '';
        // dice cleared by engine -> next roll incoming; fade old tray after a beat
        setTimeout(() => { if (!(_lastDice[team])) PbDice.clear(team); }, 1200);
      }
    });
  }

  function renderCards() {
    const wrap = $pb('pb-cards');
    if (!wrap) return;
    const act = safeActive(B.red);
    wrap.innerHTML = '';
    B.red.ghosts.slice(0, 3).forEach(g => {
      const img = document.createElement('img');
      img.className = 'pb-card' + (g === act ? ' pb-active' : '') + (g.ko ? ' pb-dead' : '');
      let art = g.art;
      if (!art) { try { art = (typeof getGhost === 'function' && getGhost(g.baseId || g.id) || {}).art; } catch (e) {} }
      img.src = art || '';
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

  // ── FX (driven by engine wraps) ──────────────────────────────────
  let _pbAbilityQueue = [];
  let _pbAbilityShowing = false;
  function pbShowAbility(name, desc) {
    _pbAbilityQueue.push([String(name || ''), String(desc || '').replace(/<[^>]*>/g, '')]);
    if (!_pbAbilityShowing) pbDrainAbility();
  }
  function pbDrainAbility() {
    const next = _pbAbilityQueue.shift();
    if (!next) { _pbAbilityShowing = false; return; }
    _pbAbilityShowing = true;
    const pop = $pb('pb-ability-popup');
    if (!pop) { _pbAbilityShowing = false; return; }
    $pb('pb-ab-name').textContent = next[0];
    $pb('pb-ab-desc').textContent = next[1];
    pop.classList.remove('show');
    void pop.offsetWidth;
    pop.classList.add('show');
    setTimeout(() => { pop.classList.remove('show'); setTimeout(pbDrainAbility, 250); }, 1700);
  }
  let _pbLastHit = 'blue';
  function pbHitFx(teamName) {
    _pbLastHit = teamName;
    const flash = $pb('pb-flash');
    if (flash) {
      flash.className = 'pb-flash ' + (teamName === 'red' ? 'pb-player-hit' : 'pb-enemy-hit');
      setTimeout(() => { flash.className = 'pb-flash'; }, 220);
    }
    const app = document.querySelector('#portrait-battle .pb-app');
    if (app) { app.classList.remove('pb-shake'); void app.offsetWidth; app.classList.add('pb-shake'); }
    // sprite hit flash: red -> active player sprite, blue -> boss sprite
    const sel = teamName === 'red' ? '.pb-sprite.pb-active' : '.pb-sprite.pb-boss';
    const sp = document.querySelector('#portrait-battle ' + sel);
    if (sp) { sp.classList.remove('pb-hit'); void sp.offsetWidth; sp.classList.add('pb-hit'); setTimeout(() => sp.classList.remove('pb-hit'), 500); }
  }
  function pbFloatDmg(dmg) {
    const app = document.querySelector('#portrait-battle .pb-app');
    if (!app) return;
    const el = document.createElement('div');
    el.className = 'pb-float-dmg ' + (_pbLastHit === 'blue' ? 'pb-on-enemy' : 'pb-on-player');
    el.textContent = '-' + dmg;
    app.appendChild(el);
    setTimeout(() => el.remove(), 1900);
  }

  // ── ENTER / EXIT ─────────────────────────────────────────────────
  window.enterPortraitBattle = function () {
    buildDom();
    const bv = $pb('battle-view');
    if (bv) bv.classList.add('pb-offscreen');
    const rs = document.querySelector('#raid-screen');
    if (rs) rs.classList.add('pb-glass');
    $pb('portrait-battle').classList.add('pb-show');
    pbActive = true;
    if (pbTimer) clearInterval(pbTimer);
    pbTimer = setInterval(renderPortrait, 400); // safety mirror; renderBattle wrap is primary
    renderPortrait();
  };
  window.exitPortraitBattle = function () {
    pbActive = false;
    try { PbDice.clear(); } catch (e) {}
    _pbAbilityQueue = [];
    _pbAbilityShowing = false;
    _lastDice = { red: '', blue: '' };
    if (pbTimer) { clearInterval(pbTimer); pbTimer = null; }
    const bv = $pb('battle-view');
    if (bv) bv.classList.remove('pb-offscreen', 'pb-peek');
    const rs = document.querySelector('#raid-screen');
    if (rs) rs.classList.remove('pb-glass');
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
    // 2b. Ability callouts → portrait slam popup
    if (typeof window.queueAbility === 'function' && !window.queueAbility._pbFxWrapped) {
      const orig = window.queueAbility;
      const wrapped = function (name, color, desc, onShow, team) {
        if (pbActive) {
          try { pbShowAbility(name, desc); } catch (e) {}
        }
        return orig.apply(this, arguments);
      };
      wrapped._pbFxWrapped = true;
      window.queueAbility = wrapped;
    }
    // 2c. Hit FX: hitDamage carries WHO got hit, playDamageSfx carries HOW MUCH
    if (typeof window.hitDamage === 'function' && !window.hitDamage._pbFxWrapped) {
      const orig = window.hitDamage;
      const wrapped = function (teamName) {
        if (pbActive) { try { pbHitFx(teamName); } catch (e) {} }
        return orig.apply(this, arguments);
      };
      wrapped._pbFxWrapped = true;
      window.hitDamage = wrapped;
    }
    if (typeof window.playDamageSfx === 'function' && !window.playDamageSfx._pbFxWrapped) {
      const orig = window.playDamageSfx;
      const wrapped = function (dmg) {
        if (pbActive && dmg > 0) { try { pbFloatDmg(dmg); } catch (e) {} }
        return orig.apply(this, arguments);
      };
      wrapped._pbFxWrapped = true;
      window.playDamageSfx = wrapped;
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
