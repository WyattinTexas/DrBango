# Playtest Findings — v671/v672
## Date: 2026-04-11 (late night)
## Source: Wyatt's live testing

---

### 1. Zain Ice Blade (206) — REWORK
**Current:** Forged blade gives +2 damage on wins while Zain is active
**Change:** Once forged, +2 damage on ALL rolls PERMANENTLY. Even when Zain dies, the blade stays forged and the +2 persists for the rest of the game.
**Type:** Resolver change (index.html + smartAutoPlay.js)
**Impact:** The blade becomes a permanent team-wide buff, not Zain-specific. Similar to Haywire's permanent die bonus.

### 2. Mirror Matt (410) — SIMPLIFY
**Current:** "If the opponent wins with doubles or better, the damage is reflected to the attacker instead."
**Change:** "If the opponent wins with doubles, the damage is reflected to the attacker instead."
**Difference:** Only DOUBLES triggers reflect. Triples, quads, penta do NOT reflect — they deal damage normally.
**Type:** Card text + resolver change

### 3. Castle Guide (420) — BURN UI MISSING
**Issues found:**
- Burn effect not visually displayed when Castle Guide enters play
- Burn needs to be a FULL SPECIAL (new resource type in the resource bar)
- **UI flow:** Click the Burn icon in your resource bar → click an enemy sideline ghost → places 1 burn on that ghost
- When the burned ghost enters play, it takes the burn damage (this should have a visible callout)
- Burn should show a counter on the enemy sideline ghost card so the player can SEE the burn stacking
**Type:** UI + resource system + resolver display

### 4. Chow (414) — NEEDS BUTTON UI
**Current:** Auto-triggers in pre-roll (AI-style auto-discard)
**Change:** Should be a CLICKABLE BUTTON in the pre-roll phase, like committed resources
- "Before rolling: you may discard 1 Healing Seed to gain +2 dice this roll"
- Can be clicked multiple times (no once-per-turn limit)
- Each click: -1 seed, +2 dice
- Like a "super surge" — voluntary, repeatable
**Type:** UI change (add pre-roll button similar to Ice Shard/Sacred Fire commit buttons)

---

### 5. Nick & Knack (409) — NEEDS BUTTON + PICKER UI
**Current:** Auto-steals 1 random resource from opponent
**Change:** Should be a CLICKABLE BUTTON in the pre-roll phase
- Player clicks "Knick Knack" button before rolling
- Shows opponent's resources
- Player SELECTS which specific resource to steal
- Transfer that resource to player
**Type:** UI change (pre-roll button + resource picker modal)

### 6. Jasper (428) — NEEDS BALATRON-STYLE DICE REVEAL
**Current:** Bonus die auto-rolls and applies damage silently
**Change:** Give Jasper the same interactive dice-reveal experience as Prince Balatron (113)
- After Jasper wins, show the Flame Dive modal
- Player clicks to roll the bonus die
- Die animates and reveals
- Bonus damage + self-damage applied after the reveal
- The reveal IS the gameplay — never auto-resolve
**Type:** UI change (new modal, copy Balatron's pattern from `showBalatronModal()`)

---

### 7. Guardian Fairy (101) — REWORK STANDBY MECHANIC
**Current:** Before rolling, you can put Guardian Fairy on standby to block damage
**Change:** Remove the pre-roll standby. Instead, Guardian Fairy triggers REACTIVELY when damage is about to land:
- Your active ghost is about to take damage
- Prompt appears: "Guardian Fairy can take this hit. Switch her in?"
- If YES: Guardian Fairy swaps into play, takes the incoming damage instead, your original ghost goes to sideline at current HP
- No pre-planning, no "standby" — pure reaction to incoming damage
- The reveal IS the moment: "You're about to eat 3 damage — unless Guardian Fairy jumps in"
**Type:** Resolver rework + new reactive modal (fires AFTER damage is calculated but BEFORE it's applied)

### 8. Lucas (433) — ABILITY REWORK + MISSING CALLOUT
**Issues found:**
- Kindling callout did NOT visually fire (no splash/callout shown), but the 6 Sacred Fires were granted silently
- **ABILITY CHANGE:** Remove the 6 Sacred Fires entirely. New ability:
  - When Bo resurrects a ghost via Miracle, the revived ghost immediately enters play
  - Bo gets moved back to the sideline
  - The revived ghost gains +1 die next roll
- This is essentially what Vela's old "Second Breath" did (swap revived into active) but WITHOUT the 2x maxHP — instead the revived ghost enters at 1 HP (normal Miracle) and gets +1 die
**Type:** Resolver rework (modify Bo Miracle handler) + fix missing callout display

---

### 9. Bigsby (424) — DOOM TRANSFORMATION NOT FIRING
**Bug:** Bigsby used a Moonstone (reroll) during the round but did NOT transform into Doom. The card text says "If you use a Moonstone, you must sacrifice Bigsby and replace him with Doom" — this is mandatory, not optional.
**What happened:** Moonstone was used to change a die to 4 (making doubles), Bigsby won the round and dealt +1 damage via Omen, but no Doom transformation occurred. Bigsby remained in play.
**Root cause:** Doom transformation was deferred during implementation (Doom card doesn't exist yet). The resolver only implements the +1 damage, not the Moonstone trigger.
**Fix needed:** 
- Detect when Bigsby's team uses a Moonstone while Bigsby is active
- Trigger mandatory sacrifice: Bigsby is KO'd
- Replace with Doom (needs Doom card created first — id, art, stats, ability)
- If Doom card isn't ready yet, at MINIMUM show a callout warning: "Bigsby must sacrifice — Doom not yet available"
- **NOT BLOCKED:** Doom already exists — id 112, legendary, 7 HP, Fiendship (+2 damage on wins), art at art/originals/doom.jpg, resolver at line 9427.
**Fix:** In the Moonstone usage flow, check if active ghost is Bigsby (424). If yes:
- KO Bigsby (mandatory sacrifice)
- Replace Bigsby's ghost slot with Doom (id 112) at full 7 HP
- This means mutating the ghost object in the team array: change id, name, maxHp, hp, ability, art, etc. to Doom's stats
- Show dramatic "OMEN! Bigsby transforms into DOOM!" callout
- Doom then fights with Fiendship (+2 damage) for the rest of the game
**Type:** Resolver (Moonstone usage hook + ghost mutation)

### 10. Selene (305) — ABILITY UPDATE
**Current:** "Win with doubles: choose +1 Healing Seed or +2 Lucky Stones"
**Change:** "Win with doubles: choose +2 Healing Seeds or +3 Lucky Stones"
**Difference:** Both options buffed — seeds from 1→2, stones from 2→3. Makes the choice meatier and the card more impactful at rare tier.
**Type:** Card text + resolver tweak (update the values in both index.html and smartAutoPlay.js)

---

## Priority Order
1. **Burn UI** (Castle Guide) — most visible gap, new system needs proper display
2. **Nick & Knack picker** — needs interactive steal selection
3. **Chow button** — needs interactive UI instead of auto-trigger
4. **Jasper dice reveal** — Balatron-style modal for Flame Dive
5. **Mirror Matt simplify** — quick text + resolver tweak
6. **Zain Ice Blade rework** — significant mechanical change, needs careful implementation
