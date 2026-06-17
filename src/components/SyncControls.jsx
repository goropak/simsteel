import { useAuthStore } from '../state/authStore.js';
import { useSyncStore, pushNow } from '../state/cloudSync.js';
import { isSupabaseEnabled } from '../lib/supabase.js';

/**
 * 헤더 우측 동기화 컨트롤 — v0.5.2
 * - Supabase 미설정: "로컬 모드" 태그만.
 * - 로그인됨: 저장 상태 + [서버에 저장] 수동 버튼 + 로그아웃.
 */
export default function SyncControls() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const sync = useSyncStore((s) => s.state);
  const message = useSyncStore((s) => s.message);

  if (!isSupabaseEnabled) {
    return <span style={styles.localTag} title="서버 미연결 — 이 브라우저에만 저장됩니다">● 로컬 모드</span>;
  }
  if (status !== 'signed-in') return null;

  const idLabel = (user?.email || '').replace('@simsteel.app', '');
  const dot =
    sync === 'saving' ? '#ddbb55' :
    sync === 'saved'  ? '#66cc88' :
    sync === 'error'  ? '#dd6666' :
    sync === 'loading'? '#7777cc' : '#556';

  return (
    <div style={styles.wrap}>
      <span style={{ ...styles.status, color: dot }} title={message}>
        ● {labelFor(sync)}
      </span>
      <button style={styles.saveBtn} onClick={() => pushNow()} disabled={sync === 'saving'}>
        💾 서버에 저장
      </button>
      <span style={styles.user}>{idLabel}</span>
      <button style={styles.outBtn} onClick={() => signOut()}>로그아웃</button>
    </div>
  );
}

function labelFor(s) {
  switch (s) {
    case 'saving': return '저장 중';
    case 'saved': return '저장됨';
    case 'error': return '오류';
    case 'loading': return '불러오는 중';
    default: return '대기';
  }
}

const styles = {
  wrap: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' },
  status: { fontSize: '10px', fontFamily: 'Courier New, monospace', fontVariantNumeric: 'tabular-nums' },
  saveBtn: {
    background: '#1a1a2e', border: '1px solid #3a3a60', borderRadius: '3px', color: '#8888dd',
    fontFamily: 'Courier New, monospace', fontSize: '10px', padding: '4px 9px', cursor: 'pointer',
  },
  user: { fontSize: '10px', color: '#5555aa', fontFamily: 'Courier New, monospace' },
  outBtn: {
    background: 'transparent', border: '1px solid #2a2a40', borderRadius: '3px', color: '#6666aa',
    fontFamily: 'Courier New, monospace', fontSize: '10px', padding: '4px 8px', cursor: 'pointer',
  },
  localTag: { marginLeft: 'auto', fontSize: '10px', color: '#556', fontFamily: 'Courier New, monospace' },
};
