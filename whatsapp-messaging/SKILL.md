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

## Workflow decision tree

### Create or update a template
Use the template scripts and `references/templates-reference.md`.

### Send a template message
Use `scripts/send-template.mjs` and follow send-time rules.

### Send non-template messages
Use the SDK or the Meta proxy message endpoint (see `references/whatsapp-api-reference.md`).

### Upload media
Use `scripts/upload-media.mjs` for send-time headers.

## Quickstart

Set env vars:

- `KAPSO_API_BASE_URL` (host only, no `/platform/v1`)
- `KAPSO_API_KEY`
- `PROJECT_ID`
- `KAPSO_META_GRAPH_VERSION` (optional, default: `v24.0`)
- `KAPSO_META_BASE_URL` (optional, defaults to `${KAPSO_API_BASE_URL}/meta`)

Run scripts with Node or Bun:

- `node scripts/list-templates.mjs --help`
- `bun scripts/list-templates.mjs --help`

## Template workflow

1. Confirm `business_account_id` and `phone_number_id`.
2. Draft the template payload (prefer NAMED params).
3. Create/update (Meta submission happens immediately).
4. Check status with list/status scripts.
5. Send a test message with send-time components.

## Template authoring rules

- Prefer `parameter_format: "NAMED"` with `{{param_name}}`.
- If any variables appear in HEADER or BODY, include examples.
- Do not interleave QUICK_REPLY with URL/PHONE_NUMBER buttons.
- Dynamic URL variables must be at the end of the URL.
- AUTHENTICATION templates require OTP button and business verification.

## Send-time rules

- NAMED templates require `parameter_name` for each parameter.
- POSITIONAL templates must preserve order.
- AUTHENTICATION templates require the OTP in the body param and URL button param.
- Media headers at send-time must include either `id` or `link` (never both).

## Media header workflow

1. Upload media with `scripts/upload-media.mjs` (returns `media_id`).
2. Use `media_id` or a public link in the send-time header.
3. Header handles for template review are not available via proxy.

## Commands (templates)

- `scripts/list-connected-numbers.mjs`
- `scripts/list-templates.mjs`
- `scripts/template-status.mjs`
- `scripts/create-template.mjs`
- `scripts/update-template.mjs`
- `scripts/submit-template.mjs`
- `scripts/send-template.mjs`
- `scripts/upload-media.mjs`
- `scripts/upload-template-header-handle.mjs`

## Common pitfalls

- Using `language_code` instead of `language` in template creation.
- Skipping example payloads for variables.
- Sending NAMED templates without `parameter_name`.
- Using header_handle upload via proxy (not supported).

## References and assets

- `references/templates-reference.md`
- `references/whatsapp-api-reference.md`
- `references/whatsapp-cloud-api-js.md`
- `assets/template-marketing-named.json`
- `assets/template-utility-media-header.json`
- `assets/template-authentication-otp.json`

## Related skills

- Workflow automation: `kapso-automation`
- WhatsApp Flows: `whatsapp-flows`
- Platform API and customers: `kapso-api`
