---
name: kapso-functions
description: Create, update, deploy, and invoke serverless functions (Cloudflare Workers); use when building custom API endpoints, webhook handlers, or background jobs.
---

# Kapso Function Management

## Code rules (must follow)

- Code MUST start with: `async function handler(request, env) {`
- Do NOT use `export`, `export default`, or arrow functions.
- Output only JavaScript source code (no markdown fences).
- Return a `Response` object.

## Quickstart

Run a script (node or bun):

- `node /agent-skills/kapso-functions/scripts/list.js --help`
- `bun /agent-skills/kapso-functions/scripts/list.js --help`

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

- See `references/REFERENCE.md` for the full runtime contract and payload shapes.
- See `assets/example.json` for a sample create payload.
