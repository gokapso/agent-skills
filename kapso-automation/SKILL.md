---
name: kapso-automation
description: Manage Kapso workflows, functions, and project databases; use for workflow graph edits, triggers, executions, function nodes, and D1 table CRUD.
---

# Kapso Automation

## Overview

This skill consolidates everything needed to build and run Kapso automation:

- Workflow CRUD, graph edits, triggers, executions, and app integrations
- Function management (Cloudflare Workers only)
- Project D1 database table and row operations

## Before making changes

- Read the relevant files in `references/` for contracts and rules.
- Inspect the exact `scripts/` you will run to confirm endpoint paths and flags.
- Use `assets/` examples as the base for edits and payloads.

## Workflow decision tree

### Workflow graphs or triggers
Use the workflow scripts (get/list/update graph, triggers, executions).

### Function nodes, decide nodes, or webhooks
Use the function scripts (create/update/deploy/invoke/logs) and follow the code rules.

### AI agent with tools (scheduling, CRM, support)
Use agent nodes + app integrations. Attach tools via `flow_agent_app_integration_tools` and set `provider_model_id`.

### Workflow data storage
Use the database scripts (list tables, query rows, create/update/delete).

## Quickstart

Set env vars: `KAPSO_API_BASE_URL` (host only, no `/platform/v1`), `KAPSO_API_KEY`, `PROJECT_ID`.

Start here:

- List workflows: `node scripts/list-workflows.js`
- Get graph: `node scripts/get-graph.js <workflow_id>`
- Create function: `node scripts/create.js --name <name> --code-file <path>`
- List tables: `node scripts/list-tables.js`

## Core workflows

### Edit a workflow graph
1. Fetch graph: `node scripts/get-graph.js <workflow_id>`.
2. Make the smallest JSON change needed.
3. Patch: `node scripts/edit-graph.js <workflow_id> --expected-lock-version <n> --old-file <path> --new-file <path>`.
4. Validate: `node scripts/validate-graph.js --definition-file <path>`.
5. Re-fetch on conflicts.

### Manage triggers
1. List: `node scripts/list-triggers.js <workflow_id>`.
2. Create: `node scripts/create-trigger.js <workflow_id> --trigger-type ...`.
3. Toggle: `node scripts/update-trigger.js --trigger-id <id> --active true|false`.
4. Delete: `node scripts/delete-trigger.js --trigger-id <id>`.
5. For inbound_message triggers, first run `node scripts/list-whatsapp-phone-numbers.js` to get `phone_number_id`.

### Debug executions
1. List: `node scripts/list-executions.js <workflow_id>`.
2. Inspect: `node scripts/get-execution.js <execution-id>`.
3. Pull a value: `node scripts/get-context-value.js <execution-id> --variable-path vars.foo`.
4. Events: `node scripts/list-execution-events.js <execution-id>`.

### Create and deploy a function
1. Read `references/functions-reference.md` and `references/functions-payloads.md`.
2. Write code in a file (use the required handler signature).
3. Create: `node scripts/create.js --name <name> --code-file <path>`.
4. Deploy: `node scripts/deploy.js --function-id <id>`.
5. Verify: `node scripts/get.js --function-id <id>`.

### Update a function
1. Fetch: `node scripts/get.js --function-id <id>`.
2. Update: `node scripts/update.js --function-id <id> --name <name> --code-file <path>`.
3. Deploy and verify.

### Database CRUD
1. Discover tables: `node scripts/list-tables.js`.
2. Query: `node scripts/query-rows.js --table <name> --filters <json>`.
3. Create/update/upsert/delete with the row scripts.

### App integrations (for nodes or agent tools)
1. Accounts: `node scripts/list-accounts.js --app-slug <slug>`.
2. Actions: `node scripts/search-actions.js --query "slack"` (prefer one-word query).
3. Schema: `node scripts/get-action-schema.js --action-id <id>`.
4. Create integration: `node scripts/create-integration.js --action-id <id> --app-slug <slug> --account-id <pipedream_account_id> --configured-props <json>`.

### Agent node with tool integrations
1. Find model: `node scripts/list-provider-models.js` and select `provider_model_id`.
2. Find account: `node scripts/list-accounts.js --app-slug <slug>` (use `pipedream_account_id`).
3. Find action_id (same as action key): `node scripts/search-actions.js --query <one-word> --app-slug <slug>`.
4. Create integration(s): `node scripts/create-integration.js --action-id <id> --app-slug <slug> --account-id <pipedream_account_id> --configured-props <json> --variable-definitions <json>`.
   - Use `{{placeholders}}` in configured_props for tool inputs.
   - `variable_definitions` defines required input names and types.
5. Add tools on the agent node: `flow_agent_app_integration_tools` in the node config.
6. Create inbound trigger: `node scripts/create-trigger.js <workflow_id> --trigger-type inbound_message --phone-number-id <id>`.
   - Example asset: `assets/agent-app-integration-example.json`.

## Code rules for functions

- Code MUST start with: `async function handler(request, env) {`
- Do NOT use `export`, `export default`, or arrow functions.
- Return a `Response` object.

## Payloads quick index

- Workflow decision nodes: `references/functions-payloads.md`
- Workflow function nodes: `references/functions-payloads.md`
- WhatsApp Flows data endpoints: `references/functions-payloads.md`

## Graph editing rules

- Exactly one start node with `id` = `start`.
- Never change existing node IDs.
- Use `{node_type}_{timestamp_ms}` for new node IDs.
- Non-decide nodes have 0 or 1 outgoing `next` edge.
- Decide edge labels must match `conditions[].label`.
- Nodes connect bottom-to-top; organize the graph vertically, not left-to-right.

## Execution context

Always use this structure:
- `vars`: user-defined variables
- `system`: system variables
- `context`: channel data
- `metadata`: request metadata

Never use `variables` internally.

## Database notes

- Raw SQL execution is not supported via the Platform API.

## Notes

- Prefer file paths over inline JSON/text (`--definition-file`, `--old-file`, `--new-file`).
- Expect JSON output on stdout for every command.
- Run scripts with `node` or `bun`; each file performs a single operation.
- The Platform API does not enforce `lock_version` yet; edit/update scripts precheck and warn on conflicts.
- Blocked commands return `blocked: true` with the missing endpoint details.
- `action_id` is the same as the `key` returned by `search-actions`.
- `--account-id` should use `pipedream_account_id` from `list-accounts`.
- Tool inputs come from `variable_definitions` and `{{placeholders}}` in configured_props (see `references/app-integrations.md`).

## Blocked operations

- `scripts/variables-set.js` and `scripts/variables-delete.js` return `blocked: true` because the Platform API does not expose variable CRUD endpoints.

## Common pitfalls

- Mixing Workflow vs WhatsApp Flow; clarify before editing.
- Edge labels not matching decide condition labels.
- Using `whatsapp_config_id` instead of `phone_number_id` for triggers.

## Commands

### Workflow CRUD
- `node scripts/list-workflows.js [--status <status>] [--name-contains <text>] [--created-after <iso>] [--created-before <iso>]`
- `node scripts/get-workflow.js <workflow-id>`
- `node scripts/create-workflow.js --name <name> [--description <text>] [--definition-file <path> | --definition-json <json>]`
- `node scripts/update-workflow-settings.js <workflow-id> --lock-version <n> [--name <name>] [--description <text>] [--status <draft|active|archived>] [--message-debounce-seconds <n>]`

### Graph operations
- `node scripts/get-graph.js <workflow-id>`
- `node scripts/edit-graph.js <workflow-id> --expected-lock-version <n> --old <text>|--old-file <path> --new <text>|--new-file <path> [--replace-all]`
- `node scripts/update-graph.js <workflow-id> --expected-lock-version <n> --definition-file <path>|--definition-json <json>`
- `node scripts/validate-graph.js --workflow-id <id> | --definition-file <path> | --definition-json <json>`

### Triggers
- `node scripts/list-triggers.js <workflow-id>`
- `node scripts/create-trigger.js <workflow-id> --trigger-type <inbound_message|api_call|whatsapp_event> [--phone-number-id <id>] [--event <whatsapp.event>] [--active true|false] [--triggerable-attributes <json>]`
- `node scripts/update-trigger.js --trigger-id <id> --active true|false`
- `node scripts/delete-trigger.js --trigger-id <id>`
- `node scripts/list-whatsapp-phone-numbers.js [--per-page <n>] [--page <n>]`

### Executions and variables
- `node scripts/list-executions.js <workflow-id> [--status <status>] [--waiting-reason <value>] [--whatsapp-conversation-id <id>] [--created-after <iso>] [--created-before <iso>]`
- `node scripts/get-execution.js <execution-id>`
- `node scripts/get-context-value.js <execution-id> --variable-path <path>`
- `node scripts/update-execution-status.js <execution-id> --status <ended|handoff|waiting>`
- `node scripts/resume-execution.js <execution-id> --message <json> [--variables <json>]`
- `node scripts/variables-list.js <workflow-id>`
- `node scripts/variables-set.js <workflow-id> --name <name> --value <value>` (blocked)
- `node scripts/variables-delete.js <workflow-id> --name <name>` (blocked)

### App integrations
- `node scripts/list-apps.js [--query <text>]`
- `node scripts/search-actions.js --query <text> [--app-slug <slug>]`
- `node scripts/get-action-schema.js --action-id <id>`
- `node scripts/list-accounts.js [--app-slug <slug>]`
- `node scripts/create-connect-token.js`
- `node scripts/configure-prop.js --action-id <id> --prop-name <name> --account-id <pipedream_account_id>`
- `node scripts/reload-props.js --action-id <id> --account-id <pipedream_account_id>`
- `node scripts/list-integrations.js`
- `node scripts/create-integration.js --action-id <id> --app-slug <slug> --account-id <pipedream_account_id> --configured-props <json> [--name <text>]`
- `node scripts/update-integration.js --integration-id <id> [--configured-props <json>]`
- `node scripts/delete-integration.js --integration-id <id>`

### Functions
- `node scripts/list.js`
- `node scripts/get.js --function-id <id>`
- `node scripts/create.js --name <name> --code <js> [--description <text>]`
- `node scripts/create.js --name <name> --code-file <path> [--description <text>]`
- `node scripts/update.js --function-id <id> --name <name> --code <js> [--description <text>]`
- `node scripts/update.js --function-id <id> --name <name> --code-file <path> [--description <text>]`
- `node scripts/deploy.js --function-id <id>`
- `node scripts/invoke.js --function-id <id> --payload <json>`
- `node scripts/invoke.js --function-id <id> --payload-file <path>`
- `node scripts/logs.js --function-id <id>`

### Databases
- `node scripts/list-tables.js`
- `node scripts/get-table.js --table <name> [--limit <n>]`
- `node scripts/query-rows.js --table <name> [--filters <json>] [--select <cols>] [--order <col.asc|desc>] [--limit <n>] [--offset <n>]`
- `node scripts/create-row.js --table <name> --data <json>`
- `node scripts/update-row.js --table <name> --data <json> (--id <row-id> | --filters <json>)`
- `node scripts/upsert-row.js --table <name> --data <json> [--upsert-key <column>] [--filters <json> | --id <row-id>]`
- `node scripts/delete-row.js --table <name> (--id <row-id> | --filters <json>)`

## References and assets

Read these before editing:

- `references/workflow-overview.md`
- `references/node-types.md`
- `references/execution-context.md`
- `references/triggers.md`
- `references/app-integrations.md`
- `references/function-contracts.md`
- `references/workflow-reference.md`
- `references/functions-reference.md`
- `references/functions-payloads.md`
- `references/databases-reference.md`

Examples:

- `assets/workflow-linear.json`
- `assets/workflow-decision.json`
- `assets/functions-example.json`
- `assets/databases-example.json`

## Related skills

- WhatsApp messaging and templates: `whatsapp-messaging`
- WhatsApp Flows: `whatsapp-flows`
- Platform APIs and customers: `kapso-api`
