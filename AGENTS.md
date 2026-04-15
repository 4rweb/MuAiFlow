# AGENTS.md — MuAiFlow

> Read automatically by Codex CLI. See also `.ai/SETUP.md` for the full workflow reference.

## What This Repo Is

MuAiFlow is a **workflow framework** (not an application) — a set of prompts, templates, and scripts to structure multi-AI collaboration with a human-in-the-loop approval gate. There is no server to run. The deliverables are:

- `.ai/` — the workflow directory users copy into their own projects
- `vscode-extension/` — a VS Code extension that inserts `@file` references in markdown
- `examples/` — template `AGENTS.md` and `CLAUDE.md` files users customize for their own projects
- `install.sh` — installs the `.vsix` extension via the `code` CLI

## Directory Structure

```
.ai/
├── plans/
│   ├── TEMPLATE.md          # The canonical plan format — DO NOT change frontmatter keys
│   └── context.md           # User-populated large-context file (schemas, payloads, rules)
├── prompts/                 # One prompt per workflow phase — tool-agnostic
├── scripts/
│   └── handoff.sh           # Generates a handoff snapshot (git status, plan state)
├── README.md                # Quick-reference card
└── SETUP.md                 # Full documentation (canonical source of truth)

examples/
├── AGENTS.md.example        # Template for Codex CLI users
└── CLAUDE.md.example        # Template for Claude Code users

vscode-extension/
├── src/extension.ts         # Single-file VS Code extension (TypeScript)
├── package.json             # Extension manifest, commands, keybindings, config
└── tsconfig.json

install.sh                   # Installs muaiflow-file-ref.vsix via `code --install-extension`
```

## VS Code Extension — Build & Install

All commands run from `vscode-extension/`:

```bash
npm run compile          # tsc -p ./ → out/extension.js
npm run watch            # tsc -watch -p ./
vsce package --no-dependencies --allow-missing-repository   # → .vsix
```

After packaging, copy the `.vsix` to the repo root and install:

```bash
cp vscode-extension/muaiflow-file-ref-*.vsix muaiflow-file-ref.vsix
code --install-extension muaiflow-file-ref.vsix --force
```

Or simply `bash install.sh` from the repo root.

**Version bumping is required for reinstall** — VS Code silently ignores `--install-extension` if the same version is already installed. Always bump `version` in `package.json` before repackaging.

## Non-Obvious Gotchas

### The HUMAN_APPROVED rule is the core invariant
**No AI, under any circumstances, can set `status: HUMAN_APPROVED` or fill `human_approved_by`.** This is enforced by convention, not code. Any prompt, template, or script change that could enable an AI to set this status is a breaking change and must be rejected.

### `TEMPLATE.md` frontmatter keys are a contract
The YAML frontmatter in `.ai/plans/TEMPLATE.md` is parsed by `handoff.sh` with regex patterns like `grep -oP '(?<=^status: ).*'`. Changing key names breaks the script. Adding new keys is safe; renaming or removing existing ones is not.

### `context.md` is ephemeral user data — keep it generic
The file at `.ai/plans/context.md` is designed to hold per-task reference data (DB schemas, API payloads, business rules) that the user replaces before each plan. Do not add logic or structure that assumes its contents — it is intentionally free-form.

### Prompts are tool-agnostic by design
All prompts in `.ai/prompts/` must work with any AI tool that can read files. No framework names, no tool-specific syntax, no hardcoded file paths beyond the `.ai/` directory. This is a contribution requirement.

### `handoff.sh` is intentionally non-invasive
It only reads: branch name, `git status --short`, `git diff --stat`, recent commits, and the latest plan's frontmatter. It never reads `.env`, never produces full diffs, never modifies any file. Do not add writes or network calls.

### Extension activates on `onLanguage:markdown`
The extension uses `"activationEvents": ["onLanguage:markdown"]` in `package.json`. It activates the moment any Markdown file is opened — not before. The `@` trigger and the `Cmd+Alt+R` command only work after activation. This is intentional to avoid loading the extension for non-markdown workflows.

### `@` trigger uses `onDidChangeTextDocument`, not CompletionProvider
The `@` keystroke is detected via a text change listener, not a VS Code `CompletionItemProvider`. When detected, it opens a Quick Pick (with loading spinner). This approach was chosen because CompletionProviders don't activate the extension — they only work if the extension is already active, creating a deadlock with lazy activation.

### Version bumping is required for reinstall
VS Code silently skips `code --install-extension` if the same version is already installed. Always bump `version` in `package.json` before repackaging. Use `--force` flag as well.

### The `.vsix` is committed to the repo
`muaiflow-file-ref.vsix` is the distributable extension binary. It is tracked in git. After `npm run package`, the new `.vsix` replaces the old one and should be committed.

### No test suite for the extension
There are no automated tests for the VS Code extension. Manual testing is done by installing the `.vsix` and verifying `@` trigger and `Cmd+Alt+R` in a markdown file.

## Workflow Status Machine

```
DRAFT → AI_REVIEWED → HUMAN_APPROVED → EXECUTING → DONE
             ↓                              ↓
    CHANGES_REQUESTED → AI_REVIEWED     BLOCKED → EXECUTING
```

| Status | Set by |
|--------|--------|
| `DRAFT` | Authoring AI |
| `AI_REVIEWED` | Reviewing AI |
| `CHANGES_REQUESTED` | Reviewing AI |
| `HUMAN_APPROVED` | **Human only** |
| `EXECUTING` | Executing AI |
| `BLOCKED` | Executing AI |
| `DONE` | Executing AI |

## Cross-Review Triggers

Cross-review is **required** (not optional) when a plan involves any of:
- DB migration or schema changes
- Authentication / authorization / permissions
- External API integrations
- Refactor touching > 5 files
- Changes across multiple apps/services
- AI taking over execution from another AI

## Prompt Reference

| Prompt | Phase |
|--------|-------|
| `plan-generation.prompt.md` | AI generates a structured plan from a requirement |
| `multi-ai-review.prompt.md` | Different AI validates — evidence-based, cites file:line |
| `execute-approved-plan.prompt.md` | AI executes after `HUMAN_APPROVED` is verified |
| `handoff-resume.prompt.md` | AI resumes work started by another AI |
| `final-code-review.prompt.md` | Optional post-execution code review |

## Contributing Constraints

- Prompts must remain tool-agnostic (no Codex/Claude/Crush-specific syntax)
- No project-specific references in any file under `.ai/` or `examples/`
- `TEMPLATE.md` must stay backward-compatible — existing plans must remain valid
- The human-in-the-loop invariant (`HUMAN_APPROVED` by human only) is non-negotiable
