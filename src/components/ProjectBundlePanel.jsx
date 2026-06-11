/**
 * 완전 프로젝트 번들 패널 (v0.4.0 — feature 3)
 *
 * 한 번의 export로 전체 작업(커스텀 시설·저장 레이아웃·지형·현재 보드·부지 크기)을
 * 단일 .json으로 백업하고, 새 컴퓨터에서 import 한 번으로 복원한다.
 *
 * 보안 (헌법 0조 부칙): Blob 다운로드 + FileReader — 네트워크 전송 0줄.
 */
import { useState, useRef } from 'react';
import { downloadProjectBundle, applyProjectBundle } from '../state/projectBundle.js';
import { useFacilitiesStore } from '../state/facilitiesStore.js';
import { useLayoutStore } from '../state/layoutStore.js';

const APP_VERSION = 'v0.5.1';

export default function ProjectBundlePanel() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [toastErr, setToastErr] = useState('');
  const fileInputRef = useRef(null);

  // 요약 표시용 (현재 상태)
  const facCount    = useFacilitiesStore((s) => s.facilities.length);
  const customCount = useFacilitiesStore((s) => s.customFacilities.length);
  const layoutCount = useLayoutStore((s) => s.layouts.length);

  const showOk  = (m) => { setToast(m);    setTimeout(() => setToast(''),    4500); };
  const showErr = (m) => { setToastErr(m); setTimeout(() => setToastErr(''), 6000); };

  const doExport = () => {
    try {
      downloadProjectBundle(APP_VERSION);
      showOk('프로젝트 번들 다운로드 완료 · 새 PC에서 import 하세요');
    } catch (e) {
      showErr(`export 실패: ${e.message}`);
    }
  };

  const doImport = (text) => {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      showErr(`JSON 파싱 실패: ${e.message}`);
      return;
    }
    const cur = useFacilitiesStore.getState();
    const layouts = useLayoutStore.getState().layouts.length;
    if (cur.facilities.length > 0 || cur.customFacilities.length > 0 || layouts > 0) {
      const ok = window.confirm(
        '현재 모든 작업(시설·커스텀·레이아웃·지형)을 번들 내용으로 덮어씁니다.\n계속하시겠습니까?'
      );
      if (!ok) return;
    }
    try {
      const r = applyProjectBundle(data);
      showOk(`복원 완료 — 시설 ${r.facilities} · 커스텀 ${r.customFacilities} · 레이아웃 ${r.layouts} · 지형 ${r.terrains} · 이미지 ${r.imageLayers}`);
      setOpen(false);
    } catch (e) {
      showErr(`import 실패: ${e.message}`);
    }
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

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span>프로젝트 백업 / 복원</span>
        <button style={styles.toggle} onClick={() => setOpen((v) => !v)}>
          {open ? '▴ 닫기' : '▾ 열기'}
        </button>
      </div>

      {open && (
        <div style={styles.body}>
          <div style={styles.summary}>
            현재: 시설 {facCount} · 커스텀 {customCount} · 레이아웃 {layoutCount}
          </div>

          <button style={styles.exportBtn} onClick={doExport}>
            💾 전체 프로젝트 export (.json)
          </button>
          <div style={styles.hint}>
            커스텀 시설 · 저장 레이아웃 · 지형 · 현재 보드 · 부지 크기 · 이미지 레이어를 한 파일로 백업
          </div>

          <div style={styles.divider} />

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          <button style={styles.importBtn} onClick={() => fileInputRef.current?.click()}>
            📥 프로젝트 import (.json)
          </button>
          <div style={styles.hint}>
            새 컴퓨터에서 백업 파일을 불러와 전체 복원 · 브라우저 내 처리 · 외부 전송 없음
          </div>
        </div>
      )}

      {toast    && <div style={styles.toast}>{toast}</div>}
      {toastErr && <div style={{ ...styles.toast, ...styles.toastErr }}>{toastErr}</div>}
    </div>
  );
}

const styles = {
  panel: { background: '#0e0e18', borderTop: '1px solid #2a2a40', flexShrink: 0, fontFamily: 'Courier New, monospace', position: 'relative' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', fontSize: '11px', color: '#7777cc', letterSpacing: '1px' },
  toggle: { background: 'none', border: 'none', color: '#555588', fontFamily: 'Courier New, monospace', fontSize: '10px', cursor: 'pointer', padding: 0 },
  body: { padding: '0 12px 10px' },
  summary: { fontSize: '9px', color: '#556688', marginBottom: '8px' },
  exportBtn: { width: '100%', background: '#1a2010', border: '1px solid #4a7030', borderRadius: '3px', color: '#88cc66', fontFamily: 'Courier New, monospace', fontSize: '10px', padding: '6px', cursor: 'pointer', boxSizing: 'border-box', display: 'block', marginBottom: '6px' },
  importBtn: { width: '100%', background: '#102030', border: '1px solid #3a6080', borderRadius: '3px', color: '#88bbdd', fontFamily: 'Courier New, monospace', fontSize: '10px', padding: '6px', cursor: 'pointer', boxSizing: 'border-box', display: 'block', marginBottom: '6px' },
  divider: { borderTop: '1px solid #1e1e2e', margin: '8px 0 6px' },
  hint: { fontSize: '9px', color: '#333355', lineHeight: 1.6, marginBottom: '4px' },
  toast: { position: 'absolute', bottom: '100%', left: '8px', right: '8px', background: '#1a2030', border: '1px solid #3a5a70', borderRadius: '4px', color: '#88bbdd', fontSize: '10px', padding: '7px 10px', lineHeight: 1.5, zIndex: 20, marginBottom: '4px' },
  toastErr: { background: '#2a1010', border: '1px solid #703a3a', color: '#dd8888' },
};
