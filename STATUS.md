# STATUS — simsteel

## What

제철소 부지 레이아웃 시각화 도구. SimCity 스타일의 5m 격자 기반 캔버스에 Phase별 영역과 단위 설비를 배치하고 관리한다.

## Now

v0.2.2 진행 예정 — 시설 팔레트 + 배치 인터랙션.

### ✅ v0.2.1 완료 (2026-05-29)
- references/ 시스템 활성화 완료 (PDF 6개, 메타파일 7개, 총 45.5 MB)
- facility-presets.json TEFR 기반 초안 완성 (11개 카테고리, 53개 설비)
- **격자 캔버스 구현 완료** — 브라우저 확인 완료
  - `src/phaser/GridScene.js` — Phaser Scene (격자, 줌, 팬)
  - `src/components/GridCanvas.jsx` — React-Phaser 브리지
  - `src/components/StatusBar.jsx` — 좌표 표시 (m 단위, 셀 번호, 줌 레벨)
  - `src/App.jsx` — 전체 레이아웃
- 커서 앵커 줌 (Phaser Tween 방식, roundPixels=false)

## Next

1. **v0.2.2**: 좌측 시설 팔레트 + 시설 사각형 배치 인터랙션
2. v0.2.x: facility-presets.json footprint_cells 정밀화

## Backlog

- v0.3: 사용자 벤치마크 데이터 입력 UI (Layer 2)
- v0.4: Supabase 연동 — 레이아웃 저장/불러오기, Auth
- v0.5: 협업 기능 (공유 링크, 멀티유저)
- v0.?: Phase 2/3 영역 확장 (8 km², 12 km²)
