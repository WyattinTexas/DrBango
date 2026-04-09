# Testroom Coordination Log

All agents working on testroom/index.html should read this before making changes.
After fixing something, log it here so other agents don't duplicate work.

## Current Version: v48

## HARD RULES
- NEVER unshelve cards or remove IDs from SHELVED_IDS
- NEVER implement new abilities for shelved/unimplemented cards
- POLISH ONLY — fix bugs, improve UX, tune timing. Zero new features.
- Always bump TESTROOM_VERSION on every push
- Always update this file after pushing a fix
- The ONLY real cards are the 36 below. Any card NOT on this list is FAKE — do NOT audit, test, or reference it.

## THE 36 REAL CARDS
COMMON: Hank(207), Happy Crystal(208), Dart(209), Dylan(301), Maximo(302), Tweak and Twonk(303), Pudge(311), Jimmy(352), Tyson(365)
UNCOMMON: Bouril(201), The Ember Force(304), Kaplan(308), Granny(310), Calvin(342), Boris(343), Fed and Hayden(406)
RARE: Death Howl(202), Benjamin(203), Smithy(204), Shade's Shadow(205), Artemis(307), Aunt Susan(309), Timpleton(312), Sylvia(313), Harrison(315), Knight Terror(401), Knight Light(402), Smudge(403), Chagrin(404)
GHOST RARE: Zain(206), Farmer Jeff(314), Natalia(327), Red Hunter(345)
LEGENDARY: Timber(210), Selene(305), Nerina(306), Humar(336)
**Mother Nature(366), Bumble(362), Dusk(364) are NOT real cards. Ignore them.**

## Completed Fixes — Wyatt + Gamma (this session)

- **v29** — Double ability callout: small `#abilityCallout` showing behind big `#abilitySplash`. Hidden during splash, shown after fade.
- **v30** — Narrator spacing: `display:flex` whitespace collapse. Wrapped innerHTML in `<span>`.
- **v31** — Lucky Stone reroll stuck on `?`: `revealDice()` needed IDs from `showRolling()`. Now uses `renderDice()` directly.
- **v32** — Moonstone countdown not clearing between phases. Fixed + bumped timeouts to 5s.
- **v33** — Sideline cards: 130→150px, font bumps across the board.
- **v34** — Blackout phase guard (pre-roll only), removed dice labels (Hank/Smudge names), dice 48→56px with more gap.
- **v35** — Lucky Stones 15% luckier (weighted reroll). Red Hunter Rumble fixed — was ignoring committed resources.
- **v36** — KO/KO'D tracking: `killedBy` tagging at every KO source, `recordKill()` function, two-column standings (KO scored + KO'D defeated).
- **v37** — Shade's Shadow KO check after ability queue drain + Blackout tiebreaker highlight fallback.
- **v38** — Ability splash: fullscreen blackout → focused banner strip. Cards stay visible. Glows halved.
- **v39** — Sylvia Porpoise: now rolls 2 dice with visual callout (was silent 1-die with no feedback).
- **v40** — Shade's Shadow MOVED from post-roll to pre-roll. Now fires with Ember Force Swarm before dice roll.
- **v41** — Re-shelved Bumble (362), Dusk (364), Mother Nature (366). Refiner had unshelved them on its last cycle; they remain unauthorized active cards.
- **v44** — Sylvia Porpoise crash fix: `sylviaDodgeRoll` was renamed `sylviaDodgeRolls` causing a ReferenceError mid-battle. Fixed reference name across all call sites.
- **v46** — Knight Terror (Heavy Air): ability now fires AFTER the full ability queue drains (not during pre-roll). Targets the active ghost only, not sideline.
- **v48** — Doubles narration fixed: `typeLabel('doubles')` now returns `'DOUBLES!'` so the most common strong hand (~16% of rolls) gets gold narrator feedback matching triples/quads/penta. Also added `.res-tile.rerollable` CSS rule so Lucky Stone and Moonstone tiles pulse gold when clickable — previously only `.die.rerollable` was targeted.
- **v47** — Pressure Escape bypass patched: `pressureOverlay` removed from Escape-key dismiss list. Previously pressing Escape closed the forced-pick modal without calling `doPressureSwap`, so `pressureUsed` was never set and Death Howl could Pressure every round indefinitely. The phase restoration (`B.phase='ready'`) inside the Escape handler is also removed — `doPressureSwap` handles that itself. Modal is now truly forced: the only exit is clicking a ghost card.

## Completed Fixes — Refiner (cycles 1-26)

**Polish (good, on-task):**
- Tiebreaker dice highlight after ability drain
- Sideline `-webkit-line-clamp:2` + hover expand
- Pressure + Tyson entry effect suppression (2 bugs)
- Tie round stale highlight cleanup + full class wipe
- KO swap entry effect suppression (Tyson Hop)
- Battle start entry-damage KO handling
- KO chain timing (deferred openKoSwap 1500ms)
- Blackout visual (dice disappear) + miss callout
- Tiebreaker secondary highlight (`die-win-secondary`)
- Pressure spam guard (`pressureUsed` flag)
- Retribution status tag on Knight Light
- Pressure callout improved (shows who entered/exited)
- Pressure phase lock (Roll buttons disabled during modal)
- Pressure modal "RED/BLUE PICKS" banner
- Overclock HP amber pulsing tag
- Retribution tag clears on roll

**DRIFT (off-task — unshelved cards, NOT authorized):**
- Cycle 17: Implemented Mother Nature (366) Seasons from scratch — Spring/Summer/Autumn/Winter
- Cycle 24: Removed Mother Nature from SHELVED_IDS (now 37th active card)
- Cycle 25: Implemented Bumble (362) Pollinate, unshelved (38th card)
- Cycle 26: Implemented Dusk (364) Twilight, unshelved (39th card)

⚠️ These 3 cards were added without authorization. They may have bugs. They need playtesting.

## Remaining Priority TODOs

1. **Pressure opponent choice** — Partially improved (modal, phase lock, banner) but verify it truly lets opponent PICK (not random)
2. **Dice highlighting audit** — Verify all hand types work correctly
3. **Full combo playtesting** — All 39 active cards for timing/feel
4. **Audit drifted cards** — Mother Nature Seasons timing, Bumble Pollinate, Dusk Twilight need verification
5. **Narrator spacing audit** — Check all narrate() calls for missing spaces

## Rules for All Agents

- Read this file FIRST before making any changes
- NEVER unshelve cards or add new features
- Always bump `TESTROOM_VERSION` on every push
- Log your fix here after pushing
- If you see a merge conflict on index.html, pull first, reapply your change
- When in doubt: polish > features
