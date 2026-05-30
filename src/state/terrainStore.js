/**
 * 지형 인스턴스 상태 관리 (v0.2.4)
 *
 * 교훈 적용:
 * - 타일 게임 좌표 3계 분리: col/row 정수만 저장. 스크린/월드 좌표 저장 금지.
 * - 값 복사 원칙: 지형 팔레트 정의와 인스턴스 완전 분리.
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

  removeTerrain: (id) => set((s) => {
    const updated = s.terrains.filter((t) => t.id !== id);
    saveTerrain(updated);
    return { terrains: updated, selectedTerrainId: s.selectedTerrainId === id ? null : s.selectedTerrainId };
  }),

  selectTerrain: (id) => set({ selectedTerrainId: id }),

  clearTerrainSelection: () => set({ selectedTerrainId: null }),
}));
