import { useState, useEffect } from 'react';
import { FACILITY_CATEGORIES } from '../data/facilityCategories.js';
import { useFacilitiesStore } from '../state/facilitiesStore.js';

const FIRST_SAVE_KEY = 'simsteel:custom-first-save';

/**
 * 좌측 시설 팔레트 사이드바 (240px)
 * - TEFR 카테고리 트리 (접기/펼치기)
 * - 하단: "사용자 정의" 섹션 (localStorage 영속, TEFR과 시각 구분)
 */
export default function FacilityPalette() {
  const paletteSelectedTypeId = useFacilitiesStore((s) => s.paletteSelectedTypeId);
  const setPaletteSelection   = useFacilitiesStore((s) => s.setPaletteSelection);
  const customFacilities      = useFacilitiesStore((s) => s.customFacilities);
  const addCustomFacility     = useFacilitiesStore((s) => s.addCustomFacility);
  const deleteCustomFacility  = useFacilitiesStore((s) => s.deleteCustomFacility);

  const [openCategories, setOpenCategories] = useState(() =>
    Object.fromEntries(FACILITY_CATEGORIES.map((c) => [c.id, true]))
  );
  const [showForm, setShowForm]   = useState(false);
  const [toastMsg, setToastMsg]   = useState('');
  const [form, setForm] = useState({ name: '', width: '10', height: '10', label: '', color: '#6b9fff' });

  const toggleCategory = (id) =>
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleFacilityClick = (fac) => {
    if (!fac.enabled) return;
    setPaletteSelection(paletteSelectedTypeId === fac.id ? null : fac.id);
  };

  const handleCustomClick = (fac) => {
    setPaletteSelection(paletteSelectedTypeId === fac.id ? null : fac.id);
  };

  const handleFormChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleCreate = () => {
    const name = form.name.trim();
    if (!name) return;
    const w = Math.max(1, parseInt(form.width, 10) || 1);
    const h = Math.max(1, parseInt(form.height, 10) || 1);

    // 첫 저장 토스트 (보안 안내 — 헌법 0조 부칙)
    if (!localStorage.getItem(FIRST_SAVE_KEY)) {
      localStorage.setItem(FIRST_SAVE_KEY, '1');
      setToastMsg('이 데이터는 브라우저에만 저장됩니다. 다른 기기에서 보이지 않습니다.');
      setTimeout(() => setToastMsg(''), 5000);
    }

    addCustomFacility({
      name,
      width:  w,
      height: h,
      label:  form.label.trim() || '',
      color:  form.color,
    });
    setForm({ name: '', width: '10', height: '10', label: '', color: '#6b9fff' });
    setShowForm(false);
  };

  const handleDeleteCustom = (e, id) => {
    e.stopPropagation();
    const fac = customFacilities.find((f) => f.id === id);
    const instances = useFacilitiesStore.getState().facilities.filter(
      (f) => f.typeId === id
    ).length;
    const msg = instances > 0
      ? `'${fac?.name}' 정의를 삭제하시겠습니까?\n배치된 인스턴스 ${instances}개는 그대로 유지됩니다.`
      : `'${fac?.name}' 정의를 삭제하시겠습니까?`;
    if (window.confirm(msg)) {
      if (paletteSelectedTypeId === id) setPaletteSelection(null);
      deleteCustomFacility(id);
    }
  };

  // 선택된 시설 이름 (TEFR + custom 모두 검색)
  const selectedName = paletteSelectedTypeId
    ? (FACILITY_CATEGORIES.flatMap((c) => c.facilities).find((f) => f.id === paletteSelectedTypeId)?.name
       || customFacilities.find((f) => f.id === paletteSelectedTypeId)?.name)
    : null;

  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>시설 팔레트</div>

      <div style={styles.scroll}>
        {/* TEFR 카테고리 트리 */}
        {FACILITY_CATEGORIES.map((cat) => (
          <div key={cat.id}>
            <button style={styles.categoryBtn} onClick={() => toggleCategory(cat.id)}>
              <span style={styles.chevron}>{openCategories[cat.id] ? '▾' : '▸'}</span>
              {cat.name}
            </button>
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
                      {!fac.enabled && <span style={styles.comingSoon}>(준비 중)</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* ── 사용자 정의 섹션 ── */}
        <div style={styles.customDivider} />
        <div style={styles.customHeader}>
          <span style={styles.customHeaderText}>사용자 정의</span>
          <button
            style={styles.addBtn}
            onClick={() => setShowForm((v) => !v)}
            title="새 시설 만들기"
          >
            {showForm ? '✕' : '＋'}
          </button>
        </div>

        {/* 생성 폼 */}
        {showForm && (
          <div style={styles.form}>
            <div style={styles.formRow}>
              <label style={styles.formLabel}>이름 *</label>
              <input
                style={styles.formInput}
                placeholder="시설명"
                value={form.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <div style={styles.formRow}>
              <label style={styles.formLabel}>가로(셀) *</label>
              <input
                style={{ ...styles.formInput, width: '60px' }}
                type="number" min={1} max={200}
                value={form.width}
                onChange={(e) => handleFormChange('width', e.target.value)}
              />
              <label style={{ ...styles.formLabel, marginLeft: '6px' }}>세로(셀) *</label>
              <input
                style={{ ...styles.formInput, width: '60px' }}
                type="number" min={1} max={200}
                value={form.height}
                onChange={(e) => handleFormChange('height', e.target.value)}
              />
            </div>
            <div style={styles.formRow}>
              <label style={styles.formLabel}>약어</label>
              <input
                style={{ ...styles.formInput, width: '60px' }}
                placeholder="선택"
                maxLength={4}
                value={form.label}
                onChange={(e) => handleFormChange('label', e.target.value)}
              />
              <label style={{ ...styles.formLabel, marginLeft: '6px' }}>색상</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => handleFormChange('color', e.target.value)}
                style={styles.colorPicker}
              />
            </div>
            <div style={styles.formHint}>1셀 = 5m · 가로 {(parseInt(form.width)||1)*5}m × 세로 {(parseInt(form.height)||1)*5}m</div>
            <div style={styles.formBtns}>
              <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>취소</button>
              <button
                style={{ ...styles.createBtn, opacity: form.name.trim() ? 1 : 0.4 }}
                disabled={!form.name.trim()}
                onClick={handleCreate}
              >
                만들기
              </button>
            </div>
          </div>
        )}

        {/* 커스텀 시설 목록 */}
        {customFacilities.length === 0 && !showForm && (
          <div style={styles.customEmpty}>
            ＋ 버튼으로 시설을 만드세요
          </div>
        )}
        {customFacilities.map((fac) => {
          const isSelected = paletteSelectedTypeId === fac.id;
          return (
            <button
              key={fac.id}
              onClick={() => handleCustomClick(fac)}
              style={{
                ...styles.facilityBtn,
                ...styles.facilityEnabled,
                ...(isSelected ? styles.facilitySelected : {}),
                paddingRight: '4px',
              }}
            >
              <span style={{ ...styles.facilityDot(true, isSelected), background: isSelected ? '#ff6b6b' : fac.color }} />
              <span style={styles.facilityName}>{fac.name}</span>
              <span style={styles.customSize}>{fac.width}×{fac.height}</span>
              <button
                style={styles.deleteBtn}
                onClick={(e) => handleDeleteCustom(e, fac.id)}
                title="삭제"
              >
                ✕
              </button>
            </button>
          );
        })}
      </div>

      {/* 토스트 (첫 저장 안내) */}
      {toastMsg && (
        <div style={styles.toast}>{toastMsg}</div>
      )}

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
    position: 'relative',
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
  facilityEnabled:  { cursor: 'pointer', color: '#ccccee' },
  facilityDisabled: { cursor: 'default', color: '#444466' },
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
  facilityName: { flex: 1 },
  comingSoon: { fontSize: '9px', color: '#333355' },

  // ── 사용자 정의 섹션 ──────────────────────────────────────────────
  customDivider: {
    borderTop: '1px solid #2a2a40',
    margin: '8px 0 0',
  },
  customHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px 4px',
    gap: '6px',
  },
  customHeaderText: {
    flex: 1,
    fontSize: '11px',
    color: '#88aacc',
    letterSpacing: '0.5px',
  },
  addBtn: {
    background: '#1a2a3a',
    border: '1px solid #3a5a7a',
    borderRadius: '3px',
    color: '#88aacc',
    fontFamily: 'Courier New, monospace',
    fontSize: '12px',
    width: '22px',
    height: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
  },
  customEmpty: {
    fontSize: '10px',
    color: '#333355',
    padding: '6px 26px 8px',
  },
  customSize: {
    fontSize: '9px',
    color: '#445566',
    flexShrink: 0,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#554444',
    cursor: 'pointer',
    fontSize: '9px',
    padding: '0 4px',
    flexShrink: 0,
    fontFamily: 'Courier New, monospace',
  },

  // ── 생성 폼 ──────────────────────────────────────────────────────
  form: {
    background: '#0e1520',
    borderTop: '1px solid #1e3040',
    borderBottom: '1px solid #1e3040',
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  formLabel: {
    fontSize: '9px',
    color: '#5577aa',
    flexShrink: 0,
    width: '48px',
  },
  formInput: {
    flex: 1,
    background: '#1a2030',
    border: '1px solid #2a3a50',
    borderRadius: '3px',
    color: '#aabbdd',
    fontFamily: 'Courier New, monospace',
    fontSize: '11px',
    padding: '3px 5px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  colorPicker: {
    width: '28px',
    height: '20px',
    border: '1px solid #2a3a50',
    borderRadius: '3px',
    cursor: 'pointer',
    padding: 0,
    background: 'none',
  },
  formHint: {
    fontSize: '9px',
    color: '#445566',
  },
  formBtns: {
    display: 'flex',
    gap: '6px',
    marginTop: '2px',
  },
  cancelBtn: {
    flex: 1,
    background: '#1a1a28',
    border: '1px solid #2a2a40',
    borderRadius: '3px',
    color: '#666688',
    fontFamily: 'Courier New, monospace',
    fontSize: '10px',
    padding: '4px',
    cursor: 'pointer',
  },
  createBtn: {
    flex: 1,
    background: '#102030',
    border: '1px solid #3a6080',
    borderRadius: '3px',
    color: '#88bbdd',
    fontFamily: 'Courier New, monospace',
    fontSize: '10px',
    padding: '4px',
    cursor: 'pointer',
  },

  // ── 토스트 ────────────────────────────────────────────────────────
  toast: {
    position: 'absolute',
    bottom: '60px',
    left: '8px',
    right: '8px',
    background: '#1a2030',
    border: '1px solid #3a5a70',
    borderRadius: '4px',
    color: '#88bbdd',
    fontSize: '10px',
    padding: '8px 10px',
    lineHeight: 1.5,
    zIndex: 10,
  },

  // ── 하단 ─────────────────────────────────────────────────────────
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
  footerDot:  { fontSize: '8px', color: '#ff6b6b' },
  footerHint: { fontSize: '10px', color: '#444466' },
};
