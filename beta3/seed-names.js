'use strict';
/* ============================================================
   STARSPELL seeded hunters (v0.64.0) — the boards' quiet company.
   A young game's daily board saying "no hunts recorded yet" reads
   as an empty world, so every board carries a handful of SEEDED
   hunters: deterministic, client-side ghosts merged into getBoard's
   rows (net.js). Nothing here is ever written to the RTDB — no
   registry claim, no players/ row, no presence — and every ghost is
   flagged (ghost:true, uid prefix 'sg_') so one switch removes them.

   THE LAWS (Skylar, 9/1):
   · Ghosts NEVER hold #1 when any real row exists — the best real
     score of the board is always the champion; ghosts above it are
     squeezed below it (and below a conservative ceiling when the
     board has no real rows at all).
   · Scores sit in the middle-to-lower band of the mode's real play
     (today's real reference: a daily loss ~150-400, a daily win
     ~650-1000, a quick win ~1010, campaign wins 3500-4700).
   · Same board key ⇒ same ghosts for every player, all day.
   · Ghosts arrive THROUGH the day (a board minutes after rollover
     holds one early hunter, not a full field).

   WHAT SKYLAR EDITS (all of it safe to hand-tune):
   · SS_SEED_NAMES — the whole cast. A plain string is an
     international handle (may appear on any board); { n, l } is a
     local (appears only on that language's daily + the weekly).
     Keep names ≤ 18 chars.
   · SS_SEED_WORDS — the "finest word" pools, per gameplay language.
     Every word must be REAL in that language's dictionary
     (tools/seed-check.mjs verifies) — accents only where the
     letters are real tiles (ñ, ç, ä/ö/ü), 4-8 letters.
   · SS_SEED_TUNE — how many ghosts and the score band per board.
   · SS_SEED.enabled = false (here) or ?ghosts=0 (a URL) turns the
     whole layer off — boards show only real rows again.

   Future boards (endless, hard) draw on the same layer: add a
   SS_SEED_TUNE entry and call SS_SEED.merge with the new kind.
   ============================================================ */

const SS_SEED_NAMES = [
  // ---- international (any board) ----
  'Maya', 'Jonas', 'Petra', 'Theo', 'Nadia', 'Elias', 'Rhea', 'Lena',
  'Marcus', 'Ivy', 'Owen', 'Felix', 'June', 'Nina', 'Tessa', 'Rowan',
  'Cole', 'Miriam', 'Ellie W', 'Sam K', 'Anna B', 'Joel R',
  'wordbird', 'quietowl', 'nightjar', 'inkwell', 'mothwing', 'starling',
  'fern', 'moss', 'wren', 'sable', 'juniper', 'clover', 'bramble',
  'lanternjack', 'riverstone', 'duskwatch', 'paperlark', 'snowmint',
  'kestrel42', 'mira07', 'jonah12', 'elm27', 'Astrid88', 'milo9',
  'hollyhock', 'gloaming', 'tidepool', 'birchbark', 'owlet', 'dovetail',
  'thistle', 'marigold', 'latereader', 'nightshift', 'halcyon', 'amberlyn',
  // ---- locals (their language's daily + the weekly) ----
  { n: 'Lucía', l: 'es' }, { n: 'Mateo', l: 'es' }, { n: 'Rocío', l: 'es' },
  { n: 'Marisol', l: 'es' }, { n: 'Andrés', l: 'es' }, { n: 'Ximena', l: 'es' },
  { n: 'Tomás G', l: 'es' }, { n: 'estrella99', l: 'es' },
  { n: 'Élodie', l: 'fr' }, { n: 'Marius', l: 'fr' }, { n: 'Colette', l: 'fr' },
  { n: 'Margaux', l: 'fr' }, { n: 'Thibault', l: 'fr' }, { n: 'Noé', l: 'fr' },
  { n: 'lucioles', l: 'fr' }, { n: 'Camille B', l: 'fr' },
  { n: 'João', l: 'pt' }, { n: 'Beatriz', l: 'pt' }, { n: 'Luana', l: 'pt' },
  { n: 'Tiago M', l: 'pt' }, { n: 'Inês', l: 'pt' }, { n: 'Duarte', l: 'pt' },
  { n: 'estrelinha', l: 'pt' }, { n: 'Rui', l: 'pt' },
  { n: 'Greta', l: 'de' }, { n: 'Matthias', l: 'de' }, { n: 'Frieda', l: 'de' },
  { n: 'Lorenz', l: 'de' }, { n: 'Anke', l: 'de' }, { n: 'Til', l: 'de' },
  { n: 'sternchen', l: 'de' }, { n: 'Jana K', l: 'de' },
];

// "finest word" pools — lowercase here, shown uppercase like every board row.
// Chosen from the real dictionaries (the harness re-proves membership).
const SS_SEED_WORDS = {
  en: ['moth', 'lark', 'fern', 'dusk', 'veil', 'glow', 'ember', 'river', 'stone',
    'cloud', 'birch', 'quiet', 'night', 'moons', 'frost', 'petal', 'spark',
    'hands', 'sound', 'water', 'light', 'paper', 'plume', 'story', 'amber',
    'silver', 'winter', 'meadow', 'forest', 'bright', 'dreams', 'willow',
    'garden', 'comet', 'lantern', 'whisper'],
  es: ['luna', 'cielo', 'noche', 'brisa', 'nubes', 'plata', 'campo', 'verde',
    'sueño', 'nieve', 'piedra', 'viento', 'sombra', 'tierra', 'fuego', 'flores',
    'camino', 'puente', 'madera', 'jardin', 'cristal', 'estrella', 'silencio',
    'palabras'],
  fr: ['lune', 'nuit', 'soir', 'brume', 'songe', 'lueur', 'ombre', 'fleur',
    'perle', 'verre', 'matin', 'orage', 'neige', 'hiver', 'foret', 'plume',
    'pierre', 'argent', 'etoile', 'jardin', 'chemin', 'source', 'riviere',
    'etoiles'],
  pt: ['lua', 'luar', 'noite', 'pedra', 'prata', 'vento', 'brisa', 'campo',
    'verde', 'terra', 'fogo', 'chuva', 'nuvem', 'neve', 'sereno', 'flores',
    'noites', 'ventos', 'sonhos', 'aurora', 'estrela', 'caminho', 'madeira',
    'inverno', 'cristal', 'silencio'],
  de: ['mond', 'glas', 'baum', 'nacht', 'stern', 'nebel', 'wiese', 'funke',
    'licht', 'regen', 'wolke', 'blume', 'traum', 'feuer', 'perle', 'abend',
    'silber', 'garten', 'winter', 'quelle', 'sterne', 'nachts', 'brücke',
    'laterne'],
};

// How many ghosts a board carries and where their scores live. `hi` doubles
// as the no-real-rows ceiling: a decent winning run always clears it.
const SS_SEED_TUNE = {
  daily: { span: 'day', min: 6, max: 10, lo: 120, hi: 560 },
  weekly: { span: 'week', min: 12, max: 18, lo: 150, hi: 640 },
};

const SS_SEED = (() => {
  const LANGS = ['en', 'es', 'fr', 'pt', 'de'];
  const PREFIX = 'sg_';
  const DAY = 86400000, WEEK = 7 * DAY;

  // ---- deterministic randomness (FNV-1a → mulberry32) ----
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rngFor(str) {
    let a = hash(str) || 1;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const frac = (str) => hash(str) / 4294967296;

  // display-name fold for dedupe (net.js nameKey's spirit; loads before net.js)
  function fold(n) {
    let s = String(n == null ? '' : n);
    try { s = s.normalize('NFKC'); } catch (e) { }
    return s.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // ISO week of a UTC ms — must agree with net.js weekKey (same math)
  function isoWeek(ms) {
    const t = new Date(ms);
    const d = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const wk = Math.ceil(((d - y0) / DAY + 1) / 7);
    return d.getUTCFullYear() + '-W' + (wk < 10 ? '0' : '') + wk;
  }
  // the week a board belongs to: a weekly board's key IS the week; a daily
  // key names its own date
  function weekOf(kind, key) {
    if (kind !== 'daily') return String(key);
    const s = String(key);
    return isoWeek(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)));
  }
  // when the board's window opens (ghost arrivals are spread from here)
  function spanStart(kind, key, now) {
    const T = SS_SEED_TUNE[kind];
    if (T && T.span === 'week') {
      const d = new Date(now);
      const day0 = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      return day0 - ((d.getUTCDay() || 7) - 1) * DAY;
    }
    const s = String(key);
    return Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
  }

  // a name sits EITHER on this week's weekly OR among the week's dailies —
  // never both, so the two boards can never contradict each other
  function weeklyBound(name, wk) { return frac('wk:' + wk + ':' + name) < 0.30; }

  function candidates(kind, key, lang) {
    const wk = weekOf(kind, key);
    const out = [];
    for (const e of SS_SEED_NAMES) {
      const nm = typeof e === 'string' ? e : e.n;
      const tag = typeof e === 'string' ? null : e.l;
      if (!nm) continue;
      const wkBound = weeklyBound(nm, wk);
      if (kind !== 'daily') { if (wkBound) out.push({ nm, tag }); continue; }
      if (wkBound) continue;
      if (tag) { if (tag === lang) out.push({ nm, tag }); continue; }
      // untagged names spread across the five daily boards, one board per day
      if (LANGS[Math.floor(frac('day:' + key + ':' + nm) * LANGS.length)] === lang) out.push({ nm, tag });
    }
    return out;
  }

  function pickWord(lang, score, rnd, used) {
    const pool = SS_SEED_WORDS[lang] || SS_SEED_WORDS.en;
    const lens = score < 220 ? [4, 5] : score < 420 ? [5, 6] : [6, 7, 8];
    let cands = pool.filter((w) => lens.indexOf(w.length) >= 0 && !used[w]);
    if (!cands.length) cands = pool.filter((w) => !used[w]);
    if (!cands.length) cands = pool;
    const w = cands[Math.floor(rnd() * cands.length)] || 'ember';
    used[w] = 1;
    return w.toUpperCase();
  }

  // the board's full-day cast, deterministic from its key (memoized)
  const casts = {};
  function castFor(kind, key, lang) {
    const T = SS_SEED_TUNE[kind];
    if (!T) return [];
    const tag = kind + ':' + key + ':' + (lang || '');
    if (casts[tag]) return casts[tag];
    const cand = candidates(kind, key, lang);
    const rnd = rngFor('cast:' + tag);
    for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = cand[i]; cand[i] = cand[j]; cand[j] = t; }
    const n = Math.min(cand.length, T.min + Math.floor(rnd() * (T.max - T.min + 1)));
    const start = spanStart(kind, key, Date.now());
    const span = T.span === 'week' ? WEEK : DAY;
    const usedWords = {}, usedScores = {}, out = [];
    for (let i = 0; i < n; i++) {
      const nm = cand[i].nm;
      const g = rngFor('g:' + tag + ':' + nm);
      // arrivals: one early hunter, then a spread through the window (the
      // weekly front-loads — a fresh board draws its crowd early)
      let f;
      if (i === 0) f = ((T.span === 'week' ? 240 + g() * 1800 : 60 + g() * 150) * 1000) / span;
      else if (T.span === 'week') f = Math.pow((i + 0.9 * g()) / n, 1.45);
      else f = Math.pow((i + 0.9 * g()) / n, 1.25);   // rollover is evening in the Americas — the crowd leans early
      const at = Math.round(start + Math.min(0.995, f) * span + g() * 40000);
      // scores: middle-to-lower band, and never more than a run this early
      // in the window could have earned
      let score = Math.round(T.lo + (T.hi - T.lo) * Math.pow(g(), 1.35));
      score = Math.min(score, Math.max(25, Math.floor(25 + ((at - start) / 60000) * 40)));
      while (usedScores[score] && score > 5) score--;
      usedScores[score] = 1;
      out.push({
        id: PREFIX + hash('id:' + nm).toString(36),
        name: nm, score,
        word: pickWord(kind === 'daily' ? lang : (cand[i].tag || 'en'), score, g, usedWords),
        at, ghost: true,
        rating: 880 + Math.floor(frac('rt:' + nm) * 280),
        rhide: frac('rh:' + nm) < 0.22,
      });
    }
    out.sort((a, b) => a.at - b.at);
    return (casts[tag] = out);
  }

  return {
    enabled: !/[?&]ghosts=0(&|$)/.test((() => { try { return location.search; } catch (e) { return ''; } })()),
    PREFIX,
    isGhost(id) { return typeof id === 'string' && id.indexOf(PREFIX) === 0; },
    // the ghosts visible on a board at `now` (arrival-gated day cast)
    ghosts(kind, key, lang, now) {
      const t = now == null ? Date.now() : now;
      return castFor(kind, key, lang).filter((g) => g.at <= t).map((g) => Object.assign({}, g));
    },
    /* merge real rows with the board's ghosts. `rows` are getBoard's mapped
       real entries; ghosts adapt so the best real row ALWAYS keeps #1:
       any ghost at/above it is squeezed strictly below (dropped if the
       squeeze can't fit), and with no real rows the tune's `hi` is the
       ceiling by construction. `selfName` drops any ghost wearing the
       viewing player's own name. */
    merge(rows, kind, key, lang, now, selfName) {
      try {
        if (!this.enabled || !SS_SEED_TUNE[kind]) return rows;
        let g = this.ghosts(kind, key, lang, now);
        const taken = {};
        for (const r of rows) taken[fold(r.name)] = 1;
        if (selfName) taken[fold(selfName)] = 1;
        g = g.filter((x) => !taken[fold(x.name)]);
        let bestReal = -1;
        for (const r of rows) if ((r.score | 0) > bestReal) bestReal = r.score | 0;
        if (bestReal >= 0) {
          // ghosts stay STRICTLY below the best real score. An offender is
          // remapped proportionally from the tune band into [floor, cap-1] —
          // per-ghost stable (a later arrival never moves it) and naturally
          // spread, never a consecutive wall right under the champion.
          const T = SS_SEED_TUNE[kind], cap = bestReal;
          const fLo = Math.max(2, Math.ceil(cap * 0.45)), fHi = cap - 1;
          const held = {};
          for (const x of g) if (x.score < cap) held[x.score] = 1;
          const kept = [];
          for (const x of g.slice().sort((a, b) => b.score - a.score)) {
            if (x.score < cap) { kept.push(x); continue; }
            let s = Math.floor(fLo + ((x.score - T.lo) / Math.max(1, T.hi - T.lo)) * (fHi - fLo));
            s = Math.min(fHi, Math.max(fLo, s));
            while (s >= fLo && held[s]) s--;
            if (s < fLo || s < 2) continue;            // no room left — one fewer hunter
            held[s] = 1;
            x.score = s;
            kept.push(x);
          }
          g = kept.sort((a, b) => a.at - b.at);
        }
        const merged = rows.concat(g);
        merged.sort((a, b) => b.score - a.score);      // stable: a tied real row stays ahead
        return merged;
      } catch (e) { return rows; }
    },
  };
})();
