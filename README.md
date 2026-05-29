# simsteel

제철소 부지 레이아웃 시각화 도구.

SimCity 스타일의 5m 격자 기반 캔버스에 고로, 소결, 압연 등 단위 설비를 배치하고, Phase별 영역을 관리합니다.
공개 문서(TEFR) 기반 기본 프리셋과 사용자 입력 벤치마크를 레이어로 분리하여 실용적이고 유연한 레이아웃 시뮬레이션을 지원합니다.

## 기술 스택

| 계층 | 기술 |
|---|---|
| UI | React |
| 격자/렌더링 | Phaser.js |
| 백엔드 / DB | Supabase |
| 배포 | Vercel |

## 로드맵

| 버전 | 내용 | 상태 |
|---|---|---|
| v0.1 | 프로젝트 골격, references 시스템, facility-presets 초안 | ✅ 완료 |
| v0.2 | Phaser.js UI 프로토타입, 5m 격자 렌더링 | 🔜 예정 |
| v0.3 | 사용자 벤치마크 입력 UI | 예정 |
| v0.4 | Supabase 연동, 레이아웃 저장/불러오기 | 예정 |
| v0.5 | 협업 기능 | 예정 |

## 개발 환경 (v0.2.1+)

- Node.js 18+
- React + Vite + Phaser.js

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

환경변수 설정 (v0.4 Supabase 연동 시, `.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 현재 단계 (v0.2.2)

- ✅ 5m 격자 렌더링 (Phase 1: 400×400 셀, 2km × 2km)
- ✅ 줌/팬 (마우스 휠 + 좌클릭 드래그)
- ✅ 하단 좌표 표시 (m 단위, 셀 번호, 줌 레벨)
- ✅ 좌측 시설 팔레트 (카테고리 트리, 고로 1종 활성화)
- ✅ 클릭으로 시설 배치 (배치 모드 / ESC 해제)
- ✅ 시설 선택·편집 (이름/크기/용량/색상/비고)
- ✅ 우클릭으로 시설 삭제
- ⏳ 30종 시설 일괄 추가 → v0.2.3
- ⏳ 시설 회전·복제 → v0.2.3
- ⏳ 지형/Phase 영역 표시 → v0.2.4

## 데이터 소스

- **Layer 1 (Preset)**: 공개 문서(TEFR, EC 등) 기반 기본값 — `data/facility-presets.json`
- **Layer 2 (User Benchmark)**: 사용자 입력 벤치마크 — Supabase (로컬 비저장)
- **Layer 3 (Current Project)**: 현재 작업 레이아웃 — Supabase

## 라이선스

MIT
