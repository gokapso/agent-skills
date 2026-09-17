#!/usr/bin/env node
const { parseArgs, getStringFlag } = require('./lib/cli');
const { platformRequest } = require('./lib/http');
const { run } = require('./lib/run');
const { requireFlowId } = require('./lib/whatsapp-flow');

run(async () => {
  const { flags } = parseArgs(process.argv.slice(2));
  const flowId = requireFlowId(flags);
  const functionId = getStringFlag(flags, 'function-id') || getStringFlag(flags, 'function_id');
  if (!functionId) {
    throw new Error('Missing --function-id');
  }

  return platformRequest({
    method: 'PATCH',
    path: `/platform/v1/whatsapp/flows/${flowId}/data_endpoint`,
    body: { function_id: functionId }
  });
});
