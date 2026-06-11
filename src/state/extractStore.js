/**
 * 이미지 추출 모드 상태 — v0.5.0 (feature 5)
 *
 * 참조 이미지 위에서 시설/부지를 "추출"하는 전용 상호작용 모드.
 * 일반 배치·선택과 마우스/키보드 충돌을 피하려고 별도 모드로 분리한다.
 *
 * - extractMode: 켜져 있을 때만 캔버스가 추출 제스처를 받는다 (세션 전용, 영속 안 함).
 * - extractTool:
 *     'rect' — 드래그로 사각형을 그려 그 크기의 커스텀 시설 생성
 *     'auto' — 클릭 시 같은 색 영역을 자동 인식(flood-fill)하여 시설 생성
 *
 * 보안 (헌법 0조 부칙): 픽셀 분석은 전부 로컬 canvas getImageData로만 수행.
 *   외부 비전 API 호출 없음 — 구조적 차단.
 */
import { create } from 'zustand';

export const useExtractStore = create((set) => ({
  extractMode: false,
  extractTool: 'rect', // 'rect' | 'auto'

  /**
   * 부지 경계 자동 생성 요청 카운터(논스).
   * 패널이 증가시키면 GridScene 구독자가 1회성 명령으로 받아 실행한다.
   * (값 자체는 의미 없음 — 변화만 신호)
   */
  autoSiteNonce: 0,

  setExtractMode: (on) => set({ extractMode: !!on }),
  toggleExtractMode: () => set((s) => ({ extractMode: !s.extractMode })),
  setExtractTool: (tool) => set({ extractTool: tool === 'auto' ? 'auto' : 'rect' }),
  requestAutoSite: () => set((s) => ({ autoSiteNonce: s.autoSiteNonce + 1 })),
}));
