// dice.js — Layer 1: Dice generation, classification display, 3D animation.
// Depends on: battle-core.js (spd, active, classify, B)

// ── Constants ─────────────────────────────────────────────────────
const PIP_LAYOUTS = {
  1: ['c'],
  2: ['tr','bl'],
  3: ['tr','c','bl'],
  4: ['tl','tr','bl','br'],
  5: ['tl','tr','c','bl','br'],
  6: ['tl','ml','bl','tr','mr','br']
};
const PIP_STYLES = {
  tl:'top:18%;left:18%', tr:'top:18%;right:18%',
  ml:'top:50%;left:18%;transform:translateY(-50%)',
  c:'top:50%;left:50%;transform:translate(-50%,-50%)',
  mr:'top:50%;right:18%;transform:translateY(-50%)',
  bl:'bottom:18%;left:18%', br:'bottom:18%;right:18%'
};

const FACE_TARGET = {
  1:{rx:0,ry:0}, 2:{rx:0,ry:-90}, 3:{rx:90,ry:0},
  4:{rx:-90,ry:0}, 5:{rx:0,ry:90}, 6:{rx:0,ry:180}
};

/* ═══════ Throw Profiles — choreographed dice paths ═══════ */
// Each profile generates per-die {vx, vy} based on die index and count.
// Red throws right+up from bottom-left; Blue throws left+up from bottom-right.
const THROW_PROFILES = [
  // THE BLOOM — dice unfurl like petals: steep arc, wide sweep, low curl
  (i, n) => {
    const t = n > 1 ? i / (n - 1) : 0.5;
    return { vx: 13 + t * 15, vy: -(25 - t * 20) };
  },
  // THE BANK SHOT — all hit the top wall, spread horizontally
  (i, n) => {
    const t = n > 1 ? i / (n - 1) : 0.5;
    return { vx: 10 + t * 14, vy: -(20 + t * 4) };
  },
  // THE CROSS-TABLE — full send to the far wall
  (i, n) => {
    const t = n > 1 ? i / (n - 1) : 0.5;
    return { vx: 24 + t * 6, vy: -(8 + t * 10) };
  },
  // THE SPIRAL — widest orbit to tightest drop
  (i, n) => {
    const t = n > 1 ? i / (n - 1) : 0.5;
    return { vx: 28 - t * 18, vy: -(10 + t * 12) };
  },
  // THE SCATTER — each die at a very different angle
  (i, n) => {
    const angles = [0.15, 0.55, 0.85, 0.35, 0.7]; // spread across quadrants
    const a = angles[i % angles.length];
    return { vx: 14 + a * 14, vy: -(6 + (1 - a) * 20) };
  },
  // THE GENTLE TOSS — short lob, barely leaves the hand
  (i, n) => {
    const t = n > 1 ? i / (n - 1) : 0.5;
    return { vx: 7 + t * 5, vy: -(9 + t * 3) };
  },
];

// ── State ─────────────────────────────────────────────────────────
let _dicePhysics = {};

// ── Generation ────────────────────────────────────────────────────
function rollDice(n) {
  const d = [];
  for (let i=0;i<n;i++) d.push(Math.floor(Math.random()*6)+1);
  return d.sort((a,b)=>a-b);
}

// Weighted roll — cinematic luck system
// Subtle nudges that make tight moments more exciting:
// - 1 HP: 25% chance of forced doubles (3-6 value) — clutch comeback energy
// - 2 HP: 15% chance of forced doubles — still dangerous but not as desperate
// - 5+ dice: 10% penta nudge — reward the player for earning extra dice
// - General: low HP rolls get a slight quality boost (reroll lowest die if below average)
function weightedRoll(team, count) {
  const dice = [];
  for (let i = 0; i < count; i++) dice.push(Math.floor(Math.random()*6)+1);
  if (!B || !B[team]) return dice.sort((a,b)=>a-b);
  const f = active(B[team]);

  // Penta nudge: 5+ dice → 10% chance all dice match (huge cinematic moment)
  if (count >= 5 && Math.random() < 0.10) {
    const v = Math.ceil(Math.random()*4)+2; // 3–6 for exciting penta
    for (let i = 0; i < dice.length; i++) dice[i] = v;
    return dice.sort((a,b)=>a-b);
  }

  // Clutch doubles: low HP → chance of forced doubles
  if (f && f.hp === 1 && Math.random() < 0.25) {
    const v = Math.ceil(Math.random()*4)+2; // 3–6
    dice[0] = v;
    if (dice.length >= 2) dice[1] = v;
  } else if (f && f.hp === 2 && Math.random() < 0.15) {
    const v = Math.ceil(Math.random()*4)+2;
    dice[0] = v;
    if (dice.length >= 2) dice[1] = v;
  }

  // Low HP quality boost: if at 1-2 HP, reroll the lowest die if it's below 3
  // Subtle — just nudges the floor up slightly so you're less likely to get crushed
  if (f && f.hp <= 2 && f.hp > 0 && dice.length >= 2) {
    const minIdx = dice.indexOf(Math.min(...dice));
    if (dice[minIdx] <= 2 && Math.random() < 0.30) {
      dice[minIdx] = Math.ceil(Math.random()*3)+3; // reroll to 4-6
    }
  }

  return dice.sort((a,b)=>a-b);
}

// ── Rendering ─────────────────────────────────────────────────────
function pip3dHTML(val) {
  return (PIP_LAYOUTS[val]||PIP_LAYOUTS[1]).map(p=>`<span class="pip3d" style="${PIP_STYLES[p]}"></span>`).join('');
}
function cube3dHTML(team) {
  const c='face-'+team;
  // front=1, right=2, top=3, bottom=4, left=5, back=6
  return [
    ['front',1],['back',6],['right',2],['left',5],['top',3],['bottom',4]
  ].map(([f,v])=>`<div class="die-face ${c} face-${f}">${pip3dHTML(v)}</div>`).join('');
}

// Flat die HTML with pip dots (used when no 3D dice exist)
function flatDieHTML(val, team) {
  const face = team === 'red' ? 'face-red' : 'face-blue';
  if (val === '?' || val === 0 || !val) return `<div class="die die-${team}">?</div>`;
  return `<div class="die die-${team}"><div style="position:relative;width:100%;height:100%;" class="${face}">${pip3dHTML(val)}</div></div>`;
}

function renderDice(rd, bd) {
  const redEl = document.getElementById('red-dice');
  const blueEl = document.getElementById('blue-dice');
  if (!rd && !bd) {
    // Reset — also clean up any lingering 3D dice
    ['red', 'blue'].forEach(t => {
      if (_dicePhysics[t]) {
        cancelAnimationFrame(_dicePhysics[t].raf);
        _dicePhysics[t].els.forEach(e => e.remove());
        delete _dicePhysics[t];
      }
    });
    redEl.innerHTML = [0,0,0].map(()=>`<div class="die die-red">?</div>`).join('');
    blueEl.innerHTML = [0,0,0].map(()=>`<div class="die die-blue">?</div>`).join('');
  } else {
    if (rd) {
      const rdPh = _dicePhysics['red'];
      if (rdPh && rd.length === rdPh.dice.length) {
        // 3D dice exist with matching count — update them (works during settling too)
        if (rdPh.settled) update3dDice('red', rd);
        const flatRed = redEl.querySelectorAll('.die');
        rd.forEach((v, i) => { if (flatRed[i]) flatRed[i].innerHTML = `<div style="position:relative;width:100%;height:100%;" class="face-red">${pip3dHTML(v)}</div>`; });
      } else if (rdPh && rd.length !== rdPh.dice.length) {
        cancelAnimationFrame(rdPh.raf); rdPh.els.forEach(e => e.remove()); delete _dicePhysics['red'];
        redEl.innerHTML = rd.map(d => flatDieHTML(d, 'red')).join('');
      } else {
        redEl.innerHTML = rd.map(d => flatDieHTML(d, 'red')).join('');
      }
    }
    if (bd) {
      const bdPh = _dicePhysics['blue'];
      if (bdPh && bd.length === bdPh.dice.length) {
        if (bdPh.settled) update3dDice('blue', bd);
        const flatBlue = blueEl.querySelectorAll('.die');
        bd.forEach((v, i) => { if (flatBlue[i]) flatBlue[i].innerHTML = `<div style="position:relative;width:100%;height:100%;" class="face-blue">${pip3dHTML(v)}</div>`; });
      } else if (bdPh && bd.length !== bdPh.dice.length) {
        cancelAnimationFrame(bdPh.raf); bdPh.els.forEach(e => e.remove()); delete _dicePhysics['blue'];
        blueEl.innerHTML = bd.map(d => flatDieHTML(d, 'blue')).join('');
      } else {
        blueEl.innerHTML = bd.map(d => flatDieHTML(d, 'blue')).join('');
      }
    }
  }
}

// ── Animation ─────────────────────────────────────────────────────
function nearestSnap(cur,tgt){const n=Math.round((cur-tgt)/360);return tgt+n*360;}

function pickThrowProfile(count) {
  const profile = THROW_PROFILES[Math.floor(Math.random() * THROW_PROFILES.length)];
  const noise = () => 1 + (Math.random() - 0.5) * 0.25; // ±12.5% variation
  return Array.from({ length: count }, (_, i) => {
    const v = profile(i, count);
    // 15% velocity boost for more energetic throws
    return { vx: v.vx * noise() * 1.15, vy: v.vy * noise() * 1.15 };
  });
}

function update3dDice(team, values) {
  const physics = _dicePhysics[team];
  if (!physics || !physics.dice) return;
  physics.values = values;
  values.forEach((v, i) => {
    const d = physics.dice[i];
    if (!d || d.value === v) return; // no change
    d.value = v;
    // Clear any highlight classes
    d.el.classList.remove('highlight-single', 'highlight-double', 'highlight-triple',
      'die-win-singles-3d', 'die-win-doubles-3d', 'die-win-triples-3d', 'die-win-mega-3d',
      'die-win-secondary-3d', 'die-loser-3d', 'triples-glow-3d');
    // Smoothly rotate to new face
    const tgt = FACE_TARGET[v];
    d.rx = nearestSnap(d.rx, tgt.rx);
    d.ry = nearestSnap(d.ry, tgt.ry);
    d.el.classList.add('value-update');
    d.cube.style.transform = `rotateX(${d.rx}deg) rotateY(${d.ry}deg) rotateZ(${d.rz}deg)`;
    setTimeout(() => d.el.classList.remove('value-update'), 450);
  });
}

// Show rolling animation — 3D physics dice bouncing across the arena
function showRolling(team, count) {
  const el = document.getElementById(team + '-dice');
  const cls = 'die-' + team;
  // Hidden placeholder dice for layout (keeps tray height stable)
  el.innerHTML = Array(count).fill(0).map((_, i) =>
    `<div class="die ${cls}" id="${team}-die-${i}" style="visibility:hidden">?</div>`
  ).join('');
  if (count === 0) return;

  // Roll dice across the full arena board
  const board = document.querySelector('.arena-board');
  const boardRect = board.getBoundingClientRect();
  const W = boardRect.width;
  const H = boardRect.height;
  const dieSize = window.innerWidth <= 600 ? 42 : 56;
  const half = dieSize / 2;
  const pad = 16; // board padding
  const minX = pad, maxX = W - pad - dieSize;
  const minY = pad, maxY = H - pad - dieSize;

  // Clean up previous physics for this team
  if (_dicePhysics[team]) {
    cancelAnimationFrame(_dicePhysics[team].raf);
    _dicePhysics[team].els.forEach(e => e.remove());
  }

  const dice = [];
  const els = [];
  const isRed = team === 'red';
  const handX = isRed ? minX + 10 : maxX - 10;
  const handY = maxY - 5;
  const throwVecs = pickThrowProfile(count);

  for (let i = 0; i < count; i++) {
    const die = document.createElement('div');
    die.className = 'die-physics';
    die.style.width = dieSize + 'px';
    die.style.height = dieSize + 'px';
    die.style.zIndex = '100'; // above cards during rolling
    die.style.setProperty('--dh', half + 'px');
    die.innerHTML = `<div class="die-cube">${cube3dHTML(team)}</div>`;
    board.appendChild(die);
    els.push(die);

    // Beautiful choreographed throw from team's corner
    const tv = throwVecs[i];
    dice.push({
      el: die, cube: die.querySelector('.die-cube'),
      x: handX + (Math.random() - 0.5) * 6, y: handY + (Math.random() - 0.5) * 6,
      vx: (isRed ? 1 : -1) * tv.vx,
      vy: tv.vy,
      rx: Math.random() * 720, ry: Math.random() * 720, rz: Math.random() * 360,
      vrx: (Math.random() - 0.5) * 55,   // cranked tumble
      vry: (Math.random() - 0.5) * 55,
      vrz: (Math.random() - 0.5) * 40,
      bounceCount: 0  // tracks wall hits for decaying bounce coefficient
    });
  }

  // Per-die decaying bounce: starts at 0.65, each hit multiplies by 0.8, floor at 0.3
  function getBounceCoeff(d) {
    return Math.max(0.3, 0.65 * Math.pow(0.8, d.bounceCount));
  }
  // Speed-dependent surface friction — fast dice slide, slow dice stick
  function getSurfaceFriction(speed) {
    if (speed > 8) return 0.982;   // fast: ice-smooth
    if (speed > 3) return 0.965;   // medium: felt drag
    return 0.935;                   // slow: table grip, dice stop decisively
  }
  // Speed-dependent rotation friction
  function getRotFriction(speed) {
    if (speed > 8) return 0.972;
    if (speed > 3) return 0.950;
    return 0.920;                   // slow: rotation dies fast
  }

  function step() {
    // Dice-to-dice repulsion (prevents stacking)
    for (let a = 0; a < dice.length; a++) {
      for (let b = a + 1; b < dice.length; b++) {
        const da = dice[a], db = dice[b];
        const dx = da.x - db.x, dy = da.y - db.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < dieSize && dist > 0.1) {
          const push = (dieSize - dist) * 0.15;
          const nx = dx / dist, ny = dy / dist;
          da.vx += nx * push; da.vy += ny * push;
          db.vx -= nx * push; db.vy -= ny * push;
        }
      }
    }
    dice.forEach(d => {
      d.x += d.vx; d.y += d.vy;
      d.rx += d.vrx; d.ry += d.vry; d.rz += d.vrz;
      const speed = Math.abs(d.vx) + Math.abs(d.vy);

      // Wall bounces — decaying coefficient + rotation spike on impact
      const bc = getBounceCoeff(d);
      if (d.x < minX) {
        d.x = minX; d.vx = Math.abs(d.vx) * bc;
        d.vry *= 1.4; d.vrz *= 1.3; // wall clatter — spin spikes on impact
        d.bounceCount++;
      }
      if (d.x > maxX) {
        d.x = maxX; d.vx = -Math.abs(d.vx) * bc;
        d.vry *= 1.4; d.vrz *= 1.3;
        d.bounceCount++;
      }
      if (d.y < minY) {
        d.y = minY; d.vy = Math.abs(d.vy) * bc;
        d.vrx *= 1.4; d.vrz *= 1.3;
        d.bounceCount++;
      }
      if (d.y > maxY) {
        d.y = maxY; d.vy = -Math.abs(d.vy) * bc;
        d.vrx *= 1.4; d.vrz *= 1.3;
        d.bounceCount++;
      }

      // Speed-dependent surface friction
      const fric = getSurfaceFriction(speed);
      const rFric = getRotFriction(speed);
      d.vx *= fric; d.vy *= fric;
      d.vrx *= rFric; d.vry *= rFric; d.vrz *= rFric;

      // Rotation homing — as dice slow down, settle onto nearest face (like gravity)
      if (speed < 6) {
        const strength = 0.08 * (1 - speed / 6);
        d.rx += (Math.round(d.rx / 90) * 90 - d.rx) * strength;
        d.ry += (Math.round(d.ry / 90) * 90 - d.ry) * strength;
        d.rz += (Math.round(d.rz / 90) * 90 - d.rz) * strength;
      }
      // Render
      d.el.style.left = d.x + 'px';
      d.el.style.top = d.y + 'px';
      d.cube.style.transform = `rotateX(${d.rx}deg) rotateY(${d.ry}deg) rotateZ(${d.rz}deg)`;
    });
    _dicePhysics[team].raf = requestAnimationFrame(step);
  }

  _dicePhysics[team] = { raf: requestAnimationFrame(step), dice, els };
}

// Reveal dice values — settle 3D dice to final positions, then swap to flat dice
function revealDice(team, values) {
  const physics = _dicePhysics[team];

  if (!physics || !physics.dice.length) {
    // Fallback for 0 dice or missing physics
    const cls = 'die-' + team;
    values.forEach((v, i) => {
      setTimeout(() => {
        const d = document.getElementById(team + '-die-' + i);
        if (d) { d.classList.remove('rolling'); d.textContent = v; d.style.visibility = 'visible'; }
      }, i * spd(300));
    });
    setTimeout(() => highlightRollPreview(team, values), values.length * spd(300) + 50);
    return;
  }

  // Stop physics loop
  cancelAnimationFrame(physics.raf);

  // Calculate tray position within the arena board
  const board = document.querySelector('.arena-board');
  const boardRect = board.getBoundingClientRect();
  const stack = document.querySelector('.dice-stack');
  const stackRect = stack.getBoundingClientRect();
  const offsetX = stackRect.left - boardRect.left;
  const offsetY = stackRect.top - boardRect.top;
  const stackW = stackRect.width;
  const dieSize = window.innerWidth <= 600 ? 42 : 56;
  const gap = window.innerWidth <= 600 ? 10 : 20;
  const rowGap = window.innerWidth <= 600 ? 8 : 18;

  // Center dice in the tray with proper spacing
  const totalDiceW = values.length * dieSize + (values.length - 1) * gap;
  const trayStartX = offsetX + (stackW - totalDiceW) / 2;
  const trayMidY = offsetY + stackRect.height / 2;

  // Settle: rotation snaps to correct face (0.35s) while position flies to tray (0.7s).
  values.forEach((v, i) => {
    const d = physics.dice[i];
    if (!d) return;

    // Target position — centered in tray, red on top row, blue on bottom
    const tx = trayStartX + i * (dieSize + gap);
    const ty = team === 'red'
      ? trayMidY - dieSize - rowGap / 2
      : trayMidY + rowGap / 2;

    // Target rotation for the correct face value
    const tgt = FACE_TARGET[v];
    const frx = nearestSnap(d.rx, tgt.rx);
    const fry = nearestSnap(d.ry, tgt.ry);
    const frz = nearestSnap(d.rz, 0);
    d.rx = frx; d.ry = fry; d.rz = frz;
    d.value = v;

    // Stagger each die slightly for a natural feel
    setTimeout(() => {
      d.el.classList.add('settling');
      d.el.style.left = tx + 'px';
      d.el.style.top = ty + 'px';
      d.cube.style.transform = `rotateX(${frx}deg) rotateY(${fry}deg) rotateZ(${frz}deg)`;
    }, i * spd(80));
  });

  // After all dice reach the tray
  const settleDelay = values.length * spd(80) + spd(750);
  setTimeout(() => {
    physics.settled = true;
    physics.values = values;
    physics.els.forEach(e => e.style.zIndex = '10');
    values.forEach((v, i) => {
      const d = document.getElementById(team + '-die-' + i);
      if (d) d.textContent = v;
    });
    highlightRollPreview(team, values);
  }, settleDelay);
}

// ── Highlight ─────────────────────────────────────────────────────
function highlightRollPreview(team, dice) {
  const roll = classify(dice);
  if (roll.type === 'none') return;

  const physics = _dicePhysics[team];
  if (physics && physics.settled) {
    // Highlight 3D dice
    const diceObjs = physics.dice;
    if (roll.type === 'singles') {
      let done = false;
      [...diceObjs].reverse().forEach(d => {
        if (!done && d.value === roll.value) {
          d.el.classList.add('highlight-single');
          done = true;
        }
      });
    } else if (roll.type === 'doubles') {
      let count = 0;
      diceObjs.forEach(d => {
        if (count < 2 && d.value === roll.value) {
          d.el.classList.add('highlight-double');
          count++;
        }
      });
    } else {
      diceObjs.forEach(d => {
        if (d.value === roll.value) {
          d.el.classList.add('highlight-triple');
        }
      });
    }
  } else {
    // Fallback: highlight flat dice
    const diceEl = document.getElementById(team + '-dice');
    if (!diceEl) return;
    const dieDivs = [...diceEl.querySelectorAll('.die')];
    if (roll.type === 'singles') {
      let done = false;
      [...dieDivs].reverse().forEach(d => {
        if (!done && parseInt(d.textContent) === roll.value) {
          d.style.transform = 'scale(1.12)';
          d.style.transition = 'transform 0.3s';
          done = true;
        }
      });
    } else if (roll.type === 'doubles') {
      let count = 0;
      dieDivs.forEach(d => {
        if (count < 2 && parseInt(d.textContent) === roll.value) {
          d.style.transform = 'scale(1.15)';
          d.style.boxShadow = '0 0 14px rgba(251,191,36,0.5)';
          d.style.borderColor = '#fbbf24';
          d.style.transition = 'all 0.3s';
          count++;
        }
      });
    } else {
      dieDivs.forEach(d => {
        if (parseInt(d.textContent) === roll.value) {
          d.style.transform = 'scale(1.2)';
          d.style.boxShadow = '0 0 20px rgba(251,191,36,0.7)';
          d.style.borderColor = '#fbbf24';
          d.style.transition = 'all 0.3s';
        }
      });
    }
  }
}

// ============================================================
// DICE HIGHLIGHTING — visually tell the story of why someone won
// ============================================================
function highlightWinnerDice(winTeam, winRoll, loseTeam, tiebreaker) {
  const winEl  = document.getElementById(winTeam  + '-dice');
  const loseEl = document.getElementById(loseTeam + '-dice');
  if (!winEl || !loseEl) return;

  // Clear ALL stale highlight classes from both rows before applying fresh state
  const ALL_HL = ['die-win','die-win-doubles','die-win-triples','die-win-mega','die-win-secondary','die-loser'];
  [winEl, loseEl].forEach(el =>
    el.querySelectorAll('.die').forEach(d => d.classList.remove(...ALL_HL))
  );

  const winDivs  = [...winEl.querySelectorAll('.die')];
  const loseDivs = [...loseEl.querySelectorAll('.die')];

  // Dim every losing die
  loseDivs.forEach(d => d.classList.add('die-loser'));

  // Tiebreaker — same hand type & value, remaining die decided it
  if (tiebreaker) {
    // Secondary glow on the matched (tied) dice so players can see what hand tied
    // Skip for singles — there's only one matched die and it's just a number, not a "hand"
    if (winRoll.type !== 'singles') {
      const matchCount = { doubles:2, triples:3, quads:4, penta:5 }[winRoll.type] || 0;
      let winCount = 0, loseCount = 0;
      winDivs.forEach(d => {
        if (winCount < matchCount && parseInt(d.textContent) === winRoll.value) {
          d.classList.add('die-win-secondary');
          winCount++;
        }
      });
      // Symmetric: loser's matched group also gets dim-gold so both rows tell the story
      loseDivs.forEach(d => {
        if (loseCount < matchCount && parseInt(d.textContent) === winRoll.value) {
          d.classList.add('die-win-secondary'); // overrides die-loser grey via CSS specificity
          loseCount++;
        }
      });
    }
    // Primary gold glow on the decisive tiebreaker die (overrides secondary if same die)
    let done = false;
    [...winDivs].reverse().forEach(d => {
      if (!done && parseInt(d.textContent) === tiebreaker.value) {
        d.classList.remove('die-win-secondary'); // ensure gold fully overrides
        d.classList.add('die-win');
        done = true;
      }
    });
    // Fallback: if Blackout removed the tiebreaker die, highlight the highest remaining
    if (!done && winDivs.length > 0) {
      winDivs[winDivs.length - 1].classList.add('die-win');
    }
    return;
  }

  // Pick the CSS class based on hand tier
  let hlClass = 'die-win'; // singles default
  if (winRoll.type === 'doubles') hlClass = 'die-win-doubles';
  else if (winRoll.type === 'triples') hlClass = 'die-win-triples';
  else if (winRoll.type === 'quads' || winRoll.type === 'penta') hlClass = 'die-win-mega';

  if (winRoll.type === 'singles') {
    // Highlight just the highest die (the decision-maker)
    let done = false;
    [...winDivs].reverse().forEach(d => {
      if (!done && parseInt(d.textContent) === winRoll.value) {
        d.classList.add(hlClass);
        done = true;
      }
    });
  } else if (winRoll.type === 'doubles') {
    // Highlight the matching pair
    let count = 0;
    winDivs.forEach(d => {
      if (count < 2 && parseInt(d.textContent) === winRoll.value) {
        d.classList.add(hlClass);
        count++;
      }
    });
  } else {
    // triples / quads / penta — all matching dice light up
    winDivs.forEach(d => {
      if (parseInt(d.textContent) === winRoll.value) d.classList.add(hlClass);
    });
  }
  // Sync highlights to 3D dice
  sync3dDiceHighlights(winTeam);
  sync3dDiceHighlights(loseTeam);
}

// Sync visual highlights from flat dice to 3D dice (tiered mapping)
function sync3dDiceHighlights(team) {
  const physics = _dicePhysics[team];
  if (!physics || !physics.settled) return;
  const flatDice = [...document.getElementById(team + '-dice').querySelectorAll('.die')];
  const HL_3D = [
    'die-win-singles-3d', 'die-win-doubles-3d', 'die-win-triples-3d', 'die-win-mega-3d',
    'die-win-secondary-3d', 'die-loser-3d', 'triples-glow-3d',
    'highlight-single', 'highlight-double', 'highlight-triple'
  ];
  physics.dice.forEach((d, i) => {
    d.el.classList.remove(...HL_3D);
    const flat = flatDice[i];
    if (!flat) return;
    // Map each flat highlight tier to its 3D equivalent
    if (flat.classList.contains('die-win-mega')) {
      d.el.classList.add('die-win-mega-3d');
    } else if (flat.classList.contains('die-win-triples')) {
      d.el.classList.add('die-win-triples-3d');
    } else if (flat.classList.contains('die-win-doubles')) {
      d.el.classList.add('die-win-doubles-3d');
    } else if (flat.classList.contains('die-win')) {
      d.el.classList.add('die-win-singles-3d');
    } else if (flat.classList.contains('die-win-secondary')) {
      d.el.classList.add('die-win-secondary-3d');
    } else if (flat.classList.contains('die-loser')) {
      d.el.classList.add('die-loser-3d');
    }
    if (flat.classList.contains('triples-glow')) {
      d.el.classList.add('triples-glow-3d');
    }
  });
}

// Proxy click events from 3D dice to flat dice so existing handlers work unchanged
function sync3dDiceClickable(team) {
  const physics = _dicePhysics[team];
  if (!physics || !physics.settled) return;
  const flatDice = [...document.getElementById(team + '-dice').querySelectorAll('.die')];
  physics.dice.forEach((d, i) => {
    d.el.classList.add('rerollable-3d');
    d.el.onclick = () => { if (flatDice[i] && flatDice[i].onclick) flatDice[i].onclick(); };
  });
}

// ── Reroll ─────────────────────────────────────────────────────────
function doLuckyReroll(team, dieIndex, dice, callback) {
  clearLsCountdown();
  clearDiceClickable(team);
  playSfx('sfxSpecial', 0.4);

  const t = B[team];
  const oldVal = dice[dieIndex];

  // Animate the die rolling
  const diceEl = document.getElementById(team + '-dice');
  const dieDivs = diceEl.querySelectorAll('.die');
  const targetDie = dieDivs[dieIndex];
  targetDie.classList.add('rolling');
  targetDie.textContent = '?';
  // Also spin the 3D die if present
  const lrPhysics = _dicePhysics[team];
  if (lrPhysics && lrPhysics.settled && lrPhysics.dice[dieIndex]) {
    lrPhysics.dice[dieIndex].el.classList.add('rolling-3d');
  }
  playSfx('sfxDiceRoll');

  setTimeout(() => {
    // Lucky Stones are 15% luckier — bias toward higher values
    const lsRoll = Math.random();
    const newVal = lsRoll < 0.12 ? 1 : lsRoll < 0.22 ? 2 : lsRoll < 0.34 ? 3 : lsRoll < 0.50 ? 4 : lsRoll < 0.70 ? 5 : 6;
    dice[dieIndex] = newVal;
    dice.sort((a, b) => a - b);
    t.resources.luckyStone--;

    // Cameron (25) — Unstoppable Force: opponent used a special (Lucky Stone — immediate die)
    triggerCameronSpecialWatch(team, true);

    if (team === 'red') B.pendingResolve.redDice = dice;
    else B.pendingResolve.blueDice = dice;
    B.redDice = B.pendingResolve.redDice;
    B.blueDice = B.pendingResolve.blueDice;

    // v731: broadcast Lucky Stone reroll to Red's engine so it resolves with correct dice
    if (LIVE_PVP && PVP_SIDE === 'blue' && PVP_GAME_REF) {
      PVP_GAME_REF.child('specialsChoice').push({
        type: 'luckyStone',
        side: 'blue',
        dieIndex: dieIndex,
        newValue: newVal,
        dice: dice.slice(), // full sorted dice array for easy application
        ts: Date.now()
      });
    }

    // Re-render dice directly (revealDice needs IDs from showRolling which aren't present here)
    targetDie.classList.remove('rolling');
    if (lrPhysics && lrPhysics.settled && lrPhysics.dice[dieIndex]) {
      lrPhysics.dice[dieIndex].el.classList.remove('rolling-3d');
    }
    renderDice(
      team === 'red' ? dice : B.pendingResolve.redDice,
      team === 'blue' ? dice : B.pendingResolve.blueDice
    );

    // Track Lucky Stone usage for Twyla (417) Lucky Dance
    if (B.luckyStoneSpentThisTurn) B.luckyStoneSpentThisTurn[team] = (B.luckyStoneSpentThisTurn[team] || 0) + 1;

    // Twyla (417) — Lucky Dance: each Lucky Stone spent adds +1 bonus die AND +1 Healing Seed LIVE
    const twylaFighter = active(B[team]);
    if (twylaFighter.id === 417 && !twylaFighter.ko) {
      // Add bonus die to the live dice array
      const lsRoll2 = Math.random();
      const bonusDie = lsRoll2 < 0.12 ? 1 : lsRoll2 < 0.22 ? 2 : lsRoll2 < 0.34 ? 3 : lsRoll2 < 0.50 ? 4 : lsRoll2 < 0.70 ? 5 : 6;
      dice.push(bonusDie);
      dice.sort((a, b) => a - b);
      // Sync dice back to battle state
      if (team === 'red') { B.pendingResolve.redDice = dice; B.redDice = dice; }
      else { B.pendingResolve.blueDice = dice; B.blueDice = dice; }
      // Grant Healing Seed
      B[team].resources.healingSeed++;
      log(`<span class="log-ability">${twylaFighter.name}</span> — Lucky Dance! <span class="log-heal">+1 Healing Seed!</span> <span class="log-ice">+1 bonus die (${bonusDie})!</span>`);
      showAbilityCallout('LUCKY DANCE!', 'var(--rare)', `${twylaFighter.name} — +1 die and +1 Healing Seed!`, team);
      // Re-render dice to show the new bonus die
      renderDice(
        team === 'red' ? dice : B.pendingResolve.redDice,
        team === 'blue' ? dice : B.pendingResolve.blueDice
      );
    }

    log(`<span class="log-ms">Lucky Stone!</span> ${team.charAt(0).toUpperCase()+team.slice(1)} rerolled ${oldVal} → <b>${newVal}</b> → [${dice.join(', ')}]`);
    narrate(`<b class="gold">Lucky Stone!</b> Rerolled ${oldVal} → <b>${newVal}</b>!`);
    renderBattle();

    // If player has more Lucky Stones available, go directly to dice-pick mode
    // (skip the tile-click step — keep the flow seamless within the same window)
    const stillAvail = B.lsAvailable ? B.lsAvailable[team] : 0;
    if (t.resources.luckyStone > 0 && stillAvail > 0) {
      B.lsAvailable[team]--;
      setTimeout(() => {
        const teamLabel = team.charAt(0).toUpperCase() + team.slice(1);
        narrate(`<b class="${team}-text">${teamLabel}</b> has <b class="gold">${t.resources.luckyStone} Lucky Stone${t.resources.luckyStone>1?'s':''}!</b> Pick a die to reroll!`);
        const diceElInner = document.getElementById(team + '-dice');
        const liveDice = team === 'red' ? B.pendingResolve.redDice : B.pendingResolve.blueDice;
        diceElInner.querySelectorAll('.die').forEach((d, i) => {
          d.classList.add('rerollable');
          d.onclick = () => doLuckyReroll(team, i, liveDice, callback);
        });
        sync3dDiceClickable(team);
        // Brief 3s countdown for the next die pick
        let pickRem = Math.max(3, getSpecialsTimerSecs() - 2);
        showLsCountdown(diceElInner, pickRem);
        lsCountdownTimer = setInterval(() => {
          pickRem--;
          if (pickRem <= 0) {
            clearLsCountdown();
            clearDiceClickable(team);
            log(`<span style="color:var(--text2)">${team.toUpperCase()} didn't pick a die in time.</span>`);
            callback();
          } else {
            showLsCountdown(diceElInner, pickRem);
          }
        }, 1000);
      }, 600);
    } else {
      setTimeout(callback, 600);
    }
  }, 500);
}

// ── BattleDice export ─────────────────────────────────────────────
window.BattleDice = {
  rollDice, weightedRoll,
  showRolling, revealDice, update3dDice, renderDice,
  highlightRollPreview, highlightWinnerDice,
  sync3dDiceHighlights, sync3dDiceClickable,
  doLuckyReroll, flatDieHTML, pip3dHTML, cube3dHTML,
  nearestSnap, pickThrowProfile
};
