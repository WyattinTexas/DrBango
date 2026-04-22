# Playtest Findings — 2026-04-10 22:15

Tester: Claude (autonomous browser playthrough)
Testroom version: v385

## Setup observations
- Game flow: Spiritkin Gallery (browse) ↔ Arena (battle picker) tabs
- Arena: 3v3 picker with set/rarity filters
- Default view: Volcanic Isles & Rolling Hills new sets, Base Set hidden by default

## Findings


### OBS-1: Set toggle labeling is confusing
- Button "HIDE BASE SET" appears purple/highlighted by default
- Yet base set cards (Kodako/Nikon/Ancient Librarian, all `original-card` class) are visible
- Convention is unclear: does highlighted = "currently active filter" or "currently inactive"?
- Sister buttons "SHOW DARK CASTLE" / "SHOW FROST VALLEY" follow opposite convention (not highlighted, presumably hidden)
- Suggested fix: button text should be the CURRENT STATE not the ACTION (e.g. "Base Set: ON" / "Base Set: OFF")

### OBS-2: After picking a card, page auto-scrolls down ~9000px
- After clicking Ancient Librarian (pick 3 of Red), scrollY jumped to 9577
- Lands user in empty space far below the picker / next prompt
- Should scroll to either: (a) the same position they were, or (b) the start of the picker for next team

### OBS-3: Picker UX — single-team click handlers, no auto-advance
- Each `.pick-card` has a hardcoded `togglePick('red', N)` or `togglePick('blue', N)` onclick
- The Red picker section and Blue picker section are SEPARATE rendered sections (~9000px apart in scroll)
- After picking 3 Reds, the user has to scroll way down to find the Blue picker section
- The cards visible at the top remain `togglePick('red', X)` and become `disabled` once Red is full — they appear as "stuck/dead" cards from the user's perspective
- Suggested fix: either (a) auto-scroll to the Blue picker section after Red fills up with a clear visual transition, or (b) merge into a single picker that switches active team automatically and uses one set of click handlers per card

### OBS-4: HIDE BASE SET toggle has class "active" but base set cards are still visible
- Button has `set-toggle-btn active` class
- Yet Kodako, Nikon, Ancient Librarian (all `original-card` class) appear in the picker
- Either the toggle is broken, OR the labeling is the inverse of what I expected (but the active class strongly implies the filter IS engaged)

### OBS-5: Wanderer "Curiosity" ability text — "hidden" state unclear
- Card text: "If any enemy sideline cards are hidden, choose one to flip upon entering battle"
- In a default 3v3 with all sidelines visible, when does "hidden" actually apply?
- Either this is conditional on a state I haven't seen yet, OR the ability is functionally dead in normal play
- Worth clarifying or removing if it never triggers

### Game 1, Round 1 — clean play
- Red: Kodako/Nikon/Ancient Librarian
- Blue: Wanderer/Puff/Fang Outside
- Roll: Red [1,2,6] singles (high 6) vs Blue [4,4,4] triples (high 4)
- Result: Blue triples beat Red singles. Wanderer deals 3 damage to Kodako (6 → 3 HP).
- Kodako Swift did NOT trigger (needs exact 1-2-3, rolled 1-2-6). Correct behavior.

### OBS-6: Wanderer (Common, 8 HP) appears overstatted vs Common curve
- Most commons in this matchup have 6 HP (Kodako, Nikon)
- Wanderer is 8 HP — 33% more
- Wanderer's ability "Curiosity — If any enemy sideline cards are hidden, choose one to flip" did NOT fire in standard play (no sidelines were "hidden")
- Net effect: Wanderer is functionally an 8 HP vanilla common — significantly above the common curve
- After 6 rounds of dice combat, Wanderer alone has tanked Kodako (6 HP) down to 1 HP while only taking 4 damage herself
- Either: (a) Curiosity needs to actually trigger in normal play to justify the HP, or (b) Wanderer should be 6 HP if Curiosity remains conditional
- Worth checking if Curiosity is dead text (see OBS-5)

### OBS-7: Fang Outside (Common, 2 HP) is fragile to the point of unplayable as a sideline replacement
- Fang Outside enters at 2/2 HP — 33% the HP of Kodako/Nikon (6) and 25% of Wanderer (8)
- Skillful Coward ability lets him swap out on a roll-win, but the swap itself REQUIRES winning a roll first
- A standard singles roll from the opponent does 1 damage — half of Fang's HP
- A doubles or triples roll does 2-3 damage — instant KO
- Net effect: Fang gets one shot at winning a roll, OR he dies before he can use his ability
- This makes him almost a "free KO" for the opponent when he subs in
- Either: (a) base HP should be 4+, OR (b) Skillful Coward should grant +1 die or some other "fishing for a win" mechanic to compensate for the binary "win first or die" gating
- Note: card is pre-roll-fragile in a way Zain (200s, 7 HP) is also susceptible to but Zain has Ice Blade upside; Fang has positioning utility which is harder to value

### KO UX (positive note)
- KO triggers a beautiful flow: KO'd fighter fades, sideline replacements get gold borders, banner shows "X is down! Team — who answers the call?"
- Clear, polished, no confusion about what to do next


## GAME 2 — The Depth-Power Test (Skylar + Zain + Granny vs Doom + Wanderer + Pudge)

### OBS-9: Doom (Legendary, 7 HP, Fiendship +2 dmg unconditional) vs Skylar (Ghost-rare, 7 HP, Winter Barrage conditional on Ice Shards)
- Round 1: Red [1,2,4] vs Blue [1,3,4] → tied highest, Blue wins on 2nd-highest die
- Damage: Doom dealt **3** (1 base singles + 2 Fiendship)
- Skylar 7 → 4 HP after a single normal roll
- **The structural issue:** Skylar's Winter Barrage requires committed Ice Shards. She starts the game with zero. So in round 1, Skylar is a vanilla 7 HP ghost-rare with no offensive bump, while Doom is a 7 HP legendary doing +2 every hit.
- This is the same complaint pattern Wyatt has had about Zain ("Doom with 1 less HP and a fuse"). Skylar lives the same way: a conditional damage boost that doesn't fire when you need it most (round 1).
- The Skylar+Zain depth combo we identified theoretically requires BOTH to have Ice Shards already on the field to function. Round 1 is just "vanilla Skylar tanks Doom hits and dies before her ability can trigger."
- **Suggested fixes (pick one):**
  - Skylar starts with 1 Ice Shard pre-committed (1 round of value out of the gate)
  - OR Winter Barrage also gives a small vanilla bump (e.g. +1 die when Ice Shards are spent later)
  - OR Doom drops to HP 6 (he's already legendary, the +2 damage is the value)
- This is real evidence that the "Doom yardstick" is squeezing every conditional card in the game. Doom's combination of stat-curve HP + unconditional damage breaks the curve unless conditional cards are very cheap to set up.

### OBS-10: Sacred Fire icon is rendered in BLUE color
- Resource label says "FIRE", image file is `sacredfire.png`, B.red.fire counter is correct (1)
- BUT the icon artwork is a blue/cyan flame
- Conflicts with player mental model: blue = ice, red/orange = fire
- Players will likely misidentify the resource at a glance
- Could be intentional ("spirit fire is blue") but worth a re-evaluation — OR a clearer way to disambiguate from Ice Shard at-a-glance

### OBS-11: Skylar+Zain "depth combo" is structurally gated behind a missing resource generator
- Played 3 rounds with Skylar(104) active + Zain(206) on sideline + Granny(310) on sideline
- After 3 rounds, Red has: 1 Sacred Fire, 0 Ice Shards, 0 Moonstone
- Skylar's Winter Barrage NEVER triggered (needs committed Ice Shards)
- Zain's Ice Blade can never forge (needs 1 Ice Shard + 1 Moonstone — Red has neither)
- Skylar got KO'd by raw Doom damage (3 rounds, took 7 damage from Doom + Fiendship)
- The "depth combo" Wyatt/Gary identified theoretically requires an Ice Shard generator card to be in the team — but there doesn't appear to be one in this default pool, OR it's not in Frost Valley/base set
- **Action item for design:** Identify (or create) the Ice Shard generator card. Without one, the entire Skylar+Zain archetype is dead on arrival — both cards are vanilla stat sticks that die before their abilities trigger.
- This is the SAME structural issue we saw with Skylar — conditional cards need their resource fuel pre-loaded or generated reliably, otherwise they're just worse vanilla cards against Doom-tier opposition.


### Game 2 — Round-by-round battle log
- **R1:** Red [1,2,4] singles 4 vs Blue [1,3,4] singles 4 (tied high, Blue wins 2nd die). Doom deals 3 (singles+Fiendship). Skylar 7→4.
- **R2:** Red [1,6,6] doubles 6 vs Blue [1,4,5] singles 5. Red wins. Skylar deals 2. Doom 7→5.
- **R3:** Red [2,3,6] singles 6 vs Blue [3,6,6] doubles 6. Blue wins. Doom deals 4 (doubles+Fiendship). **Skylar KO** (4→0). Zain swaps in at 6/6.
- **R4:** Red [3,4,5] vs Blue [1,2,5] singles tie (5), Red wins 2nd die. Zain deals 1. Doom 5→4.
- **R5:** Red [2,3,6] vs Blue [1,3,5] singles, Red 6>5. Zain deals 1. Doom 4→3.
- **R6:** Red [1,4,4] doubles 4 vs Blue [1,1,4] doubles 1. Red wins. Zain deals 2. Doom 3→1.
- **R7:** Red [1,3,6] singles 6 vs Blue [2,5,5] doubles 5. Doubles win. Doom deals 4. Zain 6→2.
- **R8:** Red [4,6,6] doubles 6 vs Blue [3,4,6] singles 6. Red wins. Zain deals 2. **Doom KO** (1→0).

### Game 2 summary — balance narrative
- Skylar died in 3 rounds to Doom's unconditional beatdown without ever using her ability.
- Zain came in fresh, outlasted Doom by 1 HP in a swing-y 5-round slugfest, landing the killing blow at 2/6 HP.
- **NEITHER Skylar NOR Zain accessed their conditional mechanics.** Both played as vanilla stat sticks because Red never acquired a single Ice Shard. The only resource earned all game was 1 Sacred Fire (useless to Ice-themed cards).
- **Verdict:** The Skylar+Zain depth combo is not functional in isolation. It needs an Ice Shard generator ally, which wasn't in this team. Wyatt should check which cards produce Ice Shards and whether any are in Volcanic Isles / Rolling Hills / Frost Valley — if there aren't viable generators, the entire Ice archetype is a paper tiger.

## Summary for orchestrator (refiner)

**Structural bugs / UX issues:**
1. **OBS-3:** Card picker has separate Red/Blue sections ~9000px apart; no auto-advance after filling Red — user must scroll to find the Blue picker. Recommend unified picker with active-team toggle.
2. **OBS-4:** "Hide Base Set" toggle has `set-toggle-btn active` class but base set cards (Kodako, Nikon, etc.) remain visible in the picker. Either the toggle doesn't work, or the label convention is inverted.
3. **OBS-10:** Sacred Fire resource icon is rendered in blue/cyan — conflicts with player mental model of "blue = ice, red = fire". Consider recoloring or adding a visual distinction.

**Balance observations (not necessarily bugs, but flagged for design review):**
4. **OBS-6:** Wanderer (Common, 8 HP) is 33% above common HP curve. Her "Curiosity" ability rarely fires (needs hidden enemy sidelines) so she plays as a vanilla 8 HP stat stick.
5. **OBS-7:** Fang Outside (Common, 2 HP) is effectively unplayable — dies in one roll before his Skillful Coward ability can fire. Confirmed empirically (KO'd in his first roll of game 1).
6. **OBS-8:** Common vs common matchups can drag 12+ rounds due to 1-damage singles rolls. May feel slow for new players.
7. **OBS-9:** Doom's unconditional +2 damage + 7 HP makes him the damage curve benchmark — any conditional card at 6-7 HP (Zain, Skylar) is strictly worse in vacuum. The "Doom yardstick" problem Wyatt has been articulating.
8. **OBS-11:** The Skylar(104) + Zain(206) depth-power combo we theorized does not function in practice — Red never acquires Ice Shards without a dedicated generator card. Design action: identify/create an Ice Shard generator that can realistically pair with Skylar+Zain.

**Things that work great (positive notes for refiner to not regret):**
- KO replacement UX: fade-out + gold-bordered sideline options + "who answers the call?" banner = polished
- Dice resolution animations feel solid
- Battle log is clear and chronological (newest top)
- Gary button top-right with green-dot online indicator — clean presence
- Puff's Cute ability ("Enemy doubles and triples do -1 damage") fires correctly and is clearly announced in log

