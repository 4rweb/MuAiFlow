---
name: execute-approved-plan
description: Prompt to execute a plan after human approval
---

# Approved Plan Execution Prompt

## ⚠️ Required Checks BEFORE executing

**STOP here if any check fails:**

1. Read the exact plan path provided by the human. Plans usually live at `.ai/plans/tracked/YYYY-MM-DD-title.md` or `.ai/plans/local/YYYY-MM-DD-title.md`; older plans may still live directly under `.ai/plans/`.
2. Check the frontmatter:
   - `status` is `HUMAN_APPROVED`? If not → **STOP**, inform the human.
   - `human_approved_by` is filled? If not → **STOP**, inform the human.
   - `human_approved_at` has a date? If not → **STOP**, inform the human.
3. Check `review_required`:
   - If `true` and `reviewer_ai` is empty → **STOP**, inform the human that cross-review was required and was not done.
4. Check the plan's pre-conditions. Are all satisfied? If not → **STOP**, list what's missing.

## Execution Instructions

### Before each task

1. Verify the task's dependencies are completed
2. Read the files that will be modified (current version)
3. Confirm you understood the task description

### During execution

- Follow the dependency order: if T2 depends on T1, execute T1 first
- For each completed task:
  - Mark `[x]` on the acceptance criteria checkboxes
  - Run the verification command ("How to verify")
  - If it fails, change status to `BLOCKED` and inform the human
- Update `last_updated_at` in the frontmatter after each task

### If you encounter a blocker

1. Change `status` to `BLOCKED` in the frontmatter
2. Fill Handoff:
   - `Last task`: which task got stuck
   - `Progress`: what has been done
   - `Blockers`: exact description of the problem
   - `Next step`: what needs to happen to unblock
3. Inform the human with specific details

### After completing all tasks

1. Run the plan's **Final Verification** (build, tests, lint)
2. If everything passes:
   - Change `status` to `DONE`
   - Fill `commit_sha` and `pr_url` if applicable
   - Update Handoff with a summary of what was done
3. If something fails in the final verification:
   - Change `status` to `BLOCKED`
   - Report which verification failed and why

### Security rules (adapt to your project's conventions)

- **Never** commit `.env` files or secrets
- **Never** push directly to main/master without review
- **Always** add authentication to new public endpoints
- **Always** verify ownership/authorization in mutations
- Follow the conventions defined in `CLAUDE.md` or `AGENTS.md`
