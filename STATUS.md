# STATUS — simsteel

## What

제철소 부지 레이아웃 시각화 도구. SimCity 스타일의 5m 격자 기반 캔버스에 Phase별 영역과 단위 설비를 배치하고 관리한다.

## Now

v0.2.3 준비 중 — v0.2.2.5 베이지 색감 + 부지 크기 패널 완료.

### ✅ v0.2.1 완료 (2026-05-29)
- references/ 시스템 활성화 완료 (PDF 6개, 메타파일 7개, 총 45.5 MB)
- facility-presets.json TEFR 기반 초안 완성 (11개 카테고리, 53개 설비)
- 격자 캔버스 구현 — 브라우저 확인 완료
- 커서 앵커 줌 (Phaser Tween 방식)

### ✅ v0.2.2 완료 (2026-05-30)
- `src/data/facilityCategories.js` — 카테고리 트리 (고로만 활성화)
- `src/state/facilitiesStore.js` — Zustand 시설 상태 관리
- `src/phaser/FacilityRenderer.js` — Graphics + Text 풀 기반 렌더링
- `src/phaser/GridScene.js` — 배치/선택/드래그/삭제/복사 핸들러
- `src/components/FacilityPalette.jsx` — 좌측 240px 사이드바
- `src/components/FacilityEditor.jsx` — 우측 280px 편집 패널
- `src/App.jsx` — 3패널 레이아웃 (팔레트 | 캔버스 | 에디터)
- `src/components/StatusBar.jsx` — 시설 수 + 선택 이름 추가
- **Phaser 사전 학습 (회고적, 2026-05-30)**: 함정 4건 확인 + 수정
  - 줌: Tween → `getWorldPoint + preRender` 5단계 공식
  - 드래그: 수동 world좌표 → `pointer.worldX/Y` 통일
  - scrollX/Y 직접 조작 패턴 정리

### Pre-City Education
- **상태**: 완료 (회고적, 2026-05-30)
- **방식**: 보좌관 자체 학습 (AI 검색 기반)
- **도메인**: Phaser 3 Input / Camera
- **확인된 함정**: #1 dragX/Y 좌표계, #2 마우스 앵커 줌, #3 Container hitArea, #4 팬/드래그 충돌
- **문서**: `briefing/pre-city-education-protocol.md` (governance 레포)

### ✅ v0.2.2.5 완료 (2026-05-30) — 베이지 색감 + 부지 크기 패널
- `src/phaser/config.js`: `GRID_COLORS` 팔레트 (베이지 배경/격자/경계)
- `src/phaser/GridScene.js`: 베이지 배경, 5m/50m thin/bold 격자, 100m 좌표 라벨, 부지 경계선
- `src/components/StatusBar.jsx`: 면적(m²/km²/평) 표시
- `src/data/sitePresets.json`: 공개 자료 프리셋 (JSW Utkal TEFR 2021 포함)
- `src/components/SiteSizePanel.jsx`: 부지 크기 조정 패널 (프리셋 + 커스텀)
- `src/state/facilitiesStore.js`: `siteSize` 상태 추가
- `src/App.jsx`: rightCol 레이아웃 (FacilityEditor + SiteSizePanel)
- 헌법 0조 보안 체크 ✅

## Next

1. `npm install && npm run dev` → 브라우저 검증 (베이지 배경 + 면적 표시 + SiteSizePanel)
2. v0.2.3: 시설 30종 일괄 활성화 + 충돌 검사

## Backlog

### 중기 (v0.3.x) — 비주얼 게임화
- v0.3.0: 2.5D 아이소메트릭 뷰 전환 (v0.2.6 배포 후 활용도 데이터 보고 결정)
- v0.3.1: AI 생성 픽셀 아트 스프라이트 (공개 자료 한정, 나노바나나/GPT Image)
- v0.3.2: 연기·차량·컨베이어 단순 애니메이션

### 장기 (v0.4~v0.5) — 데이터 보안 및 협업
- v0.4: Supabase + Auth, Layer 2 사용자 데이터 격리 보관, 개인 도면 업로드
- v0.5+: JSW/DASTUR 등 파트너 JSON 표준 Import, 공유 링크, 멀티유저 협업

### 보안 결정 (헌법 0조 부칙)
- 외부 비전 AI(GPT Vision 등) 도면 트레이싱 **전면 폐기**
- 사내 망 또는 로컬 모델만 허용 (v0.4 시점 재검토)
- Layer 2 데이터는 Supabase에만 보관, 외부 AI 전송 절대 금지

**결정 문서**: `governance/decisions/2026-05-30-simsteel-visual-strategy.md`

