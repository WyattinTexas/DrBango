// ═══════════════════════════════════════════════════
// CRAFT SCENE — Overlay for crafting workbench
// Launched on top of WorldScene, doesn't pause world
// ═══════════════════════════════════════════════════

class CraftScene extends Phaser.Scene {
  constructor() { super('CraftScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Semi-transparent backdrop
    this.add.rectangle(W/2, H/2, W, H, 0x000000, 0.6).setInteractive();

    // Panel
    const panelW = 600, panelH = 420;
    this.add.rectangle(W/2, H/2, panelW + 4, panelH + 4, 0x444444);
    this.add.rectangle(W/2, H/2, panelW, panelH, 0xf0e8d8);

    // Title
    this.add.text(W/2, H/2 - panelH/2 + 24, 'CRAFTING WORKBENCH', {
      fontSize: '22px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#333',
    }).setOrigin(0.5);

    // Essences display
    this.add.text(W/2 - panelW/2 + 20, H/2 - panelH/2 + 60, 'Your Essences:', {
      fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#555',
    });

    const essCount = G.essences?.length || 0;
    this.add.text(W/2 - panelW/2 + 20, H/2 - panelH/2 + 82, essCount > 0
      ? G.essences.map(e => `${e.name} (Pot: ${e.potency})`).join('\n')
      : 'No essences collected yet.\nCollect spirit wisps to gather essences!', {
      fontSize: '12px', fontFamily: 'monospace', color: '#666',
      wordWrap: { width: panelW - 40 },
    });

    // Resources display
    this.add.text(W/2 - panelW/2 + 20, H/2 + 40, 'Resources:', {
      fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#555',
    });

    const resources = [
      { name: 'Ice Shards', val: G.iceShards || 0, color: '#3388cc' },
      { name: 'Sacred Fire', val: G.sacredFire || 0, color: '#ff6622' },
      { name: 'Healing Seeds', val: G.healingSeeds || 0, color: '#44aa44' },
      { name: 'Lucky Stones', val: G.luckyStones || 0, color: '#ccaa44' },
      { name: 'Surge', val: G.surge || 0, color: '#ffff44' },
      { name: 'Moonstone', val: G.moonstone || 0, color: '#aa66ff' },
    ];

    resources.forEach((r, i) => {
      const y = H/2 + 65 + i * 18;
      this.add.text(W/2 - panelW/2 + 30, y, `${r.name}: ${r.val}`, {
        fontSize: '12px', fontFamily: 'monospace', color: r.color,
      });
    });

    // Close button
    const closeBtn = this.add.rectangle(W/2 + panelW/2 - 20, H/2 - panelH/2 + 20, 30, 30, 0xcc3333)
      .setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x991111);
    this.add.text(W/2 + panelW/2 - 20, H/2 - panelH/2 + 20, 'X', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#fff',
    }).setOrigin(0.5);
    closeBtn.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume('WorldScene');
    });

    // ESC to close
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.stop();
      this.scene.resume('WorldScene');
    });
  }
}
