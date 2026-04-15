# context.md — Plan Context File

> This file is your escape hatch for large context that doesn't fit in a command line.
>
> Shell commands have token limits. When your plan requires schemas, API payloads,
> code snippets, or any large reference data, put it here and point the AI to this file.
>
> Usage in your plan generation command:
>
> codex "Follow .ai/prompts/plan-generation.prompt.md to fill .ai/plans/YYYY-MM-DD-plan.md
> with a plan to [describe task]. Read .ai/plans/context.md for additional context."
>
> Replace the content below with your own context. Delete sections you don't need.
> This file is NOT a plan — it is raw reference material for the AI to read.

---

## DB Schema (relevant tables only)

```sql
-- Paste only the tables relevant to this task
-- Example:
-- CREATE TABLE users (
--   id SERIAL PRIMARY KEY,
--   email VARCHAR(255) UNIQUE NOT NULL,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );
```

---

## API Response Examples

```json
// Paste a real response from the endpoint(s) involved
// This helps the AI understand the actual data shape, including null fields,
// numeric-as-string quirks, date formats, etc.
```

---

## Reference Code / Finished Module

```
// If there's a finished module to use as a reference pattern, paste key excerpts here
// or just list the file paths the AI should read:
//
// Reference (already done, use as pattern):
//   src/modules/products/products.service.ts
//   src/modules/products/products.controller.ts
```

---

## Business Rules

- [Rule 1 — e.g. "financial fields must only be returned when access level is 'full'"]
- [Rule 2 — e.g. "legacy URLs with ?id= must redirect to /resource/:id"]

---

## Other Context

[Anything else that would require a very long command-line prompt:
environment quirks, data migration notes, integration contract details, etc.]
