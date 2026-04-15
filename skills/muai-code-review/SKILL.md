---
name: muai-code-review
description: Final code review after plan execution. Checks security, conventions, test coverage, and code quality with file:line evidence. Use after a plan reaches DONE status for a thorough review of all changes.
---

# MuAiFlow Final Code Review

You perform a final review of code produced by plan execution. Every issue must have `file:line` evidence.

## Step 1: Read Context

1. Read the plan at `.ai/plans/YYYY-MM-DD-title.md` — understand what was done
2. Run `bash .ai/scripts/handoff.sh [your-name]` to see current state
3. Identify the modified/created files

## Step 2: Review Each File

For each file cited in the plan as modified or created, **read the full file** and check:

### Project Conventions
- [ ] Naming consistent with codebase
- [ ] Authentication on new endpoints
- [ ] Authorization/ownership checks on mutations
- [ ] Input validation at boundaries (user input, external APIs)
- [ ] DTOs / request validation in place

### Security
- [ ] No hardcoded secrets
- [ ] No SQL injection (parameterized queries)
- [ ] Protected endpoints
- [ ] Input validation at boundaries

### Quality
- [ ] Readable, consistent with project style
- [ ] No `console.log` or debug leftovers
- [ ] Imports correct (no unnecessary relative paths if aliases exist)
- [ ] Types correct (no unnecessary `any` in TypeScript)
- [ ] No unused variables or dead code

## Step 3: Verify Tests

- [ ] Tests mentioned in the plan were created/adapted?
- [ ] Test suite passes?
- [ ] New endpoints have integration tests?

## Step 4: Output Format

```markdown
## Code Review: [plan title]

**Reviewer**: [your name]
**Date**: YYYY-MM-DD
**Files reviewed**: [list]

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
- **Blocker**: will cause a bug, leak data, or break the build — must fix
- **Warning**: doesn't break now, may cause future issues — recommended fix
- **Suggestion**: style or readability — optional

## Rules
- Every issue must reference `file:line` with evidence
- Be specific: not "bad code", but "missing input validation on `title` parameter in `items.service.ts:47`"
- If the code is good, say so — reviews aren't only about problems
