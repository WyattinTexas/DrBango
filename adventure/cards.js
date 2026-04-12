/* ==========================================================
   THE LANTERN'S PATH — Card Pool
   A prototype-scale subset of the BOO Spiritkin, drawn
   from ~/DrBango/testroom/index.html with abilities adapted
   for the simplified adventure mode dice math.
   ========================================================== */

// Each card:
//   id, name, region, maxHp, ability, abilityText, art (relative to /adventure/)
//   trigger: function(ctx) → returns modifier object for the round
//     ctx = { dice: [n,n,n], phase: 'boo'|'restoration', roll: 'self'|'opp' }
//     return: { bonusDmg, bonusLight, heal, note }

const ADVENTURE_CARDS = [
  // ----- STARTERS -----
  {
    id: 'spark',
    name: 'Spark',
    region: 'starter',
    rarity: 'starter',
    maxHp: 8,
    ability: 'First Bark',
    abilityText: 'On doubles: +1 damage. On triples: +2. Toby\'s first companion.',
    art: '../testroom/art/clover.jpg', // clover is the closest dog-spirit stand-in we have
    trigger: (ctx) => {
      if (ctx.phase === 'boo') {
        if (hasTriples(ctx.dice)) return { bonusDmg: 2, note: 'Spark barks three times!' };
        if (hasDoubles(ctx.dice)) return { bonusDmg: 1, note: 'Spark barks!' };
      }
      return {};
    }
  },

  // ----- ROLLING HILLS -----
  {
    id: 'penny',
    name: 'Penny',
    region: 'Rolling Hills',
    rarity: 'common',
    maxHp: 4,
    ability: 'Forager',
    abilityText: 'On win: gain +1 blue flame.',
    art: '../testroom/art/penny.webp',
    trigger: () => ({}),
    onWin: (state) => { state.flame = Math.min(state.flame + 1, state.maxFlame); return 'Penny forages — +1 flame.'; }
  },
  {
    id: 'bramble',
    name: 'Bramble',
    region: 'Rolling Hills',
    rarity: 'common',
    maxHp: 3,
    ability: 'Thorn Wall',
    abilityText: 'Any rolled 1 deals 1 damage back to the opponent.',
    art: '../testroom/art/bramble.webp',
    trigger: (ctx) => {
      if (ctx.phase === 'boo') {
        const ones = ctx.dice.filter(d => d === 1).length;
        if (ones > 0) return { oppDmg: ones, note: `Thorns prick for ${ones}.` };
      }
      return {};
    }
  },
  {
    id: 'biscuit',
    name: 'Biscuit',
    region: 'Rolling Hills',
    rarity: 'common',
    maxHp: 5,
    ability: 'Warm Up',
    abilityText: 'On win: heal 1 HP (cannot exceed max).',
    art: '../testroom/art/biscuit.webp',
    trigger: () => ({}),
    onWin: (state, self) => {
      if (self.hp < self.maxHp) { self.hp += 1; return 'Biscuit warms the pack — +1 HP.'; }
      return '';
    }
  },

  // ----- FROST VALLEY -----
  {
    id: 'gary',
    name: 'Gary',
    region: 'Frost Valley',
    rarity: 'rare',
    maxHp: 6,
    ability: 'Lucky Novice',
    abilityText: 'Each rolled 1 becomes +2 Wills (restoration) or +1 damage (combat).',
    art: '../testroom/art/originals/gary.jpg',
    trigger: (ctx) => {
      const ones = ctx.dice.filter(d => d === 1).length;
      if (ones > 0) {
        if (ctx.phase === 'restoration') return { bonusLight: ones * 2, note: `Gary reads the ones — +${ones * 2} Light.` };
        return { bonusDmg: ones, note: `Gary reads the ones — +${ones} damage.` };
      }
      return {};
    }
  },
  {
    id: 'skylar',
    name: 'Skylar',
    region: 'Frost Valley',
    rarity: 'ghost-rare',
    maxHp: 7,
    ability: 'Winter Barrage',
    abilityText: 'Each die showing 4–6 deals +1 bonus damage (Frost Valley\'s ice amplifier).',
    art: '../testroom/art/originals/skylar.jpg',
    trigger: (ctx) => {
      if (ctx.phase === 'boo') {
        const shards = ctx.dice.filter(d => d >= 4).length;
        if (shards > 0) return { bonusDmg: shards, note: `Winter Barrage — +${shards} ice damage.` };
      }
      return {};
    }
  },
  {
    id: 'zain',
    name: 'Zain',
    region: 'Frost Valley',
    rarity: 'ghost-rare',
    maxHp: 6,
    ability: 'Ice Blade',
    abilityText: 'On triples: deal 4 damage instead of normal.',
    art: '../testroom/art/echo.png',
    trigger: (ctx) => {
      if (ctx.phase === 'boo' && hasTriples(ctx.dice)) return { overrideDmg: 4, note: 'Ice Blade strikes for 4!' };
      return {};
    }
  },

  // ----- DARK VALLEY -----
  {
    id: 'mireclaw',
    name: 'Mireclaw',
    region: 'Dark Valley',
    rarity: 'common',
    maxHp: 5,
    ability: 'Hungry',
    abilityText: 'On win: drain 1 HP from the enemy ghost (works against BOO bosses too).',
    art: null,
    trigger: () => ({}),
    onWin: (state, self, enemy) => {
      if (enemy && enemy.hp > 0) { enemy.hp = Math.max(0, enemy.hp - 1); return 'Mireclaw drains 1 HP.'; }
      return '';
    }
  },
  {
    id: 'hollowe',
    name: 'Hollowe',
    region: 'Dark Valley',
    rarity: 'uncommon',
    maxHp: 4,
    ability: 'Night Vision',
    abilityText: 'Ignores the first die the enemy rolls each round.',
    art: null,
    trigger: () => ({}),
    passiveEnemyMod: (enemyDice) => enemyDice.slice(1)
  },
  {
    id: 'ashen-hound',
    name: 'Ashen Hound',
    region: 'Dark Valley',
    rarity: 'rare',
    maxHp: 6,
    ability: 'Pack Bond',
    abilityText: 'If any other companion is in the party: +1 damage per round.',
    art: null,
    trigger: (ctx, state) => {
      if (ctx.phase === 'boo' && state && state.party.length > 1) return { bonusDmg: 1, note: 'Pack bond — +1 damage.' };
      return {};
    }
  },

  // ----- DARK CASTLE -----
  {
    id: 'scallywags',
    name: 'Scallywags',
    region: 'Dark Castle',
    rarity: 'common',
    maxHp: 5,
    ability: 'Frenzy',
    abilityText: 'If all dice roll under 4: +2 damage next round (flavor: frenzied low rolls).',
    art: '../testroom/art/originals/Scallywags.png',
    trigger: (ctx) => {
      if (ctx.phase === 'boo' && ctx.dice.every(d => d < 4)) return { bonusDmg: 2, note: 'Frenzy flares — +2 damage.' };
      return {};
    }
  },
  {
    id: 'ancient-one',
    name: 'Ancient One',
    region: 'Dark Castle',
    rarity: 'uncommon',
    maxHp: 7,
    ability: 'Friend to All',
    abilityText: 'On ties (equal damage dealt): heal 2 HP to Ancient One.',
    art: '../testroom/art/originals/ancient_one.jpg',
    trigger: () => ({}),
    onTie: (state, self) => {
      self.hp = Math.min(self.maxHp, self.hp + 2);
      return 'Ancient One shares the moment — +2 HP.';
    }
  },
];

// ---------- Utility ----------
function hasDoubles(dice) {
  return new Set(dice).size < dice.length;
}
function hasTriples(dice) {
  return new Set(dice).size === 1 && dice.length >= 3;
}

// ---------- Wild enemies (for BOO matches and Restoration encounters) ----------
const WILD_ENEMIES = {
  'Rolling Hills': [
    { name: 'Dust Bandit', hp: 4, dmgBonus: 0, flavor: 'A masked figure steps from the tall grass.' },
    { name: 'Hedge Thief', hp: 4, dmgBonus: 0, flavor: 'Thorns rustle. Eyes like coins.' },
    { name: 'Wild Spiritkin', hp: 5, dmgBonus: 0, flavor: 'Something corrupted watches from the reeds.' },
  ],
  'Frost Valley': [
    { name: 'Frostborn Stalker', hp: 5, dmgBonus: 0, flavor: 'Its breath crackles in the air.' },
    { name: 'Glacier Wight', hp: 6, dmgBonus: 0, flavor: 'Ice grows where it walks.' },
    { name: 'Hollow Snowkin', hp: 5, dmgBonus: 0, flavor: 'Its face is all white hollows.' },
  ],
  'Dark Valley': [
    { name: 'Gloom Stalker', hp: 5, dmgBonus: 1, flavor: 'The night grows teeth.' },
    { name: 'Mire Fiend', hp: 6, dmgBonus: 1, flavor: 'It rises out of the mud like a drowned prayer.' },
    { name: 'Shade-eater', hp: 5, dmgBonus: 1, flavor: 'It has already forgotten its own name.' },
  ],
  'Dark Castle': [
    { name: 'Valkin\'s Herald', hp: 6, dmgBonus: 1, flavor: 'It wears a tarnished crown.' },
    { name: 'Chained Spiritkin', hp: 6, dmgBonus: 1, flavor: 'Its eyes beg. Its claws do not.' },
  ],
};

const REGION_BOSSES = {
  'Rolling Hills': { name: 'The Kind Traveler', hp: 9, dmgBonus: 2, flavor: 'He offered you a cup of tea. Then he smiled wrong.' },
  'Frost Valley': { name: 'The Ice Warden', hp: 11, dmgBonus: 2, flavor: 'An ancient thing, frozen in the shape of watching.', art: 'art/FrostValley-Boss.png' },
  'Dark Valley': { name: 'The Many-Mouthed', hp: 12, dmgBonus: 3, flavor: 'A wall of hunger wearing the shape of a spirit.' },
};

const VALKIN = {
  name: 'Valkin the Grand',
  hp: 12,
  dmgBonus: 2,
  flavor: 'He no longer believes in balance. He believes in control.',
  rigged: true,
};

const CORRUPTED_SPIRITKIN = [
  { name: 'A Lost Sapling', corruption: 5, threshold: 12, flavor: 'A small spirit curled around a dying root.' },
  { name: 'A Stone Singer', corruption: 6, threshold: 13, flavor: 'It was a voice once. Now it is a wail in shape.' },
  { name: 'A Pale Hunter', corruption: 7, threshold: 14, flavor: 'Its corruption grows fast. You can save it — if you are brave.' },
  { name: 'A Drowned Lantern', corruption: 6, threshold: 13, flavor: 'Blue flame in the fog. It remembers your grandfather.' },
];
