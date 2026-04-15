#!/usr/bin/env bash
# handoff.sh — Generates handoff context for AI switching
# Usage: bash .ai/scripts/handoff.sh [ai_name]
# Example: bash .ai/scripts/handoff.sh codex
#
# SECURITY: this script does NOT capture .env, secrets, or full diffs.
# Uses only: branch, status --short, diff --stat, current plan.

set -euo pipefail

AI_NAME="${1:-unknown}"
BRANCH="$(git branch --show-current 2>/dev/null || echo 'unknown')"

latest_plan_file() {
  {
    find .ai/plans -maxdepth 1 -type f -name '????-??-??-*.md' 2>/dev/null || true
    find .ai/plans/tracked -maxdepth 1 -type f -name '????-??-??-*.md' 2>/dev/null || true
    find .ai/plans/local -maxdepth 1 -type f -name '????-??-??-*.md' 2>/dev/null || true
  } | while IFS= read -r file; do
    mtime="$(date -r "$file" '+%s' 2>/dev/null || stat -c '%Y' "$file" 2>/dev/null || echo 0)"
    printf '%s\t%s\n' "$mtime" "$file"
  done | sort -rn | sed -n '1s/^[^	]*	//p'
}

extract_field() {
  local prefix="$1"
  local file="$2"
  local fallback="${3:-?}"
  local value

  value="$(awk -v prefix="$prefix" 'index($0, prefix) == 1 { print substr($0, length(prefix) + 1); found=1; exit } END { if (!found) exit 1 }' "$file" 2>/dev/null || true)"
  if [ -n "$value" ]; then
    printf '%s' "$value"
  else
    printf '%s' "$fallback"
  fi
}

# Find most recent plan
LATEST_PLAN=""
PLAN_STATUS=""
PLAN_NEXT_STEP=""
PLAN_BLOCKERS=""
LATEST_PLAN="$(latest_plan_file)"
if [ -n "$LATEST_PLAN" ]; then
  PLAN_STATUS="$(extract_field "status: " "$LATEST_PLAN" "?")"
  PLAN_NEXT_STEP="$(extract_field "- **Next step**: " "$LATEST_PLAN" "?")"
  PLAN_BLOCKERS="$(extract_field "- **Blockers**: " "$LATEST_PLAN" "none")"
fi

echo "========================================="
echo "HANDOFF — MuAiFlow"
echo "========================================="
echo ""
echo "Date:          $(date '+%Y-%m-%d %H:%M')"
echo "Current AI:    $AI_NAME"
echo "Branch:        $BRANCH"
echo ""

# --- Current plan ---
echo "--- Current Plan ---"
if [ -n "$LATEST_PLAN" ]; then
  echo "File:    $LATEST_PLAN"
  echo "Status:  $PLAN_STATUS"
  echo "Next:    $PLAN_NEXT_STEP"
  echo "Blocked: $PLAN_BLOCKERS"
else
  echo "(none found in .ai/plans/, .ai/plans/tracked/, or .ai/plans/local/)"
fi
echo ""

# --- Git status (short, no diff) ---
echo "--- Git Status (short) ---"
git status --short 2>/dev/null | head -20 || true
echo ""

# --- Diff stats (no content) ---
echo "--- Diff Stats ---"
git diff --stat 2>/dev/null | tail -5 || true
echo ""

# --- Recent commits ---
echo "--- Last 3 Commits ---"
git log --oneline -3 2>/dev/null || true
echo ""

# --- Tests ---
echo "--- Recent Test Runs ---"
if [ -f ".ai/test-results.txt" ]; then
  tail -5 .ai/test-results.txt 2>/dev/null
else
  echo "(no test results cached — run tests before handoff if possible)"
fi
echo ""

# --- Staged files (names only) ---
echo "--- Staged Files ---"
git diff --cached --name-only 2>/dev/null | head -10 || echo "(none)"
echo ""

echo "========================================="
echo "For the next AI to continue:"
echo "1. Read .ai/SETUP.md"
if [ -n "$LATEST_PLAN" ]; then
echo "2. Read the plan at $LATEST_PLAN"
echo "3. Check the Handoff section of the plan"
echo "4. Continue from: $PLAN_NEXT_STEP"
fi
echo "========================================="
