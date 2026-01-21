---
name: kapso-function-management
description: Create, update, deploy, and invoke Kapso serverless functions (Cloudflare Workers); use when building webhook handlers or glue logic that runs in Kapso Functions.
---

# Kapso Function Management

## Quickstart

Run a script (node or bun):

- `node /agent-skills/kapso-function-management/scripts/list.js --help`
- `bun /agent-skills/kapso-function-management/scripts/list.js --help`

Provide env vars:

- `KAPSO_API_BASE_URL`
- `KAPSO_API_KEY`
- `PROJECT_ID`

## Scripts (one operation per file)

- `scripts/list.js`
- `scripts/get.js --function-id <id>`
- `scripts/create.js --name <name> --code <js> [--description <text>]`
- `scripts/create.js --name <name> --code-file <path> [--description <text>]`
- `scripts/update.js --function-id <id> --name <name> --code <js> [--description <text>]`
- `scripts/update.js --function-id <id> --name <name> --code-file <path> [--description <text>]`
- `scripts/deploy.js --function-id <id>`
- `scripts/invoke.js --function-id <id> --payload <json>`
- `scripts/invoke.js --function-id <id> --payload-file <path>`
- `scripts/logs.js --function-id <id>`

## References and assets

- See `references/REFERENCE.md` for the function runtime contract and handler constraints.
- See `assets/example.json` for a sample create payload.
