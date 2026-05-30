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
 * v0.2.3.6: 부지 내부(베이지)와 외부(회녹색)를 색으로 분리
 * UI 패널(사이드바 헤더 등)은 다크 톤 유지 — 대비를 위해
 */
export const GRID_COLORS = {
  background:        0xC9A876,   // 부지 내부 — 베이지 흙바닥 (격자 배경)
  outsideBackground: 0xBBBEB8,   // 부지 외부 — 회녹색 그레이 (카메라 배경)
  gridThin:          0xA68B5B,   // 5m 격자 (옅은 갈색)
  gridBold:          0x6B5435,   // 50m 격자 (진한 갈색)
  labelText:         '#3D2817',  // 100m 좌표 라벨 (Phaser Text용 hex string)
  boundary:          0x5A3A1A,   // 부지 경계선 (어두운 갈색 — 베이지/회녹 모두 위 가시성)
  boundaryOut:       0xAA8855,   // (미사용 예비 — 외부 오버레이용)
};
