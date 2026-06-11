/**
 * 배경 트레이싱 이미지 상태 (v0.2.8.5 → v0.5.1)
 *
 * v0.5.1: bgScale(균일) → bgScaleX/bgScaleY 분리 (가로만/세로만 늘리기).
 *   setBgScale(v)은 양 축 동시 설정(비율 고정·초기화 용도)으로 유지.
 *
 * 보안 (헌법 0조 부칙):
 *   - bgImageDataUrl: File API → FileReader로 로컬 읽기. 외부 전송 구조 없음.
 *   - localStorage 저장 안 함 (대용량 data URL 직렬화 불필요).
 *   - 외부 AI 비전 API 호출 코드 없음 — 구조적 차단.
 */
import { create } from 'zustand';

const clampScale = (v) => Math.max(0.1, Math.min(5.0, v));

export const useBgImageStore = create((set) => ({
  /** base64 data URL (null = 이미지 없음) */
  bgImageDataUrl: null,
  /** 배경 이미지 불투명도 0.0~1.0 */
  bgOpacity: 0.7,
  /** 배경 가로 배율 (사이트 크기 대비) */
  bgScaleX: 1.0,
  /** 배경 세로 배율 (사이트 크기 대비) */
  bgScaleY: 1.0,
  /** 배경 가로 오프셋(px, 월드 좌표) */
  bgOffsetX: 0,
  /** 배경 세로 오프셋(px, 월드 좌표) */
  bgOffsetY: 0,

  setBgImage:   (dataUrl) => set({ bgImageDataUrl: dataUrl }),
  clearBgImage: () => set({ bgImageDataUrl: null, bgScaleX: 1.0, bgScaleY: 1.0, bgOffsetX: 0, bgOffsetY: 0 }),
  setBgOpacity: (v) => set({ bgOpacity: Math.max(0, Math.min(1, v)) }),
  /** 균일 — 양 축 동시 (비율 고정 / 초기화) */
  setBgScale:   (v) => set({ bgScaleX: clampScale(v), bgScaleY: clampScale(v) }),
  /** 양 축 개별 동시 설정 (코너 핸들 드래그 — 비균일 비율 보존) */
  setBgScaleXY: (x, y) => set({ bgScaleX: clampScale(x), bgScaleY: clampScale(y) }),
  /** 한 축만 (v0.5.1 — 가로만/세로만). axis: 'x' | 'y' */
  setBgScaleAxis: (axis, v) =>
    set(axis === 'y' ? { bgScaleY: clampScale(v) } : { bgScaleX: clampScale(v) }),
  setBgOffset:  (x, y) => set({ bgOffsetX: x, bgOffsetY: y }),
}));
