---
name: handoff-resume
description: Prompt to resume work from a handoff or existing plan
---

# Handoff Resume Prompt

## Instructions

You are taking over work from another AI. Follow these steps to resume with full context.

### Step 1: Read required context

Read these files in order:
1. `.ai/SETUP.md` — workflow rules
2. `CLAUDE.md` or `AGENTS.md` — project conventions
3. The exact plan path from the handoff or human — usually `.ai/plans/tracked/YYYY-MM-DD-title.md` or `.ai/plans/local/YYYY-MM-DD-title.md`; older plans may still live directly under `.ai/plans/`. Read it **completely**, including frontmatter.

### Step 2: Check current state

In the plan frontmatter, verify:
- `status` — what state is the plan in?
- `author` — who created it?
- `reviewer_ai` — has anyone validated it?

In the plan's **Handoff** section:
- `Last AI` — which AI was working?
- `Last task` — which task did it stop at?
- `Progress` — what has been done?
- `Next step` — what to do now?
- `Blockers` — is there anything blocking?

### Step 3: Check repository state

Run `bash .ai/scripts/handoff.sh [your-name]` to capture:
- Current branch
- Modified files (stat)
- Recent commits
- Tests run

Compare with what the plan says was done. If there's a discrepancy, **trust the repository state** and update the plan accordingly.

### Step 4: Decide next step

Based on the plan's `status`:

| Status | What to do |
|--------|-----------|
| `DRAFT` | You can validate the plan (use `.ai/prompts/multi-ai-review.prompt.md`) |
| `AI_REVIEWED` | **STOP** — inform the human that approval is needed |
| `CHANGES_REQUESTED` | Fix the points raised by the reviewer |
| `HUMAN_APPROVED` | You can execute (use `.ai/prompts/execute-approved-plan.prompt.md`) |
| `EXECUTING` | Continue from the last incomplete task |
| `BLOCKED` | Investigate the blocker. If you can resolve it, change to EXECUTING and continue. If not, inform the human. |
| `DONE` | Verify everything is truly complete. Run the Final Verification. |

### Step 5: Update handoff

Before ending your session:
1. Update the Handoff section of the plan with your progress
2. Update `last_updated_at` in the frontmatter
3. Run `bash .ai/scripts/handoff.sh [your-name]` to generate snapshot
4. Fill `Last AI` with your name

### Rules

- **Never** change `status` to `HUMAN_APPROVED`
- **Never** fill `human_*` fields in the frontmatter
- If the repository state diverges from the plan, trust the repo and update the plan
- If you don't understand the handoff context, ask the human for clarification before proceeding
