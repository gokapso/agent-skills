---
name: kapso-whatsapp-template-management
description: Manage WhatsApp message templates via Kapso's Meta proxy (list/create/update/submit/status/send), upload media for send-time headers, and format template components. Use when a user asks to build, edit, submit, or send WhatsApp templates or needs header media guidance.
---

# Kapso WhatsApp Template Management (Meta Proxy)

## Quickstart

Use the skills snapshot mounted at `/agent-skills`.

Run scripts with Node or Bun:

- `node /agent-skills/kapso-whatsapp-template-management/scripts/list-templates.mjs --help`
- `bun /agent-skills/kapso-whatsapp-template-management/scripts/list-templates.mjs --help`

Required environment variables:

- `KAPSO_API_BASE_URL` (root, e.g. `https://api.kapso.ai`)
- `KAPSO_API_KEY`
- `PROJECT_ID`
- `KAPSO_META_GRAPH_VERSION` (optional, default: `v24.0`)
- `KAPSO_META_BASE_URL` (optional, defaults to `${KAPSO_API_BASE_URL}/meta`)

## Workflow

1. Confirm the WABA business_account_id and the phone_number_id to use.
2. Draft the template payload (prefer named parameters; include examples for every variable).
3. Create or update the template (Meta submission happens immediately; no Kapso draft state).
4. Check status via list/filter.
5. Format send-time components based on parameter_format and send a test message.
6. For media headers, upload media for send-time use; header_handle generation is currently blocked via proxy.

## Scripts (one operation per file)

- `scripts/list-connected-numbers.mjs`
  - Lists phone numbers for a WABA: `GET /{business_account_id}/phone_numbers`.

- `scripts/list-templates.mjs`
  - Lists templates: `GET /{business_account_id}/message_templates`.

- `scripts/template-status.mjs`
  - Looks up status by template name (filters list endpoint).

- `scripts/create-template.mjs`
  - Creates a template in Meta: `POST /{business_account_id}/message_templates`.

- `scripts/update-template.mjs`
  - Updates a template by hsm_id: `POST /{business_account_id}/message_templates?hsm_id=...`.

- `scripts/submit-template.mjs`
  - Alias to create (Meta creation submits immediately; no draft status).

- `scripts/send-template.mjs`
  - Sends a template message: `POST /{phone_number_id}/messages`.

- `scripts/upload-media.mjs`
  - Uploads media for send-time headers: `POST /{phone_number_id}/media`.

- `scripts/upload-template-header-handle.mjs`
  - Explains why header_handle upload is blocked via proxy.

## Template authoring rules (creation time)

- Prefer `parameter_format: "NAMED"` and placeholders like `{{order_id}}`.
- If any variables appear in HEADER or BODY, include examples in the component payload.
- Enforce button ordering: do not interleave QUICK_REPLY with URL/PHONE_NUMBER.
- Dynamic URL buttons must place the variable at the end of the URL.
- AUTHENTICATION templates:
  - Body text is fixed by Meta (not customizable).
  - Must include an OTP button (COPY_CODE or ONE_TAP).
  - Business verification in Meta Business Manager is required.

Note: Meta template creation uses `language` (not `language_code`). See assets for examples.

## Send-time rules (when sending)

- NAMED templates: each parameter must include `parameter_name`.
- POSITIONAL templates: omit `parameter_name` and preserve order.
- AUTHENTICATION templates: provide the OTP in the body param and in the URL button param.
- Media headers at send time: provide a header component with `image|video|document` and either `id` or `link` (never both).

## Media header workflow

1. Upload send-time media using `scripts/upload-media.mjs` (returns media_id).
2. Use the media_id or a public link when sending the template.
3. Header handles for template review are not available via proxy; use the Platform media ingest endpoint if needed.

## Blocked operations

- `header_handle` uploads for template review are not supported by the Meta proxy yet.
  - Missing endpoints: `POST /{app_id}/uploads` and `POST /{upload_session_id}`.
  - Use Platform `POST /platform/v1/whatsapp/media` with `delivery: meta_resumable_asset` as a fallback.

## Assets and references

- Sample templates in `assets/`:
  - `assets/template-marketing-named.json`
  - `assets/template-utility-media-header.json`
  - `assets/template-authentication-otp.json`
- Component cheat sheet in `references/REFERENCE.md`.
