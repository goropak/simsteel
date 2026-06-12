import Phaser from 'phaser';
import { GRID_CONFIG, GRID_COLORS } from './config.js';
import { FacilityRenderer } from './FacilityRenderer.js';
import { TerrainRenderer } from './TerrainRenderer.js';
import { GhostRenderer } from './GhostRenderer.js';
import { ImageLayerRenderer } from './ImageLayerRenderer.js';
import { useFacilitiesStore } from '../state/facilitiesStore.js';
import { useTerrainStore } from '../state/terrainStore.js';
import { useImportStore } from '../state/importStore.js';
import { useBgImageStore } from '../state/bgImageStore.js';
import { useLayoutStore } from '../state/layoutStore.js';
import { useCompareStore } from '../state/compareStore.js';
import { useImageLayerStore } from '../state/imageLayerStore.js';
import { effectiveDefaultSize } from '../state/defaultSizeStore.js';
import { useGridStore } from '../state/gridStore.js';
import { useExtractStore } from '../state/extractStore.js';
import { useRenameStore } from '../state/renameStore.js';

/**
 * DOM 입력 요소에 포커스가 있는지 — Phaser 키보드는 window 전역에서 듣기 때문에
 * input/textarea 타이핑 중 단축키(R/Delete/화살표 등)가 오발동한다. (v0.5.1 가드)
 */
function isTypingInDOM() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/**
 * 시설 타입별 배치 기본값
 * source: TEFR M.N. Dastur & Company 2021 (공개 자료)
 * confirmed: false → footprint 미확정 (회색 표시, "확인 필요" 라벨)
 *
 * 셀 단위 (1셀 = 5m). 예: width:20 = 100m
 */
export const FACILITY_DEFAULTS = {
  // ── 원료 처리 ────────────────────────────────────────────────
  unloader:    { width: 10, height: 60, color: '#7a8c6e', baseName: '하역설비',   abbrev: 'UL',  confirmed: true,  source: 'TEFR Dastur 2021 §3' },
  iron_yard:   { width: 40, height: 60, color: '#7a8c6e', baseName: '철광석 야드', abbrev: 'IOY', confirmed: true,  source: 'TEFR Dastur 2021 §3' },
  coal_yard:   { width: 40, height: 60, color: '#7a8c6e', baseName: '석탄 야드',   abbrev: 'CY',  confirmed: true,  source: 'TEFR Dastur 2021 §3' },
  stacker:     { width: 5,  height: 30, color: '#7a8c6e', baseName: '스태커',      abbrev: 'STK', confirmed: false, source: 'TEFR Dastur 2021 §3 (추정)' },
  reclaimer:   { width: 5,  height: 30, color: '#7a8c6e', baseName: '리클레이머',  abbrev: 'RCL', confirmed: false, source: 'TEFR Dastur 2021 §3 (추정)' },

  // ── 펠릿 ──────────────────────────────────────────────────────
  pellet_plant:   { width: 18, height: 22, color: '#b5763a', baseName: '펠릿 플랜트', abbrev: 'PP', confirmed: false, source: '추정 스펙 — 미확정' },

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
    this._compareUnsub  = null;   // 고스트 비교 레이어 (v0.4.2)
    this._layoutUnsub   = null;
    this._imgLayerUnsub = null;   // 이미지 레이어 (v0.4.3)
    this._gridUnsub     = null;   // 격자 농도 (v0.5.0 feature 4)
    this._extractUnsub  = null;   // 추출 모드 (v0.5.0 feature 5)
    this._renderer      = null;
    this._terrainRend   = null;
    this._ghostRend     = null;   // 고스트(비교) 렌더러 (depth 8)
    this._imgLayerRend  = null;   // 이미지 레이어 렌더러 (depth 0.6)
    this._cellPx        = 0;
    this._boundaryGfx   = null;
    this._outsideGfx    = null;
    this._siteFillGfx   = null;
    this._importBndGfx  = null;  // import 부지경계 박스 (depth 4)
    this._gridGfx       = null;  // 격자선 그래픽스 (depth 1) — opacity 제어용
    this._bgImageObj    = null;  // 배경 트레이싱 이미지 (depth 0.5)
    this._bgVersion     = 0;     // 비동기 texture load 버전 카운터

    this._bgSelected      = false;
    this._bgDrag          = { active: false, startWX: 0, startWY: 0, startOffX: 0, startOffY: 0 };
    // v0.5.0(feature 7) 이미지 레이어 드래그 이동
    this._imgLayerDrag    = { active: false, id: null, startWX: 0, startWY: 0, startOffX: 0, startOffY: 0 };
    // v0.5.0(feature 5) 추출 모드 — 사각형 러버밴드 드래그
    this._extractDrag     = { active: false, startWX: 0, startWY: 0, curWX: 0, curWY: 0 };
    this._extractGfx      = null;  // 추출 러버밴드 그래픽스 (depth 13)
    this._extractCanvas   = null;  // { dataUrl, canvas, ctx, w, h } — 자동 인식 픽셀 캐시
    this._resizeDrag      = { active: false, handle: null, facId: null, target: 'fac',
                              anchorCol: 0, anchorRow: 0,
                              lastW: 0, lastH: 0, lastCol: 0, lastRow: 0,
                              startScaleX: 1, startScaleY: 1, startDist: 0, centerX: 0, centerY: 0 };
    this._resizeHandleGfx = null;
    this._facAnim    = {};    // 페이드인 진행값 { [facId]: 0~1 }
    this._pulse      = 0;    // 선택 펄스 진행값 0~1
    this._pulseTween = null; // 펄스 Tween (active 중일 때만 존재)
    this._lastClick  = { id: null, time: 0 }; // 더블클릭 감지(시설명 인라인 수정 — v0.5.0 feature 2)
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

    // v0.5.0(feature 14) — SimCity풍: 얇은 격자를 더 은은하게(0.35), 굵은 격자도 차분히(0.65)
    g.lineStyle(1, GRID_COLORS.gridThin, 0.35);
    for (let x = 0; x <= maxCells; x++) {
      if (x % gridMajorEvery === 0) continue;
      g.moveTo(x * cellPx, 0); g.lineTo(x * cellPx, worldH);
    }
    for (let y = 0; y <= maxCells; y++) {
      if (y % gridMajorEvery === 0) continue;
      g.moveTo(0, y * cellPx); g.lineTo(worldW, y * cellPx);
    }
    g.strokePath();

    g.lineStyle(1, GRID_COLORS.gridBold, 0.65);
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

    // ── 추출 모드 러버밴드 (depth 13) — 최상단 (v0.5.0 feature 5) ──
    this._extractGfx = this.add.graphics().setDepth(13);

    // ── 지형 렌더러 (depth 5) — 시설 아래 ───────────────────
    this._terrainRend = new TerrainRenderer(this);

    // ── 이미지 레이어 (depth 0.6) — 배경 트레이싱 위·격자 아래 (v0.4.3) ──
    this._imgLayerRend = new ImageLayerRenderer(this);

    // ── 고스트 비교 레이어 (depth 8) — 지형 위·시설 아래 (v0.4.2) ──
    this._ghostRend = new GhostRenderer(this);

    // ── 시설 렌더러 (depth 10) ────────────────────────────────
    this._renderer = new FacilityRenderer(this);

    // ── 리사이즈 핸들 (depth 12) ─────────────────────────────
    this._resizeHandleGfx = this.add.graphics().setDepth(12);

    // ── 시설 store 구독 ──────────────────────────────────────
    let prevSiteSize = useFacilitiesStore.getState().siteSize;
    let prevFacIds   = new Set(useFacilitiesStore.getState().facilities.map(f => f.id));
    this._storeUnsub = useFacilitiesStore.subscribe((state) => {
      if (this._renderer) {
        const { siteSize } = state;
        const siteCols = siteSize.widthM  / GRID_CONFIG.cellSize;
        const siteRows = siteSize.heightM / GRID_CONFIG.cellSize;

        // 새 시설 감지 → 페이드인 Tween (도는 동안만 onUpdate 발화 — 상시 매프레임 X)
        const newIds = state.facilities.filter(f => !prevFacIds.has(f.id)).map(f => f.id);
        prevFacIds = new Set(state.facilities.map(f => f.id));
        if (state.animEnabled && newIds.length) {
          newIds.forEach(id => {
            this._facAnim[id] = 0;
            this.tweens.add({
              targets: this._facAnim, [id]: 1,
              duration: 250, ease: 'Quad.easeOut',
              onUpdate: () => this._rerenderFacilities(),
              onComplete: () => { delete this._facAnim[id]; this._rerenderFacilities(); },
            });
          });
        }

        // 선택 펄스 관리
        if (state.animEnabled && state.selectedIds.length > 0 && !this._pulseTween) {
          this._pulse = 0;
          this._pulseTween = this.tweens.add({
            targets: this, _pulse: 1,
            duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            onUpdate: () => this._rerenderFacilities(),
          });
        }
        if ((!state.selectedIds.length || !state.animEnabled) && this._pulseTween) {
          this._pulseTween.stop(); this._pulseTween = null; this._pulse = 0;
        }

        this._renderer.render(
          state.facilities, state.selectedIds,
          cellPx, siteCols, siteRows,
          state.phaseViewEnabled,
          state.view2_5d,
          this._facAnim, this._pulse,
        );
        this._drawResizeHandles(state.facilities, state.selectedIds, cellPx);
      }
      if (state.siteSize !== prevSiteSize) {
        prevSiteSize = state.siteSize;
        this._drawBoundary();
        this._centerCameraOnSite();
        this._updateBgImageSize();
        this._renderImageLayers();
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

    // 비교(고스트) store + 레이아웃 store 구독 — 고스트 레이어 갱신 (v0.4.2)
    this._compareUnsub = useCompareStore.subscribe(() => this._renderGhosts(cellPx));
    this._layoutUnsub  = useLayoutStore.subscribe(() => this._renderGhosts(cellPx));
    this._renderGhosts(cellPx); // 초기 1회

    // 이미지 레이어 store 구독 — 다중 참조 이미지 갱신 (v0.4.3)
    this._imgLayerUnsub = useImageLayerStore.subscribe(() => this._renderImageLayers());
    this._renderImageLayers(); // 초기 1회

    // 격자 농도 store 구독 (v0.5.0 feature 4) — 배경 이미지와 독립
    const applyGridOpacity = () => {
      if (this._gridGfx) this._gridGfx.setAlpha(useGridStore.getState().gridOpacity);
    };
    this._gridUnsub = useGridStore.subscribe(applyGridOpacity);
    applyGridOpacity(); // 초기 1회

    // 추출 store 구독 (v0.5.0 feature 5) — 부지 경계 자동 생성 1회성 명령 + 모드 종료 시 러버밴드 정리
    let prevAutoNonce = useExtractStore.getState().autoSiteNonce;
    this._extractUnsub = useExtractStore.subscribe((st) => {
      if (st.autoSiteNonce !== prevAutoNonce) {
        prevAutoNonce = st.autoSiteNonce;
        this._autoGenerateSite();
      }
      if (!st.extractMode && this._extractGfx) {
        this._extractGfx.clear();
        this._extractDrag.active = false;
      }
      const cur = useFacilitiesStore.getState().paletteSelectedTypeId;
      this.input.setDefaultCursor(st.extractMode ? 'crosshair' : (cur ? 'crosshair' : 'default'));
    });

    // 배경 트레이싱 store 구독 (v0.2.8.5)
    // prevBgDataUrl 클로저로 URL 변경 여부를 추적 — 슬라이더 조작 시 texture 재로드 방지
    let prevBgDataUrl = null;
    let prevBgScaleX = 1.0, prevBgScaleY = 1.0, prevBgOffsetX = 0, prevBgOffsetY = 0;
    this._bgUnsub = useBgImageStore.subscribe((state) => {
      const { bgImageDataUrl, bgOpacity, bgScaleX, bgScaleY, bgOffsetX, bgOffsetY } = state;

      if (bgImageDataUrl !== prevBgDataUrl) {
        prevBgDataUrl = bgImageDataUrl;
        if (!bgImageDataUrl) {
          this._removeBgImage();
        } else {
          this._loadBgTexture(bgImageDataUrl, bgOpacity);
        }
      } else if (this._bgImageObj) {
        this._bgImageObj.setAlpha(bgOpacity);
        if (bgScaleX !== prevBgScaleX || bgScaleY !== prevBgScaleY ||
            bgOffsetX !== prevBgOffsetX || bgOffsetY !== prevBgOffsetY) {
          this._applyBgTransform();
          if (this._bgSelected) {
            const fState = useFacilitiesStore.getState();
            this._drawResizeHandles(fState.facilities, fState.selectedIds, this._cellPx);
          }
        }
      }
      prevBgScaleX = bgScaleX; prevBgScaleY = bgScaleY;
      prevBgOffsetX = bgOffsetX; prevBgOffsetY = bgOffsetY;
    });

    // 초기 렌더
    const init = useFacilitiesStore.getState();
    const initSiteCols = init.siteSize.widthM  / GRID_CONFIG.cellSize;
    const initSiteRows = init.siteSize.heightM / GRID_CONFIG.cellSize;
    this._renderer.render(
      init.facilities, init.selectedIds,
      cellPx, initSiteCols, initSiteRows,
      init.phaseViewEnabled,
      init.view2_5d,
      {}, 0,
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

      // ── 추출 모드 (v0.5.0 feature 5) — 다른 모든 상호작용보다 우선 ──
      const exState = useExtractStore.getState();
      if (exState.extractMode) {
        if (exState.extractTool === 'auto') {
          this._autoExtractAt(worldX, worldY, cellPx);
        } else {
          this._extractDrag.active  = true;
          this._extractDrag.startWX = worldX;
          this._extractDrag.startWY = worldY;
          this._extractDrag.curWX   = worldX;
          this._extractDrag.curWY   = worldY;
        }
        return;
      }

      // ── 이미지 레이어 이동 모드 (v0.5.0 feature 7) ──
      // activeMoveId가 켜져 있으면 다른 어떤 hitTest보다 우선 — 그 레이어를 드래그로 이동
      const imgState = useImageLayerStore.getState();
      if (imgState.activeMoveId) {
        const layer = imgState.layers.find((l) => l.id === imgState.activeMoveId);
        if (layer) {
          this._imgLayerDrag.active   = true;
          this._imgLayerDrag.id       = layer.id;
          this._imgLayerDrag.startWX  = worldX;
          this._imgLayerDrag.startWY  = worldY;
          this._imgLayerDrag.startOffX = layer.offsetX;
          this._imgLayerDrag.startOffY = layer.offsetY;
          this.input.setDefaultCursor('grabbing');
          return;
        }
      }

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

      // 배경 핸들 hitTest (배경 선택 상태일 때, 시설 hitTest 전)
      if (!isMulti && this._bgSelected && this._bgImageObj) {
        const bgHandle = this._hitTestBgHandle(worldX, worldY);
        if (bgHandle) {
          const rd = this._resizeDrag;
          rd.active = true;
          rd.target = 'bg';
          rd.handle = bgHandle;
          const { bgScaleX, bgScaleY } = useBgImageStore.getState();
          const obj = this._bgImageObj;
          rd.startScaleX = bgScaleX;
          rd.startScaleY = bgScaleY;
          rd.centerX = obj.x + obj.displayWidth  / 2;
          rd.centerY = obj.y + obj.displayHeight / 2;
          const dx = worldX - rd.centerX;
          const dy = worldY - rd.centerY;
          rd.startDist = Math.sqrt(dx * dx + dy * dy) || 1;
          const CURSORS = { tl: 'nwse-resize', tr: 'nesw-resize',
                            bl: 'nesw-resize', br: 'nwse-resize' };
          this.input.setDefaultCursor(CURSORS[bgHandle]);
          return;
        }
      }

      // 시설 우선 hitTest
      const hitFacId = this._renderer.hitTest(worldX, worldY, store.facilities, cellPx);
      if (hitFacId) {
        // ── 더블클릭 → 맵에서 시설명 인라인 수정 (v0.5.0 feature 2) ──
        const now = (pointer.event && pointer.event.timeStamp) || Date.now();
        if (!isMulti && this._lastClick.id === hitFacId && (now - this._lastClick.time) < 350) {
          this._lastClick = { id: null, time: 0 };
          const fac = store.facilities.find((f) => f.id === hitFacId);
          if (fac) {
            // v0.5.1 — window.prompt 대신 시설 라벨 자리에서 직접 수정 (Finder rename UX)
            // 좌표는 포인터 자기 자신을 앵커로 환산 (pointer.x/y=화면, worldX/Y=월드 —
            // 같은 이벤트의 두 좌표 쌍이라 카메라 수식·worldView 갱신 시점과 무관하게 정확)
            const z  = cam.zoom;
            const cx = (fac.position.col + fac.size.width  / 2) * cellPx; // 시설 중앙(=라벨 위치) 월드
            const cy = (fac.position.row + fac.size.height / 2) * cellPx;
            useRenameStore.getState().openRename({
              facId:   hitFacId,
              name:    fac.name,
              centerX: pointer.x + (cx - pointer.worldX) * z,
              centerY: pointer.y + (cy - pointer.worldY) * z,
              width:   fac.size.width * cellPx * z,
            });
          }
          return; // 드래그 시작 안 함
        }
        this._lastClick = { id: hitFacId, time: now };

        this._bgSelected = false;
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
        this._bgSelected = false;
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

      // 배경 이미지 body 클릭 → 배경 선택 + 이동 준비
      if (!isMulti && this._bgImageObj && this._isInsideBgImage(worldX, worldY)) {
        this._bgSelected = false;
        store.clearSelection();
        tStore.clearTerrainSelection();
        this._bgSelected = true;
        const fState = useFacilitiesStore.getState();
        this._drawResizeHandles(fState.facilities, fState.selectedIds, cellPx);
        const bgState = useBgImageStore.getState();
        this._bgDrag.active    = true;
        this._bgDrag.startWX   = worldX;
        this._bgDrag.startWY   = worldY;
        this._bgDrag.startOffX = bgState.bgOffsetX;
        this._bgDrag.startOffY = bgState.bgOffsetY;
        this.input.setDefaultCursor('move');
        return;
      }

      // 빈 공간 — 선택 해제 + 팬 시작
      if (!isMulti) {
        this._bgSelected = false;
        store.clearSelection();
        tStore.clearTerrainSelection();
      }
      this._startDrag(pointer, cam);
    });

    this.input.on('pointerup', () => {
      // 추출 모드 사각형 확정 (v0.5.0 feature 5)
      if (this._extractDrag.active) {
        this._extractDrag.active = false;
        this._finishExtractRect(cellPx);
      }
      this._drag.active        = false;
      this._facDrag.active     = false;
      this._terrainDrag.active = false;
      this._resizeDrag.active  = false;
      this._resizeDrag.target  = 'fac';
      this._bgDrag.active      = false;
      this._imgLayerDrag.active = false;
      const imgMove = useImageLayerStore.getState().activeMoveId;
      const paletteTypeId = useFacilitiesStore.getState().paletteSelectedTypeId;
      this.input.setDefaultCursor(imgMove ? 'grab' : paletteTypeId ? 'crosshair' : 'default');
    });

    // ── 포인터 이동 ───────────────────────────────────────────
    this.input.on('pointermove', (pointer) => {
      const cam = this.cameras.main;

      // 배경 scale 드래그 (코너 핸들 — 양 축 동일 배율 적용, 비균일 비율 보존)
      if (this._resizeDrag.active && this._resizeDrag.target === 'bg') {
        const rd = this._resizeDrag;
        const dx = pointer.worldX - rd.centerX;
        const dy = pointer.worldY - rd.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = dist / rd.startDist;
        useBgImageStore.getState().setBgScaleXY(
          Phaser.Math.Clamp((rd.startScaleX ?? 1) * f, 0.1, 5.0),
          Phaser.Math.Clamp((rd.startScaleY ?? 1) * f, 0.1, 5.0),
        );
      }

      // 추출 모드 러버밴드 드래그 (v0.5.0 feature 5)
      if (this._extractDrag.active) {
        this._extractDrag.curWX = pointer.worldX;
        this._extractDrag.curWY = pointer.worldY;
        this._drawExtractRubberband(cellPx);
        return;
      }

      // 이미지 레이어 이동 드래그 (v0.5.0 feature 7)
      if (this._imgLayerDrag.active) {
        const dx = pointer.worldX - this._imgLayerDrag.startWX;
        const dy = pointer.worldY - this._imgLayerDrag.startWY;
        useImageLayerStore.getState().setOffset(
          this._imgLayerDrag.id,
          this._imgLayerDrag.startOffX + dx,
          this._imgLayerDrag.startOffY + dy,
        );
        return;
      }

      // 배경 이동 드래그
      if (this._bgDrag.active) {
        const dx = pointer.worldX - this._bgDrag.startWX;
        const dy = pointer.worldY - this._bgDrag.startWY;
        useBgImageStore.getState().setBgOffset(
          this._bgDrag.startOffX + dx,
          this._bgDrag.startOffY + dy,
        );
      }

      // 시설 리사이즈 드래그 (facDrag보다 우선)
      if (this._resizeDrag.active && this._resizeDrag.target === 'fac') {
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
          !this._terrainDrag.active && !this._resizeDrag.active && !this._bgDrag.active) {
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
        if (this._bgSelected && this._bgImageObj) {
          const bgH = this._hitTestBgHandle(pointer.worldX, pointer.worldY);
          if (bgH) {
            const CURSORS = { tl: 'nwse-resize', tr: 'nesw-resize',
                              bl: 'nesw-resize', br: 'nwse-resize' };
            this.input.setDefaultCursor(CURSORS[bgH]);
          } else if (this._isInsideBgImage(pointer.worldX, pointer.worldY)) {
            this.input.setDefaultCursor('move');
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

    // ESC: 배치 모드 해제 + 배경 선택 해제
    this.input.keyboard.on('keydown-ESC', () => {
      if (isTypingInDOM()) return; // 입력창 타이핑 중 오발동 방지 (v0.5.1)
      useFacilitiesStore.getState().setPaletteSelection(null);
      if (this._bgSelected) {
        this._bgSelected = false;
        const fState = useFacilitiesStore.getState();
        this._drawResizeHandles(fState.facilities, fState.selectedIds, cellPx);
      }
      this.input.setDefaultCursor('default');
    });

    // Delete / Backspace: 시설 또는 선택 지형 삭제
    const handleDelete = () => {
      if (isTypingInDOM()) return; // 입력창 타이핑 중 오발동 방지 (v0.5.1)
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
      if (isTypingInDOM()) return; // 입력창 타이핑 중 오발동 방지 (v0.5.1)
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
      if (isTypingInDOM()) return; // 입력창 타이핑 중 오발동 방지 (v0.5.1)
      if (!event.metaKey && !event.ctrlKey) return;
      event.preventDefault();
      const state = useFacilitiesStore.getState();
      if (state.selectedIds.length > 0) state.copySelected();
    });

    // ── 화살표 키: 선택 시설 크기 조정 (v0.5.0 feature 1) ──────────────
    //   ←/→ : 가로(W) ∓ , ↑/↓ : 세로(H) ∓ . Shift 동시 = 5셀 단위(빠르게).
    //   Delete는 삭제 전용 — 크기 조정은 화살표로 분리해 혼동(삭제 확인창) 제거.
    const handleArrowResize = (event, dwUnit, dhUnit) => {
      if (isTypingInDOM()) return; // 입력창 타이핑 중 오발동 방지 (v0.5.1)
      const state = useFacilitiesStore.getState();
      if (state.paletteSelectedTypeId) return;       // 배치 모드 중엔 무시
      if (state.selectedIds.length !== 1) return;    // 단일 선택만
      event.preventDefault();
      const step = (event.shiftKey ? 5 : 1);
      this._resizeSelectedBy(dwUnit * step, dhUnit * step);
    };
    this.input.keyboard.on('keydown-RIGHT', (e) => handleArrowResize(e,  1,  0));
    this.input.keyboard.on('keydown-LEFT',  (e) => handleArrowResize(e, -1,  0));
    this.input.keyboard.on('keydown-DOWN',  (e) => handleArrowResize(e,  0,  1));
    this.input.keyboard.on('keydown-UP',    (e) => handleArrowResize(e,  0, -1));

    this.input.setDefaultCursor('default');

    // ── Scene 정리 ───────────────────────────────────────────
    this.events.on('destroy', () => {
      if (this._storeUnsub)      this._storeUnsub();
      if (this._terrainUnsub)    this._terrainUnsub();
      if (this._importUnsub)     this._importUnsub();
      if (this._bgUnsub)         this._bgUnsub();
      if (this._compareUnsub)    this._compareUnsub();
      if (this._layoutUnsub)     this._layoutUnsub();
      if (this._imgLayerUnsub)   this._imgLayerUnsub();
      if (this._gridUnsub)       this._gridUnsub();
      if (this._extractUnsub)    this._extractUnsub();
      if (this._renderer)        this._renderer.destroy();
      if (this._terrainRend)     this._terrainRend.destroy();
      if (this._ghostRend)       this._ghostRend.destroy();
      if (this._imgLayerRend)    this._imgLayerRend.destroy();
      if (this._boundaryGfx)     this._boundaryGfx.destroy();
      if (this._outsideGfx)      this._outsideGfx.destroy();
      if (this._siteFillGfx)     this._siteFillGfx.destroy();
      if (this._importBndGfx)    this._importBndGfx.destroy();
      if (this._extractGfx)      this._extractGfx.destroy();
      if (this._extractLabel)    this._extractLabel.destroy();
      if (this._resizeHandleGfx) this._resizeHandleGfx.destroy();
      if (this._bgImageObj)      this._bgImageObj.destroy();
      if (this._pulseTween)      { this._pulseTween.stop(); this._pulseTween = null; }
    });
  }

  // ── 헬퍼 ─────────────────────────────────────────────────────────────

  /**
   * 선택된 단일 시설의 크기를 dw/dh(셀)만큼 변경 (v0.5.0 feature 1 — 키보드 리사이즈).
   * 1~200셀 클램프 + 부지 경계 클램프 + AABB 충돌 시 적용 취소.
   */
  _resizeSelectedBy(dw, dh) {
    const store = useFacilitiesStore.getState();
    if (store.selectedIds.length !== 1) return;
    const fac = store.facilities.find((f) => f.id === store.selectedIds[0]);
    if (!fac) return;

    const { siteSize } = store;
    const siteCols = siteSize.widthM  / GRID_CONFIG.cellSize;
    const siteRows = siteSize.heightM / GRID_CONFIG.cellSize;

    let newW = Math.max(1, Math.min(200, fac.size.width  + dw));
    let newH = Math.max(1, Math.min(200, fac.size.height + dh));
    // 부지 경계 클램프 (좌상단 고정 — 우/하단으로만 확장)
    newW = Math.max(1, Math.min(newW, siteCols - fac.position.col));
    newH = Math.max(1, Math.min(newH, siteRows - fac.position.row));

    if (newW === fac.size.width && newH === fac.size.height) return;
    if (checkAABB(store.facilities, [fac.id], fac.position.col, fac.position.row, newW, newH)) return;

    store.updateFacility(fac.id, { size: { width: newW, height: newH } });
  }

  /** 비교(고스트) 레이어 재그리기 — 켜진 레이아웃을 색상별 반투명 오버레이로 (v0.4.2) */
  _renderGhosts(cellPx = this._cellPx) {
    if (!this._ghostRend) return;
    const cmp = useCompareStore.getState();
    const layouts = useLayoutStore.getState().layouts;
    const ghostLayouts = cmp.ghostLayoutIds
      .map((id) => {
        const lo = layouts.find((l) => l.id === id);
        if (!lo) return null;
        const hex = cmp.colorFor(id).replace('#', '');
        return { id, name: lo.name, colorInt: parseInt(hex, 16), facilities: lo.facilities || [] };
      })
      .filter(Boolean);
    this._ghostRend.render(ghostLayouts, cellPx, cmp.ghostOpacity);
  }

  /** 이미지 레이어 재동기화 — 다중 참조 이미지를 사이트 크기에 맞춰 갱신 (v0.4.3) */
  _renderImageLayers() {
    if (!this._imgLayerRend) return;
    const layers = useImageLayerStore.getState().layers;
    const { siteSize } = useFacilitiesStore.getState();
    const siteWpx = (siteSize.widthM  / GRID_CONFIG.cellSize) * this._cellPx;
    const siteHpx = (siteSize.heightM / GRID_CONFIG.cellSize) * this._cellPx;
    this._imgLayerRend.sync(layers, siteWpx, siteHpx);
  }

  /** Tween onUpdate에서 호출 — 현재 store 상태 + 애니 진행값으로 시설 재그리기 */
  _rerenderFacilities() {
    if (!this._renderer) return;
    const s = useFacilitiesStore.getState();
    const siteCols = s.siteSize.widthM  / GRID_CONFIG.cellSize;
    const siteRows = s.siteSize.heightM / GRID_CONFIG.cellSize;
    this._renderer.render(
      s.facilities, s.selectedIds, this._cellPx, siteCols, siteRows,
      s.phaseViewEnabled, s.view2_5d,
      this._facAnim, this._pulse,
    );
    this._drawResizeHandles(s.facilities, s.selectedIds, this._cellPx);
  }

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

    if (this._bgImageObj) {
      const old = this._bgImageObj;
      this._bgImageObj = null;  // 참조 먼저 끊기 (구독 콜백 null 가드 즉시 통과)
      old.destroy();
    }
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
    this._bgSelected = false;
    if (this._bgImageObj) {
      this._bgImageObj.setVisible(false);
      const obj = this._bgImageObj;
      this._bgImageObj = null;  // 참조 먼저 끊기 — _applyBgTransform 가드가 즉시 빠져나감
      obj.destroy();
    }
    const key = '__bg_trace__';
    if (this.textures.exists(key)) this.textures.remove(key);
  }

  /** 배경 표시 크기·위치 계산 (사이트 크기 × bgScaleX/Y, offset 반영 — v0.5.1 축 분리) */
  _applyBgTransform() {
    if (!this._bgImageObj) return;
    const { siteSize } = useFacilitiesStore.getState();
    const { bgScaleX, bgScaleY, bgOffsetX, bgOffsetY } = useBgImageStore.getState();
    const siteW = (siteSize.widthM  / GRID_CONFIG.cellSize) * this._cellPx;
    const siteH = (siteSize.heightM / GRID_CONFIG.cellSize) * this._cellPx;
    this._bgImageObj.setDisplaySize(siteW * bgScaleX, siteH * bgScaleY);
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

    if (selectedIds.length === 1) {
      const fac = facilities.find((f) => f.id === selectedIds[0]);
      if (fac) {
        const hp = this._handlePx();
        const centers = this._getHandleCenters(fac, cellPx);
        Object.values(centers).forEach(({ x, y }) => {
          g.fillStyle(0xffffff, 0.92);
          g.fillRect(x - hp / 2, y - hp / 2, hp, hp);
          g.lineStyle(1.5, 0x222244, 1.0);
          g.strokeRect(x - hp / 2, y - hp / 2, hp, hp);
        });
      }
    }

    if (this._bgSelected && this._bgImageObj) {
      const hp = this._handlePx();
      const obj = this._bgImageObj;
      const centers = this._getBgHandleCenters();
      if (!centers) return;
      g.lineStyle(1.5, 0x00ccff, 0.6);
      g.strokeRect(obj.x, obj.y, obj.displayWidth, obj.displayHeight);
      Object.values(centers).forEach(({ x, y }) => {
        g.fillStyle(0x00ccff, 0.92);
        g.fillRect(x - hp / 2, y - hp / 2, hp, hp);
        g.lineStyle(1.5, 0x004488, 1.0);
        g.strokeRect(x - hp / 2, y - hp / 2, hp, hp);
      });
    }
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

  /** 배경 이미지 4코너의 월드 좌표 반환 */
  _getBgHandleCenters() {
    const obj = this._bgImageObj;
    if (!obj) return null;
    const x = obj.x, y = obj.y;
    const w = obj.displayWidth, h = obj.displayHeight;
    return {
      tl: { x,       y       },
      tr: { x: x + w, y       },
      bl: { x,       y: y + h },
      br: { x: x + w, y: y + h },
    };
  }

  /** 배경 선택 상태에서 코너 핸들 hitTest */
  _hitTestBgHandle(worldX, worldY) {
    if (!this._bgImageObj || !this._bgSelected) return null;
    const hp = this._handlePx();
    const centers = this._getBgHandleCenters();
    for (const [key, { x, y }] of Object.entries(centers)) {
      if (worldX >= x - hp / 2 && worldX <= x + hp / 2 &&
          worldY >= y - hp / 2 && worldY <= y + hp / 2) return key;
    }
    return null;
  }

  /** 월드 좌표가 배경 이미지 영역 안인지 확인 */
  _isInsideBgImage(worldX, worldY) {
    const obj = this._bgImageObj;
    if (!obj) return false;
    return worldX >= obj.x && worldX <= obj.x + obj.displayWidth &&
           worldY >= obj.y && worldY <= obj.y + obj.displayHeight;
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

    // 프리셋 시설은 사용자가 저장한 기본 크기 오버라이드 적용 (v0.5.0 feature 3)
    const eff = FACILITY_DEFAULTS[typeId]
      ? effectiveDefaultSize(typeId, def.width, def.height)
      : { width: def.width, height: def.height };

    const { siteSize } = store;
    const siteCols = siteSize.widthM  / GRID_CONFIG.cellSize;
    const siteRows = siteSize.heightM / GRID_CONFIG.cellSize;

    const clickedCol = Math.floor(worldX / cellPx);
    const clickedRow = Math.floor(worldY / cellPx);

    const rawCol = clickedCol - Math.floor(eff.width  / 2);
    const rawRow = clickedRow - Math.floor(eff.height / 2);
    const col = Math.max(0, Math.min(rawCol, siteCols - eff.width));
    const row = Math.max(0, Math.min(rawRow, siteRows - eff.height));

    const count = store.facilities.filter((f) => f.typeId === typeId).length;

    store.addFacility({
      id:        `${typeId}_${Date.now()}`,
      typeId,
      name:      `${def.baseName} #${count + 1}`,
      abbrev:    def.abbrev,
      confirmed: def.confirmed,
      source:    def.source,
      position:  { col, row },
      size:      { width: eff.width, height: eff.height },
      color:     def.color,
      capacity:  def.capacity || '',
      notes:     '',
      phase:     1,   // 기본 Phase 1
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  추출 모드 (v0.5.0 feature 5)
  // ══════════════════════════════════════════════════════════════

  /** 드래그 중 사각형을 격자에 스냅해 미리보기로 그린다 + 치수 라벨 */
  _drawExtractRubberband(cellPx) {
    const g = this._extractGfx;
    if (!g) return;
    const d = this._extractDrag;
    const { col, row, w, h } = this._extractCellsFromDrag(cellPx);

    const x = col * cellPx, y = row * cellPx;
    const pw = w * cellPx, ph = h * cellPx;

    g.clear();
    g.fillStyle(0x33ddbb, 0.18);
    g.fillRect(x, y, pw, ph);
    g.lineStyle(2, 0x33ddbb, 0.95);
    g.strokeRect(x, y, pw, ph);

    // 치수 라벨 (m)
    const wM = w * GRID_CONFIG.cellSize;
    const hM = h * GRID_CONFIG.cellSize;
    if (!this._extractLabel) {
      this._extractLabel = this.add.text(0, 0, '', {
        fontFamily: 'Courier New, monospace', fontSize: '12px',
        color: '#062018', backgroundColor: '#33ddbb', padding: { x: 4, y: 2 },
      }).setDepth(14).setResolution(3);
    }
    this._extractLabel.setText(`${wM}m × ${hM}m`);
    this._extractLabel.setPosition(x, y - 18);
    this._extractLabel.setVisible(true);
    void d;
  }

  /** 드래그 시작/현재 좌표 → 격자 셀(col,row,w,h)로 변환 (부지 안으로 클램프) */
  _extractCellsFromDrag(cellPx) {
    const d = this._extractDrag;
    const minX = Math.min(d.startWX, d.curWX);
    const maxX = Math.max(d.startWX, d.curWX);
    const minY = Math.min(d.startWY, d.curWY);
    const maxY = Math.max(d.startWY, d.curWY);
    return this._worldRectToCells(minX, minY, maxX, maxY, cellPx);
  }

  /** 월드 사각형 → 격자 셀(col,row,w,h), 부지 경계로 클램프 */
  _worldRectToCells(minX, minY, maxX, maxY, cellPx) {
    const { siteSize } = useFacilitiesStore.getState();
    const siteCols = Math.round(siteSize.widthM  / GRID_CONFIG.cellSize);
    const siteRows = Math.round(siteSize.heightM / GRID_CONFIG.cellSize);

    let col0 = Math.floor(minX / cellPx);
    let row0 = Math.floor(minY / cellPx);
    let col1 = Math.ceil(maxX / cellPx);
    let row1 = Math.ceil(maxY / cellPx);

    col0 = Math.max(0, Math.min(col0, siteCols - 1));
    row0 = Math.max(0, Math.min(row0, siteRows - 1));
    col1 = Math.max(col0 + 1, Math.min(col1, siteCols));
    row1 = Math.max(row0 + 1, Math.min(row1, siteRows));

    return { col: col0, row: row0, w: col1 - col0, h: row1 - row0 };
  }

  /** 러버밴드 확정 → 시설 생성 */
  _finishExtractRect(cellPx) {
    const g = this._extractGfx;
    if (g) g.clear();
    if (this._extractLabel) this._extractLabel.setVisible(false);

    const { col, row, w, h } = this._extractCellsFromDrag(cellPx);
    if (w < 1 || h < 1) return;
    // 너무 작은(우발적 클릭) 사각형 무시
    if (w * cellPx < 4 && h * cellPx < 4) return;

    this._createExtractedFacility(col, row, w, h);
  }

  /** 추출 결과를 커스텀 시설(미확정)로 보드에 배치 */
  _createExtractedFacility(col, row, w, h) {
    const store = useFacilitiesStore.getState();
    const wM = w * GRID_CONFIG.cellSize;
    const hM = h * GRID_CONFIG.cellSize;
    const name = window.prompt(`추출한 시설 이름 (${wM}m × ${hM}m)`, '추출 시설');
    if (name == null) return; // 취소
    const finalName = name.trim() || '추출 시설';
    const count = store.facilities.filter((f) => f.typeId === 'extract').length;

    store.addFacility({
      id:        `extract_${Date.now()}`,
      typeId:    'extract',
      name:      finalName === '추출 시설' ? `추출 시설 #${count + 1}` : finalName,
      abbrev:    finalName.slice(0, 4),
      confirmed: false,           // 추출 = 미확정(회색) — 사용자가 확인 필요
      source:    'image-extract',
      position:  { col, row },
      size:      { width: w, height: h },
      color:     '#33ddbb',
      capacity:  '',
      notes:     `이미지 추출 (${wM}m × ${hM}m)`,
      phase:     1,
    });
  }

  /** 화면에 보이는 최상단(배열 마지막) 이미지 레이어 반환, 없으면 null */
  _topVisibleLayer() {
    const layers = useImageLayerStore.getState().layers;
    for (let i = layers.length - 1; i >= 0; i--) {
      if (layers[i].visible !== false) return layers[i];
    }
    return null;
  }

  /** 레이어가 화면에 그려지는 월드 사각형 {x,y,w,h} */
  _layerWorldRect(layer) {
    const { siteSize } = useFacilitiesStore.getState();
    const siteWpx = (siteSize.widthM  / GRID_CONFIG.cellSize) * this._cellPx;
    const siteHpx = (siteSize.heightM / GRID_CONFIG.cellSize) * this._cellPx;
    const sx = layer.scaleX ?? layer.scale ?? 1;
    const sy = layer.scaleY ?? layer.scale ?? 1;
    return {
      x: layer.offsetX,
      y: layer.offsetY,
      w: siteWpx * sx,
      h: siteHpx * sy,
    };
  }

  /**
   * 레이어 dataUrl을 offscreen canvas로 디코드해 픽셀 접근 준비.
   * 캐시 히트 시 즉시 cb, 미스 시 비동기 디코드 후 cb. 실패 시 cb(null).
   * 보안(헌법 0조): 전부 로컬 canvas 처리, 외부 전송 없음.
   */
  _ensureExtractCanvas(layer, cb) {
    const cache = this._extractCanvas;
    if (cache && cache.dataUrl === layer.dataUrl) { cb(cache); return; }
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const info = {
          dataUrl: layer.dataUrl, canvas: c, ctx,
          w: c.width, h: c.height,
          data: ctx.getImageData(0, 0, c.width, c.height).data,
        };
        this._extractCanvas = info;
        cb(info);
      } catch (e) {
        console.warn('[extract] 픽셀 디코드 실패:', e?.name || e);
        cb(null);
      }
    };
    img.onerror = () => cb(null);
    img.src = layer.dataUrl;
  }

  /**
   * 자동 인식: 클릭 지점의 색과 연결된 동일색 영역(flood-fill)의
   * 바운딩 박스를 시설로 추출.
   */
  _autoExtractAt(worldX, worldY, cellPx) {
    const layer = this._topVisibleLayer();
    if (!layer) {
      window.alert('자동 인식하려면 먼저 이미지 레이어를 올리고 켜 주세요.');
      return;
    }
    const rect = this._layerWorldRect(layer);
    if (worldX < rect.x || worldX > rect.x + rect.w ||
        worldY < rect.y || worldY > rect.y + rect.h) {
      return; // 이미지 밖 클릭
    }

    this._ensureExtractCanvas(layer, (info) => {
      if (!info) return;
      const { w: natW, h: natH, data } = info;
      const u = (worldX - rect.x) / rect.w;
      const v = (worldY - rect.y) / rect.h;
      const sx = Math.max(0, Math.min(natW - 1, Math.floor(u * natW)));
      const sy = Math.max(0, Math.min(natH - 1, Math.floor(v * natH)));

      const bbox = this._floodFillBBox(data, natW, natH, sx, sy, 36);
      if (!bbox) return;

      // 영역이 이미지 거의 전체면(배경 클릭) 무시
      const areaFrac = ((bbox.maxX - bbox.minX + 1) * (bbox.maxY - bbox.minY + 1)) / (natW * natH);
      if (areaFrac > 0.9) {
        window.alert('배경으로 보이는 큰 영역입니다. 시설(건물) 안쪽을 클릭해 주세요.');
        return;
      }

      // 이미지 px bbox → 월드 → 셀
      const bx0 = rect.x + (bbox.minX       / natW) * rect.w;
      const bx1 = rect.x + ((bbox.maxX + 1) / natW) * rect.w;
      const by0 = rect.y + (bbox.minY       / natH) * rect.h;
      const by1 = rect.y + ((bbox.maxY + 1) / natH) * rect.h;

      const { col, row, w, h } = this._worldRectToCells(bx0, by0, bx1, by1, cellPx);
      if (w < 1 || h < 1) return;
      this._createExtractedFacility(col, row, w, h);
    });
  }

  /**
   * 4방향 flood-fill로 (sx,sy)와 색이 비슷한 연결 영역의 바운딩 박스 계산.
   * @param {Uint8ClampedArray} data  RGBA
   * @param {number} tol  채널별 허용 색 차(합산 기준)
   * @returns {{minX,minY,maxX,maxY}|null}
   */
  _floodFillBBox(data, w, h, sx, sy, tol) {
    const idx0 = (sy * w + sx) * 4;
    const tr = data[idx0], tg = data[idx0 + 1], tb = data[idx0 + 2];
    const visited = new Uint8Array(w * h);
    const stack = [sy * w + sx];
    visited[sy * w + sx] = 1;
    let minX = sx, maxX = sx, minY = sy, maxY = sy;
    let guard = 0;
    const maxIter = w * h;

    while (stack.length) {
      if (++guard > maxIter) break;
      const p = stack.pop();
      const px = p % w;
      const py = (p - px) / w;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;

      const neighbors = [
        px > 0     ? p - 1 : -1,
        px < w - 1 ? p + 1 : -1,
        py > 0     ? p - w : -1,
        py < h - 1 ? p + w : -1,
      ];
      for (const np of neighbors) {
        if (np < 0 || visited[np]) continue;
        const di = np * 4;
        const diff = Math.abs(data[di] - tr) + Math.abs(data[di + 1] - tg) + Math.abs(data[di + 2] - tb);
        if (diff <= tol * 3) {
          visited[np] = 1;
          stack.push(np);
        }
      }
    }

    if (maxX - minX < 1 && maxY - minY < 1) return null;
    return { minX, minY, maxX, maxY };
  }

  /**
   * 부지 경계 자동 생성: 최상단 이미지의 "내용 영역"(배경 여백 제외)
   * 바운딩 박스를 부지 격자(0,0)~(siteW,siteH)에 맞춰 정렬한다.
   * (미터 환산은 알 수 없으므로 부지 크기는 유지하고 이미지를 격자에 맞춤)
   */
  _autoGenerateSite() {
    const layer = this._topVisibleLayer();
    if (!layer) {
      window.alert('부지 경계를 자동 생성하려면 먼저 부지 이미지를 올리고 켜 주세요.');
      return;
    }
    this._ensureExtractCanvas(layer, (info) => {
      if (!info) return;
      const { w: natW, h: natH, data } = info;

      // 내용 bbox: 흰/투명 배경이 아닌 픽셀의 범위
      let minX = natW, minY = natH, maxX = -1, maxY = -1;
      const step = Math.max(1, Math.floor(Math.min(natW, natH) / 600)); // 대형 이미지 샘플링
      for (let y = 0; y < natH; y += step) {
        for (let x = 0; x < natW; x += step) {
          const di = (y * natW + x) * 4;
          const alpha = data[di + 3];
          const r = data[di], g = data[di + 1], b = data[di + 2];
          const nearWhite = r > 244 && g > 244 && b > 244;
          if (alpha > 16 && !nearWhite) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) {
        window.alert('이미지에서 내용 영역을 찾지 못했습니다.');
        return;
      }

      const cbW = Math.max(1, maxX - minX + 1);
      const { siteSize } = useFacilitiesStore.getState();
      const siteWpx = (siteSize.widthM  / GRID_CONFIG.cellSize) * this._cellPx;
      const siteHpx = (siteSize.heightM / GRID_CONFIG.cellSize) * this._cellPx;

      // 가로 기준 fit: 내용 폭이 부지 폭과 같아지도록 uniform scale
      const scale = natW / cbW;
      const offsetX = -(minX / natW) * siteWpx * scale;
      const offsetY = -(minY / natH) * siteHpx * scale;

      const imgStore = useImageLayerStore.getState();
      imgStore.setScale(layer.id, scale);
      imgStore.setOffset(layer.id, offsetX, offsetY);
      void siteHpx;
    });
  }
}
