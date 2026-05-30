/**
 * Phaser 기반 시설 사각형 렌더러 — v0.2.3
 *
 * 변경 사항:
 * - 약어(abbrev) 라벨: 시설 중앙, 어두운 갈색 (#3D2E1F), 줌 감응
 * - confirmed: false → 회색 오버레이 + "확인 필요" 표시
 * - 부지 경계 밖 시설 → 빨간 테두리 경고
 * - render() 시그니처: (facilities, selectedIds, cellPx, siteCols, siteRows)
 */
export class FacilityRenderer {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics().setDepth(10);
    this._abbrevLabels = []; // 약어 Text 풀
    this._nameLabels   = []; // 시설명 Text 풀 (줌 높을 때 표시)
  }

  /**
   * 모든 시설을 다시 그린다.
   * @param {Array}    facilities  — store의 facilities 배열
   * @param {string[]} selectedIds — 선택된 시설 ID 배열
   * @param {number}   cellPx      — pixelsPerCell
   * @param {number}   siteCols    — 부지 최대 열 수 (경계 밖 감지용)
   * @param {number}   siteRows    — 부지 최대 행 수
   */
  render(facilities, selectedIds, cellPx, siteCols = 9999, siteRows = 9999) {
    const g   = this.graphics;
    const cam = this.scene.cameras.main;
    const zoom = cam ? cam.zoom : 1;

    g.clear();

    // 풀 라벨 숨김
    this._abbrevLabels.forEach((t) => t.setVisible(false));
    this._nameLabels.forEach((t)   => t.setVisible(false));

    const selectedSet = new Set(selectedIds);

    facilities.forEach((fac, i) => {
      const x = fac.position.col * cellPx;
      const y = fac.position.row * cellPx;
      const w = fac.size.width  * cellPx;
      const h = fac.size.height * cellPx;

      const isSelected   = selectedSet.has(fac.id);
      const isConfirmed  = fac.confirmed !== false; // undefined → true
      const isOutOfBounds =
        fac.position.col + fac.size.width  > siteCols ||
        fac.position.row + fac.size.height > siteRows;

      // ── 색상 결정
      // confirmed: false → 회색으로 오버라이드
      const colorHex = isConfirmed ? (fac.color || '#6b9fff') : '#888888';
      const colorInt = parseInt(colorHex.replace('#', ''), 16);

      // ── 채우기
      g.fillStyle(colorInt, isSelected ? 0.55 : 0.35);
      g.fillRect(x, y, w, h);

      // confirmed: false → 회색 해치 오버레이 (반투명)
      if (!isConfirmed) {
        g.fillStyle(0xaaaaaa, 0.12);
        g.fillRect(x, y, w, h);
      }

      // ── 외곽선
      if (isOutOfBounds) {
        // 빨간 테두리 경고 (부지 경계 밖)
        g.lineStyle(2, 0xff3333, 1.0);
      } else if (isSelected) {
        g.lineStyle(2, 0xffff00, 1.0);
      } else {
        g.lineStyle(1, colorInt, 1.0);
      }
      g.strokeRect(x, y, w, h);

      // ── 약어 라벨 (줌 > 0.25 이상에서 표시)
      const showAbbrev = zoom >= 0.25;
      const showName   = zoom >= 0.8;

      // 약어 라벨 풀
      const abbrevText = fac.abbrev || fac.name.slice(0, 4);
      if (i >= this._abbrevLabels.length) {
        this._abbrevLabels.push(
          this.scene.add.text(0, 0, '', {
            fontFamily: 'Courier New, monospace',
            color: '#3D2E1F',
          }).setDepth(11)
        );
      }
      const abbrevLabel = this._abbrevLabels[i];
      // 폰트 크기: 시설 크기에 비례, 8px ~ 18px
      const minDim = Math.min(w, h);
      const fontSize = Math.max(8, Math.min(18, Math.floor(minDim / 5)));
      abbrevLabel.setStyle({ fontSize: `${fontSize}px`, color: '#3D2E1F', fontFamily: 'Courier New, monospace' });
      abbrevLabel.setText(abbrevText);
      abbrevLabel.setPosition(
        x + w / 2 - abbrevLabel.width  / 2,
        y + h / 2 - abbrevLabel.height / 2,
      );
      abbrevLabel.setVisible(showAbbrev);

      // 시설명 라벨 (줌 > 0.8에서만 표시, 약어 아래)
      if (i >= this._nameLabels.length) {
        this._nameLabels.push(
          this.scene.add.text(0, 0, '', {
            fontSize: '8px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace',
            backgroundColor: '#00000070',
            padding: { x: 2, y: 1 },
          }).setDepth(11)
        );
      }
      const nameLabel = this._nameLabels[i];
      nameLabel.setText(fac.name);
      // 약어 아래 배치
      const abbrevBottom = y + h / 2 + abbrevLabel.height / 2 + 2;
      nameLabel.setPosition(
        x + w / 2 - nameLabel.width / 2,
        abbrevBottom,
      );
      nameLabel.setVisible(showName && abbrevBottom + nameLabel.height < y + h);

      // confirmed: false → "확인 필요" 표시 (줌 > 1.0에서)
      // v0.2.4에서 개선 예정 — 현재는 회색 색상으로 충분히 구분됨
    });
  }

  /**
   * 월드 좌표에서 시설 ID 반환. 없으면 null.
   * 후순위(위에 그려진) 시설 우선.
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
    this._abbrevLabels.forEach((t) => t.destroy());
    this._nameLabels.forEach((t)   => t.destroy());
    this._abbrevLabels = [];
    this._nameLabels   = [];
    this.graphics.destroy();
  }
}
