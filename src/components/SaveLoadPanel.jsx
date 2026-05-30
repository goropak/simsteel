/**
 * 레이아웃 저장/불러오기 + PNG 캡처 패널 (v0.2.5)
 *
 * 보안 (헌법 0조 부칙):
 *   - localStorage만 사용. 파일 export/import UI 없음 (v0.4 보류).
 *   - "안전합니다" 류 단언 금지 — PNG 경고 토스트로 인지만 보강.
 *   - 레이아웃명·시설명 외부 전송 0.
 */
import { useState } from 'react';
import { useLayoutStore } from '../state/layoutStore.js';
import { useFacilitiesStore } from '../state/facilitiesStore.js';
import { useTerrainStore } from '../state/terrainStore.js';
import { getGame } from '../phaser/gameInstance.js';

export default function SaveLoadPanel() {
  const layouts      = useLayoutStore((s) => s.layouts);
  const saveLayout   = useLayoutStore((s) => s.saveLayout);
  const deleteLayout = useLayoutStore((s) => s.deleteLayout);
  const hasPngWarned = useLayoutStore((s) => s.hasPngWarned);
  const markPngWarned = useLayoutStore((s) => s.markPngWarned);

  const [saveName, setSaveName] = useState('');
  const [toast, setToast]       = useState('');
  const [showList, setShowList] = useState(false);

  const showToast = (msg, ms = 4000) => {
    setToast(msg);
    setTimeout(() => setToast(''), ms);
  };

  // ── 저장 ──────────────────────────────────────────────────────
  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    const facState  = useFacilitiesStore.getState();
    const terrState = useTerrainStore.getState();
    saveLayout(name, facState.facilities, terrState.terrains, facState.siteSize);
    setSaveName('');
    showToast(`"${name}" 저장 완료`);
    setShowList(true);
  };

  // ── 불러오기 ──────────────────────────────────────────────────
  const handleLoad = (layout) => {
    const facState  = useFacilitiesStore.getState();
    const terrState = useTerrainStore.getState();
    const hasCurrent = facState.facilities.length > 0 || terrState.terrains.length > 0;
    if (hasCurrent) {
      const ok = window.confirm(
        `현재 캔버스(시설 ${facState.facilities.length}개 / 지형 ${terrState.terrains.length}개)를 버리고 "${layout.name}"을(를) 불러오시겠습니까?`
      );
      if (!ok) return;
    }
    // 상태 교체 — values from layout snapshot
    useFacilitiesStore.setState({ facilities: layout.facilities, selectedIds: [] });
    useTerrainStore.setState({ terrains: layout.terrain, selectedTerrainId: null });
    facState.setSiteSize(layout.siteSize.widthM, layout.siteSize.heightM);
    showToast(`"${layout.name}" 불러오기 완료`);
  };

  // ── 삭제 ──────────────────────────────────────────────────────
  const handleDelete = (layout) => {
    if (!window.confirm(`"${layout.name}" 레이아웃을 삭제하시겠습니까?`)) return;
    deleteLayout(layout.id);
  };

  // ── PNG 캡처 ──────────────────────────────────────────────────
  const handlePng = () => {
    const game = getGame();
    if (!game?.canvas) {
      showToast('캔버스를 찾을 수 없습니다.');
      return;
    }

    // 첫 다운로드 시 경고 토스트 1회 (헌법 0조 부칙)
    if (!hasPngWarned()) {
      markPngWarned();
      showToast('이 이미지에 입력한 시설 정보가 포함됩니다. 외부 공유에 주의하세요.', 6000);
    }

    try {
      const url  = game.canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href     = url;
      link.download = `simsteel-layout-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      showToast('PNG 캡처 실패 (canvas 보안 정책 확인)');
    }
  };

  // 날짜 포맷 (YYYY-MM-DD HH:mm)
  const fmtDate = (iso) => {
    try {
      const d = new Date(iso);
      const ymd = d.toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' });
      const hm  = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${ymd} ${hm}`;
    } catch {
      return iso.slice(0, 16);
    }
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span>레이아웃</span>
        <button style={styles.listToggle} onClick={() => setShowList((v) => !v)}>
          {showList ? '▴ 목록' : `▾ 목록 (${layouts.length})`}
        </button>
      </div>

      {/* 저장 폼 */}
      <div style={styles.saveRow}>
        <input
          style={styles.nameInput}
          placeholder="레이아웃 이름..."
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          maxLength={40}
        />
        <button
          style={{ ...styles.saveBtn, opacity: saveName.trim() ? 1 : 0.4 }}
          disabled={!saveName.trim()}
          onClick={handleSave}
        >
          저장
        </button>
      </div>

      {/* 저장된 레이아웃 목록 */}
      {showList && (
        <div style={styles.list}>
          {layouts.length === 0 ? (
            <div style={styles.empty}>저장된 레이아웃 없음</div>
          ) : (
            [...layouts].reverse().map((layout) => (
              <div key={layout.id} style={styles.item}>
                <div style={styles.itemInfo}>
                  <div style={styles.itemName}>{layout.name}</div>
                  <div style={styles.itemMeta}>{fmtDate(layout.savedAt)}</div>
                </div>
                <div style={styles.itemBtns}>
                  <button style={styles.loadBtn} onClick={() => handleLoad(layout)}>열기</button>
                  <button style={styles.delBtn}  onClick={() => handleDelete(layout)}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PNG 캡처 */}
      <button style={styles.pngBtn} onClick={handlePng}>
        📷 PNG 캡처
      </button>

      {/* 토스트 */}
      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

const styles = {
  panel: {
    background: '#0e0e18',
    borderTop: '1px solid #2a2a40',
    padding: '8px 0 0',
    flexShrink: 0,
    fontFamily: 'Courier New, monospace',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px 6px',
    fontSize: '11px',
    color: '#7777cc',
    letterSpacing: '1px',
  },
  listToggle: {
    background: 'none',
    border: 'none',
    color: '#555588',
    fontFamily: 'Courier New, monospace',
    fontSize: '10px',
    cursor: 'pointer',
    padding: 0,
  },
  saveRow: {
    display: 'flex',
    gap: '6px',
    padding: '0 12px 8px',
  },
  nameInput: {
    flex: 1,
    background: '#1a1a28',
    border: '1px solid #2a2a40',
    borderRadius: '3px',
    color: '#aaaadd',
    fontFamily: 'Courier New, monospace',
    fontSize: '11px',
    padding: '4px 6px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  saveBtn: {
    background: '#102030',
    border: '1px solid #3a6080',
    borderRadius: '3px',
    color: '#88bbdd',
    fontFamily: 'Courier New, monospace',
    fontSize: '10px',
    padding: '4px 10px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  list: {
    maxHeight: '140px',
    overflowY: 'auto',
    borderTop: '1px solid #1e1e2e',
    borderBottom: '1px solid #1e1e2e',
    marginBottom: '6px',
  },
  empty: {
    fontSize: '10px',
    color: '#333355',
    padding: '8px 12px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px 12px',
    borderBottom: '1px solid #14141e',
    gap: '6px',
  },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: {
    fontSize: '11px',
    color: '#ccccee',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemMeta: {
    fontSize: '9px',
    color: '#444466',
  },
  itemBtns: { display: 'flex', gap: '4px', flexShrink: 0 },
  loadBtn: {
    background: '#1a2a1a',
    border: '1px solid #3a6030',
    borderRadius: '3px',
    color: '#88bb88',
    fontFamily: 'Courier New, monospace',
    fontSize: '9px',
    padding: '2px 6px',
    cursor: 'pointer',
  },
  delBtn: {
    background: '#2a1010',
    border: '1px solid #602020',
    borderRadius: '3px',
    color: '#cc6666',
    fontFamily: 'Courier New, monospace',
    fontSize: '9px',
    padding: '2px 5px',
    cursor: 'pointer',
  },
  pngBtn: {
    width: 'calc(100% - 24px)',
    margin: '0 12px 8px',
    background: '#1a1a2a',
    border: '1px solid #3a3a60',
    borderRadius: '3px',
    color: '#8888bb',
    fontFamily: 'Courier New, monospace',
    fontSize: '10px',
    padding: '5px',
    cursor: 'pointer',
    display: 'block',
    boxSizing: 'border-box',
  },
  toast: {
    position: 'absolute',
    bottom: '100%',
    left: '8px',
    right: '8px',
    background: '#1a2030',
    border: '1px solid #3a5a70',
    borderRadius: '4px',
    color: '#88bbdd',
    fontSize: '10px',
    padding: '7px 10px',
    lineHeight: 1.5,
    zIndex: 20,
    marginBottom: '4px',
  },
};
