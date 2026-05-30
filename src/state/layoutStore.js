/**
 * 멀티 레이아웃 저장·불러오기 store (v0.2.5)
 *
 * 보안 (헌법 0조 부칙):
 *   - localStorage 전용, 서버 전송 코드 0줄.
 *   - 파일(.json) export/import 미구현 (v0.4 Supabase까지 보류).
 *   - 레이아웃명·시설명을 analytics/error log 기록 금지.
 *
 * 교훈 적용:
 *   - 값 복사 원칙: 저장 시 JSON 직렬화로 스냅샷 — store 변경이 저장본에 영향 없음.
 *   - 타일 게임 좌표 3계 분리: facilities/terrain 배열에 col/row 정수만 포함.
 */
import { create } from 'zustand';

const LS_KEY      = 'simsteel:layouts';
const PNG_WARN_KEY = 'simsteel:png-warned';

function loadLayouts() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

function persistLayouts(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); }
  catch {}
}

/**
 * 레이아웃 객체 필드:
 *   id        : string (UUID)
 *   name      : string
 *   facilities: Array  (시설 값 복사)
 *   terrain   : Array  (지형 값 복사)
 *   siteSize  : { widthM, heightM }
 *   savedAt   : ISO 8601 string
 */
export const useLayoutStore = create((set, get) => ({
  layouts: loadLayouts(),

  /**
   * 현재 상태 스냅샷을 이름 붙여 저장.
   * 값 복사 원칙: JSON.parse(JSON.stringify(...))로 깊은 복사 → store 이후 변경 영향 없음.
   */
  saveLayout: (name, facilities, terrain, siteSize) => {
    const layout = {
      id:         crypto.randomUUID(),
      name:       name.trim(),
      facilities: JSON.parse(JSON.stringify(facilities)),
      terrain:    JSON.parse(JSON.stringify(terrain)),
      siteSize:   { ...siteSize },
      savedAt:    new Date().toISOString(),
    };
    set((s) => {
      const updated = [...s.layouts, layout];
      persistLayouts(updated);
      return { layouts: updated };
    });
    return layout;
  },

  deleteLayout: (id) => {
    set((s) => {
      const updated = s.layouts.filter((l) => l.id !== id);
      persistLayouts(updated);
      return { layouts: updated };
    });
  },

  /** PNG 경고 토스트 1회 여부 */
  hasPngWarned: () => !!localStorage.getItem(PNG_WARN_KEY),
  markPngWarned: () => {
    try { localStorage.setItem(PNG_WARN_KEY, '1'); } catch {}
  },
}));
