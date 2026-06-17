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

## 서버 저장 (v0.5.2~)

| 항목 | 내용 |
|---|---|
| 인증 | Supabase Auth (email/password). "아이디"는 `아이디@simsteel.app` 합성 이메일로 매핑. 이메일 확인 OFF 필요. |
| DB | `public.projects` — 사용자당 1 row (`user_id` PK, `bundle` jsonb, `updated_at`). RLS로 본인 row만. |
| 이미지 | Storage 버킷 `project-images/{userId}/{layerId}.png`. DB엔 storagePath만(base64 미저장). |
| 동기화 | 로그인 시 pull → 보드 변경 1.5s 디바운스 자동저장 + 수동 "서버에 저장" 버튼. |
| 폴백 | env 없으면 client=null → 로컬 전용 모드(기존 localStorage). graceful degradation. |
| 스키마 | `supabase/schema.sql` (대시보드 SQL Editor 1회 실행) |

## 비밀값 보관 위치

- Supabase URL / anon key: 로컬 `.env.local` + Vercel 환경변수 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
  - ⚠️ Vite는 `VITE_` 프리픽스만 노출. (구 메모의 `NEXT_PUBLIC_`은 Next 전용 — 폐기)
  - anon key는 공개 키(클라이언트 노출 전제) — 값은 이 파일에 적지 않되 위치만 기록(0조).
- Supabase service role key: 프론트에서 사용 안 함. 필요 시 서버사이드 전용, 절대 커밋 금지.
- `.env*`는 .gitignore 처리됨. `.env.example`만 커밋(값 없음).

## 도메인

- 미정 (v0.2 배포 시 확정)
