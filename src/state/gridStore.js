/**
 * 격자(그리드) 표시 상태 — v0.5.0 (feature 4)
 *
 * 문제: 격자 불투명도가 배경 트레이싱(bgImageStore)에 묶여 있어
 *       배경 이미지가 없으면 조절 UI 자체가 보이지 않았다.
 * 해결: 격자 농도를 독립 스토어로 분리. 배경 이미지 유무와 무관하게 항상 조절 가능.
 *
 * 보안 (헌법 0조 부칙): localStorage 전용, 'simsteel:' 네임스페이스라
 *   projectBundle.js export/import에 자동 포함. 외부 전송 없음.
 */
import { create } from 'zustand';

const LS_KEY = 'simsteel:grid-opacity';

function load() {
  try {
    const v = parseFloat(localStorage.getItem(LS_KEY));
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1.0;
  } catch {
    return 1.0;
  }
}

export const useGridStore = create((set) => ({
  /** 격자 불투명도 0.0~1.0 (배경 이미지와 독립) */
  gridOpacity: load(),

  setGridOpacity: (v) => {
    const clamped = Math.max(0, Math.min(1, Number(v) || 0));
    try { localStorage.setItem(LS_KEY, String(clamped)); } catch { /* 무시 */ }
    set({ gridOpacity: clamped });
  },
}));
