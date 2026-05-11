// ═══════════════════════════════════════════════════
// BATTLE SCENE — Uses the full battle engine from core/battle.js
// Clean card-game layout with real dice combat
// ═══════════════════════════════════════════════════

class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  init(data) {
    this.battleData = data;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#EBE7E3');

    // The real battle state B is already set up by triggerWildEncounter()
    // or triggerHostileNPCBattle() before this scene launches
    if (!B) {
      console.warn('[BattleScene] No battle state! Returning to world.');
      this.endBattle(false);
      return;
    }

    const playerGhost = activePlayerGhost();
    const enemyGhost = activeEnemyGhost();

    // ── Header ──
    const headerText = B.isHostileNPC
      ? `${this.battleData.trainerName || 'Trainer'} challenges you!`
      : `Wild ${enemyGhost?.name || '???'} appears!`;
    this.add.text(width / 2, 30, headerText, {
      fontSize: '28px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#222222',
    }).setOrigin(0.5);

    // ── Player card (left) ──
    const pCard = ALL_CARDS.find(c => c.id === playerGhost?.id);
    this.drawCard(width * 0.25, height * 0.45, pCard, playerGhost, 0x1a1a2e);

    // ── Enemy card (right) ──
    const eCard = ALL_CARDS.find(c => c.id === enemyGhost?.id);
    this.drawCard(width * 0.75, height * 0.45, eCard, enemyGhost, 0x1a2e1a);

    // ── YOU / FOE labels ──
    this.add.text(width / 2, height * 0.42, 'YOU', {
      fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#888888',
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.48, 'FOE', {
      fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#888888',
    }).setOrigin(0.5);

    // ── HP Text ──
    this.playerHPText = this.add.text(width * 0.25, height * 0.7,
      `${playerGhost?.name}  HP ${playerGhost?.hp}/${playerGhost?.maxHp}`, {
        fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', color: '#222222',
      }).setOrigin(0.5);

    this.enemyHPText = this.add.text(width * 0.75, height * 0.15,
      `${enemyGhost?.name}  HP ${enemyGhost?.hp}/${enemyGhost?.maxHp}`, {
        fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', color: '#222222',
      }).setOrigin(0.5);

    // ── Dice display area ──
    this.playerDiceText = this.add.text(width * 0.25, height * 0.8, '', {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', color: '#3355aa',
    }).setOrigin(0.5);

    this.enemyDiceText = this.add.text(width * 0.75, height * 0.8, '', {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', color: '#aa3333',
    }).setOrigin(0.5);

    // ── Battle log ──
    this.logText = this.add.text(width / 2, height * 0.9, 'Press FIGHT to roll!', {
      fontSize: '14px', fontFamily: 'monospace', color: '#555555',
      wordWrap: { width: width * 0.8 },
    }).setOrigin(0.5);

    // ── FIGHT button ──
    const fightBg = this.add.rectangle(width * 0.72, height * 0.95, 130, 40, 0x222222)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x444444);
    this.add.text(width * 0.72, height * 0.95, 'FIGHT', {
      fontSize: '20px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    fightBg.on('pointerdown', () => this.doRound());

    // ── RUN button ──
    const runBg = this.add.rectangle(width * 0.88, height * 0.95, 90, 40, 0x993322)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x664422);
    this.add.text(width * 0.88, height * 0.95, 'RUN', {
      fontSize: '20px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    runBg.on('pointerdown', () => this.endBattle(false));

    this.roundNum = 0;
  }

  drawCard(x, y, cardData, ghost, bgColor) {
    const { width, height } = this.scale;

    // Card frame
    this.add.rectangle(x, y, 200, 280, 0x333333).setStrokeStyle(3, 0x222222);
    this.add.rectangle(x, y, 194, 274, bgColor);

    // Try to load card art if available
    if (cardData?.art) {
      const artKey = `card_${cardData.id}`;
      if (!this.textures.exists(artKey)) {
        this.load.image(artKey, cardData.art);
        this.load.once('complete', () => {
          if (this.textures.exists(artKey)) {
            this.add.image(x, y - 20, artKey).setDisplaySize(180, 180);
          }
        });
        this.load.start();
      } else {
        this.add.image(x, y - 20, artKey).setDisplaySize(180, 180);
      }
    }

    // Card name
    this.add.text(x, y - 120, cardData?.name || ghost?.name || '???', {
      fontSize: '16px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);

    // Ability name
    this.add.text(x, y + 100, cardData?.ability || '', {
      fontSize: '12px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#aaaacc',
    }).setOrigin(0.5);

    // HP number in corner
    this.add.text(x + 80, y - 120, `${ghost?.maxHp || '?'}`, {
      fontSize: '22px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
  }

  doRound() {
    if (!B || B.phase === 'over') return;
    this.roundNum++;

    const pg = activePlayerGhost();
    const eg = activeEnemyGhost();
    if (!pg || !eg) { this.endBattle(false); return; }

    // Roll dice using the real engine
    const pCount = 3 + (B.nextRoundMods?.playerExtraDice || 0);
    const eCount = 3 + (B.nextRoundMods?.enemyExtraDice || 0);
    const pDice = weightedRoll(pg, Math.min(pCount, B.nextRoundMods?.playerMaxDice || 99));
    const eDice = weightedRoll(eg, Math.min(eCount, B.nextRoundMods?.enemyMaxDice || 99));

    // Classify rolls using the real engine
    const pResult = classifyDice(pDice);
    const eResult = classifyDice(eDice);

    // Display dice
    this.playerDiceText.setText(`[ ${pDice.join('  ')} ]`);
    this.enemyDiceText.setText(`[ ${eDice.join('  ')} ]`);

    // Determine winner and apply damage
    let log = `R${this.roundNum}: [${pDice}] ${pResult.type} vs [${eDice}] ${eResult.type}`;

    const pWins = pResult.tier > eResult.tier || (pResult.tier === eResult.tier && pResult.highDie > eResult.highDie);
    const eWins = eResult.tier > pResult.tier || (eResult.tier === pResult.tier && eResult.highDie > pResult.highDie);

    if (pWins) {
      const dmg = Math.max(1, pResult.tier);
      eg.hp = Math.max(0, eg.hp - dmg);
      log += ` — ${dmg} damage to ${eg.name}!`;
      this.cameras.main.shake(100, 0.005);
    } else if (eWins) {
      const dmg = Math.max(1, eResult.tier);
      pg.hp = Math.max(0, pg.hp - dmg);
      log += ` — ${dmg} damage to ${pg.name}!`;
      this.cameras.main.shake(150, 0.008);
    } else {
      log += ' — Tie!';
    }

    this.logText.setText(log);

    // Update HP
    this.playerHPText.setText(`${pg.name}  HP ${pg.hp}/${pg.maxHp}`);
    this.playerHPText.setColor(pg.hp <= pg.maxHp * 0.33 ? '#cc2211' : '#222222');
    this.enemyHPText.setText(`${eg.name}  HP ${eg.hp}/${eg.maxHp}`);
    this.enemyHPText.setColor(eg.hp <= eg.maxHp * 0.33 ? '#cc2211' : '#222222');

    // Reset round mods
    if (B.nextRoundMods) {
      B.nextRoundMods.playerExtraDice = 0;
      B.nextRoundMods.enemyExtraDice = 0;
    }

    // Check KO
    if (eg.hp <= 0) {
      eg.ko = true;
      const aliveEnemies = aliveBenchedEnemyGhosts();
      if (aliveEnemies.length > 0) {
        // Swap to next enemy
        const nextIdx = B.enemy.ghosts.indexOf(aliveEnemies[0]);
        B.enemy.activeIdx = nextIdx;
        this.time.delayedCall(1000, () => this.scene.restart(this.battleData));
      } else {
        this.time.delayedCall(500, () => this.endBattle(true));
      }
    } else if (pg.hp <= 0) {
      pg.ko = true;
      const alivePlayer = aliveBenchedPlayerGhosts();
      if (alivePlayer.length > 0) {
        const nextIdx = B.player.ghosts.indexOf(alivePlayer[0]);
        B.player.activeIdx = nextIdx;
        this.time.delayedCall(1000, () => this.scene.restart(this.battleData));
      } else {
        this.time.delayedCall(500, () => this.endBattle(false));
      }
    }
  }

  endBattle(won) {
    // Use the real endBattle logic from battle.js if available
    if (won) {
      if (!G.rep) G.rep = { battlesWon: 0 };
      G.rep.battlesWon++;
      G.coins += 10;
      G.xp += 1;

      if (G.rep.battlesWon === 5) {
        notify('Sideline slots unlocked! You can now bring 3 Spiritkin to battle!');
      }

      // Check level up
      const xpNeeded = G.level * 3;
      if (G.xp >= xpNeeded) {
        G.level++;
        G.xp -= xpNeeded;
        notify(`Level up! Now level ${G.level}!`);
      }

      checkAndNotifyTitles();
    }

    // Sync HP back to G.team
    if (B && B.player) {
      for (const ghost of B.player.ghosts) {
        if (ghost._teamIdx !== undefined && G.team[ghost._teamIdx]) {
          G.team[ghost._teamIdx].hp = ghost.hp;
          G.team[ghost._teamIdx].ko = ghost.ko;
        }
      }
    }

    G.inBattle = false;
    B = null;
    saveGame();

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(600, () => {
      this.scene.stop();
      this.scene.resume('WorldScene');
      this.scene.get('WorldScene').cameras.main.fadeIn(300);
    });
  }
}
