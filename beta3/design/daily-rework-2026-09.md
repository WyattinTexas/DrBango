# STARSPELL — Scrap the Lantern: the Daily Comeback Rethink

**Design doc only. Nothing in this document is built. Zero game bytes changed, no
version bump. The build is a separate future card that fires only on Skylar's
explicit go.**

**Skylar (Skylar's console), 2026-09-02 16:20:** "THE LATERN FOR THE DAILY —
The lantern needs to be brought into the daily button in the top left and then
we need to do a rethink, redesign, rework of the lantern and the players coming
back and playing the daily every single day. scrape the lantern idea all
together." *(voice-dictated; "scrape" = scrap, "latern" = lantern)*

Read as: the standalone streak-lantern concept — the lamp on the meadow, its
sheet, its rite, the streak/grace machinery under it — is **scrapped
altogether**; whatever daily-return signal deserves to survive is **folded into
the top-left daily chip**; and daily-comeback retention is **rethought from
scratch**.

- Written against HEAD `eed0ad1f` (v0.75.0 live). Every `file:line` below was
  re-grepped at write time on these bytes — cards 01–06 of the 9/2 audit queue
  shipped after the lantern did, and the anchors moved.
- Companion review page (phone mocks of everything in §2–§3):
  **https://skypilot82.github.io/starspell-daily-rethink/**

---

## §1 — The inventory: every lantern/streak surface, and what happens to it

Verdict key: **REMOVE** (dies with the lantern) · **SURVIVES-INTO-CHIP** (the
daily chip inherits it) · **NEEDS-SKYLAR-RULING** (posed in §1.9, not decided
here).

### 1.1 The two meadow surfaces today

| Surface | Anchors (v0.75.0) | Verdict |
|---|---|---|
| **The daily chip** — 108×26 `chipred` pill at `l.x(-195), l.y(26)`: ember glow, chip image, `(✓ or ☀) + H:MM:SS` text, tap → `dailySheet()` | build `game.js:5092-5103` (glow `:5093`, chip `:5095`, text `:5097`, tap `:5099`); texture bake `game.js:872`; 1-second tick `game.js:4755`; text refresh `updateDailyChip()` `game.js:5333-5343`; ember re-arm on wake `game.js:4865-4867`; daily liftoff blooms the chip `game.js:5878` | **SURVIVES-INTO-CHIP** — this *is* the chip; §2 redesigns it. Its ✓/☀ text glyphs become drawn glyphs (no-emoji law). |
| **The lantern** — hangs beside the chip at `l.x(-62)`: halo, lamp image, in-pane count, dashed grace ring `◌`, tap → `streakSheet()` | comment + build `game.js:5104-5127` (halo `:5112`, lamp `:5114`, count `:5118`, grace ring `:5121`, tap `:5125`); wake re-dress `game.js:4870-4871` | **REMOVE** — the whole object family (`lanternB/lanternGlow/lanternT/lanternG`, `lanternShown/lanternSwell`). |

### 1.2 The lantern's state machine and textures

| Surface | Anchors | Verdict |
|---|---|---|
| `updateLantern()` — texture pick, halo tiers, count shrink-to-fit, the ascent/intro alpha law, the grew-swell | `game.js:5347-5411` (alpha-law comment `:5383-5390`); called from `updateDailyChip` `:5342` and `idleTweens` `:4871` | **REMOVE** (the ⚠ alpha law it documents — never write ui alpha while `ascending/introPlaying` — stays true for whatever the chip does; carry the comment's lesson into the chip's refresher). |
| Five baked lamp textures `lantern-cold/lit/m1/m2/m3` + fallback painter | painter comment `game.js:883-900`, painter `game.js:901-1038`, the five bakes `game.js:1039-1043`, key list `SS_LANTERN_TEX` `game.js:1239`, geometry consts `SS_LANTERN_W/H/Y/TY` `game.js:1249` | **REMOVE** — ~140 lines of canvas painting. |
| Lantern tier picker `ssLanternTier(n)` | `game.js:1233-1238` | **REMOVE**. |

### 1.3 The streak/grace engine (profile + laws + helpers)

| Surface | Anchors | Verdict |
|---|---|---|
| Laws: `SS_GRACE_EARN=5`, `SS_MILESTONES=[7,30,100]`, `SS_MS_ACH` | `game.js:496-498` | **REMOVE**. |
| `SS.load` migration/seed of `p.streak {n,last,best,g,gp,gd,pend,mk}` | store comment `game.js:558`, create+seed `game.js:564-573`, grace comment `:575`, grace fields `:586-590`, mark seed `:593-596` | **REMOVE** the migration block. Old profiles keep a dead `streak` object in localStorage harmlessly (the loader just stops grooming it); a build card MAY delete the key on load — one line, cosmetic. |
| Old-profile seeding `ssSeedStreak`/`ssSeedStreakFrom` (walks the local daily score log) | `game.js:1340-1355` | **REMOVE**. Note for §3: the local daily score log `prof.daily` itself is **not** a lantern organ — it predates it (v0.19.0), feeds the daily sheet's played-state, and is the raw material several §3 candidates re-read. It stays. |
| Core helpers: `ssStreakState` / `ssStreakCount` / `ssStreakNote` / `ssGraceLine` / `ssMarkCopy` / `ssStreakWeek` | `game.js:1149-1159` / `:1160` / `:1169-1208` / `:1215-1221` / `:1223-1225` / `:1256+` | **REMOVE** all six. `ssStreakNote` is the only writer (called once, from `endRun` — see 1.5). |

### 1.4 The lantern's own doors: sheet, rite, and the sheets that know about them

| Surface | Anchors | Verdict |
|---|---|---|
| `streakSheet()` — THE LANTERN sheet: big lamp, `🔥 night N`, longest flame, week strip of ✓/◌/○ rings, grace line, next mark, and the BEGIN/HUNT-AGAIN door | `game.js:5584-5715` (week strip `:5652-5687`, grace line `:5689-5691`, next mark `:5693-5695`, the daily door `:5697-5704`, heal tag `lantern-sheet` `:5709`) | **REMOVE** whole. Its one useful door (`dpPlay`/`dpAgain` → `dailySheet`) is redundant: the chip already opens `dailySheet` directly. No orphaned path. |
| `milestoneCheck()` + `milestoneRite(m)` — "THE LANTERN GROWS" ceremony honoured from `streak.pend` once the meadow is settled | `game.js:5421-5441` (pend read `:5422`), rite `game.js:5487-5583` (heal tag `lantern-rite` `:5572`) | **REMOVE** both, plus the `create()` call sites `game.js:4781` and the wake call `game.js:6560`, and the field nulls at `game.js:4717` (`streakC/riteC/riteTimer`). |
| Sheet mutual-exclusion lists — `streakC`/`riteC` appear in every sheet's guard and in the sigil/sign notice `settled()` predicates | `streakSheet` guard `game.js:5585`; `langSheet` `:5721`; `dailySheet` `:5757`; `milestoneCheck.settled` `:5426`; `sigilNotice.settled` `:5446`; `signNotice.settled` `:5466` | **PRUNE, don't delete**: the sigil and sign notices are *not* lantern organs — they lose the two dead tokens from their `settled()` and keep working. Every sheet guard drops `streakC`/`riteC`. |

### 1.5 endRun and the daily end screen

| Surface | Anchors | Verdict |
|---|---|---|
| The flame is fed: `streak = ssStreakNote()` on every daily end (win or lose), marks awarded | `game.js:8784-8795` (`:8787` comment, `:8790` call, `:8794` award loop) | **REMOVE**. If §3's chosen mechanic keeps any per-day state, its single write lands in this same spot — the "counted having HUNTED, not having won" law is worth keeping whatever replaces it. |
| End-screen daily block: the breathing `🔥 the lantern is lit / night N` line + the mark/graced/grace-standing second line | `game.js:8962-8985` (flame `:8966-8969`, mark note `:8975-8977`, graced `:8978-8980`, grace line `:8981-8984`) | **REMOVE** the two lines. The daily end window's layout budget frees ~44 units (`py(448)`+`py(470)`; SHARE sits at `py(508)`, buttons at `by=564`) — the build card either reflows SHARE upward or hands the room to the new mechanic's one line. |
| Share payload's streak field | `game.js:8997-9002` (`streak:` `:9000`) | **REMOVE** the field (see 1.6). |

### 1.6 The share card

| Surface | Anchors | Verdict |
|---|---|---|
| `ssShareCard` streak line `🔥 %1-night streak` / `night one` | `game.js:1284-1302` (line `:1299`), keys `shStreak/shStreak1` | **REMOVE the line, keep the card** — score/beast-sky/finest-word lines and `SS_SHARE_URL` (`game.js:1283`) are daily-share organs, not lantern organs. The card was deliberately built to omit the line at streak 0 (`n >= 1` guard), so removal is deleting one line + two keys ×5 langs, and the payload shape stays legal. If §3's mechanic earns a share line, it is specced fresh (§3). |

### 1.7 dailySheet (the notice board) — the lines that lean on the streak

| Surface | Anchors | Verdict |
|---|---|---|
| The at-risk countdown flip: `🔥 keep the flame · H:MM:SS` while a flame stands and tonight is unhunted, else `☾ new sky in …` | `game.js:5793-5800` (`atRisk` `:5796`, flip `:5797`) | **REMOVE the flip**, keep the countdown (`lbNewSky` becomes the only state). §3's mechanic may claim this exact slot back — it is the best "tonight matters" surface in the game. |
| The sheet's streak + grace lines (`🔥 night N`, grace line, tap → `streakSheet`) | `game.js:5812-5825` (streak line `:5817-5819`, grace tap `:5820-5824`) | **REMOVE** — with `streakSheet` gone the tap has no destination anyway. The freed rows (`py(158)/py(176)`) go to the new mechanic's story or the board gets breathing room. |

### 1.8 Satellites: data, sync, rivals, dev seams, strings

| Surface | Anchors | Verdict |
|---|---|---|
| Achievements `flame-7/30/100` (icons 🕯/🏮/🌠) + their comment | `data.js:794-799`; awarded at `game.js:8794` and via `ssMarkCopy().ach` | **NEEDS-SKYLAR-RULING** — posed as (a) below. |
| Profile achievements ledger math — header `achGot / SS_ACH.length`, "grid is 26 deep now… 13 rows at 25 apart" | `game.js:9277-9297` (header `:9278`, comment `:9279-9284`, grid `:9285`) | Follows ruling (a): delete → 23 achs = 12 rows (one empty cell, grid still fits); re-point → count stays 26, grid untouched. |
| Synced fields `streak/streakDay/streakBest/streakGrace/streakMark` on `players/{uid}` | `SS.sync` `game.js:627-643` (fields `:636` and `:639`) | **NEEDS-SKYLAR-RULING** — posed as (b) below. Fact for the ruling: `syncProfile` **merges** (`net.js:473-477`, `Object.assign` over the current row), so a dropped field is NOT self-cleaning — old values sit on live rows until actively nulled. And nothing anywhere reads these fields back (the only `players/` row consumer is the rating card, `game.js:4639`, which uses `rating`/`rhide`). |
| Seeded-rival fakes of the same five fields | `rival.js:648` | Follows ruling (b): the fakes exist so a public-DB datamine can't tell personas from humans by row shape — whatever the live fields do, the fakes must do identically. |
| net.js dev time-travel note ("The streak lantern only means anything across DAYS…") | `net.js:289-298` | **SURVIVES, reworded** — the `?daykey=` / `setDayKey()` seam is the *daily's* seam (rollover, pruning, board keys), not the lantern's; only its comment names the lantern. One-line comment edit on the build card. |
| Strings: 22 `stk*` keys + 2 `shStreak*` keys, ×5 languages = **120 entries** | en `strings.js:63-70` + `:41`; es `:192-199` + `:170`; fr `:378-385` + `:356`; pt `:564-571` + `:542`; de `:750-757` + `:728` | **REMOVE** all 120 (family-grep to zero across served files, the v0.73 law). Any new mechanic's strings are specced in §3, en/es/fr/pt/de only. |
| Text-glyph emoji the streak UI leans on: 🔥 (`game.js:5642, 5797, 5817, 8966`, `:1299`), ◌ (`:1217-1220, 5121, 5670`), week-strip ✓ (`:5661`), legend `✓/◌/○` (in `stkLegend`) | as listed | **REMOVE** with their surfaces (they die with the code that prints them). The chip's own ✓/☀ and dailySheet's ☀/☾ survive as *surfaces* but their glyphs go drawn in §2. Out of scope but noted honestly: emoji as icons exists beyond the streak (e.g. `SS_ACH` icons ☀/🐉/🔥/👁, battle's `🔥 THE FEATHER BURNS` `game.js:8230`) — a full-law sweep is its own future card; this card's removal only promises no *streak* emoji survives. |

### 1.9 Harnesses and suite fallout (inventory only — no tools/ edits on this card)

| Surface | Anchors | What the build card inherits |
|---|---|---|
| `tools/streak-check.mjs` — 394 lines, 59 checks: the whole engine on faked day keys, migration, the rite flow, the ledger | file; stale section `:320-343` | **RETIRED** with the feature. Its two standing reds are the documented v0.70-era stale pins (hard-coded 23 achs `:338`, seal-kiss `:340` — review-0902). |
| `tools/lamp-check.mjs` — 186 lines, ~30 checks/renderer: the lamp's PIXELS in every dress, ×3 roundRect boots | file | **RETIRED** with the textures (its cv run already carries documented rig drift, 28/30 A/B-proven pre-existing). |
| `tools/fps-check.mjs` — the v0.39/v0.40/v0.41 sections (~116 streak/lantern references): streak laws `:460+`, grace+marks `:623+`, rite `:839`, the SAME stale 23-ach ledger assert `:877-888`, share card `:897+` | file | **SURGERY, not retirement**: the streak/lantern/share-streak asserts come out; the shared stale ledger section gets fixed to the then-current ach count *as part of the same cut* (it is the one section streak-check and fps-check share — review-0902). |
| Six suites use `lanternB` as their "meadow settled" sentinel; ftue-check counts it in both chrome censuses | `crisp-check.mjs:278`, `tagline-check.mjs:88` (+ `:316` clears `streak.pend`), `drip-check.mjs:54`, `lang-check.mjs:112`, `wake-check.mjs:98`, `desc-check.mjs:66`; `ftue-check.mjs:151-153` (full meadow HAS it) + `:193-194` (bare meadow lacks it); `endless-check.mjs:25` (comment only) | The build card swaps every sentinel to a surviving object (`dailyChipB` is the natural one) and updates ftue-check's two censuses — otherwise six green suites go red on boot-wait timeouts, not on real defects. Listed here so the build card is costed honestly. |

### 1.10 The three rulings Skylar must make (posed, not decided)

**(a) The shipped `flame-7/30/100` achievements.** Players hold them (they were
awarded from real streaks and also honoured retroactively). Options:

1. **Delete the three rows.** Ledger goes 26 → 23 (12 grid rows, one empty
   cell — fits; the header count is computed, `game.js:9277-9278`). Orphan
   `prof.ach['flame-*']` keys sit harmlessly in old profiles, but a player's
   earned trophy visibly *vanishes*, and the synced `achCount` drops — the only
   option that takes something away.
2. **Keep them as retired relics** (visible only if earned). No one loses
   anything, but the grid becomes per-player variable — new layout machinery
   for three dead rows.
3. **Re-point the three ids at the replacement mechanic's own milestones**
   (keep `flame-7/30/100` ids so earned stays earned; new name/desc/condition).
   Count stays 26, grid untouched, nobody is robbed — but history is quietly
   rewritten (a "SEVEN NIGHTS" trophy becomes a differently-named one).

*Lean, if useful:* option 3 when §3's chosen mechanic has natural milestones
(the recommended one does), option 1 otherwise. Skylar's call.

**(b) The live synced `streak*` fields on `players/{uid}`.** Facts: write-only
(nothing reads them back), merge-synced (dropping them from the payload leaves
stale values on every row forever), and faked identically by seeded rivals
(`rival.js:648`). Options:

1. **Drop from sync AND actively null once** (`streak: null, …` for a release,
   or a one-time cleanup write) — rows end clean; rival fakes drop the same
   five keys in the same build so personas stay indistinguishable.
2. **Drop from sync, leave old values dormant** — zero risk, but every
   pre-rework player carries a fossilized `streak: 14` on the public DB
   indefinitely, and *new* players' rows lack the keys (a datamine can date
   accounts by shape; the persona fakes can't match both shapes at once).
3. **Keep syncing** frozen values — dead weight, honest to nobody.

*Lean:* option 1 — it is the only shape where real rows and persona rows stay
twins. Skylar's call, since it touches live player data.

**(c) The v0.68 endless question — closed.** The standing FOR SKYLAR item
"should the endless climb feed the daily lantern?" (asked when endless shipped;
the ship chose *no* — the flame was the daily's own ritual) is **mooted by this
scrap: there is no lantern to feed. Closed in writing here.** If §3's chosen
mechanic has a "today counted" notion, whether anything besides the daily can
ever count is re-posed fresh in §3's open questions — the honest answer is
still no by default (the brief is *playing the daily* every day).

### 1.11 Removal-only build estimate

Even with §3 answered "build nothing yet", the scrap alone is an **M** card by
the v0.61–v0.70 yardstick (bigger than v0.72's name rollover, far under
v0.68's endless): ~600 lines of game.js out, 120 strings out, 3 data.js rows
per ruling (a), two suites retired + fps-check surgery + seven sentinel swaps,
one net.js comment, rival.js per ruling (b), and a full-family grep proving
`stk*`/`shStreak*`/`lantern`/`streak` dead in served bytes.

---

## §2 — The chip becomes the one daily surface

The corner after the scrap: **one herald, no second lamp.** The chip already
owns the three facts a glance needs — is tonight hunted, how long tonight
lasts, and (new) whatever the §3 mechanic wants you to feel. Everything below
is drawn art (canvas bakes like `chipred` itself) — **no emoji glyphs
anywhere on the redesigned chip.**

### 2.1 The chip, redrawn

Footprint unchanged: 108×26 at `l.x(-195), l.y(26)` — it already survived
five-language clock fitting and the SE safe-band pass; the corner stays quiet.
Three changes:

1. **The state glyph goes drawn.** The leading `✓`/`☀` *text* glyphs become a
   14×14 drawn glyph baked into two chip textures (or one overlay sprite):
   - *unplayed*: a small sun-disc — a filled circle with eight short rays,
     gold on the chip's crimson (the ☀ it always meant, now ink).
   - *played*: a check-stroke — two strokes, gold, with a soft ember dot at
     the join (the ✓ it always meant, now ink).
2. **The ember glow becomes the mechanic's voice.** The breathing `dailyGlow`
   (already there, already tinted) stops being binary played/unplayed and
   carries the §3 state — intensity/tint ramp, spec'd per mechanic in §3
   ("what the chip shows"). The one law: it may *never* exceed today's 0.13
   ceiling — the corner must not shout over the meadow.
3. **A micro-gauge row under the clock text, inside the pill** (only if the
   chosen mechanic needs a count): up to seven 3×3 drawn pips on the chip's
   lower edge. At 108 wide there is room for seven pips + the clock above;
   the de clock (`H:MM:SS` at fs 10.5) already fits with margin.

`updateDailyChip()` (`game.js:5333`) stays the single refresher, still on the
herald's 1s tick, still guarded by the ascent/intro alpha law that
`updateLantern` documented (`game.js:5383-5390` — the lesson survives the code).

### 2.2 The hole at `l.x(-62)`

**Nothing fills it.** Minimal-first: the lamp's slot returns to sky. The chip
does not grow into it, no new object moves in. (If a §3 mechanic ever earns a
second glyph, the chip may widen rightward into the freed air — noted as
room-to-grow, not built.)

### 2.3 The doors, re-routed

| Today | After |
|---|---|
| Lamp tap → `streakSheet` | Gone with the lamp. Nothing routes to a deleted sheet. |
| `streakSheet`'s BEGIN-THE-HUNT / HUNT-AGAIN button → closes into `dailySheet` | Redundant today (the chip already opens `dailySheet`); dies silently with the sheet. |
| `dailySheet`'s grace line tap → `streakSheet` | Line and tap both removed (1.7). |
| `dailySheet`'s countdown flip to `keep the flame` when at risk | Removed; the slot is explicitly reserved for the §3 mechanic's "tonight matters" line. |
| Daily end screen's two flame lines | Removed; the window's freed 44 units go to the §3 mechanic's single line, or SHARE breathes upward. |
| The chip tap → `dailySheet` | **Unchanged** — the one daily door, as Skylar asked. |

### 2.4 dailySheet stays the daily's home

The notice board keeps: header + date + one-sky line, countdown, played/await
state, today's live board, PLAY. It loses the streak/grace rows. The §3
mechanic gets **at most one line + one glyph** here — the sheet is the place
the story is told in words; the chip only ever hums it.

---

## §3 — The rethink: five candidate comeback mechanics

Ground rules applied to all five: designed from scratch (a streak returns only
*reinvented* — decay instead of death, or a calendar instead of a chain);
every icon drawn; strings ×5 languages; the daily board's fairness law is
never broken (every hunter under the same sky sees the same board and the same
scoring — no mechanic may pay in-run power *on the daily* unless Skylar
explicitly rules otherwise, because a momentum-weighted board stops being a
fair race). Build effort uses the v0.61–v0.70 yardstick: **S** ≈ v0.74's
endless-door line, **M** ≈ v0.72's name rollover, **L** ≈ v0.68's endless mode.

---

### ① THE EMBER GAUGE ★ recommended

**Concept.** The flame stops being a chain that dies and becomes **heat that
cools**. One number, 0–7 embers. Hunt tonight: +1 (cap 7). Miss a night: −1
(floor 0). That is the entire rulebook — it fits on the chip, needs no grace
nights, no seeding, no 24 strings of explanation. The lantern punished (one
bad week = ashes, 100 nights owed again); the gauge *forgives by
construction*: the day after a miss you are one night from where you were,
and the game says so instead of apologizing with bookkeeping.

**Player loop.**
- *Day 1:* first hunt drops one ember in the glass — the chip warms a step.
  Visible progress on night one (the lantern showed nothing until night 2).
- *Day 7:* full glass, the chip wears its blazing dress — a state worth
  keeping, maintained by simply showing up.
- *Day 30:* identical to day 7 by design — the gauge is a *habit* surface,
  not a museum. The long arc lives in a lifetime `nights hunted` count
  (fed from the existing `prof.daily` log) shown in dailySheet and on the
  profile — and in ruling (a)'s re-pointed milestones (7 / 30 / 100 *lifetime
  nights*, ids kept, earned stays earned).
- *Day after a miss:* 6 of 7. The chip is one step cooler, not cold; the
  sheet says "an ember cooled overnight — tonight re-lights it." Compare the
  lantern: streak dead, grace ledger arithmetic, three strings of consolation.
- *Two-week vacation:* cold glass, zero shame mechanics, first hunt back
  warms it — identical to day 1. Nothing to grieve, so nothing to rage-quit.

**What the chip shows.** The seven drawn pips (2.1) are the gauge —
unfilled/filled ember dots; the `dailyGlow` tint ramps charcoal → amber →
gold with ember count (never past 0.13). Unplayed-and-would-cool evenings:
the glow's breath quickens slightly and the sheet's reserved line reads
**"the embers cool at dawn · H:MM:SS"** — the honest successor of *keep the
flame*, but the stake is one ember, not everything. End screen: one line,
"+1 ember · N of 7" (or "the glass holds full · night N" at cap).

**New state.** `prof.embers {e, last}` — two fields against the lantern's
eight. Same write site (`endRun`, daily only, win-or-lose), same day-gap read
(`ssDayGap` against `SSNET.dayKey()` — the gap *is* the decay: `e = max(0,
e - (gap-1))` computed on read, so no midnight cron and clock-slips stay
unpunished, both laws inherited from the old engine).

**Strings (spec, ×5):** ~7 keys — gauge name, `+1 ember`, full-glass line,
cooled-overnight line, cools-at-dawn countdown line, lifetime-nights line,
share-card line (optional: `embers %1 of 7`, drawn-free text).

**Effort:** **S–M** on top of the removal card (two profile fields, chip pips
+ tints, 3 lines across sheet/end screen, ~7 strings ×5, one harness section
in chip-check's family).

**Retention risk / what makes it hollow.** The cap means a 7-day player and a
70-day player look identical — deliberate (habit over trophy), but if Skylar
wants visible seniority the lifetime count + milestones must carry it, and
they are quieter than a growing lamp was. Decay-on-read must be tuned kind:
−1 per missed night (not per gap) or a weekend costs the whole glass.

---

### ② THE MONTH'S CONSTELLATION

**Concept.** Each month is a constellation drawn faint on the daily sheet —
one star per night hunted, inked in the order the month's figure is authored.
Hunt 24 of the month's nights (any 24 — misses never undo a star) and the
figure completes; it is stamped into a permanent gallery of month-seals
(September's the Lyre, October's the Gate…). Collection pressure, zero
punishment: a missed night only means the figure needs the nights that
remain.

**Player loop.** *Day 1:* first star inked, the figure's shape teased. *Day
7:* a limb of the figure visible; remaining-nights math starts mattering
("24 needed, 23 nights left" creates real mid-month stakes). *Day 30:* seal
stamped, next month's figure revealed faint. *Day after a miss:* nothing
lost; the margin shrank by one — urgency without grief.

**Chip.** A tiny drawn star-cluster glyph fills in over the month (3–4
stages); the glow warms with month progress. Sheet: the figure itself, inked
so far, `N of 24 · M nights remain`.

**Effort:** **L** — 12 authored mini-constellations (the star/edge authoring
pipeline exists in `SS_BEASTS`/`SS_ZODIAC` form), month rollover law, a
gallery surface, ~10 strings ×5.

**Risk.** Month-scale goals are cold at day 1 and brutal at month-end edge
cases (join on the 20th → figure impossible → teach "wait for the 1st"?
Must pro-rate the first month). The 24-threshold argues *against* "every
single day" — it licenses 6 misses. Strong as a *layer*, weak as the whole
answer to Skylar's brief.

---

### ③ TOMORROW'S SKY, NAMED

**Concept.** Finishing tonight's hunt reveals tomorrow's sky on the end
screen and the chip: the beast you'll face, named and silhouetted ("under
tomorrow's sky: STRIX, the Hollow Owl"). The comeback driver is curiosity —
you return because you already know what's waiting, and the reveal is itself
the reward for playing today. (The old retention sheet's idea ③, rebuilt on
what now exists: tomorrow's roster is derivable client-side from the seeded
daily — same mulberry32 + dayKey machinery the board uses.)

**Player loop.** *Day 1:* finish → tomorrow teased. *Day 7/30:* identical
beat — the tease is flat over time. *Day after a miss:* the tease you saw two
nights ago expired unseen; tonight's hunt is unteased (you walk in blind) —
the *cost of missing is information*, which stings gently and resets
instantly.

**Chip.** Played state gains a small drawn beast-silhouette medallion beside
the check (tomorrow, known); unplayed shows the plain sun (tonight, unknown).

**Effort:** **S–M** for the beast tease (derive roster, silhouette bake, 3–4
strings ×5). **L** if "tomorrow's twist" means real daily *modifiers* (a new
battle-rules system — does not exist today and shouldn't ride in on a
retention card).

**Risk.** Curiosity alone decays — by week 3 the tease is wallpaper unless
the beasts vary meaningfully (they do rotate, but from a pool the player has
seen). No state, so nothing compounds; pairs naturally *under* ① rather than
competing with it.

---

### ④ THE WEEK'S SEAL

**Concept.** The week strip promoted from decoration to the mechanic itself:
each Monday opens a page of seven drawn rings; each hunt inks one. Five of
seven seals the week in gold (paid in sign XP — the v0.69 system — or a
scry token for next week); seven of seven gilds it. Weeks archive into a
small book of seals. The grace night generalized: the two forgiven nights
are *structural*, not a ledger to re-earn.

**Player loop.** *Day 1 (mid-week):* first ring inked, the 5-of-7 target
visible and honest. *Day 7:* first seal — weekly payday cadence. *Day 30:*
four seals in the book, a "perfect week" chase for the gilding. *Day after a
miss:* the page absorbs it silently until the third miss — then the week is
unsealed but next Monday is always a clean page (failure never outlives 7
days).

**Chip.** The seven pips ARE the week (inked/tonight/remaining) — same drawn
budget as ①'s gauge; glow warms as the seal nears.

**Effort:** **M** — week state {weekKey, inked[]}, seal payout, book surface
(can start as a dailySheet row), ~8 strings ×5. `weekKey`/ISO plumbing
exists (`SSNET.weekKey`, Monday-00:00 law).

**Risk.** 5-of-7 *licenses* two misses a week — arguably the honest human
target, but it is not "every single day," and players optimize to the
letter: expect Tue+Wed dark spots. The gilding chase partially claws
this back. Payout choice re-opens the board-fairness law if it ever pays
in-run power.

---

### ⑤ RIVAL DAWN

**Concept.** Every morning the chip carries a name: the circle-mate (friend,
recent rival, or persona) who out-hunted you under yesterday's sky —
"ELOWEN took last night's sky · 812 vs 640 · answer her?" Tap → today's
hunt as an *answer*. Beat your named rival's today-score before midnight and
the chip stamps a small drawn laurel. Social pull on the existing FR/recents
plumbing and the seeded-persona fallback that already keeps boards alive.

**Player loop.** *Day 1:* no rival yet — first hunt enrolls you; day 2 the
first dawn-name appears. *Day 7/30:* an ongoing tally vs your usual three
rivals (a private h2h ledger). *Day after a miss:* the sharpest of the five —
"you left last night's sky to ELOWEN" — a *social* cost that resets nightly.

**Chip.** Unplayed: the sun glyph + the rival's initial in a small drawn
cartouche. Played-and-won: laurel; played-and-behind: crossed-quills, still
answerable (they may yet fall behind — scores land all day).

**Effort:** **M–L** — yesterday-board read + rival pick (exists in pieces),
h2h ledger, live "did they pass me" refresh, ~10 strings ×5, and careful
persona rules.

**Risk.** The heaviest design landmine: personas are undisclosed by
standing rule — a *named, personal* daily call-out from an AI ghost is a
different ethical weight than a filler leaderboard row, and a small live
population makes persona-dawns the common case. Cold-start is real. This one
should wait for population, whatever its charm.

---

### The recommendation: build ① THE EMBER GAUGE, seat ③'s beast-tease inside it later

**① is the answer to the brief as spoken** — *players coming back and playing
the daily every single day*: it rewards exactly and only "did you show up
tonight," makes the day-after-a-miss the best day to return (one night back
to warm — the lantern made it the worst), fits entirely inside the chip
Skylar pointed at, deletes 24 strings of grace-bookkeeping in favour of a
rulebook that fits in the glass, and is the cheapest honest build (S–M) on
top of a removal card that is already M. ② and ④ license misses by
construction; ③ has no spine alone; ⑤ isn't safe at this population. ③'s
tease is the natural *second* coat of paint once the gauge holds — it slots
into the played-state chip and the end screen without touching ①'s state.

**Open questions for Skylar before any build card is written:**

1. **Ruling (a)** — the three flame achievements: delete, retire-visible, or
   re-point at lifetime nights 7/30/100? (§1.10; ① pairs naturally with
   re-pointing.)
2. **Ruling (b)** — the synced `streak*` fields: drop-and-null (lean),
   drop-and-leave, or keep? (§1.10.)
3. **Does the gauge pay anything** beyond its own dress + the milestone
   achievements? Options: nothing (pure habit surface — the minimal-first
   default this doc leans to), a sign-XP trickle per ember at hunt time
   (existing v0.69 sink, no board distortion), or in-run power on the daily
   (recommended against — breaks the shared-sky fairness law).
4. **Decay rate:** −1 per missed night (gentle, recommended) or full-cool
   after N missed nights? And is **7** the right cap?
5. **Does anything but the daily ever feed it?** Default no (the brief);
   endless/quick stay out — this is the reborn form of the closed v0.68
   question (§1.10c).
6. **Share line:** does the card mention embers, or stay streak-free forever?
7. **Removal sequencing:** one card (scrap + gauge together) or two (scrap
   ships first, meadow runs chip-only for a beat)? One card avoids shipping
   an interim "the daily lost its companion" state twice; two keeps each
   diff reviewable. Doc's lean: one card.

---

## §4 — Where to look

- **Review page (phone mocks):** https://skypilot82.github.io/starspell-daily-rethink/
  — the chip before/after, every removed surface, one mock per candidate,
  the recommendation. Drawn-glyph mocks only (no emoji as art, per the law).
- This doc: `beta3/design/daily-rework-2026-09.md` (this file).
- Model for the removal's verification shape when it builds:
  the v0.73 strings law (family-grep to zero) + §1.9's sentinel list.

*Design doc committed with zero game bytes and no version bump; the build is
a separate future card on Skylar's explicit go.*
