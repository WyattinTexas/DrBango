// ═══════════════════════════════════════════════════════════════
// VALKIN'S CASTLE — INTERIOR MODULE
// The final dungeon. Dark stone, blue fire, ancient power.
// Uses the same canvas + movement system as the overworld.
// ═══════════════════════════════════════════════════════════════

// ─── CASTLE STATE ───
let castleActive = false;
let castlePlayerX = 15;
let castlePlayerY = 22;
let castlePlayerDir = 'up';
let castlePlayerFrame = 0;
let castleSavedOverworldX = 0;
let castleSavedOverworldY = 0;
let castleAnimTime = 0;
let castleInteractCooldown = 0;
let castleNotification = null;  // { text, timer }
let castleAmbientParticles = [];
let castleChestOpened = false;  // once per day

// ─── CASTLE MAP DIMENSIONS ───
const CASTLE_W = 32;
const CASTLE_H = 24;
const CASTLE_TILE = 48;

// ─── CASTLE TILE TYPES ───
const CCT = {
  FLOOR:     0,   // Dark stone floor
  WALL:      1,   // Castle wall (impassable)
  THRONE:    2,   // Throne area (impassable, interactive)
  PILLAR:    3,   // Stone pillars (impassable)
  CARPET:    4,   // Red carpet runner (walkable)
  STAIRS:    5,   // Staircase markers (walkable)
  DOOR:      6,   // Exit door (triggers exit)
  BRAZIER:   7,   // Blue fire brazier (impassable, animated)
  CHEST:     8,   // Treasure chest (interactive)
  BOOKSHELF: 9,   // Library shelves (impassable, interactive)
  CELL:      10,  // Prison cell bars (impassable)
  ALTAR:     11,  // Dark altar (interactive)
};

// Impassable set
const CASTLE_IMPASSABLE = new Set([
  CCT.WALL, CCT.THRONE, CCT.PILLAR, CCT.BRAZIER,
  CCT.BOOKSHELF, CCT.CELL, CCT.ALTAR
]);

// ─── CASTLE MAP DATA ───
// 32 wide x 24 tall
// Level 3: Tower Study    (y: 0-7,   top)
// Level 2: Throne Room    (y: 8-15,  middle)
// Level 1: Grand Hall     (y: 16-23, bottom)
const CASTLE_MAP = [
  // ═══ LEVEL 3: TOWER STUDY (y=0-7) ═══
  // y=0  — top wall
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  // y=1  — study walls + bookshelves
  [1,1,1,1,1,1,1,1,1,1,9,9,9,0,0,0,0,0,0,9,9,9,1,1,1,1,1,1,1,1,1,1],
  // y=2  — study interior
  [1,1,1,1,1,1,1,1,1,1,9,0,0,0,0,0,0,0,0,0,0,9,1,1,1,1,1,1,1,1,1,1],
  // y=3  — chest + open space + window (decorative wall tile)
  [1,1,1,1,1,1,1,1,1,1,0,0,8,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1],
  // y=4  — open study floor
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,7,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1],
  // y=5  — bookshelves along walls
  [1,1,1,1,1,1,1,1,1,1,9,0,0,0,0,0,0,0,0,0,0,9,1,1,1,1,1,1,1,1,1,1],
  // y=6  — study exit with stairs down
  [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,5,5,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1],
  // y=7  — wall between study and throne room
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],

  // ═══ LEVEL 2: THRONE ROOM (y=8-15) ═══
  // y=8  — top wall of throne room + stairs up
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,5,5,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  // y=9  — throne area + side rooms start
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // y=10 — bookshelves (left) + open + prison cells (right)
  [1,9,9,9,0,0,7,0,0,0,0,0,3,0,4,4,4,4,0,3,0,0,0,0,10,0,10,0,10,0,0,1],
  // y=11 — library area + carpet + cells
  [1,9,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,10,0,10,0,10,0,0,1],
  // y=12 — library + altar corner + carpet + cells with scholar
  [1,0,0,11,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,10,0,10,0,10,0,0,1],
  // y=13 — open throne room floor + cells
  [1,0,0,0,0,0,0,0,0,0,0,0,3,0,4,4,4,4,0,3,0,0,0,0,0,0,0,0,0,0,0,1],
  // y=14 — braziers + passage to grand hall
  [1,0,0,0,0,0,7,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,7,0,0,0,0,0,1],
  // y=15 — wall between throne room and grand hall
  [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],

  // ═══ LEVEL 1: GRAND HALL (y=16-23) ═══
  // y=16 — top wall of grand hall + entrance from throne room
  [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
  // y=17 — open hall + braziers flanking carpet
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // y=18 — pillars + carpet
  [1,0,0,0,3,0,0,0,0,0,0,7,0,0,4,4,4,4,0,0,7,0,0,0,0,0,0,3,0,0,0,1],
  // y=19 — wide open hall
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // y=20 — pillars + carpet
  [1,0,0,0,3,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,3,0,0,0,1],
  // y=21 — braziers flanking carpet near door
  [1,0,0,0,0,0,0,0,0,0,0,7,0,0,4,4,4,4,0,0,7,0,0,0,0,0,0,0,0,0,0,1],
  // y=22 — approach to door
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // y=23 — bottom wall + exit door
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,6,6,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ─── CASTLE NPCs ───
const CASTLE_NPCS = [
  {
    id: 'valkins_echo',
    name: "Valkin's Echo",
    title: 'Phantom',
    x: 16, y: 9,
    color: '#8040c0',
    facing: 'down',
    ghost: true,  // special rendering
    dialogue: [
      "You dare enter my domain? Foolish... but brave.",
      "I am not Valkin. I am what remains. An echo of will.",
      "The Overworld was mine to shape. The spirits... they were mine to command.",
      "The Mask of Destiny was never meant for mortals. It chooses its wearer.",
      "Power is not taken. It is inherited through sacrifice.",
      "Do you feel the curse? It seeps through the stones. It always has.",
      "Leon sought me out once. He left... changed. As will you.",
    ],
  },
  {
    id: 'imprisoned_scholar',
    name: 'Archivist Maren',
    title: 'Imprisoned Scholar',
    x: 25, y: 12,
    color: '#7a8a6a',
    facing: 'left',
    ghost: false,
    dialogue: [
      "Please... I've been here so long. The cells hold no one, yet I cannot leave.",
      "The Mask of Destiny has three fragments. I found the first in the Volcanic Isles.",
      "Valkin shattered the Mask himself. He feared its power... even more than his own.",
      "There's a chest upstairs. The tower study. It holds something important. I can feel it.",
      "The bookshelves here... they contain the true history. Not the one the spirits tell.",
      "If you find all three fragments, bring them to the altar. But be warned...",
    ],
  },
];

// ─── CASTLE LORE SNIPPETS ───
const CASTLE_BOOKSHELF_LORE = [
  "In the age before the Spiritkin, there was only the Veil — an endless twilight between worlds.",
  "Valkin was not the first to claim the Overworld. He was simply the last to survive it.",
  "The Curse of Binding: any spirit that enters the castle is bound to its master's will.",
  "Three seals hold the Overworld together. Break them, and reality folds.",
  "The Spirit King's true name was struck from every record. Even the stones forgot.",
  "Leon's journal, entry 42: 'I found the castle. Empty. But the throne still hums.'",
  "The Mask of Destiny was forged from crystallized spirit energy — pure will given form.",
  "Valkin's last words before vanishing: 'I will return when the Veil tears again.'",
  "Ancient diagram: the Overworld sits atop the Underworld. The castle is the pivot.",
  "Forbidden text: to resurrect a fallen Spiritkin, one must offer equal life force.",
];


// ═══════ ENTER / EXIT ═══════

function enterCastle() {
  castleSavedOverworldX = G.x;
  castleSavedOverworldY = G.y;

  castleActive = true;
  castlePlayerX = 15.5;   // start at bottom door
  castlePlayerY = 22;
  castlePlayerDir = 'up';
  castlePlayerFrame = 0;
  castleAmbientParticles = [];
  castleNotification = { text: "Valkin's Castle", timer: 180 };

  // Check daily chest reset
  const today = new Date().toDateString();
  if (localStorage.getItem('castle_chest_day') !== today) {
    castleChestOpened = false;
  } else {
    castleChestOpened = true;
  }

  // Spawn initial ambient particles
  for (let i = 0; i < 20; i++) {
    castleAmbientParticles.push(createCastleParticle());
  }
}

function exitCastle() {
  castleActive = false;
  G.x = castleSavedOverworldX;
  G.y = castleSavedOverworldY + 1;
  G.direction = 'down';
}


// ═══════ MOVEMENT & COLLISION ═══════

function updateCastle(dt, keys) {
  if (!castleActive) return;

  castleAnimTime += dt;

  // Movement
  let dx = 0, dy = 0;
  const CASTLE_SPEED = 2.2;

  if (keys['w'] || keys['arrowup'])    dy = -CASTLE_SPEED;
  if (keys['s'] || keys['arrowdown'])  dy = CASTLE_SPEED;
  if (keys['a'] || keys['arrowleft'])  dx = -CASTLE_SPEED;
  if (keys['d'] || keys['arrowright']) dx = CASTLE_SPEED;

  // Diagonal normalization
  if (dx && dy) { dx *= 0.707; dy *= 0.707; }

  if (dx || dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      castlePlayerDir = dx > 0 ? 'right' : 'left';
    } else {
      castlePlayerDir = dy > 0 ? 'down' : 'up';
    }
    castlePlayerFrame += dt * 6;
  }

  const step = 0.05;
  const newX = castlePlayerX + dx * step;
  const newY = castlePlayerY + dy * step;

  // Collision check — 4 corners of a 0.6-wide hitbox
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
      if (tx < 0 || tx >= CASTLE_W || ty < 0 || ty >= CASTLE_H) return false;
      if (CASTLE_IMPASSABLE.has(CASTLE_MAP[ty][tx])) return false;
    }
    return true;
  };

  // Slide movement
  if (canMove(newX, castlePlayerY)) castlePlayerX = newX;
  if (canMove(castlePlayerX, newY)) castlePlayerY = newY;

  // Clamp
  castlePlayerX = Math.max(0.5, Math.min(CASTLE_W - 0.5, castlePlayerX));
  castlePlayerY = Math.max(0.5, Math.min(CASTLE_H - 0.5, castlePlayerY));

  // Interaction cooldown
  if (castleInteractCooldown > 0) castleInteractCooldown -= dt;

  // Update ambient particles
  updateCastleParticles(dt);

  // Update notification
  if (castleNotification && castleNotification.timer > 0) {
    castleNotification.timer -= 1;
  }
}


// ═══════ INTERACTION ═══════

function castleInteract() {
  if (!castleActive) return;
  if (castleInteractCooldown > 0) return;
  castleInteractCooldown = 0.5;

  const px = castlePlayerX;
  const py = castlePlayerY;

  // Check exit door (bottom center)
  const doorDist1 = Math.sqrt((px - 15.5) ** 2 + (py - 23) ** 2);
  const doorDist2 = Math.sqrt((px - 16.5) ** 2 + (py - 23) ** 2);
  if (Math.min(doorDist1, doorDist2) < 1.5) {
    exitCastle();
    return;
  }

  // Check NPC interaction (range 2.2 tiles)
  for (const npc of CASTLE_NPCS) {
    const dist = Math.sqrt((px - npc.x) ** 2 + (py - npc.y) ** 2);
    if (dist < 2.5) {
      const line = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
      showCastleDialogue(npc.title ? `${npc.name} the ${npc.title}` : npc.name, line, npc.color);
      if (typeof addProfessionXP === 'function') addProfessionXP('charisma', 2);
      return;
    }
  }

  // Check nearby tiles for interactive objects
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = Math.floor(px) + dx;
      const ty = Math.floor(py) + dy;
      if (tx >= 0 && tx < CASTLE_W && ty >= 0 && ty < CASTLE_H) {
        const tile = CASTLE_MAP[ty][tx];

        if (tile === CCT.THRONE) {
          showCastleDialogue('The Throne', "The throne is cold. Valkin's presence lingers. Dark energy pulses through the armrests, as if waiting for its master's return.", '#8040c0');
          return;
        }

        if (tile === CCT.BOOKSHELF) {
          const snippet = CASTLE_BOOKSHELF_LORE[Math.floor(Math.random() * CASTLE_BOOKSHELF_LORE.length)];
          showCastleDialogue('Ancient Tome', snippet, '#6a7a9a');
          if (typeof addProfessionXP === 'function') addProfessionXP('charisma', 1);
          return;
        }

        if (tile === CCT.CHEST) {
          if (!castleChestOpened) {
            castleChestOpened = true;
            localStorage.setItem('castle_chest_day', new Date().toDateString());
            // Give rewards
            if (G && G.coins !== undefined) G.coins += 25;
            if (G && G.maskFragments !== undefined) {
              G.maskFragments = (G.maskFragments || 0) + 1;
            } else if (G) {
              G.maskFragments = 1;
            }
            showCastleDialogue('Treasure Chest', 'You found a Mask Fragment and 25 coins! The fragment pulses with ancient energy.', '#daa520');
            castleNotification = { text: '+1 Mask Fragment, +25 Coins', timer: 150 };
            if (typeof saveGame === 'function') saveGame();
          } else {
            showCastleDialogue('Treasure Chest', 'The chest is empty. Its treasures have already been claimed today.', '#888');
          }
          return;
        }

        if (tile === CCT.ALTAR) {
          showCastleDialogue('Dark Altar', "Dark energy pulses from the altar. You feel Valkin's curse here. The stone is warm to the touch, though the room is freezing.", '#a040a0');
          // Small curse effect — slight HP drain for atmosphere
          if (G && G.team) {
            const active = G.team.find(g => g && g.hp > 1);
            if (active) {
              active.hp = Math.max(1, active.hp - 1);
              castleNotification = { text: 'The curse drains your spirit... (-1 HP)', timer: 120 };
            }
          }
          return;
        }

        if (tile === CCT.CELL) {
          showCastleDialogue('Prison Cell', "The cells are empty now. But scratches on the walls tell stories. Names, dates, pleas for mercy — all carved by forgotten prisoners.", '#6a6a7a');
          return;
        }
      }
    }
  }

  // Check stairs — notify which level
  const tileUnder = CASTLE_MAP[Math.floor(py)]?.[Math.floor(px)];
  if (tileUnder === CCT.STAIRS) {
    if (py < 8) {
      castleNotification = { text: 'Descending to Throne Room...', timer: 90 };
    } else if (py < 16) {
      if (py <= 9) {
        castleNotification = { text: 'Ascending to Tower Study...', timer: 90 };
      } else {
        castleNotification = { text: 'Descending to Grand Hall...', timer: 90 };
      }
    }
  }
}


// ─── Castle dialogue ───
let castleDialogueActive = false;
let castleDialogueData = null;

function showCastleDialogue(name, text, color) {
  castleDialogueActive = true;
  castleDialogueData = { name, text, color: color || '#8040c0' };
}

function closeCastleDialogue() {
  castleDialogueActive = false;
  castleDialogueData = null;
}


// ═══════ RENDERING ═══════

function renderCastle(ctx, W, H) {
  if (!castleActive) return;

  const time = castleAnimTime;

  // Camera — center on player, clamp to map bounds
  const mapPixelW = CASTLE_W * CASTLE_TILE;
  const mapPixelH = CASTLE_H * CASTLE_TILE;

  let camX, camY;
  if (mapPixelW <= W) {
    camX = (mapPixelW - W) / 2;
  } else {
    camX = castlePlayerX * CASTLE_TILE - W / 2;
    camX = Math.max(0, Math.min(mapPixelW - W, camX));
  }
  if (mapPixelH <= H) {
    camY = (mapPixelH - H) / 2;
  } else {
    camY = castlePlayerY * CASTLE_TILE - H / 2;
    camY = Math.max(0, Math.min(mapPixelH - H, camY));
  }

  // Background — deep dark void
  ctx.fillStyle = '#08060e';
  ctx.fillRect(0, 0, W, H);

  // Draw tiles
  const startTX = Math.max(0, Math.floor(camX / CASTLE_TILE) - 1);
  const startTY = Math.max(0, Math.floor(camY / CASTLE_TILE) - 1);
  const endTX = Math.min(CASTLE_W, Math.ceil((camX + W) / CASTLE_TILE) + 1);
  const endTY = Math.min(CASTLE_H, Math.ceil((camY + H) / CASTLE_TILE) + 1);

  for (let ty = startTY; ty < endTY; ty++) {
    for (let tx = startTX; tx < endTX; tx++) {
      const sx = tx * CASTLE_TILE - camX;
      const sy = ty * CASTLE_TILE - camY;
      const tile = CASTLE_MAP[ty]?.[tx];
      if (tile === undefined) continue;
      drawCastleTile(ctx, tile, sx, sy, tx, ty, time);
    }
  }

  // Draw ambient particles (blue sparks, dust)
  renderCastleParticles(ctx, camX, camY);

  // Draw NPCs
  for (const npc of CASTLE_NPCS) {
    drawCastleNPC(ctx, npc, camX, camY, time);
  }

  // Draw player
  const playerSX = castlePlayerX * CASTLE_TILE - camX;
  const playerSY = castlePlayerY * CASTLE_TILE - camY;

  // Player shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(playerSX, playerSY + 14, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Use existing sprite system if available
  if (typeof drawSprite === 'function' && G.sprite !== undefined) {
    drawSprite(ctx, G.sprite, playerSX - 24, playerSY - 36, 2.5, castlePlayerDir, Math.floor(castlePlayerFrame) % 4);
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
  const doorDist = Math.min(
    Math.sqrt((castlePlayerX - 15.5) ** 2 + (castlePlayerY - 23) ** 2),
    Math.sqrt((castlePlayerX - 16.5) ** 2 + (castlePlayerY - 23) ** 2)
  );
  if (doorDist < 2) {
    const doorSX = 15.5 * CASTLE_TILE - camX;
    const doorSY = 23 * CASTLE_TILE - camY;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(180,200,255,${0.6 + Math.sin(time * 3) * 0.3})`;
    ctx.fillText('[E] Leave', doorSX + CASTLE_TILE / 2, doorSY - 8);
  }

  // NPC prompts
  for (const npc of CASTLE_NPCS) {
    const dist = Math.sqrt((castlePlayerX - npc.x) ** 2 + (castlePlayerY - npc.y) ** 2);
    if (dist < 2.8 && dist > 0.5) {
      const nsx = npc.x * CASTLE_TILE - camX;
      const nsy = npc.y * CASTLE_TILE - camY;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(180,160,255,${0.5 + Math.sin(time * 2.5) * 0.3})`;
      ctx.fillText(`[E] Talk to ${npc.name}`, nsx, nsy - 42);
    }
  }

  // Interactive object prompts
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = Math.floor(castlePlayerX) + dx;
      const ty = Math.floor(castlePlayerY) + dy;
      if (tx >= 0 && tx < CASTLE_W && ty >= 0 && ty < CASTLE_H) {
        const tile = CASTLE_MAP[ty][tx];
        let label = null;
        if (tile === CCT.THRONE) label = '[E] Examine Throne';
        else if (tile === CCT.BOOKSHELF) label = '[E] Read';
        else if (tile === CCT.CHEST) label = castleChestOpened ? '[E] Empty Chest' : '[E] Open Chest';
        else if (tile === CCT.ALTAR) label = '[E] Touch Altar';
        else if (tile === CCT.CELL) label = '[E] Examine Cell';
        if (label) {
          const osx = tx * CASTLE_TILE - camX + CASTLE_TILE / 2;
          const osy = ty * CASTLE_TILE - camY - 4;
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = `rgba(180,160,255,${0.5 + Math.sin(time * 2) * 0.3})`;
          ctx.fillText(label, osx, osy);
        }
      }
    }
  }

  // ─── UI Overlays ───

  // Location header
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(140,80,200,0.8)';
  ctx.fillText("Valkin's Castle", W / 2, 28);

  // Sublabel based on player Y position
  let sublabel = 'Grand Hall';
  if (castlePlayerY < 8) sublabel = 'Tower Study';
  else if (castlePlayerY < 16) sublabel = 'Throne Room';
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(120,100,160,0.5)';
  ctx.fillText(sublabel, W / 2, 42);

  // Notification toast
  if (castleNotification && castleNotification.timer > 0) {
    const alpha = Math.min(1, castleNotification.timer / 30);
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(160,140,220,${alpha})`;
    ctx.fillText(castleNotification.text, W / 2, H - 40);
  }

  // ─── Dialogue overlay ───
  if (castleDialogueActive && castleDialogueData) {
    drawCastleDialogue(ctx, W, H);
  }

  // Vignette effect — cold dark purple edges
  const vignette = ctx.createRadialGradient(W/2, H/2, Math.min(W,H) * 0.25, W/2, H/2, Math.max(W,H) * 0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(8,4,16,0.65)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}


// ═══════ TILE RENDERING ═══════

function drawCastleTile(ctx, tile, sx, sy, tx, ty, time) {
  const T = CASTLE_TILE;

  switch (tile) {
    case CCT.FLOOR: {
      // Dark stone floor
      ctx.fillStyle = '#1a1020';
      ctx.fillRect(sx, sy, T, T);
      // Stone tile grid pattern
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 1, sy + 1, T - 2, T - 2);
      // Subtle variation per tile
      const v = Math.sin(tx * 2.7 + ty * 1.3) * 0.015;
      ctx.fillStyle = `rgba(100,60,140,${0.03 + v})`;
      ctx.fillRect(sx, sy, T, T);
      break;
    }

    case CCT.WALL: {
      // Black castle stone
      ctx.fillStyle = '#0a0810';
      ctx.fillRect(sx, sy, T, T);
      // Mortar lines
      ctx.strokeStyle = 'rgba(40,30,50,0.6)';
      ctx.lineWidth = 1;
      const brickOff = (ty % 2) * (T / 2);
      ctx.strokeRect(sx + brickOff, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOff - T / 2, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOff + T / 2, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOff, sy + T / 2, T / 2, T / 2);
      // Color variation
      ctx.fillStyle = `rgba(${20 + (tx * 5 % 10)},${15 + (ty * 7 % 10)},${30 + (tx * 3 % 8)},0.3)`;
      ctx.fillRect(sx, sy, T, T);
      break;
    }

    case CCT.THRONE: {
      // Floor under
      drawCastleTile(ctx, CCT.FLOOR, sx, sy, tx, ty, time);
      // Throne base — dark wood
      ctx.fillStyle = '#2a1a10';
      ctx.fillRect(sx + 4, sy + T/3, T - 8, T * 2/3 - 4);
      // Throne back
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(sx + 6, sy + 2, T - 12, T/3);
      // Gold trim
      ctx.fillStyle = '#daa520';
      ctx.fillRect(sx + 6, sy + 2, T - 12, 3);
      ctx.fillRect(sx + 6, sy + T/3, T - 12, 2);
      // Armrests
      ctx.fillStyle = '#daa520';
      ctx.fillRect(sx + 4, sy + T/3, 4, 12);
      ctx.fillRect(sx + T - 8, sy + T/3, 4, 12);
      // Crown emblem on back
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 6, sy + 12);
      ctx.lineTo(sx + T/2 - 4, sy + 6);
      ctx.lineTo(sx + T/2, sy + 10);
      ctx.lineTo(sx + T/2 + 4, sy + 6);
      ctx.lineTo(sx + T/2 + 6, sy + 12);
      ctx.closePath();
      ctx.fill();
      // Subtle dark glow
      const throneGlow = ctx.createRadialGradient(sx + T/2, sy + T/2, 2, sx + T/2, sy + T/2, T);
      throneGlow.addColorStop(0, 'rgba(100,40,160,0.1)');
      throneGlow.addColorStop(1, 'rgba(100,40,160,0)');
      ctx.fillStyle = throneGlow;
      ctx.fillRect(sx - T/2, sy - T/2, T * 2, T * 2);
      break;
    }

    case CCT.PILLAR: {
      // Floor under
      drawCastleTile(ctx, CCT.FLOOR, sx, sy, tx, ty, time);
      // Dark stone pillar
      ctx.fillStyle = '#28203a';
      ctx.fillRect(sx + T/2 - 7, sy + 2, 14, T - 4);
      // Capital
      ctx.fillStyle = '#3a2a4a';
      ctx.fillRect(sx + T/2 - 9, sy + 2, 18, 5);
      // Base
      ctx.fillStyle = '#3a2a4a';
      ctx.fillRect(sx + T/2 - 9, sy + T - 7, 18, 5);
      // Carved rune on pillar
      ctx.fillStyle = 'rgba(100,60,180,0.3)';
      ctx.beginPath();
      ctx.moveTo(sx + T/2, sy + T/3);
      ctx.lineTo(sx + T/2 + 4, sy + T/2);
      ctx.lineTo(sx + T/2, sy + T * 2/3);
      ctx.lineTo(sx + T/2 - 4, sy + T/2);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case CCT.CARPET: {
      // Floor first
      drawCastleTile(ctx, CCT.FLOOR, sx, sy, tx, ty, time);
      // Deep red carpet
      ctx.fillStyle = '#8a2020';
      ctx.fillRect(sx + 2, sy, T - 4, T);
      // Gold border dots
      ctx.fillStyle = '#daa520';
      const dotSpacing = 8;
      for (let i = 0; i < T; i += dotSpacing) {
        ctx.beginPath();
        ctx.arc(sx + 4, sy + i + dotSpacing/2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + T - 4, sy + i + dotSpacing/2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Center pattern
      ctx.fillStyle = 'rgba(180,140,40,0.15)';
      ctx.beginPath();
      ctx.moveTo(sx + T/2, sy + 4);
      ctx.lineTo(sx + T - 8, sy + T/2);
      ctx.lineTo(sx + T/2, sy + T - 4);
      ctx.lineTo(sx + 8, sy + T/2);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case CCT.STAIRS: {
      // Floor base
      drawCastleTile(ctx, CCT.FLOOR, sx, sy, tx, ty, time);
      // Step lines
      ctx.fillStyle = '#2a1a30';
      for (let i = 0; i < 5; i++) {
        const stepY = sy + i * (T / 5);
        const stepH = T / 5 - 2;
        ctx.fillRect(sx + 4, stepY, T - 8, stepH);
        // Step highlight
        ctx.fillStyle = '#3a2a40';
        ctx.fillRect(sx + 4, stepY, T - 8, 2);
        ctx.fillStyle = '#2a1a30';
      }
      // Staircase direction indicator
      ctx.fillStyle = 'rgba(100,80,180,0.3)';
      ctx.beginPath();
      ctx.moveTo(sx + T/2, sy + 4);
      ctx.lineTo(sx + T/2 + 6, sy + 14);
      ctx.lineTo(sx + T/2 - 6, sy + 14);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case CCT.DOOR: {
      // Floor first
      drawCastleTile(ctx, CCT.FLOOR, sx, sy, tx, ty, time);
      // Grand doorframe
      ctx.fillStyle = '#3a2a18';
      ctx.fillRect(sx + T/2 - 12, sy + 2, 24, T - 4);
      // Door panels
      ctx.fillStyle = '#2a1a0a';
      ctx.fillRect(sx + T/2 - 10, sy + 4, 20, T - 8);
      // Iron reinforcement bands
      ctx.fillStyle = '#555';
      ctx.fillRect(sx + T/2 - 10, sy + 10, 20, 2);
      ctx.fillRect(sx + T/2 - 10, sy + T - 14, 20, 2);
      // Handle
      ctx.fillStyle = '#aaa';
      ctx.beginPath();
      ctx.arc(sx + T/2 + 5, sy + T/2 + 2, 3, 0, Math.PI * 2);
      ctx.fill();
      // Light beam from outside
      const beamAlpha = 0.08 + Math.sin(time * 0.5) * 0.02;
      ctx.fillStyle = `rgba(140,160,200,${beamAlpha})`;
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 10, sy + T);
      ctx.lineTo(sx + T/2 - 24, sy + T + 30);
      ctx.lineTo(sx + T/2 + 24, sy + T + 30);
      ctx.lineTo(sx + T/2 + 10, sy + T);
      ctx.fill();
      break;
    }

    case CCT.BRAZIER: {
      // Floor under
      drawCastleTile(ctx, CCT.FLOOR, sx, sy, tx, ty, time);
      // Iron brazier bowl
      ctx.fillStyle = '#3a3a40';
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 10, sy + T/2 - 4);
      ctx.lineTo(sx + T/2 - 8, sy + T/2 + 8);
      ctx.lineTo(sx + T/2 + 8, sy + T/2 + 8);
      ctx.lineTo(sx + T/2 + 10, sy + T/2 - 4);
      ctx.closePath();
      ctx.fill();
      // Brazier stand
      ctx.fillStyle = '#2a2a30';
      ctx.fillRect(sx + T/2 - 3, sy + T/2 + 8, 6, 10);
      ctx.fillRect(sx + T/2 - 8, sy + T - 6, 16, 4);
      // BLUE FIRE!
      const flicker1 = Math.sin(time * 2 + tx * 2.3) * 3;
      const flicker2 = Math.cos(time * 1.5 + ty * 1.7) * 2;
      // Outer glow
      const bGlow = ctx.createRadialGradient(sx + T/2, sy + T/2 - 6, 2, sx + T/2, sy + T/2 - 6, 28 + flicker1);
      bGlow.addColorStop(0, 'rgba(40,120,255,0.7)');
      bGlow.addColorStop(0.4, 'rgba(20,80,200,0.3)');
      bGlow.addColorStop(1, 'rgba(10,40,120,0)');
      ctx.fillStyle = bGlow;
      ctx.fillRect(sx - 16, sy - 16, T + 32, T + 32);
      // Blue flame shapes
      ctx.fillStyle = '#2060dd';
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 6, sy + T/2);
      ctx.quadraticCurveTo(sx + T/2 - 2 + flicker2, sy + T/2 - 18 + flicker1, sx + T/2, sy + T/2);
      ctx.fill();
      ctx.fillStyle = '#40aaff';
      ctx.beginPath();
      ctx.moveTo(sx + T/2, sy + T/2 - 2);
      ctx.quadraticCurveTo(sx + T/2 + 3 + flicker1, sy + T/2 - 14 + flicker2, sx + T/2 + 6, sy + T/2 - 2);
      ctx.fill();
      // Bright cyan core
      ctx.fillStyle = '#80ddff';
      ctx.beginPath();
      ctx.arc(sx + T/2 + flicker2/2, sy + T/2 - 6 + flicker1/3, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case CCT.CHEST: {
      // Floor under
      drawCastleTile(ctx, CCT.FLOOR, sx, sy, tx, ty, time);
      if (castleChestOpened) {
        // Open chest
        ctx.fillStyle = '#4a3018';
        ctx.fillRect(sx + 8, sy + T/2, T - 16, T/2 - 6);
        // Open lid
        ctx.fillStyle = '#5a3a20';
        ctx.fillRect(sx + 6, sy + T/2 - 10, T - 12, 12);
        // Empty interior
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(sx + 10, sy + T/2 + 2, T - 20, T/2 - 10);
      } else {
        // Closed chest
        ctx.fillStyle = '#5a3a18';
        ctx.fillRect(sx + 8, sy + T/2 - 2, T - 16, T/2 - 4);
        // Lid
        ctx.fillStyle = '#6a4a28';
        ctx.fillRect(sx + 6, sy + T/2 - 8, T - 12, 10);
        // Metal clasp
        ctx.fillStyle = '#daa520';
        ctx.fillRect(sx + T/2 - 3, sy + T/2 - 4, 6, 6);
        // Gold glow
        const chestGlow = ctx.createRadialGradient(sx + T/2, sy + T/2, 2, sx + T/2, sy + T/2, 20);
        chestGlow.addColorStop(0, 'rgba(218,165,32,0.2)');
        chestGlow.addColorStop(1, 'rgba(218,165,32,0)');
        ctx.fillStyle = chestGlow;
        ctx.fillRect(sx, sy, T, T);
      }
      break;
    }

    case CCT.BOOKSHELF: {
      // Wall background
      drawCastleTile(ctx, CCT.WALL, sx, sy, tx, ty, time);
      // Shelf planks (dark wood)
      ctx.fillStyle = '#3a2818';
      ctx.fillRect(sx + 2, sy + T/3, T - 4, 4);
      ctx.fillRect(sx + 2, sy + T * 2/3, T - 4, 4);
      // Books (muted, ancient colors)
      const bookColors = ['#3a2a4a', '#4a3030', '#2a3a3a', '#4a4a2a', '#3a2030'];
      for (let i = 0; i < 4; i++) {
        const bx = sx + 5 + i * 10;
        ctx.fillStyle = bookColors[(tx + i) % bookColors.length];
        ctx.fillRect(bx, sy + T/3 - 12, 6, 12);
        // Spine detail
        ctx.fillStyle = 'rgba(200,180,120,0.2)';
        ctx.fillRect(bx + 2, sy + T/3 - 10, 2, 8);
      }
      for (let i = 0; i < 3; i++) {
        const bx = sx + 8 + i * 12;
        ctx.fillStyle = bookColors[(ty + i + 2) % bookColors.length];
        ctx.fillRect(bx, sy + T * 2/3 - 10, 6, 10);
      }
      break;
    }

    case CCT.CELL: {
      // Floor under
      drawCastleTile(ctx, CCT.FLOOR, sx, sy, tx, ty, time);
      // Iron bars
      ctx.strokeStyle = '#5a5a60';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const bx = sx + 6 + i * (T - 12) / 4;
        ctx.beginPath();
        ctx.moveTo(bx, sy + 2);
        ctx.lineTo(bx, sy + T - 2);
        ctx.stroke();
      }
      // Cross bar
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy + T/3);
      ctx.lineTo(sx + T - 4, sy + T/3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy + T * 2/3);
      ctx.lineTo(sx + T - 4, sy + T * 2/3);
      ctx.stroke();
      // Rust spots
      ctx.fillStyle = 'rgba(120,60,20,0.3)';
      ctx.beginPath();
      ctx.arc(sx + 12, sy + T/2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx + T - 14, sy + T/3 + 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case CCT.ALTAR: {
      // Floor under
      drawCastleTile(ctx, CCT.FLOOR, sx, sy, tx, ty, time);
      // Stone altar base
      ctx.fillStyle = '#1a1020';
      ctx.fillRect(sx + 6, sy + T/2, T - 12, T/2 - 4);
      // Altar top slab
      ctx.fillStyle = '#2a1a2a';
      ctx.fillRect(sx + 4, sy + T/2 - 4, T - 8, 8);
      // Dark runes carved into altar
      ctx.strokeStyle = 'rgba(160,40,160,0.4)';
      ctx.lineWidth = 1;
      // Rune circle
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2, 10, 0, Math.PI * 2);
      ctx.stroke();
      // Rune cross
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 8, sy + T/2);
      ctx.lineTo(sx + T/2 + 8, sy + T/2);
      ctx.moveTo(sx + T/2, sy + T/2 - 8);
      ctx.lineTo(sx + T/2, sy + T/2 + 8);
      ctx.stroke();
      // Pulsing dark glow
      const altarPulse = 0.15 + Math.sin(time * 2) * 0.1;
      const altarGlow = ctx.createRadialGradient(sx + T/2, sy + T/2, 2, sx + T/2, sy + T/2, 30);
      altarGlow.addColorStop(0, `rgba(160,40,160,${altarPulse})`);
      altarGlow.addColorStop(1, 'rgba(160,40,160,0)');
      ctx.fillStyle = altarGlow;
      ctx.fillRect(sx - 10, sy - 10, T + 20, T + 20);
      break;
    }
  }
}


// ═══════ NPC RENDERING ═══════

function drawCastleNPC(ctx, npc, camX, camY, time) {
  const sx = npc.x * CASTLE_TILE - camX;
  const sy = npc.y * CASTLE_TILE - camY;

  if (npc.ghost) {
    // Ghostly/phantom rendering — translucent, flickering
    const ghostAlpha = 0.4 + Math.sin(time * 1.2) * 0.15;
    const ghostFloat = Math.sin(time * 0.8) * 4;

    // Ghost glow
    const gGlow = ctx.createRadialGradient(sx, sy - 6 + ghostFloat, 4, sx, sy - 6 + ghostFloat, 30);
    gGlow.addColorStop(0, `rgba(120,60,200,${ghostAlpha * 0.3})`);
    gGlow.addColorStop(1, 'rgba(120,60,200,0)');
    ctx.fillStyle = gGlow;
    ctx.fillRect(sx - 30, sy - 36 + ghostFloat, 60, 60);

    // Ghost body (no shadow — floating)
    ctx.globalAlpha = ghostAlpha;
    ctx.fillStyle = npc.color;
    ctx.fillRect(sx - 6, sy - 6 + ghostFloat, 12, 18);

    // Ghost head
    ctx.beginPath();
    ctx.arc(sx, sy - 12 + ghostFloat, 8, 0, Math.PI * 2);
    ctx.fill();

    // Glowing eyes
    ctx.fillStyle = '#cc88ff';
    ctx.beginPath();
    ctx.arc(sx - 3, sy - 13 + ghostFloat, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 3, sy - 13 + ghostFloat, 2, 0, Math.PI * 2);
    ctx.fill();

    // Wispy trail below
    ctx.fillStyle = `rgba(120,60,200,${ghostAlpha * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(sx - 6, sy + 12 + ghostFloat);
    ctx.quadraticCurveTo(sx - 4, sy + 22 + ghostFloat, sx, sy + 18 + ghostFloat);
    ctx.quadraticCurveTo(sx + 4, sy + 22 + ghostFloat, sx + 6, sy + 12 + ghostFloat);
    ctx.fill();

    ctx.globalAlpha = 1;

    // Name tag
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(140,80,220,${ghostAlpha + 0.2})`;
    ctx.fillText(npc.name, sx, sy - 24 + ghostFloat);
  } else {
    // Normal NPC rendering (same as cantina pattern)
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
    ctx.beginPath();
    ctx.arc(sx, sy - 12 + headBob, 8, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeOffX = npc.facing === 'left' ? -2 : npc.facing === 'right' ? 2 : 0;
    const eyeOffY = npc.facing === 'up' ? -2 : 1;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(sx - 3 + eyeOffX, sy - 13 + headBob + eyeOffY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 3 + eyeOffX, sy - 13 + headBob + eyeOffY, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Prisoner chains (special for scholar)
    if (npc.id === 'imprisoned_scholar') {
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1.5;
      // Chain from wrist to wall
      ctx.beginPath();
      ctx.moveTo(sx + 6, sy + 2);
      ctx.quadraticCurveTo(sx + 14, sy + 8, sx + 18, sy - 4);
      ctx.stroke();
    }

    // Name tag
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = npc.color;
    ctx.fillText(npc.name, sx, sy - 24);
  }
}


// ═══════ DIALOGUE BOX ═══════

function drawCastleDialogue(ctx, W, H) {
  const d = castleDialogueData;
  if (!d) return;

  // Dim background
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, W, H);

  // Dialogue box
  const boxW = Math.min(520, W - 40);
  const boxH = 130;
  const boxX = (W - boxW) / 2;
  const boxY = H - boxH - 30;

  // Box background — darker than cantina
  ctx.fillStyle = 'rgba(12,8,20,0.94)';
  ctx.strokeStyle = d.color || '#8040c0';
  ctx.lineWidth = 2;

  // Rounded rect (inline, no dependency on cantina helpers)
  ctx.beginPath();
  const r = 8;
  ctx.moveTo(boxX + r, boxY);
  ctx.lineTo(boxX + boxW - r, boxY);
  ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + r);
  ctx.lineTo(boxX + boxW, boxY + boxH - r);
  ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - r, boxY + boxH);
  ctx.lineTo(boxX + r, boxY + boxH);
  ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - r);
  ctx.lineTo(boxX, boxY + r);
  ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Name plate
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = d.color || '#8040c0';
  ctx.fillText(d.name, boxX + 16, boxY + 22);

  // Dialogue text (word wrap — inline implementation)
  ctx.font = '12px monospace';
  ctx.fillStyle = '#bbb';
  const maxWidth = boxW - 32;
  const lineHeight = 16;
  const words = d.text.split(' ');
  let line = '';
  let lineY = boxY + 44;
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, boxX + 16, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, boxX + 16, lineY);

  // Dismiss prompt
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(160,140,200,0.6)';
  ctx.fillText('[E / Click to close]', boxX + boxW - 12, boxY + boxH - 10);
}


// ═══════ AMBIENT PARTICLES ═══════

function createCastleParticle() {
  const type = Math.random();
  if (type < 0.35) {
    // Blue flame spark (near braziers)
    // Brazier positions from map: (6,10), (6,14), (11,18), (11,21), (20,18), (20,21), (15,4), (25,14), (7,10)
    const brazierPositions = [
      [6, 10], [6, 14], [11, 18], [11, 21], [20, 18], [20, 21], [15, 4], [25, 14]
    ];
    const bp = brazierPositions[Math.floor(Math.random() * brazierPositions.length)];
    return {
      kind: 'spark',
      x: (bp[0] + 0.5 + (Math.random() - 0.5) * 0.5) * CASTLE_TILE,
      y: (bp[1] + 0.3) * CASTLE_TILE,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -Math.random() * 1.8 - 0.5,
      life: 1,
      maxLife: 0.8 + Math.random() * 0.8,
      size: 1 + Math.random() * 2,
    };
  } else if (type < 0.7) {
    // Floating dust mote (everywhere)
    return {
      kind: 'dust',
      x: (2 + Math.random() * 28) * CASTLE_TILE,
      y: (2 + Math.random() * 20) * CASTLE_TILE,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.08,
      life: 1,
      maxLife: 4 + Math.random() * 5,
      size: 0.8 + Math.random(),
    };
  } else {
    // Dark energy wisp (near throne & altar)
    return {
      kind: 'wisp',
      x: (12 + Math.random() * 8) * CASTLE_TILE,
      y: (8 + Math.random() * 6) * CASTLE_TILE,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.4 - 0.1,
      life: 1,
      maxLife: 2 + Math.random() * 3,
      size: 1 + Math.random() * 1.5,
    };
  }
}

function updateCastleParticles(dt) {
  for (let i = castleAmbientParticles.length - 1; i >= 0; i--) {
    const p = castleAmbientParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) {
      castleAmbientParticles.splice(i, 1);
    }
  }
  // Replenish — more particles than cantina (bigger, moodier space)
  while (castleAmbientParticles.length < 14) {
    castleAmbientParticles.push(createCastleParticle());
  }
}

function renderCastleParticles(ctx, camX, camY) {
  for (const p of castleAmbientParticles) {
    const sx = p.x - camX;
    const sy = p.y - camY;
    const alpha = Math.min(1, p.life * 2) * 0.6;

    if (p.kind === 'spark') {
      // Blue flame sparks
      ctx.fillStyle = `rgba(60,${140 + Math.floor(p.size * 30)},255,${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'dust') {
      // Gray/purple dust motes
      ctx.fillStyle = `rgba(140,120,160,${alpha * 0.25})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'wisp') {
      // Dark purple energy wisps
      ctx.fillStyle = `rgba(120,40,180,${alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
      // Wisp trail
      ctx.fillStyle = `rgba(120,40,180,${alpha * 0.15})`;
      ctx.beginPath();
      ctx.arc(sx - p.vx * 3, sy - p.vy * 3, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}


// ═══════ INTEGRATION HOOKS ═══════
// These are the touch points where this module connects to the existing game.
//
// 1. In tryInteract(), detect castle_floor tile (26) and call enterCastle()
//
// 2. In the main gameLoop(), add at the top:
//      if (typeof castleActive !== 'undefined' && castleActive) { updateCastle(16, keys); setTimeout(gameLoop, 16); return; }
//
// 3. In the main render(), add at the top:
//      if (typeof castleActive !== 'undefined' && castleActive) { renderCastle(ctx, W, H); requestAnimationFrame(render); return; }
//
// 4. In the keydown handler for 'e', add:
//      if (typeof castleActive !== 'undefined' && castleActive) {
//        if (typeof castleDialogueActive !== 'undefined' && castleDialogueActive) closeCastleDialogue();
//        else if (typeof castleInteract === 'function') castleInteract();
//        return;
//      }
//
// 5. In the Escape key handler, add:
//      if (typeof castleActive !== 'undefined' && castleActive) {
//        if (typeof castleDialogueActive !== 'undefined' && castleDialogueActive) closeCastleDialogue();
//        else if (typeof exitCastle === 'function') exitCastle();
//        return;
//      }
//
// 6. Click handler for dialogue dismiss:
//      if (typeof castleActive !== 'undefined' && castleActive && castleDialogueActive) { closeCastleDialogue(); }
//
// That's it! The rest is self-contained.
