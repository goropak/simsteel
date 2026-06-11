import { useGridStore } from '../state/gridStore.js';

/**
 * 격자 표시 패널 — v0.5.0 (feature 4)
 *
 * 배경 이미지 유무와 무관하게 격자 농도(불투명도)를 항상 조절.
 * 값은 localStorage('simsteel:grid-opacity')에 영속 → 프로젝트 번들에 포함.
 */
export default function GridPanel() {
  const gridOpacity    = useGridStore((s) => s.gridOpacity);
  const setGridOpacity = useGridStore((s) => s.setGridOpacity);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>격자</div>
      <div style={styles.body}>
        <div style={styles.sliderRow}>
          <span style={styles.sliderLabel}>농도</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(gridOpacity * 100)}
            onChange={(e) => setGridOpacity(Number(e.target.value) / 100)}
            style={styles.slider}
          />
          <span style={styles.sliderVal}>{Math.round(gridOpacity * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  panel: {
    background: '#12121c',
    borderTop: '1px solid #2a2a40',
    fontFamily: 'Courier New, monospace',
    flexShrink: 0,
  },
  header: {
    height: '30px', display: 'flex', alignItems: 'center', padding: '0 12px',
    fontSize: '10px', color: '#7777cc', borderBottom: '1px solid #1e1e2e', letterSpacing: '1px',
  },
  body: { padding: '8px 12px' },
  sliderRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  sliderLabel: { fontSize: '9px', color: '#5555aa', width: '28px', flexShrink: 0 },
  slider: { flex: 1, accentColor: '#7777cc', cursor: 'pointer' },
  sliderVal: {
    fontSize: '10px', color: '#7777bb', width: '30px', textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
};
