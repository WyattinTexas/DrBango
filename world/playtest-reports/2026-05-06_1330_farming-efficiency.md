# Playtest Audit — 2026-05-06 01:30 PM (Code-Based)
**Version:** v2.0.0+ (8801 lines)
**Objective:** (5) Max-efficiency essence farming route — optimal strategy analysis
**Method:** Mathematical analysis of game systems

## EXPERIENCE LOG (Theoretical Farming Simulation)
1. Zone quality rotation: 12-hour cycles, 0.5x-1.5x multiplier per zone. VERIFIED
2. Essence formula: base(1-600) + rarity(0-500) + scout(100) + subtype(100-200) × zone(0.5-1.5). VERIFIED
3. Theoretical max stat: 1000 (cap) achievable with legendary + scout + high zone + subtype
4. Battle vs Survey: battle is 3x faster for volume (1/20sec vs 1/3sec+60sec cooldown). VERIFIED
5. Best weapon zone: Magma Pools (+100 Potency +100 Resonance = 0.80 weighted)
6. Best armor zone: Obsidian Fields (+100 Stability +100 Purity = 0.80 weighted)
7. Spirit Traps: 5-10 essences/hour passive, support role only vs 180/hour active

## OPTIMAL FARMING ROUTES

### Best Weapon Essences (Potency + Resonance)
**Zone:** Magma Pools (Volcanic Isles) when quality ≥1.2
**Why:** Dual +100 bonus to the two stats weapons weight highest (0.45 + 0.35 = 0.80)
**Strategy:** Battle rare+ enemies for rarity bonus. Scout discipline adds +100 to all stats.

### Best Armor Essences (Stability + Purity)
**Zone:** Obsidian Fields (Volcanic Isles) when quality ≥1.2
**Why:** Dual +100 bonus to armor's weighted stats (0.45 + 0.35 = 0.80)

### Best All-Around
**Zone:** Permafrost Depths (Stability + Potency) or Sunlit Meadow (Resonance + Purity)
**Why:** Dual bonuses that work for both weapon and armor crafting

### Fastest Leveling
**Method:** Hunt roaming enemies in deep wilderness. All rarities give XP (1-5 per win).
**Rate:** ~3 wins/min × 2 avg XP = 6 XP/min. Level 1→2 in 30 seconds.

## ECONOMY ANALYSIS
| Metric | Active Farming | Passive (2 Traps) | Survey |
|--------|---------------|-------------------|--------|
| Essences/hour | ~180 | ~20 | ~20 |
| Coins/hour | ~360 | 0 (-5/day maint) | 0 |
| XP/hour | ~360 | 0 | 0 |
| Best for | Hunters | Artificers | Scouts |

**Time to Mastercraft Legendary:** ~10-12 minutes (farm 3 high-quality essences + craft)

## BUGS FOUND
None new — all previously identified issues remain.

## UX FRICTION
1. **No zone quality comparison screen** — player must visit each zone to check quality. The "Zones" button exists but needs real-time quality for all 9 zones.
2. **Survey cooldown (60s per spot) makes surveying tedious** — too slow vs battling
3. **No "best zone today" indicator** — players should know which zone is hot without checking all 9
4. **Spirit Trap ROI unclear** — 5 coins/day maintenance vs essence value not shown anywhere

## WHAT FELT GOOD
1. **Zone subtypes create real strategic choices** — Magma for weapons, Obsidian for armor is a meaningful decision
2. **Dual-stat zones are premium destinations** — worth traveling to Volcanic Isles for the best essences
3. **Scout discipline mathematically superior for crafting** — +100 to all essence stats is huge
4. **12-hour rotation creates "quality windows"** — crafters chase hot spawns just like SWG
5. **Battle farming is rewarding** — XP + coins + essence in one action, ~3 per minute

## RECOMMENDATIONS
1. **Add "Hot Zone" indicator to HUD** — show which zone currently has ≥1.2 quality
2. **Reduce survey cooldown to 30s** — make surveying competitive with battling for Scouts
3. **Show zone quality on minimap** — color-code zones by current quality (green/yellow/red)
4. **Add essence value estimate** — show "~X coins market value" on each essence
5. **Nerf battle farming rate slightly** — 180/hour trivializes the economy; consider 0.004 encounter rate
