'use strict';
/* ============================================================
   STARSPELL net — Firebase RTDB adapter, FAVOR's proven pattern
   (same RTDB instance, own namespace). Local-mode fallback keeps
   every feature working offline; the UI shows a quiet banner.
   Scores are client-authoritative, hobby-scale — same caveat as
   FAVOR; revisit rules before any paid stakes.
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
  function uid() {
    let u = localStorage.getItem('starspellUid');
    if (!u) {
      u = 'u' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem('starspellUid', u);
    }
    return u;
  }
  const NAME_A = ['Astral', 'Gilded', 'Quiet', 'Umbral', 'Silver', 'Dawn', 'Comet', 'Rune', 'Velvet', 'Winter', 'Ember', 'Moonlit'];
  const NAME_B = ['Quill', 'Fox', 'Owl', 'Weaver', 'Scribe', 'Hare', 'Raven', 'Mage', 'Widow', 'Serpent', 'Bear', 'Lantern'];
  function myName() {
    let n = localStorage.getItem('starspellName');
    if (!n) {
      n = NAME_A[Math.floor(Math.random() * NAME_A.length)] + ' ' + NAME_B[Math.floor(Math.random() * NAME_B.length)];
      localStorage.setItem('starspellName', n);
    }
    return n;
  }
  function setName(n) {
    n = String(n || '').trim().slice(0, 18);
    if (!n) return myName();
    localStorage.setItem('starspellName', n);
    dbUpdate('players/' + uid(), { name: n }).catch(() => { });
    return n;
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
  function localSet(path, v) { const t = ltree(); const [n, k] = lwalk(t, path, true); n[k] = v; lsave(t); }

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
    return mode;
  }

  // ---- keys ----
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
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
  async function submitScore(score, finestWord) {
    const rec = (cur) => {
      if (cur && cur.score >= score) return cur;
      return { name: myName(), score, word: (finestWord || '').toUpperCase(), at: Date.now() };
    };
    const me = uid();
    try {
      await dbTxn('daily/' + dayKey() + '/' + me, rec);
      await dbTxn('weekly/' + weekKey() + '/' + me, rec);
    } catch (e) { }
  }
  async function getBoard(kind) {
    const path = kind === 'weekly' ? 'weekly/' + weekKey() : 'daily/' + dayKey();
    const all = (await dbGet(path).catch(() => null)) || {};
    const rows = Object.entries(all)
      .map(([id, r]) => ({ id, name: r.name || '???', score: r.score | 0, word: r.word || '', at: r.at }))
      .sort((a, b) => b.score - a.score);
    const meIdx = rows.findIndex((r) => r.id === uid());
    return { rows: rows.slice(0, 50), me: meIdx, total: rows.length };
  }

  // ---- profile sync (best-effort, one row per player) ----
  async function syncProfile(stats) {
    try {
      await dbTxn('players/' + uid(), (cur) => Object.assign({}, cur || {}, { name: myName() }, stats, { at: Date.now() }));
    } catch (e) { }
  }

  // raw ref for live listeners (multiplayer); null when offline/local
  function ref(path) { return mode === 'firebase' && fdb ? fdb.ref(NS + '/' + path) : null; }

  return { connect, uid, myName, setName, submitScore, getBoard, syncProfile, dayKey, weekKey, ref, dbGet, dbSet, dbUpdate, dbTxn, get mode() { return mode; } };
})();
