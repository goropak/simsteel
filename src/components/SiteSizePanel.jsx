import { useState } from 'react';
import { useFacilitiesStore } from '../state/facilitiesStore.js';
import presets from '../data/sitePresets.json';

/**
 * 부지 크기 조정 패널 (우측 하단 또는 FacilityEditor 하단)
 *
 * 보안: 프리셋은 공개 자료 출처만. 기밀 자산명·GPS 좌표 미포함.
 */
export default function SiteSizePanel() {
  const siteSize    = useFacilitiesStore((s) => s.siteSize);
  const setSiteSize = useFacilitiesStore((s) => s.setSiteSize);

  const [selectedPreset, setSelectedPreset] = useState('medium_ref');
  const [customW, setCustomW] = useState(String(siteSize.widthM));
  const [customH, setCustomH] = useState(String(siteSize.heightM));
  const [isCustom, setIsCustom]  = useState(false);

  const handlePresetChange = (e) => {
    const id = e.target.value;
    setSelectedPreset(id);
    if (id === 'custom') {
      setIsCustom(true);
      return;
    }
    setIsCustom(false);
    const p = presets.find((pr) => pr.id === id);
    if (p && p.widthM) {
      setCustomW(String(p.widthM));
      setCustomH(String(p.heightM));
      setSiteSize(p.widthM, p.heightM);
    }
  };

  const handleApply = () => {
    const w = Math.max(100, Math.min(10000, parseInt(customW, 10) || 2000));
    const h = Math.max(100, Math.min(10000, parseInt(customH, 10) || 2000));
    setCustomW(String(w));
    setCustomH(String(h));
    setSiteSize(w, h);
  };

  const currentPreset = presets.find((p) => p.id === selectedPreset);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>부지 크기</div>

      <div style={styles.body}>
        {/* 프리셋 드롭다운 */}
        <div style={styles.field}>
          <label style={styles.label}>프리셋</label>
          <select
            style={styles.select}
            value={selectedPreset}
            onChange={handlePresetChange}
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* 출처 표시 */}
        {currentPreset?.source && (
          <div style={styles.source}>
            출처: {currentPreset.source}
          </div>
        )}

        {/* 가로 × 세로 입력 */}
        <div style={styles.field}>
          <label style={styles.label}>가로 (m)</label>
          <input
            style={styles.input}
            type="number"
            min={100}
            max={10000}
            step={50}
            value={customW}
            onChange={(e) => { setCustomW(e.target.value); setIsCustom(true); setSelectedPreset('custom'); }}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>세로 (m)</label>
          <input
            style={styles.input}
            type="number"
            min={100}
            max={10000}
            step={50}
            value={customH}
            onChange={(e) => { setCustomH(e.target.value); setIsCustom(true); setSelectedPreset('custom'); }}
          />
        </div>

        {/* 면적 계산 표시 */}
        <div style={styles.areaBox}>
          <div style={styles.areaRow}>
            <span style={styles.areaLabel}>면적</span>
            <span style={styles.areaVal}>
              {(siteSize.widthM * siteSize.heightM).toLocaleString()} m²
            </span>
          </div>
          <div style={styles.areaRow}>
            <span style={styles.areaLabel}>km²</span>
            <span style={styles.areaVal}>
              {(siteSize.widthM * siteSize.heightM / 1_000_000).toFixed(2)} km²
            </span>
          </div>
          <div style={styles.areaRow}>
            <span style={styles.areaLabel}>평</span>
            <span style={{ ...styles.areaVal, color: '#aaaadd' }}>
              {Math.round(siteSize.widthM * siteSize.heightM / 3.3058).toLocaleString()} 평
            </span>
          </div>
        </div>

        {/* 적용 버튼 */}
        <button style={styles.btnApply} onClick={handleApply}>
          적용
        </button>
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
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    fontSize: '10px',
    color: '#7777cc',
    borderBottom: '1px solid #1e1e2e',
    letterSpacing: '1px',
  },
  body: {
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  field: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  label: {
    fontSize: '9px',
    color: '#5555aa',
    width: '52px',
    flexShrink: 0,
  },
  select: {
    flex: 1,
    background: '#1a1a28',
    border: '1px solid #2a2a40',
    borderRadius: '3px',
    color: '#aaaadd',
    fontFamily: 'Courier New, monospace',
    fontSize: '10px',
    padding: '3px 4px',
    outline: 'none',
  },
  input: {
    flex: 1,
    background: '#1a1a28',
    border: '1px solid #2a2a40',
    borderRadius: '3px',
    color: '#aaaadd',
    fontFamily: 'Courier New, monospace',
    fontSize: '11px',
    padding: '3px 6px',
    outline: 'none',
  },
  source: {
    fontSize: '9px',
    color: '#444466',
    fontStyle: 'italic',
    paddingLeft: '2px',
  },
  areaBox: {
    background: '#0e0e18',
    border: '1px solid #2a2a40',
    borderRadius: '3px',
    padding: '6px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    marginTop: '2px',
  },
  areaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  areaLabel: {
    fontSize: '9px',
    color: '#5555aa',
    width: '28px',
  },
  areaVal: {
    fontSize: '11px',
    color: '#8888bb',
    fontVariantNumeric: 'tabular-nums',
  },
  btnApply: {
    width: '100%',
    background: '#1a2a1a',
    border: '1px solid #3a6030',
    borderRadius: '3px',
    color: '#88bb88',
    fontFamily: 'Courier New, monospace',
    fontSize: '11px',
    padding: '5px',
    cursor: 'pointer',
    marginTop: '2px',
  },
};
