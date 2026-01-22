---
name: whatsapp-messaging
description: Send WhatsApp messages via Kapso Meta proxy or the whatsapp-cloud-api-js library, and manage WhatsApp templates (create/update/submit/status/send) with media uploads.
---

# WhatsApp Messaging

## Overview

Use this skill to send WhatsApp messages, manage templates, and upload media using:

- Kapso Meta proxy endpoints (`/meta/whatsapp/vXX.X`)
- The `@kapso/whatsapp-cloud-api` SDK
- Template management scripts bundled here

## Before making changes

- Read the relevant files in `references/` for payload rules and SDK usage.
- Inspect the exact `scripts/` you will run to confirm endpoint paths and flags.
- Use `assets/` examples as the base for templates and send-time payloads.

## Quickstart

Set env vars:

- `KAPSO_API_BASE_URL` (host only, no `/platform/v1`)
- `KAPSO_API_KEY`
- `PROJECT_ID`
- `KAPSO_META_GRAPH_VERSION` (optional, default: `v24.0`)
- `KAPSO_META_BASE_URL` (optional, defaults to `${KAPSO_API_BASE_URL}/meta`)

Run scripts with Node or Bun:

- `node scripts/list-platform-phone-numbers.mjs`
- `node scripts/list-templates.mjs --help`

## Critical: Discover IDs (do this first)

Templates and message sends use two different Meta IDs:

- `business_account_id` (WABA ID): required for template CRUD (`/{business_account_id}/message_templates`)
- `phone_number_id` (Meta phone number id): required for sending messages + media upload (`/{phone_number_id}/messages`, `/{phone_number_id}/media`)

Use the Platform API (recommended) to discover both:

- `node scripts/list-platform-phone-numbers.mjs`

## Golden path: Create + send a UTILITY template

1. Discover IDs: `node scripts/list-platform-phone-numbers.mjs`
2. Draft a template payload (start from `assets/template-utility-order-status-update.json`).
3. Create: `node scripts/create-template.mjs --business-account-id <WABA_ID> --file assets/template-utility-order-status-update.json`
4. Check status: `node scripts/template-status.mjs --business-account-id <WABA_ID> --name order_status_update`
5. Send a test message (start from `assets/send-template-order-status-update.json`):
   - `node scripts/send-template.mjs --phone-number-id <PHONE_NUMBER_ID> --file assets/send-template-order-status-update.json`

## Golden path: Send an interactive message

Interactive messages are session messages (typically within WhatsApp's 24-hour window). If you need outbound notifications outside the window, use a template.

1. Discover `phone_number_id`: `node scripts/list-platform-phone-numbers.mjs`
2. Pick an interactive payload from `assets/send-interactive-*.json` and customize `to`/content.
3. Send: `node scripts/send-interactive.mjs --phone-number-id <PHONE_NUMBER_ID> --file assets/send-interactive-buttons.json`

## Template workflow (general)

1. Confirm `business_account_id` and `phone_number_id`.
2. Draft the template payload (prefer NAMED params).
3. Create/update (Meta submission happens immediately).
4. Check status with list/status scripts.
5. Send a test message with send-time components.

## Template authoring rules

- Prefer `parameter_format: "NAMED"` with `{{param_name}}`.
- If any variables appear in HEADER or BODY, include examples.
- Do not interleave QUICK_REPLY with URL/PHONE_NUMBER buttons.
- For URL button variables, use positional placeholders in the URL (for example `...{{1}}`).
- Dynamic URL variables must be at the end of the URL.
- AUTHENTICATION templates require OTP button and business verification.

## Send-time rules

- For NAMED templates, include `parameter_name` for parameters in `header`/`body` components.
- URL buttons use a `button` component at send-time (`sub_type: "url"`, `index: "0"`, etc).
- POSITIONAL templates must preserve order.
- AUTHENTICATION templates require the OTP in the body param and URL button param.
- Media headers at send-time must include either `id` or `link` (never both).

## Media header workflow

1. Upload media with `scripts/upload-media.mjs` (returns `media_id`).
2. Use `media_id` or a public link in the send-time header.
3. Header handles for template review are not available via proxy.

## Scripts

- `scripts/list-platform-phone-numbers.mjs`: Platform discovery; shows `business_account_id` + `phone_number_id` for connected numbers.
- `scripts/list-connected-numbers.mjs`: Meta proxy query for a WABA's phone numbers (requires `business_account_id`).
- `scripts/list-templates.mjs`: List templates under a WABA (filters: name/status/category/language, etc).
- `scripts/template-status.mjs`: Fetch one template by name and show status/components.
- `scripts/create-template.mjs`: Create a template under a WABA from `--json` or `--file`.
- `scripts/update-template.mjs`: Update an existing template by `--hsm-id` under a WABA.
- `scripts/submit-template.mjs`: Alias for create (Meta submission happens immediately on create).
- `scripts/send-template.mjs`: Send a template message via Meta proxy (requires `phone_number_id`).
- `scripts/send-interactive.mjs`: Send an interactive message (buttons/list/cta_url/etc) via Meta proxy (requires `phone_number_id`).
- `scripts/upload-media.mjs`: Upload media for send-time headers (returns `media_id`; requires `phone_number_id`).
- `scripts/upload-template-header-handle.mjs`: Explains why `header_handle` upload is blocked via proxy and points to the correct approach.

## Common pitfalls

- Use `language` (not `language_code`) in template creation payloads.
- Include example payloads whenever you use variables in HEADER/BODY.
- For NAMED templates, include `parameter_name` in send-time `header`/`body` parameters.
- Use `scripts/upload-media.mjs` for send-time headers (template review `header_handle` is a different mechanism).

## References (read when you need detail)

- `references/templates-reference.md`: Template creation rules + components cheat sheet + send-time components (includes ID discovery notes).
- `references/whatsapp-api-reference.md`: Raw Meta proxy payloads for sending text/image/template/interactive messages.
- `references/whatsapp-cloud-api-js.md`: SDK usage for sending text/templates (typed client, camelCase helpers).

## Assets (copy/paste starting points)

- `assets/template-utility-order-status-update.json`: UTILITY template definition for order updates (named params + URL button example).
- `assets/send-template-order-status-update.json`: Matching send-time payload for `order_status_update` (header/body params + URL button param).
- `assets/send-interactive-buttons.json`: Interactive button message payload (session message).
- `assets/send-interactive-list.json`: Interactive list payload (session message).
- `assets/send-interactive-cta-url.json`: Interactive CTA URL payload (session message).
- `assets/send-interactive-location-request.json`: Interactive location request payload (session message).
- `assets/send-interactive-catalog-message.json`: Interactive catalog message payload (session message).
- `assets/template-utility-named.json`: UTILITY template definition showing named params + mixed buttons ordering rules.
- `assets/template-marketing-media-header.json`: MARKETING template definition using an IMAGE header (requires review-time `header_handle` example).
- `assets/template-authentication-otp.json`: AUTHENTICATION OTP template definition (COPY_CODE button).

## Related skills

- Workflow automation: `kapso-automation`
- WhatsApp Flows: `whatsapp-flows`
- Platform API and customers: `kapso-api`
