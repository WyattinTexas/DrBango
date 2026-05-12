# Testroom Full Audit — PROFESSIONAL PLAYTEST READY

## Goal
EJ (creative partner at Brim Studio) needs to playtest this. Every card must work, every ability must fire visually, and the whole experience must feel ENGAGING — not like a spreadsheet.

---

## 1. PACING & STORYTELLING (HIGHEST PRIORITY)

The battle needs to feel like a narrative. Step by step, dramatic, engaging for kids AND dads.

### KO Pacing
- When a ghost gets KO'd: PAUSE. Let the moment land. 1.5 second delay before the swap picker appears.
- The flow should be: damage hit → shake animation → "KO!" announcement → pause → THEN "Who comes in?" swap picker
- Currently implemented with setTimeout but audit that it actually works and feels right.

### Roll Storytelling
- When dice are rolled, the WINNING dice need to be visually highlighted:
  - **Doubles**: highlight the matching pair (e.g. the two 5s glow/pulse)
  - **Triples**: highlight all three matching dice
  - **Singles win**: highlight the difference-maker number (the highest die that won it)
- The narrator text should tell the story: "Pudge rolls double fives! Belly Flop activates — +2 damage! Hank takes 4! But Pudge takes 1 self-damage from the flop."
- NOT just "Red wins. 4 damage." — that's dead. Make it alive.

### Event Sequencing
Each event should land one at a time with slight delays between them:
1. Dice roll animation
2. Dice revealed + winning dice highlighted
3. Winner announced in narrator
4. Ability triggers shown (with callout popup)
5. Damage applied (shake + HP bar drain)
6. If KO: pause, then swap
7. Resource gains shown

Don't dump everything at once. Let each beat breathe.

### Remove Round Labels
"Round 1", "Round 2" etc — REMOVED from UI. Already done but verify the turnIndicator shows empty.

---

## 2. EVERY CARD ABILITY MUST WORK

Go through EVERY card in the GHOSTS array. For each one:
- Does the ability have working game logic?
- Does it show a `showAbilityCallout()` when triggered?
- If player-triggered (before rolling, spend resource, etc), does it have a clickable button?
- Does it interact correctly with Heavy Air (401) and Retribution (402)?

### Known Broken/Missing:
- **Tyson (365)** — "Before rolling: you may switch Tyson with a sideline ghost. No entry effects trigger." — NEEDS a pre-roll button. Copy the Death Howl Pressure button pattern.
- **Benjamin (203)** — "Once per turn: use the Moonstone special without discarding it." — needs a button
- **Smithy (204)** — "Sideline: convert 2 Ice Shards or 2 Sacred Fires into 1 Moonstone each round." — needs auto-trigger logic
- **Death Howl (202)** — Has Pressure button, verify it works
- **Every sideline ability** — must trigger automatically at the right phase and show a callout
- **Every on-win, on-lose, on-KO, entry, tie trigger** — must fire with visual feedback

### New EJ Ghost Abilities (recently added, need verification):
- **Heavy Air (401)** — While active: before any opponent ability triggers, that ghost loses 2 HP first. `checkKnightEffects()` must be called before EVERY ability trigger.
- **Retribution (402)** — While active: when opponent ability triggers, heal your active ghost 1 HP first. Same `checkKnightEffects()` hook.
- **Blackout (403)** — Before rolling: name a number (1-6 picker buttons). Opponent dice matching that number don't count. Verify `classify()` handles 0-2 dice.
- **Bitter End (404)** — Lose: gain 1 Surge. Must trigger even when KO'd.
- **Eternal Flame (406)** — Sacred Fires not discarded when used. Check if Fed and Hayden (alive, any position) refunds fire after spend.

---

## 3. SIDELINE ABILITIES MUST BE VISIBLE

During battle, sideline ghost cards already show ability text via `renderCardSlot()`. But verify:
- The ability name and description are readable on sideline cards
- When a sideline ability triggers, it gets a `showAbilityCallout()` + log entry
- The sideline cards are always visible (not hidden behind anything)

---

## 4. DICE HIGHLIGHTING IMPLEMENTATION

Add CSS classes for highlighted dice and apply them in `renderDice()` or a new function after rolls resolve:

```css
.die.highlighted {
  box-shadow: 0 0 12px 4px var(--moonstone);
  transform: scale(1.15);
  border: 2px solid var(--moonstone);
}
```

In `resolveRound()`, after determining the winner, mark which dice to highlight:
- For doubles: highlight dice matching the doubled value
- For triples: highlight all three
- For singles: highlight the highest die on the winning side
- For the losing side: don't highlight anything

Update `renderDice()` to accept a highlight array and apply the class.

---

## 5. ABILITY BUTTON PATTERN

For any card with a player-triggered ability, add a button in the `renderBattle()` ability-buttons section. Follow the Death Howl Pressure pattern:

```js
if (B.phase === 'ready') {
  // Tyson (365) — Hop: swap without entry effects
  if (f.id === 365 && !f.ko) {
    const sideline = t.ghosts.filter((g,i) => i !== t.activeIdx && !g.ko);
    if (sideline.length > 0) {
      html += `<button class="ability-btn" onclick="useTysonHop('${team}')">🔄 Hop</button>`;
    }
  }
}
```

Then implement the corresponding function (e.g. `useTysonHop(team)`).

---

## 6. GIT WORKFLOW

After ALL changes are made and verified:
```bash
cd ~/DrBango
git add testroom/index.html
git commit -m "Full card audit: all abilities working, dice highlighting, pacing fixes"
git push
```

---

---

## 7. SEQUENTIAL DICE REVEAL (from boobattles)

Currently dice reveal all at once. They MUST reveal one at a time with 300ms stagger, exactly like boobattles:

```js
// In the roll animation, after the rolling phase:
diceValues.forEach((v, i) => {
  setTimeout(() => {
    const d = document.getElementById(team + '-die-' + i);
    d.classList.remove('rolling');
    d.textContent = v;
  }, i * 300);  // 0ms, 300ms, 600ms — one die at a time
});
```

After all dice revealed, add glow to winners:
- `.glow` class for doubles (matching pair glows)
- `.triples-glow` class for triples+ (all glow + pulse animation)
- For singles: glow the highest die on winning side

CSS from boobattles:
```css
.die.glow { box-shadow: 0 0 24px currentColor; transform: scale(1.15); }
.die.triples-glow { box-shadow: 0 0 30px currentColor, 0 0 60px currentColor; transform: scale(1.25); animation: triplesPulse 0.6s ease-in-out infinite; }
.die.rolling { animation: roll 0.1s infinite alternate; }
@keyframes triplesPulse { 0%,100% { transform: scale(1.25); } 50% { transform: scale(1.35); } }
@keyframes roll { 0% { transform: rotateZ(-5deg); } 100% { transform: rotateZ(5deg); } }
```

---

## 8. DICE MANIPULATION FOR CINEMATIC MOMENTS

Reference: boobattles/orchestrator.js `applyVsDiceModifiers()` (line 878)

Add dice weighting to increase dramatic moments:
- **Low HP clutch**: When a ghost is at 1-2 HP, give 25% chance of doubles/triples (comeback mechanic)
- **First round**: Slight boost toward doubles (exciting opener)
- **After 3 consecutive losses**: Boost next roll toward higher values (prevents blowouts)

The goal is NOT to make the game unfair — it's to make it CINEMATIC. Close games are more fun than blowouts.

```js
function weightedRoll(team) {
  let dice = [1,2,3].map(() => Math.floor(Math.random()*6)+1);
  const f = active(B[team]);
  
  // Clutch mechanic: low HP boost
  if (f.hp <= 2 && f.hp > 0) {
    if (Math.random() < 0.25) {
      const v = Math.ceil(Math.random()*4)+2; // 3-6
      dice[0] = v; dice[1] = v; // force doubles
    }
  }
  return dice;
}
```

---

## 9. PRE-BATTLE START SCREEN

Before the first roll, show a VS splash:
- Both active ghosts face each other
- "VS" text in the middle with dramatic animation
- Ghost names displayed large
- Brief pause (2 seconds), then battle begins
- Roll buttons appear after the splash fades

---

## 10. ROLL BUTTON PULSE

Roll buttons should pulse/glow to guide players:
- **First roll**: Both buttons pulse with a "Roll!" or arrow effect immediately
- **After first roll**: Only pulse if player is AFK for 5+ seconds without clicking

```css
@keyframes rollPulse {
  0%, 100% { box-shadow: 0 0 8px var(--moonstone); }
  50% { box-shadow: 0 0 24px var(--moonstone), 0 0 48px rgba(126,232,250,0.3); transform: scale(1.05); }
}
.roll-btn.pulse { animation: rollPulse 1.5s ease-in-out infinite; }
```

```js
// First roll: pulse immediately
if (B.round === 1) {
  document.querySelectorAll('.roll-btn').forEach(b => b.classList.add('pulse'));
}
// AFK detection: pulse after 5 seconds of inactivity
let afkTimer = null;
function resetAfkTimer() {
  clearTimeout(afkTimer);
  document.querySelectorAll('.roll-btn').forEach(b => b.classList.remove('pulse'));
  afkTimer = setTimeout(() => {
    if (B.phase === 'ready') {
      document.querySelectorAll('.roll-btn').forEach(b => b.classList.add('pulse'));
    }
  }, 5000);
}
```

---

## Design Principles (DO NOT VIOLATE):
- **No carry-over tracking** — nothing persists across turns that players need to remember mentally
- **Simple ability text** — one line, kid-readable, dad-friendly
- **"First" for timing** — use the word "first" to indicate something happens before something else
- **No lose-lose mechanics** — don't punish the opponent for winning (no revenge damage on death)
- **Healing limit** — healing >2 HP per turn breaks the game
