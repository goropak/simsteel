/**
 * 클라우드 동기화 — v0.5.2 (서버 저장: 자동 + 수동)
 *
 * 단위: 프로젝트 번들(projectBundle) 1개 = 사용자당 projects 테이블 1 row.
 *   - 로그인 시 pullProject: 서버 row → 이미지 복원 → applyProjectBundle.
 *   - 보드 변경 시 디바운스 push(자동, #supabase 함정 8) + saveNow(수동 버튼).
 *
 * 이미지(레이어): base64는 Storage로 업로드하고 번들엔 storagePath만 저장(함정 5).
 *   불러올 때 URL→base64 복원해 기존 Phaser 렌더 파이프 유지.
 *
 * graceful degradation: supabase=null이면 전부 no-op → 로컬 전용 모드.
 */
import { create } from 'zustand';
import { supabase, isSupabaseEnabled, PROJECTS_TABLE } from '../lib/supabase.js';
import { buildProjectBundle, applyProjectBundle } from './projectBundle.js';
import { uploadImage, publicUrlFor, fetchAsDataUrl } from '../lib/imageStorage.js';

import { useFacilitiesStore } from './facilitiesStore.js';
import { useLayoutStore } from './layoutStore.js';
import { useTerrainStore } from './terrainStore.js';
import { useImageLayerStore } from './imageLayerStore.js';
import { useDefaultSizeStore } from './defaultSizeStore.js';
import { useGridStore } from './gridStore.js';

const APP_VERSION = 'v0.5.2';
const LAYERS_KEY = 'simsteel:image-layers';
const DEBOUNCE_MS = 1500;

/** UI용 동기화 상태 */
export const useSyncStore = create((set) => ({
  // 'idle' | 'saving' | 'saved' | 'error' | 'loading'
  state: 'idle',
  lastSavedAt: null,
  message: '',
  setSync: (patch) => set(patch),
}));

let _userId = null;
let _suppress = false;     // pull/apply 중 자동저장 억제 (왕복 방지)
let _timer = null;
let _unsubs = [];

/** 번들의 image-layers에서 base64를 떼어 Storage 업로드 → storagePath만 남긴 사본 반환 */
async function externalizeImages(bundle, userId) {
  const raw = bundle.localStorage?.[LAYERS_KEY];
  if (!raw) return bundle;
  let layers;
  try { layers = JSON.parse(raw); } catch { return bundle; }
  if (!Array.isArray(layers)) return bundle;

  const out = [];
  for (const l of layers) {
    if (l && typeof l.dataUrl === 'string' && l.dataUrl.startsWith('data:')) {
      const path = await uploadImage(userId, l.id, l.dataUrl);
      if (path) { out.push({ ...l, dataUrl: '', storagePath: path }); continue; }
    }
    out.push(l); // 업로드 실패 시 base64 유지(폴백)
  }
  // 깊은 사본에 교체본 주입 (원본 store/번들 불변)
  return { ...bundle, localStorage: { ...bundle.localStorage, [LAYERS_KEY]: JSON.stringify(out) } };
}

/** pull한 번들의 image-layers storagePath → 공개 URL → base64 복원 */
async function internalizeImages(bundle) {
  const raw = bundle.localStorage?.[LAYERS_KEY];
  if (!raw) return bundle;
  let layers;
  try { layers = JSON.parse(raw); } catch { return bundle; }
  if (!Array.isArray(layers)) return bundle;

  const out = [];
  for (const l of layers) {
    if (l && l.storagePath && !(l.dataUrl && l.dataUrl.startsWith('data:'))) {
      const url = publicUrlFor(l.storagePath);
      const dataUrl = await fetchAsDataUrl(url);
      if (dataUrl) { const { storagePath, ...rest } = l; out.push({ ...rest, dataUrl }); continue; }
    }
    out.push(l);
  }
  return { ...bundle, localStorage: { ...bundle.localStorage, [LAYERS_KEY]: JSON.stringify(out) } };
}

/** 서버에서 사용자 프로젝트를 불러와 적용 (로그인 직후 1회) */
export async function pullProject(userId) {
  if (!isSupabaseEnabled || !supabase || !userId) return;
  _userId = userId;
  useSyncStore.getState().setSync({ state: 'loading', message: '서버에서 불러오는 중…' });
  try {
    const { data, error } = await supabase
      .from(PROJECTS_TABLE)
      .select('bundle')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (data?.bundle) {
      const restored = await internalizeImages(data.bundle);
      _suppress = true;
      try { applyProjectBundle(restored); } finally { _suppress = false; }
      useSyncStore.getState().setSync({ state: 'saved', message: '서버 데이터 불러옴', lastSavedAt: Date.now() });
    } else {
      // 첫 로그인 — 서버에 아직 없음. 현재 로컬 상태를 첫 저장.
      useSyncStore.getState().setSync({ state: 'idle', message: '새 프로젝트' });
      await pushNow();
    }
  } catch (e) {
    useSyncStore.getState().setSync({ state: 'error', message: '불러오기 실패: ' + (e?.message || e) });
  }
}

/** 현재 상태를 서버에 즉시 저장 (수동 버튼 + 자동저장 공용) */
export async function pushNow() {
  if (!isSupabaseEnabled || !supabase || !_userId) return;
  useSyncStore.getState().setSync({ state: 'saving', message: '저장 중…' });
  try {
    const bundle = buildProjectBundle(APP_VERSION);
    const payload = await externalizeImages(bundle, _userId);
    const { error } = await supabase
      .from(PROJECTS_TABLE)
      .upsert({ user_id: _userId, bundle: payload, updated_at: new Date().toISOString() },
              { onConflict: 'user_id' });   // 함정 7
    if (error) throw error;
    useSyncStore.getState().setSync({ state: 'saved', message: '저장됨', lastSavedAt: Date.now() });
  } catch (e) {
    useSyncStore.getState().setSync({ state: 'error', message: '저장 실패: ' + (e?.message || e) });
  }
}

/** 변경 디바운스 → 자동 저장 예약 */
function scheduleSave() {
  if (_suppress || !_userId) return;
  if (_timer) clearTimeout(_timer);
  _timer = setTimeout(() => { _timer = null; pushNow(); }, DEBOUNCE_MS);
}

/** 로그인 후 자동 동기화 시작: pull 1회 + 변경 구독 */
export async function startAutoSync(userId) {
  if (!isSupabaseEnabled) return;
  await pullProject(userId);
  stopAutoSync(); // 중복 구독 방지
  const subTo = (store) => store.subscribe(() => scheduleSave());
  _unsubs = [
    subTo(useFacilitiesStore),
    subTo(useLayoutStore),
    subTo(useTerrainStore),
    subTo(useImageLayerStore),
    subTo(useDefaultSizeStore),
    subTo(useGridStore),
  ];
}

/** 로그아웃/언마운트 시 구독 해제 */
export function stopAutoSync() {
  _unsubs.forEach((u) => { try { u(); } catch { /* noop */ } });
  _unsubs = [];
  if (_timer) { clearTimeout(_timer); _timer = null; }
}

/** 로그아웃 시 동기화 컨텍스트 초기화 */
export function resetSync() {
  stopAutoSync();
  _userId = null;
  useSyncStore.getState().setSync({ state: 'idle', message: '', lastSavedAt: null });
}
