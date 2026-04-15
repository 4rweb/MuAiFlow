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

# Find most recent plan
LATEST_PLAN=""
PLAN_STATUS=""
PLAN_NEXT_STEP=""
PLAN_BLOCKERS=""
if compgen -G ".ai/plans/????-??-??-*.md" > /dev/null 2>&1; then
  LATEST_PLAN=$(ls -t .ai/plans/????-??-??-*.md 2>/dev/null | head -1)
  if [ -n "$LATEST_PLAN" ]; then
    PLAN_STATUS=$(grep -oP '(?<=^status: ).*' "$LATEST_PLAN" 2>/dev/null || echo "?")
    PLAN_NEXT_STEP=$(grep -oP '(?<=\*\*Next step\*\*: ).*' "$LATEST_PLAN" 2>/dev/null || echo "?")
    PLAN_BLOCKERS=$(grep -oP '(?<=\*\*Blockers\*\*: ).*' "$LATEST_PLAN" 2>/dev/null || echo "none")
  fi
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
  echo "(none found in .ai/plans/)"
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
