/**
 * 레이아웃 JSON import / export 패널 (v0.2.8 + v0.2.9)
 *
 * 보안 (헌법 0조 부칙):
 *   - import: FileReader 브라우저 내 처리, 외부 전송 0.
 *   - export: Blob + createObjectURL 로컬 다운로드, 네트워크 전송 0줄.
 *   - 이미지 자동 인식 미구현 (0조 부칙 위반 방지).
 *
 * 교훈 적용:
 *   - 타일 게임 좌표 3계 분리: xPct↔절대셀 변환 시 Math.round 정수 보장.
 *   - 상태 스냅샷 깊은 복사: import 주입 전 JSON.parse(JSON.stringify(...)).
 *   - 보안·구조로 보장: Blob 다운로드 = 외부 전송 구조적 차단.
 */
import { useState, useRef } from 'react';
import { useFacilitiesStore } from '../state/facilitiesStore.js';
import { useTerrainStore } from '../state/terrainStore.js';
import { useImportStore } from '../state/importStore.js';
import { getGame } from '../phaser/gameInstance.js';
import { GRID_CONFIG } from '../phaser/config.js';

const EXPORT_WARN_KEY = 'simsteel:export-warned';

/**
 * 절대셀 → 상대% 역변환 (import의 정확한 역연산)
 * import: absolute = offset + round(pct/100 * size)
 * export: pct = (absolute - offset) / size * 100
 */
function cellToPct(absolute, offsetCells, sizeCells) {
  return (absolute - offsetCells) / sizeCells * 100;
}

/** JSON 규격 유효성 검사 */
function validateLayout(data) {
  if (!data || typeof data !== 'object') throw new Error('JSON 객체가 아닙니다');
  if (!data.worldSize?.wCells || !data.worldSize?.hCells) throw new Error('worldSize 필드 누락');
  if (!data.siteBoundary?.wCells || !data.siteBoundary?.hCells) throw new Error('siteBoundary 필드 누락');
  if (!Array.isArray(data.facilities)) throw new Error('facilities 배열 누락');
  return true;
}

/**
 * xPct/yPct → 절대 셀 좌표.
 * 교훈: 타일 게임 좌표 3계 분리 — Math.round로 정수 보장, 스크린 좌표 저장 금지.
 */
function pctToCell(pct, offsetCells, sizeCells) {
  return Math.round(offsetCells + (pct / 100) * sizeCells);
}

export default function ImportPanel() {
  const [open, setOpen]     = useState(false);
  const [mode, setMode]     = useState('file');   // 'file' | 'paste'
  const [pasteText, setPaste] = useState('');
  const [toast, setToast]   = useState('');
  const [toastErr, setToastErr] = useState('');
  const fileInputRef = useRef(null);

  const showOk  = (msg) => { setToast(msg);    setTimeout(() => setToast(''),    4000); };
  const showErr = (msg) => { setToastErr(msg); setTimeout(() => setToastErr(''), 6000); };

  // ── export 실행 ─────────────────────────────────────────────
  const doExport = () => {
    const facState    = useFacilitiesStore.getState();
    const importState = useImportStore.getState();
    const cellMeters  = GRID_CONFIG.cellSize;  // 5

    // siteBoundary: import 시 저장된 값 우선, 없으면 전체 siteSize를 boundary로 폴백
    const boundary = importState.siteBoundary ?? {
      wCells:       Math.round(facState.siteSize.widthM  / cellMeters),
      hCells:       Math.round(facState.siteSize.heightM / cellMeters),
      offsetXCells: 0,
      offsetYCells: 0,
    };

    // worldSize: import 시 저장된 값 우선, 없으면 siteSize와 동일
    const worldSize = importState.importMeta?.worldSize ?? {
      wCells:    boundary.wCells,
      hCells:    boundary.hCells,
      cellMeters,
    };

    // 교훈: 상태 스냅샷 깊은 복사 — frozen 객체 문제 방지
    const facilities = JSON.parse(JSON.stringify(facState.facilities));

    // 절대셀 → 상대% 역변환 (왕복 정합성 — import 역연산)
    const exportFacilities = facilities.map((f) => {
      const entry = {
        id:   f.id,
        name: f.name,
        xPct: parseFloat(cellToPct(f.position.col, boundary.offsetXCells, boundary.wCells).toFixed(4)),
        yPct: parseFloat(cellToPct(f.position.row, boundary.offsetYCells, boundary.hCells).toFixed(4)),
        wPct: parseFloat((f.size.width  / boundary.wCells * 100).toFixed(4)),
        hPct: parseFloat((f.size.height / boundary.hCells * 100).toFixed(4)),
      };
      if (f.confidence) entry.confidence = f.confidence;
      return entry;
    });

    const layoutName = importState.importMeta?.name ?? '레이아웃';
    const data = { name: layoutName, worldSize, siteBoundary: boundary, facilities: exportFacilities };

    const safeName = layoutName.replace(/[/\\?%*:|"<>]/g, '-');

    // Blob 다운로드 — 외부 전송 0 (로컬 파일만)
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `${safeName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // 첫 export 안내 토스트 1회 (차단 아님), 이후엔 완료 메시지
    const isFirst = !localStorage.getItem(EXPORT_WARN_KEY);
    if (isFirst) {
      localStorage.setItem(EXPORT_WARN_KEY, '1');
      showOk('이 파일에 시설 배치 정보가 포함됩니다. 공유에 유의하세요.');
    } else {
      showOk(`"${safeName}.json" 다운로드 완료`);
    }
  };

  // ── import 실행 ─────────────────────────────────────────────
  const doImport = (text) => {
    let data;
    try {
      data = JSON.parse(text);
      validateLayout(data);
    } catch (e) {
      showErr(`파싱 실패: ${e.message}`);
      return;
    }

    const facState  = useFacilitiesStore.getState();
    const terrState = useTerrainStore.getState();
    const hasCurrent = facState.facilities.length > 0 || terrState.terrains.length > 0;
    if (hasCurrent) {
      const ok = window.confirm(
        `현재 배치(시설 ${facState.facilities.length}개 / 지형 ${terrState.terrains.length}개)를 덮어씁니다. 계속하시겠습니까?`
      );
      if (!ok) return;
    }

    const { worldSize, siteBoundary, facilities, name } = data;

    // 1. worldSize → siteSize 적용
    const cellMeters = worldSize.cellMeters ?? 5;
    facState.setSiteSize(worldSize.wCells * cellMeters, worldSize.hCells * cellMeters);

    // 2. 시설 변환 — 교훈: 값 복사 원칙 (JSON 깊은 복사)
    const converted = JSON.parse(JSON.stringify(facilities)).map((f) => {
      const col = pctToCell(f.xPct ?? 0, siteBoundary.offsetXCells ?? 0, siteBoundary.wCells);
      const row = pctToCell(f.yPct ?? 0, siteBoundary.offsetYCells ?? 0, siteBoundary.hCells);
      const wCells = Math.max(1, Math.round((f.wPct ?? 5) / 100 * siteBoundary.wCells));
      const hCells = Math.max(1, Math.round((f.hPct ?? 5) / 100 * siteBoundary.hCells));
      return {
        id:         `import_${f.id ?? crypto.randomUUID()}_${Date.now()}`,
        typeId:     'imported',
        name:       f.name ?? f.id ?? '시설',
        abbrev:     (f.name ?? '?').slice(0, 3).toUpperCase(),
        confirmed:  (f.confidence !== '낮음'),
        confidence: f.confidence ?? '높음',
        source:     'import',
        position:   { col, row },
        size:       { width: wCells, height: hCells },
        color:      '#6b9fff',
        capacity:   '',
        notes:      '',
        phase:      1,
      };
    });

    // 3. 상태 교체
    useFacilitiesStore.setState({ facilities: converted, selectedIds: [] });
    useTerrainStore.setState({ terrains: [], selectedTerrainId: null });

    // 4. siteBoundary 저장 → GridScene이 구독해 박스 그림
    useImportStore.getState().applyImport(
      { name: name ?? '가져온 레이아웃', worldSize },
      siteBoundary,
    );

    // 5. 카메라 fit (교육자료 패턴2 — import 클릭 시점 = 화면 안정)
    // 교훈: 내장 centerOn 사용, 수동 scrollX 계산 금지
    const scene = getGame()?.scene.getScene('GridScene');
    if (scene?._fitToSiteBoundary) {
      scene._fitToSiteBoundary(siteBoundary);
    }

    showOk(`"${name ?? '레이아웃'}" 불러오기 완료 — 시설 ${converted.length}개`);
    setOpen(false);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      showErr('JSON 파일만 지원합니다 (.json)');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => doImport(ev.target.result);
    reader.onerror = () => showErr('파일 읽기 실패');
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePaste = () => {
    if (!pasteText.trim()) return;
    doImport(pasteText.trim());
    setPaste('');
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span>Import / Export</span>
        <button style={styles.toggle} onClick={() => setOpen((v) => !v)}>
          {open ? '▴ 닫기' : '▾ 열기'}
        </button>
      </div>

      {open && (
        <div style={styles.body}>
          {/* 모드 탭 */}
          <div style={styles.tabs}>
            <button style={{ ...styles.tab, ...(mode === 'file'  ? styles.tabActive : {}) }} onClick={() => setMode('file')}>파일 선택</button>
            <button style={{ ...styles.tab, ...(mode === 'paste' ? styles.tabActive : {}) }} onClick={() => setMode('paste')}>텍스트 붙여넣기</button>
          </div>

          {mode === 'file' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleFile}
              />
              <button style={styles.fileBtn} onClick={() => fileInputRef.current?.click()}>
                📂 JSON 파일 선택
              </button>
              <div style={styles.hint}>
                worldSize / siteBoundary / facilities 포함 JSON<br/>
                브라우저 내 처리 · 외부 전송 없음
              </div>
            </div>
          )}

          {mode === 'paste' && (
            <div>
              <textarea
                style={styles.textarea}
                placeholder={'{ "worldSize": {...}, "siteBoundary": {...}, "facilities": [...] }'}
                value={pasteText}
                onChange={(e) => setPaste(e.target.value)}
                rows={5}
              />
              <button
                style={{ ...styles.fileBtn, opacity: pasteText.trim() ? 1 : 0.4 }}
                disabled={!pasteText.trim()}
                onClick={handlePaste}
              >
                JSON 적용
              </button>
            </div>
          )}

          {/* export 버튼 — import와 동일 패널 내, 구분선 아래 */}
          <div style={styles.exportDivider} />
          <button style={styles.exportBtn} onClick={doExport}>
            📤 JSON export (왕복 호환)
          </button>
          <div style={styles.hint}>
            현재 배치를 JSON으로 저장 · import와 동일 규격
          </div>
        </div>
      )}

      {toast    && <div style={styles.toast}>{toast}</div>}
      {toastErr && <div style={{ ...styles.toast, ...styles.toastErr }}>{toastErr}</div>}
    </div>
  );
}

const styles = {
  panel: {
    background: '#0e0e18',
    borderTop: '1px solid #2a2a40',
    flexShrink: 0,
    fontFamily: 'Courier New, monospace',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 12px',
    fontSize: '11px',
    color: '#7777cc',
    letterSpacing: '1px',
  },
  toggle: {
    background: 'none', border: 'none', color: '#555588',
    fontFamily: 'Courier New, monospace', fontSize: '10px', cursor: 'pointer', padding: 0,
  },
  body: {
    padding: '0 12px 10px',
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '8px',
  },
  tab: {
    flex: 1,
    background: '#1a1a28',
    border: '1px solid #2a2a40',
    borderRadius: '3px',
    color: '#555577',
    fontFamily: 'Courier New, monospace',
    fontSize: '9px',
    padding: '3px',
    cursor: 'pointer',
  },
  tabActive: {
    background: '#1a2a3a',
    border: '1px solid #3a6080',
    color: '#88bbdd',
  },
  fileBtn: {
    width: '100%',
    background: '#102030',
    border: '1px solid #3a6080',
    borderRadius: '3px',
    color: '#88bbdd',
    fontFamily: 'Courier New, monospace',
    fontSize: '10px',
    padding: '6px',
    cursor: 'pointer',
    boxSizing: 'border-box',
    display: 'block',
    marginBottom: '6px',
  },
  textarea: {
    width: '100%',
    background: '#1a1a28',
    border: '1px solid #2a2a40',
    borderRadius: '3px',
    color: '#aaaadd',
    fontFamily: 'Courier New, monospace',
    fontSize: '9px',
    padding: '4px 6px',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
    marginBottom: '6px',
  },
  hint: {
    fontSize: '9px',
    color: '#333355',
    lineHeight: 1.6,
    marginBottom: '4px',
  },
  exportDivider: {
    borderTop: '1px solid #1e1e2e',
    margin: '8px 0 6px',
  },
  exportBtn: {
    width: '100%',
    background: '#1a2010',
    border: '1px solid #4a7030',
    borderRadius: '3px',
    color: '#88cc66',
    fontFamily: 'Courier New, monospace',
    fontSize: '10px',
    padding: '6px',
    cursor: 'pointer',
    boxSizing: 'border-box',
    display: 'block',
    marginBottom: '6px',
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
  toastErr: {
    background: '#2a1010',
    border: '1px solid #703a3a',
    color: '#dd8888',
  },
};
