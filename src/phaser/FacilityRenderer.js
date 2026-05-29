/**
 * Phaser 기반 시설 사각형 렌더러.
 *
 * Graphics 1개 + Text 오브젝트 풀로 모든 시설을 그린다.
 * 시설 수가 바뀔 때마다 render()를 호출하면 전체를 다시 그린다.
 * (v0.2.2 단계 — 소수 시설 대상, 성능 최적화는 v0.2.3+)
 */
export class FacilityRenderer {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics().setDepth(10);
    this._labels = []; // Text 오브젝트 풀
  }

  /**
   * 모든 시설을 다시 그린다.
   * @param {Array}    facilities  — store의 facilities 배열
   * @param {string[]} selectedIds — 선택된 시설 ID 배열 (다중 선택)
   * @param {number}   cellPx      — pixelsPerCell
   */
  render(facilities, selectedIds, cellPx) {
    const g = this.graphics;
    g.clear();

    // 풀의 기존 라벨을 모두 숨긴다
    this._labels.forEach((t) => t.setVisible(false));

    const selectedSet = new Set(selectedIds);

    facilities.forEach((fac, i) => {
      const x = fac.position.col * cellPx;
      const y = fac.position.row * cellPx;
      const w = fac.size.width  * cellPx;
      const h = fac.size.height * cellPx;

      const colorInt = parseInt((fac.color || '#6b9fff').replace('#', ''), 16);
      const isSelected = selectedSet.has(fac.id);

      // ── 채우기
      g.fillStyle(colorInt, isSelected ? 0.55 : 0.35);
      g.fillRect(x, y, w, h);

      // ── 외곽선 (선택 시 노란색 굵게)
      g.lineStyle(isSelected ? 2 : 1, isSelected ? 0xffff00 : colorInt, 1.0);
      g.strokeRect(x, y, w, h);

      // ── 라벨 (풀에서 꺼내거나 새로 생성)
      if (i >= this._labels.length) {
        this._labels.push(
          this.scene.add
            .text(0, 0, '', {
              fontSize: '10px',
              color: '#ffffff',
              fontFamily: 'Courier New, monospace',
              backgroundColor: '#00000070',
              padding: { x: 3, y: 2 },
            })
            .setDepth(11)
        );
      }
      const label = this._labels[i];
      label.setText(fac.name);
      // 중앙 정렬 (setText 후 width 재계산됨)
      label.setPosition(
        x + w / 2 - label.width  / 2,
        y + h / 2 - label.height / 2
      );
      label.setVisible(true);
    });
  }

  /**
   * 월드 좌표에서 시설 ID를 반환. 없으면 null.
   * 위에 그려진 시설(후순위)을 우선한다.
   */
  hitTest(worldX, worldY, facilities, cellPx) {
    for (let i = facilities.length - 1; i >= 0; i--) {
      const fac = facilities[i];
      const x = fac.position.col * cellPx;
      const y = fac.position.row * cellPx;
      const w = fac.size.width  * cellPx;
      const h = fac.size.height * cellPx;
      if (worldX >= x && worldX < x + w && worldY >= y && worldY < y + h) {
        return fac.id;
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
