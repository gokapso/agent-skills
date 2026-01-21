---
name: kapso-skill-router
description: Select and activate the minimal set of skills for the user's intent.
---

# Kapso Skill Router

## When to use this skill
- Use when: the request implies tools outside the current context or spans multiple domains.
- Do not use when: a single already-active skill clearly covers the request.

## Routing rules
- Activate the minimum set of skills needed; avoid loading heavy references unless required.
- If the request is unclear, ask a short clarifying question before activating more skills.
- If no matching skill exists, explain the gap and offer the closest alternative.

## Intent to bundle (high level)
- Docs lookup or unknown facts: `kapso-docs-search`.
- UI navigation or "where do I click": `kapso-ui-navigation-assistant`.
- Webhooks, functions, database, logs, errors, messages: `api` bundle skills.
- WhatsApp templates lifecycle: `whatsapp_templates` bundle skills.
- WhatsApp Flows (Flow JSON, data endpoints, encryption): `whatsapp_flow` bundle skills.
- Workflows (graphs, triggers, executions): `workflows` bundle skills.

## Tools
- None.
