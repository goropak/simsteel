/**
 * 레이아웃 비교(고스트 오버레이) 상태 — v0.4.2 (feature 5)
 *
 * 저장된 레이아웃을 보드 위에 반투명 고스트로 겹쳐 비교한다.
 * 비교는 "읽기전용" — 활성(현재) 레이아웃만 편집 가능, 고스트는 시각 참조.
 *
 * 영속 안 함(세션 한정 비교) — 의도적으로 localStorage/번들 제외.
 */
import { create } from 'zustand';

/** 고스트별 구분 색상 (인덱스 순환) */
export const GHOST_COLORS = ['#ff8c42', '#42c0ff', '#b06bff', '#42ffa0', '#ff5fa2', '#ffe14a'];

export const useCompareStore = create((set, get) => ({
  ghostLayoutIds: [],   // 고스트로 표시 중인 레이아웃 id 배열
  ghostOpacity: 0.30,

  toggleGhost: (id) =>
    set((s) => ({
      ghostLayoutIds: s.ghostLayoutIds.includes(id)
        ? s.ghostLayoutIds.filter((x) => x !== id)
        : [...s.ghostLayoutIds, id],
    })),

  clearGhosts: () => set({ ghostLayoutIds: [] }),

  setGhostOpacity: (v) => set({ ghostOpacity: Math.max(0.05, Math.min(0.8, v)) }),

  /** id로 고스트 색상 결정 (켜진 순서 기준) */
  colorFor: (id) => {
    const idx = get().ghostLayoutIds.indexOf(id);
    return idx < 0 ? GHOST_COLORS[0] : GHOST_COLORS[idx % GHOST_COLORS.length];
  },
}));
