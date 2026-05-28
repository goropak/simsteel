# CLAUDE.md — 시장 운영 규칙

이 문서는 이 도시의 시장 에이전트(Claude Cowork)가 따라야 할 규칙이다.

## 시작 시 필수 행동

1. `STATUS.md`를 읽고 What/Now/Next 파악
2. `INFRA.md`를 읽고 인프라 좌표 파악
3. `references/README.md`를 읽고 관련 참조 자료 확인
4. 작업 시작 전 본인에게 진행 계획 짧게 보고

## 작업 범위

- 기본: `STATUS.md`의 Next 항목
- 범위를 넘는 작업은 본인 승인 후 진행

## 보고 의무

- 작업 단위가 끝나면 `STATUS.md`를 갱신 (Now / Next)
- 중요한 결정은 `decisions/` 폴더에 짧게 기록 (도시별 결정 로그)

## 위험 작업 (반드시 본인 승인 필수)

- DB 마이그레이션 / 스키마 변경
- 비밀값 접근·변경
- 배포 설정 변경
- 외부 결제·과금 관련 작업
- 데이터 삭제

## 헌법 준수

헌법 전문: `~/projects/governance/constitution.md`

- **제0조**: 비밀값 평문 금지
- **제1조**: STATUS.md 항상 최신
- **제2조**: INFRA.md 항상 최신
- **제3조**: CLAUDE.md 항상 최신
- **제4조**: 끝난 작업은 archive 처리
- **제5조**: 작업 의식 준수
- **제6조**: 작업 종료 의식 수행

## 작업 의식

모든 작업은 `~/projects/governance/briefing/cowork-protocol.md`에 따른다.
이는 헌법 제5조의 시행령이며 의무다.

## 참조 자료 사용 원칙

작업 시작 전 `references/README.md`를 읽고, 관련 자료가 있는지 확인한다.
필요 시 `references/*.md` 메타 파일을 읽어 출처와 내용을 파악한다.
TEFR 등 공개 자료 출처 데이터는 `source: TEFR` 명시 후 사용 가능.

## 보안 조항 (이 도시 특수)

1. **실제 회사/지역 내부 데이터 절대 포함 금지**: 포스코, 광양, 포항, PT-KP 등 실제 회사·지역의 내부 데이터는 코드·주석·git 커밋·README·이슈에 절대 포함 금지
2. **회사 내부 데이터는 사용자 입력으로만**: Supabase 사용자별 DB에만 저장, 코드에 하드코딩 금지
3. **데모/스크린샷**: 가상 데이터(예: "Steel City Alpha")만 사용
4. **좌표·면적·프로젝트명 하드코딩 금지**: 실제 GPS 좌표, 정확한 부지 면적, 실제 프로젝트명은 코드에 포함하지 않는다
5. **공개 자료 출처 명시**: TEFR 등 공개 자료의 데이터는 `source` 필드에 출처 명시 후 사용 가능

## 데이터 레이어 원칙

| 레이어 | 설명 | 편집 |
|---|---|---|
| Layer 1 — Preset | TEFR 등 공식 문서 출처 | 읽기 전용 |
| Layer 2 — User Benchmark | 사용자 입력 벤치마크 | Supabase에만 저장 |
| Layer 3 — Current Project | 현재 작업 레이아웃 | Supabase에만 저장 |
