import { useState, useCallback, useEffect } from 'react';
import GridCanvas from './components/GridCanvas.jsx';
import StatusBar from './components/StatusBar.jsx';
import FacilityPalette from './components/FacilityPalette.jsx';
import FacilityEditor from './components/FacilityEditor.jsx';
import SiteSizePanel from './components/SiteSizePanel.jsx';
import SaveLoadPanel from './components/SaveLoadPanel.jsx';
import ComparePanel from './components/ComparePanel.jsx';
import ExcelImportPanel from './components/ExcelImportPanel.jsx';
import ProjectBundlePanel from './components/ProjectBundlePanel.jsx';
import BgImagePanel from './components/BgImagePanel.jsx';
import ImageLayersPanel from './components/ImageLayersPanel.jsx';
import GridPanel from './components/GridPanel.jsx';
import ExtractPanel from './components/ExtractPanel.jsx';

export default function App() {
  const [coord, setCoord] = useState({ cellX: 0, cellY: 0, mX: 0, mY: 0 });
  const [zoom,  setZoom]  = useState(1.0);
  // v0.5.1 (대통령 요청 #5) — 맵 전용 보기: 좌(팔레트)/우(패널) 숨기고 캔버스 풀폭 (세션 한정)
  const [mapOnly, setMapOnly] = useState(false);

  const handleCoordUpdate = useCallback((c) => setCoord(c), []);
  const handleZoomUpdate  = useCallback((z) => setZoom(z),  []);

  // 단축키 F — 입력창 타이핑 중에는 무시
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'f' && e.key !== 'F') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ||
                 el.tagName === 'SELECT' || el.isContentEditable)) return;
      setMapOnly((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={styles.root}>
      {/* 헤더 */}
      <header style={styles.header}>
        <span style={styles.logo}>simsteel</span>
        <span style={styles.version}>v0.5.1</span>
        <span style={styles.subtitle}>Steel Plant Layout Visualizer</span>
        <button
          style={{ ...styles.mapOnlyBtn, ...(mapOnly ? styles.mapOnlyBtnOn : {}) }}
          onClick={() => setMapOnly((v) => !v)}
          title="좌/우 패널을 숨기고 맵만 표시 (단축키 F)"
        >
          {mapOnly ? '▣ 패널 보이기 (F)' : '⛶ 맵만 보기 (F)'}
        </button>
      </header>

      {/* 본문: 팔레트 | 캔버스 | 에디터 (맵 전용 보기 시 캔버스만) */}
      <div style={styles.body}>
        {!mapOnly && <FacilityPalette />}

        <GridCanvas
          onCoordUpdate={handleCoordUpdate}
          onZoomUpdate={handleZoomUpdate}
        />

        {/* 우측: 편집 패널 + 부지 크기 패널 + 저장/불러오기 */}
        {!mapOnly && (
          <div style={styles.rightCol}>
            <FacilityEditor />
            <SiteSizePanel />
            <GridPanel />
            <SaveLoadPanel />
            <ComparePanel />
            <ExcelImportPanel />
            <ProjectBundlePanel />
            <BgImagePanel />
            <ImageLayersPanel />
            <ExtractPanel />
          </div>
        )}
      </div>

      {/* 하단 상태 바 */}
      <StatusBar coord={coord} zoom={zoom} />
    </div>
  );
}

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    background: '#0e0e18',
  },
  header: {
    height: '40px',
    background: '#12121c',
    borderBottom: '1px solid #2a2a40',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: '12px',
    flexShrink: 0,
  },
  logo: {
    color: '#9999ee',
    fontWeight: 'bold',
    fontSize: '15px',
    letterSpacing: '2px',
    fontFamily: 'Courier New, monospace',
  },
  version: {
    color: '#5555aa',
    fontSize: '11px',
    fontFamily: 'Courier New, monospace',
  },
  subtitle: {
    color: '#444466',
    fontSize: '11px',
    fontFamily: 'Courier New, monospace',
  },
  mapOnlyBtn: {
    marginLeft: 'auto',
    background: '#1a1a2e',
    border: '1px solid #3a3a60',
    borderRadius: '3px',
    color: '#8888dd',
    fontFamily: 'Courier New, monospace',
    fontSize: '10px',
    padding: '4px 10px',
    cursor: 'pointer',
  },
  mapOnlyBtnOn: {
    background: '#2a2010',
    border: '1px solid #aa8833',
    color: '#ddbb55',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 0,
  },
  rightCol: {
    width: '280px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid #2a2a40',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
};
