# JSW Utkal Steel — TEFR (Techno-Economic Feasibility Report) 2021

## 기본 정보

- 작성: M.N. Dastur & Company (P) Ltd.
- 작성일: 2021년 (환경부 제출일: 2021-08-29 추정)
- 발주/대상: JSW Utkal Steel Limited, Odisha
- 분량: 약 수백 페이지 (환경영향평가 첨부 TEFR)

## 출처

- 공식 URL: https://environmentclearance.nic.in/writereaddata/online/EC/290820211p0v0e0jzql25210445TEFR.pdf
- 로컬 경로: ./pdfs/jsw-utkal-tefr-2021.pdf
- 다운로드 상태: **실패** — 사용자 수동 다운로드 필요 (프록시 차단)
- 다운로드일: —

## 수동 다운로드 방법

```bash
curl -L -o ~/projects/simsteel/references/pdfs/jsw-utkal-tefr-2021.pdf \
  "https://environmentclearance.nic.in/writereaddata/online/EC/290820211p0v0e0jzql25210445TEFR.pdf"
```

또는 브라우저에서 위 URL 직접 접속 후 저장.

## 프로젝트/문서 개요

JSW Utkal Steel Limited의 Odisha 주 통합 제철소(13.6 MTPA) 건설을 위한 기술경제성 타당성 보고서.
M.N. Dastur & Company가 작성하였으며, 인도 환경부(MoEFCC) 환경영향평가(EC) 신청 첨부 자료로 제출됨.

## 활용 가능 정보

- **설비 사양**: 각 단위 설비의 용량, 규모, 설비 수
- **부지 레이아웃**: 전체 부지 면적, Phase별 영역, 설비 배치 원칙
- **생산 흐름**: 원료(펠릿/소결) → 코크스 → 고로 → 전로 → 압연 전 공정
- **유틸리티**: 자가발전(CPP), 용수 처리, 압축공기 등
- **Table 1**: 주요 설비 목록 (capacity, 개수)
- **5장**: 부지 계획 및 레이아웃

## 이 도시(simsteel)에서의 활용

- `data/facility-presets.json`의 Layer 1 데이터 출처 (source: "TEFR (DASTUR 2021)")
- 각 설비의 `footprint_cells` 플레이스홀더 정밀화 참고
- Phase별 영역 설정 기준

## 태그

`#tefr` `#dastur` `#jsw-utkal` `#layout` `#capacity` `#facility-list`
