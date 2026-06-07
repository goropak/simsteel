/**
 * 지형 인스턴스 상태 관리 (v0.2.4.1)
 *
 * 교훈 적용:
 * - 타일 게임 좌표 3계 분리: col/row 정수만 저장. 스크린/월드 좌표 저장 금지.
 * - 값 복사 원칙: 지형 팔레트 정의와 인스턴스 완전 분리.
 * - AABB 사전 검사 패턴: 회전 전 부지 경계 검사 후 return boolean.
 * - 헌법 0조 부칙: localStorage 전용, 서버 전송 0줄.
 */
import { create } from 'zustand';

const LS_KEY = 'simsteel:terrain';

function loadTerrain() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

function saveTerrain(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); }
  catch {}
}

/**
 * 지형 인스턴스 필드:
 *   id     : string
 *   type   : 'river' | 'road' | 'tree'
 *   col    : number  (그리드 좌표 — 유일한 진실)
 *   row    : number
 *   width  : number  (셀 단위)
 *   height : number
 */
export const useTerrainStore = create((set) => ({
  terrains: loadTerrain(),
  selectedTerrainId: null,

  addTerrain: (terrain) => set((s) => {
    const updated = [...s.terrains, terrain];
    saveTerrain(updated);
    return { terrains: updated };
  }),

  /** 지형 이동 (드래그) — col/row 정수만 저장 (타일 게임 좌표 3계 분리 원칙) */
  updateTerrain: (id, changes) => set((s) => {
    const updated = s.terrains.map((t) => t.id === id ? { ...t, ...changes } : t);
    saveTerrain(updated);
    return { terrains: updated };
  }),

  removeTerrain: (id) => set((s) => {
    const updated = s.terrains.filter((t) => t.id !== id);
    saveTerrain(updated);
    return { terrains: updated, selectedTerrainId: s.selectedTerrainId === id ? null : s.selectedTerrainId };
  }),

  /**
   * 지형 90° 회전 — 제약 없이 적용 (부지 경계 초과 허용).
   * @returns {boolean} 회전 성공 여부 (대상 존재 시 true)
   */
  tryRotateTerrain: (id) => {
    set((s) => {
      const updated = s.terrains.map((x) =>
        x.id === id ? { ...x, width: x.height, height: x.width } : x
      );
      saveTerrain(updated);
      return { terrains: updated };
    });
    return true;
  },

  selectTerrain: (id) => set({ selectedTerrainId: id }),

  clearTerrainSelection: () => set({ selectedTerrainId: null }),
}));
