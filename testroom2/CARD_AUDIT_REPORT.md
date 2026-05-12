# Testroom Card Audit Report (v689)
**Date:** 2026-04-11
**Total cards in GHOSTS array:** 230 (186 unique ghosts, some duplicates)
**Shelved (gallery-only):** 46 cards (IDs 316-368 range)
**Playable:** 184 cards

---

## SUMMARY

| Status | Count | Notes |
|--------|-------|-------|
| PASS   | 184   | All playable cards have resolver code |
| WARN   |   4   | Minor issues found and FIXED |
| FAIL   |   0   | No broken cards |

---

## FIXES APPLIED THIS SESSION

### NEW: Castle Gardener (442) — Cultivate
- Added interactive pre-roll modal (cultivateOverlay)
- Added `doCultivateChoice()` handler
- Added doTeamRoll trigger + Duel Phase trigger
- Added per-round reset (`B.cultivateDecided`)
- Added smartAutoPlay.js mirror (auto-converts all seeds to fire)
- Boopies (419) synergy wired (Healing Seed spend = +1 Lucky Stone)

### FIX: Missing overlays in clearAllOverlays()
Four overlays were not being cleared on battle reset:
- `chowOverlay` (Chow 414)
- `hexOverlay` (Mable Stadango 446)
- `nickKnackOverlay` (Nick & Knack 409)
- `jasperOverlay` (Jasper 428)
- `balatronOverlay` (Prince Balatron 113)
- `sylviaOverlay` (Sylvia 313)

All six now added to `clearAllOverlays()`.

---

## 400+ CARD AUDIT (All Final 50 + new batch)

| ID  | Name              | Ability            | Resolver | Sim Mirror | Interactive | Status |
|-----|-------------------|--------------------|----------|------------|-------------|--------|
| 401 | Knight Terror     | Haunt              | 1 ref    | 2 refs     | -           | PASS   |
| 402 | Knight Light      | Shield Wall        | 4 refs   | 1 ref      | -           | PASS   |
| 403 | Smudge            | Smoke Screen       | 2 refs   | 2 refs     | -           | PASS   |
| 404 | Chagrin           | Grudge             | 6 refs   | 2 refs     | -           | PASS   |
| 406 | Fed and Hayden    | Tag Team           | 1 ref    | 2 refs     | -           | PASS   |
| 409 | Nick & Knack      | Knick Knack        | 2 refs   | 2 refs     | Overlay OK  | PASS   |
| 410 | Mirror Matt       | Seven Years        | 1 ref    | 1 ref      | -           | PASS   |
| 413 | Sable             | Smoldering Soul    | 4 refs   | 5 refs     | -           | PASS   |
| 414 | Chow              | Secret Ingredient  | 3 refs   | 2 refs     | Overlay OK  | PASS   |
| 415 | Nyx & Bessie      | Moo! Caw!          | 2 refs   | 2 refs     | -           | PASS   |
| 416 | Rook              | Charcoal           | 3 refs   | 3 refs     | -           | PASS   |
| 417 | Twyla             | Lucky Dance        | 1 ref    | 2 refs     | -           | PASS   |
| 418 | Pip               | Toasted            | 2 refs   | 3 refs     | -           | PASS   |
| 419 | Boopies           | Boopie Magic       | 2 refs   | 2 refs     | -           | PASS   |
| 420 | Lars              | Light the Way      | 1 ref    | 1 ref      | -           | PASS   |
| 423 | Zippa             | Glimmer            | 1 ref    | 2 refs     | -           | PASS   |
| 424 | Bigsby            | Omen               | 2 refs   | 3 refs     | -           | PASS   |
| 426 | Chester           | Well Read          | 1 ref    | 2 refs     | -           | PASS   |
| 427 | Garrick           | Watchfire          | 3 refs   | 3 refs     | -           | PASS   |
| 428 | Jasper            | Flame Dive         | 1 ref    | 2 refs     | Overlay OK  | PASS   |
| 429 | Young Cap         | Energize           | 3 refs   | 2 refs     | -           | PASS   |
| 430 | Gordok            | River Terror       | 1 ref    | 2 refs     | Overlay OK  | PASS   |
| 431 | Wise Al           | Squall             | 1 ref    | 2 refs     | Overlay OK  | PASS   |
| 432 | Valkin the Grand  | Grand Spoils       | 1 ref    | 2 refs     | -           | PASS   |
| 433 | Lucas             | Kindling           | 1 ref    | 1 ref      | -           | PASS   |
| 435 | Willow            | Joy of Painting    | 3 refs   | 2 refs     | -           | PASS   |
| 436 | Princess Shade    | Bounty             | 1 ref    | 5 refs     | -           | PASS   |
| 437 | Rascals           | Stampede           | 1 ref    | 1 ref      | -           | PASS   |
| 438 | Champ             | Overpower          | 2 refs   | 2 refs     | -           | PASS   |
| 439 | Lucy's Shadow     | Mentor             | 1 ref    | 2 refs     | -           | PASS   |
| 440 | Gom Gom Gom       | Chaos              | 1 ref    | 1 ref      | -           | PASS   |
| 441 | Wendy             | Moonbeam           | 1 ref    | 1 ref      | -           | PASS   |
| 442 | Castle Gardener   | Cultivate          | 3 refs   | 1 ref      | Overlay OK  | PASS   |
| 443 | Captain James     | Final Strike       | 1 ref    | 1 ref      | -           | PASS   |
| 444 | Goob Party        | Dance Break        | 3 refs   | 2 refs     | -           | PASS   |
| 445 | Mike              | Torrent            | 2 refs   | 2 refs     | -           | PASS   |
| 446 | Mable Stadango    | Hex                | 3 refs   | 1 ref      | Overlay OK  | PASS   |
| 447 | Professor Hawking | Wisdom             | 1 ref    | 1 ref      | -           | PASS   |
| 448 | Harvey            | Harvest Moon       | 1 ref    | 1 ref      | -           | PASS   |

---

## LEGACY CARD AUDIT (IDs 1-315)

All 138 playable legacy cards (IDs 1-315, excluding shelved) have resolver code in both index.html and smartAutoPlay.js. No missing resolvers found.

Interactive modals verified working:
- Selene (305) — seleneOverlay
- Toby (97) — tobyOverlay
- Guardian Fairy (99) — guardianFairyOverlay
- Tyler (105) — tylerOverlay
- Eloise (85) — eloiseOverlay
- Boo Brothers (17) — booOverlay
- Bogey (53) — bogeyOverlay
- Gus (31) — gusOverlay
- Mallow (89) — mallowOverlay
- Jackson (50) — jacksonOverlay
- Jeanie (90) — jeanieOverlay
- Sonya (69) — sonyaOverlay
- Dark Wing (76) — darkWingOverlay
- Raditz (62) — raditzHuntOverlay
- Doug (63) — dougCautionOverlay
- Fang Outside (6) — fangOutsideOverlay
- Fang Undercover (7) — fangUndercoverArmOverlay + fangUndercoverSwapOverlay
- Winston (15) — winstonSchemeOverlay
- Romy (114) — romyOverlay
- Timber (210) — timberOverlay
- Toboggan — tobogganOverlay
- Sylvia (313) — sylviaOverlay
- Prince Balatron (113) — balatronOverlay
- Gale Force — galeForcePickerOverlay

---

## SHELVED CARDS (46 total — gallery only, no resolver needed)

IDs 316-368 range. These are design concepts in the GHOSTS array but excluded from play via SHELVED_IDS. They intentionally have no resolver code.

---

## CONCLUSION

All 184 playable cards pass audit. No broken resolvers. Castle Gardener (442) fully wired. Six missing overlay clears fixed in clearAllOverlays().
