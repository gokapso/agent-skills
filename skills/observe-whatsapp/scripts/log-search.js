const { kapsoConfigFromEnv, kapsoRequest } = require('./lib/triage/kapso-api');

function err(message, details) {
  return { ok: false, error: { message, details } };
}

function hasHelpFlag(argv) {
  return argv.includes('--help') || argv.includes('-h');
}

function parseArgs(argv) {
  const flags = {};
  const filters = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;

    const trimmed = arg.slice(2);
    const eqIndex = trimmed.indexOf('=');
    const key = eqIndex >= 0 ? trimmed.slice(0, eqIndex) : trimmed;
    const inlineValue = eqIndex >= 0 ? trimmed.slice(eqIndex + 1) : undefined;
    const next = argv[index + 1];
    const value = inlineValue !== undefined
      ? inlineValue
      : !next || next.startsWith('--')
        ? true
        : next;

    if (inlineValue === undefined && value !== true) index += 1;

    if (key === 'filter') {
      filters.push(value);
      continue;
    }

    flags[key] = value;
  }

  return { flags, filters };
}

function parseBoolean(value) {
  if (value === undefined) return undefined;
  if (value === true) return true;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Invalid boolean value: ${value}`);
}

function parseFilterValue(value) {
  if (/^-?\d+$/.test(value)) return Number.parseInt(value, 10);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

function parseFilters(filters) {
  return filters.map((entry) => {
    if (entry === true) throw new Error('Invalid --filter value. Use --filter key=value.');
    const separatorIndex = String(entry).indexOf('=');
    if (separatorIndex <= 0) {
      throw new Error(`Invalid --filter "${entry}". Use --filter key=value.`);
    }

    const key = String(entry).slice(0, separatorIndex).trim();
    const value = String(entry).slice(separatorIndex + 1).trim();
    if (!key || !value) throw new Error(`Invalid --filter "${entry}". Use --filter key=value.`);

    return { key, value: parseFilterValue(value) };
  });
}

function setParam(params, key, value) {
  if (value === undefined || value === true || value === '') return;
  params.set(key, String(value));
}

function buildGetPath(flags) {
  const params = new URLSearchParams();
  setParam(params, 'query', flags.query);
  setParam(params, 'period', flags.period);
  setParam(params, 'source', flags.source);
  setParam(params, 'problems_only', parseBoolean(flags['problems-only']));
  setParam(params, 'limit', flags.limit);
  setParam(params, 'cursor', flags.cursor);
  setParam(params, 'around', flags.around);
  setParam(params, 'highlight_event_id', flags['highlight-event-id']);
  setParam(params, 'highlight_resource_id', flags['highlight-resource-id']);

  const suffix = params.toString();
  return `/platform/v1/log_search${suffix ? `?${suffix}` : ''}`;
}

function buildPostBody(flags, filters) {
  const body = {};
  if (flags.query !== undefined && flags.query !== true) body.query = flags.query;
  if (flags.period !== undefined && flags.period !== true) body.period = flags.period;
  if (flags.source !== undefined && flags.source !== true) body.source = flags.source;
  if (flags['problems-only'] !== undefined) {
    body.problems_only = parseBoolean(flags['problems-only']);
  }
  if (flags.limit !== undefined && flags.limit !== true) {
    body.limit = Number.parseInt(flags.limit, 10);
  }
  if (flags.cursor !== undefined && flags.cursor !== true) body.cursor = flags.cursor;
  if (flags.around !== undefined && flags.around !== true) body.around = flags.around;
  if (flags['highlight-event-id'] !== undefined && flags['highlight-event-id'] !== true) {
    body.highlight_event_id = flags['highlight-event-id'];
  }
  if (flags['highlight-resource-id'] !== undefined && flags['highlight-resource-id'] !== true) {
    body.highlight_resource_id = flags['highlight-resource-id'];
  }
  if (filters.length > 0) body.filters = parseFilters(filters);
  return body;
}

async function main() {
  const argv = process.argv.slice(2);
  if (hasHelpFlag(argv)) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          usage:
            'node scripts/log-search.js [--query <text>] [--period <24h|7d|context>] [--source <all|external_api_log|whatsapp_webhook_event|flow_event|webhook_delivery>] [--problems-only true|false] [--limit <n>] [--filter <key=value>]... [--cursor <cursor>] [--around <iso8601>] [--highlight-event-id <id>] [--highlight-resource-id <id>] [--catalog true]',
          env: ['KAPSO_API_BASE_URL', 'KAPSO_API_KEY']
        },
        null,
        2
      )
    );
    return 0;
  }

  try {
    const { flags, filters } = parseArgs(argv);
    const config = kapsoConfigFromEnv();

    if (parseBoolean(flags.catalog) === true) {
      const data = await kapsoRequest(config, '/platform/v1/log_search/catalog');
      console.log(JSON.stringify({ ok: true, data }, null, 2));
      return 0;
    }

    if (filters.length > 0) {
      const data = await kapsoRequest(config, '/platform/v1/log_search', {
        method: 'POST',
        body: JSON.stringify(buildPostBody(flags, filters))
      });
      console.log(JSON.stringify({ ok: true, data }, null, 2));
      return 0;
    }

    const data = await kapsoRequest(config, buildGetPath(flags));
    console.log(JSON.stringify({ ok: true, data }, null, 2));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify(err('Command failed', { message }), null, 2));
    return 1;
  }
}

main().then((code) => process.exit(code));
