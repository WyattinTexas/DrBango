// ═══════════════════════════════════════════════════════════════
// THE POLARIS INN — INN INTERIOR MODULE
// Drop-in walkable interior for the inn rest stop.
// Uses the same canvas + movement system as the overworld.
// ═══════════════════════════════════════════════════════════════

// ─── INN STATE ───
let innActive = false;           // true when inside inn
let innPlayerX = 10;             // player position inside inn (tiles)
let innPlayerY = 14;             // starts near the door
let innPlayerDir = 'up';
let innPlayerFrame = 0;
let innSavedOverworldX = 0;      // where player was on overworld
let innSavedOverworldY = 0;
let innAnimTime = 0;
let innInteractCooldown = 0;
let innNotification = null;      // { text, timer }
let innAmbientParticles = [];

// ─── INN MAP DIMENSIONS ───
const INN_W = 20;
const INN_H = 16;
const INN_TILE = 48; // same as overworld TILE

// ─── INN TILE TYPES ───
const IT = {
  FLOOR:      0,  // Warm wood floor
  WALL:       1,  // Stone wall (impassable)
  BED:        2,  // Bed (impassable)
  DESK:       3,  // Reception desk (impassable, interactive)
  COUNTER:    4,  // Kitchen counter (impassable)
  HEARTH:     5,  // Fireplace (impassable, animated)
  BOOKSHELF:  6,  // Bookshelf (impassable, interactive)
  NIGHTSTAND: 7,  // Nightstand (impassable)
  RUG:        8,  // Decorative rug (walkable)
  CHAIR:      9,  // Chair (walkable)
  TABLE:      10, // Table (impassable)
  COOKPOT:    11, // Cooking pot over fire (impassable, animated)
  DOOR:       12, // Exit door (walkable, triggers exit)
  SHELF:      13, // Food/supply shelf (impassable)
  ARMCHAIR:   14, // Comfy armchair (walkable)
  PLANTER:    15, // Indoor planter (impassable)
};

// Impassable set for quick lookup
const INN_IMPASSABLE = new Set([
  IT.WALL, IT.BED, IT.DESK, IT.COUNTER, IT.HEARTH,
  IT.BOOKSHELF, IT.NIGHTSTAND, IT.TABLE, IT.COOKPOT, IT.SHELF, IT.PLANTER
]);

// ─── INN MAP DATA ───
// 20 wide x 16 tall
// Legend: 0=floor, 1=wall, 2=bed, 3=desk, 4=counter, 5=hearth,
//         6=bookshelf, 7=nightstand, 8=rug, 9=chair, 10=table,
//         11=cookpot, 12=door, 13=shelf, 14=armchair, 15=planter
const INN_MAP = [
  // y=0  — top wall
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  // y=1  — kitchen (left) | sleeping quarters (right)
  [1,13,4,4,4,1,1,0,0,0,0,0,1,7,2,2,7,1,7,1],
  // y=2  — kitchen area with cook pot | hallway | beds
  [1,0,0,11,0,1,0,0,0,0,0,0,1,0,0,0,0,1,0,1],
  // y=3  — kitchen exit | open area | more beds
  [1,0,0,0,0,0,0,0,0,0,0,0,1,7,2,2,7,1,0,1],
  // y=4  — hearth wall (left) | common room start | bed row 2
  [1,1,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,1],
  // y=5  — hearth | common room | bed row 2 continued
  [1,5,5,1,0,0,0,10,9,0,9,10,1,7,2,2,7,1,0,1],
  // y=6  — hearth glow + chairs | common room center | sleeping quarters wall
  [1,5,5,1,0,0,0,0,8,8,0,0,0,0,0,0,0,0,0,1],
  // y=7  — hearth chairs | common room rug area | open
  [1,9,0,0,0,0,0,0,8,8,8,0,0,0,0,0,0,0,0,1],
  // y=8  — hearth exit | rug center | tables
  [1,14,0,0,0,0,0,8,8,8,8,0,0,10,9,0,9,10,0,1],
  // y=9  — reading nook wall | rug + common | seating
  [1,1,1,0,0,0,0,0,8,8,0,0,0,0,0,0,0,0,0,1],
  // y=10 — bookshelf + armchair | open floor | reception
  [1,6,6,1,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,1],
  // y=11 — reading nook interior | open floor | reception area
  [1,6,0,1,0,0,15,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // y=12 — reading armchair | path to door
  [1,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,15,0,1],
  // y=13 — reading nook wall | open floor toward door
  [1,1,1,0,0,0,0,0,0,8,8,0,0,0,0,0,0,0,0,1],
  // y=14 — bottom area + exit door
  [1,0,0,0,0,0,0,0,0,8,12,0,0,0,0,0,0,0,0,1],
  // y=15 — bottom wall
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ─── INN NPCs ───
const INN_NPCS = [
  {
    id: 'innkeeper',
    name: 'Mara',
    title: 'Innkeeper',
    x: 16, y: 10.5,
    color: '#d4956a',
    facing: 'down',
    dialogue: [
      "Welcome to The Polaris Inn, dear. You look like you've been traveling hard.",
      "Rest here as long as you need. Every weary soul deserves a warm bed.",
      "Let me take a look at your companions... I can patch them right up.",
      "There's stew in the kitchen if you're hungry. Bramble makes the best in Frost Valley.",
      "The fire's been burning since my grandmother built this place. Never once gone out.",
    ],
    heals: true, // special flag — triggers team heal on interact
  },
  {
    id: 'cook',
    name: 'Bramble',
    title: 'Cook',
    x: 2.5, y: 2,
    color: '#8a6040',
    facing: 'down',
    dialogue: [
      "Ha! Another hungry face! Sit down, sit down — stew's almost ready.",
      "Secret ingredient? Love! ...and a pinch of volcanic salt. Don't tell Mara.",
      "I've been cooking here for twenty winters. The pot's never been empty.",
      "Try the bread — baked it fresh this morning. Crisp on the outside, soft in the middle.",
      "You know what warms the soul better than fire? A full belly, that's what!",
    ],
  },
];

// ─── INN AMBIENT DECOR ───
const INN_DECOR = [
  { x: 7.5, y: 5, type: 'candle' },
  { x: 11.5, y: 5, type: 'candle' },
  { x: 13.5, y: 8, type: 'candle' },
  { x: 17.5, y: 8, type: 'candle' },
  { x: 16, y: 10.3, type: 'ledger' },
  { x: 14.3, y: 1.3, type: 'pillow_blue' },
  { x: 16.5, y: 1.3, type: 'pillow_red' },
  { x: 14.3, y: 3.3, type: 'pillow_green' },
  { x: 16.5, y: 3.3, type: 'pillow_gold' },
  { x: 14.3, y: 5.3, type: 'pillow_purple' },
  { x: 16.5, y: 5.3, type: 'pillow_blue' },
  { x: 3.3, y: 2.3, type: 'steam' },
];

// ─── LORE SNIPPETS (for reading nook) ───
const INN_LORE = [
  "\"The first Spiritkin were born from starlight that pooled in the hollows of ancient trees.\"",
  "\"Frost Valley was not always cold. The old songs speak of a great warmth, before the Silence.\"",
  "\"To bind a spirit is not to cage it — it is to share a heartbeat.\"",
  "\"The Volcanic Isles belched fire for seven days when the Spirit King fell. The sky wept ash.\"",
  "\"Some say the Overworld remembers every footstep ever taken upon it.\"",
  "\"Beware the deep woods at dusk. The spirits there do not sleep — they wait.\"",
  "\"A Spiritkin's true name is never spoken aloud. It is felt, like warmth from a distant fire.\"",
  "\"The Polaris Inn has stood for nine generations. Every innkeeper has been named Mara.\"",
];


// ═══════ ENTER / EXIT ═══════

function enterInn() {
  // Save overworld position
  innSavedOverworldX = G.x;
  innSavedOverworldY = G.y;

  // Switch to inn mode
  innActive = true;
  innPlayerX = 10;     // start at door
  innPlayerY = 14;
  innPlayerDir = 'up';
  innPlayerFrame = 0;
  innAmbientParticles = [];
  innNotification = { text: 'The Polaris Inn', timer: 180 };

  // Spawn initial ambient particles
  for (let i = 0; i < 15; i++) {
    innAmbientParticles.push(createInnParticle());
  }
}

function exitInn() {
  innActive = false;

  // Restore overworld position (nudge slightly away from building so we don't re-enter)
  G.x = innSavedOverworldX;
  G.y = innSavedOverworldY + 1;
  G.direction = 'down';
}


// ═══════ MOVEMENT & COLLISION ═══════

function updateInn(dt, keys) {
  if (!innActive) return;

  innAnimTime += dt;

  // Movement
  let dx = 0, dy = 0;
  const INN_SPEED = 2.2;

  if (keys['w'] || keys['arrowup'])    dy = -INN_SPEED;
  if (keys['s'] || keys['arrowdown'])  dy = INN_SPEED;
  if (keys['a'] || keys['arrowleft'])  dx = -INN_SPEED;
  if (keys['d'] || keys['arrowright']) dx = INN_SPEED;

  // Diagonal normalization
  if (dx && dy) { dx *= 0.707; dy *= 0.707; }

  if (dx || dy) {
    // Update direction
    if (Math.abs(dx) > Math.abs(dy)) {
      innPlayerDir = dx > 0 ? 'right' : 'left';
    } else {
      innPlayerDir = dy > 0 ? 'down' : 'up';
    }
    innPlayerFrame += dt * 6;
  }

  const step = 0.05;
  const newX = innPlayerX + dx * step;
  const newY = innPlayerY + dy * step;

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
      if (tx < 0 || tx >= INN_W || ty < 0 || ty >= INN_H) return false;
      if (INN_IMPASSABLE.has(INN_MAP[ty][tx])) return false;
    }
    return true;
  };

  // Slide movement (try X and Y independently)
  if (canMove(newX, innPlayerY)) innPlayerX = newX;
  if (canMove(innPlayerX, newY)) innPlayerY = newY;

  // Clamp
  innPlayerX = Math.max(0.5, Math.min(INN_W - 0.5, innPlayerX));
  innPlayerY = Math.max(0.5, Math.min(INN_H - 0.5, innPlayerY));

  // Exit door check
  const doorDist = Math.sqrt((innPlayerX - 10) ** 2 + (innPlayerY - 14) ** 2);
  if (doorDist < 0.8 && innPlayerDir === 'down') {
    // Show "Press E to leave" prompt handled in render
  }

  // Interaction cooldown
  if (innInteractCooldown > 0) innInteractCooldown -= dt;

  // Update ambient particles
  updateInnParticles(dt);

  // Update notification
  if (innNotification && innNotification.timer > 0) {
    innNotification.timer -= 1;
  }
}


// ═══════ INTERACTION ═══════

function innInteract() {
  if (!innActive) return;
  if (innInteractCooldown > 0) return;
  innInteractCooldown = 0.5;

  const px = innPlayerX;
  const py = innPlayerY;

  // Check exit door
  const doorDist = Math.sqrt((px - 10) ** 2 + (py - 14) ** 2);
  if (doorDist < 1.5) {
    exitInn();
    return;
  }

  // Check NPC interaction (range 2 tiles)
  for (const npc of INN_NPCS) {
    const dist = Math.sqrt((px - npc.x) ** 2 + (py - npc.y) ** 2);
    if (dist < 2.2) {
      const line = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
      showInnDialogue(npc.title ? `${npc.name} the ${npc.title}` : npc.name, line, npc.color);

      // Innkeeper heals the full team
      if (npc.heals && G && G.team) {
        G.team.forEach(g => { if (g) { g.hp = g.maxHp; g.ko = false; } });
        innNotification = { text: 'Your team feels refreshed! Fully healed.', timer: 150 };
      }

      // Charisma XP for talking to inn NPCs
      if (typeof addProfessionXP === 'function') addProfessionXP('charisma', 1);
      return;
    }
  }

  // Check tile interactions in adjacent tiles
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = Math.floor(px) + dx;
      const ty = Math.floor(py) + dy;
      if (tx >= 0 && tx < INN_W && ty >= 0 && ty < INN_H) {
        if (INN_MAP[ty][tx] === IT.DESK) {
          showInnDialogue('Reception Desk', 'A thick guest ledger sits open on the polished counter. Hundreds of names fill its pages — travelers from every corner of the Overworld.', '#d4956a');
          return;
        }
        if (INN_MAP[ty][tx] === IT.HEARTH) {
          showInnDialogue('The Hearth', 'The great fireplace crackles with a deep, comforting warmth. The flames have burned here for nine generations — never once extinguished.', '#ff9944');
          return;
        }
        if (INN_MAP[ty][tx] === IT.BED) {
          const bedTexts = [
            'A soft bed with a warm wool blanket. You could sleep for days...',
            'The pillow smells faintly of lavender. A perfect place to rest.',
            'Someone has tucked the corners neatly. Mara keeps a tidy inn.',
            'The blanket is heavy and warm. You can feel the stress melting away.',
          ];
          showInnDialogue('Cozy Bed', bedTexts[Math.floor(Math.random() * bedTexts.length)], '#7a8aaa');
          return;
        }
        if (INN_MAP[ty][tx] === IT.BOOKSHELF) {
          const lore = INN_LORE[Math.floor(Math.random() * INN_LORE.length)];
          showInnDialogue('Old Book', lore, '#8a7a5a');
          return;
        }
        if (INN_MAP[ty][tx] === IT.COOKPOT) {
          showInnDialogue('Stew Pot', 'A thick, hearty stew bubbles over the flame. Root vegetables, wild herbs, and something savory... it smells incredible.', '#aa7744');
          return;
        }
        if (INN_MAP[ty][tx] === IT.COUNTER) {
          showInnDialogue('Kitchen Counter', 'Flour, dried herbs, and a half-cut loaf of bread. The kitchen is well-stocked and lovingly maintained.', '#8a6a3a');
          return;
        }
      }
    }
  }

  // Check chair / armchair (sit emote)
  const tileUnder = INN_MAP[Math.floor(py)]?.[Math.floor(px)];
  if (tileUnder === IT.CHAIR || tileUnder === IT.ARMCHAIR) {
    const sitTexts = [
      '*sits down and relaxes*',
      '*takes a moment to rest*',
      '*settles into the seat with a sigh*',
    ];
    innNotification = { text: sitTexts[Math.floor(Math.random() * sitTexts.length)], timer: 90 };
    if (typeof addProfessionXP === 'function') addProfessionXP('charisma', 1);
    return;
  }
}

// ─── Inn dialogue (uses the existing showDialogue if available, else custom) ───
let innDialogueActive = false;
let innDialogueData = null;

function showInnDialogue(name, text, color) {
  innDialogueActive = true;
  innDialogueData = { name, text, color: color || '#d4956a' };
}

function closeInnDialogue() {
  innDialogueActive = false;
  innDialogueData = null;
}


// ═══════ RENDERING ═══════

function renderInn(ctx, W, H) {
  if (!innActive) return;

  const time = innAnimTime;

  // Camera — center on player, but clamp so we don't show outside the map
  const mapPixelW = INN_W * INN_TILE;
  const mapPixelH = INN_H * INN_TILE;

  let camX, camY;
  if (mapPixelW <= W) {
    camX = (mapPixelW - W) / 2; // center small map
  } else {
    camX = innPlayerX * INN_TILE - W / 2;
    camX = Math.max(0, Math.min(mapPixelW - W, camX));
  }
  if (mapPixelH <= H) {
    camY = (mapPixelH - H) / 2;
  } else {
    camY = innPlayerY * INN_TILE - H / 2;
    camY = Math.max(0, Math.min(mapPixelH - H, camY));
  }

  // Background — warm dark interior
  ctx.fillStyle = '#100a06';
  ctx.fillRect(0, 0, W, H);

  // Draw tiles
  const startTX = Math.max(0, Math.floor(camX / INN_TILE) - 1);
  const startTY = Math.max(0, Math.floor(camY / INN_TILE) - 1);
  const endTX = Math.min(INN_W, Math.ceil((camX + W) / INN_TILE) + 1);
  const endTY = Math.min(INN_H, Math.ceil((camY + H) / INN_TILE) + 1);

  for (let ty = startTY; ty < endTY; ty++) {
    for (let tx = startTX; tx < endTX; tx++) {
      const sx = tx * INN_TILE - camX;
      const sy = ty * INN_TILE - camY;
      const tile = INN_MAP[ty]?.[tx];
      if (tile === undefined) continue;

      drawInnTile(ctx, tile, sx, sy, tx, ty, time);
    }
  }

  // Draw decor items
  for (const d of INN_DECOR) {
    const sx = d.x * INN_TILE - camX;
    const sy = d.y * INN_TILE - camY;
    drawInnDecor(ctx, d.type, sx, sy, time);
  }

  // Draw ambient particles (hearth sparks, dust motes, steam)
  renderInnParticles(ctx, camX, camY);

  // Draw NPCs
  for (const npc of INN_NPCS) {
    drawInnNPC(ctx, npc, camX, camY, time);
  }

  // Draw player
  const playerSX = innPlayerX * INN_TILE - camX;
  const playerSY = innPlayerY * INN_TILE - camY;

  // Player shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(playerSX, playerSY + 14, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Use the existing sprite system if available
  if (typeof drawSprite === 'function' && G.sprite !== undefined) {
    drawSprite(ctx, G.sprite, playerSX - 24, playerSY - 36, 2.5, innPlayerDir, Math.floor(innPlayerFrame) % 4);
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
  const doorSX = 10 * INN_TILE - camX;
  const doorSY = 14 * INN_TILE - camY;
  const doorDist = Math.sqrt((innPlayerX - 10) ** 2 + (innPlayerY - 14) ** 2);
  if (doorDist < 2) {
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,255,200,${0.6 + Math.sin(time * 3) * 0.3})`;
    ctx.fillText('[E] Leave', doorSX + INN_TILE / 2, doorSY - 8);
  }

  // NPC prompts
  for (const npc of INN_NPCS) {
    const dist = Math.sqrt((innPlayerX - npc.x) ** 2 + (innPlayerY - npc.y) ** 2);
    if (dist < 2.5 && dist > 0.5) {
      const nsx = npc.x * INN_TILE - camX;
      const nsy = npc.y * INN_TILE - camY;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255,255,200,${0.5 + Math.sin(time * 2.5) * 0.3})`;
      const label = npc.heals ? `[E] Rest at ${npc.name}'s` : `[E] Talk to ${npc.name}`;
      ctx.fillText(label, nsx, nsy - 42);
    }
  }

  // Interactive object prompts
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = Math.floor(innPlayerX) + dx;
      const ty = Math.floor(innPlayerY) + dy;
      if (tx >= 0 && tx < INN_W && ty >= 0 && ty < INN_H) {
        const tile = INN_MAP[ty][tx];
        let label = null;
        if (tile === IT.HEARTH) label = '[E] Warm up';
        else if (tile === IT.BOOKSHELF) label = '[E] Read';
        else if (tile === IT.BED) label = '[E] Examine';
        else if (tile === IT.COOKPOT) label = '[E] Smell';
        else if (tile === IT.DESK) label = '[E] Check in';
        if (label) {
          const osx = tx * INN_TILE - camX + INN_TILE / 2;
          const osy = ty * INN_TILE - camY - 4;
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
  ctx.fillStyle = `rgba(220,180,120,${headerAlpha})`;
  ctx.fillText('The Polaris Inn', W / 2, 28);
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(200,160,100,0.5)';
  ctx.fillText('Rest & Recovery', W / 2, 42);

  // Notification toast
  if (innNotification && innNotification.timer > 0) {
    const alpha = Math.min(1, innNotification.timer / 30);
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,220,140,${alpha})`;
    ctx.fillText(innNotification.text, W / 2, H - 40);
  }

  // ─── Dialogue overlay ───
  if (innDialogueActive && innDialogueData) {
    drawInnDialogue(ctx, W, H);
  }

  // Vignette effect — deep warm amber edges (warmest of all buildings)
  const vignette = ctx.createRadialGradient(W/2, H/2, Math.min(W,H) * 0.25, W/2, H/2, Math.max(W,H) * 0.65);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(15,6,0,0.6)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // Extra warm ambient overlay — the inn is the warmest building
  ctx.fillStyle = 'rgba(255,160,60,0.03)';
  ctx.fillRect(0, 0, W, H);
}


// ═══════ TILE RENDERING ═══════

function drawInnTile(ctx, tile, sx, sy, tx, ty, time) {
  const T = INN_TILE;

  switch (tile) {
    case IT.FLOOR: {
      // Warm wood plank floor
      ctx.fillStyle = '#3e2c18';
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
      // Warm ambient light — stronger than cantina
      const lightVar = Math.sin(tx * 1.3 + ty * 0.7) * 0.04;
      ctx.fillStyle = `rgba(255,170,70,${0.05 + lightVar})`;
      ctx.fillRect(sx, sy, T, T);
      break;
    }

    case IT.WALL: {
      // Warm-toned stone wall
      ctx.fillStyle = '#2e2620';
      ctx.fillRect(sx, sy, T, T);
      // Stone brick pattern
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      const brickOffset = (ty % 2) * (T / 2);
      ctx.strokeRect(sx + brickOffset, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset - T / 2, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset + T / 2, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset, sy + T / 2, T / 2, T / 2);
      // Warm stone variation
      ctx.fillStyle = `rgba(${70 + (tx * 7 % 15)},${55 + (ty * 11 % 12)},${40 + (tx * 3 % 10)},0.3)`;
      ctx.fillRect(sx, sy, T, T);
      break;
    }

    case IT.BED: {
      // Floor under bed
      drawInnTile(ctx, IT.FLOOR, sx, sy, tx, ty, time);
      // Bed frame (dark wood)
      ctx.fillStyle = '#4a3018';
      ctx.fillRect(sx + 2, sy + 4, T - 4, T - 6);
      // Mattress
      ctx.fillStyle = '#e8dcc8';
      ctx.fillRect(sx + 5, sy + 6, T - 10, T - 10);
      // Blanket — color varies by position
      const blanketColors = ['#4a6a8a', '#8a3a3a', '#3a6a3a', '#7a5a8a', '#8a7a3a'];
      const blanketColor = blanketColors[(tx + ty * 3) % blanketColors.length];
      ctx.fillStyle = blanketColor;
      ctx.fillRect(sx + 5, sy + T/2 - 2, T - 10, T/2 - 4);
      // Blanket fold highlight
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(sx + 5, sy + T/2 - 2, T - 10, 3);
      // Pillow
      ctx.fillStyle = '#f0e8d8';
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + 11, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + 11, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case IT.DESK: {
      // Reception desk — warm polished wood
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(sx, sy, T, T);
      // Polished top surface highlight
      ctx.fillStyle = 'rgba(255,200,100,0.2)';
      ctx.fillRect(sx + 2, sy + 2, T - 4, T / 3);
      // Edge trim
      ctx.fillStyle = '#7a5a2a';
      ctx.fillRect(sx, sy, T, 3);
      ctx.fillRect(sx, sy + T - 3, T, 3);
      // Decorative inlay
      ctx.strokeStyle = 'rgba(255,200,100,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 6, sy + 6, T - 12, T - 12);
      break;
    }

    case IT.COUNTER: {
      // Kitchen counter
      ctx.fillStyle = '#4a3218';
      ctx.fillRect(sx, sy, T, T);
      // Counter surface
      ctx.fillStyle = '#6a4a28';
      ctx.fillRect(sx + 1, sy + 1, T - 2, T / 3);
      // Edge
      ctx.fillStyle = '#7a5a30';
      ctx.fillRect(sx, sy, T, 2);
      break;
    }

    case IT.HEARTH: {
      // Stone hearth base
      ctx.fillStyle = '#3a2a20';
      ctx.fillRect(sx, sy, T, T);
      // Inner firebox
      ctx.fillStyle = '#1a1008';
      ctx.fillRect(sx + 4, sy + 4, T - 8, T - 6);

      // Animated fire — large and warm
      const fireFlicker = Math.sin(time * 1.8 + tx * 2) * 4;
      const fireFlicker2 = Math.cos(time * 1.4 + ty) * 3;
      const fireFlicker3 = Math.sin(time * 2.2 + tx + ty) * 2;

      // Outer warm glow — extends beyond tile
      const glowR = 30 + fireFlicker;
      const glow = ctx.createRadialGradient(sx + T/2, sy + T/2, 3, sx + T/2, sy + T/2, glowR);
      glow.addColorStop(0, 'rgba(255,140,40,0.7)');
      glow.addColorStop(0.4, 'rgba(255,100,20,0.3)');
      glow.addColorStop(0.7, 'rgba(255,60,10,0.1)');
      glow.addColorStop(1, 'rgba(255,40,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(sx - 20, sy - 20, T + 40, T + 40);

      // Large flame shapes
      ctx.fillStyle = '#ff5510';
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 10, sy + T/2 + 8);
      ctx.quadraticCurveTo(sx + T/2 - 4 + fireFlicker2, sy + T/2 - 18 + fireFlicker, sx + T/2 - 2, sy + T/2 + 8);
      ctx.fill();

      ctx.fillStyle = '#ff8820';
      ctx.beginPath();
      ctx.moveTo(sx + T/2 + 2, sy + T/2 + 6);
      ctx.quadraticCurveTo(sx + T/2 + 5 + fireFlicker, sy + T/2 - 14 + fireFlicker2, sx + T/2 + 10, sy + T/2 + 6);
      ctx.fill();

      ctx.fillStyle = '#ffaa30';
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 3, sy + T/2 + 4);
      ctx.quadraticCurveTo(sx + T/2 + fireFlicker3, sy + T/2 - 10 + fireFlicker, sx + T/2 + 4, sy + T/2 + 4);
      ctx.fill();

      // Hot core
      ctx.fillStyle = '#ffdd60';
      ctx.beginPath();
      ctx.arc(sx + T/2 + fireFlicker2/3, sy + T/2 - 1 + fireFlicker/3, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff0a0';
      ctx.beginPath();
      ctx.arc(sx + T/2 + fireFlicker3/2, sy + T/2 + 1, 2, 0, Math.PI * 2);
      ctx.fill();

      // Embers at base
      for (let i = 0; i < 3; i++) {
        const ex = sx + 10 + i * 10 + Math.sin(time * 1.2 + i) * 2;
        const ey = sy + T - 10 + Math.cos(time * 0.8 + i) * 1;
        ctx.fillStyle = `rgba(255,${120 + i * 20},20,${0.4 + Math.sin(time * 1.5 + i) * 0.15})`;
        ctx.beginPath();
        ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stone mantle border
      ctx.strokeStyle = '#5a4a38';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx + 1, sy + 1, T - 2, T - 2);
      break;
    }

    case IT.BOOKSHELF: {
      // Wall background
      drawInnTile(ctx, IT.WALL, sx, sy, tx, ty, time);
      // Shelf planks
      ctx.fillStyle = '#5a3a1a';
      ctx.fillRect(sx + 2, sy + T/4, T - 4, 4);
      ctx.fillRect(sx + 2, sy + T/2, T - 4, 4);
      ctx.fillRect(sx + 2, sy + T * 3/4, T - 4, 4);
      // Books on shelves
      const bookColors = ['#8a3030', '#2a4a6a', '#3a6a3a', '#6a5a2a', '#5a2a5a', '#2a5a5a'];
      for (let row = 0; row < 3; row++) {
        const shelfY = sy + T/4 * (row + 1) - 2;
        for (let i = 0; i < 4; i++) {
          const bx = sx + 4 + i * 10 + (row * 3 % 5);
          const bh = 8 + (i * 3 + row * 2) % 5;
          const bc = bookColors[(tx + i + row * 2) % bookColors.length];
          ctx.fillStyle = bc;
          ctx.fillRect(bx, shelfY - bh, 7, bh);
          // Spine line
          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.fillRect(bx + 3, shelfY - bh + 2, 1, bh - 4);
        }
      }
      break;
    }

    case IT.NIGHTSTAND: {
      // Floor under
      drawInnTile(ctx, IT.FLOOR, sx, sy, tx, ty, time);
      // Small wooden nightstand
      ctx.fillStyle = '#4a3018';
      ctx.fillRect(sx + 8, sy + 8, T - 16, T - 12);
      // Top surface
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(sx + 6, sy + 6, T - 12, 4);
      // Drawer handle
      ctx.fillStyle = '#aa8844';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2 + 2, 2, 0, Math.PI * 2);
      ctx.fill();
      // Small candle on top
      ctx.fillStyle = '#e8d8b0';
      ctx.fillRect(sx + T/2 - 2, sy + 2, 4, 6);
      // Tiny flame
      const candleFlicker = Math.sin(time * 1.5 + tx + ty * 2) * 0.5;
      ctx.fillStyle = '#ffcc44';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + 1 + candleFlicker, 2, 0, Math.PI * 2);
      ctx.fill();
      // Candle glow
      const candleGlow = ctx.createRadialGradient(sx + T/2, sy + 2, 1, sx + T/2, sy + 2, 15);
      candleGlow.addColorStop(0, 'rgba(255,200,100,0.2)');
      candleGlow.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = candleGlow;
      ctx.fillRect(sx - 5, sy - 10, T + 10, T + 10);
      break;
    }

    case IT.RUG: {
      // Floor first
      drawInnTile(ctx, IT.FLOOR, sx, sy, tx, ty, time);
      // Warm-toned rug (warmer than cantina)
      ctx.fillStyle = 'rgba(140,60,30,0.45)';
      ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
      // Rug pattern border
      ctx.strokeStyle = 'rgba(200,140,60,0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 5, sy + 5, T - 10, T - 10);
      // Center floral pattern
      ctx.fillStyle = 'rgba(200,150,60,0.25)';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(180,100,40,0.2)';
      for (let a = 0; a < 4; a++) {
        const angle = (a / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(sx + T/2 + Math.cos(angle) * 6, sy + T/2 + Math.sin(angle) * 6, 3, 5, angle, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case IT.CHAIR: {
      // Floor first
      drawInnTile(ctx, IT.FLOOR, sx, sy, tx, ty, time);
      // Small wooden chair
      ctx.fillStyle = '#4a3018';
      ctx.fillRect(sx + T/2 - 6, sy + T/2 - 4, 12, 10);
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(sx + T/2 - 5, sy + T/2 - 3, 10, 8);
      break;
    }

    case IT.TABLE: {
      // Floor under table
      drawInnTile(ctx, IT.FLOOR, sx, sy, tx, ty, time);
      // Rectangular table top
      ctx.fillStyle = '#5a3818';
      ctx.fillRect(sx + 4, sy + 6, T - 8, T - 12);
      // Table edge highlight
      ctx.strokeStyle = '#7a5828';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 4, sy + 6, T - 8, T - 12);
      // Wood grain lines
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(sx + 6, sy + 6 + i * ((T - 12) / 3));
        ctx.lineTo(sx + T - 6, sy + 6 + i * ((T - 12) / 3));
        ctx.stroke();
      }
      break;
    }

    case IT.COOKPOT: {
      // Floor under
      drawInnTile(ctx, IT.FLOOR, sx, sy, tx, ty, time);
      // Small fire underneath
      const potFlicker = Math.sin(time * 1.8 + tx) * 2;
      ctx.fillStyle = '#ff6610';
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 8, sy + T - 8);
      ctx.quadraticCurveTo(sx + T/2 + potFlicker, sy + T - 18, sx + T/2 + 8, sy + T - 8);
      ctx.fill();
      ctx.fillStyle = '#ffaa30';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T - 12 + potFlicker/2, 3, 0, Math.PI * 2);
      ctx.fill();
      // Iron pot
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2, T/2 - 6, T/3 - 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Stew inside
      ctx.fillStyle = '#6a4a20';
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2 - 2, T/2 - 9, T/3 - 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Bubbles
      const bubbleT = time * 3;
      for (let i = 0; i < 3; i++) {
        const bt = (bubbleT + i * 2) % 3;
        if (bt < 2) {
          const bx = sx + T/2 - 6 + i * 6 + Math.sin(time + i) * 2;
          const by = sy + T/2 - 4 - bt * 3;
          const ba = 1 - bt / 2;
          ctx.fillStyle = `rgba(140,100,50,${ba * 0.5})`;
          ctx.beginPath();
          ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Pot handle
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2 - 10, 8, Math.PI, 0);
      ctx.stroke();
      // Pot glow
      const potGlow = ctx.createRadialGradient(sx + T/2, sy + T - 10, 2, sx + T/2, sy + T - 10, 20);
      potGlow.addColorStop(0, 'rgba(255,120,30,0.3)');
      potGlow.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = potGlow;
      ctx.fillRect(sx - 10, sy, T + 20, T + 10);
      break;
    }

    case IT.DOOR: {
      // Floor first
      drawInnTile(ctx, IT.FLOOR, sx, sy, tx, ty, time);
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

    case IT.SHELF: {
      // Wall background
      drawInnTile(ctx, IT.WALL, sx, sy, tx, ty, time);
      // Shelf plank
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(sx + 2, sy + T/3, T - 4, 4);
      ctx.fillRect(sx + 2, sy + T * 2/3, T - 4, 4);
      // Food items on shelves
      // Top shelf: jars
      for (let i = 0; i < 3; i++) {
        const jx = sx + 6 + i * 13;
        ctx.fillStyle = '#8a7a50';
        ctx.fillRect(jx, sy + T/3 - 9, 8, 9);
        ctx.fillStyle = 'rgba(255,220,150,0.3)';
        ctx.fillRect(jx + 1, sy + T/3 - 8, 6, 7);
        // Lid
        ctx.fillStyle = '#6a5a30';
        ctx.fillRect(jx - 1, sy + T/3 - 10, 10, 2);
      }
      // Bottom shelf: bread, cheese
      ctx.fillStyle = '#c4a050';
      ctx.beginPath();
      ctx.ellipse(sx + 12, sy + T * 2/3 - 4, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#eac040';
      ctx.fillRect(sx + T - 18, sy + T * 2/3 - 7, 10, 7);
      break;
    }

    case IT.ARMCHAIR: {
      // Floor first
      drawInnTile(ctx, IT.FLOOR, sx, sy, tx, ty, time);
      // Plush armchair
      ctx.fillStyle = '#5a2a1a';
      ctx.fillRect(sx + 4, sy + 6, T - 8, T - 8);
      // Cushion
      ctx.fillStyle = '#7a3a20';
      ctx.fillRect(sx + 7, sy + 9, T - 14, T - 14);
      // Armrests
      ctx.fillStyle = '#5a2a1a';
      ctx.fillRect(sx + 2, sy + 8, 5, T - 12);
      ctx.fillRect(sx + T - 7, sy + 8, 5, T - 12);
      // Cushion highlight
      ctx.fillStyle = 'rgba(255,200,150,0.08)';
      ctx.fillRect(sx + 8, sy + 10, T - 16, T/3);
      break;
    }

    case IT.PLANTER: {
      // Floor under
      drawInnTile(ctx, IT.FLOOR, sx, sy, tx, ty, time);
      // Ceramic pot
      ctx.fillStyle = '#8a5a3a';
      ctx.fillRect(sx + 8, sy + T/2, T - 16, T/2 - 4);
      ctx.fillStyle = '#9a6a4a';
      ctx.fillRect(sx + 6, sy + T/2 - 2, T - 12, 4);
      // Soil
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(sx + 9, sy + T/2 - 1, T - 18, 4);
      // Flowering plant
      ctx.fillStyle = '#3a7a2a';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2 - 10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a6a1a';
      ctx.beginPath();
      ctx.arc(sx + T/2 + 5, sy + T/2 - 14, 6, 0, Math.PI * 2);
      ctx.fill();
      // Small flower
      ctx.fillStyle = '#e88060';
      ctx.beginPath();
      ctx.arc(sx + T/2 - 2, sy + T/2 - 16, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffcc66';
      ctx.beginPath();
      ctx.arc(sx + T/2 - 2, sy + T/2 - 16, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}


// ═══════ NPC RENDERING ═══════

function drawInnNPC(ctx, npc, camX, camY, time) {
  const sx = npc.x * INN_TILE - camX;
  const sy = npc.y * INN_TILE - camY;

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
  if (npc.id === 'innkeeper') {
    // Warm heart glow — motherly aura
    const heartGlow = ctx.createRadialGradient(sx, sy - 4, 2, sx, sy - 4, 20);
    const heartAlpha = 0.1 + Math.sin(time * 2) * 0.05;
    heartGlow.addColorStop(0, `rgba(255,180,120,${heartAlpha})`);
    heartGlow.addColorStop(1, 'rgba(255,180,120,0)');
    ctx.fillStyle = heartGlow;
    ctx.fillRect(sx - 25, sy - 28, 50, 50);

    // Apron
    ctx.fillStyle = '#e8dcc8';
    ctx.fillRect(sx - 4, sy + 2, 8, 10);
  }

  if (npc.id === 'cook') {
    // Chef's hat
    ctx.fillStyle = '#f0e8d8';
    ctx.fillRect(sx - 5, sy - 22 + headBob, 10, 6);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(sx, sy - 22 + headBob, 6, Math.PI, 0);
    ctx.fill();

    // Steam/cooking aura
    for (let i = 0; i < 2; i++) {
      const st = (time * 1.5 + i * 1.5) % 3;
      if (st < 2.5) {
        const sa = (1 - st / 2.5) * 0.3;
        const steamX = sx + Math.sin(time + i * 2) * 5;
        const steamY = sy - 28 - st * 6;
        ctx.fillStyle = `rgba(220,200,180,${sa})`;
        ctx.beginPath();
        ctx.arc(steamX, steamY, 2 + st, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}


// ═══════ DECOR RENDERING ═══════

function drawInnDecor(ctx, type, sx, sy, time) {
  if (type === 'candle') {
    // Candle stick
    ctx.fillStyle = '#e8d8b0';
    ctx.fillRect(sx + 2, sy + 2, 4, 8);
    // Flame
    const flicker = Math.sin(time * 1.5 + sx) * 0.5;
    ctx.fillStyle = '#ffcc44';
    ctx.beginPath();
    ctx.arc(sx + 4, sy + 1 + flicker, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8e0';
    ctx.beginPath();
    ctx.arc(sx + 4, sy + 1 + flicker, 1, 0, Math.PI * 2);
    ctx.fill();
    // Glow
    const glow = ctx.createRadialGradient(sx + 4, sy + 2, 1, sx + 4, sy + 2, 18);
    glow.addColorStop(0, 'rgba(255,200,100,0.15)');
    glow.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx - 14, sy - 14, 36, 36);
  } else if (type === 'ledger') {
    // Open book/ledger
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(sx, sy, 14, 10);
    ctx.fillStyle = '#e8dcc8';
    ctx.fillRect(sx + 1, sy + 1, 6, 8);
    ctx.fillRect(sx + 7.5, sy + 1, 6, 8);
    // Writing lines
    ctx.strokeStyle = 'rgba(60,40,20,0.3)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(sx + 2, sy + 3 + i * 2);
      ctx.lineTo(sx + 6, sy + 3 + i * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + 8.5, sy + 3 + i * 2);
      ctx.lineTo(sx + 12.5, sy + 3 + i * 2);
      ctx.stroke();
    }
  } else if (type === 'steam') {
    // Animated steam rising from cookpot
    for (let i = 0; i < 3; i++) {
      const st = (time * 1.2 + i * 1.3) % 4;
      if (st < 3) {
        const sa = (1 - st / 3) * 0.25;
        const steamX = sx + Math.sin(time * 0.8 + i * 2.5) * 8;
        const steamY = sy - st * 10;
        ctx.fillStyle = `rgba(200,190,170,${sa})`;
        ctx.beginPath();
        ctx.arc(steamX, steamY, 3 + st * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (type.startsWith('pillow_')) {
    // Decorative pillow on beds (already handled by bed blanket colors, but adds depth)
    const pillowColors = {
      'pillow_blue': 'rgba(70,100,140,0.4)',
      'pillow_red': 'rgba(140,50,50,0.4)',
      'pillow_green': 'rgba(50,100,50,0.4)',
      'pillow_gold': 'rgba(140,120,50,0.4)',
      'pillow_purple': 'rgba(100,60,120,0.4)',
    };
    ctx.fillStyle = pillowColors[type] || 'rgba(100,100,100,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx + 4, sy + 4, 5, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}


// ═══════ DIALOGUE BOX ═══════

function drawInnDialogue(ctx, W, H) {
  const d = innDialogueData;
  if (!d) return;

  // Dim background
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, W, H);

  // Dialogue box
  const boxW = Math.min(500, W - 40);
  const boxH = 120;
  const boxX = (W - boxW) / 2;
  const boxY = H - boxH - 30;

  // Box background — warm tones for the inn
  ctx.fillStyle = 'rgba(25,15,8,0.92)';
  ctx.strokeStyle = d.color || '#d4956a';
  ctx.lineWidth = 2;
  innRoundRect(ctx, boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  // Name plate
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = d.color || '#d4956a';
  ctx.fillText(d.name, boxX + 16, boxY + 22);

  // Dialogue text (word wrap)
  ctx.font = '12px monospace';
  ctx.fillStyle = '#ccc';
  innWrapText(ctx, d.text, boxX + 16, boxY + 44, boxW - 32, 16);

  // Dismiss prompt
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(200,180,140,0.6)';
  ctx.fillText('[E / Click to close]', boxX + boxW - 12, boxY + boxH - 10);
}

// Helper: rounded rect
function innRoundRect(ctx, x, y, w, h, r) {
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
function innWrapText(ctx, text, x, y, maxWidth, lineHeight) {
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

function createInnParticle() {
  const type = Math.random();
  if (type < 0.35) {
    // Hearth spark (from fireplace at columns 1-2, rows 5-6)
    return {
      kind: 'spark',
      x: (1.5 + Math.random() * 1.5) * INN_TILE,
      y: (5.5 + Math.random()) * INN_TILE,
      vx: (Math.random() - 0.3) * 0.8,
      vy: -Math.random() * 2 - 0.8,
      life: 1,
      maxLife: 1 + Math.random() * 1.5,
      size: 1 + Math.random() * 2.5,
    };
  } else if (type < 0.55) {
    // Kitchen steam (from cookpot at column 3, row 2)
    return {
      kind: 'steam',
      x: (3 + Math.random() * 0.5) * INN_TILE,
      y: (1.5 + Math.random() * 0.5) * INN_TILE,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -Math.random() * 0.6 - 0.2,
      life: 1,
      maxLife: 2 + Math.random() * 2,
      size: 2 + Math.random() * 2,
    };
  } else if (type < 0.8) {
    // Warm dust mote (anywhere in room)
    return {
      kind: 'dust',
      x: (2 + Math.random() * 16) * INN_TILE,
      y: (2 + Math.random() * 12) * INN_TILE,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.08,
      life: 1,
      maxLife: 4 + Math.random() * 5,
      size: 0.8 + Math.random(),
    };
  } else {
    // Candle flicker mote (near table areas)
    return {
      kind: 'candle',
      x: (6 + Math.random() * 10) * INN_TILE,
      y: (4 + Math.random() * 8) * INN_TILE,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -Math.random() * 0.4,
      life: 1,
      maxLife: 1.5 + Math.random() * 2,
      size: 0.5 + Math.random() * 0.8,
    };
  }
}

function updateInnParticles(dt) {
  for (let i = innAmbientParticles.length - 1; i >= 0; i--) {
    const p = innAmbientParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) {
      innAmbientParticles.splice(i, 1);
    }
  }
  // Replenish
  while (innAmbientParticles.length < 10) {
    innAmbientParticles.push(createInnParticle());
  }
}

function renderInnParticles(ctx, camX, camY) {
  for (const p of innAmbientParticles) {
    const sx = p.x - camX;
    const sy = p.y - camY;
    const alpha = Math.min(1, p.life * 2) * 0.6;

    if (p.kind === 'spark') {
      ctx.fillStyle = `rgba(255,${140 + Math.floor(p.size * 40)},30,${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'steam') {
      ctx.fillStyle = `rgba(210,200,180,${alpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'dust') {
      ctx.fillStyle = `rgba(220,190,140,${alpha * 0.25})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'candle') {
      ctx.fillStyle = `rgba(255,210,120,${alpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}


// ═══════ INTEGRATION HOOKS ═══════
// These are the touch points where this module connects to the existing game.
//
// 1. CALL enterInn() when the player interacts with the inn building on the overworld.
//
// 2. In the main gameLoop(), add:
//      if (innActive) { updateInn(dt, keys); return; }
//
// 3. In the main render(), add:
//      if (innActive) { renderInn(ctx, W, H); return; }
//
// 4. In the keydown handler for 'e', add:
//      if (innActive) {
//        if (innDialogueActive) { closeInnDialogue(); }
//        else { innInteract(); }
//        return;
//      }
//
// 5. In the Escape key handler, add:
//      if (innActive) {
//        if (innDialogueActive) { closeInnDialogue(); }
//        else { exitInn(); }
//        return;
//      }
//
// 6. (Optional) Click handler for dialogue dismiss:
//      if (innActive && innDialogueActive) { closeInnDialogue(); }
//
// That's it! The rest is self-contained.
