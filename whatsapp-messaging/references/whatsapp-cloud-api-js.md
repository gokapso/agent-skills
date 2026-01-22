---
title: whatsapp-cloud-api-js SDK
---

# whatsapp-cloud-api-js

Use the `@kapso/whatsapp-cloud-api` SDK for typed WhatsApp Cloud API calls.

## Install

```bash
npm install @kapso/whatsapp-cloud-api
```

## Create a client

Kapso proxy setup:

```ts
import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";

const client = new WhatsAppClient({
  baseUrl: "https://api.kapso.ai/meta/whatsapp",
  kapsoApiKey: process.env.KAPSO_API_KEY!
});
```

Direct Meta setup:

```ts
const client = new WhatsAppClient({
  accessToken: process.env.WHATSAPP_TOKEN!
});
```

## Send a text message

```ts
await client.messages.sendText({
  phoneNumberId: "<PHONE_NUMBER_ID>",
  to: "+15551234567",
  body: "Hello from Kapso"
});
```

## Send a template message

```ts
await client.messages.sendTemplate({
  phoneNumberId: "<PHONE_NUMBER_ID>",
  to: "+15551234567",
  template: {
    name: "order_ready_named",
    language: { code: "en_US" },
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", parameterName: "order_id", text: "ORDER-123" }
        ]
      }
    ]
  }
});
```

## Send an interactive button message

```ts
await client.messages.sendInteractiveButtons({
  phoneNumberId: "<PHONE_NUMBER_ID>",
  to: "+15551234567",
  bodyText: "Choose an option",
  buttons: [
    { id: "accept", title: "Accept" },
    { id: "decline", title: "Decline" }
  ]
});
```

## Notes

- Use `phoneNumberId` from the connected WhatsApp number (discover via `node scripts/list-platform-phone-numbers.mjs`).
- With Kapso proxy, keep `baseUrl` and `kapsoApiKey` set.
- Template rules still apply (examples, button ordering, media headers).
