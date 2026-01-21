---
name: kapso-webhook-management
description: Manage Kapso WhatsApp webhooks (list/get/create/update/delete/test), apply webhook scope rules, and use when configuring or debugging webhook integrations.
---

# Kapso Webhook Management

## Quickstart

Run a script (node or bun):

- `node /agent-skills/kapso-webhook-management/scripts/list.js --help`
- `bun /agent-skills/kapso-webhook-management/scripts/list.js --help`

Provide env vars:

- `KAPSO_API_BASE_URL`
- `KAPSO_API_KEY`
- `PROJECT_ID`

## Scripts (one operation per file)

Use config-level webhooks for WhatsApp message events.

- `scripts/list.js --phone-number-id <id> [--scope config|project]`
- `scripts/get.js --phone-number-id <id> --webhook-id <id> [--scope config|project]`
- `scripts/create.js --phone-number-id <id> --url <https://...> --events <csv|json-array> [--payload-version v1|v2] [--buffer-enabled true|false] [--buffer-window-seconds <n>] [--max-buffer-size <n>] [--inactivity-minutes <n>] [--headers <json>] [--active true|false]`
- `scripts/update.js --phone-number-id <id> --webhook-id <id> [--url ...] [--events ...] [--payload-version v1|v2] [--buffer-enabled true|false] [--buffer-window-seconds <n>] [--max-buffer-size <n>] [--inactivity-minutes <n>] [--headers <json>] [--active true|false]`
- `scripts/delete.js --phone-number-id <id> --webhook-id <id> [--scope config|project]`
- `scripts/test.js --webhook-id <id> [--event-type <value>]`

## References and assets

- See `references/REFERENCE.md` for webhook scopes, event catalog, signature verification, payload versions, and buffering rules.
- See `assets/example.json` for a sample webhook create payload.
