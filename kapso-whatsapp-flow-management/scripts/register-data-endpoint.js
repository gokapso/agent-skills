#!/usr/bin/env node
const { parseArgs, getStringFlag } = require('./lib/cli');
const { platformRequest } = require('./lib/http');
const { run } = require('./lib/run');
const { requireFlowId } = require('./lib/whatsapp-flow');

run(async () => {
  const { flags } = parseArgs(process.argv.slice(2));
  const flowId = requireFlowId(flags);
  const whatsappConfigId = getStringFlag(flags, 'whatsapp-config-id');

  const body = {};
  if (whatsappConfigId) {
    body.whatsapp_config_id = whatsappConfigId;
  }

  return platformRequest({
    method: 'POST',
    path: `/whatsapp/flows/${flowId}/data_endpoint/register`,
    body: Object.keys(body).length > 0 ? body : undefined
  });
});
