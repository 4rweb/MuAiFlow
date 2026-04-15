---
# ⚠️ FRONTMATTER — Audit and automation
# DO NOT remove this block. It is parsed by scripts and AIs.
#
# STATUS FLOW:
#   DRAFT → AI_REVIEWED → CHANGES_REQUESTED → HUMAN_APPROVED → EXECUTING → BLOCKED → DONE
#
# STATUS RULES:
#   AI can set: DRAFT→AI_REVIEWED, AI_REVIEWED→CHANGES_REQUESTED,
#     CHANGES_REQUESTED→AI_REVIEWED, HUMAN_APPROVED→EXECUTING,
#     EXECUTING→DONE, EXECUTING→BLOCKED, BLOCKED→EXECUTING
#   ⚠️ HUMAN ONLY sets: → HUMAN_APPROVED
#   If human_approved_by is empty → AI MUST STOP before executing

status: DRAFT
author: codex          # codex | claude | crush
review_required: true  # true = cross-review required | false = optional
reviewer_ai:           # name of the AI that validated
reviewer_ai_at:        # datetime of validation
human_approved_by:     # ⚠️ HUMAN ONLY fills this
human_approved_at:     # ⚠️ HUMAN ONLY fills this
human_notes:           # ⚠️ HUMAN ONLY fills this
branch: feature/your-branch
created_at: YYYY-MM-DDTHH:mm:ss-00:00
last_updated_at:
pr_url:
commit_sha:
---

# [Plan Title]

## Context

[Why we're doing this — the problem or need that motivated this plan.
Include what led to the decision, not just what will be done.]

## Objective

[What we're delivering — expected measurable result.]

### Done Criteria (objective)
- [ ] [criterion 1 — e.g. "endpoint returns 200 with payload X"]
- [ ] [criterion 2 — e.g. "build passes without errors"]
- [ ] [criterion 3 — e.g. "existing tests keep passing"]

## Scope

### Includes
- [what this plan covers]

### Does not include
- [what is explicitly out of scope — prevents scope creep]

## Assumptions

- [assumption 1 — e.g. "table X already exists in staging DB"]
- [assumption 2 — e.g. "user has admin permission"]
- [if an assumption is false, the corresponding task may block]

## Pre-conditions

- [ ] [condition 1 — e.g. "backend running on localhost:3000"]
- [ ] [condition 2 — e.g. "migration 0042 already applied"]
- [ ] [condition 3 — e.g. "NEW_API_KEY env var configured"]

## Impact & Risks

| Dimension | Detail |
|-----------|--------|
| **Affected modules** | [list modules] |
| **Impacted files** | [list main files to be modified] |
| **Break risk** | [high / medium / low] — [what might break and why] |
| **DB migration** | [yes/no] — [if yes: migration name, data loss risk, downtime needed] |
| **New env vars** | [yes/no] — [if yes: variable names and where to configure] |
| **External APIs** | [yes/no] — [if yes: which API, which endpoint, rate limits] |
| **Breaking changes** | [yes/no] — [if yes: what breaks and for whom] |

## Test Strategy

### Automated tests
- [ ] [existing test that must keep passing]
- [ ] [new test to create — file and what it tests]

### Manual test
- [ ] [manual step — e.g. "open /dashboard in browser, create item, verify X"]
- [ ] [manual step — e.g. "call POST /items with payload Y, expect 201"]

### Regression
- [adjacent modules that may have been affected and how to verify]

## Rollback

[If something goes wrong, how to revert:]
1. [step 1 — e.g. "git revert <commit>"]
2. [step 2 — e.g. "run reverse migration if applicable"]
3. [step 3 — e.g. "remove env var if added"]

---

## Tasks

<!-- Model tiers (optional field — omit to default to standard):
  reasoning = complex architecture, planning, critical debugging
  standard  = business logic, integration, normal implementation
  fast      = boilerplate, styles, tests, i18n, docs
  Map tiers to your provider's models in your project's CLAUDE.md or AGENTS.md -->

### T1: [task title]

- **Type**: feat | fix | refactor | test | chore
- **Depends on**: [nothing | T2 | T3]
- **Complexity**: low | medium | high
- **Model**: reasoning | standard | fast (optional — defaults to standard)

**Files:**
| Action | Path |
|--------|------|
| Modify | `src/modules/.../file.ts` |
| Create | `src/modules/.../new-file.ts` |
| Read (ref) | `src/modules/.../reference.ts` |

**Description:**
[What to do, how to do it, in what order. Be specific enough for
another AI or human to execute without ambiguity.]

**Acceptance criteria:**
- [ ] [criterion 1]
- [ ] [criterion 2]

**How to verify:**
```bash
# command to validate this task
npm test -- --grep "test name"
# or manual step
```

---

### T2: [task title]

- **Type**: feat | fix | refactor | test | chore
- **Depends on**: T1
- **Complexity**: medium
- **Model**: fast (optional — defaults to standard)

**Files:**
| Action | Path |
|--------|------|
| Modify | `src/...` |

**Description:**
[What to do]

**Acceptance criteria:**
- [ ] [criterion 1]

**How to verify:**
```bash
npm run build
```

---

## Post-conditions

- [ ] [what must be true after all tasks are done]
- [ ] [another expected result]

## Final Verification

```bash
# 1. Full build
npm run build

# 2. Tests
npm test

# 3. Lint
npm run lint

# 4. Manual verification
# [specific manual step from this plan]
```

---

## Validation (other AI)

<!-- Reviewing AI: fill this section. Authoring AI: do not delete feedback. -->

**Reviewed by**: [AI name]
**Reviewed at**: YYYY-MM-DDTHH:mm:ss-00:00
**Verdict**: ready for human approval | needs adjustments

**Feedback:**
- [suggestion 1]
- [suggestion 2]

---

## Handoff

<!-- Fill when switching AIs. Preserves context between sessions. -->

- **Last AI**: [codex | claude | crush]
- **Last task**: [which task was in progress]
- **Progress**: [what has been done, what remains]
- **Next step**: [exact next step to execute]
- **Blockers**: [anything blocking progress, if any]
- **Extra context**: [state that needs to be preserved for the next AI]
