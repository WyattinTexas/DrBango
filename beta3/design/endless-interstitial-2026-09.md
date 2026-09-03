# THE LEVEL GATE — the endless between-level card + the flag fan (DESIGN ONLY)

**Status: DESIGN — nothing is built. Queue law applies: the build fires as its own
card only on Skylar's "done and agreed".**
Mock page: **https://skypilot82.github.io/starspell-endless-interstitial/**
Card: `~/jumpr/plans/ss-2026-09-03-feedback/06-DESIGN-endless-level-interstitial.md`
Anchors below verified on **v0.82.0** (87ab72ce), 2026-09-03; v0.83.0 (7e22e709)
landed mid-card touching versus.js/strings.js/index.html only — the endless seam,
flag art and net anchors quoted here are byte-identical on it.

## §0 · Provenance — and the deliberate reversal

**Skylar (Skylar's console), 2026-09-03 ~11:30 (voice-dictated):** "In endless mode,
before each level, please include an aesthetically pleasing level that says what
level you're on, so it should show level 1. The user clicks, it fades out, and
level 1 starts. This is key because we need to remove the flag from its current
spot. The flag instead will be included on this new screen before each level. That
way, when you reach a level, you can see all the people who ended their journey at
that level. We'll have space for 10 flags on each level, and the flags will be
removed and reset Whenever the weekly reset happens. For the design of where the
flags are placed, please have them to the left and the right of the level name and
fan them out like each flag is a finger on a hand. For the flags on the left side
of the level, make sure you flip the flag so it looks more aesthetically pleasing.
Each flag will be slightly on an angle, and this design should be made separately
before being queued."

⚠ **This knowingly reverses part of v0.77.0** (THE ENDLESS FRONTIER FLAGS, d38494cf,
Skylar's own 9/3 morning ask): flags leave the climb itself and move to the new
between-level screen, and the ledger they read goes weekly. That is Skylar's
explicit instruction, not drift — a future session must not read the removal as a
regression. The REV C flag ART stays locked and untouched.

## §1 · Where it lands — the seam today (v0.82.0 anchors)

- **Endless has no between-level beat.** `beastDeath` (game.js:8594) → fightIdx++,
  checkpoint save, `extendEndless` (:8639) → `delayedCall(1150)` (:8641) → on a
  cadence fight `payOffer` (:8670, the sigil pick) else `afterSigil` (:9400) →
  endless branch calls `startFight()` (:8226) directly. Campaign gets the star
  chart here (`showMap` :9404); endless gets nothing. **The gate is a new state
  inserted exactly at this seam** — and at the climb's entry for LEVEL 1 (after
  the ascent arrival / resume re-entry, before the first `startFight`).
- **Flags today stand IN the climb**: `plantFlags` (:8748, lead spot (−140,292)
  w126, ≤3 drawn + '+N') and `flagBeats` (:8796, pass lines at y96/114, the
  frontier ceremony, own-flag plant), both called from `startFight` (:8309-8310);
  `flagC` built in buildUi under the beast; the one ledger read at climb start
  (Battle.create endless branch :7206-7213, `flagSeq` token, veiled + own rows
  filtered). All of this retires or re-points (§6, §10).
- **The art is locked** (REV C): `ssFlagTex` (:3442) — 260×236 box, banner
  (36,18)→(226,12)→(201,60)→(226,108)→(36,114) (~2:1 solid cloth, V-notch on the
  FLY edge, hand-placed lift), long stick, star-ledge foot at (34,222);
  `ssFlag` (:3489) — name across the cloth (fs = min(20, 136/max(4,len)·1.55)·0.875,
  auto-skipped when fs·s < 4.2), gold roundel at w≥60, ±1° sway, ledge-anchored.
  Jars: `SS_FLAG_COLORS` (data.js:350, ten GVT hexes), ink law `SS_FLAG_INK`.
- **The weekly ledger already exists.** `submitEndless` (net.js:397) writes BOTH
  `endless/all/{uid}` and `endless/{weekKey}/{uid}` (:419) on every reckoning —
  the slice was kept in v0.68 because "a living this-week's-climbs tab is one
  read away if it is ever wanted" (:396). Row {name,lvl,score,word,at,c,v}; the
  transaction keeps the better run level-then-score; `weekKey` = ISO 'YYYY-Www'
  (:334), turns over **Monday 00:00 UTC**; old slices already age out in
  `pruneBoards` (:473-474). **Skylar's weekly reset costs zero new writes and
  zero new sweep code.**
- **Strings today** ×5 (strings.js:85-89 en + siblings): flagTitle, flagStands,
  flagJars(+Hint), flagPass, flagPassMore, flagPassSub, flagFront, flagFrontSub,
  flagAt.

## §2 · THE GATE — the card itself

Before every endless level — level 1 included — the sky deals the gate:

- **Dress**: board + word-line sink to alpha 0.1 in 300 ms (showMap's own dress);
  HUD stays (header, score, YOU bar, the back arrow still abandons exactly as
  mid-fight). In the open sky: eyebrow THE ENDLESS SKY (u12, dim), the word
  LEVEL (u22 gold, wide tracking), the numeral in gold letterpress (ssGoldTex,
  ~u84; 3+ digits auto-shrink to fit the ±60 column) — z-BELOW the flags so the
  hands cup it. A soft glowbig breath behind the numeral.
- **Entrance**: numeral condenses in over 420 ms (the fanfare's displayWidth
  tween) with one soft chime at its landing; flags plant back-to-front, 90 ms
  stagger, each rising 10u over 520 ms Cubic.easeOut (plantFlags' own entrance).
  Settled by ~900 ms.
- **The tap — one gesture, no wait-tax**: the zone fires on the UP under an 8u
  drag threshold (the mapZone contract), anywhere on the sky. After a 300 ms
  residue guard (so the killing cast's tap can't bleed through), a tap
  MID-ENTRANCE snaps every tween to the settled frame and continues in that same
  gesture — a veteran spends ~1 s per gate, never more. On the way out every
  flag dips a 6° salute for 180 ms while the gate fades 220 ms → `startFight()`.
  No timer, no auto-advance — the gate is the climb's breather and Skylar said
  click.
- **Hint**: a breathing italic "tap to face the sky" (u9.5, dim) on the first
  gate of a session only; after that the gate trusts you.
- **Reduce-motion**: pure fades, instant settle, no rises, no salute. The gate
  still shows — it is content, not motion. (`?gate=0` is the removal seam, §8.)
- **Sounds**: the settle chime; SFX.sigil on the frontier dress (§6); nothing
  else — fanfare stings stay reserved for victories.
- **Resume**: a resumed climb re-shows LEVEL N once before re-entering the
  standing fight — it re-establishes where you are after days away, for one tap.
- **Level 1**: the same gate right after the ascent arrival. The ledger fetch is
  async — flags that land late rise into the standing gate (the `late` beacon
  flag; the `flagSeq`-style token guards a landing on a restarted scene).

## §3 · THE FAN — two hands of five

"Fan them out like each flag is a finger on a hand." Two hands cup the numeral,
five fingers each. **Rank 1 stands innermost-right, tallest and highest planted**;
ranks alternate right, left, right… stepping down and out like fingers — the
better the climb, the higher its flag stands on the little hillside. Left-hand
flags are **mirrored** — cloth flying left, the V-notch flipping WITH the cloth
(it lives on the fly edge; the mirror is what makes it read right) — and the
**name and roundel are never mirrored**.

Slot table (ledge ground points, design units from centre; lean about the ledge):

| rank | x | y | w | lean | cloth name? |
|---|---|---|---|---|---|
| 1 | +66 | 434 | 104 | +3° | yes |
| 2 | −66 | 438 | 100 | −4° | yes |
| 3 | +94 | 458 | 90 | +7° | yes |
| 4 | −94 | 462 | 87 | −8° | yes |
| 5 | +119 | 481 | 82 | +10° | yes |
| 6 | −119 | 485 | 80 | −11° | yes |
| 7 | +136 | 503 | 74 | +12° | — |
| 8 | −136 | 507 | 72 | −12° | — |
| 9 | +148 | 524 | 66 | +11° | — |
| 10 | −148 | 528 | 66 | −12° | — |

- **The tier rule**: cloth names render only at **w ≥ 78 — by rule**, never by
  the fs·s < 4.2 ant-print accident. The inner six read at rest; the outer four
  fly bare colour. Every name still reads in the ledger (§4). No level roundels
  in the fan — every flag here stands at the numeral's own level.
- **The mirror is a TEXTURE**: bake `flagL-<colour>` (the ssFlagTex draw under a
  translate+scale(−1,1)) rather than scaleX(−1) on a container — the notch flips
  at the right layer and the name/roundel (added by ssFlag on top) can never
  mirror by accident. Ten more small canvases, baked lazily like the right hand.
- **Seating**: rank = the level's rows sorted score desc (tie: earlier `at`).
  Slots fill inward-first in rank order — one flag stands at the right index,
  two stand one per side; a lone outer flag never exists.
- **Sparse bump**: with ≤4 flags standing, every occupied slot's width scales
  ×1.18 — the common early-week fan reads BIGGER, not emptier (rank 1 ≈ w123).
- **Empty**: the numeral alone in open sky. No apology line — the quiet IS the
  message this high up.
- **Own flag**: your week-row's level = this level → your flag takes its EARNED
  seat (no priority), wearing a soft gold aura (glowbig ~0.15 breath) + a
  starBurst at its planting. Veil=vanish applies to yourself the way it always
  has: the veiled never plant anywhere, including here.
- **Overflow**: ten best scores stand; a small italic "+N more ended here this
  week" under the fan keeps the count honest. Veiled rows are filtered BEFORE
  the count — they neither stand nor count.
- **Sway**: the shipped ±1° breath, phase-offset per slot so each hand ripples;
  Math.random not rng() (cosmetics law); skipped under reduce-motion.

## §4 · Reading every name — THE LEDGER (rec) vs THE EPITAPH CYCLE

"You can see all the people who ended their journey at that level" needs a
channel that provably reads on a phone. Two honest options, both mocked:

- **OPTION A — THE LEDGER (recommended)**: two quiet lines under the fan naming
  every ender at u~11 (scale-clamped to the 404 band), '+N more' at the tail.
  Instant, glanceable, zero interaction — and zero new reading strings (names
  and digits only).
- **OPTION B — THE EPITAPH CYCLE**: one caption line under the numeral breathes
  through the flags, ~1.6 s each, the named cloth glinting: **name · score ·
  their finest word** ("MAEVE · 12,340 · QUIXOTIC" — the row already carries
  `word`; the word-game's own epitaph). Rests after one full round. More
  ceremonial; takes ~16 s to say all ten.
- Both can compose (ledger + the cycle's glint) — posed as the third chip.

## §5 · THE WEEK — semantics

- **The fan reads `endless/{weekKey}`** via a re-aimed ledger read
  (`getFlags` → **`getWeekFlags`**, net.js:443 family): same filters (sg_
  belt-and-suspenders, veiled dropped and reported), sorted level-then-score,
  **own row now INCLUDED** (the climb read used to drop it; the gate seats it).
  Bucketed by level client-side; **fetched ONCE per climb** at start/resume (the
  v0.77 read-once law), `weekKey` stamped on the fetch; a gate entered after the
  Monday 00:00 UTC turnover sees the stamp gone stale and refetches (a climb
  straddling the reset gets the new, emptier sky at the very next gate — never
  mid-gate). The seq token guards every landing.
- **"Ended their journey at that level"** = the week-row's level: a player's
  deepest climb this week, which is exactly where that journey ended. The
  transaction already keeps the better run, so a worse later run never drags a
  flag down. (The literal-last-run alternative would need a new write and moves
  flags downward — rejected, posed as a dial.)
- **All-time surfaces stay all-time**: the profile flag sheet ("your flag stands
  at level N" — the monument), the rating-card foot, the endless board tab.
  Skylar moved the CLIMB's flags; the two-truths dial is posed in §9 (Q1) — if
  he re-points the profile weekly instead, it must ship in the same build.
- **Exclusions carry over**: veil = VANISH; real players only — sg_ ghosts plant
  nothing, and the coming worldwide-bot personas (9/3 card 03) are client-side
  like the ghosts: they never write the slice, and the sg_-style filter stays as
  the belt to that law's suspenders.
- **Offline / failed read**: the gate still deals (quiet card) — the ledger is
  dressing, never a gatekeeper.

## §6 · Ceremonies

- **flagPass / flagPassMore / flagPassSub RETIRE** (×5): with a fan at every
  gate, "you passed their flag" is implicit — you read who ended below you rung
  after rung, and a per-flag beat at 60× repetition is friction. Their echo
  survives as the wordless 6° dip-salute every fan gives on the continue tap.
- **THE FRONTIER survives, re-seated on the gate**: the first gate of a climb
  whose level stands STRICTLY ABOVE the week's highest rival flag — requiring
  ≥1 rival weekly flag somewhere below (no frontier over an empty Monday sky) —
  wears gold: numeral tinted #ffe9a8 with a bigger bloom, flagFront "THE
  FRONTIER IS YOURS" under the numeral, flagFrontSub naming the flag now beneath
  you, SFX.sigil, and your own flag (if standing this week) planting center-under
  with a starBurst. **Once per climb**: the latch rides the checkpoint (the
  existing `run.ffront` plumbing; `run.fpassLv` retires) so a resumed climb
  never re-rings — same law as v0.77.

## §7 · Strings (×5, one-line law throughout)

- **New**: `gateLevel` ('LEVEL' — the word over the numeral), `gateTap`
  ('tap to face the sky'), `gateMore` ('+%1 more ended here this week').
- **Retired**: flagPass, flagPassMore, flagPassSub.
- **Re-pointed** (unchanged text, new home): flagFront, flagFrontSub.
- Untouched: flagTitle/flagStands/flagJars(+Hint)/flagAt — the profile sheet and
  rating card keep their all-time voice.
- Option B adds none (names + digits + the row's own word).

## §8 · The harness seam (name it or the battery stalls)

- **State `'gate'`** — stamped at settle, and 'gate' MEANS settled-and-tappable
  (the v0.80 'map' law); the entrance and exit run under 'anim'. The early-tap
  snap stamps 'gate' and consumes the same gesture.
- **Skip param `?gate=0`** — no gate, direct startFight (the ?ride=0 precedent).
  Reduce-motion does NOT skip (content, not motion); suites use the param.
- **Beacon `window.__ssgate`** = {level, rows, drawn, more, mine, front, late,
  shown, taps} — the __ssflags shape's successor.
- **demoStep**: state 'gate' → a bare synthetic emit('pointerdown') enters at
  once (the mapZone contract's sibling), so ?demo endless runs ride through.
- **Suite migration is a NAMED build step** (the audit-whole-class law): grep
  every endless-seam driver — endless-check (95, the big one), ftue-check (73,
  its ?endless door boot), flag-check (69 — its climb half ~35 asserts retire
  and rebuild as the gate's own suite), hard-check (108 — expected zero-edit:
  the gate deals only on mode==='endless', hard is campaign-family; the sweep
  proves it), demo/tagline entries that cross the seam — and append `?gate=0`
  or a gate-wait per suite. A new **gate-check.mjs** (self-launching, FB
  blocked, real DPR3 taps, ×3 on final bytes) covers: the state law, the
  early-tap snap, slot seating + tier rule + mirror proof, sparse bump, empty,
  own aura, overflow count with veiled excluded, frontier rules (≥1 rival, once
  per climb, checkpoint carry), rollover refetch, ?gate=0, demo ride-through,
  reduce-motion, es dress.

## §9 · FOR SKYLAR — the dials (rec ★ · chips + COPY VERDICTS live on the page)

1. **Weekly vs all-time surfaces** ★ fan weekly; profile sheet, rating-card
   foot, board tab stay all-time (the monument). — If you'd rather the profile
   re-point weekly ("your flag flies at level N this week", best-ever kept as a
   stat), it must ship in the SAME build or the surfaces lie to each other.
2. **"Ended their journey" means** ★ the deepest climb this week (the existing
   weekly-best slice; zero new writes) — not the literal last run.
3. **Ceremonies** ★ pass retires (the dip-salute is its echo); THE FRONTIER
   re-seats on the gate, gold-dressed, ≥1 rival flag required, once per climb.
4. **Own flag in the fan** ★ yes — earned seat, gold aura, starBurst. (Alt:
   never shown to self.)
5. **More than ten** ★ ten best scores + "+N more" count (veiled excluded from
   both). (Alts: most recent; no count line.)
6. **Order on cadence fights** ★ sigil offer first, gate second — the offer pays
   the fight won; the gate announces the next.
7. **Resume** ★ re-show LEVEL N for one tap. (Alt: straight into the fight.)
8. **Which climbs** ★ endless only — hard is campaign-family and the campaign
   owns its own between-fight beat (the star chart).
9. **The reading channel** ★ OPTION A THE LEDGER (instant, glanceable). (Alts:
   B THE EPITAPH CYCLE with the finest-word epitaph; or both — ledger + glint.)
10. **The lean** ★ as mocked, 3° inner → ~12–15° pinkies ("slightly on an
    angle"). (Alts: gentler 3–8° everywhere; harder card-fan splay up to 30°.)

## §10 · Scope for the build card (footprint, not code — sized honestly)

- game.js: the gate builder + state (~200 lines new); plantFlags/flagBeats
  removal (~140 lines) + flagC lifecycle + the two startFight call sites + the
  Battle.create fetch re-aim + checkpoint field retirement (fpassLv) + demoStep
  'gate' branch + the ?gate=0 door.
- One baked mirrored texture family `flagL-<colour>` beside `flag-<colour>`.
- net.js: getFlags → getWeekFlags (weekly path, own row kept, weekKey stamp) —
  ~15 lines; submitEndless/dressFlag/pruneBoards untouched.
- strings.js: +3 keys, −3 keys, 2 re-pointed — ×5 languages.
- Suites: NEW gate-check.mjs; endless-check + ftue-check + flag-check migrated;
  hard-check swept and expected zero-edit; the full battery re-run per the house
  recipe (each suite's own documented Chrome; ×3 on final bytes; zero page
  exceptions; live-verify BUILD after deploy).
- Version: one minor bump; the six ?v= stamps ride BUILD as always.

*Doc by card 06 (solo claude-c ultracode window, per Skylar's routing stamp).
Design panel: 3 independent designs + 2 adversarial judges ran under this card;
the shipped shape above is the judged synthesis. Nothing builds until Skylar's
"done and agreed".*
