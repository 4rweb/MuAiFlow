# Contributing to MuAiFlow

Thanks for your interest in contributing!

## What we're looking for

- **New prompts** — better instructions for specific AI tools or use cases
- **Bug fixes** — incorrect behavior in `handoff.sh` or prompt instructions
- **Examples** — real-world `CLAUDE.md` / `AGENTS.md` setups for different stacks
- **Translations** — prompts in languages other than English/Portuguese
- **Documentation** — clearer explanations, more diagrams

## How to contribute

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-improvement`
3. Make your changes
4. Open a PR with a clear description of what you changed and why

## Guidelines

- **Prompts must be tool-agnostic** — they should work with any AI agent that reads files
- **No project-specific references** — keep everything generic (no framework names, no specific file paths)
- **The human-in-the-loop rule is non-negotiable** — no prompt should ever instruct an AI to set `status: HUMAN_APPROVED`
- Keep the `TEMPLATE.md` backward compatible — existing plans should still be valid

## Reporting issues

Open a GitHub issue with:
- What you expected to happen
- What actually happened
- Which AI tool you were using
- The relevant prompt or plan snippet
