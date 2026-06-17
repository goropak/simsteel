# STATUS — simsteel

## What

제철소 부지 레이아웃 시각화 도구. SimCity 스타일의 5m 격자 기반 캔버스에 Phase별 영역과 단위 설비를 배치하고 관리한다.

## Now

v0.5.2 진행 (2026-06-12) — 서버 저장 + 로그인 + 추출 시설 일반화 (대통령 요청, 겸직 세션). **로드맵 v0.4(Supabase+Auth) 본체 착수.**
- **서버 저장 (개인 계정)**: Supabase Auth(아이디/비번 — `아이디@simsteel.app` 합성 이메일) + `projects` 테이블(사용자당 1 row = 전체 번들) + RLS 격리. 로그인 시 pull, 보드 변경 1.5s 디바운스 자동저장 + 헤더 "서버에 저장" 수동 버튼. 신규: src/lib/supabase.js·imageStorage.js, src/state/authStore.js·cloudSync.js, src/components/LoginGate.jsx·SyncControls.jsx, supabase/schema.sql, .env.example.
- **이미지 서버 저장**: 레이어 base64 → Storage 버킷(`project-images/{userId}/`) 업로드, DB엔 storagePath만. pull 시 URL→base64 복원해 기존 Phaser 렌더 파이프 유지.
- **graceful degradation(자동화 헌장)**: env 없으면 client=null → 로컬 전용 모드로 기존과 동일 동작. 로그인 게이트도 통과. → **Supabase 미설정 상태로 배포해도 앱 안 깨짐.**
- **추출 시설 = 팔레트 시설과 동일**: `_createExtractedFacility`에서 window.prompt 제거 → 기본 이름 즉시 생성 + 자동 선택(핸들·편집 패널 노출). 추출 모드 자동 종료. 드래그·리사이즈·R회전·색·이름(더블클릭 인라인) 전부 일반 시설과 동일.
- 법률 #2 Pre-City Education 완료: Supabase 함정 10건 lessons-cities.md 등재(#supabase).
- APP_VERSION·헤더 v0.5.1→v0.5.2. 의존성 `@supabase/supabase-js` 추가(사용자 Mac `npm install` 필요).
- 검증: @babel/parser 구문 OK + 이미지 externalize/internalize 로직 시뮬레이션. **Supabase 실연동·로그인·저장/복원은 대통령이 본인 Mac에서 프로젝트 생성·스키마 실행·.env.local 입력 후 확인 필요(샌드박스는 라이브 백엔드 불가).**
- **셋업 순서**(대통령): ① supabase.com 프로젝트 생성 → ② SQL Editor에 `supabase/schema.sql` 실행 → ③ Auth에서 Confirm email OFF → ④ `.env.local`에 VITE_SUPABASE_URL·ANON_KEY → ⑤ Vercel 환경변수 동일 입력 → `npm install && npm run dev`.

v0.5.1 완료 (2026-06-12) — UX 개선 5건 (대통령 요청, 보좌관=시장 겸직 세션).
- **#1 이미지 가로/세로 독립 리사이즈**: imageLayerStore·bgImageStore의 균일 scale → scaleX/scaleY 분리. 패널에 🔒 비율 고정 토글(기본 ON=기존 동작) ↔ 🔓 가로/세로 슬라이더 분리. 구버전 단일 scale 값은 로드·번들 import 시 scaleX=scaleY로 자동 마이그레이션(normalizeLayer — projectBundle에도 적용). 배경 코너 핸들 드래그는 양 축 동일 배율로 비균일 비율 보존.
- **#2 맵 위 인라인 이름 편집**: window.prompt 폐기. 시설 더블클릭 → 라벨 그 자리를 덮는 작은 입력칸(Finder rename UX). 신규 renameStore + InlineRenameInput, GridCanvas 컨테이너 position:relative. Enter/외부클릭=확정, Esc=취소, 휠 줌 시 즉시 확정. (1차 구현이 시설 아래 별도 박스로 떠서 핫픽스: 좌표를 포인터 앵커 환산 — pointer.x + (목표월드 − pointer.worldX)×zoom — 으로 교체, 스타일도 라벨 크기로 축소.)
- **#2 부수 — 단축키 오발동 수정(preventive)**: Phaser 키보드는 window 전역 청취라 입력창 타이핑 중 R/Delete/화살표/Cmd+D가 오발동하던 기존 버그를 isTypingInDOM() 가드로 전 핸들러 차단 (시설정보 이름 입력란에서도 동일하게 발생하던 문제).
- **#3 시설 그림자 제거**: v0.5.0 #14 SimCity풍 드롭 섀도 삭제 (베벨·외곽선·라벨 유지).
- **#4 시설정보 접이식 패널**: FacilityEditor에 ▴닫기/▾열기 토글(기본 열림, 엑셀 패널과 동일 패턴). flex:1+내부 스크롤 → 자연 높이로 전환해 하단 기능(90° 회전·색·삭제)이 우측 컬럼 스크롤로 항상 도달 가능.
- **#5 맵 전용 보기**: 헤더 ⛶ 토글 + 단축키 F — 좌(팔레트)/우(패널) 숨기고 캔버스 풀폭, 재클릭 복원. 세션 한정 비영속. GridCanvas ResizeObserver가 리사이즈 자동 대응.
- APP_VERSION·헤더 v0.5.0→v0.5.1. 보안(헌법 0조): 외부 전송 0줄 유지.
- 검증: @babel/parser 구문 14개 파일 OK + scale 마이그레이션 시뮬레이션 7/7 PASS. 풀빌드·동작 확인은 대통령 Mac(`npm run build`).
- ⚠️ **커밋 미실행**: simsteel `.git/index.lock` 스테일 락(2026-06-11 22:10, 0바이트) — 샌드박스 권한 없음. v0.4.0~v0.5.1 작업 전체가 미커밋 상태(HEAD=v0.3.2 시절). 대통령 터미널 조치 필요(아래 명령).

v0.5.0 완료 (2026-06-11) — 14건 일괄 UX 업그레이드 + SimCity 시각화 (대통령 일괄 기획안).
"100만 번 사용 가정 → 추가기능 추천 + 요청기능 최적화" 지시에 따라 14건 전부 한 번에 구현. AskUserQuestion 확정: 전부 동시 구현 / #5는 사각형+자동인식 둘 다 / #13은 Import-Export 패널·애니/2.5D 토글 둘 다 삭제 / #14는 SimCity 스타일. git push는 하지 않음(법률 #5 — 사용자 승인 대기).
- **#1 키보드 리사이즈**: 선택 시설을 방향키/단축키로 셀 단위 크기 조정.
- **#2 인-맵 이름 편집 + 라벨 확대**: 맵에서 직접 시설명 수정(window.prompt), 라벨 가독성 향상.
- **#3 프리셋 기본 크기 편집** (신규 src/state/defaultSizeStore.js): 팔레트 프리셋별 가로/세로 기본값을 사용자가 ✎로 덮어쓰기·↺ 초기화. localStorage 'simsteel:facility-default-overrides' 영속. FacilityPalette에 인라인 사이즈 에디터 + overridden 표시(*).
- **#4 격자 농도 독립 분리** (신규 src/state/gridStore.js + GridPanel.jsx): 격자 투명도를 배경 스토어에서 분리해 독립 슬라이더(0~100%). localStorage 'simsteel:grid-opacity' 영속. bgImageStore에서 gridOpacity 제거(중복 제거).
- **#5 이미지 추출 모드** (신규 src/state/extractStore.js + ExtractPanel.jsx): 참조 이미지 위에서 ① 사각형 드래그 → 그 크기로 커스텀 시설 생성, ② 자동 인식(flood-fill) → 클릭 지점과 같은 색 영역 자동 감지 후 시설 생성, ③ 부지 경계 자동 생성(최상단 이미지 내용 영역을 격자에 정렬). 픽셀 분석 전부 로컬 canvas, 외부 전송 0.
- **#6 레이아웃 비교 — 체크한 것만 표시**: ComparePanel 동작 정리.
- **#7 이미지 마우스 드래그 위치 이동**: ImageLayersPanel 카드별 "✋ 마우스로 이동" 토글 → 맵에서 직접 드래그. imageLayerStore activeMoveId 추가.
- **#8 레이아웃별 단일 색**: 고스트 비교 시 레이아웃마다 균일 색.
- **#9 엑셀 이름/가로/세로만**: 엑셀 일괄 입력 컬럼 단순화.
- **#10 비고 영역 확대** / **#11 면적 m² 표시** / **#12 레이아웃 삭제(x)**: 편집 UX 보강.
- **#13 군더더기 제거**: Import/Export 전용 패널 + 애니메이션/2.5D 토글 삭제(번들 백업이 export 역할 대체).
- **#14 SimCity 스타일 시각화**: GridScene 시각 강화.
- **번들 자동 포함**: projectBundle이 simsteel:* 전체를 스냅샷하므로 신규 키(grid-opacity / facility-default-overrides) export/import 자동 포함. applyProjectBundle에 useGridStore·useDefaultSizeStore 재수화 setState 추가(모듈 init 캐시를 import 값으로 즉시 갱신 — reload 없이 반영). APP_VERSION·App.jsx 헤더 v0.4.3→v0.5.0.
- 검증: @babel/parser 구문 검증 — projectBundle 포함 변경 파일 전부 OK. 풀 빌드(`npm run build`)는 사용자 Mac 필요(rollup/esbuild darwin 전용 바이너리 + 샌드박스 registry 차단으로 linux 바이너리 설치 불가 → 샌드박스 검증 한계는 babel 구문 검사).

v0.4.3 완료 (2026-06-11) — 이미지 레이어(다중) 토글 + 번들 포함 (feature 6).
- **다중 이미지 레이어**: 단일 배경 트레이싱(bgImageStore)과 별개로, 레이아웃별 참조 이미지를 여러 장 올려 체크박스로 켜고/끄며 겹쳐 비교.
  - 신규 src/state/imageLayerStore.js — localStorage 'simsteel:image-layers'에 영속 → **새 환경에서도 사라지지 않음**(기존 bgImageStore는 비영속이라 새 PC에서 소실되던 문제 해결). 각 레이어 {id,name,dataUrl,visible,opacity,scale,offsetX,offsetY}. add/remove/toggleVisible/setOpacity/setScale/setOffset/moveLayer.
  - 신규 src/phaser/ImageLayerRenderer.js — depth 0.6(배경 0.5 위·격자 1 아래), 비대화형. 레이어별 고유 texture key + version 카운터 + `textures.once('addtexture-'+key)` 후 addBase64(=_loadBgTexture 비동기 패턴 답습). 표시 변환은 배경과 동일(사이트 px×scale, offset).
  - 신규 src/components/ImageLayersPanel.jsx — 다중 업로드(+추가), 카드별 체크 토글·투명도/크기 슬라이더·위치(X/Y px) 입력·순서(▲▼)·삭제. App.jsx 우측 컬럼 배치, 헤더 v0.4.3.
  - GridScene 가산 배선: imageLayerStore 구독 + _imgLayerRend + _renderImageLayers(), 부지 크기 변경 시 재동기화, destroy 정리.
  - **번들 자동 포함**: projectBundle이 simsteel:* 전체를 스냅샷하므로 image-layers 키가 export/import에 자동 포함. applyProjectBundle에 imageLayerStore 재수화 추가(메모리 즉시 반영). 복원 토스트에 "이미지 N" 추가.
  - 보안(헌법 0조 부칙): File API→FileReader→base64→texture 경로만, 외부 전송 0줄. localStorage 용량 초과는 try/catch로 조용히 무시(메모리 유지).
- 검증: @babel/parser 구문 검증 15개 파일 OK + 로직 시뮬레이션 19/19 PASS(추가/토글/클램프/순서/제거 + transform 수식 + 번들 키 왕복). 풀빌드는 사용자 Mac `npm run build` 필요(rollup/esbuild darwin 전용 + registry 차단).

v0.4.2 완료 (2026-06-11) — 레이아웃 비교(읽기전용 고스트 오버레이) (feature 5).
- 신규 compareStore.js(GHOST_COLORS, ghostLayoutIds, toggleGhost/clearGhosts/setGhostOpacity/colorFor) — 세션 한정 비영속(의도적, 번들 제외).
- 신규 GhostRenderer.js(depth 8, 지형 위·시설 아래) — 저장 레이아웃을 색상별 반투명 채움+외곽선으로, 줌≥0.4에서 약어 라벨, hitTest 없음(읽기전용).
- 신규 ComparePanel.jsx — 레이아웃 체크 토글·색 스와치·투명도 슬라이더. GridScene에 compare/layout store 구독 가산.

v0.4.1 완료 (2026-06-11) — 엑셀(.xlsx) 일괄 시설 입력 (feature 1·4).
- 법률 #2 Pre-City Education 선행(SheetJS 함정 8건 → lessons-cities.md 기록).
- 신규 excelFacilities.js(CELL_METERS=5, parseFacilityRows: 분류/이름/가로(m)/세로(m)/약어/색상 → m÷5 셀 변환, 1~200 클램프) + ExcelImportPanel.jsx(lazy import('xlsx'), 템플릿 다운로드 + 업로드 파싱 → addCustomFacilities 일괄).
- facilitiesStore.addCustomFacilities(defs) — 1회 setState + 1회 localStorage 쓰기 배치. FacilityEditor 크기 상한 50→200.
- 파서 검증 6/6 PASS(음수 폭 거부 버그 수정: 정규식 strip → parseFloat 직접).

v0.4.0 완료 (2026-06-11) — 팔레트 분류 + 완전 프로젝트 백업/복원 + 시설 크기 정렬.
- **팔레트 분류 (feature 2)**: 커스텀 시설 생성 폼에 "분류" 드롭다운 추가. 기존 공정(고로/제강 등)의 추가 인스턴스(예: 고로2)는 해당 카테고리 아래 중첩 표시, 진짜 신규 유형만 "사용자 정의" 섹션에 표시.
  - facilitiesStore.addCustomFacility: categoryId 파라미터 추가(기본 'custom'), category 하드코딩 제거. 하위 호환(category 없음 → 'custom').
  - _placeFacility 풋프린트 해석은 UUID 기반이라 무영향 — 회귀 0.
- **완전 프로젝트 번들 (feature 3)**: "한 PC 작업이 다른 PC에서 리셋" 근본 해결. 상태가 흩어진 localStorage 키(custom-facilities/layouts/terrain) + 영속 안 되던 런타임(현재 보드 시설·부지 크기)을 단일 .json으로 export/import.
  - 신규 src/state/projectBundle.js (buildProjectBundle/applyProjectBundle/validateBundle/downloadProjectBundle) + 신규 ProjectBundlePanel.jsx, App.jsx 우측 컬럼에 배치.
  - 보안(헌법 0조 부칙): Blob 다운로드 + FileReader, 네트워크 전송 0줄. simsteel: 네임스페이스 키만 복원(오염 방지).
  - export→import 왕복 7개 검증 PASS(custom/layouts/terrain/런타임 시설/부지 크기/플래그 복원, 비-simsteel 키 제외).
- **시설 크기 편집 정렬 (feature 1)**: FacilityEditor 시설 크기 편집 상한 50→200셀로 상향(팔레트 커스텀 1~200과 일치, 대형 시설 제한 제거). 부지 크기는 기존 SiteSizePanel(100~10,000m) 유지.
- 검증: @babel/parser 구문 검증 6개 파일 OK(네이티브 rollup/esbuild는 darwin 전용 + npm registry 차단으로 풀빌드는 사용자 Mac에서 `npm run build` 필요).
- 잔여 단계: v0.4.1 엑셀(.xlsx) 일괄 입력(SheetJS Pre-City Education 선행), v0.4.2 레이어 비교(읽기전용 고스트), v0.4.3 이미지 레이어 토글+번들 포함.

v0.3.2 완료 (2026-06-03) — 펠릿 플랜트 활성화.
- GridScene 설비 데이터에 pellet_plant 추가(18×22, abbrev PP, confirmed:false 추정 스펙)
- facilityCategories pellet_plant enabled:true, 주석 정리
- 배치·export 왕복 정상(drift 0), 소결기 회귀 없음, 실측 스펙 확정 시 confirmed:true 전환 예정

v0.3.1 완료 (2026-06-03) — 가벼운 시각 애니메이션(배치 페이드인+선택 펄스, Tween).
- Phaser Tween 진행값을 render에 전달, onUpdate에서 재그리기 — Tween 종료 시 자동 정지(상시 매프레임 X)
- 페이드인 250ms(Quad.easeOut) / 선택 펄스 yoyo 무한(Sine.easeInOut), animEnabled 토글 ON/OFF
- hitTest·export 무회귀(시각만), 성능: 유휴 시 pulseTween=null + facAnim={} 확인

v0.3.0 완료 (2026-06-03) — 의사 2.5D 뷰 (직교 유지 + 높이감, 토글).
- FacilityRenderer에 view2_5d 분기: 윗면+정면 높이 블록, row+col 기준 그리기 정렬
- hitTest는 바닥면 기준 유지 → 클릭 판정 무회귀(시각만 입체), 브라우저 검증 ✅
- 평면/2.5D 토글 버튼(FacilityPalette 헤더), export 비포함(뷰 설정)
- 진짜 아이소메트릭(좌표계 교체)이 아닌 의사 2.5D — 회귀 위험 0 경로 선택

v0.2.x 마감 (2026-06-03) — 배경 트레이싱 완성 + 전체 라운드트립 회귀 검증.
- 시설 5개(경계·구석 포함) + 배경 동시 상태에서 export→import→재export 2회 왕복 밀림 0 확인
- 배경 이미지는 export JSON 비포함 (참고용 오버레이, 헌법 0조 정합 — 코드로 확인)
- App.jsx 헤더 버전 v0.2.8.7 → v0.2.8.9.2 정합성 정리
- 배경 트레이싱(오버레이·투명도·scale·offset·드래그 핸들·UI) 기능 단위 종료, 다음은 v0.3.x

v0.2.8.9.2 완료 (2026-06-03) — 배경 트레이싱 scale/offset UI 마감.
- BgImagePanel에 크기 슬라이더(10~300%) + 위치·크기 초기화 버튼 추가
- store 단일 출처로 드래그·슬라이더 자동 동기화 (setBgScale(2.0) → 슬라이더 200% 반영)
- 배경 트레이싱 기능 완성 (오버레이·투명도·scale·offset·드래그 핸들 전부 UI 제공)
- bg 코드 기인 pageerror 0건 유지

v0.2.8.9.1 hotfix (2026-06-03) — 배경 트레이싱 잔여 null 에러 정리.
- _getBgHandleCenters null 가드 (centers null 시 return) + _loadBgTexture destroy 순서 수정(참조 먼저 null)
- bg 코드 기인 pageerror 0건 확인 (잔류 1건은 Phaser headless WebGL 초기화 에러 — bg 코드와 무관)

v0.2.8.9 완료 (2026-06-03) — 배경 트레이싱 핸들 인터랙션(scale/offset 드래그).
- 배경 클릭 → _bgSelected=true, 4코너 청록 핸들 + 아웃라인 표시
- 코너 핸들 드래그 → bgScale 갱신 (대각 거리 비율, 0.1~5.0 클램프)
- 본체 드래그 → bgOffsetX/Y 갱신 (월드 좌표 델타)
- _removeBgImage null 참조 수정 (참조 먼저 null, setVisible(false) 후 destroy)
- 시설 우선순위 유지 (hitTest 순서: 시설 → 지형 → 배경)
- 브라우저 검증: body drag offset 50,50 ✅ / scale 1→2 ✅ / clearBgImage 에러 0건 ✅

v0.2.8.8 완료 (2026-06-03) — 배경 트레이싱 scale/offset 상태 + _applyBgTransform 통합.
- bgScale, bgOffsetX, bgOffsetY 필드·setter 추가 (clearBgImage 리셋 포함)
- _applyBgTransform() 헬퍼 — 사이트 크기×bgScale + offset 반영, setDisplaySize 중복 제거
- store 구독부에 scale/offset 변화 시 _applyBgTransform 호출 분기 추가
- 브라우저 검증: setBgScale(1.5) → 1.5× 확대 ✅ / setBgOffset(50,50) → 이동 ✅ / clearBgImage → 전체 리셋 ✅

v0.2.8.7 완료 (2026-06-03) — 배경 트레이싱 (이미지 오버레이 + 투명도 조절).
- 로컬 파일 선택 UI (File API → FileReader → base64 → Phaser texture, 외부 전송 0)
- 배경 이미지 depth 0.5 (siteFill(0) 위, grid(1) 아래) — 월드 좌표 배치
- 이미지 투명도 슬라이더 + 격자 투명도 슬라이더 (배경이 잘 보이도록)
- 교체/제거 버튼
- 브라우저 검증: 배경 표시 ✅ / 격자 투명도 조절 ✅ / 시설 배치 회귀 ✅ / PNG export 143KB ✅
- 줌 정렬: world 좌표계 동일 경로 구조 보장 (headless wheel 미도달)

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

### 🎯 다음 큰 방향: v0.4 Supabase + Auth (멀티유저 완성)

**방향 재정렬 (2026-06-03)**: 오늘 한 v0.3.x(배경 트레이싱·2.5D·애니메이션)는
README 로드맵의 v0.3(사용자 벤치마크 입력)이 아니라 시각화 강화였음.
큰 방향(제대로 된 멀티유저 도구)으로 복귀 — 다음은 v0.4 Supabase + Auth.

**v0.4 목표**:
- 현재 localStorage 기반 저장(Layer 3)을 Supabase로 이전
- 사용자별 데이터 격리 (Layer 2 벤치마크 / Layer 3 현재 프로젝트)
- 로그인(Supabase Auth) — "로그인 보안 + 멀티유저"의 정석 경로
- 완성 후 Vercel 배포 (지금 localStorage 상태 임시배포는 보류)

**v0.4 착공 시 주의 (반드시)**:
- 법률 #2 교육 의식 필수 — Supabase 새 스택 도입 → 도메인 식별 + 함정 리스트부터
- CLAUDE.md 위험작업 3종 본인 승인 필수: DB 스키마/마이그레이션, 배포 설정, 비밀값 접근
- 헌법 0조 부칙: Layer 2/3는 Supabase에만 격리 저장, 외부 AI 전송 금지
- 비밀값(SUPABASE_URL / ANON_KEY)은 .env.local로만 관리 — 평문·커밋 금지

**v0.4는 여러 세션 단계** — 맑은 머리에서 교육 의식부터 시작할 것.

1. v0.3.2: AI 픽셀 아트 스프라이트 또는 연기·컨베이어 애니메이션 (사용자 결정)

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
