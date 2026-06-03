import Phaser from 'phaser';
import { GRID_CONFIG, GRID_COLORS } from './config.js';
import { FacilityRenderer } from './FacilityRenderer.js';
import { TerrainRenderer } from './TerrainRenderer.js';
import { useFacilitiesStore } from '../state/facilitiesStore.js';
import { useTerrainStore } from '../state/terrainStore.js';
import { useImportStore } from '../state/importStore.js';
import { useBgImageStore } from '../state/bgImageStore.js';

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

/**
 * 지형 팔레트 기본값 (v0.2.4)
 * typeId 접두사 'terrain:' — 배치 시 시설과 구분
 */
const TERRAIN_DEFAULTS = {
  'terrain:river': { type: 'river', width: 4,  height: 20 },
  'terrain:road':  { type: 'road',  width: 2,  height: 30 },
  'terrain:tree':  { type: 'tree',  width: 3,  height: 3  },
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

    this._drag          = { active: false, startX: 0, startY: 0, scrollX: 0, scrollY: 0 };
    this._facDrag       = { active: false, id: null, startWX: 0, startWY: 0,
                            startCol: 0, startRow: 0, lastCol: -1, lastRow: -1 };
    this._terrainDrag   = { active: false, id: null, startWX: 0, startWY: 0,
                            startCol: 0, startRow: 0, lastCol: -1, lastRow: -1 };
    this._storeUnsub    = null;
    this._terrainUnsub  = null;
    this._importUnsub   = null;
    this._bgUnsub       = null;
    this._renderer      = null;
    this._terrainRend   = null;
    this._cellPx        = 0;
    this._boundaryGfx   = null;
    this._outsideGfx    = null;
    this._siteFillGfx   = null;
    this._importBndGfx  = null;  // import 부지경계 박스 (depth 4)
    this._gridGfx       = null;  // 격자선 그래픽스 (depth 1) — opacity 제어용
    this._bgImageObj    = null;  // 배경 트레이싱 이미지 (depth 0.5)
    this._bgVersion     = 0;     // 비동기 texture load 버전 카운터

    this._resizeDrag      = { active: false, handle: null, facId: null,
                              anchorCol: 0, anchorRow: 0,
                              lastW: 0, lastH: 0, lastCol: 0, lastRow: 0 };
    this._resizeHandleGfx = null;
  }

  create() {
    const {
      cellSize, pixelsPerCell,
      gridMajorEvery, gridLabelEvery,
      zoomMin, zoomMax,
    } = GRID_CONFIG;

    const cellPx = pixelsPerCell;
    this._cellPx = cellPx;

    const maxCells = 800;
    const worldW = maxCells * cellPx;
    const worldH = maxCells * cellPx;

    this.cameras.main.roundPixels = false;
    this.cameras.main.setBackgroundColor(GRID_COLORS.outsideBackground);

    // ── 부지 내부 베이지 (depth 0) ─────────────────────────────
    this._siteFillGfx = this.add.graphics().setDepth(0);
    this._outsideGfx  = this.add.graphics().setDepth(0);

    // ── 격자선 (depth 1) ──────────────────────────────────────
    const g = this._gridGfx = this.add.graphics().setDepth(1);

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

    g.lineStyle(1, GRID_COLORS.gridBold, 0.9);
    for (let x = 0; x <= maxCells; x += gridMajorEvery) {
      g.moveTo(x * cellPx, 0); g.lineTo(x * cellPx, worldH);
    }
    for (let y = 0; y <= maxCells; y += gridMajorEvery) {
      g.moveTo(0, y * cellPx); g.lineTo(worldW, y * cellPx);
    }
    g.strokePath();

    // 100m 좌표 라벨 (depth 2)
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

    // ── 부지 경계선 (depth 3) ─────────────────────────────────
    this._boundaryGfx = this.add.graphics().setDepth(3);
    this._drawBoundary();

    // ── import 부지경계 박스 (depth 4) ───────────────────────
    this._importBndGfx = this.add.graphics().setDepth(4);

    // ── 지형 렌더러 (depth 5) — 시설 아래 ───────────────────
    this._terrainRend = new TerrainRenderer(this);

    // ── 시설 렌더러 (depth 10) ────────────────────────────────
    this._renderer = new FacilityRenderer(this);

    // ── 리사이즈 핸들 (depth 12) ─────────────────────────────
    this._resizeHandleGfx = this.add.graphics().setDepth(12);

    // ── 시설 store 구독 ──────────────────────────────────────
    let prevSiteSize = useFacilitiesStore.getState().siteSize;
    this._storeUnsub = useFacilitiesStore.subscribe((state) => {
      if (this._renderer) {
        const { siteSize } = state;
        const siteCols = siteSize.widthM  / GRID_CONFIG.cellSize;
        const siteRows = siteSize.heightM / GRID_CONFIG.cellSize;
        this._renderer.render(
          state.facilities, state.selectedIds,
          cellPx, siteCols, siteRows,
          state.phaseViewEnabled,
        );
        this._drawResizeHandles(state.facilities, state.selectedIds, cellPx);
      }
      if (state.siteSize !== prevSiteSize) {
        prevSiteSize = state.siteSize;
        this._drawBoundary();
        this._centerCameraOnSite();
        this._updateBgImageSize();
      }
      if (this.input && !this._drag.active) {
        this.input.setDefaultCursor(state.paletteSelectedTypeId ? 'crosshair' : 'default');
      }
    });

    // 지형 store 구독
    this._terrainUnsub = useTerrainStore.subscribe((state) => {
      if (this._terrainRend) {
        this._terrainRend.render(state.terrains, state.selectedTerrainId, cellPx);
      }
    });

    // import store 구독 — 부지경계 박스 갱신
    this._importUnsub = useImportStore.subscribe((state) => {
      this._drawImportBoundary(state.siteBoundary, cellPx);
    });

    // 배경 트레이싱 store 구독 (v0.2.8.5)
    // prevBgDataUrl 클로저로 URL 변경 여부를 추적 — 슬라이더 조작 시 texture 재로드 방지
    let prevBgDataUrl = null;
    let prevBgScale = 1.0, prevBgOffsetX = 0, prevBgOffsetY = 0;
    this._bgUnsub = useBgImageStore.subscribe((state) => {
      const { bgImageDataUrl, bgOpacity, gridOpacity, bgScale, bgOffsetX, bgOffsetY } = state;

      if (this._gridGfx) this._gridGfx.setAlpha(gridOpacity);

      if (bgImageDataUrl !== prevBgDataUrl) {
        prevBgDataUrl = bgImageDataUrl;
        if (!bgImageDataUrl) {
          this._removeBgImage();
        } else {
          this._loadBgTexture(bgImageDataUrl, bgOpacity);
        }
      } else if (this._bgImageObj) {
        this._bgImageObj.setAlpha(bgOpacity);
        if (bgScale !== prevBgScale || bgOffsetX !== prevBgOffsetX || bgOffsetY !== prevBgOffsetY) {
          this._applyBgTransform();
        }
      }
      prevBgScale = bgScale; prevBgOffsetX = bgOffsetX; prevBgOffsetY = bgOffsetY;
    });

    // 초기 렌더
    const init = useFacilitiesStore.getState();
    const initSiteCols = init.siteSize.widthM  / GRID_CONFIG.cellSize;
    const initSiteRows = init.siteSize.heightM / GRID_CONFIG.cellSize;
    this._renderer.render(
      init.facilities, init.selectedIds,
      cellPx, initSiteCols, initSiteRows,
      init.phaseViewEnabled,
    );

    const tInit = useTerrainStore.getState();
    this._terrainRend.render(tInit.terrains, tInit.selectedTerrainId, cellPx);
    this._drawResizeHandles(init.facilities, init.selectedIds, cellPx);

    // 최초 부지 중심 정렬 (500ms fallback)
    this.time.delayedCall(500, () => this._centerCameraOnSite());

    // ── 마우스 휠 줌 (Phaser 함정 #2) ────────────────────────
    this.input.on('wheel', (pointer, _obj, _dx, deltaY) => {
      const cam    = this.cameras.main;
      const factor = deltaY > 0 ? 0.80 : 1.25;
      const toZoom = Phaser.Math.Clamp(cam.zoom * factor, zoomMin, zoomMax);
      if (toZoom === cam.zoom) return;

      const before = cam.getWorldPoint(pointer.x, pointer.y);
      cam.zoom = toZoom;
      cam.preRender(1);
      const after = cam.getWorldPoint(pointer.x, pointer.y);
      cam.scrollX -= after.x - before.x;
      cam.scrollY -= after.y - before.y;

      this._clampCamera();
      if (this.onZoomUpdate) this.onZoomUpdate(cam.zoom);
      // 줌 변경 시 핸들 크기 재계산
      const fState = useFacilitiesStore.getState();
      this._drawResizeHandles(fState.facilities, fState.selectedIds, cellPx);
    });

    // ── 포인터 다운 ──────────────────────────────────────────
    this.input.on('pointerdown', (pointer) => {
      const cam    = this.cameras.main;
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;
      const store  = useFacilitiesStore.getState();
      const tStore = useTerrainStore.getState();

      if (pointer.rightButtonDown()) {
        this._startDrag(pointer, cam);
        return;
      }
      if (!pointer.leftButtonDown()) return;

      // 배치 모드 — 지형 vs 시설 구분
      if (store.paletteSelectedTypeId) {
        if (store.paletteSelectedTypeId.startsWith('terrain:')) {
          this._placeTerrain(worldX, worldY, cellPx, store.paletteSelectedTypeId);
        } else {
          this._placeFacility(worldX, worldY, cellPx);
        }
        return;
      }

      const isMulti = pointer.event.metaKey || pointer.event.ctrlKey;

      // ── 리사이즈 핸들 hitTest (시설 드래그보다 우선) ──────────
      if (!isMulti && store.selectedIds.length === 1) {
        const singleFac = store.facilities.find((f) => f.id === store.selectedIds[0]);
        if (singleFac) {
          const handle = this._hitTestResizeHandle(worldX, worldY, singleFac, cellPx);
          if (handle) {
            const rd = this._resizeDrag;
            rd.active = true;
            rd.handle = handle;
            rd.facId  = singleFac.id;
            if (handle === 'br') {
              rd.anchorCol = singleFac.position.col;
              rd.anchorRow = singleFac.position.row;
            } else if (handle === 'tl') {
              rd.anchorCol = singleFac.position.col + singleFac.size.width;
              rd.anchorRow = singleFac.position.row + singleFac.size.height;
            } else if (handle === 'tr') {
              rd.anchorCol = singleFac.position.col;
              rd.anchorRow = singleFac.position.row + singleFac.size.height;
            } else { // bl
              rd.anchorCol = singleFac.position.col + singleFac.size.width;
              rd.anchorRow = singleFac.position.row;
            }
            rd.lastW   = singleFac.size.width;
            rd.lastH   = singleFac.size.height;
            rd.lastCol = singleFac.position.col;
            rd.lastRow = singleFac.position.row;
            const HANDLE_CURSORS = { tl: 'nwse-resize', tr: 'nesw-resize',
                                     bl: 'nesw-resize', br: 'nwse-resize' };
            this.input.setDefaultCursor(HANDLE_CURSORS[handle]);
            return;
          }
        }
      }

      // 시설 우선 hitTest
      const hitFacId = this._renderer.hitTest(worldX, worldY, store.facilities, cellPx);
      if (hitFacId) {
        tStore.clearTerrainSelection();
        store.selectFacility(hitFacId, isMulti);
        if (!isMulti) {
          const fac = store.facilities.find((f) => f.id === hitFacId);
          if (fac) {
            this._facDrag.active   = true;
            this._facDrag.id       = hitFacId;
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

      // 지형 hitTest (시설이 없을 때만)
      const hitTerrId = this._terrainRend.hitTest(worldX, worldY, tStore.terrains, cellPx);
      if (hitTerrId) {
        store.clearSelection();
        tStore.selectTerrain(hitTerrId);
        // 지형 드래그 준비 (시설과 동일 패턴)
        const terr = tStore.terrains.find((x) => x.id === hitTerrId);
        if (terr) {
          this._terrainDrag.active   = true;
          this._terrainDrag.id       = hitTerrId;
          this._terrainDrag.startWX  = worldX;
          this._terrainDrag.startWY  = worldY;
          this._terrainDrag.startCol = terr.col;
          this._terrainDrag.startRow = terr.row;
          this._terrainDrag.lastCol  = terr.col;
          this._terrainDrag.lastRow  = terr.row;
          this.input.setDefaultCursor('move');
        }
        return;
      }

      // 빈 공간 — 선택 해제 + 팬 시작
      if (!isMulti) {
        store.clearSelection();
        tStore.clearTerrainSelection();
      }
      this._startDrag(pointer, cam);
    });

    this.input.on('pointerup', () => {
      this._drag.active        = false;
      this._facDrag.active     = false;
      this._terrainDrag.active = false;
      this._resizeDrag.active  = false;
      const paletteTypeId = useFacilitiesStore.getState().paletteSelectedTypeId;
      this.input.setDefaultCursor(paletteTypeId ? 'crosshair' : 'default');
    });

    // ── 포인터 이동 ───────────────────────────────────────────
    this.input.on('pointermove', (pointer) => {
      const cam = this.cameras.main;

      // 리사이즈 드래그 (facDrag보다 우선)
      if (this._resizeDrag.active) {
        const rd    = this._resizeDrag;
        const store = useFacilitiesStore.getState();
        const { siteSize } = store;
        const siteCols = siteSize.widthM  / GRID_CONFIG.cellSize;
        const siteRows = siteSize.heightM / GRID_CONFIG.cellSize;

        const ptrCol = Math.round(pointer.worldX / cellPx);
        const ptrRow = Math.round(pointer.worldY / cellPx);

        let newCol = rd.lastCol, newRow = rd.lastRow;
        let newW   = rd.lastW,   newH   = rd.lastH;

        if (rd.handle === 'br') {
          newW   = Math.max(1, ptrCol - rd.anchorCol);
          newH   = Math.max(1, ptrRow - rd.anchorRow);
          newCol = rd.anchorCol;
          newRow = rd.anchorRow;
        } else if (rd.handle === 'tl') {
          const c = Math.max(0, Math.min(ptrCol, rd.anchorCol - 1));
          const r = Math.max(0, Math.min(ptrRow, rd.anchorRow - 1));
          newCol = c; newRow = r;
          newW   = rd.anchorCol - c;
          newH   = rd.anchorRow - r;
        } else if (rd.handle === 'tr') {
          newW   = Math.max(1, ptrCol - rd.anchorCol);
          const r = Math.max(0, Math.min(ptrRow, rd.anchorRow - 1));
          newRow = r;
          newH   = rd.anchorRow - r;
          newCol = rd.anchorCol;
        } else { // bl
          const c = Math.max(0, Math.min(ptrCol, rd.anchorCol - 1));
          newCol = c;
          newW   = rd.anchorCol - c;
          newH   = Math.max(1, ptrRow - rd.anchorRow);
          newRow = rd.anchorRow;
        }

        // 부지 경계 클램프
        newW = Math.min(newW, siteCols - newCol);
        newH = Math.min(newH, siteRows - newRow);

        if (newW !== rd.lastW || newH !== rd.lastH || newCol !== rd.lastCol || newRow !== rd.lastRow) {
          if (!checkAABB(store.facilities, [rd.facId], newCol, newRow, newW, newH)) {
            rd.lastW   = newW;  rd.lastH   = newH;
            rd.lastCol = newCol; rd.lastRow = newRow;
            store.updateFacility(rd.facId, {
              position: { col: newCol, row: newRow },
              size:     { width: newW,  height: newH },
            });
          }
        }
      }

      // 시설 드래그 이동 (Phaser 함정 #1: worldX/Y 사용)
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

      // 지형 드래그 이동 (타일 게임 좌표 3계 분리 — col/row 정수만 저장)
      if (this._terrainDrag.active) {
        const tState = useTerrainStore.getState();
        const facState = useFacilitiesStore.getState();
        const { siteSize } = facState;
        const siteCols = siteSize.widthM  / GRID_CONFIG.cellSize;
        const siteRows = siteSize.heightM / GRID_CONFIG.cellSize;
        const terr = tState.terrains.find((x) => x.id === this._terrainDrag.id);
        if (terr) {
          const wX   = pointer.worldX;
          const wY   = pointer.worldY;
          const dCol = Math.round((wX - this._terrainDrag.startWX) / cellPx);
          const dRow = Math.round((wY - this._terrainDrag.startWY) / cellPx);
          const rawCol = this._terrainDrag.startCol + dCol;
          const rawRow = this._terrainDrag.startRow + dRow;
          const newCol = Math.max(0, Math.min(rawCol, siteCols - terr.width));
          const newRow = Math.max(0, Math.min(rawRow, siteRows - terr.height));
          if (newCol !== this._terrainDrag.lastCol || newRow !== this._terrainDrag.lastRow) {
            this._terrainDrag.lastCol = newCol;
            this._terrainDrag.lastRow = newRow;
            tState.updateTerrain(this._terrainDrag.id, { col: newCol, row: newRow });
          }
        }
      }

      // 카메라 팬
      if (this._drag.active) {
        cam.scrollX = this._drag.scrollX - (pointer.x - this._drag.startX) / cam.zoom;
        cam.scrollY = this._drag.scrollY - (pointer.y - this._drag.startY) / cam.zoom;
        this._clampCamera();
      }

      // 핸들 호버 커서 (드래그 없을 때)
      if (!this._drag.active && !this._facDrag.active &&
          !this._terrainDrag.active && !this._resizeDrag.active) {
        const hState = useFacilitiesStore.getState();
        if (!hState.paletteSelectedTypeId && hState.selectedIds.length === 1) {
          const sf = hState.facilities.find((f) => f.id === hState.selectedIds[0]);
          if (sf) {
            const hh = this._hitTestResizeHandle(pointer.worldX, pointer.worldY, sf, cellPx);
            const CURSORS = { tl: 'nwse-resize', tr: 'nesw-resize',
                              bl: 'nesw-resize', br: 'nwse-resize' };
            this.input.setDefaultCursor(hh ? CURSORS[hh] : 'default');
          }
        }
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

    // Delete / Backspace: 시설 또는 선택 지형 삭제
    const handleDelete = () => {
      const state  = useFacilitiesStore.getState();
      const tState = useTerrainStore.getState();

      // 시설 삭제 우선
      if (state.selectedIds.length > 0) {
        const msg = state.selectedIds.length === 1
          ? `'${state.facilities.find(f => f.id === state.selectedIds[0])?.name || '시설'}'을(를) 삭제하시겠습니까?`
          : `선택된 시설 ${state.selectedIds.length}개를 삭제하시겠습니까?`;
        if (window.confirm(msg)) state.deleteSelected();
        return;
      }
      // 지형 삭제
      if (tState.selectedTerrainId) {
        const t = tState.terrains.find(x => x.id === tState.selectedTerrainId);
        const name = { river: '강', road: '도로', tree: '나무' }[t?.type] || '지형';
        if (window.confirm(`이 ${name}을(를) 삭제하시겠습니까?`)) {
          tState.removeTerrain(tState.selectedTerrainId);
        }
      }
    };
    this.input.keyboard.on('keydown-DELETE',   handleDelete);
    this.input.keyboard.on('keydown-BACKSPACE', handleDelete);

    // R: 선택 시설 또는 선택 지형 90도 회전
    this.input.keyboard.on('keydown-R', () => {
      const state  = useFacilitiesStore.getState();
      const tState = useTerrainStore.getState();
      if (state.selectedIds.length > 0) {
        state.tryRotateSelected();
      } else if (tState.selectedTerrainId) {
        tState.tryRotateTerrain(tState.selectedTerrainId);
      }
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
      if (this._storeUnsub)      this._storeUnsub();
      if (this._terrainUnsub)    this._terrainUnsub();
      if (this._importUnsub)     this._importUnsub();
      if (this._bgUnsub)         this._bgUnsub();
      if (this._renderer)        this._renderer.destroy();
      if (this._terrainRend)     this._terrainRend.destroy();
      if (this._boundaryGfx)     this._boundaryGfx.destroy();
      if (this._outsideGfx)      this._outsideGfx.destroy();
      if (this._siteFillGfx)     this._siteFillGfx.destroy();
      if (this._importBndGfx)    this._importBndGfx.destroy();
      if (this._resizeHandleGfx) this._resizeHandleGfx.destroy();
      if (this._bgImageObj)      this._bgImageObj.destroy();
    });
  }

  // ── 헬퍼 ─────────────────────────────────────────────────────────────

  _drawBoundary() {
    const { siteSize } = useFacilitiesStore.getState();
    const { pixelsPerCell, cellSize } = GRID_CONFIG;
    const cellPx = pixelsPerCell;
    const siteW = (siteSize.widthM  / cellSize) * cellPx;
    const siteH = (siteSize.heightM / cellSize) * cellPx;

    const sf = this._siteFillGfx;
    sf.clear();
    sf.fillStyle(GRID_COLORS.background, 1.0);
    sf.fillRect(0, 0, siteW, siteH);

    this._outsideGfx.clear();

    const bg = this._boundaryGfx;
    bg.clear();
    bg.lineStyle(2, GRID_COLORS.boundary, 1.0);
    bg.strokeRect(0, 0, siteW, siteH);
  }

  /**
   * 카메라 scroll clamp — 최소 가시 영역 방식 (Phaser 함정 #6)
   * vpW >> siteW 줌아웃에서도 범위 반전 없음.
   */
  _clampCamera() {
    const cam = this.cameras.main;
    if (!cam) return;

    const { siteSize } = useFacilitiesStore.getState();
    const { pixelsPerCell, cellSize } = GRID_CONFIG;
    const cellPx = pixelsPerCell;

    const siteW = (siteSize.widthM  / cellSize) * cellPx;
    const siteH = (siteSize.heightM / cellSize) * cellPx;

    const vpW = cam.width  / cam.zoom;
    const vpH = cam.height / cam.zoom;

    const minVisX = Math.min(siteW * 0.15, 200);
    const minVisY = Math.min(siteH * 0.15, 200);

    const minScrollX = minVisX - vpW;
    const maxScrollX = siteW - minVisX;
    const minScrollY = minVisY - vpH;
    const maxScrollY = siteH - minVisY;

    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, minScrollX, Math.max(minScrollX, maxScrollX));
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, minScrollY, Math.max(minScrollY, maxScrollY));
  }

  /**
   * 부지 중심을 뷰포트 중심으로 이동 (cam.centerOn 내장 사용).
   */
  _centerCameraOnSite() {
    const cam = this.cameras.main;
    if (!cam) return;

    const { siteSize } = useFacilitiesStore.getState();
    const { pixelsPerCell, cellSize } = GRID_CONFIG;
    const cellPx = pixelsPerCell;
    const siteW = (siteSize.widthM  / cellSize) * cellPx;
    const siteH = (siteSize.heightM / cellSize) * cellPx;

    cam.centerOn(siteW / 2, siteH / 2);
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
   * import siteBoundary를 점선 박스로 렌더링 (depth 4).
   * boundary가 null이면 지운다.
   * 교훈: 수동 dash 계산 — Phaser Graphics는 setLineDash 미지원, lineBetween으로 구현.
   */
  _drawImportBoundary(boundary, cellPx) {
    const g = this._importBndGfx;
    if (!g) return;
    g.clear();
    if (!boundary) return;

    const x = boundary.offsetXCells * cellPx;
    const y = boundary.offsetYCells * cellPx;
    const w = boundary.wCells  * cellPx;
    const h = boundary.hCells  * cellPx;

    // 반투명 청록색 채우기
    g.fillStyle(0x00ccaa, 0.06);
    g.fillRect(x, y, w, h);

    // 수동 점선 테두리 (dashLen=12, gapLen=8)
    g.lineStyle(2, 0x00ccaa, 0.8);
    const dash = (x1, y1, x2, y2) => {
      const dLen = 12, gLen = 8;
      const dx = x2 - x1, dy = y2 - y1;
      const total = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / total, uy = dy / total;
      let pos = 0, on = true;
      while (pos < total) {
        const seg = on ? dLen : gLen;
        const end = Math.min(pos + seg, total);
        if (on) {
          g.lineBetween(x1 + ux * pos, y1 + uy * pos, x1 + ux * end, y1 + uy * end);
        }
        pos = end;
        on = !on;
      }
    };
    dash(x,   y,   x+w, y  );  // 상
    dash(x+w, y,   x+w, y+h);  // 우
    dash(x+w, y+h, x,   y+h);  // 하
    dash(x,   y+h, x,   y  );  // 좌

    // 모서리 마커
    const mk = 6;
    g.fillStyle(0x00ccaa, 1.0);
    [[x,y],[x+w,y],[x+w,y+h],[x,y+h]].forEach(([cx,cy]) => {
      g.fillRect(cx - mk/2, cy - mk/2, mk, mk);
    });
  }

  /**
   * 배경 트레이싱 이미지 texture 로드 후 배치 (v0.2.8.5).
   * depth 0.5 — siteFillGfx(0) 위, gridGfx(1) 아래.
   * 교훈 준수: 월드 좌표(0,0) 배치, 카메라 수식 비접촉.
   */
  _loadBgTexture(dataUrl, opacity) {
    const version = ++this._bgVersion;
    const key = '__bg_trace__';

    if (this._bgImageObj) { this._bgImageObj.destroy(); this._bgImageObj = null; }
    if (this.textures.exists(key)) this.textures.remove(key);

    this.textures.once('addtexture-' + key, () => {
      if (version !== this._bgVersion) return; // 더 새 로드로 대체됨
      this._bgImageObj = this.add.image(0, 0, key)
        .setOrigin(0, 0)
        .setDepth(0.5)
        .setAlpha(opacity);
      this._applyBgTransform();
    });
    this.textures.addBase64(key, dataUrl);
  }

  /** 배경 이미지 제거 */
  _removeBgImage() {
    if (this._bgImageObj) { this._bgImageObj.destroy(); this._bgImageObj = null; }
    const key = '__bg_trace__';
    if (this.textures.exists(key)) this.textures.remove(key);
  }

  /** 배경 표시 크기·위치 계산 (사이트 크기 × bgScale, offset 반영) */
  _applyBgTransform() {
    if (!this._bgImageObj) return;
    const { siteSize } = useFacilitiesStore.getState();
    const { bgScale, bgOffsetX, bgOffsetY } = useBgImageStore.getState();
    const siteW = (siteSize.widthM  / GRID_CONFIG.cellSize) * this._cellPx;
    const siteH = (siteSize.heightM / GRID_CONFIG.cellSize) * this._cellPx;
    this._bgImageObj.setDisplaySize(siteW * bgScale, siteH * bgScale);
    this._bgImageObj.setPosition(bgOffsetX, bgOffsetY);
  }

  /** 부지 크기 변경 시 배경 이미지 displaySize 갱신 */
  _updateBgImageSize() {
    this._applyBgTransform();
  }

  /**
   * 카메라를 import 부지경계에 맞게 zoom + centerOn.
   * 교훈:
   *   - 내장 centerOn 사용 (수동 scrollX 계산 금지 — 같은 가설 3회 실패 원칙)
   *   - import 버튼 클릭 시점 = 화면 안정 → cam.width/height 신뢰 가능
   *
   * @param {{ wCells, hCells, offsetXCells, offsetYCells }} boundary
   */
  _fitToSiteBoundary(boundary) {
    const cam = this.cameras.main;
    if (!cam || !boundary) return;
    const cellPx  = this._cellPx;
    const siteW   = boundary.wCells  * cellPx;
    const siteH   = boundary.hCells  * cellPx;
    const padding = 0.88;  // 12% 여백

    const newZoom = Math.min(
      cam.width  / siteW,
      cam.height / siteH,
    ) * padding;

    cam.zoom = Phaser.Math.Clamp(newZoom, GRID_CONFIG.zoomMin, GRID_CONFIG.zoomMax);

    const centerX = (boundary.offsetXCells + boundary.wCells  / 2) * cellPx;
    const centerY = (boundary.offsetYCells + boundary.hCells / 2) * cellPx;
    cam.centerOn(centerX, centerY);  // 내장 API — 타이밍 독립적
    this._clampCamera();
  }

  // ── 리사이즈 핸들 헬퍼 (v0.2.8.6) ─────────────────────────────────

  /** 현재 줌에서 화면상 ~10px 에 해당하는 world 픽셀 크기 */
  _handlePx() {
    const zoom = this.cameras.main?.zoom || 1;
    return Math.max(4, Math.min(16, 10 / zoom));
  }

  /** 시설 4모서리의 world 좌표 반환 */
  _getHandleCenters(fac, cellPx) {
    const x = fac.position.col * cellPx;
    const y = fac.position.row * cellPx;
    const w = fac.size.width  * cellPx;
    const h = fac.size.height * cellPx;
    return {
      tl: { x,     y     },
      tr: { x: x+w, y     },
      bl: { x,     y: y+h },
      br: { x: x+w, y: y+h },
    };
  }

  /** 단일 선택 시설의 4모서리 핸들을 흰 사각형으로 그린다 (depth 12) */
  _drawResizeHandles(facilities, selectedIds, cellPx) {
    const g = this._resizeHandleGfx;
    if (!g) return;
    g.clear();
    if (selectedIds.length !== 1) return;
    const fac = facilities.find((f) => f.id === selectedIds[0]);
    if (!fac) return;
    const hp = this._handlePx();
    const centers = this._getHandleCenters(fac, cellPx);
    Object.values(centers).forEach(({ x, y }) => {
      g.fillStyle(0xffffff, 0.92);
      g.fillRect(x - hp / 2, y - hp / 2, hp, hp);
      g.lineStyle(1.5, 0x222244, 1.0);
      g.strokeRect(x - hp / 2, y - hp / 2, hp, hp);
    });
  }

  /**
   * 월드 좌표가 어느 핸들 위인지 반환.
   * 교훈 #hittest: 핸들 hitArea는 현재 zoom 기준 world 좌표로 계산.
   * @returns {'tl'|'tr'|'bl'|'br'|null}
   */
  _hitTestResizeHandle(worldX, worldY, fac, cellPx) {
    const hp = this._handlePx();
    const centers = this._getHandleCenters(fac, cellPx);
    for (const [key, { x, y }] of Object.entries(centers)) {
      if (worldX >= x - hp / 2 && worldX <= x + hp / 2 &&
          worldY >= y - hp / 2 && worldY <= y + hp / 2) return key;
    }
    return null;
  }

  /**
   * 지형 배치 (v0.2.4)
   * 교훈: 타일 게임 좌표 3계 분리 — col/row 정수만 저장.
   */
  _placeTerrain(worldX, worldY, cellPx, typeId) {
    const def = TERRAIN_DEFAULTS[typeId];
    if (!def) return;

    const store = useFacilitiesStore.getState();
    const { siteSize } = store;
    const siteCols = siteSize.widthM  / GRID_CONFIG.cellSize;
    const siteRows = siteSize.heightM / GRID_CONFIG.cellSize;

    const clickedCol = Math.floor(worldX / cellPx);
    const clickedRow = Math.floor(worldY / cellPx);

    const rawCol = clickedCol - Math.floor(def.width  / 2);
    const rawRow = clickedRow - Math.floor(def.height / 2);
    const col = Math.max(0, Math.min(rawCol, siteCols - def.width));
    const row = Math.max(0, Math.min(rawRow, siteRows - def.height));

    const tStore = useTerrainStore.getState();
    tStore.addTerrain({
      id:     `${typeId}_${Date.now()}`,
      type:   def.type,
      col,
      row,
      width:  def.width,
      height: def.height,
    });
  }

  /**
   * 시설 배치.
   * 교훈: 타일 게임 좌표 3계 분리 + 커스텀 시설 값 복사 원칙.
   */
  _placeFacility(worldX, worldY, cellPx) {
    const store  = useFacilitiesStore.getState();
    const typeId = store.paletteSelectedTypeId;

    const customDef = store.customFacilities.find((f) => f.id === typeId);
    const def = FACILITY_DEFAULTS[typeId] || (customDef ? {
      width:    customDef.width,
      height:   customDef.height,
      color:    customDef.color || '#6b9fff',
      baseName: customDef.name,
      abbrev:   customDef.label || customDef.name.slice(0, 3).toUpperCase(),
      confirmed: false,
      source:   'user-defined',
    } : {
      width: 10, height: 10, color: '#6b9fff',
      baseName: typeId, abbrev: typeId.slice(0, 3).toUpperCase(),
      confirmed: false, source: '미확인',
    });

    const { siteSize } = store;
    const siteCols = siteSize.widthM  / GRID_CONFIG.cellSize;
    const siteRows = siteSize.heightM / GRID_CONFIG.cellSize;

    const clickedCol = Math.floor(worldX / cellPx);
    const clickedRow = Math.floor(worldY / cellPx);

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
      phase:     1,   // 기본 Phase 1
    });
  }
}
