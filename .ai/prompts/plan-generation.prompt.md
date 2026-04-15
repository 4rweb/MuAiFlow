---
name: plan-generation
description: Prompt to generate a complete plan using the .ai/plans/TEMPLATE.md template
---

# Plan Generation Prompt

## Instructions

You will generate an implementation plan. Follow the template at `.ai/plans/TEMPLATE.md` and fill in **all sections**.

### Required steps before writing

1. **Read the template**: `.ai/plans/TEMPLATE.md`
2. **Read the project conventions**: `CLAUDE.md` or `AGENTS.md` (depending on which tool you are)
3. **Read `.ai/plans/context.md` if it exists** — this file contains large reference material (DB schemas, API response examples, business rules) that the human placed there because it was too large to include in the command. Treat it as authoritative context for this task.
4. **Explore the code**: Before citing any file, verify it exists and read the relevant content. Never cite a path you haven't confirmed.
5. **Check dependencies**: If the task touches a DB schema, verify if a migration is needed. If it touches `.env`, check `.env.example`.

### Filling rules

- **Frontmatter**: Fill `status: DRAFT`, `author`, `branch`, `created_at`. Leave `human_approved_*` empty.
- **review_required**: Set `true` if the plan involves ANY of these:
  - DB migration or schema changes
  - Authentication, authorization, permissions
  - External integrations (third-party APIs, webhooks)
  - Refactor touching > 5 files
  - Changes across multiple apps/services
  - An AI taking over execution from another AI
  - Set `false` only for: docs, small fixes (< 3 files), chores
- **Context**: Explain the **why**, not the **what**. The what goes in the Objective section.
- **Objective + Done Criteria**: Criteria must be **objective and measurable**. "Works" is not a criterion. "POST /items returns 201 with payload {id, title}" is.
- **Assumptions**: List everything you're assuming is true. If an assumption is false, tasks may block.
- **Pre-conditions**: Things that must be ready BEFORE starting. Include commands to verify they're ready.
- **Impact & Risks**: Be honest. High risk doesn't block the plan, but it informs the human.
- **Test Strategy**: Every task with business logic needs a test. Say which test and where.
- **Rollback**: If there's no simple rollback strategy, explain why.
- **Tasks**: Each task must have explicit dependencies. If T2 depends on T1, say so. Use low/medium/high complexity honestly.

### Files cited in the plan

For **each file** listed in the tasks section:
- Confirm the path exists (use `ls`, `cat`, or equivalent)
- If it needs to be created, confirm the parent directory exists
- If it needs to be modified, read the current file and ensure the change makes sense

### Non-optional tasks

- If the plan involves a DB migration, include a specific task for the migration command
- If the plan adds an env var, include a task to update `.env.example`
- If the plan creates a new endpoint, include a task to add authentication

### When finished

- Set `status` to `DRAFT` in the frontmatter
- Fill `last_updated_at`
- In the Handoff section, fill: `Last AI`, `Next step` = "awaiting validation from another AI"
- Notify the human: "Plan generated at `.ai/plans/YYYY-MM-DD-title.md`, status DRAFT. Recommend asking another AI to validate using `.ai/prompts/multi-ai-review.prompt.md`."
