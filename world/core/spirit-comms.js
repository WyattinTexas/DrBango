// SPIRIT COMMS — Star Fox 64-style dialogue system
// Replaces the old dialogue overlay with comm boxes
// All functions and variables remain global.

// ═══════ NPC → SPIRITKIN PORTRAIT MAP ═══════
// Maps NPC names to a Spiritkin art path + name color
const NPC_COMM_PORTRAITS = {
  // Friendly NPCs
  'Elder Frost':     { art: '../testroom/art/originals/Cornelius.png', color: '#daa520' },
  'Smith Ember':     { art: '../testroom/art/gary.png',                color: '#ff6633' },
  'Keeper Zara':     { art: '../testroom/art/originals/Katrina.png',   color: '#c0a040' },
  'Farmer Bea':      { art: '../testroom/art/originals/Flora.png',     color: '#6a8a4a' },
  'Herbalist Sage':  { art: '../testroom/art/originals/Cornelius.png', color: '#4a8a6a' },
  'Captain Flint':   { art: '../testroom/art/originals/Floop.png',     color: '#cc6644' },
  'Lava Tender':     { art: '../testroom/art/originals/Haywire.png',   color: '#ff8844' },
  'Shadow Warden':   { art: '../testroom/art/originals/DarkWing.png',  color: '#8a6aaa' },
  'Cursed Scholar':  { art: '../testroom/art/originals/AncientLibrarian.png', color: '#6a4a8a' },
  // Hostile NPCs
  'Brawler Jax':       { art: '../testroom/art/originals/Hugo.png',      color: '#cc4444' },
  'Ice Queen Vera':    { art: '../testroom/art/originals/Sonya.png',     color: '#6688cc' },
  'Bandit Marcus':     { art: '../testroom/art/originals/Outlaw.png',    color: '#aa8844' },
  'Lava Raider Kira':  { art: '../testroom/art/originals/Kodako.png',    color: '#ee8844' },
  'Shadow Knight Vex': { art: '../testroom/art/originals/DarkJeff.png',  color: '#8866aa' },
  'The Exile':         { art: '../testroom/art/originals/Wanderer.png',  color: '#666666' },
  // Quest NPCs
  'Maren':    { art: '../testroom/art/originals/Tabitha.png',  color: '#d4a44a' },
  'Leon':     { art: '../testroom/art/originals/FangOutside.png', color: '#cc5544' },
  'Valkin':   { art: '../testroom/art/originals/ValkinTheGrand.png', color: '#aa44ff' },
  // System / narrator
  'System':   { art: '../testroom/art/originals/Toby.png', color: '#44aaff' },
};

// ═══════ COMM STATE ═══════
let commQueue = [];
let commTyping = false;
let commTypeTimer = null;
let commCurrentCallback = null;

// Audio context for SFX
let commAudioCtx = null;

function commInitAudio() {
  if (!commAudioCtx) {
    try { commAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { /* silent fail */ }
  }
}

function commPlayBlip() {
  if (!commAudioCtx) return;
  try {
    const osc = commAudioCtx.createOscillator();
    const gain = commAudioCtx.createGain();
    osc.connect(gain);
    gain.connect(commAudioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, commAudioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, commAudioCtx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, commAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, commAudioCtx.currentTime + 0.1);
    osc.start(commAudioCtx.currentTime);
    osc.stop(commAudioCtx.currentTime + 0.1);
  } catch(e) {}
}

function commPlayTypeBlip() {
  if (!commAudioCtx) return;
  try {
    const osc = commAudioCtx.createOscillator();
    const gain = commAudioCtx.createGain();
    osc.connect(gain);
    gain.connect(commAudioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(200 + Math.random() * 80, commAudioCtx.currentTime);
    gain.gain.setValueAtTime(0.025, commAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, commAudioCtx.currentTime + 0.04);
    osc.start(commAudioCtx.currentTime);
    osc.stop(commAudioCtx.currentTime + 0.04);
  } catch(e) {}
}

// ═══════ DOM SETUP ═══════
// Creates the comm overlay once on first use
let commOverlayReady = false;

function ensureCommOverlay() {
  if (commOverlayReady) return;
  commOverlayReady = true;

  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

    #spiritCommOverlay {
      position: fixed;
      bottom: 20px; left: 50%; transform: translateX(-50%);
      z-index: 1200;
      pointer-events: none;
      width: 90%; max-width: 560px;
    }

    .spirit-comm-box {
      display: flex;
      align-items: flex-start;
      gap: 0;
      pointer-events: auto;
      cursor: pointer;
      animation: commSlideIn .25s ease-out;
      opacity: 0;
      animation-fill-mode: forwards;
    }
    @keyframes commSlideIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes commFadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-8px); }
    }

    .spirit-comm-portrait {
      width: 72px; height: 72px;
      min-width: 72px;
      border: 3px solid #888;
      background: #111;
      position: relative;
      overflow: hidden;
    }
    .spirit-comm-portrait img {
      width: 100%; height: 100%;
      object-fit: cover;
      filter: brightness(0.85) contrast(1.1);
    }
    /* Scanline on portrait */
    .spirit-comm-portrait::after {
      content: '';
      position: absolute; inset: 0;
      background: repeating-linear-gradient(
        0deg, transparent 0px, transparent 2px,
        rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px
      );
      pointer-events: none;
    }

    /* Health bar */
    .spirit-comm-hbar {
      position: absolute;
      top: 2px; left: 2px;
      width: calc(100% - 4px);
      height: 6px;
      display: flex; gap: 1px;
      z-index: 2;
    }
    .spirit-comm-hbar span {
      flex: 1; height: 100%;
      border: 1px solid rgba(0,0,0,.5);
    }
    .hb-g { background: #3f3; }
    .hb-y { background: #ff3; }
    .hb-r { background: #f33; }
    .hb-e { background: #222; }

    .spirit-comm-body {
      background: rgba(8, 12, 32, 0.94);
      border: 3px solid #888;
      border-left: none;
      padding: 8px 12px 10px 12px;
      min-height: 72px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      position: relative;
      flex: 1;
    }
    /* Scanline on body */
    .spirit-comm-body::after {
      content: '';
      position: absolute; inset: 0;
      background: repeating-linear-gradient(
        0deg, transparent 0px, transparent 2px,
        rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px
      );
      pointer-events: none;
    }

    .spirit-comm-name {
      font-family: 'Press Start 2P', monospace;
      font-size: 9px;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .spirit-comm-text {
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      color: #e8e8e8;
      line-height: 1.6;
      text-shadow: 1px 1px 0 #000;
      min-height: 28px;
    }
    .spirit-comm-cursor {
      display: inline-block;
      width: 7px; height: 11px;
      background: #e8e8e8;
      animation: commBlink .5s step-end infinite;
      vertical-align: middle;
      margin-left: 2px;
    }
    @keyframes commBlink { 50% { opacity: 0; } }

    .spirit-comm-dismiss {
      font-family: 'Press Start 2P', monospace;
      font-size: 7px;
      color: #555;
      margin-top: 4px;
    }

    /* Quest area inside comm */
    .spirit-comm-quest-area {
      margin-top: 8px;
      position: relative;
      z-index: 2;
      pointer-events: auto;
    }

    /* CRT vignette just on the comm box */
    .spirit-comm-box::before {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.3) 100%);
      pointer-events: none;
      z-index: 3;
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'spiritCommOverlay';
  document.body.appendChild(overlay);
}

// ═══════ BUILD HEALTH BAR ═══════
function commBuildHealthBar(hp, maxHp) {
  const segments = 8;
  const ratio = hp / maxHp;
  const filled = Math.round(ratio * segments);
  let html = '<div class="spirit-comm-hbar">';
  for (let i = 0; i < segments; i++) {
    if (i < filled) {
      html += `<span class="${ratio > 0.5 ? 'hb-g' : ratio > 0.25 ? 'hb-y' : 'hb-r'}"></span>`;
    } else {
      html += '<span class="hb-e"></span>';
    }
  }
  return html + '</div>';
}

// ═══════ MAIN API ═══════

/**
 * showComm — Show a Star Fox-style comm box
 * @param {string} name       — Speaker name (NPC name or custom)
 * @param {string} text       — Dialogue text
 * @param {object} opts       — Options:
 *   art:      string  — custom art path (auto-resolved from NPC_COMM_PORTRAITS if omitted)
 *   color:    string  — name color (auto-resolved if omitted)
 *   hp:       number  — current HP for health bar (default: maxHp)
 *   maxHp:    number  — max HP (default: 6)
 *   side:     string  — 'left' or 'right' (default: 'left')
 *   speed:    number  — ms per character (default: 30)
 *   duration: number  — ms to stay after typing finishes (default: auto based on text length)
 *   persist:  boolean — if true, stays until clicked (default: false)
 *   questArea: boolean — if true, renders quest area inside (default: false)
 *   npcName:  string  — the NPC name for quest rendering (defaults to name)
 *   onDismiss: function — callback when dismissed
 */
function showComm(name, text, opts = {}) {
  ensureCommOverlay();
  commInitAudio();

  // Resolve portrait data
  const portraitData = NPC_COMM_PORTRAITS[name] || NPC_COMM_PORTRAITS['System'];
  const art = opts.art || portraitData.art;
  const color = opts.color || portraitData.color;
  const maxHp = opts.maxHp || 6;
  const hp = opts.hp !== undefined ? opts.hp : maxHp;
  const speed = opts.speed || 30;
  const persist = opts.persist || false;
  const questArea = opts.questArea || false;
  const npcName = opts.npcName || name;

  commQueue.push({ name, text, art, color, hp, maxHp, speed, persist, questArea, npcName, onDismiss: opts.onDismiss });
  if (!commTyping) processCommQueue();
}

/**
 * showCommSequence — Show multiple comm boxes in sequence (for cutscenes)
 * @param {Array} lines — Array of { name, text, ...opts }
 * @param {function} onComplete — callback when all done
 */
function showCommSequence(lines, onComplete) {
  if (!lines || lines.length === 0) { if (onComplete) onComplete(); return; }

  let idx = 0;
  function showNext() {
    if (idx >= lines.length) {
      if (onComplete) onComplete();
      return;
    }
    const line = lines[idx++];
    showComm(line.name, line.text, {
      ...line,
      persist: true,
      onDismiss: showNext,
    });
  }
  showNext();
}

function processCommQueue() {
  if (commQueue.length === 0) { commTyping = false; return; }
  commTyping = true;

  const msg = commQueue.shift();
  const overlay = document.getElementById('spiritCommOverlay');

  // Clear previous
  overlay.innerHTML = '';

  commPlayBlip();

  // Build comm box
  const box = document.createElement('div');
  box.className = 'spirit-comm-box';
  box.style.position = 'relative';

  // Portrait
  const portrait = document.createElement('div');
  portrait.className = 'spirit-comm-portrait';
  portrait.innerHTML = `<img src="${msg.art}" alt="${msg.name}">${commBuildHealthBar(msg.hp, msg.maxHp)}`;

  // Body
  const body = document.createElement('div');
  body.className = 'spirit-comm-body';

  const nameEl = document.createElement('div');
  nameEl.className = 'spirit-comm-name';
  nameEl.style.color = msg.color;
  nameEl.style.textShadow = `1px 1px 0 #000, 0 0 8px ${msg.color}`;
  nameEl.textContent = msg.name;

  const textEl = document.createElement('div');
  textEl.className = 'spirit-comm-text';

  const dismissEl = document.createElement('div');
  dismissEl.className = 'spirit-comm-dismiss';
  dismissEl.textContent = msg.questArea ? '' : 'click to dismiss';

  body.appendChild(nameEl);
  body.appendChild(textEl);

  // Quest area container
  let questContainer = null;
  if (msg.questArea) {
    questContainer = document.createElement('div');
    questContainer.className = 'spirit-comm-quest-area';
    questContainer.id = 'dialogueQuestArea';
    body.appendChild(questContainer);
  }

  body.appendChild(dismissEl);

  box.appendChild(portrait);
  box.appendChild(body);
  overlay.appendChild(box);

  // Click to dismiss
  function dismiss(e) {
    // Don't dismiss if clicking quest area buttons
    if (e && e.target.closest && e.target.closest('.spirit-comm-quest-area')) return;
    if (commTypeTimer) { clearTimeout(commTypeTimer); commTypeTimer = null; }
    box.style.animation = 'commFadeOut .2s ease forwards';
    setTimeout(() => {
      overlay.innerHTML = '';
      if (msg.onDismiss) msg.onDismiss();
      else processCommQueue();
    }, 200);
  }
  box.addEventListener('click', dismiss);

  // Typewriter effect
  const cursor = document.createElement('span');
  cursor.className = 'spirit-comm-cursor';
  textEl.appendChild(cursor);

  let charIdx = 0;
  function typeNext() {
    if (charIdx >= msg.text.length) {
      // Done typing
      cursor.remove();

      // Render quest area if needed
      if (msg.questArea && typeof renderQuestAreaInDialogue === 'function') {
        renderQuestAreaInDialogue(msg.npcName);
      }

      if (!msg.persist) {
        const dur = msg.duration || Math.max(2000, msg.text.length * 50);
        commTypeTimer = setTimeout(() => dismiss(null), dur);
      }
      return;
    }

    const span = document.createElement('span');
    span.textContent = msg.text[charIdx];
    textEl.insertBefore(span, cursor);
    if (charIdx % 2 === 0) commPlayTypeBlip();
    charIdx++;
    commTypeTimer = setTimeout(typeNext, msg.speed);
  }
  typeNext();
}

/**
 * closeComm — Force close any open comm box
 */
function closeComm() {
  if (commTypeTimer) { clearTimeout(commTypeTimer); commTypeTimer = null; }
  commQueue = [];
  commTyping = false;
  const overlay = document.getElementById('spiritCommOverlay');
  if (overlay) overlay.innerHTML = '';
}

// ═══════ OVERRIDE OLD DIALOGUE SYSTEM ═══════

// Replace showDialogue to use comms
const _originalShowDialogue = typeof showDialogue === 'function' ? showDialogue : null;

function showDialogue(npcName) {
  const data = NPC_DIALOGUE_MAP[npcName];
  if (!data) return;

  const line = data.getLine();

  // Show comm box with quest area
  showComm(npcName, line, {
    persist: true,
    questArea: true,
    npcName: npcName,
  });

  // Still show speech bubble on overworld
  const npc = NPCS.find(n => n.name === npcName);
  if (npc) showNPCSpeechBubble(npc, line);
}

// Replace closeDialogue
function closeDialogue() {
  closeComm();
  // Also hide old overlay in case anything still triggers it
  const old = document.getElementById('dialogueOverlay');
  if (old) old.classList.remove('active');
}

// Replace showMaskQuestDialogue with comm sequence
const _originalShowMaskQuestDialogue = typeof showMaskQuestDialogue === 'function' ? showMaskQuestDialogue : null;

function showMaskQuestDialogue(lines, onComplete) {
  // Convert plain text lines into comm sequence with Maren as speaker
  const commLines = lines.map((text, i) => ({
    name: i === 0 ? 'Maren' : (text.includes('Leon') || text.includes('camp') ? 'Leon' : 'Maren'),
    text: text,
    persist: true,
  }));
  showCommSequence(commLines, onComplete);
}

// ═══════ HOOK INTO HOSTILE NPC DIALOGUE ═══════
// Override the defeated-hostile-NPC dialogue in tryInteract
// This is done by patching after load — the hostile NPC friendly dialogue
// uses the old overlay directly in index.html tryInteract()
// We patch it via a global flag that tryInteract can check

function showHostileNPCComm(hnpc) {
  const line = hnpc.dialogue[Math.floor(Math.random() * hnpc.dialogue.length)];
  showComm(hnpc.name, line, { persist: true });
  showNPCSpeechBubble(hnpc, line);
}
