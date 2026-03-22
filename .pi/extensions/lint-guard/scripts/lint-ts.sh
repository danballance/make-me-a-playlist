#!/usr/bin/env bash
set -euo pipefail

# Usage: lint-ts.sh <tier> [directory]
# Tiers: fast, full
TIER="${1:-fast}"
DIR="${2:-./ui}"
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

# --- fast tier (always runs) ---
run_check "format" pnpm exec biome format .
run_check "lint"   pnpm exec biome lint .
run_check "type"   pnpm exec tsc --noEmit

if [ "$TIER" = "fast" ]; then
  exit $((FAILED * 2))
fi

# --- full tier ---
run_check "deadcode" pnpm exec knip

exit $((FAILED * 2))
