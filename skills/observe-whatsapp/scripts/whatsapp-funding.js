const { hasHelpFlag, parseFlags } = require('./lib/status/args');
const { kapsoConfigFromEnv, kapsoRequest } = require('./lib/status/kapso-api');

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
            'node scripts/whatsapp-funding.js (--waba-id <meta-waba-id> | --portfolio-id <meta-portfolio-id>) [--start-time <iso8601> --end-time <iso8601>] [--limit <n>]',
          notes: [
            'IDs are Meta WABA and Business Portfolio IDs, not Kapso UUIDs.',
            'Usage requires both --start-time and --end-time, at most 31 days apart.'
          ],
          env: ['KAPSO_API_BASE_URL', 'KAPSO_API_KEY']
        },
        null,
        2
      )
    );
    return 0;
  }

  try {
    const flags = parseFlags(argv);
    const wabaId = stringFlag(flags['waba-id'], 'waba-id');
    const portfolioId = stringFlag(flags['portfolio-id'], 'portfolio-id');
    if (!wabaId && !portfolioId) {
      throw new Error('Pass --waba-id or --portfolio-id');
    }
    if (wabaId && portfolioId) {
      throw new Error('Pass only one of --waba-id or --portfolio-id');
    }

    const startTime = stringFlag(flags['start-time'], 'start-time');
    const endTime = stringFlag(flags['end-time'], 'end-time');
    if (Boolean(startTime) !== Boolean(endTime)) {
      throw new Error('Pass both --start-time and --end-time to request usage');
    }

    const config = kapsoConfigFromEnv();
    const payload = { ok: true };

    if (wabaId) {
      const funding = await kapsoRequest(
        config,
        `/platform/v1/whatsapp/accounts/${encodeURIComponent(wabaId)}/funding`
      );
      payload.funding = funding.data || null;
    } else {
      const limit = flags.limit === undefined ? 20 : Number(flags.limit);
      if (!Number.isFinite(limit) || limit <= 0) {
        throw new Error(`Invalid --limit value: ${flags.limit}`);
      }
      const accounts = await kapsoRequest(
        config,
        `/platform/v1/whatsapp/portfolios/${encodeURIComponent(portfolioId)}/accounts?limit=${limit}`
      );
      payload.accounts = accounts.data || [];
      payload.paging = accounts.paging || null;
    }

    if (startTime) {
      const base = wabaId
        ? `/platform/v1/whatsapp/accounts/${encodeURIComponent(wabaId)}/usage`
        : `/platform/v1/whatsapp/portfolios/${encodeURIComponent(portfolioId)}/usage`;
      const usage = await kapsoRequest(
        config,
        `${base}?start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(endTime)}`
      );
      payload.usage = usage.data || null;
    }

    payload.notes = [
      'Funding status uses stored evidence; it does not call Meta.',
      'Usage amounts are integer micro-USD (1000000 = USD 1) for charges Kapso recorded.',
      'A zero total means zero recorded charges, not zero spend.'
    ];

    console.log(JSON.stringify(payload, null, 2));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify(err('Command failed', { message }), null, 2));
    return 1;
  }
}

function stringFlag(value, name) {
  if (value === undefined) return null;
  if (value === true || value === '') {
    throw new Error(`Invalid --${name} value`);
  }
  return String(value);
}

main().then((code) => process.exit(code));
