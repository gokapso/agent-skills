---
name: kapso-error-and-log-triage
description: Surface and triage message delivery errors, external API failures, and webhook delivery issues; use when users need recent error logs or failure analysis.
---

# Kapso Error and Log Triage

## Quickstart

Run a script (node or bun):

- `node /agent-skills/kapso-error-and-log-triage/scripts/errors.js --help`
- `bun /agent-skills/kapso-error-and-log-triage/scripts/errors.js --help`

Provide env vars:

- `KAPSO_API_BASE_URL`
- `KAPSO_API_KEY`
- `PROJECT_ID`

## Scripts (one operation per file)

- `scripts/errors.js`
- `scripts/api-logs.js`
- `scripts/webhook-deliveries.js`

## Notes

- Message error aggregation uses `/platform/v1/whatsapp/messages` (no time-based filters available).

## References and assets

- See `references/REFERENCE.md` for the triage workflow.
- See `assets/example.json` for sample error triage output shape.
