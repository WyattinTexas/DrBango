// ═══════════════════════════════════════════════════════════════
// BOO! SPIRIT BATTLES — OVERWORLD ADVENTURE NARRATION
// Travel text, NPC dialogue, story breadcrumbs, camp scenes
// All text: second-person present tense, short, evocative
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ═══════ REGION ID → DISPLAY NAME ═══════
  var REGION_NAMES = {
    'rolling_hills': 'Rolling Hills',
    'frost_valley': 'Frost Valley',
    'volcanic_isles': 'Volcanic Isles',
    'dark_castle': 'Dark Castle',
    'Rolling Hills': 'Rolling Hills',
    'Frost Valley': 'Frost Valley',
    'Volcanic Isles': 'Volcanic Isles',
    'Dark Castle': 'Dark Castle'
  };
  function regionName(id) { return REGION_NAMES[id] || id; }

  // ═══════ DETERMINISTIC HASH ═══════
  // Simple string hash so the same node/visit always picks the same line
  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  function pick(arr, seed) {
    return arr[hash(seed) % arr.length];
  }

  // ═══════════════════════════════════════════════════════════════
  // 1. TRAVEL NARRATION
  // ═══════════════════════════════════════════════════════════════

  const TRAVEL_TEXTS = {
    'Rolling Hills': [
      'Golden light spills across the meadow. A warm breeze carries the scent of wildflowers.',
      'Birdsong follows you down the sunlit path. The grass sways gently at your ankles.',
      'Butterflies scatter as you walk. The hills roll on forever, soft and green.',
      'A creek babbles somewhere nearby. The afternoon light makes everything glow.',
      'The path is well-worn and easy. Dandelion seeds drift past like tiny spirits.',
      'You pass an old stone wall covered in moss. Beyond it, the fields stretch golden to the horizon.',
      'The air smells of honey and cut grass. A lazy hawk circles overhead.',
      'Wildflowers nod as you pass. This part of the Overworld feels like a warm memory.'
    ],
    'Frost Valley': [
      'Your breath hangs in the air like a ghost. The snow crunches with every step.',
      'Ice crystals glitter on the bare branches above. The silence is absolute.',
      'A howling wind cuts through the valley. You pull your collar tighter.',
      'The frozen lake to your left is perfectly still. Something dark moves beneath the surface.',
      'Snow begins to fall in heavy, silent flakes. The path ahead is barely visible.',
      'Frost creeps across the stones beneath your feet. The cold is sharp and clean.',
      'Icicles hang from a rocky overhang like teeth. The beauty here has an edge to it.',
      'The trees are bare and pale. Their branches claw at a white sky.'
    ],
    'Volcanic Isles': [
      'The ground rumbles beneath your boots. A plume of ash rises in the distance.',
      'Heat shimmers off the dark stone. The air tastes of sulfur and iron.',
      'Lava glows in the cracks below the path. You step carefully.',
      'Ash falls like grey snow, coating your shoulders. The sky is a bruised orange.',
      'A vent hisses steam across the trail. The heat is relentless.',
      'The rock is black and jagged. Far below, rivers of molten fire crawl toward the sea.',
      'Embers drift upward from fissures in the earth. The ground itself is alive.',
      'Smoke curls from the peaks ahead. Every step feels like walking on a sleeping giant.'
    ],
    'Dark Castle': [
      'The walls close in. Purple light pulses faintly from cracks in the ancient stone.',
      'Whispers echo from somewhere you cannot see. The shadows seem to breathe.',
      'The air is thick and cold. Your footsteps echo too many times.',
      'Torches flicker in brackets, but their flames give no warmth. The darkness watches.',
      'The corridor stretches ahead, impossibly long. Portraits on the walls follow you with hollow eyes.',
      'Dust motes hang frozen in slivers of violet light. Time moves differently here.',
      'The stone beneath your feet is worn smooth by countless footsteps. All of them leading in.',
      'A door creaks shut behind you. You did not touch it.'
    ]
  };

  const TRANSITION_TEXTS = {
    'Rolling Hills->Frost Valley': 'The warm breeze dies. Cold air rushes to meet you as the ground turns white.',
    'Rolling Hills->Volcanic Isles': 'The air grows thick and hot. Ash begins to fall like grey snow.',
    'Rolling Hills->Dark Castle': 'The golden light fades. Ahead, the castle rises from the earth like a wound.',
    'Frost Valley->Rolling Hills': 'The ice thins. Color returns to the world, and you hear birdsong again.',
    'Frost Valley->Volcanic Isles': 'The cold gives way to scorching heat so fast it makes your head spin.',
    'Frost Valley->Dark Castle': 'Shadows reach out from the castle walls. The temperature drops further. Something watches.',
    'Volcanic Isles->Rolling Hills': 'The heat releases its grip. Green hills appear through the thinning smoke.',
    'Volcanic Isles->Frost Valley': 'Steam rises where fire meets ice. The transition is violent and sudden.',
    'Volcanic Isles->Dark Castle': 'The volcanic glow dims. A deeper, colder darkness swallows the light ahead.',
    'Dark Castle->Rolling Hills': 'You step into sunlight and gasp. The warmth feels like waking from a nightmare.',
    'Dark Castle->Frost Valley': 'The oppressive dark lifts into clean, bitter cold. The sky is white and open.',
    'Dark Castle->Volcanic Isles': 'The castle walls give way to scorched earth. At least the fire is honest.'
  };

  function getTravelText(fromRegion, toRegion, fromNodeName, toNodeName) {
    var from = regionName(fromRegion);
    var to = regionName(toRegion);
    // If crossing regions, use transition text
    if (from && to && from !== to) {
      var key = from + '->' + to;
      if (TRANSITION_TEXTS[key]) return TRANSITION_TEXTS[key];
    }
    // Otherwise pick from regional pool
    var region = to || from || 'Rolling Hills';
    var texts = TRAVEL_TEXTS[region] || TRAVEL_TEXTS['Rolling Hills'];
    var seed = (fromNodeName || '') + '>' + (toNodeName || '');
    return pick(texts, seed);
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. NPC DIALOGUE
  // ═══════════════════════════════════════════════════════════════

  // -- Camp NPC: Ember --
  var EMBER_FIRST = [
    'Well now, a new face on the road. Sit down, warm yourself. The spirits are restless tonight.',
    'You look like you could use a rest. Name\'s Ember. I\'ve walked every path in this Overworld twice.',
    'Ah, a young summoner. I remember my first journey out of Toby\'s Cottage. Come, sit.'
  ];
  var EMBER_RETURN = [
    'Back again, are we? Good. The road is no place to be proud about resting.',
    'I saved your spot by the fire. Tell me, what have you seen out there?',
    'The fire remembers you. So do I. Rest now, you\'ve earned it.',
    'You\'re getting stronger. I can see it in the way your spirits move.',
    'Ah, my favorite traveler. The kettle\'s still warm.'
  ];

  // -- Shop NPCs --
  var BRAMBLE_LINES = [
    'Welcome to Bramble\'s Post! I\'ve got treasures from every corner of the hills. Take a look!',
    'Oh, a customer! You won\'t believe what I found in the tall grass yesterday.',
    'Everything here has a story. That jar? Don\'t open it. Trust me.',
    'Bramble\'s the name, oddities are the game. What catches your eye?',
    'Back for more? I knew you had taste.'
  ];
  var FROSTWEAVER_LINES = [
    'Browse. Don\'t touch the blue ones.',
    'You again. Good. I have something.',
    'Cold keeps things preserved. My wares are pristine.',
    'Speak quickly. The wind listens.',
    'Choose well. Returns are... difficult.'
  ];
  var SLAG_LINES = [
    'HEY THERE! Welcome to the Forge Market! Everything\'s HOT and FRESH!',
    'YOU LOOK LIKE SOMEONE WHO APPRECIATES QUALITY! Come in, come in!',
    'Slag\'s got the goods! Forged in REAL lava! Mostly!',
    'BACK AGAIN! I kept the best stuff for you! Maybe!',
    'Don\'t worry about the smoke, that\'s just FLAVOR!'
  ];
  var WHISPER_LINES = [
    '...you came. I have what you need. Perhaps.',
    '...the shadows carry useful things. Look closely...',
    '...not many find this place. Fewer leave empty-handed...',
    '...speak softly. The walls remember every word...',
    '...take what you need. Leave what you can...'
  ];

  var SHOP_NPCS = {
    'Rolling Hills': { speaker: 'Bramble', lines: BRAMBLE_LINES },
    'Frost Valley':  { speaker: 'Frostweaver', lines: FROSTWEAVER_LINES },
    'Volcanic Isles': { speaker: 'Slag', lines: SLAG_LINES },
    'Dark Castle':   { speaker: 'The Whisper', lines: WHISPER_LINES }
  };

  // -- Shrine spirits --
  var SHRINE_LINES = [
    'The one who fell still reaches for the light. Will you be his mirror or his shadow?',
    'All roads lead to the throne. But not all who arrive are ready.',
    'The spirits remember what was promised. Do you hear them whispering his name?',
    'A bond between summoner and spirit is unbreakable. Even in madness. Even in sorrow.',
    'The darkness ahead is not empty. It is full of grief.'
  ];

  // -- Quest NPC: The Hooded Figure --
  var HOODED_LINES = [
    'You. I\'ve been waiting. There is something that needs doing, and you are the one to do it.',
    'Don\'t ask my name. It won\'t help you. Listen carefully.',
    'The path you\'re on is the right one. But there\'s a detour I need you to take.',
    'I appear where I\'m needed. Right now, that\'s here. For you.',
    'You have questions. I have tasks. Let\'s skip to the useful part.'
  ];

  // -- Toby --
  var TOBY_FIRST = [
    'There you are! I was starting to worry. The Overworld is beautiful, but it\'s changing. Be careful out there, okay?',
    'Welcome home! Well, my home. But it\'s yours too, for as long as you need it.',
    'Oh! A visitor! I\'m Toby. This cottage has been here since before the darkness. You\'re safe here.'
  ];
  var TOBY_RETURN = [
    'You\'re back! I\'m so glad. I made soup. It\'s probably cold by now, but still.',
    'Every time you leave, I watch the road until I can\'t see you anymore. Welcome back.',
    'The cottage feels warmer when you\'re here. Tell me everything.',
    'I can feel your spirits growing stronger. But please, don\'t push too hard.',
    'The Overworld needs you. But so do I. Rest a while?'
  ];

  // -- Boss pre-battle narration --
  var BOSS_LINES = {
    'Rolling Hills': {
      speaker: 'Narrator',
      lines: [
        'The ground shakes. A massive shape rises from the hillside, ancient and territorial. This land has a guardian, and you are not welcome.',
        'The birds fall silent. The flowers close. Something old has awakened, and it is not pleased.'
      ]
    },
    'Frost Valley': {
      speaker: 'Narrator',
      lines: [
        'The blizzard parts. In the eye of the storm stands a figure of living ice, crown gleaming with frozen light. King Jay regards you with cold fury.',
        'The valley floor cracks open. From the depths rises a presence so cold it burns. The final trial of the frost begins.'
      ]
    },
    'Volcanic Isles': {
      speaker: 'Narrator',
      lines: [
        'The volcano splits open. Magma surges upward as a colossal form takes shape in the fire. Nerina has been waiting.',
        'The ground gives way to a chamber of molten rock. At its center, wreathed in flame, the lord of the Isles awakens.'
      ]
    },
    'Dark Castle': {
      speaker: 'Narrator',
      lines: [
        'The throne room doors open on their own. At the far end, bathed in violet light, sits Valkin. He looks up. His eyes hold no malice. Only exhaustion.',
        'You stand before the Grand Summoner. The darkness swirls around him like a living cloak. He speaks your name. He has been expecting you.'
      ]
    }
  };

  // -- Event nodes (atmospheric, no NPC) --
  var EVENT_TEXTS = {
    'Rolling Hills': [
      'A circle of standing stones hums faintly in the afternoon light. Something happened here once.',
      'An abandoned cart sits by the road, overflowing with wildflowers that weren\'t planted.',
      'The wind carries a melody from somewhere over the hills. It\'s beautiful and sad.'
    ],
    'Frost Valley': [
      'A frozen waterfall towers above you, suspended mid-cascade. Time stopped here.',
      'Footprints in the snow lead in circles, then vanish. Whoever made them is gone.',
      'An ice formation catches the light and throws rainbows across the snow.'
    ],
    'Volcanic Isles': [
      'A pool of crystal-clear water sits impossibly beside a lava flow. Steam rises where they meet.',
      'Obsidian shards jut from the ground like black teeth. Something exploded here long ago.',
      'A spirit\'s cry echoes from inside the mountain. It sounds like singing.'
    ],
    'Dark Castle': [
      'A library stretches into darkness. Books float off their shelves, pages turning on their own.',
      'A mirror hangs on the wall. Your reflection moves a half-second too late.',
      'Candles light themselves as you pass. They go out the moment you look back.'
    ]
  };

  function getNodeGreeting(nodeType, nodeName, region, summonerName, visitCount) {
    region = regionName(region);
    var isFirst = !visitCount || visitCount <= 1;
    var seed = nodeName + '#' + (visitCount || 0);
    var name = summonerName || 'Summoner';

    switch (nodeType) {
      case 'camp':
        return {
          speaker: 'Ember',
          text: isFirst
            ? pick(EMBER_FIRST, seed)
            : pick(EMBER_RETURN, seed)
        };

      case 'shop':
        var shopNpc = SHOP_NPCS[region] || SHOP_NPCS['Rolling Hills'];
        return {
          speaker: shopNpc.speaker,
          text: pick(shopNpc.lines, seed)
        };

      case 'shrine':
        return {
          speaker: 'Ancient Spirit',
          text: pick(SHRINE_LINES, seed)
        };

      case 'event':
        var evtTexts = EVENT_TEXTS[region] || EVENT_TEXTS['Rolling Hills'];
        return {
          speaker: null,
          text: pick(evtTexts, seed)
        };

      case 'quest':
        return {
          speaker: 'Hooded Figure',
          text: pick(HOODED_LINES, seed)
        };

      case 'start':
        return {
          speaker: 'Toby',
          text: isFirst
            ? pick(TOBY_FIRST, seed)
            : pick(TOBY_RETURN, seed)
        };

      case 'boss':
        var bossData = BOSS_LINES[region] || BOSS_LINES['Dark Castle'];
        return {
          speaker: bossData.speaker,
          text: pick(bossData.lines, seed)
        };

      default:
        return {
          speaker: null,
          text: 'You arrive at ' + nodeName + '.'
        };
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. STORY BREADCRUMBS
  // ═══════════════════════════════════════════════════════════════

  var BREADCRUMBS = {
    'Rolling Hills': [
      { at: 0.0, text: 'They say a great summoner once walked these fields. The spirits still speak his name with reverence.' },
      { at: 0.2, text: 'An old shrine bears an inscription: "To protect them forever." The letters are worn but fierce.' },
      { at: 0.4, text: 'The old spirits remember a time before the darkness. They say it came from love, not hate.' },
      { at: 0.6, text: 'A faded mural shows a summoner surrounded by spirits, all of them smiling. His face has been scratched away.' },
      { at: 0.8, text: 'Ember once told a traveler: "He didn\'t fall. He reached too far." No one asked who he meant.' }
    ],
    'Frost Valley': [
      { at: 0.0, text: 'King Jay whispers that Valkin tried to save them all. The ice in his voice cracks when he says it.' },
      { at: 0.2, text: 'The frost here is unnatural. It arrived the same night the ritual failed, and it has never thawed.' },
      { at: 0.4, text: 'The ice remembers his tears. Frozen droplets embedded in the glacier walls, perfectly preserved.' },
      { at: 0.6, text: 'Valkin discovered the truth: when a summoner dies, their spirits fade. Not instantly. Slowly. Alone.' },
      { at: 0.8, text: 'He couldn\'t accept it. He spent years searching for a way to make the bond permanent. Eternal.' }
    ],
    'Volcanic Isles': [
      { at: 0.0, text: 'The fires burn with Valkin\'s rage. Or is it grief? Nerina says the two are the same down here.' },
      { at: 0.2, text: 'He found the ritual in a book that should have stayed buried. Merge the Spirit World with the Overworld. Make it one.' },
      { at: 0.4, text: 'Nerina says the ritual scarred the earth itself. The volcanoes woke that night and have not slept since.' },
      { at: 0.6, text: 'The merge failed. The worlds collided but did not join. Valkin was caught between them, torn in half.' },
      { at: 0.8, text: 'He is not dead. He is not alive. He exists in the wound between worlds, holding it open with his will.' }
    ],
    'Dark Castle': [
      { at: 0.0, text: 'The castle was not always dark. Once, it was the brightest place in the Overworld. A school for summoners.' },
      { at: 0.2, text: 'The darkness is not malice. It is sorrow given form. Every shadow is a memory of what was lost.' },
      { at: 0.4, text: 'His spirits are still with him. Not enslaved. Loyal. They chose to stay, even in the dark.' },
      { at: 0.6, text: 'He does not want to destroy the Overworld. He wants to fix it. He just doesn\'t know how anymore.' },
      { at: 0.8, text: 'He waits at the throne. Not to fight. To be understood. To ask if you found a better way.' }
    ]
  };

  function getStoryBreadcrumb(region, progress) {
    region = regionName(region);
    var crumbs = BREADCRUMBS[region];
    if (!crumbs) return null;
    // Return the highest-threshold crumb the player has reached
    var result = null;
    for (var i = 0; i < crumbs.length; i++) {
      if (progress >= crumbs[i].at) {
        result = crumbs[i].text;
      }
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. CAMP SCENES
  // ═══════════════════════════════════════════════════════════════

  var CAMP_SCENES = {
    'Rolling Hills': [
      'The fire crackles softly under a sky full of stars. {g1} curls up near the warmth while {g2} watches the constellations. For a moment, everything is peaceful.',
      'Crickets sing from the tall grass. {g1} hums along quietly. {g2} is already asleep, glowing faintly in the firelight.',
      'The sunset paints the hills in amber and rose. You sit with {g1} and {g2}, sharing the silence. No words needed.',
      'Fireflies drift through the camp. {g1} tries to catch one. {g2} pretends not to watch, but you catch a smile.'
    ],
    'Frost Valley': [
      'The fire hisses against the cold. {g1} presses close to the flames while {g2} keeps watch, eyes scanning the white darkness.',
      'Snow falls gently around the camp. {g1} and {g2} huddle together. The warmth between you feels hard-won and precious.',
      'Ice crystals sparkle on the tent. {g1} breathes frost patterns in the air. {g2} shivers but refuses to complain.',
      'The aurora ripples overhead in green and violet. {g1} stares upward in wonder. {g2} says nothing, but you feel them move closer.'
    ],
    'Volcanic Isles': [
      'The ground is warm enough to sleep on without a fire. {g1} stretches out on the black rock. {g2} watches the distant lava glow.',
      'Ash drifts through the camp like snow. {g1} brushes it from {g2}\'s head. Even here, there is tenderness.',
      'The volcano rumbles a low lullaby. {g1} and {g2} rest uneasily, but they rest. Tomorrow will be harder.',
      'Embers float upward into a smoke-stained sky. {g1} traces patterns in the ash. {g2} stands guard, silhouetted against the red horizon.'
    ],
    'Dark Castle': [
      'The fire feels defiant here, a small rebellion against the pressing dark. {g1} stays close. {g2} watches the shadows.',
      'You camp in an alcove where the torches still burn. {g1} sleeps fitfully. {g2} whispers that they can hear something breathing in the walls.',
      'The silence is heavy. {g1} breaks it with a quiet joke. {g2} laughs, and for a heartbeat, the darkness flinches.',
      'Purple light seeps under the door. {g1} and {g2} sit back to back, alert. You rest your eyes, knowing they will not.'
    ]
  };

  function getCampScene(region, summonerName, partyNames) {
    region = regionName(region);
    var scenes = CAMP_SCENES[region] || CAMP_SCENES['Rolling Hills'];
    var seed = region + ':' + (summonerName || 'Summoner') + ':' + (partyNames || []).join(',');
    var text = pick(scenes, seed);

    // Fill in ghost names
    var names = partyNames || [];
    var g1 = names[0] || 'your spirit';
    var g2 = names[1] || (names[0] ? 'your other spirit' : 'your companion');

    text = text.replace(/\{g1\}/g, g1);
    text = text.replace(/\{g2\}/g, g2);

    return text;
  }

  // ═══════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════

  window.Narration = {
    getTravelText: getTravelText,
    getNodeGreeting: getNodeGreeting,
    getStoryBreadcrumb: getStoryBreadcrumb,
    getCampScene: getCampScene
  };

})();
