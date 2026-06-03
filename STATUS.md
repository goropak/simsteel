# STATUS — simsteel

## What

제철소 부지 레이아웃 시각화 도구. SimCity 스타일의 5m 격자 기반 캔버스에 Phase별 영역과 단위 설비를 배치하고 관리한다.

## Now

v0.2.8.6 완료 (2026-06-03) — 시설 크기 마우스 드래그 조정 (리사이즈 핸들).
- 선택된 단일 시설 4모서리에 흰 사각형 핸들 표시 (depth 12, zoom-responsive 크기)
- BR/TL/TR/BL 핸들 드래그 → size.width/height + position 셀 단위 갱신
- checkAABB 충돌 거부 + 부지 경계 클램프
- 줌 변경 시 핸들 크기 재계산 (handlePx = max(4, min(16, 10/zoom)) world px)
- 우측 패널 W/H 입력 자동 동기화 (공통 store 경로)
- 브라우저 검증: W15→25, H20→30 (BR), W→30, H→35 (TL) 정상 확인

v0.2.9 완료 — 레이아웃 JSON export (import 왕복 호환).
v0.2.9 export 왕복 정합성 브라우저 검증 완료 (2026-06-03) — 경계·구석 시설 2회 왕복 후 밀림 없음 확인.
v0.2.9.1 — PNG 캡처 검은 화면 수정: GridCanvas.jsx render에 preserveDrawingBuffer: true 추가 (2026-06-03). 교훈 #12 적중. 주의: game 생성 시점 설정이라 dev 서버 재시작 필요.
pre-commit hook 설치 완료 (2026-06-02) — 헌법 제0조 봉인. scripts/pre-commit.sh + .git/hooks/pre-commit.

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
- **Phaser 사전 학습 (회고적, 2026-05-30)**: 함정 4건 확인 + 수정
  - 줌: Tween → `getWorldPoint + preRender` 5단계 공식
  - 드래그: 수동 world좌표 → `pointer.worldX/Y` 통일

### Pre-City Education
- **상태**: 완료 (회고적, 2026-05-30)
- **방식**: 보좌관 자체 학습 (AI 검색 기반)
- **도메인**: Phaser 3 Input / Camera
- **확인된 함정**: #1 dragX/Y 좌표계, #2 마우스 앵커 줌, #3 Container hitArea, #4 팬/드래그 충돌
- **문서**: `briefing/pre-city-education-protocol.md` (governance 레포)

### ✅ v0.2.2.5 완료 (2026-05-30) — 베이지 색감 + 부지 크기 패널
- `src/phaser/config.js`: `GRID_COLORS` 팔레트
- `src/phaser/GridScene.js`: 베이지 배경, thin/bold 격자, 100m 라벨, 부지 경계선
- `src/components/StatusBar.jsx`: 면적(m²/km²/평) 표시
- `src/data/sitePresets.json`: 공개 자료 프리셋 (JSW Utkal TEFR 2021 포함)
- `src/components/SiteSizePanel.jsx`: 부지 크기 조정 패널 (프리셋 + 커스텀)
- 헌법 0조 보안 체크 ✅

### ✅ v0.2.3 완료 (2026-05-30) — 시설 30종 + 회전 + 복제 + 라벨 + Hard Block

### ✅ v0.2.3.5 완료 (2026-05-30) — 사용자 정의 시설 + 회전 편집 UX

- `src/state/facilitiesStore.js`:
  - `customFacilities` 배열 + localStorage 영속 (`simsteel:custom-facilities`)
  - `addCustomFacility(def)` / `deleteCustomFacility(id)` 액션
  - `tryRotateSelected()` — AABB 사전 검사 + 회전 통합 (R키 + 버튼 공유)
- `src/components/FacilityPalette.jsx`:
  - "사용자 정의" 섹션 — TEFR과 시각 구분 (구분선 + 별도 색상)
  - "+ 새 시설 만들기" 폼 (이름/가로/세로/약어/색상)
  - 커스텀 시설 목록 + 삭제 버튼 (인스턴스 유지 안내)
  - 첫 저장 토스트 1회 ("브라우저에만 저장" 안내)
- `src/components/FacilityEditor.jsx`:
  - "↻ 90° 회전" 버튼 (단일/다중 선택 모두) — tryRotateSelected() 호출
  - TEFR 시설에 "⎘ 커스텀으로 복사" 버튼
- `src/phaser/GridScene.js`:
  - `_placeFacility`: 커스텀 typeId 조회 추가 (값 복사 배치)
  - R키 핸들러: tryRotateSelected()로 단순화
- 헌법 0조 보안 체크 ✅ (localStorage 전용, 서버 전송 0줄)

### ✅ v0.2.9 완료 (2026-05-31) — 레이아웃 JSON export (왕복 호환)

- `src/components/ImportPanel.jsx` (v0.2.8 패널 확장):
  - 헤더: "Import / Export"로 변경
  - `cellToPct()` 역변환 함수 — import `pctToCell()`의 정확한 역연산
  - `doExport()`:
    - siteBoundary 없는 경우: 전체 siteSize를 boundary로 폴백 (offsetX=0, Y=0)
    - worldSize 없는 경우: siteSize와 동일로 폴백
    - JSON.parse(JSON.stringify(...)) 깊은 복사로 frozen 객체 방지
    - Blob + createObjectURL 로컬 다운로드 (네트워크 전송 0줄)
    - 파일명: 레이아웃명.json (특수문자 '-'로 치환)
    - 첫 export 안내 토스트 1회 (`simsteel:export-warned`)
  - export 버튼: 녹색 계열 스타일로 import와 시각 구분
  - `import { GRID_CONFIG }` 추가 (cellSize 참조)
- 결정 근거: decisions/2026-05-31-simsteel-export-unblock.md
- 보안 ✅: Blob 다운로드 = 외부 전송 구조적 차단

### ✅ v0.2.8 완료 (2026-05-31) — 레이아웃 JSON import + 부지경계 표시 + 카메라 fit

- `src/state/importStore.js`: `siteBoundary` + `importMeta` 상태 관리
- `src/phaser/GridScene.js`:
  - `_importBndGfx` (depth 4) — import 부지경계 박스
  - `_drawImportBoundary(boundary, cellPx)` — 수동 점선 + 모서리 마커 (청록색)
  - `_fitToSiteBoundary(boundary)` — zoom = min(vpW/siteW, vpH/siteH)×0.88 후 내장 centerOn
  - importStore 구독 추가
- `src/phaser/FacilityRenderer.js`: confidence "낮음" → 내부 주황 테두리
- `src/components/ImportPanel.jsx`:
  - 파일 선택 모드 (FileReader, .json 타입 검증)
  - 텍스트 붙여넣기 모드
  - JSON 유효성 검사 + 파싱 실패 에러 토스트 (기존 화면 보존)
  - xPct/yPct → 절대셀 (Math.round 정수 보장, 그리드 스냅)
  - import 전 미저장 변경 confirm 다이얼로그
  - 성공 토스트
- `src/App.jsx`: ImportPanel 추가, 헤더 v0.2.8
- 보안 ✅: FileReader 브라우저 내 처리, 외부 전송 0, 이미지 AI 인식 미구현

### ✅ v0.2.5 완료 (2026-05-31) — 멀티 레이아웃 저장/불러오기 + PNG 캡처

- `src/phaser/gameInstance.js`: Phaser game 싱글톤 (PNG 접근용)
- `src/state/layoutStore.js`: `simsteel:layouts` localStorage 관리
  - `saveLayout(name, facilities, terrain, siteSize)` — JSON 깊은 복사 스냅샷
  - `deleteLayout(id)` — 삭제
  - `hasPngWarned()` / `markPngWarned()` — 1회 경고 플래그
- `src/components/SaveLoadPanel.jsx`:
  - 저장: 이름 입력 + Enter/버튼
  - 목록: 최신순 정렬, 열기/삭제 버튼
  - 불러오기: 미저장 변경 있으면 confirm 다이얼로그
  - PNG 캡처: canvas.toDataURL() + 첫 다운로드 경고 토스트
- `src/components/GridCanvas.jsx`: game 생성 후 `setGame(game)` 등록
- `src/App.jsx`: SaveLoadPanel 추가, 헤더 v0.2.5
- 보안 ✅: 파일 export/import UI 없음, 서버 전송 0줄, "안전합니다" 단언 없음
- 헌법 0조 보안 체크 ✅

### ✅ v0.2.4.1 완료 (2026-05-31) — 지형 편집(이동·회전) + 라벨 줌 깨짐 수정

- `src/state/terrainStore.js`:
  - `updateTerrain(id, changes)` — 드래그 이동 (col/row 정수 저장)
  - `tryRotateTerrain(id)` — AABB 사전 검사 + 회전 (부지 밖 Hard Block, return boolean)
  - 지형끼리 겹침 허용 (강+도로 교차 등 현실 표현, 단순화)
- `src/phaser/GridScene.js`:
  - `_terrainDrag` 상태 추가 + pointermove 지형 드래그 (시설과 동일 패턴)
  - R키: 시설 선택 없을 때 지형 회전으로 fallback
- `src/components/FacilityEditor.jsx`:
  - 지형 정보 패널에 "↻ 90° 회전 (R키)" 버튼 추가 → tryRotateTerrain()
- 파트 B — 라벨 줌 깨짐 수정 (방법 b: resolution=4):
  - `FacilityRenderer.js`: 약어/시설명 라벨 `.setResolution(4)` 적용
  - `TerrainRenderer.js`: 지형명 라벨 `.setResolution(4)` 적용
  - 이유: 최대줌 4x에서도 내부 픽셀이 1:1 → 선명. 카메라 코드 비접촉.
- 헌법 0조 보안 체크 ✅

### ✅ v0.2.4 완료 (2026-05-31) — 지형 요소 + Phase 색상

- `src/phaser/config.js`: `TERRAIN_COLORS` + `PHASE_COLORS` 추가
- `src/state/terrainStore.js`: 지형 인스턴스 CRUD + localStorage (`simsteel:terrain`)
- `src/phaser/TerrainRenderer.js`: depth 5 렌더러 (시설 depth 10 아래)
- `src/phaser/GridScene.js`:
  - `_terrainRend` + `_terrainUnsub` 추가
  - 배치 분기: `terrain:` 접두사 → `_placeTerrain()`, 그 외 → `_placeFacility()`
  - hitTest 우선순위: 시설 > 지형 > 팬
  - Delete키: 시설 우선, 없으면 선택 지형 삭제
  - 신규 시설에 `phase: 1` 기본값 추가
- `src/state/facilitiesStore.js`: `phaseViewEnabled` + `togglePhaseView()`
- `src/phaser/FacilityRenderer.js`: Phase 오버레이 (P2=주황 틴트, P3=보라 틴트, 우상단 배지)
- `src/components/FacilityPalette.jsx`:
  - 헤더: Phase 뷰 ON/OFF 토글 버튼
  - "지형" 섹션 추가 (강·도로·나무, terrain: 접두사)
- `src/components/FacilityEditor.jsx`:
  - Phase P1/P2/P3 버튼 (단일 선택 시)
  - 지형 선택 시 지형 정보 패널 (종류·위치·크기·삭제)
- 헌법 0조 보안 체크 ✅ (지형 = localStorage 전용, 서버 전송 0줄)

### ✅ v0.2.3.7 완료 (2026-05-30) — 카메라 팬 복구 + 부지 중심 생성 (clamp 공식 수정)
- `src/phaser/GridScene.js`:
  - `_clampCamera()` 공식 재작성 — "최소 가시 영역" 방식 (Phaser 함정 #6)
    - 구 공식: `maxScrollX = siteW - vpW + margin` → 줌아웃 시 범위 반전 → 팬 완전 잠금
    - 신 공식: `minScrollX = minVis - vpW`, `maxScrollX = siteW - minVis` → zoom 무관 안정
    - minVis = min(siteW×0.15, 200px) — 부지 최소 15% 항상 화면 안
  - `_centerCameraOnSite()` 변경 없음 — 공식 자체는 올바랐고 clamp 수정으로 정상 작동
- 헌법 0조 보안 체크 ✅

### ✅ v0.2.3.6 완료 (2026-05-30) — 카메라 팬 경계 클램프 + 부지/배경 색 분리
- `src/phaser/config.js`: `outsideBackground` 색상 추가 (회녹색 그레이 #BBBEB8)
- `src/phaser/GridScene.js`:
  - 카메라 배경 → 외부색(회녹). 부지 내부 베이지는 `_siteFillGfx`(depth 0)로 별도 fill
  - `_clampCamera()` 헬퍼 추가 — 부지 폭의 50% 여유 마진, 줌 감응 동적 계산
  - 팬(pointermove) + 줌(wheel 5단계 보정 이후) 양쪽에서 clamp 호출
  - 부지 크기 변경 시 clamp 재적용
  - 경계선: 흰색 → 어두운 갈색 #5A3A1A, 3px → 2px
  - `_centerCameraOnSite()` 추가 — 최초 로드 + 부지 크기 Apply 시 부지 중심을 화면 중심으로 정렬
  - 부지 좌표계(0,0 기준)·시설 위치·Hard Block·clamp 전부 그대로 유지

- **시설 30종 일괄 활성화** (선강 일관 공정 전 영역)
  - 카테고리 8개: 원료처리(5) / 소결(2) / 코크스(3) / 고로(4) / 제강(5) / 압연(5) / 부대설비(6) / 펠릿(2 비활성)
  - 각 시설: `abbrev` 약어, `confirmed` footprint 확정 여부, `source` TEFR Dastur 2021
  - `confirmed: false` → 회색 표시
- **R키 90도 회전**: AABB width↔height swap, 경계·충돌 시 취소 (Hard Block)
- **Cmd+D 복제**: +1셀 오프셋, 빈 셀 탐색(최대 20칸), 복제 직후 자동 선택
- **약어 라벨**: 시설 중앙, 어두운 갈색 #3D2E1F, 줌 0.25 이상 표시
- **시설명 라벨**: 줌 0.8 이상에서 약어 아래 추가 표시
- **부지 경계 Hard Block**: 배치·드래그 시 부지 외곽 클램프, 경계 밖 시설 빨간 테두리
- 헌법 0조 보안 체크 ✅ (TEFR 공개 자료만, 내부 좌표·도면 없음)

## Next

1. v0.2.9: 번호 자동 증가 (#1, #2) or 다음 백로그 항목

## Backlog

### 중기 (v0.3.x) — 비주얼 게임화
- v0.3.0: 2.5D 아이소메트릭 뷰 전환 (v0.2.6 배포 후 활용도 데이터 보고 결정)
- v0.3.1: AI 생성 픽셀 아트 스프라이트 (공개 자료 한정)
- v0.3.2: 연기·차량·컨베이어 단순 애니메이션

### 장기 (v0.4~v0.5) — 데이터 보안 및 협업
- v0.4: Supabase + Auth, Layer 2 사용자 데이터 격리 보관, 개인 도면 업로드
- v0.5+: JSW/DASTUR 등 파트너 JSON 표준 Import, 공유 링크, 멀티유저 협업

### 보안 결정 (헌법 0조 부칙)
- 외부 비전 AI(GPT Vision 등) 도면 트레이싱 **전면 폐기**
- 사내 망 또는 로컬 모델만 허용 (v0.4 시점 재검토)
- Layer 2 데이터는 Supabase에만 보관, 외부 AI 전송 절대 금지

**결정 문서**: `governance/decisions/2026-05-30-simsteel-visual-strategy.md`
