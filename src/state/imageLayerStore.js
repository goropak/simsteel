/**
 * 이미지 레이어(다중) 상태 — v0.4.3 (feature 6)
 *
 * 레이아웃별 참조 이미지를 여러 장 올려두고 클릭으로 켜고/끄며 비교.
 * 단일 배경 트레이싱(bgImageStore)과 별개의 "겹쳐보기용 다중 레이어".
 *
 * 영속(헌법 0조 부칙 준수):
 *   - localStorage 'simsteel:image-layers'에 저장 → 새 환경에서도 사라지지 않음.
 *   - projectBundle이 simsteel:* 키 전체를 스냅샷하므로 export/import에 자동 포함.
 *   - File API → FileReader 로컬 읽기. 외부 전송 구조 없음.
 *
 * 각 레이어:
 *   { id, name, dataUrl, visible, opacity, scaleX, scaleY, offsetX, offsetY }
 *
 * v0.5.1: scale(균일) → scaleX/scaleY 분리 (가로만/세로만 늘리기).
 *   하위 호환 — 구버전 scale 단일 값은 로드 시 scaleX=scaleY=scale로 마이그레이션.
 */
import { create } from 'zustand';

const LS_KEY = 'simsteel:image-layers';

const SCALE_MIN = 0.05;
const SCALE_MAX = 20;
const clampScale = (v) => Math.max(SCALE_MIN, Math.min(SCALE_MAX, v));

/** 구버전(scale 단일) → scaleX/scaleY 마이그레이션 포함 레이어 정규화 (번들 import에서도 사용) */
export function normalizeLayer(l) {
  const legacy = typeof l.scale === 'number' && l.scale > 0 ? l.scale : 1.0;
  return {
    id: l.id || crypto.randomUUID(),
    name: typeof l.name === 'string' ? l.name : '이미지',
    dataUrl: l.dataUrl,
    visible: l.visible !== false,
    opacity: clamp01(l.opacity ?? 0.8),
    scaleX: typeof l.scaleX === 'number' && l.scaleX > 0 ? clampScale(l.scaleX) : legacy,
    scaleY: typeof l.scaleY === 'number' && l.scaleY > 0 ? clampScale(l.scaleY) : legacy,
    offsetX: Number.isFinite(l.offsetX) ? l.offsetX : 0,
    offsetY: Number.isFinite(l.offsetY) ? l.offsetY : 0,
  };
}

/** 저장 시 dataUrl 포함 전체 직렬화 (용량 초과는 조용히 무시 — 런타임은 메모리 유지) */
function saveLayers(layers) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(layers));
  } catch (e) {
    // QuotaExceededError 등 — 메모리 상태는 유지, 영속만 실패
    console.warn('[imageLayerStore] localStorage 저장 실패(용량 초과 가능):', e?.name || e);
  }
}

function loadLayers() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // 형식 보정 (구버전/손상 방어) + scale→scaleX/scaleY 마이그레이션
    return arr.filter((l) => l && typeof l.dataUrl === 'string').map(normalizeLayer);
  } catch {
    return [];
  }
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export const useImageLayerStore = create((set, get) => ({
  layers: loadLayers(),

  /**
   * v0.5.0(feature 7) — 마우스 드래그 이동 대상 레이어 id (세션 전용, 영속 안 함).
   * null이면 이동 모드 꺼짐. GridScene이 이 값을 보고 캔버스 드래그를 setOffset에 연결.
   */
  activeMoveId: null,
  setActiveMoveId: (id) => set({ activeMoveId: id }),

  /** 새 이미지 레이어 추가 → 생성된 레이어 반환 */
  addLayer: (name, dataUrl) => {
    const layer = {
      id: crypto.randomUUID(),
      name: (name && String(name).trim()) || '이미지',
      dataUrl,
      visible: true,
      opacity: 0.8,
      scaleX: 1.0,
      scaleY: 1.0,
      offsetX: 0,
      offsetY: 0,
    };
    set((s) => {
      const layers = [...s.layers, layer];
      saveLayers(layers);
      return { layers };
    });
    return layer;
  },

  removeLayer: (id) =>
    set((s) => {
      const layers = s.layers.filter((l) => l.id !== id);
      saveLayers(layers);
      return { layers, activeMoveId: s.activeMoveId === id ? null : s.activeMoveId };
    }),

  clearLayers: () =>
    set(() => {
      saveLayers([]);
      return { layers: [], activeMoveId: null };
    }),

  toggleVisible: (id) =>
    set((s) => {
      const layers = s.layers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l,
      );
      saveLayers(layers);
      return { layers };
    }),

  renameLayer: (id, name) =>
    set((s) => {
      const layers = s.layers.map((l) =>
        l.id === id ? { ...l, name: String(name).slice(0, 40) } : l,
      );
      saveLayers(layers);
      return { layers };
    }),

  setOpacity: (id, v) =>
    set((s) => {
      const op = clamp01(v);
      const layers = s.layers.map((l) => (l.id === id ? { ...l, opacity: op } : l));
      saveLayers(layers);
      return { layers };
    }),

  /** 균일 스케일 — 양 축 동시 설정 (비율 고정 모드 / 초기화 / 자동 fit) */
  setScale: (id, v) =>
    set((s) => {
      const sc = clampScale(v);
      const layers = s.layers.map((l) =>
        l.id === id ? { ...l, scaleX: sc, scaleY: sc } : l,
      );
      saveLayers(layers);
      return { layers };
    }),

  /** 한 축만 스케일 (v0.5.1 — 가로만/세로만 늘리기). axis: 'x' | 'y' */
  setScaleAxis: (id, axis, v) =>
    set((s) => {
      const sc = clampScale(v);
      const field = axis === 'y' ? 'scaleY' : 'scaleX';
      const layers = s.layers.map((l) => (l.id === id ? { ...l, [field]: sc } : l));
      saveLayers(layers);
      return { layers };
    }),

  setOffset: (id, x, y) =>
    set((s) => {
      const layers = s.layers.map((l) =>
        l.id === id ? { ...l, offsetX: x, offsetY: y } : l,
      );
      saveLayers(layers);
      return { layers };
    }),

  /** 레이어 순서 한 칸 위/아래 (그리기 순서 = 배열 순서) */
  moveLayer: (id, dir) =>
    set((s) => {
      const idx = s.layers.findIndex((l) => l.id === id);
      if (idx < 0) return {};
      const to = dir === 'up' ? idx - 1 : idx + 1;
      if (to < 0 || to >= s.layers.length) return {};
      const layers = [...s.layers];
      [layers[idx], layers[to]] = [layers[to], layers[idx]];
      saveLayers(layers);
      return { layers };
    }),
}));
