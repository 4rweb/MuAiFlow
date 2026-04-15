# muai-smart-router

A MuAiFlow skill that routes plan tasks to optimal model tiers (reasoning/standard/fast) based on complexity — reducing token costs without sacrificing quality.

## What it does

When you generate or execute a MuAiFlow plan, this skill helps the AI assign each task to the right model tier:

| Tier | When | Cost |
|------|------|------|
| **reasoning** | Architecture, planning, debugging, security | Highest |
| **standard** | Business logic, endpoints, integration | Medium |
| **fast** | Boilerplate, styles, tests, i18n, docs | Lowest |

## Install

### Global (works in all projects)

```bash
mkdir -p ~/.claude/skills/muai-smart-router
cp SKILL.md ~/.claude/skills/muai-smart-router/
```

### Project-level (this project only)

```bash
mkdir -p .claude/skills/muai-smart-router
cp SKILL.md .claude/skills/muai-smart-router/
```

## Usage

The skill activates automatically when Claude Code detects relevant tasks (planning, multi-step implementation). You can also invoke it explicitly:

```
Use muai-smart-router to assign model tiers to the tasks in .ai/plans/2026-01-15-my-feature.md
```

## Customize

Edit `SKILL.md` to:

- **Add your own tier mappings** — map `reasoning`/`standard`/`fast` to your provider's specific model names
- **Adjust routing rules** — change which task types go to which tier based on your project's needs
- **Add project-specific overrides** — e.g., "all Firebase tasks use standard tier"

## Model mapping example

Add this to your project's `CLAUDE.md` or `AGENTS.md`:

```markdown
## Model Tier Mapping
- reasoning → [your strongest model]
- standard → [your default model]
- fast → [your cheapest model]
```

The skill references tiers, not specific models — so it works regardless of which provider you use.
