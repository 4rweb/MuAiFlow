---
name: muai-smart-router
description: Routes tasks to optimal model tiers (reasoning/standard/fast) based on complexity. Use when planning features, executing multi-task plans, or any work that benefits from cost-efficient model selection.
---

# MuAiFlow Smart Router

You route tasks to the optimal model tier to balance quality and cost. When given a plan or task list, assign each task a tier.

## Model Tiers

### reasoning — Complex thinking
- Architecture and system design decisions
- Planning multi-step features from scratch
- Debugging complex issues (race conditions, data corruption, auth flaws)
- Security review and threat modeling
- Code review for critical paths

### standard — Normal implementation
- Business logic (services, controllers, use cases)
- API endpoints and integrations
- Database queries and migrations
- Screen/component implementation with logic
- Refactoring existing code

### fast — Mechanical tasks
- Generating style files, CSS, themes
- Writing translation/i18n files
- Creating boilerplate (DTOs, interfaces, types)
- Writing unit tests for existing code
- Documentation and README updates
- Creating mock data and fixtures

## Routing Rules

1. Check the task's `Complexity` field — `high` maps to `reasoning`, `medium` to `standard`, `low` to `fast`
2. Override by task nature — a "low complexity" auth change is still `reasoning`
3. When in doubt, use `standard` — it's the safe default
4. Never use `fast` for: auth, permissions, data migrations, external API contracts

## Dispatch Example

Given a plan: "Implement user watchlist feature"

```
T1: Design watchlist data model and API contract    → reasoning
T2: Create DB migration                             → standard
T3: Implement watchlist service + repository         → standard
T4: Implement watchlist screen with ViewModel        → standard
T5: Generate styles file                             → fast
T6: Add i18n translations                            → fast
T7: Write unit tests                                 → fast
```

Result: 1 reasoning + 3 standard + 3 fast — significant cost savings vs. running everything on the strongest model.

## Parallel Dispatch

Independent tasks on the same tier can run in parallel:

```
[reasoning] T1: Design data model
  ↓ (depends on T1)
[standard]  T2: Migration  |  T3: Service  |  T4: Screen    ← parallel
  ↓ (depends on T2-T4)
[fast]      T5: Styles  |  T6: i18n  |  T7: Tests           ← parallel
```

## Instructions for Planner AI

When generating a MuAiFlow plan:
1. Set the `Model` field on each task using tier names: `reasoning`, `standard`, or `fast`
2. Consider task dependencies — a `fast` task that depends on a `reasoning` task still waits
3. Group independent same-tier tasks for potential parallel execution
4. Add a cost summary at the end: "X reasoning + Y standard + Z fast"
