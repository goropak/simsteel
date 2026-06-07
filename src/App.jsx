import { useState, useCallback } from 'react';
import GridCanvas from './components/GridCanvas.jsx';
import StatusBar from './components/StatusBar.jsx';
import FacilityPalette from './components/FacilityPalette.jsx';
import FacilityEditor from './components/FacilityEditor.jsx';
import SiteSizePanel from './components/SiteSizePanel.jsx';
import SaveLoadPanel from './components/SaveLoadPanel.jsx';
import ImportPanel from './components/ImportPanel.jsx';
import BgImagePanel from './components/BgImagePanel.jsx';
import ZoomControl from './components/ZoomControl.jsx';

export default function App() {
  const [coord, setCoord] = useState({ cellX: 0, cellY: 0, mX: 0, mY: 0 });
  const [zoom,  setZoom]  = useState(1.0);
  // 우측 패널(시설정보·부지크기·레이아웃·배경) 접기 — 닫으면 캔버스가 넓어짐
  const [rightOpen, setRightOpen] = useState(true);

  const handleCoordUpdate = useCallback((c) => setCoord(c), []);
  const handleZoomUpdate  = useCallback((z) => setZoom(z),  []);

  return (
    <div style={styles.root}>
      {/* 헤더 */}
      <header style={styles.header}>
        <span style={styles.logo}>simsteel</span>
        <span style={styles.version}>v0.2.8.9.2</span>
        <span style={styles.subtitle}>Steel Plant Layout Visualizer</span>
      </header>

      {/* 본문: 팔레트 | 캔버스 | 에디터 */}
      <div style={styles.body}>
        <FacilityPalette />

        {/* 캔버스 + 줌 컨트롤 오버레이 (좌상단 돋보기) */}
        <div style={styles.canvasWrap}>
          <GridCanvas
            onCoordUpdate={handleCoordUpdate}
            onZoomUpdate={handleZoomUpdate}
          />
          <ZoomControl zoom={zoom} />
        </div>

        {/* 캔버스↔우측 패널 경계의 접기 토글 (항상 표시) */}
        <div style={styles.rightToggleBar}>
          <button
            style={styles.rightToggleBtn}
            onClick={() => setRightOpen((v) => !v)}
            title={rightOpen ? '패널 닫기 — 캔버스 넓게' : '패널 열기'}
          >
            {rightOpen ? '▶' : '◀'}
          </button>
        </div>

        {/* 우측: 편집 패널 + 부지 크기 패널 + 저장/불러오기 (닫으면 캔버스가 넓어짐) */}
        {rightOpen && (
          <div style={styles.rightCol}>
            <FacilityEditor />
            <SiteSizePanel />
            <SaveLoadPanel />
            <ImportPanel />
            <BgImagePanel />
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
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 0,
  },
  canvasWrap: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    minWidth: 0,
    overflow: 'hidden',
  },
  rightToggleBar: {
    width: '20px',
    flexShrink: 0,
    background: '#12121c',
    borderLeft: '1px solid #2a2a40',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '6px',
  },
  rightToggleBtn: {
    background: '#1a1a2a',
    border: '1px solid #3a3a60',
    borderRadius: '3px',
    color: '#8888bb',
    fontFamily: 'Courier New, monospace',
    fontSize: '10px',
    lineHeight: 1,
    padding: '5px 2px',
    width: '16px',
    cursor: 'pointer',
  },
  rightCol: {
    width: '280px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
};
