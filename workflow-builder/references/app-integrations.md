# App Integrations (Workflow Nodes and Agent Tools)

Use these when you need to call external apps (Slack, HubSpot, Sheets, etc).

## Step 1: Accounts

1. List connected accounts:
   - `scripts/list-accounts.js --app-slug <slug>`
2. If no account exists, generate a connect link:
   - `scripts/create-connect-token.js --app-slug <slug>`
3. Ask the user to open the connect URL and finish OAuth, then re-run list-accounts.

## Step 2: Choose integration path

### Option A: Pipedream node (workflow graph)

1. Search actions: `scripts/search-actions.js --query "send slack message" --app-slug slack`
2. Get schema: `scripts/get-action-schema.js --action-id <id>`
3. For remote options: `scripts/configure-prop.js --action-id <id> --prop-name <name> --account-id <id>`
4. For dynamic props: `scripts/reload-props.js --action-id <id> --account-id <id>`
5. Add a `pipedream` node to the graph with action_id, app_slug, account_id, configured_props.

### Option B: Agent app integration tool (preferred for agent nodes)

1. List existing integrations: `scripts/list-integrations.js`
2. If none, create one:
   - `scripts/create-integration.js --action-id <id> --app-slug <slug> --account-id <id> --configured-props <json>`
3. Use the integration id in `flow_agent_app_integration_tools` on the agent node.

### Option C: Integration via webhook

Use only when calling from a webhook node or agent webhook tool.

1. Create integration (same as Option B).
2. Call:
   - `https://app.kapso.ai/api/v1/integrations/{integration_id}/invoke`

Rules:
- Prefer Option B for agent nodes.
- Pipedream URLs do not work in webhook nodes or agent webhook tools.
- Always get action_id from search-actions; do not guess.
