# WhatsApp Templates via Meta Proxy

## Environment

Required env vars:

- `KAPSO_API_BASE_URL` (root, e.g. `https://api.kapso.ai`)
- `KAPSO_API_KEY`
- `PROJECT_ID`
- `KAPSO_META_GRAPH_VERSION` (optional, default: `v24.0`)
- `KAPSO_META_BASE_URL` (optional, defaults to `${KAPSO_API_BASE_URL}/meta`)

## Meta proxy endpoints used

- List WABA phone numbers:
  - `GET /{business_account_id}/phone_numbers`

- List templates:
  - `GET /{business_account_id}/message_templates`

- Create template:
  - `POST /{business_account_id}/message_templates`

- Update template:
  - `POST /{business_account_id}/message_templates?hsm_id=<template_id>`

- Delete template (not scripted):
  - `DELETE /{business_account_id}/message_templates?name=<template_name>`

- Send template message:
  - `POST /{phone_number_id}/messages`

- Upload media for send-time headers:
  - `POST /{phone_number_id}/media`

## Header handle limitation

The Meta proxy registry does not expose the resumable upload endpoints required to obtain `header_handle` values for template review. Use Platform media ingest (`/platform/v1/whatsapp/media` with `delivery: meta_resumable_asset`) if a header_handle is required.

## Template components (creation time)

### Header (TEXT, named)

```json
{
  "type": "HEADER",
  "format": "TEXT",
  "text": "Sale starts {{sale_date}}",
  "example": {
    "header_text_named_params": [
      { "param_name": "sale_date", "example": "December 1" }
    ]
  }
}
```

### Header (TEXT, positional)

```json
{
  "type": "HEADER",
  "format": "TEXT",
  "text": "Sale starts {{1}}",
  "example": {
    "header_text": ["December 1"]
  }
}
```

### Header (IMAGE/VIDEO/DOCUMENT)

```json
{
  "type": "HEADER",
  "format": "IMAGE",
  "example": {
    "header_handle": ["<header_handle>"]
  }
}
```

### Body (named)

```json
{
  "type": "BODY",
  "text": "Hi {{customer_name}}, order {{order_id}} is ready.",
  "example": {
    "body_text_named_params": [
      { "param_name": "customer_name", "example": "Alex" },
      { "param_name": "order_id", "example": "ORDER-123" }
    ]
  }
}
```

### Body (positional)

```json
{
  "type": "BODY",
  "text": "Order {{1}} is ready for {{2}}.",
  "example": {
    "body_text": [["ORDER-123", "Alex"]]
  }
}
```

### Footer (no variables)

```json
{
  "type": "FOOTER",
  "text": "Reply STOP to opt out"
}
```

### Buttons

```json
{
  "type": "BUTTONS",
  "buttons": [
    { "type": "QUICK_REPLY", "text": "Need help" },
    { "type": "URL", "text": "Track", "url": "https://example.com/track?id={{1}}", "example": ["https://example.com/track?id=ORDER-123"] }
  ]
}
```

Rules:

- Do not interleave QUICK_REPLY with URL/PHONE_NUMBER.
- Dynamic URL variables must appear at the end.

## AUTHENTICATION template components

```json
{
  "type": "BODY",
  "add_security_recommendation": true,
  "code_expiration_minutes": 10
}
```

```json
{
  "type": "BUTTONS",
  "buttons": [
    { "type": "OTP", "otp_type": "COPY_CODE", "text": "Copy code" }
  ]
}
```

Notes:

- Body text is fixed by Meta.
- OTP button is required.

## Send-time components

### Named parameters

```json
{
  "type": "body",
  "parameters": [
    { "type": "text", "parameter_name": "order_id", "text": "ORDER-123" }
  ]
}
```

### Positional parameters

```json
{
  "type": "body",
  "parameters": [
    { "type": "text", "text": "ORDER-123" }
  ]
}
```

### AUTHENTICATION send-time

```json
[
  {
    "type": "body",
    "parameters": [{ "type": "text", "text": "123456" }]
  },
  {
    "type": "button",
    "sub_type": "url",
    "index": "0",
    "parameters": [{ "type": "text", "text": "123456" }]
  }
]
```

### Media header send-time

```json
{
  "type": "header",
  "parameters": [
    { "type": "image", "image": { "link": "https://example.com/header.jpg" } }
  ]
}
```

Rules:

- Use either `id` or `link` (never both).
- Always include the header component when the template has a media header.
