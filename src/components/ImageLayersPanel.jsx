import { useRef, useState } from 'react';
import { useImageLayerStore } from '../state/imageLayerStore.js';

/**
 * 이미지 레이어(다중) 패널 — v0.4.3 (feature 6)
 *
 * 레이아웃별 참조 이미지를 여러 장 올려두고 체크박스로 켜고/끄며 겹쳐 비교.
 * localStorage 'simsteel:image-layers'에 저장 → 새 환경에서도 유지, 번들에 자동 포함.
 *
 * 보안 (헌법 0조 부칙):
 *   File API → FileReader → base64 data URL → Phaser texture 경로로만 처리.
 *   fetch / XHR / 외부 AI API 호출 없음. 외부 전송 구조가 코드에 없음이 안전 근거.
 */
export default function ImageLayersPanel() {
  const layers        = useImageLayerStore((s) => s.layers);
  const addLayer      = useImageLayerStore((s) => s.addLayer);
  const removeLayer   = useImageLayerStore((s) => s.removeLayer);
  const toggleVisible = useImageLayerStore((s) => s.toggleVisible);
  const setOpacity    = useImageLayerStore((s) => s.setOpacity);
  const setScale      = useImageLayerStore((s) => s.setScale);
  const setScaleAxis  = useImageLayerStore((s) => s.setScaleAxis);
  const setOffset     = useImageLayerStore((s) => s.setOffset);
  const moveLayer     = useImageLayerStore((s) => s.moveLayer);
  const activeMoveId  = useImageLayerStore((s) => s.activeMoveId);
  const setActiveMoveId = useImageLayerStore((s) => s.setActiveMoveId);

  const fileInputRef = useRef(null);

  // v0.5.1 — 카드별 비율 고정 상태 (세션 한정, 기본: 고정 ON = 기존 동작)
  const [unlocked, setUnlocked] = useState({});
  const toggleLock = (id) => setUnlocked((p) => ({ ...p, [id]: !p[id] }));

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => addLayer(file.name.replace(/\.[^.]+$/, ''), ev.target.result);
      reader.readAsDataURL(file);
    });
    e.target.value = ''; // 동일 파일 재선택 허용
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span>이미지 레이어</span>
        {layers.length > 0 && <span style={styles.count}>{layers.length}장</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div style={styles.body}>
        <button style={styles.uploadBtn} onClick={() => fileInputRef.current.click()}>
          + 이미지 추가
        </button>

        {layers.length === 0 ? (
          <div style={styles.empty}>참조 이미지를 올려 보드 위에 겹쳐 비교 · 체크로 켜고/끄기</div>
        ) : (
          <div style={styles.list}>
            {layers.map((l, idx) => (
              <div key={l.id} style={{ ...styles.card, ...(l.visible ? styles.cardOn : {}) }}>
                <div style={styles.cardTop}>
                  <button
                    style={{ ...styles.check, ...(l.visible ? styles.checkOn : {}) }}
                    onClick={() => toggleVisible(l.id)}
                    title={l.visible ? '끄기' : '켜기'}
                  >
                    {l.visible ? '✓' : ''}
                  </button>
                  <span style={styles.name} title={l.name}>{l.name}</span>
                  <button style={styles.iconBtn} disabled={idx === 0}
                    onClick={() => moveLayer(l.id, 'up')} title="위로">▲</button>
                  <button style={styles.iconBtn} disabled={idx === layers.length - 1}
                    onClick={() => moveLayer(l.id, 'down')} title="아래로">▼</button>
                  <button style={styles.delBtn} onClick={() => removeLayer(l.id)} title="삭제">×</button>
                </div>

                <div style={styles.sliderRow}>
                  <span style={styles.sliderLabel}>투명</span>
                  <input type="range" min={5} max={100} value={Math.round(l.opacity * 100)}
                    onChange={(e) => setOpacity(l.id, Number(e.target.value) / 100)}
                    style={styles.slider} />
                  <span style={styles.sliderVal}>{Math.round(l.opacity * 100)}%</span>
                </div>

                {/* v0.5.1 — 크기: 비율 고정(🔒) ↔ 가로/세로 독립(🔓) */}
                {!unlocked[l.id] ? (
                  <div style={styles.sliderRow}>
                    <span style={styles.sliderLabel}>크기</span>
                    <input type="range" min={10} max={300} value={Math.round((l.scaleX ?? 1) * 100)}
                      onChange={(e) => setScale(l.id, Number(e.target.value) / 100)}
                      style={styles.slider} />
                    <span style={styles.sliderVal}>{Math.round((l.scaleX ?? 1) * 100)}%</span>
                    <button style={styles.lockBtn} onClick={() => toggleLock(l.id)}
                      title="비율 고정 해제 — 가로/세로 따로 조절">🔒</button>
                  </div>
                ) : (
                  <>
                    <div style={styles.sliderRow}>
                      <span style={styles.sliderLabel}>가로</span>
                      <input type="range" min={10} max={300} value={Math.round((l.scaleX ?? 1) * 100)}
                        onChange={(e) => setScaleAxis(l.id, 'x', Number(e.target.value) / 100)}
                        style={styles.slider} />
                      <span style={styles.sliderVal}>{Math.round((l.scaleX ?? 1) * 100)}%</span>
                      <button style={{ ...styles.lockBtn, ...styles.lockBtnOff }} onClick={() => toggleLock(l.id)}
                        title="비율 고정으로 복귀">🔓</button>
                    </div>
                    <div style={styles.sliderRow}>
                      <span style={styles.sliderLabel}>세로</span>
                      <input type="range" min={10} max={300} value={Math.round((l.scaleY ?? 1) * 100)}
                        onChange={(e) => setScaleAxis(l.id, 'y', Number(e.target.value) / 100)}
                        style={styles.slider} />
                      <span style={styles.sliderVal}>{Math.round((l.scaleY ?? 1) * 100)}%</span>
                      <span style={{ width: '18px', flexShrink: 0 }} />
                    </div>
                  </>
                )}

                <div style={styles.offsetRow}>
                  <span style={styles.sliderLabel}>위치</span>
                  <input type="number" value={Math.round(l.offsetX)}
                    onChange={(e) => setOffset(l.id, Number(e.target.value) || 0, l.offsetY)}
                    style={styles.numInput} title="X(px)" />
                  <input type="number" value={Math.round(l.offsetY)}
                    onChange={(e) => setOffset(l.id, l.offsetX, Number(e.target.value) || 0)}
                    style={styles.numInput} title="Y(px)" />
                  <button style={styles.resetBtn}
                    onClick={() => { setScale(l.id, 1); setOffset(l.id, 0, 0); }}
                    title="위치·크기 초기화">초기화</button>
                </div>

                <button
                  style={{ ...styles.moveBtn, ...(activeMoveId === l.id ? styles.moveBtnOn : {}) }}
                  onClick={() => setActiveMoveId(activeMoveId === l.id ? null : l.id)}
                  title="맵에서 마우스로 끌어 위치 조정"
                >
                  {activeMoveId === l.id ? '✋ 이동 모드 — 맵에서 드래그 (클릭 종료)' : '✋ 마우스로 이동'}
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={styles.hint}>로컬 저장 · 번들에 포함 · 외부 전송 없음</div>
      </div>
    </div>
  );
}

const styles = {
  panel: { background: '#12121c', borderTop: '1px solid #2a2a40', fontFamily: 'Courier New, monospace', flexShrink: 0 },
  header: { height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', fontSize: '10px', color: '#7777cc', borderBottom: '1px solid #1e1e2e', letterSpacing: '1px' },
  count: { fontSize: '9px', color: '#556' },
  body: { padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' },
  uploadBtn: { width: '100%', background: '#1a1a2e', border: '1px solid #3a3a60', borderRadius: '3px', color: '#8888dd', fontFamily: 'Courier New, monospace', fontSize: '11px', padding: '6px', cursor: 'pointer' },
  empty: { fontSize: '9px', color: '#333355', lineHeight: 1.6 },
  list: { display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' },
  card: { background: '#15151f', border: '1px solid #22223a', borderRadius: '4px', padding: '6px 7px', display: 'flex', flexDirection: 'column', gap: '5px' },
  cardOn: { border: '1px solid #3a3a60', background: '#1a1a2e' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '5px' },
  check: { width: '15px', height: '15px', borderRadius: '3px', border: '1px solid #3a3a55', background: 'transparent', color: '#0e0e18', fontSize: '10px', fontWeight: 'bold', lineHeight: 1, flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  checkOn: { background: '#6b6bcc', borderColor: '#6b6bcc' },
  name: { flex: 1, fontSize: '10px', color: '#aab', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  iconBtn: { width: '16px', height: '16px', background: '#1a1a28', border: '1px solid #2a2a40', borderRadius: '3px', color: '#7777bb', fontSize: '7px', lineHeight: 1, cursor: 'pointer', flexShrink: 0, padding: 0 },
  delBtn: { width: '16px', height: '16px', background: '#1e1010', border: '1px solid #441818', borderRadius: '3px', color: '#aa6666', fontSize: '11px', lineHeight: 1, cursor: 'pointer', flexShrink: 0, padding: 0 },
  sliderRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  sliderLabel: { fontSize: '9px', color: '#5555aa', width: '28px', flexShrink: 0 },
  slider: { flex: 1, accentColor: '#7777cc', cursor: 'pointer' },
  sliderVal: { fontSize: '10px', color: '#7777bb', width: '32px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  offsetRow: { display: 'flex', alignItems: 'center', gap: '5px' },
  numInput: { width: '46px', background: '#0e0e18', border: '1px solid #2a2a40', borderRadius: '3px', color: '#8899bb', fontFamily: 'Courier New, monospace', fontSize: '9px', padding: '3px 4px', textAlign: 'right' },
  resetBtn: { flex: 1, background: '#1a1a28', border: '1px solid #2a2a40', borderRadius: '3px', color: '#7777bb', fontFamily: 'Courier New, monospace', fontSize: '9px', padding: '3px', cursor: 'pointer' },
  moveBtn: { width: '100%', background: '#161620', border: '1px solid #2a2a40', borderRadius: '3px', color: '#7788aa', fontFamily: 'Courier New, monospace', fontSize: '9px', padding: '4px', cursor: 'pointer' },
  lockBtn: { width: '18px', height: '16px', background: 'transparent', border: 'none', fontSize: '10px', lineHeight: 1, cursor: 'pointer', flexShrink: 0, padding: 0, opacity: 0.75 },
  lockBtnOff: { opacity: 1 },
  moveBtnOn: { background: '#2a2010', border: '1px solid #aa8833', color: '#ddbb55' },
  hint: { fontSize: '8px', color: '#333355', marginTop: '2px' },
};
