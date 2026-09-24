# Message Debugging Playbook

## Message delivery failed

1. Identify the message ID (`wamid.*`).
2. Search Logs for the WAMID or customer phone number over 24h, then 7d if empty.
3. Review the status timeline in order: sent -> delivered -> read.
4. Surface error codes in status events and map to remediation.

## Common issues to confirm

- Recipient phone number formatting and registration.
- Template approval status (for business-initiated messages).
- Messaging health status (LIMITED/BLOCKED).
- Webhook subscription and inbound event receipt.
