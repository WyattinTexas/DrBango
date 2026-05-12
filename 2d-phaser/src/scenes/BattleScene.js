// ═══════════════════════════════════════════════════
// BATTLE SCENE — Matches the reference screenshot exactly
// Card art left/right, HP text, dice display, FIGHT/RUN
// ═══════════════════════════════════════════════════

class BattleScene extends Phaser.Scene {
  constructor() { super('BattleScene'); }

  init(data) { this.battleData = data; }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Off-white background ──
    this.cameras.main.setBackgroundColor('#EBE7E3');

    if (!B) { this.endBattle(false); return; }

    const pg = activePlayerGhost();
    const eg = activeEnemyGhost();
    if (!pg || !eg) { this.endBattle(false); return; }

    const pCard = ALL_CARDS.find(c => c.id === pg.id);
    const eCard = ALL_CARDS.find(c => c.id === eg.id);

    // ── Header ──
    const headerText = this.battleData.trainerName
      ? `${this.battleData.trainerName} challenges you!`
      : `Wild ${eg.name} appears!`;
    this.add.text(W / 2, 28, headerText, {
      fontSize: '24px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#222',
    }).setOrigin(0.5);

    // ═══════ PLAYER CARD (LEFT) ═══════
    const pX = W * 0.25, pY = H * 0.45;

    // Card shadow
    this.add.rectangle(pX + 3, pY + 3, 200, 280, 0x000000, 0.15).setStrokeStyle(0);
    // Card border
    this.add.rectangle(pX, pY, 204, 284, 0x333333);
    // Card bg
    this.add.rectangle(pX, pY, 200, 280, 0x1a1a2e);

    // Card art
    const pArtKey = `card_${pg.id}`;
    if (this.textures.exists(pArtKey)) {
      this.add.image(pX, pY, pArtKey).setDisplaySize(190, 270);
    } else {
      // Fallback: name text
      this.add.text(pX, pY, pg.name, { fontSize: '20px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
    }

    // ═══════ ENEMY CARD (RIGHT) ═══════
    const eX = W * 0.75, eY = H * 0.45;

    this.add.rectangle(eX + 3, eY + 3, 200, 280, 0x000000, 0.15);
    this.add.rectangle(eX, eY, 204, 284, 0x333333);
    this.add.rectangle(eX, eY, 200, 280, 0x1a2e1a);

    const eArtKey = `card_${eg.id}`;
    if (this.textures.exists(eArtKey)) {
      this.add.image(eX, eY, eArtKey).setDisplaySize(190, 270);
    } else {
      this.add.text(eX, eY, eg.name, { fontSize: '20px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5);
    }

    // ═══════ LABELS ═══════
    this.add.text(W / 2, H * 0.40, 'YOU', { fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#888' }).setOrigin(0.5);
    this.add.text(W / 2, H * 0.48, 'FOE', { fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#888' }).setOrigin(0.5);

    // ═══════ HP DISPLAYS ═══════

    // Player HP — below card, left-aligned
    this.playerHPText = this.add.text(pX, pY + 155, `${pg.name}  HP ${pg.hp}/${pg.maxHp}`, {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#222',
    }).setOrigin(0.5);

    // Player HP bar
    this.playerHPBarBg = this.add.rectangle(pX, pY + 172, 180, 8, 0x333333);
    this.playerHPBar = this.add.rectangle(pX - 90, pY + 172, 180, 6, 0x44aa44).setOrigin(0, 0.5);

    // Enemy name + HP text
    this.add.text(eX - 100, eY - 150, eg.name, {
      fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#222',
    }).setOrigin(0, 0.5);

    this.enemyHPText = this.add.text(eX + 100, eY - 150, `HP ${eg.hp}/${eg.maxHp}`, {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#222',
    }).setOrigin(1, 0.5);

    // Enemy ability
    if (eCard?.ability) {
      this.add.text(eX, eY - 132, eCard.ability, {
        fontSize: '11px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#666',
      }).setOrigin(0.5);
    }

    // Enemy HP bar (same style as player)
    this.enemyHPBarBg = this.add.rectangle(eX, eY - 118, 180, 8, 0x333333);
    this.enemyHPBar = this.add.rectangle(eX - 90, eY - 118, 180, 6, 0x44aa44).setOrigin(0, 0.5);

    // ═══════ DICE DISPLAY (colored squares, not text) ═══════
    this.playerDice = [];
    this.enemyDice = [];
    // Create 3 dice slots per side
    for (let i = 0; i < 3; i++) {
      // Player dice (blue)
      const pdBg = this.add.rectangle(pX - 50 + i * 44, H * 0.82, 38, 38, 0x3378cc)
        .setStrokeStyle(2, 0x2060a0);
      const pdTxt = this.add.text(pX - 50 + i * 44, H * 0.82, '', {
        fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#fff',
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true },
      }).setOrigin(0.5);
      this.playerDice.push({ bg: pdBg, txt: pdTxt });

      // Enemy dice (red)
      const edBg = this.add.rectangle(eX - 50 + i * 44, H * 0.82, 38, 38, 0xcc4444)
        .setStrokeStyle(2, 0xa03030);
      const edTxt = this.add.text(eX - 50 + i * 44, H * 0.82, '', {
        fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#fff',
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true },
      }).setOrigin(0.5);
      this.enemyDice.push({ bg: edBg, txt: edTxt });
    }

    // Dice labels
    this.add.text(pX, H * 0.76, 'PLAYER', { fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', color: '#3366aa' }).setOrigin(0.5);
    this.add.text(eX, H * 0.76, 'ENEMY', { fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', color: '#aa3333' }).setOrigin(0.5);

    // ═══════ BATTLE LOG ═══════
    this.logText = this.add.text(W / 2, H * 0.88, 'Press FIGHT to roll the dice!', {
      fontSize: '13px', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#555',
      wordWrap: { width: W * 0.7 },
    }).setOrigin(0.5);

    // ═══════ FIGHT BUTTON ═══════
    const fBg = this.add.rectangle(W * 0.72, H * 0.95, 120, 40, 0x222222)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x444444);
    this.add.text(W * 0.72, H * 0.95, 'FIGHT', {
      fontSize: '20px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#fff',
    }).setOrigin(0.5);
    fBg.on('pointerover', () => fBg.setFillStyle(0x444444));
    fBg.on('pointerout', () => fBg.setFillStyle(0x222222));
    fBg.on('pointerdown', () => this.doRound());

    // ═══════ RUN BUTTON ═══════
    const rBg = this.add.rectangle(W * 0.88, H * 0.95, 90, 40, 0x993322)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x664422);
    this.add.text(W * 0.88, H * 0.95, 'RUN', {
      fontSize: '20px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#fff',
    }).setOrigin(0.5);
    rBg.on('pointerover', () => rBg.setFillStyle(0xbb4433));
    rBg.on('pointerout', () => rBg.setFillStyle(0x993322));
    rBg.on('pointerdown', () => this.endBattle(false));

    // State
    this.roundNum = 0;
    this.pg = pg;
    this.eg = eg;
  }

  doRound() {
    if (!B || !this.pg || !this.eg) return;
    if (this.pg.hp <= 0 || this.eg.hp <= 0) return;
    this.roundNum++;

    const pDice = weightedRoll(this.pg, 3).sort((a,b) => a-b);
    const eDice = weightedRoll(this.eg, 3).sort((a,b) => a-b);
    const pRes = classify(pDice);
    const eRes = classify(eDice);
    const winner = compareRolls(pRes, eRes);

    // Show dice in colored squares
    for (let i = 0; i < 3; i++) {
      if (this.playerDice[i]) {
        this.playerDice[i].txt.setText(pDice[i] !== undefined ? pDice[i] : '');
        // Pop animation
        this.tweens.add({ targets: [this.playerDice[i].bg, this.playerDice[i].txt], scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true });
      }
      if (this.enemyDice[i]) {
        this.enemyDice[i].txt.setText(eDice[i] !== undefined ? eDice[i] : '');
        this.tweens.add({ targets: [this.enemyDice[i].bg, this.enemyDice[i].txt], scaleX: 1.3, scaleY: 1.3, duration: 80, yoyo: true, delay: 100 });
      }
    }

    let log = `R${this.roundNum}: ${pRes.type} vs ${eRes.type}`;

    if (winner === 'a') {
      const dmg = pRes.damage;
      this.eg.hp = Math.max(0, this.eg.hp - dmg);
      log += ` — ${dmg} dmg to ${this.eg.name}!`;
      this.cameras.main.shake(80, 0.004);
      this.showFloatingDmg(this.scale.width * 0.75, this.scale.height * 0.35, dmg, '#cc2211');
    } else if (winner === 'b') {
      const dmg = eRes.damage;
      this.pg.hp = Math.max(0, this.pg.hp - dmg);
      log += ` — ${dmg} dmg to ${this.pg.name}!`;
      this.cameras.main.shake(120, 0.006);
      this.showFloatingDmg(this.scale.width * 0.25, this.scale.height * 0.35, dmg, '#cc2211');
    } else {
      log += ' — Tie!';
    }

    this.logText.setText(log);
    this.updateHP();

    if (this.eg.hp <= 0) this.time.delayedCall(800, () => this.endBattle(true));
    else if (this.pg.hp <= 0) this.time.delayedCall(800, () => this.endBattle(false));
  }

  showFloatingDmg(x, y, dmg, color) {
    const txt = this.add.text(x, y, `-${dmg}`, {
      fontSize: '28px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: color,
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({ targets: txt, y: y - 60, alpha: 0, duration: 1000, onComplete: () => txt.destroy() });
  }

  updateHP() {
    // Player
    this.playerHPText.setText(`${this.pg.name}  HP ${this.pg.hp}/${this.pg.maxHp}`);
    const pPct = this.pg.hp / this.pg.maxHp;
    this.playerHPBar.width = Math.max(0, 180 * pPct);
    this.playerHPBar.setFillStyle(pPct > 0.66 ? 0x44aa44 : pPct > 0.33 ? 0xddaa22 : 0xcc2211);
    this.playerHPText.setColor(pPct <= 0.33 ? '#cc2211' : '#222');

    // Enemy
    this.enemyHPText.setText(`HP ${this.eg.hp}/${this.eg.maxHp}`);
    const ePct = this.eg.hp / this.eg.maxHp;
    this.enemyHPText.setColor(ePct <= 0.33 ? '#cc2211' : '#222');
    this.enemyHPBar.width = Math.max(0, 180 * ePct);
    this.enemyHPBar.setFillStyle(ePct > 0.66 ? 0x44aa44 : ePct > 0.33 ? 0xddaa22 : 0xcc2211);
  }

  endBattle(won) {
    if (won) {
      if (!G.rep) G.rep = { battlesWon: 0 };
      G.rep.battlesWon++;
      G.coins += 10;
      G.xp += 1;
      if (G.rep.battlesWon === 5) notify('Sideline slots unlocked!');
      const xpNeeded = G.level * 3;
      if (G.xp >= xpNeeded) { G.level++; G.xp -= xpNeeded; notify(`Level up! Now level ${G.level}!`); }
      checkAndNotifyTitles();

      // Mark trainer defeated
      if (B.isHostileNPC) markHostileNPCDefeated(B.isHostileNPC);
    }

    // Sync HP
    if (B?.player) {
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

    this.cameras.main.fadeOut(400);
    this.time.delayedCall(500, () => {
      this.scene.stop();
      this.scene.resume('WorldScene');
      this.scene.get('WorldScene').cameras.main.fadeIn(300);
    });
  }
}
