# Debugging Workflow

## Message delivery failed

1. Collect message ID (`wamid.*`).
2. Search Logs for the WAMID over 24h, then 7d if empty.
3. Inspect message lifecycle timeline.
4. Translate error codes into user-facing guidance.

## WhatsApp config issues

1. Run a health check on the phone number config.
2. Review token validity, messaging health, and webhook subscription.
3. Explain whether the issue is critical or degraded.

## Webhook delivery failures

1. Search Logs with source `webhook_delivery`.
2. Review recent delivery attempts.
3. Check response status codes and error messages.
4. Verify webhook URL availability and signature verification logic.

## API errors

1. Search Logs with source `external_api_log`.
2. Filter by status code or endpoint.
3. Identify auth errors, rate limits, or upstream failures.
