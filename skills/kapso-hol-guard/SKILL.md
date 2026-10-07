---
name: kapso-hol-guard
description: Protect state-changing Kapso and WhatsApp agent workflows with HOL Guard on a supported local coding-agent harness. Use when an agent will push workflows, deploy functions, change triggers, send messages, or perform other Kapso mutations and the user wants a local approval and evidence boundary before tools run.
---

# Kapso + HOL Guard

Use HOL Guard as the local agent-runtime safety boundary before state-changing Kapso work. Keep Kapso authentication, project targeting, API permissions, dry-runs, lock-version checks, and post-change verification authoritative. HOL Guard protects the supported local coding-agent harness; it does not run inside Kapso or replace Kapso controls.

## Protect the local harness

If HOL Guard is missing and runtime protection was requested, prefer an isolated install:

```bash
pipx install hol-guard
```

Initialize Guard and detect the active supported harness:

```bash
hol-guard bootstrap
hol-guard detect --json
```

Use the exact harness identifier reported by `detect` when it is supported:

```bash
hol-guard install <harness>
hol-guard run <harness> --dry-run
hol-guard run <harness>
hol-guard status
```

For Hermes, use its dedicated bootstrap path instead:

```bash
hol-guard hermes bootstrap
```

Run the Kapso workflow from the protected harness launched by `hol-guard run`. Do not claim protection unless Guard status or doctor output proves it.

## Require Guard before Kapso mutations

Use the protected harness before agent-driven work that can change external state, including:

- `kapso push` and `kapso push workflow <workflow-slug>`
- workflow graph, trigger, function, or deployment changes
- WhatsApp sends, template sends, or other message-producing actions
- project configuration or resource changes
- scripts or API calls from the other Kapso skills that create, update, delete, deploy, resume, invoke, or emit data

Read-only inspection such as status, list, get, log search, and local validation can remain read-only.

If Guard blocks or requests review, stop before the protected operation and inspect the request:

```bash
hol-guard approvals
hol-guard approvals open
hol-guard receipts
```

Never bypass a Guard decision by rerunning the same Kapso mutation from an unprotected harness.

## Preserve Kapso safety controls

- Follow `integrate-whatsapp`, `automate-whatsapp`, and `observe-whatsapp` for the actual Kapso command or API workflow.
- Keep `kapso push --dry-run`, workflow validation, target confirmation, and lock-version handling when those flows require them.
- Never put `KAPSO_API_KEY` or other credentials into prompts, command strings, receipts, or logs.
- Keep Kapso authorization and WhatsApp/Meta platform constraints authoritative even when Guard approves the local action.
- Verify the Kapso result after a protected mutation completes.
- If Guard setup cannot be verified, report that the protected mutation is not ready instead of silently continuing unguarded.

## Troubleshooting and evidence

```bash
hol-guard doctor
hol-guard doctor <harness> --json
hol-guard receipts
hol-guard inventory
hol-guard events
```

Report what Guard proved, what remains blocked or review-required, and the exact next action. Do not describe a Kapso workflow as protected without current Guard evidence.

Canonical HOL Guard setup: https://github.com/hashgraph-online/hol-guard-plugin/tree/main/skills/hol-guard
