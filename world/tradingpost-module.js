// ═══════════════════════════════════════════════════════════════
// THE TRADING POST — MERCHANT INTERIOR MODULE
// Drop-in walkable interior for the trading post building.
// Uses the same canvas + movement system as the overworld.
// ═══════════════════════════════════════════════════════════════

// ─── TRADING POST STATE ───
let tradingPostActive = false;       // true when inside trading post
let tradingPostPlayerX = 11;         // player position inside (tiles)
let tradingPostPlayerY = 14;         // starts near the door
let tradingPostPlayerDir = 'up';
let tradingPostPlayerFrame = 0;
let tradingPostSavedOverworldX = 0;  // where player was on overworld
let tradingPostSavedOverworldY = 0;
let tradingPostAnimTime = 0;
let tradingPostInteractCooldown = 0;
let tradingPostNotification = null;  // { text, timer }
let tradingPostAmbientParticles = [];

// ─── TRADING POST MAP DIMENSIONS ───
const TP_MAP_W = 22;
const TP_MAP_H = 16;
const TP_TILE = 48; // same as overworld TILE

// ─── TRADING POST TILE TYPES ───
const TP = {
  FLOOR:     0,  // Wood plank floor
  WALL:      1,  // Stone wall (impassable)
  COUNTER:   2,  // Merchant counter (impassable, interactive)
  SHELF:     3,  // Display shelf (impassable)
  DTABLE:    4,  // Display table (impassable)
  CRATE:     5,  // Crate (impassable)
  BARREL:    6,  // Barrel (impassable)
  GLASS:     7,  // Glass case (impassable)
  SCALES:    8,  // Weighing scales (impassable, interactive)
  NOTICE:    9,  // Notice board (impassable, interactive)
  COINS:     10, // Coin pile (impassable, decorative)
  RUG:       11, // Rug (walkable)
  CHAIR:     12, // Chair (walkable)
  DOOR:      13, // Exit door (walkable, triggers exit)
  LANTERN:   14, // Lantern post (impassable)
  PILLAR:    15, // Support pillar (impassable)
};

// Impassable set for quick lookup
const TP_IMPASSABLE = new Set([
  TP.WALL, TP.COUNTER, TP.SHELF, TP.DTABLE, TP.CRATE,
  TP.BARREL, TP.GLASS, TP.SCALES, TP.NOTICE, TP.COINS,
  TP.LANTERN, TP.PILLAR
]);

// ─── TRADING POST MAP DATA ───
// 22 wide x 16 tall
// Legend: 0=floor, 1=wall, 2=counter, 3=shelf, 4=display table, 5=crate,
//         6=barrel, 7=glass case, 8=scales, 9=notice board, 10=coins,
//         11=rug, 12=chair, 13=door, 14=lantern, 15=pillar
const TP_MAP = [
  // y=0  — top wall
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  // y=1  — storage room (top-left) | merchant counter (center-top) | exotic imports (top-right)
  [1,5,6,5,1,1,3,3,2,2,2,2,2,2,3,3,1,1,7,7,7,1],
  // y=2  — storage interior | behind counter space | exotic interior
  [1,6,5,6,1,0,0,0,2,0,10,0,10,2,0,0,1,0,7,0,7,1],
  // y=3  — storage peek | counter front + stools | exotic entrance
  [1,5,5,0,1,0,0,0,2,0,0,0,0,2,0,0,1,0,0,0,0,1],
  // y=4  — open floor behind storage | main floor
  [1,1,1,0,0,0,14,0,0,0,0,0,0,0,0,14,0,0,0,0,0,1],
  // y=5  — goods display (left wall) | center floor with rug | scales area
  [1,3,3,0,0,0,0,0,0,11,11,11,11,0,0,0,0,8,12,0,0,1],
  // y=6  — goods shelves + tables | rug area | scales + chair
  [1,3,0,4,0,0,0,15,0,11,11,11,11,0,15,0,0,0,12,0,0,1],
  // y=7  — more goods | center rug | open area
  [1,3,0,4,0,0,0,0,0,11,11,11,11,0,0,0,0,0,0,0,0,1],
  // y=8  — goods corner table | open floor
  [1,3,0,0,0,0,0,0,0,11,11,11,11,0,0,0,0,0,0,0,0,1],
  // y=9  — left wall barrels | center floor | right side crates
  [1,6,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,6,5,0,1],
  // y=10 — open floor + coins decorative
  [1,0,0,0,0,14,0,0,0,0,10,0,0,0,0,0,14,0,5,6,0,1],
  // y=11 — wider floor area toward entrance
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // y=12 — notice board area (near entrance)
  [1,0,9,0,0,0,0,0,0,0,11,11,0,0,0,0,0,0,0,0,0,1],
  // y=13 — near entrance floor + rug path
  [1,0,0,0,0,0,0,15,0,0,11,11,0,0,15,0,0,0,0,0,0,1],
  // y=14 — entrance row + exit door
  [1,0,0,0,0,0,0,0,0,0,11,13,0,0,0,0,0,0,0,0,0,1],
  // y=15 — bottom wall
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ─── TRADING POST NPCs ───
const TP_NPCS = [
  {
    id: 'merchant',
    name: 'Thorne',
    title: 'Merchant',
    x: 11, y: 2,
    color: '#b8860b',
    facing: 'down',
    dialogue: [
      "Welcome to my humble post! Best prices this side of the valley.",
      "Looking to buy or sell? Step up to the counter and let's deal.",
      "Trade routes from the Volcanic Isles are running hot. Literally.",
      "Every coin you spend here keeps the supply wagons rolling. Fair trade for all.",
      "Tip: stock up before you head into encounter zones. Preparation is profit.",
      "I've got goods from every region. Name your need, I'll name my price.",
    ],
  },
  {
    id: 'appraiser',
    name: 'Sage',
    title: 'Appraiser',
    x: 17.5, y: 5.5,
    color: '#7b68ee',
    facing: 'left',
    dialogue: [
      "Ah, let me take a look at that... *adjusts spectacles*",
      "Quality is everything. A common material in skilled hands outshines a rare one wasted.",
      "These scales never lie. Well... almost never.",
      "I've appraised items from every corner of the known world. Nothing surprises me anymore.",
      "Crafting worth depends on purity, weight, and provenance. Bring me anything — I'll tell you its true value.",
      "The rarest materials come from the deepest encounters. Risk and reward, always in balance.",
    ],
  },
];

// ─── TRADING POST DECOR ───
// Small decorative details drawn on top of tiles
const TP_DECOR = [
  { x: 10.3, y: 2.3, type: 'coin_stack' },
  { x: 12.3, y: 2.3, type: 'coin_stack' },
  { x: 3.2,  y: 6, type: 'potion' },
  { x: 3.2,  y: 7, type: 'potion' },
  { x: 9.5,  y: 0.8, type: 'sign' },
  { x: 18.5, y: 2.3, type: 'gem' },
  { x: 20.3, y: 2.3, type: 'gem' },
  { x: 2.5,  y: 1.5, type: 'barrel_top' },
  { x: 5.5,  y: 1.5, type: 'barrel_top' },
];


// ═══════ ENTER / EXIT ═══════

function enterTradingPost() {
  // Save overworld position
  tradingPostSavedOverworldX = G.x;
  tradingPostSavedOverworldY = G.y;

  // Switch to trading post mode
  tradingPostActive = true;
  tradingPostPlayerX = 11;    // start at door
  tradingPostPlayerY = 14;
  tradingPostPlayerDir = 'up';
  tradingPostPlayerFrame = 0;
  tradingPostAmbientParticles = [];
  tradingPostNotification = { text: 'The Trading Post', timer: 180 };

  // Spawn initial ambient particles
  for (let i = 0; i < 12; i++) {
    tradingPostAmbientParticles.push(createTradingPostParticle());
  }
}

function exitTradingPost() {
  tradingPostActive = false;

  // Restore overworld position (nudge slightly away from building so we don't re-enter)
  G.x = tradingPostSavedOverworldX;
  G.y = tradingPostSavedOverworldY + 1;
  G.direction = 'down';
}


// ═══════ MOVEMENT & COLLISION ═══════

function updateTradingPost(dt, keys) {
  if (!tradingPostActive) return;

  tradingPostAnimTime += dt;

  // Movement
  let dx = 0, dy = 0;
  const TP_SPEED = 2.2;

  if (keys['w'] || keys['arrowup'])    dy = -TP_SPEED;
  if (keys['s'] || keys['arrowdown'])  dy = TP_SPEED;
  if (keys['a'] || keys['arrowleft'])  dx = -TP_SPEED;
  if (keys['d'] || keys['arrowright']) dx = TP_SPEED;

  // Diagonal normalization
  if (dx && dy) { dx *= 0.707; dy *= 0.707; }

  if (dx || dy) {
    // Update direction
    if (Math.abs(dx) > Math.abs(dy)) {
      tradingPostPlayerDir = dx > 0 ? 'right' : 'left';
    } else {
      tradingPostPlayerDir = dy > 0 ? 'down' : 'up';
    }
    tradingPostPlayerFrame += dt * 6;
  }

  const step = 0.05;
  const newX = tradingPostPlayerX + dx * step;
  const newY = tradingPostPlayerY + dy * step;

  // Collision check — check the 4 corners of a 0.6-wide hitbox
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
      if (tx < 0 || tx >= TP_MAP_W || ty < 0 || ty >= TP_MAP_H) return false;
      if (TP_IMPASSABLE.has(TP_MAP[ty][tx])) return false;
    }
    return true;
  };

  // Slide movement (try X and Y independently)
  if (canMove(newX, tradingPostPlayerY)) tradingPostPlayerX = newX;
  if (canMove(tradingPostPlayerX, newY)) tradingPostPlayerY = newY;

  // Clamp
  tradingPostPlayerX = Math.max(0.5, Math.min(TP_MAP_W - 0.5, tradingPostPlayerX));
  tradingPostPlayerY = Math.max(0.5, Math.min(TP_MAP_H - 0.5, tradingPostPlayerY));

  // Exit door check
  const doorDist = Math.sqrt((tradingPostPlayerX - 11) ** 2 + (tradingPostPlayerY - 14) ** 2);
  if (doorDist < 0.8 && tradingPostPlayerDir === 'down') {
    // Show "Press E to leave" prompt handled in render
  }

  // Interaction cooldown
  if (tradingPostInteractCooldown > 0) tradingPostInteractCooldown -= dt;

  // Update ambient particles
  updateTradingPostParticles(dt);

  // Update notification
  if (tradingPostNotification && tradingPostNotification.timer > 0) {
    tradingPostNotification.timer -= 1;
  }
}


// ═══════ INTERACTION ═══════

function tradingPostInteract() {
  if (!tradingPostActive) return;
  if (tradingPostInteractCooldown > 0) return;
  tradingPostInteractCooldown = 0.5;

  const px = tradingPostPlayerX;
  const py = tradingPostPlayerY;

  // Check exit door
  const doorDist = Math.sqrt((px - 11) ** 2 + (py - 14) ** 2);
  if (doorDist < 1.5) {
    exitTradingPost();
    return;
  }

  // Check NPC interaction (range 2 tiles)
  for (const npc of TP_NPCS) {
    const dist = Math.sqrt((px - npc.x) ** 2 + (py - npc.y) ** 2);
    if (dist < 2.2) {
      const line = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
      showTradingPostDialogue(npc.title ? `${npc.name} the ${npc.title}` : npc.name, line, npc.color);
      // Charisma XP for talking to trading post NPCs
      if (typeof addProfessionXP === 'function') addProfessionXP('charisma', 1);
      return;
    }
  }

  // Check adjacent tiles for interactive objects
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = Math.floor(px) + dx;
      const ty = Math.floor(py) + dy;
      if (tx >= 0 && tx < TP_MAP_W && ty >= 0 && ty < TP_MAP_H) {
        const tile = TP_MAP[ty][tx];

        if (tile === TP.COUNTER) {
          // Main trade interaction — open the existing market modal
          if (typeof openMarket === 'function') {
            openMarket();
          } else {
            showTradingPostDialogue('Trade Counter', 'The polished wooden counter is lined with ledgers and coin trays. Business is always open.', '#b8860b');
          }
          return;
        }

        if (tile === TP.SHELF) {
          showTradingPostDialogue('Goods Display', 'Neatly arranged shelves hold potions, bundled herbs, rope, lantern oil, and travel provisions. Everything an adventurer could need.', '#8b7355');
          return;
        }

        if (tile === TP.DTABLE) {
          showTradingPostDialogue('Display Table', 'An assortment of gear laid out for inspection: polished armor pieces, reinforced gloves, and a set of throwing knives.', '#8b7355');
          return;
        }

        if (tile === TP.GLASS) {
          showTradingPostDialogue('Exotic Imports', 'Behind the glass sit shimmering crystals, a sealed scroll case, and a vial of something that pulses with faint light. "Not for sale... yet," reads a small card.', '#9370db');
          return;
        }

        if (tile === TP.SCALES) {
          showTradingPostDialogue('Appraisal Scales', 'Precision brass scales, perfectly balanced. A small plaque reads: "Fair weight, fair trade — no exceptions."', '#daa520');
          return;
        }

        if (tile === TP.NOTICE) {
          showTradingPostDialogue('Notice Board', 'Pinned notes flutter in the draft: "Volcanic ore — premium prices!" ... "Seeking rare frost herbs" ... "Bulk discount on travel rations this week."', '#cd853f');
          return;
        }

        if (tile === TP.COINS) {
          showTradingPostDialogue('Coin Display', 'A small pile of polished coins from various regions — placed here to inspire confidence in the establishment\'s prosperity.', '#ffd700');
          return;
        }

        if (tile === TP.CRATE) {
          showTradingPostDialogue('Supply Crate', 'Heavy wooden crates stamped with trade guild markings. The lids are nailed shut — fresh shipment, not yet unpacked.', '#8b6914');
          return;
        }

        if (tile === TP.BARREL) {
          showTradingPostDialogue('Storage Barrel', 'Sturdy oak barrels filled with dry goods, grains, or perhaps something more interesting. A faint herbal scent leaks from the seams.', '#8b6914');
          return;
        }
      }
    }
  }

  // Check chair (sit emote)
  const tileUnder = TP_MAP[Math.floor(py)]?.[Math.floor(px)];
  if (tileUnder === TP.CHAIR) {
    tradingPostNotification = { text: '*takes a seat*', timer: 90 };
    if (typeof addProfessionXP === 'function') addProfessionXP('charisma', 1);
    return;
  }
}

// ─── Trading post dialogue (uses the existing showDialogue if available, else custom) ───
let tradingPostDialogueActive = false;
let tradingPostDialogueData = null;

function showTradingPostDialogue(name, text, color) {
  tradingPostDialogueActive = true;
  tradingPostDialogueData = { name, text, color: color || '#b8860b' };
}

function closeTradingPostDialogue() {
  tradingPostDialogueActive = false;
  tradingPostDialogueData = null;
}


// ═══════ RENDERING ═══════

function renderTradingPost(ctx, W, H) {
  if (!tradingPostActive) return;

  const time = tradingPostAnimTime;

  // Camera — center on player, but clamp so we don't show outside the map
  const mapPixelW = TP_MAP_W * TP_TILE;
  const mapPixelH = TP_MAP_H * TP_TILE;

  let camX, camY;
  if (mapPixelW <= W) {
    camX = (mapPixelW - W) / 2; // center small map
  } else {
    camX = tradingPostPlayerX * TP_TILE - W / 2;
    camX = Math.max(0, Math.min(mapPixelW - W, camX));
  }
  if (mapPixelH <= H) {
    camY = (mapPixelH - H) / 2;
  } else {
    camY = tradingPostPlayerY * TP_TILE - H / 2;
    camY = Math.max(0, Math.min(mapPixelH - H, camY));
  }

  // Background — warm merchant ambiance
  ctx.fillStyle = '#0c0a06';
  ctx.fillRect(0, 0, W, H);

  // Draw tiles
  const startTX = Math.max(0, Math.floor(camX / TP_TILE) - 1);
  const startTY = Math.max(0, Math.floor(camY / TP_TILE) - 1);
  const endTX = Math.min(TP_MAP_W, Math.ceil((camX + W) / TP_TILE) + 1);
  const endTY = Math.min(TP_MAP_H, Math.ceil((camY + H) / TP_TILE) + 1);

  for (let ty = startTY; ty < endTY; ty++) {
    for (let tx = startTX; tx < endTX; tx++) {
      const sx = tx * TP_TILE - camX;
      const sy = ty * TP_TILE - camY;
      const tile = TP_MAP[ty]?.[tx];
      if (tile === undefined) continue;

      drawTradingPostTile(ctx, tile, sx, sy, tx, ty, time);
    }
  }

  // Draw decor items
  for (const d of TP_DECOR) {
    const sx = d.x * TP_TILE - camX;
    const sy = d.y * TP_TILE - camY;
    drawTradingPostDecor(ctx, d.type, sx, sy, time);
  }

  // Draw ambient particles (dust motes, golden shimmer, lantern flicker)
  renderTradingPostParticles(ctx, camX, camY);

  // Draw NPCs
  for (const npc of TP_NPCS) {
    drawTradingPostNPC(ctx, npc, camX, camY, time);
  }

  // Draw player
  const playerSX = tradingPostPlayerX * TP_TILE - camX;
  const playerSY = tradingPostPlayerY * TP_TILE - camY;

  // Player shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(playerSX, playerSY + 14, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Use the existing sprite system if available
  if (typeof drawSprite === 'function' && G.sprite !== undefined) {
    drawSprite(ctx, G.sprite, playerSX - 24, playerSY - 36, 2.5, tradingPostPlayerDir, Math.floor(tradingPostPlayerFrame) % 4);
  } else {
    // Fallback: simple colored circle
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
  const doorSX = 11 * TP_TILE - camX;
  const doorSY = 14 * TP_TILE - camY;
  const doorDist = Math.sqrt((tradingPostPlayerX - 11) ** 2 + (tradingPostPlayerY - 14) ** 2);
  if (doorDist < 2) {
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,255,200,${0.6 + Math.sin(time * 3) * 0.3})`;
    ctx.fillText('[E] Leave', doorSX + TP_TILE / 2, doorSY - 8);
  }

  // NPC prompts
  for (const npc of TP_NPCS) {
    const dist = Math.sqrt((tradingPostPlayerX - npc.x) ** 2 + (tradingPostPlayerY - npc.y) ** 2);
    if (dist < 2.5 && dist > 0.5) {
      const nsx = npc.x * TP_TILE - camX;
      const nsy = npc.y * TP_TILE - camY;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255,255,200,${0.5 + Math.sin(time * 2.5) * 0.3})`;
      ctx.fillText(`[E] Talk to ${npc.name}`, nsx, nsy - 42);
    }
  }

  // Interactive object prompts
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = Math.floor(tradingPostPlayerX) + dx;
      const ty = Math.floor(tradingPostPlayerY) + dy;
      if (tx >= 0 && tx < TP_MAP_W && ty >= 0 && ty < TP_MAP_H) {
        const tile = TP_MAP[ty][tx];
        let label = null;
        if (tile === TP.COUNTER) label = '[E] Trade';
        else if (tile === TP.GLASS) label = '[E] Examine';
        else if (tile === TP.SCALES) label = '[E] Appraise';
        else if (tile === TP.NOTICE) label = '[E] Read';
        else if (tile === TP.SHELF) label = '[E] Browse';
        else if (tile === TP.DTABLE) label = '[E] Inspect';
        if (label) {
          const osx = tx * TP_TILE - camX + TP_TILE / 2;
          const osy = ty * TP_TILE - camY - 4;
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
  const headerAlpha = Math.min(1, 0.7);
  ctx.fillStyle = `rgba(184,134,11,${headerAlpha})`;
  ctx.fillText('The Trading Post', W / 2, 28);
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(160,130,60,0.5)';
  ctx.fillText("Thorne's Goods & Appraisal", W / 2, 42);

  // Notification toast
  if (tradingPostNotification && tradingPostNotification.timer > 0) {
    const alpha = Math.min(1, tradingPostNotification.timer / 30);
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,220,140,${alpha})`;
    ctx.fillText(tradingPostNotification.text, W / 2, H - 40);
  }

  // ─── Dialogue overlay ───
  if (tradingPostDialogueActive && tradingPostDialogueData) {
    drawTradingPostDialogue(ctx, W, H);
  }

  // Vignette effect — warm earthy edges
  const vignette = ctx.createRadialGradient(W/2, H/2, Math.min(W,H) * 0.3, W/2, H/2, Math.max(W,H) * 0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(12,8,2,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}


// ═══════ TILE RENDERING ═══════

function drawTradingPostTile(ctx, tile, sx, sy, tx, ty, time) {
  const T = TP_TILE;

  switch (tile) {
    case TP.FLOOR: {
      // Wood plank floor — slightly warmer than cantina
      ctx.fillStyle = '#3d2c18';
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
      // Subtle warm ambient light variation
      const lightVar = Math.sin(tx * 1.1 + ty * 0.9) * 0.03;
      ctx.fillStyle = `rgba(220,180,100,${0.03 + lightVar})`;
      ctx.fillRect(sx, sy, T, T);
      break;
    }

    case TP.WALL: {
      // Stone wall — earthy tone
      ctx.fillStyle = '#2e2a24';
      ctx.fillRect(sx, sy, T, T);
      // Stone brick pattern
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      const brickOffset = (ty % 2) * (T / 2);
      ctx.strokeRect(sx + brickOffset, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset - T / 2, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset + T / 2, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset, sy + T / 2, T / 2, T / 2);
      // Slight color variation per brick
      ctx.fillStyle = `rgba(${55 + (tx * 7 % 15)},${50 + (ty * 11 % 12)},${40 + (tx * 3 % 10)},0.3)`;
      ctx.fillRect(sx, sy, T, T);
      break;
    }

    case TP.COUNTER: {
      // Merchant counter — rich dark wood with gold trim
      ctx.fillStyle = '#5a3818';
      ctx.fillRect(sx, sy, T, T);
      // Polished top surface highlight
      ctx.fillStyle = 'rgba(255,200,80,0.12)';
      ctx.fillRect(sx + 2, sy + 2, T - 4, T / 3);
      // Gold trim edges
      ctx.fillStyle = '#b8860b';
      ctx.fillRect(sx, sy, T, 2);
      ctx.fillRect(sx, sy + T - 2, T, 2);
      // Ledger lines detail
      ctx.strokeStyle = 'rgba(180,134,11,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy + T/2);
      ctx.lineTo(sx + T - 4, sy + T/2);
      ctx.stroke();
      break;
    }

    case TP.SHELF: {
      // Wall background
      drawTradingPostTile(ctx, TP.WALL, sx, sy, tx, ty, time);
      // Shelf planks
      ctx.fillStyle = '#6a4a28';
      ctx.fillRect(sx + 2, sy + T/4, T - 4, 4);
      ctx.fillRect(sx + 2, sy + T/2, T - 4, 4);
      ctx.fillRect(sx + 2, sy + T * 3/4, T - 4, 4);
      // Items on shelves — potions & supplies
      const itemColors = ['#44aa66', '#aa5544', '#4488aa', '#aaaa44', '#aa66aa'];
      // Top shelf items
      for (let i = 0; i < 3; i++) {
        const bx = sx + 6 + i * 13;
        ctx.fillStyle = itemColors[(tx + i) % itemColors.length];
        // Potion bottle shape
        ctx.fillRect(bx, sy + T/4 - 8, 6, 8);
        ctx.fillRect(bx + 1, sy + T/4 - 11, 4, 3);
      }
      // Middle shelf items
      for (let i = 0; i < 2; i++) {
        const bx = sx + 10 + i * 16;
        ctx.fillStyle = itemColors[(ty + i + 2) % itemColors.length];
        ctx.fillRect(bx, sy + T/2 - 7, 8, 7);
      }
      break;
    }

    case TP.DTABLE: {
      // Floor under table
      drawTradingPostTile(ctx, TP.FLOOR, sx, sy, tx, ty, time);
      // Display table — rectangular
      ctx.fillStyle = '#5a3a18';
      ctx.fillRect(sx + 4, sy + 4, T - 8, T - 8);
      // Cloth cover
      ctx.fillStyle = 'rgba(60,80,60,0.6)';
      ctx.fillRect(sx + 5, sy + 5, T - 10, T - 10);
      // Table edge highlight
      ctx.strokeStyle = '#7a5a28';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 4, sy + 4, T - 8, T - 8);
      // Small items on display
      ctx.fillStyle = '#ccc';
      ctx.fillRect(sx + 12, sy + 12, 8, 5);
      ctx.fillStyle = '#aaa';
      ctx.fillRect(sx + 24, sy + 16, 6, 6);
      break;
    }

    case TP.CRATE: {
      // Floor under
      drawTradingPostTile(ctx, TP.FLOOR, sx, sy, tx, ty, time);
      // Crate body — varies by position
      const crateHue = (tx * 13 + ty * 7) % 3;
      const crateColors = ['#6a4a20', '#5a3a18', '#7a5a28'];
      ctx.fillStyle = crateColors[crateHue];
      ctx.fillRect(sx + 5, sy + 3, T - 10, T - 6);
      // Plank lines on crate
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 5, sy + T/3);
      ctx.lineTo(sx + T - 5, sy + T/3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + 5, sy + T * 2/3);
      ctx.lineTo(sx + T - 5, sy + T * 2/3);
      ctx.stroke();
      // Cross brace
      ctx.strokeStyle = 'rgba(100,80,40,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + T/2, sy + 3);
      ctx.lineTo(sx + T/2, sy + T - 3);
      ctx.stroke();
      // Stamp mark
      ctx.fillStyle = 'rgba(180,60,60,0.3)';
      ctx.fillRect(sx + T/2 - 4, sy + T/2 - 4, 8, 8);
      break;
    }

    case TP.BARREL: {
      // Floor under
      drawTradingPostTile(ctx, TP.FLOOR, sx, sy, tx, ty, time);
      // Barrel body — varies by position
      const barrelHue = (tx * 11 + ty * 5) % 3;
      const barrelColors = ['#5a3a18', '#4a3018', '#6a4a22'];
      ctx.fillStyle = barrelColors[barrelHue];
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2, T/2 - 6, T/2 - 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Metal bands
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2 - 6, T/2 - 8, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2 + 6, T/2 - 8, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case TP.GLASS: {
      // Wall background
      drawTradingPostTile(ctx, TP.WALL, sx, sy, tx, ty, time);
      // Glass case frame
      ctx.fillStyle = '#4a3a2a';
      ctx.fillRect(sx + 3, sy + 3, T - 6, T - 6);
      // Glass pane (translucent blue-green)
      ctx.fillStyle = 'rgba(140,200,220,0.15)';
      ctx.fillRect(sx + 5, sy + 5, T - 10, T - 10);
      // Glass reflection shimmer
      const shimmer = Math.sin(time * 0.8 + tx * 1.5) * 0.05;
      ctx.fillStyle = `rgba(200,230,255,${0.1 + shimmer})`;
      ctx.beginPath();
      ctx.moveTo(sx + 8, sy + 6);
      ctx.lineTo(sx + 14, sy + 6);
      ctx.lineTo(sx + 8, sy + 16);
      ctx.closePath();
      ctx.fill();
      // Item inside — mysterious glow
      const glowPulse = Math.sin(time * 1.5 + ty) * 0.15;
      const itemGlow = ctx.createRadialGradient(sx + T/2, sy + T/2, 2, sx + T/2, sy + T/2, 14);
      itemGlow.addColorStop(0, `rgba(180,130,255,${0.4 + glowPulse})`);
      itemGlow.addColorStop(1, 'rgba(180,130,255,0)');
      ctx.fillStyle = itemGlow;
      ctx.fillRect(sx + 5, sy + 5, T - 10, T - 10);
      // Small item silhouette
      ctx.fillStyle = `rgba(220,200,255,${0.5 + glowPulse})`;
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2 + 2, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TP.SCALES: {
      // Floor under
      drawTradingPostTile(ctx, TP.FLOOR, sx, sy, tx, ty, time);
      // Scale base
      ctx.fillStyle = '#8a7a4a';
      ctx.fillRect(sx + T/2 - 3, sy + T/2, 6, T/2 - 4);
      // Base platform
      ctx.fillStyle = '#9a8a5a';
      ctx.fillRect(sx + T/2 - 10, sy + T - 8, 20, 4);
      // Balance beam
      const tilt = Math.sin(time * 0.8) * 2;
      ctx.strokeStyle = '#b8a060';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 14, sy + T/2 - 2 + tilt);
      ctx.lineTo(sx + T/2 + 14, sy + T/2 - 2 - tilt);
      ctx.stroke();
      // Center post top
      ctx.fillStyle = '#c0a060';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2 - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      // Left pan
      ctx.fillStyle = '#a09050';
      ctx.beginPath();
      ctx.ellipse(sx + T/2 - 14, sy + T/2 + 2 + tilt, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Right pan
      ctx.fillStyle = '#a09050';
      ctx.beginPath();
      ctx.ellipse(sx + T/2 + 14, sy + T/2 + 2 - tilt, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Chains
      ctx.strokeStyle = 'rgba(180,160,100,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 14, sy + T/2 - 2 + tilt);
      ctx.lineTo(sx + T/2 - 14, sy + T/2 + 2 + tilt);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + T/2 + 14, sy + T/2 - 2 - tilt);
      ctx.lineTo(sx + T/2 + 14, sy + T/2 + 2 - tilt);
      ctx.stroke();
      break;
    }

    case TP.NOTICE: {
      // Wall background
      drawTradingPostTile(ctx, TP.WALL, sx, sy, tx, ty, time);
      // Board frame
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(sx + 4, sy + 4, T - 8, T - 8);
      // Cork board surface
      ctx.fillStyle = '#a08050';
      ctx.fillRect(sx + 6, sy + 6, T - 12, T - 12);
      // Pinned notes
      const noteColors = ['#fffff0', '#ffe8c0', '#e8ffe0', '#ffe0e0'];
      for (let i = 0; i < 4; i++) {
        const nx = sx + 8 + (i % 2) * 16;
        const ny = sy + 8 + Math.floor(i / 2) * 14;
        const rot = ((i * 7 + tx) % 5 - 2) * 0.1;
        ctx.save();
        ctx.translate(nx + 6, ny + 5);
        ctx.rotate(rot);
        ctx.fillStyle = noteColors[i];
        ctx.fillRect(-6, -5, 12, 10);
        // Pin
        ctx.fillStyle = '#cc3333';
        ctx.beginPath();
        ctx.arc(0, -3, 2, 0, Math.PI * 2);
        ctx.fill();
        // Text lines
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-4, -1, 8, 1);
        ctx.fillRect(-4, 2, 6, 1);
        ctx.restore();
      }
      break;
    }

    case TP.COINS: {
      // Floor under
      drawTradingPostTile(ctx, TP.FLOOR, sx, sy, tx, ty, time);
      // Coin pile base
      ctx.fillStyle = '#b8960b';
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2 + 4, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Stacked coins
      for (let i = 0; i < 4; i++) {
        const cy = sy + T/2 + 2 - i * 3;
        ctx.fillStyle = `rgb(${195 + i * 10},${160 + i * 8},${20 + i * 5})`;
        ctx.beginPath();
        ctx.ellipse(sx + T/2, cy, 8 - i, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // Golden shimmer animation
      const shimmerPhase = Math.sin(time * 1.2 + tx * 2 + ty) * 0.15;
      const shimmerPhase2 = Math.cos(time * 1 + tx) * 0.1;
      const coinGlow = ctx.createRadialGradient(
        sx + T/2 + shimmerPhase * 8, sy + T/2 - 4, 1,
        sx + T/2, sy + T/2, 18
      );
      coinGlow.addColorStop(0, `rgba(255,215,0,${0.4 + shimmerPhase2})`);
      coinGlow.addColorStop(0.5, `rgba(255,200,50,${0.15 + shimmerPhase2 * 0.3})`);
      coinGlow.addColorStop(1, 'rgba(255,200,50,0)');
      ctx.fillStyle = coinGlow;
      ctx.fillRect(sx - 6, sy - 6, T + 12, T + 12);
      // Sparkle points
      const sparkle1 = (time * 1.5 + tx) % 6;
      if (sparkle1 < 1) {
        const sa = 1 - sparkle1;
        ctx.fillStyle = `rgba(255,255,200,${sa * 0.8})`;
        ctx.beginPath();
        ctx.arc(sx + T/2 + 6, sy + T/2 - 8, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      const sparkle2 = (time * 1.2 + ty + 2) % 5;
      if (sparkle2 < 1) {
        const sa = 1 - sparkle2;
        ctx.fillStyle = `rgba(255,255,220,${sa * 0.7})`;
        ctx.beginPath();
        ctx.arc(sx + T/2 - 5, sy + T/2 - 3, 1, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case TP.RUG: {
      // Floor first
      drawTradingPostTile(ctx, TP.FLOOR, sx, sy, tx, ty, time);
      // Rug — earthy green/brown tones
      ctx.fillStyle = 'rgba(60,80,40,0.45)';
      ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
      // Rug pattern border — gold trim
      ctx.strokeStyle = 'rgba(180,150,60,0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 5, sy + 5, T - 10, T - 10);
      // Center motif — merchant's star
      ctx.fillStyle = 'rgba(180,150,60,0.25)';
      ctx.beginPath();
      ctx.moveTo(sx + T/2, sy + 8);
      ctx.lineTo(sx + T - 8, sy + T/2);
      ctx.lineTo(sx + T/2, sy + T - 8);
      ctx.lineTo(sx + 8, sy + T/2);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case TP.CHAIR: {
      // Floor first
      drawTradingPostTile(ctx, TP.FLOOR, sx, sy, tx, ty, time);
      // Small chair
      ctx.fillStyle = '#4a3018';
      ctx.fillRect(sx + T/2 - 6, sy + T/2 - 4, 12, 10);
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(sx + T/2 - 5, sy + T/2 - 3, 10, 8);
      break;
    }

    case TP.DOOR: {
      // Floor first
      drawTradingPostTile(ctx, TP.FLOOR, sx, sy, tx, ty, time);
      // Doorframe
      ctx.fillStyle = '#5a4a30';
      ctx.fillRect(sx + T/2 - 10, sy + 2, 20, T - 4);
      // Door
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(sx + T/2 - 8, sy + 4, 16, T - 8);
      // Handle
      ctx.fillStyle = '#b8860b';
      ctx.beginPath();
      ctx.arc(sx + T/2 + 4, sy + T/2 + 2, 2, 0, Math.PI * 2);
      ctx.fill();
      // Light beam from outside
      const beamAlpha = 0.1 + Math.sin(time * 0.5) * 0.03;
      ctx.fillStyle = `rgba(200,210,180,${beamAlpha})`;
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 8, sy + T);
      ctx.lineTo(sx + T/2 - 20, sy + T + 30);
      ctx.lineTo(sx + T/2 + 20, sy + T + 30);
      ctx.lineTo(sx + T/2 + 8, sy + T);
      ctx.fill();
      break;
    }

    case TP.LANTERN: {
      // Floor under
      drawTradingPostTile(ctx, TP.FLOOR, sx, sy, tx, ty, time);
      // Post
      ctx.fillStyle = '#4a4a38';
      ctx.fillRect(sx + T/2 - 2, sy + 8, 4, T - 12);
      // Lantern housing
      ctx.fillStyle = '#6a5a28';
      ctx.fillRect(sx + T/2 - 5, sy + 4, 10, 8);
      // Lantern glow — warm golden
      const lFlicker = Math.sin(time * 1.5 + tx * 3) * 0.06;
      const lanternGlow = ctx.createRadialGradient(sx + T/2, sy + 8, 2, sx + T/2, sy + 8, 30);
      lanternGlow.addColorStop(0, `rgba(255,190,80,${0.4 + lFlicker})`);
      lanternGlow.addColorStop(1, 'rgba(255,190,80,0)');
      ctx.fillStyle = lanternGlow;
      ctx.fillRect(sx - 20, sy - 20, T + 40, T + 40);
      // Flame
      ctx.fillStyle = '#ffbb33';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + 8, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case TP.PILLAR: {
      // Floor under
      drawTradingPostTile(ctx, TP.FLOOR, sx, sy, tx, ty, time);
      // Wooden pillar (trading post = wood, not stone)
      ctx.fillStyle = '#5a4020';
      ctx.fillRect(sx + T/2 - 6, sy + 2, 12, T - 4);
      // Capital (top detail)
      ctx.fillStyle = '#6a5028';
      ctx.fillRect(sx + T/2 - 8, sy + 2, 16, 5);
      // Base
      ctx.fillStyle = '#6a5028';
      ctx.fillRect(sx + T/2 - 8, sy + T - 7, 16, 5);
      // Wood grain line
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + T/2, sy + 7);
      ctx.lineTo(sx + T/2, sy + T - 7);
      ctx.stroke();
      break;
    }
  }
}


// ═══════ NPC RENDERING ═══════

function drawTradingPostNPC(ctx, npc, camX, camY, time) {
  const sx = npc.x * TP_TILE - camX;
  const sy = npc.y * TP_TILE - camY;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 12, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = npc.color;
  ctx.fillRect(sx - 6, sy - 6, 12, 18);

  // Head
  const headBob = Math.sin(time * 1.5 + npc.x) * 1;
  ctx.fillStyle = npc.color;
  ctx.beginPath();
  ctx.arc(sx, sy - 12 + headBob, 8, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (face the player or their default direction)
  const eyeOffX = npc.facing === 'left' ? -2 : npc.facing === 'right' ? 2 : 0;
  const eyeOffY = npc.facing === 'up' ? -2 : 1;
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(sx - 3 + eyeOffX, sy - 13 + headBob + eyeOffY, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sx + 3 + eyeOffX, sy - 13 + headBob + eyeOffY, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Name tag
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = npc.color;
  ctx.fillText(npc.name, sx, sy - 24);

  // Special effects per NPC
  if (npc.id === 'merchant') {
    // Floating coin sparkle near the merchant
    const coinTime = time * 1.8;
    for (let i = 0; i < 2; i++) {
      const ct = (coinTime + i * 3) % 5;
      if (ct < 2.5) {
        const ca = 1 - ct / 2.5;
        const cx = sx + Math.sin(ct * 2 + i * 1.5) * 10;
        const cy = sy - 20 - ct * 6;
        ctx.fillStyle = `rgba(255,215,0,${ca * 0.6})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  if (npc.id === 'appraiser') {
    // Spectacle glint on Sage
    const glintTime = (time * 2) % 4;
    if (glintTime < 0.5) {
      const ga = 1 - glintTime / 0.5;
      ctx.fillStyle = `rgba(200,220,255,${ga * 0.6})`;
      ctx.beginPath();
      ctx.arc(sx - 2 + eyeOffX, sy - 14 + headBob + eyeOffY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Subtle book/scroll in hand
    ctx.fillStyle = 'rgba(200,180,140,0.7)';
    ctx.fillRect(sx + 4, sy + 2, 5, 7);
    ctx.strokeStyle = 'rgba(140,120,80,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx + 4, sy + 2, 5, 7);
  }
}


// ═══════ DECOR RENDERING ═══════

function drawTradingPostDecor(ctx, type, sx, sy, time) {
  if (type === 'coin_stack') {
    // Small stack of coins on counter
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = `rgb(${200 + i * 15},${170 + i * 10},${30 + i * 5})`;
      ctx.beginPath();
      ctx.ellipse(sx + 5, sy + 6 - i * 2, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Tiny shimmer
    const sh = Math.sin((time || 0) * 1.2) * 0.15;
    ctx.fillStyle = `rgba(255,255,200,${0.3 + sh})`;
    ctx.beginPath();
    ctx.arc(sx + 7, sy + 1, 1, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'potion') {
    // Potion bottle on display table
    const potionColor = sx > 200 ? '#44aa66' : '#aa4466';
    ctx.fillStyle = potionColor;
    ctx.fillRect(sx + 2, sy + 2, 5, 7);
    ctx.fillRect(sx + 3, sy - 1, 3, 3);
    // Cork
    ctx.fillStyle = '#b8a060';
    ctx.fillRect(sx + 3, sy - 2, 3, 2);
  } else if (type === 'gem') {
    // Small gem in exotic case
    const gemPulse = Math.sin((time || 0) * 2 + sx * 0.1) * 0.2;
    ctx.fillStyle = `rgba(130,80,200,${0.6 + gemPulse})`;
    ctx.beginPath();
    ctx.moveTo(sx + 5, sy);
    ctx.lineTo(sx + 9, sy + 4);
    ctx.lineTo(sx + 5, sy + 8);
    ctx.lineTo(sx + 1, sy + 4);
    ctx.closePath();
    ctx.fill();
    // Gem highlight
    ctx.fillStyle = `rgba(200,180,255,${0.4 + gemPulse})`;
    ctx.beginPath();
    ctx.arc(sx + 4, sy + 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'barrel_top') {
    ctx.fillStyle = '#5a3a18';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 10, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'sign') {
    // Hanging sign above counter
    ctx.fillStyle = '#5a4020';
    ctx.fillRect(sx - 12, sy, 24, 12);
    ctx.strokeStyle = '#7a5a30';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx - 12, sy, 24, 12);
    // Text on sign
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#daa520';
    ctx.fillText('TRADE', sx, sy + 8);
    // Chains holding sign
    ctx.strokeStyle = 'rgba(150,150,150,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx - 8, sy);
    ctx.lineTo(sx - 8, sy - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy);
    ctx.lineTo(sx + 8, sy - 6);
    ctx.stroke();
  }
}


// ═══════ DIALOGUE BOX ═══════

function drawTradingPostDialogue(ctx, W, H) {
  const d = tradingPostDialogueData;
  if (!d) return;

  // Dim background
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, W, H);

  // Dialogue box
  const boxW = Math.min(500, W - 40);
  const boxH = 120;
  const boxX = (W - boxW) / 2;
  const boxY = H - boxH - 30;

  // Box background
  ctx.fillStyle = 'rgba(20,16,8,0.92)';
  ctx.strokeStyle = d.color || '#b8860b';
  ctx.lineWidth = 2;
  tpRoundRect(ctx, boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  // Name plate
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = d.color || '#b8860b';
  ctx.fillText(d.name, boxX + 16, boxY + 22);

  // Dialogue text (word wrap)
  ctx.font = '12px monospace';
  ctx.fillStyle = '#ccc';
  tpWrapText(ctx, d.text, boxX + 16, boxY + 44, boxW - 32, 16);

  // Dismiss prompt
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(200,180,140,0.6)';
  ctx.fillText('[E / Click to close]', boxX + boxW - 12, boxY + boxH - 10);
}

// Helper: rounded rect
function tpRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Helper: word-wrapped text
function tpWrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lineY = y;
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, lineY);
}


// ═══════ AMBIENT PARTICLES ═══════

function createTradingPostParticle() {
  const type = Math.random();
  if (type < 0.35) {
    // Golden coin shimmer (near coin piles at roughly 10,2 and 12,2 and 10,10)
    const coinSpots = [
      { x: 10.5, y: 2.5 },
      { x: 12.5, y: 2.5 },
      { x: 10.5, y: 10.5 },
    ];
    const spot = coinSpots[Math.floor(Math.random() * coinSpots.length)];
    return {
      kind: 'coin_shimmer',
      x: (spot.x + (Math.random() - 0.5) * 1.5) * TP_TILE,
      y: (spot.y + (Math.random() - 0.5) * 1.5) * TP_TILE,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.8 - 0.2,
      life: 1,
      maxLife: 1.5 + Math.random() * 1.5,
      size: 1 + Math.random() * 1.5,
    };
  } else if (type < 0.65) {
    // Dust mote (anywhere in room)
    return {
      kind: 'dust',
      x: (2 + Math.random() * 18) * TP_TILE,
      y: (2 + Math.random() * 12) * TP_TILE,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.1,
      life: 1,
      maxLife: 3 + Math.random() * 4,
      size: 1 + Math.random(),
    };
  } else {
    // Lantern flicker mote (near lanterns at 6,4 and 15,4 and 5,10 and 16,10)
    const lanternSpots = [
      { x: 6, y: 4 },
      { x: 15, y: 4 },
      { x: 5, y: 10 },
      { x: 16, y: 10 },
    ];
    const spot = lanternSpots[Math.floor(Math.random() * lanternSpots.length)];
    return {
      kind: 'lantern',
      x: (spot.x + (Math.random() - 0.5) * 3) * TP_TILE,
      y: (spot.y + (Math.random() - 0.5) * 3) * TP_TILE,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.3,
      life: 1,
      maxLife: 2 + Math.random() * 2,
      size: 0.5 + Math.random(),
    };
  }
}

function updateTradingPostParticles(dt) {
  for (let i = tradingPostAmbientParticles.length - 1; i >= 0; i--) {
    const p = tradingPostAmbientParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) {
      tradingPostAmbientParticles.splice(i, 1);
    }
  }
  // Replenish
  while (tradingPostAmbientParticles.length < 8) {
    tradingPostAmbientParticles.push(createTradingPostParticle());
  }
}

function renderTradingPostParticles(ctx, camX, camY) {
  for (const p of tradingPostAmbientParticles) {
    const sx = p.x - camX;
    const sy = p.y - camY;
    const alpha = Math.min(1, p.life * 2) * 0.6;

    if (p.kind === 'coin_shimmer') {
      ctx.fillStyle = `rgba(255,215,${50 + Math.floor(p.size * 30)},${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'dust') {
      ctx.fillStyle = `rgba(200,180,140,${alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'lantern') {
      ctx.fillStyle = `rgba(255,200,100,${alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}


// ═══════ INTEGRATION HOOKS ═══════
// These are the touch points where this module connects to the existing game.
//
// 1. CALL enterTradingPost() when the player enters the trading post building on the overworld.
//    (e.g., replace or add alongside the existing building interaction in tryInteract())
//
// 2. In the main gameLoop(), add:
//      if (tradingPostActive) { updateTradingPost(dt, keys); return; }
//
// 3. In the main render(), add:
//      if (tradingPostActive) { renderTradingPost(ctx, W, H); return; }
//
// 4. In the keydown handler for 'e', add:
//      if (tradingPostActive) {
//        if (tradingPostDialogueActive) { closeTradingPostDialogue(); }
//        else { tradingPostInteract(); }
//        return;
//      }
//
// 5. In the Escape key handler, add:
//      if (tradingPostActive) {
//        if (tradingPostDialogueActive) { closeTradingPostDialogue(); }
//        else { exitTradingPost(); }
//        return;
//      }
//
// 6. (Optional) Click handler for dialogue dismiss:
//      if (tradingPostActive && tradingPostDialogueActive) { closeTradingPostDialogue(); }
//
// 7. The main counter interaction calls openMarket() if it exists,
//    which should open the existing market/trading modal overlay.
//
// That's it! The rest is self-contained.
