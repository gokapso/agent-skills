# Workflow Node Types

## Supported node_type values

These are the `data.node_type` values supported by the Platform API and validated by `scripts/validate-graph.js`:

- `start`
- `send_text`
- `send_template`
- `send_interactive`
- `wait_for_response`
- `set_variable`
- `decide`
- `call`
- `webhook`
- `function`
- `agent`
- `handoff`
- `emit_event`

Messaging nodes are `send_text`, `send_template`, and `send_interactive`.

Node structure:

```json
{
  "id": "send_text_1710000000000",
  "type": "flow-node",
  "position": { "x": 300, "y": 100 },
  "data": {
    "node_type": "send_text",
    "config": {},
    "display_name": "Send Text"
  }
}
```

Notes:
- `display_name` is computed by the backend and is not reliably editable.
- New node IDs should use `{node_type}_{timestamp_ms}`.
- Nodes connect from bottom to top; organize the graph vertically (top-down) rather than left-to-right.

## start

```json
{ "node_type": "start", "config": {} }
```

Exactly one start node per workflow, id must be `start`.

## send_text

```json
{ "node_type": "send_text", "config": { "message": "Hello {{vars.name}}!", "delay_seconds": 0 } }
```

Optional: `whatsapp_config_id`, `to_phone_number`.

## send_template

```json
{
  "node_type": "send_template",
  "config": {
    "template_id": "uuid",
    "parameters": { "1": "{{vars.name}}" }
  }
}
```

Optional: `whatsapp_config_id`, `to_phone_number`.
Use the `integrate-whatsapp` skill to find template IDs and parameter formats.

## send_interactive (buttons)

```json
{
  "node_type": "send_interactive",
  "config": {
    "interactive_type": "button",
    "body_text": "Choose an option:",
    "buttons": [
      { "id": "yes", "title": "Yes" },
      { "id": "no", "title": "No" }
    ]
  }
}
```

Max 3 buttons; id + title required (title max 20 chars).

## send_interactive (list)

```json
{
  "node_type": "send_interactive",
  "config": {
    "interactive_type": "list",
    "body_text": "Select:",
    "list_button_text": "View options",
    "list_sections": [
      { "title": "Section", "rows": [{ "id": "opt1", "title": "Option 1" }] }
    ]
  }
}
```

## send_interactive (cta_url)

```json
{
  "node_type": "send_interactive",
  "config": {
    "interactive_type": "cta_url",
    "body_text": "Visit our site",
    "cta_display_text": "Open",
    "cta_url": "https://example.com"
  }
}
```

## send_interactive (flow)

```json
{
  "node_type": "send_interactive",
  "config": {
    "interactive_type": "flow",
    "body_text": "Open calendar",
    "flow_id": "<META_FLOW_ID>",
    "flow_cta": "Open",
    "flow_action": "navigate",
    "flow_action_payload": { "screen": "FIRST_SCREEN" }
  }
}
```

Notes:
- `flow_id` is the Meta Flow ID (string).
- `flow_action_payload.screen` must be a valid first screen.

## wait_for_response

```json
{ "node_type": "wait_for_response", "config": { "save_response_to": "user_reply" } }
```

Saves the next message into `vars.user_reply`.

## set_variable

```json
{
  "node_type": "set_variable",
  "config": {
    "variable_name": "customer_name",
    "variable_value": "{{vars.user_reply}}",
    "value_type": "string"
  }
}
```

Notes:
- Use `value_type: "string"` unless you have a specific reason to store a different type.

## decide (AI routing)

```json
{
  "node_type": "decide",
  "config": {
    "decision_type": "ai",
    "provider_model_id": "uuid",
    "conditions": [
      { "label": "interested", "description": "User shows interest" },
      { "label": "not_interested", "description": "User declines" }
    ]
  }
}
```

## decide (Jev routing)

```json
{
  "node_type": "decide",
  "config": {
    "decision_type": "jev",
    "conditions": [
      { "label": "interested", "description": "User shows interest" },
      { "label": "not_interested", "description": "User declines" }
    ]
  }
}
```

Notes:
- Jev is a TypeSafe choice model. Do not send `provider_model_id`, `llm_temperature`, or `llm_max_tokens`.
- Jev supports at most 255 conditions per node.

## decide (function routing)

```json
{
  "node_type": "decide",
  "config": {
    "decision_type": "function",
    "function_id": "uuid",
    "conditions": [
      { "label": "yes", "description": "Approved" },
      { "label": "no", "description": "Rejected" }
    ]
  }
}
```

Rules:
- Outgoing edge labels must match `conditions[].label`.
- When creating new conditions, do not include an `id` field.

## call (subworkflow)

```json
{ "node_type": "call", "config": { "workflow_id": "uuid", "save_error_to": "subflow_error" } }
```

## webhook

```json
{
  "node_type": "webhook",
  "config": {
    "url": "https://api.example.com/endpoint",
    "method": "POST",
    "headers": { "Authorization": "Bearer {{vars.token}}" },
    "body_template": { "phone": "{{context.phone_number}}" },
    "save_response_to": "api_result"
  }
}
```

`headers` and `body_template` must be valid JSON objects.

## function

```json
{ "node_type": "function", "config": { "function_id": "uuid", "save_response_to": "fn_result" } }
```

Use `automate-whatsapp` function scripts to find function IDs and update code.

## emit_event

```json
{
  "node_type": "emit_event",
  "config": {
    "event_name": "conversation.csat_scored",
    "properties": {
      "score": "{{vars.score}}",
      "source": "workflow"
    },
    "occurred_at": "{{vars.scored_at}}"
  }
}
```

Records a Project Event from the workflow execution. `properties` must be a flat JSON object with scalar values only. `occurred_at` is optional; omit it to use current time.

Limits:
- A workflow execution can emit at most 10 Project Events total.
- A workflow execution can emit at most 3 events with the same name.
- Project-event-triggered workflows cannot emit Project Events.

## agent

```json
{
  "node_type": "agent",
  "config": {
    "system_prompt": "You are a helpful assistant...",
    "provider_model_id": "uuid",
    "max_iterations": 10,
    "temperature": 0.7,
    "message_delivery_mode": "auto_send_assistant_text"
  }
}
```

Notes:
- `provider_model_id` is required. Use `scripts/list-provider-models.js` to find it.
- Agent tool arrays live inside `data.config` (not at the `data` root).
- `message_delivery_mode` controls user-visible text:
  - `auto_send_assistant_text` sends normal assistant text automatically.
  - `tool_only` keeps normal assistant text internal; the agent must call `send_notification_to_user` for every user-visible message.
- With `tool_only`, include `send_notification_to_user` and `enter_waiting` in `enabled_default_tools`. Use `enter_waiting` after questions that need a reply.

<!-- TODO: Add a full tool-only agent workflow asset after the API behavior is generally available. -->

Default tools (toggle on/off only):
- complete_task (required)
- handoff_to_human (required)
- enter_waiting
- send_notification_to_user
- send_media
- get_execution_metadata
- get_whatsapp_context
- contact_conversations
- get_current_datetime
- save_variable
- get_variable
- emit_event (default_enabled: false)
- ask_about_file

Enable `emit_event` only when the agent should decide whether or when to record a Project Event. Configure the tool with allowed event definitions; the agent can only emit those event names. Prefer a deterministic `emit_event` node when the workflow should always record the event at a known step.

Use `contact_conversations` when an agent should list and read older WhatsApp conversations for the same current contact. Call it with `action: "list"` first, then call `action: "read"` with a returned `conversation_id`.

Custom tools:
- `flow_agent_webhooks[]` (webhook tools)
- `flow_agent_mcp_servers[]` (MCP tools)

### Agent tools: exact placement and structure

All tool arrays go under `data.config` of the agent node:

```json
{
  "id": "agent_1730000000000",
  "type": "flow-node",
  "position": { "x": 120, "y": 320 },
  "data": {
    "node_type": "agent",
    "config": {
      "system_prompt": "You can schedule appointments and use calendar tools.",
      "provider_model_id": "uuid",
      "max_iterations": 10,
      "temperature": 0.7,
      "message_delivery_mode": "tool_only",
      "enabled_default_tools": [
        "complete_task",
        "handoff_to_human",
        "enter_waiting",
        "send_notification_to_user",
        "get_whatsapp_context",
        "emit_event"
      ],
      "default_tool_configs": {
        "emit_event": {
          "event_definition_ids": ["uuid"]
        }
      },
      "flow_agent_webhooks": [],
      "flow_agent_mcp_servers": []
    }
  }
}
```

#### Webhook tools (custom HTTP tools)

Use when the agent needs to call arbitrary HTTP endpoints:

```json
{
  "flow_agent_webhooks": [
    {
      "name": "lookup_customer",
      "description": "Fetch customer data from internal API",
      "url": "https://api.example.com/customers/lookup",
      "http_method": "POST",
      "headers": {
        "Authorization": "Bearer {{vars.api_token}}",
        "Content-Type": "application/json"
      },
      "body": {
        "phone_number": "{{context.phone_number}}"
      },
      "body_schema": {
        "type": "object",
        "properties": {
          "phone_number": { "type": "string" }
        },
        "required": ["phone_number"]
      },
      "jmespath_query": null
    }
  ]
}
```

Rules:
- `body_schema` must be valid JSON Schema.
- `headers` and `body` must be JSON objects (not strings).
- Tool inputs are defined by `body_schema` and are sent as the webhook JSON body.

#### MCP server tools

Use to attach MCP servers the agent can call:

```json
{
  "flow_agent_mcp_servers": [
    {
      "name": "files",
      "description": "Local file access",
      "url": "https://mcp.example.com",
      "headers": {
        "Authorization": "Bearer {{vars.mcp_token}}"
      }
    }
  ]
}
```

Rules:
- `url` is required.
- `headers` must be a JSON object.
- MCP tool inputs are defined by the MCP server's tool schemas (not configured here).

## handoff

```json
{ "node_type": "handoff", "config": {} }
```

Ends execution and flags for human takeover.

## AI Fields (dynamic content)

Set a field to `{"$ai":{}}` and add `ai_field_config`:

```json
{
  "message": { "$ai": {} },
  "provider_model_id": "uuid",
  "ai_field_config": {
    "message": { "mode": "prompt", "prompt": "Write a greeting for {{vars.name}}" }
  }
}
```
