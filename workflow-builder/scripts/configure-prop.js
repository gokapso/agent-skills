#!/usr/bin/env node
import { loadConfig, requestJson } from './lib/kapso-api.js';
import { ok, err, printJson } from './lib/result.js';
import { parseArgs, getFlag, getBooleanFlag } from './lib/args.js';

function usage() {
  return ok({
    usage: 'node scripts/configure-prop.js --action-id <id> --prop-name <name> --account-id <id> [--configured-props <json>] [--dynamic-props-id <id>]',
    env: ['KAPSO_API_BASE_URL', 'KAPSO_API_KEY', 'PROJECT_ID']
  });
}

function parseJson(value, label) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid JSON for ${label}: ${String(error?.message || error)}`);
  }
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (getBooleanFlag(parsed.flags, 'help') || getBooleanFlag(parsed.flags, 'h')) {
    printJson(usage());
    return 0;
  }

  const actionId = getFlag(parsed.flags, 'action-id');
  const propName = getFlag(parsed.flags, 'prop-name');
  const accountId = getFlag(parsed.flags, 'account-id');

  if (!actionId || !propName || !accountId) {
    printJson(err('action-id, prop-name, and account-id are required'));
    return 2;
  }

  let configuredProps = {};
  try {
    const provided = parseJson(getFlag(parsed.flags, 'configured-props'), 'configured-props');
    configuredProps = provided || {};
  } catch (error) {
    printJson(err('Failed to parse configured-props', { message: error.message }));
    return 2;
  }

  if (!Object.keys(configuredProps).length) {
    configuredProps = { account_id: accountId };
  }

  const config = loadConfig();
  const response = await requestJson(config, {
    method: 'POST',
    path: `/platform/v1/integrations/actions/${actionId}/configure_prop`,
    body: {
      prop_name: propName,
      configured_props: configuredProps,
      dynamic_props_id: getFlag(parsed.flags, 'dynamic-props-id')
    }
  });

  if (!response.ok) {
    printJson(err('Failed to configure prop', response.raw, false, response.status));
    return 2;
  }

  printJson(ok({ result: response.data, project_id: config.projectId }));
  return 0;
}

main().catch((error) => {
  printJson(err('Unhandled error', { message: String(error?.message || error) }));
  process.exit(1);
});
