#!/usr/bin/env bash
# MuAiFlow — Install VS Code extension
# Usage: bash install.sh

set -euo pipefail

VSIX="$(dirname "$0")/muaiflow-file-ref.vsix"

if ! command -v code &>/dev/null; then
  echo "ERROR: 'code' command not found. Open VS Code and run:"
  echo "  Cmd+Shift+P → 'Shell Command: Install code command in PATH'"
  exit 1
fi

echo "Installing MuAiFlow File Reference extension..."
code --install-extension "$VSIX"
echo ""
echo "Done! Reload VS Code (Cmd+Shift+P → 'Reload Window')."
echo "Then type @ in any .md file to reference files from your workspace."
