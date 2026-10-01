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

Use a constant-time comparison after checking the supplied signature is a 64-character hex string. Reject missing or invalid signatures before processing events, updating records, or sending messages. See the [Express connection-handler example](detecting-whatsapp-connection.md#handle-the-webhook).

## Credential handling

Bundled scripts preserve their JSON output envelopes and redact recognized credential fields, including webhook `secret_key`, API keys, access tokens, authorization headers, and private keys. Identifiers and ordinary response data remain available. Do not rely on redaction to remove arbitrary private customer data from logs.

If a command returns a one-time secret needed for setup, capture its original result in a private file:

```bash
# /path/to/private is an existing directory accessible only to your user.
KAPSO_SECRET_OUTPUT_FILE=/path/to/private/new-webhook.json \
  node scripts/create.js --scope project --url https://example.com/webhooks \
  --events whatsapp.phone_number.created
```

The file is created exclusively with mode `0600` before the API request, so an invalid or existing path fails before creating a webhook. It can remain empty if the request fails before a result is available. Existing files and symlinks are rejected. Configure your receiver from this file without printing the secret, then store it in your secret manager and remove the temporary file. Keep the file out of version control.

Authenticated requests use the explicitly configured API host and reject redirects. HTTPS is required unless `KAPSO_ALLOW_INSECURE_HTTP=true` explicitly opts into a trusted development endpoint; use disposable development credentials for HTTP.

## Event catalog

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

Lifecycle events (project-level only):

- `whatsapp.config.created`
- `whatsapp.phone_number.created`
- `whatsapp.phone_number.deleted`
- `whatsapp.phone_number.offboarded`
- `whatsapp.phone_number.disconnected`
- `whatsapp.phone_number.reconnected`

`offboarded`, `disconnected`, and `reconnected` require `payload_version: v2`.

Workflow events:

- `workflow.execution.handoff`
- `workflow.execution.failed`

## Payload versions

- `v1`: legacy payloads with nested `whatsapp_config`.
- `v2`: modern payloads with `phone_number_id` at root (recommended).

## Buffering (message.received)

Use buffering to batch rapid inbound messages:

- `buffer_enabled`: true
- `buffer_window_seconds`: 1-60
- `max_buffer_size`: 1-100
