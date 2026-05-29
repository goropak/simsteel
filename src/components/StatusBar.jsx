import { GRID_CONFIG } from '../phaser/config.js';
import { useFacilitiesStore } from '../state/facilitiesStore.js';

/**
 * 하단 상태 바
 * - 좌표 (m 단위, 셀 번호)
 * - 격자 정보
 * - 줌 레벨
 * - 배치된 시설 수 + 현재 선택 이름
 */
export default function StatusBar({ coord, zoom }) {
  const { cellSize, phase1Width, phase1Height } = GRID_CONFIG;
  const siteW = phase1Width  * cellSize;
  const siteH = phase1Height * cellSize;

  const cellX = coord?.cellX ?? 0;
  const cellY = coord?.cellY ?? 0;
  const mX    = coord?.mX   ?? 0;
  const mY    = coord?.mY   ?? 0;

  const facilities   = useFacilitiesStore((s) => s.facilities);
  const selectedIds  = useFacilitiesStore((s) => s.selectedIds);
  // 단일 선택 시에만 이름 표시
  const selectedFac  = selectedIds.length === 1
    ? facilities.find((f) => f.id === selectedIds[0])
    : null;

  return (
    <div style={styles.bar}>
      {/* 좌측: 커서 좌표 */}
      <span style={styles.section}>
        X&nbsp;=&nbsp;<b>{mX.toLocaleString()}</b>m&nbsp;&nbsp;
        Y&nbsp;=&nbsp;<b>{mY.toLocaleString()}</b>m
        &nbsp;&nbsp;|&nbsp;&nbsp;
        셀&nbsp;({cellX},&nbsp;{cellY})
      </span>

      {/* 중앙: 격자 정보 + 시설 수 */}
      <span style={{ ...styles.section, textAlign: 'center', flex: 1 }}>
        격자&nbsp;{cellSize}m&nbsp;&nbsp;|&nbsp;&nbsp;
        Phase&nbsp;1:&nbsp;{siteW.toLocaleString()}m&nbsp;×&nbsp;{siteH.toLocaleString()}m
        &nbsp;&nbsp;|&nbsp;&nbsp;
        배치된 시설:&nbsp;<b>{facilities.length}</b>개
      </span>

      {/* 우측: 줌 + 선택 정보 */}
      <span style={{ ...styles.section, textAlign: 'right', gap: '12px', display: 'flex' }}>
        {selectedIds.length > 1 && (
          <span style={styles.selected}>
            선택:&nbsp;<b>{selectedIds.length}개</b>
          </span>
        )}
        {selectedFac && (
          <span style={styles.selected}>
            선택:&nbsp;<b style={{ color: selectedFac.color }}>{selectedFac.name}</b>
          </span>
        )}
        <span>줌:&nbsp;<b>{(zoom ?? 1).toFixed(2)}x</b></span>
      </span>
    </div>
  );
}

const styles = {
  bar: {
    height: '40px',
    background: '#12121c',
    borderTop: '1px solid #2a2a40',
    color: '#8888bb',
    fontFamily: 'Courier New, Courier, monospace',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '8px',
    userSelect: 'none',
    flexShrink: 0,
  },
  section: {
    whiteSpace: 'nowrap',
  },
  selected: {
    color: '#8888bb',
  },
};
