/**
 * 격자 캔버스 설정 상수
 * 단위: 5m / 셀, Phase 1: 400×400 셀 (2,000m × 2,000m)
 */
export const GRID_CONFIG = {
  cellSize: 5,              // 격자 단위 (m)
  pixelsPerCell: 4,         // 1셀 = 4px (줌 1배 기준)
  phase1Width: 400,         // Phase 1 가로 (셀) — 동적 변경은 siteStore 참조
  phase1Height: 400,        // Phase 1 세로 (셀)

  gridMajorEvery: 10,       // 10셀(=50m)마다 굵은 선
  gridLabelEvery: 20,       // 20셀(=100m)마다 좌표 라벨

  zoomMin: 0.1,
  zoomMax: 4.0,
  zoomStep: 0.1,            // 휠 1회당 10% 변화
};

/**
 * 베이지 색상 팔레트 (v0.2.2.5 — AutoCAD/SketchUp 도면 느낌)
 * UI 패널(사이드바 헤더 등)은 다크 톤 유지 — 대비를 위해
 */
export const GRID_COLORS = {
  background:  0xC9A876,   // 베이지 흙바닥
  gridThin:    0xA68B5B,   // 5m 격자 (옅은 갈색)
  gridBold:    0x6B5435,   // 50m 격자 (진한 갈색)
  labelText:   '#3D2817',  // 100m 좌표 라벨 (거의 검정, Phaser Text용 hex string)
  boundary:    0xFFFFFF,   // 부지 경계선 (흰색 — 베이지 위 가시성)
  boundaryOut: 0xAA8855,   // 부지 외부 오버레이 (어두운 베이지)
};
