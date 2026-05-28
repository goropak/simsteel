# STATUS — simsteel

## What

제철소 부지 레이아웃 시각화 도구. SimCity 스타일의 5m 격자 기반 캔버스에 Phase별 영역과 단위 설비를 배치하고 관리한다.

## Now

v0.1 — 도시 골격 완성.
- 폴더 구조 생성 (references/, data/, src/, public/)
- 참조 자료 시스템(references/) 구축
- facility-presets.json TEFR 기반 초안 작성
- 코드 미작성. UI 미착수.

## Next

1. v0.2 — Phaser.js UI 프로토타입: 5m 격자 렌더링, 시설 배치 인터랙션 구현
2. v0.2 — React + Phaser.js 프로젝트 초기화 (CRA 또는 Vite)
3. v0.2 — facility-presets.json footprint_cells 정밀화 (사용자 입력 기반)

## Backlog

- v0.3: 사용자 벤치마크 데이터 입력 UI (Layer 2)
- v0.4: Supabase 연동 — 레이아웃 저장/불러오기, Auth
- v0.5: 협업 기능 (공유 링크, 멀티유저)
- v0.?: Phase 2/3 영역 확장 (8 km², 12 km²)
