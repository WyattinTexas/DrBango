// CARDS_DATA
// Card data — ALL_CARDS array and DISCIPLINES
// Extracted from index.html — v7.1.0
// All functions and variables remain global.

// ═══════ CARD DATA (subset for MVP — Frost Valley starters + wild encounters) ═══════
const ALL_CARDS = [
  // Frost Valley commons
  {id:23,name:"Powder",rarity:"common",maxHp:5,ability:"Final Gift",desc:"When defeated, gain 3 Ice Shards.",set:"Frost Valley",art:"../testroom/art/originals/powder.jpg"},
  {id:24,name:"Simon",rarity:"common",maxHp:7,ability:"Brew Time",desc:"When you take damage from a before-the-roll effect, gain 1 Sacred Fire.",set:"Frost Valley",art:"../testroom/art/originals/simon.jpg"},
  {id:25,name:"Cameron",rarity:"common",maxHp:6,ability:"Unstoppable Force",desc:"If the opponent uses a special, gain +1 die. Damage cannot be negated.",set:"Frost Valley",art:"../testroom/art/originals/cameron.jpg"},
  {id:26,name:"Logey",rarity:"common",maxHp:6,ability:"Heinous",desc:"Opponent's 5+ dice are unavailable next roll.",set:"Frost Valley",art:"../testroom/art/originals/logey.jpg"},
  {id:27,name:"Fredrick",rarity:"common",maxHp:5,ability:"Careful",desc:"Opponent may only roll up to 3 dice.",set:"Frost Valley",art:"../testroom/art/originals/fredrick.jpg"},
  {id:28,name:"Dream Cat",rarity:"common",maxHp:4,ability:"Jinx",desc:"Both roll doubles: gain +2 dice next turn.",set:"Frost Valley",art:"../testroom/art/originals/dream_cat.jpg"},
  {id:29,name:"Sad Sal",rarity:"common",maxHp:5,ability:"Tough Job",desc:"Lose a roll: gain 1 Ice Shard.",set:"Frost Valley",art:"../testroom/art/originals/sad_sal.jpg"},
  {id:30,name:"Tommy Salami",rarity:"common",maxHp:6,ability:"Regulator",desc:"When you roll a 6, gain +1 die and roll it immediately.",set:"Frost Valley",art:"../testroom/art/originals/tommy_salami_new.png"},
  {id:56,name:"Chad",rarity:"common",maxHp:6,ability:"Sploop!",desc:"On entry, gain 2 Ice Shards.",set:"Frost Valley",art:"../testroom/art/originals/chad.jpg"},
  {id:33,name:"Sandwiches",rarity:"common",maxHp:6,ability:"Dependable",desc:"While on sideline, if opponent gains a Special, you gain it too.",set:"Frost Valley",art:"../testroom/art/originals/sandwiches.jpg"},
  // Frost Valley uncommons
  {id:53,name:"Bogey",rarity:"uncommon",maxHp:5,ability:"Bogus",desc:"Reflect damage back at attacker. Once per game.",set:"Frost Valley",art:"../testroom/art/originals/bogey.jpg"},
  {id:55,name:"Masked Hero",rarity:"uncommon",maxHp:5,ability:"Underdog",desc:"When enemy uses before-rolling effect: deal 3 damage before it happens.",set:"Frost Valley",art:"../testroom/art/originals/masked_hero.jpg"},
  {id:57,name:"Marcus",rarity:"uncommon",maxHp:7,ability:"Glacial Pounding",desc:"Take 3+ damage: gain 4 extra dice next roll.",set:"Frost Valley",art:"../testroom/art/originals/marcus.jpg"},
  {id:60,name:"Dallas",rarity:"uncommon",maxHp:4,ability:"Quick Draw",desc:"When entering from sideline, steal 1 opponent die for 2 rolls.",set:"Frost Valley",art:"../testroom/art/originals/dallas.jpg"},
  {id:82,name:"Antoinette",rarity:"uncommon",maxHp:6,ability:"Grace",desc:"Roll as many dice as your opponent.",set:"Frost Valley",art:"../testroom/art/originals/antoinette.jpg"},
  {id:93,name:"Bandit Pete",rarity:"uncommon",maxHp:5,ability:"Bandit",desc:"Sideline: if either player rolls only 2 dice, +3 damage.",set:"Frost Valley",art:"../testroom/art/originals/bandit_pete.jpg"},
  // Frost Valley rares
  {id:81,name:"Spockles",rarity:"rare",maxHp:6,ability:"Valley Magic",desc:"Win a roll: gain 2 Ice Shards.",set:"Frost Valley",art:"../testroom/art/originals/spockles.jpg"},
  {id:85,name:"Eloise",rarity:"rare",maxHp:5,ability:"Change of Heart",desc:"Spend 1 Ice Shard to swap HP with enemy before rolling.",set:"Frost Valley",art:"../testroom/art/originals/eloise.jpg"},
  {id:86,name:"Pelter",rarity:"rare",maxHp:5,ability:"Snowball",desc:"Doubles gain +2 damage.",set:"Frost Valley",art:"../testroom/art/originals/pelter.jpg"},
  {id:90,name:"Jeanie",rarity:"rare",maxHp:4,ability:"Hidden Treasure",desc:"Force opponent to reroll all dice. Once per game.",set:"Frost Valley",art:"../testroom/art/originals/jeanie.jpg"},
  {id:92,name:"Gary",rarity:"rare",maxHp:6,ability:"Lucky Novice",desc:"Gain +2 Ice Shards for each 1 you roll.",set:"Frost Valley",art:"../testroom/art/originals/gary.jpg"},
  // Ghost-rares
  {id:103,name:"Night Master",rarity:"ghost-rare",maxHp:5,ability:"Bullseye",desc:"Win with doubles: destroy an enemy sideline ghost <4 HP.",set:"Frost Valley",art:"../testroom/art/originals/night_master.jpg"},
  {id:104,name:"Skylar",rarity:"ghost-rare",maxHp:7,ability:"Winter Barrage",desc:"Ice Shards deal +2 damage instead of +1.",set:"Frost Valley",art:"../testroom/art/originals/skylar.jpg"},
  {id:106,name:"King Jay",rarity:"ghost-rare",maxHp:7,ability:"Reflection",desc:"Lose roll & dice total = 7: reflect all damage.",set:"Frost Valley",art:"../testroom/art/originals/king_jay.jpg"},
  // Legendaries
  {id:113,name:"Prince Balatron",rarity:"legendary",maxHp:6,ability:"Party Time",desc:"Lose a roll & survive: roll 1 counter die for damage.",set:"Frost Valley",art:"../testroom/art/originals/balatron.jpg"},
  {id:114,name:"Romy",rarity:"legendary",maxHp:8,ability:"Valley Guardian",desc:"Predict a die number. If any die matches: +3 damage.",set:"Frost Valley",art:"../testroom/art/originals/romy.jpg"},
  // Set 1 commons (appear everywhere)
  {id:1,name:"Kodako",rarity:"common",maxHp:6,ability:"Swift",desc:"Roll 1-2-3: negate damage and deal 4.",set:"Set 1",art:"../testroom/art/originals/kodako.jpg"},
  {id:5,name:"Puff",rarity:"common",maxHp:6,ability:"Cute",desc:"Enemy doubles/triples do -1 damage.",set:"Set 1",art:"../testroom/art/originals/Puff.png"},
  {id:12,name:"Dupy",rarity:"common",maxHp:4,ability:"Frolic",desc:"Tie = instant KO.",set:"Set 1",art:"../testroom/art/originals/Dupy.png"},
  {id:17,name:"Boo Brothers",rarity:"common",maxHp:5,ability:"Teamwork",desc:"Remove 1 die to gain 1 HP and +1 damage.",set:"Set 1",art:"../testroom/art/originals/boo_brothers.jpg"},
  {id:34,name:"Grawr",rarity:"uncommon",maxHp:7,ability:"Menace",desc:"Entry: deal 1 damage.",set:"Set 1",art:"../testroom/art/originals/Grawr.png"},
  {id:42,name:"Doc",rarity:"uncommon",maxHp:2,ability:"Savage",desc:"+5 damage on doubles.",set:"Set 1",art:"../testroom/art/originals/Doc.png"},
  {id:43,name:"Outlaw",rarity:"uncommon",maxHp:5,ability:"Thief",desc:"Roll doubles: remove 1 opponent die next turn.",set:"Set 1",art:"../testroom/art/originals/outlaw.jpg"},
  {id:48,name:"Opa",rarity:"uncommon",maxHp:5,ability:"Rest",desc:"Win or tie: gain +1 HP.",set:"Set 1",art:"../testroom/art/originals/Opa.png"},
  {id:64,name:"Sparky",rarity:"rare",maxHp:4,ability:"Tinder",desc:"1's add +3 damage each.",set:"Set 1",art:"../testroom/art/originals/Sparky.png"},
  {id:66,name:"Munch",rarity:"rare",maxHp:6,ability:"Scraps",desc:"Defeating a ghost: gain 4 HP.",set:"Set 1",art:"../testroom/art/originals/Munch.png"},
  {id:75,name:"Flora",rarity:"rare",maxHp:4,ability:"Restore",desc:"Roll doubles: +2 HP.",set:"Set 1",art:"../testroom/art/originals/flora.jpg"},
  {id:94,name:"Jenkins",rarity:"rare",maxHp:5,ability:"Barrage",desc:"Entry: roll 4 dice for damage.",set:"Set 1",art:"../testroom/art/originals/Jenkins.png"},
  {id:111,name:"Shade",rarity:"legendary",maxHp:5,ability:"Haunt",desc:"Before each roll, opponent takes 1 damage.",set:"Set 1",art:"../testroom/art/originals/shade.jpg"},
  // Rolling Hills
  {id:302,name:"Maximo",rarity:"common",maxHp:4,ability:"Nap",desc:"Entry: roll only 1 die first roll. After each round: gain 1 Healing Seed and 1 Lucky Stone.",set:"Rolling Hills",art:"../testroom/art/toadstool.jpg"},
  {id:305,name:"Selene",rarity:"legendary",maxHp:6,ability:"Heart of the Hills",desc:"Roll doubles: choose — gain 2 Healing Seeds OR 3 Lucky Stones.",set:"Rolling Hills",art:"../testroom/art/luna.jpg"},
  {id:311,name:"Pudge",rarity:"common",maxHp:7,ability:"Belly Flop",desc:"Doubles: deal +2 damage. Take 1 self damage.",set:"Rolling Hills",art:"../testroom/art/pudge.webp"},
  {id:308,name:"Kaplan",rarity:"uncommon",maxHp:5,ability:"Pollinate",desc:"When opponent rolls doubles: gain 1 Healing Seed.",set:"Rolling Hills",art:"../testroom/art/honeybun.jpg"},
  {id:314,name:"Farmer Jeff",rarity:"ghost-rare",maxHp:5,ability:"Harvest",desc:"Gain 1 Healing Seed for each 6 you roll.",set:"Rolling Hills",art:"../testroom/art/farmer_jeff.jpg"},
  {id:309,name:"Aunt Susan",rarity:"rare",maxHp:4,ability:"Harvest Dance",desc:"Discard 1 Healing Seed: deal +2 damage. Win: +2 Healing Seeds.",set:"Rolling Hills",art:"../testroom/art/rustler.jpg"},
  // Volcanic Isles
  {id:201,name:"Bouril",rarity:"common",maxHp:10,ability:"Slumber",desc:"Entry: your first roll is automatically 1-2-3.",set:"Volcanic Isles",art:"../testroom/art/old_hank.jpg"},
  {id:304,name:"The Ember Force",rarity:"uncommon",maxHp:3,ability:"Swarm",desc:"Before rolling: deal 1 damage to the enemy active ghost.",set:"Volcanic Isles",art:"../testroom/art/the_flickers.jpg"},
  {id:206,name:"Zain",rarity:"ghost-rare",maxHp:6,ability:"Ice Blade",desc:"Win: gain 1 Ice Shard. Forge the Ice Blade with Ice Shard + Moonstone.",set:"Volcanic Isles",art:"../testroom/art/echo.png"},
  {id:209,name:"Dart",rarity:"common",maxHp:3,ability:"Plunder",desc:"Win: gain 2 Surge.",set:"Volcanic Isles",art:"../testroom/art/swipers.png"},
  {id:306,name:"Nerina",rarity:"legendary",maxHp:9,ability:"Leviathan",desc:"Entry: deal 3 damage to the enemy active ghost.",set:"Volcanic Isles",art:"../testroom/art/the_deep.jpg"},
  {id:336,name:"Humar",rarity:"legendary",maxHp:5,ability:"Meteor",desc:"Win: opponent takes 2 damage before their next roll.",set:"Volcanic Isles",art:"../testroom/art/humar.jpg"},
  // ── Added v3.13.0 — more encounter variety ──
  // Commons (filler near towns)
  {id:2,name:"Nikon",rarity:"common",maxHp:6,ability:"Ambush",desc:"Win first roll: deal triple damage.",set:"Set 1",art:"../testroom/art/originals/Nikon.png"},
  {id:19,name:"Scallywags",rarity:"common",maxHp:5,ability:"Frenzy",desc:"If your rolled dice are all under 4 each, gain +1 dice next turn.",set:"Dark Castle",art:"../testroom/art/originals/Scallywags.png"},
  {id:4,name:"Wanderer",rarity:"common",maxHp:8,ability:"Curiosity",desc:"Roll a straight (consecutive sequence, no repeats): deal +2 damage.",set:"Set 1",art:"../testroom/art/originals/Wanderer.png"},
  {id:343,name:"Boris",rarity:"common",maxHp:6,ability:"Fortify",desc:"When you spend a Surge: Boris gains 2 HP (can exceed max HP).",set:"Volcanic Isles",art:"../testroom/art/originals/Brock.png"},
  {id:20,name:"Floop",rarity:"common",maxHp:5,ability:"Muck",desc:"Enemy loses a dice for the following turn if they roll doubles.",set:"Dark Castle",art:"../testroom/art/originals/Floop.png"},
  // Uncommon/Rare (mid-danger)
  {id:202,name:"Dark Fang",rarity:"rare",maxHp:5,ability:"Pressure",desc:"While active: enemy ghost cannot heal or gain HP. Win: deal +1 damage for each KO'd ghost.",set:"Dark Castle",art:"../testroom/art/originals/DarkFang.png"},
  {id:78,name:"Haywire",rarity:"rare",maxHp:7,ability:"Wild Chords",desc:"Upon rolling triples or better: gain 1 permanent die. +2 permanent damage. Once per game.",set:"Dark Castle",art:"../testroom/art/originals/Haywire.png"},
  {id:67,name:"Snorton",rarity:"rare",maxHp:8,ability:"Fissure",desc:"+5 damage if you roll at least two 6's and deal damage.",set:"Set 1",art:"../testroom/art/originals/Snorton.png"},
  {id:35,name:"Larry",rarity:"uncommon",maxHp:6,ability:"Flying Kick",desc:"Triples deal 3X damage.",set:"Set 1",art:"../testroom/art/originals/Larry.png"},
  {id:96,name:"Hector",rarity:"ghost-rare",maxHp:6,ability:"Protector",desc:"Singles beat doubles. +1 damage on singles.",set:"Dark Castle",art:"../testroom/art/originals/hector.jpg"},
  // Ghost-rare/Legendary (deep wilderness only)
  {id:97,name:"Toby",rarity:"ghost-rare",maxHp:7,ability:"Pure Heart",desc:"Before rolling you may declare the final roll. Toby is defeated next turn. Winning this roll defeats the enemy ghost.",set:"Dark Castle",art:"../testroom/art/originals/Toby.png"},
  {id:108,name:"Lucy",rarity:"legendary",maxHp:8,ability:"Blue Fire",desc:"Win: gain 1 Sacred Fire.",set:"Dark Castle",art:"../testroom/art/originals/lucy.jpg"},
  {id:51,name:"Nicholas",rarity:"uncommon",maxHp:1,ability:"Sneak Attack",desc:"Sideline: deal 2 damage when enemy enters play.",set:"Dark Castle",art:"../testroom/art/originals/nicholas.jpg"},
  {id:432,name:"Valkin the Grand",rarity:"legendary",maxHp:8,ability:"Grand Spoils",desc:"When you KO an enemy ghost: gain 1 Sacred Fire, 2 Ice Shards, 1 Lucky Stone, 1 Moonstone, 2 Healing Seeds.",set:"Dark Castle",art:"../testroom/art/originals/ValkinTheGrand.png"},
  {id:109,name:"Bo",rarity:"legendary",maxHp:5,ability:"Miracle",desc:"Upon defeating a Ghost, return one of your defeated Ghosts to your sideline. Gain 3 Magic Fireflies.",set:"Set 1",art:"../testroom/art/originals/Bo.png"},
  {id:418,name:"Pip",rarity:"ghost-rare",maxHp:7,ability:"Toasted",desc:"Upon rolling triples or better: permanently remove 1 die from your opponent. Once per game.",set:"Volcanic Isles",art:"../testroom/art/originals/Pip.png"},
  // ── Added v4.4.0 — 30 new Spiritkin ──
  // Rolling Hills
  {id:210,name:"Timber",rarity:"legendary",maxHp:7,ability:"Howl",desc:"Before rolling: opponent must discard 2 specials OR remove 1 die for this roll.",set:"Rolling Hills",art:"../testroom/art/timber.jpg"},
  {id:312,name:"Timpleton",rarity:"uncommon",maxHp:4,ability:"Big Target",desc:"Win: deal +3 damage if enemy HP is higher than Timpleton's.",set:"Rolling Hills",art:"../testroom/art/lurk.jpg"},
  {id:315,name:"Harrison",rarity:"rare",maxHp:7,ability:"Ascend",desc:"Discard Healing Seeds: roll 1 extra die per seed discarded.",set:"Rolling Hills",art:"../testroom/art/moonreach.jpg"},
  {id:417,name:"Twyla",rarity:"rare",maxHp:6,ability:"Lucky Dance",desc:"Each Lucky Stone adds +1 die and gains +1 Healing Seed.",set:"Rolling Hills",art:"../testroom/art/originals/Hesta.png"},
  {id:423,name:"Zippa",rarity:"uncommon",maxHp:5,ability:"Glimmer",desc:"Gain +1 damage for each Healing Seed you hold.",set:"Rolling Hills",art:"../testroom/art/originals/Beewick.png"},
  {id:428,name:"Jasper",rarity:"rare",maxHp:5,ability:"Flame Dive",desc:"Win: roll 1 bonus die. Deal its value as additional damage. Jasper takes 1 damage.",set:"Rolling Hills",art:"../testroom/art/originals/Pickwick.png"},
  {id:430,name:"Gordok",rarity:"uncommon",maxHp:8,ability:"River Terror",desc:"Win: steal 2 specials from opponent instead of dealing damage. +1 die next roll.",set:"Rolling Hills",art:"../testroom/art/originals/Millicent.png"},
  {id:462,name:"Ridley",rarity:"uncommon",maxHp:3,ability:"Nimble",desc:"Singles deal +1 damage. Doubles deal +2 damage.",set:"Rolling Hills",art:"../testroom/art/ridley.png"},
  {id:445,name:"Michael",rarity:"uncommon",maxHp:5,ability:"Torrent",desc:"Even doubles: deal +2 damage.",set:"Rolling Hills",art:"../testroom/art/originals/WaterSpirit.png"},
  {id:446,name:"Mable Stadango",rarity:"rare",maxHp:5,ability:"Hex",desc:"When you place Burn on an enemy, remove 1 enemy die next roll. Win: gain 1 Burn.",set:"Rolling Hills",art:"../testroom/art/originals/ForestSpirit.png"},
  // Frost Valley
  {id:31,name:"Gus",rarity:"common",maxHp:6,ability:"Gale Force",desc:"Win: force opponent to swap active ghost. New ghost takes the damage.",set:"Frost Valley",art:"../testroom/art/originals/gus.jpg"},
  {id:54,name:"Roger",rarity:"uncommon",maxHp:6,ability:"Tempest",desc:"Roll 2 pairs of doubles (4+ dice): gain 3 Sacred Fires.",set:"Frost Valley",art:"../testroom/art/originals/roger.jpg"},
  {id:58,name:"Ashley",rarity:"uncommon",maxHp:3,ability:"Burning Soul",desc:"Win: gain 1 Sacred Fire.",set:"Frost Valley",art:"../testroom/art/originals/ashley.jpg"},
  {id:83,name:"Troubling Haters",rarity:"uncommon",maxHp:3,ability:"Growing Mob",desc:"Deal 4+ damage in a turn: gain +2 HP.",set:"Frost Valley",art:"../testroom/art/originals/troubling_haters.jpg"},
  {id:88,name:"Pale Nimbus",rarity:"rare",maxHp:4,ability:"Hidden Storm",desc:"While on sideline: add +2 damage if your roll total is less than 7.",set:"Frost Valley",art:"../testroom/art/originals/pale_nimbus.jpg"},
  {id:91,name:"Calvin & Anna",rarity:"rare",maxHp:6,ability:"Toboggan",desc:"When you defeat a ghost, you may switch Calvin & Anna with a sideline ghost.",set:"Frost Valley",art:"../testroom/art/originals/calvin_anna.jpg"},
  {id:105,name:"Tyler",rarity:"ghost-rare",maxHp:6,ability:"Heating Up",desc:"Before rolling, spend 2 HP to gain +1 die. Sacred Fires deal x2.",set:"Frost Valley",art:"../testroom/art/originals/tyler.jpg"},
  {id:107,name:"Piper",rarity:"ghost-rare",maxHp:6,ability:"Slick Coat",desc:"Negate enemy before-rolling effects. -1 enemy die next roll.",set:"Frost Valley",art:"../testroom/art/originals/piper.jpg"},
  // Volcanic Isles
  {id:207,name:"Hank",rarity:"common",maxHp:7,ability:"Tremor",desc:"Each 4 you roll: gain 1 Lucky Stone.",set:"Volcanic Isles",art:"../testroom/art/stomper.png"},
  {id:313,name:"Sylvia",rarity:"rare",maxHp:4,ability:"Porpoise",desc:"Ice Shards cost nothing to commit. Lose a roll: roll 1 die, 5 or 6 negates all damage.",set:"Volcanic Isles",art:"../testroom/art/ripple.jpg"},
  {id:345,name:"Red Hunter",rarity:"ghost-rare",maxHp:6,ability:"Rumble",desc:"Win: if opponent has any specials, deal +3 damage.",set:"Volcanic Isles",art:"../testroom/art/tremor.webp"},
  {id:416,name:"Rook",rarity:"uncommon",maxHp:6,ability:"Charcoal",desc:"Immune to Sacred Fire and Burn damage. Win: +1 damage per Surge committed.",set:"Volcanic Isles",art:"../testroom/art/originals/Pyroclast.png"},
  {id:461,name:"Ronan",rarity:"common",maxHp:5,ability:"Mixup",desc:"Roll doubles: gain +1 Ice Shard & +1 Burn.",set:"Volcanic Isles",art:"../testroom/art/ronan.png"},
  {id:463,name:"Zork",rarity:"common",maxHp:4,ability:"Smolder",desc:"Before rolling: discard Burn to gain +1 die per Burn discarded.",set:"Volcanic Isles",art:"../testroom/art/zork.png"},
  // Dark Castle
  {id:410,name:"Mirror Matt",rarity:"common",maxHp:1,ability:"Seven Years",desc:"If opponent wins with doubles, damage is reflected to the attacker.",set:"Dark Castle",art:"../testroom/art/originals/MirrorMatt.png"},
  {id:424,name:"Bigsby",rarity:"uncommon",maxHp:5,ability:"Omen",desc:"Win: deal +1 damage. Use a Moonstone to transform into Doom.",set:"Dark Castle",art:"../testroom/art/originals/Digby.png"},
  {id:427,name:"Garrick",rarity:"uncommon",maxHp:5,ability:"Watchfire",desc:"Lose: take -1 damage. Gains 1 Sacred Fire on defeating a Spiritkin.",set:"Dark Castle",art:"../testroom/art/originals/Brock.png"},
  {id:437,name:"Rascals",rarity:"common",maxHp:3,ability:"Stampede",desc:"Entry: gain 3 Burn.",set:"Dark Castle",art:"../testroom/art/originals/Rascals.png"},
  {id:438,name:"Champ",rarity:"ghost-rare",maxHp:5,ability:"Thrill",desc:"Immune to damage from Specials. Gains +1 Surge when anyone rolls doubles.",set:"Dark Castle",art:"../testroom/art/originals/Champ.png"},
  {id:110,name:"The Mountain King",rarity:"legendary",maxHp:9,ability:"Beast Mode",desc:"Doubles deal 2X damage.",set:"Set 1",art:"../testroom/art/originals/mountain_king_leg.jpg"},
];

// Legacy — used for internal reference, not player-selectable
const DISCIPLINES = [
  { id: 'hunter', name: 'Hunter', icon: '&#127993;', desc: 'Combat bonuses, better wild encounter rates', color: '#c44' },
  { id: 'artificer', name: 'Artificer', icon: '&#128295;', desc: 'Crafting bonuses, extra experimentation', color: '#4ac' },
  { id: 'merchant', name: 'Merchant', icon: '&#128142;', desc: 'Better trades, larger shop inventory', color: '#ca4' },
  { id: 'scout', name: 'Scout', icon: '&#128506;&#65039;', desc: 'Finds rarer resources, reveals hidden zones', color: '#4a4' },
];
