// ═══════════════════════════════════════════════════════════════
// THE BATTLE ARENA — COLOSSEUM INTERIOR MODULE
// Drop-in replacement for the modal arena system.
// Uses the same canvas + movement system as the overworld.
// ═══════════════════════════════════════════════════════════════

// ─── ARENA STATE ───
let arenaActive = false;           // true when inside arena
let arenaPlayerX = 13;             // player position inside arena (tiles)
let arenaPlayerY = 18;             // starts near the door
let arenaPlayerDir = 'up';
let arenaPlayerFrame = 0;
let arenaSavedOverworldX = 0;      // where player was on overworld
let arenaSavedOverworldY = 0;
let arenaAnimTime = 0;
let arenaInteractCooldown = 0;
let arenaNotification = null;      // { text, timer }
let arenaAmbientParticles = [];

// ─── ARENA MAP DIMENSIONS ───
const ARENA_W = 26;
const ARENA_H = 20;
const ARENA_TILE = 48; // same as overworld TILE

// ─── ARENA TILE TYPES ───
const AT = {
  FLOOR:    0,  // Stone floor
  WALL:     1,  // Stone wall (impassable)
  SAND:     2,  // Pit sand floor (walkable)
  BENCH:    3,  // Spectator bench (walkable)
  TROPHY:   4,  // Trophy case (impassable, interactive)
  BANNER:   5,  // Banner pole (impassable, animated wave)
  TORCH:    6,  // Torch pillar (impassable, animated flame)
  GATE:     7,  // Iron gate (impassable, decorative)
  RACK:     8,  // Weapon rack (impassable, interactive)
  RAILING:  9,  // Pit railing (impassable)
  PODIUM:   10, // Podium (impassable, interactive — pit marker)
  DOOR:     11, // Exit door (walkable, triggers exit)
  PIT_EDGE: 12, // Pit edge ring (walkable, decorative transition)
  PILLAR:   13, // Stone support pillar (impassable)
  DESK:     14, // Bookmaker desk (impassable, interactive)
  ARCHWAY:  15, // Archway floor (walkable, decorative)
};

// Impassable set for quick lookup
const ARENA_IMPASSABLE = new Set([
  AT.WALL, AT.TROPHY, AT.BANNER, AT.TORCH, AT.GATE,
  AT.RACK, AT.RAILING, AT.PODIUM, AT.PILLAR, AT.DESK
]);

// ─── ARENA MAP DATA ───
// 26 wide x 20 tall
// Legend: 0=stone floor, 1=wall, 2=sand, 3=bench, 4=trophy, 5=banner,
//         6=torch, 7=gate, 8=rack, 9=railing, 10=podium, 11=door,
//         12=pit_edge, 13=pillar, 14=desk, 15=archway
const ARENA_MAP = [
  // y=0  — top wall (trophy hall back wall)
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  // y=1  — trophy hall: cases + banners along top wall
  [1,5,4,4,4,5,1,4,4,5,4,4,4,4,4,5,4,4,4,1,5,4,4,4,5,1],
  // y=2  — trophy hall walkable area
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
  // y=3  — wall separating trophy hall from stands, with openings
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // y=4  — top spectator stands row 1
  [1,6,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,6,1],
  // y=5  — top spectator stands row 2
  [1,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,1],
  // y=6  — top railing above pit
  [1,0,0,0,0,13,9,9,9,9,9,9,9,9,9,9,9,9,9,9,13,0,0,0,0,1],
  // y=7  — challenger's gate (left) | pit top row | armory (right)
  [1,7,7,15,0,0,12,12,12,12,12,12,12,12,12,12,12,12,12,12,0,0,15,8,8,1],
  // y=8  — gate area | sand pit | weapon racks
  [1,6,0,15,0,0,12,2,2,2,2,2,2,2,2,2,2,2,2,12,0,0,15,0,6,1],
  // y=9  — gate torches | sand pit with podium center | rack area
  [1,0,0,0,0,0,12,2,2,2,2,2,10,2,2,2,2,2,2,12,0,0,0,8,0,1],
  // y=10 — left stands | sand pit center row | right stands
  [1,0,0,0,0,0,12,2,2,2,2,2,2,2,2,2,2,2,2,12,0,0,0,0,0,1],
  // y=11 — left stands | sand pit | right stands + betting nook
  [1,6,0,0,0,0,12,2,2,2,2,2,2,2,2,2,2,2,2,12,0,0,0,8,6,1],
  // y=12 — bottom railing below pit
  [1,0,0,0,0,13,9,9,9,9,9,9,9,9,9,9,9,9,9,9,13,0,0,0,0,1],
  // y=13 — bottom spectator stands row 1
  [1,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,1],
  // y=14 — bottom spectator stands row 2
  [1,6,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,6,1],
  // y=15 — open floor below stands
  [1,0,0,0,0,0,0,13,0,0,0,0,0,0,0,0,13,0,0,0,0,14,14,0,0,1],
  // y=16 — open floor + betting corner desk
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,0,0,1],
  // y=17 — open floor with path to door
  [1,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,1],
  // y=18 — bottom area + exit door
  [1,0,0,0,0,6,0,0,0,0,0,0,11,11,0,0,0,0,0,0,6,0,0,0,0,1],
  // y=19 — bottom wall
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ─── ARENA NPCs ───
const ARENA_NPCS = [
  {
    id: 'arenamaster',
    name: 'Kael',
    title: 'Arena Master',
    x: 8, y: 7.5,
    color: '#cc4444',
    facing: 'right',
    dialogue: [
      "This is The Pit. Countless warriors have bled on that sand. Respect it.",
      "You want to fight? Step into the ring. That's all the invitation you need.",
      "Rankings are earned, not given. Every loss teaches more than a win.",
      "I've overseen a thousand bouts. The ones who survive longest? They study their opponent first.",
      "Honor the arena. No cheap tricks, no running. Stand and deliver.",
    ],
  },
  {
    id: 'oldchampion',
    name: 'Vex',
    title: 'Old Champion',
    x: 3, y: 2,
    color: '#88aacc',
    facing: 'down',
    dialogue: [
      "These trophies... each one a lifetime of training. *stares wistfully*",
      "I was undefeated for three seasons. Then a kid half my age humbled me in two rounds.",
      "The secret to winning? Know when to hold back. Aggression without strategy is just noise.",
      "See that banner? That was mine. 'The Iron Gale,' they called me. Long time ago now.",
      "You've got the look of a fighter. Don't let this place chew you up.",
    ],
  },
  {
    id: 'bookie',
    name: 'Finn',
    title: 'Bookie',
    x: 22, y: 15.5,
    color: '#aa9944',
    facing: 'left',
    dialogue: [
      "Psst... interested in the odds? *slides a tattered notebook across the desk*",
      "Betting's not officially open yet, but between you and me... I'm taking notes.",
      "That arena master thinks this place is about honor. Ha. It's about coin.",
      "I've got a system. Sixty percent of the time, it works every time.",
      "Come back when the betting window opens. You won't regret it. ...Probably.",
    ],
  },
];

// ─── ARENA AMBIENT ITEMS ───
// Small decorative details drawn on top of tiles
const ARENA_DECOR = [
  { x: 9,  y: 9.3, type: 'skull' },
  { x: 16, y: 10.3, type: 'skull' },
  { x: 12, y: 8, type: 'sword' },
  { x: 14, y: 11, type: 'shield' },
  { x: 10.5, y: 10, type: 'bones' },
  { x: 15.5, y: 9, type: 'bones' },
];


// ═══════ ENTER / EXIT ═══════

function enterArena() {
  // Save overworld position
  arenaSavedOverworldX = G.x;
  arenaSavedOverworldY = G.y;

  // Switch to arena mode
  arenaActive = true;
  arenaPlayerX = 12.5;    // start at door
  arenaPlayerY = 18;
  arenaPlayerDir = 'up';
  arenaPlayerFrame = 0;
  arenaAmbientParticles = [];
  arenaNotification = { text: 'The Battle Arena', timer: 180 };

  // Spawn initial ambient particles
  for (let i = 0; i < 15; i++) {
    arenaAmbientParticles.push(createArenaParticle());
  }
}

function exitArena() {
  arenaActive = false;

  // Restore overworld position (nudge slightly away from building so we don't re-enter)
  G.x = arenaSavedOverworldX;
  G.y = arenaSavedOverworldY + 1;
  G.direction = 'down';
}


// ═══════ MOVEMENT & COLLISION ═══════

function updateArena(dt, keys) {
  if (!arenaActive) return;

  arenaAnimTime += dt;

  // Movement
  let dx = 0, dy = 0;
  const ARENA_SPEED = 2.2;

  if (keys['w'] || keys['arrowup'])    dy = -ARENA_SPEED;
  if (keys['s'] || keys['arrowdown'])  dy = ARENA_SPEED;
  if (keys['a'] || keys['arrowleft'])  dx = -ARENA_SPEED;
  if (keys['d'] || keys['arrowright']) dx = ARENA_SPEED;

  // Diagonal normalization
  if (dx && dy) { dx *= 0.707; dy *= 0.707; }

  if (dx || dy) {
    // Update direction
    if (Math.abs(dx) > Math.abs(dy)) {
      arenaPlayerDir = dx > 0 ? 'right' : 'left';
    } else {
      arenaPlayerDir = dy > 0 ? 'down' : 'up';
    }
    arenaPlayerFrame += dt * 6;
  }

  const step = 0.05;
  const newX = arenaPlayerX + dx * step;
  const newY = arenaPlayerY + dy * step;

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
      if (tx < 0 || tx >= ARENA_W || ty < 0 || ty >= ARENA_H) return false;
      if (ARENA_IMPASSABLE.has(ARENA_MAP[ty][tx])) return false;
    }
    return true;
  };

  // Slide movement (try X and Y independently)
  if (canMove(newX, arenaPlayerY)) arenaPlayerX = newX;
  if (canMove(arenaPlayerX, newY)) arenaPlayerY = newY;

  // Clamp
  arenaPlayerX = Math.max(0.5, Math.min(ARENA_W - 0.5, arenaPlayerX));
  arenaPlayerY = Math.max(0.5, Math.min(ARENA_H - 0.5, arenaPlayerY));

  // Exit door check
  const doorDist = Math.sqrt(
    Math.min((arenaPlayerX - 12) ** 2, (arenaPlayerX - 13) ** 2) +
    (arenaPlayerY - 18) ** 2
  );
  if (doorDist < 0.8 && arenaPlayerDir === 'down') {
    // Show "Press E to leave" prompt handled in render
  }

  // Interaction cooldown
  if (arenaInteractCooldown > 0) arenaInteractCooldown -= dt;

  // Update ambient particles
  updateArenaParticles(dt);

  // Update notification
  if (arenaNotification && arenaNotification.timer > 0) {
    arenaNotification.timer -= 1;
  }
}


// ═══════ INTERACTION ═══════

function arenaInteract() {
  if (!arenaActive) return;
  if (arenaInteractCooldown > 0) return;
  arenaInteractCooldown = 0.5;

  const px = arenaPlayerX;
  const py = arenaPlayerY;

  // Check exit door
  const doorDist = Math.sqrt(
    Math.min((px - 12) ** 2, (px - 13) ** 2) +
    (py - 18) ** 2
  );
  if (doorDist < 1.5) {
    exitArena();
    return;
  }

  // Check NPC interaction (range 2 tiles)
  for (const npc of ARENA_NPCS) {
    const dist = Math.sqrt((px - npc.x) ** 2 + (py - npc.y) ** 2);
    if (dist < 2.2) {
      if (npc.id === 'arenamaster') {
        // Arena Master opens PvP arena
        showArenaDialogue(npc.title ? `${npc.name} the ${npc.title}` : npc.name,
          "Looking for a fight? I can set you up with a challenger!", npc.color);
        if (typeof openArena === 'function') openArena();
      } else if (npc.id === 'bookie') {
        // Betting Corner — future feature teaser
        showArenaDialogue(npc.title ? `${npc.name} the ${npc.title}` : npc.name,
          "Place your bets! 5 coins on the next match. ...Betting window opens soon. Stay tuned.", npc.color);
      } else {
        const line = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
        showArenaDialogue(npc.title ? `${npc.name} the ${npc.title}` : npc.name, line, npc.color);
      }
      // Charisma XP for talking to arena NPCs
      if (typeof addProfessionXP === 'function') addProfessionXP('charisma', 1);
      return;
    }
  }

  // Check interactive tiles in adjacent cells
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = Math.floor(px) + dx;
      const ty = Math.floor(py) + dy;
      if (tx >= 0 && tx < ARENA_W && ty >= 0 && ty < ARENA_H) {
        if (ARENA_MAP[ty][tx] === AT.PODIUM) {
          // Central pit podium — open PvP arena
          if (typeof openArena === 'function') openArena();
          return;
        }
        if (ARENA_MAP[ty][tx] === AT.TROPHY) {
          // Show player's arena record if available, then flavor text
          let recordText = '';
          if (typeof G !== 'undefined' && (G.arenaWins !== undefined || G.arenaLosses !== undefined)) {
            const wins = G.arenaWins || 0;
            const losses = G.arenaLosses || 0;
            recordText = `Your Arena Record: ${wins}W - ${losses}L. `;
          }
          const trophyLines = [
            "A gleaming golden chalice inscribed: 'Season I Champion — The Iron Gale.'",
            "A crystal orb pulses faintly. The plaque reads: 'Most Devastating KO — Round 7, Year 3.'",
            "A tattered championship belt behind glass. Still smells faintly of sweat and glory.",
            "A row of silver medals. Dozens of names etched in tiny script — legends, all of them.",
            "A massive sword mounted on velvet. 'Ceremonial — awarded to the Undefeated.'",
          ];
          const flavorLine = trophyLines[Math.floor(Math.random() * trophyLines.length)];
          showArenaDialogue('Trophy Hall', recordText + flavorLine, '#daa520');
          return;
        }
        if (ARENA_MAP[ty][tx] === AT.RACK) {
          const rackLines = [
            "Rows of practice weapons — dulled blades, weighted staves, padded shields. Well-maintained.",
            "A rack of throwing knives. Each one perfectly balanced. Don't touch.",
            "Heavy training gauntlets hang from iron hooks. They've seen a lot of use.",
            "Shield after shield, each bearing the scars of a hundred sparring sessions.",
          ];
          showArenaDialogue('Weapon Rack', rackLines[Math.floor(Math.random() * rackLines.length)], '#8899aa');
          return;
        }
        if (ARENA_MAP[ty][tx] === AT.GATE) {
          showArenaDialogue("Challenger's Gate", "The iron gate is cold to the touch. Beyond it, the roar of an imagined crowd echoes in your mind.", '#667788');
          return;
        }
        if (ARENA_MAP[ty][tx] === AT.DESK) {
          showArenaDialogue('Betting Desk', "Place your bets! 5 coins on the next match. ...Scraps of parchment covered in odds, tallies, and crossed-out names. A sign reads: 'BETTING WINDOW — COMING SOON.'", '#aa9944');
          return;
        }
        if (ARENA_MAP[ty][tx] === AT.TORCH) {
          showArenaDialogue('Torch Pillar', 'The flames dance endlessly, fed by some unseen source. The heat is fierce up close.', '#ff8844');
          return;
        }
      }
    }
  }

  // Check bench (sit emote)
  const tileUnder = ARENA_MAP[Math.floor(py)]?.[Math.floor(px)];
  if (tileUnder === AT.BENCH) {
    arenaNotification = { text: '*takes a seat in the stands*', timer: 90 };
    if (typeof addProfessionXP === 'function') addProfessionXP('charisma', 1);
    return;
  }

  // Check sand (step into the ring)
  if (tileUnder === AT.SAND) {
    arenaNotification = { text: 'Step into the ring to challenge another player!', timer: 90 };
    if (typeof openArena === 'function') openArena();
    return;
  }
}

// ─── Arena dialogue (uses the existing showDialogue if available, else custom) ───
let arenaDialogueActive = false;
let arenaDialogueData = null;

function showArenaDialogue(name, text, color) {
  arenaDialogueActive = true;
  arenaDialogueData = { name, text, color: color || '#8899aa' };
}

function closeArenaDialogue() {
  arenaDialogueActive = false;
  arenaDialogueData = null;
}


// ═══════ RENDERING ═══════

function renderArena(ctx, W, H) {
  if (!arenaActive) return;

  const time = arenaAnimTime;

  // Camera — center on player, but clamp so we don't show outside the map
  const mapPixelW = ARENA_W * ARENA_TILE;
  const mapPixelH = ARENA_H * ARENA_TILE;

  let camX, camY;
  if (mapPixelW <= W) {
    camX = (mapPixelW - W) / 2; // center small map
  } else {
    camX = arenaPlayerX * ARENA_TILE - W / 2;
    camX = Math.max(0, Math.min(mapPixelW - W, camX));
  }
  if (mapPixelH <= H) {
    camY = (mapPixelH - H) / 2;
  } else {
    camY = arenaPlayerY * ARENA_TILE - H / 2;
    camY = Math.max(0, Math.min(mapPixelH - H, camY));
  }

  // Background — dark stone ambiance
  ctx.fillStyle = '#08090c';
  ctx.fillRect(0, 0, W, H);

  // Draw tiles
  const startTX = Math.max(0, Math.floor(camX / ARENA_TILE) - 1);
  const startTY = Math.max(0, Math.floor(camY / ARENA_TILE) - 1);
  const endTX = Math.min(ARENA_W, Math.ceil((camX + W) / ARENA_TILE) + 1);
  const endTY = Math.min(ARENA_H, Math.ceil((camY + H) / ARENA_TILE) + 1);

  for (let ty = startTY; ty < endTY; ty++) {
    for (let tx = startTX; tx < endTX; tx++) {
      const sx = tx * ARENA_TILE - camX;
      const sy = ty * ARENA_TILE - camY;
      const tile = ARENA_MAP[ty]?.[tx];
      if (tile === undefined) continue;

      drawArenaTile(ctx, tile, sx, sy, tx, ty, time);
    }
  }

  // Draw decor items
  for (const d of ARENA_DECOR) {
    const sx = d.x * ARENA_TILE - camX;
    const sy = d.y * ARENA_TILE - camY;
    drawArenaDecor(ctx, d.type, sx, sy, time);
  }

  // Draw ambient particles (torch sparks, pit dust, etc.)
  renderArenaParticles(ctx, camX, camY);

  // Draw NPCs
  for (const npc of ARENA_NPCS) {
    drawArenaNPC(ctx, npc, camX, camY, time);
  }

  // Draw player
  const playerSX = arenaPlayerX * ARENA_TILE - camX;
  const playerSY = arenaPlayerY * ARENA_TILE - camY;

  // Player shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(playerSX, playerSY + 14, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Use the existing sprite system if available
  if (typeof drawSprite === 'function' && G.sprite !== undefined) {
    drawSprite(ctx, G.sprite, playerSX - 24, playerSY - 36, 2.5, arenaPlayerDir, Math.floor(arenaPlayerFrame) % 4);
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
  const door1SX = 12 * ARENA_TILE - camX;
  const door2SX = 13 * ARENA_TILE - camX;
  const doorSY = 18 * ARENA_TILE - camY;
  const doorDistRender = Math.sqrt(
    Math.min((arenaPlayerX - 12) ** 2, (arenaPlayerX - 13) ** 2) +
    (arenaPlayerY - 18) ** 2
  );
  if (doorDistRender < 2) {
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,255,200,${0.6 + Math.sin(time * 3) * 0.3})`;
    ctx.fillText('[E] Leave', (door1SX + door2SX) / 2 + ARENA_TILE / 2, doorSY - 8);
  }

  // NPC prompts
  for (const npc of ARENA_NPCS) {
    const dist = Math.sqrt((arenaPlayerX - npc.x) ** 2 + (arenaPlayerY - npc.y) ** 2);
    if (dist < 2.5 && dist > 0.5) {
      const nsx = npc.x * ARENA_TILE - camX;
      const nsy = npc.y * ARENA_TILE - camY;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255,255,200,${0.5 + Math.sin(time * 2.5) * 0.3})`;
      ctx.fillText(`[E] Talk to ${npc.name}`, nsx, nsy - 42);
    }
  }

  // Interactive object prompts
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = Math.floor(arenaPlayerX) + dx;
      const ty = Math.floor(arenaPlayerY) + dy;
      if (tx >= 0 && tx < ARENA_W && ty >= 0 && ty < ARENA_H) {
        const tile = ARENA_MAP[ty][tx];
        let label = null;
        if (tile === AT.PODIUM) label = '[E] Enter the Pit';
        else if (tile === AT.TROPHY) label = '[E] Examine';
        else if (tile === AT.RACK) label = '[E] Inspect';
        else if (tile === AT.GATE) label = '[E] Examine';
        else if (tile === AT.DESK) label = '[E] Check Odds';
        if (label) {
          const osx = tx * ARENA_TILE - camX + ARENA_TILE / 2;
          const osy = ty * ARENA_TILE - camY - 4;
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
  ctx.fillStyle = `rgba(180,60,60,${headerAlpha})`;
  ctx.fillText('The Battle Arena', W / 2, 28);
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(140,120,100,0.5)';
  ctx.fillText('Colosseum of Champions', W / 2, 42);

  // Notification toast
  if (arenaNotification && arenaNotification.timer > 0) {
    const alpha = Math.min(1, arenaNotification.timer / 30);
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,200,140,${alpha})`;
    ctx.fillText(arenaNotification.text, W / 2, H - 40);
  }

  // ─── Dialogue overlay (skip canvas draw if Spirit Comms is handling it) ───
  if (arenaDialogueActive && arenaDialogueData && typeof showComm !== 'function') {
    drawArenaDialogue(ctx, W, H);
  }

  // Vignette effect — cool blue-grey stone with warm torch edges
  const vignette = ctx.createRadialGradient(W/2, H/2, Math.min(W,H) * 0.3, W/2, H/2, Math.max(W,H) * 0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(5,5,12,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}


// ═══════ TILE RENDERING ═══════

function drawArenaTile(ctx, tile, sx, sy, tx, ty, time) {
  const T = ARENA_TILE;

  switch (tile) {
    case AT.FLOOR: {
      // Stone slab floor
      ctx.fillStyle = '#33363d';
      ctx.fillRect(sx, sy, T, T);
      // Stone slab lines
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 1, sy + 1, T - 2, T - 2);
      // Subtle color variation per stone
      const stoneVar = ((tx * 7 + ty * 13) % 5);
      ctx.fillStyle = `rgba(${50 + stoneVar * 3},${52 + stoneVar * 2},${58 + stoneVar * 4},0.3)`;
      ctx.fillRect(sx, sy, T, T);
      // Faint crack detail
      if ((tx + ty * 3) % 7 === 0) {
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(sx + 5, sy + T/3);
        ctx.lineTo(sx + T/2 + 3, sy + T/2 + 5);
        ctx.stroke();
      }
      break;
    }

    case AT.WALL: {
      // Heavy stone wall
      ctx.fillStyle = '#262830';
      ctx.fillRect(sx, sy, T, T);
      // Large stone brick pattern
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      const brickOffset = (ty % 2) * (T / 2);
      ctx.strokeRect(sx + brickOffset, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset - T / 2, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset + T / 2, sy, T / 2, T / 2);
      ctx.strokeRect(sx + brickOffset, sy + T / 2, T / 2, T / 2);
      // Slight color variation per brick
      ctx.fillStyle = `rgba(${45 + (tx * 7 % 15)},${48 + (ty * 11 % 12)},${55 + (tx * 3 % 10)},0.3)`;
      ctx.fillRect(sx, sy, T, T);
      break;
    }

    case AT.SAND: {
      // Pit sand/dirt floor
      ctx.fillStyle = '#6a5535';
      ctx.fillRect(sx, sy, T, T);
      // Grainy sand texture dots
      const seed = tx * 31 + ty * 17;
      for (let i = 0; i < 6; i++) {
        const dotX = ((seed + i * 43) % (T - 4)) + 2;
        const dotY = ((seed + i * 67) % (T - 4)) + 2;
        const dotBright = ((seed + i * 11) % 30) - 15;
        ctx.fillStyle = `rgba(${110 + dotBright},${90 + dotBright},${55 + dotBright},0.3)`;
        ctx.beginPath();
        ctx.arc(sx + dotX, sy + dotY, 1 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      // Slight warm tone variation
      ctx.fillStyle = `rgba(120,95,55,${0.05 + Math.sin(tx * 1.1 + ty * 0.8) * 0.03})`;
      ctx.fillRect(sx, sy, T, T);
      break;
    }

    case AT.BENCH: {
      // Stone floor base
      drawArenaTile(ctx, AT.FLOOR, sx, sy, tx, ty, time);
      // Stone bench
      ctx.fillStyle = '#4a4d58';
      ctx.fillRect(sx + 2, sy + 8, T - 4, T - 16);
      // Bench top surface
      ctx.fillStyle = '#585c68';
      ctx.fillRect(sx + 2, sy + 8, T - 4, 4);
      // Wear marks
      ctx.fillStyle = 'rgba(80,84,95,0.5)';
      ctx.fillRect(sx + 6, sy + 10, 8, T - 20);
      ctx.fillRect(sx + T - 16, sy + 10, 8, T - 20);
      break;
    }

    case AT.TROPHY: {
      // Wall background
      drawArenaTile(ctx, AT.WALL, sx, sy, tx, ty, time);
      // Glass case
      ctx.fillStyle = 'rgba(100,130,160,0.15)';
      ctx.fillRect(sx + 4, sy + 4, T - 8, T - 8);
      ctx.strokeStyle = 'rgba(120,150,180,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 4, sy + 4, T - 8, T - 8);
      // Trophy inside — alternate between chalice and medal
      if ((tx + ty) % 2 === 0) {
        // Chalice
        ctx.fillStyle = '#daa520';
        ctx.fillRect(sx + T/2 - 4, sy + T/2 - 2, 8, 6);
        ctx.fillRect(sx + T/2 - 2, sy + T/2 + 4, 4, 4);
        ctx.fillRect(sx + T/2 - 5, sy + T/2 + 8, 10, 2);
        // Cup rim
        ctx.fillStyle = '#eebb30';
        ctx.fillRect(sx + T/2 - 5, sy + T/2 - 4, 10, 3);
      } else {
        // Medal on stand
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.arc(sx + T/2, sy + T/2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#daa520';
        ctx.beginPath();
        ctx.arc(sx + T/2, sy + T/2, 3, 0, Math.PI * 2);
        ctx.fill();
        // Ribbon
        ctx.fillStyle = '#cc3333';
        ctx.fillRect(sx + T/2 - 1, sy + T/2 - 10, 2, 5);
      }
      // Glass reflection
      ctx.fillStyle = 'rgba(180,200,255,0.08)';
      ctx.fillRect(sx + 6, sy + 6, 4, T - 14);
      break;
    }

    case AT.BANNER: {
      // Wall background
      drawArenaTile(ctx, AT.WALL, sx, sy, tx, ty, time);
      // Banner pole
      ctx.fillStyle = '#5a5040';
      ctx.fillRect(sx + T/2 - 2, sy, 4, T);
      // Banner fabric — gentle wave animation
      const wave = Math.sin(time * 2 + tx * 1.5) * 2;
      const wave2 = Math.sin(time * 2.3 + tx * 1.7) * 1.5;
      // Alternate banner colors by position
      const bannerHue = (tx + ty) % 3;
      let bannerColor, bannerDark;
      if (bannerHue === 0) { bannerColor = '#8b2020'; bannerDark = '#6a1515'; }
      else if (bannerHue === 1) { bannerColor = '#204080'; bannerDark = '#152a5a'; }
      else { bannerColor = '#6a5a10'; bannerDark = '#4a3a08'; }

      ctx.fillStyle = bannerColor;
      ctx.beginPath();
      ctx.moveTo(sx + T/2 + 2, sy + 4);
      ctx.lineTo(sx + T/2 + 14 + wave, sy + 8);
      ctx.lineTo(sx + T/2 + 12 + wave2, sy + T - 8);
      ctx.lineTo(sx + T/2 + 8 + wave, sy + T - 4);
      ctx.lineTo(sx + T/2 + 10 + wave2, sy + T/2);
      ctx.lineTo(sx + T/2 + 2, sy + 6);
      ctx.closePath();
      ctx.fill();
      // Banner dark stripe
      ctx.fillStyle = bannerDark;
      ctx.beginPath();
      ctx.moveTo(sx + T/2 + 2, sy + T/3);
      ctx.lineTo(sx + T/2 + 13 + wave, sy + T/3 + 2);
      ctx.lineTo(sx + T/2 + 12 + wave2, sy + T/3 + 6);
      ctx.lineTo(sx + T/2 + 2, sy + T/3 + 4);
      ctx.closePath();
      ctx.fill();
      // Pole cap
      ctx.fillStyle = '#daa520';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + 2, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case AT.TORCH: {
      // Stone floor base
      drawArenaTile(ctx, AT.FLOOR, sx, sy, tx, ty, time);
      // Stone pillar base
      ctx.fillStyle = '#4a4a55';
      ctx.fillRect(sx + T/2 - 7, sy + T - 14, 14, 14);
      ctx.fillStyle = '#555560';
      ctx.fillRect(sx + T/2 - 8, sy + T - 16, 16, 4);
      // Pillar shaft
      ctx.fillStyle = '#4a4a50';
      ctx.fillRect(sx + T/2 - 5, sy + 12, 10, T - 26);
      // Iron torch bracket
      ctx.fillStyle = '#555';
      ctx.fillRect(sx + T/2 - 3, sy + 8, 6, 6);
      // Fire!
      const fireFlicker = Math.sin(time * 2 + tx * 5) * 3;
      const fireFlicker2 = Math.cos(time * 1.5 + ty * 3) * 2;
      // Outer glow — warm torch light
      const glowR = 24 + fireFlicker;
      const glow = ctx.createRadialGradient(sx + T/2, sy + 6, 2, sx + T/2, sy + 6, glowR);
      glow.addColorStop(0, 'rgba(255,140,30,0.7)');
      glow.addColorStop(0.4, 'rgba(255,90,10,0.25)');
      glow.addColorStop(1, 'rgba(255,50,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(sx - 15, sy - 20, T + 30, T + 20);
      // Flame shapes
      ctx.fillStyle = '#ff6610';
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 5, sy + 10);
      ctx.quadraticCurveTo(sx + T/2 - 1 + fireFlicker2, sy - 4 + fireFlicker, sx + T/2 + 1, sy + 10);
      ctx.fill();
      ctx.fillStyle = '#ffaa20';
      ctx.beginPath();
      ctx.moveTo(sx + T/2 + 1, sy + 8);
      ctx.quadraticCurveTo(sx + T/2 + 3 + fireFlicker, sy - 2 + fireFlicker2, sx + T/2 + 5, sy + 8);
      ctx.fill();
      // Hot core
      ctx.fillStyle = '#ffdd60';
      ctx.beginPath();
      ctx.arc(sx + T/2 + fireFlicker2/3, sy + 4 + fireFlicker/3, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Bright white center
      ctx.fillStyle = 'rgba(255,255,200,0.6)';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + 6, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case AT.GATE: {
      // Wall background
      drawArenaTile(ctx, AT.WALL, sx, sy, tx, ty, time);
      // Iron gate bars
      ctx.fillStyle = '#3a3a44';
      ctx.fillRect(sx + 2, sy, T - 4, T);
      // Vertical bars
      ctx.fillStyle = '#555560';
      for (let i = 0; i < 5; i++) {
        const bx = sx + 6 + i * 8;
        ctx.fillRect(bx, sy + 2, 3, T - 4);
      }
      // Horizontal crossbar
      ctx.fillStyle = '#4a4a55';
      ctx.fillRect(sx + 4, sy + T/3, T - 8, 4);
      ctx.fillRect(sx + 4, sy + T * 2/3, T - 8, 4);
      // Iron rivets
      ctx.fillStyle = '#666';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(sx + 7 + i * 8, sy + T/3 + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case AT.RACK: {
      // Wall background
      drawArenaTile(ctx, AT.WALL, sx, sy, tx, ty, time);
      // Wooden rack frame
      ctx.fillStyle = '#5a4020';
      ctx.fillRect(sx + 4, sy + 6, T - 8, 3);
      ctx.fillRect(sx + 4, sy + T - 12, T - 8, 3);
      ctx.fillRect(sx + 6, sy + 6, 3, T - 15);
      ctx.fillRect(sx + T - 9, sy + 6, 3, T - 15);
      // Weapons on rack
      // Sword
      ctx.fillStyle = '#aaaacc';
      ctx.fillRect(sx + 12, sy + 10, 2, 22);
      ctx.fillStyle = '#6a5030';
      ctx.fillRect(sx + 10, sy + 30, 6, 4);
      // Spear
      ctx.fillStyle = '#7a6040';
      ctx.fillRect(sx + 22, sy + 8, 2, 26);
      ctx.fillStyle = '#aaaacc';
      ctx.beginPath();
      ctx.moveTo(sx + 23, sy + 8);
      ctx.lineTo(sx + 26, sy + 14);
      ctx.lineTo(sx + 23, sy + 12);
      ctx.lineTo(sx + 20, sy + 14);
      ctx.closePath();
      ctx.fill();
      // Shield below
      ctx.fillStyle = '#4a5a6a';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2 + 2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#5a6a7a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2 + 2, 8, 0, Math.PI * 2);
      ctx.stroke();
      // Shield boss
      ctx.fillStyle = '#888';
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2 + 2, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case AT.RAILING: {
      // Stone floor base
      drawArenaTile(ctx, AT.FLOOR, sx, sy, tx, ty, time);
      // Stone railing
      ctx.fillStyle = '#4a4a55';
      ctx.fillRect(sx, sy + T/2 - 4, T, 8);
      // Railing top
      ctx.fillStyle = '#5a5a65';
      ctx.fillRect(sx, sy + T/2 - 6, T, 3);
      // Railing posts
      ctx.fillStyle = '#555560';
      ctx.fillRect(sx + 2, sy + T/2 - 8, 5, 16);
      ctx.fillRect(sx + T - 7, sy + T/2 - 8, 5, 16);
      // Post caps
      ctx.fillStyle = '#666670';
      ctx.beginPath();
      ctx.arc(sx + 4.5, sy + T/2 - 9, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx + T - 4.5, sy + T/2 - 9, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case AT.PODIUM: {
      // Sand base (it's in the pit)
      drawArenaTile(ctx, AT.SAND, sx, sy, tx, ty, time);
      // Podium — raised stone circle
      ctx.fillStyle = '#555565';
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2 + 2, T/2 - 4, T/2 - 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#606070';
      ctx.beginPath();
      ctx.ellipse(sx + T/2, sy + T/2, T/2 - 6, T/2 - 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Glowing rune circle
      const runeGlow = 0.4 + Math.sin(time * 2) * 0.2;
      ctx.strokeStyle = `rgba(200,60,60,${runeGlow})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx + T/2, sy + T/2, 10, 0, Math.PI * 2);
      ctx.stroke();
      // Cross rune
      ctx.strokeStyle = `rgba(200,60,60,${runeGlow * 0.8})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 6, sy + T/2);
      ctx.lineTo(sx + T/2 + 6, sy + T/2);
      ctx.moveTo(sx + T/2, sy + T/2 - 6);
      ctx.lineTo(sx + T/2, sy + T/2 + 6);
      ctx.stroke();
      // Glow effect
      const podGlow = ctx.createRadialGradient(sx + T/2, sy + T/2, 2, sx + T/2, sy + T/2, 18);
      podGlow.addColorStop(0, `rgba(200,60,60,${runeGlow * 0.3})`);
      podGlow.addColorStop(1, 'rgba(200,60,60,0)');
      ctx.fillStyle = podGlow;
      ctx.fillRect(sx, sy, T, T);
      break;
    }

    case AT.DOOR: {
      // Stone floor first
      drawArenaTile(ctx, AT.FLOOR, sx, sy, tx, ty, time);
      // Grand doorframe
      ctx.fillStyle = '#5a4a30';
      ctx.fillRect(sx + T/2 - 12, sy + 2, 24, T - 4);
      // Door panels
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(sx + T/2 - 10, sy + 4, 20, T - 8);
      // Iron reinforcement bands
      ctx.fillStyle = '#555';
      ctx.fillRect(sx + T/2 - 10, sy + 10, 20, 2);
      ctx.fillRect(sx + T/2 - 10, sy + T - 14, 20, 2);
      // Ring handle
      ctx.strokeStyle = '#aa8833';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx + T/2 + 4, sy + T/2 + 2, 3, 0, Math.PI * 2);
      ctx.stroke();
      // Light beam from outside
      const beamAlpha = 0.1 + Math.sin(time * 0.5) * 0.03;
      ctx.fillStyle = `rgba(180,200,255,${beamAlpha})`;
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 10, sy + T);
      ctx.lineTo(sx + T/2 - 22, sy + T + 30);
      ctx.lineTo(sx + T/2 + 22, sy + T + 30);
      ctx.lineTo(sx + T/2 + 10, sy + T);
      ctx.fill();
      break;
    }

    case AT.PIT_EDGE: {
      // Transition ring between stone floor and sand pit
      ctx.fillStyle = '#55503a';
      ctx.fillRect(sx, sy, T, T);
      // Stone border trim
      ctx.fillStyle = '#4a4a55';
      ctx.fillRect(sx, sy, T, 4);
      ctx.fillRect(sx, sy + T - 4, T, 4);
      // Sand bleeding through
      ctx.fillStyle = 'rgba(106,85,53,0.4)';
      ctx.fillRect(sx + 2, sy + 6, T - 4, T - 12);
      // Scuff marks
      if ((tx + ty) % 3 === 0) {
        ctx.strokeStyle = 'rgba(90,75,45,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx + 4, sy + T/2);
        ctx.lineTo(sx + T - 4, sy + T/2 + 3);
        ctx.stroke();
      }
      break;
    }

    case AT.PILLAR: {
      // Stone floor base
      drawArenaTile(ctx, AT.FLOOR, sx, sy, tx, ty, time);
      // Massive stone pillar
      ctx.fillStyle = '#4a4a55';
      ctx.fillRect(sx + T/2 - 8, sy + 2, 16, T - 4);
      // Capital (top detail) — decorative wider top
      ctx.fillStyle = '#555560';
      ctx.fillRect(sx + T/2 - 10, sy + 2, 20, 6);
      // Base — wider foundation
      ctx.fillStyle = '#555560';
      ctx.fillRect(sx + T/2 - 10, sy + T - 8, 20, 6);
      // Carved groove detail
      ctx.strokeStyle = 'rgba(70,70,80,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx + T/2 - 4, sy + 10);
      ctx.lineTo(sx + T/2 - 4, sy + T - 10);
      ctx.moveTo(sx + T/2 + 4, sy + 10);
      ctx.lineTo(sx + T/2 + 4, sy + T - 10);
      ctx.stroke();
      break;
    }

    case AT.DESK: {
      // Stone floor base
      drawArenaTile(ctx, AT.FLOOR, sx, sy, tx, ty, time);
      // Wooden desk
      ctx.fillStyle = '#5a3a18';
      ctx.fillRect(sx + 2, sy + 4, T - 4, T - 8);
      // Desktop surface
      ctx.fillStyle = '#6a4a28';
      ctx.fillRect(sx + 2, sy + 4, T - 4, 6);
      // Papers/ledger on desk
      ctx.fillStyle = '#d8d0b8';
      ctx.fillRect(sx + 6, sy + 8, 12, 8);
      ctx.fillStyle = '#c8c0a8';
      ctx.fillRect(sx + T/2 + 2, sy + 10, 10, 6);
      // Ink lines on papers
      ctx.strokeStyle = 'rgba(40,30,20,0.3)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(sx + 8, sy + 10 + i * 2);
        ctx.lineTo(sx + 16, sy + 10 + i * 2);
        ctx.stroke();
      }
      // Coin stack
      ctx.fillStyle = '#daa520';
      ctx.beginPath();
      ctx.ellipse(sx + T - 10, sy + T/2, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c89918';
      ctx.beginPath();
      ctx.ellipse(sx + T - 10, sy + T/2 - 2, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#daa520';
      ctx.beginPath();
      ctx.ellipse(sx + T - 10, sy + T/2 - 4, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case AT.ARCHWAY: {
      // Stone floor base
      drawArenaTile(ctx, AT.FLOOR, sx, sy, tx, ty, time);
      // Archway shadow — darker floor to suggest overhead arch
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(sx, sy, T, T);
      // Arch edge stones on the sides
      ctx.fillStyle = '#3a3a45';
      ctx.fillRect(sx, sy, 4, T);
      ctx.fillRect(sx + T - 4, sy, 4, T);
      break;
    }
  }
}


// ═══════ NPC RENDERING ═══════

function drawArenaNPC(ctx, npc, camX, camY, time) {
  const sx = npc.x * ARENA_TILE - camX;
  const sy = npc.y * ARENA_TILE - camY;

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
  if (npc.id === 'arenamaster') {
    // Stern crossed-arms posture — wider shoulders
    ctx.fillStyle = npc.color;
    ctx.fillRect(sx - 9, sy - 2, 18, 6);
    // Scar across face
    ctx.strokeStyle = 'rgba(200,150,150,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx - 4, sy - 16 + headBob);
    ctx.lineTo(sx + 2, sy - 10 + headBob);
    ctx.stroke();
  }

  if (npc.id === 'oldchampion') {
    // Walking cane
    ctx.strokeStyle = '#7a6040';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + 10, sy - 4);
    ctx.lineTo(sx + 12, sy + 14);
    ctx.stroke();
    // Curved handle
    ctx.beginPath();
    ctx.arc(sx + 8, sy - 4, 3, -Math.PI/2, Math.PI/4);
    ctx.stroke();
  }

  if (npc.id === 'bookie') {
    // Shady hat
    ctx.fillStyle = '#3a3528';
    ctx.beginPath();
    ctx.ellipse(sx, sy - 18 + headBob, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(sx - 6, sy - 22 + headBob, 12, 5);
    // Shifty eye movement
    const shifty = Math.sin(time * 1.2) * 1.5;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(sx - 3 + shifty, sy - 13 + headBob + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 3 + shifty, sy - 13 + headBob + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}


// ═══════ DECOR RENDERING ═══════

function drawArenaDecor(ctx, type, sx, sy, time) {
  if (type === 'skull') {
    // Tiny skull in the sand
    ctx.fillStyle = 'rgba(200,190,170,0.5)';
    ctx.beginPath();
    ctx.arc(sx + 4, sy + 3, 4, 0, Math.PI * 2);
    ctx.fill();
    // Eye sockets
    ctx.fillStyle = 'rgba(60,50,35,0.6)';
    ctx.beginPath();
    ctx.arc(sx + 2.5, sy + 2, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 5.5, sy + 2, 1, 0, Math.PI * 2);
    ctx.fill();
    // Jaw
    ctx.strokeStyle = 'rgba(180,170,150,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(sx + 4, sy + 5, 2.5, 0, Math.PI);
    ctx.stroke();
  } else if (type === 'sword') {
    // Broken sword half-buried in sand
    ctx.fillStyle = 'rgba(160,160,180,0.4)';
    ctx.save();
    ctx.translate(sx + 6, sy + 4);
    ctx.rotate(0.3);
    ctx.fillRect(-1, -8, 2, 12);
    // Crossguard
    ctx.fillRect(-4, 2, 8, 2);
    ctx.restore();
  } else if (type === 'shield') {
    // Dented shield lying flat
    ctx.fillStyle = 'rgba(80,90,100,0.4)';
    ctx.beginPath();
    ctx.ellipse(sx + 5, sy + 4, 6, 4, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,110,120,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(sx + 5, sy + 4, 6, 4, 0.2, 0, Math.PI * 2);
    ctx.stroke();
    // Dent
    ctx.strokeStyle = 'rgba(60,65,75,0.3)';
    ctx.beginPath();
    ctx.arc(sx + 4, sy + 3, 2, 0, Math.PI);
    ctx.stroke();
  } else if (type === 'bones') {
    // Scattered bones
    ctx.strokeStyle = 'rgba(190,180,160,0.35)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + 8, sy + 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx + 2, sy + 5);
    ctx.lineTo(sx + 7, sy + 1);
    ctx.stroke();
  }
}


// ═══════ DIALOGUE BOX ═══════

function drawArenaDialogue(ctx, W, H) {
  const d = arenaDialogueData;
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
  ctx.fillStyle = 'rgba(15,15,20,0.92)';
  ctx.strokeStyle = d.color || '#8899aa';
  ctx.lineWidth = 2;
  arenaRoundRect(ctx, boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();

  // Name plate
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = d.color || '#8899aa';
  ctx.fillText(d.name, boxX + 16, boxY + 22);

  // Dialogue text (word wrap)
  ctx.font = '12px monospace';
  ctx.fillStyle = '#ccc';
  arenaWrapText(ctx, d.text, boxX + 16, boxY + 44, boxW - 32, 16);

  // Dismiss prompt
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(180,180,200,0.6)';
  ctx.fillText('[E / Click to close]', boxX + boxW - 12, boxY + boxH - 10);
}

// Helper: rounded rect
function arenaRoundRect(ctx, x, y, w, h, r) {
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
function arenaWrapText(ctx, text, x, y, maxWidth, lineHeight) {
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

function createArenaParticle() {
  const type = Math.random();
  if (type < 0.35) {
    // Torch spark — near any torch pillar (corners + sides)
    const torchPositions = [
      [1, 4], [24, 4], [1, 8], [24, 8], [1, 11], [24, 11],
      [1, 14], [24, 14], [5, 18], [20, 18]
    ];
    const tp = torchPositions[Math.floor(Math.random() * torchPositions.length)];
    return {
      kind: 'spark',
      x: (tp[0] + 0.5 + (Math.random() - 0.5) * 0.5) * ARENA_TILE,
      y: (tp[1] + Math.random() * 0.3) * ARENA_TILE,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -Math.random() * 1.8 - 0.5,
      life: 1,
      maxLife: 0.8 + Math.random() * 0.8,
      size: 1 + Math.random() * 2,
    };
  } else if (type < 0.7) {
    // Pit dust — in the sand area (cols 7-18, rows 8-11)
    return {
      kind: 'dust',
      x: (7 + Math.random() * 12) * ARENA_TILE,
      y: (8 + Math.random() * 4) * ARENA_TILE,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.15,
      life: 1,
      maxLife: 3 + Math.random() * 4,
      size: 1 + Math.random() * 1.5,
    };
  } else {
    // Stone dust mote — general atmosphere
    return {
      kind: 'mote',
      x: (2 + Math.random() * 22) * ARENA_TILE,
      y: (2 + Math.random() * 16) * ARENA_TILE,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.1,
      life: 1,
      maxLife: 4 + Math.random() * 4,
      size: 0.5 + Math.random() * 0.8,
    };
  }
}

function updateArenaParticles(dt) {
  for (let i = arenaAmbientParticles.length - 1; i >= 0; i--) {
    const p = arenaAmbientParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) {
      arenaAmbientParticles.splice(i, 1);
    }
  }
  // Replenish
  while (arenaAmbientParticles.length < 10) {
    arenaAmbientParticles.push(createArenaParticle());
  }
}

function renderArenaParticles(ctx, camX, camY) {
  for (const p of arenaAmbientParticles) {
    const sx = p.x - camX;
    const sy = p.y - camY;
    const alpha = Math.min(1, p.life * 2) * 0.6;

    if (p.kind === 'spark') {
      ctx.fillStyle = `rgba(255,${150 + Math.floor(p.size * 40)},20,${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'dust') {
      // Sandy brown pit dust
      ctx.fillStyle = `rgba(180,150,100,${alpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'mote') {
      // Cool grey stone dust
      ctx.fillStyle = `rgba(160,165,180,${alpha * 0.2})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}


// ═══════ INTEGRATION HOOKS ═══════
// These are the touch points where this module connects to the existing game.
//
// 1. REPLACE the openArenaBuilding() call (or whatever triggers the arena)
//    in tryInteract() with enterArena()
//
// 2. In the main gameLoop(), add:
//      if (arenaActive) { updateArena(dt, keys); return; }
//
// 3. In the main render(), add:
//      if (arenaActive) { renderArena(ctx, W, H); return; }
//
// 4. In the keydown handler for 'e', add:
//      if (arenaActive) {
//        if (arenaDialogueActive) { closeArenaDialogue(); }
//        else { arenaInteract(); }
//        return;
//      }
//
// 5. In the Escape key handler, add:
//      if (arenaActive) {
//        if (arenaDialogueActive) { closeArenaDialogue(); }
//        else { exitArena(); }
//        return;
//      }
//
// 6. (Optional) Click handler for dialogue dismiss:
//      if (arenaActive && arenaDialogueActive) { closeArenaDialogue(); }
//
// NOTE: The central podium (AT.PODIUM) calls openArena() when interacted with,
//       which should open the existing PvP battle modal.
//
// That's it! The rest is self-contained.
