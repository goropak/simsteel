/**
 * 이미지 Supabase Storage 업로드/복원 — v0.5.2
 *
 * 정책(사용자 선택: Storage 정석):
 *   - 이미지 파일은 버킷 project-images/{userId}/{key}.png 에 저장.
 *   - DB(projects.bundle)에는 base64가 아니라 storagePath만 남긴다 (#supabase 함정 5).
 *   - 렌더 파이프(Phaser addBase64)는 그대로 두려고, 불러올 때 URL→base64로 복원한다.
 *
 * 보안(헌법 0조): 업로드 대상은 사용자 본인 폴더(RLS 격리). 외부 AI 전송 없음.
 */
import { supabase, IMAGES_BUCKET } from './supabase.js';

/** data URL → { blob, contentType } */
export function dataUrlToBlob(dataUrl) {
  const [head, b64] = String(dataUrl).split(',');
  const m = /data:([^;]+);base64/.exec(head || '');
  const contentType = m ? m[1] : 'image/png';
  const bin = atob(b64 || '');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { blob: new Blob([bytes], { type: contentType }), contentType };
}

/**
 * base64 dataUrl을 사용자 폴더에 업로드 → storagePath 반환.
 * 실패 시 null (호출부가 base64 폴백 유지 판단).
 */
export async function uploadImage(userId, key, dataUrl) {
  if (!supabase || !dataUrl || !dataUrl.startsWith('data:')) return null;
  const path = `${userId}/${key}.png`;
  try {
    const { blob, contentType } = dataUrlToBlob(dataUrl);
    const { error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(path, blob, { upsert: true, contentType });
    if (error) { console.warn('[imageStorage] upload 실패:', error.message); return null; }
    return path;
  } catch (e) {
    console.warn('[imageStorage] upload 예외:', e?.message || e);
    return null;
  }
}

/** storagePath → 공개 URL (버킷 public-read) */
export function publicUrlFor(path) {
  if (!supabase || !path) return null;
  const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}

/** 공개 URL → base64 dataUrl 복원 (렌더 파이프 유지용). 실패 시 null. */
export async function fetchAsDataUrl(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
