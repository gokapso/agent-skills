---
title: Connection detection
description: Know when customers complete WhatsApp onboarding
---

You have two ways to detect when customers connect their WhatsApp account through setup links.

## 1. Project webhooks

Configure a project webhook to receive the `whatsapp.phone_number.created` event. This is the recommended approach for server-to-server notifications.

### Setup

1. Open the sidebar and click **Integrations → Webhooks**
2. Go to the **Platform webhooks** tab
3. Click **Add Webhook**
4. Enter your HTTPS endpoint URL
5. Copy the auto-generated secret key
6. Subscribe to `whatsapp.phone_number.created` event

### Webhook payload

```json
{
  "phone_number_id": "123456789012345",
  "project": {
    "id": "990e8400-e29b-41d4-a716-446655440004"
  },
  "customer": {
    "id": "880e8400-e29b-41d4-a716-446655440003"
  }
}
```

### Handle the webhook

Register this route **before** any global `express.json()` middleware so the signature is checked against the original bytes. Keep the webhook secret and expected Kapso project ID in server-side configuration. Use a dedicated webhook subscribed to `whatsapp.phone_number.created` for this receiver. V2 has connection fields at the body root and its event name in `X-Webhook-Event`; the example also accepts an event/data envelope.

```javascript
const { createHmac, timingSafeEqual } = require('node:crypto');
const webhookSecret = process.env.KAPSO_WEBHOOK_SECRET;
const expectedProjectId = process.env.KAPSO_PROJECT_ID;
if (!webhookSecret || !expectedProjectId) throw new Error('Missing webhook configuration');

app.post('/webhooks/project', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.get('X-Webhook-Signature');
  if (!Buffer.isBuffer(req.body) || !/^[a-f0-9]{64}$/i.test(signature || '')) {
    return res.status(401).send('Invalid webhook signature');
  }
  const expected = createHmac('sha256', webhookSecret).update(req.body).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) {
    return res.status(401).send('Invalid webhook signature');
  }

  let payload;
  try { payload = JSON.parse(req.body.toString('utf8')); }
  catch { return res.status(400).send('Invalid JSON'); }
  const event = payload.event || req.get('X-Webhook-Event');
  const data = payload.data || payload;

  if (event === 'whatsapp.phone_number.created') {
    if (data?.project?.id !== expectedProjectId) {
      return res.status(403).send('Unexpected project');
    }
    const { phone_number_id, customer } = data;
    if (!phone_number_id || !customer?.id) return res.status(400).send('Missing connection identifiers');

    // Map the signed Kapso customer ID to your own record if the IDs differ.
    await db.customers.update(customer.id, {
      phone_number_id,
      whatsapp_connected: true,
      connected_at: new Date()
    });

    // Trigger welcome flow
    await sendWelcomeMessage(phone_number_id, customer.id);
  }

  res.status(200).send('OK');
});
```

See [webhooks documentation](/docs/platform/webhooks) for signature verification and best practices.

Kapso retries deliveries; make database updates and the welcome flow idempotent using `X-Idempotency-Key` in your application.

## 2. Success redirect URL

When customers complete WhatsApp setup, they're redirected to your `success_redirect_url` with query parameters.

### Setup

When creating a setup link, provide redirect URLs:

```javascript
const KAPSO_API_BASE_URL = 'https://api.kapso.ai';
const setupLink = await fetch(`${KAPSO_API_BASE_URL}/platform/v1/customers/customer-123/setup_links`, {
  method: 'POST',
  headers: {
    'X-API-Key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    setup_link: {
      success_redirect_url: 'https://your-app.com/whatsapp/success',
      failure_redirect_url: 'https://your-app.com/whatsapp/failed'
    }
  })
});
```

### Query parameters

After successful setup, customer is redirected to:

```
https://your-app.com/whatsapp/success?setup_link_id=...&status=completed&phone_number_id=123456789012345&business_account_id=...&provisioned_phone_number_id=...&display_phone_number=%2B15551234567
```

**Parameters**:
- `setup_link_id` - UUID of the setup link
- `status` - Always `completed` for success
- `phone_number_id` - WhatsApp phone number ID (primary identifier)
- `business_account_id` - Meta WABA ID (if available)
- `provisioned_phone_number_id` - Kapso phone number ID (if provisioning was used)
- `display_phone_number` - E.164 formatted phone number (URL encoded)

### Handle the redirect

Query parameters are browser-controlled. They help locate a connection but do not prove onboarding succeeded or authorize a customer update. When creating the setup link, persist its ID on your own customer's record. Require your application's authenticated customer session (shown as `requireCustomerSession` below), compare the returned ID with that stored setup link, and verify the number through your project-scoped API key.

```javascript
app.get('/whatsapp/success', requireCustomerSession, async (req, res) => {
  const customer = await db.customers.findById(req.user.customerId);
  const { setup_link_id, phone_number_id } = req.query;
  if (!customer || typeof setup_link_id !== 'string' || typeof phone_number_id !== 'string' ||
      setup_link_id !== customer.kapso_setup_link_id) {
    return res.status(403).send('Unexpected onboarding session');
  }

  const query = new URLSearchParams({
    customer_id: customer.kapso_customer_id,
    phone_number_id
  });
  const response = await fetch(`https://api.kapso.ai/platform/v1/whatsapp/phone_numbers?${query}`, {
    headers: { 'X-API-Key': process.env.KAPSO_API_KEY },
    redirect: 'error'
  });
  if (!response.ok) return res.status(502).send('Unable to verify connection');
  const result = await response.json();
  const number = result.data?.find(item =>
    item.phone_number_id === phone_number_id && item.customer_id === customer.kapso_customer_id
  );
  if (!number) return res.status(409).render('whatsapp-connection-pending');

  // Store verified API values on the authenticated customer's record.
  await db.customers.update(customer.id, {
    phone_number_id: number.phone_number_id,
    business_account_id: number.business_account_id,
    display_phone_number: number.display_phone_number,
    whatsapp_connected: true,
    connected_at: new Date()
  });

  // Show success page to customer
  res.render('whatsapp-connected', {
    phoneNumber: number.display_phone_number
  });
});
```

<Note>
Use redirect parameters for navigation and progress displays. Persist a connection only after a verified webhook or authenticated API confirmation for the correct customer. If the customer has no browser session, rely on the verified webhook and show a generic progress page.
</Note>

### Failure redirect

If setup fails, customer is redirected to your `failure_redirect_url`:

```
https://your-app.com/whatsapp/failed?setup_link_id=...&error_code=facebook_auth_failed
```

**Error codes**:
- `facebook_auth_failed` - Facebook login cancelled
- `phone_verification_failed` - Phone verification failed
- `waba_limit_reached` - Too many WhatsApp accounts
- `token_exchange_failed` - OAuth failed
- `link_expired` - Link expired (30 days)
- `already_used` - Link already used

```javascript
app.get('/whatsapp/failed', (req, res) => {
  const { setup_link_id, error_code } = req.query;

  // Log failure for monitoring
  await logSetupFailure(setup_link_id, error_code);

  // Show user-friendly error message
  res.render('whatsapp-setup-failed', {
    errorMessage: getErrorMessage(error_code)
  });
});
```

## Choosing the right method

**Use project webhooks when**:
- You need server-to-server notification
- Customer doesn't need immediate visual feedback
- You're building automated onboarding flows
- You need to process the connection before showing UI

**Use success redirect when**:
- Customer needs immediate confirmation in your app
- You want to show a custom success page
- You're building a wizard-style onboarding flow
- You need to collect additional information after connection

**Use both**:
- Webhook for backend processing (database updates, welcome messages)
- Redirect for frontend experience (success page, next steps)
