# MuAiFlow — Multi-AI Workflow

> A structured workflow for collaborating with multiple AI agents on software projects, with mandatory cross-review and a **human-in-the-loop** approval gate before execution.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Why MuAiFlow?

AI coding agents are powerful individually — but they work even better in a structured pipeline:

- **One AI plans** → **Another AI reviews** → **Human approves** → **AI executes**

This prevents blind spots, catches architectural mistakes before code is written, and keeps the human in control of what gets built.

---

## How It Works

```
[AI #1] Generate plan  →  status: DRAFT
        ↓
[AI #2] Cross-review   →  status: AI_REVIEWED
        ↓
⏸️  AI STOPS. Notifies human that plan is ready.
        ↓
[HUMAN] Approve plan   →  status: HUMAN_APPROVED  (only humans set this)
        ↓
[AI #1 or #2] Execute  →  status: EXECUTING → DONE
        ↓
[AI #2] Final code review  (optional)
```

**No AI can ever set `status: HUMAN_APPROVED`.** This is the core safety guarantee of MuAiFlow.

---

## Supported Tools

MuAiFlow is **tool-agnostic** — it works with any AI agent that can read files and follow instructions. You choose which AI is your primary planner, which one cross-reviews, and which one executes. There is no required combination.

Here are some examples, but you can use any AI tools in any role:

| Example setup | Planner | Reviewer | Executor |
|---------------|---------|----------|----------|
| Codex-first | Codex CLI | Claude Code or Crush | Codex CLI |
| Claude-first | Claude Code | Crush or Codex CLI | Claude Code |
| Crush-first | Crush | Claude Code or Codex CLI | Crush |

The only requirement is that **the reviewer must be a different AI than the planner** — the whole point is a second pair of eyes.

> **Note:** GitHub Copilot is assistive only (editor suggestions, PR review). It cannot plan, execute plans, or fill plan frontmatter.

---

## VS Code Extension — File Reference (`@`)

MuAiFlow includes a VS Code extension that lets you quickly reference project files inside `.md` plan files using `@path/to/file` syntax.

### How it works

- **Type `@` in any Markdown file** → a Quick Pick opens with all workspace files and folders, with a loading spinner while indexing
- **Press `Cmd+Alt+R`** (Mac) / `Ctrl+Alt+R` (Windows/Linux) → same Quick Pick, without typing `@` first
- **Select a file** → inserts `@path/to/file` at the cursor position
- The file list is **cached in memory** and refreshes automatically when files are created or deleted

### Install

```bash
bash install.sh
```

Or manually:

```bash
cd vscode-extension
npm install
npm run compile
vsce package --no-dependencies --allow-missing-repository
code --install-extension muaiflow-file-ref-*.vsix --force
```

After installing, **reload VS Code** (`Cmd+Shift+P` → "Reload Window").

### Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `muaiflow.fileRef.include` | `**/*` | Glob pattern for files to include |
| `muaiflow.fileRef.exclude` | `**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/.next/**,**/build/**` | Glob patterns to exclude (comma-separated) |
| `muaiflow.fileRef.includeDirectories` | `true` | Include directories in suggestions |

---

## Quick Start

### 1. Copy `.ai/` into your project

```bash
cp -r .ai/ /path/to/your-project/.ai/
```

### 2. Add a project instruction file

Copy and customize one of the examples:

```bash
# For Claude Code
cp examples/CLAUDE.md.example /path/to/your-project/CLAUDE.md

# For Codex CLI
cp examples/AGENTS.md.example /path/to/your-project/AGENTS.md
```

### 3. (Optional) Prepare context for large reference data

Shell commands have token limits. When your task involves DB schemas, API response examples, or business rules that are too long to paste into a command, use `.ai/plans/context.md`:

```bash
# Edit context.md with your reference data BEFORE running the plan command
# Examples of what to put there:
# - DB table definitions
# - Real API response JSON (shows null fields, date formats, numeric-as-string quirks)
# - Paths to finished modules to use as patterns
# - Business rules too long for the command line
```

Then reference it at the end of your plan generation command:
```bash
codex "Follow .ai/prompts/plan-generation.prompt.md to fill .ai/plans/$(date +%Y-%m-%d)-my-feature.md \
  with a plan to [describe task]. Read .ai/plans/context.md for additional context."
```

### 4. (Optional) Install the VS Code extension

```bash
bash install.sh
```

This installs the file reference extension — type `@` in any `.md` file to quickly reference project files in your plans.

### 5. Create your first plan

```bash
cd your-project

# Copy the template
cp .ai/plans/TEMPLATE.md .ai/plans/$(date +%Y-%m-%d)-my-feature.md

# Ask an AI to fill it in
# Codex:
codex "Follow .ai/prompts/plan-generation.prompt.md to fill .ai/plans/$(date +%Y-%m-%d)-my-feature.md with a plan to [describe your task]"

# Claude Code: type this message in the chat
"Follow .ai/prompts/plan-generation.prompt.md to fill .ai/plans/$(date +%Y-%m-%d)-my-feature.md with a plan to [describe your task]"
```

### 6. Cross-review with another AI

```bash
# Claude Code (type in chat):
"Follow .ai/prompts/multi-ai-review.prompt.md to validate .ai/plans/$(date +%Y-%m-%d)-my-feature.md"

# Crush:
crush run "Follow .ai/prompts/multi-ai-review.prompt.md to validate .ai/plans/$(date +%Y-%m-%d)-my-feature.md"
```

### 7. Approve (humans only)

Open the plan file and fill in the frontmatter:

```yaml
status: HUMAN_APPROVED
human_approved_by: your-name
human_approved_at: 2025-01-15T10:00:00-03:00
human_notes: looks good, go ahead
```

### 8. Execute

```bash
codex "Follow .ai/prompts/execute-approved-plan.prompt.md to execute .ai/plans/$(date +%Y-%m-%d)-my-feature.md"
```

---

## Directory Structure

```
.ai/
├── README.md                        # Quick reference
├── SETUP.md                         # Full documentation
├── plans/
│   ├── TEMPLATE.md                  # Copy this for each new plan
│   ├── context.md                   # Large reference data (schema, payloads, rules)
│   └── YYYY-MM-DD-feature-name.md  # Generated plans
├── prompts/
│   ├── plan-generation.prompt.md    # Instruct AI to generate a plan
│   ├── multi-ai-review.prompt.md    # Instruct AI to cross-review a plan
│   ├── execute-approved-plan.prompt.md  # Instruct AI to execute
│   ├── handoff-resume.prompt.md     # Resume work from another AI
│   └── final-code-review.prompt.md  # Optional post-execution review
└── scripts/
    └── handoff.sh                   # Capture context when switching AIs

vscode-extension/
├── src/extension.ts                 # Extension source (TypeScript)
├── package.json                     # Manifest, commands, keybindings, config
└── tsconfig.json

install.sh                           # Installs the .vsix extension via `code` CLI
muaiflow-file-ref.vsix               # Pre-built extension package
```

---

## Plan Status Flow

```
DRAFT → AI_REVIEWED → HUMAN_APPROVED → EXECUTING → DONE
          ↓                                ↓
   CHANGES_REQUESTED                   BLOCKED
          ↓
       AI_REVIEWED
```

| Status | Who sets it |
|--------|-------------|
| `DRAFT` | AI that wrote the plan |
| `AI_REVIEWED` | Reviewing AI |
| `CHANGES_REQUESTED` | Reviewing AI |
| `HUMAN_APPROVED` | ⚠️ **Human only** |
| `EXECUTING` | Executing AI |
| `BLOCKED` | Executing AI |
| `DONE` | Executing AI |

---

## When is cross-review required?

| Condition | Required? |
|-----------|-----------|
| Database migrations or schema changes | ✅ Required |
| Authentication / authorization / permissions | ✅ Required |
| External API integrations | ✅ Required |
| Refactor touching > 5 files | ✅ Required |
| Changes across multiple apps/services | ✅ Required |
| AI taking over execution from another AI | ✅ Required |
| Docs, small tweaks (< 3 files), chores | Optional |

---

## Switching AIs mid-task (handoff)

If an AI runs out of tokens or you want to switch tools:

```bash
# Before switching, generate a snapshot
bash .ai/scripts/handoff.sh codex

# The next AI resumes with:
"Follow .ai/prompts/handoff-resume.prompt.md to resume .ai/plans/YYYY-MM-DD-plan.md"
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

MIT — see [LICENSE](LICENSE).
