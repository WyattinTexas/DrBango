# Green vs. Tan · Dylan's boss cinematics · the ad-baseline kit

Gathered on Maker 1, 10/30/2026, from the Big Mac's HEAD (client v27.41) for the video-ads work: "starting with the ones we already have will be our baseline."

Open `index.html` in Chrome for the visual version of this file (every film plays in place, with its poster, its contact sheet, its cast and Dylan's words).

## The twelve films

Every one was asked for by Dylan through the jumpr guest link (his script, verbatim, is in `scripts/dylan-notes.md`), built by a session from the game's own characters and paintings as an SVG timeline, and is LIVE on both mirrors with his go. Each plays once per device, full screen, the first time its door opens. 1280x720, 30 fps, H.264 + AAC.

| # | Film | Boss / world | Plays before | Length | Asked | Live |
|---|---|---|---|---|---|---|
| 1 | `snd-duel.mp4` · THE DUEL | Nemesis (the red saber) | Nemesis's first card | 30 s | 10/15 | round 2, v24.39 |
| 2 | `stm-tent.mp4` · SARGE'S PLAN, THE WINTER FIELD | the Frozen Tundra (a PvP night, not a boss) | the Tundra's JOIN | 30 s | 10/15 | v23.94 |
| 3 | `mdy-mayday.mp4` · MAYDAY ON THE WINTER FIELD | King Yeti and the yetis | THE ICE CASTLE | 60 s | 10/16 | round 4, v24.38 |
| 4 | `drw-thedraw.mp4` · THE DRAW | King Croak, Fuzzie, Outlaw Town | KING CROAK'S HIDEOUT | 60 s | 10/16 | v24.09 |
| 5 | `dmt-dinomight.mp4` · DINO-MIGHT | King Rex, the little dinos, the Flamethrower | KING REX'S LAIR | 60 s | 10/16 | round 3, v24.37 |
| 6 | `lng-longnight.mp4` · THE LONG NIGHT | Nemesis's army at Fort Green | SURVIVAL MODE | 60 s | 10/16 | round 4, v24.51 |
| 7 | `hst-hopskip.mp4` · HOP, SKIP AND A THUMP | Princess Croak and the gnome statues | PRINCESS CROAK'S PALACE | 60 s | 10/17 | round 2, v24.54 |
| 8 | `fif-fortressinflight.mp4` · FORTRESS, IN FLIGHT | The Sky Fortress, the Tan Air Corps, the Red Tail | THE SKY FORTRESS | 60 s | 10/17 | v24.53 |
| 9 | `enf-newfoes.mp4` · THE EMPEROR'S NEW FOES | Emperor Bear and his cavalry | BEAR PARK | 60 s | 10/17 | round 4, v24.59 |
| 10 | `smg-strangemagic.mp4` · STRANGE MAGIC | the Strange Book's ballroom monsters | THE HAUNTED LIBRARY | 60 s | 10/21 | round 2, v25.45 |
| 11 | `tss-sunkenship.mp4` · PIRATES COVE: THE SUNKEN SHIP | King Kraken, Captain Cutlass and the pirates | THE SUNKEN SHIP | 60 s | 10/23 | round 2, v26.80 |
| 12 | `ldn-lastdance.mp4` · SARGE'S LAST DANCE | The Mouse King, Clara and the Nutcracker | NUTCRACKER'S BALL | 60 s | 10/24 | round 2, v27.09 |

Live copies of every film: `https://playgvt.net/<file>` and `https://drbango.com/gvt/<file>` (the poster is the same name with `.jpg`).

Not Dylan's, kept in `extras/`: `sarge-down.mp4` (27 s, SARGE IS DOWN, Wyatt's own scene of 10/9, the Captain's Log's re-watchable reel). The PRIME TIME promos (bd, rex, bill) and the Floop's Lab films are gameplay clips, not cinematics, and are not here.

## What is in this folder

- `films/` the twelve mp4s as served, plus `MANIFEST.tsv` (bytes, md5, duration, size, fps).
- `posters/` each film's poster frame (the game shows it while the film loads).
- `stills/<film>/NN.jpg` one frame every 5 seconds at 640 px, and `stills/<film>-sheet.jpg` the same twelve frames on one contact sheet.
- `scripts/dylan-notes.md` Dylan's ask for each film, verbatim, and every reply he sent to a cut (his taste, round by round).
- `scripts/records/<kit>/00-CARD-*.md` the full build record of each film: the beat-by-beat timeline with seconds, every character and painting it borrowed, the music, the sound cues, the proofs, the landing.
- `characters/sheet-all/` all 179 tiles of the team's character sheet (https://drbango.com/shapestore/characters/), named `NNN-NAME.jpg` with the sheet's own number. `characters/<film>/` the tiles of that film's cast.
- `index.html` the look page.

## The cast, film by film (sheet numbers)

- THE DUEL: 001 Sarge · Nemesis (not on the sheet as himself; 022 THEIR SARGE is the Tan mold; P 001 RIVAL is Wyatt's pass) · 003 Rifleman.
- SARGE'S PLAN: 001 Sarge · the green army men as map pieces (003, 005).
- MAYDAY: 001 Sarge in his toy warplane · 068 King Yeti · 063, 064, 065, 066 the yetis (about 25 minions, his round-2 ask).
- THE DRAW: 001 Sarge in the cowboy hat · 042 King Croak · Fuzzie the soda jerk (not on the sheet).
- DINO-MIGHT: 001 Sarge · 008 the Flamethrower · 077 King Rex · 075 Small Dino (the fifty) · 080 Trike · the squad (003, 005, 010) · the jeep.
- THE LONG NIGHT: 001 Sarge · Nemesis with the red blade (022) · 003, 005, 010 the squad · 020 Tan Rifleman · the green paratroopers · the toy warplane.
- HOP, SKIP AND A THUMP: 001 Sarge · 038 Princess Croak on a new throne · 049, 050, 051, 052 the gnomes as stone statues · 003 Rifleman (the one the tongue takes).
- FORTRESS, IN FLIGHT: 001 Sarge as the pilot · the Dogfighter, the Sky Fortress, the Red Tail and the V2 Bomber (the sheet lists the sky craft as 202 BBCANNON, 203 BBFIGHTER, 204 BBV2).
- THE EMPEROR'S NEW FOES: 001 Sarge · 115 / 118 Emperor Bear on a white horse · 109 the Cavalry, 107 the Cavalry Bear, 110 the Steed, 119 the Charger · 020 Tan Rifleman in the mud · 003 Rifleman · the green heavy tanks.
- STRANGE MAGIC: 001 Sarge · 121 the Witch · the men in zombie green · the library's bats · new vampires, werewolves and wizards (the film's own, not on the sheet).
- THE SUNKEN SHIP: 001 Sarge · 077 King Rex toppled · 003, 005, 010 the squad · King Kraken, Captain Cutlass, the crew, Pip and Polly (the cove's molds, not on the sheet).
- SARGE'S LAST DANCE: 001 Sarge · 122 the Nutcracker · Clara (not on the sheet) · the Mouse King and his mice (not on the sheet; 059 THE MOUSE is the Hideout's) · 069 Snowman and the gingerbread men who flee · 003, 005, 010 the squad.

A gap worth a card: the 10/23 rule says every character goes on the character sheet, and Nemesis, Fuzzie, King Kraken, Captain Cutlass, Pip, Polly, Clara and the Mouse King are not on it yet. If the ads lean on them, their sheet tiles are the first thing to make.

## Dylan's taste, from his replies to the cuts

- He asks for scale and distance: "double the initial distance," "roughly 25 minions," "make the graphics scale more like Dino Might 3 did."
- He hears clicks: "Slightly too much clicking noise." Every sound cue in the films is faded and the square-edged rows are low-passed.
- He wants the world's own music under the picture: the Winter Field bed, the Nutcracker score until the Mouse King enters, then a dramatic theme; "whimsical music while Sarge is walking through the library, just some tapping like spooky notes."
- He wants motion to be fluid and physical: "rougher waves, a more menacing kraken, the tentacles' physics"; "make the initial sight of the light in the distance be fluid as they walk to it."
- He writes Sarge short and dry: "Not Bad." "This should even the odds." "We are in a bit of a pickle!" "Time to turn up the heat!"
- He closes fast when it is right: "Go live!" "No this is great as is, thank you!" "Great! Let's go live with it for now. May revisit later for edits."

## How these were made, and why that matters for new ads

Each film is an SVG timeline (`design/<kit>/kit/<name>.html` on the Big Mac) that draws the game's own molds and lobby paintings frame by frame, rendered by a headless browser at 30 fps and encoded with ffmpeg; the sound is the game's own SFX rows rendered offline (`kit/sfxrec.mjs`) and mixed with the world's bed (`kit/mix.py`). Nothing is hand-animated video. That means:

- any beat of any film can be re-rendered at any size and aspect (1080x1920 portrait for TikTok, Reels and Shorts; 4:5 for X, which rejects 9:16 uploads), with or without the comm window, with or without the title plank;
- a new concept is a new timeline in the same grammar, and the cast is already drawn: every character on the sheet is a mold the kits can pose;
- the records' §1 give the beat list with seconds, so a 15 s or 30 s ad cut can be planned on paper from this folder before anyone renders.

## What the team has already done in ads (the baseline beyond these films)

- X Ads, 8/18/2026: six video-card ads at 4:5 from the Corkscrew Games account (X rejected every 9:16 file). Parked 9/9 with too little data.
- The live-action Sarge skits plan, 10/9/2026: Dylan as Sarge, cut between him and real gameplay (the World of Warcraft celebrity-ad shape). The gameplay footage per park (men marching, the boss dominating; portrait; 24 takes) is on this Mac at `~/Movies/sarge-parks-r2-1009/`.
- The PRIME TIME promos inside the game (bd, rex, bill): 8 to 14 s gameplay clips in the footage dress (no floats, no bars, real play).
- Four playable ads at `https://playgvt.net/playables/` (campaign level 1, the western, Snow Showdown, portrait level 1).

## Rules that bind new ad art

- The GVT style guide (Laura, 10/14): soft outlines, light top and deeper foot, drawn lines crisp, rich colour; nothing Al Gable made is changed; Laura's pieces on her word. Footage shows the game as it is.
- Every new character goes on the character sheet the day it is born, and Al and Laura are told (10/23).
- Sarge's lines carry no dash (9/27). Kings are always big (9/26). Armies are not saber clones (9/27).
- Nothing ships from Maker 1: a new cinematic or ad film lands through a card to the Big Mac.
