/**
 * 엑셀(.xlsx) 일괄 시설 입력 — 파싱 로직 (v0.4.1 — feature 1·4)
 *
 * 사용자가 엑셀에 시설별 가로×세로(m)를 채우면 팔레트 항목을 자동 생성한다.
 * SheetJS(xlsx) 의존부는 패널에서 동적 import, 여기는 순수 함수만(테스트 가능).
 *
 * Pre-City Education(법률 #2) 함정 회피 적용:
 *   #3 {header:1} 2D 배열로 받아 행 단위 명시 검증
 *   #4 parseFloat 강제 변환 + NaN/0/음수 행 스킵
 *   #5 헤더 키워드 매칭으로 헤더 행 탐지
 *   #6 m→셀: Math.max(1, Math.round(m/5))  (1셀=5m)
 */

export const CELL_METERS = 5;

/**
 * 템플릿 헤더 (export·import 공통 기준).
 * v0.5.0(feature 9) — 사용자 요청대로 이름·가로·세로 3열만 노출.
 * 분류/약어/색상은 업로드 후 팔레트에서 편집(불필요한 입력 항목 제거).
 */
export const TEMPLATE_HEADER = ['이름', '가로(m)', '세로(m)'];

/** 템플릿 예시 행 (사용자가 형식을 보고 채울 수 있게) */
export const TEMPLATE_SAMPLE = [
  ['고로 2호기', 100, 100],
  ['전로 2호기', 60, 45],
  ['신규 부속동', 30, 20],
];

/** 헤더 행 여부 판정 — '이름'/'가로'/'세로' 키워드 포함 시 헤더로 간주 (함정 #5) */
function looksLikeHeader(row) {
  const joined = row.map((c) => String(c ?? '')).join('|');
  return /이름/.test(joined) && /가로/.test(joined) && /세로/.test(joined);
}

/**
 * 2D 배열(rows) → 시설 정의 배열로 파싱.
 * 열 순서: [이름, 가로(m), 세로(m)]  (v0.5.0 — 3열 단순화)
 * 생성 시설은 모두 'custom' 분류로 들어가며 색상은 자동 배정.
 * @returns {{ items: Array, skipped: Array<{row:number, reason:string}> }}
 */
export function parseFacilityRows(rows) {
  const items = [];
  const skipped = [];

  if (!Array.isArray(rows) || rows.length === 0) {
    return { items, skipped: [{ row: 0, reason: '빈 시트' }] };
  }

  let start = 0;
  if (looksLikeHeader(rows[0])) start = 1;  // 헤더 행 스킵

  for (let i = start; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 1; // 1-based(사용자 친화)
    if (!r || r.every((c) => c == null || String(c).trim() === '')) continue; // 완전 빈 행

    const name = String(r[0] ?? '').trim();
    // parseFloat는 "60m"→60(단위 접미사 허용)이면서 "-5"→-5(음수 그대로)로 파싱 →
    // 아래 (wM > 0) 검사에서 음수·0·NaN을 모두 걸러낸다 (함정 #4).
    const wM = parseFloat(String(r[1] ?? '').trim());
    const hM = parseFloat(String(r[2] ?? '').trim());

    if (!name) { skipped.push({ row: rowNum, reason: '이름 누락' }); continue; }
    if (!(wM > 0)) { skipped.push({ row: rowNum, reason: `가로(m) 부적합: "${r[1]}"` }); continue; }
    if (!(hM > 0)) { skipped.push({ row: rowNum, reason: `세로(m) 부적합: "${r[2]}"` }); continue; }

    const width  = Math.max(1, Math.min(200, Math.round(wM / CELL_METERS)));  // 함정 #6
    const height = Math.max(1, Math.min(200, Math.round(hM / CELL_METERS)));

    items.push({
      name,
      width,
      height,
      categoryId: 'custom',
    });
  }

  return { items, skipped };
}
