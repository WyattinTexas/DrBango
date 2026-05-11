// ═══════════════════════════════════════════════════
// BATTLE SCENE — Clean card-game layout
// Matches the reference screenshot: cards left/right, HP text, FIGHT/RUN
// ═══════════════════════════════════════════════════

class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  init(data) {
    this.enemyCard = data.enemyCard;
  }

  create() {
    const { width, height } = this.scale;

    // ── Off-white background ──
    this.cameras.main.setBackgroundColor('#EBE7E3');

    // ── Header ──
    this.add.text(width / 2, 30, `Wild ${this.enemyCard.name} appears!`, {
      fontSize: '28px', fontFamily: 'Georgia, serif', fontStyle: 'bold',
      color: '#222222',
    }).setOrigin(0.5);

    // ── Player card (left) ──
    const playerGhost = G.team[G.activeIdx];
    const playerCard = ALL_CARDS.find(c => c.id === playerGhost?.id);

    // Card frame
    this.add.rectangle(width * 0.25, height * 0.45, 200, 280, 0x333333)
      .setStrokeStyle(3, 0x222222);
    this.add.rectangle(width * 0.25, height * 0.45, 194, 274, 0x1a1a2e);

    // Card name inside
    this.add.text(width * 0.25, height * 0.35, playerCard?.name || '???', {
      fontSize: '18px', fontFamily: 'Georgia, serif', fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Card ability
    this.add.text(width * 0.25, height * 0.55, playerCard?.ability || '', {
      fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'italic',
      color: '#aaaacc',
    }).setOrigin(0.5);

    // Player HP
    const pHP = playerGhost?.hp || playerGhost?.maxHp || 1;
    const pMax = playerGhost?.maxHp || 1;
    this.playerHPText = this.add.text(width * 0.25, height * 0.68, `${playerCard?.name}  HP ${pHP}/${pMax}`, {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#222222',
    }).setOrigin(0.5);

    // "YOU" label
    this.add.text(width * 0.5, height * 0.42, 'YOU', {
      fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'bold',
      color: '#888888',
    }).setOrigin(0.5);

    // "FOE" label
    this.add.text(width * 0.5, height * 0.48, 'FOE', {
      fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'bold',
      color: '#888888',
    }).setOrigin(0.5);

    // ── Enemy card (right) ──
    this.add.rectangle(width * 0.75, height * 0.45, 200, 280, 0x333333)
      .setStrokeStyle(3, 0x222222);
    this.add.rectangle(width * 0.75, height * 0.45, 194, 274, 0x1a2e1a);

    this.add.text(width * 0.75, height * 0.35, this.enemyCard.name, {
      fontSize: '18px', fontFamily: 'Georgia, serif', fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(width * 0.75, height * 0.55, this.enemyCard.ability || '', {
      fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'italic',
      color: '#aaccaa',
    }).setOrigin(0.5);

    // HP number on card
    this.add.text(width * 0.75 + 80, height * 0.32, `${this.enemyCard.maxHp}`, {
      fontSize: '24px', fontFamily: 'Georgia, serif', fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Enemy HP
    this.enemyHP = this.enemyCard.maxHp;
    this.enemyMaxHP = this.enemyCard.maxHp;
    this.enemyHPText = this.add.text(width * 0.75, height * 0.15, `${this.enemyCard.name}  HP ${this.enemyHP}/${this.enemyMaxHP}`, {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold',
      color: '#222222',
    }).setOrigin(0.5);

    // ── FIGHT button ──
    const fightBg = this.add.rectangle(width * 0.72, height * 0.88, 130, 48, 0x222222)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x444444);
    this.add.text(width * 0.72, height * 0.88, 'FIGHT', {
      fontSize: '22px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    fightBg.on('pointerdown', () => this.doRound());

    // ── RUN button ──
    const runBg = this.add.rectangle(width * 0.88, height * 0.88, 100, 48, 0x993322)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x664422);
    this.add.text(width * 0.88, height * 0.88, 'RUN', {
      fontSize: '22px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#ffffff'
    }).setOrigin(0.5);

    runBg.on('pointerdown', () => this.endBattle(false));

    // ── Battle log ──
    this.logText = this.add.text(width * 0.5, height * 0.78, 'Press FIGHT to roll the dice!', {
      fontSize: '14px', fontFamily: 'monospace', color: '#555555',
    }).setOrigin(0.5);

    // Battle state
    this.playerHP = pHP;
    this.playerMaxHP = pMax;
    this.round = 0;
  }

  doRound() {
    this.round++;
    const { width, height } = this.scale;

    // Roll dice (simplified — 3 dice each)
    const pDice = [this.rollDie(), this.rollDie(), this.rollDie()].sort();
    const eDice = [this.rollDie(), this.rollDie(), this.rollDie()].sort();

    const pResult = this.classifyRoll(pDice);
    const eResult = this.classifyRoll(eDice);

    // Determine winner
    let log = `Round ${this.round}: You rolled [${pDice}] (${pResult.type}) vs [${eDice}] (${eResult.type})`;

    if (pResult.tier > eResult.tier || (pResult.tier === eResult.tier && pResult.value > eResult.value)) {
      // Player wins round
      const dmg = pResult.tier;
      this.enemyHP = Math.max(0, this.enemyHP - dmg);
      log += ` — You deal ${dmg} damage!`;
      this.cameras.main.shake(100, 0.005);
    } else if (eResult.tier > pResult.tier || (eResult.tier === pResult.tier && eResult.value > pResult.value)) {
      // Enemy wins round
      const dmg = eResult.tier;
      this.playerHP = Math.max(0, this.playerHP - dmg);
      log += ` — Enemy deals ${dmg} damage!`;
      this.cameras.main.shake(150, 0.008);
    } else {
      log += ' — Tie! No damage.';
    }

    this.logText.setText(log);

    // Update HP displays
    this.playerHPText.setText(`${G.team[G.activeIdx]?.name}  HP ${this.playerHP}/${this.playerMaxHP}`);
    this.playerHPText.setColor(this.playerHP <= this.playerMaxHP * 0.33 ? '#cc2211' : '#222222');

    this.enemyHPText.setText(`${this.enemyCard.name}  HP ${this.enemyHP}/${this.enemyMaxHP}`);
    this.enemyHPText.setColor(this.enemyHP <= this.enemyMaxHP * 0.33 ? '#cc2211' : '#222222');

    // Check for KO
    if (this.enemyHP <= 0) {
      this.time.delayedCall(500, () => this.endBattle(true));
    } else if (this.playerHP <= 0) {
      this.time.delayedCall(500, () => this.endBattle(false));
    }
  }

  rollDie() { return Math.floor(Math.random() * 6) + 1; }

  classifyRoll(dice) {
    const counts = {};
    for (const d of dice) counts[d] = (counts[d] || 0) + 1;
    const maxCount = Math.max(...Object.values(counts));
    const maxVal = Math.max(...dice);

    if (maxCount >= 3) return { type: 'Triples', tier: 3, value: maxVal };
    if (maxCount >= 2) return { type: 'Doubles', tier: 2, value: maxVal };
    // Check straight
    const sorted = [...new Set(dice)].sort((a, b) => a - b);
    if (sorted.length === dice.length) {
      let isStraight = true;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] !== sorted[i - 1] + 1) { isStraight = false; break; }
      }
      if (isStraight) return { type: 'Straight', tier: 2, value: maxVal };
    }
    return { type: 'Singles', tier: 1, value: maxVal };
  }

  endBattle(won) {
    G.inBattle = false;

    if (won) {
      if (!G.rep) G.rep = { battlesWon: 0 };
      G.rep.battlesWon++;
      G.coins += 10;
      G.xp += 1;

      // Sideline unlock check
      if (G.rep.battlesWon === 5) {
        this.logText.setText('SIDELINE UNLOCKED! You can now bring 3 Spiritkin to battle!');
      }
    }

    // Update player ghost HP
    if (G.team[G.activeIdx]) {
      G.team[G.activeIdx].hp = this.playerHP;
      if (this.playerHP <= 0) G.team[G.activeIdx].ko = true;
    }

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(600, () => {
      this.scene.stop();
      this.scene.resume('WorldScene');
      // Fade back in on world scene
      this.scene.get('WorldScene').cameras.main.fadeIn(300);
    });
  }
}
