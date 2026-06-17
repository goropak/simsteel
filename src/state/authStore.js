/**
 * 인증 상태 — v0.5.2 (개인 계정, 아이디/비밀번호)
 *
 * Supabase Auth(email/password) 위에 "아이디" UX를 얹는다.
 * 아이디 → id@simsteel.app 합성 이메일(lib/supabase.idToEmail).
 *
 * graceful degradation: supabase=null이면 status='disabled'로 두고
 *   LoginGate가 곧장 앱을 렌더(로컬 전용 모드). 핵심 기능 폴백 보유.
 */
import { create } from 'zustand';
import { supabase, isSupabaseEnabled, idToEmail } from '../lib/supabase.js';

export const useAuthStore = create((set, get) => ({
  // 'loading' | 'signed-in' | 'signed-out' | 'disabled'
  status: isSupabaseEnabled ? 'loading' : 'disabled',
  user: null,
  error: null,
  busy: false,

  /** 앱 시작 시 1회 — 기존 세션 복원 + 변경 구독 */
  init: () => {
    if (!isSupabaseEnabled || !supabase) {
      set({ status: 'disabled' });
      return () => {};
    }
    supabase.auth.getSession().then(({ data }) => {
      const user = data?.session?.user ?? null;
      set({ user, status: user ? 'signed-in' : 'signed-out' });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      set({ user, status: user ? 'signed-in' : 'signed-out' });
    });
    return () => sub?.subscription?.unsubscribe();
  },

  signIn: async (id, password) => {
    if (!supabase) return;
    set({ busy: true, error: null });
    const { error } = await supabase.auth.signInWithPassword({
      email: idToEmail(id),
      password,
    });
    if (error) set({ busy: false, error: friendly(error) });
    else set({ busy: false });
    // 성공 시 onAuthStateChange가 status/user 갱신
  },

  signUp: async (id, password) => {
    if (!supabase) return;
    set({ busy: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email: idToEmail(id),
      password,
    });
    if (error) { set({ busy: false, error: friendly(error) }); return; }
    // 이메일 확인이 꺼져 있으면 즉시 세션 생성됨(함정 4).
    // 켜져 있으면 session=null → 안내.
    if (!data.session) {
      set({ busy: false, error: '가입은 됐지만 자동 로그인이 안 됐습니다. Supabase 대시보드에서 이메일 확인(Confirm email)을 꺼 주세요.' });
    } else {
      set({ busy: false });
    }
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ user: null, status: 'signed-out' });
  },

  clearError: () => set({ error: null }),
}));

/** Supabase 에러를 한국어로 간단 변환 */
function friendly(error) {
  const m = error?.message || '';
  if (/Invalid login/i.test(m)) return '아이디 또는 비밀번호가 틀렸습니다.';
  if (/already registered/i.test(m)) return '이미 존재하는 아이디입니다. 로그인하세요.';
  if (/Password should be/i.test(m)) return '비밀번호는 6자 이상이어야 합니다.';
  return m || '인증 오류가 발생했습니다.';
}
