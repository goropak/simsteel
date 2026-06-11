/**
 * 고스트(비교) 레이어 렌더러 — v0.4.2 (feature 5)
 *
 * 저장된 레이아웃의 시설을 반투명 외곽선+옅은 채움으로 그린다.
 * depth 8 — 지형(5) 위, 활성 시설(10) 아래. hitTest 없음(읽기전용).
 * 라벨은 줌이 충분할 때만 표시(고스트 식별용 약어).
 */
export class GhostRenderer {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics().setDepth(8);
    this._labels = []; // 약어 Text 풀
  }

  /**
   * @param {Array<{ id, name, colorInt, facilities }>} ghostLayouts
   * @param {number} cellPx
   * @param {number} opacity  채움 alpha (외곽선은 *1.6)
   */
  render(ghostLayouts, cellPx, opacity = 0.3) {
    const g = this.graphics;
    g.clear();
    this._labels.forEach((t) => t.setVisible(false));

    const cam = this.scene.cameras.main;
    const zoom = cam ? cam.zoom : 1;
    const showLabel = zoom >= 0.4;

    let li = 0; // 라벨 풀 인덱스
    for (const layout of ghostLayouts) {
      const colorInt = layout.colorInt;
      const lineAlpha = Math.min(0.9, opacity * 1.8);
      for (const fac of layout.facilities) {
        if (!fac?.position || !fac?.size) continue;
        const x = fac.position.col * cellPx;
        const y = fac.position.row * cellPx;
        const w = fac.size.width  * cellPx;
        const h = fac.size.height * cellPx;

        g.fillStyle(colorInt, opacity * 0.5);
        g.fillRect(x, y, w, h);
        // 점선 느낌의 얇은 외곽선 (고스트 = 비편집 표시)
        g.lineStyle(1.5, colorInt, lineAlpha);
        g.strokeRect(x, y, w, h);

        if (showLabel) {
          const txt = fac.abbrev || (fac.name ? fac.name.slice(0, 4) : '');
          if (txt) {
            if (li >= this._labels.length) {
              this._labels.push(
                this.scene.add.text(0, 0, '', {
                  fontFamily: 'Courier New, monospace',
                }).setDepth(9).setResolution(4)
              );
            }
            const label = this._labels[li++];
            const minDim = Math.min(w, h);
            const fontSize = Math.max(7, Math.min(14, Math.floor(minDim / 6)));
            const hexColor = '#' + colorInt.toString(16).padStart(6, '0');
            label.setStyle({ fontSize: `${fontSize}px`, color: hexColor, fontFamily: 'Courier New, monospace' });
            label.setText(txt);
            label.setPosition(x + w / 2 - label.width / 2, y + h / 2 - label.height / 2);
            label.setAlpha(Math.min(1, lineAlpha + 0.2));
            label.setVisible(true);
          }
        }
      }
    }
  }

  clear() {
    this.graphics.clear();
    this._labels.forEach((t) => t.setVisible(false));
  }

  destroy() {
    this._labels.forEach((t) => t.destroy());
    this._labels = [];
    this.graphics.destroy();
  }
}
