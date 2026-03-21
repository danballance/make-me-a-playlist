#!/usr/bin/env bash
set -euo pipefail

# Usage: lint-py.sh <tier> [directory]
# Tiers: fix, format, fast, full, strict
TIER="${1:-fast}"
DIR="${2:-./backend}"
FAILED=0

run_check() {
  local name="$1"
  shift
  if OUTPUT=$("$@" 2>&1); then
    echo "OK   $name"
  else
    echo "FAIL $name"
    echo "COMMAND $*"
    echo "$OUTPUT"
    echo ""
    FAILED=1
  fi
}

cd "$DIR"

# --- fix tier (auto-fix and exit) ---
if [ "$TIER" = "fix" ]; then
  uv run ruff check --fix .
  exit 0
fi

# --- fix tier (auto-fix and exit) ---
if [ "$TIER" = "format" ]; then
  uv run ruff format .
  exit 0
fi
# --- fast tier (always runs) ---
run_check "format" uv run ruff format --check .
run_check "lint"   uv run ruff check .
run_check "type"   uv run ty check

if [ "$TIER" = "fast" ]; then
  exit $((FAILED * 2))
fi

# --- full tier ---
run_check "arch"       uv run lint-imports --no-cache
run_check "deadcode"   uv run vulture . --min-confidence 80
run_check "security"   uv run bandit -r . -q -ll
run_check "complexity" uv run complexipy . --max-complexity-allowed 15

if [ "$TIER" = "full" ]; then
  exit $((FAILED * 2))
fi

# --- strict tier ---
run_check "lint-strict" uv run flake8 --select=WPS --exclude=tests .

exit $((FAILED * 2))
