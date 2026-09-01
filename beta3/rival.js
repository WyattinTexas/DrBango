'use strict';
/* ============================================================
   STARSPELL rival engine — a duelist who comes in through the
   same door as any stranger.

   SS_RIVAL.spawn({ code, rating }) seats one mage in the room at
   `code` and plays the duel out over the ordinary room protocol:
   the same seat shape a phone writes, the same cast push, the
   same hp transaction on the target, the same seat update and
   turn handoff, the same `sigils` list, the same onDisconnect
   `gone`. VsBattle reads room snapshots and casts and nothing
   else, so it cannot tell — and neither can anyone reading the
   database, which is public and client-authoritative: nothing
   here writes a flag, a node or a field a person's client would
   not. The only thing that exists anywhere is an ordinary seat.

   The skill dial is a TARGET RATING, not a difficulty enum. Each
   turn the engine searches its own board (a private copy dealt
   from the room's seed by its own RNG — it must never touch the
   game's rng(), which is dealing the human's board in this very
   page), then chooses under skill-scaled constraints: how long a
   word it can "see", how often it misses the best word and
   settles for its 3rd–5th, whether a poor board is worth a SCRY.
   Higher rating → measurably higher damage per cast; the harness
   (tools/rival-check.mjs) pins that monotonicity over seeded
   boards through SS_RIVAL.sim().

   Pacing is a person's: a hesitation before the first move, a
   think that grows with the word and the board's difficulty,
   log-normal jitter so no two casts are the same, taps at a
   thumb's speed, a rush when the clock runs low. Never under
   ~1.6s, never past the mode's stall limit.

   The queue (versus.js, VsBattle.quietSky): a searcher the sky has
   not answered in ~12s is met by one of THE CIRCLE below — a mage
   of this device's acquaintance with an ordinary profile row, rated
   a believable distance from the player, arriving through the very
   same door. Dev seam: ?botduel=<rating>[&vsmode=turns|timed]
   [&seed=N] seals a room and seats a rival of that rating.
   ============================================================ */

const SS_RIVAL = (() => {
  /* ---------- a private RNG: the same mulberry32 the board uses, on its own
     stream. Seeded with the room's seed it deals the IDENTICAL opening board
     a remote client would; seeded with the seat it jitters the pacing. */
  function mkRng(seed) {
    let s = seed | 0;
    const r = () => {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.gauss = () => {   // Box–Muller, one sample
      const u = Math.max(1e-9, r()), v = r();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    return r;
  }
  const clamp01 = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  /* ---------- the skill model: everything a rating buys ----------
     s runs 0 at the rating floor (600) to 1 at 1600 and a little past it.
     - reach: the word length this mage comfortably sees; longer words are
       "known" with a probability that falls off past it (a fixed hash per
       word, so the same mage never knows ONYX one turn and forgets it next)
     - finds: how many words the mage spots on a board (it casts the best
       of those — the real ceiling on its damage)
     - miss: how often the best word it found is still passed over
     - scry: how eagerly a poor board is rerolled (timed mode; a turn-mode
       scry costs the turn, so it takes a truly dead board)
     - sigilSense: how often the strongest sigil is chosen over a random one
     - tempo: think-time multiplier (a strong player reads a board faster)   */
  function profile(rating) {
    const r = Number.isFinite(rating) ? rating : (typeof SS_RATING !== 'undefined' ? SS_RATING.BASE : 1000);
    const s = clamp01((r - 600) / 1000, 0, 1.2);
    return {
      rating: r, s,
      reach: 3 + 4.5 * s,                   // 600: 3 · 1000: 4.8 · 1600: 7.5
      finds: 2 + 20 * s * s,                // words spotted per board: 600: 2 · 1000: 5 · 1200: 9 · 1600: 22
      miss: clamp01(0.05 + 0.35 * (1 - s), 0.04, 0.5),
      scry: clamp01(0.65 * s, 0, 0.75),
      scryBar: 6 + 10 * s,                  // a timed board whose best word is under this is "poor"
      sigilSense: clamp01(0.25 + 0.7 * s, 0, 1),
      tempo: clamp01(1.3 - 0.45 * s, 0.75, 1.4),
    };
  }
  // a word's "knowability" to this mage — deterministic per word
  function wordHash(w) { let h = 2166136261; for (let i = 0; i < w.length; i++) { h ^= w.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; }
  function knows(prof, word) {
    const over = word.length - prof.reach;
    if (over <= 0) return true;
    const p = clamp01(1 - over * 0.38, 0.04, 1);
    return wordHash(word) < p;
  }

  /* ---------- the board, as a remote client deals it ----------
     Mirrors VsBattle.fillBoard / tryCast / expireSpecials / scry exactly:
     first deal needs 5 vowels, a bonus tile drops on the FIRST new slot only,
     unspent bonuses drain to plain before the next reward, 7+ letters forge a
     star tile, 5+ a gilded one (STAR FORGE lifts either to a star).          */
  const VS_OK_SIGILS = ['quill', 'choir', 'runes', 'forge', 'longbow', 'blood'];
  const SIGIL_WORTH = { blood: 9, longbow: 8, forge: 6, choir: 5, runes: 4, quill: 4 };
  const LEN_M = [0, 0, 0.6, 1, 1.15, 1.35, 1.6, 1.9, 2.3];
  function tileVal(pack, ch, tier) { return (pack.vals[ch] || pack.vals[ch[0]] || 1) + (tier === 1 ? 6 : 0); }
  function damage(pack, tiles, sigils) {
    const has = (id) => sigils.includes(id);
    let base = 0, starMult = 1, letters = 0;
    for (const s of tiles) {
      // letter bonuses ride the shared data-driven lookup (SS_SIGILS `lb` via
      // game.js), fed THIS room's vowels — the mage's math tracks the game's
      base += tileVal(pack, s.ch, s.tier) + ssSigilLetterAdd(sigils, s.ch, pack.vowels);
      if (s.tier === 2) starMult = 1.5;
      letters += s.ch.length;
    }
    let dmg = base * (LEN_M[Math.min(letters, 8)] || 2.3) * starMult;
    if (has('quill')) dmg += 4;
    if (has('longbow') && letters >= 6) dmg += 12;
    if (has('blood')) dmg *= 1.25;
    return Math.round(dmg);
  }
  class Board {
    constructor(pack, seed) {
      this.pack = pack; this.bag = ssBagArr(pack); this.rng = mkRng(seed);
      this.slots = new Array(16).fill(null); this.pendingTier = 0; this.sigils = [];
      this.fill();
    }
    vowels() { return this.slots.filter((s) => s && this.pack.vowels.includes(s.ch[0])).length; }
    fill() {
      for (let i = 0; i < 16; i++) {
        if (this.slots[i]) continue;
        let ch = this.rng.pick(this.bag);
        if (this.vowels() < 5 && !this.pack.vowels.includes(ch)) ch = this.rng.pick(['a', 'e', 'i', 'o', 'u']);
        ch = this.pack.digraph[ch] || ch;
        const tier = this.pendingTier || 0;
        this.pendingTier = 0;
        this.slots[i] = { ch, tier };
      }
    }
    cast(idx) {
      const letters = idx.reduce((a, i) => a + this.slots[i].ch.length, 0);
      for (const i of idx) this.slots[i] = null;
      for (const s of this.slots) if (s) s.tier = 0;   // use it or lose it
      if (letters >= 7) this.pendingTier = 2; else if (letters >= 5) this.pendingTier = 1;
      if (this.pendingTier && this.sigils.includes('forge')) this.pendingTier = 2;
      this.fill();
    }
    scry() { for (let i = 0; i < 16; i++) this.slots[i] = null; this.fill(); }
    letters() { return this.slots.map((s) => (s ? s.ch : '·')).join(' '); }
  }

  /* ---------- the search: every word on the board, best damage per word ---------- */
  const tries = {};
  function trie(lang, words) {
    if (!tries[lang]) {
      const root = {};
      for (const w of words) {
        if (w.length > 8) continue;
        let n = root;
        for (const ch of w) n = n[ch] || (n[ch] = {});
        n.$ = true;
      }
      tries[lang] = root;
    }
    return tries[lang];
  }
  function candidates(board, root) {
    const tiles = board.slots.map((s, i) => ({ i, s })).filter((x) => x.s);
    const best = new Map();   // word → {word, idx, dmg, letters}
    const used = new Array(tiles.length).fill(false);
    const pick = [];
    const dive = (node, word) => {
      if (node.$ && pick.length >= 2) {
        const ts = pick.map((k) => tiles[k].s);
        const dmg = damage(board.pack, ts, board.sigils);
        const cur = best.get(word);
        if (!cur || dmg > cur.dmg) best.set(word, { word, idx: pick.map((k) => tiles[k].i), dmg, letters: word.length });
      }
      if (pick.length >= 8) return;
      const seen = new Set();
      for (let k = 0; k < tiles.length; k++) {
        if (used[k]) continue;
        const key = tiles[k].s.ch + ':' + tiles[k].s.tier;
        if (seen.has(key)) continue;
        seen.add(key);
        let n = node, ok = true;
        for (const ch of tiles[k].s.ch) { n = n[ch]; if (!n) { ok = false; break; } }
        if (!ok) continue;
        used[k] = true; pick.push(k);
        dive(n, word + tiles[k].s.ch);
        used[k] = false; pick.pop();
      }
    };
    dive(root, '');
    return [...best.values()].sort((a, b) => b.dmg - a.dmg || a.word.localeCompare(b.word));
  }

  /* ---------- the choice: what this mage casts from what the board holds.
     ctx: { mode, scryOk, rush }. Returns { cast: cand } or { scry: true }.  */
  function choose(cands, prof, rnd, ctx) {
    const known = cands.filter((c) => knows(prof, c.word));
    const pool = known.length ? known : cands.slice(-3);   // a mage who "knows" nothing still finds a small word
    if (!pool.length) return { scry: true };
    // a person does not see every word on a board — they FIND a handful and
    // take the best of those. The handful is the skill: a few words for a
    // novice, most of the board for a master (prof.finds, jittered)
    const n = Math.min(pool.length, Math.max(1, Math.round(prof.finds * (0.7 + rnd() * 0.6))));
    const found = [];
    if (n >= pool.length) found.push(...pool);
    else {
      const left = pool.slice();
      while (found.length < n) found.push(left.splice(Math.floor(rnd() * left.length), 1)[0]);
      found.sort((a, b) => b.dmg - a.dmg);
    }
    const bestD = found[0].dmg;
    if (ctx.scryOk && !ctx.rush) {
      if (ctx.mode === 'timed' && bestD < prof.scryBar && rnd() < prof.scry) return { scry: true };
      if (ctx.mode !== 'timed' && bestD < 4 + 3 * prof.s && rnd() < prof.scry * 0.4) return { scry: true };
    }
    let k = 0;
    if (found.length > 1 && rnd() < prof.miss) k = 1 + Math.floor(rnd() * Math.min(4, found.length - 1));   // settles for the 2nd–5th it found
    const cast = found[k];
    return { cast, rank: pool.indexOf(cast), bestD, seen: pool.length, found: found.length };
  }
  function chooseSigil(offer, prof, rnd) {
    if (!offer.length) return null;
    if (rnd() < prof.sigilSense) return [...offer].sort((a, b) => (SIGIL_WORTH[b] | 0) - (SIGIL_WORTH[a] | 0))[0];
    return rnd.pick(offer);
  }

  /* ---------- pacing: how long a person takes ----------
     think = read the board (1.4s + 0.22s per letter of the word found,
     +0.9s on a hard board, +hesitation on the opening move) × tempo ×
     log-normal jitter, then the taps themselves (a thumb at 190–330ms a
     tile) and the press on CAST. Clamped to ≥ MIN_MS and ≤ the mode's stall
     limit; under a running-out clock the read collapses to a rush.        */
  const PACE = { MIN_MS: 1600, MAX_TURNS: 15000, MAX_TIMED: 11000, FIRST_MIN: 2200, RUSH_AT: 15000 };
  function thinkMs(prof, pick, rnd, ctx) {
    const letters = pick && pick.cast ? pick.cast.letters : 3;
    let read = 1400 + 220 * letters;
    if (pick && pick.cast && pick.cast.dmg < 8) read += 900;               // a hard board takes longer to read
    if (pick && pick.scry) read += 500;                                    // …and giving up on it, too
    if (ctx && ctx.first) read += 900 + rnd() * 1900;                     // the opening hesitation
    read *= prof.tempo * Math.exp(rnd.gauss() * 0.32);
    const taps = letters * (190 + rnd() * 140) + 260 + rnd() * 220;
    let t = read + taps;
    const cap = ctx && ctx.mode === 'timed' ? PACE.MAX_TIMED : PACE.MAX_TURNS;
    if (ctx && ctx.rush) t = Math.min(t, 2600 + rnd() * 900);
    t = Math.min(cap, Math.max(PACE.MIN_MS + (ctx && ctx.first ? PACE.FIRST_MIN - PACE.MIN_MS : 0), t));
    return Math.round(t);
  }

  /* ---------- the pack a room plays in ---------- */
  function packFor(lang) {
    const ok = SS_PACKS[lang] && SS_DICT.ready(lang);
    const pack = ok ? SS_PACKS[lang] : SS_PACKS.en;
    return { pack, words: SS_DICT.set(pack.lang), root: trie(pack.lang, SS_DICT.set(pack.lang)) };
  }

  /* ---------- sim: the brain alone, no network, for the harness ----------
     Deals `seeds.length` boards, plays `casts` casts on each (no scry — the
     brain's reroll is a pacing/risk call, the pin is the words it chooses),
     returns mean damage per cast and the per-cast distribution.            */
  function sim(rating, seeds, casts, mode) {
    const prof = profile(rating);
    const { pack, root } = packFor('en');
    const dmgs = [], lens = [], ranks = [];
    let scrys = 0, turns = 0;
    for (const seed of seeds) {
      const b = new Board(pack, seed);
      const rnd = mkRng(seed ^ 0x51a7);
      for (let c = 0; c < (casts || 6); c++) {
        const cands = candidates(b, root);
        const pick = choose(cands, prof, rnd, { mode: mode || 'turns', scryOk: true, rush: false });
        turns++;
        if (pick.scry) { scrys++; b.scry(); continue; }
        dmgs.push(pick.cast.dmg); lens.push(pick.cast.letters); ranks.push(pick.rank);
        b.cast(pick.cast.idx);
        if (dmgs.length % 3 === 0) {
          const sg = chooseSigil(VS_OK_SIGILS.filter((s) => !b.sigils.includes(s)).slice(0, 3), prof, rnd);
          if (sg) b.sigils.push(sg);
        }
      }
    }
    const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
    return { rating, s: prof.s, n: dmgs.length, mean: mean(dmgs), meanLen: mean(lens), meanRank: mean(ranks), scrys, turns };
  }
  // pacing samples for the harness: N think times at a rating/mode
  function paceSample(rating, mode, n, first) {
    const prof = profile(rating), rnd = mkRng(rating * 7919 + (first ? 1 : 0));
    const out = [];
    for (let i = 0; i < n; i++) {
      const letters = 2 + Math.floor(rnd() * 7);
      out.push(thinkMs(prof, { cast: { letters, dmg: 4 + rnd() * 40 } }, rnd, { mode, first: !!first, rush: false }));
    }
    return out;
  }

  /* ============================================================
     THE DUELIST — one seat, one room, one duel (and its rematches)
     ============================================================ */
  const log = [];   // dev-visible transcript (in page memory only; window.__ssRivalLog)
  function note(ev, x) { const e = Object.assign({ t: Date.now(), ev }, x || {}); log.push(e); if (log.length > 400) log.shift(); }
  try { window.__ssRivalLog = log; } catch (e) { }

  class Duelist {
    constructor(o) {
      this.uid = o.uid || SSNET.mintUid();
      this.name = o.name || SSNET.mintName();
      this.prof = profile(o.rating);
      this.rnd = mkRng((o.rating | 0) * 131 + (Date.now() & 0xffff));
      // the seat's rating sits near the target, never ON it — a person's
      // number is never a round hundred for long
      this.rating = Number.isFinite(o.seatRating) ? o.seatRating : Math.max(SS_RATING.FLOOR, Math.round(o.rating + this.rnd.gauss() * 14));
      this.persona = o.persona || null;   // one of the circle: its profile row follows the duel
      this.timers = new Set();
      this.alive = true;
      this.duels = 0;
      this.db = SSNET.side('rival');   // my own door to the sky — see SSNET.side
      if (!this.db) { this.alive = false; note('nosky'); return; }
      // a rival arrives a breath after the door opens, never in the same instant
      this.after(o.delay == null ? 1200 + this.rnd() * 1800 : o.delay, () => this.attach(o.code));
    }
    after(ms, fn) {
      const t = setTimeout(() => { this.timers.delete(t); if (this.alive) { try { fn(); } catch (e) { note('error', { msg: String(e && e.message || e) }); } } }, ms);
      this.timers.add(t);
      return t;
    }
    seat(n) {
      return { name: this.name, hp: VS_HP, seat: n, casts: 0, dealt: 0, gone: false, joinedAt: Date.now(), rating: this.rating, rhide: 0 };
    }
    // the same seat-claim transaction a newcomer's client runs
    async join(code) {
      try {
        const r = await this.db.txn('mp/rooms/' + code, (cur) => {
          if (!cur) return cur;
          if (cur.status !== 'waiting') return cur;
          const players = cur.players || {};
          if (players[this.uid]) return cur;
          if (Object.keys(players).length >= VS_MAX[cur.mode]) return cur;
          const seats = Object.values(players).map((p) => p.seat);
          let n = 0;
          while (seats.includes(n)) n++;
          players[this.uid] = this.seat(n);
          return { ...cur, players };
        });
        this.lastJoin = { committed: r.committed, status: r.value && r.value.status, seats: r.value && r.value.players ? Object.keys(r.value.players) : null };
        return !!(r.value && r.value.players && r.value.players[this.uid]);
      } catch (e) { this.lastJoin = { err: String(e && e.message || e) }; return false; }
    }
    async attach(code) {
      this.detach();
      this.code = code;
      this.room = null; this.board = null; this.state = 'join';
      this.pending = null; this.scryAt = 0; this.turnSince = 0; this.answered = false;
      // one of the circle answers under a name the registry knows is its own
      if (this.persona) { await claimCircleName(this.db, this.persona); if (!this.alive) return; this.name = this.persona.name; }
      if (!(await this.join(code))) { note('cold', Object.assign({ code }, this.lastJoin)); this.stop(); return; }
      if (!this.alive) return;
      this.duels++;
      note('seated', { code, name: this.name, rating: this.rating, target: this.prof.rating });
      if (this.persona && this.duels === 1) syncCircleRow(this.db, this.persona, { rating: this.rating });
      this.roomRef = this.db.ref('mp/rooms/' + code);
      this.meRef = this.db.ref('mp/rooms/' + code + '/players/' + this.uid);
      if (!this.roomRef || !this.meRef) { this.stop(); return; }
      try { this.meRef.child('gone').onDisconnect().set(true); } catch (e) { }
      this.state = 'wait';
      this.onRoomCb = (snap) => { try { this.onRoom(snap.val()); } catch (e) { note('error', { msg: String(e && e.message || e) }); } };
      this.roomRef.on('value', this.onRoomCb);
    }
    detach() {
      if (this.roomRef && this.onRoomCb) this.roomRef.off('value', this.onRoomCb);
      this.roomRef = null; this.meRef = null; this.onRoomCb = null;
      for (const t of this.timers) clearTimeout(t);
      this.timers.clear();
    }
    stop() {
      if (!this.alive) return;
      this.alive = false;
      try { if (this.meRef) this.meRef.child('gone').onDisconnect().cancel(); } catch (e) { }
      this.detach();
      note('gone', { code: this.code });
    }
    me() { return this.room && this.room.players ? this.room.players[this.uid] : null; }
    foes() {
      return Object.entries((this.room && this.room.players) || {})
        .filter(([id, p]) => id !== this.uid && p.hp > 0 && !p.gone).map(([id, p]) => ({ id, ...p }));
    }
    alivePlayers() {
      return Object.entries((this.room && this.room.players) || {})
        .filter(([, p]) => p.hp > 0 && !p.gone).map(([id, p]) => ({ id, ...p }));
    }
    myTurn() {
      if (!this.room || this.room.status !== 'active') return false;
      if (this.room.mode === 'timed') return true;
      return this.room.turnUid === this.uid;
    }

    onRoom(room) {
      if (!this.alive) return;
      if (!room) { this.stop(); return; }
      const prev = this.room;
      this.room = room;
      if (room.status === 'waiting') {
        if (!(room.players || {})[this.uid]) { this.stop(); return; }
        // the host walked out and the key passed to me: a stranger's room is
        // not mine to keep — the last one out seals it, like any client's LEAVE
        if (room.hostUid === this.uid) { this.leave(); return; }
        return;
      }
      if (room.status === 'active') {
        if (!this.board) { this.begin(); return; }
        if (this.state === 'play') this.consider();
        this.checkEnd();
        return;
      }
      if (room.status === 'done') {
        if (this.state !== 'done') {
          this.state = 'done';
          for (const t of this.timers) clearTimeout(t);
          this.timers.clear();
          note('done', { code: this.code, winner: room.winnerUid === this.uid ? 'me' : 'them', casts: (this.me() || {}).casts | 0, dealt: (this.me() || {}).dealt | 0 });
          if (this.persona) this.settle(room);
          // a person lingers on the end screen a while, then goes home
          this.after(60000 + this.rnd() * 20000, () => this.stop());
        }
        if (room.rematch && !this.answered) this.answerRematch(room.rematch);
      }
    }

    // the duel begins: the room's tongue, the shared seed, the opening hesitation
    begin() {
      const lang = (this.room.lang && SS_PACKS[this.room.lang]) ? this.room.lang : 'en';
      if (!SS_DICT.ready(lang) && (this.dictTries | 0) < 40) {
        this.dictTries = (this.dictTries | 0) + 1;
        SS_DICT.load(lang);
        this.after(250, () => { if (this.room && this.room.status === 'active' && !this.board) this.begin(); });
        return;
      }
      const pk = packFor(lang);
      this.pack = pk.pack; this.root = pk.root;
      this.board = new Board(this.pack, this.room.seed || 1);
      this.state = 'play';
      this.first = true;
      // the human is still rising through the sky; nobody casts before they land
      this.readyAt = (this.room.startedAt || Date.now()) + ASC.TOTAL_MS;
      note('begin', { code: this.code, mode: this.room.mode, lang, board: this.board.letters() });
      this.consider();
    }

    // something changed — is it time to think?
    consider() {
      if (this.state !== 'play' || this.pending || this.busy) return;
      if (!this.myTurn()) { this.turnSince = 0; return; }
      const me = this.me();
      if (!me || me.hp <= 0 || me.gone) return;
      if (!this.turnSince) this.turnSince = Date.now();
      const timed = this.room.mode === 'timed';
      const left = timed ? VS_TIME_MS - (Date.now() - this.room.startedAt) : Infinity;
      if (timed && left <= 0) return;
      const ctx = { mode: this.room.mode, first: this.first, rush: timed && left < PACE.RUSH_AT,
        scryOk: timed ? Date.now() >= this.scryAt : true };
      const cands = candidates(this.board, this.root);
      const pick = choose(cands, this.prof, this.rnd, ctx);
      let wait = thinkMs(this.prof, pick, this.rnd, ctx);
      // the first read starts when the human lands, not when the seal flipped
      wait = Math.max(wait, this.readyAt - Date.now() + PACE.MIN_MS);
      if (timed) wait = Math.min(wait, Math.max(PACE.MIN_MS, left - 400));
      this.pending = { pick, at: Date.now() + wait, ctx };
      note('think', { word: pick.cast ? pick.cast.word : (pick.scry ? '(scry)' : '—'), dmg: pick.cast ? pick.cast.dmg : 0, rank: pick.rank | 0, of: pick.seen | 0, best: pick.bestD | 0, ms: wait, first: !!ctx.first, rush: !!ctx.rush });
      this.after(wait, () => this.act());
    }

    async act() {
      const p = this.pending;
      this.pending = null;
      if (!p || this.state !== 'play' || !this.myTurn() || this.busy) return;
      const me = this.me();
      if (!me || me.hp <= 0 || me.gone) return;
      this.first = false;
      const timed = this.room.mode === 'timed';
      if (timed && VS_TIME_MS - (Date.now() - this.room.startedAt) <= 0) return;
      // busy holds every snapshot-driven consider() off until the writes land —
      // the word chosen was read off THIS board, and only our own casts move it
      this.busy = true;
      try {
        if (p.pick.scry) await this.doScry();
        else await this.doCast(p.pick.cast);
      } finally { this.busy = false; }
      this.turnSince = 0;
      this.checkEnd();
      if (this.state === 'play') this.consider();
    }
    nextTurn() {
      const alive = this.alivePlayers().sort((a, b) => a.seat - b.seat);
      const idx = alive.findIndex((p) => p.id === this.uid);
      let next = this.uid;
      for (let i = 1; i <= alive.length; i++) {
        const cand = alive[(idx + i) % alive.length];
        if (cand.hp > 0 && !cand.gone) { next = cand.id; break; }
      }
      return next;
    }
    async doScry() {
      this.board.scry();
      note('scry', { board: this.board.letters() });
      if (this.room.mode === 'timed') { this.scryAt = Date.now() + 6000; return; }
      try { await this.roomRef.update({ turnUid: this.nextTurn(), turnCount: (this.room.turnCount | 0) + 1 }); } catch (e) { }
    }
    async doCast(c) {
      const foes = this.foes().sort((a, b) => b.hp - a.hp);
      const target = foes[0];
      if (!target) return;
      const word = c.word.toUpperCase();
      const dmg = c.dmg;
      try {
        // authoritative writes, in a client's order: the cast, the wound, my seat, the turn
        await this.db.ref('mp/rooms/' + this.code + '/casts').push({ uid: this.uid, name: this.name, word, dmg, target: target.id, at: Date.now() });
        await this.db.txn('mp/rooms/' + this.code + '/players/' + target.id + '/hp', (cur) => Math.max(0, (cur == null ? VS_HP : cur) - dmg));
        const myCasts = ((this.me() || {}).casts | 0) + 1;
        await this.meRef.update({ lastWord: word, casts: myCasts, dealt: ((this.me() || {}).dealt | 0) + dmg });
        if (this.room.mode !== 'timed') await this.roomRef.update({ turnUid: this.nextTurn(), turnCount: (this.room.turnCount | 0) + 1 });
        this.board.cast(c.idx);
        note('cast', { word, dmg, letters: c.letters, target: target.name, board: this.board.letters() });
        // every 3rd cast: the pick-3, read for a few seconds before choosing
        if (myCasts % 3 === 0) {
          const avail = VS_OK_SIGILS.filter((s) => !this.board.sigils.includes(s));
          const offer = [];
          while (offer.length < 3 && avail.length) offer.push(avail.splice(Math.floor(this.rnd() * avail.length), 1)[0]);
          const sg = chooseSigil(offer, this.prof, this.rnd);
          if (sg) {
            this.board.sigils.push(sg);
            const wait = 1400 + this.rnd() * 2600;
            this.sigilUntil = Date.now() + wait;
            await new Promise((res) => this.after(wait, res));
            if (!this.alive) return;
            try { await this.meRef.update({ sigils: [...this.board.sigils] }); } catch (e) { }
            note('sigil', { id: sg, offer });
          }
        }
      } catch (e) {
        note('error', { msg: 'cast: ' + String(e && e.message || e) });
      }
    }
    checkEnd() {
      if (!this.room || this.room.status !== 'active') return;
      const alive = this.alivePlayers();
      const timedOut = this.room.mode === 'timed' && Date.now() - this.room.startedAt > VS_TIME_MS;
      if (alive.length <= 1 || timedOut) {
        let winner = alive[0];
        if (timedOut && alive.length > 1) winner = [...alive].sort((a, b) => b.hp - a.hp || (b.dealt | 0) - (a.dealt | 0))[0];
        this.roomRef.update({ status: 'done', winnerUid: winner ? winner.id : null, endedAt: Date.now() }).catch(() => { });
      }
    }
    // a rematch offered is a rematch taken — this mage always answers the bell,
    // after the few seconds it takes to read the end screen and press
    answerRematch(dest) {
      this.answered = true;
      const wait = 1800 + this.rnd() * 2600;
      note('rematch', { to: dest, ms: Math.round(wait) });
      this.after(wait, () => { if (this.alive) this.attach(dest); });
    }
    // LEAVE from the lobby, as a client does: delete my seat; last one out seals the room
    leave() {
      const code = this.code;
      try { if (this.meRef) this.meRef.child('gone').onDisconnect().cancel(); } catch (e) { }
      this.db.txn('mp/rooms/' + code, (cur) => {
        if (!cur || !cur.players || !cur.players[this.uid]) return cur;
        if (cur.status !== 'waiting') { cur.players[this.uid].gone = true; return cur; }
        const players = { ...cur.players };
        delete players[this.uid];
        const rest = Object.entries(players).sort((a, b) => a[1].seat - b[1].seat);
        if (!rest.length) return null;
        const next = { ...cur, players };
        if (cur.hostUid === this.uid) next.hostUid = rest[0][0];
        return next;
      }).catch(() => { });
      this.stop();
    }
    // the duel's ledger, as any client keeps its own: a run played, the words
    // cast, a win if it was one, and the rating moved by the same Elo the
    // other seat applies to itself — so both numbers move, and mirror
    settle(room) {
      const won = room.winnerUid === this.uid;
      const foes = Object.entries(room.players || {}).filter(([id]) => id !== this.uid).map(([, p]) => p);
      const oppAvg = foes.length ? foes.reduce((a, p) => a + (Number.isFinite(p.rating) ? p.rating : SS_RATING.BASE), 0) / foes.length : null;
      const K = SS_RATING.K, exp = oppAvg == null ? 0.5 : 1 / (1 + Math.pow(10, (oppAvg - this.rating) / 400));
      const d = room.winnerUid && oppAvg != null ? Math.round(K * ((won ? 1 : 0) - exp)) : 0;
      const rating = Math.max(SS_RATING.FLOOR, this.rating + d);
      const casts = Object.values(room.casts || {}).filter((c) => c.uid === this.uid);
      const longest = casts.reduce((a, c) => Math.max(a, (c.word || '').length), this.persona.longest | 0);
      const bigHit = casts.reduce((a, c) => Math.max(a, c.dmg | 0), this.persona.bigHit | 0);
      this.rating = rating;
      syncCircleRow(this.db, this.persona, {
        rating, runs: (this.persona.runs | 0) + 1, words: (this.persona.words | 0) + casts.length,   // the cast list, not the seat: my own casts update may still be in flight when `done` lands
        wins: (this.persona.wins | 0) + (won ? 1 : 0), vsWins: (this.persona.vsWins | 0) + (won ? 1 : 0), longest, bigHit,
      });
      note('settled', { rating, d });
    }
    // a watchdog tick: a turn held too long (a write that never landed) is
    // taken again; a timed duel past its clock is settled like any client would
    tick() {
      if (!this.alive || this.state !== 'play' || !this.room) return;
      if (this.room.status === 'active' && this.room.mode === 'timed' && Date.now() - this.room.startedAt > VS_TIME_MS) this.checkEnd();
      if (this.myTurn() && !this.pending && this.room.mode !== 'timed') {
        if (this.sigilUntil && Date.now() < this.sigilUntil) return;
        this.consider();
      }
      if (this.turnSince && Date.now() - this.turnSince > PACE.MAX_TURNS + 6000 && !this.pending) { this.turnSince = 0; this.consider(); }
    }
  }

  /* ---------- the circle: who answers when the sky is quiet ----------
     A small pool of mages this device has met, kept in localStorage like any
     other preference. Each has a uid and a name cut by the same minters a
     new device uses, and an ordinary profile row in the sky (players/<uid>,
     the very fields SS.sync writes) that grows with every duel — runs, words,
     wins, a rating moved by the same Elo. Never a presence row, never a
     score on a board, never an answer to a friend request: a quiet player,
     by inspection. */
  const CIRCLE_KEY = 'starspellCircle', CIRCLE_N = 8;
  function circle() { try { const a = JSON.parse(localStorage.getItem(CIRCLE_KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function saveCircle(a) { try { localStorage.setItem(CIRCLE_KEY, JSON.stringify(a)); } catch (e) { } }
  // the spread: a believable distance from the player's number — 40 to 90
  // either way, never dead-on, never far; the side by a coin, upward when the
  // floor leaves no room below
  function spreadRating(mine, rnd) {
    const r = rnd || Math.random;
    const floor = typeof SS_RATING !== 'undefined' ? SS_RATING.FLOOR : 600;
    const base = Number.isFinite(mine) ? mine : (typeof SS_RATING !== 'undefined' ? SS_RATING.BASE : 1000);
    const d = 40 + Math.floor(r() * 51);
    const below = base - d >= floor;
    return below && r() < 0.5 ? base - d : base + d;
  }
  // a row as a player a few evenings in would have it
  function freshRow(rating) {
    const r = Math.random;
    const runs = 3 + Math.floor(r() * 14);
    const words = runs * (7 + Math.floor(r() * 6));
    return {
      runs, wins: Math.round(runs * (0.35 + r() * 0.4)), words, beasts: Math.round(runs * (0.5 + r() * 0.6)),
      longest: 5 + Math.floor(r() * 3), bigHit: 18 + Math.floor(r() * 30), bestQuick: 70 + Math.floor(r() * 160),
      vsWins: Math.floor(r() * 4), achCount: 2 + Math.floor(r() * 7), rating, rhide: 0,
      streak: 0, streakDay: 0, streakBest: 1 + Math.floor(r() * 3), streakGrace: 0, streakMark: 0,
    };
  }
  // the mage who answers: the one of the circle nearest the player's number
  // (a new one while the circle is small), never the same as last time,
  // re-rated into the spread
  function persona(mine) {
    const pool = circle();
    let last = '';
    try { last = localStorage.getItem(CIRCLE_KEY + 'Last') || ''; } catch (e) { }
    const rating = spreadRating(mine);
    let p;
    if (pool.length < CIRCLE_N) {
      p = Object.assign({ uid: SSNET.mintUid(), name: SSNET.mintName() }, freshRow(rating));
      pool.push(p);
    } else {
      const cands = pool.filter((x) => x.uid !== last);
      cands.sort((a, b) => Math.abs(a.rating - rating) - Math.abs(b.rating - rating));
      p = cands[Math.floor(Math.random() * Math.min(3, cands.length))];
      p.rating = rating;
    }
    saveCircle(pool);
    try { localStorage.setItem(CIRCLE_KEY + 'Last', p.uid); } catch (e) { }
    return p;
  }
  // the mage's name through the same registry a device claims in — over its
  // own door, so the claim reaches the sky as a remote client's. A name
  // somebody else already holds is re-minted; the circle remembers the new one.
  async function claimCircleName(db, p) {
    try {
      const r = await SSNET.claimName(p.name, p.uid, db);
      if (r.won) return p.name;
      const n = await SSNET.mintClaimed(p.uid, db);
      if (!n) return p.name;
      note('renamed', { uid: p.uid, from: p.name, to: n });
      p.name = n;
      const pool = circle();
      const i = pool.findIndex((x) => x.uid === p.uid);
      if (i >= 0) { pool[i].name = n; saveCircle(pool); }
    } catch (e) { note('error', { msg: String(e && e.message || e) }); }
    return p.name;
  }
  function rowOf(p) {
    const row = Object.assign({}, p, { name: p.name });
    delete row.uid;
    return row;
  }
  // the profile row, written the way syncProfile writes one (merge + at)
  function syncCircleRow(db, p, patch) {
    if (!db) return;
    Object.assign(p, patch || {});
    const pool = circle();
    const i = pool.findIndex((x) => x.uid === p.uid);
    if (i >= 0) pool[i] = p; else pool.push(p);
    saveCircle(pool);
    db.txn('players/' + p.uid, (cur) => Object.assign({}, cur || {}, rowOf(p), { at: Date.now() })).catch(() => { });
  }

  const live = [];
  setInterval(() => { for (const d of live) d.tick(); }, 1000);
  function spawn(o) {
    const d = new Duelist(o);
    live.push(d);
    return d;
  }
  function sweep() { for (let i = live.length - 1; i >= 0; i--) if (!live[i].alive) live.splice(i, 1); }
  setInterval(sweep, 30000);

  return { spawn, sim, paceSample, profile, thinkMs, choose, candidates, Board, packFor, mkRng, PACE, live, log, persona, spreadRating, circle, claimCircleName };
})();

/* ---------- ?botduel=<rating>: seal a room, seat a rival, rise ----------
   The same room shape quick match opens, the same seal code, the same seed
   shape (or ?seed=N for a pinned board);
   the rival arrives a breath later through the ordinary join. */
async function ssBotDuelBoot(scene) {
  const rating = parseInt(QS.get('botduel'), 10);
  if (!Number.isFinite(rating)) return;
  for (let i = 0; i < 60 && SSNET.mode === 'connecting'; i++) await new Promise((r) => setTimeout(r, 250));
  if (SSNET.mode !== 'firebase') { DIAG('botduel: no sky'); return; }
  const mode = VS_MODES.includes(QS.get('vsmode')) ? QS.get('vsmode') : 'turns';
  const seed = parseInt(QS.get('seed'), 10);
  const code = vsCode();
  // sealed WITHOUT seekAt: a queued host rescans and would migrate into any
  // elder stranger's room mid-test; the seam's room is its own (the queue
  // task decides how a real searcher's room meets the engine)
  if (!(await vsSealRoom(code, mode, { seed: Number.isFinite(seed) ? seed : 0 }))) { DIAG('botduel: seal failed'); return; }
  if (!scene.sys.isActive()) return;
  scene.scene.start('vsbattle', { code });
  const d = SS_RIVAL.spawn({ code, rating });
  window.__ssRival = d;
  DIAG('botduel ' + rating + ' · ' + mode + ' · ' + code);
}
