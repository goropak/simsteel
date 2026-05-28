# simsteel 참조 자료

이 도시의 모든 외부 참조 자료. 제철소 부지 레이아웃 검토에 활용.

---

## 분류 (Tier)

### 🥇 Tier 1 — 최우선 (JSW Utkal 직접 자료)

본인 프로젝트와 가장 유사한 그린필드 통합 제철소 자료. 우선 참조.

| 자료 | 작성 | 연도 | 파일 | 크기 |
|---|---|---|---|---|
| [JSW Utkal TEFR](./jsw-utkal-tefr-2021.md) ⭐ 핵심 | DASTUR | 2021 | [PDF](./pdfs/jsw-utkal-tefr-2021.pdf) | 7.0 MB |
| [JSW Utkal Pre-Feasibility Report](./jsw-utkal-pfr-2018.md) | DASTUR (추정) | 2018 | [PDF](./pdfs/jsw-utkal-pfr-2018.pdf) | 121 KB |
| [JSW Utkal Captive Jetty EIA](./jsw-utkal-jetty-eia-2021.md) | JSW Utkal | 2021 | [PDF](./pdfs/jsw-utkal-jetty-eia-2021.pdf) | 15 MB |

### 🥈 Tier 2 — 비교 케이스 (JSW 다른 프로젝트)

| 자료 | 작성 | 연도 | 파일 | 크기 |
|---|---|---|---|---|
| [JSW Dolvi 5→10 MTPA Expansion](./jsw-dolvi-expansion-2018.md) | JSW Steel | 2018 | [PDF](./pdfs/jsw-dolvi-expansion-2018.pdf) | 19 MB |
| [JSW Vijayanagar NEXI Review](./jsw-vijayanagar-nexi-2019.md) | NEXI | 2019 | [PDF](./pdfs/jsw-vijayanagar-nexi-2019.pdf) | 3.6 MB |

### 🥉 Tier 3 — 환경/보건 보조

| 자료 | 작성 | 연도 | 파일 | 크기 |
|---|---|---|---|---|
| [JSW Utkal Health Impact](./jsw-utkal-health-2022.md) | CREA | 2022 | [PDF](./pdfs/jsw-utkal-health-2022.pdf) | 837 KB |

### 🗂️ 미확보 (URL만 보관)

| 자료 | 사유 | 메타파일 |
|---|---|---|
| JSW Utkal EC Revalidation 2023 | 회사 서버 접근 제한 | [메타파일](./jsw-utkal-ec-2023.md) |

---

## 활용 가이드

| 검토 목적 | 권장 자료 |
|---|---|
| 전체 설비 사양·용량 | jsw-utkal-tefr-2021 ⭐ |
| Phase 초기 계획·항만 포함 | jsw-utkal-pfr-2018 |
| 항만 연계 설계 | jsw-utkal-jetty-eia-2021 |
| 브라운필드 Phase 확장 전략 | jsw-dolvi-expansion-2018 |
| 내륙 대규모 / 영문 자료 | jsw-vijayanagar-nexi-2019 |
| 환경·보건 영향 | jsw-utkal-health-2022 |

---

## 사용 원칙

1. **메타파일 먼저, PDF 후**: 새 자료 추가 시 메타파일(.md) 먼저 작성, PDF는 `pdfs/`에 저장
2. **출처 명시 필수**: `data/facility-presets.json`에 입력 시 `source` 필드에 자료명 기재
3. **외부 PDF 자동 다운로드 제한**: 정부·NGO 사이트는 가능, 회사 서버·Scribd는 사용자 수동 다운로드 필요
4. **메타파일 갱신**: PDF 실독 후 "활용 가능 정보" 섹션 업데이트

## 보안 주의 ⚠️

- **공개 자료만**: 공개 URL에서 취득 가능한 자료만 저장
- **내부 자료 절대 금지**: 회사 내부 보고서, 비공개 설계 도면, 개인 정보 포함 자료는 이 폴더에 두지 않는다
- **git 업로드 전 확인**: PDF가 공개 레포에 올라가도 문제없는 자료인지 확인 후 commit

## 통계

- PDF 보유: **6개** (총 약 45.5 MB)
- 메타파일: **7개** (보유 6 + 미확보 1)
- 마지막 동기화: 2026-05-28
