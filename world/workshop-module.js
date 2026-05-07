// ═══════════════════════════════════════════════════════════════
// THE WORKSHOP — CRAFTING HALL INTERIOR MODULE
// Drop-in walkable interior for the crafting hall.
// Uses the same canvas + movement system as the overworld.
// ═══════════════════════════════════════════════════════════════

// ─── WORKSHOP STATE ───
let workshopActive = false;       // true when inside workshop
let workshopPlayerX = 11;         // player position inside workshop (tiles)
let workshopPlayerY = 14;         // starts near the door
let workshopPlayerDir = 'up';
let workshopPlayerFrame = 0;
let workshopSavedOverworldX = 0;  // where player was on overworld
let workshopSavedOverworldY = 0;
let workshopAnimTime = 0;
let workshopInteractCooldown = 0;
let workshopNotification = null;  // { text, timer }
let workshopAmbientParticles = [];

// ─── WORKSHOP MAP DIMENSIONS ───
const WORKSHOP_W = 22;
const WORKSHOP_H = 16;
const WORKSHOP_TILE = 48; // same as overworld TILE

// ─── WORKSHOP TILE TYPES ───
const WT = {
  FLOOR:      0,  // Stone floor
  WALL:       1,  // Stone wall (impassable)
  WORKBENCH:  2,  // Wooden workbench (impassable, interactive)
  ANVIL:      3,  // Anvil (impassable, interactive — triggers crafting)
  FURNACE:    4,  // Furnace (impassable, animated fire)
  TOOL_RACK:  5,  // Tool rack on wall (impassable)
  CRATE:      6,  // Storage crate (impassable)
  DISPLAY:    7,  // Display case (impassable, interactive)
  TROUGH:     8,  // Water quenching trough (impassable, steam particles)
  DRAFTING:   9,  // Drafting table (impassable, interactive)
  BELLOWS:    10, // Bellows (impassable, decorative)
  DOOR:       11, // Exit door (walkable, triggers exit)
  RUG:        12, // Work mat / leather mat (walkable)
  PILLAR:     13, // Support pillar (impassable)
  SHELF:      14, // Material shelf (impassable, interactive)
  COAL_BIN:   15, // Coal bin (impassable)
};

// Impassable set for quick lookup
const WORKSHOP_IMPASSABLE = new Set([
  WT.WALL, WT.WORKBENCH, WT.ANVIL, WT.FURNACE, WT.TOOL_RACK,
  WT.CRATE, WT.DISPLAY, WT.TROUGH, WT.DRAFTING, WT.BELLOWS,
  WT.PILLAR, WT.SHELF, WT.COAL_BIN
]);

// ─── WORKSHOP MAP DATA ───
// 22 wide x 16 tall
// Legend: 0=floor, 1=wall, 2=workbench, 3=anvil, 4=furnace, 5=tool_rack,
//         6=crate, 7=display, 8=trough, 9=drafting, 10=bellows, 11=door,
//         12=rug, 13=pillar, 14=shelf, 15=coal_bin
const WORKSHOP_MAP = [
  // y=0  — top wall
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  // y=1  — apprentice corner (top-left) | material storage (top-right)
  [1,2,0,0,5,1,1,5,0,0,0,0,0,0,1,14,14,6,6,14,14,1],
  // y=2  — apprentice workbench | open floor | shelves + crates
  [1,2,0,0,0,1,0,0,0,0,0,0,0,0,1,14,0,0,0,0,6,1],
  // y=3  — apprentice nook exit | floor | storage entry
  [1,0,0,0,0,0,0,0,0,13,0,0,13,0,0,0,0,0,0,0,0,1],
  // y=4  — open floor
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // y=5  — forge area begins (center-left) | display cases (right wall)
  [1,5,0,0,0,0,0,15,4,4,0,0,0,0,0,0,0,0,7,7,7,1],
  // y=6  — main forge: furnace + anvil + bellows | display
  [1,5,0,0,0,0,0,10,4,4,0,3,12,0,0,0,0,0,7,0,7,1],
  // y=7  — forge work area with rugs | display exit
  [1,0,0,0,0,0,0,0,8,8,0,12,12,0,0,0,0,0,0,0,0,1],
  // y=8  — quenching trough + work floor
  [1,0,0,0,0,0,0,0,0,0,0,12,0,0,0,13,0,0,0,0,0,1],
  // y=9  — open floor
  [1,0,0,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // y=10 — schematic table area (bottom-left)
  [1,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,1],
  // y=11 — drafting table nook
  [1,9,9,0,0,1,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,1],
  // y=12 — schematic exit + bottom workbenches
  [1,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // y=13 — path to door
  [1,0,0,0,0,0,0,0,0,0,0,12,12,0,0,0,0,0,0,0,0,1],
  // y=14 — bottom area + exit door
  [1,0,0,0,0,0,0,0,0,0,0,12,11,12,0,0,0,0,0,0,0,1],
  // y=15 — bottom wall
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ─── WORKSHOP NPCs ───
const WORKSHOP_NPCS = [
  {
    id: 'smith',
    name: 'Smith Ember',
    title: 'Master Smith',
    x: 11, y: 6,
    color: '#cc6633',
    facing: 'down',
    dialogue: [
      "The forge speaks to those who listen. Hear the ring of the anvil? That's the sound of purpose.",
      "Quality isn't rushed. I've seen too many apprentices ruin good steel with impatience.",
      "Bring me rare materials and I'll show you what true craftsmanship looks like.",
      "Every spirit has an essence. A good smith learns to fold that essence into the metal.",
      "The difference between a blade and a masterwork? About a thousand more hammer strikes.",
      "Temperature is everything. Too hot and the grain coarsens. Too cool and it cracks. Feel the color.",
    ],
  },
  {
    id: 'apprentice',
    name: 'Pip',
    title: 'Apprentice',
    x: 2, y: 2,
    color: '#88bb55',
    facing: 'down',
    dialogue: [
      "Oh! A visitor! I'm Pip — I sweep the floors and... well, mostly sweep the floors.",
      "Smith Ember says I'll be ready for the anvil in a year. A YEAR! That's forever!",
      "Have you been on any adventures? I've never left the workshop... what's it like out there?",
      "I tried to use the bellows yesterday and blew soot all over the display cases. Don't tell Ember.",
      "Sometimes when Ember isn't looking, I practice hammer strikes on scrap metal. I'm getting better! I think.",
      "Do you think I could be a real smith someday? Ember says anyone can learn, but talent helps.",
    ],
  },
];

// ─── WORKSHOP AMBIENT ITEMS ───
// Small decorative details drawn on top of tiles
const WORKSHOP_DECOR = [
  { x: 11.5, y: 6.3, type: 'hammer' },
  { x: 10, y: 11.3, type: 'tongs' },
  { x: 13.5, y: 11.3, type: 'tongs' },
  { x: 1.5, y: 12.3, type: 'scroll' },
  { x: 2.5, y: 12.3, type: 'scroll' },
  { x: 7.5, y: 5.5, type: 'coal_pile' },
  { x: 18.5, y: 6.5, type: 'gear' },
  { x: 19.5, y: 5.5, type: 'gear' },
];


// ═══════ ENTER / EXIT ═══════

function enterWorkshop() {
  // Save overworld position
  workshopSavedOverworldX = G.x;
  workshopSavedOverworldY = G.y;

  // Switch to workshop mode
  workshopActive = true;
  workshopPlayerX = 12;    // start at door
  workshopPlayerY = 14;
  workshopPlayerDir = 'up';
  workshopPlayerFrame = 0;
  workshopAmbientParticles = [];
  workshopNotification = { text: 'The Workshop', timer: 180 };

  // Spawn initial ambient particles
  for (let i = 0; i < 15; i++) {
    workshopAmbientParticles.push(createWorkshopParticle());
  }
}

function exitWorkshop() {
  workshopActive = false;

  // Restore overworld position (nudge slightly away from building so we don't re-enter)
  G.x = workshopSavedOverworldX;
  G.y = workshopSavedOverworldY + 1;
  G.direction = 'down';
}


// ═══════ MOVEMENT & COLLISION ═══════

function updateWorkshop(dt, keys) {
  if (!workshopActive) return;

  workshopAnimTime += dt;

  // Movement
  let dx = 0, dy = 0;
  const WORKSHOP_SPEED = 2.2;

  if (keys['w'] || keys['arrowup'])    dy = -WORKSHOP_SPEED;
  if (keys['s'] || keys['arrowdown'])  dy = WORKSHOP_SPEED;
  if (keys['a'] || keys['arrowleft'])  dx = -WORKSHOP_SPEED;
  if (keys['d'] || keys['arrowright']) dx = WORKSHOP_SPEED;

  // Diagonal normalization
  if (dx && dy) { dx *= 0.707; dy *= 0.707; }

  if (dx || dy) {
    // Update direction
    if (Math.abs(dx) > Math.abs(dy)) {
      workshopPlayerDir = dx > 0 ? 'right' : 'left';
    } else {
      workshopPlayerDir = dy > 0 ? 'down' : 'up';
    }
    workshopPlayerFrame += dt * 6;
  }

  const step = 0.05;
  const newX = workshopPlayerX + dx * step;
  const newY = workshopPlayerY + dy * step;

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
      if (tx < 0 || tx >= WORKSHOP_W || ty < 0 || ty >= WORKSHOP_H) return false;
      if (WORKSHOP_IMPASSABLE.has(WORKSHOP_MAP[ty][tx])) return false;
    }
    return true;
  };

  // Slide movement (try X and Y independently)
  if (canMove(newX, workshopPlayerY)) workshopPlayerX = newX;
  if (canMove(workshopPlayerX, newY)) workshopPlayerY = newY;

  // Clamp
  workshopPlayerX = Math.max(0.5, Math.min(WORKSHOP_W - 0.5, workshopPlayerX));
  workshopPlayerY = Math.max(0.5, Math.min(WORKSHOP_H - 0.5, workshopPlayerY));

  // Exit door check
  const doorDist = Math.sqrt((workshopPlayerX - 12) ** 2 + (workshopPlayerY - 14) ** 2);
  if (doorDist < 0.8 && workshopPlayerDir === 'down') {
    // Show "Press E to leave" prompt handled in render
  }

  // Interaction cooldown
  if (workshopInteractCooldown > 0) workshopInteractCooldown -= dt;

  // Update ambient particles
  updateWorkshopParticles(dt);

  // Update notification
  if (workshopNotification && workshopNotification.timer > 0) {
    workshopNotification.timer -= 1;
  }
}


// ═══════ INTERACTION ═══════

function workshopInteract() {
  if (!workshopActive) return;
  if (workshopInteractCooldown > 0) return;
  workshopInteractCooldown = 0.5;

  const px = workshopPlayerX;
  const py = workshopPlayerY;

  // Check exit door
  const doorDist = Math.sqrt((px - 12) ** 2 + (py - 14) ** 2);
  if (doorDist < 1.5) {
    exitWorkshop();
    return;
  }

  // Check NPC interaction (range 2 tiles)
  for (const npc of WORKSHOP_NPCS) {
    const dist = Math.sqrt((px - npc.x) ** 2 + (py - npc.y) ** 2);
    if (dist < 2.2) {
      const line = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
      showWorkshopDialogue(npc.title ? `${npc.name} the ${npc.title}` : npc.name, line, npc.color);
      // Charisma XP for talking to workshop NPCs
      if (typeof addProfessionXP === 'function') addProfessionXP('charisma', 1);
      return;
    }
  }

  // Check tile interactions in adjacent tiles
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = Math.floor(px) + dx;
      const ty = Math.floor(py) + dy;
      if (tx >= 0 && tx < WORKSHOP_W && ty >= 0 && ty < WORKSHOP_H) {
        const tile = WORKSHOP_MAP[ty][tx];

        if (tile === WT.ANVIL) {
          // Trigger crafting system
          if (typeof openCrafting === 'function') openCrafting();
          else showWorkshopDialogue('The Anvil', 'The anvil is scarred with a thousand hammer marks. This is where raw materials become something extraordinary.', '#cc9944');
          return;
        }

        if (tile === WT.FURNACE) {
          showWorkshopDialogue('The Forge', 'Waves of heat ripple the air above the furnace. Molten metal glows white-hot within. The heartbeat of the workshop.', '#ff8844');
          return;
        }

        if (tile === WT.WORKBENCH) {
          showWorkshopDialogue('Workbench', 'A sturdy oak workbench scored with knife marks and stained with oil. Tools hang on pegs above — files, chisels, calipers.', '#8a6a3a');
          return;
        }

        if (tile === WT.TROUGH) {
          showWorkshopDialogue('Quenching Trough', 'Cool water shimmers in the stone trough. When hot steel meets the water, the hiss fills the whole hall. Steam curls lazily from the surface.', '#6688aa');
          return;
        }

        if (tile === WT.DRAFTING) {
          showWorkshopDialogue('Schematic Table', 'Yellowed blueprints cover the table — diagrams of blades, shields, and stranger devices. Pencil notes in the margins read: "Increase the alloy ratio?" and "Ask about spirit-forged steel."', '#bbaa77');
          return;
        }

        if (tile === WT.DISPLAY) {
          showWorkshopDialogue('Display Case', 'Behind the glass sit examples of the workshop\'s finest work — a gleaming short sword, an ornate buckler, and a pendant that seems to shimmer with inner light.', '#aaaacc');
          return;
        }

        if (tile === WT.SHELF) {
          // Show material inventory if available
          if (typeof G !== 'undefined' && G.materials) {
            const counts = Object.entries(G.materials)
              .filter(([k, v]) => v > 0)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ');
            showWorkshopDialogue('Material Storage', counts || 'Your material stores are empty. Gather materials from the world to bring here for crafting.', '#bb8844');
          } else {
            showWorkshopDialogue('Material Storage', 'Shelves lined with raw materials — ingots of iron, bundles of leather, jars of spirit dust, spools of enchanted thread. Everything a smith could need.', '#bb8844');
          }
          return;
        }

        if (tile === WT.CRATE) {
          showWorkshopDialogue('Supply Crate', 'Wooden crates packed with raw ore, charcoal, and flux. The workshop is well-stocked.', '#7a5a2a');
          return;
        }

        if (tile === WT.BELLOWS) {
          showWorkshopDialogue('The Bellows', 'Massive leather bellows, big enough for two people to operate. They feed air to the furnace, making the flames roar white-hot.', '#8a7040');
          workshopNotification = { text: '*WHOOOOSH* — the forge flares brighter!', timer: 90 };
          return;
        }

        if (tile === WT.TOOL_RACK) {
          showWorkshopDialogue('Tool Rack', 'Hammers, tongs, files, punches, swages — every tool a smith could want, each hung precisely in its place. Smith Ember keeps an orderly shop.', '#777777');
          return;
        }

        if (tile === WT.COAL_BIN) {
          showWorkshopDialogue('Coal Bin', 'A bin of high-grade charcoal, black as midnight. The good stuff — burns hotter and cleaner than common coal.', '#333333');
          return;
        }
      }
    }
  }

  // Check rug (flavor)
  const tileUnder = WORKSHOP_MAP[Math.floor(py)]?.[Math.floor(px)];
  if (tileUnder === WT.RUG) {
    workshopNotification = { text: 'A thick leather work mat, scorched at the edges.', timer: 90 };
    return;
  }
}

// ─── Workshop dialogue (uses the existing showDialogue if available, else custom) ───
let workshopDialogueActive = false;
let workshopDialogueData = null;

function showWorkshopDialogue(name, text, color) {
  workshopDialogueActive = true;
  workshopDialogueData = { name, text, color: color || '#cc6633' };
}

function closeWorkshopDialogue() {
  workshopDialogueActive = false;
  workshopDialogueData = null;
}


// ═══════ RENDERING ═══════

function renderWorkshop(ctx, W, H) {
  if (!workshopActive) return;

  const time = workshopAnimTime;

  // Camera — center on player, but clamp so we don't show outside the map
  const mapPixelW = WORKSHOP_W * WORKSHOP_TILE;
  const mapPixelH = WORKSHOP_H * WORKSHOP_TILE;

  let camX, camY;
  if (mapPixelW <= W) {
    camX = (mapPixelW - W) / 2; // center small map
  } else {
    camX = workshopPlayerX * WORKSHOP_TILE - W / 2;
    camX = Math.max(0, Math.min(mapPixelW - W, camX));
  }
  if (mapPixelH <= H) {
    camY = (mapPixelH - H) / 2;
  } else {
    camY = workshopPlayerY * WORKSHOP_TILE - H / 2;
    camY = Math.max(0, Math.min(mapPixelH - H, camY));
  }

  // Background — dark forge ambiance
  ctx.fillStyle = '#0c0806';
  ctx.fillRect(0, 0, W, H);

  // Draw tiles
  const startTX = Math.max(0, Math.floor(camX / WORKSHOP_TILE) - 1);
  const startTY = Math.max(0, Math.floor(camY / WORKSHOP_TILE) - 1);
  const endTX = Math.min(WORKSHOP_W, Math.ceil((camX + W) / WORKSHOP_TILE) + 1);
  const endTY = Math.min(WORKSHOP_H, Math.ceil((camY + H) / WORKSHOP_TILE) + 1);

  for (let ty = startTY; ty < endTY; ty++) {
    for (let tx = startTX; tx < endTX; tx++) {
      const sx = tx * WORKSHOP_TILE - camX;
      const sy = ty * WORKSHOP_TILE - camY;
      const tile = WORKSHOP_MAP[ty]?.[tx];
      if (tile === undefined) continue;

      drawWorkshopTile(ctx, tile, sx, sy, tx, ty, time);
    }
  }

  // Draw decor items
  for (const d of WORKSHOP_DECOR) {
    const sx = d.x * WORKSHOP_TILE - camX;
    const sy = d.y * WORKSHOP_TILE - camY;
    drawWorkshopDecor(ctx, d.type, sx, sy, time);
  }

  // Draw ambient particles (forge sparks, steam, embers)
  renderWorkshopParticles(ctx, camX, camY);

  // Draw NPCs
  for (const npc of WORKSHOP_NPCS) {
    drawWorkshopNPC(ctx, npc, camX, camY, time);
  }

  // Draw player
  const playerSX = workshopPlayerX * WORKSHOP_TILE - camX;
  const playerSY = workshopPlayerY * WORKSHOP_TILE - camY;

  // Player shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(playerSX, playerSY + 14, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Use the existing sprite system if available
  if (typeof drawSprite === 'function' && G.sprite !== undefined) {
    drawSprite(ctx, G.sprite, playerSX - 24, playerSY - 36, 2.5, workshopPlayerDir, Math.floor(workshopPlayerFrame) % 4);
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
  const doorSX = 12 * WORKSHOP_TILE - camX;
  const doorSY = 14 * WORKSHOP_TILE - camY;
  const doorDist = Math.sqrt((workshopPlayerX - 12) ** 2 + (workshopPlayerY - 14) ** 2);
  if (doorDist < 2) {
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,255,200,${0.6 + Math.sin(time * 3) * 0.3})`;
    ctx.fillText('[E] Leave', doorSX + WORKSHOP_TILE / 2, doorSY - 8);
  }

  // NPC prompts
  for (const npc of WORKSHOP_NPCS) {
    const dist = Math.sqrt((workshopPlayerX - npc.x) ** 2 + (workshopPlayerY - npc.y) ** 2);
    if (dist < 2.5 && dist > 0.5) {
      const nsx = npc.x * WORKSHOP_TILE - camX;
      const nsy = npc.y * WORKSHOP_TILE - camY;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255,255,200,${0.5 + Math.sin(time * 2.5) * 0.3})`;
      ctx.fillText(`[E] Talk to ${npc.name}`, nsx, nsy - 42);
    }
  }

  // Interactive object prompts
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = Math.floor(workshopPlayerX) + dx;
      const ty = Math.floor(workshopPlayerY) + dy;
      if (tx >= 0 && tx < WORKSHOP_W && ty >= 0 && ty < WORKSHOP_H) {
        const tile = WORKSHOP_MAP[ty][tx];
        let label = null;
        if (tile === WT.ANVIL) label = '[E] Craft';
        else if (tile === WT.FURNACE) label = '[E] Examine';
        else if (tile === WT.WORKBENCH) label = '[E] Examine';
        else if (tile === WT.TROUGH) label = '[E] Examine';
        else if (tile === WT.DRAFTING) label = '[E] Read schematics';
        else if (tile === WT.DISPLAY) label = '[E] View';
        else if (tile === WT.SHELF) label = '[E] Check materials';
        else if (tile === WT.BELLOWS) label = '[E] Pump bellows';
        if (label) {
          const osx = tx * WORKSHOP_TILE - camX + WORKSHOP_TILE / 2;
          const osy = ty * WORKSHOP_TILE - camY - 4;
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
  ctx.fillStyle = `rgba(204,102,51,${headerAlpha})`;
  ctx.fillText('The Workshop', W / 2, 28);
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(180,120,60,0.5)';
  ctx.fillText('Crafting Hall', W / 2, 42);

  // Notification toast
  if (workshopNotification && workshopNotification.timer > 0) {
    const alpha = Math.min(1, workshopNotification.timer / 30);
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,200,120,${alpha})`;
    ctx.fillText(workshopNotification.text, W / 2, H - 40);
  }

  // ─── Dialogue overlay (skip canvas draw if Spirit Comms is handling it) ───
  if (workshopDialogueActive && workshopDialogueData && typeof showComm !== 'function') {
    drawWorkshopDialogue(ctx, W, H);
  }

  // Vignette effect — warm forge-orange edges
  const vignette = ctx.createRadialGradient(W/2, H/2, Math.min(W,H) * 0.3, W/2, H/2, Math.max(W,H) * 0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(15,5,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}


// ═══════ TILE RENDERING ═══════

function drawWorkshopTile(ctx, tile, sx, sy, tx, ty, time) {
  const T = WORKSHOP_TILE;

  switch (tile) {
    case WT.FLOOR: {
      // Stone floor
      ctx.fillStyle = '#38342e';
      ctx.fillRect(sx, sy, T, T);
      // Stone slab pattern
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      const slabOff = (ty % 2) * (T / 2);
      ctx.strokeRect(sx + slabOff, sy, T / 2, T);
      ctx.strokeRect(sx + slabOff - T / 2, sy, T / 2, T);
      ctx.strokeRect(sx + slabOff + T / 2, sy, T / 2, T);
      // Subtle color variation per slab
      ctx.fillStyle = `rgba(${50 + (tx * 5 % 15)},${48 + (ty * 7 % 12)},${42 + (tx * 3 % 10)},0.2)`;
      ctx.fillRect(sx, sy, T, T);
      // Warm ambient glow from forge
      const distToForge = Math.sqrt((tx - 8.5) ** 2 + (ty - 5.5) ** 2);
      const forgeLight = Math.max(0, 0.08 - distToForge * 0.008);
      if (forgeLight > 0) {
        ctx.fillStyle = `rgba(255,140,40,${forgeLight})`;
        ctx.fillRect(sx, sy, T, T);
      }
      break;
    }

    case WT.WALL: {
      // Heavy stone wall
      ctx.fillStyle = '#2c2824';
      ctx.fillRect(sx, sy, T, T);
      // Stone brick pattern
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      const brickOffset = (ty % 2) * (T / 2);
      ctx.strokeRect(sx + brickOffset, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset - T / 2, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset + T / 2, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset, sy + T / 2, T / 2, T / 2);
      // Mortar highlight
      ctx.fillStyle = `rgba(${55 + (tx * 9 % 20)},${50 + (ty * 5 % 15)},${45 + (tx * 7 % 10)},0.25)`;
      ctx.fillRect(sx, sy, T, T);
      break;
    }

    case WT.WORKBENCH: {
      // Floor under
      drawWorkshopTile(ctx, WT.FLOOR, sx, sy, tx, ty, time);
      // Heavy oak workbench
      ctx.fillStyle = '#5a3e1e';
      ctx.fillRect(sx + 2, sy + 4, T - 4, T - 8);
      // Top surface
      ctx.fillStyle = '#6a4e2a';
      ctx.fillRect(sx + 2, sy + 4, T - 4, T / 3);
      // Tool groove
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 6, sy + T / 3 + 4);
      ctx.lineTo(sx + T - 6, sy + T / 3 + 4);
      ctx.stroke();
      // Vice on edge
      ctx.fillStyle = '#666';
      ctx.fillRect(sx + T - 10, sy + 6, 8, 10);
      ctx.fillStyle = '#555';
      ctx.fillRect(sx + T - 9, sy + 8, 6, 3);
      break;
    }

    case WT.ANVIL: {
      // Floor under
      drawWorkshopTile(ctx, WT.FLOOR, sx, sy, tx, ty, time);
      // Anvil base (tree stump)
      ctx.fillStyle = '#4a3018';
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2 + 6, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Anvil body — dark iron
      ctx.fillStyle = '#4a4a50';
      ctx.fillRect(sx + T/2 - 10, sy + T/2 - 8, 20, 14);
      // Horn (left side)
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 10, sy + T/2 - 4);
      ctx.lineTo(sx + T/2 - 18, sy + T/2);
      ctx.lineTo(sx + T/2 - 10, sy + T/2 + 2);
      ctx.fillStyle = '#4a4a50';
      ctx.fill();
      // Face (top surface) — polished
      ctx.fillStyle = '#6a6a72';
      ctx.fillRect(sx + T/2 - 10, sy + T/2 - 8, 20, 4);
      // Highlight gleam
      const gleam = Math.sin(time * 2 + tx) * 0.15;
      ctx.fillStyle = `rgba(255,200,100,${0.1 + gleam})`;
      ctx.fillRect(sx + T/2 - 6, sy + T/2 - 8, 8, 2);
      break;
    }

    case WT.FURNACE: {
      // Stone hearth base
      ctx.fillStyle = '#3a2820';
      ctx.fillRect(sx, sy, T, T);
      // Furnace body — dark firebrick
      ctx.fillStyle = '#4a2a1a';
      ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
      // Inner arch
      ctx.fillStyle = '#2a1a0a';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2 + 4, T/3, Math.PI, 0);
      ctx.lineTo(sx + T/2 + T/3, sy + T - 4);
      ctx.lineTo(sx + T/2 - T/3, sy + T - 4);
      ctx.fill();
      // Fire!
      const fireFlicker = Math.sin(time * 2 + tx * 1.5) * 3;
      const fireFlicker2 = Math.cos(time * 1.5 + ty * 2) * 2;
      const fireFlicker3 = Math.sin(time * 2.5 + tx + ty) * 2;
      // Outer glow — larger and more intense than cantina
      const glowR = 28 + fireFlicker;
      const glow = ctx.createRadialGradient(sx + T/2, sy + T/2, 3, sx + T/2, sy + T/2, glowR);
      glow.addColorStop(0, 'rgba(255,140,30,0.9)');
      glow.addColorStop(0.4, 'rgba(255,80,10,0.4)');
      glow.addColorStop(0.7, 'rgba(255,40,0,0.1)');
      glow.addColorStop(1, 'rgba(255,40,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(sx - 16, sy - 16, T + 32, T + 32);
      // Main flame — big center
      ctx.fillStyle = '#ff6610';
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 8, sy + T/2 + 8);
      ctx.quadraticCurveTo(sx + T/2 - 3 + fireFlicker2, sy + T/2 - 14 + fireFlicker, sx + T/2 + 2, sy + T/2 + 8);
      ctx.fill();
      // Secondary flame
      ctx.fillStyle = '#ff8830';
      ctx.beginPath();
      ctx.moveTo(sx + T/2 + 2, sy + T/2 + 6);
      ctx.quadraticCurveTo(sx + T/2 + 5 + fireFlicker, sy + T/2 - 10 + fireFlicker3, sx + T/2 + 10, sy + T/2 + 6);
      ctx.fill();
      // Hot core
      ctx.fillStyle = '#ffcc40';
      ctx.beginPath();
      ctx.arc(sx + T/2 + fireFlicker2/2, sy + T/2 + 2 + fireFlicker/3, 4, 0, Math.PI * 2);
      ctx.fill();
      // White-hot center
      ctx.fillStyle = '#ffe8a0';
      ctx.beginPath();
      ctx.arc(sx + T/2 + fireFlicker3/3, sy + T/2 + 3, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case WT.TOOL_RACK: {
      // Wall background
      drawWorkshopTile(ctx, WT.WALL, sx, sy, tx, ty, time);
      // Wooden rack
      ctx.fillStyle = '#5a4020';
      ctx.fillRect(sx + 3, sy + T/3, T - 6, 4);
      ctx.fillRect(sx + 3, sy + T * 2/3, T - 6, 4);
      // Hanging tools
      // Hammer
      ctx.fillStyle = '#888';
      ctx.fillRect(sx + 8, sy + T/3 + 4, 3, 12);
      ctx.fillStyle = '#666';
      ctx.fillRect(sx + 5, sy + T/3 + 14, 9, 5);
      // Tongs
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + 20, sy + T/3 + 4);
      ctx.lineTo(sx + 18, sy + T/3 + 16);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + 24, sy + T/3 + 4);
      ctx.lineTo(sx + 26, sy + T/3 + 16);
      ctx.stroke();
      // File (bottom rack)
      ctx.fillStyle = '#999';
      ctx.fillRect(sx + 10, sy + T * 2/3 + 4, 2, 10);
      ctx.fillStyle = '#5a3a10';
      ctx.fillRect(sx + 9, sy + T * 2/3 + 14, 4, 5);
      // Chisel
      ctx.fillStyle = '#888';
      ctx.fillRect(sx + 28, sy + T * 2/3 + 4, 2, 8);
      ctx.fillStyle = '#666';
      ctx.fillRect(sx + 27, sy + T * 2/3 + 4, 4, 3);
      break;
    }

    case WT.CRATE: {
      // Floor under
      drawWorkshopTile(ctx, WT.FLOOR, sx, sy, tx, ty, time);
      // Wooden crate
      ctx.fillStyle = '#5a4020';
      ctx.fillRect(sx + 4, sy + 4, T - 8, T - 8);
      // Planks
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy + T/3);
      ctx.lineTo(sx + T - 4, sy + T/3);
      ctx.moveTo(sx + 4, sy + T * 2/3);
      ctx.lineTo(sx + T - 4, sy + T * 2/3);
      ctx.stroke();
      // Metal corner brackets
      ctx.fillStyle = '#777';
      ctx.fillRect(sx + 4, sy + 4, 5, 5);
      ctx.fillRect(sx + T - 9, sy + 4, 5, 5);
      ctx.fillRect(sx + 4, sy + T - 9, 5, 5);
      ctx.fillRect(sx + T - 9, sy + T - 9, 5, 5);
      break;
    }

    case WT.DISPLAY: {
      // Floor under
      drawWorkshopTile(ctx, WT.FLOOR, sx, sy, tx, ty, time);
      // Glass display case
      ctx.fillStyle = '#3a3a42';
      ctx.fillRect(sx + 3, sy + 3, T - 6, T - 6);
      // Glass top (reflective)
      ctx.fillStyle = 'rgba(140,160,180,0.2)';
      ctx.fillRect(sx + 5, sy + 5, T - 10, T - 10);
      // Display item (varies by position)
      const itemSeed = (tx * 7 + ty * 13) % 3;
      if (itemSeed === 0) {
        // Sword
        ctx.fillStyle = '#aaa';
        ctx.fillRect(sx + T/2 - 1, sy + 10, 2, T - 20);
        ctx.fillStyle = '#7a5a2a';
        ctx.fillRect(sx + T/2 - 4, sy + T - 14, 8, 4);
      } else if (itemSeed === 1) {
        // Shield
        ctx.fillStyle = '#667';
        ctx.beginPath();
        ctx.arc(sx + T/2, sy + T/2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#889';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx + T/2, sy + T/2, 7, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Pendant
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(sx + T/2, sy + T/2 - 4, 5, 0, Math.PI * 2);
        ctx.stroke();
        // Inner glow
        const shimmer = Math.sin(time * 1.2 + tx) * 0.15;
        ctx.fillStyle = `rgba(200,180,255,${0.3 + shimmer})`;
        ctx.beginPath();
        ctx.arc(sx + T/2, sy + T/2 - 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // Glass reflection line
      ctx.strokeStyle = 'rgba(200,220,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + 8, sy + 5);
      ctx.lineTo(sx + T - 12, sy + T - 8);
      ctx.stroke();
      break;
    }

    case WT.TROUGH: {
      // Floor under
      drawWorkshopTile(ctx, WT.FLOOR, sx, sy, tx, ty, time);
      // Stone trough
      ctx.fillStyle = '#4a4a48';
      ctx.fillRect(sx + 2, sy + 6, T - 4, T - 12);
      // Water surface
      const waterRipple = Math.sin(time * 2 + tx * 2) * 1;
      ctx.fillStyle = '#3a5a7a';
      ctx.fillRect(sx + 4, sy + 8, T - 8, T - 16);
      // Water highlights / ripples
      ctx.fillStyle = `rgba(120,180,220,${0.2 + Math.sin(time * 1.5 + tx) * 0.1})`;
      ctx.beginPath();
      ctx.ellipse(sx + T/2 + waterRipple, sy + T/2, T/3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(150,200,240,${0.15 + Math.sin(time * 2.5 + ty) * 0.08})`;
      ctx.beginPath();
      ctx.ellipse(sx + T/2 - 4 - waterRipple, sy + T/2 + 2, T/4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // Steam wisps (drawn as subtle arcs above)
      const steamAlpha = 0.1 + Math.sin(time * 1.2 + tx) * 0.05;
      ctx.strokeStyle = `rgba(200,200,220,${steamAlpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + 2, 6, Math.PI * 0.8, Math.PI * 0.2, true);
      ctx.stroke();
      break;
    }

    case WT.DRAFTING: {
      // Floor under
      drawWorkshopTile(ctx, WT.FLOOR, sx, sy, tx, ty, time);
      // Drafting table — angled surface
      ctx.fillStyle = '#5a4020';
      ctx.fillRect(sx + 2, sy + 4, T - 4, T - 8);
      // Paper / blueprints on top
      ctx.fillStyle = '#d4c8a0';
      ctx.fillRect(sx + 5, sy + 6, T - 10, T - 14);
      // Blueprint lines
      ctx.strokeStyle = 'rgba(60,80,120,0.4)';
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(sx + 8, sy + 6 + i * ((T - 14) / 5));
        ctx.lineTo(sx + T - 8, sy + 6 + i * ((T - 14) / 5));
        ctx.stroke();
      }
      // Blueprint sketch (simple sword outline)
      ctx.strokeStyle = 'rgba(40,60,100,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + T/2, sy + 10);
      ctx.lineTo(sx + T/2, sy + T - 12);
      ctx.moveTo(sx + T/2 - 6, sy + T - 16);
      ctx.lineTo(sx + T/2 + 6, sy + T - 16);
      ctx.stroke();
      // Pencil
      ctx.fillStyle = '#ccaa22';
      ctx.fillRect(sx + T - 14, sy + 8, 2, 12);
      ctx.fillStyle = '#333';
      ctx.fillRect(sx + T - 14, sy + 20, 2, 2);
      break;
    }

    case WT.BELLOWS: {
      // Floor under
      drawWorkshopTile(ctx, WT.FLOOR, sx, sy, tx, ty, time);
      // Bellows body — leather
      const bellowsPulse = Math.sin(time * 1.5) * 2;
      ctx.fillStyle = '#6a4a2a';
      ctx.beginPath();
      ctx.moveTo(sx + 4, sy + T/2 - 8 - bellowsPulse);
      ctx.lineTo(sx + T - 4, sy + T/2 - 2);
      ctx.lineTo(sx + T - 4, sy + T/2 + 2);
      ctx.lineTo(sx + 4, sy + T/2 + 8 + bellowsPulse);
      ctx.closePath();
      ctx.fill();
      // Nozzle
      ctx.fillStyle = '#888';
      ctx.fillRect(sx + T - 8, sy + T/2 - 3, 8, 6);
      // Handle
      ctx.fillStyle = '#4a3018';
      ctx.fillRect(sx + 2, sy + T/2 - 2, 6, 4);
      // Air puff when "compressed"
      if (bellowsPulse < -1) {
        ctx.fillStyle = 'rgba(200,200,200,0.1)';
        ctx.beginPath();
        ctx.arc(sx + T + 4, sy + T/2, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case WT.DOOR: {
      // Floor first
      drawWorkshopTile(ctx, WT.FLOOR, sx, sy, tx, ty, time);
      // Doorframe — heavy timber
      ctx.fillStyle = '#5a4a30';
      ctx.fillRect(sx + T/2 - 10, sy + 2, 20, T - 4);
      // Door — reinforced wood
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(sx + T/2 - 8, sy + 4, 16, T - 8);
      // Iron bands
      ctx.fillStyle = '#555';
      ctx.fillRect(sx + T/2 - 8, sy + 10, 16, 2);
      ctx.fillRect(sx + T/2 - 8, sy + T - 12, 16, 2);
      // Handle — iron ring
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx + T/2 + 3, sy + T/2 + 2, 3, 0, Math.PI * 2);
      ctx.stroke();
      // Light from outside
      const beamAlpha = 0.08 + Math.sin(time * 0.5) * 0.03;
      ctx.fillStyle = `rgba(180,200,255,${beamAlpha})`;
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 8, sy + T);
      ctx.lineTo(sx + T/2 - 20, sy + T + 30);
      ctx.lineTo(sx + T/2 + 20, sy + T + 30);
      ctx.lineTo(sx + T/2 + 8, sy + T);
      ctx.fill();
      break;
    }

    case WT.RUG: {
      // Floor first
      drawWorkshopTile(ctx, WT.FLOOR, sx, sy, tx, ty, time);
      // Leather work mat
      ctx.fillStyle = 'rgba(90,60,30,0.5)';
      ctx.fillRect(sx + 2, sy + 2, T - 4, T - 4);
      // Scorch marks
      ctx.fillStyle = 'rgba(40,25,10,0.3)';
      ctx.beginPath();
      ctx.arc(sx + 12, sy + 10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx + T - 14, sy + T - 12, 3, 0, Math.PI * 2);
      ctx.fill();
      // Stitching
      ctx.strokeStyle = 'rgba(120,80,40,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(sx + 5, sy + 5, T - 10, T - 10);
      ctx.setLineDash([]);
      break;
    }

    case WT.PILLAR: {
      // Floor under
      drawWorkshopTile(ctx, WT.FLOOR, sx, sy, tx, ty, time);
      // Stone pillar — thicker than cantina, more industrial
      ctx.fillStyle = '#4a4840';
      ctx.fillRect(sx + T/2 - 7, sy + 2, 14, T - 4);
      // Capital (top)
      ctx.fillStyle = '#5a5850';
      ctx.fillRect(sx + T/2 - 9, sy + 2, 18, 5);
      // Base
      ctx.fillStyle = '#5a5850';
      ctx.fillRect(sx + T/2 - 9, sy + T - 7, 18, 5);
      // Soot stain
      ctx.fillStyle = 'rgba(30,25,20,0.2)';
      ctx.fillRect(sx + T/2 - 7, sy + 6, 14, T/3);
      break;
    }

    case WT.SHELF: {
      // Wall background
      drawWorkshopTile(ctx, WT.WALL, sx, sy, tx, ty, time);
      // Heavy shelf planks
      ctx.fillStyle = '#5a4020';
      ctx.fillRect(sx + 2, sy + T/3, T - 4, 5);
      ctx.fillRect(sx + 2, sy + T * 2/3, T - 4, 5);
      // Materials on shelves — ingots, jars, bundles
      const seed = (tx * 11 + ty * 7) % 4;
      if (seed === 0 || seed === 2) {
        // Metal ingots
        ctx.fillStyle = '#8a8a8a';
        ctx.fillRect(sx + 6, sy + T/3 - 6, 10, 6);
        ctx.fillStyle = '#9a7a3a';
        ctx.fillRect(sx + 20, sy + T/3 - 6, 10, 6);
        // Jar
        ctx.fillStyle = 'rgba(100,140,160,0.5)';
        ctx.fillRect(sx + 12, sy + T * 2/3 - 10, 8, 10);
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(sx + 12, sy + T * 2/3 - 12, 8, 3);
      } else {
        // Leather bundles
        ctx.fillStyle = '#6a4a2a';
        ctx.beginPath();
        ctx.ellipse(sx + 12, sy + T/3 - 4, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Spirit dust jar
        ctx.fillStyle = 'rgba(160,120,200,0.5)';
        ctx.fillRect(sx + 24, sy + T/3 - 10, 7, 10);
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(sx + 24, sy + T/3 - 12, 7, 3);
        // Thread spool
        ctx.fillStyle = '#aa6a3a';
        ctx.beginPath();
        ctx.arc(sx + 14, sy + T * 2/3 - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cc8844';
        ctx.beginPath();
        ctx.arc(sx + 14, sy + T * 2/3 - 5, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case WT.COAL_BIN: {
      // Floor under
      drawWorkshopTile(ctx, WT.FLOOR, sx, sy, tx, ty, time);
      // Bin container
      ctx.fillStyle = '#4a3a1a';
      ctx.fillRect(sx + 4, sy + 6, T - 8, T - 10);
      // Coal pile — black lumps
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2 - 2, T/2 - 8, T/3 - 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Coal shine
      ctx.fillStyle = 'rgba(80,80,80,0.3)';
      ctx.beginPath();
      ctx.arc(sx + T/2 - 4, sy + T/2 - 4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx + T/2 + 5, sy + T/2 - 2, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}


// ═══════ NPC RENDERING ═══════

function drawWorkshopNPC(ctx, npc, camX, camY, time) {
  const sx = npc.x * WORKSHOP_TILE - camX;
  const sy = npc.y * WORKSHOP_TILE - camY;

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
  if (npc.id === 'smith') {
    // Sweat drops near forge heat
    const sweatTime = time * 1.5;
    const sweatPhase = (sweatTime % 4);
    if (sweatPhase < 2) {
      const sa = 1 - sweatPhase / 2;
      ctx.fillStyle = `rgba(120,180,220,${sa * 0.5})`;
      ctx.beginPath();
      ctx.arc(sx + 8, sy - 8 + sweatPhase * 6, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Leather apron
    ctx.fillStyle = '#5a3a18';
    ctx.fillRect(sx - 5, sy - 2, 10, 14);
    ctx.fillStyle = '#4a2a10';
    ctx.fillRect(sx - 4, sy, 8, 10);
  }

  if (npc.id === 'apprentice') {
    // Broom in hand
    ctx.fillStyle = '#7a6a4a';
    ctx.fillRect(sx + 8, sy - 16, 2, 28);
    // Broom head
    ctx.fillStyle = '#aa9a6a';
    ctx.fillRect(sx + 5, sy + 10, 8, 4);
    // Soot smudge on face
    ctx.fillStyle = 'rgba(40,30,20,0.3)';
    ctx.beginPath();
    ctx.arc(sx + 2, sy - 10 + headBob, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}


// ═══════ DECOR RENDERING ═══════

function drawWorkshopDecor(ctx, type, sx, sy, time) {
  if (type === 'hammer') {
    // Small hammer on anvil
    ctx.fillStyle = '#7a5a2a';
    ctx.fillRect(sx, sy, 2, 10);
    ctx.fillStyle = '#888';
    ctx.fillRect(sx - 3, sy - 2, 8, 4);
  } else if (type === 'tongs') {
    // Tongs on bench
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 4, sy + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 3, sy);
    ctx.lineTo(sx - 1, sy + 12);
    ctx.stroke();
  } else if (type === 'scroll') {
    // Rolled blueprint
    ctx.fillStyle = '#d4c8a0';
    ctx.fillRect(sx, sy, 12, 6);
    ctx.fillStyle = '#c4b890';
    ctx.beginPath();
    ctx.arc(sx, sy + 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 12, sy + 3, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'coal_pile') {
    // Small coal pile near furnace
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 4, sy + 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx - 2, sy + 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'gear') {
    // Decorative gear in display area
    const rot = (time || 0) * 0.3;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(rot);
    ctx.strokeStyle = 'rgba(160,140,100,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.stroke();
    // Teeth
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
      ctx.lineTo(Math.cos(a) * 8, Math.sin(a) * 8);
      ctx.stroke();
    }
    ctx.restore();
  }
}


// ═══════ DIALOGUE BOX ═══════

function drawWorkshopDialogue(ctx, W, H) {
  const d = workshopDialogueData;
  if (!d) return;

  // Dim background
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(0, 0, W, H);

  // Dialogue box
  const boxW = Math.min(500, W - 40);
  const boxH = 120;
  const boxX = (W - boxW) / 2;
  const boxY = H - boxH - 30;

  // Box background — darker, forge-themed
  ctx.fillStyle = 'rgba(20,12,6,0.92)';
  ctx.strokeStyle = d.color || '#cc6633';
  ctx.lineWidth = 2;
  workshopRoundRect(ctx, boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  // Name plate
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = d.color || '#cc6633';
  ctx.fillText(d.name, boxX + 16, boxY + 22);

  // Dialogue text (word wrap)
  ctx.font = '12px monospace';
  ctx.fillStyle = '#ccc';
  workshopWrapText(ctx, d.text, boxX + 16, boxY + 44, boxW - 32, 16);

  // Dismiss prompt
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(200,160,100,0.6)';
  ctx.fillText('[E / Click to close]', boxX + boxW - 12, boxY + boxH - 10);
}

// Helper: rounded rect
function workshopRoundRect(ctx, x, y, w, h, r) {
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
function workshopWrapText(ctx, text, x, y, maxWidth, lineHeight) {
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

function createWorkshopParticle() {
  const type = Math.random();
  if (type < 0.35) {
    // Forge spark — from furnace area (columns 8-9, rows 5-6)
    return {
      kind: 'spark',
      x: (8 + Math.random() * 2) * WORKSHOP_TILE,
      y: (5 + Math.random() * 2) * WORKSHOP_TILE,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -Math.random() * 2 - 0.8,
      life: 1,
      maxLife: 0.8 + Math.random() * 0.8,
      size: 1 + Math.random() * 2.5,
    };
  } else if (type < 0.55) {
    // Steam wisp — from quenching trough (columns 8-9, row 7)
    return {
      kind: 'steam',
      x: (8 + Math.random() * 2) * WORKSHOP_TILE,
      y: (7 + Math.random() * 0.5) * WORKSHOP_TILE,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.8 - 0.3,
      life: 1,
      maxLife: 2 + Math.random() * 2,
      size: 2 + Math.random() * 3,
    };
  } else if (type < 0.75) {
    // Ember — drifting from forge across the room
    return {
      kind: 'ember',
      x: (7 + Math.random() * 4) * WORKSHOP_TILE,
      y: (4 + Math.random() * 4) * WORKSHOP_TILE,
      vx: (Math.random() - 0.3) * 0.4,
      vy: -Math.random() * 0.5 - 0.1,
      life: 1,
      maxLife: 3 + Math.random() * 3,
      size: 0.5 + Math.random() * 1.5,
    };
  } else {
    // Dust mote (anywhere in room)
    return {
      kind: 'dust',
      x: (2 + Math.random() * 18) * WORKSHOP_TILE,
      y: (2 + Math.random() * 12) * WORKSHOP_TILE,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.1,
      life: 1,
      maxLife: 4 + Math.random() * 4,
      size: 0.5 + Math.random(),
    };
  }
}

function updateWorkshopParticles(dt) {
  for (let i = workshopAmbientParticles.length - 1; i >= 0; i--) {
    const p = workshopAmbientParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) {
      workshopAmbientParticles.splice(i, 1);
    }
  }
  // Replenish
  while (workshopAmbientParticles.length < 10) {
    workshopAmbientParticles.push(createWorkshopParticle());
  }
}

function renderWorkshopParticles(ctx, camX, camY) {
  for (const p of workshopAmbientParticles) {
    const sx = p.x - camX;
    const sy = p.y - camY;
    const alpha = Math.min(1, p.life * 2) * 0.6;

    if (p.kind === 'spark') {
      ctx.fillStyle = `rgba(255,${140 + Math.floor(p.size * 40)},20,${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'steam') {
      ctx.fillStyle = `rgba(200,210,220,${alpha * 0.25})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'ember') {
      const r = 255;
      const g = 100 + Math.floor(p.life * 80);
      ctx.fillStyle = `rgba(${r},${g},10,${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'dust') {
      ctx.fillStyle = `rgba(180,160,120,${alpha * 0.2})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}


// ═══════ INTEGRATION HOOKS ═══════
// These are the touch points where this module connects to the existing game.
//
// 1. CALL enterWorkshop() when the player interacts with the Workshop building on the overworld.
//    Replace or add alongside the existing workshop/crafting trigger.
//
// 2. In the main gameLoop(), add:
//      if (workshopActive) { updateWorkshop(dt, keys); return; }
//
// 3. In the main render(), add:
//      if (workshopActive) { renderWorkshop(ctx, W, H); return; }
//
// 4. In the keydown handler for 'e', add:
//      if (workshopActive) {
//        if (workshopDialogueActive) { closeWorkshopDialogue(); }
//        else { workshopInteract(); }
//        return;
//      }
//
// 5. In the Escape key handler, add:
//      if (workshopActive) {
//        if (workshopDialogueActive) { closeWorkshopDialogue(); }
//        else { exitWorkshop(); }
//        return;
//      }
//
// 6. (Optional) Click handler for dialogue dismiss:
//      if (workshopActive && workshopDialogueActive) { closeWorkshopDialogue(); }
//
// NOTE: The anvil interaction calls openCrafting() if it exists. Make sure the
// crafting modal system is loaded before this module, or the anvil will fall
// back to flavor text.
//
// That's it! The rest is self-contained.
