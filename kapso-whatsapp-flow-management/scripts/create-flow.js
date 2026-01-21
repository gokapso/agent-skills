#!/usr/bin/env node
const { parseArgs, getStringFlag, getBooleanFlag, readFlagJson } = require('./lib/cli');
const { platformRequest } = require('./lib/http');
const { run } = require('./lib/run');

run(async () => {
  const { flags } = parseArgs(process.argv.slice(2));
  const whatsappConfigId = getStringFlag(flags, 'whatsapp-config-id');
  if (!whatsappConfigId) {
    throw new Error('Missing required flag --whatsapp-config-id');
  }

  const name = getStringFlag(flags, 'name');
  const publish = getBooleanFlag(flags, 'publish');
  const flowJson = await readFlagJson(flags, 'flow-json', 'flow-json-file');

  const body = {
    whatsapp_config_id: whatsappConfigId
  };

  if (name) body.name = name;
  if (flowJson) body.flow_json = flowJson;
  if (publish) body.publish = true;

  return platformRequest({
    method: 'POST',
    path: '/whatsapp/flows',
    body
  });
});
