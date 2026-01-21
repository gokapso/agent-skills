const { kapsoConfigFromEnv, kapsoRequest } = require('./lib/kapso-api');
const { hasHelpFlag, parseFlags, requireFlag, parseJsonObject } = require('./lib/args');
const { resolveFilters, filtersToQuery } = require('./lib/filters');

function ok(data) {
  return { ok: true, data };
}

function err(message, details) {
  return { ok: false, error: { message, details } };
}

async function main() {
  const argv = process.argv.slice(2);
  if (hasHelpFlag(argv)) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          usage:
            'node /agent-skills/kapso-database-management/scripts/upsert-row.js --table <name> --data <json> [--upsert-key <column>] [--filters <json> | --id <row-id>]',
          env: ['KAPSO_API_BASE_URL', 'KAPSO_API_KEY', 'PROJECT_ID']
        },
        null,
        2
      )
    );
    return 0;
  }

  try {
    const flags = parseFlags(argv);
    const table = requireFlag(flags, 'table');
    const dataPayload = parseJsonObject(flags.data, 'data');

    let filters;
    if (typeof flags['upsert-key'] === 'string' && flags['upsert-key'].length > 0) {
      const key = flags['upsert-key'];
      const value = dataPayload[key];
      if (value === undefined) {
        throw new Error(`--data must include ${key} when using --upsert-key`);
      }
      filters = { [key]: `eq.${String(value)}` };
    } else {
      filters = resolveFilters(flags);
    }

    const query = filtersToQuery(filters);
    const config = kapsoConfigFromEnv();
    const data = await kapsoRequest(config, `/db/${encodeURIComponent(table)}${query}`, {
      method: 'PUT',
      body: JSON.stringify(dataPayload)
    });

    console.log(JSON.stringify(ok(data), null, 2));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify(err('Command failed', { message }), null, 2));
    return 1;
  }
}

main().then((code) => process.exit(code));
