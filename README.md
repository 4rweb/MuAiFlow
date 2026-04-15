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

| Tool | Role |
|------|------|
| **OpenAI Codex CLI** | Plan + Execute (primary) |
| **Claude Code** | Cross-review + Execute (fallback) |
| **Crush** | Cross-review + Execute (fallback) |
| **GitHub Copilot** | Editor suggestions only — does NOT plan or execute |

Works with any AI agent that can read files and follow instructions. The prompts are tool-agnostic.

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

### 4. Create your first plan

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

### 4. Cross-review with another AI

```bash
# Claude Code (type in chat):
"Follow .ai/prompts/multi-ai-review.prompt.md to validate .ai/plans/$(date +%Y-%m-%d)-my-feature.md"

# Crush:
crush run "Follow .ai/prompts/multi-ai-review.prompt.md to validate .ai/plans/$(date +%Y-%m-%d)-my-feature.md"
```

### 5. Approve (humans only)

Open the plan file and fill in the frontmatter:

```yaml
status: HUMAN_APPROVED
human_approved_by: your-name
human_approved_at: 2025-01-15T10:00:00-03:00
human_notes: looks good, go ahead
```

### 6. Execute

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
