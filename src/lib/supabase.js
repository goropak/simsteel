/**
 * Supabase 클라이언트 싱글톤 — v0.5.2 (서버 저장 + 인증)
 *
 * graceful degradation (자동화 헌장 — 가역적 가속 레이어):
 *   환경변수가 없으면 client=null → 앱은 기존 localStorage 전용(로컬 모드)으로
 *   그대로 동작한다. 서버 기능만 비활성, 핵심 기능은 폴백 보유.
 *
 * 보안 (헌법 0조):
 *   - anon key는 공개 키(클라이언트 노출 전제) — 값은 .env.local / Vercel 환경변수에만.
 *   - service_role key는 절대 프론트에 두지 않는다(이 파일에서 쓰지 않음).
 *   - Vite는 VITE_ 프리픽스만 import.meta.env로 노출 (#supabase 함정 2).
 */
import { createClient } from '@supabase/supabase-js';

const url     = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** 서버 기능 사용 가능 여부 — env 둘 다 있어야 true */
export const isSupabaseEnabled = Boolean(url && anonKey);

/** 설정 안 됐으면 null (로컬 전용 모드) */
export const supabase = isSupabaseEnabled
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,      // 새로고침 후 세션 복원 (#supabase 함정 10)
        autoRefreshToken: true,
        storageKey: 'simsteel:auth',
      },
    })
  : null;

/**
 * "아이디/비밀번호" 간단 로그인을 위해 아이디를 합성 이메일로 매핑한다.
 * (Supabase password auth는 이메일 형식을 요구 — 함정 4)
 * 사용자는 아이디만 입력, 내부적으로 id@simsteel.app 으로 가입/로그인.
 */
export function idToEmail(id) {
  const clean = String(id).trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `${clean}@simsteel.app`;
}

/** 프로젝트 행을 담는 테이블/버킷 이름 (schema.sql과 일치) */
export const PROJECTS_TABLE = 'projects';
export const IMAGES_BUCKET = 'project-images';
