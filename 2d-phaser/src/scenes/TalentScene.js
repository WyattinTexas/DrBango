// ══════════════════════════════════════════════════════════
//  TALENT SCENE — WoW-style talent calculator
//  Full-screen overlay, launched from WorldScene (Y key)
// ══════════════════════════════════════════════════════════

class TalentScene extends Phaser.Scene {
  constructor() { super('TalentScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this._dyn = [];
    this._selectedTree = null;

    // Disable right-click context menu
    this.input.mouse.disableContextMenu();

    // ── Full-screen dark backdrop ──
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.9).setDepth(0);

    // ── Title bar ──
    this.add.rectangle(W / 2, 20, W, 40, 0x0a0a1a, 0.95).setDepth(1);
    this.add.text(16, 12, 'TALENT CALCULATOR', {
      fontSize: '16px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#ffdd44',
    }).setDepth(2);

    // Close button
    const closeBtn = this.add.rectangle(W - 24, 20, 36, 28, 0x442222)
      .setStrokeStyle(1, 0x663333).setDepth(2)
      .setInteractive({ useHandCursor: true });
    this.add.text(W - 24, 20, 'X', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ff6666',
    }).setOrigin(0.5).setDepth(3);
    closeBtn.on('pointerdown', () => this._close());
    closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x663333));
    closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x442222));

    // ── Points display (updated on render) ──
    this._pointsText = this.add.text(W - 60, 12, '', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', color: '#88ffaa',
    }).setOrigin(1, 0).setDepth(2);

    // ── ESC to close ──
    this.input.keyboard.on('keydown-ESC', () => this._close());

    // ── Left sidebar background ──
    this._sideW = 170;
    this.add.rectangle(this._sideW / 2, H / 2 + 20, this._sideW, H - 40, 0x111122, 0.95)
      .setStrokeStyle(1, 0x222244).setDepth(1);

    // ── Sidebar tabs ──
    this._buildSidebar();

    // ── Tooltip area at bottom ──
    this._tooltipName = this.add.text(this._sideW + 20, H - 80, '', {
      fontSize: '14px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: '#ffdd44',
    }).setDepth(3);
    this._tooltipDesc = this.add.text(this._sideW + 20, H - 60, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#aaaacc',
      wordWrap: { width: W - this._sideW - 40 },
    }).setDepth(3);
    this._tooltipRank = this.add.text(W - 60, H - 80, '', {
      fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', color: '#88ff88',
    }).setOrigin(1, 0).setDepth(3);
    this._tooltipHint = this.add.text(this._sideW + 20, H - 40, 'Click to allocate  |  Shift+Click to remove', {
      fontSize: '9px', fontFamily: 'monospace', color: '#555577',
    }).setDepth(3);

    // Select first visible tree
    const firstTree = Object.keys(CLASS_TREES).find(k => isTreeVisible(k));
    if (firstTree) this._selectTree(firstTree);

    this._updatePoints();
  }

  // ── Sidebar ──────────────────────────────────────────

  _buildSidebar() {
    const H = this.scale.height;
    const treeIds = Object.keys(CLASS_TREES);
    const tabH = 42;
    const startY = 56;
    this._sidebarTabs = [];

    treeIds.forEach((treeId, i) => {
      const tree = CLASS_TREES[treeId];
      const y = startY + i * (tabH + 4);
      const visible = isTreeVisible(treeId);
      const displayName = visible ? tree.name : '???';
      const displayColor = visible ? tree.color : '#444444';

      const bg = this.add.rectangle(this._sideW / 2, y, this._sideW - 12, tabH, 0x1a1a2e, 0.8)
        .setStrokeStyle(1, 0x333355).setDepth(2);

      if (visible) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => this._selectTree(treeId));
        bg.on('pointerover', () => { if (this._selectedTree !== treeId) bg.setFillStyle(0x222244); });
        bg.on('pointerout', () => { if (this._selectedTree !== treeId) bg.setFillStyle(0x1a1a2e); });
      }

      const label = this.add.text(14, y - 8, displayName, {
        fontSize: '12px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: displayColor,
      }).setDepth(3);

      const pts = this.add.text(this._sideW - 14, y + 6, '', {
        fontSize: '9px', fontFamily: 'monospace', color: '#666688',
      }).setOrigin(1, 0).setDepth(3);

      this._sidebarTabs.push({ treeId, bg, label, pts, visible });
    });

    // Respec button at bottom of sidebar
    const respecY = H - 50;
    const respecBg = this.add.rectangle(this._sideW / 2, respecY, this._sideW - 12, 32, 0x442222, 0.9)
      .setStrokeStyle(1, 0x663333).setDepth(2)
      .setInteractive({ useHandCursor: true });
    this.add.text(this._sideW / 2, respecY, 'RESPEC TREE', {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ff8888',
    }).setOrigin(0.5).setDepth(3);
    respecBg.on('pointerdown', () => this._respecCurrent());
    respecBg.on('pointerover', () => respecBg.setFillStyle(0x553333));
    respecBg.on('pointerout', () => respecBg.setFillStyle(0x442222));
  }

  _updateSidebarPoints() {
    for (const tab of this._sidebarTabs) {
      if (tab.visible) {
        const spent = getTreePointsSpent(tab.treeId);
        tab.pts.setText(spent > 0 ? spent + ' pts' : '');
      }
    }
  }

  _highlightSidebarTab(treeId) {
    for (const tab of this._sidebarTabs) {
      if (tab.treeId === treeId) {
        tab.bg.setFillStyle(0x333366);
        tab.bg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(CLASS_TREES[treeId].color).color);
      } else {
        tab.bg.setFillStyle(0x1a1a2e);
        tab.bg.setStrokeStyle(1, 0x333355);
      }
    }
  }

  // ── Tree Selection & Rendering ───────────────────────

  _selectTree(treeId) {
    this._selectedTree = treeId;
    this._highlightSidebarTab(treeId);
    this._clearTooltip();
    this._renderTree(treeId);
    this._updatePoints();
    this._updateSidebarPoints();
  }

  _renderTree(treeId) {
    // Clear previous dynamic objects
    this._dyn.forEach(o => o.destroy());
    this._dyn = [];

    const tree = CLASS_TREES[treeId];
    if (!tree) return;

    const W = this.scale.width;
    const H = this.scale.height;
    const mainX = this._sideW + 10;
    const mainW = W - mainX - 10;

    // Tree description
    const descText = this.add.text(mainX + mainW / 2, 50, tree.desc, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#888899',
      wordWrap: { width: mainW - 20 },
    }).setOrigin(0.5, 0).setDepth(2);
    this._dyn.push(descText);

    // Branch headers
    const colW = mainW / 3;
    for (let b = 0; b < tree.branches.length; b++) {
      const cx = mainX + colW * b + colW / 2;
      const hdr = this.add.text(cx, 72, tree.branches[b], {
        fontSize: '12px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: tree.color,
      }).setOrigin(0.5).setDepth(2);
      this._dyn.push(hdr);
    }

    // Connection lines graphics
    const gfx = this.add.graphics().setDepth(1);
    this._dyn.push(gfx);

    // Node dimensions
    const nodeW = 130;
    const nodeH = 58;
    const tierStartY = 96;
    const tierGap = 80;
    const treeColor = Phaser.Display.Color.HexStringToColor(tree.color).color;

    // Pre-compute node positions by talent ID for line drawing
    const nodePositions = {};

    for (const talent of tree.talents) {
      const cx = mainX + colW * talent.branch + colW / 2;
      const cy = tierStartY + talent.tier * tierGap + nodeH / 2;
      nodePositions[talent.id] = { cx, cy };
    }

    // Draw connection lines first
    for (const talent of tree.talents) {
      if (talent.prereq && nodePositions[talent.prereq]) {
        const parent = nodePositions[talent.prereq];
        const child = nodePositions[talent.id];
        const prereqMaxed = getTalentRank(treeId, talent.prereq) >= _findTalent(treeId, talent.prereq).maxRank;
        const lineColor = prereqMaxed ? treeColor : 0x333344;
        const lineAlpha = prereqMaxed ? 0.7 : 0.3;
        gfx.lineStyle(2, lineColor, lineAlpha);
        gfx.beginPath();
        gfx.moveTo(parent.cx, parent.cy + nodeH / 2);
        gfx.lineTo(child.cx, child.cy - nodeH / 2);
        gfx.strokePath();
      }
    }

    // Draw talent nodes
    for (const talent of tree.talents) {
      const pos = nodePositions[talent.id];
      const rank = getTalentRank(treeId, talent.id);
      const canAlloc = canAllocateTalent(treeId, talent.id);
      const canDealloc = canDeallocateTalent(treeId, talent.id);
      const isMaxed = rank >= talent.maxRank;
      const isLocked = !canAlloc && rank === 0;

      // Node background color
      let bgColor, strokeColor, bgAlpha;
      if (isMaxed) {
        bgColor = treeColor; bgAlpha = 0.25; strokeColor = treeColor;
      } else if (rank > 0) {
        bgColor = 0x223344; bgAlpha = 0.9; strokeColor = treeColor;
      } else if (canAlloc) {
        bgColor = 0x222244; bgAlpha = 0.9; strokeColor = 0x4488aa;
      } else {
        bgColor = 0x151520; bgAlpha = 0.6; strokeColor = 0x222233;
      }

      const bg = this.add.rectangle(pos.cx, pos.cy, nodeW, nodeH, bgColor, bgAlpha)
        .setStrokeStyle(isMaxed ? 2 : 1, strokeColor).setDepth(2)
        .setInteractive({ useHandCursor: !isLocked });
      this._dyn.push(bg);

      // Talent name
      const nameColor = isLocked ? '#555566' : '#ccccdd';
      const name = this.add.text(pos.cx, pos.cy - 12, talent.name, {
        fontSize: '10px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: nameColor,
      }).setOrigin(0.5).setDepth(3);
      this._dyn.push(name);

      // Rank display
      const rankColor = isMaxed ? '#88ff88' : (rank > 0 ? '#aaddaa' : '#555566');
      const rankText = this.add.text(pos.cx, pos.cy + 8, rank + ' / ' + talent.maxRank, {
        fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', color: rankColor,
      }).setOrigin(0.5).setDepth(3);
      this._dyn.push(rankText);

      // Cost indicator
      if (!isMaxed && !isLocked) {
        const costText = this.add.text(pos.cx + nodeW / 2 - 4, pos.cy - nodeH / 2 + 4, talent.cost + 'pt', {
          fontSize: '8px', fontFamily: 'monospace', color: '#888899',
        }).setOrigin(1, 0).setDepth(3);
        this._dyn.push(costText);
      }

      // ── Interaction ──
      bg.on('pointerover', () => {
        if (!isLocked) bg.setStrokeStyle(2, 0xffffff);
        this._showTooltip(treeId, talent);
      });
      bg.on('pointerout', () => {
        bg.setStrokeStyle(isMaxed ? 2 : 1, strokeColor);
        this._clearTooltip();
      });
      bg.on('pointerdown', (pointer) => {
        if (pointer.event.shiftKey || pointer.rightButtonDown()) {
          // Deallocate
          if (deallocateTalent(treeId, talent.id)) {
            if (typeof GameAudio !== 'undefined') GameAudio.menuOpen();
            this._renderTree(treeId);
            this._updatePoints();
            this._updateSidebarPoints();
          }
        } else {
          // Allocate
          if (allocateTalent(treeId, talent.id)) {
            if (typeof GameAudio !== 'undefined') GameAudio.collect();
            this._renderTree(treeId);
            this._updatePoints();
            this._updateSidebarPoints();
          }
        }
      });
    }
  }

  // ── Tooltip ──────────────────────────────────────────

  _showTooltip(treeId, talent) {
    const rank = getTalentRank(treeId, talent.id);
    this._tooltipName.setText(talent.name);
    this._tooltipDesc.setText(talent.desc);
    const maxed = rank >= talent.maxRank;
    this._tooltipRank.setText(maxed ? 'MAXED' : 'Rank ' + rank + ' / ' + talent.maxRank + '  (Cost: ' + talent.cost + ')');
    this._tooltipRank.setColor(maxed ? '#88ff88' : '#aaddaa');
    if (talent.prereq) {
      const prereqTalent = _findTalent(treeId, talent.prereq);
      const prereqName = prereqTalent ? prereqTalent.name : talent.prereq;
      this._tooltipHint.setText('Requires: ' + prereqName + ' (max rank)  |  Click = allocate  |  Shift+Click = remove');
    } else {
      this._tooltipHint.setText('Click to allocate  |  Shift+Click to remove');
    }
  }

  _clearTooltip() {
    this._tooltipName.setText('');
    this._tooltipDesc.setText('');
    this._tooltipRank.setText('');
    this._tooltipHint.setText('Hover a talent for details');
  }

  // ── Points Display ───────────────────────────────────

  _updatePoints() {
    const remaining = getTalentPointsRemaining();
    const total = getTalentPointsTotal();
    const spent = getTalentPointsSpent();
    this._pointsText.setText(remaining + ' / ' + total + ' pts');
    this._pointsText.setColor(remaining > 0 ? '#88ffaa' : '#ff8888');
  }

  // ── Respec ───────────────────────────────────────────

  _respecCurrent() {
    if (!this._selectedTree) return;
    const spent = getTreePointsSpent(this._selectedTree);
    if (spent === 0) return;
    respecTree(this._selectedTree);
    if (typeof GameAudio !== 'undefined') GameAudio.hurt();
    this._renderTree(this._selectedTree);
    this._updatePoints();
    this._updateSidebarPoints();
  }

  // ── Close ────────────────────────────────────────────

  _close() {
    if (typeof GameAudio !== 'undefined') GameAudio.menuOpen();
    this.scene.stop();
    this.scene.resume('WorldScene');
  }
}
