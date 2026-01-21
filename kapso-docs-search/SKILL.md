---
name: kapso-docs-search
description: Search Kapso and WhatsApp docs with search_docs for factual answers.
---

# Kapso Docs Search

## When to use this skill
- Use when: the user asks about API endpoints, payloads, error codes, SDK usage, or product behavior not already in context.
- Do not use when: the answer is visible in the current UI context or a specialized skill provides the exact steps.

## How to use
- Pick the source: `kapso` for platform docs, `whatsapp` for Meta/Cloud API docs and policies.
- Run `search_docs` with a short query; refine with additional calls if needed.
- Base the answer on results; if nothing relevant is found, say so and ask for more details.

## Tool
- `search_docs(source, query, match_count?)`
