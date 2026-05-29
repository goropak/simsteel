/**
 * 격자 캔버스 설정 상수
 * 단위: 5m / 셀, Phase 1: 400×400 셀 (2,000m × 2,000m)
 */
export const GRID_CONFIG = {
  cellSize: 5,              // 격자 단위 (m)
  pixelsPerCell: 4,         // 1셀 = 4px (줌 1배 기준)
  phase1Width: 400,         // Phase 1 가로 (셀)
  phase1Height: 400,        // Phase 1 세로 (셀)

  bgColor: 0x1a1a24,        // 다크 배경
  gridColor: 0x2a2a38,      // 일반 격자선
  gridMajorColor: 0x3a3a50, // 50m 굵은 선
  gridMajorEvery: 10,       // 10셀(=50m)마다 굵은 선
  gridLabelEvery: 20,       // 20셀(=100m)마다 좌표 라벨

  zoomMin: 0.1,
  zoomMax: 4.0,
  zoomStep: 0.1,            // 휠 1회당 10% 변화
};
