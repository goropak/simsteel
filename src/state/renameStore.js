/**
 * 맵 위 인라인 이름 편집 상태 — v0.5.1 (대통령 요청 #2)
 *
 * window.prompt 대신 Finder 폴더 이름 변경 UX:
 * GridScene이 더블클릭 시 시설의 화면 좌표(rect)를 계산해 open,
 * GridCanvas 안의 InlineRenameInput이 그 자리에 DOM input을 띄운다.
 *
 * target: null | { facId, name, left, top, width, height }
 *   left/top/width/height — 캔버스 컨테이너 기준 화면 px (카메라 변환 적용 후)
 */
import { create } from 'zustand';

export const useRenameStore = create((set) => ({
  target: null,
  openRename: (target) => set({ target }),
  closeRename: () => set({ target: null }),
}));
