#!/usr/bin/env node
import { loadConfig, requestJson } from './lib/kapso-api.js';
import { ok, err, printJson } from './lib/result.js';
import { parseArgs, getFlag, getBooleanFlag } from './lib/args.js';

function usage() {
  return ok({
    usage: 'node scripts/list-accounts.js [--app-slug <slug>]',
    env: ['KAPSO_API_BASE_URL', 'KAPSO_API_KEY', 'PROJECT_ID']
  });
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (getBooleanFlag(parsed.flags, 'help') || getBooleanFlag(parsed.flags, 'h')) {
    printJson(usage());
    return 0;
  }

  const config = loadConfig();
  const response = await requestJson(config, {
    method: 'GET',
    path: '/platform/v1/integrations/accounts',
    query: {
      app_slug: getFlag(parsed.flags, 'app-slug')
    }
  });

  if (!response.ok) {
    printJson(err('Failed to list accounts', response.raw, false, response.status));
    return 2;
  }

  printJson(ok({ accounts: response.data, project_id: config.projectId }));
  return 0;
}

main().catch((error) => {
  printJson(err('Unhandled error', { message: String(error?.message || error) }));
  process.exit(1);
});
