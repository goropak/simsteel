import { create } from 'zustand';
import { GRID_CONFIG } from '../phaser/config.js';

const LS_KEY = 'simsteel:custom-facilities';

/** localStorage에서 커스텀 시설 목록 로드 */
function loadCustomFacilities() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

/** localStorage에 커스텀 시설 목록 저장 */
function saveCustomFacilities(list) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

/**
 * AABB 충돌 검사 헬퍼 (GridScene의 checkAABB와 동일 로직)
 * excludeIds: 검사에서 제외할 시설 ID 집합
 */
function aabbOverlaps(facilities, excludeIds, col, row, w, h) {
  const exSet = new Set(excludeIds);
  for (const fac of facilities) {
    if (exSet.has(fac.id)) continue;
    if (
      col < fac.position.col + fac.size.width &&
      col + w > fac.position.col &&
      row < fac.position.row + fac.size.height &&
      row + h > fac.position.row
    ) return true;
  }
  return false;
}

/**
 * 배치된 시설 목록 + UI 선택 상태 + 부지 크기 + 커스텀 시설 정의.
 *
 * selectedIds: string[]  — 다중 선택 지원 (Cmd+클릭)
 * siteSize: { widthM, heightM } — 미터 단위 부지 크기 (동적 변경 가능)
 * customFacilities: 사용자 정의 시설 팔레트 항목 (localStorage 영속)
 */
export const useFacilitiesStore = create((set, get) => ({
  facilities: [],
  selectedIds: [],
  paletteSelectedTypeId: null,

  // 부지 크기 (기본: 2,000m × 2,000m)
  siteSize: {
    widthM:  GRID_CONFIG.phase1Width  * GRID_CONFIG.cellSize,
    heightM: GRID_CONFIG.phase1Height * GRID_CONFIG.cellSize,
  },

  // ── 사용자 정의 시설 (localStorage 영속) ─────────────────────────────
  // 보안: localStorage 전용, 서버 전송 0줄 (헌법 0조 부칙 — 구조로 보장)
  customFacilities: loadCustomFacilities(),

  /**
   * 새 커스텀 시설 정의 추가.
   * @param {{ name, width, height, label?, color?, categoryId? }} def
   *   categoryId: 'custom'(기본) 또는 기존 프리셋 카테고리 id(예: 'ironmaking').
   *   feature 2 — 같은 공정의 추가 인스턴스는 기존 카테고리 아래에 중첩.
   * @returns 생성된 항목
   */
  addCustomFacility: (def) => {
    const item = {
      id:        crypto.randomUUID(),
      name:      def.name.trim(),
      width:     Math.max(1, Math.min(200, def.width)),
      height:    Math.max(1, Math.min(200, def.height)),
      category:  def.categoryId || 'custom',
      label:     def.label?.trim().slice(0, 4) || def.name.trim().slice(0, 3).toUpperCase(),
      color:     def.color || '#6b9fff',
      source:    'user-defined',
      confirmed: false,   // 커스텀 시설 = 미확정 (회색 표시)
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const updated = [...state.customFacilities, item];
      saveCustomFacilities(updated);
      return { customFacilities: updated };
    });
    return item;
  },

  /**
   * 여러 커스텀 시설 정의를 한 번에 추가 (엑셀 일괄 입력용 — v0.4.1).
   * N회 localStorage 쓰기/리렌더 대신 1회로 묶는다.
   * @param {Array<{ name, width, height, label?, color?, categoryId? }>} defs
   * @returns 생성된 항목 배열
   */
  addCustomFacilities: (defs) => {
    const items = defs.map((def) => ({
      id:        crypto.randomUUID(),
      name:      String(def.name).trim(),
      width:     Math.max(1, Math.min(200, def.width)),
      height:    Math.max(1, Math.min(200, def.height)),
      category:  def.categoryId || 'custom',
      label:     def.label?.trim().slice(0, 4) || String(def.name).trim().slice(0, 3).toUpperCase(),
      color:     def.color || '#6b9fff',
      source:    'user-defined',
      confirmed: false,
      createdAt: new Date().toISOString(),
    }));
    set((state) => {
      const updated = [...state.customFacilities, ...items];
      saveCustomFacilities(updated);
      return { customFacilities: updated };
    });
    return items;
  },

  /** 커스텀 시설 정의 삭제 (배치된 인스턴스는 값 복사라 영향 없음) */
  deleteCustomFacility: (id) => {
    set((state) => {
      const updated = state.customFacilities.filter((f) => f.id !== id);
      saveCustomFacilities(updated);
      return { customFacilities: updated };
    });
  },

  setSiteSize: (widthM, heightM) =>
    set({ siteSize: { widthM: Math.max(100, widthM), heightM: Math.max(100, heightM) } }),

  // ── Phase 뷰 토글 ───────────────────────────────────────────────────
  phaseViewEnabled: false,
  togglePhaseView: () => set((s) => ({ phaseViewEnabled: !s.phaseViewEnabled })),

  view2_5d: false,
  setView2_5d: (v) => set({ view2_5d: v }),

  animEnabled: true,
  setAnimEnabled: (v) => set({ animEnabled: v }),

  // ── 배치 시설 CRUD ───────────────────────────────────────────────────
  addFacility: (facility) =>
    set((state) => ({ facilities: [...state.facilities, facility] })),

  updateFacility: (id, changes) =>
    set((state) => ({
      facilities: state.facilities.map((f) =>
        f.id === id ? { ...f, ...changes } : f
      ),
    })),

  removeFacility: (id) =>
    set((state) => ({
      facilities: state.facilities.filter((f) => f.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    })),

  deleteSelected: () =>
    set((state) => ({
      facilities: state.facilities.filter(
        (f) => !state.selectedIds.includes(f.id)
      ),
      selectedIds: [],
    })),

  copySelected: () =>
    set((state) => {
      const findFreePosition = (fac, existingFacilities, excludeId) => {
        const others = existingFacilities.filter((f) => f.id !== excludeId);
        for (let delta = 1; delta <= 20; delta++) {
          const col = fac.position.col + delta;
          const row = fac.position.row + delta;
          const overlaps = others.some(
            (o) =>
              col < o.position.col + o.size.width &&
              col + fac.size.width > o.position.col &&
              row < o.position.row + o.size.height &&
              row + fac.size.height > o.position.row
          );
          if (!overlaps) return { col, row };
        }
        return { col: fac.position.col + 5, row: fac.position.row + 5 };
      };

      const copies = state.selectedIds
        .map((id) => state.facilities.find((f) => f.id === id))
        .filter(Boolean)
        .map((fac) => {
          const pos = findFreePosition(fac, state.facilities, fac.id);
          return {
            ...fac,
            id: `${fac.typeId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: fac.name + ' (복사)',
            position: pos,
          };
        });
      return {
        facilities: [...state.facilities, ...copies],
        selectedIds: copies.map((f) => f.id),
      };
    }),

  // 선택된 시설 90도 회전 (가로/세로 swap — 사전 검사 없이 직접 적용)
  rotateSelected: () =>
    set((state) => ({
      facilities: state.facilities.map((f) =>
        state.selectedIds.includes(f.id)
          ? { ...f, size: { width: f.size.height, height: f.size.width } }
          : f
      ),
    })),

  /**
   * 선택된 시설 90도 회전 — 제약 없이 적용 (부지 경계 초과·겹침 허용).
   * R키 핸들러 및 회전 버튼 공통 사용. 경계 밖이면 렌더러가 빨간 테두리로 경고만 표시.
   * @returns {boolean} 항상 true (선택이 있으면)
   */
  tryRotateSelected: () => {
    const state = get();
    if (state.selectedIds.length === 0) return false;
    set((s) => ({
      facilities: s.facilities.map((f) =>
        s.selectedIds.includes(f.id)
          ? { ...f, size: { width: f.size.height, height: f.size.width } }
          : f
      ),
    }));
    return true;
  },

  // ── 선택 ────────────────────────────────────────────────────────────
  selectFacility: (id, multi = false) =>
    set((state) => {
      if (multi) {
        const exists = state.selectedIds.includes(id);
        return {
          selectedIds: exists
            ? state.selectedIds.filter((sid) => sid !== id)
            : [...state.selectedIds, id],
        };
      }
      return { selectedIds: [id] };
    }),

  clearSelection: () => set({ selectedIds: [] }),

  setPaletteSelection: (typeId) => set({ paletteSelectedTypeId: typeId }),
}));
