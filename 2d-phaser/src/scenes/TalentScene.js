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
    this._sideDyn = [];
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
    this._sideW = 180;
    this.add.rectangle(this._sideW / 2, H / 2 + 20, this._sideW, H - 40, 0x111122, 0.95)
      .setStrokeStyle(1, 0x222244).setDepth(1);

    // ── Respec button (permanent) ──
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

    // ── Build sidebar (dynamic — rebuilds when visibility changes) ──
    this._buildSidebar();

    // Select first visible tree
    const firstTree = Object.keys(CLASS_TREES).find(k => isTreeVisible(k));
    if (firstTree) this._selectTree(firstTree);

    this._updatePoints();
  }

  // ── Sidebar (dynamic rebuild) ────────────────────────

  _buildSidebar() {
    // Destroy previous sidebar objects
    this._sideDyn.forEach(o => o.destroy());
    this._sideDyn = [];
    this._sidebarTabs = [];

    const treeIds = Object.keys(CLASS_TREES);
    const tabH = 36;
    const gap = 3;
    let y = 52;

    for (const treeId of treeIds) {
      const tree = CLASS_TREES[treeId];
      const visible = isTreeVisible(treeId);
      const isSubTree = !!tree.requiresTree;
      const isHidden = !!tree.hidden;

      // Determine display
      let displayName, displayColor, indent;
      if (isHidden && !visible) {
        displayName = '???';
        displayColor = '#444444';
        indent = 0;
      } else if (isSubTree && !visible) {
        // Locked sub-tree — show name but greyed with lock hint
        displayName = tree.name;
        displayColor = '#333344';
        indent = 16;
      } else {
        displayName = tree.name;
        displayColor = tree.color;
        indent = isSubTree ? 16 : 0;
      }

      const bg = this.add.rectangle(this._sideW / 2, y, this._sideW - 12, tabH, 0x1a1a2e, 0.8)
        .setStrokeStyle(1, 0x333355).setDepth(2);
      this._sideDyn.push(bg);

      if (visible) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => this._selectTree(treeId));
        bg.on('pointerover', () => { if (this._selectedTree !== treeId) bg.setFillStyle(0x222244); });
        bg.on('pointerout', () => { if (this._selectedTree !== treeId) bg.setFillStyle(0x1a1a2e); });
      } else if (isSubTree) {
        // Show "requires X" on hover via tooltip
        bg.setInteractive();
        bg.on('pointerover', () => {
          const parentName = CLASS_TREES[tree.requiresTree] ? CLASS_TREES[tree.requiresTree].name : tree.requiresTree;
          this._tooltipName.setText(tree.name + ' (LOCKED)');
          this._tooltipDesc.setText('Requires ' + parentName + ' mastery to unlock');
          this._tooltipRank.setText('');
          this._tooltipHint.setText('');
        });
        bg.on('pointerout', () => this._clearTooltip());
      }

      const label = this.add.text(10 + indent, y - 6, displayName, {
        fontSize: isSubTree ? '10px' : '12px',
        fontFamily: 'Georgia, serif', fontStyle: 'bold', color: displayColor,
      }).setDepth(3);
      this._sideDyn.push(label);

      // Sub-tree connector line
      if (isSubTree) {
        const connector = this.add.text(6, y - 6, '└', {
          fontSize: '10px', fontFamily: 'monospace', color: '#333355',
        }).setDepth(3);
        this._sideDyn.push(connector);
      }

      const pts = this.add.text(this._sideW - 14, y + 4, '', {
        fontSize: '8px', fontFamily: 'monospace', color: '#666688',
      }).setOrigin(1, 0).setDepth(3);
      this._sideDyn.push(pts);

      this._sidebarTabs.push({ treeId, bg, label, pts, visible });

      y += tabH + gap;
    }
  }

  _refreshSidebar() {
    // Check if visibility changed
    let changed = false;
    for (const tab of this._sidebarTabs) {
      const nowVisible = isTreeVisible(tab.treeId);
      if (nowVisible !== tab.visible) { changed = true; break; }
    }
    if (changed) this._buildSidebar();
    this._updateSidebarPoints();
    this._highlightSidebarTab(this._selectedTree);
  }

  _updateSidebarPoints() {
    for (const tab of this._sidebarTabs) {
      const spent = getTreePointsSpent(tab.treeId);
      const tree = CLASS_TREES[tab.treeId];
      const maxTotal = getTreeMaxPoints(tab.treeId);
      if (tab.visible || (!tree.hidden && tree.requiresTree)) {
        if (spent > 0) {
          const isMastered = _isTreeFullyMaxed(tab.treeId);
          tab.pts.setText(isMastered ? 'MASTERED' : spent + '/' + maxTotal);
          tab.pts.setColor(isMastered ? '#88ff88' : '#666688');
        } else {
          tab.pts.setText('');
        }
      }
    }
  }

  _highlightSidebarTab(treeId) {
    for (const tab of this._sidebarTabs) {
      if (tab.treeId === treeId && tab.visible) {
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

  _afterChange(treeId) {
    this._renderTree(treeId);
    this._updatePoints();
    this._refreshSidebar();
  }

  _renderTree(treeId) {
    this._dyn.forEach(o => o.destroy());
    this._dyn = [];

    const tree = CLASS_TREES[treeId];
    if (!tree) return;

    const W = this.scale.width;
    const H = this.scale.height;
    const mainX = this._sideW + 10;
    const mainW = W - mainX - 10;

    // Tree name + description
    const descText = this.add.text(mainX + mainW / 2, 48, tree.desc, {
      fontSize: '11px', fontFamily: 'Georgia, serif', color: '#888899',
      wordWrap: { width: mainW - 20 },
    }).setOrigin(0.5, 0).setDepth(2);
    this._dyn.push(descText);

    // "Requires X mastery" label for sub-trees
    if (tree.requiresTree) {
      const parentName = CLASS_TREES[tree.requiresTree] ? CLASS_TREES[tree.requiresTree].name : '';
      const reqLabel = this.add.text(mainX + mainW / 2, 62, '(Requires ' + parentName + ' mastery)', {
        fontSize: '9px', fontFamily: 'monospace', color: '#dd9933',
      }).setOrigin(0.5, 0).setDepth(2);
      this._dyn.push(reqLabel);
    }

    // Branch headers
    const colW = mainW / 3;
    for (let b = 0; b < tree.branches.length; b++) {
      const cx = mainX + colW * b + colW / 2;
      const hdr = this.add.text(cx, 78, tree.branches[b], {
        fontSize: '12px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: tree.color,
      }).setOrigin(0.5).setDepth(2);
      this._dyn.push(hdr);
    }

    // Connection lines
    const gfx = this.add.graphics().setDepth(1);
    this._dyn.push(gfx);

    const nodeW = 130;
    const nodeH = 58;
    const tierStartY = 100;
    const tierGap = 80;
    const treeColor = Phaser.Display.Color.HexStringToColor(tree.color).color;

    const nodePositions = {};
    for (const talent of tree.talents) {
      const cx = mainX + colW * talent.branch + colW / 2;
      const cy = tierStartY + talent.tier * tierGap + nodeH / 2;
      nodePositions[talent.id] = { cx, cy };
    }

    // Draw lines
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

    // Draw nodes
    for (const talent of tree.talents) {
      const pos = nodePositions[talent.id];
      const rank = getTalentRank(treeId, talent.id);
      const canAlloc = canAllocateTalent(treeId, talent.id);
      const isMaxed = rank >= talent.maxRank;
      const isLocked = !canAlloc && rank === 0;

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

      const nameColor = isLocked ? '#555566' : '#ccccdd';
      const name = this.add.text(pos.cx, pos.cy - 12, talent.name, {
        fontSize: '10px', fontFamily: 'Georgia, serif', fontStyle: 'bold', color: nameColor,
      }).setOrigin(0.5).setDepth(3);
      this._dyn.push(name);

      const rankColor = isMaxed ? '#88ff88' : (rank > 0 ? '#aaddaa' : '#555566');
      const rankText = this.add.text(pos.cx, pos.cy + 8, rank + ' / ' + talent.maxRank, {
        fontSize: '10px', fontFamily: 'monospace', fontStyle: 'bold', color: rankColor,
      }).setOrigin(0.5).setDepth(3);
      this._dyn.push(rankText);

      if (!isMaxed && !isLocked) {
        const costText = this.add.text(pos.cx + nodeW / 2 - 4, pos.cy - nodeH / 2 + 4, talent.cost + 'pt', {
          fontSize: '8px', fontFamily: 'monospace', color: '#888899',
        }).setOrigin(1, 0).setDepth(3);
        this._dyn.push(costText);
      }

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
          if (deallocateTalent(treeId, talent.id)) {
            if (typeof GameAudio !== 'undefined') GameAudio.menuOpen();
            this._afterChange(treeId);
          }
        } else {
          if (allocateTalent(treeId, talent.id)) {
            if (typeof GameAudio !== 'undefined') GameAudio.collect();
            this._afterChange(treeId);
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
    const costLabel = talent.cost > 1 ? talent.cost + ' pts/rank' : '1 pt/rank';
    this._tooltipRank.setText(maxed ? 'MAXED' : 'Rank ' + rank + ' / ' + talent.maxRank + '  (' + costLabel + ')');
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
    this._afterChange(this._selectedTree);
  }

  // ── Close ────────────────────────────────────────────

  _close() {
    if (typeof GameAudio !== 'undefined') GameAudio.menuOpen();
    this.scene.stop();
    this.scene.resume('WorldScene');
  }
}
