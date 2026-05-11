# Pre-Refactor Notes — 2026-05-07 1:15 AM
**Version:** v7.0.0 | **Next:** Modularization Refactor

## WYATT'S FEEDBACK TO ADDRESS POST-REFACTOR

### Battle System Agent Queue:
1. **Specials not usable** — resources (Ice Shards, Sacred Fire, etc.) are tracked
   but players can't ACTIVATE them during battle like in the testroom. Need
   clickable resource tiles that let you commit specials before rolling.
2. **Items not activatable** — crafted gear should have active effects during battle.
   The testroom has clickable item slots. We need the same.
3. **Dice theatrics** — the testroom has 3D dice with tumble reveals. Our dice
   are just numbers. Need dramatic dice roll animation matching testroom feel.

### Crafting Agent Queue:
1. **Essence list still hard to use** — second essence slot hard to fill
2. **Sub-component recipes need testing** — can you actually craft infusions?

### Interior Agent Queue:
1. **Flickering fixed** (v6.9.0) — verify it's actually smoother now
2. **Arena/Inn crashes** — try-catch added but root cause may still exist

### Architecture:
- Modularize into separate .js files (battle, crafting, professions, etc.)
- Enable parallel development (Skylar on quests, Wyatt on crafting)
- This is happening NOW — the refactor starts immediately after this note
