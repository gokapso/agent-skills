#!/usr/bin/env node
import { loadConfig, requestJson } from './lib/kapso-api.js';
import { ok, err, printJson } from './lib/result.js';
import { parseArgs, getFlag, getBooleanFlag } from './lib/args.js';

function usage() {
  return ok({
    usage: 'node scripts/create-integration.js --action-id <id> --app-slug <slug> --account-id <id> [--configured-props <json>] [--name <text>] [--app-name <text>] [--variable-definitions <json>] [--dynamic-props-id <id>]',
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

function ensureAccountId(props, accountId) {
  if (!props || !Object.keys(props).length) {
    return { account_id: accountId };
  }
  if (!props.account_id && !props.accountId) {
    return { ...props, account_id: accountId };
  }
  return props;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (getBooleanFlag(parsed.flags, 'help') || getBooleanFlag(parsed.flags, 'h')) {
    printJson(usage());
    return 0;
  }

  const actionId = getFlag(parsed.flags, 'action-id');
  const appSlug = getFlag(parsed.flags, 'app-slug');
  const accountId = getFlag(parsed.flags, 'account-id');

  if (!actionId || !appSlug || !accountId) {
    printJson(err('action-id, app-slug, and account-id are required'));
    return 2;
  }

  let configuredProps;
  let variableDefinitions;

  try {
    configuredProps = parseJson(getFlag(parsed.flags, 'configured-props'), 'configured-props');
    variableDefinitions = parseJson(getFlag(parsed.flags, 'variable-definitions'), 'variable-definitions');
  } catch (error) {
    printJson(err('Failed to parse JSON', { message: error.message }));
    return 2;
  }

  configuredProps = ensureAccountId(configuredProps, accountId);

  const payload = {
    action_id: actionId,
    app_slug: appSlug,
    account_id: accountId,
    configured_props: configuredProps
  };

  const name = getFlag(parsed.flags, 'name');
  const appName = getFlag(parsed.flags, 'app-name');
  const dynamicPropsId = getFlag(parsed.flags, 'dynamic-props-id');

  if (name) payload.name = name;
  if (appName) payload.app_name = appName;
  if (dynamicPropsId) payload.dynamic_props_id = dynamicPropsId;
  if (variableDefinitions) payload.variable_definitions = variableDefinitions;

  const config = loadConfig();
  const response = await requestJson(config, {
    method: 'POST',
    path: '/platform/v1/integrations',
    body: payload
  });

  if (!response.ok) {
    printJson(err('Failed to create integration', response.raw, false, response.status));
    return 2;
  }

  printJson(ok({ integration: response.data, project_id: config.projectId }));
  return 0;
}

main().catch((error) => {
  printJson(err('Unhandled error', { message: String(error?.message || error) }));
  process.exit(1);
});
