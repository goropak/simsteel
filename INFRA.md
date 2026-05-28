# INFRA — simsteel

## 격자 사양

- 단위: 5m × 5m / 셀
- Phase 1 영역: 400 × 400 셀 (≈ 2,000m × 2,000m = 4 km²)
- 렌더링: Canvas 기반 (Phaser.js)

## 기술 스택

| 계층 | 기술 |
|---|---|
| UI 프레임워크 | React |
| 게임 엔진 (격자/렌더링) | Phaser.js |
| 백엔드 / DB | Supabase (v0.4~) |
| 배포 | Vercel |
| 인증 | Supabase Auth (v0.4~) |

## 데이터 레이어

| 레이어 | 설명 | 저장 위치 | 편집 |
|---|---|---|---|
| Layer 1 — Preset | TEFR 등 공식 문서 출처 기본값 | `data/facility-presets.json` | 읽기 전용 |
| Layer 2 — User Benchmark | 사용자 입력 벤치마크 | Supabase (사용자별 DB) | 편집 가능 |
| Layer 3 — Current Project | 현재 작업 중인 레이아웃 | Supabase (프로젝트별) | 편집 가능 |

## 외부 서비스

| 서비스 | 용도 | 상태 |
|---|---|---|
| Vercel | 프론트엔드 배포 | 수동 import 예정 (v0.2~) |
| Supabase | DB + Auth + Storage | 프로젝트 생성 예정 (v0.4~) |

## 비밀값 보관 위치

- Supabase URL / anon key: Vercel 환경변수 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Supabase service role key: Vercel 환경변수 (`SUPABASE_SERVICE_ROLE_KEY`) — 서버사이드 전용
- 값 자체는 이 파일에 기록하지 않는다 (헌법 제0조)

## 도메인

- 미정 (v0.2 배포 시 확정)
