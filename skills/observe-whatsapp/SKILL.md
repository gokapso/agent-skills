---
name: observe-whatsapp
description: "Observe and troubleshoot WhatsApp in Kapso: search Logs across API, Meta webhook, workflow, and webhook-delivery events; debug message delivery; inspect webhook retries; triage API errors; and run health checks. Use when investigating production issues, message failures, workflow behavior, or webhook delivery problems."
---

# Observe WhatsApp

## When to use

Use this skill for operational diagnostics: Logs search, message delivery investigation, webhook delivery debugging, error triage, workflow event correlation, and WhatsApp health checks.

## Setup

Preferred path:
- Kapso CLI installed and authenticated (`kapso login`)
- Start with `kapso status` to confirm project access and available WhatsApp numbers

Fallback path:
Env vars:
- `KAPSO_API_BASE_URL` (host only, no `/platform/v1`)
- `KAPSO_API_KEY`

## How to

### Search logs

Use Logs search first when the user gives an identifier, endpoint, message ID, workflow execution ID, webhook delivery ID, request ID, or a vague "what happened?" debugging prompt.

Preferred path:
1. Search the current project: `kapso logs search --query "<id-or-text>" --period 24h --source all --limit 20 --output json`
2. If the exact search is empty, retry with `--period 7d` before concluding there are no logs.
3. Add `--problems-only` for broad error scans; leave it off when reconstructing an exact timeline.
4. Add explicit filters only when they intentionally narrow the search:
   - Workflow execution: `kapso logs search --query "<execution-id>" --source flow_event --filter flow_execution_id=<execution-id> --period 7d --output json`
   - API endpoint/status: `kapso logs search --source external_api_log --filter endpoint_contains=/messages --filter response_status=500 --period 24h --output json`
   - WhatsApp message ID: `kapso logs search --query "wamid..." --source whatsapp_webhook_event --filter whatsapp_message_id=wamid... --period 7d --output json`
   - Webhook delivery: `kapso logs search --source webhook_delivery --filter webhook_id=<webhook-id> --period 24h --output json`

Fallback path:
1. Search via Platform API: `node scripts/log-search.js --query "<id-or-text>" --period 24h --source all --limit 20`
2. Use filters with repeated flags: `node scripts/log-search.js --source flow_event --filter flow_execution_id=<execution-id> --period 7d`
3. Discover source and filter options: `node scripts/log-search.js --catalog true`

Logs sources are `external_api_log`, `whatsapp_webhook_event`, `flow_event`, and `webhook_delivery`. The Platform API fallback returns indexed Logs payloads for the API-key project and requires Logs and Elasticsearch to be enabled.

### Investigate message delivery

Preferred path:
1. Search the WAMID or customer phone first: `kapso logs search --query "<wamid-or-phone>" --period 7d --source all --limit 20 --output json`
2. Resolve the number: `kapso whatsapp numbers resolve --phone-number "<display-number>" --output json`
3. List recent messages: `kapso whatsapp messages list --phone-number "<display-number>" --limit 50 --output json`
4. Inspect a specific message: `kapso whatsapp messages get <message-id> --phone-number-id <id> --output json`
5. Inspect the conversation: `kapso whatsapp conversations list --phone-number "<display-number>" --output json`

Fallback path:
1. List messages: `node scripts/messages.js --phone-number-id <id>`
2. Inspect message: `node scripts/message-details.js --message-id <id>`
3. Find conversation: `node scripts/lookup-conversation.js --phone-number <e164>`

### Triage errors

Preferred path:
1. Confirm project and number state: `kapso status`
2. Run number health: `kapso whatsapp numbers health --phone-number "<display-number>" --output human`
3. Search recent problem logs: `kapso logs search --problems-only --period 24h --source all --limit 20 --output json`
4. Inspect related templates when relevant: `kapso whatsapp templates list --phone-number "<display-number>" --output json`

Fallback path:
1. Logs search: `node scripts/log-search.js --problems-only true --period 24h --limit 20`
2. Message errors: `node scripts/errors.js`
3. API logs: `node scripts/api-logs.js`
4. Webhook deliveries: `node scripts/webhook-deliveries.js`

### Run health checks

Preferred path:
1. Project overview: `kapso status`
2. Phone number health: `kapso whatsapp numbers health --phone-number "<display-number>" --output human`

Fallback path:
1. Project overview: `node scripts/overview.js`
2. Phone number health: `node scripts/whatsapp-health.js --phone-number-id <id>`

## Scripts

### Messages

| Script | Purpose |
|--------|---------|
| `messages.js` | List messages |
| `message-details.js` | Get message details |
| `lookup-conversation.js` | Find conversation by phone or ID |

### Errors and logs

| Script | Purpose |
|--------|---------|
| `log-search.js` | Search Logs across API, Meta webhook, workflow, and webhook-delivery sources |
| `errors.js` | List message errors |
| `api-logs.js` | List external API logs |
| `webhook-deliveries.js` | List webhook delivery attempts |

### Health

| Script | Purpose |
|--------|---------|
| `overview.js` | Project overview |
| `whatsapp-health.js` | Phone number health check |

### OpenAPI

| Script | Purpose |
|--------|---------|
| `openapi-explore.mjs` | Explore OpenAPI (search/op/schema/where) |

Install deps (once):
```bash
npm i
```

Examples:
```bash
node scripts/openapi-explore.mjs --spec platform search "webhook deliveries"
node scripts/openapi-explore.mjs --spec platform op listWebhookDeliveries
node scripts/openapi-explore.mjs --spec platform schema WebhookDelivery
```

## Notes

- For webhook setup (create/update/delete, signature verification, event types), use `integrate-whatsapp`.
- For Project Event definitions, event-triggered workflow setup, or `emit_event` graph changes, use `automate-whatsapp`.
- Prefer resolving a display phone number to the canonical `phone_number_id` before deep debugging.
- Prefer Logs search before older single-resource log endpoints when correlating across messages, workflows, API calls, and webhook deliveries.
- Keep the scripts as the fallback path when the CLI is unavailable or when you need API-log or webhook-delivery inspection.

## References

- [references/message-debugging-reference.md](references/message-debugging-reference.md) - Message debugging guide
- [references/triage-reference.md](references/triage-reference.md) - Error triage guide
- [references/health-reference.md](references/health-reference.md) - Health check guide

## Related skills

- `integrate-whatsapp` - Onboarding, webhooks, messaging, templates, flows
- `automate-whatsapp` - Workflows, agents, and automations

<!-- FILEMAP:BEGIN -->
```text
[observe-whatsapp file map]|root: .
|.:{package.json,SKILL.md}
|assets:{health-example.json,message-debugging-example.json,triage-example.json}
|references:{health-reference.md,message-debugging-reference.md,triage-reference.md}
|scripts:{api-logs.js,errors.js,log-search.js,lookup-conversation.js,message-details.js,messages.js,openapi-explore.mjs,overview.js,webhook-deliveries.js,whatsapp-health.js}
|scripts/lib/messages:{args.js,kapso-api.js}
|scripts/lib/status:{args.js,kapso-api.js}
|scripts/lib/triage:{args.js,kapso-api.js}
```
<!-- FILEMAP:END -->
