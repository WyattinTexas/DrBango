'use strict';
/* ============================================================
   FIRST5 — the first-night sandbox (drbango.com/beta3/first5/).
   A standalone copy of the shipping game, scoped to a stranger's
   first open, so Skylar can test the tutorial and rule fixes
   before anything touches the live game.

   This file MUST load before every other script. It prefixes
   every Storage key with 'first5.' — first5 shares an origin
   with live beta3 on drbango.com, and without the prefix a test
   run here would trample real beta3.* saves (and close the FTUE
   gate forever on that device). With it, first5 always looks
   like a fresh device to the game: the first open plays true.

   THE CLEAN REFRESH (F5-FIX1-01, Skylar 10/08): on this stage a
   player-initiated page load — fresh navigation or a browser
   refresh — wipes the first5 namespace, so every pull-to-refresh
   is a true first open. The game's own scripted reloads (the
   versus retry door, the language turn, the blank-canvas
   self-heal — each tagged F5-FIX1-01 at its site) announce
   themselves through window.__f5survive() just before they fire;
   the flag rides sessionStorage (it can never outlive the tab),
   lives INSIDE the namespace (any wipe clears it), and the next
   boot consumes it on sight — carried, the night stands.

   ⚠ SANDBOX-ONLY LAW — NEVER INTEGRATE THE WIPE. This default
   wipe is for the test stage, where every open should play like
   a stranger's first night. The LIVE game must NEVER wipe on
   refresh — integrating this block would destroy real players'
   saves on every reload. The three __f5survive() call sites in
   the game copies are inert without this file (guarded, no-op
   when undefined) and safe to carry; THIS file's wipe is not.

   ?reset=1 still wipes (now redundant with the default, kept
   harmless) and scrubs itself from the URL.
   ============================================================ */
(() => {
  const PRE = 'first5.';
  const FLAG = PRE + '__survive';   // raw key, inside the namespace
  const P = Storage.prototype;
  const rawGet = P.getItem, rawSet = P.setItem, rawRemove = P.removeItem;
  P.getItem = function (key) { return rawGet.call(this, PRE + key); };
  P.setItem = function (key, val) { return rawSet.call(this, PRE + key, val); };
  P.removeItem = function (key) { return rawRemove.call(this, PRE + key); };

  // the scripted reloads' door: set just before a reload the game fires
  // itself, so the boot it causes is not mistaken for a fresh visit
  window.__f5survive = () => { try { rawSet.call(sessionStorage, FLAG, '1'); } catch (e) { } };

  let survive = false;
  try {
    survive = rawGet.call(sessionStorage, FLAG) === '1';
    rawRemove.call(sessionStorage, FLAG);   // one-shot: consumed on sight
  } catch (e) { /* storage blocked — treat as a fresh visit */ }

  const reset = /[?&]reset=1/.test(location.search);
  if (reset || !survive) {
    try {
      [localStorage, sessionStorage].forEach((store) => {
        const dead = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k && k.indexOf(PRE) === 0) dead.push(k);
        }
        dead.forEach((k) => rawRemove.call(store, k));
      });
    } catch (e) { /* storage blocked — nothing to wipe */ }
  }
  if (reset) {
    try {
      const u = new URL(location.href);
      u.searchParams.delete('reset');
      history.replaceState(null, '', u);
    } catch (e) { }
  }
})();
