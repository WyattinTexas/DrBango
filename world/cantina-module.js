// ═══════════════════════════════════════════════════════════════
// THE FROZEN MUG — CANTINA INTERIOR MODULE
// Drop-in replacement for the modal cantina system.
// Uses the same canvas + movement system as the overworld.
// ═══════════════════════════════════════════════════════════════

// ─── CANTINA STATE ───
let cantinaActive = false;       // true when inside cantina
let cantinaPlayerX = 12;         // player position inside cantina (tiles)
let cantinaPlayerY = 15;         // starts near the door
let cantinaPlayerDir = 'up';
let cantinaPlayerFrame = 0;
let cantinaSavedOverworldX = 0;  // where player was on overworld
let cantinaSavedOverworldY = 0;
let cantinaAnimTime = 0;
let cantinaInteractCooldown = 0;
let cantinaNotification = null;  // { text, timer }
let cantinaAmbientParticles = [];

// ─── CANTINA MAP DIMENSIONS ───
const CANTINA_W = 24;
const CANTINA_H = 18;
const CANTINA_TILE = 48; // same as overworld TILE

// ─── CANTINA TILE TYPES ───
const CT = {
  FLOOR:    0,  // Wood plank floor
  WALL:     1,  // Stone wall (impassable)
  BAR:      2,  // Bar counter (impassable, interactive)
  STOOL:    3,  // Bar stool (walkable)
  TABLE:    4,  // Table (impassable)
  CHAIR:    5,  // Chair (walkable, sit emote)
  FIREPIT:  6,  // Firepit (impassable, warm glow)
  STAGE:    7,  // Stage platform (walkable)
  DOOR:     8,  // Exit door (walkable, triggers exit)
  RUG:      9,  // Decorative rug (walkable)
  BARREL:   10, // Barrel (impassable, decorative)
  SHELF:    11, // Shelf with bottles (impassable)
  STORAGE:  12, // Storage door (impassable, locked)
  PILLAR:   13, // Support pillar (impassable)
  PLANTER:  14, // Small planter box (impassable)
  BOOTH:    15, // Booth seating (walkable)
  GAME_TBL: 16, // Game table (impassable, interactive)
  LANTERN:  17, // Hanging lantern post (impassable)
};

// Impassable set for quick lookup
const CANTINA_IMPASSABLE = new Set([
  CT.WALL, CT.BAR, CT.TABLE, CT.FIREPIT, CT.BARREL,
  CT.SHELF, CT.STORAGE, CT.PILLAR, CT.PLANTER, CT.GAME_TBL, CT.LANTERN
]);

// ─── CANTINA MAP DATA ───
// 24 wide x 18 tall
// Legend: 0=floor, 1=wall, 2=bar, 3=stool, 4=table, 5=chair,
//         6=firepit, 7=stage, 8=door, 9=rug, 10=barrel, 11=shelf,
//         12=storage, 13=pillar, 14=planter, 15=booth, 16=game_table, 17=lantern
const CANTINA_MAP = [
  // y=0  — top wall
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  // y=1  — stage area (left) | shelf & bar top (right)
  [1,7,7,7,7,1,1,11,11,11,2,2,2,2,2,2,11,11,11,11,1,10,10,1],
  // y=2  — stage + bar area
  [1,7,7,7,7,1,0,0,0,0,2,0,0,0,0,2,0,0,0,0,1,0,10,1],
  // y=3  — stage exit + stools along bar
  [1,7,7,7,0,0,0,0,3,3,2,0,0,0,0,2,3,3,0,0,0,0,0,1],
  // y=4  — open floor
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // y=5  — booth nook (left wall) + main floor with tables
  [1,1,1,15,15,1,0,13,0,0,0,4,5,0,5,4,0,0,0,13,0,0,0,1],
  // y=6  — booth interior + scattered seating
  [1,15,15,0,15,1,0,0,0,5,0,0,9,9,0,0,5,0,0,0,0,0,0,1],
  // y=7  — booth nook wall + main rug area
  [1,1,1,15,0,0,0,0,0,0,9,9,9,9,9,9,0,0,0,0,0,0,0,1],
  // y=8  — open floor with rug
  [1,0,0,0,0,0,0,0,0,0,9,9,9,9,9,9,0,0,0,14,0,0,0,1],
  // y=9  — firepit nook (left) + open area + storage (right)
  [1,1,1,0,0,1,0,0,5,4,0,0,0,0,0,0,4,5,0,1,1,1,1,1],
  // y=10 — firepit area + storage
  [1,0,6,6,0,1,0,0,0,0,0,0,17,0,0,0,0,0,0,1,12,0,10,1],
  // y=11 — firepit glow + storage room
  [1,5,6,6,5,1,0,0,0,0,5,0,0,0,5,0,0,0,0,1,0,10,10,1],
  // y=12 — firepit exit + open floor
  [1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
  // y=13 — game corner (left) + open floor toward door
  [1,0,0,0,0,0,0,13,0,0,4,5,0,5,4,0,0,13,0,0,0,0,0,1],
  // y=14 — game table area + chairs
  [1,0,16,16,0,0,0,0,0,0,0,0,9,9,0,0,0,0,0,0,0,0,0,1],
  // y=15 — game corner seating + path to door
  [1,5,16,16,5,0,0,0,0,0,0,9,9,9,9,0,0,0,0,0,0,0,0,1],
  // y=16 — bottom area + exit door
  [1,0,0,0,0,0,14,0,0,0,0,0,9,9,0,0,0,0,14,0,0,0,8,1],
  // y=17 — bottom wall
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ─── CANTINA NPCs ───
const CANTINA_NPCS = [
  {
    id: 'bartender',
    name: 'Grix',
    title: 'Bartender',
    x: 13, y: 2,
    color: '#daa520',
    facing: 'down',
    dialogue: [
      "Welcome to The Frozen Mug! Warmest spot in all of Frost Valley.",
      "What'll it be? We've got Ember Ale, Frost Mead, and Spirit Brew.",
      "Heard some strange noises from the Volcanic Isles lately... adventurers say the ground itself is angry.",
      "That old timer by the fire? Been here longer than the walls. Knows things.",
      "Tip: the encounter zones glow brighter when the hunting's good. Watch for the pulse.",
    ],
  },
  {
    id: 'musician',
    name: 'Lyra',
    title: 'Bard',
    x: 2.5, y: 2,
    color: '#c080e0',
    facing: 'down',
    dialogue: [
      "*strums a haunting melody on a frost-crystal lute*",
      "Every spirit has a song, you know. You just have to listen.",
      "I once played for the Spirit King himself... or so I dreamed.",
      "This next one's called 'The Ballad of the Frozen Path.' Settle in.",
    ],
  },
  {
    id: 'oldtimer',
    name: 'Old Frost',
    title: 'Lorekeeper',
    x: 1.5, y: 11,
    color: '#88bbdd',
    facing: 'right',
    dialogue: [
      "Ah, young one. Sit. The fire's warm and my memory's long.",
      "In the old days, spirits roamed free. No catching, no battling. Just... coexistence.",
      "The Volcanic Isles weren't always fire and fury. Something woke beneath them.",
      "You want to be strong? Learn every spirit's nature. Dice favor the prepared.",
      "I've seen trainers come and go. The ones who last? They respect the spirits.",
    ],
  },
  {
    id: 'shady',
    name: '???',
    title: 'Hooded Figure',
    x: 1.5, y: 6,
    color: '#4a4a6a',
    facing: 'right',
    dialogue: [
      "...don't stare.",
      "You look like someone who can handle themselves. Interesting.",
      "There's a room in the back. Locked. Nobody asks about it. Smart.",
      "I deal in... information. The kind you can't find on any map.",
      "The spirits aren't the only things watching in the encounter zones. Remember that.",
    ],
  },
];

// ─── CANTINA AMBIENT ITEMS ───
// Small decorative details drawn on top of tiles
const CANTINA_DECOR = [
  { x: 12, y: 2.3, type: 'mug' },
  { x: 14, y: 2.3, type: 'mug' },
  { x: 11, y: 5, type: 'plate' },
  { x: 15, y: 5, type: 'plate' },
  { x: 10, y: 13, type: 'plate' },
  { x: 14, y: 13, type: 'mug' },
  { x: 21.5, y: 1.5, type: 'barrel_top' },
  { x: 22.5, y: 1.5, type: 'barrel_top' },
];


// ═══════ ENTER / EXIT ═══════

function enterCantina() {
  // Save overworld position
  cantinaSavedOverworldX = G.x;
  cantinaSavedOverworldY = G.y;

  // Switch to cantina mode
  cantinaActive = true;
  cantinaPlayerX = 22;    // start at door
  cantinaPlayerY = 16;
  cantinaPlayerDir = 'up';
  cantinaPlayerFrame = 0;
  cantinaAmbientParticles = [];
  cantinaNotification = { text: 'The Frozen Mug', timer: 180 };

  // Spawn initial ambient particles
  for (let i = 0; i < 12; i++) {
    cantinaAmbientParticles.push(createCantinaParticle());
  }
}

function exitCantina() {
  cantinaActive = false;

  // Restore overworld position (nudge slightly away from building so we don't re-enter)
  G.x = cantinaSavedOverworldX;
  G.y = cantinaSavedOverworldY + 1;
  G.direction = 'down';
}


// ═══════ MOVEMENT & COLLISION ═══════

function updateCantina(dt, keys) {
  if (!cantinaActive) return;

  cantinaAnimTime += dt;

  // Movement
  let dx = 0, dy = 0;
  const CANTINA_SPEED = 2.2;

  if (keys['w'] || keys['arrowup'])    dy = -CANTINA_SPEED;
  if (keys['s'] || keys['arrowdown'])  dy = CANTINA_SPEED;
  if (keys['a'] || keys['arrowleft'])  dx = -CANTINA_SPEED;
  if (keys['d'] || keys['arrowright']) dx = CANTINA_SPEED;

  // Diagonal normalization
  if (dx && dy) { dx *= 0.707; dy *= 0.707; }

  if (dx || dy) {
    // Update direction
    if (Math.abs(dx) > Math.abs(dy)) {
      cantinaPlayerDir = dx > 0 ? 'right' : 'left';
    } else {
      cantinaPlayerDir = dy > 0 ? 'down' : 'up';
    }
    cantinaPlayerFrame += dt * 6;
  }

  const step = 0.05;
  const newX = cantinaPlayerX + dx * step;
  const newY = cantinaPlayerY + dy * step;

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
      if (tx < 0 || tx >= CANTINA_W || ty < 0 || ty >= CANTINA_H) return false;
      if (CANTINA_IMPASSABLE.has(CANTINA_MAP[ty][tx])) return false;
    }
    return true;
  };

  // Slide movement (try X and Y independently)
  if (canMove(newX, cantinaPlayerY)) cantinaPlayerX = newX;
  if (canMove(cantinaPlayerX, newY)) cantinaPlayerY = newY;

  // Clamp
  cantinaPlayerX = Math.max(0.5, Math.min(CANTINA_W - 0.5, cantinaPlayerX));
  cantinaPlayerY = Math.max(0.5, Math.min(CANTINA_H - 0.5, cantinaPlayerY));

  // Exit door check
  const doorDist = Math.sqrt((cantinaPlayerX - 22) ** 2 + (cantinaPlayerY - 16) ** 2);
  if (doorDist < 0.8 && cantinaPlayerDir === 'down') {
    // Show "Press E to leave" prompt handled in render
  }

  // Interaction cooldown
  if (cantinaInteractCooldown > 0) cantinaInteractCooldown -= dt;

  // Update ambient particles
  updateCantinaParticles(dt);

  // Update notification
  if (cantinaNotification && cantinaNotification.timer > 0) {
    cantinaNotification.timer -= 1;
  }
}


// ═══════ INTERACTION ═══════

function cantinaInteract() {
  if (!cantinaActive) return;
  if (cantinaInteractCooldown > 0) return;
  cantinaInteractCooldown = 0.5;

  const px = cantinaPlayerX;
  const py = cantinaPlayerY;

  // Check exit door
  const doorDist = Math.sqrt((px - 22) ** 2 + (py - 16) ** 2);
  if (doorDist < 1.5) {
    exitCantina();
    return;
  }

  // Check NPC interaction (range 2 tiles)
  for (const npc of CANTINA_NPCS) {
    const dist = Math.sqrt((px - npc.x) ** 2 + (py - npc.y) ** 2);
    if (dist < 2.2) {
      const line = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
      showCantinaDialogue(npc.title ? `${npc.name} the ${npc.title}` : npc.name, line, npc.color);
      // Charisma XP for talking to cantina NPCs
      if (typeof addProfessionXP === 'function') addProfessionXP('charisma', 1);
      return;
    }
  }

  // Check bar counter interaction
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = Math.floor(px) + dx;
      const ty = Math.floor(py) + dy;
      if (tx >= 0 && tx < CANTINA_W && ty >= 0 && ty < CANTINA_H) {
        if (CANTINA_MAP[ty][tx] === CT.BAR) {
          showCantinaDialogue('The Bar', 'The counter is polished smooth from years of mugs sliding across it. A warm amber glow reflects off the surface.', '#daa520');
          return;
        }
        if (CANTINA_MAP[ty][tx] === CT.GAME_TBL) {
          showCantinaDialogue('Dice Table', 'A well-worn table with dice marks carved into the wood. Looks like someone left a game half-finished...', '#90b060');
          return;
        }
        if (CANTINA_MAP[ty][tx] === CT.STORAGE) {
          showCantinaDialogue('Locked Door', 'The door is firmly locked. Strange scratching sounds come from the other side...', '#8a4a4a');
          return;
        }
        if (CANTINA_MAP[ty][tx] === CT.FIREPIT) {
          showCantinaDialogue('The Firepit', 'Warm flames crackle and dance. The heat feels wonderful after the cold outside.', '#ff8844');
          // Small heal for sitting by the fire
          if (G && G.team) {
            G.team.forEach(ghost => {
              if (ghost && ghost.hp < ghost.maxHp) {
                ghost.hp = Math.min(ghost.maxHp, ghost.hp + 1);
              }
            });
            cantinaNotification = { text: 'The warmth soothes your spirits... (+1 HP)', timer: 120 };
          }
          return;
        }
      }
    }
  }

  // Check chair (sit emote)
  const tileUnder = CANTINA_MAP[Math.floor(py)]?.[Math.floor(px)];
  if (tileUnder === CT.CHAIR || tileUnder === CT.BOOTH) {
    cantinaNotification = { text: '*sits down*', timer: 90 };
    if (typeof addProfessionXP === 'function') addProfessionXP('charisma', 1);
    return;
  }
}

// ─── Cantina dialogue (uses the existing showDialogue if available, else custom) ───
let cantinaDialogueActive = false;
let cantinaDialogueData = null;

function showCantinaDialogue(name, text, color) {
  cantinaDialogueActive = true;
  cantinaDialogueData = { name, text, color: color || '#daa520' };
}

function closeCantinaDialogue() {
  cantinaDialogueActive = false;
  cantinaDialogueData = null;
}


// ═══════ RENDERING ═══════

function renderCantina(ctx, W, H) {
  if (!cantinaActive) return;

  const time = cantinaAnimTime;

  // Camera — center on player, but clamp so we don't show outside the map
  const mapPixelW = CANTINA_W * CANTINA_TILE;
  const mapPixelH = CANTINA_H * CANTINA_TILE;

  let camX, camY;
  if (mapPixelW <= W) {
    camX = (mapPixelW - W) / 2; // center small map
  } else {
    camX = cantinaPlayerX * CANTINA_TILE - W / 2;
    camX = Math.max(0, Math.min(mapPixelW - W, camX));
  }
  if (mapPixelH <= H) {
    camY = (mapPixelH - H) / 2;
  } else {
    camY = cantinaPlayerY * CANTINA_TILE - H / 2;
    camY = Math.max(0, Math.min(mapPixelH - H, camY));
  }

  // Background — dark tavern ambiance
  ctx.fillStyle = '#0a0808';
  ctx.fillRect(0, 0, W, H);

  // Draw tiles
  const startTX = Math.max(0, Math.floor(camX / CANTINA_TILE) - 1);
  const startTY = Math.max(0, Math.floor(camY / CANTINA_TILE) - 1);
  const endTX = Math.min(CANTINA_W, Math.ceil((camX + W) / CANTINA_TILE) + 1);
  const endTY = Math.min(CANTINA_H, Math.ceil((camY + H) / CANTINA_TILE) + 1);

  for (let ty = startTY; ty < endTY; ty++) {
    for (let tx = startTX; tx < endTX; tx++) {
      const sx = tx * CANTINA_TILE - camX;
      const sy = ty * CANTINA_TILE - camY;
      const tile = CANTINA_MAP[ty]?.[tx];
      if (tile === undefined) continue;

      drawCantinaTile(ctx, tile, sx, sy, tx, ty, time);
    }
  }

  // Draw decor items
  for (const d of CANTINA_DECOR) {
    const sx = d.x * CANTINA_TILE - camX;
    const sy = d.y * CANTINA_TILE - camY;
    drawCantinaDecor(ctx, d.type, sx, sy);
  }

  // Draw ambient particles (firepit sparks, dust motes, etc.)
  renderCantinaParticles(ctx, camX, camY);

  // Draw NPCs
  for (const npc of CANTINA_NPCS) {
    drawCantinaNPC(ctx, npc, camX, camY, time);
  }

  // Draw player
  const playerSX = cantinaPlayerX * CANTINA_TILE - camX;
  const playerSY = cantinaPlayerY * CANTINA_TILE - camY;

  // Player shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(playerSX, playerSY + 14, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Use the existing sprite system if available
  if (typeof drawSprite === 'function' && G.sprite !== undefined) {
    drawSprite(ctx, G.sprite, playerSX - 24, playerSY - 36, 2.5, cantinaPlayerDir, Math.floor(cantinaPlayerFrame) % 4);
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
  const doorSX = 22 * CANTINA_TILE - camX;
  const doorSY = 16 * CANTINA_TILE - camY;
  const doorDist = Math.sqrt((cantinaPlayerX - 22) ** 2 + (cantinaPlayerY - 16) ** 2);
  if (doorDist < 2) {
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,255,200,${0.6 + Math.sin(time * 3) * 0.3})`;
    ctx.fillText('[E] Leave', doorSX + CANTINA_TILE / 2, doorSY - 8);
  }

  // NPC prompts
  for (const npc of CANTINA_NPCS) {
    const dist = Math.sqrt((cantinaPlayerX - npc.x) ** 2 + (cantinaPlayerY - npc.y) ** 2);
    if (dist < 2.5 && dist > 0.5) {
      const nsx = npc.x * CANTINA_TILE - camX;
      const nsy = npc.y * CANTINA_TILE - camY;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255,255,200,${0.5 + Math.sin(time * 2.5) * 0.3})`;
      ctx.fillText(`[E] Talk to ${npc.name}`, nsx, nsy - 42);
    }
  }

  // Interactive object prompts
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = Math.floor(cantinaPlayerX) + dx;
      const ty = Math.floor(cantinaPlayerY) + dy;
      if (tx >= 0 && tx < CANTINA_W && ty >= 0 && ty < CANTINA_H) {
        const tile = CANTINA_MAP[ty][tx];
        let label = null;
        if (tile === CT.FIREPIT) label = '[E] Warm up';
        else if (tile === CT.GAME_TBL) label = '[E] Examine';
        else if (tile === CT.STORAGE) label = '[E] Locked...';
        if (label) {
          const osx = tx * CANTINA_TILE - camX + CANTINA_TILE / 2;
          const osy = ty * CANTINA_TILE - camY - 4;
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
  ctx.fillStyle = `rgba(218,165,32,${headerAlpha})`;
  ctx.fillText('The Frozen Mug', W / 2, 28);
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(180,140,60,0.5)';
  ctx.fillText('Polaris Cantina', W / 2, 42);

  // Notification toast
  if (cantinaNotification && cantinaNotification.timer > 0) {
    const alpha = Math.min(1, cantinaNotification.timer / 30);
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,220,140,${alpha})`;
    ctx.fillText(cantinaNotification.text, W / 2, H - 40);
  }

  // ─── Dialogue overlay ───
  if (cantinaDialogueActive && cantinaDialogueData) {
    drawCantinaDialogue(ctx, W, H);
  }

  // Vignette effect — warm amber edges
  const vignette = ctx.createRadialGradient(W/2, H/2, Math.min(W,H) * 0.3, W/2, H/2, Math.max(W,H) * 0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(10,5,0,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}


// ═══════ TILE RENDERING ═══════

function drawCantinaTile(ctx, tile, sx, sy, tx, ty, time) {
  const T = CANTINA_TILE;

  switch (tile) {
    case CT.FLOOR: {
      // Wood plank floor
      ctx.fillStyle = '#3a2a1a';
      ctx.fillRect(sx, sy, T, T);
      // Plank lines
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
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
      const lightVar = Math.sin(tx * 1.3 + ty * 0.7) * 0.03;
      ctx.fillStyle = `rgba(255,180,80,${0.03 + lightVar})`;
      ctx.fillRect(sx, sy, T, T);
      break;
    }

    case CT.WALL: {
      // Stone wall
      ctx.fillStyle = '#2a2a30';
      ctx.fillRect(sx, sy, T, T);
      // Stone brick pattern
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      const brickOffset = (ty % 2) * (T / 2);
      ctx.strokeRect(sx + brickOffset, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset - T / 2, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset + T / 2, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset, sy + T / 2, T / 2, T / 2);
      // Slight color variation per brick
      ctx.fillStyle = `rgba(${60 + (tx * 7 % 20)},${60 + (ty * 11 % 15)},${70 + (tx * 3 % 10)},0.3)`;
      ctx.fillRect(sx, sy, T, T);
      break;
    }

    case CT.BAR: {
      // Bar counter — dark polished wood
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(sx, sy, T, T);
      // Polished top surface highlight
      ctx.fillStyle = 'rgba(255,200,100,0.15)';
      ctx.fillRect(sx + 2, sy + 2, T - 4, T / 3);
      // Edge trim
      ctx.fillStyle = '#7a5a2a';
      ctx.fillRect(sx, sy, T, 3);
      ctx.fillRect(sx, sy + T - 3, T, 3);
      break;
    }

    case CT.STOOL: {
      // Floor first
      drawCantinaTile(ctx, CT.FLOOR, sx, sy, tx, ty, time);
      // Round stool
      ctx.fillStyle = '#5a4020';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a5a30';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case CT.TABLE: {
      // Floor under table
      drawCantinaTile(ctx, CT.FLOOR, sx, sy, tx, ty, time);
      // Round table top
      ctx.fillStyle = '#5a3a18';
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2, T/2 - 4, T/2 - 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Table edge highlight
      ctx.strokeStyle = '#7a5a28';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2, T/2 - 4, T/2 - 6, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case CT.CHAIR: {
      // Floor first
      drawCantinaTile(ctx, CT.FLOOR, sx, sy, tx, ty, time);
      // Small chair
      ctx.fillStyle = '#4a3018';
      ctx.fillRect(sx + T/2 - 6, sy + T/2 - 4, 12, 10);
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(sx + T/2 - 5, sy + T/2 - 3, 10, 8);
      break;
    }

    case CT.FIREPIT: {
      // Stone hearth base
      ctx.fillStyle = '#3a3030';
      ctx.fillRect(sx, sy, T, T);
      ctx.fillStyle = '#4a3a30';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2, T/2 - 4, 0, Math.PI * 2);
      ctx.fill();
      // Fire!
      const fireFlicker = Math.sin(time * 8 + tx) * 3;
      const fireFlicker2 = Math.cos(time * 6 + ty) * 2;
      // Outer glow
      const glowR = 20 + fireFlicker;
      const glow = ctx.createRadialGradient(sx + T/2, sy + T/2, 2, sx + T/2, sy + T/2, glowR);
      glow.addColorStop(0, 'rgba(255,120,20,0.8)');
      glow.addColorStop(0.5, 'rgba(255,80,10,0.3)');
      glow.addColorStop(1, 'rgba(255,40,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(sx - 10, sy - 10, T + 20, T + 20);
      // Flame shapes
      ctx.fillStyle = '#ff6610';
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 6, sy + T/2 + 5);
      ctx.quadraticCurveTo(sx + T/2 - 2 + fireFlicker2, sy + T/2 - 12 + fireFlicker, sx + T/2, sy + T/2 + 5);
      ctx.fill();
      ctx.fillStyle = '#ffaa20';
      ctx.beginPath();
      ctx.moveTo(sx + T/2, sy + T/2 + 3);
      ctx.quadraticCurveTo(sx + T/2 + 3 + fireFlicker, sy + T/2 - 8 + fireFlicker2, sx + T/2 + 6, sy + T/2 + 3);
      ctx.fill();
      ctx.fillStyle = '#ffdd60';
      ctx.beginPath();
      ctx.arc(sx + T/2 + fireFlicker2/2, sy + T/2 - 2 + fireFlicker/2, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case CT.STAGE: {
      // Raised wooden stage
      ctx.fillStyle = '#4a3520';
      ctx.fillRect(sx, sy, T, T);
      ctx.fillStyle = '#5a4028';
      ctx.fillRect(sx, sy, T, 3);
      // Plank lines
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(sx + i * (T/4), sy);
        ctx.lineTo(sx + i * (T/4), sy + T);
        ctx.stroke();
      }
      // Subtle spotlight glow
      const spotGlow = ctx.createRadialGradient(sx + T/2, sy + T/2, 0, sx + T/2, sy + T/2, T);
      spotGlow.addColorStop(0, 'rgba(255,220,160,0.08)');
      spotGlow.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.fillStyle = spotGlow;
      ctx.fillRect(sx - T/2, sy - T/2, T * 2, T * 2);
      break;
    }

    case CT.DOOR: {
      // Floor first
      drawCantinaTile(ctx, CT.FLOOR, sx, sy, tx, ty, time);
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
      const beamAlpha = 0.1 + Math.sin(time * 0.5) * 0.03;
      ctx.fillStyle = `rgba(180,200,255,${beamAlpha})`;
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 8, sy + T);
      ctx.lineTo(sx + T/2 - 20, sy + T + 30);
      ctx.lineTo(sx + T/2 + 20, sy + T + 30);
      ctx.lineTo(sx + T/2 + 8, sy + T);
      ctx.fill();
      break;
    }

    case CT.RUG: {
      // Floor first
      drawCantinaTile(ctx, CT.FLOOR, sx, sy, tx, ty, time);
      // Rug
      ctx.fillStyle = 'rgba(120,30,30,0.5)';
      ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
      // Rug pattern border
      ctx.strokeStyle = 'rgba(180,100,40,0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 5, sy + 5, T - 10, T - 10);
      // Center diamond pattern
      ctx.fillStyle = 'rgba(180,120,40,0.3)';
      ctx.beginPath();
      ctx.moveTo(sx + T/2, sy + 8);
      ctx.lineTo(sx + T - 8, sy + T/2);
      ctx.lineTo(sx + T/2, sy + T - 8);
      ctx.lineTo(sx + 8, sy + T/2);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case CT.BARREL: {
      // Floor under
      drawCantinaTile(ctx, CT.FLOOR, sx, sy, tx, ty, time);
      // Barrel body
      ctx.fillStyle = '#5a3a18';
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2, T/2 - 6, T/2 - 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Metal bands
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2 - 6, T/2 - 8, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2 + 6, T/2 - 8, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case CT.SHELF: {
      // Wall background
      drawCantinaTile(ctx, CT.WALL, sx, sy, tx, ty, time);
      // Shelf plank
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(sx + 2, sy + T/3, T - 4, 4);
      ctx.fillRect(sx + 2, sy + T * 2/3, T - 4, 4);
      // Bottles
      const bottleColors = ['#44aa44', '#aa4444', '#4444aa', '#aaaa44'];
      for (let i = 0; i < 3; i++) {
        const bx = sx + 8 + i * 12;
        ctx.fillStyle = bottleColors[(tx + i) % bottleColors.length];
        ctx.fillRect(bx, sy + T/3 - 10, 5, 10);
        ctx.fillRect(bx + 1, sy + T/3 - 14, 3, 4);
      }
      for (let i = 0; i < 2; i++) {
        const bx = sx + 12 + i * 14;
        ctx.fillStyle = bottleColors[(ty + i + 1) % bottleColors.length];
        ctx.fillRect(bx, sy + T * 2/3 - 10, 5, 10);
        ctx.fillRect(bx + 1, sy + T * 2/3 - 14, 3, 4);
      }
      break;
    }

    case CT.STORAGE: {
      // Wall background
      drawCantinaTile(ctx, CT.WALL, sx, sy, tx, ty, time);
      // Reinforced door
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(sx + 6, sy + 4, T - 12, T - 8);
      // Iron bands
      ctx.fillStyle = '#666';
      ctx.fillRect(sx + 6, sy + 10, T - 12, 3);
      ctx.fillRect(sx + 6, sy + T - 14, T - 12, 3);
      // Lock
      ctx.fillStyle = '#aa8833';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2 + 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#886622';
      ctx.fillRect(sx + T/2 - 1, sy + T/2 + 4, 2, 5);
      break;
    }

    case CT.PILLAR: {
      // Floor under
      drawCantinaTile(ctx, CT.FLOOR, sx, sy, tx, ty, time);
      // Stone pillar
      ctx.fillStyle = '#4a4a50';
      ctx.fillRect(sx + T/2 - 6, sy + 2, 12, T - 4);
      // Capital (top detail)
      ctx.fillStyle = '#5a5a60';
      ctx.fillRect(sx + T/2 - 8, sy + 2, 16, 5);
      // Base
      ctx.fillStyle = '#5a5a60';
      ctx.fillRect(sx + T/2 - 8, sy + T - 7, 16, 5);
      break;
    }

    case CT.PLANTER: {
      // Floor under
      drawCantinaTile(ctx, CT.FLOOR, sx, sy, tx, ty, time);
      // Planter box
      ctx.fillStyle = '#5a4020';
      ctx.fillRect(sx + 6, sy + T/2, T - 12, T/2 - 4);
      // Soil
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(sx + 8, sy + T/2 - 2, T - 16, 6);
      // Small plant
      ctx.fillStyle = '#3a8a2a';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2 - 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a6a1a';
      ctx.beginPath();
      ctx.arc(sx + T/2 + 4, sy + T/2 - 12, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case CT.BOOTH: {
      // Padded booth seat
      ctx.fillStyle = '#3a2a1a'; // wood floor base
      ctx.fillRect(sx, sy, T, T);
      ctx.fillStyle = '#6a2020'; // deep red upholstery
      ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
      ctx.fillStyle = '#7a2828';
      ctx.fillRect(sx + 4, sy + 4, T - 8, T - 8);
      // Button tuft detail
      ctx.fillStyle = '#5a1818';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case CT.GAME_TBL: {
      // Floor under
      drawCantinaTile(ctx, CT.FLOOR, sx, sy, tx, ty, time);
      // Green felt game table
      ctx.fillStyle = '#4a3018';
      ctx.fillRect(sx + 3, sy + 3, T - 6, T - 6);
      ctx.fillStyle = '#2a5a2a';
      ctx.fillRect(sx + 6, sy + 6, T - 12, T - 12);
      // Dice on table
      ctx.fillStyle = '#eee';
      ctx.fillRect(sx + 12, sy + 14, 7, 7);
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(sx + 15.5, sy + 17.5, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#eee';
      ctx.fillRect(sx + T - 18, sy + T - 20, 7, 7);
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(sx + T - 16, sy + T - 18, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx + T - 13, sy + T - 15, 1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case CT.LANTERN: {
      // Floor under
      drawCantinaTile(ctx, CT.FLOOR, sx, sy, tx, ty, time);
      // Post
      ctx.fillStyle = '#4a4a40';
      ctx.fillRect(sx + T/2 - 2, sy + 8, 4, T - 12);
      // Lantern housing
      ctx.fillStyle = '#6a5a30';
      ctx.fillRect(sx + T/2 - 5, sy + 4, 10, 8);
      // Lantern glow
      const lFlicker = Math.sin(time * 5 + tx * 3) * 0.1;
      const lanternGlow = ctx.createRadialGradient(sx + T/2, sy + 8, 2, sx + T/2, sy + 8, 30);
      lanternGlow.addColorStop(0, `rgba(255,200,100,${0.4 + lFlicker})`);
      lanternGlow.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = lanternGlow;
      ctx.fillRect(sx - 20, sy - 20, T + 40, T + 40);
      // Flame
      ctx.fillStyle = '#ffcc44';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + 8, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}


// ═══════ NPC RENDERING ═══════

function drawCantinaNPC(ctx, npc, camX, camY, time) {
  const sx = npc.x * CANTINA_TILE - camX;
  const sy = npc.y * CANTINA_TILE - camY;

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
  if (npc.id === 'musician') {
    // Floating music notes
    const noteTime = time * 2;
    for (let i = 0; i < 3; i++) {
      const nt = (noteTime + i * 2.1) % 6;
      if (nt < 4) {
        const na = 1 - nt / 4;
        const nx = sx + Math.sin(nt * 1.5 + i) * 12;
        const ny = sy - 20 - nt * 8;
        ctx.font = '10px serif';
        ctx.fillStyle = `rgba(200,160,240,${na * 0.7})`;
        ctx.fillText(i % 2 === 0 ? '\u266A' : '\u266B', nx, ny);
      }
    }
  }

  if (npc.id === 'shady') {
    // Dark hood shadow over face
    ctx.fillStyle = 'rgba(30,30,40,0.6)';
    ctx.beginPath();
    ctx.arc(sx, sy - 12 + headBob, 9, Math.PI, 0);
    ctx.fill();
  }
}


// ═══════ DECOR RENDERING ═══════

function drawCantinaDecor(ctx, type, sx, sy) {
  if (type === 'mug') {
    ctx.fillStyle = '#7a5a2a';
    ctx.fillRect(sx + 2, sy + 2, 8, 7);
    ctx.strokeStyle = '#7a5a2a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx + 11, sy + 5, 3, -Math.PI/2, Math.PI/2);
    ctx.stroke();
    // Foam
    ctx.fillStyle = 'rgba(255,250,220,0.6)';
    ctx.beginPath();
    ctx.ellipse(sx + 6, sy + 2, 5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'plate') {
    ctx.fillStyle = 'rgba(180,180,170,0.5)';
    ctx.beginPath();
    ctx.ellipse(sx + 6, sy + 4, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(140,140,130,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(sx + 6, sy + 4, 4, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'barrel_top') {
    ctx.fillStyle = '#5a3a18';
    ctx.beginPath();
    ctx.ellipse(sx, sy, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 10, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}


// ═══════ DIALOGUE BOX ═══════

function drawCantinaDialogue(ctx, W, H) {
  const d = cantinaDialogueData;
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
  ctx.fillStyle = 'rgba(20,15,10,0.92)';
  ctx.strokeStyle = d.color || '#daa520';
  ctx.lineWidth = 2;
  roundRect(ctx, boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  // Name plate
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = d.color || '#daa520';
  ctx.fillText(d.name, boxX + 16, boxY + 22);

  // Dialogue text (word wrap)
  ctx.font = '12px monospace';
  ctx.fillStyle = '#ccc';
  wrapText(ctx, d.text, boxX + 16, boxY + 44, boxW - 32, 16);

  // Dismiss prompt
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(200,180,140,0.6)';
  ctx.fillText('[E / Click to close]', boxX + boxW - 12, boxY + boxH - 10);
}

// Helper: rounded rect
function roundRect(ctx, x, y, w, h, r) {
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
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
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

function createCantinaParticle() {
  const type = Math.random();
  if (type < 0.4) {
    // Firepit spark
    return {
      kind: 'spark',
      x: (2.5 + Math.random()) * CANTINA_TILE,  // near firepit columns 2-3
      y: (10 + Math.random()) * CANTINA_TILE,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -Math.random() * 1.5 - 0.5,
      life: 1,
      maxLife: 1 + Math.random(),
      size: 1 + Math.random() * 2,
    };
  } else if (type < 0.7) {
    // Dust mote (anywhere in room)
    return {
      kind: 'dust',
      x: (2 + Math.random() * 20) * CANTINA_TILE,
      y: (2 + Math.random() * 14) * CANTINA_TILE,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.1,
      life: 1,
      maxLife: 3 + Math.random() * 4,
      size: 1 + Math.random(),
    };
  } else {
    // Lantern flicker mote
    return {
      kind: 'lantern',
      x: (7 + Math.random() * 12) * CANTINA_TILE,
      y: (4 + Math.random() * 10) * CANTINA_TILE,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.3,
      life: 1,
      maxLife: 2 + Math.random() * 2,
      size: 0.5 + Math.random(),
    };
  }
}

function updateCantinaParticles(dt) {
  for (let i = cantinaAmbientParticles.length - 1; i >= 0; i--) {
    const p = cantinaAmbientParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) {
      cantinaAmbientParticles.splice(i, 1);
    }
  }
  // Replenish
  while (cantinaAmbientParticles.length < 15) {
    cantinaAmbientParticles.push(createCantinaParticle());
  }
}

function renderCantinaParticles(ctx, camX, camY) {
  for (const p of cantinaAmbientParticles) {
    const sx = p.x - camX;
    const sy = p.y - camY;
    const alpha = Math.min(1, p.life * 2) * 0.6;

    if (p.kind === 'spark') {
      ctx.fillStyle = `rgba(255,${150 + Math.random() * 80},20,${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'dust') {
      ctx.fillStyle = `rgba(200,180,140,${alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'lantern') {
      ctx.fillStyle = `rgba(255,210,120,${alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}


// ═══════ INTEGRATION HOOKS ═══════
// These are the touch points where this module connects to the existing game.
//
// 1. REPLACE the openCantina() call in tryInteract() with enterCantina()
//
// 2. In the main gameLoop(), add at the top:
//      if (cantinaActive) { updateCantina(dt, keys); return; }
//
// 3. In the main render(), add at the top:
//      if (cantinaActive) { renderCantina(ctx, W, H); return; }
//
// 4. In the keydown handler for 'e', add:
//      if (cantinaActive) {
//        if (cantinaDialogueActive) { closeCantinaDialogue(); }
//        else { cantinaInteract(); }
//        return;
//      }
//
// 5. In the Escape key handler, add:
//      if (cantinaActive) {
//        if (cantinaDialogueActive) { closeCantinaDialogue(); }
//        else { exitCantina(); }
//        return;
//      }
//
// 6. (Optional) Click handler for dialogue dismiss:
//      if (cantinaActive && cantinaDialogueActive) { closeCantinaDialogue(); }
//
// That's it! The rest is self-contained.
