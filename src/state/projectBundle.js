/**
 * 완전 프로젝트 번들 export / import (v0.4.0 — feature 3)
 *
 * 문제: "한 컴퓨터에서 한 작업이 다른 컴퓨터에서 리셋된다."
 *   원인 — 상태가 여러 localStorage 키(custom-facilities/layouts/terrain)와
 *          영속화되지 않는 런타임(현재 보드 시설·부지 크기)에 흩어져 있음.
 *   해결 — 단일 .json 번들로 전부 묶어 export, 새 환경에서 그대로 import.
 *
 * 보안 (헌법 0조 부칙):
 *   - export: Blob + createObjectURL 로컬 다운로드. 네트워크 전송 0줄.
 *   - import: FileReader 브라우저 내 처리. 외부 전송 0줄.
 *   - 시설명·레이아웃명을 analytics/error log에 기록하지 않음.
 *
 * 교훈 적용:
 *   - 값 복사 원칙: 주입 전 JSON.parse(JSON.stringify(...)) 깊은 복사.
 *   - AI 기억 ≠ 실제 상태: 키를 하드코딩하지 않고 simsteel: 네임스페이스 전체를 스냅샷.
 */
import { useFacilitiesStore } from './facilitiesStore.js';
import { useLayoutStore } from './layoutStore.js';
import { useTerrainStore } from './terrainStore.js';
import { useImageLayerStore, normalizeLayer } from './imageLayerStore.js';
import { useDefaultSizeStore } from './defaultSizeStore.js';
import { useGridStore } from './gridStore.js';

export const BUNDLE_FORMAT = 'simsteel-project-bundle';
export const BUNDLE_VERSION = 1;
const LS_PREFIX = 'simsteel:';

/** simsteel: 네임스페이스의 모든 localStorage 키를 문자열 그대로 스냅샷 */
function snapshotLocalStorage() {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LS_PREFIX)) {
        out[key] = localStorage.getItem(key);
      }
    }
  } catch {
    // localStorage 접근 실패 무시 (빈 스냅샷 반환)
  }
  return out;
}

/**
 * 현재 전체 프로젝트 상태를 번들 객체로 직렬화.
 * localStorage(영속 데이터) + runtime(현재 보드)을 함께 담는다.
 */
export function buildProjectBundle(appVersion = 'v0.4.0') {
  const fac = useFacilitiesStore.getState();
  const terr = useTerrainStore.getState();

  return {
    format: BUNDLE_FORMAT,
    version: BUNDLE_VERSION,
    app: appVersion,
    exportedAt: new Date().toISOString(),
    // 영속 데이터 (custom-facilities / layouts / terrain / 플래그)
    localStorage: snapshotLocalStorage(),
    // 런타임 — localStorage에 안 들어가는 현재 작업 보드
    runtime: {
      facilities: JSON.parse(JSON.stringify(fac.facilities)),
      terrains:   JSON.parse(JSON.stringify(terr.terrains)),
      siteSize:   { ...fac.siteSize },
    },
  };
}

/** 번들 유효성 검사 — 잘못된 파일 import 방어 */
export function validateBundle(data) {
  if (!data || typeof data !== 'object') throw new Error('JSON 객체가 아닙니다');
  if (data.format !== BUNDLE_FORMAT) throw new Error('simsteel 프로젝트 번들이 아닙니다');
  if (typeof data.version !== 'number') throw new Error('version 필드 누락');
  if (data.version > BUNDLE_VERSION) throw new Error(`더 최신 버전(v${data.version})의 번들입니다. 앱을 업데이트하세요`);
  if (!data.localStorage || typeof data.localStorage !== 'object') throw new Error('localStorage 스냅샷 누락');
  if (!data.runtime || typeof data.runtime !== 'object') throw new Error('runtime 스냅샷 누락');
  return true;
}

/**
 * 번들을 현재 환경에 주입.
 * 1) localStorage 키 복원 → 2) store 재수화 → 3) 런타임 보드 적용.
 */
export function applyProjectBundle(data) {
  validateBundle(data);

  // 1. localStorage 복원 (simsteel: 키만 — 오염 방지)
  try {
    for (const [key, value] of Object.entries(data.localStorage)) {
      if (key.startsWith(LS_PREFIX) && typeof value === 'string') {
        localStorage.setItem(key, value);
      }
    }
  } catch {
    // 쓰기 실패 무시 — store 재수화는 아래 값으로 직접 진행
  }

  // 2. store 재수화 (localStorage에서 다시 파싱 — 단일 진실 원천)
  const parse = (key, fallback) => {
    try { return JSON.parse(data.localStorage[key] ?? localStorage.getItem(key) ?? 'null') ?? fallback; }
    catch { return fallback; }
  };
  const customFacilities = parse(LS_PREFIX + 'custom-facilities', []);
  const layouts          = parse(LS_PREFIX + 'layouts', []);
  const persistedTerrain = parse(LS_PREFIX + 'terrain', []);
  const imageLayers      = parse(LS_PREFIX + 'image-layers', []);
  // v0.5.0 — 새 영속 스토어 재수화 (feature 3·4)
  const sizeOverrides    = parse(LS_PREFIX + 'facility-default-overrides', {});
  const gridOpacityRaw   = parseFloat(data.localStorage[LS_PREFIX + 'grid-opacity'] ?? localStorage.getItem(LS_PREFIX + 'grid-opacity'));

  // 3. 런타임 보드 적용 (값 복사 원칙 — 깊은 복사)
  const rt = data.runtime;
  const runtimeFacilities = JSON.parse(JSON.stringify(rt.facilities ?? []));
  const runtimeTerrains   = JSON.parse(JSON.stringify(rt.terrains ?? persistedTerrain));
  const siteSize          = rt.siteSize ?? useFacilitiesStore.getState().siteSize;

  useFacilitiesStore.setState({
    customFacilities,
    facilities: runtimeFacilities,
    selectedIds: [],
    paletteSelectedTypeId: null,
    siteSize: { ...siteSize },
  });
  useLayoutStore.setState({ layouts });
  useTerrainStore.setState({ terrains: runtimeTerrains, selectedTerrainId: null });
  // v0.5.1 — 구버전 scale 단일 값 → scaleX/scaleY 마이그레이션 포함 정규화
  useImageLayerStore.setState({
    layers: Array.isArray(imageLayers)
      ? imageLayers.filter((l) => l && typeof l.dataUrl === 'string').map(normalizeLayer)
      : [],
  });
  // v0.5.0 — 새 영속 스토어 재수화 (feature 3·4): 모듈 init 시점 캐시를 import 값으로 갱신
  useDefaultSizeStore.setState({ overrides: (sizeOverrides && typeof sizeOverrides === 'object') ? sizeOverrides : {} });
  useGridStore.setState({ gridOpacity: Number.isFinite(gridOpacityRaw) ? Math.max(0, Math.min(1, gridOpacityRaw)) : 1.0 });

  return {
    facilities: runtimeFacilities.length,
    customFacilities: customFacilities.length,
    layouts: layouts.length,
    terrains: runtimeTerrains.length,
    imageLayers: Array.isArray(imageLayers) ? imageLayers.length : 0,
  };
}

/** 번들을 .json 파일로 다운로드 (Blob — 외부 전송 0) */
export function downloadProjectBundle(appVersion = 'v0.4.0') {
  const data = buildProjectBundle(appVersion);
  const stamp = data.exportedAt.slice(0, 19).replace(/[:T]/g, '-');
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `simsteel-project-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return data;
}
