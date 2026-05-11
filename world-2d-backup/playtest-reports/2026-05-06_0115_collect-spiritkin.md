# Playtest Audit — 2026-05-06 01:15 AM
**Version:** v0.9.0 (deployed) / v0.9.2 (local)
**Objective:** Collect 6 different Spiritkin (test exploration + battle + recruitment)

## EXPERIENCE LOG
1. Page loaded — loading screen showed, Firebase auth succeeded
2. Character creation screen rendered cleanly — 3 starters, 4 disciplines, 6 sprites all visible
3. Created "AuditBot" — Hunter discipline, Cameron starter, Wanderer sprite
4. Entered Overworld — spawned in hub town near Workshop
5. HUD rendered with all buttons (Inventory, Craft, Market, Zones, Guild, Sound)
6. World Boss "King Jay" active with 27/35 HP, 8:44 timer — working!
7. Another player "bubs" visible on the map — multiplayer presence confirmed
8. NPC labels visible (Elder Frost, Keeper Zara, Smith Ember)
9. Building labels visible (General Store, Battle Arena, Workshop, Frostwind Inn, Cantina)
10. "Press E to interact" prompt appeared near buildings
11. Moved to Crystal Glade encounter zone — zone visible as purple area with label
12. Triggered wild encounter vs Opa — battle overlay appeared
13. Battle displayed with old dark layout (not the new Pokemon-style — deploy cache issue)
14. Clicked FIGHT — dice animation played, damage resolved correctly
15. Chat showed "AuditBot has entered the Overworld" — working

## BUGS FOUND
1. **Card art not loading** — all card images show as broken/hidden. The `art` paths (../testroom/art/cameron.webp etc.) return 404. Many cards use .webp but the actual files may be .jpg or .png with different names
2. **Battle redesign not deployed** — site serves v0.9.0 (cached), latest is v0.9.2. New Pokemon-style battle layout not visible. GitHub Pages cache lag
3. **Automated battleRoll() breaks** — calling battleRoll() in a loop doesn't work because setTimeout-based dice animation sets phase='rolling' and blocks subsequent calls. Only works with human timing. Not a real bug for users, but blocks automated testing
4. **Version not visible anywhere on screen** — fixed in v0.9.2

## UX FRICTION
1. **No card art = battles feel empty** — without the Spiritkin portraits, battles are just text boxes with names. This is the #1 feel issue
2. **Cards are too small** — even when the art loads, 80px circles are tiny. Needs to be large and center-stage (Wyatt's feedback)
3. **Battle layout is dark/cramped** — old layout has two bordered boxes side by side with a VS badge. Feels like a spreadsheet, not a showdown
4. **Starter cards have no art previews** — character creation shows card text but no images (all 404)
5. **Encounter zones are very large solid purple blocks** — looks like a debug overlay, not natural terrain
6. **No tutorial/onboarding** — new player has no idea what to do after spawning. No "walk to the encounter zone" prompt
7. **HUD buttons feel cramped** on the right side — 7 buttons in a row

## WHAT FELT GOOD
1. **World Boss bar at the top** — immediately creates a sense of shared world/community event
2. **Other player visible on map** — "bubs" walking around made it feel alive
3. **Hub town feels like a real place** — labeled buildings, NPCs with names, cantina
4. **Character creation flow** — smooth, clear choices, sprite previews look great
5. **Zone labels on the map** — Crystal Glade label helps navigation
6. **"Press E to interact" prompt** — clear and helpful
7. **Chat working** — entry message appeared, feels real
8. **XP bar in HUD** — clean, gradient, satisfying
9. **Minimap** — helpful for orientation, shows full world

## RECOMMENDATIONS
1. **FIX CARD ART PATHS** — audit all art references, map to actual files in testroom/art/
2. **MAKE CARDS HUGE** — battle screen should be 60% card art, Pokemon-style. This IS the game
3. **Deploy the Pokemon battle layout** — v0.9.1 redesign needs to be live and verified
4. **Add onboarding hints** — "Head to the purple encounter zone to find wild Spiritkin!"
5. **Soften encounter zone visuals** — less solid purple block, more subtle grass-with-particles
6. **Add card art to character creation** — starters should show their portrait
7. **Cache-bust strategy** — add version query param to force fresh loads
