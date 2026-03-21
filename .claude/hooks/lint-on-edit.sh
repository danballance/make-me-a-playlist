#!/usr/bin/env bash
set -euo pipefail

STATE_FILE="/tmp/lint-stop-count"

# Reset stop counter — agent is actively editing, so next Stop gets fresh attempts
echo "0" > "$STATE_FILE"

# Read hook context from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# If we can't determine the file, skip silently
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$0")/../scripts" && pwd)"

# Route to the relevant linter based on file extension
case "$FILE_PATH" in
  *.py)
    echo "⚡ Running fast Python lint check..."
    OUTPUT=$("$SCRIPT_DIR/lint-py.sh" fast ./backend 2>&1) || {
      echo "⚡ Lint check (fast) found issues in Python code:"
      echo ""
      echo "$OUTPUT"
      echo ""
      echo "Fix these issues before continuing."
      exit 1
    }
    ;;
  *.ts|*.tsx|*.js|*.jsx)
    echo "⚡ Running fast TypeScript lint check..."
    OUTPUT=$("$SCRIPT_DIR/lint-ts.sh" fast ./ui 2>&1) || {
      echo "⚡ Lint check (fast) found issues in TypeScript code:"
      echo ""
      echo "$OUTPUT"
      echo ""
      echo "Fix these issues before continuing."
      exit 1
    }
    ;;
  *)
    # Not a lintable file — skip silently
    exit 0
    ;;
esac
