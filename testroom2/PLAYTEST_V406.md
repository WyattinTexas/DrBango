# v406 Static Playtest Report

**Commit:** e976a4e  
**Date:** 2026-04-11  
**Method:** Static code trace — index.html (11,888 lines), no live browser  
**Analyst:** Corkscrew Games site agent (task #2)  
**PARALLEL SAFETY:** Read-only — index.html NOT modified. New file only.

---

## Summary — PASS / FAIL / NEEDS LIVE TEST per Scenario

| Scenario | Ghost Matchup | Verdict |
|---|---|---|
| A | Raditz (62) as active vs alive sideline | ✅ PASS — trace confirmed |
| B | Raditz vs Barnaby (326, Stubborn) | ❌ FAIL — no Stubborn check anywhere in codebase |
| C | Raditz vs opponent with no alive sideline | ✅ PASS — auto-skip confirmed |
| D | Grawr vs Nerina (no primers, no resources) | ✅ PASS — computeDuelPriority returns null, rolls unlock |
| E | Doug (63) Caution picker | ✅ PASS — trace confirmed, once-per-game guard wired |
| F | Double-fire protection | ✅ PASS (9/10 primers) + ⚠️ PARTIAL — Bogey has no within-turn pre-consume |

---

## Code Traces

### Scenario A — Raditz (62) vs Opponent with Alive Sideline

**Full call chain:**

1. `startBattle()` initializes `B.raditzHuntReady = { red: false, blue: false }` — **line 3359**
2. VS splash fires; `computeDuelPriority()` called at **line 3402** (pre-entry, `raditzHuntReady` still false — priority based on maxHP only at this point, used only for entry-animation ORDER)
3. `triggerEntry(firstTeam)` / `triggerEntry(secondTeam)` fire. When Raditz's team processes, **lines 3583–3591** execute:
   ```js
   if (f.id === 62 && !skipEntryEffects) {
     B.raditzHuntReady[teamName] = true;  // line 3588
   }
   ```
   (Only primed if `enemySideline.length > 0` — checked at line 3585)
4. `startNextRound()` called at **line 3416** (after entries resolve):
   - Calls `computeDuelPriority()` at **line 3329** — now `hasAnyDecision('red')` returns `true` because `raditzHuntReady['red']` is `true` (line 6008)
   - Returns `'red'` (or team with lower maxHP) — **not null**
   - Calls `enterDuelPhase(priority)` at **line 6254**
5. `enterDuelPhase(priority)` — **line 6254**:
   - Sets `B.phase = 'duel-1'`, `B.duelActiveTeam = priority`
   - Locks both roll buttons (lines 6262–6263)
   - Calls `_runDuelTeamTurn(priority)` at **line 6276**
6. `_runDuelTeamTurn(team)` — **line 6210**:
   - Calls `openDuelPhasePrimers(team)` at **line 6212** → returns `true` → exits immediately
7. `openDuelPhasePrimers(team)` — **line 6042**:
   - Raditz block fires at **line 6142**: `if (B.raditzHuntReady && B.raditzHuntReady[team])`
   - **Line 6143**: `B.raditzHuntReady[team] = false` — **cleared BEFORE overlay opens** ✅
   - `aliveSideline.length > 0` → does NOT auto-skip
   - `disableDone()` called — ✓ Ready button locked
   - `B.raditzHuntPending = { team, btn: doneBtn, oppBtn: null }` stored — **line 6156**
   - Populates `raditzHuntSub` text — **line 6157**
   - `raditzHuntOverlay.classList.add('active')` — **line 6159**
   - Returns `true`
8. Player clicks "Yes — force swap!" → `doRaditzHuntChoice('yes')` — **line 4712**
9. Opponent has multiple sideline choices → `pressureOverlay` opens; player picks; `doRaditzHuntSwap(team, idx)` — **line 4773**
10. Swap executes, entry effect fires, then **line 4806–4808**:
    ```js
    btn.disabled = false; btn.classList.remove('locked');
    doTeamRoll(team, btn);
    ```
    `btn` here is the **Done button** (from `B.raditzHuntPending.btn = doneBtn` in `openDuelPhasePrimers`)
11. `doTeamRoll` Duel Phase intercept — **line 5911**: catches `B.phase === 'duel-1'` → re-enables Done button → **returns without rolling** ✅
12. Player clicks ✓ Ready → `duelPhaseReady(team)` → advances to `duel-2` or `endDuelPhase()`

**Flag clear confirmed:** `B.raditzHuntReady[team] = false` at line 6143 fires **before** `raditzHuntOverlay` becomes active. `rollReady` at line 5559 also has phase guard (`if (B.phase === 'duel-1' || B.phase === 'duel-2') return;`) providing a second layer.

---

### Scenario B — Raditz vs Barnaby (326, Stubborn)

**Status: ❌ FAIL — Stubborn check is NOT implemented.**

The task brief asserted: *"The existing doRaditzHuntChoice handler at line ~4747 already has a Stubborn check that narrates 'Barnaby resists'."*

**This is incorrect.** A full grep for `Stubborn`, `Barnaby`, `barnaby`, `resists`, and `Cannot be swapped` across all 11,888 lines finds **zero** matches inside any choice handler or swap function. The only occurrences are:

- **Line 2256**: Ghost data definition — `ability:"Stubborn", abilityDesc:"Cannot be swapped out by opponent effects. Immune to forced switches."`
- **Line 2164**: Separate ghost's designNote mentioning forced swap immunity

The `doRaditzHuntChoice()` handler at lines 4712–4771 has:
- A "no sideline targets" guard at lines 4733–4738
- An auto-swap for single sideline at line 4746
- A multi-pick pressure overlay at lines 4750–4770
- **No Barnaby/Stubborn check anywhere**

The `doRaditzHuntSwap()` at lines 4773–4811 executes `enemy.activeIdx = targetIdx` unconditionally — **Barnaby gets swapped despite Stubborn**.

The `openDuelPhasePrimers` Raditz block at lines 6142–6161 also has **no Stubborn/Barnaby guard**.

**Result:** If Barnaby is the opponent's **active fighter**, Raditz's Hunt overlay opens, the player can click Yes, and `doRaditzHuntSwap` will swap Barnaby out — violating his stated ability. This is an unimplemented mechanic, not a passing scenario.

---

### Scenario C — Raditz vs Opponent with No Alive Sideline

**Status: ✅ PASS — auto-skip confirmed at line 6149.**

In `openDuelPhasePrimers`, the Raditz block first clears the flag at **line 6143**, then:

```js
// line 6146
const aliveSideline = enemy.ghosts.filter((g, i) => i !== enemy.activeIdx && !g.ko);

// lines 6149–6153
if (aliveSideline.length === 0) {
  narrate(`<b class="${team}-text">Raditz</b> — Hunt primed, but the opponent has no sideline ghosts to swap in.`);
  log(`Raditz — Hunt skipped in Duel Phase: opponent has no alive sideline.`);
  return false; // auto-skipped, no primer opened
}
```

Returns `false` → `_runDuelTeamTurn` continues:
- `hasAnyDecision(team)` re-checked: `raditzHuntReady[team]` is now `false` → primer check fails
- If no resources either → auto-advance fires with 600ms beat → `duelPhaseReady(team)` at **line 6219**
- If resources present → Ready left enabled for manual commit

The narration correctly says "no sideline ghosts to swap in" (not "no sideline ghosts" — same text as intended).

---

### Scenario D — Grawr vs Nerina (no primers, no pre-roll resources)

**Status: ✅ PASS — Duel Phase correctly skipped.**

Assuming both active fighters have no primer conditions and no resources:

1. `startNextRound()` at **line 6327** calls `computeDuelPriority()` — **line 6225**
2. `computeDuelPriority()` at **line 6229**:
   ```js
   if (!hasAnyDecision('red') && !hasAnyDecision('blue')) return null;
   ```
   Both `hasAnyDecision` calls return `false` (no matching ghost IDs, no resources) → returns `null`
3. `startNextRound()` else-branch at **line 6332–6339**:
   ```js
   B.phase = 'ready';
   B.duelActiveTeam = null;
   B.duelPriority = null;
   resetRollButtons();
   renderBattle();
   renderDuelUI();
   ```
4. `resetRollButtons()` at **line 6342**: unlocks both roll buttons, clears `.locked` and `.pulse` classes, re-enables them ✅
5. `renderDuelUI()` hides both Done buttons, removes `duel-locked` from both columns ✅

Duel Phase is **never entered** — `enterDuelPhase()` is never called. Both roll buttons are unlocked simultaneously. PASS.

---

### Scenario E — Doug (63) Caution Picker

**Status: ✅ PASS — trace confirmed.**

In `openDuelPhasePrimers`, Doug block at **lines 6164–6188**:

```js
if (f.id === 63 && B.dougCautionUsed && !B.dougCautionUsed[team]) {
  const mySideline = B[team].ghosts.filter((g, i) => i !== B[team].activeIdx && !g.ko);
  if (mySideline.length > 0) {
    disableDone();                                    // ✓ Ready locked
    B.dougCautionPending = { team, btn: doneBtn };   // line 6168
    // ... renders options, opens dougCautionOverlay
    return true;
  }
}
```

**Once-per-game guard:** `!B.dougCautionUsed[team]` — initialized `false` at **line 3360** in `startBattle()`.

- "No" path → `doDougCautionChoice('no')` at **line 4817**: sets `B.dougCautionUsed[team] = true` at **line 4825** — never offered again ✅
- "Yes" path → `doDougCautionSwap(targetIdx)` at **line 4834**: sets `B.dougCautionUsed[team] = true` at **line 4841** — never offered again ✅

Both paths then call `doTeamRoll(team, btn)` → Duel Phase intercept at **line 5911** re-enables Done button → player clicks ✓ Ready to advance.

**Notable:** `dougCautionUsed[team]` is NOT set by `openDuelPhasePrimers` before opening the overlay (unlike Raditz's flag clear). It is set inside the choice handler. Within the same turn, `openDuelPhasePrimers` is called once; no double-fire is possible because the Duel Phase flow requires Done to be clicked before `_runDuelTeamTurn` could be called again.

---

### Scenario F — Double-Fire Protection

**See Double-Fire Protection Matrix below.**

Short answer: 9/10 primers have solid guard patterns. Bogey is the outlier — if declined, `bogeyArmed` stays `false` and (within the same Duel Phase turn) `openDuelPhasePrimers` could in theory re-fire it. In practice this cannot happen because the Duel Phase flow is sequential (one `_runDuelTeamTurn` call per turn), but the code does NOT proactively consume the flag before opening the overlay, unlike Raditz.

---

## Double-Fire Protection Matrix

For each primer — the flag used to prevent double-fire, where it's consumed/cleared, and whether the consumption happens *before* the overlay opens (safest) or *after* resolution (depends on flow).

| # | Ghost | Flag Name | Cleared/Consumed Where | Line | Before Open? | `rollReady` Guard |
|---|---|---|---|---|---|---|
| 1 | Romy (114) | `romyPrediction[team]` | Set to a number in `doRomyChoice()` choice handler | 4470 | ❌ After resolve | ✅ line 5637: `== null` check |
| 2 | Toby (97) | `pureHeartDeclared[team]` | Set to `true`/`false` in `doTobyChoice()` | 4486/4492 | ❌ After resolve | ✅ line 5654: `=== null` check |
| 3 | Guardian Fairy (99) | `guardianFairyStandby[team]` | Set `true` in `doGuardianFairyChoice('yes')` | 4535 | ❌ After resolve | ✅ line 5993 in `hasAnyDecision` |
| 4 | Eloise (85) | `eloiseUsedThisRound[team]` | Set `true` in both branches of `doEloiseChoice()` | 4561/4572 | ❌ After resolve | ✅ line 5995 in `hasAnyDecision` |
| 5 | Mallow (89) | `mallowDecided[team]` | Set `true` in `doMallowChoice()` | 4588 | ❌ After resolve | ✅ line 5998 in `hasAnyDecision` |
| 6 | Bogey (53) | `bogeyArmed[team]` | Set `true` only on "yes" in `doBogeyChoice()` | 4635 | ❌ After resolve (yes only) | ✅ line 6001 in `hasAnyDecision` |
| 7 | Gus (31) | `galeForceDecided[team]` | Set `true` unconditionally in `doGusChoice()` | 4697 | ❌ After resolve | ✅ line 5798 in `rollReady` |
| 8 | Raditz (62) | `raditzHuntReady[team]` | `= false` at top of Raditz block in `openDuelPhasePrimers` | 6143 | ✅ **Before open** | ✅ line 5559 phase guard |
| 9 | Doug (63) | `dougCautionUsed[team]` | Set `true` in both branches of `doDougCautionChoice()` / `doDougCautionSwap()` | 4825/4841 | ❌ After resolve | ✅ line 5838 in `rollReady` |
| 10 | Fang Undercover (7) | `fangUndercoverArmed[team]` | Set `true` on "yes" in `doFangUndercoverArmChoice()` | 5356 | ❌ After resolve (yes only) | ✅ line 5838+  |

**Observations:**
- Raditz (row 8) is the **only** primer that clears its flag before the overlay opens. All others rely on the choice handler setting the flag after resolution, plus the `rollReady` Duel Phase early-return guard at line 5559 as a fallback.
- Bogey and Fang Undercover only update their flags on "yes" — on "no" the flag stays `false`. This is **by design** (both are re-offerable each round) but creates a theoretical window if `_runDuelTeamTurn` were ever called twice in the same turn (it isn't in current code).
- The `rollReady` phase guard at line 5559 (`if (B.phase === 'duel-1' || B.phase === 'duel-2') return;`) is a universal backstop — during Duel Phase, `rollReady` is completely gated, so no primer can be double-fired from the roll-button path.

**Round-reset confirmed (line 8795–8812):** `guardianFairyStandby`, `eloiseUsedThisRound`, `bogeyArmed`, `galeForceDecided`, `mallowDecided`, `fangUndercoverArmed`, and `romyPrediction` are all reset to `false`/`null` at the start of each new round's resolution block. `dougCautionUsed` and `raditzHuntReady` are **not** reset between rounds (intentional — both are once-per-game or once-per-entry flags).

---

## v406 Function Verification

### ✅ All 10 primers present in `openDuelPhasePrimers` (lines 6042–6202)

| Order | Ghost | Line in openDuelPhasePrimers |
|---|---|---|
| 1 | Romy (114) — Valley Guardian | 6052 |
| 2 | Toby (97) — Pure Heart | 6069 |
| 3 | Guardian Fairy (99) — Wish | 6078 |
| 4 | Eloise (85) — Change of Heart | 6089 |
| 5 | Mallow (89) — Dozy Cozy | 6105 |
| 6 | Bogey (53) — Bogus | 6119 |
| 7 | Gus (31) — Gale Force | 6127 |
| 8 | Raditz (62) — Hunt | 6142 |
| 9 | Doug (63) — Caution | 6164 |
| 10 | Fang Undercover (7) — Skilled Coward | 6191 |

### ✅ `hasAnyDecision` covers all 10 primer flags + committable resources (lines 5977–6031)

Primers checked (lines 5987–6014): Romy, Toby, Guardian Fairy, Eloise, Mallow, Bogey, Gus, Raditz, Doug, Fang Undercover — all 10 ✅

Resources checked (lines 6017–6028):
- `(r.ice + c.ice) > 0` — ice shard + committed ice ✅
- `(r.fire + c.fire) > 0` — sacred fire + committed fire ✅  
- `(r.surge + c.surge) > 0` — surge + committed surge ✅
- `r.healingSeed > 0 && f.hp < f.maxHp` — Healing Seed ✅
- `f.id === 208 && !f.ko` — Happy Crystal ✅
- `f.id === 309 && !f.ko && r && (r.healingSeed > 0 || (c && ...))` — Aunt Susan ✅

**Omitted by design (documented at lines 5973–5975):** Tyler (105) and Boo Brothers (17) — these depend on `B.preRoll.count` which isn't available until `doPreRollSetup()` fires at roll-click time. They remain accessible in `rollReady`.

### ✅ `_runDuelTeamTurn` auto-advance path (lines 6210–6223)

```js
function _runDuelTeamTurn(team) {
  if (!B) return;
  if (openDuelPhasePrimers(team)) return;   // primer opened → wait
  if (!hasAnyDecision(team)) {
    const f = active(B[team]);
    const name = f ? f.name : team;
    setTimeout(() => {
      narrate(`<b class="${team}-text">${name}</b> has nothing to commit — rolling!`);
      setTimeout(() => { duelPhaseReady(team); }, 350);  // line 6219
    }, 250);
  }
  // else: resources to commit — leave Ready enabled, wait for click
}
```

- Total auto-advance delay: **250ms + 350ms = 600ms** before `duelPhaseReady(team)` fires ✅
- `duelPhaseReady(team)` at **line 6279** advances `duel-1 → duel-2` or ends Duel Phase ✅

---

## Gaps / Risks Found

### GAP 1 — 🚨 CRITICAL: Barnaby (326) Stubborn Not Implemented

**Severity:** High  
**Location:** `doRaditzHuntChoice()` line 4712, `doRaditzHuntSwap()` line 4773, `openDuelPhasePrimers` line 6142  

Barnaby's `abilityDesc` states: *"Cannot be swapped out by opponent effects. Immune to forced switches."* His `designNote` says *"Anti-Winston, anti-Gus, anti-Raditz."*

Despite this, there is **no Stubborn check** in any swap-forcing handler: `doRaditzHuntSwap`, `doWinstonScheme`, `doGusSwap` (Gale Force), or `openDuelPhasePrimers`. Barnaby will be swapped out by all three abilities as if he had no ability. This is a pre-existing bug not introduced by v406, but v406 adds a new code path (`openDuelPhasePrimers`) where the check could have been added and wasn't.

**Fix needed:** Before opening `raditzHuntOverlay`, check if the opponent's active ghost has `id === 326`. If so, narrate resistance and return `false` (auto-skip). Same check needed in `doRaditzHuntSwap`, `doWinstonScheme` path, and Gus Gale Force swap.

---

### GAP 2 — ⚠️ MODERATE: No-Splash Startup Path Bypasses Duel Phase

**Severity:** Medium  
**Location:** `startBattle()` lines 3421–3433

The startup code wraps the entry-effects-then-`startNextRound()` flow in `if (splash)`. The else-branch (no `vsSplash` DOM element) falls back to directly calling `rBtn.disabled = false` without invoking `startNextRound()`:

```js
// line 3431–3432
if (rBtn) { rBtn.disabled = false; rBtn.classList.add('pulse'); }
if (bBtn) { bBtn.disabled = false; bBtn.classList.add('pulse'); }
```

If `vsSplash` were ever removed from the HTML (e.g., during debugging), the entire Duel Phase would be silently bypassed on Round 1 game start. `vsSplash` is confirmed in the HTML, so this is not a live bug — but it's a fragile pattern.

---

### GAP 3 — ⚠️ LOW: `openDuelPhasePrimers` Raditz block vs `doRaditzHuntChoice` Wiring Mismatch

**Severity:** Low  
**Location:** `openDuelPhasePrimers` line 6156 vs `doRaditzHuntChoice` lines 4712–4770

In the old `rollReady` path: `B.raditzHuntPending = { team, btn: rollBtn, oppBtn: oppBtn2 }` (both buttons are roll buttons).

In the new `openDuelPhasePrimers` path: `B.raditzHuntPending = { team, btn: doneBtn, oppBtn: null }` (`btn` is the Done button, `oppBtn` is null).

The choice handler `doRaditzHuntChoice` uses `oppBtn` for lines 4723–4724 and `btn` for line 4724. With `oppBtn: null`, the `if (oppBtn)` guards at lines 4723 and 4736 safely skip. The `doTeamRoll(team, btn)` call at line 4724 (Duel Phase context) intercepts at line 5911 and re-enables the Done button.

This is **functionally correct** — but the `btn` semantics change depending on which path opened the overlay (roll button vs Done button). If a future developer reads `doRaditzHuntChoice` without knowing about the Duel Phase path, they may be confused by the `btn` variable. A comment at line 4712 explaining the dual use would help.

---

### GAP 4 — ℹ️ NOTE: `smartAutoPlay.js` B State Missing v406 Fields

**Severity:** Low (autoplay only)  
**Location:** `smartAutoPlay.js` lines 43–55

The `smartAutoPlay` function constructs its own `B` state at lines 43–55 without including any v406 Duel Phase fields (`duelPhaseMode`, `duelActiveTeam`, `raditzHuntReady`, `dougCautionUsed`, etc.). When running `smartAutoPlay()` in the browser console against v406 code, any ability resolution that checks `B.duelPhaseMode` or `B.raditzHuntReady` will safely fall back to `undefined` (the `if (B.raditzHuntReady && ...)` guards are null-safe). The autoplay will complete without crashing, but Duel Phase primers won't fire. Autoplay stat results with primer-heavy teams (Raditz, Doug, Gus, etc.) will be inaccurate.

---

## Live Playtest Required

The following scenarios **cannot be fully verified statically** and need Wyatt at the browser:

### 🔴 P1 — Barnaby Stubborn Live Confirmation (Scenario B)
**Why:** The code has no Stubborn check. Live test needed to confirm Barnaby is indeed swapped (bug confirmed) vs any other guard that might exist.  
**Steps:** Red: [Raditz, anything, anything]. Blue: [Barnaby + 2 sideline]. Wait for Raditz Hunt overlay → click Yes → confirm Barnaby gets swapped (should narrate Hunt swap). Bug report to Wyatt.

### 🟡 P2 — Raditz Duel Phase Full Flow (Scenario A)
**Why:** The `doTeamRoll` Duel Phase intercept at line 5911 is the "re-enable Ready" mechanism — needs live confirmation that the Done button re-enables correctly after the swap resolves and before the player clicks Ready.  
**Steps:** Red: [Raditz + 2 sideline]. Blue: [any ghost + 2 sideline]. Start battle → Duel Phase should open → Hunt overlay appears → pick Yes → confirm Done/Ready button unlocks → click Ready → confirm duel-2 fires for Blue.

### 🟡 P3 — No Alive Sideline Auto-Skip + Resource Path (Scenario C variant)
**Why:** When Raditz has no enemy sideline AND has ice/fire resources, `hasAnyDecision` should return `true` (for resources), leaving Ready enabled for manual commit.  
**Steps:** Red: [Raditz + Eloise (ice resource) + anything]. Blue: [solo ghost, no sideline]. Confirm: Hunt overlay does NOT open, narration says "no sideline ghosts to swap in", Done button stays enabled, resource tiles are interactive.

### 🟡 P4 — Doug Caution in Duel Phase (Scenario E full UX)
**Why:** The `dougCautionOptions` inner HTML is rendered via `map()` in `openDuelPhasePrimers` — needs confirmation the picker renders correctly and the `doDougCautionSwap(realIdx)` onclick fires with the correct index.  
**Steps:** Red: [Doug + 2 sideline]. Blue: [any]. Start battle → if Red moves first in Duel Phase, Done/Ready should be locked, Doug Caution overlay should appear. Pick a sideline ghost. Confirm swap happens and Done button unlocks.

### 🟢 P5 — Auto-Advance Beat (Scenario D timing)
**Why:** The 600ms auto-advance (250ms narrator + 350ms `duelPhaseReady`) needs visual confirmation — does the narrator message display long enough before the Duel Phase advances?  
**Steps:** Any matchup where both teams have no decisions. Observe: narrator says "X has nothing to commit — rolling!" → approximately 600ms → Duel Phase transitions automatically.

### 🟢 P6 — Multi-Round Raditz: Hunt re-primes after swap-in
**Why:** In Round 2+, if Raditz was benched and gets swapped back in, `triggerEntry` re-primes `raditzHuntReady[team] = true`. Needs confirmation this correctly opens the Duel Phase Hunt overlay again (not just the rollReady path).

---

## Automated Test Harness

### `smart.js` and `smartAutoPlay.js` — Both present in `~/DrBango/testroom/`

**`autoPlay()` (built into index.html, line 2845):**  
A basic browser-console auto-play that runs full games using random teams with `autoPickTeam()`.  
```
// In browser console at http://localhost/testroom/ (or GitHub Pages):
autoPlay(5)   // runs 5 games
autoPlay(20)  // runs 20 games
```
This IS wired to the full `rollReady` / `doTeamRoll` flow. However, it auto-clicks through all **rollReady** primers but does NOT auto-resolve **Duel Phase Done buttons** — it will stall at the first Duel Phase turn because no automated click handler fires `duelPhaseReady()`.

**`smartAutoPlay()` (smartAutoPlay.js — paste into console):**  
An ability-aware simulation that runs headless game logic (not DOM). It constructs its own reduced `B` state (line 43 of smartAutoPlay.js) missing all v406 Duel Phase fields. Safe to run but will not exercise Duel Phase primers.  
```
// Paste smartAutoPlay.js contents into browser console, then:
smartAutoPlay(50)   // runs 50 headless simulated games
```

**`smart.js` — 618 lines, ability-aware AI decisions for rollReady path.**  
Contains `smartAutoPlay()` (same function name, different version than smartAutoPlay.js).

**Bottom line on autoplay:** Neither existing autoplay harness handles Duel Phase Done-button clicks. For v406 regression testing, autoPlay() will **hang** on any game where Duel Phase opens (i.e., any game with Raditz, Doug, Gus, Eloise, Mallow, Guardian Fairy, Bogey, Romy, Toby, Fang Undercover, or any ghost with ice/fire/surge resources). **A Duel Phase click handler for autoPlay is needed** (or a `--skip-duel-phase` flag on `computeDuelPriority`).

---

*Report generated 2026-04-11 by Corkscrew Games site agent (task #2 — v406 static playtest)*  
*Parallel tasks: #1 AUDIT_PRIMERS_V406.md (audit), #3 Tyler+Boo Brothers fix*  
*This file: read-only analysis, no changes to index.html*
