# Raid Rewards System Backup — v2.52

Snapshot taken 2026-05-22, before Wyatt's tweaks to the raid rewards system.
Captures all loot, equipment, raid points, badges, and shop pricing at the
state where the 3-player Mountain King playtest worked end-to-end (verified
2026-05-21).

## What's in this backup

| File | Source | Contains |
|---|---|---|
| `raid-engine.js` | `multiplayer/raid-engine.js` | RAID_ITEMS (14 items), RAID_LOOT_TABLES (per-tier pools), `rollBossLoot` (55/35/10 weights), `distributeRaidRewards` (point math, MVP/KB bonuses, badge grants, loot rolls, stats), `applyRaidLoot` (loadout effects) |
| `cards-raid-sections.js` | `multiplayer/cards.js` lines 432-832 | RAID_BOSS_MINIONS, RAID_BOSSES (all 13 bosses with rewardPoints/bonusPoints/dialogue/minionsByPhase), RAID_BADGES (per-boss + composite + Spiritkin Grand Master), RAID_SHOP_ITEMS (7 packs) |

## Git tag

This commit is also tagged for one-line restore:

```bash
git tag raid-rewards-v2.52-baseline   # tag name
```

## Snapshot of key tuning at v2.52

### Loot roll weights (`rollBossLoot`)
- 55% Common (singles) — basic charms
- 35% Rare (doubles) — blades, masks, firefly lantern
- 10% Legendary (triples) — Golden Dice, Shade's Cape, Valkin's Crystal, Moonstone Ring

### Boss reward points
| Tier | Base | KB/MVP Bonus |
|---|---|---|
| 1 Rolling Hills | 50 | 25 |
| 2 Frost Valley | 100 | 25 |
| 3 Volcanic Isles | 150 | 25 |
| 4 Dark Castle | 200 | 25 |
| 5 Dark Spire | 300 | 50 |

### Point modifiers (`raid-engine.js:1431-1457`)
- Killing Blow: +bonusPoints
- MVP (most damage): +bonusPoints (stacks with KB)
- Registered but never fought: 25% of base
- Loss (boss survived): 50% × base × (your dmg / boss max HP)
- Disconnected: 0

### Shop prices
| Pack | Cost |
|---|---|
| Spirit Pack | 150 |
| Premium Spirit Pack | 300 |
| Legendary Pack | 800 |
| Set Packs (Frost/Volcanic/Rolling/Dark) | 200 each |

## How to restore

### Option A — git tag (cleanest, restores exact source files)
```bash
cd ~/DrBango
# See what changed since the tag
git diff raid-rewards-v2.52-baseline -- multiplayer/raid-engine.js multiplayer/cards.js

# Restore one file from the tag
git checkout raid-rewards-v2.52-baseline -- multiplayer/raid-engine.js

# Restore both files
git checkout raid-rewards-v2.52-baseline -- multiplayer/raid-engine.js multiplayer/cards.js
```

### Option B — copy from this folder (manual reference)
```bash
cp ~/DrBango/_backups/raid-rewards-v2.52/raid-engine.js \
   ~/DrBango/multiplayer/raid-engine.js
```
For `cards-raid-sections.js`, copy/paste the relevant sections back into
`cards.js` — the original file has more than just raid content.

### Option C — partial restore
If you only want to revert one constant (e.g., point values changed but loot
tables are good), open the file in this folder and copy just that block back
into the live `multiplayer/` source.

## Notes on this state
- Auto-equip on loot drop is ON (first item into empty slot)
- Already-owned items still consume the loot roll (no duplicate handling)
- Spectators don't get rewarded for *watching* the killing blow — they
  needed `status !== 'disconnected'` AND `status !== 'registered'` to count
  as a participant
- `bossDamageTracker` exists in battle-engine.js but is never called — the
  instance-level `totalDamageDealt` is now written via `increment(turnDamage)`
  from the bridge's handoffs (v2.51)

Folder lives under `_backups/` which Jekyll filters from GitHub Pages, so
nothing here gets served at drbango.com.
