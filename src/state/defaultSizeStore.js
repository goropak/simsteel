/**
 * 프리셋 시설 기본 크기 오버라이드 — v0.5.0 (feature 3)
 *
 * 문제: 원료처리·펠릿 등 프리셋(FACILITY_DEFAULTS)의 기본 셀 크기가 고정이라
 *       사용자가 자신의 사업장 규격에 맞게 "기본값"을 바꿀 수 없었다.
 * 해결: typeId별 {width,height} 오버라이드를 localStorage에 영속.
 *       배치(_placeFacility) 시 오버라이드가 있으면 그 크기로 생성.
 *
 * 보안 (헌법 0조 부칙): localStorage 전용. 'simsteel:' 네임스페이스라
 *   프로젝트 번들(projectBundle.js)에 자동 포함 → export/import로 함께 이동.
 */
import { create } from 'zustand';

const LS_KEY = 'simsteel:facility-default-overrides';

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

function save(map) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {
    // 쓰기 실패 무시
  }
}

const clampCell = (n) => Math.max(1, Math.min(200, Math.round(Number(n) || 1)));

export const useDefaultSizeStore = create((set, get) => ({
  overrides: load(),   // { [typeId]: { width, height } }

  /** typeId 기본 크기를 width×height(셀)로 지정 */
  setOverride: (typeId, width, height) =>
    set((s) => {
      const next = { ...s.overrides, [typeId]: { width: clampCell(width), height: clampCell(height) } };
      save(next);
      return { overrides: next };
    }),

  /** typeId 오버라이드 제거 → 코드 기본값으로 복귀 */
  clearOverride: (typeId) =>
    set((s) => {
      if (!(typeId in s.overrides)) return {};
      const next = { ...s.overrides };
      delete next[typeId];
      save(next);
      return { overrides: next };
    }),

  /** 오버라이드가 있으면 반환, 없으면 null */
  getOverride: (typeId) => get().overrides[typeId] || null,
}));

/**
 * 스토어 외부(예: GridScene._placeFacility)에서 쓰는 순수 헬퍼.
 * 오버라이드가 있으면 그 크기를, 없으면 base 크기를 반환.
 */
export function effectiveDefaultSize(typeId, baseWidth, baseHeight) {
  const ov = useDefaultSizeStore.getState().overrides[typeId];
  if (ov && ov.width > 0 && ov.height > 0) {
    return { width: ov.width, height: ov.height };
  }
  return { width: baseWidth, height: baseHeight };
}
