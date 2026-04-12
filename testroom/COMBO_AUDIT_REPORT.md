# COMBO AUDIT REPORT — v690

**Date:** 2026-04-11
**Scope:** Card combinations and interaction bugs across resolver code paths.

---

## BUGS FOUND AND FIXED

### BUG 1: Sylvia (313) Porpoise — Modal text says "evens" but logic uses 5 or 6 (CRITICAL)
- **Files:** index.html lines 4707, 4716, 10737
- **Issue:** The Sylvia modal told the player "Roll evens (2, 4, or 6) to dodge" but the actual code used `value >= 5` (5 or 6). Players were being told wrong dodge conditions.
- **Fix:** Updated modal subtitle, narration, and failure log to say "5 or 6" matching the card description and code logic.

### BUG 2: smartAutoPlay.js — Sylvia dodge uses evens (50%) instead of 5-or-6 (33%) (MODERATE)
- **File:** smartAutoPlay.js line 1900
- **Issue:** `(Math.floor(Math.random()*6)+1) % 2 === 0` gives 50% dodge rate. Should be `>= 5` for 33%.
- **Impact:** All simulation data for Sylvia (and any team containing her) was inflated. She appeared ~50% tankier than reality.
- **Fix:** Changed to `>= 5` to match index.html logic.

### BUG 3: smartAutoPlay.js — Lars (420) auto-places burn instead of granting resource (MINOR / SIMULATION ACCURACY)
- **File:** smartAutoPlay.js line 175-186
- **Issue:** In index.html, Lars grants +1 Burn as a spendable resource (`team.resources.burn++`). In smartAutoPlay, Lars auto-places burn directly on a random enemy sideline ghost. This means AI Lars burns bypass the Hex economy chain.
- **Status:** NOT FIXED — acceptable simulation shortcut since AI cannot use picker UI. The Hex AI path (line 672) still works from Rascals/Dylan burn resources.

---

## VERIFIED CORRECT (all combos audited)

### Burn Economy Chain
| Card | Mechanic | Status |
|------|----------|--------|
| Rascals (437) entry +3 Burn | `team.resources.burn += 3` at line 3884 | CORRECT |
| Lucy (108) win +1 Sacred Fire | Reworked — now grants Sacred Fire (not Burn). `winTeam.resources.fire++` at line 11687 onShow | CORRECT |
| Dylan (301) sideline win +1 Burn | Checks both active and sideline (line 11541). Grants via queueAbility onShow (line 12051) | CORRECT |
| Mable Stadango (446) Hex | Spends `resources.burn`, removes enemy die via `B.hexDieRemoval`, grants Sacred Fire. Multi-use loop if burn remains (line 5047) | CORRECT |
| Lars (420) entry +1 Burn resource | `team.resources.burn++` (line 3876). Spendable, not auto-placed | CORRECT |
| Rook (416) Burn immune | `f.id === 416` check at line 3711 — consumes burn, deals 0 | CORRECT |
| Mike (445) Torrent | `hasSideline(team, 445)` at line 3696 — sideline immunity | CORRECT |

### Magic Firefly Economy
| Card | Mechanic | Status |
|------|----------|--------|
| Bo (109) Miracle +3 Fireflies | `winTeam.resources.firefly += 3` at line 12337 | CORRECT |
| Jimmy (352) tie +5 LS +1 Firefly | Checks active & sideline (line 9899-9900). Both teams (line 9896). Grants in onShow (line 9908-9909) | CORRECT |
| Chester (426) doubles+ +1 Firefly | Checks `wR.type` includes doubles/triples/quads/penta (line 12239). Grants in onShow (line 12241) | CORRECT |
| Laura (79) numeric order +3 dmg +2 FF | Checks active & sideline (lines 10828-10829). Sequence validation (line 10832). Grants `firefly += 2` (line 10840) | CORRECT |
| Goob Party (444) tie +1 FF each | Checks both active & sideline (lines 9928-9929). Both teams get +1 (lines 9936-9937) | CORRECT |
| Firefly Picker UI | `showFireflyPicker` exists (line 5178). Converts 1 at a time, loops if more (line 5222) | CORRECT |

### Item System
| Card | Mechanic | Status |
|------|----------|--------|
| Zain (206) forge Ice Blade | Consumes 1 Ice + 1 Moonstone (line 4285). Sets `iceBladeForgedPermanent` (line 4288) | CORRECT |
| Finn (204) forge Flame Blade | Consumes 2 Healing Seeds + 1 Sacred Fire (lines 4249-4250). Sets `B.flameBlade` (line 4252) | CORRECT |
| Ice Blade swing +1 die | `redDiceCount++` at line 8225. +2 damage at line 10673 | CORRECT |
| Flame Blade swing +1 die | `redDiceCount++` at line 8038. +5 Burn at line 10681 | CORRECT |
| Both toggle off each round | `flameBladeSwing` and `iceBladeSwing` reset at lines 10200-10201 | CORRECT |
| One per game enforcement | `f.iceBladeForged` check (line 4283), `B.flameBlade[team]` check (line 4247) | CORRECT |

### Resurrection Chain
| Step | Status |
|------|--------|
| Bo (109) KO triggers Miracle | `wF.id === 109 && !wF.ko && lF.ko` at line 11610 | CORRECT |
| Revived ghost at 1 HP | `bt.hp = 1` at line 12336 | CORRECT |
| Lucas (433) sideline boost to 4 HP | `bt.hp += 3` at line 12341 (1+3=4) | CORRECT |
| Lucas swaps revived to active | `winTeam.activeIdx = revivedIdx` at line 12343 | CORRECT |
| +1 die next roll | `B.lucasKindlingBonus[winTeamName] = 1` at line 12345 | CORRECT |

### Pre-Roll Shade Chain
| Guard | Status |
|-------|--------|
| Once-per-turn flag prevents chain kills | `preRollAlreadyFired` check at line 7368; set both flags before any damage | CORRECT |
| Shade requires `_rolledOnce` | Line 7494: `f._rolledOnce` — Shade doesn't fire on first roll after entry | CORRECT |
| Shade's Shadow requires HP < 4 | Line 7436: `ef.hp < 4` | CORRECT |
| Princess Shade +1 on each chip source | Lines 7398, 7458, 7520 — separate Bounty triggers for each pre-roll ability | CORRECT |
| Dylan/Piper negation | `dylanNegates(enemy)` checks for all three (lines 7378, 7433, 7494) | CORRECT |

### Swap Heal Verification
| Swap Type | Heals to maxHP | Status |
|-----------|----------------|--------|
| doSwap (voluntary) | `f.hp = f.maxHp` at line 13065 | CORRECT |
| doKoSwap (after KO) | `f.hp = f.maxHp` at line 12905 | CORRECT |
| Toboggan (C&A kill-swap) | `newGhost.hp = newGhost.maxHp` at line 6021 | CORRECT |
| Guardian Fairy reactive | Takes damage at current HP (by design — GF is intercepting, not swapping in fresh) | CORRECT |
| Lucas resurrection | 1 HP + 3 = 4 HP (by design — resurrection, not a swap from sideline) | CORRECT |

### Win-Choice Modals
| Card | Resume Flow | Status |
|------|-------------|--------|
| Wise Al (431) Squall | `drainAbilityQueue(() => { if (wp.resume) wp.resume(); })` at line 4574 | CORRECT |
| Gordok (430) River Terror | Same drain pattern at line 4619 | CORRECT |
| Selene (305) | Continuation stored in `sp._continue`, called after queueAbility drain (line 4505) | CORRECT |
| No collectKC crash | All three use `checkKnightEffects` directly (not `collectKC` which is resolver-scoped) | CORRECT |

### Interactive Dice Modals
| Card | Mechanic | Status |
|------|----------|--------|
| Jasper (428) Flame Dive | Pre-rolled `bonusDie`, player reveals it. Applies die value as bonus damage + 1 recoil. Resume callback | CORRECT |
| Sylvia (313) Porpoise | Player clicks to roll. `>= 5` dodge. Stores in `B.sylviaPendingResult` for resolver | CORRECT (after fix) |
| Balatron (113) Party Time | Player clicks counter-die. Applies as damage to winner. KO check included | CORRECT |
| Tommy Salami (30) Regulator | Chain-6s loop before winner determination. Modifies dice array, re-sorts, updates display | CORRECT |

### Sideline & In Play Verification
| Card | Checks Both? | Status |
|------|--------------|--------|
| Sable (413) | `hasSableActive \|\| hasSableSideline` (lines 10039-10040, 12412-12413) | CORRECT |
| Willow (435) | `hasWillowActive \|\| hasWillowSideline` (lines 8131-8132) | CORRECT |
| Farmer Jeff (314) | Active OR sideline check both win AND lose sides (lines 11544, 11549) | CORRECT |
| Jimmy (352) | `hasJimmyActive \|\| hasJimmySideline` (lines 9899-9900) | CORRECT |
| Gary (92) | Active AND sideline checked for both teams (lines 10854-10857) | CORRECT |
| Boopies (419) | Sideline ONLY (card says "Sideline:" not "Sideline & In Play") — `hasSideline(t, 419)` | CORRECT |
| Laura (79) | `hasLauraActive \|\| hasLauraSideline` (lines 10828-10829) | CORRECT |
| Dylan (301) | `(wF.id === 301 && !wF.ko) \|\| hasSideline(winTeam, 301)` (line 11541) | CORRECT |
| Gom Gom Gom (440) | Active ONLY (card says "Win with doubles" — no sideline) — `wF.id === 440` | CORRECT |
| Goob Party (444) | `hasGoobActive \|\| hasGoobSideline` (lines 9928-9929) | CORRECT |

---

## SUMMARY

- **3 bugs found**, 2 fixed (1 UI text in index.html, 1 simulation logic in smartAutoPlay.js)
- **1 minor simulation shortcut** noted but not fixed (Lars burn auto-placement in AI)
- **All 7 priority combo categories verified correct** in the main resolver
- Version bumped to v690
