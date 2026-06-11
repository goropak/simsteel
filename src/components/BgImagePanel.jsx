import { useRef, useState } from 'react';
import { useBgImageStore } from '../state/bgImageStore.js';

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
  const bgScaleX       = useBgImageStore((s) => s.bgScaleX);
  const bgScaleY       = useBgImageStore((s) => s.bgScaleY);
  const setBgImage     = useBgImageStore((s) => s.setBgImage);
  const clearBgImage   = useBgImageStore((s) => s.clearBgImage);
  const setBgOpacity   = useBgImageStore((s) => s.setBgOpacity);
  const setBgScale     = useBgImageStore((s) => s.setBgScale);
  const setBgScaleAxis = useBgImageStore((s) => s.setBgScaleAxis);
  const setBgOffset    = useBgImageStore((s) => s.setBgOffset);

  const fileInputRef = useRef(null);
  // v0.5.1 — 비율 고정 (세션 한정, 기본 ON = 기존 동작)
  const [unlocked, setUnlocked] = useState(false);

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

            {/* v0.5.1 — 크기: 비율 고정(🔒) ↔ 가로/세로 독립(🔓) */}
            {!unlocked ? (
              <div style={styles.sliderRow}>
                <span style={styles.sliderLabel}>크기</span>
                <input
                  type="range" min={10} max={300}
                  value={Math.round(bgScaleX * 100)}
                  onChange={(e) => setBgScale(Number(e.target.value) / 100)}
                  style={styles.slider}
                />
                <span style={styles.sliderVal}>{Math.round(bgScaleX * 100)}%</span>
                <button style={styles.lockBtn} onClick={() => setUnlocked(true)}
                  title="비율 고정 해제 — 가로/세로 따로 조절">🔒</button>
              </div>
            ) : (
              <>
                <div style={styles.sliderRow}>
                  <span style={styles.sliderLabel}>가로</span>
                  <input
                    type="range" min={10} max={300}
                    value={Math.round(bgScaleX * 100)}
                    onChange={(e) => setBgScaleAxis('x', Number(e.target.value) / 100)}
                    style={styles.slider}
                  />
                  <span style={styles.sliderVal}>{Math.round(bgScaleX * 100)}%</span>
                  <button style={{ ...styles.lockBtn, opacity: 1 }} onClick={() => setUnlocked(false)}
                    title="비율 고정으로 복귀">🔓</button>
                </div>
                <div style={styles.sliderRow}>
                  <span style={styles.sliderLabel}>세로</span>
                  <input
                    type="range" min={10} max={300}
                    value={Math.round(bgScaleY * 100)}
                    onChange={(e) => setBgScaleAxis('y', Number(e.target.value) / 100)}
                    style={styles.slider}
                  />
                  <span style={styles.sliderVal}>{Math.round(bgScaleY * 100)}%</span>
                  <span style={{ width: '18px', flexShrink: 0 }} />
                </div>
              </>
            )}

            <div style={styles.btnRow}>
              <button
                style={styles.changeBtn}
                onClick={() => { setBgScale(1); setBgOffset(0, 0); }}
              >
                위치·크기 초기화
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
  lockBtn: {
    width: '18px',
    height: '16px',
    background: 'transparent',
    border: 'none',
    fontSize: '10px',
    lineHeight: 1,
    cursor: 'pointer',
    flexShrink: 0,
    padding: 0,
    opacity: 0.75,
  },
};
