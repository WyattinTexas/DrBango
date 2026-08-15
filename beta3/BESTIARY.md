# STARSPELL bestiary — the constellation roster

Wyatt's goal: the roster grows toward the real constellation sky.

- The **~42 animal constellations** are the enemy pool — basics, minibosses,
  and bosses.
- The **14 human constellations** are reserved for bosses and minibosses.
- The two **chimera/centaur constellations — Centaurus and Sagittarius** —
  are the end-game boss pair.

Authoring a beast (`data.js`): star map + edges in the 200×160 box (y down),
`tier: 'basic' | 'mini' | 'boss'` + `lvl 1-4` (stats come from `SS_TIER_CURVE`;
explicit `hp`/`atk`/`timer` override it), a palette (`tint`/`eye`), and an
`fx` block picking an idle + attack archetype from `game.js`
(idle: prowl · bob · coil · pinch · headturn · lumber · ripple · flex;
atk: pounce · slam · lash · snap · swoop · breath · nova · charge · volley;
tuning: hops, strands, amp, bolts). Then add the id to the act pools /
`SS_QUICK_POOL` and give the title translations in `strings.js` (`beast` map,
9 languages; English lives in data.js).

## Authored (26)

| id | constellation | tier | notes |
| --- | --- | --- | --- |
| vulpes | Vulpecula (fox) | basic 1 | original five |
| lepus | Lepus (hare) | basic 2 | original five |
| serpens | Serpens (serpent) | basic 3 | original five |
| delphinus | Delphinus (dolphin) | basic 1 | Job's Coffin diamond + tail |
| columba | Columba (dove) | basic 1 | |
| lacerta | Lacerta (lizard) | basic 2 | the "little Cassiopeia" zigzag |
| cygnus | Cygnus (swan) | basic 3 | Northern Cross, Deneb→Albireo |
| pavo | Pavo (peacock) | basic 3 | fan of radial spokes |
| cancer | Cancer (crab) | mini 1 | original five |
| corvus | Corvus (raven) | mini 1 | |
| ursa | Ursa Major (bear) | mini 2 | |
| aranea | (invented spider) | mini 2 | not a real constellation |
| aquila | Aquila (eagle) | mini 2 | Altair head line |
| lupus | Lupus (wolf) | mini 3 | howling pose |
| monoceros | Monoceros (unicorn) | mini 3 | |
| cassiopeia | Cassiopeia (queen) | mini 3 | HUMAN — the W is her crown |
| cetus | Cetus (sea monster) | mini 4 | head ring + body loop |
| orion | Orion (hunter) | mini 4 | HUMAN — belt, club, shield |
| strix | (invented owl) | boss 1 | not a real constellation |
| leo | Leo (lion) | boss 1 | the Sickle + Denebola |
| taurus | Taurus (bull) | boss 1 | Hyades V, Aldebaran eye, floating Pleiades cluster |
| scorpius | Scorpius (scorpion) | boss 2 | Antares eye + stinger hook |
| draco | Draco (dragon) | boss 2 | |
| phoenix | Phoenix | boss 3 | Act III finale |
| centaurus | Centaurus | boss 4 | END-GAME — Act IV, chimera pair |
| sagittarius | Sagittarius (archer) | boss 4 | END-GAME — campaign finale, volley signature |

## Campaign structure (v0.22.0)

Acts draw their non-fixed fights from tier pools (`slots`/`basics`/`minis`/
`bosses` per act in `SS_ACTS`); the draw is rolled once per campaign and
pinned in `localStorage['beta3.camproster']` so chart, battles and checkpoint
resume all march the same road. Fixed anchors: STRIX (Act I boss), DRACO
(Act II boss), PHOENIX (Act III finale), ORION → CENTAURUS → SAGITTARIUS
(Act IV's climb). **Decision for Wyatt to bless:** the chimera pair headline a
new ACT IV · THE ENDLESS HUNT after the Crown of Dawn, with SAGITTARIUS as the
campaign's true finale (PHOENIX still ends the Act III story and keeps the
first-flame achievement).

## Still unauthored — future waves

Animals: Aries (ram), Canis Major (great dog — Sirius!), Canis Minor,
Capricornus (sea-goat), Pisces (fishes), Piscis Austrinus, Hydra (water snake
— the sky's largest), Hydrus, Cetus variants, Camelopardalis (giraffe),
Chamaeleon, Corona Australis/Borealis (crowns — relic-shaped?), Crux birds
(Apus, Grus, Tucana, Phoenix ✓), Dorado (swordfish), Equuleus (foal),
Lynx, Musca (fly), Pegasus (winged horse — Great Square), Serpens Cauda,
Ursa Minor (cub — mini of ursa), Volans (flying fish), Vulpecula ✓ (as
vulpes), Scutum, Lyra (lyre — Vega), Sagitta (the arrow — Sagittarius adds?).

Humans: Andromeda (the chained princess), Aquarius (water-bearer),
Auriga (charioteer — Capella), Boötes (herdsman — Arcturus), Cepheus (king),
Gemini (the twins — Castor & Pollux, a DOUBLE fight?), Hercules (keystone),
Ophiuchus (serpent-bearer — pairs with serpens), Perseus (with Algol, the
Demon Star — eye gimmick), Virgo (Spica).

Ideas parked: Gemini as a two-constellation simultaneous fight; Ophiuchus
wielding serpens; Perseus' Algol as a blinking demon eye; Pegasus as a
rideable ally, not an enemy.

## The zodiac (v0.23.0)

The twelve birth signs are campaign starting characters (SS_ZODIAC in
data.js, picker before a fresh campaign). Five draw the stars of an
existing beast (cancer, leo, taurus, scorpius, sagittarius). The other
seven — ARIES, GEMINI, VIRGO, LIBRA, CAPRICORN, AQUARIUS, PISCES — got
their own hand-placed asterisms from the real charts, which means those
constellations are now AUTHORED and one fx/tier block away from joining
the bestiary as beasts (Gemini's double-fight idea above still stands).
Felling the beast that wears your own sign = the STAR-CROSSED achievement.
