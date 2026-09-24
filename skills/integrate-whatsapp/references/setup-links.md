---
title: Setup links
description: Customize the WhatsApp onboarding experience
---

Setup links let customers connect their WhatsApp Business accounts to your platform. Send a link, customer clicks, logs in with Facebook, and you're connected.

## Quick start

Create a basic setup link:

```bash
curl -X POST https://api.kapso.ai/platform/v1/customers/{customer_id}/setup_links \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "setup_link": {
      "success_redirect_url": "https://your-app.com/whatsapp/success",
      "failure_redirect_url": "https://your-app.com/whatsapp/failed"
    }
  }'
```

Response includes a `url` you send to your customer. Links expire after 30 days.

See [Connection detection](/docs/platform/detecting-whatsapp-connection) for handling successful connections.

## Connection types

Customers can connect their WhatsApp in two ways:

**Coexistence** - Keep using WhatsApp Business app alongside API
- 5 messages/second
- App stays active
- Good for small businesses

**Dedicated** - API-only access for automation
- Up to 1000 messages/second
- No app access
- Built for scale

## Redirect URLs

Configure where customers land after completing or failing setup:

```json
{
  "setup_link": {
    "success_redirect_url": "https://your-app.com/whatsapp/success",
    "failure_redirect_url": "https://your-app.com/whatsapp/failed"
  }
}
```

Both URLs receive query parameters with setup details. See [Connection detection](/docs/platform/detecting-whatsapp-connection) for handling redirects and available parameters.

## Language

Set the setup page language instead of auto-detecting from browser:

```json
{
  "setup_link": {
    "language": "es"
  }
}
```

Supported languages:
- `en` - English
- `es` - Spanish
- `pt` - Portuguese
- `hi` - Hindi
- `id` - Indonesian
- `ar` - Arabic

When omitted, language is auto-detected from the customer's browser.

## Recommended Kapso default

For Kapso-managed onboarding, prefer a dedicated connection plus phone provisioning:

```json
{
  "setup_link": {
    "allowed_connection_types": ["dedicated"],
    "provision_phone_number": true,
    "phone_number_country_isos": ["US"]
  }
}
```

`kapso setup` and `kapso whatsapp numbers new` follow this default path and let you override country, area code, language, and redirect URLs when needed.

## Connection type control

### Show both options (default)
```json
{
  "setup_link": {
    "allowed_connection_types": ["coexistence", "dedicated"]
  }
}
```

### Coexistence only
For customers using WhatsApp Business app:
```json
{
  "setup_link": {
    "allowed_connection_types": ["coexistence"]
  }
}
```

### Dedicated only
For API-only automation:
```json
{
  "setup_link": {
    "allowed_connection_types": ["dedicated"]
  }
}
```

When you provide one option, it auto-selects.

## Meta billing policy

Set `meta_billing_mode` to `partner_managed` to have Kapso pay Meta message fees from project credits. This mode requires Kapso's default Meta app or a custom Meta app backed by an active hosted multi-partner solution. If neither is available, setup-link creation returns `422 Unprocessable Entity`.

<!-- TODO: Link to public multi-partner solution setup documentation when available. -->

## Theme customization

Match your brand colors:

```json
{
  "setup_link": {
    "theme_config": {
      "primary_color": "#3b82f6",
      "background_color": "#ffffff",
      "text_color": "#1f2937",
      "muted_text_color": "#64748b",
      "card_color": "#f9fafb",
      "border_color": "#e5e7eb"
    }
  }
}
```

All colors use hex format (#RRGGBB).

## Phone number provisioning

Automatically provision a phone number for customers:

```json
{
  "setup_link": {
    "provision_phone_number": true,
    "phone_number_country_isos": ["US"]
  }
}
```

### Country support

- Default: `["US"]` - US phone numbers only
- Non-US countries require custom Twilio credentials (contact sales)

```json
{
  "setup_link": {
    "provision_phone_number": true,
    "phone_number_country_isos": ["US", "CL"]
  }
}
```

## Reconnect existing numbers

For customers whose WhatsApp connection broke (token revoked, password change, Meta de-auth), generate a setup link scoped to one of their existing numbers:

```json
{
  "setup_link": {
    "reconnect_phone_number": "+14155551234"
  }
}
```

Constraints:
- The number must match an existing production WhatsApp config on the same customer.
- `provision_phone_number` is forced to `false`.
- `allowed_connection_types` is locked to `["dedicated"]` or `["coexistence"]` to match the existing config.
- During Meta's embedded signup, the customer must reconnect the same WABA + number — selecting a different one fails the setup.

The hosted onboarding page uses this to refresh credentials in place rather than create a new config.

## Full example

```javascript
const KAPSO_API_BASE_URL = 'https://api.kapso.ai';
const setupLink = await fetch(
  `${KAPSO_API_BASE_URL}/platform/v1/customers/${customerId}/setup_links`,
  {
    method: 'POST',
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      setup_link: {
        language: 'es',
        success_redirect_url: 'https://app.example.com/onboarding/complete',
        failure_redirect_url: 'https://app.example.com/onboarding/error',
        allowed_connection_types: ['dedicated'],
        provision_phone_number: true,
        phone_number_country_isos: ['US'],
        theme_config: {
          primary_color: '#10b981',
          background_color: '#ffffff',
          text_color: '#111827'
        }
      }
    })
  }
);

// Send link to customer
await sendEmail(customer.email, {
  subject: 'Connect your WhatsApp',
  body: `Click here to connect: ${setupLink.data.url}`
});
```

## Link management

### List all links
```bash
curl https://api.kapso.ai/platform/v1/customers/{customer_id}/setup_links \
  -H "X-API-Key: YOUR_API_KEY"
```

### Automatic revocation
Creating a new link revokes the previous one. Only one active link per customer.

### Expiration
Links expire after 30 days. Check the `expires_at` field.
