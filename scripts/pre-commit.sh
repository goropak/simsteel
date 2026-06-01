#!/usr/bin/env bash
# pre-commit.sh — 비밀값 차단 hook (헌법 제0조 봉인)
#
# 설치 방법 (각 레포 루트에서):
#   cp scripts/pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -euo pipefail

STAGED=$(git diff --cached --name-only 2>/dev/null || true)

if [ -z "$STAGED" ]; then
  exit 0
fi

FOUND=0
MESSAGES=""

mask_value() {
  local val="$1"
  local visible=4
  local len=${#val}
  if [ "$len" -le "$visible" ]; then
    echo "${val}****"
  else
    echo "${val:0:$visible}$(printf '*%.0s' $(seq 1 $((len - visible))))"
  fi
}

check_diff() {
  local file="$1"
  local diff_content
  diff_content=$(git diff --cached -- "$file" 2>/dev/null || true)
  [ -z "$diff_content" ] && return

  local linenum=0
  while IFS= read -r line; do
    linenum=$((linenum + 1))

    [[ "$line" =~ ^[^+] ]] && continue
    line="${line:1}"

    local val=""
    local reason=""

    # ── 통과 조건 (플레이스홀더) ──────────────────────────────────────────
    if echo "$line" | grep -qiE \
      '(your[_-]?api[_-]?key[_-]?here|placeholder|changeme|dummy|example|xxx+|\$\{[^}]+\}|process\.env\.|os\.environ)'; then
      continue
    fi

    # ── .env 류 파일 자체가 스테이징된 경우 ──────────────────────────────
    if echo "$file" | grep -qE '(^|/)\.env(\.(local|development|production|test))?$'; then
      reason=".env 파일 직접 커밋"
      val="$file"
    fi

    # ── PEM 블록 ──────────────────────────────────────────────────────────
    if [ -z "$reason" ] && echo "$line" | grep -qE -- '-----BEGIN .*(PRIVATE KEY|CERTIFICATE)-----'; then
      reason="PEM 블록 (개인키/인증서)"
      val=$(echo "$line" | grep -oE '-----BEGIN[^-]+-----' | head -1)
    fi

    # ── sk- 형태 (OpenAI/Anthropic) ───────────────────────────────────────
    if [ -z "$reason" ] && echo "$line" | grep -qE 'sk-[A-Za-z0-9_-]{20,}'; then
      reason="API 키 형태 (sk-...)"
      val=$(echo "$line" | grep -oE 'sk-[A-Za-z0-9_-]{20,}' | head -1)
    fi

    # ── GitHub 토큰 ───────────────────────────────────────────────────────
    if [ -z "$reason" ] && echo "$line" | grep -qE '(ghp_|gho_|github_pat_)[A-Za-z0-9_]{10,}'; then
      reason="GitHub 토큰"
      val=$(echo "$line" | grep -oE '(ghp_|gho_|github_pat_)[A-Za-z0-9_]{10,}' | head -1)
    fi

    # ── AWS Access Key ────────────────────────────────────────────────────
    if [ -z "$reason" ] && echo "$line" | grep -qE 'AKIA[A-Z0-9]{16}'; then
      reason="AWS Access Key"
      val=$(echo "$line" | grep -oE 'AKIA[A-Z0-9]{16}' | head -1)
    fi

    # ── Google API Key ────────────────────────────────────────────────────
    if [ -z "$reason" ] && echo "$line" | grep -qE 'AIza[A-Za-z0-9_-]{35}'; then
      reason="Google API Key"
      val=$(echo "$line" | grep -oE 'AIza[A-Za-z0-9_-]{35}' | head -1)
    fi

    # ── Slack 토큰 ────────────────────────────────────────────────────────
    if [ -z "$reason" ] && echo "$line" | grep -qE 'xox[baprs]-[A-Za-z0-9_-]{10,}'; then
      reason="Slack 토큰"
      val=$(echo "$line" | grep -oE 'xox[baprs]-[A-Za-z0-9_-]{10,}' | head -1)
    fi

    # ── JWT (eyJ...) ──────────────────────────────────────────────────────
    if [ -z "$reason" ] && echo "$line" | grep -qE 'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}'; then
      reason="JWT 형태"
      val=$(echo "$line" | grep -oE 'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}' | head -1)
    fi

    # ── 할당 형태 비밀값 (key=값, token:"값" 등) ─────────────────────────
    if [ -z "$reason" ] && echo "$line" | grep -qiE \
      '(api[_-]?key|secret|token|password|passwd|pwd|private[_-]?key|access[_-]?key)\s*[=:]\s*["'"'"'][^"'"'"']{8,}["'"'"']'; then
      # 플레이스홀더 재확인
      local extracted
      extracted=$(echo "$line" | grep -oiE \
        '(api[_-]?key|secret|token|password|passwd|pwd|private[_-]?key|access[_-]?key)\s*[=:]\s*["'"'"'][^"'"'"']{8,}["'"'"']' \
        | head -1)
      if ! echo "$extracted" | grep -qiE \
        '(your[_-]?api[_-]?key|placeholder|changeme|dummy|example|xxx|changeme|\*{3,})'; then
        reason="비밀값 할당 형태"
        val="$extracted"
      fi
    fi

    # ── DB 연결 문자열 (자격증명 포함) ───────────────────────────────────
    if [ -z "$reason" ] && echo "$line" | grep -qE \
      '(postgres|mysql|mongodb\+srv)://[^@]+:[^@]+@'; then
      reason="DB 연결 문자열 (자격증명 포함)"
      val=$(echo "$line" | grep -oE \
        '(postgres|mysql|mongodb\+srv)://[^@]+:[^@]+@[^ "'"'"']+' | head -1)
    fi

    # ── .env.example / .env.template → 통과 ─────────────────────────────
    if echo "$file" | grep -qE '\.env\.(example|template|sample)$'; then
      continue
    fi

    if [ -n "$reason" ]; then
      FOUND=1
      local masked
      masked=$(mask_value "$val")
      MESSAGES="${MESSAGES}
  파일: ${file} (diff line ${linenum})
  의심: ${reason} (${masked})"
    fi

  done <<< "$diff_content"
}

for f in $STAGED; do
  check_diff "$f"
done

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "🚫 커밋 차단됨 — 헌법 제0조 (비밀값 보호)"
  echo "${MESSAGES}"
  echo ""
  echo "비밀값은 평문으로 커밋할 수 없습니다."
  echo "→ 환경변수로 옮기거나, INFRA.md에 '위치'만 기록하세요."
  echo ""
  echo "이것이 오탐(실제 비밀값 아님)이라면:"
  echo "  git commit --no-verify"
  echo "  (단, 이 우회는 신중히. 사용자 본인만 사용)"
  echo ""
  exit 1
fi

exit 0
