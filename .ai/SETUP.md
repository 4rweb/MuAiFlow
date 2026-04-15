# MuAiFlow — Full Setup & Documentation

## Overview

MuAiFlow is a structured workflow for using multiple AI agents collaboratively, with **cross-review** and a **human-in-the-loop** gate before any code is executed.

### Tools

| Tool | Role |
|------|------|
| **Codex CLI** | Plan + Execute (primary) |
| **Claude Code** | Cross-review + Execute (fallback) |
| **Crush** | Cross-review + Execute (fallback) |
| **GitHub Copilot** | **Assistive only** — editor suggestions, PR review. Does NOT plan, execute, or fill plan frontmatter. |

---

## Workflow Flows

### Standard Flow (starts with Codex)

```
[CODEX] Generate plan in .ai/plans/YYYY-MM-DD-title.md  →  status: DRAFT
    ↓
[CLAUDE CODE or CRUSH] Validate and improve plan  →  status: AI_REVIEWED
    ↓
⏸️  AI STOPS HERE. Notifies human that plan is ready for approval.
    ↓
[HUMAN] Approves plan → fills "human_approved_by" → status: HUMAN_APPROVED
    ↓
[CODEX] Executes approved plan  →  status: EXECUTING → DONE
    ↓
[CLAUDE CODE or CRUSH] Final code review (optional)
```

### Alternate Flow (Codex unavailable)

```
[CLAUDE CODE] Generate or take over plan  →  status: DRAFT
    ↓
[CRUSH] Validate plan  →  status: AI_REVIEWED
    ↓
⏸️  AI STOPS HERE. Waits for human approval.
    ↓
[HUMAN] Approves  →  status: HUMAN_APPROVED
    ↓
[CLAUDE CODE] Executes
```

### Changes Requested Flow

```
[Reviewing AI] Finds problems  →  status: CHANGES_REQUESTED
    ↓
[Original AI] Makes fixes  →  status: AI_REVIEWED
    ↓
⏸️  AI STOPS HERE. Waits for human approval.
    ↓
[HUMAN] Approves  →  status: HUMAN_APPROVED
```

---

## File Structure

```
.ai/
├── README.md                          # Quick reference
├── SETUP.md                           # This file — full documentation
├── plans/
│   ├── TEMPLATE.md                    # Template — copy for each new plan
│   ├── .gitkeep
│   └── YYYY-MM-DD-title.md           # Generated plans
├── prompts/
│   ├── plan-generation.prompt.md      # Generate plan from requirement
│   ├── multi-ai-review.prompt.md      # Cross-review a plan
│   ├── execute-approved-plan.prompt.md # Execute approved plan
│   ├── handoff-resume.prompt.md       # Resume work from another AI
│   ├── final-code-review.prompt.md    # Optional final code review
│   └── .gitkeep
└── scripts/
    └── handoff.sh                     # Capture context when switching AIs
```

---

## Plan Format

Each plan uses **YAML frontmatter** for audit and automation, followed by Markdown sections. Template at `.ai/plans/TEMPLATE.md`.

### Frontmatter (YAML)

```yaml
---
status: DRAFT                        # DRAFT | AI_REVIEWED | CHANGES_REQUESTED | HUMAN_APPROVED | EXECUTING | BLOCKED | DONE
author: codex                        # codex | claude | crush
review_required: true                # true = cross-review required | false = optional
reviewer_ai:                         # filled by reviewing AI
reviewer_ai_at:
human_approved_by:                   # ⚠️ HUMAN ONLY
human_approved_at:                   # ⚠️ HUMAN ONLY
human_notes:                         # ⚠️ HUMAN ONLY
branch: feature/your-branch
created_at: YYYY-MM-DDTHH:mm:ss-03:00
last_updated_at:
pr_url:
commit_sha:
---
```

### Plan Sections

| Section | Contents | Who fills it |
|---------|----------|--------------|
| **Context** | Why we're doing this | Authoring AI |
| **Objective + Done Criteria** | Expected measurable result | Authoring AI |
| **Scope** (includes / excludes) | Clear boundaries | Authoring AI |
| **Assumptions** | Premises that must be true | Authoring AI |
| **Pre-conditions** | What must be ready before starting | Authoring AI |
| **Impact & Risks** | Modules, files, DB migration, env vars, external APIs | Authoring AI |
| **Test Strategy** | Automated, manual, regression tests | Authoring AI |
| **Rollback** | How to revert if something goes wrong | Authoring AI |
| **Tasks** | Each task with type, files, dependencies, complexity, acceptance criteria | Authoring AI |
| **Post-conditions** | Expected state after execution | Authoring AI |
| **Final Verification** | Build/test/lint commands + manual verification | Authoring AI |
| **Validation (other AI)** | Cross-review feedback | Reviewing AI |
| **Handoff** | Context to transfer between AIs | Outgoing AI |

### Status Flow

```
DRAFT → AI_REVIEWED → HUMAN_APPROVED → EXECUTING → DONE
  │         │                              │
  │         └→ CHANGES_REQUESTED ─→ AI_REVIEWED
  │                                        │
  └────────────────────────────────────────┘→ BLOCKED
```

- **DRAFT**: Plan created, waiting for cross-review
- **AI_REVIEWED**: Another AI validated it — waiting for human approval
- **CHANGES_REQUESTED**: Reviewing AI found issues — authoring AI must fix
- **HUMAN_APPROVED**: ⚠️ **Only the human can reach this state** — ready to execute
- **EXECUTING**: AI is running the tasks
- **BLOCKED**: Execution stalled — human intervention needed
- **DONE**: All tasks completed

---

## Rules

1. **Always start with cross-review** when the plan touches sensitive areas
2. **⚠️ BLOCKING RULE: No AI can set status to `HUMAN_APPROVED`** — only the human fills `human_approved_by`. If empty, the AI MUST STOP before executing any task.
3. **Cross-review required** when the plan involves: database migrations/schema, authentication/authorization, external integrations, large refactors (> 5 files), changes across multiple services, or when an AI is taking over execution from another AI.
4. **Cross-review optional** for: docs, small fixes (< 3 files), isolated single-module changes, chores.
5. **Handoff required** when switching AI tools — fill the Handoff section of the plan.
6. **Plans go in `.ai/plans/`** — standardized format with status tracking.
7. **Fallback order**: Codex → Claude Code → Crush → Copilot (assistive only).

### When cross-review is required

| Condition | Why |
|-----------|-----|
| DB migration or schema changes | Risk of data loss, downtime, broken queries |
| Auth, permissions, tokens | Security risk — data exposure |
| External integrations | API contract may change, rate limits, sensitive data |
| Refactor > 5 files | High regression risk |
| Changes across backend + frontend | Two contact surfaces, more inconsistency risk |
| AI takes over execution from another AI | Second AI lacks context from first — review required |

### Who can set each status

| Status | Who | When |
|--------|-----|------|
| DRAFT → AI_REVIEWED | Reviewing AI | After validating and improving the plan |
| AI_REVIEWED → CHANGES_REQUESTED | Reviewing AI | When issues require correction |
| CHANGES_REQUESTED → AI_REVIEWED | Authoring AI | After making the requested fixes |
| AI_REVIEWED → **HUMAN_APPROVED** | **⚠️ HUMAN ONLY** | When human approves the plan |
| HUMAN_APPROVED → EXECUTING | Executing AI | Start of execution |
| EXECUTING → DONE | Executing AI | All tasks completed |
| EXECUTING → BLOCKED | Executing AI | When a blocker is found |
| BLOCKED → EXECUTING | Executing AI | After resolving the blocker |

---

## How to Use

### Creating a new plan

```bash
# Copy the template
cp .ai/plans/TEMPLATE.md .ai/plans/$(date +%Y-%m-%d)-feature-title.md

# Ask AI to fill it in using the generation prompt
codex "Follow .ai/prompts/plan-generation.prompt.md to fill .ai/plans/YYYY-MM-DD-title.md with a plan to [describe task]"
```

#### Providing large context (schemas, payloads, rules)

Shell commands have token limits — you can't paste a DB schema, a JSON payload example, and a business rule list into a single command without hitting errors.

The solution is `.ai/plans/context.md`: a free-form file you populate **before** running the command, and reference at the end of the command:

```bash
# 1. Edit .ai/plans/context.md with your large reference data:
#    - DB schema excerpts
#    - Real API response examples (shows null fields, date formats, numeric-as-string quirks)
#    - Finished module paths to use as patterns
#    - Business rules that are too long for the command line

# 2. Then run:
codex "Follow .ai/prompts/plan-generation.prompt.md to fill .ai/plans/$(date +%Y-%m-%d)-feature.md \
  with a plan to [describe task]. Read .ai/plans/context.md for additional context."
```

The generation prompt instructs the AI to read `context.md` automatically if it exists.
After the plan is generated, you can clear or update `context.md` for the next task.

### Cross-reviewing a plan

```bash
# Claude Code (type in chat)
"Follow .ai/prompts/multi-ai-review.prompt.md to validate .ai/plans/YYYY-MM-DD-title.md"

# Crush
crush run "Follow .ai/prompts/multi-ai-review.prompt.md to validate .ai/plans/YYYY-MM-DD-title.md"
```

### Executing an approved plan

**⚠️ Before executing, verify:**
1. Plan status is `HUMAN_APPROVED`?
2. `human_approved_by` in frontmatter is filled?
3. If NO: **STOP** and inform the human.

```bash
# Codex
codex "Follow .ai/prompts/execute-approved-plan.prompt.md to execute .ai/plans/YYYY-MM-DD-title.md"

# Claude Code fallback (type in chat)
"Follow .ai/prompts/execute-approved-plan.prompt.md to execute .ai/plans/YYYY-MM-DD-title.md"
```

### Handoff (switching AI tools)

```bash
# Generate snapshot before switching
bash .ai/scripts/handoff.sh [codex|claude|crush]

# The next AI resumes with:
"Follow .ai/prompts/handoff-resume.prompt.md to resume .ai/plans/YYYY-MM-DD-title.md"
```

### Final code review (optional)

```bash
"Follow .ai/prompts/final-code-review.prompt.md to review code from .ai/plans/YYYY-MM-DD-title.md"
```

---

## Tool Configuration

### Codex CLI
- **Project instructions**: `AGENTS.md` in the root (read automatically)
- **Config**: `~/.codex/config.toml`

### Claude Code
- **Project instructions**: `CLAUDE.md` in the root
- **Settings**: `.claude/settings.local.json`

### Crush
- No automatic project instructions file — point to `.ai/SETUP.md` manually when needed

### GitHub Copilot
- **Instructions**: `.github/copilot-instructions.md`
- Cannot plan, execute plans, or fill plan frontmatter

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| AI tokens ran out mid-execution | Switch to another AI using handoff |
| Plan too large | Split into sub-plans in `.ai/plans/` |
| AI doesn't follow the format | Point explicitly to `TEMPLATE.md` |
| AI set status to `HUMAN_APPROVED` | **Rule violation** — revert the status, inform the human |
| Handoff lost context | Check Handoff section of the plan, add more detail |
| Execution stalled (BLOCKED) | AI explains the reason, human decides how to proceed |
