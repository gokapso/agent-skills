# Webhook Reference

## Scopes

- Config-level: attach to a specific WhatsApp phone number (use `phone_number_id`).
- Project-level: receive lifecycle/workflow events across all numbers.
- Use config-level for any `whatsapp.message.*` and `whatsapp.conversation.*` events.
- WhatsApp message/conversation events are **not** delivered via project webhooks.

## Signature verification

Kapso signs outbound webhook requests:

- Header: `X-Webhook-Signature`
- Value: `HMAC-SHA256(webhook_secret_key, raw_request_body)` as hex

Verify against the raw request body bytes before JSON parsing.

## Event catalog

Only the names below are accepted. Creating or updating a Kapso webhook with any other
event name returns `422` and saves nothing — on update the existing subscriptions are kept:

```json
{
  "error": "Events contains unsupported events: \"whatsapp.message.status_updated\""
}
```

Message events (config-level):

- `whatsapp.message.received`
- `whatsapp.message.sent`
- `whatsapp.message.delivered`
- `whatsapp.message.read`
- `whatsapp.message.failed`

Conversation events:

- `whatsapp.conversation.created`
- `whatsapp.conversation.ended`
- `whatsapp.conversation.inactive`

Contact events:

- `whatsapp.contact.identity_changed`
- `whatsapp.contact.marketing_preference_changed`
- `whatsapp.meta_business_agent.handover`

Lifecycle events (project-level only):

- `whatsapp.config.created`
- `whatsapp.phone_number.created`
- `whatsapp.phone_number.deleted`
- `whatsapp.phone_number.offboarded`
- `whatsapp.phone_number.disconnected`
- `whatsapp.phone_number.reconnected`

Account enforcement events (project-level only):

- `whatsapp.account.disabled`
- `whatsapp.account.restricted`
- `whatsapp.account.reinstated`
- `whatsapp.account.violation`

Workflow events:

- `workflow.execution.handoff`
- `workflow.execution.failed`

Custom project events:

- `project.event`

Agent run events:

- `kapso_agent.run.approval_required`
- `kapso_agent.run.completed`
- `kapso_agent.run.failed`
- `kapso_agent.run.cancelled`

## Payload versions

- `v1`: legacy payloads with nested `whatsapp_config`.
- `v2`: modern payloads with `phone_number_id` at root (recommended).

## Buffering (message.received)

Use buffering to batch rapid inbound messages:

- `buffer_enabled`: true
- `buffer_window_seconds`: 1-60
- `max_buffer_size`: 1-100
