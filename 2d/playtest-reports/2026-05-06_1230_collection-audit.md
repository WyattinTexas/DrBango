# Playtest Audit — 2026-05-06 12:30 PM (Code-Based)
**Version:** v2.0.0+ (8801 lines)
**Objective:** (3) Collect 6 different Spiritkin — battle→recruit→team management flow
**Method:** Static code analysis

## EXPERIENCE LOG (Simulated Collection Run)
1. Spawn at Polaris as Hunter (60% recruit chance). PASS
2. Walk to Crystal Glade encounter zone. Encounter rate: 0.008 per frame × time multiplier. PASS
3. Wild encounter: pool is Frost Valley + Set 1, weighted by rarity (common 50, rare 10). PASS
4. Battle: entry abilities → before-roll → dice → classify → compare → damage → KO. PASS
5. Win battle: 40-60% chance to recruit. Modal shows Accept/Swap. Team max 6. PASS
6. HP damage persists between fights (synced from B.playerGhost to G.team). PASS
7. Heal at Inn (tile 5, press E) — full team heal. PASS
8. Level up from XP — full team heal + G.level++. PASS
9. Set active fighter via inventory panel "Set Active" button. PASS
10. FIGHT button disabled during 400ms dice animation, re-enabled after. PASS

## CARD INVENTORY
- **51 total cards**: 26 Frost Valley, 13 Set 1, 6 Volcanic Isles, 6 Rolling Hills
- **Rarity**: 18 common, 12 uncommon, 10 rare, 5 ghost-rare, 6 legendary
- Scout discipline doubles rare/ghost-rare encounter weights

## BUGS FOUND

### MEDIUM
1. **No auto-swap on KO** — if active Spiritkin is KO'd, player must manually set new active via inventory. Battle continues with dead fighter showing. Should auto-swap to next alive team member.
2. **Legendaries excluded from wild encounters** — getWildEncounter() filters out legendaries. Only obtainable through recruitment after defeating them in... wait, they can't appear. Legendaries are UNCOLLECTABLE in wild encounters.

### LOW
3. **Swapped-out team member lost permanently** — when swapping during recruitment at team cap 6, the replaced Spiritkin is discarded with no storage/recall option.
4. **No team KO game-over screen** — if all 6 are KO'd, defeat just respawns at hub. No dramatic "all defeated" moment.

## UX FRICTION
1. Manual active swap is clunky mid-gameplay — needs to open inventory panel
2. No way to see wild encounter rarity before fighting (Spirit Lens schematic exists but no battle integration)
3. Recruit modal doesn't show the new Spiritkin's full stats (only name + rarity)
4. Team HP not visible on overworld (only in inventory panel, not while walking)

## WHAT FELT GOOD
1. HP persistence creates meaningful resource management — risk vs reward for pushing deeper
2. Inn as a safe heal point gives hubs purpose beyond crafting
3. Rarity-scaled XP rewards make rare encounters exciting (5 XP for legendary!)
4. Hunter discipline's 60% recruit rate feels rewarding for the combat-focused path
5. Level-up full heal is a great catch-up mechanic
6. Defeat respawn at 50% HP is punishing but not devastating

## RECOMMENDATIONS
1. **Add auto-swap on KO** — next alive team member enters automatically
2. **Add legendary encounters** — rare chance (1%) for legendaries in deep wilderness zones
3. **Add Spiritkin storage** — "released" team members go to a collection box, not deleted
4. **Show team HP on HUD** — small HP bars under the ghost icons already in HUD
5. **Spirit Lens integration** — if equipped, show enemy rarity/HP before battle starts
