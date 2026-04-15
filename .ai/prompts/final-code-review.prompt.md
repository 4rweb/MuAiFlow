---
name: final-code-review
description: Prompt for final code review after plan execution
---

# Final Code Review Prompt

## When to use

After a plan has been executed (status DONE or about to change to DONE), another AI performs the final review of the produced code.

## Instructions

### Step 1: Read context

1. Read the plan at `.ai/plans/YYYY-MM-DD-title.md` — understand what was done
2. Run `bash .ai/scripts/handoff.sh [your-name]` to see the current state
3. Identify the modified/created files

### Step 2: Review each modified file

For each file cited in the plan as modified or created:

1. **Read the full file** — not just the diff
2. Check against project conventions (`CLAUDE.md` / `AGENTS.md`):
   - [ ] Naming conventions consistent with the rest of the codebase
   - [ ] Authentication on new endpoints
   - [ ] Authorization/ownership checks on mutations
   - [ ] Input validation at system boundaries (user input, external APIs)
   - [ ] DTOs / request validation in place
   - [ ] No modifications to shared UI library components (if applicable)
3. Check security:
   - [ ] No hardcoded secrets
   - [ ] No SQL injection (parameterized queries)
   - [ ] Protected endpoints
   - [ ] Input validation at boundaries
4. Check quality:
   - [ ] Code is readable and consistent with the rest of the project
   - [ ] No `console.log` or debug leftovers
   - [ ] Imports are correct (no unnecessary relative paths if aliases exist)
   - [ ] TypeScript types are correct (no unnecessary `any`)
   - [ ] No unused variables or dead code

### Step 3: Verify tests

- [ ] Automated tests mentioned in the plan were created/adapted?
- [ ] Run the test suite and verify it passes
- [ ] If the plan created new endpoints, are there integration tests?

### Step 4: Feedback Format

```markdown
## Code Review: [plan title]

**Reviewer**: [AI name]
**Date**: YYYY-MM-DD
**Files reviewed**: [list of files read]

### Issues Found
| # | Severity | File:line | Description |
|---|---------|-----------|-------------|
| 1 | blocker | `path:NN` | [description with evidence] |
| 2 | warning | `path:NN` | [description with evidence] |
| 3 | suggestion | `path:NN` | [description with evidence] |

### Positives
- [what was done well]

### Verdict
- [ ] Code ready for commit/PR — no blocking issues
- [ ] Needs adjustments — blocking issues listed above
```

### Severities
- **Blocker**: Will cause a bug, leak data, or break the build. Must be fixed before commit.
- **Warning**: Doesn't break now, but may cause future issues. Recommended to fix.
- **Suggestion**: Style or readability improvement. Optional.

### Rules
- Every issue must have `file:line` as evidence
- Be specific: don't say "bad code", say "missing input validation on `title` parameter in `items.service.ts:47`"
- If the code is good, say so — a review isn't only about finding problems
