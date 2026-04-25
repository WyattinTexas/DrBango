# Bigsby → Doom Identity Rules
## Filed: 2026-04-12

### The Rule
Bigsby (424) is the team member. Doom (112) is a transformation, not a replacement.

### What needs to change

**1. Save original identity on transformation:**
When Bigsby transforms into Doom (in `pickMsValue()` Moonstone handler), save:
```js
g.originalId = 424;
g.originalName = "Bigsby";
g.originalArt = "art/originals/Digby.png";
g.originalMaxHp = 5;
g.originalAbility = "Omen";
g.originalAbilityDesc = "...";
```

**2. MVP / End-of-game screen:**
Use `g.originalName || g.name` and `g.originalArt || g.art` in the results display.
All KOs credited to Bigsby's original ID, not Doom's.

**3. Bo Resurrection:**
If a KO'd ghost has `g.originalId`, resurrect as the ORIGINAL:
- Restore Bigsby's stats (id, name, art, maxHp, ability)
- Clear the transformation fields
- Bigsby comes back as Bigsby, not as Doom

**4. Battle display:**
Keep showing Doom in battle — the transformation IS active during play.
Only revert on resurrection or end-of-game display.
