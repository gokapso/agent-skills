---
title: WhatsApp Cloud API via Kapso Proxy
---

# WhatsApp Cloud API (Kapso Meta Proxy)

## Base URL and auth

- Base URL: `${KAPSO_API_BASE_URL}/meta/whatsapp/v24.0` (override with `KAPSO_META_BASE_URL`)
- Auth header: `X-API-Key: <api_key>`

All requests are routed through Kapso, but payloads mirror the Meta Cloud API.

## Send a message

Endpoint:

```
POST /{phone_number_id}/messages
```

Text example:

```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "text",
  "text": { "body": "Hello!" }
}
```

Image by link:

```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "image",
  "image": { "link": "https://example.com/photo.jpg", "caption": "Photo" }
}
```

Template send:

```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "template",
  "template": {
    "name": "order_ready_named",
    "language": { "code": "en_US" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "parameter_name": "order_id", "text": "ORDER-123" }
        ]
      }
    ]
  }
}
```

Note: Interactive messages are session messages and typically require an active user-initiated conversation (24-hour window). If the window is expired, use a template instead.

Interactive buttons:

```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": { "text": "Choose an option" },
    "action": {
      "buttons": [
        { "type": "reply", "reply": { "id": "yes", "title": "Yes" } },
        { "type": "reply", "reply": { "id": "no", "title": "No" } }
      ]
    }
  }
}
```

Interactive list:

```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "body": { "text": "Choose an option" },
    "action": {
      "button": "View options",
      "sections": [
        {
          "title": "Menu",
          "rows": [
            { "id": "opt_1", "title": "Option 1", "description": "First option" },
            { "id": "opt_2", "title": "Option 2", "description": "Second option" }
          ]
        }
      ]
    }
  }
}
```

Interactive CTA URL:

```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "interactive",
  "interactive": {
    "type": "cta_url",
    "body": { "text": "Track your order" },
    "action": {
      "name": "cta_url",
      "parameters": {
        "display_text": "Track order",
        "url": "https://example.com/orders/ORDER-123"
      }
    }
  }
}
```

Location request:

```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "interactive",
  "interactive": {
    "type": "location_request_message",
    "body": { "text": "Please share your location." },
    "action": { "name": "send_location" }
  }
}
```

Catalog message:

```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "interactive",
  "interactive": {
    "type": "catalog_message",
    "body": { "text": "Browse our catalog." },
    "action": {
      "name": "catalog_message",
      "parameters": { "thumbnail_product_retailer_id": "SKU_THUMBNAIL" }
    }
  }
}
```

## Upload media

Endpoint:

```
POST /{phone_number_id}/media
```

Use this for send-time header media. The response returns `id` for future sends.

## Notes

- Use `phone_number_id` (Meta ID) for message sends.
- Discover `phone_number_id` + `business_account_id` via `GET /platform/v1/whatsapp/phone_numbers` (or `node scripts/list-platform-phone-numbers.mjs`).
- Payloads must include `messaging_product: "whatsapp"`.
- Keep `KAPSO_META_GRAPH_VERSION` aligned with the Meta version you target.
