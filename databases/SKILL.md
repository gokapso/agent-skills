---
name: databases
description: Explore and modify project D1 database tables and rows; use when users need to inspect data or run CRUD operations.
---

# Kapso Database Management

## Quickstart

Run a script (node or bun):

- `node /agent-skills/databases/scripts/list-tables.js --help`
- `bun /agent-skills/databases/scripts/list-tables.js --help`

Provide env vars:

- `KAPSO_API_BASE_URL` (root, e.g. `https://api.kapso.ai`)
- `KAPSO_API_KEY`
- `PROJECT_ID`

## Scripts (one operation per file)

- `scripts/list-tables.js`
- `scripts/get-table.js --table <name> [--limit <n>]`
- `scripts/query-rows.js --table <name> [--filters <json>] [--select <cols>] [--order <col.asc|desc>] [--limit <n>] [--offset <n>]`
- `scripts/create-row.js --table <name> --data <json>`
- `scripts/update-row.js --table <name> --data <json> (--id <row-id> | --filters <json>)`
- `scripts/upsert-row.js --table <name> --data <json> [--upsert-key <column>] [--filters <json> | --id <row-id>]`
- `scripts/delete-row.js --table <name> (--id <row-id> | --filters <json>)`

## Notes

- Raw SQL execution is not supported via the Platform API.

## References and assets

- See `references/REFERENCE.md` for filter syntax and query patterns.
- See `assets/example.json` for sample filter and row payloads.
