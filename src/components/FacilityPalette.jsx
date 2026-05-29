import { useState } from 'react';
import { FACILITY_CATEGORIES } from '../data/facilityCategories.js';
import { useFacilitiesStore } from '../state/facilitiesStore.js';

/**
 * 좌측 시설 팔레트 사이드바 (240px)
 * - 카테고리 트리 (접기/펼치기)
 * - enabled 시설: 클릭 → 배치 모드 진입
 * - disabled 시설: 회색 + "(준비 중)"
 * - ESC 안내 및 현재 선택 표시
 */
export default function FacilityPalette() {
  const paletteSelectedTypeId = useFacilitiesStore((s) => s.paletteSelectedTypeId);
  const setPaletteSelection   = useFacilitiesStore((s) => s.setPaletteSelection);

  // 카테고리별 열림 상태 (기본: 모두 열림)
  const [openCategories, setOpenCategories] = useState(() =>
    Object.fromEntries(FACILITY_CATEGORIES.map((c) => [c.id, true]))
  );

  const toggleCategory = (id) =>
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleFacilityClick = (fac) => {
    if (!fac.enabled) return;
    setPaletteSelection(paletteSelectedTypeId === fac.id ? null : fac.id);
  };

  // 현재 선택된 시설 이름 찾기
  const selectedName = paletteSelectedTypeId
    ? FACILITY_CATEGORIES.flatMap((c) => c.facilities).find((f) => f.id === paletteSelectedTypeId)?.name
    : null;

  return (
    <aside style={styles.sidebar}>
      {/* 헤더 */}
      <div style={styles.header}>시설 팔레트</div>

      {/* 카테고리 트리 */}
      <div style={styles.scroll}>
        {FACILITY_CATEGORIES.map((cat) => (
          <div key={cat.id}>
            {/* 카테고리 헤더 */}
            <button
              style={styles.categoryBtn}
              onClick={() => toggleCategory(cat.id)}
            >
              <span style={styles.chevron}>{openCategories[cat.id] ? '▾' : '▸'}</span>
              {cat.name}
            </button>

            {/* 시설 목록 */}
            {openCategories[cat.id] && (
              <div>
                {cat.facilities.map((fac) => {
                  const isSelected = paletteSelectedTypeId === fac.id;
                  return (
                    <button
                      key={fac.id}
                      disabled={!fac.enabled}
                      onClick={() => handleFacilityClick(fac)}
                      style={{
                        ...styles.facilityBtn,
                        ...(fac.enabled ? styles.facilityEnabled : styles.facilityDisabled),
                        ...(isSelected ? styles.facilitySelected : {}),
                      }}
                    >
                      <span style={styles.facilityDot(fac.enabled, isSelected)} />
                      <span style={styles.facilityName}>{fac.name}</span>
                      {!fac.enabled && (
                        <span style={styles.comingSoon}>(준비 중)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 하단 상태 표시 */}
      <div style={styles.footer}>
        {selectedName ? (
          <>
            <div style={styles.footerSelected}>
              <span style={styles.footerDot}>●</span>
              {selectedName} 선택됨
            </div>
            <div style={styles.footerHint}>격자 클릭으로 배치 · ESC로 해제</div>
          </>
        ) : (
          <div style={styles.footerHint}>시설을 클릭하여 배치 모드 진입</div>
        )}
      </div>
    </aside>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────────

const styles = {
  sidebar: {
    width: '240px',
    flexShrink: 0,
    background: '#12121c',
    borderRight: '1px solid #2a2a40',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Courier New, monospace',
    userSelect: 'none',
  },
  header: {
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    fontSize: '11px',
    color: '#7777cc',
    borderBottom: '1px solid #2a2a40',
    letterSpacing: '1px',
    flexShrink: 0,
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '4px 0',
  },
  categoryBtn: {
    width: '100%',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    fontSize: '11px',
    color: '#9999cc',
    fontFamily: 'Courier New, monospace',
    textAlign: 'left',
  },
  chevron: {
    fontSize: '10px',
    color: '#5555aa',
    width: '10px',
    flexShrink: 0,
  },
  facilityBtn: {
    width: '100%',
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '5px 12px 5px 26px',
    fontSize: '11px',
    fontFamily: 'Courier New, monospace',
    textAlign: 'left',
    transition: 'background 0.1s',
  },
  facilityEnabled: {
    cursor: 'pointer',
    color: '#ccccee',
  },
  facilityDisabled: {
    cursor: 'default',
    color: '#444466',
  },
  facilitySelected: {
    background: '#1e1e38',
    outline: '1px solid #5555cc',
    outlineOffset: '-1px',
  },
  facilityDot: (enabled, selected) => ({
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: selected ? '#ff6b6b' : enabled ? '#5555cc' : '#333355',
    flexShrink: 0,
  }),
  facilityName: {
    flex: 1,
  },
  comingSoon: {
    fontSize: '9px',
    color: '#333355',
  },
  footer: {
    borderTop: '1px solid #2a2a40',
    padding: '8px 12px',
    flexShrink: 0,
  },
  footerSelected: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#ff9999',
    marginBottom: '4px',
  },
  footerDot: {
    fontSize: '8px',
    color: '#ff6b6b',
  },
  footerHint: {
    fontSize: '10px',
    color: '#444466',
  },
};
