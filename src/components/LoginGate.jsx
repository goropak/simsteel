import { useEffect, useState } from 'react';
import { useAuthStore } from '../state/authStore.js';

/**
 * 로그인 게이트 — v0.5.2
 *
 * - Supabase 미설정(status='disabled') → 곧장 children 렌더 (로컬 전용 모드).
 * - 'loading' → 스피너 자리.
 * - 'signed-out' → 아이디/비밀번호 로그인·가입 폼.
 * - 'signed-in' → children(앱) 렌더.
 *
 * 핵심 기능은 로그인 없이도 동작(폴백). 로그인은 "서버 저장"을 켜는 스위치.
 */
export default function LoginGate({ children }) {
  const status = useAuthStore((s) => s.status);
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    const cleanup = init();
    return cleanup;
  }, [init]);

  if (status === 'disabled' || status === 'signed-in') return children;
  if (status === 'loading') {
    return <div style={styles.center}><div style={styles.muted}>불러오는 중…</div></div>;
  }
  return <LoginForm />;
}

function LoginForm() {
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!id.trim() || !pw) return;
    if (mode === 'signin') signIn(id, pw);
    else signUp(id, pw);
  };

  return (
    <div style={styles.center}>
      <form style={styles.card} onSubmit={submit}>
        <div style={styles.logo}>simsteel</div>
        <div style={styles.sub}>{mode === 'signin' ? '로그인' : '새 계정 만들기'}</div>

        <input
          style={styles.input}
          placeholder="아이디"
          value={id}
          autoFocus
          onChange={(e) => { setId(e.target.value); clearError(); }}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="비밀번호 (6자 이상)"
          value={pw}
          onChange={(e) => { setPw(e.target.value); clearError(); }}
        />

        {error && <div style={styles.error}>{error}</div>}

        <button style={styles.primary} type="submit" disabled={busy}>
          {busy ? '처리 중…' : mode === 'signin' ? '로그인' : '가입하고 시작'}
        </button>

        <button
          type="button"
          style={styles.link}
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); clearError(); }}
        >
          {mode === 'signin' ? '계정이 없나요? 새로 만들기' : '이미 계정이 있나요? 로그인'}
        </button>

        <div style={styles.hint}>저장한 레이아웃은 서버에 보관되어 어느 기기에서든 이어서 작업할 수 있습니다.</div>
      </form>
    </div>
  );
}

const styles = {
  center: {
    height: '100vh', width: '100vw', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#0e0e18', fontFamily: 'Courier New, monospace',
  },
  muted: { color: '#5555aa', fontSize: '13px' },
  card: {
    width: '300px', background: '#12121c', border: '1px solid #2a2a40', borderRadius: '8px',
    padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '10px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
  },
  logo: { color: '#9999ee', fontWeight: 'bold', fontSize: '20px', letterSpacing: '3px', textAlign: 'center' },
  sub: { color: '#5555aa', fontSize: '12px', textAlign: 'center', marginBottom: '6px' },
  input: {
    background: '#1a1a28', border: '1px solid #2a2a40', borderRadius: '4px', color: '#aaaadd',
    fontFamily: 'Courier New, monospace', fontSize: '13px', padding: '9px 10px', outline: 'none',
  },
  error: { color: '#dd7777', fontSize: '11px', lineHeight: 1.5, background: '#2a1010', border: '1px solid #441818', borderRadius: '4px', padding: '6px 8px' },
  primary: {
    background: '#2a2a50', border: '1px solid #4a4a80', borderRadius: '4px', color: '#ccccff',
    fontFamily: 'Courier New, monospace', fontSize: '13px', fontWeight: 'bold', padding: '10px', cursor: 'pointer', marginTop: '4px',
  },
  link: { background: 'transparent', border: 'none', color: '#6666aa', fontFamily: 'Courier New, monospace', fontSize: '11px', cursor: 'pointer', padding: '4px' },
  hint: { color: '#333355', fontSize: '9px', lineHeight: 1.6, textAlign: 'center', marginTop: '4px' },
};
