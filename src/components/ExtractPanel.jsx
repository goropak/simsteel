import { useExtractStore } from '../state/extractStore.js';
import { useImageLayerStore } from '../state/imageLayerStore.js';

/**
 * 이미지 추출 패널 — v0.5.0 (feature 5)
 *
 * 참조 이미지 위에서 시설/부지를 추출하는 전용 모드.
 * 일반 배치·선택과 충돌하지 않도록 "추출 모드"를 켠 동안에만 동작.
 *
 *  - 사각형: 맵에서 드래그한 영역(미터 환산)으로 커스텀 시설 생성
 *  - 자동 인식: 클릭한 지점과 같은 색 영역을 자동 감지(flood-fill)하여 시설 생성
 *  - 부지 경계 자동 생성: 최상단 이미지의 내용 영역을 부지 격자에 맞춰 정렬
 *
 * 보안 (헌법 0조 부칙): 픽셀 분석은 전부 로컬 canvas로만 수행, 외부 전송 없음.
 */
export default function ExtractPanel() {
  const extractMode     = useExtractStore((s) => s.extractMode);
  const extractTool     = useExtractStore((s) => s.extractTool);
  const toggleExtractMode = useExtractStore((s) => s.toggleExtractMode);
  const setExtractTool  = useExtractStore((s) => s.setExtractTool);
  const requestAutoSite = useExtractStore((s) => s.requestAutoSite);

  const hasVisibleLayer = useImageLayerStore((s) => s.layers.some((l) => l.visible !== false));

  return (
    <div style={styles.panel}>
      <div style={styles.header}>이미지 추출</div>
      <div style={styles.body}>
        <button
          style={{ ...styles.modeBtn, ...(extractMode ? styles.modeBtnOn : {}) }}
          onClick={toggleExtractMode}
        >
          {extractMode ? '● 추출 모드 ON (클릭 종료)' : '추출 모드 시작'}
        </button>

        {extractMode && (
          <>
            <div style={styles.toolRow}>
              <button
                style={{ ...styles.toolBtn, ...(extractTool === 'rect' ? styles.toolBtnOn : {}) }}
                onClick={() => setExtractTool('rect')}
              >
                □ 사각형
              </button>
              <button
                style={{ ...styles.toolBtn, ...(extractTool === 'auto' ? styles.toolBtnOn : {}) }}
                onClick={() => setExtractTool('auto')}
              >
                ✦ 자동 인식
              </button>
            </div>
            <div style={styles.guide}>
              {extractTool === 'rect'
                ? '맵에서 시설 영역을 드래그하면 그 크기로 시설이 만들어집니다.'
                : '이미지 속 건물 안쪽을 클릭하면 같은 색 영역을 자동 감지합니다.'}
            </div>
          </>
        )}

        <button
          style={{ ...styles.siteBtn, opacity: hasVisibleLayer ? 1 : 0.4 }}
          disabled={!hasVisibleLayer}
          onClick={requestAutoSite}
          title={hasVisibleLayer ? '최상단 이미지를 부지 격자에 맞춤' : '먼저 이미지 레이어를 켜 주세요'}
        >
          부지 경계 자동 생성
        </button>

        <div style={styles.hint}>로컬 픽셀 분석 · 외부 전송 없음</div>
      </div>
    </div>
  );
}

const styles = {
  panel: { background: '#12121c', borderTop: '1px solid #2a2a40', fontFamily: 'Courier New, monospace', flexShrink: 0 },
  header: { height: '30px', display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '10px', color: '#7777cc', borderBottom: '1px solid #1e1e2e', letterSpacing: '1px' },
  body: { padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' },
  modeBtn: { width: '100%', background: '#161620', border: '1px solid #2a3a50', borderRadius: '3px', color: '#88bbaa', fontFamily: 'Courier New, monospace', fontSize: '11px', padding: '6px', cursor: 'pointer' },
  modeBtnOn: { background: '#10302a', border: '1px solid #33ddbb', color: '#5fe9cc' },
  toolRow: { display: 'flex', gap: '6px' },
  toolBtn: { flex: 1, background: '#1a1a28', border: '1px solid #2a2a40', borderRadius: '3px', color: '#7788aa', fontFamily: 'Courier New, monospace', fontSize: '10px', padding: '5px', cursor: 'pointer' },
  toolBtnOn: { background: '#10302a', border: '1px solid #33ddbb', color: '#5fe9cc' },
  guide: { fontSize: '9px', color: '#557', lineHeight: 1.5 },
  siteBtn: { width: '100%', background: '#1a1a2e', border: '1px solid #3a3a60', borderRadius: '3px', color: '#8888dd', fontFamily: 'Courier New, monospace', fontSize: '10px', padding: '6px', cursor: 'pointer', marginTop: '2px' },
  hint: { fontSize: '8px', color: '#333355', marginTop: '2px' },
};
