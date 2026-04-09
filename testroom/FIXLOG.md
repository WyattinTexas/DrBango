# Testroom Coordination Log

All agents working on testroom/index.html should read this before making changes.
After fixing something, log it here so other agents don't duplicate work.

## Current Version: v33

## Completed Fixes (this session, 2026-04-09)

- **v29** — Double ability callout: small `#abilityCallout` text was showing behind big `#abilitySplash`. Fixed by hiding small callout while splash is active, showing it after splash fades.
- **v30** — Narrator spacing: `display:flex` on `.narrator-inner` was collapsing whitespace between `<b>` tags. Fixed by wrapping innerHTML in `<span>`.
- **v31** — Lucky Stone reroll stuck on `?`: `revealDice()` needs IDs from `showRolling()` which aren't present during reroll. Fixed by using `renderDice()` directly.
- **v32** — Moonstone not applying: countdown timer wasn't cleared when transitioning from pick-resource to pick-die phase. Fixed + bumped timeouts to 5s per step.
- **v33** — Sideline cards too small: 130px→150px, ability banner 9→10px, description 9→10px, name 11→12px.

## Refiner Fixes (cycles 1-16)

- Tiebreaker dice highlight after ability drain
- Sideline `-webkit-line-clamp:2` + hover expand
- Pressure + Tyson entry effect suppression
- Tie round stale highlight cleanup
- Full highlight class wipe in `highlightWinnerDice`
- KO swap entry effect suppression (Tyson Hop)
- Battle start entry-damage KO handling
- KO chain timing (deferred openKoSwap when splash active)
- Blackout visual (dice disappear immediately)
- Blackout miss callout
- Tiebreaker secondary highlight (`die-win-secondary`)
- Pressure spam guard (`pressureUsed` flag)
- Retribution status tag on Knight Light
- (cycles 16+ ongoing)

## Remaining Priority TODOs

1. **Pressure opponent choice** — Death Howl's Pressure currently does random swap; opponent should pick who comes in
2. **Dice highlighting** — verify winner dice glow is working correctly across all hand types
3. **Full combo playtesting** — timing/feel across all 36 cards

## Rules for All Agents

- Always bump `TESTROOM_VERSION` on every push
- Read this file before starting work — don't duplicate a completed fix
- Log your fix here after pushing
- If you see a merge conflict on index.html, pull first, reapply your change
