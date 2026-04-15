---
name: muai-workflow
description: Multi-AI workflow with cross-review and human approval gate. Use when planning features, generating implementation plans, reviewing plans from other AIs, executing approved plans, or handing off work between AI agents. Activates on plan generation, code review, and multi-step feature implementation.
---

# MuAiFlow — Multi-AI Workflow

You follow a structured plan→review→approve→execute pipeline. No AI can execute code without human approval.

## Core Flow

```
[You] Generate plan → status: DRAFT
[Other AI] Cross-review → status: AI_REVIEWED
⏸️ STOP — wait for human approval
[Human] Approves → status: HUMAN_APPROVED
[You] Execute → status: EXECUTING → DONE
```

## ⚠️ BLOCKING RULE

**NEVER set `status: HUMAN_APPROVED`** or fill `human_approved_by`. Only the human does this. If `human_approved_by` is empty, STOP before executing any task.

## Plan Format

Plans live in `.ai/plans/tracked/YYYY-MM-DD-title.md` for tracked work or `.ai/plans/local/YYYY-MM-DD-title.md` for private local work, using this frontmatter:

```yaml
---
status: DRAFT
author: [your name]
review_required: true
reviewer_ai:
human_approved_by:      # ⚠️ HUMAN ONLY
human_approved_at:      # ⚠️ HUMAN ONLY
branch: feature/name
created_at: YYYY-MM-DDTHH:mm:ss
---
```

## Status Flow

```
DRAFT → AI_REVIEWED → HUMAN_APPROVED → EXECUTING → DONE
             ↓                              ↓
    CHANGES_REQUESTED                    BLOCKED
```

## When Generating a Plan

1. Read `.ai/plans/TEMPLATE.md` for the full template
2. Read project conventions (CLAUDE.md or AGENTS.md)
3. Read `.ai/plans/context.md` if it exists (large reference data; reusable skeleton at `.ai/plans/CONTEXT_TEMPLATE.md`)
4. Verify every file path you cite actually exists
5. Set `status: DRAFT`, fill `author`, `branch`, `created_at`
6. Set `review_required: true` for: DB changes, auth, external APIs, refactors > 5 files
7. Each task must have: Type, Depends on, Complexity, Model tier, Files, Description, Acceptance criteria

## When Reviewing a Plan

1. Read the plan completely
2. Verify EVERY file path cited — read the actual files
3. Cite `file:line` when pointing out risks
4. Separate BLOCKERS (must fix) from SUGGESTIONS (optional)
5. Check: tests exist for business logic, no security gaps, migrations planned
6. Set `status: AI_REVIEWED` or `CHANGES_REQUESTED`
7. NEVER set `HUMAN_APPROVED`

## When Executing a Plan

1. Verify `status` is `HUMAN_APPROVED` and `human_approved_by` is filled — if not, STOP
2. Follow task dependency order
3. Mark acceptance criteria as done after each task
4. Run verification commands after each task
5. If blocked, set `status: BLOCKED` and explain why
6. After all tasks: run Final Verification, set `status: DONE`

## Model Tiers (per task)

- **reasoning** — architecture, planning, complex debugging
- **standard** — business logic, integration, normal implementation
- **fast** — boilerplate, styles, tests, i18n, docs

## Handoff (switching AIs)

Before ending your session, fill the plan's Handoff section:
- Last AI, Last task, Progress, Next step, Blockers, Extra context
