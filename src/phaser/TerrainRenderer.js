/**
 * Phaser 지형 렌더러 — v0.2.4
 *
 * 레이어: depth 5 (시설 depth 10 아래 → 지형이 배경처럼 깔림)
 * 지형 종류: river(강), road(도로), tree(나무)
 * 라벨: 줌 0.25 이상에서 좌상단에 표시
 */
import { TERRAIN_COLORS } from './config.js';

const TERRAIN_LABELS = { river: '강', road: '도로', tree: '나무' };

export class TerrainRenderer {
  constructor(scene) {
    this.scene    = scene;
    this.graphics = scene.add.graphics().setDepth(5);
    this._labels  = [];
  }

  /**
   * 모든 지형을 다시 그린다.
   * @param {Array}  terrains       — terrainStore의 terrains 배열
   * @param {string|null} selectedId — 선택된 지형 ID
   * @param {number} cellPx         — pixelsPerCell
   */
  render(terrains, selectedId, cellPx) {
    const g    = this.graphics;
    const cam  = this.scene.cameras.main;
    const zoom = cam ? cam.zoom : 1;

    g.clear();
    this._labels.forEach((t) => t.setVisible(false));

    terrains.forEach((t, i) => {
      const x = t.col   * cellPx;
      const y = t.row   * cellPx;
      const w = t.width  * cellPx;
      const h = t.height * cellPx;

      const colorInt   = TERRAIN_COLORS[t.type] || 0x888888;
      const isSelected = t.id === selectedId;

      // 채우기 (반투명)
      g.fillStyle(colorInt, isSelected ? 0.65 : 0.45);
      g.fillRect(x, y, w, h);

      // 외곽선
      if (isSelected) {
        g.lineStyle(2, 0xffff00, 1.0);
      } else {
        g.lineStyle(1, colorInt, 0.9);
      }
      g.strokeRect(x, y, w, h);

      // 라벨 (줌 > 0.25)
      if (zoom >= 0.25) {
        if (i >= this._labels.length) {
          this._labels.push(
            this.scene.add.text(0, 0, '', {
              fontSize: '8px',
              color: '#ffffff',
              fontFamily: 'Courier New, monospace',
              backgroundColor: '#00000070',
              padding: { x: 1, y: 1 },
            }).setDepth(6)
          );
        }
        const label = this._labels[i];
        label.setText(TERRAIN_LABELS[t.type] || t.type);
        label.setPosition(x + 2, y + 2);
        label.setVisible(true);
      }
    });
  }

  /**
   * 월드 좌표에서 지형 ID 반환. 없으면 null.
   * 후순위(나중에 배치된) 지형 우선.
   */
  hitTest(worldX, worldY, terrains, cellPx) {
    for (let i = terrains.length - 1; i >= 0; i--) {
      const t = terrains[i];
      const x = t.col   * cellPx;
      const y = t.row   * cellPx;
      const w = t.width  * cellPx;
      const h = t.height * cellPx;
      if (worldX >= x && worldX < x + w && worldY >= y && worldY < y + h) {
        return t.id;
      }
    }
    return null;
  }

  destroy() {
    this._labels.forEach((t) => t.destroy());
    this._labels = [];
    this.graphics.destroy();
  }
}
