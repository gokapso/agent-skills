---
name: kapso-ops
description: Operate and troubleshoot Kapso projects: webhooks, message delivery, API errors, webhook deliveries, and WhatsApp health checks.
---

# Kapso Ops

## Overview

This skill covers operational diagnostics and support workflows:

- Webhook setup, updates, and testing
- Message delivery timelines and conversation lookup
- External API and webhook delivery logs
- WhatsApp configuration health checks

## Before making changes

- Read the relevant files in `references/` for event catalogs and troubleshooting steps.
- Inspect the exact `scripts/` you will run to confirm endpoint paths and flags.
- Use `assets/` examples to verify expected response shapes.

## Workflow decision tree

### Webhook setup or failures
Use the webhook scripts and `references/webhooks-reference.md`.

### Message delivery issues
Use message debugging scripts and `references/message-debugging-reference.md`.

### Errors and log triage
Use the error/log scripts and `references/triage-reference.md`.

### Config or connectivity health
Use health check scripts and `references/health-reference.md`.

## Quickstart

Set env vars: `KAPSO_API_BASE_URL` (host only, no `/platform/v1`), `KAPSO_API_KEY`, `PROJECT_ID`.

Start here:

- `node scripts/overview.js`
- `node scripts/messages.js`
- `node scripts/list.js --phone-number-id <id>`

## Core workflows

### Webhook setup
1. Create: `node scripts/create.js --phone-number-id <id> --url <https://...> --events <csv|json-array>`.
2. Verify signature handling (see `references/webhooks-overview.md`).
3. Test: `node scripts/test.js --webhook-id <id>`.

### Message delivery investigation
1. List messages: `node scripts/messages.js --phone-number-id <id>`.
2. Inspect a message: `node scripts/message-details.js --message-id <id>`.
3. Find the conversation: `node scripts/lookup-conversation.js --phone-number <e164>`.

### Error and log triage
1. Message errors: `node scripts/errors.js`.
2. External API logs: `node scripts/api-logs.js`.
3. Webhook deliveries: `node scripts/webhook-deliveries.js`.

### Health checks
1. Project overview: `node scripts/overview.js`.
2. Phone number health: `node scripts/whatsapp-health.js --phone-number-id <id>`.

## Commands

### Webhooks
- `node scripts/list.js --phone-number-id <id> [--scope config|project]`
- `node scripts/get.js --phone-number-id <id> --webhook-id <id> [--scope config|project]`
- `node scripts/create.js --phone-number-id <id> --url <https://...> --events <csv|json-array> [--payload-version v1|v2] [--buffer-enabled true|false] [--buffer-window-seconds <n>] [--max-buffer-size <n>] [--inactivity-minutes <n>] [--headers <json>] [--active true|false]`
- `node scripts/update.js --phone-number-id <id> --webhook-id <id> [--url ...] [--events ...] [--payload-version v1|v2] [--buffer-enabled true|false] [--buffer-window-seconds <n>] [--max-buffer-size <n>] [--inactivity-minutes <n>] [--headers <json>] [--active true|false]`
- `node scripts/delete.js --phone-number-id <id> --webhook-id <id> [--scope config|project]`
- `node scripts/test.js --webhook-id <id> [--event-type <value>]`

### Message debugging
- `node scripts/messages.js`
- `node scripts/message-details.js --message-id <id>`
- `node scripts/lookup-conversation.js --phone-number <e164> | --conversation-id <id>`

### Error and log triage
- `node scripts/errors.js`
- `node scripts/api-logs.js`
- `node scripts/webhook-deliveries.js`

### Health checks
- `node scripts/overview.js`
- `node scripts/whatsapp-health.js --phone-number-id <id>`

## Notes

- Use config-level webhooks for `whatsapp.message.*` events.
- Payload version `v2` is recommended for new integrations.
- Meta webhooks provide raw payloads; Kapso webhooks support buffering.
- Message error aggregation uses `/platform/v1/whatsapp/messages` (no time-based filters).
- Plan/subscription details are not exposed via the Platform API.

## References and assets

- `references/webhooks-reference.md`
- `references/webhooks-overview.md`
- `references/webhooks-event-types.md`
- `references/message-debugging-reference.md`
- `references/triage-reference.md`
- `references/health-reference.md`
- `assets/webhooks-example.json`
- `assets/message-debugging-example.json`
- `assets/triage-example.json`
- `assets/health-example.json`

## Related skills

- Automation and functions: `kapso-automation`
- WhatsApp messaging: `whatsapp-messaging`
- Platform API and customers: `kapso-api`
