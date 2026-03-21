#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ────────────────────────────────────────────────────────────
FTA_SCORE_LIMIT=60        # files scoring above this are flagged

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

# ── FTA · TypeScript ─────────────────────────────────────────────────────────
header "FTA · TypeScript"

fta_output=$(npx --yes fta-cli . 2>&1)
echo "$fta_output"

flagged=$(
    echo "$fta_output" \
    | awk -v limit="$FTA_SCORE_LIMIT" '
        /^[│|]/ {
            # Try to grab the FTA Score column (3rd numeric-ish column)
            for (i = 1; i <= NF; i++) {
                if ($i ~ /^[0-9]+\.[0-9]+$/) {
                    score = $i
                }
            }
            if (score+0 > limit+0) count++
        }
        END { print count+0 }
    '
)

if [[ "$flagged" -eq 0 ]]; then
    pass "No files exceed FTA score limit of ${FTA_SCORE_LIMIT}"
else
    warn "${flagged} file(s) exceed FTA score limit of ${FTA_SCORE_LIMIT}"
    exit_code=1
fi

# ── Summary ──────────────────────────────────────────────────────────────────
header "Summary"

printf "  %-25s %s\n" "FTA files > ${FTA_SCORE_LIMIT}:"  "${flagged}"

echo ""
if [[ "$exit_code" -eq 0 ]]; then
    pass "All quality gates passed"
else
    fail "One or more quality gates failed"
fi

exit "$exit_code"
