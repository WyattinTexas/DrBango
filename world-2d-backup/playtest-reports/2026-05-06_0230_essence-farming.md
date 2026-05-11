# Playtest Audit — 2026-05-06 02:30 AM
**Version:** v1.3.0 (deployed) — v1.4.0 local but not yet propagated
**Objective:** (5) Max-efficiency essence farming route

## EXPERIENCE LOG
1. Page loaded — v1.3.0 confirmed via JS. Loading screen works.
2. Created "FarmBot" — Scout discipline (for +20% survey concentration)
3. Game loaded — HUD shows, minimap visible, version badge NOT visible (v1.3.0 doesn't have it)
4. 6 roaming enemies spawned immediately, hit max of 15 by audit end
5. Roaming enemies all in "patrol" state — Night Master x2, Maximo, Sparky, Dupy visible
6. Moved to Crystal Glade (zone index 0) — zone quality 0.84 this cycle
7. Called startSurvey() — function exists and runs without error
8. Generated test essence: "Crystal Spockles Essence" — subtype working, stats: P:620 S:646 R:735 U:600
9. Zone essence subtypes confirmed working (Crystal Glade → Crystal subtype, Resonance bonus)
10. Attempted wild encounter — CRASHED: `Cannot set properties of null (setting 'textContent')` on battleTitle element
11. Battle screen rendered but EMPTY — Pokemon layout visible (light bg, plates, FIGHT/RUN) but no data populated

## BUGS FOUND

### CRITICAL
1. **Battle crash on v1.3.0** — `battleTitle` element doesn't exist in deployed HTML. `triggerWildEncounter()` and `triggerRoamingBattle()` both reference it. This means NO battles work on the live site. Fixed in v1.4.0 local (line 1291 adds the element).
2. **Card art still 404** — v1.3.0 deployed still has old .webp art paths. v0.9.3 fix may not have propagated or was overwritten by later agent commits. Battle sprites show nothing.

### HIGH
3. **Stat weights missing on deployed** — `SCHEMATICS[0].weights` returns undefined on v1.3.0. The v1.4.0 crafting overhaul adds them but hasn't deployed.
4. **Quest system missing on deployed** — `generateDailyQuests` function not found. Was it ever added? The NPC dialogue references quests but the quest generation may have been lost in agent rewrites.

### MEDIUM
5. **Roaming enemies spawn TOO fast** — 15 enemies (max) spawned within 2 minutes. Two Night Masters visible simultaneously which feels repetitive. Need deduplication or variety check.
6. **Survey UI not visible** — `startSurvey()` runs without error but no visual feedback appeared (no pulse ring, no progress bar). The canvas render may not be running since we triggered it via JS without the game loop active.

## UX FRICTION
1. **Character creation doesn't auto-focus name input** — have to click into it
2. **No onboarding** — new player spawns in hub with no guidance
3. **Tiles too small** — characters are tiny (32px tiles, ~16px sprites). Confirmed by Ragnarok comparison image from Wyatt
4. **Battle screen empty without art** — the Pokemon layout is actually correct but useless without card images
5. **Zone quality not shown** — the zone quality HUD element exists but I couldn't confirm it displays during gameplay

## WHAT FELT GOOD
1. **Roaming enemies work** — 15 enemies patrolling, all with correct card data and state machine
2. **Essence generation is deep** — Crystal Spockles Essence with zone subtype, quality multiplier, all 4 stats. The system is solid.
3. **Survey function exists** — even if the visual feedback needs work, the core mechanic is there
4. **Spirit Trap schematics exist** — craftable passive harvesters in the schematic list
5. **23 schematics** — 7 common, 10 rare, 6 legendary. Deep catalog.
6. **Pokemon battle layout renders** — the light background, name plates at correct positions, FIGHT/RUN buttons. Just needs data.
7. **Multiplayer presence** — saw player "bubs" on previous session

## RECOMMENDATIONS
1. **URGENT: Deploy v1.4.0** — fixes battleTitle crash, adds stat weights, assembly phase, directed experimentation
2. **URGENT: Verify art paths** — ensure v0.9.3 art path fixes are in the deployed file. If agents overwrote them, re-apply
3. **Increase tile size** — 32→48px to match Ragnarok-style character proportions
4. **Add onboarding** — first-time player hints: "Head to a purple zone to find Spiritkin!"
5. **Dedup roaming enemies** — don't spawn 2 of the same card in visual range
6. **Verify quest system exists** — may have been lost in agent rewrites

## DEPLOY STATUS
| Version | Key Feature | Deployed? |
|---------|-----------|-----------|
| v0.9.3 | Art path fixes | UNCLEAR — may have been overwritten |
| v1.0.0 | Roaming danger (invisible) | Partially (superseded by v1.1.0) |
| v1.1.0 | Visible roaming enemies | YES — confirmed working |
| v1.2.0 | Crafting UI redesign | YES — new workshop layout |
| v1.3.0 | Survey + Spirit Traps + tipping | YES — deployed |
| v1.4.0 | Deep crafting overhaul + battleTitle fix | NO — pending propagation |
