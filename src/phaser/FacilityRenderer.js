/**
 * Phaser 기반 시설 사각형 렌더러 — v0.2.4
 *
 * 변경 사항:
 * - 약어(abbrev) 라벨: 시설 중앙, 어두운 갈색 (#3D2E1F), 줌 감응
 * - confirmed: false → 회색 오버레이 + "확인 필요" 표시
 * - 부지 경계 밖 시설 → 빨간 테두리 경고
 * - render() 시그니처: (facilities, selectedIds, cellPx, siteCols, siteRows, phaseViewEnabled)
 * - Phase 오버레이: phaseViewEnabled=true 시 Phase 2=주황 틴트, Phase 3=보라 틴트
 */
import { PHASE_COLORS } from './config.js';

/** 색상 명도 조절 — factor>1 밝게, <1 어둡게 (SimCity풍 베벨/그림자용) */
function shade(colorInt, factor) {
  const r = Math.max(0, Math.min(255, Math.round(((colorInt >> 16) & 0xff) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(((colorInt >> 8) & 0xff) * factor)));
  const b = Math.max(0, Math.min(255, Math.round((colorInt & 0xff) * factor)));
  return (r << 16) | (g << 8) | b;
}

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
  render(facilities, selectedIds, cellPx, siteCols = 9999, siteRows = 9999, phaseViewEnabled = false, view2_5d = false, facAnim = {}, pulse = 0) {
    const g   = this.graphics;
    const cam = this.scene.cameras.main;
    const zoom = cam ? cam.zoom : 1;

    g.clear();

    // 풀 라벨 숨김
    this._abbrevLabels.forEach((t) => t.setVisible(false));
    this._nameLabels.forEach((t)   => t.setVisible(false));

    const selectedSet = new Set(selectedIds);

    // 2.5D 그리기 순서 정렬 (그리기용 사본만 — hitTest 원본 배열은 절대 정렬 금지)
    const drawList = view2_5d
      ? [...facilities].sort((a, b) =>
          (a.position.row + a.position.col) - (b.position.row + b.position.col))
      : facilities;

    drawList.forEach((fac, i) => {
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
      const colorHex = isConfirmed ? (fac.color || '#6b9fff') : '#888888';
      const colorInt = parseInt(colorHex.replace('#', ''), 16);

      // 페이드인 alpha 배율 (0~1, 애니 없으면 1.0)
      const a = facAnim[fac.id] !== undefined ? facAnim[fac.id] : 1;

      // 2.5D 높이 오프셋 (평면일 때 lift=0 → yDraw === y, 기존 경로와 동일)
      const lift  = view2_5d ? Math.min(w, h) * 0.4 : 0;
      const yDraw = y - lift;

      // ── 정면(어두운 톤) — 2.5D 전용
      if (view2_5d) {
        const rCh = Math.floor(((colorInt >> 16) & 0xff) * 0.6);
        const gCh = Math.floor(((colorInt >>  8) & 0xff) * 0.6);
        const bCh = Math.floor(( colorInt        & 0xff) * 0.6);
        const darkerInt = (rCh << 16) | (gCh << 8) | bCh;
        g.fillStyle(darkerInt, (isSelected ? 0.7 : 0.55) * a);
        g.fillRect(x, y + h - lift, w, lift);
      }

      // (v0.5.1 — 그림자 제거: SimCity풍 드롭 섀도가 과대해 보여 삭제. 베벨·외곽선은 유지)

      // ── 윗면(평면일 때는 전체면) 채우기 — 솔리드 타일
      g.fillStyle(colorInt, (isSelected ? 0.72 : 0.58) * a);
      g.fillRect(x, yDraw, w, h);

      // ── 입체 베벨: 상단 하이라이트 + 하단 음영 (소프트 셰이딩)
      if (!view2_5d && Math.min(w, h) > 6) {
        const band = Math.max(1.5, Math.min(w, h) * 0.16);
        g.fillStyle(shade(colorInt, 1.35), 0.30 * a);   // 위 하이라이트
        g.fillRect(x, yDraw, w, band);
        g.fillStyle(shade(colorInt, 0.55), 0.30 * a);   // 아래 음영
        g.fillRect(x, yDraw + h - band, w, band);
      }

      // confirmed: false → 회색 해치 오버레이
      if (!isConfirmed) {
        g.fillStyle(0xaaaaaa, 0.18 * a);
        g.fillRect(x, yDraw, w, h);
      }

      // ── 외곽선 (윗면 기준, 선택 시 펄스)
      if (isOutOfBounds) {
        g.lineStyle(2, 0xff3333, a);
      } else if (isSelected) {
        g.lineStyle(2.5, 0xffff00, (0.5 + 0.5 * pulse) * a);
      } else {
        g.lineStyle(1.25, shade(colorInt, 0.7), 0.95 * a);
      }
      g.strokeRect(x, yDraw, w, h);

      // ── 라벨 (줌 감응, 윗면 중앙 기준)
      const showAbbrev = zoom >= 0.25;
      const showName   = zoom >= 0.8;

      const abbrevText = fac.abbrev || fac.name.slice(0, 4);
      if (i >= this._abbrevLabels.length) {
        this._abbrevLabels.push(
          this.scene.add.text(0, 0, '', {
            fontFamily: 'Courier New, monospace',
            color: '#ffffff',
          }).setDepth(11).setResolution(4)
        );
      }
      const abbrevLabel = this._abbrevLabels[i];
      const minDim = Math.min(w, h);
      // v0.5.0(feature 2) — 더 크고 진하게: minDim/4, bold + 외곽선으로 가독성↑
      const fontSize = Math.max(10, Math.min(24, Math.floor(minDim / 4)));
      abbrevLabel.setStyle({
        fontSize: `${fontSize}px`,
        color: '#ffffff',
        fontFamily: 'Courier New, monospace',
        fontStyle: 'bold',
        stroke: '#1a1208',
        strokeThickness: Math.max(2, Math.floor(fontSize / 6)),
      });
      abbrevLabel.setText(abbrevText);
      abbrevLabel.setPosition(
        x + w / 2 - abbrevLabel.width  / 2,
        yDraw + h / 2 - abbrevLabel.height / 2,
      );
      abbrevLabel.setVisible(showAbbrev);

      if (i >= this._nameLabels.length) {
        this._nameLabels.push(
          this.scene.add.text(0, 0, '', {
            fontSize: '8px',
            color: '#ffffff',
            fontFamily: 'Courier New, monospace',
            backgroundColor: '#00000070',
            padding: { x: 2, y: 1 },
          }).setDepth(11).setResolution(4)
        );
      }
      const nameLabel = this._nameLabels[i];
      nameLabel.setText(fac.name);
      const abbrevBottom = yDraw + h / 2 + abbrevLabel.height / 2 + 2;
      nameLabel.setPosition(
        x + w / 2 - nameLabel.width / 2,
        abbrevBottom,
      );
      nameLabel.setVisible(showName && abbrevBottom + nameLabel.height < yDraw + h);

      // confidence 시각화
      if (fac.confidence === '낮음') {
        g.lineStyle(1, 0xff9900, 0.9 * a);
        g.strokeRect(x + 2, yDraw + 2, w - 4, h - 4);
      }

      // Phase 오버레이 (윗면 기준)
      if (phaseViewEnabled && fac.phase && fac.phase > 1) {
        const phaseColor = PHASE_COLORS[fac.phase];
        if (phaseColor != null) {
          g.fillStyle(phaseColor, 0.28 * a);
          g.fillRect(x, yDraw, w, h);
          g.fillStyle(phaseColor, 0.8 * a);
          g.fillRect(x + w - 8, yDraw, 8, 8);
        }
      }
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
