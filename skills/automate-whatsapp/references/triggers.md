# Workflow Triggers

Triggers are separate from the workflow graph. Do not store triggers in `workflow_graph`.

Trigger types:
- `inbound_message`: fires on WhatsApp message (requires `phone_number_id`).
- `api_call`: fires via Platform API.
- `whatsapp_event`: fires on WhatsApp events (requires `event`, optional `phone_number_id`).
- `project_event`: fires when a matching Project Event is emitted (requires `event_name`, optional property filter).

Use these scripts:
- `scripts/list-triggers.js <workflow-id>`
- `scripts/create-trigger.js <workflow-id> --trigger-type <inbound_message|api_call|whatsapp_event|project_event> ...`
- `scripts/update-trigger.js --trigger-id <id> --active true|false`
- `scripts/delete-trigger.js --trigger-id <id>`
- `scripts/list-whatsapp-phone-numbers.js` (to find `phone_number_id`)

Notes:
- For inbound message triggers, use `phone_number_id` (Meta ID).
- For whatsapp_event triggers, use `event` like `whatsapp.message.received`. Supported events: `whatsapp.message.received`, `whatsapp.message.sent`, `whatsapp.message.failed`, `whatsapp.conversation.created`, `whatsapp.conversation.ended`. `whatsapp.message.delivered` and `whatsapp.message.read` are not available for new triggers — use webhooks for delivery and read receipts.
- For API triggers, no extra fields are required.
- For project_event triggers, use `triggerable_attributes: { event_name, property_key?, operator?, property_value? }`.
- Project Event names must be lowercase dotted snake_case, for example `conversation.csat_scored`.
- Supported property filter operators are `eq`, `lt`, `lte`, `gt`, and `gte`; `property_value` must be non-null when provided.
- Project-event-triggered workflows run as observer/read-only executions and cannot emit more Project Events.
