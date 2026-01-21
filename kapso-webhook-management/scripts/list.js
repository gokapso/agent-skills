const { kapsoConfigFromEnv, kapsoRequest } = require('./lib/kapso-api');
const { hasHelpFlag, parseFlags, requireFlag } = require('./lib/args');

function ok(data) {
  return { ok: true, data };
}

function err(message, details) {
  return { ok: false, error: { message, details } };
}

function resolveScope(flags) {
  const raw = flags.scope;
  if (!raw || raw === true) {
    return 'config';
  }
  const scope = String(raw);
  if (scope !== 'config' && scope !== 'project') {
    throw new Error(`Invalid --scope value: ${scope}`);
  }
  return scope;
}

async function main() {
  const argv = process.argv.slice(2);
  if (hasHelpFlag(argv)) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          usage: 'node /agent-skills/kapso-webhook-management/scripts/list.js --phone-number-id <id> [--scope config|project]',
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
    const scope = resolveScope(flags);
    const config = kapsoConfigFromEnv();
    let path = '';
    if (scope === 'project') {
      path = '/whatsapp/webhooks';
    } else {
      const phoneNumberId = requireFlag(flags, 'phone-number-id');
      path = `/whatsapp/phone_numbers/${encodeURIComponent(phoneNumberId)}/webhooks`;
    }

    const data = await kapsoRequest(config, path);

    console.log(JSON.stringify(ok(data), null, 2));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify(err('Command failed', { message }), null, 2));
    return 1;
  }
}

main().then((code) => process.exit(code));
