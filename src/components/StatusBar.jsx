import { GRID_CONFIG } from '../phaser/config.js';
import { useFacilitiesStore } from '../state/facilitiesStore.js';

const PY_PER_M2 = 3.3058;  // 1평 = 3.3058 m²

/**
 * 하단 상태 바
 * - 커서 좌표 (m 단위, 셀 번호)
 * - 부지 크기 + 면적 (m², km², 평)
 * - 줌 레벨 + 시설 수 + 선택 정보
 */
export default function StatusBar({ coord, zoom }) {
  const { cellSize } = GRID_CONFIG;

  const cellX = coord?.cellX ?? 0;
  const cellY = coord?.cellY ?? 0;
  const mX    = coord?.mX   ?? 0;
  const mY    = coord?.mY   ?? 0;

  const facilities  = useFacilitiesStore((s) => s.facilities);
  const selectedIds = useFacilitiesStore((s) => s.selectedIds);
  const siteSize    = useFacilitiesStore((s) => s.siteSize);

  const selectedFac = selectedIds.length === 1
    ? facilities.find((f) => f.id === selectedIds[0])
    : null;

  // 면적 계산
  const areaM2  = siteSize.widthM * siteSize.heightM;
  const areaKm2 = areaM2 / 1_000_000;
  const areaPy  = Math.round(areaM2 / PY_PER_M2);

  return (
    <div style={styles.bar}>
      {/* 좌측: 커서 좌표 */}
      <span style={styles.section}>
        X&nbsp;<b>{mX.toLocaleString()}</b>m&nbsp;
        Y&nbsp;<b>{mY.toLocaleString()}</b>m
        &nbsp;│&nbsp;
        셀&nbsp;({cellX},&nbsp;{cellY})
      </span>

      <span style={styles.divider}>│</span>

      {/* 중앙: 부지 크기 + 면적 */}
      <span style={{ ...styles.section, flex: 1, textAlign: 'center' }}>
        부지&nbsp;
        <b>{siteSize.widthM.toLocaleString()}</b>×<b>{siteSize.heightM.toLocaleString()}</b>m
        &nbsp;│&nbsp;
        <b>{areaM2.toLocaleString()}</b>m²&nbsp;
        =&nbsp;<b>{areaKm2.toFixed(2)}</b>km²&nbsp;
        =&nbsp;<b>{areaPy.toLocaleString()}</b>평
        &nbsp;│&nbsp;
        격자&nbsp;{cellSize}m
        &nbsp;│&nbsp;
        시설&nbsp;<b>{facilities.length}</b>개
      </span>

      <span style={styles.divider}>│</span>

      {/* 우측: 줌 + 선택 정보 */}
      <span style={{ ...styles.section, display: 'flex', gap: '10px', alignItems: 'center' }}>
        {selectedIds.length > 1 && (
          <span style={styles.selected}>선택&nbsp;<b>{selectedIds.length}개</b></span>
        )}
        {selectedFac && (
          <span style={styles.selected}>
            선택&nbsp;<b style={{ color: selectedFac.color }}>{selectedFac.name}</b>
          </span>
        )}
        <span>줌&nbsp;<b>{(zoom ?? 1).toFixed(2)}×</b></span>
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
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    gap: '8px',
    userSelect: 'none',
    flexShrink: 0,
  },
  section: {
    whiteSpace: 'nowrap',
  },
  divider: {
    color: '#2a2a40',
    flexShrink: 0,
  },
  selected: {
    color: '#8888bb',
  },
};
