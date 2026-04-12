# Automated Playtest Report — v695

## Phase 1: Code Analysis Findings

### A) New Cards (IDs 409-448) — Ability Code Path Trace

All 25 new cards (409-448) have been traced through their full code paths:

**Cards with FULL battle logic implemented:**
- Nick & Knack (409) — Knick Knack: pre-roll resource steal + 3 HP. Interactive picker. Sim mirrors.
- Mirror Matt (410) — Seven Years: doubles reflect. Both paths correct.
- Sable (413) — Smoldering Soul: all-odd fire gen. Fires in tie, win, and loss paths. Sim mirrors.
- Chow (414) — Secret Ingredient: pre-roll seed-for-dice. Repeatable. Boopies trigger present.
- Nyx & Bessie (415) — Moo! Caw!: sideline KO trigger. +4 seeds. Sim mirrors.
- Rook (416) — Charcoal: Sacred Fire immunity + Surge damage. Both defensive and offensive paths correct.
- Twyla (417) — Lucky Dance: Lucky Stone spending grants dice + seeds. Sim mirrors via LS section.
- Pip (418) — Toasted: triples+ permanent die removal. Once-per-game flag. Fires in all 3 outcome paths.
- Boopies (419) — Boopie Magic: sideline seed-spend trigger. Present in Chow, Cultivate, and useHealingSeed handlers.
- Lars (420) — Light the Way: entry resources. Fixed sim mismatch (see fixes below).
- Zippa (423) — Glimmer: pre-roll Lucky Stones from seeds. Sim mirrors.
- Bigsby (424) — Omen: +1 damage + Moonstone sacrifice transform to Doom. Transform preserves identity for standings.
- Chester (426) — Well Read: tiered win rewards. Sim mirrors.
- Garrick (427) — Watchfire: -1 damage on loss + KO fire gain. Both paths present.
- Jasper (428) — Flame Dive: interactive bonus die modal + self-damage. Sim mirrors with auto-resolve.
- Young Cap (429) — Energize: seed spending grants HP/die/ice/surge. Sim mirrors.
- Gordok (430) — River Terror: steal-or-damage choice modal. +1 die + 1 Moonstone. Sim auto-steals.
- Wise Al (431) — Squall: ice-or-damage choice modal. Sim auto-picks ice when < 6.
- Valkin (432) — Grand Spoils: KO resource burst. Old Vela resurrection code correctly removed.
- Lucas (433) — Kindling: resurrection sideline payoff. +3 HP + 1 die on revive. Sim mirrors.
- Willow (435) — Joy of Painting: +1 die after loss. Sideline + in play. willowLostLast flag set/cleared correctly in all 3 outcome paths.
- Princess Shade (436) — Bounty: +1 pre-roll chip damage. Present on all 5 pre-roll damage sources.
- Rascals (437) — Stampede: entry +3 Burn. Sim mirrors.
- Champ (438) — Overpower: Special immunity + doubles Surge gen. Both paths correct.
- Lucy's Shadow (439) — Mentor: doubles Lucy's Sacred Fire output. Sim mirrors in both fire commit and win-path.
- Gom Gom Gom (440) — Chaos: doubles win fire. Sim mirrors.
- Wendy (441) — Moonbeam: doubles+ win Moonstone + Firefly. Sim mirrors with Sandwiches.
- Castle Gardener (442) — Cultivate: repeatable seed-to-fire converter. Boopies trigger present.
- Captain James (443) — Final Strike: triples+ fire gen (win or lose). Sim mirrors.
- Goob Party (444) — Dance Break: tie Firefly for both teams. goobFired flag prevents double-fire when both teams have it.
- Mike (445) — Torrent: +1 win damage + Burn immunity for sideline. Sim mirrors.
- Mable Stadango (446) — Hex: Burn-for-die-removal button. Sim mirrors.
- Professor Hawking (447) — Wisdom: +2 dice while holding Moonstone. Sim mirrors.
- Harvey (448) — Harvest Moon: win Moonstone per 5 rolled. Sim mirrors with Sandwiches.

### B) Cross-Card Interaction Audit

1. **Castle Gardener (442) + 0 seeds**: Safe — handler checks `healingSeed >= 1` before decrement, overlay re-offer only fires if seeds remain.
2. **Mable Stadango (446) + burn goes to 0**: Safe — useHex checks `burn >= 1` on entry, button re-renders after each use via renderBattle().
3. **Tommy Salami (30) chain 6s**: Safe — while loop terminates when bonus dice stop rolling 6s. Sim caps at 50 rounds. No infinite loop possible.
4. **Goob Party (444) on BOTH teams**: Safe — `goobFired` flag prevents double-fire. Correctly fires once, grants Firefly to both teams.
5. **Bigsby (424) → Doom + Bo resurrection**: Safe — Bo's Miracle block checks `bt.originalId` and restores original identity before resurrection.
6. **Guardian Fairy (99) + Mirror Matt (410)**: Guardian Fairy only fires when `dmg > 0 && !kingJayReflected` — Mirror Matt sets `dmg = 0` and `mirrorMattReflected = true` before GF check. GF correctly skipped.
7. **Wise Al (431) / Gordok (430) during Duel Phase**: Choice modals use `B.wiseAlPending` / `B.gordokPending` deferred pattern — modal fires post-damage, not mid-phase. No conflict.
8. **Willow (435) on both teams**: Both teams independently check `B.willowLostLast[tName]`. Each team's flag is set independently. No interference.
9. **Princess Shade (436) + Bogey (53)**: Bogey reflects damage to 0 BEFORE Princess Shade's Bounty context. Bounty only fires on pre-roll chip damage, not win-path. No conflict.

### C) SmartAutoPlay Sync Audit

All cards with id >= 400 verified. State fields, triggers, resource grants, and dice modifications match between index.html and smartAutoPlay.js.

### D) UI Button Rendering Audit

All interactive pre-roll buttons verified:
- Chow (414): shows when active + seeds >= 1, repeatable
- Castle Gardener (442): shows when active + seeds >= 1, repeatable
- Mable Stadango (446): shows when active + burn >= 1, click decrements and re-renders
- Tyson (365): shows when alive sideline exists, Dylan blocks
- Harrison (315): shows when seeds > 0 or committed > 0, right-click uncommits
- Finn (204): forge when resources available, swing toggle after forge
- Zain (206): forge when resources available, swing toggle after forge
- Nick & Knack (409): interactive resource picker, skips if opponent has 0 resources
- Blackout (403): 6-button picker, persists selection

---

## Phase 2: Bugs Fixed

### BUG 1: Lars (420) smartAutoPlay entry placed Burn on enemy sideline instead of giving as resource
**Severity:** Medium — sim results diverged from real gameplay
**Fix:** smartAutoPlay entry block now gives Burn as a team resource (matching index.html)

### BUG 2: Hex callout used "Forest Spirit" instead of card name "Mable Stadango"
**Severity:** Cosmetic — confusing callout text
**Fix:** All Hex callout text in dice-count consumption section now says "Mable Stadango"

### BUG 3: Lucy/Humar smartAutoPlay damaged the WRONG team
**Severity:** HIGH — `active(enemy)` was being damaged instead of `active(team)`. The pending damage flag is on the TARGET team, so `active(team)` should take the damage.
**Fix:** Corrected to damage `active(team)` (the team holding the flag). Also corrected Dylan check to use target team's sideline, and Princess Shade to use attacker (enemy) sideline.

---

## Phase 3: Jeffery Chuckle Debug Breadcrumb

Added `console.log('[CHUCKLE DEBUG]', { hasSideline, wFko, lFko, cornelius, filbert })` before the Jeffery (14) Chuckle gate at line ~12277. This fires on EVERY win (not just when Jeffery is present) so Wyatt can see the full state when Patrick vs Shade scenarios play out.

**Key finding:** Jeffery Chuckle requires `lF.ko === true` (enemy must be DEFEATED, not just take damage). If Patrick wins against Shade but Shade survives the roll, Chuckle will NOT fire. The debug log will confirm this.

---

## Phase 4: Masked Hero Underdog Reorder

Reordered Masked Hero (55) Underdog counter to fire BEFORE pre-roll damage for all 5 sources:

1. **Ember Force (304)** — Underdog now fires before Swarm damage. If Ember Force KO'd, damage skipped.
2. **Shade's Shadow (205)** — Underdog now fires before Meltdown. If attacker KO'd, damage skipped.
3. **Shade (111) Haunt** — Underdog now fires before Haunt damage. If Shade KO'd, damage skipped.
4. **Splinter (101) Toxic Fumes** — Underdog now fires before Fumes. If Splinter KO'd, damage skipped.
5. **Lucy (108) / Humar (336) Blue Fire/Meteor** — Underdog now fires before delayed damage. NEW: Lucy path previously had NO Underdog check at all (missing feature). Now added.

All 5 sources mirrored in smartAutoPlay.js with matching before-damage ordering and attacker-KO skip logic.

---

## Version: v695
