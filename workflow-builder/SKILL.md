---
name: workflow-builder
description: "Manage Kapso workflows end-to-end: list/create/update workflows, edit graphs, manage triggers/executions, inspect variables, and configure app integrations for workflow nodes."
---

# Kapso Workflow Graph Editing

## Quickstart

- Set env vars: `KAPSO_API_BASE_URL`, `KAPSO_API_KEY`, `PROJECT_ID`.
- List workflows: `node scripts/list-workflows.js`.
- Fetch a graph: `node scripts/get-graph.js <workflow_id>` (or `bun scripts/get-graph.js <workflow_id>`).
- Edit the JSON definition (see `assets/`) or patch: `node scripts/edit-graph.js <workflow_id> --expected-lock-version <n> --old-file <path> --new-file <path>`.
- Validate the graph: `node scripts/validate-graph.js --workflow-id <workflow_id>`.
- Update with optimistic locking: `node scripts/update-graph.js <workflow_id> --expected-lock-version <n> --definition-file <path>`.

## Commands

### Workflow CRUD

- `node scripts/list-workflows.js [--status <status>] [--name-contains <text>] [--created-after <iso>] [--created-before <iso>]`: list workflows.
- `node scripts/get-workflow.js <workflow-id>`: fetch workflow metadata (no definition).
- `node scripts/create-workflow.js --name <name> [--description <text>] [--definition-file <path> | --definition-json <json>]`: create workflow.
- `node scripts/update-workflow-settings.js <workflow-id> --lock-version <n> [--name <name>] [--description <text>] [--status <draft|active|archived>] [--message-debounce-seconds <n>]`: update settings.

### Graph operations

- `node scripts/get-graph.js <workflow-id>`: fetch workflow definition + lock_version.
- `node scripts/edit-graph.js <workflow-id> --expected-lock-version <n> --old <text>|--old-file <path> --new <text>|--new-file <path> [--replace-all]`: patch the definition by text replacement.
- `node scripts/update-graph.js <workflow-id> --expected-lock-version <n> --definition-file <path>|--definition-json <json>`: update definition with precheck.
- `node scripts/validate-graph.js --workflow-id <id> | --definition-file <path> | --definition-json <json>`: local validation only.

### Triggers

- `node scripts/list-triggers.js <workflow-id>`: list triggers for a workflow.
- `node scripts/create-trigger.js <workflow-id> --trigger-type <inbound_message|api_call|whatsapp_event> [--phone-number-id <id>] [--event <whatsapp.event>] [--active true|false] [--triggerable-attributes <json>]`: create trigger.
- `node scripts/update-trigger.js --trigger-id <id> --active true|false`: enable/disable trigger.
- `node scripts/delete-trigger.js --trigger-id <id>`: delete trigger.

### Executions

- `node scripts/list-executions.js <workflow-id> [--status <status>] [--waiting-reason <value>] [--whatsapp-conversation-id <id>] [--created-after <iso>] [--created-before <iso>]`: list executions.
- `node scripts/get-execution.js <execution-id>`: fetch execution details with context.
- `node scripts/get-context-value.js <execution-id> --variable-path <path>`: fetch a specific context value (example: `vars.user_name`).
- `node scripts/update-execution-status.js <execution-id> --status <ended|handoff|waiting>`: update execution status.
- `node scripts/resume-execution.js <execution-id> --message <json> [--variables <json>]`: resume a waiting execution.

### Variables, models, events

- `node scripts/variables-list.js <workflow-id>`: list discovered workflow variables.
- `node scripts/variables-set.js <workflow-id> --name <name> --value <value>`: blocked (CRUD not available).
- `node scripts/variables-delete.js <workflow-id> --name <name>`: blocked (CRUD not available).
- `node scripts/list-provider-models.js`: list provider models.
- `node scripts/list-execution-events.js <execution-id> [--event-type <type>] [--page <n>] [--per-page <n>]`: list execution events.
- `node scripts/get-execution-event.js <event-id>`: fetch execution event detail.

### App integrations (for workflow nodes and agent tools)

- `node scripts/list-apps.js [--query <text>]`: browse apps.
- `node scripts/search-actions.js --query <text> [--app-slug <slug>]`: find actions.
- `node scripts/get-action-schema.js --action-id <id>`: get configurable props.
- `node scripts/list-accounts.js [--app-slug <slug>]`: list connected accounts.
- `node scripts/create-connect-token.js [--app-slug <slug>]`: generate an OAuth connect link.
- `node scripts/configure-prop.js --action-id <id> --prop-name <name> --account-id <id>`: fetch remote options.
- `node scripts/reload-props.js --action-id <id> --account-id <id>`: reload dynamic props.
- `node scripts/list-integrations.js`: list configured integrations.
- `node scripts/create-integration.js --action-id <id> --app-slug <slug> --account-id <id> --configured-props <json> [--name <text>]`: create integration.
- `node scripts/update-integration.js --integration-id <id> [--configured-props <json>]`: update integration.
- `node scripts/delete-integration.js --integration-id <id>`: delete integration.

## Graph editing rules

- Keep exactly one start node with `id` = `start`.
- Never change existing node IDs.
- Use `{node_type}_{timestamp_ms}` for new node IDs.
- Keep one outgoing `next` edge for non-decide nodes; only decide nodes branch.
- Match decide edge labels to `conditions[].label`.
- Use wait_for_response only for data capture; branch by adding a decide node afterward.

## Notes

- **Prefer file paths over inline JSON/text** (`--definition-file`, `--old-file`, `--new-file`). Write to a file first, then pass the path. This avoids shell escaping issues and works better with large definitions.
- Expect JSON output on stdout for every command.
- Run scripts with `node` or `bun`; each file performs a single operation.
- The Platform API does not enforce `lock_version` yet; edit/update scripts precheck and warn on conflicts.
- Blocked commands return `blocked: true` with the missing endpoint details.
- For functions, templates, and databases used in workflows, activate the dedicated skills:
  - Functions: `kapso-functions`
  - Templates: `whatsapp-templates`
  - Database: `databases`

## References and assets

Load these references before editing:

- `references/workflow-overview.md`
- `references/node-types.md`
- `references/execution-context.md`
- `references/triggers.md`
- `references/app-integrations.md`
- `references/function-contracts.md`
- `references/REFERENCE.md`
- `assets/workflow-linear.json`
- `assets/workflow-decision.json`
