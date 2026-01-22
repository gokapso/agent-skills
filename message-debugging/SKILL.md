---
name: message-debugging
description: Investigate WhatsApp message delivery and locate conversations by phone or ID; use when users ask for message timelines or conversation lookup.
---

# Kapso Message and Conversation Debugging

## Quickstart

Run a script (node or bun):

- `node /agent-skills/message-debugging/scripts/messages.js --help`
- `bun /agent-skills/message-debugging/scripts/messages.js --help`

Provide env vars:

- `KAPSO_API_BASE_URL`
- `KAPSO_API_KEY`
- `PROJECT_ID`

## Scripts (one operation per file)

- `scripts/messages.js`
- `scripts/message-details.js`
- `scripts/lookup-conversation.js`

## References and assets

- See `references/REFERENCE.md` for a message debugging playbook.
- See `assets/example.json` for a sample message timeline.
