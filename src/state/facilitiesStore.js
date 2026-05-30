import { create } from 'zustand';
import { GRID_CONFIG } from '../phaser/config.js';

/**
 * 배치된 시설 목록 + UI 선택 상태 + 부지 크기.
 *
 * selectedIds: string[]  — 다중 선택 지원 (Cmd+클릭)
 * siteSize: { widthM, heightM } — 미터 단위 부지 크기 (동적 변경 가능)
 */
export const useFacilitiesStore = create((set, get) => ({
  facilities: [],
  selectedIds: [],            // 단일/다중 선택 통합
  paletteSelectedTypeId: null,

  // 부지 크기 (기본: 2,000m × 2,000m — Phase 1 기본값)
  siteSize: {
    widthM:  GRID_CONFIG.phase1Width  * GRID_CONFIG.cellSize,
    heightM: GRID_CONFIG.phase1Height * GRID_CONFIG.cellSize,
  },

  setSiteSize: (widthM, heightM) =>
    set({ siteSize: { widthM: Math.max(100, widthM), heightM: Math.max(100, heightM) } }),

  // ── CRUD ────────────────────────────────────────────────────────────
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

  // 선택된 시설 전체 삭제
  deleteSelected: () =>
    set((state) => ({
      facilities: state.facilities.filter(
        (f) => !state.selectedIds.includes(f.id)
      ),
      selectedIds: [],
    })),

  // 선택된 시설 복사 (+5셀 오프셋)
  copySelected: () =>
    set((state) => {
      const copies = state.selectedIds
        .map((id) => state.facilities.find((f) => f.id === id))
        .filter(Boolean)
        .map((fac) => ({
          ...fac,
          id: `${fac.typeId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: fac.name + ' (복사)',
          position: { col: fac.position.col + 5, row: fac.position.row + 5 },
        }));
      return {
        facilities: [...state.facilities, ...copies],
        selectedIds: copies.map((f) => f.id),
      };
    }),

  // ── 선택 ────────────────────────────────────────────────────────────
  /**
   * @param {string}  id
   * @param {boolean} multi  Cmd/Ctrl 키를 누른 상태면 true → 토글 추가
   */
  selectFacility: (id, multi = false) =>
    set((state) => {
      if (multi) {
        // 이미 있으면 제거, 없으면 추가
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
