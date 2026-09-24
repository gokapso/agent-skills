#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { loadConfig, requestJson } from './lib/workflows/kapso-api.js';
import { ok, err, printJson } from './lib/workflows/result.js';
import { parseArgs, getFlag, getBooleanFlag } from './lib/workflows/args.js';

function usage() {
  return ok({
    usage: [
      'node scripts/project-event-definitions.js list',
      'node scripts/project-event-definitions.js create --name <event.name> [--description <text>] [--property-schema <json>|--property-schema-file <path>]',
      'node scripts/project-event-definitions.js update --definition-id <id> [--name <event.name>] [--description <text>] [--property-schema <json>|--property-schema-file <path>]'
    ],
    env: ['KAPSO_API_BASE_URL', 'KAPSO_API_KEY']
  });
}

function readJsonFlag(parsed, flagName, fileFlagName) {
  const inline = getFlag(parsed.flags, flagName);
  const filePath = getFlag(parsed.flags, fileFlagName);
  if (inline && filePath) {
    throw new Error(`Use either --${flagName} or --${fileFlagName}, not both`);
  }
  if (!inline && !filePath) return undefined;

  const raw = inline || readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function definitionPayload(parsed, { requireName = false } = {}) {
  const name = getFlag(parsed.flags, 'name');
  if (requireName && !name) {
    throw new Error('name is required');
  }

  const payload = {};
  if (name) payload.name = name;

  const description = getFlag(parsed.flags, 'description');
  if (description !== undefined) payload.description = description;

  const propertySchema = readJsonFlag(parsed, 'property-schema', 'property-schema-file');
  if (propertySchema !== undefined) payload.property_schema = propertySchema;

  return payload;
}

async function listDefinitions(config) {
  return requestJson(config, {
    method: 'GET',
    path: '/platform/v1/event-definitions'
  });
}

async function createDefinition(config, parsed) {
  return requestJson(config, {
    method: 'POST',
    path: '/platform/v1/event-definitions',
    body: definitionPayload(parsed, { requireName: true })
  });
}

async function updateDefinition(config, parsed) {
  const definitionId = getFlag(parsed.flags, 'definition-id');
  if (!definitionId) throw new Error('definition-id is required');

  return requestJson(config, {
    method: 'PATCH',
    path: `/platform/v1/event-definitions/${definitionId}`,
    body: definitionPayload(parsed)
  });
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (getBooleanFlag(parsed.flags, 'help') || getBooleanFlag(parsed.flags, 'h')) {
    printJson(usage());
    return 0;
  }

  const action = parsed.args[0];
  if (!action) {
    printJson(usage());
    return 2;
  }

  const config = loadConfig();
  let response;
  try {
    if (action === 'list') {
      response = await listDefinitions(config);
    } else if (action === 'create') {
      response = await createDefinition(config, parsed);
    } else if (action === 'update') {
      response = await updateDefinition(config, parsed);
    } else {
      printJson(err(`Invalid action: ${action}. Use list, create, or update`));
      return 2;
    }
  } catch (error) {
    printJson(err('Invalid Project Event definition request', { message: String(error?.message || error) }));
    return 2;
  }

  if (!response.ok) {
    printJson(err(`Failed to ${action} Project Event definitions`, response.raw, false, response.status));
    return 2;
  }

  printJson(ok({ definitions: response.data }));
  return 0;
}

main().catch((error) => {
  printJson(err('Unhandled error', { message: String(error?.message || error) }));
  process.exit(1);
});
