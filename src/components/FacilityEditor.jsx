import { useState } from 'react';
import { useFacilitiesStore } from '../state/facilitiesStore.js';
import { useTerrainStore } from '../state/terrainStore.js';

const TERRAIN_NAMES = { river: '강', road: '도로', tree: '나무' };
const TERRAIN_COLORS_CSS = { river: '#5599cc', road: '#888888', tree: '#44aa44' };

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
  const facilities        = useFacilitiesStore((s) => s.facilities);
  const selectedIds       = useFacilitiesStore((s) => s.selectedIds);
  const updateFacility    = useFacilitiesStore((s) => s.updateFacility);
  const removeFacility    = useFacilitiesStore((s) => s.removeFacility);
  const deleteSelected    = useFacilitiesStore((s) => s.deleteSelected);
  const copySelected      = useFacilitiesStore((s) => s.copySelected);
  const clearSelection    = useFacilitiesStore((s) => s.clearSelection);
  const tryRotateSelected = useFacilitiesStore((s) => s.tryRotateSelected);
  const addCustomFacility = useFacilitiesStore((s) => s.addCustomFacility);

  const terrains            = useTerrainStore((s) => s.terrains);
  const selectedTerrainId   = useTerrainStore((s) => s.selectedTerrainId);
  const removeTerrain       = useTerrainStore((s) => s.removeTerrain);
  const clearTerrainSel     = useTerrainStore((s) => s.clearTerrainSelection);
  const tryRotateTerrain    = useTerrainStore((s) => s.tryRotateTerrain);

  // v0.5.1 (대통령 요청 #4) — 다른 패널과 동일한 열기/닫기 토글 (기본: 열림)
  const [open, setOpen] = useState(true);
  const panelHeader = (title) => (
    <div style={styles.header}>
      <span>{title}</span>
      <button style={styles.toggle} onClick={() => setOpen((v) => !v)}>
        {open ? '▴ 닫기' : '▾ 열기'}
      </button>
    </div>
  );

  // ── 플레이스홀더 or 지형 정보 ───────────────────────────────────────
  if (selectedIds.length === 0) {
    // 지형이 선택된 경우
    if (selectedTerrainId) {
      const t = terrains.find((x) => x.id === selectedTerrainId);
      if (t) {
        const colorCss = TERRAIN_COLORS_CSS[t.type] || '#888888';
        return (
          <aside style={styles.sidebar}>
            {panelHeader('지형 정보')}
            {open && <>
            <div style={styles.scroll}>
              <Field label="종류">
                <div style={{ ...styles.readOnly, color: colorCss, fontWeight: 'bold' }}>
                  {TERRAIN_NAMES[t.type] || t.type}
                </div>
              </Field>
              <Field label="위치 (셀)">
                <div style={styles.readOnly}>col {t.col}, row {t.row}</div>
              </Field>
              <Field label="크기 (셀)">
                <div style={styles.readOnly}>{t.width} × {t.height}
                  <span style={styles.readOnlyHint}> = {t.width*5}×{t.height*5}m</span>
                </div>
              </Field>
            </div>
            <div style={{ padding: '8px 12px 0', borderTop: '1px solid #2a2a40' }}>
              <button
                style={{ ...styles.btnRotate, width: '100%' }}
                onClick={() => {
                  const ok = tryRotateTerrain(t.id);
                  if (!ok) window.alert('회전 불가: 부지 경계를 벗어납니다.');
                }}
              >
                ↻ 90° 회전 (R키)
              </button>
            </div>
            <div style={styles.btnRow}>
              <button style={styles.btnDeselect} onClick={clearTerrainSel}>선택 해제</button>
              <button style={styles.btnDelete} onClick={() => {
                if (window.confirm(`이 ${TERRAIN_NAMES[t.type] || '지형'}을(를) 삭제하시겠습니까?`))
                  removeTerrain(t.id);
              }}>삭제</button>
            </div>
            </>}
          </aside>
        );
      }
    }

    return (
      <aside style={styles.sidebar}>
        {panelHeader('시설 정보')}
        {open && (
          <div style={styles.placeholder}>
            시설을 클릭하여 선택<br />
            <span style={styles.placeholderSub}>Cmd+클릭: 다중 선택</span>
          </div>
        )}
      </aside>
    );
  }

  // ── 다중 선택 패널 ───────────────────────────────────────────────────
  if (selectedIds.length > 1) {
    return (
      <aside style={styles.sidebar}>
        {panelHeader('시설 정보')}
        {open && <>
        <div style={styles.multiPanel}>
          <div style={styles.multiCount}>{selectedIds.length}개 선택됨</div>
          <div style={styles.multiHint}>Cmd+D: 복사 · Delete: 삭제 · R: 회전</div>
        </div>
        <div style={styles.btnRow}>
          <button style={styles.btnRotate} onClick={() => tryRotateSelected()}>
            ↻ 회전
          </button>
          <button style={styles.btnCopy} onClick={copySelected}>
            복사 (+5셀)
          </button>
        </div>
        <div style={{ padding: '0 12px' }}>
          <button
            style={{ ...styles.btnDelete, width: '100%' }}
            onClick={() => {
              if (window.confirm(`선택된 시설 ${selectedIds.length}개를 삭제하시겠습니까?`))
                deleteSelected();
            }}
          >
            삭제
          </button>
        </div>
        <div style={{ padding: '6px 12px 8px' }}>
          <button style={styles.btnDeselect} onClick={clearSelection}>
            선택 해제
          </button>
        </div>
        </>}
      </aside>
    );
  }

  // ── 단일 편집 폼 ──────────────────────────────────────────────────────
  const fac = facilities.find((f) => f.id === selectedIds[0]);
  if (!fac) return null;

  const isCustom = fac.source === 'user-defined';
  const handleChange = (field, value) => updateFacility(fac.id, { [field]: value });

  const handleCopyToCustom = () => {
    addCustomFacility({
      name:   fac.name,
      width:  fac.size.width,
      height: fac.size.height,
      label:  fac.abbrev || '',
      color:  fac.color,
    });
    window.alert(`'${fac.name}'을(를) 사용자 정의 시설로 복사했습니다.\n팔레트 하단 "사용자 정의" 섹션에서 확인하세요.`);
  };

  const handleSizeChange = (axis, raw) => {
    // 팔레트 커스텀 시설(1~200셀)과 동일 범위로 정렬 — 대형 시설 편집 제한 제거
    const v = Math.max(1, Math.min(200, parseInt(raw, 10) || 1));
    updateFacility(fac.id, { size: { ...fac.size, [axis]: v } });
  };

  const handleDelete = () => {
    if (window.confirm(`'${fac.name}'을(를) 삭제하시겠습니까?`))
      removeFacility(fac.id);
  };

  return (
    <aside style={styles.sidebar}>
      {panelHeader('시설 정보')}

      {open && <>
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
              type="number" min={1} max={200}
              value={fac.size.width}
              onChange={(e) => handleSizeChange('width', e.target.value)}
            />
            <label style={styles.miniLabel}>H</label>
            <input
              style={{ ...styles.input, width: '52px' }}
              type="number" min={1} max={200}
              value={fac.size.height}
              onChange={(e) => handleSizeChange('height', e.target.value)}
            />
            <span style={styles.dimHint}>
              ={fac.size.width * 5}×{fac.size.height * 5}m
            </span>
          </div>
          <div style={styles.kbdHint}>
            키보드 ←/→ 가로 · ↑/↓ 세로 (Shift=5셀) · 모서리 드래그도 가능
          </div>
        </Field>

        {/* 면적 (v0.5.0 — feature 11) */}
        <Field label="면적">
          <div style={styles.readOnly}>
            {(fac.size.width * 5 * fac.size.height * 5).toLocaleString()} m²
            <span style={styles.readOnlyHint}>
              &nbsp;({(fac.size.width * 5 * fac.size.height * 5 / 10000).toLocaleString(undefined, { maximumFractionDigits: 2 })} ha · {fac.size.width}×{fac.size.height}셀)
            </span>
          </div>
        </Field>

        {/* Phase (v0.2.4) */}
        <Field label="Phase">
          <div style={styles.row}>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => handleChange('phase', p)}
                style={{
                  ...styles.phaseBtn,
                  ...(( fac.phase ?? 1) === p ? styles.phaseBtnActive(p) : {}),
                }}
              >
                P{p}
              </button>
            ))}
            <span style={styles.readOnlyHint}>&nbsp;Phase 뷰: 팔레트 토글</span>
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

        {/* 비고 (v0.5.0 — feature 10: 높이 확대 + 스크롤 개선) */}
        <Field label="비고 (자유 메모)">
          <textarea
            style={styles.textarea}
            value={fac.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={7}
            placeholder="자유 메모..."
          />
        </Field>
      </div>

      {/* 하단 버튼 */}
      {/* 회전 버튼 (R키 동일 로직 — AABB 사전 검사 포함) */}
      <div style={{ padding: '8px 12px 0', borderTop: '1px solid #2a2a40' }}>
        <button
          style={{ ...styles.btnRotate, width: '100%' }}
          onClick={() => {
            const ok = tryRotateSelected();
            if (!ok) window.alert('회전 불가: 부지 경계 또는 다른 시설과 겹칩니다.');
          }}
        >
          ↻ 90° 회전 (R키)
        </button>
      </div>
      {/* TEFR 시설: 커스텀으로 복사 버튼 */}
      {!isCustom && (
        <div style={{ padding: '6px 12px 0' }}>
          <button
            style={{ ...styles.btnDeselect, width: '100%', fontSize: '10px' }}
            onClick={handleCopyToCustom}
            title="이 시설 유형을 사용자 정의 팔레트에 복사합니다"
          >
            ⎘ 커스텀으로 복사
          </button>
        </div>
      )}
      <div style={styles.btnRow}>
        <button style={styles.btnDeselect} onClick={clearSelection}>
          선택 해제
        </button>
        <button style={styles.btnDelete} onClick={handleDelete}>
          삭제
        </button>
      </div>
      </>}
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
  // v0.5.1 (#4): flex:1·내부 스크롤 → 자연 높이로 전환.
  // 우측 컬럼(rightCol)이 전체를 스크롤하므로 하단 버튼(회전·색·삭제)이 항상 도달 가능.
  sidebar: {
    flexShrink: 0,
    background: '#12121c',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Courier New, monospace',
  },
  header: {
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    fontSize: '11px',
    color: '#7777cc',
    borderBottom: '1px solid #2a2a40',
    letterSpacing: '1px',
    flexShrink: 0,
  },
  toggle: {
    background: 'transparent',
    border: '1px solid #2a2a40',
    borderRadius: '3px',
    color: '#6666aa',
    fontFamily: 'Courier New, monospace',
    fontSize: '9px',
    padding: '2px 6px',
    cursor: 'pointer',
  },
  placeholder: {
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '20px 12px',
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
    // v0.5.1 (#4): 내부 스크롤 제거 — 자연 높이, 외부(rightCol) 스크롤 사용
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
    minHeight: '120px',
    background: '#1a1a28',
    border: '1px solid #2a2a40',
    borderRadius: '3px',
    color: '#aaaadd',
    fontFamily: 'Courier New, monospace',
    fontSize: '11px',
    lineHeight: 1.5,
    padding: '6px 8px',
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
  kbdHint: {
    fontSize: '9px',
    color: '#445588',
    marginTop: '5px',
    lineHeight: 1.5,
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
  phaseBtn: {
    background: '#1a1a2a',
    border: '1px solid #3a3a60',
    borderRadius: '3px',
    color: '#666688',
    fontFamily: 'Courier New, monospace',
    fontSize: '10px',
    padding: '3px 8px',
    cursor: 'pointer',
    marginRight: '4px',
  },
  phaseBtnActive: (p) => ({
    background: p === 1 ? '#1a2a1a' : p === 2 ? '#2a1a0a' : '#1a0a2a',
    border: `1px solid ${p === 1 ? '#558844' : p === 2 ? '#cc6600' : '#8844cc'}`,
    color: p === 1 ? '#88cc66' : p === 2 ? '#ffaa44' : '#cc88ff',
  }),
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
  btnRotate: {
    flex: 1,
    background: '#1a1a2a',
    border: '1px solid #4a4a80',
    borderRadius: '3px',
    color: '#aaaaee',
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
