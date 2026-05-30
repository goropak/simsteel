import { useFacilitiesStore } from '../state/facilitiesStore.js';

/** 색상 프리셋 5종 */
const PRESET_COLORS = [
  '#ff6b6b',  // 고로 계열 (적색)
  '#6bffb8',  // 소결 계열 (청록)
  '#6b9fff',  // 코크스 계열 (청색)
  '#ffcc6b',  // 원료 계열 (황색)
  '#d46bff',  // 기타 (보라)
];

/**
 * 우측 시설 편집 패널 (280px)
 * - selectedIds.length === 0 : 플레이스홀더
 * - selectedIds.length === 1 : 단일 편집 폼
 * - selectedIds.length >= 2  : 다중 선택 패널 (삭제/복사)
 */
export default function FacilityEditor() {
  const facilities     = useFacilitiesStore((s) => s.facilities);
  const selectedIds    = useFacilitiesStore((s) => s.selectedIds);
  const updateFacility = useFacilitiesStore((s) => s.updateFacility);
  const removeFacility = useFacilitiesStore((s) => s.removeFacility);
  const deleteSelected = useFacilitiesStore((s) => s.deleteSelected);
  const copySelected   = useFacilitiesStore((s) => s.copySelected);
  const clearSelection = useFacilitiesStore((s) => s.clearSelection);

  // ── 플레이스홀더 ─────────────────────────────────────────────────────
  if (selectedIds.length === 0) {
    return (
      <aside style={styles.sidebar}>
        <div style={styles.header}>시설 정보</div>
        <div style={styles.placeholder}>
          시설을 클릭하여 선택<br />
          <span style={styles.placeholderSub}>Cmd+클릭: 다중 선택</span>
        </div>
      </aside>
    );
  }

  // ── 다중 선택 패널 ───────────────────────────────────────────────────
  if (selectedIds.length > 1) {
    return (
      <aside style={styles.sidebar}>
        <div style={styles.header}>시설 정보</div>
        <div style={styles.multiPanel}>
          <div style={styles.multiCount}>{selectedIds.length}개 선택됨</div>
          <div style={styles.multiHint}>Cmd+D: 복사 · Delete: 삭제</div>
        </div>
        <div style={styles.btnRow}>
          <button
            style={styles.btnCopy}
            onClick={copySelected}
          >
            복사 (+5셀)
          </button>
          <button
            style={styles.btnDelete}
            onClick={() => {
              if (window.confirm(`선택된 시설 ${selectedIds.length}개를 삭제하시겠습니까?`))
                deleteSelected();
            }}
          >
            삭제
          </button>
        </div>
        <div style={{ padding: '0 12px 8px' }}>
          <button style={styles.btnDeselect} onClick={clearSelection}>
            선택 해제
          </button>
        </div>
      </aside>
    );
  }

  // ── 단일 편집 폼 ──────────────────────────────────────────────────────
  const fac = facilities.find((f) => f.id === selectedIds[0]);
  if (!fac) return null;

  const handleChange = (field, value) => updateFacility(fac.id, { [field]: value });

  const handleSizeChange = (axis, raw) => {
    const v = Math.max(1, Math.min(50, parseInt(raw, 10) || 1));
    updateFacility(fac.id, { size: { ...fac.size, [axis]: v } });
  };

  const handleDelete = () => {
    if (window.confirm(`'${fac.name}'을(를) 삭제하시겠습니까?`))
      removeFacility(fac.id);
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>시설 정보</div>

      <div style={styles.scroll}>
        {/* 이름 */}
        <Field label="이름">
          <input
            style={styles.input}
            value={fac.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </Field>

        {/* 위치 (읽기 전용) */}
        <Field label="위치 (셀)">
          <div style={styles.readOnly}>
            col {fac.position.col}, row {fac.position.row}
            <span style={styles.readOnlyHint}>&nbsp;(이동: v0.2.3)</span>
          </div>
        </Field>

        {/* 크기 */}
        <Field label="크기 (셀)">
          <div style={styles.row}>
            <label style={styles.miniLabel}>W</label>
            <input
              style={{ ...styles.input, width: '52px' }}
              type="number" min={1} max={50}
              value={fac.size.width}
              onChange={(e) => handleSizeChange('width', e.target.value)}
            />
            <label style={styles.miniLabel}>H</label>
            <input
              style={{ ...styles.input, width: '52px' }}
              type="number" min={1} max={50}
              value={fac.size.height}
              onChange={(e) => handleSizeChange('height', e.target.value)}
            />
            <span style={styles.dimHint}>
              ={fac.size.width * 5}×{fac.size.height * 5}m
            </span>
          </div>
        </Field>

        {/* 용량 */}
        <Field label="용량">
          <input
            style={styles.input}
            value={fac.capacity}
            onChange={(e) => handleChange('capacity', e.target.value)}
            placeholder="예: 5,350 m³"
          />
        </Field>

        {/* 색상 */}
        <Field label="색상">
          <div style={styles.colorRow}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                title={c}
                onClick={() => handleChange('color', c)}
                style={{
                  ...styles.colorSwatch,
                  background: c,
                  outline: fac.color === c ? '2px solid #fff' : '1px solid #444',
                  outlineOffset: fac.color === c ? '2px' : '0',
                }}
              />
            ))}
            <input
              type="color"
              value={fac.color}
              onChange={(e) => handleChange('color', e.target.value)}
              style={styles.colorPicker}
              title="커스텀 색상"
            />
          </div>
        </Field>

        {/* 비고 */}
        <Field label="비고">
          <textarea
            style={styles.textarea}
            value={fac.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            placeholder="자유 메모..."
          />
        </Field>
      </div>

      {/* 하단 버튼 */}
      <div style={styles.btnRow}>
        <button style={styles.btnDeselect} onClick={clearSelection}>
          선택 해제
        </button>
        <button style={styles.btnDelete} onClick={handleDelete}>
          삭제
        </button>
      </div>
    </aside>
  );
}

function Field({ label, children }) {
  return (
    <div style={fieldStyles.wrap}>
      <div style={fieldStyles.label}>{label}</div>
      {children}
    </div>
  );
}

const fieldStyles = {
  wrap:  { padding: '7px 12px', borderBottom: '1px solid #1e1e2e' },
  label: { fontSize: '9px', color: '#5555aa', marginBottom: '4px', letterSpacing: '0.5px' },
};

const styles = {
  sidebar: {
    flex: 1,
    background: '#12121c',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Courier New, monospace',
    overflow: 'hidden',
    minHeight: 0,
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
  placeholder: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    fontSize: '11px',
    color: '#333355',
    lineHeight: 1.7,
    padding: '24px',
    gap: '4px',
  },
  placeholderSub: {
    fontSize: '10px',
    color: '#2a2a44',
  },
  multiPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  multiCount: {
    fontSize: '18px',
    color: '#9999ee',
  },
  multiHint: {
    fontSize: '10px',
    color: '#444466',
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
  },
  input: {
    width: '100%',
    background: '#1a1a28',
    border: '1px solid #2a2a40',
    borderRadius: '3px',
    color: '#aaaadd',
    fontFamily: 'Courier New, monospace',
    fontSize: '11px',
    padding: '4px 6px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    background: '#1a1a28',
    border: '1px solid #2a2a40',
    borderRadius: '3px',
    color: '#aaaadd',
    fontFamily: 'Courier New, monospace',
    fontSize: '11px',
    padding: '4px 6px',
    boxSizing: 'border-box',
    resize: 'vertical',
    outline: 'none',
  },
  readOnly: {
    fontSize: '11px',
    color: '#6666aa',
    padding: '3px 0',
  },
  readOnlyHint: {
    fontSize: '9px',
    color: '#444466',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  miniLabel: {
    fontSize: '9px',
    color: '#5555aa',
  },
  dimHint: {
    fontSize: '9px',
    color: '#5555aa',
    marginLeft: '4px',
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  colorSwatch: {
    width: '20px',
    height: '20px',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  colorPicker: {
    width: '24px',
    height: '20px',
    border: '1px solid #444',
    borderRadius: '3px',
    cursor: 'pointer',
    padding: 0,
    background: 'none',
  },
  btnRow: {
    display: 'flex',
    gap: '8px',
    padding: '10px 12px',
    borderTop: '1px solid #2a2a40',
    flexShrink: 0,
  },
  btnDeselect: {
    flex: 1,
    background: '#1e1e38',
    border: '1px solid #3a3a60',
    borderRadius: '3px',
    color: '#8888bb',
    fontFamily: 'Courier New, monospace',
    fontSize: '11px',
    padding: '6px',
    cursor: 'pointer',
  },
  btnCopy: {
    flex: 1,
    background: '#1a2a1a',
    border: '1px solid #3a6030',
    borderRadius: '3px',
    color: '#88bb88',
    fontFamily: 'Courier New, monospace',
    fontSize: '11px',
    padding: '6px',
    cursor: 'pointer',
  },
  btnDelete: {
    flex: 1,
    background: '#2a1010',
    border: '1px solid #602020',
    borderRadius: '3px',
    color: '#cc6666',
    fontFamily: 'Courier New, monospace',
    fontSize: '11px',
    padding: '6px',
    cursor: 'pointer',
  },
};
