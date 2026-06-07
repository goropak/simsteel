import { useState, useEffect } from 'react';
import { getGame } from '../phaser/gameInstance.js';
import { GRID_CONFIG } from '../phaser/config.js';

/**
 * 캔버스 위 줌 컨트롤 오버레이 (돋보기 + −/＋ + % 직접 입력).
 *
 * - 휠 줌과 동일하게 GridScene.setZoomLevel()을 호출 → 뷰포트 중심 고정 줌.
 * - zoom prop(App가 onZoomUpdate로 갱신)을 표시값의 진실로 사용.
 */
const MIN_PCT = Math.round(GRID_CONFIG.zoomMin * 100);  // 10
const MAX_PCT = Math.round(GRID_CONFIG.zoomMax * 100);  // 400

export default function ZoomControl({ zoom }) {
  const [text, setText] = useState(String(Math.round(zoom * 100)));

  // 휠·버튼 등 외부 줌 변경 시 입력칸 동기화
  useEffect(() => { setText(String(Math.round(zoom * 100))); }, [zoom]);

  const applyZoom = (z) => {
    const scene = getGame()?.scene.getScene('GridScene');
    scene?.setZoomLevel(z);
  };

  const commitText = () => {
    const v = parseInt(text, 10);
    if (Number.isFinite(v)) {
      const clamped = Math.max(MIN_PCT, Math.min(MAX_PCT, v));
      applyZoom(clamped / 100);
    } else {
      setText(String(Math.round(zoom * 100)));
    }
  };

  return (
    <div style={styles.wrap}>
      <span style={styles.icon} title="줌 (격자·부지 확대/축소)">🔍</span>
      <button style={styles.btn} onClick={() => applyZoom(zoom * 0.8)} title="축소">−</button>
      <div style={styles.pctBox}>
        <input
          style={styles.input}
          type="number"
          min={MIN_PCT}
          max={MAX_PCT}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { commitText(); e.currentTarget.blur(); } }}
          onBlur={commitText}
        />
        <span style={styles.pct}>%</span>
      </div>
      <button style={styles.btn} onClick={() => applyZoom(zoom * 1.25)} title="확대">＋</button>
      <button style={styles.resetBtn} onClick={() => applyZoom(1)} title="100%로">1:1</button>
    </div>
  );
}

const styles = {
  wrap: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: '#12121cdd',
    border: '1px solid #2a2a40',
    borderRadius: '6px',
    padding: '4px 6px',
    fontFamily: 'Courier New, monospace',
    boxShadow: '0 2px 8px #00000066',
  },
  icon: {
    fontSize: '13px',
    marginRight: '2px',
    userSelect: 'none',
  },
  btn: {
    width: '22px',
    height: '22px',
    background: '#1a1a2a',
    border: '1px solid #3a3a60',
    borderRadius: '3px',
    color: '#aaaadd',
    fontSize: '14px',
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pctBox: {
    display: 'flex',
    alignItems: 'center',
    background: '#1a1a28',
    border: '1px solid #2a2a40',
    borderRadius: '3px',
    padding: '0 4px 0 2px',
  },
  input: {
    width: '42px',
    background: 'transparent',
    border: 'none',
    color: '#ccccee',
    fontFamily: 'Courier New, monospace',
    fontSize: '12px',
    padding: '3px 2px',
    textAlign: 'right',
    outline: 'none',
  },
  pct: {
    fontSize: '11px',
    color: '#6666aa',
  },
  resetBtn: {
    height: '22px',
    background: '#1a1a2a',
    border: '1px solid #3a3a60',
    borderRadius: '3px',
    color: '#8888bb',
    fontSize: '10px',
    padding: '0 6px',
    cursor: 'pointer',
  },
};
