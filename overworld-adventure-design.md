# BOO! Spirit Battles: Overworld Adventure
## Game Design Document v1

**Concept:** A single-player digital board game where you traverse the Overworld, summon Spiritkin, collect resources, complete quests, and battle legendary bosses to become the Grand Master.

**Inspired by:** Pokemon Master Trainer: Adventure Edition (Cisqoe)
**Built on:** Existing Boo! Spirit Battles battle engine, card data, and lore
**Platform:** drbango.com/overworld (single HTML page)
**Play time:** 30-60 minutes per run

---

## THE PITCH

You are a young spirit summoner entering the Overworld for the first time. Armed with a single Spiritkin companion and your grandfather's lantern, you'll travel across four regions, summoning spirits, gathering resources, and challenging legendary guardians. To become Grand Master, you must collect enough Seals from regional bosses to open the Final Gate and face Valkin the Grand.

Think Slay the Spire meets a board game meets our battle engine.

---

## THE MAP

The board is a connected path through 4 regions, each with ~12-15 spaces. Total ~50-55 spaces. The player moves along paths between nodes, choosing direction at forks.

### Regions (in order of difficulty)

| Region | Theme | Flavor | Regional Effect |
|--------|-------|--------|----------------|
| **Rolling Hills** | Healing/Growth | Lush meadows, friendly spirits | Summon circles give +1 to catch rolls |
| **Frost Valley** | Ice/Control | Frozen lakes, crystal caves | Your active Spiritkin is frozen Round 1 of every battle (can't use ability) |
| **Volcanic Isles** | Fire/Power | Lava rivers, ash storms, erupting peaks | Wild battles deal +1 bonus damage. Sacred Fire resources spawn here |
| **Dark Castle** | Final gauntlet | Valkin's stronghold | No camp spaces. No shop. Just battles and events |

### Region Gates
To enter the next region, you must have defeated that region's **Guardian** (boss). You can explore freely within your current unlocked regions.

---

## SPACE TYPES

Each space on the board has a type. When you land on a space, you take its action.

### 1. Summon Circle (replaces "Catch 'em")
- A face-down Spiritkin card is on this space
- Flip it to reveal the spirit
- Roll 3 dice. You need to match the spirit's **Summon Number** (based on rarity):
  - **Common (3-4 HP):** Match any 1 die to the number shown (easy)
  - **Uncommon (5-6 HP):** Match any 2 dice to the number shown
  - **Rare (5-6 HP):** Match all 3 dice to sum to the target number
  - **Ghost-Rare (5-7 HP):** Roll triples (any triple)
- Items can modify these rolls
- If you catch it: add to your party (max 3 active + 2 bench = 5 total)
- If you miss: the spirit remains face-up for future attempts

### 2. Event Space (Draw Event Card)
- Draw from the Event Deck and resolve immediately
- Events include: wild battles, forced trades, lucky finds, traps, weather effects
- Some event spaces also grant +1 resource of the region's type

### 3. Camp (replaces Pokemon Center)
- **Heal:** Restore all Spiritkin to full HP (free)
- **Train:** Pay 3 Spirit Coins to level up one Spiritkin (+1 max level, max 3)
- **Rest:** Gain 2 resources of your choice
- Choose ONE action per camp visit

### 4. Spirit Shop (replaces Poke Mart)
- Draw 4 Item Cards, buy any you can afford
- Sell items for half price (rounded down)
- Prices in Spirit Coins

### 5. Shrine (replaces World Card locations)
- Unique one-time locations with powerful rewards
- Example: "Moonwell Shrine - Sacrifice 1 Spiritkin to draw 3 and keep 2"
- Example: "Lantern Altar - Spend 5 Spirit Coins to gain a Legendary Item"
- Once claimed, the shrine is empty for the rest of the run

### 6. Boss Gate
- Region guardian battle (see Bosses below)
- Must defeat to unlock the next region
- Can re-attempt on future turns if you lose

### 7. Quest Board (replaces Bulletin Board)
- Draw a quest card. Max 2 active quests
- Quests have hidden rewards (!) revealed on completion
- Examples: "Defeat 3 Spiritkin in Frost Valley" / "Collect 2 Healing Seeds and visit a Camp"

### 8. Crossroads
- Fork in the path. Player chooses direction
- Some paths are shortcuts requiring a specific item to access (dotted lines)

---

## MOVEMENT

**Each turn:**
1. **Start of Turn** - Recharge any cooldown items (rotate 90 degrees)
2. **Move** - Roll 1D6, move up to that many spaces in one direction. Can stop early at any Camp, Shop, or Shrine
3. **Explore** - Take the action of the space you landed on

**Movement Items:**
- **Wind Charm:** Move exactly 1-6 (you choose) instead of rolling. Reusable, 2-turn cooldown
- **Lantern Flame:** Teleport to any previously visited Camp. Consumable
- **Shadow Step:** Take a shortcut path without the required item. Consumable

---

## BATTLE SYSTEM

Uses the existing Boo! Spirit Battles dice combat engine with simplifications for the board game context.

### Quick Battle Rules
- **1v1 format** (your active Spiritkin vs. opponent)
- Both sides roll 3 dice simultaneously
- Outcome tiers: Singles (1 dmg), Doubles (2 dmg), Triples (3 dmg)
- Higher tier wins. Ties: compare unpaired dice (doubles), or re-roll (triples)
- Winner deals their tier damage to the loser
- Battle continues until one side reaches 0 HP
- **All Spiritkin abilities work as designed** - the engine is already built

### Level Bonus
- Spiritkin start at Level 0
- Gain +1 Level (max 3) from: defeating a boss, completing a quest, training at camp
- Level adds bonus damage: Level 1 = +1 dmg when you win, Level 2 = +1 dmg and -1 dmg taken, Level 3 = +2 dmg when you win

### Party Management
- **3 Active slots + 2 Bench slots = 5 total party**
- Bench Spiritkin provide sideline abilities (as per existing rules)
- Can swap active/bench at Camps (free) or mid-battle by spending a Surge resource
- If your active Spiritkin is KO'd, the next bench member steps up automatically
- **If all 5 are KO'd:** You lose all Spirit Coins, return to the nearest Camp, and revive with 1 HP each. Harsh but not run-ending

### Wild Spiritkin Battles
- Some event cards trigger wild battles instead of catch attempts
- Wild Spiritkin fight at base stats (no level, no items)
- Winning gives +3 Spirit Coins + 1 random resource

### Boss Battles (see Boss Roster below)
- Bosses have enhanced stats, unique abilities, and scripted phases
- Defeating a boss earns: Region Seal + level up + Legendary Item choice + 5 Spirit Coins

---

## RESOURCES

The 6 resource types from the battle engine, gained through events, camps, shrines, and quests.

| Resource | Effect in Battle | How to Get |
|----------|-----------------|------------|
| **Lucky Stone** | Post-roll: reroll one die | Summon circles, events |
| **Moonstone** | Post-roll: change one die to any value | Shrines, quest rewards |
| **Healing Seed** | Before-roll: restore 1 HP | Camps, Rolling Hills events |
| **Surge** | Before-roll: swap active/bench OR power abilities | Shops, battle wins |
| **Ice Shard** | Passive: +1 damage when you win | Frost Valley spaces |
| **Sacred Fire** | Passive: +3 damage when you win | Dark Castle only, very rare |

**Resource Limit:** 3 of each type max. Forces you to use them, not hoard.

**Magic Fireflies:** Wild card resource. Trade 1 for any other. Found at Shrines only.

---

## ITEMS

Bought at Spirit Shops or found through events/quests. Hand limit of 5 items.

### Consumable Items (discard after use)
| Item | Cost | Effect |
|------|------|--------|
| Spirit Charm | 2 | +1 to summon roll |
| Ghost Trap | 4 | Auto-catch any Common Spiritkin |
| Revive Potion | 3 | Revive 1 KO'd Spiritkin to full HP |
| Smoke Bomb | 2 | Flee any non-boss battle (no penalty) |
| Spirit Coin Pouch | 1 | Gain 3 Spirit Coins |
| Power Crystal | 5 | +2 damage for one entire battle |

### Reusable Items (cooldown after use)
| Item | Cost | Effect | Cooldown |
|------|------|--------|----------|
| Lantern Lens | 6 | Peek at any face-down Spiritkin on the board | 3 turns |
| Wind Charm | 5 | Choose your movement (1-6) instead of rolling | 2 turns |
| Battle Horn | 4 | Re-roll all dice once per battle | 2 turns |
| Healer's Pouch | 7 | Heal 2 HP to active Spiritkin between battles | 3 turns |

### Legendary Items (boss rewards, choose 1 per boss)
| Item | Effect |
|------|--------|
| Guardian's Crest | +1 max party size (6 total) |
| Flame Blade | +1 die in battle + burn 2 dmg |
| Ice Blade | +1 die in battle + freeze (enemy skips Round 1 ability) |
| Elder's Mask | All Spiritkin gain +1 HP permanently |
| Spirit Crown | Draw 2 Event Cards, choose which to resolve |

---

## BOSS ROSTER

4 Regional Guardians + Valkin as the final boss. Each has a unique mechanic.

### Region 1: Rolling Hills
**GUARDIAN: Timber** (5 HP)
- Ability: Timber Howl - when Timber wins a roll, your bench Spiritkin can't use sideline abilities next round
- Phase 2 (below 3 HP): Rooted - Timber takes 1 less damage from all sources (min 1)
- The tutorial boss. Teaches you that abilities matter and bench positioning matters. Beatable with base stats but punishes carelessness
- Reward: Rolling Hills Seal

### Region 2: Frost Valley
**GUARDIAN: King Jay** (7 HP)
- Ability: Reflection - 30% chance any roll that totals 7 reflects damage back at you
- Phase 2 (below 4 HP): Ice Armor - first hit each round deals 0 damage to King Jay
- A puzzle boss. You have to play around the number 7 and burst through the armor. Rewards smart dice management and resource use
- Reward: Frost Valley Seal

### Region 3: Volcanic Isles
**GUARDIAN: Nerina** (7 HP)
- Ability: Volcanic Fury - when Nerina wins, deals tier damage +1 AND burns 1 of your resources (random)
- Phase 2 (below 4 HP): Eruption - Nerina's winning doubles deal triple damage instead
- A resource war. She punishes you for hoarding and ramps hard in Phase 2. You need to spend your resources aggressively before she takes them
- Reward: Volcanic Isles Seal

### Region 4: Dark Castle
**GUARDIAN: Lucy** (8 HP)
- Ability: Blue Fire - when Lucy wins, deals tier damage +1. When Lucy loses, she still deals 1 damage to you
- Phase 2 (below 4 HP): Eternal Flame - Blue Fire now deals +2 instead of +1, and losing still hits for 2
- The wall. Lucy hurts you even when you win. Pure attrition. You need a stacked party and resources saved from the whole run to outlast her
- Reward: Dark Castle Seal

### FINAL BOSS: Valkin the Grand (12 HP)
*Requires all 4 Regional Seals to challenge*
- Has a party of 3 Spiritkin that fight in sequence (4 HP, 4 HP, 4 HP = 12 total)
- Each of Valkin's Spiritkin has a unique ability
- Valkin's Spiritkin #1: +1 dmg on all wins (aggressive opener)
- Valkin's Spiritkin #2: Heals 1 HP when it wins (sustain fighter)
- Valkin's Spiritkin #3: Rolls 4 dice (the muscle)
- **If you beat all 3: YOU ARE THE GRAND MASTER**

---

## QUEST SYSTEM

Draw quests from the Quest Board spaces. Max 2 active quests. Hidden rewards until completion.

### Sample Quests
| Quest | Objective | Hidden Reward |
|-------|-----------|---------------|
| Spirit Collector | Have 5 different Spiritkin in your party | +2 Moonstones + 1 free level up |
| Healer's Path | Use 5 Healing Seeds in battles | Healer's Pouch (legendary reusable) |
| Frost Hunter | Defeat 3 Spiritkin in Frost Valley | Ice Blade |
| Coin Hoarder | Accumulate 15 Spirit Coins at once | Spirit Crown |
| The Long Road | Visit all 4 region Camps | Guardian's Crest |
| Feed the Goo | Find and deliver 3 specific resources to a Shrine | Unlocks a secret shortcut + free Rare Spiritkin |
| Lava Runner | Survive 3 wild battles in Volcanic Isles without healing | Flame Blade |
| Shadow Seeker | Win 3 battles with 1 HP remaining | Sacred Fire x2 |
| Valkin's Riddle | Visit 3 Shrines in a single run | Reveals Valkin's Spiritkin abilities before the fight |

---

## EVENT DECK (40 cards)

Events are drawn when landing on Event Spaces. Resolve immediately.

### Event Categories
- **Wild Battle (x10):** Fight a random Spiritkin at region-appropriate difficulty
- **Lucky Find (x6):** Gain resources, coins, or a free item draw
- **Trader (x4):** Offered a trade - swap one of your Spiritkin for a random one of higher rarity
- **Trap (x4):** Lose coins, resources, or take 1 damage to active Spiritkin
- **Weather (x4):** Regional effect for your next 3 turns (bonus/penalty)
- **Wandering Spirit (x4):** A free summon attempt with +2 to your roll
- **Legendary Sighting (x2):** Reveals the location of a hidden Rare Spiritkin on the map
- **Spirit Storm (x2):** All face-down Spiritkin on the board shuffle positions
- **Ancient Memory (x2):** Choose any 2 resources
- **Goo Encounter (x2):** A legendary Goo appears. Feed it the requested resource to gain a powerful one-time blessing (+2 max HP to one Spiritkin, or full heal + level up)

---

## THE GOO SYSTEM (Wyatt's idea)

Goos are legendary neutral spirits scattered across the map on special spaces. They don't fight - they need to be fed.

Each Goo wants a specific combination of resources. If you have what it wants when you land on its space, you can feed it for a massive reward.

| Goo | Location | Wants | Reward |
|-----|----------|-------|--------|
| **Moss Goo** | Rolling Hills, hidden path | 2 Healing Seeds + 1 Surge | Full party heal + shortcut to Frost Valley |
| **Crystal Goo** | Frost Valley, shrine space | 2 Ice Shards + 1 Moonstone | Ice Blade + freeze immunity for your party |
| **Magma Goo** | Volcanic Isles, lava cave | 2 Surges + 1 Sacred Fire | +2 HP to all party members |
| **Ancient Goo** | Dark Castle, before Valkin | 1 of every resource type | Reveals Valkin's weaknesses + starts fight at Valkin's Phase 2 |

Goos are optional but incredibly powerful. Planning your resource collection around which Goo you want to feed adds a strategic layer to every run.

---

## SINGLE-PLAYER DIGITAL IMPLEMENTATION

### UI Layout
```
+------------------------------------------+
|           THE OVERWORLD MAP              |
|   (scrollable/pannable board view)       |
|   [Player token on current space]        |
|   [Visible paths, spaces, icons]         |
+------------------------------------------+
|  PARTY    | RESOURCES  |  ITEMS          |
| [3 active]| LS: 2/3    | [Wind Charm]   |
| [2 bench] | MS: 1/3    | [Revive Pot]   |
|           | HS: 0/3    | [Ghost Trap]   |
|           | SU: 3/3    |                |
|           | IS: 1/3    | COINS: 12      |
|           | SF: 0/3    | SEALS: 2/4     |
+------------------------------------------+
|  [ROLL TO MOVE]  |  [QUEST LOG]         |
+------------------------------------------+
```

### Tech Stack
- Single HTML file (consistent with testroom, boobattles, multiplayer)
- Battle engine: port from testroom (already handles all abilities, dice, resources)
- Map: Canvas or SVG-based node graph (not a bitmap board - procedural)
- Card data: same cards.js / JSON we already use
- State: localStorage for save/resume
- Art: existing Spiritkin card art for encounters and party display

### What We Already Have (reuse)
- Full dice battle engine with all abilities
- 100+ Spiritkin with art, stats, abilities
- Resource system (6 types + fireflies)
- HP bars, damage animations, dice rolling UI
- KO/revival logic
- Card art assets

### What We Need to Build
1. **Map renderer** - node graph with paths, space types, region coloring
2. **Movement system** - dice roll, path selection, space resolution
3. **Event deck** - card definitions + draw/resolve UI
4. **Item system** - inventory, shop UI, cooldown tracking
5. **Quest system** - objective tracking, hidden rewards
6. **Boss battle phases** - enhanced battle engine for multi-phase fights
7. **Goo encounters** - resource check + reward dispensing
8. **Save/load** - localStorage run state
9. **Win screen** - Grand Master celebration

### Map Generation (for replayability)
Rather than a fixed board, the map could be **semi-procedural:**
- 4 regions always in order (RH -> FV -> DV -> DC)
- Within each region, spaces are shuffled from a pool
- Paths between spaces are randomized from 2-3 templates per region
- Shrine/Goo/Boss positions are fixed anchors
- This means every run has a different map layout while keeping progression consistent

---

## RUN SUMMARY SCREEN

After winning (or losing), show:
- Spiritkin summoned / battles won / bosses defeated
- Resources collected / items used
- Quests completed
- Total turns taken
- Final party with levels
- **Run Rating:** S / A / B / C / D based on efficiency

---

## WHAT MAKES THIS DIFFERENT FROM ADVENTURE MODE

| | Adventure Mode (Lantern's Path) | Overworld Adventure |
|---|---|---|
| **Structure** | Linear node path (Slay the Spire) | Open board with paths and forks |
| **Movement** | Choose next node | Roll dice to move |
| **Collection** | Pick from offerings | Summon on specific spaces |
| **Items** | None | Full item system with shop economy |
| **Quests** | None | Quest cards with hidden rewards |
| **Goos** | None | Feed legendary Goos for rewards |
| **Replayability** | Same map each run | Semi-procedural map |
| **Feel** | Roguelike campaign | Board game adventure |

---

## PHYSICAL BOARD GAME POTENTIAL

This digital version doubles as the prototype for a physical Boo! Spirit Battles board game:
- **Spiritkin cards** = already designed and printed
- **Board** = the map layout can be printed once finalized
- **Event/Item/Quest cards** = designed digitally, printed for physical
- **Resources** = physical tokens (colored stones/gems)
- **Spirit Coins** = any coin/token currency
- **Dice** = standard D6 (already in the game)

The digital version lets us playtest and balance before committing to print. Every number in this doc can be tuned through playtesting.

---

## NEXT STEPS

1. **Review this doc** - Does the vision match what you're imagining?
2. **Map design** - Sketch the 4-region board layout
3. **Card selection** - Which Spiritkin appear on the board? (tier distribution per region)
4. **Build MVP** - Map + movement + summon circles + basic battles
5. **Layer in systems** - Items, quests, events, Goos
6. **Boss fights** - Multi-phase battle engine
7. **Polish** - Animations, sound, save/load, run ratings
