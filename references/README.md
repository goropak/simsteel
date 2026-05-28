# 참조 자료 시스템

simsteel 도시에서 사용하는 외부 참조 자료 관리 폴더.

---

## 자료 분류

### 기술경제성 타당성 보고서 (TEFR)

| 자료 | 작성자 | 연도 | 메타파일 | PDF |
|---|---|---|---|---|
| JSW Utkal TEFR | M.N. Dastur & Co. | 2021 | [메타파일](./jsw-utkal-tefr-2021.md) | [PDF](./pdfs/jsw-utkal-tefr-2021.pdf) |

### 환경 인허가 (Environmental Clearance)

| 자료 | 기관 | 연도 | 메타파일 | PDF |
|---|---|---|---|---|
| JSW Utkal EC Revalidation | MoEFCC | 2023 | [메타파일](./jsw-utkal-ec-2023.md) | [PDF](./pdfs/jsw-utkal-ec-2023.pdf) |

### 건강·환경 영향 평가

| 자료 | 작성자 | 연도 | 메타파일 | PDF |
|---|---|---|---|---|
| JSW Utkal 건강영향평가 | CREA | 2022 | [메타파일](./jsw-utkal-health-2022.md) | [PDF](./pdfs/jsw-utkal-health-2022.pdf) |

---

## PDF 다운로드 상태

| 파일 | 상태 |
|---|---|
| jsw-utkal-tefr-2021.pdf | ⚠️ 수동 다운로드 필요 |
| jsw-utkal-ec-2023.pdf | ⚠️ 수동 다운로드 필요 |
| jsw-utkal-health-2022.pdf | ⚠️ 수동 다운로드 필요 |

각 메타파일의 "수동 다운로드 방법" 섹션 참고.

---

## 사용 원칙

1. **메타파일 먼저, PDF 후**: 새 자료 추가 시 메타파일(.md)을 먼저 작성하고, PDF를 `pdfs/`에 추가한다.
2. **출처 명시 필수**: `data/facility-presets.json`에 데이터 입력 시 반드시 `source` 필드에 자료명 기재.
3. **교차 검증**: TEFR 수치는 EC 또는 독립 평가서와 교차 확인 후 사용 권장.
4. **메타파일 갱신**: PDF를 실제로 읽고 새 정보를 파악하면 해당 메타파일의 "활용 가능 정보" 섹션을 업데이트한다.

## 보안 주의 ⚠️

- **공개 자료만**: 이 폴더는 공개 URL에서 취득 가능한 자료만 저장한다.
- **내부 자료 금지**: 회사 내부 보고서, 비공개 설계 도면, 개인 정보가 포함된 자료는 절대 이 폴더에 두지 않는다.
- **git 업로드 주의**: `pdfs/` 폴더의 PDF가 공개 레포에 올라가도 문제없는 자료인지 확인 후 commit.
