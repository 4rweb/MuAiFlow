---
name: muai-plan-generator
description: Generates structured implementation plans with frontmatter, tasks, dependencies, and acceptance criteria. Use when starting a new feature, planning a refactor, or creating a multi-step implementation plan for any project.
---

# MuAiFlow Plan Generator

You generate structured implementation plans. Each plan is a Markdown file with YAML frontmatter, tasks with dependencies, and measurable acceptance criteria.

## Before Writing

1. Read the project conventions (`CLAUDE.md`, `AGENTS.md`, or equivalent)
2. Read `.ai/plans/context.md` if it exists — it contains large reference data the human placed there for this task. Reset the reusable skeleton from `.ai/plans/CONTEXT_TEMPLATE.md` with `npx muaiflow context --reset`, or empty it with `npx muaiflow context --clear`, when needed.
3. Explore the code: verify every file path before citing it. Never reference a path you haven't confirmed exists.
4. Check dependencies: if the task touches a DB schema, verify migration needs. If it touches `.env`, check `.env.example`.

## Plan Format

Create or fill the exact plan path requested by the human. New tracked plans usually live at `.ai/plans/tracked/YYYY-MM-DD-title.md`; local private plans live at `.ai/plans/local/YYYY-MM-DD-title.md`.

```yaml
---
status: DRAFT
author: [your name]
review_required: true
reviewer_ai:
human_approved_by:
human_approved_at:
branch: feature/name
created_at: YYYY-MM-DDTHH:mm:ss
last_updated_at:
---
```

## Sections to Fill

### Context
Explain the **why**, not the **what**. Why is this change needed? What problem does it solve?

### Objective + Done Criteria
Criteria must be **objective and measurable**. Bad: "Works". Good: "POST /items returns 201 with payload {id, title}".

### Assumptions
List everything you're assuming is true. If an assumption is false, tasks may block.

### Pre-conditions
Things that must be ready BEFORE starting. Include commands to verify.

### Impact & Risks
Be honest about severity. High risk doesn't block — it informs the human.

### Test Strategy
Every task with business logic needs a test. Specify which test and where.

### Rollback
If there's no simple rollback, explain why.

### Tasks

Each task must have:
- **Type**: feature / bugfix / refactor / config / test / docs
- **Depends on**: which tasks must complete first (e.g., T1, T2)
- **Complexity**: low / medium / high
- **Model**: reasoning / standard / fast (optional, defaults to standard)
- **Files**: exact paths (verified to exist or with parent directory confirmed)
- **Description**: what to do
- **Acceptance criteria**: checkboxes with measurable outcomes

## review_required Rules

Set `true` if the plan involves ANY of:
- DB migration or schema changes
- Authentication, authorization, permissions
- External integrations (third-party APIs, webhooks)
- Refactor touching > 5 files
- Changes across multiple apps/services
- AI taking over execution from another AI

Set `false` only for: docs, small fixes (< 3 files), chores.

## When Finished

1. Set `status: DRAFT`
2. Fill `last_updated_at`
3. Leave `human_approved_by` and `human_approved_at` **empty** — only humans fill these
4. Notify with the exact path: "Plan generated at `.ai/plans/tracked/YYYY-MM-DD-title.md`, status DRAFT. Recommend cross-review before approval."
