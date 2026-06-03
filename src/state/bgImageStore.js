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

  setBgImage:     (dataUrl) => set({ bgImageDataUrl: dataUrl }),
  clearBgImage:   ()        => set({ bgImageDataUrl: null }),
  setBgOpacity:   (v) => set({ bgOpacity:   Math.max(0, Math.min(1, v)) }),
  setGridOpacity: (v) => set({ gridOpacity: Math.max(0, Math.min(1, v)) }),
}));
