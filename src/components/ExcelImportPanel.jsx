/**
 * 엑셀(.xlsx) 일괄 시설 입력 패널 (v0.4.1 — feature 1·4)
 *
 * 1) 템플릿 .xlsx 다운로드 → 사용자가 시설별 가로×세로(m) 작성
 * 2) 작성한 .xlsx 업로드 → 팔레트 항목 일괄 자동 생성
 *
 * SheetJS는 동적 import(함정 #8 — 메인 번들 분리).
 * 보안(헌법 0조 부칙): FileReader + Blob, 네트워크 전송 0줄.
 */
import { useState, useRef } from 'react';
import { useFacilitiesStore } from '../state/facilitiesStore.js';
import {
  parseFacilityRows,
  TEMPLATE_HEADER,
  TEMPLATE_SAMPLE,
} from '../state/excelFacilities.js';

export default function ExcelImportPanel() {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [toastErr, setToastErr] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);
  const addCustomFacilities = useFacilitiesStore((s) => s.addCustomFacilities);

  const showOk  = (m) => { setToast(m);    setTimeout(() => setToast(''),    6000); };
  const showErr = (m) => { setToastErr(m); setTimeout(() => setToastErr(''), 7000); };

  // 템플릿 다운로드 — 헤더 + 예시 행
  const downloadTemplate = async () => {
    setBusy(true);
    try {
      const XLSX = await import('xlsx');
      const aoa = [TEMPLATE_HEADER, ...TEMPLATE_SAMPLE];
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [{ wch: 18 }, { wch: 10 }, { wch: 10 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '시설목록');
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'simsteel-시설입력-템플릿.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showOk('템플릿 다운로드 완료 · 이름/가로(m)/세로(m)만 채워 업로드하세요');
    } catch (e) {
      showErr(`템플릿 생성 실패: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  // 업로드 → 파싱 → 일괄 생성
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      showErr('지원 형식: .xlsx / .xls / .csv');
      return;
    }
    setBusy(true);
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();                 // 함정 #2 — ArrayBuffer
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false }); // 함정 #3 — 2D
      const { items, skipped } = parseFacilityRows(rows);

      if (items.length === 0) {
        showErr(`생성할 유효 행이 없습니다. 스킵 ${skipped.length}행${skipped[0] ? ` (예: ${skipped[0].row}행 — ${skipped[0].reason})` : ''}`);
        return;
      }
      addCustomFacilities(items);
      const skipNote = skipped.length ? ` · 스킵 ${skipped.length}행` : '';
      showOk(`시설 ${items.length}개 생성 완료${skipNote} — 팔레트에서 확인하세요`);
      setOpen(false);
    } catch (err) {
      showErr(`엑셀 처리 실패: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span>엑셀 일괄 입력</span>
        <button style={styles.toggle} onClick={() => setOpen((v) => !v)}>
          {open ? '▴ 닫기' : '▾ 열기'}
        </button>
      </div>

      {open && (
        <div style={styles.body}>
          <button style={styles.tmplBtn} disabled={busy} onClick={downloadTemplate}>
            📄 엑셀 템플릿 다운로드
          </button>
          <div style={styles.hint}>
            이름 · 가로(m) · 세로(m) 3열만. 1셀=5m로 자동 변환.
          </div>

          <div style={styles.divider} />

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          <button style={styles.upBtn} disabled={busy} onClick={() => fileInputRef.current?.click()}>
            {busy ? '⏳ 처리 중…' : '📥 작성한 엑셀 업로드'}
          </button>
          <div style={styles.hint}>
            행마다 팔레트 시설 자동 생성 · 사용자 정의 섹션에 추가 · 외부 전송 없음
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
  tmplBtn: { width: '100%', background: '#1a2010', border: '1px solid #4a7030', borderRadius: '3px', color: '#88cc66', fontFamily: 'Courier New, monospace', fontSize: '10px', padding: '6px', cursor: 'pointer', boxSizing: 'border-box', display: 'block', marginBottom: '6px' },
  upBtn: { width: '100%', background: '#102030', border: '1px solid #3a6080', borderRadius: '3px', color: '#88bbdd', fontFamily: 'Courier New, monospace', fontSize: '10px', padding: '6px', cursor: 'pointer', boxSizing: 'border-box', display: 'block', marginBottom: '6px' },
  divider: { borderTop: '1px solid #1e1e2e', margin: '8px 0 6px' },
  hint: { fontSize: '9px', color: '#333355', lineHeight: 1.6, marginBottom: '4px' },
  toast: { position: 'absolute', bottom: '100%', left: '8px', right: '8px', background: '#1a2030', border: '1px solid #3a5a70', borderRadius: '4px', color: '#88bbdd', fontSize: '10px', padding: '7px 10px', lineHeight: 1.5, zIndex: 20, marginBottom: '4px' },
  toastErr: { background: '#2a1010', border: '1px solid #703a3a', color: '#dd8888' },
};
