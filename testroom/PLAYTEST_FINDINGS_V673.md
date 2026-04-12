# Playtest Findings — v673 (batch 2)
## Date: 2026-04-12 morning

---

### 1. Twyla (417) — ABILITY REWORK
**Current:** Win: each Lucky Stone spent → +1 dmg + +1 HP
**New:** Each Lucky Stone you spend this turn adds +1 die to your roll and gains +1 Healing Seed.
**Change:** Dice + Seeds instead of Damage + HP. Lucky Stones now fuel the roll itself, not the win payoff.

### 2. Lucy (108) — ADD BURN
**Current:** "Win a roll: opponent takes 1 damage before their next roll."
**Add:** Also gain +1 Burn on win.
**New text:** "Win a roll: opponent takes 1 damage before their next roll. Gain 1 Burn."

### 3. Wise Al (431) — BUFF ICE SHARDS
**Current:** "Win: you may gain 3 Ice Shards instead of dealing damage."
**Change:** 3 → 4 Ice Shards.

### 4. Gordok (430) — ADD DIE BONUS
**Current:** "Win: you may take 2 specials from your opponent instead of dealing damage."
**Add:** Also gains +1 die next roll when he steals.
**New text:** "Win: you may take 2 specials from your opponent instead of dealing damage. Gain +1 die next roll."

### 5. Zippa (423) — TIMING CHANGE
**Current:** "Win: gain 1 Lucky Stone for each Healing Seed your team currently holds."
**Change:** Move from WIN trigger to BEFORE ROLLING trigger.
**New text:** "Before rolling: gain 1 Lucky Stone for each Healing Seed your team currently holds."

### 6. Calvin (91) — ADD HEALING SEED ON WIN
**Current ability:** Toboggan (swap-related)
**Add:** "+1 Healing Seed when Calvin wins a roll."

### 7. Finn (204) — FLAME BLADE REWORK
**Current:** Forge ability (2 Ice Shards or 2 Sacred Fires → 1 Moonstone)
**New:** "Sideline & In Play: you may discard 2 Healing Seeds and 1 Sacred Fire to gain the Flame Blade."
- Flame Blade is an ITEM (special type, like Ice Blade)
- Once forged, never goes away
- Toggle on/off each round before rolling
- When swinging (toggled on): +1 die, and if you win +5 Burn
- Card text should ONLY say how to craft it, NOT what it does
- The Flame Blade item itself describes its effects in the UI

### 8. Zain (206) — SIMPLIFY CARD TEXT
**Current:** Card text describes both crafting AND what Ice Blade does
**Change:** Remove the "once forged, choose each round..." description from Zain's card text.
- Card text should ONLY say how to craft Ice Blade
- Ice Blade's effects are described on the ITEM itself in the UI
- Ice Blade is an "item" special — toggleable, permanent once forged

### 9. Ice Blade + Flame Blade — ITEM SYSTEM
Both are "items" — a new special type:
- Craftable (consume resources to forge)
- Permanent once forged (never consumed)
- Toggleable before rolling (phase up = active, phase down = inactive)
- Ice Blade: +1 die when swinging, +2 damage on win
- Flame Blade: +1 die when swinging, +5 Burn on win
- Show in resource bar as toggle-able items
- They're NOT cards in the testroom — they're UI elements like specials

### 10. Artemis — ADD ICE SHARDS ON WIN
Find Artemis card and add: "Win: gain 3 Ice Shards."

---

## Implementation Notes
- Items (Ice Blade / Flame Blade) need a new UI concept: toggleable specials in the resource bar
- Both Zain and Finn card text simplified to "how to craft" only
- Burn is becoming a real economy: Lucy generates it on every win now
