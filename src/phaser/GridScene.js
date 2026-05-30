import Phaser from 'phaser';
import { GRID_CONFIG, GRID_COLORS } from './config.js';
import { FacilityRenderer } from './FacilityRenderer.js';
import { useFacilitiesStore } from '../state/facilitiesStore.js';

/**
 * 시설 타입별 배치 기본값
 * source: TEFR M.N. Dastur & Company 2021 (공개 자료)
 * confirmed: false → footprint 미확정 (회색 표시, "확인 필요" 라벨)
 *
 * 셀 단위 (1셀 = 5m). 예: width:20 = 100m
 */
const FACILITY_DEFAULTS = {
  // ── 원료 처리 ────────────────────────────────────────────────
  unloader:    { width: 10, height: 60, color: '#7a8c6e', baseName: '하역설비',   abbrev: 'UL',  confirmed: true,  source: 'TEFR Dastur 2021 §3' },
  iron_yard:   { width: 40, height: 60, color: '#7a8c6e', baseName: '철광석 야드', abbrev: 'IOY', confirmed: true,  source: 'TEFR Dastur 2021 §3' },
  coal_yard:   { width: 40, height: 60, color: '#7a8c6e', baseName: '석탄 야드',   abbrev: 'CY',  confirmed: true,  source: 'TEFR Dastur 2021 §3' },
  stacker:     { width: 5,  height: 30, color: '#7a8c6e', baseName: '스태커',      abbrev: 'STK', confirmed: false, source: 'TEFR Dastur 2021 §3 (추정)' },
  reclaimer:   { width: 5,  height: 30, color: '#7a8c6e', baseName: '리클레이머',  abbrev: 'RCL', confirmed: false, source: 'TEFR Dastur 2021 §3 (추정)' },

  // ── 소결 ──────────────────────────────────────────────────────
  sinter_machine: { width: 15, height: 20, color: '#c0854a', baseName: '소결기',    abbrev: 'SP', confirmed: true,  source: 'TEFR Dastur 2021 §4' },
  sinter_cooler:  { width: 10, height: 8,  color: '#c0854a', baseName: '소결 쿨러', abbrev: 'SC', confirmed: false, source: 'TEFR Dastur 2021 §4 (추정)' },

  // ── 코크스 ───────────────────────────────────────────────────
  coke_oven:  { width: 20, height: 12, color: '#8888bb', baseName: '코크스 오븐', abbrev: 'CO',  confirmed: true,  source: 'TEFR Dastur 2021 §5' },
  cdq:        { width: 5,  height: 8,  color: '#8888bb', baseName: 'CDQ',         abbrev: 'CDQ', confirmed: false, source: 'TEFR Dastur 2021 §5 (추정)' },
  coal_tower: { width: 4,  height: 4,  color: '#8888bb', baseName: '석탄 장입탑', abbrev: 'CT',  confirmed: false, source: 'TEFR Dastur 2021 §5 (추정)' },

  // ── 고로 영역 ─────────────────────────────────────────────────
  blast_furnace:   { width: 20, height: 20, color: '#ff6b6b', capacity: '5,350 m³', baseName: '고로',         abbrev: 'BF', confirmed: true,  source: 'TEFR Dastur 2021 §6' },
  hot_stove:       { width: 8,  height: 15, color: '#ff6b6b', baseName: '열풍로',        abbrev: 'HS',  confirmed: true,  source: 'TEFR Dastur 2021 §6' },
  cast_house:      { width: 10, height: 10, color: '#ff6b6b', baseName: '캐스트 하우스', abbrev: 'CH',  confirmed: false, source: 'TEFR Dastur 2021 §6 (추정)' },
  slag_granulator: { width: 8,  height: 8,  color: '#ff6b6b', baseName: '슬래그 처리',   abbrev: 'SG',  confirmed: false, source: 'TEFR Dastur 2021 §6 (추정)' },

  // ── 제강 ──────────────────────────────────────────────────────
  bof:         { width: 10, height: 15, color: '#dd6677', baseName: '전로(BOF)',       abbrev: 'BOF', confirmed: true,  source: 'TEFR Dastur 2021 §7' },
  lf:          { width: 8,  height: 6,  color: '#dd6677', baseName: '레이들 정련로',   abbrev: 'LF',  confirmed: false, source: 'TEFR Dastur 2021 §7 (추정)' },
  rh:          { width: 8,  height: 8,  color: '#dd6677', baseName: '진공 탈가스(RH)', abbrev: 'RH',  confirmed: false, source: 'TEFR Dastur 2021 §7 (추정)' },
  cont_caster: { width: 15, height: 30, color: '#dd6677', baseName: '연속주조기',      abbrev: 'CC',  confirmed: true,  source: 'TEFR Dastur 2021 §7' },
  scrap_yard:  { width: 20, height: 15, color: '#dd6677', baseName: '스크랩 야드',     abbrev: 'SY',  confirmed: false, source: 'TEFR Dastur 2021 §7 (추정)' },

  // ── 압연 ──────────────────────────────────────────────────────
  hot_strip_mill: { width: 30, height: 200, color: '#5588cc', baseName: '열연 압연기', abbrev: 'HSM', confirmed: true,  source: 'TEFR Dastur 2021 §8' },
  cold_rolling:   { width: 20, height: 150, color: '#5588cc', baseName: '냉연 압연기', abbrev: 'CRM', confirmed: true,  source: 'TEFR Dastur 2021 §8' },
  galv_line:      { width: 15, height: 120, color: '#5588cc', baseName: '도금 라인',   abbrev: 'CGL', confirmed: false, source: 'TEFR Dastur 2021 §8 (추정)' },
  slab_yard:      { width: 20, height: 30,  color: '#5588cc', baseName: '슬라브 야드', abbrev: 'SLB', confirmed: false, source: 'TEFR Dastur 2021 §8 (추정)' },
  coil_yard:      { width: 20, height: 20,  color: '#5588cc', baseName: '코일 야드',   abbrev: 'CIL', confirmed: false, source: 'TEFR Dastur 2021 §8 (추정)' },

  // ── 부대설비 ──────────────────────────────────────────────────
  asu:             { width: 10, height: 15, color: '#7a7a8a', baseName: '산소 공장',   abbrev: 'ASU', confirmed: false, source: 'TEFR Dastur 2021 §9 (추정)' },
  power_plant:     { width: 15, height: 20, color: '#7a7a8a', baseName: '발전소',      abbrev: 'PWR', confirmed: false, source: 'TEFR Dastur 2021 §9 (추정)' },
  water_treatment: { width: 10, height: 10, color: '#7a7a8a', baseName: '용수 처리',   abbrev: 'WTP', confirmed: false, source: 'TEFR Dastur 2021 §9 (추정)' },
  turboblower:     { width: 8,  height: 6,  color: '#7a7a8a', baseName: '열풍 송풍기', abbrev: 'TBL', confirmed: false, source: 'TEFR Dastur 2021 §9 (추정)' },
  gas_holder:      { width: 12, height: 12, color: '#7a7a8a', baseName: '가스 홀더',   abbrev: 'GH',  confirmed: false, source: 'TEFR Dastur 2021 §9 (추정)' },
  wastewater:      { width: 10, height: 10, color: '#7a7a8a', baseName: '폐수 처리',   abbrev: 'WWT', confirmed: false, source: 'TEFR Dastur 2021 §9 (추정)' },
};

// ── AABB 충돌 검사 헬퍼 ─────────────────────────────────────────────────
/**
 * 특정 위치·크기가 다른 시설과 겹치는지 검사.
 * excludeIds: 검사 대상에서 제외할 시설 ID 배열 (본인 포함)
 */
function checkAABB(facilities, excludeIds, col, row, w, h) {
  const exSet = new Set(excludeIds);
  for (const fac of facilities) {
    if (exSet.has(fac.id)) continue;
    if (
      col < fac.position.col + fac.size.width &&
      col + w > fac.position.col &&
      row < fac.position.row + fac.size.height &&
      row + h > fac.position.row
    ) {
      return true;
    }
  }
  return false;
}

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
    this._boundaryGfx = null;
    this._outsideGfx  = null;
    this._siteFillGfx = null;  // 부지 내부 베이지 채우기
  }

  create() {
    const {
      cellSize, pixelsPerCell,
      gridMajorEvery, gridLabelEvery,
      zoomMin, zoomMax,
    } = GRID_CONFIG;

    const cellPx = pixelsPerCell;
    this._cellPx = cellPx;

    const maxCells = 800;  // 최대 4,000m
    const worldW = maxCells * cellPx;
    const worldH = maxCells * cellPx;

    this.cameras.main.roundPixels = false;
    // 카메라 배경 = 부지 외부색 (회녹색 그레이)
    // 부지 내부 베이지는 _siteFillGfx로 별도 렌더링
    this.cameras.main.setBackgroundColor(GRID_COLORS.outsideBackground);

    // ── 부지 내부 베이지 채우기 (카메라 BG 위, 격자 아래) ────
    this._siteFillGfx = this.add.graphics().setDepth(0);

    // ── 오프-사이트 오버레이 (얇게 유지) ─────────────────────
    this._outsideGfx = this.add.graphics().setDepth(0);

    // ── 격자선 ───────────────────────────────────────────────
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

    // ── 부지 경계선 ──────────────────────────────────────────
    this._boundaryGfx = this.add.graphics().setDepth(3);
    this._drawBoundary();

    // ── 시설 렌더러 ──────────────────────────────────────────
    this._renderer = new FacilityRenderer(this);

    // ── Zustand 구독 ─────────────────────────────────────────
    let prevSiteSize = useFacilitiesStore.getState().siteSize;
    this._storeUnsub = useFacilitiesStore.subscribe((state) => {
      if (this._renderer) {
        const { siteSize } = state;
        const siteCols = siteSize.widthM  / GRID_CONFIG.cellSize;
        const siteRows = siteSize.heightM / GRID_CONFIG.cellSize;
        this._renderer.render(state.facilities, state.selectedIds, cellPx, siteCols, siteRows);
      }
      if (state.siteSize !== prevSiteSize) {
        prevSiteSize = state.siteSize;
        this._drawBoundary();
        // 부지 크기 변경(Apply) 시 카메라를 새 부지 중심으로 재정렬
        // _centerCameraOnSite 내부에서 _clampCamera도 호출됨
        this._centerCameraOnSite();
      }
      if (this.input && !this._drag.active) {
        this.input.setDefaultCursor(state.paletteSelectedTypeId ? 'crosshair' : 'default');
      }
    });
    const init = useFacilitiesStore.getState();
    const initSiteCols = init.siteSize.widthM  / GRID_CONFIG.cellSize;
    const initSiteRows = init.siteSize.heightM / GRID_CONFIG.cellSize;
    this._renderer.render(init.facilities, init.selectedIds, cellPx, initSiteCols, initSiteRows);

    // 최초 로드: 부지 중심을 화면 중심으로 (한 프레임 뒤 실행 — 카메라 크기 확정 보장)
    this.time.delayedCall(0, () => this._centerCameraOnSite());

    // ── 마우스 휠 줌 (5단계 공식 — Phaser 함정 #2) ─────────
    // preRender(1) 필수: 없으면 줌 후 좌표 재계산이 틀어짐
    this.input.on('wheel', (pointer, _obj, _dx, deltaY) => {
      const cam    = this.cameras.main;
      const factor = deltaY > 0 ? 0.80 : 1.25;
      const toZoom = Phaser.Math.Clamp(cam.zoom * factor, zoomMin, zoomMax);
      if (toZoom === cam.zoom) return;

      const before = cam.getWorldPoint(pointer.x, pointer.y);
      cam.zoom = toZoom;
      cam.preRender(1);  // ⭐ 카메라 매트릭스 강제 갱신
      const after = cam.getWorldPoint(pointer.x, pointer.y);
      cam.scrollX -= after.x - before.x;
      cam.scrollY -= after.y - before.y;

      // 6) Clamp: 부지가 항상 화면 안에 일부 이상 보이게 (보정 이후 적용)
      this._clampCamera();

      if (this.onZoomUpdate) this.onZoomUpdate(cam.zoom);
    });

    // ── 포인터 다운 ──────────────────────────────────────────
    this.input.on('pointerdown', (pointer) => {
      const cam    = this.cameras.main;
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;
      const store  = useFacilitiesStore.getState();

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

      if (!isMulti) store.clearSelection();
      this._startDrag(pointer, cam);
    });

    this.input.on('pointerup', () => {
      this._drag.active = false;
      this._facDrag.active = false;
      const paletteTypeId = useFacilitiesStore.getState().paletteSelectedTypeId;
      this.input.setDefaultCursor(paletteTypeId ? 'crosshair' : 'default');
    });

    // ── 포인터 이동 ───────────────────────────────────────────
    this.input.on('pointermove', (pointer) => {
      const cam = this.cameras.main;

      // 시설 드래그 이동 — pointer.worldX/Y (Phaser 함정 #1)
      if (this._facDrag.active) {
        const store = useFacilitiesStore.getState();
        const { siteSize } = store;
        const siteCols = siteSize.widthM  / GRID_CONFIG.cellSize;
        const siteRows = siteSize.heightM / GRID_CONFIG.cellSize;
        const fac = store.facilities.find((f) => f.id === this._facDrag.id);
        const facW = fac?.size.width  ?? 1;
        const facH = fac?.size.height ?? 1;

        const wX   = pointer.worldX;
        const wY   = pointer.worldY;
        const dCol = Math.round((wX - this._facDrag.startWX) / cellPx);
        const dRow = Math.round((wY - this._facDrag.startWY) / cellPx);

        // Hard Block: 부지 경계 클램프
        const rawCol = this._facDrag.startCol + dCol;
        const rawRow = this._facDrag.startRow + dRow;
        const newCol = Math.max(0, Math.min(rawCol, siteCols - facW));
        const newRow = Math.max(0, Math.min(rawRow, siteRows - facH));

        if (newCol !== this._facDrag.lastCol || newRow !== this._facDrag.lastRow) {
          this._facDrag.lastCol = newCol;
          this._facDrag.lastRow = newRow;
          store.updateFacility(this._facDrag.id, {
            position: { col: newCol, row: newRow },
          });
        }
      }

      // 카메라 팬
      if (this._drag.active) {
        cam.scrollX = this._drag.scrollX - (pointer.x - this._drag.startX) / cam.zoom;
        cam.scrollY = this._drag.scrollY - (pointer.y - this._drag.startY) / cam.zoom;
        this._clampCamera();
      }

      const cx = Math.max(0, Math.floor(pointer.worldX / cellPx));
      const cy = Math.max(0, Math.floor(pointer.worldY / cellPx));
      if (this.onCoordUpdate) {
        this.onCoordUpdate({ cellX: cx, cellY: cy, mX: cx * cellSize, mY: cy * cellSize });
      }
    });

    // ── 키보드 ────────────────────────────────────────────────

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
    this.input.keyboard.on('keydown-DELETE',   handleDelete);
    this.input.keyboard.on('keydown-BACKSPACE', handleDelete);

    // R: 선택 시설 90도 회전 (Hard Block: 경계·충돌 시 취소)
    this.input.keyboard.on('keydown-R', () => {
      const state = useFacilitiesStore.getState();
      if (state.selectedIds.length === 0) return;

      const { siteSize } = state;
      const siteCols = siteSize.widthM  / GRID_CONFIG.cellSize;
      const siteRows = siteSize.heightM / GRID_CONFIG.cellSize;

      // 회전 후 경계·충돌 사전 검사 (AABB — Phaser 함정 #3 교훈: hitArea 좌표계 주의)
      const canRotate = state.selectedIds.every((id) => {
        const fac = state.facilities.find((f) => f.id === id);
        if (!fac) return false;
        // 90도 회전: width↔height swap
        const newW = fac.size.height;
        const newH = fac.size.width;
        // 부지 경계 체크
        if (fac.position.col + newW > siteCols) return false;
        if (fac.position.row + newH > siteRows) return false;
        // 충돌 체크 (자신 제외)
        if (checkAABB(state.facilities, state.selectedIds, fac.position.col, fac.position.row, newW, newH)) {
          return false;
        }
        return true;
      });

      if (!canRotate) {
        // 취소: 시각 피드백은 v0.2.4에서 개선
        return;
      }

      state.rotateSelected();
    });

    // Cmd+D / Ctrl+D: 복제
    this.input.keyboard.on('keydown-D', (event) => {
      if (!event.metaKey && !event.ctrlKey) return;
      event.preventDefault();
      const state = useFacilitiesStore.getState();
      if (state.selectedIds.length > 0) state.copySelected();
    });

    this.input.setDefaultCursor('default');

    // ── Scene 정리 ───────────────────────────────────────────
    this.events.on('destroy', () => {
      if (this._storeUnsub)  this._storeUnsub();
      if (this._renderer)    this._renderer.destroy();
      if (this._boundaryGfx) this._boundaryGfx.destroy();
      if (this._outsideGfx)  this._outsideGfx.destroy();
      if (this._siteFillGfx) this._siteFillGfx.destroy();
    });
  }

  // ── 헬퍼 ─────────────────────────────────────────────────────────────

  /**
   * 부지 내부 베이지 채우기 + 경계선.
   * 카메라 배경이 외부색(회녹)이므로 부지 영역만 별도로 채운다.
   */
  _drawBoundary() {
    const { siteSize } = useFacilitiesStore.getState();
    const { pixelsPerCell, cellSize } = GRID_CONFIG;
    const cellPx = pixelsPerCell;
    const siteW = (siteSize.widthM  / cellSize) * cellPx;
    const siteH = (siteSize.heightM / cellSize) * cellPx;

    // 부지 내부 베이지 fill
    const sf = this._siteFillGfx;
    sf.clear();
    sf.fillStyle(GRID_COLORS.background, 1.0);
    sf.fillRect(0, 0, siteW, siteH);

    // 외부 오버레이는 카메라 BG가 이미 다르므로 최소화 (경미한 그림자 효과만)
    const og = this._outsideGfx;
    og.clear();

    // 경계선: 어두운 갈색, 2px
    const bg = this._boundaryGfx;
    bg.clear();
    bg.lineStyle(2, GRID_COLORS.boundary, 1.0);
    bg.strokeRect(0, 0, siteW, siteH);
  }

  /**
   * 카메라 scroll을 부지 + 여유 마진 범위로 clamp.
   * 목표: 어떤 팬/줌에서도 부지가 항상 화면 안에 일부 이상 보일 것.
   *
   * Phaser 함정 #2 주의: 줌 5단계 공식의 scroll 보정 이후에 호출해야 함.
   * 이벤트 핸들러 안에서의 단발성 clamp는 정상 패턴 (update 루프 미결합).
   */
  _clampCamera() {
    const cam = this.cameras.main;
    if (!cam) return;

    const { siteSize } = useFacilitiesStore.getState();
    const { pixelsPerCell, cellSize } = GRID_CONFIG;
    const cellPx = pixelsPerCell;

    const siteW = (siteSize.widthM  / cellSize) * cellPx;
    const siteH = (siteSize.heightM / cellSize) * cellPx;

    // 여유 마진: 부지 폭의 50% — 줌 아웃해도 부지가 완전히 사라지지 않게
    const marginX = siteW * 0.5;
    const marginY = siteH * 0.5;

    // viewport 크기 (현재 줌 반영)
    const vpW = cam.width  / cam.zoom;
    const vpH = cam.height / cam.zoom;

    // scrollX: 왼쪽 끝이 (siteW + marginX) 너머로 가지 않게
    //          오른쪽 끝이 (-marginX) 아래로 가지 않게
    const minScrollX = -marginX;
    const maxScrollX = siteW - vpW + marginX;
    const minScrollY = -marginY;
    const maxScrollY = siteH - vpH + marginY;

    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, minScrollX, Math.max(minScrollX, maxScrollX));
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, minScrollY, Math.max(minScrollY, maxScrollY));
  }

  /**
   * 부지 중심을 뷰포트 중심에 맞춰 카메라를 이동.
   *
   * 부지는 월드 (0,0) 기준으로 고정 유지.
   * 시설 좌표계·Hard Block·clamp 모두 (0,0) 기준이라 변경 불필요.
   * 이 메서드는 "뷰"만 조정한다.
   *
   * 호출 시점:
   *   1) create() 최초 로드 완료 후
   *   2) siteSize 변경(Apply) 시 — 부지가 좌상단에서 나타나는 증상 해결
   */
  _centerCameraOnSite() {
    const cam = this.cameras.main;
    if (!cam) return;

    const { siteSize } = useFacilitiesStore.getState();
    const { pixelsPerCell, cellSize } = GRID_CONFIG;
    const cellPx = pixelsPerCell;
    const siteW = (siteSize.widthM  / cellSize) * cellPx;
    const siteH = (siteSize.heightM / cellSize) * cellPx;

    // 부지 중심(px)을 뷰포트 중심으로
    cam.scrollX = siteW / 2 - cam.width  / (2 * cam.zoom);
    cam.scrollY = siteH / 2 - cam.height / (2 * cam.zoom);

    // 중심 이동 후 bounds clamp 재적용
    this._clampCamera();
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
   * 배치 모드: 클릭 셀을 중심으로 시설 배치.
   * Hard Block: 부지 경계를 벗어나면 클램프.
   */
  _placeFacility(worldX, worldY, cellPx) {
    const store  = useFacilitiesStore.getState();
    const typeId = store.paletteSelectedTypeId;
    const def    = FACILITY_DEFAULTS[typeId] || {
      width: 10, height: 10, color: '#6b9fff',
      baseName: typeId, abbrev: typeId.slice(0, 3).toUpperCase(),
      confirmed: false, source: '미확인',
    };

    const { siteSize } = store;
    const siteCols = siteSize.widthM  / GRID_CONFIG.cellSize;
    const siteRows = siteSize.heightM / GRID_CONFIG.cellSize;

    const clickedCol = Math.floor(worldX / cellPx);
    const clickedRow = Math.floor(worldY / cellPx);

    // 시설 중심을 클릭 지점에 맞춤 + Hard Block 클램프
    const rawCol = clickedCol - Math.floor(def.width  / 2);
    const rawRow = clickedRow - Math.floor(def.height / 2);
    const col = Math.max(0, Math.min(rawCol, siteCols - def.width));
    const row = Math.max(0, Math.min(rawRow, siteRows - def.height));

    const count = store.facilities.filter((f) => f.typeId === typeId).length;

    store.addFacility({
      id:        `${typeId}_${Date.now()}`,
      typeId,
      name:      `${def.baseName} #${count + 1}`,
      abbrev:    def.abbrev,
      confirmed: def.confirmed,
      source:    def.source,
      position:  { col, row },
      size:      { width: def.width, height: def.height },
      color:     def.color,
      capacity:  def.capacity || '',
      notes:     '',
    });
  }
}
