#!/usr/bin/env bash
set -uo pipefail

STATE_FILE="/tmp/lint-stop-count"
MAX_ATTEMPTS=3

# Read and increment counter
COUNT=$(cat "$STATE_FILE" 2>/dev/null || echo "0")
COUNT=$((COUNT + 1))
echo "$COUNT" > "$STATE_FILE"

SCRIPT_DIR="$(cd "$(dirname "$0")/../scripts" && pwd)"

# Run both linters, capture output and exit codes
PY_EXIT=0
PY_OUTPUT=$("$SCRIPT_DIR/lint-py.sh" strict ./backend 2>&1) || PY_EXIT=$?
TS_EXIT=0
TS_OUTPUT=$("$SCRIPT_DIR/lint-ts.sh" full ./ui 2>&1) || TS_EXIT=$?

# If both pass, reset counter and exit cleanly
if [ $PY_EXIT -eq 0 ] && [ $TS_EXIT -eq 0 ]; then
  echo "0" > "$STATE_FILE"
  echo "✅ All lint checks passed."
  exit 0
fi

# Build combined output
COMBINED=""
if [ $PY_EXIT -ne 0 ]; then
  COMBINED="${COMBINED}--- Python (strict) ---\n${PY_OUTPUT}\n\n"
fi
if [ $TS_EXIT -ne 0 ]; then
  COMBINED="${COMBINED}--- TypeScript (full) ---\n${TS_OUTPUT}\n\n"
fi

# Circuit breaker
if [ "$COUNT" -ge "$MAX_ATTEMPTS" ]; then
  echo "⚠️ Lint issues remain after ${MAX_ATTEMPTS} attempts. Allowing completion." >&2
  echo "" >&2
  echo -e "$COMBINED" >&2
  echo "Please note these unresolved issues for the user." >&2
  echo "0" > "$STATE_FILE"
  exit 0
else
  REMAINING=$((MAX_ATTEMPTS - COUNT))
  echo "🚫 Pre-completion lint check FAILED (attempt ${COUNT}/${MAX_ATTEMPTS})" >&2
  echo "" >&2
  echo -e "$COMBINED" >&2
  echo "You must fix these issues before completing. ${REMAINING} attempt(s) remaining." >&2
  exit 2
fi
