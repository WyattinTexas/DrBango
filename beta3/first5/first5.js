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

   ?reset=1 wipes the first5 namespace (and scrubs itself from
   the URL so in-game reloads don't wipe again) — endless replay
   of the true first open.
   ============================================================ */
(() => {
  const PRE = 'first5.';
  const P = Storage.prototype;
  const rawGet = P.getItem, rawSet = P.setItem, rawRemove = P.removeItem;
  P.getItem = function (key) { return rawGet.call(this, PRE + key); };
  P.setItem = function (key, val) { return rawSet.call(this, PRE + key, val); };
  P.removeItem = function (key) { return rawRemove.call(this, PRE + key); };

  if (/[?&]reset=1/.test(location.search)) {
    try {
      [localStorage, sessionStorage].forEach((store) => {
        const dead = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k && k.indexOf(PRE) === 0) dead.push(k);
        }
        dead.forEach((k) => rawRemove.call(store, k));
      });
      const u = new URL(location.href);
      u.searchParams.delete('reset');
      history.replaceState(null, '', u);
    } catch (e) { /* storage blocked — nothing to wipe */ }
  }
})();
