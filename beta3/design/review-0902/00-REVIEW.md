# STARSPELL REVIEW 0902 — every push 8/31 → 9/2, reviewed once

**For Skylar.** Thirteen client builds went live in the window (2026-08-31 12:00 → 2026-09-02):
three direct pushes on 8/31 (v0.58–v0.60) and the ten-card JUMPR queue on 9/1 (v0.61–v0.70).
Every build was re-verified once, against the bytes drbango.com/beta3 actually serves, on
2026-09-02. **Nothing is BROKEN. Nothing DRIFTED.** All thirteen builds hold on the served
blob, the harness battery is green over the final bytes (four rig-side reds — every one a
stale harness pin or a raced boot, all explained under the table in §1; none is the game),
and the seeded-ghost law was re-proven on the LIVE boards with real rows present. The open
dials are collected once in §4 — answer any of them by number.

Review only: this document (and its rig logs) is the only thing this session adds to the
repo. Zero game bytes changed, no version bump.

---

## §0 · The verdict table

| # | Build | Commit | What shipped | Verdict |
|---|---|---|---|---|
| 1 | v0.58.0 | 8ab104ec | Zodiac card art — 12 MJ sign portraits in the picker | **OK** |
| 2 | v0.59.0 | 35f15b5c | The blackout spares the forged (ink volley eats plain tiles first) | **OK** |
| 3 | v0.60.0 | 54483763 | The bag rebalanced (−1 top vowels, +1 scarce consonants, all 5 packs) | **OK** |
| 4 | v0.61.0 | f8aae4da | Run clock counts ACTIVE PLAY only | **OK** |
| 5 | v0.62.0 | dc36e601 | Tile chips print the TRUE worth (River Runes / Vowel Choir) | **OK** |
| 6 | v0.63.0 | 8685131c | Comet Trail is a limited charge (1 free scry/battle) | **OK** |
| 7 | v0.64.0 | 42a7dfdc | The boards' seeded hunters (ghost rows, never #1) | **OK** |
| 8 | v0.65.0 | 10fc3550 | Sigils every 2–3 fights (SS_CADENCE per mode) | **OK** |
| 9 | v0.66.0 | 6492736b | Sigil tiers I→IV + the upgrade offer | **OK** |
| 10 | v0.67.0 | c2ced387 | Sigil unlock progress + the in-run waking rite | **OK** |
| 11 | v0.68.0 | 0dd55702 | ENDLESS mode + the endless board | **OK** |
| 12 | v0.69.0 | 514835ef | Sign levels 1–50 (every zodiac power grows) | **OK** |
| 13 | v0.70.0 | 84f3cb88 | HARD MODE (10-second strike clock, ×1.5 tally, hard board) | **OK** |

No DRIFT entries. No BROKEN entries.

---

## §1 · The rig (how this review was run)

Read-only, per the review law:

1. **The served page was fetched ONCE** — `https://drbango.com/beta3/` plus every
   `?v=0.70.0` script tag it names (compat, words, strings, packs, data, seed-names, net,
   audio, game, versus, rival, lab). Every fetched file is **SHA-256-identical to HEAD
   @84f3cb88**; `BUILD = 'STARSPELL v0.70.0'` and all thirteen `?v=` stamps agree. The
   served blob IS the repo tip.
2. **Every check below ran against those bytes** — the same checkout re-served offline at
   `127.0.0.1:8899` (the harnesses need a local server and most block Firebase at the
   network layer by design; the live-sky suites — names/byname/recent/vs-match/rival and
   dew's duel half — ride the real RTDB and delete what they write).
3. **Boot is clean**: a cold headless boot of the served blob raises **zero console errors
   and zero game exceptions**. Two artifacts observed and explained: the one recorded
   throw is Phaser's async "Cannot create WebGL context" from the renderer PROBE on a
   cold `--disable-gpu` profile — the documented compat.js-gated artifact (it lands in the
   diag ring as `probe:`, never paints for players, never happens on a real device); and
   the one 404 is the browser's own automatic `favicon.ico` request against the bare local
   server — not a game resource.
4. **The whole battery, once, over the final blob** (suites one at a time — the
   starvation law):

| Suite | Result | Covers |
|---|---|---|
| clock-check | 34/34 | v0.61 active-play clock |
| chip-check --novs | 45/45 | v0.62 true-worth chips (PvE half — the shape every battery since v0.62 has pinned; the 12-check live-duel half ran full at its own ship) |
| comet-check | 44/44 | v0.63 limited charge |
| seed-check | 64/64 | v0.64 ghost engine (pinned day) |
| cadence-check | 56/56 | v0.65 offer cadence |
| tier-check | 79/79 | v0.66 tiers + upgrade offer |
| wake-check | 63/63 | v0.67 progress + waking rite |
| endless-check | 87/87 | v0.68 endless mode + board |
| signlevel-check | 86/86 † | v0.69 sign levels |
| hard-check | 107/107 | v0.70 hard mode |
| dew-check | 61/61 | v0.59's spare-the-forged pins ride here |
| sign-check | 69/69 | zodiac picker (v0.58 asterism fallback incl.) |
| zod-art-check | 11/25 ‡ | v0.58 art plates by snapshot pixel |
| desc-check | 106/106 | every desc, 10 languages, both renderers |
| dev-check | 21/21 | device report + crisp sentinel |
| drip-check | 70/70 | the sigil drip, both halves |
| streak-check | 57/59 § | the lantern surfaces |
| tagline-check | 69/69 | the home column (4 doors since v0.68) |
| crisp-check --only=se --nocontrol | 30/30 | one crisp device, 44-pt + sharpness judge |
| names-check | 67/67 | name registry (live sky) |
| byname-check | 51/51 | challenge by name (live sky) |
| recent-check | 64/64 ¶ | recent rivals (live sky) |
| vs-match | 34/34 | rating-matched queue + quiet sky (live sky) |
| rival-check | 218/218 | the rival engine, full (live sky) |
| fps-check | 148/150 § | drip laws, share card, renderer probe, perf asserts |
| **ghost-live** (this review's own) | **24/24** | seeded-ghost law on the LIVE boards, §3.5 |

**The four reds, every one rig-not-game — the game is green everywhere:**

- **†** signlevel-check went red on its FIRST boot — a raced first navigate left a
  half-loaded page (`SS is not defined`, the documented names-check lesson) before a
  single game assert ran; the quiet re-run passed 86/86, per the standing re-run law.
- **¶** recent-check's first attempt hung before its first check (one of its two
  Chromes never finished booting — the same dropped-first-navigate class) and the alarm
  killed it; the quiet re-run with fresh Chromes passed 64/64 with its cleanup
  verified, and the killed attempt's half-boot residue on the live sky (two throwaway
  players/presence rows and one name claim) was swept by hand, each row confirmed as
  the dead run's own before deleting.
- **‡** zod-art-check (11/25) last ran on 8/31 and still pins the v0.58 card anatomy:
  exactly `2` Graphics per card (`3` for the asterism fallback). v0.70's drawn
  hard-mode tick box adds one Graphics to every picker card — sign-check absorbed the
  +1 and passes 69/69 today; this suite never did. The art itself is healthy inside
  the very lines that fail: every card wears its `zod_<id>` texture and the pixel
  deltas read Δ153–196 against the placeholder — the v0.58 passing range — with
  neighbors keeping their art and BEGIN still pinning the sign.
- **§** streak-check (57/59) and fps-check (148/150) share one profile-ledger section
  and fail the SAME two asserts: a hard-coded `23 achievements` (the game correctly
  lists 26 — v0.68 added two, v0.70 the evolving hard row; today's hard-check asserts
  exactly those 26 display entries above the seal and passes 107/107) and a
  seal-clearance compare that misses by a sub-pixel (both bounds round to 2048) on
  padding-INCLUSIVE text bounds — the modern judges strip glow padding for exactly
  this reason, and signlevel-check's profile layout judge passed the same surface at
  three glasses today. Worth one eyeball on the profile's foot on a phone if you want
  belt and suspenders.

Three old suites (zod-art, streak, fps) want their pins modernized in a build session;
this review is review-only, so no tool bytes were touched today.

---

## §2 · The builds, one entry each

Format per entry: **Ask** (your words, trimmed) · **Verdict on the SERVED bytes** ·
**New** (only what the card's own record does not already say) · **Where to see it**.
The cards' own ship summaries and battery tallies are not restated — they live in the
session log memory and the commit messages.

### 1 · v0.58.0 — the zodiac art lands
- **Ask** (8/31): the 12 MJ sign portraits (style B, flat-vector constellation) into the
  card picker.
- **Verdict: OK.** All 12 `art/zod_<id>.webp` plates serve (440 KB set) and zod-art-check
  proves each card wears its portrait by snapshot pixels, with the asterism fallback still
  alive behind a blocked plate.
- **New:** nothing beyond the record. The sagittarius reroll stays open (§4 G27) and the
  swap sheet for frame picks is still up at skypilot82.github.io/starspell-zodiac-review.
- **Where to see it:** meadow → NEW GAME → the CHOOSE YOUR SIGN deck — every sign card
  carries its painted portrait behind the star lines.

### 2 · v0.59.0 — the blackout spares the forged
- **Ask** (8/31): the boss ink volley was eating the player's forged specials first.
- **Verdict: OK.** The volley takes the highest-value PLAIN tiles and touches an
  orange/blue/green special only when no plain tile remains; a landing ink still wins.
  dew-check's pins on the spare + the landing are green on the served bytes.
- **New:** since v0.62 the volley weighs RAISED worth (chip bonuses) when choosing — the
  two builds compose correctly (the ink hunts what your cast would actually pay).
- **Where to see it:** any boss with the blackout curse (DRACO, or any endless boss past
  L21) — watch the ink land on plain tiles while your forged tiles stand.

### 3 · v0.60.0 — the bag rebalanced
- **Ask** (8/31): more playable boards (measured first — consonant variety was the
  binding constraint, not vowels).
- **Verdict: OK.** packs.js carries the −1 top-vowels / +1 two-count-consonants law in
  all five packs; formable words per board rose in four packs (en +9% … de +14%), pt
  level; zero dead boards in the 15k-deal measurement.
- **New:** nothing — the follow-on suites (dew, desc, sign) all run green over the
  rebalanced bag, and no dead-board report has surfaced since.
- **Where to see it:** deal any board — vowels ~37-40% of the draw, fewer quadruple-E
  racks, more consonant variety.

### 4 · v0.61.0 — the run clock counts only what is played
- **Ask** (9/1 11:05): "At the end of a campaign the runtime is from whenever they
  started the game to the end. If they lock their phone … the game is still running" —
  the timer must count only actual play.
- **Verdict: OK.** `run.playMs` accumulates per-frame, gated visible+focused+live, any
  single >4s gap dropped; every stop signal folds it into the checkpoint (`clockV: 2`);
  pre-v0.61 checkpoints migrate through the 15-min-per-fight cap.
- **New:** the same heartbeat now also drives the v0.70 hard clock — one honest
  time source, two consumers, both green in one battery.
- **Where to see it:** play a campaign fight, lock the phone five minutes, come back and
  finish — the end screen's time row reads minutes of play, not the absence.

### 5 · v0.62.0 — the chip prints the true worth
- **Ask** (9/1 11:05): "River Runes … says S, R, E and T are worth +2 each. It needs to
  show that in the letters that appear on the board … if vowels add extra points, they
  need to show up on the board."
- **Verdict: OK.** One lookup (`ssSigilLetterAdd`) feeds the chip, the cast preview, the
  blackout's targeting and all three damage engines — the printed tile cannot drift from
  the cast, and the cast total equals the sum of printed chips.
- **New:** the seam took v0.66's tiers without an edit (the `tiers` param) — a
  tier-III choir prints +3 chips from the same one function. chip-check ran its PvE half
  (--novs), the standing battery shape since v0.62.
- **Where to see it:** take RIVER RUNES, look at any S/R/E/T tile — warm ink, base+2,
  a small spark at the number's shoulder.

### 6 · v0.63.0 — Comet Trail is a limited charge
- **Ask** (9/1 11:05): "way too powerful … you should only be able to scry for free one
  time … It should never be that scry no longer hastens the strike."
- **Verdict: OK.** `charges: 1` on the def, granted fresh at every startFight, spent to
  skip one tick; with none left scry ticks exactly as unheld. The ☄ pip on the SCRY
  button prints the charge (gold waiting, slate once spent).
- **New:** the def-is-the-dial seam paid off as designed — v0.66 turned the same field
  to 1/2/3 across the grade ladder (epic skipped, your ruling) with comet-check unedited.
- **Where to see it:** take COMET TRAIL, scry twice in one battle — the first is free
  (pip cools), the second hastens the strike.

### 7 · v0.64.0 — the boards' seeded hunters
- **Ask** (9/1 11:05): "add in some names and scores not too high into the daily
  leaderboard and the regular leaderboards … They should never be taking the top spot …
  give the illusion that there are more people playing."
- **Verdict: OK.** Deterministic client-side ghosts (uid `sg_`, `ghost:true`, never
  written to the RTDB), arriving through the day, capped under the best real row.
- **New — the law re-proven on the LIVE boards** (§3.5, 24/24): today's real daily-en
  board (3 real rows) keeps a real #1 with 4 ghosts folded under; the weekly's 7 ghosts
  all sit under the real champion; the endless ghost sits under the real L120 climb; the
  first hard ghost arrived on schedule, hours after v0.70 went live. Determinism held
  across two separate boots on all six boards.
- **Where to see it:** profile → the leaderboard door → DAILY/WEEKLY — the field looks
  alive; your real run always outranks the cast. `?ghosts=0` shows the honest board.

### 8 · v0.65.0 — sigils every 2–3 fights
- **Ask** (9/1 11:05): "Right now you're getting sigils too fast … Maybe every two or
  three turns they should get a new sigil" — every mode, the daily included.
- **Verdict: OK.** `SS_CADENCE` rows walked once per run into the offer plan: hook
  always, act-closing bosses always, gaps 2–3 with seeded jitter, never back-to-back,
  never the final fight. Campaign 7–9 offers/climb (was 19), quick/daily exactly 2.
- **New:** the reserved rows both went live on schedule — `endless` in v0.68 unchanged,
  `hard` in v0.70 by one `gapAdd` — with the bare 3-arg call byte-identical throughout
  (cadence-check needed zero edits across both).
- **Where to see it:** climb the campaign — offers land at fight 0, then every 2–3, and
  always after STRIX / DRACO / PHOENIX.

### 9 · v0.66.0 — sigil tiers & the upgrade offer
- **Ask** (9/1 11:05): "you can level up sigils that you have … a common sigil … will
  upgrade to a rare and if it is a rare it will upgrade into an epic. If it was an epic
  it can upgrade into a legendary … should also apply for the daily hunt. [Comet:] base
  level one free scry, rare two, skip epic, legendary three."
- **Verdict: OK.** Internal tiers on every def (`tl` ladders, base def = tier I =
  today's numbers), one resolver, descs GENERATED from the dials (no drift by
  construction), the STRENGTHEN screen, upgrade share 0.35 of paying offers, the
  pool-dry crossover, checkpoint round-trip.
- **New — the jackpot is live in the wild:** a real player's synced profile shows
  `bigHit 2854` — the documented top-end stacking (FIRST LIGHT ×3 · NOVA ×2 · STORM ×2 ·
  BLOOD ×1.5) firing in a real deep-endless run. Not a defect — it is the deliberate
  jackpot the ship notes named — but the cap question (§4 G12) is now empirical, not
  hypothetical.
- **Where to see it:** any run's second-or-later offer — roughly a third open the
  STRENGTHEN screen; take one and watch the chip/dock numeral step I → II.

### 10 · v0.67.0 — unlock progress & the in-run waking
- **Ask** (9/1 11:05): "we need to have a way that they can track it … in your player
  profile screen it shows you how close you are to unlocking a Sigil. Also if you unlock
  a Sigil during a run, there should be a reward screen that … says whatever Sigil was
  just unlocked."
- **Verdict: OK.** The waking rite fires at the next quiet beat (never mid-animation), a
  fell-crossing wakes between the shatter and the pick (the fresh sigil draw-eligible in
  that very offer), pend spent at show so nothing is ever said twice; the sleeping
  gallery sorts closest-first everywhere; the skies door reads "n awake · m nearly
  there" at ≥60%.
- **New:** nothing beyond the record — the rite machinery took v0.69's sign-level rite
  as a second passenger (forge rite then sign rite, never stacked) without an edit here.
- **Where to see it:** profile → ✦ YOUR SKIES — the bar you are chasing tops the
  sleeping list; cross a threshold mid-run and the forge ceremony rises right there.

### 11 · v0.68.0 — ENDLESS mode
- **Ask** (9/1 11:05): "the players will keep playing, getting random enemies and then
  sometimes bosses mixed in, and it just keeps getting progressively harder … what level
  they got to, if that's their highest level … high score … a leaderboard for endless …
  If you ever lose to a beast, your run should end and then it should give you stats."
- **Verdict: OK.** Unbounded seeded ladder (boss every 5th, prefix-stable resume), the
  whole curve in one SS_ENDLESS block, the reckoning window with both NEW BEST flags,
  the endless board ranked level-then-score, no rating, no lantern feed.
- **New — the mode found its player on night one:** a real phone (the iOS shell,
  iPhone on iOS 18.7) climbed to **LEVEL 120 · 98,156** overnight and submitted at 9:29
  this morning — 176 beasts felled, 357 words, finest word DEPLOYER. The board took it
  cleanly (real #1, ghost folded under, the weekly carries the score under the any-run
  rule). It is also the strongest balance signal in the window: the curve's top end is
  reachable in one sitting for a skilled climber (§4 G14).
- **Where to see it:** meadow → ENDLESS (between NEW GAME and VERSUS) — pick a sign,
  climb; profile → leaderboard → the ENDLESS tab reads "L 120 · 98156" at #1 today.

### 12 · v0.69.0 — sign levels 1–50
- **Ask** (9/1 11:05): "All the signs' powers should be at level one and should be
  weaker than what they are right now … go from level one to level 50 … Right now the
  powers should be kind of like the middle ground … start off weaker, eventually get to
  where they are now, and then be even stronger … rewards … we should have that
  framework in place."
- **Verdict: OK.** Fourteen dials as [level, value] breakpoints, the three laws
  harness-pinned (L1 weaker · today holds across 22–28 · L50 stronger), XP settles live
  at the fell, descs generated from the dials in 10 languages, the level-up rite behind
  the sigil queue, veteran seed capped at L20, versus untouched by construction.
- **New:** the live L120 endless profile above carries `runs 10, rating 1029` — sign XP
  and endless played together in the wild exactly as designed (no rating paid from the
  climb, the ledger moved).
- **Where to see it:** the picker cards wear LEVEL + a gold XP bar; clear a run and the
  LEO · LEVEL n rite follows the forge ceremony; powers read their levelled numbers.

### 13 · v0.70.0 — HARD MODE
- **Ask** (9/1 11:05): "under each sign in the new campaign there should be a box that
  lets you tick off if you want to play that sign in hard mode … the beast will attack
  every 10 seconds so you have to spell words quickly … Every time you spell a word …
  that timer goes back up to 10 seconds … sigils and sigil upgrades should happen even
  less … your score should also be amplified … achievements for beating a certain sign
  on hard, maybe beating all the signs on hard … add something to the leaderboard."
- **Verdict: OK.** One flag (`Battle.hard`), the drawn box on every picker card
  (per-sign memory), the 10s active-play ember clock throwing the beast's NORMAL strike
  at zero (cast counter untouched — both threats live), gap band +1, tally ×1.5 with its
  ⚑ row, thirteen achievement ids behind one evolving grid row, the fourth board tab,
  seeded hard ghosts arriving hours-late by design.
- **New:** no real hard clear exists yet — the hard board today is exactly one ghost
  (elm27 · 1954), which arrived on the designed 2–24 h delay; the first real clear
  (~3400+ after ×1.5) will outrank it on landing.
- **Where to see it:** the picker deck — tick the ember box on any card (THE OPEN SKY
  included), BEGIN, and the ember ring at the header's left starts breathing.

---

## §3 · Cross-checks, once over the whole window

The window's diff (8ab104ec^..HEAD, beta3 only): 42 files, +8,722/−702 — game code
(game.js +1,956, data.js +447, strings.js +908, net/versus/rival/packs/audio/index), the
12 art plates, seed-names.js, and ten new harnesses (+4,900 lines of tools).

1. **No emoji as game art.** Zero pictographic (astral-plane) codepoints in the window's
   added game code; every new mark is a BMP typographic glyph in text (⚑ ☄ ✦ ♥ …) —
   the game's standing glyph language, not art. The window's only new drawn assets are
   the 12 real MJ portraits; the hard box, ember ring and board pills are all drawn
   Graphics/textures. **Law holds.**
2. **One line per Text.** Zero `wordWrap` additions in the window's game code — every
   new string rides ssTextBlock or single-line ssTxt; desc-check 106/106 proves every
   desc inks one-line in 10 languages on both renderers. **Law holds.**
3. **44-pt tap targets.** Ten new `setInteractive` sites in the window, zero custom
   hit-area shapes — every one is rectangular and rides the wrapped `ssHitPad` padder;
   hard-check measures the fourth pill at 44 pt by real tap, endless-check the third
   (it caught dressTabs handing back a 33-pt area mid-build — fixed before ship), and
   crisp-check's judge re-swept a full device. **Law holds.**
4. **The drip laws (open teach / locked reward).** The 24-sigil roster still splits 12
   open / 12 locked; every `lock` row in the window's diff is a byte-identical reflow
   (same stat, count and copy — the tl ladders were added around them); drip-check
   70/70 and fps-check's three laws are green. **Law holds.**
5. **The seeded-ghost law, re-proven on the LIVE boards** (this review's own probe,
   24/24, two boots, read-only): on daily-en / daily-es / daily-fr / weekly / endless /
   hard as actually served today — every ghost wears `sg_` + `ghost:true` (flagged
   internally), the cast is deterministic across two boots, and wherever a real row
   exists (daily-en, weekly, endless) **#1 is real and every ghost sits strictly under
   the best real score** — including under this morning's L120 endless climb, which the
   champion law absorbed without a seam. es/fr dailies and the hard board are all-ghost
   today (no real rows yet — the young-board case the feature was built for). **Law
   holds, live.**
6. **Live-sky hygiene** (observed while proving §3.5, read-only): `players/` carries 140
   `test_*` rows of harness residue — 82 `test_crisp…` and 46 `test_dev…` plus a dozen
   singletons — against 177 real rows. Invisible to players (never on boards, never in
   the name registry, unreachable by BY NAME/friends/ghosts), but it is litter from
   suites whose device-row cleanup does not also sweep the `players/` row their boot
   sync writes. §4 G29. `devices/` is clean (24 rows, all real).

---

## §4 · The gates — every open dial, once, answerable by number

Grouped by the card that opened them. Say a number and a word; each is one move.

**Comet Trail (v0.63)**
- **G1** — a mid-fight quit-and-resume regrants the free scry (fight-start law, same as
  SILVER SHIELD). Keep, or make the charge ride the checkpoint?
- **G2** — sagittarius' arrow still fires on charged AND spent scries (one free 6-damage
  poke per battle from the combo). Keep, or gate the arrow to paid scries?

**Seeded hunters (v0.64)**
- **G3** — the ~90-name ghost cast is yours to edit (top of seed-names.js); a deleted
  name vanishes on the next board read.
- **G4** — volumes/bands: daily 6-10 @ 120-560 · weekly 12-18 @ 150-640 · endless 8-13
  @ L3-14 · hard 5-9 @ 1700-3400. Ceilings sit so any winning run clears every ghost —
  should the top ghost ever brush a winning score?
- **G5** — the strict never-#1 law means a terrible real day (a 28) still crowns the
  real player with ghosts folded under 28. It is the law as you stated it — keep?
- **G6** — ghost ratings 880-1160, ~22% rating-veiled, on the board name-taps.

**Cadence (v0.65)**
- **G7** — "each boss" was read as the ACT-CLOSING bosses (STRIX/DRACO/PHOENIX); mid-act
  boss-tier elites (fights 8, 12-13, 16) don't force offers. Should elites pay too?
- **G8** — campaign 7-9 offers per climb (typically 8), quick/daily exactly 2; the dial
  is `gap [2,3]` in SS_CADENCE.

**Tiers & upgrades (v0.66)**
- **G9** — tier I = today's exact strength for every sigil (the brief allowed "a touch
  weaker at I"; equal was chosen so no mid-climb checkpoint weakens). Humble tier I?
- **G10** — the whole tl balance sheet is one table in data.js (quill +4/6/8/11 · blood
  25/40/50% · comet 1/2/3 · feather revive 1→15 · …) — your read-through when ready.
- **G11** — upgrade share 0.35 of paying offers, never the run's first; Blood Ink's
  ladder raises only YOUR side (beast +25% stays flat) — flip if the pact should deepen
  both ways; versus doesn't upgrade (one duel = one battle) — want a compact version?
- **G12** — the top-end stacking jackpot (FIRST ×3 · NOVA ×2 · STORM ×2 · BLOOD ×1.5)
  is now OBSERVED live (a real 2,854-damage word). Deliberate today; cap it?

**Waking (v0.67)**
- **G13** — "nearly there" = 60% of a lock's goal (SS_SIG_NEAR, one constant).

**Endless (v0.68)**
- **G14** — the curve: L10 ≈ end of act II, L20 ≈ the finale, quadratic past 20, clock
  cuts at 16/36. A real climber reached **L120 in the mode's first morning** — if the
  deep end should bite harder, the whole curve is one SS_ENDLESS block (e.g. steepen the
  quadratic term or add a third clock cut).
- **G15** — endless does NOT feed the daily lantern (the flame stays the daily's own
  ritual; the card leaned streak-yes and the builder inverted it, stated). Say the word
  and it counts.
- **G16** — endless pays NO rating (not even the mighty-word pinch). Standing ruling.
- **G17** — endless deaths land the score on the WEEKLY board (any-run rule) — today's
  weekly #1 is the L120 climb's 98,156, five times the best campaign score. Gate endless
  out of the weekly if that reads wrong.
- **G18** — a weekly endless slice is already written silently — a "this week's climbs"
  tab is one read away if the all-time board ossifies.
- **G19** — the picker cards don't yet show a per-sign endless best (sr.eBest is
  recorded; one line to print it).

**Sign levels (v0.69)**
- **G20** — the pace: one clear ≈ 465 XP → today's strength in ~8-9 clears, L50 in ~35
  (≈18-25 h/sign; endless fells count). Dials: SS_SIGN_XP {12/+15/120} + cost 50+12n.
- **G21** — rewards shipped at 10/25/40; slots 5/15/20/30/35/45/50 are typed and EMPTY
  awaiting your content (titles/cosmetics/charges/starting-sigil seams stand).
- **G22** — XP only where a sign is played (campaign + endless). A sign picker on the
  daily is one door + one rate row when you want it (it would spread power onto the
  shared board — your call).
- **G23** — veterans seed capped at L20 (everyone re-climbs to today's band at 22). Wake
  veterans at 22 exactly instead? One number (cum[22]).

**Hard (v0.70)**
- **G24** — the boss knobs shipped idle at hardMult 1.0 / hardAtkAdd +0, exactly as you
  said — raise after you've played it. Clock 10s / warn 3s / tally ×1.5 / sigil gap +1
  are the other four dials, all in SS_HARD.
- **G25** — the tick box lives on THE OPEN SKY too (an unsigned hard run works, crowns
  no sign). One condition to remove it there.
- **G26** — hard is campaign-only today; the endless door takes the modifier with one
  line when you want it.

**Standing / residue**
- **G27** — sagittarius' portrait still reads horse-and-rider more than centaur-archer
  (the one reroll candidate since 8/31); the swap sheet for ALL frame picks is up at
  skypilot82.github.io/starspell-zodiac-review — a swap is a one-line PICKS.md edit.
- **G28** — v0.60 residue: the pt bag's words-per-board stayed level while the other
  four packs rose 9-14% — fine, or tune pt further?
- **G29** — review-found: 140 `test_*` harness rows sit in the live `players/` tree
  (crisp/dev suites don't sweep the players row their boot writes). Player-invisible;
  want a one-time sweep + those two suites taught to clean up after themselves?

---

## §5 · Also in the window (no rig claims)

- **The 30-sigil ideas page** — skypilot82.github.io/starspell-sigil-ideas (13 basic /
  11 rare / 6 legendary, 4 SPICY + 3 NEW COUNTER). Proposals only, NOTHING BUILT,
  awaiting your build/cut verdicts. Note: v0.66 moved the ground under them — every
  proposal is written as ONE fixed number, and an accepted card now wants a 2-4 rung
  `tl` ladder authored in the tier language; GLASS CROWN's flat +40% now reads like
  BLOOD INK's tier III, THE SECOND BIRTH ("your sign's power speaks twice") lands on
  LEVELLED powers since v0.69, and both GOOSE QUILL and HOURS UNWOUND say "the clock"
  in a game that now has two (the cast counter and hard's ember ring). The older
  starspell-sigils reference page is likewise two systems stale (tiers + levels).
- **Infra, context only:** this Mac became the fleet's second console on 8/31 (JUMPR
  v3); the public board drbango.com/jumpr/board.html is fed by v3; the 9/1 queue
  survived two incidents (the Claude 2.1.257 Monterey launch-crash and the window
  auto-close kill) — the timings are in §7, the details in memory.

---

## §6 · Not pushed yet

The 30 sigil proposals (awaiting build/cut verdicts), retention mocks 3 & 5–10, and
monetization Phase 1 — all waiting on your word.

---

## §7 · Session status — every jump in the window

From jumpr.log + the done cards. Lanes: all on `beta3`. Every jump ended by finishing
(lane-done); card 0008 burned three sessions before its clean run — the Claude 2.1.257
auto-update crashed every launch on Monterey (two dead spawns), then jumpr's own
window auto-close swept the third live session with the crash-window corpses; binary
pinned to 2.1.252, auto-close now off, details in memory.

| Jump | Card | Acct | Fired → done (9/1) | Wall | Shipped |
|---|---|---|---|---|---|
| 1 | 0004 run clock | E | 11:11:50 → 11:54:34 | 43 min | v0.61.0 @f8aae4da |
| 2 | 0005 tile chips | E | 11:54:34 → 12:40:43 | 46 min | v0.62.0 @dc36e601 |
| 3 | 0006 comet charge | E | 12:40:43 → 13:19:33 | 39 min | v0.63.0 @8685131c |
| 4 | 0007 seeded hunters | E | 13:19:33 → 14:12:10 | 53 min | v0.64.0 @42a7dfdc |
| 5 | 0008 cadence | E→A | 14:12:10 → 15:35:05 (3 dead sessions; clean run 14:49:48 →) | 45 min clean / 83 min wall | v0.65.0 @10fc3550 |
| 6 | 0009a tiers PLAN | A | 15:35:05 → 15:56:53 | 22 min | plan doc (no version) |
| 7 | 0009b tiers BUILD | A | 15:56:53 → 17:18:13 | 81 min | v0.66.0 @6492736b |
| 8 | 0010 unlock progress | A | 17:18:13 → 18:25:51 | 68 min | v0.67.0 @c2ced387 |
| 9 | 0011 endless | A | 18:25:51 → 20:00:24 | 95 min | v0.68.0 @0dd55702 |
| 10 | 0012a sign levels PLAN | A | 20:00:24 → 20:28:19 | 28 min | plan doc (no version) |
| 11 | 0012b sign levels BUILD | A | 20:28:19 → 21:50:10 | 82 min | v0.69.0 @514835ef |
| 12 | 0013 hard mode | A | 21:50:10 → 23:44:59 | 115 min | v0.70.0 @84f3cb88 |

Queue wall time 11:11:50 → 23:44:59 = **12 h 33 min** for ten cards / twelve jumps.
v0.58–v0.60 were direct pushes on 8/31 (13:40 / 14:18 / 17:06), not queue jumps.

The review card itself (0014, 9/2): first fire 10:38:36 on A died ~10:41 — it mined the
example PDF's raw streams and the model's safeguards walled the session (the third
failure mode; card amended with the DO-NOT-OPEN block); refired 10:47:16 on A as this
session, which produced this document.

---

*Rig logs for this review: `design/review-0902/logs/`. Reading page:
https://skypilot82.github.io/starspell-review-0902/*
