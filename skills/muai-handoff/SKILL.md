---
name: muai-handoff
description: Resumes work from a handoff when switching between AI agents. Reads plan state, checks repository, decides next action based on status. Use when taking over a plan started by another AI or resuming after a session break.
---

# MuAiFlow Handoff Resume

You are taking over work from another AI. Follow these steps to resume with full context.

## Step 1: Read Context

Read these files in order:
1. `.ai/SETUP.md` — workflow rules
2. `CLAUDE.md` or `AGENTS.md` — project conventions
3. The exact plan path from the handoff or human — usually `.ai/plans/tracked/YYYY-MM-DD-title.md` or `.ai/plans/local/YYYY-MM-DD-title.md`; older plans may still live directly under `.ai/plans/`. Read it **completely**, including frontmatter.

## Step 2: Check Plan State

In the frontmatter, verify:
- `status` — what state is the plan in?
- `author` — who created it?
- `reviewer_ai` — has anyone validated it?

In the **Handoff** section:
- `Last AI` — who was working?
- `Last task` — where did they stop?
- `Progress` — what has been done?
- `Next step` — what to do now?
- `Blockers` — anything blocking?

## Step 3: Check Repository State

Run `bash .ai/scripts/handoff.sh [your-name]` to capture:
- Current branch, modified files, recent commits, test results

Compare with what the plan says was done. If there's a discrepancy, **trust the repository state** and update the plan.

## Step 4: Decide Next Action

| Status | Action |
|--------|--------|
| `DRAFT` | Validate the plan (cross-review) |
| `AI_REVIEWED` | **STOP** — human approval needed |
| `CHANGES_REQUESTED` | Fix the points raised by the reviewer |
| `HUMAN_APPROVED` | Execute the plan |
| `EXECUTING` | Continue from the last incomplete task |
| `BLOCKED` | Investigate blocker. If resolvable, continue. If not, inform human. |
| `DONE` | Verify everything is truly complete. Run Final Verification. |

## Step 5: Update Handoff

Before ending your session:
1. Update the Handoff section with your progress
2. Update `last_updated_at` in frontmatter
3. Run `bash .ai/scripts/handoff.sh [your-name]`
4. Fill `Last AI` with your name

## Rules

- **Never** set `status: HUMAN_APPROVED`
- **Never** fill `human_approved_by` or `human_approved_at`
- If repository state diverges from the plan, trust the repo
- If handoff context is unclear, ask the human before proceeding
