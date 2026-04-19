// ============================================================================
// atmosphere.js — Web Audio API Ambient Soundscape Engine
// Battle of Origins: Overworld Adventure
// ============================================================================
// Procedurally generates immersive ambient audio for 4 regions.
// All sounds are synthesized — no external audio files needed.
// ============================================================================

const Atmosphere = (() => {

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  let ctx = null;           // AudioContext
  let masterGain = null;    // Master volume node
  let currentRegion = null; // Active region ID
  let activeLayer = null;   // { regionId, gains, nodes, timers }
  let fadingLayer = null;   // Layer being faded out
  let masterVolume = 0.5;
  let paused = false;

  const CROSSFADE_MS = 2000;
  const NOISE_BUFFER_SIZE = 2 * 44100; // 2 seconds of noise

  // Pre-generated noise buffers (created once on init)
  let whiteNoiseBuffer = null;
  let brownNoiseBuffer = null;

  // ---------------------------------------------------------------------------
  // Noise generation
  // ---------------------------------------------------------------------------
  function createWhiteNoiseBuffer() {
    const buffer = ctx.createBuffer(1, NOISE_BUFFER_SIZE, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < NOISE_BUFFER_SIZE; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function createBrownNoiseBuffer() {
    const buffer = ctx.createBuffer(1, NOISE_BUFFER_SIZE, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < NOISE_BUFFER_SIZE; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5; // Normalize
    }
    return buffer;
  }

  // ---------------------------------------------------------------------------
  // Utility: looping noise source
  // ---------------------------------------------------------------------------
  function createNoiseSource(buffer) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  // ---------------------------------------------------------------------------
  // Utility: fade a gain node
  // ---------------------------------------------------------------------------
  function fadeGain(gainNode, targetValue, durationMs) {
    const now = ctx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(targetValue, now + durationMs / 1000);
  }

  // ---------------------------------------------------------------------------
  // Layer management
  // ---------------------------------------------------------------------------
  function createLayer(regionId) {
    const layerGain = ctx.createGain();
    layerGain.gain.value = 0;
    layerGain.connect(masterGain);

    const layer = {
      regionId,
      layerGain,
      nodes: [],   // AudioNodes to disconnect on destroy
      timers: [],  // setTimeout IDs to clear on destroy
      destroyed: false
    };

    // Build the region's soundscape
    const builder = regionBuilders[regionId];
    if (builder) builder(layer);

    return layer;
  }

  function destroyLayer(layer) {
    if (!layer || layer.destroyed) return;
    layer.destroyed = true;

    // Clear all scheduled random events
    layer.timers.forEach(t => clearTimeout(t));
    layer.timers.length = 0;

    // Stop and disconnect all nodes
    layer.nodes.forEach(node => {
      try { node.stop(); } catch (_) {}
      try { node.disconnect(); } catch (_) {}
    });
    layer.nodes.length = 0;

    try { layer.layerGain.disconnect(); } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // Helper: schedule a recurring random event within a layer
  // ---------------------------------------------------------------------------
  function scheduleRandom(layer, minMs, maxMs, callback) {
    if (layer.destroyed) return;
    const delay = minMs + Math.random() * (maxMs - minMs);
    const id = setTimeout(() => {
      if (layer.destroyed || paused) {
        // If paused, reschedule to check again later
        if (!layer.destroyed) scheduleRandom(layer, minMs, maxMs, callback);
        return;
      }
      callback();
      scheduleRandom(layer, minMs, maxMs, callback);
    }, delay);
    layer.timers.push(id);
  }

  // ---------------------------------------------------------------------------
  // Helper: play a short sine pip (for birds, chimes, etc.)
  // ---------------------------------------------------------------------------
  function playPip(layer, freq, duration, volume, detune = 0) {
    if (layer.destroyed || !ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(layer.layerGain);

    const now = ctx.currentTime;
    // Quick attack, sustain, gentle release
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.setValueAtTime(volume, now + duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.05);
    layer.nodes.push(osc);

    // Clean up reference after it finishes
    osc.onended = () => {
      const idx = layer.nodes.indexOf(osc);
      if (idx !== -1) layer.nodes.splice(idx, 1);
    };
  }

  // ---------------------------------------------------------------------------
  // Helper: play a short noise burst (for cracks, thunder, fire)
  // ---------------------------------------------------------------------------
  function playNoiseBurst(layer, filterFreq, filterQ, duration, volume, filterType = 'lowpass') {
    if (layer.destroyed || !ctx) return;
    const source = createNoiseSource(whiteNoiseBuffer);
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;
    const gain = ctx.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(layer.layerGain);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.start(now);
    source.stop(now + duration + 0.05);
    layer.nodes.push(source, filter);

    source.onended = () => {
      const idx = layer.nodes.indexOf(source);
      if (idx !== -1) layer.nodes.splice(idx, 1);
      const idx2 = layer.nodes.indexOf(filter);
      if (idx2 !== -1) layer.nodes.splice(idx2, 1);
    };
  }

  // =========================================================================
  // REGION BUILDERS
  // =========================================================================
  const regionBuilders = {};

  // -------------------------------------------------------------------------
  // ROLLING HILLS — Peaceful, pastoral, warm
  // -------------------------------------------------------------------------
  regionBuilders.rolling_hills = (layer) => {
    // --- Warm wind (brown noise, low-passed) ---
    const wind = createNoiseSource(brownNoiseBuffer);
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 400;
    windFilter.Q.value = 0.5;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.12;

    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(layer.layerGain);
    wind.start();
    layer.nodes.push(wind, windFilter, windGain);

    // --- Gentle wind variation (slow LFO on wind filter) ---
    const windLFO = ctx.createOscillator();
    const windLFOGain = ctx.createGain();
    windLFO.type = 'sine';
    windLFO.frequency.value = 0.15; // Very slow
    windLFOGain.gain.value = 100;   // Modulates filter ±100Hz
    windLFO.connect(windLFOGain);
    windLFOGain.connect(windFilter.frequency);
    windLFO.start();
    layer.nodes.push(windLFO, windLFOGain);

    // --- Distant water babble (filtered white noise, very quiet) ---
    const water = createNoiseSource(whiteNoiseBuffer);
    const waterBP = ctx.createBiquadFilter();
    waterBP.type = 'bandpass';
    waterBP.frequency.value = 1200;
    waterBP.Q.value = 2;
    const waterGain = ctx.createGain();
    waterGain.gain.value = 0.03;

    // Slow modulation to make water "babble"
    const waterLFO = ctx.createOscillator();
    const waterLFOGain = ctx.createGain();
    waterLFO.type = 'sine';
    waterLFO.frequency.value = 3;
    waterLFOGain.gain.value = 0.015;
    waterLFO.connect(waterLFOGain);
    waterLFOGain.connect(waterGain.gain);

    water.connect(waterBP);
    waterBP.connect(waterGain);
    waterGain.connect(layer.layerGain);
    water.start();
    waterLFO.start();
    layer.nodes.push(water, waterBP, waterGain, waterLFO, waterLFOGain);

    // --- Bird chirps (random sine pips) ---
    scheduleRandom(layer, 2000, 6000, () => {
      const freq = 800 + Math.random() * 1200;
      playPip(layer, freq, 0.08 + Math.random() * 0.06, 0.06 + Math.random() * 0.04);
      // Sometimes a quick double chirp
      if (Math.random() < 0.4) {
        setTimeout(() => {
          playPip(layer, freq * (0.9 + Math.random() * 0.2), 0.06, 0.04);
        }, 100 + Math.random() * 80);
      }
    });
  };

  // -------------------------------------------------------------------------
  // FROST VALLEY — Cold, vast, lonely
  // -------------------------------------------------------------------------
  regionBuilders.frost_valley = (layer) => {
    // --- Howling wind (white noise, bandpassed with slow LFO) ---
    const wind = createNoiseSource(whiteNoiseBuffer);
    const windBP = ctx.createBiquadFilter();
    windBP.type = 'bandpass';
    windBP.frequency.value = 600;
    windBP.Q.value = 1.5;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.10;

    // Slow howling sweep
    const windLFO = ctx.createOscillator();
    const windLFOGain = ctx.createGain();
    windLFO.type = 'sine';
    windLFO.frequency.value = 0.08;
    windLFOGain.gain.value = 300;
    windLFO.connect(windLFOGain);
    windLFOGain.connect(windBP.frequency);

    // Volume swell for howling effect
    const windVolLFO = ctx.createOscillator();
    const windVolLFOGain = ctx.createGain();
    windVolLFO.type = 'sine';
    windVolLFO.frequency.value = 0.12;
    windVolLFOGain.gain.value = 0.04;
    windVolLFO.connect(windVolLFOGain);
    windVolLFOGain.connect(windGain.gain);

    wind.connect(windBP);
    windBP.connect(windGain);
    windGain.connect(layer.layerGain);
    wind.start();
    windLFO.start();
    windVolLFO.start();
    layer.nodes.push(wind, windBP, windGain, windLFO, windLFOGain, windVolLFO, windVolLFOGain);

    // --- High bed of cold air (very quiet high-freq noise) ---
    const coldAir = createNoiseSource(whiteNoiseBuffer);
    const coldFilter = ctx.createBiquadFilter();
    coldFilter.type = 'highpass';
    coldFilter.frequency.value = 6000;
    coldFilter.Q.value = 0.3;
    const coldGain = ctx.createGain();
    coldGain.gain.value = 0.015;
    coldAir.connect(coldFilter);
    coldFilter.connect(coldGain);
    coldGain.connect(layer.layerGain);
    coldAir.start();
    layer.nodes.push(coldAir, coldFilter, coldGain);

    // --- Crystalline chimes (sparse high sine tones) ---
    scheduleRandom(layer, 4000, 10000, () => {
      const freq = 3000 + Math.random() * 2000;
      const duration = 0.8 + Math.random() * 1.2;
      playPip(layer, freq, duration, 0.02 + Math.random() * 0.015);
      // Occasional harmonic shimmer
      if (Math.random() < 0.3) {
        setTimeout(() => {
          playPip(layer, freq * 1.5, duration * 0.7, 0.01);
        }, 200);
      }
    });

    // --- Ice cracking (deep low-freq burst, rare) ---
    scheduleRandom(layer, 8000, 20000, () => {
      playNoiseBurst(layer, 150, 3, 0.3 + Math.random() * 0.2, 0.08 + Math.random() * 0.04);
    });
  };

  // -------------------------------------------------------------------------
  // VOLCANIC ISLES — Dangerous, primal
  // -------------------------------------------------------------------------
  regionBuilders.volcanic_isles = (layer) => {
    // --- Deep rumbling bass drone ---
    const drone = ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 55;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.10;

    // Tremolo on the drone
    const tremoloLFO = ctx.createOscillator();
    const tremoloGain = ctx.createGain();
    tremoloLFO.type = 'sine';
    tremoloLFO.frequency.value = 2.5;
    tremoloGain.gain.value = 0.03;
    tremoloLFO.connect(tremoloGain);
    tremoloGain.connect(droneGain.gain);

    drone.connect(droneGain);
    droneGain.connect(layer.layerGain);
    drone.start();
    tremoloLFO.start();
    layer.nodes.push(drone, droneGain, tremoloLFO, tremoloGain);

    // --- Second harmonic drone for richness ---
    const drone2 = ctx.createOscillator();
    drone2.type = 'sine';
    drone2.frequency.value = 82;
    const drone2Gain = ctx.createGain();
    drone2Gain.gain.value = 0.04;
    drone2.connect(drone2Gain);
    drone2Gain.connect(layer.layerGain);
    drone2.start();
    layer.nodes.push(drone2, drone2Gain);

    // --- Lava rumble (brown noise, very low-passed) ---
    const rumble = createNoiseSource(brownNoiseBuffer);
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 120;
    rumbleFilter.Q.value = 1;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.08;
    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(layer.layerGain);
    rumble.start();
    layer.nodes.push(rumble, rumbleFilter, rumbleGain);

    // --- Crackling fire (randomized short noise bursts) ---
    scheduleRandom(layer, 100, 500, () => {
      const freq = 2000 + Math.random() * 4000;
      const dur = 0.02 + Math.random() * 0.04;
      playNoiseBurst(layer, freq, 5, dur, 0.02 + Math.random() * 0.02, 'highpass');
    });

    // --- Hissing steam (occasional narrow-band noise) ---
    scheduleRandom(layer, 5000, 14000, () => {
      if (layer.destroyed || !ctx) return;
      const source = createNoiseSource(whiteNoiseBuffer);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1800 + Math.random() * 600;
      bp.Q.value = 8;
      const gain = ctx.createGain();
      gain.gain.value = 0;

      source.connect(bp);
      bp.connect(gain);
      gain.connect(layer.layerGain);

      const dur = 0.5 + Math.random() * 1.0;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
      gain.gain.setValueAtTime(0.04, now + dur * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      source.start(now);
      source.stop(now + dur + 0.05);
      layer.nodes.push(source, bp);

      source.onended = () => {
        [source, bp].forEach(n => {
          const idx = layer.nodes.indexOf(n);
          if (idx !== -1) layer.nodes.splice(idx, 1);
        });
      };
    });
  };

  // -------------------------------------------------------------------------
  // DARK CASTLE — Dread, ancient evil
  // -------------------------------------------------------------------------
  regionBuilders.dark_castle = (layer) => {
    // --- Organ-like drone (layered sine waves) ---
    const droneFreqs = [80, 120, 160];
    const droneVolumes = [0.05, 0.03, 0.02];
    droneFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.value = droneVolumes[i];

      // Very slow detuning for unease
      const detuneLFO = ctx.createOscillator();
      const detuneGain = ctx.createGain();
      detuneLFO.type = 'sine';
      detuneLFO.frequency.value = 0.05 + i * 0.02;
      detuneGain.gain.value = 3 + i * 2; // Subtle pitch wobble in cents
      detuneLFO.connect(detuneGain);
      detuneGain.connect(osc.detune);

      osc.connect(gain);
      gain.connect(layer.layerGain);
      osc.start();
      detuneLFO.start();
      layer.nodes.push(osc, gain, detuneLFO, detuneGain);
    });

    // --- Sub-bass presence (very low) ---
    const sub = createNoiseSource(brownNoiseBuffer);
    const subFilter = ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.value = 60;
    subFilter.Q.value = 1;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.04;
    sub.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(layer.layerGain);
    sub.start();
    layer.nodes.push(sub, subFilter, subGain);

    // --- Eerie whisper texture (modulated high noise, very quiet) ---
    const whisper = createNoiseSource(whiteNoiseBuffer);
    const whisperBP = ctx.createBiquadFilter();
    whisperBP.type = 'bandpass';
    whisperBP.frequency.value = 3000;
    whisperBP.Q.value = 3;
    const whisperGain = ctx.createGain();
    whisperGain.gain.value = 0.012;

    // Slow modulation for "breathing" whisper
    const whisperLFO = ctx.createOscillator();
    const whisperLFOGain = ctx.createGain();
    whisperLFO.type = 'sine';
    whisperLFO.frequency.value = 0.2;
    whisperLFOGain.gain.value = 0.008;
    whisperLFO.connect(whisperLFOGain);
    whisperLFOGain.connect(whisperGain.gain);

    // Sweep the whisper frequency slowly
    const whisperFreqLFO = ctx.createOscillator();
    const whisperFreqGain = ctx.createGain();
    whisperFreqLFO.type = 'sine';
    whisperFreqLFO.frequency.value = 0.07;
    whisperFreqGain.gain.value = 800;
    whisperFreqLFO.connect(whisperFreqGain);
    whisperFreqGain.connect(whisperBP.frequency);

    whisper.connect(whisperBP);
    whisperBP.connect(whisperGain);
    whisperGain.connect(layer.layerGain);
    whisper.start();
    whisperLFO.start();
    whisperFreqLFO.start();
    layer.nodes.push(whisper, whisperBP, whisperGain, whisperLFO, whisperLFOGain, whisperFreqLFO, whisperFreqGain);

    // --- Distant thunder (rare, slow decay) ---
    scheduleRandom(layer, 10000, 25000, () => {
      if (layer.destroyed || !ctx) return;
      const source = createNoiseSource(whiteNoiseBuffer);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 200 + Math.random() * 150;
      lp.Q.value = 0.8;
      const gain = ctx.createGain();
      gain.gain.value = 0;

      source.connect(lp);
      lp.connect(gain);
      gain.connect(layer.layerGain);

      const dur = 1.5 + Math.random() * 2;
      const now = ctx.currentTime;
      const peak = 0.06 + Math.random() * 0.03;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(peak * 0.4, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      source.start(now);
      source.stop(now + dur + 0.05);
      layer.nodes.push(source, lp);

      source.onended = () => {
        [source, lp].forEach(n => {
          const idx = layer.nodes.indexOf(n);
          if (idx !== -1) layer.nodes.splice(idx, 1);
        });
      };
    });

    // --- Occasional dissonant tone (very quiet, eerie) ---
    scheduleRandom(layer, 12000, 30000, () => {
      const freq = 200 + Math.random() * 100;
      playPip(layer, freq, 2 + Math.random() * 2, 0.012, Math.random() * 50 - 25);
    });
  };

  // =========================================================================
  // Visibility change handler
  // =========================================================================
  function handleVisibility() {
    if (!ctx) return;
    if (document.hidden) {
      ctx.suspend();
    } else if (!paused) {
      ctx.resume();
    }
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================
  return {
    /**
     * Initialize the audio context. Call on first user interaction.
     */
    init() {
      if (ctx) return;
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = masterVolume;
      masterGain.connect(ctx.destination);

      // Generate noise buffers
      whiteNoiseBuffer = createWhiteNoiseBuffer();
      brownNoiseBuffer = createBrownNoiseBuffer();

      // Handle tab visibility
      document.addEventListener('visibilitychange', handleVisibility);

      // Resume context if it was auto-suspended by browser policy
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    },

    /**
     * Crossfade to a new region's soundscape over 2 seconds.
     * @param {string} regionId — one of: rolling_hills, frost_valley, volcanic_isles, dark_castle
     */
    setRegion(regionId) {
      if (!ctx) this.init();
      if (regionId === currentRegion) return;

      // If there's already a layer fading out, destroy it immediately
      if (fadingLayer) {
        destroyLayer(fadingLayer);
        fadingLayer = null;
      }

      // Move current active layer to fading
      if (activeLayer) {
        fadingLayer = activeLayer;
        fadeGain(fadingLayer.layerGain, 0, CROSSFADE_MS);
        const ref = fadingLayer;
        setTimeout(() => {
          if (fadingLayer === ref) {
            destroyLayer(ref);
            fadingLayer = null;
          }
        }, CROSSFADE_MS + 100);
      }

      // Create and fade in new layer
      currentRegion = regionId;
      activeLayer = createLayer(regionId);
      fadeGain(activeLayer.layerGain, 1, CROSSFADE_MS);
    },

    /**
     * Set master volume (0 to 1).
     * @param {number} v
     */
    setVolume(v) {
      masterVolume = Math.max(0, Math.min(1, v));
      if (masterGain) {
        masterGain.gain.setValueAtTime(masterVolume, ctx.currentTime);
      }
    },

    /**
     * Pause all audio.
     */
    pause() {
      paused = true;
      if (ctx && ctx.state === 'running') {
        ctx.suspend();
      }
    },

    /**
     * Resume all audio.
     */
    resume() {
      paused = false;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    },

    /** Current region ID (read-only). */
    get region() { return currentRegion; },

    /** Whether audio is paused (read-only). */
    get isPaused() { return paused; }
  };

})();
