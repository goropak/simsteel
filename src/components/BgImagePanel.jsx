import { useRef } from 'react';
import { useBgImageStore } from '../state/bgImageStore.js';
import { useFacilitiesStore } from '../state/facilitiesStore.js';

/**
 * 배경 트레이싱 패널 (v0.2.8.5)
 *
 * 보안 (헌법 0조 부칙):
 *   이미지는 File API → FileReader → base64 data URL → Phaser texture 경로로만 처리.
 *   fetch / XHR / 외부 AI API 호출 없음. 외부 전송 구조가 코드에 없음이 안전 근거.
 */
export default function BgImagePanel() {
  const bgImageDataUrl = useBgImageStore((s) => s.bgImageDataUrl);
  const bgOpacity      = useBgImageStore((s) => s.bgOpacity);
  const gridOpacity    = useBgImageStore((s) => s.gridOpacity);
  const bgScaleX       = useBgImageStore((s) => s.bgScaleX);
  const bgScaleY       = useBgImageStore((s) => s.bgScaleY);
  const bgLocked       = useBgImageStore((s) => s.bgLocked);
  const setBgImage     = useBgImageStore((s) => s.setBgImage);
  const clearBgImage   = useBgImageStore((s) => s.clearBgImage);
  const setBgOpacity   = useBgImageStore((s) => s.setBgOpacity);
  const setGridOpacity = useBgImageStore((s) => s.setGridOpacity);
  const setBgScale     = useBgImageStore((s) => s.setBgScale);
  const setBgScaleX    = useBgImageStore((s) => s.setBgScaleX);
  const setBgScaleY    = useBgImageStore((s) => s.setBgScaleY);
  const setBgOffset    = useBgImageStore((s) => s.setBgOffset);
  const toggleBgLock   = useBgImageStore((s) => s.toggleBgLock);

  const siteSize = useFacilitiesStore((s) => s.siteSize);

  // 표시용 이미지 실측 크기(m) = 사이트 크기 × 배율 (격자 단위 반올림 표시)
  const imgWidthM  = Math.round(bgScaleX * siteSize.widthM);
  const imgHeightM = Math.round(bgScaleY * siteSize.heightM);
  const handleWidthM  = (m) => { const v = Number(m); if (v > 0) setBgScaleX(v / siteSize.widthM); };
  const handleHeightM = (m) => { const v = Number(m); if (v > 0) setBgScaleY(v / siteSize.heightM); };

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBgImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = ''; // 동일 파일 재선택 허용
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>배경 트레이싱</div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div style={styles.body}>
        {!bgImageDataUrl ? (
          <button style={styles.uploadBtn} onClick={() => fileInputRef.current.click()}>
            이미지 업로드
          </button>
        ) : (
          <>
            <div style={styles.sliderRow}>
              <span style={styles.sliderLabel}>이미지</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(bgOpacity * 100)}
                onChange={(e) => setBgOpacity(Number(e.target.value) / 100)}
                style={styles.slider}
              />
              <span style={styles.sliderVal}>{Math.round(bgOpacity * 100)}%</span>
            </div>

            <div style={styles.sliderRow}>
              <span style={styles.sliderLabel}>격자</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(gridOpacity * 100)}
                onChange={(e) => setGridOpacity(Number(e.target.value) / 100)}
                style={styles.slider}
              />
              <span style={styles.sliderVal}>{Math.round(gridOpacity * 100)}%</span>
            </div>

            {/* 크기 직접 수치 입력 (m) — 가로/세로 독립 → 비율 자유 */}
            <div style={styles.sliderRow}>
              <span style={styles.sliderLabel}>크기 m</span>
              <input
                type="number" min={5} step={5}
                value={imgWidthM}
                onChange={(e) => handleWidthM(e.target.value)}
                style={styles.numInput}
                title="가로 (m)"
              />
              <span style={styles.times}>×</span>
              <input
                type="number" min={5} step={5}
                value={imgHeightM}
                onChange={(e) => handleHeightM(e.target.value)}
                style={styles.numInput}
                title="세로 (m)"
              />
            </div>
            <div style={styles.hintRow}>모서리 드래그로도 가로·세로 따로 조절</div>

            <div style={styles.btnRow}>
              <button
                style={styles.changeBtn}
                onClick={() => { setBgScale(1); setBgOffset(0, 0); }}
              >
                위치·크기 초기화
              </button>
              <button
                style={bgLocked ? styles.lockBtnOn : styles.changeBtn}
                onClick={toggleBgLock}
                title="잠그면 이미지가 클릭/리사이즈를 가로채지 않아 시설 편집이 우선됩니다"
              >
                {bgLocked ? '🔒 잠금됨' : '🔓 잠금'}
              </button>
            </div>

            <div style={styles.btnRow}>
              <button style={styles.changeBtn} onClick={() => fileInputRef.current.click()}>
                교체
              </button>
              <button style={styles.clearBtn} onClick={clearBgImage}>
                제거
              </button>
            </div>
          </>
        )}

        <div style={styles.hint}>로컬 전용 — 외부 전송 없음</div>
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
  uploadBtn: {
    width: '100%',
    background: '#1a1a2e',
    border: '1px solid #3a3a60',
    borderRadius: '3px',
    color: '#8888dd',
    fontFamily: 'Courier New, monospace',
    fontSize: '11px',
    padding: '6px',
    cursor: 'pointer',
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  sliderLabel: {
    fontSize: '9px',
    color: '#5555aa',
    width: '28px',
    flexShrink: 0,
  },
  slider: {
    flex: 1,
    accentColor: '#7777cc',
    cursor: 'pointer',
  },
  sliderVal: {
    fontSize: '10px',
    color: '#7777bb',
    width: '30px',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  },
  numInput: {
    flex: 1,
    minWidth: 0,
    background: '#1a1a28',
    border: '1px solid #2a2a40',
    borderRadius: '3px',
    color: '#aaaadd',
    fontFamily: 'Courier New, monospace',
    fontSize: '11px',
    padding: '3px 5px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  times: {
    fontSize: '10px',
    color: '#5555aa',
    flexShrink: 0,
  },
  hintRow: {
    fontSize: '8px',
    color: '#444466',
    marginTop: '-2px',
  },
  lockBtnOn: {
    flex: 1,
    background: '#2a2410',
    border: '1px solid #6a5a20',
    borderRadius: '3px',
    color: '#ddcc66',
    fontFamily: 'Courier New, monospace',
    fontSize: '10px',
    padding: '4px',
    cursor: 'pointer',
  },
  btnRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '2px',
  },
  changeBtn: {
    flex: 1,
    background: '#1a1a28',
    border: '1px solid #2a2a40',
    borderRadius: '3px',
    color: '#7777bb',
    fontFamily: 'Courier New, monospace',
    fontSize: '10px',
    padding: '4px',
    cursor: 'pointer',
  },
  clearBtn: {
    flex: 1,
    background: '#1e1010',
    border: '1px solid #441818',
    borderRadius: '3px',
    color: '#aa6666',
    fontFamily: 'Courier New, monospace',
    fontSize: '10px',
    padding: '4px',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '8px',
    color: '#333355',
    marginTop: '2px',
  },
};
