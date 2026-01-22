---
name: kapso-api
description: Kapso Platform API overview with authentication, base URLs, customer onboarding, setup links, phone number provisioning, and connection detection workflows.
---

# Kapso Platform API

## Overview

Use this skill for Platform API navigation, authentication, and multi-tenant onboarding:

- Customers and setup links
- Phone number provisioning
- Connection detection via webhooks or redirect URLs
- Choosing the correct API (Platform vs Meta proxy)

## Before making changes

- Read the relevant files in `references/` for endpoint maps and onboarding steps.
- Confirm base URLs and required headers before suggesting a curl request.

## Workflow decision tree

### Customers and setup links
Use the customer endpoints and setup link workflow.

### Connection detection
Use project webhooks or success redirect URLs.

### Need specific endpoint maps
Load `references/platform-api-reference.md`.

## Quickstart

Base host: `https://api.kapso.ai` (scripts append `/platform/v1`)

Auth header:

```
X-API-Key: <api_key>
```

Start with:

- `references/getting-started.md`
- `references/setup-links.md`
- `references/detecting-whatsapp-connection.md`

## Core workflows

### Onboard a customer
1. Create customer: `POST /customers`.
2. Generate setup link: `POST /customers/:id/setup_links`.
3. Customer completes embedded signup.
4. Use `phone_number_id` to send messages.

### Detect connection
Option A: Project webhook `whatsapp.phone_number.created`.

Option B: Success redirect URL query params.

Use both for the best UX and backend reliability.

### Provision phone numbers
When creating a setup link, set:

```json
{
  "setup_link": {
    "provision_phone_number": true,
    "phone_number_country_isos": ["US"]
  }
}
```

## Notes

- Platform API base: `/platform/v1`.
- Meta proxy base: `/meta/whatsapp/v24.0` (use for messaging and templates).
- Use `phone_number_id` as the primary WhatsApp identifier.

## References

- `references/platform-api-reference.md`
- `references/getting-started.md`
- `references/setup-links.md`
- `references/detecting-whatsapp-connection.md`

## Related skills

- Workflow automation: `kapso-automation`
- WhatsApp messaging and templates: `whatsapp-messaging`
- WhatsApp Flows: `whatsapp-flows`
- Operations and webhooks: `kapso-ops`
