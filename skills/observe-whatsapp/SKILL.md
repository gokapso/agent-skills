---
name: observe-whatsapp
description: "Observe and troubleshoot WhatsApp in Kapso: debug message delivery, inspect webhook deliveries/retries, triage API errors, review findings, and run health checks. Use when investigating production issues, message failures, or webhook delivery problems."
---

# Observe WhatsApp

## When to use

Use this skill for operational diagnostics: message delivery investigation, webhook delivery debugging, error triage, findings review, and WhatsApp health checks.

## Setup

Preferred path:
- Kapso CLI installed and authenticated (`kapso login`)
- Start with `kapso status` to confirm project access and available WhatsApp numbers

Fallback path:
Env vars:
- `KAPSO_API_BASE_URL` (host only, no `/platform/v1`)
- `KAPSO_API_KEY`

## How to

### Investigate message delivery

Preferred path:
1. Resolve the number: `kapso whatsapp numbers resolve --phone-number "<display-number>" --output json`
2. List recent messages: `kapso whatsapp messages list --phone-number "<display-number>" --limit 50 --output json`
3. Inspect a specific message: `kapso whatsapp messages get <message-id> --phone-number-id <id> --output json`
4. Inspect the conversation: `kapso whatsapp conversations list --phone-number "<display-number>" --output json`

Fallback path:
1. List messages: `node scripts/messages.js --phone-number-id <id>`
2. Inspect message: `node scripts/message-details.js --message-id <id>`
3. Find conversation: `node scripts/lookup-conversation.js --phone-number <e164>`

### Triage errors

Preferred path:
1. Confirm project and number state: `kapso status`
2. Run number health: `kapso whatsapp numbers health --phone-number "<display-number>" --output human`
3. Inspect related templates when relevant: `kapso whatsapp templates list --phone-number "<display-number>" --output json`

Fallback path:
1. Message errors: `node scripts/errors.js`
2. API logs: `node scripts/api-logs.js`
3. Webhook deliveries: `node scripts/webhook-deliveries.js`

### Run health checks

Preferred path:
1. Project overview: `kapso status`
2. Phone number health: `kapso whatsapp numbers health --phone-number "<display-number>" --output human`

Fallback path:
1. Project overview: `node scripts/overview.js`
2. Phone number health: `node scripts/whatsapp-health.js --phone-number-id <id>`

### Review findings

Findings group recurring problems detected across ended conversations. They are exposed on the Platform API under `/platform/v1/findings`, authenticated with `X-API-Key`. The project is taken from the key, so no project ID goes in the path.

1. List what is open:
   ```bash
   curl "$KAPSO_API_BASE_URL/platform/v1/findings?limit=20" -H "X-API-Key: $KAPSO_API_KEY"
   ```
   `limit` defaults to 20 and caps at 25. Paginate with the opaque `paging.next` / `paging.previous` cursors as `after` or `before` — never both at once. Findings in the same group stay on one page, so a page can exceed `limit`.
2. Read one finding, including the latest investigation with its causes and suggested fixes:
   ```bash
   curl "$KAPSO_API_BASE_URL/platform/v1/findings/<finding-id>" -H "X-API-Key: $KAPSO_API_KEY"
   ```
3. Pull the evidence behind it — daily history, source events, affected and comparison conversation IDs, co-occurring events:
   ```bash
   curl "$KAPSO_API_BASE_URL/platform/v1/findings/<finding-id>/evidence" -H "X-API-Key: $KAPSO_API_KEY"
   ```
   The response is bounded; check the `coverage` object to see what was truncated.
4. Queue an AI investigation. It returns `202` and runs asynchronously, so poll step 2 for the result:
   ```bash
   curl -X POST "$KAPSO_API_BASE_URL/platform/v1/findings/<finding-id>/start_investigation" \
     -H "X-API-Key: $KAPSO_API_KEY"
   ```
   `409` means a dispatch is already in flight; `422` means the finding is not currently eligible.
5. After a fix ships, start monitoring, or dismiss a finding that is not worth tracking:
   ```bash
   curl -X POST "$KAPSO_API_BASE_URL/platform/v1/findings/<finding-id>/mark_addressed" \
     -H "X-API-Key: $KAPSO_API_KEY"

   curl -X POST "$KAPSO_API_BASE_URL/platform/v1/findings/<finding-id>/dismiss" \
     -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
     -d '{"reason":"already_fixed","note":"Corrected in release 2.4."}'
   ```
   `reason` is one of `not_relevant`, `expected_behavior`, `already_fixed`, `incorrect`, `other`. Both `reason` and `note` are required. `mark_addressed` needs a completed investigation covering the finding's current evidence.

Every findings endpoint returns `404` when Findings is not enabled for the project.

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
- Prefer resolving a display phone number to the canonical `phone_number_id` before deep debugging.
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
|scripts:{api-logs.js,errors.js,lookup-conversation.js,message-details.js,messages.js,openapi-explore.mjs,overview.js,webhook-deliveries.js,whatsapp-health.js}
|scripts/lib/messages:{args.js,kapso-api.js}
|scripts/lib/status:{args.js,kapso-api.js}
|scripts/lib/triage:{args.js,kapso-api.js}
```
<!-- FILEMAP:END -->
