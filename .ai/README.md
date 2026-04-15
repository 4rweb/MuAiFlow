# MuAiFlow — Quick Reference

## Flow

```
[AI #1] Generate plan  →  DRAFT
[AI #2] Cross-review   →  AI_REVIEWED
[HUMAN] Approve        →  HUMAN_APPROVED  ← only humans set this
[AI]    Execute        →  EXECUTING → DONE
[AI]    Code review    →  optional
```

## context.md — For large reference data

Shell commands have token limits. When your plan needs DB schemas, API response examples,
or any large reference material, put it in `.ai/plans/context.md` and reference it in the command.
The reusable skeleton lives at `.ai/plans/CONTEXT_TEMPLATE.md`; reset the working copy with
`npx muaiflow context --reset` or empty it with `npx muaiflow context --clear`.

```bash
# Instead of stuffing everything into the command:
codex "Follow .ai/prompts/plan-generation.prompt.md to fill .ai/plans/tracked/2025-01-15-my-feature.md
       with a plan to [describe task]. Read .ai/plans/context.md for additional context."
```

The AI reads the file automatically as part of the generation prompt.
Edit `.ai/plans/context.md` with your schema, payloads, and rules before running the command.

---

## Commands

### Generate a plan
```bash
npx muaiflow plan my-feature --tracked   # .ai/plans/tracked/YYYY-MM-DD-my-feature.md
npx muaiflow plan my-feature --local     # .ai/plans/local/YYYY-MM-DD-my-feature.md
npx muaiflow context                     # create context.md if missing
npx muaiflow context --reset             # reset context.md from CONTEXT_TEMPLATE.md
npx muaiflow context --clear             # empty context.md

# Codex
codex "Follow .ai/prompts/plan-generation.prompt.md to fill .ai/plans/tracked/YYYY-MM-DD-title.md with a plan to [describe task]"

# Claude Code / Crush — type in chat or use crush run "..."
"Follow .ai/prompts/plan-generation.prompt.md to fill .ai/plans/tracked/YYYY-MM-DD-title.md with a plan to [describe task]"
```

### Cross-review
```bash
"Follow .ai/prompts/multi-ai-review.prompt.md to validate .ai/plans/tracked/YYYY-MM-DD-title.md"
```

### Execute (after human approval)
```bash
"Follow .ai/prompts/execute-approved-plan.prompt.md to execute .ai/plans/tracked/YYYY-MM-DD-title.md"
```

### Handoff (switching AIs mid-task)
```bash
bash .ai/scripts/handoff.sh [ai-name]
# Then in the next AI:
"Follow .ai/prompts/handoff-resume.prompt.md to resume the plan path reported by handoff.sh"
```

### Final code review (optional)
```bash
"Follow .ai/prompts/final-code-review.prompt.md to review code from .ai/plans/tracked/YYYY-MM-DD-title.md"
```

## Prompt reference

| Prompt | When to use |
|--------|-------------|
| `plan-generation.prompt.md` | AI receives a requirement and generates a structured plan |
| `multi-ai-review.prompt.md` | Different AI validates the plan with evidence and severity |
| `execute-approved-plan.prompt.md` | AI executes after `HUMAN_APPROVED` is set |
| `handoff-resume.prompt.md` | AI resumes work started by another AI |
| `final-code-review.prompt.md` | Optional post-execution code review |

## Critical rules

1. **No AI can set `status: HUMAN_APPROVED`** — ever
2. If `human_approved_by` is empty → AI must stop before executing
3. Cross-review is required for: DB changes, auth, external APIs, refactors > 5 files
4. Run `handoff.sh` before switching AI tools

Full documentation: `.ai/SETUP.md`
