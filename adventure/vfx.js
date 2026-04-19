// ============================================================================
// vfx.js — Animated Visual Effects Overlay System
// Battle of Origins: Overworld Adventure
// ============================================================================
// Draws atmospheric VFX onto the #fx canvas every frame.
// Replaces the old Pt/Wisp particle loop in index.html.
//
// Globals used (do NOT redefine):
//   time, camX, camY, camScale, W, H, WW, WH, dpr, w2s(), rn(), nodes
// ============================================================================

const WorldVFX = (() => {

  // ---------------------------------------------------------------------------
  // Internal state
  // ---------------------------------------------------------------------------
  let weather = 'clear';
  let timeOfDay = 0.25;   // noon default
  let currentRegion = '';
  let initialized = false;

  // Object pools
  const waterParticles = [];
  const cloudShadows = [];
  const weatherParticles = [];
  const nodeEffects = [];
  const stars = [];
  const burstParticles = [];

  // Lightning state
  let lightningTimer = 0;
  let lightningFlash = 0;

  // Moon
  const moon = { phase: 0 };

  // Day/night auto-cycle (5 min = 300000ms per full day)
  const DAY_CYCLE_MS = 300000;
  let dayCycleStart = 0;

  // ---------------------------------------------------------------------------
  // Pool helpers — reuse objects, no GC pressure
  // ---------------------------------------------------------------------------
  function makeWaterParticle() {
    return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, sz: 1, type: 'shimmer', opacity: 0 };
  }
  function makeCloudShadow() {
    return { x: 0, y: 0, w: 0, h: 0, opacity: 0, speed: 0, active: false };
  }
  function makeWeatherParticle() {
    return { x: 0, y: 0, vx: 0, vy: 0, sz: 1, life: 0, maxLife: 1, opacity: 0, type: '', r: 0, g: 0, b: 0 };
  }
  function makeNodeEffect() {
    return { x: 0, y: 0, vx: 0, vy: 0, sz: 1, life: 0, maxLife: 1, opacity: 0, type: '' };
  }
  function makeBurstParticle() {
    return { x: 0, y: 0, vx: 0, vy: 0, sz: 1, life: 0, maxLife: 1, opacity: 0, r: 0, g: 0, b: 0 };
  }

  // ---------------------------------------------------------------------------
  // Seeded-random helpers (use rn() from global)
  // ---------------------------------------------------------------------------
  function rng(min, max) { return min + rn() * (max - min); }
  function rngInt(min, max) { return (min + rn() * (max - min)) | 0; }

  // ---------------------------------------------------------------------------
  // WATER SHIMMER
  // ---------------------------------------------------------------------------
  const WATER_ZONES = [
    // Rolling Hills river — vertical strip
    { type: 'river', cx: 0.50, cy: 0.75, hw: 0.012, hh: 0.20, region: 'rolling_hills' },
    // Rolling Hills ponds
    { type: 'pond', cx: 0.33, cy: 0.67, r: 0.015, region: 'rolling_hills' },
    { type: 'pond', cx: 0.69, cy: 0.70, r: 0.015, region: 'rolling_hills' },
    // Frost Valley frozen lake — sparkle instead of shimmer
    { type: 'frozen', cx: 0.17, cy: 0.36, r: 0.04, region: 'frost_valley' }
  ];

  function initWater() {
    for (let i = 0; i < 28; i++) {
      waterParticles.push(makeWaterParticle());
    }
    resetWaterParticles();
  }

  function resetWaterParticles() {
    for (let i = 0; i < waterParticles.length; i++) {
      spawnWaterParticle(waterParticles[i], true);
    }
  }

  function spawnWaterParticle(p, randomLife) {
    const zone = WATER_ZONES[(rn() * WATER_ZONES.length) | 0];
    p.type = zone.type;

    if (zone.type === 'river') {
      p.x = zone.cx + rng(-zone.hw, zone.hw);
      p.y = zone.cy + rng(-zone.hh, zone.hh);
      p.vx = 0;
      p.vy = rng(0.00003, 0.00008); // drift downstream
    } else {
      // Pond or frozen — scatter within circle
      const a = rn() * Math.PI * 2;
      const d = rn() * (zone.r || 0.015);
      p.x = zone.cx + Math.cos(a) * d;
      p.y = zone.cy + Math.sin(a) * d;
      p.vx = rng(-0.00002, 0.00002);
      p.vy = rng(-0.00002, 0.00002);
    }

    p.sz = rng(0.8, 2.0);
    p.maxLife = rng(120, 280);
    p.life = randomLife ? rn() * p.maxLife : p.maxLife;
    p.opacity = 0;
  }

  function updateWater() {
    for (let i = 0; i < waterParticles.length; i++) {
      const p = waterParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      // Fade in/out
      const lifeRatio = p.life / p.maxLife;
      if (lifeRatio > 0.8) p.opacity = (1 - lifeRatio) * 5;     // fade in
      else if (lifeRatio < 0.2) p.opacity = lifeRatio * 5;       // fade out
      else p.opacity = 1;

      if (p.life <= 0) spawnWaterParticle(p, false);
    }
  }

  function drawWater(ctx) {
    for (let i = 0; i < waterParticles.length; i++) {
      const p = waterParticles[i];
      if (p.opacity < 0.01) continue;
      const sp = w2s(p.x, p.y);
      const s = p.sz * camScale;
      if (sp.x < -20 || sp.x > W + 20 || sp.y < -20 || sp.y > H + 20) continue;

      if (p.type === 'frozen') {
        // White sparkle glint
        const twinkle = Math.max(0, Math.sin(time * 0.008 + i * 2.3));
        const a = p.opacity * twinkle * 0.5;
        if (a < 0.02) continue;
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(sp.x - s * 0.5, sp.y - s * 0.5, s, s);
      } else {
        // Blue/white shimmer
        const shimmer = 0.5 + 0.5 * Math.sin(time * 0.004 + i * 1.7);
        const a = p.opacity * 0.25 * shimmer;
        if (a < 0.02) continue;
        const blue = 180 + (rn() * 40) | 0;
        ctx.fillStyle = `rgba(${150 + (rn() * 60) | 0},${blue},255,${a})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // CLOUD SHADOWS
  // ---------------------------------------------------------------------------
  function initClouds() {
    for (let i = 0; i < 5; i++) {
      const c = makeCloudShadow();
      resetCloud(c, true);
      cloudShadows.push(c);
    }
  }

  function resetCloud(c, scatter) {
    c.x = scatter ? rn() * 1.3 - 0.15 : -0.25;
    c.y = rng(0.05, 0.85);
    c.w = rng(0.10, 0.20);
    c.h = rng(0.05, 0.10);
    c.opacity = rng(0.06, 0.12);
    c.speed = rng(0.000015, 0.000025);
    c.active = true;
  }

  function updateClouds() {
    for (let i = 0; i < cloudShadows.length; i++) {
      const c = cloudShadows[i];
      c.x += c.speed;
      if (c.x > 1.3) resetCloud(c, false);
    }
  }

  function drawClouds(ctx) {
    for (let i = 0; i < cloudShadows.length; i++) {
      const c = cloudShadows[i];
      const sp = w2s(c.x, c.y);
      const sw = c.w * WW * camScale;
      const sh = c.h * WH * camScale;

      // Determine if in Dark Castle region (y < 0.3, x 0.28-0.72)
      let op = c.opacity;
      if (c.y < 0.30 && c.x > 0.28 && c.x < 0.72) {
        op *= 1.6; // denser in Dark Castle
      }

      ctx.save();
      ctx.fillStyle = `rgba(0,0,0,${op})`;
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y, sw * 0.5, sh * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // WEATHER PARTICLES
  // ---------------------------------------------------------------------------
  const MAX_WEATHER = 60;

  function initWeather() {
    for (let i = 0; i < MAX_WEATHER; i++) {
      weatherParticles.push(makeWeatherParticle());
    }
  }

  function spawnWeatherParticle(p, region, randomY) {
    p.type = '';
    p.life = 0;
    p.opacity = 0;

    if (region === 'frost_valley' || weather === 'snow') {
      // Heavy snowfall
      p.type = 'snow';
      p.x = rn();
      p.y = randomY ? rn() : -0.02;
      p.vx = rng(-0.00008, 0.00004); // slight wind sway
      p.vy = rng(0.00015, 0.0004);
      p.sz = rng(0.5, 2.0);
      p.maxLife = rng(200, 500);
      p.life = randomY ? rn() * p.maxLife : p.maxLife;
      p.r = rngInt(210, 240); p.g = rngInt(225, 245); p.b = 255;
    } else if (region === 'volcanic_isles' || weather === 'ash') {
      if (rn() < 0.25) {
        // Red ember drifting UP from lava
        p.type = 'ember';
        p.x = rng(0.62, 0.97);
        p.y = rng(0.35, 0.55);
        p.vx = rng(-0.0001, 0.0001);
        p.vy = rng(-0.0004, -0.00015);
        p.sz = rng(0.8, 2.2);
        p.maxLife = rng(100, 250);
        p.life = randomY ? rn() * p.maxLife : p.maxLife;
        p.r = 255; p.g = rngInt(80, 140); p.b = rngInt(10, 40);
      } else {
        // Grey ash falling
        p.type = 'ash';
        p.x = rng(0.55, 1.0);
        p.y = randomY ? rn() * 0.55 : -0.02;
        p.vx = rng(-0.00005, 0.00003);
        p.vy = rng(0.0001, 0.00025);
        p.sz = rng(0.6, 1.8);
        p.maxLife = rng(200, 450);
        p.life = randomY ? rn() * p.maxLife : p.maxLife;
        const g = rngInt(60, 120);
        p.r = g; p.g = g; p.b = g;
      }
    } else if (region === 'dark_castle' || weather === 'storm') {
      // Purple energy wisps floating upward
      p.type = 'wisp';
      p.x = rng(0.28, 0.72);
      p.y = rng(0.10, 0.28);
      p.vx = rng(-0.00008, 0.00008);
      p.vy = rng(-0.0003, -0.00008);
      p.sz = rng(1.0, 2.5);
      p.maxLife = rng(120, 300);
      p.life = randomY ? rn() * p.maxLife : p.maxLife;
      p.r = rngInt(130, 180); p.g = rngInt(60, 100); p.b = rngInt(190, 255);
    } else if (region === 'rolling_hills') {
      // Fireflies (night only — handled in draw with timeOfDay check)
      p.type = 'firefly';
      p.x = rng(0.25, 0.75);
      p.y = rng(0.55, 0.95);
      p.vx = rng(-0.00006, 0.00006);
      p.vy = rng(-0.00006, 0.00006);
      p.sz = rng(1.0, 2.0);
      p.maxLife = rng(180, 400);
      p.life = randomY ? rn() * p.maxLife : p.maxLife;
      p.r = 255; p.g = rngInt(220, 255); p.b = rngInt(60, 120);
      // Varied path — store a phase offset
      p.opacity = rn() * Math.PI * 2; // reuse opacity as phase temporarily
    } else if (weather === 'rain') {
      p.type = 'rain';
      p.x = rn();
      p.y = randomY ? rn() : -0.02;
      p.vx = rng(-0.00005, 0.00005);
      p.vy = rng(0.0008, 0.0015);
      p.sz = rng(0.3, 0.8);
      p.maxLife = rng(60, 120);
      p.life = randomY ? rn() * p.maxLife : p.maxLife;
      p.r = 150; p.g = 180; p.b = 220;
    }
  }

  function getActiveRegions() {
    // Determine which regions are visible on screen — return all for simplicity
    // since the particles are region-bounded anyway
    const regions = [];
    if (typeof nodes !== 'undefined' && nodes.length) {
      const seen = {};
      for (let i = 0; i < nodes.length; i++) {
        const r = nodes[i].r;
        if (!seen[r]) { seen[r] = true; regions.push(r); }
      }
    }
    if (!regions.length) regions.push('rolling_hills', 'frost_valley', 'volcanic_isles', 'dark_castle');
    return regions;
  }

  function updateWeather() {
    const regions = getActiveRegions();

    for (let i = 0; i < weatherParticles.length; i++) {
      const p = weatherParticles[i];
      if (p.life <= 0 || !p.type) {
        // Respawn — distribute across regions
        const region = regions[i % regions.length];
        spawnWeatherParticle(p, region, i < MAX_WEATHER * 0.7); // first batch scattered
        continue;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      // Wind sway for snow/ash
      if (p.type === 'snow' || p.type === 'ash') {
        p.x += Math.sin(time * 0.002 + i * 0.7) * 0.000015;
      }
      // Firefly wandering
      if (p.type === 'firefly') {
        p.vx += rng(-0.000005, 0.000005);
        p.vy += rng(-0.000005, 0.000005);
        p.vx = Math.max(-0.0001, Math.min(0.0001, p.vx));
        p.vy = Math.max(-0.0001, Math.min(0.0001, p.vy));
      }

      // Off-screen respawn
      if (p.y > 1.05 || p.y < -0.05 || p.x < -0.05 || p.x > 1.05) {
        p.life = 0;
      }
    }
  }

  function drawWeather(ctx) {
    // Night check for fireflies
    const isNight = timeOfDay > 0.65 && timeOfDay < 0.95;

    for (let i = 0; i < weatherParticles.length; i++) {
      const p = weatherParticles[i];
      if (p.life <= 0 || !p.type) continue;

      const sp = w2s(p.x, p.y);
      if (sp.x < -30 || sp.x > W + 30 || sp.y < -30 || sp.y > H + 30) continue;

      const s = p.sz * camScale;
      const lifeRatio = p.life / p.maxLife;
      let alpha;
      if (lifeRatio > 0.85) alpha = (1 - lifeRatio) / 0.15;
      else if (lifeRatio < 0.15) alpha = lifeRatio / 0.15;
      else alpha = 1;

      if (p.type === 'firefly') {
        if (!isNight) continue; // only at night
        const phase = p.opacity; // stored phase
        const glow = Math.max(0, Math.sin(time * 0.005 + phase));
        alpha *= glow * 0.6;
        if (alpha < 0.02) continue;
        ctx.save();
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
        ctx.shadowColor = `rgba(255,240,80,${alpha * 0.6})`;
        ctx.shadowBlur = s * 5;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      if (p.type === 'ember') {
        alpha *= 0.7;
        if (alpha < 0.02) continue;
        ctx.save();
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
        ctx.shadowColor = `rgba(255,100,20,${alpha * 0.4})`;
        ctx.shadowBlur = s * 4;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      if (p.type === 'wisp') {
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.004 + i * 1.3);
        alpha *= pulse * 0.35;
        if (alpha < 0.02) continue;
        ctx.save();
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
        ctx.shadowColor = `rgba(160,80,220,${alpha * 0.4})`;
        ctx.shadowBlur = s * 4;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      if (p.type === 'rain') {
        alpha *= 0.3;
        if (alpha < 0.02) continue;
        ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
        ctx.lineWidth = s * 0.4;
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        ctx.lineTo(sp.x + p.vx * 800, sp.y + p.vy * 800);
        ctx.stroke();
        continue;
      }

      // Snow / ash — simple circle
      alpha *= (p.type === 'snow') ? 0.4 : 0.3;
      if (alpha < 0.02) continue;
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---------------------------------------------------------------------------
  // LIGHTNING (Dark Castle — very rare)
  // ---------------------------------------------------------------------------
  function updateLightning(dt) {
    if (lightningFlash > 0) lightningFlash -= dt * 0.06;
    lightningTimer += dt;
    // ~every 30 seconds, with randomness
    if (lightningTimer > 25000 + rn() * 10000) {
      lightningTimer = 0;
      // Only flash if Dark Castle is a visible region
      lightningFlash = 1;
    }
  }

  function drawLightning(ctx) {
    if (lightningFlash <= 0) return;
    const a = Math.min(0.12, lightningFlash * 0.12);
    ctx.fillStyle = `rgba(200,180,255,${a})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ---------------------------------------------------------------------------
  // NODE AMBIENT EFFECTS
  // ---------------------------------------------------------------------------
  const MAX_NODE_FX = 40;

  function initNodeEffects() {
    for (let i = 0; i < MAX_NODE_FX; i++) {
      nodeEffects.push(makeNodeEffect());
    }
  }

  function updateNodeEffects() {
    if (typeof nodes === 'undefined' || !nodes.length) return;

    let active = 0;
    for (let i = 0; i < nodeEffects.length; i++) {
      const p = nodeEffects[i];
      if (p.life > 0) {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        active++;
      }
    }

    // Spawn new particles from interesting nodes
    if (active >= MAX_NODE_FX) return;

    for (let ni = 0; ni < nodes.length; ni++) {
      const n = nodes[ni];
      if (active >= MAX_NODE_FX) break;

      let shouldSpawn = false;
      let spawnType = '';

      if (n.type === 'shop') { spawnType = 'coin'; shouldSpawn = rn() < 0.04; }
      else if (n.type === 'shrine') { spawnType = 'shrine'; shouldSpawn = rn() < 0.05; }

      if (shouldSpawn) {
        // Find a dead slot
        for (let j = 0; j < nodeEffects.length; j++) {
          const p = nodeEffects[j];
          if (p.life <= 0) {
            p.type = spawnType;
            const angle = rn() * Math.PI * 2;
            const dist = rn() * 0.008;
            p.x = n.x + Math.cos(angle) * dist;
            p.y = n.y + Math.sin(angle) * dist;

            if (spawnType === 'coin') {
              p.vx = rng(-0.00003, 0.00003);
              p.vy = rng(-0.00006, -0.00002);
              p.sz = rng(0.5, 1.2);
              p.maxLife = rng(40, 80);
            } else {
              // shrine — rising ethereal
              p.vx = rng(-0.00002, 0.00002);
              p.vy = rng(-0.0001, -0.00004);
              p.sz = rng(0.8, 1.5);
              p.maxLife = rng(60, 120);
            }
            p.life = p.maxLife;
            active++;
            break;
          }
        }
      }
    }
  }

  function drawNodeEffects(ctx) {
    if (typeof nodes === 'undefined') return;

    // Draw node auras first (camp glow, boss aura)
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const sp = w2s(n.x, n.y);
      if (sp.x < -100 || sp.x > W + 100 || sp.y < -100 || sp.y > H + 100) continue;

      if (n.type === 'camp') {
        // Warm campfire glow
        const pulse = 0.6 + 0.4 * Math.sin(time * 0.003 + i * 0.5);
        const r = 8 * camScale * pulse;
        const grad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, r);
        grad.addColorStop(0, `rgba(255,160,40,${0.12 * pulse})`);
        grad.addColorStop(1, 'rgba(255,160,40,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (n.type === 'boss') {
        // Menacing pulsing aura
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.004 + i);
        const r = 10 * camScale * (0.8 + 0.2 * pulse);
        const isValkin = n.name && n.name.toLowerCase().includes('valkin');
        const color = isValkin ? [160, 60, 220] : [220, 50, 60];
        const grad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, r);
        grad.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},${0.10 * pulse})`);
        grad.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw spawned node particles (coins, shrine wisps)
    for (let i = 0; i < nodeEffects.length; i++) {
      const p = nodeEffects[i];
      if (p.life <= 0) continue;

      const sp = w2s(p.x, p.y);
      if (sp.x < -20 || sp.x > W + 20 || sp.y < -20 || sp.y > H + 20) continue;

      const s = p.sz * camScale;
      const lifeRatio = p.life / p.maxLife;
      let alpha;
      if (lifeRatio > 0.7) alpha = (1 - lifeRatio) / 0.3;
      else if (lifeRatio < 0.3) alpha = lifeRatio / 0.3;
      else alpha = 1;

      if (p.type === 'coin') {
        const twinkle = 0.5 + 0.5 * Math.sin(time * 0.012 + i * 3.1);
        alpha *= twinkle * 0.6;
        if (alpha < 0.02) continue;
        ctx.fillStyle = `rgba(240,216,80,${alpha})`;
        ctx.fillRect(sp.x - s * 0.4, sp.y - s * 0.4, s * 0.8, s * 0.8);
      } else if (p.type === 'shrine') {
        alpha *= 0.4;
        if (alpha < 0.02) continue;
        ctx.save();
        ctx.fillStyle = `rgba(255,250,220,${alpha})`;
        ctx.shadowColor = `rgba(255,240,180,${alpha * 0.5})`;
        ctx.shadowBlur = s * 3;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, s, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // DAY/NIGHT CYCLE + STARS + MOON
  // ---------------------------------------------------------------------------
  function initStars() {
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: rn(),
        y: rn() * 0.5, // upper half of screen
        sz: rn() < 0.15 ? rng(1.5, 2.5) : rng(0.5, 1.2), // some brighter
        freq: rng(0.002, 0.006),
        phase: rn() * Math.PI * 2,
        baseAlpha: rng(0.3, 0.8)
      });
    }
  }

  function drawDayNight(ctx) {
    const p = timeOfDay;

    // Determine overlay color and intensity based on phase
    let overlayR = 0, overlayG = 0, overlayB = 0, overlayA = 0;
    let tintR = 0, tintG = 0, tintB = 0, tintA = 0;

    if (p < 0.15) {
      // Dawn — warm orange from east, fading
      const t = p / 0.15;
      tintR = 255; tintG = 160; tintB = 60;
      tintA = 0.06 * (1 - t);
    } else if (p < 0.4) {
      // Day — clear, no overlay
    } else if (p < 0.5) {
      // Golden hour
      const t = (p - 0.4) / 0.1;
      tintR = 255; tintG = 200; tintB = 80;
      tintA = 0.05 * t;
    } else if (p < 0.65) {
      // Dusk — orange/purple from west, darkening
      const t = (p - 0.5) / 0.15;
      tintR = 180; tintG = 80; tintB = 140;
      tintA = 0.04 + t * 0.08;
      overlayR = 10; overlayG = 10; overlayB = 30;
      overlayA = t * 0.15;
    } else if (p < 0.9) {
      // Night — dark blue overlay, stars, moon
      const t = Math.min(1, (p - 0.65) / 0.1);
      overlayR = 8; overlayG = 12; overlayB = 35;
      overlayA = 0.15 + t * 0.10;
    } else {
      // Pre-dawn — transitioning back
      const t = (p - 0.9) / 0.1;
      overlayR = 8; overlayG = 12; overlayB = 35;
      overlayA = 0.25 * (1 - t);
      tintR = 255; tintG = 140; tintB = 60;
      tintA = 0.04 * t;
    }

    // Draw tint (gradient from east/west)
    if (tintA > 0.005) {
      if (p < 0.15 || p > 0.9) {
        // Dawn — from left
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, `rgba(${tintR},${tintG},${tintB},${tintA})`);
        grad.addColorStop(0.6, `rgba(${tintR},${tintG},${tintB},0)`);
        ctx.fillStyle = grad;
      } else if (p >= 0.5 && p < 0.65) {
        // Dusk — from right
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0.4, `rgba(${tintR},${tintG},${tintB},0)`);
        grad.addColorStop(1, `rgba(${tintR},${tintG},${tintB},${tintA})`);
        ctx.fillStyle = grad;
      } else {
        // Golden hour — uniform
        ctx.fillStyle = `rgba(${tintR},${tintG},${tintB},${tintA})`;
      }
      ctx.fillRect(0, 0, W, H);
    }

    // Dark overlay
    if (overlayA > 0.005) {
      ctx.fillStyle = `rgba(${overlayR},${overlayG},${overlayB},${overlayA})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Stars (only during night phases)
    const nightAmount = (p > 0.65 && p < 0.95)
      ? Math.min(1, Math.min((p - 0.65) / 0.05, (0.95 - p) / 0.05))
      : 0;

    if (nightAmount > 0.05) {
      for (let i = 0; i < stars.length; i++) {
        const st = stars[i];
        const twinkle = 0.4 + 0.6 * Math.sin(time * st.freq + st.phase);
        const a = st.baseAlpha * twinkle * nightAmount;
        if (a < 0.03) continue;
        ctx.fillStyle = `rgba(255,255,245,${Math.min(a, 0.7)})`;
        ctx.beginPath();
        ctx.arc(st.x * W, st.y * H, st.sz * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Moon — moves across upper portion during night
      const nightProgress = (p - 0.65) / 0.3;
      const moonX = 0.15 + nightProgress * 0.7;
      const moonY = 0.08 + Math.sin(nightProgress * Math.PI) * 0.04;
      const moonAlpha = nightAmount * 0.6;

      ctx.save();
      ctx.fillStyle = `rgba(255,255,240,${moonAlpha})`;
      ctx.shadowColor = `rgba(255,255,220,${moonAlpha * 0.4})`;
      ctx.shadowBlur = 15 * dpr;
      ctx.beginPath();
      ctx.arc(moonX * W, moonY * H, 4 * dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // REGION TRANSITION BURSTS
  // ---------------------------------------------------------------------------
  const MAX_BURST = 30;

  function initBurst() {
    for (let i = 0; i < MAX_BURST; i++) {
      burstParticles.push(makeBurstParticle());
    }
  }

  function triggerBurst(regionId) {
    // Center of screen in world coords
    const cx = (W * 0.5 - camX) / (WW * camScale);
    const cy = (H * 0.5 - camY) / (WH * camScale);

    for (let i = 0; i < MAX_BURST; i++) {
      const p = burstParticles[i];
      const angle = rn() * Math.PI * 2;
      const speed = rng(0.0005, 0.002);
      p.x = cx + rng(-0.05, 0.05);
      p.y = cy + rng(-0.05, 0.05);
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.sz = rng(1.0, 3.0);
      p.maxLife = rng(40, 90);
      p.life = p.maxLife;

      if (regionId === 'frost_valley') {
        p.r = rngInt(210, 240); p.g = rngInt(225, 245); p.b = 255;
        p.vy -= 0.0002; // snow drifts down
      } else if (regionId === 'volcanic_isles') {
        p.r = 255; p.g = rngInt(80, 160); p.b = rngInt(10, 50);
        p.vy -= rng(0.0003, 0.0008); // embers rise
      } else if (regionId === 'dark_castle') {
        p.r = rngInt(130, 180); p.g = rngInt(50, 90); p.b = rngInt(190, 255);
        p.vy -= rng(0.0002, 0.0006);
      } else {
        // Rolling Hills — green sparkles
        p.r = rngInt(100, 180); p.g = rngInt(200, 255); p.b = rngInt(80, 140);
      }
    }
  }

  function updateBurst() {
    for (let i = 0; i < burstParticles.length; i++) {
      const p = burstParticles[i];
      if (p.life <= 0) continue;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life--;
    }
  }

  function drawBurst(ctx) {
    for (let i = 0; i < burstParticles.length; i++) {
      const p = burstParticles[i];
      if (p.life <= 0) continue;

      const sp = w2s(p.x, p.y);
      const s = p.sz * camScale;
      const lifeRatio = p.life / p.maxLife;
      const alpha = lifeRatio * 0.5;
      if (alpha < 0.02) continue;

      ctx.save();
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
      ctx.shadowColor = `rgba(${p.r},${p.g},${p.b},${alpha * 0.5})`;
      ctx.shadowBlur = s * 3;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, s, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------------------
  // AUTO DAY CYCLE
  // ---------------------------------------------------------------------------
  function updateDayCycle(t) {
    if (!dayCycleStart) dayCycleStart = t;
    timeOfDay = ((t - dayCycleStart) / DAY_CYCLE_MS) % 1;
  }

  // ---------------------------------------------------------------------------
  // PUBLIC API
  // ---------------------------------------------------------------------------
  return {

    init() {
      if (initialized) return;
      initialized = true;
      initWater();
      initClouds();
      initWeather();
      initNodeEffects();
      initStars();
      initBurst();
    },

    draw(ctx, t) {
      if (!initialized) this.init();

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Auto-advance day/night
      updateDayCycle(t);

      // Update all systems
      updateWater();
      updateClouds();
      updateWeather();
      updateNodeEffects();
      updateBurst();
      updateLightning(16); // ~16ms per frame

      // Draw layers (back to front)
      drawClouds(ctx);        // subtle shadows on the ground
      drawWater(ctx);          // water shimmer/sparkle
      drawWeather(ctx);        // snow, ash, embers, wisps, fireflies
      drawNodeEffects(ctx);    // camp glow, boss aura, coin sparkles, shrine wisps
      drawBurst(ctx);          // transition burst particles
      drawDayNight(ctx);       // tints, stars, moon (drawn on top)
      drawLightning(ctx);      // rare flash
    },

    setWeather(type) {
      weather = type || 'clear';
    },

    setTimeOfDay(phase) {
      timeOfDay = Math.max(0, Math.min(1, phase));
      // Reset auto-cycle to match
      dayCycleStart = (typeof time !== 'undefined' ? time : performance.now()) - phase * DAY_CYCLE_MS;
    },

    regionBurst(regionId) {
      triggerBurst(regionId);
    }
  };

})();
