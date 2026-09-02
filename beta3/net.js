'use strict';
/* ============================================================
   STARSPELL net — Firebase RTDB adapter, FAVOR's proven pattern
   (same RTDB instance, own namespace). Local-mode fallback keeps
   every feature working offline; the UI shows a quiet banner.
   Scores are client-authoritative, hobby-scale — same caveat as
   FAVOR; revisit rules before any paid stakes.

   UNIQUE NAMES (v0.53.0): one person per name, so a player can be
   reached by name alone. `names/<key>` → uid is the claim registry;
   <key> is nameKey(name): NFKC-normalize, trim, collapse runs of
   whitespace to one space, lower-case (locale-free toLowerCase), and
   the RTDB-forbidden characters . # $ [ ] / plus controls become '_'.
   So "Astral  Fox", "astral fox" and "ASTRAL FOX" are one name. A
   claim is a transaction: it lands only when the key is free or
   already yours. A fresh device mints until its claim wins (silently
   — it never saw the name it lost). An existing player claims their
   standing name at connect; beaten to it, they re-mint and are told
   once, in fiction, through the ss-renamed event (game.js toasts it).
   Minting past a crowded pool is Skylar's rollover law (v0.72.0):
   the 144 preset names deal first; once every one is claimed, the
   pool resets to its first name wearing the counter 1 ('Astral
   Quill 1'), then 2 once those 144 are gone, and so on forever. A
   counter never lands while a lower name is free as far as the
   registry can tell at mint time — the claim txn still settles ties.
   THE CIRCLE's mages claim through the same registry over their own
   SSNET.side door (rival.js). test_ identities (?mpuid) never touch it.
   Old claims are released when a name changes hands honestly; a
   rename to a taken name keeps the old one (and says so).
   ============================================================ */

const SSNET = (() => {
  const NS = 'starspell';
  const FB_CONFIG = {
    apiKey: 'AIzaSyDzYoQqXoOu4uj2wzTwSn6d_gAlo6e8WSI',
    authDomain: 'testroom-75200.firebaseapp.com',
    databaseURL: 'https://testroom-75200-default-rtdb.firebaseio.com',
    projectId: 'testroom-75200',
    messagingSenderId: '711812846396',
    appId: '1:711812846396:web:08e2375f257205483f8439',
  };
  let mode = 'connecting'; // 'firebase' | 'local' | 'connecting'
  let fdb = null;

  // ---- identity (device uid + generated name, FAVOR-style) ----
  // ?mpuid=x is the same-machine test identity ('test_x' + a Wisp name), used
  // by the two-headless-Chrome versus recipes. It lives HERE, not just in
  // versus.js, so friends/presence/invites/leaderboards all agree on who
  // this tab is — a friend record keyed by one uid and a seat keyed by
  // another would never find each other.
  const MPUID = (() => { try { return new URLSearchParams(location.search).get('mpuid'); } catch (e) { return null; } })();
  // the two minters are shared: a device's own identity and any other seat
  // this client seats (versus's rival engine) are cut from the same cloth
  function mintUid() { return 'u' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function uid() {
    if (MPUID) return 'test_' + MPUID;
    let u = localStorage.getItem('starspellUid');
    if (!u) {
      u = mintUid();
      localStorage.setItem('starspellUid', u);
    }
    return u;
  }
  const NAME_A = ['Astral', 'Gilded', 'Quiet', 'Umbral', 'Silver', 'Dawn', 'Comet', 'Rune', 'Velvet', 'Winter', 'Ember', 'Moonlit'];
  const NAME_B = ['Quill', 'Fox', 'Owl', 'Weaver', 'Scribe', 'Hare', 'Raven', 'Mage', 'Widow', 'Serpent', 'Bear', 'Lantern'];
  function mintName() { return NAME_A[Math.floor(Math.random() * NAME_A.length)] + ' ' + NAME_B[Math.floor(Math.random() * NAME_B.length)]; }
  // the same pool in rollover order: each first word runs through every second
  // word before the next, so poolName(0) is 'Astral Quill' — the first preset
  // name, where an exhausted pool resets with its counter (see mintClaimed)
  const POOL_N = NAME_A.length * NAME_B.length;
  function poolName(i) { return NAME_A[Math.floor(i / NAME_B.length)] + ' ' + NAME_B[i % NAME_B.length]; }
  const FRESH_KEY = 'starspellNameFresh', RN_KEY = 'starspellRenamed';
  function myName() {
    if (MPUID) return 'Wisp ' + MPUID.toUpperCase();
    let n = localStorage.getItem('starspellName');
    if (!n) {
      n = mintName();
      localStorage.setItem('starspellName', n);
      try { localStorage.setItem(FRESH_KEY, '1'); } catch (e) { }   // unclaimed: a lost race re-mints silently
    }
    return n;
  }
  // a rename: applied at once (the profile card shows it), then claimed.
  // Lost the claim → the old name comes back, its own claim never let go.
  function setName(n) {
    n = String(n || '').trim().replace(/\s+/g, ' ').slice(0, 18);
    if (!n) return myName();
    const old = myName();
    localStorage.setItem('starspellName', n);
    localStorage.removeItem(FRESH_KEY);
    if (nameKey(n) === nameKey(old)) { dbUpdate('players/' + uid(), { name: n }).catch(() => { }); return n; }
    claimName(n).then((r) => {
      if (r.won) { claimedKey = r.key; releaseName(old).catch(() => { }); return dbUpdate('players/' + uid(), { name: n }); }
      if (myName() !== n) return null;            // renamed again meanwhile
      localStorage.setItem('starspellName', old);
      renamed({ from: n, to: old, kind: 'held' });
      return dbUpdate('players/' + uid(), { name: old });
    }).catch(() => { });
    return n;
  }

  // ---- unique names: the claim registry (see the header) ----
  let claimedKey = null;   // the key this session has proven its own (skips the txn on every sync)
  function nameKey(n) {
    let s = String(n == null ? '' : n);
    try { s = s.normalize('NFKC'); } catch (e) { }
    return s.trim().replace(/\s+/g, ' ').toLowerCase().replace(/[.#$\[\]\/\u0000-\u001f\u007f]/g, '_');
  }
  // test rigs (?mpuid → test_<x>) share a machine and never enter the registry
  function offRegistry(u) { return !u || /^test_/.test(u); }
  // won: names/<key> is <forUid>'s once the transaction settles. `db` is an
  // SSNET.side door for a seat this client holds for someone else (the circle).
  async function claimName(name, forUid, db) {
    const key = nameKey(name), u = forUid || uid();
    if (!key) return { won: false, key };
    if (mode !== 'firebase' || offRegistry(u)) return { won: true, key };
    const txn = db ? (p, fn) => db.txn(p, fn) : dbTxn;
    const r = await txn('names/' + key, (cur) => (cur == null || cur === u) ? u : undefined);
    return { won: !!r.committed && r.value === u, key };
  }
  async function releaseName(name, forUid, db) {
    const key = nameKey(name), u = forUid || uid();
    if (!key || mode !== 'firebase' || offRegistry(u)) return;
    const txn = db ? (p, fn) => db.txn(p, fn) : dbTxn;
    await txn('names/' + key, (cur) => cur === u ? null : undefined);
  }
  // reach a player by name alone (task 43): the registry resolves the typed
  // name (sloppy case/spacing folds through nameKey) to a uid, and the
  // players row gives back the name as they wear it. null = no such mage.
  async function findByName(name) {
    const key = nameKey(name);
    if (!key || mode !== 'firebase') return null;
    const u = await dbGet('names/' + key);
    if (!u || typeof u !== 'string') return null;
    let shown = null;
    try { const p = await dbGet('players/' + u); shown = p && p.name; } catch (e) { }
    return { uid: u, key, name: shown || String(name).trim() };
  }
  // mint until a claim wins. Fresh random draws first — the common case, the
  // pool is roomy and the first mint lands. When they all lose, ONE registry
  // read tells which names are truly free, and the walk deals the lowest pass
  // in pool order: the base 144, then the pool again wearing ' 1', then ' 2',
  // forever (the rollover law — see the header). A counter only lands when
  // every name of the passes below is taken as far as that read, plus any
  // transactions lost on the way, can tell — both are the registry talking.
  // null = busy sky (the read failed, or 12 straight claim losses);
  // ensureName leans on that and retries next sync.
  async function mintClaimed(forUid, db) {
    const u = forUid || uid();
    for (let i = 0; i < 8; i++) {
      const n = mintName();
      const r = await claimName(n, u, db);
      if (r.won) return n;
    }
    let taken;
    try {
      const v = db ? (await db.ref('names').get()).val() : await dbGet('names');
      taken = v || {};
    } catch (e) { return null; }
    let losses = 0;
    for (let pass = 0; pass < 10000; pass++) {
      for (let i = 0; i < POOL_N; i++) {
        const n = pass ? poolName(i) + ' ' + pass : poolName(i);
        const key = nameKey(n);
        if (taken[key] != null) continue;
        const r = await claimName(n, u, db);
        if (r.won) return n;
        taken[key] = 1;                    // raced away between the read and us
        if (++losses >= 12) return null;   // busy sky; next sync tries again
      }
    }
    return null;
  }
  // the one-time rename notice, kept until a scene has shown it
  function renamed(d) {
    const rec = Object.assign({ at: Date.now() }, d);
    try { localStorage.setItem(RN_KEY, JSON.stringify(rec)); } catch (e) { }
    try { window.dispatchEvent(new CustomEvent('ss-renamed', { detail: rec })); } catch (e) { }
  }
  function renameNotice(take) {
    let r = null;
    try { r = JSON.parse(localStorage.getItem(RN_KEY)); } catch (e) { }
    if (r && take) { try { localStorage.removeItem(RN_KEY); } catch (e) { } }
    return r || null;
  }
  // at connect (and every profile sync): the standing name must be mine
  let ensuring = null;
  function ensureName() {
    if (ensuring) return ensuring;
    ensuring = (async () => {
      if (mode !== 'firebase' || MPUID) return true;
      const had = myName();
      if (nameKey(had) === claimedKey) return true;
      const fresh = !!localStorage.getItem(FRESH_KEY);
      const r = await claimName(had);
      if (r.won) { claimedKey = r.key; localStorage.removeItem(FRESH_KEY); return true; }
      const n = await mintClaimed();
      if (!n) return false;                          // the sky is busy; next sync tries again
      localStorage.setItem('starspellName', n);
      localStorage.removeItem(FRESH_KEY);
      claimedKey = nameKey(n);
      await dbUpdate('players/' + uid(), { name: n }).catch(() => { });
      if (!fresh) renamed({ from: had, to: n, kind: 'taken' });
      return true;
    })().catch(() => false).finally(() => { ensuring = null; });
    return ensuring;
  }

  // ---- local fallback tree ----
  const LKEY = 'starspellLocalDb';
  function ltree() { try { return JSON.parse(localStorage.getItem(LKEY)) || {}; } catch (e) { return {}; } }
  function lsave(t) { try { localStorage.setItem(LKEY, JSON.stringify(t)); } catch (e) { } }
  function lwalk(t, path, make) {
    const parts = path.split('/').filter(Boolean);
    let n = t;
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof n[parts[i]] !== 'object' || n[parts[i]] == null) { if (!make) return [null, null]; n[parts[i]] = {}; }
      n = n[parts[i]];
    }
    return [n, parts[parts.length - 1]];
  }
  function localGet(path) { const [n, k] = lwalk(ltree(), path, false); return n ? (n[k] == null ? null : n[k]) : null; }
  // set(null) is the delete idiom everywhere in this codebase (pruneBoards,
  // versus room cleanup), and RTDB removes the node outright — so drop the key
  // rather than leaving a null behind, or Object.keys() readers still see it.
  function localSet(path, v) {
    const t = ltree(); const [n, k] = lwalk(t, path, true);
    if (v === null) delete n[k]; else n[k] = v;
    lsave(t);
  }

  // ---- adapter ----
  async function dbGet(path) {
    if (mode === 'firebase') { const s = await fdb.ref(NS + '/' + path).get(); return s.exists() ? s.val() : null; }
    return localGet(path);
  }
  async function dbSet(path, v) {
    if (mode === 'firebase') return fdb.ref(NS + '/' + path).set(v);
    localSet(path, v);
  }
  async function dbUpdate(path, v) {
    if (mode === 'firebase') return fdb.ref(NS + '/' + path).update(v);
    const cur = localGet(path) || {};
    localSet(path, Object.assign({}, cur, v));
  }
  async function dbTxn(path, fn) {
    if (mode === 'firebase') {
      const r = await fdb.ref(NS + '/' + path).transaction((cur) => {
        const next = fn(cur);
        return next === undefined ? cur : next; // never cancel on the null first pass
      });
      return { committed: r.committed, value: r.snapshot ? r.snapshot.val() : null };
    }
    const next = fn(localGet(path));
    if (next !== undefined) localSet(path, next);
    return { committed: true, value: next };
  }

  async function connect() {
    if (mode !== 'connecting') return mode;
    try {
      if (typeof firebase === 'undefined') throw new Error('no sdk');
      const app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(FB_CONFIG);
      fdb = firebase.database(app);
      mode = 'firebase';
      await Promise.race([
        dbGet('players/' + uid() + '/name'),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000)),
      ]);
    } catch (e) {
      mode = 'local';
    }
    if (mode === 'firebase') {
      try { FR.start(); } catch (e) { }
      // the name must be mine before the profile row carries it anywhere
      try { await ensureName(); } catch (e) { }
    }
    return mode;
  }

  // ---- keys ----
  // Both keys are UTC. The daily seeds the board (setSeed(dayKey) in Battle),
  // so a local-time key would hand Tokyo a given day's sky ~16h before Los
  // Angeles — "one sky, shared by all" only holds if the whole planet turns
  // over at once. It also keeps pruneBoards honest: with local keys a client
  // in UTC+14 reads "today" as a date that clients in UTC-11 are still
  // playing, and sweeps their live board out from under them.
  // Rollover is 00:00 UTC — 7pm CDT, 1am BST, 9am JST.
  // Dev-only time travel. The streak lantern only means anything across DAYS,
  // and a test cannot wait one. `?daykey=20260101` pins today's key at boot;
  // setDayKey(k) moves it mid-session (the rollover case — the meadow's
  // heralds must follow a day that turns while the player stands in the
  // grass). Only the no-argument call is overridden: pruneBoards and anything
  // else that asks about a SPECIFIC date still gets the truth.
  let dayOvr = 0;
  try {
    const q = /[?&]daykey=(\d{8})(&|$)/.exec(location.search);
    if (q) dayOvr = +q[1];
  } catch (e) { }
  function setDayKey(k) {
    dayOvr = /^\d{8}$/.test(String(k || '')) ? +k : 0;
    // left visible on purpose: a session running on a fake day is worth seeing
    // in a diag readout or a bug report rather than guessing at later
    try { window.__ssDayOvr = dayOvr || undefined; } catch (e) { }
    return dayOvr;
  }
  if (dayOvr) setDayKey(dayOvr);
  function dayKey(d) {
    // via Date.now() so the whole clock surface (dayKey, msToNextDay) reads
    // one source — identical in production, and freezable as a pair in tests
    if (!d && dayOvr) return dayOvr;
    d = d || new Date(Date.now());
    return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  }
  // dayKey as an ISO date, so anything user-facing (share text, countdowns)
  // can never drift from the key that actually chose the puzzle
  function dayKeyISO(k) {
    k = k || dayKey();
    const s = String(k);
    return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
  }
  // ms until the next daily drops
  function msToNextDay(now) {
    const t = (now == null ? Date.now() : now);
    return 86400000 - (((t % 86400000) + 86400000) % 86400000);
  }
  // ms until the weekly board turns over. weekKey is ISO (weeks start Monday),
  // so the flip is Monday 00:00 UTC — same clock surface as msToNextDay.
  function msToNextWeek(now) {
    const t = (now == null ? Date.now() : now);
    const dow = new Date(t).getUTCDay() || 7;   // 1 Mon .. 7 Sun
    return (7 - dow) * 86400000 + msToNextDay(t);
  }
  function weekKey(d) {
    d = d || new Date();
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day); // ISO week: Thursday decides the year
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    const wk = Math.ceil(((t - y0) / 86400000 + 1) / 7);
    return t.getUTCFullYear() + '-W' + (wk < 10 ? '0' : '') + wk;
  }

  // ---- leaderboards ----
  // The daily board is per gameplay language — different bags deal different
  // skies, so scores only compete within one tongue ('20260815' stays the
  // English board, '20260815-es' is the Spanish one). The weekly board stays
  // global: it ranks whole runs, not a shared board.
  function dailyPath(lang) {
    return 'daily/' + dayKey() + (lang && lang !== 'en' ? '-' + lang : '');
  }
  // mode is the run's mode ('quick'|'daily'|'campaign'). The DAILY board is
  // the daily hunt's own ledger — only daily-mode runs may touch it (quick
  // and campaign runs used to bleed in here and bury the real hunters). The
  // weekly board stays all-modes on purpose: it ranks the week's best single
  // runs wherever they were earned. Both are max-only transactions — a new
  // score only ever replaces a lower one, never adds.
  // `hard` (v0.70.0) stamps the row `h: 1` so the weekly board can wear a
  // small ⚑ on hard runs — the row's rank is untouched (the score already
  // carries hard's amplifier; the mark is the tell, not a bonus).
  async function submitScore(score, finestWord, lang, mode, hard) {
    const rec = (cur) => {
      if (cur && cur.score >= score) return cur;
      const r = { name: myName(), score, word: (finestWord || '').toUpperCase(), at: Date.now(), m: mode || 'quick' };
      if (hard) r.h = 1;
      return r;
    };
    const me = uid();
    try {
      if (mode === 'daily') await dbTxn(dailyPath(lang) + '/' + me, rec);
      await dbTxn('weekly/' + weekKey() + '/' + me, rec);
    } catch (e) { }
  }
  /* The hard board (v0.70.0): campaign hard CLEARS, ranked by score — one
     row per player under `hard/all` (the all-time board the HARD tab
     shows), with a weekly slice riding along under `hard/<isoWeek>`
     (pruned like the weeklies) exactly as the endless board keeps one. */
  async function submitHard(score, finestWord) {
    score = score | 0;
    const rec = (cur) => {
      if (cur && (cur.score | 0) >= score) return cur;
      return { name: myName(), score, word: (finestWord || '').toUpperCase(), at: Date.now(), h: 1 };
    };
    const me = uid();
    try {
      await dbTxn('hard/all/' + me, rec);
      await dbTxn('hard/' + weekKey() + '/' + me, rec);
    } catch (e) { }
  }
  /* The endless board (v0.68.0): one row per player, ranked by LEVEL with
     the score as the tiebreak — so the transaction keeps the better of the
     two by that same order, never by score alone (a deep lean climb beats a
     shallow rich one, exactly as the board sorts). `endless/all` is the
     all-time board the tab shows; a weekly slice rides along under
     `endless/<isoWeek>` (pruned like the weeklies) so a living
     this-week's-climbs tab is one read away if it is ever wanted. */
  async function submitEndless(level, score, finestWord) {
    level = level | 0; score = score | 0;
    const rec = (cur) => {
      if (cur && ((cur.lvl | 0) > level || ((cur.lvl | 0) === level && (cur.score | 0) >= score))) return cur;
      return { name: myName(), lvl: level, score, word: (finestWord || '').toUpperCase(), at: Date.now() };
    };
    const me = uid();
    try {
      await dbTxn('endless/all/' + me, rec);
      await dbTxn('endless/' + weekKey() + '/' + me, rec);
    } catch (e) { }
  }
  // housekeeping: old day/week boards would pile up forever — sweep them as we
  // pass by. Once/session.
  // Sweep STRICTLY OLDER than the cutoff, never "anything not in the keep
  // list". Any client can delete any board, and both directions of clock
  // error have to be survivable: a day-fast device would wipe the live board
  // (hence a 3-deep window, not 1), and a day-slow device would wipe the one
  // that is about to become live. A future-dated key belongs to a day that
  // hasn't arrived yet — leave it alone and it becomes today's board on time.
  let sweptBoards = false;
  async function pruneBoards() {
    if (sweptBoards) return;
    sweptBoards = true;
    try {
      const dayCut = dayKey(new Date(Date.now() - 2 * 86400000));       // numeric YYYYMMDD
      const weekCut = weekKey(new Date(Date.now() - 7 * 86400000));     // 'YYYY-Www' sorts lexically
      const days = (await dbGet('daily').catch(() => null)) || {};
      // keys may carry a language suffix ('20260815-es') — compare on the date
      for (const k of Object.keys(days)) if (Number(String(k).slice(0, 8)) < dayCut) dbSet('daily/' + k, null).catch(() => { });
      const weeks = (await dbGet('weekly').catch(() => null)) || {};
      for (const k of Object.keys(weeks)) if (k < weekCut) dbSet('weekly/' + k, null).catch(() => { });
      // the endless weekly slices age out like the weeklies; 'all' is the
      // all-time board and is never swept — and the hard board keeps house
      // the same way (v0.70.0)
      const endl = (await dbGet('endless').catch(() => null)) || {};
      for (const k of Object.keys(endl)) if (/^\d{4}-W\d{2}$/.test(k) && k < weekCut) dbSet('endless/' + k, null).catch(() => { });
      const hrd = (await dbGet('hard').catch(() => null)) || {};
      for (const k of Object.keys(hrd)) if (/^\d{4}-W\d{2}$/.test(k) && k < weekCut) dbSet('hard/' + k, null).catch(() => { });
    } catch (e) { }
  }

  async function getBoard(kind, lang) {
    pruneBoards();
    const endless = kind === 'endless';
    const hardB = kind === 'hard';                        // the hard tab: campaign hard clears, all-time
    const daily = kind !== 'weekly' && !endless && !hardB;
    const path = endless ? 'endless/all' : hardB ? 'hard/all' : daily ? dailyPath(lang) : 'weekly/' + weekKey();
    const all = (await dbGet(path).catch(() => null)) || {};
    let rows = Object.entries(all)
      // The daily board shows ONLY rows stamped m:'daily'. Belt to the write
      // gate's suspenders: clients running cached pre-v0.31.1 code still
      // submit quick/campaign runs here for a while after deploy, and their
      // unstamped rows must stay invisible. (Today's board was hand-migrated
      // at deploy; older unstamped boards are never read — dailyPath is
      // always today's.)
      .filter(([, r]) => !daily || (r && r.m === 'daily'))
      // `hard` rides out so the weekly can mark its ⚑ rows (v0.70.0)
      .map(([id, r]) => ({ id, name: r.name || '???', score: r.score | 0, level: r.lvl | 0, word: r.word || '', at: r.at, hard: !!r.h }))
      // the endless ladder ranks by LEVEL, the score breaking ties
      .sort((a, b) => (endless ? (b.level - a.level || b.score - a.score) : b.score - a.score));
    // the seeded hunters (seed-names.js): deterministic ghosts merged in so a
    // young board never reads empty. They adapt around the real rows (never
    // #1 over one), never carry this player's uid or name, and one switch
    // (SS_SEED.enabled / ?ghosts=0) restores the bare board.
    try {
      if (typeof SS_SEED !== 'undefined' && SS_SEED.enabled) {
        rows = SS_SEED.merge(rows, endless ? 'endless' : hardB ? 'hard' : daily ? 'daily' : 'weekly',
          endless || hardB ? 'all' : daily ? String(dayKey()) : weekKey(), daily ? (lang || 'en') : null, null, myName());
      }
    } catch (e) { }
    const meIdx = rows.findIndex((r) => r.id === uid());
    return { rows: rows.slice(0, 50), me: meIdx, total: rows.length };
  }

  // ---- profile sync (best-effort, one row per player) ----
  async function syncProfile(stats) {
    try {
      if (mode === 'firebase' && !MPUID) await ensureName();
      await dbTxn('players/' + uid(), (cur) => Object.assign({}, cur || {}, { name: myName() }, stats, { at: Date.now() }));
    } catch (e) { }
  }

  // raw ref for live listeners (multiplayer); null when offline/local
  function ref(path) { return mode === 'firebase' && fdb ? fdb.ref(NS + '/' + path) : null; }
  // a SECOND connection to the same sky: its own SDK instance, socket, local
  // cache, transaction queue and onDisconnect — so whatever it writes reaches
  // this client the way a remote client's writes do (no optimistic local
  // apply, no transaction aborted by this tab's own update on the same path).
  // Versus's rival engine seats its duelist through one of these.
  function side(tag) {
    if (mode !== 'firebase') return null;
    let db;
    try {
      const app = (firebase.apps || []).find((a) => a.name === tag) || firebase.initializeApp(FB_CONFIG, tag);
      db = firebase.database(app);
    } catch (e) { return null; }
    return {
      ref: (p) => db.ref(NS + '/' + p),
      async txn(p, fn) {
        const r = await db.ref(NS + '/' + p).transaction((cur) => { const n = fn(cur); return n === undefined ? cur : n; });
        return { committed: r.committed, value: r.snapshot ? r.snapshot.val() : null };
      },
    };
  }

  /* ---- friends · presence · summons · recent rivals ------------------------
     The social layer under versus, all client-authoritative like the rest:
       friends/{uid}/{fuid}  = {name, at}      mutual — adding writes both sides
       presence/{uid}        = {name, at, busy} onDisconnect-removed + heartbeat
       invites/{toUid}/{from}= {name, code, mode, at}   a challenge = a private
                               room already sealed by the challenger; accepting
                               is just joining it by code
       recent/{uid}/{fuid}   = {name, at}      the last few rivals — the VERSUS
                               RECENT roll (rematch / summons) and one-tap adds
     One live snapshot of all four is kept here and every UI that cares
     subscribes with FR.on(cb) — the versus menu, the summons banner, the
     home button's "friends online" line. Nothing here touches Phaser. */
  const FR = {
    friends: {}, presence: {}, invites: {}, recent: {},
    busy: false, started: false, _cbs: new Set(), _hb: null,
    ONLINE_MS: 150000,   // a heartbeat every 45s; silent 2.5min = gone
    INVITE_MS: 5 * 60000,
    on(cb) { this._cbs.add(cb); try { cb(this); } catch (e) { } return () => this._cbs.delete(cb); },
    _emit() { for (const cb of this._cbs) { try { cb(this); } catch (e) { try { console.warn('FR listener threw', e); } catch (e2) { } } } },
    start() {
      if (this.started || mode !== 'firebase') return;
      this.started = true;
      const me = uid();
      ref('friends/' + me).on('value', (s) => { this.friends = s.val() || {}; this._emit(); });
      ref('recent/' + me).on('value', (s) => { this.recent = s.val() || {}; this._emit(); });
      ref('invites/' + me).on('value', (s) => { this.invites = s.val() || {}; this._emit(); });
      ref('presence').on('value', (s) => { this.presence = s.val() || {}; this._emit(); });
      // presence, the FAVOR/BoO way: re-armed on every (re)connection because
      // the server drops the node the moment the socket goes — a phone coming
      // back from the lock screen has to announce itself again
      fdb.ref('.info/connected').on('value', (s) => { if (s.val()) this._announce(true); });
      this._hb = setInterval(() => this._announce(false), 45000);
      document.addEventListener('visibilitychange', () => { if (!document.hidden) this._announce(false); });
      // housekeeping: presence rows whose owner has been silent for an hour
      // are corpses (onDisconnect can be lost); sweep them once as we pass
      setTimeout(() => {
        const cut = Date.now() - 3600000;
        for (const [k, p] of Object.entries(this.presence)) if (!p || !(p.at > cut)) dbSet('presence/' + k, null).catch(() => { });
        for (const [k, inv] of Object.entries(this.invites)) if (!inv || !(inv.at > Date.now() - this.INVITE_MS)) dbSet('invites/' + me + '/' + k, null).catch(() => { });
      }, 8000);
    },
    _announce(arm) {
      const r = ref('presence/' + uid());
      if (!r) return;
      if (arm) r.onDisconnect().remove();
      r.update({ name: myName(), at: Date.now(), busy: !!this.busy }).catch(() => { });
    },
    setBusy(b) { this.busy = !!b; if (this.started) this._announce(false); },
    isOnline(fuid) { const p = this.presence[fuid]; return !!(p && p.at > Date.now() - this.ONLINE_MS); },
    isBusy(fuid) { const p = this.presence[fuid]; return !!(p && p.busy); },
    // display name: presence carries the freshest one, the friend record a snapshot
    nameOf(fuid) { const p = this.presence[fuid], f = this.friends[fuid], r = this.recent[fuid]; return (p && p.name) || (f && f.name) || (r && r.name) || '???'; },
    list() {   // friends, online first, then most recently added
      return Object.entries(this.friends).map(([id, f]) => ({ id, name: this.nameOf(id), at: +(f && f.at) || 0, online: this.isOnline(id), busy: this.isBusy(id) }))
        .sort((a, b) => (b.online - a.online) || (b.at - a.at));
    },
    onlineCount() { return Object.keys(this.friends).filter((id) => this.isOnline(id)).length; },
    // everyone I crossed swords with lately, newest first — friends too
    // (task 44: the VERSUS RECENT roll), with the live glint the friends
    // roll wears; `at` is when that duel began
    recentList(n) {
      return Object.entries(this.recent).filter(([id, r]) => r && id !== uid())
        .map(([id, r]) => ({ id, name: this.nameOf(id), at: +(r && r.at) || 0, online: this.isOnline(id), busy: this.isBusy(id), friend: !!this.friends[id] }))
        .sort((a, b) => b.at - a.at).slice(0, n || 6);
    },
    rivals(n) {   // recent rivals who aren't friends yet, newest first
      return Object.entries(this.recent).filter(([id]) => !this.friends[id] && id !== uid())
        .map(([id, r]) => ({ id, name: this.nameOf(id), at: +(r && r.at) || 0 })).sort((a, b) => b.at - a.at).slice(0, n || 6);
    },
    pending() {   // live challenges to me, newest first
      const cut = Date.now() - this.INVITE_MS;
      return Object.entries(this.invites).filter(([, i]) => i && i.code && i.at > cut)
        .map(([from, i]) => ({ from, ...i })).sort((a, b) => b.at - a.at);
    },
    async add(fuid, name) {
      if (!fuid || fuid === uid()) return false;
      const me = uid(), at = Date.now();
      if (!name) { try { const p = await dbGet('players/' + fuid); name = (p && p.name) || this.nameOf(fuid); } catch (e) { name = this.nameOf(fuid); } }
      try {
        await dbUpdate('friends/' + me + '/' + fuid, { name: name || '???', at });
        await dbUpdate('friends/' + fuid + '/' + me, { name: myName(), at });
        this.friends[fuid] = { name, at }; this._emit();
        return true;
      } catch (e) { return false; }
    },
    async remove(fuid) {
      try { await dbSet('friends/' + uid() + '/' + fuid, null); await dbSet('friends/' + fuid + '/' + uid(), null); } catch (e) { }
    },
    // remember who I crossed swords with (my own node only) — capped so it
    // never grows past a handful
    async noteRival(fuid, name) {
      if (!fuid || fuid === uid()) return;
      try {
        const cur = Object.assign({}, this.recent, { [fuid]: { name: name || '???', at: Date.now() } });
        const keep = Object.entries(cur).sort((a, b) => (+b[1].at || 0) - (+a[1].at || 0)).slice(0, 8);   // (| 0 would fold a ms stamp to 32 bits)
        await dbSet('recent/' + uid(), Object.fromEntries(keep));
      } catch (e) { }
    },
    // a challenge: the private room is already sealed; this just rings the bell
    async challenge(fuid, code, mode) {
      const r = ref('invites/' + fuid + '/' + uid());
      if (!r) return false;
      try {
        r.onDisconnect().remove();   // a challenger who vanishes takes the bell with them
        await r.set({ name: myName(), code, mode, at: Date.now() });
        return true;
      } catch (e) { return false; }
    },
    async cancelChallenge(fuid) {
      const r = ref('invites/' + fuid + '/' + uid());
      if (!r) return;
      try { r.onDisconnect().cancel(); await r.remove(); } catch (e) { }
    },
    async decline(fromUid) { try { await dbSet('invites/' + uid() + '/' + fromUid, null); } catch (e) { } },
  };

  return { connect, uid, myName, setName, mintUid, mintName, nameKey, claimName, releaseName, findByName, mintClaimed, ensureName, renameNotice, side, submitScore, submitEndless, submitHard, getBoard, syncProfile, dayKey, setDayKey, dayKeyISO, msToNextDay, msToNextWeek, weekKey, ref, dbGet, dbSet, dbUpdate, dbTxn, FR, get mode() { return mode; } };
})();
