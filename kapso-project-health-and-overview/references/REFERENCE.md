# Health Check Interpretation

## 60-second triage order

1. Confirm the health check ran (status + timestamp).
2. Identify the blocking check in this order:
   - `checks.phone_number_access.passed`
   - `checks.token_validity.passed`
   - `checks.messaging_health.overall_status` (BLOCKED is critical, LIMITED is degraded)
   - `checks.webhook_verified.passed`
   - `checks.webhook_subscription.passed`
   - `checks.test_message.passed` (only if a test was requested)
3. Lead with overall status (healthy/degraded/unhealthy), then name failing checks.

## If status is "error"

Explain that the health check itself failed to run and surface the error message from the payload.

## Common messaging health statuses

- `HEALTHY`: normal operations.
- `LIMITED`: degraded throughput; expect delays.
- `BLOCKED`: critical; outbound messaging blocked.
