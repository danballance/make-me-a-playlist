#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
PYTHON_PKG="./api"

PYLINT_THRESHOLD=7.0
RADON_MIN_GRADE="B"       # A, B, or C — files scoring below this are flagged

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

header() { printf "\n${BOLD}${CYAN}═══ %s ═══${RESET}\n\n" "$1"; }
pass()   { printf "${GREEN}✔ %s${RESET}\n" "$1"; }
warn()   { printf "${YELLOW}⚠ %s${RESET}\n" "$1"; }
fail()   { printf "${RED}✘ %s${RESET}\n" "$1"; }

# ── Run from script directory ────────────────────────────────────────────────
cd "$(dirname "$0")"

exit_code=0

# ── 1. Pylint ────────────────────────────────────────────────────────────────
header "Pylint · ${PYTHON_PKG}"

pylint_output=$(uv run pylint "${PYTHON_PKG}" \
    --output-format=text \
    --score=y \
    2>&1) || true

echo "$pylint_output"

pylint_score=$(
    echo "$pylint_output" \
    | grep -oP 'rated at \K[-0-9.]+' \
    | tail -1
)

if [[ -n "$pylint_score" ]]; then
    passed=$(awk "BEGIN { print ($pylint_score >= $PYLINT_THRESHOLD) }")
    if [[ "$passed" -eq 1 ]]; then
        pass "Pylint score: ${pylint_score}/10  (threshold: ${PYLINT_THRESHOLD})"
    else
        fail "Pylint score: ${pylint_score}/10  (threshold: ${PYLINT_THRESHOLD})"
        exit_code=1
    fi
else
    warn "Could not parse Pylint score"
fi

# ── 2. Radon Maintainability Index ──────────────────────────────────────────
header "Radon MI · ${PYTHON_PKG}"

radon_output=$(uv run radon mi "${PYTHON_PKG}" -s 2>&1)
echo "$radon_output"

# Count files below the minimum acceptable grade
grade_order="A B C"
below_threshold=0
total_files=0

while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    grade=$(echo "$line" | grep -oP '\b[A-C]\s*\(' | head -1 | tr -d ' (') || true
    [[ -z "$grade" ]] && continue

    total_files=$((total_files + 1))

    grade_ok=false
    for g in $grade_order; do
        [[ "$g" == "$grade" ]] && grade_ok=true
        [[ "$g" == "$RADON_MIN_GRADE" ]] && break
    done

    if ! $grade_ok; then
        below_threshold=$((below_threshold + 1))
    fi
done <<< "$radon_output"

if [[ "$below_threshold" -eq 0 ]]; then
    pass "All ${total_files} files scored ${RADON_MIN_GRADE} or better"
else
    fail "${below_threshold}/${total_files} files scored below ${RADON_MIN_GRADE}"
    exit_code=1
fi

# Project-wide average MI (numeric)
avg_mi=$(
    echo "$radon_output" \
    | grep -oP '\([\d.]+\)' \
    | tr -d '()' \
    | awk '{ sum += $1; n++ } END { if (n) printf "%.1f", sum/n }'
)
[[ -n "$avg_mi" ]] && echo -e "\n  Average MI: ${BOLD}${avg_mi}/100${RESET}"

# ── 3. Radon Cyclomatic Complexity (bonus context) ──────────────────────────
header "Radon CC · ${PYTHON_PKG} (average)"

uv run radon cc "${PYTHON_PKG}" -a -nc 2>&1

# ── Summary ──────────────────────────────────────────────────────────────────
header "Summary"

printf "  %-25s %s\n" "Pylint score:"     "${pylint_score:-?}/10"
printf "  %-25s %s\n" "Radon avg MI:"      "${avg_mi:-?}/100"
printf "  %-25s %s\n" "Radon files < ${RADON_MIN_GRADE}:"  "${below_threshold}"

echo ""
if [[ "$exit_code" -eq 0 ]]; then
    pass "All quality gates passed"
else
    fail "One or more quality gates failed"
fi

exit "$exit_code"
