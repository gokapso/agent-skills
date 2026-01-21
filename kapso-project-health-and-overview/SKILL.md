---
name: kapso-project-health-and-overview
description: Retrieve project health signals and interpret WhatsApp configuration checks; use when users ask about plan status, phone number health, or overall connectivity.
---

# Kapso Project Health and Overview

## Quickstart

Run a script (node or bun):

- `node /agent-skills/kapso-project-health-and-overview/scripts/overview.js --help`
- `bun /agent-skills/kapso-project-health-and-overview/scripts/overview.js --help`

Provide env vars:

- `KAPSO_API_BASE_URL`
- `KAPSO_API_KEY`
- `PROJECT_ID`

## Scripts (one operation per file)

- `scripts/overview.js`
- `scripts/whatsapp-health.js --phone-number-id <id>`

## Notes

- `overview.js` aggregates phone numbers, external API logs, and webhook deliveries.
- Plan/subscription details are not exposed via the Platform API.

## References and assets

- See `references/REFERENCE.md` for health-check interpretation guidance.
- See `assets/example.json` for a sample health-check response shape.
