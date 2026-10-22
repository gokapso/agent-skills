#!/usr/bin/env node
const { parseArgs, getStringFlag } = require('./lib/cli');
const { metaRequest } = require('./lib/http');
const { run } = require('./lib/run');
const { requireFlowId } = require('./lib/whatsapp-flow');

run(async () => {
  const { flags } = parseArgs(process.argv.slice(2));
  const flowId = requireFlowId(flags);
  // Deletion resolves the WhatsApp configuration from the phone number only:
  // scoping by --business-account-id answers "Unsupported endpoint", and with
  // no scope at all the proxy answers "WhatsApp configuration not found".
  const phoneNumberId =
    getStringFlag(flags, 'phone-number-id') ||
    getStringFlag(flags, 'phone_number_id');

  if (!phoneNumberId) {
    throw new Error('Provide --phone-number-id');
  }

  // Meta's delete node is `/{flow-id}`; there is no `flows` collection node to
  // delete through. The proxy forwards this path verbatim, so `/flows/{id}`
  // comes back as "Unknown path components: /{id}".
  return metaRequest({
    method: 'DELETE',
    path: `/${flowId}`,
    query: { phone_number_id: phoneNumberId }
  });
});
