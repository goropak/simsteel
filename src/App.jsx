import { useState, useCallback } from 'react';
import GridCanvas from './components/GridCanvas.jsx';
import StatusBar from './components/StatusBar.jsx';
import FacilityPalette from './components/FacilityPalette.jsx';
import FacilityEditor from './components/FacilityEditor.jsx';
import SiteSizePanel from './components/SiteSizePanel.jsx';

export default function App() {
  const [coord, setCoord] = useState({ cellX: 0, cellY: 0, mX: 0, mY: 0 });
  const [zoom,  setZoom]  = useState(1.0);

  const handleCoordUpdate = useCallback((c) => setCoord(c), []);
  const handleZoomUpdate  = useCallback((z) => setZoom(z),  []);

  return (
    <div style={styles.root}>
      {/* 헤더 */}
      <header style={styles.header}>
        <span style={styles.logo}>simsteel</span>
        <span style={styles.version}>v0.2.3</span>
        <span style={styles.subtitle}>Steel Plant Layout Visualizer</span>
      </header>

      {/* 본문: 팔레트 | 캔버스 | 에디터 */}
      <div style={styles.body}>
        <FacilityPalette />

        <GridCanvas
          onCoordUpdate={handleCoordUpdate}
          onZoomUpdate={handleZoomUpdate}
        />

        {/* 우측: 편집 패널 + 부지 크기 패널 */}
        <div style={styles.rightCol}>
          <FacilityEditor />
          <SiteSizePanel />
        </div>
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
  rightCol: {
    width: '280px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid #2a2a40',
    overflow: 'hidden',
  },
};
