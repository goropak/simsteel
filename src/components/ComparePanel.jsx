/**
 * 레이아웃 비교 패널 (v0.4.2 — feature 5)
 *
 * 저장된 레이아웃을 체크하면 보드 위에 반투명 고스트로 겹쳐 비교한다.
 * 비교는 읽기전용 — 활성(현재) 레이아웃만 편집 가능, 고스트는 시각 참조.
 */
import { useLayoutStore } from '../state/layoutStore.js';
import { useCompareStore } from '../state/compareStore.js';

export default function ComparePanel() {
  const layouts        = useLayoutStore((s) => s.layouts);
  const deleteLayout   = useLayoutStore((s) => s.deleteLayout);
  const ghostLayoutIds = useCompareStore((s) => s.ghostLayoutIds);
  const toggleGhost    = useCompareStore((s) => s.toggleGhost);
  const clearGhosts    = useCompareStore((s) => s.clearGhosts);
  const ghostOpacity   = useCompareStore((s) => s.ghostOpacity);
  const setGhostOpacity = useCompareStore((s) => s.setGhostOpacity);
  const colorFor       = useCompareStore((s) => s.colorFor);

  const handleDelete = (e, lo) => {
    e.stopPropagation();
    if (window.confirm(`저장된 레이아웃 '${lo.name}'을(를) 삭제하시겠습니까?`)) {
      if (ghostLayoutIds.includes(lo.id)) toggleGhost(lo.id); // 고스트 켜져 있으면 끄기
      deleteLayout(lo.id);
    }
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span>레이아웃 비교 (고스트)</span>
        {ghostLayoutIds.length > 0 && (
          <button style={styles.clearBtn} onClick={clearGhosts}>전체 끄기</button>
        )}
      </div>

      <div style={styles.body}>
        {layouts.length === 0 ? (
          <div style={styles.empty}>저장된 레이아웃이 없습니다 · 먼저 레이아웃을 저장하세요</div>
        ) : (
          <>
            <div style={styles.list}>
              {layouts.map((lo) => {
                const on = ghostLayoutIds.includes(lo.id);
                const swatch = on ? colorFor(lo.id) : '#33334d';
                const count = (lo.facilities || []).length;
                return (
                  <div
                    key={lo.id}
                    style={{ ...styles.item, ...(on ? styles.itemOn : {}) }}
                  >
                    <button
                      style={styles.itemToggle}
                      onClick={() => toggleGhost(lo.id)}
                      title={on ? '고스트 끄기' : '고스트로 겹쳐보기'}
                    >
                      <span style={{ ...styles.check, borderColor: on ? swatch : '#3a3a55', background: on ? swatch : 'transparent' }}>
                        {on ? '✓' : ''}
                      </span>
                      <span style={styles.itemName}>{lo.name}</span>
                      <span style={styles.itemCount}>{count}개</span>
                    </button>
                    <button
                      style={styles.delBtn}
                      onClick={(e) => handleDelete(e, lo)}
                      title="이 레이아웃 삭제"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={styles.opacityRow}>
              <label style={styles.opLabel}>투명도</label>
              <input
                type="range" min={5} max={80} step={5}
                value={Math.round(ghostOpacity * 100)}
                onChange={(e) => setGhostOpacity(parseInt(e.target.value, 10) / 100)}
                style={styles.slider}
              />
              <span style={styles.opVal}>{Math.round(ghostOpacity * 100)}%</span>
            </div>
            <div style={styles.note}>
              고스트는 읽기전용 비교용 · 편집은 현재 보드(활성)에서만
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  panel: { background: '#0e0e18', borderTop: '1px solid #2a2a40', flexShrink: 0, fontFamily: 'Courier New, monospace' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', fontSize: '11px', color: '#7777cc', letterSpacing: '1px' },
  clearBtn: { background: 'none', border: '1px solid #3a3a55', borderRadius: '3px', color: '#777799', fontFamily: 'Courier New, monospace', fontSize: '9px', padding: '2px 6px', cursor: 'pointer' },
  body: { padding: '0 12px 10px' },
  empty: { fontSize: '9px', color: '#333355', lineHeight: 1.6, padding: '2px 0 4px' },
  list: { display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '140px', overflowY: 'auto', marginBottom: '8px' },
  item: { display: 'flex', alignItems: 'center', width: '100%', background: '#15151f', border: '1px solid #22223a', borderRadius: '3px' },
  itemToggle: { display: 'flex', alignItems: 'center', gap: '7px', flex: 1, background: 'none', border: 'none', color: '#aab', fontFamily: 'Courier New, monospace', fontSize: '10px', padding: '5px 7px', cursor: 'pointer', textAlign: 'left', minWidth: 0 },
  delBtn: { background: 'none', border: 'none', color: '#664444', fontFamily: 'Courier New, monospace', fontSize: '11px', padding: '0 8px', cursor: 'pointer', flexShrink: 0, alignSelf: 'stretch' },
  itemOn: { background: '#1a1a2e', border: '1px solid #4a4a70' },
  check: { width: '13px', height: '13px', borderRadius: '3px', border: '1px solid #3a3a55', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#0e0e18', fontWeight: 'bold', lineHeight: 1 },
  itemName: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemCount: { fontSize: '9px', color: '#556', flexShrink: 0 },
  opacityRow: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' },
  opLabel: { fontSize: '9px', color: '#5577aa', flexShrink: 0 },
  slider: { flex: 1, accentColor: '#6b6bcc', cursor: 'pointer' },
  opVal: { fontSize: '9px', color: '#7788bb', width: '30px', textAlign: 'right' },
  note: { fontSize: '9px', color: '#333355', lineHeight: 1.5 },
};
