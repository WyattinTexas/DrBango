# Modal Primer Audit vs Duel Phase (v406)

_Audited: 2026-04-11 by web-dev agent (claude-sonnet-4-6)_
_Scope: index.html — all cards in GHOSTS array, all pre-roll ability handlers_

---

## Summary

| Metric | Count |
|---|---|
| Total cards audited | 108 (across Set 1, Dark Castle, Frost Valley, Volcanic Activity, Rolling Hills; IDs 407–431 are gallery-only stubs — zero battle logic, excluded) |
| Pre-roll-modal primers found | 12 |
| Covered by v406 openDuelPhasePrimers | 10 |
| **Missing from v406 (BROKEN — needs fix)** | **2** |
| Missing from hasAnyDecision (silent skip risk) | 3 |

---

## Covered ✅

These 10 primers are wired into `openDuelPhasePrimers(team)` (lines 6042–6201) and their trigger conditions are also present in `hasAnyDecision(team)` (lines 5977–6031).

| Ghost (id) | Primer name | Handler | hasAnyDecision check |
|---|---|---|---|
| Romy (114) | Valley Guardian — predict a die value | `romyOverlay` / `B.romyPending` | yes — `f.id === 114 && B.romyPrediction[team] == null` |
| Toby (97) | Pure Heart — declare all-in gamble | `tobyOverlay` / `B.tobyPending` | yes — `f.id === 97 && pureHeartDeclared[team] === null` |
| Guardian Fairy (99) | Wish — put on standby (sideline) | `guardianFairyOverlay` / `B.guardianFairyPending` | yes — `hasSideline(99) && !guardianFairyStandby[team]` |
| Eloise (85) | Change of Heart — spend 1 Ice Shard to swap HP | `eloiseOverlay` / `B.eloisePending` | yes — `f.id === 85 && !eloiseUsedThisRound && ice >= 1` |
| Mallow (89) | Dozy Cozy — spend 1 Sacred Fire for +3 HP (sideline) | `mallowOverlay` / `B.mallowPending` | yes — `hasSideline(89) && !mallowDecided && fire >= 1` |
| Bogey (53) | Bogus — arm one-time damage reflect | `bogeyOverlay` / `B.bogeyPending` | yes — `f.id === 53 && !bogeyUsed && !bogeyArmed[team]` |
| Gus (31) | Gale Force — opt-in force-swap on win | `gusOverlay` / `B.gusPending` | yes — `f.id === 31 && !galeForceDecided && opp has sideline` |
| Raditz (62) | Hunt — force opponent's active to sideline (one-time entry) | `raditzHuntOverlay` / `B.raditzHuntPending` | yes — `B.raditzHuntReady[team]` |
| Doug (63) | Caution — once-per-game self-swap for +1 die | `dougCautionOverlay` / `B.dougCautionPending` | yes — `f.id === 63 && !dougCautionUsed && my sideline exists` |
| Fang Undercover (7) | Skilled Coward — arm dodge before rolling | `fangUndercoverArmOverlay` / `B.fangUndercoverPending` | yes — `f.id === 7 && !fangUndercoverArmed && my sideline exists` |

---

## BROKEN ❌ (stranded in rollReady, deferred from v406)

### Tyler (id 105) — Heating Up

**Current handler location:** `rollReady()` at approximately line 5667–5681, inside the `if (B.phase === 'ready')` first-click block.

**Why it is stranded:** Tyler's modal reads `B.preRoll[team].count` to show the current die count ("X dice → X−1 dice"). `B.preRoll` is not populated until `doPreRollSetup()`, which runs at roll-click time — AFTER the Duel Phase primer window has already closed. There is no `B.tylerPending` state stored before Duel Phase, no Tyler check in `openDuelPhasePrimers()`, and no Tyler check in `hasAnyDecision()`. The comment at line 5973 explicitly acknowledges this deferral: _"NOTE: Tyler (105) and Boo Brothers (17) are omitted because they require B.preRoll.count which isn't set until doPreRollSetup."_

**Consequence in Duel Phase:** When both teams enter Duel Phase and Tyler's owner has no other decisions (no resources to commit), `hasAnyDecision()` returns false and `_runDuelTeamTurn()` auto-advances ("has nothing to commit — rolling!") before the player ever sees the Heating Up choice. The player loses their HP-for-die trade silently every round.

**Fix prescription:** Create a `B.tylerDiceCount` snapshot field during `enterDuelPhase()` (or at the start of `_runDuelTeamTurn()`) using the pre-roll die count formula — the same logic `doPreRollSetup()` would use but run early. Then add a Tyler check to both `openDuelPhasePrimers()` (open `tylerOverlay` using the snapshot count) and `hasAnyDecision()` (`f.id === 105 && f.hp >= 3`). The `doTylerChoice()` handler already exists and works correctly — it only needs to be reachable via Duel Phase. The snapshot approach avoids any dependency on `B.preRoll` and is consistent with how Boo Brothers should be fixed.

---

### Boo Brothers (id 17) — Teamwork

**Current handler location:** `rollReady()` at approximately line 5743–5763, inside the `if (B.phase === 'ready')` first-click block.

**Why it is stranded:** Boo Brothers reads `B.preRoll[team].count` to display the die count in the modal ("X dice → X−1 dice") and enforces the guard `B.preRoll[team].count >= 2` (must have at least 2 dice to trade one). `B.preRoll` does not exist until `doPreRollSetup()` fires at roll-click time. There is no `B.booPending` state initialized before Duel Phase, no Boo Brothers check in `openDuelPhasePrimers()`, and no Boo Brothers check in `hasAnyDecision()`. The same comment at line 5973 covers this explicitly.

**Consequence in Duel Phase:** Identical to Tyler — `hasAnyDecision()` returns false (assuming no other decisions), `_runDuelTeamTurn()` auto-advances, and the player loses the die-for-HP trade opportunity silently every round. At 5 HP with no dice-reducing effects in play, Boo Brothers would have exactly 3 dice (standard), so the trade is always valid but never offered.

**Fix prescription:** Add a `B.booDiceSnapshot` field initialized early in `_runDuelTeamTurn()` using the same pre-roll die count logic, gated on `f.id === 17 && f.hp < f.maxHp`. Add a Boo Brothers check to `openDuelPhasePrimers()` using the snapshot count (guard: snapshot >= 2) and to `hasAnyDecision()` (`f.id === 17 && f.hp < f.maxHp` — hp-below-max is the meaningful condition since if already at max HP trading a die for 1 HP that overclocks is still valid but the original rollReady code doesn't gate on HP). The `doBooChoice()` handler is already complete — it just needs to be called from Duel Phase.

---

## hasAnyDecision GAPS

These primers ARE opened by `openDuelPhasePrimers()` in v406 but their corresponding conditions in `hasAnyDecision()` have subtle discrepancies or missing nuance that could cause silent skips.

### 1. Raditz (62) — Hunt (silent auto-skip path)

`hasAnyDecision()` returns `true` whenever `B.raditzHuntReady[team]` is truthy (line 6008). But `openDuelPhasePrimers()` includes an **auto-skip** path (lines 6149–6153): if the opponent has no alive sideline ghosts, it clears `raditzHuntReady[team] = false`, narrates a skip, and returns `false`. This means `hasAnyDecision()` may force Duel Phase to open for Raditz's team (preventing auto-advance), then `openDuelPhasePrimers()` immediately returns false and falls through to resource-commit mode — where the player is presented a Done button but may have nothing to commit. This is a UX friction rather than a hard bug (the game does not break), but it means Duel Phase is entered unnecessarily and the player must click Done for no reason.

**Risk:** Low severity — game is not broken, but wastes a click. Fix: add the opponent-has-alive-sideline guard to the `hasAnyDecision()` Raditz check.

### 2. Gus (31) — Gale Force (opponent sideline required)

`hasAnyDecision()` already checks `gOpp.ghosts.some(...)` for an alive sideline ghost (lines 6003–6006), which matches the `openDuelPhasePrimers()` guard. However, `openDuelPhasePrimers()` has an additional inner guard (`gOppHasSideline` at line 6129) that skips the modal if the check fails. The conditions are duplicated correctly and are in sync. **No active gap** — noted for completeness.

### 3. Smudge (403) — Blackout (not in hasAnyDecision at all)

Smudge's Blackout is a pre-roll ability rendered as an inline number-picker in the ability-button bar (`renderAbilityButtons()` at line 11681). It uses `isPreRollActive(team)` as its gate and `setBlackout()` as its handler — both work during Duel Phase because `isPreRollActive()` returns true when `B.duelActiveTeam === team`. However, Smudge (403) is **entirely absent from `hasAnyDecision()`** and **absent from `openDuelPhasePrimers()`**. This means:

- If Smudge is active and the team has no other decisions (no resources to commit), `hasAnyDecision()` returns false, `_runDuelTeamTurn()` auto-advances, and the player **never sees the Blackout picker** during Duel Phase.
- When the player DOES have other decisions (resources), Duel Phase stays open and the Blackout picker renders in the ability bar — so it accidentally works in that case only.

**Risk:** Medium severity — Blackout is silently skipped in Duel Phase for resource-empty teams. Fix: add `f.id === 403 && !f.ko` to `hasAnyDecision()`. No `openDuelPhasePrimers()` change needed since Blackout is an inline picker, not a modal — but `hasAnyDecision()` must return true to prevent auto-advance.

---

## Non-modal primers (verified working)

These cards have pre-roll interactive buttons but no overlay/picker modal. They are gated by `isPreRollActive(team)` which correctly returns `true` during Duel Phase when it is that team's turn. They do NOT use `openDuelPhasePrimers()` but they DO (or should) appear in `hasAnyDecision()` to prevent silent auto-advance.

### Harrison (315) — Ascend

**Handler:** `toggleHarrison(team)` / `uncommitHarrison(team)`, gated by `isPreRollActive`. Renders a button in `renderAbilityButtons()` at line 11638.

**hasAnyDecision check:** Implicit via the Healing Seed resource check (`r.healingSeed > 0 && f.hp < f.maxHp` — line 6023) when Harrison is the active ghost. However, Harrison can have committed seeds (`B.committed[team].harrison > 0`) with no remaining unspent seeds — in that case `r.healingSeed` could be 0 but the commit button is still live. The `hasAnyDecision()` resource check covers the seed-holding case correctly. **Status: working, minor edge case noted.**

### Finn (204) — Forge (sideline)

**Handler:** `useFinnForge(team, kind)` at line 3916, gated by `isPreRollActive`. Renders buttons at line 11643.

**hasAnyDecision check:** The resource check (`r.ice > 0` or `r.fire > 0`) at lines 6018–6019 returns true whenever the team has ice or fire. If Finn is on the sideline and the team has ≥ 2 Ice Shards or ≥ 2 Sacred Fires, Duel Phase stays open. The check is not Finn-specific but fires correctly as a side effect of the resource tile check. **Status: working via resource tile check — no dedicated Finn check needed.**

### Tyson (365) — Hop

**Handler:** `useTysonHop(team)` at line 4038, gated by `isPreRollActive`. Renders a button at line 11630.

**hasAnyDecision check:** Tyson (365) is **not in `hasAnyDecision()`**. The Hop button renders correctly during Duel Phase (because `isPreRollActive` returns true), but only if the player already has other decisions keeping Duel Phase open. If Tyson is active, has alive sideline ghosts, and the team has zero resources to commit — `hasAnyDecision()` returns false, `_runDuelTeamTurn()` auto-advances, and the Hop button is never rendered. **Risk:** Medium severity — same silent-skip pattern as Smudge. Fix: add `f.id === 365 && !f.ko && B[team].ghosts.some((g,i) => i !== B[team].activeIdx && !g.ko)` to `hasAnyDecision()`.

### Zain (206) — Ice Blade

**Handler:** `useZainForge(team)` / `toggleZainBlade(team)`, gated by `isPreRollActive`. Renders at line 11665.

**hasAnyDecision check:** Partially covered. The Forge step requires 1 Ice Shard + 1 Moonstone; the resource check at lines 6017–6021 returns true when ice > 0. But the Ice Blade swing toggle (after forging) is a pure opt-in commit with no resource cost — if ice and fire and surge are all 0 after forging, `hasAnyDecision()` returns false and auto-advance swallows the swing decision. **Risk:** Medium severity for the swing-toggle case. Fix: add `f.id === 206 && !f.ko && f.iceBladeForged && !(B.committed[team].zainBlade > 0)` to `hasAnyDecision()`.

### Death Howl (202) — Pressure

**Handler:** `usePressure(team)` at line 4066, gated by `isPreRollActive`. Renders a button at line 11623.

**hasAnyDecision check:** Death Howl (202) is **not in `hasAnyDecision()`** at all. Same silent-skip risk as Smudge and Tyson: if Death Howl is active, the opponent has sideline ghosts, `pressureUsed` is false, and the team has no resources — `hasAnyDecision()` returns false, Duel Phase auto-advances, and Pressure is never offered. **Risk:** Medium severity. Fix: add `f.id === 202 && !f.ko && !dylanNegates(opp(B[team])) && !(B.pressureUsed && B.pressureUsed[team]) && opp(B[team]).ghosts.some((g,i) => i !== opp(B[team]).activeIdx && !g.ko)` to `hasAnyDecision()`.

### Aunt Susan (309) — Harvest Dance

**Handler:** `cycleCommit(team, ...)` and related, gated by `isPreRollActive`. Renders resource commit tiles.

**hasAnyDecision check:** Explicitly present at lines 6027–6028: `f.id === 309 && !f.ko && r && (r.healingSeed > 0 || c.auntSusan > 0 || c.auntSusanHeal > 0)`. **Status: working.**

### Happy Crystal (208) — Spark Strike

**Handler:** Sacrifice button gated by `isPreRollActive` (rendered in the fighter card area).

**hasAnyDecision check:** Explicitly present at line 6025: `f.id === 208 && !f.ko`. **Status: working.**

---

## Non-modal primers — cards with no Duel Phase interaction needed

The following cards have pre-roll effects but they are **automatic** (no player choice required) and are handled entirely in `doPreRollSetup()`. They do not need entries in `openDuelPhasePrimers()` or `hasAnyDecision()`.

| Ghost (id) | Ability | Trigger type | Notes |
|---|---|---|---|
| The Ember Force (304) | Swarm | auto pre-roll damage | Runs in doPreRollSetup |
| Shade's Shadow (205) | Meltdown | auto sideline pre-roll damage | Runs in doPreRollSetup |
| Shade (111) | Haunt | auto pre-roll damage (round 2+) | Runs in doPreRollSetup |
| Splinter (101) | Toxic Fumes | auto pre-roll damage after first win | Runs in doPreRollSetup |
| Timber (210) | Howl | opponent-facing forced choice modal | Handled in doPreRollSetup via B.timberPending + showTimberModal in rollReady; NOT a Duel Phase primer since it is the OPPONENT being forced to choose, not the active player |
| Bouril (201) | Slumber | auto die override (1-2-3) | Runs in doPreRollSetup |
| Katrina (70) | Seeker | auto HP gain if behind | Runs in doPreRollSetup |
| Shoo (13) | Alpine Air | auto sideline HP gain | Runs in doPreRollSetup |
| Cyboo (100) | Spark | auto sideline die boost | Runs in doPreRollSetup |

**Note on Timber (210) specifically:** Timber's Howl generates a `B.timberPending` object for the OPPONENT to resolve. This is correctly handled in `rollReady()` at line 5591 — it is not a same-team Duel Phase primer. Timber's own team has no interactive choice to make. The Timber design note in the GHOSTS array (id 210) states the OPPONENT chooses, which is why this correctly lives outside the Duel Phase primer system.

---

## Staging cards (IDs 407–431) — excluded from audit

Per the GHOSTS array comment at line 2278: _"These 25 cards (12 Volcanic Activity + 13 Rolling Hills) were designed by the cards agent overnight. abilityDesc is written but NO handlers, entry effects, or sideline checks exist for any of these IDs."_ These cards have no battle logic. Spout (415) has a pre-roll-modal ability description ("declare a number 1–6") but zero handler code exists. None of the IDs 407–431 appear in any handler, `hasAnyDecision`, or `openDuelPhasePrimers`. They are excluded from this audit's scope as designed.

---

## Full Card Classification

### Pre-roll-modal (player choice, opens overlay before dice)
| Ghost (id) | Ability | v406 Status |
|---|---|---|
| Romy (114) | Valley Guardian — predict die | ✅ covered |
| Toby (97) | Pure Heart — declare gamble | ✅ covered |
| Guardian Fairy (99) | Wish — standby (sideline) | ✅ covered |
| Eloise (85) | Change of Heart — HP swap | ✅ covered |
| Mallow (89) | Dozy Cozy — fire for HP (sideline) | ✅ covered |
| Bogey (53) | Bogus — arm reflect | ✅ covered |
| Gus (31) | Gale Force — opt-in swap-on-win | ✅ covered |
| Raditz (62) | Hunt — entry forced-swap | ✅ covered (auto-skip UX gap) |
| Doug (63) | Caution — once-per-game self-swap | ✅ covered |
| Fang Undercover (7) | Skilled Coward — arm dodge | ✅ covered |
| Tyler (105) | Heating Up — HP for die | ❌ BROKEN — stranded in rollReady |
| Boo Brothers (17) | Teamwork — die for HP | ❌ BROKEN — stranded in rollReady |

### Pre-roll button (inline, no overlay) — Duel Phase interactive
| Ghost (id) | Ability | hasAnyDecision? | Risk |
|---|---|---|---|
| Death Howl (202) | Pressure — button trigger swap | ❌ missing | Medium — silent skip |
| Tyson (365) | Hop — button self-swap | ❌ missing | Medium — silent skip |
| Smudge (403) | Blackout — inline number picker | ❌ missing | Medium — silent skip |
| Zain (206) | Ice Blade swing toggle | ⚠️ partial (forge covered, swing not) | Medium — swing silently skipped |
| Harrison (315) | Ascend — seeds for dice | ✅ (via healingSeed resource check) | Low |
| Finn (204) | Forge — sideline conversion | ✅ (via resource tile check) | Low |
| Aunt Susan (309) | Harvest Dance — commit seeds | ✅ explicit check | None |
| Happy Crystal (208) | Spark Strike — sacrifice | ✅ explicit check | None |

### Automatic pre-roll (no player choice)
| Ghost (id) | Ability | Location |
|---|---|---|
| The Ember Force (304) | Swarm — 1 dmg before roll | doPreRollSetup |
| Shade's Shadow (205) | Meltdown — sideline chip | doPreRollSetup |
| Shade (111) | Haunt — 1 dmg after R1 | doPreRollSetup |
| Splinter (101) | Toxic Fumes — 1 dmg after first win | doPreRollSetup |
| Timber (210) | Howl — opponent forced choice | doPreRollSetup → rollReady modal |
| Bouril (201) | Slumber — auto 1-2-3 first roll | doPreRollSetup |
| Katrina (70) | Seeker — auto HP if behind | doPreRollSetup |
| Shoo (13) | Alpine Air — auto sideline HP | doPreRollSetup |
| Cyboo (100) | Spark — sideline die boost | doPreRollSetup |

### Entry (on arena enter)
Raditz (62), Grawr (34), Jenkins (94), Redd (98), Bo (109), Chad (56), Nerina (306), Timpleton (312), Hermit (47), Tadpole (358), Glorp (407†), Ember Mole (414†), Gourdling (420†), Digby (424†), Pickwick (428†)

### On-roll-win
Dart (209), Spockles (81), Ashley (58), Sad Sal (29) [on loss], Flora (75), Munch (66), Troubling Haters (83), Selene (305) [doubles], Nikon (2), Hank (207) [on 4], Scorch (317), Clink (329), Cluck (340), Calvin (342), Artemis (307), Brimstone (408†), Cindergrub (409†), Glass Fang (410†), Fumarole (411†), Obsidian Eel (413†), Hesta (417†), Pip (418†), Chester (426†), Brock (427†)

### Sideline-passive
Jeffery (14), Villager (11), Shoo (13), Ancient One (22), Cornelius (45), Cyboo (100), Dark Jeff (74), Tabitha (95), Lou (32), Sandwiches (33), Bilbo (80), Laura (79), Gary (92), Admiral (71), Zach (87), Pale Nimbus (88), Bandit Pete (93), Suspicious Jeff (61), Farmer Jeff (314), Granny (310), Tweak and Twonk (303), Shade's Shadow (205), Dylan (301), Needle (21), Pumice (319), Bracken (422†), Biscuit (324), Wisp (344), Snoozer (330), Hedgeling (419†), Rushwick (425†)

### Resource-generator / on-KO / end-of-round / misc
All remaining cards. Full list omitted for brevity — none have pre-roll interactive requirements.

---

## Audit Methodology

1. **Obtained full card list** by grepping `id:\d+, name:` across index.html — 221 occurrences identified (including duplicates in the UI and handler sections). Unique cards: ~108 with battle logic, 25 gallery-only stubs (IDs 407–431).

2. **Read `openDuelPhasePrimers()` in full** (lines 6042–6201) — identified the 10 primers wired into Duel Phase and the order they are checked.

3. **Read `hasAnyDecision()` in full** (lines 5977–6031) — cross-checked every condition against the primers and interactive buttons.

4. **Read `rollReady()` in full** (lines 5556–5903) — identified Tyler (105) and Boo Brothers (17) in the `if (B.phase === 'ready')` first-click block, confirmed they are absent from Duel Phase via the explicit comment at lines 5973–5975.

5. **Read `doPreRollSetup()` from line 6364 onward** — catalogued all automatic pre-roll effects (Ember Force, Shade's Shadow, Shade, Splinter, Timber Howl, Bouril, Katrina, Shoo, Cyboo) that require no player input and are correctly handled outside the primer system.

6. **Read `renderAbilityButtons()` section** (lines 11618–11693) — identified all pre-roll inline buttons (Death Howl Pressure, Tyson Hop, Harrison Ascend, Finn Forge, Zain Ice Blade, Smudge Blackout) and verified each is gated by `isPreRollActive(team)`.

7. **Cross-referenced each inline button** against `hasAnyDecision()` to find missing entries (Death Howl 202, Tyson 365, Smudge 403, Zain 206 swing).

8. **Checked IDs 407–431** — confirmed zero battle handler code for any of these IDs. Spout (415) has a pre-roll-modal description but is gallery-only. Excluded from audit scope.

9. **Reviewed GHOSTS array ability descriptions** card by card for any "Before rolling" language not yet covered — no additional stranded primers found beyond Tyler and Boo Brothers.

To replicate this audit: search for `"Before rolling"` in the GHOSTS abilityDesc fields, collect every card ID, then trace each ID through `openDuelPhasePrimers()`, `hasAnyDecision()`, and `renderAbilityButtons()`. A card with a "Before rolling" ability that does not appear in any of those three is either auto-trigger (check `doPreRollSetup()`) or broken.
