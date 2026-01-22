---
name: kapso-automation
description: Manage Kapso workflows, functions, and project databases; use for workflow graph edits, triggers, executions, function nodes, and D1 table CRUD.
---

# Kapso Automation

## Overview

This skill consolidates everything needed to build and run Kapso automation:

- Workflow CRUD, graph edits, triggers, and executions
- Node configuration (including agent nodes + app integration tools)
- Function management (Cloudflare Workers only)
- Project D1 database table and row operations

## Environment

Required env vars:
- `KAPSO_API_BASE_URL` (host only, no `/platform/v1`)
- `KAPSO_API_KEY`
- `PROJECT_ID`

## Before making changes

- Read `references/graph-contract.md` first: exact editable graph schema, computed vs editable fields, endpoint usage, and the lock_version retry pattern.
- Read `references/node-types.md`: canonical `node_type` list and per-node config shapes (including exact agent tool placement).
- Use `assets/workflow-linear.json` and `assets/workflow-decision.json` as your base when adding nodes/edges.
- Inspect the specific `scripts/` you will run (they are the contract for flags and endpoint paths).

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

Start here:

- List workflows (metadata only): `node scripts/list-workflows.js`
- Get a workflow graph (definition): `node scripts/get-graph.js <workflow_id>`
- Create function: `node scripts/create.js --name <name> --code-file <path>`
- List tables: `node scripts/list-tables.js`

## Core workflows

### Edit a workflow graph (safe path)
1. Read `references/graph-contract.md` (this avoids schema/roundtrip mistakes).
2. Fetch graph + lock_version: `node scripts/get-graph.js <workflow_id>`.
3. Choose your edit strategy:
   - Small surgical change: `node scripts/edit-graph.js <workflow_id> --expected-lock-version <n> --old-file <path> --new-file <path>`
   - Larger refactor: edit a JSON file, then `node scripts/update-graph.js <workflow_id> --expected-lock-version <n> --definition-file <path>`
4. Validate locally (treat warnings as blockers): `node scripts/validate-graph.js --definition-file <path>`.
5. Re-fetch after updating to confirm the saved graph matches what you intended.

### lock_version conflicts (retry pattern)
If you get a conflict error from `edit-graph` or `update-graph`:
1. Re-fetch: `node scripts/get-graph.js <workflow_id>` and use the new `lock_version`.
2. Re-apply your change on top of the latest `definition`.
3. Retry with the new `--expected-lock-version`.

### Terminal nodes and agent nodes
- Terminal nodes are allowed (a node with no outgoing edge ends the workflow after it completes).
- Agent nodes can be terminal (agent finishes via its tools) or can continue via a single `"next"` edge if you want deterministic post-agent steps.

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
   - `variable_definitions` must be a JSON object map (example: `{"calendar_id":"string"}`), not an array.
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
- Edge keys are `source`/`target`/`label` (not `from`/`to`).
- Nodes connect bottom-to-top; organize the graph vertically, not left-to-right.

For the full contract (including computed vs editable fields and roundtripping rules), see `references/graph-contract.md`.

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
- The Platform API does not currently enforce `lock_version` for definition updates; the scripts precheck and stop on conflicts.
- Blocked commands return `blocked: true` with the missing endpoint details.
- `action_id` is the same as the `key` returned by `search-actions`.
- `--account-id` should use `pipedream_account_id` from `list-accounts`.
- Tool inputs come from `variable_definitions` and `{{placeholders}}` in configured_props (see `references/app-integrations.md`).

## Blocked operations

- `scripts/variables-set.js` and `scripts/variables-delete.js` return `blocked: true` because the Platform API does not expose variable CRUD endpoints.

## Common pitfalls

- Mixing Workflow vs WhatsApp Flow; clarify before editing.
- Edge labels not matching decide condition labels.
- Missing `data.node_type` / `data.config` wrapper (backend will default missing node_type to start).
- Using `whatsapp_config_id` instead of `phone_number_id` for triggers.

## Commands

### Workflow CRUD
- `node scripts/list-workflows.js [--status <status>] [--name-contains <text>] [--created-after <iso>] [--created-before <iso>]` - List workflows (metadata only).
- `node scripts/get-workflow.js <workflow-id>` - Fetch one workflow's metadata (includes `lock_version`, no `definition`).
- `node scripts/create-workflow.js --name <name> [--description <text>] [--definition-file <path> | --definition-json <json>]` - Create a workflow (definition optional).
- `node scripts/update-workflow-settings.js <workflow-id> --lock-version <n> [--name <name>] [--description <text>] [--status <draft|active|archived>] [--message-debounce-seconds <n>]` - Update workflow settings with optimistic locking.

### Graph operations
- `node scripts/get-graph.js <workflow-id>` - Fetch workflow graph via `/workflows/:id/definition` (includes `definition` + `lock_version`).
- `node scripts/edit-graph.js <workflow-id> --expected-lock-version <n> --old <text>|--old-file <path> --new <text>|--new-file <path> [--replace-all]` - Patch the graph via robust string replacement (best for small edits).
- `node scripts/update-graph.js <workflow-id> --expected-lock-version <n> --definition-file <path>|--definition-json <json>` - Replace the entire `definition` (best for larger changes).
- `node scripts/validate-graph.js --workflow-id <id> | --definition-file <path> | --definition-json <json>` - Local structural validation for nodes/edges/branching rules.

### Triggers
- `node scripts/list-triggers.js <workflow-id>` - List triggers for a workflow.
- `node scripts/create-trigger.js <workflow-id> --trigger-type <inbound_message|api_call|whatsapp_event> [--phone-number-id <id>] [--event <whatsapp.event>] [--active true|false] [--triggerable-attributes <json>]` - Create a trigger.
- `node scripts/update-trigger.js --trigger-id <id> --active true|false` - Enable/disable a trigger.
- `node scripts/delete-trigger.js --trigger-id <id>` - Delete a trigger.
- `node scripts/list-whatsapp-phone-numbers.js [--per-page <n>] [--page <n>]` - List WhatsApp phone numbers to find `phone_number_id` for inbound_message triggers.

### Executions and variables
- `node scripts/list-executions.js <workflow-id> [--status <status>] [--waiting-reason <value>] [--whatsapp-conversation-id <id>] [--created-after <iso>] [--created-before <iso>]` - List executions for a workflow.
- `node scripts/get-execution.js <execution-id>` - Fetch one execution (context, current state, etc).
- `node scripts/get-context-value.js <execution-id> --variable-path <path>` - Read one value from execution context (example: `vars.foo`).
- `node scripts/update-execution-status.js <execution-id> --status <ended|handoff|waiting>` - Force an execution state transition.
- `node scripts/resume-execution.js <execution-id> --message <json> [--variables <json>]` - Resume a waiting execution with an inbound message payload.
- `node scripts/variables-list.js <workflow-id>` - Discover variables that may exist in this workflow.
- `node scripts/variables-set.js <workflow-id> --name <name> --value <value>` - Blocked (Platform API does not support variable CRUD).
- `node scripts/variables-delete.js <workflow-id> --name <name>` - Blocked (Platform API does not support variable CRUD).

### App integrations
- `node scripts/list-apps.js [--query <text>]` - Search integration apps (Pipedream catalog).
- `node scripts/search-actions.js --query <text> [--app-slug <slug>]` - Search actions; `action_id` is the returned `key`.
- `node scripts/get-action-schema.js --action-id <id>` - Fetch the JSON schema for an action's props.
- `node scripts/list-accounts.js [--app-slug <slug>]` - List connected accounts; use `accounts[].pipedream_account_id` as `--account-id`.
- `node scripts/create-connect-token.js` - Create a connect link token for OAuth (user must complete in browser).
- `node scripts/configure-prop.js --action-id <id> --prop-name <name> --account-id <pipedream_account_id>` - Resolve `remote_options` for a prop (get valid dropdown values).
- `node scripts/reload-props.js --action-id <id> --account-id <pipedream_account_id>` - Reload dynamic props for an action (get `dynamic_props_id`).
- `node scripts/list-integrations.js` - List saved app integrations (check `variable_definitions` for required tool inputs).
- `node scripts/create-integration.js --action-id <id> --app-slug <slug> --account-id <pipedream_account_id> --configured-props <json> [--name <text>]` - Create an integration for reuse (supports `--variable-definitions`).
- `node scripts/update-integration.js --integration-id <id> [--configured-props <json>]` - Update an integration.
- `node scripts/delete-integration.js --integration-id <id>` - Delete an integration.

### Functions
- `node scripts/list.js` - List project functions.
- `node scripts/get.js --function-id <id>` - Fetch one function (metadata + current code).
- `node scripts/create.js --name <name> --code <js> [--description <text>]` - Create a new function from inline code.
- `node scripts/create.js --name <name> --code-file <path> [--description <text>]` - Create a new function from a file.
- `node scripts/update.js --function-id <id> --name <name> --code <js> [--description <text>]` - Update function metadata/code from inline code.
- `node scripts/update.js --function-id <id> --name <name> --code-file <path> [--description <text>]` - Update function metadata/code from a file.
- `node scripts/deploy.js --function-id <id>` - Deploy a function to runtime.
- `node scripts/invoke.js --function-id <id> --payload <json>` - Invoke a function with an inline JSON payload.
- `node scripts/invoke.js --function-id <id> --payload-file <path>` - Invoke a function with a JSON payload file.
- `node scripts/logs.js --function-id <id>` - Fetch recent function logs.

### Databases
- `node scripts/list-tables.js` - List D1 tables for the project.
- `node scripts/get-table.js --table <name> [--limit <n>]` - Fetch table schema + sample rows.
- `node scripts/query-rows.js --table <name> [--filters <json>] [--select <cols>] [--order <col.asc|desc>] [--limit <n>] [--offset <n>]` - Query rows with simple filters.
- `node scripts/create-row.js --table <name> --data <json>` - Create a row.
- `node scripts/update-row.js --table <name> --data <json> (--id <row-id> | --filters <json>)` - Update rows by id or filters.
- `node scripts/upsert-row.js --table <name> --data <json> [--upsert-key <column>] [--filters <json> | --id <row-id>]` - Upsert a row (insert or update).
- `node scripts/delete-row.js --table <name> (--id <row-id> | --filters <json>)` - Delete rows by id or filters.

## References and assets

Read these before editing (each is short and specific):

- `references/graph-contract.md` - Editable workflow definition schema, computed vs editable fields, roundtrip rules, and lock_version retry pattern.
- `references/workflow-overview.md` - How executions move through nodes, trigger routing rules, and execution states.
- `references/node-types.md` - Canonical `node_type` list and per-node config examples (including agent tools).
- `references/execution-context.md` - Execution context structure (`vars/system/context/metadata`) and variable substitution syntax.
- `references/triggers.md` - Trigger types, required fields, and how to set them up with scripts.
- `references/app-integrations.md` - How to discover actions/accounts and create integrations; includes `variable_definitions` rules.
- `references/function-contracts.md` - Function handler contract and runtime expectations.
- `references/workflow-reference.md` - Script list, implemented endpoints, and what validate-graph checks.
- `references/functions-reference.md` - Function management scripts and constraints.
- `references/functions-payloads.md` - Payload shapes for workflow function/decide nodes and WhatsApp Flows endpoints (Meta forms).
- `references/databases-reference.md` - D1 table/row script semantics and limitations.

Assets (copy/paste templates):

- `assets/workflow-linear.json` - Minimal valid linear workflow (start -> send_text -> wait_for_response -> send_text).
- `assets/workflow-decision.json` - Minimal valid branching workflow (wait_for_response -> decide with labeled edges).
- `assets/workflow-agent-simple.json` - Minimal agent workflow (start -> agent). Useful for validating agent node config and prompts.
- `assets/workflow-customer-support-intake-agent.json` - Customer support intake (send_text -> wait_for_response -> agent).
- `assets/workflow-interactive-buttons-decide-function.json` - Interactive buttons + wait + decide (function) routing to labeled edges.
- `assets/function-decide-route-interactive-buttons.json` - Example Function for decide=function that routes based on `vars.button_choice`.
- `assets/workflow-interactive-buttons-decide-ai.json` - Interactive buttons + wait + decide (AI) routing to labeled edges.
- `assets/workflow-api-template-wait-agent.json` - Common API-triggered pattern: send_template -> wait_for_response -> agent.
- `assets/agent-app-integration-example.json` - Example integration payload + agent node config for `flow_agent_app_integration_tools`.
- `assets/functions-example.json` - Example function definitions/payloads for Kapso functions.
- `assets/databases-example.json` - Example D1 table + row operations payloads.

## Related skills

- WhatsApp messaging and templates: `whatsapp-messaging`
- WhatsApp Flows: `whatsapp-flows`
- Platform APIs and customers: `kapso-api`
