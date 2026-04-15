# MuAiFlow — Full Setup & Documentation

## Overview

MuAiFlow is a structured workflow for using multiple AI agents collaboratively, with **cross-review** and a **human-in-the-loop** gate before any code is executed.

### Tools

| Tool | Role |
|------|------|
| **Codex CLI** | Plan + Execute (primary) |
| **Claude Code** | Cross-review + Execute (fallback) |
| **Crush** | Cross-review + Execute (fallback) |
| **GitHub Copilot** | **Assistive only** — editor suggestions, PR review. Does NOT plan, execute, or fill plan frontmatter. |

---

## Workflow Flows

### Standard Flow (starts with Codex)

```
[CODEX] Generate plan in .ai/plans/YYYY-MM-DD-title.md  →  status: DRAFT
    ↓
[CLAUDE CODE or CRUSH] Validate and improve plan  →  status: AI_REVIEWED
    ↓
⏸️  AI STOPS HERE. Notifies human that plan is ready for approval.
    ↓
[HUMAN] Approves plan → fills "human_approved_by" → status: HUMAN_APPROVED
    ↓
[CODEX] Executes approved plan  →  status: EXECUTING → DONE
    ↓
[CLAUDE CODE or CRUSH] Final code review (optional)
```

### Alternate Flow (Codex unavailable)

```
[CLAUDE CODE] Generate or take over plan  →  status: DRAFT
    ↓
[CRUSH] Validate plan  →  status: AI_REVIEWED
    ↓
⏸️  AI STOPS HERE. Waits for human approval.
    ↓
[HUMAN] Approves  →  status: HUMAN_APPROVED
    ↓
[CLAUDE CODE] Executes
```

### Changes Requested Flow

```
[Reviewing AI] Finds problems  →  status: CHANGES_REQUESTED
    ↓
[Original AI] Makes fixes  →  status: AI_REVIEWED
    ↓
⏸️  AI STOPS HERE. Waits for human approval.
    ↓
[HUMAN] Approves  →  status: HUMAN_APPROVED
```

---

## File Structure

```
.ai/
├── README.md                          # Quick reference
├── SETUP.md                           # This file — full documentation
├── plans/
│   ├── TEMPLATE.md                    # Template — copy for each new plan
│   ├── .gitkeep
│   └── YYYY-MM-DD-title.md           # Generated plans
├── prompts/
│   ├── plan-generation.prompt.md      # Generate plan from requirement
│   ├── multi-ai-review.prompt.md      # Cross-review a plan
│   ├── execute-approved-plan.prompt.md # Execute approved plan
│   ├── handoff-resume.prompt.md       # Resume work from another AI
│   ├── final-code-review.prompt.md    # Optional final code review
│   └── .gitkeep
└── scripts/
    └── handoff.sh                     # Capture context when switching AIs
```

---

## Plan Format

Each plan uses **YAML frontmatter** for audit and automation, followed by Markdown sections. Template at `.ai/plans/TEMPLATE.md`.

### Frontmatter (YAML)

```yaml
---
status: DRAFT                        # DRAFT | AI_REVIEWED | CHANGES_REQUESTED | HUMAN_APPROVED | EXECUTING | BLOCKED | DONE
author: codex                        # codex | claude | crush
review_required: true                # true = cross-review required | false = optional
reviewer_ai:                         # filled by reviewing AI
reviewer_ai_at:
human_approved_by:                   # ⚠️ HUMAN ONLY
human_approved_at:                   # ⚠️ HUMAN ONLY
human_notes:                         # ⚠️ HUMAN ONLY
branch: feature/your-branch
created_at: YYYY-MM-DDTHH:mm:ss-03:00
last_updated_at:
pr_url:
commit_sha:
---
```

### Plan Sections

| Section | Contents | Who fills it |
|---------|----------|--------------|
| **Context** | Why we're doing this | Authoring AI |
| **Objective + Done Criteria** | Expected measurable result | Authoring AI |
| **Scope** (includes / excludes) | Clear boundaries | Authoring AI |
| **Assumptions** | Premises that must be true | Authoring AI |
| **Pre-conditions** | What must be ready before starting | Authoring AI |
| **Impact & Risks** | Modules, files, DB migration, env vars, external APIs | Authoring AI |
| **Test Strategy** | Automated, manual, regression tests | Authoring AI |
| **Rollback** | How to revert if something goes wrong | Authoring AI |
| **Tasks** | Each task with type, files, dependencies, complexity, acceptance criteria | Authoring AI |
| **Post-conditions** | Expected state after execution | Authoring AI |
| **Final Verification** | Build/test/lint commands + manual verification | Authoring AI |
| **Validation (other AI)** | Cross-review feedback | Reviewing AI |
| **Handoff** | Context to transfer between AIs | Outgoing AI |

### Status Flow

```
DRAFT → AI_REVIEWED → HUMAN_APPROVED → EXECUTING → DONE
  │         │                              │
  │         └→ CHANGES_REQUESTED ─→ AI_REVIEWED
  │                                        │
  └────────────────────────────────────────┘→ BLOCKED
```

- **DRAFT**: Plan created, waiting for cross-review
- **AI_REVIEWED**: Another AI validated it — waiting for human approval
- **CHANGES_REQUESTED**: Reviewing AI found issues — authoring AI must fix
- **HUMAN_APPROVED**: ⚠️ **Only the human can reach this state** — ready to execute
- **EXECUTING**: AI is running the tasks
- **BLOCKED**: Execution stalled — human intervention needed
- **DONE**: All tasks completed

---

## Rules

1. **Always start with cross-review** when the plan touches sensitive areas
2. **⚠️ BLOCKING RULE: No AI can set status to `HUMAN_APPROVED`** — only the human fills `human_approved_by`. If empty, the AI MUST STOP before executing any task.
3. **Cross-review required** when the plan involves: database migrations/schema, authentication/authorization, external integrations, large refactors (> 5 files), changes across multiple services, or when an AI is taking over execution from another AI.
4. **Cross-review optional** for: docs, small fixes (< 3 files), isolated single-module changes, chores.
5. **Handoff required** when switching AI tools — fill the Handoff section of the plan.
6. **Plans go in `.ai/plans/`** — standardized format with status tracking.
7. **Fallback order**: Codex → Claude Code → Crush → Copilot (assistive only).

### When cross-review is required

| Condition | Why |
|-----------|-----|
| DB migration or schema changes | Risk of data loss, downtime, broken queries |
| Auth, permissions, tokens | Security risk — data exposure |
| External integrations | API contract may change, rate limits, sensitive data |
| Refactor > 5 files | High regression risk |
| Changes across backend + frontend | Two contact surfaces, more inconsistency risk |
| AI takes over execution from another AI | Second AI lacks context from first — review required |

### Who can set each status

| Status | Who | When |
|--------|-----|------|
| DRAFT → AI_REVIEWED | Reviewing AI | After validating and improving the plan |
| AI_REVIEWED → CHANGES_REQUESTED | Reviewing AI | When issues require correction |
| CHANGES_REQUESTED → AI_REVIEWED | Authoring AI | After making the requested fixes |
| AI_REVIEWED → **HUMAN_APPROVED** | **⚠️ HUMAN ONLY** | When human approves the plan |
| HUMAN_APPROVED → EXECUTING | Executing AI | Start of execution |
| EXECUTING → DONE | Executing AI | All tasks completed |
| EXECUTING → BLOCKED | Executing AI | When a blocker is found |
| BLOCKED → EXECUTING | Executing AI | After resolving the blocker |

---

## How to Use

### Creating a new plan

```bash
# Copy the template
cp .ai/plans/TEMPLATE.md .ai/plans/$(date +%Y-%m-%d)-feature-title.md

# Ask AI to fill it in using the generation prompt
codex "Follow .ai/prompts/plan-generation.prompt.md to fill .ai/plans/YYYY-MM-DD-title.md with a plan to [describe task]"
```

#### Providing large context (schemas, payloads, rules)

Shell commands have token limits — you can't paste a DB schema, a JSON payload example, and a business rule list into a single command without hitting errors.

The solution is `.ai/plans/context.md`: a free-form file you populate **before** running the command, and reference at the end of the command:

```bash
# 1. Edit .ai/plans/context.md with your large reference data:
#    - DB schema excerpts
#    - Real API response examples (shows null fields, date formats, numeric-as-string quirks)
#    - Finished module paths to use as patterns
#    - Business rules that are too long for the command line

# 2. Then run:
codex "Follow .ai/prompts/plan-generation.prompt.md to fill .ai/plans/$(date +%Y-%m-%d)-feature.md \
  with a plan to [describe task]. Read .ai/plans/context.md for additional context."
```

The generation prompt instructs the AI to read `context.md` automatically if it exists.
After the plan is generated, you can clear or update `context.md` for the next task.

### Cross-reviewing a plan

```bash
# Claude Code (type in chat)
"Follow .ai/prompts/multi-ai-review.prompt.md to validate .ai/plans/YYYY-MM-DD-title.md"

# Crush
crush run "Follow .ai/prompts/multi-ai-review.prompt.md to validate .ai/plans/YYYY-MM-DD-title.md"
```

### Executing an approved plan

**⚠️ Before executing, verify:**
1. Plan status is `HUMAN_APPROVED`?
2. `human_approved_by` in frontmatter is filled?
3. If NO: **STOP** and inform the human.

```bash
# Codex
codex "Follow .ai/prompts/execute-approved-plan.prompt.md to execute .ai/plans/YYYY-MM-DD-title.md"

# Claude Code fallback (type in chat)
"Follow .ai/prompts/execute-approved-plan.prompt.md to execute .ai/plans/YYYY-MM-DD-title.md"
```

### Handoff (switching AI tools)

```bash
# Generate snapshot before switching
bash .ai/scripts/handoff.sh [codex|claude|crush]

# The next AI resumes with:
"Follow .ai/prompts/handoff-resume.prompt.md to resume .ai/plans/YYYY-MM-DD-title.md"
```

### Final code review (optional)

```bash
"Follow .ai/prompts/final-code-review.prompt.md to review code from .ai/plans/YYYY-MM-DD-title.md"
```

---

## Tool Configuration

### Codex CLI
- **Project instructions**: `AGENTS.md` in the root (read automatically)
- **Config**: `~/.codex/config.toml`

### Claude Code
- **Project instructions**: `CLAUDE.md` in the root
- **Settings**: `.claude/settings.local.json`

### Crush
- No automatic project instructions file — point to `.ai/SETUP.md` manually when needed

### GitHub Copilot
- **Instructions**: `.github/copilot-instructions.md`
- Cannot plan, execute plans, or fill plan frontmatter

---

## Orchestration Patterns

MuAiFlow's file-based protocol supports multiple ways to connect AI agents. Choose the pattern that fits your setup.

### Pattern 1: File-Based Handoff (MuAiFlow default)

The simplest approach — no extra tools needed.

```
AI #1 generates plan → saves .ai/plans/YYYY-MM-DD-feature.md
Human switches to AI #2 → AI #2 reads plan file → cross-reviews
Human approves → AI #1 or #2 executes
```

**When to use:** Always works. Start here.
**MuAiFlow integration:** The plan file IS the integration point. Both AIs read/write the same file.
**Pros:** Universal, no setup, works with any tool
**Cons:** Manual tool switching

### Pattern 2: MCP Bridge

One AI exposes itself as an MCP server, another connects as client — enabling automated delegation.

```
Gemini CLI (orchestrator) ←MCP→ Claude Code (executor)
Gemini plans → delegates coding tasks to Claude via MCP → Claude writes code
```

**When to use:** When you want one AI to automatically delegate to another without manual switching.
**MuAiFlow integration:** The orchestrator reads the plan and delegates specific tasks via MCP calls. Each task maps to a MCP tool invocation.
**Pros:** Automated delegation, no copy-paste
**Cons:** Requires MCP setup, tool-specific configuration

```bash
# Example: Claude Code as MCP server
claude mcp serve
# Gemini connects and delegates task T3 from the plan
```

### Pattern 3: CLI Delegation

The orchestrator AI calls other AIs through their CLI interfaces via shell commands.

```
Orchestrator AI → shell → codex "execute task T3 from .ai/plans/feature.md"
Orchestrator AI → shell → claude "review task T3 output"
```

**When to use:** When your AIs have CLI interfaces and you want simple automation.
**MuAiFlow integration:** Each task in the plan becomes a CLI command. The orchestrator reads task descriptions and builds the command.
**Pros:** Works with any CLI-based tool, simple to set up
**Cons:** Context isolation (each CLI call starts fresh), error handling is manual

### Pattern 4: Parallel Execution with Git Worktrees

Multiple AIs work simultaneously on independent tasks, each in an isolated git worktree.

```
Plan has 5 tasks:
  T1 (no deps) → AI #1 in worktree-1 (branch: feat/t1)
  T2 (no deps) → AI #2 in worktree-2 (branch: feat/t2)
  T3 (depends on T1) → waits
  T4 (no deps) → AI #3 in worktree-3 (branch: feat/t4)
  T5 (depends on T2, T4) → waits

After T1 done → T3 starts
After T2+T4 done → T5 starts
Final: merge all branches
```

**When to use:** Plans with many independent tasks. Massive speedup potential.
**MuAiFlow integration:** Use the `Depends on` field in each task to determine which can run in parallel. Tasks with no dependencies are candidates for parallel execution.
**Pros:** 2-4x speedup for plans with independent tasks
**Cons:** Merge conflicts, coordination complexity, requires git worktree setup

```bash
# Setup worktrees
git worktree add ../worktree-t1 -b feat/t1
git worktree add ../worktree-t2 -b feat/t2
# Run AIs in each worktree simultaneously
```

### Pattern 5: Brain + Hands Split

One AI (strong reasoning) plans and reviews — never writes code. Another AI (high throughput) executes — follows the plan literally. The plan file is the contract between them.

```
Brain AI (reasoning tier):
  → Generates plan with detailed task descriptions
  → Cross-reviews execution output
  → Makes architectural decisions

Hands AI (standard/fast tier):
  → Reads plan, executes tasks in order
  → Follows instructions literally
  → Reports blockers back to plan file
```

**When to use:** When you have a clear split between a premium model (expensive but smart) and a workhorse model (cheap but capable).
**MuAiFlow integration:** The Brain AI sets `Model: reasoning` on its own tasks. The Hands AI executes `standard` and `fast` tasks. The plan's Handoff section maintains context between them.
**Pros:** Optimal cost efficiency, clear separation of concerns
**Cons:** The executor may misinterpret ambiguous instructions — write very specific task descriptions

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| AI tokens ran out mid-execution | Switch to another AI using handoff |
| Plan too large | Split into sub-plans in `.ai/plans/` |
| AI doesn't follow the format | Point explicitly to `TEMPLATE.md` |
| AI set status to `HUMAN_APPROVED` | **Rule violation** — revert the status, inform the human |
| Handoff lost context | Check Handoff section of the plan, add more detail |
| Execution stalled (BLOCKED) | AI explains the reason, human decides how to proceed |

---

## Token Optimization

AI coding agents consume tokens on every session — and most of the waste comes from context files loaded automatically before you even type a prompt. This section helps you audit and reduce that cost.

### 1. Context Audit Checklist

Run this audit periodically (especially as your project grows):

- [ ] Count total lines loaded per session: `wc -l CLAUDE.md AGENTS.md .claude/CLAUDE.md MEMORY.md`
- [ ] Check for `@references` in CLAUDE.md — each `@file` expands inline (hidden token cost)
- [ ] Identify duplicated content between files — same info in two files = double the tokens
- [ ] **Rule: each piece of information should exist in exactly ONE file**
- [ ] **Rule: MEMORY.md should only contain what doesn't exist anywhere else**
- [ ] Target: under 150 lines total across all auto-loaded files

### 2. What Loads When (by tool)

| File | Claude Code | Codex CLI | When |
|------|-------------|-----------|------|
| `CLAUDE.md` (root) | ✅ always | — | Every session |
| `.claude/CLAUDE.md` | ✅ always | — | Every session |
| `AGENTS.md` (root) | — | ✅ always | Every session |
| `MEMORY.md` | ✅ always | — | Every session |
| `@file` references | ✅ expanded inline | — | When parent file loads |
| Skills (`.claude/skills/`) | On demand | — | Only when invoked (free until used) |
| Hooks (`.claude/hooks.json`) | Per event | — | Each "prompt" hook = 1 API call |

**Key insight**: Skills cost zero tokens until invoked. Move detailed guides from CLAUDE.md/AGENTS.md into skills — they load on demand instead of every session.

### 3. Compaction Strategies

- **Terse, imperative style** — not prose. "Use snake_case for DB columns" not "We follow the convention of using snake_case for all database column names"
- **Reference by path, don't inline** — instead of pasting a 50-line code example, write "Follow pattern in `src/modules/products/products.service.ts`"
- **One file per concern** — project rules in CLAUDE.md, memory in MEMORY.md, workflow in `.ai/SETUP.md`. No overlap.
- **Remove stale content** — old session history, completed TODOs, resolved decisions. If it's done, delete it.
- **Move detailed guides to skills** — a 200-line coding standards doc costs tokens every session as CLAUDE.md, but costs zero as a skill until invoked

### 4. Hook Optimization

Each hook with `"type": "prompt"` makes a separate API call to the model. Three hooks on the same event = three API calls per trigger.

- **Unify hooks on the same event** — combine 3 Write validators into 1 prompt that checks all 3 things
- **Remove SessionStart hooks** if CLAUDE.md already covers the same context
- **Remove UserPromptSubmit hooks** for rare events — a commit format hook runs on 100% of messages but is useful for 1%
- **Prefer PreToolUse over UserPromptSubmit** — it only fires when the AI actually does something, not on every message

**Before:**
```
PreToolUse (Write): style validator     → 1 API call
PreToolUse (Write): i18n validator      → 1 API call
PreToolUse (Write): a11y validator      → 1 API call
UserPromptSubmit: commit format         → 1 API call (every message)
SessionStart: load context              → 1 API call
─────────────────────────────────────────
Total: up to 4 extra calls per turn
```

**After:**
```
PreToolUse (Write|Edit): unified validator → 1 API call (only on writes)
─────────────────────────────────────────
Total: 0-1 extra calls per turn
```

### 5. Model Routing Strategy

Not every task needs the most powerful (expensive) model. MuAiFlow plans include a `Model` field per task with three tiers:

| Tier | Use for | Examples |
|------|---------|----------|
| **reasoning** | Architecture, planning, complex debugging, security review | "Design the auth flow", "Debug race condition" |
| **standard** | Business logic, endpoints, integration, normal implementation | "Implement user CRUD", "Add API endpoint" |
| **fast** | Boilerplate, styles, tests, i18n, documentation, mocks | "Generate translation file", "Write unit tests" |

Map tiers to your provider's models in your project's CLAUDE.md or AGENTS.md. Example mapping:

```
reasoning → your strongest model (for critical thinking)
standard  → your default model (for daily work)
fast      → your cheapest model (for mechanical tasks)
```

The planner AI sets the tier per task. The executor uses the mapping to pick the right model. This alone can reduce token costs by 40-60% on multi-task plans.
