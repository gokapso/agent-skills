---
name: automate-whatsapp
description: "Build WhatsApp automations with Kapso workflows: configure WhatsApp triggers, edit workflow graphs, manage executions, deploy functions, and use databases/integrations for state. Use when automating WhatsApp conversations and event handling."
---

# Automate WhatsApp

## When to use

Use this skill to build and run WhatsApp automations: workflow CRUD, graph edits, triggers, executions, function management, app integrations, and D1 database operations.

## Setup

Preferred path:
- Kapso CLI installed and authenticated (`kapso login`)
- Use the CLI for project/number discovery before wiring triggers or automations

Fallback path:
Env vars:
- `KAPSO_API_BASE_URL` (host only, no `/platform/v1`)
- `KAPSO_API_KEY`

## How to

### Discover phone numbers first

Preferred path:
1. Check project state: `kapso status`
2. List connected numbers: `kapso whatsapp numbers list --output json`
3. Resolve a display number when needed: `kapso whatsapp numbers resolve --phone-number "<display-number>" --output json`

Fallback path:
1. List number configs for triggers: `node scripts/list-whatsapp-phone-numbers.js`

### Edit a workflow graph

1. Fetch graph: `node scripts/get-graph.js <workflow_id>` (note the `lock_version`)
2. Edit the JSON (see graph rules below)
3. Validate: `node scripts/validate-graph.js --definition-file <path>`
4. Update: `node scripts/update-graph.js <workflow_id> --expected-lock-version <n> --definition-file <path>`
5. Re-fetch to confirm

For small edits, use `edit-graph.js` with `--old-file` and `--new-file` instead.

If you get a lock_version conflict: re-fetch, re-apply changes, retry with new lock_version.

### Manage triggers

1. List: `node scripts/list-triggers.js <workflow_id>`
2. Create: `node scripts/create-trigger.js <workflow_id> --trigger-type <type> --phone-number-id <id>`
3. Toggle: `node scripts/update-trigger.js --trigger-id <id> --active true|false`
4. Delete: `node scripts/delete-trigger.js --trigger-id <id>`

For inbound_message triggers, prefer `kapso whatsapp numbers resolve --phone-number "<display-number>" --output json` to get the exact `phone_number_id`. Fall back to `node scripts/list-whatsapp-phone-numbers.js` when the CLI is unavailable.

### Debug executions

1. List: `node scripts/list-executions.js <workflow_id>`
2. Inspect: `node scripts/get-execution.js <execution-id>`
3. Get value: `node scripts/get-context-value.js <execution-id> --variable-path vars.foo`
4. Events: `node scripts/list-execution-events.js <execution-id>`

### Create and deploy a function

1. Write code with handler signature (see function rules below)
2. Create: `node scripts/create-function.js --name <name> --code-file <path> [--public-endpoint true]`
3. Deploy: `node scripts/deploy-function.js --function-id <id>`
4. Verify: `node scripts/get-function.js --function-id <id>`

Use `--public-endpoint true` when the function should be callable without `X-API-Key` via the Kapso-hosted invoke URL. This is only supported for Cloudflare functions.
New functions default to `invoke_response_mode=passthrough`, which returns the function body directly on successful invoke. Legacy wrapped functions can be migrated later with `update-function.js`.

### Set up agent node with app integrations

1. Find model: `node scripts/list-provider-models.js`
2. Find account: `node scripts/list-accounts.js --app-slug <slug>` (use `pipedream_account_id`)
3. Find action: `node scripts/search-actions.js --query <word> --app-slug <slug>` (action_id = key)
4. Create integration: `node scripts/create-integration.js --action-id <id> --app-slug <slug> --account-id <id> --configured-props <json>`
5. Add tools to agent node via `flow_agent_app_integration_tools`

### Set up agent node with remote sandbox repositories

Use this when the agent needs a remote ephemeral workspace to inspect or modify repository files during a workflow run.

1. Read `references/agent-remote-sandbox.md` for the execution model and field rules
2. Find model: `node scripts/list-provider-models.js`
3. Copy `assets/agent-remote-sandbox-github-repo-example.json` as a starting point, or edit the agent node under `data.config`
4. Set `sandbox_enabled: true`
5. Set `sandbox_network_mode` to `allow_all` or `allow_list`
6. If using `allow_list`, add extra outbound hosts in `sandbox_allowed_outbound_hosts`
7. Add GitHub repositories to `flow_agent_resources` with:
   - `resource_type: "github_repository"`
   - `repo_url`
   - `branch`
   - `pat`
8. Write the system prompt so it explicitly reads from `/workspace/repos/<repo-slug>` before making changes
9. Validate and update the graph

Notes:
- Remote sandbox is beta and free during the beta
- `sandbox_enabled` controls whether the remote workspace and sandbox tools are available
- Repository resources stay configured even if sandbox access is turned off later
- v1 supports GitHub repositories only
- Use a repository root URL, not a GitHub file URL or `tree/...` URL
- Repositories are mounted into `/workspace/repos/<repo-slug>` inside the remote sandbox
- Use `references/agent-remote-sandbox.md` and `references/node-types.md` for the exact shape

### Database CRUD

1. List tables: `node scripts/list-tables.js`
2. Query: `node scripts/query-rows.js --table <name> --filters <json>`
3. Create/update/delete with row scripts

## Graph rules

- Exactly one start node with `id` = `start`
- Never change existing node IDs
- Use `{node_type}_{timestamp_ms}` for new node IDs
- Non-decide nodes have 0 or 1 outgoing `next` edge
- Decide edge labels must match `conditions[].label`
- Edge keys are `source`/`target`/`label` (not `from`/`to`)

For full schema details, see `references/graph-contract.md`.

## Function rules

```js
async function handler(request, env) {
  // Parse input
  const body = await request.json();
  // Use env.KV and env.DB as needed
  return new Response(JSON.stringify({ result: "ok" }));
}
```

- Do NOT use `export`, `export default`, or arrow functions
- Return a `Response` object

## Execution context

Always use this structure:
- `vars` - user-defined variables
- `system` - system variables
- `context` - channel data
- `metadata` - request metadata

## Scripts

### Workflows

| Script | Purpose |
|--------|---------|
| `list-workflows.js` | List workflows (metadata only) |
| `get-workflow.js` | Get workflow metadata |
| `create-workflow.js` | Create a workflow |
| `update-workflow-settings.js` | Update workflow settings |

### Graph

| Script | Purpose |
|--------|---------|
| `get-graph.js` | Get workflow graph + lock_version |
| `edit-graph.js` | Patch graph via string replacement |
| `update-graph.js` | Replace entire graph |
| `validate-graph.js` | Validate graph structure locally |

### Triggers

| Script | Purpose |
|--------|---------|
| `list-triggers.js` | List triggers for a workflow |
| `create-trigger.js` | Create a trigger |
| `update-trigger.js` | Enable/disable a trigger |
| `delete-trigger.js` | Delete a trigger |
| `list-whatsapp-phone-numbers.js` | List phone numbers for trigger setup |

### Executions

| Script | Purpose |
|--------|---------|
| `list-executions.js` | List executions |
| `get-execution.js` | Get execution details |
| `get-context-value.js` | Read value from execution context |
| `update-execution-status.js` | Force execution state |
| `resume-execution.js` | Resume waiting execution |
| `list-execution-events.js` | List execution events |

### Functions

| Script | Purpose |
|--------|---------|
| `list-functions.js` | List project functions |
| `get-function.js` | Get function details + code |
| `create-function.js` | Create a function, optionally with a public invoke endpoint |
| `update-function.js` | Update function code, public endpoint setting, or migrate a legacy wrapped function to passthrough |
| `deploy-function.js` | Deploy function to runtime |
| `invoke-function.js` | Invoke function with payload |
| `list-function-invocations.js` | List function invocations |

### App integrations

| Script | Purpose |
|--------|---------|
| `list-apps.js` | Search integration apps |
| `search-actions.js` | Search actions (action_id = key) |
| `get-action-schema.js` | Get action JSON schema |
| `list-accounts.js` | List connected accounts |
| `create-connect-token.js` | Create OAuth connect link |
| `configure-prop.js` | Resolve remote_options for a prop |
| `reload-props.js` | Reload dynamic props |
| `list-integrations.js` | List saved integrations |
| `create-integration.js` | Create an integration |
| `update-integration.js` | Update an integration |
| `delete-integration.js` | Delete an integration |

### Databases

| Script | Purpose |
|--------|---------|
| `list-tables.js` | List D1 tables |
| `get-table.js` | Get table schema + sample rows |
| `query-rows.js` | Query rows with filters |
| `create-row.js` | Create a row |
| `update-row.js` | Update rows |
| `upsert-row.js` | Upsert a row |
| `delete-row.js` | Delete rows |

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
node scripts/openapi-explore.mjs --spec workflows search "variables"
node scripts/openapi-explore.mjs --spec workflows op getWorkflowVariables
node scripts/openapi-explore.mjs --spec platform op queryDatabaseRows
```

## Notes

- Prefer file paths over inline JSON (`--definition-file`, `--code-file`)
- `action_id` is the same as `key` from `search-actions`
- `--account-id` uses `pipedream_account_id` from `list-accounts`
- Variable CRUD (`variables-set.js`, `variables-delete.js`) is blocked - Platform API doesn't support it
- Raw SQL execution is not supported via Platform API

## References

Read before editing:
- [references/graph-contract.md](references/graph-contract.md) - Graph schema, computed vs editable fields, lock_version
- [references/node-types.md](references/node-types.md) - Node types and config shapes
- [references/workflow-overview.md](references/workflow-overview.md) - Execution flow and states

Other references:
- [references/execution-context.md](references/execution-context.md) - Context structure and variable substitution
- [references/triggers.md](references/triggers.md) - Trigger types and setup
- [references/app-integrations.md](references/app-integrations.md) - App integration and variable_definitions
- [references/agent-remote-sandbox.md](references/agent-remote-sandbox.md) - Remote sandbox behavior, repo resources, mounted paths
- [references/functions-reference.md](references/functions-reference.md) - Function management
- [references/functions-payloads.md](references/functions-payloads.md) - Payload shapes for functions
- [references/databases-reference.md](references/databases-reference.md) - Database operations

## Assets

| File | Description |
|------|-------------|
| `workflow-linear.json` | Minimal linear workflow |
| `workflow-decision.json` | Minimal branching workflow |
| `workflow-agent-simple.json` | Minimal agent workflow |
| `workflow-customer-support-intake-agent.json` | Customer support intake |
| `workflow-interactive-buttons-decide-function.json` | Interactive buttons + decide (function) |
| `workflow-interactive-buttons-decide-ai.json` | Interactive buttons + decide (AI) |
| `workflow-api-template-wait-agent.json` | API trigger + template + agent |
| `function-decide-route-interactive-buttons.json` | Function for button routing |
| `agent-app-integration-example.json` | Agent node with app integrations |
| `agent-remote-sandbox-github-repo-example.json` | Agent node with remote sandbox + GitHub repo resource |

## Related skills

- `integrate-whatsapp` - Onboarding, webhooks, messaging, templates, flows
- `observe-whatsapp` - Debugging, logs, health checks

<!-- FILEMAP:BEGIN -->
```text
[automate-whatsapp file map]|root: .
|.:{package.json,SKILL.md}
|assets:{agent-app-integration-example.json,agent-remote-sandbox-github-repo-example.json,databases-example.json,function-decide-route-interactive-buttons.json,functions-example.json,workflow-agent-simple.json,workflow-api-template-wait-agent.json,workflow-customer-support-intake-agent.json,workflow-decision.json,workflow-interactive-buttons-decide-ai.json,workflow-interactive-buttons-decide-function.json,workflow-linear.json}
|references:{agent-remote-sandbox.md,app-integrations.md,databases-reference.md,execution-context.md,function-contracts.md,functions-payloads.md,functions-reference.md,graph-contract.md,node-types.md,triggers.md,workflow-overview.md,workflow-reference.md}
|scripts:{configure-prop.js,create-connect-token.js,create-function.js,create-integration.js,create-row.js,create-trigger.js,create-workflow.js,delete-integration.js,delete-row.js,delete-trigger.js,deploy-function.js,edit-graph.js,get-action-schema.js,get-context-value.js,get-execution-event.js,get-execution.js,get-function.js,get-graph.js,get-table.js,get-workflow.js,invoke-function.js,list-accounts.js,list-apps.js,list-execution-events.js,list-executions.js,list-function-invocations.js,list-functions.js,list-integrations.js,list-provider-models.js,list-tables.js,list-triggers.js,list-whatsapp-phone-numbers.js,list-workflows.js,openapi-explore.mjs,query-rows.js,reload-props.js,resume-execution.js,search-actions.js,update-execution-status.js,update-function.js,update-graph.js,update-integration.js,update-row.js,update-trigger.js,update-workflow-settings.js,upsert-row.js,validate-graph.js,variables-delete.js,variables-list.js,variables-set.js}
|scripts/lib/databases:{args.js,filters.js,kapso-api.js}
|scripts/lib/functions:{args.js,kapso-api.js}
|scripts/lib/workflows:{args.js,kapso-api.js,result.js}
```
<!-- FILEMAP:END -->
