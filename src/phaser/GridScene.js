import Phaser from 'phaser';
import { GRID_CONFIG, GRID_COLORS } from './config.js';
import { FacilityRenderer } from './FacilityRenderer.js';
import { useFacilitiesStore } from '../state/facilitiesStore.js';

/**
 * 타입별 배치 기본값 (Layer 1 출처: TEFR, M.N. Dastur & Company 2021)
 * v0.2.2: blast_furnace 1종. v0.2.3에서 나머지 추가.
 */
const FACILITY_DEFAULTS = {
  blast_furnace: {
    width: 20, height: 20,   // 셀 단위 (100m × 100m)
    color: '#ff6b6b',
    capacity: '5,350 m³',   // source: TEFR (DASTUR 2021)
    baseName: '고로',
  },
};

export class GridScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GridScene' });
    this.onCoordUpdate = null;
    this.onZoomUpdate  = null;

    this._drag       = { active: false, startX: 0, startY: 0, scrollX: 0, scrollY: 0 };
    this._facDrag    = { active: false, id: null, startWX: 0, startWY: 0,
                         startCol: 0, startRow: 0, lastCol: -1, lastRow: -1 };
    this._storeUnsub  = null;
    this._renderer    = null;
    this._cellPx      = 0;
    this._boundaryGfx = null;  // 부지 경계선 그래픽스 (동적 갱신)
  }

  create() {
    const {
      cellSize, pixelsPerCell,
      phase1Width, phase1Height,
      gridMajorEvery, gridLabelEvery,
      zoomMin, zoomMax,
    } = GRID_CONFIG;

    const cellPx = pixelsPerCell;
    this._cellPx = cellPx;

    // 캔버스 월드 크기는 넉넉하게 (부지보다 2배 큰 영역 할당)
    // 실제 부지 경계는 _boundaryGfx로 표시, 크기 변경 시 재그림
    const maxCells = 800;  // 최대 4,000m
    const worldW = maxCells * cellPx;
    const worldH = maxCells * cellPx;

    this.cameras.main.roundPixels = false;
    this.cameras.main.setBackgroundColor(GRID_COLORS.background);

    // ── 오프-사이트 오버레이 (부지 외부 어둡게) — 가장 아래
    this._outsideGfx = this.add.graphics().setDepth(0);

    // ── 격자선 ─────────────────────────────────────
    const g = this.add.graphics().setDepth(1);

    // 5m 격자 (thin)
    g.lineStyle(1, GRID_COLORS.gridThin, 0.6);
    for (let x = 0; x <= maxCells; x++) {
      if (x % gridMajorEvery === 0) continue;
      g.moveTo(x * cellPx, 0); g.lineTo(x * cellPx, worldH);
    }
    for (let y = 0; y <= maxCells; y++) {
      if (y % gridMajorEvery === 0) continue;
      g.moveTo(0, y * cellPx); g.lineTo(worldW, y * cellPx);
    }
    g.strokePath();

    // 50m 격자 (bold)
    g.lineStyle(1, GRID_COLORS.gridBold, 0.9);
    for (let x = 0; x <= maxCells; x += gridMajorEvery) {
      g.moveTo(x * cellPx, 0); g.lineTo(x * cellPx, worldH);
    }
    for (let y = 0; y <= maxCells; y += gridMajorEvery) {
      g.moveTo(0, y * cellPx); g.lineTo(worldW, y * cellPx);
    }
    g.strokePath();

    // 100m 좌표 라벨
    for (let x = 0; x <= maxCells; x += gridLabelEvery) {
      const mVal = x * cellSize;
      this.add.text(x * cellPx + 3, 3, `${mVal}m`, {
        fontSize: '9px', color: GRID_COLORS.labelText,
        fontFamily: 'Courier New, monospace',
      }).setDepth(2).setAlpha(0.7);
    }
    for (let y = gridLabelEvery; y <= maxCells; y += gridLabelEvery) {
      const mVal = y * cellSize;
      this.add.text(3, y * cellPx + 3, `${mVal}m`, {
        fontSize: '9px', color: GRID_COLORS.labelText,
        fontFamily: 'Courier New, monospace',
      }).setDepth(2).setAlpha(0.7);
    }

    // ── 부지 경계선 (동적 — store의 siteSize 반영) ─
    this._boundaryGfx = this.add.graphics().setDepth(3);
    this._drawBoundary();

    // ── 시설 렌더러 ─────────────────────────────────
    this._renderer = new FacilityRenderer(this);

    // ── Zustand 구독 ────────────────────────────────
    let prevSiteSize = useFacilitiesStore.getState().siteSize;
    this._storeUnsub = useFacilitiesStore.subscribe((state) => {
      if (this._renderer) {
        this._renderer.render(state.facilities, state.selectedIds, cellPx);
      }
      // 부지 크기 변경 시 경계선 재그림
      if (state.siteSize !== prevSiteSize) {
        prevSiteSize = state.siteSize;
        this._drawBoundary();
      }
      if (this.input && !this._drag.active) {
        this.input.setDefaultCursor(state.paletteSelectedTypeId ? 'crosshair' : 'default');
      }
    });
    const init = useFacilitiesStore.getState();
    this._renderer.render(init.facilities, init.selectedIds, cellPx);

    // ── 마우스 휠 줌 (5단계 공식 — getWorldPoint + preRender 앵커) ─
    // 출처: Phaser3 공식 예제 패턴 (Phaser 사전 학습 2026-05-30)
    // preRender(1) 호출이 결정적: 없으면 줌 후 재계산 좌표가 틀어짐
    // 이벤트 핸들러 안에서 단발성 scrollX/Y 조작은 정상 패턴 (update 루프 미결합)
    this.input.on('wheel', (pointer, _obj, _dx, deltaY) => {
      const cam    = this.cameras.main;
      const factor = deltaY > 0 ? 0.80 : 1.25;
      const toZoom = Phaser.Math.Clamp(cam.zoom * factor, zoomMin, zoomMax);
      if (toZoom === cam.zoom) return;

      // 1) 줌 전 커서의 월드 좌표
      const before = cam.getWorldPoint(pointer.x, pointer.y);

      // 2) 줌 적용
      cam.zoom = toZoom;

      // 3) ⭐ 카메라 매트릭스 강제 갱신 (4단계 재계산의 전제)
      cam.preRender(1);

      // 4) 줌 후 같은 스크린 좌표의 월드 좌표 재계산
      const after = cam.getWorldPoint(pointer.x, pointer.y);

      // 5) 차이만큼 scroll 보정 → 커서 아래 월드 좌표 고정
      cam.scrollX -= after.x - before.x;
      cam.scrollY -= after.y - before.y;

      if (this.onZoomUpdate) this.onZoomUpdate(cam.zoom);
    });

    // ── 포인터 다운 ─────────────────────────────────
    this.input.on('pointerdown', (pointer) => {
      const cam    = this.cameras.main;
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;
      const store  = useFacilitiesStore.getState();

      // 우클릭 → 항상 팬(드래그) 시작
      if (pointer.rightButtonDown()) {
        this._startDrag(pointer, cam);
        return;
      }

      if (!pointer.leftButtonDown()) return;

      // 배치 모드
      if (store.paletteSelectedTypeId) {
        this._placeFacility(worldX, worldY, cellPx);
        return;
      }

      // Cmd/Ctrl+클릭: 다중 선택 토글
      const isMulti = pointer.event.metaKey || pointer.event.ctrlKey;
      const hitId   = this._renderer.hitTest(worldX, worldY, store.facilities, cellPx);

      if (hitId) {
        store.selectFacility(hitId, isMulti);
        // Cmd+클릭은 선택만, 단일 클릭은 선택 + 드래그 준비
        if (!isMulti) {
          const fac = store.facilities.find((f) => f.id === hitId);
          if (fac) {
            this._facDrag.active   = true;
            this._facDrag.id       = hitId;
            this._facDrag.startWX  = worldX;
            this._facDrag.startWY  = worldY;
            this._facDrag.startCol = fac.position.col;
            this._facDrag.startRow = fac.position.row;
            this._facDrag.lastCol  = fac.position.col;
            this._facDrag.lastRow  = fac.position.row;
            this.input.setDefaultCursor('move');
          }
        }
        return;
      }

      // 빈 곳 좌클릭: 선택 해제 + 카메라 팬 시작
      if (!isMulti) store.clearSelection();
      this._startDrag(pointer, cam);
    });

    this.input.on('pointerup', () => {
      // 카메라 팬 종료
      this._drag.active = false;
      // 시설 드래그 종료
      this._facDrag.active = false;
      const paletteTypeId = useFacilitiesStore.getState().paletteSelectedTypeId;
      this.input.setDefaultCursor(paletteTypeId ? 'crosshair' : 'default');
    });

    // ── 포인터 이동: 시설 드래그 이동 / 카메라 팬 / 좌표 ─
    this.input.on('pointermove', (pointer) => {
      const cam = this.cameras.main;

      // 시설 드래그 이동 (셀 단위로 스냅)
      // pointer.worldX/Y 사용: 카메라 변환(zoom/pan) 자동 반영
      if (this._facDrag.active) {
        const wX   = pointer.worldX;
        const wY   = pointer.worldY;
        const dCol = Math.round((wX - this._facDrag.startWX) / cellPx);
        const dRow = Math.round((wY - this._facDrag.startWY) / cellPx);
        const newCol = Math.max(0, this._facDrag.startCol + dCol);
        const newRow = Math.max(0, this._facDrag.startRow + dRow);
        // 셀이 바뀔 때만 스토어 업데이트 (과도한 re-render 방지)
        if (newCol !== this._facDrag.lastCol || newRow !== this._facDrag.lastRow) {
          this._facDrag.lastCol = newCol;
          this._facDrag.lastRow = newRow;
          useFacilitiesStore.getState().updateFacility(this._facDrag.id, {
            position: { col: newCol, row: newRow },
          });
        }
      }

      // 카메라 팬
      if (this._drag.active) {
        cam.scrollX = this._drag.scrollX - (pointer.x - this._drag.startX) / cam.zoom;
        cam.scrollY = this._drag.scrollY - (pointer.y - this._drag.startY) / cam.zoom;
      }

      const cx = Math.max(0, Math.floor(pointer.worldX / cellPx));
      const cy = Math.max(0, Math.floor(pointer.worldY / cellPx));
      if (this.onCoordUpdate) {
        this.onCoordUpdate({ cellX: cx, cellY: cy, mX: cx * cellSize, mY: cy * cellSize });
      }
    });

    // ── 키보드 ──────────────────────────────────────

    // ESC: 배치 모드 해제
    this.input.keyboard.on('keydown-ESC', () => {
      useFacilitiesStore.getState().setPaletteSelection(null);
      this.input.setDefaultCursor('default');
    });

    // Delete / Backspace: 선택 시설 삭제
    const handleDelete = () => {
      const state = useFacilitiesStore.getState();
      if (state.selectedIds.length === 0) return;
      const msg = state.selectedIds.length === 1
        ? `'${state.facilities.find(f => f.id === state.selectedIds[0])?.name || '시설'}'을(를) 삭제하시겠습니까?`
        : `선택된 시설 ${state.selectedIds.length}개를 삭제하시겠습니까?`;
      if (window.confirm(msg)) state.deleteSelected();
    };
    this.input.keyboard.on('keydown-DELETE',    handleDelete);
    this.input.keyboard.on('keydown-BACKSPACE',  handleDelete);

    // Cmd+D / Ctrl+D: 복사
    this.input.keyboard.on('keydown-D', (event) => {
      if (!event.metaKey && !event.ctrlKey) return;
      event.preventDefault();
      const state = useFacilitiesStore.getState();
      if (state.selectedIds.length > 0) state.copySelected();
    });

    this.input.setDefaultCursor('default');

    // ── Scene 정리 ──────────────────────────────────
    this.events.on('destroy', () => {
      if (this._storeUnsub)  this._storeUnsub();
      if (this._renderer)    this._renderer.destroy();
      if (this._boundaryGfx) this._boundaryGfx.destroy();
      if (this._outsideGfx)  this._outsideGfx.destroy();
    });
  }

  // ── 헬퍼 ────────────────────────────────────────────────────────────

  /** 부지 경계선 + 외부 오버레이 그리기 */
  _drawBoundary() {
    const { siteSize } = useFacilitiesStore.getState();
    const { pixelsPerCell, cellSize } = GRID_CONFIG;
    const cellPx = pixelsPerCell;
    const siteW = (siteSize.widthM  / cellSize) * cellPx;
    const siteH = (siteSize.heightM / cellSize) * cellPx;
    const maxPx = 800 * cellPx;

    // 외부 오버레이: 부지 밖을 어둡게
    const og = this._outsideGfx;
    og.clear();
    og.fillStyle(GRID_COLORS.boundaryOut, 0.35);
    // 위
    og.fillRect(0, 0, maxPx, 0);
    // 오른쪽
    og.fillRect(siteW, 0, maxPx - siteW, siteH);
    // 아래
    og.fillRect(0, siteH, maxPx, maxPx - siteH);

    // 경계선
    const bg = this._boundaryGfx;
    bg.clear();
    bg.lineStyle(3, GRID_COLORS.boundary, 1.0);
    bg.strokeRect(0, 0, siteW, siteH);
  }

  /** 드래그(팬) 시작 */
  _startDrag(pointer, cam) {
    this._drag.active  = true;
    this._drag.startX  = pointer.x;
    this._drag.startY  = pointer.y;
    this._drag.scrollX = cam.scrollX;
    this._drag.scrollY = cam.scrollY;
    this.input.setDefaultCursor('grabbing');
  }

  /**
   * 배치 모드: 커서 위치 중앙에 시설 배치.
   * 시설의 중심이 클릭한 셀이 되도록 col/row를 오프셋한다.
   */
  _placeFacility(worldX, worldY, cellPx) {
    const store  = useFacilitiesStore.getState();
    const typeId = store.paletteSelectedTypeId;
    const def    = FACILITY_DEFAULTS[typeId] || {
      width: 10, height: 10, color: '#6b9fff', capacity: '', baseName: typeId,
    };

    const clickedCol = Math.floor(worldX / cellPx);
    const clickedRow = Math.floor(worldY / cellPx);

    // 시설 중심을 클릭 지점에 맞춤
    const col = Math.max(0, clickedCol - Math.floor(def.width  / 2));
    const row = Math.max(0, clickedRow - Math.floor(def.height / 2));

    const count    = store.facilities.filter((f) => f.typeId === typeId).length;

    store.addFacility({
      id:       `${typeId}_${Date.now()}`,
      typeId,
      name:     `${def.baseName} #${count + 1}`,
      position: { col, row },
      size:     { width: def.width, height: def.height },
      color:    def.color,
      capacity: def.capacity,
      notes:    '',
    });
  }
}
