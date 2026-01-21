---
name: kapso-whatsapp-flow-management
description: Manage WhatsApp Flows via Kapso Platform API: list/create/update/publish flows, manage flow versions, attach data endpoints, and check encryption. Use Meta proxy only for send-test and delete operations.
---

# Kapso WhatsApp Flow Management

## Overview
Use this skill to manage WhatsApp Flows end-to-end: discover flows, edit flow JSON via versions, publish/test, attach data endpoints, and inspect responses/logs. Scripts are single-operation JS files runnable with Node or Bun and print JSON to stdout.

## Quickstart
Run scripts directly:

- `node /agent-skills/kapso-whatsapp-flow-management/scripts/list-flows.js`
- `bun /agent-skills/kapso-whatsapp-flow-management/scripts/list-flows.js`

Required env vars:

- `KAPSO_API_BASE_URL` (root, e.g. `https://api.kapso.ai`)
- `KAPSO_API_KEY`
- `PROJECT_ID`
- `META_GRAPH_VERSION` (optional, default `v24.0`)

Notes:

- Scripts derive Meta and Platform endpoints from the base URL.
- Platform flow operations use Kapso flow IDs (no phone number scope required).
- Meta proxy scripts still require `--phone-number-id` or `--business-account-id` where noted.

## Script map
Each script performs a single operation:

Platform API (WhatsApp Flow operations):

- `scripts/list-flows.js`
- `scripts/create-flow.js`
- `scripts/get-flow.js`
- `scripts/read-flow-json.js`
- `scripts/update-flow-json.js`
- `scripts/publish-flow.js`
- `scripts/get-data-endpoint.js`
- `scripts/set-data-endpoint.js` (create/update function code)
- `scripts/deploy-data-endpoint.js`
- `scripts/register-data-endpoint.js`
- `scripts/get-encryption-status.js`
- `scripts/setup-encryption.js`

Meta proxy (WhatsApp send/test + delete):

- `scripts/send-test-flow.js`
- `scripts/delete-flow.js`

Platform API (Kapso data endpoint + logs):

- `scripts/create-function.js`
- `scripts/get-function.js`
- `scripts/update-function.js`
- `scripts/deploy-function.js`
- `scripts/list-function-logs.js --flow-id <id>`
- `scripts/list-function-invocations.js --flow-id <id> | --function-id <id>`
- `scripts/list-flow-responses.js`

## Platform API endpoints (reference)
These scripts call the Platform API endpoints below (base: `.../platform/v1`):

- `GET /whatsapp/flows`
- `POST /whatsapp/flows`
- `GET /whatsapp/flows/:id`
- `POST /whatsapp/flows/:id/versions`
- `GET /whatsapp/flows/:id/versions`
- `GET /whatsapp/flows/:id/versions/:version_id`
- `POST /whatsapp/flows/:id/publish`
- `GET /whatsapp/flows/:id/data_endpoint`
- `POST /whatsapp/flows/:id/data_endpoint`
- `POST /whatsapp/flows/:id/data_endpoint/deploy`
- `POST /whatsapp/flows/:id/data_endpoint/register`
- `POST /whatsapp/flows/:id/setup_encryption`
- `GET /whatsapp/phone_numbers/:id`

## Meta proxy endpoints (reference)
These scripts call the Meta proxy endpoints below (base: `.../meta/whatsapp/vXX.X`):

- `DELETE /flows/:flow_id` (requires `phone_number_id` or `business_account_id` query)
- `POST /:phone_number_id/messages`

## Workflow guidance
1. Discover or create the flow in the Platform API.
2. Draft the JSON and run `scripts/update-flow-json.js` to create a new version.
3. If the flow is dynamic, set up encryption and attach a data endpoint (create → deploy → register).
4. Publish the flow and send a test message to validate.
5. Use responses/logs to debug issues.

## Data endpoint authoring
When writing endpoint code, follow these rules:

- Define `async function handler(request, env) { ... }`.
- Do not use `export` or `module.exports`.
- Output only JavaScript source code (no markdown).
- Parse input with `await request.json()`.
- Use `env.KV` and `env.DB` as provided by the runtime.

Data exchange payload essentials:

- `data_exchange.action`: `INIT | data_exchange | BACK`
- `data_exchange.screen`: current screen id
- `data_exchange.data`: user inputs
- `data_exchange.flow_token`: opaque Meta token
- `signature_valid`: boolean

Success responses should return:

- `{ "screen": "NEXT_SCREEN_ID", "data": { ... } }`
- Completion uses `screen: "SUCCESS"` with `extension_message_response.params`.

## Troubleshooting notes
- If Preview shows `flow_token is missing`, the flow is in dynamic mode without a data endpoint. Attach one and refresh.
- If encryption setup errors, tell the user to open Settings (gear) and enable encryption for the phone number/WABA.
- If Meta returns OAuthException 139000 (Integrity), the WABA must be verified in the Meta security center.
- Remind users that Responses (Inbox) in the toolbar show stored submissions.

## References and assets
- Flow JSON spec (load on demand): `references/whatsapp-flows-spec.md`
- Sample flow JSON: `assets/sample-flow.json`

## API gaps (blocked ops)
Some endpoints are not exposed yet in the Platform API. These scripts may return 404 and should be treated as blocked:

- `list-flow-responses` (Platform API missing flow responses endpoint)

If a command fails with 404, surface that the endpoint is missing and note the dependency in `kapso-agent-skills-platform-api.md`.
