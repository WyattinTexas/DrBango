// ═══════════════════════════════════════════════════════════════
// PLAYER HOUSE — INTERIOR MODULE
// Tiny cozy 12x10 interior: bed, chest, fireplace, table, door.
// Follows the cantina-module.js pattern exactly.
// ═══════════════════════════════════════════════════════════════

// ─── HOUSE STATE ───
let houseActive = false;          // true when inside house interior
let housePlayerX = 6;             // player position inside house (tiles)
let housePlayerY = 8;             // starts near the door
let housePlayerDir = 'up';
let housePlayerFrame = 0;
let houseSavedOverworldX = 0;     // where player was on overworld
let houseSavedOverworldY = 0;
let houseAnimTime = 0;
let houseInteractCooldown = 0;
let houseNotification = null;     // { text, timer }
let houseAmbientParticles = [];

// ─── HOUSE MAP DIMENSIONS ───
const HOUSE_W = 12;
const HOUSE_H = 10;
const HOUSE_TILE = 48;

// ─── HOUSE TILE TYPES ───
const HT = {
  FLOOR:     0,  // Warm wood floor
  WALL:      1,  // Stone/wood wall (impassable)
  BED:       2,  // Bed (impassable, interactive — heals team)
  CHEST:     3,  // Storage chest (impassable, interactive — trophy display)
  FIREPLACE: 4,  // Fireplace (impassable, interactive — gives XP buff)
  TABLE:     5,  // Small table (impassable)
  CHAIR:     6,  // Chair (walkable)
  DOOR:      7,  // Exit door (walkable, triggers exit)
  RUG:       8,  // Decorative rug (walkable)
  WINDOW:    9,  // Window (impassable, decorative glow)
};

// Impassable set
const HOUSE_IMPASSABLE = new Set([
  HT.WALL, HT.BED, HT.CHEST, HT.FIREPLACE, HT.TABLE, HT.WINDOW
]);

// ─── HOUSE MAP DATA ───
// 12 wide x 10 tall
const HOUSE_MAP = [
  // y=0 — top wall
  [1,1,1,1,1,1,1,1,1,1,1,1],
  // y=1 — bed (top-left), window, fireplace (center-top), window, chest (top-right)
  [1,2,2,1,9,4,4,9,1,3,3,1],
  // y=2 — bed foot + fireplace glow area + chest front
  [1,0,0,0,0,0,0,0,0,0,0,1],
  // y=3 — open floor
  [1,0,0,0,0,8,8,0,0,0,0,1],
  // y=4 — table area center
  [1,0,0,0,6,5,5,6,0,0,0,1],
  // y=5 — open floor with rug
  [1,0,0,0,0,8,8,0,0,0,0,1],
  // y=6 — open floor
  [1,0,0,0,0,8,8,0,0,0,0,1],
  // y=7 — open floor near door
  [1,0,0,0,0,0,0,0,0,0,0,1],
  // y=8 — door at bottom-center
  [1,1,1,1,1,7,7,1,1,1,1,1],
  // y=9 — bottom wall
  [1,1,1,1,1,1,1,1,1,1,1,1],
];

// ─── HOUSE DIALOGUE ───
let houseDialogueActive = false;
let houseDialogueData = null;


// ═══════ ENTER / EXIT ═══════

function enterHouse() {
  // Save overworld position
  houseSavedOverworldX = G.x;
  houseSavedOverworldY = G.y;

  // Switch to house mode
  houseActive = true;
  housePlayerX = 5.5;     // start at door
  housePlayerY = 7.5;
  housePlayerDir = 'up';
  housePlayerFrame = 0;
  houseAmbientParticles = [];
  houseNotification = { text: 'Welcome Home!', timer: 180 };

  // Full team heal on enter
  if (G && G.team) {
    G.team.forEach(ghost => {
      if (ghost) ghost.hp = ghost.maxHp;
    });
  }
  if (typeof notify === 'function') notify('Welcome home! Team fully healed.');

  // Spawn initial ambient particles
  for (let i = 0; i < 6; i++) {
    houseAmbientParticles.push(createHouseParticle());
  }
}

function exitHouse() {
  houseActive = false;

  // Restore overworld position (nudge slightly away)
  G.x = houseSavedOverworldX;
  G.y = houseSavedOverworldY + 1;
  G.direction = 'down';
}


// ═══════ MOVEMENT & COLLISION ═══════

function updateHouse(dt, keys) {
  if (!houseActive) return;

  houseAnimTime += dt;

  // Movement
  let dx = 0, dy = 0;
  const HOUSE_SPEED = 2.2;

  if (keys['w'] || keys['arrowup'])    dy = -HOUSE_SPEED;
  if (keys['s'] || keys['arrowdown'])  dy = HOUSE_SPEED;
  if (keys['a'] || keys['arrowleft'])  dx = -HOUSE_SPEED;
  if (keys['d'] || keys['arrowright']) dx = HOUSE_SPEED;

  // Diagonal normalization
  if (dx && dy) { dx *= 0.707; dy *= 0.707; }

  if (dx || dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      housePlayerDir = dx > 0 ? 'right' : 'left';
    } else {
      housePlayerDir = dy > 0 ? 'down' : 'up';
    }
    housePlayerFrame += dt * 6;
  }

  const step = 0.05;
  const newX = housePlayerX + dx * step;
  const newY = housePlayerY + dy * step;

  // Collision check — 4 corners of 0.6-wide hitbox
  const pad = 0.3;
  const canMove = (px, py) => {
    const checks = [
      [px - pad, py - pad],
      [px + pad, py - pad],
      [px - pad, py + pad],
      [px + pad, py + pad],
    ];
    for (const [cx, cy] of checks) {
      const tx = Math.floor(cx);
      const ty = Math.floor(cy);
      if (tx < 0 || tx >= HOUSE_W || ty < 0 || ty >= HOUSE_H) return false;
      if (HOUSE_IMPASSABLE.has(HOUSE_MAP[ty][tx])) return false;
    }
    return true;
  };

  // Slide movement
  if (canMove(newX, housePlayerY)) housePlayerX = newX;
  if (canMove(housePlayerX, newY)) housePlayerY = newY;

  // Clamp
  housePlayerX = Math.max(0.5, Math.min(HOUSE_W - 0.5, housePlayerX));
  housePlayerY = Math.max(0.5, Math.min(HOUSE_H - 0.5, housePlayerY));

  // Interaction cooldown
  if (houseInteractCooldown > 0) houseInteractCooldown -= dt;

  // Update ambient particles
  updateHouseParticles(dt);

  // Update notification
  if (houseNotification && houseNotification.timer > 0) {
    houseNotification.timer -= 1;
  }
}


// ═══════ INTERACTION ═══════

function houseInteract() {
  if (!houseActive) return;
  if (houseInteractCooldown > 0) return;
  houseInteractCooldown = 0.5;

  const px = housePlayerX;
  const py = housePlayerY;

  // Check exit door (bottom-center, tiles 5-6 at y=8)
  const nearDoor = py > 7 && px >= 4.5 && px <= 7.5;
  if (nearDoor) {
    exitHouse();
    return;
  }

  // Check adjacent tiles for interactive objects
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = Math.floor(px) + dx;
      const ty = Math.floor(py) + dy;
      if (tx >= 0 && tx < HOUSE_W && ty >= 0 && ty < HOUSE_H) {
        const tile = HOUSE_MAP[ty][tx];

        if (tile === HT.BED) {
          // Heal team to full
          if (G && G.team) {
            G.team.forEach(ghost => {
              if (ghost) ghost.hp = ghost.maxHp;
            });
          }
          showHouseDialogue('Your Bed', 'You rest for a moment. Your team is fully healed!', '#8899cc');
          return;
        }

        if (tile === HT.CHEST) {
          // Show trophy display
          const trophies = G.house?.trophies || [];
          if (trophies.length > 0) {
            const trophyNames = trophies.map(tid => {
              const t = (typeof TROPHY_DEFS !== 'undefined') ? TROPHY_DEFS[tid] : null;
              return t ? `${t.icon} ${t.name}` : tid;
            }).join(', ');
            showHouseDialogue('Trophy Chest', `Your trophies: ${trophyNames}`, '#daa520');
          } else {
            showHouseDialogue('Trophy Chest', 'Empty for now. Earn trophies by defeating bosses and mastering skills!', '#8a7a5a');
          }
          return;
        }

        if (tile === HT.FIREPLACE) {
          // Set XP buff
          G.houseBuff = { until: Date.now() + (2 * 60 * 60 * 1000), multiplier: 1.25 };
          if (typeof saveGame === 'function') saveGame();
          showHouseDialogue('Fireplace', 'The fire crackles warmly. You feel inspired! +25% XP for 2 hours!', '#ff8844');
          houseNotification = { text: '+25% XP for 2 hours!', timer: 150 };
          if (typeof notify === 'function') notify('+25% XP for 2 hours!');
          return;
        }

        if (tile === HT.TABLE) {
          showHouseDialogue('Table', 'A small wooden table with a half-eaten snack. Home sweet home.', '#7a5a30');
          return;
        }

        if (tile === HT.WINDOW) {
          showHouseDialogue('Window', 'You peer outside. The world awaits... but it\'s nice in here.', '#aaccee');
          return;
        }
      }
    }
  }

  // Chair — sit
  const tileUnder = HOUSE_MAP[Math.floor(py)]?.[Math.floor(px)];
  if (tileUnder === HT.CHAIR) {
    houseNotification = { text: '*sits down and relaxes*', timer: 90 };
    return;
  }
}


// ─── House dialogue ───

function showHouseDialogue(name, text, color) {
  houseDialogueActive = true;
  houseDialogueData = { name, text, color: color || '#daa520' };
}

function closeHouseDialogue() {
  houseDialogueActive = false;
  houseDialogueData = null;
}


// ═══════ RENDERING ═══════

function renderHouse(ctx, W, H) {
  if (!houseActive) return;

  const time = houseAnimTime;

  // Camera — center on player, clamp to map
  const mapPixelW = HOUSE_W * HOUSE_TILE;
  const mapPixelH = HOUSE_H * HOUSE_TILE;

  let camX, camY;
  if (mapPixelW <= W) {
    camX = (mapPixelW - W) / 2;
  } else {
    camX = housePlayerX * HOUSE_TILE - W / 2;
    camX = Math.max(0, Math.min(mapPixelW - W, camX));
  }
  if (mapPixelH <= H) {
    camY = (mapPixelH - H) / 2;
  } else {
    camY = housePlayerY * HOUSE_TILE - H / 2;
    camY = Math.max(0, Math.min(mapPixelH - H, camY));
  }

  // Background — warm dark interior
  ctx.fillStyle = '#120e08';
  ctx.fillRect(0, 0, W, H);

  // Draw tiles
  const startTX = Math.max(0, Math.floor(camX / HOUSE_TILE) - 1);
  const startTY = Math.max(0, Math.floor(camY / HOUSE_TILE) - 1);
  const endTX = Math.min(HOUSE_W, Math.ceil((camX + W) / HOUSE_TILE) + 1);
  const endTY = Math.min(HOUSE_H, Math.ceil((camY + H) / HOUSE_TILE) + 1);

  for (let ty = startTY; ty < endTY; ty++) {
    for (let tx = startTX; tx < endTX; tx++) {
      const sx = tx * HOUSE_TILE - camX;
      const sy = ty * HOUSE_TILE - camY;
      const tile = HOUSE_MAP[ty]?.[tx];
      if (tile === undefined) continue;
      drawHouseTile(ctx, tile, sx, sy, tx, ty, time);
    }
  }

  // Draw ambient particles (fireplace sparks, dust)
  renderHouseParticles(ctx, camX, camY);

  // Draw player
  const playerSX = housePlayerX * HOUSE_TILE - camX;
  const playerSY = housePlayerY * HOUSE_TILE - camY;

  // Player shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(playerSX, playerSY + 14, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Use existing sprite system if available
  if (typeof drawSprite === 'function' && G.sprite !== undefined) {
    drawSprite(ctx, G.sprite, playerSX - 24, playerSY - 36, 2.5, housePlayerDir, Math.floor(housePlayerFrame) % 4);
  } else {
    ctx.fillStyle = '#ffcc44';
    ctx.beginPath();
    ctx.arc(playerSX, playerSY - 8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cc9922';
    ctx.fillRect(playerSX - 5, playerSY, 10, 12);
  }

  // Player name tag
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(G.name || 'Player', playerSX, playerSY - 40);

  // ─── Interaction prompts ───

  // Door prompt
  if (housePlayerY > 6.5 && housePlayerX >= 4.5 && housePlayerX <= 7.5) {
    const doorSX = 5.5 * HOUSE_TILE - camX;
    const doorSY = 8 * HOUSE_TILE - camY;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,255,200,${0.6 + Math.sin(time * 3) * 0.3})`;
    ctx.fillText('[E] Leave', doorSX, doorSY - 8);
  }

  // Interactive object prompts
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = Math.floor(housePlayerX) + dx;
      const ty = Math.floor(housePlayerY) + dy;
      if (tx >= 0 && tx < HOUSE_W && ty >= 0 && ty < HOUSE_H) {
        const tile = HOUSE_MAP[ty][tx];
        let label = null;
        if (tile === HT.BED) label = '[E] Rest';
        else if (tile === HT.CHEST) label = '[E] Trophies';
        else if (tile === HT.FIREPLACE) label = '[E] Warm up';
        else if (tile === HT.TABLE) label = '[E] Examine';
        else if (tile === HT.WINDOW) label = '[E] Look outside';
        if (label) {
          const osx = tx * HOUSE_TILE - camX + HOUSE_TILE / 2;
          const osy = ty * HOUSE_TILE - camY - 4;
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = `rgba(255,255,200,${0.5 + Math.sin(time * 2) * 0.3})`;
          ctx.fillText(label, osx, osy);
        }
      }
    }
  }

  // ─── UI Overlays ───

  // Location header
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(220,190,130,0.7)';
  ctx.fillText(G.house?.houseName || 'Your House', W / 2, 28);
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(180,160,120,0.5)';
  ctx.fillText('Home Sweet Home', W / 2, 42);

  // Notification toast
  if (houseNotification && houseNotification.timer > 0) {
    const alpha = Math.min(1, houseNotification.timer / 30);
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,220,140,${alpha})`;
    ctx.fillText(houseNotification.text, W / 2, H - 40);
  }

  // ─── Dialogue overlay ───
  if (houseDialogueActive && houseDialogueData) {
    drawHouseDialogue(ctx, W, H);
  }

  // Vignette effect — warm cozy amber edges
  const vignette = ctx.createRadialGradient(W/2, H/2, Math.min(W,H) * 0.25, W/2, H/2, Math.max(W,H) * 0.65);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(15,8,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}


// ═══════ TILE RENDERING ═══════

function drawHouseTile(ctx, tile, sx, sy, tx, ty, time) {
  const T = HOUSE_TILE;

  switch (tile) {
    case HT.FLOOR: {
      // Warm wood plank floor
      ctx.fillStyle = '#4a3520';
      ctx.fillRect(sx, sy, T, T);
      // Plank lines
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      const plankDir = (tx + ty) % 2;
      if (plankDir === 0) {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(sx, sy + i * (T/3) + T/6);
          ctx.lineTo(sx + T, sy + i * (T/3) + T/6);
          ctx.stroke();
        }
      } else {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(sx + i * (T/3) + T/6, sy);
          ctx.lineTo(sx + i * (T/3) + T/6, sy + T);
          ctx.stroke();
        }
      }
      // Warm ambient light
      ctx.fillStyle = `rgba(255,180,80,${0.04 + Math.sin(tx * 1.1 + ty * 0.9) * 0.02})`;
      ctx.fillRect(sx, sy, T, T);
      break;
    }

    case HT.WALL: {
      // Warm wood-panel wall
      ctx.fillStyle = '#2e2218';
      ctx.fillRect(sx, sy, T, T);
      // Horizontal panel lines
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy + T/3);
      ctx.lineTo(sx + T, sy + T/3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx, sy + T * 2/3);
      ctx.lineTo(sx + T, sy + T * 2/3);
      ctx.stroke();
      // Color variation
      ctx.fillStyle = `rgba(${50 + (tx * 5 % 15)},${35 + (ty * 7 % 10)},${20 + (tx * 3 % 8)},0.2)`;
      ctx.fillRect(sx, sy, T, T);
      break;
    }

    case HT.BED: {
      // Floor under
      drawHouseTile(ctx, HT.FLOOR, sx, sy, tx, ty, time);
      // Bed frame
      ctx.fillStyle = '#5a3a18';
      ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
      // Mattress
      ctx.fillStyle = '#ddd8cc';
      ctx.fillRect(sx + 5, sy + 5, T - 10, T - 10);
      // Pillow
      ctx.fillStyle = '#eeeade';
      ctx.fillRect(sx + 8, sy + 6, T - 16, 10);
      // Blanket
      ctx.fillStyle = '#4466aa';
      ctx.fillRect(sx + 5, sy + T/2, T - 10, T/2 - 8);
      ctx.fillStyle = '#3355aa';
      ctx.fillRect(sx + 5, sy + T/2, T - 10, 4);
      break;
    }

    case HT.CHEST: {
      // Floor under
      drawHouseTile(ctx, HT.FLOOR, sx, sy, tx, ty, time);
      // Chest body
      ctx.fillStyle = '#6a4a20';
      ctx.fillRect(sx + 6, sy + T/2 - 4, T - 12, T/2);
      // Chest lid
      ctx.fillStyle = '#7a5a28';
      ctx.beginPath();
      ctx.moveTo(sx + 6, sy + T/2 - 4);
      ctx.lineTo(sx + T/2, sy + T/2 - 12);
      ctx.lineTo(sx + T - 6, sy + T/2 - 4);
      ctx.closePath();
      ctx.fill();
      // Metal bands
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 6, sy + T/2 - 4, T - 12, T/2);
      // Lock
      ctx.fillStyle = '#daa520';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2 + 4, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case HT.FIREPLACE: {
      // Stone hearth
      ctx.fillStyle = '#3a3030';
      ctx.fillRect(sx, sy, T, T);
      // Hearth arch
      ctx.fillStyle = '#2a2020';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2, T/2 - 6, Math.PI, 0);
      ctx.lineTo(sx + T - 6, sy + T - 4);
      ctx.lineTo(sx + 6, sy + T - 4);
      ctx.closePath();
      ctx.fill();
      // Fire
      const ff = Math.sin(time * 2 + tx) * 3;
      const ff2 = Math.cos(time * 1.5 + ty) * 2;
      // Outer glow
      const glowR = 22 + ff;
      const glow = ctx.createRadialGradient(sx + T/2, sy + T/2 + 4, 2, sx + T/2, sy + T/2 + 4, glowR);
      glow.addColorStop(0, 'rgba(255,120,20,0.9)');
      glow.addColorStop(0.5, 'rgba(255,80,10,0.35)');
      glow.addColorStop(1, 'rgba(255,40,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(sx - 10, sy - 10, T + 20, T + 20);
      // Flames
      ctx.fillStyle = '#ff6610';
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 8, sy + T - 8);
      ctx.quadraticCurveTo(sx + T/2 - 2 + ff2, sy + T/2 - 6 + ff, sx + T/2, sy + T - 8);
      ctx.fill();
      ctx.fillStyle = '#ffaa20';
      ctx.beginPath();
      ctx.moveTo(sx + T/2, sy + T - 10);
      ctx.quadraticCurveTo(sx + T/2 + 4 + ff, sy + T/2 + ff2, sx + T/2 + 8, sy + T - 10);
      ctx.fill();
      ctx.fillStyle = '#ffdd60';
      ctx.beginPath();
      ctx.arc(sx + T/2 + ff2/2, sy + T/2 + 6 + ff/2, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case HT.TABLE: {
      // Floor under
      drawHouseTile(ctx, HT.FLOOR, sx, sy, tx, ty, time);
      // Table top
      ctx.fillStyle = '#5a3a18';
      ctx.fillRect(sx + 4, sy + 6, T - 8, T - 12);
      // Table edge highlight
      ctx.strokeStyle = '#7a5a28';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 4, sy + 6, T - 8, T - 12);
      // Legs
      ctx.fillStyle = '#4a2a10';
      ctx.fillRect(sx + 6, sy + T - 8, 3, 6);
      ctx.fillRect(sx + T - 9, sy + T - 8, 3, 6);
      break;
    }

    case HT.CHAIR: {
      // Floor first
      drawHouseTile(ctx, HT.FLOOR, sx, sy, tx, ty, time);
      // Chair
      ctx.fillStyle = '#4a3018';
      ctx.fillRect(sx + T/2 - 6, sy + T/2 - 4, 12, 10);
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(sx + T/2 - 5, sy + T/2 - 3, 10, 8);
      break;
    }

    case HT.DOOR: {
      // Floor first
      drawHouseTile(ctx, HT.FLOOR, sx, sy, tx, ty, time);
      // Doorframe
      ctx.fillStyle = '#5a4a30';
      ctx.fillRect(sx + T/2 - 10, sy + 2, 20, T - 4);
      // Door
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(sx + T/2 - 8, sy + 4, 16, T - 8);
      // Handle
      ctx.fillStyle = '#daa520';
      ctx.beginPath();
      ctx.arc(sx + T/2 + 4, sy + T/2 + 2, 2, 0, Math.PI * 2);
      ctx.fill();
      // Light beam from outside
      const beamAlpha = 0.12 + Math.sin(time * 0.5) * 0.03;
      ctx.fillStyle = `rgba(180,200,255,${beamAlpha})`;
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 8, sy);
      ctx.lineTo(sx + T/2 - 16, sy - 20);
      ctx.lineTo(sx + T/2 + 16, sy - 20);
      ctx.lineTo(sx + T/2 + 8, sy);
      ctx.fill();
      break;
    }

    case HT.RUG: {
      // Floor first
      drawHouseTile(ctx, HT.FLOOR, sx, sy, tx, ty, time);
      // Cozy rug — warm red/brown
      ctx.fillStyle = 'rgba(140,50,30,0.45)';
      ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
      ctx.strokeStyle = 'rgba(200,120,50,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 5, sy + 5, T - 10, T - 10);
      // Simple diamond
      ctx.fillStyle = 'rgba(200,140,60,0.25)';
      ctx.beginPath();
      ctx.moveTo(sx + T/2, sy + 8);
      ctx.lineTo(sx + T - 8, sy + T/2);
      ctx.lineTo(sx + T/2, sy + T - 8);
      ctx.lineTo(sx + 8, sy + T/2);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case HT.WINDOW: {
      // Wall background
      drawHouseTile(ctx, HT.WALL, sx, sy, tx, ty, time);
      // Window frame
      ctx.fillStyle = '#5a4a30';
      ctx.fillRect(sx + 8, sy + 6, T - 16, T - 12);
      // Glass — pale blue sky
      ctx.fillStyle = '#8ab8d8';
      ctx.fillRect(sx + 10, sy + 8, T - 20, T - 16);
      // Cross panes
      ctx.strokeStyle = '#5a4a30';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + T/2, sy + 8);
      ctx.lineTo(sx + T/2, sy + T - 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + 10, sy + T/2 - 2);
      ctx.lineTo(sx + T - 10, sy + T/2 - 2);
      ctx.stroke();
      // Light beam
      const wGlow = ctx.createRadialGradient(sx + T/2, sy + T/2, 2, sx + T/2, sy + T + 10, T);
      wGlow.addColorStop(0, 'rgba(180,210,240,0.15)');
      wGlow.addColorStop(1, 'rgba(180,210,240,0)');
      ctx.fillStyle = wGlow;
      ctx.fillRect(sx - T/2, sy, T * 2, T * 2);
      break;
    }
  }
}


// ═══════ DIALOGUE BOX ═══════

function drawHouseDialogue(ctx, W, H) {
  const d = houseDialogueData;
  if (!d) return;

  // Dim background
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, W, H);

  // Dialogue box
  const boxW = Math.min(460, W - 40);
  const boxH = 110;
  const boxX = (W - boxW) / 2;
  const boxY = H - boxH - 30;

  // Box background
  ctx.fillStyle = 'rgba(25,18,10,0.92)';
  ctx.strokeStyle = d.color || '#daa520';
  ctx.lineWidth = 2;
  if (typeof roundRect === 'function') {
    roundRect(ctx, boxX, boxY, boxW, boxH, 8);
  } else {
    ctx.beginPath();
    ctx.rect(boxX, boxY, boxW, boxH);
  }
  ctx.fill();
  ctx.stroke();

  // Name
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = d.color || '#daa520';
  ctx.fillText(d.name, boxX + 16, boxY + 22);

  // Text (word wrap)
  ctx.font = '12px monospace';
  ctx.fillStyle = '#ccc';
  if (typeof wrapText === 'function') {
    wrapText(ctx, d.text, boxX + 16, boxY + 44, boxW - 32, 16);
  } else {
    ctx.fillText(d.text, boxX + 16, boxY + 44);
  }

  // Dismiss
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(200,180,140,0.6)';
  ctx.fillText('[E / Click to close]', boxX + boxW - 12, boxY + boxH - 10);
}


// ═══════ AMBIENT PARTICLES ═══════

function createHouseParticle() {
  const type = Math.random();
  if (type < 0.5) {
    // Fireplace spark (near tiles 5-6, y=1)
    return {
      kind: 'spark',
      x: (5 + Math.random() * 2) * HOUSE_TILE,
      y: (1.5 + Math.random() * 0.5) * HOUSE_TILE,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 1.2 - 0.3,
      life: 1,
      maxLife: 0.8 + Math.random() * 0.8,
      size: 1 + Math.random() * 1.5,
    };
  } else {
    // Dust mote (warm interior air)
    return {
      kind: 'dust',
      x: (2 + Math.random() * 8) * HOUSE_TILE,
      y: (2 + Math.random() * 6) * HOUSE_TILE,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.08,
      life: 1,
      maxLife: 3 + Math.random() * 4,
      size: 0.8 + Math.random() * 0.8,
    };
  }
}

function updateHouseParticles(dt) {
  for (let i = houseAmbientParticles.length - 1; i >= 0; i--) {
    const p = houseAmbientParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) {
      houseAmbientParticles.splice(i, 1);
    }
  }
  while (houseAmbientParticles.length < 5) {
    houseAmbientParticles.push(createHouseParticle());
  }
}

function renderHouseParticles(ctx, camX, camY) {
  for (const p of houseAmbientParticles) {
    const sx = p.x - camX;
    const sy = p.y - camY;
    const alpha = Math.min(1, p.life * 2) * 0.6;

    if (p.kind === 'spark') {
      ctx.fillStyle = `rgba(255,${140 + Math.floor(p.size * 40)},20,${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(220,200,160,${alpha * 0.25})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}


// ═══════ INTEGRATION HOOKS ═══════
// These are wired into index.html automatically:
//
// 1. In tryInteract(), when near YOUR claimed house plot, call enterHouse()
//
// 2. In gameLoop():
//      if (houseActive) { updateHouse(dt, keys); return; }
//
// 3. In render():
//      if (houseActive) { renderHouse(ctx, W, H); return; }
//
// 4. In keydown 'e':
//      if (houseActive) { houseDialogueActive ? closeHouseDialogue() : houseInteract(); return; }
//
// 5. In Escape:
//      if (houseActive) { houseDialogueActive ? closeHouseDialogue() : exitHouse(); return; }
//
// 6. Click handler: if (houseActive && houseDialogueActive) closeHouseDialogue();
