/**
 * 배경 트레이싱 이미지 상태 (v0.2.8.5)
 *
 * 보안 (헌법 0조 부칙):
 *   - bgImageDataUrl: File API → FileReader로 로컬 읽기. 외부 전송 구조 없음.
 *   - localStorage 저장 안 함 (대용량 data URL 직렬화 불필요).
 *   - 외부 AI 비전 API 호출 코드 없음 — 구조적 차단.
 */
import { create } from 'zustand';

export const useBgImageStore = create((set) => ({
  /** base64 data URL (null = 이미지 없음) */
  bgImageDataUrl: null,
  /** 배경 이미지 불투명도 0.0~1.0 */
  bgOpacity: 0.7,
  /** 격자 불투명도 0.0~1.0 (배경 모드에서 낮추면 배경이 더 잘 보임) */
  gridOpacity: 1.0,
  /** 배경 가로 배율 (사이트 폭 대비) — 세로와 독립 → 비율 자유 조정 */
  bgScaleX: 1.0,
  /** 배경 세로 배율 (사이트 높이 대비) */
  bgScaleY: 1.0,
  /** 배경 가로 오프셋(px, 월드 좌표) */
  bgOffsetX: 0,
  /** 배경 세로 오프셋(px, 월드 좌표) */
  bgOffsetY: 0,
  /** 잠금 시 이미지가 클릭/리사이즈를 가로채지 않음 → 시설 편집 우선 (보이기는 유지) */
  bgLocked: false,

  setBgImage:     (dataUrl) => set({ bgImageDataUrl: dataUrl }),
  clearBgImage:   ()        => set({ bgImageDataUrl: null, bgScaleX: 1.0, bgScaleY: 1.0, bgOffsetX: 0, bgOffsetY: 0, bgLocked: false }),
  setBgOpacity:   (v) => set({ bgOpacity:   Math.max(0, Math.min(1, v)) }),
  setGridOpacity: (v) => set({ gridOpacity: Math.max(0, Math.min(1, v)) }),
  /** 균일 배율 (초기화 버튼용) — X·Y 동시 설정 */
  setBgScale:     (v) => set({ bgScaleX: v, bgScaleY: v }),
  setBgScaleX:    (v) => set({ bgScaleX: Math.max(0.05, v) }),
  setBgScaleY:    (v) => set({ bgScaleY: Math.max(0.05, v) }),
  setBgScaleXY:   (x, y) => set({ bgScaleX: Math.max(0.05, x), bgScaleY: Math.max(0.05, y) }),
  setBgOffset:    (x, y) => set({ bgOffsetX: x, bgOffsetY: y }),
  setBgLocked:    (v) => set({ bgLocked: !!v }),
  toggleBgLock:   () => set((s) => ({ bgLocked: !s.bgLocked })),
}));
